/**
 * PHASE 10.12 + 15.7 — lazy video primitive.
 *
 * Kept for backwards compatibility with earlier surfaces. The Phase 15.7
 * gallery owns the final card/dialog, while this primitive now shares the same
 * original-platform URL gate and broken/loading/unavailable behaviour.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Play } from 'lucide-react';
import { __mockInView } from '../lib/sitePerformance';
import {
  nativeVideoIdFromUrl,
  openOriginalPlatformVideo,
  originalPlatformVideoDestination,
  type VideoPlatform,
} from '../lib/videoPlatform';
import { instagramEmbedUrl, youtubeEmbedUrl } from '../lib/siteSocialFeed';

interface Props {
  thumbnailUrl: string;
  title: string;
  embedUrl?: string | null;
  url: string;
  /** Exact Phase 15.7 platform URL. Legacy callers can omit it. */
  originalUrl?: string;
  externalVideoId?: string | null;
  platform: VideoPlatform;
  onPlay?: () => void;
  onView?: () => void;
  className?: string;
  aspectRatio?: string;
}

export default function SiteVideo({
  thumbnailUrl,
  title,
  // Kept in the signature for API compatibility, but never trusted as an
  // iframe destination; a safe embed is derived from the validated native id.
  embedUrl: _legacyEmbedUrl,
  url,
  originalUrl,
  externalVideoId,
  platform,
  onPlay,
  onView,
  className = '',
  aspectRatio = '9/16',
}: Props) {
  const [inView, setInView] = useState(() => __mockInView !== null ? __mockInView : false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [thumbBroken, setThumbBroken] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const record = useMemo(() => ({
    platform,
    url,
    originalUrl,
    externalVideoId,
  }), [platform, url, originalUrl, externalVideoId]);
  const destination = useMemo(() => originalPlatformVideoDestination(record), [record]);
  const safeEmbedUrl = useMemo(() => {
    if (destination.ok === false) return null;
    const nativeId = nativeVideoIdFromUrl(destination.url, destination.platform);
    if (!nativeId) return null;
    if (destination.platform === 'youtube') return youtubeEmbedUrl(nativeId);
    if (destination.platform === 'instagram') {
      return instagramEmbedUrl(nativeId, /\/reels?\//i.test(destination.url) ? 'reel' : 'p');
    }
    return null;
  }, [destination]);

  useEffect(() => {
    if (__mockInView !== null) {
      setInView(__mockInView);
      return;
    }
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px 0px', threshold: 0.01 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handlePlay = () => {
    setUnavailable(false);
    if (destination.ok === false) {
      setUnavailable(true);
      return;
    }
    if (safeEmbedUrl) {
      setIsPlaying(true);
      onPlay?.();
      return;
    }
    const opened = openOriginalPlatformVideo(record);
    if (!opened.ok) setUnavailable(true);
    else onView?.();
  };

  return (
    <div
      ref={ref}
      data-testid="site-video-wrapper"
      data-platform={platform}
      data-in-view={inView ? 'true' : 'false'}
      data-playing={isPlaying ? 'true' : 'false'}
      data-url-state={destination.ok ? 'valid' : 'invalid'}
      className={`relative overflow-hidden group ${className}`}
      style={{ aspectRatio }}
    >
      {!thumbLoaded && !thumbBroken && (
        <div data-testid="site-video-skeleton" className="absolute inset-0 bg-gray-100 animate-pulse" aria-hidden />
      )}

      {inView && thumbnailUrl && !thumbBroken ? (
        <img
          data-testid="site-video-thumbnail"
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setThumbLoaded(true)}
          onError={() => {
            setThumbLoaded(true);
            setThumbBroken(true);
          }}
        />
      ) : (
        <div
          data-testid="site-video-thumbnail-fallback"
          className="absolute inset-0 bg-gray-100 text-gray-500 flex items-center justify-center px-4 text-center text-xs"
        >
          Thumbnail unavailable
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

      {!isPlaying && !unavailable && (
        <button
          type="button"
          data-testid="site-video-play"
          aria-label={`Play ${title}`}
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            {safeEmbedUrl ? (
              <Play className="w-5 h-5 ml-0.5 text-black" aria-hidden />
            ) : (
              <ExternalLink className="w-5 h-5 text-black" aria-hidden />
            )}
          </span>
        </button>
      )}

      {isPlaying && safeEmbedUrl && (
        <div data-testid="site-video-embed" className="absolute inset-0 bg-black">
          <iframe
            title={title}
            src={`${safeEmbedUrl}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setUnavailable(true)}
          />
        </div>
      )}

      {unavailable && (
        <div
          data-testid="site-video-unavailable"
          role="alert"
          className="absolute inset-0 z-10 bg-black/90 text-white flex flex-col items-center justify-center gap-2 px-4 text-center"
        >
          <AlertCircle className="w-6 h-6" aria-hidden />
          <span className="text-xs font-semibold">Video unavailable or the original URL is invalid.</span>
        </div>
      )}

      {!isPlaying && !unavailable && (
        <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
          <p className="text-[9px] uppercase tracking-[0.16em] opacity-80">{platform}</p>
          <p className="text-xs font-bold line-clamp-2">{title}</p>
        </div>
      )}
    </div>
  );
}
