import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Calculator,
  ExternalLink,
  Maximize2,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { getDictionary, type Language } from '../utils/i18n';
import { TREDYN_DESK_URL, TREDYN_MALL_CHAT_URL } from '../utils/navLogic';
import { buildDeskHandoffUrl, type LinkedDeskScreenId, type OnboardingTransferState } from '../utils/onboardingLogic';

export type DeskScreenshotId = LinkedDeskScreenId | 'mall';

interface DeskScreenItem {
  id: Exclude<DeskScreenshotId, 'chart'>;
  src: string;
  webpSrc: string;
  labelEn: string;
  labelTh: string;
  captionEn: string;
  captionTh: string;
  deskPage: 'mall' | 'analysis' | 'calc' | 'gate';
  Icon: React.FC<{ className?: string }>;
}

const DESK_SCREENS: DeskScreenItem[] = [
  {
    id: 'mall',
    src: '/assets/desk/mall-lounge.png?v=5',
    webpSrc: '/assets/desk/mall-lounge.webp?v=5',
    labelEn: 'Community Mall',
    labelTh: 'คอมมูนิตี้ Mall',
    captionEn:
      'Trader Lounge, 3-TP risk worksheets, and peer journal reviews on mall.tallynx.com.',
    captionTh:
      'ห้องรวม Trader Lounge แผน 3-TP และพื้นที่ทบทวนสมุดเทรดบน mall.tallynx.com',
    deskPage: 'mall',
    Icon: Store,
  },
  {
    id: 'analysis',
    src: '/assets/desk/desk-analysis.png?v=5',
    webpSrc: '/assets/desk/desk-analysis.webp?v=5',
    labelEn: 'Portfolio & 40% Rule',
    labelTh: 'พอร์ตและกฎ 40%',
    captionEn:
      'Live equity overview, daily drawdown buffer, and 7-day consistency rule calendar.',
    captionTh:
      'ภาพรวมทุนในพอร์ต วงเงินขาดทุนรายวัน และปฏิทินตรวจกฎ Consistency 40% ราย 7 วัน',
    deskPage: 'analysis',
    Icon: BarChart3,
  },
  {
    id: 'calc',
    src: '/assets/desk/desk-calc.png?v=5',
    webpSrc: '/assets/desk/desk-calc.webp?v=5',
    labelEn: '3-TP Calculator',
    labelTh: 'คำนวณ 3-TP',
    captionEn:
      'Deterministic 3-TP lot sizing, trailing profit lock, and 5-day prop payout check.',
    captionTh:
      'คำนวณ Lot แบ่งปิด 3 ไม้ จุดล็อกกำไร และตรวจสอบเงื่อนไขถอน Prop 5 วัน',
    deskPage: 'calc',
    Icon: Calculator,
  },
  {
    id: 'gate',
    src: '/assets/desk/desk-12gate.png?v=5',
    webpSrc: '/assets/desk/desk-12gate.webp?v=5',
    labelEn: '12-Gate Guardrail',
    labelTh: 'ด่านวินัย 12-Gate',
    captionEn:
      '12-Gate pre-session checklist covering cooldowns, daily quota, news filter, and spreads.',
    captionTh:
      'เช็กลิสต์วินัย 12 ข้อก่อนเข้าเทรด ทั้งระยะพัก โควตารายวัน ข่าว และค่าสเปรด',
    deskPage: 'gate',
    Icon: ShieldCheck,
  },
];

interface RealDeskEmbedProps {
  lang?: Language;
  isDark: boolean;
  transferState?: OnboardingTransferState;
  variant?: 'hero' | 'section';
  activeScreenId?: DeskScreenshotId;
  onSelectScreen?: (id: DeskScreenshotId) => void;
  onOpenWorkspaceRoute?: () => void;
  className?: string;
}

