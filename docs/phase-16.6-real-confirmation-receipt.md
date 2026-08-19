# Phase 16.6 — Real Supabase Booking Confirmation & Receipt

## Authority boundary

Configured builds render confirmation/history/details from the persisted
Supabase booking returned by `create_customer_booking` or from authenticated
`bookings → booking_items` reads. They never read
`nexora_site_payment_records` as confirmation or payment authority.

The current repository still has only the legacy `simulateGateway` browser mock;
there is no connected server payment-order/verification client in the configured
booking path. Therefore a Supabase booking remains payment-pending/unpaid and is
never presented as payment-confirmed. This limitation must remain explicit until
the real Phase 16.5 payment prerequisite exists.

## Confirmation and receipt data

The shared confirmation and receipt surfaces show data from the authorized
record:

- existing booking/reference number;
- current salon presentation;
- persisted booking-item service names, prices and durations;
- server catalog category context where the current catalog still contains the
  service;
- persisted date/time and total;
- authenticated customer's permitted name, phone and email;
- booking status separately from payment status.

The current configured mapper has no backend payment source, so it safely shows
unpaid, zero paid, and the full booking total remaining. Those values are not
claimed as a verified payment receipt and cannot represent a successful payment.

No receipt number is generated. The downloadable text summary uses the booking
reference.

## Direct access

`readMySupabaseBookingByReference` resolves a booking UUID or booking number with
all of these constraints:

- validated Supabase session;
- selected salon id;
- `customer_user_id = authenticated user.id` defense-in-depth filter;
- existing customer-self booking and booking-item RLS.

A missing or foreign reference resolves to not-found. `SiteBookingDetails` uses
this repository in configured direct-access mode and never falls back to the
browser-local booking store.

## Duplicate safety

Confirmation and receipt components are read-only. Opening, refreshing,
downloading, or reopening a receipt does not invoke booking or payment creation.
Phase 16.4's canonical booking retry protection remains unchanged.

## Payment limitation

Because the configured application has no real Phase 16.5 payment integration,
this phase does not:

- claim production payment verification;
- mark a Supabase booking confirmed from local/mock state;
- copy mock paid status into Supabase;
- create payment rows/RPCs/tables;
- calculate or display an unpersisted required advance as though it were an
  authoritative payment record.

A successful persisted-payment refresh proof remains blocked by that missing
prerequisite, while real unpaid/pending booking confirmation and receipt reads
are supported safely.
