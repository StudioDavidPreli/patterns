# Skeleton Distance Field Rendering: Technical Paper

## Abstract

This paper describes a method for generating procedural organic shapes — branching, spine-like forms resembling biological specimens — using a skeleton distance field approach. A branching tree of cubic Bézier curves defines the structural skeleton. A scalar distance field is computed from this skeleton, with per-segment width and taper producing natural thickness variation. The distance field drives both contour extraction (via marching squares) and multi-band region classification for mark-by-mark rendering. The method separates form generation (species) from visual rendering (breeds), enabling the same underlying structure to produce varied visual outputs.

---

## 1. Overview

The pipeline consists of five stages:

1. Skeleton generation — a procedural branching graph of nodes connected by curved segments
2. Curve baking — Bézier curves sampled into polylines for efficient distance queries
3. Distance field computation — per-pixel scalar field encoding proximity to the skeleton
4. Band classification — mapping distance values to discrete rendering regions
5. Mark rendering — per-pixel breed functions that place discrete marks based on band assignment

Each stage is independent and can be modified without affecting the others. The skeleton defines the topology, the distance field defines the geometry, and the breed defines the visual style.

---

## 2. Skeleton Generation

### 2.1 Data Structures

The skeleton is a directed acyclic graph stored as two arrays:

**Nodes** — an ordered list of 2D positions:
```
nodes: [{ x: number, y: number }, ...]
```

**Segments** — connections between nodes, each carrying width, taper, and Bézier control points:
```
segments: [{
  from: nodeIndex,
  to: nodeIndex,
  widthFrom: number,   // radius at the from-node
  widthTo: number,      // radius at the to-node
  cp1: { x, y },        // first Bézier control point
  cp2: { x, y },        // second Bézier control point
}, ...]
```

The graph is a tree: each node (except the root) has exactly one parent segment. Nodes may have zero or more child segments. Terminal nodes (leaves) represent branch tips.

### 2.2 Spine Construction

The primary structure is a horizontal spine — a chain of connected segments traversing the canvas. The spine is built iteratively:

1. Place a root node near the left edge of the canvas, vertically centered with slight random offset.
2. For each subsequent spine segment, advance the angle by a small clamped random drift (±0.15 radians, clamped to ±0.4 total) and compute the next node position at a distance of `targetSpan / spineCount * random(0.7, 1.3)`.
3. Connect consecutive spine nodes with segments at full trunk width, tapering slightly (×0.9) per segment.

The clamping ensures the spine remains roughly horizontal — it meanders but doesn't loop or reverse.

### 2.3 Lateral Branching

At each spine node, lateral branches are spawned:

1. Compute the local spine direction (angle from this node to the next spine node).
2. With probability `lateralDensity`, spawn an upward branch (perpendicular minus random offset) and a downward branch (perpendicular plus random offset).
3. Lateral branches use recursive subdivision: each branch may continue forward (with angular jitter) or fork at an angle controlled by `angleSpread`.
4. Width decays by `taper` at each recursive level. Length decays by `lenDecay`. Recursion terminates when depth reaches zero, width falls below 1px, or length falls below 8px.

The branching probability, angle spread, length decay, and taper are all exposed as parameters, enabling forms ranging from sparse single-spine structures to dense coral-like growths.

### 2.4 Bézier Control Point Generation

Each segment stores two cubic Bézier control points that define the curve between its from-node and to-node. Control points are generated as follows:

1. Compute the perpendicular normal to the straight line between the two nodes.
2. Choose a primary bow direction (left or right of the line) randomly.
3. Displace both control points in the primary direction by `bowAmount * segmentLength * (0.4 + random * 0.6)`, with a small secondary variation between them.

This produces C-curves (both control points bow the same way) rather than S-curves (which would cancel visually). The `curveBow` parameter controls the maximum displacement as a fraction of segment length.

The resulting curve for a segment with endpoints P₀ and P₃ and control points P₁ and P₂ is the standard cubic Bézier:

```
B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃,  t ∈ [0, 1]
```

---

## 3. Curve Baking

Analytical distance queries against cubic Bézier curves require solving quartic equations, which is computationally expensive per pixel. Instead, each curve is sampled into a polyline of N sub-segments (default N=12). The baked representation stores:

```
bakedCurves: [{
  points: [{ x, y }, ...],   // N+1 sample points along the curve
  widths: [number, ...],      // interpolated width at each sample point
}, ...]
```

