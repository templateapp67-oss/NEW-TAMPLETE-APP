/**
 * PHASE 20.8 — NOTIFICATIONS · customer account sub-view.
 *
 * Shows THIS browser's derived notifications (`readCustomerNotifications`):
 * real events projected from the customer's own booking/payment records and
 * reviews — no fake notification records. Read/unread state is persisted in
 * the app's existing browser-scoped store and is identity-internal, so
 * another customer's notifications / read-state are structurally
 * unreachable.
 *
 * Actions: booking notifications open the EXISTING Booking Details view;
 * review notifications have no navigation (they point at the review's own
 * record). Mark-as-read and Mark-all-as-read only touch THIS customer's
 * read-state.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import {
  CUSTOMER_NOTIFICATION_EVENT,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
  readCustomerNotifications,
} from '../lib/siteCustomerNotifications';
import type { CustomerNotification } from '../lib/siteCustomerNotifications';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';

interface Props {
  themeId: SiteHeaderThemeId;
  data?: SalonData;
  onBack: () => void;
  onClose: () => void;
  /** Open the existing Booking Details view for a booking notification. */
  onOpenBooking: (bookingId: string) => void;
}

export default function SiteNotifications({ themeId, data: _data, onBack, onClose, onOpenBooking }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Loading seam — the source is synchronous today; resolves on the first
  // paint so the loading state is genuine but instant.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(CUSTOMER_NOTIFICATION_EVENT, bump);
    return () => window.removeEventListener(CUSTOMER_NOTIFICATION_EVENT, bump);
  }, []);

  // Derived synchronously from the customer's own real records.
  const notifications: CustomerNotification[] = useMemo(
    () => readCustomerNotifications(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );
  const unread = notifications.filter((n) => !n.isRead).length;

  const dateLabel = useCallback((ts: number): string => {
    return new Date(ts).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }, [locale]);

  const markRead = useCallback((key: string) => {
    try {
      markCustomerNotificationRead(key);
      setVersion((v) => v + 1);
    } catch {
      setError(L('Could not update. Please try again.', 'अपडेट नहीं हो सका। कृपया फिर से कोशिश करें।'));
    }
  }, [L]);

  const markAll = useCallback(() => {
    try {
      markAllCustomerNotificationsRead();
      setVersion((v) => v + 1);
    } catch {
      setError(L('Could not update. Please try again.', 'अपडेट नहीं हो सका। कृपया फिर से कोशिश करें।'));
    }
  }, [L]);

  return (
    <div className="flex flex-col gap-4" data-testid="customer-notifications">
      {/* header */}
      <div className="flex items-center gap-2.5 p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <button
          type="button"
          data-testid="customer-notifications-back"
          onClick={onBack}
          aria-label={L('Back to My Account', 'मेरे खाते पर वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {L('Notifications', 'सूचनाएँ')}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {unread > 0
              ? L(`${unread} unread`, `${unread} बिना पढ़ी`)
              : L('All caught up', 'सब पढ़ लिया गया')}
          </p>
        </div>
        <button
          type="button"
          data-testid="customer-notifications-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div data-testid="customer-notifications-loading" className="space-y-2" aria-busy="true">
          <div className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: s.well }} />
          <div className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: s.well }} />
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {L('Loading notifications…', 'सूचनाएँ लोड हो रही हैं…')}
          </p>
        </div>
      ) : null}

      {error && (
        <div
          data-testid="customer-notifications-error"
          className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold"
          style={{ backgroundColor: s.chip, borderColor: s.danger, color: s.danger }}
        >
          <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notifications.length > 0 && (
        <button
          type="button"
          data-testid="customer-notifications-mark-all"
          disabled={unread === 0}
          onClick={markAll}
          className="self-end px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: s.chipLine, color: s.accent, backgroundColor: 'transparent' }}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          {L('Mark all as read', 'सभी पढ़ी हुई मार्क करें')}
        </button>
      )}

      {notifications.length === 0 ? (
        /* ---- empty state ---- */
        <div
          data-testid="customer-notifications-empty"
          className="p-6 border rounded-xl text-center flex flex-col items-center gap-2"
          style={{ backgroundColor: s.card, borderColor: s.line }}
        >
          <Bell className="w-8 h-8" style={{ color: s.muted }} />
          <p className="text-xs font-bold" style={{ color: s.muted }}>
            {L('No notifications yet', 'अभी कोई सूचना नहीं')}
          </p>
          <p className="text-[10px]" style={{ color: s.muted }}>
            {L(
              'Booking and payment updates will appear here.',
              'बुकिंग और भुगतान अपडेट यहाँ दिखाई देंगे।',
            )}
          </p>
        </div>
      ) : (
        /* ---- list ---- */
        <div className="flex flex-col gap-2 pb-2">
          {notifications.map((notification) => {
            const openable = !!notification.bookingId;
            return (
              <div
                key={notification.key}
                data-testid={`customer-notification-${notification.type}-${notification.bookingId || notification.reviewId || ''}`}
                data-read={notification.isRead}
                className="border rounded-xl p-3 flex items-start gap-3"
                style={{
                  backgroundColor: notification.isRead ? s.card : s.accentSoft,
                  borderColor: notification.isRead ? s.line : s.accentLine,
                }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: s.well, color: notification.isRead ? s.muted : s.accent }}
                >
                  {notification.isRead ? <Bell className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.accent }}
                        aria-label={L('Unread', 'बिना पढ़ी')}
                      />
                    )}
                  </div>
                  <p className="text-[11px] font-semibold leading-relaxed" style={{ color: s.muted }}>
                    {notification.message}
                  </p>
                  <p className="text-[9px] font-semibold" style={{ color: s.disabledText }}>
                    {dateLabel(notification.occurredAt)}
                  </p>
                  <div className="flex gap-2 pt-1">
                    {openable && (
                      <button
                        type="button"
                        data-testid={`customer-notification-open-${notification.bookingId}`}
                        onClick={() => { markRead(notification.key); onOpenBooking(notification.bookingId as string); }}
                        className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:brightness-110"
                        style={{ backgroundColor: s.accent, color: s.accentText }}
                      >
                        <ChevronRight className="w-3 h-3" />
                        {L('Open Booking', 'बुकिंग खोलें')}
                      </button>
                    )}
                    {!notification.isRead && (
                      <button
                        type="button"
                        data-testid={`customer-notification-mark-${notification.type}-${notification.bookingId || notification.reviewId || ''}`}
                        onClick={() => markRead(notification.key)}
                        className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer transition-colors"
                        style={{ borderColor: s.chipLine, color: s.muted, backgroundColor: 'transparent' }}
                      >
                        <Check className="w-3 h-3" />
                        {L('Mark read', 'पढ़ी हुई')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
