/**
 * PHASE 17.1 — SALON OWNER DASHBOARD · English / हिन्दी copy.
 *
 * Follows the existing convention (10.3 / 10.5 / 16.7 …): new copy lives in a
 * new namespaced file; existing i18n tables are untouched.
 *
 * 17.1 is the FOUNDATION only, so every section other than Overview carries
 * "coming soon" placeholder copy. No counts, amounts, customer names or
 * booking facts appear anywhere in this table — those arrive with real data
 * in later phases.
 */
import type { AppLocale } from './locale';

const EN = {
  /* Shell */
  'shell.title': 'Owner Dashboard',
  'shell.subtitle': 'Manage your salon',
  'shell.menu': 'Dashboard menu',
  'shell.openMenu': 'Open dashboard menu',
  'shell.closeMenu': 'Close dashboard menu',
  'shell.salonFallback': 'Your salon',
  'shell.noLocation': 'Location not added yet',
  'shell.inactive': 'Inactive',
  'shell.active': 'Live',
  'shell.signedInAs': 'Signed in as owner',
  'shell.refresh': 'Refresh',
  'shell.phase': 'Foundation',

  /* Sections — nav labels */
  'section.overview.label': 'Overview',
  'section.today.label': "Today's Appointments",
  'section.upcoming.label': 'Upcoming Appointments',
  'section.customers.label': 'Customers',
  'section.revenue.label': 'Revenue & Payments',
  'section.calendar.label': 'Calendar',
  'section.notifications.label': 'Notifications',

  /* Sections — headings */
  'section.overview.title': 'Overview',
  'section.today.title': "Today's Appointments",
  'section.upcoming.title': 'Upcoming Appointments',
  'section.customers.title': 'Customers',
  'section.revenue.title': 'Revenue & Payments',
  'section.calendar.title': 'Calendar',
  'section.notifications.title': 'Notifications',

  /* Sections — descriptions */
  'section.overview.description': 'A summary of your salon at a glance.',
  'section.today.description': 'Appointments scheduled at your salon today.',
  'section.upcoming.description': 'Appointments scheduled after today.',
  'section.customers.description': 'People who have booked at your salon.',
  'section.revenue.description': 'Payments collected and pending for your salon.',
  'section.calendar.description': 'Your salon schedule in a calendar view.',
  'section.notifications.description': 'Updates about your salon.',

  /* Overview foundation card */
  'overview.salonCard': 'Your salon',
  'overview.salonName': 'Salon name',
  'overview.location': 'Location',
  'overview.websiteAddress': 'Website address',
  'overview.status': 'Status',
  'overview.notSet': 'Not added yet',
  'overview.sections': 'Dashboard sections',
  'overview.sectionsHint': 'Open a section from the menu.',

  /* Placeholder (17.1 foundation) */
  'placeholder.title': 'Coming next',
  'placeholder.body': 'This section is ready and will be filled in soon.',

  /* PHASE 17.2 — Today's Appointments */
  'today.heading': "Today's Appointments",
  'today.dateLabel': 'Showing',
  'today.loading': "Loading today's appointments…",
  'today.error.title': "Today's appointments could not be loaded",
  'today.error.body': 'Something went wrong while loading your appointments. Please try again.',
  'today.empty.title': 'No appointments today',
  'today.empty.body': 'Bookings made for today will appear here.',
  'today.count.total': 'Total',
  'today.count.pending': 'Pending',
  'today.count.confirmed': 'Confirmed',
  'today.count.completed': 'Completed',
  'today.count.cancelled': 'Cancelled',

  /* Booking status — the EXISTING status values */
  'today.status.pending_payment': 'Pending',
  'today.status.confirmed': 'Confirmed',
  'today.status.pay_at_salon': 'Confirmed · Pay at salon',
  'today.status.completed': 'Completed',
  'today.status.cancelled': 'Cancelled',
  'today.status.failed': 'Payment failed',

  /* Payment status — the EXISTING payment values */
  'today.payment.unpaid': 'Unpaid',
  'today.payment.pending': 'Pending',
  'today.payment.paid': 'Paid',
  'today.payment.failed': 'Failed',
  'today.payment.cancelled': 'Cancelled',
  'today.payment.refunded': 'Refunded',

  /* Row fields */
  'today.field.customer': 'Customer',
  'today.field.services': 'Services',
  'today.field.time': 'Time',
  'today.field.duration': 'Duration',
  'today.field.status': 'Booking status',
  'today.field.paymentStatus': 'Payment status',
  'today.field.total': 'Total',
  'today.field.advance': 'Advance paid',
  'today.field.remaining': 'Remaining',
  'today.field.staff': 'Staff',
  'today.field.bookingId': 'Booking ID',
  'today.unit.hour': 'h',
  'today.unit.minute': 'm',
  'today.noCustomerName': 'Name not provided',
  'today.cancelledNote': 'This appointment was cancelled — the slot is free.',

  /* PHASE 17.3 — Upcoming Appointments */
  'upcoming.heading': 'Upcoming Appointments',
  'upcoming.subtitle': 'Scheduled after today, nearest first.',
  'upcoming.loading': 'Loading upcoming appointments…',
  'upcoming.error.title': 'Upcoming appointments could not be loaded',
  'upcoming.error.body': 'Something went wrong while loading your appointments. Please try again.',
  'upcoming.empty.title': 'No upcoming appointments',
  'upcoming.empty.body': 'Bookings made for future dates will appear here.',
  'upcoming.count.total': 'Total',
  'upcoming.count.days': 'Days',
  'upcoming.group.tomorrow': 'Tomorrow',
  'upcoming.group.later': 'Later',
  'upcoming.group.inDays': 'In {n} days',
  'upcoming.group.count.one': '1 appointment',
  'upcoming.group.count.other': '{n} appointments',
  'upcoming.field.date': 'Date',

  /* Loading / error / empty */
  'state.loading': 'Loading your dashboard…',
  'state.error.title': 'Dashboard could not be loaded',
  'state.error.body': 'Something went wrong while loading your salon. Please try again.',
  'state.retry': 'Try again',
  'state.empty.title': 'Nothing here yet',
  'state.empty.body': 'New activity for your salon will appear here.',

  /* Unauthorized / refusals */
  'denied.title': 'Dashboard unavailable',
  'denied.login': 'Please log in with your owner account to open the dashboard.',
  'denied.noSalon': 'Your account is not linked to a salon.',
  'denied.ambiguous': 'Your account is linked to more than one salon. Please contact support.',
  'denied.permission': 'You do not have permission to view this dashboard.',
  'denied.notConfigured': 'The dashboard is unavailable right now. Please try again later.',
  'denied.error': 'Your salon could not be determined. Please try again.',
} as const;

