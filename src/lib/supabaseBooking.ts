import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { SalonData, Service } from '../types';
import type { SiteHeaderThemeId } from './siteNavigation';
import { requireSupabase } from './supabaseClient';
import { readAuthenticatedSession } from './useAuth';
import { localDateKey, minutesSinceMidnight } from './salonStatus';
import type {
  BookingCustomerSnapshot,
  BookingStatus,
  PaymentRecord,
  PaymentServiceLine,
} from './siteBookingPayment';

/** Browser event emitted only after a database booking write/read succeeds. */
export const SUPABASE_BOOKING_EVENT = 'nexora:supabase-booking';

export type SupabaseBookingErrorKind =
  | 'configuration'
  | 'not-authenticated'
  | 'network'
  | 'permission'
  | 'validation'
  | 'database';

export class SupabaseBookingError extends Error {
  constructor(
    public readonly kind: SupabaseBookingErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'SupabaseBookingError';
  }
}

export interface SupabaseBookingServiceInput {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
}

export interface CreateSupabaseBookingInput {
  salonId: string;
  themeId: SiteHeaderThemeId;
  services: SupabaseBookingServiceInput[];
  dateKey: string;
  startMinutes: number;
  customer: BookingCustomerSnapshot;
}

export interface SupabaseBookingCatalog {
  salonId: string;
  themeId: SiteHeaderThemeId;
  services: Service[];
}

export interface SupabaseCustomerDetails {
  userId: string;
  name: string;
  mobile: string;
  email: string;
  emailReadOnly: boolean;
}

interface LiveBookingItemRow {
  id: string;
  booking_id: string;
  service_id: string;
  quantity: number;
  unit_price_paise: number | string;
  line_total_paise: number | string;
  service_name_snapshot: string;
  duration_minutes_snapshot: number | string;
}

interface LiveBookingRow {
  id: string;
  salon_id: string;
  customer_user_id: string;
  staff_id: string | null;
  booking_number: string | null;
  appointment_start: string;
  appointment_end: string;
  status: string;
  total_paise: number | string;
  currency: string;
  customer_note: string | null;
  source?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  booking_items?: LiveBookingItemRow[] | null;
}

interface CreateBookingResponse {
  templateKey: SiteHeaderThemeId;
  booking: LiveBookingRow;
  items: LiveBookingItemRow[];
}

interface LiveCatalogServiceRow {
  id: string;
  salon_id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  name: string;
  description: string;
  price_paise: number | string;
  duration_minutes: number | string;
}

interface LiveCatalogResponse {
  salonId: string;
  templateKey: SiteHeaderThemeId;
  services: LiveCatalogServiceRow[];
}

const BOOKING_TEMPLATE_KEYS: SiteHeaderThemeId[] = [
  'barber_mens_grooming',
  'hair_studio_color_bar',
  'beauty_skin_spa',
  'family_full_service',
  'nail_lash_studio',
];

const LIVE_BOOKING_COLUMNS = [
  'id',
  'salon_id',
  'customer_user_id',
  'staff_id',
  'booking_number',
  'appointment_start',
  'appointment_end',
  'status',
  'total_paise',
  'currency',
  'customer_note',
  'source',
  'created_by',
  'created_at',
  'updated_at',
].join(',');

const LIVE_ITEM_COLUMNS = [
  'id',
  'booking_id',
  'service_id',
  'quantity',
  'unit_price_paise',
  'line_total_paise',
  'service_name_snapshot',
  'duration_minutes_snapshot',
].join(',');

export function isDatabaseUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Existing app data may carry the live salon id as the saved service tenant or
 * on the salon payload. It remains only a candidate: the database RPC verifies
 * that every selected service belongs to this active salon before inserting.
 */
export function bookingSalonIdCandidate(
  data: SalonData,
  service: Pick<Service, 'businessId'> | null | undefined,
): string | null {
  const payload = data as SalonData & { salonId?: unknown; businessId?: unknown };
  const serviceSalonIds = (data.services || []).map((item) => item.businessId);
  const candidates = [service?.businessId, ...serviceSalonIds, payload.salonId, payload.businessId];
  return candidates.find(isDatabaseUuid) ?? null;
}

