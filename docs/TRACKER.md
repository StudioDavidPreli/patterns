# Tracker

Snapshot of current state. Updated after meaningful changes. If this file conflicts with the code, the code wins.

Last updated: 2026-05-18. **Color cluster breed built on all eleven species. Sidebar layout on all species.** Eleven species, seven breeds.

Note on locations: specimen test files live under `species/`, not the repo root as some prose in README.md and CLAUDE.md still says. The discrepancy is documentation lag, not a layout decision pending. Treat `species/` as authoritative.

## Species

| Species | Status | Latest file | Type | Notes |
|---|---|---|---|---|
| torus | built | species/specimen_torus_v10.html | 3D primitive | All seven breeds. Smooth luma. Reference implementation. SHAPE-02. |
| arch | built | species/specimen_arch_v4.html | 3D extruded outline | All seven breeds. Faceted. Drove COVERAGE and normals. SHAPE-71. |
| cylinder | built | species/specimen_cylinder_v2.html | 3D primitive | All seven breeds. Curved side + flat caps. SHAPE panel exposes source-mesh params directly. Maps to SHAPE-65 in the digitalFantasy reference set; not on the curated 12-species planned list in SPECIES.md but present in the broader 144-shape source. |
| filament | built | species/specimen_filament_v3.html | 2D-native | All seven breeds. Synthesized tube normals + Lambert luma matching 3D species. SHAPE-19 (best guess; SHAPE-31 also possible). |
| bolt | built | species/specimen_bolt_v3.html | 2D-native | All seven breeds. SHAPE-23 only (clean iconic lightning glyph). Explicit alternating-perpendicular zigzag generator. |
| bristle | built | species/specimen_bristle_v3.html | 2D-native | All seven breeds. SHAPE-141 single-lobe. Closed Catmull-Rom body + radial multi-segment spikes. 12 SHAPE controls. Considered complete; chambered variant lives in fused_bristle. |
| synapse | built | species/specimen_synapse_v1.html | 2D-native | All seven breeds. Spine-driven horizontal body with bilateral spikes. Catmull-Rom tension 0.55, offscreen canvas bezier fill for silhouette, spine-relative cylindrical normals. 10 SHAPE controls. |
| fused_bristle | abandoned | species/specimen_fused_bristle_v3.html | 2D-native | All seven breeds wired, sidebar layout. Three architectures attempted, none lands as SHAPE-141. v1 metaball, v2 explicit primitives, v3 trimmed tubes + global wedge. Superseded by contour generator approach. |
| dendrite | abandoned | species/specimen_dendrite_v1.html | 2D-native | All seven breeds wired, sidebar layout. Skeleton distance field. Spine shape invisible under branch mass. Does not produce forms in the spline.svg family. Do not revisit. See `docs/SESSION_BRIEF_2026-05-10.md`. |
| contour (SHAPE-141) | superseded by synapse | proterozoic/curveTests/generate.js | SVG generator | Direct outline construction. Integrated into specimen pipeline as synapse species. See `docs/SESSION_BRIEF_2026-05-11b.md`. |
| blob | built | species/specimen_blob_v1.html | 2D-native | All seven breeds. Amorphous closed silhouette from noise-perturbed circle. Catmull-Rom bezier fill, dome normal model. |
| disc | built | species/specimen_disc_v1.html | 3D primitive | SHAPE-12, 15, 67, 95. Thin extruded circle via THREE.Shape + ExtrudeGeometry. Inner radius (annulus), rotation, depth controls. Two-pass rendering (lit + object-space normals). All seven breeds wired with COVERAGE on monochrome breeds. |
| cluster | dissolved | — | — | Dissolved as species (2026-05-18). All 17 reference shapes reclassified to existing or new species. "Cluster" is a breed (color cluster). |
| anemone | planned | — | 2D-native | SHAPE-05, 09, 58. Identified during cluster reclassification. |
| agglomerate | planned | — | 2D-native | SHAPE-25, 80. Irregular clustered spheres. |
| basalt | planned | — | unknown | SHAPE-82. Networked cubes. |
| pinwheel | planned | — | 2D-native | SHAPE-117. Irregular spoke-and-hub. |
| ring | planned | — | 2D-native | Annulus. Pairs with concentric. |
| star | planned | — | 2D-native | Polygon. |
| radial | planned | — | 2D-native | Lines from center. |
| concentric | planned | — | 2D-native | Nested rings. |
| block | planned | — | 3D primitive | Trivial after arch. |
| eye | planned | — | hybrid | Lower priority. |

