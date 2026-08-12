import type { CSSProperties } from 'react';
import { SalonData, getPublicStaffData } from '../types';
import { getSalonNameStyle } from '../lib/brandIdentity';
import { HAIR_STUDIO_THEME } from '../lib/themeServices';
import OwnerAvatar from './OwnerAvatar';
import {
  Scissors, Phone, MessageCircle, CalendarCheck, MapPin, Clock, Navigation,
  Video, Heart, Star, Quote, CreditCard, Palette,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: 'desktop' | 'mobile';
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
 *   - Static, presentation-only Color Showcase / Reviews (no DB in this phase)
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

const REVIEWS = [
  { name: 'Ananya Iyer', service: 'Balayage / Ombre', quote: 'The color bar is pure artistry. My balayage looks effortless and grew out beautifully.' },
  { name: 'Sara Khan', service: 'Luxury Blowout', quote: 'A minimalist studio that feels calm the moment you walk in. My blowout lasted a full week.' },
  { name: 'Meera Nair', service: 'Olaplex Bond Repair', quote: 'My hair has never felt stronger. The consultation was thoughtful and the result speaks for itself.' },
];

export default function HairStudioTemplateRenderer({ data, mode }: Props) {
  const { ink, inkSoft, paper, paperDeep, rose, roseBright, roseSoft, roseDeep, line, muted } = HAIR_STUDIO_THEME;

  // Keep the owner's chosen font style for the salon name; default to near-black
  // ink so the wordmark stays legible on the light paper surfaces.
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = ink;

  const btnRose: CSSProperties = {
    backgroundColor: rose,
    color: '#ffffff',
  };

  return (
    <div className="shadow-xl border border-neutral-200 flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full w-full max-w-[950px] rounded-xl bg-white">
      {/* Browser/Phone Header Bar */}
      {mode === 'desktop' ? (
        <div className="h-10 border-b border-neutral-200 flex items-center px-4 gap-2 shrink-0 bg-neutral-50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto px-4 py-1 rounded text-[10px] border border-neutral-200 font-mono tracking-wide text-neutral-500 bg-white">
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start bg-white shrink-0">
          <div className="w-24 h-4 bg-neutral-200 rounded-b-xl"></div>
        </div>
      )}

      {/* Scrollable Website Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-16" style={{ backgroundColor: paper, color: ink }}>
        {/* Navigation */}
        <div id="section-header" className="px-8 py-5 flex items-center justify-between border-b sticky top-0 backdrop-blur-md z-30 bg-white/90" style={{ borderColor: line }}>
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="h-8 w-auto object-contain max-w-[120px]" />
            ) : (
              <div className="flex flex-col items-center justify-center leading-none">
                <Scissors className="w-4 h-4" style={{ color: rose }} />
              </div>
            )}
            <div className="leading-tight">
              <span className="block text-lg font-serif tracking-wide" style={nameStyle}>
                {data.salonName || 'Atelier Hair Studio'}
              </span>
              <span className="block text-[8px] uppercase tracking-[0.4em] font-medium" style={{ color: muted }}>
                Hair Studio · Color Bar
              </span>
            </div>
          </div>
          {mode === 'desktop' && (
            <div className="flex items-center gap-8 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              <span className="cursor-pointer hover:text-neutral-900 transition-colors" style={{ color: roseDeep }}>Home</span>
              <span className="cursor-pointer hover:text-neutral-900 transition-colors">Services</span>
              <span className="cursor-pointer hover:text-neutral-900 transition-colors">Color</span>
              {data.team && data.team.length > 0 && <span className="cursor-pointer hover:text-neutral-900 transition-colors">Stylists</span>}
              <span className="cursor-pointer hover:text-neutral-900 transition-colors">Contact</span>
              <span className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] cursor-pointer border transition-colors" style={{ borderColor: rose, color: rose }}>
                Book
              </span>
            </div>
          )}
        </div>

        {/* Hero — light, editorial */}
        <div id="section-hero" className="relative px-8 py-20 text-center overflow-hidden" style={{ backgroundColor: paperDeep }}>
          {/* subtle double hairline frame */}
          <div className="absolute inset-4 border pointer-events-none" style={{ borderColor: line }}></div>
          <div className="absolute inset-[18px] border pointer-events-none" style={{ borderColor: line }}></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-6">
              <span className="h-px w-12" style={{ backgroundColor: rose }}></span>
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>
                Hair Studio · Color Bar
              </span>
              <span className="h-px w-12" style={{ backgroundColor: rose }}></span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif leading-tight" style={{ color: ink }}>
              {data.tagline || 'Where Hair Becomes Art'}
            </h1>
            <p className="text-xs md:text-sm mt-6 mb-9 max-w-lg mx-auto leading-relaxed" style={{ color: muted }}>
              {data.about || 'A modern studio for precision cutting, artistic hair color, and editorial styling — a considered experience from consultation to finish.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="px-9 py-3.5 text-[11px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-110" style={btnRose}>
                Book a Consultation
              </button>
              <button className="px-9 py-3.5 text-[11px] uppercase tracking-[0.25em] font-semibold border transition-colors hover:bg-white" style={{ borderColor: ink, color: ink }}>
                Explore the Menu
              </button>
            </div>
          </div>
        </div>

        {/* Services — editorial menu, grouped by category */}
        <div id="section-services" className="px-8 py-16" style={{ backgroundColor: paper }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>The Menu</span>
              <h2 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>Services, Curated</h2>
              <div className="h-px w-16 mx-auto mt-5" style={{ backgroundColor: rose }}></div>
            </div>

            {/* Group services by category to give a true "menu" feel */}
            {(() => {
              const categories: { cat: string; items: typeof data.services }[] = [];
              for (const s of data.services || []) {
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
                      {group.cat}
                    </h3>
                    <div className="h-px flex-1" style={{ backgroundColor: line }}></div>
                  </div>
                  <div className={`grid gap-x-10 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {group.items.map((s) => (
                      <div key={s.id} className="py-4 flex items-start justify-between gap-4" style={{ borderBottom: `1px solid ${line}` }}>
                        <div className="min-w-0">
                          <h4 className="text-sm font-serif font-semibold" style={{ color: ink }}>{s.name}</h4>
                          <p className="text-[11px] mt-1 leading-relaxed line-clamp-2" style={{ color: muted }}>{s.description}</p>
                          <button className="text-[10px] uppercase tracking-[0.2em] font-semibold mt-2 underline underline-offset-4 transition-colors" style={{ color: roseDeep }}>
                            Book this service
                          </button>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-semibold" style={{ color: roseDeep }}>₹{s.price.toLocaleString('en-IN')}</span>
                          <p className="text-[10px] mt-0.5" style={{ color: muted }}>{s.duration} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}

            {/* Packages */}
            {data.packages && data.packages.length > 0 && (
              <div className="mt-14 pt-10 border-t" style={{ borderColor: line }}>
                <div className="text-center mb-8">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>Studio Packages</span>
                  <h3 className="text-xl font-serif mt-2" style={{ color: ink }}>Curated Experiences</h3>
                </div>
                <div className="grid gap-4 grid-cols-1">
                  {data.packages.map((p) => (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border" style={{ borderColor: line, backgroundColor: '#ffffff' }}>
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-3">
                          <h4 className="font-serif font-semibold text-sm" style={{ color: ink }}>{p.name}</h4>
                          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5" style={{ backgroundColor: roseSoft, color: roseDeep }}>Signature</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: muted }}>{p.description}</p>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2 pt-1" style={{ color: muted }}>
                          <span>⏱ {p.duration} mins</span>
                          <span>•</span>
                          <span>Complete Experience</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                        <span className="font-semibold text-lg" style={{ color: roseDeep }}>₹{p.price.toLocaleString('en-IN')}</span>
                        <button className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all hover:brightness-110" style={btnRose}>
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

        {/* Color Showcase — the signature hair-color gallery */}
        <div id="section-color" className="px-8 py-16" style={{ backgroundColor: paperDeep }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold flex items-center justify-center gap-2" style={{ color: roseDeep }}>
                <Palette className="w-3.5 h-3.5" /> The Color Bar
              </span>
              <h2 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>Color Showcase</h2>
              <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: muted }}>
                Explore our signature color work — from sun-kissed balayage to bold fashion tones.
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

        {/* About Studio / Founder */}
        {data.ownerName && (
          <div id="section-owner" className="px-8 py-14 border-y" style={{ backgroundColor: paper, borderColor: line }}>
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 border" style={{ borderColor: rose }}>
                <OwnerAvatar
                  photoUrl={data.ownerPhotoUrl}
                  name={data.ownerName}
                  className="w-full h-full text-3xl"
                  alt="Founder"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>
                  {data.ownerRole || 'Founder & Master Colorist'}
                </span>
                <h3 className="text-2xl font-serif mt-1" style={{ color: ink }}>{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed italic" style={{ color: muted }}>
                  “{data.reviewedContent?.ownerIntro || 'Hair is a canvas. My obsession is precision — a cut that moves beautifully and color that looks like it grew that way.'}”
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team — The Stylists */}
        {data.team && data.team.length > 0 && (
          <div id="section-team" className="px-8 py-16" style={{ backgroundColor: paper }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>The Studio</span>
                <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>Meet Our Stylists</h3>
                <div className="h-px w-16 mx-auto mt-5" style={{ backgroundColor: rose }}></div>
              </div>

              <div className={`grid gap-8 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {data.team.map((member) => {
                  const pub = getPublicStaffData(member);
                  return (
                    <div key={pub.id} className="flex flex-col gap-4">
                      <div className="flex items-center gap-5">
                        <img src={pub.imageUrl} alt={pub.name} className="w-20 h-20 object-cover border shrink-0" style={{ borderColor: line }} />
                        <div className="min-w-0">
                          <h4 className="font-serif font-semibold text-lg" style={{ color: ink }}>{pub.name}</h4>
                          <p className="text-[10px] uppercase tracking-[0.25em] mt-1" style={{ color: roseDeep }}>{pub.role}</p>
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
                            <span key={i} className="text-[10px] uppercase tracking-[0.15em] px-3 py-1 border" style={{ color: muted, borderColor: line }}>
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
                      <button className="w-full py-2.5 text-[10px] uppercase tracking-[0.25em] font-semibold border transition-colors hover:bg-white" style={{ borderColor: ink, color: ink }}>
                        Book with {pub.name.split(' ')[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Transformation / Gallery */}
        {data.gallery && data.gallery.length > 0 && (
          <div id="section-gallery" className="px-8 py-16 border-t" style={{ backgroundColor: paperDeep, borderColor: line }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>Transformations</span>
                <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>Recent Work</h3>
              </div>
              <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.gallery.map((item) => (
                  <div key={item.id} className="relative aspect-square overflow-hidden border group" style={{ borderColor: line }}>
                    <img src={item.url} alt={item.alt || 'Gallery photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 flex items-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(25,24,23,0.8), transparent)' }}>
                      <span className="text-[9px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 text-white" style={{ backgroundColor: rose }}>
                        {item.category || 'General'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Client Reviews (theme-specific static content — no DB in this phase) */}
        <div id="section-reviews" className="px-8 py-16" style={{ backgroundColor: paper }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>Kind Words</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>Client Reviews</h3>
              <div className="h-px w-16 mx-auto mt-5" style={{ backgroundColor: rose }}></div>
            </div>
            <div className={`grid gap-6 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {REVIEWS.map((t, i) => (
                <div key={i} className="border p-6 flex flex-col gap-3 bg-white" style={{ borderColor: line }}>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" style={{ color: rose, fill: rose }} />
                    ))}
                  </div>
                  <Quote className="w-5 h-5" style={{ color: roseBright }} />
                  <p className="text-xs leading-relaxed italic flex-1 font-serif" style={{ color: inkSoft }}>
                    “{t.quote}”
                  </p>
                  <div className="pt-3 border-t" style={{ borderColor: line }}>
                    <p className="text-xs font-semibold" style={{ color: ink }}>{t.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: roseDeep }}>{t.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Videos */}
        {data.socialVideos && data.socialVideos.length > 0 && (
          <div id="section-social" className="px-8 py-16 border-t" style={{ backgroundColor: paperDeep, borderColor: line }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold flex items-center justify-center gap-2" style={{ color: roseDeep }}>
                  <Video className="w-3 h-3" /> On The Feed
                </span>
                <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>Latest Looks</h3>
              </div>
              <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.socialVideos.map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] overflow-hidden group border" style={{ borderColor: line }}>
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(25,24,23,0.85), transparent)' }}></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-xs font-serif font-semibold line-clamp-2">{video.title}</p>
                      {video.likesCount && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold mt-1" style={{ color: roseBright }}>
                          <Heart className="w-3 h-3" style={{ fill: rose }} /> {video.likesCount}
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
        <div id="section-location" className="px-8 py-16 border-t" style={{ backgroundColor: paper, borderColor: line }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: roseDeep }}>Visit The Studio</span>
              <h3 className="text-2xl md:text-3xl font-serif mt-3" style={{ color: ink }}>Location & Hours</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border space-y-4 bg-white" style={{ borderColor: line }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: ink }}>
                  <MapPin className="w-4 h-4" style={{ color: roseDeep }} /> Studio Address
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="w-full py-2.5 text-[10px] uppercase tracking-[0.25em] font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-2 text-white" style={btnRose}>
                  <Navigation className="w-3.5 h-3.5" /> Get Directions
                </button>
              </div>

              <div className="p-6 border space-y-3 bg-white" style={{ borderColor: line }}>
                <h4 className="font-serif font-semibold text-sm flex items-center gap-2" style={{ color: ink }}>
                  <Clock className="w-4 h-4" style={{ color: roseDeep }} /> Opening Hours
                </h4>
                <div className="space-y-2 text-xs" style={{ color: muted }}>
                  {data.openingHours ? (
                    Object.entries(data.openingHours).map(([day, sch]) => (
                      <div key={day} className="flex justify-between border-b pb-1.5 capitalize" style={{ borderColor: line }}>
                        <span className="font-semibold" style={{ color: ink }}>{day}</span>
                        {sch.open ? <span>{sch.startTime} – {sch.endTime}</span> : <span className="font-semibold" style={{ color: roseDeep }}>Closed</span>}
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
            <h3 className="text-2xl md:text-3xl font-serif mb-6" style={{ color: ink }}>Book Your Appointment</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button className="py-3 border bg-white font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors hover:bg-white" style={{ borderColor: line, color: ink }}>
                <Phone className="w-4 h-4" style={{ color: roseDeep }} /> Call Now
              </button>
              <button className="py-3 text-white font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button className="py-3 font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:brightness-110 text-white" style={btnRose}>
                <CalendarCheck className="w-4 h-4" /> Book Online
              </button>
            </div>

            <div className="p-5 border text-left text-xs space-y-2 bg-white" style={{ borderColor: line }}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 uppercase tracking-[0.15em] text-[10px]" style={{ color: ink }}>
                  <CreditCard className="w-4 h-4" style={{ color: roseDeep }} /> Booking Deposit
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ backgroundColor: roseSoft, color: roseDeep }}>25% Advance</span>
              </div>
              <p style={{ color: muted }}>Reserve your appointment with a 25% advance deposit. Remaining payable at the studio.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer id="section-footer" className="px-8 py-10 text-center text-xs" style={{ backgroundColor: ink, color: '#cfcac4' }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scissors className="w-4 h-4" style={{ color: roseBright }} />
            <p className="font-serif font-semibold text-sm tracking-wide" style={nameStyle}>{data.salonName || 'Atelier Hair Studio'}</p>
          </div>
          <p className="uppercase tracking-[0.25em] text-[9px] font-medium mb-4" style={{ color: roseBright }}>
            {data.tagline || 'Where Hair Becomes Art'}
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: '#8c8782' }}>
            © 2026 {data.salonName || 'Salon'}. Powered by Nexora Platform.
          </p>
        </footer>
      </div>
    </div>
  );
}
