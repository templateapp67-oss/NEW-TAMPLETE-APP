/**
 * PHASE 15.8 — Likes + Weekly Most-Liked System acceptance suite.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
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

const React = (await import('react')).default;
const { render, cleanup, fireEvent, act, waitFor } = await import('@testing-library/react');
const SiteVideoGallery = (await import('../src/components/SiteVideoGallery.tsx')).default;
const { initialData } = await import('../src/types.ts');
const { videoItemsForTheme } = await import('../src/lib/siteVideoGallery.ts');
const { bookingBrowserId } = await import('../src/lib/siteBookingFlow.ts');
const {
  currentVideoWeek,
  isLikeInCurrentWeek,
  isDatabaseBusinessId,
  databaseBusinessId,
  localVideoLikeScope,
  resolveVideoLikeContext,
  loadVideoLikeState,
  submitVideoLike,
  weeklyTopVideos,
  setLocalVideoLikesForTests,
  readLocalVideoLikesForTests,
  setVideoLikeFailureForTests,
  VIDEO_LIKE_STATE_RPC,
  VIDEO_LIKE_WRITE_RPC,
  VIDEO_WEEKLY_TOP_RPC,
} = await import('../src/lib/videoLikes.ts');
const { videoGalleryChrome } = await import('../src/lib/siteVideoGalleryI18n.ts');

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
    console.error(`  ✗ ${name}\n    ${String(error?.message || error).slice(0, 900).replaceAll('\n', '\n    ')}`);
  }
}
function section(title) { console.log(`\n▸ ${title}`); }
function salonData(themeId = 'barber_mens_grooming', extras = {}) {
  return {
    ...structuredClone(initialData),
    templateId: themeId,
    websiteSlug: 'phase-15-8-test-salon',
    socialVideos: [],
    socialProfiles: {},
    ...extras,
  };
}
function reset() {
  cleanup();
  setLocalVideoLikesForTests([]);
  setVideoLikeFailureForTests(null);
}

section('Current-week calculation + pure ranking');

await test('week starts Monday 00:00 and excludes the next Monday', () => {
  const now = new Date('2026-08-12T12:00:00.000Z'); // Wednesday
  const week = currentVideoWeek(now);
  assert.equal(week.start.getDay(), 1);
  assert.equal(week.start.getHours(), 0);
  assert.equal(week.end.getTime() - week.start.getTime(), 7 * 24 * 60 * 60 * 1000);
  assert.equal(isLikeInCurrentWeek(new Date(week.start.getTime() + 1), now), true);
  assert.equal(isLikeInCurrentWeek(new Date(week.end.getTime() - 1), now), true);
  assert.equal(isLikeInCurrentWeek(week.end, now), false);
  assert.equal(isLikeInCurrentWeek('not-a-date', now), false);
});

await test('weekly ranking uses weekly likes, supports Short + Long and deterministic ties', () => {
  const theme = 'barber_mens_grooming';
  const items = videoItemsForTheme(theme, salonData(theme));
  const short = items.find((item) => item.kind === 'short');
  const long = items.find((item) => item.kind === 'long');
  const snapshots = {
    [short.id]: { videoId: short.id, themeId: theme, kind: 'short', totalLikes: 10, weeklyLikes: 2, likedByViewer: false },
    [long.id]: { videoId: long.id, themeId: theme, kind: 'long', totalLikes: 8, weeklyLikes: 4, likedByViewer: false },
  };
  const ranked = weeklyTopVideos(items, snapshots, theme, 5);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].item.id, long.id);
  assert.equal(ranked[0].item.kind, 'long');
  assert.equal(ranked[1].item.kind, 'short');
  assert.deepEqual(ranked.map((row) => row.rank), [1, 2]);
});

await test('ranking rejects foreign-theme snapshots and zero current-week counts', () => {
  const theme = 'barber_mens_grooming';
  const items = videoItemsForTheme(theme, salonData(theme));
  const item = items[0];
  const foreign = {
    [item.id]: { videoId: item.id, themeId: 'nail_lash_studio', kind: item.kind, totalLikes: 99, weeklyLikes: 99, likedByViewer: false },
  };
  assert.deepEqual(weeklyTopVideos(items, foreign, theme), []);
  const oldOnly = {
    [item.id]: { videoId: item.id, themeId: theme, kind: item.kind, totalLikes: 99, weeklyLikes: 0, likedByViewer: false },
  };
  assert.deepEqual(weeklyTopVideos(items, oldOnly, theme), []);
});

section('Identity/context — no invented user or salon ids');

await test('database mode accepts only a real existing UUID from payload/service provenance', () => {
  const real = '10000000-0000-4000-8000-0000000000a1';
  assert.equal(isDatabaseBusinessId(real), true);
  assert.equal(isDatabaseBusinessId('public-site'), false);
  assert.equal(isDatabaseBusinessId('seed-barber'), false);
  assert.equal(databaseBusinessId(salonData('barber_mens_grooming', { businessId: real })), real);
  assert.equal(databaseBusinessId(salonData('barber_mens_grooming', { businessId: 'fake-id' })), null);
  const conflicting = salonData('barber_mens_grooming', { businessId: real });
  conflicting.services = [{ ...conflicting.services[0], businessId: '10000000-0000-4000-8000-0000000000b1' }];
  assert.equal(databaseBusinessId(conflicting), null);
});

await test('ambiguous service tenant ids fail closed instead of picking one', () => {
  const data = salonData('barber_mens_grooming');
  data.services = [
    { ...data.services[0], businessId: '10000000-0000-4000-8000-0000000000a1' },
    { ...data.services[1], businessId: '10000000-0000-4000-8000-0000000000b1' },
  ];
  assert.equal(databaseBusinessId(data), null);
  assert.equal(resolveVideoLikeContext(data, { supabaseConfigured: true }).mode, 'unavailable');
});

await test('offline preview reuses real website slug; missing identity is unavailable', () => {
  const data = salonData();
  assert.equal(localVideoLikeScope(data), 'slug:phase-15-8-test-salon');
  assert.deepEqual(resolveVideoLikeContext(data, { supabaseConfigured: false }), {
    mode: 'local', scope: 'slug:phase-15-8-test-salon',
  });
  const blank = salonData('barber_mens_grooming', { websiteSlug: '', publishedUrl: '' });
  assert.equal(resolveVideoLikeContext(blank, { supabaseConfigured: false }).mode, 'unavailable');
});

await test('RPC names are fixed and client API accepts no user id/salon id', () => {
  assert.equal(VIDEO_LIKE_STATE_RPC, 'get_video_like_state');
  assert.equal(VIDEO_LIKE_WRITE_RPC, 'like_video');
  assert.equal(VIDEO_WEEKLY_TOP_RPC, 'get_weekly_top_videos');
  const source = fs.readFileSync(path.join(root, 'src/lib/videoLikes.ts'), 'utf8');
  assert.equal(/p_user_id|p_salon_id|userId\s*:|salonId\s*:/.test(source), false);
  assert.ok(source.includes('bookingBrowserId()'), 'must reuse existing visitor session');
  assert.ok(source.includes("from './supabaseClient'"), 'must reuse existing Supabase client/session');
});

section('Offline preview adapter — duplicate control + theme/week isolation');

await test('same existing browser session can like a video only once', async () => {
  reset();
  const theme = 'barber_mens_grooming';
  const data = salonData(theme);
  const item = videoItemsForTheme(theme, data)[0];
  const context = resolveVideoLikeContext(data, { supabaseConfigured: false });
  const now = new Date('2026-08-12T12:00:00.000Z');
  const first = await submitVideoLike({ context, themeId: theme, item, now });
  const second = await submitVideoLike({ context, themeId: theme, item, now });
  assert.equal(first.ok, true);
  assert.equal(first.snapshot.totalLikes, 1);
  assert.equal(first.snapshot.weeklyLikes, 1);
  assert.equal(first.snapshot.likedByViewer, true);
  assert.equal(first.duplicate, false);
  assert.equal(second.ok, true);
  assert.equal(second.snapshot.totalLikes, 1);
  assert.equal(second.duplicate, true);
  assert.equal(readLocalVideoLikesForTests().length, 1);
});

await test('all-time count includes old likes; weekly count includes only current week', async () => {
  reset();
  const theme = 'barber_mens_grooming';
  const data = salonData(theme);
  const item = videoItemsForTheme(theme, data)[0];
  const now = new Date('2026-08-12T12:00:00.000Z');
  const week = currentVideoWeek(now);
  const session = bookingBrowserId();
  setLocalVideoLikesForTests([
    { scope: 'slug:phase-15-8-test-salon', themeId: theme, videoId: item.id, kind: item.kind, sessionToken: 'other-session', likedAt: new Date(week.start.getTime() + 1000).toISOString() },
    { scope: 'slug:phase-15-8-test-salon', themeId: theme, videoId: item.id, kind: item.kind, sessionToken: 'old-session', likedAt: new Date(week.start.getTime() - 1000).toISOString() },
    { scope: 'slug:phase-15-8-test-salon', themeId: theme, videoId: item.id, kind: item.kind, sessionToken: session, likedAt: new Date(week.start.getTime() + 2000).toISOString() },
  ]);
  const result = await loadVideoLikeState({
    context: { mode: 'local', scope: 'slug:phase-15-8-test-salon' }, themeId: theme, items: [item], now,
  });
  assert.equal(result.ok, true);
  const state = result.snapshots[item.id];
  assert.equal(state.totalLikes, 3);
  assert.equal(state.weeklyLikes, 2);
  assert.equal(state.likedByViewer, true);
});

await test('same video key in another theme/salon scope never affects this ranking', async () => {
  reset();
  const barber = 'barber_mens_grooming';
  const nail = 'nail_lash_studio';
  const item = videoItemsForTheme(barber, salonData(barber))[0];
  const now = new Date();
  setLocalVideoLikesForTests([
    { scope: 'slug:other-salon', themeId: barber, videoId: item.id, kind: item.kind, sessionToken: 'x-session', likedAt: now.toISOString() },
    { scope: 'slug:phase-15-8-test-salon', themeId: nail, videoId: item.id, kind: item.kind, sessionToken: 'y-session', likedAt: now.toISOString() },
  ]);
  const result = await loadVideoLikeState({
    context: { mode: 'local', scope: 'slug:phase-15-8-test-salon' }, themeId: barber, items: [item], now,
  });
  assert.equal(result.ok, true);
  assert.equal(result.snapshots[item.id].totalLikes, 0);
});

await test('foreign-theme item mutation is refused before storage', async () => {
  reset();
  const foreign = videoItemsForTheme('nail_lash_studio', salonData('nail_lash_studio'))[0];
  const result = await submitVideoLike({
    context: { mode: 'local', scope: 'slug:phase-15-8-test-salon' },
    themeId: 'barber_mens_grooming', item: foreign,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /different theme/i);
  assert.equal(readLocalVideoLikesForTests().length, 0);
});

section('Customer UI — every card likes + weekly states');

await test('every Short/Long card shows Like button and count; weekly empty state loads', async () => {
  reset();
  const theme = 'barber_mens_grooming';
  const utils = render(React.createElement(SiteVideoGallery, { themeId: theme, data: salonData(theme), mode: 'desktop' }));
  await waitFor(() => assert.equal(utils.getByTestId('site-social-feed').getAttribute('data-like-status'), 'ready'));
  const cards = utils.container.querySelectorAll('[data-testid="site-social-item"]');
  const likes = utils.container.querySelectorAll('[data-testid="site-video-like"]');
  assert.equal(cards.length, 10);
  assert.equal(likes.length, cards.length);
  for (const card of cards) {
    assert.ok(card.querySelector('[data-testid="site-video-like-count"]'));
    assert.equal(card.querySelector('[data-testid="site-video-like-count"]').textContent, '0');
  }
  assert.equal(utils.container.querySelectorAll('[data-video-kind="short"]').length >= 5, true);
  assert.equal(utils.container.querySelectorAll('[data-video-kind="long"]').length >= 5, true);
  assert.ok(utils.getByTestId('site-video-weekly-empty'));
  reset();
});

await test('successful Like updates count, disables duplicate, and updates weekly ranking immediately', async () => {
  reset();
  const theme = 'barber_mens_grooming';
  const utils = render(React.createElement(SiteVideoGallery, { themeId: theme, data: salonData(theme), mode: 'mobile' }));
  await waitFor(() => assert.equal(utils.getByTestId('site-social-feed').getAttribute('data-like-status'), 'ready'));
  const firstCard = utils.container.querySelector('[data-testid="site-social-item"]');
  const like = firstCard.querySelector('[data-testid="site-video-like"]');
  await act(async () => fireEvent.click(like));
  await waitFor(() => assert.equal(firstCard.querySelector('[data-testid="site-video-like-count"]').textContent, '1'));
  assert.equal(like.getAttribute('data-liked'), 'true');
  assert.equal(like.disabled, true);
  const weekly = utils.getByTestId('site-video-weekly-list');
  assert.equal(weekly.querySelectorAll('[data-testid="site-video-weekly-item"]').length, 1);
  assert.equal(weekly.querySelector('[data-testid="site-video-weekly-item"]').getAttribute('data-video-id'), firstCard.getAttribute('data-social-id'));
  // A disabled repeated click cannot add another event.
  await act(async () => fireEvent.click(like));
  assert.equal(firstCard.querySelector('[data-testid="site-video-like-count"]').textContent, '1');
  assert.equal(readLocalVideoLikesForTests().length, 1);
  reset();
});

await test('weekly result supports and labels both a Short and a Long Video', async () => {
  reset();
  const theme = 'barber_mens_grooming';
  const utils = render(React.createElement(SiteVideoGallery, { themeId: theme, data: salonData(theme), mode: 'tablet' }));
  await waitFor(() => assert.equal(utils.getByTestId('site-social-feed').getAttribute('data-like-status'), 'ready'));
  const shortCard = utils.container.querySelector('[data-testid="site-social-item"][data-video-kind="short"]');
  const longCard = utils.container.querySelector('[data-testid="site-social-item"][data-video-kind="long"]');
  await act(async () => fireEvent.click(shortCard.querySelector('[data-testid="site-video-like"]')));
  await act(async () => fireEvent.click(longCard.querySelector('[data-testid="site-video-like"]')));
  await waitFor(() => assert.equal(utils.getByTestId('site-video-weekly-list').querySelectorAll('[data-testid="site-video-weekly-item"]').length, 2));
  const kinds = Array.from(utils.getByTestId('site-video-weekly-list').querySelectorAll('[data-testid="site-video-weekly-item"]'))
    .map((node) => node.getAttribute('data-video-kind'));
  assert.ok(kinds.includes('short'));
  assert.ok(kinds.includes('long'));
  reset();
});

await test('theme switch does not show the previous theme weekly result', async () => {
  reset();
  const barber = 'barber_mens_grooming';
  let utils = render(React.createElement(SiteVideoGallery, { themeId: barber, data: salonData(barber), mode: 'desktop' }));
  await waitFor(() => assert.equal(utils.getByTestId('site-social-feed').getAttribute('data-like-status'), 'ready'));
  await act(async () => fireEvent.click(utils.container.querySelector('[data-testid="site-video-like"]')));
  await waitFor(() => assert.ok(utils.queryByTestId('site-video-weekly-list')));
  cleanup();

  const nail = 'nail_lash_studio';
  utils = render(React.createElement(SiteVideoGallery, { themeId: nail, data: salonData(nail), mode: 'desktop' }));
  await waitFor(() => assert.equal(utils.getByTestId('site-social-feed').getAttribute('data-like-status'), 'ready'));
  assert.ok(utils.getByTestId('site-video-weekly-empty'));
  const text = utils.getByTestId('site-social-feed').textContent || '';
  assert.equal(text.includes('Step-by-Step Beginner Fade Tutorial'), false);
  reset();
});

await test('loading, error/retry, unavailable and empty states are explicit', async () => {
  reset();
  let utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: salonData(), mode: 'desktop',
  }));
  assert.ok(utils.queryByTestId('site-video-likes-loading') || utils.queryByTestId('site-video-weekly-empty'));
  cleanup();

  setVideoLikeFailureForTests('load');
  utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: salonData(), mode: 'desktop',
  }));
  await waitFor(() => assert.ok(utils.getByTestId('site-video-likes-error')));
  assert.ok(utils.getByTestId('site-video-likes-retry'));
  setVideoLikeFailureForTests(null);
  await act(async () => fireEvent.click(utils.getByTestId('site-video-likes-retry')));
  await waitFor(() => assert.ok(utils.getByTestId('site-video-weekly-empty')));
  cleanup();

  const noIdentity = salonData('barber_mens_grooming', { websiteSlug: '', publishedUrl: '' });
  utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: noIdentity, mode: 'desktop',
  }));
  await waitFor(() => assert.equal(utils.getByTestId('site-social-feed').getAttribute('data-like-status'), 'unavailable'));
  assert.ok(utils.getByTestId('site-video-likes-error'));
  assert.ok(Array.from(utils.container.querySelectorAll('[data-testid="site-video-like"]')).every((button) => button.disabled));
  reset();
});

await test('failed Like leaves count/ranking unchanged and shows card error', async () => {
  reset();
  const utils = render(React.createElement(SiteVideoGallery, {
    themeId: 'barber_mens_grooming', data: salonData(), mode: 'desktop',
  }));
  await waitFor(() => assert.equal(utils.getByTestId('site-social-feed').getAttribute('data-like-status'), 'ready'));
  setVideoLikeFailureForTests('like');
  const card = utils.container.querySelector('[data-testid="site-social-item"]');
  await act(async () => fireEvent.click(card.querySelector('[data-testid="site-video-like"]')));
  await waitFor(() => assert.ok(card.querySelector('[data-testid="site-video-like-error"]')));
  assert.equal(card.querySelector('[data-testid="site-video-like-count"]').textContent, '0');
  assert.ok(utils.getByTestId('site-video-weekly-empty'));
  reset();
});

await test('EN/HI like and weekly copy is complete', () => {
  for (const theme of ['barber_mens_grooming', 'hair_studio_color_bar', 'beauty_skin_spa', 'family_full_service', 'nail_lash_studio']) {
    const en = videoGalleryChrome(theme, 'en');
    const hi = videoGalleryChrome(theme, 'hi');
    for (const key of ['like', 'liked', 'loadingLikes', 'weeklyTopTitle', 'weeklyEmptyTitle', 'weeklyErrorTitle', 'retryLikes']) {
      assert.ok(en[key], `${theme} EN ${key}`);
      assert.ok(hi[key], `${theme} HI ${key}`);
    }
    assert.notEqual(en.like, hi.like);
    assert.notEqual(en.weeklyTopTitle, hi.weeklyTopTitle);
  }
});

section('Database/security architecture + scope guardrails');

await test('schema inspection reuses social_videos + website_events; no parallel likes table/count column', () => {
  const m27 = fs.readFileSync(path.join(root, 'supabase/migrations/20260815000101_m27_video_like_event_type.sql'), 'utf8');
  const m28 = fs.readFileSync(path.join(root, 'supabase/migrations/20260815000102_m28_video_likes_weekly.sql'), 'utf8');
  assert.ok(m27.includes("add value if not exists 'video_like'"));
  assert.equal(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?video_likes/i.test(m28), false);
  assert.equal(/add\s+column[^;]*likes_count/i.test(m28), false);
  assert.ok(m28.includes('insert into public.website_events'));
  assert.ok(m28.includes('public.social_videos'));
  assert.ok(m28.includes('public.themes'));
});

await test('database owns auth identity, duplicate uniqueness, target validation and direct-insert denial', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260815000102_m28_video_likes_weekly.sql'), 'utf8');
  assert.ok(sql.includes('auth.uid()'));
  assert.ok(sql.includes('public.digest'));
  assert.ok(sql.includes('create unique index if not exists idx_website_events_video_like_once'));
  assert.ok(sql.includes('resolve_video_like_kind'));
  assert.ok(sql.includes("event_type <> 'video_like'"), 'direct public likes must be denied');
  assert.ok(sql.includes('security definer'));
  assert.ok(sql.includes('revoke all on function public.like_video'));
  assert.ok(sql.includes('grant execute on function public.like_video'));
  assert.equal(/service_role[^\n]*browser|VITE_.*SERVICE/i.test(sql), false);
});

await test('database weekly ranking uses business timezone/current week and SQL theme filter', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260815000102_m28_video_likes_weekly.sql'), 'utf8');
  assert.ok(sql.includes("date_trunc('week'"));
  assert.ok(sql.includes('business_timezone'));
  assert.ok(sql.includes("metadata ->> 'theme_id' = btrim(p_theme_id)"));
  assert.ok(sql.includes("metadata ->> 'video_key'"));
  assert.ok(sql.includes("'video_kind', video_kind"));
  assert.ok(sql.includes('get_weekly_top_videos'));
});

await test('migration validation includes backend adversarial test U and 28-file replay', () => {
  const validator = fs.readFileSync(path.join(root, 'scripts/validate-migrations.mjs'), 'utf8');
  assert.ok(validator.includes("expected exactly M01-M28"));
  assert.ok(validator.includes('PASS U') || validator.includes("U — video likes"));
  assert.ok(validator.includes('Direct event insertion cannot bypass'));
  assert.ok(validator.includes('assert.equal(passed, 21)'));
});

await test('Phase 15.8 has no dashboard integration or later-phase implementation', () => {
  const files = [
    'src/lib/videoLikes.ts',
    'src/components/SiteVideoGallery.tsx',
    'supabase/migrations/20260815000102_m28_video_likes_weekly.sql',
  ].map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.equal(/Dashboard|dashboard tab|weekly dashboard|Phase 15\.9|Phase 15\.10/i.test(files), false);
  assert.equal(/YOUTUBE_API_KEY|GEMINI_API_KEY|service_role_key/i.test(files), false);
});

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`PHASE 15.8 — likes + weekly ranking: ${passed} passed, ${failed} failed`);
console.log(`════════════════════════════════════════════════════════════`);
if (failed) {
  console.error('\nFailing tests:');
  failures.forEach(({ name }) => console.error(`  - ${name}`));
  process.exit(1);
}
