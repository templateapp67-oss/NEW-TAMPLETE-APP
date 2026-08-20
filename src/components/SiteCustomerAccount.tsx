/**
 * PHASE 20.1 — CUSTOMER ACCOUNT FOUNDATION · public-site slide-over panel.
 *
 * PHASE 20.2 — MY BOOKINGS & BOOKING HISTORY inside the account panel.
 * Shows THIS browser's own bookings grouped into Upcoming / Past /
 * Cancelled. Reuses the EXISTING booking record store — no invented
 * data, no duplicate booking system.
 *
 * PHASE 20.3 — clicking a booking opens the dedicated Booking Details +
 * Receipt view (`SiteBookingDetails`), which resolves the booking through
 * the secure own-rows-only read and reuses the existing confirmation
 * panel. Back returns to My Bookings; Close returns to the website.
 *
 * Mounted inside each theme renderer alongside `SiteBookingHost`.
 * Opened/closed via the header "My Account" button (window events).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Heart,
  LifeBuoy,
  Mail,
  Phone,
  Sparkles,
  Star,
  User,
  X,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import {
  CUSTOMER_ACCOUNT_CLOSE_EVENT,
  CUSTOMER_ACCOUNT_EVENT,
  closeCustomerAccount,
  readCustomerAccountInfo,
  readGroupedCustomerBookings,
  groupCustomerBookings,
  customerBookingServiceNames,
} from '../lib/siteCustomerAccount';
import type { CustomerAccountInfo, BookingGroup, GroupedBookings } from '../lib/siteCustomerAccount';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { bookingFlowText } from '../lib/siteBookingI18n';
import { openSiteBooking } from '../lib/siteBooking';
import { PAYMENT_EVENT, formatMinutesLabel } from '../lib/siteBookingPayment';
import { CUSTOMER_PROFILE_EVENT } from '../lib/siteCustomerProfile';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import { THEME_LABELS } from '../lib/themeServices';
import SiteBookingDetails from './SiteBookingDetails';
import SiteCustomerProfile from './SiteCustomerProfile';
import SiteFavorites from './SiteFavorites';
import SiteMyReviews from './SiteMyReviews';
import SiteReviewForm from './SiteReviewForm';
import SiteNotifications from './SiteNotifications';
import SiteHelpCenter from './SiteHelpCenter';
import { CUSTOMER_NOTIFICATION_EVENT } from '../lib/siteCustomerNotifications';
import { readCustomerBooking } from '../lib/siteCustomerAccount';
import { findMyReviewForBooking, REVIEW_EVENT } from '../lib/siteReviews';
import type { CustomerReview } from '../lib/siteReviews';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  bookingSalonIdCandidate,
  bookingTemplateKeyCandidate,
  readMySupabaseBookings,
  SUPABASE_BOOKING_EVENT,
} from '../lib/supabaseBooking';
import { useAuth } from '../lib/useAuth';

interface Props {
  themeId: SiteHeaderThemeId;
  data?: SalonData;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Localized date label from a YYYY-MM-DD key. */
