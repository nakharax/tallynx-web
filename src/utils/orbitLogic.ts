import type { Language } from './i18n';

export interface ProductWorkspaceTab {
  id: 'visibility' | 'limits' | 'trades';
  title: string;
  description: string;
  metrics: { label: string; value: string }[];
}

export const WORKSPACE_TABS: Record<Language, ProductWorkspaceTab[]> = {
  en: [
    {
      id: 'visibility',
      title: 'Account visibility',
      description: 'Check drawdown, monitoring status, and the last report for every linked account.',
      metrics: [
        { label: 'Sample sync delay', value: '< 2s' },
        { label: 'Daily loss budget left', value: '78.4%' },
        { label: 'Order execution', value: 'Local MT5' },
      ],
    },
    {
      id: 'limits',
      title: 'Set your limits',
      description: 'Set daily and overall loss limits and see when Desk surfaces a drawdown alert.',
      metrics: [
        { label: 'Who sets the rules', value: 'You' },
        { label: 'Drawdown alerts', value: '55% / 85% / 100%' },
        { label: 'Check account state in', value: 'MT5' },
      ],
    },
    {
      id: 'trades',
      title: 'Recorded trades',
      description: 'Read the deal ledger in time order and review flagged drawdown spikes.',
      metrics: [
        { label: 'Audit order', value: 'By trade time' },
        { label: 'Flagged events', value: 'Drawdown spikes' },
        { label: 'Purpose', value: 'Post-trade review' },
      ],
    },
  ],
  th: [
    {
      id: 'visibility',
      title: 'ภาพรวมบัญชี',
      description: 'ดู Drawdown สถานะการติดตาม และรายงานล่าสุดของแต่ละบัญชีที่เชื่อมต่อ',
      metrics: [
        { label: 'เวลาหน่วงตัวอย่าง', value: '< 2 วินาที' },
        { label: 'งบขาดทุนรายวันที่เหลือ', value: '78.4%' },
        { label: 'ที่ส่งคำสั่งซื้อขาย', value: 'MT5 บนเครื่อง' },
      ],
    },
    {
      id: 'limits',
      title: 'กำหนดเพดานขาดทุน',
      description: 'ตั้งเพดานขาดทุนรายวันและรวม แล้วดูว่าโต๊ะเทรดแจ้งเตือน Drawdown เมื่อใด',
      metrics: [
        { label: 'ผู้กำหนดกติกา', value: 'คุณ' },
        { label: 'ระดับแจ้งเตือน Drawdown', value: '55% / 85% / 100%' },
        { label: 'ตรวจสถานะบัญชีที่', value: 'MT5' },
      ],
    },
    {
      id: 'trades',
      title: 'บันทึกออเดอร์',
      description: 'เปิดสมุดเทรดตามลำดับเวลาและทบทวนช่วงที่ Drawdown เพิ่มขึ้นผิดปกติ',
      metrics: [
        { label: 'การเรียงรายการตรวจสอบ', value: 'ตามเวลาเทรด' },
        { label: 'เหตุการณ์ที่ถูกทำเครื่องหมาย', value: 'Drawdown พุ่งสูง' },
        { label: 'การใช้งาน', value: 'ทบทวนหลังเทรด' },
      ],
    },
  ],
};

export function getNextTabIndex(currentIndex: number, totalTabs: number, direction: 1 | -1 = 1): number {
  if (totalTabs <= 0) return 0;
  return (currentIndex + direction + totalTabs) % totalTabs;
}

export interface DrawdownSimulationInput {
  accountBalance: number;
  currentEquity: number;
  dailyLossLimitPct: number;
  maxDrawdownLimitPct: number;
  todayRealizedLoss: number;
}

export interface DrawdownSimulationResult {
  dailyLossLimitAmount: number;
  maxDrawdownLimitAmount: number;
  currentFloatingLoss: number;
  totalDailyLossUsed: number;
  dailyBufferRemaining: number;
  overallBufferRemaining: number;
  dailyUsageRatio: number;
  overallUsageRatio: number;
  status: 'NOMINAL' | 'CAUTION' | 'GUARD_ACTIVE';
}

export function calculateDrawdownSimulation(input: DrawdownSimulationInput): DrawdownSimulationResult {
  const balance = Math.max(100, input.accountBalance);
  const equity = Math.max(0, input.currentEquity);
  const dailyPct = Math.max(0.5, Math.min(20, input.dailyLossLimitPct));
  const maxPct = Math.max(dailyPct, Math.min(50, input.maxDrawdownLimitPct));

  const dailyLossLimitAmount = +(balance * (dailyPct / 100)).toFixed(2);
  const maxDrawdownLimitAmount = +(balance * (maxPct / 100)).toFixed(2);

  const currentFloatingLoss = Math.max(0, +(balance - equity).toFixed(2));
  const totalDailyLossUsed = +(Math.max(0, input.todayRealizedLoss) + currentFloatingLoss).toFixed(2);

  const dailyBufferRemaining = +Math.max(0, dailyLossLimitAmount - totalDailyLossUsed).toFixed(2);
  const overallBufferRemaining = +Math.max(0, maxDrawdownLimitAmount - totalDailyLossUsed).toFixed(2);

  const dailyUsageRatio = Math.min(1, totalDailyLossUsed / Math.max(1, dailyLossLimitAmount));
  const overallUsageRatio = Math.min(1, totalDailyLossUsed / Math.max(1, maxDrawdownLimitAmount));

  const peakRatio = Math.max(dailyUsageRatio, overallUsageRatio);
  let status: DrawdownSimulationResult['status'] = 'NOMINAL';
  if (peakRatio >= 0.85) {
    status = 'GUARD_ACTIVE';
  } else if (peakRatio >= 0.55) {
    status = 'CAUTION';
  }

  return {
    dailyLossLimitAmount,
    maxDrawdownLimitAmount,
    currentFloatingLoss,
    totalDailyLossUsed,
    dailyBufferRemaining,
    overallBufferRemaining,
    dailyUsageRatio,
    overallUsageRatio,
    status,
  };
}
