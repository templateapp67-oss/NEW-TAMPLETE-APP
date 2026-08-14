/**
 * PHASE 11.1 — HERO DATA HELPERS (all five themes).
 *
 * Presentation-only helpers for the hero section:
 *   - `heroMedia(themeId, data)` → the theme's OWN hero visuals. Owner-uploaded
 *     media always wins; each theme falls back to a completely different
 *     imagery set so no two themes ever show the same hero picture.
 *   - `heroVideo(themeId, data)` → optional hero reel (owner `socialVideos`).
 *   - `heroMeta(themeId, data, now)` → optional rating / location / live
 *     open-status information for the hero meta strip.
 *
 * NO database or service architecture is touched — this reads the existing
 * `SalonData` shape and the Phase 10.5 salon-status + Phase 10.8 review
 * engines that are already in the app.
 */
import type { SalonData, SocialVideo } from '../types';
import type { SiteHeaderThemeId } from './siteNavigation';
import { resolveSalonStatus, salonNow } from './salonStatus';
import type { SalonLiveStatus } from './salonStatus';
import { publicReviews, ratingSummary, reviewBusinessId } from './siteReviews';

export interface HeroVisual {
  url: string;
  /** Which copy key in `heroText` describes this visual. */
  altKey: 'mediaAlt' | 'mediaAltB' | 'mediaAltC';
}

export interface HeroMedia {
  /** Primary above-the-fold visual for the theme. */
  primary: HeroVisual;
  /** Supporting visuals — each theme uses a different number of them. */
  support: HeroVisual[];
}

/**
 * Per-theme fallback imagery. Deliberately five DISTINCT sets:
 * barber chairs / editorial colour / spa rituals / family salon / nail-lash.
 * No image id is repeated across two themes.
 */
const HERO_FALLBACKS: Record<SiteHeaderThemeId, string[]> = {
  barber_mens_grooming: [
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=1000&auto=format&fit=crop',
  ],
  hair_studio_color_bar: [
    'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=1400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522336572468-97b06e8ef143?q=80&w=1000&auto=format&fit=crop',
  ],
  beauty_skin_spa: [
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop',
  ],
  family_full_service: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop',
  ],
  nail_lash_studio: [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1000&auto=format&fit=crop',
  ],
};

/** How many supporting visuals each theme's own hero layout consumes. */
const SUPPORT_COUNT: Record<SiteHeaderThemeId, number> = {
  barber_mens_grooming: 2,
  hair_studio_color_bar: 2,
  beauty_skin_spa: 2,
  family_full_service: 2,
  nail_lash_studio: 2,
};

const ALT_KEYS: HeroVisual['altKey'][] = ['mediaAlt', 'mediaAltB', 'mediaAltC'];

function galleryUrls(data: SalonData): string[] {
  return (data.gallery || [])
    .map((item) => (item && typeof item.url === 'string' ? item.url.trim() : ''))
    .filter((url) => url.length > 0);
}

/**
 * Resolves the hero visuals for one theme. Owner media first
 * (`heroImageUrl`, then gallery), theme fallbacks after — always de-duplicated
 * so a hero never shows the same picture twice.
 */
export function heroMedia(themeId: SiteHeaderThemeId, data: SalonData): HeroMedia {
  const fallbacks = HERO_FALLBACKS[themeId] || HERO_FALLBACKS.barber_mens_grooming;
  const owner = [(data.heroImageUrl || '').trim(), ...galleryUrls(data)].filter(Boolean);
  const pool: string[] = [];
  for (const url of [...owner, ...fallbacks]) {
    if (!pool.includes(url)) pool.push(url);
  }
  const needed = 1 + SUPPORT_COUNT[themeId];
  while (pool.length < needed) pool.push(fallbacks[pool.length % fallbacks.length]);
  const visuals = pool.slice(0, needed).map((url, index) => ({ url, altKey: ALT_KEYS[index] || 'mediaAlt' }));
  return { primary: visuals[0], support: visuals.slice(1) };
}

/** Optional hero reel — only when the owner actually published a video. */
export function heroVideo(themeId: SiteHeaderThemeId, data: SalonData): SocialVideo | null {
  const videos = (data.socialVideos || []).filter((video) => video && video.thumbnailUrl && video.url);
  if (videos.length === 0) return null;
  // Themes pick a different reel where possible so the hero video is not shared.
  const index = themeId === 'nail_lash_studio' && videos.length > 1 ? 1 : 0;
  return videos[index] || videos[0];
}

export interface HeroMeta {
  /** Approved-review average, when the salon has any. */
  rating: { average: number; count: number } | null;
  /** Short location label (area/city) when the owner set an address. */
  location: string | null;
  /** Live open / closed status from the existing Phase 10.5 engine. */
  status: SalonLiveStatus;
}

/** Short "Bandra West, Mumbai" style label; never the full postal string. */
export function heroLocationLabel(data: SalonData): string | null {
  const address = data.address;
  if (!address) return null;
  const parts = [address.area, address.city].map((part) => (part || '').trim()).filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  const full = (address.fullAddress || '').trim();
  return full ? full.split(',').slice(-3).join(',').trim() : null;
}

export function heroMeta(
  themeId: SiteHeaderThemeId,
  data: SalonData,
  now: Date = salonNow(),
): HeroMeta {
  let rating: HeroMeta['rating'] = null;
  try {
    const summary = ratingSummary(publicReviews(reviewBusinessId(data), themeId));
    if (summary.count > 0) rating = summary;
  } catch {
    rating = null;
  }
  return {
    rating,
    location: heroLocationLabel(data),
    status: resolveSalonStatus(data, now),
  };
}

/**
 * Headline resolution shared by all five heroes (each theme still renders it
 * with its own typography and layout):
 *   - line 1 (`<h1>`) is the owner's real tagline whenever they set one, so
 *     the page's single H1 always describes the actual salon (SEO, Phase
 *     10.11). Falls back to the theme headline.
 *   - line 2 is always the theme's own accent line and is never shared.
 */
export function heroHeadline(
  data: SalonData,
  copy: { headline: string; headlineAccent: string },
): { main: string; accent: string; usesOwnerTagline: boolean } {
  const tagline = (data.tagline || '').trim();
  return {
    main: tagline || copy.headline,
    accent: copy.headlineAccent,
    usesOwnerTagline: tagline.length > 0,
  };
}

/** Hero description: the owner's About copy when present, else theme copy. */
export function heroDescription(data: SalonData, fallback: string): string {
  const about = (data.about || '').trim();
  return about || fallback;
}

/** Salon display name used by every hero lockup. */
export function heroSalonName(data: SalonData, fallback = 'Your Salon'): string {
  return (data.salonName || '').trim() || fallback;
}

/** Initials mark used when the owner has not uploaded a logo. */
export function heroLogoInitials(data: SalonData): string {
  const name = heroSalonName(data, 'NX');
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]).join('');
  return (letters || name.slice(0, 2)).toUpperCase();
}

export const HERO_TEST_IDS = {
  root: 'site-hero',
  brand: 'hero-brand',
  logo: 'hero-logo',
  name: 'hero-salon-name',
  headline: 'hero-headline',
  description: 'hero-description',
  primaryCta: 'hero-book-cta',
  secondaryCta: 'hero-services-cta',
  media: 'hero-media',
  video: 'hero-video',
  rating: 'hero-rating',
  location: 'hero-location',
  status: 'hero-status',
} as const;
