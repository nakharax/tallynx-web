import React from 'react';
import type { LogoTheme, LogoVariant } from '../utils/logoSpec';

export const TALLYNX_LOGO_SRC = '/favicon.svg';

export interface TredynLogoProps {
  variant?: LogoVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'auto' | LogoTheme;
  showGrid?: boolean;
  showSubtitle?: boolean;
  subtitle?: 'QUANT RISK OS' | 'TECHNOLOGIES';
  className?: string;
  'data-testid'?: string;
}

const MARK_SIZE_PX: Record<NonNullable<TredynLogoProps['size']>, number> = {
  xs: 24,
  sm: 30,
  md: 36,
  lg: 44,
  xl: 64,
};

export const TredynLogo: React.FC<TredynLogoProps> = ({
  variant = 'lockup',
  size = 'sm',
  tone = 'auto',
  showSubtitle = true,
  subtitle = 'QUANT RISK OS',
  className = '',
  'data-testid': testId,
}) => {
  const dimension = MARK_SIZE_PX[size];
  const stacked = variant === 'stacked';
  const ink = { auto: 'text-ink', light: 'text-stone-900', dark: 'text-stone-50', mono: 'text-black' }[tone];

  return (
    <span
      role="img"
      aria-label={variant === 'mark' || !showSubtitle ? 'TallyNX' : `TallyNX ${subtitle}`}
      data-testid={testId}
      className={`inline-flex shrink-0 select-none items-center gap-2 whitespace-nowrap ${stacked ? 'flex-col' : ''} ${ink} ${className}`}
    >
      <img
        src={TALLYNX_LOGO_SRC}
        width={dimension}
        height={dimension}
        alt=""
        className={tone === 'mono' ? 'grayscale' : undefined}
      />
      {variant !== 'mark' && (
        <span className={`flex flex-col gap-1 leading-none ${stacked ? 'items-center' : 'items-start'}`}>
          <span className="font-sans font-bold tracking-[.12em]" style={{ fontSize: dimension * 0.49 }}>
            TALLY<span className={tone === 'mono' ? 'ml-[.12em]' : 'ml-[.12em] text-[#0752E8] dark:text-[#3B82F6]'}>NX</span>
          </span>
          {showSubtitle && (
            <span className="font-mono font-semibold tracking-[.20em] opacity-80" style={{ fontSize: Math.max(7, dimension * 0.23) }}>
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
