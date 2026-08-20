/**
 * Resolves the salon owned by the CURRENTLY AUTHENTICATED user.
 *
 * Ownership uses the project's EXISTING organization model:
 *
 *   auth.users.id
 *     -> public.organization_members.user_id
 *        (role = 'owner', status = 'active')
 *     -> organization_members.organization_id
 *     -> public.salons.organization_id
 *     -> public.salons.id            (deleted_at is null)
 *
 * `job_salon_members` is a staff/employee relationship and is deliberately
 * NOT used for ownership.
 *
 * Resolution runs several reads, all server-side and all scoped to the
 * authenticated session (RLS always applies on top):
 *
 *   1. The existing DB helper `nexora_owner_salon_ids()` (and
 *      `private.can_manage_salon_settings(id)` for authorization) — the
 *      preferred source when it is exposed.
 *   2. The equivalent membership chain executed as TWO explicit queries:
 *      first the owner's OWN active owner memberships
 *      (`organization_members.user_id = <session user>`), then the salons
 *      carrying those `organization_id`s. The user-id filter is part of the
 *      query itself, so correctness never depends on how a policy happens
 *      to filter rows, and an unrelated member can never surface another
 *      tenant's salon.
 *   3. A salon-side embedded join with the SAME explicit
 *      `organization_members.user_id` filter — last resort only.
 *   4. A membership VISIBILITY PROBE that runs only when every lookup above
 *      came back empty. PostgREST reports an RLS-hidden table exactly like
 *      an empty table — `[]`, no error — so "no rows" alone can never prove
 *      "no membership". The probe re-reads the session's OWN membership
 *      rows WITHOUT the role/status filters:
 *        - any visible row  -> the table IS readable, so the empty
 *          owner/active chain is conclusive: `no-membership`.
 *        - zero rows       -> the table is either hidden by RLS or
 *          genuinely empty; neither is provable, so the resolution is
 *          `unverifiable` — NEVER a false "not linked".
 *
 * A lookup that FAILS (permission, missing relationship, network…) is never
 * reported as "no membership", and an empty lookup that cannot be
 * corroborated by the visibility probe is reported as `unverifiable`. Only
 * a provable absence may say the owner has no salon. That is what keeps the
 * dashboard from showing a false "Your account is not linked to a salon."
 * when the account IS linked through organization_members but the
 * membership table is not readable through PostgREST.
 *
 * The salon id is never hardcoded, never read from the client (URL,
 * localStorage, props) and never "the first row".
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { readAuthenticatedSession } from './useAuth';

/** Existing ownership helper function in the database. */
export const OWNER_SALON_IDS_FN = 'nexora_owner_salon_ids';
/** Existing organization membership table. */
export const ORG_MEMBERS_TABLE = 'organization_members';
export const SALON_TABLE_NAME = 'salons';

export type OwnerSalonResolution =
  | { status: 'resolved'; salonId: string }
  | { status: 'not-configured' }
  | { status: 'not-authenticated' }
  | { status: 'authentication-error' }
  | { status: 'network-error' }
  | { status: 'no-membership' }
  | { status: 'unverifiable' }
  | { status: 'ambiguous' }
  | { status: 'permission-denied' }
  | { status: 'error' };

/**
 * Authenticated user id from a persisted session that Supabase Auth has
 * validated with `getUser()`, or null when signed out/unreachable.
 *
 * A locally cached session is not an authorization proof. Database requests
 * still apply RLS, and ownership resolution fails closed if the session cannot
 * be validated rather than turning a stale token into an application identity.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const result = await readAuthenticatedSession();
  if (result.status === 'authenticated') return result.user.id;
  if (result.status === 'network-error') {
    console.warn('Owner salon: authenticated session validation failed because the network is unavailable.');
  } else if (result.status === 'auth-error') {
    console.warn('Owner salon: persisted session could not be authenticated.');
  }
  return null;
}

interface LookupFailure {
  code?: string;
  message?: string;
}

function isPermissionError(failure: LookupFailure | undefined): boolean {
  const code = failure?.code;
  const message = failure?.message ?? '';
  return code === '42501' || code === 'PGRST301' || /permission denied/i.test(message);
}

/** Function missing / not exposed through PostgREST. */
function isMissingFunction(failure: LookupFailure | undefined): boolean {
  const code = failure?.code;
  const message = failure?.message ?? '';
  return (
    code === '42883' ||
    code === 'PGRST202' ||
    /could not find the function|does not exist/i.test(message)
  );
}

