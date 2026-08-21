import { useEffect, useState, type CSSProperties } from 'react';
import type { TenantDomain } from '../lib/tenantDomains';
import App from '../App';
import type { SalonData, SalonOpeningHours } from '../types';
import { bookingTemplateVisualTheme, readSupabaseBookingCatalogWithClient } from '../lib/supabaseBooking';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import {
  normalizeSalonNameToSubdomain,
  requestedSalonSubdomain,
  subdomainLikePattern,
} from '../lib/salonHostResolution';
import TemplateRenderer from './TemplateRenderer';

type Resolution =
  | { status: 'loading' }
  | { status: 'app' }
  | { status: 'site'; data: SalonData; tenant?: TenantDomain }
  | { status: 'error'; message: string }
  | { status: 'notfound' };

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function requestedSalonSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path || path === 'nearby') return null;
  try {
    const slug = decodeURIComponent(path).trim().toLowerCase();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function mapHours(rows: Array<{
  day_of_week: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
}>): SalonOpeningHours | undefined {
  if (rows.length === 0) return undefined;
  const result = Object.fromEntries(DAYS.map((day) => [day, {
    open: false,
    startTime: '',
    endTime: '',
  }])) as unknown as SalonOpeningHours;
  for (const row of rows) {
    const day = DAYS[row.day_of_week];
    if (!day) continue;
    result[day] = {
      open: !row.is_closed && Boolean(row.opens_at && row.closes_at),
      startTime: row.opens_at?.slice(0, 5) || '',
      endTime: row.closes_at?.slice(0, 5) || '',
    };
  }
  return result;
}

async function loadPublishedSite(
  salonId: string,
  knownWebsite?: { slug: string; template_key: string; config: unknown },
): Promise<Resolution> {
  const client = requireSupabase();

  const [salonResult, websiteResult, hoursResult] = await Promise.all([
    client.from('salons')
      .select('id,name,description,phone,email,address,area,city,state,pincode,landmark,slug,timezone')
      .eq('id', salonId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single(),
    knownWebsite ? Promise.resolve({ data: knownWebsite, error: null }) : client.from('salon_public_websites')
      .select('slug,template_key,config')
      .eq('salon_id', salonId)
      .eq('is_published', true)
      .single(),
    client.from('salon_hours')
      .select('day_of_week,is_closed,opens_at,closes_at')
      .eq('salon_id', salonId),
  ]);
  if (salonResult.error) throw salonResult.error;
  if (websiteResult.error) throw websiteResult.error;
  if (hoursResult.error) throw hoursResult.error;

  const salon = salonResult.data;
  const website = websiteResult.data;
  const config = record(website.config);
  const profile = record(config.profile);
  const visualTheme = bookingTemplateVisualTheme(website.template_key);
  const catalog = await readSupabaseBookingCatalogWithClient(
    client,
    salon.id,
    visualTheme,
    website.template_key === 'classic' ? 'classic' : visualTheme,
  );

  return {
    status: 'site',
    data: {
      businessId: salon.id,
      bookingTemplateKey: catalog.templateKey,
      templateId: visualTheme,
      salonName: text(profile.name) || salon.name,
      tagline: text(profile.tagline) || salon.description || '',
      ownerName: '',
      ownerRole: '',
      about: text(profile.description) || salon.description || '',
      phone: text(profile.phone) || salon.phone || '',
      email: text(profile.email) || salon.email || '',
      address: {
        fullAddress: text(profile.address) || salon.address,
        area: text(profile.area) || salon.area || '',
        city: text(profile.city) || salon.city,
        state: salon.state || '',
        pinCode: salon.pincode || '',
        landmark: salon.landmark || undefined,
      },
      openingHours: mapHours(hoursResult.data || []),
      services: catalog.services,
      // These are the existing website configuration payload fields. Keep the
      // database as the authority; empty values mean the owner has not
      // configured that section, not that demo content should be invented.
      packages: Array.isArray(config.packages) ? config.packages as SalonData['packages'] : [],
      offers: Array.isArray(config.offers) ? config.offers as SalonData['offers'] : [],
      team: Array.isArray(config.team) ? config.team as SalonData['team'] : [],
      gallery: Array.isArray(config.gallery) ? config.gallery as SalonData['gallery'] : [],
      socialVideos: Array.isArray(config.videos) ? config.videos as SalonData['socialVideos'] : [],
      websiteSlug: website.slug || salon.slug,
      publishState: 'published',
      publishedUrl: `/${website.slug || salon.slug}`,
    },
  };
}

/**
 * Resolve a `*.nexora.site` hostname to the matching published salon.
 *
 * The subdomain identifier is the salon name with every non-alphanumeric
 * character removed (the same rule `src/lib/salonSubdomain.ts` uses when it
 * builds the dashboard link). Resolution therefore reuses the existing
 * `salons` + `salon_public_websites` data model with no new fields:
 *
 *   hostname → subdomain → salons.name (normalized) → published website.
 *
 * The final gate is an EXACT normalized-name equality check, so one salon can
 * never render another salon's data, and an unknown subdomain fails closed to
 * a not-found state. Data access stays behind the existing Supabase RLS
 * (anonymous catalogue read + published-website read) — the hostname only
 * selects which tenant to display, exactly like the path slug does today.
 */
async function resolveSubdomainSite(subdomain: string): Promise<Resolution> {
  const client = requireSupabase();

  // Explicit tenant claims take precedence over the legacy name-derived host.
  // The public RLS policy deliberately exposes only published tenants.
  const tenantResult = await (client as any).from('tenant_domains').select('*')
    .eq('subdomain', subdomain).eq('is_published', true).maybeSingle();
  if (!tenantResult.error && tenantResult.data) {
    const site = await loadPublishedSite(tenantResult.data.salon_id);
    return site.status === 'site' ? { ...site, tenant: tenantResult.data as TenantDomain } : site;
  }

  const candidateResult = await client
    .from('salons')
    .select('id,name,slug')
    .eq('is_active', true)
    .is('deleted_at', null)
    .ilike('name', subdomainLikePattern(subdomain))
    .limit(25);

  if (candidateResult.error) throw candidateResult.error;

  const rows = (candidateResult.data ?? []) as Array<{ id: string; name: string; slug: string }>;
  const matches = rows.filter((row) => normalizeSalonNameToSubdomain(row.name) === subdomain);

  if (matches.length === 0) return { status: 'notfound' };
  // Two distinct salons whose names normalize to the same subdomain is a
  // platform-level collision; fail closed instead of showing the wrong tenant.
  if (matches.length > 1) {
    return { status: 'error', message: 'More than one salon matches this address.' };
  }

  const websiteResult = await client
    .from('salon_public_websites')
    .select('salon_id,slug,template_key,config')
    .eq('salon_id', matches[0].id)
    .eq('is_published', true)
    .single();

  // A salon exists but is not published — treat as not found (never fall back
  // to the builder or to another salon's site).
  if (websiteResult.error) return { status: 'notfound' };

  return loadPublishedSite(matches[0].id, websiteResult.data);
}

async function resolveCustomerSite(
  userId: string | null,
  routeSlug: string | null,
  routeSubdomain: string | null,
): Promise<Resolution> {
  const client = requireSupabase();

  // A `*.nexora.site` host is explicit salon intent and takes precedence: the
  // subdomain identifies the tenant, regardless of any path on the URL.
  if (routeSubdomain) return resolveSubdomainSite(routeSubdomain);

  // A published slug is explicit customer intent and is safe for anonymous
  // visitors. The public website projection + salon catalogue RLS remain the
  // database authorization boundary.
  if (routeSlug) {
    const websiteResult = await client
      .from('salon_public_websites')
      .select('salon_id,slug,template_key,config')
      .eq('slug', routeSlug)
      .eq('is_published', true)
      .single();
    if (websiteResult.error) throw websiteResult.error;
    return loadPublishedSite(websiteResult.data.salon_id, websiteResult.data);
  }

  if (!userId) return { status: 'app' };

  // On the builder root an owner keeps the existing owner/onboarding app.
  // Ownership remains the canonical organization-membership helper.
  const ownerResult = await client.rpc('nexora_owner_salon_ids');
  if (ownerResult.error) throw ownerResult.error;
  if (Array.isArray(ownerResult.data) && ownerResult.data.length > 0) return { status: 'app' };

  const customerResult = await client
    .from('salon_customers')
    .select('salon_id')
    .eq('customer_user_id', userId)
    .is('deleted_at', null);
  if (customerResult.error) throw customerResult.error;
  const salonIds = Array.from(new Set((customerResult.data || []).map((row) => row.salon_id)));
  if (salonIds.length === 0) return { status: 'app' };
  if (salonIds.length > 1) {
    return { status: 'error', message: 'Choose a salon from the salon discovery page to open your account.' };
  }
  return loadPublishedSite(salonIds[0]);
}

/**
 * Published `*.nexora.site` subdomains and legacy path slugs both resolve the
 * real public salon for any visitor. On the builder root, authenticated
 * customers resolve their tenant from salon_customers while anonymous
 * visitors and owners retain the existing app.
 */
export default function ConfiguredCustomerApp() {
  const { user, loading } = useAuth();
  const [resolution, setResolution] = useState<Resolution>({ status: 'loading' });
  const routeSlug = requestedSalonSlug();
  const routeSubdomain = requestedSalonSubdomain();

  useEffect(() => {
    if (!isSupabaseConfigured || loading) return;
    let active = true;
    setResolution({ status: 'loading' });
    void resolveCustomerSite(user?.id ?? null, routeSlug, routeSubdomain)
      .then((result) => { if (active) setResolution(result); })
      .catch(() => {
        if (active) setResolution({
          status: 'error',
          message: 'Your salon website could not be loaded. Please try again.',
        });
      });
    return () => { active = false; };
  }, [loading, routeSlug, routeSubdomain, user?.id]);

  if (!isSupabaseConfigured || resolution.status === 'app') return <App />;
  if (loading || resolution.status === 'loading') {
    return <div data-testid="configured-customer-site-loading" className="min-h-screen grid place-items-center">Loading salon…</div>;
  }
  if (resolution.status === 'notfound') {
    return (
      <div data-testid="configured-customer-site-notfound" className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salon not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            There is no salon website at this address. It may be unpublished or the address may be incorrect.
          </p>
        </div>
      </div>
    );
  }
  if (resolution.status === 'error') {
    return <div data-testid="configured-customer-site-error" className="min-h-screen grid place-items-center p-6 text-center">{resolution.message}</div>;
  }
  return <TenantSite tenant={resolution.tenant} data={resolution.data} />;
}

function TenantSite({ tenant, data }: { tenant?: TenantDomain; data: SalonData }) {
  useEffect(() => {
    if (!tenant) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', tenant.primary_color);
    root.style.setProperty('--secondary', tenant.secondary_color);
    document.title = tenant.brand_name;
    const setMeta = (property: string, value: string) => {
      let node = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!node) { node = document.createElement('meta'); node.setAttribute('property', property); document.head.appendChild(node); }
      node.content = value;
    };
    setMeta('og:title', tenant.brand_name); setMeta('og:site_name', tenant.brand_name);
    if (tenant.logo_url) setMeta('og:image', tenant.logo_url);
    if (tenant.favicon_url) {
      let icon = document.head.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
      icon.href = tenant.favicon_url;
    }
    return () => { root.style.removeProperty('--primary'); root.style.removeProperty('--secondary'); };
  }, [tenant]);
  const brandedData = tenant ? { ...data, salonName: tenant.brand_name, logoUrl: tenant.logo_url || data.logoUrl, brandColor: tenant.primary_color } : data;
  return <div data-testid="configured-customer-site" className="min-h-screen bg-white" style={tenant ? { '--primary': tenant.primary_color, '--secondary': tenant.secondary_color } as CSSProperties : undefined}>
    <TemplateRenderer data={brandedData} mode="desktop" />
  </div>;
}