Width is linearly interpolated along the curve parameter: `w(t) = widthFrom + t * (widthTo - widthFrom)`.

The sampling density (12 sub-segments) is sufficient for curves at the scales used in practice (50–200px segment lengths). Higher sampling improves accuracy at the cost of distance field computation time, which scales linearly with total sub-segment count.

---

## 4. Distance Field Computation

### 4.1 Core Distance Calculation

For each pixel (px, py), the distance field value is the maximum normalized proximity across all baked curve sub-segments:

```
For each sub-segment (A, B) with widths (wA, wB):
  1. Project (px, py) onto the line segment AB.
  2. Clamp the projection parameter t to [0, 1].
  3. Compute the closest point C = A + t * (B - A).
  4. Compute distance d = ||(px, py) - C||.
  5. Interpolate width at this t: w = wA + t * (wB - wA).
  6. Compute normalized value: val = 1.0 - (d / w).
  7. Take the maximum across all sub-segments.
```

The resulting field has value 1.0 at the skeleton centerline, decaying linearly to 0.0 at the boundary (distance = width), and 0.0 everywhere outside all segments. The maximum operation produces a union of all segment contributions — where segments overlap (at junctions), the field naturally thickens.

### 4.2 Spike Perturbation

Spikes are localized conical field contributions along the baked curves. They are precomputed before the per-pixel loop:

1. Walk each baked polyline, accumulating arc length.
2. At each sample point, use noise to decide whether to place a spike.
3. Compute the local tangent direction of the curve at that point.
4. Rotate the perpendicular normal by a noise-driven angular jitter (up to ±60°) to break orthogonal regularity.
5. Choose a random side (left or right) and spike length.

Each spike is stored as a position, direction, length, and sharpness (base width). During the per-pixel loop, spike contribution is computed as:

```
For each spike at position S with direction D, length L, sharpness K:
  1. Project (px, py) onto the spike axis: along = dot((px,py) - S, D).
  2. If along < 0, skip (behind spike base).
  3. Compute perpendicular distance: perp = |cross((px,py) - S, D)|.
  4. Compute taper parameter: t = along / L. If t > 1, skip.
  5. Compute spike width at this t: spikeWidth = K * (1 - t).
  6. If perp > spikeWidth, skip.
  7. val = (1 - t) * (1 - perp / spikeWidth) * 0.6.
  8. Take maximum with existing field value.
```

The 0.6 multiplier ensures spikes blend into the parent body rather than creating discontinuities.

---

## 5. Band Classification

The scalar distance field is partitioned into discrete bands based on threshold values:

| Field Value Range | Band | Semantic Role |
|---|---|---|
| val ≤ 0 | 0 (outside) | Background, no marks |
| 0 < val < bandEdge | 1 (edge) | Outer fringe, sparse marks |
| bandEdge ≤ val < bandCore | 2 (body) | Main body, medium density |
| val ≥ bandCore | 3 (core) | Centerline region, dense marks |

The `bandEdge` and `bandCore` thresholds are expressed as fractions of the normalized field (0 to 1). Since the field value represents normalized distance from the boundary (0) to the centerline (1), these thresholds directly control the spatial extent of each region.

A secondary noise field, evaluated independently from the distance field, drives accent placement. Red accents appear within the edge and body bands where the secondary noise exceeds a threshold. This noise field uses a different frequency and offset from the primary field, ensuring accents are spatially uncorrelated with the skeleton structure.

---

## 6. Mark Rendering (Breed System)

### 6.1 Architecture

Mark rendering is a separate pass that reads from the cached distance field. It does not modify the field or the skeleton. This separation enables rapid iteration on visual style without regenerating the underlying geometry.

Each pixel position is evaluated:

1. Look up the field value and classify into a band.
2. Apply a density check — a deterministic hash of the pixel position is compared against the band's density threshold. Marks that fail the density check are skipped.
3. Check for accent override — if the secondary noise field exceeds the accent threshold at this position, swap the color palette.
4. Select a color from the band's palette using the position hash.
5. Compute alpha variation based on field value (proximity to band boundaries produces transparency).
6. Apply position jitter — displace the mark by a hash-derived offset scaled by the jitter parameter.
7. Compute mark size with variation — width and height are independently scaled by hash-derived factors.
8. Draw a filled rectangle at the jittered position.

### 6.2 Deterministic Hashing

