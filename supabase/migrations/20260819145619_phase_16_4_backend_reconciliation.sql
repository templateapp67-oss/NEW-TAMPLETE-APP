-- Phase 16.4: reconcile the live booking backend around one identity,
-- availability, lifecycle, and API contract.
-- Canonical target: nexora-staging (qwaehqsmodekbgvnaavz).
-- Payment provider, payment RPCs, refunds, and payment tables are intentionally
-- outside this migration.

begin;

create index if not exists booking_items_booking_id_idx
  on public.booking_items (booking_id);

create unique index if not exists availability_blocks_booking_id_uq
  on public.availability_blocks (booking_id)
  where booking_id is not null;

-- The booking's auth identity and salon-specific customer identity must always
-- describe the same person. Walk-ins keep both values NULL.
create or replace function private.validate_booking_relations()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  linked_customer_user_id uuid;
begin
  select sc.customer_user_id
    into linked_customer_user_id
  from public.salon_customers sc
  where sc.id = new.salon_customer_id
    and sc.salon_id = new.salon_id
    and sc.deleted_at is null;

  if not found then
    raise exception 'salon customer does not belong to booking salon';
  end if;

  if new.customer_user_id is distinct from linked_customer_user_id then
    raise exception 'booking customer identity does not match salon customer';
  end if;

  if new.staff_id is not null and not exists (
    select 1
    from public.staff st
    where st.id = new.staff_id
      and st.salon_id = new.salon_id
      and st.deleted_at is null
  ) then
    raise exception 'booking staff does not belong to booking salon';
  end if;

  return new;
end;
$$;

