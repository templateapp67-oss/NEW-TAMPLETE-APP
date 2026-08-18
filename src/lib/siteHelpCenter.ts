/**
 * PHASE 20.9 — HELP CENTER · FAQ content + contact derivation.
 *
 * FAQ answers describe ONLY functionality that actually exists in this
 * application (booking flow, payments, reschedule/cancel, profile,
 * favorites, reviews, notifications) and NEVER invent policies, refund
 * rules, payment guarantees or salon rules. Contact options are derived
 * from the REAL `SalonData` the salon published — no invented phone
 * numbers, WhatsApp numbers, emails or URLs.
 *
 * There is NO support-ticket backend in the current architecture (no
 * support table, no ticket system — the draft `notifications`/`bookings`
 * migrations are unapplied). This module therefore exposes contact
 * actions only, and the UI states honestly that support requests are not
 * persisted.
 */
import type { SalonData } from '../types';
import { canCall, canWhatsApp, salonTelHref, salonWhatsAppHref } from './siteBooking';

/* ------------------------------------------------------------------ */
/* FAQ model                                                           */
/* ------------------------------------------------------------------ */

export type HelpCategoryId =
  | 'booking'
  | 'payment'
  | 'reschedule'
  | 'account'
  | 'salon'
  | 'general';

export const HELP_CATEGORIES: Array<{ id: HelpCategoryId; labelEn: string; labelHi: string }> = [
  { id: 'booking', labelEn: 'Booking Help', labelHi: 'बुकिंग सहायता' },
  { id: 'payment', labelEn: 'Payment Help', labelHi: 'भुगतान सहायता' },
  { id: 'reschedule', labelEn: 'Reschedule & Cancellation', labelHi: 'पुनर्निर्धारण और रद्दीकरण' },
  { id: 'account', labelEn: 'Account & Profile', labelHi: 'खाता और प्रोफ़ाइल' },
  { id: 'salon', labelEn: 'Salon Help', labelHi: 'सैलून सहायता' },
  { id: 'general', labelEn: 'General', labelHi: 'सामान्य' },
];

export interface HelpFaq {
  id: string;
  category: HelpCategoryId;
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
}

