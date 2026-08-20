import type { User } from '@supabase/supabase-js';
import type { SalonData, Service } from '../types';
import type { SiteHeaderThemeId } from './siteNavigation';
import { requireSupabase, type NexoraSupabaseClient } from './supabaseClient';
import { readAuthenticatedSession } from './useAuth';
import type {
  BookingCustomerSnapshot,
  BookingStatus,
  PaymentRecord,
  PaymentServiceLine,
} from './siteBookingPayment';

/** Browser event emitted only after a database booking write/read succeeds. */
export const SUPABASE_BOOKING_EVENT = 'nexora:supabase-booking';
/** URL key carrying only the immutable persisted booking UUID for refresh. */
export const BOOKING_CONFIRMATION_QUERY = 'booking';

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
  templateKey?: BookingTemplateKey;
  services: SupabaseBookingServiceInput[];
  staffId: string;
  appointmentStart: string;
  idempotencyKey: string;
  customer: BookingCustomerSnapshot;
}

export interface SupabaseBookingCatalog {
  salonId: string;
  themeId: SiteHeaderThemeId;
  templateKey: BookingTemplateKey;
  timezone: string;
  services: Service[];
}

export interface SupabaseAvailableSlot {
  appointmentStart: string;
  appointmentEnd: string;
  staffId: string;
  staffName: string;
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
  customer_user_id: string | null;
  salon_customer_id: string;
  staff_id: string | null;
  staff_name_snapshot?: string | null;
  booking_number: string | null;
  appointment_start: string;
  appointment_end: string;
  status: string;
  total_paise: number | string;
  advance_due_paise: number | string;
  final_due_paise: number | string;
  financial_status: string;
  currency: string;
  customer_note: string | null;
  source?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  booking_items?: LiveBookingItemRow[] | null;
}

interface BookingRpcPayload {
  templateKey: BookingTemplateKey;
  timezone: string;
  booking: LiveBookingRow;
  items: LiveBookingItemRow[];
  customer: { name: string; phone: string; email: string };
}

interface LiveCatalogServiceRow {
  id: string;
  salon_id: string;
  category_id: string | null;
  category_name: string;
  category_slug: string;
  name: string;
  description: string;
  price_paise: number | string;
  duration_minutes: number | string;
}

interface LiveCatalogResponse {
  salonId: string;
  templateKey: BookingTemplateKey;
  timezone: string;
  services: LiveCatalogServiceRow[];
}

export type BookingTemplateKey = SiteHeaderThemeId | 'classic';

const BOOKING_TEMPLATE_KEYS: BookingTemplateKey[] = [
  'barber_mens_grooming',
  'hair_studio_color_bar',
  'beauty_skin_spa',
  'family_full_service',
  'nail_lash_studio',
  'classic',
];

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

function asBookingTemplateKey(value: unknown): BookingTemplateKey {
  const key = asString(value, 'booking template');
  if (!BOOKING_TEMPLATE_KEYS.includes(key as BookingTemplateKey)) {
    throw new SupabaseBookingError('database', 'The database returned an unsupported booking template.');
  }
  return key as BookingTemplateKey;
}

/** Maps a live database template to the existing visual renderer contract. */
export function bookingTemplateVisualTheme(value: unknown): SiteHeaderThemeId {
  const key = asBookingTemplateKey(value);
  return key === 'classic' ? 'hair_studio_color_bar' : key;
}

