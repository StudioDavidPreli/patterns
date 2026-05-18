# Session brief: 2026-05-09 — bristle evolution + fused_bristle (unresolved)

Closed without landing. The fused_bristle work across three architectures (v1 metaball, v2 explicit primitives, v3 trimmed-tube + global-wedge) does not read as SHAPE-141 in the user's eyes. User stepping out to research the form before more building. This brief is meant to give a fresh session enough context to pick up without re-deriving the false starts.

## What this session set out to do

Starting state: bristle v2 was canonical (closed Catmull-Rom body around the canvas centroid, radial spikes around its perimeter, single-chamber). Halftone had been propagated across all species. Bolt v3 had landed as SHAPE-23 only. User wanted to extend the bristle line to handle a "collapse" / multi-chamber form they associated with SHAPE-141.

## What got built

In order:

1. **bristle v3** (`species/specimen_bristle_v3.html`). Added `ASPECT` slider (x-axis stretch, range 0–3.0) and extended thickness ranges (body 1–24, spike 0.5–12). Considered complete by the user. Remains the canonical single-body bristle.

2. **fused_bristle v1** (`species/specimen_fused_bristle_v1.html`). Metaball lobes along a horizontal guide spine, marching-squares iso-contour at threshold 1.0 produces the unified body, spike outward direction = `-gradient(field)` normalized. Bug: `makeSeededRandom` was referenced but not defined (cp from filament v3 only carried `makeValueNoise`). Fixed in place.

3. **fused_bristle v2** (`species/specimen_fused_bristle_v2.html`). Replaced metaballs with explicit primitives: each chamber is a Catmull-Rom perturbed body (bristle v3 model translated to a lobe centre), adjacent chambers connected by 2-point neck tubes stamped at body thickness, spikes attach per-chamber with `(attach − lobe.centre)` outward and ±30° wedge exclusion facing each immediate neighbour.

4. **fused_bristle v3** (`species/specimen_fused_bristle_v3.html`). Three fixes from the expo4/5/6 review: tubes trimmed to chamber edges (skipped when chambers overlap); spike-wedge exclusion now globally blocks the angular direction of every other chamber; defaults retuned to lobes 6, bodyRadius 20, lobeSpread 360, spikeCount 24 to match a more-numerous-smaller-bumps silhouette.

User after testing v3: "this isn't working."

## Why none of the architectures landed

The fundamental uncertainty is what SHAPE-141 actually looks like at the silhouette level.

- v1 metaball produced hourglass pinched necks, not parallel-walled tubes. Reference shows clear necks with parallel walls.
- v2 explicit primitives went centre-to-centre on tubes; tubes burrowed through chamber interiors and the chain read as a wandering polyline through scattered chambers when `lobeVar` was nonzero. Spikes flew into non-adjacent chambers (wedge only blocked immediate neighbours).
- v3 fixed both v2 issues and retuned defaults, but the user's verdict was the architecture itself isn't right.

There is also a confounding factor: at one point I misread shape141expo5.png as showing a thin elongated worm-creature, which would have invalidated the chambered-chain architecture entirely. The user corrected this in shape141expo6.png: the chiseled hatching pattern inside the reference body is internal fill, the actual outer outline IS a chambered chain. So the chambered architecture is at least directionally right; the implementation isn't producing the right silhouette.

## Reference image dossier

All in `/Users/david/Desktop/patterns/reference/digitalFantasy/`:

- `shape141expo.png` — User's first decomposition. Three steps: (1) smooth bezier closed body with red control points; (2) same body with multi-segment spikes radiating outward; (3) more deformed version of (2). Suggested the species is "closed body + radial multi-segment spikes."
- `shape141expo2.png` — Black single-body bristle (then-current build) vs blue desired multi-chambered look. Drove the move from bristle v3's single-body model to fused_bristle's multi-chamber attempt.
- `shape141expo3.png` — Three-pane: top-left fused_bristle current build (three chambers chained), top-right red drawing of expected (three distinct circles connected by tubes), bottom-right original SHAPE-141 reference with blue overlay marking either "circles to draw" or "negative space to fill" (interpretation ambiguous).
- `shape141expo4.png` — Luma source of fused_bristle v2 with extreme settings (radius 30, lobes 5, lobeSpread 292, lobeVar 95, deform 0.485). Showed scattered chambers with tubes reading as a wandering polyline ("baseline spline") and spikes intersecting non-adjacent chambers.
- `shape141expo5.png` — Side-by-side: current build (3 chamber chain) vs SHAPE-141 reference. I misread this image, thought the reference was a thin elongated worm. User corrected.
- `shape141expo6.png` — Correction: "the center was a color fill, but the body is as originally described." Confirmed the chambered-chain architecture is right in principle, the chiseled pattern inside the reference is fill not silhouette.

