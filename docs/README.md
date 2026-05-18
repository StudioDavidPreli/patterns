# Proterozoic Pool

A generative tool for producing populations of distinct specimens on a shared canvas. Each specimen is a combination of a *species* (the form) and a *breed* (the rendering style). The intended output is a composition that reads like a Proterozoic shore pool: many forms, related but not identical, sharing one environment.

The tool is in its exploratory phase. Species and breeds are being built individually as standalone test files. The composition layer that places multiple specimens on one canvas does not yet exist.

## Status

Built:
- Seven species: torus, arch, cylinder, filament, bolt, bristle, fused_bristle
- Five breeds: raster_vertical, stipple, halftone, riso_noise, color_blocking
- A three-stage rendering pipeline (form → tone → breed) handling both 3D and 2D-native species

Not yet built:
- Most species in the planned taxonomy (blob, cluster, and others)
- Pool composition layer (multiple specimens on one canvas)
- Specimen library or saved tuples
- Output formats beyond PNG

## Files

Specimen tests are self-contained HTML files under `species/`. Open one in a modern browser; no build step needed.

- `species/specimen_shape02_v10.html` — Torus species, current canonical. Four breeds (raster, stipple, halftone, riso_noise).
- `species/specimen_shape02_v9.html` — Torus v9. Three breeds, no halftone. Kept for reference; superseded by v10.
- `species/specimen_shape71_v4.html` — Arch species, current canonical. All five breeds.
- `species/specimen_shape71_v3.html` — Arch v3. Four breeds, no halftone. Kept for reference; superseded by v4.
- `species/specimen_cylinder_v2.html` — Cylinder species, current canonical. All five breeds. Source-mesh controls expose THREE.CylinderGeometry params directly (radii, height, segments, openEnded).
- `species/specimen_cylinder_v1.html` — Cylinder v1. Four breeds, no halftone. Kept for reference; superseded by v2.
- `species/specimen_bolt_v3.html` — Bolt species, current canonical. SHAPE-23 only (clean iconic lightning glyph). Explicit alternating-perpendicular zigzag generator. Four breeds.
- `species/specimen_bolt_v2.html` — Bolt v2. Tried to cover both SHAPE-23 and SHAPE-141 via wander+bias controls; superseded by v3 (split into bolt + bristle).
- `species/specimen_bolt_v1.html` — Bolt v1. Horizontal-only first attempt. Superseded by v2.
- `species/specimen_fused_bristle_v3.html` — Fused bristle species, current canonical. Tubes trimmed to chamber edges, global spike-wedge exclusion, retuned defaults for more-bumps-smaller-diameters. SHAPE-141 chambered variant.
- `species/specimen_fused_bristle_v2.html` — Fused bristle v2. Explicit primitives but full-length tubes (centre-to-centre) and neighbour-only wedges. Superseded by v3 (the wandering-tube and spike-into-non-adjacent issues).
- `species/specimen_fused_bristle_v1.html` — Fused bristle v1. Metaball + marching-squares. Superseded by v2.
- `species/specimen_bristle_v3.html` — Bristle species, current canonical for the single-lobe SHAPE-141 form. Closed Catmull-Rom body + radial spikes.
- `species/specimen_bristle_v2.html` — Bristle v2. Closed body + radial spikes baseline. Superseded by v3.
- `species/specimen_bristle_v1.html` — Bristle v1. Horizontal-spine model (architecturally wrong vs reference). Superseded by v2.
- `species/specimen_filament_v3.html` — Filament species, current canonical. Synthesized tube normals + Lambert lighting. Four breeds.
- `species/specimen_filament_v2.html` — Filament v2. Three breeds, no halftone. Kept for reference; superseded by v3.
- `species/specimen_filament_v1.html` — Filament v1. Radial luma without lighting. Kept for reference; superseded by v2/v3.

Documentation:

- `CLAUDE.md` — Orientation for sessions and contributors. Voice, working patterns, where things live.
- `ARCHITECTURE.md` — The form/tone/breed pipeline in depth.
- `SPECIMEN.md` — The data format that defines a specimen.
- `SPECIES.md` — Catalog of species, built and planned.
- `BREEDS.md` — Catalog of breeds, built and planned.
- `TRACKER.md` — Current state. Updated as work progresses.

## Running

Open any `species/specimen_*.html` in a modern browser. 3D species use three.js (loaded via importmap); all species use p5.js (loaded via CDN) for the breed pass. 2D-native species (filament onward) skip three.js entirely. No package.json, no bundler, no install step. Every test file is self-contained.

## Stack

- three.js — 3D form rendering for species that have a 3D primitive
- p5.js — 2D breed rendering, paper texture, ink primitives
- Vanilla HTML and CSS — UI, control panels, layout
- IBM Plex Mono and DM Serif Display — typography

## Project name

The working title is *Proterozoic Pool*. The Proterozoic era was the long stretch of Earth's history during which complex life began organizing itself into recognizable forms while still mostly living in shallow shore pools and intertidal zones. The visual reference is that environment: a contained surface with multiple distinct things in it, not yet animal but no longer mineral.
