/* breeds.js
   The shared tone pass and breed pass. One copy for all species files
   and the pool page. Extracted verbatim from specimen_torus_v10.html
   (the reference implementation) on 2026-06-12.

   Classic script, not a module. Defines globals so species pages
   (whose main script is type="module") and the pool page can call
   these functions without imports. Loads over file:// and over HTTP.

   Contract: every breed function is a stateless consumer of
   (p, s, sp, form) where
     p    = p5 instance, already seeded by the caller
     s    = the specimen tuple (breed name, tone, inkColor, inkAlpha,
            polarity, per-breed params under s.breeds)
     sp   = s.breeds[s.breed], the active breed's params
     form = { silhouette, luma, normals, W, H } typed arrays
   Dispatch is per specimen via drawBreedFromForm(p, s, form), so each
   specimen on a shared canvas renders its own breed with its own
   params independently.

   Breeds do not own contrast curves. Tone shaping happens only in
   applyTone. See docs/ARCHITECTURE.md. */

/* ---------- Tone pass ---------- */

function applyTone(rawLuma, tone) {
  const range = tone.whitePoint - tone.blackPoint;
  if (range <= 0) return 0;
  let l = (rawLuma - tone.blackPoint) / range;
  if (l < 0) l = 0;
  else if (l > 1) l = 1;
  return Math.pow(l, tone.gamma);
}

/* ---------- Breed dispatch ---------- */

function drawBreedFromForm(p, s, form) {
  const params = s.breeds[s.breed];
  if      (s.breed === "raster_vertical") drawRasterFromForm(p, s, params, form);
  else if (s.breed === "stipple")         drawStippleFromForm(p, s, params, form);
  else if (s.breed === "halftone")        drawHalftoneFromForm(p, s, params, form);
  else if (s.breed === "riso_noise")      drawRisoNoiseFromForm(p, s, params, form);
  else if (s.breed === "color_blocking")  drawColorBlockingFromForm(p, s, params, form);
  else if (s.breed === "outline")         drawOutlineFromForm(p, s, params, form);
  else if (s.breed === "color_cluster")  drawColorClusterFromForm(p, s, params, form);
  else if (s.breed === "dot_matrix")    drawDotMatrixFromForm(p, s, params, form);
}

/* ---------- Breed: raster vertical ---------- */

function drawRasterFromForm(p, s, sp, form) {
  const { silhouette, W: fW, H: fH } = form;
  p.stroke(s.inkColor[0], s.inkColor[1], s.inkColor[2], s.inkAlpha);

  for (let cx = 0; cx < p.width; cx += sp.spacing) {
    const fx = Math.floor(cx);
    if (fx < 0 || fx >= fW) continue;
    let runStart = -1;
    for (let fy = 0; fy <= fH; fy++) {
      const inForm = fy < fH ? silhouette[fy * fW + fx] === 1 : false;
      if (inForm && runStart < 0) {
        runStart = fy;
      } else if (!inForm && runStart >= 0) {
        drawRasterColumnRun(p, s, sp, fx, runStart, fy - 1, form, cx);
        runStart = -1;
      }
    }
  }
}

function drawRasterColumnRun(p, s, sp, fx, fyStart, fyEnd, form, cxBase) {
  const tone = s.tone;
  const segLen = sp.segmentLen;
  const jitterRange = Math.max(1.5, segLen * 0.25);
  const jx = p.random(-sp.jitterX, sp.jitterX);

  let fy = fyStart;
  while (fy < fyEnd) {
    const fySegEnd = Math.min(fy + segLen + p.random(-jitterRange, jitterRange), fyEnd);
    const fyMid = Math.floor((fy + fySegEnd) / 2);
    const lIdx = fyMid * form.W + fx;
    const l = applyTone(form.luma[lIdx], tone);

    const dropP = l;

    if (p.random() > dropP) {
      const baseW = sp.weightBase * (1 + p.random(-sp.weightVar, sp.weightVar));
      const lumaWeightMult = 1.15 - l * sp.lumaWeight;
      p.strokeWeight(Math.max(0.4, baseW * lumaWeightMult));

      const cy1 = fy + p.random(-0.3, 0.3);
      const cy2 = fySegEnd + p.random(-0.3, 0.3);
      const cxJ1 = cxBase + jx + p.random(-0.25, 0.25);
      const cxJ2 = cxBase + jx + p.random(-0.25, 0.25);
      p.line(cxJ1, cy1, cxJ2, cy2);
    }
    fy = fySegEnd + p.random(0, Math.max(0.4, segLen * 0.1));
  }
}

