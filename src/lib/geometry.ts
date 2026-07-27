import type { Dimensions, PlacedObject, Room, Vec3 } from '@/types';
import { degToRad, normaliseAngle } from './units';

/**
 * Planner geometry primitives.
 *
 * Room space is centred on the origin: x spans [-width/2, +width/2],
 * z spans [-length/2, +length/2], y rises from the floor at 0. All values are
 * millimetres. A module's local +Z axis points *out of its front*, so a module
 * with `rotationY = 0` has its back against the north wall.
 */

export interface Vec2 {
  x: number;
  z: number;
}

/** An oriented bounding box footprint on the floor plane. */
export interface Footprint {
  centre: Vec2;
  /** Extent along the module's local X axis. */
  width: number;
  /** Extent along the module's local Z axis. */
  depth: number;
  rotationY: number;
  /** Local X axis expressed in world space (unit length). */
  u: Vec2;
  /** Local Z axis expressed in world space (unit length) — points forward. */
  v: Vec2;
}

export type WallId = 'north' | 'east' | 'south' | 'west';

export interface Wall {
  id: WallId;
  /** Inward-facing unit normal. */
  normal: Vec2;
  /** Rotation, in degrees, that puts a module's back flat against this wall. */
  facingAngle: number;
  /** Signed distance from the origin to the wall's inner face along `normal`. */
  offset: number;
}

export const WALL_IDS: WallId[] = ['north', 'east', 'south', 'west'];

/* -------------------------------------------------------------- vectors */

export const vec2 = (x: number, z: number): Vec2 => ({ x, z });

export const addV = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, z: a.z + b.z });
export const subV = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, z: a.z - b.z });
export const scaleV = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, z: a.z * s });
export const dotV = (a: Vec2, b: Vec2): number => a.x * b.x + a.z * b.z;
export const lengthV = (a: Vec2): number => Math.hypot(a.x, a.z);
export const distanceV = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * World-space axes for a yaw angle in degrees.
 * Rotating local (0,0,1) about +Y by θ gives (sin θ, cos θ) in the xz plane.
 */
export function axesForRotation(rotationY: number): { u: Vec2; v: Vec2 } {
  const r = degToRad(rotationY);
  const s = Math.sin(r);
  const c = Math.cos(r);
  return { u: { x: c, z: -s }, v: { x: s, z: c } };
}

/* ------------------------------------------------------------ footprints */

export function footprintOf(
  centre: Vec2,
  dimensions: Dimensions,
  rotationY: number,
): Footprint {
  const { u, v } = axesForRotation(rotationY);
  return {
    centre,
    width: dimensions.width,
    depth: dimensions.depth,
    rotationY,
    u,
    v,
  };
}

export function footprintOfObject(object: PlacedObject): Footprint {
  return footprintOf(
    { x: object.position.x, z: object.position.z },
    object.dimensions,
    object.rotationY,
  );
}

/** The four corners of a footprint, in world space. */
export function footprintCorners(f: Footprint): Vec2[] {
  const hw = f.width / 2;
  const hd = f.depth / 2;
  const result: Vec2[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      result.push(addV(f.centre, addV(scaleV(f.u, sx * hw), scaleV(f.v, sz * hd))));
    }
  }
  return result;
}

/** Axis-aligned bounds of a footprint — cheap broad-phase test. */
export function footprintBounds(f: Footprint): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const corners = footprintCorners(f);
  return {
    minX: Math.min(...corners.map((c) => c.x)),
    maxX: Math.max(...corners.map((c) => c.x)),
    minZ: Math.min(...corners.map((c) => c.z)),
    maxZ: Math.max(...corners.map((c) => c.z)),
  };
}

/** Centre of the module's back face — the surface that meets a wall. */
export function backFaceCentre(f: Footprint): Vec2 {
  return addV(f.centre, scaleV(f.v, -f.depth / 2));
}

/* ---------------------------------------------------------------- walls */

export function wallsOf(room: Room): Wall[] {
  const hw = room.width / 2;
  const hl = room.length / 2;
  return [
    { id: 'north', normal: { x: 0, z: 1 }, facingAngle: 0, offset: hl },
    { id: 'east', normal: { x: -1, z: 0 }, facingAngle: 270, offset: hw },
    { id: 'south', normal: { x: 0, z: -1 }, facingAngle: 180, offset: hl },
    { id: 'west', normal: { x: 1, z: 0 }, facingAngle: 90, offset: hw },
  ];
}

/**
 * Perpendicular distance from a point to a wall's inner face.
 * Positive means the point is inside the room.
 */
export function distanceToWall(point: Vec2, wall: Wall): number {
  return wall.offset + dotV(point, wall.normal);
}

/* --------------------------------------------------- separating-axis test */

function projectOnto(corners: Vec2[], axis: Vec2): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const c of corners) {
    const p = dotV(c, axis);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return { min, max };
}

/**
 * True when two oriented footprints overlap by more than `tolerance`.
 * Modules that merely touch (a snapped run) are not considered overlapping.
 */
export function footprintsOverlap(a: Footprint, b: Footprint, tolerance = 2): boolean {
  const cornersA = footprintCorners(a);
  const cornersB = footprintCorners(b);
  const axes = [a.u, a.v, b.u, b.v];

  for (const axis of axes) {
    const pa = projectOnto(cornersA, axis);
    const pb = projectOnto(cornersB, axis);
    const overlap = Math.min(pa.max, pb.max) - Math.max(pa.min, pb.min);
    // A separating axis exists — the boxes cannot be intersecting.
    if (overlap <= tolerance) return false;
  }
  return true;
}

/** True when a footprint lies entirely inside the room's clear area. */
export function footprintInsideRoom(f: Footprint, room: Room, tolerance = 2): boolean {
  const hw = room.width / 2 + tolerance;
  const hl = room.length / 2 + tolerance;
  return footprintCorners(f).every(
    (c) => Math.abs(c.x) <= hw && Math.abs(c.z) <= hl,
  );
}

/** Do two objects' vertical extents overlap? */
export function verticalOverlap(a: PlacedObject, b: PlacedObject, tolerance = 2): boolean {
  const aMin = a.position.y;
  const aMax = a.position.y + a.dimensions.height;
  const bMin = b.position.y;
  const bMax = b.position.y + b.dimensions.height;
  return Math.min(aMax, bMax) - Math.max(aMin, bMin) > tolerance;
}

/* ------------------------------------------------------------- utilities */

export function clampPointToRoom(point: Vec2, room: Room, inset = 0): Vec2 {
  const hw = room.width / 2 - inset;
  const hl = room.length / 2 - inset;
  return {
    x: Math.min(hw, Math.max(-hw, point.x)),
    z: Math.min(hl, Math.max(-hl, point.z)),
  };
}

/** Angular difference between two headings, in degrees, within [0, 180]. */
export function angleDelta(a: number, b: number): number {
  const d = Math.abs(normaliseAngle(a) - normaliseAngle(b)) % 360;
  return d > 180 ? 360 - d : d;
}

/** True when two headings point the same way, within `tolerance` degrees. */
export function sameHeading(a: number, b: number, tolerance = 8): boolean {
  return angleDelta(a, b) <= tolerance;
}

export function toVec3(point: Vec2, y: number): Vec3 {
  return { x: point.x, y, z: point.z };
}
