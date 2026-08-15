# PHASE 15.7 — VIDEO PLAYER + ORIGINAL PLATFORM REDIRECT

> Status: **COMPLETE** · session `arena/01a00455-new-tamplete-app`

Phase 15.7 finalises the customer-facing video cards/player on the existing
Phase 15.1–15.6 architecture. It does **not** add a second feed, a video-file
store, likes, weekly ranking, or dashboard integration.

## Audit before implementation

| Existing piece | Phase 15.7 use |
|---|---|
| `SalonData.socialVideos` / `SocialVideo.url` | Existing external URL record; retained for backwards compatibility |
| `videoItemsForTheme` | Existing owner-first, theme-isolated 5 Shorts + 5 Long projection |
| `SiteVideoGallery` | Existing shared card + on-demand iframe surface for all five themes |
| `/api/video-metadata` | Existing public YouTube oEmbed path; no API key |
| `siteVideoCatalog.ts` | Existing protected per-theme showcase records |
| Phase 15.6 management/moderation | Existing add/edit/replace/tombstone/approval workflow |

No new database table, column, migration, relationship, API key, or private
credential was introduced. `SocialVideo.originalUrl` and `channelUrl` are
additive optional client fields so old drafts still load.

### Catalog source correction

The previous protected catalog used syntactically valid public YouTube ids, but
several destinations were unrelated music/demo videos with salon-authored title
and channel labels. That no longer met the Phase 15.7 requirement to show and
open the **original video and original source**.

The 50 protected slots keep their stable record ids and 5+5 per-theme shape,
but their external videos were re-curated and checked against YouTube oEmbed on
2026-08-15:

- each link resolves to theme-relevant barber, hair, spa, family, or nail/lash content;
- each title is the exact oEmbed title;
- each channel name and channel URL is the exact oEmbed author metadata;
- each Short uses its real `/shorts/{id}` destination;
- each Long Video uses its real `watch?v={id}` destination;
- the old unrelated redirects are absent.

## Exact original URL contract

Every newly created/replaced/catalog video now carries:

```ts
{
  url: string;          // legacy/canonical field
  originalUrl?: string; // exact configured platform destination
  channelName?: string;
  channelUrl?: string;  // exact provider source URL when supplied
}
```

- Add flow: `fetchVideoMetadata()` keeps the exact paste in
  `metadata.originalUrl`, even when oEmbed returns a canonical watch URL.
- Save flow: `socialVideoFromPasteAndMetadata()` writes that exact value.
- Replace flow: `buildVideoReplaceFields()` keeps the exact replacement paste
  separately from the canonical legacy `url`.
- Protected catalog: `originalUrl === url` on every record.
- Grandfathered 15.1–15.6 rows without `originalUrl` use their exact existing
  `url`; the first management edit safely backfills it.
- If a record has an explicit but invalid `originalUrl`, opening fails closed.
  The app never silently swaps in a different/canonical/unrelated destination.

The server now returns YouTube `author_url` as `channelUrl` and echoes the
request's exact `originalUrl`. Cache hits replace only that request-specific
field, so one URL variant cannot overwrite another visitor's exact paste.

## URL safety (`src/lib/videoPlatform.ts`)

All card/player external actions use one provider-aware validation gate:

1. Parse with `URL`; reject empty, malformed, oversized, control-character,
   non-http(s), and credential-bearing URLs.
2. Match an exact provider host (YouTube/youtu.be, Instagram, Facebook/fb.watch,
   TikTok); lookalike hosts fail.
3. Require a provider-native single-video path, not a home/channel/profile URL.
4. When `externalVideoId` exists, require the URL's native id to match it.
5. Re-check active theme immediately before play/open; stale foreign-theme
   objects are refused.
6. Return the exact trimmed input, preserving path, query and fragment.
7. Open with `_blank` + `noopener,noreferrer` only after validation.

Channel/profile URLs have a separate provider-aware validator and cannot be a
video URL masquerading as a source link.

## Final card/player interaction

### Responsive cards

The one shared card now shows, on desktop/tablet/mobile:

- lazy thumbnail with fixed 9:16 Short or 16:9 Long ratio;
- broken/missing-thumbnail fallback that leaves both actions usable;
- exact platform, title, channel/source and Short/Long badge;
- source link only when its exact provider profile URL validates;
- thumbnail-wide Play trigger, Play button, and direct View action;
- frame-mode spacing/grid (no new viewport-breakpoint layout dependency).

### Player

- YouTube/Instagram: clicking the thumbnail or Play mounts the provider embed
  on demand; no iframe is loaded with the page.
- Facebook/TikTok/open-only destinations: click opens the exact original video
  directly after the same safety + theme checks.
- The dialog has loading, ready, unavailable and invalid states, Escape/backdrop
  close, focus restore, body scroll lock and source/type metadata.
- Iframe error or a bounded loading timeout shows a clear unavailable state;
  the exact original-platform fallback remains available.
- The external player action re-validates and opens `originalUrl` unchanged.
- Theme/data change closes the player, clears filters/errors/broken-thumbnail
  state, and removes all stale prior-theme interaction objects.

The legacy `SiteVideo` primitive was also hardened to derive embeds only from a
validated native id; it no longer trusts an arbitrary `embedUrl` or opens an
unchecked URL.

## Files

| File | Change |
|---|---|
| `src/lib/videoPlatform.ts` | **NEW** — strict provider video/source validation, exact destination + theme gate, safe opener |
| `src/components/SiteVideoGallery.tsx` | Final responsive card/player, direct original destination, loading/unavailable/invalid states |
| `src/components/SiteVideo.tsx` | Legacy primitive hardened with the same safety contract |
| `src/lib/siteVideoGallery.ts` | Projects exact `originalUrl`/`channelUrl`; rejects invalid explicit originals |
| `src/lib/siteVideoCatalog.ts` | 50 relevant source-verified videos; exact titles/channels/URLs; stable protected record ids |
| `src/lib/videoUrlMetadata.ts` | Exact paste + oEmbed channel URL preserved through metadata/save |
| `server.ts` | oEmbed `author_url` + request-specific `originalUrl` response |
| `src/lib/videoManagement.ts` | Exact replacement URL preservation + safe legacy backfill |
| `src/lib/videoModeration.ts` | Publish gate uses provider-aware destination/source validation |
| `src/lib/siteSocialFeed.ts` | Legacy feed projects only safe exact destinations |
| `src/lib/siteVideoGalleryI18n.ts` | EN/HI player/loading/unavailable/source copy |
| `src/types.ts` | Additive optional `SocialVideo.originalUrl` / `channelUrl`; valid initial records |
| `scripts/test-phase-15.7.mjs` | **NEW** — 21-test acceptance suite |

## Explicitly out of scope

- likes or like counts in the Phase 15.7 UI/data path;
- weekly most-liked/top-video calculation;
- dashboard video integration;
- Phase 15.8 or any later phase;
- Instagram/Facebook/TikTok metadata auto-fetch;
- database/schema execution.

## Validation

```bash
npm run test:phase-15.7   # 21/21
npm run test:phase-15     # 157/157
npm run test:phase-10.8   # 36/36
npm run test:phase-10.12  # 178/178
npm run lint              # 0 errors
npm run build             # green
node verify-22-screens.js # all 25 screens verified
```
