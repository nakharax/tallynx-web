import React, { useState } from 'react';
import type { Language } from '../utils/i18n';
import { calculateDrawdownSimulation } from '../utils/orbitLogic';
import { AlertTriangle, CheckCircle, ShieldAlert, Sliders } from 'lucide-react';

interface DrawdownSandboxProps {
  isDark: boolean;
  lang: Language;
}

export const DrawdownSandbox: React.FC<DrawdownSandboxProps> = ({ isDark, lang }) => {
  const isTh = lang === 'th';
  const locale = isTh ? 'th-TH' : 'en-US';
  const [balance, setBalance] = useState<number>(100000);
  const [dailyPct, setDailyPct] = useState<number>(3.0);
  const maxPct = 8;
  const [sessionLoss, setSessionLoss] = useState<number>(1200);

  const result = calculateDrawdownSimulation({
    accountBalance: balance,
    currentEquity: balance - sessionLoss,
    dailyLossLimitPct: dailyPct,
    maxDrawdownLimitPct: maxPct,
    todayRealizedLoss: 0,
  });

  return (
    <div
      className="desk-panel p-6 sm:p-7"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-focus/15 text-focus' : 'bg-focus/10 text-focus'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold text-focus block">
              {isTh ? 'จำลองความเสี่ยง' : 'Risk simulator'}
            </span>
            <h3
              className={`text-base font-bold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-[#141618]'
              }`}
            >
              {isTh ? 'เช็กงบขาดทุนที่เหลือ' : 'Test your drawdown limits'}
            </h3>
          </div>
        </div>

        {/* Dynamic Status Readout (Zero Pill Clutter) */}
        <div
          className={`flex items-center gap-1.5 text-xs font-mono font-bold ${
            result.status === 'NOMINAL'
              ? 'text-[#00c07a]'
              : result.status === 'CAUTION'
                ? 'text-caution'
                : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {result.status === 'NOMINAL' && <CheckCircle className="w-3.5 h-3.5" />}
          {result.status === 'CAUTION' && <AlertTriangle className="w-3.5 h-3.5" />}
          {result.status === 'GUARD_ACTIVE' && <ShieldAlert className="w-3.5 h-3.5" />}
          <span>
            {result.status === 'NOMINAL'
              ? (isTh ? 'อยู่ในเกณฑ์' : 'Within limits')
              : result.status === 'CAUTION'
                ? (isTh ? 'ควรระวัง' : 'Caution')
                : (isTh ? 'ใกล้แตะเพดาน' : 'Near the limit')}
          </span>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
        {/* Account Size */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#2B2D2F] dark:text-neutral-400 font-medium">{isTh ? 'ขนาดบัญชี' : 'Account size'}</span>
            <span className="font-mono tabular-nums font-bold text-[#141618] dark:text-white">${balance.toLocaleString(locale)}</span>
          </div>
          <select
            value={balance}
            aria-label={isTh ? 'ขนาดบัญชี' : 'Account size'}
            onChange={(e) => {
              const val = Number(e.target.value);
              setBalance(val);
              setSessionLoss(Math.min(sessionLoss, Math.round(val * (dailyPct / 100))));
            }}
            className={`w-full rounded-xl border px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#141618] border-neutral-800 text-white focus:border-focus focus:outline-none'
                : 'bg-canvas border-hairline text-[#141618] focus:border-focus focus:outline-none'
            }`}
          >
            <option value={25000}>$25,000</option>
            <option value={50000}>$50,000</option>
            <option value={100000}>$100,000</option>
            <option value={200000}>$200,000</option>
          </select>
        </div>

        {/* Daily Limit % Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#2B2D2F] dark:text-neutral-400 font-medium">{isTh ? 'เพดานขาดทุนรายวัน (%)' : 'Daily loss limit (%)'}</span>
            <span className="font-mono tabular-nums font-semibold text-focus">
              {dailyPct.toFixed(1)}% (${result.dailyLossLimitAmount.toLocaleString(locale)})
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            step={0.5}
            value={dailyPct}
            aria-label={isTh ? 'เพดานขาดทุนรายวัน' : 'Daily loss limit'}
            onChange={(e) => {
              const nextPct = parseFloat(e.target.value);
              setDailyPct(nextPct);
              setSessionLoss((prev) =>
                Math.min(prev, Math.round(balance * (nextPct / 100) * 1.15))
              );
            }}
            className="w-full h-2 rounded-lg accent-focus bg-canvas dark:bg-neutral-800 cursor-pointer mt-2"
          />
        </div>

        {/* Simulated Session Loss */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#2B2D2F] dark:text-neutral-400 font-medium">{isTh ? 'ขาดทุนลอยตัวจำลอง' : 'Simulated floating loss'}</span>
            <span className="font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
              -${sessionLoss.toLocaleString(locale)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.round(balance * (dailyPct / 100) * 1.15)}
            step={50}
            value={sessionLoss}
            aria-label={isTh ? 'ขาดทุนลอยตัวจำลอง' : 'Simulated floating loss'}
            onChange={(e) => setSessionLoss(Number(e.target.value))}
            className="w-full h-2 rounded-lg accent-rose-500 bg-canvas dark:bg-neutral-800 cursor-pointer mt-2"
          />
        </div>
      </div>

      {/* Progress Meter */}
      <div className="mt-6 pt-5 border-t border-inherit">
        <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
          <span className="text-[#2B2D2F] dark:text-neutral-400">{isTh ? 'งบขาดทุนรายวันที่ใช้แล้ว' : 'Daily loss budget used'}</span>
          <span className="font-bold tabular-nums text-[#141618] dark:text-white">{Math.round(result.dailyUsageRatio * 100)}%</span>
        </div>
        <div
          className={`h-2.5 rounded-full overflow-hidden ${
            isDark ? 'bg-neutral-800' : 'bg-canvas'
          }`}
        >
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              result.status === 'NOMINAL'
                ? 'bg-[#00c07a]'
                : result.status === 'CAUTION'
                  ? 'bg-caution'
                  : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, Math.round(result.dailyUsageRatio * 100))}%` }}
          />
        </div>
      </div>

      {/* Metrics Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-inherit text-xs">
        <div>
          <span className="text-[#2B2D2F] dark:text-neutral-400 block text-[11px]">{isTh ? 'เพดานขาดทุนรายวัน' : 'Daily loss limit'}</span>
          <span className={`font-mono tabular-nums text-sm font-bold mt-0.5 block ${isDark ? 'text-white' : 'text-[#141618]'}`}>
            ${result.dailyLossLimitAmount.toLocaleString(locale)}
          </span>
        </div>

        <div>
          <span className="text-[#2B2D2F] dark:text-neutral-400 block text-[11px]">{isTh ? 'งบขาดทุนรายวันที่เหลือ' : 'Daily loss budget left'}</span>
          <span className="font-mono tabular-nums text-sm font-bold mt-0.5 block text-focus">
            ${result.dailyBufferRemaining.toLocaleString(locale)}
          </span>
        </div>

        <div>
          <span className="text-[#2B2D2F] dark:text-neutral-400 block text-[11px]">{isTh ? 'เพดาน Drawdown รวม' : 'Overall drawdown limit'} ({maxPct}%)</span>
          <span className={`font-mono tabular-nums text-sm font-bold mt-0.5 block ${isDark ? 'text-white' : 'text-[#141618]'}`}>
            ${result.maxDrawdownLimitAmount.toLocaleString(locale)}
          </span>
        </div>

        <div>
          <span className="text-[#2B2D2F] dark:text-neutral-400 block text-[11px]">{isTh ? 'ที่ส่งคำสั่งซื้อขาย' : 'Order execution'}</span>
          <span className="font-mono text-sm font-bold mt-0.5 block text-emerald-600 dark:text-emerald-400">
            {isTh ? 'MT5 บนเครื่อง' : 'Local MT5'}
          </span>
        </div>
      </div>
    </div>
  );
};
