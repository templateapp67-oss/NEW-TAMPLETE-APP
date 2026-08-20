import type { Json } from './database.types';
import type { SalonData } from '../types';
import { normalizeThemeId } from './themeServices';
import { getAuthenticatedUserId, ownerSalonMessage, resolveOwnerSalonId } from './ownerSalon';
import { requireSupabase, type NexoraSupabaseClient } from './supabaseClient';

type WebsiteRow = {
  salon_id: string;
  slug: string;
  template_key: string;
  config: Json;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  published_revision: number;
  updated_at: string;
};

export type OwnerWebsitePublication = {
  salonId: string;
  slug: string | null;
  templateKey: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  revision: number;
};

export class OwnerWebsitePublishError extends Error {
  constructor(
    public readonly code:
      | 'invalid-draft'
      | 'unauthorized'
      | 'invalid-salon'
      | 'slug-conflict'
      | 'database'
      | 'verification',
    message: string,
  ) {
    super(message);
    this.name = 'OwnerWebsitePublishError';
  }
}

export interface OwnerWebsitePublishingDependencies {
  client: NexoraSupabaseClient;
  resolveSalon: typeof resolveOwnerSalonId;
  authenticatedUserId: typeof getAuthenticatedUserId;
  now: () => string;
}

function dependencies(): OwnerWebsitePublishingDependencies {
  return {
    client: requireSupabase(),
    resolveSalon: resolveOwnerSalonId,
    authenticatedUserId: getAuthenticatedUserId,
    now: () => new Date().toISOString(),
  };
}

export function normalizeWebsiteSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export function publicationTemplateKey(data: SalonData): string {
  const configured = data.bookingTemplateKey?.trim();
  if (configured) return configured;
  const theme = normalizeThemeId(data.templateId);
  // `hair` is the legacy visual slot represented by the live `classic`
  // database template. The other five visual ids are live template keys.
  return theme === 'hair' ? 'classic' : theme;
}

export function validateOwnerWebsiteDraft(data: SalonData, requestedSlug: string): string[] {
  const issues: string[] = [];
  if (!normalizeWebsiteSlug(requestedSlug)) issues.push('Choose a valid website address.');
  if (!data.salonName.trim()) issues.push('Add the salon name.');
  if (!(data.tagline.trim() || data.about.trim())) issues.push('Add a tagline or salon description.');
  if (!(data.phone.trim() || data.email.trim())) issues.push('Add a contact phone or email.');
  if (!data.templateId) issues.push('Select a website template.');
  if (!data.websiteAppearance) issues.push('Select a website appearance.');
  if (!data.reviewedContent) issues.push('Review the website content before publishing.');
  if (!data.services?.length) issues.push('Add at least one service.');
  return issues;
}

function asRecord(value: Json): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : {};
}

function publicationConfig(existing: Json, data: SalonData): Json {
  const current = asRecord(existing);
  const currentProfile = asRecord((current.profile ?? {}) as Json);
  return {
    ...current,
    profile: {
      ...currentProfile,
      name: data.salonName.trim(),
      tagline: data.tagline.trim(),
      description: data.about.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address?.fullAddress?.trim() || '',
      area: data.address?.area?.trim() || '',
      city: data.address?.city?.trim() || '',
    },
  };
}

function databaseMessage(error: unknown, fallback: string): string {
  const value = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : null;
  if (value?.code === '23505') return 'That website address is already in use.';
  if (value?.code === '42501' || value?.code === 'PGRST301') {
    return 'You do not have permission to publish this salon.';
  }
  return typeof value?.message === 'string' && value.message.trim() ? value.message : fallback;
}

async function authorizedSalon(
  deps: OwnerWebsitePublishingDependencies,
): Promise<{ salonId: string; userId: string }> {
  const resolution = await deps.resolveSalon();
  if (resolution.status !== 'resolved') {
    throw new OwnerWebsitePublishError('unauthorized', ownerSalonMessage(resolution));
  }
  const userId = await deps.authenticatedUserId();
  if (!userId) {
    throw new OwnerWebsitePublishError('unauthorized', 'Your authenticated owner session could not be verified.');
  }
  return { salonId: resolution.salonId, userId };
}

async function websiteForSalon(client: NexoraSupabaseClient, salonId: string): Promise<WebsiteRow | null> {
  const result = await client
    .from('salon_public_websites')
    .select('salon_id,slug,template_key,config,is_published,published_at,published_by,published_revision,updated_at')
    .eq('salon_id', salonId)
    .maybeSingle();
  if (result.error) {
    throw new OwnerWebsitePublishError('database', databaseMessage(result.error, 'Could not read website publication state.'));
  }
  return result.data as WebsiteRow | null;
}

