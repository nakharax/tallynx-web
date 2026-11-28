import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { createMemoryTrafficStore, createSiteTrafficRouter } from './siteTraffic.ts';

function withTempStoreFile(): { file: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'tallynx-traffic-test-'));
  return {
    file: join(dir, 'traffic.json'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

test('createMemoryTrafficStore records unique daily visits, deduplicates sessions, and rolls over UTC+7 day cleanly', () => {
  const { file, cleanup } = withTempStoreFile();
  try {
    const store = createMemoryTrafficStore(file);
    // 2026-11-28 23:58:00 Bangkok (UTC+7) = 2026-11-28T16:58:00Z
    const t1 = Date.parse('2026-11-28T16:58:00Z');
    const snap1 = store('web', 'sess_alpha_001', true, t1);

    assert.equal(snap1.storageMode, 'memory');
    assert.equal(snap1.dayKey, '2026-11-28');
    assert.equal(snap1.siteTotalVisits, 1);
    assert.equal(snap1.siteTodayVisits, 1);
    assert.equal(snap1.siteOnlineNow, 1);
    assert.equal(snap1.ecosystemTotalVisits, 1);

    // Same session on same day must not double-count visits
    const snap2 = store('web', 'sess_alpha_001', true, t1 + 30_000);
    assert.equal(snap2.siteTotalVisits, 1);
    assert.equal(snap2.siteTodayVisits, 1);
    assert.equal(snap2.siteOnlineNow, 1);

    // Second site ('desk') contributes to ecosystem totals
    const snapDesk = store('desk', 'sess_desk_001', true, t1 + 40_000);
    assert.equal(snapDesk.site, 'desk');
    assert.equal(snapDesk.siteTotalVisits, 1);
    assert.equal(snapDesk.ecosystemTotalVisits, 2);
    assert.equal(snapDesk.ecosystemOnlineNow, 2);

    // Cross Bangkok midnight (2026-11-29 00:06:00 Bangkok = 2026-11-28T17:06:00Z)
    // Also exceeds 5-minute online window for previous sessions
    const tNextDay = Date.parse('2026-11-28T17:06:00Z');
    const snapRollover = store('web', 'sess_alpha_001', true, tNextDay);
    assert.equal(snapRollover.dayKey, '2026-11-29');
    assert.equal(snapRollover.siteTodayVisits, 1);
    assert.equal(snapRollover.siteTotalVisits, 2);
    assert.equal(snapRollover.siteOnlineNow, 1);
    assert.equal(snapRollover.ecosystemTodayVisits, 1);
    assert.equal(snapRollover.ecosystemTotalVisits, 3);
  } finally {
    cleanup();
  }
});

test('createMemoryTrafficStore clamps invalid sites and rejects malformed or oversized sessionIds', () => {
  const { file, cleanup } = withTempStoreFile();
  try {
    const store = createMemoryTrafficStore(file);
    const nowMs = Date.parse('2026-11-28T10:00:00Z');

    const badSession = store('unknown-site', 'bad', true, nowMs);
    assert.equal(badSession.site, 'web');
    assert.equal(badSession.siteTotalVisits, 0);
    assert.equal(badSession.siteOnlineNow, 0);

    const oversizedSession = store('web', 'a'.repeat(128), true, nowMs);
    assert.equal(oversizedSession.siteTotalVisits, 0);
    assert.equal(oversizedSession.siteOnlineNow, 0);
  } finally {
    cleanup();
  }
});

test('createSiteTrafficRouter handles GET/POST telemetry, bot filtering, and site clamping', async () => {
  const { file, cleanup } = withTempStoreFile();
  let fixedNow = Date.parse('2026-11-28T12:00:00Z');
  const app = express();
  app.use(express.json());
  app.use(
    '/api',
    createSiteTrafficRouter({
      defaultSite: 'web',
      env: {},
      now: () => fixedNow,
      storeFile: file,
    })
  );

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const initialGet = await fetch(`${baseUrl}/api/telemetry/traffic?site=invalid_alias`);
    assert.equal(initialGet.status, 200);
    const getBody = (await initialGet.json()) as { site: string; siteTotalVisits: number; storageMode: string };
    assert.equal(getBody.site, 'web');
    assert.equal(getBody.siteTotalVisits, 0);
    assert.equal(getBody.storageMode, 'memory');

    // Bot User-Agent must not increment visits
    const botPost = await fetch(`${baseUrl}/api/telemetry/traffic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
      body: JSON.stringify({ site: 'web', sessionId: 'bot_session_1234', pageView: true }),
    });
    assert.equal(botPost.status, 200);
    const botBody = (await botPost.json()) as { siteTotalVisits: number };
    assert.equal(botBody.siteTotalVisits, 0);

    // Real browser User-Agent increments visits cleanly
    const humanPost = await fetch(`${baseUrl}/api/telemetry/traffic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ site: 'tallynx.com', sessionId: 'human_session_01', pageView: true }),
    });
    assert.equal(humanPost.status, 200);
    const humanBody = (await humanPost.json()) as { site: string; siteTotalVisits: number; siteOnlineNow: number };
    assert.equal(humanBody.site, 'web');
    assert.equal(humanBody.siteTotalVisits, 1);
    assert.equal(humanBody.siteOnlineNow, 1);

    // Advance time past 5 min online window and check GET prunes stale online session
    fixedNow += 6 * 60 * 1000;
    const afterExpiry = await fetch(`${baseUrl}/api/telemetry/traffic?site=web`);
    const expiryBody = (await afterExpiry.json()) as { siteTotalVisits: number; siteOnlineNow: number };
    assert.equal(expiryBody.siteTotalVisits, 1);
    assert.equal(expiryBody.siteOnlineNow, 0);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    cleanup();
  }
});
