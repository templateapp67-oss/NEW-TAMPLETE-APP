/**
 * PHASE 15.3 + 15.5 — Per-theme protected mock / configured video catalog.
 *
 * Every theme ships with exactly:
 *   - 5 Shorts  (vertical / reel-style presentation)
 *   - 5 Long Videos (horizontal / full-watch presentation)
 *
 * Total: 50 unique, theme-specific records. No video id, url, title,
 * description, thumbnail, or external id is shared across themes.
 *
 * PHASE 15.5 — these records are PROTECTED mock/default data:
 *   - Appear automatically when the owner has not configured enough real videos
 *     of a given kind for the active theme (fill path in `videoItemsForTheme`).
 *   - Isolated by theme (`themeId` stamped on every row) and never mixed.
 *   - Cannot be permanently deleted in this phase (`isProtectedThemeMockVideo`,
 *     `filterDeletableOwnerVideos`). Owner-saved rows remain fully deletable.
 *   - Content vocabulary matches each theme (barber / hair / spa / family / nail).
 *
 * URLs are real, public YouTube watch/shorts links with valid 11-char ids
 * (embeddable via the existing Phase 10.8 parsers). Thumbnails use the
 * public img.youtube.com CDN derived from those ids — never random/broken
 * placeholders. No likes, weekly rotation, admin, or dashboard logic.
 *
 * Schema: maps onto existing SocialVideo / social_videos fields only
 * (platform, video_url, external_video_id, caption). `videoKind` is an
 * additive client discriminator (short | long); no new DB table.
 */
import type { SocialVideo } from '../types';
import type { SiteHeaderThemeId } from './siteNavigation';
import { youtubeThumbUrl } from './siteSocialFeed';

export type VideoKind = 'short' | 'long';

export const VIDEO_KIND_SHORT: VideoKind = 'short';
export const VIDEO_KIND_LONG: VideoKind = 'long';
export const VIDEO_KIND_QUOTA = 5 as const;

/** Stable id prefix for every protected theme mock record. */
export const THEME_MOCK_ID_PREFIX = 'theme:' as const;

export interface ThemeVideoSeed {
  /** Stable id unique across the whole catalog (never reused across themes). */
  id: string;
  kind: VideoKind;
  title: string;
  titleHi?: string;
  /** YouTube 11-char id — must be unique across the 50-record catalog. */
  externalVideoId: string;
  /** Exact YouTube oEmbed author name (never theme-authored/fabricated). */
  channelName: string;
  /** Exact YouTube oEmbed author URL. */
  channelUrl: string;
  description?: string;
}

function ytShort(id: string): string {
  return `https://www.youtube.com/shorts/${id}`;
}

