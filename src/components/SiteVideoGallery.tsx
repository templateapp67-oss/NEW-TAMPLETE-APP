/**
 * PHASE 15.1–15.7 — shared, theme-isolated video gallery + player.
 *
 * Phase 15.7 finalises the card/player interaction without adding a second
 * video system: cards still consume `videoItemsForTheme`, but every play/open
 * action is re-validated against the exact stored original platform URL and
 * the active theme immediately before use. YouTube embeds are loaded only on
 * demand; the external action opens the exact original watch/Short URL.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlertCircle,
  ExternalLink,
  LoaderCircle,
  Play,
  Video,
  X as CloseIcon,
} from 'lucide-react';
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
import {
  openOriginalPlatformVideo,
  originalVideoDestinationForTheme,
  safePlatformChannelUrl,
} from '../lib/videoPlatform';
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
type PlayerState = 'loading' | 'ready' | 'unavailable' | 'invalid';

function videoSizes(mode: ViewportMode): string {
  if (mode === 'mobile') return '(max-width: 390px) 45vw, 190px';
  if (mode === 'tablet') return '(max-width: 768px) 33vw, 250px';
  return '(max-width: 1024px) 20vw, 190px';
}

function autoplayEmbedUrl(value: string): string {
  if (!value) return '';
  return `${value}${value.includes('?') ? '&' : '?'}autoplay=1`;
}

/** Tracks broken thumbnails by item id so a single failure never blanks the grid. */
function useBrokenThumbs() {
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const mark = (id: string) => setBroken((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  const reset = () => setBroken({});
  return { broken, mark, reset };
}

function VideoCard({
  item,
  mode,
  tileRatio,
  radius,
  cardLine,
  cardBackground,
  text,
  muted,
  overlay,
  viewClass,
  viewStyle,
  chrome,
  thumbBroken,
  onThumbError,
  onActivate,
  onOpenExternal,
  accent,
  interactionError,
}: {
  key?: string;
  item: VideoGalleryItem;
  mode: ViewportMode;
  tileRatio: string;
  radius: string;
  cardLine: string;
  cardBackground: string;
  text: string;
  muted: string;
  overlay: string;
  viewClass: string;
  viewStyle: CSSProperties;
  chrome: VideoGalleryChromeCopy;
  thumbBroken: boolean;
  onThumbError: () => void;
  onActivate: (item: VideoGalleryItem) => void;
  onOpenExternal: (item: VideoGalleryItem) => void;
  accent: string;
  interactionError?: string;
}) {
  const hasThumb = !!item.thumbnailUrl && !thumbBroken;
  const kindLabel = item.kind === 'short' ? chrome.shortBadge : chrome.longBadge;
  const sourceName = item.channelName || chrome.platforms[item.platform];
  const sourceUrl = safePlatformChannelUrl(item.channelUrl, item.platform);

  return (
    <article
      data-testid="site-social-item"
      data-video-gallery-item={item.id}
      data-social-id={item.id}
      data-platform={item.platform}
      data-embed-kind={item.embedKind || ''}
      data-video-kind={item.kind}
      data-video-origin={item.origin}
      data-has-thumb={hasThumb ? 'true' : 'false'}
      data-url-state="valid"
      data-original-url={item.originalUrl}
      className={`relative overflow-hidden group min-w-0 border flex flex-col ${radius}`}
      style={{ borderColor: cardLine, backgroundColor: cardBackground, contain: 'content' }}
    >
      <button
        type="button"
        data-testid="site-video-card-trigger"
        aria-label={`${chrome.play} ${item.title}`}
        className="relative block w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
        style={{ aspectRatio: tileRatio, outlineColor: accent }}
        onClick={() => onActivate(item)}
      >
        {hasThumb ? (
          <div className="absolute inset-0" data-testid="site-video-gallery-thumb">
            <SiteImage
              src={item.thumbnailUrl}
              alt={item.title}
              context="video"
              aspectRatio={tileRatio}
              sizes={videoSizes(mode)}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              onError={onThumbError}
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
              onError={onThumbError}
            />
          </div>
        ) : (
          <div
            data-testid="site-video-gallery-thumb-fallback"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.08)', color: muted }}
          >
            <Video className="w-6 h-6 opacity-50" aria-hidden />
            <span className="text-[10px] font-semibold opacity-80">{chrome.thumbFallback}</span>
          </div>
        )}

        <span className="absolute inset-0 pointer-events-none" style={{ background: overlay }} />
        <span
          data-testid="site-video-kind-badge"
          className="absolute top-2 left-2 z-10 text-[8px] font-extrabold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
          style={{ backgroundColor: accent, color: '#141414' }}
        >
          {kindLabel}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <span className="w-11 h-11 rounded-full bg-white/92 text-black shadow-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
          </span>
        </span>
        <span className="sr-only">{chrome.opensOriginal}</span>
      </button>

      <div className="flex flex-col flex-1 gap-2.5 p-3" style={{ color: text }}>
        <div className="min-w-0">
          <p className="text-[8px] font-extrabold uppercase tracking-[0.16em]" style={{ color: muted }}>
            {chrome.platforms[item.platform]} · {kindLabel}
          </p>
          <h4 className="text-xs font-bold leading-snug line-clamp-2 mt-1" data-testid="site-video-card-title">
            {item.title}
          </h4>
          <p className="text-[10px] mt-1 truncate" data-testid="site-video-card-source" style={{ color: muted }}>
            {chrome.sourceLabel}:{' '}
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="site-video-channel-link"
                className="font-semibold underline underline-offset-2 focus-visible:outline-2"
                style={{ outlineColor: accent }}
                onClick={(event) => event.stopPropagation()}
              >
                {sourceName}
              </a>
            ) : (
              <span className="font-semibold">{sourceName}</span>
            )}
          </p>
          {item.description && item.origin === 'owner' && (
            <p className="text-[10px] mt-1 line-clamp-2" data-testid="site-video-card-description" style={{ color: muted }}>
              {item.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-auto">
          <button
            type="button"
            data-testid="site-social-play"
            aria-label={`${chrome.play} ${item.title}`}
            className={viewClass}
            style={viewStyle}
            onClick={() => onActivate(item)}
          >
            <Play className="w-3 h-3 inline mr-1" aria-hidden /> {chrome.play}
          </button>
          <button
            type="button"
            data-testid="site-social-view"
            data-original-url={item.originalUrl}
            aria-label={`${chrome.openExternal} ${item.title}`}
            className={viewClass}
            style={viewStyle}
            onClick={() => onOpenExternal(item)}
          >
            <ExternalLink className="w-3 h-3 inline mr-1" aria-hidden /> {chrome.view}
          </button>
        </div>

        {interactionError && (
          <p
            role="alert"
            data-testid="site-video-card-error"
            className="text-[10px] leading-snug flex gap-1.5"
            style={{ color: '#dc2626' }}
          >
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" aria-hidden />
            {interactionError}
          </p>
        )}
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
  const { broken, mark, reset: resetBroken } = useBrokenThumbs();

  const items = useMemo(
    () => videoItemsForTheme(themeId, data, locale),
    [themeId, data, locale],
  );
  const sources = useMemo(
    () => configuredSocialSources(data.socialProfiles).filter(
      (source) => !!safePlatformChannelUrl(source.url, source.platform),
    ),
    [data.socialProfiles],
  );
  const state = resolveSectionState('videos', items);

  const title = S.videosTitle || C.feedTitle;
  const eyebrow = S.videosEyebrow || C.feedEyebrow;
  const emptyBody = S.videosEmpty || C.emptyBody || chrome.emptyBody;

  const [playing, setPlaying] = useState<VideoGalleryItem | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('loading');
  const [playerMessage, setPlayerMessage] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [interactionErrors, setInteractionErrors] = useState<Record<string, string>>({});
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Theme/data switch drops every interaction object so stale media from a
  // previous theme can never remain playable or redirectable.
  useEffect(() => {
    setPlaying(null);
    setPlayerState('loading');
    setPlayerMessage('');
    setKindFilter('all');
    setInteractionErrors({});
    resetBroken();
    // resetBroken is intentionally state-local; theme/data are the isolation keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId, data]);

  // Accessible dialog close + body scroll lock.
  useEffect(() => {
    if (!playing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPlaying(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus?.();
    };
  }, [playing]);

  // A provider iframe can fail without firing `error`; after a bounded wait,
  // present the unavailable state while keeping the exact external fallback.
  useEffect(() => {
    if (!playing || playerState !== 'loading') return;
    const timeout = window.setTimeout(() => {
      setPlayerState('unavailable');
      setPlayerMessage(chrome.unavailableBody);
    }, 12_000);
    return () => window.clearTimeout(timeout);
  }, [playing, playerState, chrome.unavailableBody]);

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

  const currentItem = (candidate: VideoGalleryItem): VideoGalleryItem | null =>
    items.find(
      (item) => item.id === candidate.id && item.originalUrl === candidate.originalUrl,
    ) || null;

  const markInteractionError = (id: string, message: string) => {
    setInteractionErrors((previous) => ({ ...previous, [id]: message }));
  };

  const openExternal = (candidate: VideoGalleryItem) => {
    const item = currentItem(candidate);
    if (!item) {
      markInteractionError(candidate.id, chrome.invalidUrl);
      return;
    }
    const result = openOriginalPlatformVideo(item, { themeId });
    if (!result.ok) markInteractionError(item.id, result.error || chrome.invalidUrl);
    else setInteractionErrors((previous) => {
      if (!previous[item.id]) return previous;
      const next = { ...previous };
      delete next[item.id];
      return next;
    });
  };

  const activate = (candidate: VideoGalleryItem) => {
    const item = currentItem(candidate);
    triggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (!item) {
      setPlaying(candidate);
      setPlayerState('invalid');
      setPlayerMessage(chrome.invalidUrl);
      return;
    }
    const destination = originalVideoDestinationForTheme(item, themeId);
    if (destination.ok === false) {
      setPlaying(item);
      setPlayerState('invalid');
      setPlayerMessage(destination.message || chrome.invalidUrl);
      return;
    }
    if (!item.embedUrl) {
      openExternal(item);
      return;
    }
    setPlaying(item);
    setPlayerState('loading');
    setPlayerMessage('');
  };

  const closePlayer = () => {
    setPlaying(null);
    setPlayerState('loading');
    setPlayerMessage('');
  };

  const sectionSpacing = mode === 'mobile' ? 'px-4 py-10' : mode === 'tablet' ? 'px-7 py-14' : 'px-8 py-16';

  return (
    <section
      {...sectionProps('videos', state, SITE_SECTION_IDS.videos)}
      data-testid="site-social-feed"
      data-video-gallery="true"
      data-theme={themeId}
      data-appearance={appearance}
      data-kind-filter={kindFilter}
      data-short-count={String(shorts.length)}
      data-long-count={String(longs.length)}
      className={`site-section ${sectionSpacing}`}
      style={{ backgroundColor: visual.sectionBg }}
    >
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="text-center mb-8">
          <span
            className={`${visual.eyebrowClass} inline-flex items-center justify-center gap-2`}
            style={{ color: visual.accent }}
          >
            <Video className="w-3 h-3" aria-hidden /> {eyebrow}
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
            {sources.map((source) => {
              const exactSource = safePlatformChannelUrl(source.url, source.platform);
              return (
                <a
                  key={source.platform}
                  href={exactSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`site-social-source-${source.platform}`}
                  className={`site-touch inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold ${visual.radius || ''}`}
                  style={{
                    backgroundColor: visual.chipBg,
                    color: visual.textStrong,
                    border: `1px solid ${visual.cardLine}`,
                  }}
                >
                  {C.follow} {chrome.platforms[source.platform]}
                  <span style={{ color: visual.muted }}>@{source.handle}</span>
                </a>
              );
            })}
          </div>
        )}

        {state === 'ready' ? (
          <>
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

            <div
              data-testid="site-video-gallery-grid"
              data-kind-filter={kindFilter}
              className={`grid items-start gap-4 ${siteGrid(mode, config.grid)}`}
            >
              {visible.map((item) => (
                <VideoCard
                  key={item.id}
                  item={item}
                  mode={mode}
                  tileRatio={tileRatioFor(item)}
                  radius={visual.radius}
                  cardLine={visual.cardLine}
                  cardBackground={visual.chipBg}
                  text={visual.textStrong}
                  muted={visual.muted}
                  overlay={visual.overlay}
                  viewClass={visual.viewClass}
                  viewStyle={visual.viewStyle}
                  chrome={chrome}
                  thumbBroken={!!broken[item.id]}
                  onThumbError={() => mark(item.id)}
                  onActivate={activate}
                  onOpenExternal={openExternal}
                  accent={visual.accent}
                  interactionError={interactionErrors[item.id]}
                />
              ))}
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

        {playing && (
          <div
            data-testid="site-social-embed"
            data-video-gallery-embed="true"
            data-player-state={playerState}
            data-video-id={playing.id}
            data-theme={themeId}
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-video-player-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-3"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closePlayer();
            }}
          >
            <div
              data-testid="site-video-player"
              className={`relative w-full overflow-hidden shadow-2xl ${visual.radius}`}
              style={{
                maxWidth: playing.kind === 'short' ? (mode === 'mobile' ? '340px' : '410px') : '760px',
                backgroundColor: visual.sectionBg,
                color: visual.textStrong,
                border: `1px solid ${visual.cardLine}`,
              }}
            >
              <button
                ref={closeButtonRef}
                type="button"
                data-testid="site-video-gallery-embed-close"
                aria-label={chrome.close}
                className="absolute top-2 right-2 z-30 site-touch w-9 h-9 flex items-center justify-center rounded-full bg-black/70 text-white focus-visible:outline-2 focus-visible:outline-white"
                onClick={closePlayer}
              >
                <CloseIcon className="w-4 h-4" aria-hidden />
              </button>

              <div
                className="relative mx-auto bg-black overflow-hidden"
                style={{
                  aspectRatio: playing.kind === 'short' ? '9/16' : '16/9',
                  width: playing.kind === 'short' ? 'min(100%, 360px)' : '100%',
                  maxHeight: mode === 'mobile' ? '62vh' : '72vh',
                }}
              >
                {playing.embedUrl && playerState !== 'invalid' && (
                  <iframe
                    title={playing.title}
                    src={autoplayEmbedUrl(playing.embedUrl)}
                    data-testid="site-video-player-iframe"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={() => {
                      if (playing) {
                        // Some providers emit a late load after an error page;
                        // never erase an unavailable/invalid state with it.
                        setPlayerState((current) => current === 'loading' ? 'ready' : current);
                      }
                    }}
                    onErrorCapture={() => {
                      setPlayerState('unavailable');
                      setPlayerMessage(chrome.unavailableBody);
                    }}
                    onError={() => {
                      setPlayerState('unavailable');
                      setPlayerMessage(chrome.unavailableBody);
                    }}
                  />
                )}

                {playerState === 'loading' && (
                  <div
                    data-testid="site-video-player-loading"
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black text-white"
                    role="status"
                    aria-live="polite"
                  >
                    <LoaderCircle className="w-7 h-7 animate-spin" aria-hidden />
                    <span className="text-xs font-semibold">{chrome.playerLoading}</span>
                  </div>
                )}

                {(playerState === 'unavailable' || playerState === 'invalid') && (
                  <div
                    data-testid={playerState === 'invalid' ? 'site-video-player-invalid' : 'site-video-player-unavailable'}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white"
                    role="alert"
                  >
                    <AlertCircle className="w-8 h-8 opacity-80" aria-hidden />
                    <strong className="text-sm">
                      {playerState === 'invalid' ? chrome.invalidUrl : chrome.unavailableTitle}
                    </strong>
                    <p className="text-xs text-white/70">
                      {playerMessage || (playerState === 'invalid' ? chrome.invalidUrl : chrome.unavailableBody)}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 pr-14 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.14em]" style={{ color: visual.muted }}>
                  <span>{chrome.platforms[playing.platform]}</span>
                  <span aria-hidden>·</span>
                  <span>{playing.kind === 'short' ? chrome.shortBadge : chrome.longBadge}</span>
                </div>
                <h4 id="site-video-player-title" className="text-sm font-bold mt-1.5 line-clamp-2">
                  {playing.title}
                </h4>
                <p className="text-[11px] mt-1" style={{ color: visual.muted }}>
                  {chrome.sourceLabel}:{' '}
                  {playing.channelUrl ? (
                    <a
                      href={playing.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="site-video-player-channel"
                      className="font-semibold underline underline-offset-2"
                    >
                      {playing.channelName || chrome.platforms[playing.platform]}
                    </a>
                  ) : (
                    <span className="font-semibold">
                      {playing.channelName || chrome.platforms[playing.platform]}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  data-testid="site-video-player-external"
                  data-original-url={playing.originalUrl}
                  className={`mt-3 ${visual.viewClass}`}
                  style={visual.viewStyle}
                  onClick={() => openExternal(playing)}
                >
                  <ExternalLink className="w-3 h-3 inline mr-1" aria-hidden />
                  {chrome.openExternal} · {chrome.platforms[playing.platform]}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