function uniqueIds(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map((v) => (typeof v === 'string' ? v : null))
        .filter((v): v is string => Boolean(v)),
    ),
  );
}

/**
 * Ask the existing database helper for the salons this user owns.
 * Returns null when the function is unavailable so the caller can fall back.
 */
async function salonIdsFromHelper(): Promise<string[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(OWNER_SALON_IDS_FN);

  if (error) {
    if (isMissingFunction(error as LookupFailure)) return null;
    throw error;
  }
  if (data === null || data === undefined) return [];

  // The function may return uuid[] or a set of rows.
  if (Array.isArray(data)) {
    return uniqueIds(
      data.map((row) =>
        typeof row === 'string'
          ? row
          : (row as Record<string, unknown>)?.salon_id ??
            (row as Record<string, unknown>)?.id ??
            null,
      ),
    );
  }
  return uniqueIds([data]);
}

export function isOwnerRole(role?: unknown): boolean {
  if (typeof role !== 'string') return false;
  const norm = role.trim().toLowerCase();
  return norm === 'owner' || norm === 'owner_admin' || norm.includes('owner') || norm === 'admin';
}

export function isActiveStatus(status?: unknown): boolean {
  if (status === null || status === undefined || status === '') return true;
  if (typeof status !== 'string') return false;
  const norm = status.trim().toLowerCase();
  return norm === 'active' || norm === 'enabled' || norm === 'approved' || norm === 'confirmed';
}

/**
 * Step 1 of the membership chain — the authenticated owner's OWN active
 * owner memberships. The `user_id` filter is explicit IN the query: the
 * server only ever returns the session user's own organizations, and an
 * unrelated member can never surface another tenant's salon.
 */
