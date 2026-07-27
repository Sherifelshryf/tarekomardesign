'use client';

import { memo, useCallback, useMemo } from 'react';
import { type ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getProduct } from '@/data/catalog';
import { degToRad, mmToM } from '@/lib/units';
import { usePlannerStore } from '@/stores/plannerStore';
import type { PlacedObject, ViewMode } from '@/types';
import { CabinetModule } from './modules/CabinetModule';
import {
  AccessoryModule,
  ApplianceModule,
  LightModule,
  OpeningModule,
  SinkModule,
  WorktopModule,
} from './modules/FixtureModules';
import { dragSession, setCameraControlsEnabled } from './interaction';

/**
 * One placed module in the scene.
 *
 * Owns the module's transform, its hover/selection affordances and the start of
 * a drag gesture. Geometry itself is delegated to the renderer matching the
 * product's `RenderSpec`, so swapping a procedural module for a real GLB later
 * touches only that renderer.
 */

interface PlacedObjectViewProps {
  object: PlacedObject;
  selected: boolean;
  hovered: boolean;
  viewMode: ViewMode;
  /** Red while the current drag position is invalid. */
  invalid: boolean;
  ceilingHeight: number;
}

function PlacedObjectViewInner({
  object,
  selected,
  hovered,
  viewMode,
  invalid,
  ceilingHeight,
}: PlacedObjectViewProps) {
  const product = getProduct(object.productId);
  const { camera, gl } = useThree();

  const select = usePlannerStore((s) => s.select);
  const hover = usePlannerStore((s) => s.hover);
  const beginDrag = usePlannerStore((s) => s.beginDrag);
  const toggleDoor = usePlannerStore((s) => s.toggleDoor);
  const toggleDrawer = usePlannerStore((s) => s.toggleDrawer);
  const lighting = usePlannerStore((s) => s.project.lighting);

  const walking = viewMode === 'walk';
  const editable = !walking && !object.locked;

  const position = useMemo<[number, number, number]>(
    () => [mmToM(object.position.x), mmToM(object.position.y), mmToM(object.position.z)],
    [object.position.x, object.position.y, object.position.z],
  );

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!editable) return;
      event.stopPropagation();
      select(object.id);

      // Project the grab point onto the module's own horizontal plane so the
      // module keeps its grab offset instead of jumping to the cursor.
      const planeY = mmToM(object.position.y);
      dragSession.plane.set(new THREE.Vector3(0, 1, 0), -planeY);

      const hit = new THREE.Vector3();
      if (event.ray.intersectPlane(dragSession.plane, hit)) {
        dragSession.offset.set(
          mmToM(object.position.x) - hit.x,
          0,
          mmToM(object.position.z) - hit.z,
        );
      } else {
        dragSession.offset.set(0, 0, 0);
      }

      dragSession.active = true;
      dragSession.objectId = object.id;
      dragSession.moved = false;
      setCameraControlsEnabled(false);
      beginDrag(object.id);
      gl.domElement.style.cursor = 'grabbing';
    },
    [editable, object.id, object.position.x, object.position.y, object.position.z, select, beginDrag, gl],
  );

  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (walking) return;
      event.stopPropagation();
      hover(object.id);
      if (!dragSession.active) gl.domElement.style.cursor = 'grab';
    },
    [walking, hover, object.id, gl],
  );

  const handlePointerOut = useCallback(() => {
    if (walking) return;
    hover(null);
    if (!dragSession.active) gl.domElement.style.cursor = 'auto';
  }, [walking, hover]);

  /** In the walkthrough, clicking a front opens or closes it. */
  const handleDoorClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!walking) return;
      event.stopPropagation();
      toggleDoor(object.id);
    },
    [walking, toggleDoor, object.id],
  );

  const handleDrawerClick = useCallback(
    (index: number, event: ThreeEvent<MouseEvent>) => {
      if (!walking) return;
      event.stopPropagation();
      toggleDrawer(object.id, index);
    },
    [walking, toggleDrawer, object.id],
  );

  if (!product) return null;

  const size: [number, number, number] = [
    mmToM(object.dimensions.width),
    mmToM(object.dimensions.height),
    mmToM(object.dimensions.depth),
  ];

  const body = (() => {
    switch (product.render.kind) {
      case 'cabinet':
      case 'sink-cabinet':
      case 'corner-cabinet':
      case 'wall-cabinet':
      case 'tall-cabinet':
      case 'island':
        return (
          <CabinetModule
            object={object}
            product={product}
            interactive={walking}
            onDoorClick={handleDoorClick}
            onDrawerClick={handleDrawerClick}
          />
        );
      case 'appliance':
        return <ApplianceModule object={object} product={product} />;
      case 'sink':
        return <SinkModule object={object} product={product} />;
      case 'light':
        return (
          <LightModule
            object={object}
            product={product}
            lightingMode={lighting.mode}
            ceilingHeight={ceilingHeight}
            warmth={lighting.warmth}
          />
        );
      case 'opening':
        return <OpeningModule object={object} product={product} />;
      case 'accessory':
        return <AccessoryModule object={object} product={product} />;
      case 'worktop':
        return <WorktopModule object={object} product={product} />;
      default:
        return null;
    }
  })();

  return (
    <group
      position={position}
      rotation={[0, degToRad(object.rotationY), 0]}
      onPointerDown={editable ? handlePointerDown : undefined}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {body}

      {!walking && (selected || hovered) && (
        <SelectionBox size={size} selected={selected} invalid={invalid} />
      )}
    </group>
  );
}

/* --------------------------------------------------------------- outline */

interface SelectionBoxProps {
  size: [number, number, number];
  selected: boolean;
  invalid: boolean;
}

/**
 * A crisp wireframe around the module. Hover gets a faint outline, selection a
 * solid accent one, and an invalid drag turns it red.
 */
function SelectionBox({ size, selected, invalid }: SelectionBoxProps) {
  const [width, height, depth] = size;

  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(width * 1.008 + 0.004, height * 1.004 + 0.004, depth * 1.008 + 0.004);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [width, height, depth]);

  const colour = invalid ? '#d0453b' : selected ? '#b98a4b' : '#8f8b83';

  return (
    <group position={[0, height / 2, 0]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color={colour}
          transparent
          opacity={selected ? 0.95 : 0.45}
          depthTest={false}
        />
      </lineSegments>

      {selected && (
        // A soft pad on the floor makes the selected footprint readable in plan.
        <mesh position={[0, -height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial
            color={invalid ? '#d0453b' : '#b98a4b'}
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Modules only re-render when their own data or interaction state changes —
 * dragging one cabinet leaves the other forty untouched.
 */
export const PlacedObjectView = memo(PlacedObjectViewInner, (prev, next) => {
  return (
    prev.object === next.object &&
    prev.selected === next.selected &&
    prev.hovered === next.hovered &&
    prev.viewMode === next.viewMode &&
    prev.invalid === next.invalid &&
    prev.ceilingHeight === next.ceilingHeight
  );
});
