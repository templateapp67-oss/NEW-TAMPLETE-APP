import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import {
  SERVICES_BY_THEME,
  SUGGESTED_SERVICE_ALIASES,
  SUGGESTED_SERVICE_NAMES,
  THEME_CATEGORIES,
  THEME_LABELS,
} from '../src/lib/themeServices.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const migrationsDir = join(root, 'supabase', 'migrations');
const migrationFiles = (await readdir(migrationsDir))
  .filter((name) => name.endsWith('.sql'))
  .sort();

assert.equal(migrationFiles.length, 18, 'expected exactly M01-M18');

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
  console.log(`Migration pass ${pass}: ${applied}/18 applied cleanly`);
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
  themeA: '60000000-0000-4000-8000-0000000000a1',
  themeB: '60000000-0000-4000-8000-0000000000b1',
  categoryA: '70000000-0000-4000-8000-0000000000a1',
  categoryB: '70000000-0000-4000-8000-0000000000b1',
  predefinedA: '80000000-0000-4000-8000-0000000000a1',
  predefinedB: '80000000-0000-4000-8000-0000000000b1',
  predefinedInactive: '80000000-0000-4000-8000-0000000000a2',
  savedPredefinedA: '90000000-0000-4000-8000-0000000000a1',
  savedManualA: '90000000-0000-4000-8000-0000000000a2',
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

await test('M — theme catalog enforces valid same-theme relationships without touching business services', async () => {
  const catalogCounts = await db.query(`
    select
      (select count(*)::int from public.themes) as themes,
      (select count(*)::int from public.service_categories) as categories,
      (select count(*)::int from public.predefined_services) as predefined
  `);
  assert.deepEqual(catalogCounts.rows[0], { themes: 5, categories: 17, predefined: 78 });

  const themeRows = await db.query(
    `select id, theme_id from public.themes
     where theme_id in ('barber_mens_grooming', 'hair_studio_color_bar')`,
  );
  ids.themeA = themeRows.rows.find((row) => row.theme_id === 'barber_mens_grooming').id;
  ids.themeB = themeRows.rows.find((row) => row.theme_id === 'hair_studio_color_bar').id;

  const categoryRows = await db.query(
    `select id, theme_id, name from public.service_categories
     where (theme_id = $1 and name = 'Haircuts')
        or (theme_id = $2 and name = 'Styling & Cuts')`,
    [ids.themeA, ids.themeB],
  );
  ids.categoryA = categoryRows.rows.find((row) => row.theme_id === ids.themeA).id;
  ids.categoryB = categoryRows.rows.find((row) => row.theme_id === ids.themeB).id;

  const predefinedRow = await db.query(
    `select id from public.predefined_services
     where theme_id = $1 and category_id = $2 and name = 'Skin Fade'`,
    [ids.themeA, ids.categoryA],
  );
  ids.predefinedA = predefinedRow.rows[0].id;

  const businessServicesBefore = await db.query('select count(*)::int as count from public.services');

  await expectReject(
    () => db.query(
      `insert into public.service_categories (theme_id, name)
       values ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'Orphan Category')`,
    ),
    /foreign key|violates/i,
  );
  await expectReject(
    () => db.query(
      `insert into public.predefined_services (theme_id, category_id, name)
       values ($1, $2, 'Cross-theme Service')`,
      [ids.themeB, ids.categoryA],
    ),
    /foreign key|violates/i,
  );
  await expectReject(
    () => db.query(
      `insert into public.themes (theme_id, name)
       values ('barber_mens_grooming', 'Duplicate Stable ID')`,
    ),
    /unique|duplicate/i,
  );
  await expectReject(
    () => db.query(
      `insert into public.service_categories (theme_id, name)
       values ($1, 'Haircuts')`,
      [ids.themeA],
    ),
    /unique|duplicate/i,
  );
  await expectReject(
    () => db.query(
      `insert into public.predefined_services (theme_id, category_id, name)
       values ($1, $2, 'Skin Fade')`,
      [ids.themeA, ids.categoryA],
    ),
    /unique|duplicate/i,
  );
  await expectReject(
    () => db.query('delete from public.themes where id = $1', [ids.themeA]),
    /foreign key|violates/i,
  );

  await db.query(
    `update public.service_categories
     set sort_order = sort_order, updated_at = '2000-01-01T00:00:00Z'
     where id = $1`,
    [ids.categoryA],
  );
  const updatedCategory = await db.query(
    `select sort_order, updated_at > '2000-01-01T00:00:00Z'::timestamptz as timestamp_refreshed
     from public.service_categories where id = $1`,
    [ids.categoryA],
  );
  assert.deepEqual(updatedCategory.rows[0], { sort_order: 0, timestamp_refreshed: true });

  const businessServicesAfter = await db.query('select count(*)::int as count from public.services');
  assert.equal(businessServicesAfter.rows[0].count, businessServicesBefore.rows[0].count);
});

