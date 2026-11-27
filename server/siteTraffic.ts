import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import {
  getBangkokDayKey,
  isLikelyBotUserAgent,
  normalizeSessionId,
  normalizeTrafficSite,
  parseSiteTrafficSnapshot,
  type SiteTrafficSnapshot,
  type TrafficSiteId,
} from '../src/utils/siteTraffic.js';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const DAY_KEY_TTL_SEC = 60 * 60 * 48;
const REDIS_PREFIX = 'tallynx:traffic:v1';
const DEFAULT_HUB_URL = 'https://desk.tallynx.com/api/telemetry/traffic';

interface UpstashConfig {
  url: string;
  token: string;
}

interface MemorySiteState {
  total: number;
  dayKey: string;
  today: number;
  seenToday: string[];
  online: Record<string, number>;
}

interface MemoryStoreShape {
  web: MemorySiteState;
  desk: MemorySiteState;
}

function resolveUpstashConfig(env: NodeJS.ProcessEnv = process.env): UpstashConfig | null {
  const url = (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || '').trim().replace(/\/+$/, '');
  const token = (env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || '').trim();
  if (!url || !token || !/^https?:\/\//i.test(url)) return null;
  return { url, token };
}

async function runRedisPipeline(
  config: UpstashConfig,
  commands: (string | number)[][],
  fetcher: typeof fetch = fetch
): Promise<unknown[]> {
  const response = await fetcher(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(4000),
    redirect: 'error',
  });
  if (!response.ok) {
    throw new Error(`Upstash REST pipeline failed (${response.status})`);
  }
  const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(payload)) {
    throw new Error('Unexpected Upstash pipeline payload');
  }
  return payload.map((item) => item?.result);
}

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

async function recordAndReadRedis(
  config: UpstashConfig,
  site: TrafficSiteId,
  sessionId: string | null,
  pageView: boolean,
  nowMs: number,
  fetcher: typeof fetch
): Promise<SiteTrafficSnapshot> {
  const dayKey = getBangkokDayKey(nowMs);
  const cutoffMs = nowMs - ONLINE_WINDOW_MS;

  const totalKey = (s: TrafficSiteId) => `${REDIS_PREFIX}:total:${s}`;
  const dayCountKey = (s: TrafficSiteId) => `${REDIS_PREFIX}:day:${s}:${dayKey}`;
  const seenKey = (s: TrafficSiteId) => `${REDIS_PREFIX}:seen:${s}:${dayKey}`;
  const onlineKey = (s: TrafficSiteId) => `${REDIS_PREFIX}:online:${s}`;

  if (sessionId) {
    if (pageView) {
      const [added] = await runRedisPipeline(
        config,
        [
          ['SADD', seenKey(site), sessionId],
          ['EXPIRE', seenKey(site), DAY_KEY_TTL_SEC],
        ],
        fetcher
      );
      if (toCount(added) > 0) {
        await runRedisPipeline(
          config,
          [
            ['INCR', totalKey(site)],
            ['INCR', dayCountKey(site)],
            ['EXPIRE', dayCountKey(site), DAY_KEY_TTL_SEC],
          ],
          fetcher
        );
      }
    }

    await runRedisPipeline(
      config,
      [
        ['ZADD', onlineKey(site), nowMs, sessionId],
        ['EXPIRE', onlineKey(site), 900],
      ],
      fetcher
    );
  }

  const results = await runRedisPipeline(
    config,
    [
      ['ZREMRANGEBYSCORE', onlineKey('web'), 0, cutoffMs],
      ['ZREMRANGEBYSCORE', onlineKey('desk'), 0, cutoffMs],
      ['GET', totalKey('web')],
      ['GET', dayCountKey('web')],
      ['ZCARD', onlineKey('web')],
      ['GET', totalKey('desk')],
      ['GET', dayCountKey('desk')],
      ['ZCARD', onlineKey('desk')],
    ],
    fetcher
  );

  const webTotal = toCount(results[2]);
  const webToday = toCount(results[3]);
  const webOnline = toCount(results[4]);
  const deskTotal = toCount(results[5]);
  const deskToday = toCount(results[6]);
  const deskOnline = toCount(results[7]);

  const isWeb = site === 'web';
  const siteTotalVisits = isWeb ? webTotal : deskTotal;
  const siteTodayVisits = isWeb ? webToday : deskToday;
  const siteOnlineNow = Math.max(sessionId ? 1 : 0, isWeb ? webOnline : deskOnline);

  return {
    site,
    dayKey,
    siteTotalVisits,
    siteTodayVisits,
    siteOnlineNow,
    ecosystemTotalVisits: webTotal + deskTotal,
    ecosystemTodayVisits: webToday + deskToday,
    ecosystemOnlineNow: Math.max(siteOnlineNow, webOnline + deskOnline),
    storageMode: 'redis',
    updatedAt: new Date(nowMs).toISOString(),
  };
}

async function proxyToHub(
  hubUrl: string,
  method: 'GET' | 'POST',
  site: TrafficSiteId,
  sessionId: string | null,
  pageView: boolean,
  userAgent: string | undefined,
  fetcher: typeof fetch
): Promise<SiteTrafficSnapshot | null> {
  try {
    const target = method === 'GET' ? `${hubUrl}?site=${encodeURIComponent(site)}` : hubUrl;
    const response = await fetcher(target, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
      },
      ...(method === 'POST' ? { body: JSON.stringify({ site, sessionId, pageView }) } : {}),
      signal: AbortSignal.timeout(3500),
      redirect: 'error',
    });
    if (!response.ok) return null;
    return parseSiteTrafficSnapshot(await response.json());
  } catch {
    return null;
  }
}

