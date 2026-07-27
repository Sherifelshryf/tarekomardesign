import { getProduct } from '@/data/catalog';
import type {
  LightingSettings,
  ObjectConfiguration,
  PlacedObject,
  Product,
  Project,
  Room,
  RoomType,
} from '@/types';

/** Bump when the persisted shape changes; `migrateProject` handles upgrades. */
export const SCHEMA_VERSION = 1;

export const DEFAULT_ROOM: Room = {
  shape: 'rectangular',
  width: 4200,
  length: 3600,
  height: 2800,
  wallThickness: 120,
  floorMaterialId: 'mat-floor-oak',
  wallMaterialId: 'mat-wall-warm-white',
  ceilingVisible: false,
};

export const DEFAULT_LIGHTING: LightingSettings = {
  mode: 'day',
  exposure: 1,
  warmth: 0.6,
  shadows: true,
};

/** Quick-start room sizes offered in the setup dialog. */
export const ROOM_PRESETS: Array<{ id: string; label: string; width: number; length: number; height: number }> = [
  { id: 'compact', label: 'Compact Galley', width: 2600, length: 3600, height: 2700 },
  { id: 'standard', label: 'Standard Kitchen', width: 4000, length: 5000, height: 2800 },
  { id: 'open', label: 'Open Plan', width: 5400, length: 4600, height: 3000 },
  { id: 'villa', label: 'Villa Kitchen', width: 6200, length: 5200, height: 3200 },
];

export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

export function defaultConfiguration(product: Product): ObjectConfiguration {
  const drawerCount = product.render.kind === 'cabinet'
    ? product.render.drawers
    : product.render.kind === 'island'
      ? product.render.drawers
      : product.render.kind === 'tall-cabinet'
        ? product.render.drawers
        : 0;

  return {
    handle: product.defaultHandle ?? 'minimal',
    doorOpen: 0,
    drawersOpen: Array.from({ length: drawerCount }, () => 0),
    flipped: false,
  };
}

export function defaultMaterials(product: Product): Record<string, string> {
  return Object.fromEntries(
    product.materialSlots.map((slot) => [slot.id, slot.defaultMaterialId]),
  );
}

export function createPlacedObject(
  product: Product,
  position: { x: number; z: number },
  rotationY = 0,
): PlacedObject {
  return {
    id: createId('obj'),
    productId: product.id,
    position: { x: position.x, y: product.elevation, z: position.z },
    rotationY,
    dimensions: { ...product.dimensions },
    materials: defaultMaterials(product),
    configuration: defaultConfiguration(product),
    locked: false,
  };
}

export function createProject(options?: {
  name?: string;
  room?: Partial<Room>;
  roomType?: RoomType;
}): Project {
  const now = new Date().toISOString();
  return {
    id: createId('prj'),
    name: options?.name ?? 'Untitled Kitchen',
    roomType: options?.roomType ?? 'kitchen',
    room: { ...DEFAULT_ROOM, ...options?.room },
    objects: [],
    lighting: { ...DEFAULT_LIGHTING },
    worktopMaterialId: 'mat-marble-white',
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Normalises data loaded from storage: fills in fields added since the save was
 * written and drops objects whose product no longer exists, so an outdated
 * project always opens instead of crashing the planner.
 */
export function migrateProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<Project>;
  if (!candidate.id || !candidate.room || !Array.isArray(candidate.objects)) return null;

  const objects = candidate.objects.flatMap((object): PlacedObject[] => {
    const product = getProduct(object?.productId ?? '');
    if (!product) return [];
    return [
      {
        id: object.id ?? createId('obj'),
        productId: object.productId,
        position: {
          x: object.position?.x ?? 0,
          y: object.position?.y ?? product.elevation,
          z: object.position?.z ?? 0,
        },
        rotationY: object.rotationY ?? 0,
        dimensions: { ...product.dimensions, ...object.dimensions },
        materials: { ...defaultMaterials(product), ...object.materials },
        configuration: { ...defaultConfiguration(product), ...object.configuration },
        locked: object.locked ?? false,
      },
    ];
  });

  return {
    id: candidate.id,
    name: candidate.name ?? 'Untitled Kitchen',
    roomType: candidate.roomType ?? 'kitchen',
    room: { ...DEFAULT_ROOM, ...candidate.room },
    objects,
    lighting: { ...DEFAULT_LIGHTING, ...candidate.lighting },
    worktopMaterialId: candidate.worktopMaterialId ?? 'mat-marble-white',
    createdAt: candidate.createdAt ?? new Date().toISOString(),
    updatedAt: candidate.updatedAt ?? new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  };
}

/** Deep clone used by the history stack. `structuredClone` where available. */
export function cloneProject(project: Project): Project {
  if (typeof structuredClone === 'function') return structuredClone(project);
  return JSON.parse(JSON.stringify(project)) as Project;
}
