import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  ChartNoAxesColumnDecreasing,
  ChartPie,
  FileSearch,
  Store,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { InstantRiskCalculator } from './InstantRiskCalculator';
import { Language, getDictionary } from '../utils/i18n';
import {
  ENGINE_LABELS,
  LANDING_AUTOPSY_PROOF,
  LANDING_MARKETPLACE_SPOTLIGHT,
  VERIFICATION_LABELS,
} from '../utils/landingSpotlightData';
import { TALLYNX_DESK_APP_URL } from '../utils/navLogic';
import {
  OnboardingTransferState,
  buildDeskHandoffUrl,
} from '../utils/onboardingLogic';

const loadAutopsyPreviewCard = () => import('./PropAutopsyPreviewCard');
const PropAutopsyPreviewCard = React.lazy(loadAutopsyPreviewCard);

const toolAnchors = { calculator: '#value-first-calculator', autopsy: '#statement-autopsy' } as const;
type LandingTool = keyof typeof toolAnchors;

const { tilt: tiltProof, consistency: consistencyProof } = LANDING_AUTOPSY_PROOF;

const prefersReducedMotionNow = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface LandingOverviewProps {
  lang: Language;
  isDark: boolean;
  transferState: OnboardingTransferState;
  hasCustomTransferState: boolean;
  onChangeTransferState: (next: OnboardingTransferState) => void;
  onActivateDeskFlow: (state: OnboardingTransferState) => void;
  onNavigate: (path: string) => void;
}

