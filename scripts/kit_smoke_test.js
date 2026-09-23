#!/usr/bin/env node
/**
 * Kit smoke test — verifies the modular component layer works headless:
 *   1. Asset registry resolves ids, scales, collision classes
 *   2. Road pieces generate correct segment counts and geometry
 *   3. Service-stop piece produces driveway/apron/bays anywhere it's placed
 *   4. Fork piece emits split metadata the renderer understands
 *   5. Composer assembles a multi-piece track end-to-end
 */
import './setup_env.js';
import { gameState } from '../js/state.js';
import { resetRoad, resetSprites } from '../js/track.js';
import { segmentLength, roadWidth } from '../js/constants.js';
import { getAsset, findAssets, COLLISION } from '../js/kit/assets.js';
import { RoadPiece, composeTrack } from '../js/kit/roadPieces.js';

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.error(`  ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}

resetRoad(); resetSprites();

// ── 1. Asset registry ──────────────────────────────────────────────────────
const shop = getAsset('service.mechanic_shop');
check('registry resolves service.mechanic_shop', !!shop && shop.sprite.w > 0);
check('asset declares meters + computed scale', typeof shop.meters === 'number' && shop.scale > 1);
const gas = getAsset('service.gas_station');
check('gas station narrower than mechanic shop', gas.meters < shop.meters);
check('driveway is PASS collision', getAsset('pit.driveway').collision === COLLISION.PASS);
check('start arch flagged overhead', getAsset('overhead.start_arch').overhead === true);
check('tag search finds hazards', findAssets('hazard').length >= 4);

// ── 2. Piece geometry ──────────────────────────────────────────────────────
{
  const before = gameState.segments.length;
  RoadPiece.straight(60).build();
  const added = gameState.segments.length - before;
  check('straight(60) adds exactly 60 segments', added === 60, `added ${added}`);
}
{
  const before = gameState.segments.length;
  const yStart = gameState.segments[gameState.segments.length - 1]?.p2.world.y || 0;
  RoadPiece.hill({ len: 90, height: 44 }).build();
  const segs = gameState.segments.slice(before);
  const yEnd = segs[segs.length - 1].p2.world.y;
  const expected = yStart + 44 * segmentLength;
  check('hill(90,44) ends at expected elevation', Math.abs(yEnd - expected) < segmentLength,
    `yEnd=${yEnd.toFixed(0)} vs ${expected.toFixed(0)}`);
}
{
  const before = gameState.segments.length;
  RoadPiece.curve({ len: 99, turn: 4 }).build();
  const segs = gameState.segments.slice(before);
  const peak = Math.max(...segs.map(s => s.curve));
  check('curve(99,4) reaches ~peak curvature', peak >= 3.8 && peak <= 4.05, `peak=${peak.toFixed(2)}`);
}

// ── 3. Service stop piece placed mid-track ────────────────────────────────
{
  const before = gameState.segments.length;
  RoadPiece.serviceStop({ asset: 'service.mechanic_shop', side: -1 }).build();
  // bay mouth is the last emitted segment; scan its approach for furniture
  let drives = 0, aprons = 0, signs = 0, pitRec = null, yardProps = 0;
  for (let i = 0; i < 140 && gameState.segments.length - 1 - i >= 0; i++) {
    const seg = gameState.segments[gameState.segments.length - 1 - i];
    if (seg.pitStop && !pitRec) pitRec = seg.pitStop;
    for (const sp of seg.sprites) {
      if (sp.source === getAsset('pit.driveway').sprite) drives++;
      if (sp.source === getAsset('pit.apron').sprite) aprons++;
      if (sp.source === getAsset('pit.entry_sign').sprite) signs++;
      if (sp.source === getAsset('pit.sign_mech_l').sprite) signs++;
      if (sp.source === getAsset('pit.sign_mech_r').sprite) signs++;
      if (sp.source === getAsset('service.shop_car_hood').sprite) yardProps++;
    }
  }
  check('serviceStop lays real driveway strips', drives >= 30, `${drives}`);
  check('serviceStop has concrete apron', aprons === 1);
  check('serviceStop posts advance + entry signs', signs >= 2, `${signs}`);
  check('serviceStop records pitStop gameplay meta', !!pitRec && pitRec.type === 'repair' && pitRec.side === -1);
  check('mechanic gets yard dressing props', yardProps >= 2, `${yardProps}`);
  void before;
}

// ── 4. Fork piece ──────────────────────────────────────────────────────────
{
  const before = gameState.segments.length;
  RoadPiece.fork({ type: 'DESERT', leftName: 'L-TEST', rightName: 'R-TEST' }).build();
  const segs = gameState.segments.slice(before);
  const withSplit = segs.filter(s => s.split);
  check('fork emits split metadata on all its segments', withSplit.length === segs.length);
  const maxSpread = Math.max(...segs.map(s => s.split.spread));
  check('fork reaches big spread (≥2.6)', maxSpread >= 2.6, `${maxSpread}`);
  const phases = new Set(segs.map(s => s.split.phase));
  check('fork walks enter→hold→leave phases', phases.has('enter') && phases.has('hold') && phases.has('leave'));
  const named = segs.find(s => s.split.leftName === 'L-TEST');
  check('fork carries route names for discovery system', !!named);
}

// ── 5. Composer end-to-end ─────────────────────────────────────────────────
{
  resetRoad(); resetSprites();
  const plan = [
    RoadPiece.straight(75),
    RoadPiece.hill({ len: 75, height: 22 }),
    RoadPiece.curve({ len: 90, turn: -4 }),
    RoadPiece.serviceStop({ asset: 'service.gas_station', side: 1 }),
    RoadPiece.jumps({ count: 2 }),
    RoadPiece.sCurves(),
    RoadPiece.custom({
      len: 40,
      curveFn: (n) => Math.sin(n / 6) * 2,          // wavy custom piece
      decorate: (idx, p) => {
        if (p % 0.25 < 0.01) {
          const seg = gameState.segments[idx];
          seg.sprites.push({ source: getAsset('scenery.cactus_saguaro').sprite, offset: p > 0.5 ? 2.5 : -2.5, center: false, scaleMult: 5.2, flipX: false });
        }
      },
    }),
  ];
  const total = composeTrack(plan);
  const N = gameState.segments.length;
  check('composer builds all pieces into live track', N >= total && total >= 500, `total=${total}, N=${N}`);

  // custom piece decoration landed
  let cacti = 0;
  for (let i = N - 40; i < N; i++) {
    cacti += gameState.segments[i].sprites.filter(sp => sp.source === getAsset('scenery.cactus_saguaro').sprite).length;
  }
  check('custom piece decorate() callback fires', cacti >= 2, `${cacti}`);

  // every segment structurally sound after composition
  const bad = gameState.segments.filter(s =>
    !Number.isFinite(s.p1.world.y) || !Number.isFinite(s.p2.world.z)).length;
  check('no NaN/Infinity in composed geometry', bad === 0);

  // service stop inside composer produced playable bay
  const bays = gameState.segments.filter(s => s.pitStop).length;
  check('composed track contains the service stop bay', bays >= 1, `${bays}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
