/**
 * PHASE 15.7 — original-platform video destinations.
 *
 * External video URLs are untrusted owner data. This module is the single
 * gate used before a public card/player can open an external platform:
 *   - http(s) only, no credentials/control characters;
 *   - exact provider hosts (never `youtube.example.com` lookalikes);
 *   - a provider-native *video* path, not a profile/home page;
 *   - native id consistency when a record also carries externalVideoId;
 *   - the exact stored original URL is returned unchanged (apart from trim).
 *
 * No API keys are required. URL parsing and validation happen locally.
 */
import type { SocialVideo } from '../types';
import type { SiteHeaderThemeId } from './siteNavigation';

export type VideoPlatform = SocialVideo['platform'];

export interface PlatformVideoUrlSuccess {
  ok: true;
  /** Exact validated input (trimmed); query string and hash are preserved. */
  url: string;
  platform: VideoPlatform;
  externalVideoId: string | null;
}

export interface PlatformVideoUrlFailure {
  ok: false;
  code:
    | 'empty'
    | 'invalid_url'
    | 'unsafe_protocol'
    | 'unsafe_credentials'
    | 'wrong_platform'
    | 'wrong_theme'
    | 'not_a_video'
    | 'id_mismatch';
  message: string;
}

export type PlatformVideoUrlResult = PlatformVideoUrlSuccess | PlatformVideoUrlFailure;

export interface OriginalVideoDestinationRecord {
  platform: VideoPlatform;
  url: string;
  originalUrl?: string | null;
  externalVideoId?: string | null;
  themeId?: string | null;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_ID = /^[A-Za-z0-9_-]{6,}$/;
const FACEBOOK_ID = /^[A-Za-z0-9._-]{2,}$/;
const TIKTOK_ID = /^\d{5,}$/;
const MAX_EXTERNAL_URL_LENGTH = 4_096;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

function failure(
  code: PlatformVideoUrlFailure['code'],
  message: string,
): PlatformVideoUrlFailure {
  return { ok: false, code, message };
}

type ParsedExternalUrlResult =
  | { ok: true; raw: string; parsed: URL }
  | PlatformVideoUrlFailure;

function parsedExternalUrl(raw: unknown): ParsedExternalUrlResult {
  if (typeof raw !== 'string' || !raw.trim()) {
    return failure('empty', 'The original video URL is missing.');
  }
  const value = raw.trim();
  if (value.length > MAX_EXTERNAL_URL_LENGTH || CONTROL_CHARACTERS.test(value)) {
    return failure('invalid_url', 'The original video URL is invalid.');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return failure('invalid_url', 'The original video URL is invalid.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return failure('unsafe_protocol', 'Only secure web video links can be opened.');
  }
  if (parsed.username || parsed.password) {
    return failure('unsafe_credentials', 'Video links containing credentials cannot be opened.');
  }
  return { ok: true, raw: value, parsed };
}

function host(parsed: URL): string {
  return parsed.hostname.toLowerCase().replace(/\.$/, '');
}

function isHostOrSubdomain(value: string, apex: string): boolean {
  return value === apex || value.endsWith(`.${apex}`);
}

export function platformForVideoUrl(raw: unknown): VideoPlatform | null {
  const candidate = parsedExternalUrl(raw);
  if (candidate.ok === false) return null;
  const hostname = host(candidate.parsed);
  if (
    hostname === 'youtu.be' ||
    hostname === 'youtube-nocookie.com' ||
    isHostOrSubdomain(hostname, 'youtube.com') ||
    isHostOrSubdomain(hostname, 'youtube-nocookie.com')
  ) return 'youtube';
  if (isHostOrSubdomain(hostname, 'instagram.com')) return 'instagram';
  if (
    hostname === 'fb.watch' ||
    hostname === 'fb.com' ||
    isHostOrSubdomain(hostname, 'facebook.com')
  ) return 'facebook';
  if (isHostOrSubdomain(hostname, 'tiktok.com')) return 'tiktok';
  return null;
}

/** Extract a native id only from a recognised single-video URL. */
export function nativeVideoIdFromUrl(
  raw: unknown,
  expectedPlatform?: VideoPlatform,
): string | null {
  const candidate = parsedExternalUrl(raw);
  if (candidate.ok === false) return null;
  const { parsed } = candidate;
  const detected = platformForVideoUrl(candidate.raw);
  if (!detected || (expectedPlatform && detected !== expectedPlatform)) return null;
  const hostname = host(parsed);
  const segments = parsed.pathname.split('/').filter(Boolean);

  if (detected === 'youtube') {
    if (hostname === 'youtu.be') {
      const id = segments[0] || '';
      return YOUTUBE_ID.test(id) ? id : null;
    }
    const watchId = parsed.searchParams.get('v') || '';
    if (/^\/watch\/?$/i.test(parsed.pathname) && YOUTUBE_ID.test(watchId)) return watchId;
    const pathMatch = parsed.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/i);
    return pathMatch && YOUTUBE_ID.test(pathMatch[1]) ? pathMatch[1] : null;
  }

  if (detected === 'instagram') {
    const match = parsed.pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)(?:\/|$)/i);
    return match && INSTAGRAM_ID.test(match[1]) ? match[1] : null;
  }

  if (detected === 'facebook') {
    if (hostname === 'fb.watch') {
      const id = segments[0] || '';
      return FACEBOOK_ID.test(id) ? id : null;
    }
    const queryId = parsed.searchParams.get('v') || '';
    if (FACEBOOK_ID.test(queryId) && /\/watch\/?$/i.test(parsed.pathname)) return queryId;
    const videoMatch = parsed.pathname.match(/\/(?:videos|reel|watch)\/([A-Za-z0-9._-]+)(?:\/|$)/i);
    return videoMatch && FACEBOOK_ID.test(videoMatch[1]) ? videoMatch[1] : null;
  }

  // Full TikTok video links use /@handle/video/<numeric id>. TikTok's own
  // vm/vt short-link hosts intentionally use an opaque first path segment.
  const full = parsed.pathname.match(/\/@[^/]+\/video\/(\d+)(?:\/|$)/i);
  if (full && TIKTOK_ID.test(full[1])) return full[1];
  if ((hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') && segments[0]) {
    return segments[0];
  }
  return null;
}

