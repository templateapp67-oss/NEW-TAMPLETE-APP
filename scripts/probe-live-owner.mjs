/**
 * LIVE OWNER-DASHBOARD PROBE — `npm run probe:live-owner`
 *
 * Runs the EXACT live-database diagnostics that the Owner Dashboard's
 * refusal card runs in the browser (`src/lib/ownerDiagnostics.ts`), but from
 * a terminal against the REAL project, so an operator can see the precise
 * failing step without opening the site and signing in by hand.
 *
 * It uses only the same anon/public key as the browser build (never a
 * service_role key) and authenticates as a real owner before probing, so the
 * queries are session-scoped exactly like production. Read-only and
 * observability only: it cannot grant or deny anything and it prints no
 * tokens. `job_salon_members` is never consulted.
 *
 * Configuration (see `.env.example`):
 *   VITE_SUPABASE_URL             Supabase project URL (anon/public)
 *   VITE_SUPABASE_ANON_KEY        Supabase anon/public key
 *   PROBE_OWNER_EMAIL             owner account to sign in as  (or:)
 *   PROBE_OWNER_PASSWORD          that account's password
 *   PROBE_ACCESS_TOKEN            a valid session access token to setSession
 *
 * Exit codes:
 *   0  probe ran (the verdict itself is informational)
 *   1  fatal: not configured, sign-in failed, or the probe crashed
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Mirror server.ts: load .env.local (gitignored) on top of .env so an
// operator can keep live credentials out of git entirely.
dotenv.config();
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  … ${msg}`);
const fail = (msg) => console.error(`  ✗ ${msg}`);

console.log('\n── Live owner-dashboard probe ─────────────────────────────');

if (!url || !anonKey) {
  console.error('\nNot configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  console.error('(copy .env.example → .env, then add the anon key). No service_role key.');
  process.exit(1);
}
ok('Supabase anon/public key present (anon key only — service_role never used)');

// Env must be in place BEFORE the app modules read it at import time.
// The client is built once at module load from process.env.
const { supabase } = await import('../src/lib/supabaseClient.ts');
const { runOwnerResolutionDiagnostics } = await import('../src/lib/ownerDiagnostics.ts');

async function authenticate() {
  const email = process.env.PROBE_OWNER_EMAIL;
  const password = process.env.PROBE_OWNER_PASSWORD;
  const accessToken = process.env.PROBE_ACCESS_TOKEN;

  if (email && password) {
    ok(`Signing in as owner ${email}…`);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      fail(`sign-in failed: ${error.message}`);
      process.exit(1);
    }
    return;
  }
  if (accessToken) {
    ok('Using PROBE_ACCESS_TOKEN to start an authenticated session…');
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken, // never used for a refresh in a CLI probe
    });
    if (error) {
      fail(`setSession failed: ${error.message}`);
      process.exit(1);
    }
    return;
  }
  console.error(
    '\nNo owner credentials.\n' +
      'Provide PROBE_OWNER_EMAIL + PROBE_OWNER_PASSWORD (or PROBE_ACCESS_TOKEN) in .env\n' +
      'so the probe can authenticate as the owner before running the live probes.',
  );
  process.exit(1);
}

try {
  await authenticate();

  console.log('\n── Running live-database probes with the authenticated session ──');
  const report = await runOwnerResolutionDiagnostics();

  console.log('\n── Session');
  ok(`getUser ok=${report.auth.getUserOk} · getSession ok=${report.auth.getSessionOk} · session present=${report.auth.sessionPresent}`);
  if (report.auth.userId) ok(`user_id ${report.auth.userId}${report.auth.email ? ` · email ${report.auth.email}` : ''}`);
  if (report.auth.error) warn(`auth note: ${report.auth.error.code ?? ''} ${report.auth.error.message ?? ''}`.trim());

  console.log('\n── nexora_owner_salon_ids()');
  if (report.helper.status === 'success') {
    ok(report.helper.salonIds.length ? `returned ${report.helper.salonIds.length} salon id(s)` : 'ran but returned ZERO salon ids');
  } else {
    warn(`${report.helper.status.toUpperCase()} — ${report.helper.error?.code ?? ''} ${report.helper.error?.message ?? ''}`.trim());
  }

  console.log('\n── organization_members (session-scoped)');
  if (report.membership.status === 'error') {
    fail(`read FAILED — ${report.membership.error?.code ?? ''} ${report.membership.error?.message ?? ''}`.trim());
  } else {
    const probe = report.membershipProbe.anyVisibleRow
      ? 'table readable (rows visible)'
      : 'ZERO visible rows — table may be RLS-hidden or account has no membership';
    ok(report.membership.rows.length
      ? `${report.membership.rows.length} owner/active row(s) · ${probe}`
      : `no owner/active rows · ${probe}`);
  }

  console.log('\n── salons (organization_ids from membership)');
  if (report.salons.status === 'skipped') warn('skipped — no organization ids resolved');
  else if (report.salons.status === 'error') fail(`read FAILED — ${report.salons.error?.code ?? ''} ${report.salons.error?.message ?? ''}`.trim());
  else {
    ok(`${report.salons.rows.length} live salon row(s) for ${report.membership.organizationIds.join(', ') || '(none)'}`);
    if (report.salonsIncludingDeleted.rows.length > report.salons.rows.length) {
      warn(`${report.salonsIncludingDeleted.rows.length - report.salons.rows.length} additional soft-deleted row(s) for these orgs`);
    }
  }

  console.log('\n── Production resolution verdict');
  ok(`${report.productionResolution.status}${report.productionResolution.salonId ? ` · salonId ${report.productionResolution.salonId}` : ''}`);

  console.log('\n── EXACT ROOT CAUSE');
  console.log(`  ${report.verdict.code} — ${report.verdict.summary}`);

  console.log('\n── Full machine-readable report (no tokens included)');
  console.log(JSON.stringify(report, null, 2));

  console.log('\nProbe finished. All reads were session-scoped; nothing was written.');
  process.exit(0);
} catch (err) {
  console.error('\nProbe crashed:', err?.stack || err);
  process.exit(1);
}
