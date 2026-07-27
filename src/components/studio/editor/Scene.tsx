'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ThreeEvent, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { getProduct } from '@/data/catalog';
import { WALL_IDS, wallsOf } from '@/lib/geometry';
import { angleDelta } from '@/lib/geometry';
import { mmToM } from '@/lib/units';
import { usePlannerStore } from '@/stores/plannerStore';
import { PlanLabels, RoomDimensions, WorktopLayer } from './Annotations';
import { CameraRig } from './CameraRig';
import { DragController } from './DragController';
import { LightingRig } from './LightingRig';
import { PlacedObjectView } from './PlacedObjectView';
import { computeHiddenWalls, RoomShell } from './RoomShell';
import { WalkControls } from './WalkControls';
import { dragSession } from './interaction';

/**
 * Everything inside the Canvas.
 *
 * Deliberately thin: it wires the room, the modules, the camera and the
 * lighting together and subscribes to the narrowest possible slices of the
 * store, so moving one cabinet doesn't re-render the whole scene.
 */

interface SceneProps {
  /** Bumped by the toolbar to re-frame the camera. */
  frameToken: number;
  onExitWalk: () => void;
  onWalkLockChange?: (locked: boolean) => void;
}

export function Scene({ frameToken, onExitWalk, onWalkLockChange }: SceneProps) {
  const room = usePlannerStore((s) => s.project.room);
  const objects = usePlannerStore((s) => s.project.objects);
  const lighting = usePlannerStore((s) => s.project.lighting);
  const worktopMaterialId = usePlannerStore((s) => s.project.worktopMaterialId);
  const viewMode = usePlannerStore((s) => s.viewMode);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const hoveredId = usePlannerStore((s) => s.hoveredId);
  const draggingId = usePlannerStore((s) => s.draggingId);
  const feedback = usePlannerStore((s) => s.feedback);
  const showDimensions = usePlannerStore((s) => s.showDimensions);
  const select = usePlannerStore((s) => s.select);

  const [azimuth, setAzimuth] = useState(0.8);
  const { gl } = useThree();

  // The crosshair-free walkthrough hides the cursor; editing restores it.
  useEffect(() => {
    gl.domElement.style.cursor = viewMode === 'walk' ? 'none' : 'auto';
  }, [viewMode, gl]);

  const walking = viewMode === 'walk';
  const plan = viewMode === 'plan';
  const ceilingHeight = mmToM(room.height);

  const hidden = useMemo(() => computeHiddenWalls(viewMode, azimuth), [viewMode, azimuth]);

  /**
   * Doors and windows belong to a wall. When the cutaway removes that wall they
   * have to go with it, or their frames are left standing in open air.
   */
  const visibleObjects = useMemo(() => {
    const walls = wallsOf(room);
    return objects.filter((object) => {
      if (getProduct(object.productId)?.mount !== 'opening') return true;
      const host = walls.find((wall) => angleDelta(wall.facingAngle, object.rotationY) < 45);
      return !host || !hidden[host.id];
    });
  }, [objects, room, hidden]);

  const handleFloorClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (walking || dragSession.moved) return;
      event.stopPropagation();
      select(null);
    },
    [walking, select],
  );

  const width = mmToM(room.width);
  const length = mmToM(room.length);

  // The floor plane doubles as a click target for deselection.
  const floorPlane = useMemo(
    () => (
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        onClick={handleFloorClick}
        visible={false}
      >
        <planeGeometry args={[width, length]} />
        <meshBasicMaterial />
      </mesh>
    ),
    [width, length, handleFloorClick],
  );

  return (
    <group>
      <CameraRig
        room={room}
        viewMode={viewMode}
        onAzimuthChange={setAzimuth}
        frameToken={frameToken}
      />

      <LightingRig room={room} lighting={lighting} objects={objects} viewMode={viewMode} />

      <RoomShell room={room} viewMode={viewMode} hidden={hidden} />
      {floorPlane}

      {/* A faint construction grid, only while laying out. */}
      {!walking && (
        <Grid
          position={[0, 0.002, 0]}
          args={[width, length]}
          cellSize={plan ? 0.5 : 1}
          cellThickness={0.5}
          cellColor={plan ? '#b7b0a4' : '#a9a296'}
          sectionSize={plan ? 1 : 5}
          sectionThickness={1}
          sectionColor={plan ? '#8e877b' : '#8e877b'}
          fadeDistance={plan ? 400 : Math.max(width, length) * 2.4}
          fadeStrength={plan ? 0 : 1}
          followCamera={false}
          infiniteGrid={false}
        />
      )}

      <WorktopLayer objects={objects} materialId={worktopMaterialId} />

      {visibleObjects.map((object) => (
        <PlacedObjectView
          key={object.id}
          object={object}
          selected={object.id === selectedId}
          hovered={object.id === hoveredId}
          viewMode={viewMode}
          invalid={object.id === draggingId && feedback?.valid === false}
          ceilingHeight={ceilingHeight}
        />
      ))}

      <RoomDimensions room={room} viewMode={viewMode} visible={showDimensions} />
      <PlanLabels objects={objects} visible={plan && showDimensions} />

      <DragController />

      <WalkControls
        room={room}
        objects={objects}
        active={walking}
        onExit={onExitWalk}
        onLockChange={onWalkLockChange}
      />

    </group>
  );
}
