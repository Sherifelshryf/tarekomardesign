'use client';

import * as THREE from 'three';
import { SurfaceMaterial } from '@/components/three/SurfaceMaterial';
import { mmToM } from '@/lib/units';
import type { LightingMode, PlacedObject, Product } from '@/types';
import { PANEL_THICKNESS, type PartMaterials } from './CabinetParts';

/**
 * Non-cabinet fixtures: appliances, sinks, lighting, openings and styling.
 * Each renders from the module origin (footprint centre, on its underside)
 * with the front facing +Z, matching the cabinet family.
 */

interface FixtureProps {
  object: PlacedObject;
  product: Product;
}

/* ------------------------------------------------------------- appliances */

export function ApplianceModule({ object, product }: FixtureProps) {
  if (product.render.kind !== 'appliance') return null;

  const width = mmToM(object.dimensions.width);
  const height = mmToM(object.dimensions.height);
  const depth = mmToM(object.dimensions.depth);
  const metal = object.materials.metal;
  const materials: PartMaterials = {
    front: object.materials.front,
    carcass: object.materials.carcass,
    metal,
  };

  switch (product.render.variant) {
    case 'fridge':
      return (
        <group>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <SurfaceMaterial materialId={metal} family="metal" repeat={[width, height]} />
          </mesh>
          {/* Split between fridge and freezer compartments. */}
          <mesh position={[0, height * 0.32, depth / 2 + 0.002]}>
            <boxGeometry args={[width, 0.008, 0.004]} />
            <meshStandardMaterial color="#1c1d1f" roughness={0.6} />
          </mesh>
          {[height * 0.62, height * 0.18].map((y, i) => (
            <mesh key={i} position={[width / 2 - 0.06, y, depth / 2 + 0.02]} castShadow>
              <boxGeometry args={[0.02, 0.3, 0.024]} />
              <SurfaceMaterial materialId={metal} family="metal" />
            </mesh>
          ))}
        </group>
      );

    case 'oven':
      return (
        <group>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#242528" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Glass door with a stainless rail. */}
          <mesh position={[0, height * 0.45, depth / 2 + 0.004]}>
            <boxGeometry args={[width * 0.86, height * 0.58, 0.008]} />
            <meshStandardMaterial color="#0e0f12" roughness={0.12} metalness={0.2} />
          </mesh>
          <mesh
            position={[0, height * 0.85, depth / 2 + 0.03]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.012, width * 0.82, 12]} />
            <SurfaceMaterial materialId={metal} family="metal" />
          </mesh>
        </group>
      );

    case 'hob':
      return (
        <group>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#151619" roughness={0.14} metalness={0.25} />
          </mesh>
          {/* Four induction zones. */}
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sz], i) => (
            <mesh
              key={i}
              position={[(sx * width) / 4.2, height + 0.001, (sz * depth) / 4.2]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.06, 0.075, 32]} />
              <meshStandardMaterial color="#4a4c52" roughness={0.4} />
            </mesh>
          ))}
        </group>
      );

    case 'hood':
      return (
        <group>
          {/* Canopy tapering up into the chimney. */}
          <mesh position={[0, height * 0.12, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height * 0.24, depth]} />
            <SurfaceMaterial materialId={metal} family="metal" repeat={[width, depth]} />
          </mesh>
          <mesh position={[0, height * 0.62, -depth * 0.18]} castShadow>
            <boxGeometry args={[width * 0.34, height * 0.76, depth * 0.5]} />
            <SurfaceMaterial materialId={metal} family="metal" repeat={[width, height]} />
          </mesh>
          <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width * 0.88, depth * 0.82]} />
            <meshStandardMaterial color="#2b2c30" roughness={0.35} metalness={0.5} />
          </mesh>
        </group>
      );

    case 'dishwasher':
      return (
        <group>
          <mesh position={[0, height / 2, -PANEL_THICKNESS]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth - PANEL_THICKNESS * 2]} />
            <meshStandardMaterial color="#3a3b3e" roughness={0.6} />
          </mesh>
          {/* Integrated door matching the cabinet fronts. */}
          <mesh position={[0, height / 2, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width - 0.006, height - 0.01, PANEL_THICKNESS]} />
            <SurfaceMaterial
              materialId={materials.front}
              family="cabinet-front"
              repeat={[width, height]}
            />
          </mesh>
          <mesh position={[0, height - 0.06, depth / 2 + 0.02]} castShadow>
            <boxGeometry args={[width * 0.5, 0.012, 0.016]} />
            <SurfaceMaterial materialId={metal} family="metal" />
          </mesh>
        </group>
      );

    default:
      return (
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <SurfaceMaterial materialId={metal} family="metal" repeat={[width, height]} />
        </mesh>
      );
  }
}

/* ------------------------------------------------------------------ sinks */

