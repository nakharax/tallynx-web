import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommandPaletteItems, filterCommandPaletteItems } from './commandPaletteLogic.ts';
import { getDictionary } from './i18n';
import { getRouteNavigationContext, VALID_APP_ROUTES } from './navLogic';

test('the palette uses localized navigation copy for all seven routes and keeps four quick actions', () => {
  for (const lang of ['en', 'th'] as const) {
    const items = buildCommandPaletteItems(lang, false);
    const routes = items.filter((item) => item.kind === 'route');
    const actions = items.filter((item) => item.kind === 'action');

    assert.deepEqual(routes.map(({ href }) => href), VALID_APP_ROUTES);
    assert.deepEqual(actions.map(({ actionId }) => actionId), ['launch-desk', 'open-advisor', 'toggle-theme', 'toggle-lang']);
    assert.equal(new Set(items.map(({ id }) => id)).size, items.length);
    assert.equal(actions.find(({ actionId }) => actionId === 'launch-desk')?.title, getDictionary(lang).nav.openDesk);

    for (const { href, title, groupLabel, badge } of routes) {
      const { currentItem, category } = getRouteNavigationContext(href, lang);
      assert.equal(title, currentItem.title);
      assert.equal(groupLabel, category.label);
      assert.equal(badge, href);
    }
  }
});

test('search ranks exact routes and recognizes tool, theme, and localized terms', () => {
  const items = buildCommandPaletteItems('en', true);
  assert.deepEqual(filterCommandPaletteItems(items, '  '), items);
  assert.equal(filterCommandPaletteItems(items, 'sAnDbOx')[0]?.id, 'route-sandbox');
  assert.equal(filterCommandPaletteItems(items, '/analytics')[0]?.id, 'route-analytics');
  assert.equal(filterCommandPaletteItems(items, 'statement autopsy')[0]?.id, 'route-overview');
  assert.equal(filterCommandPaletteItems(items, 'light mode')[0]?.id, 'action-toggle-theme');
  const thItems = buildCommandPaletteItems('th', false);
  assert.equal(filterCommandPaletteItems(thItems, 'ตรวจสอบ Drawdown')[0]?.id, 'route-analytics');
  assert.equal(filterCommandPaletteItems(thItems, 'โหมดมืด')[0]?.id, 'action-toggle-theme');
});

test('old page and action names do not appear in search', () => {
  const items = buildCommandPaletteItems('en', true);
  for (const query of ['brand film', 'developer api', 'leaderboard', 'roadmap', '@example-trader', 'missing-page']) {
    assert.deepEqual(filterCommandPaletteItems(items, query), [], query);
  }
});
