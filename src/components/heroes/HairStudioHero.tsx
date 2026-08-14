/**
 * PHASE 11.1 — HERO · HAIR STUDIO & COLOR BAR (hair_studio_color_bar)
 *
 * Visual language (used by NO other theme):
 *   - Editorial magazine cover: a hairline double frame, an "Issue" masthead
 *     rule across the top and serif display type set centred-left.
 *   - A three-frame gallery wall (one tall portfolio plate + two stacked
 *     column plates) with numbered captions like a printed contact sheet.
 *   - Rose-gold hairline underlines instead of buttons-with-fills for the
 *     secondary action; primary CTA is a flat rose-gold slab.
 *   - Meta appears as a typeset colophon line, not as chips.
 */
import type { CSSProperties } from 'react';
import type { SalonData } from '../../types';
import SiteImage from '../SiteImage';
import SiteSalonStatus from '../SiteSalonStatus';
import { useSiteLocale, useThemeAppearance } from '../SiteHeader';
import { getSalonNameStyle } from '../../lib/brandIdentity';
import { HAIR_STUDIO_SURFACES, surfacesOf } from '../../lib/themeSurfaces';
import { heroText } from '../../lib/siteHeroI18n';
import { heroDescription, heroFocusBadges, heroHeadline, heroLogoInitials, heroMedia, heroMeta, heroSalonName, heroVideo } from '../../lib/siteHero';
import { openSiteBooking } from '../../lib/siteBooking';
import { scrollToSiteSection } from '../../lib/siteNavigation';
import type { ViewportMode } from '../../lib/siteStructure';
import { Star, MapPin, ArrowUpRight, Play } from 'lucide-react';

interface Props {
  data: SalonData;
  mode: ViewportMode;
}

