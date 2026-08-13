import type { SupabaseClient } from '@supabase/supabase-js';
import type { PredefinedService, ThemeId } from './themeServices';
import { requireSupabase } from './supabaseClient';

/** The five Phase 2–6 catalogs seeded by M18. The preserved original `hair`
 * theme intentionally remains outside this Session 1 database connection. */
export const DATABASE_CATALOG_THEME_IDS = [
  'barber_mens_grooming',
  'hair_studio_color_bar',
  'beauty_skin_spa',
  'family_full_service',
  'nail_lash_studio',
] as const;

export type DatabaseCatalogThemeId = (typeof DATABASE_CATALOG_THEME_IDS)[number];

const DATABASE_THEME_SET = new Set<string>(DATABASE_CATALOG_THEME_IDS);

export function isDatabaseCatalogTheme(themeId: ThemeId): themeId is DatabaseCatalogThemeId {
  return DATABASE_THEME_SET.has(themeId);
}

export interface ThemeCatalogTheme {
  id: string;
  themeId: DatabaseCatalogThemeId;
  name: string;
  description: string;
  targetAudience: string;
  uiConfig: Record<string, unknown>;
  sortOrder: number;
}

export interface ThemeCatalogCategory {
  id: string;
  themeId: string;
  name: string;
  sortOrder: number;
}

export interface ThemeCatalogPredefinedService extends PredefinedService {
  id: string;
  themeId: string;
  categoryId: string;
  sortOrder: number;
  isSuggested: boolean;
  suggestedSortOrder: number | null;
}

export interface ThemeServiceCatalog {
  theme: ThemeCatalogTheme;
  categories: ThemeCatalogCategory[];
  predefinedServices: ThemeCatalogPredefinedService[];
  suggestedServices: ThemeCatalogPredefinedService[];
}

export class ThemeCatalogLoadError extends Error {
  constructor(message = 'Unable to load this theme’s service catalog. Please try again.') {
    super(message);
    this.name = 'ThemeCatalogLoadError';
  }
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown, label: string): UnknownRecord => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ThemeCatalogLoadError(`Invalid ${label} returned by the database.`);
  }
  return value as UnknownRecord;
};

const asString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ThemeCatalogLoadError(`Invalid ${label} returned by the database.`);
  }
  return value;
};

const asNumber = (value: unknown, label: string): number => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new ThemeCatalogLoadError(`Invalid ${label} returned by the database.`);
  }
  return number;
};

const asNullableString = (value: unknown, label: string): string | undefined => {
  if (value === null || value === undefined) return undefined;
  return asString(value, label);
};

const mapService = (
  rawValue: unknown,
  expectedThemeDatabaseId: string,
  categoryIds: Set<string>,
): ThemeCatalogPredefinedService => {
  const raw = asRecord(rawValue, 'predefined service');
  const themeId = asString(raw.theme_id, 'predefined service theme_id');
  const categoryId = asString(raw.category_id, 'predefined service category_id');
  if (themeId !== expectedThemeDatabaseId || !categoryIds.has(categoryId)) {
    throw new ThemeCatalogLoadError('Cross-theme service data was rejected.');
  }

  const defaultPricePaise = asNumber(raw.default_price_paise, 'default price');
  const duration = asNumber(raw.default_duration_minutes, 'default duration');
  const isSuggested = raw.is_suggested === true;
  const suggestedSortOrder = raw.suggested_sort_order == null
    ? null
    : asNumber(raw.suggested_sort_order, 'suggested sort order');

  return {
    id: asString(raw.id, 'predefined service id'),
    themeId,
    categoryId,
    name: asString(raw.name, 'predefined service name'),
    category: '', // Filled from the validated category relationship below.
    description: typeof raw.description === 'string' ? raw.description : '',
    price: defaultPricePaise / 100,
    duration,
    sortOrder: asNumber(raw.sort_order, 'predefined service sort order'),
    isSuggested,
    suggestedLabel: asNullableString(raw.suggested_label, 'suggested label'),
    suggestedSortOrder,
  };
};

