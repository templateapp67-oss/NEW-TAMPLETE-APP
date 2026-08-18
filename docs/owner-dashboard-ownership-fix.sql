-- =====================================================================
-- Nexora — Owner Dashboard: restore owner→salon resolution (LIVE fix)
-- =====================================================================
-- Run MANUALLY in the Supabase SQL editor. The application never executes
-- any statement in this file.
--
-- WHY THIS EXISTS
-- ---------------
-- The Owner Dashboard resolves the signed-in owner's salon through the
-- project's EXISTING ownership model:
--
--     auth.users.id
--       -> public.organization_members.user_id   (role='owner', status='active')
--       -> organization_members.organization_id
--       -> public.salons.organization_id
--       -> public.salons.id                      (deleted_at is null)
--
-- When public.organization_members is NOT readable through PostgREST for
-- the authenticated role (RLS with no readable policy returns ZERO rows
-- with NO error), the app cannot distinguish "table hidden by RLS" from
-- "account has no membership". The frontend fix (src/lib/ownerSalon.ts)
-- now reports that case honestly as UNVERIFIABLE instead of a false
-- "Your account is not linked to a salon." — but the dashboard can only
-- actually RENDER the owner's salon when the database exposes the
-- ownership chain. This file is the minimum server-side correction for
-- that, using ONLY existing tables and the documented relationship.
--
-- WHAT THIS FILE DOES (all conditional / idempotent)
-- --------------------------------------------------
--   1. Ensures the EXISTING ownership helper public.nexora_owner_salon_ids()
--      exists — created ONLY when missing — with the exact join already
--      documented in docs/owner-location-setup.sql. It is SECURITY DEFINER,
--      so it reads past RLS and gives the app an authoritative answer even
--      when direct table reads are hidden.
--   2. Grants execute to authenticated (the role the app uses).
--   3. Adds the minimum column SELECT grant and an OWN-ROWS-ONLY policy on
--      organization_members so the app's two-query fallback also works.
--
-- WHAT THIS FILE DOES NOT DO
-- --------------------------
--   - No new tables, no fake membership/salon/user rows, no column changes.
--   - Never touches job_salon_members (staff relation, not ownership).
--   - Never disables RLS and never weakens an existing policy.
--   - Does not apply the M01–M27 draft migrations.
--
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 1 — Ownership helper (create ONLY if missing; never overwrite an
--          existing helper the live project already relies on).
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'nexora_owner_salon_ids'
  ) then
    create function public.nexora_owner_salon_ids()
    returns uuid[]
    language sql
    stable
    security definer
    set search_path = public
    as $$
      select coalesce(array_agg(s.id), '{}'::uuid[])
      from public.salons s
      join public.organization_members m
        on m.organization_id = s.organization_id
      where m.user_id = auth.uid()
        and m.role   = 'owner'
        and m.status = 'active'
        and s.deleted_at is null
    $$;
  end if;
end $$;

grant execute on function public.nexora_owner_salon_ids() to authenticated;

-- ---------------------------------------------------------------------
-- STEP 2 — Minimum read grant on the EXISTING membership table.
--          (Columns the ownership chain reads: id, organization_id,
--           user_id, role, status. Existing columns only.)
-- ---------------------------------------------------------------------
grant select (id, organization_id, user_id, role, status)
  on public.organization_members to authenticated;

-- ---------------------------------------------------------------------
-- STEP 3 — Own-rows SELECT policy (create ONLY if missing). A user can
--          only ever read THEIR OWN membership rows; permissive policies
--          OR together, so an existing policy is never replaced.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'organization_members'
      and policyname = 'organization_members_own_select'
  ) then
    create policy organization_members_own_select
      on public.organization_members
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- ---------------------------------------------------------------------
-- STEP 4 — Verify (run while signed in AS the owner):
--
--   select nexora_owner_salon_ids();
--
--   * Exactly one uuid  -> the Owner Dashboard now renders that salon.
--   * More than one     -> resolution stays AMBIGUOUS by design; the
--                          owner must be linked to exactly one salon.
--   * '{}' (empty)      -> the account genuinely has no active owner
--                          membership. Do NOT insert fake rows — fix the
--                          real membership instead, exactly as described
--                          in docs/owner-location-setup.sql STEP 3.
-- ---------------------------------------------------------------------
