export type TrafficSiteId = 'web' | 'desk';
export type TrafficStorageMode = 'redis' | 'memory';

export interface SiteTrafficSnapshot {
  site: TrafficSiteId;
  dayKey: string;
  siteTotalVisits: number;
  siteTodayVisits: number;
  siteOnlineNow: number;
  ecosystemTotalVisits: number;
  ecosystemTodayVisits: number;
  ecosystemOnlineNow: number;
  storageMode: TrafficStorageMode;
  updatedAt: string;
}

const BOT_USER_AGENT_RE =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|headlesschrome|lighthouse|pagespeed|pingdom|uptimerobot|statuscake|curl|wget|python-requests|go-http-client|axios|node-fetch|playwright|puppeteer/i;

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const SESSION_KEY_STORAGE = 'TALLYNX_TRAFFIC_SESSION_ID_V1';
const SESSION_RECORDED_PREFIX = 'TALLYNX_TRAFFIC_COUNTED_V1_';

export function normalizeTrafficSite(value: unknown, fallback: TrafficSiteId = 'web'): TrafficSiteId {
  if (typeof value !== 'string') return fallback;
  const norm = value.trim().toLowerCase();
  if (norm === 'web' || norm === 'tallynx-web' || norm === 'tallynx.com') return 'web';
  if (norm === 'desk' || norm === 'tallynx-desk' || norm === 'desk.tallynx.com') return 'desk';
  return fallback;
}

export function normalizeSessionId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return SESSION_ID_RE.test(trimmed) ? trimmed : null;
}

export function isLikelyBotUserAgent(userAgent: unknown): boolean {
  if (typeof userAgent !== 'string' || !userAgent.trim()) return false;
  return BOT_USER_AGENT_RE.test(userAgent);
}

/**
 * Computes YYYY-MM-DD in Asia/Bangkok (UTC+7) deterministically without locale drift.
 */
export function getBangkokDayKey(nowMs: number = Date.now()): string {
  const shifted = new Date(nowMs + 7 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTrafficCount(value: number, lang: 'en' | 'th'): string {
  if (!Number.isFinite(value) || value < 0) return '—';
  const rounded = Math.floor(value);
  if (rounded >= 1_000_000) {
    return `${(rounded / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (rounded >= 10_000) {
    return `${(rounded / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return rounded.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US');
}

export function parseSiteTrafficSnapshot(payload: unknown): SiteTrafficSnapshot | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  const site = raw.site === 'web' || raw.site === 'desk' ? raw.site : null;
  const dayKey = typeof raw.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dayKey) ? raw.dayKey : null;
  const storageMode = raw.storageMode === 'redis' || raw.storageMode === 'memory' ? raw.storageMode : null;
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null;

  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null);
  const siteTotalVisits = num(raw.siteTotalVisits);
  const siteTodayVisits = num(raw.siteTodayVisits);
  const siteOnlineNow = num(raw.siteOnlineNow);
  const ecosystemTotalVisits = num(raw.ecosystemTotalVisits);
  const ecosystemTodayVisits = num(raw.ecosystemTodayVisits);
  const ecosystemOnlineNow = num(raw.ecosystemOnlineNow);

  if (
    !site ||
    !dayKey ||
    !storageMode ||
    !updatedAt ||
    siteTotalVisits === null ||
    siteTodayVisits === null ||
    siteOnlineNow === null ||
    ecosystemTotalVisits === null ||
    ecosystemTodayVisits === null ||
    ecosystemOnlineNow === null
  ) {
    return null;
  }

  return {
    site,
    dayKey,
    siteTotalVisits,
    siteTodayVisits,
    siteOnlineNow,
    ecosystemTotalVisits,
    ecosystemTodayVisits,
    ecosystemOnlineNow,
    storageMode,
    updatedAt,
  };
}

export function getOrCreateTrafficSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY_STORAGE);
    const valid = normalizeSessionId(existing);
    if (valid) return valid;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    window.sessionStorage.setItem(SESSION_KEY_STORAGE, generated);
    return generated;
  } catch {
    return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function shouldRecordSessionPageView(site: TrafficSiteId, dayKey: string = getBangkokDayKey()): boolean {
  try {
    return window.sessionStorage.getItem(`${SESSION_RECORDED_PREFIX}${site}`) !== dayKey;
  } catch {
    return true;
  }
}

export function markSessionPageViewRecorded(site: TrafficSiteId, dayKey: string = getBangkokDayKey()): void {
  try {
    window.sessionStorage.setItem(`${SESSION_RECORDED_PREFIX}${site}`, dayKey);
  } catch {
    // Ignore storage quota errors in private browsing modes.
  }
}
