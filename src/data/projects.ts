import type { RoomType } from '@/types';

/**
 * Portfolio content.
 *
 * Placeholder copy standing in for real Tarek Omar Design work. Imagery is
 * generated as CSS/SVG compositions rather than stock photography, so nothing
 * here misrepresents a project that doesn't exist — replace `palette` with an
 * `image` URL and the layouts take real photographs unchanged.
 */

export type ProjectCategory = 'kitchens' | 'residential' | 'dressing' | 'commercial';

export interface PortfolioProject {
  slug: string;
  name: string;
  location: string;
  type: string;
  category: ProjectCategory;
  year: number;
  /** One-line positioning statement used on the index. */
  summary: string;
  description: string;
  /** Key facts shown alongside the hero. */
  facts: Array<{ label: string; value: string }>;
  /** Colour scheme driving the generated artwork for this project. */
  palette: {
    base: string;
    mid: string;
    accent: string;
    ink: string;
  };
  gallery: Array<{ caption: string; tone: 'wide' | 'tall' | 'square' }>;
  /** Room type this project maps to in the Studio, where one applies. */
  studioRoomType?: RoomType;
}

export const PROJECT_FILTERS: Array<{ id: 'all' | ProjectCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'kitchens', label: 'Kitchens' },
  { id: 'residential', label: 'Residential' },
  { id: 'dressing', label: 'Dressing Rooms' },
  { id: 'commercial', label: 'Commercial' },
];