export function bookingServicesAreDatabaseRows(
  services: readonly Pick<SupabaseBookingServiceInput, 'serviceId'>[],
): boolean {
  return services.length > 0 && services.every((service) => isDatabaseUuid(service.serviceId));
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SupabaseBookingError('database', `The database returned an invalid ${label}.`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new SupabaseBookingError('database', `The database returned an invalid ${label}.`);
  }
  return value;
}

function asNumber(value: unknown, label: string): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new SupabaseBookingError('database', `The database returned an invalid ${label}.`);
  }
  return number;
}

function asBookingTemplateKey(value: unknown): SiteHeaderThemeId {
  const key = asString(value, 'booking template');
  if (!BOOKING_TEMPLATE_KEYS.includes(key as SiteHeaderThemeId)) {
    throw new SupabaseBookingError('database', 'The database returned an unsupported booking template.');
  }
  return key as SiteHeaderThemeId;
}

function mapCatalogService(value: unknown): LiveCatalogServiceRow {
  const row = asRecord(value, 'catalog service');
  const price = asNumber(row.price_paise, 'catalog service price');
  const duration = asNumber(row.duration_minutes, 'catalog service duration');
  if (price < 0 || duration < 1) {
    throw new SupabaseBookingError('database', 'The database returned an invalid service price or duration.');
  }
  return {
    id: asString(row.id, 'catalog service id'),
    salon_id: asString(row.salon_id, 'catalog service salon id'),
    category_id: asString(row.category_id, 'catalog service category id'),
    category_name: asString(row.category_name, 'catalog service category name'),
    category_slug: asString(row.category_slug, 'catalog service category slug'),
    name: asString(row.name, 'catalog service name'),
    description: typeof row.description === 'string' ? row.description : '',
    price_paise: price,
    duration_minutes: duration,
  };
}

function parseCatalogResponse(value: unknown): LiveCatalogResponse {
  const payload = asRecord(value, 'service catalog');
  const salonId = asString(payload.salon_id, 'service catalog salon id');
  const templateKey = asBookingTemplateKey(payload.template_key);
  const services = Array.isArray(payload.services) ? payload.services.map(mapCatalogService) : [];
  if (services.some((service) => service.salon_id !== salonId)) {
    throw new SupabaseBookingError('permission', 'The database returned a service from another salon.');
  }
  return { salonId, templateKey, services };
}

function mapItem(value: unknown): LiveBookingItemRow {
  const item = asRecord(value, 'booking item');
  return {
    id: asString(item.id, 'booking item id'),
    booking_id: asString(item.booking_id, 'booking item booking id'),
    service_id: asString(item.service_id, 'booking item service id'),
    quantity: asNumber(item.quantity, 'booking item quantity'),
    unit_price_paise: asNumber(item.unit_price_paise, 'booking item unit price'),
    line_total_paise: asNumber(item.line_total_paise, 'booking item total'),
    service_name_snapshot: asString(item.service_name_snapshot, 'booking item service name'),
    duration_minutes_snapshot: asNumber(item.duration_minutes_snapshot, 'booking item duration'),
  };
}

function mapRow(value: unknown): LiveBookingRow {
  const row = asRecord(value, 'booking');
  return {
    id: asString(row.id, 'booking id'),
    salon_id: asString(row.salon_id, 'booking salon id'),
    customer_user_id: asString(row.customer_user_id, 'booking customer id'),
    staff_id: typeof row.staff_id === 'string' ? row.staff_id : null,
    booking_number: typeof row.booking_number === 'string' && row.booking_number.trim()
      ? row.booking_number
      : null,
    appointment_start: asString(row.appointment_start, 'booking start'),
    appointment_end: asString(row.appointment_end, 'booking end'),
    status: asString(row.status, 'booking status'),
    total_paise: asNumber(row.total_paise, 'booking total'),
    currency: asString(row.currency, 'booking currency'),
    customer_note: typeof row.customer_note === 'string' ? row.customer_note : null,
    source: typeof row.source === 'string' ? row.source : null,
    created_by: typeof row.created_by === 'string' ? row.created_by : null,
    created_at: asString(row.created_at, 'booking created time'),
    updated_at: asString(row.updated_at, 'booking updated time'),
    booking_items: Array.isArray(row.booking_items) ? row.booking_items.map(mapItem) : null,
  };
}