export async function readOwnerWebsitePublicationWithDependencies(
  deps: OwnerWebsitePublishingDependencies,
): Promise<OwnerWebsitePublication> {
  const { salonId } = await authorizedSalon(deps);
  const website = await websiteForSalon(deps.client, salonId);
  return {
    salonId,
    slug: website?.slug ?? null,
    templateKey: website?.template_key ?? null,
    isPublished: website?.is_published === true,
    publishedAt: website?.published_at ?? null,
    revision: website?.published_revision ?? 0,
  };
}

export function readOwnerWebsitePublication(): Promise<OwnerWebsitePublication> {
  return readOwnerWebsitePublicationWithDependencies(dependencies());
}

export async function publishOwnerWebsiteWithDependencies(
  data: SalonData,
  requestedSlug: string,
  deps: OwnerWebsitePublishingDependencies,
): Promise<OwnerWebsitePublication> {
  const issues = validateOwnerWebsiteDraft(data, requestedSlug);
  if (issues.length) throw new OwnerWebsitePublishError('invalid-draft', issues.join(' '));

  const slug = normalizeWebsiteSlug(requestedSlug);
  const templateKey = publicationTemplateKey(data);
  const { salonId, userId } = await authorizedSalon(deps);

  // Re-read authoritative salon/service data under the authenticated session.
  // These queries fail closed under RLS; the local draft is never sufficient
  // proof that the salon is publishable.
  const [salonResult, serviceResult, existing] = await Promise.all([
    deps.client.from('salons')
      .select('id,name,address,city,phone,email,is_active,verified,accepts_online_bookings,deleted_at')
      .eq('id', salonId)
      .single(),
    deps.client.from('services')
      .select('id')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .eq('is_bookable_online', true)
      .is('deleted_at', null)
      .limit(1),
    websiteForSalon(deps.client, salonId),
  ]);

  if (salonResult.error) {
    throw new OwnerWebsitePublishError('database', databaseMessage(salonResult.error, 'Could not validate the salon.'));
  }
  if (serviceResult.error) {
    throw new OwnerWebsitePublishError('database', databaseMessage(serviceResult.error, 'Could not validate salon services.'));
  }
  const salon = salonResult.data;
  if (!salon || !salon.is_active || salon.deleted_at || !salon.verified || !salon.accepts_online_bookings) {
    throw new OwnerWebsitePublishError('invalid-salon', 'The salon must be active, verified, and enabled for online booking before publishing.');
  }
  if (!salon.name?.trim() || !salon.address?.trim() || !salon.city?.trim() || !(salon.phone?.trim() || salon.email?.trim())) {
    throw new OwnerWebsitePublishError('invalid-salon', 'Complete the salon name, address, city, and contact details in the database before publishing.');
  }
  if (!serviceResult.data?.length) {
    throw new OwnerWebsitePublishError('invalid-salon', 'Add at least one active online-bookable service before publishing.');
  }

  const timestamp = deps.now();
  const config = publicationConfig(existing?.config ?? {}, data);
  const values = {
    slug,
    template_key: templateKey,
    config,
    is_published: true,
    published_at: timestamp,
    published_by: userId,
    published_revision: (existing?.published_revision ?? 0) + 1,
    updated_at: timestamp,
  };

  const write = existing
    ? deps.client.from('salon_public_websites').update(values).eq('salon_id', salonId)
    : deps.client.from('salon_public_websites').insert({ salon_id: salonId, ...values });
  const writeResult = await write
    .select('salon_id,slug,template_key,config,is_published,published_at,published_by,published_revision,updated_at')
    .single();
  if (writeResult.error) {
    const code = writeResult.error.code === '23505' ? 'slug-conflict' : 'database';
    throw new OwnerWebsitePublishError(code, databaseMessage(writeResult.error, 'Website publication failed.'));
  }

  // Persistence verification is a separate database read. UI success is not
  // derived from the mutation response alone.
  const persisted = await websiteForSalon(deps.client, salonId);
  if (!persisted || persisted.salon_id !== salonId || !persisted.is_published || persisted.slug !== slug) {
    throw new OwnerWebsitePublishError('verification', 'The website could not be verified as published.');
  }

  return {
    salonId,
    slug: persisted.slug,
    templateKey: persisted.template_key,
    isPublished: true,
    publishedAt: persisted.published_at,
    revision: persisted.published_revision,
  };
}

export function publishOwnerWebsite(data: SalonData, slug: string): Promise<OwnerWebsitePublication> {
  return publishOwnerWebsiteWithDependencies(data, slug, dependencies());
}
