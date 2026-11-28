import type { Language } from './i18n';

export type OnboardingGoalMode = 'prop' | 'personal';
export type TradingSymbol = 'XAUUSD' | 'EURUSD' | 'NAS100';
export type ConnectionTierId = 'xlsx' | 'cloud' | 'ex5';
export type CloudProviderId = 'fundednext_mcp' | 'myfxbook';
export type ConsistencyStatus = 'SAFE' | 'NEAR_CAP' | 'BREACH';
export type PropFirmPresetId = 'ftmo' | 'fundednext' | 'the5ers' | 'personal';
export type LinkedDeskScreenId = 'analysis' | 'chart' | 'calc' | 'gate';
export type DeskPage = LinkedDeskScreenId | 'journal' | 'market' | 'proprules';

interface DeskHandoffOptions {
  lang?: Language;
  theme?: 'light' | 'dark';
  page?: DeskPage;
  step?: number;
  via?: ConnectionTierId;
  source?: string;
}

export interface PropFirmPreset {
  id: PropFirmPresetId;
  labelEn: string;
  labelTh: string;
  mode: OnboardingGoalMode;
  dailyDdLimitPct: number;
  riskPct: number;
  badgeEn: string;
  badgeTh: string;
}

export const PROP_FIRM_PRESETS: PropFirmPreset[] = [
  {
    id: 'fundednext',
    labelEn: 'FundedNext',
    labelTh: 'FundedNext',
    mode: 'prop',
    dailyDdLimitPct: 4.0,
    riskPct: 1.0,
    badgeEn: '4% Daily DD · 40% Cap',
    badgeTh: 'Daily DD 4% · เพดาน 40%',
  },
  {
    id: 'ftmo',
    labelEn: 'FTMO',
    labelTh: 'FTMO',
    mode: 'prop',
    dailyDdLimitPct: 5.0,
    riskPct: 1.0,
    badgeEn: '5% Daily DD · 10% Max',
    badgeTh: 'Daily DD 5% · Max 10%',
  },
  {
    id: 'the5ers',
    labelEn: 'The5%ers',
    labelTh: 'The5%ers',
    mode: 'prop',
    dailyDdLimitPct: 3.0,
    riskPct: 0.5,
    badgeEn: '3% Daily Pause · High Stakes',
    badgeTh: 'พักเมื่อ Daily DD ถึง 3% · High Stakes',
  },
  {
    id: 'personal',
    labelEn: 'Personal Capital',
    labelTh: 'พอร์ตส่วนตัว',
    mode: 'personal',
    dailyDdLimitPct: 5.0,
    riskPct: 1.0,
    badgeEn: '5% Buffer · No 40% Cap',
    badgeTh: 'งบวันละ 5% · ไม่ติดกฎ 40%',
  },
];

export function applyPropFirmPreset(
  current: OnboardingTransferState,
  presetId: PropFirmPresetId
): OnboardingTransferState {
  const preset =
    PROP_FIRM_PRESETS.find((item) => item.id === presetId) ?? PROP_FIRM_PRESETS[0];
  return clampTransferState({
    ...current,
    mode: preset.mode,
    dailyDdLimitPct: preset.dailyDdLimitPct,
    riskPct: preset.riskPct,
  });
}

export function detectActivePropFirmPreset(
  state: OnboardingTransferState
): PropFirmPresetId | null {
  if (state.mode === 'personal') {
    return 'personal';
  }
  const match = PROP_FIRM_PRESETS.find(
    (p) =>
      p.mode === 'prop' &&
      Math.abs(p.dailyDdLimitPct - state.dailyDdLimitPct) < 0.05
  );
  return match ? match.id : null;
}

export function mapEngineCodeToDeskScreen(code: string): LinkedDeskScreenId {
  const prefix = code.trim().slice(0, 2);
  switch (prefix) {
    case '01':
      return 'calc';
    case '02':
      return 'analysis';
    case '03':
      return 'gate';
    case '04':
      return 'chart';
    case '05':
    default:
      return 'analysis';
  }
}

export interface OnboardingTransferState {
  accountSize: number;
  riskPct: number;
  slPips: number;
  symbol: TradingSymbol;
  mode: OnboardingGoalMode;
  dailyDdLimitPct: number;
  simulatedDaySharePct: number;
  connectedVia?: ConnectionTierId;
  updatedAt?: number;
}

