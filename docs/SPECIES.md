# Species catalog

Species define the form. Each species produces silhouette + luma + (optionally) normals. The implementation may use three.js, p5.js, or anything else that fills those typed arrays.

## Built

### torus

**Reference:** SHAPE-02 (digitalFantasy reference set)
**Status:** built · `species/specimen_shape02_v10.html`
**Type:** 3D primitive
**Implementation:** `THREE.TorusGeometry(R, r, segR, segT)`

**Parameters:**
- `R` — major radius (ring radius)
- `r` — minor radius (tube thickness)
- `segR` — radial segments (smoothness around the ring)
- `segT` — tubular segments (smoothness around the tube)
- `rotation` — [x, y, z] degrees

**Notes:** The original SHAPE-02. Smooth surface gives gradient luma across the form. Suits all four breeds. Default rotation [90, 0, 0] lays the torus flat so you see the donut hole from above.

This species was the reference implementation for everything else. The form/tone/breed pipeline was designed and tested here before the arch came along. Tuning happened across nine versions; v9 is the canonical.

### bolt

**Reference:** SHAPE-23 (clean iconic lightning glyph). v1 and v2 attempted to also cover SHAPE-141 by parameter dialing, but the two shapes have different essential characters and the unification compromised both. v3 narrows bolt to SHAPE-23 only; SHAPE-141 has moved to its own species (bristle).
**Status:** built · `species/specimen_bolt_v3.html` (v1 + v2 retained for reference)
**Type:** 2D-native (no three.js)
**Implementation:** Polyline from start to end where interior vertices alternate perpendicular offset along the start→end axis. Fully determined by SEGMENTS, ZIGZAG (offset magnitude), ORIENTATION, and LENGTH. SEGMENTS=3 gives the canonical 4-vertex Z-glyph. The form pass is the same as filament v2/v3 (per-pixel min-distance stamp, synthesized tube normals, Lambert luma).

**Parameters (v3):**
- `length` — end-to-end span in canvas pixels (200 to 540, default 380)
- `segments` — number of segments (2 to 12, default 3). 2 = single chevron. 3 = canonical Z-glyph (SHAPE-23). Higher reads as a mechanical sawtooth, not as SHAPE-141 (which is now bristle).
- `zigzag` — perpendicular offset magnitude in pixels (0 to 200, default 90). Built-in 30% random variation per vertex.
- `orientation` — rotates the start→end vector around canvas centre, in degrees (-180 to +180, default 120). 120° puts the start at upper right and end at lower left, the natural SHAPE-23 angle.
- `thickness` — base line weight in pixels (2 to 30, default 14.0)
- `thicknessVar` — fractional thickness variation per vertex (0 to 0.8, default 0.10)
- `taper` — linear thickness reduction from start to end (0 to 1, default 0.65). Suits SHAPE-23's tapered glyph.
- `seed` — controls the path's random offset variation; independent of breed seed

