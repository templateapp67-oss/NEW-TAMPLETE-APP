# Pre-Phase — Supabase connection and live-data foundation

This gate must pass before any Phase 16 backend work starts.

## One client and one environment contract

The application has one Supabase browser client: `src/lib/supabaseClient.ts`.
It reads only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (public anon or publishable key only)

Local development uses an ignored `.env.local`. Preview and production must set
those same names in the deployment environment before the Vite build. No
service-role/private key belongs in a `VITE_*` value. The client rejects example
placeholders, `sb_secret_*`, and legacy JWTs whose role is `service_role`.

## Required live verification

Run the real application, sign in with an existing owner, refresh, and open
screen 26. The dashboard's live diagnostics execute only session-scoped reads.
For a strict terminal gate, configure the ignored operator-only
`PROBE_OWNER_EMAIL` and `PROBE_OWNER_PASSWORD`, then run:

```bash
npm run probe:live-owner
```

The command exits successfully only if all of these are true:

1. the singleton browser-safe Supabase client initializes;
2. owner login creates a session that `getUser()` validates;
3. `nexora_owner_salon_ids()` exists, executes, and returns one salon;
4. the authenticated session can read its own active owner row from
   `organization_members`;
5. `organization_members.organization_id` resolves exactly one non-deleted
   `salons.organization_id` row;
6. the RPC and direct relationship return the same salon;
7. `loadOwnerDashboardContext()` reads that salon and authorizes the dashboard;
8. logout clears the probe session.

The probe never uses `job_salon_members`, a hardcoded identity, a service-role
key, or a database write. Browser refresh persistence must still be verified in
the running browser because a terminal process cannot prove browser storage
survives a page reload.

## Critical localStorage classification

No store is migrated or deleted during this connection phase.

| Key | Current use | Classification |
|---|---|---|
| Supabase auth storage managed by `supabase-js` | Auth access/refresh session | Required auth persistence; Supabase-owned, not application identity logic |
| `nexora_onboarding_state` | Salon builder data, owner profile, staff, services, gallery, settings, publish state | Intentional onboarding draft today; contains business-critical data that must later move to the canonical database |
| `nexora_dashboard_tab` | Legacy dashboard tab | UI-only preference |
| `nexora_owner_dashboard_section` | Phase 17 selected section | UI-only preference |
| `nexora_locale` | EN/HI choice | UI-only preference |
| `nexora_site_appearance` | Light/dark choice | UI-only preference |
| `nexora_site_booking_drafts` | In-progress booking wizard | Intentional temporary draft/cache |
| `nexora_site_booking_browser` | Customer identity | **Critical persistence; must move to authenticated/server-issued identity in Phase 16/later** |
| `nexora_site_booking_holds` | Availability and slot holds | **Critical persistence; must move to transactional Supabase booking logic** |
| `nexora_site_payment_records` | Booking, confirmation, payment state, receipts, reschedule/cancel source, and owner dashboard operational data | **Critical persistence; must move to authoritative bookings/payments tables** |
| `nexora_site_customer_profile` | Customer name/mobile/email | **Critical customer persistence; must move to session-owned data** |
| `nexora_site_customer_favorites` | Saved salons | Customer account persistence; later session-owned database data |
| `nexora_site_reviews` | Booking-linked customer reviews/moderation | **Critical customer/content persistence; later database + RLS** |
| `nexora_site_customer_notification_read` | Customer notification read state | Intentional UI cache today; later session-owned database state |
| `nexora_video_likes` | Visitor/user likes and weekly counts | Local product persistence; later M27/database-backed state |

The Phase 17 dashboard currently reads operational appointments, customers,
revenue, and notifications from `nexora_site_payment_records`. Supabase salon
identity resolution does not make those records live database data.

## Error boundaries

Configuration, anonymous session, auth validation, network, RLS/permission,
membership absence, missing salon, ambiguity, and database errors must remain
distinct. An empty RLS-filtered result is not sufficient evidence that an owner
has no membership; the app reports it as unverifiable unless visibility is
proven.

## Live verification record — 2026-08-19

The browser-safe project configuration was supplied through ignored
`.env.local` and used by the running application. The first owner walkthrough
proved login/session initialization but returned permission denied for
`organization_members`. The operator applied the validated, idempotent
`docs/owner-dashboard-ownership-fix.sql` correction through the Supabase SQL
Editor.

The second running-app walkthrough passed end to end:

- real owner login created a validated Supabase session;
- Screen 26 resolved and displayed the real salon through
  `organization_members.organization_id -> salons.organization_id`;
- page refresh retained the authenticated dashboard;
- logout cleared the session.

The correction ensures the existing session-derived RPC, authenticated own-row
membership read, and owner-only salon read. It creates no tables, columns,
users, memberships, salons, or demo rows; does not disable RLS; and never uses
`job_salon_members`.

The repository's M01–M27 migration set remains draft/unapplied. No booking,
payment, customer-account, reschedule, cancellation, or atomic transaction work
was started in this foundation phase.
