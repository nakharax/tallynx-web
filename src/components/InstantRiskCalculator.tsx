import React, { useCallback, useMemo } from 'react';
import {
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Language } from '../utils/i18n';
import { TALLYNX_DESK_APP_URL } from '../utils/navLogic';
import {
  OnboardingTransferState,
  PROP_FIRM_PRESETS,
  PropFirmPresetId,
  TradingSymbol,
  applyPropFirmPreset,
  buildDeskHandoffUrl,
  calculateThreeTpLadderPlan,
  clampTransferState,
  detectActivePropFirmPreset,
  persistOnboardingTransferState,
} from '../utils/onboardingLogic';

interface InstantRiskCalculatorProps {
  lang: Language;
  isDark: boolean;
  transferState: OnboardingTransferState;
  onChangeState: (next: OnboardingTransferState) => void;
  onActivateDeskFlow: (state: OnboardingTransferState) => void;
  compact?: boolean;
}

const ACCOUNT_PRESETS = [10000, 25000, 50000, 100000];
const RISK_PRESETS = [0.5, 1.0, 1.5, 2.0];
const SYMBOLS: TradingSymbol[] = ['XAUUSD', 'EURUSD', 'NAS100'];

export const InstantRiskCalculator: React.FC<InstantRiskCalculatorProps> = React.memo(({
  lang,
  isDark,
  transferState,
  onChangeState,
  onActivateDeskFlow,
  compact = false,
}) => {
  const isTh = lang === 'th';

  const plan = useMemo(
    () => calculateThreeTpLadderPlan(transferState),
    [transferState]
  );
  const activePresetId = useMemo(
    () => detectActivePropFirmPreset(transferState),
    [transferState]
  );
  const activePreset = useMemo(
    () => PROP_FIRM_PRESETS.find((p) => p.id === activePresetId),
    [activePresetId]
  );
  const externalHandoffUrl = useMemo(
    () => buildDeskHandoffUrl(TALLYNX_DESK_APP_URL, transferState, {
      lang,
      theme: isDark ? 'dark' : 'light',
      page: 'calc',
      source: 'landing_15s_sandbox',
    }),
    [transferState, lang, isDark]
  );

  const updateField = useCallback((patch: Partial<OnboardingTransferState>) => {
    const next = clampTransferState({
      ...transferState,
      ...patch,
      updatedAt: Date.now(),
    });
    onChangeState(next);
  }, [transferState, onChangeState]);

  const handleSelectPropPreset = useCallback((presetId: PropFirmPresetId) => {
    const next = clampTransferState({
      ...applyPropFirmPreset(transferState, presetId),
      updatedAt: Date.now(),
    });
    onChangeState(next);
  }, [transferState, onChangeState]);

  const handleActivate = useCallback(() => {
    const saved = persistOnboardingTransferState(transferState);
    onChangeState(saved);
    onActivateDeskFlow(saved);
  }, [transferState, onChangeState, onActivateDeskFlow]);

  const consistencyColorClass =
    plan.consistencyStatus === 'BREACH'
      ? 'text-negative'
      : plan.consistencyStatus === 'NEAR_CAP'
        ? 'text-caution'
        : 'text-positive';

  const consistencyBarColor =
    plan.consistencyStatus === 'BREACH'
      ? 'bg-negative'
      : plan.consistencyStatus === 'NEAR_CAP'
        ? 'bg-caution'
        : 'bg-positive';

  return (
    <div
      data-testid="instant-risk-calculator"
      className={`desk-panel p-4 ${compact ? '' : 'sm:p-6'}`}
    >
      {/* Top Rulebook Preset Strip (Concise single-level selector) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <div
          role="group"
          aria-label={isTh ? 'เทมเพลตกฎพอร์ตสำเร็จรูป' : 'Rulebook Presets'}
          className="flex flex-wrap items-center gap-1.5"
        >
          {PROP_FIRM_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`calc-prop-preset-${preset.id}`}
                onClick={() => handleSelectPropPreset(preset.id)}
                aria-pressed={isSelected}
                className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'border-focus bg-focus/10 text-focus dark:bg-focus/15'
                    : 'border-hairline bg-canvas text-muted hover:text-ink'
                }`}
              >
                {isTh ? preset.labelTh : preset.labelEn}
              </button>
            );
          })}
        </div>

        <span className="font-mono text-[11px] text-muted">
          {activePreset
            ? isTh
              ? activePreset.badgeTh
              : activePreset.badgeEn
            : isTh
              ? `Daily DD ${transferState.dailyDdLimitPct}%`
              : `${transferState.dailyDdLimitPct}% Daily DD`}
        </span>
      </div>

      {/* Main 12-Col Body */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 5 Cols: Clean Uniform Inputs */}
        <div className="min-w-0 lg:col-span-5 space-y-4">
          {/* Account Size */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label
                htmlFor="calc-account-size"
                className="font-semibold text-[#141618] dark:text-neutral-200"
              >
                {isTh ? 'ขนาดพอร์ต ($ USD)' : 'Account Size ($ USD)'}
              </label>
              <span className="font-mono tabular-nums font-bold text-focus">
                ${transferState.accountSize.toLocaleString('en-US')}
              </span>
            </div>
            <input
              id="calc-account-size"
              data-testid="calc-account-size-input"
              type="number"
              min={500}
              max={2000000}
              step={500}
              value={transferState.accountSize}
              onChange={(e) =>
                updateField({
                  accountSize: Math.max(500, Number(e.target.value) || 10000),
                })
              }
              className="min-h-10 w-full min-w-0 rounded border border-hairline bg-canvas px-3 py-2 font-mono text-base font-semibold text-ink focus:border-focus"
            />
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {ACCOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateField({ accountSize: preset })}
                  className={`rounded py-1 font-mono text-[11px] font-semibold transition cursor-pointer ${
                    transferState.accountSize === preset
                      ? 'bg-accent-solid text-white'
                      : 'border border-hairline bg-canvas text-muted hover:text-ink'
                  }`}
                >
                  ${(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Risk % & SL Pips */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="calc-risk-pct"
                className="block text-xs font-semibold text-[#141618] dark:text-neutral-200 mb-1.5"
              >
                {isTh ? 'ความเสี่ยง / ไม้ (%)' : 'Risk / Trade (%)'}
              </label>
              <input
                id="calc-risk-pct"
                data-testid="calc-risk-pct-input"
                type="number"
                min={0.25}
                max={5}
                step={0.25}
                value={transferState.riskPct}
                onChange={(e) =>
                  updateField({
                    riskPct: Math.min(5, Math.max(0.25, Number(e.target.value) || 1)),
                  })
                }
                className="min-h-10 w-full min-w-0 rounded border border-hairline bg-canvas px-3 py-2 font-mono text-base font-semibold text-ink focus:border-focus"
              />
              <div className="mt-2 grid grid-cols-4 gap-1">
                {RISK_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateField({ riskPct: r })}
                    className={`rounded py-1 font-mono text-[10.5px] font-semibold transition cursor-pointer ${
                      transferState.riskPct === r
                        ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                        : 'border border-hairline bg-canvas text-muted hover:text-ink'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="calc-sl-pips"
                className="block text-xs font-semibold text-[#141618] dark:text-neutral-200 mb-1.5"
              >
                {isTh ? 'ระยะ SL (Pips)' : 'Stop Loss (Pips)'}
              </label>
              <input
                id="calc-sl-pips"
                type="number"
                min={5}
                max={500}
                step={5}
                value={transferState.slPips}
                onChange={(e) =>
                  updateField({
                    slPips: Math.max(5, Number(e.target.value) || 25),
                  })
                }
                className="min-h-10 w-full min-w-0 rounded border border-hairline bg-canvas px-3 py-2 font-mono text-base font-semibold text-ink focus:border-focus"
              />
              <div className="mt-2 grid grid-cols-3 gap-1">
                {SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => updateField({ symbol: sym })}
                    className={`rounded py-1 font-mono text-[10.5px] font-semibold transition cursor-pointer ${
                      transferState.symbol === sym
                        ? 'bg-accent-solid text-white'
                        : 'border border-hairline bg-canvas text-muted hover:text-ink'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <a
            href={externalHandoffUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="direct-desk-handoff-link"
            className="desk-primary min-h-10 w-full px-3 py-2 text-xs"
          >
            <span>{isTh ? 'เปิดค่านี้ใน TallyNX Desk' : 'Open Plan in TallyNX Desk'}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Right 7 Cols: Clean Hairline-Divided Results (Zero Nested Box Clutter) */}
        <div className="min-w-0 space-y-4 border-t border-hairline pt-4 lg:col-span-7 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          {/* Top 4 Output Metrics */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] [overflow-wrap:anywhere] gap-x-3 gap-y-4 border-b border-hairline pb-4">
            <div>
              <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                {isTh ? 'ความเสี่ยงต่อไม้' : 'Dollar Risk'}
              </div>
              <div
                data-testid="calc-risk-usd"
                className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#141618] dark:text-white"
              >
                ${plan.riskUsd.toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                {isTh ? `Lot รวม (${transferState.symbol})` : `Total Lot (${transferState.symbol})`}
              </div>
              <div
                data-testid="calc-total-lots"
                className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink"
              >
                {plan.totalLots.toFixed(2)} lot
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                {isTh ? 'กำไรแผน 3-TP รวม' : '3-TP Full Win'}
              </div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-positive">
                +${plan.fullWinUsd.toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                {isTh ? 'เกราะกัน Daily DD' : 'SLs Before DD Cap'}
              </div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#141618] dark:text-white">
                {plan.tradesBeforeDailyFloor} {isTh ? 'ไม้' : 'losses'}
              </div>
            </div>
          </div>

          {/* 3-TP Split Ladder (Clean Hairline Columns) */}
          <div className="border-b border-[#D6D1C7] pb-5 dark:border-[#2B2D2F]">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-[#141618] dark:text-neutral-200">
                {isTh
                  ? 'แผนแบ่งปิดกำไรอัตโนมัติ 3 ระยะ (3-TP Ladder)'
                  : 'Deterministic 3-TP Profit Split'}
              </span>
              <span className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400 tabular-nums">
                {isTh ? 'เฉลี่ยรวม' : 'Blended'} +{plan.blendedR.toFixed(2)}R
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-[#D6D1C7] dark:divide-[#2B2D2F]">
              {plan.targets.map((tp, idx) => (
                <div
                  key={tp.id}
                  data-testid={`calc-tp-card-${tp.id}`}
                  className={`${idx > 0 ? 'sm:pl-4' : ''} ${idx < 2 ? 'sm:pr-4' : ''}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 font-mono text-xs">
                    <span className="font-bold text-focus">
                      {tp.id} ({tp.rMultiple.toFixed(1)}R)
                    </span>
                    <span className="text-[#2B2D2F] dark:text-neutral-400">
                      {tp.closePct}% · {tp.lots.toFixed(2)} lot
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-base font-semibold tabular-nums text-positive">
                    +${tp.profitUsd.toLocaleString('en-US')}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#2B2D2F] dark:text-neutral-400 leading-snug">
                    {isTh ? tp.ruleNoteTh : tp.ruleNoteEn}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consistency Rule 40% Brake Bar Simulator */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#141618] dark:text-white">
                {plan.consistencyStatus === 'BREACH' ? (
                  <ShieldAlert className="h-4 w-4 text-negative" />
                ) : plan.consistencyStatus === 'NEAR_CAP' ? (
                  <AlertTriangle className="h-4 w-4 text-caution" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-positive" />
                )}
                <span>
                  {isTh
                    ? 'จำลองแถบเตือน Consistency Rule 40%'
                    : 'Simulated 40% Consistency Rule Brake'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {[
                  { pct: 24, labelEn: 'Normal Day', labelTh: 'วันปกติ' },
                  { pct: 37, labelEn: 'Near Cap', labelTh: 'ใกล้เพดาน' },
                  { pct: 46, labelEn: 'Spike >40%', labelTh: 'กำไรพุ่งเกิน 40%' },
                ].map((scenario) => (
                  <button
                    key={scenario.pct}
                    type="button"
                    data-testid={`consistency-preset-${scenario.pct}`}
                    onClick={() => updateField({ simulatedDaySharePct: scenario.pct })}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      transferState.simulatedDaySharePct === scenario.pct
                        ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                        : 'bg-canvas text-[#2B2D2F] hover:text-[#141618] dark:bg-[#1B1E21] dark:text-neutral-300 dark:hover:text-white'
                    }`}
                  >
                    {isTh ? scenario.labelTh : scenario.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 relative">
              <div className="h-2.5 w-full rounded-full bg-[#F8F6F0] dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${consistencyBarColor}`}
                  style={{ width: `${Math.min(100, (plan.consistencySharePct / 60) * 100)}%` }}
                />
              </div>
              {/* 40% Threshold Marker (40/60 = 66.7%) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#141618] dark:bg-white"
                style={{ left: '66.67%' }}
                title="40% Prop Consistency Cap"
              />
            </div>

            <div className="mt-2 text-[11px]">
              <span className={`font-mono font-bold tabular-nums ${consistencyColorClass}`}>
                {isTh ? 'สัดส่วนกำไรวันนี้:' : "Today's Cycle Share:"}{' '}
                {plan.consistencySharePct}% / 40% Cap ·{' '}
                {plan.consistencyStatus === 'BREACH'
                  ? isTh
                    ? 'สัดส่วนกำไรจำลองเกินเพดาน 40%'
                    : 'Simulated share exceeds the 40% ceiling'
                  : plan.consistencyStatus === 'NEAR_CAP'
                    ? isTh
                      ? 'สัดส่วนกำไรจำลองใกล้เพดาน 40%'
                      : 'Simulated share is near the 40% ceiling'
                    : isTh
                      ? 'ปลอดภัย: อยู่ในเกณฑ์ผ่าน Consistency Rule'
                      : 'Safe Zone: Within Prop Consistency tolerance'}
              </span>
            </div>
          </div>

          {/* Step 2: Cross-Subdomain State Transfer CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <div className="text-[11px] text-muted font-mono">
              ${transferState.accountSize.toLocaleString()} · {transferState.riskPct}% Risk · {transferState.mode.toUpperCase()}
            </div>

            <button
              type="button"
              data-testid="activate-on-desk-btn"
              onClick={handleActivate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-focus hover:underline cursor-pointer whitespace-nowrap"
            >
              <span>{isTh ? 'ดูขั้นตอนตั้งค่า 5 ขั้นตอน' : 'Full 5-Step Setup Ladder'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
