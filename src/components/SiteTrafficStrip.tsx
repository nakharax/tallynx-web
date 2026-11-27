import React, { useEffect, useState } from 'react';
import { Eye, Globe } from 'lucide-react';
import type { Language } from '../utils/i18n';
import {
  formatTrafficCount,
  getBangkokDayKey,
  getOrCreateTrafficSessionId,
  markSessionPageViewRecorded,
  parseSiteTrafficSnapshot,
  shouldRecordSessionPageView,
  type SiteTrafficSnapshot,
} from '../utils/siteTraffic';

interface SiteTrafficStripProps {
  lang: Language;
}

const HEARTBEAT_MS = 90_000;

export const SiteTrafficStrip: React.FC<SiteTrafficStripProps> = React.memo(({ lang }) => {
  const [snapshot, setSnapshot] = useState<SiteTrafficSnapshot | null>(null);
  const [scope, setScope] = useState<'web' | 'all'>('all');
  const isTh = lang === 'th';

  useEffect(() => {
    let cancelled = false;
    const sessionId = getOrCreateTrafficSessionId();

    const ping = async (isInitial: boolean) => {
      if (!isInitial && typeof document !== 'undefined' && document.hidden) return;
      const dayKey = getBangkokDayKey();
      const pageView = isInitial && shouldRecordSessionPageView('web', dayKey);
      try {
        const res = await fetch('/api/telemetry/traffic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: 'web', sessionId, pageView }),
        });
        if (!res.ok) return;
        const parsed = parseSiteTrafficSnapshot(await res.json());
        if (!parsed || cancelled) return;
        if (pageView) markSessionPageViewRecorded('web', parsed.dayKey);
        setSnapshot(parsed);
      } catch {
        // Non-blocking telemetry — ignore transient offline failures.
      }
    };

    void ping(true);
    const timer = window.setInterval(() => {
      void ping(false);
    }, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const online = snapshot
    ? scope === 'all'
      ? snapshot.ecosystemOnlineNow
      : snapshot.siteOnlineNow
    : null;
  const today = snapshot
    ? scope === 'all'
      ? snapshot.ecosystemTodayVisits
      : snapshot.siteTodayVisits
    : null;
  const total = snapshot
    ? scope === 'all'
      ? snapshot.ecosystemTotalVisits
      : snapshot.siteTotalVisits
    : null;

  return (
    <div
      className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 pt-5 text-xs text-muted sm:px-6 lg:px-8"
      aria-label={isTh ? 'สถิติการเข้าชมเว็บไซต์' : 'Website visitor statistics'}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <Eye className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          {isTh ? 'สถิติการเข้าชม' : 'Site Traffic'}
        </span>
        <div
          className="inline-flex items-center rounded-md border border-hairline bg-canvas p-0.5 text-[11px]"
          role="group"
          aria-label={isTh ? 'ขอบเขตสถิติ' : 'Traffic scope'}
        >
          <button
            type="button"
            aria-pressed={scope === 'all'}
            onClick={() => setScope('all')}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
              scope === 'all' ? 'bg-panel text-ink shadow-xs' : 'text-muted hover:text-ink'
            }`}
          >
            <Globe className="h-3 w-3" aria-hidden="true" />
            {isTh ? 'รวมทั้งระบบ' : 'All TallyNX'}
          </button>
          <button
            type="button"
            aria-pressed={scope === 'web'}
            onClick={() => setScope('web')}
            className={`rounded px-2 py-0.5 font-medium transition-colors ${
              scope === 'web' ? 'bg-panel text-ink shadow-xs' : 'text-muted hover:text-ink'
            }`}
          >
            tallynx.com
          </button>
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono tabular-nums">
        <div className="flex items-center gap-1.5">
          <dt className="inline-flex items-center gap-1.5 font-sans text-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {isTh ? 'ออนไลน์' : 'Online'}
          </dt>
          <dd className="font-semibold text-ink">
            {online === null ? '—' : formatTrafficCount(online, lang)}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-sans text-muted">{isTh ? 'วันนี้' : 'Today'}</dt>
          <dd className="font-semibold text-ink">
            {today === null ? '—' : formatTrafficCount(today, lang)}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-sans text-muted">{isTh ? 'เข้าชมทั้งหมด' : 'Total visits'}</dt>
          <dd className="font-semibold text-ink">
            {total === null ? '—' : formatTrafficCount(total, lang)}
          </dd>
        </div>
      </dl>
    </div>
  );
});

SiteTrafficStrip.displayName = 'SiteTrafficStrip';
