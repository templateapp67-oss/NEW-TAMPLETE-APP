/**
 * PHASE 20.1 — CUSTOMER ACCOUNT · English / हिन्दी copy.
 *
 * Follows the existing convention (10.3 / 10.5 / 17.1 / ownerDashboardI18n.ts …):
 * new copy lives in a new namespaced file; existing i18n tables are untouched.
 *
 * Phase 20.1 is the FOUNDATION only — navigation links for future sections
 * (Booking History, Favorites, Reviews, Loyalty) carry "coming soon" placeholders.
 */

import type { AppLocale } from './locale';

type CustomerAccountTextKey =
  // Shell
  | 'shell.title'
  | 'shell.subtitle'
  | 'shell.menu'
  | 'shell.openMenu'
  | 'shell.closeMenu'
  | 'shell.welcome'
  | 'shell.memberSince'
  | 'shell.signOut'
  | 'shell.signIn'
  | 'shell.signUp'
  | 'shell.phase'

  // Navigation
  | 'nav.myBookings'
  | 'nav.bookingHistory'
  | 'nav.profile'
  | 'nav.favorites'
  | 'nav.reviews'
  | 'nav.loyalty'

  // Profile section
  | 'profile.title'
  | 'profile.subtitle'
  | 'profile.name'
  | 'profile.email'
  | 'profile.mobile'
  | 'profile.avatar'
  | 'profile.notSet'
  | 'profile.editComing'
  | 'profile.statsTitle'
  | 'profile.stats.totalBookings'
  | 'profile.stats.completed'
  | 'profile.stats.cancelled'
  | 'profile.stats.pending'

  // My Bookings section
  | 'bookings.title'
  | 'bookings.subtitle'
  | 'bookings.empty.title'
  | 'bookings.empty.body'
  | 'bookings.empty.cta'

  // Booking status
  | 'status.pending_payment'
  | 'status.confirmed'
  | 'status.pay_at_salon'
  | 'status.completed'
  | 'status.cancelled'
  | 'status.failed'

  // Payment status
  | 'payment.unpaid'
  | 'payment.pending'
  | 'payment.paid'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'payment.refunded'

  // Booking fields
  | 'field.bookingId'
  | 'field.services'
  | 'field.date'
  | 'field.time'
  | 'field.duration'
  | 'field.total'
  | 'field.advancePaid'
  | 'field.remaining'
  | 'field.paymentStatus'
  | 'field.bookingStatus'
  | 'field.salon'
  | 'field.unit.hour'
  | 'field.unit.minute'

  // States
  | 'state.loading'
  | 'state.error.title'
  | 'state.error.body'
  | 'state.retry'
  | 'state.empty.title'
  | 'state.empty.body'

  // Denied
  | 'denied.title'
  | 'denied.login'
  | 'denied.notConfigured'
  | 'denied.error'

  // Coming soon placeholders
  | 'comingSoon.title'
  | 'comingSoon.body';

