'use client';

import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { SurfaceMaterial } from '@/components/three/SurfaceMaterial';
import { KITCHEN_STANDARDS } from '@/data/catalog';
import { mmToM } from '@/lib/units';
import type { PlacedObject, Product } from '@/types';
import {
  Carcass,
  DoorPanel,
  DrawerFront,
  FRONT_GAP,
  Handle,
  PANEL_THICKNESS,
  type PartMaterials,
  Shelf,
} from './CabinetParts';

/**
 * Cabinet-family renderer.
 *
 * Base units, sink units, wall units, tall units and islands are all the same
 * carcass with a different front layout, so one component drives them from the
 * product's `RenderSpec`.
 */

export interface ModuleProps {
  object: PlacedObject;
  product: Product;
  /** Fires when a door or drawer front is clicked during the walkthrough. */
  onDoorClick?: (event: ThreeEvent<MouseEvent>) => void;
  onDrawerClick?: (index: number, event: ThreeEvent<MouseEvent>) => void;
  interactive?: boolean;
}

export function CabinetModule({ object, product, onDoorClick, onDrawerClick, interactive }: ModuleProps) {
  const width = mmToM(object.dimensions.width);
  const height = mmToM(object.dimensions.height);
  const depth = mmToM(object.dimensions.depth);

  const materials: PartMaterials = useMemo(
    () => ({
      front: object.materials.front,
      carcass: object.materials.carcass,
      metal: object.materials.metal,
    }),
    [object.materials.front, object.materials.carcass, object.materials.metal],
  );

  const spec = product.render;
  const { handle, doorOpen, drawersOpen } = object.configuration;

  /* ------------------------------------------------------------- islands */
  if (spec.kind === 'island') {
    const overhang = mmToM(spec.overhang);
    const worktopThickness = mmToM(KITCHEN_STANDARDS.worktopThickness);
    const bodyDepth = depth - overhang;
    const drawerZone = width * 0.55;

    return (
      <group>
        <Carcass width={width} height={height} depth={bodyDepth} materials={materials} plinth={0.1} />

        {/* Drawer bank on the working side. */}
        <group position={[-(width - drawerZone) / 2, 0, 0]}>
          <DrawerStack
            count={spec.drawers}
            width={drawerZone - FRONT_GAP * 2}
            depth={bodyDepth}
            bottom={0.1}
            top={height}
            z={bodyDepth / 2 + PANEL_THICKNESS / 2}
            handle={handle}
            drawersOpen={drawersOpen}
            materials={materials}
            onDrawerClick={interactive ? onDrawerClick : undefined}
          />
        </group>

        {/* Cupboards on the remainder. */}
        <group position={[drawerZone / 2, 0, 0]}>
          <DoorRow
            doors={spec.doors}
            width={width - drawerZone - FRONT_GAP * 2}
            height={height - 0.1 - FRONT_GAP * 2}
            centreY={0.1 + (height - 0.1) / 2}
            z={bodyDepth / 2 + PANEL_THICKNESS / 2}
            handle={handle}
            open={doorOpen}
            materials={materials}
            onDoorClick={interactive ? onDoorClick : undefined}
          />
        </group>

        {/* The island carries its own worktop, oversailing for seating. */}
        <mesh position={[0, height + worktopThickness / 2, overhang / 2]} castShadow receiveShadow>
          <boxGeometry args={[width + 0.04, worktopThickness, depth + 0.04]} />
          <SurfaceMaterial
            materialId={object.materials.worktop}
            family="countertop"
            repeat={[width, depth]}
          />
        </mesh>
      </group>
    );
  }

  /* --------------------------------------------------------- tall units */
  if (spec.kind === 'tall-cabinet') {
    const drawerHeight = spec.drawers > 0 ? Math.min(0.25, (height - 0.1) / 6) : 0;
    const drawerZoneHeight = drawerHeight * spec.drawers;
    const doorZoneBottom = 0.1 + drawerZoneHeight;

    return (
      <group>
        <Carcass width={width} height={height} depth={depth} materials={materials} plinth={0.1} />
        {spec.drawers > 0 && (
          <DrawerStack
            count={spec.drawers}
            width={width - FRONT_GAP * 2}
            depth={depth}
            bottom={0.1}
            top={doorZoneBottom}
            z={depth / 2 + PANEL_THICKNESS / 2}
            handle={handle}
            drawersOpen={drawersOpen}
            materials={materials}
            onDrawerClick={interactive ? onDrawerClick : undefined}
          />
        )}
        <DoorRow
          doors={2}
          width={width - FRONT_GAP * 2}
          height={height - doorZoneBottom - FRONT_GAP}
          centreY={doorZoneBottom + (height - doorZoneBottom) / 2}
          z={depth / 2 + PANEL_THICKNESS / 2}
          handle={handle}
          open={doorOpen}
          materials={materials}
          onDoorClick={interactive ? onDoorClick : undefined}
        />
        <Shelf width={width} depth={depth} y={height * 0.55} materials={materials} />
        <Shelf width={width} depth={depth} y={height * 0.78} materials={materials} />
      </group>
    );
  }

  /* --------------------------------------------------------- wall units */
  if (spec.kind === 'wall-cabinet') {
    if (spec.openShelves) {
      return (
        <group>
          {/* Open shelving: two uprights and horizontal boards. */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[(side * (width - PANEL_THICKNESS)) / 2, height / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[PANEL_THICKNESS, height, depth]} />
              <SurfaceMaterial materialId={materials.carcass} family="carcass" repeat={[depth, height]} />
            </mesh>
          ))}
          {Array.from({ length: spec.openShelves + 1 }, (_, i) => (
            <mesh
              key={i}
              position={[0, (height / spec.openShelves!) * i, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[width, PANEL_THICKNESS, depth]} />
              <SurfaceMaterial materialId={materials.carcass} family="carcass" repeat={[width, depth]} />
            </mesh>
          ))}
        </group>
      );
    }

    return (
      <group>
        <Carcass width={width} height={height} depth={depth} materials={materials} />
        <DoorRow
          doors={spec.doors}
          width={width - FRONT_GAP * 2}
          height={height - FRONT_GAP * 2}
          centreY={height / 2}
          z={depth / 2 + PANEL_THICKNESS / 2}
          handle={handle}
          open={doorOpen}
          materials={materials}
          onDoorClick={interactive ? onDoorClick : undefined}
        />
        <Shelf width={width} depth={depth} y={height / 2} materials={materials} />
      </group>
    );
  }

  /* ------------------------------------------------------ corner units */
  if (spec.kind === 'corner-cabinet') {
    const doorWidth = width * 0.5;
    return (
      <group>
        <Carcass width={width} height={height} depth={depth} materials={materials} plinth={0.1} />
        {/* A single door on the accessible face of the L. */}
        <DoorPanel
          width={doorWidth - FRONT_GAP}
          height={height - 0.1 - FRONT_GAP * 2}
          x={-(width - doorWidth) / 2}
          y={0.1 + (height - 0.1) / 2}
          z={depth / 2 + PANEL_THICKNESS / 2}
          hinge="left"
          open={doorOpen}
          handle={handle}
          materials={materials}
          onSelect={interactive ? onDoorClick : undefined}
        />
        {/* Blank filler across the inaccessible corner. */}
        <mesh
          position={[(width - doorWidth) / 2 + FRONT_GAP, 0.1 + (height - 0.1) / 2, depth / 2 + PANEL_THICKNESS / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[doorWidth - FRONT_GAP, height - 0.1 - FRONT_GAP * 2, PANEL_THICKNESS]} />
          <SurfaceMaterial materialId={materials.front} family="cabinet-front" repeat={[doorWidth, height]} />
        </mesh>
      </group>
    );
  }

  /* ------------------------------------------------------- sink units */
  if (spec.kind === 'sink-cabinet') {
    // A shallow dummy drawer front where the bowl steals the drawer space.
    const dummyHeight = 0.14;
    const doorBottom = 0.1;
    const doorHeight = height - doorBottom - dummyHeight - FRONT_GAP * 2;

    return (
      <group>
        <Carcass width={width} height={height} depth={depth} materials={materials} plinth={0.1} />
        <DoorRow
          doors={spec.doors}
          width={width - FRONT_GAP * 2}
          height={doorHeight}
          centreY={doorBottom + doorHeight / 2}
          z={depth / 2 + PANEL_THICKNESS / 2}
          handle={handle}
          open={doorOpen}
          materials={materials}
          onDoorClick={interactive ? onDoorClick : undefined}
        />
        <mesh
          position={[0, height - dummyHeight / 2 - FRONT_GAP, depth / 2 + PANEL_THICKNESS / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width - FRONT_GAP * 2, dummyHeight, PANEL_THICKNESS]} />
          <SurfaceMaterial materialId={materials.front} family="cabinet-front" repeat={[width, dummyHeight]} />
        </mesh>
        <Handle
          style={handle}
          materials={materials}
          orientation="horizontal"
          length={Math.min(width * 0.5, 0.32)}
          position={[0, height - dummyHeight / 2 - FRONT_GAP, depth / 2 + PANEL_THICKNESS + 0.012]}
        />
      </group>
    );
  }

  /* ------------------------------------------------- base cabinet (default) */
  const drawers = spec.kind === 'cabinet' ? spec.drawers : 0;
  const doors = spec.kind === 'cabinet' ? spec.doors : 0;
  const plinth = spec.kind === 'cabinet' && spec.plinth ? 0.1 : 0;

  return (
    <group>
      <Carcass width={width} height={height} depth={depth} materials={materials} plinth={plinth} />

      {drawers > 0 ? (
        <DrawerStack
          count={drawers}
          width={width - FRONT_GAP * 2}
          depth={depth}
          bottom={plinth}
          top={height}
          z={depth / 2 + PANEL_THICKNESS / 2}
          handle={handle}
          drawersOpen={drawersOpen}
          materials={materials}
          onDrawerClick={interactive ? onDrawerClick : undefined}
        />
      ) : (
        <>
          <DoorRow
            doors={doors}
            width={width - FRONT_GAP * 2}
            height={height - plinth - FRONT_GAP * 2}
            centreY={plinth + (height - plinth) / 2}
            z={depth / 2 + PANEL_THICKNESS / 2}
            handle={handle}
            open={doorOpen}
            materials={materials}
            onDoorClick={interactive ? onDoorClick : undefined}
          />
          <Shelf width={width} depth={depth} y={plinth + (height - plinth) / 2} materials={materials} />
        </>
      )}
    </group>
  );
}

