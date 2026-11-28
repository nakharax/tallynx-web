import type { Language } from './i18n';

export type DealOutcome = 'disciplined' | 'near_limit' | 'breached' | 'untracked';
export type TradingSessionName = 'Asian' | 'London' | 'New York' | 'Overlap';
export type LedgerStatus = 'nominal' | 'warning' | 'gated';
export type WaffleCellKind = 'used' | 'buffer' | 'available';

export interface AuditedDealRecord {
  id: number;
  ticket: string;
  symbol: string;
  session: TradingSessionName;
  outcome: DealOutcome;
  holdingMinutes: number;
  drawdownPct: number;
  latencyMs: number;
  rMultiple: number;
}

export interface SessionLedgerRow {
  id: string;
  instrument: string;
  session: TradingSessionName;
  dealsCount: number;
  adherencePct: number;
  maxDrawdownPct: number;
  avgLatencyMs: number;
  netR: number;
  status: LedgerStatus;
  sparkline: number[];
}

export interface DealMatrixGroupSummary {
  key: string;
  count: number;
  sharePct: number;
}

export interface OlsRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  correlation: number;
  count: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface WaffleSummary {
  usedCells: number;
  bufferCells: number;
  availableCells: number;
  cells: WaffleCellKind[];
}

export interface RiskBudgetPreset {
  id: 'conservative' | 'standard' | 'prop';
  dailyCapPct: number;
  realizedLossPct: number;
  warningBufferPct: number;
  heartbeatCadenceMs: number;
}

export type SimulationScenarioId = 'calm' | 'volatile' | 'breach_test';
export type StreamGateStatus = 'nominal' | 'caution' | 'gated';

export interface DrawdownStreamPoint {
  stepIndex: number;
  tickLabel: string;
  intradayDrawdownPct: number;
  headroomPct: number;
  dailyCapPct: number;
  cautionThresholdPct: number;
  equityUsd: number;
  floatingPnlUsd: number;
  heartbeatMs: number;
  status: StreamGateStatus;
}

export interface DrawdownStreamSummary {
  currentDdPct: number;
  peakDdPct: number;
  headroomPct: number;
  equityUsd: number;
  floatingPnlUsd: number;
  avgHeartbeatMs: number;
  latestHeartbeatMs: number;
  status: StreamGateStatus;
  latestStep: number;
}

export const RISK_BUDGET_PRESETS: RiskBudgetPreset[] = [
  {
    id: 'conservative',
    dailyCapPct: 2.0,
    realizedLossPct: 0.48,
    warningBufferPct: 0.32,
    heartbeatCadenceMs: 1180,
  },
  {
    id: 'standard',
    dailyCapPct: 4.0,
    realizedLossPct: 1.52,
    warningBufferPct: 0.68,
    heartbeatCadenceMs: 1290,
  },
  {
    id: 'prop',
    dailyCapPct: 5.0,
    realizedLossPct: 3.15,
    warningBufferPct: 0.95,
    heartbeatCadenceMs: 1340,
  },
];

const SYMBOLS = ['XAUUSD', 'EURUSD', 'NAS100', 'USDJPY', 'GBPUSD', 'US30'] as const;
const SESSIONS: TradingSessionName[] = ['London', 'Overlap', 'New York', 'Asian'];

/**
 * Deterministic generator for 120 audited MT5 deals across trading sessions & outcomes.
 * Provides consistent scatter correlation between holding duration and intraday drawdown drift.
 */
