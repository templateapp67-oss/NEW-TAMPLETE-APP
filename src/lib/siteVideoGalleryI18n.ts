/**
 * PHASE 15.1 — VIDEO GALLERY chrome copy (all five themes, EN + HI).
 *
 * Section headings (eyebrow / title) keep flowing from the existing per-theme
 * `siteText` / `socialText` namespaces when a theme already has them. This
 * table owns only the gallery chrome: play/view labels, empty/error bodies,
 * thumbnail fallback and platform names.
 */
import type { AppLocale } from './locale';
import type { SiteHeaderThemeId } from './siteNavigation';
import type { VideoGalleryPlatform } from './siteVideoGallery';

export interface VideoGalleryChromeCopy {
  play: string;
  view: string;
  openExternal: string;
  close: string;
  emptyTitle: string;
  emptyBody: string;
  errorTitle: string;
  errorBody: string;
  retry: string;
  /** Shown when the thumbnail URL is missing or fails to load. */
  thumbFallback: string;
  /** PHASE 15.3 — kind tabs / badges. */
  shortsTab: string;
  longTab: string;
  allTab: string;
  shortBadge: string;
  longBadge: string;
  /** PHASE 15.7 — final player / destination states. */
  playerLoading: string;
  unavailableTitle: string;
  unavailableBody: string;
  invalidUrl: string;
  sourceLabel: string;
  opensOriginal: string;
  platforms: Record<VideoGalleryPlatform, string>;
}

const PLATFORMS_EN: Record<VideoGalleryPlatform, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

const PLATFORMS_HI: Record<VideoGalleryPlatform, string> = {
  instagram: 'इंस्टाग्राम',
  youtube: 'यूट्यूब',
  facebook: 'फेसबुक',
  tiktok: 'टिकटॉक',
};

const KIND_EN = {
  shortsTab: 'Shorts',
  longTab: 'Long Videos',
  allTab: 'All',
  shortBadge: 'Short',
  longBadge: 'Long',
  playerLoading: 'Loading original video…',
  unavailableTitle: 'Video unavailable',
  unavailableBody: 'Playback could not load here. You can still try the original platform.',
  invalidUrl: 'This video link is invalid or unsafe and was not opened.',
  sourceLabel: 'Source',
  opensOriginal: 'Opens the exact original platform video',
};

const KIND_HI = {
  shortsTab: 'शॉर्ट्स',
  longTab: 'लंबे वीडियो',
  allTab: 'सभी',
  shortBadge: 'शॉर्ट',
  longBadge: 'लंबा',
  playerLoading: 'मूल वीडियो लोड हो रहा है…',
  unavailableTitle: 'वीडियो उपलब्ध नहीं है',
  unavailableBody: 'वीडियो यहाँ नहीं चला। आप इसे मूल प्लेटफ़ॉर्म पर खोल सकते हैं।',
  invalidUrl: 'यह वीडियो लिंक अमान्य या असुरक्षित है और खोला नहीं गया।',
  sourceLabel: 'स्रोत',
  opensOriginal: 'ठीक वही मूल प्लेटफ़ॉर्म वीडियो खोलता है',
};

