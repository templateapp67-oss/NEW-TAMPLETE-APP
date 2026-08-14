/**
 * PHASE 11.1 — HERO · BARBER & MEN'S GROOMING (barber_mens_grooming)
 *
 * Visual language (used by NO other theme):
 *   - Full-bleed cinematic charcoal frame with a hard gold rule running
 *     down the left edge and a barber-pole stripe texture.
 *   - Left-aligned, uppercase, heavy slab typography with a numbered
 *     "chair" plate; sharp corners everywhere (zero border radius).
 *   - A vertical film-strip of two supporting grooming shots on the right,
 *     stacked behind a gold-bordered plate.
 *   - Bottom "brass rail" bar carrying the stat, rating, location and the
 *     live open/closed lamp.
 *
 * Layout, spacing and structure are deliberately unique to this theme.
 */
import type { CSSProperties } from 'react';
import type { SalonData } from '../../types';
import SiteImage from '../SiteImage';
import SiteSalonStatus from '../SiteSalonStatus';
import { useSiteLocale, useThemeAppearance } from '../SiteHeader';
import { getSalonNameStyle } from '../../lib/brandIdentity';
import { BARBER_SURFACES, surfacesOf } from '../../lib/themeSurfaces';
import { heroText } from '../../lib/siteHeroI18n';
import { heroDescription, heroFocusBadges, heroHeadline, heroLogoInitials, heroMedia, heroMeta, heroSalonName, heroVideo } from '../../lib/siteHero';
import { openSiteBooking } from '../../lib/siteBooking';
import { scrollToSiteSection } from '../../lib/siteNavigation';
import type { ViewportMode } from '../../lib/siteStructure';
import { Star, MapPin, Scissors, PlayCircle } from 'lucide-react';

interface Props {
  data: SalonData;
  mode: ViewportMode;
}