/* ------------------------------------------------------------- sub-layouts */

interface DoorRowProps {
  doors: number;
  width: number;
  height: number;
  centreY: number;
  z: number;
  handle: PlacedObject['configuration']['handle'];
  open: number;
  materials: PartMaterials;
  onDoorClick?: (event: ThreeEvent<MouseEvent>) => void;
}

/** One or two doors filling an opening, hinged on their outer edges. */
function DoorRow({ doors, width, height, centreY, z, handle, open, materials, onDoorClick }: DoorRowProps) {
  if (doors <= 0) return null;

  if (doors === 1) {
    return (
      <DoorPanel
        width={width}
        height={height}
        x={0}
        y={centreY}
        z={z}
        hinge="left"
        open={open}
        handle={handle}
        materials={materials}
        onSelect={onDoorClick}
      />
    );
  }

  const leafWidth = (width - FRONT_GAP) / 2;
  return (
    <>
      <DoorPanel
        width={leafWidth}
        height={height}
        x={-(leafWidth + FRONT_GAP) / 2}
        y={centreY}
        z={z}
        hinge="left"
        open={open}
        handle={handle}
        materials={materials}
        onSelect={onDoorClick}
      />
      <DoorPanel
        width={leafWidth}
        height={height}
        x={(leafWidth + FRONT_GAP) / 2}
        y={centreY}
        z={z}
        hinge="right"
        open={open}
        handle={handle}
        materials={materials}
        onSelect={onDoorClick}
      />
    </>
  );
}