export const RealDeskEmbed: React.FC<RealDeskEmbedProps> = ({
  lang = 'en',
  isDark,
  transferState,
  variant = 'section',
  activeScreenId,
  onSelectScreen,
  onOpenWorkspaceRoute,
  className = '',
}) => {
  const isTh = lang === 'th';
  const [internalActiveId, setInternalActiveId] =
    useState<DeskScreenshotId>('mall');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const warmedImages = useRef(new Set<DeskScreenshotId>());

  const activeId = activeScreenId === 'chart' ? 'mall' : (activeScreenId ?? internalActiveId);

  const handleSelectScreen = (id: DeskScreenshotId) => {
    setInternalActiveId(id);
    onSelectScreen?.(id);
  };

  const activeScreen =
    DESK_SCREENS.find((item) => item.id === activeId) ?? DESK_SCREENS[0];
  const deskUrl =
    activeScreen.deskPage === 'mall'
      ? buildDeskHandoffUrl(TREDYN_MALL_CHAT_URL, undefined, { lang, theme: isDark ? 'dark' : 'light' })
      : buildDeskHandoffUrl(TREDYN_DESK_URL, transferState, {
          lang,
          theme: isDark ? 'dark' : 'light',
          page: activeScreen.deskPage,
          source: 'desk_preview',
        });
  const openMallLabel = getDictionary(lang).nav.openMall;

  const warmScreenshot = (screen: DeskScreenItem) => {
    if (screen.id === activeId || warmedImages.current.has(screen.id)) return;
    warmedImages.current.add(screen.id);
    const image = new Image();
    image.fetchPriority = 'low';
    image.src = screen.webpSrc;
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen]);

  const isHero = variant === 'hero';

  const renderScreenTabs = (compactHero: boolean) => (
    <div className={`border-hairline px-2.5 py-1.5 ${compactHero ? 'border-t' : 'border-b'}`}>
      <div
        role="tablist"
        aria-label={isTh ? 'ภาพหน้าจอแอป TallyNX Mall และ Desk' : 'TallyNX Mall & Desk views'}
        className="desk-tabs grid w-full grid-cols-2 sm:flex sm:w-auto sm:flex-wrap"
      >
        {DESK_SCREENS.map((screen) => {
          const Icon = screen.Icon;
          const selected = screen.id === activeScreen.id;
          return (
            <button
              key={screen.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`desk-shot-tab-${screen.id}`}
              onClick={() => handleSelectScreen(screen.id)}
              onMouseEnter={() => warmScreenshot(screen)}
              onFocus={() => warmScreenshot(screen)}
              className="desk-tab justify-start text-left text-[11px] sm:justify-center"
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span>{isTh ? screen.labelTh : screen.labelEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div
        data-testid="real-desk-embed"
        className={`max-w-full ${isHero ? '' : 'desk-panel overflow-clip'} ${className}`}
      >
        {!isHero && renderScreenTabs(false)}

        {/* Live Captured v5.0 Mall & Desk Screenshot */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={
            isTh
              ? `คลิกเพื่อขยายภาพ ${activeScreen.labelTh}`
              : `Click to zoom ${activeScreen.labelEn}`
          }
          className="block w-full bg-canvas text-left cursor-zoom-in"
        >
          <picture>
            <source srcSet={activeScreen.webpSrc} type="image/webp" />
            <img
              src={activeScreen.src}
              alt={`TallyNX v5.0 — ${isTh ? activeScreen.labelTh : activeScreen.labelEn}`}
              data-testid="real-desk-screenshot-img"
              width={1024}
              height={687}
              decoding="async"
              fetchPriority={isHero ? 'high' : 'auto'}
              loading={isHero ? 'eager' : 'lazy'}
              className="block h-auto w-full object-contain"
            />
          </picture>
        </button>

        {isHero && renderScreenTabs(true)}

        {/* Clean Minimal Caption Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-3.5 py-2.5 text-xs">
          <p className="min-w-0 flex-1 text-muted truncate sm:whitespace-normal">
            <span className="font-semibold text-[#141618] dark:text-white">
              {isTh ? activeScreen.labelTh : activeScreen.labelEn}
            </span>
            <span className="mx-1.5 text-[#5C5852]" aria-hidden="true">
              ·
            </span>
            <span>{isTh ? activeScreen.captionTh : activeScreen.captionEn}</span>
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="real-desk-enter-fullscreen"
              onClick={() => setLightboxOpen(true)}
              aria-label={isTh ? 'ขยายดูภาพชัดเต็มจอ' : 'Zoom screenshot fullscreen'}
              className="inline-flex min-h-7 items-center gap-1 rounded border border-[#D6D1C7] bg-white px-2 py-1 text-[11px] font-semibold text-[#141618] hover:border-focus hover:text-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer"
            >
              <Maximize2 className="h-3 w-3" />
              <span>{isTh ? 'ขยาย' : 'Zoom'}</span>
            </button>

            {onOpenWorkspaceRoute && !isHero && (
              <button
                type="button"
                onClick={onOpenWorkspaceRoute}
                className="text-[11px] font-semibold text-focus hover:underline shrink-0 cursor-pointer"
              >
                {isTh ? 'ดูทั้งหมด →' : 'Workspace →'}
              </button>
            )}

            {isHero && (
              <a
                href={deskUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-focus hover:underline shrink-0"
              >
                <span>{isTh ? 'เปิดหน้าจริง' : 'Open live'}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Crisp Lightbox Zoom Modal */}
      {lightboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          data-testid="real-desk-fullscreen-frame"
          aria-label={isTh ? 'ภาพหน้าจอ TallyNX Desk ขนาดเต็ม' : 'TallyNX Desk Screenshot Lightbox'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="desk-panel flex max-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-hairline px-4 py-3 text-ink">
              <div className="flex flex-wrap items-center gap-1.5">
                {DESK_SCREENS.map((screen) => {
                  const selected = screen.id === activeId;
                  return (
                    <button
                      key={screen.id}
                      type="button"
                      onClick={() => handleSelectScreen(screen.id)}
                      onMouseEnter={() => warmScreenshot(screen)}
                      onFocus={() => warmScreenshot(screen)}
                      aria-pressed={selected}
                      className="desk-tab"
                    >
                      {isTh ? screen.labelTh : screen.labelEn}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={deskUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="desk-primary px-3 py-2 text-xs"
                >
                  <span>{openMallLabel}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  aria-label={isTh ? 'ปิดภาพขยาย' : 'Close screenshot'}
                  className="rounded border border-hairline p-2 text-ink hover:bg-canvas cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 justify-center bg-canvas p-2">
              <picture>
                <source srcSet={activeScreen.webpSrc} type="image/webp" />
                <img
                  src={activeScreen.src}
                  alt={`TallyNX Desk — ${isTh ? activeScreen.labelTh : activeScreen.labelEn}`}
                  data-testid="real-desk-fullscreen-img"
                  width={1440}
                  height={900}
                  decoding="async"
                  className="block max-h-[72dvh] max-w-full object-contain"
                />
              </picture>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