export const MT5_DEAL_AUDIT_SAMPLES: AuditedDealRecord[] = Array.from(
  { length: 120 },
  (_, index) => {
    const symbol = SYMBOLS[index % SYMBOLS.length];
    const session: TradingSessionName =
      index < 38
        ? 'London'
        : index < 74
        ? 'Overlap'
        : index < 102
        ? 'New York'
        : 'Asian';

    // Outcome distribution out of 120:
    // 88 disciplined (73.3%), 20 near_limit (16.7%), 8 breached (6.7%), 4 untracked (3.3%)
    let outcome: DealOutcome = 'disciplined';
    if (index >= 88 && index < 108) {
      outcome = 'near_limit';
    } else if (index >= 108 && index < 116) {
      outcome = 'breached';
    } else if (index >= 116) {
      outcome = 'untracked';
    }

    const baseHold =
      outcome === 'disciplined'
        ? 18 + ((index * 13) % 72)
        : outcome === 'near_limit'
        ? 78 + ((index * 17) % 85)
        : outcome === 'breached'
        ? 135 + ((index * 19) % 105)
        : 45 + ((index * 11) % 60);

    // Deterministic residual around positive holding -> drawdown relationship
    const wave = ((index % 7) - 3) * 0.14;
    const rawDrawdown = Math.max(
      0.18,
      Math.min(4.85, Number((0.28 + baseHold * 0.0175 + wave).toFixed(2)))
    );

    const latencyMs = 980 + ((index * 37) % 390);
    const rMultiple =
      outcome === 'disciplined'
        ? Number((0.8 + ((index % 5) * 0.45)).toFixed(2))
        : outcome === 'near_limit'
        ? Number((-0.45 + ((index % 4) * 0.35)).toFixed(2))
        : outcome === 'breached'
        ? Number((-1.85 - ((index % 3) * 0.4)).toFixed(2))
        : 0.15;

    return {
      id: index + 1,
      ticket: `MT5-${String(480100 + index * 13)}`,
      symbol,
      session,
      outcome,
      holdingMinutes: baseHold,
      drawdownPct: rawDrawdown,
      latencyMs,
      rMultiple,
    };
  }
);

export const MT5_SESSION_LEDGER: SessionLedgerRow[] = [
  {
    id: 'NX-AU-LDN',
    instrument: 'XAUUSD',
    session: 'London',
    dealsCount: 28,
    adherencePct: 96.4,
    maxDrawdownPct: 1.42,
    avgLatencyMs: 1180,
    netR: 11.4,
    status: 'nominal',
    sparkline: [0.4, 0.9, 1.3, 1.1, 1.8, 2.2, 2.6, 2.9],
  },
  {
    id: 'NX-EU-OVL',
    instrument: 'EURUSD',
    session: 'Overlap',
    dealsCount: 24,
    adherencePct: 100.0,
    maxDrawdownPct: 0.88,
    avgLatencyMs: 1120,
    netR: 9.2,
    status: 'nominal',
    sparkline: [0.2, 0.5, 0.7, 1.0, 1.2, 1.6, 1.9, 2.3],
  },
  {
    id: 'NX-NQ-NYC',
    instrument: 'NAS100',
    session: 'New York',
    dealsCount: 19,
    adherencePct: 84.2,
    maxDrawdownPct: 3.18,
    avgLatencyMs: 1340,
    netR: 3.6,
    status: 'warning',
    sparkline: [0.6, 1.2, 0.8, 1.5, 1.1, 0.9, 1.4, 1.7],
  },
  {
    id: 'NX-UJ-ASN',
    instrument: 'USDJPY',
    session: 'Asian',
    dealsCount: 14,
    adherencePct: 92.9,
    maxDrawdownPct: 1.15,
    avgLatencyMs: 1210,
    netR: 4.8,
    status: 'nominal',
    sparkline: [0.1, 0.4, 0.3, 0.8, 1.1, 1.3, 1.5, 1.6],
  },
  {
    id: 'NX-GU-LDN',
    instrument: 'GBPUSD',
    session: 'London',
    dealsCount: 16,
    adherencePct: 93.8,
    maxDrawdownPct: 1.64,
    avgLatencyMs: 1240,
    netR: 6.1,
    status: 'nominal',
    sparkline: [0.3, 0.6, 0.5, 1.0, 1.4, 1.8, 1.7, 2.1],
  },
  {
    id: 'NX-US30-OVL',
    instrument: 'US30',
    session: 'Overlap',
    dealsCount: 11,
    adherencePct: 72.7,
    maxDrawdownPct: 4.35,
    avgLatencyMs: 1380,
    netR: -2.4,
    status: 'gated',
    sparkline: [1.2, 0.8, 0.4, 0.9, 0.2, -0.3, -0.6, -0.8],
  },
  {
    id: 'NX-AU-NYC',
    instrument: 'XAUUSD',
    session: 'New York',
    dealsCount: 8,
    adherencePct: 87.5,
    maxDrawdownPct: 2.65,
    avgLatencyMs: 1310,
    netR: 1.9,
    status: 'warning',
    sparkline: [0.5, 0.9, 0.6, 1.1, 0.8, 1.2, 1.0, 1.3],
  },
];