## Breeds

| Breed | Status | Consumes | Notes |
|---|---|---|---|
| raster_vertical | built | silhouette, luma | Has COVERAGE. Default 0.85. |
| stipple | built | silhouette, luma | Has COVERAGE. Default 0.85. |
| halftone | built (all species) | silhouette, luma | Regular grid, dot diameter from luma. Has COVERAGE. Default cell 6, dotSize 0.85. Canvas-aligned grid (not specimen-aligned) — shared by default if multiple specimens later share a canvas. |
| riso_noise | built | silhouette, luma | Four layers, per-layer luma response. No COVERAGE needed. |
| color_blocking | built (all species) | silhouette, luma, normals | Region-based. Three regions plus default. All seven species have normals and support it. |
| outline | built (all species) | silhouette; normals (face mode) | Three modes: boundary (default, all species), faces (normal discontinuity, hard-edge species only), both. Threshold param controls face-edge sensitivity. Face mode wired on disc, cylinder, arch. |
| color_cluster | built (all species) | silhouette, luma (optional) | HSL harmony palettes, shape mix (circle/quad/triangle), Perlin noise density, chamfer distance scatter. 12 reference shapes. |
| dot_matrix | planned | silhouette | Equal-size marks (dot or block glyph), noise-driven or grid placement. 5 reference shapes. |
| mycelium | planned | silhouette | Network/line-based connections. SHAPE-77. |
| blues | planned | silhouette, luma, normals | Light/shadow renderer with static noise negative space in blue region. SHAPE-82. |
| solid_fill | planned | silhouette | — |
| mosaic | planned | silhouette, luma | — |
| edge_particles | planned | silhouette | — |
| disintegrate | planned | silhouette, normals | — |
| concentric_repeat | planned | silhouette | — |
| stamp | planned | silhouette | Recursive; uses a sub-specimen as the stamp. |
| dashed | planned | silhouette, luma | Short isolated stroke segments scattered across the form. Ref: SHAPE-28, 72, 91. |
| extrude | planned | silhouette, normals or depth | — |

## Now

**Eleven species, seven breeds. Negative polarity on all species. Sidebar layout on all species.** Reference set review completed 2026-05-13.

Adjacent open work, ready to pick up independently:
- ~~**Ink color parameter**~~: Done (2026-05-17). Specimen-level `inkColor: [r, g, b]` with color picker UI. All nine built species.
- ~~**Color cluster breed**~~: Done (2026-05-18). HSL harmony palettes, shape mix, Perlin noise density, chamfer distance scatter. All eleven species.
- **New species** from the planned list (ring, star, radial, concentric, block, anemone, agglomerate, basalt, pinwheel).
- **New breeds**: dot matrix (5 ref shapes), mycelium, blues.

## Soon

- ~~**Build blob.**~~ Done (2026-05-12).
- ~~**Decide global vs per-specimen lighting for the pool.**~~ Resolved (2026-05-13). Global lighting. The pool owns the light, specimens are pure consumers. No per-specimen override. All nine species already read from `SPECIMEN.light` with the same shape. The pool composition layer writes `direction`, `keyIntensity`, `ambient` into each specimen's tuple before rendering.
- ~~**Finish disc.**~~ Done (2026-05-13). Rewritten as 3D species with ExtrudeGeometry, inner radius, rotation, depth.
- ~~**Negative polarity.**~~ Done (2026-05-13). Specimen-level flag with `polarity` and `fillLuma`. All nine species.
- ~~**Ink color parameter.**~~ Done (2026-05-17). Specimen-level `inkColor` with color picker on all nine species.
- **Decide on grid alignment for the pool.** Halftone's grid is canvas-aligned, so when multiple specimens later share one canvas they will share grid alignment. This was a deliberate default; pool composition may want to confirm whether per-specimen grid origins are also useful (e.g. each specimen has its own halftone phase) or whether the shared grid is the right answer always.

