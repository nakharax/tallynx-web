import React from 'react';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Language } from '../utils/i18n';
import {
  AppRoutePath,
  getRouteNavigationContext,
} from '../utils/navLogic';

interface RoutePageShellProps {
  currentPath: AppRoutePath;
  lang: Language;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const RoutePageShell: React.FC<RoutePageShellProps> = ({
  currentPath,
  lang,
  onNavigate,
  children,
}) => {
  const { category, currentItem, prevItem, nextItem } = getRouteNavigationContext(
    currentPath,
    lang
  );

  return (
    <div data-testid="route-page-shell" className="min-h-[70vh] text-ink">
      {/* Clean Single-Row Architectural Breadcrumb & Prev/Next Quick Jump */}
      <div className="border-b border-hairline bg-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Left Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center space-x-2 text-xs"
          >
            <a
              href="/"
              data-testid="back-to-landing-btn"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="inline-flex items-center space-x-1.5 font-semibold text-[#2B2D2F] hover:text-[#141618] dark:text-neutral-400 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              <Home className="h-3.5 w-3.5 text-focus" />
              <span>{lang === 'th' ? 'หน้าหลัก' : 'Overview'}</span>
            </a>
            <span className="text-[#D6D1C7] dark:text-neutral-700 hidden sm:inline" aria-hidden="true">/</span>
            <span className="font-medium text-[#2B2D2F] dark:text-neutral-400 whitespace-nowrap hidden sm:inline shrink-0">
              {category.label}
            </span>
            <span className="text-[#D6D1C7] dark:text-neutral-700" aria-hidden="true">/</span>
            <span
              aria-current="page"
              data-testid="route-breadcrumb-path"
              className="truncate font-semibold text-[#141618] dark:text-white"
            >
              {currentItem.title}
            </span>
          </nav>

          {/* Right Quiet Prev / Next Step Links (Desktop, zero text clipping) */}
          <nav
            aria-label={lang === 'th' ? 'เปลี่ยนหน้าต่อเนื่อง' : 'Adjacent pages'}
            className="hidden min-w-0 max-w-[55%] items-center gap-3 text-xs lg:flex"
          >
            <a
              href={prevItem.href}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(prevItem.href);
              }}
              className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#2B2D2F] hover:text-focus dark:text-neutral-400 transition whitespace-nowrap"
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="truncate">{prevItem.title}</span>
            </a>
            <span className="text-[#D6D1C7] dark:text-neutral-700" aria-hidden="true">·</span>
            <a
              href={nextItem.href}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(nextItem.href);
              }}
              className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#2B2D2F] hover:text-focus dark:text-neutral-400 transition whitespace-nowrap"
            >
              <span className="truncate">{nextItem.title}</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </nav>
        </div>
      </div>

      {/* Focused Section Component Content */}
      <main className="min-w-0">{children}</main>

      {/* Quiet Bottom Previous / Next Route Pager */}
      <section className="border-t border-hairline bg-panel py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <a
              href={prevItem.href}
              data-testid="prev-route-btn"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(prevItem.href);
              }}
              className="group flex min-w-0 items-center gap-3 px-3 py-2.5 hover:bg-canvas"
            >
              <ArrowLeft className="h-4 w-4 text-[#2B2D2F] group-hover:text-focus group-hover:-translate-x-0.5 dark:text-neutral-400 transition shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#2B2D2F] dark:text-neutral-400">
                  {lang === 'th' ? 'ก่อนหน้า' : 'Previous'}
                </div>
                <div className="mt-0.5 truncate text-sm font-bold text-[#141618] group-hover:text-focus dark:text-white transition">
                  {prevItem.title}
                </div>
              </div>
            </a>

            <a
              href={nextItem.href}
              data-testid="next-route-btn"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(nextItem.href);
              }}
              className="group flex min-w-0 items-center justify-end gap-3 px-3 py-2.5 text-right hover:bg-canvas"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#2B2D2F] dark:text-neutral-400">
                  {lang === 'th' ? 'ถัดไป' : 'Next'}
                </div>
                <div className="mt-0.5 truncate text-sm font-bold text-[#141618] group-hover:text-focus dark:text-white transition">
                  {nextItem.title}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#2B2D2F] group-hover:text-focus group-hover:translate-x-0.5 dark:text-neutral-400 transition shrink-0" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
