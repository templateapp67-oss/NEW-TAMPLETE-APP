import type { User } from '@supabase/supabase-js';
import type { BookingStatus, PaymentRecord } from './siteBookingPayment';
import { requireSupabase, type NexoraSupabaseClient } from './supabaseClient';
import { readAuthenticatedSession } from './useAuth';
import {
  SUPABASE_BOOKING_EVENT,
  SupabaseBookingError,
  bookingTemplateVisualTheme,
  supabaseBookingToPaymentRecord,
} from './supabaseBooking';
import {
  replaceSupabaseOwnerBookingCache,
  upsertSupabaseOwnerBookingCache,
} from './supabaseBookingCache';

const OWNER_STATUSES: BookingStatus[] = [
  'pending_payment', 'confirmed', 'checked_in', 'in_progress',
  'completed', 'cancelled', 'no_show', 'disputed',
];
const MUTABLE_TARGETS: BookingStatus[] = [
  'confirmed', 'checked_in', 'in_progress', 'completed',
  'cancelled', 'no_show', 'disputed',
];

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

function mapOwnerPayload(value: unknown): PaymentRecord {
  const payload = object(value, 'owner booking');
  const booking = object(payload.booking, 'booking row');
  const customer = object(payload.customer, 'booking customer');
  const customerId = typeof booking.customer_user_id === 'string'
    ? booking.customer_user_id
    : text(booking.salon_customer_id, 'salon customer id');
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
    bookingTemplateVisualTheme(payload.template_key),
    { id: customerId, user_metadata: {} } as User,
    { phone: ownerSafeCustomer.mobile, email: ownerSafeCustomer.email },
    ownerSafeCustomer,
    typeof payload.timezone === 'string' ? payload.timezone : 'Asia/Kolkata',
    false,
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
  if (status === 'confirmed' || status === 'pay_at_salon') return ['checked_in', 'cancelled', 'no_show'];
  if (status === 'checked_in') return ['in_progress', 'cancelled'];
  if (status === 'in_progress') return ['completed'];
  if (status === 'completed' || status === 'cancelled') return ['disputed'];
  return [];
}

export async function readOwnerSupabaseBookingsWithClient(client: NexoraSupabaseClient): Promise<PaymentRecord[]> {
  const { data, error } = await client.rpc('get_owner_bookings', { p_booking_id: undefined });
  if (error) throw safeOwnerError(error);
  if (!Array.isArray(data)) throw new SupabaseBookingError('database', 'The owner booking list is invalid.');
  const records = data.map(mapOwnerPayload);
  replaceSupabaseOwnerBookingCache(records);
  return records;
}

export async function readOwnerSupabaseBookings(): Promise<PaymentRecord[]> {
  // The host has already resolved the signed-in owner actor. The RPC is the
  // authoritative auth/tenant boundary and rejects anonymous/non-owner calls;
  // avoiding a second auth refresh here also prevents a late-mounted panel
  // from waiting behind Supabase Auth's session lock.
  return readOwnerSupabaseBookingsWithClient(requireSupabase());
}

export async function updateOwnerSupabaseBookingStatusWithClient(
  client: NexoraSupabaseClient,
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
  const action = nextStatus === 'confirmed' ? 'accept'
    : nextStatus === 'checked_in' ? 'check_in'
      : nextStatus === 'in_progress' ? 'start'
        : nextStatus === 'completed' ? 'complete'
          : nextStatus === 'no_show' ? 'no_show'
            : nextStatus === 'disputed' ? 'dispute'
              : record.bookingStatus === 'pending_payment' ? 'reject' : 'cancel';
  const { error } = await client.rpc('operate_owner_booking', {
    p_booking_id: record.id,
    p_action: action,
    p_reason: undefined,
    p_new_start: undefined,
  });
  if (error) throw safeOwnerError(error);
  const { data: refreshed, error: refreshError } = await client.rpc('get_owner_bookings', {
    p_booking_id: record.id,
  });
  if (refreshError) throw safeOwnerError(refreshError);
  if (!Array.isArray(refreshed) || refreshed.length !== 1) {
    throw new SupabaseBookingError('database', 'The updated booking could not be reloaded.');
  }
  const updated = mapOwnerPayload(refreshed[0]);
  upsertSupabaseOwnerBookingCache(updated);
  return updated;
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
