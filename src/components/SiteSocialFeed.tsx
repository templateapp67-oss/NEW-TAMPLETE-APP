import { useState } from 'react';
import { ExternalLink, Play, Video } from 'lucide-react';
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
import {
  configuredSocialSources,
  resolveSocialFeed,
  type SocialFeedItem,
} from '../lib/siteSocialFeed';
import { socialText } from '../lib/siteSocialI18n';
import { socialVisuals } from '../lib/siteSocialTheme';
import { SectionStatePanel, structureCopyFrom } from './SiteSectionStates';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  mode: ViewportMode;
}

function openExternal(url: string): void {
  if (typeof window === 'undefined' || !url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function SiteSocialFeed({ themeId, data, mode }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const visual = socialVisuals(themeId, appearance);
  const S = siteText(themeId, locale);
  const C = socialText(themeId, locale);
  const X = structureCopyFrom(structureText(themeId, locale));
  const items = resolveSocialFeed(data);
  const sources = configuredSocialSources(data.socialProfiles);
  const state = resolveSectionState('videos', data.socialVideos);
  const title = S.videosTitle || C.feedTitle;
  const eyebrow = S.videosEyebrow || C.feedEyebrow;
  const [playing, setPlaying] = useState<SocialFeedItem | null>(null);
  const palette = {
    accent: visual.accent,
    text: visual.textStrong,
    muted: visual.muted,
    card: visual.chipBg,
    line: visual.cardLine,
    invert: '#ffffff',
  };

  return (
    <section
      {...sectionProps('videos', state, SITE_SECTION_IDS.videos)}
      data-testid="site-social-feed"
      data-theme={themeId}
      data-appearance={appearance}
      className="site-section px-5 md:px-8 py-12 md:py-16"
      style={{ backgroundColor: visual.sectionBg }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className={`${visual.eyebrowClass} inline-flex items-center justify-center gap-2`} style={{ color: visual.accent }}>
            <Video className="w-3 h-3" /> {eyebrow}
          </span>
          <h3 className={`${visual.headingClass} mt-3`} style={{ color: visual.textStrong }}>{title}</h3>
          <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: visual.muted }}>{C.feedBody}</p>
        </div>

        {sources.length > 0 && (
          <div data-testid="site-social-sources" className="flex flex-wrap items-center justify-center gap-2 mb-7">
            {sources.map((source) => (
              <button
                key={source.platform}
                type="button"
                data-testid={`site-social-source-${source.platform}`}
                className={`site-touch inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold ${visual.radius || ''}`}
                style={{ backgroundColor: visual.chipBg, color: visual.textStrong, border: `1px solid ${visual.cardLine}` }}
                onClick={() => openExternal(source.url)}
              >
                {C.follow} {C.platforms[source.platform]}
                <span style={{ color: visual.muted }}>@{source.handle}</span>
              </button>
            ))}
          </div>
        )}

        {state === 'ready' ? (
          <div className={`grid gap-4 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 2 })}`}>
            {items.map((item) => (
              <article
                key={item.id}
                data-testid="site-social-item"
                data-social-id={item.id}
                data-platform={item.platform}
                data-embed-kind={item.embedKind || ''}
                className={`relative aspect-[9/16] overflow-hidden group min-w-0 border ${visual.radius}`}
                style={{ borderColor: visual.cardLine }}
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: visual.chipBg }} />
                )}
                <div className="absolute inset-0" style={{ background: visual.overlay }} />
                <div className="absolute bottom-3 left-3 right-3 text-white space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-80">{C.platforms[item.platform]}</p>
                  <p className="text-xs font-bold line-clamp-2">{item.caption || item.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.embedUrl && (
                      <button
                        type="button"
                        data-testid="site-social-play"
                        className={visual.viewClass}
                        style={visual.viewStyle}
                        onClick={() => setPlaying(item)}
                      >
                        <Play className="w-3 h-3 inline mr-1" /> {C.play}
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="site-social-view"
                      className={visual.viewClass}
                      style={visual.viewStyle}
                      onClick={() => openExternal(item.url)}
                    >
                      <ExternalLink className="w-3 h-3 inline mr-1" /> {C.view}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <SectionStatePanel
            status={state}
            copy={X}
            palette={palette}
            emptyTitle={C.emptyTitle}
            emptyBody={S.videosEmpty || C.emptyBody}
          />
        )}

        {playing?.embedUrl && (
          <div
            data-testid="site-social-embed"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPlaying(null)}
          >
            <div
              className={`w-full max-w-lg aspect-video overflow-hidden bg-black ${visual.radius}`}
              onClick={(event) => event.stopPropagation()}
            >
              <iframe
                title={playing.title}
                src={playing.embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