export default function HairStudioHero({ data, mode }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('hair_studio_color_bar');
  const t = surfacesOf(HAIR_STUDIO_SURFACES, appearance);
  const isDark = appearance === 'dark';
  const H = heroText('hair_studio_color_bar', locale);
  const headline = heroHeadline(data, H);
  const focus = heroFocusBadges(data, H.focus);
  const media = heroMedia('hair_studio_color_bar', data);
  const meta = heroMeta('hair_studio_color_bar', data);
  const video = heroVideo('hair_studio_color_bar', data);
  const compact = mode === 'mobile';

  const roseBtn: CSSProperties = { backgroundColor: t.rose, color: isDark ? '#241d1b' : '#ffffff' };

  return (
    <section
      id="section-hero"
      data-site-section="hero"
      data-section-state="ready"
      data-testid="site-hero"
      data-hero-theme="hair_studio_color_bar"
      data-hero-layout="editorial-gallery"
      className="site-section relative overflow-hidden"
      style={{ backgroundColor: t.paperDeep }}
    >
      {/* Printed double hairline frame */}
      <div className="absolute inset-3 md:inset-5 border pointer-events-none" style={{ borderColor: t.line }} />
      <div className="absolute inset-[14px] md:inset-[22px] border pointer-events-none" style={{ borderColor: t.line }} />

      <div className={`relative z-10 ${compact ? 'px-7 py-12' : 'px-10 md:px-14 py-14 md:py-20'}`}>
        {/* ---- Masthead rule --------------------------------------- */}
        <div
          data-testid="hero-brand"
          className="flex items-center justify-between gap-4 border-b pb-4"
          style={{ borderColor: t.line }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {data.logoUrl ? (
              <img
                data-testid="hero-logo"
                src={data.logoUrl}
                alt={`${heroSalonName(data)} logo`}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <span
                data-testid="hero-logo"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold tracking-[0.06em]"
                style={{ backgroundColor: t.roseSoft, color: t.roseDeep }}
              >
                {heroLogoInitials(data)}
              </span>
            )}
            <span
              data-testid="hero-salon-name"
              className="text-sm md:text-base font-serif truncate"
              style={{ color: t.ink, ...getSalonNameStyle(data) }}
            >
              {heroSalonName(data)}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.42em] shrink-0" style={{ color: t.roseDeep }}>
            {H.eyebrow}
          </span>
        </div>

        <div className={`grid gap-10 mt-10 ${compact ? 'grid-cols-1' : 'md:grid-cols-[0.98fr_1.02fr] items-end'}`}>
          {/* ---- Editorial copy ------------------------------------ */}
          <div>
            <h1
              data-testid="hero-headline"
              className={`font-serif leading-[1.02] ${compact ? 'text-[2.45rem]' : 'text-5xl md:text-[3.6rem]'}`}
              style={{ color: t.ink }}
            >
              {headline.main}
              {' '}
              <br />
              <em className="not-italic" style={{ color: t.roseDeep }}>{headline.accent}</em>
            </h1>
            <div className="h-px w-20 my-7" style={{ backgroundColor: t.rose }} />
            <p
              data-testid="hero-description"
              className="max-w-md text-xs md:text-sm leading-[1.85]"
              style={{ color: t.muted }}
            >
              {heroDescription(data, H.description)}
            </p>

            {/* PHASE 11.2 — colour-bar index, typeset as a printed contents list */}
            <div data-testid="hero-focus" className="mt-7 border-t pt-4" style={{ borderColor: t.line }}>
              <span className="text-[9px] uppercase tracking-[0.36em] font-semibold" style={{ color: t.roseDeep }}>
                {H.focusLabel}
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                {focus.map((label, index) => (
                  <span key={label} data-hero-focus-item={label} className="flex items-center gap-4">
                    {index > 0 && <span className="h-3 w-px" style={{ backgroundColor: t.line }} />}
                    <span className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: t.ink }}>
                      <span style={{ color: t.rose }}>{String(index + 1).padStart(2, '0')}</span> {label}
                    </span>
                  </span>
                ))}
              </div>
              <p data-testid="hero-audience" className="mt-3 text-[10px] italic" style={{ color: t.muted }}>
                {H.audience}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-9">
              <button
                type="button"
                data-testid="hero-book-cta"
                data-open-booking="true"
                onClick={openSiteBooking}
                className="site-touch px-9 py-3.5 text-[10px] uppercase tracking-[0.3em] font-semibold transition-all hover:brightness-110"
                style={roseBtn}
              >
                {H.primaryCta}
              </button>
              <button
                type="button"
                data-testid="hero-services-cta"
                onClick={() => scrollToSiteSection('section-services')}
                className="site-touch inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] font-semibold pb-1 border-b"
                style={{ color: t.ink, borderColor: t.ink }}
              >
                {H.secondaryCta} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Colophon line: rating · location · status */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-9 text-[10px] tracking-[0.1em]" style={{ color: t.muted }}>
              <span className="uppercase" style={{ color: t.roseDeep }}>{H.statValue} — {H.statLabel}</span>
              {meta.rating && (
                <span data-testid="hero-rating" className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" style={{ color: t.rose, fill: t.rose }} />
                  {meta.rating.average.toFixed(1)} / 5 · {meta.rating.count} {H['hero.reviewsSuffix']}
                </span>
              )}
              {meta.location && (
                <span data-testid="hero-location" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" style={{ color: t.rose }} /> {meta.location}
                </span>
              )}
              <span data-testid="hero-status">
                <SiteSalonStatus themeId="hair_studio_color_bar" data={data} placement="announcement" compact />
              </span>
            </div>
          </div>

          {/* ---- Contact-sheet gallery wall ------------------------ */}
          <div data-testid="hero-media" className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-[1.35fr_1fr]'}`}>
            <figure className="relative">
              <SiteImage
                src={media.primary.url}
                alt={H[media.primary.altKey]}
                className="w-full"
                context="hero"
                priority
                aspectRatio={compact ? '3/4' : '3/4.4'}
              />
              <figcaption
                className="absolute left-0 bottom-0 px-2.5 py-1.5 text-[8px] uppercase tracking-[0.24em] font-semibold"
                style={{ backgroundColor: t.card, color: t.roseDeep }}
              >
                01 · {H.mediaTitle}
              </figcaption>
            </figure>
            <div className="grid gap-3 content-start">
              {media.support.map((visual, index) => (
                <figure key={visual.url} className="relative">
                  <SiteImage
                    src={visual.url}
                    alt={H[visual.altKey]}
                    className="w-full"
                    context="hero"
                    priority
                    aspectRatio="1/1"
                  />
                  <figcaption
                    className="absolute left-0 bottom-0 px-2 py-1 text-[8px] uppercase tracking-[0.2em] font-semibold"
                    style={{ backgroundColor: t.card, color: t.muted }}
                  >
                    0{index + 2}
                  </figcaption>
                </figure>
              ))}
              {video ? (
                <a
                  data-testid="hero-video"
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="site-touch flex items-center gap-2 px-3 py-2.5 text-[9px] uppercase tracking-[0.2em] font-semibold border"
                  style={{ borderColor: t.line, color: t.roseDeep, backgroundColor: t.card }}
                >
                  <Play className="w-3.5 h-3.5" /> {video.title}
                </a>
              ) : (
                <p className="text-[9px] leading-relaxed uppercase tracking-[0.18em]" style={{ color: t.muted }}>
                  {H.mediaEyebrow}
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-8 text-[10px] leading-relaxed max-w-sm" style={{ color: t.muted }}>{H.mediaBody}</p>
      </div>
    </section>
  );
}
