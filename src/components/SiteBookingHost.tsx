import { useEffect, useState } from 'react';
import type { SalonData } from '../types';
import SiteBookingFlow from './SiteBookingFlow';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import {
  BOOKING_TRIGGER_ATTR,
  SITE_BOOKING_CLOSE_EVENT,
  SITE_BOOKING_EVENT,
  closeSiteBooking,
  openSiteBooking,
} from '../lib/siteBooking';

/**
 * PHASE 10.6 — hosts the Book Appointment ENTRY flow inside the themed
 * website frame. There is still exactly ONE booking architecture: header /
 * final / floating Book CTAs dispatch `nexora:open-booking` (and
 * `data-open-booking` clicks), and this host mounts the five-step
 * Service → Date → Time → Details → Summary flow for the ACTIVE theme.
 *
 * `themeId` comes from the renderer so the flow inherits the exact theme
 * identity (services, surfaces, language, dark mode) of the page it opened on.
 */
export default function SiteBookingHost({ themeId, data }: { themeId: SiteHeaderThemeId; data: SalonData }) {
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
      className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ transform: 'translateZ(0)' }}
    >
      <SiteBookingFlow themeId={themeId} data={data} onBackToWebsite={closeSiteBooking} />
    </div>
  );
}
