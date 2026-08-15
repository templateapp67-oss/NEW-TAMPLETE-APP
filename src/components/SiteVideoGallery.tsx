/**
 * PHASE 15.1 + 15.3 — VIDEO GALLERY (one shared component, five themes).
 *
 * Preserves the Phase 10.8 section contract:
 *   - `data-site-section="videos"` / `#section-social`
 *   - `data-testid="site-social-feed"` (+ item / play / view / embed ids)
 *
 * PHASE 15.3 — every theme always presents up to 5 Shorts + 5 Long videos
 * (owner first, theme catalog fill). Kind tabs let visitors filter; tile
 * ratios differ (9:16 shorts / 16:9 long). Theme isolation is enforced by
 * `videoItemsForTheme` — no cross-theme content.
 */
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { AlertTriangle, ExternalLink, Loader2, Play, Video } from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { siteText } from '../lib/siteI18n';
import { structureText } from '../lib/siteStructureI18n';
import {
  resolveSectionState,
  sectionProps,
  siteGrid,
  SITE_SECTION_IDS,
} from '../lib/siteStructure';
import type { ViewportMode } from '../lib/siteStructure';
import { configuredSocialSources } from '../lib/siteSocialFeed';
import { socialText } from '../lib/siteSocialI18n';
import { socialVisuals } from '../lib/siteSocialTheme';
import {
  videoGalleryThemeConfig,
  videoItemsForTheme,
  type VideoGalleryItem,
} from '../lib/siteVideoGallery';
import { videoGalleryChrome } from '../lib/siteVideoGalleryI18n';
import type { VideoGalleryChromeCopy } from '../lib/siteVideoGalleryI18n';
import type { VideoKind } from '../lib/siteVideoCatalog';
import { openOriginalVideoDestination } from '../lib/originalVideoDestination';
import { SectionStatePanel, structureCopyFrom } from './SiteSectionStates';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import SiteImage from './SiteImage';
import SiteSkeleton from './SiteSkeleton';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  mode: ViewportMode;
}

type KindFilter = 'all' | VideoKind;

