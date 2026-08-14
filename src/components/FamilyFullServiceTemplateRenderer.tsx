import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SalonData, Service, ServiceOffer } from '../types';
import { getPublicStaffData } from '../types';
import SiteHeader, { useSiteLocale, useThemeAppearance } from './SiteHeader';
import OwnerAvatar from './OwnerAvatar';
import { BundlePrice, ServicePrice } from './PromotionalPricing';
import { FinalBookingCta, SectionStatePanel, structureCopyFrom } from './SiteSectionStates';
import SiteFooter from './SiteFooter';
import SiteFloatingActions from './SiteFloatingActions';
import SiteMobileActionBar from './SiteMobileActionBar';
import SiteBookingHost from './SiteBookingHost';
import SiteSeo from './SiteSeo';
import { setActiveTheme, markPerformance } from '../lib/sitePerformance';
import SiteAnnouncementBar from './SiteAnnouncementBar';
import FamilyHero from './heroes/FamilyHero';
import SiteSalonStatus from './SiteSalonStatus';
import SiteReviews from './SiteReviews';
import SiteSocialFeed from './SiteSocialFeed';
import { openSiteBooking, salonMapsHref } from '../lib/siteBooking';
import { displayService } from '../lib/displayService';
import { FAMILY_SURFACES, surfacesOf } from '../lib/themeSurfaces';
import type { FamilySurface } from '../lib/themeSurfaces';
import { dayLabel, siteText } from '../lib/siteI18n';
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
  Baby,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HeartHandshake,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Package as PackageIcon,
  Phone,
  Scissors,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  UserRound,
  Users,
} from 'lucide-react';

/**
 * FULL-SERVICE FAMILY SALON — independent visual renderer (Theme ID:
 * family_full_service).
 *
 * Presentation renderer: it reads the owner's salon data and the family
 * catalogue, but does not create records or persist state. Empty menu areas
 * remain honest when the owner has not configured services yet.
 *
 * PHASE 10.2: surfaces come from FAMILY_SURFACES (light = the bright sky/
 * white design, dark = night-sky navy); all customer-facing copy flows from
 * the global siteText() table (family namespace) in English / हिन्दी.
 */
interface Props {
  data: SalonData;
  mode: ViewportMode;
}

const PREVIEW_GALLERY_BASE = [
  {
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop',
    alt: 'Bright family salon interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=900&auto=format&fit=crop',
    alt: 'Salon tools ready for a family appointment',
  },
  {
    url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=900&auto=format&fit=crop',
    alt: 'Fresh salon hairstyle',
  },
  {
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=900&auto=format&fit=crop',
    alt: 'Stylist working in a modern salon',
  },
];

type FocusItem = { label: string; icon: typeof Scissors };

function getServiceGroups(data: SalonData) {
  const services = data.services || [];
  const isMen = (service: Service) => /men|beard|groom|shave|barber|fade|executive/i.test(`${service.name} ${service.category}`);
  const isKids = (service: Service) => /kid|child|teen|junior/i.test(`${service.name} ${service.category}`);

  return {
    men: services.filter(isMen),
    kids: services.filter(isKids),
    women: services.filter((service) => !isMen(service) && !isKids(service)),
    combos: data.packages || [],
  };
}

