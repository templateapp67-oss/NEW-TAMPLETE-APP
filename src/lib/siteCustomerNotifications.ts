/**
 * PHASE 20.8 — CUSTOMER NOTIFICATIONS · derived projection + read-state.
 *
 * The spec's `notifications` table (draft M10/M12, per-user is_read + RLS)
 * is NOT applied in the current browser-local booking runtime, exactly like
 * the owner dashboard's 17.8 module notes. This module therefore:
 *
 *   1. DERIVES the customer's notifications deterministically from the
 *      EXISTING real records they own — booking/payment records
 *      (`bookingStatus` / `paymentStatus` / `createdAt` / `updatedAt`) and
 *      their own reviews (status / `updatedAt`). No fake notification
 *      records, no invented ids, no second event system.
 *   2. PERSISTS ONLY the read/unread state in the app's existing
 *      browser-scoped store model (`nexora_site_customer_notification_read`,
 *      keyed by `bookingBrowserId()`, versioned localStorage) — the same
 *      model as profile and favorites. Identity is resolved INTERNALLY, so
 *      another customer's read-state is structurally unreachable.
 *
 * Derivable events (only what the existing records can actually express):
 *   booking confirmed / cancelled / completed / payment pending / payment
 *   failed / booking updated (updatedAt > createdAt — covers status change
 *   and reschedule; the current record shape has no slot history to
 *   distinguish them, so the message stays honest) / review approved /
 *   review not published.
 */
import { bookingBrowserId } from './siteBookingFlow';
import { readMyBookings } from './bookingManagement';
import { readMyReviews } from './siteReviews';
import type { CustomerReview } from './siteReviews';
import type { PaymentRecord } from './siteBookingPayment';
import { bookingServiceNames } from './bookingManagement';

/* ------------------------------------------------------------------ */
/* Read-state store                                                    */
/* ------------------------------------------------------------------ */

export const CUSTOMER_NOTIFICATION_READ_KEY = 'nexora_site_customer_notification_read';
export const CUSTOMER_NOTIFICATION_READ_VERSION = 1;
/** Dispatched whenever the read-state changes. */
export const CUSTOMER_NOTIFICATION_EVENT = 'nexora:customer-notifications';

interface ReadStore {
  version: number;
  browserId: string;
  readKeys: string[];
}

function readReadStore(): ReadStore {
  if (typeof window === 'undefined') {
    return { version: CUSTOMER_NOTIFICATION_READ_VERSION, browserId: '', readKeys: [] };
  }
  try {
    const raw = window.localStorage.getItem(CUSTOMER_NOTIFICATION_READ_KEY);
    if (!raw) return { version: CUSTOMER_NOTIFICATION_READ_VERSION, browserId: '', readKeys: [] };
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed || typeof parsed !== 'object'
      || (parsed as ReadStore).version !== CUSTOMER_NOTIFICATION_READ_VERSION
      || !Array.isArray((parsed as ReadStore).readKeys)
    ) {
      return { version: CUSTOMER_NOTIFICATION_READ_VERSION, browserId: '', readKeys: [] };
    }
    return parsed as ReadStore;
  } catch {
    return { version: CUSTOMER_NOTIFICATION_READ_VERSION, browserId: '', readKeys: [] };
  }
}

function writeReadStore(store: ReadStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOMER_NOTIFICATION_READ_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(CUSTOMER_NOTIFICATION_EVENT));
}

/** THIS browser's read keys (identity resolved internally). */
function myReadKeys(): string[] {
  const me = bookingBrowserId();
  const store = readReadStore();
  return store.browserId === me ? store.readKeys.slice() : [];
}

/* ------------------------------------------------------------------ */
/* Notification model                                                  */
/* ------------------------------------------------------------------ */

export type CustomerNotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_pending'
  | 'payment_failed'
  | 'booking_updated'
  | 'review_approved'
  | 'review_rejected';

export interface CustomerNotification {
  /** Stable key: existing record id + event type (survives refresh). */
  key: string;
  type: CustomerNotificationType;
  title: string;
  message: string;
  occurredAt: number;
  /** Booking reference for actions (Open Booking Details). */
  bookingId?: string;
  /** Review id (for review notifications). */
  reviewId?: string;
  isRead: boolean;
}

