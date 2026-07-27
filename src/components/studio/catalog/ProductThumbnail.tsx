'use client';

import type { Product } from '@/types';

/**
 * Catalog thumbnails, drawn as SVG elevations.
 *
 * A miniature 3D render per card would mean instantiating dozens of scenes just
 * to browse. A line elevation is faster, sharper, scales to any size, and
 * matches the drawing language of the rest of the site. The aspect ratio of
 * each drawing follows the product's real proportions.
 */
export function ProductThumbnail({ product }: { product: Product }) {
  const { width, height } = product.dimensions;
  const aspect = width / height;

  // Fit the elevation into a 100×75 box, preserving real proportions.
  const boxW = aspect >= 100 / 75 ? 82 : 82 * (aspect / (100 / 75));
  const boxH = boxW / aspect;
  const x = (100 - boxW) / 2;
  const y = (75 - boxH) / 2;

  return (
    <svg viewBox="0 0 100 75" className="h-full w-full" aria-hidden="true">
      <g
        stroke="currentColor"
        className="text-stone/70"
        fill="none"
        strokeWidth={0.9}
        strokeLinecap="square"
      >
        <Elevation product={product} x={x} y={y} w={boxW} h={boxH} />
      </g>
    </svg>
  );
}

interface ElevationProps {
  product: Product;
  x: number;
  y: number;
  w: number;
  h: number;
}

function Elevation({ product, x, y, w, h }: ElevationProps) {
  const spec = product.render;
  const outline = <rect x={x} y={y} width={w} height={h} />;

  switch (spec.kind) {
    case 'cabinet': {
      if (spec.drawers > 0) {
        return (
          <>
            {outline}
            {stackLines(x, y, w, h, spec.drawers)}
            {Array.from({ length: spec.drawers }, (_, i) => (
              <line
                key={i}
                x1={x + w * 0.38}
                x2={x + w * 0.62}
                y1={y + (h / spec.drawers) * (i + 0.5)}
                y2={y + (h / spec.drawers) * (i + 0.5)}
                strokeWidth={1.4}
              />
            ))}
          </>
        );
      }
      return (
        <>
          {outline}
          {spec.doors === 2 && <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} />}
          {doorHandles(x, y, w, h, spec.doors)}
          {spec.plinth && <line x1={x} x2={x + w} y1={y + h * 0.88} y2={y + h * 0.88} />}
        </>
      );
    }

    case 'sink-cabinet':
      return (
        <>
          {outline}
          <line x1={x} x2={x + w} y1={y + h * 0.16} y2={y + h * 0.16} />
          <line x1={x + w / 2} x2={x + w / 2} y1={y + h * 0.16} y2={y + h} />
          <circle cx={x + w / 2} cy={y + h * 0.08} r={Math.min(w, h) * 0.05} />
          {doorHandles(x, y + h * 0.16, w, h * 0.84, 2)}
        </>
      );

    case 'corner-cabinet':
      return (
        <>
          {outline}
          <line x1={x + w * 0.5} x2={x + w * 0.5} y1={y} y2={y + h} />
          <path d={`M ${x + w * 0.5} ${y} L ${x + w} ${y + h * 0.35}`} />
          {doorHandles(x, y, w * 0.5, h, 1)}
        </>
      );

    case 'wall-cabinet':
      if (spec.openShelves) {
        return (
          <>
            {outline}
            {stackLines(x, y, w, h, spec.openShelves + 1)}
          </>
        );
      }
      return (
        <>
          {outline}
          {spec.doors === 2 && <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} />}
          {doorHandles(x, y, w, h, spec.doors)}
        </>
      );

    case 'tall-cabinet':
      return (
        <>
          {outline}
          <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h * 0.72} />
          <line x1={x} x2={x + w} y1={y + h * 0.72} y2={y + h * 0.72} />
          {spec.drawers > 0 && stackLines(x, y + h * 0.72, w, h * 0.28, spec.drawers)}
          {doorHandles(x, y, w, h * 0.72, 2)}
        </>
      );

    case 'island':
      return (
        <>
          {/* Worktop oversailing the carcass on both sides. */}
          <rect x={x - w * 0.04} y={y} width={w * 1.08} height={h * 0.1} />
          <rect x={x} y={y + h * 0.1} width={w} height={h * 0.9} />
          {stackLines(x, y + h * 0.1, w * 0.55, h * 0.9, spec.drawers)}
          <line x1={x + w * 0.55} x2={x + w * 0.55} y1={y + h * 0.1} y2={y + h} />
        </>
      );

    case 'worktop':
      return <rect x={x} y={y + h * 0.35} width={w} height={h * 0.3} />;

    case 'sink':
      return (
        <>
          {outline}
          {Array.from({ length: spec.bowls }, (_, i) => (
            <rect
              key={i}
              x={x + w * (0.06 + i * (0.88 / spec.bowls))}
              y={y + h * 0.2}
              width={(w * 0.88) / spec.bowls - w * 0.06}
              height={h * 0.62}
            />
          ))}
        </>
      );

    case 'appliance':
      return <ApplianceElevation variant={spec.variant} x={x} y={y} w={w} h={h} />;

    case 'light':
      if (spec.variant === 'pendant') {
        return (
          <>
            <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h * 0.55} />
            <path
              d={`M ${x + w * 0.2} ${y + h} L ${x + w / 2} ${y + h * 0.55} L ${x + w * 0.8} ${y + h}  Z`}
            />
          </>
        );
      }
      return (
        <>
          {outline}
          <line x1={x + w * 0.2} x2={x + w * 0.8} y1={y + h / 2} y2={y + h / 2} strokeWidth={1.6} />
        </>
      );

    case 'opening':
      if (spec.variant === 'window') {
        return (
          <>
            {outline}
            <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} />
            <line x1={x} x2={x + w} y1={y + h / 2} y2={y + h / 2} />
          </>
        );
      }
      return (
        <>
          {outline}
          <path d={`M ${x} ${y + h} A ${w} ${h} 0 0 1 ${x + w} ${y + h}`} strokeDasharray="2 2" />
          <circle cx={x + w * 0.84} cy={y + h * 0.55} r={1.4} />
        </>
      );

    case 'accessory':
      if (spec.variant === 'stool') {
        return (
          <>
            <rect x={x} y={y} width={w} height={h * 0.14} />
            <line x1={x + w * 0.15} x2={x + w * 0.05} y1={y + h * 0.14} y2={y + h} />
            <line x1={x + w * 0.85} x2={x + w * 0.95} y1={y + h * 0.14} y2={y + h} />
            <line x1={x + w * 0.1} x2={x + w * 0.9} y1={y + h * 0.66} y2={y + h * 0.66} />
          </>
        );
      }
      if (spec.variant === 'plant') {
        return (
          <>
            <path d={`M ${x + w * 0.28} ${y + h * 0.72} L ${x + w * 0.72} ${y + h * 0.72} L ${x + w * 0.64} ${y + h} L ${x + w * 0.36} ${y + h} Z`} />
            <circle cx={x + w * 0.5} cy={y + h * 0.4} r={Math.min(w, h) * 0.26} />
            <circle cx={x + w * 0.32} cy={y + h * 0.52} r={Math.min(w, h) * 0.16} />
            <circle cx={x + w * 0.68} cy={y + h * 0.5} r={Math.min(w, h) * 0.18} />
          </>
        );
      }
      return outline;

    default:
      return outline;
  }
}

