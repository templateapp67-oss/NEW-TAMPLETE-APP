/**
 * PHASE 20.4 — CANCEL BOOKING · dedicated confirmation dialog.
 *
 * Rendered by `SiteBookingDetails` when the customer taps "Cancel Booking"
 * on an ELIGIBLE booking. Requires explicit confirmation before the EXISTING
 * `customerCancelBooking` (16.7) runs:
 *
 *   - only the customer's OWN live booking may be cancelled (identity is
 *     resolved inside the mutation; a foreign id → not-found),
 *   - the real booking status flips to `cancelled` and the slot is released
 *     (cancelled records stop blocking availability),
 *   - payment status stays SEPARATE — paid amounts remain recorded and NO
 *     refund is invented. The dialog shows the real payment state and
 *     explains that refunds are handled by the salon.
 *
 * Rendered as a plain conditional overlay (no AnimatePresence) so it works
 * identically in production and in the jsdom test harness.
 */
import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { customerCancelBooking } from '../lib/bookingManagement';
import { customerBookingMoney } from '../lib/siteCustomerAccount';
import { bookingConfirmationText } from '../lib/siteBookingConfirmationI18n';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { formatMinutesLabel } from '../lib/siteBookingPayment';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import { formatCurrency } from '../lib/pricing';
import { salonDisplayName } from '../lib/siteBooking';
import { bookingBusinessId } from '../lib/siteBookingFlow';
import { THEME_LABELS } from '../lib/themeServices';
import type { BookingFlowSurface } from '../lib/siteBookingTheme';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  /** The EXISTING booking record being cancelled. */
  record: PaymentRecord;
  /** Keep the booking / dismiss the dialog. */
  onClose: () => void;
  /** Called after a SUCCESSFUL cancellation so the parent refreshes + shows the note. */
  onDone: (successMessage: string) => void;
}

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

export default function CancelBookingDialog({ themeId, data, record, onClose, onDone }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const T = bookingConfirmationText(locale);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const money = customerBookingMoney(record);
  const serviceNames = record.services && record.services.length > 0
    ? record.services.map((line) => line.serviceName)
    : [record.serviceName];
  const salonName = record.businessId === bookingBusinessId(data)
    ? salonDisplayName(data, themeId)
    : THEME_LABELS[record.themeId] || record.businessId;

  const dateLabel = new Date(`${record.dateKey}T12:00:00`).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeLabel = `${formatMinutesLabel(record.startMinutes, locale as any)} – ${formatMinutesLabel(record.endMinutes, locale as any)}`;

  const confirmCancel = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = customerCancelBooking(record.businessId, record.themeId, record.bookingId);
      if (result.ok) {
        onDone(L('Your booking was cancelled.', 'आपकी बुकिंग रद्द कर दी गई।'));
      } else {
        setError(
          result.reason === 'invalid-transition'
            ? L('This booking can no longer be cancelled.', 'यह बुकिंग अब रद्द नहीं की जा सकती।')
            : L('We could not find this booking for your account.', 'आपके खाते के लिए यह बुकिंग नहीं मिली।'),
        );
      }
    } catch {
      setError(L('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया फिर से कोशिश करें।'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [record, onDone, L]);

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={() => { if (!busy) onClose(); }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={L('Cancel this booking?', 'यह बुकिंग रद्द करें?')}
        data-testid="booking-details-cancel-dialog"
        className="w-full max-w-sm rounded-2xl border p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: s.card, borderColor: s.danger, color: s.text }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: s.chip, color: s.danger }}
          >
            <CalendarX className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold" style={{ color: s.textStrong }}>
              {L('Cancel this booking?', 'यह बुकिंग रद्द करें?')}
            </h3>
            <p className="text-[10px] font-semibold truncate" style={{ color: s.muted }}>
              {record.bookingId} · {serviceNames.join(' + ')}
            </p>
          </div>
        </div>

        <div className="space-y-1 rounded-xl border p-3" style={{ borderColor: s.line, backgroundColor: s.well }}>
          <InfoRow s={s} icon={<Sparkles className="w-3 h-3" />} label={L('Salon', 'सैलून')} value={salonName} />
          <InfoRow s={s} icon={<CalendarCheck className="w-3 h-3" />} label={L('Date', 'तारीख़')} value={dateLabel} />
          <InfoRow s={s} icon={<Clock className="w-3 h-3" />} label={L('Time', 'समय')} value={timeLabel} />
          <InfoRow s={s} icon={<Wallet className="w-3 h-3" />} label={L('Advance paid', 'दिया गया एडवांस')} value={formatCurrency(money.advancePaid)} />
          <InfoRow s={s} icon={<Wallet className="w-3 h-3" />} label={L('Remaining', 'शेष')} value={formatCurrency(money.remaining)} />
          <InfoRow
            s={s}
            icon={<CheckCircle2 className="w-3 h-3" />}
            label={L('Payment status', 'भुगतान स्थिति')}
            value={T[`payment.${record.paymentStatus}` as keyof typeof T] || record.paymentStatus}
          />
        </div>

        {/* Honest cancellation/payment rule — no invented refunds. */}
        <div
          className="flex items-start gap-2 p-3 rounded-xl border text-[10px] font-semibold leading-relaxed"
          style={{ borderColor: s.chipLine, backgroundColor: s.well, color: s.muted }}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: s.danger }} />
          <span>
            {L(
              'Cancelling releases this appointment slot. No refund is processed automatically — any advance already paid remains recorded with this booking; refunds are handled directly by the salon.',
              'रद्द करने पर यह अपॉइंटमेंट स्लॉट मुक्त हो जाता है। कोई रिफंड अपने आप प्रोसेस नहीं होता — पहले दिया गया एडवांस इस बुकिंग के साथ दर्ज रहता है; रिफंड सीधे सैलून द्वारा संभाले जाते हैं।',
            )}
          </span>
        </div>

        {error && (
          <div
            data-testid="booking-details-cancel-error"
            className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold leading-relaxed"
            style={{ backgroundColor: s.chip, borderColor: s.danger, color: s.danger }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            data-testid="booking-details-cancel-keep"
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors disabled:opacity-60"
            style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
          >
            {L('Keep booking', 'बुकिंग रखें')}
          </button>
          <button
            type="button"
            data-testid="booking-details-cancel-yes"
            disabled={busy}
            onClick={confirmCancel}
            className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: s.danger, color: '#ffffff', borderColor: s.danger }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarX className="w-4 h-4" />}
            {busy ? L('Cancelling…', 'रद्द हो रहा है…') : L('Cancel booking', 'बुकिंग रद्द करें')}
          </button>
        </div>
      </div>
    </div>
  );
}
