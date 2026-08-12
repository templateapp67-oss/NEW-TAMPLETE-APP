# HANDOFF — Nexora Salon Website Builder

> Last updated: **2026-08-12** (session `arena/019ff405-new-tamplete-app`).
> Read `AGENTS.md` first; read `docs/database-migrations-plan.md` before touching
> any database work.

## Current repository state

- **Auth UI / Login Modal fixed**:
  - The login modal now renders through a React portal (`createPortal(..., document.body)`),
    preventing any clipping or hidden modal issues caused by parent `overflow-hidden`,
    CSS transforms, or stacking contexts (specifically on Screen 02 Hero Split, TopBar, and Location screens).
  - Accessible HTML `<form>` with explicit **Log In** and **Sign Up** mode switcher tabs,
    email and password inputs (with show/hide password toggle and ≥6 character validation for sign-up),
    Enter-to-submit, loading spinner, error/notice banners, Escape key listener, and backdrop click to close.
  - The form opens reliably even when Supabase environment variables are absent, displaying a clear notice:
    *"Authentication form is ready, but Supabase is not connected. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the app."*
  - TopBar account action includes a graceful loading fallback so buttons never permanently disappear during session verification.
  - Automated regression suite added in `scripts/test-auth-modal.mjs` (`npm run test:auth`).
- `supabase/migrations/` continues to contain **15 ordered DRAFT migrations (M01–M15)**
  based on the 90-point specification §5.25.
- `scripts/validate-migrations.mjs` applies all 15 files twice and runs the P88
  functional acceptance set A–L using `@electric-sql/pglite` (real PostgreSQL).
- Validation is green: **15/15 clean apply on pass 1, 15/15 on pass 2, 12/12
  functional tests, and 13/13 auth regression tests**.
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
| #7 | 15 Safe migrations draft from 90-point spec (M01–M15) + PGlite acceptance suite |
| Current | Fix login and sign-up modal portal rendering, accessible form, and triggers |

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

## Environment & Supabase Auth configuration requirements

For real authentication and owner session management:

1. **Supabase Dashboard → Project Settings → API**:
   - `VITE_SUPABASE_URL`: Project URL (`https://<project-ref>.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: `anon` / `public` API key
   - **Never** expose `service_role` in browser client or repository code.
2. **Supabase Dashboard → Authentication → Providers**:
   - **Email** provider must be enabled.
3. **Supabase Dashboard → Authentication → URL Configuration**:
   - Add your app/preview URL (`https://{port}-{sandboxId}.e2b.app` or custom domain)
     to **Redirect URLs** and **Site URL**.
4. **Email Confirmation**:
   - If *Confirm email* is enabled in Supabase, users will receive a verification link upon
     signing up. The form displays a confirmation notice and instructs the user to check their email.

```bash
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev                 # http://0.0.0.0:3000
```

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

## Validation commands

```bash
npm run lint                # TypeScript type check (tsc --noEmit)
npm run test:auth           # Auth modal and login reliability regression tests
node verify-22-screens.js   # Static verification of all 25 screens & features
npm run validate:migrations # PGlite: apply M01–M15 twice + run tests A–L
npm run build               # Vite build + esbuild server bundle
```

Expected output:
- `lint`: 0 errors
- `test:auth`: 13/13 passed
- `verify-22-screens`: 25/25 verified
- `validate:migrations`: 15/15 applied cleanly x2, 12/12 functional tests passed

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
