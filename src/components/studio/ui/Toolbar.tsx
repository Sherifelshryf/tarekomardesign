'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlannerStore, selectCanRedo, selectCanUndo } from '@/stores/plannerStore';
import { ToolButton, cx } from './primitives';

/**
 * The top toolbar: identity, project name, history, saving and the handoff to
 * Finish Design.
 */

interface ToolbarProps {
  onSave: () => void;
  onOpenProjects: () => void;
  onFinish: () => void;
  onCapture: () => void;
  onReframe: () => void;
  saving: boolean;
  savedLabel: string | null;
}

export function Toolbar({
  onSave,
  onOpenProjects,
  onFinish,
  onCapture,
  onReframe,
  saving,
  savedLabel,
}: ToolbarProps) {
  const name = usePlannerStore((s) => s.project.name);
  const renameProject = usePlannerStore((s) => s.renameProject);
  const undo = usePlannerStore((s) => s.undo);
  const redo = usePlannerStore((s) => s.redo);
  const canUndo = usePlannerStore(selectCanUndo);
  const canRedo = usePlannerStore(selectCanRedo);
  const dirty = usePlannerStore((s) => s.dirty);
  const lighting = usePlannerStore((s) => s.project.lighting);
  const setLighting = usePlannerStore((s) => s.setLighting);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(name), [name]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitName = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== name) renameProject(next);
    else setDraft(name);
  };

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-1 border-b border-white/8 bg-[#1a1917] px-3">
      <Link
        href="/"
        className="label mr-1 shrink-0 px-2 text-paper transition-colors hover:text-brass"
        title="Back to Tarek Omar Design"
      >
        TOD<span className="ml-1.5 hidden text-ash sm:inline">Studio</span>
      </Link>

      <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

      {/* ------------------------------------------------------ project name */}
      <div className="flex min-w-0 items-center gap-2">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitName();
              if (event.key === 'Escape') {
                setDraft(name);
                setEditing(false);
              }
            }}
            className="w-44 border border-brass/50 bg-black/30 px-2 py-1 text-sm text-paper focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="max-w-[10rem] truncate px-2 py-1 text-sm text-stone transition-colors hover:text-paper sm:max-w-[16rem]"
            title="Rename project"
          >
            {name}
          </button>
        )}
        <AnimatePresence>
          {dirty && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-brass"
              title="Unsaved changes"
            />
          )}
        </AnimatePresence>
      </div>

      {/* ----------------------------------------------------------- history */}
      <div className="ml-2 flex items-center gap-1">
        <ToolButton onClick={undo} disabled={!canUndo} title="Undo (⌘Z)" tone="ghost">
          <UndoIcon />
        </ToolButton>
        <ToolButton onClick={redo} disabled={!canRedo} title="Redo (⇧⌘Z)" tone="ghost">
          <UndoIcon flipped />
        </ToolButton>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* ------------------------------------------------------- day/night */}
        <div className="mr-1 hidden items-center border border-white/10 md:flex">
          {(['day', 'night'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLighting({ mode })}
              className={cx(
                'label px-3 py-1.5 transition-colors duration-150',
                lighting.mode === mode ? 'bg-brass/15 text-brass-soft' : 'text-ash hover:text-paper',
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <ToolButton onClick={onReframe} title="Frame the room" className="hidden lg:inline-flex">
          Reframe
        </ToolButton>
        <ToolButton onClick={onCapture} title="Capture the current view" className="hidden lg:inline-flex">
          Capture
        </ToolButton>
        <ToolButton onClick={onOpenProjects} title="Open, save as, or start a new project">
          Projects
        </ToolButton>
        {/*
          The label doubles as a save-state indicator, so the accessible name is
          pinned separately — otherwise the button's name changes underneath
          assistive technology every time the project is saved.
        */}
        <ToolButton onClick={onSave} disabled={saving} title="Save (⌘S)" aria-label="Save project">
          {saving ? 'Saving…' : savedLabel ?? 'Save'}
        </ToolButton>
        <ToolButton tone="accent" onClick={onFinish} className="px-4">
          Finish Design
        </ToolButton>
      </div>
    </header>
  );
}

function UndoIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path d="M3 7h7a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 4.5 3 7l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
