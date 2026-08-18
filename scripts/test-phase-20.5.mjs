/**
 * PHASE 20.5 — CUSTOMER PROFILE MANAGEMENT acceptance.
 *
 * Verifies the Customer Account → My Profile flow:
 *   - real profile data (the ONLY existing customer fields: name/mobile/email)
 *     shown from the stored profile, falling back to the real booking snapshot
 *   - edit → validate (existing rules) → save → success → persisted across
 *     refresh (re-read from the store, not React state)
 *   - identity isolation: another browser's profile is unreachable
 *   - account header + home view reflect the edited profile
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
dom.window.scrollTo = () => {};
globalThis.localStorage = dom.window.localStorage;

const React = (await import('react')).default;
const { render, cleanup, act, fireEvent } = await import('@testing-library/react');

const SiteCustomerProfile = (await import('../src/components/SiteCustomerProfile.tsx')).default;
const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const {
  CUSTOMER_PROFILE_STORE_KEY,
  readCustomerProfile,
  saveCustomerProfile,
  validateCustomerProfile,
} = await import('../src/lib/siteCustomerProfile.ts');
const { readCustomerAccountInfo } = await import('../src/lib/siteCustomerAccount.ts');
const { CUSTOMER_ACCOUNT_EVENT } = await import('../src/lib/siteCustomerAccount.ts');
const { PAYMENT_STORE_KEY, PAYMENT_STORE_VERSION } = await import('../src/lib/siteBookingPayment.ts');
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
    dateKey: '2026-08-25',
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
    customer: { name: 'Neha Verma', mobile: '9876543210', email: 'neha@example.com' },
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    payAtSalon: false,
    ...partial,
  };
}

const BOOKING = record({ bookingId: 'NX-92001' });

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
  packages: [],
  team: [],
  gallery: [],
  socialVideos: [],
  websiteSlug: 'royal-hair-studio',
};

function seed(records) {
  window.localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify({ version: PAYMENT_STORE_VERSION, records }));
  localStorage.setItem('nexora_site_booking_browser', MY_ID);
  localStorage.removeItem(CUSTOMER_PROFILE_STORE_KEY);
}

function resetState() {
  cleanup();
  window.localStorage.removeItem(PAYMENT_STORE_KEY);
  localStorage.removeItem(CUSTOMER_PROFILE_STORE_KEY);
  localStorage.clear();
  setSiteLocale('en');
  setSiteAppearance('light');
}

function renderProfile() {
  return render(React.createElement(SiteCustomerProfile, {
    themeId: 'hair_studio_color_bar',
    data: SALON,
    onBack: () => {}, onClose: () => {},
  }));
}

/* ================================================================== */
section('1 · Data layer — real profile + validation + isolation');

await test('no stored profile → readCustomerProfile() is null; account info falls back to real booking snapshot', () => {
  seed([BOOKING]);
  assert.equal(readCustomerProfile(), null);
  const info = readCustomerAccountInfo();
  assert.equal(info.name, 'Neha Verma');
  assert.equal(info.mobile, '9876543210');
  assert.equal(info.email, 'neha@example.com');
  resetState();
});

await test('saveCustomerProfile trims, validates and persists (survives re-read)', () => {
  seed([BOOKING]);
  // invalid: short name, bad mobile, bad email
  const bad = saveCustomerProfile({ name: 'A', mobile: '123', email: 'not-an-email' });
  assert.equal(bad.ok, false);
  assert.equal(bad.errors.name, true);
  assert.equal(bad.errors.mobile, true);
  assert.equal(bad.errors.email, true);
  assert.equal(readCustomerProfile(), null, 'invalid save must not persist');
  // valid: trimmed on write
  const good = saveCustomerProfile({ name: '  Neha Sharma  ', mobile: '98765 43210', email: ' neha@example.com ' });
  assert.equal(good.ok, true);
  const stored = readCustomerProfile();
  assert.equal(stored.name, 'Neha Sharma');
  assert.equal(stored.mobile, '98765 43210');
  assert.equal(stored.email, 'neha@example.com');
  resetState();
});

await test('validation mirrors the existing booking rules (valid inputs pass)', () => {
  const errors = validateCustomerProfile({ name: 'Neha', mobile: '+91 9876543210', email: '' });
  assert.deepEqual(errors, {});
  resetState();
});

await test('account info prefers the stored profile over the booking snapshot', () => {
  seed([BOOKING]);
  saveCustomerProfile({ name: 'Neha Sharma', mobile: '9876543210', email: 'neha@example.com' });
  const info = readCustomerAccountInfo();
  assert.equal(info.name, 'Neha Sharma', 'stored profile must win');
  // booking snapshot untouched (history preserved)
  const record = JSON.parse(window.localStorage.getItem(PAYMENT_STORE_KEY)).records[0];
  assert.equal(record.customer.name, 'Neha Verma');
  resetState();
});

