import { getProduct } from '@/data/catalog';
import { validatePlacement } from './collision';
import type { PlacedObject, Product, Room } from '@/types';
import {
  type Vec2,
  type Wall,
  addV,
  axesForRotation,
  distanceToWall,
  sameHeading,
  scaleV,
  wallsOf,
} from './geometry';
import { snapToStep } from './units';

/**
 * The snapping engine.
 *
 * Two behaviours, applied in order while a module is being dragged:
 *  1. **Wall snapping** — when a module's back comes within `WALL_SNAP_RANGE`
 *     of a wall it rotates to face into the room and pins its back flush.
 *  2. **Module snapping** — when it then comes near a compatible neighbour it
 *     latches beside it, backs aligned, forming a continuous run.
 *
 * Both are magnetic rather than modal: the module keeps sliding freely along
 * the wall, it just cannot drift off it.
 */

/** How close the back face must come to a wall before it latches, in mm. */
export const WALL_SNAP_RANGE = 320;
/** How close a module must come to a neighbour's side before it latches, in mm. */
export const MODULE_SNAP_RANGE = 260;
/** Modules only snap together if their undersides are within this much, in mm. */
export const TIER_TOLERANCE = 120;
/** Free-moving modules land on this grid when nothing else claims them, in mm. */
export const FREE_GRID = 10;

export interface SnapInput {
  product: Product;
  /** Desired footprint centre from the pointer, in millimetres. */
  centre: Vec2;
  rotationY: number;
  /** Underside height, in millimetres. */
  elevation: number;
  width: number;
  depth: number;
  room: Room;
  /** Everything already in the room, excluding the module being moved. */
  others: PlacedObject[];
}

export interface SnapResult {
  centre: Vec2;
  rotationY: number;
  elevation: number;
  snappedToWall: boolean;
  snappedToModule: boolean;
  /** Which wall claimed the module, if any. */
  wallId?: Wall['id'];
  /** Id of the neighbour the module latched onto, if any. */
  neighbourId?: string;
}

/* --------------------------------------------------------------- helpers */

/** Places a footprint centre so its back sits flush against `wall`. */
function centreAgainstWall(
  centre: Vec2,
  wall: Wall,
  width: number,
  depth: number,
  room: Room,
): Vec2 {
  // The centre must sit half a depth in from the wall's inner face.
  const perpendicular = scaleV(wall.normal, depth / 2 - wall.offset);

  // The remaining axis stays under pointer control, clamped so the module
  // cannot overhang the ends of the wall.
  const slidesAlongX = wall.normal.x === 0;
  const span = slidesAlongX ? room.width : room.length;
  const limit = Math.max(0, span / 2 - width / 2);
  const slide = slidesAlongX ? centre.x : centre.z;
  const clampedSlide = Math.min(limit, Math.max(-limit, slide));

  return slidesAlongX
    ? { x: clampedSlide, z: perpendicular.z }
    : { x: perpendicular.x, z: clampedSlide };
}

/** Finds the wall whose face is nearest the module's back, within range. */
function findWallSnap(
  input: SnapInput,
): { wall: Wall; centre: Vec2 } | null {
  const walls = wallsOf(input.room);
  let best: { wall: Wall; gap: number } | null = null;

  for (const wall of walls) {
    // How far the back face would be from this wall if we faced it.
    const centreDistance = distanceToWall(input.centre, wall);
    const gap = centreDistance - input.depth / 2;
    if (gap > WALL_SNAP_RANGE || gap < -input.depth) continue;
    if (!best || Math.abs(gap) < Math.abs(best.gap)) best = { wall, gap };
  }

  if (!best) return null;
  return {
    wall: best.wall,
    centre: centreAgainstWall(
      input.centre,
      best.wall,
      input.width,
      input.depth,
      input.room,
    ),
  };
}

interface NeighbourCandidate {
  centre: Vec2;
  rotationY: number;
  neighbourId: string;
  distance: number;
}

/**
 * Offers the two positions flanking a neighbour, backs aligned, and returns
 * whichever is closest to where the pointer already is.
 */
