/**
 * PHASE 20.6 — FAVORITES / SAVED SALONS acceptance.
 *
 * Verifies:
 *   - the Favorite heart saves/unsaves the REAL salon (snapshot of the
 *     salon whose website is open — no fake records)
 *   - persistence in the app's existing browser-scoped store (survives
 *     re-read / refresh)
 *   - identity isolation: another browser's saved salons are unreachable
 *   - Saved Salons list inside Customer Account (name, theme, address,
 *     View, Remove, empty state)
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

const SiteFavoriteButton = (await import('../src/components/SiteFavoriteButton.tsx')).default;
const SiteFavorites = (await import('../src/components/SiteFavorites.tsx')).default;
const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const {
  FAVORITES_STORE_KEY,
  readFavoriteSalons,
  saveFavoriteSalon,
  removeFavoriteSalon,
  isSalonFavorite,
} = await import('../src/lib/siteFavorites.ts');
const { CUSTOMER_ACCOUNT_EVENT } = await import('../src/lib/siteCustomerAccount.ts');
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

const SALON = {
  salonName: 'Royal Hair & Beauty Studio',
  tagline: 'Premium care',
  ownerName: 'Rahul',
  about: 'Premium salon',
  phone: '+91 98765 43210',
  email: 'contact@royal.in',
  logoUrl: '',
  websiteSlug: 'royal-hair-studio',
  address: {
    fullAddress: 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
    area: 'Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400050',
  },
  services: [
    { id: 's1', name: 'Haircut & Blow-Dry', category: 'Haircut', description: '', price: 350, duration: 30 },
  ],
  packages: [],
  team: [],
  gallery: [],
  socialVideos: [],
};

function resetState() {
  cleanup();
  localStorage.removeItem(FAVORITES_STORE_KEY);
  localStorage.clear();
  setSiteLocale('en');
  setSiteAppearance('light');
}

function seedIdentity(id = MY_ID) {
  localStorage.setItem('nexora_site_booking_browser', id);
}

function renderHeart() {
  return render(React.createElement(SiteFavoriteButton, {
    themeId: 'hair_studio_color_bar',
    data: SALON,
    className: 'site-fab',
    style: {},
  }));
}

/* ================================================================== */
section('1 · Data layer — real salon snapshot, dedup, isolation');

await test('saveFavoriteSalon snapshots the REAL salon; dedup on repeat', () => {
  seedIdentity();
  const first = saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  assert.equal(first.ok, true);
  assert.equal(first.salon.salonName, 'Royal Hair & Beauty Studio');
  assert.equal(first.salon.businessId, 'public-site');
  assert.equal(first.salon.themeId, 'hair_studio_color_bar');
  assert.equal(first.salon.address, 'Linking Road, Bandra West, Mumbai');
  assert.equal(first.salon.websiteSlug, 'royal-hair-studio');
  // saving again never duplicates
  const again = saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'duplicate');
  assert.equal(readFavoriteSalons().length, 1);
  resetState();
});

await test('removeFavoriteSalon + isSalonFavorite reflect real state', () => {
  seedIdentity();
  assert.equal(isSalonFavorite('public-site', 'hair_studio_color_bar'), false);
  saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  assert.equal(isSalonFavorite('public-site', 'hair_studio_color_bar'), true);
  assert.equal(removeFavoriteSalon('public-site', 'hair_studio_color_bar'), true);
  assert.equal(isSalonFavorite('public-site', 'hair_studio_color_bar'), false);
  assert.equal(readFavoriteSalons().length, 0);
  assert.equal(removeFavoriteSalon('public-site', 'hair_studio_color_bar'), false, 'removing unsaved returns false');
  resetState();
});

await test('persistence survives re-read (store, not React state)', () => {
  seedIdentity();
  saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  const stored = JSON.parse(localStorage.getItem(FAVORITES_STORE_KEY));
  assert.equal(stored.browserId, MY_ID);
  assert.equal(readFavoriteSalons().length, 1);
  resetState();
});

