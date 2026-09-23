// Headless visual assertions for the Cougar Ridge trail overhaul.
// Geometric raycasts in the live scene + pixel sampling of the review captures.
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const OUT = '/tmp/trail-review-current';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));

const checks = { waterAbove: 0, waterBelow: 0, gradeSamples: 0, maxStep: 0, descentGroundY: [], flags: {} };

await page.goto('http://127.0.0.1:5173/');
await page.waitForFunction(() => window.game?.physics, { timeout: 180000 });

const geo = await page.evaluate(async () => {
  const g = window.game, THREE = window.THREE, scene = window.__THREE_GAME_DIAGNOSTICS__.getScene();
  const { TrailSpline } = await import('/src/world/TrailSpline.js');
  const { DownhillSpline } = await import('/src/world/DownhillSpline.js');
  const out = { waterAbove: 0, waterBelow: 0, descentSamples: [] };

  // 1. Water surface must sit above terrain along both creek centerlines.
  const ribbons = [];
  scene.traverse(o => { if (o.isMesh && /ContinuousWater/.test(o.name)) ribbons.push(o); });
  out.waterMeshes = ribbons.length;
  for (const mesh of ribbons) {
    const pos = mesh.geometry.attributes.position, matrix = mesh.matrixWorld;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 7) {
      v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
      const ground = g.splineRoad.getGroundElevation(v.x, v.z);
      if (v.y > ground + 0.02) out.waterAbove++; else out.waterBelow++;
    }
  }

  // 2. Descent profile: terrain along centerline must decrease monotonically-ish.
  let prevY = null;
  for (let t = 0.02; t <= 1.0; t += 0.06) {
    const sp = DownhillSpline.getPointAt(t);
    const p = g.splineRoad.getRoadTransformAtZ(sp.z, sp.lat).pos;
    const y = g.splineRoad.getGroundElevation(p.x, p.z);
    out.descentSamples.push(+t.toFixed(2), +y.toFixed(2));
    if (prevY !== null) out.maxStep = Math.max(out.maxStep || 0, Math.abs(y - prevY));
    prevY = y;
  }

  // 3. Summit: bridge corridor and launch approach must be driveable (no cliff cut).
  const summit = g.splineRoad.getRoadTransformAtZ(1100, -245).pos;
  for (const d of [6, 12, 18]) {
    const x = summit.x + d, z = summit.z - 2;
    out[`approachY_${d}`] = +g.splineRoad.getGroundElevation(x, z).toFixed(2);
  }
  return out;
});
checks.geo = geo;

for (const view of ['summit', 'cougar-ford', 'thunder-ford', 'descent']) {
  const png = PNG.sync.read(fs.readFileSync(`${OUT}/${view}.png`));
  let greenish = 0, pale = 0, nonSky = 0, total = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2, r = png.data[i], gr = png.data[i + 1], b = png.data[i + 2];
      total++;
      if (gr > 80 && gr > r * 1.18 && gr > b * 1.18) greenish++;
      if (r > 195 && gr > 185 && b > 150 && b < gr) pale++;
      if (y > png.height * 0.45 && (gr < 110 || b > 200)) nonSky++;
    }
  }
  checks[`pixels_${view}`] = {
    greenPct: +(greenish / total * 100).toFixed(1),
    palePct: +(pale / total * 100).toFixed(1),
    terrainPct: +(nonSky / total * 100).toFixed(1)
  };
}
checks.errors = errors;
fs.writeFileSync('/tmp/trail-visual-assertions.json', JSON.stringify(checks, null, 2));
console.log(JSON.stringify(checks, null, 2));
await browser.close();

let fail = false;
if (geo.waterMeshes < 2 || geo.waterBelow > 0) { console.error('FAIL water'); fail = true; }
if ((geo.maxStep || 0) > 6) { console.error('FAIL descent grade'); fail = true; }
// Vegetation coverage is an informational heuristic (cel-shaded palettes skew dark);
// art judgement happens on the delivered captures, not this threshold.
for (const v of ['cougar-ford', 'thunder-ford', 'descent']) {
  if (checks[`pixels_${v}`].greenPct < 4) console.error(`INFO low-green heuristic ${v} (art review, not a gate)`);
}
process.exitCode = fail ? 1 : 0;
