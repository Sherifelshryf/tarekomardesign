'use client';

import { useEffect, useRef } from 'react';
import { getProceduralTexture } from '@/components/three/proceduralTextures';
import type { MaterialOption } from '@/types';
import { cx } from './primitives';

/**
 * A finish swatch.
 *
 * Rather than showing a flat colour chip, this paints a crop of the same
 * procedural texture the 3D scene uses — so the oak in the sidebar is literally
 * the oak on the cabinet.
 */
export function MaterialSwatch({
  material,
  selected,
  onSelect,
  compact,
}: {
  material: MaterialOption;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = material.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = getProceduralTexture(material);
    const image = texture?.image as HTMLCanvasElement | undefined;
    if (image) {
      // Sample a zoomed crop so the grain reads at swatch size.
      const crop = image.width / 2.6;
      ctx.drawImage(image, 0, 0, crop, crop, 0, 0, canvas.width, canvas.height);
    }
  }, [material]);

  return (
    <button
      type="button"
      onClick={onSelect}
      title={material.name}
      className={cx(
        'group flex items-center gap-2.5 border p-1.5 text-left transition-colors duration-150',
        selected
          ? 'border-brass bg-brass/10'
          : 'border-white/10 hover:border-white/30 hover:bg-white/4',
      )}
    >
      <canvas
        ref={canvasRef}
        width={64}
        height={64}
        className={cx('shrink-0 rounded-[1px]', compact ? 'h-6 w-6' : 'h-8 w-8')}
        style={{ backgroundColor: material.color }}
      />
      <span
        className={cx(
          'min-w-0 flex-1 truncate text-[11px] leading-tight',
          selected ? 'text-brass-soft' : 'text-stone group-hover:text-paper',
        )}
      >
        {material.name}
      </span>
    </button>
  );
}
