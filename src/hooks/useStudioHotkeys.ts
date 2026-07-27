'use client';

import { useEffect } from 'react';
import { usePlannerStore } from '@/stores/plannerStore';

/**
 * Keyboard shortcuts for the editor.
 *
 * Suspended in the walkthrough (where WASD belongs to movement) and whenever
 * the user is typing into a field, so a project name containing "d" doesn't
 * duplicate a cabinet.
 */
export function useStudioHotkeys(options: { onSave: () => void; enabled: boolean }) {
  const { onSave, enabled } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const store = usePlannerStore.getState();
      const { selectedId, viewMode } = store;
      if (viewMode === 'walk') return;

      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }

      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        store.redo();
        return;
      }

      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave();
        return;
      }

      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (selectedId) store.duplicateObject(selectedId);
        return;
      }

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedId) {
            event.preventDefault();
            store.removeObject(selectedId);
          }
          break;
        case 'Escape':
          store.select(null);
          break;
        case 'r':
        case 'R':
          if (selectedId) {
            event.preventDefault();
            // Shift reverses the direction; 90° steps keep runs square.
            store.rotateObject(selectedId, event.shiftKey ? -90 : 90);
          }
          break;
        case '1':
          store.setViewMode('plan');
          break;
        case '2':
          store.setViewMode('orbit');
          break;
        case '3':
          store.setViewMode('walk');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onSave]);
}
