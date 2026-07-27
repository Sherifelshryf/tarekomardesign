import { getProduct } from '@/data/catalog';
import type { PlacedObject, PlacementFeedback, Product, Room } from '@/types';
import {
  footprintInsideRoom,
  footprintOf,
  footprintOfObject,
  footprintsOverlap,
  verticalOverlap,
  type Vec2,
} from './geometry';

/**
 * Placement validation.
 *
 * A placement is rejected when the module would leave the room, punch through
 * a wall, poke through the ceiling, or overlap another solid module. Snapped
 * runs deliberately touch, so the overlap test carries a small tolerance.
 */

export interface ValidationInput {
  product: Product;
  centre: Vec2;
  rotationY: number;
  elevation: number;
  width: number;
  height: number;
  depth: number;
  room: Room;
  others: PlacedObject[];
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  /** Ids of the modules being intersected, for highlighting. */
  blockingIds: string[];
}

/** Modules may touch by this much before it counts as an overlap, in mm. */
const OVERLAP_TOLERANCE = 12;

export function validatePlacement(input: ValidationInput): ValidationResult {
  const { product, room } = input;
  const footprint = footprintOf(
    input.centre,
    { width: input.width, height: input.height, depth: input.depth },
    input.rotationY,
  );

  // Doors and windows are cut into walls, so the room-bounds test doesn't apply.
  const isOpening = product.mount === 'opening';

  if (!isOpening && !footprintInsideRoom(footprint, room, OVERLAP_TOLERANCE)) {
    return { valid: false, reason: 'Outside the room', blockingIds: [] };
  }

  if (input.elevation + input.height > room.height + OVERLAP_TOLERANCE) {
    return { valid: false, reason: 'Taller than the ceiling', blockingIds: [] };
  }

  if (input.elevation < -OVERLAP_TOLERANCE) {
    return { valid: false, reason: 'Below floor level', blockingIds: [] };
  }

  if (!product.solid) {
    return { valid: true, blockingIds: [] };
  }

  const candidate: PlacedObject = {
    id: '__candidate__',
    productId: product.id,
    position: { x: input.centre.x, y: input.elevation, z: input.centre.z },
    rotationY: input.rotationY,
    dimensions: { width: input.width, height: input.height, depth: input.depth },
    materials: {},
    configuration: { handle: 'minimal', doorOpen: 0, drawersOpen: [], flipped: false },
    locked: false,
  };

  const blockingIds: string[] = [];
  for (const other of input.others) {
    const otherProduct = getProduct(other.productId);
    if (!otherProduct?.solid) continue;
    if (!verticalOverlap(candidate, other, OVERLAP_TOLERANCE)) continue;
    if (footprintsOverlap(footprint, footprintOfObject(other), OVERLAP_TOLERANCE)) {
      blockingIds.push(other.id);
    }
  }

  if (blockingIds.length > 0) {
    return { valid: false, reason: 'Overlaps another module', blockingIds };
  }

  return { valid: true, blockingIds: [] };
}

/** Convenience wrapper producing the feedback shape the editor UI renders. */
export function placementFeedback(
  validation: ValidationResult,
  snappedToWall: boolean,
  snappedToModule: boolean,
): PlacementFeedback {
  return {
    valid: validation.valid,
    snappedToWall,
    snappedToModule,
    reason: validation.reason,
  };
}

/**
 * Walkthrough collision: keeps the camera inside the room and out of solid
 * furniture. Returns a corrected position for the requested move.
 *
 * The camera is treated as a circle of `radius`, tested against each module's
 * axis-aligned bounds in that module's local frame — cheap and stable enough
 * for first-person movement at interior scale.
 */
export function resolveWalkCollision(
  from: Vec2,
  to: Vec2,
  eyeHeight: number,
  room: Room,
  objects: PlacedObject[],
  radius = 260,
): Vec2 {
  const limitX = room.width / 2 - radius;
  const limitZ = room.length / 2 - radius;

  let next: Vec2 = {
    x: Math.min(limitX, Math.max(-limitX, to.x)),
    z: Math.min(limitZ, Math.max(-limitZ, to.z)),
  };

  for (const object of objects) {
    const product = getProduct(object.productId);
    if (!product?.solid) continue;

    // Ignore anything the body passes cleanly under or over.
    const bottom = object.position.y;
    const top = object.position.y + object.dimensions.height;
    if (top < 200 || bottom > eyeHeight + 300) continue;

    next = pushOutOfModule(next, from, object, radius);
  }

  return next;
}

/** Pushes a point out of one module along whichever local axis is shallowest. */
function pushOutOfModule(
  point: Vec2,
  previous: Vec2,
  object: PlacedObject,
  radius: number,
): Vec2 {
  const f = footprintOfObject(object);
  const rel = { x: point.x - f.centre.x, z: point.z - f.centre.z };

  // Project into the module's local frame.
  const localX = rel.x * f.u.x + rel.z * f.u.z;
  const localZ = rel.x * f.v.x + rel.z * f.v.z;

  const halfW = f.width / 2 + radius;
  const halfD = f.depth / 2 + radius;

  const penX = halfW - Math.abs(localX);
  const penZ = halfD - Math.abs(localZ);
  if (penX <= 0 || penZ <= 0) return point;

  // Resolve along the axis of least penetration — classic AABB depenetration.
  let correctedX = localX;
  let correctedZ = localZ;
  if (penX < penZ) {
    correctedX = Math.sign(localX || (previous.x - f.centre.x) || 1) * halfW;
  } else {
    correctedZ = Math.sign(localZ || (previous.z - f.centre.z) || 1) * halfD;
  }

  return {
    x: f.centre.x + correctedX * f.u.x + correctedZ * f.v.x,
    z: f.centre.z + correctedX * f.u.z + correctedZ * f.v.z,
  };
}
