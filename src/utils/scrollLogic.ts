import type { Language } from './i18n';

export const SCROLL_TO_TOP_THRESHOLD_PX = 500;

/**
 * Determines whether the scroll-to-top button should be visible.
 * Appears when the user scrolls down strictly more than 500px.
 */
export function shouldShowScrollToTop(
  scrollY: number,
  thresholdPx: number = SCROLL_TO_TOP_THRESHOLD_PX
): boolean {
  if (!Number.isFinite(scrollY) || scrollY <= 0) {
    return false;
  }
  return scrollY > thresholdPx;
}

export function getScrollToTopLabel(lang: Language): {
  label: string;
  ariaLabel: string;
} {
  if (lang === 'th') {
    return {
      label: 'บนสุด',
      ariaLabel: 'เลื่อนกลับไปด้านบนสุดของหน้า (Scroll to top)',
    };
  }
  return {
    label: 'TOP',
    ariaLabel: 'Scroll back to top of page',
  };
}
