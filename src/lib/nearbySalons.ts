/**
 * Customer nearby-salon search.
 *
 * Reads the SAME canonical location values the owner editor writes:
 *   address + latitude + longitude.
 *
 * The data source is intentionally injected (`fetchSalons`) because this repo
 * has no Supabase client or salon table yet. When the salon data source is
 * connected, pass a loader that selects ONLY the fields below — the card
 * fields plus the coordinate/address fields needed for distance — and, if a
 * location-confirmed column exists in the real schema, filters on it there.
 */

import {
  findNearbySalons,
  normalizeCoordinates,
  type RadiusKm,
  type WithDistance,
} from './location';

/**
 * The minimal salon shape the nearby list needs.
 * Coordinates are typed `unknown` on input because a database may return
 * numeric columns as numbers or as strings depending on the driver; they are
 * normalised before any arithmetic.
 */
export interface NearbySalonRecord {
  id: string;
  name: string;
  address: string;
  latitude: unknown;
  longitude: unknown;
  /** Optional card fields — only what the salon card already displays. */
  imageUrl?: string;
  tagline?: string;
}

export type NearbySalon = WithDistance<NearbySalonRecord>;

/** Loader supplied by the caller once a salon data source exists. */
export type SalonLoader = () => Promise<NearbySalonRecord[]>;

/**
 * Drop records that can never take part in a distance calculation.
 * Runs before Haversine so NaN/null coordinates are never compared.
 */
export function withValidCoordinates(
  salons: readonly NearbySalonRecord[],
): NearbySalonRecord[] {
  return salons.filter(
    (s) => normalizeCoordinates(s.latitude, s.longitude) !== null,
  );
}

/**
 * Full nearby search: load salons, discard invalid coordinates, compute
 * straight-line Haversine distance in km, apply the radius, sort nearest
 * first. No routing API, and no per-salon geocoding request — salon
 * coordinates are already stored by the owner editor.
 */
export async function searchNearbySalons(
  customer: { latitude: unknown; longitude: unknown },
  radiusKm: RadiusKm | number,
  fetchSalons: SalonLoader,
): Promise<NearbySalon[]> {
  const origin = normalizeCoordinates(customer.latitude, customer.longitude);
  if (!origin) return [];

  const salons = await fetchSalons();
  const usable = withValidCoordinates(salons);

  return findNearbySalons(origin, usable, radiusKm);
}
