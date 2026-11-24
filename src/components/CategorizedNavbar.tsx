import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sun,
  Moon,
  ExternalLink,
  Shield,
  Layers,
  Layout,
  Menu,
  X,
  Globe,
  ChevronDown,
  ArrowUpRight,
  BarChart3,
  Store,
  MessageSquare,
  Activity,
  Rocket,
  Search,
} from 'lucide-react';
import { TredynLogo } from './TredynLogo';
import { PWAInstallButton } from './PWAInstallBanner';
import type { PWAInstallState } from '../hooks/usePWAInstall';
import { Language, getDictionary } from '../utils/i18n';
import {
  AppRoutePath,
  NavCategoryId,
  NavDropdownItem,
  getNavCategories,
  isCategoryActive,
  toggleCategoryDropdown,
} from '../utils/navLogic';

interface CategorizedNavbarProps {
  lang: Language;
  isDark: boolean;
  currentPath: AppRoutePath;
  onNavigate: (path: string) => void;
  onPrefetchRoute?: (path: AppRoutePath) => void;
  onToggleLanguage: () => void;
  onToggleTheme: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenAdvisor?: () => void;
  onPrefetchAdvisor?: () => void;
  onOpenCommandPalette?: () => void;
  onPrefetchCommandPalette?: () => void;
  deskLaunchUrl: string;
  hasCustomTransferState?: boolean;
  pwaInstall?: PWAInstallState;
}

export function renderNavIcon(iconKey: NavDropdownItem['iconKey'], isActive = false) {
  const cls = isActive
    ? 'h-4 w-4 text-focus transition-colors'
    : 'h-4 w-4 text-[#2B2D2F] group-hover/item:text-focus dark:text-neutral-300 transition-colors';
  switch (iconKey) {
    case 'shield':
      return <Shield className={cls} />;
    case 'layers':
      return <Layers className={cls} />;
    case 'layout':
      return <Layout className={cls} />;
    case 'external':
      return <ArrowUpRight className={cls} />;
    case 'barChart':
      return <BarChart3 className={cls} />;
    case 'store':
      return <Store className={cls} />;
    case 'sandbox':
      return <Activity className={cls} />;
    case 'rocket':
      return <Rocket className={cls} />;
  }
}

