# Hyperframes Composition Brief: TOD Studio (Tarek Omar Design)

## Objective
Create a short launch-style brag video for **TOD Studio** — the browser-based 3D
interior planner inside the Tarek Omar Design site.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 23.0 seconds

## Source Material
- Project root: `/home/user/tarekomardesign`
- Primary files read:
  - `src/app/globals.css` — the `@theme` block is the authoritative palette
  - `src/app/layout.tsx` — font choices (`next/font/google`)
  - `src/components/site/Hero.tsx` — verbatim landing copy
  - `src/types/index.ts`, `src/lib/worktops.ts`, `src/lib/snapping.ts` — product behaviour
  - `HANDOFF.md` — subsystem descriptions
- Product name: **TOD Studio**, by **Tarek Omar Design**
- Tagline / strongest claim: *Design, explore, and experience your space before it exists.*
- Key UI or visual moment to recreate: the **flush snap** — a cabinet module
  stopping hard against a wall line — and the **worktop re-templating** across a
  run when a third cabinet joins it.
- Copy that must appear verbatim:
  - `TAREK OMAR DESIGN`
  - `TOD STUDIO`
  - `3600 mm`
  - `Base Cabinet 600`
  - `600 mm`
  - `WORKTOPS ARE DERIVED, NEVER STORED`
  - `WALK INSIDE`
  - `Design, explore, and experience your space before it exists.`

## Creative Direction
- Tone preset: **polished**
- Creative direction: *an architecture practice's project film — measured, material, quiet*
- Interpretation: Long settled holds, no rapid cutting, no flashing text. Motion is
  confident with slow-out easing. The palette is already narrow, so impact comes
  from precision and negative space, not energy. Six scenes, but each holds — the
  rhythm must read as measured, never busy.
- Angle: This is not a startup launch and must not smell like one. Tarek Omar
  Design is an interior architecture practice whose visual system is "paper,
  stone, ink, and one brass accent — no gradients, no glass, no glow." So the film
  is an architecture studio's project film for a piece of software. The thesis is
  *precision you can feel*: it opens in the language of drawings — a brass
  dimension line on paper resolving to `3600 mm` — and ends inside the room that
  drawing became. The claim is never spoken, only demonstrated.
- Hook: Paper ground. A brass dimension line draws itself left to right, end ticks
  snapping in, and a figure counts up and settles at `3600 mm`.
- Outro / punchline: No logo card. The camera settles inside the finished room, the
  interior dims, and the wordmark fades up *over the space just built*, with the
  site's own line beneath it.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - **Gradients, glassmorphism, glow, bloom, neon** — the project explicitly forbids these
  - Purple/blue tech palettes of any kind

## Visual Identity
Exact values from `src/app/globals.css`:

- Background (light ground): `#f7f5f1` paper; secondary `#efece6`, `#e5e1d9` linen
- Background (studio ground): `#131211` obsidian; `#221f1c` ink
- Text on dark: `#f7f5f1`; muted `#c9c3b8` stone, `#8f8a80` ash; `#4a4640` graphite
- Accent: `#b98a4b` antique brass; soft `#d8b988`
- Placement-valid signal: `#5f7d56`
- Display font: **Cormorant Garamond**, light weights, set large. Self-host or
  inline — do not rely on a font CDN at render time.
- Body/UI font: **Inter**
- Visual references from the project:
  - The `.label` style: ~11px, uppercase, `0.16em` letter-spacing. This is the
    workhorse of the identity — every caption should use it.
  - `font-variant-numeric: tabular-nums` on all figures (the project ships a
    `.tabular` class for exactly this).
  - Brass-on-paper dimension lines with perpendicular end ticks.
  - The Studio's dark canvas with a left-hand catalog panel.

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. **Drawn to the millimetre** — 4.8s — dimension line draws, `3600 mm` counts up and settles, room plan outline closes, `TAREK OMAR DESIGN` in small caps.
2. **The room stands up** — 3.4s — the plan extrudes into walls; paper ground darkens to obsidian; `TOD STUDIO` settles.
3. **It snaps** — 5.2s — catalog panel slides in with `Base Cabinet 600`; cursor clicks; module snaps flush to the wall; a second latches beside it; `600 mm` label ticks in.
4. **One slab** — 3.6s — worktop wipes across the run; `WORKTOPS ARE DERIVED, NEVER STORED`; a third cabinet drops in and the slab re-templates instantly.
5. **Walk inside** — 3.4s — chrome falls away, `WALK INSIDE` pressed, camera drops to eye height and pushes into the kitchen.
6. **Wordmark** — 2.6s — interior dims, `TAREK OMAR DESIGN` fades up with the tagline beneath.