## Later

- **Pool composition.** Multiple specimens placed on one canvas. Requires composition format (specimen list + position + scale), layout logic, shared environment, and probably its own page that consumes saved tuples.
- **Specimen library.** Saved tuples organized for reuse. Could be a JSON file in the repo or a more elaborate browser-storage system.
- **More breeds from the planned list.** Halftone, edge_particles, mosaic each test different visual primitives.
- **SVG output.** Deferred when we picked three.js. Adding it later requires per-breed SVG generation, which is its own project. Worth it if we want print-ready output.

## Speculative

- **MCP server or Claude Code skill.** A tool surface for the project, callable from Claude Code. Worth pursuing once the catalog stabilizes.
- **Live region editor for color_blocking.** Currently regions are hardcoded in DEFAULTS. A UI for adding, removing, and tuning regions would be useful.
- **Multi-form breeds.** Breeds that operate across the entire canvas, not per-specimen. A "shared shadow" breed that knits all specimens into one composition.

## Not doing

- Animation. The pool is a snapshot.
- Physics. Specimens sit where they are placed.
- Real-time editing of all parameters via voice or AI. The control panel is enough.

## Open questions

- **Normals for 2D-native species.** Resolved. Tube-shaped species (filament, bolt, bristle, synapse) synthesize from local tangent perpendicular + cylinder cross-section. Blob uses a dome model (radial from center, z from normalized distance to boundary). Both models produce normals compatible with the shared Lambert light and color_blocking. Remaining planned 2D-native species (disc, ring) should use whichever model fits their geometry.
- **Inner vs outer face distinction.** Currently a known limitation of color_blocking. Solutions: face-id pass, screen-space position, depth pass. None pursued yet.
- **Specimen tuple storage.** Decided against saved anchor tuples (2026-05-13). The pool will generate random builds from unguided random seeds. Tuples remain in each test file's DEFAULTS for standalone testing only.
- **Composition layout.** When we get to the pool, manual placement or procedural? Probably both, with manual being the fallback.
- ~~**Negative polarity implementation.**~~ Resolved (2026-05-13). Specimen-level `polarity` flag. Inversion happens after form pass, before tone pass. `fillLuma` controls surround luma. Propagated to all nine species.

## Recent changes