/* ---------- Breed: stipple ---------- */

function drawStippleFromForm(p, s, sp, form) {
  const { silhouette, luma, W: fW, H: fH } = form;
  const tone = s.tone;
  p.noStroke();

  for (let y = 0; y < fH; y++) {
    for (let x = 0; x < fW; x++) {
      const idx = y * fW + x;
      if (silhouette[idx] !== 1) continue;

      const l = applyTone(luma[idx], tone);
      const localDensity = sp.density * (1 - l);

      if (p.random() > localDensity) continue;

      const jx = p.random(-sp.jitter, sp.jitter);
      const jy = p.random(-sp.jitter, sp.jitter);
      const dotSize = sp.dotSizeBase * (1 + p.random(-sp.dotSizeVar, sp.dotSizeVar));

      const alpha = s.inkAlpha * (1 - l * 0.18);
      p.fill(s.inkColor[0], s.inkColor[1], s.inkColor[2], alpha);

      p.circle(x + jx, y + jy, Math.max(0.4, dotSize));
    }
  }
}

/* ---------- Breed: halftone ---------- */
/* Walks a canvas-aligned grid; one circle per cell whose diameter
   scales with (1 - luma·coverage). Coverage caps how much the lit
   extreme erases the dot. Grid is canvas-aligned, not specimen-
   aligned, so multiple specimens later sharing one canvas will share
   grid alignment by default. */

function drawHalftoneFromForm(p, s, sp, form) {
  const { silhouette, luma, W: fW, H: fH } = form;
  const tone = s.tone;
  p.noStroke();
  p.fill(s.inkColor[0], s.inkColor[1], s.inkColor[2], s.inkAlpha);

  const cell = Math.max(1, sp.cellSize);
  const halfCell = cell * 0.5;
  const dotMax = cell * sp.dotSize;
  const useJitter = sp.jitter > 0;

  for (let cy = halfCell; cy < fH; cy += cell) {
    for (let cx = halfCell; cx < fW; cx += cell) {
      const fx = Math.floor(cx);
      const fy = Math.floor(cy);
      const idx = fy * fW + fx;
      if (silhouette[idx] !== 1) continue;

      const l = applyTone(luma[idx], tone);
      const diameter = dotMax * (1 - l * sp.coverage);
      if (diameter < 0.3) continue;

      let dx = 0, dy = 0;
      if (useJitter) {
        dx = p.random(-sp.jitter, sp.jitter);
        dy = p.random(-sp.jitter, sp.jitter);
      }
      p.circle(cx + dx, cy + dy, diameter);
    }
  }
}

/* ---------- Breed: riso noise ---------- */

function drawRisoNoiseFromForm(p, s, sp, form) {
  const { silhouette, luma, W: fW, H: fH } = form;
  const tone = s.tone;
  p.noStroke();

  // Iterate per layer so each layer's color, offset, and luma response
  // are applied independently. Layers paint in order; later layers sit
  // on top of earlier ones.
  for (const layer of sp.layers) {
    p.fill(layer.color[0], layer.color[1], layer.color[2], layer.color[3]);
    const offX = layer.offset[0] * sp.misreg;
    const offY = layer.offset[1] * sp.misreg;

    for (let y = 0; y < fH; y++) {
      for (let x = 0; x < fW; x++) {
        const idx = y * fW + x;
        if (silhouette[idx] !== 1) continue;

        const l = applyTone(luma[idx], tone);

        // density = base * mult * (1 - l * lumaResponse)
        // Positive response weights toward shadow (low l).
        // Negative response weights toward light  (high l).
        let layerDensity = sp.density * layer.densityMult * (1 - l * layer.lumaResponse);
        if (layerDensity <= 0) continue;
        if (layerDensity > 1)  layerDensity = 1;

        if (p.random() > layerDensity) continue;

        const jx = p.random(-sp.jitter, sp.jitter) + offX;
        const jy = p.random(-sp.jitter, sp.jitter) + offY;
        const dotSize = sp.dotSizeBase * (1 + p.random(-sp.dotSizeVar, sp.dotSizeVar));

        p.circle(x + jx, y + jy, Math.max(0.4, dotSize));
      }
    }
  }
}

