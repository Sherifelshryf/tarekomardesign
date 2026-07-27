'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { resolveMaterial } from '@/data/materials';
import type { MaterialFamily } from '@/types';
import { getScaledTexture } from './proceduralTextures';

/**
 * Renders a catalog finish as a PBR material.
 *
 * `repeat` is given in metres so the grain scales with the real surface — a
 * 4 m floor gets four times the planks of a 1 m one, rather than four times
 * stretched pixels.
 */
interface SurfaceMaterialProps {
  materialId: string | undefined;
  family: MaterialFamily;
  /** Real-world size of the surface being covered, in metres: [u, v]. */
  repeat?: [number, number];
  /** Selection / hover tinting. */
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  /** Overrides the finish colour without changing the rest of the definition. */
  colorOverride?: string;
}

export function SurfaceMaterial({
  materialId,
  family,
  repeat,
  emissive = '#000000',
  emissiveIntensity = 0,
  transparent = false,
  opacity = 1,
  side = THREE.FrontSide,
  colorOverride,
}: SurfaceMaterialProps) {
  const option = resolveMaterial(materialId, family);

  // Textures are shared across every surface with the same finish and tiling;
  // the cache owns them, so this component never disposes what it is handed.
  const map = useMemo(() => {
    const [u, v] = repeat ?? [1, 1];
    return getScaledTexture(option, u, v);
    // `repeat` is a fresh tuple each render — depend on its parts, not the array.
  }, [option, repeat?.[0], repeat?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <meshStandardMaterial
      color={colorOverride ?? option.color}
      map={map ?? undefined}
      roughness={option.roughness}
      metalness={option.metalness}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      transparent={transparent}
      opacity={opacity}
      side={side}
    />
  );
}
