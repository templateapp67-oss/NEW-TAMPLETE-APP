/**
 * PHASE 20.5 — CUSTOMER PROFILE · browser-identity data layer.
 *
 * The EXISTING booking architecture identifies customers via
 * `bookingBrowserId()` (localStorage) and stores the ONLY customer fields
 * that exist — `BookingCustomerSnapshot { name, mobile, email?, notes? }` —
 * inside the payment records. There is no customer table, no customer
 * auth, no profile-image storage.
 *
 * This module adds a browser-scoped PROFILE record using the SAME
 * persistence model as every other customer store in this app (versioned
 * localStorage, identity resolved INTERNALLY — `bookingBrowserId()`):
 *
 *   - `readCustomerProfile()`  → the stored profile, or null.
 *   - `saveCustomerProfile()`  → validates + trims + writes + dispatches
 *     `nexora:customer-profile`, and can never touch another browser's
 *     profile (the identity is read inside the helper).
 *
 * No new customer fields are invented — the profile mirrors the existing
 * snapshot fields (name / mobile / email) and `readCustomerAccountInfo()`
 * prefers it over the most recent booking snapshot, so an edited profile
 * shows everywhere (account header, My Bookings, details) while the
 * booking history snapshots stay untouched.
 *
 * Profile-image upload is intentionally NOT built: the app has no
 * profile-image storage, so the existing initials avatar behavior is kept.
 */
import { bookingBrowserId } from './siteBookingFlow';
import { digitsOnly } from './siteBooking';

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const CUSTOMER_PROFILE_STORE_KEY = 'nexora_site_customer_profile';
export const CUSTOMER_PROFILE_STORE_VERSION = 1;
/** Dispatched whenever this browser's profile changes. */
export const CUSTOMER_PROFILE_EVENT = 'nexora:customer-profile';

/** The editable customer fields — exactly the EXISTING snapshot fields. */
export interface CustomerProfile {
  name: string;
  mobile: string;
  email: string;
}

interface PersistedProfileStore {
  version: number;
  browserId: string;
  profile: CustomerProfile | null;
}

function readStore(): PersistedProfileStore {
  if (typeof window === 'undefined') {
    return { version: CUSTOMER_PROFILE_STORE_VERSION, browserId: '', profile: null };
  }
  try {
    const raw = window.localStorage.getItem(CUSTOMER_PROFILE_STORE_KEY);
    if (!raw) return { version: CUSTOMER_PROFILE_STORE_VERSION, browserId: '', profile: null };
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed || typeof parsed !== 'object'
      || (parsed as PersistedProfileStore).version !== CUSTOMER_PROFILE_STORE_VERSION
    ) {
      return { version: CUSTOMER_PROFILE_STORE_VERSION, browserId: '', profile: null };
    }
    return parsed as PersistedProfileStore;
  } catch {
    return { version: CUSTOMER_PROFILE_STORE_VERSION, browserId: '', profile: null };
  }
}

function writeStore(store: PersistedProfileStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOMER_PROFILE_STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(CUSTOMER_PROFILE_EVENT));
}

/* ------------------------------------------------------------------ */
/* Reads — own profile only                                            */
/* ------------------------------------------------------------------ */

/**
 * THIS browser's stored profile, or null. The identity is read internally,
 * so a caller can never request another customer's profile.
 */
export function readCustomerProfile(): CustomerProfile | null {
  const me = bookingBrowserId();
  const store = readStore();
  if (!store.profile || store.browserId !== me) return null;
  return { ...store.profile };
}

/* ------------------------------------------------------------------ */
/* Validation — the SAME rules as the existing booking details form     */
/* ------------------------------------------------------------------ */

export interface CustomerProfileErrors {
  name?: boolean;
  mobile?: boolean;
  email?: boolean;
}

/**
 * Mirrors `validateBookingCustomer` (10.6/16.x): name ≥ 2 trimmed chars,
 * mobile 10–13 digits, optional email must match the existing pattern.
 * Nothing stricter — existing customer data must never be rejected.
 */
export function validateCustomerProfile(input: CustomerProfile): CustomerProfileErrors {
  const errors: CustomerProfileErrors = {};
  if ((input.name || '').trim().length < 2) errors.name = true;
  const digits = digitsOnly(input.mobile);
  if (digits.length < 10 || digits.length > 13) errors.mobile = true;
  const email = (input.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = true;
  return errors;
}

export function customerProfileValid(errors: CustomerProfileErrors): boolean {
  return !errors.name && !errors.mobile && !errors.email;
}

/* ------------------------------------------------------------------ */
/* Mutation                                                            */
/* ------------------------------------------------------------------ */

export type ProfileSaveResult =
  | { ok: true; profile: CustomerProfile }
  | { ok: false; errors: CustomerProfileErrors };

/**
 * Saves THIS browser's profile. Validation + trimming happen here (not
 * only in the UI), the identity is resolved internally, and the stored
 * profile can never belong to another browser. Returns validation errors
 * so the UI can render per-field messages.
 */
export function saveCustomerProfile(input: CustomerProfile): ProfileSaveResult {
  const trimmed: CustomerProfile = {
    name: (input.name || '').trim(),
    mobile: (input.mobile || '').trim(),
    email: (input.email || '').trim(),
  };
  const errors = validateCustomerProfile(trimmed);
  if (!customerProfileValid(errors)) return { ok: false, errors };

  const me = bookingBrowserId();
  writeStore({
    version: CUSTOMER_PROFILE_STORE_VERSION,
    browserId: me,
    profile: trimmed,
  });
  return { ok: true, profile: trimmed };
}