function parseCreateResponse(value: unknown): CreateBookingResponse {
  const payload = asRecord(value, 'booking response');
  const templateKey = asBookingTemplateKey(payload.template_key);
  const booking = mapRow(payload.booking);
  const items = Array.isArray(payload.items) ? payload.items.map(mapItem) : [];
  if (items.length === 0 || items.some((item) => item.booking_id !== booking.id)) {
    throw new SupabaseBookingError('database', 'The database did not return the booking service relationship.');
  }
  return { templateKey, booking, items };
}

function mapStatus(status: string): BookingStatus {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'upcoming':
    case 'in_progress':
      return 'confirmed';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'failed':
    case 'expired':
      return 'failed';
    default:
      return 'pending_payment';
  }
}

function userDisplayName(user: User): string {
  const metadata = user.user_metadata || {};
  for (const value of [metadata.full_name, metadata.name, metadata.display_name]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  // No invented customer name: the authenticated customer enters a missing
  // profile name in the existing validated details step.
  return '';
}

function customerFromUser(
  user: User,
  contact?: { phone?: string | null; email?: string | null },
  immediate?: BookingCustomerSnapshot,
): BookingCustomerSnapshot {
  return {
    name: immediate?.name?.trim() || userDisplayName(user),
    mobile: immediate?.mobile?.trim() || contact?.phone || user.phone || '',
    email: user.email || contact?.email || immediate?.email || '',
    notes: immediate?.notes || '',
  };
}

function timeParts(value: string): { dateKey: string; minutes: number } {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new SupabaseBookingError('database', 'The database returned an invalid appointment time.');
  }
  return { dateKey: localDateKey(date), minutes: minutesSinceMidnight(date) };
}

export function supabaseBookingToPaymentRecord(
  booking: LiveBookingRow,
  items: LiveBookingItemRow[],
  themeId: SiteHeaderThemeId,
  user: User,
  contact?: { phone?: string | null; email?: string | null },
  immediateCustomer?: BookingCustomerSnapshot,
): PaymentRecord {
  if (booking.customer_user_id !== user.id) {
    throw new SupabaseBookingError('permission', 'The database returned another customer’s booking.');
  }
  if (items.length === 0 || items.some((item) => item.booking_id !== booking.id)) {
    throw new SupabaseBookingError('database', 'The booking has no valid service relationship.');
  }
  const start = timeParts(booking.appointment_start);
  const end = timeParts(booking.appointment_end);
  const serviceLines: PaymentServiceLine[] = items.map((item) => ({
    serviceId: item.service_id,
    serviceName: item.service_name_snapshot,
    price: asNumber(item.line_total_paise, 'line total') / 100,
    durationMinutes: asNumber(item.duration_minutes_snapshot, 'line duration'),
  }));
  const total = asNumber(booking.total_paise, 'booking total') / 100;
  const createdAt = new Date(booking.created_at).getTime();
  const updatedAt = new Date(booking.updated_at).getTime();
  const reference = booking.booking_number || booking.id;

  return {
    id: booking.id,
    idempotencyKey: `supabase:${booking.id}`,
    businessId: booking.salon_id,
    themeId,
    customerId: user.id,
    bookingId: reference,
    serviceId: serviceLines[0].serviceId,
    serviceName: serviceLines[0].serviceName,
    services: serviceLines,
    dateKey: start.dateKey,
    startMinutes: start.minutes,
    endMinutes: end.minutes,
    baseAmount: total,
    amountDue: 0,
    remainingAmount: total,
    currency: booking.currency,
    paymentOption: 'advance',
    paymentMethod: null,
    paymentStatus: 'unpaid',
    bookingStatus: mapStatus(booking.status),
    staffId: booking.staff_id,
    staffName: null,
    customer: customerFromUser(user, contact, immediateCustomer),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    payAtSalon: false,
    persistence: 'supabase',
    databaseStatus: booking.status,
  };
}

