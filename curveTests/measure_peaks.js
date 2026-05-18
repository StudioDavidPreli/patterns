const fs = require('fs');

function samplePath(svg) {
  const match = svg.match(/\bd="([^"]+)"/);
  if (!match) return [];
  const d = match[1]; const pts = []; let cx = 0, cy = 0;
  let lastC2x = 0, lastC2y = 0, lastCmd = '';

  // Tokenize: extract all numbers, track command letters
  const tokens = [];
  const re = /([MmCcSsLlHhVvZz])|(-?\d*\.?\d+(?:e[+-]?\d+)?)/gi;
  let tok;
  while ((tok = re.exec(d)) !== null) {
    if (tok[1]) tokens.push(tok[1]);
    else tokens.push(parseFloat(tok[2]));
  }

  let i = 0;
  let cmd = '';
  while (i < tokens.length) {
    if (typeof tokens[i] === 'string') { cmd = tokens[i]; i++; }

    if (cmd === 'M') {
      cx = tokens[i]; cy = tokens[i+1]; i += 2;
      pts.push({ x: cx, y: cy });
      cmd = 'L'; // subsequent coords are implicit L
    } else if (cmd === 'm') {
      cx += tokens[i]; cy += tokens[i+1]; i += 2;
      pts.push({ x: cx, y: cy });
      cmd = 'l';
    } else if (cmd === 'C') {
      const c1x=tokens[i],c1y=tokens[i+1],c2x=tokens[i+2],c2y=tokens[i+3],ex=tokens[i+4],ey=tokens[i+5]; i+=6;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey; lastCmd='C';
    } else if (cmd === 'c') {
      const c1x=cx+tokens[i],c1y=cy+tokens[i+1],c2x=cx+tokens[i+2],c2y=cy+tokens[i+3],ex=cx+tokens[i+4],ey=cy+tokens[i+5]; i+=6;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey; lastCmd='C';
    } else if (cmd === 'S') {
      const c1x=2*cx-lastC2x, c1y=2*cy-lastC2y;
      const c2x=tokens[i],c2y=tokens[i+1],ex=tokens[i+2],ey=tokens[i+3]; i+=4;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey; lastCmd='S';
    } else if (cmd === 's') {
      const c1x=2*cx-lastC2x, c1y=2*cy-lastC2y;
      const c2x=cx+tokens[i],c2y=cy+tokens[i+1],ex=cx+tokens[i+2],ey=cy+tokens[i+3]; i+=4;
      for(let t=0.01;t<=1.001;t+=0.01){const mt=1-t;
        pts.push({x:mt*mt*mt*cx+3*mt*mt*t*c1x+3*mt*t*t*c2x+t*t*t*ex,y:mt*mt*mt*cy+3*mt*mt*t*c1y+3*mt*t*t*c2y+t*t*t*ey});}
      lastC2x=c2x; lastC2y=c2y; cx=ex; cy=ey; lastCmd='s';
    } else if (cmd === 'Z' || cmd === 'z') {
      break;
    } else {
      i++; // skip unknown
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
  console.log(`\n=== ${name} (${pts.length} samples) ===`);
  if (pts.length < 100) return;

  // Verify first few points aren't NaN
  const validPts = pts.filter(p => !isNaN(p.x) && !isNaN(p.y));
  if (validPts.length < pts.length * 0.9) {
    console.log(`  WARNING: ${pts.length - validPts.length} NaN points`);
  }

  const step = 3;
  const tangents = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[(i - step + pts.length) % pts.length];
    const next = pts[(i + step) % pts.length];
    tangents.push(Math.atan2(next.y - prev.y, next.x - prev.x));
  }

  const curvatures = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = tangents[(i - step + pts.length) % pts.length];
    const next = tangents[(i + step) % pts.length];
    curvatures.push(Math.abs(angleDiff(prev, next)));
  }

  const minCurv = 0.3;
  const window = 20;
  const peaks = [];
  for (let i = window; i < pts.length - window; i++) {
    if (curvatures[i] < minCurv || isNaN(curvatures[i])) continue;
    let isMax = true;
    for (let d = 1; d <= window; d++) {
      if (curvatures[(i-d+pts.length)%pts.length] > curvatures[i]) { isMax = false; break; }
      if (curvatures[(i+d)%pts.length] > curvatures[i]) { isMax = false; break; }
    }
    if (isMax && (peaks.length === 0 || i - peaks[peaks.length-1].idx > 30)) {
      peaks.push({ idx: i, x: pts[i].x, y: pts[i].y, curv: curvatures[i] });
    }
  }

  console.log(`  ${peaks.length} curvature peaks (tips)`);

  const deflections = [];
  const radii = [];

  for (const peak of peaks) {
    const idx = peak.idx;
    const dist = 30;
    const before = (idx - dist + pts.length) % pts.length;
    const after = (idx + dist) % pts.length;
    const entryAngle = Math.atan2(pts[idx].y - pts[before].y, pts[idx].x - pts[before].x);
    const exitAngle = Math.atan2(pts[after].y - pts[idx].y, pts[after].x - pts[idx].x);
    const defl = Math.abs(angleDiff(entryAngle, exitAngle)) * 180 / Math.PI;
    deflections.push(defl);

    const span = 25;
    const a = pts[(idx-span+pts.length)%pts.length], b = pts[idx], c = pts[(idx+span)%pts.length];
    const ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y),ca=Math.hypot(a.x-c.x,a.y-c.y);
    const area=Math.abs((b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y))/2;
    const radius = area > 0.1 ? (ab*bc*ca)/(4*area) : 9999;
    radii.push(radius);

    if (peaks.length <= 30) {
      console.log(`  (${peak.x.toFixed(0)},${peak.y.toFixed(0)})  defl@30=${defl.toFixed(0)}°  R=${radius.toFixed(1)}`);
    }
  }

  if (deflections.length > 0) {
    const avg = arr => arr.reduce((s,v)=>s+v,0)/arr.length;
    const med = arr => {const s=[...arr].sort((a,b)=>a-b);return s[Math.floor(s.length/2)];};
    console.log(`  ─────────────────────────────────`);
    console.log(`  Deflection @30:  avg=${avg(deflections).toFixed(1)}°  median=${med(deflections).toFixed(1)}°`);
    console.log(`  Tip radius:      avg=${avg(radii).toFixed(1)}  median=${med(radii).toFixed(1)}`);
  }
}

analyze('REFERENCE', '../../reference/digitalFantasy/spline.svg');
analyze('02 seed 137', 'curve_02.svg');
analyze('08 seed 2048', 'curve_08.svg');
analyze('10 seed 4096', 'curve_10.svg');
