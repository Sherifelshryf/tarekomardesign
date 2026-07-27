'use client';

import { type ComponentRef, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { mmToM } from '@/lib/units';
import type { Room, ViewMode } from '@/types';
import { registerControlsToggle } from './interaction';

/**
 * Camera behaviour for the three modes.
 *
 * Orbit is a constrained turntable: it cannot drop below the floor, cannot be
 * pushed outside a sensible shell around the room, and its pivot is tethered
 * near the centre — so the view can never get lost. Plan uses a genuine
 * orthographic projection rather than a perspective camera pointed downwards,
 * so parallel walls stay parallel and the drawing is measurable. Walk hands the
 * perspective camera over to the first-person controller.
 *
 * Mode changes animate rather than cut.
 */

type OrbitControlsRef = ComponentRef<typeof OrbitControls>;

interface CameraRigProps {
  room: Room;
  viewMode: ViewMode;
  /** Reports azimuth so the room shell knows which walls to hide. */
  onAzimuthChange: (azimuth: number) => void;
  /** Bumped to re-frame the camera on the room. */
  frameToken: number;
}

export function CameraRig({ room, viewMode, onAzimuthChange, frameToken }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsRef>(null);
  const perspectiveRef = useRef<THREE.PerspectiveCamera>(null);
  const orthographicRef = useRef<THREE.OrthographicCamera>(null);
  const { size } = useThree();

  const width = mmToM(room.width);
  const length = mmToM(room.length);
  const height = mmToM(room.height);
  const diagonal = Math.hypot(width, length);

  const plan = viewMode === 'plan';
  const walking = viewMode === 'walk';

  const desired = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const animating = useRef(false);
  const lastAzimuth = useRef(0);

  /**
   * Pixels per metre for the plan view. drei's OrthographicCamera measures its
   * frustum in pixels, so zoom is exactly the drawing scale.
   */
  const planZoom = useMemo(() => {
    const margin = 1.3;
    return Math.min(size.width / (width * margin), size.height / (length * margin));
  }, [size.width, size.height, width, length]);

  /*
   * Camera transforms are applied imperatively, never as JSX props.
   * R3F re-applies props on every render, so a live `position` prop would snap
   * the camera back to its authored position each time the scene re-rendered —
   * which would fight the walkthrough and undo the user's panning.
   */
  useEffect(() => {
    const perspective = perspectiveRef.current;
    if (perspective) {
      perspective.position.set(diagonal * 0.6, height * 1.2 + diagonal * 0.3, diagonal * 0.78);
      perspective.lookAt(0, height * 0.32, 0);
    }
    const orthographic = orthographicRef.current;
    if (orthographic) {
      orthographic.position.set(0, Math.max(diagonal * 1.4, 8), 0);
      orthographic.rotation.set(-Math.PI / 2, 0, 0);
    }
    // Mount only — later framing is handled by the animation below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Re-fit the plan zoom when the room or the viewport changes, not on every render. */
  useEffect(() => {
    const orthographic = orthographicRef.current;
    if (!orthographic) return;
    orthographic.zoom = planZoom;
    orthographic.updateProjectionMatrix();
  }, [planZoom]);

  /* Let a drag gesture suspend the controls without prop-drilling a ref. */
  useEffect(() => {
    registerControlsToggle((enabled) => {
      if (controlsRef.current) controlsRef.current.enabled = enabled;
    });
    return () => registerControlsToggle(null);
  }, []);

  /* Re-frame whenever the mode, the room size or the frame token changes. */
  useEffect(() => {
    if (walking) return;

    if (plan) {
      desired.current.set(0, Math.max(diagonal * 1.4, 8), 0);
      desiredTarget.current.set(0, 0, 0);
    } else {
      // A three-quarter view over the south-east corner reads best.
      desired.current.set(diagonal * 0.6, height * 1.2 + diagonal * 0.3, diagonal * 0.78);
      desiredTarget.current.set(0, height * 0.32, 0);
    }
    animating.current = true;
  }, [plan, walking, diagonal, height, frameToken]);

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current;
    if (!controls || walking) return;

    if (animating.current) {
      const blend = 1 - Math.exp(-4.5 * delta);
      camera.position.lerp(desired.current, blend);
      controls.target.lerp(desiredTarget.current, blend);
      controls.update();

      if (camera.position.distanceTo(desired.current) < 0.02) {
        camera.position.copy(desired.current);
        controls.target.copy(desiredTarget.current);
        controls.update();
        animating.current = false;
      }
    }

    // Tether the pivot so panning can never strand the view in empty space.
    // The camera moves with the correction, so the view itself doesn't jump.
    const limit = diagonal * 0.6;
    const target = controls.target;
    const radius = Math.hypot(target.x, target.z);
    if (radius > limit) {
      const shrink = limit / radius;
      const dx = target.x * shrink - target.x;
      const dz = target.z * shrink - target.z;
      target.x += dx;
      target.z += dz;
      camera.position.x += dx;
      camera.position.z += dz;
      controls.update();
    }
    // Keep the pivot between floor and ceiling too.
    const clampedY = Math.min(height, Math.max(0, target.y));
    if (clampedY !== target.y) {
      camera.position.y += clampedY - target.y;
      target.y = clampedY;
      controls.update();
    }

    // Only report meaningful changes — this drives a React re-render.
    const azimuth = controls.getAzimuthalAngle();
    if (Math.abs(azimuth - lastAzimuth.current) > 0.05) {
      lastAzimuth.current = azimuth;
      onAzimuthChange(azimuth);
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={perspectiveRef}
        makeDefault={!plan}
        fov={walking ? 72 : 42}
        near={0.05}
        far={Math.max(120, diagonal * 12)}
      />
      <OrthographicCamera
        ref={orthographicRef}
        makeDefault={plan}
        near={-500}
        far={1000}
      />

      {!walking && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          // Plan view is a drafting board: pan and zoom, never rotate.
          enableRotate={!plan}
          screenSpacePanning={plan}
          // Never tip under the floor, never sit exactly on the pole.
          minPolarAngle={plan ? 0 : 0.12}
          maxPolarAngle={plan ? 0 : Math.PI / 2 - 0.02}
          minDistance={plan ? 1 : 1.6}
          maxDistance={plan ? 400 : diagonal * 2.6}
          mouseButtons={{
            LEFT: plan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: plan ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      )}
    </>
  );
}