function enrichRecordWithCatalog(
  record: PaymentRecord,
  catalog: SupabaseBookingCatalog,
): PaymentRecord {
  const categories = new Map(catalog.services.map((service) => [service.id, service.category]));
  return {
    ...record,
    services: record.services?.map((line) => ({
      ...line,
      category: categories.get(line.serviceId),
    })),
  };
}

function localAppointmentIso(dateKey: string, minutes: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (![year, month, day, minutes].every(Number.isFinite)) {
    throw new SupabaseBookingError('validation', 'Choose a valid appointment date and time.');
  }
  const date = new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
  if (!Number.isFinite(date.getTime())) {
    throw new SupabaseBookingError('validation', 'Choose a valid appointment date and time.');
  }
  return date.toISOString();
}

function safeDatabaseError(error: unknown, fallback: string): SupabaseBookingError {
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate?.code === 'string' ? candidate.code : '';
  const message = typeof candidate?.message === 'string' ? candidate.message : '';
  if (code === '42501' || code === 'PGRST301' || /permission|row-level security/i.test(message)) {
    return new SupabaseBookingError('permission', 'You do not have permission to access this booking.');
  }
  if (/fetch|network|offline|timeout|connection/i.test(message)) {
    return new SupabaseBookingError('network', 'Unable to reach the booking service. Check your connection and try again.');
  }
  const safe = /log in|salon is not available|salon website is not available|select between|valid future|services are inactive|belong to another salon|another active template|valid salon and template/i.test(message);
  return new SupabaseBookingError(safe ? 'validation' : 'database', safe ? message : fallback);
}

async function authenticatedUser(): Promise<User> {
  const auth = await readAuthenticatedSession();
  if (auth.status === 'configuration-error') {
    throw new SupabaseBookingError('configuration', auth.error.message);
  }
  if (auth.status === 'anonymous') {
    throw new SupabaseBookingError('not-authenticated', 'Please log in before booking an appointment.');
  }
  if (auth.status !== 'authenticated') {
    throw new SupabaseBookingError(
      auth.status === 'network-error' ? 'network' : 'not-authenticated',
      auth.error.message,
    );
  }
  return auth.user;
}

function validateAuthenticatedCustomerInput(customer: BookingCustomerSnapshot): void {
  const name = customer.name.trim();
  const phone = customer.mobile.trim();
  const digits = phone.replace(/\D/g, '');
  const email = customer.email.trim();
  if (name.length < 2 || name.length > 100) {
    throw new SupabaseBookingError('validation', 'Enter a valid customer name.');
  }
  if (phone.length > 32 || digits.length < 10 || digits.length > 13) {
    throw new SupabaseBookingError('validation', 'Enter a valid phone number.');
  }
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new SupabaseBookingError('validation', 'Enter a valid email address.');
  }
  if ((customer.notes || '').trim().length > 1000) {
    throw new SupabaseBookingError('validation', 'Booking notes must be 1000 characters or fewer.');
  }
}

async function syncAuthenticatedCustomerName(
  client: SupabaseClient,
  user: User,
  requestedName: string,
): Promise<User> {
  const name = requestedName.trim();
  if (name === userDisplayName(user)) return user;
  const { data, error } = await client.auth.updateUser({
    data: { ...(user.user_metadata || {}), full_name: name },
  });
  if (error || !data.user || data.user.id !== user.id) {
    if (error) console.error('Supabase customer profile update failed:', error);
    throw new SupabaseBookingError('database', 'Customer details could not be updated. Please try again.');
  }
  return data.user;
}

