-- M27 (DRAFT) / Phase 15.8: reserve the existing website-event discriminator
-- for video likes. Kept in its own migration because PostgreSQL requires an
-- enum addition to commit before M28 indexes/functions can reference it.
-- NOT applied to any database; the standard live-introspection gate remains.

alter type public.nexora_website_event_type
  add value if not exists 'video_like';
