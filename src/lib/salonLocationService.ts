/**
 * Data access for salon location, against the LIVE existing schema.
 *
 * Table (verified to exist in the live project): public.salons
 * Columns used (all verified to exist — none created by this feature):
 *   id
 *   address                 text
 *   latitude                numeric/double precision
 *   longitude               numeric/double precision
 *   location_confirmed      boolean
 *   location_confirmed_at   timestamptz
 *
 * This is the single source of truth: the owner editor writes these columns,
 * the customer nearby search reads them. No migrations, no new tables or
 * columns, no RLS changes.
 */

import { requireSupabase } from './supabaseClient';
import { normalizeCoordinates, type Coordinates } from './location';

export const SALON_TABLE = 'salons';

/** Location shape as stored on the salon row. */
export interface SalonLocationRecord {
  id: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  locationConfirmed: boolean;
  locationConfirmedAt: string | null;
}

/** Raw row as PostgREST returns it (numeric columns may arrive as strings). */
interface SalonLocationRow {
  id: string;
  address: string | null;
  latitude: unknown;
  longitude: unknown;
  location_confirmed: unknown;
  location_confirmed_at: string | null;
}

const LOCATION_COLUMNS = 'id, address, latitude, longitude, location_confirmed, location_confirmed_at';

function mapRow(row: SalonLocationRow): SalonLocationRecord {
  const coords = normalizeCoordinates(row.latitude, row.longitude);
  return {
    id: row.id,
    address: row.address,
    latitude: coords ? coords.latitude : null,
    longitude: coords ? coords.longitude : null,
    locationConfirmed: row.location_confirmed === true,
    locationConfirmedAt: row.location_confirmed_at,
  };
}

/** Load one salon's saved location so the editor can reopen it. */
export async function fetchSalonLocation(
  salonId: string,
): Promise<SalonLocationRecord | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(SALON_TABLE)
    .select(LOCATION_COLUMNS)
    .eq('id', salonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as unknown as SalonLocationRow);
}

export interface SaveSalonLocationInput {
  salonId: string;
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * Persist the confirmed address + coordinates onto the existing salon row.
 * Coordinates are validated and sent as real numbers, matching the numeric
 * column type (never stringified).
 */
export async function saveSalonLocation(
  input: SaveSalonLocationInput,
): Promise<SalonLocationRecord> {
  const coords: Coordinates | null = normalizeCoordinates(
    input.latitude,
    input.longitude,
  );
  if (!coords) {
    throw new Error('Invalid coordinates — location was not saved.');
  }

  const address = input.address.trim();
  if (!address) {
    throw new Error('An address is required before saving.');
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from(SALON_TABLE)
    .update({
      address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_confirmed: true,
      location_confirmed_at: new Date().toISOString(),
    })
    .eq('id', input.salonId)
    .select(LOCATION_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      'The salon record could not be updated. It may not exist, or your account may not have permission.',
    );
  }
  return mapRow(data as unknown as SalonLocationRow);
}
