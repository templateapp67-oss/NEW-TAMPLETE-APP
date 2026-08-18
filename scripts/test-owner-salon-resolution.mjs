/**
 * OWNER DASHBOARD — LIVE-SCHEMA RESOLUTION + FULL ACTIVATION ACCEPTANCE.
 *
 * The Phase 17.x suites verify the dashboard with an INJECTED context
 * loader; they never exercise the production resolution path against a
 * database. This suite fills exactly that gap: it runs the REAL
 * `resolveOwnerSalonId()` / `loadOwnerDashboardContext()` / `<OwnerDashboard />`
 * (no props, no test seams) against the highest-fidelity offline model of
 * the LIVE legacy Supabase schema available:
 *
 *   • REAL PostgreSQL (PGlite) with the live project's tables —
 *     `auth.users`, `organizations`, `organization_members`, `salons` —
 *     RLS enabled, `auth.uid()` honoured, `anon`/`authenticated` roles,
 *     and (per scenario) the existing `nexora_owner_salon_ids()` helper.
 *   • The REAL `@supabase/supabase-js` browser client with its HTTP layer
 *     redirected into PGlite (auth + REST table reads + RPC), so the app's
 *     own `supabaseClient.ts` / `ownerSalon.ts` / `ownerDashboard.ts` run
 *     unmodified.
 *
 * The regression this guards: an authenticated owner whose salon IS linked
 * through organization_members → salons.organization_id must never see
 * "Your account is not linked to a salon." because a lookup query used the
 * wrong relationship or swallowed a failure as "no rows".
 */
import assert from 'node:assert/strict';

/* ------------------------------------------------------------------ */
/* jsdom first — real React components are mounted later               */
/* ------------------------------------------------------------------ */
const { JSDOM } = await import('jsdom');
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
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.matchMedia = () => ({
  matches: false, addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, dispatchEvent() { return false; },
});
dom.window.matchMedia = globalThis.matchMedia;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
globalThis.HTMLElement.prototype.scrollIntoView = dom.window.HTMLElement.prototype.scrollIntoView;

/* Env BEFORE the app modules read them at import time. */
process.env.VITE_SUPABASE_URL = 'http://pglite.local';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

const { PGlite } = await import('@electric-sql/pglite');
const React = (await import('react')).default;
const { render, cleanup, act, fireEvent } = await import('@testing-library/react');

const { resolveOwnerSalonId } = await import('../src/lib/ownerSalon.ts');
const { loadOwnerDashboardContext } = await import('../src/lib/ownerDashboard.ts');
const { supabase } = await import('../src/lib/supabaseClient.ts');
const { PAYMENT_STORE_KEY, PAYMENT_STORE_VERSION } = await import('../src/lib/siteBookingPayment.ts');
const { localDateKey, salonNow } = await import('../src/lib/salonStatus.ts');
const OwnerDashboard = (await import('../src/components/OwnerDashboard.tsx')).default;

/* ------------------------------------------------------------------ */
/* IDs — real uuids for this fixture database only (never in app code) */
/* ------------------------------------------------------------------ */
const OWNER_A = '00000000-0000-4000-8000-0000000000a1';
const OWNER_B = '00000000-0000-4000-8000-0000000000b1';
const NO_SALON_USER = '00000000-0000-4000-8000-0000000000c1';
const STAFF_USER = '00000000-0000-4000-8000-0000000000d1';
const ORG_A = '20000000-0000-4000-8000-0000000000a1';
const ORG_B = '20000000-0000-4000-8000-0000000000b1';
const ORG_C = '20000000-0000-4000-8000-0000000000c1';
const SALON_A = '30000000-0000-4000-8000-0000000000a1';
const SALON_A2 = '30000000-0000-4000-8000-0000000000a2';
const SALON_B = '30000000-0000-4000-8000-0000000000b1';
const SALON_DELETED = '30000000-0000-4000-8000-0000000000d1';

