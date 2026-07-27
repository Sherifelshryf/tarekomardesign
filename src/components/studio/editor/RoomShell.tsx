'use client';

import * as THREE from 'three';
import { SurfaceMaterial } from '@/components/three/SurfaceMaterial';
import { mmToM } from '@/lib/units';
import type { WallId } from '@/lib/geometry';
import type { Room, ViewMode } from '@/types';

export type HiddenWalls = Record<WallId, boolean>;

/**
 * Which walls sit between the camera and the room.
 *
 * Exported so that doors and windows hosted by a hidden wall can disappear
 * with it — otherwise a cutaway leaves their frames floating in mid-air.
 */
export function computeHiddenWalls(viewMode: ViewMode, cameraAzimuth: number): HiddenWalls {
  if (viewMode !== 'orbit') {
    return { north: false, south: false, east: false, west: false };
  }
  const dirX = Math.sin(cameraAzimuth);
  const dirZ = Math.cos(cameraAzimuth);
  return {
    // The camera sits on +Z when dirZ > 0, so the south wall is in the way.
    south: dirZ > 0.1,
    north: dirZ < -0.1,
    east: dirX > 0.1,
    west: dirX < -0.1,
  };
}

/**
 * The architecture: floor, four walls, skirting and an optional ceiling.
 *
 * Walls are single-sided planes facing into the room. In the orbiting editor
 * the two walls between the camera and the room would block the view, so they
 * fade out as the camera passes them — the standard "cutaway" behaviour of an
 * interior planner. In the walkthrough every wall is solid.
 */

interface RoomShellProps {
  room: Room;
  viewMode: ViewMode;
  /** Which walls the camera is currently looking through. */
  hidden: HiddenWalls;
}

export function RoomShell({ room, viewMode, hidden }: RoomShellProps) {
  const width = mmToM(room.width);
  const length = mmToM(room.length);
  const height = mmToM(room.height);
  const thickness = mmToM(room.wallThickness);

  const walking = viewMode === 'walk';
  const plan = viewMode === 'plan';

  const wallOpacity = 1;

  return (
    <group>
      {/* ------------------------------------------------------------ floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <SurfaceMaterial
          materialId={room.floorMaterialId}
          family="floor"
          repeat={[width, length]}
        />
      </mesh>

      {/* ------------------------------------------------------------ walls */}
      {!plan && (
        <>
          <WallPanel
            hidden={hidden.north}
            width={width}
            height={height}
            thickness={thickness}
            position={[0, height / 2, -length / 2 - thickness / 2]}
            rotationY={0}
            materialId={room.wallMaterialId}
            opacity={wallOpacity}
          />
          <WallPanel
            hidden={hidden.south}
            width={width}
            height={height}
            thickness={thickness}
            position={[0, height / 2, length / 2 + thickness / 2]}
            rotationY={Math.PI}
            materialId={room.wallMaterialId}
            opacity={wallOpacity}
          />
          <WallPanel
            hidden={hidden.west}
            width={length}
            height={height}
            thickness={thickness}
            position={[-width / 2 - thickness / 2, height / 2, 0]}
            rotationY={Math.PI / 2}
            materialId={room.wallMaterialId}
            opacity={wallOpacity}
          />
          <WallPanel
            hidden={hidden.east}
            width={length}
            height={height}
            thickness={thickness}
            position={[width / 2 + thickness / 2, height / 2, 0]}
            rotationY={-Math.PI / 2}
            materialId={room.wallMaterialId}
            opacity={wallOpacity}
          />
        </>
      )}

      {/* ---------------------------------------------------------- ceiling */}
      {room.ceilingVisible && !plan && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
          <planeGeometry args={[width, length]} />
          <meshStandardMaterial color="#f2f0ec" roughness={0.95} side={THREE.FrontSide} />
        </mesh>
      )}

      {/* ------------------------------------------- plan-mode wall outline */}
      {plan && <PlanWalls width={width} length={length} thickness={thickness} />}
    </group>
  );
}

/* ------------------------------------------------------------------ walls */

interface WallPanelProps {
  hidden: boolean;
  width: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  rotationY: number;
  materialId: string;
  opacity: number;
}

function WallPanel({
  hidden,
  width,
  height,
  thickness,
  position,
  rotationY,
  materialId,
  opacity,
}: WallPanelProps) {
  if (hidden) return null;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width, height, thickness]} />
        <SurfaceMaterial
          materialId={materialId}
          family="wall"
          repeat={[width, height]}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Skirting board picks out the junction with the floor. */}
      <mesh position={[0, -height / 2 + 0.05, thickness / 2 + 0.008]} receiveShadow>
        <boxGeometry args={[width, 0.1, 0.016]} />
        <meshStandardMaterial color="#f7f6f3" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Solid black wall bands, the way a floor plan is drawn. */
function PlanWalls({ width, length, thickness }: { width: number; length: number; thickness: number }) {
  const t = Math.max(thickness, 0.1);
  const bands: Array<{ args: [number, number]; position: [number, number, number] }> = [
    { args: [width + t * 2, t], position: [0, 0.004, -length / 2 - t / 2] },
    { args: [width + t * 2, t], position: [0, 0.004, length / 2 + t / 2] },
    { args: [t, length], position: [-width / 2 - t / 2, 0.004, 0] },
    { args: [t, length], position: [width / 2 + t / 2, 0.004, 0] },
  ];

  return (
    <group>
      {bands.map((band, i) => (
        <mesh key={i} position={band.position} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={band.args} />
          <meshBasicMaterial color="#2a2724" />
        </mesh>
      ))}
    </group>
  );
}