await test('another browser identity cannot read this profile', () => {
  seed([BOOKING]);
  saveCustomerProfile({ name: 'Neha Sharma', mobile: '9876543210', email: '' });
  // switch the browser identity — the profile belongs to the other id
  localStorage.setItem('nexora_site_booking_browser', OTHER_ID);
  assert.equal(readCustomerProfile(), null, 'profile leaked across identity');
  resetState();
});

/* ================================================================== */
section('2 · Profile UI — view + edit + success + refresh');

await test('view shows the real profile from the booking snapshot', async () => {
  seed([BOOKING]);
  const utils = renderProfile();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const root = utils.getByTestId('customer-profile');
  assert.ok(root.textContent.includes('Neha Verma'), 'name missing');
  assert.ok(root.textContent.includes('9876543210'), 'mobile missing');
  assert.ok(root.textContent.includes('neha@example.com'), 'email missing');
  assert.ok(utils.getByTestId('customer-profile-edit'), 'Edit button missing');
  resetState();
});

await test('edit → change name → save → success + new name shown + persisted on remount', async () => {
  seed([BOOKING]);
  const utils = renderProfile();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-edit')); });
  const nameInput = utils.getByTestId('customer-profile-input-name');
  await act(async () => {
    fireEvent.change(nameInput, { target: { value: 'Neha Sharma' } });
  });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-save')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  // success + view mode shows the new name
  assert.ok(utils.getByTestId('customer-profile-success'), 'success banner missing');
  assert.equal(utils.getByTestId('customer-profile').getAttribute('data-editing'), 'false');
  assert.ok(utils.getByTestId('customer-profile').textContent.includes('Neha Sharma'), 'new name not shown');
  // refresh simulation: unmount + remount reads from the STORE, not React state
  cleanup();
  const again = renderProfile();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(again.getByTestId('customer-profile').textContent.includes('Neha Sharma'), 'profile did not survive refresh');
  resetState();
});

await test('validation errors shown; save blocked; cancel keeps original', async () => {
  seed([BOOKING]);
  const utils = renderProfile();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-edit')); });
  // clear the name
  await act(async () => { fireEvent.change(utils.getByTestId('customer-profile-input-name'), { target: { value: '' } }); });
  await act(async () => { fireEvent.blur(utils.getByTestId('customer-profile-input-name')); });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-save')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-profile-error'), 'validation error banner missing');
  assert.equal(utils.getByTestId('customer-profile').getAttribute('data-editing'), 'true', 'must stay in edit mode');
  // nothing persisted
  assert.equal(readCustomerProfile(), null);
  // cancel restores view mode with the original value
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-cancel')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-profile').textContent.includes('Neha Verma'), 'original not restored');
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

await test('account → My Profile → edit → save → header reflects new name', async () => {
  seed([BOOKING]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('customer-account-profile')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'profile');
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-edit')); });
  await act(async () => { fireEvent.change(utils.getByTestId('customer-profile-input-name'), { target: { value: 'Neha Kaur' } }); });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-save')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  // back to home → header uses the updated profile
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-back')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'home');
  assert.ok(document.querySelector('[data-testid="customer-account"]').textContent.includes('Neha Kaur'), 'header not updated');
  // persisted in the store (survives remount)
  cleanup();
  const again = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  assert.ok(document.querySelector('[data-testid="customer-account"]').textContent.includes('Neha Kaur'), 'profile lost on remount');
  resetState();
});

await test('guest (no bookings) can still open and edit profile', async () => {
  seed([]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  assert.ok(utils.getByTestId('customer-account-profile'), 'profile button missing for guest');
  await act(async () => { fireEvent.click(utils.getByTestId('customer-account-profile')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-profile-edit'));
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-edit')); });
  await act(async () => {
    fireEvent.change(utils.getByTestId('customer-profile-input-name'), { target: { value: 'New Guest' } });
    fireEvent.change(utils.getByTestId('customer-profile-input-mobile'), { target: { value: '9999999999' } });
  });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-profile-save')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-profile-success'));
  resetState();
});

/* ================================================================== */
section('4 · Theme / language');

await test('Hindi copy renders in profile view', async () => {
  seed([BOOKING]);
  setSiteLocale('hi');
  const utils = renderProfile();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-profile').textContent.includes('मेरी प्रोफ़ाइल'), 'Hindi heading missing');
  resetState();
});

await test('dark appearance renders profile view', async () => {
  seed([BOOKING]);
  setSiteAppearance('dark');
  const utils = renderProfile();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-profile'));
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
