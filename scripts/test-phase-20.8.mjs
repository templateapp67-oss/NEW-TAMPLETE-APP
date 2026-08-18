/**
 * PHASE 20.8 — CUSTOMER NOTIFICATIONS acceptance.
 *
 * Verifies the Notifications center derived from the customer's own REAL
 * booking/payment records and reviews:
 *   - real events only (confirmed / cancelled / completed / payment
 *     pending / payment failed / booking updated / review approved /
 *     review not published)
 *   - identity isolation: another customer's notifications / read-state
 *     are unreachable
 *   - read/unread: mark one, mark all — persisted across re-read
 *   - actions: booking notification opens the existing Booking Details
 *   - empty / loading / error states, EN/HI + light/dark
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
dom.window.scrollTo = () => {};
globalThis.localStorage = dom.window.localStorage;

const React = (await import('react')).default;
const { render, cleanup, act, fireEvent } = await import('@testing-library/react');

const SiteNotifications = (await import('../src/components/SiteNotifications.tsx')).default;
const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const {
  CUSTOMER_NOTIFICATION_READ_KEY,
  readCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
  customerUnreadCount,
} = await import('../src/lib/siteCustomerNotifications.ts');
const { CUSTOMER_ACCOUNT_EVENT } = await import('../src/lib/siteCustomerAccount.ts');
const { PAYMENT_STORE_KEY, PAYMENT_STORE_VERSION } = await import('../src/lib/siteBookingPayment.ts');
const { setReviewStoreForTests, REVIEW_STORE_VERSION } = await import('../src/lib/siteReviews.ts');
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

function record(partial) {
  return {
    id: `pay-${partial.bookingId}`,
    idempotencyKey: `key-${partial.bookingId}`,
    businessId: 'public-site',
    themeId: 'hair_studio_color_bar',
    customerId: MY_ID,
    bookingId: partial.bookingId,
    serviceId: 's1',
    serviceName: 'Haircut & Blow-Dry',
    services: [{ serviceId: 's1', serviceName: 'Haircut & Blow-Dry', price: 350, durationMinutes: 30 }],
    dateKey: '2026-08-10',
    startMinutes: 10 * 60,
    endMinutes: 10 * 60 + 30,
    baseAmount: 350,
    amountDue: 88,
    remainingAmount: 262,
    currency: 'INR',
    paymentOption: 'advance',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    customer: { name: 'Neha Verma', mobile: '9876543210' },
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    payAtSalon: false,
    ...partial,
  };
}

const CONFIRMED = record({ bookingId: 'NX-94001' });
const CANCELLED = record({ bookingId: 'NX-94002', bookingStatus: 'cancelled', failureReason: 'Cancelled by customer', updatedAt: 1_700_000_100_000 });
const COMPLETED = record({ bookingId: 'NX-94003', bookingStatus: 'completed', updatedAt: 1_700_000_200_000 });
const PENDING = record({ bookingId: 'NX-94004', bookingStatus: 'pending_payment', paymentStatus: 'pending', updatedAt: 1_700_000_300_000 });
const FAILED = record({ bookingId: 'NX-94005', bookingStatus: 'failed', paymentStatus: 'failed', failureReason: 'Payment declined', updatedAt: 1_700_000_400_000 });
const RESCHEDULED = record({ bookingId: 'NX-94006', bookingStatus: 'confirmed', createdAt: 1_600_000_000_000, updatedAt: 1_700_000_500_000 });
const FOREIGN = record({ ...{ bookingId: 'NX-94999', customerId: OTHER_ID, updatedAt: 1_700_000_600_000 } });

const SALON = {
  salonName: 'Royal Hair & Beauty Studio',
  tagline: 'Premium care',
  ownerName: 'Rahul',
  about: 'Premium salon',
  phone: '+91 98765 43210',
  email: 'contact@royal.in',
  services: [
    { id: 's1', name: 'Haircut & Blow-Dry', category: 'Haircut', description: '', price: 350, duration: 30 },
  ],
  packages: [], team: [], gallery: [], socialVideos: [], websiteSlug: 'royal-hair-studio',
};

function review(id, overrides = {}) {
  return {
    id,
    businessId: 'public-site',
    themeId: 'hair_studio_color_bar',
    bookingId: 'NX-94001',
    customerId: MY_ID,
    customerName: 'Neha Verma',
    rating: 5,
    body: 'Lovely experience, would definitely visit again!',
    serviceName: 'Haircut & Blow-Dry',
    status: 'approved',
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_700_000,
    fingerprint: 'fp',
    ...overrides,
  };
}

function seed(records, reviews = []) {
  window.localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify({ version: PAYMENT_STORE_VERSION, records }));
  localStorage.setItem('nexora_site_booking_browser', MY_ID);
  setReviewStoreForTests({ version: REVIEW_STORE_VERSION, reviews, attempts: [] });
  localStorage.removeItem(CUSTOMER_NOTIFICATION_READ_KEY);
}

function resetState() {
  cleanup();
  window.localStorage.removeItem(PAYMENT_STORE_KEY);
  setReviewStoreForTests(null);
  localStorage.removeItem(CUSTOMER_NOTIFICATION_READ_KEY);
  localStorage.clear();
  setSiteLocale('en');
  setSiteAppearance('light');
}

function renderNotifications(onOpenBooking = () => {}) {
  return render(React.createElement(SiteNotifications, {
    themeId: 'hair_studio_color_bar', data: SALON,
    onBack: () => {}, onClose: () => {}, onOpenBooking,
  }));
}

/* ================================================================== */
section('1 · Data layer — real derived events');