await test('N — clients read only the active theme catalog and cannot mutate it', async () => {
  await db.query('update public.themes set is_active = false where id = $1', [ids.themeB]);
  await db.query('update public.predefined_services set is_active = false where id = $1', [ids.predefinedA]);

  await asRole('anon', '', async () => {
    const themes = await db.query('select theme_id from public.themes order by sort_order');
    const categories = await db.query('select count(*)::int as count from public.service_categories');
    const services = await db.query('select count(*)::int as count from public.predefined_services');
    assert.deepEqual(
      themes.rows.map((row) => row.theme_id),
      ['barber_mens_grooming', 'beauty_skin_spa', 'family_full_service', 'nail_lash_studio'],
    );
    assert.equal(categories.rows[0].count, 14);
    assert.equal(services.rows[0].count, 60);
    await expectReject(
      () => db.query("insert into public.themes (theme_id, name) values ('client-write', 'Blocked')"),
      /permission denied/i,
    );
  });

  await db.query('update public.themes set is_active = true where id = $1', [ids.themeB]);
  await db.query('update public.predefined_services set is_active = true where id = $1', [ids.predefinedA]);
});

await test('O — saved services preserve custom rows and enforce exact catalog provenance', async () => {
  const legacyRows = await db.query(
    `select
       count(*)::int as total,
       count(*) filter (
         where theme_id is null
           and category_id is null
           and predefined_service_id is null
       )::int as safely_unlinked
     from public.services
     where id in ($1, $2)`,
    [ids.serviceA, ids.serviceB],
  );
  assert.deepEqual(legacyRows.rows[0], { total: 2, safely_unlinked: 2 });

  await db.query(
    `insert into public.services (
       id, business_id, theme_id, category_id, predefined_service_id,
       name, category, price_paise, duration_minutes, short_description,
       is_featured, status, display_order
     ) values (
       $1, $2, $3, $4, $5,
       'Saved Curated Service', 'Preserved display category', 175000, 75,
       'Owner-edited saved description', true, 'active', 4
     )`,
    [
      ids.savedPredefinedA, ids.businessA, ids.themeA, ids.categoryA,
      ids.predefinedA,
    ],
  );
  await db.query(
    `insert into public.services (
       id, business_id, name, category, price_paise, duration_minutes,
       short_description, status
     ) values (
       $1, $2, 'Manual Custom Service', 'Owner custom category', 99000, 45,
       'Custom service remains unlinked', 'inactive'
     )`,
    [ids.savedManualA, ids.businessA],
  );

  const saved = await db.query(
    `select business_id, theme_id, category_id, predefined_service_id,
            name, category, price_paise, duration_minutes, short_description,
            is_featured, status::text, display_order
     from public.services where id = $1`,
    [ids.savedPredefinedA],
  );
  assert.deepEqual(
    {
      ...saved.rows[0],
      price_paise: Number(saved.rows[0].price_paise),
    },
    {
      business_id: ids.businessA,
      theme_id: ids.themeA,
      category_id: ids.categoryA,
      predefined_service_id: ids.predefinedA,
      name: 'Saved Curated Service',
      category: 'Preserved display category',
      price_paise: 175000,
      duration_minutes: 75,
      short_description: 'Owner-edited saved description',
      is_featured: true,
      status: 'active',
      display_order: 4,
    },
  );

  const manual = await db.query(
    `select business_id, theme_id, category_id, predefined_service_id,
            name, category, price_paise, duration_minutes, short_description,
            status::text
     from public.services where id = $1`,
    [ids.savedManualA],
  );
  assert.deepEqual(
    {
      ...manual.rows[0],
      price_paise: Number(manual.rows[0].price_paise),
    },
    {
      business_id: ids.businessA,
      theme_id: null,
      category_id: null,
      predefined_service_id: null,
      name: 'Manual Custom Service',
      category: 'Owner custom category',
      price_paise: 99000,
      duration_minutes: 45,
      short_description: 'Custom service remains unlinked',
      status: 'inactive',
    },
  );

  await expectReject(
    () => db.query(
      `insert into public.services (
         business_id, theme_id, category_id, predefined_service_id,
         name, price_paise, duration_minutes
       ) values ($1, $2, $3, $4, 'Wrong Theme Link', 10000, 15)`,
      [ids.businessA, ids.themeB, ids.categoryB, ids.predefinedA],
    ),
    /foreign key|violates/i,
  );
  await expectReject(
    () => db.query(
      `insert into public.services (
         business_id, theme_id, category_id, predefined_service_id,
         name, price_paise, duration_minutes
       ) values ($1, $2, $3, $4, 'Wrong Category Link', 10000, 15)`,
      [ids.businessA, ids.themeA, ids.categoryB, ids.predefinedA],
    ),
    /foreign key|violates/i,
  );
  await expectReject(
    () => db.query(
      `insert into public.services (
         business_id, predefined_service_id, name, price_paise, duration_minutes
       ) values ($1, $2, 'Incomplete Provenance', 10000, 15)`,
      [ids.businessA, ids.predefinedA],
    ),
    /check constraint|violates/i,
  );
  await expectReject(
    () => db.query(
      `update public.services
       set theme_id = $1, category_id = $2
       where id = $3`,
      [ids.themeB, ids.categoryB, ids.savedPredefinedA],
    ),
    /foreign key|violates/i,
  );
  await expectReject(
    () => db.query('delete from public.predefined_services where id = $1', [ids.predefinedA]),
    /foreign key|violates/i,
  );

  await asRole('authenticated', ids.ownerA, async () => {
    const rows = await db.query(
      'select id from public.services where id in ($1, $2) order by id',
      [ids.savedPredefinedA, ids.savedManualA],
    );
    assert.deepEqual(rows.rows.map((row) => row.id), [ids.savedPredefinedA, ids.savedManualA]);
  });
  await asRole('authenticated', ids.ownerB, async () => {
    const rows = await db.query(
      'select id from public.services where id in ($1, $2)',
      [ids.savedPredefinedA, ids.savedManualA],
    );
    assert.equal(rows.rows.length, 0);
  });
});

