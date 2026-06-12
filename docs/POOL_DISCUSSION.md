# Pool page: discussion document

Drafted 2026-06-12. Decision points for the pool composition layer, with options and recommendations.

Status (2026-06-12, same day): decisions 1-5 approved and built as proposed; build order steps 1-4 done (breeds.js, form.js, torus + blob species modules, pool_v1 with random generation and dart-throwing layout). Decisions 6 and 7 (negative-polarity field, per-specimen grid phase) remain open, to be judged from renders. Step 6 (remaining species extractions) is incremental. One deviation from the draft: shared scripts are classic scripts defining globals rather than ES modules, so file:// keeps working; the localhost note below is obsolete.

## Starting position

Nineteen species, eight breeds, every breed on every species. All planned species built. The gating condition for the pool ("when species catalog feels sufficient") is met.

Decisions already made that the pool inherits:

- **Global lighting.** The pool owns the light. It writes `direction`, `keyIntensity`, `ambient` into each specimen's tuple before rendering. No per-specimen override. (Resolved 2026-05-13.)
- **Random builds, not saved tuples.** The pool generates specimens from unguided random seeds. Tuples in test-file DEFAULTS are for standalone testing only. (Resolved 2026-05-13.)
- **Position and scale live at the composition level**, not the specimen level. (SPECIMEN.md.)
- **Canvas-aligned breed grids** (halftone, dot_matrix) were a deliberate default so specimens sharing a canvas read as printed on one screen. Confirmation deferred to the pool. (TRACKER.md.)

## Decision 1: code reuse

The pool needs all nineteen form passes and all eight breed passes. Today each lives copy-pasted in every test file: ~2,100 lines per file, ~40k lines total. Every breed propagation so far has been a verbatim 19-file copy.

Options:

- **A. Extract shared modules.** `js/breeds.js` (the eight `draw*FromForm` functions plus `applyTone`, polarity, grain), `js/species/<name>.js` (one form pass per species). The pool page imports them. Test files migrate opportunistically or never.
- **B. Self-contained pool HTML.** Paste everything into one file, consistent with the current test-file discipline. The file would be enormous and every future breed fix would need applying twice (test file plus pool).
- **C. Drive the existing test files via iframes** and composite their canvases. No extraction, but placement, shared grids, and shared light all fight the iframe boundary. Dead end.

**Recommendation: A, breeds first.** The typed-array contract is what made verbatim propagation possible; extraction is the same property used in the other direction, and it ends the 19-file propagation cost for every future breed. Species form passes follow as one module each. Test files keep working untouched; parity is provable by rendering the same tuple in both paths.

This is the largest structural decision in the document. Everything below assumes A.

## Decision 2: render model

Where each pipeline stage runs when N specimens share one canvas.

- **Form pass: per specimen, offscreen, at placed size.** Render each form at its target pixel dimensions rather than rendering at 560x420 and resampling. Resampling a silhouette mask aliases; resampling luma blurs. This requires parameterizing the hardcoded `CANVAS_W`/`CANVAS_H` per render, which extraction (Decision 1) forces anyway.
- **Breed pass: in pool-canvas coordinates.** The breed reads the specimen's form buffer through a placement offset but computes its own geometry (grid cells, scatter positions) in pool coordinates. This is what makes the shared halftone screen real: two specimens at different positions sample the same grid.
- **Tone pass: per specimen**, unchanged (per-pixel inside the breed loop).
- **Paper grain: once, at the pool level**, after all specimens. Grain is paper, and there is one sheet of paper.

Memory note: form buffers are per-specimen bounding boxes, not pool-sized. A pool-sized Float32 luma array per specimen would not scale.

## Decision 3: composition format

A pool tuple, serializable like a specimen tuple:

```json
{
  "canvas": { "w": 1600, "h": 1200 },
  "light": { "keyIntensity": 1.3, "direction": [-0.6, 1.0, 0.5], "ambient": 0.1 },
  "paperGrain": 0.55,
  "seed": 7,
  "specimens": [
    {
      "place": { "x": 240, "y": 180, "w": 420, "h": 315, "z": 0 },
      "species": "torus",
      "breed": "halftone",
      "geometry": { },
      "tone": { },
      "breeds": { },
      "inkColor": [14, 13, 11],
      "inkAlpha": 232,
      "polarity": "positive",
      "seed": 1138
    }
  ]
}
```

