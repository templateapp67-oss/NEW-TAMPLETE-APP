import type { CSSProperties } from 'react';
import { SalonData, getPublicStaffData } from '../types';
import SiteHeader, { useSiteLocale, useThemeAppearance } from './SiteHeader';
import OwnerAvatar from './OwnerAvatar';
import { BundlePrice, ServicePrice } from './PromotionalPricing';
import { FinalBookingCta, SectionStatePanel, structureCopyFrom } from './SiteSectionStates';
import SiteFooter from './SiteFooter';
import SiteFloatingActions from './SiteFloatingActions';
import SiteBookingHost from './SiteBookingHost';
import SiteAnnouncementBar from './SiteAnnouncementBar';
import SiteSalonStatus from './SiteSalonStatus';
import { openSiteBooking } from '../lib/siteBooking';
import { displayService } from '../lib/displayService';
import { BEAUTY_SPA_SURFACES, surfacesOf } from '../lib/themeSurfaces';
import { dayLabel, siteText, translateCategory } from '../lib/siteI18n';
import { structureText } from '../lib/siteStructureI18n';
import {
  activeCatalogItems,
  featuredServices,
  headerModeOf,
  resolveSectionState,
  sectionProps,
  siteFrameClass,
  siteGrid,
} from '../lib/siteStructure';
import type { ViewportMode } from '../lib/siteStructure';
import {
  Phone, MessageCircle, CalendarCheck, MapPin, Clock, Navigation,
  Video, Heart, Star, Quote, CreditCard, Leaf, Flower2, Sparkles, Droplets,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: ViewportMode;
}

/**
 * BEAUTY, SKIN & SPA — dedicated theme renderer (Theme ID: beauty_skin_spa).
 *
 * Soft pastel, emerald + beige, calm and serene premium wellness.
 * A genuinely distinct visual language vs. the other themes:
 *   - Airy cream/beige surfaces, soft emerald accents, rounded (pill/rounded-3xl)
 *     shapes, generous whitespace and soft shadows — nothing boxed or sharp
 *   - A split "Facial & Skincare" visual section with ambient imagery and
 *     treatment lists driven by the owner's existing service data
 *   - An emerald "Spa & Wellness Rituals" band (ambience, presentation-only)
 *   - Serif display headings, gentle pastel chips
 *
 * PHASE 10.2: dark mode = deep forest night-spa (BEAUTY_SPA_SURFACES);
 * all customer-facing copy flows from the global siteText() table (spa
 * namespace) in English / हिन्दी.
 */

