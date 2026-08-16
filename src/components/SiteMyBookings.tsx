/**
 * PHASE 16.7 — CUSTOMER "MY BOOKINGS" · public-site surface.
 *
 * Lists THIS visitor's own bookings at the ACTIVE salon + theme, with the
 * current status, full details and a cancel action for not-yet-completed
 * bookings. Identity/scoping rules live in `bookingManagement.ts`
 * (`readMyBookings` reads the browser identity internally), so another
 * customer's private rows are structurally unreachable — this component
 * only filters the visitor's OWN rows down to the active salon + theme.
 *
 * Mounted inside the existing booking flow (salon step), so it inherits
 * the exact theme surfaces, EN/HI locale and light/dark appearance of the
 * page it opened on. Loading / error states reuse the shared section seam
 * ('booking'), the same one the 16.3 availability states use.
 */
import { useMemo, useState } from 'react';
import { Calendar, CalendarX, Clock, CreditCard, RefreshCw, Sparkles, User } from 'lucide-react';
import type { SalonData } from '../types';
import { formatCurrency } from '../lib/pricing';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { bookingManagementText } from '../lib/bookingManagementI18n';
import {
  bookingMoney,
  bookingServiceNames,
  customerCanCancel,
  customerCancelBooking,
  readMyBookings,
  sortBookingsForList,
} from '../lib/bookingManagement';
import { formatMinutesLabel, PAYMENT_EVENT } from '../lib/siteBookingPayment';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import { injectedSectionStatus } from '../lib/siteStructure';
import { salonDisplayName } from '../lib/siteBooking';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { useEffect } from 'react';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  businessId: string;
  onShowToast?: (msg: string) => void;
}

