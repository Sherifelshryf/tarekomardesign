import type { PortfolioProject } from '@/data/projects';

/**
 * Generated project artwork.
 *
 * Rather than dressing placeholder projects in stock photography — which would
 * misrepresent work that doesn't exist — each project is illustrated with an
 * abstract interior composition built from its own palette: a wall plane, a
 * floor, a run of joinery, a worktop line and raking light.
 *
 * Swapping in real photography later means rendering an `<Image>` in place of
 * this component; the layouts around it are unchanged.
 */

interface ProjectArtworkProps {
  project: PortfolioProject;
  /** Which composition to draw — several exist so a grid doesn't repeat. */
  variant?: number;
  className?: string;
}

export function ProjectArtwork({ project, variant = 0, className }: ProjectArtworkProps) {
  const { base, mid, accent, ink } = project.palette;
  const id = `${project.slug}-${variant}`;
  const composition = variant % 3;

  return (
    <svg
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`${project.name} — ${project.type} in ${project.location}`}
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={lighten(base, 0.16)} />
          <stop offset="100%" stopColor={base} />
        </linearGradient>
        <linearGradient id={`light-${id}`} x1="1" y1="0" x2="0.15" y2="0.85">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* A soft falloff into the lower corners gives the frame some weight. */}
        <linearGradient id={`depth-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stopColor={ink} stopOpacity="0" />
          <stop offset="100%" stopColor={ink} stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`floor-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mid} />
          <stop offset="100%" stopColor={darken(mid, 0.18)} />
        </linearGradient>
        <linearGradient id={`shadow-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ink} stopOpacity="0.24" />
          <stop offset="100%" stopColor={ink} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Back wall */}
      <rect width="160" height="100" fill={`url(#sky-${id})`} />

      {composition === 0 && <ElevationComposition id={id} project={project} />}
      {composition === 1 && <PerspectiveComposition id={id} project={project} />}
      {composition === 2 && <DetailComposition id={id} project={project} />}

      {/* Raking light across the whole frame ties the compositions together. */}
      <rect width="160" height="100" fill={`url(#light-${id})`} />
      <rect width="160" height="100" fill={`url(#depth-${id})`} />
    </svg>
  );
}

/* --------------------------------------------------------- compositions */

/** A straight-on elevation: run of joinery, worktop, wall units above. */
function ElevationComposition({ id, project }: { id: string; project: PortfolioProject }) {
  const { mid, accent, ink } = project.palette;

  return (
    <g>
      {/* Floor */}
      <rect y="78" width="160" height="22" fill={`url(#floor-${id})`} />

      {/* Wall units */}
      <rect x="14" y="16" width="62" height="22" fill={accent} opacity="0.9" />
      <line x1="45" y1="16" x2="45" y2="38" stroke={ink} strokeOpacity="0.22" strokeWidth="0.4" />
      <rect x="98" y="16" width="48" height="22" fill={accent} opacity="0.9" />
      <line x1="122" y1="16" x2="122" y2="38" stroke={ink} strokeOpacity="0.22" strokeWidth="0.4" />

      {/* Extraction gap */}
      <rect x="78" y="20" width="18" height="14" fill={ink} opacity="0.35" />

      {/* Worktop */}
      <rect x="10" y="55" width="140" height="3" fill={lighten(mid, 0.42)} />

      {/* Base run */}
      <rect x="10" y="58" width="140" height="20" fill={accent} />
      {[34, 58, 82, 106, 130].map((x) => (
        <line key={x} x1={x} y1="58" x2={x} y2="78" stroke={ink} strokeOpacity="0.22" strokeWidth="0.4" />
      ))}
      {/* Plinth shadow */}
      <rect x="10" y="75" width="140" height="3" fill={ink} opacity="0.3" />

      {/* Contact shadow on the floor */}
      <rect x="10" y="78" width="140" height="6" fill={`url(#shadow-${id})`} />
    </g>
  );
}

/** A one-point perspective into the room, with an island in the foreground. */
function PerspectiveComposition({ id, project }: { id: string; project: PortfolioProject }) {
  const { mid, accent, ink } = project.palette;

  return (
    <g>
      {/* Floor receding to a vanishing point */}
      <polygon points="0,100 160,100 118,62 42,62" fill={`url(#floor-${id})`} />

      {/* Side walls */}
      <polygon points="0,0 42,62 42,20 0,0" fill={ink} opacity="0.1" />
      <polygon points="160,0 118,62 118,20 160,0" fill={ink} opacity="0.06" />

      {/* Back run of joinery */}
      <rect x="42" y="44" width="76" height="18" fill={accent} />
      <rect x="42" y="42" width="76" height="2" fill={lighten(mid, 0.44)} />
      {[61, 80, 99].map((x) => (
        <line key={x} x1={x} y1="44" x2={x} y2="62" stroke={ink} strokeOpacity="0.2" strokeWidth="0.35" />
      ))}

      {/* Wall units */}
      <rect x="48" y="22" width="30" height="12" fill={accent} opacity="0.92" />
      <rect x="86" y="22" width="26" height="12" fill={accent} opacity="0.92" />

      {/* Pendants over the island */}
      {[64, 96].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="30" stroke={ink} strokeOpacity="0.4" strokeWidth="0.4" />
          <path d={`M ${x - 4} 36 L ${x} 30 L ${x + 4} 36 Z`} fill={ink} opacity="0.55" />
        </g>
      ))}

      {/* Foreground island */}
      <rect x="34" y="76" width="92" height="4" fill={lighten(mid, 0.48)} />
      <rect x="38" y="80" width="84" height="20" fill={darken(accent, 0.12)} />
      <rect x="38" y="96" width="84" height="4" fill={ink} opacity="0.28" />
    </g>
  );
}

/** A close crop: worktop meeting a wall, with a shadow gap. */
function DetailComposition({ id, project }: { id: string; project: PortfolioProject }) {
  const { mid, accent, ink } = project.palette;

  return (
    <g>
      <rect y="0" width="160" height="46" fill={lighten(project.palette.base, 0.05)} />

      {/* Shadow gap between wall and worktop */}
      <rect y="46" width="160" height="3" fill={ink} opacity="0.42" />

      {/* Worktop slab, seen close */}
      <rect y="49" width="160" height="12" fill={lighten(mid, 0.4)} />
      <rect y="49" width="160" height="1.4" fill="#ffffff" opacity="0.55" />

      {/* Veining */}
      <path
        d="M 6 56 C 30 52, 48 60, 74 55 S 118 52, 158 57"
        stroke={ink}
        strokeOpacity="0.16"
        strokeWidth="0.5"
        fill="none"
      />
      <path
        d="M 0 59 C 26 57, 40 61, 68 58 S 120 60, 160 58"
        stroke={ink}
        strokeOpacity="0.1"
        strokeWidth="0.35"
        fill="none"
      />

      {/* Drawer fronts below */}
      <rect y="61" width="160" height="39" fill={accent} />
      <line x1="0" y1="76" x2="160" y2="76" stroke={ink} strokeOpacity="0.2" strokeWidth="0.5" />
      <line x1="0" y1="90" x2="160" y2="90" stroke={ink} strokeOpacity="0.2" strokeWidth="0.5" />
      {/* Slim edge pull */}
      <rect x="58" y="67" width="44" height="1.6" fill={ink} opacity="0.5" />
    </g>
  );
}

/* --------------------------------------------------------------- colour */

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}