export function SinkModule({ object, product }: FixtureProps) {
  if (product.render.kind !== 'sink') return null;

  const width = mmToM(object.dimensions.width);
  const height = mmToM(object.dimensions.height);
  const depth = mmToM(object.dimensions.depth);
  const bowls = product.render.bowls;
  const bowlWidth = (width - 0.04 * (bowls + 1)) / bowls;

  return (
    <group>
      {Array.from({ length: bowls }, (_, i) => {
        const offset = -width / 2 + 0.04 + bowlWidth / 2 + i * (bowlWidth + 0.04);
        return (
          <group key={i} position={[offset, 0, 0]}>
            {/* Bowl walls, open at the top. */}
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[bowlWidth, height, depth * 0.86]} />
              <SurfaceMaterial materialId={object.materials.metal} family="metal" />
            </mesh>
            <mesh position={[0, height - 0.01, 0]}>
              <boxGeometry args={[bowlWidth - 0.03, 0.02, depth * 0.86 - 0.03]} />
              <meshStandardMaterial color="#3d4045" roughness={0.35} metalness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* Mixer tap rising from the back edge. */}
      <group position={[0, height, -depth / 2 + 0.02]}>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.026, 0.03, 0.04, 16]} />
          <SurfaceMaterial materialId={object.materials.metal} family="metal" />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.28, 16]} />
          <SurfaceMaterial materialId={object.materials.metal} family="metal" />
        </mesh>
        <mesh position={[0, 0.3, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.06, 0.016, 12, 24, Math.PI / 2]} />
          <SurfaceMaterial materialId={object.materials.metal} family="metal" />
        </mesh>
      </group>
    </group>
  );
}

/* --------------------------------------------------------------- lighting */

interface LightModuleProps extends FixtureProps {
  /** Interior fixtures only emit light after dark. */
  lightingMode: LightingMode;
  /** Ceiling height in metres, so pendant cords reach the slab. */
  ceilingHeight: number;
  warmth: number;
}

export function LightModule({ object, product, lightingMode, ceilingHeight, warmth }: LightModuleProps) {
  if (product.render.kind !== 'light') return null;

  const width = mmToM(object.dimensions.width);
  const height = mmToM(object.dimensions.height);
  const on = lightingMode === 'night';
  const bulbColour = warmth > 0.5 ? '#ffd9a8' : '#f3f6ff';
  // Lumens are converted to a workable point-light intensity for the scene.
  const intensity = on ? (product.render.lumens / 800) * 3.2 : 0;

  switch (product.render.variant) {
    case 'pendant': {
      const shadeHeight = Math.min(0.22, height * 0.3);
      const cordTop = ceilingHeight - mmToM(object.position.y);
      return (
        <group>
          {/* Cord runs from the shade all the way to the ceiling slab. */}
          <mesh position={[0, (shadeHeight + cordTop) / 2, 0]}>
            <cylinderGeometry args={[0.006, 0.006, Math.max(0.05, cordTop - shadeHeight), 8]} />
            <meshStandardMaterial color="#26262a" roughness={0.7} />
          </mesh>
          <mesh position={[0, shadeHeight / 2, 0]} castShadow>
            <coneGeometry args={[width / 2, shadeHeight, 24, 1, true]} />
            <SurfaceMaterial
              materialId={object.materials.metal}
              family="metal"
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.045, 16, 12]} />
            <meshStandardMaterial
              color={bulbColour}
              emissive={bulbColour}
              emissiveIntensity={on ? 2.4 : 0.15}
              roughness={0.4}
            />
          </mesh>
          {on && <pointLight position={[0, 0.02, 0]} intensity={intensity} distance={5} decay={2} color={bulbColour} castShadow={false} />}
        </group>
      );
    }

    case 'ceiling':
      return (
        <group>
          <mesh position={[0, height / 2, 0]}>
            <cylinderGeometry args={[width / 2, width / 2, height, 20]} />
            <meshStandardMaterial
              color={bulbColour}
              emissive={bulbColour}
              emissiveIntensity={on ? 1.8 : 0.1}
              roughness={0.5}
            />
          </mesh>
          {on && <pointLight position={[0, 0, 0]} intensity={intensity} distance={4.5} decay={2} color={bulbColour} />}
        </group>
      );

    default:
      return (
        <group>
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[width, height, mmToM(object.dimensions.depth)]} />
            <meshStandardMaterial
              color={bulbColour}
              emissive={bulbColour}
              emissiveIntensity={on ? 1.4 : 0.08}
              roughness={0.6}
            />
          </mesh>
          {on && (
            <TaskLight intensity={intensity} colour={bulbColour} width={width} />
          )}
        </group>
      );
  }
}

/** Under-cabinet task light — a short-range point light aimed at the worktop. */
function TaskLight({
  intensity,
  colour,
  width,
}: {
  intensity: number;
  colour: string;
  width: number;
}) {
  return (
    <pointLight
      position={[0, -0.1, width * 0.1]}
      intensity={intensity * 0.6}
      distance={1.8}
      decay={2}
      color={colour}
    />
  );
}

/* -------------------------------------------------------- doors & windows */

