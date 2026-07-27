# Brag Plan: TOD Studio (Tarek Omar Design)

## What is this app?
A browser-based 3D interior planner — you draw a room, place real cabinetry that
snaps flush to the millimetre, swap finishes, and then walk around inside the
result in first person. The marketing site exists to funnel into it.

## The angle
This is not a startup launch, and the video must not smell like one. Tarek Omar
Design is an interior architecture practice; the software's whole visual system
is "paper, stone, ink, and one brass accent — no gradients, no glass, no glow."

So the film is an **architecture studio's project film for a piece of software.**
The thesis is *precision you can feel.* It opens in the language of drawings — a
brass dimension line on paper, a figure resolving to `3600 mm` — and ends inside
the room that drawing became. The claim is never spoken; it's demonstrated by
letting you watch a cabinet snap flush and a worktop re-template itself.

What makes it specific: no other project's video opens on a dimension line, and
no other project's centerpiece is a countertop silently re-flowing across three
cabinets because the geometry was derived rather than stored.

## Hook (first 2-3 seconds)
Paper. A single brass dimension line draws itself left to right, end ticks
snapping in. The figure above it counts up and settles: **3600 mm**.

That's the hook. In two seconds it declares that this thing is *measured* — not
vibes, not a mood board — which is exactly the promise the rest of the video pays
off. It earns the next twenty seconds because it looks like a drawing, and you
want to know what the drawing becomes.

## Key moments (the middle)
- **The plan stands up.** The 2D floor plan extrudes into walls; paper ground
  darkens to the Studio's obsidian canvas.
- **A cabinet snaps flush.** Cursor clicks a real catalog row; the module flies in
  and stops hard against the wall. A second one latches beside it, backs aligned,
  the gap closing to zero with a `600 mm` label ticking in between.
- **The worktop templates itself.** One continuous slab wipes across the run.
  Then a third cabinet drops in and the slab *re-templates instantly* to cover all
  three — because worktop runs are derived every frame, never stored.
- **Walk inside.** UI chrome falls away, the camera drops to eye height and pushes
  forward into the finished kitchen.

## Outro / punchline
No cut to a logo card. The camera settles inside the room, the interior dims, and
the wordmark fades up *over the space you just watched get built* — with the
site's own line: **"Design, explore, and experience your space before it exists."**
The joke, such as it is, is that by then it does exist.

## User flow worth showing
Real, and it is the centerpiece:
1. **Entry** — empty room shell, catalog panel open on the left.
2. **Key action** — click a catalog row → module snaps flush to the wall; place a
   second → it latches beside the first.
3. **Result** — worktop templates across the run; press WALK INSIDE and stand in it.

Scenes 3, 4 and 5 are this flow. Landing-page material is used once, as the
closing frame only.

## Tone
- Preset: **polished**
- Creative direction: *an architecture practice's project film — measured, material, quiet*
- Interpretation: Long settled holds, no rapid cutting, no flashing text. Motion
  is confident and slow-out. Restraint is the point: the palette is already
  narrow, so the film earns its impact from precision and negative space rather
  than energy. Six scenes rather than the preset's 3-4, but each one holds — the
  cutting rhythm still reads as measured, not busy.

## Format: landscape — 1920x1080
## Duration: 23.0s target

## Visual identity (from the project)
Pulled from `src/app/globals.css` `@theme` and `src/app/layout.tsx`.

- Background (light ground): `#f7f5f1` (paper)
- Background (studio ground): `#131211` (obsidian) / `#221f1c` (ink)
- Accent: `#b98a4b` (antique brass), soft `#d8b988`
- Text on dark: `#f7f5f1`; muted `#c9c3b8` (stone), `#8f8a80` (ash)
- Supporting neutrals: `#e5e1d9` (linen), `#4a4640` (graphite)
- Placement-valid signal: `#5f7d56`
- Display font: **Cormorant Garamond** (light weights, large)
- Body/UI font: **Inter**
- Signature detail: the `.label` style — 11px uppercase, `0.16em` letter-spacing.
  This is the workhorse of the identity and should carry every caption.
- Strongest visual element: brass-on-paper dimension lines, and the hard flush
  snap of a cabinet against a wall line.

## Share copy (draft)
Built a browser-based 3D interior planner where the cabinets actually snap flush
to the millimetre — and the worktop re-flows itself every time you move one.

## Audio direction
- Role: **sparse professional accents over a low bed** — tactile first, musical second.
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (bundled, 114.84 BPM).
  Honest note: all five bundled tracks are upbeat corporate and are the wrong
  register for this film. It is usable only under treatment — see below. If a
  calmer ambient bed can be resolved at composition time, prefer it.
- Music treatment: **Do not start the track on the hook.** The first ~5 seconds
  are near-silent — room tone plus dry brass ticks. Music enters on the extrude
  (scene 2) at low volume (~0.18), ducks under every SFX accent, and fades out
  during scene 6 so the closing wordmark lands in near-silence.
- Music cue guidance: preset cue file read (`cues/…vol-11….music-cues.md`).
  Strong cues at **5.80s** (target: the plan extrudes), **12.65s** (target: the
  second module latches), **17.91s** (target: the worktop re-templates). Beat grid
  is ~0.53s apart — far too fast for sequential text, so use it only for the snap
  accents and the slab wipe, never to pace a readable line.
- Audio-reactive treatment: **subtle — one element only.** The interior light
  presence in scene 5 may breathe with music RMS. Nothing else. No waveform bars,
  no particles, no strobing, no glow on type — those would violate the project's
  own "no gradients, no glass, no glow" rule.
- SFX posture: sparse, motion-matched, dry. Perhaps six cues in the whole film.
  The two cabinet snaps are the most important sounds in the video — they are the
  product's signature sensation.
