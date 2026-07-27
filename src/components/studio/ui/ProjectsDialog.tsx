'use client';

import { useCallback, useEffect, useState } from 'react';
import { createDemoKitchen } from '@/data/demoKitchen';
import { type ProjectSummary, projectRepository } from '@/lib/persistence';
import { cloneProject, createId, createProject } from '@/lib/project';
import { usePlannerStore } from '@/stores/plannerStore';
import { Overlay, ToolButton, cx } from './primitives';

/**
 * Project management: open, save as, new, delete.
 *
 * Everything here goes through `projectRepository`, so pointing the Studio at a
 * server-backed store later needs no changes in this file.
 */
export function ProjectsDialog({
  onClose,
  onSaved,
  captureThumbnail,
}: {
  onClose: () => void;
  onSaved: () => void;
  captureThumbnail?: () => string | null;
}) {
  const project = usePlannerStore((s) => s.project);
  const dirty = usePlannerStore((s) => s.dirty);
  const replaceProject = usePlannerStore((s) => s.replaceProject);
  const markSaved = usePlannerStore((s) => s.markSaved);

  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSummaries(await projectRepository.list());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSaveAs = async () => {
    setBusy(true);
    // A copy gets a new identity so the original stays intact on disk.
    const copy = {
      ...cloneProject(project),
      id: createId('prj'),
      name: `${project.name} copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await projectRepository.save(copy, captureThumbnail?.() ?? undefined);
    replaceProject(copy);
    markSaved();
    await refresh();
    setBusy(false);
    onSaved();
  };

  const handleOpen = async (id: string) => {
    setBusy(true);
    // Don't silently discard unsaved work when switching projects.
    if (dirty) await projectRepository.save(project, captureThumbnail?.() ?? undefined);
    const loaded = await projectRepository.load(id);
    if (loaded) replaceProject(loaded);
    setBusy(false);
    onClose();
  };

  const handleNew = async () => {
    if (dirty) await projectRepository.save(project, captureThumbnail?.() ?? undefined);
    replaceProject(createProject({ name: 'Untitled Kitchen' }), { initialised: false });
    onClose();
  };

  const handleDemo = async () => {
    if (dirty) await projectRepository.save(project, captureThumbnail?.() ?? undefined);
    replaceProject(createDemoKitchen());
    onClose();
  };

  const handleDelete = async (id: string) => {
    await projectRepository.remove(id);
    setConfirmingId(null);
    await refresh();
  };

  return (
    <Overlay onDismiss={onClose}>
      <div className="p-8 sm:p-10">
        <p className="label text-brass">Projects</p>
        <h2 className="mt-2 font-display text-4xl leading-tight font-light text-paper">
          Your designs
        </h2>

        <div className="mt-7 flex flex-wrap gap-2">
          <ToolButton onClick={handleNew} disabled={busy}>
            New Project
          </ToolButton>
          <ToolButton onClick={handleSaveAs} disabled={busy}>
            Save As Copy
          </ToolButton>
          <ToolButton onClick={handleDemo} disabled={busy}>
            Load Demo Kitchen
          </ToolButton>
        </div>

        <div className="mt-8">
          <h3 className="label mb-3 text-ash">Saved on this device</h3>

          {summaries.length === 0 ? (
            <p className="border border-white/10 px-5 py-8 text-center text-sm text-ash">
              Nothing saved yet. Use Save in the toolbar and your work will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-white/8 border border-white/10">
              {summaries.map((summary) => (
                <li
                  key={summary.id}
                  className={cx(
                    'flex items-center gap-4 px-4 py-3 transition-colors',
                    summary.id === project.id ? 'bg-brass/8' : 'hover:bg-white/4',
                  )}
                >
                  <span className="h-12 w-16 shrink-0 overflow-hidden border border-white/10 bg-black/30">
                    {summary.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={summary.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-paper">
                      {summary.name}
                      {summary.id === project.id && (
                        <span className="label ml-2 text-brass">Open</span>
                      )}
                    </span>
                    <span className="tabular mt-0.5 block text-[11px] text-ash">
                      {summary.objectCount} {summary.objectCount === 1 ? 'module' : 'modules'} ·{' '}
                      {formatWhen(summary.updatedAt)}
                    </span>
                  </span>

                  <span className="flex shrink-0 gap-1.5">
                    {summary.id !== project.id && (
                      <ToolButton onClick={() => handleOpen(summary.id)} disabled={busy}>
                        Open
                      </ToolButton>
                    )}
                    {confirmingId === summary.id ? (
                      <ToolButton
                        onClick={() => handleDelete(summary.id)}
                        className="border-invalid/50 text-invalid hover:bg-invalid/10"
                      >
                        Confirm
                      </ToolButton>
                    ) : (
                      <ToolButton
                        tone="ghost"
                        onClick={() => setConfirmingId(summary.id)}
                        title="Delete project"
                      >
                        Delete
                      </ToolButton>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-ash/70">
          Projects are stored in this browser. The storage layer is an interface, so an account-backed
          server store can replace it without touching the planner.
        </p>

        <div className="mt-8">
          <ToolButton tone="accent" onClick={onClose} className="px-8 py-3">
            Done
          </ToolButton>
        </div>
      </div>
    </Overlay>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const elapsed = Date.now() - date.getTime();
  const minutes = Math.round(elapsed / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleDateString();
}