const CHROME: Record<SiteHeaderThemeId, Record<AppLocale, Omit<VideoGalleryChromeCopy, 'platforms'>>> = {
  barber_mens_grooming: {
    en: {
      play: 'Play',
      view: 'View',
      openExternal: 'Open video',
      close: 'Close video',
      emptyTitle: 'No reels connected yet',
      emptyBody: 'Add Instagram or YouTube work in Socials and it will land here.',
      errorTitle: 'Videos unavailable',
      errorBody: 'We could not load the shop reels. Please try again.',
      retry: 'Retry',
      thumbFallback: 'Thumbnail unavailable',
      ...KIND_EN,
    },
    hi: {
      play: 'चलाएँ',
      view: 'देखें',
      openExternal: 'वीडियो खोलें',
      close: 'वीडियो बंद करें',
      emptyTitle: 'अभी कोई रील्स नहीं',
      emptyBody: 'सोशल्स में इंस्टा या यूट्यूब जोड़ते ही काम यहाँ दिखेगा।',
      errorTitle: 'वीडियो उपलब्ध नहीं',
      errorBody: 'दुकान की रील्स लोड नहीं हो सकीं। कृपया फिर कोशिश करें।',
      retry: 'फिर कोशिश',
      thumbFallback: 'थंबनेल उपलब्ध नहीं',
      ...KIND_HI,
    },
  },

  hair_studio_color_bar: {
    en: {
      play: 'Play',
      view: 'View',
      openExternal: 'Open video',
      close: 'Close video',
      emptyTitle: 'The reel tray is empty',
      emptyBody: 'Connect a reel or short and it will appear in this tray.',
      errorTitle: 'Videos unavailable',
      errorBody: 'Studio reels could not be loaded. Please try again.',
      retry: 'Retry',
      thumbFallback: 'Thumbnail unavailable',
      ...KIND_EN,
    },
    hi: {
      play: 'चलाएँ',
      view: 'देखें',
      openExternal: 'वीडियो खोलें',
      close: 'वीडियो बंद करें',
      emptyTitle: 'रील्स ट्रे खाली है',
      emptyBody: 'रील या शॉर्ट जोड़ते ही यह ट्रे भर जाएगी।',
      errorTitle: 'वीडियो उपलब्ध नहीं',
      errorBody: 'स्टूडियो रील्स लोड नहीं हो सकीं। कृपया फिर कोशिश करें।',
      retry: 'फिर कोशिश',
      thumbFallback: 'थंबनेल उपलब्ध नहीं',
      ...KIND_HI,
    },
  },

  beauty_skin_spa: {
    en: {
      play: 'Play',
      view: 'View',
      openExternal: 'Open video',
      close: 'Close video',
      emptyTitle: 'No studio moments yet',
      emptyBody: 'Linked Instagram or YouTube clips will appear here.',
      errorTitle: 'Videos unavailable',
      errorBody: 'Soft studio clips could not be loaded. Please try again.',
      retry: 'Retry',
      thumbFallback: 'Thumbnail unavailable',
      ...KIND_EN,
    },
    hi: {
      play: 'चलाएँ',
      view: 'देखें',
      openExternal: 'वीडियो खोलें',
      close: 'वीडियो बंद करें',
      emptyTitle: 'अभी स्टूडियो पल नहीं',
      emptyBody: 'लिंक किए इंस्टा या यूट्यूब क्लिप यहाँ दिखेंगे।',
      errorTitle: 'वीडियो उपलब्ध नहीं',
      errorBody: 'स्टूडियो क्लिप लोड नहीं हो सके। कृपया फिर कोशिश करें।',
      retry: 'फिर कोशिश',
      thumbFallback: 'थंबनेल उपलब्ध नहीं',
      ...KIND_HI,
    },
  },

  family_full_service: {
    en: {
      play: 'Play',
      view: 'View',
      openExternal: 'Open video',
      close: 'Close video',
      emptyTitle: 'No visit reels yet',
      emptyBody: 'When the salon adds a reel, it will show up here.',
      errorTitle: 'Videos unavailable',
      errorBody: 'Happy-visit reels could not be loaded. Please try again.',
      retry: 'Retry',
      thumbFallback: 'Thumbnail unavailable',
      ...KIND_EN,
    },
    hi: {
      play: 'चलाएँ',
      view: 'देखें',
      openExternal: 'वीडियो खोलें',
      close: 'वीडियो बंद करें',
      emptyTitle: 'अभी विज़िट रील्स नहीं',
      emptyBody: 'सैलून रील्स जोड़ते ही वे यहाँ दिखेंगे।',
      errorTitle: 'वीडियो उपलब्ध नहीं',
      errorBody: 'विज़िट रील्स लोड नहीं हो सकीं। कृपया फिर कोशिश करें।',
      retry: 'फिर कोशिश',
      thumbFallback: 'थंबनेल उपलब्ध नहीं',
      ...KIND_HI,
    },
  },

  nail_lash_studio: {
    en: {
      play: 'Play',
      view: 'View',
      openExternal: 'Open video',
      close: 'Close video',
      emptyTitle: 'No set-and-lash reels yet',
      emptyBody: 'Configured Instagram or YouTube work will appear here.',
      errorTitle: 'Videos unavailable',
      errorBody: 'Set-and-lash reels could not be loaded. Please try again.',
      retry: 'Retry',
      thumbFallback: 'Thumbnail unavailable',
      ...KIND_EN,
    },
    hi: {
      play: 'चलाएँ',
      view: 'देखें',
      openExternal: 'वीडियो खोलें',
      close: 'वीडियो बंद करें',
      emptyTitle: 'अभी सेट-लैश रील्स नहीं',
      emptyBody: 'जोड़े गए इंस्टा या यूट्यूब काम यहाँ दिखेंगे।',
      errorTitle: 'वीडियो उपलब्ध नहीं',
      errorBody: 'सेट-लैश रील्स लोड नहीं हो सकीं। कृपया फिर कोशिश करें।',
      retry: 'फिर कोशिश',
      thumbFallback: 'थंबनेल उपलब्ध नहीं',
      ...KIND_HI,
    },
  },
};

export function videoGalleryChrome(
  themeId: SiteHeaderThemeId,
  locale: AppLocale,
): VideoGalleryChromeCopy {
  const lang = locale === 'hi' ? 'hi' : 'en';
  const themed = CHROME[themeId]?.[lang] || CHROME.barber_mens_grooming[lang];
  return {
    ...themed,
    platforms: lang === 'hi' ? PLATFORMS_HI : PLATFORMS_EN,
  };
}
