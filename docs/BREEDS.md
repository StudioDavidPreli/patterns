# Breeds catalog

Breeds define the rendering style. Each breed reads form data and draws ink primitives to the canvas. Breeds are linear consumers of remapped luma; they do not contain their own contrast curves.

## Built

### raster_vertical

**Consumes:** silhouette, luma
**Primitive:** vertical line segments with dropouts based on luma

Walks the canvas in vertical columns spaced by `spacing`. Within each column, identifies runs of silhouette pixels. Subdivides each run into segments of length `segmentLen` ± jitter. For each segment, drop probability = luma × coverage. Surviving segments are drawn with weight scaled by base × variation × luma response.

**Parameters:**
- `spacing` — column spacing in pixels (0.8 to 3.0)
- `segmentLen` — segment length before jitter (2 to 20)
- `coverage` — cap on bright-extreme drop (0.30 to 1.00, default 0.85)
- `jitterX` — horizontal column jitter
- `weightBase`, `weightVar` — line weight base and variation
- `lumaWeight` — how much luma scales line weight

**Suited species:** any with continuous luma variation. Faceted forms need coverage < 1.0 to keep lit faces visible.

### stipple

**Consumes:** silhouette, luma
**Primitive:** small dots placed by per-pixel dart throw

For each silhouette pixel, computes local density = density × (1 − luma × coverage). Dart throw against this density determines whether to place a dot. Dot size varies around `dotSizeBase` by `dotSizeVar`.

**Parameters:**
- `density` — base dart-throw rate (0.02 to 0.40)
- `dotSizeBase` — dot diameter (0.6 to 3.0)
- `dotSizeVar` — dot size variation (0 to 0.8)
- `coverage` — cap on bright-extreme density reduction (0.30 to 1.00, default 0.85)
- `jitter` — position jitter

**Suited species:** any. Smooth forms get gradient stipple. Faceted forms get binary regions; coverage prevents lit faces from emptying.

### riso_noise

**Consumes:** silhouette, luma
**Primitive:** four-layer color stipple with offset misregistration

Each layer has its own color, position offset, density multiplier, and luma response. Layer density per pixel = base × densityMult × (1 − luma × lumaResponse). Negative lumaResponse means the layer prefers lit areas (yellow on the front face). Positive lumaResponse means the layer prefers shadow (blue on the dark side). Each layer offsets its dots by misreg × layer.offset, emulating Riso plate misregistration.

**Parameters:**
- `density` — base density (shared across layers)
- `dotSizeBase`, `dotSizeVar`
- `jitter`
- `misreg` — misregistration amount (0 to 4)
- `layers` — array of `{ color, offset, densityMult, lumaResponse }`

**Default layers (SHAPE-71 tuned):**
1. Black, neutral offset, sparse, shadow-loving
2. Yellow, light-loving, dominant on lit faces
3. Green, neutral, mid-tones
4. Blue, shadow-loving, accumulates on dark faces

**Suited species:** any. Survives high-contrast and faceted forms because each layer has its own luma response; at least one layer always wants any given luma value. This is why riso_noise didn't need a COVERAGE parameter.

### halftone

**Consumes:** silhouette, luma
**Primitive:** one circle per grid cell, diameter scales with luma

Walks a canvas-aligned grid stepping by `cellSize`. At each cell center, samples the silhouette and luma; if the center is inside the form, draws one circle at that position with diameter = `cellSize * dotSize * (1 - luma * coverage)`. Lit faces get small dots; shadowed faces get dots that nearly fill their cells. Different formal register from the four particulate breeds: a regular pattern, not noise.

**Parameters:**
- `cellSize` — grid pitch in pixels (3 to 18, default 6.0)
- `dotSize` — max dot diameter as a fraction of cellSize (0.30 to 1.00, default 0.85). Below ~0.95 leaves visible cell gaps even in deep shadow.
- `coverage` — caps how much the lit extreme erases the dot (0.30 to 1.00, default 0.85). Same role as in raster_vertical and stipple.
- `jitter` — optional position offset per cell (0 to 1.5, default 0). At 0 the grid reads as a clean halftone; nonzero values blur the regular pattern toward stipple.

