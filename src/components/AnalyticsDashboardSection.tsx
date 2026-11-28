import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Language } from '../utils/i18n';
import {
  AuditedDealRecord,
  LedgerSortKey,
  LedgerStatus,
  MT5_DEAL_AUDIT_SAMPLES,
  MT5_SESSION_LEDGER,
  RISK_BUDGET_PRESETS,
  RiskBudgetPreset,
  buildAnalyticsCsv,
  computeOlsRegression,
  computeWaffleAllocation,
  filterAndSortSessions,
  getAnalyticsCopy,
  summarizeDealMatrix,
} from '../utils/analyticsLogic';

const RealtimeDrawdownChart = lazy(() =>
  import('./RealtimeDrawdownChart').then((m) => ({
    default: m.RealtimeDrawdownChart,
  }))
);

interface AnalyticsDashboardSectionProps {
  lang: Language;
  isDark?: boolean;
}

const MATRIX_COLS = 15;

const OUTCOME_COLORS: Record<string, string> = {
  disciplined: 'var(--desk-positive)',
  near_limit: 'var(--desk-caution)',
  breached: 'var(--desk-negative)',
  untracked: '#737373',
};

const SESSION_COLORS: Record<string, string> = {
  London: '#657882',
  Overlap: '#A39985',
  'New York': '#536070',
  Asian: '#8A8581',
};

export const AnalyticsDashboardSection: React.FC<
  AnalyticsDashboardSectionProps
