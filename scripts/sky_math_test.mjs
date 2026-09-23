// Test skyGradient in isolation — the canvas gradient math
import * as THREE from 'three';

function hexToRgb(hex) {
  const h = parseInt(hex.slice(1), 16);
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}
function rgbToHex(r, g, b) {
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + ((1 << 24) | (cl(r) << 16) | (cl(g) << 8) | cl(b)).toString(16).slice(1);
}
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t);
}
function lightenHex(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  return rgbToHex(r+(255-r)*amt, g+(255-g)*amt, b+(255-b)*amt);
}

const top = '#1a4f8b', horizon = '#e4a058';
console.log('mid mix:', mixHex(top, horizon, 0.65));
console.log('lighten:', lightenHex(horizon, 0.35));

// Simulate the canvas gradient sampling at v=0.5 (row 128/256)
const size = 256;
const stops = [
  [0.0, top],
  [0.62, mixHex(top, horizon, 0.65)],
  [0.82, horizon],
  [1.0, lightenHex(horizon, 0.35)]
];
const v = 128 / size;
let lo = stops[0], hi = stops[stops.length-1];
for (let i = 0; i < stops.length - 1; i++) {
  if (v >= stops[i][0] && v <= stops[i+1][0]) { lo = stops[i]; hi = stops[i+1]; break; }
}
const t = (v - lo[0]) / (hi[0] - lo[0]);
console.log('expected color at v=0.5:', mixHex(lo[1], hi[1], t));