/* ------------------------------------------------------------------ */
/* Legacy live schema                                                  */
/* ------------------------------------------------------------------ */
const SCHEMA = `
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, created_at timestamptz not null default now());
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- The EXISTING membership table: user -> organization, role + status.
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- The EXISTING salon table. NOTE: salons and organization_members are only
-- related THROUGH organizations.organization_id — there is no direct FK, so
-- PostgREST cannot embed one under the other (no junction FKs either).
create table public.salons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  name text,
  slug text,
  address text,
  city text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.salons enable row level security;

-- Realistic live policies: a member reads their OWN membership rows…
create policy org_members_own_select on public.organization_members
  for select to authenticated using (user_id = auth.uid());
-- …and may read salons belonging to organizations they are an active member of.
create policy salons_tenant_select on public.salons
  for select to authenticated using (
    deleted_at is null
    and organization_id in (
      select m.organization_id from public.organization_members m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  );

grant select on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select on public.salons to authenticated;
grant select, insert, update, delete on public.organizations, public.organization_members, public.salons to service_role;
`;

const HELPER_REAL = `
create or replace function public.nexora_owner_salon_ids() returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(s.id), '{}'::uuid[])
  from public.salons s
  join public.organization_members m on m.organization_id = s.organization_id
  where m.user_id = auth.uid() and m.role = 'owner' and m.status = 'active'
    and s.deleted_at is null
$$;
grant execute on function public.nexora_owner_salon_ids() to authenticated;
`;

/** A helper that EXISTS but always answers empty — models a broken/stale one. */
const HELPER_EMPTY = `
create or replace function public.nexora_owner_salon_ids() returns uuid[]
language sql stable security definer set search_path = public as $$
  select '{}'::uuid[]
$$;
grant execute on function public.nexora_owner_salon_ids() to authenticated;
`;

const SEED = `
insert into auth.users (id, email) values
  ('${OWNER_A}', 'owner-a@test.test'),
  ('${OWNER_B}', 'owner-b@test.test'),
  ('${NO_SALON_USER}', 'no-salon@test.test'),
  ('${STAFF_USER}', 'staff@test.test');

insert into public.organizations (id, name) values
  ('${ORG_A}', 'Org A'),
  ('${ORG_B}', 'Org B'),
  ('${ORG_C}', 'Org C');

-- Owner A owns org A's salon; also a STAFF membership in org B (must not
-- resolve org B's salon), and an INVITED owner membership in org C.
insert into public.organization_members (organization_id, user_id, role, status) values
  ('${ORG_A}', '${OWNER_A}', 'owner', 'active'),
  ('${ORG_B}', '${OWNER_A}', 'staff', 'active'),
  ('${ORG_C}', '${OWNER_A}', 'owner', 'invited'),
  ('${ORG_B}', '${OWNER_B}', 'owner', 'active'),
  ('${ORG_A}', '${STAFF_USER}', 'staff', 'active');

insert into public.salons (id, organization_id, name, slug, address, city, is_active, deleted_at) values
  ('${SALON_A}', '${ORG_A}', 'Glow and Go Kota', 'glow-and-go-kota', '12 MG Road', 'Kota', true, null),
  ('${SALON_B}', '${ORG_B}', 'Blunt Studio Delhi', 'blunt-studio', '5 Block L', 'New Delhi', true, null),
  ('${SALON_DELETED}', '${ORG_C}', 'Soft Deleted Salon', 'soft-deleted', '1 Old St', 'Jaipur', true, now());
`;

/* ------------------------------------------------------------------ */
/* supabase-js → PGlite bridge (auth + REST + RPC)                     */
/* ------------------------------------------------------------------ */
function jsonBody(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fakeJwt(uid) {
  // auth-js only DECODES the token client-side; the bridge never validates it.
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return [
    b64({ alg: 'none', typ: 'JWT' }),
    b64({ sub: uid, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }),
    'sig',
  ].join('.');
}

function userJson(uid) {
  return {
    id: uid,
    email: 'owner@test.test',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  };
}

function sessionJson(uid) {
  return {
    access_token: fakeJwt(uid),
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: userJson(uid),
  };
}

function parseInValues(raw) {
  const inner = raw.replace(/^in\.\(/, '').replace(/\)$/, '');
  return inner
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => v.replace(/^"|"$/g, ''));
}

