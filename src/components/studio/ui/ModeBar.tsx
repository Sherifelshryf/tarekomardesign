'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePlannerStore } from '@/stores/plannerStore';
import type { ViewMode } from '@/types';
import { cx } from './primitives';

/** The view switcher, and the live placement feedback that sits above it. */

const MODES: Array<{ value: ViewMode; label: string; hint: string }> = [
  { value: 'plan', label: '2D Plan', hint: '1' },
  { value: 'orbit', label: '3D View', hint: '2' },
  { value: 'walk', label: 'Walk Inside', hint: '3' },
];

export function ModeBar() {
  const viewMode = usePlannerStore((s) => s.viewMode);
  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const feedback = usePlannerStore((s) => s.feedback);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 p-5">
      {/* --------------------------------------------- snapping / validity */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cx(
              'label pointer-events-none flex items-center gap-2 border px-3 py-1.5 backdrop-blur-sm',
              feedback.valid
                ? 'border-white/15 bg-obsidian/80 text-stone'
                : 'border-invalid/60 bg-invalid/20 text-[#f3b6ae]',
            )}
          >
            <span
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                feedback.valid ? 'bg-valid' : 'bg-invalid',
              )}
            />
            {feedback.valid
              ? feedback.snappedToModule
                ? 'Snapped to module'
                : feedback.snappedToWall
                  ? 'Snapped to wall'
                  : 'Free placement'
              : (feedback.reason ?? 'Invalid placement')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------ mode switch */}
      <div className="pointer-events-auto flex border border-white/12 bg-obsidian/85 backdrop-blur-sm">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => setViewMode(mode.value)}
            title={`Shortcut: ${mode.hint}`}
            className={cx(
              'label relative px-5 py-3 transition-colors duration-150',
              viewMode === mode.value ? 'text-obsidian' : 'text-stone hover:text-paper',
            )}
          >
            {viewMode === mode.value && (
              <motion.span
                layoutId="mode-indicator"
                className="absolute inset-0 bg-brass"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
