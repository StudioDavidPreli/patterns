/* form.js
   Shared form-stage helpers: form allocation, polarity, and the
   helpers 2D-native species use to synthesize luma. Classic script,
   same loading convention as breeds.js.

   A form is the seam between the form pass and the breed pass:
   { silhouette, luma, normals, W, H, lumaMin, lumaMax, lumaMean,
     originX, originY }
   originX/originY are the form's placement offset on a shared pool
   canvas, in pool pixels. Standalone species pages leave them 0.
   Canvas-aligned breeds (halftone, dot_matrix) read them to phase
   their grids in pool coordinates. */

function createForm(W, H) {
  return {
    silhouette: new Uint8Array(W * H),
    luma: new Float32Array(W * H),
    normals: new Float32Array(W * H * 3),
    W, H,
    lumaMin: 0, lumaMax: 1, lumaMean: 0.5,
    originX: 0, originY: 0
  };
}

/* Inverts the silhouette after the form pass, before tone.
   Pipeline: form -> polarity -> tone -> breed. */
function applyPolarityToForm(form, s) {
  if (s.polarity !== "negative") return;
  const total = form.W * form.H;
  const fill = s.fillLuma;
  const { silhouette, luma, normals } = form;
  let minL = fill, maxL = fill, sumL = 0, count = 0;
  for (let i = 0; i < total; i++) {
    if (silhouette[i] === 1) {
      silhouette[i] = 0;
      luma[i] = 0;
      normals[i * 3] = 0;
      normals[i * 3 + 1] = 0;
      normals[i * 3 + 2] = 0;
    } else {
      silhouette[i] = 1;
      luma[i] = fill;
      sumL += fill;
      count++;
    }
  }
  form.lumaMin  = count ? minL : 0;
  form.lumaMax  = count ? maxL : 0;
  form.lumaMean = count ? sumL / count : 0;
}

/* Seeded RNG for geometry generation in 2D-native species.
   Uncorrelated samples; independent of the breed pass's p5 seed. */
function makeSeededRandom(seed) {
  let s = (seed >>> 0) || 1;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* Lambert shading against the specimen light. Same convention as the
   3D species' MeshStandardMaterial pass. */
function shadeFromNormal(nx, ny, nz, light) {
  const dx = light.direction[0], dy = light.direction[1], dz = light.direction[2];
  const lLen = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const lx = dx / lLen, ly = dy / lLen, lz = dz / lLen;
  let dot = nx * lx + ny * ly + nz * lz;
  if (dot < 0) dot = 0;
  let l = dot * light.keyIntensity + light.ambient;
  if (l < 0) l = 0;
  else if (l > 1) l = 1;
  return l;
}
