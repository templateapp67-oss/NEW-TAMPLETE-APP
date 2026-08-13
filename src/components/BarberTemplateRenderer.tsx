import type { CSSProperties } from 'react';
import { SalonData, getPublicStaffData } from '../types';
import { getSalonNameStyle } from '../lib/brandIdentity';
import SiteHeader, { useSiteLocale, useThemeAppearance } from './SiteHeader';
import OwnerAvatar from './OwnerAvatar';
import { BundlePrice, ServicePrice } from './PromotionalPricing';
import { displayService } from '../lib/displayService';
import { BARBER_SURFACES, surfacesOf } from '../lib/themeSurfaces';
import { dayLabel, siteText, translateCategory } from '../lib/siteI18n';
import {
  Scissors, Phone, MessageCircle, CalendarCheck, MapPin, Clock, Navigation,
  Video, Heart, Star, Quote, CreditCard,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: 'desktop' | 'mobile';
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
  const { gold, goldBright, goldSoft, charcoal, charcoalSoft, muted, line, text, textStrong, card, well, chipLine, accentText, footerBg } = t;
  const S = siteText('barber_mens_grooming', locale);

  // Keep the owner's chosen font style for the salon name; the barber footer
  // is a dark slab in both appearances, so the fallback stays light.
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = '#f5efe0';

  const btnGold: CSSProperties = {
    backgroundColor: gold,
    color: '#141414',
  };

  return (
    <div className="bg-black border shadow-xl flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full w-full max-w-[950px] rounded-xl" style={{ borderColor: line }}>
      {/* Browser/Phone Header Bar (mock chrome — not part of the website) */}
      {mode === 'desktop' ? (
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
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-16" style={{ backgroundColor: t.page, color: text }}>
        {/* Navigation — Phase 10.1 global header (barber design) */}
        <SiteHeader themeId="barber_mens_grooming" data={data} mode={mode} />

        {/* Hero */}
        <div id="section-hero" className="relative overflow-hidden px-6 py-16 md:py-20 text-center" style={{ backgroundColor: charcoal }}>
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
              <button className="px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:brightness-110" style={btnGold}>
                {S['common.bookAppointment']}
              </button>
              <button className="px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] border transition-all hover:bg-white/5" style={{ borderColor: gold, color: accentText }}>
                {S['common.viewServices']}
              </button>
            </div>
          </div>
        </div>

        {/* Services — the price board */}
        <div id="section-services" className="px-6 py-14" style={{ backgroundColor: charcoalSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.servicesEyebrow}</span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.servicesTitle}</h2>
              <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
            </div>

            <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {data.services && data.services.map((s, i) => {
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
                    <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110" style={btnGold}>
                      {S['common.bookSlot']}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Packages — Phase 10.1: anchor target for the global Offers nav item */}
            {data.packages && data.packages.length > 0 && (
              <div id="section-offers" className="mt-14 pt-10 border-t" style={{ borderColor: line }}>
                <div className="text-center mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.packagesEyebrow}</span>
                  <h3 className="text-xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.packagesTitle}</h3>
                </div>
                <div className="grid gap-4 grid-cols-1">
                  {data.packages.map((p) => (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border transition-colors" style={{ backgroundColor: card, borderColor: gold }}>
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm uppercase tracking-wider" style={{ color: textStrong }}>{p.name}</h4>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5" style={{ backgroundColor: gold, color: '#141414' }}>{S['common.bestValue']}</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: muted }}>{p.description}</p>
                        <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 pt-1" style={{ color: muted }}>
                          <span>⏱ {p.duration} {S['common.mins']}</span>
                          <span>•</span>
                          <span>{S['common.completeBundle']}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                        <BundlePrice bundle={p} offers={data.offers} style={{ color: accentText }} dark={appearance === 'dark'} />
                        <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110" style={btnGold}>
                          {S['common.bookBundle']}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About / Founder */}
        {data.ownerName && (
          <div id="section-owner" className="px-6 py-12 border-y" style={{ backgroundColor: charcoal, borderColor: line }}>
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 border-2 shadow-lg" style={{ borderColor: gold }}>
                <OwnerAvatar
                  photoUrl={data.ownerPhotoUrl}
                  name={data.ownerName}
                  className="w-full h-full text-3xl"
                  alt="Founder"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>
                  {data.ownerRole || S.ownerFallbackRole}
                </span>
                <h3 className="text-2xl font-black uppercase tracking-[0.05em] mt-1" style={{ color: textStrong }}>{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed italic" style={{ color: muted }}>
                  “{data.reviewedContent?.ownerIntro || S.ownerFallbackIntro}”
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team — The Barbers */}
        {data.team && data.team.length > 0 && (
          <div id="section-team" className="px-6 py-14" style={{ backgroundColor: charcoalSoft }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.teamEyebrow}</span>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.teamTitle}</h3>
                <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
              </div>

              <div className={`grid gap-5 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {data.team.map((member) => {
                  const pub = getPublicStaffData(member);
                  return (
                    <div key={pub.id} className="border hover:border-[#c9a227]/70 transition-colors p-5 flex flex-col gap-4" style={{ backgroundColor: card, borderColor: line }}>
                      <div className="flex items-start gap-4">
                        <img src={pub.imageUrl} alt={pub.name} className="w-16 h-16 object-cover border-2 shrink-0" style={{ borderColor: gold }} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-base uppercase tracking-wider" style={{ color: textStrong }}>{pub.name}</h4>
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
                      <button className="w-full py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 mt-auto" style={btnGold}>
                        {S['common.bookWith'].replace('{name}', pub.name.split(' ')[0])}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Gallery — The Work */}
        {data.gallery && data.gallery.length > 0 && (
          <div id="section-gallery" className="px-6 py-14 border-t" style={{ backgroundColor: charcoal, borderColor: line }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.galleryEyebrow}</span>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.galleryTitle}</h3>
              </div>
              <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.gallery.map((item) => (
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
            </div>
          </div>
        )}

        {/* Client Reviews (theme-specific static content — no DB in this phase) */}
        <div id="section-reviews" className="px-6 py-14" style={{ backgroundColor: charcoalSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S['common.reviewsEyebrow']}</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.reviewsTitle}</h3>
              <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
            </div>
            <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {[
                { name: 'Arjun Mehta', service: S.review1Service, quote: S.review1Quote },
                { name: 'Rohit Khanna', service: S.review2Service, quote: S.review2Quote },
                { name: 'Vikram Nair', service: S.review3Service, quote: S.review3Quote },
              ].map((r, i) => (
                <div key={i} className="border p-5 flex flex-col gap-3" style={{ backgroundColor: card, borderColor: line }}>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5" style={{ color: gold, fill: gold }} />
                    ))}
                  </div>
                  <Quote className="w-5 h-5" style={{ color: gold }} />
                  <p className="text-xs leading-relaxed italic flex-1" style={{ color: muted }}>“{r.quote}”</p>
                  <div className="pt-3 border-t" style={{ borderColor: line }}>
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: textStrong }}>{r.name}</p>
                    <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: accentText }}>{r.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Videos */}
        {data.socialVideos && data.socialVideos.length > 0 && (
          <div id="section-social" className="px-6 py-14 border-t" style={{ backgroundColor: charcoal, borderColor: line }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] flex items-center justify-center gap-1" style={{ color: accentText }}>
                  <Video className="w-3 h-3" /> {S.videosEyebrow}
                </span>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S.videosTitle}</h3>
              </div>
              <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.socialVideos.map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] overflow-hidden group border" style={{ borderColor: line }}>
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-xs font-black line-clamp-2 uppercase tracking-wide">{video.title}</p>
                      {video.likesCount && (
                        <span className="flex items-center gap-1 text-[10px] font-bold mt-1" style={{ color: goldBright }}>
                          <Heart className="w-3 h-3" style={{ fill: gold }} /> {video.likesCount}
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
        <div id="section-location" className="px-6 py-14 border-t" style={{ backgroundColor: charcoalSoft, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: accentText }}>{S.visitEyebrow}</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] mt-2" style={{ color: textStrong }}>{S['common.visitTitle']}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border space-y-4" style={{ backgroundColor: card, borderColor: line }}>
                <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: textStrong }}>
                  <MapPin className="w-4 h-4" style={{ color: gold }} /> {S.addressLabel}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="w-full py-2.5 text-xs font-black uppercase tracking-[0.2em] border transition-all hover:brightness-110 flex items-center justify-center gap-2" style={btnGold}>
                  <Navigation className="w-3.5 h-3.5" /> {S['common.getDirections']}
                </button>
              </div>

              <div className="p-6 border space-y-3" style={{ backgroundColor: card, borderColor: line }}>
                <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: textStrong }}>
                  <Clock className="w-4 h-4" style={{ color: gold }} /> {S['common.openingHours']}
                </h4>
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
              <button className="py-3 border hover:border-[#c9a227] font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: card, borderColor: line, color: textStrong }}>
                <Phone className="w-4 h-4" style={{ color: gold }} /> {S['common.callNow']}
              </button>
              <button className="py-3 text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> {S['common.whatsApp']}
              </button>
              <button className="py-3 font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={btnGold}>
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

        {/* Footer — a dark slab in both appearances (vintage barbershop look) */}
        <footer id="section-footer" className="px-6 py-10 text-center text-xs border-t" style={{ backgroundColor: footerBg, borderColor: gold }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scissors className="w-4 h-4" style={{ color: gold }} />
            <p className="font-black text-sm uppercase tracking-[0.18em]" style={nameStyle}>{data.salonName || 'The Grooming Co.'}</p>
          </div>
          <p className="uppercase tracking-[0.2em] text-[10px] font-bold mb-4" style={{ color: '#a6a49b' }}>{data.tagline || S.footerFallbackTagline}</p>
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#55534c' }}>
            © 2026 {data.salonName || 'Salon'}. {S['common.poweredBy']}
          </p>
        </footer>
      </div>
    </div>
  );
}
