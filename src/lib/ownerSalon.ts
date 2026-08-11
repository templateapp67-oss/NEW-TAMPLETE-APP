/**
 * Resolves the salon belonging to the CURRENTLY AUTHENTICATED shop owner.
 *
 * The salon id is never hardcoded, never taken from client input or
 * localStorage, and never "the first salon row". It is derived from the
 * authenticated Supabase session through the existing membership table.
 *
 * Existing relationship discovered on the live schema (PostgREST FK metadata):
 *   public.job_salon_members
 *     - job_salon_members_user_id_fkey  (user_id  -> profiles/auth user)
 *     - job_salon_members_salon_id_fkey (salon_id -> salons.id)
 *     - member_role, status
 *
 * No table, column or relationship was created for this feature.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Existing membership table linking an authenticated user to a salon. */
export const SALON_MEMBER_TABLE = 'job_salon_members';

/**
 * Roles that may edit a salon's location. `member_role` is free text in the
 * live schema, so matching is case-insensitive and limited to owner-like
 * roles. A member whose role is not listed cannot edit the location.
 */
const OWNER_ROLES = ['owner', 'admin', 'manager'];

export type OwnerSalonResolution =
  | { status: 'resolved'; salonId: string }
  | { status: 'not-configured' }
  | { status: 'not-authenticated' }
  | { status: 'no-membership' }
  | { status: 'ambiguous' }
  | { status: 'permission-denied' }
  | { status: 'error' };

/** Authenticated user id from the real session, or null when signed out. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

interface MembershipRow {
  salon_id: string | null;
  member_role: string | null;
  status: string | null;
}

/**
 * Resolve the authenticated owner's salon id via the existing membership
 * table. Anything other than `resolved` means: do not write to any salon.
 */
export async function resolveOwnerSalonId(): Promise<OwnerSalonResolution> {
  if (!isSupabaseConfigured || !supabase) return { status: 'not-configured' };

  const userId = await getAuthenticatedUserId();
  if (!userId) return { status: 'not-authenticated' };

  // Scoped to the authenticated user only. RLS still applies on top of this.
  const { data, error } = await supabase
    .from(SALON_MEMBER_TABLE)
    .select('salon_id, member_role, status')
    .eq('user_id', userId);

  if (error) {
    // 42501 = insufficient privilege; PGRST301 = JWT/RLS rejection.
    const code = (error as { code?: string }).code;
    if (code === '42501' || code === 'PGRST301') {
      return { status: 'permission-denied' };
    }
    console.error('Failed to resolve owner salon membership:', error);
    return { status: 'error' };
  }

  const rows = (data ?? []) as MembershipRow[];

  const ownerSalonIds = Array.from(
    new Set(
      rows
        .filter((row) => {
          if (!row.salon_id) return false;
          // Ignore memberships that are explicitly not active.
          if (row.status && !['active', 'accepted', 'approved'].includes(row.status.toLowerCase())) {
            return false;
          }
          const role = row.member_role?.toLowerCase().trim();
          return role ? OWNER_ROLES.includes(role) : false;
        })
        .map((row) => row.salon_id as string),
    ),
  );

  if (ownerSalonIds.length === 0) return { status: 'no-membership' };

  // More than one owned salon: refuse to pick one arbitrarily.
  if (ownerSalonIds.length > 1) return { status: 'ambiguous' };

  return { status: 'resolved', salonId: ownerSalonIds[0] };
}

/** User-facing message. Never exposes SQL, tokens or database internals. */
export function ownerSalonMessage(resolution: OwnerSalonResolution): string {
  switch (resolution.status) {
    case 'not-configured':
      return 'Shop location is unavailable right now. Please try again later.';
    case 'not-authenticated':
      return 'Please sign in to edit your shop location.';
    case 'permission-denied':
      return 'You do not have permission to edit this shop location.';
    case 'ambiguous':
      return 'Multiple shops are linked to your account. Please select a shop first.';
    case 'no-membership':
    case 'error':
      return 'Unable to determine your shop.';
    default:
      return '';
  }
}
