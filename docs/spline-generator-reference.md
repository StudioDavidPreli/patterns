# Bezier Spline Generator — Style Reference

## What this document is

A specification for generating SVG bezier spline curves in a specific visual style: a single continuous stroke that wanders, loops, crosses itself, and fills the canvas with organic, thread-like energy. Think of a piece of thread dropped from a height onto a surface, or a single unbroken pen gesture that refuses to lift.

This reference is derived from statistical analysis of a hand-drawn reference curve. Use it to build generators that produce curves in the same family — not identical copies, but siblings that share the same DNA.

---

## Visual character

The curve reads as **one continuous, closed, self-crossing line** with these qualities:

- **Tangled, not chaotic.** The line crosses itself many times but never feels random. There's a rhythm: dense knotted regions alternate with longer sweeping traversals.
- **Full canvas coverage.** The curve uses the entire available width and most of the height. It doesn't huddle in a corner or leave large empty zones.
- **No fill, stroke only.** The line is a single-weight stroke (2px in the reference at ~536×360). It never closes to create filled shapes, even though the path itself is topologically closed (Z command).
- **Organic, not geometric.** No straight segments, no perfect arcs. Every transition is a cubic bezier with human-feeling control points — slightly asymmetric, slightly imperfect.
- **Varied density.** Some regions have tight clusters of short segments (the "knots"), others have long sweeping arcs. This variation is essential to the style.

---

## Structural anatomy

### Path topology

- **Closed path** (M...Z). Start and end points coincide.
- **Single continuous stroke.** No breaks, no subpaths.
- **Self-crossing.** The curve crosses over itself approximately 10-15 times across the canvas.

### Segment inventory (reference curve: 47 segments)

| Command | Count | Role |
|---------|-------|------|
| `c` (relative cubic bezier) | 28 | Primary curve segments |
| `s` (relative smooth cubic) | 18 | Continuation segments with C1 continuity |
| `C` (absolute cubic bezier) | 1 | Used near closure point |
| `M` | 1 | Starting point |
| `Z` | 1 | Path closure |

