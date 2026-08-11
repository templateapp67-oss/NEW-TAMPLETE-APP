# HANDOFF — Nexora Salon Website Builder

> Last updated: **2026-08-11** (session `arena/019ff13b-new-tamplete-app`).
> Read `AGENTS.md` (repo root) for architecture, commands, and conventions.

## Current repository state

- `main` is at `4baede2` — merge of **PR #5** ("Shop location (Leaflet +
  Nominatim) + owner auth + public nearby salon search").
- Working tree is clean; the session branch `arena/019ff13b-new-tamplete-app`
  is identical to `origin/main`.
- All 5 PRs merged so far (see history below). No open PRs.

## What has been built (PR history)

| PR | What landed |
|----|-------------|
| #1 | Complete 16-screen navigation, standardized headers, server fallbacks |
| #2 | All 22 screens activated — universal navigator, backend & Vite fixes |
| #3 | Screens 23–25 — Booking Confirmation (NX-10482), Share Referral Premium, Branding White-label |
| #4 | Docs — Nexora 90-point Supabase database master specification (`docs/nexora-database-spec.md`) |
| #5 | Shop location (Leaflet + Nominatim geocode proxy), owner auth (Supabase), public nearby salon search at `/nearby` |

### Feature inventory (25 screens / modules)

- **Wizard screens 01–16**: Landing, Hero Split, Template, Details, Services,
  Team, Photos, Socials, Location & Hours, Contact & Booking, Appearance, AI
  Content Review, Full Website Preview, Publish Setup, Publish Success + QR,
  Booking Confirmation.
- **Screen 17**: Staff Management Module (7-day shifts, payroll & commissions,
  role permissions, availability).
- **Dashboard 18–25**: Overview, Website & Design, Bookings & Calendar,
  Payments & Revenue, Share, Settings, Referral, Branding — tabbed from the
  dashboard module in `src/App.tsx`.
- **Public customer discovery**: `/nearby` route renders `NearbySalonSearch`
  (Haversine distance in JS; only confirmed, coordinate-bearing salons).
- **Owner location**: Leaflet map + Nominatim search/reverse via the Express
  proxy (`/api/geocode/*`, rate-limited ≥1.1s, cached 24h).

## Database status — IMPORTANT

Two different realities coexist; keep them straight:

1. **Live schema (in production Supabase, used by the app today)**:
   - `public.salons` with `address`, `latitude`, `longitude`,
     `location_confirmed`, `location_confirmed_at` — the **authoritative**
     location columns (`location_latitude` / `location_longitude` do not exist).
   - Ownership: `auth.users.id → organization_members (role='owner') →
     salons.organization_id`, helper `nexora_owner_salon_ids()` and
     `private.can_manage_salon_settings(id)` already exist.
   - `job_salon_members` is a staff relationship — **never** used for ownership.

2. **90-point master specification (`docs/nexora-database-spec.md`)**:
   - Status: **COLLECTION COMPLETE (90/90) — AWAITING USER APPROVAL.**
   - **No SQL has been run. No migrations applied. No schema/RLS changes.**
   - The spec's guardrails: no destructive ops; one business model; INR in
     paise; 25% advance rule; RLS per-salon; storage salon-scoped; the next
     step is the user saying **"APPROVED — GENERATE FINAL SQL"** before any
     migration is written/executed.

### Manual setup required for owner location

`docs/owner-location-setup.sql` must be run **manually** in the Supabase SQL
editor (it only grants/checks existing objects; the app never executes it).
It verifies the owner's salon membership and applies the required grants so
the location editor and `/nearby` public reads work.

## Environment & running locally

```bash
cp .env.example .env        # then fill in real values
npm install
npm run dev                 # http://0.0.0.0:3000  (health: /api/health)
```

Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (browser), `GEMINI_API_KEY`
(server, optional — offline fallbacks ship), `NOMINATIM_*` (server, optional —
sensible built-in defaults ship).

Without a real Supabase project, auth/location features degrade gracefully
(configuration errors are surfaced instead of crashing); wizard + AI copy
features work with the offline fallbacks.

## Known constraints / gotchas

- No router — `/nearby` is special-cased in `src/main.tsx`; unknown production
  paths fall back to `index.html` (server.ts), unknown `/api/*` return JSON 404.
- `vite.config.ts` HMR/watch settings are tuned for agent editing
  (`DISABLE_HMR`) — don't change them.
- Server binds `0.0.0.0` with open CORS + `allowedHosts: true` for the preview
  proxy — preserve this.
- `verify-22-screens.js` is a static check (`node verify-22-screens.js`); run
  it plus `npm run lint` after UI changes.
- Money in the spec is integer **paise** (₹500 = 50000); UI forms show rupees.

## Suggested next steps (not yet started)

1. Await user approval of the 90-point spec → generate ordered safe migrations.
2. Wire dashboard tabs (overview/bookings/payments) to live Supabase data once
   the approved schema exists.
3. Consider a README for end users (repo currently has none).
4. Keep `HANDOFF.md` updated at the end of each session.
