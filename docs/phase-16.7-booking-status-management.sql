-- =====================================================================
-- PHASE 16.7 — REAL OWNER BOOKING MANAGEMENT (LIVE EXISTING SCHEMA)
-- =====================================================================
-- Existing tables only: bookings, booking_items, salon_customers, salons,
-- organization_members, salon_public_websites. No payment object is read or
-- changed. Apply manually after reviewing the live schema introspection.
-- =====================================================================

begin;

alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;

-- Owners may read only bookings/items belonging to salons reached through the
-- canonical organization_members -> salons.organization_id relationship.
grant select on public.bookings, public.booking_items to authenticated;

do $do$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'bookings'
      and policyname = 'bookings_owner_select'
  ) then
    create policy bookings_owner_select on public.bookings for select to authenticated
      using (exists (
        select 1
        from public.salons s
        join public.organization_members m on m.organization_id = s.organization_id
        where s.id = bookings.salon_id
          and s.deleted_at is null
          and m.user_id = auth.uid()
          and lower(m.role::text) in ('owner', 'owner_admin')
          and lower(coalesce(m.status::text, 'active')) = 'active'
      ));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'booking_items'
      and policyname = 'booking_items_owner_select'
  ) then
    create policy booking_items_owner_select on public.booking_items for select to authenticated
      using (exists (
        select 1
        from public.bookings b
        join public.salons s on s.id = b.salon_id
        join public.organization_members m on m.organization_id = s.organization_id
        where b.id = booking_items.booking_id
          and s.deleted_at is null
          and m.user_id = auth.uid()
          and lower(m.role::text) in ('owner', 'owner_admin')
          and lower(coalesce(m.status::text, 'active')) = 'active'
      ));
  end if;
end
$do$;

-- One server-authorized read shape for the owner management panel. Salon scope
-- is derived from auth.uid(); no salon/customer id is accepted from the client.
create or replace function public.get_owner_bookings()
returns jsonb
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $function$
  select coalesce(jsonb_agg(result order by (result->'booking'->>'created_at') desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'template_key', w.template_key::text,
      'booking', to_jsonb(b),
      'items', coalesce((
        select jsonb_agg(to_jsonb(i) order by i.id)
        from public.booking_items i where i.booking_id = b.id
      ), '[]'::jsonb),
      'customer', jsonb_build_object(
        'name', coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', ''), u.email, 'Customer'),
        'email', u.email,
        'phone', coalesce(sc.phone, u.phone)
      )
    ) as result
    from public.bookings b
    join public.salons s on s.id = b.salon_id and s.deleted_at is null
    join public.organization_members m on m.organization_id = s.organization_id
      and m.user_id = auth.uid()
      and lower(m.role::text) in ('owner', 'owner_admin')
      and lower(coalesce(m.status::text, 'active')) = 'active'
    left join public.salon_public_websites w on w.salon_id = s.id
    left join public.salon_customers sc on sc.salon_id = b.salon_id and sc.customer_user_id = b.customer_user_id
    left join auth.users u on u.id = b.customer_user_id
  ) rows
$function$;

-- Optimistic, duplicate-safe status mutation. The booking id and expected
-- current status are checked under a row lock; salon authority is derived only
-- through auth.uid() and organization membership. Payment columns/tables are
-- intentionally absent.
create or replace function public.update_owner_booking_status(
  p_booking_id uuid,
  p_expected_status text,
  p_next_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  current_booking public.bookings%rowtype;
  desired_booking public.bookings%rowtype;
  current_status text;
  next_status text := lower(btrim(coalesce(p_next_status, '')));
  template_key text;
  items jsonb;
begin
  if auth.uid() is null then raise exception 'Please log in as a salon owner'; end if;

  select b.* into current_booking
  from public.bookings b
  join public.salons s on s.id = b.salon_id and s.deleted_at is null
  join public.organization_members m on m.organization_id = s.organization_id
  where b.id = p_booking_id
    and m.user_id = auth.uid()
    and lower(m.role::text) in ('owner', 'owner_admin')
    and lower(coalesce(m.status::text, 'active')) = 'active'
  for update of b;

  if not found then raise exception 'Booking not found or permission denied'; end if;
  current_status := lower(current_booking.status::text);
  if current_status <> lower(btrim(coalesce(p_expected_status, ''))) then
    raise exception 'Booking status changed; refresh and try again';
  end if;
  if current_status = next_status then raise exception 'Booking already has that status'; end if;

  if not (
    (current_status in ('pending', 'pending_payment') and next_status in ('confirmed', 'cancelled'))
    or (current_status in ('confirmed', 'upcoming') and next_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid booking status transition';
  end if;

  -- jsonb_populate_record converts the validated text into the live status
  -- column's actual type (text/enum) without assuming its PostgreSQL type name.
  desired_booking := jsonb_populate_record(current_booking, jsonb_build_object('status', next_status));
  update public.bookings set status = desired_booking.status where id = current_booking.id
    returning * into current_booking;

  select w.template_key::text into template_key
  from public.salon_public_websites w where w.salon_id = current_booking.salon_id limit 1;
  select coalesce(jsonb_agg(to_jsonb(i) order by i.id), '[]'::jsonb) into items
  from public.booking_items i where i.booking_id = current_booking.id;

  return jsonb_build_object(
    'template_key', template_key,
    'booking', to_jsonb(current_booking),
    'items', items,
    'customer', (
      select jsonb_build_object(
        'name', coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', ''), u.email, 'Customer'),
        'email', u.email,
        'phone', coalesce(sc.phone, u.phone)
      )
      from auth.users u
      left join public.salon_customers sc
        on sc.salon_id = current_booking.salon_id
       and sc.customer_user_id = current_booking.customer_user_id
      where u.id = current_booking.customer_user_id
    )
  );
end
$function$;

revoke all on function public.get_owner_bookings() from public, anon;
grant execute on function public.get_owner_bookings() to authenticated;
revoke all on function public.update_owner_booking_status(uuid, text, text) from public, anon;
grant execute on function public.update_owner_booking_status(uuid, text, text) to authenticated;

commit;
