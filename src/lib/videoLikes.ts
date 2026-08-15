/**
 * PHASE 15.8 — video likes + current-week ranking client/service layer.
 *
 * Production path:
 *   existing Supabase Auth session + existing stable browser/session token
 *   -> database RPCs from M28 -> existing website_events interaction log.
 *
 * The browser never sends or invents a user id/salon id. A real business UUID
 * must come from the public business payload (or an existing saved service).
 * The database derives auth.uid(), validates the business/video/theme, hashes
 * the actor identity, enforces uniqueness and calculates week boundaries.
 *
 * When Supabase is not configured, the existing offline website-builder mode
 * gets a clearly isolated local preview store keyed by the real website slug,
 * theme, video and existing bookingBrowserId() session. Production failures
 * never fall back to local data.
 */
import type { SalonData } from '../types';
import { isSiteHeaderTheme, type SiteHeaderThemeId } from './siteNavigation';
import type { VideoGalleryItem } from './siteVideoGallery';
import { bookingBrowserId } from './siteBookingFlow';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export const VIDEO_LIKE_STATE_RPC = 'get_video_like_state';
export const VIDEO_LIKE_WRITE_RPC = 'like_video';
export const VIDEO_WEEKLY_TOP_RPC = 'get_weekly_top_videos';
export const VIDEO_LIKE_STORE_KEY = 'nexora_video_likes_v1';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_VIDEO_KEYS = 50;

export interface VideoLikeSnapshot {
  videoId: string;
  themeId: SiteHeaderThemeId;
  kind: 'short' | 'long';
  totalLikes: number;
  weeklyLikes: number;
  likedByViewer: boolean;
}

export interface WeeklyRankedVideo {
  rank: number;
  item: VideoGalleryItem;
  totalLikes: number;
  weeklyLikes: number;
}

export interface VideoWeekBounds {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
}

export type VideoLikeContext =
  | { mode: 'database'; businessId: string }
  | { mode: 'local'; scope: string }
  | { mode: 'unavailable'; reason: string };

export type VideoLikeLoadResult =
  | {
      ok: true;
      snapshots: Record<string, VideoLikeSnapshot>;
      weekStart: string;
      weekEnd: string;
      source: 'database' | 'local';
    }
  | { ok: false; error: string; code: 'unavailable' | 'network' | 'invalid_response' };

export type VideoLikeMutationResult =
  | { ok: true; snapshot: VideoLikeSnapshot; duplicate: boolean; source: 'database' | 'local' }
  | { ok: false; error: string; code: 'unavailable' | 'network' | 'invalid_response' };

export interface LocalVideoLikeEvent {
  scope: string;
  themeId: SiteHeaderThemeId;
  videoId: string;
  kind: 'short' | 'long';
  sessionToken: string;
  likedAt: string;
}

interface LocalVideoLikeStore {
  version: 1;
  events: LocalVideoLikeEvent[];
}

let injectedLocalEvents: LocalVideoLikeEvent[] | null = null;
let memoryLocalEvents: LocalVideoLikeEvent[] = [];
let injectedFailure: 'load' | 'like' | null = null;
let cachedExistingBrowserSession: string | null = null;

/** Cache the existing booking session for this page lifetime if storage is blocked. */
export function videoLikeSessionToken(): string {
  if (!cachedExistingBrowserSession) cachedExistingBrowserSession = bookingBrowserId();
  return cachedExistingBrowserSession;
}

function nonNegativeInteger(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

/** Monday 00:00 through next Monday 00:00 in the browser's local timezone. */
export function currentVideoWeek(now: Date = new Date()): VideoWeekBounds {
  const start = new Date(now.getTime());
  start.setHours(0, 0, 0, 0);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 7);
  return { start, end, startIso: start.toISOString(), endIso: end.toISOString() };
}

export function isLikeInCurrentWeek(value: string | Date, now: Date = new Date()): boolean {
  const instant = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(instant.getTime())) return false;
  const { start, end } = currentVideoWeek(now);
  return instant >= start && instant < end;
}

export function isDatabaseBusinessId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value.trim());
}

/**
 * Resolve only a real existing business UUID. Multiple service tenant ids are
 * treated as ambiguous rather than selecting one; no fallback id is invented.
 */
