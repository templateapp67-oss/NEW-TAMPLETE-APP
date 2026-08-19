# Phase 16.6 — Booking Confirmation + Mock Receipt (all 5 themes)

> Scope: confirmation and receipt UX only. Razorpay, webhooks, signature
> verification, payment RPCs, and authoritative payment persistence are
> intentionally deferred.

## Runtime source audit

The current repository does **not** persist public-site bookings in Supabase.
The active 16.x demo flow reads its booking-shaped records from the existing
browser store in `siteBookingPayment.ts`. Phase 16.6 therefore marks that
provenance as `browser_demo` and displays **DEMO BOOKING DATA**. A future
Supabase-backed projection can set `bookingSource: 'supabase'` without changing
the receipt UI.

Phase 16.6 never writes a booking or payment. Existing customer, tenant, and
theme filtering remains in `readBookingConfirmation`; unknown, foreign-customer,
foreign-salon, and foreign-theme references remain inaccessible.

## Explicit mock payment layer

`mockPaymentForConfirmation()` is a pure, read-only Phase 16.6 presentation
projection:

- status: `TEST / MOCK — PAYMENT BACKEND DEFERRED`
- total: booking snapshot total
- test advance: `round(total × 25%)`
- test remaining: `total − test advance`
- receipt reference: `TEST-RECEIPT-{booking-reference}`

The confirmation and downloaded receipt both say that no Razorpay payment was
made, no real payment record was created, and the receipt is not proof of
payment. Simulated gateway references and simulated `paid` status are never
shown as real payment evidence in the Phase 16.6 panel.

## Confirmation and receipt fields

The responsive shared panel displays:

- booking reference and booking status (kept separate from mock payment status)
- salon name, address, phone, and email when present
- service names and categories
- appointment date, start/end time, duration, and staff preference
- customer name, mobile, and email when present
- total, test 25% advance, test remaining, mock status, and safe test receipt
  reference

The same panel is available in the flow and booking history. Refresh/remount
reconstructs the mock presentation from the booking view; it creates no payment
row and changes no payment status.

## Files

- `src/lib/siteBookingConfirmation.ts` — source provenance plus pure mock
  payment/receipt projection.
- `src/lib/siteBookingConfirmationI18n.ts` — EN/HI demo and mock disclosures.
- `src/components/SiteBookingConfirmation.tsx` — responsive confirmation,
  customer/salon/category details, mock payment card, and receipt.
- `scripts/test-phase-16.6.mjs` — mock labeling, 25% math, safe test reference,
  privacy, refresh/remount, and no-write checks.

## Database and payment changes

None. No migration, RPC, Supabase payment write, Razorpay integration, webhook,
or signature-verification work is part of Phase 16.6.
