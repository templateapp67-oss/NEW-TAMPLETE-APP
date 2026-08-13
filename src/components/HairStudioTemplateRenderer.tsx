import type { CSSProperties } from 'react';
import { SalonData, getPublicStaffData } from '../types';
import { getSalonNameStyle } from '../lib/brandIdentity';
import SiteHeader, { useSiteLocale, useThemeAppearance } from './SiteHeader';
import OwnerAvatar from './OwnerAvatar';
import { BundlePrice, ServicePrice } from './PromotionalPricing';
import { FinalBookingCta, SectionStatePanel, structureCopyFrom } from './SiteSectionStates';
import { displayService } from '../lib/displayService';
import { HAIR_STUDIO_SURFACES, surfacesOf } from '../lib/themeSurfaces';
import { dayLabel, siteText, translateCategory } from '../lib/siteI18n';
import { structureText } from '../lib/siteStructureI18n';
import {
  activeCatalogItems,
  announcementOffer,
  featuredServices,
  headerModeOf,
  resolveSectionState,
  sectionProps,
  siteFrameClass,
  siteGrid,
} from '../lib/siteStructure';
import type { ViewportMode } from '../lib/siteStructure';
import {
  Scissors, Phone, MessageCircle, CalendarCheck, MapPin, Clock, Navigation,
  Video, Heart, Star, Quote, CreditCard, Palette,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: ViewportMode;
}

/**
 * HAIR STUDIO & COLOR BAR — dedicated theme renderer (Theme ID: hair_studio_color_bar).
 *
 * A modern-studio, minimalist monochrome + rose-gold editorial experience.
 * Distinct from the existing themes:
 *   - Light warm-paper surfaces, near-black ink, serif display type
 *   - Hairline rules and generous whitespace instead of boxed cards
 *   - A signature "Color Showcase" gallery of hair-color treatments
 *     (Balayage, Ombre, Highlights, Global Color, Fashion Color…)
 *   - An editorial services menu (numbered entries, no heavy cards)
 *
 * PHASE 10.2: dark mode = espresso-ink surfaces with brighter rose-gold
 * (HAIR_STUDIO_SURFACES); all customer-facing copy flows from the global
 * siteText() table (hair namespace) in English / हिन्दी.
 */

interface ColorSwatch {
  name: string;
  desc: string;
  gradient: string;
}

const COLOR_SHOWCASE: ColorSwatch[] = [
  { name: 'Balayage', desc: 'Hand-painted, sun-kissed dimension', gradient: 'linear-gradient(160deg, #3b2416 0%, #8a5a34 45%, #e6c79a 100%)' },
  { name: 'Ombre', desc: 'Shadow-root to tip gradient', gradient: 'linear-gradient(180deg, #241510 0%, #7a4b33 55%, #d9b287 100%)' },
  { name: 'Highlights & Lowlights', desc: 'Dimensional, multi-tonal finish', gradient: 'linear-gradient(160deg, #e9d9b8 0%, #b8895a 50%, #6b4a2c 100%)' },
  { name: 'Global Color', desc: 'Rich, all-over glossy tone', gradient: 'linear-gradient(160deg, #4a1f1f 0%, #7a3030 60%, #a05a4a 100%)' },
  { name: 'Fashion Color', desc: 'Bold pastel & vivid statements', gradient: 'linear-gradient(160deg, #f4c2d7 0%, #b48ec9 50%, #8fb8d8 100%)' },
  { name: 'Gloss & Tone', desc: 'Glass-like shine refresh', gradient: 'linear-gradient(160deg, #2c2226 0%, #6b4a52 50%, #c48b96 100%)' },
];

