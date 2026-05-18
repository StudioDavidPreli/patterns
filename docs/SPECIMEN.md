# Specimen format

A specimen is a JSON object describing one rendered form. It contains everything needed to reproduce the image deterministically: the form parameters, the rendering breed, the seed.

## Schema

```json
{
  "species": "arch",
  "breed": "color_blocking",

  "geometry": {
    "type": "arch",
    "width": 1.4,
    "height": 1.4,
    "legWidth": 0.32,
    "topThick": 0.32,
    "archR": 0.25,
    "depth": 0.5,
    "rotation": [0, 0, 0]
  },

  "camera": {
    "fov": 32,
    "position": [0.6, 0.45, 2.8],
    "target": [0, 0, 0]
  },

  "light": {
    "keyIntensity": 1.3,
    "direction": [-0.6, 1.0, 0.5],
    "ambient": 0.1
  },

  "tone": {
    "blackPoint": 0.0,
    "whitePoint": 1.0,
    "gamma": 1.0
  },

  "breeds": {
    "color_blocking": {
      "density": 0.22,
      "dotSizeBase": 1.3,
      "dotSizeVar": 0.35,
      "jitter": 0.4,
      "shading": 0.30,
      "defaultColor": [248, 215, 88, 235],
      "regions": [
        { "dirX": 1, "dirY": 0, "dirZ": 0, "threshold": 0.45, "color": [60, 100, 165, 235] }
      ]
    }
  },

  "paperGrain": 0.55,
  "inkAlpha": 232,

  "seed": 1138
}
```

## Field reference

### Top level

- `species` — the form name. Determines which buildGeometry or drawForm function runs.
- `breed` — the active rendering breed. Determines which drawBreedFromForm function runs.
- `seed` — integer seed for deterministic randomness in the breed pass.
- `paperGrain` — 0 to 1. Strength of the paper texture overlay.
- `inkAlpha` — 0 to 255. Base alpha for monochrome breeds. Riso and color_blocking define alpha per layer or region.

### geometry

Species-specific. The shape varies. All species have a `type` field naming themselves. 3D species typically have `rotation` as a [x, y, z] degree triple. See SPECIES.md for each species's geometry fields.

### camera (3D species only)

- `fov` — vertical field of view in degrees
- `position` — [x, y, z] camera position in world units
- `target` — [x, y, z] world point the camera looks at

2D-native species omit this field.

### light (3D species only)

- `keyIntensity` — directional light strength
- `direction` — [x, y, z] light direction. The camera looks at the origin, so a light direction of [0, 1, 0] means lit from above.
- `ambient` — ambient light strength

2D-native species omit this field.

### tone

- `blackPoint` — 0 to 0.5. Luma values at or below this map to 0.
- `whitePoint` — 0.5 to 1.0. Luma values at or above this map to 1.
- `gamma` — 0.3 to 3.0. Power applied to normalized luma after the linear remap.

### breeds

Object keyed by breed name. Each value is the parameter set for that breed. The schema for each breed is in BREEDS.md.

A specimen tuple typically holds the params for ALL configured breeds, even though only the active one is rendered. This lets the user toggle breeds without losing tuned parameters. For storage and exchange, you can include only the active breed's params; both forms are valid.

## Determinism

Two specimens with identical fields produce identical images, given:

- Same browser engine. Canvas anti-aliasing varies by engine; visual identity is not byte-identity.
- Same canvas dimensions. Currently 560 × 420.
- Same seed. Controls all p5.js random calls in the breed pass and grain overlay.

The form pass uses three.js, which is deterministic for a given input. The breed pass uses p5.js random, seeded explicitly. Paper grain uses a fixed noise seed (1234) so paper texture is identical across specimens. Grain overlay uses the specimen's seed.

## Versioning

The schema is currently unversioned. When a breaking change happens, we will add a `schemaVersion` field and write a migration. Until then, treat older test files as compatible if they share field names.

## Storage

Specimens currently live as DEFAULTS objects in each test file. There is no central library yet. The plan is for a separate library file or browser storage solution once the catalog stabilizes; see TRACKER.md for status.

When saving a specimen by hand, copy the JSON shown in the specimen view at the bottom of each test file. That JSON is what the test file is currently rendering. Reload by pasting it into a tool that consumes it (none exists yet).

## What's not in the schema

- Position on a composition canvas. The pool composition layer is not built. When it is, position and scale will be added at the composition level, not the specimen level.
- Render-time options like canvas size or output format. Those are tool-level, not specimen-level.
- Specimen metadata (author, date, notes). Could be added later under a `meta` field. Not present now.