/* ---------- Breed: color blocking ---------- */

function drawColorBlockingFromForm(p, s, sp, form) {
  const { silhouette, luma, normals, W: fW, H: fH } = form;
  const tone = s.tone;
  p.noStroke();

  for (let y = 0; y < fH; y++) {
    for (let x = 0; x < fW; x++) {
      const idx = y * fW + x;
      if (silhouette[idx] !== 1) continue;

      const l = applyTone(luma[idx], tone);

      const ni = idx * 3;
      const nx = normals[ni], ny = normals[ni + 1], nz = normals[ni + 2];

      let color = sp.defaultColor;
      for (const region of sp.regions) {
        const dot = nx * region.dirX + ny * region.dirY + nz * region.dirZ;
        if (dot > region.threshold) {
          color = region.color;
          break;
        }
      }

      const shadeMod = 1 - l * sp.shading;
      const density = sp.density * Math.max(0, shadeMod);
      if (p.random() > density) continue;

      const jx = p.random(-sp.jitter, sp.jitter);
      const jy = p.random(-sp.jitter, sp.jitter);
      const dotSize = sp.dotSizeBase * (1 + p.random(-sp.dotSizeVar, sp.dotSizeVar));

      const alpha = color[3] * (1 - l * sp.shading * 0.5);
      p.fill(color[0], color[1], color[2], Math.max(20, alpha));
      p.circle(x + jx, y + jy, Math.max(0.4, dotSize));
    }
  }
}

/* ---------- Breed: outline ---------- */

function drawOutlineFromForm(p, s, sp, form) {
  const { silhouette, W: fW, H: fH } = form;
  p.noStroke();
  p.fill(s.inkColor[0], s.inkColor[1], s.inkColor[2], s.inkAlpha);

  const weight = sp.weight;
  const useJitter = sp.jitter > 0;

  for (let y = 0; y < fH; y++) {
    for (let x = 0; x < fW; x++) {
      const idx = y * fW + x;
      if (silhouette[idx] !== 1) continue;

      const left  = x > 0      ? silhouette[idx - 1]  : 0;
      const right = x < fW - 1 ? silhouette[idx + 1]  : 0;
      const up    = y > 0      ? silhouette[idx - fW]  : 0;
      const down  = y < fH - 1 ? silhouette[idx + fW]  : 0;

      if (left && right && up && down) continue;

      let jx = 0, jy = 0;
      if (useJitter) {
        jx = p.random(-sp.jitter, sp.jitter);
        jy = p.random(-sp.jitter, sp.jitter);
      }

      p.circle(x + jx, y + jy, weight);
    }
  }
}

/* ---------- Breed: color cluster ---------- */

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function generatePalette(baseH, baseS, baseL, harmony) {
  const wrap = h => ((h % 360) + 360) % 360;
  let colors;
  switch (harmony) {
    case "complementary":
      colors = [[baseH, baseS, baseL], [wrap(baseH + 180), baseS, baseL]];
      break;
    case "analogous":
      colors = [[wrap(baseH - 30), baseS, baseL], [baseH, baseS, baseL], [wrap(baseH + 30), baseS, baseL]];
      break;
    case "monochromatic":
      colors = [
        [baseH, baseS, Math.max(10, baseL - 20)],
        [baseH, baseS, baseL],
        [baseH, baseS, Math.min(90, baseL + 20)]
      ];
      break;
    case "triadic":
      colors = [[baseH, baseS, baseL], [wrap(baseH + 120), baseS, baseL], [wrap(baseH + 240), baseS, baseL]];
      break;
    case "tetradic":
      colors = [[baseH, baseS, baseL], [wrap(baseH + 90), baseS, baseL], [wrap(baseH + 180), baseS, baseL], [wrap(baseH + 270), baseS, baseL]];
      break;
    case "accented_analogous":
      colors = [[wrap(baseH - 30), baseS, baseL], [baseH, baseS, baseL], [wrap(baseH + 30), baseS, baseL], [wrap(baseH + 180), baseS, baseL]];
      break;
    default:
      colors = [[baseH, baseS, baseL]];
  }
  return colors.map(([h, s, l]) => hslToRgb(h, s, l));
}

