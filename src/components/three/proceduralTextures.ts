import * as THREE from 'three';
import type { MaterialOption } from '@/types';

/**
 * Procedural surface textures.
 *
 * Every finish in the catalog is generated on a canvas at runtime — oak grain,
 * marble veining, quartz speckle, concrete mottling — so the planner ships with
 * a complete material library and zero texture payload. When real scans become
 * available, `MaterialOption.mapUrl` takes precedence and none of this runs.
 *
 * Textures are cached per material id and shared; callers clone them (cheap —
 * the underlying image is shared) to set their own repeat.
 */

const TEXTURE_SIZE = 512;
/** Base pattern per material id — one canvas per finish. */
const cache = new Map<string, THREE.Texture>();
/** Repeat-scaled views, shared by every surface with the same tiling. */
const scaledCache = new Map<string, THREE.Texture>();

/** Deterministic value noise so a finish looks identical on every reload. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  return canvas;
}

/* ------------------------------------------------------------- generators */

function drawWood(ctx: CanvasRenderingContext2D, material: MaterialOption, rand: () => number): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = material.color;
  ctx.fillRect(0, 0, width, height);

  const accent = material.accent ?? material.color;

  // Long grain lines running along the plank direction.
  for (let i = 0; i < 190; i += 1) {
    const y = rand() * height;
    const thickness = 0.4 + rand() * 2.2;
    const alpha = 0.03 + rand() * 0.13;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(0, y);

    // Gentle wander gives the grain its cathedral figure.
    const amplitude = 2 + rand() * 9;
    const frequency = 0.004 + rand() * 0.01;
    const phase = rand() * Math.PI * 2;
    for (let x = 0; x <= width; x += 8) {
      ctx.lineTo(x, y + Math.sin(x * frequency + phase) * amplitude);
    }
    ctx.stroke();
  }

  // Occasional knots.
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 3; i += 1) {
    const cx = rand() * width;
    const cy = rand() * height;
    for (let r = 3; r < 22; r += 3) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.9, r, 0, 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // Plank joints.
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i += 1) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawMarble(ctx: CanvasRenderingContext2D, material: MaterialOption, rand: () => number): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = material.color;
  ctx.fillRect(0, 0, width, height);

  const accent = material.accent ?? '#9aa1a8';

  // Broad tonal drifts underneath the veining.
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 12; i += 1) {
    const gradient = ctx.createRadialGradient(
      rand() * width,
      rand() * height,
      10,
      rand() * width,
      rand() * height,
      160 + rand() * 180,
    );
    gradient.addColorStop(0, accent);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Primary veins, each branching into finer capillaries.
  for (let i = 0; i < 16; i += 1) {
    const startX = rand() * width;
    const startY = rand() * height;
    const angle = rand() * Math.PI * 2;
    drawVein(ctx, startX, startY, angle, 2 + rand() * 2.4, accent, 0.35, rand);
  }

  ctx.globalAlpha = 1;
}

function drawVein(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  thickness: number,
  colour: string,
  alpha: number,
  rand: () => number,
  depth = 0,
): void {
  if (depth > 3 || thickness < 0.25) return;

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = colour;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);

  let cx = x;
  let cy = y;
  let heading = angle;
  const segments = 14 + Math.floor(rand() * 16);
  for (let i = 0; i < segments; i += 1) {
    heading += (rand() - 0.5) * 0.55;
    cx += Math.cos(heading) * 14;
    cy += Math.sin(heading) * 14;
    ctx.lineTo(cx, cy);

    // Branch occasionally to build a natural vein network.
    if (rand() < 0.06) {
      drawVein(ctx, cx, cy, heading + (rand() - 0.5) * 1.6, thickness * 0.5, colour, alpha * 0.7, rand, depth + 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = colour;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
    }
  }
  ctx.stroke();
}

