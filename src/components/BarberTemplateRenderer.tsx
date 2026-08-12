import type { CSSProperties } from 'react';
import { SalonData, getPublicStaffData } from '../types';
import { getSalonNameStyle } from '../lib/brandIdentity';
import { BARBER_THEME } from '../lib/themeServices';
import OwnerAvatar from './OwnerAvatar';
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
 */
export default function BarberTemplateRenderer({ data, mode }: Props) {
  const { gold, goldBright, goldSoft, charcoal, charcoalSoft, charcoalCard, cream, muted } = BARBER_THEME;

  // Keep the owner's chosen font style for the salon name, but default to a
  // light colour so the wordmark stays legible on the dark barber surfaces.
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = cream;

  const btnGold: CSSProperties = {
    backgroundColor: gold,
    color: charcoal,
  };

  return (
    <div className="bg-black border border-neutral-800 shadow-xl flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full w-full max-w-[950px] rounded-xl">
      {/* Browser/Phone Header Bar */}
      {mode === 'desktop' ? (
        <div className="h-10 border-b border-neutral-800 flex items-center px-4 gap-2 shrink-0 bg-[#0c0c0c]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto px-4 py-1 rounded text-[10px] border border-neutral-800 font-mono tracking-wide text-neutral-500 bg-[#141414]">
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start bg-black shrink-0">
          <div className="w-24 h-4 bg-neutral-800 rounded-b-xl"></div>
        </div>
      )}

      {/* Scrollable Website Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-16 bg-[#0c0c0c] text-neutral-200">
        {/* Navigation */}
        <div id="section-header" className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 sticky top-0 backdrop-blur-md z-30 bg-[#0c0c0c]/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: gold }}>
              <Scissors className="w-4 h-4" style={{ color: gold }} />
            </div>
            <div className="leading-tight">
              <span className="block text-base font-black uppercase tracking-[0.18em]" style={nameStyle}>
                {data.salonName || 'The Grooming Co.'}
              </span>
              <span className="block text-[8px] uppercase tracking-[0.4em] font-semibold" style={{ color: muted }}>
                Barber · Grooming Lounge
              </span>
            </div>
          </div>
          {mode === 'desktop' && (
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-300">
              <span className="cursor-pointer hover:text-white transition-colors" style={{ color: gold }}>Home</span>
              <span className="cursor-pointer hover:text-white transition-colors">Services</span>
              {data.team && data.team.length > 0 && <span className="cursor-pointer hover:text-white transition-colors">Barbers</span>}
              {data.gallery && data.gallery.length > 0 && <span className="cursor-pointer hover:text-white transition-colors">Gallery</span>}
              <span className="cursor-pointer hover:text-white transition-colors">Contact</span>
              <span className="px-4 py-2 border text-[10px] cursor-pointer" style={{ borderColor: gold, color: gold }}>Book Now</span>
            </div>
          )}
        </div>

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
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>
                Est. 2016 · Premium Grooming
              </span>
              <span className="h-px w-10" style={{ backgroundColor: gold }}></span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[0.06em] leading-tight text-white">
              {data.tagline || 'Sharp Cuts. Timeless Grooming.'}
            </h1>
            <p className="text-xs md:text-sm mt-5 mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: muted }}>
              {data.about || 'A classic barbershop experience built for the modern gentleman — precision fades, hot towel shaves, and premium grooming rituals.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button className="px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:brightness-110" style={btnGold}>
                Book Appointment
              </button>
              <button className="px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] border transition-all hover:bg-white/5" style={{ borderColor: gold, color: gold }}>
                View Services
              </button>
            </div>
          </div>
        </div>

        {/* Services — the price board */}
        <div id="section-services" className="px-6 py-14" style={{ backgroundColor: charcoalSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>The Menu</span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-white mt-2">Cuts &amp; Services</h2>
              <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
            </div>

            <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {data.services && data.services.map((s, i) => (
                <div key={s.id} className="group border border-neutral-800 hover:border-[#c9a227]/70 transition-colors p-4" style={{ backgroundColor: charcoalCard }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-[11px] font-black" style={{ color: gold }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black uppercase tracking-wider text-white truncate">{s.name}</h4>
                        <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>{s.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black" style={{ color: gold }}>₹{s.price.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] font-semibold" style={{ color: muted }}>{s.duration} min</p>
                    </div>
                  </div>
                  <p className="text-[11px] mt-3 leading-relaxed line-clamp-2" style={{ color: muted }}>
                    {s.description}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: muted }}>Hot towel finish included</span>
                    <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110" style={btnGold}>
                      Book Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Packages */}
            {data.packages && data.packages.length > 0 && (
              <div className="mt-14 pt-10 border-t border-neutral-800">
                <div className="text-center mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>Combos &amp; Memberships</span>
                  <h3 className="text-xl font-black uppercase tracking-[0.05em] text-white mt-2">Value Packages</h3>
                </div>
                <div className="grid gap-4 grid-cols-1">
                  {data.packages.map((p) => (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border transition-colors" style={{ backgroundColor: charcoalCard, borderColor: gold }}>
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm uppercase tracking-wider text-white">{p.name}</h4>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5" style={{ backgroundColor: gold, color: charcoal }}>Best Value</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: muted }}>{p.description}</p>
                        <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 pt-1" style={{ color: muted }}>
                          <span>⏱ {p.duration} mins</span>
                          <span>•</span>
                          <span>Complete Bundle</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                        <span className="font-black text-lg" style={{ color: gold }}>₹{p.price.toLocaleString('en-IN')}</span>
                        <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110" style={btnGold}>
                          Book Bundle
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
          <div id="section-owner" className="px-6 py-12 border-y border-neutral-800" style={{ backgroundColor: charcoal }}>
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
                <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>
                  {data.ownerRole || 'Master Barber & Founder'}
                </span>
                <h3 className="text-2xl font-black uppercase tracking-[0.05em] text-white mt-1">{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed italic" style={{ color: muted }}>
                  “{data.reviewedContent?.ownerIntro || 'Fifteen years behind the chair. Every cut is measured, every line is deliberate — because a gentleman deserves nothing less than precision.'}”
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
                <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>The Barbers</span>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-white mt-2">Meet Your Barbers</h3>
                <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
              </div>

              <div className={`grid gap-5 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {data.team.map((member) => {
                  const pub = getPublicStaffData(member);
                  return (
                    <div key={pub.id} className="border border-neutral-800 hover:border-[#c9a227]/70 transition-colors p-5 flex flex-col gap-4" style={{ backgroundColor: charcoalCard }}>
                      <div className="flex items-start gap-4">
                        <img src={pub.imageUrl} alt={pub.name} className="w-16 h-16 object-cover border-2 shrink-0" style={{ borderColor: gold }} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-base uppercase tracking-wider text-white">{pub.name}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: gold }}>{pub.role}</p>
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
                            <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 border" style={{ color: muted, borderColor: '#2a2a2a' }}>
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      {pub.bio && (
                        <p className="text-xs line-clamp-2 italic p-3 border" style={{ color: muted, backgroundColor: '#101010', borderColor: '#222222' }}>
                          “{pub.bio}”
                        </p>
                      )}
                      <button className="w-full py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 mt-auto" style={btnGold}>
                        Book with {pub.name.split(' ')[0]}
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
          <div id="section-gallery" className="px-6 py-14 border-t border-neutral-800" style={{ backgroundColor: charcoal }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>The Work</span>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-white mt-2">Gallery</h3>
              </div>
              <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.gallery.map((item) => (
                  <div key={item.id} className="relative aspect-square overflow-hidden border border-neutral-800 group">
                    <img src={item.url} alt={item.alt || 'Gallery photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5" style={{ backgroundColor: gold, color: charcoal }}>
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
        <div id="section-reviews" className="px-6 py-14" style={{ backgroundColor: charcoalSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>Client Reviews</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-white mt-2">Word on the Street</h3>
              <div className="h-px w-16 mx-auto mt-4" style={{ backgroundColor: gold }}></div>
            </div>
            <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {[
                { name: 'Arjun Mehta', service: 'Skin Fade + Beard Lineup', quote: 'Sharpest fade in the city. The hot towel finish is a game changer.' },
                { name: 'Rohit Khanna', service: 'Hot Towel Classic Shave', quote: 'An old-school shave done right. Walked out feeling brand new.' },
                { name: 'Vikram Nair', service: 'Executive Beard & Hair Combo', quote: 'Precision, patience, and a proper consultation. Highly recommend.' },
              ].map((t, i) => (
                <div key={i} className="border border-neutral-800 p-5 flex flex-col gap-3" style={{ backgroundColor: charcoalCard }}>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" style={{ color: gold, fill: gold }} />
                    ))}
                  </div>
                  <Quote className="w-5 h-5" style={{ color: gold }} />
                  <p className="text-xs leading-relaxed italic flex-1" style={{ color: muted }}>“{t.quote}”</p>
                  <div className="pt-3 border-t border-neutral-800">
                    <p className="text-xs font-black uppercase tracking-wider text-white">{t.name}</p>
                    <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: gold }}>{t.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Videos */}
        {data.socialVideos && data.socialVideos.length > 0 && (
          <div id="section-social" className="px-6 py-14 border-t border-neutral-800" style={{ backgroundColor: charcoal }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] flex items-center justify-center gap-1" style={{ color: gold }}>
                  <Video className="w-3 h-3" /> On The Gram
                </span>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-white mt-2">Latest Cuts</h3>
              </div>
              <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.socialVideos.map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] overflow-hidden group border border-neutral-800">
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
        <div id="section-location" className="px-6 py-14 border-t border-neutral-800" style={{ backgroundColor: charcoalSoft }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>Visit The Shop</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-white mt-2">Location &amp; Hours</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border border-neutral-800 space-y-4" style={{ backgroundColor: charcoalCard }}>
                <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 text-white">
                  <MapPin className="w-4 h-4" style={{ color: gold }} /> Shop Address
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="w-full py-2.5 text-xs font-black uppercase tracking-[0.2em] border transition-all hover:brightness-110 flex items-center justify-center gap-2" style={btnGold}>
                  <Navigation className="w-3.5 h-3.5" /> Get Directions
                </button>
              </div>

              <div className="p-6 border border-neutral-800 space-y-3" style={{ backgroundColor: charcoalCard }}>
                <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4" style={{ color: gold }} /> Opening Hours
                </h4>
                <div className="space-y-2 text-xs" style={{ color: muted }}>
                  {data.openingHours ? (
                    Object.entries(data.openingHours).map(([day, sch]) => (
                      <div key={day} className="flex justify-between border-b pb-1.5 capitalize border-neutral-800">
                        <span className="font-bold text-white">{day}</span>
                        {sch.open ? <span>{sch.startTime} – {sch.endTime}</span> : <span className="font-black" style={{ color: gold }}>Closed</span>}
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
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-white mb-6">Book Your Chair</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button className="py-3 border border-neutral-700 hover:border-[#c9a227] text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: charcoalCard }}>
                <Phone className="w-4 h-4" style={{ color: gold }} /> Call Now
              </button>
              <button className="py-3 text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button className="py-3 font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all hover:brightness-110" style={btnGold}>
                <CalendarCheck className="w-4 h-4" /> Book Online
              </button>
            </div>

            <div className="p-4 border text-left text-xs space-y-2" style={{ backgroundColor: charcoalCard, borderColor: '#222222' }}>
              <div className="flex items-center justify-between font-black">
                <span className="flex items-center gap-1.5 text-white uppercase tracking-wider text-[10px]">
                  <CreditCard className="w-4 h-4" style={{ color: gold }} /> Booking Deposit
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase" style={{ backgroundColor: goldSoft, color: goldBright }}>25% Advance</span>
              </div>
              <p style={{ color: muted }}>Secure your chair instantly with a 25% advance deposit. Remaining payable at the shop.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer id="section-footer" className="px-6 py-10 text-center text-xs border-t" style={{ backgroundColor: '#0c0c0c', borderColor: gold }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scissors className="w-4 h-4" style={{ color: gold }} />
            <p className="font-black text-sm uppercase tracking-[0.18em]" style={nameStyle}>{data.salonName || 'The Grooming Co.'}</p>
          </div>
          <p className="uppercase tracking-[0.2em] text-[10px] font-bold mb-4" style={{ color: muted }}>{data.tagline || 'Sharp Cuts · Timeless Grooming'}</p>
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#55534c' }}>
            © 2026 {data.salonName || 'Salon'}. Powered by Nexora Platform.
          </p>
        </footer>
      </div>
    </div>
  );
}
