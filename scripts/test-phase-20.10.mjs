/**
 * PHASE 20.10 — CUSTOMER ACCOUNT FINAL QA & POLISH · acceptance walkthrough.
 *
 * Walks EVERY Customer Account section in the running-app architecture
 * (jsdom against the real stores) and verifies:
 *   - every home-view navigation item opens its screen (no dead buttons)
 *   - Back returns to the account home; refresh (remount) resets to home
 *   - booking flow: list → details → receipt → reschedule → cancel
 *   - Profile / Favorites / Reviews / Notifications / Help sections
 *   - EN/HI + light/dark rendering
 *   - no placeholder navigation / fake success actions
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

const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const { CUSTOMER_ACCOUNT_EVENT, CUSTOMER_ACCOUNT_CLOSE_EVENT } = await import('../src/lib/siteCustomerAccount.ts');
const { PAYMENT_STORE_KEY, PAYMENT_STORE_VERSION } = await import('../src/lib/siteBookingPayment.ts');
const { setReviewStoreForTests, REVIEW_STORE_VERSION } = await import('../src/lib/siteReviews.ts');
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
setSalonClockForTests(new Date(2026, 7, 17, 10, 0, 0));
const TODAY = localDateKey(salonNow());
const PAST = (() => { const d = new Date(`${TODAY}T12:00:00`); d.setDate(d.getDate() - 5); return localDateKey(d); })();
const FUTURE = (() => { const d = new Date(`${TODAY}T12:00:00`); d.setDate(d.getDate() + 3); return localDateKey(d); })();

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
    dateKey: partial.dateKey,
    startMinutes: 10 * 60,
    endMinutes: 10 * 60 + 30,
    baseAmount: 350,
    amountDue: 88,
    remainingAmount: 262,
    currency: 'INR',
    paymentOption: 'advance',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    bookingStatus: partial.bookingStatus,
    customer: { name: 'Neha Verma', mobile: '9876543210', email: 'neha@example.com' },
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    payAtSalon: false,
    ...partial,
  };
}

const UPCOMING = record({ bookingId: 'NX-95001', dateKey: FUTURE, bookingStatus: 'confirmed' });
const ELIGIBLE = record({ bookingId: 'NX-95002', dateKey: PAST, bookingStatus: 'confirmed', updatedAt: 1_700_000_100_000 });
const DONE = record({ bookingId: 'NX-95003', dateKey: PAST, bookingStatus: 'completed', updatedAt: 1_700_000_200_000 });

const SALON = {
  salonName: 'Royal Hair & Beauty Studio',
  tagline: 'Premium care',
  ownerName: 'Rahul',
  about: 'Premium salon',
  phone: '+91 98765 43210',
  whatsappPhone: '+91 98765 43210',
  email: 'contact@royal.in',
  contactOptions: { callNow: true, whatsapp: true, bookNow: true },
  websiteSlug: 'royal-hair-studio',
  address: { fullAddress: 'Shop 14, Linking Road', area: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pinCode: '400050' },
  services: [
    { id: 's1', name: 'Haircut & Blow-Dry', category: 'Haircut', description: '', price: 350, duration: 30 },
  ],
  packages: [], team: [], gallery: [], socialVideos: [],
};

function seed(records, reviews = []) {
  window.localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify({ version: PAYMENT_STORE_VERSION, records }));
  localStorage.setItem('nexora_site_booking_browser', MY_ID);
  setReviewStoreForTests({ version: REVIEW_STORE_VERSION, reviews, attempts: [] });
}

function resetState() {
  cleanup();
  window.localStorage.removeItem(PAYMENT_STORE_KEY);
  setReviewStoreForTests(null);
  localStorage.clear();
  setSiteLocale('en');
  setSiteAppearance('light');
  setSalonClockForTests(new Date(2026, 7, 17, 10, 0, 0));
}

async function openAccount() {
  await act(async () => {
    window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_EVENT));
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}
function view() {
  return document.querySelector('[data-testid="customer-account"]').getAttribute('data-view');
}
async function click(testid) {
  const el = document.querySelector(`[data-testid="${testid}"]`);
  assert.ok(el, `missing button ${testid}`);
  await act(async () => { fireEvent.click(el); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

/* ================================================================== */
section('1 · Navigation — every section opens + Back works');

