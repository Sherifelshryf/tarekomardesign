import type { CatalogGroupId, MaterialSlot, Product, RoomType } from '@/types';

/**
 * The TOD product catalog.
 *
 * Products are pure data. No component imports a specific SKU — the planner,
 * catalog UI, properties panel, snapping engine and bill of materials all read
 * from this table. Adding a module (or a whole new room vertical) means adding
 * a row here, not editing the editor.
 */

/* ------------------------------------------------------------------ slots */

const FRONT_SLOT: MaterialSlot = {
  id: 'front',
  label: 'Front',
  family: 'cabinet-front',
  defaultMaterialId: 'mat-oak-natural',
};

const CARCASS_SLOT: MaterialSlot = {
  id: 'carcass',
  label: 'Carcass',
  family: 'carcass',
  defaultMaterialId: 'mat-carcass-white',
};

const METAL_SLOT: MaterialSlot = {
  id: 'metal',
  label: 'Hardware',
  family: 'metal',
  defaultMaterialId: 'mat-metal-steel',
};

const WORKTOP_SLOT: MaterialSlot = {
  id: 'worktop',
  label: 'Worktop',
  family: 'countertop',
  defaultMaterialId: 'mat-marble-white',
};

const CABINET_SLOTS = [FRONT_SLOT, CARCASS_SLOT, METAL_SLOT];

/* ------------------------------------------------------------- dimensions */

/** Standard European kitchen geometry, in millimetres. */
export const KITCHEN_STANDARDS = {
  baseHeight: 900,
  baseDepth: 600,
  plinthHeight: 100,
  worktopThickness: 40,
  /** Underside of wall units above finished floor. */
  wallUnitElevation: 1450,
  wallUnitDepth: 350,
  wallUnitHeight: 720,
  tallHeight: 2100,
  tallDepth: 600,
  islandHeight: 900,
} as const;

const baseResize = {
  width: { min: 300, max: 1200, step: 50 },
  height: { min: 700, max: 1000, step: 10 },
  depth: { min: 350, max: 700, step: 10 },
};

/* ---------------------------------------------------------------- helpers */

interface BaseCabinetSpec {
  id: string;
  name: string;
  width: number;
  drawers: number;
  doors: 0 | 1 | 2;
  price: number;
}

function baseCabinet({ id, name, width, drawers, doors, price }: BaseCabinetSpec): Product {
  return {
    id,
    name,
    category: drawers > 1 ? 'drawer-cabinet' : 'base-cabinet',
    group: drawers > 1 ? 'drawers' : 'cabinets',
    description:
      drawers > 1
        ? `${drawers} soft-close drawers on full-extension runners.`
        : 'Soft-close hinged base module with adjustable internal shelf.',
    dimensions: {
      width,
      height: KITCHEN_STANDARDS.baseHeight,
      depth: KITCHEN_STANDARDS.baseDepth,
    },
    resizable: baseResize,
    mount: 'floor',
    elevation: 0,
    materialSlots: CABINET_SLOTS,
    render: { kind: 'cabinet', doors, drawers, plinth: true },
    snapping: { toWall: true, toModules: true, carriesWorktop: true },
    solid: true,
    defaultHandle: 'minimal',
    price,
    tags: ['kitchen', 'base', 'storage'],
  };
}

/* --------------------------------------------------------------- products */