/**
 * Strict provider-aware validation for one original video destination.
 * The validated URL is never canonicalised or rebuilt.
 */
export function validatePlatformVideoUrl(
  raw: unknown,
  platform: VideoPlatform,
  expectedExternalVideoId?: string | null,
): PlatformVideoUrlResult {
  const candidate = parsedExternalUrl(raw);
  if (candidate.ok === false) return candidate;
  const detected = platformForVideoUrl(candidate.raw);
  if (!detected || detected !== platform) {
    return failure('wrong_platform', `This is not a valid ${platform} video link.`);
  }
  const externalVideoId = nativeVideoIdFromUrl(candidate.raw, platform);
  if (!externalVideoId) {
    return failure('not_a_video', 'This link does not point to a single platform video.');
  }
  const expected = typeof expectedExternalVideoId === 'string'
    ? expectedExternalVideoId.trim()
    : '';
  if (expected && expected !== externalVideoId) {
    return failure('id_mismatch', 'The saved video URL does not match its platform video id.');
  }
  return {
    ok: true,
    url: candidate.raw,
    platform,
    externalVideoId,
  };
}

/**
 * Resolve the exact external destination for a stored record.
 *
 * New Phase 15.7 records carry `originalUrl`; when present it is authoritative
 * and an invalid value fails closed (we never silently swap it for a modified
 * or unrelated URL). Legacy Phase 15.1–15.6 rows fall back to `url` and may
 * infer the provider when their old platform label was incorrect.
 */
export function originalPlatformVideoDestination(
  record: OriginalVideoDestinationRecord | null | undefined,
): PlatformVideoUrlResult {
  if (!record) return failure('empty', 'The original video is unavailable.');
  const hasOriginal = typeof record.originalUrl === 'string' && !!record.originalUrl.trim();
  const candidate = hasOriginal ? record.originalUrl : record.url;
  const strict = validatePlatformVideoUrl(candidate, record.platform, record.externalVideoId);
  if (strict.ok || hasOriginal) return strict;

  // Grandfathered records did not preserve originalUrl and some pre-15.7 rows
  // carried a stale platform label. Infer only from the exact legacy URL.
  const inferred = platformForVideoUrl(candidate);
  if (!inferred) return strict;
  return validatePlatformVideoUrl(candidate, inferred, record.externalVideoId);
}

export function safeOriginalPlatformVideoUrl(
  record: OriginalVideoDestinationRecord | null | undefined,
): string {
  const result = originalPlatformVideoDestination(record);
  return result.ok ? result.url : '';
}

/** Theme gate applied again at interaction time to reject stale card objects. */
export function originalVideoDestinationForTheme(
  record: OriginalVideoDestinationRecord | null | undefined,
  themeId: SiteHeaderThemeId,
): PlatformVideoUrlResult {
  if (record?.themeId && record.themeId !== themeId) {
    return failure('wrong_theme', 'This video belongs to a different website theme.');
  }
  return originalPlatformVideoDestination(record);
}

/** Provider-aware validation for an optional original channel/profile link. */
export function safePlatformChannelUrl(raw: unknown, platform: VideoPlatform): string {
  const candidate = parsedExternalUrl(raw);
  if (candidate.ok === false) return '';
  if (platformForVideoUrl(candidate.raw) !== platform) return '';
  const { parsed } = candidate;

  // A source link must not itself be a video destination.
  if (nativeVideoIdFromUrl(candidate.raw, platform)) return '';
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (platform === 'youtube') {
    const first = segments[0] || '';
    if (!(/^@[^/]+$/.test(first) || ['channel', 'c', 'user'].includes(first))) return '';
    if (['channel', 'c', 'user'].includes(first) && !segments[1]) return '';
  } else if (platform === 'instagram') {
    if (segments.length !== 1 || ['p', 'reel', 'reels', 'tv'].includes((segments[0] || '').toLowerCase())) return '';
  } else if (platform === 'tiktok') {
    if (segments.length !== 1 || !segments[0].startsWith('@')) return '';
  } else if (segments.length === 0) {
    return '';
  }
  return candidate.raw;
}

export interface OpenOriginalVideoResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate immediately before opening. `_blank` + noopener/noreferrer keeps
 * the salon page isolated from the external platform. The function accepts an
 * opener seam for tests; it never handles or exposes credentials/API keys.
 */
export function openOriginalPlatformVideo(
  record: OriginalVideoDestinationRecord | null | undefined,
  options: {
    themeId?: SiteHeaderThemeId;
    opener?: (url: string, target: string, features: string) => Window | null | undefined;
  } = {},
): OpenOriginalVideoResult {
  const destination = options.themeId
    ? originalVideoDestinationForTheme(record, options.themeId)
    : originalPlatformVideoDestination(record);
  if (destination.ok === false) return { ok: false, error: destination.message };
  if (typeof window === 'undefined' && !options.opener) {
    return { ok: false, error: 'External video opening is unavailable here.' };
  }
  const opener = options.opener || window.open.bind(window);
  try {
    opener(destination.url, '_blank', 'noopener,noreferrer');
    return { ok: true, url: destination.url };
  } catch {
    return { ok: false, error: 'The original platform could not be opened. Please try again.' };
  }
}
