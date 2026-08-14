/**
 * PHASE 11.1 — HERO COPY (English / हिन्दी) for all five themes.
 *
 * Every theme owns a COMPLETELY separate hero namespace: eyebrow, headline,
 * description, CTA labels, media captions and meta chips. Nothing is shared
 * between themes except the tiny `hero.*` common labels (rating / open-status
 * prefixes) whose meaning is identical everywhere.
 *
 * This file adds hero copy only. Phase 10.2 `siteI18n.ts` and Phase 10.3
 * `siteStructureI18n.ts` are untouched, so Language + Dark Mode behaviour is
 * unchanged. No database, service or theme-data architecture is affected.
 */
import type { AppLocale } from './locale';
import type { SiteHeaderThemeId } from './siteNavigation';

const COMMON_EN = {
  'hero.ratingSuffix': 'rating',
  'hero.reviewsSuffix': 'reviews',
  'hero.newStudio': 'Newly launched',
  'hero.locationPrefix': 'Visit us at',
  'hero.scrollHint': 'Scroll to explore',
};

const COMMON_HI: Record<keyof typeof COMMON_EN, string> = {
  'hero.ratingSuffix': 'रेटिंग',
  'hero.reviewsSuffix': 'समीक्षाएँ',
  'hero.newStudio': 'नया शुरू हुआ',
  'hero.locationPrefix': 'हमसे यहाँ मिलें',
  'hero.scrollHint': 'नीचे स्क्रॉल करें',
};

export interface HeroCopy {
  /** Small kicker above the headline. */
  eyebrow: string;
  /** Theme-specific headline (line 1) — never reused by another theme. */
  headline: string;
  /** Headline accent (line 2) rendered in the theme accent colour. */
  headlineAccent: string;
  /** Short hero description. */
  description: string;
  /** Primary CTA — always the Book Appointment entry point. */
  primaryCta: string;
  /** Secondary CTA — always the Explore Services entry point. */
  secondaryCta: string;
  /** Two theme-specific reassurance chips. */
  chip1: string;
  chip2: string;
  /** Caption printed over / beside the hero media. */
  mediaEyebrow: string;
  mediaTitle: string;
  mediaBody: string;
  /** Alt text for the primary hero visual. */
  mediaAlt: string;
  /** Alt text for the supporting hero visuals. */
  mediaAltB: string;
  mediaAltC: string;
  /** Theme-specific micro-stat shown in the hero meta strip. */
  statValue: string;
  statLabel: string;
}

type Table = Record<SiteHeaderThemeId, Record<AppLocale, HeroCopy>>;

