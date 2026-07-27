'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStudioHotkeys } from '@/hooks/useStudioHotkeys';
import { projectRepository } from '@/lib/persistence';
import { usePlannerStore } from '@/stores/plannerStore';
import { DebugBridge } from './DebugBridge';
import { CatalogPanel } from './catalog/CatalogPanel';
import { StudioCanvas } from './editor/StudioCanvas';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { FinishDesign } from './ui/FinishDesign';
import { ModeBar } from './ui/ModeBar';
import { ProjectsDialog } from './ui/ProjectsDialog';
import { RoomSetup } from './ui/RoomSetup';
import { Toolbar } from './ui/Toolbar';
import { WalkOverlay } from './ui/WalkOverlay';
import { ToolButton, cx } from './ui/primitives';

/**
 * TOD Studio.
 *
 * Owns layout and the lifecycle concerns the 3D scene shouldn't care about:
 * restoring the last session, autosaving, capture, and the panels that open
 * over the top of the editor.
 */

/** How long after the last change autosave fires, in milliseconds. */
const AUTOSAVE_DELAY = 4000;

export function StudioShell() {
  const initialised = usePlannerStore((s) => s.initialised);
  const project = usePlannerStore((s) => s.project);
  const dirty = usePlannerStore((s) => s.dirty);
  const viewMode = usePlannerStore((s) => s.viewMode);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const replaceProject = usePlannerStore((s) => s.replaceProject);
  const markSaved = usePlannerStore((s) => s.markSaved);

  const [restoring, setRestoring] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [frameToken, setFrameToken] = useState(0);
  const [showProjects, setShowProjects] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [walkLocked, setWalkLocked] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [isTouch, setIsTouch] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const captureRef = useRef<(() => string | null) | null>(null);

  const walking = viewMode === 'walk';

  /* ------------------------------------------------------- restore session */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const activeId = await projectRepository.getActiveId();
      if (activeId) {
        const saved = await projectRepository.load(activeId);
        // Only restore designs with something in them; an empty shell should
        // take the user back to room setup instead.
        if (saved && !cancelled && saved.objects.length > 0) {
          replaceProject(saved);
          setSavedLabel('Saved');
        }
      }
      if (!cancelled) setRestoring(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [replaceProject]);

  /* ------------------------------------------------------- touch detection */
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  /* ---------------------------------------------------------------- saving */
  const save = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setSaving(true);
      try {
        await projectRepository.save(project, captureRef.current?.() ?? undefined);
        await projectRepository.setActiveId(project.id);
        markSaved();
        setSavedLabel('Saved');
        if (!options?.silent) setToast('Project saved');
      } catch (error) {
        console.warn('[TOD] Save failed:', error);
        setToast('Could not save — storage may be full');
      } finally {
        setSaving(false);
      }
    },
    [project, markSaved],
  );

  /* Debounced autosave: quiet, and never while the user is mid-gesture. */
  useEffect(() => {
    if (!initialised || !dirty || restoring) return;
    const timer = window.setTimeout(() => void save({ silent: true }), AUTOSAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [initialised, dirty, restoring, project, save]);

  /* Toasts clear themselves. */
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useStudioHotkeys({
    onSave: () => void save(),
    enabled: initialised && !showProjects && !showFinish,
  });

  /* -------------------------------------------------------------- capture */
  const handleCapture = useCallback(() => {
    const dataUrl = captureRef.current?.();
    if (!dataUrl) {
      setToast('Capture failed');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${project.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-tod.png`;
    link.click();
    setToast('Design captured');
  }, [project.name]);

  const handleExitWalk = useCallback(() => setViewMode('orbit'), [setViewMode]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#141311] text-paper">
      <DebugBridge />

      {!walking && (
        <Toolbar
          onSave={() => void save()}
          onOpenProjects={() => setShowProjects(true)}
          onFinish={() => setShowFinish(true)}
          onCapture={handleCapture}
          onReframe={() => setFrameToken((token) => token + 1)}
          saving={saving}
          savedLabel={dirty ? null : savedLabel}
        />
      )}

      <div className="relative flex min-h-0 flex-1">
        {/* ----------------------------------------------------- left catalog */}
        {!walking && (
          <aside
            className={cx(
              'absolute inset-y-0 left-0 z-20 flex w-[300px] flex-col border-r border-white/8 bg-[#1a1917] transition-transform duration-300 ease-out lg:relative lg:translate-x-0',
              catalogOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden lg:border-r-0',
            )}
          >
            <CatalogPanel />
          </aside>
        )}

        {/* --------------------------------------------------------- viewport */}
        {/* `overflow-hidden` keeps in-scene HTML overlays inside the viewport. */}
        <main className="relative min-w-0 flex-1 overflow-hidden">
          {!restoring && initialised && (
            <StudioCanvas
              frameToken={frameToken}
              onExitWalk={handleExitWalk}
              onWalkLockChange={setWalkLocked}
              onCaptureReady={(capture) => {
                captureRef.current = capture;
              }}
            />
          )}

          {/* Catalog toggle, so the 3D view can take the whole screen. */}
          {!walking && (
            <button
              type="button"
              onClick={() => setCatalogOpen((open) => !open)}
              className={cx(
                'label absolute top-4 z-30 border border-white/12 bg-obsidian/80 px-3 py-2 text-stone backdrop-blur-sm transition-all duration-300 hover:text-paper',
                // Below lg the catalog floats over the viewport, so the toggle
                // has to step aside rather than sit on top of it.
                catalogOpen ? 'left-[316px] lg:left-4' : 'left-4',
              )}
            >
              {catalogOpen ? '‹ Catalog' : 'Catalog ›'}
            </button>
          )}

          {!walking && <ModeBar />}

          {walking && (
            <WalkOverlay onExit={handleExitWalk} locked={walkLocked} touch={isTouch} />
          )}

          {/* --------------------------------------------------- room setup */}
          {!restoring && !initialised && <RoomSetup onDone={() => setFrameToken((t) => t + 1)} />}

          {restoring && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingMark />
            </div>
          )}
        </main>

        {/* ------------------------------------------------ right properties */}
        {!walking && initialised && (
          <aside
            className={cx(
              'absolute inset-y-0 right-0 z-20 w-[300px] border-l border-white/8 bg-[#1a1917] transition-transform duration-300 ease-out xl:relative xl:translate-x-0',
              selectedId ? 'translate-x-0' : 'translate-x-full xl:translate-x-0',
            )}
          >
            <PropertiesPanel />
          </aside>
        )}
      </div>

      {/* ----------------------------------------------------------- overlays */}
      <AnimatePresence>
        {showProjects && (
          <ProjectsDialog
            key="projects"
            onClose={() => setShowProjects(false)}
            onSaved={() => setToast('Saved as a new project')}
            captureThumbnail={() => captureRef.current?.() ?? null}
          />
        )}
        {showFinish && (
          <FinishDesign
            key="finish"
            onClose={() => setShowFinish(false)}
            captureThumbnail={() => captureRef.current?.() ?? null}
          />
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------- toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="label pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 border border-white/15 bg-obsidian/90 px-4 py-2.5 text-stone backdrop-blur-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile hint: the properties panel is a drawer below xl. */}
      {!walking && selectedId && (
        <div className="pointer-events-none absolute inset-0 z-10 xl:hidden">
          <div className="pointer-events-auto absolute top-4 right-[312px]">
            <ToolButton
              tone="ghost"
              onClick={() => usePlannerStore.getState().select(null)}
              className="border border-white/12 bg-obsidian/80 backdrop-blur-sm"
            >
              Close
            </ToolButton>
          </div>
        </div>
      )}
    </div>
  );
}

/** A quiet loading mark — no spinners. */
function LoadingMark() {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.span
        className="block h-px w-24 bg-brass"
        initial={{ scaleX: 0.2, opacity: 0.4 }}
        animate={{ scaleX: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="label text-ash">Preparing Studio</span>
    </div>
  );
}
