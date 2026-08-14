import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SalonData } from '../types';
import { getPublicStaffData } from '../types';
import { NAIL_LASH_STUDIO_THEME } from '../lib/themeServices';
import SiteHeader, { useSiteLocale, useThemeAppearance } from './SiteHeader';
import OwnerAvatar from './OwnerAvatar';
import { BundlePrice, ServicePrice } from './PromotionalPricing';
import { FinalBookingCta, SectionStatePanel, structureCopyFrom } from './SiteSectionStates';
import SiteFooter from './SiteFooter';
import SiteFloatingActions from './SiteFloatingActions';
import SiteMobileActionBar from './SiteMobileActionBar';
import SiteBookingHost from './SiteBookingHost';
import SiteSeo from './SiteSeo';
import SiteImage from './SiteImage';
import { setActiveTheme, markPerformance } from '../lib/sitePerformance';
import SiteAnnouncementBar from './SiteAnnouncementBar';
import SiteSalonStatus from './SiteSalonStatus';
import SiteReviews from './SiteReviews';
import SiteSocialFeed from './SiteSocialFeed';
import { openSiteBooking } from '../lib/siteBooking';
import { displayService } from '../lib/displayService';
import { NAIL_LASH_SURFACES, surfacesOf } from '../lib/themeSurfaces';
import type { NailLashSurface } from '../lib/themeSurfaces';
import { dayLabel, siteText, translateCategory } from '../lib/siteI18n';
import { structureText } from '../lib/siteStructureI18n';
import {
  featuredServices,
  headerModeOf,
  resolveSectionState,
  sectionProps,
  siteFrameClass,
  siteGrid,
} from '../lib/siteStructure';
import type { ViewportMode } from '../lib/siteStructure';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  Eye,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Palette,
  Phone,
  Sparkles,
  Star,
  UserRound,
  Users,
  WandSparkles,
} from 'lucide-react';

interface Props {
  data: SalonData;
  mode: ViewportMode;
}

/**
 * NAIL & LASH STUDIO — independent visual renderer (Theme ID:
 * nail_lash_studio).
 *
 * Phase 6.1 is presentation-only. These are visual showcase cards, not
 * service records or suggested-service data; this renderer never mutates or
 * persists salon state.
 *
 * PHASE 10.2: dark mode = deep plum with neon-pink glow (NAIL_LASH_SURFACES);
 * all customer-facing copy flows from the global siteText() table (nail
 * namespace) in English / हिन्दी.
 */

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

