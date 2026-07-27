# TOD Studio — Handoff

Everything another engineer or agent needs to pick this up. The README covers
what the product does; this covers **why the code is shaped the way it is, and
what will bite you.**

---

## 1. What this is

`Sherifelshryf/tarekomardesign` — the Tarek Omar Design website plus **TOD
Studio**, a browser-based 3D interior planner (IKEA-kitchen-planner style).
The planner is the product; the marketing site exists to funnel into it.

**Stack:** Next 16 (App Router) · React 19 · TypeScript · Tailwind 4 ·
Three.js + React Three Fiber 9 + drei 10 · Zustand 5 · Framer Motion.

**State:** merged and deployed on Vercel. `main` is the default branch and the
production branch. Two PRs merged: the initial build (#1) and a door-swing fix
(#2).

```
npm install
npm run dev          # http://localhost:3000
npm run build
npm run typecheck
npm run test:journey # 27-step browser test, needs a server on :3000
```

---

## 2. Non-negotiable invariants

Break any of these and things go subtly wrong rather than loudly wrong.

### Units
**Every persisted length is millimetres. Every angle is degrees.** Three.js runs
in metres and radians. Conversion happens *exactly once*, at the render
boundary, via `lib/units.ts` (`mmToM`, `mToMm`, `degToRad`, `radToDeg`).

If you find yourself converting in two places, one of them is a bug.

### Coordinates
- Room is centred on the origin. `x ∈ [−width/2, +width/2]`,
  `z ∈ [−length/2, +length/2]`, `y` rises from the floor at 0.
- **A module's local +Z points out of its front.** So `rotationY = 0` means its
  back is against the north wall (`z = −length/2`).
- `PlacedObject.position.y` is the **underside** height, not the centre.
- Wall facing angles: north 0°, west 90°, south 180°, east 270°.

### Rotation maths
Rotating about +Y by θ maps `(1,0,0) → (cos θ, 0, −sin θ)` and
`(0,0,1) → (sin θ, 0, cos θ)`. **This sign trips people up constantly** — see
§5, it already caused a shipped bug.

### State separation
`project` is the single persistent truth. `selectedId`, `hoveredId`,
`viewMode`, `draggingId`, `feedback` are editor state and are **never
serialised**. Keep it that way — `lib/persistence.ts` assumes it.

---

## 3. Architecture

```
src/
  app/                    routes: /, /projects, /projects/[slug], /studio, /api/quote
  components/
    site/                 marketing site (no Three.js — keeps 3D out of that bundle)
    studio/
      StudioLoader.tsx    client boundary; dynamic import with ssr:false
      StudioShell.tsx     layout, session restore, autosave, capture, dialogs
      catalog/            left product catalog + SVG thumbnails
      editor/             the 3D editor
        modules/          procedural product geometry
      properties/         contextual right panel
      ui/                 toolbar, mode bar, dialogs, overlays
    three/                material system + procedural textures
  data/                   catalog, materials, portfolio, demo kitchen
  lib/                    geometry, snapping, collision, worktops, units,
                          persistence, bom, project
  stores/plannerStore.ts  Zustand
  types/index.ts          the whole domain model
tests/core-journey.mjs    end-to-end browser test
```

### Products are data
`data/catalog.ts` is the spine. It drives the catalog UI, properties panel,
snapping behaviour, collision, worktop generation and pricing. **No component
references a SKU.** Adding a module = adding a row.

`Product.render` is a `RenderSpec` discriminated union selecting a procedural
renderer. Setting `Product.modelUrl` is the intended hook for real GLB assets —
render it in the matching module component and nothing else changes.

### Storage is an interface
The planner only talks to `ProjectRepository` (`lib/persistence.ts`).
localStorage is one implementation. Swapping in a server store means
implementing that interface — no changes in the store or components.

### Undo/redo
Whole-project snapshots, not a command log. Kitchens are tens of modules, so
this is far simpler and more reliable. `HISTORY_LIMIT = 60`.

One history entry **per gesture**: `beginDrag` snapshots before the first
movement, `dragObjectTo` mutates without snapshotting, `endDrag` pops the entry
if nothing actually moved (so a click doesn't cost an undo step).

### Drag performance
A live drag writes through a **module-level session object**
(`editor/interaction.ts`), not React state. Routing 60fps pointer moves through
React would re-render the whole scene. `DragController` listens on the canvas
element, not on each mesh, so a fast drag that outruns the cursor keeps
tracking.

---

## 4. Subsystems worth understanding before editing

**`lib/geometry.ts`** — OBB footprints, separating-axis overlap test, wall
definitions. `footprintsOverlap` uses SAT with a tolerance so snapped runs that
*touch* don't count as overlapping.

**`lib/snapping.ts`** — two-stage: wall snap (rotate + pin flush) then module
snap (latch beside a compatible neighbour, backs aligned). `resolveSnap` is
pure. `findFreeSpot` decides where a catalog click lands, and its priority
order matters: extend an existing run → start a new run on free wall → open
floor spiral. Each candidate goes through the real collision test.

**`lib/collision.ts`** — `validatePlacement` for editing;
`resolveWalkCollision` for the walkthrough (depenetrates along the axis of
least penetration in each module's local frame).

**`lib/worktops.ts`** — worktop runs are **derived, never stored**. Groups
carriers by heading + height + back line, splits into contiguous stretches,
emits one slab each. Move a cabinet and it re-templates.

**`components/three/proceduralTextures.ts`** — all 30 finishes are canvas
textures generated at runtime (wood grain, marble veining, stone speckle,
concrete mottle). Deterministic PRNG seeded off the material id, so a finish
looks identical every reload. `getScaledTexture` shares textures by
`(materialId, quantised repeat)` — see §5.

---

## 5. Bugs already found and fixed — do not reintroduce

These were all caught by driving a real browser. They are the traps in this
codebase.

1. **Door swing sign.** `DoorPanel`'s target angle is `side * ...`, **not**
   `-side * ...`. A left-hung leaf (`side = −1`) extends toward +X and needs
   θ < 0 to swing forward; a right-hung leaf extends toward −X and needs θ > 0.
   That is exactly `side`. Negating it swings both leaves back through the
   carcass and out through the wall. There's a comment on the line — read it
   before "fixing" it.

2. **drei `<Html distanceFactor>` under an orthographic camera.** It degenerates
   and scales a label until it covers the entire viewport. Plan view looked
   blank. Dimension labels are now fixed screen size. Don't reintroduce
   `distanceFactor`.

3. **drei camera components re-apply `position` on every render.** That yanks
   the camera back mid-walkthrough and undoes user panning. `CameraRig` sets
   camera transforms **imperatively** in a mount effect. Never pass a live
   `position` prop to `PerspectiveCamera` / `OrthographicCamera` here.

4. **In-scene HTML overlays must be `pointer-events: none`** or they swallow
   clicks meant for the UI. The canvas `<main>` is `overflow-hidden` so they
   can't spill onto the side panels.

5. **Texture explosion.** Cloning a texture per mesh uploaded 150+ copies of a
   512² canvas for one kitchen. `getScaledTexture` quantises tiling to quarter
   repeats and shares. A full demo kitchen is now **11 textures, ~305 draw
   calls, ~9.8k triangles**. If those numbers jump, something regressed.

6. **Shadow maps render on demand,** not per frame. A directional light's shadow
   doesn't depend on camera position, so re-rendering it while orbiting is
   waste. `LightingRig` sets `shadow.autoUpdate = false` and flips
   `needsUpdate` when the design changes.

7. **Openings follow their wall.** Doors/windows hosted by a wall the cutaway
   removed must hide too, or their frames float in mid-air. `computeHiddenWalls`
   is shared between `RoomShell` and `Scene`.

8. **Environment map is rendered from local geometry,** not a drei HDRI preset —
   presets fetch from a CDN at runtime.

---

## 6. Testing

`tests/core-journey.mjs` drives the full 27-step journey in Chromium: landing →
room creation → cabinet placement → wall snap → module-to-module snap → finish
change → island → 2D plan → 3D → walkthrough → save → refresh → restore →
Finish Design → quote. **24/24 must pass.**

It drives the planner through `window.__tod` etc., exposed by
`components/studio/DebugBridge.tsx`. Those hooks are **off in production unless
`NEXT_PUBLIC_TOD_DEBUG=1`** is set at build time — CI sets it so the test runs
against the real production bundle. **A normal deploy must leave it unset.**

CI (`.github/workflows/ci.yml`): two jobs — `build` (typecheck + next build) and
`journey` (build → serve → browser test), with screenshots uploaded on failure.

**Runners have no GPU**, so the Studio renders via SwiftShader at ~2–3 fps. The
test uses a small viewport and generous margins (walkthrough needs 0.4 m of
travel, typically gets ~1.7–2.0 m). If that step flakes, widen the threshold —
don't delete the check.

---

## 7. Known gaps and honest caveats

- **Frame rate on real hardware is unverified.** Every performance figure came
  from software rasterisation in a GPU-less container. Draw-call and triangle
  counts are healthy and should hit 60fps, but this was reasoned, not measured.
- **Touch walkthrough is unverified on a real touchscreen.** The virtual stick
  and look pad are implemented and wired but only exercised via synthetic
  pointer events.
- **`/api/quote` does not deliver mail.** It validates, logs and returns a
  reference. No mail service is wired up, and faking delivery would be worse
  than not having it. Failed submissions stay queued in localStorage. Replace
  the body of `record()` with a DB insert + notification; the client contract
  is already fixed.
- **"Design with AI" is not implemented and deliberately not stubbed.** The
  intended shape: a service emitting the same `Project` structure the manual
  editor produces, loaded through the identical path.
- **Portfolio content is placeholder.** Projects are illustrated with generated
  SVG compositions (`site/ProjectArtwork.tsx`) built from each project's
  palette, rather than stock photography, so nothing misrepresents work that
  doesn't exist. Swap in `<Image>` — the layouts are unchanged.
- **Only the kitchen vertical is filled in.** `RoomType` and `ROOM_TYPE_GROUPS`
  already register dressing rooms, bedrooms, bathrooms, living rooms, offices
  and whole apartments, and the catalog panel reads from them. Dressing rooms
  are the shortest next build — they reuse tall units, drawers and wall storage
  almost entirely.
- **Below `xl` the side panels overlay the canvas** rather than sitting in
  flow. Intentional, but it means the plan view is framed to the full canvas
  width and partly sits under the panels at tablet sizes.

---

## 8. If you extend it

- **Real 3D assets** — set `Product.modelUrl`, render it in the matching module
  component. Snapping, collision, worktops and pricing are untouched.
- **Real textures** — set `MaterialOption.mapUrl`; the procedural generator is
  bypassed.
- **A backend** — implement `ProjectRepository` against an API route.
- **A new room vertical** — add products with the right `group`, extend
  `ROOM_TYPE_GROUPS`. The catalog, properties panel and BOM already follow.
- **New module geometry** — add a `RenderSpec` variant and a renderer in
  `editor/modules/`. Work in metres, origin at footprint centre on the
  underside, front facing +Z.

Whatever you change in the editor, **run `npm run test:journey` before
shipping.** Every bug in §5 was invisible to typechecking and to reading the
code — they only showed up in a real browser.
