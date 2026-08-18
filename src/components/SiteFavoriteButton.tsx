/**
 * PHASE 20.6 — FAVORITE / HEART button for the salon website.
 *
 * Renders inside the shared floating actions (all five themes) and lets
 * THIS browser save/unsave the salon whose website is open. State comes
 * from the REAL favorites store (`siteFavorites.ts`), identity resolved
 * internally — a heart state can never belong to another customer.
 *
 * The heart is filled + accent-colored when saved, outline otherwise.
 * A single tap saves; tapping again removes. Busy guard prevents
 * double-tap toggles.
 */
import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Heart } from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import {
  FAVORITES_EVENT,
  isSalonFavorite,
  removeFavoriteSalon,
  saveFavoriteSalon,
} from '../lib/siteFavorites';
import { bookingBusinessId } from '../lib/siteBookingFlow';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  /** FAB look + placement supplied by the shared floating-actions host. */
  className: string;
  style?: CSSProperties;
}

export default function SiteFavoriteButton({ themeId, data, className, style }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(FAVORITES_EVENT, bump);
    return () => window.removeEventListener(FAVORITES_EVENT, bump);
  }, []);

  const businessId = bookingBusinessId(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = isSalonFavorite(businessId, themeId);

  const toggle = useCallback(() => {
    if (busy) return;
    setBusy(true);
    try {
      if (isSalonFavorite(businessId, themeId)) {
        removeFavoriteSalon(businessId, themeId);
      } else {
        saveFavoriteSalon(data, themeId);
      }
    } catch {
      /* storage unavailable — state simply stays unchanged */
    } finally {
      setBusy(false);
    }
  }, [busy, businessId, themeId, data]);

  const label = saved
    ? (locale === 'hi' ? 'सेव की गई सूची से हटाएँ' : 'Remove from saved salons')
    : (locale === 'hi' ? 'सैलून सेव करें' : 'Save this salon');

  return (
    <button
      type="button"
      data-testid="site-favorite-button"
      data-saved={saved}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={toggle}
      className={`${className} pointer-events-auto`}
      style={{
        ...style,
        color: saved ? (appearance === 'dark' ? '#ff8fb0' : '#e0245e') : style?.color,
      }}
    >
      <Heart
        className="w-4 h-4"
        style={saved ? { fill: 'currentColor' } : undefined}
        aria-hidden="true"
      />
    </button>
  );
}