async function createLiveHarness({ helper, hideOrgMembers } = {}) {
  const db = new PGlite();
  await db.exec(SCHEMA);
  if (helper === 'real') await db.exec(HELPER_REAL);
  if (helper === 'empty') await db.exec(HELPER_EMPTY);
  if (hideOrgMembers) {
    // Live-divergence model: organization_members exists and is GRANTed,
    // but has NO readable RLS policy — PostgREST silently returns [] for
    // every read (RLS filters all rows, no error).
    await db.exec('drop policy if exists org_members_own_select on public.organization_members;');
  }
  await db.exec(SEED);

  const bridge = {
    uid: '',
    role: 'anon',
    /** Executed SQL log (for asserting the user_id filter is real). */
    sql: [],
    /** Tables whose reads must fail with 42501 (grant-layer denial). */
    deniedTables: new Set(),
  };

  let chain = Promise.resolve();
  const serialize = (task) => {
    const run = chain.then(task);
    chain = run.catch(() => {});
    return run;
  };

  const runAs = async (role, uid, sql, params = []) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
    await db.exec(`set role ${role}`);
    try {
      return await db.query(sql, params);
    } finally {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input?.url ?? String(input));
    const method = (init.method ?? 'GET').toUpperCase();

    /* ---------------- auth ---------------- */
    if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
      return Promise.resolve(jsonBody(sessionJson(bridge.uid)));
    }
    if (url.pathname === '/auth/v1/user' && method === 'GET') {
      if (!bridge.uid) {
        return Promise.resolve(jsonBody({ message: 'no session' }, 401));
      }
      return Promise.resolve(jsonBody(userJson(bridge.uid)));
    }
    if (url.pathname === '/auth/v1/logout') {
      return Promise.resolve(jsonBody({}));
    }

    /* ---------------- rpc ---------------- */
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-zA-Z0-9_]+)$/);
    if (rpc) {
      const fn = rpc[1];
      return serialize(async () => {
        try {
          const result = await runAs(bridge.role || 'anon', bridge.uid, `select public.${fn}() as data`);
          return jsonBody(result.rows[0]?.data ?? null);
        } catch (error) {
          if (/function .* does not exist/i.test(error.message)) {
            return jsonBody({
              code: 'PGRST202',
              message: `Could not find the function public.${fn} without parameters in the schema cache`,
              details: null,
              hint: null,
            }, 404);
          }
          return jsonBody({ code: error.code ?? 'P0001', message: error.message }, 400);
        }
      });
    }

    /* ---------------- table GET ---------------- */
    const table = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (table && method === 'GET') {
      return serialize(async () => {
        const name = table[1];
        if (bridge.deniedTables.has(name)) {
          return jsonBody({ code: '42501', message: `permission denied for table ${name}` }, 400);
        }
        const selectParam = url.searchParams.get('select') ?? '*';
        if (selectParam.includes('(')) {
          // Realistic live answer: no direct FK between salons and
          // organization_members, so the embedded join cannot exist.
          return jsonBody({
            code: 'PGRST200',
            message: 'Could not find a relationship between salons and organization_members in the schema cache',
            details: null,
            hint: null,
          }, 400);
        }
        const columns = selectParam.split(',').map((c) => c.trim()).filter((c) => /^\w+$/.test(c));
        if (columns.length === 0) columns.push('*');

        const where = [];
        const params = [];
        for (const [key, value] of url.searchParams.entries()) {
          if (key === 'select') continue;
          if (!/^\w+(\.\w+)?$/.test(key)) continue;
          const column = key.includes('.') ? null : key; // embedded filters cannot occur here
          if (!column) continue;
          if (value.startsWith('eq.')) {
            params.push(value.slice(3));
            where.push(`${column} = $${params.length}`);
          } else if (value.startsWith('in.(')) {
            const values = parseInValues(value);
            params.push(values);
            where.push(`${column} = ANY($${params.length}::uuid[])`);
          } else if (value === 'is.null') {
            where.push(`${column} is null`);
          }
        }

        const sql = `select ${columns.join(', ')} from public.${name}`
          + (where.length ? ` where ${where.join(' and ')}` : '')
          + ' limit 1000';
        bridge.sql.push(sql);
        try {
          const result = await runAs(bridge.role || 'anon', bridge.uid, sql, params);
          return jsonBody(result.rows);
        } catch (error) {
          return jsonBody({ code: error.code ?? 'P0001', message: error.message }, 400);
        }
      });
    }

    return Promise.resolve(jsonBody({ message: `Unexpected request: ${url.pathname}` }, 404));
  };

  return {
    bridge,
    async signIn(uid) {
      bridge.uid = uid;
      bridge.role = 'authenticated';
      assert.ok(supabase, 'supabase client must exist');
      const { data, error } = await supabase.auth.setSession({
        access_token: fakeJwt(uid),
        refresh_token: 'refresh-token',
      });
      assert.ok(!error, `setSession failed: ${error?.message}`);
      assert.equal(data.session?.user?.id, uid, 'bridge session user mismatch');
    },
    async signOut() {
      bridge.uid = '';
      bridge.role = 'anon';
      await supabase.auth.signOut();
    },
    admin(sql, params = []) {
      return runAs('service_role', '', sql, params);
    },
    async close() {
      globalThis.fetch = originalFetch;
      await db.close();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */
let passed = 0;
let failed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    failures.push({ name, error });
    console.error(`  ✗ ${name}\n    ${String(error.message).split('\n').join('\n    ')}`);
  } finally {
    // Always detach mounted trees so one failure cannot leak into the next
    // test's queries.
    await act(async () => { cleanup(); });
  }
}
function section(title) {
  console.log(`\n■ ${title}`);
}

