# Phase 16.6 — Real Booking Confirmation + Mock Receipt

> Scope: authenticated Supabase booking confirmation and receipt UX only.
> Razorpay, webhooks, signature verification, payment RPCs, and authoritative
> payment persistence remain intentionally deferred.

## Real booking authority

Configured builds use the Phase 16.1–16.4 Supabase path:

1. `SiteBookingFullFlow` loads the authenticated customer's details and the
   active salon's real service catalog.
2. Summary submission calls `createSupabaseBooking()`.
3. The database RPC derives customer identity from `auth.uid()`, validates the
   salon/services, prices and duration server-side, creates the booking and
   `booking_items`, and returns the persisted row and items.
4. The client immediately reloads that exact returned booking number/UUID via
   `readMySupabaseBookingByReferenceWithClient()`, constrained by salon and the
   authenticated customer. Confirmation does not rely only on the RPC response
   remaining in React state.
5. `supabaseBookingToPaymentRecord()` maps the authorized database read without
   changing its identity. `booking_number` is used when present; otherwise the
   persisted booking UUID is the canonical reference.
6. `SiteBookingConfirmation` renders the reloaded row with
   `bookingSource: 'supabase'` and state **Booking saved**.

No second booking or confirmation identifier is generated. Booking creation is
independent from the intentionally deferred payment backend.

## Refresh, My Bookings, and direct Booking Details

`readMySupabaseBookings()` and `readMySupabaseBookingByReference()` reload
`bookings` with nested `booking_items`. Every read requires an authenticated
session and is constrained by salon plus `customer_user_id = user.id`, in
addition to database RLS. A foreign or missing reference returns not-found and
never falls back to localStorage in configured builds.

The reloaded record preserves the booking reference, salon, service snapshots,
category context, date/time, duration, authenticated customer details, and
booking status. Confirmation and receipt projections are read-only.

## Explicit mock payment layer

`mockPaymentForConfirmation()` is a pure Phase 16.6 display projection:

- status: `TEST / MOCK — PAYMENT BACKEND DEFERRED`
- total: persisted booking total
- test advance: `round(total × 25%)`
- test remaining: `total − test advance`
- receipt reference: `TEST-RECEIPT-{booking-reference}`

The UI and downloaded receipt state that no Razorpay payment occurred and the
receipt is not proof of payment. These values never update the booking payment
status, write `public.payments`, or create a local authoritative payment row.
The same mock disclosure and math appear on the initial confirmation and on
Booking Details after a Supabase reload.

## Unconfigured development fallback

Legacy unconfigured tests retain the existing browser demo flow. Its projection
is explicitly marked `browser_demo` and the screen displays **DEMO BOOKING
DATA**. It is never presented as Supabase authority.

## Validation

- `test:phase-16.4-supabase`: authenticated details, validation, one RPC under
  double-click, safe failure/retry, real returned reference and confirmation.
- `test:supabase-booking`: server-derived identity/catalog/money guardrails,
  nested booking-item reads, direct-reference authorization, and no local
  authority in configured mode.
- `test:phase-16.6`: real Supabase provenance/reference state plus mock 25%
  receipt behavior, responsive UI, privacy, EN/HI, and no writes.
- Phase 16.1–16.3 legacy regression suites, typecheck, and production build.

## Database and payment changes

This Phase 16.6 integration adds no new database or payment change. It consumes
the merged Phase 16.1–16.4 Supabase booking foundation and keeps payment fully
mock/deferred.