- 2026-05-18: COLOR CLUSTER breed built and propagated to all eleven species. HSL harmony palettes (6 modes: complementary, analogous, triadic, split-complementary, tetradic, monochromatic). Shape mix via population weight sliders (circle/quad/triangle percentages, mixed output when multiple nonzero). Perlin noise density modulation (noiseFreq + noiseStrength create clump/void zones). Chamfer distance field scatter (marks placed outside silhouette with quadratic falloff). Luma response for inside-silhouette density variation. 15 parameters. Key functions: `pickShape()`, `buildDistanceField()`, `drawColorClusterFromForm()`. Prototyped on torus, then propagated to all remaining species.
- 2026-05-18: SIDEBAR LAYOUT applied to all eleven species. Two-column: 380px scrollable sidebar (left) with controls, flexible canvas area (right) with centered artwork. Controls scroll independently from artwork. Applied during color_cluster propagation.
- 2026-05-18: FILE RENAMES. specimen_shape02_v10.html → specimen_torus_v10.html, specimen_shape02_v9.html → specimen_torus_v9.html, specimen_shape71_v3.html → specimen_arch_v3.html, specimen_shape71_v4.html → specimen_arch_v4.html. Species names now in all filenames.
- 2026-05-18: CLUSTER RECLASSIFICATION. Cluster dissolved as a species. All 17 reference shapes reclassified to existing species (torus, ring, block, cylinder, synapse) or four new species (anemone, agglomerate, basalt, pinwheel). Four new breeds identified: color cluster (12 ref shapes), dot matrix (5 ref shapes), mycelium (1), blues (1). Both reference docs (SHAPE_REFERENCE.md and SHAPE_REFERENCE_REVIEW.md) updated with corrected species/breed classifications and count tables. SPECIES.md updated.
- 2026-05-17: INK COLOR parameter added to all nine species. Specimen-level `inkColor: [14, 13, 11]` (near-black default). The four monochrome breeds (raster_vertical, stipple, halftone, outline) read `s.inkColor` instead of hardcoding RGB. INK panel with `<input type="color">` picker between POLARITY and BREED in the control panel. Color input binding parses hex to RGB array, schedules breed update. Reset restores from DEFAULTS. Specimen view JSON includes `inkColor`. Covers ~11 colored-ink reference shapes without new breeds.
- 2026-05-13: NEGATIVE POLARITY propagated to all nine species. Specimen-level `polarity` flag ("positive"/"negative") inverts the silhouette mask after the form pass. `fillLuma` (0-1) controls how dark the inverted surround reads. Pipeline: form → polarity → tone → breed. Prototyped on disc, then propagated to torus, arch, cylinder, filament, bolt, bristle, synapse, blob. Each species gets: POLARITY panel (radio + fillLuma slider), `applyPolarity()` function, wiring into scheduleFormUpdate/boot/specimenView/reset.
- 2026-05-13: OUTLINE breed face-edge mode added to disc, cylinder, arch. Three modes (boundary, faces, both) with threshold parameter. Detects normal discontinuities between adjacent faces. Geometry changed to `toNonIndexed()` + `computeVertexNormals()` on all three hard-edge species to produce flat per-face normals. Smooth-surface species unchanged.
- 2026-05-13: DISC species complete (specimen_disc_v1.html). Ninth species, fourth 3D. Rewritten from 2D-native to 3D: thin extruded circle via THREE.Shape + ExtrudeGeometry with two-pass rendering (lit + object-space normals). 7 SHAPE controls (ROT X/Y/Z, RADIUS, INNER RADIUS, DEPTH, SEGMENTS). Inner radius produces annulus/ring form. All seven breeds wired with COVERAGE on monochrome breeds. SHAPE-12 and 15 show disc in negative polarity (cutout in dark field), which requires negative polarity rendering not yet implemented.
- 2026-05-13: Reference set review completed. Independent study of all 144 shapes in ogRef (docs/SHAPE_REFERENCE_REVIEW.md). Key findings: ~25% of shapes use negative polarity (form as cutout, background filled). ~11 shapes use colored variants of monochrome breeds (color stipple, color outline). New planned breed identified: dashed (short isolated stroke segments, SHAPE-28, 72, 91). Global lighting confirmed for pool composition. Saved anchor tuples dropped from the plan; pool will use random seed generation.
- 2026-05-12: BLOB species built (specimen_blob_v1.html). Eighth species, fifth 2D-native. Amorphous closed silhouette from noise-perturbed circle with N control points at seeded random radii. Catmull-Rom to cubic bezier conversion, offscreen canvas bezierCurveTo + fill for silhouette. Dome normal model: radial direction from centroid, z-component from normalized distance to boundary via angle-binned boundary distance map (720 bins). All seven breeds wired. 5 SHAPE controls (radius, aspect, vertices, deform, tension, seed).
- 2026-05-12: color_blocking wired on filament, bolt, bristle (synapse already had it). All eight species now have all seven breeds. Torus gained normal pass infrastructure (two-pass three.js rendering matching arch pattern). Bolt gained flat cap fix (clear pixels behind start perpendicular for angular wide end).
- 2026-05-11b: SYNAPSE species built (specimen_synapse_v1.html). Ported curveTests/generate.js into specimen pipeline. Spine-driven horizontal body with bilateral spikes, Catmull-Rom tension 0.55, offscreen canvas bezier fill for silhouette, spine-relative cylindrical normal synthesis. Self-intersection defense: slope limiting, vertical contour offset, same-side angular exclusion, post-hoc crossing repair. All seven breeds wired. See `docs/SESSION_BRIEF_2026-05-11b.md`.
- 2026-05-11b: OUTLINE breed built and propagated to all seven species (synapse, bristle, filament, bolt, torus, arch, cylinder). Boundary pixel detection via 4-neighbor check on silhouette mask. Two params: weight (circle diameter) and jitter (position offset). First breed that ignores luma entirely.
- 2026-05-11: contour generator built at `proterozoic/curveTests/generate.js`. Direct outline construction (spine + body offset + spike projections traced as a single closed Bezier path). Two iterations: v1 had sine-wave spine and angular spike bases; v2 uses random-walk spine with decaying amplitude and direct tip insertion. Produces silhouettes in the spline.svg family. Self-intersection is the open problem. `docs/spline-generator-reference.md` reviewed and found to misread the reference (describes a scribble generator, not a dendrite form). `docs/spline_structural_anatomy.html` (user-created) correctly identifies body axis, spike tips, and spike lengths in the reference. Full session brief at `docs/SESSION_BRIEF_2026-05-11.md`.
- 2026-05-10: dendrite v1 built using skeleton distance field architecture. Spine noise controls iterated three times (kink on branches, kink on spine, guideline-based). Spine shape not visually registering under branch mass. Session ended unresolved. Full session brief at `docs/SESSION_BRIEF_2026-05-10.md`.
- 2026-05-09 session closed unresolved on fused_bristle. Three architectures tried (v1 metaball, v2 explicit primitives, v3 trimmed tubes + global wedge), none satisfies the user as SHAPE-141. User stepped out to research. Bristle v3 (single body + ASPECT) was completed and is canonical for the un-chambered SHAPE-141. Full session brief at `docs/SESSION_BRIEF_2026-05-09.md`.
- v3 (FUSED_BRISTLE): three fixes from shape141expo4/5/6 review. (1) Tubes trimmed to chamber edges — each tube starts/ends at distance = lobe.radius from the lobe centre, so only the visible neck gap is stamped. Tubes are skipped when chambers overlap or are within 2px. Removes the wandering-polyline-through-scattered-chambers effect when lobeVar is high. (2) Spike-wedge exclusion now global — wedges block the angular direction of every other chamber (not just immediate neighbours), so spikes never fly into non-adjacent chambers. (3) Defaults retuned: lobes 3 → 6, bodyRadius 48 → 20, lobeSpread 280 → 360, spikeCount 18 → 24, spikeLength 35 → 30 to match the more-numerous-smaller-bumps reference silhouette. The user's earlier reading of SHAPE-141 (and mine) had been confused by the chiseled hatching pattern inside the reference body; expo6.png clarified that the body outline IS the chambered chain, hatching was just internal fill.
- v2 (FUSED_BRISTLE): replaced v1's metaball + marching-squares model with explicit primitives. Reasons documented in shape141expo3.png commentary: metaball necks are hourglass-pinched, not parallel-walled like the reference; gradient-based spike directions were unstable in narrow necks (spikes pointed into adjacent chambers). v2 architecture: each chamber is a Catmull-Rom perturbed body around its lobe centre (bristle v3 model), adjacent chambers connected by 2-point neck tubes stamped at body thickness, spikes attach per-chamber with `(attach - lobe.center)` outward direction and ±30° wedge exclusion facing each neighbour. Adds VERTICES slider (4-16, default 8) for chamber control point count. v1 retained for the metaball capability if a future shape needs it.
- v1 (FUSED_BRISTLE): seventh species, fourth 2D-native. Chambered SHAPE-141 variant per user reference shape141expo2.png. K (1-6) metaball lobes placed along a horizontal guide spine through the canvas centroid, each with independent per-seed perpendicular offset (LOBE VAR) and radius perturbation (BODY DEFORM). Body field = sum of inverse-square contributions; outer boundary = iso-contour at threshold 1.0 extracted via marching squares on a 4-pixel grid. Disjoint lobe groups produce multiple contours, fused groups produce one. Spikes attach proportionally across all body contours by perimeter share; outward direction = -gradient(field) normalized, which always points away from nearest lobe core (handles concave necks correctly). 13 SHAPE controls (6 body + 7 spike). bristle v3 considered complete; remains the canonical un-chambered SHAPE-141. Marching squares is new infrastructure that may be reusable for future compound-shape species (blob with internal voids, etc).
- v3 (BRISTLE): ASPECT slider added to BODY group (x-axis stretch, range 0 to 3.0, default 1.0; min lowered from 0.3 → 0 in same session for extreme-ratio testing). Implementation: control point's x = cos(angle) * radius * aspect; y unchanged. bodyRadius keeps its "how tall" meaning, ASPECT adds "how wide relative to tall." Spike outward direction = (attach - centroid) normalized, unchanged from v2; for aspect-stretched bodies spikes near the stretched axis point along that axis rather than perpendicular to local skin (acceptable for convex bodies, user will report extremes). Body thickness range expanded 12 → 24, spike 6 → 12. Defaults: 3.5 / 1.75 (2:1 ratio preserved at default; sliders remain independent).
- v2 (BRISTLE): redesigned per user reference image (shape141expo.png). v1's horizontal-spine + perpendicular-bristles model was wrong against the reference, which shows a closed irregular body ("collapsed circle") with multi-segment spikes radiating outward. v2 implements: closed Catmull-Rom spline body through perturbed-radius control points, sampled at 12 subdivisions per segment; radial spikes attached at evenly-spaced parameter positions along the body curve, independent of body vertex count; per-spike outward direction = (attach − centroid) normalized; per-joint angle deviation for kinks; tip taper and length variation, all seeded. 11 SHAPE controls (4 body + 7 spike). v1 retained as reference for the architectural revision.
- v1 (BRISTLE): sixth species, third 2D-native. SHAPE-141. Spine + perpendicular bristles emerging from evenly-spaced spine indices, both sides, with tip taper and per-bristle length variation. First species to render multiple paths in one form pass: the existing chain-of-circles stamp infrastructure handles each path independently, with cross-path gaps left unbridged (a bristle ends at its tip). Inherits filament's synthesized tube-normal model, so a pool with mixed specimens shares one global light direction. Four breeds wired; color_blocking deferred alongside filament's and bolt's.
- v3 (BOLT): scoped down to SHAPE-23 only. v1+v2 attempted to cover both SHAPE-23 and SHAPE-141 via parameter dialing; the unification hit neither shape well. v3 replaces the wander+bias generator with explicit alternating-perpendicular zigzag (interior vertex i sits on the start→end line at progress u = i/N, deviated perpendicular by ZIGZAG with alternating sign and 30% random magnitude variation). Drops `maxAngle` and `bias`; adds `zigzag`. Defaults tuned for SHAPE-23 on load (segments=3, orientation=120°, taper=0.65, thickness=14). SHAPE-141 character (caterpillar/seadragon, gentle spine + perpendicular bristles) reassigned to a new species: bristle, queued next.
- v2 (BOLT): adds ORIENTATION (-180 to +180°, rotates start→end vector around canvas centre) and TAPER (0 to 1, linear thickness reduction from start to end). Lowers SEGMENTS minimum from 5 to 2. Defaults preserve v1's SHAPE-141 character on load (orientation 0, taper 0, segments 24). SHAPE-23 (clean iconic lightning glyph) reachable as a parameter preset: SEGMENTS 3, ORIENTATION ~120°, BIAS 0.85, MAX ANGLE ~60°, TAPER 0.7. One species, both reference shapes covered.
- v1 (BOLT): fifth species, second 2D-native. Angular polyline walking from left start to right end with per-segment uncorrelated random angle drift, blended toward the target direction by `bias`. bias = 1 = straight line; bias = 0 = drunkard's walk; bias ~0.7 = lightning sweet spot. Inherits filament's synthesized tube-normal form pass, so light convention matches the 3D species and a pool can share one light. Path generator uses mulberry32-style seeded RNG (uncorrelated samples) rather than filament's smooth value noise (correlated samples). Four breeds wired; color_blocking deferred alongside filament's. v1 targets SHAPE-141 (jagged zigzag); SHAPE-23 (clean iconic lightning glyph) is queued for v2 via ORIENTATION + low-SEGMENTS range + TAPER, so one species reaches both reference shapes by parameter dialing. Removes bolt from the original-12 planned-later list.
- DOC: recorded SHAPE-XX reference numbers for all built species in SPECIES.md (torus = 02, arch = 71, cylinder = 65, filament = 19, bolt = 141 primary + 23 reachable). Corrected the TRACKER claim that cylinder is "beyond the original 12-species taxonomy"; it is on the broader 144-shape source set but not on the curated 12-species planned list.
- HALFTONE propagation: torus → v10, arch → v4, filament → v3. Same drawHalftoneFromForm copied verbatim into each file (the typed-array contract makes it a no-touch port). Each new file defaults to halftone for showcase. Earlier versions retained for reference. Pure additive change; old specimen tuples (e.g. saved with `breed: "color_blocking"`) still roundtrip identically because all prior breeds remain wired.
- HALFTONE breed (cylinder v2): first regular-pattern breed. Walks a canvas-aligned grid; one circle per cell, diameter = `cellSize * dotSize * (1 - luma * coverage)`. Adds a different formal register to the four particulate breeds. Wired into cylinder v2 only so far; propagation to torus / arch / filament pending. The grid being canvas-aligned (rather than specimen-aligned) is a deliberate default for the eventual pool composition: shared canvas → shared grid → multiple specimens read as if printed on one halftone screen.
- v1 (CYLINDER): third 3D species. Two-pass form (lit + object-space normals) mirrored from arch v3; all four breeds wired with COVERAGE on monochrome breeds (caps need it). SHAPE panel exposes THREE.CylinderGeometry params directly: radiusTop, radiusBottom (so the species also covers cone and frustum), height, radialSegments, heightSegments, openEnded toggle. color_blocking region defaults split top cap → blue, bottom cap → green, front side wall → red, back side wall → yellow (default). Cylinder is an addition beyond the original 12-species taxonomy in SPECIES.md.
- v2 (FILAMENT): synthesized tube normals. Each curve point now stores a unit perpendicular to its local tangent; pixels in the stamp get a 3D normal (in-plane component = perpendicular * d_signed, out-of-plane = sqrt(1 − d²), screen-y flipped to world-y). Luma replaced with Lambert against `SPECIMEN.light` using the same convention as the 3D species. Added LIGHT panel (X/Y/Z, KEY, AMBIENT) with v9-matching defaults. Debug view now shows luma and normal fields side-by-side. color_blocking unblocked but breed not yet wired into selector; queued for v3.
- v1 (FILAMENT): first 2D-native species. Form pass runs entirely in JS; no three.js. Seeded value-noise generator produces a polyline. Per-pixel min-distance sweep produces silhouette + synthesized luma (1 - normalizedDist²). Adjacent points connected by interpolated mid-stamps. raster_vertical, stipple, riso_noise breeds work unchanged. color_blocking unsupported (no normals). Independent geometry seed lets users reroll the curve without disturbing breed dot positions.
- v3 (SHAPE-71): added normal pass via custom ShaderMaterial, color_blocking breed, two-pass form rendering
- v2 (SHAPE-71): added archR for curved inner top corners, COVERAGE parameter for raster + stipple
- v1 (SHAPE-71): arch species via ExtrudeGeometry, three breeds, retuned riso layers
- v9 (SHAPE-02): canvas/frame CSS fix, raster LENGTH slider, riso_noise breed
- v8 (SHAPE-02): tone stage between form and breed; removed per-breed lumaBias
- v7 (SHAPE-02): KEY/AMBIENT light intensity sliders
- v6 (SHAPE-02): added stipple breed alongside raster

## Test discipline

When adding a feature:

1. Test through every existing breed, not just the new one.
2. Verify defaults reset cleanly.
3. Save a known-good tuple in the specimen view before considering the version done.
4. Update SPECIES.md or BREEDS.md with the new entry.
5. Update this file (TRACKER.md) with the change.

When in doubt, view the file. Old tracker entries lie.