All stochastic decisions in the mark renderer (density, color selection, jitter, size variation) use a deterministic hash of the pixel position rather than random() calls:

```
hash = ((px * 73856093) ^ (py * 19349663)) & 0xFFFF
```

This ensures identical SPECIMEN tuples produce identical output across renders. The hash is split into independent bit ranges for each stochastic dimension (density uses the full value, color uses modulo, jitter uses shifted bits, size uses different shifted bits).

### 6.3 Mark Geometry

Marks are axis-aligned rectangles (not circles), producing the rectilinear, mosaic-like quality characteristic of the target aesthetic. Mark width and height are independently varied, creating a mix of squares and short rectangles. The `markSize` parameter sets the base dimension, and the stepping interval (distance between mark evaluations) is derived from it: `step = max(1, floor(markSize * 0.75))`.

---

## 7. Contour Extraction

Contour lines at arbitrary threshold values are extracted from the distance field using marching squares with linear interpolation. The implementation uses cell-by-cell contour tracing rather than segment collection and chaining:

1. Sample the field at grid corners (grid resolution is a parameter).
2. Classify each cell into one of 16 marching squares configurations.
3. For each unvisited cell edge with a contour crossing, trace the contour by walking cell-to-cell: the configuration determines which exit edge corresponds to each entry edge.
4. Continue until the trace returns to the starting cell (closed contour) or hits the canvas boundary (open contour).
5. Saddle cases (configurations 5 and 10) are disambiguated using the cell center value.

Contours can be smoothed via Chaikin corner-cutting (iterative 75/25 split) for softer silhouettes, though the mark-based rendering typically makes contour smoothness less critical than in vector output.

---

## 8. Performance Characteristics

The dominant cost is the distance field computation: O(W × H × S × N) where W×H is canvas resolution, S is segment count, and N is samples per curve. At 700×700 with 20 segments and 12 samples each, this is approximately 117M distance calculations.

Optimizations available but not implemented in the prototype:
- Spatial partitioning (grid or quadtree) to skip segments far from the current pixel
- AABB culling per baked curve to reduce inner loop iterations
- WebGL compute shader for parallel field evaluation
- Progressive field computation at coarse resolution, refined where values are near band thresholds

Mark rendering is O(W × H / step²) — a fixed cost independent of skeleton complexity. Contour tracing is O(W × H / res²) per threshold level.

---

## 9. Parameter Summary

| Parameter | Controls | Affects |
|---|---|---|
| depth | Maximum recursive branching levels | Skeleton complexity |
| trunkWidth | Radius at the root of each branch | Form thickness |
| taper | Width multiplier at each recursion level | Branch thinning |
| angleSpread | Angular range for side branches | Spread of form |
| branchLen | Length of trunk-level branches | Form extent |
| lenDecay | Length multiplier per recursion level | Branch shortening |
| branchProb | Probability of spawning sub-branches | Density of branching |
| curveNoise | Angular jitter on branch direction | Irregularity |
| curveBow | Bézier control point displacement | Curve amplitude |
| spineSegments | Number of segments in the main spine | Spine length |
| lateralDensity | Probability of lateral branches at each spine node | Branch density |
| spikeFreq | Density of spike placement along curves | Spike count |
| spikeLen | Maximum spike projection distance | Spike prominence |
| spikeSharp | Base width of spike cones | Spike thickness |
| bandEdge | Field value threshold for edge/body boundary | Color region sizing |
| bandCore | Field value threshold for body/core boundary | Color region sizing |
| markSize | Base mark dimension in pixels | Rendering resolution |
| markJitter | Position displacement range | Mark irregularity |
| redAmt | Secondary noise threshold for accent marks | Accent density |

---

## 10. Relationship to the Species/Breed Architecture

This method maps directly onto the species/breed separation described in the project architecture:

- **Species** = skeleton definition (node graph, segment widths, curve parameters, spike configuration) plus the distance field it produces. The species defines form, not appearance.
- **Breed** = mark rendering function (color palettes, density curves, mark geometry, accent noise). The breed defines appearance, not form.
- **SPECIMEN** = a species configuration + a breed assignment + breed parameters. The tuple is the complete, reproducible description of a single organism.

The distance field serves as the communication layer between species and breed — it is the typed array that breed functions read from to determine where and how to place marks. Additional map channels (normal maps, curvature maps) can be derived from the same skeleton without modifying the breed interface.
