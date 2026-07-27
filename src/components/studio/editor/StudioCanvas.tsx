'use client';

import { Suspense, useCallback, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlannerStore } from '@/stores/plannerStore';
import { disposeProceduralTextures } from '@/components/three/proceduralTextures';
import { DebugCameraBridge } from '../DebugBridge';
import { Scene } from './Scene';
import { dragSession } from './interaction';

/**
 * The Canvas host.
 *
 * Owns the renderer configuration and exposes a capture hook. Screenshots
 * re-render the scene on demand and read the buffer immediately, which avoids
 * keeping `preserveDrawingBuffer` on for the whole session — that costs
 * memory bandwidth on every frame for a feature used once in a while.
 */

interface StudioCanvasProps {
  frameToken: number;
  onExitWalk: () => void;
  onWalkLockChange?: (locked: boolean) => void;
  /** Receives a function that renders and returns a PNG data URL. */
  onCaptureReady?: (capture: () => string | null) => void;
}

export function StudioCanvas({
  frameToken,
  onExitWalk,
  onWalkLockChange,
  onCaptureReady,
}: StudioCanvasProps) {
  const select = usePlannerStore((s) => s.select);
  const lighting = usePlannerStore((s) => s.project.lighting);

  // Free the shared canvas textures when the Studio unmounts.
  useEffect(() => () => disposeProceduralTextures(), []);

  const handleMissed = useCallback(() => {
    // A drag that ends over empty space must not clear the selection.
    if (dragSession.moved) return;
    select(null);
  }, [select]);

  return (
    <Canvas
      shadows={lighting.shadows ? 'soft' : false}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        // Needed so a screenshot can read the buffer after an on-demand render.
        preserveDrawingBuffer: true,
      }}
      onPointerMissed={handleMissed}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        scene.background = new THREE.Color('#e8e5df');
      }}
    >
      <Suspense fallback={null}>
        <BackgroundSync mode={lighting.mode} />
        <CaptureBridge onCaptureReady={onCaptureReady} />
        <DebugCameraBridge />
        <Scene
          frameToken={frameToken}
          onExitWalk={onExitWalk}
          onWalkLockChange={onWalkLockChange}
        />
      </Suspense>
    </Canvas>
  );
}

/** Keeps the backdrop in step with the day/night switch. */
function BackgroundSync({ mode }: { mode: 'day' | 'night' }) {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const target = new THREE.Color(mode === 'day' ? '#e8e5df' : '#14161b');
    if (!(scene.background instanceof THREE.Color)) {
      scene.background = target;
      return;
    }
    // Animate the change so toggling modes doesn't flash.
    const from = scene.background.clone();
    const start = performance.now();
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / 450);
      (scene.background as THREE.Color).copy(from).lerp(target, t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mode, scene]);

  return null;
}

/** Hands a screenshot function back out of the Canvas. */
function CaptureBridge({ onCaptureReady }: { onCaptureReady?: (fn: () => string | null) => void }) {
  const { gl, scene, camera } = useThree();
  const ready = useRef(onCaptureReady);
  ready.current = onCaptureReady;

  useEffect(() => {
    ready.current?.(() => {
      try {
        // Render fresh so the buffer definitely holds the current frame.
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      } catch (error) {
        console.warn('[TOD] Capture failed:', error);
        return null;
      }
    });
  }, [gl, scene, camera]);

  return null;
}
