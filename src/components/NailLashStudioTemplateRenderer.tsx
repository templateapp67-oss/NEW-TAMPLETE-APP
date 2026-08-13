import type { ReactNode } from 'react';
import type { SalonData } from '../types';
import { getPublicStaffData } from '../types';
import { getSalonNameStyle } from '../lib/brandIdentity';
import { NAIL_LASH_STUDIO_THEME } from '../lib/themeServices';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  Eye,
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Palette,
  Phone,
  Quote,
  Sparkles,
  Star,
  UserRound,
  Users,
  WandSparkles,
  Youtube,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: 'desktop' | 'mobile';
}

/**
 * NAIL & LASH STUDIO — independent visual renderer (Theme ID:
 * nail_lash_studio).
 *
 * Phase 6.1 is presentation-only. These are visual showcase cards, not
 * service records or suggested-service data; this renderer never mutates or
 * persists salon state.
 */

const {
  ink,
  inkSoft,
  pink,
  pinkDeep,
  pinkGlow,
  pinkSoft,
  sand,
  sandDeep,
  nude,
  nudeSoft,
  cream,
  muted,
  line,
  white,
} = NAIL_LASH_STUDIO_THEME;

const NAIL_ART = [
  {
    name: 'Chrome Aura',
    detail: 'Mirror chrome · soft glow',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Pink French',
    detail: 'Sheer nude · neon edge',
    image: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Liquid Marble',
    detail: 'Glossy lines · custom art',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Aura Bloom',
    detail: 'Petal wash · high shine',
    image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Glass Tips',
    detail: 'Transparent edge · crystal detail',
    image: 'https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'After Dark',
    detail: 'Ink black · hot pink flash',
    image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=900&auto=format&fit=crop',
  },
];