async function withHarness(options, fn) {
  const harness = await createLiveHarness(options);
  try {
    await fn(harness);
  } finally {
    await harness.close();
  }
}

/* ================================================================== */
section('1 · Owner → salon resolution against the live schema');

await test('helper MISSING (live regression case): linked owner still resolves via organization_members → salons.organization_id', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'resolved', `expected resolved, got ${JSON.stringify(resolution)}`);
    assert.equal(resolution.salonId, SALON_A);
    // The membership query must carry the session user's id filter.
    const membershipQuery = h.bridge.sql.find((s) => s.includes('organization_members'));
    assert.ok(membershipQuery, 'organization_members must be queried directly');
    assert.match(membershipQuery, /user_id = \$1/);
    assert.match(membershipQuery, /role = \$2/);
    assert.match(membershipQuery, /status = \$3/);
  });
});

await test('full dashboard context loads the real salon row (name, slug, city, active)', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    const context = await loadOwnerDashboardContext();
    assert.equal(context.access, 'authorized');
    assert.equal(context.salon?.id, SALON_A);
    assert.equal(context.salon?.organizationId, ORG_A);
    assert.equal(context.salon?.name, 'Glow and Go Kota');
    assert.equal(context.salon?.slug, 'glow-and-go-kota');
    assert.equal(context.salon?.city, 'Kota');
    assert.equal(context.salon?.isActive, true);
  });
});

await test('helper PRESENT and healthy: resolution uses it and matches the chain', async () => {
  await withHarness({ helper: 'real' }, async (h) => {
    await h.signIn(OWNER_A);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'resolved');
    assert.equal(resolution.salonId, SALON_A);
  });
});

await test('helper PRESENT but answering empty: real membership is cross-checked before claiming "not linked"', async () => {
  await withHarness({ helper: 'empty' }, async (h) => {
    await h.signIn(OWNER_A);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'resolved', `expected resolved, got ${JSON.stringify(resolution)}`);
    assert.equal(resolution.salonId, SALON_A);
  });
});