function findModuleSnap(input: SnapInput, rotationY: number): NeighbourCandidate | null {
  let best: NeighbourCandidate | null = null;

  for (const other of input.others) {
    const otherProduct = getProduct(other.productId);
    if (!otherProduct?.snapping.toModules) continue;

    // Only modules sitting at the same height form a run together.
    if (Math.abs(other.position.y - input.elevation) > TIER_TOLERANCE) continue;

    // The run must be straight: allow latching onto neighbours facing the same
    // way, or onto the heading the wall has already given us.
    if (!sameHeading(other.rotationY, rotationY, 20)) continue;

    const { u, v } = axesForRotation(other.rotationY);
    const otherCentre: Vec2 = { x: other.position.x, z: other.position.z };

    // Align backs: shift along the depth axis by the half-depth difference.
    const depthAligned = addV(
      otherCentre,
      scaleV(v, input.depth / 2 - other.dimensions.depth / 2),
    );

    for (const side of [-1, 1] as const) {
      const lateral = (other.dimensions.width + input.width) / 2;
      const candidate = addV(depthAligned, scaleV(u, side * lateral));
      const distance = Math.hypot(candidate.x - input.centre.x, candidate.z - input.centre.z);
      if (distance > MODULE_SNAP_RANGE) continue;
      if (!best || distance < best.distance) {
        best = { centre: candidate, rotationY: other.rotationY, neighbourId: other.id, distance };
      }
    }
  }

  return best;
}

/* ------------------------------------------------------------------ main */

/**
 * Resolves a raw pointer position into a final placement.
 * Pure — it reads the room and its contents and returns a new transform.
 */
export function resolveSnap(input: SnapInput): SnapResult {
  const { product } = input;

  let centre = input.centre;
  let rotationY = input.rotationY;
  const elevation = input.elevation;
  let snappedToWall = false;
  let snappedToModule = false;
  let wallId: Wall['id'] | undefined;
  let neighbourId: string | undefined;

  // Openings live inside the wall itself rather than against it.
  if (product.mount === 'opening') {
    const opening = snapOpeningToWall(input);
    return { ...opening, elevation, snappedToModule: false };
  }

  if (product.snapping.toWall) {
    const wallSnap = findWallSnap(input);
    if (wallSnap) {
      centre = wallSnap.centre;
      rotationY = wallSnap.wall.facingAngle;
      wallId = wallSnap.wall.id;
      snappedToWall = true;
    }
  }

  if (product.snapping.toModules) {
    const moduleSnap = findModuleSnap({ ...input, centre }, rotationY);
    if (moduleSnap) {
      centre = moduleSnap.centre;
      rotationY = moduleSnap.rotationY;
      neighbourId = moduleSnap.neighbourId;
      snappedToModule = true;
    }
  }

  if (!snappedToWall && !snappedToModule) {
    centre = { x: snapToStep(centre.x, FREE_GRID), z: snapToStep(centre.z, FREE_GRID) };
  }

  return { centre, rotationY, elevation, snappedToWall, snappedToModule, wallId, neighbourId };
}

/** Doors and windows are always hosted by the nearest wall plane. */
function snapOpeningToWall(input: SnapInput): {
  centre: Vec2;
  rotationY: number;
  snappedToWall: boolean;
  wallId?: Wall['id'];
} {
  const walls = wallsOf(input.room);
  let best: { wall: Wall; distance: number } | null = null;

  for (const wall of walls) {
    const distance = Math.abs(distanceToWall(input.centre, wall));
    if (!best || distance < best.distance) best = { wall, distance };
  }
  if (!best) return { centre: input.centre, rotationY: input.rotationY, snappedToWall: false };

  const { wall } = best;
  const onWall = scaleV(wall.normal, -wall.offset);
  const horizontal = wall.normal.x === 0;
  const limit = (horizontal ? input.room.width : input.room.length) / 2 - input.width / 2;
  const slide = horizontal ? input.centre.x : input.centre.z;
  const clamped = Math.min(limit, Math.max(-limit, slide));

  return {
    centre: horizontal ? { x: clamped, z: onWall.z } : { x: onWall.x, z: clamped },
    rotationY: wall.facingAngle,
    snappedToWall: true,
    wallId: wall.id,
  };
}

/**
 * Recomputes a wall-hosted module's transform after the room is resized, so
 * existing designs stay glued to their walls instead of floating.
 */
