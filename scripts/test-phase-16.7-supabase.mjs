#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const {
  ownerSupabaseAllowedTransitions,
  readOwnerSupabaseBookingsWithClient,
  updateOwnerSupabaseBookingStatusWithClient,
} = await import('../src/lib/supabaseBookingManagement.ts');

const SALON = '10000000-0000-4000-8000-000000000001';
const CUSTOMER = '20000000-0000-4000-8000-000000000002';
const BOOKING = '30000000-0000-4000-8000-000000000003';
const SERVICE = '40000000-0000-4000-8000-000000000004';

function payload(status = 'pending') {
  return {
    template_key: 'beauty_skin_spa',
    booking: {
      id: BOOKING, salon_id: SALON, customer_user_id: CUSTOMER, staff_id: null,
      booking_number: 'LIVE-1670', appointment_start: '2031-08-20T05:30:00.000Z',
      appointment_end: '2031-08-20T06:30:00.000Z', status, total_paise: 100000,
      currency: 'INR', customer_note: null, created_at: '2031-08-19T05:30:00.000Z',
      updated_at: '2031-08-19T05:30:00.000Z',
    },
    items: [{
      id: '50000000-0000-4000-8000-000000000005', booking_id: BOOKING,
      service_id: SERVICE, quantity: 1, unit_price_paise: 100000,
      line_total_paise: 100000, service_name_snapshot: 'Real Facial',
      duration_minutes_snapshot: 60,
    }],
    customer: { name: 'Real Customer', email: 'customer@example.test', phone: '+919999999999' },
  };
}

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

