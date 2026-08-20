import type { PaymentRecord } from './siteBookingPayment';

/** In-memory projection only; the database remains the source of truth. */
let ownerBookingRecords: PaymentRecord[] = [];

export const SUPABASE_OWNER_BOOKINGS_EVENT = 'nexora:supabase-owner-bookings';

export function replaceSupabaseOwnerBookingCache(records: readonly PaymentRecord[]): void {
  ownerBookingRecords = records.map((record) => ({ ...record }));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUPABASE_OWNER_BOOKINGS_EVENT));
  }
}

export function upsertSupabaseOwnerBookingCache(record: PaymentRecord): void {
  const index = ownerBookingRecords.findIndex((item) => item.id === record.id);
  ownerBookingRecords = index < 0
    ? [record, ...ownerBookingRecords]
    : ownerBookingRecords.map((item, itemIndex) => itemIndex === index ? record : item);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUPABASE_OWNER_BOOKINGS_EVENT));
  }
}

export function readSupabaseOwnerBookingCache(businessId: string, themeId: string): PaymentRecord[] {
  return ownerBookingRecords
    .filter((record) => record.businessId === businessId && record.themeId === themeId)
    .map((record) => ({ ...record }));
}