function ytWatch(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

function seedToSocial(themeId: SiteHeaderThemeId, seed: ThemeVideoSeed): SocialVideo {
  const isShort = seed.kind === 'short';
  const originalUrl = isShort ? ytShort(seed.externalVideoId) : ytWatch(seed.externalVideoId);
  return {
    id: seed.id,
    title: seed.title,
    platform: 'youtube',
    url: originalUrl,
    originalUrl,
    thumbnailUrl: youtubeThumbUrl(seed.externalVideoId),
    externalVideoId: seed.externalVideoId,
    // Transparent attribution summary when the provider description is not
    // bundled. It never claims salon ownership or changes platform metadata.
    description:
      seed.description ||
      `${seed.title} — original YouTube ${isShort ? 'Short' : 'video'} by ${seed.channelName}.`,
    channelName: seed.channelName,
    channelUrl: seed.channelUrl,
    themeId,
    videoKind: seed.kind,
    /** PHASE 15.5 — mark as protected mock so owner delete cannot purge it. */
    dateAdded: 'Theme showcase',
  };
}

/**
 * Fifty unique YouTube video ids (public, embeddable). Grouped 10 per theme
 * so no two themes ever reference the same clip.
 *
 * PHASE 15.7 audit (2026-08-15): every id resolved through YouTube oEmbed.
 * Titles, channel names and channel URLs below are the exact provider metadata;
 * the linked content matches its theme. No salon-authored title/channel is
 * presented as platform metadata and no unrelated music/demo redirect remains.
 */
const CATALOG: Record<SiteHeaderThemeId, ThemeVideoSeed[]> = {
  "barber_mens_grooming": [
    {
      "id": "theme:barber:s1",
      "kind": "short",
      "externalVideoId": "DnxVO2cE184",
      "title": "Step-by-Step Beginner Fade Tutorial with Clippers #fade #barber #clipper",
      "channelName": "StopNFade",
      "channelUrl": "https://www.youtube.com/@Stopnfade"
    },
    {
      "id": "theme:barber:s2",
      "kind": "short",
      "externalVideoId": "Vx9xQ8nYppM",
      "title": "High Fade Tutorial Step by Step #fade #barber #haircut",
      "channelName": "StopNFade",
      "channelUrl": "https://www.youtube.com/@Stopnfade"
    },
    {
      "id": "theme:barber:s3",
      "kind": "short",
      "externalVideoId": "2hDsEnv0b5k",
      "title": "Eladio Carrión Haircut #barbero #barbershop #barber skin fade tutorial for beginners",
      "channelName": "Chemote Barber",
      "channelUrl": "https://www.youtube.com/@chemotebarber"
    },
    {
      "id": "theme:barber:s4",
      "kind": "short",
      "externalVideoId": "ZVWn50hzsG0",
      "title": "Burst Fade Mullet Haircut Tutorial with Clippers #fade #barber #haircut",
      "channelName": "StopNFade",
      "channelUrl": "https://www.youtube.com/@Stopnfade"
    },
    {
      "id": "theme:barber:s5",
      "kind": "short",
      "externalVideoId": "wfE_Lj6dULE",
      "title": "Flawless High Fade / Military Haircut 🔥 Barber Tutorial 💈✨ STEP BY STEP 📚 @HowToFade",
      "channelName": "HowToFade101",
      "channelUrl": "https://www.youtube.com/@HowToFade"
    },
    {
      "id": "theme:barber:l1",
      "kind": "long",
      "externalVideoId": "5UPAzEw8loo",
      "title": "Professional Beard Shaving Tutorial | Clean & Smooth Grooming",
      "channelName": "Razor & Style",
      "channelUrl": "https://www.youtube.com/@RAZORSTYLE-r9n"
    },
    {
      "id": "theme:barber:l2",
      "kind": "long",
      "externalVideoId": "XYOwCSBXJDw",
      "title": "How to Achieve the Perfect Haircut and Beard - Barber Tutorial",
      "channelName": "Luis Antonio",
      "channelUrl": "https://www.youtube.com/@LuisAntonioJordan"
    },
    {
      "id": "theme:barber:l3",
      "kind": "long",
      "externalVideoId": "MCO1wlhP6wU",
      "title": "Long Beard Trimming & Shaping Barber Tutorial",
      "channelName": "House of Shaves Barbershop",
      "channelUrl": "https://www.youtube.com/@houseofshavesbarbershop"
    },
    {
      "id": "theme:barber:l4",
      "kind": "long",
      "externalVideoId": "wuqZCFAfzpU",
      "title": "Pro Barber Shows How to Trim a Long Beard the Right Way",
      "channelName": "Live Bearded",
      "channelUrl": "https://www.youtube.com/@livebearded"
    },
    {
      "id": "theme:barber:l5",
      "kind": "long",
      "externalVideoId": "BiVmtWKwRIE",
      "title": "Beard Trim - Barbering tutorial",
      "channelName": "Mike Taylor Education",
      "channelUrl": "https://www.youtube.com/@MikeTaylorEducation"
    }
  ],
  "hair_studio_color_bar": [
    {
      "id": "theme:hair:s1",
      "kind": "short",
      "externalVideoId": "s2C85eaYj5c",
      "title": "Honey Blonde Balayage on Light Brown Hair",
      "channelName": "Malibu C Professional",
      "channelUrl": "https://www.youtube.com/@MalibuCPro"
    },
    {
      "id": "theme:hair:s2",
      "kind": "short",
      "externalVideoId": "GDP4LSrLoOw",
      "title": "Blonde Balayage Hair Color ✨ Smooth & Clean Transformation",
      "channelName": "Lashes Beauty Parlour",
      "channelUrl": "https://www.youtube.com/@Lashebeautyparlour"
    },
    {
      "id": "theme:hair:s3",
      "kind": "short",
      "externalVideoId": "wOv7HcWZNHs",
      "title": "Blonde Hair Balayage Technique for Stunning Results",
      "channelName": "Blonde Balayage Hair TV",
      "channelUrl": "https://www.youtube.com/@BlondeBalayageHairTV"
    },
    {
      "id": "theme:hair:s4",
      "kind": "short",
      "externalVideoId": "p8uLB_uHLxg",
      "title": "Toasted Caramel Balayage Is the Must-Try Hair Color of 2026 🤎✨ #shorts",
      "channelName": "Frost & Flow",
      "channelUrl": "https://www.youtube.com/@sugarillusions"
    },
    {
      "id": "theme:hair:s5",
      "kind": "short",
      "externalVideoId": "VWiZO9Xq7ww",
      "title": "Balayage Hair Color Trends You Need to Try in 2025 | Balayage Hair Color Transformation",
      "channelName": "Himanshu Pal Academy",
      "channelUrl": "https://www.youtube.com/@HimanshuPalAcademy"
    },
    {
      "id": "theme:hair:l1",
      "kind": "long",
      "externalVideoId": "4xs5qxDnJhQ",
      "title": "How to Do Perfect Balayage | Step-by-Step Hair Coloring Guide",
      "channelName": "Lashes Beauty Parlour",
      "channelUrl": "https://www.youtube.com/@Lashebeautyparlour"
    },
    {
      "id": "theme:hair:l2",
      "kind": "long",
      "externalVideoId": "S7ve3Wkaa1I",
      "title": "How To: Babylights & Balayage Hair Salon Color Tutorial | Single Service Transformation!",
      "channelName": "Daniella Benita",
      "channelUrl": "https://www.youtube.com/@DaniellaBenita"
    },
    {
      "id": "theme:hair:l3",
      "kind": "long",
      "externalVideoId": "Vp7U3u3mye4",
      "title": "REVERSE BALAYAGE Salon Hair Color Tutorial | Rebalancing with Lived In Dimension | Daniella Benita",
      "channelName": "Daniella Benita",
      "channelUrl": "https://www.youtube.com/@DaniellaBenita"
    },
    {
      "id": "theme:hair:l4",
      "kind": "long",
      "externalVideoId": "pF85GDarx6I",
      "title": "VOLUME BLOWOUT | SALON BLOW DRY TUTORIAL",
      "channelName": "Styles By Summer",
      "channelUrl": "https://www.youtube.com/@StylesBySummer"
    },
    {
      "id": "theme:hair:l5",
      "kind": "long",
      "externalVideoId": "kwr08yBPYmM",
      "title": "Layered Haircut & Blowout Tutorial For Fine Hair",
      "channelName": "Behind The Chair",
      "channelUrl": "https://www.youtube.com/@behindthechair_com"
    }
  ],
  "beauty_skin_spa": [
    {
      "id": "theme:spa:s1",
      "kind": "short",
      "externalVideoId": "1HedU0VXrfk",
      "title": "Welcome to the Caudalie Boutique & Spa in NYC! 🧖‍♀️🍇✨",
      "channelName": "Caudalie US",
      "channelUrl": "https://www.youtube.com/@caudalieus"
    },
    {
      "id": "theme:spa:s2",
      "kind": "short",
      "externalVideoId": "T7BCgDiUL04",
      "title": "Lush Re-Wilding Spa Treatment",
      "channelName": "LUSH",
      "channelUrl": "https://www.youtube.com/@LUSH"
    },
    {
      "id": "theme:spa:s3",
      "kind": "short",
      "externalVideoId": "IYuTJzFlRJM",
      "title": "ASMR Facial on Harper Zilmer",
      "channelName": "Boho Med Spa",
      "channelUrl": "https://www.youtube.com/@BohoMedSpa"
    },
    {
      "id": "theme:spa:s4",
      "kind": "short",
      "externalVideoId": "Qe0RJR-ai5Y",
      "title": "Bay Area Head Spa Amazing Experience! Facial, Massage and More 🥰 #headspa #spa #facial",
      "channelName": "Christina Marie",
      "channelUrl": "https://www.youtube.com/@ChristinaMarie17"
    },
    {
      "id": "theme:spa:s5",
      "kind": "short",
      "externalVideoId": "NDYQ3vsta4I",
      "title": "Benefits of Facial Massage in Professional Skin Treatments pt 2 #podcast #skincare #facialmassage",
      "channelName": "L'Moor",
      "channelUrl": "https://www.youtube.com/@LmoorBringsMore"
    },
    {
      "id": "theme:spa:l1",
      "kind": "long",
      "externalVideoId": "v8htMYxkn_Y",
      "title": "Luxury Image Skincare Spa Facial & Relaxing Arm Massage",
      "channelName": "Huyana Beauty",
      "channelUrl": "https://www.youtube.com/@HuyanaBeauty"
    },
    {
      "id": "theme:spa:l2",
      "kind": "long",
      "externalVideoId": "6K7fMhtS4og",
      "title": "How to Give a Truly Relaxing Facial | Step by Step Treatment",
      "channelName": "Huyana Beauty",
      "channelUrl": "https://www.youtube.com/@HuyanaBeauty"
    },
    {
      "id": "theme:spa:l3",
      "kind": "long",
      "externalVideoId": "XOGzCsOtYoM",
      "title": "A Spa facial treatment for achieving glowing glass skin",
      "channelName": "Huyana Beauty",
      "channelUrl": "https://www.youtube.com/@HuyanaBeauty"
    },
    {
      "id": "theme:spa:l4",
      "kind": "long",
      "externalVideoId": "tXrYlkwfOKU",
      "title": "Treat Yourself to a Facial. A Pro Shows us How it's Done.",
      "channelName": "Renown Health",
      "channelUrl": "https://www.youtube.com/@renownhealthnv"
    },
    {
      "id": "theme:spa:l5",
      "kind": "long",
      "externalVideoId": "sMbQglfeBAc",
      "title": "Professional Facial Cleansing treatment techniques - tutorial",
      "channelName": "BeautyTrainingHarrow",
      "channelUrl": "https://www.youtube.com/@BeautyTrainingHarrow"
    }
  ],
  "family_full_service": [
    {
      "id": "theme:family:s1",
      "kind": "short",
      "externalVideoId": "YDbUpzl06dA",
      "title": "Fun at the Barber Shop💈Kids Getting Haircut #shorts #barber #haircut #oliverandlucas",
      "channelName": "Oliver and Lucas - Educational Videos for Kids",
      "channelUrl": "https://www.youtube.com/@OliverandLucas"
    },
    {
      "id": "theme:family:s2",
      "kind": "short",
      "externalVideoId": "qAkj1LqFR4U",
      "title": "Korean Cut Salon Singapore $14 haircut… unexpected result 😳 K Cut Salon",
      "channelName": "SuperPrincessjo",
      "channelUrl": "https://www.youtube.com/@SuperPrincessjo"
    },
    {
      "id": "theme:family:s3",
      "kind": "short",
      "externalVideoId": "N4Sh3MDv6Kk",
      "title": "Little Girl’s Cute Haircut Experience 💇‍♀️ | Himanshu Pal Salon",
      "channelName": "Himanshu Pal Academy",
      "channelUrl": "https://www.youtube.com/@HimanshuPalAcademy"
    },
    {
      "id": "theme:family:s4",
      "kind": "short",
      "externalVideoId": "3Nv_RldcsCY",
      "title": "Top 2024 Kids Haircuts | Trendy and Easy Engravings",
      "channelName": "M-Zone",
      "channelUrl": "https://www.youtube.com/@M-Zone01"
    },
    {
      "id": "theme:family:s5",
      "kind": "short",
      "externalVideoId": "TRn28XLcMLk",
      "title": "Convenient Haircuts from Great Clips 😌",
      "channelName": "Great Clips",
      "channelUrl": "https://www.youtube.com/@greatclips"
    },
    {
      "id": "theme:family:l1",
      "kind": "long",
      "externalVideoId": "L6hKiex_AME",
      "title": "CHILDREN’S HAIRCUT TUTORIAL- SLIDERCUTS",
      "channelName": "SliderCuts (Slider)",
      "channelUrl": "https://www.youtube.com/@SliderCuts"
    },
    {
      "id": "theme:family:l2",
      "kind": "long",
      "externalVideoId": "ZkLGxuzdPzI",
      "title": "KIDS HAIR CUT | DROP FADE | TUTORIAL",
      "channelName": "Memthebarber",
      "channelUrl": "https://www.youtube.com/@memthebarber6697"
    },
    {
      "id": "theme:family:l3",
      "kind": "long",
      "externalVideoId": "7Sj7nXDG5Ug",
      "title": "Haircut Tutorial for Young Boys - TheSalonGuy",
      "channelName": "TheSalonGuy",
      "channelUrl": "https://www.youtube.com/@TheSalonGuy"
    },
    {
      "id": "theme:family:l4",
      "kind": "long",
      "externalVideoId": "NnvaPAoEG1o",
      "title": "Little Boy Haircut Tutorial",
      "channelName": "Jessa Seewald",
      "channelUrl": "https://www.youtube.com/@JessaSeewald"
    },
    {
      "id": "theme:family:l5",
      "kind": "long",
      "externalVideoId": "rc6wv_kkNDA",
      "title": "Hair Cuts for Kids ✂️ Kids Getting Haircuts at Barber Shop 💇🏽‍♂️ Kids Fun Haircut 💈Haircut for Kids",
      "channelName": "Oliver and Lucas - Educational Videos for Kids",
      "channelUrl": "https://www.youtube.com/@OliverandLucas"
    }
  ],
  "nail_lash_studio": [
    {
      "id": "theme:nail:s1",
      "kind": "short",
      "externalVideoId": "9NrQfC2en-w",
      "title": "Easy nail art for short natural nails",
      "channelName": "Nails With Mandy",
      "channelUrl": "https://www.youtube.com/@nailswithmandy"
    },
    {
      "id": "theme:nail:s2",
      "kind": "short",
      "externalVideoId": "AxxhRvVUVGQ",
      "title": "EASY beginner nail art 🍃🫧 #nails #nailart #nailtutorial #gelnails",
      "channelName": "aisebrush",
      "channelUrl": "https://www.youtube.com/@aisebrush"
    },
    {
      "id": "theme:nail:s3",
      "kind": "short",
      "externalVideoId": "tHqVZoTQm24",
      "title": "OPAL NAIL ART TUTORIAL",
      "channelName": "nailthoughts",
      "channelUrl": "https://www.youtube.com/@nailthoughts"
    },
    {
      "id": "theme:nail:s4",
      "kind": "short",
      "externalVideoId": "JtqlQJGgN8w",
      "title": "Lash V Brow Lamination so satisfying process step by step eyebrow styling shaping",
      "channelName": "Lash V - Lash & Brow Salon supplier",
      "channelUrl": "https://www.youtube.com/@lashv"
    },
    {
      "id": "theme:nail:s5",
      "kind": "short",
      "externalVideoId": "1P1T20EXmRM",
      "title": "Dlux Professional Lash Lift and Brow Lamination",
      "channelName": "DLUX PROFESSIONAL",
      "channelUrl": "https://www.youtube.com/@DLUXPROFESSIONAL"
    },
    {
      "id": "theme:nail:l1",
      "kind": "long",
      "externalVideoId": "Hvn8CouVjDQ",
      "title": "how to become a PRO at gel x nails | *advanced* nail art tutorial + amazon products",
      "channelName": "Sion K",
      "channelUrl": "https://www.youtube.com/@nailsbysion"
    },
    {
      "id": "theme:nail:l2",
      "kind": "long",
      "externalVideoId": "Dt_MpBHRLjI",
      "title": "How to Do Gel-X Nails Like a PRO 💫 (nail extensions + beginner nail art)",
      "channelName": "Jessica Vu",
      "channelUrl": "https://www.youtube.com/@jessyluxe"
    },
    {
      "id": "theme:nail:l3",
      "kind": "long",
      "externalVideoId": "JEd6Xoj3jjU",
      "title": "FUN EASY NAIL ART TUTORIAL PROFESSIONAL GEL",
      "channelName": "Jessica Cosmetics",
      "channelUrl": "https://www.youtube.com/@jessicacosmeticsusa"
    },
    {
      "id": "theme:nail:l4",
      "kind": "long",
      "externalVideoId": "OGkr7YA_qeE",
      "title": "Lash Lift & Natural Brow Lamination Step By Step - Maxymova",
      "channelName": "Bella Beauty Professional",
      "channelUrl": "https://www.youtube.com/@bellabeautyprofessional"
    },
    {
      "id": "theme:nail:l5",
      "kind": "long",
      "externalVideoId": "Wp4pxy6MDog",
      "title": "LAMINATION + BROW TINT PROCESS Step by Step (using Thuya and Brow Code)",
      "channelName": "Boss Brows",
      "channelUrl": "https://www.youtube.com/@bossbrowsla"
    }
  ]
};

/** Raw seeds for one theme (exactly 5 short + 5 long). */
export function themeVideoSeeds(themeId: SiteHeaderThemeId): ThemeVideoSeed[] {
  return (CATALOG[themeId] || []).slice();
}

/** SocialVideo records for one theme's catalog (themeId stamped on every row). */
export function themeVideoCatalog(themeId: SiteHeaderThemeId): SocialVideo[] {
  return themeVideoSeeds(themeId).map((seed) => seedToSocial(themeId, seed));
}

export function themeVideosOfKind(themeId: SiteHeaderThemeId, kind: VideoKind): SocialVideo[] {
  return themeVideoCatalog(themeId).filter((v) => v.videoKind === kind);
}

/** Total configured theme records across all five themes (should be 50). */
export function totalThemeVideoCatalogCount(): number {
  let n = 0;
  for (const key of Object.keys(CATALOG) as SiteHeaderThemeId[]) {
    n += CATALOG[key].length;
  }
  return n;
}

/** All external ids in the catalog — used to assert uniqueness in tests. */
export function allThemeVideoExternalIds(): string[] {
  const ids: string[] = [];
  for (const key of Object.keys(CATALOG) as SiteHeaderThemeId[]) {
    for (const seed of CATALOG[key]) ids.push(seed.externalVideoId);
  }
  return ids;
}

export function allThemeVideoRecordIds(): string[] {
  const ids: string[] = [];
  for (const key of Object.keys(CATALOG) as SiteHeaderThemeId[]) {
    for (const seed of CATALOG[key]) ids.push(seed.id);
  }
  return ids;
}

/* ------------------------------------------------------------------ */
/* PHASE 15.5 — protected mock identity & delete guard                 */
/* ------------------------------------------------------------------ */

const PROTECTED_ID_SET = new Set(allThemeVideoRecordIds());
const PROTECTED_EXT_SET = new Set(allThemeVideoExternalIds());

/**
 * True when a video id belongs to the protected theme mock catalog
 * (stable `theme:<themeKey>:<slot>` ids).
 */
export function isThemeMockVideoId(id: unknown): boolean {
  if (typeof id !== 'string' || !id) return false;
  if (PROTECTED_ID_SET.has(id)) return true;
  return id.startsWith(THEME_MOCK_ID_PREFIX);
}

/**
 * True when this SocialVideo is a protected theme mock/default record.
 * Mock rows must never be permanently deleted in Phase 15.5 — they are
 * regenerated by the gallery fill path whenever owner data is short.
 */
export function isProtectedThemeMockVideo(
  video: Pick<SocialVideo, 'id' | 'externalVideoId' | 'dateAdded'> | null | undefined,
): boolean {
  if (!video || typeof video !== 'object') return false;
  if (isThemeMockVideoId(video.id)) return true;
  // Secondary signal: catalog external ids that were stamped as showcase.
  if (
    typeof video.externalVideoId === 'string' &&
    PROTECTED_EXT_SET.has(video.externalVideoId) &&
    video.dateAdded === 'Theme showcase'
  ) {
    return true;
  }
  return false;
}

/**
 * Filters an owner `socialVideos` list for a delete operation.
 * Protected mock/default records are retained; only real owner rows matching
 * `id` are removed. Safe to call even when `id` points at a mock — the mock
 * stays in the list (and the public gallery would re-fill it anyway).
 */
export function filterDeletableOwnerVideos(
  list: readonly SocialVideo[] | null | undefined,
  idToRemove: string,
): SocialVideo[] {
  const source = Array.isArray(list) ? list : [];
  // Never drop protected mocks, even if the caller asked to delete that id.
  return source.filter((video) => {
    if (isProtectedThemeMockVideo(video)) return true;
    return video.id !== idToRemove;
  });
}

/** True when removing `id` would be a no-op because the target is protected. */
export function isDeleteBlockedForVideoId(
  list: readonly SocialVideo[] | null | undefined,
  idToRemove: string,
): boolean {
  const target = (list || []).find((v) => v.id === idToRemove);
  if (!target) return isThemeMockVideoId(idToRemove);
  return isProtectedThemeMockVideo(target);
}

/* ------------------------------------------------------------------ */
/* PHASE 15.6 — per-salon admin disable (tombstone) of showcase mocks  */
/* ------------------------------------------------------------------ */

/**
 * True when a protected theme mock id has been disabled FOR ONE SALON by an
 * admin (`SalonData.disabledThemeVideoIds`). The shared catalog is never
 * mutated — other salons and themes keep their showcase videos.
 */
export function isDisabledThemeMockId(
  disabledIds: readonly string[] | null | undefined,
  id: unknown,
): boolean {
  if (typeof id !== 'string' || !id) return false;
  if (!Array.isArray(disabledIds)) return false;
  return disabledIds.includes(id);
}

/**
 * The effective showcase catalog for one salon + theme: protected mock rows
 * with the salon's disabled ids removed. Used by the 15.6-aware gallery fill
 * and the management panel.
 */
export function activeThemeVideoCatalog(
  themeId: SiteHeaderThemeId,
  disabledIds?: readonly string[] | null,
): SocialVideo[] {
  return themeVideoCatalog(themeId).filter((video) => !isDisabledThemeMockId(disabledIds, video.id));
}

/**
 * Theme-specific content vocabulary keywords used by acceptance tests to
 * confirm mock copy matches the theme (not copied across themes).
 */
export const THEME_MOCK_CONTENT_HINTS: Record<SiteHeaderThemeId, readonly string[]> = {
  barber_mens_grooming: ['fade', 'beard', 'shave', 'taper', 'razor', 'grooming', 'shop'],
  hair_studio_color_bar: ['balayage', 'colour', 'color', 'blowout', 'gloss', 'keratin', 'blonde', 'fringe'],
  beauty_skin_spa: ['facial', 'spa', 'mask', 'serum', 'bridal', 'skin', 'stone', 'glow'],
  family_full_service: ['kids', 'child', 'children', 'boy', 'girl', 'haircut', 'salon', 'barber'],
  nail_lash_studio: ['nail', 'lash', 'brow', 'chrome', 'gel', 'mani', 'pedi', 'french'],
};

/** All titles in the mock catalog for one theme (EN). */
export function themeMockTitles(themeId: SiteHeaderThemeId): string[] {
  return themeVideoSeeds(themeId).map((s) => s.title);
}

/** All descriptions in the mock catalog for one theme. */
export function themeMockDescriptions(themeId: SiteHeaderThemeId): string[] {
  return themeVideoCatalog(themeId).map((video) => video.description || '');
}

/** All thumbnail URLs in the mock catalog for one theme. */
export function themeMockThumbnailUrls(themeId: SiteHeaderThemeId): string[] {
  return themeVideoCatalog(themeId).map((v) => v.thumbnailUrl);
}
