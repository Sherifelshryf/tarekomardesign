'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATALOG_GROUPS, ROOM_TYPE_GROUPS, productsInGroup } from '@/data/catalog';
import { MATERIAL_FAMILY_LABEL, materialsByFamily } from '@/data/materials';
import { formatMillimetres, formatPrice } from '@/lib/units';
import { usePlannerStore } from '@/stores/plannerStore';
import type { CatalogGroupId, MaterialFamily, MaterialOption, Product } from '@/types';
import { MaterialSwatch } from '../ui/MaterialSwatch';
import { ProductThumbnail } from './ProductThumbnail';
import { cx } from '../ui/primitives';

/**
 * The left catalog.
 *
 * Groups come from the room type, so the same panel already serves dressing
 * rooms and bathrooms once those verticals ship — nothing here is
 * kitchen-specific. Clicking a product places it; it is then snapped into the
 * room by the same engine that handles dragging.
 */
export function CatalogPanel() {
  const roomType = usePlannerStore((s) => s.project.roomType);
  const activeGroup = usePlannerStore((s) => s.activeGroup);
  const setActiveGroup = usePlannerStore((s) => s.setActiveGroup);
  const addProduct = usePlannerStore((s) => s.addProduct);

  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const allowed = new Set(ROOM_TYPE_GROUPS[roomType]);
    return CATALOG_GROUPS.filter((group) => allowed.has(group.id));
  }, [roomType]);

  const current = groups.find((group) => group.id === activeGroup) ?? groups[0];

  const products = useMemo(() => {
    if (!current || current.kind !== 'products') return [];
    const list = productsInGroup(current.id);
    if (!query.trim()) return list;
    const needle = query.trim().toLowerCase();
    return list.filter(
      (product) =>
        product.name.toLowerCase().includes(needle) ||
        product.id.toLowerCase().includes(needle) ||
        product.tags.some((tag) => tag.includes(needle)),
    );
  }, [current, query]);

  return (
    <div className="flex h-full min-h-0">
      {/* Group rail */}
      <nav className="flex w-[136px] shrink-0 flex-col overflow-y-auto scroll-slim border-r border-white/8 py-2">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveGroup(group.id)}
            className={cx(
              'label border-l-2 px-4 py-3 text-left transition-colors duration-150',
              group.id === current?.id
                ? 'border-brass bg-white/5 text-paper'
                : 'border-transparent text-ash hover:bg-white/3 hover:text-stone',
            )}
          >
            {group.label}
          </button>
        ))}
      </nav>

      {/* Group contents */}
      <div className="flex min-w-0 flex-1 flex-col">
        {current?.kind === 'products' ? (
          <>
            <div className="border-b border-white/8 px-4 py-3">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search modules"
                className="w-full border border-white/10 bg-black/25 px-3 py-2 text-xs text-paper placeholder:text-ash/70 focus:border-brass/50 focus:outline-none"
              />
              {current.hint && (
                <p className="mt-2 text-[11px] leading-relaxed text-ash">{current.hint}</p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scroll-slim p-3">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="grid grid-cols-2 gap-2"
                >
                  {products.map((product) => (
                    <CatalogCard
                      key={product.id}
                      product={product}
                      onAdd={() => addProduct(product.id)}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>

              {products.length === 0 && (
                <p className="px-2 py-8 text-center text-xs text-ash">
                  No modules match that search.
                </p>
              )}
            </div>
          </>
        ) : (
          <MaterialsTab groupId={current?.id ?? 'materials'} />
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- cards */

function CatalogCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      title={`${product.id} — click to place`}
      className="group flex flex-col border border-white/8 bg-white/2 text-left transition-colors duration-150 hover:border-brass/50 hover:bg-white/5"
    >
      <span className="flex aspect-4/3 items-center justify-center overflow-hidden bg-black/20">
        <ProductThumbnail product={product} />
      </span>
      <span className="flex flex-1 flex-col gap-1 p-2.5">
        <span className="text-[11px] leading-tight font-medium text-paper">{product.name}</span>
        <span className="tabular text-[10px] text-ash">
          {formatMillimetres(product.dimensions.width)} × {formatMillimetres(product.dimensions.depth)}
        </span>
        {product.price > 0 && (
          <span className="tabular mt-auto text-[10px] text-brass-soft">
            {formatPrice(product.price)}
          </span>
        )}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------- materials */

/**
 * The Materials and Countertops tabs.
 *
 * These change the design rather than add to it: worktop surface, floor and
 * wall finishes all apply immediately to the whole room.
 */
function MaterialsTab({ groupId }: { groupId: CatalogGroupId }) {
  const room = usePlannerStore((s) => s.project.room);
  const worktopMaterialId = usePlannerStore((s) => s.project.worktopMaterialId);
  const setRoom = usePlannerStore((s) => s.setRoom);
  const setWorktopMaterial = usePlannerStore((s) => s.setWorktopMaterial);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const setObjectMaterial = usePlannerStore((s) => s.setObjectMaterial);
  const objects = usePlannerStore((s) => s.project.objects);

  const selected = objects.find((object) => object.id === selectedId) ?? null;

  const families: Array<{ family: MaterialFamily; value: string; apply: (id: string) => void }> =
    groupId === 'countertops'
      ? [
          {
            family: 'countertop',
            value: worktopMaterialId,
            apply: (id) => {
              setWorktopMaterial(id);
              // A selected island carries its own top — keep the two in step.
              if (selected && 'worktop' in selected.materials) {
                setObjectMaterial(selected.id, 'worktop', id);
              }
            },
          },
        ]
      : [
          { family: 'floor', value: room.floorMaterialId, apply: (id) => setRoom({ floorMaterialId: id }) },
          { family: 'wall', value: room.wallMaterialId, apply: (id) => setRoom({ wallMaterialId: id }) },
        ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scroll-slim p-4">
      {groupId === 'countertops' && (
        <p className="mb-4 text-[11px] leading-relaxed text-ash">
          Worktops are generated automatically across adjacent base modules. Pick the surface and
          every run updates at once.
        </p>
      )}

      {families.map((entry) => (
        <div key={entry.family} className="mb-6 last:mb-0">
          <h3 className="label mb-3 text-ash">{MATERIAL_FAMILY_LABEL[entry.family]}</h3>
          <div className="grid grid-cols-2 gap-2">
            {materialsByFamily(entry.family).map((material: MaterialOption) => (
              <MaterialSwatch
                key={material.id}
                material={material}
                selected={material.id === entry.value}
                onSelect={() => entry.apply(material.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
