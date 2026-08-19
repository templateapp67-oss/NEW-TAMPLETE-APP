# Phase 16.2 — Real Supabase Service Selection & Booking Items

> Status: implementation complete; live SQL and running-app proof required.
> Scope: connect the existing multi-service booking UI to the live active salon
> catalog and persist its existing `booking_items` relationship. No payment,
> cancellation, reschedule, race-safe availability transaction, or later phase.

## Existing UI preserved

The Phase 16 service selection remains the one existing flow:

- `bookingServicesForTheme` and `bookingSelectedServices` still enforce the
  active in-memory theme list used by the selection component.
- The established service cards still show name, category, price, duration,
  selection totals, and the six-service cap.
- The existing combined-duration availability calculation and slot/hold engine
  are unchanged.
- Unconfigured/test builds retain their legacy local catalog/payment sandbox.

## Configured Supabase authority

When Supabase is configured, `SiteBookingFullFlow` does not render browser-local
service rows. It first calls `get_public_salon_service_catalog` and replaces the
booking flow's `data.services` with the returned live rows. Local offers are not
applied because this phase has no live offer/payment integration and the booking
RPC derives the base total from `services.price_paise`.

The catalog RPC:

1. Resolves the active template from `salon_public_websites`.
2. Rejects a caller whose requested UI template does not match that active
   server template.
3. Returns only active `services` joined to active `service_categories` for the
   selected salon.
4. Exposes only the existing public-safe service fields needed by the booking
   UI.

The client validates the returned salon/template and every returned row before
mapping it into the existing `Service` model. Real UUIDs, category identity,
price, and duration remain database-sourced.

## Existing booking RPC reused

`create_customer_booking(uuid, uuid[], timestamptz, text, text)` remains the one
booking creation RPC. Its signature is unchanged. Phase 16.2 strengthens its
existing service resolution by requiring:

- authenticated `auth.uid()`;
- active, non-deleted selected salon;
- an active public website/template for that salon;
- one to six unique service UUIDs;
- each service active and owned by that salon;
- each service linked to an active existing service category.

The browser sends service IDs, appointment start, note, and phone only. It does
not send an authoritative customer ID, price, duration, total, booking status,
reference, or appointment end.

The RPC calculates:

- `bookings.total_paise = sum(services.price_paise)`;
- `bookings.appointment_end = appointment_start + sum(duration_minutes)`;
- one existing `booking_items` row per selected live service with real
  `service_id`, price, name, and duration snapshots.

The returned `template_key`, booking, and items are validated before projection
into the existing confirmation/history model.

## Refresh behavior

My Bookings still reads authenticated `bookings` with nested `booking_items`.
The active template is resolved again through the server catalog RPC rather than
trusted from browser state. Booking Details receives that already RLS-authorized
record, so service name, service ID, price, and duration come from persisted
booking-item snapshots after refresh.

Supabase-backed history rows remain read-only. Local payment, cancellation, and
reschedule engines refuse them.

## Database patch

Apply `docs/phase-16.2-service-booking-items.sql` after the Phase 16.1 SQL. It:

- creates no table or column;
- adds the narrow public catalog RPC;
- replaces (does not duplicate) the existing booking RPC body;
- leaves booking/customer RLS and existing lifecycle defaults intact.

## Temporary browser state

The existing draft, hold, browser, and payment localStorage keys remain only for
pre-confirmation availability hints or unconfigured legacy tests. They are not
the configured build's service, booking-item, customer, price, or duration
authority.

## Verification commands

```bash
npm run lint
npm run build
npm run test:phase-16.1
npm run test:phase-16.2
npm run test:phase-16.2-supabase
npm run test:supabase-booking
```

For strict live insert/reload and invalid-service proof, run
`npm run probe:live-booking` with the documented operator-only environment.
