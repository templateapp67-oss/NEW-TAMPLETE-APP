/**
 * PHASE 20.4 — RESCHEDULE BOOKING · dedicated 3-step flow component.
 *
 * Rendered by `SiteBookingDetails` when the customer taps "Reschedule" on
 * an ELIGIBLE booking (pending / confirmed / pay_at_salon — the existing
 * `customerCanCancel` rule). Flow:
 *
 *   Current booking → Select new date → Load available slots → Select slot
 *   → Review change → Confirm reschedule
 *
 * Dates and slots come from the EXISTING Phase 16 engine
 * (`bookingDayList` / `bookingSlotsForDay` / `bookingAvailabilityExtras`):
 * salon hours, holidays, min-notice, staff windows, holds and REAL booking
 * conflicts are all respected — no fake/random time slots. The final
 * confirmation re-validates the slot inside `customerRescheduleBooking`
 * (authoritative, race-free), so a conflicting appointment can never be
 * saved.
 *
 * Only the appointment slot of the EXISTING record moves — customer, salon,
 * services, reference and payment/advance stay untouched.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { customerRescheduleBooking } from '../lib/bookingManagement';
import { bookingDayList, bookingSlotsForDay } from '../lib/siteBookingFlow';
import type { BookingSlot } from '../lib/siteBookingFlow';
import { bookingAvailabilityExtras } from '../lib/siteBookingAvailability';
import { customerBookingMoney } from '../lib/siteCustomerAccount';
import { toBookingConfirmation } from '../lib/siteBookingConfirmation';
import { bookingConfirmationText } from '../lib/siteBookingConfirmationI18n';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { formatMinutesLabel } from '../lib/siteBookingPayment';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import { formatCurrency } from '../lib/pricing';
import { useTickingNow, weekdayKeyOf } from '../lib/salonStatus';
import { dayLabel } from '../lib/siteI18n';
import { salonDisplayName } from '../lib/siteBooking';
import { bookingBusinessId } from '../lib/siteBookingFlow';
import { THEME_LABELS } from '../lib/themeServices';
import type { BookingFlowSurface } from '../lib/siteBookingTheme';

type RescheduleStep = 'date' | 'time' | 'confirm';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  /** The EXISTING booking record being moved. */
  record: PaymentRecord;
  /** Back to Booking Details (no change made). */
  onBack: () => void;
  /** Close the whole account panel. */
  onClose: () => void;
  /** Called after a SUCCESSFUL reschedule so the parent refreshes + shows the note. */
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

