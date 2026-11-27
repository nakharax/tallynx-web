import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { flushSync } from 'react-dom';
import { executeThemeTransition } from './utils/themeTransition';
import { CategorizedNavbar } from './components/CategorizedNavbar';
import { LandingOverview } from './components/LandingOverview';
import { TredynLogo } from './components/TredynLogo';
import { Language, toggleLanguage, getDictionary } from './utils/i18n';
import {
  shouldShowScrollToTop,
  getScrollToTopLabel,
} from './utils/scrollLogic';
import {
  AppRoutePath,
  TALLYNX_DESK_APP_URL,
  getNavCategories,
  normalizeRoutePath,
  resolveWebTheme,
  shouldForceSkeletonFromSearch,
} from './utils/navLogic';
import { SeoHeadManager } from './components/SeoHeadManager';
import { SiteTrafficStrip } from './components/SiteTrafficStrip';
import {
  type DeskPage,
  OnboardingTransferState,
  buildDeskHandoffUrl,
  parseTransferStateFromSearch,
  persistOnboardingTransferState,
  readOnboardingTransferState,
} from './utils/onboardingLogic';
import { ExternalLink, ArrowUp, MessageSquare } from 'lucide-react';
import type { CommandActionId } from './utils/commandPaletteLogic';
import { OfflineIndicator } from './components/PWAInstallBanner';
import { usePWAInstall } from './hooks/usePWAInstall';

const RouteSkeletonScreen = lazy(() =>
  import('./components/RouteSkeletonScreen').then((m) => ({
    default: m.RouteSkeletonScreen,
  }))
);
const CommandPaletteModal = lazy(() =>
  import('./components/CommandPaletteModal').then((m) => ({
    default: m.CommandPaletteModal,
  }))
);

const RoutePageShell = lazy(() =>
  import('./components/RoutePageShell').then((m) => ({
    default: m.RoutePageShell,
  }))
);
const TredynAdvisorDrawer = lazy(() =>
  import('./components/TredynAdvisorDrawer').then((m) => ({
    default: m.TredynAdvisorDrawer,
  }))
);

const ColumnInfrastructure = lazy(() =>
  import('./components/ColumnInfrastructure').then((m) => ({
    default: m.ColumnInfrastructure,
  }))
);
const WorkspaceShowcase = lazy(() =>
  import('./components/WorkspaceShowcase').then((m) => ({
    default: m.WorkspaceShowcase,
  }))
);
const LiveSandboxSection = lazy(() =>
  import('./components/LiveSandboxSection').then((m) => ({
    default: m.LiveSandboxSection,
  }))
);
const DeskMarketplaceSection = lazy(() =>
  import('./components/DeskMarketplaceSection').then((m) => ({
    default: m.DeskMarketplaceSection,
  }))
);
const AnalyticsDashboardSection = lazy(() =>
  import('./components/AnalyticsDashboardSection').then((m) => ({
    default: m.AnalyticsDashboardSection,
  }))
);
const OnboardingFunnelSection = lazy(() =>
  import('./components/OnboardingFunnelSection').then((m) => ({
    default: m.OnboardingFunnelSection,
  }))
);

const PREFETCH_BY_ROUTE: Record<Exclude<AppRoutePath, '/'>, () => Promise<unknown>> = {
  '/infrastructure': () => import('./components/ColumnInfrastructure'),
  '/workspace': () => import('./components/WorkspaceShowcase'),
  '/sandbox': () => import('./components/LiveSandboxSection'),
  '/marketplace': () => import('./components/DeskMarketplaceSection'),
  '/analytics': () => import('./components/AnalyticsDashboardSection'),
  '/onboarding': () => import('./components/OnboardingFunnelSection'),
};

function prefetchRouteChunk(path: AppRoutePath) {
  if (path === '/') return;
  void import('./components/RoutePageShell');
  void PREFETCH_BY_ROUTE[path]();
}

