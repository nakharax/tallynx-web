import type { Language } from './i18n';

export type DeskEngineType =
  | 'ghr-v32'
  | 'custom-desk'
  | 'ea-guard'
  | 'macro-playbook';

export type VerificationMethod =
  | 'cloud-api-sync'
  | 'xlsx-sha256'
  | 'ea-local-bridge';

export const ENGINE_LABELS: Record<DeskEngineType, string> = {
  'ghr-v32': 'TallyNX Flagship OS',
  'custom-desk': 'Custom Session Desk',
  'ea-guard': 'EA Coexistent Guard',
  'macro-playbook': 'Macro 4-TP Engine',
};

export const VERIFICATION_LABELS: Record<
  VerificationMethod,
  Record<Language, string>
> = {
  'cloud-api-sync': {
    en: 'Official Cloud API (Read-Only)',
    th: 'ซิงก์ Cloud API ทางการ (อ่านอย่างเดียว)',
  },
  'xlsx-sha256': {
    en: '.xlsx Statement Hash',
    th: 'ตรวจแฮชไฟล์ .xlsx โบรเกอร์',
  },
  'ea-local-bridge': {
    en: 'Live Bridge (.ex5) Telemetry',
    th: 'เชื่อมตรง Live Bridge (.ex5)',
  },
};

/**
 * Precomputed proof metrics from the first two illustrative sample histories.
 * Verified against runLandingStatementAutopsy in landingSpotlightData.test.ts
 * so the landing route avoids downloading the full statement parser or running
 * 2,000 Monte Carlo paths synchronously during initial module evaluation.
 */
export const LANDING_AUTOPSY_PROOF = {
  tilt: {
    worstDailyClosedLossUsd: 2660,
    disciplinedWorstDailyClosedLossUsd: 820,
    preventableTiltLossUsd: 1840,
    tiltTradeCount: 3,
  },
  consistency: {
    bestDaySharePct: 48,
    disciplinedBestDaySharePct: 38.4,
  },
} as const;

export interface LandingSpotlightIdea {
  id: string;
  title: string;
  creatorHandle: string;
  engineType: DeskEngineType;
  verificationMethod: VerificationMethod;
  brokerServer: string;
  summary: string;
  summaryTh: string;
  maxDrawdownPct: number;
  profitFactor: number;
  priceUsd: number;
}

/**
 * Compact preview slice of the top 3 featured Marketplace blueprints for the
 * landing page spotlight, keeping the full catalog out of the initial bundle.
 */
export const LANDING_MARKETPLACE_SPOTLIGHT: readonly LandingSpotlightIdea[] = [
  {
    id: 'idea-ghr-prop-shield',
    title: 'London Open Gold 40%-Cap Prop Desk',
    creatorHandle: '@kavin.quant',
    engineType: 'ghr-v32',
    verificationMethod: 'cloud-api-sync',
    brokerServer: 'FundedNext-MCP-ReadOnly',
    summary:
      'Complete 3-TP ladder rulebook calibrated for XAUUSD London open volatility. Enforces a 1.5% daily risk cap and automatic 15-minute cooldown after Stop-Loss.',
    summaryTh:
      'ชุดตั้งค่าโต๊ะเทรด 3-TP สำหรับทองคำช่วงเปิดตลาดลอนดอน คุมความเสี่ยงรายวันไม่เกิน 1.5% และตรวจกฎ Consistency ไม่เกิน 40% (ตัวอย่างโครงสร้างโต๊ะเทรด)',
    maxDrawdownPct: 2.35,
    profitFactor: 2.28,
    priceUsd: 49,
  },
  {
    id: 'idea-ny-index-custom',
    title: 'NY Killzone US100 Asymmetric Session Desk',
    creatorHandle: '@nina.flow',
    engineType: 'custom-desk',
    verificationMethod: 'xlsx-sha256',
    brokerServer: 'PrimeECN-Real02',
    summary:
      'Custom session layout engineered for the first 90 minutes of New York equities open. Designed for SHA-256 hashed broker .xlsx statement audits.',
    summaryTh:
      'โครงสร้างโต๊ะเทรดอิสระ (Custom Desk) สำหรับช่วงเปิดตลาด New York 90 นาทีแรกบน US100 ออกแบบสำหรับตรวจยืนยันผ่านไฟล์ .xlsx โบรเกอร์ที่เข้ารหัสแฮช',
    maxDrawdownPct: 3.1,
    profitFactor: 2.04,
    priceUsd: 69,
  },
  {
    id: 'idea-ea-drawdown-sentinel',
    title: 'Multi-Pair EA Equity Corridor & News Pause',
    creatorHandle: '@tanakorn.sys',
    engineType: 'ea-guard',
    verificationMethod: 'ea-local-bridge',
    brokerServer: 'VantageRaw-Live07',
    summary:
      'Coexists silently with automated MQL5 Expert Advisors via Live Bridge (.ex5). Tracks basket floating equity exposure across EURUSD, GBPUSD, and USDJPY locally.',
    summaryTh:
      'โต๊ะคุมความเสี่ยงสำหรับสายรัน EA หลายคู่เงินผ่าน Live Bridge (.ex5) วัดค่า Floating Basket Equity บนเครื่องพร้อมกติกาแจ้งเตือนก่อนข่าวแรง',
    maxDrawdownPct: 1.85,
    profitFactor: 1.92,
    priceUsd: 89,
  },
];