export function bookingTemplateKeyCandidate(
  data: Pick<SalonData, 'bookingTemplateKey'>,
  fallback: SiteHeaderThemeId,
): BookingTemplateKey {
  return data.bookingTemplateKey ? asBookingTemplateKey(data.bookingTemplateKey) : fallback;
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
    category_id: typeof row.category_id === 'string' ? row.category_id : null,
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
  const timezone = asString(payload.timezone, 'salon timezone');
  const services = Array.isArray(payload.services) ? payload.services.map(mapCatalogService) : [];
  if (services.some((service) => service.salon_id !== salonId)) {
    throw new SupabaseBookingError('permission', 'The database returned a service from another salon.');
  }
  return { salonId, templateKey, timezone, services };
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
  const totalPaise = asNumber(row.total_paise, 'booking total');
  // Older test fixtures and cached RPC payloads predate the financial split.
  // Live rows include both columns; the fallback preserves the canonical 25%
  // contract while the next authenticated database read replaces the cache.
  const advanceDuePaise = row.advance_due_paise == null
    ? Math.round(totalPaise * 0.25)
    : asNumber(row.advance_due_paise, 'booking advance');
  return {
    id: asString(row.id, 'booking id'),
    salon_id: asString(row.salon_id, 'booking salon id'),
    customer_user_id: typeof row.customer_user_id === 'string' ? row.customer_user_id : null,
    salon_customer_id: asString(row.salon_customer_id, 'salon customer id'),
    staff_id: typeof row.staff_id === 'string' ? row.staff_id : null,
    staff_name_snapshot: typeof row.staff_name_snapshot === 'string' ? row.staff_name_snapshot : null,
    booking_number: typeof row.booking_number === 'string' && row.booking_number.trim()
      ? row.booking_number
      : null,
    appointment_start: asString(row.appointment_start, 'booking start'),
    appointment_end: asString(row.appointment_end, 'booking end'),
    status: asString(row.status, 'booking status'),
    total_paise: totalPaise,
    advance_due_paise: advanceDuePaise,
    final_due_paise: row.final_due_paise == null
      ? totalPaise - advanceDuePaise
      : asNumber(row.final_due_paise, 'booking remaining amount'),
    financial_status: typeof row.financial_status === 'string' && row.financial_status.trim()
      ? row.financial_status
      : 'advance_due',
    currency: asString(row.currency, 'booking currency'),
    customer_note: typeof row.customer_note === 'string' ? row.customer_note : null,
    source: typeof row.source === 'string' ? row.source : null,
    created_by: typeof row.created_by === 'string' ? row.created_by : null,
    created_at: asString(row.created_at, 'booking created time'),
    updated_at: asString(row.updated_at, 'booking updated time'),
    booking_items: Array.isArray(row.booking_items) ? row.booking_items.map(mapItem) : null,
  };
}

function logCreateBookingDiagnostic(data: unknown, error: unknown): void {
  // Development-only and intentionally metadata-only: never print auth data,
  // customer fields, notes, credentials, or the complete RPC payload.
  if (!import.meta.env?.DEV) return;
  const rpcError = error && typeof error === 'object'
    ? error as { code?: unknown }
    : null;
  console.debug('[booking] create_customer_booking response', {
    hasData: Boolean(data),
    errorCode: typeof rpcError?.code === 'string' ? rpcError.code : null,
    bookingId: typeof data === 'string' && isDatabaseUuid(data) ? data : null,
  });
}

function parseBookingPayload(value: unknown): BookingRpcPayload {
  const payload = asRecord(value, 'booking response');
  const templateKey = asBookingTemplateKey(payload.template_key);
  const timezone = asString(payload.timezone, 'booking timezone');
  const booking = mapRow(payload.booking);
  const items = Array.isArray(payload.items) ? payload.items.map(mapItem) : [];
  const customerRow = asRecord(payload.customer, 'booking customer');
  if (items.length === 0 || items.some((item) => item.booking_id !== booking.id)) {
    throw new SupabaseBookingError('database', 'The database did not return the booking service relationship.');
  }
  return {
    templateKey,
    timezone,
    booking,
    items,
    customer: {
      name: typeof customerRow.name === 'string' ? customerRow.name : '',
      phone: typeof customerRow.phone === 'string' ? customerRow.phone : '',
      email: typeof customerRow.email === 'string' ? customerRow.email : '',
    },
  };
}

