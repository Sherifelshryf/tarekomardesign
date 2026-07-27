'use client';

import { create } from 'zustand';
import { getProduct, requireProduct } from '@/data/catalog';
import { validatePlacement } from '@/lib/collision';
import type { Vec2 } from '@/lib/geometry';
import { projectRepository } from '@/lib/persistence';
import {
  cloneProject,
  createPlacedObject,
  createProject,
  defaultConfiguration,
  defaultMaterials,
} from '@/lib/project';
import { findFreeSpot, reflowToRoom, resolveSnap } from '@/lib/snapping';
import { clamp, normaliseAngle } from '@/lib/units';
import type {
  CatalogGroupId,
  Dimensions,
  LightingSettings,
  PlacedObject,
  PlacementFeedback,
  Project,
  Room,
  ViewMode,
} from '@/types';

/**
 * The planner store.
 *
 * `project` is the single source of persistent truth. Everything else on this
 * store — selection, hover, view mode, drag feedback — is ephemeral editor
 * state that is never serialised.
 *
 * Undo/redo works on whole-project snapshots. Kitchens are small (tens of
 * modules), so snapshotting is far simpler and more reliable than a command
 * log, and stays well inside a sensible memory budget.
 */

const HISTORY_LIMIT = 60;

interface PlannerState {
  /* ------------------------------------------------------------ persistent */
  project: Project;
  /** False until the user has created or loaded a room. */
  initialised: boolean;
  past: Project[];
  future: Project[];
  dirty: boolean;
  lastSavedAt: string | null;

  /* ------------------------------------------------------------- ephemeral */
  viewMode: ViewMode;
  selectedId: string | null;
  hoveredId: string | null;
  draggingId: string | null;
  feedback: PlacementFeedback | null;
  activeGroup: CatalogGroupId | null;
  /** Product queued by a catalog click, waiting to be dropped into the room. */
  pendingProductId: string | null;
  showDimensions: boolean;

  /* --------------------------------------------------------------- actions */
  createRoom: (room: Partial<Room>, name?: string) => void;
  resetProject: () => void;
  replaceProject: (project: Project, options?: { initialised?: boolean }) => void;
  renameProject: (name: string) => void;

  setRoom: (patch: Partial<Room>) => void;
  setLighting: (patch: Partial<LightingSettings>) => void;
  setWorktopMaterial: (materialId: string) => void;

  addProduct: (productId: string, at?: Vec2) => string | null;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => string | null;
  updateObject: (id: string, patch: Partial<PlacedObject>, options?: { history?: boolean }) => void;
  setObjectMaterial: (id: string, slotId: string, materialId: string) => void;
  setObjectDimensions: (id: string, patch: Partial<Dimensions>) => void;
  rotateObject: (id: string, deltaDegrees: number) => void;
  toggleDoor: (id: string) => void;
  toggleDrawer: (id: string, index: number) => void;

  /** Moves a module under pointer control, applying snapping and validation. */
  dragObjectTo: (id: string, centre: Vec2) => void;
  beginDrag: (id: string) => void;
  endDrag: () => void;

  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveGroup: (group: CatalogGroupId | null) => void;
  setPendingProduct: (productId: string | null) => void;
  toggleDimensions: () => void;

  undo: () => void;
  redo: () => void;

  markSaved: () => void;
}

