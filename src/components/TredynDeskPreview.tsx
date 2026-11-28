import React from 'react';
import { TredynLogo } from './TredynLogo';
import { Language } from '../utils/i18n';
import { ProductWorkspaceTab } from '../utils/orbitLogic';
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  Lock,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';

interface TredynDeskPreviewProps {
  tabId: ProductWorkspaceTab['id'];
  isDark: boolean;
  lang?: Language;
  expanded?: boolean;
}

export const TredynDeskPreview: React.FC<TredynDeskPreviewProps> = ({
  tabId,
  isDark,
  lang = 'en',
  expanded = false,
}) => {
  const th = lang === 'th';

  const surfaceShell = isDark
    ? 'bg-[#090b0f] text-neutral-100 border-neutral-800'
    : 'bg-white text-neutral-900 border-neutral-200';
  const subSurface = isDark
    ? 'bg-[#10131a] border-neutral-800'
    : 'bg-neutral-50 border-neutral-200';
  const mutedText = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const hairline = isDark ? 'border-neutral-800' : 'border-neutral-200';

  return (
    <div
      data-testid={`desk-preview-${tabId}`}
      className={`w-full rounded-xl border overflow-hidden select-none ${surfaceShell} ${
        expanded ? 'min-h-[460px]' : 'aspect-[16/10]'
      } flex flex-col`}
    >
      {/* Top Workspace App Chrome */}
      <div
        className={`flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 border-b text-[11px] ${hairline} ${
          isDark ? 'bg-[#0c0f15]' : 'bg-neutral-50/90'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <TredynLogo
            variant="lockup"
            size="xs"
            tone={isDark ? 'dark' : 'light'}
          />
          <span className={`hidden sm:inline ${mutedText}`} aria-hidden="true">
            /
          </span>
          <span
            className={`hidden sm:inline font-mono truncate ${mutedText}`}
          >
            {tabId === 'visibility'
              ? th
                ? 'ภาพรวมพอร์ตและคำนวณ 3-TP/4-TP'
                : 'Account Visibility · TallyNX Desk v5.2'
              : tabId === 'limits'
                ? th
                  ? 'กำหนดเพดานและด่านวินัย 12-Gate'
                  : 'Limits & 12-Gate Protocol'
                : th
                  ? 'บันทึกคำสั่งซื้อขายจริง (MT5 & .xlsx)'
                  : 'Recorded Trades & SHA-256 Ledger'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
          <span
            className={`px-2 py-0.5 rounded border ${
              isDark
                ? 'bg-neutral-900 border-neutral-700 text-blue-400'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            {th ? 'โหมด Prop Challenge' : 'Prop Evaluation Mode'}
          </span>
          <span
            className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
              isDark
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>MT5 Read-Only</span>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-3 overflow-hidden">
        {tabId === 'visibility' && (
          <>
            {/* Top 3 KPI Cells */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className={`rounded-lg border p-2.5 sm:p-3 ${subSurface}`}>
                <p className={`text-[10px] font-mono uppercase ${mutedText}`}>
                  {th ? 'พอร์ตที่เชื่อมต่อ' : 'Linked MT5 Account'}
                </p>
                <p className="text-sm sm:text-base font-bold font-mono tabular-nums mt-0.5">
                  #88492015
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {th ? 'Live Bridge (.ex5) · 1.1s' : 'Live Bridge (.ex5) · 1.1s'}
                </p>
              </div>

              <div className={`rounded-lg border p-2.5 sm:p-3 ${subSurface}`}>
                <p className={`text-[10px] font-mono uppercase ${mutedText}`}>
                  {th ? 'ระยะปลอดภัยรายวัน' : 'Daily DD Remaining'}
                </p>
                <p className="text-sm sm:text-base font-bold font-mono tabular-nums mt-0.5 text-blue-600 dark:text-blue-400">
                  $2,352.00
                </p>
                <p className={`text-[10px] font-mono tabular-nums mt-0.5 ${mutedText}`}>
                  78.4% of $3,000 cap
                </p>
              </div>

              <div className={`rounded-lg border p-2.5 sm:p-3 ${subSurface}`}>
                <p className={`text-[10px] font-mono uppercase ${mutedText}`}>
                  {th ? 'กฎ Consistency 40%' : 'Consistency 40% Cap'}
                </p>
                <p className="text-sm sm:text-base font-bold font-mono tabular-nums mt-0.5">
                  24.8%
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  PASS (&lt; 40.0% Max Day)
                </p>
              </div>
            </div>

            {/* 3-TP / 4-TP 5-State Ladder Split */}
            <div className={`rounded-lg border p-3 sm:p-3.5 ${subSurface} flex-1 flex flex-col justify-between`}>
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-inherit">
                <div>
                  <p className="text-xs font-semibold">
                    {th
                      ? 'เครื่องคำนวณ 4-TP Ladder (5-State Math) · XAUUSD'
                      : '4-TP Ladder Calculator (5-State Math) · XAUUSD'}
                  </p>
                  <p className={`text-[10px] font-mono ${mutedText}`}>
                    Entry 2,648.40 · SL 2,642.00 · Risk $480.00 (0.48%)
                  </p>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                  0.75 Lots Split
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 my-2">
                {[
                  { tp: 'TP1', px: '2,654.80', rr: '1.0R', share: '35%', pnl: '+$168' },
                  { tp: 'TP2', px: '2,661.20', rr: '2.0R', share: '30%', pnl: '+$288' },
                  { tp: 'TP3', px: '2,667.60', rr: '3.0R', share: '20%', pnl: '+$288' },
                  { tp: 'TP4', px: '2,674.00', rr: '4.0R', share: '15%', pnl: '+$288' },
                ].map((row) => (
                  <div
                    key={row.tp}
                    className={`rounded border px-2 py-1.5 font-mono text-[10px] ${
                      isDark ? 'bg-[#090b0f] border-neutral-800' : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-semibold">
                      <span>{row.tp}</span>
                      <span>{row.rr}</span>
                    </div>
                    <div className="mt-1 font-bold tabular-nums">{row.px}</div>
                    <div className={`mt-0.5 flex justify-between ${mutedText}`}>
                      <span>{row.share}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{row.pnl}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`flex items-center justify-between text-[10px] font-mono pt-1.5 border-t ${hairline} ${mutedText}`}>
                <span>{th ? 'ซิงก์: Offline PWA + Google Cloud Sync' : 'Offline PWA · Encrypted Cloud Backup'}</span>
                <span>{th ? 'คำสั่งส่งออกเฉพาะ MT5 บนเครื่อง' : 'Sample View · Orders stay in MT5'}</span>
              </div>
            </div>
          </>
        )}

        {tabId === 'limits' && (
          <>
            {/* Configured Risk Thresholds */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`rounded-lg border p-3 ${subSurface}`}>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={mutedText}>{th ? 'เพดานขาดทุนรายวัน' : 'Daily Loss Cap'}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                    $648 / $3,000 (21.6%)
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '21.6%' }} />
                </div>
                <p className={`text-[10px] font-mono mt-1.5 ${mutedText}`}>
                  {th ? 'เตือนล่วงหน้า 55% / 85% / 100%' : 'Escalation thresholds: 55% · 85% · 100%'}
                </p>
              </div>

              <div className={`rounded-lg border p-3 ${subSurface}`}>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={mutedText}>{th ? 'เพดานพอร์ตรวม' : 'Overall Max Floor'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    $648 / $8,000 (8.1%)
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '8.1%' }} />
                </div>
                <p className={`text-[10px] font-mono mt-1.5 ${mutedText}`}>
                  {th ? 'โหมด Prop Challenge · กำไรสุทธิ +$2,480' : 'Prop Mode · High-Water Mark +$2,480'}
                </p>
              </div>
            </div>

            {/* 12-Gate Fail-Closed Checklist */}
            <div className={`rounded-lg border p-3 sm:p-3.5 ${subSurface} flex-1 flex flex-col justify-between`}>
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-semibold">
                    {th
                      ? 'ด่านตรวจวินัย 12-Gate Fail-Closed Protocol'
                      : '12-Gate Fail-Closed Discipline Protocol'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  12 / 12 CLEARED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 my-2.5 text-[10px] font-mono">
                {[
                  '01. Spread < 2.2p',
                  '02. Risk ≤ 0.50%',
                  '03. SL Set First',
                  '04. 15m Cooldown OK',
                  '05. Session Active',
                  '06. 40% Cap Clear',
                  '07. 5-State Valid',
                  '08. Max DD Nominal',
                  '09. News Guard OK',
                  '10. Margin > 800%',
                  '11. MT5 Sync Fresh',
                  '12. No Revenge Tag',
                ].map((gate) => (
                  <div
                    key={gate}
                    className={`flex items-center gap-1.5 rounded border px-2 py-1 truncate ${
                      isDark ? 'bg-[#090b0f] border-neutral-800' : 'bg-white border-neutral-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{gate}</span>
                  </div>
                ))}
              </div>

              <div className={`flex items-center justify-between text-[10px] font-mono pt-1.5 border-t ${hairline}`}>
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Clock className="w-3 h-3" />
                  {th ? 'พักเทรดอัตโนมัติ 15 นาทีหลังชน SL: พร้อมเทรด' : '15-Min Anti-Tilt SL Cooldown: Standby'}
                </span>
                <span className={mutedText}>User-Owned Boundaries</span>
              </div>
            </div>
          </>
        )}

        {tabId === 'trades' && (
          <>
            {/* Verification Header Strip */}
            <div className={`rounded-lg border px-3 py-2 flex flex-wrap items-center justify-between gap-2 ${subSurface}`}>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold">
                  {th ? 'บันทึก MT5 จริง + แฮช .xlsx' : 'Live Bridge (.ex5) · .xlsx SHA-256 Proof'}
                </span>
              </div>
              <span className={`text-[10px] font-mono tabular-nums ${mutedText}`}>
                sha256:9f41...c82b · 142 Deals Audited
              </span>
            </div>

            {/* Deterministic Trade Ledger Table */}
            <div className={`rounded-lg border overflow-hidden flex-1 flex flex-col justify-between ${subSurface}`}>
              <table className="w-full text-left border-collapse font-mono text-[10px] sm:text-[11px]">
                <thead>
                  <tr className={`border-b ${hairline} ${mutedText}`}>
                    <th className="py-2 px-2.5 font-medium">Ticket</th>
                    <th className="py-2 px-2.5 font-medium">Pair</th>
                    <th className="py-2 px-2.5 font-medium hidden sm:table-cell">Setup Engine</th>
                    <th className="py-2 px-2.5 font-medium text-right">Net P&L</th>
                    <th className="py-2 px-2.5 font-medium text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${hairline} tabular-nums`}>
                  {[
                    { ticket: '#9481023', pair: 'XAUUSD', mode: '4-TP Ladder · TP3', pnl: '+$684.50', pos: true, status: '12-Gate OK' },
                    { ticket: '#9481018', pair: 'EURUSD', mode: '3-TP Ladder · TP2', pnl: '+$312.00', pos: true, status: '12-Gate OK' },
                    { ticket: '#9481009', pair: 'US100', mode: 'SL Hit · Cooldown 15m', pnl: '-$240.00', pos: false, status: 'Cooldown Met' },
                    { ticket: '#9480994', pair: 'GBPUSD', mode: 'Macro Swing · TP1', pnl: '+$418.20', pos: true, status: '.xlsx Hashed' },
                  ].map((deal) => (
                    <tr
                      key={deal.ticket}
                      className={isDark ? 'bg-[#090b0f]/60' : 'bg-white'}
                    >
                      <td className={`py-2 px-2.5 ${mutedText}`}>{deal.ticket}</td>
                      <td className="py-2 px-2.5 font-semibold">{deal.pair}</td>
                      <td className={`py-2 px-2.5 hidden sm:table-cell ${mutedText}`}>{deal.mode}</td>
                      <td
                        className={`py-2 px-2.5 text-right font-semibold ${
                          deal.pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {deal.pnl}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                          {deal.status}
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={`px-3 py-2 border-t text-[10px] font-mono flex items-center justify-between ${hairline} ${mutedText}`}>
                <span>{th ? '7-Day & Monthly Calendar Synced' : '7-Day & Monthly P&L Calendar · Zero Signals Sold'}</span>
                <span>100% Real Broker Data</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
