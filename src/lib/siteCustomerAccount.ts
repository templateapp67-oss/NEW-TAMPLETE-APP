/**
 * PHASE 20.1 — CUSTOMER ACCOUNT FOUNDATION · browser-identity data layer.
 *
 * The EXISTING booking architecture identifies customers anonymously via
 * `bookingBrowserId()` (localStorage). There is no customer auth, no
 * customer table, no backend identity.
 *
 * This module derives the customer's account info from the EXISTING booking
 * records (localStorage `nexora_site_payment_records`):
 *   - Name, mobile, email from the most recent booking's customer snapshot
 *   - Count of upcoming bookings
 *   - Count of past/completed bookings
 *
 * No invented data, no fake persistence, no database writes.
 * When the browser has no booking history, the customer is "Guest".
 *
 * PHASE 20.2 — MY BOOKINGS · booking grouping and sorting helpers.
 * Groups THIS browser's own records into Upcoming / Past / Cancelled with
 * appropriate sort order. Uses the EXISTING payment record store only.
 */
import { readPaymentRecords } from './siteBookingPayment';
import type { PaymentRecord } from './siteBookingPayment';
import { bookingBrowserId } from './siteBookingFlow';
import { localDateKey, salonNow } from './salonStatus';
import { readCustomerProfile } from './siteCustomerProfile';

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

/** Dispatched when the customer account panel should open. */
export const CUSTOMER_ACCOUNT_EVENT = 'nexora:customer-account';
/** Dispatched when the customer account panel should close. */
export const CUSTOMER_ACCOUNT_CLOSE_EVENT = 'nexora:customer-account-close';

/** Opens the customer account panel from anywhere on the site. */
export function openCustomerAccount(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_EVENT));
}

/** Closes the customer account panel. */
export function closeCustomerAccount(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_CLOSE_EVENT));
}

/* ------------------------------------------------------------------ */
/* Account info                                                        */
/* ------------------------------------------------------------------ */

export interface CustomerAccountInfo {
  /** Whether this browser has identifiable customer data. */
  recognized: boolean;
  /** Name from the most recent booking, or undefined. */
  name: string | undefined;
  /** Mobile from the most recent booking, or undefined. */
  mobile: string | undefined;
  /** Email from the most recent booking, or undefined. */
  email: string | undefined;
  /** Total number of bookings in this browser. */
  totalBookings: number;
  /** Number of upcoming (confirmed/pending/pay_at_salon) bookings. */
  upcomingCount: number;
  /** Number of past/completed bookings. */
  pastCount: number;
  /** Initials derived from the name (for avatar fallback). */
  initials: string;
  /** The browser identity string. */
  browserId: string;
}

/**
 * Reads THIS browser's customer account info from existing booking records.
 * No database calls, no invented data.
 */
export function readCustomerAccountInfo(): CustomerAccountInfo {
  const browserId = bookingBrowserId();
  const records = readPaymentRecords()
    .filter((r) => r.customerId === browserId);

  // Most recent booking with customer data
  const lastRecord: PaymentRecord | undefined = records.length > 0 ? records[0] : undefined;

  // PHASE 20.5 — the customer's OWN stored profile wins; fall back to the
  // most recent booking snapshot so existing customers' info shows
  // immediately. Booking-history snapshots are never rewritten.
  const profile = readCustomerProfile();
  const name = profile?.name || lastRecord?.customer?.name || undefined;
  const mobile = profile?.mobile || lastRecord?.customer?.mobile || undefined;
  const email = profile?.email || lastRecord?.customer?.email || undefined;

  const upcomingCount = records.filter(
    (r) => r.bookingStatus === 'confirmed' || r.bookingStatus === 'pay_at_salon' || r.bookingStatus === 'pending_payment',
  ).length;
  const pastCount = records.filter(
    (r) => r.bookingStatus === 'completed' || r.bookingStatus === 'cancelled' || r.bookingStatus === 'failed',
  ).length;

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return {
    recognized: !!name,
    name,
    mobile,
    email,
    totalBookings: records.length,
    upcomingCount,
    pastCount,
    initials,
    browserId,
  };
}

/* ------------------------------------------------------------------ */
/* PHASE 20.2 — Booking grouping                                      */
/* ------------------------------------------------------------------ */

export type BookingGroup = 'upcoming' | 'past' | 'cancelled';

export interface GroupedBookings {
  upcoming: PaymentRecord[];
  past: PaymentRecord[];
  cancelled: PaymentRecord[];
}

/**
 * Returns the salon-local today key (YYYY-MM-DD). Matches the booking
 * engine's own notion of today.
 */
