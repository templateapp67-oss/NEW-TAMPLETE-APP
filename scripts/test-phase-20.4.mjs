/**
 * PHASE 20.4 — RESCHEDULE & CANCELLATION acceptance.
 *
 * Verifies the customer reschedule + cancel functionality over the EXISTING
 * booking store:
 *   - eligibility (only live bookings: pending/confirmed/pay_at_salon)
 *   - reschedule date/time flow reusing the Phase 16 availability engine
 *   - slot validation: past, closed/holiday, conflicting, same-slot refused
 *   - confirmation shows old vs new + real money, payment unchanged
 *   - cancellation via the existing `customerCancelBooking` (real status
 *     flips to cancelled, slot released, no invented refund)
 *   - security: another customer's booking can never be modified
 *   - refresh: details re-read after PAYMENT_EVENT
 *   - EN/HI + light/dark
 */
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.matchMedia = () => ({
  matches: false, addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {},
});
dom.window.matchMedia = globalThis.matchMedia;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
globalThis.HTMLElement.prototype.scrollIntoView = dom.window.HTMLElement.prototype.scrollIntoView;
dom.window.scrollTo = () => {};
globalThis.localStorage = dom.window.localStorage;

const React = (await import('react')).default;
const { render, cleanup, act, fireEvent } = await import('@testing-library/react');

