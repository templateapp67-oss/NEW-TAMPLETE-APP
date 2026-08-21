-- M28 (DRAFT): tenant-owned white-label hostnames and public branding.
-- Apply only after the existing migration plan has been approved and deployed.
begin;

create type public.nexora_tenant_domain_status as enum ('pending', 'active', 'failed');

create table public.tenant_domains (
  salon_id uuid primary key references public.salons(id) on delete cascade,
  subdomain text not null unique,
  custom_domain text unique,
  brand_name text not null,
  logo_url text,
  favicon_url text,
  primary_color text not null default '#ac0053',
  secondary_color text not null default '#3f001a',
  is_published boolean not null default false,
  domain_status public.nexora_tenant_domain_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_domains_subdomain_format check (subdomain ~ '^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$'),
  constraint tenant_domains_subdomain_reserved check (subdomain not in ('app','api','admin','www','dashboard','mail','assets')),
  constraint tenant_domains_primary_hex check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint tenant_domains_secondary_hex check (secondary_color ~ '^#[0-9A-Fa-f]{6}$')
);
create index tenant_domains_subdomain_idx on public.tenant_domains (subdomain);

alter table public.tenant_domains enable row level security;
grant select on public.tenant_domains to anon, authenticated;
grant insert, update, delete on public.tenant_domains to authenticated;
grant all on public.tenant_domains to service_role;

-- Public users can only resolve a live tenant. Owners can read/write their own salon.
create policy tenant_domains_public_published on public.tenant_domains for select to anon, authenticated
  using (is_published or salon_id = any(public.nexora_owner_salon_ids()));
create policy tenant_domains_owner_insert on public.tenant_domains for insert to authenticated
  with check (salon_id = any(public.nexora_owner_salon_ids()));
create policy tenant_domains_owner_update on public.tenant_domains for update to authenticated
  using (salon_id = any(public.nexora_owner_salon_ids()))
  with check (salon_id = any(public.nexora_owner_salon_ids()));
create policy tenant_domains_owner_delete on public.tenant_domains for delete to authenticated
  using (salon_id = any(public.nexora_owner_salon_ids()));

-- Availability must include unpublished claims without disclosing tenant data.
create or replace function public.nexora_subdomain_available(candidate text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists(select 1 from public.tenant_domains where subdomain = lower(trim(candidate)));
$$;
grant execute on function public.nexora_subdomain_available(text) to anon, authenticated;

commit;
