import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Pause, Play, RotateCcw, TrendingUp } from 'lucide-react';
import { Language } from '../utils/i18n';
import {
  DrawdownStreamPoint,
  SimulationScenarioId,
  appendNextDrawdownTick,
  generateInitialDrawdownStream,
  getAnalyticsCopy,
  summarizeDrawdownStream,
} from '../utils/analyticsLogic';

interface RealtimeDrawdownChartProps {
  lang: Language;
  isDark?: boolean;
  dailyCapPct: number;
}

const STREAM_INTERVAL_MS = 1200;
const STREAM_WINDOW_SIZE = 28;

interface CustomTooltipPayloadEntry {
  payload?: DrawdownStreamPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadEntry[];
  copy: ReturnType<typeof getAnalyticsCopy>['stream'];
}

const DrawdownStreamTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  copy,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-sm backdrop-blur-xs dark:border-neutral-700 dark:bg-[#11141a]/95">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-1.5 font-mono text-[11px] dark:border-neutral-800">
        <span className="font-semibold text-neutral-950 dark:text-white tabular-nums">
          Tick {point.tickLabel}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">
          {point.heartbeatMs} ms
        </span>
      </div>
      <div className="mt-2 space-y-1 font-mono text-[11px]">
        <div className="flex items-center justify-between gap-5">
          <span className="text-amber-700 dark:text-amber-400">
            {copy.ddSeriesLabel}
          </span>
          <span className="font-bold tabular-nums text-neutral-950 dark:text-white">
            {point.intradayDrawdownPct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="text-emerald-700 dark:text-emerald-400">
            {copy.headroomSeriesLabel}
          </span>
          <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {point.headroomPct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="text-neutral-500 dark:text-neutral-400">
            {copy.simulatedEquity}
          </span>
          <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            ${point.equityUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export const RealtimeDrawdownChart: React.FC<RealtimeDrawdownChartProps> = ({
  lang,
  isDark = false,
  dailyCapPct,
}) => {
  const copy = getAnalyticsCopy(lang);
  const [scenario, setScenario] = useState<SimulationScenarioId>('calm');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [series, setSeries] = useState<DrawdownStreamPoint[]>(() =>
    generateInitialDrawdownStream('calm', dailyCapPct, 24)
  );

  useEffect(() => {
    setSeries(generateInitialDrawdownStream(scenario, dailyCapPct, 24));
  }, [scenario, dailyCapPct]);

  useEffect(() => {
    if (!isStreaming) return;
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setSeries((prev) =>
        appendNextDrawdownTick(prev, scenario, dailyCapPct, STREAM_WINDOW_SIZE, 0)
      );
    }, STREAM_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isStreaming, scenario, dailyCapPct]);

  const summary = useMemo(
    () => summarizeDrawdownStream(series, dailyCapPct),
    [series, dailyCapPct]
  );

  const cautionThreshold = Number((dailyCapPct * 0.85).toFixed(2));
  const yDomainMax = Number((dailyCapPct * 1.15).toFixed(2));

  const handleInjectSpike = () => {
    const spikeDelta = Number((dailyCapPct * 0.38).toFixed(2));
    setSeries((prev) =>
      appendNextDrawdownTick(
        prev,
        scenario,
        dailyCapPct,
        STREAM_WINDOW_SIZE,
        spikeDelta
      )
    );
  };

  const handleReset = () => {
    setSeries(generateInitialDrawdownStream(scenario, dailyCapPct, 24));
  };

  const gateStatusStyle =
    summary.status === 'gated'
      ? 'text-rose-600 dark:text-rose-400'
      : summary.status === 'caution'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  const axisTickColor = isDark ? '#9ca3af' : '#525252';
  const gridStrokeColor = isDark ? '#1f2430' : '#e5e7eb';

  return (
    <div
      data-testid="realtime-drawdown-panel"
      className="desk-panel p-6"
    >
      {/* Header + Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold tracking-tight text-[#141618] dark:text-white">
            {copy.stream.title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
            {copy.stream.desc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Scenario Selector */}
          <div
            role="group"
            aria-label="Drawdown simulation scenario"
            className="inline-flex rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] p-1 dark:border-neutral-800 dark:bg-[#141618]"
          >
            {(['calm', 'volatile', 'breach_test'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                data-testid={`stream-scenario-${sc}`}
                onClick={() => setScenario(sc)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  scenario === sc
                    ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                    : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {copy.stream.scenarios[sc]}
              </button>
            ))}
          </div>

          {/* Stream Play/Pause */}
          <button
            type="button"
            data-testid="stream-toggle-btn"
            onClick={() => setIsStreaming((prev) => !prev)}
            className="inline-flex h-8 items-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-100 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isStreaming ? (
              <Pause className="h-3.5 w-3.5 text-focus" />
            ) : (
              <Play className="h-3.5 w-3.5 text-[#00c07a] dark:text-emerald-400" />
            )}
            <span>{isStreaming ? copy.stream.pause : copy.stream.resume}</span>
          </button>

          {/* Inject Simulated Drawdown Spike */}
          <button
            type="button"
            data-testid="stream-spike-btn"
            onClick={handleInjectSpike}
            className="inline-flex h-8 items-center space-x-1.5 rounded-lg border border-focus/40 bg-focus/10 px-3 text-xs font-semibold text-focus hover:bg-focus/15 dark:hover:bg-focus/25 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{copy.stream.injectSpike}</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            data-testid="stream-reset-btn"
            onClick={handleReset}
            aria-label={copy.stream.reset}
            className="inline-flex h-8 items-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-white px-3 text-xs font-semibold text-[#2B2D2F] hover:border-focus hover:text-[#141618] dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-300 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{copy.stream.reset}</span>
          </button>
        </div>
      </div>

      {/* Hairline-Separated Live Readout Strip */}
      <div className="mt-5 grid grid-cols-2 gap-y-4 border-y border-[#D6D1C7] py-4 dark:border-neutral-800 sm:grid-cols-3 lg:grid-cols-5">
        <div className="pr-4">
          <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
            {copy.stream.currentDd}
          </div>
          <div
            data-testid="stream-current-dd"
            className="mt-1 font-mono text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400"
          >
            {summary.currentDdPct.toFixed(2)}%
          </div>
        </div>

        <div className="pr-4">
          <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
            {copy.stream.peakDd}
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#141618] dark:text-white">
            {summary.peakDdPct.toFixed(2)}%
          </div>
        </div>

        <div className="pr-4">
          <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
            {copy.stream.remainingHeadroom}
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {summary.headroomPct.toFixed(2)}%
          </div>
        </div>

        <div className="pr-4">
          <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
            {copy.stream.simulatedEquity}
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#141618] dark:text-white">
            ${summary.equityUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        <div>
          <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
            Gate · {copy.stream.heartbeat}
          </div>
          <div
            data-testid="stream-gate-status"
            className={`mt-1 font-mono text-sm font-bold tabular-nums ${gateStatusStyle}`}
          >
            {copy.stream.gateLabels[summary.status]} · {summary.latestHeartbeatMs} ms
          </div>
        </div>
      </div>

      {/* Recharts Interactive Time-Series Chart */}
      <div
        data-testid="realtime-drawdown-chart"
        className="mt-5 h-72 w-full rounded-xl bg-[#F8F6F0]/80 p-3 sm:p-4 dark:bg-[#141618]/80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 18, right: 26, left: -4, bottom: 4 }}
          >
            <defs>
              <linearGradient id="tredynDrawdownArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStrokeColor}
              vertical={false}
            />
            <XAxis
              dataKey="tickLabel"
              padding={{ left: 6, right: 12 }}
              tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: gridStrokeColor }}
              tickLine={false}
              minTickGap={26}
            />
            <YAxis
              domain={[0, yDomainMax]}
              tickFormatter={(value: number) => `${value.toFixed(1)}%`}
              tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<DrawdownStreamTooltip copy={copy.stream} />}
              cursor={{ stroke: isDark ? '#3f3f46' : '#d4d4d8', strokeDasharray: '3 3' }}
            />
            <ReferenceLine
              y={dailyCapPct}
              stroke="#e11d48"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `${copy.stream.capReferenceLabel} (${dailyCapPct.toFixed(1)}%)`,
                position: 'insideTopRight',
                dy: -14,
                fill: isDark ? '#fb7185' : '#be123c',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <ReferenceLine
              y={cautionThreshold}
              stroke="#d97706"
              strokeDasharray="3 3"
              strokeWidth={1.25}
              label={{
                value: `${copy.stream.cautionReferenceLabel} (${cautionThreshold.toFixed(2)}%)`,
                position: 'insideTopLeft',
                dy: 4,
                fill: isDark ? '#fbbf24' : '#b45309',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <Area
              type="monotone"
              dataKey="intradayDrawdownPct"
              name={copy.stream.ddSeriesLabel}
              stroke={isDark ? '#f59e0b' : '#d97706'}
              strokeWidth={2.25}
              fill="url(#tredynDrawdownArea)"
              isAnimationActive={false}
              dot={false}
              activeDot={{
                r: 4.5,
                strokeWidth: 2,
                stroke: isDark ? '#0d0f13' : '#ffffff',
                fill: '#f59e0b',
              }}
            />
            <Line
              type="monotone"
              dataKey="headroomPct"
              name={copy.stream.headroomSeriesLabel}
              stroke={isDark ? '#34d399' : '#059669'}
              strokeWidth={1.75}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quiet Legend & Tick Telemetry Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center space-x-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-3.5 bg-amber-500" />
            <span>{copy.stream.ddSeriesLabel}</span>
          </span>
          <span className="inline-flex items-center space-x-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-3.5 border-t-2 border-dashed border-emerald-500" />
            <span>{copy.stream.headroomSeriesLabel}</span>
          </span>
          <span className="inline-flex items-center space-x-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-3.5 border-t-2 border-dotted border-amber-600" />
            <span>{copy.stream.cautionReferenceLabel}</span>
          </span>
          <span className="inline-flex items-center space-x-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-3.5 border-t-2 border-dashed border-rose-500" />
            <span>{copy.stream.capReferenceLabel}</span>
          </span>
        </div>
        <span data-testid="stream-step-counter" className="tabular-nums whitespace-nowrap shrink-0">
          TICK #{summary.latestStep} · {isStreaming ? 'STREAMING 1.2s' : 'PAUSED'}
        </span>
      </div>
    </div>
  );
};
