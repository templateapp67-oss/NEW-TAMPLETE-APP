import type { CSSProperties, ReactNode } from 'react';
import type { SalonData, Service, ServiceOffer } from '../types';
import { getPublicStaffData } from '../types';
import { getSalonNameStyle } from '../lib/brandIdentity';
import { FAMILY_FULL_SERVICE_THEME } from '../lib/themeServices';
import { BundlePrice, ServicePrice } from './PromotionalPricing';
import {
  ArrowRight,
  Baby,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Facebook,
  HeartHandshake,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Package as PackageIcon,
  Phone,
  Quote,
  Scissors,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  UserRound,
  Users,
  Youtube,
} from 'lucide-react';

/**
 * FULL-SERVICE FAMILY SALON — independent visual renderer (Theme ID:
 * family_full_service).
 *
 * Presentation renderer: it reads the owner's salon data and the family
 * catalogue, but does not create records or persist state. Empty menu areas
 * remain honest when the owner has not configured services yet.
 */
interface Props {
  data: SalonData;
  mode: 'desktop' | 'mobile';
}

const {
  navy,
  blue,
  blueBright,
  sky,
  skyDeep,
  teal,
  tealDeep,
  tealSoft,
  sun,
  sunSoft,
  coral,
  ink,
  muted,
  line,
  white,
} = FAMILY_FULL_SERVICE_THEME;

const PREVIEW_GALLERY = [
  {
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop',
    alt: 'Bright family salon interior',
    label: 'A bright welcome',
  },
  {
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=900&auto=format&fit=crop',
    alt: 'Salon tools ready for a family appointment',
    label: 'The little details',
  },
  {
    url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=900&auto=format&fit=crop',
    alt: 'Fresh salon hairstyle',
    label: 'Fresh looks for everyone',
  },
  {
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=900&auto=format&fit=crop',
    alt: 'Stylist working in a modern salon',
    label: 'Made together',
  },
];

const REVIEWS = [
  {
    name: 'Priya & Aarav',
    detail: 'Family visit · Saturday',
    quote: 'We can book everyone in one place without the usual running around. The team is brilliant with our son.',
    initials: 'PA',
    color: blue,
  },
  {
    name: 'Meera Kapoor',
    detail: 'Colour & cut',
    quote: 'The salon feels bright, organised and genuinely welcoming. My colour was exactly what I wanted.',
    initials: 'MK',
    color: teal,
  },
  {
    name: 'Rohan Mehta',
    detail: "Men's grooming",
    quote: 'Fast booking, a sharp cut and friendly service. My whole family now comes here.',
    initials: 'RM',
    color: coral,
  },
];

const NAV_ITEMS = [
  { id: 'section-men-services', label: "Men's" },
  { id: 'section-women-services', label: "Women's" },
  { id: 'section-kids', label: 'Kids' },
  { id: 'section-combos', label: 'Combos' },
] as const;

