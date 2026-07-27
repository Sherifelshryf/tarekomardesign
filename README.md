# Tarek Omar Design

An interior architecture website and **TOD Studio** — a browser-based 3D interior
planner in the spirit of an IKEA-style room planner, with Tarek Omar Design's own
identity.

The planner is the product. The marketing site exists to lead people into it.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run test:journey # end-to-end check of the core user journey
```

---

## What works

Everything below is implemented and exercised by the end-to-end test — no
placeholder buttons.

**Room** — create a room at real dimensions or from a preset, resize it at any
time (wall-hosted modules follow their wall), change floor and wall finishes.

**Catalog** — 28 modules across base/drawer/sink/corner cabinets, wall units,
tall units, islands, worktops, sinks, appliances, lighting, doors, windows and
accessories. Products are data; no component references a SKU.

**Placing and editing** — click to place, drag to move, select, rotate,
duplicate, delete, resize within the product's declared limits, undo/redo.

**Snapping** — modules rotate and pin flush when their back nears a wall, and
latch beside compatible neighbours to build a continuous run. Placement that
would leave the room, breach a wall or overlap another module is flagged in red.

**Materials** — 30 finishes across fronts, carcasses, worktops, floors, walls and
metal. Every one is a procedural canvas texture (oak grain, marble veining,
quartz speckle, concrete mottle), so the app ships with a complete library and
no texture payload. Changes apply instantly.

**Worktops** — continuous slabs are generated across runs of adjacent base
modules and re-template themselves whenever anything moves.

**Views** — orthographic 2D plan (selectable and draggable, with measurements and
flat drawing-style lighting), an orbiting 3D view with a cutaway that hides the
walls between camera and room, and a first-person walkthrough.

**Walkthrough** — WASD + pointer lock on desktop, virtual stick and look pad on
touch. Eye height, swept collision against room and furniture, and clicking a
cabinet door or drawer opens it.

**Lighting** — day and night, cross-faded, with placed fixtures that come alive
after dark.

**Saving** — localStorage with autosave, plus save-as, load, delete and a
thumbnail per project. Restores on refresh.

**Finish Design** — bill of materials grouped the way a customer thinks
("Base Cabinets × 7", "Worktop — White Marble, 6.40 m"), indicative pricing, a
full itemised spec, and a quote request that carries the entire project to
`/api/quote`.

**Capture** — renders the current view and downloads it as a PNG.

---

## Architecture

```
src/
  app/                     routes: marketing site, /studio, /api/quote
  components/
    site/                  marketing site
    studio/
      catalog/             left product catalog
      editor/              the 3D editor
        modules/           procedural product geometry
      properties/          contextual properties panel
      ui/                  toolbar, mode bar, dialogs, overlays
    three/                 material system and procedural textures
  data/                    catalog, materials, portfolio, demo kitchen
  lib/                     geometry, snapping, collision, worktops,
                           units, persistence, bill of materials
  stores/                  planner store (Zustand)
  types/                   the domain model
```

**Units.** Every persisted length is millimetres and every angle degrees. Three.js
works in metres and radians, and conversion happens exactly once, at the render
boundary, through `lib/units.ts`.

**Coordinates.** The room is centred on the origin. A module's local +Z points out
of its front, so `rotationY = 0` means its back is against the north wall.

**State.** `project` is the single persistent truth. Selection, hover, view mode
and drag feedback are editor state and are never serialised. Undo/redo snapshots
whole projects — kitchens are small, and this is far more reliable than a command
log. A live drag writes through a module-level session object rather than React
state, so moving one cabinet doesn't re-render the scene.

**Products are data.** `data/catalog.ts` drives the catalog UI, the properties
panel, snapping behaviour, collision, worktop generation and pricing. A product's
`RenderSpec` selects a procedural renderer; setting `modelUrl` will render a real
GLB instead, and nothing else changes.

**Storage is an interface.** The planner only talks to `ProjectRepository`.
Swapping localStorage for a server store means implementing that interface.

---

## Extending it

**Real assets.** Set `Product.modelUrl` and render it in the matching module
component. Set `MaterialOption.mapUrl` and the procedural generator is bypassed.
Nothing else moves.

**Other rooms.** `RoomType` and `ROOM_TYPE_GROUPS` already register dressing
rooms, bedrooms, bathrooms, living rooms, offices and whole apartments; the
catalog panel reads from them. Kitchen is the vertical that ships complete.

**A backend.** `/api/quote` validates and acknowledges enquiries but deliberately
does not pretend to deliver mail — there is no mail service wired up. Replace the
body of `record()` with a database insert and a notification; the client contract
is already fixed, and failed submissions stay queued locally.

**Design with AI.** Not implemented, and not faked. The intended shape is a
service that emits the same `Project` structure the manual editor produces, so it
would load through exactly the same path as any saved design.

---

## Notes

- Portfolio content is placeholder. Projects are illustrated with generated SVG
  compositions built from each project's palette rather than stock photography,
  so nothing misrepresents work that doesn't exist. Swap in `<Image>` when real
  photography is available; the layouts are unchanged.
- The environment map is rendered from local geometry rather than a drei HDRI
  preset, which would fetch from a CDN at runtime.
- Shadow maps refresh when the design changes rather than every frame — a
  directional light's shadow doesn't depend on where the camera is.
- Textures are shared across every surface with the same finish and tiling. A
  full demo kitchen uses 11 textures and ~300 draw calls.
