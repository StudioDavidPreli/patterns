# Session Brief: 2026-05-11b (continuation)

Continues from `SESSION_BRIEF_2026-05-11.md`. That session built the contour generator and solved self-intersection. This session addressed curve smoothness, structural fidelity to the reference, then integrated the generator into the specimen pipeline as a new species and built a new breed.

## Starting state

The contour generator at `proterozoic/curveTests/generate.js` produced clean non-intersecting silhouettes (500/500 seeds). The self-intersection problem from the previous session was solved with a four-layer defense: spine slope limiting, vertical contour offset, same-side angular exclusion, and post-hoc crossing repair with near-miss detection.

The shapes were structurally correct (body with radiating spikes) but visually angular. The user identified that the overall curve character of the reference was not replicated in the generations.

## Method: measurement-driven tuning

The central approach was to quantify the visual gap between the reference and generated curves, then use those numbers to guide parameter changes. This replaced the previous session's approach of adjusting parameters by visual intuition, which had produced five failed attempts across three species names.

### The measurement tools

Two scripts were built in `proterozoic/curveTests/`:

**`measure_peaks.js`** (from the prior session, extended here): Samples SVG paths densely (100 points per bezier segment), finds curvature peaks via local maxima of angular change, then measures deflection angle (angular change at 30-sample distance from peak) and tip radius (circumradius of a 3-point triangle spanning 25 samples each side of peak). Works on both the hand-drawn reference (relative `c`/`s` commands) and generated curves (absolute `C` commands).

**`measure_all.js`** (new this session): Comprehensive structural comparison measuring seven characteristics from sampled SVG paths:

1. Peak height: distance from spike tip to the midpoint of its flanking curvature valleys
2. Spike spacing: horizontal distance between consecutive same-side tips
3. Spike lean angle: angle from vertical between base midpoint and tip
4. Body axis undulation: Y range and direction-change count of the median-Y-per-X-bin axis
5. Top/bottom asymmetry: spike count and average height per side
6. Inter-spike body curvature: curvature at valley points between peaks (uninformative; always near zero)
7. Spike base width: distance between the two curvature valleys flanking each spike

## Curve smoothness changes

### Catmull-Rom tension (the main lever)

The original generator used split tension: 0.05 at spike tips and 0.2 at body contour points. This produced angular, tent-like spike transitions.

The winning approach: **uniform tension 0.55 everywhere**. The problem was not spike-tip-specific. Low body tension made the body contour rigid. Raising tension uniformly made the entire path flow, changing the overall character more than any tip-specific adjustment.

### Other tuning

- Spike density: per-side count changed from `rr(3, 8)` to top `rr(4, 8)` / bottom `rr(5, 10)`. Minimum index spacing relaxed from 2 to 1.
- Spine amplitude floor: if Y range below 180px after generation, scales deviations up.
- Crossing repair iterations: 40 to 60 for denser spike placement.
- Final crossing rate: 3/500 seeds (0.6%).

## Specimen pipeline integration

### Decisions

Four decisions made before building:
1. **Name: synapse.** Not "contour" or "dendrite."
2. **Spike normals: inherit from spine.** d clamped at +-1 in spike regions. No separate shading model.
3. **0.6% crossing rate: acceptable for v1.** Bezier-level crossing detection deferred.
4. **Tension slider exposed** (not baked).

### Synapse species: `species/specimen_synapse_v1.html`

Seventh species. 2D-native. Complete specimen file (~1600 lines).

**Form pass.** Offscreen HTML canvas rasterizes the closed bezier path via `bezierCurveTo` + `fill()` + pixel readback into the silhouette Uint8Array. First species to use canvas bezier fill for silhouette (vs chain-of-circles stamp used by bristle/filament/bolt).

**Normal synthesis.** Spine-relative cylindrical model. For each silhouette pixel: find nearest spine segment, compute perpendicular cross-section parameter d in [-1,1], derive normal as `(perpX*d, -perpY*d, sqrt(1-d^2))`. Spikes inherit spine normals (d clamped), making spike shading continuous with body.

**Self-intersection defense.** Four layers from generate.js:
1. Spine slope limiting
2. Vertical contour offset
3. Same-side angular exclusion
4. Post-hoc crossing repair (60 iterations)

**10 geometry sliders:** nSpine, bodyHalf, slopeLimit, minSpineRange, tension, topCount, bottomCount, spikeMinLen, spikeMaxLen, spikeLean.

All seven breeds wired from v1.

### Outline breed: propagated to all 7 species

New breed. Boundary detection via 4-neighbor check on the silhouette mask. Draws circles at boundary pixels. First breed that ignores luma entirely.

Parameters: `weight` (0.5-5.0, default 1.5) and `jitter` (0-1.5, default 0.00).

Implementation identical across all species (typed-array contract). Seven edits per file: defaults, radio button, params panel, dispatch, function, slider bindings, reset.

Propagation order: synapse (built-in), bristle, filament, bolt, torus (shape02_v10), arch (shape71_v4), cylinder (cylinder_v2).

Browser-tested on synapse, arch, and cylinder.

## Files created or modified

- `species/specimen_synapse_v1.html` -- new file, complete specimen
- `species/specimen_bristle_v3.html` -- outline breed added
- `species/specimen_filament_v3.html` -- outline breed added
- `species/specimen_bolt_v3.html` -- outline breed added
- `species/specimen_shape02_v10.html` -- outline breed added
- `species/specimen_shape71_v4.html` -- outline breed added
- `species/specimen_cylinder_v2.html` -- outline breed added
- `docs/BREEDS.md` -- outline moved from Planned to Built
- `docs/TRACKER.md` -- synapse species added, outline breed updated, Now section rewritten
- `proterozoic/curveTests/generate.js` -- contour generator v3 (tension, density, amplitude floor)
- `proterozoic/curveTests/curve_01.svg` through `curve_10.svg` -- regenerated
- `proterozoic/curveTests/measure_all.js` -- structural comparison tool
- `docs/SESSION_BRIEF_2026-05-11b.md` -- this file

## Current state

Seven species, seven breeds. Every species has every breed wired.

| Species | File | Type |
|---|---|---|
| torus | specimen_shape02_v10.html | 3D primitive |
| arch | specimen_shape71_v4.html | 3D extruded outline |
| cylinder | specimen_cylinder_v2.html | 3D primitive |
| filament | specimen_filament_v3.html | 2D-native |
| bolt | specimen_bolt_v3.html | 2D-native |
| bristle | specimen_bristle_v3.html | 2D-native |
| synapse | specimen_synapse_v1.html | 2D-native |

| Breed | Consumes |
|---|---|
| raster_vertical | silhouette, luma |
| stipple | silhouette, luma |
| halftone | silhouette, luma |
| riso_noise | silhouette, luma |
| color_blocking | silhouette, luma, normals |
| outline | silhouette |

## Open items for next session

1. Wire color_blocking on 2D-native species that have normals but don't yet dispatch to it (filament, bolt, bristle, synapse).
2. Tune saved tuples for built species.
3. Build blob (next planned 2D-native species).
4. The contour generator at `curveTests/generate.js` is superseded by the synapse specimen. Remains useful as a standalone SVG reference tool.
