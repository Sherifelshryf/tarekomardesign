'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { resolveWalkCollision } from '@/lib/collision';
import type { Vec2 } from '@/lib/geometry';
import { mToMm, mmToM } from '@/lib/units';
import type { PlacedObject, Room } from '@/types';

/**
 * First-person walkthrough.
 *
 * Desktop uses pointer lock with WASD; touch devices use the on-screen sticks
 * rendered by the Studio UI, which write into `touchInput` below. Movement is
 * accelerated and damped rather than binary, and the body is a capsule swept
 * against the room and its furniture, so you can walk up to a run of cabinets
 * and along it without clipping through.
 */

/** Eye height for an average adult, in metres. */
const EYE_HEIGHT = 1.62;
const WALK_SPEED = 2.6;
const ACCELERATION = 12;
const DAMPING = 9;
/** Radius of the walker's collision capsule, in millimetres. */
const BODY_RADIUS = 240;
const LOOK_SENSITIVITY = 0.0022;

/**
 * Shared touch state, written by the mobile joystick UI outside the Canvas.
 * Kept off React state so dragging a stick doesn't re-render the scene.
 */
export const touchInput = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
};

export function resetTouchInput(): void {
  touchInput.moveX = 0;
  touchInput.moveY = 0;
  touchInput.lookX = 0;
  touchInput.lookY = 0;
}

interface WalkControlsProps {
  room: Room;
  objects: PlacedObject[];
  active: boolean;
  /** Called when the user presses Escape or exits pointer lock. */
  onExit: () => void;
  /** Reports lock state so the UI can prompt the user to click to look. */
  onLockChange?: (locked: boolean) => void;
}

export function WalkControls({ room, objects, active, onExit, onLockChange }: WalkControlsProps) {
  const { camera, gl } = useThree();

  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const locked = useRef(false);
  const objectsRef = useRef(objects);
  objectsRef.current = objects;

  /* Drop the camera to eye height in the middle of the free floor on entry. */
  useEffect(() => {
    if (!active) return;

    const start = findStandingSpot(room, objects);
    camera.position.set(mmToM(start.x), EYE_HEIGHT, mmToM(start.z));

    // Face what the user has designed, not whichever wall happens to be longest.
    yaw.current = headingTowards(start, objects, room);
    pitch.current = 0;
    camera.rotation.order = 'YXZ';
    camera.rotation.set(0, yaw.current, 0);
    velocity.current.set(0, 0, 0);
    keys.current = {};
    resetTouchInput();
    // Entering the walkthrough should not carry over stale key state.
  }, [active, room, camera]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Keyboard, pointer lock and mouse look. */
  useEffect(() => {
    if (!active) return;
    const element = gl.domElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        onExit();
        return;
      }
      keys.current[event.code] = true;
      // Stop the page scrolling behind the walkthrough.
      if (MOVEMENT_CODES.has(event.code)) event.preventDefault();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!locked.current) return;
      yaw.current -= event.movementX * LOOK_SENSITIVITY;
      pitch.current -= event.movementY * LOOK_SENSITIVITY;
      // Stop just short of straight up/down so the horizon never flips.
      pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    };

    const handleLockChange = () => {
      locked.current = document.pointerLockElement === element;
      onLockChange?.(locked.current);
    };

    const requestLock = () => {
      if (document.pointerLockElement !== element) {
        // Chrome returns a promise that rejects if the gesture was too recent.
        const result = element.requestPointerLock() as unknown as Promise<void> | undefined;
        if (result && typeof result.catch === 'function') result.catch(() => {});
      }
    };

    element.addEventListener('click', requestLock);
    document.addEventListener('pointerlockchange', handleLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      element.removeEventListener('click', requestLock);
      document.removeEventListener('pointerlockchange', handleLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (document.pointerLockElement === element) document.exitPointerLock();
      locked.current = false;
    };
  }, [active, gl, onExit, onLockChange]);

  useFrame((_, rawDelta) => {
    if (!active) return;
    // Clamp delta so a background tab doesn't teleport the walker on return.
    const delta = Math.min(rawDelta, 0.05);

    // ---- look -------------------------------------------------------------
    yaw.current -= touchInput.lookX * LOOK_SENSITIVITY * 12;
    pitch.current -= touchInput.lookY * LOOK_SENSITIVITY * 12;
    pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    touchInput.lookX = 0;
    touchInput.lookY = 0;
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch.current, yaw.current, 0);

    // ---- intent -----------------------------------------------------------
    const forward =
      (keys.current.KeyW || keys.current.ArrowUp ? 1 : 0) -
      (keys.current.KeyS || keys.current.ArrowDown ? 1 : 0) +
      touchInput.moveY;
    const strafe =
      (keys.current.KeyD || keys.current.ArrowRight ? 1 : 0) -
      (keys.current.KeyA || keys.current.ArrowLeft ? 1 : 0) +
      touchInput.moveX;

    const intent = new THREE.Vector3(strafe, 0, -forward);
    if (intent.lengthSq() > 1) intent.normalize();
    // Move relative to where the walker is looking, ignoring pitch.
    intent.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    const boost = keys.current.ShiftLeft || keys.current.ShiftRight ? 1.8 : 1;
    const targetVelocity = intent.multiplyScalar(WALK_SPEED * boost);

    velocity.current.lerp(targetVelocity, 1 - Math.exp(-ACCELERATION * delta));
    if (intent.lengthSq() < 0.0001) {
      velocity.current.multiplyScalar(Math.exp(-DAMPING * delta));
    }

    // ---- move and resolve collisions --------------------------------------
    const from: Vec2 = { x: mToMm(camera.position.x), z: mToMm(camera.position.z) };
    const to: Vec2 = {
      x: from.x + mToMm(velocity.current.x * delta),
      z: from.z + mToMm(velocity.current.z * delta),
    };

    const resolved = resolveWalkCollision(
      from,
      to,
      mToMm(EYE_HEIGHT),
      room,
      objectsRef.current,
      BODY_RADIUS,
    );

    camera.position.x = mmToM(resolved.x);
    camera.position.z = mmToM(resolved.z);
    camera.position.y = EYE_HEIGHT;
  });

  return null;
}

