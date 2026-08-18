/**
 * PHASE 20.9 — HELP & SUPPORT acceptance.
 *
 * Verifies the Help Center inside Customer Account:
 *   - FAQ categories + expandable/collapsible questions
 *   - answers describe only real functionality (no invented refund rules)
 *   - contact options derived from the salon's REAL published data only
 *   - honest no-support-ticket note (no fake submission)
 *   - E2E through the account; EN/HI + light/dark
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

const SiteHelpCenter = (await import('../src/components/SiteHelpCenter.tsx')).default;
const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const { helpContactOptions, HELP_FAQS, HELP_CATEGORIES } = await import('../src/lib/siteHelpCenter.ts');
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

const SALON = {
  salonName: 'Royal Hair & Beauty Studio',
  tagline: 'Premium care',
  ownerName: 'Rahul',
  about: 'Premium salon',
  phone: '+91 98765 43210',
  whatsappPhone: '+91 98765 43210',
  email: 'contact@royal.in',
  contactOptions: { callNow: true, whatsapp: true, bookNow: true },
  services: [
    { id: 's1', name: 'Haircut & Blow-Dry', category: 'Haircut', description: '', price: 350, duration: 30 },
  ],
  packages: [], team: [], gallery: [], socialVideos: [], websiteSlug: 'royal-hair-studio',
};

const NO_CONTACTS_SALON = { ...SALON, phone: '', whatsappPhone: '', email: '', contactOptions: { callNow: false, whatsapp: false, bookNow: true } };

function resetState() {
  cleanup();
  localStorage.clear();
  setSiteLocale('en');
  setSiteAppearance('light');
}

function renderHelp(data = SALON) {
  return render(React.createElement(SiteHelpCenter, {
    themeId: 'hair_studio_color_bar', data,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
}

/* ================================================================== */
section('1 · Data layer — real contacts, honest FAQ');

await test('contact options derive from REAL salon data only', () => {
  const c = helpContactOptions(SALON);
  assert.equal(c.call.href, 'tel:+91 98765 43210');
  assert.equal(c.whatsapp.href, 'https://wa.me/919876543210');
  assert.equal(c.email.href, 'mailto:contact@royal.in');
  // nothing invented when the salon publishes nothing
  const none = helpContactOptions(NO_CONTACTS_SALON);
  assert.equal(none.call, undefined);
  assert.equal(none.whatsapp, undefined);
  assert.equal(none.email, undefined);
  // invalid email → no email action
  const badEmail = helpContactOptions({ ...SALON, email: 'not-an-email' });
  assert.equal(badEmail.email, undefined);
});

await test('FAQ covers all six categories; answers describe real functionality', () => {
  assert.equal(HELP_CATEGORIES.length, 6);
  for (const cat of HELP_CATEGORIES) {
    assert.ok(HELP_FAQS.some((f) => f.category === cat.id), `category ${cat.id} has no FAQ`);
  }
  // refund answer is honest (no invented refund)
  const refund = HELP_FAQS.find((f) => f.id === 'payment-refund');
  assert.ok(refund.answerEn.includes('no refund is processed automatically'));
});

/* ================================================================== */
section('2 · Help Center UI');

await test('FAQ items render and expand/collapse', async () => {
  const utils = renderHelp();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-help'));
  const q = utils.getByTestId('help-faq-booking-how');
  assert.equal(q.getAttribute('data-open'), 'false');
  await act(async () => { fireEvent.click(utils.getByTestId('help-faq-toggle-booking-how')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.getByTestId('help-faq-booking-how').getAttribute('data-open'), 'true');
  assert.ok(utils.getByTestId('help-faq-answer-booking-how').textContent.includes('Book Appointment'));
  // collapse
  await act(async () => { fireEvent.click(utils.getByTestId('help-faq-toggle-booking-how')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.getByTestId('help-faq-booking-how').getAttribute('data-open'), 'false');
  resetState();
});

await test('category filter narrows the FAQ list', async () => {
  const utils = renderHelp();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('help-category-payment')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('help-faq-payment-options'), 'payment FAQ missing');
  assert.equal(utils.queryByTestId('help-faq-booking-how'), null, 'booking FAQ still visible');
  resetState();
});

await test('contact options render real destinations when configured', async () => {
  const utils = renderHelp();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const call = utils.getByTestId('help-contact-call');
  assert.ok(call.getAttribute('href').startsWith('tel:'), 'call href missing');
  const wa = utils.getByTestId('help-contact-whatsapp');
  assert.ok(wa.getAttribute('href').startsWith('https://wa.me/'), 'whatsapp href missing');
  const mail = utils.getByTestId('help-contact-email');
  assert.ok(mail.getAttribute('href').startsWith('mailto:'), 'email href missing');
  resetState();
});

await test('no published contacts → honest note, no invented actions', async () => {
  const utils = renderHelp(NO_CONTACTS_SALON);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils.queryByTestId('help-contact-call'), null);
  assert.equal(utils.queryByTestId('help-contact-whatsapp'), null);
  assert.equal(utils.queryByTestId('help-contact-email'), null);
  assert.ok(utils.getByTestId('customer-help').textContent.includes('has not published contact details'));
  resetState();
});

await test('honest no-support-ticket note is present', async () => {
  const utils = renderHelp();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('help-support-note').textContent.includes('does not have a support-ticket system'));
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

await test('account → Help & Support → expand FAQ → contact action present', async () => {
  localStorage.setItem('nexora_site_booking_browser', 'b-customer-me');
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  await act(async () => { fireEvent.click(utils.getByTestId('customer-account-help')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'help');
  await act(async () => { fireEvent.click(utils.getByTestId('help-faq-toggle-reschedule-how')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('help-faq-answer-reschedule-how').textContent.includes('Reschedule'));
  assert.ok(utils.getByTestId('help-contact-call'), 'contact action missing');
  resetState();
});

/* ================================================================== */
section('4 · Theme / language');

await test('Hindi copy renders in help center', async () => {
  setSiteLocale('hi');
  const utils = renderHelp();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-help').textContent.includes('सहायता'), 'Hindi heading missing');
  resetState();
});

await test('dark appearance renders help center', async () => {
  setSiteAppearance('dark');
  const utils = renderHelp();
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-help'));
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
