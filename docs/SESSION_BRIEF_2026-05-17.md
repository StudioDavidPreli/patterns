# Session Brief: 2026-05-17

Continues from `SESSION_BRIEF_2026-05-12.md` (and the 2026-05-13 work documented in TRACKER.md). This session added the ink color parameter to all nine species.

## Starting state

Nine species, seven breeds. Negative polarity on all species. Reference set reviewed. Two items flagged as ready in the tracker:
1. Ink color parameter for the four monochrome breeds.
2. New species from the planned list.

## Ink color parameter

### Design

Specimen-level `inkColor: [r, g, b]`, stored next to `inkAlpha`. Default `[14, 13, 11]` (near-black, the value previously hardcoded in all four monochrome breed draw functions). Follows the same convention as `inkAlpha`: lives on the specimen, consumed by raster_vertical, stipple, halftone, and outline. Has no effect on riso_noise (own layer colors) or color_blocking (own region colors).

### Integration pattern

Seven edits per file, applied across all nine species (63 edits total):

1. CSS for `input[type="color"]` (appearance reset, border, swatch cleanup)
2. `inkColor: [14, 13, 11]` in DEFAULTS next to `inkAlpha`
3. INK panel with color picker between POLARITY and BREED sections
4. Four draw function calls: `p.stroke(14, 13, 11, ...)` and `p.fill(14, 13, 11, ...)` replaced with `s.inkColor[0], s.inkColor[1], s.inkColor[2]`
5. Event binding: hex string parsed to RGB array on `input` event, triggers `scheduleBreedUpdate()`
6. Specimen view JSON: `inkColor: SPECIMEN.inkColor` added to export
7. Reset: state restored via spread (`[...DEFAULTS.inkColor]`), DOM restored via hex conversion

### Interaction with existing breeds

- **raster_vertical**: `p.stroke(s.inkColor[0], s.inkColor[1], s.inkColor[2], s.inkAlpha)`
- **stipple**: `p.fill(s.inkColor[0], s.inkColor[1], s.inkColor[2], alpha)` where alpha includes luma modulation
- **halftone**: `p.fill(s.inkColor[0], s.inkColor[1], s.inkColor[2], s.inkAlpha)`
- **outline**: `p.fill(s.inkColor[0], s.inkColor[1], s.inkColor[2], s.inkAlpha)` (including face-edge mode on disc, cylinder, arch)
- **riso_noise**: unaffected (own layer color system)
- **color_blocking**: unaffected (own region color system)

## Files modified

- `species/specimen_shape02_v10.html` -- torus: ink color added
- `species/specimen_shape71_v4.html` -- arch: ink color added
- `species/specimen_cylinder_v2.html` -- cylinder: ink color added
- `species/specimen_filament_v3.html` -- filament: ink color added
- `species/specimen_bolt_v3.html` -- bolt: ink color added
- `species/specimen_bristle_v3.html` -- bristle: ink color added
- `species/specimen_synapse_v1.html` -- synapse: ink color added
- `species/specimen_blob_v1.html` -- blob: ink color added
- `species/specimen_disc_v1.html` -- disc: ink color added
- `docs/BREEDS.md` -- ink color section updated from planned to implemented
- `docs/TRACKER.md` -- ink color marked done, recent changes entry added
- `docs/SESSION_BRIEF_2026-05-17.md` -- this file

## Current state

Nine species, seven breeds. Every species has every breed wired. Ink color is adjustable on all four monochrome breeds via a color picker in the control panel.

| Cross-cutting feature | Status |
|---|---|
| Negative polarity | All nine species |
| Ink color | All nine species (monochrome breeds only) |
| Outline face-edge mode | disc, cylinder, arch |

## Open items for next session

1. New species from the planned list (cluster, ring, star, radial, concentric, block). Cluster is next; may collapse into a breed.
2. Halftone grid alignment decision for pool composition.
3. Pool composition (when species catalog feels sufficient).
