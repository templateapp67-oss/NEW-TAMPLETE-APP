import type { Package, Service, ServiceOffer } from '../types';

export const PROMOTIONAL_BADGES = [
  '20% OFF',
  'Festive Special',
  'Best Seller',
  'New',
  'Limited Time',
  'Premium',
] as const;

export type PromotionalBadgePreset = (typeof PROMOTIONAL_BADGES)[number];

/** Local YYYY-MM-DD value, matching PostgreSQL current_date semantics. */
export function todayDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Client-side mirror of M24's database effective-status function. The database
 * remains authoritative; this makes an already-open preview expire correctly
 * when the date changes without applying an expired offer for one extra render.
 */
export function getOfferEffectiveStatus(
  offer: ServiceOffer,
  today = todayDateKey(),
): ServiceOffer['effectiveStatus'] {
  if (offer.status === 'archived') return 'archived';
  if (offer.status !== 'active') return 'inactive';
  if (offer.endDate < today) return 'expired';
  if (offer.startDate > today) return 'scheduled';
  return 'active';
}

export function isOfferActive(offer: ServiceOffer, today = todayDateKey()): boolean {
  return getOfferEffectiveStatus(offer, today) === 'active';
}

export function offerAppliesToService(offer: ServiceOffer, service: Service): boolean {
  if (!service.themeId || offer.themeId !== service.themeId) return false;
  switch (offer.targetType) {
    case 'theme':
      return true;
    case 'category':
      return Boolean(service.categoryId) && offer.categoryId === service.categoryId;
    case 'predefined_service':
      return Boolean(service.predefinedServiceId)
        && offer.predefinedServiceId === service.predefinedServiceId;
    case 'saved_service':
      return offer.savedServiceId === service.id;
    case 'bundle':
      return false;
  }
}

export function offerAppliesToBundle(offer: ServiceOffer, bundle: Package): boolean {
  if (!bundle.themeId || offer.themeId !== bundle.themeId) return false;
  if (offer.targetType === 'theme') return true;
  return offer.targetType === 'bundle' && offer.packageId === bundle.id;
}

export function discountedPrice(price: number, offer?: ServiceOffer): number {
  if (!offer) return price;
  const discounted = offer.discountType === 'percentage'
    ? price * (1 - offer.discountValue / 100)
    : price - offer.discountValue;
  return Math.max(0, Math.round(discounted * 100) / 100);
}

function offerSaving(price: number, offer: ServiceOffer): number {
  return price - discountedPrice(price, offer);
}

/** Picks the applicable active offer that gives the customer the largest saving. */
export function bestServiceOffer(
  service: Service,
  offers: ServiceOffer[] = [],
  price = service.price,
): ServiceOffer | undefined {
  return offers
    .filter((offer) => isOfferActive(offer) && offerAppliesToService(offer, service))
    .sort((a, b) => offerSaving(price, b) - offerSaving(price, a))[0];
}

export function bestBundleOffer(
  bundle: Package,
  offers: ServiceOffer[] = [],
): ServiceOffer | undefined {
  return offers
    .filter((offer) => isOfferActive(offer) && offerAppliesToBundle(offer, bundle))
    .sort((a, b) => offerSaving(bundle.price, b) - offerSaving(bundle.price, a))[0];
}

export function serviceDisplayPrice(
  service: Service,
  offers: ServiceOffer[] = [],
  variantId?: string | null,
): { basePrice: number; finalPrice: number; offer?: ServiceOffer; variantName?: string } {
  const variant = variantId
    ? service.pricingVariants?.find((item) => item.id === variantId && item.status === 'active')
    : undefined;
  const basePrice = variant?.price ?? service.price;
  const offer = bestServiceOffer(service, offers, basePrice);
  return {
    basePrice,
    finalPrice: discountedPrice(basePrice, offer),
    offer,
    variantName: variant?.name,
  };
}

export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
