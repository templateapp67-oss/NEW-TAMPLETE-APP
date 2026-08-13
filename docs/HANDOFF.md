# HANDOFF — Nexora Salon Website Builder

> Last updated: **2026-08-13** (session `arena/019ff8e8-new-tamplete-app`).
> Read `AGENTS.md` first; read `docs/database-migrations-plan.md` before touching
> any database work.

## Current repository state

- **Phase 7.3 exact five-theme seed completed (draft, not applied):**
  - Added generated M18 seeding only `barber_mens_grooming`,
    `hair_studio_color_bar`, `beauty_skin_spa`, `family_full_service`, and
    `nail_lash_studio`.
  - Exact Phase 2–6 source totals: 5 themes, 17 categories, 78 predefined
    services, and 30 suggested mappings. Names, descriptions, category links,
    sort order, active/suggested flags, and alias mappings are source-checked.
  - Suggested display labels/order live on their canonical predefined row
    (`suggested_label` / `suggested_sort_order`), so aliases do not create
    duplicate or unrelated service text.
  - `scripts/generate-theme-seed.mts` deterministically generates M18 from
    `src/lib/themeServices.ts`; `npm run validate:migrations` fails on drift.
  - Upserts make replay safe and preserve existing IDs. Saved salon/user
    `public.services` data is untouched.
  - Details: `docs/phase-7.3-five-theme-seed.md`. Final validation is M01–M18
    clean replay x2 and tests A–P passing (16/16).
- **Phase 7.2 saved-service catalog links completed (draft, not applied):**
  - Added M17, extending existing tenant-owned `public.services` in place with
    nullable `theme_id`, `category_id`, and `predefined_service_id`.
  - Existing manual/custom services remain valid with `NULL` provenance; no
    row is deleted, rewritten, or guessed from editable names/category text.
  - Direct and composite FKs enforce exact theme/category/predefined matching
    on insert and update, with `RESTRICT` parent deletes. Existing `business_id`,
    name, category text, description, price, duration, feature/status, ordering,
    booking/staff/package links, and RLS ownership remain unchanged.
  - Full rationale: `docs/phase-7.2-saved-service-catalog-links.md`.
  - Baseline migration checks passed before work; final validation is M01–M17
    clean replay x2 and tests A–O passing (15/15).
- **Phase 7.1 theme-service database architecture completed (draft, not applied):**
  - Added M16 with global `themes → service_categories → predefined_services`
    tables. No theme/service dataset is seeded.
  - Existing tenant-owned `public.services` remains unchanged; it is not
    equivalent to the global predefined catalog.
  - Category-to-theme and composite service/category/theme FKs reject orphan
    and cross-theme relationships. Parent deletes are restricted.
  - Added uniqueness/checks, ordered lookup indexes, timestamp triggers, and
    read-only active-catalog RLS for `anon`/`authenticated`; only `service_role`
    can mutate catalog rows.
  - Full rationale and ERD: `docs/phase-7.1-theme-service-database.md`.
  - Validation: M01–M16 replay cleanly twice; tests A–N pass (14/14).