export interface ThreeTpTargetStep {
  id: 'TP1' | 'TP2' | 'TP3';
  rMultiple: number;
  closePct: number;
  lots: number;
  profitUsd: number;
  ruleNoteEn: string;
  ruleNoteTh: string;
}

export interface ThreeTpPlanResult {
  riskUsd: number;
  totalLots: number;
  blendedR: number;
  fullWinUsd: number;
  dailyDdLimitUsd: number;
  tradesBeforeDailyFloor: number;
  consistencySharePct: number;
  consistencyCapPct: number;
  consistencyStatus: ConsistencyStatus;
  targets: ThreeTpTargetStep[];
}

export const ONBOARDING_STORAGE_KEY = 'tallynx.onboarding.state';

export const DEFAULT_TRANSFER_STATE: OnboardingTransferState = {
  accountSize: 10000,
  riskPct: 1.0,
  slPips: 25,
  symbol: 'XAUUSD',
  mode: 'prop',
  dailyDdLimitPct: 4.0,
  simulatedDaySharePct: 28,
};

const PIP_VALUE_PER_STANDARD_LOT: Record<TradingSymbol, number> = {
  XAUUSD: 10,
  EURUSD: 10,
  NAS100: 1,
};

export function createDefaultTransferState(): OnboardingTransferState {
  return { ...DEFAULT_TRANSFER_STATE };
}

export function clampTransferState(
  raw: Partial<OnboardingTransferState>
): OnboardingTransferState {
  const mode: OnboardingGoalMode = raw.mode === 'personal' ? 'personal' : 'prop';
  const symbol: TradingSymbol =
    raw.symbol === 'EURUSD' || raw.symbol === 'NAS100' ? raw.symbol : 'XAUUSD';

  const accountSize =
    typeof raw.accountSize === 'number' && Number.isFinite(raw.accountSize)
      ? Math.min(2000000, Math.max(500, Math.round(raw.accountSize)))
      : DEFAULT_TRANSFER_STATE.accountSize;

  const riskPct =
    typeof raw.riskPct === 'number' && Number.isFinite(raw.riskPct)
      ? Math.min(5, Math.max(0.25, Math.round(raw.riskPct * 100) / 100))
      : DEFAULT_TRANSFER_STATE.riskPct;

  const slPips =
    typeof raw.slPips === 'number' && Number.isFinite(raw.slPips)
      ? Math.min(500, Math.max(5, Math.round(raw.slPips)))
      : DEFAULT_TRANSFER_STATE.slPips;

  const dailyDdLimitPct =
    typeof raw.dailyDdLimitPct === 'number' && Number.isFinite(raw.dailyDdLimitPct)
      ? Math.min(12, Math.max(1, Math.round(raw.dailyDdLimitPct * 10) / 10))
      : mode === 'prop'
        ? 4.0
        : 5.0;

  const simulatedDaySharePct =
    typeof raw.simulatedDaySharePct === 'number' &&
    Number.isFinite(raw.simulatedDaySharePct)
      ? Math.min(85, Math.max(5, Math.round(raw.simulatedDaySharePct)))
      : DEFAULT_TRANSFER_STATE.simulatedDaySharePct;

  const connectedVia: ConnectionTierId | undefined =
    raw.connectedVia === 'xlsx' ||
    raw.connectedVia === 'cloud' ||
    raw.connectedVia === 'ex5'
      ? raw.connectedVia
      : undefined;

  return {
    accountSize,
    riskPct,
    slPips,
    symbol,
    mode,
    dailyDdLimitPct,
    simulatedDaySharePct,
    ...(connectedVia ? { connectedVia } : {}),
    ...(typeof raw.updatedAt === 'number' ? { updatedAt: raw.updatedAt } : {}),
  };
}

/**
 * Pure 3-TP Ladder + Consistency Rule 40% calculation used in Step 1 Live Sandbox & Desk handoff.
 */