**Suited species:** any. The grid is canvas-aligned, not specimen-aligned, so multiple specimens sharing one canvas share grid alignment by default. Implemented for the pool (2026-06-12): the breed reads `form.originX`/`originY` and phases its grid in pool coordinates, so all specimens read as printed on one screen. Standalone pages leave origin at 0, which reproduces the original walk exactly. If a specimen needs its own grid phase, that would be a per-breed offset parameter; not added yet (open question, judged from pool renders). dot_matrix follows the same convention.

**Notes:** Halftone is the project's first regular-pattern breed. Coverage is needed for the same reason as on raster and stipple: faceted forms (caps, arch faces) have near-uniform luma per face and would otherwise empty out under high luma. Built into cylinder v2 first; propagation to torus, arch, and filament is queued.

### color_blocking

**Consumes:** silhouette, luma, normals (REQUIRED)
**Primitive:** dots colored by face direction

For each silhouette pixel, looks up the object-space normal. Walks the regions list; finds the first region whose direction dotted with the normal exceeds the threshold. Pixels matching no region get the default color. Density is mostly flat; SHADING controls how much luma still modulates density and alpha within color blocks.

**Parameters:**
- `density` — dart-throw rate (0.05 to 0.60)
- `dotSizeBase`, `dotSizeVar`
- `jitter`
- `shading` — 0 (flat color) to 1 (full luma response). Default 0.30.
- `defaultColor` — [r, g, b, a] for pixels matching no region
- `regions` — array of `{ dirX, dirY, dirZ, threshold, color }`. First match wins.

**Limitations:**
- A normal alone cannot distinguish inner from outer walls of the same direction. The arch's inner left wall and outer right wall both have +X normals; they get the same color. A face-id pass or screen-space position would be needed to separate them.
- Curved surfaces produce gradient transitions where normals change continuously. This is by design but may not always be desired.
- Requires normals. Species without normals fall back to default color for every pixel.

**Suited species:** any species with normals. All 2D-native species synthesize normals: filament, bolt, bristle, synapse use the tube model; blob and disc use the dome model.

### outline

**Consumes:** silhouette; optionally normals (for face-edge mode)
**Primitive:** circles at boundary pixels detected by 4-neighbor check, and/or at face-edge pixels detected by normal discontinuity

Three modes. **Boundary** (default): for each silhouette pixel, checks whether any of the four cardinal neighbors is outside the silhouette. **Faces**: for each silhouette pixel, checks whether any neighbor's object-space normal differs by more than a threshold (dot product < threshold). **Both**: draws boundary and face edges together.

Face-edge mode requires normals and only produces useful results on hard-edge 3D species (disc, cylinder, arch) where adjacent faces have distinct flat normals. On smooth-surface species (torus, filament, bolt, bristle, synapse, blob) the normals change continuously and face-edge mode draws nothing or noise. Boundary mode ignores luma and normals entirely.

**Parameters:**
- `weight` — circle diameter at each edge pixel (0.5 to 5.0, default 1.5)
- `jitter` — random position offset per circle (0 to 1.5, default 0.00). At 0 the outline is clean pixel-traced; nonzero values produce a hand-drawn wobble.
- `mode` — `"boundary"` (default), `"faces"`, or `"both"`. Only present on disc, cylinder, arch.
- `threshold` — normal dot-product threshold for face-edge detection (0.00 to 0.95, default 0.70). Lower = less sensitive (only catches near-perpendicular face junctions). Higher = more sensitive (catches gentler transitions). Only used when mode is `"faces"` or `"both"`.

**Suited species:** boundary mode works on all species. Face-edge mode is wired on disc, cylinder, arch only. The three hard-edge species use `toNonIndexed()` + `computeVertexNormals()` to produce flat per-face normals, which is what makes the face edges detectable as sharp discontinuities.

### color_cluster

**Consumes:** silhouette, luma (optional via lumaResponse), normals (not used)
**Primitive:** scattered colored shapes (circles, quads, triangles) with HSL harmony palettes

Places `count` marks across the silhouette. Each mark's shape is chosen by weighted random selection from three populations (circlePct, quadPct, trianglePct); all three at nonzero produces mixed output. Mark size varies around `size` by `sizeVar`. Colors generated from a base HSL color using one of six harmony modes (complementary, analogous, triadic, split-complementary, tetradic, monochromatic), with `darkMix` blending toward a darkened variant.