export default function HairStudioTemplateRenderer({ data, mode }: Props) {
  // Live locale + appearance: re-render when the header controls switch.
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('hair_studio_color_bar');
  const t = surfacesOf(HAIR_STUDIO_SURFACES, appearance);
  const { ink, inkSoft, paper, paperDeep, rose, roseBright, roseSoft, roseDeep, line, muted, card, footerBg } = t;
  const isDark = appearance === 'dark';
  const S = { ...siteText('hair_studio_color_bar', locale), ...structureText('hair_studio_color_bar', locale) };
  const X = structureCopyFrom(S);
  const palette = { accent: rose, text: ink, muted, card, line, invert: isDark ? '#241d1b' : '#ffffff' };
  const headerMode = headerModeOf(mode);
  const services = activeCatalogItems(data.services);
  const packages = activeCatalogItems(data.packages);
  const featured = featuredServices(data.services);
  const promo = announcementOffer(data);
  const servicesState = resolveSectionState('services', services);
  const featuredState = resolveSectionState('featured', featured);
  const offersState = resolveSectionState('offers', packages);
  const galleryState = resolveSectionState('gallery', data.gallery);
  const videosState = resolveSectionState('videos', data.socialVideos);
  const teamState = resolveSectionState('team', data.team);
  const ownerState = resolveSectionState('owner', data.ownerName ? [data.ownerName] : []);
  const aboutState = resolveSectionState('about', (data.about || S.heroFallbackAbout) ? [1] : []);
  const locationState = resolveSectionState('location', ['ready']);

  // Keep the owner's chosen font style for the salon name; footer is a dark
  // slab in both appearances so the fallback stays paper-light there.
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = '#faf8f5';

  const btnRose: CSSProperties = {
    backgroundColor: rose,
    color: isDark ? '#241d1b' : '#ffffff',
  };

  const REVIEWS = [
    { name: 'Ananya Iyer', service: S.review1Service, quote: S.review1Quote },
    { name: 'Sara Khan', service: S.review2Service, quote: S.review2Quote },
    { name: 'Meera Nair', service: S.review3Service, quote: S.review3Quote },
  ];

  return (
    <div className={`shadow-xl border flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${siteFrameClass(mode)}`} style={{ borderColor: line, backgroundColor: card }}>
      {/* Browser/Phone Header Bar (mock chrome — not part of the website) */}
      {mode !== 'mobile' ? (
        <div className="h-10 flex items-center px-4 gap-2 shrink-0 border-b" style={{ backgroundColor: paper, borderColor: line }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto px-4 py-1 rounded text-[10px] border font-mono tracking-wide" style={{ backgroundColor: card, borderColor: line, color: muted }}>
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start shrink-0" style={{ backgroundColor: card }}>
          <div className="w-24 h-4 rounded-b-xl" style={{ backgroundColor: line }}></div>
        </div>
      )}

      {/* Scrollable Website Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar site-scroll pb-20" style={{ backgroundColor: paper, color: ink }}>
        <div {...sectionProps('announcement', 'ready')} className="site-section px-4 py-2.5 flex flex-wrap items-center justify-center gap-2 text-center border-b" style={{ backgroundColor: paperDeep, borderColor: line, color: ink }}>
          <span className="text-[9px] uppercase tracking-[0.28em] font-semibold" style={{ color: roseDeep }}>{promo?.badge || S.announceBadge}</span>
          <p className="text-[11px] font-medium min-w-0 break-words">{promo ? promo.title : S.announceDefault}</p>
        </div>
        <SiteHeader themeId="hair_studio_color_bar" data={data} mode={headerMode} />

        <div id="section-hero" data-site-section="hero" data-section-state="ready" className="site-section relative px-5 md:px-8 py-16 md:py-20 text-center overflow-hidden" style={{ backgroundColor: paperDeep }}>
          {/* subtle double hairline frame */}
          <div className="absolute inset-4 border pointer-events-none" style={{ borderColor: line }}></div>
          <div className="absolute inset-[18px] border pointer-events-none" style={{ borderColor: line }}></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-6">
              <span className="h-px w-12" style={{ backgroundColor: rose }}></span>
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>
                {S.heroEyebrow}
              </span>
              <span className="h-px w-12" style={{ backgroundColor: rose }}></span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif leading-tight" style={{ color: ink }}>
              {data.tagline || S.heroFallbackTagline}
            </h1>
            <p className="text-xs md:text-sm mt-6 mb-9 max-w-lg mx-auto leading-relaxed" style={{ color: muted }}>
              {data.about || S.heroFallbackAbout}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="px-9 py-3.5 text-[11px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-110" style={btnRose}>
                {S.heroPrimaryCta}
              </button>
              <button className="px-9 py-3.5 text-[11px] uppercase tracking-[0.25em] font-semibold border transition-colors" style={{ borderColor: ink, color: ink, backgroundColor: 'transparent' }}>
                {S.heroSecondaryCta}
              </button>
            </div>
          </div>
        </div>

        <div {...sectionProps('trust', 'ready')} className="site-section px-5 md:px-8 py-10 border-y" style={{ backgroundColor: paper, borderColor: line }}>
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.trustEyebrow}</span>
            <h2 className="text-xl md:text-2xl font-serif mt-2" style={{ color: ink }}>{S.trustTitle}</h2>
            <div className={`grid gap-3 mt-7 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 1 })}`}>
              {[{ v: S.trust1Value, l: S.trust1Label }, { v: S.trust2Value, l: S.trust2Label }, { v: S.trust3Value, l: S.trust3Label }].map((stat) => (
                <div key={stat.l} className="border p-4 min-w-0" style={{ borderColor: line, backgroundColor: card }}>
                  <p className="text-2xl font-serif" style={{ color: roseDeep }}>{stat.v}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] mt-1" style={{ color: muted }}>{stat.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div {...sectionProps('featured', featuredState)} className="site-section px-5 md:px-8 py-14" style={{ backgroundColor: paperDeep }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.featuredEyebrow}</span>
              <h2 className="text-2xl font-serif mt-2" style={{ color: ink }}>{S.featuredTitle}</h2>
            </div>
            {featuredState === 'ready' ? (
              <div className={`grid gap-4 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
                {featured.map((s) => {
                  const shown = displayService(s, locale);
                  return (
                    <div key={s.id} className="border p-5 min-w-0" style={{ borderColor: line, backgroundColor: card }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-serif font-semibold break-words" style={{ color: ink }}>{shown.name}</h4>
                          <p className="text-[10px] uppercase tracking-[0.18em] mt-1" style={{ color: roseDeep }}>{translateCategory(shown.category, locale)}</p>
                        </div>
                        <ServicePrice service={s} offers={data.offers} style={{ color: roseDeep }} compact dark={isDark} />
                      </div>
                      <button className="site-touch mt-4 text-[10px] uppercase tracking-[0.2em] font-semibold underline underline-offset-4" style={{ color: roseDeep }}>{S['common.bookThisService']}</button>
                    </div>
                  );
                })}
              </div>
            ) : <SectionStatePanel status={featuredState} copy={X} palette={palette} emptyTitle={S.featuredEmpty} />}
          </div>
        </div>

        {/* Services — editorial menu, grouped by category */}
        <div {...sectionProps('services', servicesState)} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: paper }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.servicesEyebrow}</span>
              <h2 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S.servicesTitle}</h2>
              <div className="h-px w-16 mx-auto mt-5" style={{ backgroundColor: rose }}></div>
            </div>

            {servicesState !== 'ready' ? (
              <SectionStatePanel status={servicesState} copy={X} palette={palette} emptyTitle={S.servicesEmpty} />
            ) : (() => {
              const categories: { cat: string; items: typeof services }[] = [];
              for (const s of services) {
                let group = categories.find((g) => g.cat === s.category);
                if (!group) {
                  group = { cat: s.category, items: [] };
                  categories.push(group);
                }
                group.items.push(s);
              }
              return categories.map((group) => (
                <div key={group.cat} className="mb-10">
                  <div className="flex items-center gap-4 mb-5">
                    <h3 className="text-[11px] uppercase tracking-[0.35em] font-semibold whitespace-nowrap" style={{ color: roseDeep }}>
                      {translateCategory(group.cat, locale)}
                    </h3>
                    <div className="h-px flex-1" style={{ backgroundColor: line }}></div>
                  </div>
                  <div className={`grid gap-x-10 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
                    {group.items.map((s) => {
                      const shown = displayService(s, locale);
                      return (
                      <div key={s.id} className="py-4 flex items-start justify-between gap-4 min-w-0" style={{ borderBottom: `1px solid ${line}` }}>
                        {shown.iconUrl && <img src={shown.iconUrl} alt="" className="w-8 h-8 object-cover shrink-0" />}
                        <div className="min-w-0">
                          <h4 className="text-sm font-serif font-semibold break-words" style={{ color: ink }}>{shown.name}</h4>
                          <p className="text-[11px] mt-1 leading-relaxed line-clamp-2 break-words" style={{ color: muted }}>{shown.description}</p>
                          <button className="text-[10px] uppercase tracking-[0.2em] font-semibold mt-2 underline underline-offset-4 transition-colors" style={{ color: roseDeep }}>
                            {S['common.bookThisService']}
                          </button>
                        </div>
                        <div className="text-right shrink-0">
                          <ServicePrice service={s} offers={data.offers} style={{ color: roseDeep }} compact dark={isDark} />
                          <p className="text-[10px] mt-0.5" style={{ color: muted }}>{s.duration} {S['common.minutes']}</p>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>
              ));
            })()}

            {/* Packages — Phase 10.1: anchor target for the global Offers nav item */}
            {data.packages && data.packages.length > 0 && (
              <div {...sectionProps('offers', offersState)} className="site-section mt-14 pt-10 border-t" style={{ borderColor: line }}>
                <div className="text-center mb-8">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.packagesEyebrow}</span>
                  <h3 className="text-xl font-serif mt-2" style={{ color: ink }}>{S.packagesTitle}</h3>
                </div>
                <div className="grid gap-4 grid-cols-1">
                  {data.packages.map((p) => (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border" style={{ borderColor: line, backgroundColor: card }}>
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-3">
                          <h4 className="font-serif font-semibold text-sm" style={{ color: ink }}>{p.name}</h4>
                          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5" style={{ backgroundColor: roseSoft, color: roseDeep }}>{S.packagesBadge}</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: muted }}>{p.description}</p>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2 pt-1" style={{ color: muted }}>
                          <span>⏱ {p.duration} {S['common.mins']}</span>
                          <span>•</span>
                          <span>{S.packagesMeta}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                        <BundlePrice bundle={p} offers={data.offers} style={{ color: roseDeep }} dark={isDark} />
                        <button className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all hover:brightness-110" style={btnRose}>
                          {S['common.bookPackage']}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Color Showcase — the signature hair-color gallery */}
        <div id="section-color" className="px-8 py-16" style={{ backgroundColor: paperDeep }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold flex items-center justify-center gap-2" style={{ color: roseDeep }}>
                <Palette className="w-3.5 h-3.5" /> {S.colorEyebrow}
              </span>
              <h2 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S.colorTitle}</h2>
              <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: muted }}>
                {S.colorSubtitle}
              </p>
              <div className="h-px w-16 mx-auto mt-5" style={{ backgroundColor: rose }}></div>
            </div>

            <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {COLOR_SHOWCASE.map((swatch) => (
                <div key={swatch.name} className="relative aspect-[3/4] overflow-hidden group border" style={{ borderColor: line }}>
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" style={{ background: swatch.gradient }}></div>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(25,24,23,0.85) 0%, rgba(25,24,23,0.15) 45%, transparent 70%)' }}></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[11px] font-serif font-semibold text-white">{swatch.name}</p>
                    <p className="text-[9px] uppercase tracking-[0.18em] mt-0.5" style={{ color: roseBright }}>{swatch.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div {...sectionProps('gallery', galleryState)} className="site-section px-5 md:px-8 py-16 border-t" style={{ backgroundColor: paper, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.galleryEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S.galleryTitle}</h3>
            </div>
            {galleryState === 'ready' ? (
              <div className={`grid gap-3 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 2 })}`}>
                {(data.gallery || []).map((item) => (
                  <div key={item.id} className="relative aspect-square overflow-hidden border group" style={{ borderColor: line }}>
                    <img src={item.url} alt={item.alt || S['common.defaultPhotoAlt']} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 flex items-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(25,24,23,0.8), transparent)' }}>
                      <span className="text-[9px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 text-white" style={{ backgroundColor: rose }}>
                        {translateCategory(item.category || 'General', locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <SectionStatePanel status={galleryState} copy={X} palette={palette} emptyTitle={S.galleryEmpty} />}
          </div>
        </div>

        <div {...sectionProps('videos', videosState)} className="site-section px-5 md:px-8 py-16 border-t" style={{ backgroundColor: paperDeep, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold flex items-center justify-center gap-2" style={{ color: roseDeep }}>
                <Video className="w-3 h-3" /> {S.videosEyebrow}
              </span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S.videosTitle}</h3>
            </div>
            {videosState === 'ready' ? (
              <div className={`grid gap-4 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 2 })}`}>
                {(data.socialVideos || []).map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] overflow-hidden group border" style={{ borderColor: line }}>
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(25,24,23,0.85), transparent)' }}></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-xs font-serif font-semibold line-clamp-2">{video.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <SectionStatePanel status={videosState} copy={X} palette={palette} emptyTitle={S.videosEmpty} />}
          </div>
        </div>

        <div {...sectionProps('about', aboutState)} className="site-section px-5 md:px-8 py-14" style={{ backgroundColor: paper }}>
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.aboutEyebrow}</span>
            <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S.aboutTitle}</h3>
            <p className="text-xs md:text-sm mt-4 leading-relaxed" style={{ color: muted }}>{data.about || S.heroFallbackAbout}</p>
          </div>
        </div>

        <div {...sectionProps('owner', ownerState)} className="site-section px-5 md:px-8 py-14 border-y" style={{ backgroundColor: paperDeep, borderColor: line }}>
          {ownerState === 'ready' ? (
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 border" style={{ borderColor: rose }}>
                <OwnerAvatar photoUrl={data.ownerPhotoUrl} name={data.ownerName} className="w-full h-full text-3xl" alt="Founder" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{data.ownerRole || S.ownerFallbackRole}</span>
                <h3 className="text-2xl font-serif mt-1 break-words" style={{ color: ink }}>{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed italic" style={{ color: muted }}>“{data.reviewedContent?.ownerIntro || S.ownerFallbackIntro}”</p>
              </div>
            </div>
          ) : <div className="max-w-3xl mx-auto"><SectionStatePanel status={ownerState} copy={X} palette={palette} emptyTitle={S.ownerEmptyTitle} emptyBody={S.ownerEmptyBody} /></div>}
        </div>

        <div {...sectionProps('team', teamState)} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: paper }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.teamEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S.teamTitle}</h3>
            </div>
            {teamState === 'ready' ? (
              <div className={`grid gap-8 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
                {data.team.map((member) => {
                  const pub = getPublicStaffData(member);
                  return (
                    <div key={pub.id} className="flex flex-col gap-4 min-w-0">
                      <div className="flex items-center gap-5">
                        <img src={pub.imageUrl} alt={pub.name} className="w-20 h-20 object-cover border shrink-0" style={{ borderColor: line }} />
                        <div className="min-w-0">
                          <h4 className="font-serif font-semibold text-lg break-words" style={{ color: ink }}>{pub.name}</h4>
                          <p className="text-[10px] uppercase tracking-[0.25em] mt-1" style={{ color: roseDeep }}>{pub.role}</p>
                        </div>
                      </div>
                      <button className="site-touch w-full py-2.5 text-[10px] uppercase tracking-[0.25em] font-semibold border" style={{ borderColor: ink, color: ink }}>{S['common.bookWith'].replace('{name}', pub.name.split(' ')[0])}</button>
                    </div>
                  );
                })}
              </div>
            ) : <SectionStatePanel status={teamState} copy={X} palette={palette} />}
          </div>
        </div>

        <div {...sectionProps('reviews', 'ready')} className="site-section px-5 md:px-8 py-16" style={{ backgroundColor: paperDeep }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.reviewsEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S.reviewsTitle}</h3>
              <div className="h-px w-16 mx-auto mt-5" style={{ backgroundColor: rose }}></div>
            </div>
            <div className={`grid gap-6 ${siteGrid(mode, { desktop: 3, tablet: 2, mobile: 1 })}`}>
              {REVIEWS.map((r, i) => (
                <div key={i} className="border p-6 flex flex-col gap-3" style={{ borderColor: line, backgroundColor: card }}>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5" style={{ color: rose, fill: rose }} />
                    ))}
                  </div>
                  <Quote className="w-5 h-5" style={{ color: roseBright }} />
                  <p className="text-xs leading-relaxed italic flex-1 font-serif" style={{ color: inkSoft }}>
                    “{r.quote}”
                  </p>
                  <div className="pt-3 border-t" style={{ borderColor: line }}>
                    <p className="text-xs font-semibold" style={{ color: ink }}>{r.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: roseDeep }}>{r.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div {...sectionProps('location', locationState)} className="site-section px-5 md:px-8 py-16 border-t" style={{ backgroundColor: paper, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>{S.visitEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>{S['common.visitTitle']}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border space-y-4" style={{ borderColor: line, backgroundColor: card }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: ink }}>
                  <MapPin className="w-4 h-4" style={{ color: roseDeep }} /> {S.addressLabel}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="w-full py-2.5 text-[10px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-2" style={btnRose}>
                  <Navigation className="w-3.5 h-3.5" /> {S['common.getDirections']}
                </button>
              </div>

              <div className="p-6 border space-y-3" style={{ borderColor: line, backgroundColor: card }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: ink }}>
                  <Clock className="w-4 h-4" style={{ color: roseDeep }} /> {S['common.openingHours']}
                </h4>
                <div className="space-y-2 text-xs" style={{ color: muted }}>
                  {data.openingHours ? (
                    Object.entries(data.openingHours).map(([day, sch]) => (
                      <div key={day} className="flex justify-between border-b pb-1.5" style={{ borderColor: line }}>
                        <span className="font-semibold" style={{ color: ink }}>{dayLabel(day, locale)}</span>
                        {sch.open ? <span>{sch.startTime} – {sch.endTime}</span> : <span className="font-semibold" style={{ color: roseDeep }}>{S['common.closed']}</span>}
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
        <div id="section-contact" className="px-8 py-16 text-center" style={{ backgroundColor: paperDeep }}>
          <div className="max-w-xl mx-auto">
            <div className="w-12 h-12 mx-auto flex items-center justify-center border mb-4" style={{ borderColor: rose }}>
              <CalendarCheck className="w-6 h-6" style={{ color: roseDeep }} />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif mb-6" style={{ color: ink }}>{S.contactTitle}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button className="py-3 border font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors" style={{ borderColor: line, color: ink, backgroundColor: card }}>
                <Phone className="w-4 h-4" style={{ color: roseDeep }} /> {S['common.callNow']}
              </button>
              <button className="py-3 text-white font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> {S['common.whatsApp']}
              </button>
              <button className="py-3 font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={btnRose}>
                <CalendarCheck className="w-4 h-4" /> {S['common.bookOnline']}
              </button>
            </div>

            <div className="p-5 border text-left text-xs space-y-2" style={{ borderColor: line, backgroundColor: card }}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 uppercase tracking-[0.15em] text-[10px]" style={{ color: ink }}>
                  <CreditCard className="w-4 h-4" style={{ color: roseDeep }} /> {S.depositTitle}
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ backgroundColor: roseSoft, color: roseDeep }}>{S['common.advanceAdvance']}</span>
              </div>
              <p style={{ color: muted }}>{S.depositBody}</p>
            </div>
          </div>
        </div>

        <FinalBookingCta title={S.bookingTitle} body={S.bookingBody} cta={S['struct.bookCta']} palette={palette} sharp />

        <footer {...sectionProps('footer', 'ready')} className="site-section px-5 md:px-8 py-10 text-center text-xs" style={{ backgroundColor: footerBg, color: '#cfcac4' }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scissors className="w-4 h-4" style={{ color: roseBright }} />
            <p className="font-serif font-semibold text-sm tracking-wide" style={nameStyle}>{data.salonName || 'Atelier Hair Studio'}</p>
          </div>
          <p className="uppercase tracking-[0.25em] text-[9px] font-medium mb-4" style={{ color: roseBright }}>
            {data.tagline || S.footerFallbackTagline}
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: '#8c8782' }}>
            © 2026 {data.salonName || 'Salon'}. {S['common.poweredBy']}
          </p>
        </footer>
      </div>
    </div>
  );
}