export function calculateThreeTpLadderPlan(
  input: OnboardingTransferState
): ThreeTpPlanResult {
  const safe = clampTransferState(input);
  const riskUsd = Math.round(safe.accountSize * (safe.riskPct / 100) * 100) / 100;
  const pipVal = PIP_VALUE_PER_STANDARD_LOT[safe.symbol];
  const rawLots = riskUsd / (safe.slPips * pipVal);
  const totalLots = Math.max(0.01, Math.round(rawLots * 100) / 100);

  const tp1Lot = Math.max(0.01, Math.round(totalLots * 0.4 * 100) / 100);
  const tp2Lot = Math.max(0.01, Math.round(totalLots * 0.35 * 100) / 100);
  const tp3Lot = Math.max(
    0.01,
    Math.round(Math.max(0.01, totalLots - tp1Lot - tp2Lot) * 100) / 100
  );

  const tp1Usd = Math.round(riskUsd * 1.0 * 0.4 * 100) / 100;
  const tp2Usd = Math.round(riskUsd * 2.0 * 0.35 * 100) / 100;
  const tp3Usd = Math.round(riskUsd * 3.5 * 0.25 * 100) / 100;
  const fullWinUsd = Math.round((tp1Usd + tp2Usd + tp3Usd) * 100) / 100;
  const blendedR = Math.round((fullWinUsd / Math.max(1, riskUsd)) * 100) / 100;

  const dailyDdLimitUsd =
    Math.round(safe.accountSize * (safe.dailyDdLimitPct / 100) * 100) / 100;
  const tradesBeforeDailyFloor = Math.max(
    1,
    Math.floor(safe.dailyDdLimitPct / Math.max(0.25, safe.riskPct))
  );

  const consistencyCapPct = 40;
  const consistencySharePct = safe.simulatedDaySharePct;
  let consistencyStatus: ConsistencyStatus = 'SAFE';
  if (safe.mode === 'prop') {
    if (consistencySharePct >= consistencyCapPct) {
      consistencyStatus = 'BREACH';
    } else if (consistencySharePct >= 34) {
      consistencyStatus = 'NEAR_CAP';
    }
  } else {
    if (consistencySharePct >= 55) {
      consistencyStatus = 'NEAR_CAP';
    }
  }

  const targets: ThreeTpTargetStep[] = [
    {
      id: 'TP1',
      rMultiple: 1.0,
      closePct: 40,
      lots: tp1Lot,
      profitUsd: tp1Usd,
      ruleNoteEn: 'Lock 40% gain · Move SL to Breakeven',
      ruleNoteTh: 'เก็บกำไร 40% แรก · เลื่อน SL บังหน้าทุนทันที',
    },
    {
      id: 'TP2',
      rMultiple: 2.0,
      closePct: 35,
      lots: tp2Lot,
      profitUsd: tp2Usd,
      ruleNoteEn: 'Scale 35% at liquidity target',
      ruleNoteTh: 'แบ่งปิดอีก 35% ที่แนวรับ/ต้านสำคัญ',
    },
    {
      id: 'TP3',
      rMultiple: 3.5,
      closePct: 25,
      lots: tp3Lot,
      profitUsd: tp3Usd,
      ruleNoteEn: 'Trail final 25% trend runner',
      ruleNoteTh: 'ปล่อย 25% สุดท้ายรันตามเทรนด์',
    },
  ];

  return {
    riskUsd,
    totalLots,
    blendedR,
    fullWinUsd,
    dailyDdLimitUsd,
    tradesBeforeDailyFloor,
    consistencySharePct,
    consistencyCapPct,
    consistencyStatus,
    targets,
  };
}

/**
 * Adds view preferences and optional sandbox values to an absolute Desk URL or a local onboarding path.
 */
export function buildDeskHandoffUrl(
  baseUrl: string,
  state?: OnboardingTransferState,
  extras: DeskHandoffOptions = {},
): string {
  const hashIndex = baseUrl.indexOf('#');
  const hash = hashIndex < 0 ? '' : baseUrl.slice(hashIndex);
  const pathAndSearch = hashIndex < 0 ? baseUrl : baseUrl.slice(0, hashIndex);
  const queryIndex = pathAndSearch.indexOf('?');
  const path = queryIndex < 0 ? pathAndSearch : pathAndSearch.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex < 0 ? '' : pathAndSearch.slice(queryIndex + 1));

  if (extras.lang) params.set('lang', extras.lang);
  if (extras.theme) params.set('theme', extras.theme);
  if (extras.page) params.set('page', extras.page);

  if (state) {
    const safe = clampTransferState(state);
    params.set('balance', String(safe.accountSize));
    params.set('risk_pct', String(safe.riskPct));
    params.set('sl_pips', String(safe.slPips));
    params.set('symbol', safe.symbol);
    params.set('mode', safe.mode);
    params.set('daily_dd', String(safe.dailyDdLimitPct));
    params.set('consistency_cap', '40');
    params.set('day_share', String(safe.simulatedDaySharePct));
    params.set('source', extras.source || 'tallynx_sandbox');
    const via = extras.via ?? safe.connectedVia;
    if (via) params.set('connected_via', via);
  }
  if (typeof extras.step === 'number') {
    params.set('step', String(extras.step));
  }

  const search = params.toString();
  return path + (search ? `?${search}` : '') + hash;
}