const HERO_TEXT: Table = {
  /* ---------------------------------------------------------------- */
  /* 1. BARBER & MEN'S GROOMING — bold, masculine, vintage premium.    */
  /* ---------------------------------------------------------------- */
  barber_mens_grooming: {
    en: {
      eyebrow: 'Est. 2016 · Master Barbers',
      headline: 'Built For The',
      headlineAccent: 'Sharpest Men.',
      description:
        'Skin fades, straight-razor shaves and hot-towel rituals performed on a real barber chair — chrome, leather and steel, no shortcuts.',
      primaryCta: 'Book The Chair',
      secondaryCta: 'Explore Services',
      chip1: 'Walk-ins after 6 PM',
      chip2: 'Straight-razor certified',
      mediaEyebrow: 'The chair',
      mediaTitle: 'Fade · Shave · Beard',
      mediaBody: 'Sixty focused minutes, finished with hot towel and tonic.',
      mediaAlt: 'Barber finishing a sharp skin fade',
      mediaAltB: 'Straight-razor hot towel shave',
      mediaAltC: 'Vintage barber tools on leather',
      statValue: '12k+',
      statLabel: 'Cuts delivered',
    },
    hi: {
      eyebrow: 'स्थापित 2016 · मास्टर बार्बर',
      headline: 'बने हैं सबसे',
      headlineAccent: 'शार्प मर्दों के लिए।',
      description:
        'स्किन फेड, स्ट्रेट-रेज़र शेव और हॉट-टॉवल रिचुअल — असली बार्बर चेयर पर, क्रोम, लेदर और स्टील के साथ, बिना किसी शॉर्टकट के।',
      primaryCta: 'चेयर बुक करें',
      secondaryCta: 'सेवाएँ देखें',
      chip1: 'शाम 6 बजे के बाद वॉक-इन',
      chip2: 'स्ट्रेट-रेज़र सर्टिफ़ाइड',
      mediaEyebrow: 'द चेयर',
      mediaTitle: 'फेड · शेव · बियर्ड',
      mediaBody: 'साठ मिनट का पूरा ध्यान, अंत में हॉट टॉवल और टॉनिक।',
      mediaAlt: 'बार्बर परफ़ेक्ट स्किन फेड पूरा करते हुए',
      mediaAltB: 'स्ट्रेट-रेज़र हॉट टॉवल शेव',
      mediaAltC: 'लेदर पर विंटेज बार्बर टूल्स',
      statValue: '12k+',
      statLabel: 'कट पूरे किए',
    },
  },

  /* ---------------------------------------------------------------- */
  /* 2. HAIR STUDIO & COLOR BAR — editorial, monochrome + rose-gold.   */
  /* ---------------------------------------------------------------- */
  hair_studio_color_bar: {
    en: {
      eyebrow: 'Issue 07 · The Colour Edit',
      headline: 'Colour, cut and',
      headlineAccent: 'considered craft.',
      description:
        'An editorial studio for balayage, gloss and precision cutting. Every appointment opens with a colour consultation on the light bar.',
      primaryCta: 'Book a Consultation',
      secondaryCta: 'Explore Services',
      chip1: 'Colour specialists',
      chip2: 'Consultation first',
      mediaEyebrow: 'Studio portfolio',
      mediaTitle: 'Balayage No. 04',
      mediaBody: 'Hand-painted dimension, glossed to a glass finish.',
      mediaAlt: 'Editorial portrait of a fresh balayage finish',
      mediaAltB: 'Colour bar toning session in progress',
      mediaAltC: 'Precision cutting detail in the studio',
      statValue: '9',
      statLabel: 'Colour formulas on the bar',
    },
    hi: {
      eyebrow: 'अंक 07 · द कलर एडिट',
      headline: 'कलर, कट और',
      headlineAccent: 'सोची-समझी कारीगरी।',
      description:
        'बलायाज, ग्लॉस और परफ़ेक्ट कटिंग के लिए एडिटोरियल स्टूडियो। हर अपॉइंटमेंट लाइट बार पर कलर कंसल्टेशन से शुरू होती है।',
      primaryCta: 'कंसल्टेशन बुक करें',
      secondaryCta: 'सेवाएँ देखें',
      chip1: 'कलर विशेषज्ञ',
      chip2: 'पहले कंसल्टेशन',
      mediaEyebrow: 'स्टूडियो पोर्टफ़ोलियो',
      mediaTitle: 'बलायाज नं. 04',
      mediaBody: 'हाथ से पेंट किया डाइमेंशन, ग्लास जैसी फ़िनिश।',
      mediaAlt: 'ताज़ा बलायाज फ़िनिश का एडिटोरियल पोर्ट्रेट',
      mediaAltB: 'कलर बार पर टोनिंग सेशन',
      mediaAltC: 'स्टूडियो में प्रिसिज़न कटिंग डिटेल',
      statValue: '9',
      statLabel: 'कलर फ़ॉर्मूले बार पर',
    },
  },

  /* ---------------------------------------------------------------- */
  /* 3. BEAUTY, SKIN & SPA — soft, calm, pastel luxury.                */
  /* ---------------------------------------------------------------- */
  beauty_skin_spa: {
    en: {
      eyebrow: 'A quiet place for skin',
      headline: 'Breathe in.',
      headlineAccent: 'Glow out.',
      description:
        'Slow facials, warm oil massage and calming body rituals in a softly lit sanctuary — treatments paced to your skin, never to a clock.',
      primaryCta: 'Book a Treatment',
      secondaryCta: 'Explore Services',
      chip1: 'Dermat-safe products',
      chip2: 'Single-use kits',
      mediaEyebrow: 'Signature ritual',
      mediaTitle: 'Hydra Glow Facial',
      mediaBody: '75 minutes of cleanse, steam, serum and slow massage.',
      mediaAlt: 'Calm facial treatment in a softly lit spa room',
      mediaAltB: 'Warm oil massage therapy detail',
      mediaAltC: 'Spa botanicals and folded towels',
      statValue: '75 min',
      statLabel: 'Average ritual',
    },
    hi: {
      eyebrow: 'त्वचा के लिए एक शांत जगह',
      headline: 'गहरी साँस लें।',
      headlineAccent: 'निखर उठें।',
      description:
        'धीमे फेशियल, गर्म तेल की मालिश और सुकून भरे बॉडी रिचुअल — हल्की रोशनी वाले आश्रय में, घड़ी नहीं, आपकी त्वचा की रफ़्तार पर।',
      primaryCta: 'ट्रीटमेंट बुक करें',
      secondaryCta: 'सेवाएँ देखें',
      chip1: 'डर्मेट-सेफ़ प्रोडक्ट',
      chip2: 'सिंगल-यूज़ किट',
      mediaEyebrow: 'सिग्नेचर रिचुअल',
      mediaTitle: 'हाइड्रा ग्लो फेशियल',
      mediaBody: '75 मिनट — क्लेंज़, स्टीम, सीरम और धीमी मालिश।',
      mediaAlt: 'हल्की रोशनी वाले स्पा रूम में शांत फेशियल',
      mediaAltB: 'गर्म तेल मसाज थेरेपी',
      mediaAltC: 'स्पा की जड़ी-बूटियाँ और तौलिए',
      statValue: '75 मिनट',
      statLabel: 'औसत रिचुअल',
    },
  },

  /* ---------------------------------------------------------------- */
  /* 4. FULL-SERVICE FAMILY SALON — bright, friendly, energetic.       */
  /* ---------------------------------------------------------------- */
  family_full_service: {
    en: {
      eyebrow: 'Men · Women · Kids',
      headline: 'One salon for',
      headlineAccent: 'the whole family.',
      description:
        'Book three chairs at once, park the kids at the fun corner and walk out together. Bright, quick and friendly for every age.',
      primaryCta: 'Book a Family Visit',
      secondaryCta: 'Explore Services',
      chip1: 'Kids-friendly corner',
      chip2: 'Multi-person booking',
      mediaEyebrow: 'Saturday at ours',
      mediaTitle: 'Three chairs, one slot',
      mediaBody: 'Parents and kids seated together — in and out in 90 minutes.',
      mediaAlt: 'Family enjoying a bright, friendly salon visit',
      mediaAltB: 'Child getting a gentle first haircut',
      mediaAltC: 'Stylist finishing a womens blow-dry',
      statValue: '3',
      statLabel: 'Chairs bookable together',
    },
    hi: {
      eyebrow: 'पुरुष · महिलाएँ · बच्चे',
      headline: 'पूरे परिवार के लिए',
      headlineAccent: 'एक ही सैलून।',
      description:
        'एक साथ तीन चेयर बुक करें, बच्चों को फ़न कॉर्नर में बैठाएँ और साथ में बाहर निकलें। हर उम्र के लिए तेज़, रोशन और दोस्ताना।',
      primaryCta: 'फ़ैमिली विज़िट बुक करें',
      secondaryCta: 'सेवाएँ देखें',
      chip1: 'बच्चों के लिए फ़न कॉर्नर',
      chip2: 'एक साथ कई बुकिंग',
      mediaEyebrow: 'हमारे यहाँ शनिवार',
      mediaTitle: 'तीन चेयर, एक स्लॉट',
      mediaBody: 'माता-पिता और बच्चे साथ — 90 मिनट में सब पूरा।',
      mediaAlt: 'परिवार रोशन और दोस्ताना सैलून विज़िट का आनंद लेते हुए',
      mediaAltB: 'बच्चे का पहला सौम्य हेयरकट',
      mediaAltC: 'स्टाइलिस्ट महिला ब्लो-ड्राई पूरी करते हुए',
      statValue: '3',
      statLabel: 'चेयर एक साथ बुक करें',
    },
  },

  /* ---------------------------------------------------------------- */
  /* 5. NAIL & LASH STUDIO — glamorous, neon pink, visual-card style.  */
  /* ---------------------------------------------------------------- */
  nail_lash_studio: {
    en: {
      eyebrow: 'Nail · Lash · Brow',
      headline: 'Tips that talk.',
      headlineAccent: 'Lashes that linger.',
      description:
        'Chrome sets, jelly gloss, russian volume and brows mapped to your face. A studio built for close-ups and camera flash.',
      primaryCta: 'Book Your Set',
      secondaryCta: 'Explore Services',
      chip1: 'Sets last 3+ weeks',
      chip2: 'Sterilised, single-use',
      mediaEyebrow: 'This week',
      mediaTitle: 'Chrome Aura Set',
      mediaBody: 'Mirror chrome over a soft aura base, sealed glossy.',
      mediaAlt: 'Glossy chrome nail set close up',
      mediaAltB: 'Russian volume lash detail',
      mediaAltC: 'Brow lamination finish',
      statValue: '3 wks+',
      statLabel: 'Average set wear',
    },
    hi: {
      eyebrow: 'नेल · लैश · ब्रो',
      headline: 'बोलती हुई टिप्स।',
      headlineAccent: 'ठहरी हुई लैशेज़।',
      description:
        'क्रोम सेट, जेली ग्लॉस, रशियन वॉल्यूम और चेहरे के हिसाब से मैप की गई ब्रो। क्लोज़-अप और कैमरा फ़्लैश के लिए बना स्टूडियो।',
      primaryCta: 'अपना सेट बुक करें',
      secondaryCta: 'सेवाएँ देखें',
      chip1: 'सेट 3+ हफ़्ते चलते हैं',
      chip2: 'स्टरलाइज़्ड, सिंगल-यूज़',
      mediaEyebrow: 'इस हफ़्ते',
      mediaTitle: 'क्रोम ऑरा सेट',
      mediaBody: 'सॉफ़्ट ऑरा बेस पर मिरर क्रोम, ग्लॉसी सील।',
      mediaAlt: 'चमकदार क्रोम नेल सेट का क्लोज़-अप',
      mediaAltB: 'रशियन वॉल्यूम लैश डिटेल',
      mediaAltC: 'ब्रो लैमिनेशन फ़िनिश',
      statValue: '3 हफ़्ते+',
      statLabel: 'औसतन सेट टिकता है',
    },
  },
};

/** Hero copy for one theme in the active locale (+ shared hero labels). */
export function heroText(
  themeId: SiteHeaderThemeId,
  locale: AppLocale,
): HeroCopy & Record<keyof typeof COMMON_EN, string> {
  const table = HERO_TEXT[themeId] || HERO_TEXT.barber_mens_grooming;
  const common = locale === 'hi' ? COMMON_HI : COMMON_EN;
  return { ...common, ...table[locale === 'hi' ? 'hi' : 'en'] };
}

export const HERO_TEXT_TABLE = HERO_TEXT;
