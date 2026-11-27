import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatTrafficCount,
  getBangkokDayKey,
  isLikelyBotUserAgent,
  normalizeSessionId,
  normalizeTrafficSite,
  parseSiteTrafficSnapshot,
} from './siteTraffic.ts';

test('getBangkokDayKey rolls over cleanly at UTC+7 midnight', () => {
  const beforeMidnightBkk = Date.parse('2026-11-26T16:59:59Z');
  const atMidnightBkk = Date.parse('2026-11-26T17:00:00Z');
  assert.equal(getBangkokDayKey(beforeMidnightBkk), '2026-11-26');
  assert.equal(getBangkokDayKey(atMidnightBkk), '2026-11-27');
});

test('normalizeTrafficSite resolves site aliases and falls back safely', () => {
  assert.equal(normalizeTrafficSite('web'), 'web');
  assert.equal(normalizeTrafficSite('tallynx.com'), 'web');
  assert.equal(normalizeTrafficSite('desk.tallynx.com'), 'desk');
  assert.equal(normalizeTrafficSite('unknown', 'web'), 'web');
});

test('normalizeSessionId accepts safe anonymous tokens and rejects invalid input', () => {
  assert.equal(normalizeSessionId('abc123456789'), 'abc123456789');
  assert.equal(normalizeSessionId('short'), null);
  assert.equal(normalizeSessionId('bad/chars!@#123'), null);
});

test('isLikelyBotUserAgent filters crawlers and headless monitors without blocking browsers', () => {
  assert.equal(isLikelyBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(
    isLikelyBotUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'
    ),
    false
  );
});

test('formatTrafficCount formats counts cleanly across ranges', () => {
  assert.equal(formatTrafficCount(42, 'en'), '42');
  assert.equal(formatTrafficCount(12400, 'en'), '12.4K');
  assert.equal(formatTrafficCount(1500000, 'th'), '1.5M');
  assert.equal(formatTrafficCount(-1, 'en'), '—');
});

test('parseSiteTrafficSnapshot validates complete payloads and rejects malformed data', () => {
  const valid = parseSiteTrafficSnapshot({
    site: 'web',
    dayKey: '2026-11-27',
    siteTotalVisits: 330,
    siteTodayVisits: 28,
    siteOnlineNow: 4,
    ecosystemTotalVisits: 450,
    ecosystemTodayVisits: 42,
    ecosystemOnlineNow: 7,
    storageMode: 'redis',
    updatedAt: '2026-11-27T02:00:00.000Z',
  });
  assert.ok(valid);
  assert.equal(valid.ecosystemTotalVisits, 450);
  assert.equal(parseSiteTrafficSnapshot({ site: 'web', dayKey: 'bad' }), null);
});
