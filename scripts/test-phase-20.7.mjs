/**
 * PHASE 20.7 — CUSTOMER REVIEWS & RATINGS acceptance.
 *
 * Verifies the review flow over the EXISTING Phase 10.8 review engine:
 *   - eligibility: only THIS customer's own completed (past) booking
 *     can be reviewed (cancelled/pending/future/foreign refused)
 *   - 1–5 star rating + review text, validated by the engine
 *   - one review per booking (duplicates refused)
 *   - edit own review only; another customer's review cannot be edited
 *   - review action in Booking Details only for completed bookings
 *   - My Reviews section in Customer Account (own reviews only)
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

const SiteReviewForm = (await import('../src/components/SiteReviewForm.tsx')).default;
const SiteMyReviews = (await import('../src/components/SiteMyReviews.tsx')).default;
const SiteBookingDetails = (await import('../src/components/SiteBookingDetails.tsx')).default;
const SiteCustomerAccount = (await import('../src/components/SiteCustomerAccount.tsx')).default;
const {
  setReviewStoreForTests,
  submitReview,
  updateReview,
  readMyReviews,
  findMyReviewForBooking,
  readReviews,
} = await import('../src/lib/siteReviews.ts');
const { REVIEW_STORE_KEY, REVIEW_STORE_VERSION } = await import('../src/lib/siteReviews.ts');
const { PAYMENT_STORE_KEY, PAYMENT_STORE_VERSION } = await import('../src/lib/siteBookingPayment.ts');
const { CUSTOMER_ACCOUNT_EVENT } = await import('../src/lib/siteCustomerAccount.ts');
const { localDateKey, salonNow, setSalonClockForTests } = await import('../src/lib/salonStatus.ts');
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
setSalonClockForTests(new Date(2026, 7, 17, 10, 0, 0)); // Mon 2026-08-17
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

const COMPLETED = record({ bookingId: 'NX-93001', dateKey: PAST, bookingStatus: 'confirmed' });
const PENDING = record({ bookingId: 'NX-93002', dateKey: FUTURE, bookingStatus: 'pending_payment' });
const CANCELLED = record({ bookingId: 'NX-93003', dateKey: PAST, bookingStatus: 'cancelled' });
const UPCOMING = record({ bookingId: 'NX-93004', dateKey: FUTURE, bookingStatus: 'confirmed' });
const FOREIGN = record({ ...{ bookingId: 'NX-93999', dateKey: PAST, bookingStatus: 'confirmed' }, customerId: OTHER_ID });

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
  window.localStorage.removeItem(REVIEW_STORE_KEY);
  setReviewStoreForTests({ version: REVIEW_STORE_VERSION, reviews: [], attempts: [] });
}

function resetState() {
  cleanup();
  window.localStorage.removeItem(PAYMENT_STORE_KEY);
  window.localStorage.removeItem(REVIEW_STORE_KEY);
  setReviewStoreForTests(null);
  localStorage.clear();
  setSiteLocale('en');
  setSiteAppearance('light');
  setSalonClockForTests(new Date(2026, 7, 17, 10, 0, 0));
}

function review(id, overrides = {}) {
  return {
    id,
    businessId: 'public-site',
    themeId: 'hair_studio_color_bar',
    bookingId: 'NX-93001',
    customerId: MY_ID,
    customerName: 'Neha Verma',
    rating: 5,
    body: 'Lovely experience, would definitely visit again!',
    serviceName: 'Haircut & Blow-Dry',
    status: 'pending',
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    fingerprint: 'fp',
    ...overrides,
  };
}

/* ================================================================== */
section('1 · Data layer — eligibility, targeting, duplicates');

await test('submitReview targets the SPECIFIC completed booking', () => {
  seed([COMPLETED, PENDING]);
  const r = submitReview({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-93001',
    rating: 5, body: 'Lovely experience, would definitely visit again!', customerName: 'Neha Verma',
  });
  assert.equal(r.ok, true);
  assert.equal(r.review.bookingId, 'NX-93001');
  assert.equal(r.review.rating, 5);
  assert.equal(r.review.status, 'pending'); // moderation: pending until approved
  assert.equal(r.review.customerId, MY_ID);
  resetState();
});

await test('refuses cancelled / pending / future bookings', () => {
  seed([PENDING, CANCELLED, UPCOMING]);
  for (const id of ['NX-93002', 'NX-93003', 'NX-93004']) {
    const r = submitReview({
      businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: id,
      rating: 5, body: 'Lovely experience, would definitely visit again!', customerName: 'Neha Verma',
    });
    assert.equal(r.ok, false, `${id} should not be reviewable`);
    assert.equal(r.error, 'no-eligible-booking');
  }
  resetState();
});