await test('owner list reads the server-authorized RPC and maps real rows', async () => {
  const calls = [];
  const client = { rpc: async (name, args) => {
    calls.push({ name, args });
    return { data: [payload()], error: null };
  } };
  const rows = await readOwnerSupabaseBookingsWithClient(client);
  assert.deepEqual(calls, [{ name: 'get_owner_bookings', args: undefined }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, BOOKING);
  assert.equal(rows[0].bookingId, 'LIVE-1670');
  assert.equal(rows[0].businessId, SALON);
  assert.equal(rows[0].customerId, CUSTOMER);
  assert.equal(rows[0].customer.name, 'Real Customer');
  assert.equal(rows[0].serviceName, 'Real Facial');
  assert.equal(rows[0].bookingStatus, 'pending_payment');
  assert.equal(rows[0].paymentStatus, 'unpaid');
  assert.equal(rows[0].persistence, 'supabase');
});

await test('canonical owner transitions cover pending, confirmed and terminal states', () => {
  assert.deepEqual(ownerSupabaseAllowedTransitions('pending_payment'), ['confirmed', 'cancelled']);
  assert.deepEqual(ownerSupabaseAllowedTransitions('confirmed'), ['completed', 'cancelled']);
  assert.deepEqual(ownerSupabaseAllowedTransitions('completed'), []);
  assert.deepEqual(ownerSupabaseAllowedTransitions('cancelled'), []);
});

await test('status update sends immutable booking id plus optimistic expected status', async () => {
  const calls = [];
  const client = { rpc: async (name, args) => {
    calls.push({ name, args });
    return { data: payload('confirmed'), error: null };
  } };
  const updated = await updateOwnerSupabaseBookingStatusWithClient(client, {
    id: BOOKING, bookingStatus: 'pending_payment', databaseStatus: 'pending', persistence: 'supabase',
  }, 'confirmed');
  assert.deepEqual(calls, [{
    name: 'update_owner_booking_status',
    args: { p_booking_id: BOOKING, p_expected_status: 'pending', p_next_status: 'confirmed' },
  }]);
  assert.equal(updated.bookingStatus, 'confirmed');
  assert.equal(updated.paymentStatus, 'unpaid', 'booking mutation must not change payment status');
});

await test('client blocks invalid and terminal transitions before RPC', async () => {
  let calls = 0;
  const client = { rpc: async () => { calls += 1; return { data: null, error: null }; } };
  await assert.rejects(
    updateOwnerSupabaseBookingStatusWithClient(client, {
      id: BOOKING, bookingStatus: 'cancelled', databaseStatus: 'cancelled', persistence: 'supabase',
    }, 'completed'),
    /invalid booking status transition/i,
  );
  await assert.rejects(
    updateOwnerSupabaseBookingStatusWithClient(client, {
      id: BOOKING, bookingStatus: 'completed', databaseStatus: 'completed', persistence: 'supabase',
    }, 'confirmed'),
    /invalid booking status transition/i,
  );
  assert.equal(calls, 0);
});

await test('server permission and transition refusals stay safe', async () => {
  const denied = { rpc: async () => ({ data: null, error: { code: 'P0001', message: 'Booking not found or permission denied' } }) };
  await assert.rejects(
    updateOwnerSupabaseBookingStatusWithClient(denied, {
      id: BOOKING, bookingStatus: 'pending_payment', databaseStatus: 'pending', persistence: 'supabase',
    }, 'confirmed'),
    /not found or permission denied/i,
  );
  const invalid = { rpc: async () => ({ data: null, error: { code: 'P0001', message: 'Invalid booking status transition' } }) };
  await assert.rejects(
    updateOwnerSupabaseBookingStatusWithClient(invalid, {
      id: BOOKING, bookingStatus: 'confirmed', databaseStatus: 'confirmed', persistence: 'supabase',
    }, 'completed'),
    /invalid booking status transition/i,
  );
});

const sql = readFileSync(new URL('../docs/phase-16.7-booking-status-management.sql', import.meta.url), 'utf8');
await test('SQL derives owner scope through organization_members and salons only', () => {
  assert.match(sql, /organization_members[\s\S]*organization_id[\s\S]*auth\.uid\(\)/i);
  assert.doesNotMatch(sql, /(?:from|join)\s+public\.job_salon_members/i);
  assert.match(sql, /lower\(m\.role::text\) in \('owner', 'owner_admin'\)/i);
});

await test('SQL keeps RLS enabled with own-salon booking and item policies', () => {
  assert.match(sql, /alter table public\.bookings enable row level security/i);
  assert.match(sql, /create policy bookings_owner_select/i);
  assert.match(sql, /create policy booking_items_owner_select/i);
  assert.doesNotMatch(sql, /disable row level security/i);
  assert.doesNotMatch(sql, /to anon/i);
});

await test('server mutation locks the row and enforces the canonical transition graph', () => {
  assert.match(sql, /for update of b/i);
  assert.match(sql, /pending_payment'\) and next_status in \('confirmed', 'cancelled'\)/i);
  assert.match(sql, /current_status in \('confirmed', 'upcoming'\) and next_status in \('completed', 'cancelled'\)/i);
  assert.match(sql, /status changed; refresh and try again/i);
  assert.match(sql, /invalid booking status transition/i);
});

await test('RPC grants are authenticated-only and no payment mutation exists', () => {
  assert.match(sql, /grant execute on function public\.get_owner_bookings\(\) to authenticated/i);
  assert.match(sql, /grant execute on function public\.update_owner_booking_status\(uuid, text, text\) to authenticated/i);
  assert.doesNotMatch(sql, /update\s+public\.payments/i);
  assert.doesNotMatch(sql, /insert\s+into\s+public\.payments/i);
  assert.doesNotMatch(sql, /payment_status\s*=/i);
});

await test('owner panel uses the real repository and disables repeated actions', () => {
  const panel = readFileSync(new URL('../src/components/BookingManagementPanel.tsx', import.meta.url), 'utf8');
  assert.match(panel, /readOwnerSupabaseBookings\(\)/);
  assert.match(panel, /updateOwnerSupabaseBookingStatus\(record, next\)/);
  assert.match(panel, /isSupabaseConfigured[\s\S]*databaseRecords/);
  assert.match(panel, /disabled=\{updatingId !== null\}/);
  const dashboard = readFileSync(new URL('../src/components/OwnerDashboard.tsx', import.meta.url), 'utf8');
  assert.match(dashboard, /<BookingManagementPanel/);
});

await test('customer My Bookings remains Supabase-exclusive in configured builds', () => {
  const customer = readFileSync(new URL('../src/components/SiteMyBookings.tsx', import.meta.url), 'utf8');
  assert.match(customer, /readMySupabaseBookings\(liveSalonId, themeId\)/);
  assert.match(customer, /isSupabaseConfigured\s*\?\s*databaseBookings\s*:\s*readMyBookings/);
});

console.log(`\n${passed}/${passed} Phase 16.7 Supabase booking-management checks passed.`);
