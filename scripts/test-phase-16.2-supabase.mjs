#!/usr/bin/env node
/** Phase 16.2 configured-build UI acceptance with a real supabase-js RPC seam. */
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

process.env.VITE_SUPABASE_URL = 'http://supabase-booking.test';
process.env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_booking_test';

const SALON_ID = '40000000-0000-4000-8000-000000000001';
const SERVICE_ID = '50000000-0000-4000-8000-000000000001';
const CATEGORY_ID = '51000000-0000-4000-8000-000000000001';
const USER_ID = '30000000-0000-4000-8000-000000000001';
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
const rpcCalls = [];
let releaseCatalog;
const catalogGate = new Promise((resolve) => { releaseCatalog = resolve; });

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = String(typeof input === 'string' ? input : input?.url || input);
  if (url.includes('/auth/v1/user')) {
    return new Response(JSON.stringify(authUser), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (url.includes('/rest/v1/bookings')) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (url.includes('/rest/v1/salon_customers')) {
    return new Response(JSON.stringify({
      email: 'asha@example.test',
      phone: '+919999999999',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('/rest/v1/profiles')) {
    return new Response(JSON.stringify({
      full_name: 'Asha Customer',
      phone: '+919999999999',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('/rest/v1/rpc/get_customer_bookings')) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (url.includes('/rest/v1/rpc/get_public_salon_service_catalog')) {
    const body = JSON.parse(String(init.body || '{}'));
    rpcCalls.push({ name: 'get_public_salon_service_catalog', body });
    await catalogGate;
    return new Response(JSON.stringify({
      salon_id: SALON_ID,
      template_key: 'hair_studio_color_bar',
      timezone: 'Asia/Kolkata',
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
  return new Response(JSON.stringify({ message: `Unexpected request: ${url}` }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
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
  matches: false,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
dom.window.matchMedia = globalThis.matchMedia;
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { act, cleanup, fireEvent, render, waitFor } = await import('@testing-library/react');
const SiteBookingFullFlow = (await import('../src/components/SiteBookingFullFlow.tsx')).default;
const { initialData } = await import('../src/types.ts');
const { setSiteAppearance, setSiteLocale } = await import('../src/lib/siteNavigation.ts');

setSiteLocale('en');
setSiteAppearance('light');
window.localStorage.clear();
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

const data = {
  ...initialData,
  businessId: SALON_ID,
  salonId: SALON_ID,
  templateId: 'hair_studio_color_bar',
  salonName: 'Live Hair Studio',
  address: { fullAddress: 'Jaipur, Rajasthan', latitude: null, longitude: null },
  // This browser-local row and offer must never enter the configured flow.
  services: [{
    id: 'fake-local-service',
    name: 'Fake Local Service',
    category: 'Wrong Category',
    description: 'Must not render',
    price: 1,
    duration: 1,
    status: 'active',
    themeId: 'hair_studio_color_bar',
    businessId: SALON_ID,
  }],
  offers: [{
    id: 'fake-local-offer',
    businessId: SALON_ID,
    themeId: 'hair_studio_color_bar',
    themeKey: 'hair_studio_color_bar',
    targetType: 'saved_service',
    categoryId: null,
    predefinedServiceId: null,
    savedServiceId: SERVICE_ID,
    packageId: null,
    title: 'Fake discount',
    promotionalBadge: 'Fake',
    discountType: 'percentage',
    discountValue: 99,
    startDate: '2020-01-01',
    endDate: '2040-01-01',
    status: 'active',
  }],
};

try {
  const view = render(React.createElement(SiteBookingFullFlow, {
    themeId: 'hair_studio_color_bar',
    data,
  }));

  assert.ok(view.getByTestId('supabase-booking-catalog-loading'));
  assert.equal(view.queryByText('Fake Local Service'), null);

  await act(async () => { releaseCatalog(); });
  await waitFor(() => assert.ok(view.getByTestId('booking-flow')));
  assert.ok(rpcCalls.length >= 1);
  assert.ok(rpcCalls.every((call) =>
    call.name === 'get_public_salon_service_catalog'
    && call.body.p_salon_id === SALON_ID
    && call.body.p_template_key === 'hair_studio_color_bar',
  ));

  await act(async () => {
    fireEvent.click(view.getByTestId('booking-continue'));
  });
  await waitFor(() => assert.equal(view.getByTestId('booking-flow').dataset.step, 'service'));

  const realCard = view.getByTestId(`booking-service-${SERVICE_ID}`);
  assert.match(realCard.textContent, /Database Balayage/);
  assert.match(realCard.textContent, /Hair Colour/);
  assert.match(realCard.textContent, /90/);
  assert.match(realCard.textContent, /1,250/);
  assert.equal(view.queryByText('Fake Local Service'), null);
  assert.equal(view.queryByText('Fake'), null);
  assert.equal(view.queryByTestId('booking-service-fake-local-service'), null);

  console.log('PASS configured flow blocks local services while catalog is loading');
  console.log('PASS configured flow selects only the server-returned active salon/template catalog');
  console.log('PASS real service name, category, price and duration render in the existing UI');
  console.log('\n3/3 Phase 16.2 configured Supabase UI checks passed.');
} finally {
  cleanup();
  globalThis.fetch = originalFetch;
}

// supabase-js owns background auth timers in configured browser mode.
process.exit(0);
