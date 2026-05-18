# Drawing Digital Organisms: A Study in Procedural Shape Generation

## What This Is

This document describes a method for generating images of imaginary organisms — branching, spiny, coral-like forms that look like they belong under a microscope. The shapes are not drawn by hand. They are grown by software following a set of rules, then rendered mark-by-mark to produce images with the texture of hand-placed ink, stipple, or mosaic tile.

The method was developed as part of a shape-building tool for creating digital specimens — a library of synthetic microorganisms that can be rendered in different visual styles.

---

## The Core Idea

Every organism in this system is built in two completely separate steps:

**First, define the form.** This is the invisible skeleton — a branching tree of curved lines, like the veins in a leaf or the branching pattern of a river delta. Each branch has a thickness that tapers from base to tip. The skeleton is not drawn directly. Instead, it creates a kind of topographic map: every point on the canvas gets a value representing how close it is to the nearest branch. Points right on a branch get the highest value. Points far from any branch get zero. Points near the edge of a branch get intermediate values.

**Second, render the image.** A rendering function walks across the canvas pixel by pixel. At each position, it reads the topographic map and decides what mark to place — or whether to place one at all. Points deep inside the form get dense, dark marks. Points near the edge get sparse, lighter marks. Points outside get nothing. The marks are small rectangles, not smooth fills, giving the image a hand-made, mosaic quality.

This separation means the same skeleton can be rendered in many different visual styles (dense black stipple, loose blue hatching, color-stratified mosaic) without changing the underlying form. And the same visual style can be applied to different skeletons.

---

## How the Skeleton Grows

The skeleton starts with a spine — a roughly horizontal chain of curved segments that traverses the canvas like a meandering river. At each joint along the spine, branches sprout upward and downward at steep angles. Those branches may subdivide further, producing secondary branches, tertiary forks, and so on up to a configurable depth.

Each connection between two points is not a straight line. It follows a smooth curve (a cubic Bézier curve), bowing to one side like a bent twig. This curvature is what makes the forms read as organic rather than mechanical. Straight lines suggest human construction — scaffolding, circuit boards, architectural framing. Curves suggest growth, where each part of the organism followed the path of least resistance as it extended.

The branches get thinner as they subdivide. A trunk might be 18 pixels wide; its children might be 8; their children might be 3. By the time a branch reaches the terminal tips, it's barely a thread. This taper is controlled by a single multiplier applied at each level of subdivision.

Small spines — sharp conical protrusions — can be added along the curves. These project outward from the branch surfaces at varied angles, giving the form a thorny, prickly quality. Their placement is governed by noise (a mathematical function that produces smooth randomness), ensuring they appear irregular rather than evenly spaced.

---

## The Distance Field: A Topographic Map of Proximity

The key intermediate product is the distance field — a grayscale image where brightness represents closeness to the skeleton. Imagine the skeleton as a wire armature submerged in clay. The distance field is a cross-section of the clay, showing where it's thick (near the wire) and where it thins to nothing (at the outer surface).

Technically, for each pixel on the canvas, the system computes the distance to the nearest point on the nearest curved branch. It then divides by the branch's width at that point (accounting for taper) and subtracts from 1.0. The result is a normalized value between 0 and 1:

- 1.0 means the pixel is exactly on the skeleton centerline.
- 0.5 means it's halfway between the centerline and the boundary.
- 0.0 means it's right at the edge.
- Below 0.0 means it's outside the form entirely.

Where branches overlap — at junctions and forks — the system takes the maximum value, naturally producing smooth thickening at intersection points, like the webbing between fingers or the crotch of a tree branch.

---

## Color Bands: Painting by Elevation

The distance field is divided into bands, like elevation zones on a topographic map:

**The core** (values above ~0.55) represents the deep interior — the marrow of the bone, the vascular tissue at the center of a stem. In the current rendering, this region gets dense black marks, reading as a dark spine running through the center of each branch.

**The body** (values between ~0.18 and ~0.55) is the main mass of the organism. It receives medium-density blue marks — the primary color of the form.

**The edge** (values between 0 and ~0.18) is the outer fringe, where the form dissolves into the background. Marks here are sparse and translucent, creating a soft boundary rather than a hard outline.

**Red accents** appear sporadically within the body and edge bands. They're driven by a second, independent noise field — a separate layer of smooth randomness that has no relationship to the skeleton structure. Where this noise exceeds a threshold, marks switch from blue to red. The result is irregular red patches distributed across the form, like pigmentation spots on a biological specimen.

---

## The Mark-by-Mark Aesthetic

