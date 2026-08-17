/**
 * PHASE 20.1 — CUSTOMER ACCOUNT FOUNDATION.
 *
 * ONE customer account surface providing:
 *   - Authenticated customer's real profile from Supabase Auth
 *   - My Bookings listing (reuses existing booking system)
 *   - Navigation structure for future sections (History, Profile, Favorites, Reviews, Loyalty)
 *
 * Key principles:
 *   - Reuses the existing customer/user identity (Supabase Auth)
 *   - Never creates duplicate customer accounts
 *   - Never shows another customer's private data
 *   - Customer must be authenticated to access their account
 *   - Loading, empty, error, and unauthenticated states
 *   - Responsive: Desktop, Tablet, Mobile
 *   - Bilingual: English / Hindi
 *   - Light / Dark mode support
 *
 * NOT implemented in Phase 20.1:
 *   - Booking history (full list)
 *   - Profile editing
 *   - Favorites
 *   - Reviews
 *   - Loyalty/Rewards
 *   - Notifications
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  Heart,
  History,
  Home,
  Loader2,
  LogOut,
  Menu,
  Moon,
  PenLine,
  Star,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { signOut } from '../lib/useAuth';
import { useAuth } from '../lib/useAuth';
import {
  loadCustomerProfile,
  readCustomerBookings,
  getCustomerBookingStats,
  formatBookingDate,
  formatTimestamp,
  customerAccountDeniedMessage,
  customerAccountCanRetry,
  type CustomerAccountAccess,
  type CustomerProfile,
} from '../lib/customerAccount';
import { customerAccountText } from '../lib/customerAccountI18n';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { bookingMoney, bookingServiceNames } from '../lib/bookingManagement';
import { formatCurrency } from '../lib/pricing';
import { formatMinutesLabel, PAYMENT_EVENT } from '../lib/siteBookingPayment';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../lib/locale';
import type { AppLocale } from '../lib/locale';
import { useSiteAppearance, useSiteLocale } from './SiteHeader';
import { SITE_HEADER_THEME_IDS } from '../lib/siteNavigation';

/* ------------------------------------------------------------------ */
/* Palette — light/dark tokens for the account chrome                  */
/* ------------------------------------------------------------------ */

interface AccountPalette {
  shell: string;
  panel: string;
  panelSoft: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
}

const LIGHT: AccountPalette = {
  shell: '#f9f8f6',
  panel: '#ffffff',
  panelSoft: '#fbfafa',
  line: '#e6e3e0',
  text: '#191512',
  muted: '#7c736c',
  accent: '#ac0053',
  accentSoft: 'rgba(172,0,83,0.08)',
  accentText: '#ffffff',
  danger: '#dc2626',
  dangerSoft: 'rgba(220,38,38,0.08)',
  success: '#16a34a',
  successSoft: 'rgba(22,163,74,0.10)',
};

const DARK: AccountPalette = {
  shell: '#131111',
  panel: '#1b1818',
  panelSoft: '#221e1e',
  line: '#332d2d',
  text: '#f6f2f0',
  muted: '#a49b96',
  accent: '#ff5ea1',
  accentSoft: 'rgba(255,94,161,0.14)',
  accentText: '#1a0410',
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.12)',
  success: '#4ade80',
  successSoft: 'rgba(74,222,128,0.12)',
};

function paletteFor(appearance: 'light' | 'dark'): AccountPalette {
  return appearance === 'dark' ? DARK : LIGHT;
}

/* ------------------------------------------------------------------ */
/* Navigation section types                                            */
/* ------------------------------------------------------------------ */

export type CustomerAccountSectionId =
  | 'overview'
  | 'myBookings'
  | 'bookingHistory'
  | 'profile'
  | 'favorites'
  | 'reviews'
  | 'loyalty';

interface AccountNavItem {
  id: CustomerAccountSectionId;
  icon: typeof User;
  labelKey: string;
  badge?: number;
}