const GALLERY_IMAGES = [
  { image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1000&auto=format&fit=crop', alt: 'Pink and chrome nail art' },
  { image: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1000&auto=format&fit=crop', alt: 'Nude nail art detail' },
  { image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=1000&auto=format&fit=crop', alt: 'Lash beauty closeup' },
  { image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=1000&auto=format&fit=crop', alt: 'Glossy custom nail design' },
  { image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1000&auto=format&fit=crop', alt: 'Dark glamorous nail set' },
];

function SectionTitle({
  eyebrow,
  title,
  body,
  light = false,
  center = false,
  t,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  light?: boolean;
  center?: boolean;
  t: NailLashSurface;
}) {
  return (
    <div className={`${center ? 'text-center mx-auto' : ''} max-w-xl`}>
      <span className="inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.28em]" style={{ color: light ? t.pinkGlow : t.pinkDeep }}>
        <span className="w-5 h-px" style={{ backgroundColor: light ? t.pinkGlow : t.pink }} />
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight tracking-[-0.02em]" style={{ color: light ? '#ffffff' : t.ink }}>{title}</h2>
      {body && <p className="mt-4 text-xs md:text-sm leading-relaxed" style={{ color: light ? 'rgba(255,255,255,0.65)' : t.muted }}>{body}</p>}
    </div>
  );
}

function Button({ href, children, primary = false, t, book = false }: { href: string; children: ReactNode; primary?: boolean; t: NailLashSurface; book?: boolean }) {
  return (
    <a
      href={href}
      data-open-booking={book ? 'true' : undefined}
      onClick={book ? (e) => { e.preventDefault(); openSiteBooking(); } : undefined}
      className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5"
      style={primary ? { backgroundColor: t.pink, color: '#ffffff', boxShadow: `0 10px 24px ${t.pink}42` } : { backgroundColor: t.card, color: t.ink, border: `1px solid ${t.line}` }}
    >
      {children}
    </a>
  );
}

function ImageShowcaseCard({ item, index, compact = false }: { item: { name: string; detail: string; image: string }; index: number; compact?: boolean; key?: string }) {
  const { pinkGlow } = NAIL_LASH_STUDIO_THEME;
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

function TeamCard({ member, t }: { member: ReturnType<typeof getPublicStaffData>; key?: string; t: NailLashSurface }) {
  return (
    <article className="rounded-[1.5rem] overflow-hidden border" style={{ borderColor: t.line, backgroundColor: t.card }}>
      <div className="h-36 relative" style={{ background: `linear-gradient(135deg, ${t.pinkSoft}, ${t.sand})` }}>
        {member.imageUrl ? <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" /> : <UserRound className="absolute w-12 h-12 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: t.pinkDeep }} />}
        {member.rating && <span className="absolute right-3 top-3 px-2 py-1 rounded-full text-[9px] font-extrabold flex items-center gap-1" style={{ color: t.ink, backgroundColor: t.card }}><Star className="w-3 h-3" style={{ color: t.pink, fill: t.pink }} /> {member.rating.toFixed(1)}</span>}
      </div>
      <div className="p-4"><h3 className="text-sm font-extrabold" style={{ color: t.ink }}>{member.name}</h3><p className="text-[9px] font-bold uppercase tracking-[0.14em] mt-1" style={{ color: t.pinkDeep }}>{member.role}</p>{member.specialties.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{member.specialties.slice(0, 2).map((specialty) => <span key={specialty} className="rounded-full px-2 py-1 text-[8px] font-bold" style={{ backgroundColor: t.pinkSoft, color: t.pinkDeep }}>{specialty}</span>)}</div>}</div>
    </article>
  );
}

function ContactAction({ href, icon: Icon, children, primary = false, t }: { href: string; icon: typeof Phone; children: ReactNode; primary?: boolean; t: NailLashSurface }) {
  return <a href={href} className="flex items-center justify-center gap-2 rounded-xl py-3 text-[9px] font-extrabold uppercase tracking-[0.15em] transition-transform hover:-translate-y-0.5" style={primary ? { backgroundColor: t.pink, color: '#ffffff' } : { backgroundColor: t.card, color: t.ink }}>{children}<Icon className="w-3.5 h-3.5" /></a>;
}

export default function NailLashStudioTemplateRenderer({ data, mode }: Props) {
  // Live locale + appearance: re-render when the header controls switch.
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('nail_lash_studio');
  const t = surfacesOf(NAIL_LASH_SURFACES, appearance);
  const { ink, inkSoft, pink, pinkDeep, pinkGlow, pinkSoft, sand, sandDeep, nude, cream, muted, line, white } = t;
  const S = { ...siteText('nail_lash_studio', locale), ...structureText('nail_lash_studio', locale) };
  const X = structureCopyFrom(S);
  const palette = { accent: pink, text: ink, muted, card: t.card, line, invert: '#ffffff' };
  const headerMode = headerModeOf(mode);
  // PHASE 10.12 — performance optimization: clear stale data, marks, memoize
  useEffect(() => {
    setActiveTheme('nail_lash_studio');
    markPerformance('nail_lash_studio-render-start');
    return () => { markPerformance('nail_lash_studio-render-end'); };
  }, []);
  const featuredLive = featuredServices(data.services);
  const featuredState = resolveSectionState('featured', featuredLive.length ? featuredLive : [1]);
  const servicesState = resolveSectionState('services', data.services);
  const offersState = resolveSectionState('offers', data.packages);
  const galleryState = resolveSectionState('gallery', [1]);
  const teamState = resolveSectionState('team', data.team);
  const ownerState = resolveSectionState('owner', data.ownerName ? [data.ownerName] : []);
  const aboutState = resolveSectionState('about', [1]);
  const locationState = resolveSectionState('location', ['ready']);

  const FEATURED = [
    { number: '01', name: S.feature1Name, detail: S.feature1Detail, icon: Palette, color: pink },
    { number: '02', name: S.feature2Name, detail: S.feature2Detail, icon: WandSparkles, color: NAIL_LASH_STUDIO_THEME.nude },
    { number: '03', name: S.feature3Name, detail: S.feature3Detail, icon: Sparkles, color: pinkDeep },
    { number: '04', name: S.feature4Name, detail: S.feature4Detail, icon: Eye, color: inkSoft },
  ];

  const publicTeam = (data.team || []).map(getPublicStaffData);
  const phone = data.phone || '';
  const whatsapp = (data.whatsappPhone || data.phone || '').replace(/\D/g, '');
  const heroImage = NAIL_ART[0].image;
  const studioImage = data.heroImageUrl || 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?q=80&w=1200&auto=format&fit=crop';
  const hours = data.openingHours ? Object.entries(data.openingHours).slice(0, 5) : [['monday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['tuesday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['wednesday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['thursday', { open: true, startTime: '10:00 AM', endTime: '08:00 PM' }], ['friday', { open: true, startTime: '10:00 AM', endTime: '09:00 PM' }]];

  return (
    <div className={`relative shadow-2xl border flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${siteFrameClass(mode, 'rounded-2xl')} ${mode === 'mobile' ? 'rounded-[2rem] border-[8px] site-has-mobile-dock' : ''}`} style={{ borderColor: mode === 'mobile' ? ink : line, backgroundColor: t.page }}>
      {mode !== 'mobile' ? (
        <div className="h-10 flex items-center gap-2 px-4 shrink-0" style={{ backgroundColor: sand, borderBottom: `1px solid ${line}` }}>
          <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff8073]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffd166]" /><span className="w-2.5 h-2.5 rounded-full bg-[#65cf98]" /></div>
          <div className="mx-auto rounded-lg border px-5 py-1 text-[10px] font-mono tracking-wide" style={{ borderColor: line, color: muted, backgroundColor: t.card }}>{data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nailandlash'}.nexora.site</div>
        </div>
      ) : <div className="h-6 w-full flex justify-center items-start shrink-0" style={{ backgroundColor: t.footerBg }}><div className="w-24 h-4 rounded-b-xl" style={{ backgroundColor: '#09070b' }} /></div>}

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar site-scroll" style={{ backgroundColor: cream, color: ink }}>
        <SiteSeo themeId="nail_lash_studio" data={data} mode={mode} />
        <SiteAnnouncementBar themeId="nail_lash_studio" data={data} />
        <SiteHeader themeId="nail_lash_studio" data={data} mode={headerMode} />

        <section id="section-hero" data-site-section="hero" data-section-state="ready" className="site-section relative overflow-hidden px-5 md:px-8 py-8 md:py-12" style={{ backgroundColor: sand }}>
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full" style={{ backgroundColor: pinkSoft }} /><div className="absolute left-1/3 bottom-[-100px] w-48 h-48 rounded-full border-[20px]" style={{ borderColor: `${pink}22` }} />
          <div className="relative z-10 grid md:grid-cols-[0.92fr_1.08fr] gap-8 items-center">
            <div><span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border" style={{ backgroundColor: t.card, borderColor: sandDeep, color: pinkDeep }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pink }} />{S.heroBadge}</span><h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[0.88] tracking-[-0.075em]" style={{ color: ink }}>{S.heroTitle1}<br /><span style={{ color: pink }}>{S.heroTitle2}</span></h1><p className="mt-5 max-w-md text-sm leading-relaxed" style={{ color: muted }}>{data.tagline || S.heroFallbackTagline}</p><div className="flex flex-wrap gap-3 mt-7"><Button href="#section-contact" primary book t={t}>{S.heroPrimaryCta} <ArrowRight className="w-4 h-4" /></Button><Button href="#section-nail-art" t={t}>{S.heroSecondaryCta} <Camera className="w-4 h-4" /></Button></div><div className="flex flex-wrap gap-x-5 gap-y-2 mt-7 text-[9px] font-extrabold uppercase tracking-[0.12em]" style={{ color: ink }}><span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" style={{ color: pink }} /> {S.heroChip1}</span><span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" style={{ color: pink }} /> {S.heroChip2}</span></div></div>
            <div className="relative min-h-[285px] md:min-h-[350px]"><div className="absolute right-0 top-0 w-[78%] h-[86%] rounded-[2rem] overflow-hidden rotate-3" style={{ backgroundColor: pink }}><img src={heroImage} alt="Glamorous nail art detail" className="w-full h-full object-cover opacity-90" /></div><div className="absolute left-0 bottom-0 w-[58%] h-[65%] rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl -rotate-6" style={{ backgroundColor: nude }}><img src={LASH_BROW[0].image} alt="Lash beauty detail" className="w-full h-full object-cover" /></div><div className="absolute right-2 bottom-5 rounded-2xl px-3 py-2.5 shadow-xl border" style={{ borderColor: line, backgroundColor: t.card }}><p className="text-[8px] uppercase tracking-[0.16em] font-extrabold" style={{ color: pinkDeep }}>{S.heroCardEyebrow}</p><p className="text-xs font-extrabold mt-1" style={{ color: ink }}>{S.heroCardTitle}</p></div><div className="absolute left-[-5px] top-8 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white" style={{ backgroundColor: pink, color: '#ffffff' }}><Sparkles className="w-5 h-5" /></div></div>
          </div>
        </section>

        <section {...sectionProps('trust', 'ready')} className="site-section px-5 md:px-8 py-10" style={{ backgroundColor: sand }}>
          <div className="text-center max-w-xl mx-auto">
            <SectionTitle eyebrow={S.trustEyebrow} title={S.trustTitle} center t={t} />
            <div className={`grid gap-3 mt-7 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 1 })}`}>
              {[{ v: S.trust1Value, l: S.trust1Label }, { v: S.trust2Value, l: S.trust2Label }, { v: S.trust3Value, l: S.trust3Label }].map((stat) => (
                <div key={stat.l} className="rounded-2xl border p-4 min-w-0" style={{ borderColor: line, backgroundColor: t.card }}>
                  <p className="text-2xl font-extrabold" style={{ color: pinkDeep }}>{stat.v}</p>
                  <p className="text-[8px] uppercase tracking-[0.12em] font-bold mt-1" style={{ color: muted }}>{stat.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section {...sectionProps('featured', featuredState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: cream }}>
          <div className="flex items-end justify-between gap-4 mb-7"><SectionTitle eyebrow={S.featuredEyebrow} title={S.featuredTitle} body={S.featuredBody} t={t} /><span className="hidden md:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.16em]" style={{ color: pinkDeep, backgroundColor: pinkSoft }}>{S.featuredChip}</span></div>
          <div className={`grid gap-3 ${siteGrid(mode, { desktop: 4, tablet: 2, mobile: 2 })}`}>{FEATURED.map((item) => { const Icon = item.icon; const darkCard = item.color === inkSoft; return <a href="#section-contact" key={item.name} className="group rounded-[1.5rem] p-4 min-h-[170px] border flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: line, backgroundColor: darkCard ? t.artBand : white }}><div className="flex items-center justify-between"><span className="text-[9px] font-extrabold" style={{ color: darkCard ? pinkGlow : pinkDeep }}>{item.number}</span><Icon className="w-5 h-5" style={{ color: darkCard ? pink : item.color }} /></div><div><h3 className="text-sm font-extrabold" style={{ color: darkCard ? '#ffffff' : ink }}>{item.name}</h3><p className="text-[9px] leading-relaxed mt-1" style={{ color: darkCard ? 'rgba(255,255,255,0.6)' : muted }}>{item.detail}</p><span className="inline-flex items-center gap-1 mt-4 text-[8px] font-extrabold uppercase tracking-[0.15em]" style={{ color: darkCard ? pinkGlow : pinkDeep }}>{S.exploreLabel} <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /></span></div></a>; })}</div>
        </section>

        {/* Owner service records — kept visually aligned with the existing
            editorial theme while exposing Phase 9.1 prices and promotions. */}
        <section {...sectionProps('services', servicesState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          {servicesState !== 'ready' && <SectionStatePanel status={servicesState} copy={X} palette={palette} emptyTitle={S.servicesEmpty} />}
          {servicesState === 'ready' && (<>
            <SectionTitle eyebrow={S.menuEyebrow} title={S.menuTitle} body={S.menuBody} t={t} />
            <div className={`grid gap-3 mt-8 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
              {data.services.filter((service) => service.status !== 'inactive' && service.status !== 'archived').map((service) => {
                const shown = displayService(service, locale);
                return (
                <article key={service.id} className="rounded-[1.5rem] border p-4 flex items-start justify-between gap-4 min-w-0" style={{ borderColor: line, backgroundColor: cream }}>
                  {shown.imageUrl && <img src={shown.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold break-words" style={{ color: ink }}>{shown.name}</h3>
                    <p className="text-[9px] uppercase tracking-[0.14em] font-bold mt-1" style={{ color: pinkDeep }}>{translateCategory(shown.category, locale)} · {service.duration} {S['common.minutes']}</p>
                    <p className="text-[10px] leading-relaxed mt-2 line-clamp-2 break-words" style={{ color: muted }}>{shown.description}</p>
                  </div>
                  <ServicePrice service={service} offers={data.offers} style={{ color: pinkDeep }} compact dark={appearance === 'dark'} />
                </article>
                );
              })}
            </div>
            </>)}
        </section>

        <section {...sectionProps('offers', offersState, 'section-service-menu')} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: cream }}>
          <SectionTitle eyebrow={S.menuEyebrow} title={S.menuTitle} t={t} />
          {offersState === 'ready' ? (
            <div className="mt-8 space-y-3">
              {data.packages.filter((bundle) => bundle.status !== 'inactive' && bundle.status !== 'archived').map((bundle) => (
                <article key={bundle.id} className="rounded-[1.5rem] border p-5 flex items-center justify-between gap-4 min-w-0" style={{ borderColor: pink, backgroundColor: pinkSoft }}>
                  <div className="min-w-0"><h3 className="text-sm font-extrabold break-words" style={{ color: ink }}>{bundle.name}</h3><p className="text-[10px] mt-1 break-words" style={{ color: muted }}>{bundle.includedServices?.map((item) => item.name).join(' + ') || bundle.description}</p></div>
                  <BundlePrice bundle={bundle} offers={data.offers} style={{ color: pinkDeep }} dark={appearance === 'dark'} />
                </article>
              ))}
            </div>
          ) : <div className="mt-6"><SectionStatePanel status={offersState} copy={X} palette={palette} emptyTitle={S.offersEmpty} /></div>}
        </section>

        {/* Nail Art Showcase */}
        <section id="section-nail-art" className="px-5 md:px-8 py-12" style={{ backgroundColor: t.artBand }}><div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8"><SectionTitle eyebrow={S.nailArtEyebrow} title={S.nailArtTitle} body={S.nailArtBody} light t={t} /><a href="#section-contact" data-open-booking="true" onClick={(e) => { e.preventDefault(); openSiteBooking(); }} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.18em] self-start" style={{ backgroundColor: pink, color: '#ffffff' }}>{S.startYourSet} <ArrowRight className="w-3.5 h-3.5" /></a></div><div className={`grid gap-3 ${siteGrid(mode, { desktop: 3, tablet: 2, mobile: 2 })}`}>{NAIL_ART.map((item, index) => <ImageShowcaseCard key={item.name} item={item} index={index} />)}</div></section>

        {/* Gel / Acrylic Showcase */}
        <section id="section-gel-acrylic" className="px-5 md:px-8 py-12" style={{ backgroundColor: sand }}><div className="grid md:grid-cols-[0.82fr_1.18fr] gap-8 items-center"><div><SectionTitle eyebrow={S.gelEyebrow} title={S.gelTitle} body={S.gelBody} t={t} /><div className="flex flex-wrap gap-2 mt-6"><span className="rounded-full px-3 py-2 text-[9px] font-extrabold" style={{ backgroundColor: t.card, color: pinkDeep }}>{S.gelChip1}</span><span className="rounded-full px-3 py-2 text-[9px] font-extrabold" style={{ backgroundColor: t.card, color: pinkDeep }}>{S.gelChip2}</span><span className="rounded-full px-3 py-2 text-[9px] font-extrabold" style={{ backgroundColor: t.card, color: pinkDeep }}>{S.gelChip3}</span></div></div><div className="grid gap-2 grid-cols-2 md:grid-cols-3">{GEL_ACRYLIC.map((item, index) => <ImageShowcaseCard key={item.name} item={item} index={index} compact />)}</div></div></section>

        {/* Manicure / Pedicure */}
        <section id="section-mani-pedi" className="px-5 md:px-8 py-12" style={{ backgroundColor: cream }}><div className="text-center mb-8"><SectionTitle eyebrow={S.maniEyebrow} title={S.maniTitle} body={S.maniBody} center t={t} /></div><div className="grid md:grid-cols-2 gap-4"><article className="relative min-h-[255px] rounded-[2rem] overflow-hidden group"><img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1100&auto=format&fit=crop" alt="Manicure detail" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#211b24]/90 to-transparent" /><div className="absolute left-5 right-5 bottom-5"><span className="text-[9px] font-extrabold uppercase tracking-[0.24em]" style={{ color: pinkGlow }}>{S.maniCard1Eyebrow}</span><h3 className="text-2xl font-extrabold text-white mt-2">{S.maniCard1Title}</h3><p className="text-[10px] mt-2 text-white/65 max-w-xs">{S.maniCard1Body}</p></div></article><article className="relative min-h-[255px] rounded-[2rem] overflow-hidden group"><img src="https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1100&auto=format&fit=crop" alt="Pedicure detail" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#211b24]/90 to-transparent" /><div className="absolute left-5 right-5 bottom-5"><span className="text-[9px] font-extrabold uppercase tracking-[0.24em]" style={{ color: pinkGlow }}>{S.maniCard2Eyebrow}</span><h3 className="text-2xl font-extrabold text-white mt-2">{S.maniCard2Title}</h3><p className="text-[10px] mt-2 text-white/65 max-w-xs">{S.maniCard2Body}</p></div></article></div></section>

        {/* Lash & Brow */}
        <section id="section-lash-brow" className="px-5 md:px-8 py-12" style={{ backgroundColor: pinkSoft }}><div className="grid md:grid-cols-[1fr_1.2fr] gap-8 items-center"><div><SectionTitle eyebrow={S.lashEyebrow} title={S.lashTitle} body={S.lashBody} t={t} /><div className="mt-6 rounded-2xl p-4 border" style={{ borderColor: line, backgroundColor: t.card }}><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.artBand, color: pink }}><Eye className="w-4 h-4" /></span><div><p className="text-xs font-extrabold" style={{ color: ink }}>{S.lashNoteTitle}</p><p className="text-[9px] mt-1" style={{ color: muted }}>{S.lashNoteBody}</p></div></div></div></div><div className="grid gap-2 grid-cols-2 md:grid-cols-3">{LASH_BROW.map((item, index) => <ImageShowcaseCard key={item.name} item={item} index={index} compact />)}</div></div></section>

        {/* Gallery */}
        <section {...sectionProps('gallery', galleryState)} className="px-5 md:px-8 py-12" style={{ backgroundColor: white }}><div className="flex items-end justify-between gap-4 mb-7"><SectionTitle eyebrow={S.galleryEyebrow} title={S.galleryTitle} body={S.galleryBody} t={t} /><a href={data.socialProfiles?.instagram || '#section-gallery'} className="hidden md:inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color: pinkDeep }}>{S.followTheEdit} <Instagram className="w-4 h-4" /></a></div><div className={`grid gap-3 ${siteGrid(mode, { desktop: 5, tablet: 3, mobile: 2 })}`}>{GALLERY_IMAGES.map((item, index) => { const label = [S.gallery1, S.gallery2, S.gallery3, S.gallery4, S.gallery5][index] || S.gallery1; return <div key={item.alt} className={`${mode === 'desktop' && index === 0 ? 'md:row-span-2 min-h-[300px]' : 'min-h-[145px]'} relative rounded-[1.25rem] overflow-hidden group`}><img src={item.image} alt={item.alt} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#211b24]/75 to-transparent" /><span className="absolute left-3 bottom-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white">{label}</span></div>; })}</div></section>


        <SiteSocialFeed themeId="nail_lash_studio" data={data} mode={mode} />

        {/* About Studio */}
        <section {...sectionProps('about', aboutState)} className="px-5 md:px-8 py-12" style={{ backgroundColor: sand }}><div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center"><div className="relative min-h-[275px]"><div className="absolute left-3 right-3 top-3 bottom-[-8px] rounded-[2rem] rotate-3" style={{ backgroundColor: pink }} /><img src={studioImage} alt="Inside the Nail & Lash Studio" className="relative w-full h-[275px] object-cover rounded-[2rem] border-4 border-white shadow-xl -rotate-2" /><div className="absolute left-[-5px] top-10 rounded-2xl px-3 py-2.5 shadow-lg border" style={{ borderColor: line, backgroundColor: t.card }}><Award className="w-4 h-4" style={{ color: pink }} /><p className="text-[9px] font-extrabold mt-1" style={{ color: ink }}>{S.aboutBadge1}<br />{S.aboutBadge2}</p></div></div><div><SectionTitle eyebrow={S.aboutEyebrow} title={S.aboutTitle} body={data.about || S.aboutFallbackBody} t={t} /><div className="grid gap-2 grid-cols-2 md:grid-cols-3 mt-7">{[{ value: '01', label: S.aboutStat1Label }, { value: '∞', label: S.aboutStat2Label }, { value: '5★', label: S.aboutStat3Label }].map((stat) => <div key={stat.label} className="rounded-2xl p-3 border" style={{ borderColor: line, backgroundColor: t.card }}><p className="text-xl font-extrabold" style={{ color: pinkDeep }}>{stat.value}</p><p className="text-[8px] uppercase tracking-[0.12em] font-bold mt-1" style={{ color: muted }}>{stat.label}</p></div>)}</div></div></div></section>


        <section {...sectionProps('owner', ownerState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          {ownerState === 'ready' ? (
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4" style={{ borderColor: pinkSoft }}>
                <OwnerAvatar photoUrl={data.ownerPhotoUrl} name={data.ownerName} className="w-full h-full text-3xl" alt="Founder" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color: pinkDeep }}>{data.ownerRole || S.ownerEmptyTitle}</p>
                <h3 className="text-2xl font-extrabold mt-1 break-words" style={{ color: ink }}>{data.ownerName}</h3>
                <p className="text-xs mt-2" style={{ color: muted }}>{data.reviewedContent?.ownerIntro || data.about || S.aboutFallbackBody}</p>
              </div>
            </div>
          ) : <SectionStatePanel status={ownerState} copy={X} palette={palette} emptyTitle={S.ownerEmptyTitle} emptyBody={S.ownerEmptyBody} />}
        </section>

        {/* Team */}
        <section {...sectionProps('team', teamState)} className="px-5 md:px-8 py-12" style={{ backgroundColor: cream }}><div className="flex items-end justify-between gap-4 mb-7"><SectionTitle eyebrow={S.teamEyebrow} title={S.teamTitle} body={S.teamSubtitle} t={t} /><BadgeCheck className="hidden md:block w-8 h-8" style={{ color: pink }} /></div>{teamState !== 'ready' ? <SectionStatePanel status={teamState} copy={X} palette={palette} emptyTitle={S.teamEmptyTitle} emptyBody={S.teamEmptyBody} /> : publicTeam.length > 0 ? <div className={`grid gap-3 ${siteGrid(mode, { desktop: 3, tablet: 2, mobile: 2 })}`}>{publicTeam.slice(0, 6).map((member) => <TeamCard key={member.id} member={member} t={t} />)}</div> : <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: sandDeep, backgroundColor: sand }}><Users className="w-8 h-8 mx-auto" style={{ color: pinkDeep }} /><p className="text-sm font-extrabold mt-3" style={{ color: ink }}>{S.teamEmptyTitle}</p><p className="text-xs mt-1" style={{ color: muted }}>{S.teamEmptyBody}</p></div>}</section>

        <SiteReviews themeId="nail_lash_studio" data={data} mode={mode} />

        {/* Contact */}
        <section {...sectionProps('location', locationState, 'section-contact')} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: t.bandBg }}><div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8"><div><SectionTitle eyebrow={S.contactEyebrow} title={S.contactTitle} body={S.contactBody} light t={t} /><div className="grid gap-2 grid-cols-2 md:grid-cols-3 mt-7"><ContactAction href={`tel:${phone}`} icon={Phone} t={t}>{S.call}</ContactAction><ContactAction href={whatsapp ? `https://wa.me/${whatsapp}` : '#section-contact'} icon={MessageCircle} t={t}>{S['common.whatsApp']}</ContactAction><ContactAction href="#section-contact" icon={CalendarDays} primary t={t}>{S.bookOnline}</ContactAction></div></div><div className="rounded-[1.75rem] p-5 md:p-6" style={{ backgroundColor: 'rgba(33,27,36,0.9)' }}><div className="grid sm:grid-cols-2 gap-5"><div><h3 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: pinkGlow }} /> {S.visitTheEdit}</h3><p className="text-xs leading-relaxed mt-3 text-white/65">{data.address?.fullAddress || 'Your studio address will appear here.'}</p><a href="#section-contact" className="inline-flex items-center gap-1.5 mt-4 text-[9px] font-extrabold text-white">{S['common.getDirections']} <Navigation className="w-3.5 h-3.5" /></a></div><div><h3 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white flex items-center gap-2"><Clock3 className="w-4 h-4" style={{ color: pinkGlow }} /> {S.studioHours}</h3><div className="mt-3"><SiteSalonStatus themeId="nail_lash_studio" data={data} placement="contact" inverted /></div><div className="space-y-2 mt-3">{hours.map(([day, schedule]) => <div key={day} className="flex justify-between gap-2 text-[9px] border-b pb-1.5 text-white/65" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span>{dayLabel(day as string, locale)}</span><span>{schedule.open ? `${schedule.startTime} – ${schedule.endTime}` : S['common.closed']}</span></div>)}</div></div></div><div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/55" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" style={{ color: pinkGlow }} /> {data.email || 'hello@theglowedit.com'}</span><span>{data.phone || S.contactPhoneFallback}</span></div></div></div></section>

        <FinalBookingCta themeId="nail_lash_studio" data={data} title={S.bookingTitle} body={S.bookingBody} cta={S['struct.bookCta']} palette={palette} />
        <SiteFooter themeId="nail_lash_studio" data={data} />
        {mode === 'mobile' && (
          <>
            <div className="site-mobile-action-bar-spacer" aria-hidden />
            <div className="site-mobile-dock-spacer" aria-hidden />
          </>
        )}
      </div>
      <SiteFloatingActions themeId="nail_lash_studio" data={data} mode={mode} />
      <SiteMobileActionBar themeId="nail_lash_studio" data={data} mode={mode} />
      <SiteBookingHost themeId="nail_lash_studio" data={data} />
    </div>
  );
}