/** FAQ answers that describe ONLY existing functionality. */
export const HELP_FAQS: HelpFaq[] = [
  /* ---- booking ---- */
  {
    id: 'booking-how',
    category: 'booking',
    questionEn: 'How do I book an appointment?',
    questionHi: 'मैं अपॉइंटमेंट कैसे बुक करूँ?',
    answerEn: 'Tap Book Appointment, then choose the salon, service, date, time and your details, review the summary and confirm. Depending on the payment option you pick, you may need to complete an advance payment before the booking is confirmed.',
    answerHi: 'बुक अपॉइंटमेंट पर टैप करें, फिर सैलून, सेवा, तारीख़, समय और अपना विवरण चुनें, सारांश देखें और पुष्टि करें। आपके चुने भुगतान विकल्प के अनुसार बुकिंग पक्की होने से पहले एडवांस भुगतान पूरा करना पड़ सकता है।',
  },
  {
    id: 'booking-where',
    category: 'booking',
    questionEn: 'Where can I see my bookings?',
    questionHi: 'मैं अपनी बुकिंग कहाँ देख सकता/सकती हूँ?',
    answerEn: 'Open My Bookings in this account. Each booking opens a detail view with the full summary and receipt.',
    answerHi: 'इस खाते में मेरी बुकिंग खोलें। हर बुकिंग से पूरा विवरण और रसीद देखी जा सकती है।',
  },
  {
    id: 'booking-multi',
    category: 'booking',
    questionEn: 'Can I book more than one service at once?',
    questionHi: 'क्या मैं एक साथ एक से अधिक सेवाएँ बुक कर सकता/सकती हूँ?',
    answerEn: 'Yes — you can select up to 6 services for one appointment; they run back-to-back in a single visit.',
    answerHi: 'हाँ — एक अपॉइंटमेंट में अधिकतम 6 सेवाएँ चुन सकते हैं; वे एक ही विज़िट में एक के बाद एक होंगी।',
  },
  {
    id: 'booking-hold',
    category: 'booking',
    questionEn: 'How long is a time slot held for me?',
    questionHi: 'समय स्लॉट मेरे लिए कितनी देर रोका जाता है?',
    answerEn: 'While you finish the details, your selected slot is held for about 15 minutes.',
    answerHi: 'विवरण पूरा करते समय आपका चुना स्लॉट लगभग 15 मिनट के लिए रोका जाता है।',
  },

  /* ---- payment ---- */
  {
    id: 'payment-options',
    category: 'payment',
    questionEn: 'What payment options are available?',
    questionHi: 'कौन से भुगतान विकल्प उपलब्ध हैं?',
    answerEn: 'You can pay at the salon, pay an advance deposit (the salon sets the percentage), or pay the full amount online.',
    answerHi: 'आप सैलून पर भुगतान कर सकते हैं, एडवांस जमा कर सकते हैं (प्रतिशत सैलून तय करता है), या पूरी राशि ऑनलाइन चुका सकते हैं।',
  },
  {
    id: 'payment-confirmed',
    category: 'payment',
    questionEn: 'When is my booking confirmed?',
    questionHi: 'मेरी बुकिंग कब पक्की होती है?',
    answerEn: 'Your booking is confirmed only after the required payment succeeds, or when you chose the pay-at-salon option.',
    answerHi: 'आवश्यक भुगतान सफल होने के बाद ही आपकी बुकिंग पक्की होती है, या जब आपने सैलून-पर-भुगतान विकल्प चुना हो।',
  },
  {
    id: 'payment-refund',
    category: 'payment',
    questionEn: 'Are refunds automatic when I cancel?',
    questionHi: 'रद्द करने पर क्या रिफंड अपने आप मिलता है?',
    answerEn: 'No — no refund is processed automatically. Any advance already paid stays recorded with the booking; refunds are handled directly by the salon.',
    answerHi: 'नहीं — कोई रिफंड अपने आप प्रोसेस नहीं होता। पहले दिया गया एडवांस बुकिंग के साथ दर्ज रहता है; रिफंड सीधे सैलून द्वारा संभाले जाते हैं।',
  },
  {
    id: 'payment-status',
    category: 'payment',
    questionEn: 'Is payment status the same as booking status?',
    questionHi: 'क्या भुगतान स्थिति और बुकिंग स्थिति एक जैसी हैं?',
    answerEn: 'No — they are tracked separately. A booking can be pending payment, confirmed, completed or cancelled, while its payment can be unpaid, paid or failed.',
    answerHi: 'नहीं — दोनों अलग-अलग दर्ज होती हैं। बुकिंग लंबित भुगतान, पक्की, पूर्ण या रद्द हो सकती है, जबकि भुगतान बिना भुगतान, भुगतान हुआ या विफल हो सकता है।',
  },

  /* ---- reschedule / cancellation ---- */
  {
    id: 'reschedule-who',
    category: 'reschedule',
    questionEn: 'Which bookings can I reschedule or cancel?',
    questionHi: 'कौन सी बुकिंग मैं पुनर्निर्धारित या रद्द कर सकता/सकती हूँ?',
    answerEn: 'Only live bookings (pending payment, confirmed or pay-at-salon). Completed and cancelled bookings cannot be rescheduled or cancelled.',
    answerHi: 'केवल चालू बुकिंग (लंबित भुगतान, पक्की या सैलून-पर-भुगतान)। पूर्ण और रद्द बुकिंग को पुनर्निर्धारित या रद्द नहीं किया जा सकता।',
  },
  {
    id: 'reschedule-how',
    category: 'reschedule',
    questionEn: 'How do I reschedule?',
    questionHi: 'मैं कैसे पुनर्निर्धारित करूँ?',
    answerEn: 'Open the booking from My Bookings, tap Reschedule, pick a new available date and time, review the change and confirm.',
    answerHi: 'मेरी बुकिंग से बुकिंग खोलें, पुनर्निर्धारित करें पर टैप करें, नई उपलब्ध तारीख़ और समय चुनें, बदलाव देखें और पुष्टि करें।',
  },
  {
    id: 'reschedule-times',
    category: 'reschedule',
    questionEn: 'What times can I reschedule to?',
    questionHi: 'मैं किस समय पुनर्निर्धारित कर सकता/सकती हूँ?',
    answerEn: 'Only genuinely available slots are shown — past times, closed days, holidays and slots already booked by others are not selectable.',
    answerHi: 'केवल वास्तव में उपलब्ध स्लॉट दिखते हैं — बीत चुके समय, बंद दिन, अवकाश और दूसरों द्वारा बुक स्लॉट चुनने योग्य नहीं होते।',
  },
  {
    id: 'cancel-how',
    category: 'reschedule',
    questionEn: 'How do I cancel a booking?',
    questionHi: 'मैं बुकिंग कैसे रद्द करूँ?',
    answerEn: 'Open the booking and tap Cancel Booking, review the details and confirm. The slot is released immediately.',
    answerHi: 'बुकिंग खोलें और बुकिंग रद्द करें पर टैप करें, विवरण देखें और पुष्टि करें। स्लॉट तुरंत मुक्त हो जाता है।',
  },

  /* ---- account / profile ---- */
  {
    id: 'account-what',
    category: 'account',
    questionEn: 'What is my account?',
    questionHi: 'मेरा खाता क्या है?',
    answerEn: 'Your account on this device shows your bookings, profile, saved salons, reviews and notifications. It is tied to this browser, not to a separate login.',
    answerHi: 'इस डिवाइस पर आपका खाता आपकी बुकिंग, प्रोफ़ाइल, सेव किए गए सैलून, समीक्षाएँ और सूचनाएँ दिखाता है। यह इस ब्राउज़र से जुड़ा है, किसी अलग लॉगिन से नहीं।',
  },
  {
    id: 'account-edit',
    category: 'account',
    questionEn: 'How do I update my name, phone or email?',
    questionHi: 'मैं अपना नाम, फ़ोन या ईमेल कैसे अपडेट करूँ?',
    answerEn: 'Open My Profile, tap Edit Profile, change the fields, then Save. The updated details appear immediately.',
    answerHi: 'मेरी प्रोफ़ाइल खोलें, प्रोफ़ाइल संपादित करें पर टैप करें, फ़ील्ड बदलें, फिर सेव करें। अपडेट विवरण तुरंत दिखता है।',
  },
  {
    id: 'account-avatar',
    category: 'account',
    questionEn: 'Can I upload a profile photo?',
    questionHi: 'क्या मैं प्रोफ़ाइल फोटो अपलोड कर सकता/सकती हूँ?',
    answerEn: 'No — profile photo upload is not available in this app yet; initials are shown instead.',
    answerHi: 'नहीं — इस ऐप में अभी प्रोफ़ाइल फोटो अपलोड उपलब्ध नहीं है; इसके बजाय इनिशियल दिखाए जाते हैं।',
  },

  /* ---- salon ---- */
  {
    id: 'salon-contact',
    category: 'salon',
    questionEn: 'How do I contact the salon?',
    questionHi: 'मैं सैलून से कैसे संपर्क करूँ?',
    answerEn: 'Use the Call or WhatsApp buttons on the salon website (they appear only when the salon has published them).',
    answerHi: 'सैलून वेबसाइट पर कॉल या व्हाट्सऐप बटन का उपयोग करें (वे तभी दिखते हैं जब सैलून ने उन्हें प्रकाशित किया हो)।',
  },
  {
    id: 'salon-save',
    category: 'salon',
    questionEn: 'How do I save a salon?',
    questionHi: 'मैं सैलून कैसे सेव करूँ?',
    answerEn: 'Tap the heart button on the salon website to save it; it then appears under Saved Salons in your account.',
    answerHi: 'सैलून वेबसाइट पर दिल के निशान पर टैप करके सेव करें; फिर यह आपके खाते में सेव किए गए सैलून में दिखता है।',
  },
  {
    id: 'salon-hours',
    category: 'salon',
    questionEn: 'Where do I see the salon opening hours?',
    questionHi: 'मैं सैलून के खुलने का समय कहाँ देखूँ?',
    answerEn: 'The salon website shows its published address and opening hours in the location section.',
    answerHi: 'सैलून वेबसाइट लोकेशन सेक्शन में प्रकाशित पता और खुलने का समय दिखाती है।',
  },

  /* ---- general ---- */
  {
    id: 'general-guest',
    category: 'general',
    questionEn: 'Why does my account show "Guest"?',
    questionHi: 'मेरा खाता "अतिथि" क्यों दिखाता है?',
    answerEn: 'It means this browser has no saved profile or booking info yet. Once you book or save your profile, your details appear here.',
    answerHi: 'इसका मतलब है कि इस ब्राउज़र में अभी कोई सेव प्रोफ़ाइल या बुकिंग जानकारी नहीं है। एक बार बुक करने या प्रोफ़ाइल सेव करने पर आपका विवरण यहाँ दिखता है।',
  },
  {
    id: 'general-where',
    category: 'general',
    questionEn: 'Where is my data stored?',
    questionHi: 'मेरा डेटा कहाँ रहता है?',
    answerEn: 'Your account data (bookings, profile, saved salons, reviews, notifications) is stored on this browser. There is no separate server login for customers yet.',
    answerHi: 'आपका खाता डेटा (बुकिंग, प्रोफ़ाइल, सेव सैलून, समीक्षाएँ, सूचनाएँ) इसी ब्राउज़र में रहता है। ग्राहकों के लिए अभी कोई अलग सर्वर लॉगिन नहीं है।',
  },
];

/* ------------------------------------------------------------------ */
/* Contact options — REAL salon data only                              */
/* ------------------------------------------------------------------ */

export interface HelpContactOptions {
  call?: { href: string; label: string };
  whatsapp?: { href: string; label: string };
  email?: { href: string; label: string };
}

/**
 * Contact actions the application genuinely supports for THIS salon —
 * derived from the salon's published data. Nothing is invented: a missing
 * phone / whatsapp / email simply yields no action.
 */
export function helpContactOptions(data: SalonData): HelpContactOptions {
  const options: HelpContactOptions = {};
  if (canCall(data)) {
    options.call = { href: salonTelHref(data), label: (data.phone || '').trim() };
  }
  if (canWhatsApp(data)) {
    options.whatsapp = { href: salonWhatsAppHref(data), label: 'WhatsApp' };
  }
  const email = (data.email || '').trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    options.email = { href: `mailto:${email}`, label: email };
  }
  return options;
}