export async function readSupabaseBookingCatalogWithClient(
  client: SupabaseClient,
  salonId: string,
  expectedThemeId: SiteHeaderThemeId,
): Promise<SupabaseBookingCatalog> {
  if (!isDatabaseUuid(salonId)) {
    throw new SupabaseBookingError('validation', 'This website is not linked to a real salon record.');
  }
  const { data, error } = await client.rpc('get_public_salon_service_catalog', {
    p_salon_id: salonId,
    p_template_key: expectedThemeId,
  });
  if (error) {
    console.error('Supabase booking catalog read failed:', error);
    throw safeDatabaseError(error, 'The service catalog could not be loaded. Please try again.');
  }
  const catalog = parseCatalogResponse(data);
  if (catalog.salonId !== salonId || catalog.templateKey !== expectedThemeId) {
    throw new SupabaseBookingError('permission', 'The database returned a catalog outside this salon or template.');
  }
  return {
    salonId: catalog.salonId,
    themeId: catalog.templateKey,
    services: catalog.services.map((service): Service => ({
      id: service.id,
      name: service.name,
      category: service.category_name,
      description: service.description,
      price: asNumber(service.price_paise, 'catalog service price') / 100,
      duration: asNumber(service.duration_minutes, 'catalog service duration'),
      businessId: catalog.salonId,
      themeId: catalog.templateKey,
      themeKey: catalog.templateKey,
      categoryId: service.category_id,
      status: 'active',
    })),
  };
}

export async function readSupabaseBookingCatalog(
  salonId: string,
  expectedThemeId: SiteHeaderThemeId,
): Promise<SupabaseBookingCatalog> {
  return readSupabaseBookingCatalogWithClient(requireSupabase(), salonId, expectedThemeId);
}

export async function createSupabaseBookingWithClient(
  client: SupabaseClient,
  user: User,
  input: CreateSupabaseBookingInput,
): Promise<PaymentRecord> {
  if (!isDatabaseUuid(input.salonId)) {
    throw new SupabaseBookingError('validation', 'This website is not linked to a real salon record.');
  }
  validateAuthenticatedCustomerInput(input.customer);
  if (!bookingServicesAreDatabaseRows(input.services)) {
    throw new SupabaseBookingError('validation', 'Select a service saved by this salon before booking.');
  }
  const uniqueIds = Array.from(new Set(input.services.map((service) => service.serviceId)));
  if (uniqueIds.length !== input.services.length || uniqueIds.length > 6) {
    throw new SupabaseBookingError('validation', 'Select between one and six unique services.');
  }
  const effectiveUser = await syncAuthenticatedCustomerName(client, user, input.customer.name);

  const { data, error } = await client.rpc('create_customer_booking', {
    p_salon_id: input.salonId,
    p_service_ids: uniqueIds,
    p_appointment_start: localAppointmentIso(input.dateKey, input.startMinutes),
    p_customer_note: input.customer.notes?.trim() || null,
    p_phone: input.customer.mobile?.trim() || null,
  });
  if (error) {
    console.error('Supabase booking creation failed:', error);
    throw safeDatabaseError(error, 'The booking could not be saved. Please try again.');
  }

  const result = parseCreateResponse(data);
  if (result.booking.salon_id !== input.salonId || result.booking.customer_user_id !== effectiveUser.id) {
    throw new SupabaseBookingError('permission', 'The database returned a booking outside this customer or salon.');
  }
  const expectedIds = new Set(uniqueIds);
  if (result.items.length !== expectedIds.size || result.items.some((item) => !expectedIds.has(item.service_id))) {
    throw new SupabaseBookingError('database', 'The database returned different booking services.');
  }

  const record = supabaseBookingToPaymentRecord(
    result.booking,
    result.items,
    result.templateKey,
    effectiveUser,
    undefined,
    input.customer,
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SUPABASE_BOOKING_EVENT));
  return record;
}

export async function createSupabaseBooking(input: CreateSupabaseBookingInput): Promise<PaymentRecord> {
  const user = await authenticatedUser();
  const client = requireSupabase();
  const catalog = await readSupabaseBookingCatalogWithClient(client, input.salonId, input.themeId);
  const record = await createSupabaseBookingWithClient(client, user, input);
  return enrichRecordWithCatalog(record, catalog);
}

async function readContact(
  client: SupabaseClient,
  salonId: string,
  userId: string,
): Promise<{ phone?: string | null; email?: string | null }> {
  const { data, error } = await client
    .from('salon_customers')
    .select('email, phone')
    .eq('salon_id', salonId)
    .eq('customer_user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('Supabase customer contact read failed:', error);
    throw safeDatabaseError(error, 'Customer details could not be loaded.');
  }
  const row = data as { email?: unknown; phone?: unknown } | null;
  return {
    email: typeof row?.email === 'string' ? row.email : null,
    phone: typeof row?.phone === 'string' ? row.phone : null,
  };
}