Perlin noise modulates local density: at each candidate position, `p.noise(x * noiseFreq, y * noiseFreq)` is compared against a threshold derived from `noiseStrength`. Higher noiseStrength creates visible density zones (clumps and voids).

Scatter places marks outside the silhouette boundary using a chamfer distance field. `buildDistanceField()` computes a two-pass chamfer distance transform from the silhouette edge. Outside marks are placed with quadratic falloff probability `(1 - d/scatter)^2`, so density tapers smoothly away from the form.

`lumaResponse` optionally modulates density inside the silhouette: positive values thin marks in lit areas, negative values thin marks in shadow.

**Parameters:**
- `count` — number of marks (50 to 2000, default 300)
- `size` — mark diameter (1 to 30, default 8)
- `sizeVar` — size variation as fraction (0 to 1, default 0.50)
- `circlePct` — circle population weight (0 to 100, default 100)
- `quadPct` — quad population weight (0 to 100, default 0)
- `trianglePct` — triangle population weight (0 to 100, default 0)
- `rotation` — max random rotation per mark in degrees (0 to 360, default 0)
- `opacity` — mark alpha (0 to 1, default 1.0)
- `baseColor` — HSL array [h, s, l] (default [0, 60, 50])
- `harmony` — palette mode: complementary, analogous, triadic, split-complementary, tetradic, monochromatic
- `darkMix` — blend toward darkened variant (0 to 1, default 0.0)
- `lumaResponse` — luma density modulation (-1 to 1, default 0.0)
- `noiseFreq` — Perlin noise frequency (0.001 to 0.1, default 0.02)
- `noiseStrength` — noise density modulation strength (0 to 1, default 0.0)
- `scatter` — max distance outside silhouette in pixels (0 to 150, default 0)

**Key functions:**
- `pickShape(p, sp)` — weighted random selection from three shape populations using cumulative probability
- `buildDistanceField(silhouette, W, H)` — two-pass chamfer distance transform for scatter placement
- `drawColorClusterFromForm(p, s, sp, form)` — main draw function

**Suited species:** any. Does not require normals. Scatter extends marks beyond the silhouette, allowing more visual mileage from simple primitives without requiring new geometries.

### dot_matrix

**Consumes:** silhouette
**Primitive:** equal-size marks (circle or rectangle) on a canvas-aligned grid, gated by Perlin noise density

Walks a canvas-aligned grid stepping by `cellSize`. At each cell center, checks the silhouette; if inside, optionally checks Perlin noise against `noiseStrength` to cull marks in low-noise zones, creating organic clump/void patterns. Surviving cells get one mark at the cell center (plus optional jitter). Two glyph modes: dot (circle) and block (rect), selectable via radio. At `noiseStrength: 0` every grid cell inside the silhouette gets a mark (uniform matrix).

Does not consume luma or normals. Uses `inkColor`.

**Parameters:**
- `cellSize` — grid pitch in pixels (3 to 18, default 5)
- `markSize` — mark diameter as fraction of cellSize (0.20 to 1.00, default 0.70)
- `glyph` — `"dot"` (circle) or `"block"` (rect), default `"dot"`
- `noiseFreq` — Perlin noise frequency (0.002 to 0.10, default 0.015)
- `noiseStrength` — noise gate threshold (0 to 1, default 0.60). Marks where `p.noise(cx * noiseFreq, cy * noiseFreq)` falls below this value are culled. Higher = more voids.
- `jitter` — random position offset per mark (0 to 1.5, default 0.00)

**Suited species:** any. Silhouette-only consumer; works on all species regardless of normals or luma availability.

## Planned (later)

From the original taxonomy of 13 breeds in the SHAPE source reference set. Order is rough.

### solid_fill
Flat color fill, no texture. The simplest possible breed. Useful for compositions where some specimens should read as solid blocks.

### mosaic
Tessellated regions. Form broken into polygonal cells, each filled with a single color sampled from the underlying luma. Pixelation-adjacent.

### extrude
Hatch lines suggesting depth. Lines drawn perpendicular to silhouette boundary, length scaled by some depth approximation. Could use luma as a proxy for depth, or actual depth from a future depth pass.

### stamp
A single mark repeated across the form. The mark is a sub-template (could itself be a tiny specimen). Tests recursive composition.

### edge_particles
Dots concentrated at silhouette edges. Density falls off quickly inside the form. Reads as a glowing or vibrating boundary.

