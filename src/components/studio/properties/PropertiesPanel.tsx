'use client';

import { motion } from 'framer-motion';
import { getProduct } from '@/data/catalog';
import { materialsByFamily } from '@/data/materials';
import { formatMetres, formatPrice } from '@/lib/units';
import { usePlannerStore } from '@/stores/plannerStore';
import type { Dimensions, HandleStyle, PlacedObject } from '@/types';
import { MaterialSwatch } from '../ui/MaterialSwatch';
import { NumberField, PanelSection, SegmentedControl, ToolButton, cx } from '../ui/primitives';

/**
 * The contextual properties panel.
 *
 * Appears only when something is selected, and shows exactly what that product
 * declares it supports — a fixed-width corner unit gets no width slider, an
 * island gets a worktop slot, a rug gets neither doors nor handles.
 */

const HANDLE_OPTIONS: Array<{ value: HandleStyle; label: string }> = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'bar', label: 'Bar' },
  { value: 'knob', label: 'Knob' },
  { value: 'hidden', label: 'Hidden' },
];

export function PropertiesPanel() {
  const selectedId = usePlannerStore((s) => s.selectedId);
  const objects = usePlannerStore((s) => s.project.objects);
  const room = usePlannerStore((s) => s.project.room);

  const setObjectDimensions = usePlannerStore((s) => s.setObjectDimensions);
  const setObjectMaterial = usePlannerStore((s) => s.setObjectMaterial);
  const updateObject = usePlannerStore((s) => s.updateObject);
  const rotateObject = usePlannerStore((s) => s.rotateObject);
  const duplicateObject = usePlannerStore((s) => s.duplicateObject);
  const removeObject = usePlannerStore((s) => s.removeObject);

  const object = objects.find((candidate) => candidate.id === selectedId) ?? null;
  const product = object ? getProduct(object.productId) : null;

  if (!object || !product) return <RoomPanel />;

  const resizable = product.resizable ?? {};

  return (
    <motion.div
      key={object.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col"
    >
      <header className="border-b border-white/8 px-5 py-4">
        <p className="label text-brass">{product.id}</p>
        <h2 className="mt-1 font-display text-2xl leading-tight text-paper">{product.name}</h2>
        {product.description && (
          <p className="mt-2 text-[11px] leading-relaxed text-ash">{product.description}</p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-slim">
        {/* ---------------------------------------------------- dimensions */}
        <PanelSection title="Dimensions">
          <div className="grid grid-cols-3 gap-2">
            {(['width', 'height', 'depth'] as const).map((key) => {
              const range = resizable[key];
              return (
                <NumberField
                  key={key}
                  label={key}
                  value={object.dimensions[key]}
                  min={range?.min}
                  max={range?.max}
                  step={range?.step ?? 10}
                  disabled={!range}
                  onChange={(value) => setObjectDimensions(object.id, { [key]: value } as Partial<Dimensions>)}
                />
              );
            })}
          </div>
          {Object.keys(resizable).length === 0 && (
            <p className="mt-2 text-[11px] text-ash">This module is supplied at a fixed size.</p>
          )}
        </PanelSection>

        {/* ------------------------------------------------------- position */}
        <PanelSection title="Position">
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="X"
              value={object.position.x}
              step={10}
              onChange={(value) =>
                updateObject(object.id, { position: { ...object.position, x: value } })
              }
            />
            <NumberField
              label="Z"
              value={object.position.z}
              step={10}
              onChange={(value) =>
                updateObject(object.id, { position: { ...object.position, z: value } })
              }
            />
            <NumberField
              label="Height"
              value={object.position.y}
              step={10}
              min={0}
              max={room.height - object.dimensions.height}
              onChange={(value) =>
                updateObject(object.id, { position: { ...object.position, y: value } })
              }
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="label shrink-0 text-ash">Rotation</span>
            <span className="tabular text-xs text-stone">{Math.round(object.rotationY)}°</span>
            <div className="ml-auto flex gap-1.5">
              <ToolButton onClick={() => rotateObject(object.id, -90)} title="Rotate anticlockwise">
                −90°
              </ToolButton>
              <ToolButton onClick={() => rotateObject(object.id, 90)} title="Rotate clockwise (R)">
                +90°
              </ToolButton>
            </div>
          </div>
        </PanelSection>

        {/* ------------------------------------------------------- finishes */}
        {product.materialSlots.map((slot) => (
          <PanelSection key={slot.id} title={slot.label}>
            <div className="grid grid-cols-2 gap-1.5">
              {materialsByFamily(slot.family).map((material) => (
                <MaterialSwatch
                  key={material.id}
                  material={material}
                  compact
                  selected={object.materials[slot.id] === material.id}
                  onSelect={() => setObjectMaterial(object.id, slot.id, material.id)}
                />
              ))}
            </div>
          </PanelSection>
        ))}

        {/* -------------------------------------------------------- handles */}
        {product.defaultHandle && (
          <PanelSection title="Handle">
            <SegmentedControl
              options={HANDLE_OPTIONS}
              value={object.configuration.handle}
              columns={4}
              onChange={(handle) =>
                updateObject(object.id, {
                  configuration: { ...object.configuration, handle },
                })
              }
            />
          </PanelSection>
        )}

        {/* ------------------------------------------------------- openings */}
        {(hasDoors(object) || object.configuration.drawersOpen.length > 0) && (
          <PanelSection title="Preview">
            <div className="flex gap-1.5">
              {hasDoors(object) && (
                <ToolButton
                  className="flex-1"
                  active={object.configuration.doorOpen > 0.5}
                  onClick={() =>
                    updateObject(
                      object.id,
                      {
                        configuration: {
                          ...object.configuration,
                          doorOpen: object.configuration.doorOpen > 0.5 ? 0 : 1,
                        },
                      },
                      { history: false },
                    )
                  }
                >
                  {object.configuration.doorOpen > 0.5 ? 'Close doors' : 'Open doors'}
                </ToolButton>
              )}
              {object.configuration.drawersOpen.length > 0 && (
                <ToolButton
                  className="flex-1"
                  active={object.configuration.drawersOpen.some((value) => value > 0.5)}
                  onClick={() => {
                    const anyOpen = object.configuration.drawersOpen.some((value) => value > 0.5);
                    updateObject(
                      object.id,
                      {
                        configuration: {
                          ...object.configuration,
                          drawersOpen: object.configuration.drawersOpen.map(() => (anyOpen ? 0 : 1)),
                        },
                      },
                      { history: false },
                    );
                  }}
                >
                  {object.configuration.drawersOpen.some((value) => value > 0.5)
                    ? 'Close drawers'
                    : 'Open drawers'}
                </ToolButton>
              )}
            </div>
          </PanelSection>
        )}
      </div>

      {/* ---------------------------------------------------------- actions */}
      <footer className="border-t border-white/8 p-4">
        {product.price > 0 && (
          <p className="tabular mb-3 text-xs text-ash">
            Indicative <span className="text-brass-soft">{formatPrice(product.price)}</span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <ToolButton onClick={() => duplicateObject(object.id)}>Duplicate</ToolButton>
          <ToolButton
            onClick={() => removeObject(object.id)}
            className="border-invalid/40 text-invalid hover:border-invalid hover:bg-invalid/10 hover:text-invalid"
          >
            Delete
          </ToolButton>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-ash/70">
          Drag in the room to move · R rotates · ⌘D duplicates · ⌫ deletes
        </p>
      </footer>
    </motion.div>
  );
}

function hasDoors(object: PlacedObject): boolean {
  const product = getProduct(object.productId);
  if (!product) return false;
  const spec = product.render;
  return (
    (spec.kind === 'cabinet' && spec.doors > 0) ||
    spec.kind === 'sink-cabinet' ||
    spec.kind === 'corner-cabinet' ||
    (spec.kind === 'wall-cabinet' && !spec.openShelves) ||
    spec.kind === 'tall-cabinet' ||
    (spec.kind === 'island' && spec.doors > 0)
  );
}

/* ------------------------------------------------------------ room panel */

/** Shown when nothing is selected — the room itself is the default subject. */
function RoomPanel() {
  const room = usePlannerStore((s) => s.project.room);
  const lighting = usePlannerStore((s) => s.project.lighting);
  const objects = usePlannerStore((s) => s.project.objects);
  const setRoom = usePlannerStore((s) => s.setRoom);
  const setLighting = usePlannerStore((s) => s.setLighting);
  const showDimensions = usePlannerStore((s) => s.showDimensions);
  const toggleDimensions = usePlannerStore((s) => s.toggleDimensions);

  const area = (room.width / 1000) * (room.length / 1000);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-white/8 px-5 py-4">
        <p className="label text-brass">The Room</p>
        <h2 className="mt-1 font-display text-2xl leading-tight text-paper">
          {formatMetres(room.width)} × {formatMetres(room.length)}
        </h2>
        <p className="tabular mt-1 text-[11px] text-ash">
          {area.toFixed(1)} m² · {objects.length} {objects.length === 1 ? 'module' : 'modules'}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-slim">
        <PanelSection title="Room Size">
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Width"
              value={room.width}
              min={1500}
              max={14000}
              step={100}
              onChange={(width) => setRoom({ width })}
            />
            <NumberField
              label="Length"
              value={room.length}
              min={1500}
              max={14000}
              step={100}
              onChange={(length) => setRoom({ length })}
            />
            <NumberField
              label="Height"
              value={room.height}
              min={2200}
              max={4500}
              step={50}
              onChange={(height) => setRoom({ height })}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ash">
            Modules against a wall follow it as the room changes size.
          </p>
        </PanelSection>

        <PanelSection title="Floor">
          <div className="grid grid-cols-2 gap-1.5">
            {materialsByFamily('floor').map((material) => (
              <MaterialSwatch
                key={material.id}
                material={material}
                compact
                selected={room.floorMaterialId === material.id}
                onSelect={() => setRoom({ floorMaterialId: material.id })}
              />
            ))}
          </div>
        </PanelSection>

        <PanelSection title="Walls">
          <div className="grid grid-cols-2 gap-1.5">
            {materialsByFamily('wall').map((material) => (
              <MaterialSwatch
                key={material.id}
                material={material}
                compact
                selected={room.wallMaterialId === material.id}
                onSelect={() => setRoom({ wallMaterialId: material.id })}
              />
            ))}
          </div>
        </PanelSection>

        <PanelSection title="Lighting">
          <SegmentedControl
            options={[
              { value: 'day' as const, label: 'Day' },
              { value: 'night' as const, label: 'Night' },
            ]}
            value={lighting.mode}
            onChange={(mode) => setLighting({ mode })}
          />
          <label className="mt-4 block">
            <span className="label mb-2 flex items-center justify-between text-ash">
              Brightness
              <span className="tabular text-stone">{Math.round(lighting.exposure * 100)}%</span>
            </span>
            <input
              type="range"
              min={0.4}
              max={1.6}
              step={0.05}
              value={lighting.exposure}
              onChange={(event) => setLighting({ exposure: Number(event.target.value) })}
              className="w-full accent-[#b98a4b]"
            />
          </label>
          <label className="mt-3 block">
            <span className="label mb-2 flex items-center justify-between text-ash">
              Warmth
              <span className="tabular text-stone">{Math.round(lighting.warmth * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={lighting.warmth}
              onChange={(event) => setLighting({ warmth: Number(event.target.value) })}
              className="w-full accent-[#b98a4b]"
            />
          </label>
        </PanelSection>

        <PanelSection title="Display">
          <div className="space-y-2">
            <Toggle
              label="Dimensions"
              checked={showDimensions}
              onChange={toggleDimensions}
            />
            <Toggle
              label="Ceiling"
              checked={room.ceilingVisible}
              onChange={() => setRoom({ ceilingVisible: !room.ceilingVisible })}
            />
            <Toggle
              label="Shadows"
              checked={lighting.shadows}
              onChange={() => setLighting({ shadows: !lighting.shadows })}
            />
          </div>
        </PanelSection>
      </div>

      <footer className="border-t border-white/8 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-ash">
          Select a module to edit it, or add one from the catalog.
        </p>
      </footer>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between border border-white/10 px-3 py-2 transition-colors hover:border-white/25"
    >
      <span className="label text-stone">{label}</span>
      <span
        className={cx(
          'relative h-4 w-8 rounded-full transition-colors duration-200',
          checked ? 'bg-brass' : 'bg-white/15',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-3 w-3 rounded-full bg-paper transition-transform duration-200',
            checked ? 'translate-x-4.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
