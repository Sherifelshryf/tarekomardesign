'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { generateWorktopRuns } from '@/lib/worktops';
import { usePlannerStore } from '@/stores/plannerStore';

/**
 * Development-only inspection hooks.
 *
 * Exposes the planner store, the generated worktop runs and the live camera on
 * `window` so the planner can be driven and asserted against from a console or
 * an end-to-end test.
 *
 * Off in production builds unless `NEXT_PUBLIC_TOD_DEBUG=1` is set at build
 * time, which is how CI exercises the real production bundle rather than a
 * development one. A normal deploy leaves the flag unset and these hooks are
 * dead code. Never imported by the marketing site.
 */

declare global {
  interface Window {
    __tod?: typeof usePlannerStore;
    __todWorktops?: () => ReturnType<typeof generateWorktopRuns>;
    __todCamera?: () => { x: number; y: number; z: number };
    __todRenderInfo?: () => { calls: number; triangles: number; geometries: number; textures: number; programs: number };
  }
}

const ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_TOD_DEBUG === '1';

/** Store-level hooks. Mounted outside the Canvas. */
export function DebugBridge() {
  useEffect(() => {
    if (!ENABLED) return;
    window.__tod = usePlannerStore;
    window.__todWorktops = () => generateWorktopRuns(usePlannerStore.getState().project.objects);
    return () => {
      delete window.__tod;
      delete window.__todWorktops;
    };
  }, []);

  return null;
}

/** Camera hook. Must live inside the Canvas to reach the render state. */
export function DebugCameraBridge() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!ENABLED) return;
    window.__todCamera = () => ({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    });
    window.__todRenderInfo = () => ({
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    });
    return () => {
      delete window.__todCamera;
      delete window.__todRenderInfo;
    };
  }, [camera, gl]);

  return null;
}