- **Category-based auto-suggested service descriptions (Step 05 / Add Service)**:
  - When the user picks a **Category** in the "Add New Service" form, the
    Description field is auto-filled with a professional, customer-friendly,
    service-specific suggestion. Copy is category-aware (offline, rule-based —
    no API key needed): **Haircut** (precision cut), **Styling** (blow-dry/set),
    **Color** (color/highlights/balayage), **Treatment** (hair/scalp repair),
    **Barbering** (men's grooming/beard/shaving), plus a generic fallback.
  - Suggestions are prefixed with the service name (e.g. *"Balayage Color —
    Vibrant, long-lasting color…"*), so they stay service-specific and update as
    the name is typed (only while the description hasn't been hand-written).
  - Description is fully user-editable. If the user hand-writes it and then
    changes the category, the suggestion is **not** overwritten silently — an
    inline "Replace / Keep mine" confirmation appears. A **"Generate
    suggestion"** button is also provided to regenerate on demand.
  - All new logic lives in `src/screens/StepServices.tsx`
    (`suggestServiceDescription`, `handleOpenAddService`, `handleCategoryChange`,
    `handleServiceNameChange`, `handleServiceDescChange`, `applyDescSuggestion`).
    No schema/DB changes. Regression: `npm run lint`.
- **Owner Photo + Owner Role (Step 03 / dashboard edit)**:
  - `SalonData.ownerPhotoUrl` added and persisted through the existing
    `nexora_onboarding_state` localStorage flow (same pattern as `logoUrl`).
  - Step Details "Add Photo" is a real file picker: preview, change, remove,
    image-type + 2MB validation. Dashboard → Website → Owner Profile can edit
    the same fields after publish.
  - Owner Role is a select list (Founder, Co-Founder, Owner, Managing Director,
    Creative Director, Master Stylist, Senior Stylist, Salon Manager, Director,
    Founder & Master Stylist, Other). "Other" reveals a custom title field.
  - Both fields stay optional. Live preview / published site use the saved
    photo (initials fallback) instead of a hardcoded stock portrait.
  - No database/storage schema change. Maps conceptually to draft
    `business_owners.photo_url` / `role_title`.
  - Regression: `npm run test:owner`.
- **Brand Identity → Salon Name font & color**:
  - New shared presets in `src/lib/brandIdentity.ts`: **5 salon-name fonts**
    (Elegant Serif / Playfair, Modern Sans / Inter, Luxury Script / Great Vibes,
    Bold Display / Oswald, Editorial Slab / Arvo) and **5 theme-matching text
    colors** (Charcoal, Nexora Pink, Deep Gold, Emerald, Royal Blue).
  - New `SalonData` fields `salonNameFont` / `salonNameColor` (persisted in the
    existing localStorage flow — no schema/DB changes).
  - Pickers added in **Step 11 Template Appearance** (wizard, Brand Identity
    card) and the **Dashboard → Website tab** (Business & About Info → "Salon
    Name Style" box); both update the live preview instantly and auto-save.
  - The selected font/color is applied to the salon name in the published site
    renderers: `TemplateRenderer` (nav + footer, used by wizard previews, full
    website preview, publish setup, dashboard sandbox & live-site modal),
    `PreviewPane` (wizard live preview), `CustomerBookingPreview` (booking
    header + confirmation), and Step 11's inline preview.
- **Tagline category/sub-category picker** (Salon / Beauty / Spa with the exact
  sub-category lists, 5 professional options each + manual entry) already lived
  in Step 11 — verified working, saves to `data.tagline`, reflected in previews.
- **Core services** — "Add Another Service" in Step 11, "Add Service" in
  Step 05, and the Dashboard services drawer are all functional (name, price,
  duration, description; instant list + live preview updates).
- **Appointment payment rule** — advance deposit is fixed at **25%** everywhere
  (`StepContactBooking` forces `advanceDepositPercentage: 25`, dashboard shows
  the fixed policy, booking flow hardcodes 25%) with no 0/10/50/100 selector.
  Mock payment flow kept; no Razorpay/real gateway added. The testing-phase
  switch is documented at the top of `PreviewPane.tsx` (`advancePaymentSuccessful
  = true` keeps Call Now / WhatsApp / Book Online active; flip to `false` when
  the real integration lands).
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
- `supabase/migrations/` now contains **18 ordered DRAFT migrations (M01–M18)**:
  M01–M15 follow the 90-point specification §5.25; M16–M18 are the Phase 7
  catalog architecture, saved-service-link, and exact seed extensions.
- `scripts/validate-migrations.mjs` source-checks M18, applies all 18 files twice, and runs
  the expanded functional acceptance set A–P using `@electric-sql/pglite` (real PostgreSQL).
- Validation is green: **18/18 clean apply on pass 1, 18/18 on pass 2, 16/16
  functional tests, and 14/14 auth regression tests**.
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

### 3. Checked-in M01–M18 drafts

The draft creates a clean target schema only when no known legacy collision is
present. **M02 deliberately raises an exception** when it finds known live/legacy
names (`salons`, `organizations`, `organization_members`, `job_salon_members`,
`staff`, `appointments`, `referrals`). This fail-closed behavior prevents a
parallel business model.

Because the known live project has several of those objects, M02 must be
regenerated after read-only introspection with explicit preserving
rename/ALTER/backfill steps. M03–M18 may also need adjustments based on the
actual types, keys, policies and data.

The optional `payment_refunds` table is deferred until a real refund backend is
implemented. SQL also cannot read browser localStorage; the later application
wiring step must upsert each owner's existing draft/progress payload.

## Validation commands

```bash
npm run lint                # TypeScript type check (tsc --noEmit)
npm run test:auth           # Auth modal and login reliability regression tests
node verify-22-screens.js   # Static verification of all 25 screens & features
npm run generate:theme-seed # regenerate M18 from the TypeScript source
npm run validate:migrations # source-check M18 + apply M01–M18 twice + tests A–P
npm run build               # Vite build + esbuild server bundle
```

Expected output:
- `lint`: 0 errors
- `test:auth`: 14/14 passed
- `verify-22-screens`: 25/25 verified
- `validate:migrations`: M18 source check + 18/18 applied cleanly x2, 16/16 tests passed

## Guardrails / gotchas

- **Do not apply M01–M18 yet.** Draft generation and PGlite validation are not
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
5. Apply M01–M18 in order via Supabase CLI (preferred) or SQL editor.
6. Run P88 acceptance tests **A–L** plus Phase tests **M–P** on the approved environment.
7. Generate/commit Supabase **TypeScript types** per P72 and wire the service layer.

In short: **live Supabase introspection → M02 regenerate → approved M01–M18
apply → acceptance A–P → TypeScript types**.
