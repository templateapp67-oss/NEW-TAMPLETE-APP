# Phase 16.7 — Real Supabase Booking Management

> Scope: customer/owner booking reads and owner booking-status lifecycle only.
> Payment remains `TEST / MOCK — PAYMENT BACKEND DEFERRED` and is not mutated.

## Authority

Configured builds use `public.bookings` plus `booking_items`. Customer My
Bookings already calls `readMySupabaseBookings()`, which filters by the
validated auth user and salon, with customer-self RLS as the final authority.
It never merges browser records into a configured result.

Owner management uses two narrowly scoped RPCs defined in
`docs/phase-16.7-booking-status-management.sql`:

- `get_owner_bookings()` derives the owner's salons from
  `auth.uid() → organization_members → organization_id → salons.organization_id`
  and returns their real booking/item/customer snapshots.
- `update_owner_booking_status(uuid, text, text)` derives authority through the
  same chain, locks the booking, checks the expected current status, validates
  the transition, and updates only `bookings.status`.

Neither RPC accepts a salon/customer identity from the browser.
`job_salon_members` is not used.

## Canonical transitions

- pending / pending_payment → confirmed or cancelled
- confirmed / upcoming → completed or cancelled
- completed and cancelled are terminal

The expected-status argument makes retries optimistic and duplicate-safe. A
stale, repeated, foreign-salon, missing, or invalid transition is rejected by
the database. The UI also disables actions while a mutation is in flight, but
that is not treated as authorization.

## UI integration

- `SiteMyBookings` continues to reload real customer bookings from Supabase and
  therefore shows owner status changes after refresh.
- `BookingManagementPanel` uses the real owner read/mutation repository in
  configured builds and retains the old browser demo only when Supabase is not
  configured.
- `OwnerDashboard` includes the existing management panel in its Overview,
  using the session-resolved salon context. The RPC independently rechecks the
  owner relationship.
- Loading, updating, success, error, unauthorized, empty, not-found, stale and
  invalid-transition paths fail closed.

## RLS

The additive SQL keeps RLS enabled and adds owner SELECT policies for bookings
and booking items through the canonical organization relationship. RPC execute
is revoked from public/anon and granted only to authenticated. Customer-self
policies from Phase 16.1 remain unchanged.

## Payment separation

No payment table, payment status, mock amount, Razorpay path, webhook, or
payment verification code is read or changed by Phase 16.7. Booking lifecycle
is independent from the deferred payment backend.

## Validation

- `test:phase-16.7-supabase`: owner row mapping, transition graph, optimistic
  mutation, permission refusal, RLS/ownership SQL and payment non-mutation.
- `test:phase-16.7`: existing five-theme/local fallback regression.
- Supabase booking guardrails and Phase 16.1–16.6 suites remain supplemental.

## Deployment note

The SQL file is a reviewed manual migration artifact. It was not automatically
executed from the browser or this repository.
