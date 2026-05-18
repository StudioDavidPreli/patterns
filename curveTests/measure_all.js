const fs = require('fs');

function samplePath(svg) {
  const match = svg.match(/\bd="([^"]+)"/);
  if (!match) return [];
  const d = match[1]; const pts = []; let cx = 0, cy = 0;
  let lastC2x = 0, lastC2y = 0;

  const tokens = [];
  const re = /([MmCcSsLlHhVvZz])|(-?\d*\.?\d+(?:e[+-]?\d+)?)/gi;
  let tok;
  while ((tok = re.exec(d)) !== null) {
    if (tok[1]) tokens.push(tok[1]);
    else tokens.push(parseFloat(tok[2]));
  }

  let i = 0, cmd = '';
  while (i < tokens.length) {
    if (typeof tokens[i] === 'string') { cmd = tokens[i]; i++; }

    if (cmd === 'M') {
      cx = tokens[i]; cy = tokens[i+1]; i += 2;
      pts.push({ x: cx, y: cy });
      cmd = 'L';
    } else if (cmd === 'm') {
      cx += tokens[i]; cy += tokens[i+1]; i += 2;
      pts.push({ x: cx, y: cy });
      cmd = 'l';
    } else if (cmd === 'C') {
      const c1x=tokens[i],c1y=tokens[i+1],c2x=tokens[i+2],c2y=tokens[i+3],ex=tokens[i+4],ey=tokens[i+5]; i+=6;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey;
    } else if (cmd === 'c') {
      const c1x=cx+tokens[i],c1y=cy+tokens[i+1],c2x=cx+tokens[i+2],c2y=cy+tokens[i+3],ex=cx+tokens[i+4],ey=cy+tokens[i+5]; i+=6;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey;
    } else if (cmd === 'S') {
      const c1x=2*cx-lastC2x, c1y=2*cy-lastC2y;
      const c2x=tokens[i],c2y=tokens[i+1],ex=tokens[i+2],ey=tokens[i+3]; i+=4;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey;
    } else if (cmd === 's') {
      const c1x=2*cx-lastC2x, c1y=2*cy-lastC2y;
      const c2x=cx+tokens[i],c2y=cy+tokens[i+1],ex=cx+tokens[i+2],ey=cy+tokens[i+3]; i+=4;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey;
    } else if (cmd === 'Z' || cmd === 'z') {
      break;
    } else {
      i++;
    }
  }
  return pts;
}