**Removed in v3:** `maxAngle`, `bias` (v2's wander+bias compromise replaced with explicit alternating-perpendicular zigzag).

**Differences from filament:**
- Path is explicit (deterministic alternating perpendicular offsets), not a noise-driven curve. SHAPE-23 is a graphic glyph, not an organic form.
- Sharp corners produce small circle bulges at each vertex from the chain-of-circles stamp. For SHAPE-23's iconic feel this reads correctly as deliberate node-marks; if a flat-mitred polyline render is needed, the form pass would need segment-distance projection (deferred).

**Notes:** Inherits filament's normals + Lambert convention, so a pool with mixed specimens shares one global light direction. Four breeds wired (raster_vertical, stipple, halftone, riso_noise); color_blocking deferred for the same reason as on filament. v1 and v2 are retained as reference for the unification approach that didn't work; the SHAPE-141 character that the wander+bias generator gestured at lives in the bristle species, with a dedicated spine + perpendicular-bristle generator.

### fused_bristle

**Reference:** SHAPE-141 chambered variant (per user references shape141expo2.png and shape141expo3.png). Multi-chamber body with explicit primitives: each chamber is a Catmull-Rom perturbed body, and adjacent chambers are connected by tubes.
**Status:** built · `species/specimen_fused_bristle_v3.html` (v1 + v2 retained for reference)
**Type:** 2D-native (no three.js)
**Implementation:** Each chamber is a closed Catmull-Rom curve through perturbed control points around a lobe centre (same model as bristle v3). Adjacent chambers are connected by 2-point neck tubes trimmed to chamber edges (each tube starts/ends at distance = chamber radius from each lobe centre, since v3); the form pass interpolates many mid-stamps between endpoints, producing a parallel-walled tube spanning only the visible neck gap. When chambers overlap or are within 2px, the tube is skipped entirely.

Spikes attach per-chamber. Each chamber gets its share of the total spike count distributed evenly around its perimeter, with angular wedges (±30°) facing every other chamber excluded (since v3; v2 only blocked adjacent neighbours, allowing spikes to fly into non-adjacent chambers when lobeVar was high). Outward direction = `(attach − lobe.centre)` normalized; stable everywhere on the chamber.

**Parameters (body):**
- `bodyRadius` — base radius of each chamber in pixels (10 to 120, default 20 since v3)
- `bodyVertices` — Catmull-Rom control point count per chamber (4 to 16, default 8)
- `bodyDeform` — per-control-point radius perturbation per chamber (0 to 0.8, default 0.20). Each chamber consumes its own seed so chambers are independently irregular.
- `bodyThickness` — body line weight in pixels (1 to 24, default 3.5)
- `lobes` — number of chambers (1 to 8, default 6 since v3). Lobes = 1 reproduces a single chamber.
- `lobeSpread` — total length of the guide spine in pixels (0 to 480, default 360 since v3). Controls inter-chamber distance.
- `lobeVar` — perpendicular offset variance per lobe in pixels (0 to 120, default 0). Higher values let the chamber chain wander away from the horizontal guide.

**Parameters (spikes):** identical to bristle v3 (count, segments, angle, length, lenVar, thick, taper). See bristle entry.

**Notes (v3 fixes):** v2 had three flaws visible at extreme lobeVar: tubes burrowed through chamber interiors creating a wandering-polyline-through-chambers effect; spikes could fly into non-adjacent chambers (wedge only blocked immediate neighbours); defaults of three large chambers didn't match the reference's more-bumps-of-smaller-diameter silhouette. v3 trims tubes to chamber edges, blocks the angular direction of every other chamber (not just adjacent), and retunes defaults. v1 (metaball) and v2 (explicit primitives, full-length tubes, neighbour-only wedge) retained for reference.

bristle v3 (the single-body Catmull-Rom species) remains the canonical for un-chambered SHAPE-141. fused_bristle is the chambered variant.

### bristle

**Reference:** SHAPE-141 (digitalFantasy reference set). Per the user's reference decomposition image: a closed irregular body (a "collapsed circle") with multi-segment spikes radiating outward from each control point. Reads as caterpillar / polychaete worm / leafy seadragon.
**Status:** built · `species/specimen_bristle_v3.html` (v1 + v2 retained for reference)
**Type:** 2D-native (no three.js)
**Implementation:** Closed Catmull-Rom body + radial spikes.

The body is a closed Catmull-Rom spline through `bodyVertices` control points placed evenly around the canvas centroid at angles `i * 2π / N`, each with radius perturbed by `bodyDeform * baseRadius` via the seeded RNG. Each segment of the spline is sampled at 12 subdivisions for a smooth tube. The first sampled point is duplicated at the end of the polyline so the form-pass mid-stamp loop bridges the seam between last and first vertex.

Spikes attach at evenly-spaced parameter positions along the body curve, independent of body vertex count (so spikes can outnumber or undernumber the body's control points). Each spike walks `spikeSegments` steps in the centroid→attach direction, with random per-joint angle deviation in `[-spikeAngle, +spikeAngle]`.

**Parameters (body):**
- `bodyRadius` — base radius of the body in pixels (40 to 180, default 90)
- `bodyAspect` — x-axis stretch factor (0 to 3.0, default 1.00, since v3). 1.0 = circle. > 1.0 = wider than tall (longer than tall in screen terms). < 1.0 = narrower than tall. y stays anchored to bodyRadius so the slider reads as "stretch x." At exactly 0, all control points collapse to x = cx and the body becomes a degenerate vertical line; spike directions become undefined for the vertices at angles 0 and π since they sit on top of the centroid.
- `bodyVertices` — number of Catmull-Rom control points around the centroid (4 to 16, default 10)
- `bodyDeform` — radial perturbation amount (0 to 0.8, default 0.30). 0 = perfect circle. 0.5 = quite irregular blob.
- `bodyThickness` — body line weight in pixels (1 to 24, default 3.5; range extended in v3)

**Parameters (spikes):**
- `spikeCount` — number of spikes (0 to 32, default 10). Distributed at evenly-spaced parameter positions along the body curve, independent of body vertex count.
- `spikeSegments` — number of segments per spike (1 to 5, default 2). 1 = straight needle. 2-3 = visible kink at each joint, matches the reference.
- `spikeAngle` — maximum angle deviation per joint, in degrees (0 to 60, default 25)
- `spikeLength` — base spike length in pixels (10 to 100, default 35)
- `spikeLenVar` — fractional random length variation per spike (0 to 0.8, default 0.40)
- `spikeThick` — spike root thickness in pixels (0.5 to 12, default 1.75; range extended in v3, default bumped to preserve 2:1 body/spike ratio at default)
- `spikeTaper` — linear thickness reduction from root to tip (0 to 1, default 0.85)

**Notes:** All randomness is seeded so saved tuples round-trip identically; the species feeds the eventual population-level seed-driven randomization. Inherits filament's tube-normal + Lambert model, so pools share one global light. Four breeds wired (raster_vertical, stipple, halftone, riso_noise); color_blocking deferred alongside filament's and bolt's. v1 (horizontal-spine model) retained as reference for the architectural revision.

### filament

**Reference:** SHAPE-19 (digitalFantasy reference set, serpentine wandering line). SHAPE-31 (chaotic scribble) is a related candidate; treat as the high-`noiseAmount` end of the same parameter space if it matters.
**Status:** built · `species/specimen_filament_v3.html` (v1 + v2 retained for reference)
**Type:** 2D-native (no three.js)
**Implementation:** Polyline generated from seeded value noise. Per-pixel distance to the nearest curve point produces silhouette. Synthesized 3D normals (tube cross-section) drive a Lambert luma calculation against the same light convention as the 3D species. Adjacent points are connected by interpolated mid-stamps so gaps between sparse samples don't leave holes.

**Parameters:**
- `length` — total span in canvas pixels (200 to 540)
- `segments` — number of points along the curve (24 to 320)
- `noiseAmount` — vertical deviation from the base midline, in pixels (0 to 180)
- `noiseScale` — frequency of the wander (0.5 to 8.0)
- `thickness` — base stroke thickness in pixels (4 to 60)
- `thicknessVar` — fractional variation along the path (0 to 0.8)
- `seed` — controls curve shape; independent of breed seed

**Light parameters (since v2):** same shape as the 3D species — `direction` [x, y, z], `keyIntensity`, `ambient`. Defaults match torus v9 so a pool composition can apply one global light to mixed species.

**Synthesized normals (v2):** at each curve point we compute a unit perpendicular to the local tangent in screen coordinates. For a pixel near the point, the signed cross-section position `d ∈ [-1, +1]` is the projection of the pixel offset onto that perpendicular, normalized by halfThick. The synthesized 3D normal is then:

```
n.x = perpX_screen * d
n.y = -perpY_screen * d         // screen y → world y is flipped
n.z = sqrt(1 - d²)
```

This treats each pixel as a point on the surface of a horizontal cylinder. Luma = `clamp(max(0, n · lightDir) * keyIntensity + ambient, 0, 1)`.

**Deviations from the planned spec:**
- `noiseScale` controls the noise input frequency directly (higher = more wiggles per length unit).
- `thickness` and `thicknessVar` use the same value-noise generator at a different offset rather than a separate noise object.

**Notes:** v1 used a purely radial luma (`1 - d²`) with no light direction; it was visually self-consistent but couldn't share lighting with 3D species in a pool composition. v2 fixes that. raster_vertical, stipple, riso_noise all work unchanged because they consume only the typed-array contract.

color_blocking is unblocked at v2 (normals are now populated) but not yet wired into the breed selector here; region defaults need a tuning pass that suits a tube cross-section. Tracked as a v3 task in TRACKER.md.

**Performance:** v2 stamp loop is comparable to v1 (a few extra ops per pixel for the normal + Lambert). Live slider updates remain responsive at default parameters. LIGHT-only changes still trigger a full form pass; if this becomes noticeable, the obvious optimization is to cache silhouette+normals and re-shade only luma on light change.

### cylinder

**Reference:** SHAPE-65 (digitalFantasy reference set)
**Status:** built · `species/specimen_cylinder_v1.html`
**Type:** 3D primitive
**Implementation:** `THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)`. Source-mesh parameters are exposed directly as panel sliders so the species covers cone, frustum, and right-cylinder cases from one file.

**Parameters:**
- `radiusTop`, `radiusBottom` — top and bottom cap radii (0.05 to 1.20). Different values produce a frustum or cone.
- `height` — axial length (0.10 to 3.00)
- `radialSegments` — facets around the circumference (3 to 128). Low values give a polygonal silhouette; high values look smooth.
- `heightSegments` — vertical strips (1 to 32). Visually similar at any value with the current breeds (no displacement); exposed for completeness.
- `openEnded` — toggle. False = caps; true = a tube.
- `rotation` — [x, y, z] degrees

**Notes:** First species that combines a curved gradient face (the side wall) with two flat near-uniform-luma faces (the caps). Tests color_blocking's region split on a clean cap-vs-wall normal divide. Default region defaults: top cap → blue, bottom cap → green, front-facing side wall → red, back-half side wall → yellow (default). The same COVERAGE pattern that the arch needs applies here for the monochrome breeds, since the caps would otherwise empty out under high-luma drop.

The form pass is identical to arch v3: lit pass via `MeshStandardMaterial`, normal pass via the same custom `ShaderMaterial` that emits object-space normals as RGB. With `radiusTop = 0` the geometry collapses into a cone (still has a bottom cap region); with both radii equal it's a regular cylinder.

### arch

**Reference:** SHAPE-71 (digitalFantasy reference set)
**Status:** built · `species/specimen_shape71_v4.html`
**Type:** 3D from 2D outline (ExtrudeGeometry)
**Implementation:** `THREE.Shape` traced as an n-form, optionally with quadratic curves rounding the inner top corners. Extruded along Z.

**Parameters:**
- `width`, `height` — outer bounding box
- `legWidth` — thickness of vertical posts
- `topThick` — thickness of top crossbar
- `archR` — radius of inner top corner curves. 0 = orthogonal n-form. Max ((W − 2·legW)/2) = full Roman arch.
- `depth` — extrusion depth along Z
- `rotation` — [x, y, z] degrees

**Notes:** Faceted form with near-uniform luma per face. Drove the COVERAGE parameter for monochrome breeds (lit faces would otherwise empty out). Drove the normal pass and the color_blocking breed.

The outline is traced CCW from the front. When `archR > 0`, the inner top corners use `quadraticCurveTo`. When `archR > 0` reaches its maximum, the two curves meet in the middle and form a full semicircle.

### synapse

**Reference:** SHAPE-141 (bilateral variant). Spine-driven horizontal body with bilateral spikes. Distinct from bristle (radial spikes from closed body) and fused_bristle (chambered chain).
**Status:** built · `species/specimen_synapse_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** Random-walk spine with decaying amplitude. Body outline traced as direct offset from spine. Bilateral spikes inserted as tip projections along the outline. Single closed Catmull-Rom bezier path filled via offscreen canvas `bezierCurveTo` + `fill()` + alpha readback. Spine-relative cylindrical normals (same tube model as filament/bolt/bristle). Self-intersection defenses: slope limiting, vertical contour offset, same-side angular exclusion, post-hoc crossing repair.

**Parameters:**
- `length` — spine span in pixels
- `segments` — spine point count
- `noiseAmount` — spine vertical deviation
- `noiseScale` — spine wander frequency
- `thickness` — body half-width
- `thicknessVar` — variation along spine
- `spikeCount` — bilateral spike count
- `spikeLength` — spike length
- `spikeLenVar` — spike length variation
- `tension` — Catmull-Rom tension (default 0.55)

**Notes:** Integrates the contour generator from `curveTests/generate.js` into the specimen pipeline. All seven breeds wired. The offscreen canvas bezier fill pattern was new infrastructure; blob reuses it.

### blob

**Reference:** Amorphous closed form. No specific SHAPE-XX reference.
**Status:** built · `species/specimen_blob_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** N control points placed at evenly spaced angles around the canvas centroid, each at a seeded random radius perturbation from the base radius. The control points form a closed Catmull-Rom spline, converted to cubic bezier curves and filled via offscreen canvas `bezierCurveTo` + `fill()` + alpha readback (same pattern as synapse).

Normals use a dome model: for each silhouette pixel, compute the angle from centroid, look up the boundary distance at that angle from a 720-bin boundary distance map, normalize the pixel's distance as `d = dist / maxR`. The normal's in-plane component points radially outward scaled by `d`; the z-component is `sqrt(1 - d²)`. This gives a hemisphere-like falloff that reads as a convex mound. Luma is Lambert against the shared light convention.

**Parameters:**
- `radius` — base radius in pixels (30 to 200, default 85)
- `aspect` — x-axis stretch factor (0.30 to 3.00, default 1.00)
- `vertices` — number of control points (3 to 24, default 10)
- `deform` — radial perturbation fraction (0 to 0.80, default 0.30)
- `tension` — Catmull-Rom tension (0.00 to 1.00, default 0.55)
- `seed` — controls shape; independent of breed seed

**Notes:** Fifth 2D-native species. Tests whether the canvas bezier fill + dome normal model generalizes to a closed massy form. The boundary distance map (720 angular bins) is computed once per form pass and cached. All seven breeds wired. The dome normal model is new; filament/bolt/bristle/synapse all use the tube (cylindrical cross-section) model instead.

### disc

**Reference:** SHAPE-12, 15, 67, 95 (digitalFantasy reference set)
**Status:** built · `species/specimen_disc_v1.html`
**Type:** 3D primitive
**Implementation:** `THREE.Shape` circle with optional inner hole, extruded via `THREE.ExtrudeGeometry`. Two-pass rendering (lit `MeshStandardMaterial` for silhouette + luma, custom `ShaderMaterial` for object-space normals as RGB).

**Parameters:**
- `radius` — outer radius (0.10 to 1.50, default 0.80)
- `innerRadius` — inner hole radius for annulus form (0.00 to 1.40, default 0.00). Clamped to `radius - 0.01`. At 0 the disc is solid; above 0 produces a ring with a hole.
- `depth` — extrusion thickness (0.02 to 0.50, default 0.08). Thin values read as a flat disc; thicker values show visible rim.
- `segments` — curve smoothness (8 to 128, default 64)
- `rotation` — [x, y, z] degrees

**Notes:** Fourth 3D species. The disc is a thin slice of a cylinder, not a dome. The flat top and bottom faces have uniform normals (+Z and -Z in object space); the outer rim and inner rim (if annulus) have radially varying normals. This gives color_blocking clean region separation: top face, bottom face, and rim each get distinct colors. COVERAGE on monochrome breeds prevents the flat lit face from emptying out (same pattern as cylinder caps and arch faces). The inner radius parameter satisfies SHAPE-12 (disc with hole). SHAPE-12 and 15 also show negative polarity rendering (disc as cutout in dark field), which is a cross-cutting feature not yet implemented in any species.

### star

**Reference:** N-pointed polygon. Tests how breeds handle high-curvature silhouette boundaries.
**Status:** built · `species/specimen_star_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** N-pointed star polygon rendered to offscreen canvas. Optional seeded turbulent noise displaces the boundary (value noise with cosine interpolation, periodic around the polygon). Dome normal model (same as blob): radial from centroid, z from normalized distance to 720-bin boundary distance map.

**Parameters:**
- `points` — number of star points (3 to 20, default 5)
- `outerR` — outer radius in pixels (20 to 200, default 120)
- `innerR` — inner radius in pixels (10 to 180, default 50)
- `turbulence` — boundary noise amplitude (0 to 0.60, default 0)
- `turbFreq` — noise frequency (2 to 40, default 8)
- `turbSeed` — independent seed for noise table
- `rotation` — degrees (-180 to 180, default 0)

**Notes:** At turbulence=0, produces clean geometric star (1 subdivision = original vertices). Two seeds: turbSeed (curve shape) and seed (breed). All seven breeds wired.

### block

**Reference:** 3D BoxGeometry. Six clearly distinguishable faces for color_blocking.
**Status:** built · `species/specimen_block_v1.html`
**Type:** 3D primitive
**Implementation:** `THREE.BoxGeometry` with `toNonIndexed()` + `computeVertexNormals()` for flat per-face normals. Two-pass rendering (lit `MeshStandardMaterial` + custom `ShaderMaterial` for object-space normals).

**Parameters:**
- `width`, `height`, `depth` — box dimensions
- `rotation` — [x, y, z] degrees

**Notes:** Fifth 3D species. Six-face color_blocking with distinct colors per face direction (top, front, right, back, left, default). All seven breeds wired with COVERAGE on monochrome breeds.

### basalt

**Reference:** SHAPE-82. Networked cubes.
**Status:** built · `species/specimen_basalt_v1.html`
**Type:** 3D primitive
**Implementation:** Grid of `THREE.BoxGeometry` columns with seeded random heights. Individual boxes are `toNonIndexed()`, then manually merged by concatenating position/normal Float32Arrays into a single `BufferGeometry`. Two-pass rendering.

**Parameters:**
- `colsX`, `colsZ` — grid dimensions (1 to 8)
- `colSize` — column width (0.10 to 0.60)
- `height` — base column height (0.30 to 2.50)
- `heightVar` — height variation (0 to 1.00)
- `gap` — spacing between columns (0 to 0.20)
- `rotation` — [x, y, z] degrees

**Notes:** Sixth 3D species. Two seeds: geomSeed (column heights) and seed (breed). Manual geometry merge avoids BufferGeometryUtils import. Color blocking uses earthy tones. All seven breeds wired.

### pinwheel

**Reference:** SHAPE-117. Irregular spoke-and-hub form.
**Status:** built · `species/specimen_pinwheel_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** Central hub circle + N curved tapered spokes. Each spoke follows a quadratic bezier center line (start at hub edge, control point displaced perpendicular by curl, end at hub + length). Width envelope tapers from base to tip. Spokes filled as polygons from left/right edge sample points. Hub inner radius cuts a center hole via `destination-out` compositing. Dome normal model with 720-bin boundary distance map.

**Parameters:**
- `spokes` — spoke count (2 to 12, default 6)
- `hubR` — hub outer radius (5 to 80, default 35)
- `hubInnerR` — hub inner radius for center hole (0 to 80, default 0)
- `spokeLen` — base spoke length (20 to 180, default 100)
- `spokeW` — base spoke width (3 to 50, default 18)
- `taper` — tip taper (0 to 1, default 0.70)
- `curl` — spoke curvature (-1 to 1, default 0.30)
- `lenVar`, `widthVar` — seeded random variation per spoke
- `rotation` — degrees (-180 to 180, default 0)

**Notes:** Two seeds: geomSeed (spoke variations) and seed (breed). All seven breeds wired. Boundary-only outline (no face mode, 2D-native).

### anemone

**Reference:** SHAPE-05, 09, 58. Irregular cellular/organic marks.
**Status:** built · `species/specimen_anemone_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** N cells placed within a circular spread radius using seeded random positions. Each cell is either organic (Catmull-Rom smoothed random polygon with configurable control points and irregularity) or cubic (randomly rotated rectangle with irregularity affecting aspect ratio). Cells overlap and merge to form an irregular cellular silhouette. Organic/cubic % sliders control the distribution. Dome normal model with 720-bin boundary distance map.

**Parameters:**
- `cells` — cell count (3 to 30, default 12)
- `spread` — placement radius (20 to 200, default 100)
- `cellSize` — base cell radius (8 to 60, default 25)
- `sizeVar` — cell size variation (0 to 0.80, default 0.50)
- `irregularity` — boundary wobble for organic, aspect ratio variation for cubic (0 to 1, default 0.40)
- `cellPoints` — control points per organic cell (3 to 10, default 6)
- `organicPct` — organic cell percentage (0 to 100, default 100)
- `cubicPct` — cubic cell percentage (0 to 100, default 0)
- `rotation` — degrees (-180 to 180, default 0)

**Notes:** Two seeds: geomSeed (cell placement/shapes) and seed (breed). All seven breeds wired. Boundary-only outline (no face mode, 2D-native).

## Skipped

### ring
Skipped (2026-05-18). Redundant with disc species. Disc with `innerRadius > 0` already produces a ring/annulus silhouette. The only difference a 2D-native ring would offer is dome normals instead of flat-face 3D normals.

### radial
Skipped (2026-05-18). Degenerate case of pinwheel (zero hub radius, zero spoke width, no curl). Pinwheel is the more useful species with filled silhouette area for all breeds.

### ~~cluster~~ (dissolved)
Dissolved as a species (2026-05-18). All 17 reference shapes reclassified: the underlying forms are existing species (torus, ring, block, cylinder, synapse) or new species (anemone, agglomerate, basalt, pinwheel). The mark-scattering visual is a breed concern (color cluster, dot matrix).

### agglomerate

**Reference:** SHAPE-25, 80. Irregular spheres clustered together.
**Status:** built · `species/specimen_agglomerate_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** N circles placed within a circular spread radius using seeded random positions and sizes. Each circle drawn to an offscreen canvas, alpha readback for silhouette. Per-sphere dome normals: for each silhouette pixel, find the sphere with the smallest normalized distance (dist / radius), compute dome normal relative to that sphere's center. Lambert shading against shared light.

**Parameters:**
- `spheres` -- sphere count (3 to 40, default 15)
- `spread` -- placement radius (0 to 300, default 120)
- `sphereSize` -- base sphere radius (8 to 120, default 35)
- `sizeVar` -- size variation (0 to 1, default 0.50)
- `rotation` -- degrees (-180 to 180, default 0)

**Notes:** Two seeds: geomSeed (sphere placement/sizes) and seed (breed). Per-sphere dome normals are distinct from anemone's single-centroid dome: each sphere lights independently, so overlapping spheres show distinct shading. All seven breeds wired.

### concentric

**Reference:** Nested rings. No specific SHAPE-XX.
**Status:** built · `species/specimen_concentric_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** N ring bands generated outside-in with configurable width and gap. Each ring drawn as an annulus (ellipse pair: outer CW, inner CCW) to an offscreen canvas. Tilt control foreshortens circles into ellipses (2.5D projection). Per-ring tube normals: torus cross-section model where `t = (dist - innerR) / bandWidth` maps across the band, `angle = (t - 0.5) * PI`, radial component = `sin(angle)`, face-on component = `cos(angle)`. Normals transformed through tilt rotation matrix to screen space. Ring offset control gives each ring a seeded random tilt axis deviation for gyroscopic/armillary forms.

**Parameters:**
- `rings` -- ring count (1 to 10, default 4)
- `outerRadius` -- outer edge of outermost ring (50 to 250, default 180)
- `ringWidth` -- width of each ring band (5 to 60, default 22)
- `gap` -- space between adjacent rings (0 to 40, default 12)
- `tilt` -- viewing angle of ring plane (0 to 75, default 30). 0 = top-down circles, higher = ellipses
- `rotation` -- tilt axis orientation (-180 to 180, default 0). Visible when tilt > 0
- `ringOffset` -- per-ring tilt axis deviation (0 to 90, default 0). Seeded by geomSeed. 0 = all rings share one axis. Higher values = each ring on its own axis (gyroscopic)

**Normal model:** Per-ring tube cross-section. Each ring is treated as a torus viewed from above (or at an angle when tilted). The tube normal varies across the band width: face-on at the center strip, radially outward/inward at the edges. With tilt, the normals are rotated through the ring plane's basis vectors (tilt axis e1, foreshortened perpendicular e2, plane normal). Each ring can have its own tilt axis when ring offset > 0.

**Notes:** Two seeds: geomSeed (ring axis offsets) and seed (breed). At ring offset 0, geomSeed has no effect (geometry is deterministic). All seven breeds wired. Distinct from disc species: disc is 3D extruded with flat-face normals, concentric is 2D-native with tube normals and per-ring axis control.

### eye

**Reference:** Anatomical eye. No specific SHAPE-XX.
**Status:** built · `species/specimen_eye_v1.html`
**Type:** 2D-native (no three.js)
**Implementation:** Almond silhouette from two quadratic bezier curves (upper lid, lower lid at 65% of upper height) meeting at corner points. Rotation via canvas transform. Two-zone normal/luma model: sclera (shallow dome from boundary distance map, 720-bin radial sweep, 0.6 scaling factor), iris (steep dome from iris center, configurable bulge). Pupil is negative space (excluded from silhouette). Iris/pupil center offset by gaze controls.

**Parameters:**
- `width` -- eye width corner to corner (100 to 400, default 260)
- `opening` -- lid separation as fraction of half-width (0.10 to 0.80, default 0.55)
- `irisR` -- iris radius (10 to 120, default 55)
- `pupilR` -- pupil radius (3 to 60, default 22)
- `gazeX` -- horizontal iris offset (-80 to 80, default 0)
- `gazeY` -- vertical iris offset (-40 to 40, default 0)
- `bulge` -- iris dome steepness (0.2 to 2.5, default 1.40)
- `rotation` -- eye rotation in degrees (-180 to 180, default 0)

**Normal model:** Two-zone with negative space. Sclera uses boundary distance (same 720-bin radial sweep as blob) with a 0.6 scaling factor for shallow curvature. Iris uses a dome from the iris center with distance scaled by bulge for configurable steepness, luma darkened to 55%. Pupil is excluded from the silhouette entirely (negative space), so no breed draws marks there. Zone boundaries are hard: pupilR and irisR circles centered at (gazeX, gazeY) relative to eye center.

**Notes:** Two seeds: geomSeed (unused, geometry is deterministic) and seed (breed). Gaze moves the iris/pupil within the sclera. Rotation rotates the entire almond shape. All seven breeds wired.

## Planned (later)

(none remaining)

## Authoring notes

When adding a species, the form pass must produce silhouette and luma at minimum. Normals are optional. If normals are absent, the color_blocking breed will fall back to the default color region for all pixels (no face awareness).

For 3D species, follow the arch's pattern: build the geometry from parameters, add to scene, render twice (lit + normals), read back into typed arrays.

For 2D-native species, draw directly into a p5.js graphics buffer. Walk the buffer to fill the silhouette mask and luma field. The mechanics are different but the output structure is identical.

The species file should be self-contained. Test rendering through every existing breed before declaring it done. If a breed produces a degenerate result, that's diagnostic information about the species, not necessarily a problem with the species; capture it in TRACKER.md and move on.

## Naming convention

Test files are named `specimen_<species>_v<n>.html`. The species name is lowercase. Version increments per saved iteration. The original SHAPE-XX numbering from the digitalFantasy reference sheet is preserved in older filenames for continuity (SHAPE-02 = torus, SHAPE-71 = arch). Newer species files use the species name directly (`specimen_filament_v1.html`, `specimen_cylinder_v1.html`, `specimen_bolt_v1.html`). The SHAPE-XX number for each species is now recorded in the **Reference** line at the top of its entry rather than in the filename.