export function OpeningModule({ object, product }: FixtureProps) {
  if (product.render.kind !== 'opening') return null;

  const width = mmToM(object.dimensions.width);
  const height = mmToM(object.dimensions.height);
  const depth = mmToM(object.dimensions.depth);
  const frame = 0.06;

  if (product.render.variant === 'window') {
    return (
      <group>
        {/* Frame drawn as four rails around a glazed centre. */}
        {[
          { args: [width, frame, depth] as const, pos: [0, height - frame / 2, 0] as const },
          { args: [width, frame, depth] as const, pos: [0, frame / 2, 0] as const },
          { args: [frame, height, depth] as const, pos: [-width / 2 + frame / 2, height / 2, 0] as const },
          { args: [frame, height, depth] as const, pos: [width / 2 - frame / 2, height / 2, 0] as const },
        ].map((part, i) => (
          <mesh key={i} position={part.pos} castShadow receiveShadow>
            <boxGeometry args={part.args} />
            <SurfaceMaterial materialId={object.materials.front} family="cabinet-front" />
          </mesh>
        ))}
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width - frame * 2, height - frame * 2, 0.01]} />
          <meshPhysicalMaterial
            color="#cfe0e8"
            transparent
            opacity={0.28}
            roughness={0.05}
            metalness={0}
            transmission={0.6}
          />
        </mesh>
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[0.02, height - frame * 2, depth * 0.6]} />
          <SurfaceMaterial materialId={object.materials.front} family="cabinet-front" />
        </mesh>
      </group>
    );
  }

  // Doorway: a lining with the leaf standing open against the reveal.
  return (
    <group>
      {[
        { args: [width, frame, depth] as const, pos: [0, height - frame / 2, 0] as const },
        { args: [frame, height, depth] as const, pos: [-width / 2 + frame / 2, height / 2, 0] as const },
        { args: [frame, height, depth] as const, pos: [width / 2 - frame / 2, height / 2, 0] as const },
      ].map((part, i) => (
        <mesh key={i} position={part.pos} castShadow receiveShadow>
          <boxGeometry args={part.args} />
          <SurfaceMaterial materialId={object.materials.front} family="cabinet-front" />
        </mesh>
      ))}
      <mesh position={[0, height / 2, -depth / 2 - 0.02]}>
        <boxGeometry args={[width - frame * 2, height - frame, 0.02]} />
        <meshStandardMaterial color="#1a1a1c" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------ accessories */

export function AccessoryModule({ object, product }: FixtureProps) {
  if (product.render.kind !== 'accessory') return null;

  const width = mmToM(object.dimensions.width);
  const height = mmToM(object.dimensions.height);
  const depth = mmToM(object.dimensions.depth);

  switch (product.render.variant) {
    case 'stool':
      return (
        <group>
          <mesh position={[0, height - 0.03, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[width / 2, width / 2, 0.06, 24]} />
            <SurfaceMaterial materialId={object.materials.front} family="cabinet-front" />
          </mesh>
          {/* Four splayed legs plus a footrest ring. */}
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sz], i) => (
            <mesh
              key={i}
              position={[(sx * width) / 3, (height - 0.06) / 2, (sz * depth) / 3]}
              castShadow
            >
              <cylinderGeometry args={[0.014, 0.018, height - 0.06, 10]} />
              <SurfaceMaterial materialId={object.materials.metal} family="metal" />
            </mesh>
          ))}
          <mesh position={[0, height * 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[width / 3.2, 0.008, 8, 24]} />
            <SurfaceMaterial materialId={object.materials.metal} family="metal" />
          </mesh>
        </group>
      );

    case 'plant':
      return (
        <group>
          <mesh position={[0, height * 0.14, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[width / 2.4, width / 3, height * 0.28, 20]} />
            <SurfaceMaterial materialId={object.materials.carcass} family="carcass" />
          </mesh>
          {/* Foliage suggested by a few overlapping spheres. */}
          {[
            [0, 0.62, 0, 0.9],
            [0.13, 0.5, 0.06, 0.66],
            [-0.12, 0.54, -0.05, 0.6],
            [0.04, 0.78, -0.08, 0.55],
          ].map(([x, yf, z, scale], i) => (
            <mesh key={i} position={[x, height * yf, z]} castShadow>
              <icosahedronGeometry args={[width * 0.5 * scale, 1]} />
              <meshStandardMaterial color={i % 2 ? '#4f6b4a' : '#5f7d56'} roughness={0.85} flatShading />
            </mesh>
          ))}
        </group>
      );

    case 'rug':
      return (
        <mesh position={[0, height / 2, 0]} receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <SurfaceMaterial materialId={object.materials.front} family="cabinet-front" repeat={[width, depth]} />
        </mesh>
      );

    default:
      return (
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <SurfaceMaterial materialId={object.materials.front} family="cabinet-front" />
        </mesh>
      );
  }
}

/* ------------------------------------------------------- standalone worktop */

export function WorktopModule({ object }: FixtureProps) {
  const width = mmToM(object.dimensions.width);
  const height = mmToM(object.dimensions.height);
  const depth = mmToM(object.dimensions.depth);

  return (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <SurfaceMaterial materialId={object.materials.worktop} family="countertop" repeat={[width, depth]} />
    </mesh>
  );
}
