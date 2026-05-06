# Block & Line

A pattern generator for printed-feel compositions. p5.js, single HTML
file, no build step. Two integer seeds drive the result. Sliders
control everything in between.

## What it makes

Colored rectangles on a paper-grain background, overprinted with ink
stripes. Stripes can be black, white-on-dark, jittered, broken,
horizontal, vertical. Subdivisions for color and stroke run
independently and can be tied together with a toggle.

## How it works

Two recursive subdivisions split the canvas into cells. A color layer
underneath, a stroke layer on top.

- `layoutSeed` controls geometry and every per-cell decision: which
  cells fill, which way the stripes run, whether the ink is black or
  white, the per-cell stroke-variance rolls.
- `renderSeed` controls palette picks only.
- A `layoutSeed`-derived constant seeds line jitter and breakage.

The seeds are independent in fact, not just in name. "New layout"
reshapes the geometry without disturbing the palette. "New colors"
rotates the palette without moving a rectangle.

## Controls

A 252-pixel sidebar runs five groups of sliders, top to bottom:
Composition, Color, Stroke, Texture, Animation. A "Randomize all"
button at the top walks every slider and rerolls both seeds. "New
layout" and "New colors" sit at the bottom alongside PNG and SVG
export.

Threshold sliders (fill density, white-on-dark share, etc.) re-run
per-cell decisions against a stable seeded stream, so raising a
threshold only flips cells whose roll just crossed the new value.
The cell rectangles stay put.

## Animation

Four toggles, one tick. Layout, colors, ratio, and randomize-all,
each ticking on a shared setTimeout. They compose. Pause clears all
four and stops the timer; the current frame stays on screen for PNG
or SVG capture.

## Specimen names

Each pattern carries a Latin binomial. The genus is drawn from a
forty-entry pool by `layoutSeed % 40`. The species from another
forty-entry pool by `renderSeed % 40`.

Modulo, not hash. Same first word means same `layoutSeed mod 40`.
Same second word means same `renderSeed mod 40`. The mapping is
intentionally observable.

The binomial is a tag, not a taxonomy. No Latin grammatical
agreement is enforced. *Linea nigrofracta* is not classically
correct. *Granum discolor* is shaky. The system is not trying to
fool a classicist.

## Run it

Single static file. Open it in a browser, or serve the folder from
anything that serves files.

```bash
git clone https://github.com/StudioDavidPreli/patterns.git
cd patterns
open block_patterns_v1.html
```

For local serving with live reload:

```bash
npx serve .
```

## Files

- `block_patterns_v1.html` — the tool
- `block_and_line_case_study.html` — the case study writeup

## Stack

p5.js 1.9 via CDN. IBM Plex Mono and IBM Plex Serif via Google Fonts.
No build, no dependencies beyond the CDN imports.

## License

Studio David Preli, 2026. Personal portfolio work.