## Audio
- Audio role: **sparse professional accents over a low bed** — tactile first, musical second.
- Audio arc: near-silence → low bed entering on the extrude → bed carries the middle
  three scenes, ducking under each snap → bed fades out so the wordmark lands in
  near-silence. Scene 1 and scene 6 bookend the film in quiet.
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (bundled, 114.84 BPM, 87.6s).
  Note: all five bundled tracks are upbeat corporate and are the wrong register for
  this film. Usable only under the treatment below. Prefer a calmer ambient bed if
  one can be resolved locally at composition time.
- Music treatment: **do not start on the hook.** Silent for the first ~4.8s. Enter on
  the scene-2 extrude at ~0.18 volume. Duck under every SFX accent. Fade to zero by
  the midpoint of scene 6.
- Music cue guidance: bundled preset read at
  `.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-11-by-ende-dot-app.music-cues.md`.
  Strong cues: **5.80s** → the plan extrudes; **12.65s** → the second module latches;
  **17.91s** → the worktop re-templates. Beat grid is ~0.53s apart — far too fast for
  sequential text, so use it only for snap accents and the slab wipe, never to pace a
  readable line.
- Audio-reactive treatment: **subtle — one element only.** The interior light presence
  in scene 5 may breathe with music RMS. No waveform bars, no particles, no strobing,
  no glow on type.
- Audio-coupled moments:
  - Scene 1, dimension end caps — two dry brass ticks, motion-matched to each tick landing
  - Scene 1, figure settling on `3600 mm` — one soft settle
  - Scene 2, extrude — music entry, beat-locked to strong cue 5.80s
  - Scene 3, both flush snaps — crisp short snaps matched to the exact stop frame, **not** to the beat
  - Scene 4, slab wipe and re-template — soft stone settle; re-template beat-locked to 17.91s
  - Scene 5, `WALK INSIDE` press — one quiet click, then the bed opens
  - Scene 6, wordmark settling — one last soft tick, nothing else
- SFX selection guidance: sparse, dry, motion-matched. Roughly six cues in the whole
  film. The two cabinet snaps are the most important sounds in the video — they are the
  product's signature sensation and should feel like a drawer closing well, not like a
  UI notification. No whooshes, no risers, no impact booms, no music sting on the logo.
- SFX analysis guidance: use `.agents/skills/brag/assets/sfx/sfx-analysis.md` if present;
  prefer low high-frequency-risk files given the polished tone and the repeated snap.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume
  based on the implemented animation.
- Audio files: copy the chosen music and any selected SFX into `brag-output/composition/assets/`.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`
(composition contract + `data-*` timing), `hyperframes-animation` (motion),
`hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes`
(seek-safe keyframes), and `hyperframes-cli` (lint/check/render). `/brag` is its own
workflow: do not enter the `hyperframes` entry-point intent interview and do not route
into its generic promo / launch-video workflow. Prefer native Hyperframes conventions
over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render — every readable line needs a settled hold
  (short label ~0.8s; a sentence ~0.3s per word, minimum ~1.2s).
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer.
- Treat the audio notes above as guidance, not a fixed cue sheet. Choose SFX after the
  visual animation exists.
- Lock only the three named strong cues; use natural timing everywhere else.
- Use local assets for audio and any runtime dependencies. **No CDN fetches at render
  time** — self-host the fonts.
- Run `hyperframes check` before render — it is brag's single gate.
