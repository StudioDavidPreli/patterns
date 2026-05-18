# Session Brief: 2026-05-11

## Context

SHAPE-141 has been attempted five times across three species names (fused_bristle v1-v3, dendrite v1, and now a standalone contour generator). This session changed approach: instead of building inside the specimen pipeline, we analyzed the reference SVG directly and built an SVG contour generator to test whether we can produce the right silhouette shape before worrying about the breed pipeline.

## Reference analysis

### spline.svg is not a scribble

`docs/spline-generator-reference.md` was reviewed and found to fundamentally misread the reference. It describes spline.svg as a "tangled, self-crossing line" like "thread dropped from a height" and builds a random-walk scribble generator. This is wrong. The reference is an organic body with radiating spike projections, read left-to-right with clear bilateral structure. The statistical analysis in that document (chord lengths, turn angles, control point ratios) is mathematically correct for the path data but interprets the numbers through the wrong lens. A generator built from that spec would produce scribbles, not dendrites.

What is salvageable from that document: the local curvature style data (control point reach ratios, s-command frequency) describes how the hand-drawn line curves at the segment level. This could inform the Bezier control point placement in any generator.

### spline_structural_anatomy.html

An interactive SVG overlay identifying the reference's structural anatomy:
- Red dashed line: body axis (mean Y at each X bin)
- Blue circles: top spike tips with leader lines to body axis, labeled with spike lengths
- Orange circles: bottom spike tips with leader lines
- Toggle-able anchor points

Key measurements from the anatomy: the body axis spans Y=113 to Y=277 (164px of 360px canvas height). Left half has dramatic swings (Y range ~130px), right half compresses to ~80px range. Spike lengths range from ~40px to ~200px. Top has 7 spikes, bottom has 5-6.

## What was built

### Contour generator: `proterozoic/curveTests/generate.js`

Produces SVG silhouettes in the spline.svg family. Architecture:

1. **Spine** as a random walk with decaying amplitude. Y steps are 25-75px, larger on the left, smaller on the right, with a gentle upward drift. This matches the reference body axis character: dramatic irregular swings on the left, settling into a tighter band on the right.

2. **Body contour** offset from spine by 4-12px on each side, using the local perpendicular of the spine tangent.

3. **Spikes** placed at random spine indices (3-8 per side, minimum spacing of 2 indices). Direction is 60% global vertical / 40% local perpendicular, so spikes project roughly up/down even when the spine tilts steeply. Length 25-130px with random lean along the spine tangent.

4. **Outline tracing**: left end cap, top contour (left to right) with spike tips inserted directly between body points, right end cap, bottom contour (right to left) with spike tips, close. Single closed path.

5. **Bezier fitting**: Catmull-Rom to cubic Bezier conversion. Tension 0.4 at body contour points, 0.1 at spike tips (sharper).

### Two iterations

**v1 (committed, then replaced):** Sine-wave spine, pre/post spike base points (3 points per spike: departure, tip, return). Problems: spine too regular and tame (Y range ~80px vs reference's ~164px); spike bases angular because the pre/post points created near-degenerate short segments that kinked at the transition.

**v2 (current):** Random-walk spine, direct tip insertion (1 point per spike). Spine Y range now ~270px. Spike bases smooth because Catmull-Rom handles the body-to-tip-to-body transition without artificial kinks.

### Output

10 SVGs at `proterozoic/curveTests/curve_01.svg` through `curve_10.svg`, seeds [42, 137, 256, 512, 777, 1024, 1337, 2048, 3141, 4096]. Viewer at `proterozoic/curveTests/viewer.html` shows all 10 alongside the reference.

## Open problem: self-intersection

The generated curves can self-intersect in two ways:

1. **Opposite-side spikes crossing.** A long top spike and a long bottom spike at nearby spine positions overlap when their combined length exceeds the vertical distance between their bases.

2. **Same-side spikes crossing.** Two spikes on the same side that lean toward each other create a figure-eight in the outline.

Three approaches were discussed:

- **Clearance check** (for cause 1): before finalizing a spike tip, measure distance to the opposite-side contour at that X. If the tip would cross it, shorten the spike. Cheap, handles the common case.
- **Angular exclusion** (for cause 2): after placing a spike, compute the angular zone it occupies as seen from neighboring spike bases. Clamp lean angles to avoid overlap. Similar to the wedge exclusion from fused_bristle.
- **Skeleton + offset curve** (different architecture): define a tree skeleton, inflate with uniform-radius offset. Guarantees no self-intersection. But this is what dendrite v1 already does and it does not produce the right shape. Do not revisit.

Recommended next step: implement clearance + angular exclusion in the current contour generator.

## Critical: do not return to the skeleton distance field approach

`species/specimen_dendrite_v1.html` uses a skeleton distance field architecture for SHAPE-141. It does not produce forms in the spline.svg family. The problems documented in `SESSION_BRIEF_2026-05-10.md` (spine shape invisible under branch canopy, guide-vs-spine mismatch) are inherent to the skeleton approach, not fixable by parameter tuning.

The contour generator takes the opposite approach: it constructs the outline silhouette directly rather than deriving it from a distance field around a branching skeleton. This is the right direction for SHAPE-141.

The five SHAPE-141 attempts so far:

| Attempt | Architecture | Why it failed |
|---|---|---|
| fused_bristle v1 | Metaball + marching squares | Hourglass necks, unstable spike directions |
| fused_bristle v2 | Explicit primitives (chambers + tubes) | Tubes wander, spikes into non-adjacent chambers |
| fused_bristle v3 | Trimmed tubes + global wedge | Still not SHAPE-141 per user |
| dendrite v1 | Skeleton distance field | Spine shape invisible under branch mass |
| contour generator | Direct outline construction | **Active. Self-intersection is the open problem.** |

## Files created or modified this session

- `proterozoic/curveTests/generate.js` -- contour generator (v2, current)
- `proterozoic/curveTests/curve_01.svg` through `curve_10.svg` -- test output
- `proterozoic/curveTests/viewer.html` -- comparison viewer
- `proterozoic/docs/spline_structural_anatomy.html` -- existed before session (user-created reference analysis)
- `proterozoic/docs/SESSION_BRIEF_2026-05-11.md` -- this file

## Recommendations for next session

1. Read this brief and `SESSION_BRIEF_2026-05-10.md`.
2. Open `proterozoic/curveTests/viewer.html` for visual context.
3. Add clearance + angular exclusion to `generate.js` to prevent self-intersection.
4. Once the contour generator produces clean non-intersecting silhouettes, decide whether to integrate it into the specimen pipeline (as a new species) or keep it as a standalone SVG tool.
5. Do not suggest the skeleton distance field approach.