await test('P — five-theme seed exactly matches the Phase 2–6 application datasets', async () => {
  const seededThemeIds = [
    'barber_mens_grooming',
    'hair_studio_color_bar',
    'beauty_skin_spa',
    'family_full_service',
    'nail_lash_studio',
  ];

  const themes = await db.query(
    `select theme_id, name, description, target_audience, ui_config,
            sort_order, is_active
     from public.themes
     order by sort_order, theme_id`,
  );
  assert.deepEqual(themes.rows.map((row) => row.theme_id), seededThemeIds);
  themes.rows.forEach((row, sortOrder) => {
    assert.equal(row.name, THEME_LABELS[row.theme_id]);
    assert.equal(row.sort_order, sortOrder);
    assert.equal(row.is_active, true);
    assert.ok(row.description.length > 0);
    assert.ok(row.target_audience.length > 0);
    assert.equal(row.ui_config.tokens.id, row.theme_id);
  });

  let expectedCategoryCount = 0;
  let expectedServiceCount = 0;
  let expectedSuggestedCount = 0;

  for (const themeId of seededThemeIds) {
    const categories = await db.query(
      `select c.name, c.sort_order
       from public.service_categories c
       join public.themes t on t.id = c.theme_id
       where t.theme_id = $1
       order by c.sort_order, c.name`,
      [themeId],
    );
    const expectedCategories = THEME_CATEGORIES[themeId].map((name, sortOrder) => ({
      name,
      sort_order: sortOrder,
    }));
    assert.deepEqual(categories.rows, expectedCategories);
    expectedCategoryCount += expectedCategories.length;

    const aliases = SUGGESTED_SERVICE_ALIASES[themeId] ?? {};
    const suggestionByCanonicalName = new Map(
      SUGGESTED_SERVICE_NAMES[themeId].map((suggestedLabel, suggestedSortOrder) => [
        aliases[suggestedLabel] ?? suggestedLabel,
        { suggestedLabel, suggestedSortOrder },
      ]),
    );
    const expectedServices = SERVICES_BY_THEME[themeId].map((service, sortOrder) => {
      const suggestion = suggestionByCanonicalName.get(service.name);
      return {
        name: service.name,
        category: service.category,
        description: service.description,
        sort_order: sortOrder,
        is_suggested: Boolean(suggestion),
        suggested_label: suggestion?.suggestedLabel ?? null,
        suggested_sort_order: suggestion?.suggestedSortOrder ?? null,
        is_active: true,
      };
    });
    const services = await db.query(
      `select ps.name, c.name as category, ps.description, ps.sort_order,
              ps.is_suggested, ps.suggested_label,
              ps.suggested_sort_order, ps.is_active
       from public.predefined_services ps
       join public.themes t on t.id = ps.theme_id
       join public.service_categories c on c.id = ps.category_id
       where t.theme_id = $1
       order by ps.sort_order, ps.name`,
      [themeId],
    );
    assert.deepEqual(services.rows, expectedServices);
    expectedServiceCount += expectedServices.length;

    const suggestedLabels = services.rows
      .filter((service) => service.is_suggested)
      .sort((left, right) => left.suggested_sort_order - right.suggested_sort_order)
      .map((service) => service.suggested_label);
    assert.deepEqual(suggestedLabels, SUGGESTED_SERVICE_NAMES[themeId]);
    expectedSuggestedCount += suggestedLabels.length;
  }

  const totals = await db.query(`
    select
      (select count(*)::int from public.service_categories) as categories,
      (select count(*)::int from public.predefined_services) as predefined,
      (select count(*)::int from public.predefined_services where is_suggested) as suggested,
      (select count(distinct (theme_id, name))::int from public.service_categories) as unique_categories,
      (select count(distinct (theme_id, name))::int from public.predefined_services) as unique_predefined
  `);
  assert.deepEqual(totals.rows[0], {
    categories: expectedCategoryCount,
    predefined: expectedServiceCount,
    suggested: expectedSuggestedCount,
    unique_categories: expectedCategoryCount,
    unique_predefined: expectedServiceCount,
  });
  assert.deepEqual(
    { expectedCategoryCount, expectedServiceCount, expectedSuggestedCount },
    { expectedCategoryCount: 17, expectedServiceCount: 78, expectedSuggestedCount: 30 },
  );
});

assert.equal(passed, 16);
console.log(`Functional tests: ${passed}/16 passed`);
await db.close();
