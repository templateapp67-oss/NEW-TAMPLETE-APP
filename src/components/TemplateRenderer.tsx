import { SalonData, getPublicStaffData } from '../types';
import { Sparkles, Phone, MessageCircle, CalendarCheck, MapPin, Clock, Navigation, Instagram, Facebook, Youtube, Video, Heart, ExternalLink, CreditCard } from 'lucide-react';

interface Props {
  data: SalonData;
  mode: 'desktop' | 'mobile';
}

export default function TemplateRenderer({ data, mode }: Props) {
  const templateId = data.templateId || 'hair';

  // Template-specific styling configurations
  const config = {
    barber: {
      navBg: 'bg-zinc-950 text-zinc-100 border-zinc-800',
      heroBg: 'bg-zinc-900 text-zinc-100',
      primaryBtn: 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold',
      accentColor: '#f59e0b',
      accentText: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      headingFont: 'font-sans uppercase tracking-widest',
      cardBg: 'bg-zinc-900/90 border-zinc-800 text-zinc-100',
      subText: 'text-zinc-400',
      footerBg: 'bg-zinc-950 text-zinc-300',
    },
    hair: {
      navBg: 'bg-white text-gray-900 border-gray-100',
      heroBg: 'bg-gray-900 text-white',
      primaryBtn: 'bg-[#ac0053] hover:bg-[#ba005b] text-white',
      accentColor: '#ac0053',
      accentText: 'text-[#ac0053]',
      badgeBg: 'bg-[#ffd9e1]/50 text-[#ac0053]',
      headingFont: 'font-serif',
      cardBg: 'bg-white border-gray-100 text-gray-900',
      subText: 'text-gray-500',
      footerBg: 'bg-[#1a1c1c] text-white',
    },
    wellness: {
      navBg: 'bg-emerald-950 text-emerald-50 border-emerald-900',
      heroBg: 'bg-emerald-900 text-emerald-50',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      accentColor: '#059669',
      accentText: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      headingFont: 'font-serif',
      cardBg: 'bg-emerald-50/20 border-emerald-100 text-emerald-950',
      subText: 'text-emerald-700/80',
      footerBg: 'bg-emerald-950 text-emerald-100',
    }
  }[templateId];

  // Dynamic team title
  const getTeamTitle = () => {
    const serviceNames = data.services.map(s => (s.name + ' ' + s.category).toLowerCase()).join(' ');
    const salonLower = data.salonName.toLowerCase();
    if (serviceNames.includes('barber') || serviceNames.includes('fade') || serviceNames.includes('beard') || salonLower.includes('barber')) {
      return 'Meet Our Barbers';
    }
    if (serviceNames.includes('facial') || serviceNames.includes('spa') || serviceNames.includes('massage') || serviceNames.includes('skin')) {
      return 'Our Experts';
    }
    return 'Meet Our Stylists';
  };

  return (
    <div className={`bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${
      mode === 'desktop' ? 'w-full max-w-[950px] rounded-xl' : 'w-[375px] max-h-[812px] rounded-[2rem] border-[8px] border-gray-900'
    }`}>
      {/* Browser/Phone Header Bar */}
      {mode === 'desktop' ? (
        <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto bg-white px-4 py-1 rounded text-[10px] text-gray-500 border border-gray-200 font-mono tracking-wide">
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start bg-gray-900 shrink-0">
          <div className="w-24 h-4 bg-black rounded-b-xl"></div>
        </div>
      )}

      {/* Scrollable Website Content */}
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar pb-16">
        
        {/* Navigation Header */}
        <div id="section-header" className={`px-6 py-4 flex items-center justify-between border-b sticky top-0 backdrop-blur-md z-30 transition-colors ${config.navBg}`}>
          <div className="flex items-center gap-2">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="h-7 w-auto object-contain max-w-[120px]" />
            ) : (
              <Sparkles className="w-5 h-5" style={{ color: config.accentColor }} />
            )}
            <span className="font-bold text-lg">{data.salonName || 'Your Salon'}</span>
          </div>
          {mode === 'desktop' && (
            <div className="flex gap-6 text-xs font-medium opacity-90">
              <span className="font-bold cursor-pointer">Home</span>
              <span className="cursor-pointer">Services</span>
              {data.team && data.team.length > 0 && <span className="cursor-pointer">Team</span>}
              {data.gallery && data.gallery.length > 0 && <span className="cursor-pointer">Gallery</span>}
              <span className="cursor-pointer">Contact</span>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div id="section-hero" className={`px-6 py-16 text-center relative overflow-hidden min-h-[300px] flex items-center justify-center ${config.heroBg}`}>
          {data.heroImageUrl && (
            <img
              src={data.heroImageUrl}
              alt="Hero Banner"
              className={`absolute inset-0 w-full h-full object-cover opacity-45 ${
                data.heroPosition === 'Top' ? 'object-top' : data.heroPosition === 'Bottom' ? 'object-bottom' : 'object-center'
              }`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
          <div className="relative z-10 max-w-xl mx-auto text-white">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${config.badgeBg}`}>
              {templateId === 'barber' ? 'Master Barber Lounge' : templateId === 'wellness' ? 'Luxury Spa & Wellness' : 'Premier Hair & Beauty'}
            </span>
            <h1 className={`text-2xl md:text-4xl font-bold mb-3 ${config.headingFont}`}>
              {data.tagline || 'Elevating your natural beauty and style'}
            </h1>
            <p className="text-xs md:text-sm text-gray-200 mb-6 max-w-md mx-auto leading-relaxed opacity-90">
              {data.about || 'Experience world-class care, top-tier styling, and ultimate relaxation in our studio.'}
            </p>
            <button className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95 ${config.primaryBtn}`}>
              Book Appointment Now
            </button>
          </div>
        </div>

        {/* Services Section */}
        <div id="section-services" className="px-6 py-12 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText}`}>Our Offerings</span>
            <h2 className={`text-2xl font-bold mt-1 ${config.headingFont}`}>Signature Services & Pricing</h2>
            <p className="text-xs text-gray-500 mt-1">Transparent pricing with secure advance booking options.</p>
          </div>

          <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {data.services && data.services.map(s => (
              <div key={s.id} className={`p-5 rounded-2xl border shadow-2xs hover:shadow-md transition-all ${config.cardBg}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm">{s.name}</h4>
                  <span className={`font-bold text-sm ${config.accentText}`}>₹{s.price.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs opacity-75 mb-4 line-clamp-2">{s.description}</p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100/20 text-[11px]">
                  <span className="opacity-60 font-medium">{s.duration} mins</span>
                  <button className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-colors ${config.primaryBtn}`}>
                    Book Slot
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Packages Section (Value Packages & Bundles) */}
          {data.packages && data.packages.length > 0 && (
            <div className="mt-12 pt-10 border-t border-gray-200/40">
              <div className="text-center mb-8">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText}`}>Special Combos</span>
                <h3 className={`text-xl font-bold mt-1 ${config.headingFont}`}>Value Packages & Bundles</h3>
                <p className="text-xs text-gray-500 mt-1">Bundled treatments designed to save you time and money.</p>
              </div>

              <div className="grid gap-4 grid-cols-1">
                {data.packages.map(p => (
                  <div key={p.id} className={`p-5 rounded-2xl border border-dashed hover:border-solid transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${config.cardBg}`}>
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm">{p.name}</h4>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Best Value</span>
                      </div>
                      <p className="text-xs opacity-75 leading-relaxed">{p.description}</p>
                      <div className="text-[10px] opacity-50 font-bold uppercase tracking-wider flex items-center gap-2 pt-1">
                        <span>🕒 {p.duration} mins</span>
                        <span>•</span>
                        <span>Complete Bundle</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-gray-150">
                      <span className={`font-extrabold text-base md:text-lg ${config.accentText}`}>₹{p.price.toLocaleString('en-IN')}</span>
                      <button className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-colors ${config.primaryBtn}`}>
                        Book Bundle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Owner / Founder Section */}
        {data.ownerName && (
          <div id="section-owner" className="px-6 py-10 bg-gray-50 border-y border-gray-100">
            <div className="max-w-xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0">
                <img 
                  src={data.team?.[0]?.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"} 
                  alt="Founder" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${config.accentText}`}>{data.ownerRole || "Founder & Master Stylist"}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">{data.ownerName}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  "{data.reviewedContent?.ownerIntro || "We believe in personalized artistry and exceptional client care to ensure you leave feeling confident and rejuvenated."}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team Section (Conditional: Hide if no team members) */}
        {data.team && data.team.length > 0 && (
          <div id="section-team" className="px-6 py-12 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText}`}>Talented Professionals</span>
              <h3 className={`text-2xl font-bold mt-1 ${config.headingFont}`}>{getTeamTitle()}</h3>
              <p className="text-xs text-gray-500 mt-1">Book your preferred expert for a tailored experience.</p>
            </div>

            <div className={`grid gap-5 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {data.team.map(member => {
                const pub = getPublicStaffData(member);
                return (
                  <div key={pub.id} className={`bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col gap-3`}>
                    <div className="flex items-start gap-4">
                      <img src={pub.imageUrl} alt={pub.name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0 shadow-xs" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-base">{pub.name}</h4>
                        <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${config.accentText}`}>{pub.role}</p>
                        {pub.phone && <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{pub.phone}</p>}
                      </div>
                    </div>
                    {pub.specialties && pub.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pub.specialties.map((spec, i) => (
                          <span key={i} className="bg-gray-100 text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                    {pub.bio && (
                      <p className="text-xs text-gray-600 line-clamp-2 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        "{pub.bio}"
                      </p>
                    )}
                    <button className={`w-full py-2 rounded-xl text-xs font-bold transition-colors mt-auto ${config.primaryBtn}`}>
                      Book with {pub.name.split(' ')[0]}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gallery Section (Conditional: Hide if empty) */}
        {data.gallery && data.gallery.length > 0 && (
          <div id="section-gallery" className="px-6 py-12 bg-gray-50 border-t border-gray-100">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText}`}>Visual Showcase</span>
                <h3 className={`text-2xl font-bold mt-1 ${config.headingFont}`}>Our Space & Work Gallery</h3>
                <p className="text-xs text-gray-500 mt-1">Explore our salon ambience and client transformations.</p>
              </div>
              <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {data.gallery.map(item => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-2xs group">
                    <img src={item.url} alt={item.alt || 'Gallery photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                      <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md w-fit">
                        {item.category || 'General'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Videos Section (Conditional: Hide if no social videos) */}
        {data.socialVideos && data.socialVideos.length > 0 && (
          <div id="section-social" className="px-6 py-12 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} flex items-center justify-center gap-1`}>
                <Video className="w-3 h-3" /> Social Feed
              </span>
              <h3 className={`text-2xl font-bold mt-1 ${config.headingFont}`}>Reels & Styling Videos</h3>
            </div>
            <div className={`grid gap-4 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {data.socialVideos.map(video => (
                <div key={video.id} className="relative aspect-[9/16] rounded-xl overflow-hidden group border border-gray-200 shadow-xs bg-gray-900">
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-bold line-clamp-2">{video.title}</p>
                    {video.likesCount && (
                      <span className="flex items-center gap-1 text-[10px] text-pink-400 font-semibold mt-1">
                        <Heart className="w-3 h-3 fill-pink-400" /> {video.likesCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location & Opening Hours Section */}
        <div id="section-location" className="px-6 py-12 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText}`}>Visit Us</span>
              <h3 className={`text-2xl font-bold mt-1 ${config.headingFont}`}>Location & Hours</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${config.accentText}`} /> Studio Address
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {data.address?.fullAddress || 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050'}
                </p>
                <button className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Navigation className="w-3.5 h-3.5" /> Get Directions
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${config.accentText}`} /> Opening Hours
                </h4>
                <div className="space-y-2 text-xs text-gray-600">
                  {data.openingHours ? (
                    Object.entries(data.openingHours).map(([day, sch]) => (
                      <div key={day} className="flex justify-between border-b border-gray-100 pb-1.5 capitalize">
                        <span className="font-medium text-gray-900">{day}</span>
                        {sch.open ? <span>{sch.startTime} – {sch.endTime}</span> : <span className="text-red-500 font-bold">Closed</span>}
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

        {/* Contact & Booking Options Section */}
        <div id="section-contact" className="px-6 py-12 max-w-xl mx-auto text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-3">
            <CalendarCheck className={`w-6 h-6 ${config.accentText}`} />
          </div>
          <h3 className={`text-2xl font-bold mb-6 ${config.headingFont}`}>Ready to Transform Your Look?</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <button className="py-3 bg-white border border-gray-200 hover:border-gray-400 text-gray-900 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2">
              <Phone className={`w-4 h-4 ${config.accentText}`} /> Call Now
            </button>
            <button className="py-3 bg-[#25D366] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
            <button className={`py-3 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 ${config.primaryBtn}`}>
              <CalendarCheck className="w-4 h-4" /> Book Online
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 text-left text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-gray-900">
              <span className="flex items-center gap-1.5"><CreditCard className={`w-4 h-4 ${config.accentText}`} /> Online Booking Deposit</span>
              <span className="bg-[#ffd9e1] text-[#ac0053] px-2 py-0.5 rounded-full text-[10px]">25% Advance</span>
            </div>
            <p className="text-gray-500">Secure your appointment instantly with a 25% advance deposit. Remaining payable at salon.</p>
          </div>
        </div>

        {/* Footer */}
        <footer id="section-footer" className={`px-6 py-8 text-center text-xs border-t border-gray-800 ${config.footerBg}`}>
          <p className="font-bold text-sm mb-1">{data.salonName || 'Your Salon'}</p>
          <p className="opacity-70 mb-4">{data.tagline || 'Excellence in Hair & Beauty'}</p>
          <p className="opacity-50 text-[10px]">© 2026 {data.salonName || 'Salon'}. Powered by Nexora Platform.</p>
        </footer>

      </div>
    </div>
  );
}