- Audio-coupled moments: dimension end-ticks, the count-up settling, both snaps,
  the slab wipe, the final chrome drop-away.
- Restraint rule: no whooshes, no risers, no impact booms, no music sting on the
  logo. If a cue sounds like a product ad, cut it.

## Storyboard

### Scene 1 — Drawn to the millimetre — 4.8s
Paper ground `#f7f5f1`. A faint plan grid fades up. A brass dimension line draws
itself left to right with end ticks snapping in; above it a figure counts 0 → 3600
and settles as `3600 mm` in tabular figures. The room's plan outline completes
around it. Small caps, bottom left: `TAREK OMAR DESIGN`.
Sequential/interaction: yes — left tick, line draw, right tick, then the count-up,
then the outline closing. Four discrete arrivals, each given room.
Audio intent: near-silence. Establish that this film is calm and precise.
Audio-coupled idea: dry brass tick on each end cap; a soft settle when the figure lands.
Music: none — deliberately held back.
Transition mood: soft → Scene 2

### Scene 2 — The room stands up — 3.4s
The plan lifts into perspective; walls extrude upward from the floor plan. The
paper ground darkens through linen to obsidian `#131211` as it goes. Small caps
settle centre: `TOD STUDIO`.
Sequential/interaction: none — one continuous transformation.
Audio intent: the film opens up. First musical entry, low and unhurried.
Audio-coupled idea: music enters on the extrude; target strong cue 5.80s.
Music: low bed, ~0.18 volume.
Transition mood: clean → Scene 3

### Scene 3 — It snaps — 5.2s
The Studio's catalog panel slides in from the left with three real rows: `Base
Cabinet 600`, `Tall Unit 600`, `Wall Cabinet 800`. A cursor moves to the first and
clicks. The module flies in and **stops hard, flush against the wall** — a brass
line flashes along the contact edge. A second module then latches beside it, backs
aligned, the gap closing to zero, with a `600 mm` dimension label ticking in
between. Hold on both seated.
Sequential/interaction: yes — simulated cursor click, then two distinct snap
events, each with its own hard stop. Do not blend them into one motion.
Audio intent: tactile and dry. This is the sound of the product working.
Audio-coupled idea: a crisp, short snap on each flush contact — motion-matched to
the exact stop frame, not to the beat.
Music: continues low, ducking under both snaps.
Transition mood: clean → Scene 4

### Scene 4 — One slab — 3.6s
A worktop wipes left to right across the pair in one continuous slab. Small caps
caption fades in beneath: `WORKTOPS ARE DERIVED, NEVER STORED`. Then a third
cabinet drops into the run and the slab **re-templates instantly** across all
three.
Sequential/interaction: yes — slab wipe, then caption, then the third cabinet and
the re-flow. The re-flow is the payoff and must read as instantaneous.
Audio intent: a soft stone settle; weight without impact.
Audio-coupled idea: slab wipe aligned to the beat grid; the re-template lands on
strong cue 17.91s.
Music: low bed.
Transition mood: soft → Scene 5

### Scene 5 — Walk inside — 3.4s
The UI chrome falls away. A pill button reads `WALK INSIDE`. The camera drops to
eye height and pushes forward into the finished kitchen — first person, warm brass
light across the fronts.
Sequential/interaction: yes — the button is pressed, then the camera moves. The
press causes the move; show the causation.
Audio intent: space. The room becomes audible.
Audio-coupled idea: a quiet click on the press, then the bed opens up.
Music: bed lifts slightly, then begins its fade.
Transition mood: soft → Scene 6

### Scene 6 — Wordmark — 2.6s
No cut. The held interior dims behind. `TAREK OMAR DESIGN` fades up in letterspaced
small caps, with the site's own line beneath in Cormorant Garamond light:
*Design, explore, and experience your space before it exists.*
Sequential/interaction: none — one fade, one long hold.
Audio intent: near-silence again, closing the loop with scene 1.
Audio-coupled idea: one last soft tick as the wordmark settles. Nothing else.
Music: faded out to zero by the midpoint of this scene.

**Music mood for this video:** restrained — a low bed that enters late, stays under, and leaves before the end.
**Audio summary:** The film starts and ends in near-silence with dry brass ticks; a quiet musical bed carries only the middle three scenes, ducking under two crisp cabinet snaps that are the most important sounds in the piece.

---

## Build notes — where the delivered film differs from this plan

Recorded honestly rather than quietly, so the next run knows what actually happened.

- **Audio-reactive treatment was not implemented.** The plan allows one restrained
  instance (interior light presence breathing with music RMS in scene 5). It was
  dropped for budget, not because extraction failed. Nothing in the film reacts to
  the audio; every visual beat is authored timing.
- **Eleven SFX cues, not "about six."** Each is 0.01–0.57s and they are spread
  across 23.8s, so the layer still reads as sparse, but the count is nearly double
  what the plan called for.
- **Scene lengths shifted** to put the three beat-locks on their strong cues:
  4.8 / 3.4 / 5.2 / **4.9** / 3.0 / 2.5 = 23.8s. Scene 4 grew from 3.6s so the
  worktop re-template could land on the 17.91s cue, and scenes 5-6 tightened.
- **The music is a compromise.** All five bundled tracks are upbeat corporate and
  are the wrong register for this film. It is held out of the hook entirely, sits
  at 0.18, ducks to 0.09 under each cabinet snap, and is gone before the wordmark.
  A calmer ambient bed would be a real improvement.
- **Projection changed during the build.** The storyboard's "plan lifts into
  perspective" was first built by rotating the room −16°, which made every vertical
  surface lean. Corrected to an upright room with the eye above mid-height — true
  one-point interior perspective, verticals stay vertical. Snapshots caught this;
  the linter could not.
