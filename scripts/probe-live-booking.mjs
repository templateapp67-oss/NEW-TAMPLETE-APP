#!/usr/bin/env node
/**
 * Strict Phase 16.1 live proof.
 *
 * Required operator-only environment (keep in an ignored local environment):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY       public anon/publishable key only
 *   PROBE_CUSTOMER_EMAIL         existing real customer login
 *   PROBE_CUSTOMER_PASSWORD
 *   PROBE_BOOKING_SALON_ID       salon selected in the public booking UI
 *   PROBE_BOOKING_SERVICE_ID     active service selected in that salon
 *   PROBE_BOOKING_START          future ISO timestamp selected by availability UI
 *
 * This intentionally creates one real pending booking. It never uses a service
 * role, accepts a customer id, mutates payment state, or deletes the proof row.
 */
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'PROBE_CUSTOMER_EMAIL',
  'PROBE_CUSTOMER_PASSWORD',
  'PROBE_BOOKING_SALON_ID',
  'PROBE_BOOKING_SERVICE_ID',
  'PROBE_BOOKING_START',
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Live booking proof not configured. Missing: ${missing.join(', ')}`);
  process.exit(2);
}

const url = process.env.VITE_SUPABASE_URL.trim();
const key = process.env.VITE_SUPABASE_ANON_KEY.trim();
const email = process.env.PROBE_CUSTOMER_EMAIL.trim();
const password = process.env.PROBE_CUSTOMER_PASSWORD;
const salonId = process.env.PROBE_BOOKING_SALON_ID.trim();
const serviceId = process.env.PROBE_BOOKING_SERVICE_ID.trim();
const appointmentStart = new Date(process.env.PROBE_BOOKING_START);

assert.match(salonId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.match(serviceId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.ok(Number.isFinite(appointmentStart.getTime()), 'PROBE_BOOKING_START must be a valid ISO timestamp');
assert.ok(appointmentStart.getTime() > Date.now(), 'PROBE_BOOKING_START must be in the future');
assert.doesNotMatch(key, /^sb_secret_/i, 'private Supabase keys are forbidden');
if (key.split('.').length === 3) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
  assert.notEqual(payload.role, 'service_role', 'service_role JWTs are forbidden');
}

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const writer = createClient(url, key, options);
let reader = null;

try {
  const { data: signedIn, error: signInError } = await writer.auth.signInWithPassword({ email, password });
  assert.ifError(signInError);
  assert.ok(signedIn.user?.id, 'customer login returned no authenticated user');
  const userId = signedIn.user.id;

  const marker = `phase-16.1-live-proof:${new Date().toISOString()}`;
  const { data: createdRaw, error: createError } = await writer.rpc('create_customer_booking', {
    p_salon_id: salonId,
    p_service_ids: [serviceId],
    p_appointment_start: appointmentStart.toISOString(),
    p_customer_note: marker,
    p_phone: signedIn.user.phone || null,
  });
  assert.ifError(createError);
  assert.ok(createdRaw?.booking?.id, 'RPC returned no booking row');
  assert.equal(createdRaw.booking.customer_user_id, userId);
  assert.equal(createdRaw.booking.salon_id, salonId);
  assert.equal(createdRaw.items?.length, 1);
  assert.equal(createdRaw.items[0].service_id, serviceId);
  assert.ok(Number(createdRaw.items[0].duration_minutes_snapshot) > 0);
  assert.ok(Number(createdRaw.booking.total_paise) >= 0);
  assert.equal(createdRaw.booking.customer_note, marker);

  const bookingId = createdRaw.booking.id;
  const bookingReference = createdRaw.booking.booking_number || bookingId;

  // A new client plus a new password session models a full browser reload. The
  // read uses only the authenticated customer JWT and customer-self RLS.
  await writer.auth.signOut();
  reader = createClient(url, key, options);
  const { data: reloadedSignIn, error: reloadSignInError } = await reader.auth.signInWithPassword({ email, password });
  assert.ifError(reloadSignInError);
  assert.equal(reloadedSignIn.user?.id, userId);

  const { data: reloadedRows, error: reloadError } = await reader
    .from('bookings')
    .select(`
      id, salon_id, customer_user_id, booking_number,
      appointment_start, appointment_end, status, total_paise, currency,
      customer_note, created_at, updated_at,
      booking_items(
        id, booking_id, service_id, quantity, unit_price_paise,
        line_total_paise, service_name_snapshot, duration_minutes_snapshot
      )
    `)
    .eq('id', bookingId)
    .eq('salon_id', salonId)
    .eq('customer_user_id', userId)
    .single();
  assert.ifError(reloadError);
  assert.equal(reloadedRows.id, bookingId);
  assert.equal(reloadedRows.customer_user_id, userId);
  assert.equal(reloadedRows.salon_id, salonId);
  assert.equal(reloadedRows.customer_note, marker);
  assert.equal(reloadedRows.booking_items?.length, 1);
  assert.equal(reloadedRows.booking_items[0].service_id, serviceId);

  const { data: customerLink, error: customerLinkError } = await reader
    .from('salon_customers')
    .select('salon_id, customer_user_id')
    .eq('salon_id', salonId)
    .eq('customer_user_id', userId)
    .maybeSingle();
  assert.ifError(customerLinkError);
  assert.equal(customerLink?.salon_id, salonId);
  assert.equal(customerLink?.customer_user_id, userId);

  console.log('PASS authenticated customer login');
  console.log('PASS active salon/service RPC insert with server-derived amount and duration');
  console.log('PASS fresh-session reload retrieved the same customer/salon/service row through RLS');
  console.log(`BOOKING_ID=${bookingId}`);
  console.log(`BOOKING_REFERENCE=${bookingReference}`);
  console.log(`DATABASE_STATUS=${reloadedRows.status}`);
} finally {
  await writer.auth.signOut().catch(() => {});
  if (reader) await reader.auth.signOut().catch(() => {});
}