await test('another owner resolves ONLY their own salon (tenant isolation, RLS + explicit user filter)', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_B);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'resolved');
    assert.equal(resolution.salonId, SALON_B);
    const context = await loadOwnerDashboardContext();
    assert.equal(context.salon?.name, 'Blunt Studio Delhi');
  });
});

await test('staff membership / invited owner membership never resolve a salon', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(STAFF_USER);
    assert.equal((await resolveOwnerSalonId()).status, 'no-membership');
    // Owner A's STAFF (org B) + INVITED (org C) rows must not resolve either.
    await h.signIn(OWNER_A);
    // (Owner A resolves org A only — covered above; here remove the org A row.)
    await h.admin(`delete from public.organization_members where organization_id = '${ORG_A}'`);
    const after = await resolveOwnerSalonId();
    assert.equal(after.status, 'no-membership', `staff/invited rows leaked a salon: ${JSON.stringify(after)}`);
  });
});

await test('genuinely unlinked account with an UNVERIFIABLE table is never blamed with "not linked"', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(NO_SALON_USER);
    const resolution = await resolveOwnerSalonId();
    // Zero rows visible anywhere for this session: RLS may be hiding the
    // table, so absence cannot be proven — the resolution must be
    // `unverifiable`, never a false "no membership".
    assert.equal(resolution.status, 'unverifiable');
    const context = await loadOwnerDashboardContext();
    assert.equal(context.access, 'unverifiable');
    assert.equal(context.salon, null);
  });
});

await test('LIVE DIVERGENCE — helper missing + membership table hidden by RLS: a LINKED owner is never told "not linked"', async () => {
  await withHarness({ helper: 'none', hideOrgMembers: true }, async (h) => {
    await h.signIn(OWNER_A);
    const resolution = await resolveOwnerSalonId();
    // Owner A HAS a real organization_members (owner, active) row and salon
    // A, but the authenticated role cannot read the table (RLS silently
    // returns []). The old code turned this into no-membership — the false
    // "Your account is not linked to a salon." screen. It must now be
    // `unverifiable` (retryable, honest), never `no-membership`.
    assert.equal(resolution.status, 'unverifiable', `got ${JSON.stringify(resolution)}`);
    const context = await loadOwnerDashboardContext();
    assert.equal(context.access, 'unverifiable');
    assert.equal(context.salon, null);
  });
});

await test('LIVE DIVERGENCE — helper present-but-empty + hidden membership table: still never "not linked"', async () => {
  await withHarness({ helper: 'empty', hideOrgMembers: true }, async (h) => {
    await h.signIn(OWNER_A);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'unverifiable', `got ${JSON.stringify(resolution)}`);
  });
});

await test('signed-out session reports not-authenticated, not "not linked"', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signOut();
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'not-authenticated');
  });
});

await test('soft-deleted salon is excluded — a deleted-only salon is an honest no-membership', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.admin(`insert into public.organization_members (organization_id, user_id, role, status)
                   values ('${ORG_C}', '${NO_SALON_USER}', 'owner', 'active')`);
    await h.signIn(NO_SALON_USER);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'no-membership');
  });
});

await test('multiple owned salons stay ambiguous — never an arbitrary pick', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.admin(`insert into public.salons (id, organization_id, name, slug, city, is_active)
                   values ('${SALON_A2}', '${ORG_A}', 'Second Branch', 'second-branch', 'Kota', true)`);
    await h.signIn(OWNER_A);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'ambiguous');
  });
});

await test('a FAILED lookup is never reported as "no membership" (salons read denied → permission-denied)', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    h.bridge.deniedTables.add('salons');
    await h.signIn(OWNER_A);
    const resolution = await resolveOwnerSalonId();
    assert.equal(resolution.status, 'permission-denied', `expected permission-denied, got ${JSON.stringify(resolution)}`);
    const context = await loadOwnerDashboardContext();
    assert.equal(context.access, 'permission-denied');
    assert.equal(context.salon, null);
  });
});

/* ================================================================== */
section('2 · Full dashboard E2E on the live schema — all 7 sections, real data');

