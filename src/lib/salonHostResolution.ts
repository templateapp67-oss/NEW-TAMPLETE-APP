import { salonSubdomain } from './salonSubdomain';

/**
 * White-label hostname resolution (platform-level, one-time configuration).
 *
 * `*.nexora.site` routes to the SAME production application. This module turns
 * an incoming browser hostname into the salon subdomain identifier so the
 * application can resolve the correct tenant. It intentionally REUSES PR #61's
 * centralized `salonSubdomain` normalization so generation (dashboard links)
 * and resolution (incoming hostname) can never diverge.
 */

/** The single platform domain that owns every salon subdomain. */
export const PLATFORM_DOMAIN = 'nexora.site';

/**
 * Normalize a salon name to its subdomain identifier using the exact same
 * rule the dashboard uses to build `https://<subdomain>.nexora.site`.
 * Kept as a thin wrapper so resolution shares one source of truth with
 * `src/lib/salonSubdomain.ts` rather than reimplementing it.
 */
export function normalizeSalonNameToSubdomain(name: string): string {
  return salonSubdomain({ salonName: name });
}

/**
 * Build a case-insensitive LIKE pattern that matches a salon `name` whose
 * alphanumeric characters, read in order, equal `subdomain`. This is only a
 * candidate pre-filter (so we never scan the whole catalogue); the final
 * decision is the exact `normalizeSalonNameToSubdomain(name) === subdomain`
 * check performed by the caller.
 */
export function subdomainLikePattern(subdomain: string): string {
  const escaped = subdomain.replace(/[\\%_]/g, (char) => `\\${char}`);
  return escaped.split('').join('%');
}

/**
 * Extract the salon subdomain from a request hostname.
 *
 * - `royalhairbeautystudio.nexora.site` → `royalhairbeautystudio`
 * - `nexora.site`, `www.nexora.site` → `null` (platform root, not a salon)
 * - any other host (`*.vercel.app`, localhost, preview hosts) → `null`
 *
 * `hostname` is injectable for tests; in the browser it defaults to
 * `window.location.hostname`.
 */
export function requestedSalonSubdomain(hostname?: string): string | null {
  if (typeof window === 'undefined' && !hostname) return null;
  const raw = (hostname ?? window.location.hostname).toLowerCase().replace(/\.$/, '');
  if (!raw) return null;

  const suffix = `.${PLATFORM_DOMAIN}`;
  if (raw === PLATFORM_DOMAIN || raw === `www${suffix}`) return null;
  if (!raw.endsWith(suffix)) return null;

  const label = raw.slice(0, -suffix.length);
  if (!label || label === 'www' || label.includes('.')) return null;

  const normalized = label.replace(/[^a-z0-9]/g, '');
  return normalized || null;
}