export function summarizeDealMatrix(
  deals: AuditedDealRecord[],
  groupBy: 'outcome' | 'session'
): DealMatrixGroupSummary[] {
  const keys: string[] =
    groupBy === 'outcome'
      ? ['disciplined', 'near_limit', 'breached', 'untracked']
      : SESSIONS;

  const counts = new Map<string, number>();
  for (const k of keys) {
    counts.set(k, 0);
  }

  for (const deal of deals) {
    const key = groupBy === 'outcome' ? deal.outcome : deal.session;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = deals.length || 1;
  return keys.map((key) => {
    const count = counts.get(key) ?? 0;
    return {
      key,
      count,
      sharePct: Number(((count / total) * 100).toFixed(1)),
    };
  });
}

/**
 * Maps daily drawdown consumption against the daily loss cap onto a 100-cell (10x10) waffle grid.
 */
export function computeWaffleAllocation(
  dailyCapPct: number,
  realizedLossPct: number,
  warningBufferPct: number
): WaffleSummary {
  if (dailyCapPct <= 0) {
    return {
      usedCells: 0,
      bufferCells: 0,
      availableCells: 100,
      cells: Array<WaffleCellKind>(100).fill('available'),
    };
  }

  const usedRatio = Math.max(0, Math.min(1, realizedLossPct / dailyCapPct));
  const bufferRatio = Math.max(
    0,
    Math.min(1 - usedRatio, warningBufferPct / dailyCapPct)
  );

  const usedCells = Math.round(usedRatio * 100);
  const bufferCells = Math.min(100 - usedCells, Math.round(bufferRatio * 100));
  const availableCells = Math.max(0, 100 - usedCells - bufferCells);

  const cells: WaffleCellKind[] = [
    ...Array<WaffleCellKind>(usedCells).fill('used'),
    ...Array<WaffleCellKind>(bufferCells).fill('buffer'),
    ...Array<WaffleCellKind>(availableCells).fill('available'),
  ];

  return {
    usedCells,
    bufferCells,
    availableCells,
    cells,
  };
}

/**
 * Computes Ordinary Least Squares regression (y = slope * x + intercept) and R^2.
 */
export function computeOlsRegression(
  points: Array<{ x: number; y: number }>
): OlsRegressionResult {
  const n = points.length;
  if (n === 0) {
    return {
      slope: 0,
      intercept: 0,
      r2: 0,
      correlation: 0,
      count: 0,
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    };
  }

  let sumX = 0;
  let sumY = 0;
  let xMin = points[0].x;
  let xMax = points[0].x;
  let yMin = points[0].y;
  let yMax = points[0].y;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }

  if (n === 1) {
    return {
      slope: 0,
      intercept: Number(sumY.toFixed(4)),
      r2: 0,
      correlation: 0,
      count: 1,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;

  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    ssXX += dx * dx;
    ssYY += dy * dy;
    ssXY += dx * dy;
  }

  if (ssXX === 0) {
    return {
      slope: 0,
      intercept: Number(meanY.toFixed(4)),
      r2: 0,
      correlation: 0,
      count: n,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  }

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const correlation = ssYY === 0 ? 0 : ssXY / Math.sqrt(ssXX * ssYY);
  const r2 = correlation * correlation;

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    r2: Number(r2.toFixed(4)),
    correlation: Number(correlation.toFixed(4)),
    count: n,
    xMin,
    xMax,
    yMin,
    yMax,
  };
}

export type LedgerSortKey =
  | 'instrument'
  | 'dealsCount'
  | 'adherencePct'
  | 'maxDrawdownPct'
  | 'avgLatencyMs'
  | 'netR';

export interface FilterSortOptions {
  query: string;
  statusFilter: 'all' | LedgerStatus;
  sortKey: LedgerSortKey;
  sortDir: 'asc' | 'desc';
}

export function filterAndSortSessions(
  rows: SessionLedgerRow[],
  options: FilterSortOptions
): SessionLedgerRow[] {
  const q = options.query.trim().toLowerCase();

  const filtered = rows.filter((row) => {
    const matchesStatus =
      options.statusFilter === 'all' || row.status === options.statusFilter;
    if (!matchesStatus) return false;
    if (!q) return true;
    return (
      row.instrument.toLowerCase().includes(q) ||
      row.session.toLowerCase().includes(q) ||
      row.id.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = options.sortDir === 'asc' ? 1 : -1;
    if (options.sortKey === 'instrument') {
      return a.instrument.localeCompare(b.instrument) * dir;
    }
    const diff = a[options.sortKey] - b[options.sortKey];
    return diff * dir;
  });

  return sorted;
}

function escapeCsvField(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildAnalyticsCsv(rows: SessionLedgerRow[]): string {
  const headers = [
    'Cohort ID',
    'Instrument',
    'Session',
    'Audited Deals',
    'Rule Adherence (%)',
    'Max Intraday Drawdown (%)',
    'Avg Heartbeat (ms)',
    'Net R Multiple',
    'Gate Status',
  ];

  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.instrument,
        r.session,
        r.dealsCount,
        r.adherencePct.toFixed(1),
        r.maxDrawdownPct.toFixed(2),
        r.avgLatencyMs,
        r.netR.toFixed(1),
        r.status.toUpperCase(),
      ]
        .map(escapeCsvField)
        .join(',')
    ),
  ];

  return lines.join('\n');
}