function paymentRecord(overrides) {
  const now = Date.now();
  return {
    id: `row-${overrides.bookingId}`,
    idempotencyKey: `key-${overrides.bookingId}`,
    businessId: ORG_A,
    themeId: 'beauty_skin_spa',
    customerId: overrides.customerId,
    bookingId: overrides.bookingId,
    serviceId: 'svc-1',
    serviceName: 'Haircut and Style',
    dateKey: overrides.dateKey,
    startMinutes: overrides.startMinutes,
    endMinutes: overrides.startMinutes + 45,
    baseAmount: 80000,
    amountDue: 80000,
    remainingAmount: overrides.paid ? 0 : 60000,
    currency: 'INR',
    paymentOption: overrides.paid ? 'full' : 'advance',
    paymentMethod: 'upi',
    paymentStatus: overrides.paid ? 'paid' : 'pending',
    bookingStatus: overrides.bookingStatus,
    customer: { name: overrides.customerName, mobile: '+919800000001', email: 'customer@test.test' },
    createdAt: now - 60_000,
    updatedAt: now - 60_000,
    payAtSalon: false,
  };
}

function seedBookings() {
  const today = localDateKey(salonNow());
  const soon = new Date(salonNow().getTime() + 3 * 24 * 60 * 60 * 1000);
  const later = new Date(salonNow().getTime() + 5 * 24 * 60 * 60 * 1000);
  const records = [
    paymentRecord({ bookingId: 'NX-TODAY-1', dateKey: today, startMinutes: 600, bookingStatus: 'confirmed', paid: true, customerId: 'cust-priya', customerName: 'Priya Sharma' }),
    paymentRecord({ bookingId: 'NX-TODAY-2', dateKey: today, startMinutes: 930, bookingStatus: 'pay_at_salon', paid: false, customerId: 'cust-aditi', customerName: 'Aditi Rao' }),
    paymentRecord({ bookingId: 'NX-TODAY-C', dateKey: today, startMinutes: 1080, bookingStatus: 'cancelled', paid: false, customerId: 'cust-aditi', customerName: 'Aditi Rao' }),
    paymentRecord({ bookingId: 'NX-SOON-1', dateKey: localDateKey(soon), startMinutes: 720, bookingStatus: 'confirmed', paid: true, customerId: 'cust-riya', customerName: 'Riya Kapoor' }),
    paymentRecord({ bookingId: 'NX-SOON-2', dateKey: localDateKey(later), startMinutes: 780, bookingStatus: 'pending_payment', paid: false, customerId: 'cust-meera', customerName: 'Meera Nair' }),
    // A different tenant's record in the same browser store — must NEVER appear.
    paymentRecord({ bookingId: 'NX-FOREIGN', dateKey: today, startMinutes: 660, bookingStatus: 'confirmed', paid: true, customerId: 'cust-foreign', customerName: 'Foreign Customer' }),
  ];
  records[5].businessId = ORG_B;
  window.localStorage.setItem(
    PAYMENT_STORE_KEY,
    JSON.stringify({ version: PAYMENT_STORE_VERSION, records }),
  );
}

let consoleErrors = [];
const originalConsoleError = console.error;

await test('Overview renders the real resolved salon (no "not linked" card)', async () => {
  consoleErrors = [];
  console.error = (...args) => consoleErrors.push(args.map(String).join(' '));
  try {
    await withHarness({ helper: 'none' }, async (h) => {
      await h.signIn(OWNER_A);
      window.localStorage.clear();
      seedBookings();
      let utils;
      await act(async () => {
        utils = render(React.createElement(OwnerDashboard));
      });
      const { findByTestId, queryByTestId } = utils;
      const salonCard = await findByTestId('owner-dashboard-salon-card');
      assert.ok(salonCard);
      assert.ok(queryByTestId('owner-dashboard-denied') === null, 'dashboard must not deny a linked owner');
      assert.ok(queryByTestId('owner-dashboard-error') === null, 'dashboard must not error for a linked owner');
      assert.equal((await findByTestId('owner-dashboard-salon-name')).textContent, 'Glow and Go Kota');
      assert.match((await findByTestId('owner-salon-field-location')).textContent, /Kota/);
      assert.match((await findByTestId('owner-salon-field-slug')).textContent, /glow-and-go-kota/);
      await act(async () => { cleanup(); });
      assert.equal(consoleErrors.length, 0, `unexpected console errors: ${consoleErrors.join(' | ')}`);
    });
  } finally {
    console.error = originalConsoleError;
  }
});

