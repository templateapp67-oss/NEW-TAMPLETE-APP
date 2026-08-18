/**
 * PHASE 20.7 — REVIEW FORM · submit or edit a review for ONE completed
 * booking.
 *
 * Reuses the EXISTING Phase 10.8 review engine (`submitReview` /
 * `updateReview` in `siteReviews.ts`), which enforces:
 *   - eligibility: only THIS customer's own confirmed/pay_at_salon booking
 *     whose appointment date is today or earlier (cancelled / pending /
 *     future bookings are refused by the engine, not just the UI),
 *   - rating 1–5 and body length (12–800),
 *   - one review per booking (duplicates refused),
 *   - spam + rate limits,
 *   - moderation: new/edited reviews stay `pending` until approved.
 *
 * Editing an existing review only ever touches THIS customer's own review
 * (identity resolved inside `updateReview`).
 */
import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Star, X } from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import type { PaymentRecord } from '../lib/siteBookingPayment';
import type { CustomerReview } from '../lib/siteReviews';
import { submitReview, updateReview, REVIEW_MAX_BODY, REVIEW_MIN_BODY } from '../lib/siteReviews';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { salonDisplayName } from '../lib/siteBooking';
import { bookingBusinessId } from '../lib/siteBookingFlow';
import { THEME_LABELS } from '../lib/themeServices';
import type { BookingFlowSurface } from '../lib/siteBookingTheme';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  /** The completed booking this review belongs to. */
  booking: PaymentRecord;
  /** Existing review (edit mode) or null (new review). */
  existingReview: CustomerReview | null;
  onBack: () => void;
  onClose: () => void;
  /** Called after a successful submit/update so the parent refreshes. */
  onDone: (message: string) => void;
}