const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { id: 'overview', icon: Home, labelKey: 'nav.profile' },
  { id: 'myBookings', icon: CalendarClock, labelKey: 'nav.myBookings' },
  { id: 'bookingHistory', icon: History, labelKey: 'nav.bookingHistory' },
  { id: 'profile', icon: PenLine, labelKey: 'nav.profile' },
  { id: 'favorites', icon: Heart, labelKey: 'nav.favorites' },
  { id: 'reviews', icon: Star, labelKey: 'nav.reviews' },
  { id: 'loyalty', icon: Users, labelKey: 'nav.loyalty' },
];

const DEFAULT_SECTION: CustomerAccountSectionId = 'overview';

/* ------------------------------------------------------------------ */
/* Skeleton components                                                 */
/* ------------------------------------------------------------------ */

function SkeletonBar({ palette }: { palette: AccountPalette }) {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{ backgroundColor: palette.panelSoft }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Loading state                                                       */
/* ------------------------------------------------------------------ */

function CustomerAccountLoading({ palette, label }: { palette: AccountPalette; label: string }) {
  return (
    <div data-testid="customer-account-loading" className="space-y-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: palette.muted }}>
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: palette.accent }} />
        {label}
      </div>
      <div className="space-y-3">
        <SkeletonBar palette={palette} />
        <SkeletonBar palette={palette} />
        <SkeletonBar palette={palette} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error state                                                         */
/* ------------------------------------------------------------------ */

function CustomerAccountError({
  palette,
  title,
  body,
  onRetry,
}: {
  palette: AccountPalette;
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div
      data-testid="customer-account-error"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center rounded-2xl border"
      style={{ backgroundColor: palette.panel, borderColor: palette.line }}
    >
      <AlertCircle className="h-10 w-10" style={{ color: palette.danger }} />
      <div className="space-y-1">
        <p className="text-sm font-bold" style={{ color: palette.text }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: palette.muted }}>
          {body}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          style={{ backgroundColor: palette.accent, color: palette.accentText }}
        >
          {customerAccountText('en', 'state.retry')}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Unauthenticated state                                               */
/* ------------------------------------------------------------------ */

function CustomerAccountUnauthenticated({
  palette,
  label,
  onSignIn,
}: {
  palette: AccountPalette;
  label: string;
  onSignIn?: () => void;
}) {
  const t = (key: string) => customerAccountText('en', key);
  return (
    <div
      data-testid="customer-account-unauthenticated"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center rounded-2xl border"
      style={{ backgroundColor: palette.panel, borderColor: palette.line }}
    >
      <User className="h-10 w-10" style={{ color: palette.muted }} />
      <div className="space-y-1">
        <p className="text-sm font-bold" style={{ color: palette.text }}>
          {t('denied.title')}
        </p>
        <p className="text-xs" style={{ color: palette.muted }}>
          {label}
        </p>
      </div>
      {onSignIn && (
        <button
          type="button"
          onClick={onSignIn}
          className="text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          style={{ backgroundColor: palette.accent, color: palette.accentText }}
        >
          {t('shell.signIn')}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Coming soon placeholder section                                     */
/* ------------------------------------------------------------------ */

function ComingSoonSection({
  palette,
  locale,
  title,
}: {
  palette: AccountPalette;
  locale: AppLocale;
  title?: string;
}) {
  const t = (key: string) => customerAccountText(locale, key);
  return (
    <div
      data-testid="customer-account-coming-soon"
      className="flex flex-col items-center justify-center gap-4 p-12 text-center rounded-2xl border border-dashed"
      style={{ borderColor: palette.line, backgroundColor: palette.panelSoft }}
    >
      <Clock className="h-10 w-10" style={{ color: palette.muted }} />
      <div className="space-y-1">
        <p className="text-sm font-bold" style={{ color: palette.text }}>
          {title ?? t('comingSoon.title')}
        </p>
        <p className="text-xs" style={{ color: palette.muted }}>
          {t('comingSoon.body')}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Booking card                                                        */
/* ------------------------------------------------------------------ */

function BookingCard({
  record,
  palette,
  locale,
  t,
}: {
  record: PaymentRecord;
  palette: AccountPalette;
  locale: AppLocale;
  t: (key: string) => string;
}) {
  const money = bookingMoney(record);
  const names = bookingServiceNames(record);
  const statusKey = `status.${record.bookingStatus}`;
  const payKey = `payment.${record.paymentStatus}`;
  const isTerminal = record.bookingStatus === 'cancelled' || record.bookingStatus === 'failed';

  const statusColor = record.bookingStatus === 'completed' || record.bookingStatus === 'confirmed' || record.bookingStatus === 'pay_at_salon'
    ? palette.success
    : isTerminal
      ? palette.muted
      : palette.accent;

  const statusBg = record.bookingStatus === 'completed' || record.bookingStatus === 'confirmed' || record.bookingStatus === 'pay_at_salon'
    ? palette.successSoft
    : isTerminal
      ? palette.panelSoft
      : palette.accentSoft;

  return (
    <div
      data-testid={`booking-card-${record.bookingId}`}
      data-status={record.bookingStatus}
      className="rounded-xl border p-4 space-y-3 transition-opacity"
      style={{
        backgroundColor: isTerminal ? palette.panelSoft : palette.panel,
        borderColor: isTerminal ? palette.line : palette.line,
        opacity: isTerminal ? 0.8 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-semibold" style={{ color: palette.muted }}>
          {t('field.bookingId')}: <span className="font-bold" style={{ color: palette.text }}>{record.bookingId.slice(0, 12)}…</span>
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: statusBg, color: statusColor }}
        >
          {t(statusKey) || record.bookingStatus}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs" style={{ color: palette.text }}>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 shrink-0" style={{ color: palette.accent }} />
          <span>{formatBookingDate(record.dateKey, locale)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0" style={{ color: palette.accent }} />
          <span>{formatMinutesLabel(record.startMinutes, locale)} – {formatMinutesLabel(record.endMinutes, locale)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="h-3 w-3 shrink-0" style={{ color: palette.accent }} />
          <span className="truncate">{names.join(' + ')}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <CreditCard className="h-3 w-3 shrink-0" style={{ color: palette.accent }} />
          <span>{t('field.total')}: <b>{formatCurrency(money.total)}</b></span>
          <span>· {t('field.advancePaid')}: <b>{formatCurrency(money.advancePaid)}</b></span>
          <span>· {t('field.remaining')}: <b>{formatCurrency(money.remaining)}</b></span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile overview section                                            */
/* ------------------------------------------------------------------ */

function ProfileOverviewSection({
  profile,
  bookings,
  palette,
  locale,
  t,
}: {
  profile: CustomerProfile;
  bookings: PaymentRecord[];
  palette: AccountPalette;
  locale: AppLocale;
  t: (key: string) => string;
}) {
  const stats = getCustomerBookingStats(bookings);

  return (
    <div data-testid="profile-overview" className="space-y-6">
      {/* Profile header card */}
      <div
        className="rounded-2xl border p-6"
        style={{ backgroundColor: palette.panel, borderColor: palette.line }}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center shrink-0 text-xl font-bold"
            style={{ backgroundColor: palette.accentSoft, color: palette.accent }}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-8 w-8" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-lg font-bold truncate" style={{ color: palette.text }}>
              {profile.fullName || t('profile.name') + ': ' + t('profile.notSet')}
            </h2>
            {profile.email && (
              <p className="text-xs truncate" style={{ color: palette.muted }}>
                {profile.email}
              </p>
            )}
            {profile.mobile && (
              <p className="text-xs" style={{ color: palette.muted }}>
                {profile.mobile}
              </p>
            )}
            {profile.createdAt && (
              <p className="text-[10px]" style={{ color: palette.muted }}>
                {t('shell.memberSince')}: {formatTimestamp(profile.createdAt, locale)}
              </p>
            )}
          </div>
        </div>

        {/* Note about profile editing */}
        <div
          className="mt-4 p-3 rounded-xl text-[10px] font-medium"
          style={{ backgroundColor: palette.panelSoft, color: palette.muted }}
        >
          {t('profile.editComing')}
        </div>
      </div>

      {/* Booking stats */}
      <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: palette.panel, borderColor: palette.line }}
      >
        <h3 className="text-sm font-bold mb-4" style={{ color: palette.text }}>
          {t('profile.statsTitle')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: palette.panelSoft }}>
            <p className="text-2xl font-black" style={{ color: palette.accent }}>{stats.total}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: palette.muted }}>
              {t('profile.stats.totalBookings')}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: palette.panelSoft }}>
            <p className="text-2xl font-black" style={{ color: palette.success }}>{stats.completed}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: palette.muted }}>
              {t('profile.stats.completed')}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: palette.panelSoft }}>
            <p className="text-2xl font-black" style={{ color: palette.muted }}>{stats.cancelled}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: palette.muted }}>
              {t('profile.stats.cancelled')}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: palette.panelSoft }}>
            <p className="text-2xl font-black" style={{ color: palette.accent }}>{stats.pending}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: palette.muted }}>
              {t('profile.stats.pending')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* My Bookings section                                                 */
/* ------------------------------------------------------------------ */

function MyBookingsSection({
  bookings,
  palette,
  locale,
  t,
}: {
  bookings: PaymentRecord[];
  palette: AccountPalette;
  locale: AppLocale;
  t: (key: string) => string;
}) {
  // Show only active/upcoming bookings (non-terminal)
  const activeBookings = bookings.filter(
    (b) => b.bookingStatus !== 'cancelled' && b.bookingStatus !== 'failed',
  );
  const recentBookings = bookings.slice(0, 5); // Most recent 5

  if (recentBookings.length === 0) {
    return (
      <div
        data-testid="my-bookings-empty"
        className="flex flex-col items-center justify-center gap-4 p-12 text-center rounded-2xl border border-dashed"
        style={{ borderColor: palette.line, backgroundColor: palette.panelSoft }}
      >
        <Calendar className="h-10 w-10" style={{ color: palette.muted }} />
        <div className="space-y-1">
          <p className="text-sm font-bold" style={{ color: palette.text }}>
            {t('bookings.empty.title')}
          </p>
          <p className="text-xs" style={{ color: palette.muted }}>
            {t('bookings.empty.body')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="my-bookings-list" className="space-y-4">
      {activeBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: palette.text }}>
            {t('nav.myBookings')}
          </h3>
          {activeBookings.map((record) => (
            <BookingCard key={record.id} record={record} palette={palette} locale={locale} t={t} />
          ))}
        </div>
      )}

      {recentBookings.length > 0 && (
        <div className="space-y-3 pt-4 border-t" style={{ borderColor: palette.line }}>
          <h3 className="text-sm font-bold" style={{ color: palette.text }}>
            {t('nav.bookingHistory')}
          </h3>
          {recentBookings.map((record) => (
            <BookingCard key={record.id} record={record} palette={palette} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main CustomerAccount component                                      */
/* ------------------------------------------------------------------ */

export interface CustomerAccountProps {
  /** Whether to show the account panel or be used inline */
  mode?: 'panel' | 'page';
  /** Callback when user wants to sign in (opens auth modal) */
  onSignIn?: () => void;
  /** Callback when sign out completes */
  onSignOut?: () => void;
  /** Force a specific section (default: overview) */
  initialSection?: CustomerAccountSectionId;
}

export default function CustomerAccount({
  mode = 'panel',
  onSignIn,
  onSignOut,
  initialSection,
}: CustomerAccountProps) {
  const [appearance, toggleAppearance] = useSiteAppearance(undefined, 'light');
  const locale = useSiteLocale();
  const palette = paletteFor(appearance);

  const { user } = useAuth();
  const [access, setAccess] = useState<CustomerAccountAccess>({ status: 'loading' });
  const [bookings, setBookings] = useState<PaymentRecord[]>([]);
  const [activeSection, setActiveSection] = useState<CustomerAccountSectionId>(
    initialSection ?? DEFAULT_SECTION,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const t = useCallback(
    (key: string) => customerAccountText(locale, key),
    [locale],
  );

  // Load customer profile
  useEffect(() => {
    let active = true;
    setAccess({ status: 'loading' });

    loadCustomerProfile().then((result) => {
      if (active) setAccess(result);
    });

    return () => {
      active = false;
    };
  }, [user?.id, version]);

  // Load customer bookings
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(PAYMENT_EVENT, bump);
    setBookings(readCustomerBookings());
    return () => window.removeEventListener(PAYMENT_EVENT, bump);
  }, [access.status, version]);

  const handleRetry = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    onSignOut?.();
  }, [onSignOut]);

  const handleNavClick = useCallback((sectionId: CustomerAccountSectionId) => {
    setActiveSection(sectionId);
    setMenuOpen(false);
  }, []);

  // Derive current profile from access
  const profile = access.status === 'authorized' ? access.profile : null;

  const deniedMessage = customerAccountDeniedMessage(access);
  const canRetry = customerAccountCanRetry(access);

  const containerClass = mode === 'page'
    ? 'min-h-screen'
    : '';

  const contentWidthClass = mode === 'page'
    ? 'max-w-4xl mx-auto px-4 py-6'
    : 'p-4 md:p-5';

  // Loading state
  if (access.status === 'loading') {
    return (
      <div
        data-testid="customer-account"
        className={containerClass}
        style={{ backgroundColor: palette.shell }}
      >
        <div className={contentWidthClass}>
          <CustomerAccountLoading palette={palette} label={t('state.loading')} />
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (access.status === 'not-authenticated') {
    return (
      <div
        data-testid="customer-account"
        className={containerClass}
        style={{ backgroundColor: palette.shell }}
      >
        <div className={contentWidthClass}>
          <CustomerAccountUnauthenticated
            palette={palette}
            label={deniedMessage || t('denied.login')}
            onSignIn={onSignIn}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (access.status === 'error' || access.status === 'not-configured') {
    return (
      <div
        data-testid="customer-account"
        className={containerClass}
        style={{ backgroundColor: palette.shell }}
      >
        <div className={contentWidthClass}>
          <CustomerAccountError
            palette={palette}
            title={t('state.error.title')}
            body={deniedMessage || t('state.error.body')}
            onRetry={canRetry ? handleRetry : undefined}
          />
        </div>
      </div>
    );
  }

  // Render section content
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
      case 'profile':
        return profile ? (
          <ProfileOverviewSection
            profile={profile}
            bookings={bookings}
            palette={palette}
            locale={locale}
            t={t}
          />
        ) : (
          <CustomerAccountError
            palette={palette}
            title={t('state.error.title')}
            body={t('state.error.body')}
            onRetry={handleRetry}
          />
        );

      case 'myBookings':
      case 'bookingHistory':
        return (
          <MyBookingsSection
            bookings={bookings}
            palette={palette}
            locale={locale}
            t={t}
          />
        );

      case 'favorites':
      case 'reviews':
      case 'loyalty':
        return (
          <ComingSoonSection
            palette={palette}
            locale={locale}
          />
        );

      default:
        return (
          <ComingSoonSection
            palette={palette}
            locale={locale}
          />
        );
    }
  };

  const activeNavItem = ACCOUNT_NAV_ITEMS.find((item) => item.id === activeSection);
  const sectionTitle = activeNavItem ? t(activeNavItem.labelKey) : t('shell.title');

  return (
    <div
      data-testid="customer-account"
      data-section={activeSection}
      data-appearance={appearance}
      className={containerClass}
      style={{ backgroundColor: palette.shell }}
    >
      {/* Header bar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b backdrop-blur-md"
        style={{ backgroundColor: `${palette.panel}ee`, borderColor: palette.line }}
      >
        {/* Mobile menu button */}
        <button
          type="button"
          data-testid="customer-account-menu-btn"
          aria-expanded={menuOpen}
          aria-label={t('shell.openMenu')}
          className="p-2 rounded-xl transition-colors lg:hidden"
          style={{ backgroundColor: palette.panelSoft, color: palette.text }}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate" style={{ color: palette.text }}>
            {t('shell.title')}
          </h1>
          <p className="text-[10px] truncate" style={{ color: palette.muted }}>
            {profile?.fullName || profile?.email || ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div
            className="flex items-stretch rounded-lg border overflow-hidden"
            style={{ borderColor: palette.line }}
          >
            {SUPPORTED_LOCALES.map((option) => (
              <button
                key={option}
                type="button"
                data-testid={`customer-account-lang-${option}`}
                aria-pressed={locale === option}
                className="px-2 py-1 text-[9px] font-bold uppercase transition-colors"
                style={
                  locale === option
                    ? { backgroundColor: palette.accent, color: palette.accentText }
                    : { backgroundColor: 'transparent', color: palette.muted }
                }
                onClick={() => {
                  // Dispatch locale change event
                  window.dispatchEvent(new CustomEvent('nexora:site-locale', { detail: option }));
                }}
              >
                {option === 'en' ? 'EN' : LOCALE_LABELS[option]}
              </button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button
            type="button"
            data-testid="customer-account-dark-toggle"
            aria-pressed={appearance === 'dark'}
            className="p-2 rounded-xl transition-colors"
            style={{ backgroundColor: palette.panelSoft, color: palette.text }}
            onClick={toggleAppearance}
          >
            {appearance === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Sign out */}
          <button
            type="button"
            data-testid="customer-account-signout"
            className="p-2 rounded-xl transition-colors"
            style={{ backgroundColor: palette.panelSoft, color: palette.danger }}
            onClick={handleSignOut}
            title={t('shell.signOut')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div
          data-testid="customer-account-nav-mobile"
          className="lg:hidden fixed inset-0 top-[60px] z-20 border-t"
          style={{ backgroundColor: `${palette.panel}ee`, borderColor: palette.line }}
        >
          <nav className="p-4 space-y-1">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`customer-account-nav-${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-colors"
                  style={
                    isActive
                      ? { backgroundColor: palette.accentSoft, color: palette.accent }
                      : { backgroundColor: 'transparent', color: palette.text }
                  }
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main content area */}
      <div className="flex">
        {/* Desktop sidebar navigation */}
        <aside
          data-testid="customer-account-nav-desktop"
          className="hidden lg:block w-56 shrink-0 border-r p-4 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto"
          style={{ backgroundColor: palette.panel, borderColor: palette.line }}
        >
          <nav className="space-y-1">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`customer-account-nav-desktop-${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors"
                  style={
                    isActive
                      ? { backgroundColor: palette.accentSoft, color: palette.accent }
                      : { backgroundColor: 'transparent', color: palette.text }
                  }
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t(item.labelKey)}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: palette.accent, color: palette.accentText }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className={contentWidthClass}>
            {/* Section header */}
            <div className="mb-6">
              <h2 className="text-lg font-bold" style={{ color: palette.text }}>
                {sectionTitle}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: palette.muted }}>
                {activeSection === 'overview' || activeSection === 'profile'
                  ? t('profile.subtitle')
                  : activeSection === 'myBookings' || activeSection === 'bookingHistory'
                    ? t('bookings.subtitle')
                    : ''}
              </p>
            </div>

            {/* Section content */}
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
