import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Copy,
  Download,
  FolderOpen,
  Globe,
  Maximize2,
  X,
} from 'lucide-react';
import { Language } from '../utils/i18n';
import {
  MT5_BRIDGE_DOWNLOAD_FILENAME,
  MT5_BRIDGE_EX5_URL,
  MT5_BRIDGE_MQ5_URL,
} from '../utils/onboardingLogic';

export interface Mt5InstallationStep {
  id: 'download' | 'move' | 'webrequest';
  stepNumber: string;
  testId: string;
  gifSrc: string;
  titleEn: string;
  titleTh: string;
  altEn: string;
  altTh: string;
  descriptionEn: string;
  descriptionTh: string;
  accentColorClass: string;
}

export const MT5_INSTALLATION_STEPS: Mt5InstallationStep[] = [
  {
    id: 'download',
    stepNumber: '01',
    testId: 'mt5-step1-gif',
    gifSrc: '/assets/mt5-guide/step1-download-ex5.gif',
    titleEn: 'Download .ex5',
    titleTh: 'ดาวน์โหลดไฟล์ .ex5',
    altEn: `5-second auto-looping walkthrough: Step 1 Download ${MT5_BRIDGE_DOWNLOAD_FILENAME}`,
    altTh: `ภาพเคลื่อนไหว 5 วินาที: กดดาวน์โหลดไฟล์ ${MT5_BRIDGE_DOWNLOAD_FILENAME}`,
    descriptionEn:
      'Download our lightweight read-only telemetry EA (<8MB RAM, zero trade authority).',
    descriptionTh:
      'ดาวน์โหลดไฟล์ EA สำหรับอ่านค่า Floating DD และประวัติปิดไม้ (<8MB RAM)',
    accentColorClass: 'text-focus',
  },
  {
    id: 'move',
    stepNumber: '02',
    testId: 'mt5-step2-gif',
    gifSrc: '/assets/mt5-guide/step2-move-experts.gif',
    titleEn: 'Move to MQL5/Experts',
    titleTh: 'วางใน MQL5/Experts',
    altEn:
      '5-second auto-looping walkthrough: Step 2 Move .ex5 into MQL5/Experts and refresh Navigator',
    altTh:
      'ภาพเคลื่อนไหว 5 วินาที: ย้ายไฟล์ .ex5 ไปยังโฟลเดอร์ MQL5/Experts แล้วกด Refresh',
    descriptionEn:
      'Drop the file inside MQL5/Experts, click Refresh in Navigator, and drag onto any single chart.',
    descriptionTh:
      'นำไฟล์ไปวางในโฟลเดอร์ MQL5/Experts แล้วกด Refresh ใน MT5 และลากลงกราฟคู่ใดก็ได้ 1 กราฟ',
    accentColorClass: 'text-focus',
  },
  {
    id: 'webrequest',
    stepNumber: '03',
    testId: 'mt5-step3-gif',
    gifSrc: '/assets/mt5-guide/step3-enable-webrequest.gif',
    titleEn: 'Enable WebRequest',
    titleTh: 'อนุญาต URL WebRequest',
    altEn:
      '5-second auto-looping walkthrough: Step 3 Enable WebRequest and paste the TallyNX API URL',
    altTh:
      'ภาพเคลื่อนไหว 5 วินาที: เปิด Allow WebRequest และวางลิงก์ TallyNX API ใน MT5 Options',
    descriptionEn:
      'Check Allow WebRequest and paste the copied URL above so your terminal can send read-only heartbeats.',
    descriptionTh:
      'ติ๊กถูก Allow WebRequest แล้วกดวาง URL ที่คัดลอกไว้ด้านบน เพื่อเปิดท่อส่งสัญญาณอ่านอย่างเดียว',
    accentColorClass: 'text-[#00c07a]',
  },
];

interface IllustrationGalleryProps {
  lang: Language;
  ex5Downloaded: boolean;
  copiedUrl: boolean;
  onDownloadEx5: () => void;
  onCopyBridgeUrl: () => void;
}

