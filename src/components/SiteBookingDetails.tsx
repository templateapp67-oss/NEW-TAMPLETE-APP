/**
 * PHASE 20.3 — BOOKING DETAILS & RECEIPT · customer account sub-view.
 *
 * PHASE 20.4 — RESCHEDULE & CANCELLATION on the same view, via dedicated
 * components:
 *   - `RescheduleBooking`  — the 3-step reschedule flow (date → time →
 *     confirm) reusing the EXISTING Phase 16 availability engine.
 *   - `CancelBookingDialog` — the explicit cancellation confirmation,
 *     reusing the EXISTING `customerCancelBooking` (16.7).
 *
 * The booking is resolved through `readCustomerBooking(bookingId)` (own
 * rows only — identity resolved INSIDE the helper), so a tampered booking
 * id from another customer is `not-found`, never data. The derived
 * confirmation view uses the EXISTING state machine; `SiteBookingConfirmation`
 * (16.6) is reused for banner/reference/detail rows — one booking-details
 * component, no duplicate system.
 *
 * Reschedule / Cancel actions render ONLY for live bookings
 * (`customerCanCancel`: pending / confirmed / pay_at_salon). After either
 * mutation succeeds, PAYMENT_EVENT + an explicit re-read refresh Booking
 * Details and My Bookings.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Download,
  Mail,
  Phone,
  ReceiptText,
  Scissors,
  Sparkles,
  Star,
  User,
  Wallet,
  X,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { readCustomerBooking } from '../lib/siteCustomerAccount';
import { toBookingConfirmation, bookingConfirmationReceiptText, mockPaymentForConfirmation } from '../lib/siteBookingConfirmation';
import type { BookingConfirmationView } from '../lib/siteBookingConfirmation';
import { bookingConfirmationText } from '../lib/siteBookingConfirmationI18n';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import SiteBookingConfirmation, { BookingConfirmationStateCard } from './SiteBookingConfirmation';
import { salonDisplayName } from '../lib/siteBooking';
import { bookingBusinessId } from '../lib/siteBookingFlow';
import { formatMinutesLabel, PAYMENT_EVENT } from '../lib/siteBookingPayment';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import { formatCurrency } from '../lib/pricing';
import { THEME_LABELS } from '../lib/themeServices';
import type { BookingFlowSurface } from '../lib/siteBookingTheme';
import { customerCanCancel } from '../lib/bookingManagement';
import RescheduleBooking from './RescheduleBooking';
import CancelBookingDialog from './CancelBookingDialog';
import SiteReviewForm from './SiteReviewForm';
import { findMyReviewForBooking, isBookingEligibleForReview, REVIEW_EVENT } from '../lib/siteReviews';
import type { CustomerReview } from '../lib/siteReviews';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  bookingSalonIdCandidate,
  bookingTemplateKeyCandidate,
  readMySupabaseBookingByReference,
} from '../lib/supabaseBooking';
import { startRazorpayAdvancePayment } from '../lib/supabasePayment';

interface Props {
  /** The CURRENT site theme — the panel stays consistent with it. */
  themeId: SiteHeaderThemeId;
  /** The salon whose website is open (source of salon name/logo/catalog). */
  data: SalonData;
  /** Booking reference from the existing record. */
  bookingId: string;
  /** Phase 16.1 database row already authorized and loaded through Supabase RLS. */
  persistedRecord?: PaymentRecord | null;
  onBack: () => void;
  onClose: () => void;
  onViewSalon: () => void;
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                              */
/* ------------------------------------------------------------------ */

function InfoRow({
  s,
  icon,
  label,
  value,
  valueColor,
}: {
  s: BookingFlowSurface;
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-b-0" style={{ borderColor: s.line }}>
      <span className="flex items-center gap-2 shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: s.muted }}>
        <span style={{ color: s.accent }}>{icon}</span>
        {label}
      </span>
      <span className="text-right text-[11px] font-bold break-words min-w-0 max-w-[65%]" style={{ color: valueColor || s.textStrong }}>
        {value}
      </span>
    </div>
  );
}