function emptySiteState(dayKey: string): MemorySiteState {
  return { total: 0, dayKey, today: 0, seenToday: [], online: {} };
}

function createMemoryTrafficStore(filePath: string) {
  let state: MemoryStoreShape | null = null;

  function load(dayKey: string): MemoryStoreShape {
    if (state) return state;
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<MemoryStoreShape>;
      state = {
        web: parsed.web ? { ...emptySiteState(dayKey), ...parsed.web } : emptySiteState(dayKey),
        desk: parsed.desk ? { ...emptySiteState(dayKey), ...parsed.desk } : emptySiteState(dayKey),
      };
    } catch {
      state = { web: emptySiteState(dayKey), desk: emptySiteState(dayKey) };
    }
    return state;
  }

  function persist(next: MemoryStoreShape) {
    const tmp = `${filePath}.${randomUUID()}.tmp`;
    try {
      writeFileSync(tmp, JSON.stringify(next), { encoding: 'utf8', mode: 0o600 });
      renameSync(tmp, filePath);
    } catch {
      try {
        rmSync(tmp, { force: true });
      } catch {
        // Memory fallback only.
      }
    }
  }

  function pruneAndRollover(siteState: MemorySiteState, dayKey: string, cutoffMs: number) {
    if (siteState.dayKey !== dayKey) {
      siteState.dayKey = dayKey;
      siteState.today = 0;
      siteState.seenToday = [];
    }
    for (const [sid, ts] of Object.entries(siteState.online)) {
      if (!Number.isFinite(ts) || ts < cutoffMs) {
        delete siteState.online[sid];
      }
    }
    if (siteState.seenToday.length > 5000) {
      siteState.seenToday = siteState.seenToday.slice(-2500);
    }
  }

  return function recordAndReadMemory(
    site: TrafficSiteId,
    sessionId: string | null,
    pageView: boolean,
    nowMs: number
  ): SiteTrafficSnapshot {
    const dayKey = getBangkokDayKey(nowMs);
    const cutoffMs = nowMs - ONLINE_WINDOW_MS;
    const store = load(dayKey);
    pruneAndRollover(store.web, dayKey, cutoffMs);
    pruneAndRollover(store.desk, dayKey, cutoffMs);

    const target = store[site];
    let dirty = false;

    if (sessionId) {
      target.online[sessionId] = nowMs;
      dirty = true;
      if (pageView && !target.seenToday.includes(sessionId)) {
        target.seenToday.push(sessionId);
        target.total += 1;
        target.today += 1;
      }
    }

    if (dirty) persist(store);

    const webOnline = Object.keys(store.web.online).length;
    const deskOnline = Object.keys(store.desk.online).length;
    const isWeb = site === 'web';
    const siteOnlineNow = Math.max(sessionId ? 1 : 0, isWeb ? webOnline : deskOnline);

    return {
      site,
      dayKey,
      siteTotalVisits: target.total,
      siteTodayVisits: target.today,
      siteOnlineNow,
      ecosystemTotalVisits: store.web.total + store.desk.total,
      ecosystemTodayVisits: store.web.today + store.desk.today,
      ecosystemOnlineNow: Math.max(siteOnlineNow, webOnline + deskOnline),
      storageMode: 'memory',
      updatedAt: new Date(nowMs).toISOString(),
    };
  };
}

export function createSiteTrafficRouter(options: {
  defaultSite?: TrafficSiteId;
  env?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch;
  now?: () => number;
  storeFile?: string;
} = {}) {
  const router = express.Router();
  const defaultSite = options.defaultSite ?? 'web';
  const env = options.env ?? process.env;
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const isProd = Boolean(env.VERCEL || env.VERCEL_ENV || env.NODE_ENV === 'production');
  const hubUrl = (env.TALLYNX_TRAFFIC_HUB_URL || (isProd ? DEFAULT_HUB_URL : '')).trim();
  const recordMemory = createMemoryTrafficStore(
    options.storeFile ?? join(tmpdir(), 'tallynx_web_traffic_v1.json')
  );

  router.get('/telemetry/traffic', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const site = normalizeTrafficSite(req.query.site, defaultSite);
    const nowMs = now();
    const redisConfig = resolveUpstashConfig(env);

    if (redisConfig) {
      try {
        return res.json(await recordAndReadRedis(redisConfig, site, null, false, nowMs, fetcher));
      } catch {
        // Fall through cleanly.
      }
    }
    if (hubUrl) {
      const forwarded = await proxyToHub(hubUrl, 'GET', site, null, false, req.headers['user-agent'], fetcher);
      if (forwarded) return res.json(forwarded);
    }
    return res.json(recordMemory(site, null, false, nowMs));
  });

  router.post('/telemetry/traffic', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const site = normalizeTrafficSite(body.site, defaultSite);
    const isBot = isLikelyBotUserAgent(req.headers['user-agent']);
    const sessionId = isBot ? null : normalizeSessionId(body.sessionId);
    const pageView = !isBot && body.pageView === true && Boolean(sessionId);
    const nowMs = now();
    const redisConfig = resolveUpstashConfig(env);

    if (redisConfig) {
      try {
        return res.json(await recordAndReadRedis(redisConfig, site, sessionId, pageView, nowMs, fetcher));
      } catch {
        // Fall through cleanly.
      }
    }
    if (hubUrl) {
      const forwarded = await proxyToHub(hubUrl, 'POST', site, sessionId, pageView, req.headers['user-agent'], fetcher);
      if (forwarded) return res.json(forwarded);
    }
    return res.json(recordMemory(site, sessionId, pageView, nowMs));
  });

  return router;
}
