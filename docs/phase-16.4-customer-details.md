# Phase 16.4 — Authenticated Customer Details + Real Booking Flow

## Scope

Phase 16.4 keeps the existing salon → service → date → time → customer details
→ summary flow and connects its customer step to the authenticated Supabase
customer. It does not implement payment, cancellation, reschedule, refunds,
webhooks, or a race-safe availability transaction.

## Customer identity and prefill

Configured builds resolve customer details from the validated Supabase session
and the existing `salon_customers` relationship:

- identity: authenticated user id (`auth.uid()` in the booking RPC);
- name: current Supabase Auth user metadata when available;
- phone: own salon relationship, then Auth phone;
- email: Auth email, then own salon relationship email.

Browser profile and booking-draft identity values are not used for configured
prefill. Draft notes may remain as temporary, non-identity form state. If the
Auth profile has no name, the existing required-name field remains empty rather
than inventing a customer name.

The authenticated email is read-only in the configured booking form. An edited
valid name updates only the current signed-in user's Supabase Auth metadata
before booking. Phone remains contact data on the existing `salon_customers`
relationship and never becomes identity.

## Validation

The existing validation rules remain, with reasonable input bounds:

- trimmed name: 2–100 characters;
- phone: 10–13 digits and at most 32 formatted characters;
- optional email: existing email pattern and at most 254 characters;
- optional booking notes: at most 1000 characters.

The UI applies matching `maxLength` limits. The canonical booking RPC repeats
phone and note bounds for crafted requests.

## Summary and submission

The existing summary continues to show the real database catalog selection,
category, date, time, summed duration, database catalog total, salon, and current
customer details. Display values do not become authoritative inputs: the RPC
still derives price, duration, appointment end, active salon/template/service
relationships, and authenticated customer identity.

The final action is removed while the request is processing and guarded against
rapid duplicate clicks. No success UI appears before the Supabase RPC returns a
persisted booking and booking items. Safe failures keep the summary/draft and
provide Back and Try again actions without exposing database details.

## Duplicate retry behavior

`create_customer_booking(uuid, uuid[], timestamptz, text, text)` remains the one
canonical booking RPC with the same signature. The Phase 16.4 replacement adds a
sequential retry lookup for the exact authenticated customer, salon,
appointment start, and service-id set. A browser/network retry returns the
existing booking/reference/items with `duplicate: true` instead of inserting a
second row.

The UI lock handles rapid clicks. Race-safe concurrent availability booking is
still deliberately deferred to its later phase.

## Persistence

The success view, My Bookings, and Booking Details are projected from the real
RPC result or authenticated Supabase reads. Booking item service snapshots and
the existing booking reference survive refresh. Supabase rows are never written
to `nexora_site_payment_records`.

## Database patch

Apply `docs/phase-16.4-customer-booking-flow.sql` after Phase 16.2. It:

- replaces the body of the same canonical booking RPC;
- keeps `auth.uid()`, existing tables, RLS, statuses, and reference defaults;
- validates phone/note bounds;
- returns an existing exact booking for sequential duplicate retries;
- creates no table, column, duplicate customer model, or second booking RPC.

## Verification

```bash
npm run lint
npm run build
npm run test:phase-16.1
npm run test:phase-16.2
npm run test:phase-16.3
npm run test:phase-16.4-supabase
npm run test:supabase-booking
```

`npm run probe:live-booking` performs the strict authenticated live
insert/duplicate/reload proof with operator-only environment values.
