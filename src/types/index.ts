/**
 * Tarek Omar Designs — core domain types.
 *
 * UNITS CONTRACT
 * --------------
 * Every persisted length in this application is expressed in **millimetres**
 * (integers where practical) and every angle in **degrees**. The Three.js scene
 * works in metres, so conversion happens exactly once, at the rendering
 * boundary, via the helpers in `lib/units.ts`.
 *
 * Persistent project data (Project, Room, PlacedObject) is deliberately kept
 * free of rendering concerns — selection, hover, camera and drag state live in
 * the editor slice of the store and are never serialised.
 */

/** A point or vector in room space, in millimetres. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Bounding size of a product or placed object, in millimetres. */
export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

/* -------------------------------------------------------------------------- */
/* Materials                                                                  */
/* -------------------------------------------------------------------------- */

export type MaterialFamily =
  | 'cabinet-front'
  | 'carcass'
  | 'countertop'
  | 'floor'
  | 'wall'
  | 'metal';

export type SurfacePattern = 'none' | 'wood' | 'marble' | 'stone' | 'concrete' | 'tile';

/**
 * A selectable finish. Colour/roughness/metalness drive a standard PBR
 * material; `pattern` selects a procedural texture generator so the app looks
 * convincing without shipping any texture binaries.
 */
export interface MaterialOption {
  id: string;
  name: string;
  family: MaterialFamily;
  color: string;
  roughness: number;
  metalness: number;
  /** Procedural grain/veining applied on top of the base colour. */
  pattern: SurfacePattern;
  /** Secondary colour used by the pattern generator (grain, veins, speckle). */
  accent?: string;
  /** How many times the procedural texture repeats per metre. */
  repeatPerMetre?: number;
  /** Optional map URL — set this once real texture assets are available. */
  mapUrl?: string;
}

