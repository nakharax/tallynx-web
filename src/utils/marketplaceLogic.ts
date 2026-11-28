import type { Language } from './i18n';
import {
  ENGINE_LABELS,
  VERIFICATION_LABELS,
  type DeskEngineType,
  type VerificationMethod,
} from './landingSpotlightData';

export { ENGINE_LABELS, VERIFICATION_LABELS, type DeskEngineType, type VerificationMethod };

export type DeskCategory =
  | 'all'
  | 'prop-challenge'
  | 'discretionary'
  | 'algorithmic'
  | 'custom-engine';

export type MarketplaceSortKey =
  | 'featured'
  | 'profit-factor'
  | 'lowest-dd'
  | 'price-asc';

export interface VerifiedDealSample {
  ticket: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  rMultiple: number;
  drawdownPct: number;
  closedAt: string;
}

export interface DeskIdeaItem {
  id: string;
  title: string;
  creatorHandle: string;
  creatorRole: string;
  engineType: DeskEngineType;
  engineLabel: string;
  category: Exclude<DeskCategory, 'all'>;
  verificationMethod: VerificationMethod;
  verificationProof: {
    accountMask: string;
    brokerServer: string;
    ledgerHash: string;
    verifiedDealsCount: number;
    trackingWindowDays: number;
    lastSyncedAt: string;
  };
  metrics: {
    maxDrawdownPct: number;
    winRatePct: number;
    profitFactor: number;
    consistencyScorePct: number;
    expectancyR: number;
  };
  priceUsd: number;
  licensesIssued: number;
  summary: string;
  summaryTh: string;
  includedRules: string[];
  sampleDeals: VerifiedDealSample[];
}

export interface MarketplaceFilterOptions {
  query: string;
  category: DeskCategory;
  verificationMethod: 'all' | VerificationMethod;
  sortKey: MarketplaceSortKey;
}

export interface NewDeskSubmissionInput {
  title: string;
  creatorHandle: string;
  engineType: DeskEngineType;
  category: Exclude<DeskCategory, 'all'>;
  verificationMethod: VerificationMethod;
  accountOrHashRef: string;
  brokerServer: string;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  priceUsd: number;
  summary: string;
}