await test('another browser identity cannot see this browser\'s favorites', () => {
  seedIdentity();
  saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  seedIdentity(OTHER_ID);
  assert.equal(readFavoriteSalons().length, 0, 'favorites leaked across identity');
  resetState();
});

/* ================================================================== */
section('2 · Favorite heart (salon website)');

await test('heart starts unsaved; click saves; click again removes', async () => {
  seedIdentity();
  const utils = renderHeart();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.getByTestId('site-favorite-button').getAttribute('data-saved'), 'false');
  await act(async () => { fireEvent.click(utils.getByTestId('site-favorite-button')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.getByTestId('site-favorite-button').getAttribute('data-saved'), 'true');
  assert.equal(readFavoriteSalons().length, 1);
  await act(async () => { fireEvent.click(utils.getByTestId('site-favorite-button')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.getByTestId('site-favorite-button').getAttribute('data-saved'), 'false');
  assert.equal(readFavoriteSalons().length, 0);
  resetState();
});

/* ================================================================== */
section('3 · Saved Salons list (Customer Account)');

await test('empty state tells the customer there are no saved salons', async () => {
  seedIdentity();
  const utils = render(React.createElement(SiteFavorites, {
    themeId: 'hair_studio_color_bar', data: SALON,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-favorites-empty'));
  assert.ok(utils.getByTestId('customer-favorites-empty').textContent.includes('No saved salons yet'));
  resetState();
});

await test('saved salon shows real name/theme/address; remove empties the list', async () => {
  seedIdentity();
  saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  const utils = render(React.createElement(SiteFavorites, {
    themeId: 'hair_studio_color_bar', data: SALON,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const row = utils.getByTestId('customer-favorite-public-site-hair_studio_color_bar');
  assert.ok(row.textContent.includes('Royal Hair & Beauty Studio'), 'salon name missing');
  assert.ok(row.textContent.includes('Linking Road, Bandra West, Mumbai'), 'address missing');
  // theme label present (hair studio)
  assert.ok(utils.getByTestId('customer-favorites').textContent.includes('Hair Studio'), 'theme label missing');
  await act(async () => { fireEvent.click(utils.getByTestId('customer-favorite-remove-public-site-hair_studio_color_bar')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-favorites-empty'), 'list did not empty after remove');
  assert.equal(readFavoriteSalons().length, 0);
  resetState();
});

/* ================================================================== */
section('4 · E2E through Customer Account');

async function openAccount() {
  await act(async () => {
    window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_EVENT));
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

await test('account → Saved Salons → saved salon appears → remove → empty', async () => {
  seedIdentity();
  saveFavoriteSalon(SALON, 'hair_studio_color_bar');
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('customer-account-favorites')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'favorites');
  assert.ok(utils.getByTestId('customer-favorite-public-site-hair_studio_color_bar'), 'saved salon not shown');
  await act(async () => { fireEvent.click(utils.getByTestId('customer-favorite-remove-public-site-hair_studio_color_bar')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-favorites-empty'), 'empty state not shown after remove');
  resetState();
});

await test('heart on the site + account list are the same store (E2E)', async () => {
  seedIdentity();
  const heartUtils = renderHeart();
  await act(async () => { fireEvent.click(heartUtils.getByTestId('site-favorite-button')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  cleanup();
  const accountUtils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(accountUtils.getByTestId('customer-account-favorites')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(accountUtils.getByTestId('customer-favorite-public-site-hair_studio_color_bar'), 'heart save not visible in account');
  resetState();
});

/* ================================================================== */
section('5 · Theme / language');

await test('Hindi copy renders in favorites view', async () => {
  seedIdentity();
  setSiteLocale('hi');
  const utils = render(React.createElement(SiteFavorites, {
    themeId: 'hair_studio_color_bar', data: SALON,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-favorites').textContent.includes('सेव किए गए सैलून'), 'Hindi heading missing');
  resetState();
});

await test('dark appearance renders favorites view', async () => {
  seedIdentity();
  setSiteAppearance('dark');
  const utils = render(React.createElement(SiteFavorites, {
    themeId: 'barber_mens_grooming', data: SALON,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-favorites'));
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