export default function RescheduleBooking({ themeId, data, record, onBack, onClose, onDone }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const T = bookingConfirmationText(locale);
  const now = useTickingNow(30_000);

  const [rsStep, setRsStep] = useState<RescheduleStep>('date');
  const [rsDateKey, setRsDateKey] = useState<string | null>(null);
  const [rsSlotMinutes, setRsSlotMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const money = customerBookingMoney(record);
  const serviceNames = record.services && record.services.length > 0
    ? record.services.map((line) => line.serviceName)
    : [record.serviceName];
  const durationMinutes = Math.max(0, record.endMinutes - record.startMinutes);
  const view = toBookingConfirmation(record);

  const dateLabel = useMemo(
    () => new Date(`${record.dateKey}T12:00:00`).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    [record.dateKey, locale],
  );
  const timeLabel = `${formatMinutesLabel(record.startMinutes, locale as any)} – ${formatMinutesLabel(record.endMinutes, locale as any)}`;

  // ---------- availability from the EXISTING Phase 16 engine ----------
  const serviceIds = useMemo(
    () => (record.services && record.services.length > 0
      ? record.services.map((line) => line.serviceId)
      : [record.serviceId]),
    [record],
  );
  const slotDuration = useMemo(
    () => (record.services && record.services.length > 0
      ? record.services.reduce((sum, line) => sum + line.durationMinutes, 0)
      : durationMinutes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [record],
  );
  const slotService = useMemo(
    () => ({
      id: serviceIds.slice().sort().join('+'),
      duration: Math.max(slotDuration, 1),
    }),
    [serviceIds, slotDuration],
  );
  const selectedDate = rsDateKey ? new Date(`${rsDateKey}T12:00:00`) : null;
  const extras = useMemo(
    () => bookingAvailabilityExtras(
      data,
      record.businessId,
      record.themeId,
      serviceIds.map((id) => ({ id })),
      selectedDate ? weekdayKeyOf(selectedDate) : null,
      record.bookingId, // this booking must not block itself
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, record, selectedDate?.getTime()],
  );
  const days = useMemo(
    () => bookingDayList(data, 14, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, now.getTime()],
  );
  const slots: BookingSlot[] = useMemo(
    () => (selectedDate ? bookingSlotsForDay(data, themeId, slotService, selectedDate, now, extras) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, themeId, slotService.id, slotService.duration, selectedDate?.getTime(), now.getTime(), extras],
  );

  const rsDateLabel = rsDateKey
    ? new Date(`${rsDateKey}T12:00:00`).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';
  const selectedSlot = slots.find((slot) => slot.minutes === rsSlotMinutes) || null;
  const rsCanContinue =
    (rsStep === 'date' && rsDateKey !== null)
    || (rsStep === 'time' && rsSlotMinutes != null)
    || rsStep === 'confirm';
  const noDates = days.every((day) => !day.selectable);

  const stepBack = () => {
    setActionError(null);
    if (rsStep === 'date') { onBack(); return; }
    if (rsStep === 'time') { setRsStep('date'); return; }
    setRsStep('time');
  };

  const reasonMessage = useCallback((reason: string | undefined): string => {
    switch (reason) {
      case 'slot-unavailable':
        return L('That slot is no longer available — please pick another time.', 'वह स्लॉट अब उपलब्ध नहीं है — कृपया दूसरा समय चुनें।');
      case 'same-slot':
        return L('Please choose a different time from your current appointment.', 'कृपया अपनी वर्तमान अपॉइंटमेंट से अलग समय चुनें।');
      case 'invalid-transition':
        return L('This booking can no longer be rescheduled.', 'यह बुकिंग अब पुनर्निर्धारित नहीं की जा सकती।');
      case 'not-found':
        return L('We could not find this booking for your account.', 'आपके खाते के लिए यह बुकिंग नहीं मिली।');
      default:
        return L('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया फिर से कोशिश करें।');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const confirmReschedule = useCallback(() => {
    if (busyRef.current || !rsDateKey || rsSlotMinutes == null) return;
    busyRef.current = true;
    setBusy(true);
    setActionError(null);
    try {
      const result = customerRescheduleBooking({
        businessId: record.businessId,
        themeId: record.themeId,
        bookingId: record.bookingId,
        dateKey: rsDateKey,
        startMinutes: rsSlotMinutes,
        data,
      });
      if (result.ok) {
        onDone(L('Your booking was rescheduled.', 'आपकी बुकिंग पुनर्निर्धारित हो गई।'));
      } else {
        setActionError(reasonMessage(result.reason));
        if (result.reason === 'slot-unavailable') {
          setRsSlotMinutes(null);
          setRsStep('time');
        }
      }
    } catch {
      setActionError(reasonMessage(undefined));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [record, rsDateKey, rsSlotMinutes, data, reasonMessage, onDone, L]);

  return (
    <div className="flex flex-col gap-4" data-testid="booking-reschedule" data-reference={record.bookingId}>
      {/* header */}
      <div className="flex items-center gap-2.5 p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <button
          type="button"
          data-testid="booking-reschedule-back"
          onClick={stepBack}
          aria-label={L('Back', 'वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {L('Reschedule booking', 'बुकिंग पुनर्निर्धारित करें')}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {rsStep === 'date' && L('Step 1 of 3 · choose a new date', 'चरण 1/3 · नई तारीख़ चुनें')}
            {rsStep === 'time' && L('Step 2 of 3 · choose a time', 'चरण 2/3 · समय चुनें')}
            {rsStep === 'confirm' && L('Step 3 of 3 · confirm', 'चरण 3/3 · पुष्टि करें')}
          </p>
        </div>
        <button
          type="button"
          data-testid="booking-reschedule-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* current booking mini summary */}
      <div className="p-3.5 border rounded-xl space-y-1" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
          {L('Current booking', 'वर्तमान बुकिंग')}
        </p>
        <InfoRow s={s} icon={<Sparkles className="w-3 h-3" />} label={L('Service(s)', 'सेवाएँ')} value={serviceNames.join(' + ')} />
        <InfoRow s={s} icon={<CalendarCheck className="w-3 h-3" />} label={L('Date', 'तारीख़')} value={dateLabel} />
        <InfoRow s={s} icon={<Clock className="w-3 h-3" />} label={L('Time', 'समय')} value={timeLabel} />
        <InfoRow s={s} icon={<CalendarClock className="w-3 h-3" />} label={L('Duration', 'अवधि')} value={`${durationMinutes} ${L('min', 'मिनट')}`} />
      </div>

      {actionError && (
        <div
          data-testid="booking-reschedule-error"
          className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold leading-relaxed"
          style={{ backgroundColor: s.chip, borderColor: s.danger, color: s.danger }}
        >
          <CalendarX className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* STEP 1 · date */}
      {rsStep === 'date' && (
        <div className="flex flex-col gap-2">
          {noDates ? (
            <div className="p-5 border rounded-xl text-center flex flex-col items-center gap-2" style={{ backgroundColor: s.card, borderColor: s.line }}>
              <CalendarX className="w-6 h-6" style={{ color: s.muted }} />
              <p className="text-[11px] font-semibold" style={{ color: s.muted }}>
                {L('No available dates within the booking window.', 'बुकिंग विंडो में कोई उपलब्ध तारीख़ नहीं है।')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {days.map((day) => {
                const isSelected = day.dateKey === rsDateKey;
                const selectable = day.selectable;
                const dayName = dayLabel(day.weekday, locale);
                const monthName = day.date.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' });
                const reasonLabel =
                  day.reason === 'holiday'
                    ? L('Holiday', 'अवकाश')
                    : day.reason === 'closed' || day.reason === 'outside-window' || day.reason === 'past'
                      ? L('Closed', 'बंद')
                      : undefined;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    data-testid={`booking-reschedule-date-${day.dateKey}`}
                    data-selectable={selectable}
                    disabled={!selectable}
                    onClick={() => { setRsDateKey(day.dateKey); setRsSlotMinutes(null); setActionError(null); }}
                    className="flex flex-col items-center justify-center px-1 py-2.5 rounded-lg border-2 transition-colors"
                    style={{
                      backgroundColor: isSelected ? s.accentSoft : s.card,
                      borderColor: isSelected ? s.accent : selectable ? s.chipLine : s.disabled,
                      opacity: selectable ? 1 : 0.55,
                      cursor: selectable ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <span className="text-[8px] font-extrabold uppercase tracking-wider truncate max-w-full" style={{ color: isSelected ? s.accent : selectable ? s.muted : s.disabledText }}>
                      {day.isToday ? L('Today', 'आज') : dayName.slice(0, 3)}
                    </span>
                    <span className="text-sm font-black leading-tight my-0.5" style={{ color: isSelected ? s.accent : selectable ? s.textStrong : s.disabledText }}>
                      {day.date.getDate()}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: isSelected ? s.accent : selectable ? s.muted : s.disabledText }}>
                      {monthName}
                    </span>
                    {reasonLabel && (
                      <span className="text-[7px] font-bold uppercase tracking-wide truncate max-w-full mt-0.5" style={{ color: s.disabledText }}>
                        {reasonLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2 · time */}
      {rsStep === 'time' && rsDateKey && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold" style={{ color: s.textStrong }}>{rsDateLabel}</p>
          {slots.length === 0 ? (
            <div className="p-5 border rounded-xl text-center" style={{ backgroundColor: s.card, borderColor: s.line }}>
              <p className="text-[11px] font-semibold" style={{ color: s.muted }}>
                {L('No available slots on this day.', 'इस दिन कोई उपलब्ध स्लॉट नहीं है।')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isCurrent = rsDateKey === record.dateKey && slot.minutes === record.startMinutes;
                const disabled = slot.state === 'past' || slot.state === 'taken' || isCurrent;
                const isSelected = slot.minutes === rsSlotMinutes;
                return (
                  <button
                    key={slot.minutes}
                    type="button"
                    data-testid={`booking-reschedule-slot-${slot.minutes}`}
                    data-slot-state={isCurrent ? 'current' : slot.state}
                    disabled={disabled}
                    onClick={() => { setRsSlotMinutes(slot.minutes); setActionError(null); }}
                    className="py-2.5 px-2 text-center rounded-lg border-2 text-[11px] font-bold transition-colors"
                    style={
                      disabled
                        ? { backgroundColor: s.disabled, borderColor: s.disabled, color: s.disabledText, cursor: 'not-allowed', textDecoration: isCurrent ? 'none' : 'line-through', opacity: 0.7 }
                        : isSelected
                          ? { backgroundColor: s.accent, borderColor: s.accent, color: s.accentText, cursor: 'pointer' }
                          : { backgroundColor: s.card, borderColor: s.chipLine, color: s.textStrong, cursor: 'pointer' }
                    }
                  >
                    {slot.startLabel}
                    {isCurrent && (
                      <span className="block text-[7px] font-bold uppercase tracking-wide mt-0.5" style={{ color: s.disabledText }}>
                        {L('current', 'वर्तमान')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 · confirm */}
      {rsStep === 'confirm' && rsDateKey && rsSlotMinutes != null && selectedSlot && (
        <div className="flex flex-col gap-2">
          <div className="p-3.5 border rounded-xl space-y-1" style={{ backgroundColor: s.card, borderColor: s.line }}>
            <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
              {L('New appointment', 'नई अपॉइंटमेंट')}
            </p>
            <InfoRow s={s} icon={<Building2 className="w-3 h-3" />} label={L('Salon', 'सैलून')} value={salonLabel()} />
            <InfoRow s={s} icon={<CalendarCheck className="w-3 h-3" />} label={L('Existing date', 'मौजूदा तारीख़')} value={dateLabel} />
            <InfoRow s={s} icon={<CalendarClock className="w-3 h-3" />} label={L('New date', 'नई तारीख़')} value={rsDateLabel} />
            <InfoRow s={s} icon={<Clock className="w-3 h-3" />} label={L('Existing time', 'मौजूदा समय')} value={timeLabel} />
            <InfoRow
              s={s}
              icon={<Clock className="w-3 h-3" />}
              label={L('New time', 'नया समय')}
              value={`${selectedSlot.startLabel} – ${selectedSlot.endLabel}`}
            />
            <InfoRow s={s} icon={<Sparkles className="w-3 h-3" />} label={L('Service(s)', 'सेवाएँ')} value={serviceNames.join(' + ')} />
            <InfoRow s={s} icon={<CalendarClock className="w-3 h-3" />} label={L('Duration', 'अवधि')} value={`${durationMinutes} ${L('min', 'मिनट')}`} />
          </div>

          <div className="p-3.5 border rounded-xl space-y-1" style={{ backgroundColor: s.card, borderColor: s.line }}>
            <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
              {L('Payment summary (unchanged)', 'भुगतान सारांश (अपरिवर्तित)')}
            </p>
            <InfoRow s={s} icon={<Wallet className="w-3 h-3" />} label={L('Total amount', 'कुल राशि')} value={formatCurrency(money.total)} />
            <InfoRow s={s} icon={<Wallet className="w-3 h-3" />} label={L('Advance already paid', 'पहले दिया गया एडवांस')} value={formatCurrency(money.advancePaid)} valueColor={money.advancePaid > 0 ? s.success : s.textStrong} />
            <InfoRow s={s} icon={<Wallet className="w-3 h-3" />} label={L('Remaining amount', 'शेष राशि')} value={formatCurrency(money.remaining)} />
            <InfoRow
              s={s}
              icon={<CheckCircle2 className="w-3 h-3" />}
              label={L('Booking status', 'बुकिंग स्थिति')}
              value={T[`state.${view.state}` as keyof typeof T] || view.state}
            />
          </div>
        </div>
      )}

      {/* action bar */}
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="booking-reschedule-back-step"
          onClick={stepBack}
          className="px-4 py-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors"
          style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
        >
          {L('Back', 'वापस')}
        </button>
        {rsStep === 'confirm' ? (
          <button
            type="button"
            data-testid="booking-reschedule-confirm"
            disabled={busy}
            onClick={confirmReschedule}
            className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: s.accent, color: s.accentText }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
            {busy ? L('Saving…', 'सेव हो रहा है…') : L('Confirm Reschedule', 'पुनर्निर्धारण की पुष्टि करें')}
          </button>
        ) : (
          <button
            type="button"
            data-testid="booking-reschedule-continue"
            disabled={!rsCanContinue}
            onClick={() => {
              if (rsStep === 'date' && rsDateKey) { setRsStep('time'); return; }
              if (rsStep === 'time' && rsSlotMinutes != null) { setRsStep('confirm'); return; }
            }}
            className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: rsCanContinue ? s.accent : s.disabled, color: rsCanContinue ? s.accentText : s.disabledText }}
          >
            {L('Continue', 'आगे बढ़ें')}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  /** Salon display name — the current salon's own name when the booking
   * belongs to it, otherwise the theme label (no invented data). */
  function salonLabel(): string {
    return record.businessId === bookingBusinessId(data)
      ? salonDisplayName(data, themeId)
      : THEME_LABELS[record.themeId] || record.businessId;
  }
}
