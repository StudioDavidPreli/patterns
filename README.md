# Proterozoic Pool

A generative tool for producing populations of distinct specimens on a shared canvas. Each specimen is a combination of a species (the form) and a breed (the rendering style). The intended output is a composition that reads like a Proterozoic shore pool: many forms, related but not identical, sharing one environment.

The tool is in its exploratory phase. Species and breeds are being built individually as standalone test files. The composition layer that places multiple specimens on one canvas does not yet exist.

## Status

Built:

- **Nineteen species:** torus, arch, cylinder, filament, bolt, bristle, synapse, blob, disc, star, block, basalt, pinwheel, anemone, agglomerate, concentric, eye. Plus two abandoned (fused_bristle, dendrite) and two skipped (ring, radial).
- **Eight breeds:** raster_vertical, stipple, halftone, riso_noise, color_blocking, outline, color_cluster, dot_matrix
- A three-stage rendering pipeline (form -> tone -> breed) handling both 3D and 2D-native species
- Negative polarity on all species
- Sidebar layout on all species
- Ink color parameter on all species

Not yet built:

- Pool composition layer (multiple specimens on one canvas)
- Specimen library or saved tuples
- Additional breeds from the planned list (mycelium, blues, and others)
- Output formats beyond PNG

## Species

Each species produces silhouette, luma, and (optionally) normals. 3D species use three.js; 2D-native species draw directly to canvas.

| Species | Type | File | Notes |
|---|---|---|---|
| torus | 3D | specimen_torus_v10.html | SHAPE-02. Reference implementation. |
| arch | 3D | specimen_arch_v4.html | SHAPE-71. Faceted extrusion. |
| cylinder | 3D | specimen_cylinder_v2.html | SHAPE-65. Curved side + flat caps. |
| disc | 3D | specimen_disc_v1.html | SHAPE-12/15/67/95. Extruded circle, inner radius for annulus. |
| block | 3D | specimen_block_v1.html | BoxGeometry. Six-face color_blocking. |
| basalt | 3D | specimen_basalt_v1.html | SHAPE-82. Grid of merged box columns, seeded heights. |
| filament | 2D-native | specimen_filament_v3.html | SHAPE-19. Synthesized tube normals. |
| bolt | 2D-native | specimen_bolt_v3.html | SHAPE-23. Alternating zigzag. |
| bristle | 2D-native | specimen_bristle_v3.html | SHAPE-141. Catmull-Rom body + radial spikes. |
| synapse | 2D-native | specimen_synapse_v1.html | Spine-driven body with bilateral spikes. |
| blob | 2D-native | specimen_blob_v1.html | Noise-perturbed closed silhouette. Dome normals. |
| star | 2D-native | specimen_star_v1.html | N-pointed polygon with seeded turbulence. |
| pinwheel | 2D-native | specimen_pinwheel_v1.html | SHAPE-117. Hub + curved tapered spokes. |
| anemone | 2D-native | specimen_anemone_v1.html | SHAPE-05/09/58. Organic or cubic cell clusters. |
| agglomerate | 2D-native | specimen_agglomerate_v1.html | SHAPE-25/80. Clustered circles, per-sphere dome normals. |
| concentric | 2D-native | specimen_concentric_v1.html | Nested rings, 2.5D tilt projection, per-ring tube normals. |
| eye | 2D-native | specimen_eye_v1.html | Almond silhouette, sclera/iris dome normals, negative-space pupil. |

All specimen files live under `species/`.

## Breeds

Each breed reads the form data (silhouette, luma, normals) and draws ink primitives to canvas.

| Breed | Consumes | Notes |
|---|---|---|
| raster_vertical | silhouette, luma | Vertical lines with luma-driven weight. |
| stipple | silhouette, luma | Scattered dots with luma-driven density. |
| halftone | silhouette, luma | Regular grid, dot diameter from luma. |
| riso_noise | silhouette, luma | Four-layer color noise. |
| color_blocking | silhouette, luma, normals | Normal-based color regions. |
| outline | silhouette, normals | Boundary and/or face-edge contours. |
| color_cluster | silhouette, luma | HSL harmony palettes, shape mix, Perlin density. |
| dot_matrix | silhouette | Equal-size marks (dot or block glyph) on a grid, Perlin noise density gate. |

## Documentation

- `docs/CLAUDE.md` -- Orientation for sessions and contributors.
- `docs/ARCHITECTURE.md` -- The form/tone/breed pipeline in depth.
- `docs/SPECIMEN.md` -- The data format that defines a specimen.
- `docs/SPECIES.md` -- Catalog of species, built and planned.
- `docs/BREEDS.md` -- Catalog of breeds, built and planned.
- `docs/TRACKER.md` -- Current state. Updated as work progresses.

## Running

Open any `species/specimen_*.html` in a modern browser. 3D species use three.js (loaded via importmap); all species use p5.js (loaded via CDN) for the breed pass. 2D-native species skip three.js entirely. No package.json, no bundler, no install step. Every test file is self-contained.

## Stack

- **three.js** -- 3D form rendering for species that have a 3D primitive
- **p5.js** -- 2D breed rendering, paper texture, ink primitives
- **Vanilla HTML and CSS** -- UI, control panels, layout
- **IBM Plex Mono and DM Serif Display** -- typography

## Project name

The working title is Proterozoic Pool. The Proterozoic era was the long stretch of Earth's history during which complex life began organizing itself into recognizable forms while still mostly living in shallow shore pools and intertidal zones. The visual reference is that environment: a contained surface with multiple distinct things in it, not yet animal but no longer mineral.
