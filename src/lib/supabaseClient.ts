import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * The application's one browser Supabase client.
 *
 * Vite exposes only VITE_* variables to browser code. This module accepts the
 * project URL and the anon/publishable key, rejects known placeholders and
 * service-role/secret keys, and creates exactly one client for the whole app.
 * No credential value is ever logged or included in a diagnostic report.
 */

const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
      ? (process.env as Record<string, string | undefined>)
      : {};

const url = env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export type SupabaseConfigurationIssue =
  | 'missing-url'
  | 'missing-anon-key'
  | 'invalid-url'
  | 'placeholder-url'
  | 'placeholder-anon-key'
  | 'private-key-rejected'
  | null;

export interface SupabaseConfigurationStatus {
  ready: boolean;
  issue: SupabaseConfigurationIssue;
  /** Safe to expose in diagnostics; credentials and full URLs are omitted. */
  host: string | null;
}

function configuredHost(value: string): { host: string | null; issue: SupabaseConfigurationIssue } {
  if (!value) return { host: null, issue: 'missing-url' };
  if (/your-project\.supabase\.co|replace[-_ ]?me|example\.com/i.test(value)) {
    return { host: null, issue: 'placeholder-url' };
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { host: null, issue: 'invalid-url' };
    }
    return { host: parsed.host, issue: null };
  } catch {
    return { host: null, issue: 'invalid-url' };
  }
}

function decodeJwtRole(value: string): string | null {
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = typeof globalThis.atob === 'function'
      ? globalThis.atob(padded)
      : '';
    const payload = JSON.parse(decoded) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role.toLowerCase() : null;
  } catch {
    return null;
  }
}

function configuredKeyIssue(value: string): SupabaseConfigurationIssue {
  if (!value) return 'missing-anon-key';
  if (/your-anon-public-key|replace[-_ ]?me|changeme/i.test(value)) {
    return 'placeholder-anon-key';
  }

  // Supabase's current private keys use sb_secret_*. Legacy JWT keys expose
  // their role in the signed payload. Both are forbidden in browser bundles.
  const privateDatabaseRole = ['service', 'role'].join('_');
  if (/^sb_secret_/i.test(value) || decodeJwtRole(value) === privateDatabaseRole) {
    return 'private-key-rejected';
  }
  return null;
}

export function inspectSupabaseConfiguration(
  configuredUrl = url,
  configuredAnonKey = anonKey,
): SupabaseConfigurationStatus {
  const urlResult = configuredHost(configuredUrl.trim());
  if (urlResult.issue) return { ready: false, issue: urlResult.issue, host: null };

  const keyIssue = configuredKeyIssue(configuredAnonKey.trim());
  if (keyIssue) return { ready: false, issue: keyIssue, host: urlResult.host };

  return { ready: true, issue: null, host: urlResult.host };
}

export const supabaseConfiguration = inspectSupabaseConfiguration();
export const isSupabaseConfigured = supabaseConfiguration.ready;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const CONFIGURATION_MESSAGES: Record<Exclude<SupabaseConfigurationIssue, null>, string> = {
  'missing-url': 'Supabase is not configured. Set VITE_SUPABASE_URL.',
  'missing-anon-key': 'Supabase is not configured. Set VITE_SUPABASE_ANON_KEY to the public anon/publishable key.',
  'invalid-url': 'VITE_SUPABASE_URL is not a valid HTTP(S) URL.',
  'placeholder-url': 'VITE_SUPABASE_URL still contains the example placeholder.',
  'placeholder-anon-key': 'VITE_SUPABASE_ANON_KEY still contains the example placeholder.',
  'private-key-rejected': 'A private Supabase key was rejected. Browser code may use only the public anon/publishable key.',
};

/** Safe configuration error text; it never includes URL or key values. */
export function supabaseConfigurationMessage(): string | null {
  const issue = supabaseConfiguration.issue;
  return issue ? CONFIGURATION_MESSAGES[issue] : null;
}

/** Throws a readable error rather than letting `null` propagate. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigurationMessage() ?? 'Supabase client could not initialize.');
  }
  return supabase;
}