/**
 * Fetches one database-filtered catalog through M19. The only database read is
 * the theme-scoped RPC; no global theme/category/service query exists here.
 * Exported with a client argument so the request boundary can be unit-tested.
 */
export async function fetchThemeServiceCatalog(
  client: SupabaseClient,
  themeId: DatabaseCatalogThemeId,
): Promise<ThemeServiceCatalog> {
  const { data, error } = await client.rpc('get_theme_service_catalog', {
    p_theme_id: themeId,
  });

  if (error) {
    console.error('Theme catalog RPC failed:', error);
    throw new ThemeCatalogLoadError();
  }
  if (!data) {
    throw new ThemeCatalogLoadError('No active service catalog exists for this theme.');
  }

  const payload = asRecord(data, 'theme catalog');
  const rawTheme = asRecord(payload.theme, 'theme');
  const returnedThemeId = asString(rawTheme.theme_id, 'theme_id');
  if (returnedThemeId !== themeId || !isDatabaseCatalogTheme(returnedThemeId as ThemeId)) {
    throw new ThemeCatalogLoadError('The database returned a different theme catalog.');
  }

  const themeDatabaseId = asString(rawTheme.id, 'theme database id');
  const rawCategories = Array.isArray(payload.categories) ? payload.categories : [];
  const categories = rawCategories.map((rawValue): ThemeCatalogCategory => {
    const raw = asRecord(rawValue, 'service category');
    const categoryThemeId = asString(raw.theme_id, 'category theme_id');
    if (categoryThemeId !== themeDatabaseId) {
      throw new ThemeCatalogLoadError('Cross-theme category data was rejected.');
    }
    return {
      id: asString(raw.id, 'category id'),
      themeId: categoryThemeId,
      name: asString(raw.name, 'category name'),
      sortOrder: asNumber(raw.sort_order, 'category sort order'),
    };
  });

  const categoryIds = new Set(categories.map((category) => category.id));
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const rawServices = Array.isArray(payload.predefined_services)
    ? payload.predefined_services
    : [];
  const predefinedServices = rawServices.map((rawValue) => {
    const service = mapService(rawValue, themeDatabaseId, categoryIds);
    return { ...service, category: categoryNames.get(service.categoryId) as string };
  });

  const servicesById = new Map(predefinedServices.map((service) => [service.id, service]));
  const rawSuggested = Array.isArray(payload.suggested_services)
    ? payload.suggested_services
    : [];
  const suggestedServices = rawSuggested.map((rawValue) => {
    const mapped = mapService(rawValue, themeDatabaseId, categoryIds);
    const canonical = servicesById.get(mapped.id);
    if (!canonical || !mapped.isSuggested) {
      throw new ThemeCatalogLoadError('Invalid suggested-service relationship returned by the database.');
    }
    return { ...canonical, suggestedLabel: mapped.suggestedLabel, suggestedSortOrder: mapped.suggestedSortOrder };
  });

  return {
    theme: {
      id: themeDatabaseId,
      themeId: returnedThemeId as DatabaseCatalogThemeId,
      name: asString(rawTheme.name, 'theme name'),
      description: typeof rawTheme.description === 'string' ? rawTheme.description : '',
      targetAudience: typeof rawTheme.target_audience === 'string' ? rawTheme.target_audience : '',
      uiConfig: asRecord(rawTheme.ui_config, 'theme ui_config'),
      sortOrder: asNumber(rawTheme.sort_order, 'theme sort order'),
    },
    categories,
    predefinedServices,
    suggestedServices,
  };
}

export function loadThemeServiceCatalog(themeId: DatabaseCatalogThemeId): Promise<ThemeServiceCatalog> {
  return fetchThemeServiceCatalog(requireSupabase(), themeId);
}
