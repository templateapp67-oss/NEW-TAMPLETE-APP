/**
 * PHASE 11.1 — HERO · BEAUTY, SKIN & SPA (beauty_skin_spa)
 *
 * Visual language (used by NO other theme):
 *   - A soft, fully rounded "petal" arch: the primary spa visual sits inside
 *     a tall arch (rounded-t-full) floating over pastel blobs.
 *   - Centred serif copy on mobile, arch-left / copy-right on larger frames.
 *   - Pill CTAs with soft shadows, and a floating rounded "ritual card"
 *     overlapping the arch with the signature treatment.
 *   - Meta shown as gentle rounded capsules (rating · location · status).
 */
import type { CSSProperties } from 'react';
import type { SalonData } from '../../types';
import SiteImage from '../SiteImage';
import SiteSalonStatus from '../SiteSalonStatus';
import { useSiteLocale, useThemeAppearance } from '../SiteHeader';
import { getSalonNameStyle } from '../../lib/brandIdentity';
import { BEAUTY_SPA_SURFACES, surfacesOf } from '../../lib/themeSurfaces';
import { heroText } from '../../lib/siteHeroI18n';
import { heroDescription, heroFocusBadges, heroHeadline, heroLogoInitials, heroMedia, heroMeta, heroSalonName, heroVideo } from '../../lib/siteHero';
import { openSiteBooking } from '../../lib/siteBooking';
import { scrollToSiteSection } from '../../lib/siteNavigation';
import type { ViewportMode } from '../../lib/siteStructure';
import { Star, MapPin, Flower2, Leaf, PlayCircle } from 'lucide-react';

interface Props {
  data: SalonData;
  mode: ViewportMode;
}