const GEL_ACRYLIC = [
  { name: 'Gel Finish', detail: 'Flexible, glass-like shine', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Acrylic Sculpt', detail: 'Structured length, made to last', image: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1000&auto=format&fit=crop' },
  { name: 'Builder Strength', detail: 'Natural support, polished finish', image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=1000&auto=format&fit=crop' },
];

const LASH_BROW = [
  { name: 'Lash Lift', detail: 'Wide-awake curl, no extensions', image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=900&auto=format&fit=crop' },
  { name: 'Soft Volume', detail: 'Lightweight, seamless definition', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=900&auto=format&fit=crop' },
  { name: 'Brow Shape', detail: 'Clean arch, brushed-up finish', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=900&auto=format&fit=crop' },
];

const GALLERY = [
  { image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1000&auto=format&fit=crop', alt: 'Pink and chrome nail art', label: 'Fresh set' },
  { image: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1000&auto=format&fit=crop', alt: 'Nude nail art detail', label: 'Nude mood' },
  { image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=1000&auto=format&fit=crop', alt: 'Lash beauty closeup', label: 'Lash moment' },
  { image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=1000&auto=format&fit=crop', alt: 'Glossy custom nail design', label: 'The detail' },
  { image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1000&auto=format&fit=crop', alt: 'Dark glamorous nail set', label: 'After dark' },
];

const TESTIMONIALS = [
  { name: 'Ananya R.', detail: 'Chrome aura set', quote: 'The studio feels like a moodboard you can step into. My chrome set was perfect down to the tiniest detail.', initials: 'AR' },
  { name: 'Maya K.', detail: 'Lash lift & brow shape', quote: 'Beautiful, calm and so precise. I left looking polished without feeling overdone.', initials: 'MK' },
  { name: 'Sana P.', detail: 'Gel manicure', quote: 'The consultation was thoughtful, the art was original and the finish stayed glossy for weeks.', initials: 'SP' },
];

const FEATURED = [
  { number: '01', name: 'Nail Art', detail: 'Custom sets · chrome · tiny details', icon: Palette, color: pink },
  { number: '02', name: 'Gel & Acrylic', detail: 'Gloss · strength · sculpted length', icon: WandSparkles, color: nude },
  { number: '03', name: 'Mani / Pedi', detail: 'Ritual care · polished finish', icon: Sparkles, color: pinkDeep },
  { number: '04', name: 'Lash & Brow', detail: 'Lift · volume · clean arches', icon: Eye, color: inkSoft },
];

function SectionTitle({
  eyebrow,
  title,
  body,
  light = false,
  center = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div className={`${center ? 'text-center mx-auto' : ''} max-w-xl`}>
      <span className="inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.28em]" style={{ color: light ? pinkGlow : pinkDeep }}>
        <span className="w-5 h-px" style={{ backgroundColor: light ? pinkGlow : pink }} />
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl md:text-4xl font-extrabold leading-[0.98] tracking-[-0.06em]" style={{ color: light ? white : ink }}>
        {title}
      </h2>
      {body && <p className="mt-4 text-xs md:text-sm leading-relaxed" style={{ color: light ? 'rgba(255,255,255,0.65)' : muted }}>{body}</p>}
    </div>
  );
}

function Button({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5"
      style={primary ? { backgroundColor: pink, color: white, boxShadow: `0 10px 24px ${pink}42` } : { backgroundColor: white, color: ink, border: `1px solid ${line}` }}
    >
      {children}
    </a>
  );
}

function ImageShowcaseCard({ item, index, compact = false }: { item: { name: string; detail: string; image: string }; index: number; compact?: boolean; key?: string }) {
  return (
    <article className={`relative overflow-hidden group ${compact ? 'rounded-[1.5rem] min-h-[170px]' : 'rounded-[1.75rem] min-h-[230px]'}`}>
      <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#211b24]/85 via-[#211b24]/10 to-transparent" />
      <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: pinkGlow }}>{String(index + 1).padStart(2, '0')}</p>
          <h3 className="text-sm font-extrabold text-white mt-1">{item.name}</h3>
          <p className="text-[9px] mt-1 text-white/65">{item.detail}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/80 transition-transform group-hover:translate-x-1" />
      </div>
    </article>
  );
}

function TeamCard({ member }: { member: ReturnType<typeof getPublicStaffData>; key?: string }) {
  return (
    <article className="rounded-[1.5rem] overflow-hidden border bg-white" style={{ borderColor: line }}>
      <div className="h-36 relative" style={{ background: `linear-gradient(135deg, ${pinkSoft}, ${sand})` }}>
        {member.imageUrl ? <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" /> : <UserRound className="absolute w-12 h-12 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: pinkDeep }} />}
        {member.rating && <span className="absolute right-3 top-3 px-2 py-1 rounded-full bg-white text-[9px] font-extrabold flex items-center gap-1" style={{ color: ink }}><Star className="w-3 h-3" style={{ color: pink, fill: pink }} /> {member.rating.toFixed(1)}</span>}
      </div>
      <div className="p-4"><h3 className="text-sm font-extrabold" style={{ color: ink }}>{member.name}</h3><p className="text-[9px] font-bold uppercase tracking-[0.14em] mt-1" style={{ color: pinkDeep }}>{member.role}</p>{member.specialties.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{member.specialties.slice(0, 2).map((specialty) => <span key={specialty} className="rounded-full px-2 py-1 text-[8px] font-bold" style={{ backgroundColor: pinkSoft, color: pinkDeep }}>{specialty}</span>)}</div>}</div>
    </article>
  );
}

function ContactAction({ href, icon: Icon, children, primary = false }: { href: string; icon: typeof Phone; children: ReactNode; primary?: boolean }) {
  return <a href={href} className="flex items-center justify-center gap-2 rounded-xl py-3 text-[9px] font-extrabold uppercase tracking-[0.15em] transition-transform hover:-translate-y-0.5" style={primary ? { backgroundColor: pink, color: white } : { backgroundColor: white, color: ink }}>{children}<Icon className="w-3.5 h-3.5" /></a>;
}

export default function NailLashStudioTemplateRenderer({ data, mode }: Props) {
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = ink;
  const publicTeam = (data.team || []).map(getPublicStaffData);
  const phone = data.phone || '';
  const whatsapp = (data.whatsappPhone || data.phone || '').replace(/\D/g, '');
  const heroImage = NAIL_ART[0].image;
  const studioImage = data.heroImageUrl || 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?q=80&w=1200&auto=format&fit=crop';
  const hours = data.openingHours ? Object.entries(data.openingHours).slice(0, 5) : [['monday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['tuesday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['wednesday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['thursday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['friday', { open: true, startTime: '10:00 AM', endTime: '09:00 PM' }]];

  return (
    <div className={`shadow-2xl border flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${mode === 'desktop' ? 'w-full max-w-[980px] rounded-2xl' : 'w-[375px] max-w-full max-h-[812px] rounded-[2rem] border-[8px]'}`} style={{ borderColor: mode === 'desktop' ? line : ink, backgroundColor: cream }}>
      {mode === 'desktop' ? (
        <div className="h-10 flex items-center gap-2 px-4 shrink-0" style={{ backgroundColor: sand, borderBottom: `1px solid ${line}` }}>
          <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff8073]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffd166]" /><span className="w-2.5 h-2.5 rounded-full bg-[#65cf98]" /></div>
          <div className="mx-auto rounded-lg border bg-white px-5 py-1 text-[10px] font-mono tracking-wide" style={{ borderColor: line, color: muted }}>{data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nailandlash'}.nexora.site</div>
        </div>
      ) : <div className="h-6 w-full flex justify-center items-start shrink-0" style={{ backgroundColor: ink }}><div className="w-24 h-4 rounded-b-xl" style={{ backgroundColor: '#09070b' }} /></div>}

      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: cream, color: ink }}>
        {/* Header and navigation */}
        <div className="px-5 md:px-8 py-2 flex items-center justify-between text-[8px] font-extrabold uppercase tracking-[0.18em]" style={{ backgroundColor: pink, color: white }}><span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Your beauty appointment, elevated</span><span className="hidden sm:inline">Appointments · Art · Afterglow</span></div>
        <header id="section-header" className="sticky top-0 z-30 px-5 md:px-8 py-4 flex items-center justify-between gap-4" style={{ backgroundColor: 'rgba(255,250,247,0.94)', borderBottom: `1px solid ${line}` }}>
          <a href="#section-hero" className="flex items-center gap-2.5 min-w-0"><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ink, color: pink }}><Sparkles className="w-4 h-4" /></span><div className="min-w-0"><p className="text-sm font-extrabold truncate" style={nameStyle}>{data.salonName || 'The Glow Edit'}</p><p className="text-[8px] uppercase tracking-[0.25em] font-bold" style={{ color: pinkDeep }}>Nail · Lash · Brow</p></div></a>
          {mode === 'desktop' ? <nav className="flex items-center gap-5 text-[9px] font-extrabold uppercase tracking-[0.12em]" style={{ color: muted }}><a href="#section-featured-services" className="hover:text-[#d70f68]">Edit</a><a href="#section-nail-art" className="hover:text-[#d70f68]">Nails</a><a href="#section-lash-brow" className="hover:text-[#d70f68]">Lashes</a><a href="#section-gallery" className="hover:text-[#d70f68]">Gallery</a><a href="#section-contact" className="rounded-full px-4 py-2.5" style={{ backgroundColor: ink, color: white }}>Book now</a></nav> : <a href="#section-contact" className="rounded-full px-3 py-2 text-[8px] font-extrabold uppercase" style={{ backgroundColor: ink, color: white }}>Book</a>}
        </header>

        {/* Hero */}
        <section id="section-hero" className="relative overflow-hidden px-5 md:px-8 py-8 md:py-12" style={{ backgroundColor: sand }}>
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full" style={{ backgroundColor: pinkSoft }} /><div className="absolute left-1/3 bottom-[-100px] w-48 h-48 rounded-full border-[20px]" style={{ borderColor: `${pink}22` }} />
          <div className="relative z-10 grid md:grid-cols-[0.92fr_1.08fr] gap-8 items-center">
            <div><span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white border" style={{ borderColor: sandDeep, color: pinkDeep }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pink }} />NAIL · LASH · BROW STUDIO</span><h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[0.88] tracking-[-0.075em]" style={{ color: ink }}>Your glow.<br /><span style={{ color: pink }}>Your rules.</span></h1><p className="mt-5 max-w-md text-sm leading-relaxed" style={{ color: muted }}>{data.tagline || 'A visual-first beauty studio for glossy nails, lifted lashes and brows that frame the whole look.'}</p><div className="flex flex-wrap gap-3 mt-7"><Button href="#section-contact" primary>Book your edit <ArrowRight className="w-4 h-4" /></Button><Button href="#section-nail-art">See the art <Camera className="w-4 h-4" /></Button></div><div className="flex flex-wrap gap-x-5 gap-y-2 mt-7 text-[9px] font-extrabold uppercase tracking-[0.12em]" style={{ color: ink }}><span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" style={{ color: pink }} /> Detail obsessed</span><span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" style={{ color: pink }} /> Good energy only</span></div></div>
            <div className="relative min-h-[285px] md:min-h-[350px]"><div className="absolute right-0 top-0 w-[78%] h-[86%] rounded-[2rem] overflow-hidden rotate-3" style={{ backgroundColor: pink }}><img src={heroImage} alt="Glamorous nail art detail" className="w-full h-full object-cover opacity-90" /></div><div className="absolute left-0 bottom-0 w-[58%] h-[65%] rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl -rotate-6" style={{ backgroundColor: nude }}><img src={LASH_BROW[0].image} alt="Lash beauty detail" className="w-full h-full object-cover" /></div><div className="absolute right-2 bottom-5 rounded-2xl bg-white px-3 py-2.5 shadow-xl border" style={{ borderColor: line }}><p className="text-[8px] uppercase tracking-[0.16em] font-extrabold" style={{ color: pinkDeep }}>The signature</p><p className="text-xs font-extrabold mt-1" style={{ color: ink }}>Gloss meets gaze</p></div><div className="absolute left-[-5px] top-8 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white" style={{ backgroundColor: pink, color: white }}><Sparkles className="w-5 h-5" /></div></div>
          </div>
        </section>

        {/* Featured Services */}
        <section id="section-featured-services" className="px-5 md:px-8 py-12" style={{ backgroundColor: cream }}>
          <div className="flex items-end justify-between gap-4 mb-7"><SectionTitle eyebrow="The glow menu" title="Featured services" body="A curated edit of the studio experience — presented here as visual direction only." /><span className="hidden md:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.16em]" style={{ color: pinkDeep, backgroundColor: pinkSoft }}>Curated, never cookie-cutter</span></div>
          <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-4' : 'grid-cols-2'}`}>{FEATURED.map((item) => { const Icon = item.icon; return <a href="#section-contact" key={item.name} className="group rounded-[1.5rem] p-4 min-h-[170px] border flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: line, backgroundColor: item.color === inkSoft ? ink : white }}><div className="flex items-center justify-between"><span className="text-[9px] font-extrabold" style={{ color: item.color === inkSoft ? pinkGlow : pinkDeep }}>{item.number}</span><Icon className="w-5 h-5" style={{ color: item.color === inkSoft ? pink : item.color }} /></div><div><h3 className="text-sm font-extrabold" style={{ color: item.color === inkSoft ? white : ink }}>{item.name}</h3><p className="text-[9px] leading-relaxed mt-1" style={{ color: item.color === inkSoft ? 'rgba(255,255,255,0.6)' : muted }}>{item.detail}</p><span className="inline-flex items-center gap-1 mt-4 text-[8px] font-extrabold uppercase tracking-[0.15em]" style={{ color: item.color === inkSoft ? pinkGlow : pinkDeep }}>Explore <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /></span></div></a>; })}</div>
        </section>

        {/* Nail Art Showcase */}
        <section id="section-nail-art" className="px-5 md:px-8 py-12" style={{ backgroundColor: ink }}><div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8"><SectionTitle eyebrow="The art wall" title="Nail art showcase" body="Tiny canvases. Big personality. Bring a reference, a colour story or just a mood." light /><a href="#section-contact" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.18em] self-start" style={{ backgroundColor: pink, color: white }}>Start your set <ArrowRight className="w-3.5 h-3.5" /></a></div><div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>{NAIL_ART.map((item, index) => <ImageShowcaseCard key={item.name} item={item} index={index} />)}</div></section>

        {/* Gel / Acrylic Showcase */}
        <section id="section-gel-acrylic" className="px-5 md:px-8 py-12" style={{ backgroundColor: sand }}><div className="grid md:grid-cols-[0.82fr_1.18fr] gap-8 items-center"><div><SectionTitle eyebrow="Build your base" title="Gel / acrylic, but make it yours" body="Choose the finish, length and structure that fits your everyday — then add the details that make it unmistakably you." /><div className="flex flex-wrap gap-2 mt-6"><span className="rounded-full px-3 py-2 text-[9px] font-extrabold" style={{ backgroundColor: white, color: pinkDeep }}>Flexible gel</span><span className="rounded-full px-3 py-2 text-[9px] font-extrabold" style={{ backgroundColor: white, color: pinkDeep }}>Sculpted acrylic</span><span className="rounded-full px-3 py-2 text-[9px] font-extrabold" style={{ backgroundColor: white, color: pinkDeep }}>Builder strength</span></div></div><div className="grid grid-cols-3 gap-2">{GEL_ACRYLIC.map((item, index) => <ImageShowcaseCard key={item.name} item={item} index={index} compact />)}</div></div></section>

        {/* Manicure / Pedicure */}
        <section id="section-mani-pedi" className="px-5 md:px-8 py-12" style={{ backgroundColor: cream }}><div className="text-center mb-8"><SectionTitle eyebrow="The ritual" title="Manicure / pedicure" body="A slower, softer part of the appointment — care first, polished finish second." center /></div><div className="grid md:grid-cols-2 gap-4"><article className="relative min-h-[255px] rounded-[2rem] overflow-hidden group"><img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1100&auto=format&fit=crop" alt="Manicure detail" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#211b24]/90 to-transparent" /><div className="absolute left-5 right-5 bottom-5"><span className="text-[9px] font-extrabold uppercase tracking-[0.24em]" style={{ color: pinkGlow }}>01 / Hands</span><h3 className="text-2xl font-extrabold text-white mt-2">Manicure, re-edited.</h3><p className="text-[10px] mt-2 text-white/65 max-w-xs">Cuticle care, shape, colour and that final satisfying shine.</p></div></article><article className="relative min-h-[255px] rounded-[2rem] overflow-hidden group"><img src="https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1100&auto=format&fit=crop" alt="Pedicure detail" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#211b24]/90 to-transparent" /><div className="absolute left-5 right-5 bottom-5"><span className="text-[9px] font-extrabold uppercase tracking-[0.24em]" style={{ color: pinkGlow }}>02 / Feet</span><h3 className="text-2xl font-extrabold text-white mt-2">Pedicure, unhurried.</h3><p className="text-[10px] mt-2 text-white/65 max-w-xs">Soak, smooth, soften and finish with colour worth looking down at.</p></div></article></div></section>

        {/* Lash & Brow */}
        <section id="section-lash-brow" className="px-5 md:px-8 py-12" style={{ backgroundColor: pinkSoft }}><div className="grid md:grid-cols-[1fr_1.2fr] gap-8 items-center"><div><SectionTitle eyebrow="Frame the face" title="Lash & brow showcase" body="Soft definition, lifted eyes and brows with an opinion — never a one-size-fits-all result." /><div className="mt-6 rounded-2xl p-4 border bg-white" style={{ borderColor: line }}><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ink, color: pink }}><Eye className="w-4 h-4" /></span><div><p className="text-xs font-extrabold" style={{ color: ink }}>The finishing touch</p><p className="text-[9px] mt-1" style={{ color: muted }}>Lashes and brows that still look like you.</p></div></div></div></div><div className="grid grid-cols-3 gap-2">{LASH_BROW.map((item, index) => <ImageShowcaseCard key={item.name} item={item} index={index} compact />)}</div></div></section>

        {/* Gallery */}
        <section id="section-gallery" className="px-5 md:px-8 py-12" style={{ backgroundColor: white }}><div className="flex items-end justify-between gap-4 mb-7"><SectionTitle eyebrow="The visual diary" title="Gallery" body="A little inspiration before your next appointment." /><a href={data.socialProfiles?.instagram || '#section-gallery'} className="hidden md:inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color: pinkDeep }}>Follow the edit <Instagram className="w-4 h-4" /></a></div><div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-5' : 'grid-cols-2'}`}>{GALLERY.map((item, index) => <div key={item.label} className={`${mode === 'desktop' && index === 0 ? 'md:row-span-2 min-h-[300px]' : 'min-h-[145px]'} relative rounded-[1.25rem] overflow-hidden group`}><img src={item.image} alt={item.alt} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#211b24]/75 to-transparent" /><span className="absolute left-3 bottom-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white">{item.label}</span></div>)}</div></section>

        {/* About Studio */}
        <section id="section-about" className="px-5 md:px-8 py-12" style={{ backgroundColor: sand }}><div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center"><div className="relative min-h-[275px]"><div className="absolute left-3 right-3 top-3 bottom-[-8px] rounded-[2rem] rotate-3" style={{ backgroundColor: pink }} /><img src={studioImage} alt="Inside the Nail & Lash Studio" className="relative w-full h-[275px] object-cover rounded-[2rem] border-4 border-white shadow-xl -rotate-2" /><div className="absolute left-[-5px] top-10 rounded-2xl px-3 py-2.5 bg-white shadow-lg border" style={{ borderColor: line }}><Award className="w-4 h-4" style={{ color: pink }} /><p className="text-[9px] font-extrabold mt-1" style={{ color: ink }}>Good taste<br />lives here</p></div></div><div><SectionTitle eyebrow="About the studio" title="A beauty space with a point of view" body={data.about || 'We are a detail-obsessed nail, lash and brow studio for people who see beauty as a form of self-expression. Come for the finish, stay for the feeling.'} /><div className="grid grid-cols-3 gap-2 mt-7">{[{ value: '01', label: 'signature space' }, { value: '∞', label: 'ways to glow' }, { value: '5★', label: 'detail energy' }].map((stat) => <div key={stat.label} className="rounded-2xl p-3 border bg-white" style={{ borderColor: line }}><p className="text-xl font-extrabold" style={{ color: pinkDeep }}>{stat.value}</p><p className="text-[8px] uppercase tracking-[0.12em] font-bold mt-1" style={{ color: muted }}>{stat.label}</p></div>)}</div></div></div></section>

        {/* Team */}
        <section id="section-team" className="px-5 md:px-8 py-12" style={{ backgroundColor: cream }}><div className="flex items-end justify-between gap-4 mb-7"><SectionTitle eyebrow="The hands behind the magic" title="Meet the studio team" body="Artists, perfectionists and very good listeners." /><BadgeCheck className="hidden md:block w-8 h-8" style={{ color: pink }} /></div>{publicTeam.length > 0 ? <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>{publicTeam.slice(0, 6).map((member) => <TeamCard key={member.id} member={member} />)}</div> : <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: sandDeep, backgroundColor: sand }}><Users className="w-8 h-8 mx-auto" style={{ color: pinkDeep }} /><p className="text-sm font-extrabold mt-3" style={{ color: ink }}>Your studio team will appear here</p><p className="text-xs mt-1" style={{ color: muted }}>Add public team profiles to introduce the artists behind the work.</p></div>}</section>

        {/* Testimonials */}
        <section id="section-testimonials" className="px-5 md:px-8 py-12" style={{ backgroundColor: ink }}><SectionTitle eyebrow="The afterglow" title="Testimonials" body="The best part is seeing clients leave already planning their next set." light center /><div className={`grid gap-3 mt-8 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'}`}>{TESTIMONIALS.map((review) => <article key={review.name} className="rounded-[1.5rem] p-5 border" style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' }}><div className="flex items-center justify-between"><div className="flex gap-0.5">{[0, 1, 2, 3, 4].map((star) => <Star key={star} className="w-3.5 h-3.5" style={{ color: pink, fill: pink }} />)}</div><Quote className="w-5 h-5" style={{ color: pinkGlow }} /></div><p className="text-xs leading-relaxed mt-4 text-white/80">“{review.quote}”</p><div className="flex items-center gap-2 mt-5 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}><span className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-extrabold" style={{ backgroundColor: pink, color: white }}>{review.initials}</span><div><p className="text-[10px] font-extrabold text-white">{review.name}</p><p className="text-[9px] mt-0.5 text-white/50">{review.detail}</p></div></div></article>)}</div></section>

        {/* Contact */}
        <section id="section-contact" className="px-5 md:px-8 py-12" style={{ backgroundColor: pink }}><div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8"><div><SectionTitle eyebrow="Make it yours" title="Ready for your close-up?" body="Tell us the mood. We will take care of the details." light /><div className="grid grid-cols-3 gap-2 mt-7"><ContactAction href={`tel:${phone}`} icon={Phone}>Call</ContactAction><ContactAction href={whatsapp ? `https://wa.me/${whatsapp}` : '#section-contact'} icon={MessageCircle}>WhatsApp</ContactAction><ContactAction href="#section-contact" icon={CalendarDays} primary>Book online</ContactAction></div></div><div className="rounded-[1.75rem] p-5 md:p-6" style={{ backgroundColor: 'rgba(33,27,36,0.9)' }}><div className="grid sm:grid-cols-2 gap-5"><div><h3 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: pinkGlow }} /> Visit the edit</h3><p className="text-xs leading-relaxed mt-3 text-white/65">{data.address?.fullAddress || 'Your studio address will appear here.'}</p><a href="#section-contact" className="inline-flex items-center gap-1.5 mt-4 text-[9px] font-extrabold text-white">Get directions <Navigation className="w-3.5 h-3.5" /></a></div><div><h3 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white flex items-center gap-2"><Clock3 className="w-4 h-4" style={{ color: pinkGlow }} /> Studio hours</h3><div className="space-y-2 mt-3">{hours.map(([day, schedule]) => <div key={day} className="flex justify-between gap-2 text-[9px] border-b pb-1.5 text-white/65" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span className="capitalize">{day}</span><span>{schedule.open ? `${schedule.startTime} – ${schedule.endTime}` : 'Closed'}</span></div>)}</div></div></div><div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/55" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" style={{ color: pinkGlow }} /> {data.email || 'hello@theglowedit.com'}</span><span>{data.phone || 'Bookings by message'}</span></div></div></div></section>

        {/* Footer */}
        <footer id="section-footer" className="px-5 md:px-8 py-8" style={{ backgroundColor: ink }}><div className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: pink }}><Sparkles className="w-4 h-4 text-white" /></span><p className="text-sm font-extrabold" style={nameStyle}>{data.salonName || 'The Glow Edit'}</p></div><p className="text-[9px] mt-3 uppercase tracking-[0.18em] text-white/45">{data.tagline || 'Nails · Lashes · Brows · Afterglow'}</p></div><div className="flex items-center gap-3 text-white/60"><a href={data.socialProfiles?.instagram || '#section-footer'} aria-label="Instagram"><Instagram className="w-4 h-4 hover:text-white" /></a><a href={data.socialProfiles?.facebook || '#section-footer'} aria-label="Facebook"><Facebook className="w-4 h-4 hover:text-white" /></a><a href={data.socialProfiles?.youtube || '#section-footer'} aria-label="YouTube"><Youtube className="w-4 h-4 hover:text-white" /></a></div></div><div className="mt-7 pt-4 border-t flex flex-col sm:flex-row justify-between gap-2 text-[8px] uppercase tracking-[0.18em] text-white/35" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span>© 2026 {data.salonName || 'Studio'}</span><span>Powered by Nexora Platform</span></div></footer>
      </div>
    </div>
  );
}
