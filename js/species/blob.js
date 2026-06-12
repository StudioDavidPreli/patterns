/* species/blob.js
   Blob form pass, extracted from specimen_blob_v1.html. Classic
   script; registers under window.SPECIES.

   2D-native species. No three.js. Amorphous closed silhouette from a
   noise-perturbed circle, Catmull-Rom bezier fill via offscreen
   canvas, dome normal model. renderForm renders at form.W x form.H.
   Uses makeSeededRandom and shadeFromNormal from form.js. */

window.SPECIES = window.SPECIES || {};

SPECIES.blob = {
  name: "blob",
  is3D: false,

  DEFAULTS: {
    species: "blob",
    breed:   "halftone",

    geometry: {
      radius:    85,
      aspect:    1.00,
      vertices:  10,
      deform:    0.30,
      tension:   0.55,
      seed:      7741
    },

    light: {
      keyIntensity: 1.20,
      direction:    [0.30, 1.00, 0.45],
      ambient:      0.10
    },

    tone: {
      blackPoint: 0.0,
      whitePoint: 1.0,
      gamma:      1.0
    },

    polarity: "positive",
    fillLuma: 0.00,

    breeds: {
      raster_vertical: {
        spacing:    1.6,
        segmentLen: 6,
        jitterX:    0.4,
        weightBase: 1.0,
        weightVar:  0.35,
        lumaWeight: 0.40
      },
      stipple: {
        density:     0.18,
        dotSizeBase: 1.4,
        dotSizeVar:  0.40,
        jitter:      0.5
      },
      halftone: {
        cellSize:  6.00,
        dotSize:   0.85,
        coverage:  0.85,
        jitter:    0.00
      },
      riso_noise: {
        density:     0.16,
        dotSizeBase: 1.4,
        dotSizeVar:  0.40,
        jitter:      0.5,
        misreg:      1.5,
        layers: [
          { color: [20, 18, 14, 240],   offset: [0.0, 0.0],  densityMult: 1.00, lumaResponse:  0.60 },
          { color: [232, 89, 79, 220],  offset: [1.5, -0.8], densityMult: 0.55, lumaResponse:  0.00 },
          { color: [248, 215, 88, 220], offset: [-1.2, 1.5], densityMult: 0.40, lumaResponse: -0.30 },
          { color: [64, 110, 178, 220], offset: [2.0, 1.2],  densityMult: 0.35, lumaResponse:  0.50 }
        ]
      },
      color_blocking: {
        density:     0.25,
        dotSizeBase: 1.4,
        dotSizeVar:  0.30,
        jitter:      0.5,
        shading:     0.30,
        defaultColor: [40, 36, 30, 200],
        regions: [
          { dirX: 0, dirY:  1, dirZ: 0, threshold: 0.40, color: [64, 110, 178, 220] },
          { dirX: 0, dirY: -1, dirZ: 0, threshold: 0.40, color: [58, 140, 80, 220] },
          { dirX: 0, dirY:  0, dirZ: 1, threshold: 0.65, color: [248, 215, 88, 220] }
        ]
      },
      outline: {
        weight: 1.5,
        jitter: 0.00
      },
      color_cluster: {
        count: 300,
        size: 8,
        sizeVar: 0.50,
        circlePct: 100,
        quadPct: 0,
        trianglePct: 0,
        rotation: 0,
        opacity: 1.0,
        baseColor: [0, 60, 50],
        harmony: "triadic",
        darkMix: 0.0,
        lumaResponse: 0.0,
        noiseFreq: 0.02,
        noiseStrength: 0.0,
        scatter: 0
      },
      dot_matrix: {
        cellSize:       5,
        markSize:       0.70,
        glyph:          "dot",
        noiseFreq:      0.015,
        noiseStrength:  0.60,
        jitter:         0.00
      }
    },

    paperGrain: 0.55,
    inkColor:   [14, 13, 11],
    inkAlpha:   232,

    seed: 1138
  },

  /* Random builds for the pool. Sampling bounds follow the test-page
     sliders, with radius as a fraction of the form's short side so a
     blob fits any placed box (max extent: radius 0.30 x deform 1.5 x
     aspect 1.45 = 0.65 x short side, inside the 4:3 half-width). */
  randomGeometry(rng, place) {
    const minDim = Math.min(place.w, place.h);
    return {
      radius: Math.round(minDim * (0.18 + rng() * 0.12)),
      aspect: +(0.75 + rng() * 0.70).toFixed(2),
      vertices: 6 + Math.floor(rng() * 9),
      deform: +(0.15 + rng() * 0.35).toFixed(2),
      tension: +(0.45 + rng() * 0.25).toFixed(2),
      seed: Math.floor(rng() * 100000)
    };
  },

  create() {

    function renderForm(s, form) {
      const W = form.W, H = form.H;
      const { silhouette, luma, normals } = form;
      silhouette.fill(0);
      luma.fill(0);
      normals.fill(0);

      const geom = s.geometry;
      const light = s.light;
      const rng = makeSeededRandom(geom.seed);

      const cx = W * 0.5;
      const cy = H * 0.5;
      const N = Math.max(3, Math.floor(geom.vertices));
      const tension = geom.tension;
      const TWO_PI = Math.PI * 2;

      const pts = [];
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * TWO_PI;
        const r = geom.radius * (1 + (rng() - 0.5) * 2 * geom.deform);
        pts.push({
          x: cx + Math.cos(angle) * r * geom.aspect,
          y: cy + Math.sin(angle) * r
        });
      }

      const n = pts.length;
      const pt = i => pts[((i % n) + n) % n];

      // Fill silhouette via offscreen canvas bezier path.
      const offCanvas = document.createElement('canvas');
      offCanvas.width = W;
      offCanvas.height = H;
      const ctx = offCanvas.getContext('2d');

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < n; i++) {
        const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
        const c1x = p1.x + (p2.x - p0.x) * tension / 3;
        const c1y = p1.y + (p2.y - p0.y) * tension / 3;
        const c2x = p2.x - (p3.x - p1.x) * tension / 3;
        const c2y = p2.y - (p3.y - p1.y) * tension / 3;
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      const imgData = ctx.getImageData(0, 0, W, H);
      for (let i = 0; i < W * H; i++) {
        if (imgData.data[i * 4 + 3] > 128) silhouette[i] = 1;
      }

      // Boundary distance map for dome normals. Evaluate the same bezier
      // curves at many points and record max distance from center per angle bin.
      const BINS = 720;
      const boundaryR = new Float32Array(BINS);
      const SUBDIV = 40;
      for (let i = 0; i < n; i++) {
        const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
        const c1x = p1.x + (p2.x - p0.x) * tension / 3;
        const c1y = p1.y + (p2.y - p0.y) * tension / 3;
        const c2x = p2.x - (p3.x - p1.x) * tension / 3;
        const c2y = p2.y - (p3.y - p1.y) * tension / 3;
        for (let j = 0; j <= SUBDIV; j++) {
          const t = j / SUBDIV;
          const mt = 1 - t;
          const bx = mt*mt*mt*p1.x + 3*mt*mt*t*c1x + 3*mt*t*t*c2x + t*t*t*p2.x;
          const by = mt*mt*mt*p1.y + 3*mt*mt*t*c1y + 3*mt*t*t*c2y + t*t*t*p2.y;
          const dx = bx - cx, dy = by - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += TWO_PI;
          const bin = Math.floor(angle / TWO_PI * BINS) % BINS;
          if (dist > boundaryR[bin]) boundaryR[bin] = dist;
        }
      }
      for (let pass = 0; pass < 4; pass++) {
        for (let b = 0; b < BINS; b++) {
          if (boundaryR[b] === 0) {
            const prev = boundaryR[(b - 1 + BINS) % BINS];
            const next = boundaryR[(b + 1) % BINS];
            if (prev > 0 && next > 0) boundaryR[b] = (prev + next) * 0.5;
            else if (prev > 0) boundaryR[b] = prev;
            else if (next > 0) boundaryR[b] = next;
          }
        }
      }

      // Dome normals + Lambert luma.
      let minL = 1, maxL = 0, sumL = 0, count = 0;
      for (let i = 0; i < W * H; i++) {
        if (!silhouette[i]) continue;
        const px = i % W;
        const py = Math.floor(i / W);
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const ni = i * 3;
        if (dist < 0.5) {
          normals[ni]     = 0;
          normals[ni + 1] = 0;
          normals[ni + 2] = 1;
        } else {
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += TWO_PI;
          const bin = Math.floor(angle / TWO_PI * BINS) % BINS;
          const maxR = boundaryR[bin];
          const d = Math.min(1, dist / Math.max(1, maxR));
          const dirX = dx / dist;
          const dirY = dy / dist;
          normals[ni]     = dirX * d;
          normals[ni + 1] = -dirY * d;
          normals[ni + 2] = Math.sqrt(Math.max(0, 1 - d * d));
        }

        const l = shadeFromNormal(normals[ni], normals[ni + 1], normals[ni + 2], light);
        luma[i] = l;
        if (l < minL) minL = l;
        if (l > maxL) maxL = l;
        sumL += l;
        count++;
      }
      form.lumaMin  = count ? minL : 0;
      form.lumaMax  = count ? maxL : 0;
      form.lumaMean = count ? sumL / count : 0;
    }

    return { renderForm };
  }
};