await test('home shows all navigation buttons (no dead buttons)', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  assert.equal(view(), 'home');
  for (const id of [
    'customer-account-profile',
    'customer-account-favorites',
    'customer-account-reviews',
    'customer-account-notifications',
    'customer-account-help',
    'customer-account-book',
    'account-booking-tab-upcoming',
    'account-booking-tab-past',
    'account-booking-tab-cancelled',
  ]) {
    assert.ok(document.querySelector(`[data-testid="${id}"]`), `home button missing: ${id}`);
  }
  resetState();
});

await test('Profile → Back → home', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-profile');
  assert.equal(view(), 'profile');
  assert.ok(document.querySelector('[data-testid="customer-profile"]'), 'profile screen missing');
  await click('customer-profile-back');
  assert.equal(view(), 'home');
  resetState();
});

await test('Favorites → Back → home', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-favorites');
  assert.equal(view(), 'favorites');
  assert.ok(document.querySelector('[data-testid="customer-favorites"]'), 'favorites screen missing');
  await click('customer-favorites-back');
  assert.equal(view(), 'home');
  resetState();
});

await test('My Reviews → Back → home', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-reviews');
  assert.equal(view(), 'reviews');
  assert.ok(document.querySelector('[data-testid="customer-reviews"]'), 'reviews screen missing');
  await click('customer-reviews-back');
  assert.equal(view(), 'home');
  resetState();
});

await test('Notifications → Back → home', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-notifications');
  assert.equal(view(), 'notifications');
  assert.ok(document.querySelector('[data-testid="customer-notifications"]'), 'notifications screen missing');
  await click('customer-notifications-back');
  assert.equal(view(), 'home');
  resetState();
});

await test('Help & Support → Back → home', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-help');
  assert.equal(view(), 'help');
  assert.ok(document.querySelector('[data-testid="customer-help"]'), 'help screen missing');
  await click('customer-help-back');
  assert.equal(view(), 'home');
  resetState();
});

await test('booking list → details → back → home; tabs switch groups', async () => {
  seed([UPCOMING, DONE]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('account-booking-NX-95001');
  assert.equal(view(), 'details');
  assert.ok(document.querySelector('[data-testid="booking-details"]'), 'details screen missing');
  await click('booking-details-back-top');
  assert.equal(view(), 'home');
  // Past tab shows the completed-status booking (status-based grouping)
  await click('account-booking-tab-past');
  assert.ok(document.querySelector('[data-testid="account-booking-NX-95003"]'), 'past tab empty');
  resetState();
});

await test('refresh (remount) resets to home — no wrong-section persistence', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-profile');
  assert.equal(view(), 'profile');
  // remount = refresh
  cleanup();
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  assert.equal(view(), 'home', 'refresh should start at the account home');
  resetState();
});

/* ================================================================== */
section('2 · Booking flow — details, receipt, reschedule, cancel');

await test('details → receipt toggle → reschedule flow → cancel', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('account-booking-NX-95001');
  // receipt
  await click('booking-details-toggle-receipt');
  assert.ok(document.querySelector('[data-testid="booking-details-receipt"]'), 'receipt missing');
  await click('booking-details-toggle-receipt');
  // reschedule opens, back returns
  await click('booking-details-reschedule');
  assert.equal(view(), 'details'); // reschedule is a mode INSIDE the details view
  assert.ok(document.querySelector('[data-testid="booking-reschedule"]'), 'reschedule UI missing');
  await click('booking-reschedule-back');
  // cancel dialog opens, keep closes
  await click('booking-details-cancel');
  assert.ok(document.querySelector('[data-testid="booking-details-cancel-dialog"]'), 'cancel dialog missing');
  await click('booking-details-cancel-keep');
  assert.equal(document.querySelector('[data-testid="booking-details-cancel-dialog"]'), null);
  resetState();
});

await test('real cancel → status cancelled → booking moves to Cancelled tab', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('account-booking-NX-95001');
  await click('booking-details-cancel');
  await click('booking-details-cancel-yes');
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  assert.equal(document.querySelector('[data-testid="booking-confirmation-state"]').getAttribute('data-state'), 'cancelled');
  assert.equal(document.querySelector('[data-testid="booking-details-reschedule"]'), null, 'reschedule offered after cancel');
  await click('booking-details-back-top');
  await click('account-booking-tab-cancelled');
  assert.ok(document.querySelector('[data-testid="account-booking-NX-95001"]'), 'cancelled booking not under Cancelled tab');
  resetState();
});

/* ================================================================== */
section('3 · Review action from a completed (eligible) booking');