function angleDiff(a1, a2) {
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function analyze(name, svgPath) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const pts = samplePath(svg);
  if (pts.length < 100) { console.log(`${name}: too few samples`); return; }

  const N = pts.length;

  // --- Body axis: bin path points by X, compute median Y per bin ---
  const xMin = Math.min(...pts.map(p => p.x));
  const xMax = Math.max(...pts.map(p => p.x));
  const nBins = 40;
  const binW = (xMax - xMin) / nBins;
  const bins = Array.from({ length: nBins }, () => []);
  for (const p of pts) {
    const bi = Math.min(nBins - 1, Math.floor((p.x - xMin) / binW));
    bins[bi].push(p.y);
  }
  const axisY = bins.map(b => {
    if (b.length === 0) return null;
    b.sort((a, c) => a - c);
    return b[Math.floor(b.length / 2)];
  });

  function getAxisY(x) {
    const bi = Math.min(nBins - 1, Math.max(0, Math.floor((x - xMin) / binW)));
    if (axisY[bi] !== null) return axisY[bi];
    for (let d = 1; d < nBins; d++) {
      if (bi - d >= 0 && axisY[bi - d] !== null) return axisY[bi - d];
      if (bi + d < nBins && axisY[bi + d] !== null) return axisY[bi + d];
    }
    return 180;
  }

  // --- Body axis undulation ---
  const validAxis = axisY.filter(v => v !== null);
  const axisYMin = Math.min(...validAxis);
  const axisYMax = Math.max(...validAxis);
  const axisRange = axisYMax - axisYMin;
  let dirChanges = 0;
  let lastDir = 0;
  for (let i = 1; i < validAxis.length; i++) {
    const dir = Math.sign(validAxis[i] - validAxis[i - 1]);
    if (dir !== 0 && dir !== lastDir) { dirChanges++; lastDir = dir; }
  }

  // --- Curvature peaks ---
  const step = 3;
  const tangents = [];
  for (let i = 0; i < N; i++) {
    const prev = pts[(i - step + N) % N];
    const next = pts[(i + step) % N];
    tangents.push(Math.atan2(next.y - prev.y, next.x - prev.x));
  }
  const curvatures = [];
  for (let i = 0; i < N; i++) {
    const prev = tangents[(i - step + N) % N];
    const next = tangents[(i + step) % N];
    curvatures.push(Math.abs(angleDiff(prev, next)));
  }

  const minCurv = 0.3;
  const window = 20;
  const peaks = [];
  for (let i = window; i < N - window; i++) {
    if (curvatures[i] < minCurv || isNaN(curvatures[i])) continue;
    let isMax = true;
    for (let d = 1; d <= window; d++) {
      if (curvatures[(i-d+N)%N] > curvatures[i]) { isMax = false; break; }
      if (curvatures[(i+d)%N] > curvatures[i]) { isMax = false; break; }
    }
    if (isMax && (peaks.length === 0 || i - peaks[peaks.length-1].idx > 30)) {
      peaks.push({ idx: i, x: pts[i].x, y: pts[i].y, curv: curvatures[i] });
    }
  }

  // --- Find valleys (curvature minima) between peaks ---
  function findValley(idxA, idxB) {
    let minC = Infinity, minIdx = idxA;
    const start = idxA, end = idxB > idxA ? idxB : idxB + N;
    for (let i = start; i <= end; i++) {
      const ii = i % N;
      if (curvatures[ii] < minC) { minC = curvatures[ii]; minIdx = ii; }
    }
    return minIdx;
  }

  // --- Classify peaks as top or bottom, compute spike metrics ---
  const topPeaks = [];
  const bottomPeaks = [];
  const heights = [];
  const leanAngles = [];
  const baseWidths = [];

  for (let pi = 0; pi < peaks.length; pi++) {
    const peak = peaks[pi];
    const localAxis = getAxisY(peak.x);
    const side = peak.y < localAxis ? 'top' : 'bottom';

    // Find valleys on either side of this peak
    const prevPeak = pi > 0 ? peaks[pi - 1].idx : peaks[peaks.length - 1].idx;
    const nextPeak = pi < peaks.length - 1 ? peaks[pi + 1].idx : peaks[0].idx;
    const valleyBefore = findValley(prevPeak, peak.idx);
    const valleyAfter = findValley(peak.idx, nextPeak);

    const vb = pts[valleyBefore];
    const va = pts[valleyAfter];
    const baseMidX = (vb.x + va.x) / 2;
    const baseMidY = (vb.y + va.y) / 2;

    // Height: distance from tip to base midpoint
    const height = Math.hypot(peak.x - baseMidX, peak.y - baseMidY);

    // Lean angle: angle from vertical (0 = straight up/down)
    const spikeAngle = Math.atan2(peak.x - baseMidX, -(peak.y - baseMidY));
    const lean = Math.abs(spikeAngle) * 180 / Math.PI;

    // Base width: distance between the two valleys
    const bw = Math.hypot(va.x - vb.x, va.y - vb.y);

    heights.push(height);
    leanAngles.push(lean);
    baseWidths.push(bw);

    if (side === 'top') topPeaks.push({ ...peak, height, lean, baseWidth: bw });
    else bottomPeaks.push({ ...peak, height, lean, baseWidth: bw });
  }

  // --- Spike spacing: horizontal distance between consecutive same-side peaks ---
  function sameSpacing(arr) {
    const sorted = [...arr].sort((a, b) => a.x - b.x);
    const spacings = [];
    for (let i = 1; i < sorted.length; i++) {
      spacings.push(sorted[i].x - sorted[i - 1].x);
    }
    return spacings;
  }
  const topSpacings = sameSpacing(topPeaks);
  const bottomSpacings = sameSpacing(bottomPeaks);
  const allSpacings = [...topSpacings, ...bottomSpacings];

  // --- Inter-spike body curvature ---
  // Measure average curvature along body contour between peaks (at valley regions)
  const bodyCurvatures = [];
  for (let pi = 0; pi < peaks.length - 1; pi++) {
    const valleyIdx = findValley(peaks[pi].idx, peaks[pi + 1].idx);
    const span = 10;
    let sum = 0, count = 0;
    for (let d = -span; d <= span; d++) {
      const ii = (valleyIdx + d + N) % N;
      if (!isNaN(curvatures[ii])) { sum += curvatures[ii]; count++; }
    }
    if (count > 0) bodyCurvatures.push(sum / count);
  }

  // --- Stats helpers ---
  const avg = arr => arr.length ? arr.reduce((s,v)=>s+v,0)/arr.length : 0;
  const med = arr => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a,b)=>a-b);
    return s[Math.floor(s.length/2)];
  };
  const f1 = v => v.toFixed(1);

  // --- Output ---
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}  (${pts.length} samples, ${peaks.length} peaks)`);
  console.log(`${'='.repeat(60)}`);

  console.log(`\n  1. PEAK HEIGHT (distance from base midpoint to tip)`);
  console.log(`     avg=${f1(avg(heights))}  median=${f1(med(heights))}`);
  console.log(`     min=${f1(Math.min(...heights))}  max=${f1(Math.max(...heights))}`);

  console.log(`\n  2. SPIKE SPACING (horizontal distance, same side)`);
  if (allSpacings.length) {
    console.log(`     avg=${f1(avg(allSpacings))}  median=${f1(med(allSpacings))}`);
    console.log(`     min=${f1(Math.min(...allSpacings))}  max=${f1(Math.max(...allSpacings))}`);
  } else {
    console.log(`     (insufficient data)`);
  }

  console.log(`\n  3. SPIKE LEAN ANGLE (degrees from vertical, 0=straight)`);
  console.log(`     avg=${f1(avg(leanAngles))}°  median=${f1(med(leanAngles))}°`);
  console.log(`     min=${f1(Math.min(...leanAngles))}°  max=${f1(Math.max(...leanAngles))}°`);

  console.log(`\n  4. BODY AXIS UNDULATION`);
  console.log(`     Y range=${f1(axisRange)}px  direction changes=${dirChanges}`);

  console.log(`\n  5. TOP/BOTTOM ASYMMETRY`);
  console.log(`     top: ${topPeaks.length} spikes, avg height=${f1(avg(topPeaks.map(p=>p.height)))}`);
  console.log(`     bottom: ${bottomPeaks.length} spikes, avg height=${f1(avg(bottomPeaks.map(p=>p.height)))}`);
  console.log(`     ratio (top/bottom count): ${topPeaks.length}/${bottomPeaks.length}`);

  console.log(`\n  6. INTER-SPIKE BODY CURVATURE (radians, at valley points)`);
  if (bodyCurvatures.length) {
    console.log(`     avg=${f1(avg(bodyCurvatures))}  median=${f1(med(bodyCurvatures))}`);
    console.log(`     min=${f1(Math.min(...bodyCurvatures))}  max=${f1(Math.max(...bodyCurvatures))}`);
  }

  console.log(`\n  7. SPIKE BASE WIDTH (distance between flanking valleys)`);
  console.log(`     avg=${f1(avg(baseWidths))}  median=${f1(med(baseWidths))}`);
  console.log(`     min=${f1(Math.min(...baseWidths))}  max=${f1(Math.max(...baseWidths))}`);
}

analyze('REFERENCE', '../../reference/digitalFantasy/spline.svg');
analyze('02 — seed 137', 'curve_02.svg');
analyze('08 — seed 2048', 'curve_08.svg');
analyze('10 — seed 4096', 'curve_10.svg');