export function databaseBusinessId(data: SalonData): string | null {
  const explicitValue = (data as SalonData & { businessId?: unknown }).businessId;
  const explicit = isDatabaseBusinessId(explicitValue) ? explicitValue.trim() : null;
  const serviceIds = Array.from(new Set(
    (data.services || [])
      .map((service) => service.businessId)
      .filter(isDatabaseBusinessId)
      .map((id) => id.trim()),
  ));
  if (explicit) {
    // A stale/cross-tenant service payload must not be hidden by an explicit id.
    return serviceIds.every((id) => id === explicit) ? explicit : null;
  }
  return serviceIds.length === 1 ? serviceIds[0] : null;
}

/** Existing published slug is an offline preview namespace, never a salon id. */
export function localVideoLikeScope(data: SalonData): string | null {
  const slug = typeof data.websiteSlug === 'string' ? data.websiteSlug.trim() : '';
  if (slug && slug.length <= 160) return `slug:${slug}`;
  const published = typeof data.publishedUrl === 'string' ? data.publishedUrl.trim() : '';
  if (published && published.length <= 500) return `url:${published}`;
  return null;
}

export function resolveVideoLikeContext(
  data: SalonData,
  options: { supabaseConfigured?: boolean } = {},
): VideoLikeContext {
  const configured = options.supabaseConfigured ?? isSupabaseConfigured;
  if (configured) {
    const businessId = databaseBusinessId(data);
    return businessId
      ? { mode: 'database', businessId }
      : {
          mode: 'unavailable',
          reason: 'Likes are unavailable because this website has no verified business record.',
        };
  }
  const scope = localVideoLikeScope(data);
  return scope
    ? { mode: 'local', scope }
    : {
        mode: 'unavailable',
        reason: 'Likes become available after this website has a saved publishing identity.',
      };
}

function validLocalEvent(value: unknown): value is LocalVideoLikeEvent {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<LocalVideoLikeEvent>;
  return typeof row.scope === 'string' && row.scope.length > 0 && row.scope.length <= 520
    && isSiteHeaderTheme(row.themeId)
    && typeof row.videoId === 'string' && row.videoId.length > 0 && row.videoId.length <= 200
    && (row.kind === 'short' || row.kind === 'long')
    && typeof row.sessionToken === 'string' && row.sessionToken.length >= 8 && row.sessionToken.length <= 180
    && typeof row.likedAt === 'string'
    && !Number.isNaN(new Date(row.likedAt).getTime());
}

function readLocalEvents(): LocalVideoLikeEvent[] {
  if (injectedLocalEvents) return injectedLocalEvents.slice();
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(VIDEO_LIKE_STORE_KEY);
    if (!raw) return memoryLocalEvents.slice();
    const parsed = JSON.parse(raw) as Partial<LocalVideoLikeStore>;
    return Array.isArray(parsed.events) ? parsed.events.filter(validLocalEvent) : memoryLocalEvents.slice();
  } catch {
    return memoryLocalEvents.slice();
  }
}

function writeLocalEvents(events: LocalVideoLikeEvent[]): void {
  const safe = events.filter(validLocalEvent);
  memoryLocalEvents = safe.slice();
  if (injectedLocalEvents) {
    injectedLocalEvents = safe.slice();
    return;
  }
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      VIDEO_LIKE_STORE_KEY,
      JSON.stringify({ version: 1, events: safe } satisfies LocalVideoLikeStore),
    );
  } catch {
    // Private browsing/storage quota: the UI surfaces the mutation result from
    // the in-call snapshot; no alternate identity or backend is invented.
  }
}

export function setLocalVideoLikesForTests(events: LocalVideoLikeEvent[] | null): void {
  injectedLocalEvents = events ? events.filter(validLocalEvent).map((event) => ({ ...event })) : null;
  memoryLocalEvents = events ? injectedLocalEvents?.slice() || [] : [];
}

export function readLocalVideoLikesForTests(): LocalVideoLikeEvent[] {
  return readLocalEvents();
}

export function setVideoLikeFailureForTests(value: 'load' | 'like' | null): void {
  injectedFailure = value;
}

