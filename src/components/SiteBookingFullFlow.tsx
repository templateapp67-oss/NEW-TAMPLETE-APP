import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { SalonData, Service } from '../types';
import SiteBookingFlow from './SiteBookingFlow';
import SiteBookingPaymentFlow from './SiteBookingPaymentFlow';
import SiteBookingNotices from './SiteBookingNotices';
import type { ActiveBookingNotice } from './SiteBookingNotices';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { closeSiteBooking } from '../lib/siteBooking';
import { releaseBookingSlot, bookingSlotKey, bookingBusinessId } from '../lib/siteBookingFlow';
import { clearBookingDraft } from '../lib/siteBookingDraft';
import type { PaymentRecord, PaymentServiceLine } from '../lib/siteBookingPayment';
import { findPaymentRecord, readPaymentRecordsForBusiness } from '../lib/siteBookingPayment';
import type { BookingNoticeInput } from '../lib/siteBookingNotices';
import { newBookingNoticeId, normalizeNotice } from '../lib/siteBookingNotices';
import { bookingConfirmationText } from '../lib/siteBookingConfirmationI18n';
import { bookingFlowText } from '../lib/siteBookingI18n';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  bookingSalonIdCandidate,
  createSupabaseBooking,
  readSupabaseBookingCatalog,
  readSupabaseCustomerDetails,
  SupabaseBookingError,
  type SupabaseCustomerDetails,
} from '../lib/supabaseBooking';
import { toBookingConfirmation } from '../lib/siteBookingConfirmation';
import SiteBookingConfirmation from './SiteBookingConfirmation';

/**
 * PHASE 10.7 — orchestrator for the full booking + payment + confirmation
 * journey.
 *
 *   - Mounts the Phase 10.6 entry flow (Service → Date → Time → Details
 *     → Summary) for the active theme.
 *   - When the user confirms in the Summary step, swaps the entry flow
 *     for the Phase 10.7 payment flow (Option → Gateway → Result →
 *     Confirmation → Receipt), passing the same selections forward.
 *   - Preserves slot holds across the swap (so a user that backs out
 *     of the payment screen does not lose their slot).
 *
 * NOTE: this component assumes the host has already decided to render it
 * (the `open` state lives in `SiteBookingHost`, which mounts this only
 * when the booking widget should be visible).
 */
type BookingSubmissionSummary = {
  serviceId: string;
  serviceBusinessId?: string;
  serviceLines?: PaymentServiceLine[];
  dateKey: string;
  startMinutes: number;
  endMinutes: number;
  customer: { name: string; mobile: string; email: string; notes: string };
};