function bookingEvents(record: PaymentRecord): CustomerNotification[] {
  // ONE most-informative event per record, derived from its CURRENT state.
  // The record shape has no slot/status history, so a live booking that was
  // touched after creation (updatedAt > createdAt) is reported honestly as
  // "updated" — this covers reschedule and later status changes without
  // inventing a distinction the data cannot prove.
  const out: CustomerNotification[] = [];
  const names = bookingServiceNames(record).join(' + ');
  const id = record.bookingId;
  const push = (
    type: CustomerNotificationType,
    title: string,
    message: string,
    occurredAt: number,
  ) => out.push({ key: `${record.id}:${type}`, type, title, message, occurredAt, bookingId: id, isRead: false });

  if (record.bookingStatus === 'cancelled') {
    const byCustomer = record.failureReason === 'Cancelled by customer';
    push(
      'booking_cancelled',
      'Booking cancelled',
      byCustomer
        ? `Your booking ${id} was cancelled.`
        : `Your booking ${id} was cancelled by the salon.`,
      record.updatedAt,
    );
  } else if (record.bookingStatus === 'completed') {
    push(
      'booking_completed',
      'Appointment completed',
      `Your appointment ${id} was completed — ${names}.`,
      record.updatedAt,
    );
  } else if (record.bookingStatus === 'failed' || record.paymentStatus === 'failed') {
    push(
      'payment_failed',
      'Payment failed',
      `Payment failed for booking ${id}. Please retry to keep your slot.`,
      record.updatedAt,
    );
  } else if (record.bookingStatus === 'pending_payment') {
    push(
      'payment_pending',
      'Payment pending',
      `Payment is pending for booking ${id} — ${names}.`,
      record.updatedAt,
    );
  } else if (record.bookingStatus === 'confirmed' || record.bookingStatus === 'pay_at_salon') {
    if (record.updatedAt > record.createdAt) {
      push(
        'booking_updated',
        'Booking updated',
        `Your booking ${id} was updated (time or status may have changed).`,
        record.updatedAt,
      );
    } else {
      push(
        'booking_confirmed',
        'Booking confirmed',
        `Your booking ${id} is confirmed — ${names}.`,
        record.createdAt,
      );
    }
  }
  return out;
}

function reviewEvents(review: CustomerReview): CustomerNotification[] {
  const out: CustomerNotification[] = [];
  if (review.status === 'approved') {
    out.push({
      key: `${review.id}:review_approved`,
      type: 'review_approved',
      title: 'Review published',
      message: 'Your review is now public on the salon website.',
      occurredAt: review.updatedAt,
      reviewId: review.id,
      isRead: false,
    });
  }
  if (review.status === 'rejected') {
    out.push({
      key: `${review.id}:review_rejected`,
      type: 'review_rejected',
      title: 'Review not published',
      message: 'Your review was not published.',
      occurredAt: review.updatedAt,
      reviewId: review.id,
      isRead: false,
    });
  }
  return out;
}

/** THIS browser's derived notifications, newest first, with read-state. */
export function readCustomerNotifications(): CustomerNotification[] {
  const readKeys = new Set(myReadKeys());
  const fromBookings = readMyBookings().flatMap(bookingEvents);
  const fromReviews = readMyReviews().flatMap(reviewEvents);
  return fromBookings
    .concat(fromReviews)
    .map((n) => ({ ...n, isRead: readKeys.has(n.key) }))
    .sort((a, b) => b.occurredAt - a.occurredAt);
}

/** Count of unread notifications for THIS browser. */
export function customerUnreadCount(): number {
  return readCustomerNotifications().filter((n) => !n.isRead).length;
}

/* ------------------------------------------------------------------ */
/* Read / unread mutations — own notifications only                    */
/* ------------------------------------------------------------------ */

/** Mark ONE of THIS browser's notifications as read. */
export function markCustomerNotificationRead(key: string): void {
  const me = bookingBrowserId();
  const store = readReadStore();
  const keys = store.browserId === me ? store.readKeys : [];
  if (keys.includes(key)) return;
  writeReadStore({ version: CUSTOMER_NOTIFICATION_READ_VERSION, browserId: me, readKeys: [...keys, key] });
}

/** Mark ALL of THIS browser's notifications as read. */
export function markAllCustomerNotificationsRead(): void {
  const me = bookingBrowserId();
  const all = readCustomerNotifications().map((n) => n.key);
  const store = readReadStore();
  const merged = Array.from(new Set([...(store.browserId === me ? store.readKeys : []), ...all]));
  writeReadStore({ version: CUSTOMER_NOTIFICATION_READ_VERSION, browserId: me, readKeys: merged });
}