/** Named material slot on a product, e.g. `front`, `carcass`, `worktop`. */
export interface MaterialSlot {
  id: string;
  label: string;
  family: MaterialFamily;
  defaultMaterialId: string;
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export type CatalogGroupId =
  | 'cabinets'
  | 'drawers'
  | 'tall'
  | 'wall'
  | 'islands'
  | 'countertops'
  | 'sinks'
  | 'appliances'
  | 'lighting'
  | 'openings'
  | 'materials'
  | 'accessories';

export type ProductCategory =
  | 'base-cabinet'
  | 'drawer-cabinet'
  | 'sink-cabinet'
  | 'corner-cabinet'
  | 'wall-cabinet'
  | 'tall-cabinet'
  | 'island'
  | 'countertop'
  | 'sink'
  | 'appliance'
  | 'lighting'
  | 'opening'
  | 'accessory';

/**
 * How an object relates to the architecture of the room.
 * - `floor`   — sits on the floor, snaps its back to walls.
 * - `wall`    — hangs at a fixed elevation, snaps its back to walls.
 * - `free`    — islands / freestanding pieces; no wall snapping.
 * - `opening` — cut into a wall (doors, windows); always wall-hosted.
 * - `ceiling` — suspended from the ceiling (pendants).
 */
export type MountType = 'floor' | 'wall' | 'free' | 'opening' | 'ceiling';

export type HandleStyle = 'minimal' | 'bar' | 'hidden' | 'knob';

/**
 * Declarative description of how to draw a product procedurally.
 * Swapping in a real GLB later means setting `modelUrl` on the product — the
 * planner, snapping, collision and pricing systems are untouched.
 */
export type RenderSpec =
  | { kind: 'cabinet'; doors: 0 | 1 | 2; drawers: number; plinth: boolean; openShelves?: number }
  | { kind: 'sink-cabinet'; doors: 1 | 2 }
  | { kind: 'corner-cabinet'; doors: 1 }
  | { kind: 'wall-cabinet'; doors: 1 | 2; openShelves?: number }
  | { kind: 'tall-cabinet'; doors: 2; drawers: number }
  | { kind: 'island'; drawers: number; doors: 0 | 2; overhang: number }
  | { kind: 'worktop' }
  | { kind: 'sink'; bowls: 1 | 2 }
  | { kind: 'appliance'; variant: 'fridge' | 'oven' | 'hob' | 'hood' | 'dishwasher' | 'microwave' }
  | { kind: 'light'; variant: 'pendant' | 'ceiling' | 'strip'; lumens: number }
  | { kind: 'opening'; variant: 'door' | 'window' }
  | { kind: 'accessory'; variant: 'stool' | 'plant' | 'rug' | 'artwork' };

export interface ResizeRange {
  min: number;
  max: number;
  /** Increment the slider/stepper snaps to, in millimetres. */
  step: number;
}

export interface Product {
  /** Stable SKU, e.g. `TOD-CAB-001`. */
  id: string;
  name: string;
  category: ProductCategory;
  group: CatalogGroupId;
  description?: string;
  dimensions: Dimensions;
  /** Which dimensions the customer may adjust, and within what limits. */
  resizable?: Partial<Record<keyof Dimensions, ResizeRange>>;
  mount: MountType;
  /** Height of the object's underside above the floor, in millimetres. */
  elevation: number;
  materialSlots: MaterialSlot[];
  render: RenderSpec;
  /** Populate to render a real asset instead of the procedural fallback. */
  modelUrl?: string;
  snapping: {
    toWall: boolean;
    toModules: boolean;
    /** Contributes to the automatically generated continuous worktop. */
    carriesWorktop: boolean;
  };
  /** Participates in collision tests. Rugs / lights do not. */
  solid: boolean;
  defaultHandle?: HandleStyle;
  /** Indicative unit price for the bill of materials, in EGP. */
  price: number;
  tags: string[];
}

/* -------------------------------------------------------------------------- */
/* Project data                                                               */
/* -------------------------------------------------------------------------- */

export type RoomShape = 'rectangular';

export interface Room {
  shape: RoomShape;
  /** Internal clear dimensions, in millimetres. */
  width: number;
  length: number;
  height: number;
  wallThickness: number;
  floorMaterialId: string;
  wallMaterialId: string;
  ceilingVisible: boolean;
}

export interface ObjectConfiguration {
  handle: HandleStyle;
  /** Walkthrough interaction state — how far each door is swung open, 0..1. */
  doorOpen: number;
  /** How far each drawer is pulled out, 0..1, indexed by drawer number. */
  drawersOpen: number[];
  /** Mirrors the module (hinge side / corner orientation). */
  flipped: boolean;
}

export interface PlacedObject {
  id: string;
  productId: string;
  /** Centre of the object's footprint. `y` is the underside height. */
  position: Vec3;
  /** Yaw around the vertical axis, in degrees. 0 = back facing -Z. */
  rotationY: number;
  dimensions: Dimensions;
  /** Material slot id → MaterialOption id. */
  materials: Record<string, string>;
  configuration: ObjectConfiguration;
  locked: boolean;
}

export type LightingMode = 'day' | 'night';

export interface LightingSettings {
  mode: LightingMode;
  /** Multiplier applied to the whole rig, 0.4 – 1.6. */
  exposure: number;
  /** Warmth of the interior fixtures, 0 (cool) – 1 (warm). */
  warmth: number;
  shadows: boolean;
}

export type RoomType =
  | 'kitchen'
  | 'dressing'
  | 'bedroom'
  | 'bathroom'
  | 'living'
  | 'office'
  | 'apartment';

export interface Project {
  id: string;
  name: string;
  /** Which planner vertical this project belongs to. Kitchen ships first. */
  roomType: RoomType;
  room: Room;
  objects: PlacedObject[];
  lighting: LightingSettings;
  /** Applied to every automatically generated worktop run. */
  worktopMaterialId: string;
  createdAt: string;
  updatedAt: string;
  /** Schema version — lets the loader migrate older saves. */
  schemaVersion: number;
}

/* -------------------------------------------------------------------------- */
/* Derived / transport structures                                             */
/* -------------------------------------------------------------------------- */

/** One continuous worktop generated across a run of adjacent base cabinets. */
export interface WorktopRun {
  id: string;
  /** Footprint centre, in millimetres. */
  position: Vec3;
  rotationY: number;
  dimensions: Dimensions;
  /** Running length in millimetres, used by the bill of materials. */
  length: number;
  /** Ids of the modules this run sits on. */
  memberIds: string[];
}

export interface BillOfMaterialsLine {
  key: string;
  label: string;
  quantity: number;
  unit: 'pcs' | 'm';
  unitPrice: number;
  total: number;
}

export interface BillOfMaterials {
  lines: BillOfMaterialsLine[];
  worktopLength: number;
  itemCount: number;
  subtotal: number;
  currency: 'EGP';
}

export interface QuoteRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  project: Project;
  bom: BillOfMaterials;
  submittedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Editor (non-persistent) types                                              */
/* -------------------------------------------------------------------------- */

export type ViewMode = 'plan' | 'orbit' | 'walk';

/** Feedback shown while a module is being dragged. */
export interface PlacementFeedback {
  valid: boolean;
  snappedToWall: boolean;
  snappedToModule: boolean;
  /** Human-readable reason a placement was rejected. */
  reason?: string;
}