function emptySnapshots(
  items: readonly VideoGalleryItem[],
  themeId: SiteHeaderThemeId,
): Record<string, VideoLikeSnapshot> {
  return Object.fromEntries(items.map((item) => [
    item.id,
    {
      videoId: item.id,
      themeId,
      kind: item.kind,
      totalLikes: 0,
      weeklyLikes: 0,
      likedByViewer: false,
    } satisfies VideoLikeSnapshot,
  ]));
}

function localSnapshots(
  scope: string,
  themeId: SiteHeaderThemeId,
  items: readonly VideoGalleryItem[],
  sessionToken: string,
  now: Date,
): Record<string, VideoLikeSnapshot> {
  const snapshots = emptySnapshots(items, themeId);
  const itemIds = new Set(items.map((item) => item.id));
  for (const event of readLocalEvents()) {
    if (event.scope !== scope || event.themeId !== themeId || !itemIds.has(event.videoId)) continue;
    const snapshot = snapshots[event.videoId];
    if (!snapshot) continue;
    snapshot.totalLikes += 1;
    if (isLikeInCurrentWeek(event.likedAt, now)) snapshot.weeklyLikes += 1;
    if (event.sessionToken === sessionToken) snapshot.likedByViewer = true;
  }
  return snapshots;
}

function parseDatabaseSnapshot(
  value: unknown,
  themeId: SiteHeaderThemeId,
  allowedItems: ReadonlyMap<string, VideoGalleryItem>,
): VideoLikeSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const videoId = typeof row.video_id === 'string' ? row.video_id : '';
  const item = allowedItems.get(videoId);
  if (!item || row.theme_id !== themeId) return null;
  const kind = row.video_kind === 'short' || row.video_kind === 'long'
    ? row.video_kind
    : item.kind;
  // A backend response may not relabel a Short as Long or vice versa.
  if (kind !== item.kind) return null;
  return {
    videoId,
    themeId,
    kind,
    totalLikes: nonNegativeInteger(row.total_likes),
    weeklyLikes: nonNegativeInteger(row.weekly_likes),
    likedByViewer: row.liked_by_viewer === true,
  };
}

function safeLikeError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'PGRST202' || code === '42883') {
    return 'Video likes are not connected yet. Please try again later.';
  }
  return 'Could not load video likes right now. Please try again.';
}

export async function loadVideoLikeState(options: {
  context: VideoLikeContext;
  themeId: SiteHeaderThemeId;
  items: readonly VideoGalleryItem[];
  now?: Date;
}): Promise<VideoLikeLoadResult> {
  const { context, themeId } = options;
  const items = options.items.slice(0, MAX_VIDEO_KEYS);
  if (injectedFailure === 'load') {
    return { ok: false, code: 'network', error: 'Could not load video likes right now. Please try again.' };
  }
  if (context.mode === 'unavailable') {
    return { ok: false, code: 'unavailable', error: context.reason };
  }
  const sessionToken = videoLikeSessionToken();

  if (context.mode === 'local') {
    const now = options.now || new Date();
    const week = currentVideoWeek(now);
    return {
      ok: true,
      snapshots: localSnapshots(context.scope, themeId, items, sessionToken, now),
      weekStart: week.startIso,
      weekEnd: week.endIso,
      source: 'local',
    };
  }

  if (!supabase) {
    return { ok: false, code: 'unavailable', error: 'Video likes are not connected.' };
  }
  try {
    const { data, error } = await supabase.rpc(VIDEO_LIKE_STATE_RPC, {
      p_business_id: context.businessId,
      p_theme_id: themeId,
      p_video_keys: items.map((item) => item.id),
      p_visitor_token: sessionToken,
    });
    if (error) {
      console.error('Video like state RPC failed:', error);
      return { ok: false, code: 'network', error: safeLikeError(error) };
    }
    if (!data || typeof data !== 'object' || (data as Record<string, unknown>).theme_id !== themeId) {
      return { ok: false, code: 'invalid_response', error: 'Video likes returned an invalid response.' };
    }
    const body = data as Record<string, unknown>;
    const rows = Array.isArray(body.videos) ? body.videos : [];
    const snapshots = emptySnapshots(items, themeId);
    const allowed = new Map(items.map((item) => [item.id, item]));
    for (const row of rows) {
      const parsed = parseDatabaseSnapshot(row, themeId, allowed);
      if (parsed) snapshots[parsed.videoId] = parsed;
    }
    return {
      ok: true,
      snapshots,
      weekStart: typeof body.week_start === 'string' ? body.week_start : '',
      weekEnd: typeof body.week_end === 'string' ? body.week_end : '',
      source: 'database',
    };
  } catch (error) {
    console.error('Video like state request failed:', error);
    return { ok: false, code: 'network', error: safeLikeError(error) };
  }
}

