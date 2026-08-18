/**
 * PHASE 20.6 — FAVORITES / SAVED SALONS · browser-identity data layer.
 *
 * The existing booking architecture identifies customers via
 * `bookingBrowserId()` (localStorage) and persists ALL customer data in
 * versioned browser-scoped stores (payments, drafts, profile). This module
 * follows that exact model for saved salons:
 *
 *   - `readFavoriteSalons()`   → THIS browser's saved salons.
 *   - `saveFavoriteSalon()`    → snapshot the REAL salon being viewed
 *     (name / logo / theme / address / tenant key) and save it (deduped
 *     per business+theme).
 *   - `removeFavoriteSalon()`  → unsave.
 *   - `isSalonFavorite()`      → heart state.
 *
 * The identity is resolved INTERNALLY (`bookingBrowserId()`) on every
 * read/write, so a caller can never view or change another customer's
 * saved salons. No fake salon records: every snapshot field comes from the
 * `SalonData` of the salon whose website is open.
 *
 * PERSISTENCE NOTE — this is the app's existing browser-scoped store
 * model; there is NO backend favorites table (draft migrations are
 * unapplied). Server-side favorite persistence requires the deferred
 * backend migration and is intentionally NOT invented here.
 */
import { bookingBrowserId } from './siteBookingFlow';
import { bookingBusinessId } from './siteBookingFlow';
import type { SiteHeaderThemeId } from './siteNavigation';
import type { SalonData } from '../types';
import { THEME_FALLBACK_NAME } from './siteBooking';

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const FAVORITES_STORE_KEY = 'nexora_site_customer_favorites';
export const FAVORITES_STORE_VERSION = 1;
/** Dispatched whenever this browser's favorites change. */
export const FAVORITES_EVENT = 'nexora:customer-favorites';

export interface FavoriteSalon {
  /** Tenant key of the saved salon (existing `bookingBusinessId` rule). */
  businessId: string;
  themeId: SiteHeaderThemeId;
  salonName: string;
  logoUrl?: string;
  address?: string;
  websiteSlug?: string;
  savedAt: number;
}

interface PersistedFavoritesStore {
  version: number;
  browserId: string;
  salons: FavoriteSalon[];
}

function readStore(): PersistedFavoritesStore {
  if (typeof window === 'undefined') {
    return { version: FAVORITES_STORE_VERSION, browserId: '', salons: [] };
  }
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORE_KEY);
    if (!raw) return { version: FAVORITES_STORE_VERSION, browserId: '', salons: [] };
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed || typeof parsed !== 'object'
      || (parsed as PersistedFavoritesStore).version !== FAVORITES_STORE_VERSION
      || !Array.isArray((parsed as PersistedFavoritesStore).salons)
    ) {
      return { version: FAVORITES_STORE_VERSION, browserId: '', salons: [] };
    }
    return parsed as PersistedFavoritesStore;
  } catch {
    return { version: FAVORITES_STORE_VERSION, browserId: '', salons: [] };
  }
}

function writeStore(store: PersistedFavoritesStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITES_STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

/** Stable key for one salon (business + theme). */
export function favoriteSalonKey(businessId: string, themeId: string): string {
  return `${businessId}|${themeId}`;
}

/* ------------------------------------------------------------------ */
/* Reads — own favorites only                                          */
/* ------------------------------------------------------------------ */

/** THIS browser's saved salons, newest first. Identity resolved internally. */
export function readFavoriteSalons(): FavoriteSalon[] {
  const me = bookingBrowserId();
  const store = readStore();
  if (store.browserId !== me) return [];
  return store.salons.slice().sort((a, b) => b.savedAt - a.savedAt);
}

/** Whether THIS browser has saved the given salon. */
export function isSalonFavorite(businessId: string, themeId: string): boolean {
  const key = favoriteSalonKey(businessId, themeId);
  return readFavoriteSalons().some((salon) => favoriteSalonKey(salon.businessId, salon.themeId) === key);
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/**
 * Snapshot the REAL salon whose website is open and save it for THIS
 * browser. Deduped per business+theme — saving twice never duplicates.
 */
export function saveFavoriteSalon(
  data: SalonData,
  themeId: SiteHeaderThemeId,
): { ok: true; salon: FavoriteSalon } | { ok: false; reason: 'duplicate' } {
  const businessId = bookingBusinessId(data);
  const salonName = (data.salonName || '').trim() || THEME_FALLBACK_NAME[themeId] || 'Salon';
  const salon: FavoriteSalon = {
    businessId,
    themeId,
    salonName,
    logoUrl: data.logoUrl || undefined,
    address: addressLine(data),
    websiteSlug: (data.websiteSlug || '').trim() || undefined,
    savedAt: Date.now(),
  };

  const me = bookingBrowserId();
  const store = readStore();
  const key = favoriteSalonKey(businessId, themeId);
  const existing = store.salons.find(
    (s) => favoriteSalonKey(s.businessId, s.themeId) === key,
  );
  if (existing) return { ok: false, reason: 'duplicate' };

  writeStore({
    version: FAVORITES_STORE_VERSION,
    browserId: me,
    salons: [...store.salons, salon],
  });
  return { ok: true, salon };
}

/** Remove THIS browser's saved salon. Returns true when it was saved. */
export function removeFavoriteSalon(businessId: string, themeId: string): boolean {
  const me = bookingBrowserId();
  const store = readStore();
  if (store.browserId !== me) return false;
  const key = favoriteSalonKey(businessId, themeId);
  const next = store.salons.filter((s) => favoriteSalonKey(s.businessId, s.themeId) !== key);
  if (next.length === store.salons.length) return false;
  writeStore({ version: FAVORITES_STORE_VERSION, browserId: me, salons: next });
  return true;
}

/** "Area, City" when available, else the full address line (real data only). */
function addressLine(data: SalonData): string | undefined {
  const addr = data.address;
  if (!addr) return undefined;
  const parts = [addr.area, addr.city].filter((p) => typeof p === 'string' && p.trim().length > 0);
  if (parts.length > 0) return parts.join(', ');
  return addr.fullAddress?.trim() || undefined;
}