const MENU_FOCUSES = {
  men: [
    { label: 'Cuts & styling', icon: Scissors },
    { label: 'Beard & shave', icon: UserRound },
    { label: 'Grooming care', icon: Sparkles },
  ],
  women: [
    { label: 'Cuts & colour', icon: Scissors },
    { label: 'Style & finish', icon: Sparkles },
    { label: 'Beauty moments', icon: HeartHandshake },
  ],
  kids: [
    { label: 'First cuts', icon: Scissors },
    { label: 'Fun styles', icon: Smile },
    { label: 'Gentle care', icon: HeartHandshake },
  ],
  combos: [
    { label: 'Family visits', icon: Users },
    { label: 'Pair & save', icon: HeartHandshake },
    { label: 'Celebration ready', icon: Sparkles },
  ],
} as const;

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
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
  light?: boolean;
}) {
  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-xl`}>
      <span
        className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.24em]"
        style={{ color: light ? skyDeep : tealDeep }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: light ? sun : teal }} />
        {eyebrow}
      </span>
      <h2
        className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight tracking-[-0.03em]"
        style={{ color: light ? white : ink }}
      >
        {title}
      </h2>
      {body && (
        <p className="mt-3 text-xs md:text-sm leading-relaxed" style={{ color: light ? 'rgba(255,255,255,0.72)' : muted }}>
          {body}
        </p>
      )}
    </div>
  );
}

function FocusStrip({ items, light = false }: { items: readonly FocusItem[]; light?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-7">
      {items.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border px-3 py-3 min-h-[82px] flex flex-col justify-between"
          style={{
            borderColor: light ? 'rgba(255,255,255,0.18)' : line,
            backgroundColor: light ? 'rgba(255,255,255,0.08)' : white,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: light ? sun : blue }} />
          <span className="text-[10px] font-bold leading-tight" style={{ color: light ? white : ink }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ServiceRow({ service, offers = [], dark = false }: { service: Service; offers?: ServiceOffer[]; dark?: boolean; key?: string }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-4 border-b last:border-b-0"
      style={{ borderColor: dark ? 'rgba(255,255,255,0.14)' : line }}
    >
      <div className="min-w-0">
        <h4 className="text-xs md:text-sm font-extrabold truncate" style={{ color: dark ? white : ink }}>
          {service.name}
        </h4>
        <p className="mt-1 text-[10px] leading-relaxed line-clamp-2" style={{ color: dark ? 'rgba(255,255,255,0.62)' : muted }}>
          {service.description}
        </p>
      </div>
      <div className="text-right shrink-0">
        <ServicePrice service={service} offers={offers} style={{ color: dark ? sun : blue }} compact dark={dark} />
        <p className="mt-1 text-[9px] font-semibold" style={{ color: dark ? 'rgba(255,255,255,0.52)' : muted }}>
          {service.duration} min
        </p>
      </div>
    </div>
  );
}

function EmptyMenu({
  title,
  focuses,
  dark = false,
}: {
  title: string;
  focuses: readonly FocusItem[];
  dark?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: dark ? 'rgba(255,255,255,0.14)' : line,
        backgroundColor: dark ? 'rgba(255,255,255,0.06)' : white,
      }}
    >
      <p className="text-xs font-extrabold" style={{ color: dark ? white : ink }}>
        {title}
      </p>
      <p className="mt-1 text-[10px] leading-relaxed" style={{ color: dark ? 'rgba(255,255,255,0.58)' : muted }}>
        The visual menu is ready. Service details can be added in the next setup phase.
      </p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {focuses.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl px-2 py-3 text-center border"
            style={{ borderColor: dark ? 'rgba(255,255,255,0.14)' : line }}
          >
            <Icon className="w-4 h-4 mx-auto" style={{ color: dark ? sun : teal }} />
            <span className="block text-[9px] font-bold leading-tight mt-2" style={{ color: dark ? white : ink }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryTile({
  image,
  index,
  mode,
}: {
  image: (typeof PREVIEW_GALLERY)[number];
  index: number;
  mode: 'desktop' | 'mobile';
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

function TeamCard({ member }: { member: ReturnType<typeof getPublicStaffData>; key?: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white border overflow-hidden" style={{ borderColor: line }}>
      <div className="relative h-36 bg-[#dff2ff]">
        {member.imageUrl ? (
          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: blue }}>
            <UserRound className="w-12 h-12" />
          </div>
        )}
        {member.rating && (
          <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-1 text-[9px] font-extrabold flex items-center gap-1" style={{ color: ink }}>
            <Star className="w-3 h-3" style={{ color: sun, fill: sun }} /> {member.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-sm" style={{ color: ink }}>{member.name}</h3>
        <p className="text-[10px] font-bold mt-1" style={{ color: tealDeep }}>{member.role}</p>
        {member.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {member.specialties.slice(0, 2).map((specialty) => (
              <span key={specialty} className="rounded-full px-2 py-1 text-[9px] font-bold" style={{ backgroundColor: sky, color: blue }}>
                {specialty}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactButton({ href, icon: Icon, children, primary = false }: { href: string; icon: typeof Phone; children: ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.13em] transition-all hover:-translate-y-0.5"
      style={primary ? { backgroundColor: sun, color: navy } : { backgroundColor: white, color: ink }}
    >
      <Icon className="w-4 h-4" />
      {children}
    </a>
  );
}

export default function FamilyFullServiceTemplateRenderer({ data, mode }: Props) {
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = navy;

  const groups = getServiceGroups(data);
  const gallery = data.gallery && data.gallery.length > 0
    ? data.gallery.slice(0, 6).map((image, index) => ({
        url: image.url,
        alt: image.alt || 'Family salon gallery image',
        label: image.category || (index === 0 ? 'A bright welcome' : 'Salon moments'),
      }))
    : PREVIEW_GALLERY;
  const publicTeam = (data.team || []).map(getPublicStaffData);
  const heroImage = data.heroImageUrl || PREVIEW_GALLERY[0].url;
  const secondaryImage = gallery[1]?.url || PREVIEW_GALLERY[1].url;
  const contactPhone = data.phone || '';
  const whatsappPhone = (data.whatsappPhone || data.phone || '').replace(/\D/g, '');
  const hours = data.openingHours
    ? Object.entries(data.openingHours)
    : [['monday', { open: true, startTime: '10:00', endTime: '20:00' }], ['tuesday', { open: true, startTime: '10:00', endTime: '20:00' }], ['wednesday', { open: true, startTime: '10:00', endTime: '20:00' }], ['thursday', { open: true, startTime: '10:00', endTime: '20:00' }]];

  const renderServiceMenu = (items: Service[], focuses: readonly FocusItem[], dark = false) => (
    items.length > 0 ? (
      <div className="rounded-2xl px-5" style={{ backgroundColor: dark ? 'rgba(255,255,255,0.06)' : white }}>
        {items.map((service) => <ServiceRow key={service.id} service={service} offers={data.offers} dark={dark} />)}
      </div>
    ) : (
      <EmptyMenu title="Your service menu is ready for its first listings." focuses={focuses} dark={dark} />
    )
  );

  return (
    <div
      className={`shadow-2xl border flex flex-col overflow-hidden transition-all duration-500 origin-top mx-auto h-full ${
        mode === 'desktop' ? 'w-full max-w-[980px] rounded-2xl' : 'w-[375px] max-w-full max-h-[812px] rounded-[2rem] border-[8px] border-[#10243a]'
      }`}
      style={{ borderColor: mode === 'desktop' ? line : '#10243a', backgroundColor: white }}
    >
      {/* Browser / phone chrome */}
      {mode === 'desktop' ? (
        <div className="h-10 flex items-center gap-2 px-4 shrink-0" style={{ backgroundColor: '#f4f9fc', borderBottom: `1px solid ${line}` }}>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff8073]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd166]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ecb8d]" />
          </div>
          <div className="mx-auto rounded-lg border bg-white px-5 py-1 text-[10px] font-mono tracking-wide" style={{ borderColor: line, color: muted }}>
            {data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'familysalon'}.nexora.site
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex justify-center items-start shrink-0" style={{ backgroundColor: navy }}>
          <div className="w-24 h-4 bg-[#071b2e] rounded-b-xl" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: white, color: ink }}>
        {/* Utility bar + primary navigation */}
        <div className="px-5 md:px-8 py-2 flex items-center justify-between text-[9px] font-bold" style={{ backgroundColor: navy, color: 'rgba(255,255,255,0.76)' }}>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" style={{ color: sun }} /> Easy bookings for every generation</span>
          <span className="hidden sm:inline">Open 7 days · Walk-ins welcome</span>
        </div>
        <header id="section-header" className="sticky top-0 z-30 px-5 md:px-8 py-4 flex items-center justify-between gap-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.94)', borderBottom: `1px solid ${line}` }}>
          <a href="#section-hero" className="flex items-center gap-2.5 min-w-0">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="h-8 w-auto max-w-[110px] object-contain" />
            ) : (
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tealSoft, color: tealDeep }}>
                <Users className="w-5 h-5" />
              </span>
            )}
            <span className="font-extrabold text-sm md:text-base truncate" style={nameStyle}>{data.salonName || 'The Family Salon'}</span>
          </a>
          {mode === 'desktop' ? (
            <nav className="flex items-center gap-5 text-[10px] font-extrabold" style={{ color: muted }} aria-label="Family salon navigation">
              <a href="#section-about" className="hover:text-[#1769d2] transition-colors">About</a>
              <a href="#section-services" className="hover:text-[#1769d2] transition-colors">Services</a>
              <a href="#section-team" className="hover:text-[#1769d2] transition-colors">Team</a>
              <a href="#section-gallery" className="hover:text-[#1769d2] transition-colors">Gallery</a>
              <a href="#section-contact" className="hover:text-[#1769d2] transition-colors">Contact</a>
              <a href="#section-contact" className="rounded-xl px-4 py-2.5 flex items-center gap-1.5" style={{ backgroundColor: blue, color: white }}>
                Book now <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </nav>
          ) : (
            <a href="#section-contact" className="rounded-lg px-3 py-2 text-[9px] font-extrabold" style={{ backgroundColor: blue, color: white }}>Book</a>
          )}
        </header>

        {/* Hero: split layout with booking-oriented information architecture */}
        <section id="section-hero" className="relative overflow-hidden px-5 md:px-8 py-8 md:py-12" style={{ backgroundColor: sky }}>
          <div className="absolute -right-20 -top-24 w-64 h-64 rounded-full" style={{ backgroundColor: skyDeep, opacity: 0.7 }} />
          <div className="absolute right-24 bottom-[-70px] w-40 h-40 rounded-full border-[18px]" style={{ borderColor: 'rgba(7,159,154,0.12)' }} />
          <div className="relative z-10 grid md:grid-cols-[1.04fr_0.96fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border bg-white/80" style={{ borderColor: skyDeep }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: coral }} />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em]" style={{ color: blue }}>Men · Women · Kids</span>
              </div>
              <h1 className="mt-5 text-4xl md:text-5xl font-extrabold leading-[0.98] tracking-[-0.055em]" style={{ color: navy }}>
                One salon.<br /><span style={{ color: teal }}>Every generation.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed" style={{ color: muted }}>
                {data.tagline || 'One bright place for cuts, colour, grooming and happy family days.'}
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <a href="#section-contact" className="rounded-xl px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: teal, color: white }}>
                  Book a family visit <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#section-services" className="rounded-xl px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] border bg-white transition-colors hover:bg-[#f7fcff]" style={{ borderColor: skyDeep, color: blue }}>
                  See the menu
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold" style={{ color: navy }}>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: teal }} /> Friendly for all ages</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: teal }} /> Easy multi-booking</span>
              </div>
            </div>
            <div className="relative min-h-[270px] md:min-h-[320px]">
              <div className="absolute inset-x-4 top-3 bottom-0 rounded-[2rem] rotate-3" style={{ backgroundColor: teal }} />
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl -rotate-2 bg-[#d9f5f1]">
                <img
                  src={heroImage}
                  alt="A welcoming family salon experience"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: data.heroPosition === 'Top' ? 'center top' : data.heroPosition === 'Bottom' ? 'center bottom' : 'center' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12385b]/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-white">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/70">Your local happy place</p>
                    <p className="text-lg font-extrabold mt-1">Look good. Feel good.</p>
                  </div>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: sun, color: navy }}><Smile className="w-5 h-5" /></span>
                </div>
              </div>
              <div className="absolute -left-2 md:-left-6 top-10 rounded-2xl bg-white px-3 py-2.5 shadow-xl border flex items-center gap-2" style={{ borderColor: line }}>
                <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: sunSoft, color: coral }}><Baby className="w-4 h-4" /></span>
                <div><p className="text-[9px] font-extrabold" style={{ color: ink }}>Kids welcome</p><p className="text-[8px]" style={{ color: muted }}>Fun, gentle visits</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* High-density services navigation */}
        <section id="section-services" className="px-5 md:px-8 py-8" style={{ backgroundColor: white, borderBottom: `1px solid ${line}` }}>
          <div className="flex items-end justify-between gap-4 mb-5">
            <SectionIntro eyebrow="Find your fit" title="A menu made for real life" body="Jump straight to the kind of visit you are planning today." />
            <span className="hidden md:inline-flex rounded-full px-3 py-1.5 text-[9px] font-extrabold" style={{ backgroundColor: sky, color: blue }}>4 ways to visit</span>
          </div>
          <div className={`grid gap-2 ${mode === 'desktop' ? 'grid-cols-4' : 'grid-cols-2'}`}>
            {NAV_ITEMS.map(({ id, label }, index) => {
              const Icon = index === 0 ? UserRound : index === 1 ? Sparkles : index === 2 ? Baby : PackageIcon;
              const accent = index === 2 ? coral : index === 3 ? teal : blue;
              return (
                <a key={id} href={`#${id}`} className="group rounded-2xl p-4 border flex items-center justify-between gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: line, backgroundColor: index === 2 ? sunSoft : '#f8fcff' }}>
                  <span className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18`, color: accent }}><Icon className="w-4 h-4" /></span><span className="text-[10px] font-extrabold" style={{ color: ink }}>{label}</span></span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: accent }} />
                </a>
              );
            })}
          </div>
        </section>

        {/* Men's services */}
        <section id="section-men-services" className="px-5 md:px-8 py-12" style={{ backgroundColor: sky }}>
          <div className="grid md:grid-cols-[0.82fr_1.18fr] gap-7 items-start">
            <div>
              <SectionIntro eyebrow="For him" title="Men's Services" body="Clean cuts, considered grooming and an easy chair-time experience." />
              <FocusStrip items={MENU_FOCUSES.men} />
              <a href="#section-contact" className="inline-flex items-center gap-2 mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: blue }}>Book men's grooming <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
            <div className="rounded-[1.75rem] p-5 md:p-6" style={{ backgroundColor: blue }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/70">The men's menu</span>
                <Scissors className="w-5 h-5" style={{ color: sun }} />
              </div>
              {renderServiceMenu(groups.men, MENU_FOCUSES.men, true)}
            </div>
          </div>
        </section>

        {/* Women's services */}
        <section id="section-women-services" className="px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          <div className="grid md:grid-cols-[1.16fr_0.84fr] gap-7 items-center">
            <div className="rounded-[1.75rem] p-5 md:p-6 border" style={{ borderColor: line, backgroundColor: '#fbfeff' }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tealDeep }}>The women's menu</span>
                <Sparkles className="w-5 h-5" style={{ color: coral }} />
              </div>
              {renderServiceMenu(groups.women, MENU_FOCUSES.women)}
            </div>
            <div>
              <SectionIntro eyebrow="For her" title="Women's Services" body="From everyday polish to occasion-ready beauty, with the time and attention you deserve." />
              <FocusStrip items={MENU_FOCUSES.women} />
              <a href="#section-contact" className="inline-flex items-center gap-2 mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: tealDeep }}>Plan your appointment <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        </section>

        {/* Kids section */}
        <section id="section-kids" className="px-5 md:px-8 py-12" style={{ backgroundColor: sunSoft }}>
          <div className="relative rounded-[2rem] overflow-hidden p-6 md:p-8" style={{ backgroundColor: '#fff9e8', border: `1px solid ${sun}` }}>
            <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full border-[18px]" style={{ borderColor: 'rgba(255,209,102,0.36)' }} />
            <div className="relative z-10 grid md:grid-cols-[0.9fr_1.1fr] gap-7 items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ backgroundColor: sun, color: navy }}><Baby className="w-3.5 h-3.5" /> Little guests</span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em]" style={{ color: navy }}>Kids deserve a<br /><span style={{ color: coral }}>happy salon day.</span></h2>
                <p className="mt-3 text-xs leading-relaxed max-w-sm" style={{ color: muted }}>Patient stylists, quick visits and a little more fun for first cuts, school trims and special-day styles.</p>
                <div className="flex items-center gap-2 mt-5 text-[10px] font-extrabold" style={{ color: tealDeep }}><CheckCircle2 className="w-4 h-4" /> Gentle, friendly and fuss-free</div>
              </div>
              <div>
                {renderServiceMenu(groups.kids, MENU_FOCUSES.kids)}
              </div>
            </div>
          </div>
        </section>

        {/* Combos */}
        <section id="section-combos" className="px-5 md:px-8 py-12" style={{ backgroundColor: navy }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
            <SectionIntro eyebrow="Make a day of it" title="Combos for the whole crew" body="Simple ways to line up multiple appointments and leave feeling ready for whatever is next." light />
            <span className="rounded-full px-3 py-1.5 text-[9px] font-extrabold self-start" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: sun }}>Save time · Share the day</span>
          </div>
          {groups.combos.length > 0 ? (
            <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {groups.combos.map((combo) => (
                <div key={combo.id} className="rounded-2xl border p-5 flex items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="min-w-0"><div className="flex items-center gap-2"><PackageIcon className="w-4 h-4 shrink-0" style={{ color: sun }} /><h3 className="text-sm font-extrabold text-white truncate">{combo.name}</h3></div><p className="text-[10px] leading-relaxed mt-2 text-white/65 line-clamp-2">{combo.description}</p><p className="text-[9px] mt-3 font-bold text-white/55">{combo.duration} min · One easy booking</p></div>
                  <div className="text-right shrink-0"><BundlePrice bundle={combo} offers={data.offers} style={{ color: sun }} dark /><a href="#section-contact" className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white mt-2">Book <ArrowRight className="w-3 h-3" /></a></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMenu title="Combo cards will appear here when packages are added." focuses={MENU_FOCUSES.combos} dark />
          )}
        </section>

        {/* About */}
        <section id="section-about" className="px-5 md:px-8 py-12" style={{ backgroundColor: '#f8fcff' }}>
          <div className="grid md:grid-cols-[0.92fr_1.08fr] gap-8 items-center">
            <div className="relative min-h-[260px]">
              <div className="absolute inset-4 rounded-[2rem] rotate-3" style={{ backgroundColor: tealSoft }} />
              <img src={secondaryImage} alt="Inside the family salon" className="relative w-full h-[260px] object-cover rounded-[2rem] border-4 border-white shadow-lg -rotate-2" />
              <div className="absolute -bottom-3 right-0 md:-right-4 rounded-2xl px-4 py-3 shadow-lg bg-white border" style={{ borderColor: line }}><p className="text-xl font-extrabold" style={{ color: blue }}>01</p><p className="text-[9px] font-bold uppercase tracking-[0.13em]" style={{ color: muted }}>place for<br />everyone</p></div>
            </div>
            <div>
              <SectionIntro eyebrow="Why families choose us" title="One easy visit. A lot more happy." body={data.about || 'We bring professional salon care, an easy-going atmosphere and thoughtful service together under one bright roof. Come as you are, leave feeling like yourself — only fresher.'} />
              <div className="grid grid-cols-3 gap-2 mt-7">
                {[{ value: 'All', label: 'ages welcome' }, { value: '1', label: 'easy booking' }, { value: '100%', label: 'good energy' }].map((stat) => <div key={stat.label} className="rounded-2xl p-3 border bg-white" style={{ borderColor: line }}><p className="text-xl font-extrabold" style={{ color: teal }}>{stat.value}</p><p className="text-[9px] font-bold leading-tight mt-1" style={{ color: muted }}>{stat.label}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section id="section-team" className="px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          <div className="flex items-end justify-between gap-4 mb-7"><SectionIntro eyebrow="The people behind the welcome" title="Meet your salon team" body="Friendly experts who know how to make every appointment feel easy." /><BadgeCheck className="hidden md:block w-8 h-8" style={{ color: teal }} /></div>
          {publicTeam.length > 0 ? (
            <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>{publicTeam.slice(0, 6).map((member) => <TeamCard key={member.id} member={member} />)}</div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: skyDeep, backgroundColor: sky }}><Users className="w-8 h-8 mx-auto" style={{ color: blue }} /><p className="text-sm font-extrabold mt-3" style={{ color: ink }}>Your friendly team will appear here</p><p className="text-xs mt-1" style={{ color: muted }}>Add team profiles in the setup flow to introduce everyone.</p></div>
          )}
        </section>

        {/* Gallery */}
        <section id="section-gallery" className="px-5 md:px-8 py-12" style={{ backgroundColor: sky }}>
          <div className="flex items-end justify-between gap-4 mb-7"><SectionIntro eyebrow="Come on in" title="A salon full of good energy" body="A peek at the bright space, thoughtful details and fresh-look moments." /><a href={data.socialProfiles?.instagram || '#section-gallery'} className="hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold" style={{ color: blue }}>Instagram <Instagram className="w-3.5 h-3.5" /></a></div>
          <div className={`grid gap-3 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'}`}>{gallery.map((image, index) => <GalleryTile key={`${image.url}-${index}`} image={image} index={index} mode={mode} />)}</div>
        </section>

        {/* Testimonials */}
        <section id="section-testimonials" className="px-5 md:px-8 py-12" style={{ backgroundColor: white }}>
          <SectionIntro eyebrow="Kind words" title="Loved by the whole family" body="The little things add up to a salon people want to come back to." align="center" />
          <div className={`grid gap-3 mt-8 ${mode === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'}`}>{REVIEWS.map((review) => <article key={review.name} className="rounded-[1.5rem] border p-5 flex flex-col" style={{ borderColor: line, backgroundColor: '#fbfeff' }}><div className="flex items-center justify-between"><div className="flex gap-0.5">{[0, 1, 2, 3, 4].map((star) => <Star key={star} className="w-3.5 h-3.5" style={{ color: sun, fill: sun }} />)}</div><Quote className="w-5 h-5" style={{ color: review.color }} /></div><p className="text-xs leading-relaxed mt-4 flex-1" style={{ color: ink }}>“{review.quote}”</p><div className="flex items-center gap-2 mt-5 pt-3 border-t" style={{ borderColor: line }}><span className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white" style={{ backgroundColor: review.color }}>{review.initials}</span><div><p className="text-[10px] font-extrabold" style={{ color: ink }}>{review.name}</p><p className="text-[9px] mt-0.5" style={{ color: muted }}>{review.detail}</p></div></div></article>)}</div>
        </section>

        {/* Contact */}
        <section id="section-contact" className="px-5 md:px-8 py-12" style={{ backgroundColor: teal }}>
          <div className="grid md:grid-cols-[1fr_1fr] gap-8">
            <div>
              <SectionIntro eyebrow="Let's make a plan" title="Ready when your family is" body="Choose the easiest way to reach us and we will help you find the right time for everyone." light />
              <div className="grid grid-cols-3 gap-2 mt-7"><ContactButton href={`tel:${contactPhone}`} icon={Phone}>Call</ContactButton><ContactButton href={whatsappPhone ? `https://wa.me/${whatsappPhone}` : '#section-contact'} icon={MessageCircle}>WhatsApp</ContactButton><ContactButton href="#section-contact" icon={CalendarDays} primary>Book online</ContactButton></div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-[10px] font-bold text-white/75"><span className="flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5" style={{ color: sun }} /> Family-friendly chairs</span><span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" style={{ color: sun }} /> Easy, secure booking</span></div>
            </div>
            <div className="rounded-[1.75rem] p-5 md:p-6" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: sun }} /> Visit us</h3><p className="text-xs leading-relaxed mt-3 text-white/75">{data.address?.fullAddress || 'Your salon address will appear here.'}</p><a href="#section-contact" className="inline-flex items-center gap-1.5 mt-4 text-[10px] font-extrabold text-white">Get directions <Navigation className="w-3.5 h-3.5" /></a></div>
                <div><h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white flex items-center gap-2"><Clock3 className="w-4 h-4" style={{ color: sun }} /> Hours</h3><div className="space-y-2 mt-3">{hours.slice(0, 5).map(([day, schedule]) => <div key={day} className="flex justify-between gap-2 text-[10px] border-b pb-1.5 text-white/75" style={{ borderColor: 'rgba(255,255,255,0.16)' }}><span className="capitalize">{day}</span><span>{schedule.open ? `${schedule.startTime} – ${schedule.endTime}` : 'Closed'}</span></div>)}</div></div>
              </div>
              <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/70" style={{ borderColor: 'rgba(255,255,255,0.16)' }}><span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" style={{ color: sun }} /> {data.email || 'hello@familysalon.com'}</span><span>{data.phone || 'Call for availability'}</span></div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="section-footer" className="px-5 md:px-8 py-8" style={{ backgroundColor: navy }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: teal }}><Users className="w-4 h-4 text-white" /></span><p className="font-extrabold text-sm" style={nameStyle}>{data.salonName || 'The Family Salon'}</p></div><p className="text-[10px] mt-3 text-white/55 max-w-xs">{data.tagline || 'One bright place for the whole family.'}</p></div><div className="flex items-center gap-3 text-white/65"><a href={data.socialProfiles?.instagram || '#section-footer'} aria-label="Instagram"><Instagram className="w-4 h-4 hover:text-white" /></a><a href={data.socialProfiles?.facebook || '#section-footer'} aria-label="Facebook"><Facebook className="w-4 h-4 hover:text-white" /></a><a href={data.socialProfiles?.youtube || '#section-footer'} aria-label="YouTube"><Youtube className="w-4 h-4 hover:text-white" /></a></div></div>
          <div className="mt-7 pt-4 border-t flex flex-col sm:flex-row justify-between gap-2 text-[9px] uppercase tracking-[0.16em] text-white/40" style={{ borderColor: 'rgba(255,255,255,0.13)' }}><span>© 2026 {data.salonName || 'Salon'}</span><span>Powered by Nexora Platform</span></div>
        </footer>
      </div>
    </div>
  );
}