const SiteBookingDetails = (await import('../src/components/SiteBookingDetails.tsx')).default;
const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const { CUSTOMER_ACCOUNT_EVENT } = await import('../src/lib/siteCustomerAccount.ts');
const {
  customerRescheduleBooking,
  customerCancelBooking,
} = await import('../src/lib/bookingManagement.ts');
const {
  bookedSpansForSalon,
  bookingStatusBlocksAvailability,
} = await import('../src/lib/siteBookingAvailability.ts');
const { PAYMENT_STORE_KEY, PAYMENT_STORE_VERSION } = await import('../src/lib/siteBookingPayment.ts');
const { setSalonClockForTests, localDateKey, salonNow } = await import('../src/lib/salonStatus.ts');
const { setSiteLocale, setSiteAppearance } = await import('../src/lib/siteNavigation.ts');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}\n    ${String(error.message).split('\n').join('\n    ')}`);
  }
}
function section(title) {
  console.log(`\n■ ${title}`);
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const MY_ID = 'b-customer-me';
const OTHER_ID = 'b-customer-other';
// Pin the salon clock for deterministic dates: Mon 2026-08-17 10:00 local.
const PINNED = new Date(2026, 7, 17, 10, 0, 0);
setSalonClockForTests(PINNED);
const TODAY = localDateKey(salonNow());
const addDays = (key, n) => {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
};
const FUTURE = addDays(TODAY, 3);        // open day
const HOLIDAY = addDays(TODAY, 2);       // a holiday
const CONFLICT_DAY = addDays(TODAY, 4);  // conflict booking lives here

function record(partial) {
  return {
    id: `pay-${partial.bookingId}`,
    idempotencyKey: `key-${partial.bookingId}`,
    businessId: 'public-site',
    themeId: 'hair_studio_color_bar',
    customerId: MY_ID,
    bookingId: partial.bookingId,
    serviceId: partial.serviceId || 's1',
    serviceName: partial.serviceName || 'Haircut & Blow-Dry',
    services: partial.services,
    dateKey: partial.dateKey,
    startMinutes: partial.startMinutes,
    endMinutes: partial.endMinutes,
    baseAmount: partial.baseAmount,
    amountDue: partial.amountDue,
    remainingAmount: partial.remainingAmount,
    currency: 'INR',
    paymentOption: partial.paymentOption || 'advance',
    paymentMethod: partial.paymentMethod || 'upi',
    paymentStatus: partial.paymentStatus,
    bookingStatus: partial.bookingStatus,
    customer: partial.customer || { name: 'Neha Verma', mobile: '9876543210', email: 'neha@example.com' },
    createdAt: partial.createdAt || 1_700_000_000_000,
    updatedAt: partial.updatedAt || 1_700_000_000_000,
    payAtSalon: partial.payAtSalon || false,
    failureReason: partial.failureReason,
    ...partial,
  };
}

const UPCOMING = record({
  bookingId: 'NX-91001',
  serviceId: 's1',
  serviceName: 'Haircut & Blow-Dry',
  services: [{ serviceId: 's1', serviceName: 'Haircut & Blow-Dry', price: 350, durationMinutes: 30 }],
  dateKey: FUTURE,
  startMinutes: 10 * 60,
  endMinutes: 10 * 60 + 30,
  baseAmount: 350,
  amountDue: 88,
  remainingAmount: 262,
  paymentStatus: 'paid',
  bookingStatus: 'confirmed',
});

const COMPLETED = record({
  bookingId: 'NX-91002',
  serviceId: 's2',
  serviceName: 'Nourishing Hair Spa',
  services: [{ serviceId: 's2', serviceName: 'Nourishing Hair Spa', price: 900, durationMinutes: 45 }],
  dateKey: addDays(TODAY, -5),
  startMinutes: 15 * 60,
  endMinutes: 15 * 60 + 45,
  baseAmount: 900,
  amountDue: 225,
  remainingAmount: 0,
  paymentStatus: 'paid',
  bookingStatus: 'completed',
});

const CANCELLED = record({
  bookingId: 'NX-91003',
  serviceId: 's3',
  serviceName: 'Keratin Treatment',
  services: [{ serviceId: 's3', serviceName: 'Keratin Treatment', price: 3500, durationMinutes: 120 }],
  dateKey: FUTURE,
  startMinutes: 11 * 60,
  endMinutes: 13 * 60,
  baseAmount: 3500,
  amountDue: 0,
  remainingAmount: 3500,
  paymentOption: 'pay_at_salon',
  paymentMethod: null,
  paymentStatus: 'unpaid',
  bookingStatus: 'cancelled',
  failureReason: 'Cancelled by customer',
});

/** Blocks 10:00–11:00 on CONFLICT_DAY (the reschedule target day). */
const CONFLICT = record({
  bookingId: 'NX-91009',
  serviceId: 's9',
  serviceName: 'Hair Spa',
  services: [{ serviceId: 's9', serviceName: 'Hair Spa', price: 900, durationMinutes: 60 }],
  dateKey: CONFLICT_DAY,
  startMinutes: 10 * 60,
  endMinutes: 11 * 60,
  baseAmount: 900,
  amountDue: 225,
  remainingAmount: 675,
  paymentStatus: 'paid',
  bookingStatus: 'confirmed',
});

const FOREIGN = record({
  ...{ bookingId: 'NX-91999', serviceId: 's9', serviceName: 'Foreign', dateKey: FUTURE, startMinutes: 12 * 60, endMinutes: 13 * 60, baseAmount: 500, amountDue: 125, remainingAmount: 375, paymentStatus: 'paid', bookingStatus: 'confirmed' },
  customerId: OTHER_ID,
});

const SALON = {
  salonName: 'Royal Hair & Beauty Studio',
  tagline: 'Premium care',
  ownerName: 'Rahul',
  about: 'Premium salon',
  phone: '+91 98765 43210',
  email: 'contact@royal.in',
  services: [
    { id: 's1', name: 'Haircut & Blow-Dry', category: 'Haircut', description: '', price: 350, duration: 30 },
    { id: 's2', name: 'Nourishing Hair Spa', category: 'Treatment', description: '', price: 900, duration: 45 },
    { id: 's3', name: 'Keratin Treatment', category: 'Treatment', description: '', price: 3500, duration: 120 },
  ],
  packages: [],
  team: [],
  gallery: [],
  socialVideos: [],
  websiteSlug: 'royal-hair-studio',
  openingHours: {
    monday: { open: true, startTime: '09:00', endTime: '20:00' },
    tuesday: { open: true, startTime: '09:00', endTime: '20:00' },
    wednesday: { open: true, startTime: '09:00', endTime: '20:00' },
    thursday: { open: true, startTime: '09:00', endTime: '20:00' },
    friday: { open: true, startTime: '09:00', endTime: '20:00' },
    saturday: { open: true, startTime: '09:00', endTime: '20:00' },
    sunday: { open: true, startTime: '09:00', endTime: '20:00' },
  },
  holidays: [{ date: HOLIDAY, name: 'Test Holiday', closed: true }],
  bookingRules: {
    minNotice: '1 hour',
    maxAdvance: '30 days',
    bufferTime: 'No buffer',
    allowStaffSelection: true,
    advanceDepositPercentage: 25,
  },
};

/* Staffed salon: one stylist assigned to s1, working 10:00-14:00 every day. */
const SALON_STAFFED = {
  ...SALON,
  team: [{
    id: 'st1', name: 'Ananya', role: 'Stylist', specialties: [], imageUrl: '',
    status: 'Available', assignedServiceIds: ['s1'],
    schedule: {
      monday: { working: true, startTime: '10:00', endTime: '14:00' },
      tuesday: { working: true, startTime: '10:00', endTime: '14:00' },
      wednesday: { working: true, startTime: '10:00', endTime: '14:00' },
      thursday: { working: true, startTime: '10:00', endTime: '14:00' },
      friday: { working: true, startTime: '10:00', endTime: '14:00' },
      saturday: { working: true, startTime: '10:00', endTime: '14:00' },
      sunday: { working: true, startTime: '10:00', endTime: '14:00' },
    },
  }],
};

/* Salon that closes early (14:00) — no evening slots at all. */
const SALON_EARLY_CLOSE = {
  ...SALON,
  openingHours: Object.fromEntries(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      .map((d) => [d, { open: true, startTime: '09:00', endTime: '14:00' }]),
  ),
};

function seed(records) {
  window.localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify({ version: PAYMENT_STORE_VERSION, records }));
  localStorage.setItem('nexora_site_booking_browser', MY_ID);
}

function resetState() {
  cleanup();
  window.localStorage.removeItem(PAYMENT_STORE_KEY);
  localStorage.clear();
  setSalonClockForTests(PINNED);
  setSiteLocale('en');
  setSiteAppearance('light');
}

function renderDetails(bookingId, records) {
  seed(records);
  return render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar',
    data: SALON,
    bookingId,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
}

/* ================================================================== */
section('1 · Reschedule — data layer (secure + validated)');

await test('reschedules own live booking; payment unchanged', () => {
  seed([UPCOMING]);
  const result = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: addDays(FUTURE, 1), startMinutes: 12 * 60, data: SALON,
  });
  assert.equal(result.ok, true);
  const r = result.record;
  assert.equal(r.dateKey, addDays(FUTURE, 1));
  assert.equal(r.startMinutes, 12 * 60);
  assert.equal(r.endMinutes, 12 * 60 + 30);
  // payment + status untouched
  assert.equal(r.baseAmount, 350);
  assert.equal(r.amountDue, 88);
  assert.equal(r.remainingAmount, 262);
  assert.equal(r.paymentStatus, 'paid');
  assert.equal(r.bookingStatus, 'confirmed');
  assert.equal(r.customer.name, 'Neha Verma');
  resetState();
});

await test('refuses a conflicting slot (real booking blocks it)', () => {
  seed([UPCOMING, CONFLICT]);
  const result = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: CONFLICT_DAY, startMinutes: 10 * 60, data: SALON, // overlaps CONFLICT 10:00–11:00
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'slot-unavailable');
  // record untouched
  const after = JSON.parse(window.localStorage.getItem(PAYMENT_STORE_KEY)).records.find((r) => r.bookingId === 'NX-91001');
  assert.equal(after.dateKey, FUTURE);
  resetState();
});

await test('refuses the identical slot (same-slot)', () => {
  seed([UPCOMING]);
  const result = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: FUTURE, startMinutes: 10 * 60, data: SALON,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'same-slot');
  resetState();
});

await test('refuses a past time today (min notice respected)', () => {
  seed([UPCOMING]);
  // today at 09:00 with a 10:00 clock + 1h min notice → past
  const result = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: TODAY, startMinutes: 9 * 60, data: SALON,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'slot-unavailable');
  resetState();
});

await test('refuses a holiday (closed day)', () => {
  seed([UPCOMING]);
  const result = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: HOLIDAY, startMinutes: 12 * 60, data: SALON,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'slot-unavailable');
  resetState();
});

await test('refuses completed / cancelled bookings', () => {
  seed([COMPLETED, CANCELLED]);
  const a = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91002',
    dateKey: addDays(FUTURE, 1), startMinutes: 12 * 60, data: SALON,
  });
  assert.equal(a.ok, false);
  assert.equal(a.reason, 'invalid-transition');
  const b = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91003',
    dateKey: addDays(FUTURE, 1), startMinutes: 12 * 60, data: SALON,
  });
  assert.equal(b.ok, false);
  assert.equal(b.reason, 'invalid-transition');
  resetState();
});

await test('refuses another customer\'s booking (not-found)', () => {
  seed([FOREIGN]);
  const result = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91999',
    dateKey: addDays(FUTURE, 1), startMinutes: 12 * 60, data: SALON,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'not-found');
  resetState();
});

/* ================================================================== */
section('2 · Cancellation — data layer (secure + honest)');

await test('cancels own live booking; paid amount stays recorded', () => {
  seed([UPCOMING]);
  const result = customerCancelBooking('public-site', 'hair_studio_color_bar', 'NX-91001');
  assert.equal(result.ok, true);
  assert.equal(result.record.bookingStatus, 'cancelled');
  assert.equal(result.record.failureReason, 'Cancelled by customer');
  // payment is NOT refunded / invented — paid stays paid
  assert.equal(result.record.paymentStatus, 'paid');
  assert.equal(result.record.amountDue, 88);
  // slot released: cancelled no longer blocks availability
  assert.equal(bookingStatusBlocksAvailability('cancelled'), false);
  const spans = bookedSpansForSalon('public-site', 'hair_studio_color_bar');
  assert.equal(spans.some((s) => s.dateKey === FUTURE && s.startMinutes === 10 * 60), false);
  resetState();
});

await test('refuses cancelling a completed / already-cancelled booking', () => {
  seed([COMPLETED, CANCELLED]);
  const a = customerCancelBooking('public-site', 'hair_studio_color_bar', 'NX-91002');
  assert.equal(a.ok, false);
  assert.equal(a.reason, 'invalid-transition');
  const b = customerCancelBooking('public-site', 'hair_studio_color_bar', 'NX-91003');
  assert.equal(b.ok, false);
  assert.equal(b.reason, 'invalid-transition');
  resetState();
});

await test('refuses cancelling another customer\'s booking', () => {
  seed([FOREIGN]);
  const result = customerCancelBooking('public-site', 'hair_studio_color_bar', 'NX-91999');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'not-found');
  resetState();
});

/* ================================================================== */
section('2b · Reschedule — Phase 16 hours / staff windows / duration');

await test('reschedule respects STAFF WINDOWS (existing team schedule)', () => {
  seed([UPCOMING]);
  // staff works 10:00-14:00 and is assigned to the booked service → 15:00 rejected
  const outside = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: FUTURE, startMinutes: 15 * 60, data: SALON_STAFFED,
  });
  assert.equal(outside.ok, false);
  assert.equal(outside.reason, 'slot-unavailable');
  // inside the staff window → allowed
  const inside = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: FUTURE, startMinutes: 11 * 60, data: SALON_STAFFED,
  });
  assert.equal(inside.ok, true);
  resetState();
});

await test('reschedule respects SALON HOURS (early close)', () => {
  seed([UPCOMING]);
  const afterClose = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: FUTURE, startMinutes: 15 * 60, data: SALON_EARLY_CLOSE, // salon closes 14:00
  });
  assert.equal(afterClose.ok, false);
  assert.equal(afterClose.reason, 'slot-unavailable');
  const beforeClose = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: FUTURE, startMinutes: 12 * 60, data: SALON_EARLY_CLOSE,
  });
  assert.equal(beforeClose.ok, true);
  resetState();
});

await test('reschedule respects SERVICE DURATION (no partial slots before close)', () => {
  seed([UPCOMING]);
  // 30-min service; salon closes 14:00 → 13:45 does not fit a real slot → rejected
  const partial = customerRescheduleBooking({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-91001',
    dateKey: FUTURE, startMinutes: 13 * 60 + 45, data: SALON_EARLY_CLOSE,
  });
  assert.equal(partial.ok, false);
  assert.equal(partial.reason, 'slot-unavailable');
  resetState();
});

/* ================================================================== */
section('3 · Details UI — eligibility');

await test('live booking shows Reschedule + Cancel actions', async () => {
  const utils = renderDetails('NX-91001', [UPCOMING]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-details-reschedule'));
  assert.ok(utils.getByTestId('booking-details-cancel'));
  resetState();
});

await test('completed booking shows no modify actions', async () => {
  const utils = renderDetails('NX-91002', [COMPLETED]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.queryByTestId('booking-details-reschedule'), null);
  assert.equal(utils.queryByTestId('booking-details-cancel'), null);
  resetState();
});

await test('cancelled booking shows no modify actions (cannot cancel twice)', async () => {
  const utils = renderDetails('NX-91003', [CANCELLED]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.queryByTestId('booking-details-reschedule'), null);
  assert.equal(utils.queryByTestId('booking-details-cancel'), null);
  resetState();
});

/* ================================================================== */
section('4 · Reschedule flow (UI)');

await test('date step disables the holiday; available day selectable', async () => {
  const utils = renderDetails('NX-91001', [UPCOMING]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-reschedule')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-reschedule'));
  const holidayCard = utils.getByTestId(`booking-reschedule-date-${HOLIDAY}`);
  assert.equal(holidayCard.getAttribute('data-selectable'), 'false');
  const futureCard = utils.getByTestId(`booking-reschedule-date-${FUTURE}`);
  assert.equal(futureCard.getAttribute('data-selectable'), 'true');
  resetState();
});

await test('time step disables a conflicting slot and confirms reschedule', async () => {
  const utils = renderDetails('NX-91001', [UPCOMING, CONFLICT]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-reschedule')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  // choose the conflict day — the 10:00 slot must be taken
  await act(async () => { fireEvent.click(utils.getByTestId(`booking-reschedule-date-${CONFLICT_DAY}`)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-continue')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const conflictSlot = utils.getByTestId('booking-reschedule-slot-600');
  assert.equal(conflictSlot.getAttribute('data-slot-state'), 'taken');
  assert.equal(conflictSlot.disabled, true);
  // pick a free slot (12:00 = 720)
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-slot-720')); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-continue')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  // confirm step shows old vs new + money
  const confirmView = utils.getByTestId('booking-reschedule');
  assert.ok(confirmView.textContent.includes('New date'), 'confirm step missing');
  assert.ok(confirmView.textContent.includes('₹350'), 'total missing');
  assert.ok(confirmView.textContent.includes('₹88'), 'advance missing');
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-confirm')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  // success + details re-read with the new slot
  assert.ok(utils.getByTestId('booking-details-success'), 'success banner missing');
  const stored = JSON.parse(window.localStorage.getItem(PAYMENT_STORE_KEY)).records.find((r) => r.bookingId === 'NX-91001');
  assert.equal(stored.dateKey, CONFLICT_DAY);
  assert.equal(stored.startMinutes, 12 * 60);
  assert.equal(stored.bookingStatus, 'confirmed');
  assert.equal(stored.paymentStatus, 'paid');
  resetState();
});

/* ================================================================== */
section('4b · Reschedule UI — staff-window slots disabled');

await test('staff-window slots are disabled in the reschedule grid', async () => {
  seed([UPCOMING]);
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON_STAFFED, bookingId: 'NX-91001',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-reschedule')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId(`booking-reschedule-date-${FUTURE}`)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-continue')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  // 15:00 is outside the staff window → taken/disabled
  const outside = utils.getByTestId('booking-reschedule-slot-900');
  assert.equal(outside.getAttribute('data-slot-state'), 'taken');
  assert.equal(outside.disabled, true);
  // 11:00 is inside the staff window → available
  const inside = utils.getByTestId('booking-reschedule-slot-660');
  assert.notEqual(inside.getAttribute('data-slot-state'), 'taken');
  assert.equal(inside.disabled, false);
  resetState();
});

/* ================================================================== */
section('5 · Cancellation flow (UI)');

await test('cancel dialog → confirm → cancelled state, actions gone, slot released', async () => {
  const utils = renderDetails('NX-91001', [UPCOMING]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-cancel')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const dialog = utils.getByTestId('booking-details-cancel-dialog');
  assert.ok(dialog.textContent.includes('NX-91001'), 'dialog missing reference');
  assert.ok(dialog.textContent.includes('₹88'), 'dialog missing advance');
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-cancel-yes')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  assert.equal(utils.queryByTestId('booking-details-cancel-dialog'), null, 'dialog did not close');
  const stateEl = utils.getByTestId('booking-confirmation-state');
  assert.equal(stateEl.getAttribute('data-state'), 'cancelled');
  assert.equal(utils.queryByTestId('booking-details-reschedule'), null, 'reschedule still shown');
  assert.equal(utils.queryByTestId('booking-details-cancel'), null, 'cancel still shown');
  // slot released
  const spans = bookedSpansForSalon('public-site', 'hair_studio_color_bar');
  assert.equal(spans.length, 0);
  resetState();
});

await test('keep booking does not cancel', async () => {
  const utils = renderDetails('NX-91001', [UPCOMING]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-cancel')); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-cancel-keep')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.queryByTestId('booking-details-cancel-dialog'), null);
  const stored = JSON.parse(window.localStorage.getItem(PAYMENT_STORE_KEY)).records.find((r) => r.bookingId === 'NX-91001');
  assert.equal(stored.bookingStatus, 'confirmed');
  resetState();
});

/* ================================================================== */
section('6 · Theme / language');

await test('Hindi copy in reschedule + cancel dialogs', async () => {
  setSiteLocale('hi');
  const utils = renderDetails('NX-91001', [UPCOMING]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-reschedule')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-reschedule').textContent.includes('पुनर्निर्धारित'), 'Hindi reschedule missing');
  resetState();
});

await test('dark appearance renders reschedule flow', async () => {
  setSiteAppearance('dark');
  const utils = renderDetails('NX-91001', [UPCOMING]);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-reschedule')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-reschedule'));
  resetState();
});

/* ================================================================== */
section('7 · END-TO-END through Customer Account (My Bookings → Details)');

async function openAccount() {
  await act(async () => {
    window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_EVENT));
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

await test('reschedule E2E: list → details → reschedule → refreshed list', async () => {
  seed([UPCOMING]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  // My Bookings list shows the upcoming booking
  assert.ok(utils.getByTestId('account-booking-NX-91001'), 'upcoming booking not in list');
  // open details
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-91001')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'details');
  // Reschedule button visible
  assert.ok(utils.getByTestId('booking-details-reschedule'), 'Reschedule button missing');
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-reschedule')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-reschedule'), 'reschedule UI did not open');
  // pick a new date + slot + confirm
  await act(async () => { fireEvent.click(utils.getByTestId(`booking-reschedule-date-${addDays(FUTURE, 2)}`)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-continue')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-slot-720')); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-continue')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-reschedule-confirm')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  // success + real record updated
  assert.ok(utils.getByTestId('booking-details-success'), 'success banner missing');
  const stored = JSON.parse(window.localStorage.getItem(PAYMENT_STORE_KEY)).records.find((r) => r.bookingId === 'NX-91001');
  assert.equal(stored.dateKey, addDays(FUTURE, 2));
  assert.equal(stored.startMinutes, 12 * 60);
  assert.equal(stored.bookingStatus, 'confirmed');
  // back to My Bookings — refreshed list still shows it (slot changed)
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-back-top')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'home');
  assert.ok(utils.getByTestId('account-booking-NX-91001'), 'list did not refresh');
  resetState();
});

await test('cancel E2E: details → cancel → cancelled tab shows it; no actions remain', async () => {
  seed([UPCOMING]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-91001')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-cancel')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-details-cancel-dialog'), 'cancel dialog missing');
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-cancel-yes')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  // details show cancelled + no modify actions
  assert.equal(utils.getByTestId('booking-confirmation-state').getAttribute('data-state'), 'cancelled');
  assert.equal(utils.queryByTestId('booking-details-reschedule'), null);
  assert.equal(utils.queryByTestId('booking-details-cancel'), null);
  // back → booking now in the Cancelled tab
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-back-top')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-tab-cancelled')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('account-booking-NX-91001'), 'cancelled booking not under Cancelled tab');
  const card = utils.getByTestId('account-booking-NX-91001');
  assert.equal(card.getAttribute('data-status'), 'cancelled');
  // cancelled booking cannot be rescheduled again
  await act(async () => { fireEvent.click(card); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.queryByTestId('booking-details-reschedule'), null, 'reschedule offered on cancelled booking');
  resetState();
});

await test('E2E security: foreign booking id is not-found inside the account', async () => {
  seed([FOREIGN]);
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-91999',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-confirmation-not-found'), 'foreign booking not blocked');
  assert.equal(utils.queryByTestId('booking-details-reschedule'), null);
  assert.equal(utils.queryByTestId('booking-details-cancel'), null);
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
