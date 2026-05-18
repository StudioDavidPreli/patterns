# Architecture

The tool is structured as a three-stage pipeline. Each stage has a defined input and output. The seam between stages is a typed-array data structure, not a function call. This separation lets us swap implementations at any stage without touching the others.

## Stages overview

```
species params ──┐
                 ├─► [Form pass] ──► silhouette, luma, normals
camera, light  ──┘                              │
                                                ▼
                              tone ──────► [Tone pass per pixel]
                                                │
                                                ▼
                       breed params ──► [Breed pass] ──► canvas
```

Each arrow is a stable contract. Implementations behind any arrow can change. The contract holds.

## Stage 1: Form pass

**Input:** species parameters (geometry, camera, light)
**Output:**

- `silhouette` — Uint8Array, length = canvas pixels. 1 if the pixel is inside the form, 0 otherwise.
- `luma` — Float32Array, length = canvas pixels. 0 to 1. Lit-from-light brightness.
- `normals` — Float32Array, length = canvas pixels × 3. Object-space normal vector, packed as x/y/z. May be all zeros for 2D-native species without synthesized normals.
- `lumaMin`, `lumaMax`, `lumaMean` — statistics for the AUTO LEVELS button.

### 3D species

3D species (torus, arch, eventually block) use three.js to render the form. The renderer is offscreen; the canvas content is read back via `drawImage` to a 2D canvas, then `getImageData` returns the pixel array.

The form pass renders TWICE per update:

1. With `MeshStandardMaterial` and a directional light. Read pixels, compute silhouette and luma. A pixel with alpha > 24 is inside the form; its luma is the standard 0.299R + 0.587G + 0.114B.

2. With a custom `ShaderMaterial` that outputs object-space normals as RGB. The fragment shader computes `vec4(normalize(vObjectNormal) * 0.5 + 0.5, 1.0)`. Read pixels, decode each one: `n = (rgb / 255) * 2 - 1`.

Two read-back canvases are kept persistent. The lit canvas is shown in the SHOW 3D SOURCE debug view. The normal canvas can be shown alongside.

The two-pass cost roughly doubles the form pass's runtime but stays inside live-update budget for canvas sizes up to about 800×600.

### 2D-native species

