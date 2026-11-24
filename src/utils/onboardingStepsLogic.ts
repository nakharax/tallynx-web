import {
  clampTransferState,
  type ConnectionTierId,
  type OnboardingTransferState,
} from './onboardingLogic';

export interface SevenDayDayBar {
  dayLabel: string;
  pnlUsd: number;
  sharePct: number;
  trades: number;
}

export interface SevenDayHealthSummary {
  tierUsed: ConnectionTierId;
  sourceLabelEn: string;
  sourceLabelTh: string;
  heartbeatLatencyMs: number;
  netProfitUsd: number;
  netReturnPct: number;
  bestDaySharePct: number;
  consistencyPass: boolean;
  maxDrawdownUsedPct: number;
  dailyBufferRemainingUsd: number;
  winRatePct: number;
  days: SevenDayDayBar[];
}

export interface TwelveGateChecklistItem {
  id: string;
  phase: 'Risk & Sizing' | 'Market Structure' | 'Discipline & Rules';
  titleEn: string;
  titleTh: string;
  critical: boolean;
}

export const MT5_BRIDGE_PING_URL = 'https://telemetry.tallynx.com/v1/mt5/ping';
export const MT5_BRIDGE_DOWNLOAD_FILENAME = 'TallyNX_Bridge_v4.ex5';

/**
 * Generates realistic 7-day portfolio health telemetry upon completing Step 4 sync.
 */
export function getSevenDayHealthSummary(
  state: OnboardingTransferState,
  tier: ConnectionTierId
): SevenDayHealthSummary {
  const safe = clampTransferState(state);
  const unitRisk = Math.round(safe.accountSize * (safe.riskPct / 100));

  const dayMultipliers = [0.65, -0.45, 1.35, 0.9, -0.3, 1.45, 0.8];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat/Sun', 'Today'];
  const tradeCounts = [2, 2, 3, 2, 1, 2, 2];

  const rawPnls = dayMultipliers.map((m) => Math.round(unitRisk * m));
  const netProfitUsd = Math.max(unitRisk * 2, rawPnls.reduce((acc, v) => acc + v, 0));
  const bestPositive = Math.max(...rawPnls, 1);
  const bestDaySharePct = Math.min(
    38,
    Math.max(18, Math.round((bestPositive / netProfitUsd) * 100))
  );

  const days: SevenDayDayBar[] = rawPnls.map((pnlUsd, idx) => ({
    dayLabel: dayLabels[idx],
    pnlUsd,
    sharePct:
      pnlUsd > 0 ? Math.round((pnlUsd / netProfitUsd) * 100) : 0,
    trades: tradeCounts[idx],
  }));

  const metaByTier: Record<
    ConnectionTierId,
    { labelEn: string; labelTh: string; latencyMs: number }
  > = {
    xlsx: {
      labelEn: 'MT5 Statement (.xlsx Preview)',
      labelTh: 'ตัวอย่างรายงาน MT5 (.xlsx)',
      latencyMs: 320,
    },
    cloud: {
      labelEn: 'Read-Only Cloud API Preview',
      labelTh: 'ตัวอย่างซิงก์ผ่าน Cloud API แบบอ่านอย่างเดียว',
      latencyMs: 680,
    },
    ex5: {
      labelEn: 'MT5 Bridge (.ex5 Heartbeat Demo)',
      labelTh: 'MT5 Bridge (.ex5 สัญญาณจำลอง)',
      latencyMs: 920,
    },
  };

  const dailyDdCeilingUsd = safe.accountSize * (safe.dailyDdLimitPct / 100);
  const maxDrawdownUsedPct = Math.round((safe.riskPct * 1.15) * 100) / 100;

  return {
    tierUsed: tier,
    sourceLabelEn: metaByTier[tier].labelEn,
    sourceLabelTh: metaByTier[tier].labelTh,
    heartbeatLatencyMs: metaByTier[tier].latencyMs,
    netProfitUsd,
    netReturnPct: Math.round((netProfitUsd / safe.accountSize) * 10000) / 100,
    bestDaySharePct,
    consistencyPass: safe.mode === 'prop' ? bestDaySharePct <= 40 : true,
    maxDrawdownUsedPct,
    dailyBufferRemainingUsd: Math.max(0, Math.round(dailyDdCeilingUsd - unitRisk * 0.45)),
    winRatePct: 64.3,
    days,
  };
}

