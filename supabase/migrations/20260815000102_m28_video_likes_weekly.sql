-- M28 (DRAFT) / Phase 15.8: video likes + current-week ranking
--
-- Schema inspection before this migration:
--   * public.social_videos is the existing business-owned video source.
--   * public.website_events is the existing append-only public interaction log
--     and already carries business_id, visitor_token, metadata and created_at.
--   * public.themes owns the five canonical theme ids.
--   * no video-like table, like column, user/video relation or weekly ranking
--     function exists in M01-M26.
--
-- Therefore likes REUSE website_events rather than creating a parallel likes
-- table or mutable likes_count column. social_videos gains only the two client
-- concepts already introduced by Phases 15.1/15.3 (theme and Short/Long kind).
-- Counts are always derived from immutable events. Duplicate prevention and
-- target/theme validation live in SECURITY DEFINER RPCs + a unique index, not
-- only in browser state.
--
-- NOT applied to any database. Live read-only introspection and the standard
-- M02 regeneration/approval gate are still mandatory before remote execution.

begin;

-- Persist the theme/kind concepts that already exist on SocialVideo. Existing
-- unscoped rows remain NULL and retain the Phase 15.1 grandfathering rule.
alter table public.social_videos
  add column if not exists theme_id uuid,
  add column if not exists video_kind text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_videos_theme_fk'
      and conrelid = 'public.social_videos'::regclass
  ) then
    alter table public.social_videos
      add constraint social_videos_theme_fk
      foreign key (theme_id) references public.themes(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'social_videos_video_kind_check'
      and conrelid = 'public.social_videos'::regclass
  ) then
    alter table public.social_videos
      add constraint social_videos_video_kind_check
      check (video_kind is null or video_kind in ('short', 'long'));
  end if;
end
$$;

create index if not exists idx_social_videos_business_theme_status
  on public.social_videos (business_id, theme_id, status, display_order);

-- One immutable like per real auth user OR existing browser/session token,
-- video and active theme. The RPC hashes identity before writing visitor_token.
create unique index if not exists idx_website_events_video_like_once
  on public.website_events (
    business_id,
    visitor_token,
    (metadata ->> 'theme_id'),
    (metadata ->> 'video_key')
  )
  where event_type = 'video_like';

create index if not exists idx_website_events_video_like_week
  on public.website_events (
    business_id,
    (metadata ->> 'theme_id'),
    created_at desc,
    (metadata ->> 'video_key')
  )
  where event_type = 'video_like';

-- Resolve and validate one like target. Owner videos must be an active
-- social_videos UUID belonging to this business and theme (NULL remains
-- grandfathered/unscoped). Protected showcase keys are the existing exact
-- 5 Short + 5 Long id ranges from siteVideoCatalog.ts for each theme.
create or replace function public.resolve_video_like_kind(
  p_business_id uuid,
  p_theme_id text,
  p_video_key text
)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  target_theme_uuid uuid;
  resolved_kind text;
  key_value text := btrim(coalesce(p_video_key, ''));
begin
  if p_business_id is null or btrim(coalesce(p_theme_id, '')) = '' or key_value = '' then
    return null;
  end if;

  select t.id into target_theme_uuid
  from public.themes t
  where t.theme_id = p_theme_id and t.is_active
  limit 1;
  if target_theme_uuid is null then return null; end if;

  if (
    (p_theme_id = 'barber_mens_grooming' and key_value ~ '^theme:barber:[sl][1-5]$') or
    (p_theme_id = 'hair_studio_color_bar' and key_value ~ '^theme:hair:[sl][1-5]$') or
    (p_theme_id = 'beauty_skin_spa' and key_value ~ '^theme:spa:[sl][1-5]$') or
    (p_theme_id = 'family_full_service' and key_value ~ '^theme:family:[sl][1-5]$') or
    (p_theme_id = 'nail_lash_studio' and key_value ~ '^theme:nail:[sl][1-5]$')
  ) then
    return case when split_part(key_value, ':', 3) like 's%' then 'short' else 'long' end;
  end if;

  -- Cast only after validating UUID syntax; arbitrary client keys never raise.
  if key_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;

  select coalesce(
    sv.video_kind,
    case
      when lower(sv.video_url) ~ '/(shorts|reel|reels)/' or sv.platform::text = 'tiktok' then 'short'
      else 'long'
    end
  )
  into resolved_kind
  from public.social_videos sv
  where sv.id = key_value::uuid
    and sv.business_id = p_business_id
    and sv.status = 'active'
    and (sv.theme_id is null or sv.theme_id = target_theme_uuid)
  limit 1;

  return resolved_kind;
end
$$;