export default function BarberHero({ data, mode }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('barber_mens_grooming');
  const t = surfacesOf(BARBER_SURFACES, appearance);
  const H = heroText('barber_mens_grooming', locale);
  const headline = heroHeadline(data, H);
  const focus = heroFocusBadges(data, H.focus);
  const media = heroMedia('barber_mens_grooming', data);
  const meta = heroMeta('barber_mens_grooming', data);
  const video = heroVideo('barber_mens_grooming', data);
  const compact = mode === 'mobile';

  const goldBtn: CSSProperties = { backgroundColor: t.gold, color: '#141414' };

  return (
    <section
      id="section-hero"
      data-site-section="hero"
      data-section-state="ready"
      data-testid="site-hero"
      data-hero-theme="barber_mens_grooming"
      data-hero-layout="cinematic-slab"
      className="site-section relative overflow-hidden"
      style={{ backgroundColor: t.charcoal }}
    >
      {/* Cinematic backdrop — the barber floor shot, darkened. */}
      <SiteImage
        src={media.primary.url}
        alt={H[media.primary.altKey]}
        className="absolute inset-0 w-full h-full"
        style={{ position: 'absolute', opacity: appearance === 'dark' ? 0.28 : 0.16 }}
        context="hero"
        priority
        aspectRatio="16/9"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(100deg, ${t.charcoal} 32%, transparent 130%)` }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: `repeating-linear-gradient(135deg, ${t.gold} 0px, ${t.gold} 2px, transparent 2px, transparent 16px)` }}
      />
      {/* Hard gold rule down the left edge — barber-pole anchor. */}
      <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{ backgroundColor: t.gold }} />

      <div className={`relative z-10 ${compact ? 'px-5 py-12' : 'px-8 md:px-12 py-16 md:py-24'}`}>
        <div className={`grid gap-10 items-center ${compact ? 'grid-cols-1' : 'md:grid-cols-[1.25fr_0.75fr]'}`}>
          {/* ---- Type column ------------------------------------- */}
          <div>
            {/* Brand lockup */}
            <div data-testid="hero-brand" className="flex items-center gap-3">
              {data.logoUrl ? (
                <img
                  data-testid="hero-logo"
                  src={data.logoUrl}
                  alt={`${heroSalonName(data)} logo`}
                  className="w-11 h-11 object-cover border"
                  style={{ borderColor: t.gold }}
                />
              ) : (
                <span
                  data-testid="hero-logo"
                  className="w-11 h-11 flex items-center justify-center text-[13px] font-black tracking-[0.08em] border"
                  style={{ borderColor: t.gold, color: t.gold, backgroundColor: '#141414' }}
                >
                  {heroLogoInitials(data)}
                </span>
              )}
              <span
                data-testid="hero-salon-name"
                className="text-sm md:text-base font-black uppercase tracking-[0.32em]"
                style={{ color: t.textStrong, ...getSalonNameStyle(data) }}
              >
                {heroSalonName(data)}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <span className="h-px w-12" style={{ backgroundColor: t.gold }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: t.accentText }}>
                {H.eyebrow}
              </span>
            </div>

            <h1
              data-testid="hero-headline"
              className={`mt-4 font-black uppercase leading-[0.92] tracking-[0.02em] ${compact ? 'text-[2.35rem]' : 'text-5xl md:text-6xl'}`}
              style={{ color: t.textStrong }}
            >
              {headline.main}
              {' '}
              <br />
              <span style={{ color: t.gold }}>{headline.accent}</span>
            </h1>

            <p
              data-testid="hero-description"
              className="mt-6 max-w-xl text-xs md:text-sm leading-relaxed"
              style={{ color: t.muted }}
            >
              {heroDescription(data, H.description)}
            </p>

            {/* PHASE 11.2 — grooming focus, set as a hard-edged stencil row */}
            <div data-testid="hero-focus" className="mt-7">
              <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: t.muted }}>
                {H.focusLabel}
              </span>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {focus.map((label) => (
                  <span
                    key={label}
                    data-hero-focus-item={label}
                    className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] border"
                    style={{ borderColor: t.gold, color: t.accentText, backgroundColor: 'transparent' }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p data-testid="hero-audience" className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: t.muted }}>
                {H.audience}
              </p>
            </div>

            {/* Sharp slab CTAs */}
            <div className="flex flex-wrap gap-3 mt-9">
              <button
                type="button"
                data-testid="hero-book-cta"
                data-open-booking="true"
                onClick={openSiteBooking}
                className="site-touch px-8 py-4 text-[11px] font-black uppercase tracking-[0.22em] transition-all hover:brightness-110"
                style={goldBtn}
              >
                {H.primaryCta}
              </button>
              <button
                type="button"
                data-testid="hero-services-cta"
                onClick={() => scrollToSiteSection('section-services')}
                className="site-touch px-8 py-4 text-[11px] font-black uppercase tracking-[0.22em] border transition-all hover:bg-white/5"
                style={{ borderColor: t.gold, color: t.accentText }}
              >
                {H.secondaryCta}
              </button>
            </div>

            <div className="flex flex-wrap gap-x-7 gap-y-2 mt-8 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: t.text }}>
              <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5" style={{ color: t.gold }} /> {H.chip1}</span>
              <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5" style={{ color: t.gold }} /> {H.chip2}</span>
            </div>
          </div>

          {/* ---- Film-strip plate -------------------------------- */}
          <div data-testid="hero-media" className={`relative ${compact ? 'mt-2' : ''}`}>
            <div className="absolute -inset-2 border pointer-events-none" style={{ borderColor: t.gold, opacity: 0.55 }} />
            <div className="relative grid gap-2">
              {media.support.map((visual, index) => (
                <div key={visual.url} className="relative">
                  <SiteImage
                    src={visual.url}
                    alt={H[visual.altKey]}
                    className="w-full"
                    context="hero"
                    priority
                    aspectRatio={index === 0 ? '4/3' : '16/9'}
                  />
                  <span
                    className="absolute left-0 bottom-0 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em]"
                    style={{ backgroundColor: t.gold, color: '#141414' }}
                  >
                    {index === 0 ? H.mediaEyebrow : H.mediaTitle}
                  </span>
                </div>
              ))}
            </div>
            {video && (
              <a
                data-testid="hero-video"
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="site-touch mt-2 flex items-center gap-2 px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.18em] border"
                style={{ borderColor: t.gold, color: t.accentText, backgroundColor: t.card }}
              >
                <PlayCircle className="w-4 h-4" /> {video.title}
              </a>
            )}
            <p className="mt-3 text-[10px] leading-relaxed" style={{ color: t.muted }}>{H.mediaBody}</p>
          </div>
        </div>

        {/* ---- Brass rail: stat · rating · location · status ----- */}
        <div
          className={`mt-12 border-t pt-5 flex flex-wrap items-center gap-x-8 gap-y-3 ${compact ? 'justify-start' : ''}`}
          style={{ borderColor: t.line }}
        >
          <span className="flex items-baseline gap-2">
            <span className="text-2xl font-black" style={{ color: t.gold }}>{H.statValue}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: t.muted }}>{H.statLabel}</span>
          </span>
          {meta.rating && (
            <span data-testid="hero-rating" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: t.text }}>
              <Star className="w-3.5 h-3.5" style={{ color: t.gold, fill: t.gold }} />
              {meta.rating.average.toFixed(1)} · {meta.rating.count} {H['hero.reviewsSuffix']}
            </span>
          )}
          {meta.location && (
            <span data-testid="hero-location" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: t.text }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: t.gold }} /> {meta.location}
            </span>
          )}
          <span data-testid="hero-status">
            <SiteSalonStatus themeId="barber_mens_grooming" data={data} placement="announcement" compact />
          </span>
        </div>
      </div>
    </section>
  );
}