The mix of `c` and `s` commands is important. `s` segments create smooth continuity at joints (the first control point is reflected from the previous segment's second control point). The reference curve uses `s` about 38% of the time — this is what gives the line its flowing quality rather than feeling like a series of disconnected arcs.

### Segment count guideline

For a ~536×360 canvas: **40-55 segments** is the sweet spot. Fewer makes the curve too smooth and geometric. More makes it too noisy.

Scale proportionally with canvas area:
```
segments ≈ 47 × (canvas_area / (536 × 360))^0.5
```

---

## Statistical profile

These are the distributions that define the style. A generator should sample from these ranges, not use fixed values.

### Chord length distribution (endpoint-to-endpoint distance per segment)

| Range | Frequency | Character |
|-------|-----------|-----------|
| 0–20px | ~6% | Tight knots, near-stationary loops |
| 20–40px | ~36% | Short moves, the curve's "texture" |
| 40–60px | ~11% | Medium transitions |
| 60–80px | ~6% | Moderate sweeps |
| 80–100px | ~13% | Long arcs |
| 100–150px | ~23% | Major traversals across the canvas |
| 150–200px | ~4% | Rare dramatic sweeps |

**Key insight:** The distribution is bimodal — it peaks at short (20-40px) and long (100-150px) segments, with fewer medium ones. This creates the signature rhythm of knot-then-sweep.

**Median chord: ~47px. Mean: ~67px.** The mean is pulled up by the long traversals.

### Turn angle distribution (change in heading between consecutive segments)

| Range | Frequency |
|-------|-----------|
| 0–30° | ~32% |
| 30–60° | ~38% |
| 60–90° | ~19% |
| 90–120° | ~9% |
| 120–180° | ~2% |

**Key insight:** 70% of turns are under 60°. The curve rarely makes sharp reversals. It prefers gradual direction changes, occasionally punctuated by sharper turns. Extreme U-turns (>120°) are very rare.

**Turn direction:** Slightly CCW-biased (29 CCW vs 17 CW in the reference), but close enough to balanced that a generator should aim for roughly even distribution with slight random bias.

### Control point reach ratios (distance from anchor to control point, as fraction of chord length)

| Ratio range | CP1 frequency | CP2 frequency |
|-------------|---------------|---------------|
| 0–0.1 | ~30% | ~32% |
| 0.1–0.2 | ~23% | ~23% |
| 0.2–0.4 | ~40% | ~30% |
| 0.4–0.6 | ~2% | ~11% |
| 0.6–1.0 | ~4% | ~4% |

**Key insight:** Most control points stay close to their anchor — within 0-0.4× the chord length. The mean ratio is ~0.24. This keeps curves from becoming too wild or loopy. The occasional high-reach (0.6-1.0) control point is what creates the dramatic loops.

### Departure angle distribution (direction the curve heads from each anchor)

Nearly uniform across all quadrants (9/12/11/14 across four 90° buckets). The curve has **no preferred direction** — it wanders omnidirectionally.

### Vertical oscillation

The reference curve crosses its own vertical midline **12 times** across 47 segments. This means the curve constantly oscillates vertically — it doesn't settle into horizontal bands.

**Y direction reversals: 27** (out of 46 possible). The curve reverses vertical direction more than half the time, creating constant up-and-down energy.

**X direction reversals: 15.** The curve backtracks horizontally less often, giving a slight overall sense of left-to-right progression even though the net horizontal displacement is zero (closed path).

---

## Generation algorithm

### Approach: Guided random walk with bezier segments

The generator works by placing anchor points along a wandering path, then fitting cubic bezier segments between them with control points sampled from the distributions above.

### Step 1: Generate the anchor point sequence

```
canvas_width = W
canvas_height = H
num_segments = round(47 * sqrt(W*H / (536*360)))
margin = min(W, H) * 0.02  // small margin, curve should nearly touch edges

// Start point: random position, biased toward left-center
start = (random(margin, W*0.15), random(H*0.4, H*0.85))

// Generate waypoints using a random walk
anchors = [start]
for i in 1..num_segments:
    // Sample chord length from the bimodal distribution
    chord = sample_chord_length()
    
    // Sample turn angle and apply to current heading
    heading += sample_turn_angle() * random_sign()
    
    // Compute next anchor
    dx = chord * cos(heading)
    dy = chord * sin(heading)
    next = (current.x + dx, current.y + dy)
    
    // Soft-clamp to canvas with elastic bounce
    next = elastic_contain(next, margin, W-margin, margin, H-margin)
    
    anchors.append(next)

// Close: smooth return to start over final 2-3 segments
```

### Step 2: Chord length sampling

Use a mixture distribution to get the bimodal character:

```
function sample_chord_length():
    // 42% chance: short segment (knot texture)
    // 13% chance: medium segment
    // 40% chance: long traversal
    // 5% chance: dramatic sweep
    r = random()
    if r < 0.42:
        return random_range(12, 45)      // short
    elif r < 0.55:
        return random_range(45, 80)      // medium  
    elif r < 0.95:
        return random_range(80, 150)     // long
    else:
        return random_range(150, 200)    // dramatic
```

Scale these ranges proportionally to canvas size:
```
scale_factor = sqrt(canvas_area / reference_area)
```

### Step 3: Turn angle sampling

```
function sample_turn_angle():
    // Weighted toward gentle turns
    r = random()
    if r < 0.32:
        return random_range(0, 30) * DEG_TO_RAD
    elif r < 0.70:
        return random_range(30, 60) * DEG_TO_RAD
    elif r < 0.89:
        return random_range(60, 90) * DEG_TO_RAD
    elif r < 0.98:
        return random_range(90, 120) * DEG_TO_RAD
    else:
        return random_range(120, 150) * DEG_TO_RAD
```

### Step 4: Control point placement

For each segment between anchors[i] and anchors[i+1]:

```
function generate_control_points(start, end, chord_length):
    // Sample reach ratios
    cp1_ratio = sample_cp_ratio()
    cp2_ratio = sample_cp_ratio()
    
    // CP1: offset from start
    cp1_angle = heading_at_start + random_range(-45, 45) * DEG_TO_RAD
    cp1 = start + (cos(cp1_angle), sin(cp1_angle)) * cp1_ratio * chord_length
    
    // CP2: offset from end (pointing "backward" into the curve)
    cp2_angle = heading_at_end + PI + random_range(-45, 45) * DEG_TO_RAD
    cp2 = end + (cos(cp2_angle), sin(cp2_angle)) * cp2_ratio * chord_length
    
    return (cp1, cp2)

function sample_cp_ratio():
    r = random()
    if r < 0.30:
        return random_range(0.02, 0.10)
    elif r < 0.53:
        return random_range(0.10, 0.20)
    elif r < 0.88:
        return random_range(0.20, 0.40)
    elif r < 0.95:
        return random_range(0.40, 0.60)
    else:
        return random_range(0.60, 0.90)
```

### Step 5: Smooth cubic (s) segments

Use `s` commands for approximately 35-40% of segments. These work best:
- After a `c` segment when you want the curve to continue smoothly
- In sequences of 2-3 consecutive `s` segments for flowing runs
- In the middle of long sweeping sections (not in tight knots)

An `s` segment only specifies CP2 and the endpoint — CP1 is the reflection of the previous segment's CP2. This enforces C1 continuity at the joint.

### Step 6: Canvas containment

The curve must fill the canvas without leaving it. Use elastic containment:

```
function elastic_contain(point, x_min, x_max, y_min, y_max):
    // If the point is outside bounds, reflect it back with dampening
    if point.x < x_min:
        point.x = x_min + (x_min - point.x) * 0.3
    if point.x > x_max:
        point.x = x_max - (point.x - x_max) * 0.3
    // Same for y
    // Also perturb the heading to point back toward center
    return point
```

Additionally, add a gentle centering force that increases with distance from the canvas center:

```
center_pull = 0.05 * distance_from_center / canvas_diagonal
heading += atan2(center.y - current.y, center.x - current.x) * center_pull
```

### Step 7: Closing the path

The last 2-3 segments should guide the curve back toward the start point:

```
// When nearing the end (last 3 segments), blend heading toward start
remaining = num_segments - i
if remaining <= 3:
    angle_to_start = atan2(start.y - current.y, start.x - current.x)
    heading = lerp(heading, angle_to_start, 1.0 - remaining/4.0)
```

End with a `Z` command after the final segment endpoint coincides (or nearly coincides) with the start.

---

## SVG output format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
  <path
    d="M{start.x},{start.y} c{...} s{...} c{...} ... Z"
    fill="none"
    stroke="#262626"
    stroke-width="2"
    stroke-miterlimit="10"
  />
</svg>
```

### Formatting conventions

- Use relative commands (`c`, `s`) for compactness. Only use absolute (`C`) if needed near the closure point.
- Coordinate precision: 2 decimal places (e.g., `c3.61,7.94,74.51-41.53,85.51-42.53`).
- Omit spaces where SVG path syntax allows (negative signs serve as delimiters).
- Single `<path>` element. No groups, no layers, no transforms.
- `stroke-miterlimit="10"` prevents miter spikes at sharp joins.

---

## Tunable parameters

These knobs let you shift the character while staying in the same family:

| Parameter | Lower | Default | Upper | Effect |
|-----------|-------|---------|-------|--------|
| `density` | 0.5 | 1.0 | 2.0 | Multiplier on segment count |
| `knottiness` | 0.2 | 0.42 | 0.7 | Probability of short segments (more = tighter tangles) |
| `sweep_length` | 60 | 120 | 200 | Max length of long traversal segments |
| `turn_sharpness` | 0.5 | 1.0 | 2.0 | Multiplier on sampled turn angles |
| `cp_reach` | 0.5 | 1.0 | 2.0 | Multiplier on control point reach ratios |
| `smoothness` | 0.2 | 0.38 | 0.6 | Fraction of segments using `s` (smooth cubic) |
| `canvas_fill` | 0.6 | 0.95 | 1.0 | How much of the canvas the curve should occupy |
| `stroke_weight` | 1 | 2 | 4 | Stroke width in px |

### Preset combinations

**Tight scribble:** `density=1.5, knottiness=0.6, sweep_length=80, turn_sharpness=1.5`

**Flowing ribbon:** `density=0.7, knottiness=0.25, sweep_length=180, turn_sharpness=0.6, smoothness=0.5`

**Reference match:** All defaults.

**Sparse wanderer:** `density=0.6, knottiness=0.3, sweep_length=160, turn_sharpness=0.8, cp_reach=0.7`

---

## Implementation notes

### Language targets

This algorithm translates cleanly to:

- **JavaScript / p5.js** — natural fit for interactive/generative use, SVG string output or Canvas rendering
- **Python** — good for batch generation, SVG file output
- **ExtendScript (JSX)** — for generating paths directly in Illustrator or After Effects
- **React component** — wrapping the JS generator with controls for the tunable parameters

### Random seeding

All randomness should be seedable for reproducibility. Use a PRNG (e.g., mulberry32, xoshiro) rather than `Math.random()` so that a given seed always produces the same curve.

### Post-processing options

- **Path simplification:** Run the generated path through a simplification pass (Ramer-Douglas-Peucker on the sampled points) if segment count needs to be reduced.
- **Path smoothing:** Apply Chaikin's corner cutting (1-2 iterations) to soften any remaining sharp joints.
- **Viewbox fitting:** After generation, compute the actual bounding box of the path and adjust the SVG viewBox to fit tightly with a small margin.

### Validation checklist

A generated curve is "in style" if:

- [ ] Single closed path, no breaks
- [ ] Self-crosses at least 5 times
- [ ] Uses 80%+ of canvas area (bounding box vs canvas)
- [ ] Has at least 3 segments under 30px chord length (knot presence)
- [ ] Has at least 3 segments over 100px chord length (sweep presence)
- [ ] No two consecutive segments exceed 150px each (prevents runaway lines)
- [ ] 30-50% of segments use smooth cubic (`s`) commands
- [ ] Stroke only, no fill

---

## Reference curve (original SVG path data)

For direct comparison during development:

```
M1.17,281.89c3.61,7.94,74.51-41.53,85.51-42.53s14.18,11.08,25.7,11.08c9,0,1.06,78.42,9.3,78.42s21.8-79.73,28.8-83.73,25.25-.44,33,6.03c7.08,5.91,8.52,23.2,13.52,27.2s5.87,20.77,6.05,27.76c.3,11.22,9.96,3.02,9.75,10.63-.16,5.55-2.07,7.97,6.5,9.16,5.33.74,4.15,33.86,9.75,33.38,6.79-.59,1.39-35.27,9.75-40.76,9.45-6.2-6.34-37.14-.59-38.1,12.41-2.07,2.86-26.31,8.86-31.31,1.1-.92,16.53-3.77,20.68,1.48,14.47,18.31,25.67,64.06,32.19,63.8,7.38-.3-2.68-116.9,3.25-121.98,4.14-3.54,12.27-3.18,21.27-1.18s39.3,65.32,44.3,62.32-22.22-79.47-24.51-101.01c-2.95-27.76,5.13-41.17,29.24-19.79s46.67,79.16,54.35,77.98c5.04-.78-6.5-42.83.59-43.12,8.26-.34,105.15,30.42,106.63,25.7,1.74-5.57-90.4-37.1-91.56-41.06-2.95-10.04,7.68-25.4,2-28.08s-17,7-27,7-25.1-8.84-26.1-15.84-.97-15.01-4.73-18.31c-12.11-10.63-23.04-96.28-32.49-95.99s.98,86.15-5.02,92.15-17.45-23.38-22.45-20.38,1.1,22.17-3.54,26.58c-5.91,5.61-25.7-34.85-29.83-31.31-5.37,4.6,30.03,65.91,27.47,76.79-2.36,10.04-13.33,20.24-23.33,16.24s-59.87-97.52-65.87-94.52,40.83,103.83,42.83,112.83,7.45,44.14-1.48,48.73c-9.75,5.02-60.84-103.35-65.57-101.9s27.76,84.47,21.86,102.2c-4.11,12.33-32.26,10.05-47.26-2.95s-2.95-97.47-10.34-98.95c-11.18-2.24-23.63,87.43-32.15,96.61-6.28,6.78-19.83-1.8-24.56-13.32-6.04-14.72-17.27-188.91-26.88-187.26-7.95,1.36,11.18,156.48.74,177.36C78.26,222.96-3.26,272.14,1.17,281.89Z
```

Canvas: `viewBox="0 0 536.06 360.28"`
Stroke: `#262626`, 2px, miter limit 10