export async function readSupabaseCustomerDetailsWithClient(
  client: SupabaseClient,
  user: User,
  salonId: string,
): Promise<SupabaseCustomerDetails> {
  if (!isDatabaseUuid(salonId)) {
    throw new SupabaseBookingError('validation', 'This website is not linked to a real salon record.');
  }
  const contact = await readContact(client, salonId, user.id);
  return {
    userId: user.id,
    name: userDisplayName(user),
    mobile: contact.phone || user.phone || '',
    // Auth email is authoritative. A salon relationship email is only the
    // fallback for auth providers that do not expose an email on the session.
    email: user.email || contact.email || '',
    emailReadOnly: Boolean(user.email),
  };
}

export async function readSupabaseCustomerDetails(salonId: string): Promise<SupabaseCustomerDetails> {
  const user = await authenticatedUser();
  return readSupabaseCustomerDetailsWithClient(requireSupabase(), user, salonId);
}

export async function readMySupabaseBookingByReferenceWithClient(
  client: SupabaseClient,
  user: User,
  salonId: string,
  themeId: SiteHeaderThemeId,
  reference: string,
): Promise<PaymentRecord | null> {
  if (!isDatabaseUuid(salonId) || !reference.trim()) return null;
  const catalog = await readSupabaseBookingCatalogWithClient(client, salonId, themeId);
  const nested = `${LIVE_BOOKING_COLUMNS},booking_items(${LIVE_ITEM_COLUMNS})`;
  let query = client
    .from('bookings')
    .select(nested)
    .eq('salon_id', salonId)
    .eq('customer_user_id', user.id);
  const referenceIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference);
  query = referenceIsUuid
    ? query.eq('id', reference)
    : query.eq('booking_number', reference.trim());
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Supabase direct booking read failed:', error);
    throw safeDatabaseError(error, 'The booking could not be loaded. Please try again.');
  }
  if (!data) return null;
  const contact = await readContact(client, salonId, user.id);
  const booking = mapRow(data);
  return enrichRecordWithCatalog(
    supabaseBookingToPaymentRecord(booking, booking.booking_items || [], catalog.themeId, user, contact),
    catalog,
  );
}

export async function readMySupabaseBookingByReference(
  salonId: string,
  themeId: SiteHeaderThemeId,
  reference: string,
): Promise<PaymentRecord | null> {
  const user = await authenticatedUser();
  return readMySupabaseBookingByReferenceWithClient(requireSupabase(), user, salonId, themeId, reference);
}

export async function readMySupabaseBookingsWithClient(
  client: SupabaseClient,
  user: User,
  salonId: string,
  themeId: SiteHeaderThemeId,
): Promise<PaymentRecord[]> {
  if (!isDatabaseUuid(salonId)) return [];

  // Resolve the active template from the database rather than stamping history
  // with a caller-provided theme. The catalog RPC validates the expected UI
  // template against the salon's active public website.
  const catalog = await readSupabaseBookingCatalogWithClient(client, salonId, themeId);
  const nested = `${LIVE_BOOKING_COLUMNS},booking_items(${LIVE_ITEM_COLUMNS})`;
  const { data, error } = await client
    .from('bookings')
    .select(nested)
    .eq('salon_id', salonId)
    .eq('customer_user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase customer booking read failed:', error);
    throw safeDatabaseError(error, 'Bookings could not be loaded.');
  }

  const contact = await readContact(client, salonId, user.id);
  return (Array.isArray(data) ? data : []).map((raw) => {
    const booking = mapRow(raw);
    const items = booking.booking_items || [];
    return enrichRecordWithCatalog(
      supabaseBookingToPaymentRecord(booking, items, catalog.themeId, user, contact),
      catalog,
    );
  });
}

export async function readMySupabaseBookings(
  salonId: string,
  themeId: SiteHeaderThemeId,
): Promise<PaymentRecord[]> {
  const user = await authenticatedUser();
  return readMySupabaseBookingsWithClient(requireSupabase(), user, salonId, themeId);
}