function SectionIntro({
  eyebrow,
  title,
  body,
  align = 'left',
  light = false,
  t,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
  light?: boolean;
  t: FamilySurface;
}) {
  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-xl`}>
      <span
        className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.24em]"
        style={{ color: light ? t.skyDeep : t.tealDeep }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: light ? t.sun : t.teal }} />
        {eyebrow}
      </span>
      <h2
        className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight tracking-[-0.03em]"
        style={{ color: light ? '#ffffff' : t.heading }}
      >
        {title}
      </h2>
      {body && (
        <p className="mt-3 text-xs md:text-sm leading-relaxed" style={{ color: light ? 'rgba(255,255,255,0.72)' : t.muted }}>
          {body}
        </p>
      )}
    </div>
  );
}

function FocusStrip({ items, light = false, t }: { items: readonly FocusItem[]; light?: boolean; t: FamilySurface }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-7">
      {items.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border px-3 py-3 min-h-[82px] flex flex-col justify-between"
          style={{
            borderColor: light ? 'rgba(255,255,255,0.18)' : t.line,
            backgroundColor: light ? 'rgba(255,255,255,0.08)' : t.card,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: light ? t.sun : t.blue }} />
          <span className="text-[10px] font-bold leading-tight" style={{ color: light ? '#ffffff' : t.ink }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ServiceRow({ service, offers = [], dark = false, t, minsLabel }: { service: Service; offers?: ServiceOffer[]; dark?: boolean; key?: string; t: FamilySurface; minsLabel: string }) {
  // Live locale: re-renders when the header Language control switches EN/हिन्दी.
  const shown = displayService(service, useSiteLocale());
  return (
    <div
      className="flex items-center justify-between gap-4 py-4 border-b last:border-b-0 min-w-0"
      style={{ borderColor: dark ? 'rgba(255,255,255,0.14)' : t.line }}
    >
      {shown.iconUrl && <img src={shown.iconUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />}
      <div className="min-w-0">
        <h4 className="text-xs md:text-sm font-extrabold break-words" style={{ color: dark ? '#ffffff' : t.ink }}>
          {shown.name}
        </h4>
        <p className="mt-1 text-[10px] leading-relaxed line-clamp-2 break-words" style={{ color: dark ? 'rgba(255,255,255,0.62)' : t.muted }}>
          {shown.description}
        </p>
      </div>
      <div className="text-right shrink-0">
        <ServicePrice service={service} offers={offers} style={{ color: dark ? t.sun : t.blue }} compact dark={dark} />
        <p className="mt-1 text-[9px] font-semibold" style={{ color: dark ? 'rgba(255,255,255,0.52)' : t.muted }}>
          {service.duration} {minsLabel}
        </p>
      </div>
    </div>
  );
}

function EmptyMenu({
  title,
  body,
  focuses,
  dark = false,
  t,
}: {
  title: string;
  body: string;
  focuses: readonly FocusItem[];
  dark?: boolean;
  t: FamilySurface;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: dark ? 'rgba(255,255,255,0.14)' : t.line,
        backgroundColor: dark ? 'rgba(255,255,255,0.06)' : t.card,
      }}
    >
      <p className="text-xs font-extrabold" style={{ color: dark ? '#ffffff' : t.ink }}>
        {title}
      </p>
      <p className="mt-1 text-[10px] leading-relaxed" style={{ color: dark ? 'rgba(255,255,255,0.58)' : t.muted }}>
        {body}
      </p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {focuses.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl px-2 py-3 text-center border"
            style={{ borderColor: dark ? 'rgba(255,255,255,0.14)' : t.line }}
          >
            <Icon className="w-4 h-4 mx-auto" style={{ color: dark ? t.sun : t.teal }} />
            <span className="block text-[9px] font-bold leading-tight mt-2" style={{ color: dark ? '#ffffff' : t.ink }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type GalleryImageTile = { url: string; alt: string; label: string };

function GalleryTile({
  image,
  index,
  mode,
}: {
  image: GalleryImageTile;
  index: number;
  mode: ViewportMode;
  key?: string;
}) {
  const isWide = mode === 'desktop' && index === 0;
  return (
    <div className={`${isWide ? 'md:col-span-2' : ''} relative overflow-hidden rounded-[1.5rem] min-h-[150px] group`}>
      <img
        src={image.url}
        alt={image.alt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#12385b]/80 via-transparent to-transparent" />
      <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
        <span className="text-[10px] font-extrabold text-white uppercase tracking-[0.16em]">{image.label}</span>
        <Camera className="w-4 h-4 text-white/80" />
      </div>
    </div>
  );
}

function TeamCard({ member, t }: { member: ReturnType<typeof getPublicStaffData>; key?: string; t: FamilySurface }) {
  return (
    <div className="rounded-[1.5rem] border overflow-hidden" style={{ backgroundColor: t.card, borderColor: t.line }}>
      <div className="relative h-36" style={{ backgroundColor: t.skyDeep }}>
        {member.imageUrl ? (
          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: t.blue }}>
            <UserRound className="w-12 h-12" />
          </div>
        )}
        {member.rating && (
          <span className="absolute right-3 top-3 rounded-full px-2 py-1 text-[9px] font-extrabold flex items-center gap-1" style={{ color: t.ink, backgroundColor: t.card }}>
            <Star className="w-3 h-3" style={{ color: '#f2b243', fill: '#f2b243' }} /> {member.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-sm" style={{ color: t.ink }}>{member.name}</h3>
        <p className="text-[10px] font-bold mt-1" style={{ color: t.tealDeep }}>{member.role}</p>
        {member.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {member.specialties.slice(0, 2).map((specialty) => (
              <span key={specialty} className="rounded-full px-2 py-1 text-[9px] font-bold" style={{ backgroundColor: t.sky, color: t.blue }}>
                {specialty}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactButton({ href, icon: Icon, children, primary = false, t }: { href: string; icon: typeof Phone; children: ReactNode; primary?: boolean; t: FamilySurface }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.13em] transition-all hover:-translate-y-0.5"
      style={primary ? { backgroundColor: t.sun, color: '#12385b' } : { backgroundColor: t.card, color: t.ink }}
    >
      <Icon className="w-4 h-4" />
      {children}
    </a>
  );
}

export default function FamilyFullServiceTemplateRenderer({ data, mode }: Props) {
  // Live locale + appearance: re-render when the header controls switch.
  const locale = useSiteLocale();
  const appearance = useThemeAppearance('family_full_service');
  const t = surfacesOf(FAMILY_SURFACES, appearance);
  const { navy, blue, sky, skyDeep, teal, tealDeep, tealSoft, sun, sunSoft, coral, ink, muted, line, white } = t;
  const S = { ...siteText('family_full_service', locale), ...structureText('family_full_service', locale) };
  const X = structureCopyFrom(S);
  const palette = { accent: teal, text: ink, muted, card: t.card, line, invert: '#ffffff' };
  const headerMode = headerModeOf(mode);
  // PHASE 10.12 — performance optimization: clear stale data, marks, memoize
  useEffect(() => {
    setActiveTheme('family_full_service');
    markPerformance('family_full_service-render-start');
    return () => { markPerformance('family_full_service-render-end'); };
  }, []);
  const featured = featuredServices(data.services);

  const MENU_FOCUSES: { men: FocusItem[]; women: FocusItem[]; kids: FocusItem[]; combos: FocusItem[] } = {
    men: [
      { label: S.focusMen1, icon: Scissors },
      { label: S.focusMen2, icon: UserRound },
      { label: S.focusMen3, icon: Sparkles },
    ],
    women: [
      { label: S.focusWomen1, icon: Scissors },
      { label: S.focusWomen2, icon: Sparkles },
      { label: S.focusWomen3, icon: HeartHandshake },
    ],
    kids: [
      { label: S.focusKids1, icon: Scissors },
      { label: S.focusKids2, icon: Smile },
      { label: S.focusKids3, icon: HeartHandshake },
    ],
    combos: [
      { label: S.focusCombos1, icon: Users },
      { label: S.focusCombos2, icon: HeartHandshake },
      { label: S.focusCombos3, icon: Sparkles },
    ],
  };

  const NAV_ITEMS = [
    { id: 'section-men-services', label: S.navMen },
    { id: 'section-women-services', label: S.navWomen },
    { id: 'section-kids', label: S.navKids },
    { id: 'section-combos', label: S.navCombos },
  ];

  const groups = getServiceGroups(data);
  const FALLBACK_GALLERY: GalleryImageTile[] = PREVIEW_GALLERY_BASE.map((img, i) => ({
    ...img,
    label: [S.gallery1, S.gallery2, S.gallery3, S.gallery4][i] || S.gallery1,
  }));
  const gallery: GalleryImageTile[] = data.gallery && data.gallery.length > 0
    ? data.gallery.slice(0, 6).map((image, index) => ({
        url: image.url,
        alt: image.alt || S.galleryDefaultAlt,
        label: image.category || (index === 0 ? S.gallery1 : S.galleryDefaultLabel),
      }))
    : FALLBACK_GALLERY;
  const publicTeam = (data.team || []).map(getPublicStaffData);
  const featuredState = resolveSectionState('featured', featured);
  const servicesState = resolveSectionState('services', data.services);
  const offersState = resolveSectionState('offers', (data.packages || []));
  const galleryState = resolveSectionState('gallery', data.gallery);
  const teamState = resolveSectionState('team', publicTeam);
  const ownerState = resolveSectionState('owner', data.ownerName ? [data.ownerName] : []);
  const aboutState = resolveSectionState('about', [data.about || '1']);
  const locationState = resolveSectionState('location', ['ready']);
  const secondaryImage = gallery[1]?.url || PREVIEW_GALLERY_BASE[1].url;
  const contactPhone = data.phone || '';
  const whatsappPhone = (data.whatsappPhone || data.phone || '').replace(/\D/g, '');
  const hours = data.openingHours
    ? Object.entries(data.openingHours)
    : [['monday', { open: true, startTime: '10:00', endTime: '20:00' }], ['tuesday', { open: true, startTime: '10:00', endTime: '20:00' }], ['wednesday', { open: true, startTime: '10:00', endTime: '20:00' }], ['thursday', { open: true, startTime: '10:00', endTime: '20:00' }]];

  const renderServiceMenu = (items: Service[], focuses: readonly FocusItem[], dark = false) => (
    items.length > 0 ? (
      <div className="rounded-2xl px-5" style={{ backgroundColor: dark ? 'rgba(255,255,255,0.06)' : t.card }}>
        {items.map((service) => <ServiceRow key={service.id} service={service} offers={data.offers} dark={dark} t={t} minsLabel={S['common.minutes']} />)}
      </div>
    ) : (
      <EmptyMenu title={S.emptyMenuTitle} body={S.emptyMenuBody} focuses={focuses} dark={dark} t={t} />
    )
  );

  return (
    <div
      className={`relative shadow-2xl border flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${siteFrameClass(mode, 'rounded-2xl')} ${mode === 'mobile' ? 'rounded-[2rem] border-[8px] site-has-mobile-dock' : ''}`}
      style={{ borderColor: mode === 'mobile' ? '#10243a' : line, backgroundColor: white }}
    >
      {/* Browser / phone chrome (mock chrome — not part of the website) */}
      {mode !== 'mobile' ? (
        <div className="h-10 flex items-center gap-2 px-4 shrink-0" style={{ backgroundColor: appearance === 'dark' ? '#071627' : '#f4f9fc', borderBottom: `1px solid ${line}` }}>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff8073]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd166]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ecb8d]" />
          </div>
          <div className="mx-auto rounded-lg border px-5 py-1 text-[10px] font-mono tracking-wide" style={{ borderColor: line, color: muted, backgroundColor: mode === 'desktop' ? t.card : t.card }}>
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'familysalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start shrink-0" style={{ backgroundColor: navy }}>
          <div className="w-24 h-4 bg-[#071b2e] rounded-b-xl" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar site-scroll" style={{ backgroundColor: t.page, color: ink }}>
        <SiteSeo themeId="family_full_service" data={data} mode={mode} />
        <SiteAnnouncementBar themeId="family_full_service" data={data} />
        <SiteHeader themeId="family_full_service" data={data} mode={headerMode} />

        {/* Hero — PHASE 11.1: bright family action-card hero */}
        <FamilyHero data={data} mode={mode} />

        <section {...sectionProps('trust', 'ready')} className="site-section px-5 md:px-8 py-10" style={{ backgroundColor: t.well }}>
          <div className="text-center max-w-xl mx-auto">
            <SectionIntro eyebrow={S.trustEyebrow} title={S.trustTitle} align="center" t={t} />
            <div className={`grid gap-3 mt-7 ${siteGrid(mode, { desktop: 3, tablet: 3, mobile: 1 })}`}>
              {[{ v: S.trust1Value, l: S.trust1Label }, { v: S.trust2Value, l: S.trust2Label }, { v: S.trust3Value, l: S.trust3Label }].map((stat) => (
                <div key={stat.l} className="rounded-2xl border p-4 min-w-0" style={{ borderColor: line, backgroundColor: t.card }}>
                  <p className="text-2xl font-extrabold" style={{ color: teal }}>{stat.v}</p>
                  <p className="text-[9px] font-bold mt-1" style={{ color: muted }}>{stat.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section {...sectionProps('featured', featuredState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          <SectionIntro eyebrow={S.featuredEyebrow} title={S.featuredTitle} body={S.featuredEmpty} t={t} />
          {featuredState === 'ready' ? (
            <div className={`grid gap-3 mt-7 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
              {featured.map((service) => (
                <div key={service.id} className="rounded-2xl border p-4 min-w-0 flex items-center justify-between gap-3" style={{ borderColor: line, backgroundColor: t.well }}>
                  <p className="text-sm font-extrabold break-words" style={{ color: ink }}>{service.name}</p>
                  <a href="#section-contact" data-open-booking="true" onClick={(e) => { e.preventDefault(); openSiteBooking(); }} className="site-touch shrink-0 rounded-xl px-3 py-2 text-[9px] font-extrabold uppercase" style={{ backgroundColor: teal, color: '#ffffff' }}>{S['common.bookNow']}</a>
                </div>
              ))}
            </div>
          ) : <div className="mt-6"><SectionStatePanel status={featuredState} copy={X} palette={palette} emptyTitle={S.featuredEmpty} /></div>}
        </section>

        <section {...sectionProps('services', servicesState)} className="site-section px-5 md:px-8 py-8" style={{ backgroundColor: white, borderBottom: `1px solid ${line}` }}>
          {servicesState !== 'ready' && <SectionStatePanel status={servicesState} copy={X} palette={palette} emptyTitle={S.servicesEmpty} />}
          {servicesState === 'ready' && (<>
          <div className="flex items-end justify-between gap-4 mb-5">
            <SectionIntro eyebrow={S.servicesEyebrow} title={S.servicesTitle} body={S.servicesSubtitle} t={t} />
            <span className="hidden md:inline-flex rounded-full px-3 py-1.5 text-[9px] font-extrabold" style={{ backgroundColor: sky, color: blue }}>{S.servicesChip}</span>
          </div>
          <div className={`grid gap-2 ${siteGrid(mode, { desktop: 4, tablet: 2, mobile: 2 })}`}>
            {NAV_ITEMS.map(({ id, label }, index) => {
              const Icon = index === 0 ? UserRound : index === 1 ? Sparkles : index === 2 ? Baby : PackageIcon;
              const accent = index === 2 ? coral : index === 3 ? teal : blue;
              return (
                <a key={id} href={`#${id}`} className="group rounded-2xl p-4 border flex items-center justify-between gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: line, backgroundColor: index === 2 ? sunSoft : t.well }}>
                  <span className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18`, color: accent }}><Icon className="w-4 h-4" /></span><span className="text-[10px] font-extrabold" style={{ color: ink }}>{label}</span></span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: accent }} />
                </a>
              );
            })}
          </div>
          </>)}
        </section>

        {/* Men's services */}
        <section id="section-men-services" className="px-5 md:px-8 py-12" style={{ backgroundColor: sky }}>
          <div className="grid md:grid-cols-[0.82fr_1.18fr] gap-7 items-start">
            <div>
              <SectionIntro eyebrow={S.menEyebrow} title={S.menTitle} body={S.menBody} t={t} />
              <FocusStrip items={MENU_FOCUSES.men} t={t} />
              <a href="#section-contact" data-open-booking="true" onClick={(e) => { e.preventDefault(); openSiteBooking(); }} className="inline-flex items-center gap-2 mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: blue }}>{S.menCta} <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
            <div className="rounded-[1.75rem] p-5 md:p-6" style={{ backgroundColor: t.menBand }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/70">{S.menMenuLabel}</span>
                <Scissors className="w-5 h-5" style={{ color: sun }} />
              </div>
              {renderServiceMenu(groups.men, MENU_FOCUSES.men, true)}
            </div>
          </div>
        </section>

        {/* Women's services */}
        <section id="section-women-services" className="px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          <div className="grid md:grid-cols-[1.16fr_0.84fr] gap-7 items-center">
            <div className="rounded-[1.75rem] p-5 md:p-6 border" style={{ borderColor: line, backgroundColor: t.well }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tealDeep }}>{S.womenMenuLabel}</span>
                <Sparkles className="w-5 h-5" style={{ color: coral }} />
              </div>
              {renderServiceMenu(groups.women, MENU_FOCUSES.women)}
            </div>
            <div>
              <SectionIntro eyebrow={S.womenEyebrow} title={S.womenTitle} body={S.womenBody} t={t} />
              <FocusStrip items={MENU_FOCUSES.women} t={t} />
              <a href="#section-contact" data-open-booking="true" onClick={(e) => { e.preventDefault(); openSiteBooking(); }} className="inline-flex items-center gap-2 mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: tealDeep }}>{S.womenCta} <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        </section>

        {/* Kids section */}
        <section id="section-kids" className="px-5 md:px-8 py-12" style={{ backgroundColor: sunSoft }}>
          <div className="relative rounded-[2rem] overflow-hidden p-6 md:p-8" style={{ backgroundColor: appearance === 'dark' ? '#332c1c' : '#fff9e8', border: `1px solid ${sun}` }}>
            <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full border-[18px]" style={{ borderColor: 'rgba(255,209,102,0.36)' }} />
            <div className="relative z-10 grid md:grid-cols-[0.9fr_1.1fr] gap-7 items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ backgroundColor: sun, color: '#12385b' }}><Baby className="w-3.5 h-3.5" /> {S.kidsBadge}</span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em]" style={{ color: t.heading }}>{S.kidsTitle1}<br /><span style={{ color: coral }}>{S.kidsTitle2}</span></h2>
                <p className="mt-3 text-xs leading-relaxed max-w-sm" style={{ color: muted }}>{S.kidsBody}</p>
                <div className="flex items-center gap-2 mt-5 text-[10px] font-extrabold" style={{ color: tealDeep }}><CheckCircle2 className="w-4 h-4" /> {S.kidsNote}</div>
              </div>
              <div>
                {renderServiceMenu(groups.kids, MENU_FOCUSES.kids)}
              </div>
            </div>
          </div>
        </section>

        {/* Combos */}
        <section {...sectionProps('offers', offersState, 'section-combos')} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: t.bandBg }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
            <SectionIntro eyebrow={S.combosEyebrow} title={S.combosTitle} body={S.combosBody} light t={t} />
            <span className="rounded-full px-3 py-1.5 text-[9px] font-extrabold self-start" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: sun }}>{S.combosChip}</span>
          </div>
          {groups.combos.length > 0 ? (
            <div className={`grid gap-3 ${siteGrid(mode, { desktop: 2, tablet: 2, mobile: 1 })}`}>
              {groups.combos.map((combo) => (
                <div key={combo.id} className="rounded-2xl border p-5 flex items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="min-w-0"><div className="flex items-center gap-2"><PackageIcon className="w-4 h-4 shrink-0" style={{ color: sun }} /><h3 className="text-sm font-extrabold text-white truncate">{combo.name}</h3></div><p className="text-[10px] leading-relaxed mt-2 text-white/65 line-clamp-2">{combo.description}</p><p className="text-[9px] mt-3 font-bold text-white/55">{combo.duration} {S['common.minutes']} · {S.comboOneBooking}</p></div>
                  <div className="text-right shrink-0"><BundlePrice bundle={combo} offers={data.offers} style={{ color: sun }} dark /><a href="#section-contact" data-open-booking="true" onClick={(e) => { e.preventDefault(); openSiteBooking(); }} className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white mt-2">{S['common.bookNow']} <ArrowRight className="w-3 h-3" /></a></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMenu title={S.emptyCombosTitle} body={S.emptyMenuBody} focuses={MENU_FOCUSES.combos} dark t={t} />
          )}
        </section>

        {/* Gallery */}
        <section {...sectionProps('gallery', galleryState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: sky }}>
          <div className="flex items-end justify-between gap-4 mb-7"><SectionIntro eyebrow={S.galleryEyebrow} title={S.galleryTitle} body={S.galleryBody} t={t} /><a href={data.socialProfiles?.instagram || '#section-gallery'} className="hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold" style={{ color: blue }}>Instagram <Instagram className="w-3.5 h-3.5" /></a></div>
          <div className={`grid gap-3 ${siteGrid(mode, { desktop: 3, tablet: 2, mobile: 2 })}`}>{gallery.map((image, index) => <GalleryTile key={`${image.url}-${index}`} image={image} index={index} mode={mode} />)}</div>
        </section>

        <SiteSocialFeed themeId="family_full_service" data={data} mode={mode} />

        {/* About */}
        <section {...sectionProps('about', aboutState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: t.well }}>
          <div className="grid md:grid-cols-[0.92fr_1.08fr] gap-8 items-center">
            <div className="relative min-h-[260px]">
              <div className="absolute inset-4 rounded-[2rem] rotate-3" style={{ backgroundColor: tealSoft }} />
              <img src={secondaryImage} alt="Inside the family salon" className="relative w-full h-[260px] object-cover rounded-[2rem] border-4 shadow-lg -rotate-2" style={{ borderColor: t.card }} />
              <div className="absolute -bottom-3 right-0 md:-right-4 rounded-2xl px-4 py-3 shadow-lg border" style={{ borderColor: line, backgroundColor: t.card }}><p className="text-xl font-extrabold" style={{ color: blue }}>{S.aboutBadgeValue}</p><p className="text-[9px] font-bold uppercase tracking-[0.13em]" style={{ color: muted }}>{S.aboutBadgeLabel1}<br />{S.aboutBadgeLabel2}</p></div>
            </div>
            <div>
              <SectionIntro eyebrow={S.aboutEyebrow} title={S.aboutTitle} body={data.about || S.aboutFallbackBody} t={t} />
              <div className="grid grid-cols-3 gap-2 mt-7">
                {[{ value: S.aboutStat1Value, label: S.aboutStat1Label }, { value: S.aboutStat2Value, label: S.aboutStat2Label }, { value: S.aboutStat3Value, label: S.aboutStat3Label }].map((stat) => <div key={stat.label} className="rounded-2xl p-3 border" style={{ borderColor: line, backgroundColor: t.card }}><p className="text-xl font-extrabold" style={{ color: teal }}>{stat.value}</p><p className="text-[9px] font-bold leading-tight mt-1" style={{ color: muted }}>{stat.label}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section {...sectionProps('owner', ownerState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          {ownerState === 'ready' ? (
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4" style={{ borderColor: tealSoft }}>
                <OwnerAvatar photoUrl={data.ownerPhotoUrl} name={data.ownerName} className="w-full h-full text-3xl" alt="Founder" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: tealDeep }}>{data.ownerRole || S.ownerEmptyTitle}</p>
                <h3 className="text-2xl font-extrabold mt-1 break-words" style={{ color: t.heading }}>{data.ownerName}</h3>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: muted }}>{data.reviewedContent?.ownerIntro || data.about || S.aboutFallbackBody}</p>
              </div>
            </div>
          ) : <SectionStatePanel status={ownerState} copy={X} palette={palette} emptyTitle={S.ownerEmptyTitle} emptyBody={S.ownerEmptyBody} />}
        </section>

        {/* Team */}
        <section {...sectionProps('team', teamState)} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          <div className="flex items-end justify-between gap-4 mb-7"><SectionIntro eyebrow={S.teamEyebrow} title={S.teamTitle} body={S.teamBody} t={t} /><BadgeCheck className="hidden md:block w-8 h-8" style={{ color: teal }} /></div>
          {teamState !== 'ready' ? <SectionStatePanel status={teamState} copy={X} palette={palette} emptyTitle={S.teamEmptyTitle} emptyBody={S.teamEmptyBody} /> : publicTeam.length > 0 ? (
            <div className={`grid gap-3 ${siteGrid(mode, { desktop: 3, tablet: 2, mobile: 2 })}`}>{publicTeam.slice(0, 6).map((member) => <TeamCard key={member.id} member={member} t={t} />)}</div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: skyDeep, backgroundColor: sky }}><Users className="w-8 h-8 mx-auto" style={{ color: blue }} /><p className="text-sm font-extrabold mt-3" style={{ color: ink }}>{S.teamEmptyTitle}</p><p className="text-xs mt-1" style={{ color: muted }}>{S.teamEmptyBody}</p></div>
          )}
        </section>

        <SiteReviews themeId="family_full_service" data={data} mode={mode} />

        {/* Contact */}
        <section id="section-contact" data-site-section="location" data-section-state={locationState} className="site-section px-5 md:px-8 py-12" style={{ backgroundColor: t.contactBand }}>
          <div className="grid md:grid-cols-[1fr_1fr] gap-8">
            <div>
              <SectionIntro eyebrow={S.contactEyebrow} title={S.contactTitle} body={S.contactBody} light t={t} />
              <div className="grid grid-cols-3 gap-2 mt-7"><ContactButton href={`tel:${contactPhone}`} icon={Phone} t={t}>{S.contactCall}</ContactButton><ContactButton href={whatsappPhone ? `https://wa.me/${whatsappPhone}` : '#section-contact'} icon={MessageCircle} t={t}>{S['common.whatsApp']}</ContactButton><button type="button" data-open-booking="true" onClick={openSiteBooking} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.13em] transition-all hover:-translate-y-0.5" style={{ backgroundColor: t.sun, color: '#12385b' }}><CalendarDays className="w-4 h-4" />{S.contactBookOnline}</button></div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-[10px] font-bold text-white/75"><span className="flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5" style={{ color: sun }} /> {S.contactNote1}</span><span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" style={{ color: sun }} /> {S.contactNote2}</span></div>
            </div>
            <div className="rounded-[1.75rem] p-5 md:p-6" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: sun }} /> {S.contactVisitLabel}</h3><p className="text-xs leading-relaxed mt-3 text-white/75">{data.address?.fullAddress || 'Your salon address will appear here.'}</p><a data-testid="theme-contact-directions" href={salonMapsHref(data)} target="_blank" rel="noreferrer" className="site-touch inline-flex items-center gap-1.5 mt-4 text-[10px] font-extrabold text-white">{S['common.getDirections']} <Navigation className="w-3.5 h-3.5" /></a></div>
                <div><h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white flex items-center gap-2"><Clock3 className="w-4 h-4" style={{ color: sun }} /> {S.contactHoursLabel}</h3><div className="mt-3"><SiteSalonStatus themeId="family_full_service" data={data} placement="contact" inverted /></div><div className="space-y-2 mt-3">{hours.slice(0, 5).map(([day, schedule]) => <div key={day} className="flex justify-between gap-2 text-[10px] border-b pb-1.5 text-white/75" style={{ borderColor: 'rgba(255,255,255,0.16)' }}><span className="capitalize">{dayLabel(day as string, locale)}</span><span>{schedule.open ? `${schedule.startTime} – ${schedule.endTime}` : S['common.closed']}</span></div>)}</div></div>
              </div>
              <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/70" style={{ borderColor: 'rgba(255,255,255,0.16)' }}><span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" style={{ color: sun }} /> {data.email || 'hello@familysalon.com'}</span><span>{data.phone || S.contactPhoneFallback}</span></div>
            </div>
          </div>
        </section>

        <FinalBookingCta themeId="family_full_service" data={data} title={S.bookingTitle} body={S.bookingBody} cta={S['struct.bookCta']} palette={palette} />
        <SiteFooter themeId="family_full_service" data={data} />
        {mode === 'mobile' && (
          <>
            <div className="site-mobile-action-bar-spacer" aria-hidden />
            <div className="site-mobile-dock-spacer" aria-hidden />
          </>
        )}
      </div>
      <SiteFloatingActions themeId="family_full_service" data={data} mode={mode} />
      <SiteMobileActionBar themeId="family_full_service" data={data} mode={mode} />
      <SiteBookingHost themeId="family_full_service" data={data} />
    </div>
  );
}