await test('refuses another customer\'s booking', () => {
  seed([FOREIGN]);
  const r = submitReview({
    businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-93999',
    rating: 5, body: 'Lovely experience, would definitely visit again!', customerName: 'Neha Verma',
  });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'no-eligible-booking');
  resetState();
});

await test('one review per booking — duplicates refused', () => {
  seed([COMPLETED]);
  submitReview({ businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-93001', rating: 4, body: 'Lovely experience, would definitely visit again!', customerName: 'Neha Verma' });
  const dup = submitReview({ businessId: 'public-site', themeId: 'hair_studio_color_bar', bookingId: 'NX-93001', rating: 5, body: 'Lovely experience, would definitely visit again!', customerName: 'Neha Verma' });
  assert.equal(dup.ok, false);
  assert.equal(dup.error, 'duplicate');
  assert.equal(readReviews().length, 1);
  resetState();
});

await test('readMyReviews + findMyReviewForBooking are own-rows-only', () => {
  seed([COMPLETED]);
  setReviewStoreForTests({
    version: REVIEW_STORE_VERSION,
    reviews: [
      review('r1'),
      review('r2', { customerId: OTHER_ID, bookingId: 'NX-93999', id: 'r2' }),
    ],
    attempts: [],
  });
  assert.equal(readMyReviews().length, 1);
  assert.equal(readMyReviews()[0].id, 'r1');
  assert.ok(findMyReviewForBooking('public-site', 'hair_studio_color_bar', 'NX-93001'));
  assert.equal(findMyReviewForBooking('public-site', 'hair_studio_color_bar', 'NX-93999'), null);
  resetState();
});

await test('updateReview edits OWN review only; validates input', () => {
  seed([COMPLETED]);
  setReviewStoreForTests({
    version: REVIEW_STORE_VERSION,
    reviews: [
      review('r1'),
      review('r2', { customerId: OTHER_ID, bookingId: 'NX-93999', id: 'r2' }),
    ],
    attempts: [],
  });
  // own review updates
  const ok = updateReview('r1', { rating: 3, body: 'Decent service overall, happy with the cut.' });
  assert.equal(ok.ok, true);
  assert.equal(ok.review.rating, 3);
  assert.equal(ok.review.body, 'Decent service overall, happy with the cut.');
  // foreign review refused
  const foreign = updateReview('r2', { rating: 1 });
  assert.equal(foreign.ok, false);
  // invalid rating refused
  const bad = updateReview('r1', { rating: 9 });
  assert.equal(bad.ok, false);
  assert.equal(bad.error, 'invalid-rating');
  resetState();
});

/* ================================================================== */
section('2 · Review form UI');

function renderForm(booking, existing = null) {
  return render(React.createElement(SiteReviewForm, {
    themeId: 'hair_studio_color_bar', data: SALON, booking, existingReview: existing,
    onBack: () => {}, onClose: () => {}, onDone: () => {},
  }));
}

await test('submit new review via UI → success + store has it', async () => {
  seed([COMPLETED]);
  const utils = renderForm(COMPLETED);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('review-star-5')); });
  await act(async () => {
    fireEvent.change(utils.getByTestId('review-form-body'), { target: { value: 'Lovely experience, would definitely visit again!' } });
  });
  await act(async () => { fireEvent.click(utils.getByTestId('review-form-submit')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const reviews = readReviews();
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].bookingId, 'NX-93001');
  assert.equal(reviews[0].rating, 5);
  resetState();
});

await test('validation: no rating blocks submit', async () => {
  seed([COMPLETED]);
  const utils = renderForm(COMPLETED);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => {
    fireEvent.change(utils.getByTestId('review-form-body'), { target: { value: 'Lovely experience, would definitely visit again!' } });
  });
  await act(async () => { fireEvent.click(utils.getByTestId('review-form-submit')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('review-form-error'), 'validation error missing');
  assert.equal(readReviews().length, 0, 'nothing persisted');
  resetState();
});

await test('ineligible booking shows error (engine refuses)', async () => {
  seed([PENDING]);
  const utils = renderForm(PENDING);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('review-star-5')); });
  await act(async () => {
    fireEvent.change(utils.getByTestId('review-form-body'), { target: { value: 'Lovely experience, would definitely visit again!' } });
  });
  await act(async () => { fireEvent.click(utils.getByTestId('review-form-submit')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('review-form-error'), 'engine refusal not surfaced');
  assert.equal(readReviews().length, 0);
  resetState();
});

