/**
 * OWNER RESOLUTION DIAGNOSTICS PANEL — observability ONLY.
 *
 * Rendered UNDER the refusal card when the Owner Dashboard cannot authorize
 * the session. It runs the same live-database probes the operator asked for
 * (session, nexora_owner_salon_ids(), organization_members, salons) and shows
 * the ACTUAL recorded results, so the exact failing step is visible on the
 * running screen instead of a guessed message.
 *
 * It is NOT part of the access decision and cannot grant or deny anything:
 * the dashboard's verdict comes exclusively from loadOwnerDashboardContext().
 * It reads only the session's own rows, sends no tokens anywhere, and posts
 * the same report to the dev server's capture endpoint (same origin) so the
 * operator can read the live result from the server log.
 */
import { useEffect, useRef, useState } from 'react';
import {
  runOwnerResolutionDiagnostics,
  postOwnerResolutionDiagnostics,
} from '../lib/ownerDiagnostics';
import type { OwnerResolutionDiagnosticsReport } from '../lib/ownerDiagnostics';
import type { SiteAppearance } from '../lib/siteNavigation';

interface Palette {
  shell: string;
  panel: string;
  panelSoft: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
}

function Badge({ palette, ok, children }: { palette: Palette; ok: boolean | null; children: string }) {
  const tone =
    ok === null
      ? { background: palette.panelSoft, color: palette.muted, border: palette.line }
      : ok
        ? { background: 'rgba(16,128,64,0.14)', color: '#0f8a4d', border: 'rgba(16,128,64,0.35)' }
        : { background: 'rgba(172,0,83,0.12)', color: palette.accent, border: 'rgba(172,0,83,0.4)' };
  return (
    <span
      className="inline-block shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
      style={tone}
    >
      {children}
    </span>
  );
}

function StepRow({
  palette,
  label,
  ok,
  detail,
}: {
  palette: Palette;
  label: string;
  ok: boolean | null;
  detail: string;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-start gap-3 py-1.5">
      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: palette.muted }}>
        {label}
      </span>
      <div className="min-w-0 space-y-1">
        <Badge palette={palette} ok={ok}>
          {ok === null ? 'skipped' : ok ? 'ok' : 'fail'}
        </Badge>
        <p className="break-words font-mono text-[11px] leading-relaxed" style={{ color: palette.text }}>
          {detail || '—'}
        </p>
      </div>
    </div>
  );
}

function statusOk(report: OwnerResolutionDiagnosticsReport, key: string): boolean | null {
  switch (key) {
    case 'config':
      return report.configured;
    case 'session':
      return Boolean(report.auth.userId && report.auth.sessionPresent);
    case 'helper':
      if (report.helper.status === 'missing') return null;
      return report.helper.status === 'success' && report.helper.salonIds.length > 0;
    case 'membership':
      if (report.membership.status === 'error') return false;
      return report.membership.rows.length > 0;
    case 'salons':
      if (report.salons.status === 'skipped') return null;
      if (report.salons.status === 'error') return false;
      return report.salons.rows.length > 0;
    case 'verdict':
      return report.productionResolution.status === 'resolved';
    default:
      return null;
  }
}

function detailFor(report: OwnerResolutionDiagnosticsReport, key: string): string {
  switch (key) {
    case 'config':
      return report.configured
        ? `configured · host ${report.supabaseUrlHost ?? 'unknown'} (anon key never shown)`
        : 'NOT configured — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in this build';
    case 'session': {
      const email = report.auth.email ? ` · email ${report.auth.email}` : '';
      const user = report.auth.userId ? `user_id ${report.auth.userId}${email}` : 'no user id';
      const state = `session present: ${report.auth.sessionPresent ? 'YES' : 'NO'} (getUser=${report.auth.getUserOk}, getSession=${report.auth.getSessionOk})`;
      return `${user} · ${state}${report.auth.error ? ` · last error: ${report.auth.error.code ?? ''} ${report.auth.error.message ?? ''}`.trim() : ''}`;
    }
    case 'helper':
      if (report.helper.status === 'success') {
        return report.helper.salonIds.length
          ? `returned salon ids: ${report.helper.salonIds.join(', ')}`
          : 'ran successfully but returned ZERO salon ids';
      }
      return `${report.helper.status.toUpperCase()} — ${report.helper.error?.code ?? ''} ${report.helper.error?.message ?? ''}`.trim();
    case 'membership': {
      const rows = report.membership.rows
        .map((r) => `org=${r.organizationId || '(null)'} role=${r.role || '(empty)'} status=${r.status || '(empty)'}`)
        .join(' ; ');
      if (report.membership.status === 'error') {
        return `read FAILED — ${report.membership.error?.code ?? ''} ${report.membership.error?.message ?? ''}`.trim();
      }
      const probe = report.membershipProbe.anyVisibleRow
        ? `probe: rows visible (${report.membershipProbe.rolesStatuses.map((r) => `${r.role}/${r.status}`).join(', ') || 'empty roles/statuses'}) — table readable`
        : 'probe: ZERO visible rows — table may be RLS-hidden or account has no membership';
      return rows.length ? `${report.membership.rows.length} row(s): ${rows} · ${probe}` : `no owner/active rows · ${probe}`;
    }
    case 'salons':
      if (report.salons.status === 'error') {
        return `read FAILED — ${report.salons.error?.code ?? ''} ${report.salons.error?.message ?? ''}`.trim();
      }
      if (report.salons.status === 'skipped') return 'skipped — no organization ids resolved';
      const rows = report.salons.rows
        .map((s) => `id=${s.id} org=${s.organizationId ?? 'null'} name=${s.name ?? '(no name)'} slug=${s.slug ?? '—'} address=${s.address ?? '—'} city=${s.city ?? '—'} is_active=${s.isActive}`)
        .join(' ; ');
      const deleted = report.salonsIncludingDeleted.rows.length > report.salons.rows.length
        ? ` · NOTE: ${report.salonsIncludingDeleted.rows.length - report.salons.rows.length} additional row(s) exist for these orgs but are SOFT-DELETED`
        : '';
      return rows.length ? `${report.salons.rows.length} row(s): ${rows}${deleted}` : `ZERO live rows for orgs ${report.membership.organizationIds.join(', ') || '(none)'}${deleted}`;
    case 'verdict':
      return `${report.productionResolution.status}${report.productionResolution.salonId ? ` · salonId ${report.productionResolution.salonId}` : ''}`;
    default:
      return '';
  }
}