export const TWELVE_GATE_ITEMS: TwelveGateChecklistItem[] = [
  {
    id: 'g1',
    phase: 'Risk & Sizing',
    titleEn: 'Position size within the planned risk limit',
    titleTh: 'ขนาด Lot ไม่เกินความเสี่ยงที่คำนวณไว้',
    critical: true,
  },
  {
    id: 'g2',
    phase: 'Risk & Sizing',
    titleEn: 'Stop-Loss placed in terminal at structural invalidation',
    titleTh: 'ตั้งจุดตัดขาดทุน (SL) ใน MT5 ทันทีตามโครงสร้างกราฟ',
    critical: true,
  },
  {
    id: 'g3',
    phase: 'Risk & Sizing',
    titleEn: '3-TP ladder split configured (40% / 35% / 25%)',
    titleTh: 'แบ่งเป้าทำกำไร 3 ระยะ (40% / 35% / 25%) พร้อมเลื่อน SL หน้าทุน',
    critical: false,
  },
  {
    id: 'g4',
    phase: 'Risk & Sizing',
    titleEn: 'Remaining Daily DD buffer exceeds 2× trade risk',
    titleTh: 'ระยะก่อนถึงเพดาน Daily DD มากกว่า 2 เท่าของความเสี่ยงต่อไม้',
    critical: true,
  },
  {
    id: 'g5',
    phase: 'Market Structure',
    titleEn: 'Aligned with H1 higher-timeframe directional bias',
    titleTh: 'ทิศทางสอดคล้องกับโครงสร้างหลักบน Timeframe H1',
    critical: false,
  },
  {
    id: 'g6',
    phase: 'Market Structure',
    titleEn: 'Entered at M5 liquidity sweep or FVG equilibrium',
    titleTh: 'จุดเข้าอยู่บริเวณแนวสภาพคล่อง หรือ Equilibrium บนกราฟ M5',
    critical: false,
  },
  {
    id: 'g7',
    phase: 'Market Structure',
    titleEn: 'Active trading session (London / NY Killzone)',
    titleTh: 'เทรดในช่วงเซสชันที่มีสภาพคล่อง (London / NY Killzone)',
    critical: false,
  },
  {
    id: 'g8',
    phase: 'Market Structure',
    titleEn: 'No red-folder high-impact news within 20 minutes',
    titleTh: 'ไม่มีข่าวความผันผวนสูงระดับแดงภายใน 20 นาทีข้างหน้า',
    critical: true,
  },
  {
    id: 'g9',
    phase: 'Discipline & Rules',
    titleEn: 'Consistency Rule 40% headroom verified for current cycle',
    titleTh: 'สัดส่วนกำไรวันนี้ไม่เกินเพดาน Consistency Rule 40%',
    critical: true,
  },
  {
    id: 'g10',
    phase: 'Discipline & Rules',
    titleEn: 'Outside the 15-minute cooldown after a stop-loss',
    titleTh: 'พ้นช่วงพัก 15 นาทีหลังชน SL',
    critical: true,
  },
  {
    id: 'g11',
    phase: 'Discipline & Rules',
    titleEn: 'Not revenge trading to recover an earlier session loss',
    titleTh: 'ไม่ได้เข้าออเดอร์ด้วยอารมณ์อยากเอาคืนจากไม้ที่ขาดทุนก่อนหน้า',
    critical: true,
  },
  {
    id: 'g12',
    phase: 'Discipline & Rules',
    titleEn: 'Screenshot & setup thesis logged for post-trade audit',
    titleTh: 'บันทึกภาพกราฟและเหตุผลก่อนเข้าเพื่อใช้วิเคราะห์หลังปิดไม้',
    critical: false,
  },
];

export function evaluateTwelveGateReadiness(checkedIds: string[]): {
  checkedCount: number;
  totalCount: number;
  criticalPassed: boolean;
  readyToExecute: boolean;
} {
  const checkedSet = new Set(checkedIds);
  const criticalItems = TWELVE_GATE_ITEMS.filter((g) => g.critical);
  const criticalPassed = criticalItems.every((g) => checkedSet.has(g.id));
  const checkedCount = TWELVE_GATE_ITEMS.filter((g) => checkedSet.has(g.id)).length;
  return {
    checkedCount,
    totalCount: TWELVE_GATE_ITEMS.length,
    criticalPassed,
    readyToExecute: criticalPassed && checkedCount >= 9,
  };
}

/**
 * Plays a gentle dual-tone Web Audio chime when MT5 .ex5 heartbeat ping is detected.
 */
export function playSoftChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playNote = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.06, now + startOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    playNote(587.33, 0, 0.24); // D5
    playNote(880.0, 0.11, 0.34); // A5
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 800);
  } catch {
    // Ignore autoplay / audio restrictions
  }
}
