import { KITCHEN_STANDARDS, getProduct } from '@/data/catalog';
import type { PlacedObject, WorktopRun } from '@/types';
import { axesForRotation, sameHeading, type Vec2 } from './geometry';

/**
 * Continuous worktop generation.
 *
 * Base modules that carry a worktop are grouped into runs: same heading, same
 * back line, and touching (or nearly touching) along their shared axis. Each
 * run becomes a single slab spanning the whole group, exactly as a fabricator
 * would template it — rather than one lid per cabinet.
 *
 * Runs are derived, never stored, so they update the moment a module moves.
 */

/** Largest gap between neighbours still bridged by one slab, in mm. */
const RUN_GAP_TOLERANCE = 60;
/** How far back lines may differ and still count as the same run, in mm. */
const BACK_LINE_TOLERANCE = 40;
/** How far the slab oversails the cabinet fronts, in mm. */
const FRONT_OVERHANG = 20;

interface RunMember {
  object: PlacedObject;
  /** Position along the run's lateral axis. */
  along: number;
  halfWidth: number;
}

export function generateWorktopRuns(objects: PlacedObject[]): WorktopRun[] {
  const carriers = objects.filter((o) => getProduct(o.productId)?.snapping.carriesWorktop);
  if (carriers.length === 0) return [];

  const groups: PlacedObject[][] = [];

  for (const object of carriers) {
    const group = groups.find((g) => belongsToGroup(g[0], object));
    if (group) group.push(object);
    else groups.push([object]);
  }

  const runs: WorktopRun[] = [];
  for (const group of groups) {
    runs.push(...splitGroupIntoRuns(group));
  }
  return runs;
}

/** Same heading, same worktop height and same back line. */
function belongsToGroup(reference: PlacedObject, candidate: PlacedObject): boolean {
  if (!sameHeading(reference.rotationY, candidate.rotationY, 6)) return false;

  const refTop = reference.position.y + reference.dimensions.height;
  const candTop = candidate.position.y + candidate.dimensions.height;
  if (Math.abs(refTop - candTop) > 20) return false;

  const { v } = axesForRotation(reference.rotationY);
  const refBack = backLine(reference, v);
  const candBack = backLine(candidate, v);
  return Math.abs(refBack - candBack) <= BACK_LINE_TOLERANCE;
}

/** Distance from the origin to the module's back plane along the depth axis. */
function backLine(object: PlacedObject, v: Vec2): number {
  const centreAlongV = object.position.x * v.x + object.position.z * v.z;
  return centreAlongV - object.dimensions.depth / 2;
}

/** Splits a co-linear group into contiguous stretches, one slab each. */
function splitGroupIntoRuns(group: PlacedObject[]): WorktopRun[] {
  const rotationY = group[0].rotationY;
  const { u, v } = axesForRotation(rotationY);

  const members: RunMember[] = group
    .map((object) => ({
      object,
      along: object.position.x * u.x + object.position.z * u.z,
      halfWidth: object.dimensions.width / 2,
    }))
    .sort((a, b) => a.along - b.along);

  const runs: WorktopRun[] = [];
  let current: RunMember[] = [members[0]];

  for (let i = 1; i < members.length; i += 1) {
    const previous = current[current.length - 1];
    const member = members[i];
    const gap = member.along - member.halfWidth - (previous.along + previous.halfWidth);
    if (gap <= RUN_GAP_TOLERANCE) {
      current.push(member);
    } else {
      runs.push(buildRun(current, rotationY, u, v));
      current = [member];
    }
  }
  runs.push(buildRun(current, rotationY, u, v));

  return runs;
}

function buildRun(members: RunMember[], rotationY: number, u: Vec2, v: Vec2): WorktopRun {
  const first = members[0];
  const last = members[members.length - 1];

  const start = first.along - first.halfWidth;
  const end = last.along + last.halfWidth;
  const length = end - start;
  const centreAlongU = (start + end) / 2;

  // Deepest member drives the slab depth; add a small front overhang.
  const depth = Math.max(...members.map((m) => m.object.dimensions.depth)) + FRONT_OVERHANG;
  // Slab back stays flush with the cabinet backs; the overhang falls at the front.
  const back = backLine(first.object, v);
  const centreAlongV = back + depth / 2;

  const top = first.object.position.y + first.object.dimensions.height;

  return {
    id: `worktop-${members.map((m) => m.object.id).join('-')}`,
    position: {
      x: centreAlongU * u.x + centreAlongV * v.x,
      y: top,
      z: centreAlongU * u.z + centreAlongV * v.z,
    },
    rotationY,
    dimensions: {
      width: length,
      height: KITCHEN_STANDARDS.worktopThickness,
      depth,
    },
    length,
    memberIds: members.map((m) => m.object.id),
  };
}

/** Total running length of every generated worktop, in millimetres. */
export function totalWorktopLength(runs: WorktopRun[]): number {
  return runs.reduce((sum, run) => sum + run.length, 0);
}