export default function BeautySpaTemplateRenderer({ data, mode }: Props) {
  // Live locale + appearance: re-render when the header controls switch.
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('beauty_skin_spa');
  const t = surfacesOf(BEAUTY_SPA_SURFACES, appearance);
  const { emerald, emeraldDeep, emeraldMid, emeraldSoft, beigeSoft, cream, blush, sage, text, muted, line, card, bandBg, bandText, bandMuted } = t;
  const isDark = appearance === 'dark';
  const S = { ...siteText('beauty_skin_spa', locale), ...structureText('beauty_skin_spa', locale) };
  const X = structureCopyFrom(S);
  const palette = { accent: emerald, text, muted, card, line, invert: '#ffffff' };
  const headerMode = headerModeOf(mode);
  const services = activeCatalogItems(data.services);
  const packages = activeCatalogItems(data.packages);
  const featured = featuredServices(data.services);
  const servicesState = resolveSectionState('services', services);
  const featuredState = resolveSectionState('featured', featured);
  const offersState = resolveSectionState('offers', packages);
  const galleryState = resolveSectionState('gallery', data.gallery);
  const videosState = resolveSectionState('videos', data.socialVideos);
  const teamState = resolveSectionState('team', data.team);
  const ownerState = resolveSectionState('owner', data.ownerName ? [data.ownerName] : []);
  const aboutState = resolveSectionState('about', (data.about || S.heroFallbackAbout) ? [1] : []);
  const locationState = resolveSectionState('location', ['ready']);

  const btnEmerald: CSSProperties = {
    backgroundColor: emerald,
    color: '#ffffff',
  };

  const SPA_RITUALS = [
    { icon: Droplets, name: S.ritual1Name, desc: S.ritual1Desc },
    { icon: Flower2, name: S.ritual2Name, desc: S.ritual2Desc },
    { icon: Sparkles, name: S.ritual3Name, desc: S.ritual3Desc },
    { icon: Leaf, name: S.ritual4Name, desc: S.ritual4Desc },
  ];

  const REVIEWS = [
    { name: 'Pooja Malhotra', service: S.review1Service, quote: S.review1Quote },
    { name: 'Divya Rao', service: S.review2Service, quote: S.review2Quote },
    { name: 'Ayesha Qureshi', service: S.review3Service, quote: S.review3Quote },
  ];

  // Facial/skincare services rendered in the split section, derived from the
  // owner's existing service data (no new service data is added).
  const facialServices = (data.services || []).filter((s) => {
    const q = (s.name + ' ' + s.category).toLowerCase();
    return q.includes('facial') || q.includes('skin') || q.includes('glow') || q.includes('hydra');
  }).slice(0, 5);

  const spaServices = (data.services || []).filter((s) => {
    const q = (s.name + ' ' + s.category).toLowerCase();
    return q.includes('massage') || q.includes('spa') || q.includes('reflexology') || q.includes('body');
  }).slice(0, 5);

  const FACIAL_FALLBACKS = [S.facial1, S.facial2, S.facial3, S.facial4];

  return (
    <div className={`relative shadow-xl border flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${siteFrameClass(mode)} ${mode === 'mobile' ? 'site-has-mobile-dock' : ''}`} style={{ borderColor: line, backgroundColor: card }}>
      {mode !== 'mobile' ? (
        <div className="h-10 flex items-center px-4 gap-2 shrink-0 border-b" style={{ backgroundColor: cream, borderColor: line }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto px-4 py-1 rounded-full text-[10px] border font-mono tracking-wide" style={{ backgroundColor: card, borderColor: line, color: muted }}>
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start shrink-0" style={{ backgroundColor: card }}>
          <div className="w-24 h-4 rounded-b-xl" style={{ backgroundColor: line }}></div>
        </div>
      )}

      {/* Scrollable Website Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar site-scroll pb-20" style={{ backgroundColor: cream, color: text }}>
        <SiteAnnouncementBar themeId="beauty_skin_spa" data={data} />
        <SiteHeader themeId="beauty_skin_spa" data={data} mode={headerMode} />

        <div id="section-hero" data-site-section="hero" data-section-state="ready" className="site-section relative px-5 md:px-8 py-16 md:py-20 text-center overflow-hidden" style={{ background: `linear-gradient(160deg, ${emeraldSoft} 0%, ${cream} 55%, ${beigeSoft} 100%)` }}>
          {/* soft floating pastel blobs */}
          <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full opacity-50 pointer-events-none" style={{ backgroundColor: sage }}></div>
          <div className="absolute -bottom-16 -right-10 w-64 h-64 rounded-full opacity-50 pointer-events-none" style={{ backgroundColor: blush }}></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: card, color: emerald, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <Flower2 className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold">{S.heroBadge}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif leading-tight" style={{ color: text }}>
              {data.tagline || S.heroFallbackTagline}
            </h1>
            <p className="text-xs md:text-sm mt-6 mb-9 max-w-lg mx-auto leading-relaxed" style={{ color: muted }}>
              {data.about || S.heroFallbackAbout}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button data-open-booking="true" onClick={openSiteBooking} className="px-9 py-3.5 rounded-full text-[11px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-105 shadow-md" style={btnEmerald}>
                {S.heroPrimaryCta}
              </button>
              <button className="px-9 py-3.5 rounded-full text-[11px] uppercase tracking-[0.25em] font-semibold border transition-colors" style={{ borderColor: emerald, color: emerald, backgroundColor: 'transparent' }}>
                {S.heroSecondaryCta}
              </button>
            </div>
          </div>
        </div>

        <div {...sectionProps('trust', 'ready')} className="site-section px-5 md:px-8 py-10" style={{ backgroundColor: beigeSoft }}>
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.trustEyebrow}</span>
            <h2 className="text-xl md:text-2xl font-serif mt-2" style={{ color: text }}>{S.trustTitle}</h2>
            <div className={`grid gap-3 mt-7 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 1 })}`}>
              {[{ v: S.trust1Value, l: S.trust1Label }, { v: S.trust2Value, l: S.trust2Label }, { v: S.trust3Value, l: S.trust3Label }].map((stat) => (
                <div key={stat.l} className="rounded-3xl border p-4 min-w-0" style={{ borderColor: line, backgroundColor: card }}>
                  <p className="text-2xl font-serif" style={{ color: emerald }}>{stat.v}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] mt-1" style={{ color: muted }}>{stat.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div {...sectionProps('featured', featuredState)} className="site-section px-5 md:px-8 py-14" style={{ backgroundColor: cream }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.featuredEyebrow}</span>
              <h2 className="text-2xl font-serif mt-2" style={{ color: text }}>{S.featuredTitle}</h2>
            </div>
            {featuredState === 'ready' ? (
              <div className={`grid gap-4 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
                {featured.map((s) => {
                  const shown = displayService(s, locale);
                  return (
                    <div key={s.id} className="rounded-3xl border p-5 min-w-0" style={{ borderColor: line, backgroundColor: card }}>
                      <div className="flex justify-between gap-3">
                        <h4 className="font-serif font-semibold text-sm break-words" style={{ color: text }}>{shown.name}</h4>
                        <ServicePrice service={s} offers={data.offers} style={{ color: emerald }} compact dark={isDark} />
                      </div>
                      <button data-open-booking="true" onClick={openSiteBooking} className="site-touch mt-4 rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold" style={btnEmerald}>{S['common.bookNow']}</button>
                    </div>
                  );
                })}
              </div>
            ) : <SectionStatePanel status={featuredState} copy={X} palette={palette} emptyTitle={S.featuredEmpty} />}
          </div>
        </div>

        <div {...sectionProps('services', servicesState)} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: cream }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.servicesEyebrow}</span>
              <h2 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S.servicesTitle}</h2>
              <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: muted }}>
                {S.servicesSubtitle}
              </p>
            </div>

            {servicesState !== 'ready' ? <SectionStatePanel status={servicesState} copy={X} palette={palette} emptyTitle={S.servicesEmpty} /> : (
            <div className={`grid gap-5 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
              {services.map((s) => {
                const shown = displayService(s, locale);
                return (
                <div key={s.id} className="rounded-3xl p-6 border transition-all hover:-translate-y-0.5 min-w-0" style={{ backgroundColor: card, borderColor: line, boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)' }}>
                  {shown.imageUrl && <img src={shown.imageUrl} alt="" className="w-full h-24 object-cover rounded-2xl mb-3" />}
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="font-serif font-semibold text-sm break-words" style={{ color: text }}>{shown.name}</h4>
                    <ServicePrice service={s} offers={data.offers} style={{ color: emerald }} compact dark={isDark} />
                  </div>
                  <span className="inline-block text-[9px] uppercase tracking-[0.2em] font-semibold px-2.5 py-0.5 rounded-full mb-3" style={{ backgroundColor: emeraldSoft, color: isDark ? '#bfe3d6' : emeraldDeep }}>
                    {translateCategory(s.category, locale)}
                  </span>
                  <p className="text-xs leading-relaxed line-clamp-2 mb-4 break-words" style={{ color: muted }}>{shown.description}</p>
                  <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: line }}>
                    <span className="text-[11px] font-medium" style={{ color: muted }}>{s.duration} {S['common.mins']}</span>
                    <button data-open-booking="true" onClick={openSiteBooking} className="px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all hover:brightness-105" style={btnEmerald}>
                      {S['common.bookNow']}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
            )}
          </div>
        </div>

        <div {...sectionProps('offers', offersState)} className="site-section px-5 md:px-8 py-14" style={{ backgroundColor: beigeSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.packagesEyebrow}</span>
              <h3 className="text-xl font-serif mt-2" style={{ color: text }}>{S.packagesTitle}</h3>
            </div>
            {offersState === 'ready' ? (
              <div className="grid gap-4 grid-cols-1">
                {packages.map((p) => (
                  <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border min-w-0" style={{ backgroundColor: card, borderColor: line }}>
                    <div className="space-y-1 max-w-xl min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-serif font-semibold text-sm break-words" style={{ color: text }}>{p.name}</h4>
                        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: blush, color: isDark ? '#ffd9ef' : emeraldDeep }}>{S['common.bestValue']}</span>
                      </div>
                      <p className="text-xs leading-relaxed break-words" style={{ color: muted }}>{p.description}</p>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                      <BundlePrice bundle={p} offers={data.offers} style={{ color: emerald }} dark={isDark} />
                      <button data-open-booking="true" onClick={openSiteBooking} className="site-touch px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold" style={btnEmerald}>{S['common.bookPackage']}</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <SectionStatePanel status={offersState} copy={X} palette={palette} emptyTitle={S.offersEmpty} />}
          </div>
        </div>

        {/* Facial & Skincare — split visual section */}
        <div id="section-skincare" className="px-8 py-16" style={{ backgroundColor: beigeSoft }}>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden border" style={{ borderColor: line }}>
                <img
                  src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop"
                  alt="Facial & Skincare"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-3 right-3 rounded-2xl px-5 py-4 shadow-lg" style={{ backgroundColor: emerald }}>
                <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/80">{S.signatureBadge}</p>
                <p className="text-sm font-serif font-semibold text-white">{S.signatureTitle}</p>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.skincareEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S.skincareTitle}</h3>
              <p className="text-xs mt-4 leading-relaxed" style={{ color: muted }}>
                {S.skincareBody}
              </p>

              <div className="mt-6 space-y-3">
                {facialServices.length > 0 ? (
                  facialServices.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border" style={{ borderColor: line, backgroundColor: card }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: emeraldMid }}></div>
                        <div className="min-w-0">
                          <p className="text-sm font-serif font-semibold truncate" style={{ color: text }}>{displayService(s, locale).name}</p>
                          <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: muted }}>{s.duration} {S['common.mins']}</p>
                        </div>
                      </div>
                      <ServicePrice service={s} offers={data.offers} style={{ color: emerald }} compact dark={isDark} />
                    </div>
                  ))
                ) : (
                  <>
                    {FACIAL_FALLBACKS.map((label) => (
                      <div key={label} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border" style={{ borderColor: line, backgroundColor: card }}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: emeraldMid }}></div>
                        <p className="text-sm font-serif font-semibold" style={{ color: text }}>{label}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spa & Wellness — emerald rituals band */}
        <div id="section-wellness" className="px-8 py-16" style={{ backgroundColor: bandBg }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: bandMuted }}>{S.wellnessEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: bandText }}>{S.wellnessTitle}</h3>
              <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: bandMuted }}>
                {S.wellnessBody}
              </p>
            </div>

            <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {SPA_RITUALS.map((ritual) => {
                const Icon = ritual.icon;
                return (
                  <div key={ritual.name} className="rounded-3xl p-5 text-center bg-white/10 backdrop-blur-xs border border-white/15">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 bg-white/15">
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <p className="text-sm font-serif font-semibold text-white">{ritual.name}</p>
                    <p className="text-[10px] leading-relaxed mt-1.5 text-white/70">{ritual.desc}</p>
                  </div>
                );
              })}
            </div>

            {spaServices.length > 0 && (
              <div className="mt-8 grid gap-3">
                {spaServices.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-white/10 border border-white/15">
                    <div className="flex items-center gap-3 min-w-0">
                      <Droplets className="w-4 h-4 shrink-0 text-white/80" />
                      <div className="min-w-0">
                        <p className="text-sm font-serif font-semibold text-white truncate">{displayService(s, locale).name}</p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">{s.duration} {S['common.mins']}</p>
                      </div>
                    </div>
                    <ServicePrice service={s} offers={data.offers} className="text-white" compact dark />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div {...sectionProps('gallery', galleryState)} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: cream }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.galleryEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S.galleryTitle}</h3>
            </div>
            {galleryState === 'ready' ? (
              <div className={`grid gap-4 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 2 })}`}>
                {(data.gallery || []).map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-[1.75rem] overflow-hidden border group" style={{ borderColor: line }}>
                    <img src={item.url} alt={item.alt || S['common.defaultPhotoAlt']} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                ))}
              </div>
            ) : <SectionStatePanel status={galleryState} copy={X} palette={palette} emptyTitle={S.galleryEmpty} />}
          </div>
        </div>

        <div {...sectionProps('videos', videosState)} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: beigeSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold flex items-center justify-center gap-2" style={{ color: emerald }}>
                <Video className="w-3 h-3" /> {S.videosEyebrow}
              </span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S.videosTitle}</h3>
            </div>
            {videosState === 'ready' ? (
              <div className={`grid gap-4 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 2 })}`}>
                {(data.socialVideos || []).map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] rounded-[1.5rem] overflow-hidden group border" style={{ borderColor: line }}>
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(21,89,74,0.85), transparent)' }}></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white"><p className="text-xs font-serif font-semibold line-clamp-2">{video.title}</p></div>
                  </div>
                ))}
              </div>
            ) : <SectionStatePanel status={videosState} copy={X} palette={palette} emptyTitle={S.videosEmpty} />}
          </div>
        </div>

        <div {...sectionProps('about', aboutState)} className="site-section px-5 md:px-8 py-14" style={{ backgroundColor: cream }}>
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.aboutEyebrow}</span>
            <h3 className="text-2xl font-serif mt-3" style={{ color: text }}>{S.aboutTitle}</h3>
            <p className="text-xs mt-4 leading-relaxed" style={{ color: muted }}>{data.about || S.heroFallbackAbout}</p>
          </div>
        </div>

        <div {...sectionProps('owner', ownerState)} className="site-section px-5 md:px-8 py-14 border-y" style={{ backgroundColor: beigeSoft, borderColor: line }}>
          {ownerState === 'ready' ? (
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 border-4" style={{ borderColor: emeraldSoft }}>
                <OwnerAvatar photoUrl={data.ownerPhotoUrl} name={data.ownerName} className="w-full h-full text-3xl" alt="Founder" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{data.ownerRole || S.ownerFallbackRole}</span>
                <h3 className="text-2xl font-serif mt-1 break-words" style={{ color: text }}>{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed italic" style={{ color: muted }}>“{data.reviewedContent?.ownerIntro || S.ownerFallbackIntro}”</p>
              </div>
            </div>
          ) : <div className="max-w-3xl mx-auto"><SectionStatePanel status={ownerState} copy={X} palette={palette} emptyTitle={S.ownerEmptyTitle} emptyBody={S.ownerEmptyBody} /></div>}
        </div>

        <div {...sectionProps('team', teamState)} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: cream }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.teamEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S.teamTitle}</h3>
            </div>
            {teamState === 'ready' ? (
              <div className={`grid gap-6 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
                {data.team.map((member) => {
                  const pub = getPublicStaffData(member);
                  return (
                    <div key={pub.id} className="rounded-3xl border p-6 flex flex-col gap-4 min-w-0" style={{ borderColor: line, backgroundColor: card }}>
                      <div className="flex items-center gap-4">
                        <img src={pub.imageUrl} alt={pub.name} className="w-16 h-16 rounded-full object-cover border-2 shrink-0" style={{ borderColor: emeraldSoft }} />
                        <div className="min-w-0">
                          <h4 className="font-serif font-semibold text-base break-words" style={{ color: text }}>{pub.name}</h4>
                          <p className="text-[10px] uppercase tracking-[0.25em] mt-1" style={{ color: emerald }}>{pub.role}</p>
                        </div>
                      </div>
                      <button data-open-booking="true" onClick={openSiteBooking} className="site-touch w-full py-2.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-semibold mt-auto" style={btnEmerald}>{S['common.bookWith'].replace('{name}', pub.name.split(' ')[0])}</button>
                    </div>
                  );
                })}
              </div>
            ) : <SectionStatePanel status={teamState} copy={X} palette={palette} />}
          </div>
        </div>

        <div {...sectionProps('reviews', 'ready')} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: beigeSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S.reviewsEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S.reviewsTitle}</h3>
            </div>
            <div className={`grid gap-6 ${siteGrid(mode, { desktop: 3, tablet: 2, mobile: 1 })}`}>
              {REVIEWS.map((r, i) => (
                <div key={i} className="rounded-3xl border p-6 flex flex-col gap-3" style={{ borderColor: line, backgroundColor: card }}>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5" style={{ color: emeraldMid, fill: emeraldMid }} />
                    ))}
                  </div>
                  <Quote className="w-5 h-5" style={{ color: emeraldMid }} />
                  <p className="text-xs leading-relaxed italic flex-1 font-serif" style={{ color: text }}>
                    “{r.quote}”
                  </p>
                  <div className="pt-3 border-t" style={{ borderColor: line }}>
                    <p className="text-xs font-semibold" style={{ color: text }}>{r.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: emerald }}>{r.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Videos */}
        {data.socialVideos && data.socialVideos.length > 0 && (
          <div id="section-social" className="px-8 py-16" style={{ backgroundColor: cream }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold flex items-center justify-center gap-2" style={{ color: emerald }}>
                  <Video className="w-3 h-3" /> {S.videosEyebrow}
                </span>
                <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S.videosTitle}</h3>
              </div>
              <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.socialVideos.map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] rounded-[1.5rem] overflow-hidden group border" style={{ borderColor: line }}>
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(21,89,74,0.85), transparent)' }}></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-xs font-serif font-semibold line-clamp-2">{video.title}</p>
                      {video.likesCount && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold mt-1 text-white/80">
                          <Heart className="w-3 h-3" style={{ fill: '#ffffff' }} /> {video.likesCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location & Hours */}
        <div {...sectionProps('location', locationState)} className="site-section px-5 md:px-8 py-16 border-t" style={{ backgroundColor: beigeSoft, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>{S['common.visitEyebrow']}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>{S['common.visitTitle']}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border space-y-4" style={{ borderColor: line, backgroundColor: card }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: text }}>
                  <MapPin className="w-4 h-4" style={{ color: emerald }} /> {S.addressLabel}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="w-full py-2.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-105 flex items-center justify-center gap-2" style={btnEmerald}>
                  <Navigation className="w-3.5 h-3.5" /> {S['common.getDirections']}
                </button>
              </div>

              <div className="p-6 rounded-3xl border space-y-3" style={{ borderColor: line, backgroundColor: card }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: text }}>
                  <Clock className="w-4 h-4" style={{ color: emerald }} /> {S['common.openingHours']}
                </h4>
                <SiteSalonStatus themeId="beauty_skin_spa" data={data} placement="contact" />
                <div className="space-y-2 text-xs" style={{ color: muted }}>
                  {data.openingHours ? (
                    Object.entries(data.openingHours).map(([day, sch]) => (
                      <div key={day} className="flex justify-between border-b pb-1.5" style={{ borderColor: line }}>
                        <span className="font-semibold" style={{ color: text }}>{dayLabel(day, locale)}</span>
                        {sch.open ? <span>{sch.startTime} – {sch.endTime}</span> : <span className="font-semibold" style={{ color: emerald }}>{S['common.closed']}</span>}
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between"><span>Mon - Sat</span><span>10:00 AM - 8:00 PM</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Booking */}
        <div id="section-contact" className="px-8 py-16 text-center" style={{ backgroundColor: cream }}>
          <div className="max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: emeraldSoft }}>
              <CalendarCheck className="w-6 h-6" style={{ color: emerald }} />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif mb-6" style={{ color: text }}>{S.contactTitle}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button className="py-3 rounded-full border font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors" style={{ borderColor: line, color: text, backgroundColor: card }}>
                <Phone className="w-4 h-4" style={{ color: emerald }} /> {S['common.callNow']}
              </button>
              <button className="py-3 rounded-full text-white font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-105" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> {S['common.whatsApp']}
              </button>
              <button className="py-3 rounded-full font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-105" style={btnEmerald}>
                <CalendarCheck className="w-4 h-4" /> {S['common.bookOnline']}
              </button>
            </div>

            <div className="p-5 rounded-3xl border text-left text-xs space-y-2" style={{ borderColor: line, backgroundColor: card }}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 uppercase tracking-[0.15em] text-[10px]" style={{ color: text }}>
                  <CreditCard className="w-4 h-4" style={{ color: emerald }} /> {S.depositTitle}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ backgroundColor: emeraldSoft, color: isDark ? '#bfe3d6' : emeraldDeep }}>{S['common.advanceAdvance']}</span>
              </div>
              <p style={{ color: muted }}>{S.depositBody}</p>
            </div>
          </div>
        </div>

        <FinalBookingCta themeId="beauty_skin_spa" data={data} title={S.bookingTitle} body={S.bookingBody} cta={S['struct.bookCta']} palette={palette} />
        <SiteFooter themeId="beauty_skin_spa" data={data} />
        {mode === 'mobile' && <div className="site-mobile-dock-spacer" aria-hidden />}
      </div>
      <SiteFloatingActions themeId="beauty_skin_spa" data={data} mode={mode} />
      <SiteBookingHost data={data} />
    </div>
  );
}