export const PRODUCTS: Product[] = [
  /* ------------------------------------------------------- base cabinets */
  baseCabinet({ id: 'TOD-CAB-040', name: '40cm Base Cabinet', width: 400, drawers: 0, doors: 1, price: 4200 }),
  baseCabinet({ id: 'TOD-CAB-060', name: '60cm Base Cabinet', width: 600, drawers: 0, doors: 1, price: 5400 }),
  baseCabinet({ id: 'TOD-CAB-080', name: '80cm Base Cabinet', width: 800, drawers: 0, doors: 2, price: 6600 }),
  baseCabinet({ id: 'TOD-CAB-100', name: '100cm Base Cabinet', width: 1000, drawers: 0, doors: 2, price: 7800 }),
  baseCabinet({ id: 'TOD-DRW-060', name: '60cm Drawer Cabinet', width: 600, drawers: 3, doors: 0, price: 7900 }),
  baseCabinet({ id: 'TOD-DRW-080', name: '80cm Drawer Cabinet', width: 800, drawers: 4, doors: 0, price: 9400 }),

  {
    id: 'TOD-SNK-080',
    name: '80cm Sink Cabinet',
    category: 'sink-cabinet',
    group: 'cabinets',
    description: 'Base module prepared for an undermount bowl and waste trap.',
    dimensions: { width: 800, height: KITCHEN_STANDARDS.baseHeight, depth: KITCHEN_STANDARDS.baseDepth },
    resizable: { width: { min: 600, max: 1200, step: 50 } },
    mount: 'floor',
    elevation: 0,
    materialSlots: CABINET_SLOTS,
    render: { kind: 'sink-cabinet', doors: 2 },
    snapping: { toWall: true, toModules: true, carriesWorktop: true },
    solid: true,
    defaultHandle: 'minimal',
    price: 7200,
    tags: ['kitchen', 'base', 'sink'],
  },
  {
    id: 'TOD-COR-090',
    name: '90cm Corner Cabinet',
    category: 'corner-cabinet',
    group: 'cabinets',
    description: 'L-shaped corner module with rotating carousel storage.',
    dimensions: { width: 900, height: KITCHEN_STANDARDS.baseHeight, depth: 900 },
    mount: 'floor',
    elevation: 0,
    materialSlots: CABINET_SLOTS,
    render: { kind: 'corner-cabinet', doors: 1 },
    snapping: { toWall: true, toModules: true, carriesWorktop: true },
    solid: true,
    defaultHandle: 'minimal',
    price: 11200,
    tags: ['kitchen', 'base', 'corner'],
  },

  /* ------------------------------------------------------- wall cabinets */
  {
    id: 'TOD-WAL-060',
    name: '60cm Wall Cabinet',
    category: 'wall-cabinet',
    group: 'wall',
    description: 'Wall-hung unit with concealed suspension brackets.',
    dimensions: {
      width: 600,
      height: KITCHEN_STANDARDS.wallUnitHeight,
      depth: KITCHEN_STANDARDS.wallUnitDepth,
    },
    resizable: {
      width: { min: 300, max: 1200, step: 50 },
      height: { min: 400, max: 900, step: 10 },
    },
    mount: 'wall',
    elevation: KITCHEN_STANDARDS.wallUnitElevation,
    materialSlots: CABINET_SLOTS,
    render: { kind: 'wall-cabinet', doors: 1 },
    snapping: { toWall: true, toModules: true, carriesWorktop: false },
    solid: true,
    defaultHandle: 'minimal',
    price: 4600,
    tags: ['kitchen', 'wall', 'storage'],
  },
  {
    id: 'TOD-WAL-080',
    name: '80cm Wall Cabinet',
    category: 'wall-cabinet',
    group: 'wall',
    description: 'Wall-hung unit with concealed suspension brackets.',
    dimensions: {
      width: 800,
      height: KITCHEN_STANDARDS.wallUnitHeight,
      depth: KITCHEN_STANDARDS.wallUnitDepth,
    },
    resizable: {
      width: { min: 300, max: 1200, step: 50 },
      height: { min: 400, max: 900, step: 10 },
    },
    mount: 'wall',
    elevation: KITCHEN_STANDARDS.wallUnitElevation,
    materialSlots: CABINET_SLOTS,
    render: { kind: 'wall-cabinet', doors: 2 },
    snapping: { toWall: true, toModules: true, carriesWorktop: false },
    solid: true,
    defaultHandle: 'minimal',
    price: 5600,
    tags: ['kitchen', 'wall', 'storage'],
  },
  {
    id: 'TOD-WAL-OPN',
    name: '80cm Open Shelf Unit',
    category: 'wall-cabinet',
    group: 'wall',
    description: 'Open display shelving in solid timber.',
    dimensions: { width: 800, height: 600, depth: 300 },
    resizable: { width: { min: 400, max: 1400, step: 50 } },
    mount: 'wall',
    elevation: 1500,
    materialSlots: [CARCASS_SLOT],
    render: { kind: 'wall-cabinet', doors: 1, openShelves: 2 },
    snapping: { toWall: true, toModules: true, carriesWorktop: false },
    solid: true,
    price: 3400,
    tags: ['kitchen', 'wall', 'open'],
  },

  /* ------------------------------------------------------- tall cabinets */
  {
    id: 'TOD-TAL-060',
    name: '60cm Tall Cabinet',
    category: 'tall-cabinet',
    group: 'tall',
    description: 'Full-height larder with internal pull-out shelving.',
    dimensions: {
      width: 600,
      height: KITCHEN_STANDARDS.tallHeight,
      depth: KITCHEN_STANDARDS.tallDepth,
    },
    resizable: {
      width: { min: 500, max: 1000, step: 50 },
      height: { min: 1800, max: 2400, step: 50 },
    },
    mount: 'floor',
    elevation: 0,
    materialSlots: CABINET_SLOTS,
    render: { kind: 'tall-cabinet', doors: 2, drawers: 0 },
    snapping: { toWall: true, toModules: true, carriesWorktop: false },
    solid: true,
    defaultHandle: 'minimal',
    price: 13400,
    tags: ['kitchen', 'tall', 'larder'],
  },
  {
    id: 'TOD-TAL-OVN',
    name: '60cm Tall Oven Housing',
    category: 'tall-cabinet',
    group: 'tall',
    description: 'Tall housing prepared for a built-in oven and microwave.',
    dimensions: { width: 600, height: KITCHEN_STANDARDS.tallHeight, depth: KITCHEN_STANDARDS.tallDepth },
    mount: 'floor',
    elevation: 0,
    materialSlots: CABINET_SLOTS,
    render: { kind: 'tall-cabinet', doors: 2, drawers: 2 },
    snapping: { toWall: true, toModules: true, carriesWorktop: false },
    solid: true,
    defaultHandle: 'minimal',
    price: 15800,
    tags: ['kitchen', 'tall', 'appliance'],
  },

  /* -------------------------------------------------------------- islands */
  {
    id: 'TOD-ISL-180',
    name: '180cm Kitchen Island',
    category: 'island',
    group: 'islands',
    description: 'Freestanding island with drawer bank and seating overhang.',
    dimensions: { width: 1800, height: KITCHEN_STANDARDS.islandHeight, depth: 900 },
    resizable: {
      width: { min: 1200, max: 3000, step: 50 },
      depth: { min: 700, max: 1200, step: 50 },
    },
    mount: 'free',
    elevation: 0,
    materialSlots: [FRONT_SLOT, CARCASS_SLOT, WORKTOP_SLOT, METAL_SLOT],
    render: { kind: 'island', drawers: 3, doors: 2, overhang: 250 },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: true,
    defaultHandle: 'minimal',
    price: 28500,
    tags: ['kitchen', 'island'],
  },
  {
    id: 'TOD-ISL-240',
    name: '240cm Kitchen Island',
    category: 'island',
    group: 'islands',
    description: 'Large island with integrated breakfast bar.',
    dimensions: { width: 2400, height: KITCHEN_STANDARDS.islandHeight, depth: 1000 },
    resizable: {
      width: { min: 1200, max: 3600, step: 50 },
      depth: { min: 700, max: 1400, step: 50 },
    },
    mount: 'free',
    elevation: 0,
    materialSlots: [FRONT_SLOT, CARCASS_SLOT, WORKTOP_SLOT, METAL_SLOT],
    render: { kind: 'island', drawers: 4, doors: 2, overhang: 300 },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: true,
    defaultHandle: 'minimal',
    price: 36900,
    tags: ['kitchen', 'island'],
  },

  /* ----------------------------------------------------------- worktops */
  {
    id: 'TOD-WTP-SEG',
    name: 'Worktop Segment',
    category: 'countertop',
    group: 'countertops',
    description:
      'Standalone worktop section. Continuous runs over adjacent base modules are generated automatically.',
    dimensions: { width: 1200, height: KITCHEN_STANDARDS.worktopThickness, depth: 600 },
    resizable: {
      width: { min: 300, max: 4000, step: 50 },
      depth: { min: 300, max: 1200, step: 50 },
    },
    mount: 'free',
    elevation: KITCHEN_STANDARDS.baseHeight,
    materialSlots: [WORKTOP_SLOT],
    render: { kind: 'worktop' },
    snapping: { toWall: true, toModules: false, carriesWorktop: false },
    solid: false,
    price: 5200,
    tags: ['kitchen', 'worktop'],
  },

  /* -------------------------------------------------------------- sinks */
  {
    id: 'TOD-SNK-SGL',
    name: 'Single Bowl Sink',
    category: 'sink',
    group: 'sinks',
    description: 'Undermount stainless bowl with mixer tap.',
    dimensions: { width: 560, height: 220, depth: 440 },
    mount: 'free',
    elevation: KITCHEN_STANDARDS.baseHeight - 180,
    materialSlots: [METAL_SLOT],
    render: { kind: 'sink', bowls: 1 },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 6800,
    tags: ['kitchen', 'sink'],
  },
  {
    id: 'TOD-SNK-DBL',
    name: 'Double Bowl Sink',
    category: 'sink',
    group: 'sinks',
    description: 'Twin undermount bowls with professional mixer.',
    dimensions: { width: 860, height: 220, depth: 440 },
    mount: 'free',
    elevation: KITCHEN_STANDARDS.baseHeight - 180,
    materialSlots: [METAL_SLOT],
    render: { kind: 'sink', bowls: 2 },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 9400,
    tags: ['kitchen', 'sink'],
  },

  /* --------------------------------------------------------- appliances */
  {
    id: 'TOD-APP-FRG',
    name: 'Tall Fridge Freezer',
    category: 'appliance',
    group: 'appliances',
    description: 'Integrated-look tall refrigeration column.',
    dimensions: { width: 700, height: 1900, depth: 680 },
    mount: 'floor',
    elevation: 0,
    materialSlots: [METAL_SLOT],
    render: { kind: 'appliance', variant: 'fridge' },
    snapping: { toWall: true, toModules: true, carriesWorktop: false },
    solid: true,
    price: 42000,
    tags: ['kitchen', 'appliance'],
  },
  {
    id: 'TOD-APP-OVN',
    name: 'Built-in Oven',
    category: 'appliance',
    group: 'appliances',
    description: 'Pyrolytic multifunction oven, 60cm.',
    dimensions: { width: 595, height: 595, depth: 560 },
    mount: 'wall',
    elevation: 900,
    materialSlots: [METAL_SLOT],
    render: { kind: 'appliance', variant: 'oven' },
    snapping: { toWall: true, toModules: true, carriesWorktop: false },
    solid: true,
    price: 24000,
    tags: ['kitchen', 'appliance'],
  },
  {
    id: 'TOD-APP-HOB',
    name: 'Induction Hob',
    category: 'appliance',
    group: 'appliances',
    description: 'Flush-mounted 4-zone induction hob.',
    dimensions: { width: 600, height: 60, depth: 520 },
    mount: 'free',
    elevation: KITCHEN_STANDARDS.baseHeight + KITCHEN_STANDARDS.worktopThickness - 20,
    materialSlots: [METAL_SLOT],
    render: { kind: 'appliance', variant: 'hob' },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 18500,
    tags: ['kitchen', 'appliance'],
  },
  {
    id: 'TOD-APP-HOD',
    name: 'Wall Extractor Hood',
    category: 'appliance',
    group: 'appliances',
    description: 'Chimney extractor in brushed steel.',
    dimensions: { width: 900, height: 700, depth: 500 },
    mount: 'wall',
    elevation: 1500,
    materialSlots: [METAL_SLOT],
    render: { kind: 'appliance', variant: 'hood' },
    snapping: { toWall: true, toModules: false, carriesWorktop: false },
    solid: true,
    price: 16800,
    tags: ['kitchen', 'appliance'],
  },
  {
    id: 'TOD-APP-DWS',
    name: 'Integrated Dishwasher',
    category: 'appliance',
    group: 'appliances',
    description: '60cm fully integrated dishwasher.',
    dimensions: { width: 600, height: KITCHEN_STANDARDS.baseHeight, depth: KITCHEN_STANDARDS.baseDepth },
    mount: 'floor',
    elevation: 0,
    materialSlots: [FRONT_SLOT, METAL_SLOT],
    render: { kind: 'appliance', variant: 'dishwasher' },
    snapping: { toWall: true, toModules: true, carriesWorktop: true },
    solid: true,
    price: 21000,
    tags: ['kitchen', 'appliance'],
  },

  /* ----------------------------------------------------------- lighting */
  {
    id: 'TOD-LGT-PND',
    name: 'Pendant Light',
    category: 'lighting',
    group: 'lighting',
    description: 'Suspended dome pendant, ideal over an island.',
    dimensions: { width: 300, height: 900, depth: 300 },
    mount: 'ceiling',
    elevation: 1600,
    materialSlots: [METAL_SLOT],
    render: { kind: 'light', variant: 'pendant', lumens: 800 },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 4900,
    tags: ['lighting'],
  },
  {
    id: 'TOD-LGT-CEI',
    name: 'Recessed Ceiling Light',
    category: 'lighting',
    group: 'lighting',
    description: 'Flush architectural downlight.',
    dimensions: { width: 160, height: 40, depth: 160 },
    mount: 'ceiling',
    elevation: 2600,
    materialSlots: [METAL_SLOT],
    render: { kind: 'light', variant: 'ceiling', lumens: 600 },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 1400,
    tags: ['lighting'],
  },
  {
    id: 'TOD-LGT-STR',
    name: 'Under-cabinet Strip',
    category: 'lighting',
    group: 'lighting',
    description: 'Warm LED task lighting beneath wall units.',
    dimensions: { width: 800, height: 30, depth: 40 },
    resizable: { width: { min: 300, max: 2000, step: 50 } },
    mount: 'wall',
    elevation: KITCHEN_STANDARDS.wallUnitElevation - 40,
    materialSlots: [METAL_SLOT],
    render: { kind: 'light', variant: 'strip', lumens: 400 },
    snapping: { toWall: true, toModules: false, carriesWorktop: false },
    solid: false,
    price: 1900,
    tags: ['lighting'],
  },

  /* ---------------------------------------------------- doors & windows */
  {
    id: 'TOD-OPN-DOR',
    name: 'Interior Door',
    category: 'opening',
    group: 'openings',
    description: 'Standard single-leaf doorway.',
    dimensions: { width: 900, height: 2100, depth: 120 },
    resizable: {
      width: { min: 700, max: 1400, step: 50 },
      height: { min: 1900, max: 2400, step: 50 },
    },
    mount: 'opening',
    elevation: 0,
    materialSlots: [FRONT_SLOT],
    render: { kind: 'opening', variant: 'door' },
    snapping: { toWall: true, toModules: false, carriesWorktop: false },
    solid: false,
    price: 0,
    tags: ['architecture'],
  },
  {
    id: 'TOD-OPN-WIN',
    name: 'Window',
    category: 'opening',
    group: 'openings',
    description: 'Full-frame window opening with glazing.',
    dimensions: { width: 1400, height: 1200, depth: 120 },
    resizable: {
      width: { min: 600, max: 3000, step: 50 },
      height: { min: 600, max: 2200, step: 50 },
    },
    mount: 'opening',
    elevation: 900,
    materialSlots: [FRONT_SLOT],
    render: { kind: 'opening', variant: 'window' },
    snapping: { toWall: true, toModules: false, carriesWorktop: false },
    solid: false,
    price: 0,
    tags: ['architecture'],
  },

  /* -------------------------------------------------------- accessories */
  {
    id: 'TOD-ACC-STL',
    name: 'Bar Stool',
    category: 'accessory',
    group: 'accessories',
    description: 'Upholstered counter stool.',
    dimensions: { width: 400, height: 750, depth: 400 },
    mount: 'free',
    elevation: 0,
    materialSlots: [FRONT_SLOT, METAL_SLOT],
    render: { kind: 'accessory', variant: 'stool' },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 3200,
    tags: ['furniture'],
  },
  {
    id: 'TOD-ACC-PLT',
    name: 'Potted Plant',
    category: 'accessory',
    group: 'accessories',
    description: 'Sculptural indoor planter.',
    dimensions: { width: 420, height: 1100, depth: 420 },
    mount: 'free',
    elevation: 0,
    materialSlots: [CARCASS_SLOT],
    render: { kind: 'accessory', variant: 'plant' },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 1200,
    tags: ['styling'],
  },
  {
    id: 'TOD-ACC-RUG',
    name: 'Runner Rug',
    category: 'accessory',
    group: 'accessories',
    description: 'Hand-loomed wool runner.',
    dimensions: { width: 2000, height: 15, depth: 800 },
    resizable: {
      width: { min: 800, max: 4000, step: 100 },
      depth: { min: 500, max: 3000, step: 100 },
    },
    mount: 'free',
    elevation: 0,
    materialSlots: [FRONT_SLOT],
    render: { kind: 'accessory', variant: 'rug' },
    snapping: { toWall: false, toModules: false, carriesWorktop: false },
    solid: false,
    price: 5400,
    tags: ['styling'],
  },
];

