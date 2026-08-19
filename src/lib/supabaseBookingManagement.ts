import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { BookingStatus, PaymentRecord } from './siteBookingPayment';
import type { SiteHeaderThemeId } from './siteNavigation';
import { requireSupabase } from './supabaseClient';
import { readAuthenticatedSession } from './useAuth';
import {
  SUPABASE_BOOKING_EVENT,
  SupabaseBookingError,
  supabaseBookingToPaymentRecord,
} from './supabaseBooking';

const OWNER_STATUSES: BookingStatus[] = ['pending_payment', 'confirmed', 'completed', 'cancelled'];
const MUTABLE_TARGETS: BookingStatus[] = ['confirmed', 'completed', 'cancelled'];

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SupabaseBookingError('database', `The database returned an invalid ${label}.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new SupabaseBookingError('database', `The database returned an invalid ${label}.`);
  }
  return value;
}

function theme(value: unknown): SiteHeaderThemeId {
  const key = text(value, 'booking template') as SiteHeaderThemeId;
  if (![
    'barber_mens_grooming', 'hair_studio_color_bar', 'beauty_skin_spa',
    'family_full_service', 'nail_lash_studio',
  ].includes(key)) throw new SupabaseBookingError('database', 'The booking template is invalid.');
  return key;
}

function mapOwnerPayload(value: unknown): PaymentRecord {
  const payload = object(value, 'owner booking');
  const booking = object(payload.booking, 'booking row');
  const customer = object(payload.customer, 'booking customer');
  const customerId = text(booking.customer_user_id, 'booking customer id');
  const items = Array.isArray(payload.items) ? payload.items : [];
  const ownerSafeCustomer = {
    name: typeof customer.name === 'string' ? customer.name : 'Customer',
    mobile: typeof customer.phone === 'string' ? customer.phone : '',
    email: typeof customer.email === 'string' ? customer.email : '',
    notes: typeof booking.customer_note === 'string' ? booking.customer_note : '',
  };
  // Reuse the single live-row mapper. The synthetic User contains only the
  // customer id needed by its cross-customer guard; owner-visible contact data
  // comes solely from the server-authorized RPC payload.
  return supabaseBookingToPaymentRecord(
    booking as never,
    items as never,
    theme(payload.template_key),
    { id: customerId, user_metadata: {} } as User,
    { phone: ownerSafeCustomer.mobile, email: ownerSafeCustomer.email },
    ownerSafeCustomer,
  );
}

function safeOwnerError(error: unknown): SupabaseBookingError {
  const source = error as { code?: unknown; message?: unknown };
  const message = typeof source?.message === 'string' ? source.message : '';
  if (/not found|permission denied/i.test(message)) {
    return new SupabaseBookingError('permission', 'Booking not found or permission denied.');
  }
  if (/status changed|already has/i.test(message)) {
    return new SupabaseBookingError('validation', message);
  }
  if (/invalid booking status transition/i.test(message)) {
    return new SupabaseBookingError('validation', 'Invalid booking status transition.');
  }
  return new SupabaseBookingError('database', 'The booking status could not be updated.');
}

export function ownerSupabaseAllowedTransitions(status: BookingStatus): BookingStatus[] {
  if (status === 'pending_payment') return ['confirmed', 'cancelled'];
  if (status === 'confirmed' || status === 'pay_at_salon') return ['completed', 'cancelled'];
  return [];
}

export async function readOwnerSupabaseBookingsWithClient(client: SupabaseClient): Promise<PaymentRecord[]> {
  const { data, error } = await client.rpc('get_owner_bookings');
  if (error) throw safeOwnerError(error);
  if (!Array.isArray(data)) throw new SupabaseBookingError('database', 'The owner booking list is invalid.');
  return data.map(mapOwnerPayload);
}

export async function readOwnerSupabaseBookings(): Promise<PaymentRecord[]> {
  const auth = await readAuthenticatedSession();
  if (auth.status !== 'authenticated') {
    throw new SupabaseBookingError('not-authenticated', 'Please log in with your owner account.');
  }
  return readOwnerSupabaseBookingsWithClient(requireSupabase());
}

export async function updateOwnerSupabaseBookingStatusWithClient(
  client: SupabaseClient,
  record: Pick<PaymentRecord, 'id' | 'bookingStatus' | 'databaseStatus' | 'persistence'>,
  nextStatus: BookingStatus,
): Promise<PaymentRecord> {
  if (record.persistence !== 'supabase') throw new SupabaseBookingError('validation', 'This is not a database booking.');
  if (!OWNER_STATUSES.includes(record.bookingStatus) || !MUTABLE_TARGETS.includes(nextStatus)) {
    throw new SupabaseBookingError('validation', 'Invalid booking status transition.');
  }
  if (!ownerSupabaseAllowedTransitions(record.bookingStatus).includes(nextStatus)) {
    throw new SupabaseBookingError('validation', 'Invalid booking status transition.');
  }
  const { data, error } = await client.rpc('update_owner_booking_status', {
    p_booking_id: record.id,
    p_expected_status: record.databaseStatus || record.bookingStatus,
    p_next_status: nextStatus,
  });
  if (error) throw safeOwnerError(error);
  return mapOwnerPayload(object(data, 'updated booking'));
}

export async function updateOwnerSupabaseBookingStatus(
  record: Pick<PaymentRecord, 'id' | 'bookingStatus' | 'databaseStatus' | 'persistence'>,
  nextStatus: BookingStatus,
): Promise<PaymentRecord> {
  const auth = await readAuthenticatedSession();
  if (auth.status !== 'authenticated') {
    throw new SupabaseBookingError('not-authenticated', 'Please log in with your owner account.');
  }
  const updated = await updateOwnerSupabaseBookingStatusWithClient(requireSupabase(), record, nextStatus);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SUPABASE_BOOKING_EVENT));
  return updated;
}
