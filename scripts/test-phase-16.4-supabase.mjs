#!/usr/bin/env node
/** Phase 16.4 configured authenticated-customer booking-flow acceptance. */
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

process.env.VITE_SUPABASE_URL = 'http://supabase-booking.test';
process.env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_booking_test';

const USER_ID = '30000000-0000-4000-8000-000000000001';
const SALON_ID = '40000000-0000-4000-8000-000000000001';
const SERVICE_ID = '50000000-0000-4000-8000-000000000001';
const CATEGORY_ID = '51000000-0000-4000-8000-000000000001';
const BOOKING_ID = '60000000-0000-4000-8000-000000000001';
const ITEM_ID = '70000000-0000-4000-8000-000000000001';
const authUser = {
  id: USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'asha@example.test',
  phone: '+919876543210',
  user_metadata: { full_name: 'Asha Customer' },
  app_metadata: {},
  created_at: '2026-01-01T00:00:00.000Z',
};
let createCalls = 0;
const createBodies = [];

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = String(typeof input === 'string' ? input : input?.url || input);
  if (url.includes('/auth/v1/user')) {
    return new Response(JSON.stringify(authUser), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }
  if (url.includes('/rest/v1/rpc/get_public_salon_service_catalog')) {
    return new Response(JSON.stringify({
      salon_id: SALON_ID,
      template_key: 'hair_studio_color_bar',
      services: [{
        id: SERVICE_ID,
        salon_id: SALON_ID,
        category_id: CATEGORY_ID,
        category_name: 'Hair Colour',
        category_slug: 'hair-colour',
        name: 'Database Balayage',
        description: 'Real catalog description',
        price_paise: 125000,
        duration_minutes: 90,
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('/rest/v1/rpc/create_customer_booking')) {
    createCalls += 1;
    createBodies.push(JSON.parse(String(init.body || '{}')));
    if (createCalls === 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return new Response(JSON.stringify({
        code: 'P0001', message: 'internal database detail must not reach the customer',
      }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      template_key: 'hair_studio_color_bar',
      duplicate: false,
      booking: {
        id: BOOKING_ID,
        salon_id: SALON_ID,
        customer_user_id: USER_ID,
        staff_id: null,
        booking_number: 'LIVE-1640',
        appointment_start: '2031-08-20T05:30:00.000Z',
        appointment_end: '2031-08-20T07:00:00.000Z',
        status: 'pending',
        total_paise: 125000,
        currency: 'INR',
        customer_note: 'Please be gentle',
        source: null,
        created_by: USER_ID,
        created_at: '2031-08-19T05:30:00.000Z',
        updated_at: '2031-08-19T05:30:00.000Z',
      },
      items: [{
        id: ITEM_ID,
        booking_id: BOOKING_ID,
        service_id: SERVICE_ID,
        quantity: 1,
        unit_price_paise: 125000,
        line_total_paise: 125000,
        service_name_snapshot: 'Database Balayage',
        duration_minutes_snapshot: 90,
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('/rest/v1/bookings')) {
    return new Response(JSON.stringify([]), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }
  if (url.includes('/rest/v1/salon_customers')) {
    return new Response(JSON.stringify([{
      email: 'relationship@example.test',
      phone: '+919999999999',
    }]), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ message: `Unexpected request: ${url}` }), {
    status: 404, headers: { 'content-type': 'application/json' },
  });
};

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.matchMedia = () => ({
  matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
});
dom.window.matchMedia = globalThis.matchMedia;
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const jwt = (payload) => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.test-signature`;
};
window.localStorage.setItem('sb-supabase-booking-auth-token', JSON.stringify({
  access_token: jwt({ sub: USER_ID, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }),
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: authUser,
}));

const React = (await import('react')).default;
const { act, cleanup, fireEvent, render, waitFor } = await import('@testing-library/react');
const SiteBookingFullFlow = (await import('../src/components/SiteBookingFullFlow.tsx')).default;
const { initialData } = await import('../src/types.ts');
const { setSalonClockForTests } = await import('../src/lib/salonStatus.ts');
const { setSiteAppearance, setSiteLocale } = await import('../src/lib/siteNavigation.ts');
const { PAYMENT_STORE_KEY } = await import('../src/lib/siteBookingPayment.ts');

setSiteLocale('en');
setSiteAppearance('light');
setSalonClockForTests(new Date(2026, 7, 19, 11, 0, 0, 0));

const openingHours = Object.fromEntries(
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    .map((day) => [day, { open: true, startTime: '10:00', endTime: '20:00' }]),
);
const data = {
  ...initialData,
  businessId: SALON_ID,
  salonId: SALON_ID,
  templateId: 'hair_studio_color_bar',
  salonName: 'Live Hair Studio',
  address: { fullAddress: 'Jaipur, Rajasthan', latitude: null, longitude: null },
  openingHours,
  holidays: [],
  bookingRules: {
    minNotice: '1 hour', maxAdvance: '30 days', bufferTime: 'No buffer',
    allowStaffSelection: false, advanceDepositPercentage: 25,
  },
  services: [],
  offers: [],
  team: [],
};

async function continueTo(view, target) {
  const flow = view.getByTestId('booking-flow');
  const order = ['salon', 'service', 'date', 'time', 'details', 'summary'];
  while (flow.dataset.step !== target && order.indexOf(flow.dataset.step) < order.indexOf(target)) {
    await waitFor(() => assert.equal(view.getByTestId('booking-continue').disabled, false));
    await act(async () => { fireEvent.click(view.getByTestId('booking-continue')); });
  }
  assert.equal(flow.dataset.step, target);
}

try {
  const view = render(React.createElement(SiteBookingFullFlow, {
    themeId: 'hair_studio_color_bar', data,
  }));
  await waitFor(() => assert.ok(view.getByTestId('booking-flow')));
  await continueTo(view, 'details');

  const name = view.getByTestId('booking-input-name');
  const mobile = view.getByTestId('booking-input-mobile');
  const email = view.getByTestId('booking-input-email');
  assert.equal(name.value, 'Asha Customer');
  assert.equal(mobile.value, '+919999999999');
  assert.equal(email.value, 'asha@example.test');
  assert.equal(email.readOnly, true);
  assert.equal(name.maxLength, 100);
  assert.equal(mobile.maxLength, 32);
  assert.equal(email.maxLength, 254);

  await act(async () => {
    fireEvent.change(name, { target: { value: ' ' } });
    fireEvent.blur(name);
  });
  assert.ok(view.getByTestId('booking-err-name'));
  assert.equal(view.getByTestId('booking-continue').disabled, true);

  await act(async () => {
    fireEvent.change(name, { target: { value: 'Asha Customer' } });
    fireEvent.change(view.getByTestId('booking-input-notes'), { target: { value: 'Please be gentle' } });
  });
  await continueTo(view, 'summary');
  const summaryText = view.getByTestId('booking-body').textContent;
  for (const expected of [
    'Live Hair Studio', 'Database Balayage', 'Hair Colour', '90', '1,250',
    'Asha Customer', '+919999999999', 'asha@example.test', 'Please be gentle',
  ]) assert.ok(summaryText.includes(expected), expected);

  const confirm = view.getByTestId('booking-confirm');
  await act(async () => {
    fireEvent.click(confirm);
    fireEvent.click(confirm);
  });
  assert.ok(view.getByTestId('supabase-booking-persisting'));
  await waitFor(() => assert.ok(view.getByTestId('supabase-booking-error')));
  assert.equal(createCalls, 1, 'double click must issue one RPC');
  assert.equal(view.queryByTestId('supabase-booking-persisted'), null);
  assert.doesNotMatch(view.getByTestId('supabase-booking-error').textContent, /internal database detail/i);

  await act(async () => { fireEvent.click(view.getByTestId('supabase-booking-retry')); });
  await waitFor(() => assert.ok(view.getByTestId('supabase-booking-persisted')));
  assert.equal(createCalls, 2);
  assert.equal(createBodies[1].p_customer_id, undefined);
  assert.deepEqual(createBodies[1].p_service_ids, [SERVICE_ID]);
  assert.equal(createBodies[1].p_phone, '+919999999999');
  assert.match(view.getByTestId('supabase-booking-persisted').textContent, /LIVE-1640/);
  assert.match(view.getByTestId('supabase-booking-persisted').textContent, /Database Balayage/);
  assert.equal(window.localStorage.getItem(PAYMENT_STORE_KEY), null);

  console.log('PASS authenticated customer and salon relationship prefill the existing details step');
  console.log('PASS validation, real summary, processing lock, safe error and retry states');
  console.log('PASS real RPC response drives confirmation without a local confirmed record');
  console.log('\n3/3 Phase 16.4 configured customer-flow checks passed.');
} finally {
  cleanup();
  setSalonClockForTests(null);
  globalThis.fetch = originalFetch;
}
process.exit(0);
