'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { mmToM } from '@/lib/units';
import type { LightingSettings, PlacedObject, Room, ViewMode } from '@/types';

/**
 * Interior lighting.
 *
 * Day is driven by a warm key light through the window wall plus soft ambient
 * fill. Night drops the key almost to nothing and lets the placed fixtures and
 * a low warm fill carry the room. Every value is damped rather than switched,
 * so toggling modes dissolves between them instead of popping.
 */

interface LightingRigProps {
  room: Room;
  lighting: LightingSettings;
  /** Watched so the shadow map can refresh exactly when the design changes. */
  objects: PlacedObject[];
  viewMode: ViewMode;
}

interface Preset {
  ambient: number;
  ambientColour: string;
  keyIntensity: number;
  keyColour: string;
  fillIntensity: number;
  bounceIntensity: number;
  environmentIntensity: number;
}

const DAY: Preset = {
  ambient: 0.55,
  ambientColour: '#eef2f6',
  keyIntensity: 2.6,
  keyColour: '#fff4e2',
  fillIntensity: 0.6,
  bounceIntensity: 0.35,
  environmentIntensity: 0.85,
};

/**
 * Plan view is a drawing, not a photograph — raking shadows across a floor plan
 * obscure the layout, so it gets flat, even illumination instead.
 */
const PLAN: Preset = {
  ambient: 1.5,
  ambientColour: '#ffffff',
  keyIntensity: 0.35,
  keyColour: '#ffffff',
  fillIntensity: 0.35,
  bounceIntensity: 0,
  environmentIntensity: 0.35,
};

const NIGHT: Preset = {
  ambient: 0.1,
  ambientColour: '#39404d',
  keyIntensity: 0.14,
  keyColour: '#8fa5c8',
  fillIntensity: 0.1,
  bounceIntensity: 0.06,
  environmentIntensity: 0.12,
};

export function LightingRig({ room, lighting, objects, viewMode }: LightingRigProps) {
  const width = mmToM(room.width);
  const length = mmToM(room.length);
  const height = mmToM(room.height);

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const bounceRef = useRef<THREE.PointLight>(null);
  // Interior fixtures always live, but dimmed to nothing during the day.
  const houseRef = useRef<THREE.PointLight>(null);

  const plan = viewMode === 'plan';
  const target = plan ? PLAN : lighting.mode === 'day' ? DAY : NIGHT;
  // Plan view is measured, not lit — the brightness slider doesn't apply.
  const exposure = plan ? 1 : lighting.exposure;
  const shadowsOn = lighting.shadows && !plan;

  // Reused across frames — allocating Colors inside useFrame would churn the GC.
  const ambientTargetColour = useRef(new THREE.Color(DAY.ambientColour));
  const keyTargetColour = useRef(new THREE.Color(DAY.keyColour));
  ambientTargetColour.current.set(target.ambientColour);
  keyTargetColour.current.set(target.keyColour);

  // Size the shadow frustum to the room so shadows stay crisp in a big space.
  const shadowExtent = Math.max(width, length) * 0.9;

  useEffect(() => {
    if (!keyRef.current) return;
    keyRef.current.target.position.set(0, 0, 0);
    keyRef.current.target.updateMatrixWorld();
  }, []);

  /*
   * Shadows are rendered on demand rather than every frame.
   *
   * A directional light's shadow map depends only on the geometry and the
   * light, never on where the camera is — so re-rendering it while the user
   * merely orbits is pure waste, and at 2K it dominates the frame budget.
   * Instead the map is refreshed whenever the design actually changes.
   */
  useEffect(() => {
    const key = keyRef.current;
    if (!key) return;
    key.shadow.autoUpdate = false;
    key.shadow.needsUpdate = true;
  }, []);

  useEffect(() => {
    const key = keyRef.current;
    if (!key) return;
    key.shadow.needsUpdate = true;
  }, [objects, room, lighting.shadows, lighting.mode, viewMode]);

  useFrame((_, delta) => {
    const rate = 3;
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.damp(
        ambientRef.current.intensity,
        target.ambient * exposure,
        rate,
        delta,
      );
      ambientRef.current.color.lerp(ambientTargetColour.current, 1 - Math.exp(-rate * delta));
    }
    if (keyRef.current) {
      keyRef.current.intensity = THREE.MathUtils.damp(
        keyRef.current.intensity,
        target.keyIntensity * exposure,
        rate,
        delta,
      );
      keyRef.current.color.lerp(keyTargetColour.current, 1 - Math.exp(-rate * delta));
    }
    if (fillRef.current) {
      fillRef.current.intensity = THREE.MathUtils.damp(
        fillRef.current.intensity,
        target.fillIntensity * exposure,
        rate,
        delta,
      );
    }
    if (bounceRef.current) {
      bounceRef.current.intensity = THREE.MathUtils.damp(
        bounceRef.current.intensity,
        target.bounceIntensity * exposure,
        rate,
        delta,
      );
    }
    if (houseRef.current) {
      // A soft ceiling wash so a night scene with no fixtures is still readable.
      houseRef.current.intensity = THREE.MathUtils.damp(
        houseRef.current.intensity,
        !plan && lighting.mode === 'night' ? 1.5 * exposure : 0,
        rate,
        delta,
      );
    }
  });

  const warmColour = new THREE.Color().lerpColors(
    new THREE.Color('#cfe0ff'),
    new THREE.Color('#ffc98a'),
    lighting.warmth,
  );

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={DAY.ambient} color={DAY.ambientColour} />

      {/* Key: daylight raking in over the east wall. */}
      <directionalLight
        ref={keyRef}
        position={[width * 0.85, height * 1.5, length * 0.55]}
        intensity={DAY.keyIntensity}
        color={DAY.keyColour}
        castShadow={shadowsOn}
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={Math.max(20, shadowExtent * 4)}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
      />

      {/* Fill from the opposite side, no shadows — keeps the cost down. */}
      <directionalLight
        ref={fillRef}
        position={[-width, height * 1.1, -length * 0.6]}
        intensity={DAY.fillIntensity}
        color="#dfe8f2"
      />

      {/* Warm bounce off the floor. */}
      <pointLight
        ref={bounceRef}
        position={[0, height * 0.35, 0]}
        intensity={DAY.bounceIntensity}
        distance={Math.max(width, length) * 2}
        decay={2}
        color={warmColour}
      />

      <pointLight
        ref={houseRef}
        position={[0, height * 0.92, 0]}
        intensity={0}
        distance={Math.max(width, length) * 1.8}
        decay={2}
        color={warmColour}
        castShadow={false}
      />

      {/*
        The environment map is rendered from local geometry rather than a
        preset, which would pull an HDRI from a CDN at runtime. This keeps the
        Studio fully self-contained and instant to load.
      */}
      <Environment resolution={64} environmentIntensity={target.environmentIntensity * exposure}>
        <StudioEnvironment mode={lighting.mode} />
      </Environment>
    </group>
  );
}

/**
 * A miniature sky rendered into the environment cubemap: a graduated dome,
 * a bright panel standing in for the window, and a floor bounce card.
 */
function StudioEnvironment({ mode }: { mode: LightingSettings['mode'] }) {
  const day = mode === 'day';
  return (
    <group>
      <mesh scale={[100, 100, 100]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial
          color={day ? '#dfe7f0' : '#171b23'}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Window light source. */}
      <mesh position={[12, 6, 4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshBasicMaterial color={day ? '#fffaf0' : '#2b3444'} />
      </mesh>
      {/* Warm bounce from below. */}
      <mesh position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color={day ? '#c9bda9' : '#14171d'} />
      </mesh>
    </group>
  );
}
