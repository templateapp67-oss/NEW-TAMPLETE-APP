import { useCallback, useEffect, useState } from 'react';
import type { SalonData } from '../types';
import SiteBookingFlow from './SiteBookingFlow';
import SiteBookingPaymentFlow from './SiteBookingPaymentFlow';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { closeSiteBooking } from '../lib/siteBooking';
import { releaseBookingSlot, bookingSlotKey } from '../lib/siteBookingFlow';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import { findPaymentRecord, readPaymentRecordsForBusiness } from '../lib/siteBookingPayment';

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
export default function SiteBookingFullFlow({ themeId, data }: { themeId: SiteHeaderThemeId; data: SalonData }) {
  const [phase, setPhase] = useState<'entry' | 'payment'>('entry');
  const [summary, setSummary] = useState<null | {
    serviceId: string;
    dateKey: string;
    startMinutes: number;
    endMinutes: number;
    customer: { name: string; mobile: string; email: string; notes: string };
  }>(null);

  const handleConfirmEntry = useCallback((payload: {
    service: { id: string };
    dateKey: string;
    startMinutes: number;
    endMinutes: number;
    customer: { name: string; mobile: string; email: string; notes: string };
  }) => {
    setSummary({
      serviceId: payload.service.id,
      dateKey: payload.dateKey,
      startMinutes: payload.startMinutes,
      endMinutes: payload.endMinutes,
      customer: payload.customer,
    });
    setPhase('payment');
  }, []);

  const handleBackToSummary = useCallback(() => {
    setPhase('entry');
  }, []);

  const handleBookingConfirmed = useCallback((_record: PaymentRecord) => {
    // The payment flow now drives confirmation; nothing to do here.
  }, []);

  const handleStartNewBooking = useCallback(() => {
    setSummary(null);
    setPhase('entry');
  }, []);

  const businessId = ((data.services?.[0]?.businessId as string) || (data as unknown as { businessId?: string }).businessId) || 'public-site';
  // Resume a confirmed booking for the same business+theme so a refresh
  // during confirmation does not lose the user's confirmed row. The
  // most-recent confirmed/pay_at_salon record for this business+theme
  // is auto-resumed.
  const existingConfirmed = readPaymentRecordsForBusiness(businessId, themeId).find(
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

  // If the host should auto-resume, swap into the payment phase.
  useEffect(() => {
    if (shouldAutoResume && existingConfirmed) {
      setSummary({
        serviceId: existingConfirmed.serviceId,
        dateKey: existingConfirmed.dateKey,
        startMinutes: existingConfirmed.startMinutes,
        endMinutes: existingConfirmed.endMinutes,
        customer: existingConfirmed.customer,
      });
      setPhase('payment');
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
      {phase === 'entry' && (
        <SiteBookingFlow
          themeId={themeId}
          data={data}
          onBackToWebsite={closeSiteBooking}
          onProceedToPayment={handleConfirmEntry}
        />
      )}
      {phase === 'payment' && summary && (
        <SiteBookingPaymentFlowWrapper
          themeId={themeId}
          data={data}
          summary={summary}
          initialRecord={initialRecord}
          onBackToSummary={handleBackToSummary}
          onBookingConfirmed={handleBookingConfirmed}
          onBackToWebsite={closeSiteBooking}
          onStartNewBooking={handleStartNewBooking}
        />
      )}
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
}: {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  summary: {
    serviceId: string;
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
}) {
  const service = (data.services || []).find((s) => s.id === summary.serviceId);
  if (!service) {
    return (
      <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/40">
        <button
          type="button"
          onClick={onBackToSummary}
          className="px-4 py-2 text-xs font-bold bg-white text-black"
        >
          Service not found — back
        </button>
      </div>
    );
  }
  return (
    <SiteBookingPaymentFlow
      themeId={themeId}
      data={data}
      service={service}
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
