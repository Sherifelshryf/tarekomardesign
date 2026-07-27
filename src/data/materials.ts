import type { MaterialFamily, MaterialOption } from '@/types';

/**
 * The Tarek Omar Design finish library.
 *
 * Every option is fully procedural — colour plus a generated grain/veining
 * pattern — so the planner is visually complete with zero texture downloads.
 * Dropping in real scans later is a matter of setting `mapUrl`; the renderer
 * prefers it over the procedural canvas when present.
 */
export const MATERIALS: MaterialOption[] = [
  /* ---------------------------------------------------------------- fronts */
  {
    id: 'mat-oak-natural',
    name: 'Natural Oak',
    family: 'cabinet-front',
    color: '#c49a6c',
    accent: '#a87f52',
    roughness: 0.62,
    metalness: 0,
    pattern: 'wood',
    repeatPerMetre: 1.1,
  },
  {
    id: 'mat-walnut-dark',
    name: 'Dark Walnut',
    family: 'cabinet-front',
    color: '#5c3d2a',
    accent: '#3f2819',
    roughness: 0.55,
    metalness: 0,
    pattern: 'wood',
    repeatPerMetre: 1.1,
  },
  {
    id: 'mat-white-matte',
    name: 'Matte White',
    family: 'cabinet-front',
    color: '#eeece7',
    roughness: 0.78,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-black-matte',
    name: 'Matte Black',
    family: 'cabinet-front',
    color: '#26262a',
    roughness: 0.74,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-beige-warm',
    name: 'Warm Beige',
    family: 'cabinet-front',
    color: '#d9cdb9',
    roughness: 0.75,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-charcoal',
    name: 'Charcoal',
    family: 'cabinet-front',
    color: '#4a4b4d',
    roughness: 0.7,
    metalness: 0.02,
    pattern: 'none',
  },
  {
    id: 'mat-sage',
    name: 'Muted Sage',
    family: 'cabinet-front',
    color: '#8d9885',
    roughness: 0.76,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-clay',
    name: 'Burnt Clay',
    family: 'cabinet-front',
    color: '#a5674f',
    roughness: 0.74,
    metalness: 0,
    pattern: 'none',
  },

  /* --------------------------------------------------------------- carcass */
  {
    id: 'mat-carcass-white',
    name: 'Carcass White',
    family: 'carcass',
    color: '#e2ded6',
    roughness: 0.85,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-carcass-grey',
    name: 'Carcass Grey',
    family: 'carcass',
    color: '#9d9a94',
    roughness: 0.85,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-carcass-oak',
    name: 'Carcass Oak',
    family: 'carcass',
    color: '#b8946a',
    accent: '#9c7a52',
    roughness: 0.7,
    metalness: 0,
    pattern: 'wood',
    repeatPerMetre: 1.2,
  },

  /* ------------------------------------------------------------ countertop */
  {
    id: 'mat-marble-white',
    name: 'White Marble',
    family: 'countertop',
    color: '#f0efec',
    accent: '#9ba3a8',
    roughness: 0.16,
    metalness: 0.02,
    pattern: 'marble',
    repeatPerMetre: 0.55,
  },
  {
    id: 'mat-marble-black',
    name: 'Black Marble',
    family: 'countertop',
    color: '#22232a',
    accent: '#8a8f96',
    roughness: 0.18,
    metalness: 0.04,
    pattern: 'marble',
    repeatPerMetre: 0.55,
  },
  {
    id: 'mat-quartz',
    name: 'Quartz',
    family: 'countertop',
    color: '#dedbd4',
    accent: '#b6b2a9',
    roughness: 0.28,
    metalness: 0,
    pattern: 'stone',
    repeatPerMetre: 2.2,
  },
  {
    id: 'mat-concrete-top',
    name: 'Concrete',
    family: 'countertop',
    color: '#a8a49d',
    accent: '#8f8b84',
    roughness: 0.72,
    metalness: 0,
    pattern: 'concrete',
    repeatPerMetre: 0.9,
  },
  {
    id: 'mat-light-stone',
    name: 'Light Stone',
    family: 'countertop',
    color: '#ddd6c8',
    accent: '#bcb3a2',
    roughness: 0.42,
    metalness: 0,
    pattern: 'stone',
    repeatPerMetre: 1.4,
  },
  {
    id: 'mat-travertine',
    name: 'Travertine',
    family: 'countertop',
    color: '#cfc0a8',
    accent: '#b09a7d',
    roughness: 0.5,
    metalness: 0,
    pattern: 'stone',
    repeatPerMetre: 1.1,
  },

  /* ----------------------------------------------------------------- floor */
  {
    id: 'mat-floor-oak',
    name: 'Oak',
    family: 'floor',
    color: '#c2a781',
    accent: '#a48a67',
    roughness: 0.6,
    metalness: 0,
    pattern: 'wood',
    repeatPerMetre: 0.8,
  },
  {
    id: 'mat-floor-light-wood',
    name: 'Light Wood',
    family: 'floor',
    color: '#d8c3a2',
    accent: '#bda484',
    roughness: 0.62,
    metalness: 0,
    pattern: 'wood',
    repeatPerMetre: 0.8,
  },
  {
    id: 'mat-floor-dark-wood',
    name: 'Dark Wood',
    family: 'floor',
    color: '#6b4a32',
    accent: '#503524',
    roughness: 0.58,
    metalness: 0,
    pattern: 'wood',
    repeatPerMetre: 0.8,
  },
  {
    id: 'mat-floor-marble',
    name: 'Marble',
    family: 'floor',
    color: '#e8e6e1',
    accent: '#a8aeb4',
    roughness: 0.14,
    metalness: 0.03,
    pattern: 'marble',
    repeatPerMetre: 0.5,
  },
  {
    id: 'mat-floor-concrete',
    name: 'Concrete',
    family: 'floor',
    color: '#b0aca5',
    accent: '#97938c',
    roughness: 0.8,
    metalness: 0,
    pattern: 'concrete',
    repeatPerMetre: 0.6,
  },

  /* ------------------------------------------------------------------ wall */
  {
    id: 'mat-wall-white',
    name: 'White',
    family: 'wall',
    color: '#f5f4f1',
    roughness: 0.95,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-wall-warm-white',
    name: 'Warm White',
    family: 'wall',
    color: '#efe9e0',
    roughness: 0.95,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-wall-beige',
    name: 'Beige',
    family: 'wall',
    color: '#e0d6c6',
    roughness: 0.95,
    metalness: 0,
    pattern: 'none',
  },
  {
    id: 'mat-wall-grey',
    name: 'Grey',
    family: 'wall',
    color: '#c6c4bf',
    roughness: 0.95,
    metalness: 0,
    pattern: 'none',
  },

  /* ----------------------------------------------------------------- metal */
  {
    id: 'mat-metal-steel',
    name: 'Brushed Steel',
    family: 'metal',
    color: '#b9bcc0',
    roughness: 0.32,
    metalness: 0.9,
    pattern: 'none',
  },
  {
    id: 'mat-metal-black',
    name: 'Black Metal',
    family: 'metal',
    color: '#2a2b2e',
    roughness: 0.42,
    metalness: 0.75,
    pattern: 'none',
  },
  {
    id: 'mat-metal-brass',
    name: 'Antique Brass',
    family: 'metal',
    color: '#b08d57',
    roughness: 0.34,
    metalness: 0.85,
    pattern: 'none',
  },
];

const MATERIAL_BY_ID = new Map(MATERIALS.map((m) => [m.id, m]));

export function getMaterial(id: string): MaterialOption | undefined {
  return MATERIAL_BY_ID.get(id);
}

/**
 * Always returns a usable material. Falls back to the first option in the
 * family, then to a neutral grey, so a corrupt save can never break rendering.
 */
export function resolveMaterial(id: string | undefined, family: MaterialFamily): MaterialOption {
  const direct = id ? MATERIAL_BY_ID.get(id) : undefined;
  if (direct) return direct;
  const familyFallback = MATERIALS.find((m) => m.family === family);
  return familyFallback ?? MATERIALS[0];
}

export function materialsByFamily(family: MaterialFamily): MaterialOption[] {
  return MATERIALS.filter((m) => m.family === family);
}

export const MATERIAL_FAMILY_LABEL: Record<MaterialFamily, string> = {
  'cabinet-front': 'Cabinet Finish',
  carcass: 'Carcass',
  countertop: 'Countertop',
  floor: 'Floor',
  wall: 'Wall',
  metal: 'Metal',
};