-- Reuse Supabase Auth when present; otherwise reuse the app's existing stable
-- browser/session token. No caller-supplied user id is accepted. Hashing keeps
-- raw auth/session identifiers out of the analytics row.
create or replace function public.video_like_actor_key(p_visitor_token text)
returns text
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  identity_seed text;
  clean_token text := btrim(coalesce(p_visitor_token, ''));
begin
  if auth.uid() is not null then
    identity_seed := 'auth:' || auth.uid()::text;
  else
    if length(clean_token) < 8 or length(clean_token) > 180
       or clean_token !~ '^[A-Za-z0-9:_-]+$' then
      raise exception 'A valid visitor session is required to like videos';
    end if;
    identity_seed := 'session:' || clean_token;
  end if;

  return 'video-like:' || encode(public.digest(identity_seed, 'sha256'), 'hex');
end
$$;

create or replace function public.like_video(
  p_business_id uuid,
  p_theme_id text,
  p_video_key text,
  p_visitor_token text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_key text;
  resolved_kind text;
  inserted_id uuid;
  total_count bigint;
  week_count bigint;
  business_timezone text;
  week_start timestamptz;
  week_end timestamptz;
begin
  if not public.is_published_business(p_business_id)
     and not public.is_business_member(p_business_id) then
    raise exception 'Video likes are unavailable for this business';
  end if;

  resolved_kind := public.resolve_video_like_kind(p_business_id, p_theme_id, p_video_key);
  if resolved_kind is null then
    raise exception 'Video is unavailable for this theme';
  end if;
  actor_key := public.video_like_actor_key(p_visitor_token);

  select b.timezone into business_timezone
  from public.businesses b where b.id = p_business_id;
  business_timezone := coalesce(nullif(business_timezone, ''), 'Asia/Kolkata');
  week_start := date_trunc('week', now() at time zone business_timezone) at time zone business_timezone;
  week_end := week_start + interval '7 days';

  insert into public.website_events (
    business_id, event_type, visitor_token, page_path, metadata
  ) values (
    p_business_id,
    'video_like',
    actor_key,
    null,
    jsonb_build_object(
      'video_key', btrim(p_video_key),
      'theme_id', btrim(p_theme_id),
      'video_kind', resolved_kind
    )
  )
  on conflict do nothing
  returning id into inserted_id;

  select count(*) into total_count
  from public.website_events e
  where e.business_id = p_business_id
    and e.event_type = 'video_like'
    and e.metadata ->> 'theme_id' = btrim(p_theme_id)
    and e.metadata ->> 'video_key' = btrim(p_video_key);

  select count(*) into week_count
  from public.website_events e
  where e.business_id = p_business_id
    and e.event_type = 'video_like'
    and e.metadata ->> 'theme_id' = btrim(p_theme_id)
    and e.metadata ->> 'video_key' = btrim(p_video_key)
    and e.created_at >= week_start
    and e.created_at < week_end;

  return jsonb_build_object(
    'video_id', btrim(p_video_key),
    'theme_id', btrim(p_theme_id),
    'video_kind', resolved_kind,
    'total_likes', total_count,
    'weekly_likes', week_count,
    'liked_by_viewer', true,
    'duplicate', inserted_id is null,
    'week_start', week_start,
    'week_end', week_end
  );
end
$$;

create or replace function public.get_video_like_state(
  p_business_id uuid,
  p_theme_id text,
  p_video_keys text[],
  p_visitor_token text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_key text;
  business_timezone text;
  week_start timestamptz;
  week_end timestamptz;
  result_videos jsonb;
begin
  if not public.is_published_business(p_business_id)
     and not public.is_business_member(p_business_id) then
    raise exception 'Video likes are unavailable for this business';
  end if;
  if cardinality(coalesce(p_video_keys, '{}'::text[])) > 50 then
    raise exception 'Too many video ids requested';
  end if;

  actor_key := public.video_like_actor_key(p_visitor_token);
  select b.timezone into business_timezone
  from public.businesses b where b.id = p_business_id;
  business_timezone := coalesce(nullif(business_timezone, ''), 'Asia/Kolkata');
  week_start := date_trunc('week', now() at time zone business_timezone) at time zone business_timezone;
  week_end := week_start + interval '7 days';

  select coalesce(jsonb_agg(jsonb_build_object(
    'video_id', valid.video_key,
    'theme_id', btrim(p_theme_id),
    'video_kind', valid.video_kind,
    'total_likes', (
      select count(*) from public.website_events e
      where e.business_id = p_business_id
        and e.event_type = 'video_like'
        and e.metadata ->> 'theme_id' = btrim(p_theme_id)
        and e.metadata ->> 'video_key' = valid.video_key
    ),
    'weekly_likes', (
      select count(*) from public.website_events e
      where e.business_id = p_business_id
        and e.event_type = 'video_like'
        and e.metadata ->> 'theme_id' = btrim(p_theme_id)
        and e.metadata ->> 'video_key' = valid.video_key
        and e.created_at >= week_start and e.created_at < week_end
    ),
    'liked_by_viewer', exists (
      select 1 from public.website_events e
      where e.business_id = p_business_id
        and e.event_type = 'video_like'
        and e.metadata ->> 'theme_id' = btrim(p_theme_id)
        and e.metadata ->> 'video_key' = valid.video_key
        and e.visitor_token = actor_key
    )
  ) order by valid.video_key), '[]'::jsonb)
  into result_videos
  from (
    select requested.video_key,
           public.resolve_video_like_kind(p_business_id, p_theme_id, requested.video_key) as video_kind
    from (
      select distinct btrim(key_value) as video_key
      from unnest(coalesce(p_video_keys, '{}'::text[])) as keys(key_value)
      where btrim(coalesce(key_value, '')) <> ''
    ) requested
  ) valid
  where valid.video_kind is not null;

  return jsonb_build_object(
    'theme_id', btrim(p_theme_id),
    'week_start', week_start,
    'week_end', week_end,
    'videos', result_videos
  );
end
$$;

create or replace function public.get_weekly_top_videos(
  p_business_id uuid,
  p_theme_id text,
  p_limit integer default 5
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  business_timezone text;
  week_start timestamptz;
  week_end timestamptz;
  safe_limit integer := greatest(1, least(coalesce(p_limit, 5), 10));
  ranked_videos jsonb;
begin
  if not public.is_published_business(p_business_id)
     and not public.is_business_member(p_business_id) then
    raise exception 'Weekly videos are unavailable for this business';
  end if;

  select b.timezone into business_timezone
  from public.businesses b where b.id = p_business_id;
  business_timezone := coalesce(nullif(business_timezone, ''), 'Asia/Kolkata');
  week_start := date_trunc('week', now() at time zone business_timezone) at time zone business_timezone;
  week_end := week_start + interval '7 days';

  with counts as (
    select
      e.metadata ->> 'video_key' as video_key,
      public.resolve_video_like_kind(
        p_business_id,
        p_theme_id,
        e.metadata ->> 'video_key'
      ) as video_kind,
      count(*)::bigint as weekly_likes
    from public.website_events e
    where e.business_id = p_business_id
      and e.event_type = 'video_like'
      and e.metadata ->> 'theme_id' = btrim(p_theme_id)
      and e.created_at >= week_start
      and e.created_at < week_end
    group by e.metadata ->> 'video_key'
  ), ordered as (
    select video_key, video_kind, weekly_likes
    from counts
    where video_kind is not null
    order by weekly_likes desc, video_key
    limit safe_limit
  ), ranked as (
    select
      row_number() over (order by weekly_likes desc, video_key)::integer as rank,
      video_key,
      video_kind,
      weekly_likes
    from ordered
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank', rank,
    'video_id', video_key,
    'theme_id', btrim(p_theme_id),
    'video_kind', video_kind,
    'weekly_likes', weekly_likes
  ) order by rank), '[]'::jsonb)
  into ranked_videos
  from ranked;

  return jsonb_build_object(
    'theme_id', btrim(p_theme_id),
    'week_start', week_start,
    'week_end', week_end,
    'videos', ranked_videos
  );
end
$$;

-- Direct analytics inserts remain available for the existing event types, but
-- video_like can only be created through like_video(). This prevents clients
-- bypassing target/theme/session validation with arbitrary metadata.
drop policy if exists website_events_public_insert on public.website_events;
create policy website_events_public_insert on public.website_events
for insert to anon, authenticated
with check (
  public.is_published_business(business_id)
  and event_type <> 'video_like'
);

revoke all on function public.resolve_video_like_kind(uuid, text, text) from public;
revoke all on function public.video_like_actor_key(text) from public;
revoke all on function public.like_video(uuid, text, text, text) from public;
revoke all on function public.get_video_like_state(uuid, text, text[], text) from public;
revoke all on function public.get_weekly_top_videos(uuid, text, integer) from public;

grant execute on function public.like_video(uuid, text, text, text)
  to anon, authenticated, service_role;
grant execute on function public.get_video_like_state(uuid, text, text[], text)
  to anon, authenticated, service_role;
grant execute on function public.get_weekly_top_videos(uuid, text, integer)
  to anon, authenticated, service_role;

comment on column public.social_videos.theme_id is
  'Optional active website theme relation; NULL preserves pre-15.1 unscoped videos.';
comment on column public.social_videos.video_kind is
  'Phase 15.3 Short/Long discriminator; NULL rows use URL/platform inference.';
comment on function public.like_video(uuid, text, text, text) is
  'Creates at most one validated like per auth user/browser session, video and theme; returns updated all-time/current-week counts.';
comment on function public.get_weekly_top_videos(uuid, text, integer) is
  'Returns only the requested theme current-week ranking using the business timezone.';

commit;