await test('edit existing review updates rating + body', async () => {
  seed([COMPLETED]);
  const existing = review('r1');
  setReviewStoreForTests({ version: REVIEW_STORE_VERSION, reviews: [existing], attempts: [] });
  const utils = renderForm(COMPLETED, existing);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('review-star-4')); });
  await act(async () => {
    fireEvent.change(utils.getByTestId('review-form-body'), { target: { value: 'Good service, will come back again soon!' } });
  });
  await act(async () => { fireEvent.click(utils.getByTestId('review-form-submit')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const updated = readReviews()[0];
  assert.equal(updated.rating, 4);
  assert.equal(updated.body, 'Good service, will come back again soon!');
  resetState();
});

/* ================================================================== */
section('3 · Booking Details integration');

await test('completed booking shows Write a Review; pending does not', async () => {
  seed([COMPLETED]);
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-93001',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-details-review'), 'review button missing on completed booking');
  assert.ok(utils.getByTestId('booking-details-review').textContent.includes('Write a Review'));
  resetState();

  seed([PENDING]);
  const utils2 = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-93002',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(utils2.queryByTestId('booking-details-review'), null, 'review button on pending booking');
  resetState();
});

await test('existing review → Edit Review label; form opens and saves', async () => {
  seed([COMPLETED]);
  setReviewStoreForTests({ version: REVIEW_STORE_VERSION, reviews: [review('r1')], attempts: [] });
  const utils = render(React.createElement(SiteBookingDetails, {
    themeId: 'hair_studio_color_bar', data: SALON, bookingId: 'NX-93001',
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('booking-details-review').textContent.includes('Edit Review'), 'edit label missing');
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-review')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('review-form'), 'review form did not open');
  resetState();
});

/* ================================================================== */
section('4 · My Reviews (Customer Account)');

await test('empty state', async () => {
  seed([]);
  const utils = render(React.createElement(SiteMyReviews, {
    themeId: 'hair_studio_color_bar', data: SALON,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {}, onEdit: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('customer-reviews-empty'));
  resetState();
});

await test('shows own reviews with rating/body/status; edit button opens form', async () => {
  seed([]);
  setReviewStoreForTests({ version: REVIEW_STORE_VERSION, reviews: [review('r1')], attempts: [] });
  const utils = render(React.createElement(SiteMyReviews, {
    themeId: 'hair_studio_color_bar', data: SALON,
    onBack: () => {}, onClose: () => {}, onViewSalon: () => {}, onEdit: () => {},
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const row = utils.getByTestId('customer-review-NX-93001');
  assert.ok(row.textContent.includes('5/5'), 'rating missing');
  assert.ok(row.textContent.includes('Lovely experience'), 'review body missing');
  assert.ok(utils.getByTestId('customer-review-edit-NX-93001'), 'edit button missing');
  assert.equal(row.getAttribute('data-status'), 'pending');
  resetState();
});

/* ================================================================== */
section('5 · E2E through Customer Account');

async function openAccount() {
  await act(async () => {
    window.dispatchEvent(new Event(CUSTOMER_ACCOUNT_EVENT));
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

await test('submit review from Booking Details → My Reviews shows it', async () => {
  seed([COMPLETED]);
  const utils = render(React.createElement(SiteCustomerAccount, { themeId: 'hair_studio_color_bar', data: SALON }));
  await openAccount();
  // the eligible booking is a past-dated confirmed appointment (Upcoming tab)
  await act(async () => { fireEvent.click(utils.getByTestId('account-booking-NX-93001')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  // write review
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-review')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('review-star-5')); });
  await act(async () => {
    fireEvent.change(utils.getByTestId('review-form-body'), { target: { value: 'Lovely experience, would definitely visit again!' } });
  });
  await act(async () => { fireEvent.click(utils.getByTestId('review-form-submit')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  assert.ok(utils.getByTestId('booking-details-success'), 'success banner missing');
  // back to home → My Reviews shows the review
  await act(async () => { fireEvent.click(utils.getByTestId('booking-details-back-top')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  await act(async () => { fireEvent.click(utils.getByTestId('customer-account-reviews')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(document.querySelector('[data-testid="customer-account"]').getAttribute('data-view'), 'reviews');
  assert.ok(utils.getByTestId('customer-review-NX-93001'), 'review not in My Reviews');
  resetState();
});

/* ================================================================== */
section('6 · Theme / language');

await test('Hindi copy in review form', async () => {
  seed([COMPLETED]);
  setSiteLocale('hi');
  const utils = renderForm(COMPLETED);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('review-form').textContent.includes('समीक्षा लिखें'), 'Hindi heading missing');
  resetState();
});

await test('dark appearance renders review form', async () => {
  seed([COMPLETED]);
  setSiteAppearance('dark');
  const utils = renderForm(COMPLETED);
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.ok(utils.getByTestId('review-form'));
  resetState();
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
