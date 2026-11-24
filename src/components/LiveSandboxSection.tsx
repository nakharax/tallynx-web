import React, { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Timer,
} from 'lucide-react';
import { getDictionary, type Language } from '../utils/i18n';
import { TALLYNX_DESK_APP_URL } from '../utils/navLogic';
import {
  type SandboxState,
  SANDBOX_COOLDOWN_MINUTES,
  completeSandboxCooldown,
  createInitialSandboxState,
  simulateCappedLoss,
  simulateDisciplinedWin,
  triggerRevengeOverLot,
} from '../utils/ecosystemLogic';
import {
  OnboardingTransferState,
  buildDeskHandoffUrl,
  createDefaultTransferState,
} from '../utils/onboardingLogic';
import { InstantRiskCalculator } from './InstantRiskCalculator';

interface LiveSandboxSectionProps {
  lang: Language;
  isDark: boolean;
  onNavigate: (path: string) => void;
  transferState?: OnboardingTransferState;
  onChangeTransferState?: (next: OnboardingTransferState) => void;
  onActivateDeskFlow?: (state: OnboardingTransferState) => void;
}

export const LiveSandboxSection: React.FC<LiveSandboxSectionProps> = React.memo(({
  lang,
  isDark,
  onNavigate,
  transferState,
  onChangeTransferState,
  onActivateDeskFlow,
}) => {
  const isTh = lang === 'th';
  const [localTransferState, setLocalTransferState] = useState<OnboardingTransferState>(() =>
    createDefaultTransferState()
  );
  const activeTransferState = transferState || localTransferState;
  const handleTransferChange = onChangeTransferState || setLocalTransferState;
  const openDeskLabel = useMemo(() => getDictionary(lang).nav.openDesk, [lang]);
  const handoffUrl = useMemo(
    () => buildDeskHandoffUrl(TALLYNX_DESK_APP_URL, activeTransferState, {
      lang,
      theme: isDark ? 'dark' : 'light',
      page: 'calc',
      source: 'sandbox_page',
    }),
    [activeTransferState, lang, isDark]
  );
  const fallbackActivateFlow = useCallback(() => onNavigate('/onboarding'), [onNavigate]);
  const handleActivateFlow = onActivateDeskFlow || fallbackActivateFlow;
  const [sandbox, setSandbox] = useState<SandboxState>(() =>
    createInitialSandboxState()
  );

  const handleSimulateWin = useCallback(() => setSandbox((prev) => simulateDisciplinedWin(prev)), []);
  const handleSimulateLoss = useCallback(() => setSandbox((prev) => simulateCappedLoss(prev)), []);
  const handleTriggerRevenge = useCallback(() => setSandbox((prev) => triggerRevengeOverLot(prev)), []);
  const handleAdvanceCooldown = useCallback(() => setSandbox(completeSandboxCooldown), []);
  const handleResetSandbox = useCallback(() => setSandbox(createInitialSandboxState()), []);

  const chartGeometry = useMemo(() => {
    const pts = sandbox.equityCurve;
    const width = 760;
    const height = 220;
    const padX = 28;
    const padY = 24;
    const min = Math.min(...pts) - 300;
    const max = Math.max(...pts) + 300;
    const span = Math.max(1, max - min);

    const coords = pts.map((val, idx) => {
      const x =
        pts.length === 1
          ? width / 2
          : padX + (idx / (pts.length - 1)) * (width - padX * 2);
      const y =
        height - padY - ((val - min) / span) * (height - padY * 2);
      return { x, y, val };
    });

    const linePath = coords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`
        : '';

    return { width, height, padX, padY, coords, linePath, areaPath, min, max };
  }, [sandbox.equityCurve]);

  const guardrailColor =
    sandbox.guardrailState === 'ALERT'
      ? 'text-rose-600 dark:text-rose-400'
      : sandbox.guardrailState === 'WATCH'
        ? 'text-caution'
        : 'text-emerald-600 dark:text-emerald-400';

  const guardrailStroke =
    sandbox.guardrailState === 'ALERT'
      ? '#e11d48'
      : sandbox.guardrailState === 'WATCH'
        ? 'var(--desk-caution)'
        : '#10b981';

  return (
    <section
      id="sandbox"
      data-testid="live-sandbox-page"
      className="py-12 lg:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header & Primary Links */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-hairline pb-8 dark:border-neutral-800">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-focus">
              {isTh
                ? 'จำลองความเสี่ยงโดยไม่ต้องล็อกอิน'
                : 'Read-Only Interactive Sandbox · Zero Login Required'}
            </div>
            <h1 className="mt-2.5 text-3xl font-semibold tracking-[-0.03em] text-[#141618] sm:text-4xl dark:text-white">
              {isTh
                ? 'ทดลอง Drawdown และช่วงพักเทรด 15 นาที'
                : 'Test drawdown and a 15-minute cooldown'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400 max-w-2xl">
              {isTh
                ? 'เปรียบเทียบออเดอร์ตามแผนกับการใช้ Lot เกินขนาด ดูผลต่อเพดานขาดทุนรายวัน แล้วทดลองช่วงพักหลังชน SL'
                : 'Compare a planned trade with an oversized trade. See what they do to your daily loss budget, then try the cooldown after a stop-loss.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={handoffUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#141618] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#141618] dark:bg-white dark:text-[#141618] dark:hover:bg-neutral-100 transition whitespace-nowrap"
            >
              <span>{openDeskLabel}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="/analytics"
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onNavigate('/analytics');
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-5 py-2.5 text-xs font-semibold text-[#141618] hover:border-focus hover:text-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition whitespace-nowrap"
            >
              <span>
                {isTh ? 'ตรวจสอบ Drawdown' : 'Drawdown Audit'}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* 4-Column Live KPI Hairline Strip */}
        <div className="grid grid-cols-2 border-y border-hairline dark:border-neutral-800 lg:grid-cols-4">
          <div className="py-5 pr-4 border-r border-b lg:border-b-0 border-hairline dark:border-neutral-800">
            <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
              {isTh ? 'เงินทุนจำลอง' : 'Simulated equity'}
            </div>
            <div
              data-testid="sandbox-equity"
              className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141618] dark:text-white"
            >
              ${sandbox.equity.toLocaleString('en-US')}
            </div>
          </div>

          <div className="py-5 pl-4 lg:px-6 border-b lg:border-b-0 lg:border-r border-hairline dark:border-neutral-800">
            <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
              {isTh ? 'เพดานขาดทุนรายวัน (Daily DD)' : 'Daily DD Used'}
            </div>
            <div
              data-testid="sandbox-dd"
              className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141618] dark:text-white"
            >
              {sandbox.dailyDdUsedPct.toFixed(2)}% / {sandbox.dailyDdLimitPct.toFixed(1)}%
            </div>
          </div>

          <div className="py-5 pr-4 lg:px-6 border-r border-hairline dark:border-neutral-800">
            <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
              {isTh ? 'อัตราชนะ (Sim Winrate)' : 'Sim Winrate'}
            </div>
            <div
              data-testid="sandbox-winrate"
              className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141618] dark:text-white"
            >
              {sandbox.winRatePct.toFixed(1)}%
              <span className="ml-2 text-xs font-normal text-[#2B2D2F] dark:text-neutral-400">
                ({sandbox.wins}/{sandbox.totalTrades})
              </span>
            </div>
          </div>

          <div className="py-5 pl-4 lg:pl-6">
            <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
              {isTh ? 'สถานะ Guardrail' : 'Guardrail State'}
            </div>
            <div
              data-testid="sandbox-guardrail-state"
              className={`mt-1 flex items-center gap-1.5 font-mono text-2xl font-semibold ${guardrailColor}`}
            >
              {sandbox.guardrailState === 'ALERT' ? (
                <ShieldAlert className="h-5 w-5 shrink-0" />
              ) : (
                <ShieldCheck className="h-5 w-5 shrink-0" />
              )}
              <span>{sandbox.guardrailState}</span>
            </div>
          </div>
        </div>

        {/* Chart + AI Coach Guardrail & Interactive Scenario Controls */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Equity Curve Chart */}
          <div className="lg:col-span-7 desk-panel p-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-focus" />
                <h2 className="text-sm font-bold text-[#141618] dark:text-white">
                  {isTh
                    ? 'กราฟเส้น Balance / Equity แบบเรียลไทม์'
                    : 'Real-Time Sandbox Equity Curve'}
                </h2>
              </div>
              <span className="font-mono text-xs tabular-nums text-[#2B2D2F] dark:text-neutral-400">
                {sandbox.equityCurve.length}{' '}
                {isTh ? 'จุดข้อมูล' : 'telemetry ticks'}
              </span>
            </div>

            <div className="mt-4">
              <svg
                viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                className="w-full h-56 overflow-visible"
                role="img"
                aria-label="Sandbox Equity Curve"
              >
                <defs>
                  <linearGradient id="sandboxAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={guardrailStroke} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={guardrailStroke} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75].map((ratio) => {
                  const y =
                    chartGeometry.padY +
                    ratio * (chartGeometry.height - chartGeometry.padY * 2);
                  return (
                    <line
                      key={ratio}
                      x1={chartGeometry.padX}
                      y1={y}
                      x2={chartGeometry.width - chartGeometry.padX}
                      y2={y}
                      stroke="currentColor"
                      className="text-neutral-200 dark:text-neutral-800"
                      strokeDasharray="3 3"
                    />
                  );
                })}

                {chartGeometry.areaPath && (
                  <path d={chartGeometry.areaPath} fill="url(#sandboxAreaGrad)" />
                )}

                {chartGeometry.linePath && (
                  <path
                    d={chartGeometry.linePath}
                    fill="none"
                    stroke={guardrailStroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {chartGeometry.coords.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={idx === chartGeometry.coords.length - 1 ? 5 : 3.5}
                    fill={guardrailStroke}
                    stroke={isDark ? '#1B1E21' : '#ffffff'}
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>

            {/* Event Ledger */}
            <div className="mt-4 border-t border-hairline pt-4 dark:border-neutral-800">
              <div className="font-mono text-[11px] font-semibold text-[#2B2D2F] dark:text-neutral-400">
                {isTh ? 'บันทึกรายการจำลองล่าสุด' : 'Recent Simulated Ledger Events'}
              </div>
              <div className="mt-2 divide-y divide-[#D6D1C7] dark:divide-neutral-800/80">
                {sandbox.events.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <span className="font-medium text-[#141618] dark:text-neutral-200 truncate pr-3">
                      {isTh ? ev.labelTh : ev.label}
                    </span>
                    <span
                      className={`font-mono font-semibold tabular-nums shrink-0 ${
                        ev.pnlUsd > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ev.pnlUsd < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[#2B2D2F] dark:text-neutral-400'
                      }`}
                    >
                      {ev.pnlUsd >= 0 ? '+' : ''}
                      ${ev.pnlUsd.toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: AI Coach Guardrail + Scenario Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 desk-panel p-6">
            <div className="space-y-5">
              <div>
                <div className="font-mono text-xs font-semibold text-focus">
                  {isTh ? 'สถานะกฎคุมความเสี่ยง' : 'Guardrail status'}
                </div>
                <p
                  data-testid="sandbox-guardrail-msg"
                  role="status"
                  className="mt-2 text-sm leading-relaxed text-[#141618] dark:text-neutral-200"
                >
                  {isTh ? sandbox.guardrailMessageTh : sandbox.guardrailMessage}
                </p>
              </div>

              <div className="space-y-2.5 border-t border-hairline pt-5">
                <fieldset disabled={sandbox.cooldownActive} className="min-w-0 space-y-2.5 disabled:opacity-50">
                  <legend className="pb-2.5 font-mono text-[11px] font-semibold text-muted">
                    {isTh ? 'จำลองสถานการณ์เทรด' : 'Trade scenarios'}
                  </legend>

                  <button
                    type="button"
                    data-testid="sandbox-btn-win"
                    onClick={handleSimulateWin}
                    className="flex w-full items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <span>
                        {isTh
                          ? '+ จำลองชนะตามแผน (+1.7R / +0.85%)'
                          : '+ Simulate Disciplined Win (+1.7R / +0.85%)'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="sandbox-btn-loss"
                    onClick={handleSimulateLoss}
                    className="flex w-full items-center justify-between rounded-xl border border-hairline bg-canvas px-4 py-3 text-xs font-semibold text-[#141618] hover:border-focus hover:bg-white dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 shrink-0 text-focus" />
                      <span>
                        {isTh
                          ? '− จำลองตัดขาดทุนตามเป้า (-1.0R / -0.50%)'
                          : '− Simulate Capped Loss (-1.0R / -0.50%)'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="sandbox-btn-revenge"
                    onClick={handleTriggerRevenge}
                    className="flex w-full items-center justify-between rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-700 hover:bg-rose-500/15 dark:text-rose-300 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>
                        {isTh
                          ? 'จำลองออก Lot เกินขนาดแก้แค้น (4x Over-Lot)'
                          : 'Trigger Revenge Over-Lot (4x Violation)'}
                      </span>
                    </span>
                  </button>
                </fieldset>

                {sandbox.cooldownActive && (
                  <div data-testid="sandbox-cooldown" className="space-y-2 rounded-lg border border-hairline bg-focus/5 p-3">
                    <p className="text-xs leading-relaxed text-ink">
                      {isTh
                        ? `พักเทรด ${SANDBOX_COOLDOWN_MINUTES} นาที ระหว่างนี้ระบบพักการจำลองออเดอร์ใหม่`
                        : `The ${SANDBOX_COOLDOWN_MINUTES}-minute cooldown pauses new simulated trades.`}
                    </p>
                    <button
                      type="button"
                      data-testid="sandbox-advance-cooldown"
                      onClick={handleAdvanceCooldown}
                      className="desk-primary min-h-9 px-3 text-xs"
                    >
                      <Timer aria-hidden="true" className="h-3.5 w-3.5" />
                      {isTh ? `เดินเวลาจำลองไป ${SANDBOX_COOLDOWN_MINUTES} นาที` : `Advance ${SANDBOX_COOLDOWN_MINUTES} simulated minutes`}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  data-testid="sandbox-btn-reset"
                  onClick={handleResetSandbox}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{isTh ? 'รีเซ็ต Sandbox' : 'Reset Sandbox'}</span>
                </button>
              </div>
            </div>

            {/* Non-Custodial Footer Note */}
            <div className="border-t border-hairline pt-4 text-[11px] leading-relaxed text-[#2B2D2F] dark:border-neutral-800 dark:text-neutral-400">
              {isTh
                ? 'หมายเหตุขอบเขตระบบ: Sandbox ทำงานแบบอ่านอย่างเดียวในเบราว์เซอร์ เพื่อสาธิตสมการคุมความเสี่ยงของ TallyNX OS v4.0 โดยไม่ส่งคำสั่งจริง'
                : 'Non-Custodial Boundary: This simulation models TallyNX OS v4.0 guardrails deterministically without executing or mirroring broker orders.'}
            </div>
          </div>
        </div>

        {/* Instant 15-Second 3-TP & Consistency 40% Calculator (Value First) */}
        <div className="pt-2 border-t border-hairline dark:border-neutral-800">
          <InstantRiskCalculator
            lang={lang}
            isDark={isDark}
            transferState={activeTransferState}
            onChangeState={handleTransferChange}
            onActivateDeskFlow={handleActivateFlow}
          />
        </div>
      </div>
    </section>
  );
});