Each entry is a full specimen tuple plus `place`. The pool injects `light` into every entry before rendering, per the global lighting decision. `z` is draw order. Two identical pool tuples produce the same image, same as specimens.

Open sub-question: does `place` carry `w`/`h`, or a single `scale` against a canonical specimen size? Recommendation: `w`/`h`. Scale implies a reference size that no longer exists once 560x420 stops being special.

## Decision 4: random generation

The pool needs to invent specimens. DEFAULTS gives one known-good point per species; random builds need ranges around it.

**Recommendation:** each species module exports `DEFAULTS` and `RANGES` (per-parameter sampling bounds). The pool samples geometry from RANGES, picks species and breed uniformly at first, and rolls fresh seeds. Weighting (some species commoner than others, some breeds rarer) is a tuning knob to add after the first renders, not before. Defining RANGES is per-species judgment work; the test-file sliders' min/max are the starting candidates.

## Decision 5: layout

Procedural first, manual as fallback (TRACKER's lean).

**Recommendation for v1:** dart-throwing with rejection. Sample a position and size, reject if the bounding box overlaps an already-placed specimen beyond a padding threshold, stop after K failures. Simple, seeded, and produces the loose non-overlapping scatter a shore pool wants. Overlap as a composition feature (ink overprinting, z-order occlusion) is worth exploring later; it should be a choice, not a side effect of the first layout algorithm.

Manual placement comes later as nudge controls on the specimen list, not a drag editor.

## Decision 6: negative polarity in the pool

In a standalone test file, negative polarity fills the entire canvas surround. On a shared canvas, "the surround" has to be bounded. The literal port makes the specimen's placement rect the field: negative specimens read as dark plates with a cutout form. That may be exactly right (SHAPE-12/15 read as plates) or it may need a non-rectangular field shape.

**Recommendation:** port the rect-field behavior, render it, and judge from the result. Same protocol as the grid question.

## Decision 7: the halftone grid question (carried from TRACKER)

Already answered in structure by Decision 2: grids compute in pool coordinates, so the shared screen is the default. The remaining question, whether per-specimen grid phase is also wanted, should be decided by looking at a halftone-on-halftone composition, not in the abstract. If the shared screen is right, the decision closes. If specimens need their own phase, add an optional `gridOrigin` to the breed params then.

## Interaction model

The test files are live-slider instruments. The pool is not. N form passes at 30-60ms each per 3D specimen puts full live updates out of budget, and the point of the pool is the snapshot.

**Recommendation:** generate-and-reroll. Pool-level controls (canvas size, light, count, seed, GENERATE). A specimen list with per-entry reroll and remove. A composition JSON view, same convention as the specimen view. No per-parameter sliders on pool specimens in v1; a specimen that needs tuning gets its tuple copied into its species test file.

## Where it lives

`pool/pool_v1.html`, importing from `js/`. Same versioning convention as species files. The page is self-contained in spirit (no build step, ES modules from raw files) but not in the single-file sense; Decision 1 already spends that property.

Note: ES modules require serving over HTTP (`python3 -m http.server`); `file://` blocks module imports in most browsers. This changes the "open the file in a browser" workflow for the pool page only. Worth confirming this cost is acceptable before committing to Decision 1's module form; the alternative is plain script tags with globals, which keeps `file://` working.

## Proposed build order

1. **Extract the breed pass** into `js/breeds.js`. Prove parity: one species test file (torus) temporarily loads the module and renders identically to its inline copy, same tuple, pixel-for-pixel or visually indistinguishable.
2. **Extract two species form passes** (one 3D, one 2D-native; torus and blob) with parameterized canvas size.
3. **Pool page v1:** hardcoded composition tuple, two specimens, manual placement. Proves the render model (Decision 2): offsets, shared grid, pool-level grain, injected light.
4. **Random generation and layout** (Decisions 4 and 5). First real pools.
5. **Judge the deferred questions from renders:** grid phase (Decision 7), negative polarity field (Decision 6).
6. **Extract remaining seventeen species** as needed; the pool's species menu grows as modules land.

Each step is independently committable and leaves the test files working.

## Out of scope for v1

- Specimen library / saved tuples (TRACKER "Later").
- SVG output.
- Multi-form breeds (shared shadow).
- Drag-based layout editing.
- Animation, physics (project non-goals).