function todayKey(): string {
  return localDateKey(salonNow());
}

function isUpcoming(record: PaymentRecord): boolean {
  return record.bookingStatus === 'pending_payment'
    || record.bookingStatus === 'confirmed'
    || record.bookingStatus === 'pay_at_salon';
}

function isPast(record: PaymentRecord): boolean {
  return record.bookingStatus === 'completed';
}

function isCancelled(record: PaymentRecord): boolean {
  return record.bookingStatus === 'cancelled' || record.bookingStatus === 'failed';
}

/**
 * Sorts THIS browser's own booking records into three groups, each with
 * the correct sort order.
 *
 * - Upcoming: active statuses (pending_payment / confirmed / pay_at_salon)
 *   sorted by date ascending (nearest first), then by start time ascending,
 *   then by most recent created-at.
 * - Past: completed bookings sorted by date descending (most recent first),
 *   then by end time descending.
 * - Cancelled: cancelled / failed bookings sorted by date descending.
 */
export function groupCustomerBookings(records: PaymentRecord[]): GroupedBookings {
  const me = bookingBrowserId();

  const mine = records.filter((r) => r.customerId === me);

  const upcoming: PaymentRecord[] = [];
  const past: PaymentRecord[] = [];
  const cancelled: PaymentRecord[] = [];

  for (const record of mine) {
    if (isCancelled(record)) cancelled.push(record);
    else if (isPast(record)) past.push(record);
    else if (isUpcoming(record)) upcoming.push(record);
    else past.push(record); // fallback — treat unknown statuses as past
  }

  // Upcoming: nearest date first, then earliest time
  upcoming.sort((a, b) => {
    const dateCmp = a.dateKey.localeCompare(b.dateKey);
    if (dateCmp !== 0) return dateCmp;
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    return b.createdAt - a.createdAt;
  });

  // Past: most recent first (date descending, then end time descending)
  past.sort((a, b) => {
    const dateCmp = b.dateKey.localeCompare(a.dateKey);
    if (dateCmp !== 0) return dateCmp;
    if (a.endMinutes !== b.endMinutes) return b.endMinutes - a.endMinutes;
    return b.createdAt - a.createdAt;
  });

  // Cancelled: most recent first
  cancelled.sort((a, b) => {
    const dateCmp = b.dateKey.localeCompare(a.dateKey);
    if (dateCmp !== 0) return dateCmp;
    if (a.startMinutes !== b.startMinutes) return b.startMinutes - a.startMinutes;
    return b.createdAt - a.createdAt;
  });

  return { upcoming, past, cancelled };
}

/**
 * Read all of THIS browser's bookings and group them into the three
 * categories (upcoming / past / cancelled).
 */
export function readGroupedCustomerBookings(): GroupedBookings {
  return groupCustomerBookings(readPaymentRecords());
}

/**
 * PHASE 20.3 — SECURE single-booking read.
 *
 * Returns ONE of THIS browser's own bookings by reference, or null.
 * The identity is read INSIDE the helper (`bookingBrowserId()`), so a
 * caller can never request another customer's booking — a manually
 * crafted booking id from a different customer resolves to `null`
 * (not-found), never to data. This mirrors the 16.6/16.7 rule: identity
 * internal, tenant-scoped, structurally unable to leak.
 *
 * The underlying store read is the EXISTING payment-record query layer
 * (localStorage); this helper surfaces only the single matching record.
 */
export function readCustomerBooking(bookingId: string): PaymentRecord | null {
  const me = bookingBrowserId();
  return (
    readPaymentRecords().find(
      (r) => r.customerId === me && r.bookingId === bookingId,
    ) || null
  );
}

/* ------------------------------------------------------------------ */
/* Booking display helpers                                             */
/* ------------------------------------------------------------------ */

/**
 * Service names for a record — uses the existing multi-service lines when
 * present, otherwise falls back to the single service name.
 */
export function customerBookingServiceNames(record: Pick<PaymentRecord, 'serviceName' | 'services'>): string[] {
  if (record.services && record.services.length > 0) {
    return record.services.map((line) => line.serviceName);
  }
  return [record.serviceName];
}

/**
 * Money snapshot derived from the existing record — total, advance paid,
 * remaining, and payment status.
 */
export function customerBookingMoney(record: PaymentRecord): {
  total: number;
  advancePaid: number;
  remaining: number;
} {
  const advancePaid = record.paymentStatus === 'paid' ? record.amountDue : 0;
  return {
    total: record.baseAmount,
    advancePaid,
    remaining: record.paymentStatus === 'paid' ? record.remainingAmount : record.baseAmount,
  };
}