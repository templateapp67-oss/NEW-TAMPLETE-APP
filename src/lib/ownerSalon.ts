/**
 * Resolves the salon belonging to the CURRENTLY AUTHENTICATED shop owner.
 *
 * The salon id must never come from client input, localStorage, a hardcoded
 * value, or "the first row Supabase returns". It has to be derived from the
 * authenticated session through an existing owner -> salon relationship.
 *
 * Live-schema inspection of public.salons found NO such relationship:
 * there is no owner_id / user_id / profile_id / created_by / owner_user_id /
 * auth_user_id / owner / owner_email column, no salon_owners or salon_members
 * table, and public.profiles has no salon_id column. The repository also has
 * no authentication flow at all (no supabase.auth usage, no login screen).
 *
 * Because the linkage genuinely does not exist, this module refuses to
 * resolve a salon rather than guessing one. No salon row is written until the
 * correct id is known.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export type OwnerSalonResolution =
  | { status: 'resolved'; salonId: string }
  | { status: 'not-configured' }
  | { status: 'not-authenticated' }
  | { status: 'no-linkage' };

/**
 * Returns the authenticated user's id, or null when there is no session.
 * Uses the real Supabase session; never a hardcoded or client-supplied id.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

/**
 * Resolve the authenticated owner's salon id.
 *
 * Returns 'no-linkage' when a session exists but the schema offers no way to
 * map that user to a salon row. Callers must treat anything other than
 * 'resolved' as "do not write".
 */
export async function resolveOwnerSalonId(): Promise<OwnerSalonResolution> {
  if (!isSupabaseConfigured || !supabase) {
    return { status: 'not-configured' };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { status: 'not-authenticated' };
  }

  // A session exists, but public.salons has no column tying a row to
  // auth.users, and no membership/ownership join table exists. Selecting an
  // arbitrary salon would let one owner overwrite another owner's location,
  // so resolution stops here.
  return { status: 'no-linkage' };
}

/** User-facing message for a non-resolved state. Never leaks DB internals. */
export function ownerSalonMessage(resolution: OwnerSalonResolution): string {
  switch (resolution.status) {
    case 'not-configured':
      return 'Shop location is unavailable right now. Please try again later.';
    case 'not-authenticated':
      return 'Please sign in to edit your shop location.';
    case 'no-linkage':
      return 'Unable to determine your shop.';
    default:
      return '';
  }
}
