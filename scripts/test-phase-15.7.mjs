/**
 * PHASE 15.7 — final video player + exact original-platform redirect.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
dom.window.matchMedia = globalThis.matchMedia;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(cb) { this.cb = cb; }
  observe(element) { this.cb([{ isIntersecting: true, target: element }]); }
  unobserve() {}
  disconnect() {}
};
dom.window.IntersectionObserver = globalThis.IntersectionObserver;

const openCalls = [];
dom.window.open = (url, target, features) => {
  openCalls.push({ url, target, features });
  return {};
};

const React = (await import('react')).default;
const { render, cleanup, fireEvent, act } = await import('@testing-library/react');
const SiteVideoGallery = (await import('../src/components/SiteVideoGallery.tsx')).default;
const { initialData } = await import('../src/types.ts');
const {
  validatePlatformVideoUrl,
  originalPlatformVideoDestination,
  originalVideoDestinationForTheme,
  safeOriginalPlatformVideoUrl,
  safePlatformChannelUrl,
  openOriginalPlatformVideo,
} = await import('../src/lib/videoPlatform.ts');
const {
  ownerVideoForTheme,
  videoItemsForTheme,
} = await import('../src/lib/siteVideoGallery.ts');
const {
  themeVideoCatalog,
  totalThemeVideoCatalogCount,
} = await import('../src/lib/siteVideoCatalog.ts');
const {
  socialVideoFromPasteAndMetadata,
} = await import('../src/lib/videoUrlMetadata.ts');
const { buildVideoReplaceFields } = await import('../src/lib/videoManagement.ts');
const { setWebsiteSectionFlagsForTests } = await import('../src/lib/siteStructure.ts');

let passed = 0;
let failed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    failures.push({ name, error });
    console.error(`  ✗ ${name}\n    ${String(error?.message || error).slice(0, 700).replaceAll('\n', '\n    ')}`);
  }
}
function section(title) { console.log(`\n▸ ${title}`); }
function dataFor(themeId, videos = []) {
  return { ...structuredClone(initialData), templateId: themeId, socialVideos: videos, socialProfiles: {} };
}
function ownerVideo(overrides = {}) {
  const id = 'AbCdEf12345';
  return {
    id: 'owner-exact',
    title: 'Exact original fade tutorial',
    platform: 'youtube',
    url: `https://www.youtube.com/watch?v=${id}`,
    originalUrl: `https://youtu.be/${id}?si=OriginalToken&t=12`,
    thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    externalVideoId: id,
    channelName: 'Original Barber Channel',
    channelUrl: 'https://www.youtube.com/@OriginalBarberChannel',
    themeId: 'barber_mens_grooming',
    videoKind: 'long',
    ...overrides,
  };
}
function reset() {
  cleanup();
  openCalls.length = 0;
  setWebsiteSectionFlagsForTests({});
}

section('Provider-aware URL safety + exact preservation');

await test('YouTube watch, Shorts and youtu.be URLs validate without canonicalising', () => {
  const id = 'AbCdEf12345';
  const urls = [
    `https://www.youtube.com/watch?v=${id}&t=30s#details`,
    `https://www.youtube.com/shorts/${id}?feature=share`,
    `https://youtu.be/${id}?si=ExactValue`,
  ];
  for (const url of urls) {
    const result = validatePlatformVideoUrl(url, 'youtube', id);
    assert.equal(result.ok, true, url);
    assert.equal(result.url, url, 'must preserve the exact destination');
    assert.equal(result.externalVideoId, id);
  }
});

await test('lookalike hosts, javascript URLs, profiles and mismatched ids fail closed', () => {
  const bad = [
    validatePlatformVideoUrl('javascript:alert(1)', 'youtube'),
    validatePlatformVideoUrl('https://youtube.com.example.test/watch?v=AbCdEf12345', 'youtube'),
    validatePlatformVideoUrl('https://www.youtube.com/@channel', 'youtube'),
    validatePlatformVideoUrl('https://www.youtube.com/@channel?v=AbCdEf12345', 'youtube'),
    validatePlatformVideoUrl('https://www.youtube.com/watch?v=AbCdEf12345', 'youtube', 'ZyXwVu98765'),
    validatePlatformVideoUrl('https://www.instagram.com/reel/RealCode88/', 'youtube'),
  ];
  assert.ok(bad.every((result) => result.ok === false));
  assert.equal(bad[4].code, 'id_mismatch');
});

await test('Instagram, Facebook and TikTok accept only provider-native video paths', () => {
  assert.equal(validatePlatformVideoUrl('https://www.instagram.com/reel/RealCode88/', 'instagram').ok, true);
  assert.equal(validatePlatformVideoUrl('https://www.facebook.com/watch/?v=123456', 'facebook').ok, true);
  assert.equal(validatePlatformVideoUrl('https://www.tiktok.com/@artist/video/7412345678901234567', 'tiktok').ok, true);
  assert.equal(validatePlatformVideoUrl('https://www.instagram.com/salonprofile/', 'instagram').ok, false);
  assert.equal(validatePlatformVideoUrl('https://www.tiktok.com/@salon', 'tiktok').ok, false);
});

await test('explicit originalUrl is authoritative; invalid original never falls back to a modified url', () => {
  const record = ownerVideo({ originalUrl: 'javascript:alert(1)' });
  const result = originalPlatformVideoDestination(record);
  assert.equal(result.ok, false);
  assert.equal(safeOriginalPlatformVideoUrl(record), '');
});

await test('grandfathered 15.1–15.6 rows use their exact legacy url and infer a stale label only for compatibility', () => {
  const exact = 'https://youtu.be/AbCdEf12345?si=Legacy';
  const result = originalPlatformVideoDestination({ platform: 'instagram', url: exact });
  assert.equal(result.ok, true);
  assert.equal(result.platform, 'youtube');
  assert.equal(result.url, exact);
});

await test('channel/source links are provider-aware and video links cannot masquerade as channels', () => {
  assert.equal(
    safePlatformChannelUrl('https://www.youtube.com/@OriginalBarberChannel', 'youtube'),
    'https://www.youtube.com/@OriginalBarberChannel',
  );
  assert.equal(safePlatformChannelUrl('https://www.youtube.com/watch?v=AbCdEf12345', 'youtube'), '');
  assert.equal(safePlatformChannelUrl('https://evil.example/@OriginalBarberChannel', 'youtube'), '');
});

await test('safe opener passes exact URL + noopener/noreferrer and refuses foreign themes', () => {
  const calls = [];
  const record = ownerVideo();
  const opened = openOriginalPlatformVideo(record, {
    themeId: 'barber_mens_grooming',
    opener: (...args) => { calls.push(args); return {}; },
  });
  assert.equal(opened.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], record.originalUrl);
  assert.equal(calls[0][1], '_blank');
  assert.ok(calls[0][2].includes('noopener'));
  assert.ok(calls[0][2].includes('noreferrer'));
  const foreign = originalVideoDestinationForTheme(record, 'nail_lash_studio');
  assert.equal(foreign.ok, false);
  assert.equal(foreign.code, 'wrong_theme');
});

section('Every record preserves original URL + verified source');

await test('paste builder preserves the exact paste while keeping the legacy canonical field', () => {
  const original = 'https://youtu.be/AbCdEf12345?si=PasteValue&t=8';
  const video = socialVideoFromPasteAndMetadata({
    metadata: {
      platform: 'youtube', externalVideoId: 'AbCdEf12345',
      url: 'https://www.youtube.com/watch?v=AbCdEf12345', originalUrl: original,
      title: 'Platform title', description: 'Platform description',
      channelName: 'Platform Channel', channelUrl: 'https://www.youtube.com/@PlatformChannel',
      thumbnailUrl: 'https://i.ytimg.com/vi/AbCdEf12345/hqdefault.jpg',
      embedUrl: 'https://www.youtube.com/embed/AbCdEf12345', source: 'oembed',
    },
    form: {
      title: 'Platform title', description: 'Platform description', channelName: 'Platform Channel',
      thumbnailUrl: 'https://i.ytimg.com/vi/AbCdEf12345/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=AbCdEf12345', platform: 'youtube', externalVideoId: 'AbCdEf12345',
    },
    videoKind: 'long', themeId: 'barber_mens_grooming', id: 'paste-1',
  });
  assert.equal(video.url, 'https://www.youtube.com/watch?v=AbCdEf12345');
  assert.equal(video.originalUrl, original);
  assert.equal(video.channelUrl, 'https://www.youtube.com/@PlatformChannel');
});

await test('replace helper keeps exact replacement paste separately from canonical URL', () => {
  const original = 'https://youtu.be/AbCdEf12345?si=ReplaceValue';
  const result = buildVideoReplaceFields(original, null);
  assert.equal(result.ok, true);
  assert.equal(result.fields.originalUrl, original);
  assert.equal(result.fields.url, 'https://www.youtube.com/watch?v=AbCdEf12345');
});

await test('all 50 protected records have exact URLs, native ids, source names and safe source URLs', () => {
  assert.equal(totalThemeVideoCatalogCount(), 50);
  const themes = ['barber_mens_grooming', 'hair_studio_color_bar', 'beauty_skin_spa', 'family_full_service', 'nail_lash_studio'];
  const unrelatedLegacyIds = new Set(['dQw4w9WgXcQ', '9bZkp7q19f0', 'kJQP7kiw5Fk', 'fJ9rUzIMcZQ']);
  for (const theme of themes) {
    for (const video of themeVideoCatalog(theme)) {
      assert.equal(video.originalUrl, video.url, `${video.id}: original URL`);
      const result = originalPlatformVideoDestination(video);
      assert.equal(result.ok, true, `${video.id}: valid destination`);
      assert.equal(result.externalVideoId, video.externalVideoId);
      assert.ok(video.channelName?.trim(), `${video.id}: channel`);
      assert.equal(safePlatformChannelUrl(video.channelUrl, 'youtube'), video.channelUrl);
      assert.equal(unrelatedLegacyIds.has(video.externalVideoId), false, `${video.id}: unrelated old demo`);
    }
  }
});

await test('public projection carries exact destination/source and rejects invalid explicit originals', () => {
  const valid = ownerVideoForTheme(ownerVideo(), 'barber_mens_grooming');
  assert.equal(valid.originalUrl, ownerVideo().originalUrl);
  assert.equal(valid.channelUrl, ownerVideo().channelUrl);
  assert.equal(ownerVideoForTheme(ownerVideo({ originalUrl: 'https://evil.example/video' }), 'barber_mens_grooming'), null);
});

section('Responsive card + player interaction');

await test('card shows thumbnail, title, exact source and Long type on every viewport mode', () => {
  for (const mode of ['desktop', 'tablet', 'mobile']) {
    reset();
    const utils = render(React.createElement(SiteVideoGallery, {
      themeId: 'barber_mens_grooming', data: dataFor('barber_mens_grooming', [ownerVideo()]), mode,
    }));
    const card = utils.container.querySelector('[data-social-id="owner-exact"]');
    assert.ok(card, mode);
    assert.equal(card.getAttribute('data-original-url'), ownerVideo().originalUrl);
    assert.equal(card.getAttribute('data-video-kind'), 'long');
    assert.ok(card.querySelector('[data-testid="site-video-gallery-thumb"]'));
    assert.ok(card.querySelector('[data-testid="site-video-card-title"]').textContent.includes('Exact original'));
    assert.ok(card.querySelector('[data-testid="site-video-card-source"]').textContent.includes('Original Barber Channel'));
    assert.equal(card.querySelector('[data-testid="site-video-channel-link"]').getAttribute('href'), ownerVideo().channelUrl);
  }
  reset();
});

await test('View validates then opens the exact original YouTube URL, never the canonical alias', async () => {
  reset();
  const video = ownerVideo();
  const utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: dataFor('barber_mens_grooming', [video]), mode: 'desktop',
  }));
  const view = utils.container.querySelector('[data-social-id="owner-exact"] [data-testid="site-social-view"]');
  await act(async () => fireEvent.click(view));
  assert.equal(openCalls.length, 1);
  assert.equal(openCalls[0].url, video.originalUrl);
  assert.notEqual(openCalls[0].url, video.url);
  reset();
});

await test('Play loads the original YouTube id on demand; player external action keeps exact redirect', async () => {
  reset();
  const video = ownerVideo();
  const utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: dataFor('barber_mens_grooming', [video]), mode: 'desktop',
  }));
  assert.equal(utils.queryByTestId('site-social-embed'), null);
  const trigger = utils.container.querySelector('[data-social-id="owner-exact"] [data-testid="site-video-card-trigger"]');
  await act(async () => fireEvent.click(trigger));
  const player = utils.getByTestId('site-video-player');
  assert.ok(player);
  assert.ok(utils.getByTestId('site-video-player-loading'));
  const iframe = utils.getByTestId('site-video-player-iframe');
  assert.ok(iframe.getAttribute('src').includes('/embed/AbCdEf12345'));
  await act(async () => fireEvent.load(iframe));
  assert.equal(utils.getByTestId('site-social-embed').getAttribute('data-player-state'), 'ready');
  await act(async () => fireEvent.click(utils.getByTestId('site-video-player-external')));
  assert.equal(openCalls.at(-1).url, video.originalUrl);
  reset();
});

await test('iframe error becomes an unavailable state with original-platform fallback', async () => {
  reset();
  const utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: dataFor('barber_mens_grooming', [ownerVideo()]), mode: 'mobile',
  }));
  await act(async () => fireEvent.click(
    utils.container.querySelector('[data-social-id="owner-exact"] [data-testid="site-social-play"]'),
  ));
  await act(async () => fireEvent.error(utils.getByTestId('site-video-player-iframe')));
  assert.ok(utils.getByTestId('site-video-player-unavailable'));
  assert.equal(utils.getByTestId('site-social-embed').getAttribute('data-player-state'), 'unavailable');
  assert.ok(utils.getByTestId('site-video-player-external'));
  reset();
});

await test('broken thumbnail falls back without disabling play/open actions', async () => {
  reset();
  const utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming',
    data: dataFor('barber_mens_grooming', [ownerVideo({ thumbnailUrl: 'https://invalid.example/broken.jpg' })]),
    mode: 'desktop',
  }));
  const card = utils.container.querySelector('[data-social-id="owner-exact"]');
  const image = card.querySelector('[data-testid="site-image"]');
  await act(async () => fireEvent.error(image));
  assert.equal(card.getAttribute('data-has-thumb'), 'false');
  assert.ok(card.querySelector('[data-testid="site-video-gallery-thumb-fallback"]'));
  assert.ok(card.querySelector('[data-testid="site-social-play"]'));
  assert.ok(card.querySelector('[data-testid="site-social-view"]'));
  reset();
});

await test('Shorts retain 9:16 cards and exact /shorts/ external destination', async () => {
  reset();
  const short = ownerVideo({
    id: 'owner-short', videoKind: 'short',
    url: 'https://www.youtube.com/shorts/AbCdEf12345',
    originalUrl: 'https://www.youtube.com/shorts/AbCdEf12345?feature=share',
  });
  const utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: dataFor('barber_mens_grooming', [short]), mode: 'mobile',
  }));
  const card = utils.container.querySelector('[data-social-id="owner-short"]');
  assert.equal(card.getAttribute('data-video-kind'), 'short');
  const ratioStyle = card.querySelector('[data-testid="site-video-card-trigger"]').getAttribute('style');
  assert.ok(ratioStyle.includes('9 / 16') || ratioStyle.includes('9/16'));
  await act(async () => fireEvent.click(card.querySelector('[data-testid="site-social-view"]')));
  assert.equal(openCalls.at(-1).url, short.originalUrl);
  reset();
});

await test('non-embeddable provider card opens its exact external video directly', async () => {
  reset();
  const facebook = ownerVideo({
    id: 'owner-facebook', platform: 'facebook', externalVideoId: '123456',
    url: 'https://www.facebook.com/watch/?v=123456',
    originalUrl: 'https://www.facebook.com/watch/?v=123456&ref=share',
    channelName: 'Facebook source', channelUrl: 'https://www.facebook.com/originalsource',
    videoKind: 'long',
  });
  const utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: dataFor('barber_mens_grooming', [facebook]), mode: 'desktop',
  }));
  await act(async () => fireEvent.click(
    utils.container.querySelector('[data-social-id="owner-facebook"] [data-testid="site-video-card-trigger"]'),
  ));
  assert.equal(utils.queryByTestId('site-social-embed'), null);
  assert.equal(openCalls.at(-1).url, facebook.originalUrl);
  reset();
});

await test('forced section loading state and invalid-record filtering remain graceful', () => {
  reset();
  setWebsiteSectionFlagsForTests({ videos: 'loading' });
  let utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: dataFor('barber_mens_grooming', [ownerVideo()]), mode: 'desktop',
  }));
  assert.ok(utils.getByTestId('site-video-gallery-loading'));
  reset();
  const invalid = ownerVideo({ originalUrl: 'https://evil.example/watch?v=AbCdEf12345' });
  assert.equal(videoItemsForTheme('barber_mens_grooming', { socialVideos: [invalid] }).some((item) => item.id === invalid.id), false);
});

await test('theme isolation blocks foreign owner redirects and every catalog destination stays on its own theme', () => {
  const foreign = ownerVideo({ themeId: 'nail_lash_studio' });
  const barberItems = videoItemsForTheme('barber_mens_grooming', { socialVideos: [foreign] });
  assert.equal(barberItems.some((item) => item.id === foreign.id), false);
  for (const item of barberItems) {
    assert.notEqual(item.themeId, 'nail_lash_studio');
  }
  const result = originalVideoDestinationForTheme(foreign, 'barber_mens_grooming');
  assert.equal(result.ok, false);
});

section('Scope guardrails');

await test('15.7 adds no likes, weekly ranking, dashboard integration, secrets or migration', () => {
  const player = fs.readFileSync(path.join(root, 'src/components/SiteVideoGallery.tsx'), 'utf8');
  const platform = fs.readFileSync(path.join(root, 'src/lib/videoPlatform.ts'), 'utf8');
  const combined = `${player}\n${platform}`;
  assert.equal(/likesCount|most-liked|mostLiked|weeklyTop|weeklyMost/i.test(combined), false);
  assert.equal(/service_role|YOUTUBE_API_KEY|GEMINI_API_KEY/.test(combined), false);
  const migrations = fs.readdirSync(path.join(root, 'supabase/migrations'));
  assert.equal(migrations.some((name) => /15[._-]?7|video.player|original.platform/i.test(name)), false);
});

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`PHASE 15.7 — player + original redirect: ${passed} passed, ${failed} failed`);
console.log(`════════════════════════════════════════════════════════════`);
if (failed) {
  console.error('\nFailing tests:');
  failures.forEach(({ name }) => console.error(`  - ${name}`));
  process.exit(1);
}