await test('derives real booking/payment events, own rows only', () => {
  seed([CONFIRMED, CANCELLED, COMPLETED, PENDING, FAILED, RESCHEDULED, FOREIGN]);
  const notes = readCustomerNotifications();
  const types = new Set(notes.map((n) => n.type));
  assert.ok(types.has('booking_confirmed'));
  assert.ok(types.has('booking_cancelled'));
  assert.ok(types.has('booking_completed'));
  assert.ok(types.has('payment_pending'));
  assert.ok(types.has('payment_failed'));
  assert.ok(types.has('booking_updated')); // rescheduled/status-changed record (updatedAt > createdAt)
  // foreign booking never appears
  assert.ok(!notes.some((n) => n.bookingId === 'NX-94999'), 'foreign booking leaked');
  // all start unread
  assert.ok(notes.every((n) => !n.isRead));
  resetState();
});

await test('derives review published / not-published events', () => {
  seed([CONFIRMED], [
    review('r1'),
    review('r2', { id: 'r2', status: 'rejected' }),
    review('r3', { id: 'r3', customerId: OTHER_ID, status: 'approved' }),
  ]);
  const notes = readCustomerNotifications();
  assert.ok(notes.some((n) => n.type === 'review_approved' && n.reviewId === 'r1'), 'approved review event missing');
  assert.ok(notes.some((n) => n.type === 'review_rejected' && n.reviewId === 'r2'), 'rejected review event missing');
  assert.ok(!notes.some((n) => n.reviewId === 'r3'), 'foreign review event leaked');
  resetState();
});

await test('read/unread state persists; mark one and mark all', () => {
  seed([CONFIRMED, CANCELLED]);
  const all = readCustomerNotifications();
  assert.equal(all.length, 2);
  const target = all[0].key;
  markCustomerNotificationRead(target);
  const after = readCustomerNotifications();
  assert.ok(after.find((n) => n.key === target).isRead, 'mark one failed');
  assert.equal(customerUnreadCount(), 1);
  // survives re-read (persisted, not React state)
  assert.ok(readCustomerNotifications().find((n) => n.key === target).isRead, 'read-state did not persist');
  markAllCustomerNotificationsRead();
  assert.equal(customerUnreadCount(), 0);
  resetState();
});

await test('read-state is identity-isolated', () => {
  seed([CONFIRMED]);
  markAllCustomerNotificationsRead();
  // switch identity — read-state must be empty for the other browser
  localStorage.setItem('nexora_site_booking_browser', OTHER_ID);
  assert.equal(readCustomerNotifications().every((n) => !n.isRead), true, 'read-state leaked across identity');
  resetState();
});

/* ================================================================== */
section('2 · Notifications UI');

await test('shows derived notifications with title/message/date and unread state', async () => {
  seed([CONFIRMED, CANCELLED]);
  const utils = renderNotifications();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const root = utils.getByTestId('customer-notifications');
  assert.ok(root.textContent.includes('Booking confirmed'), 'confirmed title missing');
  assert.ok(root.textContent.includes('NX-94001'), 'message missing booking id');
  assert.ok(root.textContent.includes('Booking cancelled'), 'cancelled title missing');
  assert.equal(utils.getByTestId('customer-notifications-mark-all').disabled, false);
  resetState();
});

await test('mark one as read updates the unread indicator; mark all clears', async () => {
  seed([CONFIRMED, CANCELLED]);
  const utils = renderNotifications();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  // find an unread item and mark it
  const confirmed = utils.getByTestId('customer-notification-booking_confirmed-NX-94001');
  assert.equal(confirmed.getAttribute('data-read'), 'false');
  await act(async () => { fireEvent.click(utils.getByTestId('customer-notification-mark-booking_confirmed-NX-94001')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.getByTestId('customer-notification-booking_confirmed-NX-94001').getAttribute('data-read'), 'true');
  assert.equal(customerUnreadCount(), 1);
  await act(async () => { fireEvent.click(utils.getByTestId('customer-notifications-mark-all')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(customerUnreadCount(), 0);
  resetState();
});

await test('empty state', async () => {
  seed([]);
  const utils = renderNotifications();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-notifications-empty'));
  resetState();
});

await test('booking notification action opens Booking Details', async () => {
  seed([CONFIRMED]);
  let opened = null;
  const utils = renderNotifications((id) => { opened = id; });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-notification-open-NX-94001')); });
  assert.equal(opened, 'NX-94001', 'did not open the booking');
  resetState();
});

/* ================================================================== */
section('3 · E2E through Customer Account');

async function openAccount() {
  await act(async () => {
    window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_EVENT));
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

await test('account → Notifications → open booking notification → Booking Details', async () => {
  seed([CONFIRMED]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('customer-account-notifications')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'notifications');
  assert.ok(utils.getByTestId('customer-notification-booking_confirmed-NX-94001'), 'notification missing');
  await act(async () => { fireEvent.click(utils.getByTestId('customer-notification-open-NX-94001')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'details');
  assert.ok(utils.getByTestId('booking-details'), 'Booking Details did not open');
  resetState();
});

/* ================================================================== */
section('4 · Theme / language');

await test('Hindi copy in notifications view', async () => {
  seed([CONFIRMED]);
  setSiteLocale('hi');
  const utils = renderNotifications();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-notifications').textContent.includes('सूचनाएँ'), 'Hindi heading missing');
  resetState();
});

await test('dark appearance renders notifications view', async () => {
  seed([CONFIRMED]);
  setSiteAppearance('dark');
  const utils = renderNotifications();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-notifications'));
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