const EN: Record<CustomerAccountTextKey, string> = {
  /* Shell */
  'shell.title': 'My Account',
  'shell.subtitle': 'Manage your bookings and profile',
  'shell.menu': 'Account menu',
  'shell.openMenu': 'Open account menu',
  'shell.closeMenu': 'Close account menu',
  'shell.welcome': 'Welcome',
  'shell.memberSince': 'Member since',
  'shell.signOut': 'Sign Out',
  'shell.signIn': 'Sign In',
  'shell.signUp': 'Sign Up',
  'shell.phase': 'Foundation',

  /* Navigation */
  'nav.myBookings': 'My Bookings',
  'nav.bookingHistory': 'Booking History',
  'nav.profile': 'Profile',
  'nav.favorites': 'Favorites',
  'nav.reviews': 'Reviews',
  'nav.loyalty': 'Rewards',

  /* Profile section */
  'profile.title': 'Profile',
  'profile.subtitle': 'Your personal information',
  'profile.name': 'Name',
  'profile.email': 'Email',
  'profile.mobile': 'Mobile',
  'profile.avatar': 'Profile Photo',
  'profile.notSet': 'Not set',
  'profile.editComing': 'Edit profile coming soon',
  'profile.statsTitle': 'Booking Summary',
  'profile.stats.totalBookings': 'Total Bookings',
  'profile.stats.completed': 'Completed',
  'profile.stats.cancelled': 'Cancelled',
  'profile.stats.pending': 'Pending / Active',

  /* My Bookings section */
  'bookings.title': 'My Bookings',
  'bookings.subtitle': 'Your upcoming and recent appointments',
  'bookings.empty.title': 'No bookings yet',
  'bookings.empty.body': 'When you book an appointment at a salon, it will appear here.',
  'bookings.empty.cta': 'Book an Appointment',

  /* Booking status */
  'status.pending_payment': 'Pending Payment',
  'status.confirmed': 'Confirmed',
  'status.pay_at_salon': 'Pay at Salon',
  'status.completed': 'Completed',
  'status.cancelled': 'Cancelled',
  'status.failed': 'Failed',

  /* Payment status */
  'payment.unpaid': 'Unpaid',
  'payment.pending': 'Pending',
  'payment.paid': 'Paid',
  'payment.failed': 'Failed',
  'payment.cancelled': 'Cancelled',
  'payment.refunded': 'Refunded',

  /* Booking fields */
  'field.bookingId': 'Booking ID',
  'field.services': 'Services',
  'field.date': 'Date',
  'field.time': 'Time',
  'field.duration': 'Duration',
  'field.total': 'Total',
  'field.advancePaid': 'Advance Paid',
  'field.remaining': 'Remaining',
  'field.paymentStatus': 'Payment',
  'field.bookingStatus': 'Status',
  'field.salon': 'Salon',
  'field.unit.hour': 'h',
  'field.unit.minute': 'm',

  /* States */
  'state.loading': 'Loading your account…',
  'state.error.title': 'Could not load your account',
  'state.error.body': 'Something went wrong while loading your account. Please try again.',
  'state.retry': 'Try Again',
  'state.empty.title': 'Nothing here yet',
  'state.empty.body': 'Your bookings will appear here.',

  /* Denied */
  'denied.title': 'Account Unavailable',
  'denied.login': 'Please sign in to access your account.',
  'denied.notConfigured': 'Customer accounts are not available. Please configure Supabase.',
  'denied.error': 'Unable to load your account. Please try again.',

  /* Coming soon placeholders */
  'comingSoon.title': 'Coming Soon',
  'comingSoon.body': 'This feature is being prepared and will be available soon.',
};

