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
import SiteReviews from './SiteReviews';
import SiteSocialFeed from './SiteSocialFeed';
import { openSiteBooking } from '../lib/siteBooking';
import { displayService } from '../lib/displayService';
import { BARBER_SURFACES, surfacesOf } from '../lib/themeSurfaces';
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
  CreditCard,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: ViewportMode;
}

/**
 * BARBER & MEN'S GROOMING — dedicated theme renderer (Theme ID: barber_mens_grooming).
 *
 * This is NOT a colour variation of the existing themes. It is a complete,
 * self-contained layout with its own visual language:
 *   - Dark charcoal surfaces, vintage gold accents, sharp corners
 *   - Strong uppercase display typography with wide letter-spacing
 *   - A barbershop "price board" services menu with numbered entries
 *   - Theme-specific sections (The Barbers, Client Reviews) with static,
 *     presentation-only content (no database wiring in this phase)
 *
 * PHASE 10.2: surfaces come from BARBER_SURFACES (dark = the native design,
 * light = a warm "day shift" cream variant); all customer-facing copy comes
 * from the global siteText() table (barber namespace) so the header Language
 * control flips the whole page between English and हिन्दी.
 */
export default function BarberTemplateRenderer({ data, mode }: Props) {
  // Live locale + appearance: re-render when the header controls switch.
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('barber_mens_grooming');
  const t = surfacesOf(BARBER_SURFACES, appearance);
  const { gold, goldBright, goldSoft, charcoal, charcoalSoft, muted, line, text, textStrong, card, well, chipLine, accentText } = t;
  const S = { ...siteText('barber_mens_grooming', locale), ...structureText('barber_mens_grooming', locale) };
  const X = structureCopyFrom(S);
  const palette = { accent: gold, text: textStrong, muted, card, line, invert: '#141414' };
  const headerMode = headerModeOf(mode);
  const services = activeCatalogItems(data.services);
  const packages = activeCatalogItems(data.packages);
  const featured = featuredServices(data.services);
  const servicesState = resolveSectionState('services', services);
  const featuredState = resolveSectionState('featured', featured);
  const offersState = resolveSectionState('offers', packages);
  const galleryState = resolveSectionState('gallery', data.gallery);
  const teamState = resolveSectionState('team', data.team);
  const ownerState = resolveSectionState('owner', data.ownerName ? [data.ownerName] : []);
  const aboutState = resolveSectionState('about', (data.about || S.heroFallbackAbout) ? [1] : []);
  const locationState = resolveSectionState('location', data.address?.fullAddress ? [data.address.fullAddress] : ['fallback']);

  const btnGold: CSSProperties = {
    backgroundColor: gold,
    color: '#141414',
  };

  return (
    <div className={`relative bg-black border shadow-xl flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${siteFrameClass(mode)} ${mode === 'mobile' ? 'site-has-mobile-dock' : ''}`} style={{ borderColor: line }}>
      {/* Browser/Phone Header Bar (mock chrome — not part of the website) */}
      {mode !== 'mobile' ? (
        <div className="h-10 border-b flex items-center px-4 gap-2 shrink-0 bg-[#0c0c0c]" style={{ borderColor: '#262626' }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto px-4 py-1 rounded text-[10px] border font-mono tracking-wide text-neutral-500 bg-[#141414]" style={{ borderColor: '#262626' }}>
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start bg-black shrink-0">
          <div className="w-24 h-4 rounded-b-xl" style={{ backgroundColor: '#262626' }}></div>
        </div>
      )}

      {/* Scrollable Website Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar site-scroll pb-20" style={{ backgroundColor: t.page, color: text }}>
        <SiteAnnouncementBar themeId="barber_mens_grooming" data={data} />
        <SiteHeader themeId="barber_mens_grooming" data={data} mode={headerMode} />

        {/* Hero */}
        <div id="section-hero" data-site-section="hero" data-section-state="ready" className="site-section relative overflow-hidden px-6 py-16 md:py-20 text-center" style={{ backgroundColor: charcoal }}>
          {data.heroImageUrl && (
            <img
              src={data.heroImageUrl}
              alt="Hero Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          {/* Subtle barbershop stripe texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: `repeating-linear-gradient(135deg, ${gold} 0px, ${gold} 1px, transparent 1px, transparent 14px)` }}
          ></div>
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 0%, ${charcoal} 78%)` }}></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="h-px w-10" style={{ backgroundColor: gold }}></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>
                {S.heroEyebrow}
              </span>
              <span className="h-px w-10" style={{ backgroundColor: gold }}></span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[0.06em] leading-tight" style={{ color: textStrong }}>
              {data.tagline || S.heroFallbackTagline}
            </h1>
            <p className="text-xs md:text-sm mt-5 mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: muted }}>
              {data.about || S.heroFallbackAbout}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button data-open-booking="true" onClick={openSiteBooking} className="site-touch px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:brightness-110" style={btnGold}>
                {S['common.bookAppointment']}
              </button>
              <button className="site-touch px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] border transition-all hover:bg-white/5" style={{ borderColor: gold, color: accentText }}>
                {S['common.viewServices']}
              </button>
            </div>
          </div>
        </div>

        {/* Trust / Stats */}
        <div {...sectionProps('trust', 'ready')} className="site-section px-6 py-10 border-y" style={{ backgroundColor: charcoal, borderColor: line }}>
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.trustEyebrow}</span>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.trustTitle}</h2>
            <div className={`grid gap-3 mt-7 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 1 })}`}>
              {[{ v: S.trust1Value, l: S.trust1Label }, { v: S.trust2Value, l: S.trust2Label }, { v: S.trust3Value, l: S.trust3Label }].map((stat) => (
                <div key={stat.l} className="border p-4 min-w-0" style={{ backgroundColor: card, borderColor: line }}>
                  <p className="text-2xl font-black" style={{ color: gold }}>{stat.v}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mt-1" style={{ color: muted }}>{stat.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Services */}
        <div {...sectionProps('featured', featuredState)} className="site-section px-6 py-14" style={{ backgroundColor: charcoalSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.featuredEyebrow}</span>
              <h2 className="text-2xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.featuredTitle}</h2>
            </div>
            {featuredState === 'ready' ? (
              <div className={`grid gap-3 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
                {featured.map((s) => {
                  const shown = displayService(s, locale);
                  return (
                    <div key={s.id} className="border p-4 min-w-0" style={{ backgroundColor: card, borderColor: gold }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-black uppercase tracking-wider break-words" style={{ color: textStrong }}>{shown.name}</h4>
                          <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>{translateCategory(shown.category, locale)}</p>
                        </div>
                        <ServicePrice service={s} offers={data.offers} style={{ color: accentText }} compact dark={appearance === 'dark'} />
                      </div>
                      <button data-open-booking="true" onClick={openSiteBooking} className="site-touch mt-4 w-full py-2.5 text-[10px] font-black uppercase tracking-[0.15em]" style={btnGold}>{S['common.bookSlot']}</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <SectionStatePanel status={featuredState} copy={X} palette={palette} emptyTitle={S.featuredEmpty} />
            )}
          </div>
        </div>

        {/* Services — the price board */}
        <div {...sectionProps('services', servicesState)} className="site-section px-6 py-14" style={{ backgroundColor: charcoalSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.servicesEyebrow}</span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.servicesTitle}</h2>
              <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
            </div>

            {servicesState === 'ready' ? (
            <div className={`grid gap-3 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
              {services.map((s, i) => {
                const shown = displayService(s, locale);
                return (
                <div key={s.id} className="group border hover:border-[#c9a227]/70 transition-colors p-4 min-w-0" style={{ backgroundColor: card, borderColor: line }}>
                  {shown.bannerUrl && <img src={shown.bannerUrl} alt="" className="w-full h-16 object-cover mb-3" />}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {shown.iconUrl ? (
                        <img src={shown.iconUrl} alt="" className="w-8 h-8 object-cover shrink-0" />
                      ) : (
                      <span className="text-[11px] font-black" style={{ color: gold }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-black uppercase tracking-wider break-words" style={{ color: textStrong }}>{shown.name}</h4>
                        <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>{translateCategory(shown.category, locale)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <ServicePrice service={s} offers={data.offers} style={{ color: accentText }} compact dark={appearance === 'dark'} />
                      <p className="text-[10px] font-semibold" style={{ color: muted }}>{s.duration} {S['common.minutes']}</p>
                    </div>
                  </div>
                  <p className="text-[11px] mt-3 leading-relaxed line-clamp-2 break-words" style={{ color: muted }}>
                    {shown.description}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: line }}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: muted }}>{S.serviceNote}</span>
                    <button data-open-booking="true" onClick={openSiteBooking} className="site-touch px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110" style={btnGold}>
                      {S['common.bookSlot']}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
            ) : (
              <SectionStatePanel status={servicesState} copy={X} palette={palette} emptyTitle={S.servicesEmpty} />
            )}
          </div>
        </div>

        {/* Offers & Combos */}
        <div {...sectionProps('offers', offersState)} className="site-section px-6 py-14" style={{ backgroundColor: charcoal }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.packagesEyebrow}</span>
              <h3 className="text-xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.packagesTitle}</h3>
            </div>
            {offersState === 'ready' ? (
              <div className="grid gap-4 grid-cols-1">
                {packages.map((p) => (
                  <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border transition-colors min-w-0" style={{ backgroundColor: card, borderColor: gold }}>
                    <div className="space-y-1 max-w-xl min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-sm uppercase tracking-wider break-words" style={{ color: textStrong }}>{p.name}</h4>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5" style={{ backgroundColor: gold, color: '#141414' }}>{S['common.bestValue']}</span>
                      </div>
                      <p className="text-xs leading-relaxed break-words" style={{ color: muted }}>{p.description}</p>
                      <div className="text-[10px] font-bold uppercase tracking-wider flex flex-wrap items-center gap-2 pt-1" style={{ color: muted }}>
                        <span>⏱ {p.duration} {S['common.mins']}</span>
                        <span>•</span>
                        <span>{S['common.completeBundle']}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                      <BundlePrice bundle={p} offers={data.offers} style={{ color: accentText }} dark={appearance === 'dark'} />
                      <button data-open-booking="true" onClick={openSiteBooking} className="site-touch px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110" style={btnGold}>
                        {S['common.bookBundle']}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SectionStatePanel status={offersState} copy={X} palette={palette} emptyTitle={S.offersEmpty} />
            )}
          </div>
        </div>

        {/* Gallery — The Work */}
        <div {...sectionProps('gallery', galleryState)} className="site-section px-6 py-14 border-t" style={{ backgroundColor: charcoal, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.galleryEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.galleryTitle}</h3>
            </div>
            {galleryState === 'ready' ? (
              <div className={`grid gap-3 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 2 })}`}>
                {(data.gallery || []).map((item) => (
                  <div key={item.id} className="relative aspect-square overflow-hidden border group" style={{ borderColor: line }}>
                    <img src={item.url} alt={item.alt || S['common.defaultPhotoAlt']} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5" style={{ backgroundColor: gold, color: '#141414' }}>
                        {translateCategory(item.category || 'General', locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SectionStatePanel status={galleryState} copy={X} palette={palette} emptyTitle={S.galleryEmpty} />
            )}
          </div>
        </div>

        <SiteSocialFeed themeId="barber_mens_grooming" data={data} mode={mode} />

        {/* About Salon */}
        <div {...sectionProps('about', aboutState)} className="site-section px-6 py-14" style={{ backgroundColor: charcoal }}>
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.aboutEyebrow}</span>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.aboutTitle}</h3>
            <p className="text-xs md:text-sm mt-4 leading-relaxed" style={{ color: muted }}>{data.about || S.heroFallbackAbout}</p>
          </div>
        </div>

        {/* Owner / Founder */}
        <div {...sectionProps('owner', ownerState)} className="site-section px-6 py-12 border-y" style={{ backgroundColor: charcoalSoft, borderColor: line }}>
          {ownerState === 'ready' ? (
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 border-2 shadow-lg" style={{ borderColor: gold }}>
                <OwnerAvatar photoUrl={data.ownerPhotoUrl} name={data.ownerName} className="w-full h-full text-3xl" alt="Founder" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{data.ownerRole || S.ownerFallbackRole}</span>
                <h3 className="text-2xl font-black uppercase tracking-[0.05em] mt-1 break-words" style={{ color: textStrong }}>{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed italic" style={{ color: muted }}>“{data.reviewedContent?.ownerIntro || S.ownerFallbackIntro}”</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto"><SectionStatePanel status={ownerState} copy={X} palette={palette} emptyTitle={S.ownerEmptyTitle} emptyBody={S.ownerEmptyBody} /></div>
          )}
        </div>

        {/* Meet the Staff */}
        <div {...sectionProps('team', teamState)} className="site-section px-6 py-14" style={{ backgroundColor: charcoal }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.teamEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.teamTitle}</h3>
              <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
            </div>
            {teamState === 'ready' ? (
              <div className={`grid gap-5 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
                {data.team.map((member) => {
                  const pub = getPublicStaffData(member);
                  return (
                    <div key={pub.id} className="border hover:border-[#c9a227]/70 transition-colors p-5 flex flex-col gap-4 min-w-0" style={{ backgroundColor: card, borderColor: line }}>
                      <div className="flex items-start gap-4">
                        <img src={pub.imageUrl} alt={pub.name} className="w-16 h-16 object-cover border-2 shrink-0" style={{ borderColor: gold }} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-base uppercase tracking-wider break-words" style={{ color: textStrong }}>{pub.name}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: accentText }}>{pub.role}</p>
                          {pub.phone && (
                            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: muted }}>
                              <Phone className="w-3 h-3" />{pub.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {pub.specialties && pub.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {pub.specialties.map((spec, i) => (
                            <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 border" style={{ color: muted, borderColor: chipLine }}>
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      {pub.bio && (
                        <p className="text-xs line-clamp-2 italic p-3 border" style={{ color: muted, backgroundColor: well, borderColor: line }}>
                          “{pub.bio}”
                        </p>
                      )}
                      <button data-open-booking="true" onClick={openSiteBooking} className="site-touch w-full py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 mt-auto" style={btnGold}>
                        {S['common.bookWith'].replace('{name}', pub.name.split(' ')[0])}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <SectionStatePanel status={teamState} copy={X} palette={palette} />
            )}
          </div>
        </div>

        <SiteReviews themeId="barber_mens_grooming" data={data} mode={mode} />

        {/* Location + Contact */}
        <div {...sectionProps('location', locationState)} className="site-section px-6 py-14 border-t" style={{ backgroundColor: charcoalSoft, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.visitEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S['common.visitTitle']}</h3>
            </div>

            <div className={`grid gap-6 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
              <div className="p-6 border space-y-4" style={{ backgroundColor: card, borderColor: line }}>
                <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: textStrong }}>
                  <MapPin className="w-4 h-4" style={{ color: gold }} /> {S.addressLabel}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="site-touch w-full py-2.5 text-xs font-black uppercase tracking-[0.2em] border transition-all hover:brightness-110 flex items-center justify-center gap-2" style={btnGold}>
                  <Navigation className="w-3.5 h-3.5" /> {S['common.getDirections']}
                </button>
              </div>

              <div className="p-6 border space-y-3" style={{ backgroundColor: card, borderColor: line }}>
                <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: textStrong }}>
                  <Clock className="w-4 h-4" style={{ color: gold }} /> {S['common.openingHours']}
                </h4>
                <SiteSalonStatus themeId="barber_mens_grooming" data={data} placement="contact" />
                <div className="space-y-2 text-xs" style={{ color: muted }}>
                  {data.openingHours ? (
                    Object.entries(data.openingHours).map(([day, sch]) => (
                      <div key={day} className="flex justify-between border-b pb-1.5" style={{ borderColor: line }}>
                        <span className="font-bold" style={{ color: textStrong }}>{dayLabel(day, locale)}</span>
                        {sch.open ? <span>{sch.startTime} – {sch.endTime}</span> : <span className="font-black" style={{ color: accentText }}>{S['common.closed']}</span>}
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between"><span>Mon - Sat</span><span>10:00 AM - 9:00 PM</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Booking */}
        <div id="section-contact" className="px-6 py-14 text-center" style={{ backgroundColor: charcoal }}>
          <div className="max-w-xl mx-auto">
            <div className="w-12 h-12 mx-auto flex items-center justify-center border mb-4" style={{ borderColor: gold }}>
              <CalendarCheck className="w-6 h-6" style={{ color: gold }} />
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mb-6" style={{ color: textStrong }}>{S.contactTitle}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button className="site-touch py-3 border hover:border-[#c9a227] font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: card, borderColor: line, color: textStrong }}>
                <Phone className="w-4 h-4" style={{ color: gold }} /> {S['common.callNow']}
              </button>
              <button className="py-3 text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> {S['common.whatsApp']}
              </button>
              <button data-open-booking="true" onClick={openSiteBooking} className="py-3 font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={btnGold}>
                <CalendarCheck className="w-4 h-4" /> {S['common.bookOnline']}
              </button>
            </div>

            <div className="p-4 border text-left text-xs space-y-2" style={{ backgroundColor: card, borderColor: line }}>
              <div className="flex items-center justify-between font-black">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]" style={{ color: textStrong }}>
                  <CreditCard className="w-4 h-4" style={{ color: gold }} /> {S.depositTitle}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase" style={{ backgroundColor: goldSoft, color: goldBright }}>{S['common.advanceAdvance']}</span>
              </div>
              <p style={{ color: muted }}>{S.depositBody}</p>
            </div>
          </div>
        </div>

        <FinalBookingCta themeId="barber_mens_grooming" data={data} title={S.bookingTitle} body={S.bookingBody} cta={S['struct.bookCta']} palette={{ ...palette, accent: gold }} sharp />
        <SiteFooter themeId="barber_mens_grooming" data={data} />
        {mode === 'mobile' && <div className="site-mobile-dock-spacer" aria-hidden />}
      </div>
      <SiteFloatingActions themeId="barber_mens_grooming" data={data} mode={mode} />
      <SiteBookingHost themeId="barber_mens_grooming" data={data} />
    </div>
  );
}
