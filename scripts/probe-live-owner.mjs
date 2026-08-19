#!/usr/bin/env node
/**
 * Strict read-only live Supabase foundation probe.
 *
 * This command succeeds only when a real owner login produces:
 *   validated Supabase session -> organization_members -> organization_id
 *   -> salons.organization_id -> one salon -> Owner Dashboard context.
 *
 * It also requires nexora_owner_salon_ids() to exist, execute for the same
 * authenticated session, and agree with the direct ownership chain. It never
 * uses service_role, never reads job_salon_members, never writes database rows,
 * and never prints credentials or tokens.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

const pass = (label) => console.log(`PASS  ${label}`);
const fail = (label, detail = '') => console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);

console.log('\nSUPABASE LIVE FOUNDATION PROBE');
console.log('Read-only, authenticated, anon/public client only.\n');

// App modules must be imported only after dotenv has loaded the ignored local
// environment, because the singleton client is built at module evaluation.
const {
  supabase,
  supabaseConfiguration,
  supabaseConfigurationMessage,
} = await import('../src/lib/supabaseClient.ts');

if (!supabaseConfiguration.ready || !supabase) {
  fail('Supabase client initialization', supabaseConfigurationMessage() ?? 'unknown configuration error');
  process.exit(1);
}
pass(`Supabase client initialization (${supabaseConfiguration.host ?? 'host unavailable'})`);

const email = process.env.PROBE_OWNER_EMAIL?.trim();
const password = process.env.PROBE_OWNER_PASSWORD;
if (!email || !password) {
  fail(
    'Owner authentication input',
    'set PROBE_OWNER_EMAIL and PROBE_OWNER_PASSWORD in an ignored local/CI environment',
  );
  process.exit(1);
}

const { readAuthenticatedSession, signOutWithResult } = await import('../src/lib/useAuth.ts');
const { runOwnerResolutionDiagnostics } = await import('../src/lib/ownerDiagnostics.ts');
const { loadOwnerDashboardContext } = await import('../src/lib/ownerDashboard.ts');

let overallPass = true;
let signedIn = false;

try {
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    fail('Login', loginError.message);
    process.exit(1);
  }
  signedIn = true;
  pass('Login');

  const auth = await readAuthenticatedSession();
  if (auth.status !== 'authenticated') {
    overallPass = false;
    fail('Validated authentication session', auth.status);
  } else {
    pass('Validated authentication session and authenticated user ID');
  }

  const report = await runOwnerResolutionDiagnostics();

  const helperPass = report.helper.status === 'success'
    && report.helper.salonIds.length === 1;
  if (helperPass) pass('nexora_owner_salon_ids() exists, executes, and returns one salon');
  else {
    overallPass = false;
    fail(
      'nexora_owner_salon_ids()',
      `${report.helper.status}; returned ${report.helper.salonIds.length} salon id(s)`,
    );
  }

  const membershipPass = report.membership.status === 'success'
    && report.membership.rows.length > 0
    && report.membership.organizationIds.length > 0;
  if (membershipPass) pass('organization_members authenticated read and organization_id resolution');
  else {
    overallPass = false;
    fail('organization_members', report.verdict.summary);
  }

  const salonsPass = report.salons.status === 'success'
    && report.salons.rows.length === 1
    && report.salons.rows[0].organizationId !== null
    && report.membership.organizationIds.includes(report.salons.rows[0].organizationId);
  if (salonsPass) pass('salons.organization_id authenticated read and exact organization link');
  else {
    overallPass = false;
    fail('salons.organization_id resolution', report.verdict.summary);
  }

  const resolutionPass = report.productionResolution.status === 'resolved'
    && Boolean(report.productionResolution.salonId);
  if (resolutionPass) pass('Production owner salon resolution');
  else {
    overallPass = false;
    fail('Production owner salon resolution', report.verdict.summary);
  }

  const helperAgreement = resolutionPass
    && report.helper.salonIds.length === 1
    && report.helper.salonIds[0] === report.productionResolution.salonId;
  if (helperAgreement) pass('RPC result agrees with direct ownership chain');
  else {
    overallPass = false;
    fail('RPC/direct-chain agreement');
  }

  const dashboard = await loadOwnerDashboardContext();
  const dashboardPass = dashboard.access === 'authorized'
    && Boolean(dashboard.salon?.id)
    && dashboard.salon?.id === report.productionResolution.salonId;
  if (dashboardPass) pass('Owner Dashboard safe salon read');
  else {
    overallPass = false;
    fail('Owner Dashboard safe salon read', dashboard.access);
  }
} catch (error) {
  overallPass = false;
  const message = error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'unexpected probe error';
  fail('Live probe', message);
} finally {
  if (signedIn) {
    const logout = await signOutWithResult();
    if (logout.error) {
      overallPass = false;
      fail('Logout and session clear', logout.error);
    } else {
      pass('Logout and session clear');
    }
  }
}

console.log(`\nRESULT: ${overallPass ? 'PASS' : 'FAIL'}`);
if (!overallPass) {
  console.error('The Supabase connection foundation is not verified; do not start Phase 16.');
  process.exit(1);
}
console.log('Real auth -> membership -> organization -> salon -> dashboard is verified.');