export const CategorizedNavbar: React.FC<CategorizedNavbarProps> = React.memo(({
  lang,
  isDark,
  currentPath,
  onNavigate,
  onPrefetchRoute,
  onToggleLanguage,
  onToggleTheme,
  onOpenAdvisor,
  onPrefetchAdvisor,
  onOpenCommandPalette,
  onPrefetchCommandPalette,
  deskLaunchUrl,
  hasCustomTransferState = false,
  pwaInstall,
}) => {
  const [openCategory, setOpenCategory] = useState<NavCategoryId | null>(null);
  const [pinnedCategory, setPinnedCategory] = useState<NavCategoryId | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<NavCategoryId | null>('tools');
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const hoverEnterTimestampRef = useRef<number>(0);

  const t = useMemo(() => getDictionary(lang), [lang]);
  const isTh = lang === 'th';
  const categories = useMemo(
    () => getNavCategories(lang, deskLaunchUrl),
    [lang, deskLaunchUrl]
  );

  const clearCloseTimer = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseEnterCategory = (id: NavCategoryId) => {
    clearCloseTimer();
    if (openCategory !== id) {
      hoverEnterTimestampRef.current = Date.now();
    }
    setOpenCategory(id);
  };

  const handleMouseLeaveCategory = (id: NavCategoryId) => {
    clearCloseTimer();
    if (pinnedCategory === id) {
      return;
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenCategory((prev) =>
        pinnedCategory ? pinnedCategory : prev === id ? null : prev
      );
    }, 180);
  };

  const handleClickCategory = (id: NavCategoryId) => {
    clearCloseTimer();
    const justEnteredViaHover = Date.now() - hoverEnterTimestampRef.current < 400;
    if (openCategory === id && pinnedCategory === id && !justEnteredViaHover) {
      setOpenCategory(null);
      setPinnedCategory(null);
    } else if (openCategory === id && !pinnedCategory && !justEnteredViaHover) {
      setOpenCategory(null);
    } else {
      setOpenCategory(id);
      setPinnedCategory(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
        setPinnedCategory(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenCategory(null);
        setPinnedCategory(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      clearCloseTimer();
    };
  }, []);

  const handleItemClick = (item: NavDropdownItem, e: React.MouseEvent) => {
    setOpenCategory(null);
    setPinnedCategory(null);
    setMobileMenuOpen(false);
    if (item.external || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(item.href);
  };

  return (
    <header
      ref={navRef}
      className="tnx-navbar sticky top-0 z-40 border-b border-hairline"
    >
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-3 sm:px-6 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-5 xl:px-8">
        {/* Left: Brand Lockup */}
        <div className="flex items-center shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setOpenCategory(null);
              setPinnedCategory(null);
              setMobileMenuOpen(false);
              onNavigate('/');
            }}
            className="inline-flex items-center whitespace-nowrap shrink-0 hover:opacity-85 transition"
          >
            <TredynLogo variant="lockup" size="sm" className="max-[23rem]:[&>span]:hidden" data-testid="navbar-logo" />
          </a>
        </div>

        {/* Center: Clean Architectural Category Triggers */}
        <nav
          aria-label={isTh ? 'เมนูหลัก' : 'Primary navigation'}
          className="hidden min-w-0 items-center justify-center gap-1 whitespace-nowrap xl:flex"
        >
          {categories.map((cat) => {
            const isOpen = openCategory === cat.id;
            const isActiveCat = isCategoryActive(cat, currentPath);
            return (
              <div
                key={cat.id}
                className="group/category relative min-w-0"
                onMouseEnter={() => handleMouseEnterCategory(cat.id)}
                onMouseLeave={() => handleMouseLeaveCategory(cat.id)}
              >
                <button
                  type="button"
                  data-testid={`nav-category-${cat.id}`}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => handleClickCategory(cat.id)}
                  className={`relative inline-flex h-9 max-w-full items-center gap-1 rounded px-2 text-xs 2xl:px-3 2xl:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isOpen
                      ? 'bg-neutral-100/90 text-[#141618] dark:bg-neutral-800/80 dark:text-white'
                      : isActiveCat
                      ? 'text-[#141618] font-semibold dark:text-white'
                      : 'text-[#2B2D2F] hover:bg-neutral-100/70 hover:text-[#141618] dark:text-neutral-400 dark:hover:bg-neutral-900/70 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  <ChevronDown
                    className={`h-3 w-3 shrink-0 text-muted transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-focus' : ''
                    }`}
                  />
                  {isActiveCat && !isOpen && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-[11px] h-[2px] rounded-full bg-focus"
                    />
                  )}
                </button>

                {/* Adaptive Dropdown Panel */}
                {isOpen && (
                  <div
                    data-testid={`nav-dropdown-${cat.id}`}
                    role="menu"
                    className="tnx-dropdown-in desk-panel absolute left-0 top-full z-10 mt-2 w-[340px] whitespace-normal bg-panel p-2"
                  >
                    <div className="space-y-0.5">
                      {cat.items.map((item) => {
                        const isItemActive =
                          !item.external && item.href === currentPath;
                        return (
                          <a
                            key={item.id}
                            href={item.href}
                            role="menuitem"
                            data-testid={`nav-item-${item.id}`}
                            target={item.external ? '_blank' : undefined}
                            rel={item.external ? 'noopener noreferrer' : undefined}
                            onMouseEnter={() => {
                              if (item.external !== true) {
                                onPrefetchRoute?.(item.href);
                              }
                            }}
                            onFocus={() => {
                              if (item.external !== true) {
                                onPrefetchRoute?.(item.href);
                              }
                            }}
                            onClick={(e) => handleItemClick(item, e)}
                            className={`group/item flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                              isItemActive
                                ? 'bg-focus/8 dark:bg-focus/15'
                                : 'hover:bg-canvas dark:hover:bg-neutral-900/90'
                            }`}
                          >
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                              {renderNavIcon(item.iconKey, isItemActive)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`truncate text-xs font-semibold transition-colors ${
                                    isItemActive
                                      ? 'text-focus'
                                      : 'text-[#141618] group-hover/item:text-focus dark:text-white'
                                  }`}
                                >
                                  {item.title}
                                </span>
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#2B2D2F] dark:text-neutral-400">
                                {item.description}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: Clean Utility Controls + Primary CTA */}
        <div className="flex min-w-0 items-center justify-end gap-0.5 whitespace-nowrap sm:gap-1.5">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              onMouseEnter={onPrefetchCommandPalette}
              onFocus={onPrefetchCommandPalette}
              data-testid="navbar-search-btn"
              title={lang === 'th' ? 'ค้นหาด่วน (⌘K / Ctrl+K)' : 'Quick Search (⌘K / Ctrl+K)'}
              aria-label={lang === 'th' ? 'ค้นหาด่วน (⌘K)' : 'Quick Search (⌘K)'}
              className="inline-flex h-9 sm:h-8 items-center gap-1.5 rounded-lg px-2 text-[#2B2D2F] hover:bg-neutral-100/80 hover:text-[#141618] dark:text-neutral-300 dark:hover:bg-neutral-800/70 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <kbd className="hidden lg:inline-flex items-center rounded border border-hairline dark:border-[#2B2D2F] bg-canvas/80 dark:bg-[#1B1E21] px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-[#5C5852] dark:text-neutral-400">
                ⌘K
              </kbd>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleLanguage}
            data-testid="language-switcher"
            aria-label={t.switchTooltip}
            title={t.switchTooltip}
            className="inline-flex h-9 sm:h-8 items-center gap-1 rounded-lg px-1.5 xl:px-2 font-mono text-[11px] font-semibold text-[#2B2D2F] hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:bg-neutral-800/70 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="hidden h-3.5 w-3.5 sm:block" />
            <span
              className={`transition-colors duration-200 ${
                lang === 'en'
                  ? 'text-[#141618] dark:text-white font-bold'
                  : 'text-muted'
              }`}
            >
              EN
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span
              className={`transition-colors duration-200 ${
                lang === 'th'
                  ? 'text-focus font-bold'
                  : 'text-muted'
              }`}
            >
              TH
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => onToggleTheme(e)}
            data-testid="theme-switcher"
            aria-label={isDark ? (isTh ? 'สลับเป็นโหมดสว่าง' : 'Switch to light mode') : (isTh ? 'สลับเป็นโหมดมืด' : 'Switch to dark mode')}
            className={`group/theme relative inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-colors duration-150 shrink-0 cursor-pointer ${
              isDark
                ? 'text-[#C4C0B8] hover:bg-[#2B2D2F]/60 hover:text-ink'
                : 'text-[#2B2D2F] hover:bg-canvas hover:text-focus'
            }`}
          >
            <span
              key={isDark ? 'sun' : 'moon'}
              className="tnx-theme-icon-in inline-flex items-center justify-center"
            >
              {isDark ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </span>
          </button>

          <span
            aria-hidden="true"
            className="hidden sm:inline-block mx-0.5 xl:mx-1 h-4 w-px bg-hairline dark:bg-neutral-800 shrink-0"
          />

          <a
            href={deskLaunchUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="navbar-launch-desk"
            data-synced={hasCustomTransferState ? 'true' : 'false'}
            title={
              hasCustomTransferState
                ? lang === 'th'
                  ? 'พร้อมส่งค่าจาก Sandbox ไปยัง TallyNX Desk'
                  : 'Synced with your live Sandbox parameters'
                : undefined
            }
            aria-label={t.nav.openDesk}
            className="desk-primary h-9 shrink-0 px-2 text-xs sm:px-3"
          >
            <span className="sm:hidden">{isTh ? 'โต๊ะเทรด' : 'Desk'}</span>
            <span className="hidden sm:inline">{t.nav.openDesk}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>

          {/* Mobile / Tablet menu trigger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? (isTh ? 'ปิดเมนู' : 'Close navigation menu') : (isTh ? 'เปิดเมนู' : 'Open navigation menu')}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-controls="mobile-navigation"
            className="xl:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-[#141618] hover:bg-neutral-100/80 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800/70 transition-colors shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Categorized Accordion Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-y border-hairline bg-panel px-4 py-2 xl:hidden">
          {categories.map((cat) => {
            const isCatExpanded = mobileExpandedCat === cat.id;
            return (
              <div
                key={cat.id}
                className="border-b border-hairline"
              >
                <button
                  type="button"
                  aria-expanded={isCatExpanded}
                  onClick={() => setMobileExpandedCat((prev) => toggleCategoryDropdown(prev, cat.id))}
                  className="flex w-full items-center justify-between bg-panel px-2 py-3 text-left cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#141618] dark:text-white">
                    {cat.label}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#2B2D2F] transition-transform ${
                      isCatExpanded ? 'rotate-180 text-focus' : ''
                    }`}
                  />
                </button>

                {isCatExpanded && (
                  <div className="divide-y divide-hairline/70 dark:divide-neutral-800/70 bg-white dark:bg-[#141618] p-1.5">
                    {cat.items.map((item) => {
                      const isItemActive =
                        !item.external && item.href === currentPath;
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noopener noreferrer' : undefined}
                          onClick={(e) => handleItemClick(item, e)}
                          className={`flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors ${
                            isItemActive
                              ? 'bg-focus/8 dark:bg-focus/15'
                              : 'hover:bg-canvas dark:hover:bg-neutral-900/80'
                          }`}
                        >
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                            {renderNavIcon(item.iconKey, isItemActive)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-semibold ${
                                  isItemActive
                                    ? 'text-focus'
                                    : 'text-[#141618] dark:text-white'
                                }`}
                              >
                                {item.title}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-[#2B2D2F] dark:text-neutral-400">
                              {item.description}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 flex flex-col gap-2">
            {onOpenAdvisor && (
              <button
                type="button"
                onMouseEnter={onPrefetchAdvisor}
                onFocus={onPrefetchAdvisor}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdvisor();
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas text-xs font-semibold text-[#141618] dark:border-neutral-800 dark:bg-[#1B1E21] dark:text-white cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-focus" />
                <span>{lang === 'th' ? 'ถามผู้ช่วย TallyNX' : 'Ask TallyNX Advisor'}</span>
              </button>
            )}
            <div className="flex justify-center pt-1">
              {pwaInstall && <PWAInstallButton lang={lang} installState={pwaInstall} compact />}
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