const STREAM_BASELINE_EQUITY_USD = 100000;

export function formatStreamTickLabel(stepIndex: number): string {
  const safeStep = Math.max(0, Math.floor(stepIndex));
  const totalSeconds = safeStep * 15;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function classifyStreamGateStatus(
  drawdownPct: number,
  dailyCapPct: number
): StreamGateStatus {
  if (dailyCapPct <= 0) return 'nominal';
  const ratio = drawdownPct / dailyCapPct;
  if (ratio >= 0.85) return 'gated';
  if (ratio >= 0.55) return 'caution';
  return 'nominal';
}

function computeNextDrawdownValue(
  prevDdPct: number,
  stepIndex: number,
  scenario: SimulationScenarioId,
  dailyCapPct: number,
  spikeImpulsePct = 0
): number {
  const cap = Math.max(1.0, dailyCapPct);
  const wave =
    Math.sin(stepIndex * 0.65) * 0.14 + Math.cos(stepIndex * 1.37) * 0.08;

  let targetAnchor = cap * 0.28;
  let driftFactor = 0.24;
  let impulseAmplitude = 0.22;

  if (scenario === 'volatile') {
    targetAnchor = cap * 0.56;
    driftFactor = 0.18;
    impulseAmplitude = 0.42;
  } else if (scenario === 'breach_test') {
    targetAnchor = cap * 0.84;
    driftFactor = 0.22;
    impulseAmplitude = 0.34;
  }

  const pseudoJitter =
    (((stepIndex * 1103515245 + 12345) >>> 16) % 100) / 100 - 0.5;
  const meanPull = (targetAnchor - prevDdPct) * driftFactor;
  const delta =
    meanPull + wave * impulseAmplitude + pseudoJitter * impulseAmplitude + spikeImpulsePct;

  const next = Math.max(0.08, Math.min(cap * 0.99, prevDdPct + delta));
  return Number(next.toFixed(2));
}

function buildStreamPoint(
  stepIndex: number,
  drawdownPct: number,
  dailyCapPct: number,
  scenario: SimulationScenarioId
): DrawdownStreamPoint {
  const safeCap = Math.max(1.0, Number(dailyCapPct.toFixed(2)));
  const clampedDd = Number(
    Math.max(0.05, Math.min(safeCap, drawdownPct)).toFixed(2)
  );
  const headroomPct = Number(Math.max(0, safeCap - clampedDd).toFixed(2));
  const cautionThresholdPct = Number((safeCap * 0.85).toFixed(2));
  const floatingPnlUsd = Number(
    (-(clampedDd / 100) * STREAM_BASELINE_EQUITY_USD).toFixed(2)
  );
  const equityUsd = Number(
    (STREAM_BASELINE_EQUITY_USD + floatingPnlUsd).toFixed(2)
  );
  const baseHeartbeat =
    scenario === 'volatile' ? 1240 : scenario === 'breach_test' ? 1310 : 1080;
  const heartbeatMs = Math.min(
    1390,
    baseHeartbeat + ((stepIndex * 53) % 140)
  );

  return {
    stepIndex,
    tickLabel: formatStreamTickLabel(stepIndex),
    intradayDrawdownPct: clampedDd,
    headroomPct,
    dailyCapPct: safeCap,
    cautionThresholdPct,
    equityUsd,
    floatingPnlUsd,
    heartbeatMs,
    status: classifyStreamGateStatus(clampedDd, safeCap),
  };
}

export function generateInitialDrawdownStream(
  scenario: SimulationScenarioId,
  dailyCapPct = 4.0,
  count = 24
): DrawdownStreamPoint[] {
  const length = Math.max(4, Math.min(60, count));
  const cap = Math.max(1.0, dailyCapPct);
  let currentDd =
    scenario === 'breach_test'
      ? cap * 0.62
      : scenario === 'volatile'
      ? cap * 0.38
      : cap * 0.22;

  const points: DrawdownStreamPoint[] = [];
  for (let i = 0; i < length; i++) {
    currentDd =
      i === 0
        ? Number(currentDd.toFixed(2))
        : computeNextDrawdownValue(currentDd, i, scenario, cap);
    points.push(buildStreamPoint(i, currentDd, cap, scenario));
  }
  return points;
}

export function appendNextDrawdownTick(
  series: DrawdownStreamPoint[],
  scenario: SimulationScenarioId,
  dailyCapPct = 4.0,
  maxWindow = 28,
  spikeImpulsePct = 0
): DrawdownStreamPoint[] {
  const safeWindow = Math.max(4, maxWindow);
  if (series.length === 0) {
    return generateInitialDrawdownStream(scenario, dailyCapPct, safeWindow);
  }
  const last = series[series.length - 1];
  const nextStep = last.stepIndex + 1;
  const nextDd = computeNextDrawdownValue(
    last.intradayDrawdownPct,
    nextStep,
    scenario,
    dailyCapPct,
    spikeImpulsePct
  );
  const nextPoint = buildStreamPoint(nextStep, nextDd, dailyCapPct, scenario);
  const nextSeries = [...series, nextPoint];
  return nextSeries.length > safeWindow
    ? nextSeries.slice(nextSeries.length - safeWindow)
    : nextSeries;
}

export function summarizeDrawdownStream(
  series: DrawdownStreamPoint[],
  dailyCapPct = 4.0
): DrawdownStreamSummary {
  if (series.length === 0) {
    return {
      currentDdPct: 0,
      peakDdPct: 0,
      headroomPct: Number(dailyCapPct.toFixed(2)),
      equityUsd: STREAM_BASELINE_EQUITY_USD,
      floatingPnlUsd: 0,
      avgHeartbeatMs: 1120,
      latestHeartbeatMs: 1120,
      status: 'nominal',
      latestStep: 0,
    };
  }

  let peakDdPct = 0;
  let heartbeatSum = 0;
  for (const pt of series) {
    if (pt.intradayDrawdownPct > peakDdPct) {
      peakDdPct = pt.intradayDrawdownPct;
    }
    heartbeatSum += pt.heartbeatMs;
  }

  const latest = series[series.length - 1];
  return {
    currentDdPct: latest.intradayDrawdownPct,
    peakDdPct: Number(peakDdPct.toFixed(2)),
    headroomPct: latest.headroomPct,
    equityUsd: latest.equityUsd,
    floatingPnlUsd: latest.floatingPnlUsd,
    avgHeartbeatMs: Math.round(heartbeatSum / series.length),
    latestHeartbeatMs: latest.heartbeatMs,
    status: latest.status,
    latestStep: latest.stepIndex,
  };
}

export function getAnalyticsCopy(lang: Language) {
  if (lang === 'th') {
    return {
      kicker1: 'เดโมวิเคราะห์ข้อมูล MT5 (ชุดข้อมูลตัวอย่าง)',
      kicker2: 'INTERACTIVE TELEMETRY DEMO · SAMPLE DATASET',
      title: 'เดโมวิเคราะห์วินัยความเสี่ยงและบันทึก MT5 เชิงลึก',
      subtitle: 'ตัวอย่างแผนภาพแบบโต้ตอบจากชุดข้อมูลจำลอง 120 ออเดอร์ (Sample Dataset)',
      description:
        'หน้านี้แสดงเดโมการตรวจสอบข้อมูลระดับสถาบันด้วยชุดข้อมูลตัวอย่าง 120 ออเดอร์ พร้อมตารางข้อมูลที่ค้นหาได้ แนวโน้มการถดถอยเชิงเส้น (OLS) และส่งออกไฟล์ CSV ได้ทันที — สำหรับพอร์ตจริงของคุณให้เชื่อมต่อผ่าน TallyNX Desk',
      kpis: [
        {
          value: '120',
          label: 'รายการเทรดในชุดข้อมูลตัวอย่าง',
          delta: 'Sample Dataset · โหมดสาธิตแบบโต้ตอบ',
        },
        {
          value: '90.0%',
          label: 'อัตราการรักษาวินัยในชุดตัวอย่าง',
          delta: '88 รายการอยู่ในกรอบ 100%',
        },
        {
          value: '1,248 ms',
          label: 'เวลาซิงค์จำลองเฉลี่ย',
          delta: 'ต่ำกว่าเกณฑ์ 1,400 ms',
        },
        {
          value: '$0',
          label: 'ยอดทุนหรือรหัสผ่านที่ถูกฝากไว้',
          delta: 'Non-custodial 100%',
        },
      ],
      matrixTitle: 'เมทริกซ์ตรวจสอบ 120 รายการตัวอย่าง (Unit Deal Matrix)',
      matrixDesc:
        'ทุกช่องสี่เหลี่ยมแทน 1 คำสั่งจากชุดข้อมูลตัวอย่าง สลับมุมมองตามสถานะวินัยหรือช่วงตลาด พร้อมตัวกรองแบบโต้ตอบ',
      groupByOutcome: 'แบ่งตามวินัยความเสี่ยง',
      groupBySession: 'แบ่งตามช่วงเวลาตลาด',
      filterAll: 'ทั้งหมด (120)',
      showDataTable: 'ดูตารางตัวเลขประกอบ',
      hideDataTable: 'ซ่อนตารางตัวเลข',
      outcomeLabels: {
        disciplined: 'ในกรอบวินัย (Disciplined)',
        near_limit: 'ใกล้เพดานเตือน (Near Limit)',
        breached: 'แตะเพดานหยุดพัก (Gated)',
        untracked: 'นอกรอบเวลา (Off-Session)',
      } as Record<DealOutcome, string>,
      sessionLabels: {
        London: 'ตลาดลอนดอน (London)',
        Overlap: 'ช่วงซ้อนทับ LDN–NY',
        'New York': 'ตลาดนิวยอร์ก (New York)',
        Asian: 'ตลาดเอเชีย (Asian)',
      } as Record<TradingSessionName, string>,
      waffleTitle: 'สัดส่วนงบขาดทุนรายวัน (10×10 Daily Loss Waffle)',
      waffleDesc:
        'แสดงสัดส่วนงบขาดทุนรายวันที่ใช้ไปแล้วและโซนเตือนล่วงหน้า (Pre-Breach) จากตาราง 100 ช่อง เพื่อหยุดความเสี่ยงก่อนถึงขีดจำกัด',
      presets: {
        conservative: 'เพดาน 2.0%',
        standard: 'มาตรฐาน 4.0%',
        prop: 'กองทุน 5.0%',
      },
      waffleUsed: 'ขาดทุนสะสมจำลอง',
      waffleBuffer: 'โซนเตือนล่วงหน้า',
      waffleAvailable: 'งบความเสี่ยงคงเหลือ',
      scatterTitle: 'ความสัมพันธ์เวลาถือออเดอร์กับ Drawdown (OLS Regression)',
      scatterDesc:
        'คำนวณเส้นแนวโน้มเชิงเส้น (Ordinary Least Squares) จากชุดข้อมูลตัวอย่างเพื่อสาธิตผลกระทบของการถือออเดอร์นานเกินช่วงความผันผวน',
      scatterAll: 'ทุกช่วงตลาด (120)',
      scatterActiveSessions: 'เฉพาะ London + Overlap (74)',
      scatterSlopeLabel: 'ความชัน (Slope)',
      scatterR2Label: 'ค่าสัมประสิทธิ์ R²',
      scatterXAxis: 'ระยะเวลาถือครอง (นาที)',
      scatterYAxis: 'Intraday Drawdown (%)',
      ledgerTitle: 'ตารางตรวจสอบแยกตามคู่เงินและช่วงตลาด (Sample Telemetry Ledger)',
      ledgerDesc:
        'ค้นหาตามคู่เงินหรือช่วงตลาด กรองสถานะ และคลิกหัวตารางเพื่อเรียงลำดับ พร้อมดาวน์โหลด CSV ตัวอย่าง',
      searchPlaceholder: 'ค้นหาคู่เงิน, รหัสชุดข้อมูล หรือช่วงตลาด (เช่น XAUUSD)...',
      statusAll: 'ทุกสถานะ',
      statusNominal: 'ปกติ (Nominal)',
      statusWarning: 'เฝ้าระวัง (Warning)',
      statusGated: 'ล็อกชั่วคราว (Gated)',
      downloadCsv: 'ส่งออก CSV',
      emptyTitle: 'ไม่พบชุดข้อมูลที่ตรงกับตัวกรอง',
      emptyDesc: 'ลองล้างคำค้นหาหรือเปลี่ยนตัวกรองสถานะเพื่อดูข้อมูลทั้งหมด',
      resetFilters: 'ล้างตัวกรองทั้งหมด',
      cols: {
        instrument: 'คู่เงิน / รหัส',
        session: 'ช่วงตลาด',
        dealsCount: 'จำนวนออเดอร์',
        adherencePct: 'วินัย (%)',
        maxDrawdownPct: 'Max DD (%)',
        avgLatencyMs: 'ซิงค์ (ms)',
        netR: 'ผลรวม (R)',
        trend: 'แนวโน้ม R',
        status: 'สถานะ',
      },
      stream: {
        title: 'จำลองความเคลื่อนไหว Drawdown แบบเรียลไทม์ (Recharts Telemetry)',
        desc: 'ติดตามแรงกดดัน Intraday Drawdown เทียบเพดานรายวันและโซนแจ้งเตือน 85% ในหน้าต่างเวลาแบบเลื่อนอัตโนมัติ (จำลองจากจังหวะ MT5 Heartbeat)',
        scenarios: {
          calm: 'ตลาดนิ่ง (Steady)',
          volatile: 'ช่วงข่าวผันผวน',
          breach_test: 'ทดสอบใกล้เพดาน',
        } as Record<SimulationScenarioId, string>,
        pause: 'หยุดชั่วคราว',
        resume: 'เล่นต่อเรียลไทม์',
        injectSpike: 'จำลองสเปรด/ขาดทุนพุ่ง',
        reset: 'รีเซ็ต',
        ddSeriesLabel: 'Intraday Drawdown (%)',
        headroomSeriesLabel: 'งบคงเหลือ (%)',
        capReferenceLabel: 'เพดานรายวัน',
        cautionReferenceLabel: 'เตือน 85%',
        currentDd: 'Drawdown ปัจจุบัน',
        peakDd: 'Drawdown สูงสุดช่วงนี้',
        remainingHeadroom: 'Headroom คงเหลือ',
        simulatedEquity: 'Equity จำลอง',
        heartbeat: 'จังหวะซิงค์',
        gateLabels: {
          nominal: 'ปกติ · Nominal',
          caution: 'เฝ้าระวัง · Caution',
          gated: 'เกตทำงาน · Guard Active',
        } as Record<StreamGateStatus, string>,
      },
    };
  }

  return {
    kicker1: 'INTERACTIVE TELEMETRY DEMO',
    kicker2: 'SAMPLE DATASET · 120 SIMULATED DEALS',
    title: 'Drawdown Discipline & Deal Telemetry Demo',
    subtitle: 'Interactive telemetry demo (sample dataset) built with Recharts and SVG audit instruments',
    description:
      'Explore an interactive telemetry demo powered by a deterministic 120-deal sample dataset: unit outcome matrix, 10×10 daily loss budget waffle, OLS regression scatter plot, and a searchable cohort ledger with CSV export. Connect your real MT5 account inside TallyNX Desk.',
    kpis: [
      {
        value: '120',
        label: 'Sample MT5 Deals (Demo)',
        delta: 'Deterministic demo dataset',
      },
      {
        value: '90.0%',
        label: 'Within Pre-Session Envelope',
        delta: '88 disciplined exits in sample',
      },
      {
        value: '1,248 ms',
        label: 'Simulated Bridge Heartbeat',
        delta: 'Within 1,400 ms SLA budget',
      },
      {
        value: '$0',
        label: 'Custodial Funds Held',
        delta: 'Zero broker credential upload',
      },
    ],
    matrixTitle: '120-Deal Outcome Matrix (Unit Audit)',
    matrixDesc:
      'Each unit square represents one executed MT5 ticket polled locally. Switch grouping mode or filter buckets to inspect where rule drift concentrates.',
    groupByOutcome: 'Group by Adherence',
    groupBySession: 'Group by Session',
    filterAll: 'All (120)',
    showDataTable: 'Show data table',
    hideDataTable: 'Hide data table',
    outcomeLabels: {
      disciplined: 'Disciplined',
      near_limit: 'Near Limit',
      breached: 'Gated Breach',
      untracked: 'Off-Session',
    } as Record<DealOutcome, string>,
    sessionLabels: {
      London: 'London Open',
      Overlap: 'London–NY Overlap',
      'New York': 'New York Session',
      Asian: 'Asian Range',
    } as Record<TradingSessionName, string>,
    waffleTitle: 'Daily Loss Budget Allocation (10×10 Waffle)',
    waffleDesc:
      '100 equal-proportion cells showing realized intraday loss, pre-breach caution buffer, and remaining trading headroom under each daily risk cap.',
    presets: {
      conservative: 'Conservative 2%',
      standard: 'Standard 4%',
      prop: 'Challenge 5%',
    },
    waffleUsed: 'Realized Loss',
    waffleBuffer: 'Caution Buffer',
    waffleAvailable: 'Remaining Headroom',
    scatterTitle: 'Hold Duration vs. Drawdown Drift (OLS Regression)',
    scatterDesc:
      'Live Ordinary Least Squares regression fit quantifying how extended holding periods correlate with intraday drawdown expansion.',
    scatterAll: 'All Sessions (120)',
    scatterActiveSessions: 'London + Overlap (74)',
    scatterSlopeLabel: 'OLS Slope',
    scatterR2Label: 'Fit R²',
    scatterXAxis: 'Holding Duration (minutes)',
    scatterYAxis: 'Intraday Drawdown (%)',
    ledgerTitle: 'Instrument & Session Telemetry Ledger',
    ledgerDesc:
      'Search instruments, segment by gate status, sort any metric column, inspect equity trajectory sparklines, and export clean RFC-4180 CSV.',
    searchPlaceholder: 'Filter symbol, cohort ID, or session (e.g. XAUUSD)...',
    statusAll: 'All Statuses',
    statusNominal: 'Nominal',
    statusWarning: 'Warning',
    statusGated: 'Gated',
    downloadCsv: 'Download CSV',
    emptyTitle: 'No matching telemetry cohorts',
    emptyDesc: 'Adjust your search query or reset status filters to inspect all audited instruments.',
    resetFilters: 'Reset filters',
    cols: {
      instrument: 'Instrument',
      session: 'Session',
      dealsCount: 'Deals',
      adherencePct: 'Adherence',
      maxDrawdownPct: 'Max DD',
      avgLatencyMs: 'Heartbeat',
      netR: 'Net R',
      trend: 'R-Curve',
      status: 'Status',
    },
    stream: {
      title: 'Live Drawdown Drift & Headroom Telemetry (Recharts)',
      desc: 'Sliding-window real-time visualizer plotting simulated intraday drawdown against your daily loss ceiling and 85% pre-breach caution floor.',
      scenarios: {
        calm: 'Steady Session',
        volatile: 'News Volatility',
        breach_test: 'Cap Stress Test',
      } as Record<SimulationScenarioId, string>,
      pause: 'Pause Stream',
      resume: 'Resume Stream',
      injectSpike: 'Simulate Spike',
      reset: 'Reset',
      ddSeriesLabel: 'Intraday Drawdown (%)',
      headroomSeriesLabel: 'Remaining Headroom (%)',
      capReferenceLabel: 'Daily Cap',
      cautionReferenceLabel: '85% Caution',
      currentDd: 'Current Drawdown',
      peakDd: 'Window Peak DD',
      remainingHeadroom: 'Daily Headroom',
      simulatedEquity: 'Simulated Equity',
      heartbeat: 'Poll Latency',
      gateLabels: {
        nominal: 'Nominal',
        caution: 'Caution Zone',
        gated: 'Guard Active',
      } as Record<StreamGateStatus, string>,
    },
  };
}
