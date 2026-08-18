/**
 * PHASE 20.3 — BOOKING DETAILS & RECEIPT acceptance.
 *
 * Verifies the Customer Account → My Bookings → Booking Details flow:
 *   - clicking a booking opens the dedicated details view with REAL record data
 *   - payment breakdown shows real totals / required advance / paid / remaining
 *   - receipt toggle renders the clean receipt
 *   - back returns to the booking list
 *   - secure access: another customer's (or unknown) booking id → not-found
 *   - real statuses render (confirmed / completed / cancelled / pending / failed)
 *   - EN/HI + light/dark surfaces render
 *   - no fake data, no hardcoded amounts
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
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.matchMedia = () => ({
  matches: false, addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {},
});
dom.window.matchMedia = globalThis.matchMedia;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
dom.window.scrollTo = () => {};
globalThis.HTMLElement.prototype.scrollIntoView = dom.window.HTMLElement.prototype.scrollIntoView;
globalThis.localStorage = dom.window.localStorage;

const React = (await import('react')).default;
const { render, cleanup, act, fireEvent } = await import('@testing-library/react');

const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const SiteBookingDetails = (await import('../src/components/SiteBookingDetails.tsx')).default;
const { setPaymentStoreForTests, PAYMENT_STORE_VERSION, PAYMENT_STORE_KEY, PAYMENT_EVENT } = await import('../src/lib/siteBookingPayment.ts');
const { CUSTOMER_ACCOUNT_EVENT } = await import('../src/lib/siteCustomerAccount.ts');
const { readCustomerBooking } = await import('../src/lib/siteCustomerAccount.ts');
const { setSiteLocale } = await import('../src/lib/siteNavigation.ts');
const { setSiteAppearance } = await import('../src/lib/siteNavigation.ts');

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

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const MY_ID = 'b-customer-me';
const OTHER_ID = 'b-customer-other';

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
    ...partial, // explicit overrides (e.g. FOREIGN customerId)
  };
}

const UPCOMING = record({
  bookingId: 'NX-90001',
  serviceId: 's1',
  serviceName: 'Haircut & Blow-Dry',
  services: [{ serviceId: 's1', serviceName: 'Haircut & Blow-Dry', price: 350, durationMinutes: 30 }],
  dateKey: '2026-08-25',
  startMinutes: 10 * 60,
  endMinutes: 10 * 60 + 30,
  baseAmount: 350,
  amountDue: 88, // 25% advance of 350
  remainingAmount: 262,
  paymentOption: 'advance',
  paymentMethod: 'upi',
  paymentStatus: 'paid',
  bookingStatus: 'confirmed',
});

const COMPLETED = record({
  bookingId: 'NX-90002',
  serviceId: 's2',
  serviceName: 'Nourishing Hair Spa',
  services: [{ serviceId: 's2', serviceName: 'Nourishing Hair Spa', price: 900, durationMinutes: 45 }],
  dateKey: '2026-07-10',
  startMinutes: 15 * 60,
  endMinutes: 15 * 60 + 45,
  baseAmount: 900,
  amountDue: 225,
  remainingAmount: 0,
  paymentOption: 'advance',
  paymentMethod: 'card',
  paymentStatus: 'paid',
  bookingStatus: 'completed',
  customer: { name: 'Neha Verma', mobile: '9876543210' },
});

const CANCELLED = record({
  bookingId: 'NX-90003',
  serviceId: 's3',
  serviceName: 'Keratin Treatment',
  services: [{ serviceId: 's3', serviceName: 'Keratin Treatment', price: 3500, durationMinutes: 120 }],
  dateKey: '2026-08-01',
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

const PENDING = record({
  bookingId: 'NX-90004',
  serviceId: 's4',
  serviceName: 'HD Bridal Makeup',
  services: [{ serviceId: 's4', serviceName: 'HD Bridal Makeup', price: 4500, durationMinutes: 120 }],
  dateKey: '2026-08-28',
  startMinutes: 9 * 60,
  endMinutes: 11 * 60,
  baseAmount: 4500,
  amountDue: 1125,
  remainingAmount: 4500,
  paymentOption: 'advance',
  paymentMethod: 'card',
  paymentStatus: 'pending',
  bookingStatus: 'pending_payment',
});

const FAILED = record({
  bookingId: 'NX-90005',
  serviceId: 's5',
  serviceName: 'Ammonia-Free Hair Color',
  services: [{ serviceId: 's5', serviceName: 'Ammonia-Free Hair Color', price: 1500, durationMinutes: 90 }],
  dateKey: '2026-08-20',
  startMinutes: 12 * 60,
  endMinutes: 13 * 60 + 30,
  baseAmount: 1500,
  amountDue: 375,
  remainingAmount: 1500,
  paymentOption: 'advance',
  paymentMethod: 'card',
  paymentStatus: 'failed',
  bookingStatus: 'failed',
  failureReason: 'Payment declined by issuer',
});

const FOREIGN = record({
  ...{ bookingId: 'NX-99999', serviceId: 's9', serviceName: 'Foreign Booking', dateKey: '2026-09-01', startMinutes: 10 * 60, endMinutes: 11 * 60, baseAmount: 999, amountDue: 250, remainingAmount: 749, paymentStatus: 'paid', bookingStatus: 'confirmed', customer: { name: 'Someone Else', mobile: '1111111111' } },
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
    { id: 's4', name: 'HD Bridal Makeup', category: 'Beauty', description: '', price: 4500, duration: 120 },
    { id: 's5', name: 'Ammonia-Free Hair Color', category: 'Hair Coloring', description: '', price: 1500, duration: 90 },
  ],
  packages: [],
  team: [],
  gallery: [],
  socialVideos: [],
  websiteSlug: 'royal-hair-studio',
};

function seed(records) {
  // Records are read from localStorage (the existing store), exactly like the
  // 16.x test suites seed them.
  window.localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify({ version: PAYMENT_STORE_VERSION, records }));
  localStorage.setItem('nexora_site_booking_browser', MY_ID);
  localStorage.removeItem('nexora_owner_dashboard_section');
}

function resetState() {
  cleanup();
  setPaymentStoreForTests(null);
  localStorage.clear();
}

/** Open the account panel via its window event. */
async function openAccount() {
  await act(async () => {
    window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_EVENT));
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

/* ------------------------------------------------------------------ */
/* Data-layer security                                                 */
/* ------------------------------------------------------------------ */

section('1 · Secure booking read (data layer)');
await test('readCustomerBooking returns only THIS browser\'s booking', () => {
  seed([UPCOMING, FOREIGN]);
  assert.equal(readCustomerBooking('NX-90001').bookingId, 'NX-90001');
  assert.equal(readCustomerBooking('NX-99999'), null, 'foreign booking leaked');
  assert.equal(readCustomerBooking('NX-00000'), null, 'unknown booking leaked');
  resetState();
});

/* ------------------------------------------------------------------ */
/* Details view direct                                                 */
/* ------------------------------------------------------------------ */

section('2 · Booking Details view (direct mount)');
await test('confirmed booking renders real details + breakdown + receipt', async () => {
  seed([UPCOMING]);
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar',
    data: SALON,
    bookingId: 'NX-90001',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const root = utils.getByTestId('booking-details');
  assert.ok(root, 'details view missing');
  assert.equal(root.getAttribute('data-reference'), 'NX-90001');
  // salon name from the current salon data
  assert.ok(root.textContent.includes('Royal Hair & Beauty Studio'), 'salon name missing');
  // service name + category
  assert.ok(root.textContent.includes('Haircut & Blow-Dry'), 'service name missing');
  assert.ok(root.textContent.includes('Haircut'), 'service category missing');
  // payment breakdown with REAL amounts
  const breakdown = utils.getByTestId('booking-details-payment-breakdown');
  assert.ok(breakdown.textContent.includes('₹350'), 'total missing');
  assert.ok(breakdown.textContent.includes('₹88'), 'required advance missing');
  assert.ok(breakdown.textContent.includes('₹262'), 'remaining missing');
  // customer info
  assert.ok(root.textContent.includes('Neha Verma'), 'customer name missing');
  assert.ok(root.textContent.includes('9876543210'), 'customer mobile missing');
  resetState();
});

await test('receipt toggle shows the clean receipt card', async () => {
  seed([UPCOMING]);
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-90001',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.queryByTestId('booking-details-receipt'), null);
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-toggle-receipt')); });
  const receipt = utils.getByTestId('booking-details-receipt');
  assert.ok(receipt, 'receipt missing');
  assert.ok(receipt.textContent.includes('NX-90001'), 'receipt reference missing');
  assert.ok(receipt.textContent.includes('BOOKING RECEIPT'), 'receipt title missing');
  assert.ok(receipt.textContent.includes('₹350'), 'receipt total missing');
  resetState();
});

await test('not-found for a tampered / foreign booking id', async () => {
  seed([UPCOMING, FOREIGN]);
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-99999',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-confirmation-not-found'), 'foreign id not blocked');
  // nothing of the foreign booking is shown
  assert.equal(utils.queryByTestId('booking-details'), null);
  resetState();
});

