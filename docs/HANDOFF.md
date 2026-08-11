# HANDOFF — Nexora Salon Website Builder

> Last updated: **2026-08-11** (session `arena/019ff184-new-tamplete-app`).
> Read `AGENTS.md` first; read `docs/database-migrations-plan.md` before touching
> any database work.

## Current repository state

- The 25-screen React/Express application and owner location/auth/nearby-search
  work remain unchanged.
- `supabase/migrations/` now contains **15 ordered DRAFT migrations (M01–M15)**
  based on the 90-point specification §5.25.
- `scripts/validate-migrations.mjs` applies all 15 files twice and runs the P88
  functional acceptance set A–L using `@electric-sql/pglite` (real PostgreSQL).
- Validation is green: **15/15 clean apply on pass 1, 15/15 on pass 2, and 12/12
  functional tests**.
- **No migration has been applied to local, staging, or live Supabase.** The SQL
  is a reviewed/testable draft only.

## PR history

| PR | What landed |
|----|-------------|
| #1 | Complete 16-screen navigation, standardized headers, server fallbacks |
| #2 | All 22 screens activated — universal navigator, backend & Vite fixes |
| #3 | Screens 23–25 — Booking Confirmation, Referral, Branding White-label |
| #4 | Nexora 90-point Supabase master database specification |
| #5 | Leaflet/Nominatim owner location, Supabase auth, public `/nearby` search |
| #6 | Repository agent guide (`AGENTS.md`) and this handoff document |
| Current DB draft | M01–M15, migration plan, PGlite replay + tests A–L |

## Existing application inventory

- **Wizard screens 01–16**: Landing, Hero Split, Template, Details, Services,
  Team, Photos, Socials, Location & Hours, Contact & Booking, Appearance, AI
  Content Review, Full Website Preview, Publish Setup, Publish Success + QR,
  Booking Confirmation.
- **Screen 17**: Staff Management Module (7-day shifts, payroll/commissions,
  role permissions, availability).
- **Dashboard 18–25**: Overview, Website & Design, Bookings & Calendar,
  Payments & Revenue, Share, Settings, Referral, Branding.
- **Public customer discovery**: `/nearby` renders `NearbySalonSearch`.
- **Current app persistence**: wizard/dashboard data is still primarily
  localStorage/in-memory; the draft DB schema is not yet wired to screens.

## Database status — keep these realities separate

### 1. Live Supabase schema used by the app today

Known from earlier live checks/documentation:

- `public.salons` owns authoritative location columns: `address`, `latitude`,
  `longitude`, `location_confirmed`, `location_confirmed_at`.
- Ownership is `auth.users.id → organization_members (role='owner') →
  salons.organization_id`.
- Helpers include `nexora_owner_salon_ids()` and
  `private.can_manage_salon_settings(id)`.
- `job_salon_members` is a staff relation and must never be treated as owner
  identity.

This live schema has **not** been introspected during the migration-draft work.
Do not infer its complete state from the repository.

### 2. Target architecture from the 90-point specification

- Canonical tenant model: `businesses` + `business_members`.
- One source each for services, staff, customers, bookings, payments, website,
  media, settings and referrals.
- Business-scoped RLS; narrow public website RPC; business-scoped Storage.
- Integer INR paise and a DB/server-enforced fixed 25% advance.
- Historical booking snapshots, payment verification/idempotency, audit events,
  auto-save/resume, plan/white-label gates.

### 3. Checked-in M01–M15 drafts

The draft creates a clean target schema only when no known legacy collision is
present. **M02 deliberately raises an exception** when it finds known live/legacy
names (`salons`, `organizations`, `organization_members`, `job_salon_members`,
`staff`, `appointments`, `referrals`). This fail-closed behavior prevents a
parallel business model.

Because the known live project has several of those objects, M02 must be
regenerated after read-only introspection with explicit preserving
rename/ALTER/backfill steps. M03–M15 may also need adjustments based on the
actual types, keys, policies and data.

The optional `payment_refunds` table is deferred until a real refund backend is
implemented. SQL also cannot read browser localStorage; the later application
wiring step must upsert each owner's existing draft/progress payload.

## Migration validation

```bash
npm install
npm run validate:migrations
```

Expected output:

```text
Migration pass 1: 15/15 applied cleanly
Migration pass 2: 15/15 applied cleanly
...
Functional tests: 12/12 passed
```

Tests A–L cover tenant isolation, single service/staff sources, live published
sync, ₹1,200 → ₹300/₹900 math, unverified-payment rejection, exactly-once
verification, dashboard/revenue consistency, archived-history preservation,
onboarding resume, published slug access, and private-field exclusion.

PGlite validates PostgreSQL behavior on a clean schema. It does not prove that
the drafts can safely upgrade the unknown live schema and does not replace
Supabase staging tests.

## Environment and running locally

```bash
cp .env.example .env
npm install
npm run dev                 # http://0.0.0.0:3000
npm run lint
node verify-22-screens.js
npm run validate:migrations
```

Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional
server-side `GEMINI_API_KEY`, and optional `NOMINATIM_*` overrides. Never expose
`service_role`, Razorpay secret, webhook secret, or Gemini key in the browser or
in database fields.

## Guardrails / gotchas

- **Do not apply M01–M15 yet.** Draft generation and PGlite validation are not
  execution approval.
- Read-only live introspection comes first; sanitize outputs before committing.
- Regenerate M02 rather than bypassing its collision exception.
- No destructive table replacement, duplicate `salons`/`businesses` model, ID
  rewrite, or unreviewed constraint on existing rows.
- Keep payments/bookings server-controlled. Anonymous users get no direct
  booking/payment table writes.
- Razorpay signatures are verified in trusted server/Edge code; DB functions
  receive only the verified result and never a secret.
- Existing `docs/owner-location-setup.sql` predates these migrations; reconcile
  it with finalized M02/M12 before running either path.
- The app has no router; `/nearby` remains special-cased in `src/main.tsx`.
- Preserve server binding/CORS/host compatibility and the intentional Vite
  HMR/watch configuration.

## Required next sequence

1. **Live Supabase introspection (read-only).**
2. **Regenerate M02** and adapt downstream drafts to preserve the actual schema/data.
3. Re-run clean replay, legacy-upgrade fixtures and security review.
4. Obtain a **separate explicit go-ahead** for database execution.
5. Apply M01–M15 in order via Supabase CLI (preferred) or SQL editor.
6. Run acceptance tests **A–L** from spec P88 on the approved environment.
7. Generate/commit Supabase **TypeScript types** per P72 and wire the service layer.

In short: **live Supabase introspection → M02 regenerate → approved M01–M15
apply → acceptance A–L → TypeScript types**.
