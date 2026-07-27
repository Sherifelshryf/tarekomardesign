import type { Project, QuoteRequest } from '@/types';
import { migrateProject } from './project';

/**
 * Storage abstraction.
 *
 * The planner only ever talks to the `ProjectRepository` interface, so moving
 * from localStorage to a real database means implementing this interface
 * against an API route and swapping the export at the bottom of this file —
 * no changes to the store or any component.
 */

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
  objectCount: number;
  /** Data-URL preview, when one was captured at save time. */
  thumbnail?: string;
}

export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>;
  load(id: string): Promise<Project | null>;
  save(project: Project, thumbnail?: string): Promise<void>;
  remove(id: string): Promise<void>;
  /** Id of the project to reopen on the next visit. */
  getActiveId(): Promise<string | null>;
  setActiveId(id: string | null): Promise<void>;
}

const PROJECT_KEY = 'tod.studio.projects.v1';
const ACTIVE_KEY = 'tod.studio.active.v1';
const QUOTE_KEY = 'tod.studio.quotes.v1';

interface StoredRecord {
  project: Project;
  thumbnail?: string;
}

type StoredMap = Record<string, StoredRecord>;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): StoredMap {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(PROJECT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A corrupt entry must never block the planner from opening.
    return {};
  }
}

function writeAll(map: StoredMap): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PROJECT_KEY, JSON.stringify(map));
  } catch (error) {
    // Most likely the 5 MB quota — surface it without losing the session.
    console.warn('[TOD] Could not persist project:', error);
  }
}

class LocalStorageProjectRepository implements ProjectRepository {
  async list(): Promise<ProjectSummary[]> {
    const map = readAll();
    return Object.values(map)
      .map(({ project, thumbnail }) => ({
        id: project.id,
        name: project.name,
        updatedAt: project.updatedAt,
        objectCount: project.objects.length,
        thumbnail,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(id: string): Promise<Project | null> {
    const record = readAll()[id];
    if (!record) return null;
    return migrateProject(record.project);
  }

  async save(project: Project, thumbnail?: string): Promise<void> {
    const map = readAll();
    map[project.id] = {
      project,
      // Keep the previous preview when this save didn't capture one.
      thumbnail: thumbnail ?? map[project.id]?.thumbnail,
    };
    writeAll(map);
  }

  async remove(id: string): Promise<void> {
    const map = readAll();
    delete map[id];
    writeAll(map);
  }

  async getActiveId(): Promise<string | null> {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(ACTIVE_KEY);
  }

  async setActiveId(id: string | null): Promise<void> {
    if (!isBrowser()) return;
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  }
}

export const projectRepository: ProjectRepository = new LocalStorageProjectRepository();

/* --------------------------------------------------------------- quotes */

/**
 * Quote requests are queued locally and POSTed to `/api/quote`. If the network
 * call fails the request stays in the queue so nothing is lost.
 */
export function queueQuoteLocally(quote: QuoteRequest): void {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(QUOTE_KEY);
    const list = raw ? (JSON.parse(raw) as QuoteRequest[]) : [];
    list.push(quote);
    window.localStorage.setItem(QUOTE_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('[TOD] Could not queue quote request:', error);
  }
}

export function readQueuedQuotes(): QuoteRequest[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(QUOTE_KEY);
    return raw ? (JSON.parse(raw) as QuoteRequest[]) : [];
  } catch {
    return [];
  }
}
