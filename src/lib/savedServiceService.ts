import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseCatalogThemeId } from './themeCatalogService';
import { requireSupabase } from './supabaseClient';

export interface SavedPredefinedService {
  id: string;
  businessId: string;
  themeId: string;
  themeKey: DatabaseCatalogThemeId;
  categoryId: string;
  predefinedServiceId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  status: 'active' | 'inactive' | 'archived';
  featured: boolean;
}

export interface SavePredefinedServicesResult {
  businessId: string;
  themeId: DatabaseCatalogThemeId;
  requestedCount: number;
  insertedCount: number;
  existingCount: number;
  services: SavedPredefinedService[];
}

export class SavedServiceError extends Error {
  constructor(message = 'Unable to save the selected services. Please try again.') {
    super(message);
    this.name = 'SavedServiceError';
  }
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown, label: string): UnknownRecord => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SavedServiceError(`Invalid ${label} returned by the database.`);
  }
  return value as UnknownRecord;
};

const asString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new SavedServiceError(`Invalid ${label} returned by the database.`);
  }
  return value;
};

const asNumber = (value: unknown, label: string): number => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new SavedServiceError(`Invalid ${label} returned by the database.`);
  }
  return number;
};

/**
 * Saves only predefined IDs from one database theme. M20 derives the tenant
 * from auth.uid() + business_members; no client-provided salon/business ID is
 * accepted or trusted. Exported with a client for request-boundary tests.
 */
export async function savePredefinedServicesWithClient(
  client: SupabaseClient,
  themeId: DatabaseCatalogThemeId,
  predefinedServiceIds: string[],
): Promise<SavePredefinedServicesResult> {
  const uniqueIds = Array.from(new Set(predefinedServiceIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    throw new SavedServiceError('Select at least one suggested service.');
  }

  const { data, error } = await client.rpc('save_predefined_services', {
    p_theme_id: themeId,
    p_predefined_service_ids: uniqueIds,
  });
  if (error) {
    console.error('Save predefined services RPC failed:', error);
    const message = typeof error.message === 'string' && /log in|salon|permission/i.test(error.message)
      ? error.message
      : undefined;
    throw new SavedServiceError(message);
  }

  const payload = asRecord(data, 'save response');
  const returnedThemeId = asString(payload.theme_id, 'saved theme_id');
  if (returnedThemeId !== themeId) {
    throw new SavedServiceError('The database returned services for a different theme.');
  }

  const businessId = asString(payload.business_id, 'saved business_id');
  const requestedIdSet = new Set(uniqueIds);
  const rawServices = Array.isArray(payload.services) ? payload.services : [];
  const services = rawServices.map((rawValue): SavedPredefinedService => {
    const raw = asRecord(rawValue, 'saved service');
    const predefinedServiceId = asString(raw.predefined_service_id, 'predefined_service_id');
    if (!requestedIdSet.has(predefinedServiceId)) {
      throw new SavedServiceError('The database returned an unrequested predefined service.');
    }
    if (asString(raw.business_id, 'service business_id') !== businessId) {
      throw new SavedServiceError('The database returned a service for a different salon.');
    }
    if (asString(raw.theme_key, 'service theme key') !== themeId) {
      throw new SavedServiceError('The database returned a cross-theme saved service.');
    }
    const status = asString(raw.status, 'saved service status');
    if (status !== 'active' && status !== 'inactive' && status !== 'archived') {
      throw new SavedServiceError('Invalid saved service status returned by the database.');
    }

    return {
      id: asString(raw.id, 'saved service id'),
      businessId,
      themeId: asString(raw.theme_id, 'service theme_id'),
      themeKey: themeId,
      categoryId: asString(raw.category_id, 'service category_id'),
      predefinedServiceId,
      name: asString(raw.name, 'saved service name'),
      category: asString(raw.category, 'saved service category'),
      description: typeof raw.description === 'string' ? raw.description : '',
      price: asNumber(raw.price_paise, 'saved service price') / 100,
      duration: asNumber(raw.duration_minutes, 'saved service duration'),
      status,
      featured: raw.is_featured === true,
    };
  });

  const requestedCount = asNumber(payload.requested_count, 'requested count');
  const insertedCount = asNumber(payload.inserted_count, 'inserted count');
  const existingCount = asNumber(payload.existing_count, 'existing count');
  if (requestedCount !== uniqueIds.length || services.length !== uniqueIds.length) {
    throw new SavedServiceError('The database did not return every selected service.');
  }
  if (insertedCount + existingCount !== requestedCount) {
    throw new SavedServiceError('Invalid save counts returned by the database.');
  }

  return {
    businessId,
    themeId,
    requestedCount,
    insertedCount,
    existingCount,
    services,
  };
}

export function savePredefinedServices(
  themeId: DatabaseCatalogThemeId,
  predefinedServiceIds: string[],
): Promise<SavePredefinedServicesResult> {
  return savePredefinedServicesWithClient(requireSupabase(), themeId, predefinedServiceIds);
}