-- One duration rule is shared by creation and every slot engine. The occupied
-- appointment interval includes service buffers. Staff overrides replace only
-- the service duration, never the service buffers.
create or replace function private.booking_effective_duration_minutes(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_staff_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select sum(
    coalesce(nullif(ss.custom_duration_minutes, 0), s.duration_minutes)
    + s.buffer_before_minutes
    + s.buffer_after_minutes
  )::integer
  from unnest(p_service_ids) requested(service_id)
  join public.services s
    on s.id = requested.service_id
   and s.salon_id = p_salon_id
   and s.is_active
   and s.deleted_at is null
  left join public.staff_services ss
    on p_staff_id is not null
   and ss.staff_id = p_staff_id
   and ss.service_id = s.id
   and ss.is_active
$$;

-- Returns NULL when the requested interval is valid; otherwise returns a safe,
-- deterministic validation message. This is the single availability engine.
create or replace function private.booking_slot_validation_error(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_staff_id uuid,
  p_appointment_start timestamptz,
  p_exclude_booking_id uuid default null,
  p_require_online_services boolean default true
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  salon_record public.salons%rowtype;
  local_start timestamp;
  local_end timestamp;
  local_date date;
  local_start_time time;
  local_end_time time;
  day_number smallint;
  duration_minutes integer;
  requested_count integer;
  valid_service_count integer;
  staff_service_count integer;
  hours_record public.salon_hours%rowtype;
  override_record public.staff_availability_overrides%rowtype;
  has_override boolean := false;
begin
  if p_salon_id is null
     or p_service_ids is null
     or cardinality(p_service_ids) = 0
     or cardinality(p_service_ids) > 20 then
    return 'between 1 and 20 services are required';
  end if;

  select count(distinct requested.service_id)
    into requested_count
  from unnest(p_service_ids) requested(service_id);
  if requested_count <> cardinality(p_service_ids) then
    return 'duplicate services are not allowed';
  end if;

  select *
    into salon_record
  from public.salons s
  where s.id = p_salon_id
    and s.is_active
    and s.deleted_at is null;
  if not found then
    return 'salon is not active';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_timezone_names tz
    where tz.name = salon_record.timezone
  ) then
    return 'salon timezone is invalid';
  end if;

  select count(*)
    into valid_service_count
  from unnest(p_service_ids) requested(service_id)
  join public.services s on s.id = requested.service_id
  where s.salon_id = p_salon_id
    and s.is_active
    and s.deleted_at is null
    and (not p_require_online_services or s.is_bookable_online);
  if valid_service_count <> requested_count then
    return 'invalid or unavailable service';
  end if;

  if p_staff_id is not null then
    if not exists (
      select 1
      from public.staff st
      where st.id = p_staff_id
        and st.salon_id = p_salon_id
        and st.employment_status = 'active'
        and st.is_active
        and st.deleted_at is null
    ) then
      return 'staff is not active for this salon';
    end if;

    select count(*)
      into staff_service_count
    from unnest(p_service_ids) requested(service_id)
    join public.staff_services ss
      on ss.staff_id = p_staff_id
     and ss.service_id = requested.service_id
     and ss.is_active;
    if staff_service_count <> requested_count then
      return 'staff does not provide every selected service';
    end if;
  end if;

  duration_minutes := private.booking_effective_duration_minutes(
    p_salon_id, p_service_ids, p_staff_id
  );
  if duration_minutes is null or duration_minutes <= 0 then
    return 'service duration is invalid';
  end if;

  if p_appointment_start is null then
    return 'appointment start is required';
  end if;

  local_start := p_appointment_start at time zone salon_record.timezone;
  local_end := (p_appointment_start + make_interval(mins => duration_minutes))
    at time zone salon_record.timezone;
  if local_end::date <> local_start::date then
    return 'appointment must finish on the same salon-local day';
  end if;
  local_date := local_start::date;
  local_start_time := local_start::time;
  local_end_time := local_end::time;
  day_number := extract(dow from local_date)::smallint;

  select *
    into hours_record
  from public.salon_hours sh
  where sh.salon_id = p_salon_id
    and sh.day_of_week = day_number;
  if not found
     or hours_record.is_closed
     or hours_record.opens_at is null
     or hours_record.closes_at is null
     or local_start_time < hours_record.opens_at
     or local_end_time > hours_record.closes_at then
    return 'appointment is outside salon hours';
  end if;

  if p_staff_id is not null then
    select *
      into override_record
    from public.staff_availability_overrides sao
    where sao.staff_id = p_staff_id
      and sao.override_date = local_date;
    has_override := found;

    if has_override then
      if not override_record.is_available
         or override_record.start_time is null
         or override_record.end_time is null
         or local_start_time < override_record.start_time
         or local_end_time > override_record.end_time then
        return 'appointment is outside staff availability override';
      end if;
    elsif exists (
      select 1
      from public.staff_shifts shift_row
      where shift_row.staff_id = p_staff_id
        and shift_row.shift_date = local_date
    ) then
      if not exists (
        select 1
        from public.staff_shifts shift_row
        where shift_row.staff_id = p_staff_id
          and shift_row.shift_date = local_date
          and local_start_time >= shift_row.start_time
          and local_end_time <= shift_row.end_time
      ) then
        return 'appointment is outside staff shift';
      end if;
    elsif not exists (
      select 1
      from public.staff_schedules schedule_row
      where schedule_row.staff_id = p_staff_id
        and schedule_row.day_of_week = day_number
        and schedule_row.is_working
        and local_start_time >= schedule_row.start_time
        and local_end_time <= schedule_row.end_time
    ) then
      return 'appointment is outside staff schedule';
    end if;

    if exists (
      select 1
      from public.staff_breaks break_row
      where break_row.staff_id = p_staff_id
        and (break_row.break_date is null or break_row.break_date = local_date)
        and break_row.break_start < local_end_time
        and break_row.break_end > local_start_time
    ) then
      return 'appointment overlaps a staff break';
    end if;

    if exists (
      select 1
      from public.staff_leave_requests leave_row
      where leave_row.staff_id = p_staff_id
        and leave_row.status = 'approved'
        and local_date between leave_row.start_date and leave_row.end_date
    ) then
      return 'staff is on approved leave';
    end if;

    if exists (
      select 1
      from public.staff_blocked_times blocked
      where blocked.staff_id = p_staff_id
        and blocked.start_at < p_appointment_start + make_interval(mins => duration_minutes)
        and blocked.end_at > p_appointment_start
    ) then
      return 'appointment overlaps blocked staff time';
    end if;
  end if;

  if exists (
    select 1
    from public.availability_blocks block_row
    where block_row.salon_id = p_salon_id
      and block_row.block_type in ('blocked', 'booking', 'leave')
      and (p_exclude_booking_id is null or block_row.booking_id is distinct from p_exclude_booking_id)
      and (
        block_row.staff_id is null
        or (p_staff_id is not null and block_row.staff_id = p_staff_id)
      )
      and block_row.starts_at < p_appointment_start + make_interval(mins => duration_minutes)
      and block_row.ends_at > p_appointment_start
  ) then
    return 'appointment overlaps blocked salon or staff time';
  end if;

  if exists (
    select 1
    from public.bookings existing
    where existing.salon_id = p_salon_id
      and existing.status in ('payment_pending', 'pending', 'confirmed', 'checked_in', 'in_progress')
      and (p_exclude_booking_id is null or existing.id <> p_exclude_booking_id)
      and (
        p_staff_id is null
        or existing.staff_id is null
        or existing.staff_id = p_staff_id
      )
      and existing.appointment_start < p_appointment_start + make_interval(mins => duration_minutes)
      and existing.appointment_end > p_appointment_start
  ) then
    return 'appointment conflicts with an existing booking';
  end if;

  return null;
end;
$$;

-- Lock the salon calendar first and then the staff calendar. This makes the
-- validation/write sequence safe even for unassigned-staff bookings, which do
-- not participate in the existing staff GiST exclusion constraint.
create or replace function private.assert_booking_slot_available(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_staff_id uuid,
  p_appointment_start timestamptz,
  p_exclude_booking_id uuid default null,
  p_require_online_services boolean default true
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  validation_error text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('booking:salon:' || p_salon_id::text, 0)
  );
  if p_staff_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('booking:staff:' || p_staff_id::text, 0)
    );
  end if;

  validation_error := private.booking_slot_validation_error(
    p_salon_id,
    p_service_ids,
    p_staff_id,
    p_appointment_start,
    p_exclude_booking_id,
    p_require_online_services
  );
  if validation_error is not null then
    raise exception '%', validation_error using errcode = '22023';
  end if;
