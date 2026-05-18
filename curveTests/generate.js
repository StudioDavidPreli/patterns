#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const W = 536, H = 360;

function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generate(seed) {
  const rng = mulberry32(seed);
  const r = () => rng();
  const rr = (lo, hi) => lo + r() * (hi - lo);

  const nSpine = Math.round(rr(14, 22));
  const xPad = rr(35, 60);
  const bodyHalf = rr(10, 20);

  // Spine: random walk with decaying amplitude.
  const spine = [];
  let y = rr(H * 0.55, H * 0.82);
  const yDriftPerStep = rr(-8, -1);

  for (let i = 0; i < nSpine; i++) {
    const t = i / (nSpine - 1);
    const x = xPad + t * (W - 2 * xPad);

    if (i > 0) {
      const ampDecay = Math.max(0.25, 1.0 - t * rr(0.3, 0.7));
      const maxStep = rr(25, 75) * ampDecay;
      y += rr(-maxStep, maxStep) + yDriftPerStep;
    }

    if (y < 30) y = 30 + rr(5, 25);
    if (y > H - 30) y = H - 30 - rr(5, 25);

    spine.push({ x, y });
  }

  // Slope limiting: prevents extreme spine angles.
  const maxSlopeRatio = 1.5;
  for (let i = 1; i < nSpine; i++) {
    const xStep = spine[i].x - spine[i - 1].x;
    const maxDy = xStep * maxSlopeRatio;
    const dy = spine[i].y - spine[i - 1].y;
    if (Math.abs(dy) > maxDy) {
      spine[i].y = spine[i - 1].y + Math.sign(dy) * maxDy;
    }
  }

  // Spine amplitude floor: scale Y deviations if range is too low.
  const spineYs = spine.map(s => s.y);
  const spineYMin = Math.min(...spineYs);
  const spineYMax = Math.max(...spineYs);
  const spineRange = spineYMax - spineYMin;
  const minRange = 180;
  if (spineRange < minRange && spineRange > 1) {
    const spineYMean = spineYs.reduce((a, b) => a + b, 0) / spineYs.length;
    const scale = minRange / spineRange;
    for (const s of spine) {
      s.y = spineYMean + (s.y - spineYMean) * scale;
      if (s.y < 30) s.y = 30;
      if (s.y > H - 30) s.y = H - 30;
    }
  }

  function tangentAt(i) {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(nSpine - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { dx: dx / len, dy: dy / len };
  }

  function contourPt(i, side) {
    return {
      x: spine[i].x,
      y: spine[i].y + (side === 1 ? -1 : 1) * bodyHalf
    };
  }

  function spikeDir(i, side) {
    const t = tangentAt(i);
    const lx = side === 1 ? t.dy : -t.dy;
    const ly = side === 1 ? -t.dx : t.dx;
    const gy = side === 1 ? -1 : 1;
    const b = 0.6;
    let nx = lx * (1 - b);
    let ny = ly * (1 - b) + gy * b;
    const len = Math.hypot(nx, ny) || 1;
    return { nx: nx / len, ny: ny / len };
  }

  function makeSpikes(side, count) {
    const indices = [];
    for (let i = 1; i < nSpine - 1; i++) indices.push(i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const chosen = [];
    for (const idx of indices) {
      if (chosen.every(c => Math.abs(c - idx) >= 1)) {
        chosen.push(idx);
        if (chosen.length >= count) break;
      }
    }
    chosen.sort((a, b) => a - b);

    return chosen.map(idx => {
      const tan = tangentAt(idx);
      const dir = spikeDir(idx, side);
      const len = rr(25, 130);
      const lean = rr(-0.35, 0.35);
      const base = contourPt(idx, side);
      let tipX = base.x + dir.nx * len + tan.dx * lean * len;
      let tipY = base.y + dir.ny * len + tan.dy * lean * len;
      tipX = Math.max(6, Math.min(W - 6, tipX));
      tipY = Math.max(6, Math.min(H - 6, tipY));
      return { idx, base, tip: { x: tipX, y: tipY } };
    });
  }

  const topCount = Math.round(rr(4, 8));
  const bottomCount = Math.round(rr(5, 10));
  const topSpikes = makeSpikes(1, topCount);
  const bottomSpikes = makeSpikes(-1, bottomCount);

  // Same-side angular exclusion: prevent adjacent spike tips from converging.
  function applyAngularExclusion(spikes) {
    for (let i = 0; i < spikes.length - 1; i++) {
      const a = spikes[i], b = spikes[i + 1];
      const baseDist = Math.hypot(b.base.x - a.base.x, b.base.y - a.base.y);
      const tipDist = Math.hypot(b.tip.x - a.tip.x, b.tip.y - a.tip.y);

      if (tipDist < baseDist * 0.35) {
        const midX = (a.tip.x + b.tip.x) / 2;
        const midY = (a.tip.y + b.tip.y) / 2;
        const target = baseDist * 0.4;
        const spread = target / 2;

        let dxA = a.tip.x - midX, dyA = a.tip.y - midY;
        let dA = Math.hypot(dxA, dyA) || 1;
        a.tip.x = midX + (dxA / dA) * spread;
        a.tip.y = midY + (dyA / dA) * spread;

        let dxB = b.tip.x - midX, dyB = b.tip.y - midY;
        let dB = Math.hypot(dxB, dyB) || 1;
        b.tip.x = midX + (dxB / dB) * spread;
        b.tip.y = midY + (dyB / dB) * spread;
      }
    }
  }

  applyAngularExclusion(topSpikes);
  applyAngularExclusion(bottomSpikes);

  function buildSide(side, spikes) {
    const byIdx = new Map(spikes.map(s => [s.idx, s]));
    const pts = [];
    for (let i = 0; i < nSpine; i++) {
      pts.push({ ...contourPt(i, side), sharp: false });
      const spike = byIdx.get(i);
      if (spike) {
        const t = tangentAt(spike.idx);
        pts.push({ x: spike.tip.x, y: spike.tip.y, sharp: true, tx: t.dx, ty: t.dy });
      }
    }
    return pts;
  }

  const topPts = buildSide(1, topSpikes);
  const bottomPts = buildSide(-1, bottomSpikes);
  bottomPts.reverse();

  const leftEnd = {
    x: Math.max(4, spine[0].x - rr(20, 55)),
    y: spine[0].y + rr(-8, 8),
    sharp: true
  };
  const rightEnd = {
    x: Math.min(W - 4, spine[nSpine - 1].x + rr(20, 55)),
    y: spine[nSpine - 1].y + rr(-8, 8),
    sharp: true
  };

  const outline = [leftEnd, ...topPts, rightEnd, ...bottomPts];

  // Post-hoc crossing repair. Checks both actual crossings and near-misses
  // (where bezier overshoot would cause a crossing even if the polygon is clean).
  (function repairCrossings() {
    const n = outline.length;

    function segTest(i, j) {
      const a = outline[i], b = outline[(i + 1) % n];
      const c = outline[j], d = outline[(j + 1) % n];
      const dn = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
      if (Math.abs(dn) < 1e-10) return 0;
      const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / dn;
      const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / dn;
      if (t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99) return 2; // crossing
      if (t > -0.15 && t < 1.15 && u > -0.15 && u < 1.15) return 1; // near-miss
      return 0;
    }

    function shortenTip(k) {
      const prev = outline[(k - 1 + n) % n];
      const next = outline[(k + 1) % n];
      const midX = (prev.x + next.x) / 2;
      const midY = (prev.y + next.y) / 2;
      outline[k].x = outline[k].x * 0.3 + midX * 0.7;
      outline[k].y = outline[k].y * 0.3 + midY * 0.7;
    }

    for (let iter = 0; iter < 60; iter++) {
      let found = false;
      for (let i = 0; i < n && !found; i++) {
        for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue;
          const severity = segTest(i, j);
          if (severity === 0) continue;
          const ends = [i, (i + 1) % n, j, (j + 1) % n];
          const tips = ends.filter(k => outline[k].sharp);
          if (tips.length > 0) {
            found = true;
            tips.forEach(shortenTip);
            break;
          }
        }
      }
      if (!found) break;
    }
  })();

  const n = outline.length;
  const pt = i => outline[((i % n) + n) % n];

  let d = `M${outline[0].x.toFixed(2)},${outline[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
    let c1x, c1y, c2x, c2y;

    const tension = 0.55;
    c1x = p1.x + (p2.x - p0.x) * tension / 3;
    c1y = p1.y + (p2.y - p0.y) * tension / 3;
    c2x = p2.x - (p3.x - p1.x) * tension / 3;
    c2y = p2.y - (p3.y - p1.y) * tension / 3;

    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  d += 'Z';

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">\n  <path d="${d}" fill="none" stroke="#262626" stroke-width="2" stroke-miterlimit="10"/>\n</svg>`;
}

fs.mkdirSync(DIR, { recursive: true });
const seeds = [42, 137, 256, 512, 777, 1024, 1337, 2048, 3141, 4096];
seeds.forEach((seed, i) => {
  const name = `curve_${String(i + 1).padStart(2, '0')}.svg`;
  fs.writeFileSync(path.join(DIR, name), generate(seed));
  console.log(`${name}  seed=${seed}`);
});
console.log(`\n${seeds.length} curves generated.`);
