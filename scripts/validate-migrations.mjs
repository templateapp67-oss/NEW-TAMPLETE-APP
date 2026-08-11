import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const migrationsDir = join(root, 'supabase', 'migrations');
const migrationFiles = (await readdir(migrationsDir))
  .filter((name) => name.endsWith('.sql'))
  .sort();

assert.equal(migrationFiles.length, 15, 'expected exactly M01-M15');

const db = new PGlite({ extensions: { btree_gist, pgcrypto } });

const bootstrapSupabaseSchemas = async () => {
  await db.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
    end $$;

    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      phone text,
      raw_user_meta_data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;

    create schema if not exists storage;
    create table if not exists storage.buckets (
      id text primary key,
      name text not null unique,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    create table if not exists storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text not null references storage.buckets(id),
      name text not null,
      owner_id text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (bucket_id, name)
    );
    create or replace function storage.foldername(name text) returns text[]
      language sql immutable strict as $$ select string_to_array(name, '/') $$;

    grant usage on schema public, auth, storage to anon, authenticated, service_role;
  `);
};

await bootstrapSupabaseSchemas();

for (let pass = 1; pass <= 2; pass += 1) {
  let applied = 0;
  for (const file of migrationFiles) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    try {
      await db.exec(sql);
      applied += 1;
    } catch (error) {
      throw new Error(`migration pass ${pass} failed at ${file}: ${error.message}`, { cause: error });
    }
  }
  console.log(`Migration pass ${pass}: ${applied}/15 applied cleanly`);
}

const ids = {
  ownerA: '00000000-0000-4000-8000-0000000000a1',
  ownerB: '00000000-0000-4000-8000-0000000000b1',
  staffUserA: '00000000-0000-4000-8000-0000000000a2',
  businessA: '10000000-0000-4000-8000-0000000000a1',
  businessB: '10000000-0000-4000-8000-0000000000b1',
  serviceA: '20000000-0000-4000-8000-0000000000a1',
  serviceB: '20000000-0000-4000-8000-0000000000b1',
  staffA: '30000000-0000-4000-8000-0000000000a1',
  customerA: '40000000-0000-4000-8000-0000000000a1',
  customerB: '40000000-0000-4000-8000-0000000000b1',
  bookingA: '50000000-0000-4000-8000-0000000000a1',
};

await db.query(
  `insert into auth.users (id, email, phone, raw_user_meta_data) values
    ($1, 'owner-a@example.test', '+919000000001', '{"full_name":"Owner A"}'),
    ($2, 'owner-b@example.test', '+919000000002', '{"full_name":"Owner B"}'),
    ($3, 'staff-a@example.test', '+919000000003', '{"full_name":"Staff A"}')`,
  [ids.ownerA, ids.ownerB, ids.staffUserA],
);
await db.query(
  `insert into public.businesses (id, name, business_type, phone, whatsapp, email, created_by)
   values
    ($1, 'Jaipur Glow', 'beauty salon', '+911111111111', '+911111111111', 'hello@jaipur-glow.test', $2),
    ($3, 'Pink City Barber', 'barber', '+912222222222', '+912222222222', 'hello@pink-barber.test', $4)`,
  [ids.businessA, ids.ownerA, ids.businessB, ids.ownerB],
);
await db.query(
  `insert into public.services (id, business_id, name, price_paise, duration_minutes, short_description)
   values
    ($1, $2, 'Signature Facial', 120000, 60, 'Original service copy'),
    ($3, $4, 'Classic Cut', 50000, 30, 'Business B service')`,
  [ids.serviceA, ids.businessA, ids.serviceB, ids.businessB],
);
await db.query(
  `insert into public.staff_members (
     id, business_id, auth_user_id, full_name, primary_role, app_access_role,
     mobile, commission_percent, hide_mobile_public
   ) values ($1, $2, $3, 'Asha Artist', 'Senior beautician', 'service_provider', '+919999999999', 17.50, true)`,
  [ids.staffA, ids.businessA, ids.staffUserA],
);
await db.query(
  'insert into public.staff_services (staff_id, service_id) values ($1, $2)',
  [ids.staffA, ids.serviceA],
);
await db.query(
  `insert into public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
   select business_id, day, true, '09:00', '18:00'
   from unnest(array[$1::uuid, $2::uuid]) business_id
   cross join generate_series(0, 6) day`,
  [ids.businessA, ids.businessB],
);
await db.query(
  `insert into public.staff_schedules (staff_id, day_of_week, is_working, start_time, end_time)
   select $1, day, true, '09:00', '18:00' from generate_series(0, 6) day`,
  [ids.staffA],
);
await db.query(
  `insert into public.customers (id, business_id, full_name, mobile) values
    ($1, $2, 'Customer A', '+918000000001'),
    ($3, $4, 'Customer B', '+918000000002')`,
  [ids.customerA, ids.businessA, ids.customerB, ids.businessB],
);
await db.query(
  `insert into public.bookings (
     id, business_id, customer_id, service_id, staff_id, booking_reference,
     appointment_date, start_time, end_time, service_name_snapshot,
     service_price_paise, duration_minutes, advance_paise, remaining_paise
   ) values (
     $1, $2, $3, $4, $5, 'NXR-A001', current_date + 1, '10:00', '11:00',
     'Signature Facial', 120000, 60, 30000, 90000
   )`,
  [ids.bookingA, ids.businessA, ids.customerA, ids.serviceA, ids.staffA],
);
await db.query(
  `insert into public.website_content (business_id, hero_heading, tagline)
   values ($1, 'Glow in Jaipur', 'Website tagline')
   on conflict (business_id) do update set hero_heading = excluded.hero_heading, tagline = excluded.tagline`,
  [ids.businessA],
);

const setRole = async (role, userId = '') => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec(`set role ${role}`);
};
const resetRole = async () => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
};
const asRole = async (role, userId, callback) => {
  await setRole(role, userId);
  try {
    return await callback();
  } finally {
    await resetRole();
  }
};
const expectReject = async (callback, pattern) => {
  let error;
  try {
    await callback();
  } catch (caught) {
    error = caught;
  }
  assert.ok(error, 'expected operation to be rejected');
  assert.match(error.message, pattern);
};

let passed = 0;
const test = async (label, callback) => {
  await callback();
  passed += 1;
  console.log(`PASS ${label}`);
};

await test('A — multi-business RLS isolation', async () => {
  await asRole('authenticated', ids.ownerA, async () => {
    const businesses = await db.query('select id from public.businesses order by id');
    const services = await db.query('select business_id from public.services order by id');
    assert.deepEqual(businesses.rows.map((row) => row.id), [ids.businessA]);
    assert.deepEqual(services.rows.map((row) => row.business_id), [ids.businessA]);
  });
});

await test('B — one service record feeds the published website', async () => {
  await asRole('authenticated', ids.ownerA, async () => {
    await db.query("select public.publish_business_website($1, 'jaipur-glow')", [ids.businessA]);
    await db.query(
      "update public.services set short_description = 'AI-reviewed single-source copy' where id = $1",
      [ids.serviceA],
    );
  });
  const { rows } = await db.query("select public.get_public_website_by_slug('jaipur-glow') as site");
  assert.equal(rows[0].site.services.length, 1);
  assert.equal(rows[0].site.services[0].id, ids.serviceA);
  assert.equal(rows[0].site.services[0].short_description, 'AI-reviewed single-source copy');
});

await test('C — one staff record feeds internal assignment and public-safe output', async () => {
  const assignment = await db.query(
    'select staff_id from public.staff_services where service_id = $1',
    [ids.serviceA],
  );
  const site = await db.query("select public.get_public_website_by_slug('jaipur-glow') as site");
  assert.equal(assignment.rows[0].staff_id, ids.staffA);
  assert.equal(site.rows[0].site.staff[0].id, ids.staffA);
  await asRole('authenticated', ids.staffUserA, async () => {
    const assigned = await db.query('select id from public.services order by id');
    assert.deepEqual(assigned.rows.map((row) => row.id), [ids.serviceA]);
    await expectReject(
      () => db.query("update public.staff_members set app_access_role = 'owner_admin' where id = $1", [ids.staffA]),
      /only an owner_admin/i,
    );
  });
  const membership = await db.query(
    'select access_role from public.business_members where business_id = $1 and user_id = $2',
    [ids.businessA, ids.staffUserA],
  );
  assert.equal(membership.rows[0].access_role, 'service_provider');
});

await test('D — published website reflects live normalized updates without republish', async () => {
  await db.query("update public.businesses set tagline = 'Live synchronized tagline' where id = $1", [ids.businessA]);
  const { rows } = await db.query("select public.get_public_website_by_slug('jaipur-glow') as site");
  assert.equal(rows[0].site.business.tagline, 'Live synchronized tagline');
});

await test('E — ₹1,200 enforces ₹300 advance and ₹900 remaining', async () => {
  const advance = await db.query('select public.calculate_advance_paise(120000) as value');
  const booking = await db.query(
    'select service_price_paise, advance_paise, remaining_paise from public.bookings where id = $1',
    [ids.bookingA],
  );
  assert.equal(Number(advance.rows[0].value), 30000);
  assert.deepEqual(
    booking.rows.map((row) => [Number(row.service_price_paise), Number(row.advance_paise), Number(row.remaining_paise)]),
    [[120000, 30000, 90000]],
  );
});

await test('F — unverified payment cannot confirm a booking', async () => {
  await db.query("select (public.create_payment_order($1, 'order_A001')).id", [ids.bookingA]);
  await expectReject(
    () => db.query("select public.verify_payment('order_A001', 'pay_A001', 30000, 'upi', false)"),
    /signature was not verified/i,
  );
  const { rows } = await db.query('select booking_status from public.bookings where id = $1', [ids.bookingA]);
  assert.equal(rows[0].booking_status, 'pending_payment');
});

await test('G — verified payment confirms exactly once', async () => {
  await db.query("select public.verify_payment('order_A001', 'pay_A001', 30000, 'upi', true)");
  await db.query("select public.verify_payment('order_A001', 'pay_A001', 30000, 'upi', true)");
  const payments = await db.query("select count(*)::int as count from public.payments where provider_payment_id = 'pay_A001'");
  const activity = await db.query(
    "select count(*)::int as count from public.business_activity where event_type = 'payment_verified' and metadata ->> 'booking_id' = $1",
    [ids.bookingA],
  );
  const booking = await db.query('select booking_status from public.bookings where id = $1', [ids.bookingA]);
  assert.equal(payments.rows[0].count, 1);
  assert.equal(activity.rows[0].count, 1);
  assert.equal(booking.rows[0].booking_status, 'confirmed');
});

await test('H — overview and revenue RPCs reflect the same booking/payment', async () => {
  await asRole('authenticated', ids.ownerA, async () => {
    const overview = await db.query('select public.get_dashboard_overview($1) as value', [ids.businessA]);
    const revenue = await db.query('select public.get_payments_revenue($1) as value', [ids.businessA]);
    assert.equal(Number(overview.rows[0].value.upcoming_bookings), 1);
    assert.equal(Number(revenue.rows[0].value.verified_advance_paise), 30000);
    assert.equal(Number(revenue.rows[0].value.booking_value_paise), 120000);
  });
});

await test('I — archived catalog item keeps immutable booking history', async () => {
  await db.query("update public.services set status = 'archived', name = 'Renamed after booking', price_paise = 150000 where id = $1", [ids.serviceA]);
  const booking = await db.query(
    'select service_name_snapshot, service_price_paise, advance_paise, remaining_paise from public.bookings where id = $1',
    [ids.bookingA],
  );
  assert.deepEqual(
    [booking.rows[0].service_name_snapshot, Number(booking.rows[0].service_price_paise), Number(booking.rows[0].advance_paise), Number(booking.rows[0].remaining_paise)],
    ['Signature Facial', 120000, 30000, 90000],
  );
});

await test('J — onboarding progress and JSON draft resume independently', async () => {
  await db.query(
    "update public.onboarding_progress set current_step = 9, last_completed_step = 8 where business_id = $1",
    [ids.businessA],
  );
  await db.query(
    `update public.business_draft_state set draft = '{"appearance":"dark","pendingStep":9}'::jsonb where business_id = $1`,
    [ids.businessA],
  );
  const { rows } = await db.query(
    `select op.current_step, op.last_completed_step, ds.draft
     from public.onboarding_progress op
     join public.business_draft_state ds using (business_id)
     where op.business_id = $1`,
    [ids.businessA],
  );
  assert.equal(rows[0].current_step, 9);
  assert.equal(rows[0].last_completed_step, 8);
  assert.equal(rows[0].draft.appearance, 'dark');
});

await test('K — slug loads only the published business', async () => {
  const published = await db.query("select public.get_public_website_by_slug('jaipur-glow') as site");
  const draft = await db.query("select public.get_public_website_by_slug('pink-city-barber') as site");
  assert.equal(published.rows[0].site.business.id, ids.businessA);
  assert.equal(draft.rows[0].site, null);
});

await test('L — anonymous access exposes only published/public-safe data', async () => {
  await db.query(
    `insert into storage.objects (bucket_id, name) values
      ('business-media', $1 || '/gallery/public-a.webp'),
      ('business-media', $2 || '/gallery/draft-b.webp')`,
    [ids.businessA, ids.businessB],
  );
  await asRole('anon', '', async () => {
    const { rows } = await db.query("select public.get_public_website_by_slug('jaipur-glow') as site");
    const serialized = JSON.stringify(rows[0].site);
    for (const privateField of [
      'commission_percent', 'app_access_role', 'access_role', 'created_by',
      'provider_payment_id', 'verification_status', 'staff_permissions',
    ]) {
      assert.equal(serialized.includes(privateField), false, `public payload leaked ${privateField}`);
    }
    assert.equal(Object.hasOwn(rows[0].site.staff[0], 'mobile'), false);

    const publicObjects = await db.query('select name from storage.objects order by name');
    assert.deepEqual(publicObjects.rows.map((row) => row.name), [`${ids.businessA}/gallery/public-a.webp`]);
    await db.query(
      `insert into public.website_events (business_id, event_type, visitor_token)
       values ($1, 'page_view', 'visitor-a')`,
      [ids.businessA],
    );
    await expectReject(
      () => db.query(
        `insert into public.website_events (business_id, event_type, visitor_token)
         values ($1, 'page_view', 'visitor-b')`,
        [ids.businessB],
      ),
      /row-level security/i,
    );
    await expectReject(() => db.query('select * from public.payments'), /permission denied/i);
  });
});

assert.equal(passed, 12);
console.log(`Functional tests: ${passed}/12 passed`);
await db.close();
