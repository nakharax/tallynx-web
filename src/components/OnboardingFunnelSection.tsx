import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Radio,
  ShieldCheck,
  TrendingUp,
  Upload,
  Volume2,
  Zap,
} from 'lucide-react';
import { getDictionary, type Language } from '../utils/i18n';
import { TALLYNX_DESK_APP_URL } from '../utils/navLogic';
import {
  CloudProviderId,
  ConnectionTierId,
  OnboardingGoalMode,
  OnboardingTransferState,
  buildDeskHandoffUrl,
  persistOnboardingTransferState,
} from '../utils/onboardingLogic';
import {
  MT5_BRIDGE_DOWNLOAD_FILENAME,
  MT5_BRIDGE_PING_URL,
  TWELVE_GATE_ITEMS,
  evaluateTwelveGateReadiness,
  getSevenDayHealthSummary,
  playSoftChime,
} from '../utils/onboardingStepsLogic';
import { InstantRiskCalculator } from './InstantRiskCalculator';
import { IllustrationGallery } from './IllustrationGallery';

interface OnboardingFunnelSectionProps {
  lang: Language;
  isDark: boolean;
  transferState: OnboardingTransferState;
  initialStep?: number;
  hasTransferredParams?: boolean;
  onChangeState: (next: OnboardingTransferState) => void;
}

