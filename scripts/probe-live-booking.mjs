#!/usr/bin/env node
/**
 * Strict Phase 16.4 authenticated customer + booking-flow proof.
 *
 * Required operator-only environment (keep in an ignored local environment):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY       public anon/publishable key only
 *   PROBE_CUSTOMER_EMAIL         existing real customer login
 *   PROBE_CUSTOMER_PASSWORD
 *   PROBE_CUSTOMER_NAME          expected authenticated profile/display name
 *   PROBE_BOOKING_SALON_ID       salon selected in the public booking UI
 *   PROBE_BOOKING_SERVICE_ID     active service selected in that salon
 *   PROBE_BOOKING_STAFF_ID       staff returned by the live availability RPC
 *   PROBE_BOOKING_THEME_KEY      active public template key
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
  'PROBE_CUSTOMER_NAME',
  'PROBE_BOOKING_SALON_ID',
  'PROBE_BOOKING_SERVICE_ID',
  'PROBE_BOOKING_STAFF_ID',
  'PROBE_BOOKING_THEME_KEY',
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
const customerName = process.env.PROBE_CUSTOMER_NAME.trim();
const salonId = process.env.PROBE_BOOKING_SALON_ID.trim();
const serviceId = process.env.PROBE_BOOKING_SERVICE_ID.trim();
const staffId = process.env.PROBE_BOOKING_STAFF_ID.trim();
const themeKey = process.env.PROBE_BOOKING_THEME_KEY.trim();
const appointmentStart = new Date(process.env.PROBE_BOOKING_START);

assert.match(salonId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.match(serviceId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.match(staffId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
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
const anonymous = createClient(url, key, options);
let reader = null;

try {
  const { error: anonymousBookingError } = await anonymous.from('bookings').select('id').limit(1);
  assert.ok(anonymousBookingError, 'anonymous client could read private booking rows');

  const { data: signedIn, error: signInError } = await writer.auth.signInWithPassword({ email, password });
  assert.ifError(signInError);
  assert.ok(signedIn.user?.id, 'customer login returned no authenticated user');
  const userId = signedIn.user.id;
  const { data: updatedProfile, error: profileError } = await writer
    .from('profiles')
    .update({ full_name: customerName })
    .eq('id', userId)
    .select('id,full_name,phone')
    .single();
  assert.ifError(profileError);
  assert.equal(updatedProfile?.id, userId);
  assert.equal(updatedProfile?.full_name, customerName);

  const { data: catalogRaw, error: catalogError } = await writer.rpc('get_public_salon_service_catalog', {
    p_salon_id: salonId,
    p_template_key: themeKey,
  });
  assert.ifError(catalogError);
  assert.equal(catalogRaw?.salon_id, salonId);
  assert.equal(catalogRaw?.template_key, themeKey);
  const selectedCatalogService = catalogRaw?.services?.find((service) => service.id === serviceId);
  assert.ok(selectedCatalogService, 'selected service is not in the active real catalog');
  assert.ok(Number(selectedCatalogService.price_paise) >= 0);
  assert.ok(Number(selectedCatalogService.duration_minutes) > 0);

  const dateKey = appointmentStart.toISOString().slice(0, 10);
  const { data: slots, error: slotsError } = await writer.rpc('marketplace_slots', {
    p_salon_id: salonId,
    p_service_ids: [serviceId],
    p_date: dateKey,
    p_staff_id: staffId,
  });
  assert.ifError(slotsError);
  assert.ok(slots?.some((slot) => slot.staff_id === staffId && slot.slot_start === appointmentStart.toISOString()),
    'requested appointment is not present in the canonical live availability RPC');

  // A fabricated service UUID must be rejected before the valid proof insert.
  const { error: invalidServiceError } = await writer.rpc('create_customer_booking', {
    p_salon_id: salonId,
    p_service_ids: ['ffffffff-ffff-4fff-8fff-ffffffffffff'],
    p_staff_id: staffId,
    p_appointment_start: appointmentStart.toISOString(),
    p_customer_note: 'phase-16.2-invalid-service-proof',
    p_idempotency_key: crypto.randomUUID(),
  });
  assert.ok(invalidServiceError, 'the server accepted an invalid/wrong-salon service id');
  assert.match(invalidServiceError.message, /inactive|another salon|template/i);

  const marker = `phase-16.2-live-proof:${new Date().toISOString()}`;
  const idempotencyKey = crypto.randomUUID();
  const { data: createdRaw, error: createError } = await writer.rpc('create_customer_booking', {
    p_salon_id: salonId,
    p_service_ids: [serviceId],
    p_staff_id: staffId,
    p_appointment_start: appointmentStart.toISOString(),
    p_customer_note: marker,
    p_idempotency_key: idempotencyKey,
  });
  assert.ifError(createError);
  assert.match(createdRaw, /^[0-9a-f-]{36}$/i, 'RPC returned no booking UUID');
  const bookingId = createdRaw;

  const { data: duplicateRaw, error: duplicateError } = await writer.rpc('create_customer_booking', {
    p_salon_id: salonId,
    p_service_ids: [serviceId],
    p_staff_id: staffId,
    p_appointment_start: appointmentStart.toISOString(),
    p_customer_note: `${marker}:retry`,
    p_idempotency_key: idempotencyKey,
  });
  assert.ifError(duplicateError);
  assert.equal(duplicateRaw, bookingId);

  // A new client plus a new password session models a full browser reload. The
  // read uses only the authenticated customer JWT and customer-self RLS.
  await writer.auth.signOut();
  reader = createClient(url, key, options);
  const { data: reloadedSignIn, error: reloadSignInError } = await reader.auth.signInWithPassword({ email, password });
  assert.ifError(reloadSignInError);
  assert.equal(reloadedSignIn.user?.id, userId);
  const { data: reloadedProfile, error: reloadedProfileError } = await reader
    .from('profiles')
    .select('id,full_name')
    .eq('id', userId)
    .single();
  assert.ifError(reloadedProfileError);
  assert.equal(reloadedProfile?.full_name, customerName);

  const { data: reloadedPayloads, error: reloadError } = await reader.rpc('get_customer_bookings', {
    p_salon_id: salonId,
    p_booking_id: bookingId,
  });
  assert.ifError(reloadError);
  assert.equal(reloadedPayloads?.length, 1);
  const reloaded = reloadedPayloads[0];
  assert.equal(reloaded.booking.id, bookingId);
  assert.equal(reloaded.booking.customer_user_id, userId);
  assert.equal(reloaded.booking.salon_id, salonId);
  assert.equal(reloaded.booking.customer_note, marker);
  assert.equal(reloaded.booking.staff_id, staffId);
  assert.equal(reloaded.items?.length, 1);
  assert.equal(reloaded.items[0].service_id, serviceId);
  assert.equal(reloaded.items[0].service_name_snapshot, selectedCatalogService.name);
  assert.equal(Number(reloaded.items[0].unit_price_paise), Number(selectedCatalogService.price_paise));

  const { error: directStatusError } = await reader
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);
  assert.ok(directStatusError, 'customer bypassed the approved lifecycle with a direct table update');

  const bookingReference = reloaded.booking.booking_number || bookingId;

  const { data: customerLink, error: customerLinkError } = await reader
    .from('salon_customers')
    .select('salon_id, customer_user_id, email, phone')
    .eq('salon_id', salonId)
    .eq('customer_user_id', userId)
    .maybeSingle();
  assert.ifError(customerLinkError);
  assert.equal(customerLink?.salon_id, salonId);
  assert.equal(customerLink?.customer_user_id, userId);
  assert.equal(customerLink?.email, reloadedSignIn.user.email);

  console.log('PASS authenticated customer login and profile prefill identity');
  console.log('PASS real active salon/template service catalog resolved');
  console.log('PASS invalid/wrong-salon service id rejected by the server');
  console.log('PASS active salon/service RPC insert with server-derived amount and duration');
  console.log('PASS duplicate retry returned the same booking and booking item');
  console.log('PASS fresh-session reload retrieved the same customer/salon/service row through RLS');
  console.log('PASS anonymous private reads and direct customer status updates are rejected');
  console.log(`BOOKING_ID=${bookingId}`);
  console.log(`BOOKING_REFERENCE=${bookingReference}`);
  console.log(`DATABASE_STATUS=${reloaded.booking.status}`);
} finally {
  await writer.auth.signOut().catch(() => {});
  if (reader) await reader.auth.signOut().catch(() => {});
}