export default function SiteBookingFullFlow({ themeId, data }: { themeId: SiteHeaderThemeId; data: SalonData }) {
  const [phase, setPhase] = useState<'entry' | 'payment' | 'persisting' | 'persisted' | 'persistence-error'>('entry');
  const [summary, setSummary] = useState<BookingSubmissionSummary | null>(null);
  const [databaseRecord, setDatabaseRecord] = useState<PaymentRecord | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [catalogServices, setCatalogServices] = useState<Service[]>([]);
  const [catalogState, setCatalogState] = useState<'loading' | 'error' | 'ready'>(
    isSupabaseConfigured ? 'loading' : 'ready',
  );
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [customerPrefill, setCustomerPrefill] = useState<SupabaseCustomerDetails | null>(null);
  const [customerState, setCustomerState] = useState<'loading' | 'error' | 'ready'>(
    isSupabaseConfigured ? 'loading' : 'ready',
  );
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerRetry, setCustomerRetry] = useState(0);
  const catalogSalonId = useMemo(() => bookingSalonIdCandidate(data, null), [data]);
  const bookingData = useMemo<SalonData>(() => {
    if (!isSupabaseConfigured) return data;
    return {
      ...data,
      // Phase 16.2: configured builds display only server-resolved live rows.
      // Local offers/variants cannot alter the database-derived base price or
      // duration shown during this no-payment persistence phase.
      services: catalogServices,
      offers: [],
    };
  }, [data, catalogServices]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!catalogSalonId) {
      setCatalogServices([]);
      setCatalogError('This website is not linked to a real salon record.');
      setCatalogState('error');
      return;
    }
    let active = true;
    setCatalogError(null);
    setCatalogState('loading');
    void readSupabaseBookingCatalog(catalogSalonId, themeId)
      .then((catalog) => {
        if (!active) return;
        setCatalogServices(catalog.services);
        setCatalogState('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCatalogServices([]);
        setCatalogError(error instanceof SupabaseBookingError
          ? error.message
          : 'The service catalog could not be loaded. Please try again.');
        setCatalogState('error');
      });
    return () => { active = false; };
  }, [catalogSalonId, themeId, catalogRetry]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!catalogSalonId) {
      setCustomerPrefill(null);
      setCustomerError('This website is not linked to a real salon record.');
      setCustomerState('error');
      return;
    }
    let active = true;
    setCustomerError(null);
    setCustomerState('loading');
    void readSupabaseCustomerDetails(catalogSalonId)
      .then((customer) => {
        if (!active) return;
        setCustomerPrefill(customer);
        setCustomerState('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCustomerPrefill(null);
        setCustomerError(error instanceof SupabaseBookingError
          ? error.message
          : 'Customer details could not be loaded. Please try again.');
        setCustomerState('error');
      });
    return () => { active = false; };
  }, [catalogSalonId, customerRetry]);

  /* ------------------------------------------------------------------ */
  /* PHASE 16.9 — booking notices.                                       */
  /*                                                                     */
  /* The EXISTING `onShowToast` seam every booking surface already calls */
  /* is finally wired to a visible presenter here in the host — before   */
  /* 16.9 the public site dropped those messages on the floor. Kinds     */
  /* (success / warning / error / info) come from the call sites; legacy */
  /* strings keep working as `info`. No new notification system.         */
  /* ------------------------------------------------------------------ */
  const [notices, setNotices] = useState<ActiveBookingNotice[]>([]);
  const dismissNotice = useCallback((id: string) => {
    setNotices((prev) => prev.filter((notice) => notice.id !== id));
  }, []);
  const showNotice = useCallback((input: BookingNoticeInput) => {
    const notice = normalizeNotice(input);
    setNotices((prev) => {
      // Keep the stack readable: cap at 4, drop the oldest first.
      const next = prev.length >= 4 ? prev.slice(prev.length - 3) : prev;
      return [...next, { id: newBookingNoticeId(), kind: notice.kind, message: notice.message }];
    });
  }, []);

  // PHASE 16.9 — duplicate-submission guard on the summary hand-off: two
  // rapid clicks on Confirm must not double-fire the phase switch.
  const confirmLockRef = useRef(false);
  useEffect(() => {
    confirmLockRef.current = false;
  }, [phase]);

  const persistSupabaseSummary = useCallback((submission: BookingSubmissionSummary) => {
    const selectedService = (bookingData.services || []).find((service) => service.id === submission.serviceId);
    const salonId = bookingSalonIdCandidate(
      bookingData,
      selectedService || { businessId: submission.serviceBusinessId },
    );
    if (!salonId) {
      setPersistenceError('This website is not linked to a real salon record.');
      setPhase('persistence-error');
      return;
    }

    confirmLockRef.current = true;
    setPersistenceError(null);
    setPhase('persisting');
    void createSupabaseBooking({
      salonId,
      themeId,
      services: submission.serviceLines || [],
      dateKey: submission.dateKey,
      startMinutes: submission.startMinutes,
      customer: submission.customer,
    }).then((record) => {
      setDatabaseRecord(record);
      const draftBusinessId = bookingBusinessId(bookingData);
      clearBookingDraft(draftBusinessId, record.themeId);
      if (record.businessId !== draftBusinessId) clearBookingDraft(record.businessId, record.themeId);
      showNotice({ kind: 'success', message: 'Booking saved securely.' });
      setPhase('persisted');
    }).catch((error: unknown) => {
      const message = error instanceof SupabaseBookingError
        ? error.message
        : 'The booking could not be saved. Please try again.';
      setPersistenceError(message);
      showNotice({ kind: 'error', message });
      setPhase('persistence-error');
    });
  }, [bookingData, themeId, showNotice]);

  const handleConfirmEntry = useCallback((payload: {
    service: { id: string; businessId?: string };
    serviceLines?: Array<{ serviceId: string; serviceName: string; price: number; durationMinutes: number }>;
    dateKey: string;
    startMinutes: number;
    endMinutes: number;
    customer: { name: string; mobile: string; email: string; notes: string };
  }) => {
    if (confirmLockRef.current) return;
    confirmLockRef.current = true;
    const nextSummary: BookingSubmissionSummary = {
      serviceId: payload.service.id,
      serviceBusinessId: payload.service.businessId,
      serviceLines: payload.serviceLines,
      dateKey: payload.dateKey,
      startMinutes: payload.startMinutes,
      endMinutes: payload.endMinutes,
      customer: payload.customer,
    };
    setSummary(nextSummary);

    // Unconfigured/test builds preserve the existing local payment sandbox.
    // Configured builds wait for the real RPC and never create a local success.
    if (!isSupabaseConfigured) {
      setPhase('payment');
      return;
    }
    persistSupabaseSummary(nextSummary);
  }, [persistSupabaseSummary]);

  // PHASE 16.5 — backing out of payment returns to the SUMMARY (selection
  // restored from the 16.1 draft), not to the start of the wizard.
  const [resumeAtSummary, setResumeAtSummary] = useState(false);
  const handleBackToSummary = useCallback(() => {
    setPersistenceError(null);
    confirmLockRef.current = false;
    setResumeAtSummary(true);
    setPhase('entry');
  }, []);

  const handleBookingConfirmed = useCallback((record: PaymentRecord) => {
    // PHASE 16.1 — the entry-flow draft has served its purpose once the
    // existing Phase 10.7 confirmation owns the record; drop it so a
    // later plain open starts fresh instead of resuming stale progress.
    clearBookingDraft(record.businessId, record.themeId);
  }, []);

  const handleStartNewBooking = useCallback(() => {
    setSummary(null);
    setDatabaseRecord(null);
    setPersistenceError(null);
    setResumeAtSummary(false);
    confirmLockRef.current = false;
    setPhase('entry');
  }, []);

  // PHASE 16.1 — single tenant-resolution rule shared with the entry flow.
  const businessId = bookingBusinessId(bookingData);
  // Resume a confirmed booking for the same business+theme so a refresh
  // during confirmation does not lose the user's confirmed row. The
  // most-recent confirmed/pay_at_salon record for this business+theme
  // is auto-resumed.
  const existingConfirmed = isSupabaseConfigured
    ? null
    : readPaymentRecordsForBusiness(businessId, themeId).find(
        (r) => r.bookingStatus === 'confirmed' || r.bookingStatus === 'pay_at_salon',
      ) || null;
  // Only use the auto-resumed record when the user hasn't already
  // chosen a different path in this session.
  const shouldAutoResume = existingConfirmed && !summary;
  const initialRecord = shouldAutoResume
    ? existingConfirmed
    : (phase === 'payment' && summary
        ? readPaymentRecordsForBusiness(businessId, themeId).find(
            (r) => r.serviceId === summary.serviceId && r.dateKey === summary.dateKey && r.startMinutes === summary.startMinutes
              && (r.bookingStatus === 'confirmed' || r.bookingStatus === 'pay_at_salon'),
          ) || null
        : null);

  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const surfaces = bookingSurfaces(themeId, appearance);
  const persistenceView = useMemo(
    () => (databaseRecord ? toBookingConfirmation(databaseRecord) : null),
    [databaseRecord],
  );

  // If the host should auto-resume, swap into the payment phase.
  useEffect(() => {
    if (shouldAutoResume && existingConfirmed) {
      setSummary({
        serviceId: existingConfirmed.serviceId,
        // PHASE 16.5 — resumed records restore their persisted line items.
        serviceLines: existingConfirmed.services,
        dateKey: existingConfirmed.dateKey,
        startMinutes: existingConfirmed.startMinutes,
        endMinutes: existingConfirmed.endMinutes,
        customer: existingConfirmed.customer,
      });
      setPhase('payment');
      // PHASE 16.9 — refresh recovery announced (no new record is made).
      showNotice({
        kind: 'info',
        message: bookingConfirmationText(locale)['duplicate.notice'],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-testid="site-booking-flow-orchestrator"
      data-phase={phase}
      className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ transform: 'translateZ(0)' }}
    >
      {phase === 'entry' && isSupabaseConfigured && (catalogState === 'loading' || customerState === 'loading') && (
        <div
          data-testid="supabase-booking-catalog-loading"
          className="absolute inset-0 z-[70] flex items-center justify-center p-5"
          style={{ backgroundColor: surfaces.page, color: surfaces.text }}
          aria-busy="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 text-center space-y-3"
            style={{ backgroundColor: surfaces.card, borderColor: surfaces.line }}
          >
            <Loader2 className="mx-auto h-7 w-7 animate-spin" style={{ color: surfaces.accent }} />
            <h2 className="text-sm font-extrabold" style={{ color: surfaces.textStrong }}>
              {locale === 'hi' ? 'सेवाएँ और ग्राहक विवरण लोड हो रहे हैं…' : 'Loading real services and customer details…'}
            </h2>
          </div>
        </div>
      )}
      {phase === 'entry' && isSupabaseConfigured && (catalogState === 'error' || customerState === 'error') && (
        <div
          data-testid="supabase-booking-catalog-error"
          className="absolute inset-0 z-[70] flex items-center justify-center p-5"
          style={{ backgroundColor: surfaces.page, color: surfaces.text }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 text-center space-y-4"
            style={{ backgroundColor: surfaces.card, borderColor: surfaces.danger }}
          >
            <AlertCircle className="mx-auto h-7 w-7" style={{ color: surfaces.danger }} />
            <h2 className="text-sm font-extrabold" style={{ color: surfaces.textStrong }}>
              {locale === 'hi' ? 'बुकिंग विवरण लोड नहीं हुए' : 'Booking details unavailable'}
            </h2>
            <p className="text-xs font-semibold" style={{ color: surfaces.muted }}>
              {catalogError || customerError || (locale === 'hi' ? 'कृपया फिर से कोशिश करें।' : 'Please try again.')}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={closeSiteBooking}
                className="rounded-xl border px-4 py-2 text-xs font-bold"
                style={{ borderColor: surfaces.line, color: surfaces.text }}
              >
                {locale === 'hi' ? 'वेबसाइट पर वापस' : 'Back to website'}
              </button>
              <button
                type="button"
                data-testid="supabase-booking-catalog-retry"
                onClick={() => {
                  setCatalogRetry((value) => value + 1);
                  setCustomerRetry((value) => value + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold"
                style={{ backgroundColor: surfaces.accent, color: surfaces.accentText }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {locale === 'hi' ? 'फिर कोशिश करें' : 'Try again'}
              </button>
            </div>
          </div>
        </div>
      )}
      {phase === 'entry' && (
        !isSupabaseConfigured
        || (catalogState === 'ready' && customerState === 'ready' && Boolean(customerPrefill))
      ) && (
        <SiteBookingFlow
          themeId={themeId}
          data={bookingData}
          authenticatedCustomer={isSupabaseConfigured && customerPrefill ? customerPrefill : undefined}
          onBackToWebsite={closeSiteBooking}
          onShowToast={showNotice}
          onProceedToPayment={handleConfirmEntry}
          resumeAtSummary={resumeAtSummary}
        />
      )}
      {phase === 'persisting' && (
        <div
          data-testid="supabase-booking-persisting"
          className="absolute inset-0 z-[70] flex items-center justify-center p-5"
          style={{ backgroundColor: surfaces.page, color: surfaces.text }}
          aria-busy="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 text-center space-y-3"
            style={{ backgroundColor: surfaces.card, borderColor: surfaces.line }}
          >
            <Loader2 className="mx-auto h-7 w-7 animate-spin" style={{ color: surfaces.accent }} />
            <h2 className="text-sm font-extrabold" style={{ color: surfaces.textStrong }}>
              {locale === 'hi' ? 'बुकिंग सुरक्षित की जा रही है…' : 'Saving your booking securely…'}
            </h2>
            <p className="text-xs font-semibold" style={{ color: surfaces.muted }}>
              {locale === 'hi' ? 'कृपया इस विंडो को बंद न करें।' : 'Please keep this window open.'}
            </p>
          </div>
        </div>
      )}
      {phase === 'persistence-error' && (
        <div
          data-testid="supabase-booking-error"
          className="absolute inset-0 z-[70] flex items-center justify-center p-5"
          style={{ backgroundColor: surfaces.page, color: surfaces.text }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 text-center space-y-4"
            style={{ backgroundColor: surfaces.card, borderColor: surfaces.danger }}
          >
            <AlertCircle className="mx-auto h-7 w-7" style={{ color: surfaces.danger }} />
            <h2 className="text-sm font-extrabold" style={{ color: surfaces.textStrong }}>
              {locale === 'hi' ? 'बुकिंग सेव नहीं हुई' : 'Booking was not saved'}
            </h2>
            <p className="text-xs font-semibold" style={{ color: surfaces.muted }}>
              {persistenceError || (locale === 'hi' ? 'कृपया फिर से कोशिश करें।' : 'Please try again.')}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={handleBackToSummary}
                className="rounded-xl border px-4 py-2 text-xs font-bold"
                style={{ borderColor: surfaces.line, color: surfaces.text }}
              >
                {locale === 'hi' ? 'वापस' : 'Back'}
              </button>
              <button
                type="button"
                data-testid="supabase-booking-retry"
                disabled={!summary}
                onClick={() => { if (summary) persistSupabaseSummary(summary); }}
                className="rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50"
                style={{ backgroundColor: surfaces.accent, color: surfaces.accentText }}
              >
                {locale === 'hi' ? 'फिर कोशिश करें' : 'Try again'}
              </button>
            </div>
          </div>
        </div>
      )}
      {phase === 'persisted' && persistenceView && (
        <div
          data-testid="supabase-booking-persisted"
          className="absolute inset-0 z-[70] overflow-y-auto p-4 md:p-6"
          style={{ backgroundColor: surfaces.page, color: surfaces.text }}
        >
          <div className="mx-auto max-w-2xl space-y-4">
            <div
              data-testid="supabase-booking-payment-deferred"
              className="rounded-xl border p-4 text-xs font-semibold"
              style={{ backgroundColor: surfaces.well, borderColor: surfaces.line, color: surfaces.text }}
            >
              <strong>{locale === 'hi' ? 'बुकिंग डेटाबेस में सेव है।' : 'Booking saved to Supabase.'}</strong>{' '}
              {locale === 'hi'
                ? 'ऑनलाइन भुगतान अभी लागू नहीं है; कोई भुगतान सफल नहीं दिखाया गया है।'
                : 'Online payment is not implemented in Phase 16.4; no payment has been marked successful.'}
            </div>
            <SiteBookingConfirmation
              themeId={themeId}
              data={bookingData}
              view={persistenceView}
              variant="history"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeSiteBooking}
                className="rounded-xl border px-4 py-2 text-xs font-bold"
                style={{ borderColor: surfaces.line, color: surfaces.text }}
              >
                {locale === 'hi' ? 'वेबसाइट पर वापस' : 'Back to website'}
              </button>
              <button
                type="button"
                onClick={handleStartNewBooking}
                className="rounded-xl px-4 py-2 text-xs font-bold"
                style={{ backgroundColor: surfaces.accent, color: surfaces.accentText }}
              >
                {locale === 'hi' ? 'नई बुकिंग' : 'New booking'}
              </button>
            </div>
          </div>
        </div>
      )}
      {phase === 'payment' && summary && (
        <SiteBookingPaymentFlowWrapper
          themeId={themeId}
          data={bookingData}
          summary={summary}
          initialRecord={initialRecord}
          onBackToSummary={handleBackToSummary}
          onBookingConfirmed={handleBookingConfirmed}
          onBackToWebsite={closeSiteBooking}
          onStartNewBooking={handleStartNewBooking}
          onShowToast={showNotice}
        />
      )}
      {/* PHASE 16.9 — the notice presenter for the whole journey. */}
      <SiteBookingNotices themeId={themeId} notices={notices} onDismiss={dismissNotice} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inner wrapper that resolves the service record for the summary data */
/* ------------------------------------------------------------------ */

function SiteBookingPaymentFlowWrapper({
  themeId,
  data,
  summary,
  initialRecord,
  onBackToSummary,
  onBookingConfirmed,
  onBackToWebsite,
  onStartNewBooking,
  onShowToast,
}: {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  summary: {
    serviceId: string;
    serviceLines?: PaymentServiceLine[];
    dateKey: string;
    startMinutes: number;
    endMinutes: number;
    customer: { name: string; mobile: string; email: string; notes: string };
  };
  initialRecord: PaymentRecord | null;
  onBackToSummary: () => void;
  onBookingConfirmed: (record: PaymentRecord) => void;
  onBackToWebsite: () => void;
  onStartNewBooking: () => void;
  onShowToast?: (input: BookingNoticeInput) => void;
}) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const T = bookingFlowText(locale);
  const s = bookingSurfaces(themeId, appearance);

  const service = (data.services || []).find((s) => s.id === summary.serviceId);
  if (!service) {
    // PHASE 16.9 — booking-error state: the service vanished from the
    // salon's catalog. Localized, themed, keyboard-accessible recovery.
    return (
      <div
        data-testid="payment-service-missing"
        data-locale={locale}
        data-appearance={appearance}
        className="absolute inset-0 z-[70] flex items-center justify-center p-4"
        style={{ backgroundColor: s.page }}
      >
        <div
          className="max-w-sm w-full p-5 flex flex-col items-center text-center gap-3 border rounded-2xl"
          style={{ backgroundColor: s.card, borderColor: s.danger }}
        >
          <p className="text-xs font-semibold" style={{ color: s.danger }}>
            {T['summary.serviceMissing']}
          </p>
          <button
            type="button"
            data-testid="payment-service-missing-back"
            onClick={onBackToSummary}
            className="px-4 py-2 text-[11px] font-bold border rounded-lg cursor-pointer"
            style={{ backgroundColor: s.accent, color: s.accentText, borderColor: s.accent }}
          >
            {T.back}
          </button>
        </div>
      </div>
    );
  }
  return (
    <SiteBookingPaymentFlow
      themeId={themeId}
      data={data}
      service={service}
      serviceLines={summary.serviceLines}
      dateKey={summary.dateKey}
      startMinutes={summary.startMinutes}
      endMinutes={summary.endMinutes}
      staffId={null}
      staffName={null}
      customer={summary.customer}
      initialRecord={initialRecord}
      onBackToSummary={onBackToSummary}
      onBookingConfirmed={onBookingConfirmed}
      onBackToWebsite={onBackToWebsite}
      onStartNewBooking={onStartNewBooking}
      onShowToast={onShowToast}
    />
  );
}

/* ---- helpers exposed for tests ---- */
export function releaseSlotHoldForTests(themeId: string, serviceId: string, dateKey: string, startMinutes: number): void {
  releaseBookingSlot(bookingSlotKey(themeId, serviceId, dateKey, startMinutes));
}
export function findRecordForTests(bookingId: string, businessId: string, themeId: string): PaymentRecord | null {
  return findPaymentRecord(bookingId, businessId, themeId);
}
