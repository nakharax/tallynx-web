export interface ThemeRippleInput {
  viewportWidth: number;
  viewportHeight: number;
  clientX?: number;
  clientY?: number;
  rect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
}

export interface ThemeRippleGeometry {
  x: number;
  y: number;
  endRadius: number;
}

/**
 * Pure geometry calculator for circular iris theme reveal transitions.
 * Falls back from pointer coordinates -> button rect center -> top-right navbar fallback.
 */
export function computeThemeRippleGeometry(input: ThemeRippleInput): ThemeRippleGeometry {
  const vw = Math.max(1, input.viewportWidth || 1024);
  const vh = Math.max(1, input.viewportHeight || 768);

  let x: number;
  let y: number;

  const hasPointer =
    typeof input.clientX === 'number' &&
    typeof input.clientY === 'number' &&
    (input.clientX > 0 || input.clientY > 0);

  if (hasPointer) {
    x = input.clientX as number;
    y = input.clientY as number;
  } else if (input.rect && (input.rect.width > 0 || input.rect.height > 0)) {
    x = input.rect.left + input.rect.width / 2;
    y = input.rect.top + input.rect.height / 2;
  } else {
    x = vw - 140;
    y = 28;
  }

  const clampedX = Math.max(0, Math.min(vw, Math.round(x)));
  const clampedY = Math.max(0, Math.min(vh, Math.round(y)));
  const endRadius = Math.ceil(
    Math.hypot(Math.max(clampedX, vw - clampedX), Math.max(clampedY, vh - clampedY))
  );

  return { x: clampedX, y: clampedY, endRadius };
}

function spawnThemeOrbitalPulse(x: number, y: number, toDark: boolean, endRadius: number) {
  if (typeof document === 'undefined' || !document.body) return;

  const host = document.createElement('div');
  host.className = `tnx-theme-wave-layer ${toDark ? 'is-to-dark' : 'is-to-light'}`;
  host.setAttribute('aria-hidden', 'true');
  host.style.setProperty('--tnx-wave-x', `${x}px`);
  host.style.setProperty('--tnx-wave-y', `${y}px`);
  host.style.setProperty('--tnx-wave-size', `${Math.max(320, endRadius * 2)}px`);

  const halo = document.createElement('span');
  halo.className = 'tnx-theme-halo-ring';
  const corona = document.createElement('span');
  corona.className = 'tnx-theme-sweep-corona';

  host.appendChild(halo);
  host.appendChild(corona);
  document.body.appendChild(host);

  window.setTimeout(() => {
    host.remove();
  }, 760);
}

export interface ExecuteThemeTransitionOptions {
  nextDark: boolean;
  clientX?: number;
  clientY?: number;
  originEl?: HTMLElement | null;
  flushCommit: () => void;
  fallbackTimerRef: { current: number | null };
}

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

export function executeThemeTransition({
  nextDark,
  clientX,
  clientY,
  originEl,
  flushCommit,
  fallbackTimerRef,
}: ExecuteThemeTransitionOptions): void {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || typeof document === 'undefined') {
    flushCommit();
    document?.documentElement?.classList.toggle('dark', nextDark);
    return;
  }

  const targetButton =
    originEl ||
    (document.querySelector('[data-testid="theme-switcher"]') as HTMLElement | null);
  const rect = targetButton?.getBoundingClientRect() ?? null;

  const { x, y, endRadius } = computeThemeRippleGeometry({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    clientX,
    clientY,
    rect,
  });

  const vtDoc = document as ViewTransitionDoc;
  if (typeof vtDoc.startViewTransition === 'function') {
    const root = document.documentElement;
    root.classList.add('tnx-vt-active');

    let transition: ReturnType<NonNullable<ViewTransitionDoc['startViewTransition']>>;
    try {
      transition = vtDoc.startViewTransition(() => {
        flushCommit();
        root.classList.toggle('dark', nextDark);
      });
    } catch {
      root.classList.remove('tnx-vt-active');
      flushCommit();
      root.classList.toggle('dark', nextDark);
      return;
    }

    transition.ready
      .then(() => {
        spawnThemeOrbitalPulse(x, y, nextDark, endRadius);
        if (typeof root.animate === 'function') {
          root.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 620,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        }
      })
      .catch(() => {
        // Ignore aborted or interrupted view transitions gracefully
      });

    transition.finished
      .catch(() => {
        // Ignore finished errors
      })
      .finally(() => {
        root.classList.remove('tnx-vt-active');
      });
    return;
  }

  // Fallback for environments without startViewTransition: smooth crossfade + orbital pulse
  document.documentElement.classList.add('tredyn-theme-crossfade');
  if (fallbackTimerRef.current !== null) {
    window.clearTimeout(fallbackTimerRef.current);
  }
  fallbackTimerRef.current = window.setTimeout(() => {
    document.documentElement.classList.remove('tredyn-theme-crossfade');
    fallbackTimerRef.current = null;
  }, 420);

  spawnThemeOrbitalPulse(x, y, nextDark, endRadius);
  flushCommit();
  document.documentElement.classList.toggle('dark', nextDark);
}
