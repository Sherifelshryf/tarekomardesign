'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mToMm } from '@/lib/units';
import { usePlannerStore } from '@/stores/plannerStore';
import { dragSession, resetDragSession, setCameraControlsEnabled } from './interaction';

/**
 * Turns pointer movement into module movement.
 *
 * Listeners live on the canvas element rather than on each mesh, so a fast drag
 * that outruns the cursor — or leaves the module entirely — keeps tracking.
 */
export function DragController() {
  const { camera, gl } = useThree();
  const dragObjectTo = usePlannerStore((s) => s.dragObjectTo);
  const endDrag = usePlannerStore((s) => s.endDrag);

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hit = new THREE.Vector3();

    const handleMove = (event: PointerEvent) => {
      if (!dragSession.active || !dragSession.objectId) return;

      const rect = element.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (!raycaster.ray.intersectPlane(dragSession.plane, hit)) return;

      dragSession.moved = true;
      dragObjectTo(dragSession.objectId, {
        x: mToMm(hit.x + dragSession.offset.x),
        z: mToMm(hit.z + dragSession.offset.z),
      });
    };

    const handleUp = () => {
      if (!dragSession.active) return;
      resetDragSession();
      endDrag();
      setCameraControlsEnabled(true);
      element.style.cursor = 'auto';
    };

    element.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      element.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [camera, gl, dragObjectTo, endDrag]);

  return null;
}