export const DESK_IDEAS_CATALOG: DeskIdeaItem[] = [
  {
    id: 'idea-ghr-prop-shield',
    title: 'London Open Gold 40%-Cap Prop Desk',
    creatorHandle: '@kavin.quant',
    creatorRole: 'Sample Blueprint Author',
    engineType: 'ghr-v32',
    engineLabel: ENGINE_LABELS['ghr-v32'],
    category: 'prop-challenge',
    verificationMethod: 'cloud-api-sync',
    verificationProof: {
      accountMask: 'Sample · MCP #8849••15',
      brokerServer: 'FundedNext-MCP-ReadOnly',
      ledgerHash: 'sample-blueprint:ghr-prop-shield',
      verifiedDealsCount: 184,
      trackingWindowDays: 92,
      lastSyncedAt: 'Sample Blueprint Reference',
    },
    metrics: {
      maxDrawdownPct: 2.35,
      winRatePct: 61.4,
      profitFactor: 2.28,
      consistencyScorePct: 24.8,
      expectancyR: 0.74,
    },
    priceUsd: 49,
    licensesIssued: 142,
    summary:
      'Complete 3-TP ladder rulebook calibrated for XAUUSD London open volatility. Enforces a 1.5% daily risk cap and automatic 15-minute cooldown after Stop-Loss.',
    summaryTh:
      'ชุดตั้งค่าโต๊ะเทรด 3-TP สำหรับทองคำช่วงเปิดตลาดลอนดอน คุมความเสี่ยงรายวันไม่เกิน 1.5% และตรวจกฎ Consistency ไม่เกิน 40% (ตัวอย่างโครงสร้างโต๊ะเทรด)',
    includedRules: [
      '3-TP split (40% / 35% / 25%) with auto-breakeven shift after TP1',
      'Hard 40% single-day profit ceiling guard for Prop Evaluations',
      '12-Gate pre-session checklist + 15m SL tilt lockout',
    ],
    sampleDeals: [
      {
        ticket: '#9481023',
        symbol: 'XAUUSD',
        side: 'BUY',
        rMultiple: 1.85,
        drawdownPct: 0.42,
        closedAt: '2026-11-13 09:48 UTC',
      },
      {
        ticket: '#9480971',
        symbol: 'XAUUSD',
        side: 'SELL',
        rMultiple: -0.65,
        drawdownPct: 0.65,
        closedAt: '2026-11-12 08:19 UTC',
      },
      {
        ticket: '#9480890',
        symbol: 'XAUUSD',
        side: 'BUY',
        rMultiple: 2.15,
        drawdownPct: 0.31,
        closedAt: '2026-11-11 10:05 UTC',
      },
    ],
  },
  {
    id: 'idea-ny-index-custom',
    title: 'NY Killzone US100 Asymmetric Session Desk',
    creatorHandle: '@nina.flow',
    creatorRole: 'Index Discretionary Strategist',
    engineType: 'custom-desk',
    engineLabel: ENGINE_LABELS['custom-desk'],
    category: 'custom-engine',
    verificationMethod: 'xlsx-sha256',
    verificationProof: {
      accountMask: 'Sample · MT5 #7104••88',
      brokerServer: 'PrimeECN-Real02',
      ledgerHash: 'sample-blueprint:ny-index-custom',
      verifiedDealsCount: 126,
      trackingWindowDays: 75,
      lastSyncedAt: 'Sample Blueprint Reference',
    },
    metrics: {
      maxDrawdownPct: 3.1,
      winRatePct: 54.0,
      profitFactor: 2.04,
      consistencyScorePct: 28.5,
      expectancyR: 0.68,
    },
    priceUsd: 69,
    licensesIssued: 89,
    summary:
      'Custom session layout engineered for the first 90 minutes of New York equities open. Designed for SHA-256 hashed broker .xlsx statement audits.',
    summaryTh:
      'โครงสร้างโต๊ะเทรดอิสระ (Custom Desk) สำหรับช่วงเปิดตลาด New York 90 นาทีแรกบน US100 ออกแบบสำหรับตรวจยืนยันผ่านไฟล์ .xlsx โบรเกอร์ที่เข้ารหัสแฮช',
    includedRules: [
      'Custom 2-stage NY Cash Open liquidity sweep risk envelope',
      'Spread spike circuit breaker above 2.2 pts on NAS100',
      'Max 2 consecutive losses per NY session hard stop',
    ],
    sampleDeals: [
      {
        ticket: '#7120419',
        symbol: 'US100',
        side: 'BUY',
        rMultiple: 2.4,
        drawdownPct: 0.55,
        closedAt: '2026-11-13 15:12 UTC',
      },
      {
        ticket: '#7120312',
        symbol: 'US100',
        side: 'SELL',
        rMultiple: 1.15,
        drawdownPct: 0.38,
        closedAt: '2026-11-12 14:47 UTC',
      },
    ],
  },
  {
    id: 'idea-ea-drawdown-sentinel',
    title: 'Multi-Pair EA Equity Corridor & News Pause',
    creatorHandle: '@tanakorn.sys',
    creatorRole: 'Algorithmic Systems Architect',
    engineType: 'ea-guard',
    engineLabel: ENGINE_LABELS['ea-guard'],
    category: 'algorithmic',
    verificationMethod: 'ea-local-bridge',
    verificationProof: {
      accountMask: 'Sample · Bridge #6032••41',
      brokerServer: 'VantageRaw-Live07',
      ledgerHash: 'sample-blueprint:ea-drawdown-sentinel',
      verifiedDealsCount: 312,
      trackingWindowDays: 140,
      lastSyncedAt: 'Sample Blueprint Reference',
    },
    metrics: {
      maxDrawdownPct: 1.85,
      winRatePct: 68.2,
      profitFactor: 1.92,
      consistencyScorePct: 19.2,
      expectancyR: 0.44,
    },
    priceUsd: 89,
    licensesIssued: 64,
    summary:
      'Coexists silently with automated MQL5 Expert Advisors via Live Bridge (.ex5). Tracks basket floating equity exposure across EURUSD, GBPUSD, and USDJPY locally.',
    summaryTh:
      'โต๊ะคุมความเสี่ยงสำหรับสายรัน EA หลายคู่เงินผ่าน Live Bridge (.ex5) วัดค่า Floating Basket Equity บนเครื่องพร้อมกติกาแจ้งเตือนก่อนข่าวแรง',
    includedRules: [
      'Multi-symbol correlated exposure ceiling (max 1.8% basket float)',
      'Zero magic-number interference — strictly read-only telemetry layer',
      'Automated FOMC / CPI spread widening audit threshold',
    ],
    sampleDeals: [
      {
        ticket: '#5190811',
        symbol: 'EURUSD',
        side: 'SELL',
        rMultiple: 1.2,
        drawdownPct: 0.19,
        closedAt: '2026-11-14 03:20 UTC',
      },
      {
        ticket: '#5190774',
        symbol: 'GBPUSD',
        side: 'BUY',
        rMultiple: 0.95,
        drawdownPct: 0.24,
        closedAt: '2026-11-13 11:15 UTC',
      },
    ],
  },
  {
    id: 'idea-macro-4tp-swing',
    title: 'Macro 4-TP Currency Swing & Weekly Guard',
    creatorHandle: '@serena.fx',
    creatorRole: 'Portfolio Desk Lead',
    engineType: 'macro-playbook',
    engineLabel: ENGINE_LABELS['macro-playbook'],
    category: 'discretionary',
    verificationMethod: 'cloud-api-sync',
    verificationProof: {
      accountMask: 'Sample · Cloud #9011••09',
      brokerServer: 'Myfxbook-ReadOnly-API',
      ledgerHash: 'sample-blueprint:macro-4tp-swing',
      verifiedDealsCount: 94,
      trackingWindowDays: 120,
      lastSyncedAt: 'Sample Blueprint Reference',
    },
    metrics: {
      maxDrawdownPct: 2.75,
      winRatePct: 48.9,
      profitFactor: 2.64,
      consistencyScorePct: 31.4,
      expectancyR: 1.05,
    },
    priceUsd: 0,
    licensesIssued: 318,
    summary:
      'Open community 4-TP scaling playbook for H4/D1 macro trends. Designed for Official Cloud API read-only sync — free to inspect and load into TallyNX Desk.',
    summaryTh:
      'แผนเทรดสวิง 4-TP ระดับ H4/D1 สำหรับชุมชนเทรดเดอร์ รองรับการซิงก์ผ่าน Cloud API ทางการแบบอ่านอย่างเดียว เปิดดูและนำไปปรับใช้กับ TallyNX Desk ได้ฟรี',
    includedRules: [
      '4-TP scaling matrix (25% / 25% / 25% / 25% runner)',
      'Weekly cumulative drawdown ceiling of 3.5% with weekend gap check',
      'Non-custodial blueprint config ready for TallyNX Desk',
    ],
    sampleDeals: [
      {
        ticket: '#8304412',
        symbol: 'USDJPY',
        side: 'BUY',
        rMultiple: 3.4,
        drawdownPct: 0.62,
        closedAt: '2026-11-12 18:00 UTC',
      },
      {
        ticket: '#8304390',
        symbol: 'EURJPY',
        side: 'BUY',
        rMultiple: 1.9,
        drawdownPct: 0.48,
        closedAt: '2026-11-10 09:30 UTC',
      },
    ],
  },
  {
    id: 'idea-asian-range-reversion',
    title: 'Asian Session Mean-Reversion Tight Stop Desk',
    creatorHandle: '@haruto.desk',
    creatorRole: 'Intraday Quantitative Trader',
    engineType: 'ghr-v32',
    engineLabel: ENGINE_LABELS['ghr-v32'],
    category: 'prop-challenge',
    verificationMethod: 'ea-local-bridge',
    verificationProof: {
      accountMask: 'Sample · Bridge #4482••37',
      brokerServer: 'TitanFX-Live03',
      ledgerHash: 'sample-blueprint:asian-range-reversion',
      verifiedDealsCount: 208,
      trackingWindowDays: 84,
      lastSyncedAt: 'Sample Blueprint Reference',
    },
    metrics: {
      maxDrawdownPct: 1.45,
      winRatePct: 64.9,
      profitFactor: 2.12,
      consistencyScorePct: 21.0,
      expectancyR: 0.52,
    },
    priceUsd: 35,
    licensesIssued: 117,
    summary:
      'Low-drawdown AUDNZD & EURCHF Tokyo session desk rulebook built for 2-step prop challenges without overnight swap exposure.',
    summaryTh:
      'โต๊ะเทรดช่วงตลาดเอเชียเน้น Drawdown ต่ำ (ตัวอย่าง 1.45%) สำหรับกฎ Prop Firm แบบ 2 ขั้นตอนโดยไม่ถือข้ามคืน',
    includedRules: [
      'Flat-before-Frankfurt session cutoff timer',
      '0.35% risk per trade micro-sizing ladder',
      'Automatic rollover spread-filter gate',
    ],
    sampleDeals: [
      {
        ticket: '#4482910',
        symbol: 'AUDNZD',
        side: 'SELL',
        rMultiple: 1.4,
        drawdownPct: 0.21,
        closedAt: '2026-11-14 04:40 UTC',
      },
    ],
  },
  {
    id: 'idea-personal-compounder',
    title: 'Personal Capital Weekly Compounder Desk',
    creatorHandle: '@arisa.risk',
    creatorRole: 'Independent Risk Engineer',
    engineType: 'custom-desk',
    engineLabel: ENGINE_LABELS['custom-desk'],
    category: 'discretionary',
    verificationMethod: 'xlsx-sha256',
    verificationProof: {
      accountMask: 'Sample · MT5 #3198••62',
      brokerServer: 'ICMarketsSC-Live09',
      ledgerHash: 'sample-blueprint:personal-compounder',
      verifiedDealsCount: 152,
      trackingWindowDays: 110,
      lastSyncedAt: 'Sample Blueprint Reference',
    },
    metrics: {
      maxDrawdownPct: 3.6,
      winRatePct: 57.2,
      profitFactor: 2.35,
      consistencyScorePct: 26.4,
      expectancyR: 0.81,
    },
    priceUsd: 29,
    licensesIssued: 76,
    summary:
      'Designed specifically for personal live accounts (non-prop) with dynamic weekly profit step-down protection and post-win size scaling.',
    summaryTh:
      'ออกแบบมาสำหรับพอร์ตเงินทุนส่วนตัวโดยเฉพาะ มีระบบล็อกกำไรรายสัปดาห์และปรับขนาด Lot ตามความสม่ำเสมอ',
    includedRules: [
      'Weekly profit trailing protection floor (retains 65% of weekly gains)',
      'Personal mode toggle without artificial prop day-count pressure',
      'Ready for .xlsx broker audit ledger import in TallyNX Desk',
    ],
    sampleDeals: [
      {
        ticket: '#3198204',
        symbol: 'GBPUSD',
        side: 'BUY',
        rMultiple: 2.05,
        drawdownPct: 0.44,
        closedAt: '2026-11-13 13:18 UTC',
      },
    ],
  },
];