export type OwnerDashboardTextKey = keyof typeof EN;

const HI: Record<OwnerDashboardTextKey, string> = {
  'shell.title': 'ओनर डैशबोर्ड',
  'shell.subtitle': 'अपना सैलून प्रबंधित करें',
  'shell.menu': 'डैशबोर्ड मेन्यू',
  'shell.openMenu': 'डैशबोर्ड मेन्यू खोलें',
  'shell.closeMenu': 'डैशबोर्ड मेन्यू बंद करें',
  'shell.salonFallback': 'आपका सैलून',
  'shell.noLocation': 'पता अभी नहीं जोड़ा गया',
  'shell.inactive': 'निष्क्रिय',
  'shell.active': 'लाइव',
  'shell.signedInAs': 'मालिक के रूप में साइन इन',
  'shell.refresh': 'रिफ़्रेश करें',
  'shell.phase': 'आधार',

  'section.overview.label': 'अवलोकन',
  'section.today.label': 'आज की अपॉइंटमेंट',
  'section.upcoming.label': 'आगामी अपॉइंटमेंट',
  'section.customers.label': 'ग्राहक',
  'section.revenue.label': 'आय और भुगतान',
  'section.calendar.label': 'कैलेंडर',
  'section.notifications.label': 'सूचनाएँ',

  'section.overview.title': 'अवलोकन',
  'section.today.title': 'आज की अपॉइंटमेंट',
  'section.upcoming.title': 'आगामी अपॉइंटमेंट',
  'section.customers.title': 'ग्राहक',
  'section.revenue.title': 'आय और भुगतान',
  'section.calendar.title': 'कैलेंडर',
  'section.notifications.title': 'सूचनाएँ',

  'section.overview.description': 'आपके सैलून का संक्षिप्त सारांश।',
  'section.today.description': 'आज आपके सैलून में तय अपॉइंटमेंट।',
  'section.upcoming.description': 'आज के बाद तय अपॉइंटमेंट।',
  'section.customers.description': 'वे लोग जिन्होंने आपके सैलून में बुकिंग की है।',
  'section.revenue.description': 'आपके सैलून के प्राप्त और बकाया भुगतान।',
  'section.calendar.description': 'कैलेंडर व्यू में आपके सैलून का शेड्यूल।',
  'section.notifications.description': 'आपके सैलून से जुड़े अपडेट।',

  'overview.salonCard': 'आपका सैलून',
  'overview.salonName': 'सैलून का नाम',
  'overview.location': 'स्थान',
  'overview.websiteAddress': 'वेबसाइट पता',
  'overview.status': 'स्थिति',
  'overview.notSet': 'अभी नहीं जोड़ा गया',
  'overview.sections': 'डैशबोर्ड सेक्शन',
  'overview.sectionsHint': 'मेन्यू से कोई सेक्शन खोलें।',

  'placeholder.title': 'जल्द आ रहा है',
  'placeholder.body': 'यह सेक्शन तैयार है और जल्द ही पूरा किया जाएगा।',

  'today.heading': 'आज की अपॉइंटमेंट',
  'today.dateLabel': 'दिखाया जा रहा है',
  'today.loading': 'आज की अपॉइंटमेंट लोड हो रही हैं…',
  'today.error.title': 'आज की अपॉइंटमेंट लोड नहीं हो सकीं',
  'today.error.body': 'अपॉइंटमेंट लोड करते समय कुछ गड़बड़ी हुई। कृपया फिर से कोशिश करें।',
  'today.empty.title': 'आज कोई अपॉइंटमेंट नहीं',
  'today.empty.body': 'आज के लिए की गई बुकिंग यहाँ दिखाई देंगी।',
  'today.count.total': 'कुल',
  'today.count.pending': 'लंबित',
  'today.count.confirmed': 'पुष्ट',
  'today.count.completed': 'पूर्ण',
  'today.count.cancelled': 'रद्द',

  'today.status.pending_payment': 'लंबित',
  'today.status.confirmed': 'पुष्ट',
  'today.status.pay_at_salon': 'पुष्ट · सैलून में भुगतान',
  'today.status.completed': 'पूर्ण',
  'today.status.cancelled': 'रद्द',
  'today.status.failed': 'भुगतान विफल',

  'today.payment.unpaid': 'अवैतनिक',
  'today.payment.pending': 'लंबित',
  'today.payment.paid': 'भुगतान हो गया',
  'today.payment.failed': 'विफल',
  'today.payment.cancelled': 'रद्द',
  'today.payment.refunded': 'वापस किया गया',

  'today.field.customer': 'ग्राहक',
  'today.field.services': 'सेवाएँ',
  'today.field.time': 'समय',
  'today.field.duration': 'अवधि',
  'today.field.status': 'बुकिंग स्थिति',
  'today.field.paymentStatus': 'भुगतान स्थिति',
  'today.field.total': 'कुल राशि',
  'today.field.advance': 'अग्रिम भुगतान',
  'today.field.remaining': 'शेष राशि',
  'today.field.staff': 'स्टाफ',
  'today.field.bookingId': 'बुकिंग आईडी',
  'today.unit.hour': 'घं',
  'today.unit.minute': 'मि',
  'today.noCustomerName': 'नाम नहीं दिया गया',
  'today.cancelledNote': 'यह अपॉइंटमेंट रद्द कर दी गई — स्लॉट खाली है।',

  'upcoming.heading': 'आगामी अपॉइंटमेंट',
  'upcoming.subtitle': 'आज के बाद तय, सबसे नज़दीकी पहले।',
  'upcoming.loading': 'आगामी अपॉइंटमेंट लोड हो रही हैं…',
  'upcoming.error.title': 'आगामी अपॉइंटमेंट लोड नहीं हो सकीं',
  'upcoming.error.body': 'अपॉइंटमेंट लोड करते समय कुछ गड़बड़ी हुई। कृपया फिर से कोशिश करें।',
  'upcoming.empty.title': 'कोई आगामी अपॉइंटमेंट नहीं',
  'upcoming.empty.body': 'आगे की तारीखों की बुकिंग यहाँ दिखाई देंगी।',
  'upcoming.count.total': 'कुल',
  'upcoming.count.days': 'दिन',
  'upcoming.group.tomorrow': 'कल',
  'upcoming.group.later': 'बाद में',
  'upcoming.group.inDays': '{n} दिनों में',
  'upcoming.group.count.one': '1 अपॉइंटमेंट',
  'upcoming.group.count.other': '{n} अपॉइंटमेंट',
  'upcoming.field.date': 'तारीख',

  'state.loading': 'आपका डैशबोर्ड लोड हो रहा है…',
  'state.error.title': 'डैशबोर्ड लोड नहीं हो सका',
  'state.error.body': 'आपका सैलून लोड करते समय कुछ गड़बड़ी हुई। कृपया फिर से कोशिश करें।',
  'state.retry': 'फिर से कोशिश करें',
  'state.empty.title': 'अभी यहाँ कुछ नहीं है',
  'state.empty.body': 'आपके सैलून की नई गतिविधि यहाँ दिखाई देगी।',

  'denied.title': 'डैशबोर्ड उपलब्ध नहीं है',
  'denied.login': 'डैशबोर्ड खोलने के लिए कृपया अपने ओनर अकाउंट से लॉग इन करें।',
  'denied.noSalon': 'आपका अकाउंट किसी सैलून से जुड़ा नहीं है।',
  'denied.ambiguous': 'आपका अकाउंट एक से अधिक सैलून से जुड़ा है। कृपया सपोर्ट से संपर्क करें।',
  'denied.permission': 'आपको यह डैशबोर्ड देखने की अनुमति नहीं है।',
  'denied.notConfigured': 'डैशबोर्ड अभी उपलब्ध नहीं है। कृपया बाद में कोशिश करें।',
  'denied.error': 'आपका सैलून तय नहीं हो सका। कृपया फिर से कोशिश करें।',
};

const TABLES: Record<AppLocale, Record<OwnerDashboardTextKey, string>> = {
  en: EN,
  hi: HI,
};

/** Localized owner-dashboard copy; falls back to English for any gap. */
export function ownerDashboardText(locale: AppLocale, key: string): string {
  const table = TABLES[locale] ?? EN;
  return (
    (table as Record<string, string>)[key] ??
    (EN as Record<string, string>)[key] ??
    key
  );
}

/** Interpolates `{n}` — used by the upcoming-day group labels. */
export function ownerDashboardCount(locale: AppLocale, key: string, n: number): string {
  return ownerDashboardText(locale, key).replace('{n}', String(n));
}

/** Convenience binder so components read `t('shell.title')`. */
export function ownerDashboardTranslator(locale: AppLocale): (key: string) => string {
  return (key: string) => ownerDashboardText(locale, key);
}