The rendering deliberately avoids smooth fills, gradients, or anti-aliased curves. Instead, every visible element is composed of individual rectangular marks — small colored tiles placed on a grid with slight positional jitter. This approach has several consequences for the visual quality of the output:

The forms have a hand-placed quality. Each mark is a discrete decision — this color, this size, this position — rather than a continuous mathematical surface. The eye reads the aggregate as a textured surface with material presence, like ink stamped onto paper or tiles pressed into wet plaster.

The edges are inherently rough. Because marks are placed probabilistically (each pixel position has a chance of receiving a mark based on the density for its band), the boundary between the form and the background is never a clean line. It's a stochastic fringe of scattered marks, more like the edge of a moss colony than the edge of a sticker.

Color mixing happens optically. Where blue marks and red marks are interleaved, the viewer perceives a purple-ish zone, but no purple pixels exist. Each mark is fully blue or fully red. The mixing is a property of the viewer's perception, not the image data. This is the same principle as pointillism and risograph printing.

---

## Biological Parallels

The forms produced by this method are not replicas of real organisms. They are synthetic — generated by rules that mimic aspects of biological growth without modeling the underlying biology. However, several structural features echo real biological patterns:

**Branching morphogenesis** — the recursive subdivision of the skeleton resembles the growth patterns of vascular systems, bronchial trees, neural dendrites, and coral polyps. In biology, these structures arise from reaction-diffusion processes and tip-splitting instabilities. In this system, they arise from a much simpler recursive algorithm, but the visual kinship is strong because branching-with-taper is a structural signature shared across scales and kingdoms.

**Radial symmetry and asymmetry** — the reference organisms targeted by this system span the symmetry spectrum. Diatoms and radiolaria exhibit precise radial symmetry. Amoebae and slime molds are fully asymmetric. The skeleton generation can produce both: by constraining branching to mirror across an axis, or by allowing fully random placement.

**Pigmentation patterns** — the red accent system, driven by noise independent of the form, parallels the way pigmentation in biological organisms is often governed by reaction-diffusion systems operating on the surface of the organism, producing patterns (spots, stripes, patches) that are structurally unrelated to the underlying anatomy.

---

## What the Tool Produces

The end product is an image — a PNG of a single specimen rendered on a neutral background. The image is the artifact. Maps, geometry, and skeletons are intermediate products that exist only to generate the image.

A specimen is fully described by its parameter set (the SPECIMEN tuple): skeleton configuration, curve parameters, spike settings, band thresholds, mark properties, and random seed. Given the same tuple, the system produces an identical image. This reproducibility means specimens can be shared, catalogued, and revisited by exchanging small JSON objects rather than large image files.

The tool is interactive: parameters are adjusted via sliders, and the image updates to reflect changes. The user shapes the organism through parameter exploration rather than direct drawing — adjusting the branching probability to see what a denser form looks like, pulling the taper slider to watch branches thin, toggling the skeleton overlay to understand why a particular junction looks the way it does.

---

## Relationship to Existing Practice

This method sits at the intersection of several established practices:

**Procedural content generation** — the algorithmic creation of visual content through rules rather than manual authoring. The approach shares DNA with L-systems (Lindenmayer systems), which model plant growth through string rewriting, and with space colonization algorithms, which grow branching structures by competition for resources.

**Computational illustration** — the use of code to produce images with the visual qualities of hand-made illustration. The mark-by-mark rendering is directly inspired by traditional stipple, hatching, and pointillist techniques, translated into a programmable per-pixel decision process.

**Generative art** — the creation of visual work through systems that introduce controlled randomness. Each seed produces a unique organism, and the parameter space defines a family of possible forms. The artist's role shifts from drawing individual specimens to designing the system that generates them.

**Scientific illustration** — the tradition of detailed, accurate depiction of biological specimens. While this system does not aim for scientific accuracy, it borrows the visual vocabulary of scientific illustration: isolated specimens on neutral backgrounds, emphasis on structural clarity, color used to reveal internal organization rather than for decorative effect.

---

## Technical Requirements

The tool runs in a web browser using p5.js (a JavaScript creative coding library) for 2D canvas rendering. No server, GPU, or specialized hardware is required. The computational bottleneck is the distance field calculation, which evaluates distance to the skeleton at every pixel on the canvas — roughly 500,000 evaluations for a 700×700 image, each checking distance to 200+ curve sub-segments. This takes approximately 0.5–2 seconds on a modern laptop.

The mark rendering pass is fast (under 100ms) and reads from the cached distance field, enabling rapid iteration on visual style without regenerating the underlying geometry.
