import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Terminal, Cpu } from 'lucide-react';
import { Language, getDictionary } from '../utils/i18n';

interface ColumnInfrastructureProps {
  lang?: Language;
}

export const ColumnInfrastructure: React.FC<ColumnInfrastructureProps> = ({ lang = 'en' }) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'bridge'>('comparison');
  const t = getDictionary(lang).infrastructure;

  return (
    <section id="architecture" className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="tnx-fade-up max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-focus">
              {t.kicker1}
            </span>
            <span className="text-[#D6D1C7] dark:text-neutral-700">·</span>
            <span className="font-mono text-xs text-[#2B2D2F] dark:text-neutral-400">
              {t.kicker2}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#141618] sm:text-4xl dark:text-white">
            {t.title}
          </h1>
          <p className="mt-2 text-base font-normal text-[#2B2D2F] dark:text-neutral-300">
            {t.subtitle}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
            {t.description}
          </p>
        </div>

        {/* Interactive View Switcher & Comparison */}
        <div className="tnx-fade-up">
          <div className="mt-8 inline-flex flex-wrap items-center gap-1 rounded-lg border border-[#D6D1C7] bg-white/90 p-1 dark:border-neutral-800 dark:bg-[#1B1E21]/90">
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                  : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {t.tabComparison}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bridge')}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'bridge'
                  ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                  : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {t.tabBridge}
            </button>
          </div>

          {/* Tab 1: Direct Architecture vs Typical Cloud Bots */}
          {activeTab === 'comparison' && (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left: Traditional Black-Box / Cloud Bots (The Risky Way) */}
            <div className="desk-panel p-6">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#D6D1C7] dark:border-neutral-800">
                <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 min-w-0">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-xs font-semibold truncate">
                    {t.riskyTitle}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap shrink-0">
                  {t.riskyBadge}
                </span>
              </div>

              <ol className="mt-6 divide-y divide-[#D6D1C7] border-y border-[#D6D1C7] dark:divide-neutral-800 dark:border-neutral-800 font-mono text-xs">
                <li className="flex items-center justify-between py-3 gap-3">
                  <span className="text-[#141618] dark:text-neutral-300">01. Trader Input</span>
                  <span className="text-[#2B2D2F] dark:text-neutral-400">Requires broker password</span>
                </li>
                <li className="flex items-center justify-between py-3 gap-3">
                  <span className="font-semibold text-rose-700 dark:text-rose-300">02. 3rd Party Cloud Bot</span>
                  <span className="text-rose-600 dark:text-rose-400">Remote execution risk</span>
                </li>
                <li className="flex items-center justify-between py-3 gap-3">
                  <span className="text-[#141618] dark:text-neutral-300">03. Multi-IP Execution</span>
                  <span className="text-[#2B2D2F] dark:text-neutral-400">Flags prop firm audits</span>
                </li>
              </ol>

              <ul className="mt-6 space-y-2.5 text-xs text-[#2B2D2F] dark:text-neutral-400">
                {t.riskyBullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: The TallyNX Non-Custodial Architecture */}
            <div className="desk-panel border-[#00c07a]/50 p-6 dark:border-[#00c07a]/40">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#D6D1C7] dark:border-neutral-800">
                <div className="flex items-center space-x-2 text-[#00c07a] min-w-0">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-xs font-semibold truncate">
                    {t.safeTitle}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#00c07a] whitespace-nowrap shrink-0">
                  {t.safeBadge}
                </span>
              </div>

              <ol className="mt-6 divide-y divide-[#D6D1C7] border-y border-[#D6D1C7] dark:divide-neutral-800 dark:border-neutral-800 font-mono text-xs">
                <li className="flex items-center justify-between py-3 gap-3">
                  <span className="font-semibold text-[#141618] dark:text-white">01. Human Trader</span>
                  <span className="text-[#2B2D2F] dark:text-neutral-400">Sets daily caps & rules</span>
                </li>
                <li className="flex items-center justify-between py-3 gap-3">
                  <span className="font-semibold text-[#00c07a]">02. Local EA Bridge (Read-Only)</span>
                  <span className="text-[#00c07a]">&lt; 1.4s lag · 0 custody</span>
                </li>
                <li className="flex items-center justify-between py-3 gap-3">
                  <span className="font-semibold text-[#141618] dark:text-white">03. Local MT5 Native Server</span>
                  <span className="text-[#00c07a]">100% Native IP</span>
                </li>
              </ol>

              <ul className="mt-6 space-y-2.5 text-xs text-[#2B2D2F] dark:text-neutral-400">
                {t.safeBullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#00c07a] shrink-0 mt-0.5" />
                    <span><strong className="text-[#141618] dark:text-white">{b.bold}</strong> {b.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Direct MT5 Bridge Details */}
        {activeTab === 'bridge' && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="desk-panel p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-[#141618] dark:text-white">
                  <Terminal className="h-4 w-4 text-focus" />
                  <h4 className="text-sm font-bold">01. Local Polling</h4>
                </div>
                <p className="mt-2.5 text-xs text-[#2B2D2F] dark:text-neutral-400 leading-relaxed">
                  A compact MQL5 Expert Advisor queries AccountInfoDouble(ACCOUNT_BALANCE) and AccountInfoDouble(ACCOUNT_EQUITY) locally on every tick.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#D6D1C7] dark:border-neutral-800 font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                Tick lag: ~12ms · RAM: &lt; 8MB
              </div>
            </div>

            <div className="desk-panel p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-[#141618] dark:text-white">
                  <Cpu className="h-4 w-4 text-focus" />
                  <h4 className="text-sm font-bold">02. Drawdown Alerts</h4>
                </div>
                <p className="mt-2.5 text-xs text-[#2B2D2F] dark:text-neutral-400 leading-relaxed">
                  The software compares floating loss with your daily cap and warns when drawdown rises quickly.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#D6D1C7] dark:border-neutral-800 font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                Read-only telemetry · 0 order rights
              </div>
            </div>

            <div className="desk-panel p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-[#141618] dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-[#00c07a]" />
                  <h4 className="text-sm font-bold">03. Verifiable Ledger</h4>
                </div>
                <p className="mt-2.5 text-xs text-[#2B2D2F] dark:text-neutral-400 leading-relaxed">
                  The ledger records every closed deal and session boundary in order. Use the session hash to check for later edits.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#D6D1C7] dark:border-neutral-800 font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                SHA-256 session integrity check
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
};