function pickShape(p, sp) {
  const total = sp.circlePct + sp.quadPct + sp.trianglePct;
  if (total <= 0) return "circle";
  const r = p.random(total);
  if (r < sp.circlePct) return "circle";
  if (r < sp.circlePct + sp.quadPct) return "quad";
  return "triangle";
}

function buildDistanceField(silhouette, W, H) {
  const dist = new Float32Array(W * H);
  const INF = 1e6;
  for (let i = 0; i < W * H; i++) dist[i] = silhouette[i] === 1 ? 0 : INF;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (dist[i] === 0) continue;
      if (x > 0)              dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      if (y > 0)              dist[i] = Math.min(dist[i], dist[(y-1)*W + x] + 1);
      if (x > 0 && y > 0)    dist[i] = Math.min(dist[i], dist[(y-1)*W + x - 1] + 1.414);
      if (x < W-1 && y > 0)  dist[i] = Math.min(dist[i], dist[(y-1)*W + x + 1] + 1.414);
    }
  }
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (dist[i] === 0) continue;
      if (x < W-1)              dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      if (y < H-1)              dist[i] = Math.min(dist[i], dist[(y+1)*W + x] + 1);
      if (x < W-1 && y < H-1)  dist[i] = Math.min(dist[i], dist[(y+1)*W + x + 1] + 1.414);
      if (x > 0 && y < H-1)    dist[i] = Math.min(dist[i], dist[(y+1)*W + x - 1] + 1.414);
    }
  }
  return dist;
}

function drawColorClusterFromForm(p, s, sp, form) {
  const { silhouette, luma, W: fW, H: fH } = form;
  const tone = s.tone;
  p.noStroke();

  const palette = generatePalette(sp.baseColor[0], sp.baseColor[1], sp.baseColor[2], sp.harmony);
  const darkColor = hslToRgb(sp.baseColor[0], sp.baseColor[1], 10);
  const alpha = Math.round(sp.opacity * 255);
  const useNoise = sp.noiseStrength > 0;
  const useScatter = sp.scatter > 0;
  const dist = useScatter ? buildDistanceField(silhouette, fW, fH) : null;
  const maxAttempts = sp.count * 10;
  let placed = 0;

  for (let attempt = 0; attempt < maxAttempts && placed < sp.count; attempt++) {
    const x = Math.floor(p.random(fW));
    const y = Math.floor(p.random(fH));
    const idx = y * fW + x;
    const inside = silhouette[idx] === 1;

    if (!inside) {
      if (!useScatter) continue;
      const d = dist[idx];
      if (d > sp.scatter) continue;
      const falloff = 1 - (d / sp.scatter);
      if (p.random() > falloff * falloff) continue;
    }

    if (useNoise) {
      const n = p.noise(x * sp.noiseFreq, y * sp.noiseFreq);
      if (p.random() > n * sp.noiseStrength + (1 - sp.noiseStrength)) continue;
    }

    if (inside && sp.lumaResponse > 0) {
      const l = applyTone(luma[idx], tone);
      if (p.random() < l * sp.lumaResponse) continue;
    }

    const isDark = sp.darkMix > 0 && p.random() < sp.darkMix;
    const color = isDark ? darkColor : palette[Math.floor(p.random(palette.length))];
    p.fill(color[0], color[1], color[2], alpha);

    const sizeMult = 1 - sp.sizeVar + p.random() * sp.sizeVar * 2;
    const markSize = Math.max(0.5, sp.size * sizeMult);
    const shape = pickShape(p, sp);

    if (shape === "circle") {
      p.circle(x, y, markSize);
    } else {
      const rot = sp.rotation > 0 ? p.random(-sp.rotation, sp.rotation) * Math.PI / 180 : 0;
      p.push();
      p.translate(x, y);
      if (rot !== 0) p.rotate(rot);
      if (shape === "quad") {
        const half = markSize / 2;
        p.rect(-half, -half, markSize, markSize);
      } else {
        const r = markSize / 2;
        p.triangle(0, -r, -r * 0.866, r * 0.5, r * 0.866, r * 0.5);
      }
      p.pop();
    }

    placed++;
  }
}

