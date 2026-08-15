# PHASE 15.8 — LIKES + WEEKLY MOST-LIKED SYSTEM

> Status: **COMPLETE** · session `arena/01a00455-new-tamplete-app`
>
> M27–M28 are validated **DRAFT migrations only**. They were not applied to any
> local, staging, or live Supabase project; live read-only introspection and the
> repository’s standard explicit execution approval are still required.

Phase 15.8 adds one Like action/count to every video card and a theme-scoped
**Weekly Top Videos** result. It extends the existing Phase 15.1–15.7 gallery;
it does not create a second video feed or add dashboard integration.

## Required schema inspection (completed before design)

The checked-in schema and security layer were inspected first:

| Existing object | Finding / Phase 15.8 use |
|---|---|
| `public.social_videos` (M06) | Existing business-owned video source with UUID, business, platform, URL, external id, caption, order/status/timestamps; no like or theme/kind columns |
| `public.website_events` (M10) | Existing append-only website interaction log already has business, visitor token, JSON metadata and `created_at`; reused for like events |
| `nexora_website_event_type` (M01) | Closed enum did not contain `video_like`; M27 adds it in a separate commit boundary |
| `public.themes` (M16/M18) | Canonical five-theme relationship and string theme ids |
| Supabase Auth / `useAuth` | Existing persisted session; database can derive `auth.uid()` |
| `bookingBrowserId()` | Existing stable anonymous browser/session identity; reused, never relabelled as a user id |
| M12 website-event RLS | Allowed generic published-site analytics insert; narrowed so direct `video_like` inserts are refused |
| M14 event indexes | Business/time lookup existed; no per-viewer/video uniqueness or theme/week index |
| `SocialVideo.themeId` / `videoKind` | Existing Phase 15.1/15.3 client concepts, not yet represented in `social_videos` |

There was no secure existing video-like relation/count field. A mutable
`likes_count` on `social_videos` would lose weekly history and be vulnerable to
lost updates. A second `video_likes` table would duplicate the existing event
log. Phase 15.8 therefore reuses `website_events`.

The repository has no configured `.env`/live schema connection in this session.
Per the established M02 safety gate, no live assumptions or execution were
made.

## Database/backend enforcement (M27–M28)

### Existing structures reused

- M27 adds `video_like` to the existing website-event enum. It is separate
  because PostgreSQL requires a new enum value to commit before later indexes
  or functions reference it.
- M28 adds nullable `theme_id → themes.id` and checked
  `video_kind IN ('short','long')` to the existing `social_videos` table. These
  formalize existing client concepts; old rows remain NULL/grandfathered.
- Every like is an immutable `website_events` row whose metadata is exactly
  `video_key`, `theme_id`, and validated `video_kind`.
- No `video_likes` table and no mutable/all-time/weekly count column exists.

### Identity and duplicate protection

`like_video(business, theme, video, visitor_token)` accepts **no user id or
salon id**:

1. If authenticated, identity comes only from database `auth.uid()`; supplied
   browser token is ignored for identity.
2. If anonymous, it validates the existing `bookingBrowserId()` token.
3. The auth/session identity is SHA-256 hashed before being stored in the
   existing `visitor_token` column.
4. A partial unique index on business + hashed actor + theme + video guarantees
   at most one like under concurrent/repeated requests.
5. Duplicate calls return the authoritative existing count with
   `duplicate: true`; they never increment.

Changing a browser-supplied token cannot duplicate a signed-in user’s like.
Anonymous users can have separate real browser sessions, but cannot duplicate
within the same persisted session.

### Target/theme validation

`resolve_video_like_kind` validates before every write/read:

- owner video keys must be real UUID rows in `social_videos`, active, owned by
  the requested business, and either unscoped or linked to the requested active
  theme;
- protected theme keys must match one of the existing exact 5 Short + 5 Long
  stable slot ranges for that same theme;
- foreign-theme, arbitrary, inactive, cross-business, malformed and missing
  targets are refused;
- kind comes from the protected slot or checked database value (legacy NULL is
  inferred from its existing platform URL).

