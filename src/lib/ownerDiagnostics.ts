/**
 * OWNER DASHBOARD — LIVE DATABASE DIAGNOSTICS (observability only).
 *
 * This module executes the exact live-debug steps the operator needs to see
 * when the Owner Dashboard refuses to render, using the ACTUAL authenticated
 * Supabase session of the browser it runs in:
 *
 *   STEP 1  auth session          — user id, email, session present, configured
 *   STEP 2  nexora_owner_salon_ids() helper RPC
 *   STEP 3  organization_members  — user_id = session user (role/status read)
 *   STEP 3b  membership visibility probe (same read the production path uses
 *           to distinguish "no rows" from "RLS-hidden table")
 *   STEP 4  salons                — organization_id IN resolved orgs
 *   STEP 5  production verdict    — resolveOwnerSalonId() re-run
 *
 * HARD RULES (mirrors AGENTS.md):
 *   - NEVER part of the authorization path. The dashboard's access decision
 *     comes exclusively from loadOwnerDashboardContext()/resolveOwnerSalonId().
 *     This module only OBSERVES and REPORTS; no state it produces can grant
 *     or deny access.
 *   - No hardcoded email / user id / salon id / organization id anywhere.
 *   - Only the session's own rows are requested (user_id filter IN the
 *     query); RLS still applies on top. No service_role, no tokens in the
 *     report, no bypass.
 *   - job_salon_members is never consulted.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  OWNER_SALON_IDS_FN,
  ORG_MEMBERS_TABLE,
  SALON_TABLE_NAME,
  resolveOwnerSalonId,
} from './ownerSalon';
import type { OwnerSalonResolution } from './ownerSalon';

export interface DiagnosticsError {
  code?: string;
  message?: string;
}

export interface DiagnosticsAuthStep {
  getUserOk: boolean;
  getSessionOk: boolean;
  sessionPresent: boolean;
  userId: string | null;
  email: string | null;
  error: DiagnosticsError | null;
}

export interface DiagnosticsMembershipRow {
  organizationId: string;
  role: string;
  status: string;
}

export interface DiagnosticsSalonRow {
  id: string;
  organizationId: string | null;
  name: string | null;
  slug: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean | null;
  deletedAt: string | null;
}

export interface OwnerResolutionDiagnosticsReport {
  ranAt: string;
  configured: boolean;
  supabaseUrlHost: string | null;
  auth: DiagnosticsAuthStep;
  helper: {
    status: 'success' | 'missing' | 'error';
    salonIds: string[];
    error: DiagnosticsError | null;
  };
  membership: {
    status: 'success' | 'error';
    rows: DiagnosticsMembershipRow[];
    organizationIds: string[];
    error: DiagnosticsError | null;
  };
  membershipProbe: {
    status: 'success' | 'error';
    anyVisibleRow: boolean;
    rolesStatuses: Array<{ role: string; status: string }>;
    error: DiagnosticsError | null;
  };
  salons: {
    status: 'success' | 'error' | 'skipped';
    rows: DiagnosticsSalonRow[];
    error: DiagnosticsError | null;
  };
  /** Same org ids, WITHOUT the deleted_at IS NULL filter — to expose the
   *  "salon exists but is soft-deleted" root cause explicitly. */
  salonsIncludingDeleted: {
    status: 'success' | 'error' | 'skipped';
    rows: DiagnosticsSalonRow[];
    error: DiagnosticsError | null;
  };
  productionResolution: {
    status: OwnerSalonResolution['status'] | 'unreachable';
    salonId: string | null;
  };
  verdict: { code: string; summary: string };
}

function asError(err: unknown): DiagnosticsError | null {
  if (!err) return null;
  const candidate = err as { code?: unknown; message?: unknown };
  return {
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message:
      typeof candidate.message === 'string'
        ? candidate.message
        : typeof err === 'string'
          ? err
          : 'Unknown error',
  };
}