function drawStone(ctx: CanvasRenderingContext2D, material: MaterialOption, rand: () => number): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = material.color;
  ctx.fillRect(0, 0, width, height);

  const accent = material.accent ?? '#b3ada2';

  // Dense fine speckle — the engineered-stone look.
  for (let i = 0; i < 14000; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const r = rand() * 1.7;
    ctx.globalAlpha = 0.05 + rand() * 0.2;
    ctx.fillStyle = rand() > 0.45 ? accent : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A few larger aggregate chips.
  for (let i = 0; i < 260; i += 1) {
    ctx.globalAlpha = 0.06 + rand() * 0.12;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(rand() * width, rand() * height, 1.5 + rand() * 4, 1.5 + rand() * 3, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawConcrete(ctx: CanvasRenderingContext2D, material: MaterialOption, rand: () => number): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = material.color;
  ctx.fillRect(0, 0, width, height);

  const accent = material.accent ?? '#8f8b84';

  // Soft cloudy mottling.
  for (let i = 0; i < 90; i += 1) {
    const radius = 30 + rand() * 130;
    const gradient = ctx.createRadialGradient(
      rand() * width,
      rand() * height,
      0,
      rand() * width,
      rand() * height,
      radius,
    );
    gradient.addColorStop(0, rand() > 0.5 ? accent : '#ffffff');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Fine pitting.
  for (let i = 0; i < 5200; i += 1) {
    ctx.globalAlpha = 0.03 + rand() * 0.07;
    ctx.fillStyle = rand() > 0.5 ? '#000000' : '#ffffff';
    ctx.fillRect(rand() * width, rand() * height, 1, 1);
  }

  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------- api */

/**
 * Returns the shared texture for a finish, or `null` when the finish is a flat
 * colour (or we're rendering on the server).
 */
export function getProceduralTexture(material: MaterialOption): THREE.Texture | null {
  if (material.pattern === 'none') return null;

  const cached = cache.get(material.id);
  if (cached) return cached;

  const canvas = createCanvas();
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rand = makeRandom(hashSeed(material.id));

  switch (material.pattern) {
    case 'wood':
      drawWood(ctx, material, rand);
      break;
    case 'marble':
      drawMarble(ctx, material, rand);
      break;
    case 'stone':
    case 'tile':
      drawStone(ctx, material, rand);
      break;
    case 'concrete':
      drawConcrete(ctx, material, rand);
      break;
    default:
      return null;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  cache.set(material.id, texture);
  return texture;
}

/**
 * Returns a texture already scaled for a surface of the given size in metres.
 *
 * Tiling is quantised to quarter-repeats so that all the 600 mm doors in a
 * kitchen share a single GPU texture rather than each uploading its own copy.
 * Without this, a full kitchen uploads well over a hundred 512x512 textures
 * that differ only in a repeat value.
 */
export function getScaledTexture(
  material: MaterialOption,
  repeatU: number,
  repeatV: number,
): THREE.Texture | null {
  const base = getProceduralTexture(material);
  if (!base) return null;

  const density = material.repeatPerMetre ?? 1;
  const u = quantiseRepeat(repeatU * density);
  const v = quantiseRepeat(repeatV * density);
  const key = `${material.id}|${u}|${v}`;

  const cached = scaledCache.get(key);
  if (cached) return cached;

  const scaled = base.clone();
  scaled.needsUpdate = true;
  scaled.repeat.set(u, v);
  scaledCache.set(key, scaled);
  return scaled;
}

/** Snaps tiling to quarter steps so near-identical surfaces share a texture. */
function quantiseRepeat(value: number): number {
  return Math.max(0.25, Math.round(value * 4) / 4);
}

/** Frees every cached texture. Called when the Studio unmounts. */
export function disposeProceduralTextures(): void {
  scaledCache.forEach((texture) => texture.dispose());
  scaledCache.clear();
  cache.forEach((texture) => texture.dispose());
  cache.clear();
}
