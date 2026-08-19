-- =====================================================================
-- PHASE 16.4 — AUTHENTICATED CUSTOMER DETAILS + DUPLICATE-SAFE RETRY
-- =====================================================================
-- Additive replacement of the existing canonical create_customer_booking RPC.
-- Its name/signature and all Phase 16.1/16.2 relationships remain unchanged.
-- No table, column, customer system, payment behavior, cancellation,
-- reschedule, or race-safe availability transaction is added.
-- =====================================================================

begin;

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
  active_template text;
  clean_service_ids uuid[];
  service_count integer;
  requested_count integer;
  total bigint;
  total_duration integer;
  auth_email text;
  auth_phone text;
  clean_phone text;
  created_booking public.bookings%rowtype;
  existing_booking public.bookings%rowtype;
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

  select w.template_key::text
  into active_template
  from public.salon_public_websites w
  where w.salon_id = p_salon_id
  limit 1;

  if active_template is null then
    raise exception 'This salon website is not available for booking';
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
  if length(coalesce(btrim(p_customer_note), '')) > 1000 then
    raise exception 'Booking notes must be 1000 characters or fewer';
  end if;

  clean_phone := nullif(btrim(p_phone), '');
  if clean_phone is not null and (
    length(clean_phone) > 32
    or length(regexp_replace(clean_phone, '[^0-9]', '', 'g')) < 10
    or length(regexp_replace(clean_phone, '[^0-9]', '', 'g')) > 13
  ) then
    raise exception 'Enter a valid phone number';
  end if;

  select
    count(*)::integer,
    coalesce(sum(s.price_paise), 0)::bigint,
    coalesce(sum(s.duration_minutes), 0)::integer
  into service_count, total, total_duration
  from public.services s
  join public.service_categories c
    on c.id = s.category_id
   and c.is_active = true
  where s.id = any(clean_service_ids)
    and s.salon_id = p_salon_id
    and s.is_active = true;

  if service_count <> requested_count then
    raise exception 'One or more services are inactive or belong to another salon or template';
  end if;
  if total < 0 then
    raise exception 'The booking total is invalid';
  end if;
  if total_duration < 1 then
    raise exception 'The booking duration is invalid';
  end if;

  -- Existing customer relationship only. Identity and email come from the
  -- authenticated auth user; phone is optional contact data, never identity.
  select u.email, u.phone into auth_email, auth_phone
  from auth.users u where u.id = caller;

  update public.salon_customers
  set email = coalesce(auth_email, email),
      phone = coalesce(clean_phone, auth_phone, phone)
  where salon_id = p_salon_id
    and customer_user_id = caller;

  if not found then
    insert into public.salon_customers (salon_id, customer_user_id, email, phone)
    values (p_salon_id, caller, auth_email, coalesce(clean_phone, auth_phone));
  end if;

  -- Sequential browser/network retries for the exact authenticated customer,
  -- salon, slot and service set return the already persisted booking. The UI
  -- lock handles rapid clicks. A race-safe availability transaction remains
  -- deliberately out of scope for this phase.
  select b.*
  into existing_booking
  from public.bookings b
  where b.salon_id = p_salon_id
    and b.customer_user_id = caller
    and b.appointment_start = p_appointment_start
    and (
      select count(*)
      from public.booking_items bi
      where bi.booking_id = b.id
    ) = requested_count
    and not exists (
      select 1
      from public.booking_items bi
      where bi.booking_id = b.id
        and not (bi.service_id = any(clean_service_ids))
    )
    and not exists (
      select 1
      from unnest(clean_service_ids) as selected(service_id)
      where not exists (
        select 1
        from public.booking_items bi
        where bi.booking_id = b.id
          and bi.service_id = selected.service_id
      )
    )
  order by b.created_at desc, b.id
  limit 1;

  if found then
    select coalesce(jsonb_agg(to_jsonb(i) order by i.id), '[]'::jsonb)
    into created_items
    from public.booking_items i
    where i.booking_id = existing_booking.id;

    return jsonb_build_object(
      'template_key', active_template,
      'duplicate', true,
      'booking', to_jsonb(existing_booking),
      'items', created_items
    );
  end if;

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
  join public.service_categories c
    on c.id = s.category_id
   and c.is_active = true
  where s.id = any(clean_service_ids)
    and s.salon_id = p_salon_id
    and s.is_active = true;

  select coalesce(jsonb_agg(to_jsonb(i) order by i.id), '[]'::jsonb)
  into created_items
  from public.booking_items i
  where i.booking_id = created_booking.id;

  return jsonb_build_object(
    'template_key', active_template,
    'duplicate', false,
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