await test('eligible booking shows Write a Review; submit works end-to-end', async () => {
  seed([ELIGIBLE]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('account-booking-NX-95002'); // eligible booking (past confirmed)
  assert.ok(document.querySelector('[data-testid="booking-details-review"]'), 'review button missing');
  await click('booking-details-review');
  assert.ok(document.querySelector('[data-testid="review-form"]'), 'review form missing');
  await click('review-star-5');
  await act(async () => {
    fireEvent.change(document.querySelector('[data-testid="review-form-body"]'), { target: { value: 'Lovely experience, would definitely visit again!' } });
  });
  await click('review-form-submit');
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  assert.ok(document.querySelector('[data-testid="booking-details-success"]'), 'review success not shown');
  resetState();
});

/* ================================================================== */
section('4 · Profile edit → persists; Favorites remove; Notifications mark-read');

await test('profile edit + save + header reflects it', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-profile');
  await click('customer-profile-edit');
  await act(async () => {
    fireEvent.change(document.querySelector('[data-testid="customer-profile-input-name"]'), { target: { value: 'Neha Kaur' } });
  });
  await click('customer-profile-save');
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(document.querySelector('[data-testid="customer-profile-success"]'), 'profile success missing');
  await click('customer-profile-back');
  assert.ok(document.querySelector('[data-testid="customer-account"]').textContent.includes('Neha Kaur'), 'header not updated');
  resetState();
});

await test('favorites heart → Saved Salons list shows it → remove → empty', async () => {
  seed([UPCOMING]);
  // save via the store directly (heart is on the salon website; verified in 20.6)
  const { saveFavoriteSalon } = await import('../src/lib/siteFavorites.ts');
  saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-favorites');
  assert.ok(document.querySelector('[data-testid="customer-favorite-public-site-hair_studio_color_bar"]'), 'favorite missing');
  await click('customer-favorite-remove-public-site-hair_studio_color_bar');
  assert.ok(document.querySelector('[data-testid="customer-favorites-empty"]'), 'empty state missing after remove');
  resetState();
});

await test('notifications derived + mark all as read works', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await click('customer-account-notifications');
  assert.ok(document.querySelector('[data-testid="customer-notification-booking_confirmed-NX-95001"]'), 'notification missing');
  await click('customer-notifications-mark-all');
  assert.equal(document.querySelector('[data-testid="customer-notification-booking_confirmed-NX-95001"]').getAttribute('data-read'), 'true');
  resetState();
});

/* ================================================================== */
section('5 · Theme / language / dark');

await test('Hindi labels across sections (no mixed text)', async () => {
  seed([UPCOMING]);
  setSiteLocale('hi');
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  const homeText = document.querySelector('[data-testid="customer-account"]').textContent;
  for (const label of ['मेरी प्रोफ़ाइल', 'सेव किए गए सैलून', 'मेरी समीक्षाएँ', 'सूचनाएँ', 'सहायता']) {
    assert.ok(homeText.includes(label), `Hindi label missing: ${label}`);
  }
  await click('customer-account-help');
  assert.ok(document.querySelector('[data-testid="customer-help"]').textContent.includes('सहायता'));
  resetState();
});

await test('dark mode renders every section without errors', async () => {
  seed([UPCOMING, ELIGIBLE]);
  setSiteAppearance('dark');
  render(React.createElement(SiteCustomerAccount, { themeId: 'barber_mens_grooming', data: SALON }));
  await openAccount();
  for (const btn of ['customer-account-profile', 'customer-account-favorites', 'customer-account-reviews', 'customer-account-notifications', 'customer-account-help']) {
    await click(btn);
    assert.ok(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view') !== 'home');
    // back via the section's own back button
    const backBtn = document.querySelector('[data-testid$="-back"]');
    assert.ok(backBtn, `back button missing for view ${view()}`);
    await act(async () => { fireEvent.click(backBtn); });
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    assert.equal(view(), 'home');
  }
  resetState();
});

/* ================================================================== */
section('6 · Accessibility + close controls');

await test('close button closes the panel; Escape closes', async () => {
  seed([UPCOMING]);
  render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => {
    fireEvent.keyDown(window, { key: 'Escape' });
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]'), null, 'Escape did not close');
  await openAccount();
  await click('customer-account-close');
  assert.equal(document.querySelector('[data-testid="customer-account"]'), null, 'close button did not close');
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