export const LandingOverview: React.FC<LandingOverviewProps> = React.memo(({
  lang,
  isDark,
  transferState,
  hasCustomTransferState,
  onChangeTransferState,
  onActivateDeskFlow,
  onNavigate,
}) => {
  const isTh = lang === 'th';
  const t = React.useMemo(() => getDictionary(lang), [lang]);
  const [{ active: activeTool, openedAutopsy }, setToolView] = React.useState({
    active: 'calculator' as LandingTool,
    openedAutopsy: false,
  });

  const prefetchAutopsy = React.useCallback(() => {
    void loadAutopsyPreviewCard();
  }, []);

  const selectTool = React.useCallback((tool: LandingTool) => {
    setToolView((current) => current.active === tool
      ? current
      : { active: tool, openedAutopsy: current.openedAutopsy || tool === 'autopsy' });
  }, []);

  React.useEffect(() => {
    const syncToolFromHash = () => selectTool(window.location.hash === toolAnchors.autopsy ? 'autopsy' : 'calculator');
    syncToolFromHash();
    window.addEventListener('hashchange', syncToolFromHash);

    const hash = window.location.hash;
    const scrollFrame = hash === toolAnchors.calculator || hash === toolAnchors.autopsy
      ? window.requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
      : undefined;
    return () => {
      window.removeEventListener('hashchange', syncToolFromHash);
      if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame);
    };
  }, [selectTool]);

  const focusToolTab = React.useCallback(
    (tool: LandingTool) => document.getElementById(`landing-tool-${tool}-tab`)?.focus({ preventScroll: true }),
    []
  );

  const followToolLink = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>, tool: LandingTool) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const hash = toolAnchors[tool];
    if (window.location.hash !== hash) window.history.pushState(window.history.state, '', hash);
    selectTool(tool);
    focusToolTab(tool);
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: prefersReducedMotionNow() ? 'auto' : 'smooth' });
  }, [selectTool, focusToolTab]);

  const changeToolTab = React.useCallback((tool: LandingTool) => {
    if (window.location.hash !== toolAnchors[tool]) window.history.replaceState(window.history.state, '', toolAnchors[tool]);
    selectTool(tool);
  }, [selectTool]);

  const onToolTabKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'calculator'
      : event.key === 'End' ? 'autopsy'
        : activeTool === 'calculator' ? 'autopsy' : 'calculator';
    changeToolTab(next);
    focusToolTab(next);
  }, [activeTool, changeToolTab, focusToolTab]);

  const theme = isDark ? 'dark' : 'light';
  const deskLaunchUrl = React.useMemo(
    () => buildDeskHandoffUrl(TALLYNX_DESK_APP_URL, hasCustomTransferState ? transferState : undefined, {
      lang, theme, page: 'calc', source: 'landing_cta',
    }),
    [hasCustomTransferState, transferState, lang, theme]
  );
  const toolTabs = React.useMemo(() => [
    { id: 'calculator', label: isTh ? '10 วิ · เช็ก Lot และเพดานขาดทุน' : '10s Lot & Daily-DD Shield', Icon: Calculator },
    { id: 'autopsy', label: isTh ? '30 วิ · ผ่า Statement' : '30s Statement Autopsy', Icon: FileSearch },
  ] as const, [isTh]);

  const proofCards = React.useMemo(() => {
    const locale = isTh ? 'th-TH' : 'en-US';
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
    const percentage = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
    const bestDayShare = (share: number | null) => share === null ? '—' : percentage.format(share / 100);
    return [
      {
        title: isTh ? 'ชนเพดานขาดทุนรายวัน' : 'Daily DD Breach',
        before: money.format(tiltProof.worstDailyClosedLossUsd),
        after: money.format(tiltProof.disciplinedWorstDailyClosedLossUsd),
        note: isTh ? 'ขาดทุนสะสมจากไม้ที่ปิดแล้ว เทียบเพดานตัวอย่าง $2,500' : 'Worst closed-trade daily loss · $2,500 sample cap',
        Icon: ChartNoAxesColumnDecreasing,
      },
      {
        title: isTh ? 'ไม้แก้มือใน 15 นาทีหลังชน SL' : '<15m Post-SL Tilt',
        before: money.format(tiltProof.preventableTiltLossUsd),
        after: money.format(0),
        note: isTh ? `ตัด ${tiltProof.tiltTradeCount} ไม้ขาดทุนออกจากแบบจำลอง` : `${tiltProof.tiltTradeCount} flagged losses omitted in the replay`,
        Icon: Timer,
      },
      {
        title: isTh ? 'ติดเกณฑ์กำไรวันสูงสุด 40%' : '40% Best-Day Trap',
        before: bestDayShare(consistencyProof.bestDaySharePct),
        after: bestDayShare(consistencyProof.disciplinedBestDaySharePct),
        note: isTh ? 'สัดส่วนกำไรวันสูงสุดเทียบกำไรสุทธิรวม' : 'Best day as a share of sample net P&L',
        Icon: ChartPie,
      },
    ];
  }, [isTh]);

  return (
    <main data-testid="landing-overview-page">
      <section
        id="overview"
        className="tnx-hero-surface overflow-clip border-b border-hairline py-8 sm:py-11 lg:py-14"
      >
        <div
          data-testid="hero-water-foreground"
          data-water-surface="foreground"
          className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10 xl:gap-14">
            <div className="min-w-0">
              <span className="tnx-hero-label">
                {isTh ? 'วิเคราะห์ความเสี่ยง MT5 แบบอ่านอย่างเดียว' : 'Read-only MT5 risk analytics'}
              </span>

              <h1 className="tnx-hero-title mt-4 text-ink">
                <span
                  data-water-zone="headline-top"
                  className="block"
                >
                  {t.hero.headlineLine1}
                </span>{' '}
                <span
                  data-water-zone="headline-accent"
                  className="block text-focus"
                >
                  {t.hero.headlineAccent}
                </span>
              </h1>
            </div>

            <div className="min-w-0 lg:pt-5">
              <p
                data-water-zone="subheadline"
                className="max-w-lg text-base leading-relaxed text-muted"
              >
                {t.hero.subheadline}
              </p>

              <div className="tnx-hero-actions mt-6 flex flex-wrap gap-2.5">
                <a
                  href={toolAnchors.calculator}
                  onClick={(event) => followToolLink(event, 'calculator')}
                  data-testid="hero-risk-calculator-cta"
                  className="desk-primary"
                >
                  <span>{t.hero.exploreCta}</span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
                <a
                  href={toolAnchors.autopsy}
                  onMouseEnter={prefetchAutopsy}
                  onFocus={prefetchAutopsy}
                  onClick={(event) => followToolLink(event, 'autopsy')}
                  data-testid="hero-statement-autopsy-cta"
                  className="tnx-hero-secondary gap-2"
                >
                  <FileSearch aria-hidden="true" className="h-4 w-4 shrink-0 text-focus" />
                  {t.hero.auditCta}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="landing-proof-heading" className="border-b border-hairline py-5 sm:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-1.5">
            <h2 id="landing-proof-heading" className="text-sm font-semibold text-ink">
              {isTh ? 'ผลจำลองจากชาเลนจ์ตัวอย่าง' : 'What changes in the sample replay'}
            </h2>
            <p className="text-xs text-muted">{isTh ? 'ผลตามประวัติ → ผลจำลอง' : 'Recorded → simulated'}</p>
          </div>
          <dl className="mt-2.5 grid divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:bg-[#09090B]">
            {proofCards.map(({ title, before, after, note, Icon }) => (
              <div key={title} className="min-w-0 px-4 py-3.5">
                <dt className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-focus" />
                  {title}
                </dt>
                <dd className="mt-1.5 flex flex-wrap items-center gap-x-2 font-mono text-lg font-bold tabular-nums text-ink sm:text-xl lg:text-2xl">
                  {before}
                  <span className="text-sm font-medium text-muted">→</span>
                  <span className="text-focus">{after}</span>
                </dd>
                <dd className="mt-1 text-xs text-muted">{note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="value-first-calculator"
        data-testid="value-first-calculator-section"
        className="scroll-mt-2 border-b border-hairline py-7 lg:py-10"
      >
        <div className="relative z-10 mx-auto max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {isTh ? 'เช็กความเสี่ยงพอร์ต MT5' : 'MT5 risk checks'}
            </h2>
            <p className="text-xs text-muted">{isTh ? 'ใช้ฟรี · ไม่ต้องล็อกอิน' : 'Free to use · No login'}</p>
          </div>

          <div
            id="statement-autopsy"
            role="tablist"
            aria-label={isTh ? 'เครื่องมือเช็กความเสี่ยง MT5' : 'MT5 risk tools'}
            className="grid max-w-2xl scroll-mt-2 grid-cols-2 gap-1.5 rounded-xl border border-hairline bg-white p-1.5 dark:bg-[#09090B]"
          >
            {toolTabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`landing-tool-${id}-tab`}
                type="button"
                role="tab"
                aria-selected={activeTool === id}
                aria-controls={`landing-tool-${id}-panel`}
                tabIndex={activeTool === id ? 0 : -1}
                onMouseEnter={id === 'autopsy' ? prefetchAutopsy : undefined}
                onFocus={id === 'autopsy' ? prefetchAutopsy : undefined}
                onClick={() => changeToolTab(id)}
                onKeyDown={onToolTabKeyDown}
                className={`flex min-h-12 min-w-0 cursor-pointer items-center justify-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold leading-snug transition-colors sm:px-3.5 sm:text-sm ${
                  activeTool === id ? 'bg-accent-solid text-white' : 'text-ink hover:bg-accent-solid/5 hover:text-focus'
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div
            id="landing-tool-calculator-panel"
            role="tabpanel"
            aria-labelledby="landing-tool-calculator-tab"
            hidden={activeTool !== 'calculator'}
            tabIndex={0}
            className="tnx-panel-reveal [--desk-caution:var(--desk-focus)] [--desk-negative:var(--desk-ink)] [--desk-positive:var(--desk-focus)]"
          >
            <InstantRiskCalculator
              lang={lang}
              isDark={isDark}
              transferState={transferState}
              onChangeState={onChangeTransferState}
              onActivateDeskFlow={onActivateDeskFlow}
            />
          </div>
          <div
            id="landing-tool-autopsy-panel"
            role="tabpanel"
            aria-labelledby="landing-tool-autopsy-tab"
            hidden={activeTool !== 'autopsy'}
            tabIndex={0}
            className="tnx-panel-reveal"
          >
            {openedAutopsy && (
              <React.Suspense fallback={
                <p role="status" className="desk-panel p-4 text-sm text-muted">
                  {isTh ? 'กำลังเปิดเครื่องมือวิเคราะห์ Statement…' : 'Opening the statement preview…'}
                </p>
              }>
                <PropAutopsyPreviewCard lang={lang} isDark={isDark} transferState={transferState} />
              </React.Suspense>
            )}
          </div>
        </div>
      </section>

      {/* 4. Clean 5 Core Engines Grid (Balanced layout, zero duplicated showcase) */}
      <section
        id="desk-v32-features"
        data-testid="desk-v32-features"
        className="perf-defer-section border-b border-hairline py-10 lg:py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4 mb-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold text-focus">
                {isTh ? 'หน้าจอโต๊ะเทรด' : 'Workspace views'}
              </div>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-[-0.02em] text-[#141618] sm:text-3xl dark:text-[#F8F6F0] text-balance">
                {t.deskV32.title}
              </h2>
            </div>

            <a
              href="/workspace"
              data-testid="engines-live-sandbox-cta"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/workspace');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-focus hover:underline whitespace-nowrap"
            >
              <span>{isTh ? 'สำรวจหน้าจอทั้งหมด' : 'Explore full workspace'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {t.deskV32.features.map((feat) => (
              <a
                key={feat.code}
                href="/workspace"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/workspace');
                }}
                data-testid={`desk-v32-card-${feat.code.slice(0, 2)}`}
                className="desk-panel group flex flex-col justify-between gap-3 p-4 transition-colors hover:border-focus"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-focus">
                      {feat.code}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      {feat.metricBadge}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-[#141618] group-hover:text-focus dark:text-white transition-colors">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    {feat.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-hairline font-mono text-[11px] text-muted">
                  {feat.specFooter}
                </div>
              </a>
            ))}

            <a
              href="/sandbox"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/sandbox');
              }}
              className="desk-panel flex flex-col justify-between gap-3 p-4 border-dashed transition-colors hover:border-focus"
            >
              <div>
                <div className="font-mono text-xs font-semibold text-focus">
                  {isTh ? 'ทดลองใช้งานทันที' : 'Interactive tour'}
                </div>
                <h3 className="mt-2 text-sm font-bold text-ink">
                  {isTh ? 'จำลอง Drawdown และช่วงพักหลังชน SL' : 'Simulate drawdown and cooldowns'}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {isTh
                    ? 'ลองสลับโหมดพอร์ต ดูช่วงพัก 15 นาทีหลังชน SL และดูตัวอย่างคำเตือนจากโค้ช AI โดยไม่ต้องล็อกอิน'
                    : 'Switch account modes and preview the 15-minute cooldown after a stop-loss and AI Coach alerts. No sign-in required.'}
                </p>
              </div>
              <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs font-semibold text-focus">
                <span>{t.ctaSection.sandboxCta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 5. Verified Marketplace Spotlight */}
      <section
        data-testid="marketplace-spotlight"
        className="perf-defer-section border-b border-hairline py-10 lg:py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-hairline">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold text-focus">
                TallyNX Marketplace
              </div>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-[-0.02em] text-[#141618] sm:text-3xl dark:text-[#F8F6F0] text-balance">
                {isTh
                  ? 'ชุดตั้งค่าและเครื่องมือจากคอมมูนิตี้'
                  : 'Community setups and tools'}
              </h2>
            </div>

            <a
              href="/marketplace"
              data-testid="spotlight-open-marketplace"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/marketplace');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-focus hover:underline whitespace-nowrap"
            >
              <Store className="h-3.5 w-3.5" />
              <span>{isTh ? 'เปิด Marketplace ทั้งหมด' : 'Browse Marketplace'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {LANDING_MARKETPLACE_SPOTLIGHT.map((idea) => (
              <a
                key={idea.id}
                href={`/marketplace?idea=${idea.id}`}
                data-testid={`spotlight-idea-card-${idea.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(`/marketplace?idea=${idea.id}`);
                }}
                className="desk-panel group flex flex-col justify-between p-5 transition-colors hover:border-focus"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium">
                    <span className="font-semibold text-focus">
                      {ENGINE_LABELS[idea.engineType]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{VERIFICATION_LABELS[idea.verificationMethod][lang]}</span>
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-[#141618] group-hover:text-focus dark:text-white transition-colors leading-snug">
                    {idea.title}
                  </h3>

                  <div className="mt-1 text-xs text-muted">
                    <span>{idea.creatorHandle}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{idea.brokerServer}</span>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                    {isTh ? idea.summaryTh : idea.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline space-y-3">
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    <div>
                      <div className="text-[11px] text-muted">Max DD</div>
                      <div className="font-bold tabular-nums text-[#141618] dark:text-white">
                        {idea.maxDrawdownPct.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted">Profit Factor</div>
                      <div className="font-bold tabular-nums text-ink">
                        {idea.profitFactor.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted">{isTh ? 'รูปแบบ' : 'Format'}</div>
                      <div className="font-bold text-[#141618] dark:text-white">
                        {isTh ? 'Blueprint' : 'JSON Spec'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-hairline text-xs font-semibold text-focus">
                    <span>
                      {isTh ? 'ดู Blueprint และกติกา MT5' : 'Inspect Blueprint & Rules'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="landing-closing-heading" className="perf-defer-section py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="desk-panel flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
            <div className="max-w-xl">
              <h2 id="landing-closing-heading" className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {t.ctaSection.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.ctaSection.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={deskLaunchUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cta-box-launch-desk"
                className="desk-primary min-h-10 px-4 text-xs"
              >
                {t.nav.openDesk}
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
              <a
                href="/sandbox"
                data-testid="cta-box-sandbox"
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onNavigate('/sandbox');
                }}
                className="tnx-hero-link"
              >
                {t.ctaSection.sandboxCta}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
});
