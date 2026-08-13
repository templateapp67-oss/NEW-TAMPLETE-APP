import { useEffect, useState } from 'react';
import type { SalonData } from '../types';
import CustomerBookingPreview from './CustomerBookingPreview';
import {
  BOOKING_TRIGGER_ATTR,
  SITE_BOOKING_CLOSE_EVENT,
  SITE_BOOKING_EVENT,
  closeSiteBooking,
  openSiteBooking,
} from '../lib/siteBooking';

/**
 * PHASE 10.4 — hosts the EXISTING customer booking flow inside the
 * themed website frame. Nothing new is invented here; we only listen
 * for `nexora:open-booking` (and `data-open-booking` clicks) and mount
 * `CustomerBookingPreview`.
 */
export default function SiteBookingHost({ data }: { data: SalonData }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    window.addEventListener(SITE_BOOKING_EVENT, show);
    window.addEventListener(SITE_BOOKING_CLOSE_EVENT, hide);
    return () => {
      window.removeEventListener(SITE_BOOKING_EVENT, show);
      window.removeEventListener(SITE_BOOKING_CLOSE_EVENT, hide);
    };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;
      const trigger = target.closest(`[${BOOKING_TRIGGER_ATTR}]`);
      if (!trigger) return;
      event.preventDefault();
      openSiteBooking();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (!open) return null;

  return (
    <div
      data-testid="site-booking-flow"
      className="absolute inset-0 z-[70] flex flex-col overflow-hidden bg-[#f9f9f9]"
      style={{ transform: 'translateZ(0)' }}
    >
      <CustomerBookingPreview data={data} onBackToWebsite={closeSiteBooking} />
    </div>
  );
}