/** Snapshot the current project onto the undo stack. */
function withHistory(state: PlannerState): Pick<PlannerState, 'past' | 'future' | 'dirty'> {
  const past = [...state.past, cloneProject(state.project)];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, future: [], dirty: true };
}

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() };
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  project: createProject(),
  initialised: false,
  past: [],
  future: [],
  dirty: false,
  lastSavedAt: null,

  viewMode: 'orbit',
  selectedId: null,
  hoveredId: null,
  draggingId: null,
  feedback: null,
  activeGroup: 'cabinets',
  pendingProductId: null,
  showDimensions: true,

  /* ------------------------------------------------------------- lifecycle */

  createRoom: (room, name) => {
    const project = createProject({ room, name });
    set({
      project,
      initialised: true,
      past: [],
      future: [],
      dirty: true,
      selectedId: null,
      hoveredId: null,
      viewMode: 'orbit',
    });
    void projectRepository.setActiveId(project.id);
  },

  resetProject: () => {
    set({
      project: createProject(),
      initialised: false,
      past: [],
      future: [],
      dirty: false,
      selectedId: null,
      hoveredId: null,
      feedback: null,
      viewMode: 'orbit',
    });
    void projectRepository.setActiveId(null);
  },

  replaceProject: (project, options) => {
    set({
      project,
      initialised: options?.initialised ?? true,
      past: [],
      future: [],
      dirty: false,
      selectedId: null,
      hoveredId: null,
      feedback: null,
      viewMode: 'orbit',
    });
    void projectRepository.setActiveId(project.id);
  },

  renameProject: (name) =>
    set((state) => ({
      ...withHistory(state),
      project: touch({ ...state.project, name }),
    })),

  /* ------------------------------------------------------------------ room */

  setRoom: (patch) =>
    set((state) => {
      const room = { ...state.project.room, ...patch };
      // Keep wall-hosted modules glued to their walls as the room changes size.
      const objects = state.project.objects.map((object) => reflowToRoom(object, room));
      return {
        ...withHistory(state),
        project: touch({ ...state.project, room, objects }),
      };
    }),

  setLighting: (patch) =>
    set((state) => ({
      ...withHistory(state),
      project: touch({ ...state.project, lighting: { ...state.project.lighting, ...patch } }),
    })),

  setWorktopMaterial: (materialId) =>
    set((state) => ({
      ...withHistory(state),
      project: touch({ ...state.project, worktopMaterialId: materialId }),
    })),

  /* --------------------------------------------------------------- objects */

  addProduct: (productId, at) => {
    const product = getProduct(productId);
    if (!product) return null;

    const state = get();
    const { room, objects } = state.project;
    const centre = at ?? findFreeSpot(product, room, objects);

    // Run the new module through the same snapping path a drag would use, so
    // catalog clicks land against walls and beside neighbours too.
    const snap = resolveSnap({
      product,
      centre,
      rotationY: 0,
      elevation: product.elevation,
      width: product.dimensions.width,
      depth: product.dimensions.depth,
      room,
      others: objects,
    });

    const placed = createPlacedObject(product, snap.centre, snap.rotationY);
    placed.position.y = snap.elevation;

    set((current) => ({
      ...withHistory(current),
      project: touch({ ...current.project, objects: [...current.project.objects, placed] }),
      selectedId: placed.id,
      pendingProductId: null,
    }));

    return placed.id;
  },

  removeObject: (id) =>
    set((state) => ({
      ...withHistory(state),
      project: touch({
        ...state.project,
        objects: state.project.objects.filter((object) => object.id !== id),
      }),
      selectedId: state.selectedId === id ? null : state.selectedId,
      hoveredId: state.hoveredId === id ? null : state.hoveredId,
    })),

  duplicateObject: (id) => {
    const state = get();
    const source = state.project.objects.find((object) => object.id === id);
    if (!source) return null;
    const product = getProduct(source.productId);
    if (!product) return null;

    // Offer the duplicate the slot beside the original; snapping tidies it up.
    const offset = source.dimensions.width;
    const snap = resolveSnap({
      product,
      centre: { x: source.position.x + offset, z: source.position.z },
      rotationY: source.rotationY,
      elevation: source.position.y,
      width: source.dimensions.width,
      depth: source.dimensions.depth,
      room: state.project.room,
      others: state.project.objects,
    });

    const copy: PlacedObject = {
      ...cloneObject(source),
      position: { x: snap.centre.x, y: snap.elevation, z: snap.centre.z },
      rotationY: snap.rotationY,
    };

    set((current) => ({
      ...withHistory(current),
      project: touch({ ...current.project, objects: [...current.project.objects, copy] }),
      selectedId: copy.id,
    }));

    return copy.id;
  },

  updateObject: (id, patch, options) =>
    set((state) => {
      const objects = state.project.objects.map((object) =>
        object.id === id ? { ...object, ...patch } : object,
      );
      const history = options?.history === false ? {} : withHistory(state);
      return {
        ...history,
        project: touch({ ...state.project, objects }),
      };
    }),

  setObjectMaterial: (id, slotId, materialId) =>
    set((state) => ({
      ...withHistory(state),
      project: touch({
        ...state.project,
        objects: state.project.objects.map((object) =>
          object.id === id
            ? { ...object, materials: { ...object.materials, [slotId]: materialId } }
            : object,
        ),
      }),
    })),

  setObjectDimensions: (id, patch) =>
    set((state) => {
      const objects = state.project.objects.map((object) => {
        if (object.id !== id) return object;
        const product = getProduct(object.productId);
        const dimensions = { ...object.dimensions, ...patch };

        // Respect the product's declared limits.
        if (product?.resizable) {
          for (const key of ['width', 'height', 'depth'] as const) {
            const range = product.resizable[key];
            if (range) dimensions[key] = clamp(dimensions[key], range.min, range.max);
          }
        }
        return { ...object, dimensions };
      });
      return { ...withHistory(state), project: touch({ ...state.project, objects }) };
    }),

  rotateObject: (id, deltaDegrees) =>
    set((state) => ({
      ...withHistory(state),
      project: touch({
        ...state.project,
        objects: state.project.objects.map((object) =>
          object.id === id
            ? { ...object, rotationY: normaliseAngle(object.rotationY + deltaDegrees) }
            : object,
        ),
      }),
    })),

  toggleDoor: (id) =>
    set((state) => ({
      // Door animation is presentation, not a design change — no history entry.
      project: {
        ...state.project,
        objects: state.project.objects.map((object) =>
          object.id === id
            ? {
                ...object,
                configuration: {
                  ...object.configuration,
                  doorOpen: object.configuration.doorOpen > 0.5 ? 0 : 1,
                },
              }
            : object,
        ),
      },
    })),

  toggleDrawer: (id, index) =>
    set((state) => ({
      project: {
        ...state.project,
        objects: state.project.objects.map((object) => {
          if (object.id !== id) return object;
          const drawersOpen = [...object.configuration.drawersOpen];
          drawersOpen[index] = (drawersOpen[index] ?? 0) > 0.5 ? 0 : 1;
          return { ...object, configuration: { ...object.configuration, drawersOpen } };
        }),
      },
    })),

  /* ----------------------------------------------------------------- drag */

  beginDrag: (id) =>
    set((state) => ({
      // One history entry per gesture, taken before the first movement.
      ...withHistory(state),
      draggingId: id,
      selectedId: id,
    })),

  dragObjectTo: (id, centre) =>
    set((state) => {
      const object = state.project.objects.find((o) => o.id === id);
      if (!object) return {};
      const product = getProduct(object.productId);
      if (!product) return {};

      const others = state.project.objects.filter((o) => o.id !== id);
      const snap = resolveSnap({
        product,
        centre,
        rotationY: object.rotationY,
        elevation: object.position.y,
        width: object.dimensions.width,
        depth: object.dimensions.depth,
        room: state.project.room,
        others,
      });

      const validation = validatePlacement({
        product,
        centre: snap.centre,
        rotationY: snap.rotationY,
        elevation: snap.elevation,
        width: object.dimensions.width,
        height: object.dimensions.height,
        depth: object.dimensions.depth,
        room: state.project.room,
        others,
      });

      // Invalid positions are still shown — with red feedback — so dragging
      // never feels like it is fighting the pointer.
      const objects = state.project.objects.map((o) =>
        o.id === id
          ? {
              ...o,
              position: { x: snap.centre.x, y: snap.elevation, z: snap.centre.z },
              rotationY: snap.rotationY,
            }
          : o,
      );

      return {
        // No history push here: `beginDrag` already recorded the gesture.
        project: { ...state.project, objects },
        feedback: {
          valid: validation.valid,
          snappedToWall: snap.snappedToWall,
          snappedToModule: snap.snappedToModule,
          reason: validation.reason,
        },
      };
    }),

  endDrag: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      // A click that didn't actually move anything shouldn't cost an undo step.
      const unchanged =
        previous && JSON.stringify(previous.objects) === JSON.stringify(state.project.objects);

      return {
        draggingId: null,
        feedback: null,
        past: unchanged ? state.past.slice(0, -1) : state.past,
        dirty: unchanged ? state.dirty : true,
        project: unchanged ? state.project : touch(state.project),
      };
    }),

  /* ------------------------------------------------------------- selection */

  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoveredId: id }),
  setViewMode: (mode) => set({ viewMode: mode, selectedId: mode === 'walk' ? null : get().selectedId }),
  setActiveGroup: (group) => set({ activeGroup: group }),
  setPendingProduct: (productId) => set({ pendingProductId: productId }),
  toggleDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),

  /* --------------------------------------------------------------- history */

  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return {};
      return {
        past: state.past.slice(0, -1),
        future: [cloneProject(state.project), ...state.future].slice(0, HISTORY_LIMIT),
        project: previous,
        dirty: true,
        selectedId: previous.objects.some((o) => o.id === state.selectedId)
          ? state.selectedId
          : null,
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return {};
      return {
        past: [...state.past, cloneProject(state.project)].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        project: next,
        dirty: true,
        selectedId: next.objects.some((o) => o.id === state.selectedId) ? state.selectedId : null,
      };
    }),

  markSaved: () => set({ dirty: false, lastSavedAt: new Date().toISOString() }),
}));

/** Duplicates an object with a fresh id and independent nested state. */
function cloneObject(source: PlacedObject): PlacedObject {
  const product = getProduct(source.productId);
  return {
    ...source,
    id: `obj-${Math.random().toString(36).slice(2, 10)}`,
    position: { ...source.position },
    dimensions: { ...source.dimensions },
    materials: { ...(product ? defaultMaterials(product) : {}), ...source.materials },
    configuration: {
      ...(product ? defaultConfiguration(product) : source.configuration),
      ...source.configuration,
      drawersOpen: [...source.configuration.drawersOpen],
    },
  };
}

/* ------------------------------------------------------------- selectors */

export const selectSelectedObject = (state: PlannerState): PlacedObject | null =>
  state.project.objects.find((object) => object.id === state.selectedId) ?? null;

export const selectSelectedProduct = (state: PlannerState) => {
  const object = selectSelectedObject(state);
  if (!object) return null;
  return getProduct(object.productId) ?? null;
};

export const selectCanUndo = (state: PlannerState): boolean => state.past.length > 0;
export const selectCanRedo = (state: PlannerState): boolean => state.future.length > 0;

/** Re-exported for components that need the strict lookup. */
export { requireProduct };