### disintegrate
Particles scattered outward from silhouette. Like the form is breaking apart. Uses normals (if available) to direct the scatter.

### dashed
Short stroke segments scattered across the form. Unlike raster_vertical (continuous column runs), dashed places isolated short marks at various angles. Appears in SHAPE-28, 72, 91 in the reference set. Could share infrastructure with raster_vertical (segment length, weight) but the marks are independent, not column-bound.

### concentric_repeat
The form repeated at offset scales, drawn over itself. Different from concentric the species, which is a fundamentally circular form.

## Cross-cutting rendering modes

These are not breeds. They are modifications that apply across breeds. Identified from the reference set review (2026-05-13).

### Negative polarity

Roughly 25% of the 144 reference shapes render the background instead of the form. The form is empty/white; the surround is filled with marks or solid color. This inverts the relationship between silhouette and breed: the breed draws into `1 - silhouette` instead of `silhouette`.

Background fill types in negative-polarity shapes:
- Solid black (most common)
- Dense stipple/noise field
- Halftone grid

Implementation: a `polarity` flag on the specimen tuple. If `"negative"`, `applyPolarity()` inverts the silhouette mask after the form pass and before the tone pass. Pixels that were form become empty; pixels that were background become silhouette with luma set to `fillLuma`. Normals are zeroed for inverted pixels (the surround has no 3D surface direction).

**Parameters:**
- `polarity` — `"positive"` (default) or `"negative"`. Positive is normal rendering. Negative inverts the silhouette.
- `fillLuma` — luma value assigned to the inverted surround (0.00 to 1.00, default 0.00). At 0.00 the surround is fully dark (dense ink). At 1.00 the surround is fully lit (no ink). Controls how heavy the background field reads.

**Pipeline position:** Form pass → Polarity pass → Tone pass → Breed pass. The polarity pass sits between form and tone. The tone pass still applies to the (now inverted) luma field, so black point, white point, and gamma affect the surround density.

**Status:** Implemented on all nine species. Tested on disc with halftone, stipple, outline, riso_noise, annulus. Propagated to torus, arch, cylinder, filament, bolt, bristle, synapse, blob.

### Ink color

The built monochrome breeds (raster_vertical, stipple, halftone, outline) hardcode ink as `fill(14, 13, 11, alpha)`. The reference set shows colored variants of all four: colored stipple (SHAPE-07, 18, 93, 104), colored outline, colored halftone. riso_noise already handles multicolor via its layer system. color_blocking handles it via region colors.

Specimen-level `inkColor: [r, g, b]` parameter. Default `[14, 13, 11]` (near-black). The four monochrome breed draw functions read `s.inkColor` instead of hardcoding the color. An INK panel with a color picker sits between POLARITY and BREED in the control panel. The riso_noise layer system remains the right answer for multi-color-within-one-breed rendering.

**Status:** Implemented on all nine species (2026-05-17). `inkColor` appears in the specimen view JSON export and resets cleanly.

## Authoring notes

A breed function has the signature:

```javascript
function drawBreedFromForm(p, s, sp, form) { ... }
```

Where `p` is the p5.js instance, `s` is the specimen, `sp` is the breed-specific parameter object, and `form` contains silhouette, luma, normals, W, H.

Walk the silhouette and skip pixels with `silhouette[idx] !== 1`. Apply tone via `applyTone(luma[idx], s.tone)` to get remapped luma. Decide what ink to draw based on remapped luma and any other inputs.

Do not implement contrast curves inside the breed. The tone pass is the global contrast control.

If the breed is monochrome and operates on luma alone, consider adding a COVERAGE parameter for faceted-form support. The pattern: `dropP = luma * coverage` for breeds that drop ink at high luma; `density = base * (1 - luma * coverage)` for breeds that reduce density.

If the breed uses normals, document the case where normals are absent. Either fall back to a default state or skip the breed for species without normals (with a clear UI signal).

## Combination rules

Breeds compose, in principle: you could run stipple THEN riso_noise on top, or color_blocking THEN raster on top. The current architecture renders one breed at a time, but the form data is reusable across multiple breed calls. A future "combined" breed type could orchestrate multiple sub-breeds.

This is theoretical for now. Build single breeds first; combination is a future architectural extension.
