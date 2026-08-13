import type { CSSProperties } from 'react';
import { SalonData, getPublicStaffData } from '../types';
import { getSalonNameStyle } from '../lib/brandIdentity';
import { BEAUTY_SPA_THEME } from '../lib/themeServices';
import OwnerAvatar from './OwnerAvatar';
import { BundlePrice, ServicePrice } from './PromotionalPricing';
import { displayService } from '../lib/displayService';
import { readStoredLocale } from '../lib/locale';
import {
  Phone, MessageCircle, CalendarCheck, MapPin, Clock, Navigation,
  Video, Heart, Star, Quote, CreditCard, Leaf, Flower2, Sparkles, Droplets,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: 'desktop' | 'mobile';
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
 * Static, presentation-only ambience content (rituals / reviews) — no new
 * service data, no DB wiring in this phase.
 */

const SPA_RITUALS = [
  { icon: Droplets, name: 'Aromatherapy', desc: 'Botanical essential oils blended for your mood and skin.' },
  { icon: Flower2, name: 'Herbal Steam', desc: 'Calming herbal steam to open pores and ease tension.' },
  { icon: Sparkles, name: 'Warm Stone Ritual', desc: 'Heated basalt stones to melt away deep-held stress.' },
  { icon: Leaf, name: 'Botanical Facials', desc: 'Clean, plant-based facials for a healthy, natural glow.' },
];

const REVIEWS = [
  { name: 'Pooja Malhotra', service: 'Hydra Facial', quote: 'A calm, serene escape. My skin has never looked this luminous.' },
  { name: 'Divya Rao', service: 'Swedish Massage', quote: 'The atmosphere melts your stress away before the treatment even begins.' },
  { name: 'Ayesha Qureshi', service: 'Detox Day Spa', quote: 'Warm, thoughtful care from start to finish. I left feeling completely renewed.' },
];

export default function BeautySpaTemplateRenderer({ data, mode }: Props) {
  const { emerald, emeraldDeep, emeraldMid, emeraldSoft, beige, beigeSoft, cream, blush, sage, text, muted, line } = BEAUTY_SPA_THEME;
  const locale = readStoredLocale();

  // Keep the owner's chosen font style for the salon name; default to deep
  // green so the wordmark stays legible on the light surfaces.
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = emeraldDeep;

  const btnEmerald: CSSProperties = {
    backgroundColor: emerald,
    color: '#ffffff',
  };

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

  return (
    <div className="shadow-xl border border-[#e9e2d6] flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full w-full max-w-[950px] rounded-xl bg-white">
      {/* Browser/Phone Header Bar */}
      {mode === 'desktop' ? (
        <div className="h-10 border-b border-[#ece6dc] flex items-center px-4 gap-2 shrink-0 bg-[#f7f1e8]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto px-4 py-1 rounded-full text-[10px] border border-[#ece6dc] font-mono tracking-wide text-[#72837c] bg-white">
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start bg-white shrink-0">
          <div className="w-24 h-4 bg-[#ece6dc] rounded-b-xl"></div>
        </div>
      )}

      {/* Scrollable Website Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-16" style={{ backgroundColor: cream, color: text }}>
        {/* Navigation */}
        <div id="section-header" className="px-8 py-5 flex items-center justify-between border-b sticky top-0 backdrop-blur-md z-30 bg-white/85" style={{ borderColor: line }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: emeraldSoft }}>
              <Leaf className="w-4.5 h-4.5" style={{ color: emerald }} />
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-serif tracking-wide" style={nameStyle}>
                {data.salonName || 'Serenity Beauty & Spa'}
              </span>
              <span className="block text-[8px] uppercase tracking-[0.4em] font-medium" style={{ color: muted }}>
                Beauty · Skin · Spa
              </span>
            </div>
          </div>
          {mode === 'desktop' && (
            <div className="flex items-center gap-7 text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: muted }}>
              <span className="cursor-pointer transition-colors" style={{ color: emerald }}>Home</span>
              <span className="cursor-pointer">Services</span>
              <span className="cursor-pointer">Skincare</span>
              <span className="cursor-pointer">Wellness</span>
              <span className="cursor-pointer">Contact</span>
              <span className="px-6 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] cursor-pointer font-semibold text-white" style={{ backgroundColor: emerald }}>
                Book Now
              </span>
            </div>
          )}
        </div>

        {/* Hero — soft, airy */}
        <div id="section-hero" className="relative px-8 py-20 text-center overflow-hidden" style={{ background: `linear-gradient(160deg, ${emeraldSoft} 0%, ${cream} 55%, ${beigeSoft} 100%)` }}>
          {/* soft floating pastel blobs */}
          <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full opacity-50 pointer-events-none" style={{ backgroundColor: sage }}></div>
          <div className="absolute -bottom-16 -right-10 w-64 h-64 rounded-full opacity-50 pointer-events-none" style={{ backgroundColor: blush }}></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: '#ffffff', color: emerald, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <Flower2 className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold">Beauty · Skin · Spa</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif leading-tight" style={{ color: text }}>
              {data.tagline || 'Restore. Rejuvenate. Glow.'}
            </h1>
            <p className="text-xs md:text-sm mt-6 mb-9 max-w-lg mx-auto leading-relaxed" style={{ color: muted }}>
              {data.about || 'A serene sanctuary for skin, body and soul — gentle facials, therapeutic massage and calming spa rituals in a warm, welcoming space.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="px-9 py-3.5 rounded-full text-[11px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-105 shadow-md" style={btnEmerald}>
                Book a Treatment
              </button>
              <button className="px-9 py-3.5 rounded-full text-[11px] uppercase tracking-[0.25em] font-semibold border transition-colors hover:bg-white" style={{ borderColor: emerald, color: emerald }}>
                Explore Rituals
              </button>
            </div>
          </div>
        </div>

        {/* Services — soft rounded cards */}
        <div id="section-services" className="px-8 py-16" style={{ backgroundColor: cream }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>Our Treatments</span>
              <h2 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>Services &amp; Rituals</h2>
              <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: muted }}>
                Thoughtful treatments designed to restore balance and leave you glowing.
              </p>
            </div>

            <div className={`grid gap-5 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {data.services && data.services.map((s) => {
                const shown = displayService(s, locale);
                return (
                <div key={s.id} className="rounded-3xl p-6 border transition-all hover:-translate-y-0.5 min-w-0" style={{ backgroundColor: '#ffffff', borderColor: line, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  {shown.imageUrl && <img src={shown.imageUrl} alt="" className="w-full h-24 object-cover rounded-2xl mb-3" />}
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="font-serif font-semibold text-sm break-words" style={{ color: text }}>{shown.name}</h4>
                    <ServicePrice service={s} offers={data.offers} style={{ color: emerald }} compact />
                  </div>
                  <span className="inline-block text-[9px] uppercase tracking-[0.2em] font-semibold px-2.5 py-0.5 rounded-full mb-3" style={{ backgroundColor: emeraldSoft, color: emeraldDeep }}>
                    {s.category}
                  </span>
                  <p className="text-xs leading-relaxed line-clamp-2 mb-4 break-words" style={{ color: muted }}>{shown.description}</p>
                  <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: line }}>
                    <span className="text-[11px] font-medium" style={{ color: muted }}>{s.duration} mins</span>
                    <button className="px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all hover:brightness-105" style={btnEmerald}>
                      Book Now
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Packages */}
            {data.packages && data.packages.length > 0 && (
              <div className="mt-14 pt-10 border-t" style={{ borderColor: line }}>
                <div className="text-center mb-8">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>Wellness Packages</span>
                  <h3 className="text-xl font-serif mt-2" style={{ color: text }}>Curated Retreats</h3>
                </div>
                <div className="grid gap-4 grid-cols-1">
                  {data.packages.map((p) => (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border" style={{ backgroundColor: '#ffffff', borderColor: line }}>
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-semibold text-sm" style={{ color: text }}>{p.name}</h4>
                          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: blush, color: emeraldDeep }}>Best Value</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: muted }}>{p.description}</p>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2 pt-1" style={{ color: muted }}>
                          <span>⏱ {p.duration} mins</span>
                          <span>•</span>
                          <span>Complete Experience</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                        <BundlePrice bundle={p} offers={data.offers} style={{ color: emerald }} />
                        <button className="px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all hover:brightness-105" style={btnEmerald}>
                          Book Package
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <div className="absolute -bottom-5 -right-5 rounded-2xl px-5 py-4 shadow-lg" style={{ backgroundColor: emerald }}>
                <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/80">Signature</p>
                <p className="text-sm font-serif font-semibold text-white">Glow Ritual</p>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>Facial &amp; Skincare</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>Skin, Nourished &amp; Revived</h3>
              <p className="text-xs mt-4 leading-relaxed" style={{ color: muted }}>
                Gentle, results-driven skincare tailored to your skin's needs — from deep hydration and glow facials to clarifying and anti-ageing rituals.
              </p>

              <div className="mt-6 space-y-3">
                {facialServices.length > 0 ? (
                  facialServices.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border bg-white" style={{ borderColor: line }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: emeraldMid }}></div>
                        <div className="min-w-0">
                          <p className="text-sm font-serif font-semibold truncate" style={{ color: text }}>{s.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: muted }}>{s.duration} mins</p>
                        </div>
                      </div>
                      <ServicePrice service={s} offers={data.offers} style={{ color: emerald }} compact />
                    </div>
                  ))
                ) : (
                  <>
                    {['Deep Hydration & Glow', 'Clarifying Botanical Facial', 'Anti-Ageing Ritual', 'Soothing Calm Facial'].map((label) => (
                      <div key={label} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border bg-white" style={{ borderColor: line }}>
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
        <div id="section-wellness" className="px-8 py-16" style={{ backgroundColor: emerald }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold text-white/70">Spa &amp; Wellness</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3 text-white">A Sanctuary for the Senses</h3>
              <p className="text-xs mt-3 max-w-md mx-auto text-white/70">
                Slow down and unwind with calming rituals designed to soothe body and mind.
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
                        <p className="text-sm font-serif font-semibold text-white truncate">{s.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">{s.duration} mins</p>
                      </div>
                    </div>
                    <ServicePrice service={s} offers={data.offers} className="text-white" compact dark />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        {data.gallery && data.gallery.length > 0 && (
          <div id="section-gallery" className="px-8 py-16" style={{ backgroundColor: cream }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>Our Space</span>
                <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>Gallery</h3>
              </div>
              <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.gallery.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-[1.75rem] overflow-hidden border group" style={{ borderColor: line }}>
                    <img src={item.url} alt={item.alt || 'Gallery photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(21,89,74,0.8), transparent)' }}>
                      <span className="text-[9px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: emerald }}>
                        {item.category || 'General'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About / Founder */}
        {data.ownerName && (
          <div id="section-owner" className="px-8 py-14 border-y" style={{ backgroundColor: beigeSoft, borderColor: line }}>
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 border-4" style={{ borderColor: emeraldSoft }}>
                <OwnerAvatar
                  photoUrl={data.ownerPhotoUrl}
                  name={data.ownerName}
                  className="w-full h-full text-3xl"
                  alt="Founder"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>
                  {data.ownerRole || 'Founder & Lead Therapist'}
                </span>
                <h3 className="text-2xl font-serif mt-1" style={{ color: text }}>{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed italic" style={{ color: muted }}>
                  “{data.reviewedContent?.ownerIntro || 'Wellness is personal. Every treatment here is gentle, considered, and made to help you feel restored — inside and out.'}”
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team */}
        {data.team && data.team.length > 0 && (
          <div id="section-team" className="px-8 py-16" style={{ backgroundColor: cream }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>Our Specialists</span>
                <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>Meet the Team</h3>
              </div>

              <div className={`grid gap-6 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {data.team.map((member) => {
                  const pub = getPublicStaffData(member);
                  return (
                    <div key={pub.id} className="rounded-3xl border p-6 flex flex-col gap-4 bg-white" style={{ borderColor: line }}>
                      <div className="flex items-center gap-4">
                        <img src={pub.imageUrl} alt={pub.name} className="w-16 h-16 rounded-full object-cover border-2 shrink-0" style={{ borderColor: emeraldSoft }} />
                        <div className="min-w-0">
                          <h4 className="font-serif font-semibold text-base" style={{ color: text }}>{pub.name}</h4>
                          <p className="text-[10px] uppercase tracking-[0.25em] mt-1" style={{ color: emerald }}>{pub.role}</p>
                          {pub.phone && (
                            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: muted }}>
                              <Phone className="w-3 h-3" />{pub.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {pub.specialties && pub.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {pub.specialties.map((spec, i) => (
                            <span key={i} className="text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full" style={{ backgroundColor: emeraldSoft, color: emeraldDeep }}>
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      {pub.bio && (
                        <p className="text-xs leading-relaxed italic line-clamp-2" style={{ color: muted }}>
                          “{pub.bio}”
                        </p>
                      )}
                      <button className="w-full py-2.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-105 mt-auto" style={btnEmerald}>
                        Book with {pub.name.split(' ')[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Client Reviews (theme-specific static content — no DB in this phase) */}
        <div id="section-reviews" className="px-8 py-16" style={{ backgroundColor: beigeSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>Kind Words</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>Client Reviews</h3>
            </div>
            <div className={`grid gap-6 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {REVIEWS.map((t, i) => (
                <div key={i} className="rounded-3xl border p-6 flex flex-col gap-3 bg-white" style={{ borderColor: line }}>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" style={{ color: emeraldMid, fill: emeraldMid }} />
                    ))}
                  </div>
                  <Quote className="w-5 h-5" style={{ color: emeraldMid }} />
                  <p className="text-xs leading-relaxed italic flex-1 font-serif" style={{ color: text }}>
                    “{t.quote}”
                  </p>
                  <div className="pt-3 border-t" style={{ borderColor: line }}>
                    <p className="text-xs font-semibold" style={{ color: text }}>{t.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: emerald }}>{t.service}</p>
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
                  <Video className="w-3 h-3" /> On The Feed
                </span>
                <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>Latest Moments</h3>
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
        <div id="section-location" className="px-8 py-16 border-t" style={{ backgroundColor: beigeSoft, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: emerald }}>Visit Us</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: text }}>Location &amp; Hours</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border space-y-4 bg-white" style={{ borderColor: line }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: text }}>
                  <MapPin className="w-4 h-4" style={{ color: emerald }} /> Studio Address
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="w-full py-2.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-105 flex items-center justify-center gap-2 text-white" style={btnEmerald}>
                  <Navigation className="w-3.5 h-3.5" /> Get Directions
                </button>
              </div>

              <div className="p-6 rounded-3xl border space-y-3 bg-white" style={{ borderColor: line }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: text }}>
                  <Clock className="w-4 h-4" style={{ color: emerald }} /> Opening Hours
                </h4>
                <div className="space-y-2 text-xs" style={{ color: muted }}>
                  {data.openingHours ? (
                    Object.entries(data.openingHours).map(([day, sch]) => (
                      <div key={day} className="flex justify-between border-b pb-1.5 capitalize" style={{ borderColor: line }}>
                        <span className="font-semibold" style={{ color: text }}>{day}</span>
                        {sch.open ? <span>{sch.startTime} – {sch.endTime}</span> : <span className="font-semibold" style={{ color: emerald }}>Closed</span>}
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
            <h3 className="text-2xl md:text-3xl font-serif mb-6" style={{ color: text }}>Book Your Appointment</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button className="py-3 rounded-full border bg-white font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors hover:bg-white" style={{ borderColor: line, color: text }}>
                <Phone className="w-4 h-4" style={{ color: emerald }} /> Call Now
              </button>
              <button className="py-3 rounded-full text-white font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-105" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button className="py-3 rounded-full font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-105 text-white" style={btnEmerald}>
                <CalendarCheck className="w-4 h-4" /> Book Online
              </button>
            </div>

            <div className="p-5 rounded-3xl border text-left text-xs space-y-2 bg-white" style={{ borderColor: line }}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 uppercase tracking-[0.15em] text-[10px]" style={{ color: text }}>
                  <CreditCard className="w-4 h-4" style={{ color: emerald }} /> Booking Deposit
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ backgroundColor: emeraldSoft, color: emeraldDeep }}>25% Advance</span>
              </div>
              <p style={{ color: muted }}>Reserve your appointment with a 25% advance deposit. Remaining payable at the studio.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer id="section-footer" className="px-8 py-10 text-center text-xs" style={{ backgroundColor: emeraldDeep, color: '#cfe3dd' }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Leaf className="w-4 h-4" style={{ color: '#9fd3c3' }} />
            <p className="font-serif font-semibold text-sm tracking-wide" style={nameStyle}>{data.salonName || 'Serenity Beauty & Spa'}</p>
          </div>
          <p className="uppercase tracking-[0.25em] text-[9px] font-medium mb-4" style={{ color: '#9fd3c3' }}>
            {data.tagline || 'Restore · Rejuvenate · Glow'}
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: '#7fa79b' }}>
            © 2026 {data.salonName || 'Salon'}. Powered by Nexora Platform.
          </p>
        </footer>
      </div>
    </div>
  );
}