function mapStatus(status: string): BookingStatus {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'confirmed';
    case 'checked_in':
      return 'checked_in';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'no_show':
      return 'no_show';
    case 'disputed':
      return 'disputed';
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

function timeParts(value: string, timezone: string): { dateKey: string; minutes: number } {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new SupabaseBookingError('database', 'The database returned an invalid appointment time.');
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || '';
  const hour = Number(part('hour'));
  const minute = Number(part('minute'));
  return {
    dateKey: `${part('year')}-${part('month')}-${part('day')}`,
    minutes: hour * 60 + minute,
  };
}

export function supabaseBookingToPaymentRecord(
  booking: LiveBookingRow,
  items: LiveBookingItemRow[],
  themeId: SiteHeaderThemeId,
  user: User,
  contact?: { phone?: string | null; email?: string | null },
  immediateCustomer?: BookingCustomerSnapshot,
  timezone = 'Asia/Kolkata',
  enforceCustomerOwnership = true,
): PaymentRecord {
  if (enforceCustomerOwnership && booking.customer_user_id !== user.id) {
    throw new SupabaseBookingError('permission', 'The database returned another customer’s booking.');
  }
  if (items.length === 0 || items.some((item) => item.booking_id !== booking.id)) {
    throw new SupabaseBookingError('database', 'The booking has no valid service relationship.');
  }
  const start = timeParts(booking.appointment_start, timezone);
  const end = timeParts(booking.appointment_end, timezone);
  const serviceLines: PaymentServiceLine[] = items.map((item) => ({
    serviceId: item.service_id,
    serviceName: item.service_name_snapshot,
    price: asNumber(item.line_total_paise, 'line total') / 100,
    durationMinutes: asNumber(item.duration_minutes_snapshot, 'line duration'),
  }));
  const total = asNumber(booking.total_paise, 'booking total') / 100;
  const advance = booking.advance_due_paise == null
    ? total * 0.25
    : asNumber(booking.advance_due_paise, 'booking advance') / 100;
  const createdAt = new Date(booking.created_at).getTime();
  const updatedAt = new Date(booking.updated_at).getTime();
  const reference = booking.booking_number || booking.id;

  return {
    id: booking.id,
    idempotencyKey: `supabase:${booking.id}`,
    businessId: booking.salon_id,
    themeId,
    customerId: booking.customer_user_id || booking.salon_customer_id,
    bookingId: reference,
    serviceId: serviceLines[0].serviceId,
    serviceName: serviceLines[0].serviceName,
    services: serviceLines,
    dateKey: start.dateKey,
    startMinutes: start.minutes,
    endMinutes: end.minutes,
    baseAmount: total,
    amountDue: advance,
    remainingAmount: total,
    currency: booking.currency,
    paymentOption: 'advance',
    paymentMethod: null,
    paymentStatus: 'unpaid',
    bookingStatus: mapStatus(booking.status),
    staffId: booking.staff_id,
    staffName: booking.staff_name_snapshot || null,
    customer: customerFromUser(user, contact, immediateCustomer),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    payAtSalon: false,
    persistence: 'supabase',
    databaseStatus: booking.status,
  };
}

interface LiveAdvancePaymentRow {
  booking_id: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  method: string | null;
  amount_paise: number | string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

function withAdvancePayment(record: PaymentRecord, row: LiveAdvancePaymentRow | undefined): PaymentRecord {
  if (!row) return record;
  const paid = row.status === 'captured';
  const paidAmount = paid ? asNumber(row.amount_paise, 'captured payment amount') / 100 : 0;
  const method = row.method === 'card' || row.method === 'upi' || row.method === 'wallet'
    ? row.method
    : row.method ? 'wallet' : null;
  return {
    ...record,
    paymentMethod: method,
    paymentStatus: paid ? 'paid'
      : row.status === 'failed' ? 'failed'
        : row.status === 'created' || row.status === 'pending' || row.status === 'authorized' ? 'pending'
          : record.paymentStatus,
    remainingAmount: Math.max(0, record.baseAmount - paidAmount),
    gatewayRef: paid ? row.provider_payment_id || undefined : row.provider_order_id || undefined,
    updatedAt: row.paid_at ? new Date(row.paid_at).getTime() : record.updatedAt,
  };
}

async function hydrateAdvancePayments(
  client: NexoraSupabaseClient,
  records: PaymentRecord[],
): Promise<PaymentRecord[]> {
  if (records.length === 0) return records;
  const { data, error } = await client
    .from('payments')
    .select('booking_id,provider_order_id,provider_payment_id,method,amount_paise,status,paid_at,created_at')
    .in('booking_id', records.map((record) => record.id))
    .eq('payment_stage', 'advance')
    .order('created_at', { ascending: false });
  if (error) throw safeDatabaseError(error, 'Payment status could not be loaded.');
  const latest = new Map<string, LiveAdvancePaymentRow>();
  for (const raw of (data || []) as LiveAdvancePaymentRow[]) {
    if (!latest.has(raw.booking_id)) latest.set(raw.booking_id, raw);
  }
  return records.map((record) => withAdvancePayment(record, latest.get(record.id)));
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

async function syncAuthenticatedCustomerProfile(
  client: NexoraSupabaseClient,
  user: User,
  customer: BookingCustomerSnapshot,
): Promise<User> {
  const { error } = await client
    .from('profiles')
    .update({ full_name: customer.name.trim(), phone: customer.mobile.trim() })
    .eq('id', user.id);
  if (error) {
    if (error) console.error('Supabase customer profile update failed:', error);
    throw new SupabaseBookingError('database', 'Customer details could not be updated. Please try again.');
  }
  return user;
}

export async function readSupabaseBookingCatalogWithClient(
  client: NexoraSupabaseClient,
  salonId: string,
  expectedThemeId: SiteHeaderThemeId,
  expectedTemplateKey: BookingTemplateKey = expectedThemeId,
): Promise<SupabaseBookingCatalog> {
  if (!isDatabaseUuid(salonId)) {
    throw new SupabaseBookingError('validation', 'This website is not linked to a real salon record.');
  }
  const { data, error } = await client.rpc('get_public_salon_service_catalog', {
    p_salon_id: salonId,
    p_template_key: expectedTemplateKey,
  });
  if (error) {
    console.error('Supabase booking catalog read failed:', error);
    throw safeDatabaseError(error, 'The service catalog could not be loaded. Please try again.');
  }
  const catalog = parseCatalogResponse(data);
  if (catalog.salonId !== salonId || catalog.templateKey !== expectedTemplateKey) {
    throw new SupabaseBookingError('permission', 'The database returned a catalog outside this salon or template.');
  }
  return {
    salonId: catalog.salonId,
    themeId: expectedThemeId,
    templateKey: catalog.templateKey,
    timezone: catalog.timezone,
    services: catalog.services.map((service): Service => ({
      id: service.id,
      name: service.name,
      category: service.category_name,
      description: service.description,
      price: asNumber(service.price_paise, 'catalog service price') / 100,
      duration: asNumber(service.duration_minutes, 'catalog service duration'),
      businessId: catalog.salonId,
      themeId: expectedThemeId,
      themeKey: catalog.templateKey,
      categoryId: service.category_id || undefined,
      status: 'active',
    })),
  };
}

export async function readSupabaseBookingCatalog(
  salonId: string,
  expectedThemeId: SiteHeaderThemeId,
  expectedTemplateKey: BookingTemplateKey = expectedThemeId,
): Promise<SupabaseBookingCatalog> {
  return readSupabaseBookingCatalogWithClient(requireSupabase(), salonId, expectedThemeId, expectedTemplateKey);
}

export async function createSupabaseBookingWithClient(
  client: NexoraSupabaseClient,
  user: User,
  input: CreateSupabaseBookingInput,
): Promise<PaymentRecord> {
  if (!isDatabaseUuid(input.salonId)) {
    throw new SupabaseBookingError('validation', 'This website is not linked to a real salon record.');
  }
  if (!isDatabaseUuid(input.staffId)) {
    throw new SupabaseBookingError('validation', 'Choose a staff-backed live availability slot.');
  }
  if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 128) {
    throw new SupabaseBookingError('validation', 'The booking request identifier is invalid.');
  }
  const appointment = new Date(input.appointmentStart);
  if (!Number.isFinite(appointment.getTime())) {
    throw new SupabaseBookingError('validation', 'Choose a valid live appointment slot.');
  }
  validateAuthenticatedCustomerInput(input.customer);
  if (!bookingServicesAreDatabaseRows(input.services)) {
    throw new SupabaseBookingError('validation', 'Select a service saved by this salon before booking.');
  }
  const uniqueIds = Array.from(new Set(input.services.map((service) => service.serviceId)));
  if (uniqueIds.length !== input.services.length || uniqueIds.length > 6) {
    throw new SupabaseBookingError('validation', 'Select between one and six unique services.');
  }
  const effectiveUser = await syncAuthenticatedCustomerProfile(client, user, input.customer);

  const { data, error } = await client.rpc('create_customer_booking', {
    p_salon_id: input.salonId,
    p_service_ids: uniqueIds,
    p_staff_id: input.staffId,
    p_appointment_start: input.appointmentStart,
    p_customer_note: input.customer.notes?.trim() || null,
    p_idempotency_key: input.idempotencyKey,
  });
  logCreateBookingDiagnostic(data, error);
  if (error) {
    console.error('Supabase booking creation failed:', error);
    throw safeDatabaseError(error, 'The booking could not be saved. Please try again.');
  }

  if (!isDatabaseUuid(data)) {
    throw new SupabaseBookingError('database', 'The database did not return the persisted booking identifier.');
  }
  const record = await readMySupabaseBookingByReferenceWithClient(
    client, effectiveUser, input.salonId, input.themeId, data, input.templateKey ?? input.themeId,
  );
  if (!record || record.id !== data) {
    throw new SupabaseBookingError('database', 'The booking was saved but could not be reloaded.');
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SUPABASE_BOOKING_EVENT));
  return (await hydrateAdvancePayments(client, [record]))[0] || null;
}

export async function createSupabaseBooking(input: CreateSupabaseBookingInput): Promise<PaymentRecord> {
  const user = await authenticatedUser();
  const client = requireSupabase();
  await readSupabaseBookingCatalogWithClient(client, input.salonId, input.themeId, input.templateKey ?? input.themeId);
  return createSupabaseBookingWithClient(client, user, input);
}

async function readContact(
  client: NexoraSupabaseClient,
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
  client: NexoraSupabaseClient,
  user: User,
  salonId: string,
): Promise<SupabaseCustomerDetails> {
  if (!isDatabaseUuid(salonId)) {
    throw new SupabaseBookingError('validation', 'This website is not linked to a real salon record.');
  }
  const contact = await readContact(client, salonId, user.id);
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('full_name,phone')
    .eq('id', user.id)
    .single();
  if (profileError) {
    throw safeDatabaseError(profileError, 'Customer profile could not be loaded.');
  }
  return {
    userId: user.id,
    name: profile.full_name,
    mobile: contact.phone || profile.phone || user.phone || '',
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
  client: NexoraSupabaseClient,
  user: User,
  salonId: string,
  themeId: SiteHeaderThemeId,
  reference: string,
  templateKey: BookingTemplateKey = themeId,
): Promise<PaymentRecord | null> {
  if (!isDatabaseUuid(salonId) || !reference.trim()) return null;
  const catalog = await readSupabaseBookingCatalogWithClient(client, salonId, themeId, templateKey);
  const referenceIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference);
  const { data, error } = await client.rpc('get_customer_bookings', {
    p_salon_id: salonId,
    p_booking_id: referenceIsUuid ? reference : undefined,
  });
  if (error) {
    console.error('Supabase customer booking RPC failed:', error);
    throw safeDatabaseError(error, 'The booking could not be loaded. Please try again.');
  }
  const payloads = (Array.isArray(data) ? data : []).map(parseBookingPayload);
  const payload = payloads.find((item) => referenceIsUuid
    ? item.booking.id === reference
    : item.booking.booking_number === reference.trim());
  if (!payload) return null;
  const record = enrichRecordWithCatalog(
    supabaseBookingToPaymentRecord(
      payload.booking,
      payload.items,
      bookingTemplateVisualTheme(payload.templateKey),
      user,
      { phone: payload.customer.phone, email: payload.customer.email },
      { ...payload.customer, mobile: payload.customer.phone, notes: payload.booking.customer_note || '' },
      payload.timezone,
    ),
    catalog,
  );
  return record;
}

export async function readMySupabaseBookingByReference(
  salonId: string,
  themeId: SiteHeaderThemeId,
  reference: string,
  templateKey: BookingTemplateKey = themeId,
): Promise<PaymentRecord | null> {
  const user = await authenticatedUser();
  return readMySupabaseBookingByReferenceWithClient(requireSupabase(), user, salonId, themeId, reference, templateKey);
}

export async function readMySupabaseBookingsWithClient(
  client: NexoraSupabaseClient,
  user: User,
  salonId: string,
  themeId: SiteHeaderThemeId,
  templateKey: BookingTemplateKey = themeId,
): Promise<PaymentRecord[]> {
  if (!isDatabaseUuid(salonId)) return [];

  const catalog = await readSupabaseBookingCatalogWithClient(client, salonId, themeId, templateKey);
  const { data, error } = await client.rpc('get_customer_bookings', {
    p_salon_id: salonId,
    p_booking_id: undefined,
  });
  if (error) {
    console.error('Supabase customer booking read failed:', error);
    throw safeDatabaseError(error, 'Bookings could not be loaded.');
  }

  const records = (Array.isArray(data) ? data : []).map((raw) => {
    const payload = parseBookingPayload(raw);
    return enrichRecordWithCatalog(
      supabaseBookingToPaymentRecord(
        payload.booking,
        payload.items,
        bookingTemplateVisualTheme(payload.templateKey),
        user,
        { phone: payload.customer.phone, email: payload.customer.email },
        { ...payload.customer, mobile: payload.customer.phone, notes: payload.booking.customer_note || '' },
        payload.timezone,
      ),
      catalog,
    );
  });
  return hydrateAdvancePayments(client, records);
}

export async function readMySupabaseBookings(
  salonId: string,
  themeId: SiteHeaderThemeId,
  templateKey: BookingTemplateKey = themeId,
): Promise<PaymentRecord[]> {
  const user = await authenticatedUser();
  return readMySupabaseBookingsWithClient(requireSupabase(), user, salonId, themeId, templateKey);
}

export async function readSupabaseAvailableSlots(
  salonId: string,
  serviceIds: string[],
  dateKey: string,
): Promise<SupabaseAvailableSlot[]> {
  if (!isDatabaseUuid(salonId) || serviceIds.length === 0 || serviceIds.some((id) => !isDatabaseUuid(id))) {
    throw new SupabaseBookingError('validation', 'A live salon and saved services are required for availability.');
  }
  const { data, error } = await requireSupabase().rpc('marketplace_slots', {
    p_salon_id: salonId,
    p_service_ids: serviceIds,
    p_date: dateKey,
  });
  if (error) throw safeDatabaseError(error, 'Live availability could not be loaded.');
  return (Array.isArray(data) ? data : []).map((row) => ({
    appointmentStart: asString(row.slot_start, 'slot start'),
    appointmentEnd: asString(row.slot_end, 'slot end'),
    staffId: asString(row.staff_id, 'slot staff'),
    staffName: asString(row.staff_name, 'slot staff name'),
  }));
}
