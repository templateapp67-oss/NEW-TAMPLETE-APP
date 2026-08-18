# PR — Owner dashboard: live database diagnostics + probe (observability only)

## PR Title

**Owner dashboard: live database diagnostics harness + `probe:live-owner` terminal probe**

## PR Body

### Summary

The Owner Dashboard can refuse to authorize a signed-in owner even when the
account genuinely owns a salon (`organization_members role='owner' → salons.organization_id`).
Until now the only way to find the root cause was to guess from a message on
screen. This PR completes the observability tooling that makes the exact
failing step visible — in the running screen **and** from a terminal against
the real project — without touching the access decision.

It is **observability only**. It never grants or denies access, is never part
of the authorization path, uses only the anon/public key (no `service_role`,
no tokens in reports), and never consults `job_salon_members`.

### What changed

- **`scripts/probe-live-owner.mjs` (+ `npm run probe:live-owner`)** — runs the
  exact live-database probes (`src/lib/ownerDiagnostics.ts`) against the REAL
  project from a terminal. It authenticates as an owner (`.env`
  `PROBE_OWNER_EMAIL`/`PROBE_OWNER_PASSWORD`, or `PROBE_ACCESS_TOKEN`), then
  prints each step — session, `nexora_owner_salon_ids()`, `organization_members`
  (session-scoped), `salons` (incl. soft-deleted) — and the classified
  `verdict` root cause. Read-only; prints no tokens.
- **Test coverage** — the live diagnostics report is now exercised by the
  existing suites:
  - `test:owner-salon-resolution` (27/27): the diagnostics report resolves a
    healthy owner to their salon, reports an RLS-hidden membership as
    `membership-unverifiable` (never a false `resolved`), and names a
    soft-deleted-only salon as `salon-soft-deleted`.
  - `test:phase-17.1` (60/60): the diagnostics module/panel/server are wired
    observability-only — never in the authorized view, never a token, no
    hardcoded ids, no DDL, in-memory capture endpoints only.
- **Docs** — `.env.example` documents the probe credentials; `AGENTS.md` lists
  `npm run probe:live-owner`.

### Why observability-only

PostgREST reports an RLS-hidden table exactly like an empty one, so an empty
ownership lookup alone can never prove "account is not linked". The harness
records the real evidence (session, helper, membership visibility probe,
salons with/without `deleted_at`) and classifies exactly one precise failure,
so an operator fixes the data/grants instead of guessing.

### Validation

```
npm run lint                            # 0 errors
npm run build                           # green
npm run test:owner-salon-resolution     # 27/27
npm run test:phase-17.1                 # 60/60
node verify-22-screens.js               # 25/25
```

### Live probe (when `.env` credentials are available)

```bash
# .env (anon key only — never a service_role key)
VITE_SUPABASE_URL=…
VITE_SUPABASE_ANON_KEY=…
PROBE_OWNER_EMAIL=owner@example.com
PROBE_OWNER_PASSWORD=…

npm run probe:live-owner
```

Output includes the exact root cause, e.g. `membership-unverifiable`,
`membership-no-owner-active-row`, `salon-soft-deleted`, `org-no-salon`,
`salons-error`, `ambiguous`, or `resolved`.