export const OnboardingFunnelSection: React.FC<OnboardingFunnelSectionProps> = ({
  lang,
  isDark,
  transferState,
  initialStep = 3,
  hasTransferredParams = false,
  onChangeState,
}) => {
  const isTh = lang === 'th';
  const [activeStep, setActiveStep] = useState<number>(initialStep);
  const [selectedTier, setSelectedTier] = useState<ConnectionTierId>(
    transferState.connectedVia || 'xlsx'
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [cloudProvider, setCloudProvider] =
    useState<CloudProviderId>('fundednext_mcp');
  const [cloudAccountId, setCloudAccountId] = useState<string>('FN-88492015');
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Tier 3 (.ex5 Micro-UX) state
  const [ex5Downloaded, setEx5Downloaded] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [mt5ListeningState, setMt5ListeningState] = useState<
    'listening' | 'connected'
  >('listening');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Step 5 (7-day health + 12-Gate)
  const [connectedTier, setConnectedTier] = useState<ConnectionTierId>(
    transferState.connectedVia || 'xlsx'
  );
  const [showTwelveGate, setShowTwelveGate] = useState<boolean>(false);
  const [checkedGates, setCheckedGates] = useState<string[]>(['g1', 'g2', 'g9']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasTransferredParams) {
      setActiveStep(3);
    }
  }, [hasTransferredParams]);

  const updateTransfer = (patch: Partial<OnboardingTransferState>) => {
    const next = persistOnboardingTransferState({
      ...transferState,
      ...patch,
    });
    onChangeState(next);
  };

  const handleSelectGoal = (mode: OnboardingGoalMode) => {
    updateTransfer({
      mode,
      dailyDdLimitPct: mode === 'prop' ? 4.0 : 5.0,
    });
    setActiveStep(4);
  };

  const completeConnection = (tier: ConnectionTierId) => {
    setConnectedTier(tier);
    updateTransfer({ connectedVia: tier });
    setActiveStep(5);
  };

  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    window.setTimeout(() => {
      completeConnection('xlsx');
    }, 350);
  };

  const handleSampleXlsx = () => {
    setUploadedFileName('MT5_Report_88492015_7D.xlsx');
    completeConnection('xlsx');
  };

  const handleCloudConnect = () => {
    if (!cloudAccountId.trim()) return;
    setIsSyncingCloud(true);
    window.setTimeout(() => {
      setIsSyncingCloud(false);
      completeConnection('cloud');
    }, 650);
  };

  const handleDownloadEx5 = () => {
    setEx5Downloaded(true);
    // Provide a lightweight real setup manifest download for immediate tactile confirmation
    const stubInfo = [
      '// TallyNX MT5 Bridge v4.0 Setup Helper',
      `// Endpoint: ${MT5_BRIDGE_PING_URL}`,
      `// Target Account Size: $${transferState.accountSize}`,
      `// Risk Mode: ${transferState.mode.toUpperCase()}`,
      '// Copy TallyNX_Bridge_v4.ex5 into MQL5/Experts and allow WebRequest to telemetry.tallynx.com',
    ].join('\n');
    try {
      const blob = new Blob([stubInfo], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${MT5_BRIDGE_DOWNLOAD_FILENAME}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore download restrictions in headless sandboxes
    }
  };

  const handleCopyBridgeUrl = () => {
    navigator.clipboard?.writeText(MT5_BRIDGE_PING_URL).catch(() => {});
    setCopiedUrl(true);
    window.setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTriggerMt5Ping = () => {
    setMt5ListeningState('connected');
    if (!audioMuted) {
      playSoftChime();
    }
    window.setTimeout(() => {
      completeConnection('ex5');
    }, 900);
  };

  const toggleGateItem = (id: string) => {
    setCheckedGates((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const healthSummary = useMemo(
    () => getSevenDayHealthSummary(transferState, connectedTier),
    [transferState, connectedTier]
  );
  const gateEval = useMemo(
    () => evaluateTwelveGateReadiness(checkedGates),
    [checkedGates]
  );
  const finalDeskUrl = useMemo(
    () => buildDeskHandoffUrl(TALLYNX_DESK_APP_URL, transferState, {
      lang,
      theme: isDark ? 'dark' : 'light',
      page: 'gate',
      via: connectedTier,
      source: 'onboarding_funnel_5step',
    }),
    [transferState, lang, isDark, connectedTier]
  );

  const stepLabels = [
    {
      num: 1,
      titleEn: '15s Risk Engine',
      titleTh: '1. ทดลองคำนวณ 15 วิ',
    },
    {
      num: 2,
      titleEn: 'State Handoff',
      titleTh: '2. ส่งต่อค่าเข้า Desk',
    },
    {
      num: 3,
      titleEn: 'Primary Goal',
      titleTh: '3. เลือกเป้าหมายหลัก',
    },
    {
      num: 4,
      titleEn: '3-Tier Sync',
      titleTh: '4. เชื่อมต่อตามสะดวก',
    },
    {
      num: 5,
      titleEn: 'Live Health & 12-Gate',
      titleTh: '5. สรุป 7 วัน & 12-Gate',
    },
  ];

  return (
    <section
      id="onboarding"
      data-testid="onboarding-funnel-page"
      className="py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header + Transferred Context Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-[#D6D1C7] pb-8 dark:border-neutral-800">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-focus">
              {isTh
                ? 'เริ่มใช้ TallyNX Desk ใน 5 ขั้นตอน'
                : 'TallyNX Desk Setup · 5 Steps'}
            </div>
            <h1 className="mt-2.5 text-3xl font-semibold tracking-[-0.03em] text-[#141618] sm:text-4xl dark:text-white">
              {isTh
                ? 'ลองคำนวณแผน 3-TP ก่อน แล้วค่อยเลือกวิธีเชื่อมต่อ MT5 เมื่อพร้อม'
                : 'See your 3-TP risk math first. Connect your MT5 account only when ready.'}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400 max-w-2xl">
              {isTh
                ? 'ระบบจำขนาดพอร์ตและค่าความเสี่ยงจาก Sandbox ไว้ คุณลองเชื่อมต่อผ่านไฟล์ .xlsx, Cloud API หรือ MT5 Bridge (.ex5) ได้โดยไม่ต้องกรอกใหม่'
                : 'Your account size and risk settings carry over from the Sandbox. Preview .xlsx import, Cloud API sync, or the MT5 Bridge without downloading desktop software.'}
            </p>
          </div>

          {/* Live Transferred Context Chip (clean spec block) */}
          <div
            data-testid="transferred-context-summary"
            className="rounded-xl border border-[#D6D1C7] bg-white/95 px-4 py-3 dark:border-neutral-800 dark:bg-[#1B1E21]/95 shrink-0"
          >
            <div className="text-[11px] font-semibold text-focus">
              {isTh ? 'ค่าที่ส่งต่อจาก Sandbox อัตโนมัติ' : 'Settings from the Sandbox'}
            </div>
            <div className="mt-1 font-mono text-xs font-bold tabular-nums text-[#141618] dark:text-white">
              ${transferState.accountSize.toLocaleString('en-US')} ·{' '}
              {transferState.riskPct}% Risk · {transferState.symbol} ·{' '}
              {transferState.mode === 'prop'
                ? isTh
                  ? 'โหมดสอบกองทุน'
                  : 'Prop 40%'
                : isTh
                  ? 'พอร์ตส่วนตัว'
                  : 'Personal'}
            </div>
          </div>
        </div>

        {/* 5-Step Progress Rail (Single-row horizontal underline strip) */}
        <nav
          aria-label="Onboarding Steps"
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#D6D1C7] bg-white/90 p-1.5 dark:border-neutral-800 dark:bg-[#1B1E21]/90"
        >
          {stepLabels.map((step) => {
            const isCurrent = activeStep === step.num;
            const isDone = activeStep > step.num;
            return (
              <button
                key={step.num}
                type="button"
                data-testid={`onboarding-step-tab-${step.num}`}
                onClick={() => setActiveStep(step.num)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                    : isDone
                      ? 'bg-[#00c07a]/10 text-[#009c63] hover:bg-[#00c07a]/18 dark:text-emerald-300'
                      : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {isDone && <Check className="h-3.5 w-3.5" />}
                <span>{isTh ? step.titleTh : `${step.num}. ${step.titleEn}`}</span>
              </button>
            );
          })}
        </nav>

        {/* STEP 1 & 2 VIEW: Calculator + Transfer Preview */}
        {(activeStep === 1 || activeStep === 2) && (
          <div data-testid="onboarding-step-1-2" className="space-y-6">
            <InstantRiskCalculator
              lang={lang}
              isDark={isDark}
              transferState={transferState}
              onChangeState={onChangeState}
              onActivateDeskFlow={() => setActiveStep(3)}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center desk-panel p-5 sm:p-6">
              <div className="lg:col-span-5 overflow-hidden rounded-xl bg-[#0c0f1d]">
                <img
                  src="/assets/mt5-guide/funnel-step1-2-sandbox.gif"
                  alt={
                    isTh
                      ? 'ภาพเคลื่อนไหว 5 วินาที: ทดลองคำนวณความเสี่ยง 3-TP และส่งต่อค่าเข้า TallyNX Desk ในคลิกเดียว'
                      : '5-second auto-looping walkthrough: Steps 1-2 instant 3-TP risk math and 1-click Desk state transfer'
                  }
                  data-testid="funnel-step1-2-gif"
                  width={600}
                  height={340}
                  loading="lazy"
                  decoding="async"
                  className="block w-full h-auto"
                />
              </div>
              <div className="lg:col-span-7 space-y-2">
                <div className="font-mono text-xs font-semibold text-focus">
                  {isTh
                    ? 'ตัวอย่างภาพการทำงาน · ขั้นตอนที่ 1–2 (5s Loop)'
                    : 'Animated Walkthrough · Steps 1–2 (5s Loop)'}
                </div>
                <h3 className="text-lg font-semibold text-[#141618] dark:text-white">
                  {isTh
                    ? 'ลองปรับ Lot & SL แล้วส่งต่อค่าเข้าสู่โหมดตั้งค่า Guardrail โดยไม่ต้องกรอกใหม่'
                    : 'Adjust your lot size and stop-loss once. Your settings carry over.'}
                </h3>
                <p className="text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'เมื่อกดเปิดใช้งาน ระบบจะส่งขนาดพอร์ต เปอร์เซ็นต์ความเสี่ยง สัญลักษณ์ และค่ากฎ Consistency 40% ไปยังขั้นถัดไปและ TallyNX Desk'
                    : 'Activate carries your account balance, risk percentage, symbol, and 40% consistency setting into the next step and TallyNX Desk.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRIMARY GOAL PICKER (10 Seconds · 1 Question · 2 Big Choices) */}
        {activeStep === 3 && (
          <div data-testid="onboarding-step-3" className="space-y-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold text-focus">
                {isTh
                  ? 'ขั้นตอนที่ 3 · ใช้เวลา 10 วินาที (1 คำถาม)'
                  : 'Step 3 · Takes 10 Seconds (Single Question)'}
              </div>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[#141618] dark:text-white">
                {isTh
                  ? 'เป้าหมายหลักของพอร์ตนี้คืออะไร? (ตั้งค่า Guardrail อัตโนมัติ)'
                  : 'Which trading goal fits this account right now?'}
              </h2>
              <p className="mt-1.5 text-sm text-[#2B2D2F] dark:text-neutral-400">
                {isTh
                  ? 'แต่ละโหมดมีค่าเริ่มต้นสำหรับเพดานขาดทุนและการตรวจ Consistency'
                  : 'Your choice sets the default drawdown limit and consistency checks.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Prop Evaluation Card */}
              <button
                type="button"
                data-testid="goal-card-prop"
                onClick={() => handleSelectGoal('prop')}
                aria-pressed={transferState.mode === 'prop'}
                className="tnx-choice-card group flex flex-col justify-between rounded-2xl border p-6 text-left transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-focus/10 text-focus dark:bg-focus/15">
                      <Award className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-mono font-semibold text-focus">
                      {isTh ? 'กฎสอบกองทุน' : 'Prop Compliance'}
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl bg-[#0c0f1d]">
                    <img
                      src="/assets/mt5-guide/goal-prop-preview.gif"
                      alt={
                        isTh
                          ? 'ภาพเคลื่อนไหว 5 วินาที: โหมดสอบกองทุนคุมกฎ Consistency 40% และเพดาน Daily DD 4%'
                          : '5-second auto-looping walkthrough: Prop Evaluation 40% Consistency Rule & 4% Daily DD preset'
                      }
                      data-testid="goal-prop-gif"
                      width={600}
                      height={340}
                      loading="eager"
                      decoding="async"
                      className="block w-full h-auto"
                    />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-[#141618] dark:text-white">
                    {isTh
                      ? 'โหมดสอบกองทุน (Prop Evaluation)'
                      : 'Prop Evaluation Mode'}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'ตั้งเพดาน Drawdown รายวันไว้ที่ 4% และเช็กกำไรวันที่ทำได้สูงสุดเทียบกับเพดาน Consistency 40%'
                      : 'This mode sets a 4% daily drawdown limit and checks your best day against the 40% consistency cap.'}
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-[#141618] dark:text-neutral-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00c07a] shrink-0" />
                      <span>
                        {isTh
                          ? 'ตรวจเช็ก Consistency 40% รายวันแบบเรียลไทม์'
                          : '40% Best-Day Consistency Rule auto-tracking'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00c07a] shrink-0" />
                      <span>
                        {isTh
                          ? 'คำนวณระยะที่เหลือก่อนถึงเพดานขาดทุน (4.0% ต่อวัน)'
                          : 'Remaining room before the daily drawdown limit (4.0%)'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#141618] px-4 py-2.5 text-xs font-bold text-white group-hover:bg-accent-solid dark:bg-[#F8F6F0] dark:text-[#141618] dark:group-hover:bg-focus transition self-start">
                  <span>
                    {isTh
                      ? 'เลือกโหมดสอบกองทุนและไปต่อ'
                      : 'Select Prop Evaluation'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Personal Account Card */}
              <button
                type="button"
                data-testid="goal-card-personal"
                onClick={() => handleSelectGoal('personal')}
                aria-pressed={transferState.mode === 'personal'}
                className="tnx-choice-card group flex flex-col justify-between rounded-2xl border p-6 text-left transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8F6F0] text-focus dark:bg-focus/20">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-mono font-semibold text-focus">
                      {isTh ? 'คำนวณ Lot ตามทุน' : 'Position Sizing'}
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl bg-[#0c0f1d]">
                    <img
                      src="/assets/mt5-guide/goal-personal-preview.gif"
                      alt={
                        isTh
                          ? 'ภาพเคลื่อนไหว 5 วินาที: โหมดพอร์ตส่วนตัวคำนวณ Lot ทบต้นและล็อกพักสติ 15 นาที'
                          : '5-second auto-looping walkthrough: Personal Account dynamic compounding & 5% tilt lock preset'
                      }
                      data-testid="goal-personal-gif"
                      width={600}
                      height={340}
                      loading="eager"
                      decoding="async"
                      className="block w-full h-auto"
                    />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-[#141618] dark:text-white">
                    {isTh
                      ? 'โหมดพอร์ตส่วนตัว (Personal Account)'
                      : 'Personal Account Mode'}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'คำนวณขนาด Lot จากทุนปัจจุบันและความเสี่ยงต่อไม้ โหมดนี้ไม่มีเพดาน Consistency 40%'
                      : 'Size positions using current equity and risk per trade. This mode has no 40% consistency cap.'}
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-[#141618] dark:text-neutral-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00c07a] shrink-0" />
                      <span>
                        {isTh
                          ? 'คำนวณขนาด Lot ทบต้นตาม Risk % จริงของพอร์ต'
                          : 'Dynamic compounding lot sizing on current equity'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00c07a] shrink-0" />
                      <span>
                        {isTh
                          ? 'คุมเพดานขาดทุนรายวันแบบยืดหยุ่น (5.0%) + กัน Over-trade'
                          : 'Flexible 5.0% personal daily loss guardrail & tilt lock'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#D6D1C7] bg-white px-4 py-2.5 text-xs font-bold text-[#141618] group-hover:border-focus group-hover:bg-accent-solid group-hover:text-white dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-white transition self-start">
                  <span>
                    {isTh
                      ? 'เลือกโหมดพอร์ตส่วนตัวและไปต่อ'
                      : 'Select Personal Account'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: 3-TIER FRICTION LADDER + EX5 MICRO-UX RESCUE */}
        {activeStep === 4 && (
          <div data-testid="onboarding-step-4" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-focus">
                  {isTh
                    ? 'ขั้นตอนที่ 4 · ทดลองเชื่อมต่อข้อมูล 3 วิธี'
                    : 'Step 4 · Preview Three Connection Methods'}
                </div>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[#141618] dark:text-white">
                  {isTh
                    ? 'เลือกวิธีเชื่อมต่อที่อยากลอง'
                    : 'Choose a connection method to try'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D6D1C7] bg-white/95 px-3.5 text-xs font-semibold text-[#2B2D2F] hover:text-[#141618] dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-300 cursor-pointer self-start"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{isTh ? 'เปลี่ยนเป้าหมาย' : 'Change Goal'}</span>
              </button>
            </div>

            {/* 3 Ordered Friction Ladder Tier Selector Cards */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Tier 1: .xlsx (0 min) */}
              <button
                type="button"
                data-testid="tier-card-xlsx"
                onClick={() => setSelectedTier('xlsx')}
                aria-pressed={selectedTier === 'xlsx'}
                className="tnx-choice-card flex flex-col justify-between rounded-2xl border p-6 text-left transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#00c07a] dark:text-emerald-400">
                      {isTh ? '1. เริ่มได้ทันที · 0 นาที' : '1. Instant Start · 0 min'}
                    </span>
                    <FileSpreadsheet className="h-4 w-4 text-[#00c07a]" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-[#141618] dark:text-white">
                    {isTh
                      ? 'อัปโหลดไฟล์รายงาน .xlsx'
                      : 'Upload .xlsx Statement'}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'ลองเลือกไฟล์จากมือถือหรือคอมพิวเตอร์ แล้วดูสรุปวินัยและ Consistency 7 วันจากข้อมูลตัวอย่าง'
                      : 'Try selecting a file from your phone or computer and see a sample seven-day consistency and discipline summary.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#D6D1C7] dark:border-neutral-800 text-[11px] font-semibold text-[#009c63] dark:text-emerald-400">
                  {isTh ? 'ไม่ต้องติดตั้งโปรแกรม →' : 'No installation needed →'}
                </div>
              </button>

              {/* Tier 2: Cloud API (1 min) */}
              <button
                type="button"
                data-testid="tier-card-cloud"
                onClick={() => setSelectedTier('cloud')}
                aria-pressed={selectedTier === 'cloud'}
                className="tnx-choice-card flex flex-col justify-between rounded-2xl border p-6 text-left transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-focus">
                      {isTh ? '2. ซิงก์อัตโนมัติ · 1 นาที' : '2. Auto-Sync · 1 min'}
                    </span>
                    <Cloud className="h-4 w-4 text-focus" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-[#141618] dark:text-white">
                    Cloud API (FundedNext MCP / Myfxbook)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'ทดลองซิงก์ข้อมูลแบบอ่านอย่างเดียวผ่าน Cloud API ได้โดยไม่ต้องเปิด MT5 ค้างไว้'
                      : 'Try read-only Cloud API sync without keeping MT5 open on your computer.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#D6D1C7] dark:border-neutral-800 text-[11px] font-semibold text-focus">
                  {isTh ? 'ไม่ต้องเปิด MT5 บน PC ค้างไว้ →' : 'No desktop install needed →'}
                </div>
              </button>

              {/* Tier 3: MT5 Live Bridge .ex5 (3 min) */}
              <button
                type="button"
                data-testid="tier-card-ex5"
                onClick={() => setSelectedTier('ex5')}
                aria-pressed={selectedTier === 'ex5'}
                className="tnx-choice-card flex flex-col justify-between rounded-2xl border p-6 text-left transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-focus">
                      {isTh ? '3. เชื่อมต่อผ่าน MT5 Bridge · 3 นาที' : '3. MT5 Bridge · 3 min'}
                    </span>
                    <Zap className="h-4 w-4 text-focus" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-[#141618] dark:text-white">
                    MT5 Live Bridge (.ex5)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'ดูขั้นตอนตั้งค่า Bridge ซึ่งอ่าน Drawdown ในเวลาต่ำกว่า 1.4 วินาที หน้านี้ใช้สัญญาณจำลอง'
                      : 'Preview setup for the bridge, which polls floating drawdown in under 1.4 seconds. This step uses a simulated ping.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#D6D1C7] dark:border-neutral-800 text-[11px] font-semibold text-focus">
                  {isTh ? 'ดูขั้นตอนตั้งค่าและลองส่ง Ping →' : 'Preview setup and simulate a ping →'}
                </div>
              </button>
            </div>

            {/* Active Tier Action Panel */}
            <div className="desk-panel p-6 sm:p-8">
              {/* TIER 1 ACTIVE CONTENT (.xlsx Instant) */}
              {selectedTier === 'xlsx' && (
                <div
                  data-testid="tier-panel-xlsx"
                  className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="text-xs font-mono font-semibold text-[#00c07a]">
                      {isTh
                        ? 'Tier 1 · อัปโหลด .xlsx ทันที (ไม่ต้องล็อกอินพอร์ต)'
                        : 'Tier 1 · Zero-Install .xlsx Statement Import'}
                    </div>
                    <h3 className="text-xl font-semibold text-[#141618] dark:text-white">
                      {isTh
                        ? 'เลือกไฟล์ Report History (.xlsx / .csv) จาก MT5 หรือทดลองข้อมูลตัวอย่าง'
                        : 'Choose an MT5 report (.xlsx or .csv) or use the sample ledger'}
                    </h3>
                    <p className="text-sm text-[#2B2D2F] dark:text-neutral-400">
                      {isTh
                        ? 'เลือกไฟล์เพื่อทดลองขั้นตอนนำเข้า ระบบจะแสดงผลสรุป 7 วันจากข้อมูลตัวอย่าง'
                        : 'Try the file selection flow and preview a seven-day discipline audit using sample data.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleXlsxUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        data-testid="xlsx-browse-btn"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#141618] px-4 text-xs font-bold text-white hover:bg-[#141618] dark:bg-white dark:text-[#141618] cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        <span>
                          {isTh
                            ? 'เลือกไฟล์ .xlsx จากเครื่อง'
                            : 'Select .xlsx Report File'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid="xlsx-sample-btn"
                        onClick={handleSampleXlsx}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-focus bg-focus/10 px-4 text-xs font-bold text-focus hover:bg-accent-solid hover:text-white transition cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>
                          {isTh
                            ? 'ใช้ไฟล์ตัวอย่าง .xlsx (ทดลองดูผลทันที)'
                            : 'Load Sample .xlsx Statement (Instant Preview)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="overflow-hidden rounded-xl bg-[#0c0f1d]">
                      <img
                        src="/assets/mt5-guide/tier1-xlsx-import.gif"
                        alt={
                          isTh
                            ? 'ภาพเคลื่อนไหว 5 วินาที: อัปโหลดไฟล์ .xlsx เพื่อวิเคราะห์กราฟวินัย 7 วันทันที'
                            : '5-second auto-looping walkthrough: Drop .xlsx trade report to parse 7-day consistency instantly'
                        }
                        data-testid="tier1-xlsx-gif"
                        width={600}
                        height={340}
                        loading="eager"
                        decoding="async"
                        className="block w-full h-auto"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#D6D1C7] dark:border-neutral-800">
                      <div className="text-xs font-bold text-[#141618] dark:text-white truncate">
                        {uploadedFileName ||
                          (isTh ? 'พร้อมรับไฟล์ MT5 Trade History' : 'Ready for MT5 Trade History')}
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-[#00c07a] shrink-0">
                        {isTh ? 'ข้อมูลตัวอย่าง' : 'Sample data'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TIER 2 ACTIVE CONTENT (Cloud API) */}
              {selectedTier === 'cloud' && (
                <div
                  data-testid="tier-panel-cloud"
                  className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="text-xs font-mono font-semibold text-focus">
                      {isTh
                        ? 'Tier 2 · Cloud API Read-Only Sync (1 นาที)'
                        : 'Tier 2 · Read-Only Cloud API Sync (1 min)'}
                    </div>
                    <h3 className="text-xl font-semibold text-[#141618] dark:text-white">
                      {isTh
                        ? 'ทดลองขั้นตอนซิงก์คลาวด์ด้วยรหัสบัญชีตัวอย่าง'
                        : 'Preview the cloud sync flow with a sample account ID'}
                    </h3>

                    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] p-1 dark:border-neutral-800 dark:bg-[#141618]">
                      {[
                        { id: 'fundednext_mcp' as CloudProviderId, label: 'FundedNext MCP (Prop)' },
                        { id: 'myfxbook' as CloudProviderId, label: 'Myfxbook Investor API' },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setCloudProvider(prov.id)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                            cloudProvider === prov.id
                              ? 'bg-accent-solid text-white'
                              : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-300 dark:hover:text-white'
                          }`}
                        >
                          {prov.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <input
                        type="text"
                        value={cloudAccountId}
                        onChange={(e) => setCloudAccountId(e.target.value)}
                        aria-label={isTh ? 'รหัสบัญชีตัวอย่าง' : 'Sample account ID'}
                        placeholder="Sample account ID"
                        className="h-10 rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3.5 font-mono text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-[#141618] dark:text-white"
                      />
                      <button
                        type="button"
                        data-testid="cloud-sync-connect-btn"
                        onClick={handleCloudConnect}
                        disabled={isSyncingCloud}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#141618] px-4 text-xs font-bold text-white hover:bg-accent-solid dark:bg-white dark:text-[#141618] transition cursor-pointer disabled:opacity-60"
                      >
                        {isSyncingCloud ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Cloud className="h-4 w-4" />
                        )}
                        <span>
                          {isSyncingCloud
                            ? isTh
                              ? 'กำลังจำลองการซิงก์...'
                              : 'Simulating sync...'
                            : isTh
                              ? 'ทดลองซิงก์คลาวด์'
                              : 'Simulate Cloud Sync'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="overflow-hidden rounded-xl bg-[#0c0f1d]">
                      <img
                        src="/assets/mt5-guide/tier2-cloud-sync.gif"
                        alt={
                          isTh
                            ? 'ภาพเคลื่อนไหว 5 วินาที: เชื่อมต่อ Cloud API FundedNext MCP และ Myfxbook แบบอ่านอย่างเดียว'
                            : '5-second auto-looping walkthrough: Connect FundedNext MCP or Myfxbook Cloud API read-only sync'
                        }
                        data-testid="tier2-cloud-gif"
                        width={600}
                        height={340}
                        loading="eager"
                        decoding="async"
                        className="block w-full h-auto"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#D6D1C7] dark:border-neutral-800">
                      <span className="text-xs font-bold text-[#141618] dark:text-white">
                        {isTh ? 'Non-Custodial Read-Only' : 'Read-Only Cloud Permission'}
                      </span>
                      <span className="font-mono text-[10px] text-[#2B2D2F] dark:text-neutral-400">
                        ✓ Read Equity · ✕ Zero Orders
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TIER 3 ACTIVE CONTENT (.ex5 Drop-Off Rescue Micro-UX) */}
              {selectedTier === 'ex5' && (
                <div data-testid="tier-panel-ex5" className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D6D1C7] pb-5 dark:border-neutral-800">
                    <div>
                      <div className="text-xs font-mono font-semibold text-focus">
                        {isTh
                          ? 'วิธีที่ 3 · ตัวอย่างการตั้งค่า MT5 Bridge (.ex5)'
                          : 'Tier 3 · MT5 Bridge (.ex5) Setup Preview'}
                      </div>
                      <h3 className="mt-1 text-xl font-semibold text-[#141618] dark:text-white">
                        {isTh
                          ? 'ดูขั้นตอนติดตั้ง 3 ขั้น แล้วลองจำลองสัญญาณแรกจาก MT5'
                          : 'Review the three setup steps, then simulate the first MT5 ping'}
                      </h3>
                    </div>

                    {/* 1-Click Copy API URL Quick Bar */}
                    <div className="flex items-center gap-2 rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] p-1 pl-3 dark:border-neutral-700 dark:bg-[#141618]">
                      <code className="font-mono text-[11px] text-[#141618] dark:text-neutral-200 truncate max-w-[200px] sm:max-w-[260px]">
                        {MT5_BRIDGE_PING_URL}
                      </code>
                      <button
                        type="button"
                        data-testid="copy-ex5-url-btn"
                        onClick={handleCopyBridgeUrl}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md bg-accent-solid px-3 text-[11px] font-bold text-white hover:bg-[#5538db] transition cursor-pointer shrink-0"
                      >
                        {copiedUrl ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>{isTh ? 'คัดลอกแล้ว' : 'Copied URL'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{isTh ? 'คัดลอก URL' : 'Copy URL'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3 Horizontal/Vertical Visual Walkthrough Cards with 5-Second Auto-Looping GIFs */}
                  <IllustrationGallery
                    lang={lang}
                    ex5Downloaded={ex5Downloaded}
                    copiedUrl={copiedUrl}
                    onDownloadEx5={handleDownloadEx5}
                    onCopyBridgeUrl={handleCopyBridgeUrl}
                  />

                  {/* Auto-Listening Spinner Bar */}
                  <div
                    data-testid="mt5-auto-listener"
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-hairline bg-panel p-4 sm:p-5"
                  >
                    <div className="flex items-center gap-3.5">
                      {mt5ListeningState === 'connected' ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00c07a] text-white shrink-0">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-focus/12 text-focus shrink-0">
                          <Radio className="h-4 w-4 animate-pulse motion-reduce:animate-none" />
                        </div>
                      )}

                      <div>
                        <div className="text-sm font-bold text-[#141618] dark:text-white">
                          {mt5ListeningState === 'connected'
                            ? isTh
                              ? 'ได้รับสัญญาณ Heartbeat จำลองแล้ว'
                              : 'Simulated MT5 heartbeat received'
                            : isTh
                              ? 'พร้อมทดลองส่งสัญญาณ MT5'
                              : 'Ready to simulate an MT5 heartbeat'}
                        </div>
                        <div className="text-xs text-[#2B2D2F] dark:text-neutral-400 mt-0.5">
                          {mt5ListeningState === 'connected'
                            ? isTh
                              ? 'กำลังโหลดสรุปพอร์ต 7 วันจากข้อมูลตัวอย่าง…'
                              : 'Loading the sample seven-day account summary…'
                            : isTh
                              ? 'กดปุ่มจำลองเพื่อดูการแจ้งเตือนเมื่อตัวเชื่อมต่อได้รับสัญญาณ'
                              : 'Simulate the first ping to preview the bridge confirmation.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setAudioMuted((prev) => !prev)}
                        aria-label="Toggle chime sound"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6D1C7] bg-white text-[#2B2D2F] hover:text-[#141618] dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-300 cursor-pointer"
                        title={audioMuted ? 'Sound Muted' : 'Audio Chime On'}
                      >
                        <Volume2 className={`h-4 w-4 ${audioMuted ? 'opacity-40' : 'text-focus'}`} />
                      </button>

                      <button
                        type="button"
                        data-testid="simulate-ex5-ping-btn"
                        onClick={handleTriggerMt5Ping}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent-solid px-4 text-xs font-bold text-white hover:bg-[#5538db] transition cursor-pointer whitespace-nowrap"
                      >
                        <span>
                          {mt5ListeningState === 'connected'
                            ? isTh
                              ? 'เข้าสู่สรุป 7 วัน'
                              : 'Open 7-Day Health'
                            : isTh
                              ? 'จำลองสัญญาณ Ping แรก'
                              : 'Simulate First EA Ping'}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: LIVE HEARTBEAT CONFIRMED + 7-DAY PORT HEALTH + 12-GATE FIRST CTA */}
        {activeStep === 5 && (
          <div data-testid="onboarding-step-5" className="space-y-8">
            {/* Green Heartbeat Confirmation Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 desk-panel p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00c07a] text-white shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-[#009c63] dark:text-emerald-400">
                    {isTh ? 'ขั้นตอนที่ 5 · สรุปพอร์ต 7 วัน' : 'Step 5 · Seven-Day Account Summary'} ·{' '}
                    {healthSummary.heartbeatLatencyMs} ms
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-[#141618] dark:text-white">
                    {isTh ? healthSummary.sourceLabelTh : healthSummary.sourceLabelEn}
                  </h2>
                  <p className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-300">
                    {isTh
                      ? `สรุป 7 วันจากข้อมูลตัวอย่างสำหรับพอร์ต $${transferState.accountSize.toLocaleString()} (${transferState.mode === 'prop' ? 'โหมดสอบกองทุน 40%' : 'พอร์ตส่วนตัว'})`
                      : `Sample seven-day results for a $${transferState.accountSize.toLocaleString()} account (${transferState.mode === 'prop' ? 'Prop 40% Rule' : 'Personal Account'}).`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D6D1C7] bg-white px-3.5 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-white cursor-pointer self-start lg:self-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{isTh ? 'เปลี่ยนช่องทางซิงก์' : 'Switch Sync Tier'}</span>
              </button>
            </div>

            {/* 7-Day Health Metrics Strip & Bar Grid */}
            <div className="desk-panel p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-b border-[#D6D1C7] pb-6 dark:border-neutral-800">
                <div>
                  <div className="text-xs text-[#2B2D2F] dark:text-neutral-400">
                    {isTh ? 'กำไรสุทธิ 7 วันล่าสุด' : '7-Day Net P&L'}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#00c07a]">
                    +${healthSummary.netProfitUsd.toLocaleString('en-US')} (+
                    {healthSummary.netReturnPct}%)
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#2B2D2F] dark:text-neutral-400">
                    {isTh ? 'วันที่กำไรสูงสุดเทียบกฎ 40%' : 'Best Day vs 40% Cap'}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141618] dark:text-white">
                    {healthSummary.bestDaySharePct}%{' '}
                    <span className="text-xs font-semibold text-[#00c07a]">
                      {healthSummary.consistencyPass ? 'PASS' : 'WATCH'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#2B2D2F] dark:text-neutral-400">
                    {isTh ? 'ระยะก่อนถึงเพดาน Daily DD' : 'Room Before the Daily DD Limit'}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-focus">
                    ${healthSummary.dailyBufferRemainingUsd.toLocaleString('en-US')}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#2B2D2F] dark:text-neutral-400">
                    {isTh ? 'Win Rate 7 วันแรก' : '7-Day Disciplined Win Rate'}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-focus">
                    {healthSummary.winRatePct}%
                  </div>
                </div>
              </div>

              {/* 7 Daily Columns (single hairline-divided table strip — zero nested 7-card clutter) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-[#141618] dark:text-white">
                    {isTh
                      ? 'รายละเอียดผลลัพธ์รายวัน 7 วันแรก'
                      : 'Initial 7-Day Performance Breakdown'}
                  </span>
                  <span className="font-mono text-[#2B2D2F] dark:text-neutral-400">
                    Max DD Used: {healthSummary.maxDrawdownUsedPct}%
                  </span>
                </div>
                <div className="grid grid-cols-7 divide-x divide-[#D6D1C7] overflow-hidden rounded-xl border border-[#D6D1C7] bg-[#F8F6F0]/60 dark:divide-neutral-800 dark:border-neutral-800 dark:bg-[#141618]/60">
                  {healthSummary.days.map((d) => (
                    <div
                      key={d.dayLabel}
                      className="p-2.5 text-center"
                    >
                      <div className="text-[11px] font-medium text-[#2B2D2F] dark:text-neutral-400">
                        {d.dayLabel}
                      </div>
                      <div
                        className={`mt-1 font-mono text-xs font-bold tabular-nums ${
                          d.pnlUsd >= 0
                            ? 'text-[#00c07a]'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {d.pnlUsd >= 0 ? `+$${d.pnlUsd}` : `-$${Math.abs(d.pnlUsd)}`}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-[#5C5852]">
                        {d.trades} trades
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary CTA + 5s Looping 12-Gate Preview Strip */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center pt-5 border-t border-[#D6D1C7] dark:border-neutral-800">
                <div className="lg:col-span-5 overflow-hidden rounded-xl bg-[#0c0f1d]">
                  <img
                    src="/assets/mt5-guide/step5-twelve-gate.gif"
                    alt={
                      isTh
                        ? 'ภาพเคลื่อนไหว 5 วินาที: เช็กลิสต์วินัย 12 ด่านก่อนเข้าเทรดไม้ถัดไป'
                        : '5-second auto-looping walkthrough: 12-Gate Pre-Trade Discipline Checklist'
                    }
                    data-testid="step5-twelve-gate-gif"
                    width={600}
                    height={340}
                    loading="lazy"
                    decoding="async"
                    className="block w-full h-auto"
                  />
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <div className="font-mono text-xs font-semibold text-focus">
                      {isTh
                        ? 'เช็กลิสต์ 12-Gate ก่อนเทรด'
                        : 'Pre-Trade 12-Gate Checklist'}
                    </div>
                    <p className="mt-1 text-sm text-[#2B2D2F] dark:text-neutral-300 leading-relaxed">
                      {isTh
                        ? 'ลองเช็กเงื่อนไข 12 ข้อก่อนเปิดออเดอร์ เช่น Spread ข่าวสำคัญ เพดานขาดทุนรายวัน และช่วงพักหลังชน SL'
                        : 'Try the 12-point pre-trade checklist. It covers spread, high-impact news, daily drawdown, and the cooldown after a stop-loss.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      data-testid="start-12-gate-btn"
                      onClick={() => setShowTwelveGate((prev) => !prev)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-solid px-5 text-xs font-bold text-white hover:bg-[#5538db] transition cursor-pointer whitespace-nowrap"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {isTh
                          ? 'เริ่มเช็กวินัย 12 ด่าน (12-Gate) สำหรับไม้ถัดไป'
                          : 'Start 12-Gate Discipline Check (Next Trade)'}
                      </span>
                    </button>

                    <a
                      href={finalDeskUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="step5-launch-desk-link"
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#141618] px-5 text-xs font-bold text-white hover:bg-[#141618] dark:bg-white dark:text-[#141618] transition whitespace-nowrap"
                    >
                      <span>{getDictionary(lang).nav.openDesk}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive 12-Gate Discipline Checklist Panel */}
            {showTwelveGate && (
              <div
                data-testid="twelve-gate-checklist-panel"
                className="desk-panel p-6 sm:p-8 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D6D1C7] pb-4 dark:border-neutral-800">
                  <div>
                    <div className="text-xs font-mono font-semibold text-focus">
                      {isTh ? 'Pre-Trade 12-Gate Guardrail' : 'Pre-Trade 12-Gate Protocol'}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-[#141618] dark:text-white">
                      {isTh
                        ? 'เช็กลิสต์วินัย 12 ด่านก่อนเปิดไม้ถัดไป'
                        : '12-Gate Discipline Checklist for Your Next Setup'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold tabular-nums text-[#141618] dark:text-white">
                      {gateEval.checkedCount}/{gateEval.totalCount}{' '}
                      {isTh ? 'ด่านผ่านแล้ว' : 'Cleared'}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        gateEval.readyToExecute
                          ? 'text-[#00c07a]'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {gateEval.readyToExecute
                        ? isTh
                          ? 'พร้อมเข้าเทรด'
                          : 'READY'
                        : isTh
                          ? 'เช็กด่านสำคัญให้ครบ'
                          : 'CHECK CRITICAL GATES'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {TWELVE_GATE_ITEMS.map((item, idx) => {
                    const checked = checkedGates.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleGateItem(item.id)}
                        aria-pressed={checked}
                        className="tnx-choice-card flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors cursor-pointer"
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            checked
                              ? 'border-[#00c07a] bg-[#00c07a] text-white'
                              : 'border-[#D6D1C7] bg-white dark:border-neutral-700 dark:bg-[#1B1E21]'
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#2B2D2F] dark:text-neutral-400">
                            <span>Gate #{idx + 1}</span>
                            <span>·</span>
                            <span>{item.phase}</span>
                            {item.critical && (
                              <>
                                <span>·</span>
                                <span className="font-bold text-focus">
                                  Critical
                                </span>
                              </>
                            )}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-[#141618] dark:text-neutral-200 leading-snug">
                            {isTh ? item.titleTh : item.titleEn}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
