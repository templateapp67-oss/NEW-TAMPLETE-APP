/**
 * PHASE 20.6 — FAVORITES / SAVED SALONS · customer account sub-view.
 *
 * Lists THIS browser's actually saved salons (from `siteFavorites.ts`,
 * identity resolved internally — another customer's saved salons are
 * structurally unreachable). Every row uses the REAL snapshot taken when
 * the salon was saved: name, logo, theme label, address, tenant key. No
 * fake salon records, no hardcoded lists.
 *
 * Actions: Open/View Salon (the saved salon IS the salon whose website is
 * open — closes the panel) and Remove Favorite (unsaves immediately and
 * the list re-reads from the store).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  Heart,
  Loader2,
  MapPin,
  RefreshCw,
  Scissors,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { FAVORITES_EVENT, readFavoriteSalons, removeFavoriteSalon } from '../lib/siteFavorites';
import type { FavoriteSalon } from '../lib/siteFavorites';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { THEME_LABELS } from '../lib/themeServices';
import { openSiteBooking } from '../lib/siteBooking';

interface Props {
  themeId: SiteHeaderThemeId;
  data?: SalonData;
  onBack: () => void;
  onClose: () => void;
  onViewSalon: () => void;
}

export default function SiteFavorites({ themeId, data: _data, onBack, onClose, onViewSalon }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const [version, setVersion] = useState(0);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(FAVORITES_EVENT, bump);
    return () => window.removeEventListener(FAVORITES_EVENT, bump);
  }, []);

  // Own rows only — identity resolved inside the helper.
  const salons: FavoriteSalon[] = useMemo(
    () => readFavoriteSalons(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const remove = useCallback((salon: FavoriteSalon) => {
    if (removingKey) return;
    setRemovingKey(`${salon.businessId}|${salon.themeId}`);
    setError(null);
    try {
      removeFavoriteSalon(salon.businessId, salon.themeId);
      setVersion((v) => v + 1);
    } catch {
      setError(L('Could not remove this salon. Please try again.', 'यह सैलून हटाया नहीं जा सका। कृपया फिर से कोशिश करें।'));
    } finally {
      setRemovingKey(null);
    }
  }, [removingKey, L]);

  const book = useCallback(() => {
    onViewSalon();
    openSiteBooking();
  }, [onViewSalon]);

  return (
    <div className="flex flex-col gap-4" data-testid="customer-favorites">
      {/* header */}
      <div className="flex items-center gap-2.5 p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <button
          type="button"
          data-testid="customer-favorites-back"
          onClick={onBack}
          aria-label={L('Back to My Account', 'मेरे खाते पर वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {L('Saved Salons', 'सेव किए गए सैलून')}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {salons.length === 1
              ? L('1 saved salon', '1 सेव किया गया सैलून')
              : L(`${salons.length} saved salons`, `${salons.length} सेव किए गए सैलून`)}
          </p>
        </div>
        <button
          type="button"
          data-testid="customer-favorites-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div
          data-testid="customer-favorites-error"
          className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold"
          style={{ backgroundColor: s.chip, borderColor: s.danger, color: s.danger }}
        >
          <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {salons.length === 0 ? (
        /* ---- empty state ---- */
        <div
          data-testid="customer-favorites-empty"
          className="p-6 border rounded-xl text-center flex flex-col items-center gap-2"
          style={{ backgroundColor: s.card, borderColor: s.line }}
        >
          <Heart className="w-8 h-8" style={{ color: s.muted }} />
          <p className="text-xs font-bold" style={{ color: s.muted }}>
            {L('No saved salons yet', 'अभी कोई सेव किया गया सैलून नहीं')}
          </p>
          <p className="text-[10px]" style={{ color: s.muted }}>
            {L(
              'Tap the heart on any salon website to save it here.',
              'किसी भी सैलून की वेबसाइट पर दिल के निशान पर टैप करके उसे यहाँ सेव करें।',
            )}
          </p>
          <button
            type="button"
            data-testid="customer-favorites-empty-book"
            onClick={book}
            className="mt-1 w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110"
            style={{ backgroundColor: s.accent, color: s.accentText }}
          >
            <CalendarCheck className="w-4 h-4" />
            {L('Book an appointment', 'अपॉइंटमेंट बुक करें')}
          </button>
        </div>
      ) : (
        /* ---- list ---- */
        <div className="flex flex-col gap-2 pb-2">
          {salons.map((salon) => {
            const key = `${salon.businessId}|${salon.themeId}`;
            const removing = removingKey === key;
            return (
              <div
                key={key}
                data-testid={`customer-favorite-${salon.businessId}-${salon.themeId}`}
                className="border rounded-xl p-3 flex items-start gap-3"
                style={{ backgroundColor: s.card, borderColor: s.line }}
              >
                {salon.logoUrl ? (
                  <img
                    src={salon.logoUrl}
                    alt=""
                    className="w-10 h-10 rounded-lg object-contain shrink-0 border"
                    style={{ borderColor: s.chipLine }}
                  />
                ) : (
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: s.accentSoft, color: s.accent }}
                  >
                    <Scissors className="w-5 h-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
                    {salon.salonName}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: s.muted }}>
                    {THEME_LABELS[salon.themeId] || salon.themeId}
                  </p>
                  {salon.address && (
                    <p className="flex items-center gap-1 text-[10px] font-semibold truncate" style={{ color: s.muted }}>
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: s.accent }} />
                      {salon.address}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid={`customer-favorite-remove-${salon.businessId}-${salon.themeId}`}
                    disabled={removing}
                    onClick={() => remove(salon)}
                    aria-label={L('Remove from saved salons', 'सेव की गई सूची से हटाएँ')}
                    className="p-2 rounded-lg border cursor-pointer transition-colors disabled:opacity-60"
                    style={{ borderColor: s.chipLine, color: s.danger, backgroundColor: 'transparent' }}
                  >
                    {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    data-testid={`customer-favorite-view-${salon.businessId}-${salon.themeId}`}
                    onClick={onViewSalon}
                    className="px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:brightness-110"
                    style={{ backgroundColor: s.accent, color: s.accentText }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {L('View', 'देखें')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