const STORAGE_THEME_KEY = 'tredyn.theme.v7';
const STORAGE_LANG_KEY = 'tredyn.lang';
const DESK_PAGE_BY_ROUTE: Partial<Record<AppRoutePath, DeskPage>> = {
  '/sandbox': 'calc',
  '/onboarding': 'calc',
  '/analytics': 'analysis',
  '/marketplace': 'market',
};

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const requestedTheme = resolveWebTheme(window.location.search);
    if (requestedTheme) return requestedTheme === 'dark';
    try {
      return window.localStorage.getItem(STORAGE_THEME_KEY) !== 'light';
    } catch {
      return true;
    }
  });
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const queryLang = new URLSearchParams(window.location.search).get('lang')?.trim().toLowerCase();
    if (queryLang === 'en' || queryLang === 'th') return queryLang;

    try {
      const saved = window.localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'th') return saved;
    } catch {
      // Storage may be unavailable in private or restricted contexts.
    }
    const htmlLang = document.documentElement.lang.toLowerCase().split('-')[0];
    return htmlLang === 'th' ? 'th' : 'en';
  });
  const [currentPath, setCurrentPath] = useState<AppRoutePath>(() =>
    typeof window !== 'undefined'
      ? normalizeRoutePath(window.location.pathname)
      : '/'
  );
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? shouldForceSkeletonFromSearch(window.location.search)
      : false
  );
  const [commandPaletteMounted, setCommandPaletteMounted] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [advisorMounted, setAdvisorMounted] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pwaInstall = usePWAInstall();
  const [hasTransferredParams, setHasTransferredParams] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return parseTransferStateFromSearch(window.location.search).hasTransferredParams;
  });
  const [transferState, setTransferState] = useState<OnboardingTransferState>(() => {
    if (typeof window === 'undefined') {
      return readOnboardingTransferState();
    }
    const stored = readOnboardingTransferState();
    const parsed = parseTransferStateFromSearch(window.location.search, stored);
    return parsed.state;
  });

  const themeCrossfadeTimeoutRef = useRef<number | null>(null);
  const langCrossfadeTimeoutRef = useRef<number | null>(null);

  const t = useMemo(() => getDictionary(lang), [lang]);
  const scrollTopLabels = useMemo(() => getScrollToTopLabel(lang), [lang]);
  const theme = isDark ? 'dark' : 'light';
  const activeSandbox = hasTransferredParams || transferState.updatedAt ? transferState : undefined;
  const deskLaunchUrl = useCallback(
    (source: string) =>
      buildDeskHandoffUrl(TALLYNX_DESK_APP_URL, activeSandbox, {
        lang,
        theme,
        page: DESK_PAGE_BY_ROUTE[currentPath] ?? (activeSandbox ? 'calc' : undefined),
        source,
      }),
    [activeSandbox, lang, theme, currentPath]
  );
  const navbarDeskLaunchUrl = useMemo(() => deskLaunchUrl('navbar_cta'), [deskLaunchUrl]);
  const footerCategories = useMemo(
    () => getNavCategories(lang, deskLaunchUrl('footer_cta')),
    [lang, deskLaunchUrl]
  );

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      document.body.classList.add(
        'transition-colors',
        'duration-300',
        'ease-in-out',
        'motion-reduce:transition-none'
      );
    });
    return () => {
      window.cancelAnimationFrame(rafId);
      if (themeCrossfadeTimeoutRef.current !== null) {
        window.clearTimeout(themeCrossfadeTimeoutRef.current);
      }
      if (langCrossfadeTimeoutRef.current !== null) {
        window.clearTimeout(langCrossfadeTimeoutRef.current);
      }
      document.documentElement.classList.remove('tredyn-theme-crossfade');
      document.documentElement.classList.remove('tnx-lang-crossfade');
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isDark ? '#05070B' : '#FFFFFF');
    }
    try {
      window.localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage write errors in restricted environments
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // Ignore storage write errors in restricted environments
    }
  }, [lang]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const prefs = { lang, theme };
    let changed = false;
    for (const [key, value] of Object.entries(prefs)) {
      if (url.searchParams.has(key) && url.searchParams.get(key) !== value) {
        url.searchParams.set(key, value);
        changed = true;
      }
    }
    if (changed) window.history.replaceState(window.history.state, '', url);
  }, [lang, theme]);

  useEffect(() => {
    const handlePopState = () => {
      const next = normalizeRoutePath(window.location.pathname);
      applyTransferFromSearch(window.location.search);
      setCurrentPath(next);
      setIsRouteLoading(shouldForceSkeletonFromSearch(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Warm key secondary route chunks during browser idle time after first paint (skip on Save-Data / 2G)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
      return;
    }
    const warm = () => {
      prefetchRouteChunk('/onboarding');
      prefetchRouteChunk('/sandbox');
    };
    const idleApi = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof idleApi.requestIdleCallback === 'function') {
      const id = idleApi.requestIdleCallback(warm, { timeout: 2200 });
      return () => idleApi.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(warm, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(shouldShowScrollToTop(window.scrollY));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteMounted(true);
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const applyTransferFromSearch = useCallback((search: string) => {
    const parsed = parseTransferStateFromSearch(search, readOnboardingTransferState());
    if (parsed.hasTransferredParams) {
      setTransferState(parsed.state);
      setHasTransferredParams(true);
    }
  }, []);

  const handleNavigate = useCallback((targetPath: string) => {
    const target = new URL(targetPath, window.location.origin);
    const normalized = normalizeRoutePath(target.pathname);
    const fullUrl = normalized + target.search + target.hash;
    if (window.location.pathname + window.location.search + window.location.hash !== fullUrl) {
      window.history.pushState({}, '', fullUrl);
      applyTransferFromSearch(target.search);
    }
    setIsRouteLoading(shouldForceSkeletonFromSearch(window.location.search));
    setCurrentPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [applyTransferFromSearch]);

  const handleActivateDeskFlow = useCallback((state: OnboardingTransferState) => {
    const saved = persistOnboardingTransferState(state);
    setTransferState(saved);
    setHasTransferredParams(true);
    const onboardingUrl = buildDeskHandoffUrl('/onboarding', saved, {
      lang,
      theme,
      step: 3,
      source: 'sandbox_handoff',
    });
    handleNavigate(onboardingUrl);
  }, [lang, theme, handleNavigate]);

  const toggleTheme = useCallback((event?: React.MouseEvent<HTMLButtonElement>) => {
    const nextDark = !isDark;
    executeThemeTransition({
      nextDark,
      clientX: event?.clientX,
      clientY: event?.clientY,
      originEl: event?.currentTarget ?? null,
      fallbackTimerRef: themeCrossfadeTimeoutRef,
      flushCommit: () => {
        flushSync(() => {
          setIsDark(nextDark);
        });
      },
    });
  }, [isDark]);

  const handleUpdateTransferState = useCallback((next: OnboardingTransferState) => {
    const saved = persistOnboardingTransferState(next);
    setTransferState(saved);
    setHasTransferredParams(true);
  }, []);

  const handleToggleLanguage = useCallback(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReduced && typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('tnx-lang-crossfade');
      void root.offsetWidth;
      root.classList.add('tnx-lang-crossfade');
      if (langCrossfadeTimeoutRef.current !== null) {
        window.clearTimeout(langCrossfadeTimeoutRef.current);
      }
      langCrossfadeTimeoutRef.current = window.setTimeout(() => {
        root.classList.remove('tnx-lang-crossfade');
        langCrossfadeTimeoutRef.current = null;
      }, 240);
    }

    setLang((prev) => toggleLanguage(prev));
  }, []);

  const handleRunCommandAction = useCallback((actionId: CommandActionId) => {
    switch (actionId) {
      case 'toggle-theme':
        toggleTheme();
        break;
      case 'toggle-lang':
        handleToggleLanguage();
        break;
      case 'open-advisor':
        setAdvisorMounted(true);
        setAdvisorOpen(true);
        break;
      case 'launch-desk': {
        const anchor = document.createElement('a');
        anchor.href = deskLaunchUrl('command_palette');
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        break;
      }
    }
  }, [toggleTheme, handleToggleLanguage, deskLaunchUrl]);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteMounted(true);
    setCommandPaletteOpen(true);
  }, []);

  const handlePrefetchCommandPalette = useCallback(() => {
    void import('./components/CommandPaletteModal');
  }, []);

  const handlePrefetchAdvisor = useCallback(() => {
    void import('./components/TredynAdvisorDrawer');
  }, []);

  const handleOpenAdvisor = useCallback(() => {
    setAdvisorMounted(true);
    setAdvisorOpen(true);
  }, []);

  const renderRouteContent = () => {
    if (isRouteLoading) {
      return <RouteSkeletonScreen routePath={currentPath} lang={lang} />;
    }

    switch (currentPath) {
      case '/infrastructure':
        return <ColumnInfrastructure lang={lang} />;
      case '/workspace':
        return (
          <WorkspaceShowcase
            globalMotionPaused={false}
            isDark={isDark}
            lang={lang}
            transferState={activeSandbox}
          />
        );
      case '/sandbox':
        return (
          <LiveSandboxSection
            lang={lang}
            isDark={isDark}
            onNavigate={handleNavigate}
            transferState={transferState}
            onChangeTransferState={handleUpdateTransferState}
            onActivateDeskFlow={handleActivateDeskFlow}
          />
        );
      case '/marketplace':
        return <DeskMarketplaceSection lang={lang} />;
      case '/analytics':
        return <AnalyticsDashboardSection lang={lang} isDark={isDark} />;
      case '/onboarding':
        return (
          <OnboardingFunnelSection
            lang={lang}
            isDark={isDark}
            transferState={transferState}
            initialStep={hasTransferredParams ? 3 : 1}
            hasTransferredParams={hasTransferredParams}
            onChangeState={setTransferState}
          />
        );
      case '/':
      default:
        return (
          <LandingOverview
            lang={lang}
            isDark={isDark}
            transferState={transferState}
            hasCustomTransferState={Boolean(activeSandbox)}
            onChangeTransferState={handleUpdateTransferState}
            onActivateDeskFlow={handleActivateDeskFlow}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div
      id="home"
      className="relative isolate min-h-screen text-ink tabular-nums"
    >
      <div aria-hidden="true" className="tnx-room-backdrop" />
      <SeoHeadManager path={currentPath} lang={lang} />
      <CategorizedNavbar
        lang={lang}
        isDark={isDark}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onPrefetchRoute={prefetchRouteChunk}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={handleOpenCommandPalette}
        onPrefetchCommandPalette={handlePrefetchCommandPalette}
        deskLaunchUrl={navbarDeskLaunchUrl}
        hasCustomTransferState={Boolean(activeSandbox)}
        pwaInstall={pwaInstall}
        onPrefetchAdvisor={handlePrefetchAdvisor}
        onOpenAdvisor={handleOpenAdvisor}
      />

        {currentPath === '/' ? (
          <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
            {renderRouteContent()}
          </Suspense>
        ) : (
          <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
            <RoutePageShell
              currentPath={currentPath}
              lang={lang}
              onNavigate={handleNavigate}
            >
              {renderRouteContent()}
            </RoutePageShell>
          </Suspense>
        )}

        <footer className="border-t border-hairline bg-panel py-8 text-muted lg:py-10">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            <div className="space-y-4">
              <TredynLogo variant="lockup" size="md" subtitle="TECHNOLOGIES" data-testid="footer-logo" />
              <p className="text-xs">{t.footer.rights}</p>
            </div>

            {footerCategories.map(({ id, label, items }) => (
              <div key={id}>
                <h2 className="text-xs font-bold text-ink">{label}</h2>
                <ul className="mt-4 space-y-2.5 text-xs">
                  {items.filter((item) => item.href !== '/').map((item) => (
                    <li key={item.id}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="footer-launch-desk"
                          className="inline-flex items-center gap-1 font-semibold text-focus hover:underline"
                        >
                          {item.title}
                          <ExternalLink aria-hidden="true" className="h-3 w-3" />
                        </a>
                      ) : (
                        <a
                          href={item.href}
                          onClick={(event) => {
                            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                            event.preventDefault();
                            handleNavigate(item.href);
                          }}
                          className="hover:text-focus"
                        >
                          {item.title}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <section id="legal-safe-harbor" aria-labelledby="legal-safe-harbor-title">
              <h2 id="legal-safe-harbor-title" className="text-xs font-bold text-ink">
                <a href="#legal-safe-harbor" className="hover:text-focus">{t.footer.legalTitle}</a>
              </h2>
              <p className="mt-4 text-xs leading-relaxed">{t.footer.legalText}</p>
            </section>
          </div>
          <SiteTrafficStrip lang={lang} />
        </footer>

        <div className="desk-utilities">
          {showScrollTop && (
            <button
              type="button"
              data-testid="scroll-to-top"
              onClick={handleScrollToTop}
              aria-label={scrollTopLabels.ariaLabel}
              title={scrollTopLabels.ariaLabel}
              className="tnx-pop-in desk-utility-button"
            >
              <ArrowUp className="size-4 shrink-0" />
              <span className="min-[88rem]:sr-only">{scrollTopLabels.label}</span>
            </button>
          )}

          {!advisorOpen && (
            <button
              type="button"
              data-testid="advisor-launcher"
              title={lang === 'th' ? 'ถาม TallyNX Advisor' : 'Ask TallyNX Advisor'}
              aria-label={lang === 'th' ? 'เปิดผู้ช่วย TallyNX AI Advisor' : 'Open TallyNX AI Advisor'}
              onMouseEnter={handlePrefetchAdvisor}
              onFocus={handlePrefetchAdvisor}
              onClick={handleOpenAdvisor}
              className="desk-utility-button"
            >
              <MessageSquare className="size-4 shrink-0" />
              <span className="min-[88rem]:sr-only">{lang === 'th' ? 'ถาม TallyNX Advisor' : 'Ask TallyNX Advisor'}</span>
            </button>
          )}
        </div>
        {advisorMounted && (
          <Suspense fallback={null}>
            <TredynAdvisorDrawer
              lang={lang}
              isDark={isDark}
              isOpen={advisorOpen}
              onClose={() => setAdvisorOpen(false)}
            />
          </Suspense>
        )}

        <OfflineIndicator lang={lang} />

        {commandPaletteMounted && (
          <Suspense fallback={null}>
            <CommandPaletteModal
              isOpen={commandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
              lang={lang}
              isDark={isDark}
              onNavigate={handleNavigate}
              onRunAction={handleRunCommandAction}
            />
          </Suspense>
        )}
    </div>
  );
}