const MOVEMENT_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
]);

/**
 * Which way to look on arrival.
 *
 * Aims at the centre of mass of the furniture, weighted by footprint, so
 * entering the walkthrough puts the kitchen in front of you. Falls back to the
 * middle of the room when nothing has been placed yet.
 */
function headingTowards(from: Vec2, objects: PlacedObject[], room: Room): number {
  let totalWeight = 0;
  let sumX = 0;
  let sumZ = 0;

  for (const object of objects) {
    // Ignore rugs and lighting — they shouldn't pull the view.
    if (object.dimensions.height < 400) continue;
    const weight = object.dimensions.width * object.dimensions.depth;
    totalWeight += weight;
    sumX += object.position.x * weight;
    sumZ += object.position.z * weight;
  }

  const focus: Vec2 =
    totalWeight > 0 ? { x: sumX / totalWeight, z: sumZ / totalWeight } : { x: 0, z: 0 };

  const dx = focus.x - from.x;
  const dz = focus.z - from.z;
  if (Math.hypot(dx, dz) < 1) {
    // Standing on the focus point — face down the length of the room instead.
    return room.length >= room.width ? Math.PI : Math.PI / 2;
  }

  // The camera looks down its local -Z, so yaw must put -Z along (dx, dz).
  return Math.atan2(-dx, -dz);
}

/**
 * Picks a spot to stand.
 *
 * Scores a grid over the floor by how much room there is in every direction —
 * furniture *and* walls — and takes the best. Spawning in the middle of the
 * room is ideal, but a centre occupied by an island shouldn't push the walker
 * into a corner facing plasterboard.
 */
function findStandingSpot(room: Room, objects: PlacedObject[]): Vec2 {
  const steps = 11;
  let best: { point: Vec2; score: number } | null = null;

  for (let ix = 0; ix < steps; ix += 1) {
    for (let iz = 0; iz < steps; iz += 1) {
      const point: Vec2 = {
        x: -room.width / 2 + ((ix + 0.5) * room.width) / steps,
        z: -room.length / 2 + ((iz + 0.5) * room.length) / steps,
      };

      const wallClearance = Math.min(
        room.width / 2 - Math.abs(point.x),
        room.length / 2 - Math.abs(point.z),
      );
      const score = Math.min(clearanceAt(point, objects), wallClearance - BODY_RADIUS);

      // Prefer the centre when two spots are equally clear.
      const centreBias = -Math.hypot(point.x, point.z) * 0.05;
      const total = score + centreBias;

      if (score > 0 && (!best || total > best.score)) best = { point, score: total };
    }
  }

  return best?.point ?? { x: 0, z: 0 };
}

/** Distance from `point` to the nearest blocking module, in millimetres. */
function clearanceAt(point: Vec2, objects: PlacedObject[]): number {
  let nearest = Infinity;
  for (const object of objects) {
    // Ignore anything you'd walk under or over.
    if (object.position.y > 1800) continue;
    if (object.position.y + object.dimensions.height < 300) continue;

    const radius = Math.max(object.dimensions.width, object.dimensions.depth) / 2;
    const distance = Math.hypot(point.x - object.position.x, point.z - object.position.z) - radius;
    nearest = Math.min(nearest, distance);
  }
  return nearest === Infinity ? 9999 : nearest - BODY_RADIUS;
}