export default function BeautySpaHero({ data, mode }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('beauty_skin_spa');
  const t = surfacesOf(BEAUTY_SPA_SURFACES, appearance);
  const H = heroText('beauty_skin_spa', locale);
  const headline = heroHeadline(data, H);
  const focus = heroFocusBadges(data, H.focus);
  const media = heroMedia('beauty_skin_spa', data);
  const meta = heroMeta('beauty_skin_spa', data);
  const video = heroVideo('beauty_skin_spa', data);
  const compact = mode === 'mobile';

  const emeraldBtn: CSSProperties = { backgroundColor: t.emerald, color: '#ffffff' };
  const capsule: CSSProperties = { backgroundColor: t.card, color: t.text, borderColor: t.line };

  return (
    <section
      id="section-hero"
      data-site-section="hero"
      data-section-state="ready"
      data-testid="site-hero"
      data-hero-theme="beauty_skin_spa"
      data-hero-layout="soft-arch"
      className="site-section relative overflow-hidden"
      style={{ background: `linear-gradient(165deg, ${t.emeraldSoft} 0%, ${t.cream} 52%, ${t.beigeSoft} 100%)` }}
    >
      {/* Floating pastel blobs */}
      <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full opacity-60 pointer-events-none" style={{ backgroundColor: t.sage }} />
      <div className="absolute -bottom-24 -right-12 w-80 h-80 rounded-full opacity-60 pointer-events-none" style={{ backgroundColor: t.blush }} />

      <div className={`relative z-10 ${compact ? 'px-6 py-12' : 'px-8 md:px-12 py-16 md:py-20'}`}>
        <div className={`grid gap-10 items-center ${compact ? 'grid-cols-1' : 'md:grid-cols-[0.92fr_1.08fr]'}`}>
          {/* ---- The arch ----------------------------------------- */}
          <div data-testid="hero-media" className="relative order-1">
            <div
              className="absolute inset-x-6 -top-3 bottom-6 rounded-t-full rounded-b-[3rem] opacity-70"
              style={{ backgroundColor: t.sage }}
            />
            <div
              className="relative mx-auto w-[86%] overflow-hidden rounded-t-full rounded-b-[3rem] shadow-xl"
              style={{ backgroundColor: t.card }}
            >
              <SiteImage
                src={media.primary.url}
                alt={H[media.primary.altKey]}
                className="w-full"
                context="hero"
                priority
                aspectRatio="3/4"
              />
            </div>
            {/* Overlapping ritual card */}
            <div
              className="absolute -left-1 bottom-2 md:bottom-6 rounded-[1.6rem] px-4 py-3 shadow-lg border max-w-[62%]"
              style={{ backgroundColor: t.card, borderColor: t.line }}
            >
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.24em] font-semibold" style={{ color: t.emerald }}>
                <Flower2 className="w-3.5 h-3.5" /> {H.mediaEyebrow}
              </span>
              <p className="text-sm font-serif mt-1" style={{ color: t.textStrong }}>{H.mediaTitle}</p>
              <p className="text-[10px] leading-relaxed mt-1" style={{ color: t.muted }}>{H.mediaBody}</p>
            </div>
            {/* Small round support visuals, like pebbles */}
            <div className="absolute -right-2 top-6 flex flex-col gap-2">
              {media.support.map((visual) => (
                <div key={visual.url} className="w-14 h-14 rounded-full overflow-hidden border-4 shadow-md" style={{ borderColor: t.card }}>
                  <SiteImage
                    src={visual.url}
                    alt={H[visual.altKey]}
                    className="w-full h-full rounded-full"
                    context="hero"
                    priority
                    aspectRatio="1/1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ---- Calm copy ---------------------------------------- */}
          <div className={`order-2 ${compact ? 'text-center' : ''}`}>
            <div data-testid="hero-brand" className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
              {data.logoUrl ? (
                <img
                  data-testid="hero-logo"
                  src={data.logoUrl}
                  alt={`${heroSalonName(data)} logo`}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                />
              ) : (
                <span
                  data-testid="hero-logo"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{ backgroundColor: t.emeraldSoft, color: t.emerald }}
                >
                  {heroLogoInitials(data)}
                </span>
              )}
              <span
                data-testid="hero-salon-name"
                className="text-sm md:text-base font-serif"
                style={{ color: t.textStrong, ...getSalonNameStyle(data) }}
              >
                {heroSalonName(data)}
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mt-6 text-[10px] uppercase tracking-[0.3em] font-semibold ${compact ? 'mx-auto' : ''}`}
              style={{ backgroundColor: t.card, color: t.emerald }}
            >
              <Leaf className="w-3.5 h-3.5" /> {H.eyebrow}
            </span>

            <h1
              data-testid="hero-headline"
              className={`mt-5 font-serif leading-[1.08] ${compact ? 'text-[2.3rem]' : 'text-4xl md:text-[3.2rem]'}`}
              style={{ color: t.textStrong }}
            >
              {headline.main} <span style={{ color: t.emerald }}>{headline.accent}</span>
            </h1>

            <p
              data-testid="hero-description"
              className={`mt-5 text-xs md:text-sm leading-[1.9] ${compact ? 'mx-auto' : ''} max-w-md`}
              style={{ color: t.muted }}
            >
              {heroDescription(data, H.description)}
            </p>

            {/* PHASE 11.2 — ritual focus, as soft rounded petals */}
            <div data-testid="hero-focus" className="mt-7">
              <span className="text-[9px] uppercase tracking-[0.32em] font-semibold" style={{ color: t.emerald }}>
                {H.focusLabel}
              </span>
              <div className={`flex flex-wrap gap-2 mt-3 ${compact ? 'justify-center' : ''}`}>
                {focus.map((label) => (
                  <span
                    key={label}
                    data-hero-focus-item={label}
                    className="rounded-full px-3.5 py-1.5 text-[9px] font-semibold tracking-[0.14em]"
                    style={{ backgroundColor: t.card, color: t.emerald, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p data-testid="hero-audience" className="mt-3 text-[10px] leading-relaxed" style={{ color: t.muted }}>
                {H.audience}
              </p>
            </div>

            <div className={`flex flex-wrap gap-3 mt-8 ${compact ? 'justify-center' : ''}`}>
              <button
                type="button"
                data-testid="hero-book-cta"
                data-open-booking="true"
                onClick={openSiteBooking}
                className="site-touch rounded-full px-8 py-3.5 text-[10px] uppercase tracking-[0.26em] font-semibold shadow-md transition-all hover:brightness-105"
                style={emeraldBtn}
              >
                {H.primaryCta}
              </button>
              <button
                type="button"
                data-testid="hero-services-cta"
                onClick={() => scrollToSiteSection('section-services')}
                className="site-touch rounded-full px-8 py-3.5 text-[10px] uppercase tracking-[0.26em] font-semibold border transition-colors"
                style={{ borderColor: t.emerald, color: t.emerald, backgroundColor: 'transparent' }}
              >
                {H.secondaryCta}
              </button>
            </div>

            {/* Soft capsules */}
            <div className={`flex flex-wrap gap-2 mt-8 ${compact ? 'justify-center' : ''}`}>
              <span className="rounded-full border px-3 py-1.5 text-[9px] font-semibold tracking-[0.12em]" style={capsule}>
                {H.statValue} · {H.statLabel}
              </span>
              {meta.rating && (
                <span data-testid="hero-rating" className="rounded-full border px-3 py-1.5 text-[9px] font-semibold tracking-[0.12em] inline-flex items-center gap-1.5" style={capsule}>
                  <Star className="w-3 h-3" style={{ color: t.emerald, fill: t.emerald }} />
                  {meta.rating.average.toFixed(1)} · {meta.rating.count} {H['hero.reviewsSuffix']}
                </span>
              )}
              {meta.location && (
                <span data-testid="hero-location" className="rounded-full border px-3 py-1.5 text-[9px] font-semibold tracking-[0.12em] inline-flex items-center gap-1.5" style={capsule}>
                  <MapPin className="w-3 h-3" style={{ color: t.emerald }} /> {meta.location}
                </span>
              )}
              <span data-testid="hero-status">
                <SiteSalonStatus themeId="beauty_skin_spa" data={data} placement="announcement" compact />
              </span>
              {video && (
                <a
                  data-testid="hero-video"
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="site-touch rounded-full border px-3 py-1.5 text-[9px] font-semibold tracking-[0.12em] inline-flex items-center gap-1.5"
                  style={capsule}
                >
                  <PlayCircle className="w-3 h-3" style={{ color: t.emerald }} /> {video.title}
                </a>
              )}
            </div>

            <div className={`flex flex-wrap gap-x-6 gap-y-2 mt-6 text-[10px] ${compact ? 'justify-center' : ''}`} style={{ color: t.muted }}>
              <span>{H.chip1}</span>
              <span>{H.chip2}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