export async function submitVideoLike(options: {
  context: VideoLikeContext;
  themeId: SiteHeaderThemeId;
  item: VideoGalleryItem;
  now?: Date;
}): Promise<VideoLikeMutationResult> {
  const { context, themeId, item } = options;
  if (injectedFailure === 'like') {
    return { ok: false, code: 'network', error: 'Could not like this video right now. Please try again.' };
  }
  if (item.themeId && item.themeId !== themeId) {
    return { ok: false, code: 'unavailable', error: 'This video belongs to a different theme.' };
  }
  if (context.mode === 'unavailable') {
    return { ok: false, code: 'unavailable', error: context.reason };
  }
  const sessionToken = videoLikeSessionToken();

  if (context.mode === 'local') {
    const now = options.now || new Date();
    const events = readLocalEvents();
    const duplicate = events.some((event) =>
      event.scope === context.scope
      && event.themeId === themeId
      && event.videoId === item.id
      && event.sessionToken === sessionToken,
    );
    if (!duplicate) {
      events.push({
        scope: context.scope,
        themeId,
        videoId: item.id,
        kind: item.kind,
        sessionToken,
        likedAt: now.toISOString(),
      });
      writeLocalEvents(events);
    }
    const snapshot = localSnapshots(context.scope, themeId, [item], sessionToken, now)[item.id];
    return { ok: true, snapshot, duplicate, source: 'local' };
  }

  if (!supabase) {
    return { ok: false, code: 'unavailable', error: 'Video likes are not connected.' };
  }
  try {
    const { data, error } = await supabase.rpc(VIDEO_LIKE_WRITE_RPC, {
      p_business_id: context.businessId,
      p_theme_id: themeId,
      p_video_key: item.id,
      p_visitor_token: sessionToken,
    });
    if (error) {
      console.error('Video like RPC failed:', error);
      return { ok: false, code: 'network', error: 'Could not like this video right now. Please try again.' };
    }
    const parsed = parseDatabaseSnapshot(
      data,
      themeId,
      new Map([[item.id, item]]),
    );
    if (!parsed) {
      return { ok: false, code: 'invalid_response', error: 'The like response was invalid.' };
    }
    return {
      ok: true,
      snapshot: parsed,
      duplicate: !!(data as Record<string, unknown>).duplicate,
      source: 'database',
    };
  } catch (error) {
    console.error('Video like request failed:', error);
    return { ok: false, code: 'network', error: 'Could not like this video right now. Please try again.' };
  }
}

/** Current-theme current-week ranking. Zero-week items are the empty state. */
export function weeklyTopVideos(
  items: readonly VideoGalleryItem[],
  snapshots: Readonly<Record<string, VideoLikeSnapshot>>,
  themeId: SiteHeaderThemeId,
  limit = 5,
): WeeklyRankedVideo[] {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit) || 5, 10));
  return items
    .filter((item) => !item.themeId || item.themeId === themeId)
    .map((item) => ({ item, snapshot: snapshots[item.id] }))
    .filter((entry): entry is { item: VideoGalleryItem; snapshot: VideoLikeSnapshot } =>
      !!entry.snapshot
      && entry.snapshot.themeId === themeId
      && entry.snapshot.kind === entry.item.kind
      && entry.snapshot.weeklyLikes > 0,
    )
    .sort((a, b) =>
      b.snapshot.weeklyLikes - a.snapshot.weeklyLikes
      || b.snapshot.totalLikes - a.snapshot.totalLikes
      || a.item.id.localeCompare(b.item.id),
    )
    .slice(0, safeLimit)
    .map((entry, index) => ({
      rank: index + 1,
      item: entry.item,
      totalLikes: entry.snapshot.totalLikes,
      weeklyLikes: entry.snapshot.weeklyLikes,
    }));
}