const HI: Record<CustomerAccountTextKey, string> = {
  /* Shell */
  'shell.title': 'मेरा खाता',
  'shell.subtitle': 'अपनी बुकिंग और प्रोफ़ाइल प्रबंधित करें',
  'shell.menu': 'खाता मेनू',
  'shell.openMenu': 'खाता मेनू खोलें',
  'shell.closeMenu': 'खाता मेनू बंद करें',
  'shell.welcome': 'स्वागत है',
  'shell.memberSince': 'सदस्य बने',
  'shell.signOut': 'साइन आउट',
  'shell.signIn': 'साइन इन करें',
  'shell.signUp': 'साइन अप करें',
  'shell.phase': 'आधार',
  /* Navigation */
  'nav.myBookings': 'मेरी बुकिंग',
  'nav.bookingHistory': 'बुकिंग इतिहास',
  'nav.profile': 'प्रोफ़ाइल',
  'nav.favorites': 'पसंदीदा',
  'nav.reviews': 'समीक्षाएँ',
  'nav.loyalty': 'रिवॉर्ड्स',
  /* Profile section */
  'profile.title': 'प्रोफ़ाइल',
  'profile.subtitle': 'आपकी व्यक्तिगत जानकारी',
  'profile.name': 'नाम',
  'profile.email': 'ईमेल',
  'profile.mobile': 'मोबाइल',
  'profile.avatar': 'प्रोफ़ाइल फ़ोटो',
  'profile.notSet': 'नहीं दिया गया',
  'profile.editComing': 'प्रोफ़ाइल संपादन जल्द आएगा',
  'profile.statsTitle': 'बुकिंग सारांश',
  'profile.stats.totalBookings': 'कुल बुकिंग',
  'profile.stats.completed': 'पूर्ण',
  'profile.stats.cancelled': 'रद्द',
  'profile.stats.pending': 'लंबित / सक्रिय',
  /* My Bookings section */
  'bookings.title': 'मेरी बुकिंग',
  'bookings.subtitle': 'आपकी आगामी और हाल की अपॉइंटमेंट',
  'bookings.empty.title': 'अभी कोई बुकिंग नहीं',
  'bookings.empty.body': 'जब आप किसी सैलून में अपॉइंटमेंट बुक करेंगे, तो यहाँ दिखेगी।',
  'bookings.empty.cta': 'अपॉइंटमेंट बुक करें',
  /* Booking status */
  'status.pending_payment': 'भुगतान लंबित',
  'status.confirmed': 'पुष्टि हो गई',
  'status.pay_at_salon': 'सैलून में भुगतान',
  'status.completed': 'पूर्ण',
  'status.cancelled': 'रद्द',
  'status.failed': 'विफल',
  /* Payment status */
  'payment.unpaid': 'अवैतनिक',
  'payment.pending': 'लंबित',
  'payment.paid': 'भुगतान हुआ',
  'payment.failed': 'विफल',
  'payment.cancelled': 'रद्द',
  'payment.refunded': 'वापसी',
  /* Booking fields */
  'field.bookingId': 'बुकिंग आईडी',
  'field.services': 'सेवाएँ',
  'field.date': 'तारीख',
  'field.time': 'समय',
  'field.duration': 'अवधि',
  'field.total': 'कुल',
  'field.advancePaid': 'अग्रिम भुगतान',
  'field.remaining': 'शेष',
  'field.paymentStatus': 'भुगतान',
  'field.bookingStatus': 'स्थिति',
  'field.salon': 'सैलून',
  'field.unit.hour': 'घं',
  'field.unit.minute': 'मि',
  /* States */
  'state.loading': 'आपका खाता लोड हो रहा है…',
  'state.error.title': 'आपका खाता लोड नहीं हो सका',
  'state.error.body': 'आपका खाता लोड करते समय कुछ गड़बड़ी हुई। कृपया फिर से कोशिश करें।',
  'state.retry': 'फिर से कोशिश करें',
  'state.empty.title': 'अभी यहाँ कुछ नहीं है',
  'state.empty.body': 'आपकी बुकिंग यहाँ दिखेगी।',
  /* Denied */
  'denied.title': 'खाता उपलब्ध नहीं है',
  'denied.login': 'अपना खाता खोलने के लिए कृपया साइन इन करें।',
  'denied.notConfigured': 'ग्राहक खाते उपलब्ध नहीं हैं। कृपया Supabase कॉन्फ़िगर करें।',
  'denied.error': 'आपका खाता लोड नहीं हो सका। कृपया फिर से कोशिश करें।',
  /* Coming soon placeholders */
  'comingSoon.title': 'जल्द आ रहा है',
  'comingSoon.body': 'यह सुविधा तैयार हो रही है और जल्द उपलब्ध होगी।',
};

const TABLES: Record<AppLocale, Record<CustomerAccountTextKey, string>> = {
  en: EN,
  hi: HI,
};

/**
 * Localized customer account copy; falls back to English for any gap.
 */
export function customerAccountText(locale: AppLocale, key: string): string {
  const table = TABLES[locale] ?? EN;
  return (
    (table as Record<string, string>)[key] ??
    (EN as Record<string, string>)[key] ??
    key
  );
}

/**
 * Convenience binder so components read `t('shell.title')`.
 */
export function customerAccountTranslator(locale: AppLocale): (key: string) => string {
  return (key: string) => customerAccountText(locale, key);
}