function Banner({
  s,
  kind,
  children,
  testId,
}: {
  s: BookingFlowSurface;
  kind: 'success' | 'error' | 'info';
  children: ReactNode;
  testId?: string;
}) {
  const color = kind === 'success' ? s.success : kind === 'error' ? s.danger : s.muted;
  const bg = kind === 'success' ? s.successSoft : kind === 'error' ? s.chip : s.well;
  return (
    <div
      data-testid={testId}
      className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold leading-relaxed"
      style={{ backgroundColor: bg, borderColor: color, color }}
    >
      {kind === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" />}
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function SiteBookingDetails({ themeId, data, bookingId, persistedRecord, onBack, onClose, onViewSalon }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const bookingTemplateKey = useMemo(
    () => bookingTemplateKeyCandidate(data, themeId),
    [data, themeId],
  );
  const T = bookingConfirmationText(locale);

  const [receiptOpen, setReceiptOpen] = useState(false);
  // Refresh the record whenever the store changes (after reschedule/cancel).
  const [version, setVersion] = useState(0);
  const [directRecord, setDirectRecord] = useState<PaymentRecord | null>(null);
  const [directState, setDirectState] = useState<'loading' | 'error' | 'ready'>(
    isSupabaseConfigured && persistedRecord === undefined ? 'loading' : 'ready',
  );
  const [directRetry, setDirectRetry] = useState(0);
  const directSalonId = useMemo(() => bookingSalonIdCandidate(data, null), [data]);
  const [mode, setMode] = useState<'details' | 'reschedule' | 'review'>('details');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [paymentOverride, setPaymentOverride] = useState<PaymentRecord | null>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(PAYMENT_EVENT, bump);
    window.addEventListener(REVIEW_EVENT, bump);
    return () => {
      window.removeEventListener(PAYMENT_EVENT, bump);
      window.removeEventListener(REVIEW_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || persistedRecord !== undefined) return;
    if (!directSalonId) {
      setDirectRecord(null);
      setDirectState('ready');
      return;
    }
    let active = true;
    setDirectState('loading');
    void readMySupabaseBookingByReference(directSalonId, themeId, bookingId, bookingTemplateKey)
      .then((record) => {
        if (!active) return;
        setDirectRecord(record);
        setDirectState('ready');
      })
      .catch(() => {
        if (!active) return;
        setDirectRecord(null);
        setDirectState('error');
      });
    return () => { active = false; };
  }, [persistedRecord, directSalonId, themeId, bookingId, bookingTemplateKey, directRetry]);

  // Supabase rows are supplied only after the authenticated RLS read. Legacy
  // unconfigured builds retain the browser-local own-row resolver.
  const record = useMemo(
    () => paymentOverride || (isSupabaseConfigured
      ? (persistedRecord !== undefined ? persistedRecord : directRecord)
      : readCustomerBooking(bookingId)),
    [bookingId, version, persistedRecord, directRecord, paymentOverride],
  );
  const view: BookingConfirmationView | null = useMemo(
    () => (record ? toBookingConfirmation(record) : null),
    [record],
  );

  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  if (directState === 'loading') {
    return <BookingConfirmationStateCard themeId={themeId} state="loading" />;
  }
  if (directState === 'error') {
    return (
      <BookingConfirmationStateCard
        themeId={themeId}
        state="error"
        onRetry={() => setDirectRetry((value) => value + 1)}
      />
    );
  }

  // ---------- secure not-found (tampered / foreign booking id) ----------
  if (!record || !view) {
    return (
      <div className="flex flex-col gap-4">
        <BookingConfirmationStateCard themeId={themeId} state="not-found" />
        <button
          type="button"
          data-testid="booking-details-back"
          onClick={onBack}
          className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
          style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {L('Back to My Bookings', 'मेरी बुकिंग पर वापस')}
        </button>
      </div>
    );
  }

  // ---------- real data from the record ----------
  const mockPayment = mockPaymentForConfirmation(view);
  const belongsToCurrentSalon = record.businessId === bookingBusinessId(data);
  const salonName = belongsToCurrentSalon
    ? salonDisplayName(data, themeId)
    : THEME_LABELS[record.themeId] || record.businessId;

  const categoryFor = (serviceId: string): string | undefined => {
    if (!belongsToCurrentSalon) return undefined;
    const service = (data.services || []).find((svc) => svc.id === serviceId);
    return service?.category;
  };

  const serviceLines = view.services.map((line) => ({
    name: line.serviceName,
    category: line.category || categoryFor(line.serviceId),
  }));

  const dateLabel = useMemo(
    () => new Date(`${view.dateKey}T12:00:00`).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    [view.dateKey, locale],
  );
  const timeLabel = `${formatMinutesLabel(view.startMinutes, locale)} – ${formatMinutesLabel(view.endMinutes, locale)}`;

  // ---------- PHASE 20.4 · eligibility ----------
  const canModify = customerCanCancel(record);
  // ---------- PHASE 20.7 · review eligibility (EXISTING engine rule:
  // confirmed/pay_at_salon booking whose date is today or earlier) ----------
  const canReview = isBookingEligibleForReview(record);
  const existingReview: CustomerReview | null = useMemo(
    () => (canReview
      ? findMyReviewForBooking(record.businessId, record.themeId, record.bookingId)
      : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [record, canReview, version],
  );

  const startReschedule = useCallback(() => {
    setActionError(null);
    setSuccessNote(null);
    setMode('reschedule');
  }, []);

  const handleRescheduleDone = useCallback((message: string) => {
    setMode('details');
    setSuccessNote(message);
    setVersion((v) => v + 1);
  }, []);

  const handleCancelDone = useCallback((message: string) => {
    setConfirmingCancel(false);
    setSuccessNote(message);
    setVersion((v) => v + 1);
  }, []);

  const receiptText = useMemo(
    () => bookingConfirmationReceiptText(view, T, locale, salonName),
    [view, T, locale, salonName],
  );

  const downloadSummary = () => {
    try {
      const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexora-booking-${view.reference}.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
    } catch {
      /* download unavailable — receipt remains visible on screen */
    }
  };

  const payAdvance = async () => {
    if (paymentPending || record.persistence !== 'supabase' || record.paymentStatus === 'paid') return;
    setPaymentPending(true);
    setPaymentError(null);
    const result = await startRazorpayAdvancePayment(record).promise;
    setPaymentPending(false);
    setPaymentOverride(result.record);
    if (result.outcome === 'success' && result.record.paymentStatus === 'paid') {
      setSuccessNote(L('Razorpay Test Mode advance verified and saved.', 'Razorpay टेस्ट मोड एडवांस सत्यापित और सेव हुआ।'));
      window.dispatchEvent(new Event(PAYMENT_EVENT));
      setVersion((value) => value + 1);
    } else if (result.outcome === 'cancellation') {
      setPaymentError(L('Payment cancelled. No payment was marked successful.', 'भुगतान रद्द हुआ। कोई भुगतान सफल नहीं माना गया।'));
    } else {
      setPaymentError(result.reason || L('Payment failed. No payment was marked successful.', 'भुगतान विफल हुआ। कोई भुगतान सफल नहीं माना गया।'));
    }
  };

  /* ================================================================ */
  /* RESCHEDULE MODE — dedicated component                             */
  /* ================================================================ */
  if (mode === 'reschedule') {
    return (
      <RescheduleBooking
        themeId={themeId}
        data={data}
        record={record}
        onBack={() => setMode('details')}
        onClose={onClose}
        onDone={handleRescheduleDone}
      />
    );
  }

  /* ================================================================ */
  /* REVIEW MODE — dedicated component (completed bookings only)        */
  /* ================================================================ */
  if (mode === 'review') {
    return (
      <SiteReviewForm
        themeId={themeId}
        data={data}
        booking={record}
        existingReview={existingReview}
        onBack={() => setMode('details')}
        onClose={onClose}
        onDone={(message) => {
          setMode('details');
          setSuccessNote(message);
          setVersion((v) => v + 1);
        }}
      />
    );
  }

  /* ================================================================ */
  /* DETAILS MODE                                                      */
  /* ================================================================ */
  return (
    <div className="flex flex-col gap-4" data-testid="booking-details" data-reference={view.reference}>
      {/* ---- salon header card ---- */}
      <div
        className="flex items-center gap-2.5 p-3.5 border rounded-xl"
        style={{ backgroundColor: s.card, borderColor: s.line }}
      >
        <button
          type="button"
          data-testid="booking-details-back-top"
          onClick={onBack}
          aria-label={L('Back to My Bookings', 'मेरी बुकिंग पर वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {belongsToCurrentSalon && data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt=""
            className="w-10 h-10 rounded-lg object-contain shrink-0 border"
            style={{ borderColor: s.chipLine }}
          />
        ) : (
          <span
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: s.accentSoft, color: s.accent }}
          >
            {belongsToCurrentSalon ? <Scissors className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {salonName}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {L('Booking details', 'बुकिंग विवरण')}
          </p>
        </div>
        <button
          type="button"
          data-testid="booking-details-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {successNote && <Banner s={s} kind="success" testId="booking-details-success">{successNote}</Banner>}
      {actionError && <Banner s={s} kind="error" testId="booking-details-error">{actionError}</Banner>}
      {paymentError && <Banner s={s} kind="error" testId="booking-payment-error">{paymentError}</Banner>}

      {/* ---- existing confirmation panel (banner + reference + details) ---- */}
      <SiteBookingConfirmation
        themeId={themeId}
        data={data}
        view={view}
        variant="history"
        showActions={false}
      />

      {/* ---- service categories (existing catalog only) ---- */}
      {serviceLines.some((line) => line.category) && (
        <div className="p-3.5 border rounded-xl space-y-1" style={{ backgroundColor: s.card, borderColor: s.line }}>
          <h3 className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.muted }}>
            {L('Services', 'सेवाएँ')}
          </h3>
          {serviceLines.map((line) => (
            <div key={line.name} className="flex items-center justify-between gap-2 text-[11px] font-semibold" style={{ color: s.text }}>
              <span className="truncate">{line.name}</span>
              {line.category ? (
                <span
                  className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: s.accentSoft, color: s.accent }}
                >
                  {line.category}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* ---- payment breakdown (real record amounts) ---- */}
      <div
        data-testid="booking-details-payment-breakdown"
        className="p-3.5 border rounded-xl"
        style={{ backgroundColor: s.card, borderColor: s.line }}
      >
        <h3 className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.muted }}>
          {L('Payment breakdown', 'भुगतान का विवरण')}
        </h3>
        <InfoRow s={s} icon={<Wallet className="w-3 h-3" />} label={L('Total amount', 'कुल राशि')} value={formatCurrency(mockPayment.totalAmount)} />
        <InfoRow
          s={s}
          icon={<Wallet className="w-3 h-3" />}
          label={L('25% advance', '25% एडवांस')}
          value={formatCurrency(record.amountDue)}
          valueColor={s.accent}
        />
        <InfoRow s={s} icon={<Wallet className="w-3 h-3" />} label={L('Remaining amount', 'शेष राशि')} value={formatCurrency(record.remainingAmount)} />
        <InfoRow
          s={s}
          icon={<Wallet className="w-3 h-3" />}
          label={L('Payment status', 'भुगतान स्थिति')}
          value={record.paymentStatus === 'paid' ? L('Paid (Test Mode)', 'भुगतान हुआ (टेस्ट मोड)') : record.paymentStatus}
          valueColor={s.accent}
        />
      </div>

      {record.persistence === 'supabase' && record.paymentStatus !== 'paid' && (
        <button
          type="button"
          data-testid="booking-details-pay-advance"
          disabled={paymentPending}
          onClick={() => { void payAdvance(); }}
          className="w-full rounded-xl px-4 py-3 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: s.accent, color: s.accentText }}
        >
          {paymentPending
            ? L('Opening secure Test Checkout…', 'सुरक्षित टेस्ट चेकआउट खुल रहा है…')
            : `${L('Pay 25% with Razorpay Test Mode', 'Razorpay टेस्ट मोड से 25% भुगतान करें')} · ${formatCurrency(record.amountDue)}`}
        </button>
      )}

      {/* ---- customer info (the customer's OWN record) ---- */}
      <div className="p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <h3 className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.muted }}>
          {L('Customer', 'ग्राहक')}
        </h3>
        <InfoRow s={s} icon={<User className="w-3 h-3" />} label={L('Name', 'नाम')} value={view.customer.name} />
        {view.customer.mobile && (
          <InfoRow s={s} icon={<Phone className="w-3 h-3" />} label={L('Mobile', 'मोबाइल')} value={view.customer.mobile} />
        )}
        {view.customer.email && (
          <InfoRow s={s} icon={<Mail className="w-3 h-3" />} label={L('Email', 'ईमेल')} value={view.customer.email} />
        )}
      </div>

      {/* ---- receipt card (clean layout + download) ---- */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="booking-details-toggle-receipt"
            aria-expanded={receiptOpen}
            onClick={() => setReceiptOpen((v) => !v)}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer transition-colors"
            style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            {receiptOpen ? L('Hide receipt', 'रसीद छिपाएँ') : L('View receipt', 'रसीद देखें')}
          </button>
          <button
            type="button"
            data-testid="booking-details-download"
            onClick={downloadSummary}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer transition-colors"
            style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
          >
            <Download className="w-3.5 h-3.5" />
            {L('Download', 'डाउनलोड')}
          </button>
        </div>

        {receiptOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              data-testid="booking-details-receipt"
              className="border rounded-xl p-4 space-y-1.5"
              style={{ backgroundColor: s.card, borderColor: s.line }}
            >
              <div className="text-center pb-2 border-b" style={{ borderColor: s.chipLine }}>
                <p className="text-sm font-extrabold" style={{ color: s.textStrong }}>{salonName}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: s.accent }}>
                  {record.persistence === 'supabase'
                    ? L('RAZORPAY TEST MODE PAYMENT RECEIPT', 'RAZORPAY टेस्ट मोड भुगतान रसीद')
                    : L('TEST / MOCK BOOKING RECEIPT — NOT PROOF OF PAYMENT', 'टेस्ट / मॉक बुकिंग रसीद — भुगतान का प्रमाण नहीं')}
                </p>
              </div>
              <ReceiptRow
                s={s}
                label={record.persistence === 'supabase' ? L('Provider reference', 'प्रदाता संदर्भ') : L('Test receipt reference', 'टेस्ट रसीद संदर्भ')}
                value={record.persistence === 'supabase' ? record.gatewayRef || L('Pending', 'लंबित') : mockPayment.receiptReference}
              />
              <ReceiptRow s={s} label={L('Booking reference', 'बुकिंग संदर्भ')} value={view.reference} />
              <ReceiptRow s={s} label={L('Date', 'तारीख़')} value={dateLabel} />
              <ReceiptRow s={s} label={L('Time', 'समय')} value={timeLabel} />
              <ReceiptRow s={s} label={L('Services', 'सेवाएँ')} value={serviceLines.map((l) => l.name).join(' + ')} />
              <ReceiptRow s={s} label={L('Duration', 'अवधि')} value={`${view.durationMinutes} ${L('min', 'मिनट')}`} />
              <div className="border-t my-1.5" style={{ borderColor: s.chipLine }} />
              <ReceiptRow s={s} label={L('Total amount', 'कुल राशि')} value={formatCurrency(mockPayment.totalAmount)} strong />
              <ReceiptRow s={s} label={L('25% advance', '25% एडवांस')} value={formatCurrency(record.amountDue)} />
              <ReceiptRow s={s} label={L('Remaining', 'शेष राशि')} value={formatCurrency(record.remainingAmount)} />
              <ReceiptRow
                s={s}
                label={L('Payment status', 'भुगतान स्थिति')}
                value={record.paymentStatus}
              />
              <ReceiptRow
                s={s}
                label={L('Booking status', 'बुकिंग स्थिति')}
                value={T[`state.${view.state}` as keyof typeof T] || view.state}
              />
              <div className="border-t my-1.5" style={{ borderColor: s.chipLine }} />
              <ReceiptRow s={s} label={L('Customer', 'ग्राहक')} value={view.customer.name} />
              {view.customer.mobile && <ReceiptRow s={s} label={L('Mobile', 'मोबाइल')} value={view.customer.mobile} />}
              {view.customer.email && <ReceiptRow s={s} label={L('Email', 'ईमेल')} value={view.customer.email} />}
              <p className="text-center text-[8px] font-semibold pt-2" style={{ color: s.disabledText }}>
                {L('Thank you for choosing us.', 'हमें चुनने के लिए धन्यवाद।')}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ---- PHASE 20.4 actions (only what the system supports) ---- */}
      {canModify && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            data-testid="booking-details-reschedule"
            onClick={startReschedule}
            className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
            style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
          >
            <CalendarClock className="w-4 h-4" />
            {L('Reschedule', 'पुनर्निर्धारित करें')}
          </button>
          <button
            type="button"
            data-testid="booking-details-cancel"
            onClick={() => { setActionError(null); setConfirmingCancel(true); }}
            className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
            style={{ borderColor: s.danger, color: s.danger, backgroundColor: 'transparent' }}
          >
            <CalendarX className="w-4 h-4" />
            {L('Cancel Booking', 'बुकिंग रद्द करें')}
          </button>
        </div>
      )}

      {/* ---- PHASE 20.7 · review action (eligible past bookings only) ---- */}
      {canReview && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            data-testid="booking-details-review"
            onClick={() => { setActionError(null); setMode('review'); }}
            className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
            style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
          >
            <Star className="w-4 h-4" />
            {existingReview
              ? L('Edit Review', 'समीक्षा संपादित करें')
              : L('Write a Review', 'समीक्षा लिखें')}
          </button>
        </div>
      )}

      {/* ---- navigation ---- */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="booking-details-back"
          onClick={onBack}
          className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
          style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {L('Back to My Bookings', 'मेरी बुकिंग पर वापस')}
        </button>
        <button
          type="button"
          data-testid="booking-details-view-salon"
          onClick={onViewSalon}
          className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110"
          style={{ backgroundColor: s.accent, color: s.accentText }}
        >
          <Sparkles className="w-4 h-4" />
          {L('View Salon', 'सैलून देखें')}
        </button>
      </div>

      {/* ---- PHASE 20.4 · cancel confirmation dialog (dedicated component) ---- */}
      {confirmingCancel && (
        <CancelBookingDialog
          themeId={themeId}
          data={data}
          record={record}
          onClose={() => setConfirmingCancel(false)}
          onDone={handleCancelDone}
        />
      )}
    </div>
  );
}

function ReceiptRow({
  s,
  label,
  value,
  strong = false,
}: {
  s: BookingFlowSurface;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: s.muted }}>
        {label}
      </span>
      <span
        className="text-right text-[10px] break-words min-w-0 max-w-[60%]"
        style={{ color: s.textStrong, fontWeight: strong ? 800 : 600 }}
      >
        {value}
      </span>
    </div>
  );
}
