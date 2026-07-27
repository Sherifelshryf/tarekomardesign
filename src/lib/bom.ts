import { getProduct } from '@/data/catalog';
import { resolveMaterial } from '@/data/materials';
import type { BillOfMaterials, BillOfMaterialsLine, PlacedObject, Project } from '@/types';
import { generateWorktopRuns, totalWorktopLength } from './worktops';

/**
 * Bill of materials.
 *
 * Modules are grouped by category so the summary reads the way a customer
 * thinks about a kitchen ("Base Cabinets × 7") rather than SKU by SKU, and the
 * automatically generated worktop is priced by the running metre.
 */

/** Indicative supply-and-fit rate for worktops, per running metre, in EGP. */
const WORKTOP_RATE_PER_METRE = 4800;

const CATEGORY_LABEL: Record<string, string> = {
  'base-cabinet': 'Base Cabinets',
  'drawer-cabinet': 'Drawer Cabinets',
  'sink-cabinet': 'Sink Cabinets',
  'corner-cabinet': 'Corner Cabinets',
  'wall-cabinet': 'Wall Cabinets',
  'tall-cabinet': 'Tall Cabinets',
  island: 'Kitchen Islands',
  countertop: 'Worktop Sections',
  sink: 'Sinks',
  appliance: 'Appliances',
  lighting: 'Lighting',
  opening: 'Doors & Windows',
  accessory: 'Accessories',
};

/** Order the summary reads in — structure first, then fittings. */
const CATEGORY_ORDER = [
  'base-cabinet',
  'drawer-cabinet',
  'sink-cabinet',
  'corner-cabinet',
  'wall-cabinet',
  'tall-cabinet',
  'island',
  'countertop',
  'sink',
  'appliance',
  'lighting',
  'accessory',
  'opening',
];

export function buildBillOfMaterials(project: Project): BillOfMaterials {
  const grouped = new Map<string, { quantity: number; unitPrice: number }>();

  for (const object of project.objects) {
    const product = getProduct(object.productId);
    if (!product) continue;
    // Openings are architecture, not supplied goods — listed but not priced.
    const existing = grouped.get(product.category);
    grouped.set(product.category, {
      quantity: (existing?.quantity ?? 0) + 1,
      unitPrice: existing?.unitPrice ?? product.price,
    });
  }

  const lines: BillOfMaterialsLine[] = CATEGORY_ORDER.filter((category) => grouped.has(category)).map(
    (category) => {
      const entry = grouped.get(category)!;
      return {
        key: category,
        label: CATEGORY_LABEL[category] ?? category,
        quantity: entry.quantity,
        unit: 'pcs' as const,
        unitPrice: entry.unitPrice,
        total: entry.unitPrice * entry.quantity,
      };
    },
  );

  const runs = generateWorktopRuns(project.objects);
  const worktopLength = totalWorktopLength(runs) / 1000;

  if (worktopLength > 0) {
    const material = resolveMaterial(project.worktopMaterialId, 'countertop');
    lines.push({
      key: 'worktop',
      label: `Worktop — ${material.name}`,
      quantity: Number(worktopLength.toFixed(2)),
      unit: 'm',
      unitPrice: WORKTOP_RATE_PER_METRE,
      total: Math.round(worktopLength * WORKTOP_RATE_PER_METRE),
    });
  }

  return {
    lines,
    worktopLength,
    itemCount: project.objects.length,
    subtotal: lines.reduce((sum, line) => sum + line.total, 0),
    currency: 'EGP',
  };
}

/** Per-module breakdown, used by the expandable detail in the summary. */
export function itemisedLines(objects: PlacedObject[]): Array<{
  productId: string;
  name: string;
  quantity: number;
  finish: string;
}> {
  const map = new Map<string, { productId: string; name: string; quantity: number; finish: string }>();

  for (const object of objects) {
    const product = getProduct(object.productId);
    if (!product) continue;
    const frontSlot = product.materialSlots.find((slot) => slot.family === 'cabinet-front');
    const finish = frontSlot
      ? resolveMaterial(object.materials[frontSlot.id], 'cabinet-front').name
      : '—';
    // Same SKU in a different finish is a different line on the order.
    const key = `${object.productId}::${finish}`;
    const existing = map.get(key);
    if (existing) existing.quantity += 1;
    else map.set(key, { productId: product.id, name: product.name, quantity: 1, finish });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
