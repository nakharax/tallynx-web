import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VALID_APP_ROUTES,
  TALLYNX_DESK_APP_URL,
  TREDYN_DESK_URL,
  TREDYN_MALL_URL,
  TREDYN_MALL_CHAT_URL,
  getNavCategories,
  resolveWebTheme,
  toggleCategoryDropdown,
  normalizeRoutePath,
  isCategoryActive,
  getRouteNavigationContext,
  getRouteSkeletonConfig,
  shouldForceSkeletonFromSearch,
} from './navLogic';
import { getDictionary } from './i18n';

const expectedRoutes = [
  '/', '/sandbox', '/workspace', '/analytics', '/infrastructure', '/marketplace', '/onboarding',
];

test('two localized navigation categories cover exactly the seven core routes', () => {
  assert.deepEqual(VALID_APP_ROUTES, expectedRoutes);
  for (const lang of ['en', 'th'] as const) {
    const categories = getNavCategories(lang);
    assert.deepEqual(categories.map(({ id }) => id), ['tools', 'platform']);

    const [tools, platform] = categories;
    assert.deepEqual(tools.items.map(({ href }) => href), expectedRoutes.slice(0, 4));
    assert.deepEqual(platform.items.filter((item) => !item.external).map(({ href }) => href), expectedRoutes.slice(4));
    const external = categories.flatMap(({ items }) => items).filter((item) => item.external);
    assert.equal(external.length, 1);
    assert.equal(external[0].title, getDictionary(lang).nav.openDesk);
    assert.equal(external[0].href, TALLYNX_DESK_APP_URL);
  }
  assert.deepEqual(getNavCategories('en').map(({ label }) => label), ['Risk Tools', 'Bridge & Setup']);
  assert.ok(getNavCategories('th').every(({ label }) => /[\u0E00-\u0E7F]/.test(label)));
});

test('overriding the Desk handoff URL leaves internal links and default data intact', () => {
  const deskUrl = 'https://desk.tallynx.com/?lang=th&theme=dark&page=calc';
  for (const lang of ['en', 'th'] as const) {
    const [tools, platform] = getNavCategories(lang, deskUrl);
    assert.equal(tools, getNavCategories(lang)[0]);
    assert.deepEqual(platform.items.filter((item) => !item.external), getNavCategories(lang)[1].items.filter((item) => !item.external));
    const deskLink = platform.items.find(({ id }) => id === 'launch-desk');
    assert.equal(deskLink?.href, deskUrl);
    assert.equal(deskLink?.external, true);
    assert.equal(getNavCategories(lang)[1].items.find((item) => item.external)?.href, TALLYNX_DESK_APP_URL);
  }
});

test('existing Mall links retain their destinations', () => {
  assert.equal(TREDYN_MALL_URL, 'https://mall.tallynx.com/');
  assert.equal(TREDYN_DESK_URL, TREDYN_MALL_URL);
  assert.equal(TREDYN_MALL_CHAT_URL, 'https://mall.tallynx.com/?page=mall');
});

test('route normalization keeps core paths and sends retired or unknown paths to the overview', () => {
  for (const route of VALID_APP_ROUTES) {
    assert.equal(normalizeRoutePath(route), route);
    assert.equal(normalizeRoutePath(`${route}//`), route);
  }
  for (const path of [
    '', '/telemetry-core', '/brand-film/', '/philosophy', '/developer-api', '/roadmap',
    '/solutions', '/leaderboard', '/@profile', '/@example.trader/', '/sandbox/extra', '/unknown-route',
  ]) {
    assert.equal(normalizeRoutePath(path), '/', path);
  }
});

test('route context has one active category and wraps between internal links in either language', () => {
  for (const lang of ['en', 'th'] as const) {
    VALID_APP_ROUTES.forEach((route, index) => {
      const context = getRouteNavigationContext(route, lang);
      const activeCategories = getNavCategories(lang).filter((category) => isCategoryActive(category, route));
      assert.deepEqual(activeCategories, [context.category]);
      assert.equal(context.currentItem.href, route);
      assert.equal(context.prevItem.href, VALID_APP_ROUTES.at(index - 1));
      assert.equal(context.nextItem.href, VALID_APP_ROUTES[(index + 1) % VALID_APP_ROUTES.length]);
    });
  }
});

test('the seven loading layouts use the current route title and status in both languages', () => {
  const variants = [
    'hero-split', 'live-sandbox', 'workspace-showcase', 'analytics-dashboard',
    'comparison-split', 'marketplace-grid', 'onboarding-funnel',
  ];
  VALID_APP_ROUTES.forEach((route, index) => {
    const en = getRouteSkeletonConfig(route, 'en');
    const th = getRouteSkeletonConfig(route, 'th');
    assert.equal(en.routePath, route);
    assert.equal(th.routePath, route);
    assert.equal(en.variant, variants[index]);
    assert.equal(th.variant, en.variant);
    assert.equal(en.statusLabel, `Loading · ${route}`);
    assert.equal(th.statusLabel, `กำลังโหลด · ${route}`);
    assert.equal(en.moduleTitle, getRouteNavigationContext(route, 'en').currentItem.title);
    assert.equal(th.moduleTitle, getRouteNavigationContext(route, 'th').currentItem.title);
  });
});

test('dropdown toggles between the two categories and closes on a repeat click', () => {
  assert.equal(toggleCategoryDropdown(null, 'tools'), 'tools');
  assert.equal(toggleCategoryDropdown('tools', 'platform'), 'platform');
  assert.equal(toggleCategoryDropdown('platform', 'platform'), null);
});

test('theme and skeleton query options preserve their existing behavior', () => {
  assert.equal(resolveWebTheme('?lang=en&theme=dark'), 'dark');
  assert.equal(resolveWebTheme('?theme=LIGHT'), 'light');
  assert.equal(resolveWebTheme('?theme=obsidian'), undefined);
  assert.equal(resolveWebTheme(''), undefined);
  assert.equal(shouldForceSkeletonFromSearch(''), false);
  assert.equal(shouldForceSkeletonFromSearch('?foo=bar'), false);
  assert.equal(shouldForceSkeletonFromSearch('?skeleton=0'), false);
  assert.equal(shouldForceSkeletonFromSearch('?skeleton=1'), true);
  assert.equal(shouldForceSkeletonFromSearch('skeleton=true'), true);
});
