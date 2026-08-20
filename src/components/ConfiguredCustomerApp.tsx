import { useEffect, useState } from 'react';
import App from '../App';
import type { SalonData, SalonOpeningHours } from '../types';
import { bookingTemplateVisualTheme, readSupabaseBookingCatalogWithClient } from '../lib/supabaseBooking';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import TemplateRenderer from './TemplateRenderer';

type Resolution =
  | { status: 'loading' }
  | { status: 'app' }
  | { status: 'site'; data: SalonData }
  | { status: 'error'; message: string };

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

async function resolveCustomerSite(userId: string | null, routeSlug: string | null): Promise<Resolution> {
  const client = requireSupabase();

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
 * Published slug routes resolve the real public salon for any visitor.
 * On the builder root, authenticated customers resolve their tenant from
 * salon_customers while anonymous visitors and owners retain the existing app.
 */
export default function ConfiguredCustomerApp() {
  const { user, loading } = useAuth();
  const [resolution, setResolution] = useState<Resolution>({ status: 'loading' });
  const routeSlug = requestedSalonSlug();

  useEffect(() => {
    if (!isSupabaseConfigured || loading) return;
    let active = true;
    setResolution({ status: 'loading' });
    void resolveCustomerSite(user?.id ?? null, routeSlug)
      .then((result) => { if (active) setResolution(result); })
      .catch(() => {
        if (active) setResolution({
          status: 'error',
          message: 'Your salon website could not be loaded. Please try again.',
        });
      });
    return () => { active = false; };
  }, [loading, routeSlug, user?.id]);

  if (!isSupabaseConfigured || resolution.status === 'app') return <App />;
  if (loading || resolution.status === 'loading') {
    return <div data-testid="configured-customer-site-loading" className="min-h-screen grid place-items-center">Loading salon…</div>;
  }
  if (resolution.status === 'error') {
    return <div data-testid="configured-customer-site-error" className="min-h-screen grid place-items-center p-6 text-center">{resolution.message}</div>;
  }
  return (
    <div data-testid="configured-customer-site" className="min-h-screen bg-white">
      <TemplateRenderer data={resolution.data} mode="desktop" />
    </div>
  );
}