export default function SiteMyBookings({ themeId, data, businessId, onShowToast }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const T = bookingManagementText(locale);
  const s = bookingSurfaces(themeId, appearance);

  const [version, setVersion] = useState(0);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(PAYMENT_EVENT, bump);
    return () => window.removeEventListener(PAYMENT_EVENT, bump);
  }, []);

  // Shared seam: loading / error forceable exactly like the other booking states.
  const state: 'loading' | 'error' | 'ready' = useMemo(() => {
    const forced = injectedSectionStatus('booking');
    if (forced === 'loading' || forced === 'error') return forced;
    return 'ready';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry, version]);

  // OWN rows only (identity read inside the helper), narrowed to the
  // active salon + theme — a different salon's rows never render here.
  const bookings = useMemo(
    () => sortBookingsForList(
      readMyBookings().filter((r) => r.businessId === businessId && r.themeId === themeId),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [businessId, themeId, version],
  );

  const cancelBooking = (record: PaymentRecord) => {
    if (typeof window !== 'undefined' && !window.confirm(T['customer.cancelConfirm'])) return;
    const result = customerCancelBooking(businessId, themeId, record.bookingId);
    onShowToast?.(result.ok ? T['customer.cancelled'] : T['customer.cancelFailed']);
    setVersion((v) => v + 1);
  };

  if (state === 'ready' && bookings.length === 0) {
    // No block at all when the visitor has never booked here — the salon
    // step stays exactly as it was before 16.7.
    return null;
  }

  const dateLabel = (dateKey: string) =>
    new Date(`${dateKey}T12:00:00`).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });

  return (
    <div
      data-testid="my-bookings"
      className="p-4 md:p-5 flex flex-col gap-3 border rounded-xl"
      style={{ backgroundColor: s.card, borderColor: s.line }}
    >
      <div>
        <h2 className="text-sm font-extrabold" style={{ color: s.textStrong }}>{T['customer.title']}</h2>
        <p className="text-[10px] font-semibold mt-0.5" style={{ color: s.muted }}>{T['customer.subtitle']}</p>
      </div>

      {state === 'loading' && (
        <div data-testid="my-bookings-loading" aria-busy="true" className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: s.well }} />
          ))}
          <p className="text-xs font-semibold" style={{ color: s.muted }}>{T['customer.loading']}</p>
        </div>
      )}

      {state === 'error' && (
        <div data-testid="my-bookings-error" className="flex flex-col items-start gap-2">
          <p className="text-xs font-semibold" style={{ color: s.danger }}>{T['customer.error']}</p>
          <button
            type="button"
            data-testid="my-bookings-retry"
            onClick={() => setRetry((v) => v + 1)}
            className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 border rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
          >
            <RefreshCw className="w-3 h-3" />
            {T['customer.retry']}
          </button>
        </div>
      )}

      {state === 'ready' && bookings.map((record) => {
        const money = bookingMoney(record);
        const names = bookingServiceNames(record);
        const statusKey = `status.${record.bookingStatus}` as keyof typeof T;
        const payKey = `payment.${record.paymentStatus}` as keyof typeof T;
        const isTerminal = record.bookingStatus === 'cancelled' || record.bookingStatus === 'failed';
        return (
          <div
            key={record.id}
            data-testid={`my-booking-${record.bookingId}`}
            data-status={record.bookingStatus}
            className="border rounded-lg p-3 flex flex-col gap-2"
            style={{
              backgroundColor: isTerminal ? s.well : s.card,
              borderColor: isTerminal ? s.chipLine : s.line,
              opacity: isTerminal ? 0.75 : 1,
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold" style={{ color: s.muted }}>
                {T['field.bookingId']}: <span style={{ color: s.textStrong }}>{record.bookingId}</span>
              </span>
              <span
                data-testid={`my-booking-status-${record.bookingId}`}
                className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: record.bookingStatus === 'completed' || record.bookingStatus === 'confirmed' || record.bookingStatus === 'pay_at_salon'
                    ? s.successSoft
                    : isTerminal ? s.chip : s.accentSoft,
                  color: record.bookingStatus === 'completed' || record.bookingStatus === 'confirmed' || record.bookingStatus === 'pay_at_salon'
                    ? s.success
                    : isTerminal ? s.muted : s.accent,
                }}
              >
                {T[statusKey]}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-xs font-semibold" style={{ color: s.text }}>
              <span className="flex items-center gap-1.5">
                <User className="w-3 h-3 shrink-0" style={{ color: s.accent }} />
                {salonDisplayName(data, themeId)}
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 shrink-0" style={{ color: s.accent }} />
                {names.join(' + ')}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 shrink-0" style={{ color: s.accent }} />
                {dateLabel(record.dateKey)}
                <Clock className="w-3 h-3 shrink-0 ml-1" style={{ color: s.accent }} />
                {formatMinutesLabel(record.startMinutes, locale)} – {formatMinutesLabel(record.endMinutes, locale)}
              </span>
              <span className="flex items-center gap-1.5 flex-wrap">
                <CreditCard className="w-3 h-3 shrink-0" style={{ color: s.accent }} />
                <span>{T['field.total']}: <b style={{ color: s.textStrong }}>{formatCurrency(money.total)}</b></span>
                <span>· {T['field.advance']}: <b style={{ color: s.textStrong }}>{formatCurrency(money.advancePaid)}</b></span>
                <span>· {T['field.remaining']}: <b style={{ color: s.textStrong }}>{formatCurrency(money.remaining)}</b></span>
                <span>· {T['field.paymentStatus']}: <b style={{ color: s.textStrong }}>{T[payKey]}</b></span>
              </span>
            </div>

            {customerCanCancel(record) && (
              <button
                type="button"
                data-testid={`my-booking-cancel-${record.bookingId}`}
                onClick={() => cancelBooking(record)}
                className="self-start text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 border rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                style={{ borderColor: s.danger, color: s.danger, backgroundColor: 'transparent' }}
              >
                <CalendarX className="w-3 h-3" />
                {T['customer.cancel']}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
