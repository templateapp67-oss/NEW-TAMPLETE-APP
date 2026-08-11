-- =====================================================================
-- Nexora — link a REAL authenticated owner to a REAL existing salon
-- =====================================================================
--
-- Why this file exists
--   The owner location editor resolves the salon dynamically from the
--   authenticated Supabase session via the EXISTING relationship:
--
--       auth.users.id
--         -> public.job_salon_members.user_id
--         -> public.job_salon_members.salon_id
--         -> public.salons.id
--
--   `public.job_salon_members` is currently EMPTY, so no signed-in user
--   resolves to a salon and the editor correctly refuses to save
--   ("Unable to determine your shop.").
--
-- IMPORTANT
--   * Run this MANUALLY in the Supabase SQL editor. The application never
--     executes it.
--   * No table, column or migration is created here. `job_salon_members`
--     and `salons` already exist.
--   * Nothing below invents an id. Every id is looked up from real rows;
--     if the email or salon name does not exist, the statement inserts
--     nothing rather than writing a fabricated value.
--
-- Verified live schema (read-only inspection):
--   public.job_salon_members(salon_id, user_id, member_role, status,
--                            created_at, updated_at)   -- no `id` column
--   public.salons(id, name, address, latitude, longitude,
--                 location_confirmed, location_confirmed_at,
--                 phone, city, slug, is_active, created_at, ...)
-- =====================================================================


-- ---------------------------------------------------------------------
-- STEP 1 — Confirm the real owner account exists.
--          The user must already have signed up through Supabase Auth.
-- ---------------------------------------------------------------------
select id as user_id, email, created_at
from auth.users
where email = 'REPLACE_WITH_REAL_OWNER_EMAIL'   -- <-- the owner's real login email
;


-- ---------------------------------------------------------------------
-- STEP 2 — Find the real salon this owner should manage.
--          Pick the correct row from the results before continuing.
-- ---------------------------------------------------------------------
select id as salon_id, name, address, city, latitude, longitude
from public.salons
order by created_at desc
limit 50;


-- ---------------------------------------------------------------------
-- STEP 3 — Create the membership.
--
-- Both ids are resolved by lookup, so no value is invented. Replace only
-- the two REPLACE_WITH_* literals with real values you confirmed above.
--
-- `member_role` must be one of the roles the application treats as an
-- owner: 'owner', 'admin' or 'manager' (matched case-insensitively).
-- `status` must be 'active' (also accepted: 'accepted', 'approved').
-- ---------------------------------------------------------------------
insert into public.job_salon_members (salon_id, user_id, member_role, status)
select
    s.id,
    u.id,
    'owner',
    'active'
from auth.users        as u
cross join public.salons as s
where u.email = 'REPLACE_WITH_REAL_OWNER_EMAIL'
  and s.id    = 'REPLACE_WITH_REAL_SALON_UUID'::uuid
on conflict do nothing;


-- ---------------------------------------------------------------------
-- STEP 4 — Verify the membership resolves.
--          Expect exactly ONE row. More than one owner-role salon for the
--          same user makes resolution ambiguous and the app will refuse
--          to save rather than guess.
-- ---------------------------------------------------------------------
select m.user_id, u.email, m.salon_id, s.name, m.member_role, m.status
from public.job_salon_members as m
join auth.users              as u on u.id = m.user_id
join public.salons           as s on s.id = m.salon_id
where u.email = 'REPLACE_WITH_REAL_OWNER_EMAIL';


-- =====================================================================
-- OPTIONAL — Authorization for the owner UPDATE
-- =====================================================================
-- Ownership uses job_salon_members (NOT an owner_id column), so the
-- UPDATE policy is expressed through that existing relationship. Apply
-- only if your review confirms it matches your security model.
--
--   alter table public.salons enable row level security;
--
--   create policy "owners update their own salon"
--     on public.salons
--     for update
--     to authenticated
--     using (
--       exists (
--         select 1 from public.job_salon_members m
--         where m.salon_id = salons.id
--           and m.user_id  = auth.uid()
--           and lower(m.member_role) in ('owner','admin','manager')
--           and lower(coalesce(m.status,'active')) in ('active','accepted','approved')
--       )
--     )
--     with check (
--       exists (
--         select 1 from public.job_salon_members m
--         where m.salon_id = salons.id
--           and m.user_id  = auth.uid()
--           and lower(m.member_role) in ('owner','admin','manager')
--           and lower(coalesce(m.status,'active')) in ('active','accepted','approved')
--       )
--     );
--
--   grant update (address, latitude, longitude,
--                 location_confirmed, location_confirmed_at)
--     on public.salons to authenticated;


-- =====================================================================
-- OPTIONAL — Public read for the customer nearby search
-- =====================================================================
-- The customer page needs id/name/address/city/slug/latitude/longitude.
-- `public.salons` also holds non-public columns (e.g. phone), so do NOT
-- run a blanket `grant select on public.salons to anon`.
--
-- Column-scoped grant — exposes ONLY the public listing fields:
--
--   alter table public.salons enable row level security;
--
--   create policy "public may read confirmed salon locations"
--     on public.salons
--     for select
--     to anon
--     using (location_confirmed = true and is_active = true);
--
--   grant select (id, name, address, city, slug, latitude, longitude)
--     on public.salons to anon;
--
-- Review against your privacy requirements before applying. This is a
-- permission/policy change, not a schema change: no table, column or
-- migration is created.
