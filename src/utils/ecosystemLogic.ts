export type GuardrailState = 'SAFE' | 'WATCH' | 'ALERT';

export const SANDBOX_COOLDOWN_MINUTES = 15;

export interface SandboxTradeEvent {
  id: string;
  label: string;
  labelTh: string;
  rMultiple: number;
  pnlUsd: number;
  pnlPct: number;
  lotMultiplier: number;
  timestamp: string;
}

export interface SandboxState {
  startingEquity: number;
  equity: number;
  dailyDdUsedPct: number;
  dailyDdLimitPct: number;
  totalTrades: number;
  wins: number;
  winRatePct: number;
  guardrailState: GuardrailState;
  cooldownActive: boolean;
  guardrailMessage: string;
  guardrailMessageTh: string;
  equityCurve: number[];
  events: SandboxTradeEvent[];
}

const INITIAL_SANDBOX_CURVE = [100000, 100420, 100180, 100950];

export function createInitialSandboxState(): SandboxState {
  const totalTrades = 3;
  const wins = 2;
  return {
    startingEquity: 100000,
    equity: 100000,
    dailyDdUsedPct: 0.4,
    dailyDdLimitPct: 5.0,
    totalTrades,
    wins,
    winRatePct: 66.7,
    guardrailState: 'SAFE',
    cooldownActive: false,
    guardrailMessage:
      'All 12 discipline gates satisfied. Standard 0.50% risk per trade active.',
    guardrailMessageTh:
      'ผ่านเกณฑ์วินัยครบทั้ง 12 ด่าน ระบบใช้ขนาดความเสี่ยงมาตรฐาน 0.50% ต่อออเดอร์',
    equityCurve: [...INITIAL_SANDBOX_CURVE],
    events: [
      {
        id: 'seed-1',
        label: 'Session Baseline · MT5 Live Bridge Read-Only',
        labelTh: 'ค่าเริ่มต้นของรอบเทรด · MT5 Live Bridge แบบอ่านอย่างเดียว',
        rMultiple: 0.0,
        pnlUsd: 0,
        pnlPct: 0,
        lotMultiplier: 1.0,
        timestamp: '08:00 UTC',
      },
    ],
  };
}

export function simulateDisciplinedWin(state: SandboxState): SandboxState {
  if (state.cooldownActive) return state;

  const pnlPct = 0.85;
  const pnlUsd = Math.round(state.equity * (pnlPct / 100));
  const nextEquity = state.equity + pnlUsd;
  const totalTrades = state.totalTrades + 1;
  const wins = state.wins + 1;
  const winRatePct = +((wins / totalTrades) * 100).toFixed(1);
  const nextDd = +Math.max(0.1, state.dailyDdUsedPct - 0.15).toFixed(2);
  const recovered = nextDd < 2.5 && state.guardrailState !== 'ALERT';

  return {
    ...state,
    equity: nextEquity,
    dailyDdUsedPct: nextDd,
    totalTrades,
    wins,
    winRatePct,
    guardrailState: recovered ? 'SAFE' : state.guardrailState === 'ALERT' ? 'WATCH' : 'SAFE',
    guardrailMessage:
      'The simulated trade closed at +1.7R across TP2–TP3. The consistency score is within range.',
    guardrailMessageTh:
      'ออเดอร์จำลองปิดกำไร +1.7R จาก TP2–TP3 คะแนน Consistency ยังอยู่ในเกณฑ์',
    equityCurve: [...state.equityCurve.slice(-11), nextEquity],
    events: [
      {
        id: `win-${totalTrades}`,
        label: 'Disciplined Win (+1.7R · 0.50% Risk)',
        labelTh: 'ชนะตามแผน (+1.7R · เสี่ยง 0.50%)',
        rMultiple: 1.7,
        pnlUsd,
        pnlPct,
        lotMultiplier: 1.0,
        timestamp: 'LIVE',
      },
      ...state.events.slice(0, 5),
    ],
  };
}

export function simulateCappedLoss(state: SandboxState): SandboxState {
  if (state.cooldownActive) return state;

  const pnlPct = -0.5;
  const pnlUsd = Math.round(state.equity * (pnlPct / 100));
  const nextEquity = Math.max(85000, state.equity + pnlUsd);
  const totalTrades = state.totalTrades + 1;
  const winRatePct = +((state.wins / totalTrades) * 100).toFixed(1);
  const nextDd = +Math.min(state.dailyDdLimitPct, state.dailyDdUsedPct + 0.5).toFixed(2);
  const guardrailState: GuardrailState = nextDd >= 3.5 ? 'ALERT' : nextDd >= 2.0 ? 'WATCH' : 'SAFE';

  return {
    ...state,
    equity: nextEquity,
    dailyDdUsedPct: nextDd,
    totalTrades,
    winRatePct,
    guardrailState,
    cooldownActive: true,
    guardrailMessage: 'The simulated trade hit its stop at -1.0R.',
    guardrailMessageTh: 'ออเดอร์จำลองชน SL ที่ -1.0R',
    equityCurve: [...state.equityCurve.slice(-11), nextEquity],
    events: [
      {
        id: `loss-${totalTrades}`,
        label: 'Capped Stop-Loss (-1.0R · -0.50%)',
        labelTh: 'ตัดขาดทุนตามแผน (-1.0R · -0.50%)',
        rMultiple: -1.0,
        pnlUsd,
        pnlPct,
        lotMultiplier: 1.0,
        timestamp: 'LIVE',
      },
      ...state.events.slice(0, 5),
    ],
  };
}

export function triggerRevengeOverLot(state: SandboxState): SandboxState {
  if (state.cooldownActive) return state;

  const pnlPct = -2.1;
  const pnlUsd = Math.round(state.equity * (pnlPct / 100));
  const nextEquity = Math.max(82000, state.equity + pnlUsd);
  const totalTrades = state.totalTrades + 1;
  const winRatePct = +((state.wins / totalTrades) * 100).toFixed(1);
  const nextDd = +Math.min(state.dailyDdLimitPct, state.dailyDdUsedPct + 2.1).toFixed(2);

  return {
    ...state,
    equity: nextEquity,
    dailyDdUsedPct: nextDd,
    totalTrades,
    winRatePct,
    guardrailState: 'ALERT',
    cooldownActive: true,
    guardrailMessage: 'The simulated trade used 4× the planned lot size and closed at a loss.',
    guardrailMessageTh: 'ออเดอร์จำลองใช้ขนาด Lot 4 เท่าของแผนและปิดขาดทุน',
    equityCurve: [...state.equityCurve.slice(-11), nextEquity],
    events: [
      {
        id: `revenge-${totalTrades}`,
        label: 'Revenge Over-Lot Triggered (4.0x Lot · -2.10%)',
        labelTh: 'ออก Lot เกินขนาด (4.0x Lot · -2.10%)',
        rMultiple: -2.1,
        pnlUsd,
        pnlPct,
        lotMultiplier: 4.0,
        timestamp: 'ALERT',
      },
      ...state.events.slice(0, 5),
    ],
  };
}

export function completeSandboxCooldown(state: SandboxState): SandboxState {
  if (!state.cooldownActive) return state;

  return {
    ...state,
    cooldownActive: false,
    guardrailMessage: 'The simulated cooldown ended. You can try another scenario.',
    guardrailMessageTh: 'สิ้นสุดช่วงพักจำลองแล้ว คุณสามารถทดลองสถานการณ์ถัดไปได้',
  };
}