end;
$$;

-- Align the defensive booking trigger with the canonical active-status and
-- staff-null overlap semantics used by the validator.
create or replace function public.tg_booking_no_overlap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('payment_pending', 'pending', 'confirmed', 'checked_in', 'in_progress')
     and exists (
       select 1
       from public.bookings existing
       where existing.id <> new.id
         and existing.salon_id = new.salon_id
         and existing.status in ('payment_pending', 'pending', 'confirmed', 'checked_in', 'in_progress')
         and (
           new.staff_id is null
           or existing.staff_id is null
           or existing.staff_id = new.staff_id
         )
         and existing.appointment_start < new.appointment_end
         and existing.appointment_end > new.appointment_start
     ) then
    raise exception 'appointment conflicts with an existing booking'
      using errcode = '23P01';
  end if;
  return new;
end;
$$;

create or replace function public.create_customer_booking(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_staff_id uuid,
  p_appointment_start timestamptz,
  p_customer_note text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  customer public.salon_customers%rowtype;
  booking_id uuid := extensions.gen_random_uuid();
  booking_end timestamptz;
  total_duration integer;
  subtotal bigint;
  selected_service record;
begin
  if caller is null then raise exception 'authentication required'; end if;
  if p_customer_note is not null and length(p_customer_note) > 2000 then
    raise exception 'customer note is too long';
  end if;
  if p_idempotency_key is not null and (
    nullif(btrim(p_idempotency_key), '') is null or length(p_idempotency_key) > 128
  ) then raise exception 'invalid idempotency key'; end if;
  if p_appointment_start <= now() then raise exception 'appointment must be in the future'; end if;
  if p_appointment_start > now() + interval '1 year' then raise exception 'appointment is too far in the future'; end if;
  if not exists (
    select 1 from public.profiles p where p.id = caller and p.is_active
  ) then raise exception 'active customer profile is required'; end if;
  if not exists (
    select 1 from public.salons s
    where s.id = p_salon_id and s.verified and s.is_active
      and s.deleted_at is null and s.accepts_online_bookings
  ) then raise exception 'salon is not bookable'; end if;

  if p_idempotency_key is not null then
    select b.id into booking_id
    from public.bookings b
    where b.customer_user_id = caller and b.idempotency_key = p_idempotency_key;
    if found then return booking_id; end if;
  end if;

  perform private.assert_booking_slot_available(
    p_salon_id, p_service_ids, p_staff_id, p_appointment_start, null, true
  );
  total_duration := private.booking_effective_duration_minutes(
    p_salon_id, p_service_ids, p_staff_id
  );
  booking_end := p_appointment_start + make_interval(mins => total_duration);

  select sum(coalesce(ss.custom_price_paise, s.price_paise))::bigint
    into subtotal
  from unnest(p_service_ids) requested(service_id)
  join public.services s on s.id = requested.service_id and s.salon_id = p_salon_id
  left join public.staff_services ss
    on p_staff_id is not null and ss.staff_id = p_staff_id
   and ss.service_id = s.id and ss.is_active;

  insert into public.salon_customers(salon_id, customer_user_id, name, phone, email)
  select p_salon_id, p.id, p.full_name, p.phone, null
  from public.profiles p
  where p.id = caller
    and not exists (
      select 1 from public.salon_customers sc
      where sc.salon_id = p_salon_id and sc.customer_user_id = caller
        and sc.deleted_at is null
    )
  on conflict do nothing;

  select * into customer
  from public.salon_customers sc
  where sc.salon_id = p_salon_id
    and sc.customer_user_id = caller
    and sc.deleted_at is null;
  if not found then raise exception 'canonical salon customer could not be resolved'; end if;

  booking_id := extensions.gen_random_uuid();
  insert into public.bookings(
    id, booking_number, salon_id, customer_user_id, salon_customer_id, staff_id,
    source, appointment_start, appointment_end, status, subtotal_paise,
    total_paise, staff_name_snapshot, customer_note, created_by, idempotency_key
  )
  select booking_id, 'NX-' || upper(substr(replace(booking_id::text, '-', ''), 1, 12)),
    p_salon_id, caller, customer.id, p_staff_id, 'customer_app',
    p_appointment_start, booking_end,
    case when s.auto_confirm_bookings then 'confirmed' else 'pending' end,
    subtotal, subtotal, st.name, p_customer_note, caller, p_idempotency_key
  from public.salons s
  left join public.staff st on st.id = p_staff_id
  where s.id = p_salon_id;

  for selected_service in
    select s.*,
      coalesce(nullif(ss.custom_duration_minutes, 0), s.duration_minutes) effective_duration,
      coalesce(ss.custom_price_paise, s.price_paise) effective_price
    from unnest(p_service_ids) requested(service_id)
    join public.services s on s.id = requested.service_id and s.salon_id = p_salon_id
    left join public.staff_services ss
      on p_staff_id is not null and ss.staff_id = p_staff_id
     and ss.service_id = s.id and ss.is_active
  loop
    insert into public.booking_items(
      booking_id, service_id, staff_id, service_name_snapshot,
      duration_minutes_snapshot, unit_price_paise, line_total_paise
    ) values (
      booking_id, selected_service.id, p_staff_id, selected_service.name,
      selected_service.effective_duration, selected_service.effective_price,
      selected_service.effective_price
    );
  end loop;

  if p_staff_id is not null then
    insert into public.availability_blocks(
      salon_id, staff_id, booking_id, starts_at, ends_at, block_type, reason
    ) values (
      p_salon_id, p_staff_id, booking_id, p_appointment_start, booking_end,
      'booking', 'customer booking'
    );
  end if;
  return booking_id;
exception when unique_violation then
  if p_idempotency_key is not null then
    select b.id into booking_id from public.bookings b
    where b.customer_user_id = caller and b.idempotency_key = p_idempotency_key;
    if booking_id is not null then return booking_id; end if;
  end if;
  raise;
end;
$$;

create or replace function public.create_owner_booking(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_staff_id uuid,
  p_appointment_start timestamptz,
  p_customer_user_id uuid,
  p_customer_name text,
  p_customer_phone text default null,
  p_customer_note text default null,
  p_is_walk_in boolean default false,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  customer public.salon_customers%rowtype;
  booking_id uuid := extensions.gen_random_uuid();
  booking_end timestamptz;
  total_duration integer;
  subtotal bigint;
  selected_service record;
begin
  if caller is null or p_salon_id not in (select public.nexora_owner_salon_ids()) then
    raise exception 'owner access required';
  end if;
  if nullif(btrim(p_customer_name), '') is null or length(p_customer_name) > 200 then
    raise exception 'valid customer name is required';
  end if;
  if p_appointment_start < now() - interval '12 hours' then
    raise exception 'appointment time is too far in the past';
  end if;
  if p_idempotency_key is not null and (
    nullif(btrim(p_idempotency_key), '') is null or length(p_idempotency_key) > 128
  ) then raise exception 'invalid idempotency key'; end if;
  if p_customer_user_id is not null and not exists (
    select 1 from public.profiles p where p.id = p_customer_user_id and p.is_active
  ) then raise exception 'linked customer account is invalid'; end if;

  if p_idempotency_key is not null then
    select b.id into booking_id from public.bookings b
    where b.salon_id = p_salon_id and b.idempotency_key = p_idempotency_key;
    if found then return booking_id; end if;
  end if;

  perform private.assert_booking_slot_available(
    p_salon_id, p_service_ids, p_staff_id, p_appointment_start, null, false
  );
  total_duration := private.booking_effective_duration_minutes(
    p_salon_id, p_service_ids, p_staff_id
  );
  booking_end := p_appointment_start + make_interval(mins => total_duration);

  select sum(coalesce(ss.custom_price_paise, s.price_paise))::bigint
    into subtotal
  from unnest(p_service_ids) requested(service_id)
  join public.services s on s.id = requested.service_id and s.salon_id = p_salon_id
  left join public.staff_services ss
    on p_staff_id is not null and ss.staff_id = p_staff_id
   and ss.service_id = s.id and ss.is_active;

  if p_customer_user_id is not null then
    select * into customer from public.salon_customers sc
    where sc.salon_id = p_salon_id
      and sc.customer_user_id = p_customer_user_id
      and sc.deleted_at is null;
    if not found then
      insert into public.salon_customers(salon_id, customer_user_id, name, phone)
      values (p_salon_id, p_customer_user_id, btrim(p_customer_name), nullif(btrim(p_customer_phone), ''))
      returning * into customer;
    end if;
  else
    -- Walk-ins are never linked by phone, email, or name. A new unlinked salon
    -- customer is deliberate and preserves existing records without merging.
    insert into public.salon_customers(salon_id, customer_user_id, name, phone)
    values (p_salon_id, null, btrim(p_customer_name), nullif(btrim(p_customer_phone), ''))
    returning * into customer;
  end if;

  booking_id := extensions.gen_random_uuid();
  insert into public.bookings(
    id, booking_number, salon_id, customer_user_id, salon_customer_id, staff_id,
    source, appointment_start, appointment_end, status, subtotal_paise,
    total_paise, currency, staff_name_snapshot, customer_note, created_by,
    idempotency_key
  )
  select booking_id, 'NX-' || upper(substr(replace(booking_id::text, '-', ''), 1, 12)),
    p_salon_id, p_customer_user_id, customer.id, p_staff_id,
    case when p_is_walk_in then 'walk_in' else 'owner_app' end,
    p_appointment_start, booking_end, 'confirmed', subtotal, subtotal, 'INR',
    st.name, p_customer_note, caller, p_idempotency_key
  from (select 1) seed left join public.staff st on st.id = p_staff_id;

  for selected_service in
    select s.*,
      coalesce(nullif(ss.custom_duration_minutes, 0), s.duration_minutes) effective_duration,
      coalesce(ss.custom_price_paise, s.price_paise) effective_price
    from unnest(p_service_ids) requested(service_id)
    join public.services s on s.id = requested.service_id and s.salon_id = p_salon_id
    left join public.staff_services ss
      on p_staff_id is not null and ss.staff_id = p_staff_id
     and ss.service_id = s.id and ss.is_active
  loop
    insert into public.booking_items(
      booking_id, service_id, staff_id, service_name_snapshot,
      duration_minutes_snapshot, unit_price_paise, line_total_paise
    ) values (
      booking_id, selected_service.id, p_staff_id, selected_service.name,
      selected_service.effective_duration, selected_service.effective_price,
      selected_service.effective_price
    );
  end loop;

  if p_staff_id is not null then
    insert into public.availability_blocks(
      salon_id, staff_id, booking_id, starts_at, ends_at, block_type, reason
    ) values (
      p_salon_id, p_staff_id, booking_id, p_appointment_start, booking_end,
      'booking', 'owner booking'
    );
  end if;
  insert into public.booking_status_history(
    booking_id, from_status, to_status, reason, changed_by
  ) values (booking_id, null, 'confirmed', 'owner created booking', caller);
  perform private.enqueue_notification(
    p_customer_user_id, p_salon_id, booking_id, 'booking_created',
    'Booking created', 'The salon created your booking',
    jsonb_build_object('source', case when p_is_walk_in then 'walk_in' else 'owner_app' end)
  );
  return booking_id;
exception when unique_violation then
  if p_idempotency_key is not null then
    select b.id into booking_id from public.bookings b
    where b.salon_id = p_salon_id and b.idempotency_key = p_idempotency_key;
    if booking_id is not null then return booking_id; end if;
  end if;
  raise;
end;
$$;

create or replace function public.reschedule_customer_booking(
  p_booking_id uuid,
  p_appointment_start timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  target public.bookings%rowtype;
  service_ids uuid[];
  next_end timestamptz;
  duration_minutes integer;
begin
  if caller is null then raise exception 'authentication required'; end if;
  if p_appointment_start <= now() + interval '1 hour' then
    raise exception 'new appointment must be at least one hour in the future';
  end if;
  if p_appointment_start > now() + interval '1 year' then
    raise exception 'new appointment is too far in the future';
  end if;

  select * into target from public.bookings b
  where b.id = p_booking_id and b.customer_user_id = caller
  for update;
  if not found then raise exception 'booking not found'; end if;
  if target.status not in ('pending', 'confirmed') then
    raise exception 'booking cannot be rescheduled in its current status';
  end if;
  if target.appointment_start <= now() + interval '2 hours' then
    raise exception 'booking can no longer be rescheduled online';
  end if;

  select array_agg(bi.service_id order by bi.id) into service_ids
  from public.booking_items bi where bi.booking_id = target.id;
  perform private.assert_booking_slot_available(
    target.salon_id, service_ids, target.staff_id, p_appointment_start, target.id, true
  );
  duration_minutes := private.booking_effective_duration_minutes(
    target.salon_id, service_ids, target.staff_id
  );
  next_end := p_appointment_start + make_interval(mins => duration_minutes);

  update public.bookings set appointment_start = p_appointment_start,
    appointment_end = next_end, updated_at = now()
  where id = target.id;
  if target.staff_id is not null then
    insert into public.availability_blocks(
      salon_id, staff_id, booking_id, starts_at, ends_at, block_type, reason
    ) values (
      target.salon_id, target.staff_id, target.id, p_appointment_start,
      next_end, 'booking', 'customer reschedule'
    )
    on conflict (booking_id) where booking_id is not null
    do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at,
      updated_at = now(), staff_id = excluded.staff_id;
  end if;
  insert into public.booking_status_history(
    booking_id, from_status, to_status, reason, changed_by
  ) values (
    target.id, target.status, target.status,
    'customer rescheduled appointment', caller
  );
  return true;
end;
$$;

create or replace function public.operate_owner_booking(
  p_booking_id uuid,
  p_action text,
  p_reason text default null,
  p_new_start timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  target public.bookings%rowtype;
  next_status text;
  next_end timestamptz;
  captured_total bigint;
  service_ids uuid[];
  duration_minutes integer;
begin
  if caller is null then raise exception 'authentication required'; end if;
  select * into target from public.bookings where id = p_booking_id for update;
  if not found or target.salon_id not in (select public.nexora_owner_salon_ids()) then
    raise exception 'booking not found or owner access denied';
  end if;
  if p_reason is not null and length(p_reason) > 500 then raise exception 'reason is too long'; end if;

  next_status := case p_action
    when 'accept' then 'confirmed' when 'reject' then 'cancelled'
    when 'check_in' then 'checked_in' when 'start' then 'in_progress'
    when 'complete' then 'completed' when 'cancel' then 'cancelled'
    when 'no_show' then 'no_show' when 'dispute' then 'disputed'
    when 'reschedule' then target.status else null end;
  if next_status is null then raise exception 'unsupported booking action'; end if;
  if (p_action = 'accept' and target.status not in ('payment_pending','pending'))
    or (p_action = 'reject' and target.status not in ('payment_pending','pending'))
    or (p_action = 'check_in' and target.status <> 'confirmed')
    or (p_action = 'start' and target.status <> 'checked_in')
    or (p_action = 'complete' and target.status <> 'in_progress')
    or (p_action = 'cancel' and target.status not in ('pending','confirmed','checked_in'))
    or (p_action = 'no_show' and target.status <> 'confirmed')
    or (p_action = 'dispute' and target.status not in ('completed','cancelled'))
    or (p_action = 'reschedule' and target.status not in ('pending','confirmed')) then
    raise exception 'invalid booking state transition';
  end if;

  if p_action = 'complete' then
    select coalesce(sum(amount_paise), 0) into captured_total
    from public.payments where booking_id = target.id
      and status in ('captured', 'partially_refunded');
    if captured_total < target.total_paise then
      raise exception 'booking requires full captured payment before completion';
    end if;
  end if;

  if p_action = 'reschedule' then
    if p_new_start is null or p_new_start <= now() then
      raise exception 'future appointment time is required';
    end if;
    select array_agg(bi.service_id order by bi.id) into service_ids
    from public.booking_items bi where bi.booking_id = target.id;
    perform private.assert_booking_slot_available(
      target.salon_id, service_ids, target.staff_id, p_new_start, target.id, false
    );
    duration_minutes := private.booking_effective_duration_minutes(
      target.salon_id, service_ids, target.staff_id
    );
    next_end := p_new_start + make_interval(mins => duration_minutes);
    update public.bookings set appointment_start = p_new_start,
      appointment_end = next_end, updated_at = now() where id = target.id;
    if target.staff_id is not null then
      insert into public.availability_blocks(
        salon_id, staff_id, booking_id, starts_at, ends_at, block_type, reason
      ) values (
        target.salon_id, target.staff_id, target.id, p_new_start, next_end,
        'booking', 'owner reschedule'
      )
      on conflict (booking_id) where booking_id is not null
      do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at,
        updated_at = now(), staff_id = excluded.staff_id;
    end if;
  else
    update public.bookings set status = next_status,
      checked_in_at = case when p_action = 'check_in' then now() else checked_in_at end,
      started_at = case when p_action = 'start' then now() else started_at end,
      completed_at = case when p_action = 'complete' then now() else completed_at end,
      cancelled_at = case when p_action in ('reject','cancel') then now() else cancelled_at end,
      cancel_reason = case when p_action in ('reject','cancel') then nullif(btrim(p_reason),'') else cancel_reason end,
      disputed_at = case when p_action = 'dispute' then now() else disputed_at end,
      updated_at = now()
    where id = target.id;
    if p_action in ('reject','cancel','no_show') then
      delete from public.availability_blocks
      where booking_id = target.id and block_type = 'booking';
    end if;
  end if;
  insert into public.booking_status_history(
    booking_id, from_status, to_status, reason, changed_by
  ) values (
    target.id, target.status, next_status,
    coalesce(nullif(btrim(p_reason),''), 'owner action: ' || p_action), caller
  );
  perform private.enqueue_notification(
    target.customer_user_id, target.salon_id, target.id,
    'booking_' || p_action, 'Booking updated',
    'Your booking status is now ' || next_status,
    jsonb_build_object('action', p_action, 'status', next_status)
  );
  return next_status;
end;
$$;

create or replace function public.get_public_salon_service_catalog(
  p_salon_id uuid,
  p_template_key text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'salon_id', s.id,
    'template_key', website.template_key,
    'timezone', s.timezone,
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', service.id, 'salon_id', service.salon_id,
        'category_id', service.category_id,
        'category_name', coalesce(category.name, 'Services'),
        'category_slug', coalesce(category.slug, 'services'),
        'name', service.name, 'description', coalesce(service.description, ''),
        'price_paise', service.price_paise,
        'duration_minutes', service.duration_minutes,
        'buffer_before_minutes', service.buffer_before_minutes,
        'buffer_after_minutes', service.buffer_after_minutes
      ) order by coalesce(category.sort_order, 2147483647), service.name)
      from public.services service
      left join public.service_categories category on category.id = service.category_id
      where service.salon_id = s.id and service.is_active
        and service.is_bookable_online and service.deleted_at is null
    ), '[]'::jsonb)
  )
  from public.salons s
  join public.salon_public_websites website on website.salon_id = s.id
  where s.id = p_salon_id and s.verified and s.is_active
    and s.deleted_at is null and s.accepts_online_bookings
    and website.is_published and website.template_key = p_template_key
