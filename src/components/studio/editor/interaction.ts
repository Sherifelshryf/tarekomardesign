import * as THREE from 'three';

/**
 * Shared, non-reactive interaction state.
 *
 * Dragging updates many times a second. Routing the in-flight gesture through
 * React state would re-render the whole scene on every pointer move, so the
 * live gesture lives in this module-level session and only the resulting
 * transform is committed to the store.
 */

export interface DragSession {
  active: boolean;
  objectId: string | null;
  /** Horizontal plane the gesture is projected onto. */
  plane: THREE.Plane;
  /** Offset from the pointer hit point to the module's centre, in metres. */
  offset: THREE.Vector3;
  /** Set once the pointer has actually moved, so clicks stay clicks. */
  moved: boolean;
}

export const dragSession: DragSession = {
  active: false,
  objectId: null,
  plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  offset: new THREE.Vector3(),
  moved: false,
};

export function resetDragSession(): void {
  dragSession.active = false;
  dragSession.objectId = null;
  dragSession.moved = false;
  dragSession.offset.set(0, 0, 0);
}

/**
 * Lets the drag controller suspend the orbit/pan controls for the duration of
 * a gesture without threading a ref through the whole component tree.
 */
type ControlsToggle = (enabled: boolean) => void;
let controlsToggle: ControlsToggle | null = null;

export function registerControlsToggle(toggle: ControlsToggle | null): void {
  controlsToggle = toggle;
}

export function setCameraControlsEnabled(enabled: boolean): void {
  controlsToggle?.(enabled);
}