interface DrawerStackProps {
  count: number;
  width: number;
  depth: number;
  bottom: number;
  top: number;
  z: number;
  handle: PlacedObject['configuration']['handle'];
  drawersOpen: number[];
  materials: PartMaterials;
  onDrawerClick?: (index: number, event: ThreeEvent<MouseEvent>) => void;
}

/**
 * A stack of drawer fronts. The bottom drawer is made deeper — the way a real
 * pan drawer bank is built — rather than dividing the height evenly.
 */
function DrawerStack({
  count,
  width,
  depth,
  bottom,
  top,
  z,
  handle,
  drawersOpen,
  materials,
  onDrawerClick,
}: DrawerStackProps) {
  const available = top - bottom - FRONT_GAP * (count + 1);
  if (available <= 0 || count <= 0) return null;

  // Weight the lowest drawer more heavily; the rest share what's left.
  const weights = Array.from({ length: count }, (_, i) => (i === 0 && count > 1 ? 1.7 : 1));
  const weightTotal = weights.reduce((sum, w) => sum + w, 0);

  let cursor = bottom + FRONT_GAP;
  return (
    <>
      {weights.map((weight, index) => {
        const drawerHeight = (available * weight) / weightTotal;
        const y = cursor + drawerHeight / 2;
        cursor += drawerHeight + FRONT_GAP;
        return (
          <DrawerFront
            key={index}
            width={width}
            height={drawerHeight}
            depth={depth}
            y={y}
            z={z}
            open={drawersOpen[index] ?? 0}
            handle={handle}
            materials={materials}
            onSelect={onDrawerClick ? (event) => onDrawerClick(index, event) : undefined}
          />
        );
      })}
    </>
  );
}
