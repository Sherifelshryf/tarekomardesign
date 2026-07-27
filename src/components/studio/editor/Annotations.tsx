'use client';

import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { generateWorktopRuns } from '@/lib/worktops';
import { SurfaceMaterial } from '@/components/three/SurfaceMaterial';
import { degToRad, formatMetres, mmToM } from '@/lib/units';
import type { PlacedObject, Room, ViewMode } from '@/types';

/**
 * Measurement overlay and the generated worktop.
 *
 * Dimension lines are drawn just outside the room so they never sit on top of
 * the design, and the labels are HTML so they stay crisp and always face the
 * camera.
 *
 * Labels are deliberately a constant screen size rather than distance-scaled:
 * a measurement should be equally readable however far the camera is, and
 * distance scaling degenerates under the orthographic plan camera, where it
 * blows a label up until it covers the viewport.
 */

interface DimensionsProps {
  room: Room;
  viewMode: ViewMode;
  visible: boolean;
}

export function RoomDimensions({ room, viewMode, visible }: DimensionsProps) {
  const width = mmToM(room.width);
  const length = mmToM(room.length);

  if (!visible || viewMode === 'walk') return null;

  const y = viewMode === 'plan' ? 0.02 : 0.01;
  const offset = 0.42;

  return (
    <group>
      <DimensionLine
        from={[-width / 2, y, length / 2 + offset]}
        to={[width / 2, y, length / 2 + offset]}
        label={formatMetres(room.width)}
      />
      <DimensionLine
        from={[width / 2 + offset, y, -length / 2]}
        to={[width / 2 + offset, y, length / 2]}
        label={formatMetres(room.length)}
      />
      {viewMode !== 'plan' && (
        <Html
          position={[-width / 2, mmToM(room.height) / 2, -length / 2]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <DimensionLabel value={formatMetres(room.height)} />
        </Html>
      )}
    </group>
  );
}

interface DimensionLineProps {
  from: [number, number, number];
  to: [number, number, number];
  label: string;
}

function DimensionLine({ from, to, label }: DimensionLineProps) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];

  // Short ticks at each end, perpendicular to the run.
  const horizontal = Math.abs(to[0] - from[0]) > Math.abs(to[2] - from[2]);
  const tick = 0.09;
  const tickOffset: [number, number, number] = horizontal ? [0, 0, tick] : [tick, 0, 0];

  return (
    <group>
      <Line points={[from, to]} color="#8a8378" lineWidth={1.2} />
      {[from, to].map((point, i) => (
        <Line
          key={i}
          points={[
            [point[0] - tickOffset[0], point[1], point[2] - tickOffset[2]],
            [point[0] + tickOffset[0], point[1], point[2] + tickOffset[2]],
          ]}
          color="#8a8378"
          lineWidth={1.2}
        />
      ))}
      <Html
        position={mid}
        center
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <DimensionLabel value={label} />
      </Html>
    </group>
  );
}

function DimensionLabel({ value }: { value: string }) {
  return (
    <span className="tabular block whitespace-nowrap rounded-[2px] bg-[#221f1c]/88 px-1.5 py-0.5 text-[10px] font-medium tracking-[0.12em] text-[#f7f5f1]">
      {value}
    </span>
  );
}

/* ---------------------------------------------------------------- worktop */

interface WorktopLayerProps {
  objects: PlacedObject[];
  materialId: string;
}

/**
 * The continuous worktop, regenerated from the current layout every time the
 * modules change. Nothing about it is stored — move a cabinet and the slab
 * re-templates itself.
 */
export function WorktopLayer({ objects, materialId }: WorktopLayerProps) {
  const runs = useMemo(() => generateWorktopRuns(objects), [objects]);

  return (
    <group>
      {runs.map((run) => {
        const width = mmToM(run.dimensions.width);
        const height = mmToM(run.dimensions.height);
        const depth = mmToM(run.dimensions.depth);
        return (
          <mesh
            key={run.id}
            position={[mmToM(run.position.x), mmToM(run.position.y) + height / 2, mmToM(run.position.z)]}
            rotation={[0, degToRad(run.rotationY), 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, height, depth]} />
            <SurfaceMaterial materialId={materialId} family="countertop" repeat={[width, depth]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------- plan labels */

interface PlanLabelsProps {
  objects: PlacedObject[];
  visible: boolean;
}

/** Module widths called out in plan view, the way a layout drawing reads. */
export function PlanLabels({ objects, visible }: PlanLabelsProps) {
  if (!visible) return null;

  return (
    <group>
      {objects
        // Only floor-standing modules — wall units would clutter the drawing.
        .filter((object) => object.position.y < 200 && object.dimensions.width >= 300)
        .map((object) => (
          <Html
            key={object.id}
            position={[mmToM(object.position.x), 0.05, mmToM(object.position.z)]}
            center
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div className="whitespace-nowrap rounded-sm bg-white/85 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-stone-700">
              {object.dimensions.width}
            </div>
          </Html>
        ))}
    </group>
  );
}
