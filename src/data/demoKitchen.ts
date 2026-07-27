import type { PlacedObject, Project } from '@/types';
import { getProduct } from './catalog';
import { createId, createProject, defaultConfiguration, defaultMaterials } from '@/lib/project';

/**
 * A complete worked example: a 4.6 × 5.0 m walnut kitchen with a full run of
 * base units, wall storage, a tall bank, an island and appliances.
 *
 * Coordinates are laid out by hand against a 4600 × 5000 room so the run fills
 * the north wall exactly — this doubles as a fixture for exercising snapping,
 * worktop generation and the bill of materials.
 */

const ROOM = { width: 4600, length: 5000, height: 2850 };

const NORTH_Z = -ROOM.length / 2; // -2500
const BASE_Z = NORTH_Z + 600 / 2; // base + tall units are 600 deep
const WALL_Z = NORTH_Z + 350 / 2; // wall units are 350 deep
const WEST_X = -ROOM.width / 2; // -2300

interface Placement {
  productId: string;
  x: number;
  z: number;
  rotationY?: number;
  y?: number;
  front?: string;
  carcass?: string;
  worktop?: string;
  width?: number;
}

/**
 * North wall run, west → east. Widths total exactly 4600 mm so the modules
 * meet the side walls flush and generate one continuous worktop.
 */
const PLACEMENTS: Placement[] = [
  { productId: 'TOD-TAL-OVN', x: -2000, z: BASE_Z },
  { productId: 'TOD-TAL-060', x: -1400, z: BASE_Z },
  { productId: 'TOD-CAB-080', x: -700, z: BASE_Z },
  { productId: 'TOD-SNK-080', x: 100, z: BASE_Z },
  { productId: 'TOD-DRW-060', x: 800, z: BASE_Z },
  { productId: 'TOD-CAB-060', x: 1400, z: BASE_Z },
  { productId: 'TOD-APP-DWS', x: 2000, z: BASE_Z },

  // Wall storage, stepping around the extractor above the hob.
  { productId: 'TOD-WAL-080', x: -700, z: WALL_Z },
  { productId: 'TOD-WAL-060', x: 0, z: WALL_Z },
  { productId: 'TOD-WAL-080', x: 1700, z: WALL_Z },
  { productId: 'TOD-WAL-OPN', x: 1700, z: NORTH_Z + 150, y: 2250 },

  // Worktop fittings.
  { productId: 'TOD-SNK-SGL', x: 100, z: BASE_Z, y: 720 },
  { productId: 'TOD-APP-HOB', x: 800, z: BASE_Z, y: 920 },
  { productId: 'TOD-APP-HOD', x: 800, z: NORTH_Z + 250, y: 1500 },

  // Tall refrigeration against the west wall, facing into the room.
  { productId: 'TOD-APP-FRG', x: WEST_X + 340, z: -1500, rotationY: 90 },

  // Island with seating and pendants above.
  { productId: 'TOD-ISL-180', x: 0, z: -200, worktop: 'mat-marble-white' },
  { productId: 'TOD-ACC-STL', x: -450, z: 560, rotationY: 180, front: 'mat-charcoal' },
  { productId: 'TOD-ACC-STL', x: 450, z: 560, rotationY: 180, front: 'mat-charcoal' },
  { productId: 'TOD-LGT-PND', x: -450, z: -200, y: 1650 },
  { productId: 'TOD-LGT-PND', x: 450, z: -200, y: 1650 },

  // Architecture.
  { productId: 'TOD-OPN-WIN', x: ROOM.width / 2, z: 700, rotationY: 270, y: 950 },
  { productId: 'TOD-OPN-DOR', x: -1200, z: ROOM.length / 2, rotationY: 180 },

  // Styling.
  { productId: 'TOD-ACC-PLT', x: 1850, z: 1900 },
  { productId: 'TOD-ACC-RUG', x: 0, z: 1500, width: 2400, front: 'mat-sage' },
];

const DEMO_FRONT = 'mat-walnut-dark';
const DEMO_CARCASS = 'mat-carcass-oak';

function place(placement: Placement): PlacedObject | null {
  const product = getProduct(placement.productId);
  if (!product) return null;

  const materials = defaultMaterials(product);
  if ('front' in materials) materials.front = placement.front ?? DEMO_FRONT;
  if ('carcass' in materials) materials.carcass = placement.carcass ?? DEMO_CARCASS;
  if ('worktop' in materials && placement.worktop) materials.worktop = placement.worktop;

  const dimensions = { ...product.dimensions };
  if (placement.width) dimensions.width = placement.width;

  return {
    id: createId('obj'),
    productId: product.id,
    position: {
      x: placement.x,
      y: placement.y ?? product.elevation,
      z: placement.z,
    },
    rotationY: placement.rotationY ?? 0,
    dimensions,
    materials,
    configuration: defaultConfiguration(product),
    locked: false,
  };
}

/** Builds a fresh copy of the demo design. */
export function createDemoKitchen(): Project {
  const project = createProject({
    name: 'TOD Demo Kitchen',
    room: {
      width: ROOM.width,
      length: ROOM.length,
      height: ROOM.height,
      floorMaterialId: 'mat-floor-oak',
      wallMaterialId: 'mat-wall-warm-white',
      ceilingVisible: false,
    },
  });

  return {
    ...project,
    worktopMaterialId: 'mat-marble-white',
    objects: PLACEMENTS.map(place).filter((object): object is PlacedObject => object !== null),
  };
}