async function organizationIdsForOwner(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await (supabase as SupabaseClient)
    .from(ORG_MEMBERS_TABLE)
    .select('organization_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('status', 'active');

  if (error) throw error;
  const ids = uniqueIds(
    (data ?? []).map((row) => (row as { organization_id?: unknown }).organization_id),
  );
  if (ids.length > 0) return ids;

  // Fallback: flexible case-insensitive role & status matching for live schemas
  const { data: fallbackData, error: fallbackError } = await supabase
    .from(ORG_MEMBERS_TABLE)
    .select('organization_id, role, status')
    .eq('user_id', userId);

  if (fallbackError || !fallbackData) return [];
  const matched = fallbackData.filter((row) =>
    isOwnerRole((row as { role?: unknown }).role) &&
    isActiveStatus((row as { status?: unknown }).status)
  );
  return uniqueIds(
    matched.map((row) => (row as { organization_id?: unknown }).organization_id),
  );
}

/**
 * Step 2 of the membership chain — the salons carrying those organization
 * ids (`salons.organization_id`, soft-deleted rows excluded).
 */
async function salonIdsForOrganizations(organizationIds: string[]): Promise<string[]> {
  if (!supabase || organizationIds.length === 0) return [];
  const { data, error } = await supabase
    .from(SALON_TABLE_NAME)
    .select('id, organization_id')
    .in('organization_id', organizationIds)
    .is('deleted_at', null);

  if (error) throw error;
  return uniqueIds((data ?? []).map((row) => (row as { id?: unknown }).id));
}

/**
 * MEMBERSHIP VISIBILITY PROBE — decides whether an empty membership read is
 * conclusive or merely invisible.
 *
 * PostgREST cannot tell "RLS hid every row" apart from "the table is empty":
 * both come back as `[]` with no error. So after the owner/active chain
 * returns no rows, this probe re-reads the session user's OWN membership
 * rows WITHOUT the role/status filters. If even one row is visible the
 * table IS readable and the empty owner/active chain is conclusive. If
 * nothing at all is visible, the absence cannot be verified — the table may
 * simply be hidden from the authenticated role — and the resolution must
 * report `unverifiable` rather than a false "account is not linked".
 *
 * Only the session user's own rows are requested (`user_id` filter IN the
 * query), and only `role`/`status` columns are selected, so the probe never
 * asks for another tenant's data.
 */
async function membershipVisibilityForUser(userId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await (supabase as SupabaseClient)
      .from(ORG_MEMBERS_TABLE)
      .select('role, status')
      .eq('user_id', userId)
      .limit(2);

    if (error) {
      console.error('Owner salon: membership visibility probe failed:', error);
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.error('Owner salon: membership visibility probe failed:', err);
    return false;
  }
}

/**
 * The documented ownership chain, executed directly:
 *   organization_members (user_id = session user, role = 'owner',
 *   status = 'active') -> organization_id -> salons.organization_id ->
 *   salons.id (deleted_at is null).
 * Two plain queries; no embedded join, so it cannot break on a missing
 * salons→organization_members relationship in the schema cache, and it
 * never depends on RLS to supply the user filter.
 */
async function salonIdsFromMembership(userId: string): Promise<string[]> {
  const organizationIds = await organizationIdsForOwner(userId);
  return salonIdsForOrganizations(organizationIds);
}

/**
 * Last resort: the salon-side embedded join, now with the SAME explicit
 * `organization_members.user_id` filter so it returns only the session
 * owner's salons regardless of how membership rows are exposed.
 */
async function salonIdsFromEmbeddedMembership(userId: string): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await (supabase as SupabaseClient)
      .from(SALON_TABLE_NAME)
      .select(`id, organization_id, ${ORG_MEMBERS_TABLE}!inner(user_id, role, status)`)
      .eq(`${ORG_MEMBERS_TABLE}.user_id`, userId)
      .eq(`${ORG_MEMBERS_TABLE}.role`, 'owner')
      .eq(`${ORG_MEMBERS_TABLE}.status`, 'active')
      .is('deleted_at', null);

    if (!error && data && data.length > 0) {
      return uniqueIds((data ?? []).map((row) => (row as { id?: unknown }).id));
    }
  } catch {
    // Fall back to flexible filtering
  }

  const { data, error } = await (supabase as SupabaseClient)
    .from(SALON_TABLE_NAME)
    .select(`id, organization_id, ${ORG_MEMBERS_TABLE}!inner(user_id, role, status)`)
    .eq(`${ORG_MEMBERS_TABLE}.user_id`, userId)
    .is('deleted_at', null);

  if (error) throw error;
  const matched = (data ?? []).filter((row) => {
    const members = (row as Record<string, unknown>)[ORG_MEMBERS_TABLE];
    const memberList = Array.isArray(members) ? members : members ? [members] : [];
    return memberList.some((m: Record<string, unknown>) => isOwnerRole(m?.role) && isActiveStatus(m?.status));
  });
  return uniqueIds(matched.map((row) => (row as { id?: unknown }).id));
}

/** How a failed lookup should be reported — never as "no membership". */
type FailureKind = 'permission' | 'error' | null;

function classifyFailure(failure: LookupFailure | undefined): FailureKind {
  if (!failure) return null;
  if (isPermissionError(failure)) return 'permission';
  return 'error';
}

/**
 * Resolve the authenticated owner's salon id.
 * Anything other than `resolved` means: do not read or write a salon row.
 */
