#!/usr/bin/env node
/**
 * Phase 16.1/16.2 offline booking persistence and service-catalog guardrails.
 *
 * This suite validates the repository contract, local-mutation refusal, and the
 * additive SQL against an exact-shaped disposable PostgreSQL schema. It does
 * not claim live Supabase connectivity, migration application, or refresh proof.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.localStorage = dom.window.localStorage;

const {
  bookingSalonIdCandidate,
  bookingServicesAreDatabaseRows,
  createSupabaseBookingWithClient,
  isDatabaseUuid,
  readMySupabaseBookingByReferenceWithClient,
  readMySupabaseBookingsWithClient,
  readSupabaseBookingCatalogWithClient,
  readSupabaseCustomerDetailsWithClient,
  SupabaseBookingError,
} = await import('../src/lib/supabaseBooking.ts');
const {
  bookingBrowserId,
} = await import('../src/lib/siteBookingFlow.ts');
const { groupCustomerBookings } = await import('../src/lib/siteCustomerAccount.ts');
const {
  customerCanCancel,
  customerCancelBooking,
  ownerAllowedTransitionsForRecord,
} = await import('../src/lib/bookingManagement.ts');
const {
  PAYMENT_STORE_KEY,
  PAYMENT_STORE_VERSION,
  simulateGateway,
} = await import('../src/lib/siteBookingPayment.ts');

let tests = 0;
async function test(name, fn) {
  tests += 1;
  await fn();
  console.log(`PASS ${name}`);
}

const USER_ID = '30000000-0000-4000-8000-000000000001';
const OTHER_USER_ID = '30000000-0000-4000-8000-000000000002';
const SALON_ID = '40000000-0000-4000-8000-000000000001';
const OTHER_SALON_ID = '40000000-0000-4000-8000-000000000002';
const SERVICE_ID = '50000000-0000-4000-8000-000000000001';
const OTHER_SERVICE_ID = '50000000-0000-4000-8000-000000000002';
const SECOND_SERVICE_ID = '50000000-0000-4000-8000-000000000003';
const CATEGORY_ID = '51000000-0000-4000-8000-000000000001';
const OTHER_CATEGORY_ID = '51000000-0000-4000-8000-000000000002';
const BOOKING_ID = '60000000-0000-4000-8000-000000000001';
const ITEM_ID = '70000000-0000-4000-8000-000000000001';
const user = {
  id: USER_ID,
  email: 'customer@example.test',
  phone: '+919876543210',
  user_metadata: { full_name: 'Asha Customer' },
};

function bookingRow(overrides = {}) {
  return {
    id: BOOKING_ID,
    salon_id: SALON_ID,
    customer_user_id: USER_ID,
    staff_id: null,
    booking_number: 'LIVE-1001',
    appointment_start: '2031-08-20T05:30:00.000Z',
    appointment_end: '2031-08-20T06:30:00.000Z',
    status: 'pending',
    total_paise: 125000,
    currency: 'INR',
    customer_note: null,
    source: null,
    created_by: USER_ID,
    created_at: '2031-08-19T05:30:00.000Z',
    updated_at: '2031-08-19T05:30:00.000Z',
    ...overrides,
  };
}

function itemRow(overrides = {}) {
  return {
    id: ITEM_ID,
    booking_id: BOOKING_ID,
    service_id: SERVICE_ID,
    quantity: 1,
    unit_price_paise: 125000,
    line_total_paise: 125000,
    service_name_snapshot: 'Live Hair Service',
    duration_minutes_snapshot: 60,
    ...overrides,
  };
}

await test('database identifiers and salon candidates must be real UUIDs', () => {
  assert.equal(isDatabaseUuid(SALON_ID), true);
  assert.equal(isDatabaseUuid('public-site'), false);
  assert.equal(bookingServicesAreDatabaseRows([{ serviceId: SERVICE_ID }]), true);
  assert.equal(bookingServicesAreDatabaseRows([{ serviceId: 'mock-service' }]), false);
  const data = { services: [], businessId: SALON_ID };
  assert.equal(bookingSalonIdCandidate(data, null), SALON_ID);
  assert.equal(bookingSalonIdCandidate({ services: [] }, null), null);
});

await test('catalog repository maps only server-returned active salon/template service data', async () => {
  let call = null;
  const client = {
    async rpc(name, args) {
      call = { name, args };
      return {
        data: {
          salon_id: SALON_ID,
          template_key: 'hair_studio_color_bar',
          services: [{
            id: SERVICE_ID,
            salon_id: SALON_ID,
            category_id: CATEGORY_ID,
            category_name: 'Hair Colour',
            category_slug: 'hair-colour',
            name: 'Live Hair Service',
            description: 'Database description',
            price_paise: 125000,
            duration_minutes: 60,
          }],
        },
        error: null,
      };
    },
  };
  const catalog = await readSupabaseBookingCatalogWithClient(
    client,
    SALON_ID,
    'hair_studio_color_bar',
  );
  assert.equal(call.name, 'get_public_salon_service_catalog');
  assert.deepEqual(call.args, { p_salon_id: SALON_ID, p_template_key: 'hair_studio_color_bar' });
  assert.equal(catalog.salonId, SALON_ID);
  assert.equal(catalog.themeId, 'hair_studio_color_bar');
  assert.deepEqual(catalog.services[0], {
    id: SERVICE_ID,
    name: 'Live Hair Service',
    category: 'Hair Colour',
    description: 'Database description',
    price: 1250,
    duration: 60,
    businessId: SALON_ID,
    themeId: 'hair_studio_color_bar',
    themeKey: 'hair_studio_color_bar',
    categoryId: CATEGORY_ID,
    status: 'active',
  });
});

await test('catalog repository rejects cross-salon and cross-template responses', async () => {
  const crossSalonClient = {
    async rpc() {
      return {
        data: {
          salon_id: SALON_ID,
          template_key: 'hair_studio_color_bar',
          services: [{
            id: OTHER_SERVICE_ID,
            salon_id: OTHER_SALON_ID,
            category_id: CATEGORY_ID,
            category_name: 'Hair Colour',
            category_slug: 'hair-colour',
            name: 'Foreign',
            description: '',
            price_paise: 1,
            duration_minutes: 1,
          }],
        },
        error: null,
      };
    },
  };
  await assert.rejects(
    () => readSupabaseBookingCatalogWithClient(crossSalonClient, SALON_ID, 'hair_studio_color_bar'),
    (error) => error instanceof SupabaseBookingError && error.kind === 'permission',
  );

  const crossThemeClient = {
    async rpc() {
      return {
        data: { salon_id: SALON_ID, template_key: 'beauty_skin_spa', services: [] },
        error: null,
      };
    },
  };
  await assert.rejects(
    () => readSupabaseBookingCatalogWithClient(crossThemeClient, SALON_ID, 'hair_studio_color_bar'),
    (error) => error instanceof SupabaseBookingError && error.kind === 'permission',
  );
});

await test('customer details prefill comes from the authenticated user and own salon relationship', async () => {
  const filters = [];
  const client = {
    from(table) {
      assert.equal(table, 'salon_customers');
      return {
        select() { return this; },
        eq(column, value) { filters.push([column, value]); return this; },
        async maybeSingle() {
          return { data: { email: 'relationship@example.test', phone: '+919999999999' }, error: null };
        },
      };
    },
  };
  const details = await readSupabaseCustomerDetailsWithClient(client, user, SALON_ID);
  assert.deepEqual(details, {
    userId: USER_ID,
    name: 'Asha Customer',
    mobile: '+919999999999',
    email: 'customer@example.test',
    emailReadOnly: true,
  });
  assert.deepEqual(filters, [['salon_id', SALON_ID], ['customer_user_id', USER_ID]]);
});

await test('create repository sends no customer id, price, status, reference, or client duration', async () => {
  let call = null;
  const client = {
    async rpc(name, args) {
      call = { name, args };
      return {
        data: {
          template_key: 'hair_studio_color_bar',
          booking: bookingRow(),
          items: [itemRow()],
        },
        error: null,
      };
    },
  };
  const record = await createSupabaseBookingWithClient(client, user, {
    salonId: SALON_ID,
    themeId: 'hair_studio_color_bar',
    services: [{
      serviceId: SERVICE_ID,
      serviceName: 'Browser name is not authoritative',
      price: 1,
      durationMinutes: 1,
    }],
    dateKey: '2031-08-20',
    startMinutes: 660,
    customer: {
      name: 'Asha Customer', mobile: '+919876543210', email: 'spoof@example.test', notes: '',
    },
  });

  assert.equal(call.name, 'create_customer_booking');
  assert.deepEqual(Object.keys(call.args).sort(), [
    'p_appointment_start', 'p_customer_note', 'p_phone', 'p_salon_id', 'p_service_ids',
  ]);
  assert.equal(call.args.p_salon_id, SALON_ID);
  assert.deepEqual(call.args.p_service_ids, [SERVICE_ID]);
  assert.equal('p_customer_id' in call.args, false);
  assert.equal('p_total_paise' in call.args, false);
  assert.equal('p_appointment_end' in call.args, false);
  assert.equal(record.persistence, 'supabase');
  assert.equal(record.customerId, USER_ID);
  assert.equal(record.businessId, SALON_ID);
  assert.equal(record.services[0].serviceName, 'Live Hair Service');
  assert.equal(record.services[0].price, 1250);
  assert.equal(record.services[0].durationMinutes, 60);
});

await test('edited customer name updates only the current authenticated auth profile before booking', async () => {
  let updatePayload = null;
  const updatedUser = { ...user, user_metadata: { ...user.user_metadata, full_name: 'Asha Sharma' } };
  const client = {
    auth: {
      async updateUser(payload) {
        updatePayload = payload;
        return { data: { user: updatedUser }, error: null };
      },
    },
    async rpc() {
      return {
        data: {
          template_key: 'hair_studio_color_bar',
          booking: bookingRow(),
          items: [itemRow()],
        },
        error: null,
      };
    },
  };
  const record = await createSupabaseBookingWithClient(client, user, {
    salonId: SALON_ID,
    themeId: 'hair_studio_color_bar',
    services: [{ serviceId: SERVICE_ID, serviceName: 'ignored', price: 1, durationMinutes: 1 }],
    dateKey: '2031-08-20',
    startMinutes: 660,
    customer: {
      name: ' Asha Sharma ', mobile: '+919876543210', email: 'customer@example.test', notes: '',
    },
  });
  assert.equal(updatePayload.data.full_name, 'Asha Sharma');
  assert.equal(record.customerId, USER_ID);
  assert.equal(record.customer.name, 'Asha Sharma');
});

await test('create repository rejects invalid customer fields before any RPC', async () => {
  let rpcCalls = 0;
  const client = { async rpc() { rpcCalls += 1; return { data: null, error: null }; } };
  await assert.rejects(
    () => createSupabaseBookingWithClient(client, user, {
      salonId: SALON_ID,
      themeId: 'hair_studio_color_bar',
      services: [{ serviceId: SERVICE_ID, serviceName: 'ignored', price: 1, durationMinutes: 1 }],
      dateKey: '2031-08-20',
      startMinutes: 660,
      customer: { name: ' ', mobile: '123', email: 'bad', notes: '' },
    }),
    (error) => error instanceof SupabaseBookingError && error.kind === 'validation',
  );
  assert.equal(rpcCalls, 0);
});

await test('create repository rejects a response outside the authenticated customer', async () => {
  const client = {
    async rpc() {
      return {
        data: {
          template_key: 'hair_studio_color_bar',
          booking: bookingRow({ customer_user_id: OTHER_USER_ID }),
          items: [itemRow()],
        },
        error: null,
      };
    },
  };
  await assert.rejects(
    () => createSupabaseBookingWithClient(client, user, {
      salonId: SALON_ID,
      themeId: 'hair_studio_color_bar',
      services: [{ serviceId: SERVICE_ID, serviceName: 'x', price: 1, durationMinutes: 1 }],
      dateKey: '2031-08-20',
      startMinutes: 660,
      customer: { name: 'Asha Customer', mobile: '+919876543210', email: 'customer@example.test', notes: '' },
    }),
    (error) => error instanceof SupabaseBookingError && error.kind === 'permission',
  );
});

await test('read repository filters by session user and salon, then maps only RLS rows', async () => {
  const filters = [];
  const booking = { ...bookingRow(), booking_items: [itemRow()] };
  const client = {
    async rpc(name, args) {
      assert.equal(name, 'get_public_salon_service_catalog');
      assert.deepEqual(args, { p_salon_id: SALON_ID, p_template_key: 'hair_studio_color_bar' });
      return {
        data: { salon_id: SALON_ID, template_key: 'hair_studio_color_bar', services: [] },
        error: null,
      };
    },
    from(table) {
      if (table === 'bookings') {
        return {
          select() { return this; },
          eq(column, value) { filters.push([table, column, value]); return this; },
          async order() { return { data: [booking], error: null }; },
        };
      }
      if (table === 'salon_customers') {
        return {
          select() { return this; },
          eq(column, value) { filters.push([table, column, value]); return this; },
          async maybeSingle() {
            return { data: { email: 'customer@example.test', phone: '+919876543210' }, error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };

  const records = await readMySupabaseBookingsWithClient(
    client,
    user,
    SALON_ID,
    'hair_studio_color_bar',
  );
  assert.equal(records.length, 1);
  assert.equal(records[0].id, BOOKING_ID);
  assert.equal(records[0].persistence, 'supabase');
  assert.deepEqual(filters, [
    ['bookings', 'salon_id', SALON_ID],
    ['bookings', 'customer_user_id', USER_ID],
    ['salon_customers', 'salon_id', SALON_ID],
    ['salon_customers', 'customer_user_id', USER_ID],
  ]);
});

await test('direct booking/receipt lookup is authenticated, tenant-scoped and RLS-safe', async () => {
  const filters = [];
  const client = {
    async rpc() {
      return {
        data: {
          salon_id: SALON_ID,
          template_key: 'hair_studio_color_bar',
          services: [{
            id: SERVICE_ID,
            salon_id: SALON_ID,
            category_id: CATEGORY_ID,
            category_name: 'Hair Colour',
            category_slug: 'hair-colour',
            name: 'Live Hair Service',
            description: '',
            price_paise: 125000,
            duration_minutes: 60,
          }],
        },
        error: null,
      };
    },
    from(table) {
      if (table === 'bookings') {
        return {
          select() { return this; },
          eq(column, value) { filters.push([table, column, value]); return this; },
          async maybeSingle() {
            return { data: { ...bookingRow(), booking_items: [itemRow()] }, error: null };
          },
        };
      }
      if (table === 'salon_customers') {
        return {
          select() { return this; },
          eq(column, value) { filters.push([table, column, value]); return this; },
          async maybeSingle() {
            return { data: { email: user.email, phone: user.phone }, error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
  const record = await readMySupabaseBookingByReferenceWithClient(
    client, user, SALON_ID, 'hair_studio_color_bar', 'LIVE-1001',
  );
  assert.equal(record.bookingId, 'LIVE-1001');
  assert.equal(record.customerId, USER_ID);
  assert.equal(record.services[0].category, 'Hair Colour');
  assert.deepEqual(filters.slice(0, 3), [
    ['bookings', 'salon_id', SALON_ID],
    ['bookings', 'customer_user_id', USER_ID],
    ['bookings', 'booking_number', 'LIVE-1001'],
  ]);
});

await test('Supabase records expose no local customer cancel or payment mutation; owner transitions use the server adapter', () => {
  const record = {
    id: BOOKING_ID,
    idempotencyKey: `supabase:${BOOKING_ID}`,
    businessId: SALON_ID,
    themeId: 'hair_studio_color_bar',
    customerId: bookingBrowserId(),
    bookingId: 'LIVE-1001',
    serviceId: SERVICE_ID,
    serviceName: 'Live Hair Service',
    services: [],
    dateKey: '2031-08-20',
    startMinutes: 660,
    endMinutes: 720,
    baseAmount: 1250,
    amountDue: 0,
    remainingAmount: 1250,
    currency: 'INR',
    paymentOption: 'advance',
    paymentMethod: null,
    paymentStatus: 'unpaid',
    bookingStatus: 'pending_payment',
    customer: { name: 'Asha', mobile: '', email: '', notes: '' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    payAtSalon: false,
    persistence: 'supabase',
  };
  assert.equal(customerCanCancel(record), false);
  assert.equal(groupCustomerBookings([{ ...record, customerId: USER_ID }]).upcoming.length, 1);
  assert.deepEqual(ownerAllowedTransitionsForRecord(record), ['confirmed', 'cancelled']);
  assert.throws(
    () => simulateGateway(record, { method: 'upi', upiId: 'asha@upi' }),
    /cannot use the local payment simulator/i,
  );
  window.localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify({
    version: PAYMENT_STORE_VERSION,
    records: [record],
  }));
  assert.deepEqual(
    customerCancelBooking(SALON_ID, 'hair_studio_color_bar', 'LIVE-1001'),
    { ok: false, reason: 'invalid-transition' },
  );
});

await test('configured UI uses Supabase authority without writing confirmed rows to localStorage', () => {
  const repository = fs.readFileSync('src/lib/supabaseBooking.ts', 'utf8');
  const fullFlow = fs.readFileSync('src/components/SiteBookingFullFlow.tsx', 'utf8');
  const history = fs.readFileSync('src/components/SiteMyBookings.tsx', 'utf8');
  const account = fs.readFileSync('src/components/SiteCustomerAccount.tsx', 'utf8');
  assert.match(fullFlow, /if \(!isSupabaseConfigured\)[\s\S]*setPhase\('payment'\)/);
  assert.match(fullFlow, /createSupabaseBooking\(/);
  assert.match(fullFlow, /readSupabaseBookingCatalog\(/);
  assert.match(fullFlow, /readSupabaseCustomerDetails\(/);
  assert.match(fullFlow, /authenticatedCustomer=/);
  assert.match(fullFlow, /supabase-booking-retry/);
  assert.match(fullFlow, /services:\s*catalogServices/);
  assert.match(fullFlow, /offers:\s*\[\]/);
  assert.match(history, /isSupabaseConfigured\s*\?\s*databaseBookings\s*:\s*readMyBookings/);
  assert.match(account, /isSupabaseConfigured[\s\S]*groupCustomerBookings\(databaseBookings\)/);
  assert.match(account, /persistedRecord=\{selectedBooking\}/);
  assert.doesNotMatch(repository, /localStorage|PAYMENT_STORE_KEY|bookingBrowserId/);
});

await test('migration is additive, auth-derived, server-priced, and anonymous-safe', () => {
  const sql = fs.readFileSync('docs/phase-16.1-booking-foundation.sql', 'utf8');
  assert.doesNotMatch(sql, /create\s+table/i);
  assert.doesNotMatch(sql, /job_salon_members/i);
  assert.doesNotMatch(sql, /disable\s+row\s+level\s+security/i);
  assert.match(sql, /caller uuid := auth\.uid\(\)/i);
  assert.match(sql, /sum\(s\.price_paise\)/i);
  assert.match(sql, /sum\(s\.duration_minutes\)/i);
  assert.match(sql, /make_interval\(mins => total_duration\)/i);
  assert.match(sql, /revoke all on function public\.create_customer_booking[\s\S]*from anon/i);
  assert.match(sql, /grant execute on function public\.create_customer_booking[\s\S]*to authenticated/i);
  for (const key of [
    'nexora_site_booking_drafts',
    'nexora_site_booking_holds',
    'nexora_site_booking_browser',
    'nexora_site_payment_records',
  ]) assert.ok(sql.includes(key), key);
});

await test('Phase 16.2 SQL reuses the booking RPC and derives catalog, price, duration, salon and template server-side', () => {
  const sql = fs.readFileSync('docs/phase-16.2-service-booking-items.sql', 'utf8');
  assert.doesNotMatch(sql, /create\s+table|alter\s+table.*add\s+column/i);
  assert.doesNotMatch(sql, /job_salon_members|disable\s+row\s+level\s+security/i);
  assert.match(sql, /create or replace function public\.create_customer_booking/i);
  assert.equal((sql.match(/create or replace function public\.create_customer_booking/gi) || []).length, 1);
  assert.match(sql, /create or replace function public\.get_public_salon_service_catalog/i);
  assert.match(sql, /public\.salon_public_websites/);
  assert.match(sql, /active_template <> btrim\(p_template_key\)/i);
  assert.match(sql, /join public\.service_categories c[\s\S]*c\.is_active = true/i);
  assert.match(sql, /s\.salon_id = p_salon_id[\s\S]*s\.is_active = true/i);
  assert.match(sql, /sum\(s\.price_paise\)/i);
  assert.match(sql, /sum\(s\.duration_minutes\)/i);
  assert.match(sql, /insert into public\.booking_items/i);
  assert.match(sql, /'template_key', active_template/i);
  assert.match(sql, /from anon[\s\S]*to authenticated/i);
});

await test('Phase 16.4 SQL keeps auth.uid identity and returns one row for sequential duplicate retries', () => {
  const sql = fs.readFileSync('docs/phase-16.4-customer-booking-flow.sql', 'utf8');
  assert.doesNotMatch(sql, /create\s+table|alter\s+table.*add\s+column|job_salon_members/i);
  assert.match(sql, /create or replace function public\.create_customer_booking/i);
  assert.equal((sql.match(/create or replace function public\.create_customer_booking/gi) || []).length, 1);
  assert.match(sql, /caller uuid := auth\.uid\(\)/i);
  assert.doesNotMatch(sql, /p_customer_id|customer_id\s+uuid/i);
  assert.match(sql, /b\.customer_user_id = caller/i);
  assert.match(sql, /b\.appointment_start = p_appointment_start/i);
  assert.match(sql, /'duplicate', true/i);
  assert.match(sql, /'duplicate', false/i);
  assert.match(sql, /Booking notes must be 1000 characters or fewer/i);
  assert.match(sql, /Enter a valid phone number/i);
  assert.match(sql, /from anon[\s\S]*to authenticated/i);
});

await test('migrations execute twice and enforce catalog, booking-item, tenant, template and customer isolation', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  const phase161Sql = fs.readFileSync('docs/phase-16.1-booking-foundation.sql', 'utf8');
  const phase162Sql = fs.readFileSync('docs/phase-16.2-service-booking-items.sql', 'utf8');
  const phase164Sql = fs.readFileSync('docs/phase-16.4-customer-booking-flow.sql', 'utf8');
  try {
    await db.exec(`
      do $$ begin
        if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
        if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
      end $$;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create table auth.users (id uuid primary key, email text, phone text);
      create table public.salons (
        id uuid primary key, is_active boolean not null default true, deleted_at timestamptz
      );
      create table public.service_categories (
        id uuid primary key, name text not null, slug text not null,
        is_active boolean not null default true
      );
      create table public.services (
        id uuid primary key, salon_id uuid not null references public.salons(id),
        category_id uuid not null references public.service_categories(id),
        name text not null, description text,
        price_paise bigint not null, duration_minutes integer not null,
        is_active boolean not null default true
      );
      create table public.salon_website_settings (
        salon_id uuid primary key references public.salons(id),
        template_key text not null, published boolean not null default true
      );
      create view public.salon_public_websites as
      select salon_id, template_key
      from public.salon_website_settings
      where published = true;
      create table public.salon_customers (
        id uuid primary key default gen_random_uuid(),
        salon_id uuid not null references public.salons(id),
        customer_user_id uuid not null references auth.users(id),
        email text, phone text, created_at timestamptz not null default now(),
        unique (salon_id, customer_user_id)
      );
      create table public.bookings (
        id uuid primary key default gen_random_uuid(),
        salon_id uuid not null references public.salons(id),
        customer_user_id uuid not null references auth.users(id),
        staff_id uuid,
        booking_number text not null default 'LIVE-DEFAULT',
        appointment_start timestamptz not null,
        appointment_end timestamptz not null,
        status text not null default 'pending',
        total_paise bigint not null,
        currency text not null default 'INR',
        customer_note text,
        source text,
        created_by uuid references auth.users(id),
        started_at timestamptz,
        completed_at timestamptz,
        cancelled_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create table public.booking_items (
        id uuid primary key default gen_random_uuid(),
        booking_id uuid not null references public.bookings(id),
        service_id uuid not null references public.services(id),
        quantity integer not null,
        unit_price_paise bigint not null,
        line_total_paise bigint not null,
        service_name_snapshot text not null,
        duration_minutes_snapshot integer not null
      );
      grant usage on schema public, auth to authenticated, anon;
      insert into auth.users values
        ('${USER_ID}', 'customer@example.test', '+919876543210'),
        ('${OTHER_USER_ID}', 'other@example.test', '+919876543211');
      insert into public.salons values
        ('${SALON_ID}', true, null),
        ('${OTHER_SALON_ID}', true, null);
      insert into public.service_categories values
        ('${CATEGORY_ID}', 'Hair Colour', 'hair-colour', true),
        ('${OTHER_CATEGORY_ID}', 'Inactive', 'inactive', false);
      insert into public.salon_website_settings values
        ('${SALON_ID}', 'hair_studio_color_bar', true),
        ('${OTHER_SALON_ID}', 'beauty_skin_spa', true);
      insert into public.services values
        ('${SERVICE_ID}', '${SALON_ID}', '${CATEGORY_ID}', 'Live Hair Service', 'Database description', 125000, 60, true),
        ('${OTHER_SERVICE_ID}', '${OTHER_SALON_ID}', '${CATEGORY_ID}', 'Foreign Service', '', 250000, 90, true),
        ('${SECOND_SERVICE_ID}', '${SALON_ID}', '${CATEGORY_ID}', 'Second Service', '', 75000, 30, true),
        ('52000000-0000-4000-8000-000000000004', '${SALON_ID}', '${OTHER_CATEGORY_ID}', 'Inactive Category Service', '', 1000, 10, true);
    `);

    await db.exec(phase161Sql);
    await db.exec(phase162Sql);
    await db.exec(phase164Sql);
    await db.exec(phase164Sql); // Phase 16.4 replacement is idempotent

    async function asUser(userId, query, params = []) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
      await db.exec('set role authenticated');
      return db.query(query, params);
    }

    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await db.exec('set role anon');
    const publicCatalog = await db.query(
      `select public.get_public_salon_service_catalog($1, $2) as result`,
      [SALON_ID, 'hair_studio_color_bar'],
    );
    assert.equal(publicCatalog.rows[0].result.salon_id, SALON_ID);
    assert.equal(publicCatalog.rows[0].result.template_key, 'hair_studio_color_bar');
    assert.equal(publicCatalog.rows[0].result.services.length, 2);
    assert.deepEqual(
      publicCatalog.rows[0].result.services.map((service) => service.id).sort(),
      [SERVICE_ID, SECOND_SERVICE_ID].sort(),
    );
    await assert.rejects(
      () => db.query(
        `select public.get_public_salon_service_catalog($1, $2)`,
        [SALON_ID, 'beauty_skin_spa'],
      ),
      /another active template/i,
    );

    const created = await asUser(
      USER_ID,
      `select public.create_customer_booking($1, $2::uuid[], $3::timestamptz, $4, $5) as result`,
      [SALON_ID, [SERVICE_ID, SECOND_SERVICE_ID], '2031-08-20T05:30:00.000Z', 'Customer note', '+919999999999'],
    );
    const result = created.rows[0].result;
    assert.equal(result.template_key, 'hair_studio_color_bar');
    assert.equal(result.duplicate, false);
    assert.equal(result.booking.customer_user_id, USER_ID);
    assert.equal(result.booking.salon_id, SALON_ID);
    assert.equal(Number(result.booking.total_paise), 200000);
    assert.equal(result.booking.status, 'pending');
    assert.equal(result.booking.booking_number, 'LIVE-DEFAULT');
    assert.equal(result.items.length, 2);
    assert.deepEqual(
      result.items.map((item) => item.service_id).sort(),
      [SERVICE_ID, SECOND_SERVICE_ID].sort(),
    );
    assert.deepEqual(
      result.items.map((item) => Number(item.duration_minutes_snapshot)).sort((a, b) => a - b),
      [30, 60],
    );
    assert.equal(
      new Date(result.booking.appointment_end).getTime() - new Date(result.booking.appointment_start).getTime(),
      90 * 60 * 1000,
    );

    const duplicateRetry = await asUser(
      USER_ID,
      `select public.create_customer_booking($1, $2::uuid[], $3::timestamptz, $4, $5) as result`,
      [SALON_ID, [SECOND_SERVICE_ID, SERVICE_ID], '2031-08-20T05:30:00.000Z', 'Retry note', '+919999999999'],
    );
    assert.equal(duplicateRetry.rows[0].result.duplicate, true);
    assert.equal(duplicateRetry.rows[0].result.booking.id, result.booking.id);
    assert.deepEqual(
      duplicateRetry.rows[0].result.items.map((item) => item.service_id).sort(),
      [SERVICE_ID, SECOND_SERVICE_ID].sort(),
    );

    const ownRows = await asUser(USER_ID, 'select id, customer_user_id from public.bookings');
    assert.equal(ownRows.rows.length, 1);
    const otherRows = await asUser(OTHER_USER_ID, 'select id, customer_user_id from public.bookings');
    assert.equal(otherRows.rows.length, 0);

    await assert.rejects(
      () => asUser(
        USER_ID,
        `select public.create_customer_booking($1, $2::uuid[], $3::timestamptz, null, null)`,
        [SALON_ID, [OTHER_SERVICE_ID], '2031-08-21T05:30:00.000Z'],
      ),
      /inactive or belong to another salon or template/i,
    );
    await assert.rejects(
      () => asUser(
        USER_ID,
        `select public.create_customer_booking($1, $2::uuid[], $3::timestamptz, null, null)`,
        [SALON_ID, ['52000000-0000-4000-8000-000000000004'], '2031-08-21T06:30:00.000Z'],
      ),
      /inactive or belong to another salon or template/i,
    );
    await assert.rejects(
      () => asUser(
        USER_ID,
        `select public.create_customer_booking($1, $2::uuid[], $3::timestamptz, null, $4)`,
        [SALON_ID, [SERVICE_ID], '2031-08-21T07:30:00.000Z', '123'],
      ),
      /valid phone/i,
    );
    await assert.rejects(
      () => asUser(
        USER_ID,
        `select public.create_customer_booking($1, $2::uuid[], $3::timestamptz, $4, null)`,
        [SALON_ID, [SERVICE_ID], '2031-08-21T08:30:00.000Z', 'x'.repeat(1001)],
      ),
      /1000 characters/i,
    );

    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await db.exec('set role anon');
    await assert.rejects(
      () => db.query(
        `select public.create_customer_booking($1, $2::uuid[], $3::timestamptz, null, null)`,
        [SALON_ID, [SERVICE_ID], '2031-08-22T05:30:00.000Z'],
      ),
      /log in|permission denied/i,
    );
  } finally {
    await db.close();
  }
});

console.log(`\n${tests}/${tests} offline Supabase booking guardrails passed.`);
console.log('Live migration application and authenticated insert/reload proof are intentionally not asserted here.');
