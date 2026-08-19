#!/usr/bin/env node
/** Offline guardrail tests only. This suite never claims live connectivity. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const { inspectSupabaseConfiguration } = await import('../src/lib/supabaseClient.ts');

let tests = 0;
function test(name, fn) {
  tests += 1;
  fn();
  console.log(`PASS ${name}`);
}

function jwt(role) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.signature`;
}

test('missing URL is rejected', () => {
  assert.equal(inspectSupabaseConfiguration('', 'sb_publishable_public').issue, 'missing-url');
});
test('missing public key is rejected', () => {
  assert.equal(inspectSupabaseConfiguration('https://project.supabase.co', '').issue, 'missing-anon-key');
});
test('example URL is rejected', () => {
  assert.equal(inspectSupabaseConfiguration('https://your-project.supabase.co', 'public').issue, 'placeholder-url');
});
test('example key is rejected', () => {
  assert.equal(inspectSupabaseConfiguration('https://project.supabase.co', 'your-anon-public-key').issue, 'placeholder-anon-key');
});
test('sb_secret private key is rejected', () => {
  assert.equal(inspectSupabaseConfiguration('https://project.supabase.co', 'sb_secret_private').issue, 'private-key-rejected');
});
test('legacy service_role JWT is rejected', () => {
  assert.equal(inspectSupabaseConfiguration('https://project.supabase.co', jwt('service_role')).issue, 'private-key-rejected');
});
test('legacy anon JWT is accepted', () => {
  assert.equal(inspectSupabaseConfiguration('https://project.supabase.co', jwt('anon')).ready, true);
});
test('public publishable key is accepted', () => {
  assert.equal(inspectSupabaseConfiguration('https://project.supabase.co', 'sb_publishable_public').ready, true);
});
test('owner resolver never uses job_salon_members', () => {
  const source = fs.readFileSync('src/lib/ownerSalon.ts', 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  assert.equal(source.includes('job_salon_members'), false);
});
test('strict probe requires the live RPC, membership, salon, dashboard, and logout', () => {
  const source = fs.readFileSync('scripts/probe-live-owner.mjs', 'utf8');
  for (const required of [
    'nexora_owner_salon_ids()',
    'organization_members',
    'salons.organization_id',
    'loadOwnerDashboardContext',
    'signOutWithResult',
  ]) assert.ok(source.includes(required), required);
  assert.match(source, /process\.exit\(1\)/);
});
test('localStorage audit identifies every critical connection-phase key', () => {
  const doc = fs.readFileSync('docs/pre-phase-supabase-foundation.md', 'utf8');
  for (const key of [
    'nexora_site_booking_browser',
    'nexora_site_booking_holds',
    'nexora_site_payment_records',
    'nexora_site_customer_profile',
    'nexora_onboarding_state',
  ]) assert.ok(doc.includes(key), key);
});

async function testOwnershipCorrectionSql() {
  tests += 1;
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
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
      create table public.organization_members (
        id uuid primary key,
        organization_id uuid not null,
        user_id uuid not null,
        role text not null,
        status text
      );
      create table public.salons (
        id uuid primary key,
        organization_id uuid not null,
        name text,
        slug text,
        address text,
        city text,
        is_active boolean,
        deleted_at timestamptz
      );
      alter table public.organization_members enable row level security;
      alter table public.salons enable row level security;
      grant usage on schema public, auth to anon, authenticated;
      insert into public.organization_members values
        ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','owner','active'),
        ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','owner','active');
      insert into public.salons values
        ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Salon A','salon-a','A','Jaipur',true,null),
        ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Salon B','salon-b','B','Jaipur',true,null);
    `);

    const correction = fs.readFileSync('docs/owner-dashboard-ownership-fix.sql', 'utf8');
    await db.exec(correction);
    await db.exec(correction); // idempotency

    await db.query("select set_config('request.jwt.claim.sub', $1, false)", ['30000000-0000-4000-8000-000000000001']);
    await db.exec('set role authenticated');
    const memberships = await db.query('select id, organization_id, user_id, role, status from public.organization_members');
    const salons = await db.query('select id, organization_id, name, slug, address, city, is_active, deleted_at from public.salons');
    const helper = await db.query('select public.nexora_owner_salon_ids() as ids');
    assert.equal(memberships.rows.length, 1);
    assert.equal(salons.rows.length, 1);
    assert.deepEqual(helper.rows[0].ids, ['40000000-0000-4000-8000-000000000001']);
    await db.exec('reset role');
    console.log('PASS ownership correction SQL is valid, idempotent, and tenant-isolated');
  } finally {
    await db.close();
  }
}

await testOwnershipCorrectionSql();
console.log(`\n${tests}/${tests} offline Supabase foundation guardrails passed.`);
console.log('Live connectivity is intentionally NOT asserted by this suite; run npm run probe:live-owner.');