export function filterAndSortDeskIdeas(
  items: DeskIdeaItem[],
  options: MarketplaceFilterOptions
): DeskIdeaItem[] {
  const q = options.query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (options.category !== 'all' && item.category !== options.category) {
      return false;
    }
    if (
      options.verificationMethod !== 'all' &&
      item.verificationMethod !== options.verificationMethod
    ) {
      return false;
    }
    if (q) {
      const haystack = [
        item.title,
        item.creatorHandle,
        item.engineLabel,
        item.summary,
        item.summaryTh,
        item.verificationProof.brokerServer,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (options.sortKey) {
    case 'profit-factor':
      sorted.sort((a, b) => b.metrics.profitFactor - a.metrics.profitFactor);
      break;
    case 'lowest-dd':
      sorted.sort((a, b) => a.metrics.maxDrawdownPct - b.metrics.maxDrawdownPct);
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.priceUsd - b.priceUsd);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => b.licensesIssued - a.licensesIssued);
      break;
  }

  return sorted;
}

export function validateDeskSubmission(
  input: NewDeskSubmissionInput,
  lang: Language = 'en'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 4) {
    errors.push(
      lang === 'th'
        ? 'กรุณาระบุชื่อ Blueprint อย่างน้อย 4 ตัวอักษร'
        : 'Blueprint title must be at least 4 characters.'
    );
  }
  if (!input.creatorHandle || input.creatorHandle.trim().length < 2) {
    errors.push(
      lang === 'th'
        ? 'กรุณาระบุชื่อผู้สร้าง (เช่น @trader.handle)'
        : 'Creator handle is required.'
    );
  }
  if (!input.accountOrHashRef || input.accountOrHashRef.trim().length < 6) {
    errors.push(
      lang === 'th'
        ? 'ต้องระบุข้อมูลอ้างอิงช่องทางซิงก์ (Live Bridge ID, Cloud API ID หรือแฮช .xlsx อย่างน้อย 6 ตัวอักษร)'
        : 'Verification channel reference (Live Bridge ID, Cloud API ID, or .xlsx hash, min 6 chars) is required.'
    );
  }
  if (!input.brokerServer || input.brokerServer.trim().length < 3) {
    errors.push(
      lang === 'th'
        ? 'กรุณาระบุชื่อโบรเกอร์หรือแหล่งซิงก์'
        : 'Broker server or sync provider name is required.'
    );
  }
  if (
    !Number.isFinite(input.maxDrawdownPct) ||
    input.maxDrawdownPct <= 0 ||
    input.maxDrawdownPct > 25
  ) {
    errors.push(
      lang === 'th'
        ? 'Max Drawdown เป้าหมายต้องอยู่ระหว่าง 0.1% ถึง 25%'
        : 'Target Max Drawdown must be between 0.1% and 25%.'
    );
  }
  if (
    !Number.isFinite(input.winRatePct) ||
    input.winRatePct <= 0 ||
    input.winRatePct > 99
  ) {
    errors.push(
      lang === 'th'
        ? 'Win Rate อ้างอิงต้องอยู่ระหว่าง 1% ถึง 99%'
        : 'Reference Win Rate must be between 1% and 99%.'
    );
  }
  if (!Number.isFinite(input.profitFactor) || input.profitFactor <= 0.1) {
    errors.push(
      lang === 'th'
        ? 'Profit Factor ต้องมากกว่า 0.1'
        : 'Profit Factor must be greater than 0.1.'
    );
  }
  if (!Number.isFinite(input.priceUsd) || input.priceUsd < 0) {
    errors.push(
      lang === 'th'
        ? 'ราคาต้องไม่ต่ำกว่า $0'
        : 'Reference price cannot be negative.'
    );
  }
  if (!input.summary || input.summary.trim().length < 12) {
    errors.push(
      lang === 'th'
        ? 'กรุณาอธิบายกติกาและโครงสร้างโต๊ะเทรดอย่างน้อย 12 ตัวอักษร'
        : 'Strategy & risk-desk summary must be at least 12 characters.'
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Creates a local unverified draft blueprint preview without fabricating cryptographic hashes or synthetic trade deals.
 * Real cryptographic verification and publishing occur inside TallyNX Desk.
 */
export function createVerifiedDeskIdea(
  input: NewDeskSubmissionInput,
  existingCount: number
): DeskIdeaItem {
  const cleanHandle = input.creatorHandle.trim().startsWith('@')
    ? input.creatorHandle.trim()
    : `@${input.creatorHandle.trim()}`;
  const cleanRef = input.accountOrHashRef.trim();
  const maskedAccount =
    cleanRef.length >= 6
      ? `Draft Ref #${cleanRef.slice(0, 4)}••${cleanRef.slice(-2)}`
      : `Draft Ref #${cleanRef}`;

  return {
    id: `draft-blueprint-${existingCount + 1}`,
    title: input.title.trim(),
    creatorHandle: cleanHandle,
    creatorRole: 'Local Draft (Unverified — Verify in TallyNX Desk)',
    engineType: input.engineType,
    engineLabel: ENGINE_LABELS[input.engineType],
    category: input.category,
    verificationMethod: input.verificationMethod,
    verificationProof: {
      accountMask: maskedAccount,
      brokerServer: input.brokerServer.trim(),
      ledgerHash: 'pending-desk-verification',
      verifiedDealsCount: 0,
      trackingWindowDays: 0,
      lastSyncedAt: 'Pending TallyNX Desk verification',
    },
    metrics: {
      maxDrawdownPct: +Number(input.maxDrawdownPct).toFixed(2),
      winRatePct: +Number(input.winRatePct).toFixed(1),
      profitFactor: +Number(input.profitFactor).toFixed(2),
      consistencyScorePct: 0,
      expectancyR: 0,
    },
    priceUsd: Math.round(Number(input.priceUsd)),
    licensesIssued: 0,
    summary: input.summary.trim(),
    summaryTh: input.summary.trim(),
    includedRules: [
      `Engine: ${ENGINE_LABELS[input.engineType]} blueprint config`,
      `Target verification channel: ${VERIFICATION_LABELS[input.verificationMethod].en}`,
      'Zero copy-trade execution rights — loads locally into your MT5 desk',
    ],
    sampleDeals: [],
  };
}

export function calculateLicenseBagTotal(items: DeskIdeaItem[]): {
  count: number;
  subtotalUsd: number;
  freeCount: number;
  paidCount: number;
} {
  let subtotalUsd = 0;
  let freeCount = 0;
  let paidCount = 0;

  for (const item of items) {
    subtotalUsd += item.priceUsd;
    if (item.priceUsd === 0) {
      freeCount += 1;
    } else {
      paidCount += 1;
    }
  }

  return {
    count: items.length,
    subtotalUsd,
    freeCount,
    paidCount,
  };
}

export function buildDeskConfigExport(item: DeskIdeaItem): string {
  return JSON.stringify(
    {
      schema: 'tallynx.desk-blueprint/v5.2',
      idea_id: item.id,
      title: item.title,
      creator: item.creatorHandle,
      desk_engine: item.engineLabel,
      verification: {
        channel: item.verificationMethod,
        ledger_ref: item.verificationProof.ledgerHash,
        verified_deals: item.verificationProof.verifiedDealsCount,
        broker_server: item.verificationProof.brokerServer,
      },
      reference_metrics: item.metrics,
      execution_boundary: {
        auto_copy_trade: false,
        custodial_holding: false,
        orders_route: 'LOCAL_MT5_ONLY',
      },
      rules_envelope: item.includedRules,
    },
    null,
    2
  );
}

/**
 * Parses ?idea=<id> from a URL query string and returns the matching DeskIdeaItem from catalog.
 */
export function findDeskIdeaFromSearch(
  search: string,
  catalog: DeskIdeaItem[] = DESK_IDEAS_CATALOG
): DeskIdeaItem | null {
  if (!search) return null;
  const cleaned = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(cleaned);
  const ideaId = params.get('idea')?.trim();
  if (!ideaId) return null;
  return catalog.find((item) => item.id === ideaId) ?? null;
}