$$;

create or replace function public.get_customer_bookings(
  p_salon_id uuid default null,
  p_booking_id uuid default null
)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'booking', to_jsonb(b),
    'items', coalesce((select jsonb_agg(to_jsonb(bi) order by bi.id)
      from public.booking_items bi where bi.booking_id = b.id), '[]'::jsonb),
    'customer', jsonb_build_object('id', sc.id, 'name', sc.name,
      'phone', sc.phone, 'email', sc.email),
    'template_key', website.template_key,
    'timezone', s.timezone
  )
  from public.bookings b
  join public.salons s on s.id = b.salon_id
  join public.salon_customers sc on sc.id = b.salon_customer_id
  left join public.salon_public_websites website on website.salon_id = b.salon_id
  where auth.uid() is not null
    and b.customer_user_id = auth.uid()
    and (p_salon_id is null or b.salon_id = p_salon_id)
    and (p_booking_id is null or b.id = p_booking_id)
  order by b.created_at desc
$$;

create or replace function public.get_owner_bookings(
  p_booking_id uuid default null
)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'booking', to_jsonb(b),
    'items', coalesce((select jsonb_agg(to_jsonb(bi) order by bi.id)
      from public.booking_items bi where bi.booking_id = b.id), '[]'::jsonb),
    'customer', jsonb_build_object('id', sc.id, 'user_id', sc.customer_user_id,
      'name', sc.name, 'phone', sc.phone, 'email', sc.email),
    'template_key', website.template_key,
    'timezone', s.timezone
  )
  from public.bookings b
  join public.salons s on s.id = b.salon_id
  join public.salon_customers sc on sc.id = b.salon_customer_id
  left join public.salon_public_websites website on website.salon_id = b.salon_id
  where auth.uid() is not null
    and b.salon_id in (select public.nexora_owner_salon_ids())
    and (p_booking_id is null or b.id = p_booking_id)
  order by b.appointment_start desc
