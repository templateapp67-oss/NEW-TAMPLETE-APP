/**
 * PHASE 10.4 — booking + contact helpers for the public website.
 *
 * Opens the EXISTING `CustomerBookingPreview` flow (no second booking system).
 * Header Book Appointment from Phase 10.1 still scrolls to `section-contact`;
 * in-page / final / floating Book CTAs dispatch this event instead.
 *
 * No database or service/theme-data changes.
 */
import type { SalonData } from '../types';

export const SITE_BOOKING_EVENT = 'nexora:open-booking';
export const SITE_BOOKING_CLOSE_EVENT = 'nexora:close-booking';
export const BOOKING_TRIGGER_ATTR = 'data-open-booking';

export function digitsOnly(value: string | undefined | null): string {
  return (value || '').replace(/\D/g, '');
}

export function canCall(data: SalonData): boolean {
  return (!data.contactOptions || data.contactOptions.callNow !== false) && digitsOnly(data.phone).length > 0;
}

export function canWhatsApp(data: SalonData): boolean {
  return (!data.contactOptions || data.contactOptions.whatsapp !== false)
    && digitsOnly(data.whatsappPhone || data.phone).length > 0;
}

export function canBookOnline(data: SalonData): boolean {
  return !data.contactOptions || data.contactOptions.bookNow !== false;
}

export function salonTelHref(data: SalonData): string {
  const raw = (data.phone || '').trim();
  return raw ? `tel:${raw}` : 'tel:';
}

export function salonWhatsAppHref(data: SalonData): string {
  const phone = digitsOnly(data.whatsappPhone || data.phone);
  return phone ? `https://wa.me/${phone}` : 'https://wa.me/';
}

export function salonMapsHref(data: SalonData): string {
  const q = (data.address?.fullAddress || '').trim();
  return q ? `https://maps.google.com/?q=${encodeURIComponent(q)}` : '#section-location';
}

export function openSiteBooking(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SITE_BOOKING_EVENT));
}

export function closeSiteBooking(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SITE_BOOKING_CLOSE_EVENT));
}

/** Props for any in-page control that should open the existing booking flow. */
export function bookingTriggerProps(): { 'data-open-booking': 'true'; type: 'button' } {
  return { 'data-open-booking': 'true', type: 'button' };
}

export function scrollSiteToTop(): void {
  if (typeof document === 'undefined') return;
  const scroller = document.querySelector('.site-scroll') as HTMLElement | null;
  if (scroller && typeof scroller.scrollTo === 'function') {
    try {
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    } catch {
      scroller.scrollTop = 0;
      return;
    }
  }
  const fallback = document.getElementById('section-hero') || document.getElementById('section-header');
  if (fallback && typeof fallback.scrollIntoView === 'function') {
    try {
      fallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      fallback.scrollIntoView();
    }
  }
}

export const THEME_FALLBACK_NAME: Record<string, string> = {
  barber_mens_grooming: 'The Grooming Co.',
  hair_studio_color_bar: 'Atelier Hair Studio',
  beauty_skin_spa: 'Serenity Beauty & Spa',
  family_full_service: 'The Family Salon',
  nail_lash_studio: 'The Glow Edit',
};

export function salonDisplayName(data: SalonData, themeId: string): string {
  return data.salonName || THEME_FALLBACK_NAME[themeId] || 'Salon';
}