async function mountAuthorizedDashboard() {
  seedBookings();
  let utils;
  await act(async () => {
    utils = render(React.createElement(OwnerDashboard));
  });
  await utils.findByTestId('owner-dashboard-salon-card');
  return utils;
}

await test('Today\'s Appointments shows today\'s REAL bookings and never another tenant\'s', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    const { findByTestId, queryByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-nav-today')); });
    await findByTestId('today-appointments-header');
    assert.ok(await findByTestId('today-appointment-NX-TODAY-1'), 'today booking 1 missing');
    assert.ok(await findByTestId('today-appointment-NX-TODAY-2'), 'today booking 2 missing');
    assert.ok(await findByTestId('today-appointment-NX-TODAY-C'), 'cancelled today booking kept visible');
    assert.ok(queryByTestId('today-appointment-NX-SOON-1') === null, 'future booking must not be in Today');
    assert.ok(queryByTestId('today-appointment-NX-FOREIGN') === null, 'another salon\'s booking leaked into Today');
    await act(async () => { cleanup(); });
  });
});

await test('Upcoming Appointments shows future REAL bookings only', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    const { findByTestId, queryByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-nav-upcoming')); });
    await findByTestId('upcoming-appointments-header');
    assert.ok(await findByTestId('upcoming-appointment-NX-SOON-1'), 'upcoming booking 1 missing');
    assert.ok(await findByTestId('upcoming-appointment-NX-SOON-2'), 'upcoming booking 2 missing');
    assert.ok(queryByTestId('upcoming-appointment-NX-TODAY-1') === null, 'today booking must not be in Upcoming');
    assert.ok(queryByTestId('upcoming-appointment-NX-FOREIGN') === null, 'another salon\'s booking leaked into Upcoming');
    await act(async () => { cleanup(); });
  });
});

await test('Customers lists only the owner\'s own salon customers from real bookings', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    const { findByTestId, queryByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-nav-customers')); });
    await findByTestId('owner-customers');
    for (const customerId of ['cust-priya', 'cust-aditi', 'cust-riya', 'cust-meera']) {
      assert.ok(await findByTestId(`owner-customer-${customerId}`), `${customerId} missing`);
    }
    assert.ok(queryByTestId('owner-customer-cust-foreign') === null, 'another salon\'s customer leaked');
    await act(async () => { cleanup(); });
  });
});

await test('Revenue & Payments renders the real booking/payment projection (not the mock card)', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    const { findByTestId, queryByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-nav-revenue')); });
    const revenue = await findByTestId('owner-revenue');
    assert.ok(revenue);
    assert.ok(queryByTestId('owner-revenue-empty') === null, 'real records exist — empty state wrong');
    // Real totals render (the test-gateway disclosure note may sit beside them).
    const total = await findByTestId('owner-revenue-total-value');
    assert.ok(total && total.textContent.trim().length > 0, 'total booking value card must render real data');
    await act(async () => { cleanup(); });
  });
});

await test('Calendar renders the real schedule grid including today', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    const { findByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-nav-calendar')); });
    await findByTestId('owner-calendar-grid');
    const todayKey = localDateKey(salonNow());
    assert.ok(await findByTestId(`owner-calendar-day-${todayKey}`), 'today missing from calendar');
    await act(async () => { cleanup(); });
  });
});

await test('Notifications lists events derived from the real booking records', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    const { findByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-nav-notifications')); });
    const list = await findByTestId('owner-notifications-list');
    assert.ok(list.querySelectorAll('[data-testid^="owner-notification-"]').length > 0, 'no notification events rendered');
    await act(async () => { cleanup(); });
  });
});

