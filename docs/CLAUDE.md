# CLAUDE.md

Orientation for AI assistants and contributors. Read this before making changes.

## What this is

A generative tool for producing biological-feeling shapes. The vision is a populated canvas with many distinct specimens. The current phase is exploratory: building species and breeds individually in standalone test files, validating the pipeline, locking in patterns.

See `README.md` for project status. See `ARCHITECTURE.md` for the pipeline.

## Core distinction: species vs breed

A specimen is a *species* drawn in a *breed*.

The species defines the form. Torus, arch, filament, blob. The form has geometry (or a 2D drawing routine) and produces a silhouette mask plus a luma field and optionally normals. The species owns "what shape is this."

The breed defines the rendering style. Stipple, raster, riso noise, color blocking. The breed reads the form data and produces ink primitives on canvas. The breed owns "how is it drawn."

Species and breeds are independent. Any breed can render any species (with caveats for breeds that require normals). New species don't require new breeds. New breeds don't require new species.

## The pipeline

Three stages, in order:

1. **Form pass** produces silhouette + luma + normals. 3D species use three.js. 2D-native species produce these directly in p5.js.
2. **Tone pass** applies black point, white point, gamma to the luma field. Pure remapping. Sits between form and breed.
3. **Breed pass** consumes the (possibly remapped) form data and draws to a 2D canvas. Linear consumer of luma; should not have its own contrast curve.

The seam between stages is a typed-array data structure. The implementation behind any given form is the species author's choice.

See `ARCHITECTURE.md` for depth.

## The specimen tuple

A specimen is a JSON object containing species, breed, geometry params, camera (if 3D), light (if 3D), tone, breed params, and a seed. It is fully serializable. Two tuples with the same data produce the same image.

See `SPECIMEN.md` for the schema.

## Working patterns

This project follows the user's standard four-phase flow:

- **Recon before findings.** Understand the current state before proposing changes. View the file. Run it. See what it does.
- **Discuss before edits.** Architectural decisions go through conversation. Code follows.
- **Atomic commits.** One concern per commit. Briefing documents between sessions when useful.
- **Predictions before observations.** State what you expect a change will do, then verify.

Stale session notes are a liability. Do not trust prior summaries over the current code. When in doubt, view the file.

## Voice and code style

Short declarative sentences. No em-dashes. No AI tells: avoid "robust," "comprehensive," "elegant," "powerful," "leverage," "delve," manufactured drama, tidy resolutions. Comments are declarative and short. Variable names clear.

For prose: emotion through specificity and behavior, not declaration. For code: function names that say what they do, parameters named honestly.

When pushing back on something, state the case directly. Hedging is worse than disagreement.

## Adding a new species

1. Decide if it's 3D or 2D-native. If 3D, you'll add a three.js geometry path. If 2D-native, you'll write a p5.js drawing routine that fills the silhouette mask and luma field directly.
2. Define the geometry parameters in DEFAULTS.geometry. Add a `type` field naming the species.
3. Implement `buildSpeciesGeometry` (3D) or `drawSpeciesForm` (2D-native).
4. Wire up the SHAPE control panel sliders.
5. Test through every existing breed. The breed code should not need changes; if it does, that's a pipeline problem, not a species problem.
6. Add an entry to `SPECIES.md`.

## Adding a new breed

1. Define the breed parameters in DEFAULTS.breeds.
2. Implement `drawBreedFromForm(p, s, sp, form)`. Read silhouette, luma, optionally normals. Draw ink primitives to the p5 canvas.
3. Add the breed to the dispatch in `drawBreedFromForm`.
4. Add a radio button to the breed selector and a params panel.
5. Wire the param sliders.
6. Update reset to include the new breed defaults.
7. Test through every existing species. If a species lacks the data the breed needs (e.g., normals), document the breed as unsuitable for that species rather than degrading silently.
8. Add an entry to `BREEDS.md`.

## Where things live

- Specimen test files under `species/`: `species/specimen_<species>_v<n>.html`
- Shared pipeline code under `js/`: `breeds.js` (tone pass, breed dispatch, all eight breed functions, paper/grain/frame helpers), `form.js` (form allocation, polarity, 2D-native helpers), `species/<name>.js` (extracted form passes with DEFAULTS and random sampling; torus and blob so far)
- The pool composition page under `pool/`
- Documentation in `docs/`
- No build artifacts; everything runs from raw HTML files. Shared scripts are classic scripts defining globals, so file:// still works.

Migration state: torus and blob load the shared scripts; the other seventeen test files still carry inline copies of the breed functions. A breed fix lands in `js/breeds.js` and must be mirrored in the unmigrated files (or the file migrated) until extraction completes.

## Workflow expectations

The user works in two environments:

- **Claude (this surface)** for planning, architectural discussion, and writing complete files
- **Claude Code (local terminal)** for executing on a plan, making targeted edits, running things

When this conversation produces a file, the user reviews before accepting. When Claude Code makes a change, the user reviews before accepting. There is no autonomous merge.

Briefing documents between sessions are useful when context is large. Update `TRACKER.md` after meaningful changes.

## Things this tool is not

It is not an animation tool. The pool is a snapshot.

It is not a physics simulation. Specimens sit where they are placed.

It is not a product to be shipped to end users. It is a generative tool for the project owner, and possibly a small audience after that.