$$;

create or replace function public.get_staff_available_slots(
  p_business_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_date date
)
returns table(slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  salon_timezone text;
  opens time;
  closes time;
  candidate_local timestamp;
  candidate_start timestamptz;
  duration_minutes integer;
begin
  select s.timezone into salon_timezone from public.salons s
  where s.id = p_business_id and s.verified and s.is_active
    and s.deleted_at is null and s.accepts_online_bookings;
  if not found then return; end if;
  select sh.opens_at, sh.closes_at into opens, closes
  from public.salon_hours sh
  where sh.salon_id = p_business_id
    and sh.day_of_week = extract(dow from p_date)::smallint
    and not sh.is_closed;
  if opens is null or closes is null then return; end if;
  duration_minutes := private.booking_effective_duration_minutes(
    p_business_id, array[p_service_id], p_staff_id
  );
  if duration_minutes is null then return; end if;
  candidate_local := p_date + opens;
  while candidate_local + make_interval(mins => duration_minutes) <= p_date + closes loop
    candidate_start := candidate_local at time zone salon_timezone;
    if candidate_start > now()
       and private.booking_slot_validation_error(
         p_business_id, array[p_service_id], p_staff_id,
         candidate_start, null, true
       ) is null then
      slot_start := candidate_start;
      slot_end := candidate_start + make_interval(mins => duration_minutes);
      return next;
    end if;
    candidate_local := candidate_local + interval '30 minutes';
  end loop;
end;
$$;

create or replace function public.marketplace_slots(
  p_salon_id uuid,
  p_service_ids uuid[],
  p_date date,
  p_tz text default 'Asia/Kolkata',
  p_staff_id uuid default null
)
returns table(slot_start timestamptz, slot_end timestamptz, staff_id uuid, staff_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  salon_timezone text;
  opens time;
  closes time;
  staff_record record;
  candidate_local timestamp;
  candidate_start timestamptz;
  duration_minutes integer;
begin
  -- p_tz is retained only for backward signature compatibility. The live
  -- salon.timezone is authoritative and the caller cannot override it.
  select s.timezone into salon_timezone from public.salons s
  where s.id = p_salon_id and s.verified and s.is_active
    and s.deleted_at is null and s.accepts_online_bookings;
  if not found then return; end if;
  select sh.opens_at, sh.closes_at into opens, closes
  from public.salon_hours sh
  where sh.salon_id = p_salon_id
    and sh.day_of_week = extract(dow from p_date)::smallint
    and not sh.is_closed;
  if opens is null or closes is null then return; end if;

  for staff_record in
    select st.id, st.name
    from public.staff st
    where st.salon_id = p_salon_id and st.employment_status = 'active'
      and st.is_active and st.deleted_at is null
      and (p_staff_id is null or st.id = p_staff_id)
      and not exists (
        select 1 from unnest(p_service_ids) requested(service_id)
        where not exists (
          select 1 from public.staff_services ss
          where ss.staff_id = st.id and ss.service_id = requested.service_id
            and ss.is_active
        )
      )
    order by st.name, st.id
  loop
    duration_minutes := private.booking_effective_duration_minutes(
      p_salon_id, p_service_ids, staff_record.id
    );
    if duration_minutes is null then continue; end if;
    candidate_local := p_date + opens;
    while candidate_local + make_interval(mins => duration_minutes) <= p_date + closes loop
      candidate_start := candidate_local at time zone salon_timezone;
      if candidate_start > now()
         and private.booking_slot_validation_error(
           p_salon_id, p_service_ids, staff_record.id,
           candidate_start, null, true
         ) is null then
        slot_start := candidate_start;
        slot_end := candidate_start + make_interval(mins => duration_minutes);
        staff_id := staff_record.id;
        staff_name := staff_record.name;
        return next;
      end if;
      candidate_local := candidate_local + interval '30 minutes';
    end loop;
  end loop;
end;
$$;

comment on function private.booking_slot_validation_error(uuid, uuid[], uuid, timestamptz, uuid, boolean)
  is 'Canonical Phase 16.4 availability contract using salons.timezone, salon hours, staff windows, breaks, leave, blocks, and active bookings.';
comment on function public.create_customer_booking(uuid, uuid[], uuid, timestamptz, text, text)
  is 'Canonical authenticated customer booking mutation. Returns the persisted booking UUID.';
comment on function public.get_customer_bookings(uuid, uuid)
  is 'Canonical authenticated customer-own booking read API.';
comment on function public.get_owner_bookings(uuid)
  is 'Canonical active-owner organization-scoped booking read API.';

-- Direct booking mutations are never client APIs. SECURITY DEFINER lifecycle
-- RPCs perform authorization and state-transition checks.
drop policy if exists bookings_booking_ops_update on public.bookings;
drop policy if exists bookings_owner_update_status on public.bookings;
revoke insert, update, delete on public.bookings from anon, authenticated;
revoke insert, update, delete on public.booking_items from anon, authenticated;
revoke insert, update, delete on public.booking_status_history from anon, authenticated;
grant select on public.bookings, public.booking_items to authenticated;

revoke all on function private.booking_effective_duration_minutes(uuid, uuid[], uuid) from public, anon, authenticated;
revoke all on function private.booking_slot_validation_error(uuid, uuid[], uuid, timestamptz, uuid, boolean) from public, anon, authenticated;
revoke all on function private.assert_booking_slot_available(uuid, uuid[], uuid, timestamptz, uuid, boolean) from public, anon, authenticated;

revoke all on function public.create_customer_booking(uuid, uuid[], uuid, timestamptz, text, text) from public, anon;
grant execute on function public.create_customer_booking(uuid, uuid[], uuid, timestamptz, text, text) to authenticated, service_role;
revoke all on function public.create_owner_booking(uuid, uuid[], uuid, timestamptz, uuid, text, text, text, boolean, text) from public, anon;
grant execute on function public.create_owner_booking(uuid, uuid[], uuid, timestamptz, uuid, text, text, text, boolean, text) to authenticated, service_role;
revoke all on function public.reschedule_customer_booking(uuid, timestamptz) from public, anon;
grant execute on function public.reschedule_customer_booking(uuid, timestamptz) to authenticated, service_role;
revoke all on function public.operate_owner_booking(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.operate_owner_booking(uuid, text, text, timestamptz) to authenticated, service_role;
revoke all on function public.get_customer_bookings(uuid, uuid) from public, anon;
grant execute on function public.get_customer_bookings(uuid, uuid) to authenticated, service_role;
revoke all on function public.get_owner_bookings(uuid) from public, anon;
grant execute on function public.get_owner_bookings(uuid) to authenticated, service_role;
revoke all on function public.get_public_salon_service_catalog(uuid, text) from public;
grant execute on function public.get_public_salon_service_catalog(uuid, text) to anon, authenticated, service_role;
revoke all on function public.get_staff_available_slots(uuid, uuid, uuid, date) from public;
grant execute on function public.get_staff_available_slots(uuid, uuid, uuid, date) to anon, authenticated, service_role;
revoke all on function public.marketplace_slots(uuid, uuid[], date, text, uuid) from public;
grant execute on function public.marketplace_slots(uuid, uuid[], date, text, uuid) to anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
