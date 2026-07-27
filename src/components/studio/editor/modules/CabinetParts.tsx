'use client';

import { useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SurfaceMaterial } from '@/components/three/SurfaceMaterial';
import type { HandleStyle } from '@/types';

/**
 * Reusable cabinet parts.
 *
 * Everything here works in metres with the module's origin at the centre of its
 * footprint on the floor, and the front facing +Z. Doors swing on their real
 * hinge edge and drawers slide on their real runners, so the same components
 * serve both the editor and the walkthrough.
 */

export const PANEL_THICKNESS = 0.018;
export const FRONT_GAP = 0.003;

export interface PartMaterials {
  front: string | undefined;
  carcass: string | undefined;
  metal: string | undefined;
}

/** Eased door/drawer motion — snappy at the start, settling at the end. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* ------------------------------------------------------------------ shell */

interface CarcassProps {
  width: number;
  height: number;
  depth: number;
  materials: PartMaterials;
  /** Height of the recessed plinth beneath the carcass, in metres. */
  plinth?: number;
}

/** The box the fronts hang on: sides, top, bottom, back. */
export function Carcass({ width, height, depth, materials, plinth = 0 }: CarcassProps) {
  const bodyHeight = height - plinth;
  const centreY = plinth + bodyHeight / 2;

  return (
    <group>
      {plinth > 0 && (
        <mesh position={[0, plinth / 2, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[width - 0.01, plinth, depth - 0.06]} />
          <meshStandardMaterial color="#2c2c2e" roughness={0.85} />
        </mesh>
      )}

      {/* Outer shell, slightly shallower than the fronts so a shadow line reads. */}
      <mesh position={[0, centreY, -PANEL_THICKNESS]} castShadow receiveShadow>
        <boxGeometry args={[width, bodyHeight, depth - PANEL_THICKNESS * 2]} />
        <SurfaceMaterial
          materialId={materials.carcass}
          family="carcass"
          repeat={[width, bodyHeight]}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ doors */

interface DoorPanelProps {
  width: number;
  height: number;
  /** Local centre of the door opening. */
  x: number;
  y: number;
  z: number;
  hinge: 'left' | 'right';
  open: number;
  handle: HandleStyle;
  materials: PartMaterials;
  onSelect?: (event: ThreeEvent<MouseEvent>) => void;
}

export function DoorPanel({
  width,
  height,
  x,
  y,
  z,
  hinge,
  open,
  handle,
  materials,
  onSelect,
}: DoorPanelProps) {
  const pivot = useRef<THREE.Group>(null);
  const side = hinge === 'left' ? -1 : 1;
  // Hinge sits on the outer vertical edge of the door.
  const hingeX = x + side * (width / 2);

  useFrame((_, delta) => {
    if (!pivot.current) return;
    const target = -side * easeOut(THREE.MathUtils.clamp(open, 0, 1)) * (Math.PI * 0.62);
    // Frame-rate independent damping keeps the swing smooth everywhere.
    pivot.current.rotation.y = THREE.MathUtils.damp(
      pivot.current.rotation.y,
      target,
      8,
      delta,
    );
  });

  return (
    <group ref={pivot} position={[hingeX, y, z]}>
      <mesh
        position={[-side * (width / 2), 0, 0]}
        castShadow
        receiveShadow
        onClick={onSelect}
      >
        <boxGeometry args={[width, height, PANEL_THICKNESS]} />
        <SurfaceMaterial materialId={materials.front} family="cabinet-front" repeat={[width, height]} />
      </mesh>
      <Handle
        style={handle}
        materials={materials}
        orientation="vertical"
        length={Math.min(height * 0.4, 0.28)}
        position={[-side * (width - 0.05), 0, PANEL_THICKNESS / 2 + 0.012]}
      />
    </group>
  );
}

/* ---------------------------------------------------------------- drawers */

interface DrawerFrontProps {
  width: number;
  height: number;
  depth: number;
  y: number;
  z: number;
  open: number;
  handle: HandleStyle;
  materials: PartMaterials;
  onSelect?: (event: ThreeEvent<MouseEvent>) => void;
}

export function DrawerFront({
  width,
  height,
  depth,
  y,
  z,
  open,
  handle,
  materials,
  onSelect,
}: DrawerFrontProps) {
  const slide = useRef<THREE.Group>(null);
  const travel = depth * 0.62;

  useFrame((_, delta) => {
    if (!slide.current) return;
    const target = easeOut(THREE.MathUtils.clamp(open, 0, 1)) * travel;
    slide.current.position.z = THREE.MathUtils.damp(slide.current.position.z, target, 8, delta);
  });

  const boxDepth = depth * 0.82;
  const boxHeight = Math.max(0.06, height - 0.06);

  return (
    <group ref={slide} position={[0, y, 0]}>
      <mesh position={[0, 0, z]} castShadow receiveShadow onClick={onSelect}>
        <boxGeometry args={[width, height, PANEL_THICKNESS]} />
        <SurfaceMaterial materialId={materials.front} family="cabinet-front" repeat={[width, height]} />
      </mesh>

      {/* The box behind the front, visible once the drawer is pulled out. */}
      <mesh position={[0, -0.01, z - boxDepth / 2 - PANEL_THICKNESS]} castShadow>
        <boxGeometry args={[width - 0.05, boxHeight, boxDepth]} />
        <meshStandardMaterial color="#8d8a83" roughness={0.8} />
      </mesh>

      <Handle
        style={handle}
        materials={materials}
        orientation="horizontal"
        length={Math.min(width * 0.5, 0.32)}
        position={[0, 0, z + PANEL_THICKNESS / 2 + 0.012]}
      />
    </group>
  );
}

/* ---------------------------------------------------------------- handles */

interface HandleProps {
  style: HandleStyle;
  materials: PartMaterials;
  orientation: 'horizontal' | 'vertical';
  length: number;
  position: [number, number, number];
}

export function Handle({ style, materials, orientation, length, position }: HandleProps) {
  if (style === 'hidden') return null;

  const vertical = orientation === 'vertical';
  const rotation: [number, number, number] = vertical ? [0, 0, 0] : [0, 0, Math.PI / 2];

  if (style === 'knob') {
    return (
      <mesh position={position} castShadow>
        <sphereGeometry args={[0.016, 16, 12]} />
        <SurfaceMaterial materialId={materials.metal} family="metal" />
      </mesh>
    );
  }

  if (style === 'bar') {
    return (
      <group position={position}>
        <mesh rotation={[rotation[0], rotation[1], rotation[2] + Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, length, 12]} />
          <SurfaceMaterial materialId={materials.metal} family="metal" />
        </mesh>
        {/* Stand-offs holding the rail clear of the front. */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={
              vertical
                ? [0, (side * length) / 2.4, -0.012]
                : [(side * length) / 2.4, 0, -0.012]
            }
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.005, 0.005, 0.024, 8]} />
            <SurfaceMaterial materialId={materials.metal} family="metal" />
          </mesh>
        ))}
      </group>
    );
  }

  // `minimal` — a slim edge-pull, the default TOD detail.
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={vertical ? [0.012, length, 0.016] : [length, 0.012, 0.016]} />
      <SurfaceMaterial materialId={materials.metal} family="metal" />
    </mesh>
  );
}

/* ----------------------------------------------------------------- shelves */

interface ShelfProps {
  width: number;
  depth: number;
  y: number;
  materials: PartMaterials;
}

export function Shelf({ width, depth, y, materials }: ShelfProps) {
  return (
    <mesh position={[0, y, -PANEL_THICKNESS]} castShadow receiveShadow>
      <boxGeometry args={[width - 0.03, PANEL_THICKNESS, depth - 0.05]} />
      <SurfaceMaterial materialId={materials.carcass} family="carcass" repeat={[width, depth]} />
    </mesh>
  );
}