> = React.memo(({ lang, isDark = false }) => {
  const copy = useMemo(() => getAnalyticsCopy(lang), [lang]);

  // Instrument 1: 120-deal Unit Matrix state
  const [matrixGroupBy, setMatrixGroupBy] = useState<'outcome' | 'session'>(
    'outcome'
  );
  const [matrixFilter, setMatrixFilter] = useState<string>('all');
  const [hoveredDeal, setHoveredDeal] = useState<AuditedDealRecord | null>(
    null
  );
  const [showMatrixTable, setShowMatrixTable] = useState(false);

  // Instrument 2: 10x10 Waffle Budget state
  const [presetId, setPresetId] = useState<RiskBudgetPreset['id']>('standard');

  // Instrument 3: OLS Regression Scatter state
  const [scatterScope, setScatterScope] = useState<'all' | 'active'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<AuditedDealRecord | null>(
    null
  );
  const [showScatterTable, setShowScatterTable] = useState(false);

  // Instrument 4: Searchable Ledger + CSV state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LedgerStatus>('all');
  const [sortState, setSortState] = useState<{
    key: LedgerSortKey;
    dir: 'asc' | 'desc';
  }>({ key: 'dealsCount', dir: 'desc' });

  const matrixSummary = useMemo(
    () => summarizeDealMatrix(MT5_DEAL_AUDIT_SAMPLES, matrixGroupBy),
    [matrixGroupBy]
  );

  const orderedDeals = useMemo(() => {
    const orderMap = new Map<string, number>();
    matrixSummary.forEach((g, idx) => orderMap.set(g.key, idx));
    return [...MT5_DEAL_AUDIT_SAMPLES].sort((a, b) => {
      const ka = matrixGroupBy === 'outcome' ? a.outcome : a.session;
      const kb = matrixGroupBy === 'outcome' ? b.outcome : b.session;
      return (orderMap.get(ka) ?? 0) - (orderMap.get(kb) ?? 0) || a.id - b.id;
    });
  }, [matrixGroupBy, matrixSummary]);

  const activePreset = useMemo(
    () =>
      RISK_BUDGET_PRESETS.find((p) => p.id === presetId) ??
      RISK_BUDGET_PRESETS[1],
    [presetId]
  );

  const waffle = useMemo(
    () =>
      computeWaffleAllocation(
        activePreset.dailyCapPct,
        activePreset.realizedLossPct,
        activePreset.warningBufferPct
      ),
    [activePreset]
  );

  const scatterDeals = useMemo(() => {
    if (scatterScope === 'active') {
      return MT5_DEAL_AUDIT_SAMPLES.filter(
        (d) => d.session === 'London' || d.session === 'Overlap'
      );
    }
    return MT5_DEAL_AUDIT_SAMPLES;
  }, [scatterScope]);

  const ols = useMemo(
    () =>
      computeOlsRegression(
        scatterDeals.map((d) => ({
          x: d.holdingMinutes,
          y: d.drawdownPct,
        }))
      ),
    [scatterDeals]
  );

  const filteredLedger = useMemo(
    () =>
      filterAndSortSessions(MT5_SESSION_LEDGER, {
        query: searchQuery,
        statusFilter,
        sortKey: sortState.key,
        sortDir: sortState.dir,
      }),
    [searchQuery, statusFilter, sortState]
  );

  const handleSort = useCallback((col: LedgerSortKey) => {
    setSortState((prev) =>
      prev.key === col
        ? { key: prev.key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key: col, dir: col === 'instrument' ? 'asc' : 'desc' }
    );
  }, []);

  const handleDownloadCsv = useCallback(() => {
    const csv = buildAnalyticsCsv(filteredLedger);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tallynx-mt5-telemetry-${statusFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredLedger, statusFilter]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const ledgerWithSparklines = useMemo(
    () =>
      filteredLedger.map((row) => {
        const minVal = Math.min(...row.sparkline, 0);
        const maxVal = Math.max(...row.sparkline, 1);
        const range = maxVal - minVal || 1;
        const points = row.sparkline
          .map((v, idx) => {
            const sx = (idx / (row.sparkline.length - 1)) * 68;
            const sy = 20 - ((v - minVal) / range) * 16;
            return `${sx.toFixed(1)},${sy.toFixed(1)}`;
          })
          .join(' ');
        return { row, points };
      }),
    [filteredLedger]
  );

  const getGroupLabel = (key: string) => {
    if (matrixGroupBy === 'outcome') {
      return copy.outcomeLabels[key as keyof typeof copy.outcomeLabels] ?? key;
    }
    return copy.sessionLabels[key as keyof typeof copy.sessionLabels] ?? key;
  };

  const getGroupColor = (key: string) =>
    matrixGroupBy === 'outcome'
      ? OUTCOME_COLORS[key] ?? '#737373'
      : SESSION_COLORS[key] ?? '#737373';

  // Scatter plot SVG coordinates
  const scatterW = 580;
  const scatterH = 268;
  const padL = 48;
  const padR = 20;
  const padT = 18;
  const padB = 38;
  const plotW = scatterW - padL - padR;
  const plotH = scatterH - padT - padB;
  const xDomainMax = 260;
  const yDomainMax = 5.0;

  const toSvgX = (mins: number) =>
    padL + (Math.min(xDomainMax, Math.max(0, mins)) / xDomainMax) * plotW;
  const toSvgY = (dd: number) =>
    padT + plotH - (Math.min(yDomainMax, Math.max(0, dd)) / yDomainMax) * plotH;

  const regX1 = 15;
  const regX2 = 240;
  const regY1 = ols.slope * regX1 + ols.intercept;
  const regY2 = ols.slope * regX2 + ols.intercept;

  const remainingPct = Math.max(
    0,
    activePreset.dailyCapPct -
      activePreset.realizedLossPct -
      activePreset.warningBufferPct
  );

  return (
    <section
      id="analytics"
      data-testid="analytics-dashboard-page"
      className="py-8 lg:py-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Editorial Header */}
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 font-mono text-xs font-semibold text-focus">
            <span>{copy.kicker1}</span>
            <span
              aria-hidden="true"
              className="text-neutral-300 dark:text-neutral-700"
            >
              ·
            </span>
            <span className="font-normal text-[#2B2D2F] dark:text-neutral-400">
              {copy.kicker2}
            </span>
          </div>
          <h1 className="mt-2.5 text-3xl font-semibold tracking-[-0.03em] text-[#141618] sm:text-4xl dark:text-white [text-wrap:balance]">
            {copy.title}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-focus">
            {copy.subtitle}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
            {copy.description}
          </p>
        </div>

        {/* Full-Width 4-Column KPI Strip */}
        <div
          data-testid="analytics-kpi-strip"
          className="grid grid-cols-2 border-y border-[#D6D1C7] dark:border-[#2B2D2F] lg:grid-cols-4"
        >
          {copy.kpis.map((kpi, idx) => (
            <div
              key={kpi.label}
              className={`py-6 ${
                idx < 3
                  ? 'lg:border-r lg:border-[#D6D1C7] dark:lg:border-neutral-800'
                  : ''
              } ${
                idx % 2 === 0
                  ? 'pr-4 sm:pr-6 border-r border-[#D6D1C7] dark:border-[#2B2D2F] lg:border-r'
                  : 'pl-4 sm:pl-6'
              } ${idx > 0 ? 'lg:pl-6' : ''} ${
                idx < 2
                  ? 'border-b border-[#D6D1C7] dark:border-[#2B2D2F] lg:border-b-0'
                  : ''
              }`}
            >
              <div className="font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-[#141618] dark:text-white tabular-nums">
                {kpi.value}
              </div>
              <div className="mt-1.5 text-xs font-medium text-[#141618] dark:text-neutral-300">
                {kpi.label}
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold text-focus">
                {kpi.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Real-Time Simulated Drawdown Visualizer (Lazy-Loaded Recharts, Fixed-Height Fallback for Zero CLS) */}
        <Suspense
          fallback={
            <div className="desk-panel p-6" aria-busy="true">
              <div className="h-6 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="mt-5 h-72 w-full animate-pulse rounded-xl bg-[#F8F6F0]/80 dark:bg-[#141618]/80" />
            </div>
          }
        >
          <RealtimeDrawdownChart
            lang={lang}
            isDark={isDark}
            dailyCapPct={activePreset.dailyCapPct}
          />
        </Suspense>

        {/* Row 1: 120-Deal Unit Matrix (Left 7 cols) + 10x10 Daily Loss Waffle (Right 5 cols) */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          {/* Instrument 1: 120-Deal Unit Matrix (Single-Elevation Surface) */}
          <div className="lg:col-span-7 desk-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#141618] dark:text-white">
                  {copy.matrixTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400 max-w-xl">
                  {copy.matrixDesc}
                </p>
              </div>

              {/* Group By Segmented Control */}
              <div
                role="group"
                aria-label="Group unit matrix"
                className="desk-tabs rounded border border-hairline bg-canvas p-0.5"
              >
                <button
                  type="button"
                  data-testid="matrix-group-outcome"
                  onClick={() => {
                    setMatrixGroupBy('outcome');
                    setMatrixFilter('all');
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    matrixGroupBy === 'outcome'
                      ? 'bg-accent-solid text-white'
                      : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {copy.groupByOutcome}
                </button>
                <button
                  type="button"
                  data-testid="matrix-group-session"
                  onClick={() => {
                    setMatrixGroupBy('session');
                    setMatrixFilter('all');
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    matrixGroupBy === 'session'
                      ? 'bg-accent-solid text-white'
                      : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {copy.groupBySession}
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="matrix-filter-all"
                onClick={() => setMatrixFilter('all')}
                className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                  matrixFilter === 'all'
                    ? 'border-[#141618] bg-[#141618] text-white dark:border-white dark:bg-white dark:text-[#141618]'
                    : 'border-[#D6D1C7] bg-[#F8F6F0] text-[#2B2D2F] hover:border-focus dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-neutral-300'
                }`}
              >
                {copy.filterAll}
              </button>
              {matrixSummary.map((group) => {
                const isActive = matrixFilter === group.key;
                const color = getGroupColor(group.key);
                return (
                  <button
                    key={group.key}
                    type="button"
                    data-testid={`matrix-filter-${group.key}`}
                    onClick={() =>
                      setMatrixFilter((prev) =>
                        prev === group.key ? 'all' : group.key
                      )
                    }
                    className={`inline-flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-focus bg-focus/10 text-[#141618] dark:text-white'
                        : 'border-[#D6D1C7] bg-[#F8F6F0] text-[#2B2D2F] hover:border-focus dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-neutral-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-[2px]"
                      style={{ backgroundColor: color }}
                    />
                    <span>{getGroupLabel(group.key)}</span>
                    <span className="tabular-nums text-muted">
                      {group.count} ({group.sharePct}%)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SVG 15x8 Unit Matrix */}
            <div className="mt-5 rounded bg-canvas p-3">
              <svg
                viewBox="0 0 600 304"
                role="img"
                aria-label="120-deal MT5 audit matrix"
                className="w-full h-auto block"
              >
                {orderedDeals.map((deal, idx) => {
                  const col = idx % MATRIX_COLS;
                  const row = Math.floor(idx / MATRIX_COLS);
                  const cellSize = 30;
                  const gap = 8;
                  const x = 16 + col * (cellSize + gap);
                  const y = 10 + row * (cellSize + gap);
                  const key =
                    matrixGroupBy === 'outcome' ? deal.outcome : deal.session;
                  const fill = getGroupColor(key);
                  const dimmed =
                    matrixFilter !== 'all' && matrixFilter !== key;
                  const isFocused = hoveredDeal?.id === deal.id;

                  return (
                    <rect
                      key={deal.id}
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx={4}
                      fill={fill}
                      fillOpacity={dimmed ? 0.16 : 0.9}
                      stroke={isFocused ? 'var(--desk-ink)' : 'transparent'}
                      strokeWidth={isFocused ? 2.5 : 0}
                      tabIndex={0}
                      role="button"
                      aria-label={`${deal.ticket} ${deal.symbol} ${deal.session} ${deal.drawdownPct}% drawdown`}
                      className="cursor-pointer transition-opacity duration-150 focus:outline-none"
                      onMouseEnter={() => setHoveredDeal(deal)}
                      onFocus={() => setHoveredDeal(deal)}
                      onMouseLeave={() => setHoveredDeal(null)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Single-Line Inspector Readout */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#D6D1C7] pt-3 font-mono text-[11px] text-[#2B2D2F] dark:border-[#2B2D2F] dark:text-neutral-400">
              {hoveredDeal ? (
                <div className="flex flex-wrap items-center gap-3 text-[#141618] dark:text-white">
                  <span className="font-bold text-focus">
                    {hoveredDeal.ticket}
                  </span>
                  <span>{hoveredDeal.symbol}</span>
                  <span>{hoveredDeal.session}</span>
                  <span className="tabular-nums">
                    {hoveredDeal.holdingMinutes}m
                  </span>
                  <span className="tabular-nums">
                    DD {hoveredDeal.drawdownPct.toFixed(2)}%
                  </span>
                  <span className="tabular-nums">
                    {hoveredDeal.rMultiple >= 0 ? '+' : ''}
                    {hoveredDeal.rMultiple.toFixed(2)}R
                  </span>
                </div>
              ) : (
                <span className="truncate">
                  {lang === 'th'
                    ? 'วางเมาส์บนช่องสี่เหลี่ยมเพื่อดู Ticket และ Drawdown'
                    : 'Hover or focus any square to inspect ticket & drawdown drift'}
                </span>
              )}
              <span className="tabular-nums whitespace-nowrap shrink-0">
                120 / 120 TICKETS
              </span>
            </div>

            {/* Data Table Disclosure */}
            <div className="mt-3 pt-3 border-t border-[#D6D1C7] dark:border-[#2B2D2F]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {lang === 'th'
                    ? 'แหล่งข้อมูล: MT5 Local History Read-Only'
                    : 'Source: Local MT5 Read-Only Deal History'}
                </span>
                <button
                  type="button"
                  data-testid="toggle-matrix-table"
                  onClick={() => setShowMatrixTable((prev) => !prev)}
                  className="inline-flex items-center space-x-1 font-mono text-xs font-semibold text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>
                    {showMatrixTable ? copy.hideDataTable : copy.showDataTable}
                  </span>
                  {showMatrixTable ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {showMatrixTable && (
                <div className="mt-3">
                  <table
                    data-testid="matrix-data-table"
                    className="w-full border-collapse text-xs tabular-nums"
                  >
                    <thead>
                      <tr className="border-y border-neutral-200 dark:border-[#2B2D2F] text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                        <th className="py-2 pr-4 text-left font-medium">
                          {matrixGroupBy === 'outcome' ? 'Category' : 'Session'}
                        </th>
                        <th className="py-2 px-4 text-right font-medium">
                          Deals
                        </th>
                        <th className="py-2 pl-4 text-right font-medium">
                          Share (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                      {matrixSummary.map((row) => (
                        <tr key={row.key}>
                          <td className="py-2 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
                            {getGroupLabel(row.key)}
                          </td>
                          <td className="py-2 px-4 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                            {row.count}
                          </td>
                          <td className="py-2 pl-4 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                            {row.sharePct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Instrument 2: 10x10 Daily Loss Budget Waffle (Single-Elevation Surface) */}
          <div className="lg:col-span-5 desk-panel p-4 sm:p-5">
            <h2 className="text-lg font-bold tracking-tight text-[#141618] dark:text-white">
              {copy.waffleTitle}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
              {copy.waffleDesc}
            </p>

            {/* Single-Row 3-Preset Segmented Bar */}
            <div
              role="group"
              aria-label="Daily loss budget presets"
              className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,6rem),1fr))] gap-1 rounded border border-hairline bg-canvas p-1"
            >
              {RISK_BUDGET_PRESETS.map((p) => {
                const isSelected = presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-testid={`waffle-preset-${p.id}`}
                    onClick={() => setPresetId(p.id)}
                    className={`rounded-md px-2 py-1.5 font-mono text-[11px] font-semibold leading-snug transition cursor-pointer ${
                      isSelected
                        ? 'bg-accent-solid text-white'
                        : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    {copy.presets[p.id]}
                  </button>
                );
              })}
            </div>

            {/* 10x10 SVG Waffle Stage (flat background, no nested card box) */}
            <div className="mt-5 flex justify-center rounded bg-canvas py-5 px-4">
              <svg
                viewBox="0 0 220 220"
                role="img"
                aria-label="10 by 10 daily loss budget allocation waffle"
                className="w-48 h-48"
              >
                {waffle.cells.map((kind, i) => {
                  const col = i % 10;
                  const row = Math.floor(i / 10);
                  const x = 6 + col * 21;
                  const y = 6 + row * 21;
                  const fill =
                    kind === 'used'
                      ? '#e11d48'
                      : kind === 'buffer'
                      ? '#f59e0b'
                      : '#D6D1C7';
                  const opacity = kind === 'available' ? 0.35 : 0.92;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width={17}
                      height={17}
                      rx={3}
                      fill={fill}
                      fillOpacity={opacity}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Full-Width Tabular Allocation Breakdown */}
            <div className="mt-5 divide-y divide-[#D6D1C7] border-t border-[#D6D1C7] dark:divide-neutral-800 dark:border-[#2B2D2F] text-xs">
              <div className="flex items-center justify-between py-2.5 gap-3">
                <span className="flex items-center space-x-2 text-[#141618] dark:text-neutral-300 whitespace-nowrap">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 rounded-[2px] bg-rose-600 shrink-0"
                  />
                  <span>{copy.waffleUsed}</span>
                </span>
                <span className="font-mono font-bold tabular-nums text-[#141618] dark:text-white whitespace-nowrap shrink-0">
                  {waffle.usedCells}% · {activePreset.realizedLossPct.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 gap-3">
                <span className="flex items-center space-x-2 text-[#141618] dark:text-neutral-300 whitespace-nowrap">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 rounded-[2px] bg-amber-500 shrink-0"
                  />
                  <span>{copy.waffleBuffer}</span>
                </span>
                <span className="font-mono font-bold tabular-nums text-[#141618] dark:text-white whitespace-nowrap shrink-0">
                  {waffle.bufferCells}% · {activePreset.warningBufferPct.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 gap-3">
                <span className="flex items-center space-x-2 text-[#141618] dark:text-neutral-300 whitespace-nowrap">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 rounded-[2px] bg-neutral-300 dark:bg-neutral-700 shrink-0"
                  />
                  <span>{copy.waffleAvailable}</span>
                </span>
                <span className="font-mono font-bold tabular-nums text-positive whitespace-nowrap shrink-0">
                  {waffle.availableCells}% · {remainingPct.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="mt-2 pt-3 border-t border-[#D6D1C7] dark:border-[#2B2D2F] flex items-center justify-between font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
              <span>Daily Cap {activePreset.dailyCapPct.toFixed(1)}%</span>
              <span className="tabular-nums">
                Poll {activePreset.heartbeatCadenceMs} ms
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: OLS Regression Scatter Plot (Single-Elevation Surface) */}
        <div className="desk-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#141618] dark:text-white">
                {copy.scatterTitle}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400 max-w-2xl">
                {copy.scatterDesc}
              </p>
            </div>

            {/* Scope Segmented Control */}
            <div
              role="group"
              aria-label="Regression session scope"
              className="desk-tabs rounded border border-hairline bg-canvas p-0.5"
            >
              <button
                type="button"
                data-testid="scatter-scope-all"
                onClick={() => setScatterScope('all')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  scatterScope === 'all'
                    ? 'bg-accent-solid text-white'
                    : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {copy.scatterAll}
              </button>
              <button
                type="button"
                data-testid="scatter-scope-active"
                onClick={() => setScatterScope('active')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  scatterScope === 'active'
                    ? 'bg-accent-solid text-white'
                    : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {copy.scatterActiveSessions}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-9 rounded bg-canvas p-4">
              <svg
                viewBox={`0 0 ${scatterW} ${scatterH}`}
                role="img"
                aria-label="Scatter plot of holding duration against intraday drawdown with OLS regression line"
                className="w-full h-auto block"
              >
                {/* Horizontal gridlines */}
                {[0, 1, 2, 3, 4, 5].map((tick) => {
                  const y = toSvgY(tick);
                  return (
                    <g key={tick}>
                      <line
                        x1={padL}
                        x2={scatterW - padR}
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        className="text-neutral-200 dark:text-neutral-800"
                        strokeDasharray={tick === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={padL - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-neutral-500 font-mono text-[10px]"
                      >
                        {tick.toFixed(1)}%
                      </text>
                    </g>
                  );
                })}

                {/* X-axis ticks */}
                {[0, 60, 120, 180, 240].map((mTick) => {
                  const x = toSvgX(mTick);
                  return (
                    <text
                      key={mTick}
                      x={x}
                      y={scatterH - 12}
                      textAnchor="middle"
                      className="fill-neutral-500 font-mono text-[10px]"
                    >
                      {mTick}m
                    </text>
                  );
                })}

                {/* Axis Title */}
                <text
                  x={padL + plotW / 2}
                  y={scatterH - 1}
                  textAnchor="middle"
                  className="fill-muted font-mono text-[9px]"
                >
                  {copy.scatterXAxis}
                </text>

                {/* Scatter Data Points */}
                {scatterDeals.map((d) => {
                  const cx = toSvgX(d.holdingMinutes);
                  const cy = toSvgY(d.drawdownPct);
                  const fill = OUTCOME_COLORS[d.outcome] ?? '#737373';
                  const active = hoveredPoint?.id === d.id;
                  return (
                    <circle
                      key={d.id}
                      cx={cx}
                      cy={cy}
                      r={active ? 6 : 4}
                      fill={fill}
                      fillOpacity={0.82}
                      stroke={active ? 'var(--desk-ink)' : 'none'}
                      strokeWidth={1.5}
                      tabIndex={0}
                      aria-label={`${d.ticket} ${d.holdingMinutes}m ${d.drawdownPct}%`}
                      className="cursor-pointer focus:outline-none"
                      onMouseEnter={() => setHoveredPoint(d)}
                      onFocus={() => setHoveredPoint(d)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {/* Fitted OLS Regression Line */}
                <line
                  x1={toSvgX(regX1)}
                  y1={toSvgY(regY1)}
                  x2={toSvgX(regX2)}
                  y2={toSvgY(regY2)}
                  stroke="var(--desk-ink)"
                  strokeWidth={2.25}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Unboxed Hairline-Separated OLS Readout */}
            <div className="lg:col-span-3 space-y-4">
              <div className="pb-4 border-b border-[#D6D1C7] dark:border-[#2B2D2F]">
                <div className="font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                  {copy.scatterR2Label}
                </div>
                <div
                  data-testid="ols-r2-value"
                  className="mt-1 font-mono text-3xl font-semibold tabular-nums text-[#141618] dark:text-white"
                >
                  {ols.r2.toFixed(3)}
                </div>
              </div>

              <div className="space-y-2.5 pb-4 border-b border-[#D6D1C7] dark:border-[#2B2D2F] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#2B2D2F] dark:text-neutral-400">
                    {copy.scatterSlopeLabel}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-focus">
                    +{ols.slope.toFixed(4)}%/min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2B2D2F] dark:text-neutral-400">Sample Size (n)</span>
                  <span className="font-mono font-semibold tabular-nums text-[#141618] dark:text-neutral-100">
                    {ols.count}
                  </span>
                </div>
              </div>

              <div className="font-mono text-[11px] min-h-[48px]">
                {hoveredPoint ? (
                  <div className="space-y-1 text-[#141618] dark:text-neutral-300">
                    <div className="font-bold text-focus">
                      {hoveredPoint.ticket} · {hoveredPoint.symbol}
                    </div>
                    <div className="tabular-nums">
                      Hold: {hoveredPoint.holdingMinutes} min · DD:{' '}
                      {hoveredPoint.drawdownPct.toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <div className="text-[#2B2D2F] dark:text-neutral-400 leading-relaxed">
                    {lang === 'th'
                      ? 'เส้นแนวโน้ม OLS แสดง Drawdown ที่เพิ่มขึ้นเมื่อถือออเดอร์เกิน 90 นาที'
                      : 'The OLS fit tracks intraday drawdown expansion past 90m holds.'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowScatterTable((prev) => !prev)}
                className="w-full inline-flex items-center justify-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3.5 py-2 font-mono text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer whitespace-nowrap"
              >
                <span>
                  {showScatterTable ? copy.hideDataTable : copy.showDataTable}
                </span>
                {showScatterTable ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {showScatterTable && (
            <div className="mt-5 pt-4 border-t border-[#D6D1C7] dark:border-[#2B2D2F] grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <div className="text-[#2B2D2F] dark:text-neutral-400 text-[11px]">Slope (m)</div>
                <div className="font-bold tabular-nums">{ols.slope}</div>
              </div>
              <div>
                <div className="text-[#2B2D2F] dark:text-neutral-400 text-[11px]">
                  Intercept (b)
                </div>
                <div className="font-bold tabular-nums">{ols.intercept}%</div>
              </div>
              <div>
                <div className="text-[#2B2D2F] dark:text-neutral-400 text-[11px]">Pearson r</div>
                <div className="font-bold tabular-nums">{ols.correlation}</div>
              </div>
              <div>
                <div className="text-[#2B2D2F] dark:text-neutral-400 text-[11px]">X / Y Range</div>
                <div className="font-bold tabular-nums">
                  {ols.xMin}–{ols.xMax}m / {ols.yMin}–{ols.yMax}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Searchable Instrument Telemetry Ledger + Sparklines + CSV Export */}
        <div className="desk-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#141618] dark:text-white">
                {copy.ledgerTitle}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                {copy.ledgerDesc}
              </p>
            </div>

            <button
              type="button"
              data-testid="download-telemetry-csv"
              onClick={handleDownloadCsv}
              className="desk-primary min-h-9 px-4 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{copy.downloadCsv}</span>
            </button>
          </div>

          {/* Search & Status Filter Toolbar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-0 basis-full sm:max-w-md sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="search"
                data-testid="ledger-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={copy.searchPlaceholder}
                placeholder={copy.searchPlaceholder}
                className="h-9 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] pl-9 pr-3 text-xs text-[#141618] placeholder:text-muted focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
              />
            </div>

            <div
              role="group"
              aria-label="Filter telemetry ledger by gate status"
              className="desk-tabs rounded border border-hairline bg-canvas p-0.5"
            >
              {(
                [
                  { id: 'all', label: copy.statusAll },
                  { id: 'nominal', label: copy.statusNominal },
                  { id: 'warning', label: copy.statusWarning },
                  { id: 'gated', label: copy.statusGated },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  data-testid={`ledger-status-${st.id}`}
                  onClick={() => setStatusFilter(st.id)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-accent-solid text-white'
                      : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Grid or Empty State */}
          {filteredLedger.length === 0 ? (
            <div
              data-testid="ledger-empty-state"
              className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D6D1C7] py-12 text-center dark:border-neutral-700"
            >
              <p className="text-sm font-bold text-[#141618] dark:text-white">
                {copy.emptyTitle}
              </p>
              <p className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400 max-w-md">
                {copy.emptyDesc}
              </p>
              <button
                type="button"
                data-testid="ledger-reset-filters"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-white px-4 py-2 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-100 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{copy.resetFilters}</span>
              </button>
            </div>
          ) : (
            <div role="region" aria-label={copy.ledgerTitle} tabIndex={0} className="mt-5 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-focus">
              <table
                data-testid="analytics-ledger-table"
                className="w-full border-collapse text-xs tabular-nums"
              >
                <thead>
                  <tr className="border-y border-[#D6D1C7] bg-[#F8F6F0]/70 font-mono text-[11px] text-[#2B2D2F] dark:border-[#2B2D2F] dark:bg-[#141618]/70 dark:text-neutral-400">
                    {(
                      [
                        {
                          key: 'instrument',
                          label: copy.cols.instrument,
                          align: 'left',
                        },
                        { key: null, label: copy.cols.session, align: 'left' },
                        {
                          key: 'dealsCount',
                          label: copy.cols.dealsCount,
                          align: 'right',
                        },
                        {
                          key: 'adherencePct',
                          label: copy.cols.adherencePct,
                          align: 'right',
                        },
                        {
                          key: 'maxDrawdownPct',
                          label: copy.cols.maxDrawdownPct,
                          align: 'right',
                        },
                        {
                          key: 'avgLatencyMs',
                          label: copy.cols.avgLatencyMs,
                          align: 'right',
                        },
                        { key: 'netR', label: copy.cols.netR, align: 'right' },
                        { key: null, label: copy.cols.trend, align: 'right' },
                        { key: null, label: copy.cols.status, align: 'right' },
                      ] as const
                    ).map((col) => (
                      <th
                        key={col.label}
                        className={`py-2.5 px-3 font-medium whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col.key ? (
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className="inline-flex items-center space-x-1 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
                          >
                            <span>{col.label}</span>
                            <ArrowUpDown className="h-3 w-3 opacity-60" />
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {ledgerWithSparklines.map(({ row, points }) => {
                    const statusBadge =
                      row.status === 'nominal'
                        ? {
                            label: copy.statusNominal,
                            cls: 'text-positive',
                          }
                        : row.status === 'warning'
                        ? {
                            label: copy.statusWarning,
                            cls: 'text-caution',
                          }
                        : {
                            label: copy.statusGated,
                            cls: 'text-negative',
                          };

                    return (
                      <tr
                        key={row.id}
                        className="h-11 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition-colors"
                      >
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-neutral-950 dark:text-white">
                            {row.instrument}
                          </div>
                          <div className="font-mono text-[11px] text-muted">
                            {row.id}
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                          {row.session}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                          {row.dealsCount}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                          {row.adherencePct.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                          {row.maxDrawdownPct.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                          {row.avgLatencyMs} ms
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-mono font-bold tabular-nums ${
                            row.netR >= 0
                              ? 'text-positive'
                              : 'text-negative'
                          }`}
                        >
                          {row.netR >= 0 ? '+' : ''}
                          {row.netR.toFixed(1)}R
                        </td>
                        <td className="py-2 px-3 text-right">
                          <svg
                            viewBox="0 0 68 24"
                            width={68}
                            height={24}
                            aria-hidden="true"
                            className="inline-block"
                          >
                            <polyline
                              fill="none"
                              stroke={row.netR >= 0 ? 'var(--desk-positive)' : 'var(--desk-negative)'}
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={points}
                            />
                          </svg>
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-mono font-semibold whitespace-nowrap ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
