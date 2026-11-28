import React, { useEffect, useState } from 'react';
import { WORKSPACE_TABS, getNextTabIndex } from '../utils/orbitLogic';
import { DrawdownSandbox } from './DrawdownSandbox';
import { TredynDeskPreview } from './TredynDeskPreview';
import { RealDeskEmbed, type DeskScreenshotId } from './RealDeskEmbed';
import { Play, Pause, Maximize2, ExternalLink, ArrowRight, Monitor, Layers } from 'lucide-react';
import { Language, getDictionary } from '../utils/i18n';
import { TALLYNX_DESK_APP_URL, TREDYN_MALL_CHAT_URL } from '../utils/navLogic';
import { buildDeskHandoffUrl, type DeskPage, type OnboardingTransferState } from '../utils/onboardingLogic';

const DESK_PAGE_BY_WALKTHROUGH = {
  visibility: 'analysis',
  limits: 'proprules',
  trades: 'journal',
} satisfies Record<(typeof WORKSPACE_TABS)['en'][number]['id'], DeskPage>;

interface WorkspaceShowcaseProps {
  globalMotionPaused: boolean;
  isDark: boolean;
  lang?: Language;
  transferState?: OnboardingTransferState;
}

export const WorkspaceShowcase: React.FC<WorkspaceShowcaseProps> = ({
  globalMotionPaused,
  isDark,
  lang = 'en',
  transferState,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<'live' | 'walkthrough'>('live');
  const [deskScreenId, setDeskScreenId] = useState<DeskScreenshotId>('analysis');
  const dict = getDictionary(lang);
  const t = dict.workspace;
  const tabs = WORKSPACE_TABS[lang];

  const isAutoPaused = previewPaused || globalMotionPaused;

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

  useEffect(() => {
    if (workspaceMode !== 'walkthrough' || isAutoPaused || isHovered || lightboxOpen) return;

    const intervalMs = 100;
    const cycleDurationMs = 6500;
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setProgressPct((prev) => {
        const next = prev + (intervalMs / cycleDurationMs) * 100;
        if (next >= 100) {
          setSelectedIndex((idx) => getNextTabIndex(idx, tabs.length, 1));
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [workspaceMode, isAutoPaused, isHovered, lightboxOpen, tabs.length]);

  const activeTab = tabs[selectedIndex];
  const page = workspaceMode === 'live'
    ? (deskScreenId === 'chart' ? 'mall' : deskScreenId)
    : DESK_PAGE_BY_WALKTHROUGH[activeTab.id];
  const deskUrl = buildDeskHandoffUrl(page === 'mall' ? TREDYN_MALL_CHAT_URL : TALLYNX_DESK_APP_URL, transferState, {
    lang,
    theme: isDark ? 'dark' : 'light',
    page: page === 'mall' ? undefined : page,
    source: 'workspace_preview',
  });

  const handleManualSelect = (index: number) => {
    setSelectedIndex(index);
    setProgressPct(0);
    setPreviewPaused(true);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleManualSelect(getNextTabIndex(index, tabs.length, 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleManualSelect(getNextTabIndex(index, tabs.length, -1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleManualSelect(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      handleManualSelect(tabs.length - 1);
    }
  };

  return (
    <section
      id="workspace"
      aria-labelledby="workspace-heading"
      className="py-12 lg:py-16 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow & Live Product Link */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-semibold text-focus">
            {t.eyebrow}
          </span>
          <a
            href={deskUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B2D2F] hover:text-focus dark:text-neutral-400 transition-colors"
          >
            <span>{t.visitLink}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Section Heading */}
        <div className="tnx-fade-up mt-4 mb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <h1
            id="workspace-heading"
            className={`lg:col-span-8 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] leading-[1.08] ${
              isDark ? 'text-white' : 'text-[#141618]'
            }`}
          >
            {t.titleLine1}
            <br />
            <span className="text-focus">
              {t.titleAccent}
            </span>
          </h1>
          <p className="lg:col-span-4 lg:justify-self-end text-sm text-[#2B2D2F] dark:text-neutral-400 max-w-sm leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Mode Switcher: Live Real Desk vs 3-View Architectural Walkthrough */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={lang === 'th' ? 'มุมมองโต๊ะเทรด' : 'Workspace view'}
            className={`inline-flex flex-wrap items-center gap-1 rounded-lg border p-1 ${
              isDark
                ? 'border-neutral-800 bg-[#1B1E21]/90'
                : 'border-[#D6D1C7] bg-white/90'
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={workspaceMode === 'live'}
              data-testid="workspace-mode-live"
              onClick={() => setWorkspaceMode('live')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                workspaceMode === 'live'
                  ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                  : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5 text-[#00c07a]" />
              <span>
                {lang === 'th'
                  ? 'ภาพหน้าจอโต๊ะเทรด (4 มุมมอง)'
                  : 'Desk Screenshots (4 Views)'}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={workspaceMode === 'walkthrough'}
              data-testid="workspace-mode-walkthrough"
              onClick={() => setWorkspaceMode('walkthrough')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                workspaceMode === 'walkthrough'
                  ? 'bg-[#141618] text-white dark:bg-white dark:text-[#141618]'
                  : 'text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-focus" />
              <span>
                {lang === 'th'
                  ? 'แนะนำการใช้งาน 3 โมดูล'
                  : 'Module Walkthrough (3 Views)'}
              </span>
            </button>
          </div>
        </div>

        {workspaceMode === 'live' ? (
          <div id="product-stage">
            <RealDeskEmbed
              lang={lang}
              isDark={isDark}
              transferState={transferState}
              variant="section"
              activeScreenId={deskScreenId}
              onSelectScreen={setDeskScreenId}
            />
          </div>
        ) : (
          /* Interactive Product Showcase Box */
          <div
            id="product-stage"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="tnx-fade-up desk-panel grid grid-cols-1 overflow-clip lg:grid-cols-12"
          >
          {/* Left Column: Tab Selectors & Descriptions */}
          <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-inherit">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-inherit">
                <span className="text-xs font-mono text-[#2B2D2F] dark:text-neutral-400">
                  {t.viewsLabel} · 0{selectedIndex + 1} / 0{tabs.length}
                </span>
                <button
                  id="preview-toggle"
                  type="button"
                  aria-pressed={isAutoPaused}
                  onClick={() => {
                    setPreviewPaused((prev) => !prev);
                    setProgressPct(0);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-colors cursor-pointer border ${
                    isDark
                      ? 'bg-[#1B1E21] border-neutral-700 text-neutral-200 hover:border-focus'
                      : 'bg-white border-[#D6D1C7] text-[#141618] hover:border-focus'
                  }`}
                >
                  {isAutoPaused ? <Play className="w-3 h-3 text-focus" /> : <Pause className="w-3 h-3 text-focus" />}
                  <span>{isAutoPaused ? t.playPreview : t.pausePreview}</span>
                </button>
              </div>

              {/* Progress bar */}
              <div
                className={`w-full h-1 my-4 rounded-full overflow-hidden ${
                  isDark ? 'bg-neutral-800' : 'bg-[#F8F6F0]'
                }`}
                aria-hidden="true"
              >
                <div
                  className="h-full bg-focus transition-all duration-150 rounded-full"
                  style={{ width: `${isAutoPaused ? 0 : progressPct}%` }}
                />
              </div>

              {/* Tablist */}
              <div
                role="tablist"
                aria-label={lang === 'th' ? 'หน้าจอ TallyNX Desk' : 'TallyNX Desk workspace views'}
                className="flex flex-col gap-2.5"
              >
                {tabs.map((tab, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      role="tab"
                      type="button"
                      aria-selected={isSelected}
                      aria-controls="product-panel"
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => handleManualSelect(idx)}
                      onKeyDown={(e) => handleTabKeyDown(e, idx)}
                      className="tnx-choice-card text-left p-4 rounded-2xl border transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-bold text-ink">{tab.title}</span>
                        <ArrowRight
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 ${isSelected ? 'text-focus' : 'text-muted'}`}
                        />
                      </div>
                      <p className="text-xs text-[#2B2D2F] dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                        {tab.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key telemetry metrics (unboxed hairline strip) */}
            <div className="grid grid-cols-3 gap-4 pt-5 mt-5 border-t border-inherit divide-x divide-[#D6D1C7] dark:divide-neutral-800">
              {activeTab.metrics.map((m, idx) => (
                <div key={m.label} className={idx > 0 ? 'pl-4' : ''}>
                  <p className="text-[11px] font-mono text-[#2B2D2F] dark:text-neutral-400 truncate">
                    {m.label}
                  </p>
                  <p
                    className={`text-sm font-bold font-mono tabular-nums mt-0.5 truncate ${
                      isDark ? 'text-white' : 'text-[#141618]'
                    }`}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Screenshot Viewport */}
          <div
            id="product-panel"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab.id}`}
            className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-center bg-panel/60"
          >
            <div className="flex items-center justify-between pb-3 text-xs text-[#2B2D2F] dark:text-neutral-400">
              <span className="font-mono text-[11px] truncate font-medium">
                {activeTab.title}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="inline-flex items-center gap-1 font-semibold hover:text-focus transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{t.inspectZoom}</span>
                </button>
                <a
                  href={deskUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold hover:text-focus transition-colors"
                >
                  <span>{page === 'mall' ? dict.nav.openMall : dict.nav.openDesk}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={t.inspectZoom}
              className="relative w-full block text-left overflow-hidden rounded-2xl border border-[#D6D1C7] dark:border-neutral-800 cursor-zoom-in group shadow-sm"
            >
              <TredynDeskPreview
                tabId={activeTab.id}
                isDark={isDark}
                lang={lang}
              />
            </button>
          </div>
          </div>
        )}

        {/* Embedded Interactive Drawdown Sandbox */}
        <div className="tnx-fade-up mt-8">
          <DrawdownSandbox isDark={isDark} lang={lang} />
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'th' ? `ขยายมุมมอง ${activeTab.title}` : `Expanded workspace view: ${activeTab.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141618]/85 backdrop-blur-md p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="desk-panel relative max-w-6xl w-full p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-hairline text-ink text-xs">
              <span className="font-mono text-focus">
                {activeTab.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="px-3.5 py-1.5 rounded-full border border-hairline bg-panel hover:border-focus text-ink font-semibold cursor-pointer transition"
              >
                {lang === 'th' ? 'ปิด' : 'Close'}
              </button>
            </div>
            <TredynDeskPreview
              tabId={activeTab.id}
              isDark={isDark}
              lang={lang}
              expanded={true}
            />
          </div>
        </div>
      )}
    </section>
  );
};