function firstString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeHelperResult(data: unknown): string[] {
  if (data === null || data === undefined) return [];
  const rows = Array.isArray(data) ? data : [data];
  const ids = new Set<string>();
  for (const row of rows) {
    if (typeof row === 'string') {
      if (row.trim()) ids.add(row.trim());
      continue;
    }
    if (row && typeof row === 'object') {
      const record = row as Record<string, unknown>;
      const value = record.salon_id ?? record.id ?? record.salonId;
      if (typeof value === 'string' && value.trim()) ids.add(value.trim());
    }
  }
  return Array.from(ids);
}

/** The URL host only — the anon key is never included in a report. */
function supabaseUrlHost(): string | null {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    return new URL((supabase as unknown as { supabaseUrl?: string }).supabaseUrl ?? '').host;
  } catch {
    return null;
  }
}

async function readAuthStep(): Promise<DiagnosticsAuthStep> {
  const step: DiagnosticsAuthStep = {
    getUserOk: false,
    getSessionOk: false,
    sessionPresent: false,
    userId: null,
    email: null,
    error: null,
  };
  if (!supabase) {
    step.error = { message: 'Supabase client is null (not configured)' };
    return step;
  }
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    step.getUserOk = true;
    step.userId = data.user?.id ?? null;
    step.email = data.user?.email ?? null;
  } catch (err) {
    step.error = asError(err);
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    step.getSessionOk = true;
    step.sessionPresent = Boolean(data.session);
    if (!step.userId) step.userId = data.session?.user?.id ?? null;
    if (!step.email) step.email = data.session?.user?.email ?? null;
  } catch (err) {
    if (!step.error) step.error = asError(err);
  }
  return step;
}

/**
 * The exact live-debug steps, executed with the authenticated session.
 * Read-only. Any step that throws is recorded as its own error — one failing
 * step never stops the others, and no failure is ever re-labelled
 * "no membership".
 */
