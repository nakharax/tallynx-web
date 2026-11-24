import React from 'react';
import { Language } from '../utils/i18n';
import { AppRoutePath, getRouteSkeletonConfig } from '../utils/navLogic';

interface RouteSkeletonScreenProps {
  routePath: AppRoutePath;
  lang: Language;
}

export const RouteSkeletonScreen: React.FC<RouteSkeletonScreenProps> = ({
  routePath,
  lang,
}) => {
  const cfg = getRouteSkeletonConfig(routePath, lang);

  return (
    <div
      data-testid="route-skeleton-screen"
      data-skeleton-variant={cfg.variant}
      aria-busy="true"
      aria-live="polite"
      className="py-16 transition-opacity duration-150"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between border-b border-hairline pb-4 dark:border-neutral-800/80">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-[11px] font-semibold text-focus">
              {cfg.statusLabel}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-xs font-medium text-[#2B2D2F] dark:text-neutral-400">
              {cfg.moduleTitle}
            </span>
          </div>
          <div className="h-5 w-28 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {cfg.variant !== 'hero-split' && (
          <div className="mb-10 max-w-2xl space-y-3">
            <div className="h-3.5 w-44 animate-pulse rounded bg-focus/20 dark:bg-focus/30" />
            <div className="h-9 w-3/4 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-focus/15 dark:bg-focus/25" />
            <div className="h-4 w-full animate-pulse rounded bg-canvas dark:bg-neutral-900" />
          </div>
        )}

        {cfg.variant === 'hero-split' && (
          <div className="space-y-14">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="space-y-5 lg:col-span-6">
                <div className="h-6 w-56 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
                <div className="space-y-3">
                  <div className="h-12 w-4/5 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-12 w-3/5 animate-pulse rounded-xl bg-focus/25 dark:bg-focus/35" />
                </div>
                <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
                </div>
                <div className="flex gap-3 pt-4">
                  <div className="h-11 w-36 animate-pulse rounded-lg bg-neutral-300 dark:bg-neutral-700" />
                  <div className="h-11 w-32 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </div>
              <div className="lg:col-span-6">
                <div className="h-[380px] w-full animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/80 p-6 dark:border-neutral-800 dark:bg-neutral-900/70">
                  <div className="flex justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                    <div className="h-6 w-48 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-6 w-24 rounded bg-focus/20" />
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="h-24 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70" />
                    <div className="h-24 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70" />
                    <div className="h-24 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70" />
                  </div>
                  <div className="mt-6 h-44 rounded-xl bg-neutral-200/90 dark:bg-neutral-950" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60"
                />
              ))}
            </div>
          </div>
        )}

        {cfg.variant === 'comparison-split' && (
          <div className="space-y-8">
            <div className="flex gap-3">
              <div className="h-9 w-44 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-9 w-44 animate-pulse rounded-full bg-canvas dark:bg-neutral-900" />
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-2xl border border-hairline bg-canvas p-6 dark:border-neutral-800 dark:bg-[#1B1E21] space-y-5"
                >
                  <div className="flex justify-between">
                    <div className="h-5 w-48 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-5 w-28 rounded bg-focus/20" />
                  </div>
                  <div className="h-44 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60" />
                  <div className="space-y-2.5">
                    <div className="h-3.5 w-full rounded bg-neutral-200/50 dark:bg-neutral-800/50" />
                    <div className="h-3.5 w-5/6 rounded bg-neutral-200/50 dark:bg-neutral-800/50" />
                    <div className="h-3.5 w-4/6 rounded bg-neutral-200/50 dark:bg-neutral-800/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cfg.variant === 'workspace-showcase' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60"
                />
              ))}
            </div>
            <div className="h-[420px] w-full animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/70" />
          </div>
        )}

        {cfg.variant === 'live-sandbox' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="h-80 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 lg:col-span-7" />
              <div className="h-80 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 lg:col-span-5" />
            </div>
          </div>
        )}

        {cfg.variant === 'marketplace-grid' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-24 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900"
                  />
                ))}
              </div>
              <div className="h-9 w-56 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl border border-hairline bg-canvas p-6 dark:border-neutral-800 dark:bg-[#1B1E21] space-y-4"
                >
                  <div className="flex justify-between">
                    <div className="h-4 w-28 rounded bg-focus/20" />
                    <div className="h-4 w-24 rounded bg-focus/15" />
                  </div>
                  <div className="h-6 w-4/5 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-12 w-full rounded bg-neutral-100 dark:bg-neutral-900" />
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="h-10 rounded bg-neutral-200/70 dark:bg-neutral-800/70" />
                    <div className="h-10 rounded bg-neutral-200/70 dark:bg-neutral-800/70" />
                    <div className="h-10 rounded bg-neutral-200/70 dark:bg-neutral-800/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cfg.variant === 'analytics-dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="h-80 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 lg:col-span-7" />
              <div className="h-80 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 lg:col-span-5" />
            </div>
            <div className="h-72 w-full animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60" />
          </div>
        )}

        {cfg.variant === 'onboarding-funnel' && (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-40 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-900"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl border border-hairline bg-canvas dark:border-neutral-800 dark:bg-[#1B1E21]"
                />
              ))}
            </div>
            <div className="h-72 w-full animate-pulse rounded-2xl border border-hairline bg-canvas dark:border-neutral-800 dark:bg-[#1B1E21]" />
          </div>
        )}
      </div>
    </div>
  );
};