M28 replaces the generic public insert policy so `video_like` cannot be inserted
directly with forged JSON. Only the SECURITY DEFINER RPC can create one;
generic page/call/booking analytics retain their existing policy. RPC grants are
limited to `anon`, `authenticated`, and trusted `service_role`; helper functions
are revoked from public execution.

### Counts and current week

- Card count = all validated like events for exact business + theme + video.
- Weekly count = events in `[Monday 00:00, next Monday 00:00)` calculated using
  the existing `businesses.timezone` (default Asia/Kolkata).
- `get_video_like_state` returns all-time/current-week/viewer state for only the
  requested valid card ids (maximum 50).
- `get_weekly_top_videos` returns up to 10 current-theme rows ordered by weekly
  likes descending, with deterministic ties and Short/Long kind.
- No cron/reset is needed; week windows are calculated from immutable events.

## Client/session service (`src/lib/videoLikes.ts`)

Production behavior:

- requires a real existing database business UUID from `SalonData.businessId`
  or one unambiguous saved-service relationship;
- uses the existing Supabase browser client, which automatically carries the
  existing auth session;
- sends only business UUID, active theme, video key and existing browser token;
- validates every RPC response against the requested theme/card/kind;
- never falls back to local counts after a configured backend error.

Offline builder behavior (Supabase absent only):

- reuses the real saved `websiteSlug`/published URL as a preview namespace;
- uses `bookingBrowserId()` and an isolated `nexora_video_likes_v1` event store;
- applies the same business-scope/theme/video/session uniqueness and current
  Monday-week calculation;
- is explicitly a preview fallback, not a replacement security backend.

No fallback business/salon/user id such as `public-site`, `seed-*`, or a random
identity is generated. Missing/ambiguous identity fails closed with an
unavailable state.

## Customer UI

The existing `SiteVideoGallery` now provides:

- Like button + numeric all-time Like Count on every Short and Long card;
- loading/disabled state while counts or a write are pending;
- `Liked`/pressed state after success; duplicate action disabled;
- per-card safe error without changing count/ranking after a failed write;
- a Weekly Top Videos panel for the **active theme only**;
- rank, title, Short/Long badge and this-week count;
- click-through from a ranked result to the existing Phase 15.7 player;
- ranking loading, retryable error, unavailable and no-likes empty states;
- immediate count/ranking recomputation only after successful authoritative
  response;
- EN/HI and existing per-theme Light/Dark styling across all frame modes.

Theme/data changes invalidate in-flight writes, clear stale errors, reload the
new theme state, and prevent the previous theme’s ranking from rendering.

## Files

| File | Change |
|---|---|
| `supabase/migrations/20260815000101_m27_video_like_event_type.sql` | **NEW DRAFT** — commits `video_like` enum discriminator |
| `supabase/migrations/20260815000102_m28_video_likes_weekly.sql` | **NEW DRAFT** — social video theme/kind relation, event uniqueness/indexes, secure like/state/ranking RPCs and narrowed RLS |
| `src/lib/videoLikes.ts` | **NEW** — strict context, RPC adapter, offline preview events, current-week/ranking helpers |
| `src/components/SiteVideoGallery.tsx` | Like/count on every card + Weekly Top states/results |
| `src/lib/siteVideoGalleryI18n.ts` | EN/HI like/ranking/loading/error/empty copy |
| `src/types.ts` | Optional existing database `businessId` mapping only |
| `scripts/test-phase-15.8.mjs` | **NEW** — 23 client/UI/schema/security acceptance tests |
| `scripts/validate-migrations.mjs` | M01–M28 replay and backend adversarial test U |
| `scripts/lib/acceptance-harness.mjs` | Complete migration-set comment updated |
| `docs/database-migrations-plan.md` | M27–M28 audit/design/runbook status |

## Explicitly out of scope

- main website/dashboard integration;
- dashboard analytics or management cards;
- Phase 15.9 / 15.10;
- dislike/unlike reactions or reaction types;
- notifications/rewards based on likes;
- applying migrations to a database.

## Validation

```bash
npm run test:phase-15.8   # 23/23
npm run test:phase-15     # 180/180
npm run validate:migrations
# M18 source check; M01–M28 clean replay x2; A–U 21/21
npm run test:phase-10.8   # 36/36
npm run lint
npm run build
node verify-22-screens.js
```