await test('refresh keeps the selected section accessible (persisted section restores after remount)', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    let { findByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-nav-customers')); });
    await findByTestId('owner-customers');
    await act(async () => { cleanup(); });
    // "Refresh": the store data and the persisted section survive; the app
    // remounts the dashboard from scratch and restores the last section.
    let again;
    await act(async () => {
      again = render(React.createElement(OwnerDashboard));
    });
    await again.findByTestId('owner-customers');
    assert.equal(again.getByTestId('owner-dashboard').dataset.section, 'customers');
    assert.equal((await again.findByTestId('owner-dashboard-salon-name')).textContent, 'Glow and Go Kota');
    await act(async () => { cleanup(); });
  });
});

await test('mobile navigation: pills switch sections, drawer opens and closes', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    const { findByTestId, getByTestId } = await mountAuthorizedDashboard();
    await act(async () => { fireEvent.click(getByTestId('owner-pill-today')); });
    await findByTestId('today-appointments-header');
    await act(async () => { fireEvent.click(getByTestId('owner-pill-upcoming')); });
    await findByTestId('upcoming-appointments-header');
    await act(async () => { fireEvent.click(getByTestId('owner-dashboard-menu-button')); });
    const drawer = await findByTestId('owner-dashboard-drawer');
    assert.ok(drawer, 'mobile drawer did not open');
    await act(async () => { fireEvent.click(getByTestId('owner-drawer-customers')); });
    await findByTestId('owner-customers');
    assert.ok(!getByTestId('owner-dashboard').querySelector('[data-testid="owner-dashboard-drawer"]'), 'drawer must close after selecting');
    await act(async () => { cleanup(); });
  });
});

await test('unlinked account still shows the honest unavailable state in the UI', async () => {
  await withHarness({ helper: 'none' }, async (h) => {
    await h.signIn(NO_SALON_USER);
    window.localStorage.clear();
    let utils;
    await act(async () => {
      utils = render(React.createElement(OwnerDashboard));
    });
    const denied = await utils.findByTestId('owner-dashboard-denied');
    assert.ok(denied);
    // The session cannot prove the absence (RLS may hide the membership
    // table), so the honest card offers a retry instead of blaming the
    // account with "not linked".
    assert.match(denied.textContent, /could not verify/i);
    assert.ok(await utils.findByTestId('owner-dashboard-denied-retry'), 'unverifiable refusal must offer retry');
    await act(async () => { cleanup(); });
  });
});

await test('LIVE DIVERGENCE — linked owner whose membership table is RLS-hidden never sees the "not linked" screen', async () => {
  await withHarness({ helper: 'none', hideOrgMembers: true }, async (h) => {
    await h.signIn(OWNER_A);
    window.localStorage.clear();
    let utils;
    await act(async () => {
      utils = render(React.createElement(OwnerDashboard));
    });
    const denied = await utils.findByTestId('owner-dashboard-denied');
    assert.ok(denied);
    assert.ok(!/not linked to a salon/i.test(denied.textContent), 'must NOT blame the linked owner');
    assert.match(denied.textContent, /could not verify/i);
    assert.ok(await utils.findByTestId('owner-dashboard-denied-retry'), 'retry must be offered');
    await act(async () => { cleanup(); });
  });
});

/* ------------------------------------------------------------------ */
console.log('\n────────────────────────────────────────');
if (failed > 0) {
  console.error(`Owner dashboard live resolution: ${passed} passed, ${failed} FAILED`);
  for (const { name, error } of failures) {
    console.error(`\n✗ ${name}\n${error?.stack ?? error}`);
  }
} else {
  console.log(`Owner dashboard live resolution: ${passed} passed, 0 failed`);
}
// The live supabase client keeps auth-refresh timers on the event loop, so
// exit explicitly once the summary has been written.
process.exit(failed > 0 ? 1 : 0);
