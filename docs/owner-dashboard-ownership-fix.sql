-- =====================================================================
-- Nexora — Owner Dashboard: minimum live ownership/RLS correction
-- =====================================================================
-- Run MANUALLY in the Supabase SQL editor with a database-owner account.
-- The browser application must never execute this SQL and must never receive
-- a service-role key or database password.
--
-- Existing relationship only:
--   auth.uid()
--     -> public.organization_members.user_id (owner, active)
--     -> organization_members.organization_id
--     -> public.salons.organization_id
--     -> public.salons.id (deleted_at is null)
--
-- This correction is intentionally narrow:
--   * no tables, columns, users, memberships, salons or fake rows are created;
--   * job_salon_members is never read or changed;
--   * RLS is never disabled;
--   * authenticated users may read only their own membership rows;
--   * owner salon reads are restricted to ids returned by the session-derived
--     helper; private salon columns remain ungranted;
--   * the helper is created only when absent, never silently replaced.
--
-- Apply only after confirming organization_members and salons are the live
-- canonical tables. Re-run the application's strict live probe afterwards.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Session-derived helper. A SECURITY DEFINER helper is required because
--    PostgREST cannot distinguish an RLS-hidden membership from no membership.
--    Distinct dollar tags are deliberate: this block is valid PL/pgSQL.
-- ---------------------------------------------------------------------
do $do$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'nexora_owner_salon_ids'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create function public.nexora_owner_salon_ids()
    returns uuid[]
    language sql
    stable
    security definer
    set search_path = public, pg_temp
    as $function$
      select coalesce(array_agg(distinct s.id order by s.id), '{}'::uuid[])
      from public.salons s
      join public.organization_members m
        on m.organization_id = s.organization_id
      where m.user_id = auth.uid()
        and lower(m.role::text) in ('owner', 'owner_admin')
        and lower(coalesce(m.status::text, 'active')) = 'active'
        and s.deleted_at is null
    $function$;
  end if;
end
$do$;

-- PostgreSQL grants function execution to PUBLIC by default. Remove that
-- default and expose this session-derived helper only to authenticated users.
revoke all on function public.nexora_owner_salon_ids() from public;
revoke all on function public.nexora_owner_salon_ids() from anon;
grant execute on function public.nexora_owner_salon_ids() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Direct fallback: own membership rows only.
-- ---------------------------------------------------------------------
grant select (id, organization_id, user_id, role, status)
  on public.organization_members to authenticated;

do $do$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_members'
      and policyname = 'organization_members_own_select'
  ) then
    create policy organization_members_own_select
      on public.organization_members
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end
$do$;

-- ---------------------------------------------------------------------
-- 3. Minimum owner-dashboard salon read. Only columns already consumed by
--    ownerDashboard.ts are granted. RLS still restricts rows to the helper's
--    session-derived salon ids.
-- ---------------------------------------------------------------------
grant select (
  id,
  organization_id,
  name,
  slug,
  address,
  city,
  is_active,
  deleted_at
) on public.salons to authenticated;

do $do$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'salons'
      and policyname = 'salons_owner_dashboard_select'
  ) then
    create policy salons_owner_dashboard_select
      on public.salons
      for select
      to authenticated
      using (
        deleted_at is null
        and exists (
          select 1
          from public.organization_members m
          where m.organization_id = salons.organization_id
            and m.user_id = auth.uid()
            and lower(m.role::text) in ('owner', 'owner_admin')
            and lower(coalesce(m.status::text, 'active')) = 'active'
        )
      );
  end if;
end
$do$;

commit;

-- =====================================================================
-- Verification — run through the authenticated application session, not as
-- the SQL-editor administrator:
--
--   select public.nexora_owner_salon_ids();
--
-- Exactly one UUID is required by the current dashboard. An empty result means
-- the authenticated account has no active owner membership to a non-deleted
-- salon. Multiple UUIDs remain ambiguous by design. Do not insert fake rows.
-- =====================================================================