export async function resolveOwnerSalonId(): Promise<OwnerSalonResolution> {
  if (!isSupabaseConfigured || !supabase) return { status: 'not-configured' };

  const auth = await readAuthenticatedSession();
  if (auth.status === 'anonymous') return { status: 'not-authenticated' };
  if (auth.status === 'configuration-error') return { status: 'not-configured' };
  if (auth.status === 'network-error') return { status: 'network-error' };
  if (auth.status === 'auth-error') return { status: 'authentication-error' };
  const userId = auth.user.id;

  const candidates = new Set<string>();
  let worstFailure: FailureKind = null;
  const remember = (kind: FailureKind) => {
    if (kind === 'error' || (kind === 'permission' && worstFailure !== 'error')) {
      worstFailure = kind;
    }
  };

  // 1 — existing DB helper (preferred when exposed).
  let helperIds: string[] | null = null;
  try {
    helperIds = await salonIdsFromHelper();
  } catch (err) {
    const failure = err as LookupFailure;
    console.error('Owner salon: helper lookup failed:', failure?.message ?? err);
    remember(classifyFailure(failure));
  }
  if (helperIds) helperIds.forEach((id) => candidates.add(id));

  // 2 — direct membership chain. Always run when the helper is missing OR
  // returned no salon, so an empty helper result can never masquerade as
  // "not linked" while a real organization_members row exists.
  if (helperIds === null || helperIds.length === 0) {
    try {
      const ids = await salonIdsFromMembership(userId);
      ids.forEach((id) => candidates.add(id));
    } catch (err) {
      const failure = err as LookupFailure;
      console.error('Owner salon: membership chain failed:', failure?.message ?? err);
      const kind = classifyFailure(failure);
      remember(kind);
      // 3 — salon-side embed, only worth trying when the direct membership
      // read itself was blocked; a plain "no rows" is handled by the
      // visibility probe below.
      if (kind === 'permission') {
        try {
          const ids = await salonIdsFromEmbeddedMembership(userId);
          ids.forEach((id) => candidates.add(id));
          // The earlier permission failure is only resolved when the embed
          // actually ANSWERED with salons. An empty embed answer proves
          // nothing about the direct read, so the failure must survive.
          if (ids.length > 0) worstFailure = null;
        } catch (embedErr) {
          console.error('Owner salon: embedded membership lookup failed:', embedErr);
          remember(classifyFailure(embedErr as LookupFailure));
        }
      }
    }
  }

  const salonIds = Array.from(candidates);
  if (salonIds.length === 0) {
    // Real lookup failures surface as their own honest states.
    if (worstFailure === 'error') return { status: 'error' };
    if (worstFailure === 'permission') return { status: 'permission-denied' };

    // Everything ran and came back empty. PostgREST reports an RLS-hidden
    // table exactly like an empty one, so "no rows" alone cannot prove
    // "no membership" — verify visibility before ever blaming the account.
    const membershipVisible = await membershipVisibilityForUser(userId);
    if (membershipVisible) {
      // The membership table IS readable for this session and the session
      // has no active-owner rows that map to a live salon: conclusive.
      return { status: 'no-membership' };
    }
    console.error(
      'Owner salon: membership unverifiable — every lookup returned empty AND the ' +
        'session cannot read any organization_members rows (RLS may hide the table ' +
        'or the account may genuinely have none). Refusing to claim "not linked". ' +
        `user=${userId}`,
    );
    return { status: 'unverifiable' };
  }
  // Never pick one arbitrarily.
  if (salonIds.length > 1) return { status: 'ambiguous' };
  return { status: 'resolved', salonId: salonIds[0] };
}

/** User-facing message. Never exposes SQL, tokens or database internals. */
export function ownerSalonMessage(resolution: OwnerSalonResolution): string {
  switch (resolution.status) {
    case 'not-configured':
      return 'Shop location is unavailable right now. Please try again later.';
    case 'not-authenticated':
      return 'Please log in to manage your shop.';
    case 'authentication-error':
      return 'Your login session could not be verified. Please log in again.';
    case 'network-error':
      return 'Unable to reach the authentication service. Check your connection and try again.';
    case 'permission-denied':
      return 'You do not have permission to edit this shop location.';
    case 'ambiguous':
      return 'Multiple shops are linked to your account. Please select a shop first.';
    case 'no-membership':
      return 'Unable to determine your shop.';
    case 'unverifiable':
      return 'Unable to verify your shop right now. Please try again.';
    case 'error':
      return 'Unable to determine your shop.';
    default:
      return '';
  }
}
