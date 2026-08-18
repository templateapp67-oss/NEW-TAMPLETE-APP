/**
 * PHASE 20.7 — MY REVIEWS · customer account sub-view.
 *
 * Lists THIS browser's own reviews (from the EXISTING Phase 10.8 review
 * store via `readMyReviews()`, identity resolved internally). Each row
 * shows the salon, service, star rating, review text, review date and the
 * existing moderation status (pending / approved / rejected). Actions:
 * View Salon, and Edit where the review may still be edited.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { REVIEW_EVENT, REVIEW_REFRESH_EVENTS, readMyReviews } from '../lib/siteReviews';
import type { CustomerReview } from '../lib/siteReviews';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { THEME_LABELS } from '../lib/themeServices';
import type { BookingFlowSurface } from '../lib/siteBookingTheme';

interface Props {
  themeId: SiteHeaderThemeId;
  data?: SalonData;
  onBack: () => void;
  onClose: () => void;
  onViewSalon: () => void;
  /** Open the review form for an existing review (edit). */
  onEdit: (review: CustomerReview) => void;
}

export default function SiteMyReviews({ themeId, data: _data, onBack, onClose, onViewSalon, onEdit }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(REVIEW_EVENT, bump);
    window.addEventListener(REVIEW_REFRESH_EVENTS[1], bump); // PAYMENT_EVENT
    return () => {
      window.removeEventListener(REVIEW_EVENT, bump);
      window.removeEventListener(REVIEW_REFRESH_EVENTS[1], bump);
    };
  }, []);

  const reviews: CustomerReview[] = useMemo(
    () => readMyReviews(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const statusLabel = useCallback((status: CustomerReview['status']): string => {
    if (status === 'approved') return L('Approved', 'स्वीकृत');
    if (status === 'rejected') return L('Not published', 'प्रकाशित नहीं');
    return L('Pending approval', 'अनुमोदन लंबित');
  }, [L]);

  const statusColor = useCallback((status: CustomerReview['status'], s: BookingFlowSurface): string => {
    if (status === 'approved') return s.success;
    if (status === 'rejected') return s.danger;
    return s.muted;
  }, []);

  const statusBg = useCallback((status: CustomerReview['status'], s: BookingFlowSurface): string => {
    if (status === 'approved') return s.successSoft;
    if (status === 'rejected') return s.chip;
    return s.well;
  }, []);

  const dateLabel = useCallback((ts: number): string => {
    return new Date(ts).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }, [locale]);

  return (
    <div className="flex flex-col gap-4" data-testid="customer-reviews">
      {/* header */}
      <div className="flex items-center gap-2.5 p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <button
          type="button"
          data-testid="customer-reviews-back"
          onClick={onBack}
          aria-label={L('Back to My Account', 'मेरे खाते पर वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {L('My Reviews', 'मेरी समीक्षाएँ')}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {reviews.length === 1
              ? L('1 review', '1 समीक्षा')
              : L(`${reviews.length} reviews`, `${reviews.length} समीक्षाएँ`)}
          </p>
        </div>
        <button
          type="button"
          data-testid="customer-reviews-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {reviews.length === 0 ? (
        /* ---- empty state ---- */
        <div
          data-testid="customer-reviews-empty"
          className="p-6 border rounded-xl text-center flex flex-col items-center gap-2"
          style={{ backgroundColor: s.card, borderColor: s.line }}
        >
          <Star className="w-8 h-8" style={{ color: s.muted }} />
          <p className="text-xs font-bold" style={{ color: s.muted }}>
            {L('No reviews yet', 'अभी कोई समीक्षा नहीं')}
          </p>
          <p className="text-[10px]" style={{ color: s.muted }}>
            {L(
              'After a completed appointment, you can review the salon from the booking.',
              'पूरी हो चुकी अपॉइंटमेंट के बाद आप बुकिंग से सैलून की समीक्षा कर सकते हैं।',
            )}
          </p>
        </div>
      ) : (
        /* ---- list ---- */
        <div className="flex flex-col gap-2 pb-2">
          {reviews.map((review) => {
            const status = statusLabel(review.status);
            const color = statusColor(review.status, s);
            const bg = statusBg(review.status, s);
            return (
              <div
                key={review.id}
                data-testid={`customer-review-${review.bookingId}`}
                data-status={review.status}
                className="border rounded-xl p-3 flex flex-col gap-2"
                style={{ backgroundColor: s.card, borderColor: s.line }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
                    {THEME_LABELS[review.themeId] || review.themeId}
                  </p>
                  <span
                    className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: bg, color }}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className="w-3.5 h-3.5"
                      style={{ color: n <= review.rating ? '#f5b301' : s.disabledText, fill: n <= review.rating ? '#f5b301' : 'transparent' }}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="ml-1 text-[10px] font-bold" style={{ color: s.muted }}>
                    {review.rating}/5
                  </span>
                </div>
                <p className="text-[11px] font-semibold leading-relaxed" style={{ color: s.text }}>
                  “{review.body}”
                </p>
                {review.serviceName && (
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: s.muted }}>
                    {review.serviceName}
                  </p>
                )}
                <p className="text-[9px] font-semibold" style={{ color: s.muted }}>
                  {dateLabel(review.createdAt)} · {review.customerName}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    data-testid={`customer-review-edit-${review.bookingId}`}
                    onClick={() => onEdit(review)}
                    className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer transition-colors"
                    style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
                  >
                    <Pencil className="w-3 h-3" />
                    {L('Edit', 'संपादित करें')}
                  </button>
                  <button
                    type="button"
                    data-testid={`customer-review-view-${review.bookingId}`}
                    onClick={onViewSalon}
                    className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:brightness-110"
                    style={{ backgroundColor: s.accent, color: s.accentText }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {L('View Salon', 'सैलून देखें')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* hint */}
      <p className="text-[9px] font-medium text-center" style={{ color: s.disabledText }}>
        {L(
          'Reviews are shown on the salon website after approval.',
          'समीक्षाएँ अनुमोदन के बाद सैलून वेबसाइट पर दिखाई जाती हैं।',
        )}
      </p>
    </div>
  );
}
