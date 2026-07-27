/**
 * Unit conversion boundary.
 *
 * Project data is stored in millimetres and degrees. The Three.js scene runs in
 * metres and radians. Nothing outside the render layer should call these.
 */

export const MM_PER_M = 1000;

export const mmToM = (mm: number): number => mm / MM_PER_M;
export const mToMm = (m: number): number => m * MM_PER_M;

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Formats a millimetre length as metres, e.g. `4200` → `"4.20 m"`. */
export function formatMetres(mm: number, decimals = 2): string {
  return `${(mm / MM_PER_M).toFixed(decimals)} m`;
}

/** Formats a millimetre length for the properties panel, e.g. `"800 mm"`. */
export function formatMillimetres(mm: number): string {
  return `${Math.round(mm)} mm`;
}

/** Formats a price in Egyptian pounds without trailing decimals. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Rounds `value` to the nearest multiple of `step`. */
export function snapToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Normalises an angle in degrees to the [0, 360) range. */
export function normaliseAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}