function openExternal(url: string): void {
  if (typeof window === 'undefined' || !url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function videoSizes(mode: ViewportMode): string {
  if (mode === 'mobile') return '(max-width: 390px) 45vw, 190px';
  if (mode === 'tablet') return '(max-width: 768px) 33vw, 250px';
  return '(max-width: 1024px) 20vw, 180px';
}

/** Tracks broken thumbnails by item id so a single failure never blanks the grid. */
function useBrokenThumbs() {
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const mark = (id: string) => setBroken((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  return { broken, mark };
}

function renderVideoCard(
  item: VideoGalleryItem,
  opts: {
    mode: ViewportMode;
    tileRatio: string;
    radius: string;
    cardLine: string;
    overlay: string;
    viewClass: string;
    viewStyle: CSSProperties;
    chrome: VideoGalleryChromeCopy;
    thumbBroken: boolean;
    onThumbError: () => void;
    onPlay: (item: VideoGalleryItem) => void;
    onOpen: (item: VideoGalleryItem) => void;
    accent: string;
  },
) {
  const hasThumb = !!item.thumbnailUrl && !opts.thumbBroken;
  const kindLabel = item.kind === 'short' ? opts.chrome.shortBadge : opts.chrome.longBadge;
  return (
    <article
      key={item.id}
      data-testid="site-social-item"
      data-video-gallery-item={item.id}
      data-social-id={item.id}
      data-platform={item.platform}
      data-embed-kind={item.embedKind || ''}
      data-video-kind={item.kind}
      data-video-origin={item.origin}
      data-has-thumb={hasThumb ? 'true' : 'false'}
      data-original-platform-url={item.originalPlatformUrl}
      role="link"
      tabIndex={0}
      aria-label={`${opts.chrome.openExternal}: ${item.title}`}
      className={`relative overflow-hidden group min-w-0 border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${opts.radius}`}
      style={{ borderColor: opts.cardLine, aspectRatio: opts.tileRatio, contain: 'content' }}
      onClick={() => opts.onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          opts.onOpen(item);
        }
      }}
    >
      {hasThumb ? (
        <div className="absolute inset-0" data-testid="site-video-gallery-thumb">
          <SiteImage
            src={item.thumbnailUrl}
            alt={item.title}
            context="video"
            aspectRatio={opts.tileRatio}
            sizes={videoSizes(opts.mode)}
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            onError={opts.onThumbError}
          />
          {/* Keep the Phase 10.12 social-thumb contract for existing tests. */}
          <img
            src={item.thumbnailUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            data-testid="site-social-thumb"
            className="sr-only"
            onError={opts.onThumbError}
          />
        </div>
      ) : (
        <div
          data-testid="site-video-gallery-thumb-fallback"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
        >
          <Video className="w-6 h-6 opacity-40" aria-hidden />
          <span className="text-[10px] font-semibold opacity-60">{opts.chrome.thumbFallback}</span>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none" style={{ background: opts.overlay }} />

      <span
        data-testid="site-video-kind-badge"
        className="absolute top-2 left-2 z-10 text-[8px] font-extrabold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
        style={{ backgroundColor: opts.accent, color: '#141414' }}
      >
        {kindLabel}
      </span>

      <div className="absolute bottom-3 left-3 right-3 text-white space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-80">
          {opts.chrome.platforms[item.platform]}
          {item.channelName ? ` · ${item.channelName}` : ''}
        </p>
        <p className="text-xs font-bold line-clamp-2" data-testid="site-video-card-title">{item.title}</p>
        {item.description && item.origin === 'owner' && (
          <p className="text-[10px] opacity-80 line-clamp-2" data-testid="site-video-card-description">
            {item.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {item.embedUrl && (
            <button
              type="button"
              data-testid="site-social-play"
              aria-label={`${opts.chrome.play} ${item.title}`}
              className={opts.viewClass}
              style={opts.viewStyle}
              onClick={(event) => {
                event.stopPropagation();
                opts.onPlay(item);
              }}
            >
              <Play className="w-3 h-3 inline mr-1" /> {opts.chrome.play}
            </button>
          )}
          <button
            type="button"
            data-testid="site-social-view"
            aria-label={`${opts.chrome.view} ${item.title}`}
            className={opts.viewClass}
            style={opts.viewStyle}
            onClick={(event) => {
              event.stopPropagation();
              opts.onOpen(item);
            }}
          >
            <ExternalLink className="w-3 h-3 inline mr-1" /> {opts.chrome.view}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function SiteVideoGallery({ themeId, data, mode }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const visual = socialVisuals(themeId, appearance);
  const S = siteText(themeId, locale);
  const C = socialText(themeId, locale);
  const chrome = videoGalleryChrome(themeId, locale);
  const X = structureCopyFrom(structureText(themeId, locale));
  const config = videoGalleryThemeConfig(themeId);
  const { broken, mark } = useBrokenThumbs();

  const items = useMemo(
    () => videoItemsForTheme(themeId, data, locale),
    [themeId, data, locale],
  );
  const sources = useMemo(
    () => configuredSocialSources(data.socialProfiles),
    [data.socialProfiles],
  );
  // Section is ready whenever we have items after the 15.3 fill (catalog
  // ensures 5+5 even with empty owner data).
  const state = resolveSectionState('videos', items);

  const title = S.videosTitle || C.feedTitle;
  const eyebrow = S.videosEyebrow || C.feedEyebrow;
  const emptyBody = S.videosEmpty || C.emptyBody || chrome.emptyBody;

  const [playing, setPlaying] = useState<VideoGalleryItem | null>(null);
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [destinationError, setDestinationError] = useState(false);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');

  const openOriginal = (item: VideoGalleryItem) => {
    setDestinationError(false);
    const opened = openOriginalVideoDestination(
      item.originalPlatformUrl,
      item.platform,
      item.externalVideoId,
    );
    if (!opened) setDestinationError(true);
  };

  const playVideo = (item: VideoGalleryItem) => {
    setDestinationError(false);
    setPlayerStatus('loading');
    if (item.embedUrl) setPlaying(item);
    else openOriginal(item);
  };

  // Theme / data switch → drop any open embed + reset filter so previous-theme
  // media never stays mounted (theme isolation).
  useEffect(() => {
    setPlaying(null);
    setDestinationError(false);
    setPlayerStatus('loading');
    setKindFilter('all');
  }, [themeId, data]);

  const shorts = useMemo(() => items.filter((i) => i.kind === 'short'), [items]);
  const longs = useMemo(() => items.filter((i) => i.kind === 'long'), [items]);
  const visible = useMemo(() => {
    if (kindFilter === 'short') return shorts;
    if (kindFilter === 'long') return longs;
    return items;
  }, [kindFilter, shorts, longs, items]);

  const palette = {
    accent: visual.accent,
    text: visual.textStrong,
    muted: visual.muted,
    card: visual.chipBg,
    line: visual.cardLine,
    invert: '#ffffff',
  };

  const tileRatioFor = (item: VideoGalleryItem) =>
    item.kind === 'short' ? config.shortTileRatio : config.longTileRatio;

  const chipBase =
    'site-touch text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 border transition-colors';
  const chipActive = {
    backgroundColor: visual.accent,
    color: '#141414',
    borderColor: visual.accent,
  };
  const chipIdle = {
    color: visual.muted,
    borderColor: visual.cardLine,
    backgroundColor: 'transparent',
  };

  return (
    <section
      {...sectionProps('videos', state, SITE_SECTION_IDS.videos)}
      data-testid="site-social-feed"
      data-video-gallery="true"
      data-theme={themeId}
      data-appearance={appearance}
      data-short-count={String(shorts.length)}
      data-long-count={String(longs.length)}
      className="site-section px-5 md:px-8 py-12 md:py-16"
      style={{ backgroundColor: visual.sectionBg }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span
            className={`${visual.eyebrowClass} inline-flex items-center justify-center gap-2`}
            style={{ color: visual.accent }}
          >
            <Video className="w-3 h-3" /> {eyebrow}
          </span>
          <h3 className={`${visual.headingClass} mt-3`} style={{ color: visual.textStrong }}>
            {title}
          </h3>
          <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: visual.muted }}>
            {C.feedBody}
          </p>
        </div>

        {sources.length > 0 && (
          <div
            data-testid="site-social-sources"
            className="flex flex-wrap items-center justify-center gap-2 mb-7"
          >
            {sources.map((source) => (
              <button
                key={source.platform}
                type="button"
                data-testid={`site-social-source-${source.platform}`}
                className={`site-touch inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold ${visual.radius || ''}`}
                style={{
                  backgroundColor: visual.chipBg,
                  color: visual.textStrong,
                  border: `1px solid ${visual.cardLine}`,
                }}
                onClick={() => openExternal(source.url)}
              >
                {C.follow} {chrome.platforms[source.platform]}
                <span style={{ color: visual.muted }}>@{source.handle}</span>
              </button>
            ))}
          </div>
        )}

        {state === 'ready' ? (
          <>
            {/* PHASE 15.3 — kind filter tabs */}
            <div
              data-testid="site-video-kind-filter"
              role="group"
              aria-label={title}
              className="flex flex-wrap items-center justify-center gap-2 mb-6"
            >
              <button
                type="button"
                data-testid="site-video-filter-all"
                aria-pressed={kindFilter === 'all'}
                onClick={() => setKindFilter('all')}
                className={`${chipBase} ${visual.radius || ''}`}
                style={kindFilter === 'all' ? chipActive : chipIdle}
              >
                {chrome.allTab}
              </button>
              <button
                type="button"
                data-testid="site-video-filter-short"
                aria-pressed={kindFilter === 'short'}
                onClick={() => setKindFilter('short')}
                className={`${chipBase} ${visual.radius || ''}`}
                style={kindFilter === 'short' ? chipActive : chipIdle}
              >
                {chrome.shortsTab}
                <span className="ml-1 opacity-70">({shorts.length})</span>
              </button>
              <button
                type="button"
                data-testid="site-video-filter-long"
                aria-pressed={kindFilter === 'long'}
                onClick={() => setKindFilter('long')}
                className={`${chipBase} ${visual.radius || ''}`}
                style={kindFilter === 'long' ? chipActive : chipIdle}
              >
                {chrome.longTab}
                <span className="ml-1 opacity-70">({longs.length})</span>
              </button>
            </div>

            {destinationError && (
              <div
                data-testid="site-video-invalid-url"
                role="alert"
                className={`mb-4 flex items-center justify-center gap-2 border px-3 py-2 text-xs ${visual.radius || ''}`}
                style={{ borderColor: visual.cardLine, color: visual.textStrong, backgroundColor: visual.chipBg }}
              >
                <AlertTriangle className="w-4 h-4" aria-hidden />
                {chrome.invalidUrl}
              </div>
            )}

            <div
              data-testid="site-video-gallery-grid"
              data-kind-filter={kindFilter}
              className={`grid gap-4 ${siteGrid(mode, config.grid)}`}
            >
              {visible.map((item) =>
                renderVideoCard(item, {
                  mode,
                  tileRatio: tileRatioFor(item),
                  radius: visual.radius,
                  cardLine: visual.cardLine,
                  overlay: visual.overlay,
                  viewClass: visual.viewClass,
                  viewStyle: visual.viewStyle,
                  chrome,
                  thumbBroken: !!broken[item.id],
                  onThumbError: () => mark(item.id),
                  onPlay: playVideo,
                  onOpen: openOriginal,
                  accent: visual.accent,
                }),
              )}
            </div>
          </>
        ) : state === 'loading' ? (
          <div data-testid="site-video-gallery-loading">
            <SiteSkeleton type="videos" mode={mode} />
          </div>
        ) : (
          <SectionStatePanel
            status={state}
            copy={{
              ...X,
              errorTitle: chrome.errorTitle,
              errorBody: chrome.errorBody,
              retry: chrome.retry,
            }}
            palette={palette}
            emptyTitle={chrome.emptyTitle || C.emptyTitle}
            emptyBody={emptyBody}
            section="videos"
            mode={mode}
          />
        )}

        {playing?.embedUrl && (
          <div
            data-testid="site-social-embed"
            data-video-gallery-embed="true"
            role="dialog"
            aria-modal="true"
            aria-label={playing.title}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPlaying(null)}
          >
            <div
              className={`relative w-full max-w-lg overflow-hidden bg-black ${visual.radius}`}
              onClick={(event) => event.stopPropagation()}
              style={{ aspectRatio: playing.kind === 'short' ? '9/16' : '16/9', maxHeight: '85vh' }}
            >
              {playerStatus === 'loading' && (
                <div
                  data-testid="site-video-player-loading"
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black text-white"
                  aria-live="polite"
                >
                  <Loader2 className="w-7 h-7 animate-spin" aria-hidden />
                  <span className="text-xs font-semibold">{chrome.loadingVideo}</span>
                </div>
              )}
              {playerStatus === 'unavailable' ? (
                <div
                  data-testid="site-video-player-unavailable"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-8 text-center text-white"
                  role="alert"
                >
                  <AlertTriangle className="w-8 h-8" aria-hidden />
                  <p className="text-sm">{chrome.unavailableVideo}</p>
                  <button
                    type="button"
                    className="site-touch rounded-full bg-white px-4 py-2 text-xs font-bold text-black"
                    onClick={() => openOriginal(playing)}
                  >
                    <ExternalLink className="mr-1 inline w-3 h-3" /> {chrome.watchOnPlatform}
                  </button>
                </div>
              ) : (
                <iframe
                  title={playing.title}
                  src={`${playing.embedUrl}${playing.embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  onLoad={() => setPlayerStatus('ready')}
                  onError={() => setPlayerStatus('unavailable')}
                />
              )}
              <a
                data-testid="site-video-original-destination"
                href={playing.originalPlatformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 left-2 z-20 rounded-full bg-black/70 px-3 py-2 text-[10px] font-bold text-white"
                onClick={(event) => {
                  event.preventDefault();
                  openOriginal(playing);
                }}
              >
                <ExternalLink className="mr-1 inline w-3 h-3" /> {chrome.watchOnPlatform}
              </a>
              <button
                type="button"
                data-testid="site-video-gallery-embed-close"
                aria-label={chrome.close}
                className="absolute top-2 right-2 site-touch w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white"
                onClick={() => setPlaying(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