export const IllustrationGallery: React.FC<IllustrationGalleryProps> = ({
  lang,
  ex5Downloaded,
  copiedUrl,
  onDownloadEx5,
  onCopyBridgeUrl,
}) => {
  const isTh = lang === 'th';
  const [expandedStep, setExpandedStep] = useState<Mt5InstallationStep | null>(
    null
  );

  useEffect(() => {
    if (!expandedStep) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedStep(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expandedStep]);

  const renderStepIcon = (id: Mt5InstallationStep['id']) => {
    if (id === 'download') return <Download className="h-4 w-4" />;
    if (id === 'move') return <FolderOpen className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  return (
    <>
      <div
        data-testid="illustration-gallery"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {MT5_INSTALLATION_STEPS.map((step) => (
          <div
            key={step.id}
            data-testid={`illustration-gallery-card-${step.id}`}
            className="desk-panel p-5 flex flex-col justify-between"
          >
            <div>
              <div
                className={`flex items-center justify-between text-xs font-mono font-bold ${step.accentColorClass}`}
              >
                <span>
                  {step.stepNumber}. {isTh ? step.titleTh : step.titleEn}
                </span>
                {renderStepIcon(step.id)}
              </div>

              {/* 5-second auto-looping GIF illustration with zoom trigger */}
              <div className="group relative mt-3 overflow-hidden rounded-xl bg-[#0c0f1d]">
                <img
                  src={step.gifSrc}
                  alt={isTh ? step.altTh : step.altEn}
                  data-testid={step.testId}
                  width={600}
                  height={340}
                  loading="eager"
                  decoding="async"
                  className="block w-full h-auto"
                />
                <button
                  type="button"
                  onClick={() => setExpandedStep(step)}
                  aria-label={
                    isTh
                      ? `ขยายภาพเคลื่อนไหว ${step.titleTh}`
                      : `Expand 5s looping guide: ${step.titleEn}`
                  }
                  className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-2.5 py-1 font-mono text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition cursor-pointer backdrop-blur-xs"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>{isTh ? 'ขยาย 5s GIF' : 'Zoom 5s GIF'}</span>
                </button>
              </div>

              <p className="mt-3 text-xs text-[#2B2D2F] dark:text-neutral-400 leading-relaxed">
                {isTh ? step.descriptionTh : step.descriptionEn}
              </p>
            </div>

            {step.id === 'download' && (
              <div className="mt-4 space-y-2">
                <a
                  href={MT5_BRIDGE_EX5_URL}
                  download={MT5_BRIDGE_DOWNLOAD_FILENAME}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="download-ex5-btn"
                  onClick={onDownloadEx5}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#141618] px-4 text-xs font-bold text-white hover:bg-accent-solid dark:bg-white dark:text-[#141618] transition cursor-pointer"
                >
                  {ex5Downloaded ? (
                    <Check className="h-3.5 w-3.5 text-[#00c07a]" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {ex5Downloaded
                      ? isTh
                        ? 'กำลังดาวน์โหลด Live Bridge (.ex5)'
                        : 'Downloading Live Bridge (.ex5)'
                      : isTh
                        ? 'ดาวน์โหลด Live Bridge (.ex5)'
                        : 'Download Live Bridge (.ex5)'}
                  </span>
                </a>
                <div className="text-center font-mono text-[10px] text-[#2B2D2F] dark:text-neutral-400">
                  <a
                    href={MT5_BRIDGE_MQ5_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-focus"
                  >
                    {isTh
                      ? 'ดูโค้ดต้นฉบับที่ตรวจสอบได้ (.mq5)'
                      : 'Inspect open source (.mq5)'}
                  </a>
                </div>
              </div>
            )}

            {step.id === 'move' && (
              <div className="mt-4 pt-3 border-t border-[#D6D1C7] dark:border-neutral-800 font-mono text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                {isTh
                  ? 'ทางลัด: กด Ctrl+Shift+D ใน MT5'
                  : 'Shortcut: Press Ctrl+Shift+D in MT5'}
              </div>
            )}

            {step.id === 'webrequest' && (
              <button
                type="button"
                onClick={onCopyBridgeUrl}
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#D6D1C7] bg-white px-4 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-white cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-focus" />
                <span>
                  {copiedUrl
                    ? isTh
                      ? 'คัดลอก URL เรียบร้อย'
                      : 'URL Copied!'
                    : isTh
                      ? 'คัดลอก URL วางใน Options'
                      : 'Copy URL for MT5 Options'}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Expanded 5-Second Looping Walkthrough Lightbox */}
      {expandedStep && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          data-testid="illustration-gallery-modal"
          aria-label={
            isTh
              ? `ขยายภาพขั้นตอน ${expandedStep.titleTh}`
              : `Expanded walkthrough: ${expandedStep.titleEn}`
          }
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpandedStep(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0e1017] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
              <div className="font-mono text-xs font-bold">
                {expandedStep.stepNumber}.{' '}
                {isTh ? expandedStep.titleTh : expandedStep.titleEn} · 5s Loop
              </div>
              <button
                type="button"
                onClick={() => setExpandedStep(null)}
                aria-label={isTh ? 'ปิดหน้าต่างขยายภาพ' : 'Close expanded walkthrough'}
                className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-[#090b10] p-4">
              <img
                src={expandedStep.gifSrc}
                alt={isTh ? expandedStep.altTh : expandedStep.altEn}
                width={600}
                height={340}
                decoding="async"
                className="mx-auto block w-full h-auto rounded-xl border border-white/10"
              />
              <p className="mt-3 text-xs text-neutral-300 leading-relaxed">
                {isTh ? expandedStep.descriptionTh : expandedStep.descriptionEn}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
