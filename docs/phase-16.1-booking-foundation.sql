-- =====================================================================
-- PHASE 16.1 — REAL SUPABASE BOOKING FOUNDATION (LIVE EXISTING SCHEMA)
-- =====================================================================
-- Existing live tables/columns verified before authoring:
--
--   public.bookings
--     id, salon_id, customer_user_id, staff_id, booking_number,
--     appointment_start, appointment_end, status, total_paise, currency,
--     customer_note, source, created_by, started_at, completed_at,
--     cancelled_at, created_at, updated_at
--
--   public.booking_items
--     id, booking_id, service_id, quantity, unit_price_paise,
--     line_total_paise, service_name_snapshot, duration_minutes_snapshot
--
--   public.services
--     id, salon_id, name, price_paise, duration_minutes, is_active
--
--   public.salon_customers
--     id, salon_id, customer_user_id, email, phone, created_at
--
-- This is an additive, idempotent correction over those existing objects:
-- no booking/customer/service/salon table or column is created or renamed.
-- No payment, refund, cancellation, reschedule, slot hold or availability
-- transaction is implemented here.
--
-- Temporary browser storage retained for Phase 16 compatibility only:
--   nexora_site_booking_drafts  — resumable, pre-confirmation form state;
--   nexora_site_booking_holds   — client-side availability hints;
--   nexora_site_booking_browser — legacy unconfigured-build identity;
--   nexora_site_payment_records — legacy unconfigured payment sandbox.
-- None is read as booking/customer authority when Supabase is configured.
-- =====================================================================

begin;

alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.salon_customers enable row level security;

-- Customers may read only their own booking/customer rows. Owner/staff policies
-- already present on these tables remain untouched; permissive policies OR.
grant select on public.bookings to authenticated;
grant select on public.booking_items to authenticated;
grant select on public.salon_customers to authenticated;

do $do$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings'
      and policyname = 'bookings_customer_self_select'
  ) then
    create policy bookings_customer_self_select
      on public.bookings
      for select
      to authenticated
      using (customer_user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_items'
      and policyname = 'booking_items_customer_self_select'
  ) then
    create policy booking_items_customer_self_select
      on public.booking_items
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.bookings b
          where b.id = booking_items.booking_id
            and b.customer_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'salon_customers'
      and policyname = 'salon_customers_customer_self_select'
  ) then
    create policy salon_customers_customer_self_select
      on public.salon_customers
      for select
      to authenticated
      using (customer_user_id = auth.uid());
  end if;
end
$do$;

-- The browser never supplies a customer id, booking id/reference, status or
-- amount. auth.uid(), live service rows and database defaults are authoritative.
create or replace function public.create_customer_booking(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_appointment_start timestamptz,
  p_customer_note text default null,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  caller uuid := auth.uid();
  clean_service_ids uuid[];
  service_count integer;
  requested_count integer;
  total bigint;
  total_duration integer;
  auth_email text;
  auth_phone text;
  created_booking public.bookings%rowtype;
  created_items jsonb;
begin
  if caller is null then
    raise exception 'Please log in to create a booking';
  end if;

  if p_salon_id is null or not exists (
    select 1
    from public.salons s
    where s.id = p_salon_id
      and s.is_active = true
      and s.deleted_at is null
  ) then
    raise exception 'This salon is not available for booking';
  end if;

  select coalesce(array_agg(distinct value order by value), '{}'::uuid[])
  into clean_service_ids
  from unnest(coalesce(p_service_ids, '{}'::uuid[])) value;

  requested_count := coalesce(array_length(clean_service_ids, 1), 0);
  if requested_count < 1 or requested_count > 6 then
    raise exception 'Select between one and six services';
  end if;

  if p_appointment_start is null or p_appointment_start <= now() then
    raise exception 'Choose a valid future appointment time';
  end if;

  select
    count(*)::integer,
    coalesce(sum(s.price_paise), 0)::bigint,
    coalesce(sum(s.duration_minutes), 0)::integer
  into service_count, total, total_duration
  from public.services s
  where s.id = any(clean_service_ids)
    and s.salon_id = p_salon_id
    and s.is_active = true;

  if service_count <> requested_count then
    raise exception 'One or more services are inactive or belong to another salon';
  end if;
  if total < 0 then
    raise exception 'The booking total is invalid';
  end if;
  if total_duration < 1 then
    raise exception 'The booking duration is invalid';
  end if;

  -- Reuse the existing salon_customers identity relationship. Contact fields
  -- are supplemental only; customer identity always comes from auth.uid().
  select u.email, u.phone into auth_email, auth_phone
  from auth.users u where u.id = caller;

  update public.salon_customers
  set email = coalesce(auth_email, email),
      phone = coalesce(nullif(btrim(p_phone), ''), auth_phone, phone)
  where salon_id = p_salon_id
    and customer_user_id = caller;

  if not found then
    insert into public.salon_customers (salon_id, customer_user_id, email, phone)
    values (
      p_salon_id,
      caller,
      auth_email,
      coalesce(nullif(btrim(p_phone), ''), auth_phone)
    );
  end if;

  -- `status`, `booking_number`, timestamps and lifecycle fields use the live
  -- table's existing defaults. No new booking status/reference is invented.
  insert into public.bookings (
    salon_id,
    customer_user_id,
    staff_id,
    appointment_start,
    appointment_end,
    total_paise,
    currency,
    customer_note,
    created_by
  ) values (
    p_salon_id,
    caller,
    null,
    p_appointment_start,
    p_appointment_start + make_interval(mins => total_duration),
    total,
    'INR',
    nullif(btrim(p_customer_note), ''),
    caller
  )
  returning * into created_booking;

  insert into public.booking_items (
    booking_id,
    service_id,
    quantity,
    unit_price_paise,
    line_total_paise,
    service_name_snapshot,
    duration_minutes_snapshot
  )
  select
    created_booking.id,
    s.id,
    1,
    s.price_paise,
    s.price_paise,
    s.name,
    s.duration_minutes
  from public.services s
  where s.id = any(clean_service_ids)
    and s.salon_id = p_salon_id
    and s.is_active = true;

  select coalesce(jsonb_agg(to_jsonb(i) order by i.id), '[]'::jsonb)
  into created_items
  from public.booking_items i
  where i.booking_id = created_booking.id;

  return jsonb_build_object(
    'booking', to_jsonb(created_booking),
    'items', created_items
  );
end
$function$;

revoke all on function public.create_customer_booking(
  uuid, uuid[], timestamptz, text, text
) from public;
revoke all on function public.create_customer_booking(
  uuid, uuid[], timestamptz, text, text
) from anon;
grant execute on function public.create_customer_booking(
  uuid, uuid[], timestamptz, text, text
) to authenticated;

commit;