/* ---------- Breed: dot matrix ---------- */

function drawDotMatrixFromForm(p, s, sp, form) {
  const { silhouette, W: fW, H: fH } = form;
  p.noStroke();
  p.fill(s.inkColor[0], s.inkColor[1], s.inkColor[2], s.inkAlpha);

  const cell = Math.max(1, sp.cellSize);
  const halfCell = cell * 0.5;
  const markDim = cell * sp.markSize;
  const useNoise = sp.noiseStrength > 0;
  const useJitter = sp.jitter > 0;
  const isDot = sp.glyph === "dot";

  for (let cy = halfCell; cy < fH; cy += cell) {
    for (let cx = halfCell; cx < fW; cx += cell) {
      const fx = Math.floor(cx);
      const fy = Math.floor(cy);
      if (fx < 0 || fx >= fW || fy < 0 || fy >= fH) continue;
      if (silhouette[fy * fW + fx] !== 1) continue;

      if (useNoise) {
        const n = p.noise(cx * sp.noiseFreq, cy * sp.noiseFreq);
        if (n < sp.noiseStrength) continue;
      }

      let dx = 0, dy = 0;
      if (useJitter) {
        dx = p.random(-sp.jitter, sp.jitter);
        dy = p.random(-sp.jitter, sp.jitter);
      }

      if (isDot) {
        p.circle(cx + dx, cy + dy, markDim);
      } else {
        const half = markDim / 2;
        p.rect(cx + dx - half, cy + dy - half, markDim, markDim);
      }
    }
  }
}

/* ---------- Paper and texture overlays ---------- */

/* Call after createCanvas; reads the canvas size from p. */
function buildPaperTexture(p) {
  const buf = p.createGraphics(p.width, p.height);
  buf.pixelDensity(1);
  buf.noiseSeed(1234);
  buf.loadPixels();
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      const n = buf.noise(x * 0.04, y * 0.04);
      const v = 232 + (n - 0.5) * 18;
      const i = 4 * (y * buf.width + x);
      buf.pixels[i]     = v;
      buf.pixels[i + 1] = v - 4;
      buf.pixels[i + 2] = v - 12;
      buf.pixels[i + 3] = 255;
    }
  }
  buf.updatePixels();
  return buf;
}

function drawPaper(p, paper) {
  p.image(paper, 0, 0);
  p.noStroke();
  for (let i = 0; i < 220; i++) {
    p.fill(40, 36, 30, p.random(8, 22));
    p.rect(p.random(p.width), p.random(p.height), p.random(1, 1.6), p.random(1, 1.6));
  }
}

function drawGrainOverlay(p) {
  p.noStroke();
  for (let i = 0; i < 850; i++) {
    p.fill(20, 18, 14, p.random(6, 16));
    p.rect(p.random(p.width), p.random(p.height), 1, 1);
  }
  for (let i = 0; i < 320; i++) {
    p.fill(248, 244, 236, p.random(18, 46));
    p.rect(p.random(p.width), p.random(p.height), 1, 1);
  }
}

function drawFrameEdge(p) {
  p.noFill();
  p.stroke(20, 18, 14, 22);
  p.strokeWeight(1);
  p.rect(0.5, 0.5, p.width - 1, p.height - 1);
}
