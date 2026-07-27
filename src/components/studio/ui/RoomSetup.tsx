'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createDemoKitchen } from '@/data/demoKitchen';
import { DEFAULT_ROOM, ROOM_PRESETS } from '@/lib/project';
import { formatMetres } from '@/lib/units';
import { usePlannerStore } from '@/stores/plannerStore';
import { NumberField, ToolButton, cx } from './primitives';

/**
 * First-run setup.
 *
 * The only blocking screen in the Studio: the planner cannot do anything
 * meaningful without a room. Presets and the demo kitchen are offered first, so
 * nobody has to type numbers before seeing what the tool does.
 */
export function RoomSetup({ onDone }: { onDone: () => void }) {
  const createRoom = usePlannerStore((s) => s.createRoom);
  const replaceProject = usePlannerStore((s) => s.replaceProject);

  const [name, setName] = useState('My Kitchen');
  const [width, setWidth] = useState(DEFAULT_ROOM.width);
  const [length, setLength] = useState(DEFAULT_ROOM.length);
  const [height, setHeight] = useState(DEFAULT_ROOM.height);
  const [presetId, setPresetId] = useState<string | null>(null);

  const applyPreset = (preset: (typeof ROOM_PRESETS)[number]) => {
    setPresetId(preset.id);
    setWidth(preset.width);
    setLength(preset.length);
    setHeight(preset.height);
  };

  const handleCreate = () => {
    createRoom({ width, length, height }, name.trim() || 'Untitled Kitchen');
    onDone();
  };

  const handleDemo = () => {
    replaceProject(createDemoKitchen());
    onDone();
  };

  const area = ((width / 1000) * (length / 1000)).toFixed(1);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto scroll-slim bg-[#141311] p-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl"
      >
        <p className="label text-brass">TOD Studio</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] font-light text-paper sm:text-6xl">
          Create your space.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ash">
          Start with the real dimensions of your room. Everything you place afterwards is drawn to
          the same scale, so what you design is what gets built.
        </p>

        {/* ---------------------------------------------------------- presets */}
        <div className="mt-10">
          <h2 className="label mb-3 text-ash">Start from a preset</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROOM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cx(
                  'border p-4 text-left transition-colors duration-150',
                  presetId === preset.id
                    ? 'border-brass bg-brass/10'
                    : 'border-white/10 hover:border-white/30 hover:bg-white/4',
                )}
              >
                <span className="block text-[11px] leading-tight font-medium text-paper">
                  {preset.label}
                </span>
                <span className="tabular mt-1.5 block text-[10px] text-ash">
                  {formatMetres(preset.width, 1)} × {formatMetres(preset.length, 1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------ dimensions */}
        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <h2 className="label mb-3 text-ash">Or enter your own</h2>
            <div className="grid grid-cols-3 gap-3">
              <NumberField
                label="Width"
                value={width}
                min={1500}
                max={14000}
                step={100}
                onChange={(value) => {
                  setWidth(value);
                  setPresetId(null);
                }}
              />
              <NumberField
                label="Length"
                value={length}
                min={1500}
                max={14000}
                step={100}
                onChange={(value) => {
                  setLength(value);
                  setPresetId(null);
                }}
              />
              <NumberField
                label="Height"
                value={height}
                min={2200}
                max={4500}
                step={50}
                onChange={(value) => {
                  setHeight(value);
                  setPresetId(null);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <span className="label mb-1.5 block text-ash">Floor area</span>
            <span className="tabular border border-white/12 bg-black/25 px-4 py-2 font-display text-2xl text-paper">
              {area} m²
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------ name */}
        <label className="mt-6 block">
          <span className="label mb-1.5 block text-ash">Project name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full border border-white/12 bg-black/25 px-3 py-2.5 text-sm text-paper focus:border-brass/60 focus:outline-none"
          />
        </label>

        {/* --------------------------------------------------------- actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ToolButton tone="accent" onClick={handleCreate} className="px-8 py-3.5">
            Create Room →
          </ToolButton>
          <ToolButton onClick={handleDemo} className="px-6 py-3.5">
            Load Demo Kitchen
          </ToolButton>
          <p className="text-[11px] leading-relaxed text-ash/70 sm:ml-auto sm:max-w-[220px]">
            The demo is a complete 4.6 × 5.0 m kitchen — the fastest way to try everything.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