/**
 * Parses URL query string back into a validated OnboardingTransferState.
 */
export function parseTransferStateFromSearch(
  search: string,
  fallback: OnboardingTransferState = DEFAULT_TRANSFER_STATE
): { state: OnboardingTransferState; hasTransferredParams: boolean } {
  if (!search) {
    return { state: clampTransferState(fallback), hasTransferredParams: false };
  }
  const cleaned = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(cleaned);

  const hasAny =
    params.has('balance') ||
    params.has('risk_pct') ||
    params.has('mode') ||
    params.has('symbol');

  if (!hasAny) {
    return { state: clampTransferState(fallback), hasTransferredParams: false };
  }

  const parsedBalance = Number(params.get('balance'));
  const parsedRisk = Number(params.get('risk_pct'));
  const parsedSl = Number(params.get('sl_pips'));
  const parsedDailyDd = Number(params.get('daily_dd'));
  const parsedShare = Number(params.get('day_share'));
  const rawMode = params.get('mode');
  const rawSymbol = params.get('symbol');
  const rawVia = params.get('connected_via');

  const next = clampTransferState({
    accountSize: Number.isFinite(parsedBalance) && parsedBalance > 0 ? parsedBalance : fallback.accountSize,
    riskPct: Number.isFinite(parsedRisk) && parsedRisk > 0 ? parsedRisk : fallback.riskPct,
    slPips: Number.isFinite(parsedSl) && parsedSl > 0 ? parsedSl : fallback.slPips,
    dailyDdLimitPct:
      Number.isFinite(parsedDailyDd) && parsedDailyDd > 0
        ? parsedDailyDd
        : fallback.dailyDdLimitPct,
    simulatedDaySharePct:
      Number.isFinite(parsedShare) && parsedShare > 0
        ? parsedShare
        : fallback.simulatedDaySharePct,
    mode: rawMode === 'personal' ? 'personal' : rawMode === 'prop' ? 'prop' : fallback.mode,
    symbol:
      rawSymbol === 'EURUSD' || rawSymbol === 'NAS100' || rawSymbol === 'XAUUSD'
        ? rawSymbol
        : fallback.symbol,
    connectedVia:
      rawVia === 'xlsx' || rawVia === 'cloud' || rawVia === 'ex5'
        ? rawVia
        : fallback.connectedVia,
  });

  return { state: next, hasTransferredParams: true };
}

export function persistOnboardingTransferState(
  state: OnboardingTransferState
): OnboardingTransferState {
  const normalized = clampTransferState({ ...state, updatedAt: Date.now() });
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage quota / privacy mode failures
    }
  }
  return normalized;
}

export function readOnboardingTransferState(): OnboardingTransferState {
  if (typeof window === 'undefined') {
    return createDefaultTransferState();
  }
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return createDefaultTransferState();
    const parsed = JSON.parse(raw) as Partial<OnboardingTransferState>;
    return clampTransferState(parsed);
  } catch {
    return createDefaultTransferState();
  }
}

export {
  MT5_BRIDGE_DOWNLOAD_FILENAME,
  MT5_BRIDGE_EX5_URL,
  MT5_BRIDGE_MQ5_URL,
  MT5_BRIDGE_PING_URL,
  TWELVE_GATE_ITEMS,
  buildSevenDaySummaryFromPositions,
  evaluateTwelveGateReadiness,
  getSevenDayHealthSummary,
  playSoftChime,
  type SevenDayDayBar,
  type SevenDayHealthSummary,
  type TwelveGateChecklistItem,
} from './onboardingStepsLogic';
