import { cx } from './studio/ui/primitives';

interface BrandLogoProps {
  /** Switches the tagline/outline colour for dark backgrounds. */
  inverted?: boolean;
  /** Hides the tagline in tight spaces while keeping the brand mark intact. */
  compact?: boolean;
  className?: string;
}

/**
 * Tarek Omar Designs brand mark.
 *
 * Recreated as inline SVG so it stays sharp in the site chrome, footer and
 * Studio toolbar without introducing another raster asset to preload.
 */
export function BrandLogo({ inverted = false, compact = false, className }: BrandLogoProps) {
  const text = inverted ? '#f4efe4' : '#171512';
  const tagline = inverted ? '#f4efe4' : '#3f3a33';

  return (
    <svg
      viewBox={compact ? '0 0 760 170' : '0 0 760 230'}
      role="img"
      aria-label="Tarek Omar Designs — Buy Your Happiness"
      className={cx('block h-auto w-full', className)}
    >
      <defs>
        <linearGradient id="tod-logo-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d7b56a" />
          <stop offset="0.44" stopColor="#f2d58b" />
          <stop offset="0.72" stopColor="#b78324" />
          <stop offset="1" stopColor="#e2bd68" />
        </linearGradient>
      </defs>

      <text
        x="380"
        y="104"
        textAnchor="middle"
        fill="url(#tod-logo-gold)"
        stroke={text}
        strokeOpacity="0.14"
        strokeWidth="1.5"
        paintOrder="stroke fill"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="82"
        fontStyle="italic"
        fontWeight="600"
      >
        Tarek Omar Designs
      </text>

      {!compact && (
        <text
          x="380"
          y="158"
          textAnchor="middle"
          fill={tagline}
          fontFamily="var(--font-sans), Arial, sans-serif"
          fontSize="22"
          fontWeight="400"
          letterSpacing="22"
        >
          BUY YOUR HAPPINESS
        </text>
      )}
    </svg>
  );
}
