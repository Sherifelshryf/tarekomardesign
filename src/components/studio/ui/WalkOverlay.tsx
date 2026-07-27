'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { touchInput } from '../editor/WalkControls';
import { ToolButton } from './primitives';

/**
 * Walkthrough chrome.
 *
 * Almost everything else in the Studio hides. What remains is an instruction
 * card that fades out on its own, an exit affordance, and — on touch devices —
 * a movement stick and a look pad.
 */

interface WalkOverlayProps {
  onExit: () => void;
  /** False until the browser grants pointer lock. */
  locked: boolean;
  touch: boolean;
}

export function WalkOverlay({ onExit, locked, touch }: WalkOverlayProps) {
  const [showHints, setShowHints] = useState(true);

  useEffect(() => {
    // The card is a reminder, not a dialog — it goes away by itself.
    const timer = window.setTimeout(() => setShowHints(false), 5200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* A subtle vignette sells the first-person view. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 52%, rgba(10,10,12,0.42) 100%)',
        }}
      />

      <AnimatePresence>
        {showHints && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/15 bg-obsidian/80 px-8 py-6 text-center backdrop-blur-sm"
          >
            {touch ? (
              <div className="space-y-1.5">
                <p className="label text-paper">Left stick to move</p>
                <p className="label text-paper">Drag right to look</p>
                <p className="label text-brass">Tap exit to leave</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="label text-paper">WASD to move</p>
                <p className="label text-paper">Mouse to look</p>
                <p className="label text-brass">ESC to exit</p>
              </div>
            )}
            <p className="mt-4 text-[11px] text-ash">Click a cabinet door or drawer to open it.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt to click into pointer lock on desktop. */}
      {!touch && !locked && !showHints && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="label absolute bottom-28 left-1/2 -translate-x-1/2 border border-white/15 bg-obsidian/80 px-4 py-2 text-stone backdrop-blur-sm"
        >
          Click to look around
        </motion.p>
      )}

      {/* Crosshair — only while actually looking. */}
      {locked && (
        <div className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      )}

      <div className="pointer-events-auto absolute top-5 right-5">
        <ToolButton onClick={onExit} className="border-white/20 bg-obsidian/70 backdrop-blur-sm">
          Exit Walkthrough
        </ToolButton>
      </div>

      {touch && <TouchControls />}
    </div>
  );
}

/* --------------------------------------------------------- touch controls */

/**
 * Virtual stick (left) and look pad (right).
 *
 * Both write straight into the shared `touchInput` object rather than React
 * state — a joystick that re-rendered the scene sixty times a second would be
 * unusable on the devices that need it most.
 */
function TouchControls() {
  return (
    <>
      <MoveStick />
      <LookPad />
    </>
  );
}

function MoveStick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const radius = 46;

  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      dx = (dx / distance) * radius;
      dy = (dy / distance) * radius;
    }

    setKnob({ x: dx, y: dy });
    touchInput.moveX = dx / radius;
    // Screen-up is forward.
    touchInput.moveY = -dy / radius;
  };

  const release = () => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    touchInput.moveX = 0;
    touchInput.moveY = 0;
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(event) => {
        pointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (pointerId.current !== event.pointerId) return;
        update(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      className="pointer-events-auto absolute bottom-8 left-8 h-28 w-28 touch-none rounded-full border border-white/20 bg-obsidian/40 backdrop-blur-sm"
      aria-label="Move"
    >
      <div
        className="absolute top-1/2 left-1/2 h-12 w-12 rounded-full border border-white/30 bg-white/25"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

function LookPad() {
  const last = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        last.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!last.current) return;
        // Feed deltas straight through; WalkControls consumes and clears them.
        touchInput.lookX += (event.clientX - last.current.x) * 0.12;
        touchInput.lookY += (event.clientY - last.current.y) * 0.12;
        last.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={() => {
        last.current = null;
      }}
      onPointerCancel={() => {
        last.current = null;
      }}
      className="pointer-events-auto absolute right-0 bottom-0 h-2/3 w-1/2 touch-none"
      aria-label="Look around"
    />
  );
}
