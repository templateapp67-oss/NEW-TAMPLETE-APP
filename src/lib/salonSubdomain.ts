import type { SalonData } from '../types';
import { PLATFORM_DOMAIN } from './platformDomain';

/**
 * Returns the existing salon-name based subdomain shown in website previews.
 * Keeping this in one place ensures every preview and live-site action resolves
 * the same tenant-specific host.
 */
export function salonSubdomain(data: Pick<SalonData, 'salonName'>): string {
  return data.salonName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yoursalon';
}

export function salonLiveHost(data: Pick<SalonData, 'salonName'>): string {
  return `${salonSubdomain(data)}.${PLATFORM_DOMAIN}`;
}

export function salonLiveUrl(data: Pick<SalonData, 'salonName'>): string {
  return `https://${salonLiveHost(data)}`;
}
