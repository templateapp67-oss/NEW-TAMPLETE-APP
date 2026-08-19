-- =====================================================================
-- PHASE 16.2 — REAL SERVICE CATALOG + BOOKING ITEMS (LIVE SCHEMA)
-- =====================================================================
-- Additive extension of the applied Phase 16.1 foundation.
--
-- Verified live relationships used here:
--   public.services
--     id, salon_id, category_id, name, description, price_paise,
--     duration_minutes, is_active
--   public.service_categories
--     id, name, slug, is_active
--   public.salon_public_websites
--     salon_id, template_key (existing public active-website projection)
--   public.booking_items
--     booking_id, service_id, quantity, unit_price_paise, line_total_paise,
--     service_name_snapshot, duration_minutes_snapshot
--
-- No table/column is created. Customer identity remains auth.uid(). The
-- browser supplies service ids only; catalog display, ownership, active state,
-- category, price, duration and active template are resolved by the database.
-- =====================================================================

begin;

-- Public-safe catalog reader. Direct SELECT on `services` stays closed; this
-- function exposes only active services/categories for an active public salon
-- website and validates the requested UI template against the server-derived
-- active template.
create or replace function public.get_public_salon_service_catalog(
  p_salon_id uuid,
  p_template_key text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  active_template text;
  catalog_services jsonb;
begin
  if p_salon_id is null or nullif(btrim(p_template_key), '') is null then
    raise exception 'A valid salon and template are required';
  end if;

  select w.template_key::text
  into active_template
  from public.salon_public_websites w
  where w.salon_id = p_salon_id
  limit 1;

  if active_template is null then
    raise exception 'This salon website is not available for booking';
  end if;
  if active_template <> btrim(p_template_key) then
    raise exception 'This service catalog belongs to another active template';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'salon_id', s.salon_id,
        'category_id', c.id,
        'category_name', c.name,
        'category_slug', c.slug,
        'name', s.name,
        'description', coalesce(s.description, ''),
        'price_paise', s.price_paise,
        'duration_minutes', s.duration_minutes
      )
      order by c.name, s.name, s.id
    ),
    '[]'::jsonb
  )
  into catalog_services
  from public.services s
  join public.service_categories c
    on c.id = s.category_id
   and c.is_active = true
  where s.salon_id = p_salon_id
    and s.is_active = true;

  return jsonb_build_object(
    'salon_id', p_salon_id,
    'template_key', active_template,
    'services', catalog_services
  );
end
$function$;

revoke all on function public.get_public_salon_service_catalog(uuid, text) from public;
grant execute on function public.get_public_salon_service_catalog(uuid, text) to anon, authenticated;

-- Reuse (do not duplicate) the Phase 16.1 booking RPC. The signature remains
-- unchanged. This replacement adds the existing active-public-template and
-- active-category chain to the already enforced active salon/service checks.
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

  -- Theme/template association is derived from the server's active public
  -- website projection; no browser theme id is accepted by this write RPC.
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

  -- Price and duration come only from active live service rows. The category
  -- join is the existing service/category relationship and rejects inactive or
  -- detached catalog rows. The salon predicate rejects cross-salon ids.
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