export async function runOwnerResolutionDiagnostics(): Promise<OwnerResolutionDiagnosticsReport> {
  const report: OwnerResolutionDiagnosticsReport = {
    ranAt: new Date().toISOString(),
    configured: isSupabaseConfigured && Boolean(supabase),
    supabaseUrlHost: supabaseUrlHost(),
    auth: await readAuthStep(),
    helper: { status: 'missing', salonIds: [], error: null },
    membership: { status: 'error', rows: [], organizationIds: [], error: null },
    membershipProbe: { status: 'error', anyVisibleRow: false, rolesStatuses: [], error: null },
    salons: { status: 'skipped', rows: [], error: null },
    salonsIncludingDeleted: { status: 'skipped', rows: [], error: null },
    productionResolution: { status: 'unreachable', salonId: null },
    verdict: { code: 'pending', summary: '' },
  };

  if (!report.configured || !supabase) {
    report.verdict = {
      code: 'not-configured',
      summary: 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing).',
    };
    return report;
  }

  // STEP 2 — the existing database helper.
  try {
    const { data, error } = await supabase.rpc(OWNER_SALON_IDS_FN);
    if (error) {
      const failure = asError(error) ?? { message: String(error) };
      const missing =
        failure.code === '42883' ||
        failure.code === 'PGRST202' ||
        /could not find the function|does not exist/i.test(failure.message ?? '');
      report.helper.status = missing ? 'missing' : 'error';
      report.helper.error = failure;
    } else {
      report.helper.status = 'success';
      report.helper.salonIds = normalizeHelperResult(data);
    }
  } catch (err) {
    report.helper.status = 'error';
    report.helper.error = asError(err);
  }

  const userId = report.auth.userId;

  // STEP 3 — organization_members, minimum fields, explicit user filter.
  if (!userId) {
    report.membership.status = 'error';
    report.membership.error = { message: 'No authenticated user id — membership read skipped.' };
    report.membershipProbe.status = 'error';
    report.membershipProbe.error = { message: 'No authenticated user id — probe skipped.' };
  } else {
    try {
      const { data, error } = await supabase
        .from(ORG_MEMBERS_TABLE)
        .select('organization_id, role, status')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .eq('status', 'active');
      if (error) throw error;
      report.membership.status = 'success';
      const rows = Array.isArray(data) ? data : [];
      for (const raw of rows) {
        const row = raw as Record<string, unknown>;
        const organizationId = firstString(row.organization_id);
        report.membership.rows.push({
          organizationId,
          role: firstString(row.role),
          status: firstString(row.status),
        });
        if (organizationId) report.membership.organizationIds.push(organizationId);
      }
      report.membership.organizationIds = Array.from(
        new Set(report.membership.organizationIds),
      );
    } catch (err) {
      report.membership.status = 'error';
      report.membership.error = asError(err);
    }

    // STEP 3b — the SAME visibility probe the production path uses: are the
    // session's own rows visible at all (no role/status filters)?
    try {
      const { data, error } = await supabase
        .from(ORG_MEMBERS_TABLE)
        .select('role, status')
        .eq('user_id', userId)
        .limit(2);
      if (error) throw error;
      report.membershipProbe.status = 'success';
      const rows = Array.isArray(data) ? data : [];
      report.membershipProbe.anyVisibleRow = rows.length > 0;
      report.membershipProbe.rolesStatuses = rows.map((raw) => {
        const row = raw as Record<string, unknown>;
        return { role: firstString(row.role), status: firstString(row.status) };
      });
    } catch (err) {
      report.membershipProbe.status = 'error';
      report.membershipProbe.error = asError(err);
    }
  }

  // STEP 4 — salons for the resolved organization ids.
  const readSalons = async (includeDeleted: boolean) => {
    const result: OwnerResolutionDiagnosticsReport['salons'] = {
      status: 'success',
      rows: [],
      error: null,
    };
    try {
      let query = supabase
        .from(SALON_TABLE_NAME)
        .select('id, organization_id, name, slug, address, city, is_active, deleted_at')
        .in('organization_id', report.membership.organizationIds);
      if (!includeDeleted) query = query.is('deleted_at', null);
      const { data, error } = await query;
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      result.rows = rows.map((raw) => {
        const row = raw as Record<string, unknown>;
        return {
          id: firstString(row.id),
          organizationId:
            typeof row.organization_id === 'string' ? row.organization_id : null,
          name: typeof row.name === 'string' ? row.name : null,
          slug: typeof row.slug === 'string' ? row.slug : null,
          address: typeof row.address === 'string' ? row.address : null,
          city: typeof row.city === 'string' ? row.city : null,
          isActive:
            row.is_active === undefined || row.is_active === null
              ? null
              : row.is_active === true,
          deletedAt:
            row.deleted_at === undefined || row.deleted_at === null
              ? null
              : String(row.deleted_at),
        };
      });
    } catch (err) {
      result.status = 'error';
      result.error = asError(err);
    }
    return result;
  };

  if (report.membership.organizationIds.length === 0) {
    report.salons.status = 'skipped';
    report.salons.error = { message: 'No organization ids to look up.' };
    report.salonsIncludingDeleted.status = 'skipped';
    report.salonsIncludingDeleted.error = { message: 'No organization ids to look up.' };
  } else {
    report.salons = await readSalons(false);
    report.salonsIncludingDeleted = await readSalons(true);
  }

  // STEP 5 — the production path's own verdict (observational re-run).
  try {
    const resolution = await resolveOwnerSalonId();
    report.productionResolution.status = resolution.status;
    report.productionResolution.salonId =
      resolution.status === 'resolved' ? resolution.salonId : null;
  } catch (err) {
    report.productionResolution.status = 'unreachable';
    report.productionResolution.salonId = null;
  }

  report.verdict = classifyDiagnostics(report);
  return report;
}

