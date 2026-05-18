# Session Brief: 2026-05-10

## What happened

Continued work on SHAPE-141 dendrite species (`specimen_dendrite_v1.html`). The dendrite v1 was built in the previous session using the skeleton distance field architecture. This session focused on adding controls for spine shape and branch symmetry.

## Changes made

### 1. End branches at spine terminals
Branches now extend from both ends of the spine. The first spine node spawns a branch pointing backward (opposite spine direction). The last spine node spawns one pointing forward. Both use 80% of `branchLen`.

### 2. Symmetry control
Added `symmetry` parameter (0-1 slider) controlling bilateral mirroring of lateral branches across the spine axis. At `symmetry=0`, up and down branches are independent (original behavior). At `symmetry=1`, the down branch mirrors the up branch's angle and sub-branch structure. Uses per-node seeded RNG for reproducibility.

### 3. Spine noise controls (three iterations, none satisfactory)

**Attempt 1: kink/kinkDecay/noiseMode on branches.** Added `kink` (angular deviation magnitude), `kinkDecay` (depth attenuation), and `noiseMode` (free/zigzag/drift) to `addBranch`. Problem: user wanted these controls on the spine centerline, not on lateral branches. The branches were going chaotic while the spine stayed flat.

**Attempt 2: kink/kinkDecay/noiseMode moved to spine.** Replaced the spine's hardcoded `(rnd()-0.5)*0.3` angular drift with the kink system. Used angle accumulation with clamping. Problem: in `free` and `zigzag` modes, the angle accumulation slammed into the clamp and held there, pushing the spine off-screen. Only `drift` mode worked because it used gentler increments.

**Attempt 3: Guideline-based spine construction.** Replaced the angle-walk spine entirely with a two-step system inspired by the user's reference diagram:
1. Generate N guide points at evenly spaced X positions along a horizontal baseline, with Y offsets controlled by `guideAmp` and `noiseMode`
2. Interpolate spine nodes from the guide, then apply smoothing

New parameters: `guideCount` (number of guide points, default 8), `guideAmp` (Y displacement in px, default 60), `smoothing` (0-1, default 0.50), `noiseMode` (free/zigzag/drift).

Problem: the smoothing implementation (Chaikin averaging passes) was destroying all variation, especially with few spine nodes. Fixed by changing smoothing to a linear blend between raw angular guide and a heavily smoothed version. Also raised `spineSegments` default from 5 to 8 and expanded its slider range to 3-16.

**Current status: the math produces correct Y variation when tested in Node.js, but the user reports no visible change in the rendered species.** The session ended without resolving this disconnect. The guide Y values do vary (verified numerically), but the visual effect on the rendered form is not registering for the user.

### 4. Branch forward jitter
`addBranch` forward continuation uses a fixed `(rnd()-0.5) * 0.5` jitter (approximately +/-14 degrees per level), independent of spine controls. The `mirror` parameter (from symmetry) multiplies this. Fork angles still use `angleSpread`.

## Current parameter state (DEFAULTS.geometry)

```
spineSegments:  8       (was 5)
trunkWidth:     8
curveBow:       0.25
guideCount:     8       (new)
guideAmp:       60      (new, pixels)
smoothing:      0.50    (new, 0=angular, 1=smooth)
noiseMode:      'free'  (new, free/zigzag/drift)
depth:          3
branchLen:      100
lenDecay:       0.65
taper:          0.70
angleSpread:    1.30
branchProb:     0.75
lateralDensity: 0.90
symmetry:       0.00    (new)
spikeFreq:      0.30
spikeLen:       22
spikeSharp:     2.5
seed:           4271
```

## What was removed

- `curveNoise` parameter (replaced by guideline system)
- `kink` and `kinkDecay` parameters (replaced by `guideAmp` and `smoothing`)
- Angle-walk spine construction (replaced by guideline interpolation)

## Open problems

### The spine shape is not reading visually
The numerical output confirms the spine Y coordinates vary by 50-80px across the canvas. But the user cannot see this variation in the rendered form. Possible causes to investigate:

1. **Branch mass dominates.** Branches are 100px long at depth 3. The spine's 50px Y variation is small relative to the total silhouette. The spine's shape may be invisible under the branch canopy.

2. **curveBow masks the guide shape.** Each spine segment gets Bezier bow of 0.25 * segment_length. This smooth arcing may be overriding the angular guide shape, making all spines look similar regardless of guide geometry.

3. **The guide approach may need to control branch placement, not just spine Y.** In the user's reference diagram, the guide determines where branches attach. The spine in the reference is clearly angular/zigzag because the branches extend from the corners of the zigzag, making the shape legible. In our implementation, branches attach at evenly-spaced spine nodes regardless of the guide shape.

4. **Spine segments vs guide points mismatch.** With 8 spine segments interpolating from 8 guide points, every spine node lands near a guide point. But with 5 spine segments from 8 guide points, the interpolation subsamples the guide and may miss peaks.

### The user's reference diagram (reference141guideline.png)
Shows a two-panel concept:
- Left: horizontal red baseline with pink guide points placed above/below by noise, connected by gray segments forming a zigzag polyline
- Right: the same guide points (red dots) with a smooth spline drawn through them (dark gray), and lateral branches extending from the spline nodes (small blue dots along curves)

The key insight from this reference that may not be fully implemented: the guide points ARE the spine nodes. The spine doesn't interpolate between a separate set of guide points. The guide IS the spine. The number of guide points equals the number of spine joints. The smoothing (spline fitting) happens in how the segments curve between those joints, not in post-hoc Y averaging.

## Recommendations for next session

1. Consider making guide points and spine nodes the same thing. `guideCount` becomes `spineSegments`. Each guide point is a spine joint. `guideAmp` controls Y displacement. Smoothing controls `curveBow` on the connecting segments (low bow = angular joints, high bow = flowing curves through guide points).

2. Test with `smoothing=0`, `curveBow=0`, `guideAmp=100`, `noiseMode=zigzag` to isolate whether the spine variation is actually visible when maximized and when branches are turned off (`lateralDensity=0`).

3. The user is doing additional research for reference examples. Wait for those before committing to an architecture.

## Files modified this session

- `proterozoic/species/specimen_dendrite_v1.html` -- all changes above