export function reflowToRoom(object: PlacedObject, room: Room): PlacedObject {
  const product = getProduct(object.productId);
  if (!product) return object;

  const halfW = room.width / 2;
  const halfL = room.length / 2;

  const clampedCentre: Vec2 = {
    x: Math.min(halfW, Math.max(-halfW, object.position.x)),
    z: Math.min(halfL, Math.max(-halfL, object.position.z)),
  };

  if (!product.snapping.toWall && product.mount !== 'opening') {
    // Keep freestanding pieces fully inside the new footprint.
    const inset = Math.max(object.dimensions.width, object.dimensions.depth) / 2;
    return {
      ...object,
      position: {
        ...object.position,
        x: Math.min(halfW - inset, Math.max(-halfW + inset, object.position.x)),
        z: Math.min(halfL - inset, Math.max(-halfL + inset, object.position.z)),
      },
    };
  }

  const result = resolveSnap({
    product,
    centre: clampedCentre,
    rotationY: object.rotationY,
    elevation: object.position.y,
    width: object.dimensions.width,
    depth: object.dimensions.depth,
    room,
    others: [],
  });

  return {
    ...object,
    position: { x: result.centre.x, y: object.position.y, z: result.centre.z },
    rotationY: result.rotationY,
  };
}

/**
 * Chooses where a module added from the catalog should land.
 *
 * The priority is what a designer would actually do: continue the run you are
 * already building, then start a new one against a free stretch of wall, and
 * only then drop the module in open floor. Every candidate is checked with the
 * real collision test, so a catalog click never produces an invalid placement.
 */
export function findFreeSpot(
  product: Product,
  room: Room,
  existing: PlacedObject[],
): Vec2 {
  const { width, height, depth } = product.dimensions;

  const fits = (centre: Vec2, rotationY: number): boolean =>
    validatePlacement({
      product,
      centre,
      rotationY,
      elevation: product.elevation,
      width,
      height,
      depth,
      room,
      others: existing,
    }).valid;

  /* 1. Extend a run the user has already started. */
  if (product.snapping.toModules) {
    const neighbours = existing.filter((other) => {
      if (Math.abs(other.position.y - product.elevation) > TIER_TOLERANCE) return false;
      return getProduct(other.productId)?.snapping.toModules ?? false;
    });

    for (const other of neighbours) {
      const { u, v } = axesForRotation(other.rotationY);
      const otherCentre: Vec2 = { x: other.position.x, z: other.position.z };
      // Line the backs up, then step sideways by the two half-widths.
      const backAligned = addV(otherCentre, scaleV(v, depth / 2 - other.dimensions.depth / 2));

      for (const side of [1, -1] as const) {
        const lateral = (other.dimensions.width + width) / 2;
        const candidate = addV(backAligned, scaleV(u, side * lateral));
        if (fits(candidate, other.rotationY)) return candidate;
      }
    }
  }

  /* 2. Start a new run along a free stretch of wall. */
  if (product.snapping.toWall) {
    const step = 50;
    for (const wall of wallsOf(room)) {
      const slidesAlongX = wall.normal.x === 0;
      const span = slidesAlongX ? room.width : room.length;
      const limit = span / 2 - width / 2;
      const perpendicular = scaleV(wall.normal, depth / 2 - wall.offset);

      for (let slide = -limit; slide <= limit; slide += step) {
        const candidate: Vec2 = slidesAlongX
          ? { x: slide, z: perpendicular.z }
          : { x: perpendicular.x, z: slide };
        if (fits(candidate, wall.facingAngle)) return candidate;
      }
    }
  }

  /* 3. Open floor — the middle of the room, spiralling outwards if occupied. */
  if (fits({ x: 0, z: 0 }, 0)) return { x: 0, z: 0 };

  const ring = Math.max(width, depth) * 0.75;
  for (let radius = ring; radius < Math.max(room.width, room.length); radius += ring) {
    for (let turn = 0; turn < 12; turn += 1) {
      const angle = (turn / 12) * Math.PI * 2;
      const candidate: Vec2 = {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
      };
      if (fits(candidate, 0)) return candidate;
    }
  }

  // Nothing fits — drop it in the centre and let the invalid-placement
  // indicator tell the user, rather than silently refusing to add anything.
  return { x: 0, z: 0 };
}