2D-native species (filament, blob, cluster, others to come) skip three.js. They draw their form directly into a p5.js graphics buffer. The silhouette mask is derived from where they drew. The luma field is computed from a virtual lighting model (or omitted for breeds that don't need lighting).

Normals are either synthesized from the form's structure (curve tangent for filament, radial direction for disc, distance-from-center for blob) or marked as unavailable by leaving the normals array zeroed. Breeds that require normals should document a fallback or refuse to render on species that lack them.

The 2D-native form pass produces the same output structure as the 3D form pass. Breeds cannot tell the difference between sources.

## Stage 2: Tone pass

**Input:** rawLuma (a single value, 0 to 1), tone (blackPoint, whitePoint, gamma)
**Output:** remapped luma (a single value, 0 to 1)

```javascript
function applyTone(rawLuma, tone) {
  const range = tone.whitePoint - tone.blackPoint;
  if (range <= 0) return 0;
  let l = (rawLuma - tone.blackPoint) / range;
  if (l < 0) l = 0;
  else if (l > 1) l = 1;
  return Math.pow(l, tone.gamma);
}
```

The tone pass is called per-pixel inside each breed. It is not pre-computed because gamma is fast and pre-computation would prevent live tone updates without re-rendering.

The tone curve is the only place contrast shaping happens in the pipeline. Breeds do not own contrast curves. The form pass does not own contrast curves. This is enforced by code review, not by the language. Earlier versions had per-breed contrast knobs; we removed them in v8 of the torus tests.

## Stage 3: Breed pass

**Input:** silhouette, luma, normals (optional), tone, breed-specific parameters
**Output:** ink on the p5.js canvas

Each breed iterates over the form data and draws ink primitives. The breed is a linear consumer of remapped luma: increasing luma means decreasing ink (or some equivalent transformation that preserves linearity).

Breeds may differ in:

- What they read (some ignore normals; color_blocking requires them)
- What primitive they draw (lines, dots, dot layers, dot regions)
- How density scales with luma

Breeds do NOT differ in:

- The presence of their own contrast curve. They don't have one.

### The COVERAGE parameter

Some breeds have a COVERAGE parameter that caps the breed's effect at the bright extreme. With coverage = 1.0, the breed reaches its full reduction at luma = 1.0 (lit faces become bare paper). With coverage = 0.85, even the brightest pixel keeps 15% of the breed's ink.

This is necessary for faceted forms (like the arch) where each face has a near-uniform luma value. With pure luma response and no coverage, lit faces empty out completely. Coverage prevents that.

Coverage is NOT a contrast curve. It does not change the curve shape. It scales the breed's output range. The tone curve shape is unchanged. This distinction matters; without it, coverage looks identical to a contrast knob and would be removed for the same reason.

## Why object-space normals

The normal pass uses a custom shader that outputs object-space normals. Not view-space. Not world-space.

- **View-space** would mean the face facing the camera is always blue. The same physical face changes color when you rotate the mesh. Wrong for "this face has a permanent identity."
- **World-space** would mean the +Z face in world space is always front. But when the mesh rotates, the world-space normal of a given face changes. Same face, different color after rotation.
- **Object-space** means normals are in the geometry's local coordinate system. The +Z face of the geometry has normal +Z always, regardless of mesh rotation, camera position, or anything else. Each face has a permanent identity.

For a generative tool where rotation is part of the specimen's character (the artist chose this orientation as part of the specimen), object-space is correct. The colors are tied to the form's geometry. The orientation is tied to the camera view. Both are independent choices the artist can tune separately.

## Why the tone curve clips

The tone curve clamps remapped luma to [0, 1] and applies gamma after. This means values above whitePoint all map to 1, and values below blackPoint all map to 0. Information beyond the points is discarded, not compressed.

This was a deliberate choice. A soft-knee curve (e.g., S-curve at the extremes) would preserve more information but would also prevent the user from saying "everything brighter than this is the same flat tone." For breeds that respond to luma, hard clipping at the white point is desirable: it's the breed's signal to draw the lit-extreme primitive (no ink, max ink, dominant color, etc.) without ambiguity.

## Performance notes

The form pass is the expensive stage. For 3D species at 560×420, two render passes plus pixel readback takes roughly 30–60ms on a current laptop. Live slider updates use `requestAnimationFrame` to coalesce changes; one update per animation frame, regardless of how many sliders moved.

The breed pass varies wildly by breed. Stipple at default density renders in 10–20ms. Riso noise renders in 4× that because it iterates per layer. Color blocking is faster than riso noise because it does one pass with region lookup.

The tone pass is essentially free; it's a few arithmetic ops per pixel inside the breed loop.

If a future canvas size or species density pushes total per-update time above 200ms, consider:

- Reducing canvas size for live preview, then rendering full-size on demand
- Pre-computing the tone curve as a 256-entry LUT at slider-change time
- Caching the normal pass output when only breed params change (currently we re-render both passes on every form change but skip both on breed-only changes)

## Update orchestration

Two scheduling functions:

- `scheduleFormUpdate()` — runs the full form pass, then schedules a breed update
- `scheduleBreedUpdate()` — runs only the breed pass

Slider changes call one or the other depending on whether the parameter affects the form. Camera, light, geometry, rotation → form update. Tone, breed params → breed update. Both use `requestAnimationFrame` debouncing so dragging a slider doesn't queue dozens of updates.

This split is important: dragging a tone slider should feel instant because we skip the form pass entirely. Dragging a camera slider feels slightly heavier because both passes run.
