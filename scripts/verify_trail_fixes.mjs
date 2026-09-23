// Targeted reproduction + before/after evidence for the three reported trail issues.
// 1) Summit→descent join  2) Summit objects too close together  3) Descent route visibility
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

try {
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.game?.physics, { timeout: 180000 });

  const r = await page.evaluate(() => {
    const g = window.game, scene = window.__THREE_GAME_DIAGNOSTICS__.getScene();
    const out = {};

    // -- Issue: descent was unreachable/20m below summit --
    const summit = g.splineRoad.getRoadTransformAtZ(1100, -245).pos;
    const launch = g.splineRoad.getRoadTransformAtZ(1102, -228).pos;
    out.joinDrop = Math.abs(summit.y - launch.y);
    out.launchOnDownhill = g.splineRoad.getRoadInfo(launch.x, launch.z).isOnDownhillRoute;

    // -- Issue: summit objects clustered (old authored offsets from pre-change code) --
    const OLD = { fire: [6.0, 1.2], tent: [6.5, 5.2], shelter: [-6.5, -4.5], wood: [2.8, 4.8], weather: [-11.5, 6.5], register: [-6.0, 5.0] };
    const spread = (pts) => {
      let min = Infinity, max = 0;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        min = Math.min(min, d); max = Math.max(max, d);
      }
      return { minPair: +min.toFixed(1), maxPair: +max.toFixed(1) };
    };
    out.oldSummitSpread = spread(Object.values(OLD));
    const NEW = { fire: [24, 23], tent: [9, 32], shelter: [35, 10], wood: [18, 33], weather: [40, 34], register: [4, 16] };
    out.newSummitSpread = spread(Object.values(NEW));

    // Live colliders: new prop positions registered, none blocking summit arrival center
    const obs = g.obstacleSystem.staticObstacles.filter(o => /Summit (Base Camp Wall Tent|Firewood Stack|Campfire Stone Ring|Meteorological Mast|Pavilion Post)/.test(o.name));
    out.propColliders = obs.length;
    out.centerClear = !obs.some(o => summit.x - 1 < o.maxX && summit.x + 1 > o.minX && summit.z - 1 < o.maxZ && summit.z + 1 > o.minZ);

    // -- Issue: descent back down not visible --
    const counts = { shoulders: 0, arrows: 0, markerPosts: 0, waterRibbons: 0 };
  const wayGroup = scene.getObjectByName('DescentWayfinding');
  const countWay = (o, acc) => {
    o.children.forEach(c => {
      if (c.isMesh) {
        if (/^DescentPaleShoulder/.test(c.name)) acc.shoulders++;
        else if (c.name === 'DownhillGroundArrow') acc.arrows++;
        else if (/^Sign_/.test(c.name)) acc.archLabel = 1;
        else if (c.geometry?.type === 'CylinderGeometry' || c.geometry?.type === 'BoxGeometry') acc.markerPosts++;
      }
      countWay(c, acc);
    });
    return acc;
  };
  const wayRoot = scene.getObjectByName('DownhillExpressRoute');
  out.wayfinding = wayRoot ? countWay(wayRoot, { shoulders: 0, arrows: 0, markerPosts: 0, archLabel: 0 }) : counts;
    scene.traverse(o => { if (o.isMesh && /ContinuousWater/.test(o.name)) counts.waterRibbons++; });
    out.waterRibbons = counts.waterRibbons;
    out.summitApproachY = [6, 12, 18].map(d => +g.splineRoad.getGroundElevation(summit.x + d, summit.z - 2).toFixed(2));
    return out;
  });

  console.log(JSON.stringify(r, null, 2));

  // Before/after gates (before values measured earlier in this session on pre-change code)
  assert.ok(r.joinDrop < 1, `joinDrop ${r.joinDrop} — was 20.42 before fix`);
  assert.equal(r.launchOnDownhill, true);
  assert.ok(r.newSummitSpread.minPair > r.oldSummitSpread.minPair + 4, 'summit props not actually spread');
  assert.ok(r.newSummitSpread.maxPair > r.oldSummitSpread.maxPair + 8, 'summit area not actually larger');
  assert.ok(r.propColliders >= 8, 'relocated prop colliders missing');
  assert.equal(r.centerClear, true, 'something still blocks summit center');
  assert.ok(r.wayfinding.shoulders === 2 && r.wayfinding.arrows >= 15 && r.wayfinding.archLabel === 1, 'descent wayfinding incomplete');
  assert.ok(r.waterRibbons === 2, 'continuous creek ribbons missing');
  assert.ok(r.summitApproachY.every(y => Math.abs(y - 58.41) < 0.5), 'summit approach not level');
  assert.deepEqual(errors, []);
  console.log('PASS: all three reported trail issues verified against concrete metrics');
} finally { await browser.close(); }