export default function OwnerResolutionDiagnostics({ palette }: { palette: Palette }) {
  const [report, setReport] = useState<OwnerResolutionDiagnosticsReport | null>(null);
  const [running, setRunning] = useState(false);
  const [captured, setCaptured] = useState<boolean | null>(null);
  const mountedRef = useRef(true);

  const run = () => {
    if (running) return;
    setRunning(true);
    setReport(null);
    runOwnerResolutionDiagnostics()
      .then(async (next) => {
        if (!mountedRef.current) return;
        setReport(next);
        setCaptured(await postOwnerResolutionDiagnostics(next));
      })
      .catch(() => {
        if (mountedRef.current) setReport(null);
      })
      .finally(() => {
        if (mountedRef.current) setRunning(false);
      });
  };

  useEffect(() => {
    mountedRef.current = true;
    run();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepKeys: Array<[string, string]> = [
    ['config', 'Supabase'],
    ['session', 'Auth session'],
    ['helper', 'nexora_owner_salon_ids()'],
    ['membership', 'organization_members'],
    ['salons', 'salons'],
    ['verdict', 'Resolution verdict'],
  ];

  return (
    <details
      data-testid="owner-resolution-diagnostics"
      className="mx-auto w-full max-w-3xl rounded-2xl border p-4"
      style={{ backgroundColor: palette.panel, borderColor: palette.line, color: palette.text }}
    >
      <summary
        className="flex cursor-pointer items-center gap-2 text-[11px] font-black uppercase tracking-wider"
        style={{ color: palette.muted }}
      >
        <span style={{ color: palette.accent }} aria-hidden="true">
          ●
        </span>
        Live database diagnostics
        <span className="ml-auto flex items-center gap-2">
          {captured === true && (
            <span className="rounded-md border px-1.5 py-0.5 text-[10px] font-bold" style={{ borderColor: 'rgba(16,128,64,0.35)', color: '#0f8a4d' }}>
              captured by dev server
            </span>
          )}
          <button
            type="button"
            data-testid="owner-resolution-diagnostics-run"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              run();
            }}
            disabled={running}
            className="rounded-lg border px-2 py-1 text-[10px] font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: palette.line, color: palette.accent, backgroundColor: palette.panelSoft }}
          >
            {running ? 'Running…' : 'Re-run'}
          </button>
        </span>
      </summary>

      <div className="mt-3 space-y-1 border-t pt-3" style={{ borderColor: palette.line }}>
        {!report && running && (
          <p className="text-[11px] font-semibold" style={{ color: palette.muted }}>
            Running live probes with the authenticated session…
          </p>
        )}
        {!report && !running && (
          <p className="text-[11px] font-semibold" style={{ color: palette.muted }}>
            Diagnostics could not run. Open the browser console for details.
          </p>
        )}
        {report && (
          <>
            {stepKeys.map(([key, label]) => (
              <div key={key}>
                <StepRow
                  palette={palette}
                  label={label}
                  ok={statusOk(report, key)}
                  detail={detailFor(report, key)}
                />
              </div>
            ))}
            <div
              className="mt-2 rounded-xl border p-3"
              style={{ borderColor: palette.line, backgroundColor: palette.panelSoft }}
            >
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: palette.muted }}>
                Exact root cause
              </p>
              <p className="mt-1 break-words font-mono text-[11px] leading-relaxed" style={{ color: palette.text }}>
                {report.verdict.code} — {report.verdict.summary}
              </p>
              <p className="mt-1 text-[10px] font-semibold" style={{ color: palette.muted }}>
                Captured at {report.ranAt} · reads are session-scoped; no tokens are included.
              </p>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