await test('unknown booking id shows not-found', async () => {
  seed([UPCOMING]);
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-12345',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-confirmation-not-found'));
  resetState();
});

/* ------------------------------------------------------------------ */
/* Account panel flow                                                  */
/* ------------------------------------------------------------------ */

section('3 · Customer Account → My Bookings → Details flow');
await test('clicking a booking opens the details view; back returns', async () => {
  seed([UPCOMING, COMPLETED, CANCELLED]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'home');
  // upcoming tab has the confirmed booking
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-90001')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'details');
  assert.ok(utils.getByTestId('booking-details'), 'details view missing after click');
  // back to bookings
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-back-top')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'home');
  assert.ok(utils.getByTestId('account-booking-tab-upcoming'), 'list not restored');
  resetState();
});

await test('completed booking opens with completed state banner', async () => {
  seed([COMPLETED]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-tab-past')); });
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-90002')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const stateEl = utils.getByTestId('booking-confirmation-state');
  assert.equal(stateEl.getAttribute('data-state'), 'completed');
  assert.ok(stateEl.textContent.includes('Completed'));
  resetState();
});

await test('cancelled booking opens with cancelled state and reason', async () => {
  seed([CANCELLED]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-tab-cancelled')); });
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-90003')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const stateEl = utils.getByTestId('booking-confirmation-state');
  assert.equal(stateEl.getAttribute('data-state'), 'cancelled');
  assert.ok(utils.getByTestId('booking-confirmation-failure-reason'), 'failure reason missing');
  resetState();
});

await test('payment pending booking shows pending (not confirmed)', async () => {
  seed([PENDING]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-90004')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const stateEl = utils.getByTestId('booking-confirmation-state');
  assert.equal(stateEl.getAttribute('data-state'), 'payment_pending');
  assert.ok(utils.getByTestId('booking-confirmation-pending-warning'), 'pending warning missing');
  resetState();
});

await test('payment failed booking shows failed state', async () => {
  seed([FAILED]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-tab-cancelled')); });
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-90005')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const stateEl = utils.getByTestId('booking-confirmation-state');
  assert.equal(stateEl.getAttribute('data-state'), 'payment_failed');
  resetState();
});

await test('a foreign booking never appears in the list', async () => {
  seed([UPCOMING, FOREIGN]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  assert.equal(utils.queryByTestId('account-booking-NX-99999'), null, 'foreign booking visible');
  assert.ok(utils.getByTestId('account-booking-NX-90001'), 'own booking missing');
  resetState();
});

/* ------------------------------------------------------------------ */
/* Theme / language / appearance                                       */
/* ------------------------------------------------------------------ */

section('4 · EN/HI + light/dark');
await test('Hindi copy renders in details view', async () => {
  seed([UPCOMING]);
  setSiteLocale('hi');
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-90001',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-details').textContent.includes('बुकिंग विवरण'), 'Hindi heading missing');
  setSiteLocale('en');
  resetState();
});

await test('dark appearance renders without error', async () => {
  seed([UPCOMING]);
  setSiteAppearance('dark');
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'barber_mens_grooming', data: SALON, bookingId: 'NX-90001',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-details'));
  setSiteAppearance('light');
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

function section(title) {
  console.log(`\n■ ${title}`);
}