export const PROJECTS: PortfolioProject[] = [
  {
    slug: 'villa-01',
    name: 'Villa 01',
    location: 'New Cairo',
    type: 'Residential',
    category: 'residential',
    year: 2026,
    summary: 'A family house organised around a single, uninterrupted horizon of stone.',
    description:
      'Four reception spaces were consolidated into one continuous volume, with the kitchen placed at its centre rather than tucked behind it. A six-metre island in honed white marble anchors the plan; walnut joinery lines the north wall and disappears into full-height storage. Every service — extraction, lighting, power — is concealed within the millwork so the room reads as architecture, not as fitted furniture.',
    facts: [
      { label: 'Area', value: '410 m²' },
      { label: 'Duration', value: '14 months' },
      { label: 'Scope', value: 'Full interior architecture' },
      { label: 'Joinery', value: 'American walnut' },
    ],
    palette: { base: '#e8e2d6', mid: '#c9b99f', accent: '#6d5844', ink: '#2b2622' },
    gallery: [
      { caption: 'The island, seen from the entrance hall', tone: 'wide' },
      { caption: 'Walnut tall storage, north elevation', tone: 'tall' },
      { caption: 'Marble detail at the sink', tone: 'square' },
      { caption: 'Evening, looking towards the terrace', tone: 'wide' },
    ],
    studioRoomType: 'kitchen',
  },
  {
    slug: 'the-quiet-kitchen',
    name: 'The Quiet Kitchen',
    location: 'Sheikh Zayed',
    type: 'Kitchen',
    category: 'kitchens',
    year: 2025,
    summary: 'Handleless oak, no visible appliances, and a room that refuses to announce itself.',
    description:
      'The brief asked for a kitchen that would not look like one. Fronts are routed with a continuous J-groove so no hardware breaks the surface; every appliance is integrated behind matching panels. The palette holds to three tones — natural oak, warm plaster, and a pale limestone worktop — and the extraction is drawn through the ceiling plane rather than a canopy.',
    facts: [
      { label: 'Area', value: '38 m²' },
      { label: 'Duration', value: '5 months' },
      { label: 'Scope', value: 'Kitchen and utility' },
      { label: 'Joinery', value: 'Rift-sawn oak' },
    ],
    palette: { base: '#efe9dd', mid: '#d4c3a5', accent: '#8a7454', ink: '#2f2a24' },
    gallery: [
      { caption: 'Handleless run, morning light', tone: 'wide' },
      { caption: 'J-groove detail', tone: 'square' },
      { caption: 'Limestone worktop return', tone: 'tall' },
    ],
    studioRoomType: 'kitchen',
  },
  {
    slug: 'atelier-dressing',
    name: 'Atelier Dressing',
    location: 'Zamalek',
    type: 'Dressing Room',
    category: 'dressing',
    year: 2025,
    summary: 'A walk-in room treated as a gallery: lit vitrines, brushed brass, deep shadow.',
    description:
      'A former third bedroom converted into a dressing room for two. Glazed vitrines with integrated linear lighting run the length of the space; solid brass rails and pulls warm a palette otherwise held in charcoal and smoked oak. A central island in the same charcoal provides drawer storage and a surface for laying out a wardrobe.',
    facts: [
      { label: 'Area', value: '22 m²' },
      { label: 'Duration', value: '4 months' },
      { label: 'Scope', value: 'Bespoke joinery, lighting' },
      { label: 'Hardware', value: 'Solid brass, unlacquered' },
    ],
    palette: { base: '#3b3a38', mid: '#5c554c', accent: '#b08d57', ink: '#e8e3da' },
    gallery: [
      { caption: 'Vitrines, lit', tone: 'tall' },
      { caption: 'Island and brass detail', tone: 'wide' },
      { caption: 'Smoked oak interior', tone: 'square' },
    ],
    studioRoomType: 'dressing',
  },
  {
    slug: 'north-coast-house',
    name: 'North Coast House',
    location: 'Sidi Abdel Rahman',
    type: 'Residential',
    category: 'residential',
    year: 2024,
    summary: 'Salt air, lime plaster, and joinery detailed to survive both.',
    description:
      'A coastal house where every specification was tested against humidity and salt. Carcasses are marine-grade, fronts are lacquered in a warm off-white, and the worktops are a dense quartz chosen for its indifference to sunlight. The plan opens entirely to the terrace: when the doors are stacked back, the kitchen becomes an outdoor room.',
    facts: [
      { label: 'Area', value: '260 m²' },
      { label: 'Duration', value: '11 months' },
      { label: 'Scope', value: 'Interior architecture' },
      { label: 'Worktops', value: 'Engineered quartz' },
    ],
    palette: { base: '#f1ede4', mid: '#cfd5d2', accent: '#7d8b86', ink: '#2a2e2d' },
    gallery: [
      { caption: 'Kitchen open to the terrace', tone: 'wide' },
      { caption: 'Lime plaster and quartz', tone: 'square' },
      { caption: 'Tall storage, west wall', tone: 'tall' },
      { caption: 'Late afternoon', tone: 'wide' },
    ],
    studioRoomType: 'kitchen',
  },
  {
    slug: 'maadi-townhouse',
    name: 'Maadi Townhouse',
    location: 'Maadi',
    type: 'Kitchen',
    category: 'kitchens',
    year: 2024,
    summary: 'A dark, compact galley that borrows every centimetre it can from the hallway.',
    description:
      'Three metres wide and awkwardly proportioned, this kitchen gained its space by absorbing a redundant corridor. Cabinetry in matte charcoal recedes; a single band of backlit shelving carries the eye along the room. The island is deliberately narrow, sized to the circulation rather than to a showroom drawing.',
    facts: [
      { label: 'Area', value: '19 m²' },
      { label: 'Duration', value: '4 months' },
      { label: 'Scope', value: 'Kitchen, structural alteration' },
      { label: 'Finish', value: 'Matte charcoal lacquer' },
    ],
    palette: { base: '#33322f', mid: '#4c4a45', accent: '#b98a4b', ink: '#eae6dd' },
    gallery: [
      { caption: 'Backlit shelving band', tone: 'wide' },
      { caption: 'Narrow island', tone: 'tall' },
      { caption: 'Charcoal fronts, close', tone: 'square' },
    ],
    studioRoomType: 'kitchen',
  },
  {
    slug: 'studio-headquarters',
    name: 'Studio Headquarters',
    location: 'New Cairo',
    type: 'Commercial',
    category: 'commercial',
    year: 2026,
    summary: 'A workplace built from the same vocabulary as the houses — timber, stone, restraint.',
    description:
      'Our own premises. Open studio floor, a materials library treated as the centrepiece, and a client kitchen that doubles as a working showroom. Everything specified here is something we would put in a home, which is the point: the office is a standing argument for the work.',
    facts: [
      { label: 'Area', value: '540 m²' },
      { label: 'Duration', value: '9 months' },
      { label: 'Scope', value: 'Workplace interior' },
      { label: 'Materials', value: 'Oak, travertine, steel' },
    ],
    palette: { base: '#e4e0d7', mid: '#b8ac97', accent: '#5c5346', ink: '#26241f' },
    gallery: [
      { caption: 'The materials library', tone: 'wide' },
      { caption: 'Client kitchen', tone: 'square' },
      { caption: 'Studio floor', tone: 'tall' },
    ],
  },
];

export function getProject(slug: string): PortfolioProject | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