function dateLabel(dateKey: string, locale: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(
    locale === 'hi' ? 'hi-IN' : 'en-IN',
    { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
  );
}

/** Human-readable salon name for a booking record. */
function bookingSalonName(record: PaymentRecord): string {
  return THEME_LABELS[record.themeId] || record.themeId || record.businessId;
}

/** Status chip label. */
function statusLabel(record: PaymentRecord, locale: string): string {
  if (record.bookingStatus === 'cancelled') return locale === 'hi' ? 'रद्द' : 'Cancelled';
  if (record.bookingStatus === 'failed') return locale === 'hi' ? 'विफल' : 'Failed';
  if (record.bookingStatus === 'completed') return locale === 'hi' ? 'पूर्ण' : 'Completed';
  if (record.bookingStatus === 'pay_at_salon') return locale === 'hi' ? 'पक्की' : 'Confirmed';
  if (record.bookingStatus === 'confirmed') return locale === 'hi' ? 'पक्की' : 'Confirmed';
  if (record.bookingStatus === 'pending_payment') return locale === 'hi' ? 'लंबित' : 'Pending';
  return record.bookingStatus;
}

function statusColor(record: PaymentRecord, s: ReturnType<typeof bookingSurfaces>): string {
  if (record.bookingStatus === 'cancelled' || record.bookingStatus === 'failed') return s.danger;
  if (record.bookingStatus === 'completed') return s.success;
  if (record.bookingStatus === 'confirmed' || record.bookingStatus === 'pay_at_salon') return s.accent;
  return s.muted;
}

function statusBgColor(record: PaymentRecord, s: ReturnType<typeof bookingSurfaces>): string {
  if (record.bookingStatus === 'cancelled' || record.bookingStatus === 'failed') return s.chip;
  if (record.bookingStatus === 'completed') return s.successSoft;
  if (record.bookingStatus === 'confirmed' || record.bookingStatus === 'pay_at_salon') return s.accentSoft;
  return s.chip;
}

function groupLabel(group: BookingGroup, locale: string): string {
  if (group === 'upcoming') return locale === 'hi' ? 'आगामी' : 'Upcoming';
  if (group === 'past') return locale === 'hi' ? 'पिछली' : 'Past';
  return locale === 'hi' ? 'रद्द' : 'Cancelled';
}

/* ------------------------------------------------------------------ */
/* Booking list row — click opens the dedicated details view (20.3)    */
/* ------------------------------------------------------------------ */

function BookingListCard({
  record,
  s,
  locale,
  onOpen,
}: {
  record: PaymentRecord;
  s: ReturnType<typeof bookingSurfaces>;
  locale: string;
  onOpen: (bookingId: string) => void;
  key?: string;
}) {
  const names = customerBookingServiceNames(record);
  const statusCol = statusColor(record, s);
  const statusBg = statusBgColor(record, s);
  const isTerminal = record.bookingStatus === 'cancelled' || record.bookingStatus === 'failed';

  return (
    <button
      type="button"
      data-testid={`account-booking-${record.bookingId}`}
      data-status={record.bookingStatus}
      onClick={() => onOpen(record.bookingId)}
      aria-label={`${record.bookingId} — ${names.join(' + ')}`}
      className="w-full flex items-start gap-3 p-3 text-left border rounded-xl cursor-pointer transition-colors hover:opacity-90"
      style={{
        borderColor: s.line,
        backgroundColor: s.card,
        color: s.text,
        opacity: isTerminal ? 0.75 : 1,
      }}
    >
      {/* Status indicator bar */}
      <span
        className="w-1.5 shrink-0 rounded-full self-stretch"
        style={{ backgroundColor: statusCol }}
        aria-hidden="true"
      />

      <span className="flex-1 min-w-0 space-y-1">
        {/* Row 1: booking id + status chip */}
        <span className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold" style={{ color: s.muted }}>
            {record.bookingId}
          </span>
          <span
            className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: statusBg, color: statusCol }}
          >
            {statusLabel(record, locale)}
          </span>
        </span>

        {/* Row 2: service names */}
        <span className="block text-xs font-bold truncate" style={{ color: s.textStrong }}>
          {names.join(' + ')}
        </span>

        {/* Row 3: date + time */}
        <span className="flex items-center gap-2 text-[10px] font-semibold flex-wrap" style={{ color: s.muted }}>
          {dateLabel(record.dateKey, locale)}
          <span>·</span>
          <span>
            {formatMinutesLabel(record.startMinutes, locale as any)}
            {' – '}
            {formatMinutesLabel(record.endMinutes, locale as any)}
          </span>
        </span>

        {/* Row 4: salon */}
        <span className="flex items-center gap-1 text-[9px] font-semibold truncate" style={{ color: s.muted }}>
          <Sparkles className="w-3 h-3 shrink-0" style={{ color: s.accent }} />
          {bookingSalonName(record)}
        </span>
      </span>

      <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: s.muted }} aria-hidden="true" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function SiteCustomerAccount({ themeId, data }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const T = bookingFlowText(locale);

  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [databaseBookings, setDatabaseBookings] = useState<PaymentRecord[]>([]);
  const [databaseBookingsState, setDatabaseBookingsState] = useState<'loading' | 'error' | 'ready'>(
    isSupabaseConfigured ? 'loading' : 'ready',
  );
  const { user, loading: authLoading } = useAuth();
  const liveSalonId = useMemo(
    () => data
      ? bookingSalonIdCandidate(
          data,
          (data.services || []).find((service) => service.businessId) || data.services?.[0],
        )
      : null,
    [data],
  );
  const bookingTemplateKey = useMemo(
    () => bookingTemplateKeyCandidate(data || {}, themeId),
    [data, themeId],
  );
  const [activeGroup, setActiveGroup] = useState<BookingGroup>('upcoming');
  // PHASE 20.3 — the booking whose details/receipt view is open (null = home).
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  // PHASE 20.5 — the My Profile sub-view.
  const [profileOpen, setProfileOpen] = useState(false);
  // PHASE 20.6 — the Saved Salons sub-view.
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  // PHASE 20.7 — success note shown on the home view.
  const [successNote, setSuccessNote] = useState<string | null>(null);
  // PHASE 20.7 — My Reviews sub-view + the review form opened from it.
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewTargetBookingId, setReviewTargetBookingId] = useState<string | null>(null);
  // PHASE 20.8 — Notifications sub-view.
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // PHASE 20.9 — Help & Support sub-view.
  const [helpOpen, setHelpOpen] = useState(false);

  // Re-read account info
  const accountInfo: CustomerAccountInfo = useMemo(
    () => readCustomerAccountInfo(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, open],
  );
  const visibleAccountInfo: CustomerAccountInfo = useMemo(() => {
    if (!isSupabaseConfigured) return accountInfo;
    const metadata = user?.user_metadata || {};
    const metadataName = [metadata.full_name, metadata.name, metadata.display_name]
      .find((value) => typeof value === 'string' && value.trim());
    return {
      ...accountInfo,
      recognized: !!user,
      name: typeof metadataName === 'string' ? metadataName.trim() : (user?.email || ''),
      mobile: user?.phone || '',
      email: user?.email || '',
    };
  }, [accountInfo, user]);

  // Group bookings for display
  const grouped: GroupedBookings = useMemo(
    () => isSupabaseConfigured
      ? groupCustomerBookings(databaseBookings)
      : readGroupedCustomerBookings(),
    [version, open, databaseBookings],
  );
  const totalBookingCount = grouped.upcoming.length + grouped.past.length + grouped.cancelled.length;
  const visibleBookings: PaymentRecord[] = useMemo(
    () => grouped[activeGroup],
    [grouped, activeGroup],
  );
  const selectedBooking = useMemo(
    () => selectedBookingId
      ? (isSupabaseConfigured
          ? databaseBookings.find((record) => record.bookingId === selectedBookingId) || null
          : readCustomerBooking(selectedBookingId))
      : null,
    [selectedBookingId, databaseBookings, version],
  );

  // Listen for open/close events
  useEffect(() => {
    const show = () => {
      setOpen(true);
      setSelectedBookingId(null); // start at the booking list each time
      setProfileOpen(false);
      setFavoritesOpen(false);
      setReviewsOpen(false);
      setReviewTargetBookingId(null);
      setNotificationsOpen(false);
      setHelpOpen(false);
    };
    const hide = () => {
      setOpen(false);
      setSelectedBookingId(null);
      setProfileOpen(false);
      setFavoritesOpen(false);
      setReviewsOpen(false);
      setReviewTargetBookingId(null);
      setNotificationsOpen(false);
      setHelpOpen(false);
    };
    window.addEventListener(CUSTOMER_ACCOUNT_EVENT, show);
    window.addEventListener(CUSTOMER_ACCOUNT_CLOSE_EVENT, hide);
    return () => {
      window.removeEventListener(CUSTOMER_ACCOUNT_EVENT, show);
      window.removeEventListener(CUSTOMER_ACCOUNT_CLOSE_EVENT, hide);
    };
  }, []);

  // Refresh when payment records / profile / reviews change
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(PAYMENT_EVENT, bump);
    window.addEventListener(SUPABASE_BOOKING_EVENT, bump);
    window.addEventListener(CUSTOMER_PROFILE_EVENT, bump);
    window.addEventListener(REVIEW_EVENT, bump);
    window.addEventListener(CUSTOMER_NOTIFICATION_EVENT, bump);
    return () => {
      window.removeEventListener(PAYMENT_EVENT, bump);
      window.removeEventListener(SUPABASE_BOOKING_EVENT, bump);
      window.removeEventListener(CUSTOMER_PROFILE_EVENT, bump);
      window.removeEventListener(REVIEW_EVENT, bump);
      window.removeEventListener(CUSTOMER_NOTIFICATION_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !open) return;
    if (authLoading) {
      setDatabaseBookingsState('loading');
      return;
    }
    if (!user || !liveSalonId) {
      setDatabaseBookings([]);
      setDatabaseBookingsState('ready');
      return;
    }
    let active = true;
    setDatabaseBookingsState('loading');
    void readMySupabaseBookings(liveSalonId, themeId, bookingTemplateKey)
      .then((records) => {
        if (!active) return;
        setDatabaseBookings(records);
        setDatabaseBookingsState('ready');
      })
      .catch(() => {
        if (!active) return;
        setDatabaseBookings([]);
        setDatabaseBookingsState('error');
      });
    return () => { active = false; };
  }, [open, authLoading, user?.id, liveSalonId, themeId, bookingTemplateKey, version]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCustomerAccount();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Prevent background scroll while panel is open
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const handleBookAppointment = useCallback(() => {
    closeCustomerAccount();
    openSiteBooking();
  }, []);

  const openBooking = useCallback((bookingId: string) => {
    setProfileOpen(false);
    setFavoritesOpen(false);
    setReviewsOpen(false);
    setNotificationsOpen(false);
    setHelpOpen(false);
    setSelectedBookingId(bookingId);
  }, []);

  const backToBookings = useCallback(() => {
    setSelectedBookingId(null);
  }, []);

  const openProfile = useCallback(() => {
    setSelectedBookingId(null);
    setFavoritesOpen(false);
    setProfileOpen(true);
  }, []);

  const openFavorites = useCallback(() => {
    setSelectedBookingId(null);
    setProfileOpen(false);
    setFavoritesOpen(true);
  }, []);

  const backToHome = useCallback(() => {
    setProfileOpen(false);
    setFavoritesOpen(false);
    setReviewsOpen(false);
    setReviewTargetBookingId(null);
    setNotificationsOpen(false);
    setHelpOpen(false);
  }, []);

  const openNotifications = useCallback(() => {
    setSelectedBookingId(null);
    setProfileOpen(false);
    setFavoritesOpen(false);
    setReviewsOpen(false);
    setHelpOpen(false);
    setNotificationsOpen(true);
  }, []);

  const openHelp = useCallback(() => {
    setSelectedBookingId(null);
    setProfileOpen(false);
    setFavoritesOpen(false);
    setReviewsOpen(false);
    setNotificationsOpen(false);
    setHelpOpen(true);
  }, []);

  const openReviews = useCallback(() => {
    setSelectedBookingId(null);
    setProfileOpen(false);
    setFavoritesOpen(false);
    setReviewsOpen(true);
  }, []);

  const editReview = useCallback((review: CustomerReview) => {
    const booking = readCustomerBooking(review.bookingId);
    if (booking) setReviewTargetBookingId(booking.bookingId);
  }, []);

  const viewSalon = useCallback(() => {
    closeCustomerAccount();
  }, []);

  if (!open) return null;

  const groups: BookingGroup[] = ['upcoming', 'past', 'cancelled'];
  const inDetails = selectedBookingId !== null;
  const inProfile = profileOpen && !inDetails;
  const inFavorites = favoritesOpen && !inDetails && !inProfile;
  const inReviews = reviewsOpen && !inDetails && !inProfile && !inFavorites;
  const inReviewForm = reviewTargetBookingId != null && !inDetails && !inProfile && !inFavorites && !inReviews;
  const inNotifications = notificationsOpen && !inDetails && !inProfile && !inFavorites && !inReviews && !inReviewForm;
  const inHelp = helpOpen && !inDetails && !inProfile && !inFavorites && !inReviews && !inReviewForm && !inNotifications;

  return (
    <AnimatePresence>
      <div
        data-testid="customer-account"
        data-view={inDetails ? 'details' : inProfile ? 'profile' : inFavorites ? 'favorites' : inReviews ? 'reviews' : inReviewForm ? 'review-form' : inNotifications ? 'notifications' : inHelp ? 'help' : 'home'}
        className="fixed inset-0 z-[80] flex"
        role="dialog"
        aria-modal="true"
        aria-label={locale === 'hi' ? 'मेरा खाता' : 'My Account'}
      >
        {/* Backdrop */}
        <motion.div
          key="account-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={closeCustomerAccount}
          aria-hidden="true"
        />

        {/* Panel */}
        <motion.div
          key="account-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-sm shadow-2xl flex flex-col overflow-hidden"
          style={{ backgroundColor: s.page, color: s.text }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — hidden while a sub-view owns the top of the panel */}
          {!inDetails && !inProfile && !inFavorites && !inReviews && !inReviewForm && !inNotifications && !inHelp && (
            <div
              className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b"
              style={{ backgroundColor: s.card, borderColor: s.line }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0"
                  style={{
                    backgroundColor: visibleAccountInfo.recognized ? s.accent : s.chip,
                    color: visibleAccountInfo.recognized ? s.accentText : s.muted,
                  }}
                >
                  {accountInfo.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: s.textStrong }}>
                    {visibleAccountInfo.recognized ? visibleAccountInfo.name : (locale === 'hi' ? 'अतिथि' : 'Guest')}
                  </p>
                  <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
                    {locale === 'hi' ? 'मेरा खाता' : 'My Account'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="customer-account-close"
                onClick={closeCustomerAccount}
                aria-label={locale === 'hi' ? 'बंद करें' : 'Close'}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: s.muted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 flex flex-col gap-4">
            {inDetails ? (
              /* PHASE 20.3 — dedicated Booking Details + Receipt view. */
              <SiteBookingDetails
                themeId={themeId}
                data={data}
                bookingId={selectedBookingId as string}
                persistedRecord={selectedBooking}
                onBack={backToBookings}
                onClose={closeCustomerAccount}
                onViewSalon={viewSalon}
              />
            ) : inProfile ? (
              /* PHASE 20.5 — My Profile (view + edit). */
              <SiteCustomerProfile
                themeId={themeId}
                data={data}
                onBack={backToHome}
                onClose={closeCustomerAccount}
              />
            ) : inFavorites ? (
              /* PHASE 20.6 — Saved Salons. */
              <SiteFavorites
                themeId={themeId}
                data={data}
                onBack={backToHome}
                onClose={closeCustomerAccount}
                onViewSalon={viewSalon}
              />
            ) : inReviews ? (
              /* PHASE 20.7 — My Reviews. */
              <SiteMyReviews
                themeId={themeId}
                data={data}
                onBack={backToHome}
                onClose={closeCustomerAccount}
                onViewSalon={viewSalon}
                onEdit={editReview}
              />
            ) : inNotifications ? (
              /* PHASE 20.8 — Notifications. */
              <SiteNotifications
                themeId={themeId}
                data={data}
                onBack={backToHome}
                onClose={closeCustomerAccount}
                onOpenBooking={openBooking}
              />
            ) : inHelp ? (
              /* PHASE 20.9 — Help & Support. */
              <SiteHelpCenter
                themeId={themeId}
                data={data}
                onBack={backToHome}
                onClose={closeCustomerAccount}
                onViewSalon={viewSalon}
              />
            ) : inReviewForm ? (
              /* PHASE 20.7 — edit an existing review from My Reviews. */
              (() => {
                const targetBooking: PaymentRecord | null = readCustomerBooking(reviewTargetBookingId as string);
                if (!targetBooking) return null;
                const review = findMyReviewForBooking(targetBooking.businessId, targetBooking.themeId, targetBooking.bookingId);
                return (
                  <SiteReviewForm
                    themeId={themeId}
                    data={data}
                    booking={targetBooking}
                    existingReview={review}
                    onBack={backToHome}
                    onClose={closeCustomerAccount}
                    onDone={(message) => {
                      setReviewTargetBookingId(null);
                      setSuccessNote(message);
                      setVersion((v) => v + 1);
                    }}
                  />
                );
              })()
            ) : (
              <>
                {successNote && (
                  <div
                    data-testid="customer-account-success"
                    className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold"
                    style={{ backgroundColor: s.successSoft, borderColor: s.success, color: s.success }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successNote}</span>
                  </div>
                )}

                {/* Identity Card */}
                {visibleAccountInfo.recognized && (
                  <div
                    className="p-4 border rounded-xl space-y-2"
                    style={{ backgroundColor: s.card, borderColor: s.line }}
                  >
                    <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: s.muted }}>
                      {locale === 'hi' ? 'आपकी जानकारी' : 'Your Information'}
                    </h3>
                    {visibleAccountInfo.name && (
                      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: s.text }}>
                        <User className="w-3.5 h-3.5 shrink-0" style={{ color: s.accent }} />
                        <span>{visibleAccountInfo.name}</span>
                      </div>
                    )}
                    {visibleAccountInfo.mobile && (
                      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: s.text }}>
                        <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: s.accent }} />
                        <span>{visibleAccountInfo.mobile}</span>
                      </div>
                    )}
                    {visibleAccountInfo.email && (
                      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: s.text }}>
                        <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: s.accent }} />
                        <span className="truncate">{visibleAccountInfo.email}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bookings Section */}
                {isSupabaseConfigured && databaseBookingsState !== 'ready' && (
                  <div
                    className="p-5 border rounded-xl text-center"
                    style={{ backgroundColor: s.card, borderColor: s.line, color: s.muted }}
                    role={databaseBookingsState === 'error' ? 'alert' : 'status'}
                  >
                    <p className="text-[10px] font-semibold">
                      {databaseBookingsState === 'loading'
                        ? (locale === 'hi' ? 'बुकिंग लोड हो रही हैं…' : 'Loading your bookings…')
                        : (locale === 'hi' ? 'बुकिंग लोड नहीं हो सकीं।' : 'Could not load your bookings.')}
                    </p>
                  </div>
                )}
                {databaseBookingsState === 'ready' && totalBookingCount > 0 && (
                  <>
                    {/* Group tabs */}
                    <div
                      className="flex rounded-xl overflow-hidden border"
                      style={{ borderColor: s.chipLine, backgroundColor: s.card }}
                    >
                      {groups.map((group) => {
                        const count = grouped[group].length;
                        const isActive = activeGroup === group;
                        return (
                          <button
                            key={group}
                            type="button"
                            data-testid={`account-booking-tab-${group}`}
                            aria-pressed={isActive}
                            onClick={() => setActiveGroup(group)}
                            className={`flex-1 py-2 text-[9px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                              isActive ? '' : 'opacity-70'
                            }`}
                            style={{
                              backgroundColor: isActive ? s.accent : 'transparent',
                              color: isActive ? s.accentText : s.muted,
                            }}
                          >
                            {groupLabel(group, locale)}
                            <span className="ml-1">({count})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Booking list */}
                    <div className="flex flex-col gap-2 pb-2">
                      {visibleBookings.length > 0 ? (
                        visibleBookings.map((record) => (
                          <BookingListCard
                            key={record.id}
                            record={record}
                            s={s}
                            locale={locale}
                            onOpen={openBooking}
                          />
                        ))
                      ) : (
                        <div
                          className="p-5 border rounded-xl text-center flex flex-col items-center gap-2"
                          style={{ backgroundColor: s.card, borderColor: s.line }}
                        >
                          <CalendarCheck className="w-6 h-6" style={{ color: s.muted }} />
                          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
                            {activeGroup === 'upcoming'
                              ? (locale === 'hi' ? 'कोई आगामी बुकिंग नहीं' : 'No upcoming bookings')
                              : activeGroup === 'past'
                                ? (locale === 'hi' ? 'कोई पिछली बुकिंग नहीं' : 'No past bookings')
                                : (locale === 'hi' ? 'कोई रद्द बुकिंग नहीं' : 'No cancelled bookings')}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* No bookings state */}
                {databaseBookingsState === 'ready' && totalBookingCount === 0 && (
                  <div
                    className="p-5 border rounded-xl text-center flex flex-col items-center gap-2"
                    style={{ backgroundColor: s.card, borderColor: s.line }}
                  >
                    <CalendarCheck className="w-8 h-8" style={{ color: s.muted }} />
                    <p className="text-xs font-bold" style={{ color: s.muted }}>
                      {locale === 'hi' ? 'अभी कोई बुकिंग नहीं' : 'No bookings yet'}
                    </p>
                    <p className="text-[10px]" style={{ color: s.muted }}>
                      {locale === 'hi'
                        ? 'बुकिंग करने के बाद आपकी सारी जानकारी यहाँ दिखाई देगी।'
                        : 'After booking, your information will appear here.'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {/* PHASE 20.9 — Help & Support. */}
                  <button
                    type="button"
                    data-testid="customer-account-help"
                    onClick={openHelp}
                    className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
                    style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
                  >
                    <LifeBuoy className="w-4 h-4" />
                    {locale === 'hi' ? 'सहायता' : 'Help & Support'}
                  </button>
                  {/* PHASE 20.8 — Notifications. */}
                  <button
                    type="button"
                    data-testid="customer-account-notifications"
                    onClick={openNotifications}
                    className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
                    style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
                  >
                    <Bell className="w-4 h-4" />
                    {locale === 'hi' ? 'सूचनाएँ' : 'Notifications'}
                  </button>
                  {/* PHASE 20.7 — My Reviews. */}
                  <button
                    type="button"
                    data-testid="customer-account-reviews"
                    onClick={openReviews}
                    className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
                    style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
                  >
                    <Star className="w-4 h-4" />
                    {locale === 'hi' ? 'मेरी समीक्षाएँ' : 'My Reviews'}
                  </button>
                  {/* PHASE 20.6 — Saved Salons. */}
                  <button
                    type="button"
                    data-testid="customer-account-favorites"
                    onClick={openFavorites}
                    className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
                    style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
                  >
                    <Heart className="w-4 h-4" />
                    {locale === 'hi' ? 'सेव किए गए सैलून' : 'Saved Salons'}
                  </button>
                  {/* PHASE 20.5 — My Profile (view + edit). */}
                  <button
                    type="button"
                    data-testid="customer-account-profile"
                    onClick={openProfile}
                    className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
                    style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
                  >
                    <User className="w-4 h-4" />
                    {locale === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile'}
                  </button>
                  <button
                    type="button"
                    data-testid="customer-account-book"
                    onClick={handleBookAppointment}
                    className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 cursor-pointer"
                    style={{ backgroundColor: s.accent, color: s.accentText }}
                  >
                    <CalendarCheck className="w-4 h-4" />
                    {locale === 'hi' ? 'नई बुकिंग करें' : 'Book Appointment'}
                  </button>
                </div>

                {/* Browser identity note */}
                <p className="text-[9px] font-medium text-center mt-auto pt-4" style={{ color: s.disabledText }}>
                  {isSupabaseConfigured
                    ? (locale === 'hi'
                        ? 'बुकिंग आपके साइन-इन खाते से सुरक्षित रूप से लोड होती हैं।'
                        : 'Bookings are securely loaded from your signed-in account.')
                    : (locale === 'hi'
                        ? 'यह खाता इस ब्राउज़र पर आधारित है। बुकिंग के बाद आपकी जानकारी अपने आप सहेज ली जाती है।'
                        : 'This account is based on your browser. Your information is saved automatically after booking.')}
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
