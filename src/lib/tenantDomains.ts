import { ownerSalonMessage, resolveOwnerSalonId } from './ownerSalon';
import { requireSupabase } from './supabaseClient';

export const RESERVED_SUBDOMAINS = new Set(['app', 'api', 'admin', 'www', 'dashboard', 'mail', 'assets']);
export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/;
export const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN || 'nexora.site';

export type TenantDomain = {
  salon_id: string; subdomain: string; custom_domain: string | null; brand_name: string;
  logo_url: string | null; favicon_url: string | null; primary_color: string; secondary_color: string;
  is_published: boolean; domain_status: 'pending' | 'active' | 'failed';
};

export function normalizeSubdomain(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
}
export function validateSubdomain(value: string): string | null {
  if (!SUBDOMAIN_PATTERN.test(value)) return 'Use 3–30 lowercase letters, numbers, or hyphens; do not start or end with a hyphen.';
  if (RESERVED_SUBDOMAINS.has(value)) return 'That address is reserved by the platform.';
  return null;
}
export function tenantUrl(subdomain: string): string { return `https://${subdomain}.${PLATFORM_DOMAIN}`; }

export async function checkSubdomainAvailability(raw: string): Promise<{ available: boolean; reason?: string }> {
  const subdomain = normalizeSubdomain(raw); const invalid = validateSubdomain(subdomain);
  if (invalid) return { available: false, reason: invalid };
  const client = requireSupabase() as any;
  const result = await client.rpc('nexora_subdomain_available', { candidate: subdomain });
  if (result.error) throw new Error('Could not check domain availability.');
  return { available: result.data === true, reason: result.data === true ? undefined : 'That address is already claimed.' };
}

export async function readOwnerTenantDomain(): Promise<TenantDomain | null> {
  const owner = await resolveOwnerSalonId();
  if (owner.status !== 'resolved') throw new Error(ownerSalonMessage(owner));
  const result = await (requireSupabase() as any).from('tenant_domains').select('*').eq('salon_id', owner.salonId).maybeSingle();
  if (result.error) throw new Error(result.error.message || 'Could not load domain settings.');
  return result.data as TenantDomain | null;
}

export async function saveOwnerTenantDomain(input: Omit<TenantDomain, 'salon_id'>): Promise<TenantDomain> {
  const invalid = validateSubdomain(input.subdomain); if (invalid) throw new Error(invalid);
  if (!/^#[0-9a-f]{6}$/i.test(input.primary_color) || !/^#[0-9a-f]{6}$/i.test(input.secondary_color)) throw new Error('Choose valid six-digit hex colors.');
  const owner = await resolveOwnerSalonId();
  if (owner.status !== 'resolved') throw new Error(ownerSalonMessage(owner));
  const result = await (requireSupabase() as any).from('tenant_domains').upsert({ ...input, salon_id: owner.salonId, subdomain: normalizeSubdomain(input.subdomain), updated_at: new Date().toISOString() }, { onConflict: 'salon_id' }).select('*').single();
  if (result.error) throw new Error(result.error.code === '23505' ? 'That domain is already claimed.' : result.error.message || 'Could not save domain settings.');
  return result.data as TenantDomain;
}
