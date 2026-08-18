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
  booking: LiveBookingRow;
  items: LiveBookingItemRow[];
}

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
  const candidates = [service?.businessId, payload.salonId, payload.businessId];
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
  const booking = mapRow(payload.booking);
  const items = Array.isArray(payload.items) ? payload.items.map(mapItem) : [];
  if (items.length === 0 || items.some((item) => item.booking_id !== booking.id)) {
    throw new SupabaseBookingError('database', 'The database did not return the booking service relationship.');
  }
  return { booking, items };
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
  return 'Customer';
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
  const safe = /log in|salon is not available|select between|valid future|services are inactive|belong to another salon/i.test(message);
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

export async function createSupabaseBookingWithClient(
  client: SupabaseClient,
  user: User,
  input: CreateSupabaseBookingInput,
): Promise<PaymentRecord> {
  if (!isDatabaseUuid(input.salonId)) {
    throw new SupabaseBookingError('validation', 'This website is not linked to a real salon record.');
  }
  if (!bookingServicesAreDatabaseRows(input.services)) {
    throw new SupabaseBookingError('validation', 'Select a service saved by this salon before booking.');
  }
  const uniqueIds = Array.from(new Set(input.services.map((service) => service.serviceId)));
  if (uniqueIds.length !== input.services.length || uniqueIds.length > 6) {
    throw new SupabaseBookingError('validation', 'Select between one and six unique services.');
  }

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
  if (result.booking.salon_id !== input.salonId || result.booking.customer_user_id !== user.id) {
    throw new SupabaseBookingError('permission', 'The database returned a booking outside this customer or salon.');
  }
  const expectedIds = new Set(uniqueIds);
  if (result.items.length !== expectedIds.size || result.items.some((item) => !expectedIds.has(item.service_id))) {
    throw new SupabaseBookingError('database', 'The database returned different booking services.');
  }

  const record = supabaseBookingToPaymentRecord(
    result.booking,
    result.items,
    input.themeId,
    user,
    undefined,
    input.customer,
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SUPABASE_BOOKING_EVENT));
  return record;
}

export async function createSupabaseBooking(input: CreateSupabaseBookingInput): Promise<PaymentRecord> {
  const user = await authenticatedUser();
  return createSupabaseBookingWithClient(requireSupabase(), user, input);
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

export async function readMySupabaseBookingsWithClient(
  client: SupabaseClient,
  user: User,
  salonId: string,
  themeId: SiteHeaderThemeId,
): Promise<PaymentRecord[]> {
  if (!isDatabaseUuid(salonId)) return [];

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
    return supabaseBookingToPaymentRecord(booking, items, themeId, user, contact);
  });
}

export async function readMySupabaseBookings(
  salonId: string,
  themeId: SiteHeaderThemeId,
): Promise<PaymentRecord[]> {
  const user = await authenticatedUser();
  return readMySupabaseBookingsWithClient(requireSupabase(), user, salonId, themeId);
}