function ApplianceElevation({
  variant,
  x,
  y,
  w,
  h,
}: {
  variant: 'fridge' | 'oven' | 'hob' | 'hood' | 'dishwasher' | 'microwave';
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  switch (variant) {
    case 'fridge':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} />
          <line x1={x} x2={x + w} y1={y + h * 0.66} y2={y + h * 0.66} />
          <line x1={x + w * 0.86} x2={x + w * 0.86} y1={y + h * 0.1} y2={y + h * 0.4} strokeWidth={1.6} />
          <line x1={x + w * 0.86} x2={x + w * 0.86} y1={y + h * 0.74} y2={y + h * 0.92} strokeWidth={1.6} />
        </>
      );
    case 'oven':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} />
          <rect x={x + w * 0.1} y={y + h * 0.26} width={w * 0.8} height={h * 0.6} />
          <line x1={x + w * 0.1} x2={x + w * 0.9} y1={y + h * 0.14} y2={y + h * 0.14} strokeWidth={1.6} />
        </>
      );
    case 'hob':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} />
          {[
            [0.28, 0.3],
            [0.72, 0.3],
            [0.28, 0.7],
            [0.72, 0.7],
          ].map(([fx, fy], i) => (
            <circle key={i} cx={x + w * fx} cy={y + h * fy} r={Math.min(w, h) * 0.13} />
          ))}
        </>
      );
    case 'hood':
      return (
        <>
          <path d={`M ${x} ${y + h} L ${x + w * 0.22} ${y + h * 0.42} L ${x + w * 0.78} ${y + h * 0.42} L ${x + w} ${y + h} Z`} />
          <rect x={x + w * 0.36} y={y} width={w * 0.28} height={h * 0.42} />
        </>
      );
    case 'dishwasher':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} />
          <line x1={x + w * 0.2} x2={x + w * 0.8} y1={y + h * 0.12} y2={y + h * 0.12} strokeWidth={1.6} />
          <circle cx={x + w * 0.5} cy={y + h * 0.55} r={Math.min(w, h) * 0.18} />
        </>
      );
    default:
      return <rect x={x} y={y} width={w} height={h} />;
  }
}

/* -------------------------------------------------------------- helpers */

function stackLines(x: number, y: number, w: number, h: number, count: number) {
  return Array.from({ length: Math.max(0, count - 1) }, (_, i) => (
    <line key={i} x1={x} x2={x + w} y1={y + (h / count) * (i + 1)} y2={y + (h / count) * (i + 1)} />
  ));
}

function doorHandles(x: number, y: number, w: number, h: number, doors: number) {
  if (doors <= 0) return null;
  const inset = w * 0.06;
  const positions = doors === 2 ? [x + w / 2 - inset, x + w / 2 + inset] : [x + w - inset];
  return positions.map((cx, i) => (
    <line key={i} x1={cx} x2={cx} y1={y + h * 0.36} y2={y + h * 0.64} strokeWidth={1.6} />
  ));
}