const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export function getProduct(id: string): Product | undefined {
  return PRODUCT_BY_ID.get(id);
}

/** Throws only on programmer error — a save referencing an unknown SKU is filtered on load. */
export function requireProduct(id: string): Product {
  const product = PRODUCT_BY_ID.get(id);
  if (!product) throw new Error(`Unknown product: ${id}`);
  return product;
}

export function productsInGroup(group: CatalogGroupId): Product[] {
  return PRODUCTS.filter((p) => p.group === group);
}

/* ------------------------------------------------------------- groupings */

export interface CatalogGroup {
  id: CatalogGroupId;
  label: string;
  /** `materials` is rendered by a dedicated panel rather than a product list. */
  kind: 'products' | 'materials';
  hint?: string;
}

export const CATALOG_GROUPS: CatalogGroup[] = [
  { id: 'cabinets', label: 'Cabinets', kind: 'products', hint: 'Base modules and corner units' },
  { id: 'drawers', label: 'Drawers', kind: 'products', hint: 'Full-extension drawer banks' },
  { id: 'tall', label: 'Tall Units', kind: 'products', hint: 'Larders and appliance housings' },
  { id: 'wall', label: 'Wall Units', kind: 'products', hint: 'Wall-hung storage and shelving' },
  { id: 'islands', label: 'Islands', kind: 'products', hint: 'Freestanding centre pieces' },
  { id: 'countertops', label: 'Countertops', kind: 'materials', hint: 'Worktop surfaces' },
  { id: 'sinks', label: 'Sinks', kind: 'products' },
  { id: 'appliances', label: 'Appliances', kind: 'products' },
  { id: 'lighting', label: 'Lighting', kind: 'products' },
  { id: 'openings', label: 'Doors & Windows', kind: 'products' },
  { id: 'materials', label: 'Materials', kind: 'materials', hint: 'Floor and wall finishes' },
  { id: 'accessories', label: 'Accessories', kind: 'products' },
];

/**
 * Which catalog groups apply to each room vertical. Kitchen is the fully
 * implemented experience; the others are registered so the shell, routing and
 * catalog already understand them.
 */
export const ROOM_TYPE_GROUPS: Record<RoomType, CatalogGroupId[]> = {
  kitchen: CATALOG_GROUPS.map((g) => g.id),
  dressing: ['tall', 'wall', 'drawers', 'lighting', 'openings', 'materials', 'accessories'],
  bedroom: ['tall', 'wall', 'drawers', 'lighting', 'openings', 'materials', 'accessories'],
  bathroom: ['cabinets', 'wall', 'sinks', 'lighting', 'openings', 'materials', 'accessories'],
  living: ['wall', 'lighting', 'openings', 'materials', 'accessories'],
  office: ['cabinets', 'wall', 'drawers', 'lighting', 'openings', 'materials', 'accessories'],
  apartment: CATALOG_GROUPS.map((g) => g.id),
};

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  kitchen: 'Kitchen',
  dressing: 'Dressing Room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  living: 'Living Room',
  office: 'Office',
  apartment: 'Full Apartment',
};

/** Only the kitchen planner is production-ready today. */
export const AVAILABLE_ROOM_TYPES: RoomType[] = ['kitchen'];