/** Factual verdict — maps the recorded evidence to ONE precise failure. */
function classifyDiagnostics(
  report: OwnerResolutionDiagnosticsReport,
): { code: string; summary: string } {
  if (!report.configured) {
    return {
      code: 'not-configured',
      summary: 'Supabase is not configured in this build (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
    };
  }
  if (!report.auth.userId || !report.auth.sessionPresent) {
    return {
      code: 'not-authenticated',
      summary: `No authenticated session: getUser=${report.auth.getUserOk}, getSession=${report.auth.getSessionOk}, sessionPresent=${report.auth.sessionPresent}${report.auth.error ? `, last auth error: ${report.auth.error.code ?? ''} ${report.auth.error.message ?? ''}`.trim() : ''}.`,
    };
  }

  const notes: string[] = [];
  if (report.helper.status === 'error') {
    notes.push(
      `helper nexora_owner_salon_ids() failed: ${report.helper.error?.code ?? ''} ${report.helper.error?.message ?? ''}`.trim(),
    );
  } else if (report.helper.status === 'missing') {
    notes.push('helper nexora_owner_salon_ids() is not exposed through PostgREST (fallback chain still runs).');
  } else if (report.helper.status === 'success' && report.helper.salonIds.length === 0) {
    notes.push('helper nexora_owner_salon_ids() answered with zero salon ids.');
  }

  if (report.membership.status === 'error') {
    return {
      code: 'membership-error',
      summary: [
        `organization_members read FAILED: ${report.membership.error?.code ?? ''} ${report.membership.error?.message ?? ''}`.trim(),
        ...notes,
      ].join(' | '),
    };
  }

  if (report.membership.rows.length === 0) {
    if (report.membershipProbe.status === 'success' && report.membershipProbe.anyVisibleRow) {
      const seen = report.membershipProbe.rolesStatuses
        .map((r) => `${r.role}/${r.status}`)
        .join(', ');
      return {
        code: 'membership-no-owner-active-row',
        summary: `organization_members IS readable for this session but has NO row with role='owner' AND status='active' (visible rows: ${seen || 'none'}). The row either does not exist or carries different role/status values.`,
      };
    }
    if (report.membershipProbe.status === 'success' && !report.membershipProbe.anyVisibleRow) {
      return {
        code: 'membership-unverifiable',
        summary:
          'organization_members returned ZERO visible rows for this session — the table is either RLS-hidden for the authenticated role (PostgREST reports an empty table with no error) or the account genuinely has no membership. Absence cannot be proven from the client.',
      };
    }
    return {
      code: 'membership-empty-probe-failed',
      summary: `organization_members returned no owner/active rows and the visibility probe failed (${report.membershipProbe.error?.code ?? ''} ${report.membershipProbe.error?.message ?? ''}) — absence is unproven.`.trim(),
    };
  }

  const orgIds = report.membership.organizationIds.join(', ') || '(none)';
  if (report.salons.status === 'error') {
    return {
      code: 'salons-error',
      summary: `organization_members resolved organization(s) ${orgIds}, but the salons read FAILED: ${report.salons.error?.code ?? ''} ${report.salons.error?.message ?? ''}`.trim(),
    };
  }
  if (report.salons.rows.length === 0) {
    if (report.salonsIncludingDeleted.rows.length > 0) {
      const names = report.salonsIncludingDeleted.rows
        .map((s) => `${s.name ?? s.id} (deleted_at=${s.deletedAt ?? 'null'})`)
        .join('; ');
      return {
        code: 'salon-soft-deleted',
        summary: `organization(s) ${orgIds} own salon row(s) that are SOFT-DELETED (deleted_at is set): ${names}. The chain's deleted_at IS NULL filter excludes them, so resolution is empty.`,
      };
    }
    return {
      code: 'org-no-salon',
      summary: `organization_members resolves organization(s) ${orgIds}, but NO salons row carries any of those organization_ids (not even soft-deleted) — the organization_members → salons.organization_id link is missing in the data.`,
    };
  }
  if (report.salons.rows.length > 1) {
    return {
      code: 'ambiguous',
      summary: `${report.salons.rows.length} live salons map to organization(s) ${orgIds}: ${report.salons.rows.map((s) => s.name ?? s.id).join('; ')}. Resolution correctly refuses to pick one.`,
    };
  }
  const salon = report.salons.rows[0];
  return {
    code: 'resolved',
    summary: `Resolved one salon: ${salon.name ?? salon.id} (id=${salon.id}, organization_id=${salon.organizationId ?? 'null'}, is_active=${salon.isActive}).`,
  };
}

/**
 * Ships the report to the dev server's capture endpoint (same origin, no
 * credentials involved). Best-effort: failures are silent so diagnostics can
 * never break the dashboard.
 */
export async function postOwnerResolutionDiagnostics(
  report: OwnerResolutionDiagnosticsReport,
): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return false;
    const response = await window.fetch('/api/owner-diagnostics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    return response.ok;
  } catch {
    return false;
  }
}