## Key decisions and reversals

- bristle v3 considered complete (single body + radial spikes). Multi-chamber lives in fused_bristle.
- fused_bristle v1 used metaballs because the user picked option A (smooth fusion) from a multiple-choice question.
- fused_bristle v2 abandoned metaballs after their hourglass necks failed to match the reference's parallel-walled necks.
- ASPECT slider's lower bound was relaxed from 0.3 to 0 mid-session for extreme-ratio testing on bristle v3.
- I twice misread reference images (expo3 partly, expo5 entirely) and the user corrected each time.

## Architectural lessons from this session

- The chambered-chain architecture for SHAPE-141 is at minimum directionally correct. The user's reference outline does show a chain of bumps connected by necks; the chiseled hatching inside is fill, not silhouette.
- Implementing the chain via metaballs gives wrong neck geometry for SHAPE-141. Explicit primitives (chambers + tubes) get closer.
- Trim tubes to chamber edges, not centre-to-centre; otherwise the tube chain reads as a wandering polyline whenever chambers scatter.
- Wedge exclusion must block ALL chambers, not just adjacent ones, otherwise spikes escape into non-adjacent chamber territory at high `lobeVar`.
- None of these alone produces a satisfying SHAPE-141 silhouette. Something deeper is missing in the silhouette construction.

## Open questions for next session

1. **Is the chambered-chain architecture itself the wrong primitive?** The user has stepped out to research. If their research surfaces a different generator (e.g., medial axis with variable thickness, or a single closed curve with localized pinch points, or marching squares from a non-metaball field), v3's "chamber + tube" model is the wrong scaffolding to build on.
2. **Should fused_bristle be deleted?** If the architecture turns out wrong, all three versions become reference-only artifacts. Worth deleting from the active species list and moving the files to `oldVers/` if so.
3. **Has the same misreading happened on other reference images?** I offered a comparison pass on filament (SHAPE-19), bolt (SHAPE-23), cylinder (SHAPE-65), and arch (SHAPE-71) earlier and the user said no for now. Two of my SHAPE-141 readings were off; non-zero chance the others are too. Worth doing the comparison pass before extending those species further.
4. **Does the project's existing chain-of-circles stamp infrastructure produce the right kind of body silhouette for SHAPE-141 at all?** Every species so far stamps a polyline tube (filament, bolt, bristle, fused_bristle). The reference outlines may need a different rendering primitive (filled region vs swept tube).

## Recommended next steps when resuming

1. User shares findings from research.
2. Re-decompose the SHAPE-141 reference one more time, ideally with the user marking explicit primitives (circles, lines, fills) directly on the reference image rather than freehand interpretations.
3. Decide the fate of the three fused_bristle versions: keep as evolution history, archive, or delete.
4. Decide whether to extend bristle v3 differently or to introduce a new species name with a fresh architecture.
5. Possibly: do the comparison pass on filament/bolt/cylinder/arch references before any further species work, to catch any other off-by-architecture interpretations early.

## Files touched this session

Created:
- `species/specimen_bristle_v3.html`
- `species/specimen_fused_bristle_v1.html`
- `species/specimen_fused_bristle_v2.html`
- `species/specimen_fused_bristle_v3.html`

Updated:
- `docs/SPECIES.md` — bristle v3 entry, fused_bristle entry rewritten across the three versions
- `docs/TRACKER.md` — species table rows, multiple "Now" rewrites, recent-changes entries
- `docs/README.md` — file list updates

## What is canonical right now

- bristle v3 is fine and considered complete by the user (single-body SHAPE-141).
- fused_bristle v3 is the latest but not "working" per the user. v1 and v2 are retained for reference. None should be considered correct for SHAPE-141 until the user's research lands.
- All other species (torus, arch, cylinder, filament, bolt) untouched this session.