export default function SiteReviewForm({ themeId, data, booking, existingReview, onBack, onClose, onDone }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const [rating, setRating] = useState<number>(existingReview?.rating ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [body, setBody] = useState<string>(existingReview?.body ?? '');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const salonName = booking.businessId === bookingBusinessId(data)
    ? salonDisplayName(data, themeId)
    : THEME_LABELS[booking.themeId] || booking.businessId;
  const serviceNames = booking.services && booking.services.length > 0
    ? booking.services.map((line) => line.serviceName)
    : [booking.serviceName];
  const customerName = booking.customer?.name || '';

  const errorMessage = useCallback((code: string): string => {
    switch (code) {
      case 'invalid-rating':
        return L('Please select a star rating (1–5).', 'कृपया स्टार रेटिंग चुनें (1–5)।');
      case 'invalid-body':
        return L(`Review must be ${REVIEW_MIN_BODY}–${REVIEW_MAX_BODY} characters.`, `समीक्षा ${REVIEW_MIN_BODY}–${REVIEW_MAX_BODY} अक्षरों की होनी चाहिए।`);
      case 'invalid-name':
        return L('Please enter your name.', 'कृपया अपना नाम दर्ज करें।');
      case 'duplicate':
        return L('You have already reviewed this booking.', 'आप इस बुकिंग की समीक्षा पहले ही कर चुके हैं।');
      case 'no-eligible-booking':
        return L('This booking is not eligible for a review yet.', 'यह बुकिंग अभी समीक्षा के योग्य नहीं है।');
      case 'spam':
      case 'rate-limited':
        return L('Too many reviews — please try again later.', 'बहुत सारी समीक्षाएँ — कृपया बाद में फिर से कोशिश करें।');
      default:
        return L('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया फिर से कोशिश करें।');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const submit = useCallback(() => {
    if (busyRef.current) return;
    setTouched(true);
    const bodyTrimmed = body.trim();
    if (rating < 1 || rating > 5) {
      setError(errorMessage('invalid-rating'));
      return;
    }
    if (bodyTrimmed.length < REVIEW_MIN_BODY || bodyTrimmed.length > REVIEW_MAX_BODY) {
      setError(errorMessage('invalid-body'));
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (existingReview) {
        const result = updateReview(existingReview.id, { rating, body: bodyTrimmed });
        if (!result.ok) {
          setError(errorMessage(result.error));
        } else {
          onDone(L('Your review was updated.', 'आपकी समीक्षा अपडेट हो गई।'));
        }
      } else {
        const result = submitReview({
          businessId: booking.businessId,
          themeId: booking.themeId,
          bookingId: booking.bookingId,
          rating,
          body: bodyTrimmed,
          customerName,
        });
        if (!result.ok) {
          setError(errorMessage(result.error));
        } else {
          onDone(L('Thank you! Your review was submitted.', 'धन्यवाद! आपकी समीक्षा सबमिट हो गई।'));
        }
      }
    } catch {
      setError(errorMessage('default'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [rating, body, existingReview, booking, customerName, errorMessage, onDone, L]);

  const star = (value: number) => {
    const active = (hover || rating) >= value;
    return (
      <button
        key={value}
        type="button"
        data-testid={`review-star-${value}`}
        data-active={active}
        aria-label={`${value} ${L('star', 'स्टार')}`}
        aria-pressed={rating === value}
        onMouseEnter={() => setHover(value)}
        onMouseLeave={() => setHover(0)}
        onClick={() => { setRating(value); setError(null); }}
        className="p-0.5 cursor-pointer transition-transform hover:scale-110"
      >
        <Star
          className="w-6 h-6"
          style={{ color: active ? '#f5b301' : s.disabledText, fill: active ? '#f5b301' : 'transparent' }}
          aria-hidden="true"
        />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="review-form">
      {/* header */}
      <div className="flex items-center gap-2.5 p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <button
          type="button"
          data-testid="review-form-back"
          onClick={onBack}
          aria-label={L('Back', 'वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {existingReview ? L('Edit your review', 'अपनी समीक्षा संपादित करें') : L('Write a review', 'समीक्षा लिखें')}
          </p>
          <p className="text-[10px] font-semibold truncate" style={{ color: s.muted }}>
            {salonName} · {serviceNames.join(' + ')}
          </p>
        </div>
        <button
          type="button"
          data-testid="review-form-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* rating */}
      <div className="p-4 border rounded-xl space-y-2" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
          {L('Your rating', 'आपकी रेटिंग')} <span style={{ color: s.danger }}>*</span>
        </p>
        <div className="flex items-center gap-0.5" role="radiogroup" aria-label={L('Star rating', 'स्टार रेटिंग')}>
          {[1, 2, 3, 4, 5].map(star)}
        </div>
        {touched && (rating < 1 || rating > 5) && (
          <p className="text-[10px] font-bold" style={{ color: s.danger }}>{errorMessage('invalid-rating')}</p>
        )}
      </div>

      {/* body */}
      <div className="p-4 border rounded-xl space-y-2" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
          {L('Your review', 'आपकी समीक्षा')} <span style={{ color: s.danger }}>*</span>
        </p>
        <textarea
          data-testid="review-form-body"
          rows={5}
          value={body}
          onChange={(e) => { setBody(e.target.value); setError(null); }}
          onBlur={() => setTouched(true)}
          placeholder={L('Tell others about your experience…', 'अपने अनुभव के बारे में बताएं…')}
          className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none resize-none transition-colors"
          style={{ backgroundColor: s.well, borderColor: s.chipLine, color: s.textStrong }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {body.trim().length} / {REVIEW_MAX_BODY}
          </span>
          {touched && (body.trim().length < REVIEW_MIN_BODY || body.trim().length > REVIEW_MAX_BODY) && (
            <span className="text-[10px] font-bold" style={{ color: s.danger }}>{errorMessage('invalid-body')}</span>
          )}
        </div>
      </div>

      {/* name */}
      <div className="p-4 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
          {L('Name shown with review', 'समीक्षा के साथ दिखने वाला नाम')}
        </p>
        <p className="mt-1 text-xs font-bold" style={{ color: s.textStrong }}>
          {customerName || L('Not set', 'सेट नहीं')}
        </p>
      </div>

      {error && (
        <div
          data-testid="review-form-error"
          className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold"
          style={{ backgroundColor: s.chip, borderColor: s.danger, color: s.danger }}
        >
          <X className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          data-testid="review-form-cancel"
          disabled={busy}
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors disabled:opacity-60"
          style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
        >
          {L('Cancel', 'रद्द करें')}
        </button>
        <button
          type="button"
          data-testid="review-form-submit"
          disabled={busy}
          onClick={submit}
          className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: s.accent, color: s.accentText }}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
          {busy ? L('Saving…', 'सेव हो रहा है…') : existingReview ? L('Update Review', 'समीक्षा अपडेट करें') : L('Submit Review', 'समीक्षा सबमिट करें')}
        </button>
      </div>
    </div>
  );
}
