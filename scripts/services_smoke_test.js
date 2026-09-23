#!/usr/bin/env node
// Live verification: fuel economy, gas drive-thru, AI damage limping.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://127.0.0.1:8022';
let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ✅ [PASS] ${name}`); }
  else { failed++; console.error(`  ❌ [FAIL] ${name}${extra ? ' — ' + extra : ''}`); }
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
await page.evaluate(() => window.triggerCopTakedownTest());
await page.waitForTimeout(800);

// ---------- 1. Fuel burns while racing ----------
const fuelBefore = await page.evaluate(() => window.__gameState.fuel);
await page.waitForTimeout(3000);
const fuelAfter = await page.evaluate(() => window.__gameState.fuel);
check('Fuel burns while racing', fuelAfter < fuelBefore,
  `before=${fuelBefore && fuelBefore.toFixed(3)} after=${fuelAfter && fuelAfter.toFixed(3)}`);

// ---------- 2. Out-of-fuel limper caps speed ----------
await page.evaluate(() => { window.__gameState.fuel = 0; });
await page.waitForTimeout(1200);
const limp = await page.evaluate(async () => {
  const gs = window.__gameState;
  const c = await import('/js/constants.js');
  return { outOfFuel: gs.outOfFuel, speedRatio: gs.speed / c.maxSpeed };
});
check('Out of fuel flags and limps under ~40% speed',
  limp.outOfFuel === true && limp.speedRatio <= 0.45, JSON.stringify(limp));

// ---------- 3. Gas station auto-stop refuels ----------
await page.evaluate(async () => {
  const gs = window.__gameState;
  const c = await import('/js/constants.js');
  const segIdx = gs.segments.findIndex(s => s.pitStop && s.pitStop.name.includes('Oasis'));
  const seg = gs.segments[segIdx];
  const pit = seg.pitStop || seg.pitStopRef;
  // Place the truck IN the bay lane, rolling — the auto-stop must park it
  gs.state = 'racing';
  gs.isPulledOver = false;
  gs.timeLeft = 60;
  gs.position = ((segIdx * 200) - c.playerZ + gs.trackLength * 2) % gs.trackLength;
  gs.playerX = pit.laneOffset;
  gs.speed = c.maxSpeed * 0.35;
  gs.fuel = 0.1;
  gs.outOfFuel = true;
});
await page.waitForTimeout(3000);
const refueled = await page.evaluate(() => window.__gameState.fuel);
check('Gas station auto-stop refills tank', refueled >= 0.6, `fuel=${refueled && refueled.toFixed(2)}`);

// ---------- 4. Repair shop auto-stop fixes the truck ----------
const shopFix = await page.evaluate(async () => {
  const gs = window.__gameState;
  const c = await import('/js/constants.js');
  // Find the shop's actual segment by scanning for its sprite (source of truth)
  const { SPRITES } = await import('/js/sprites.js');
  let shopSegIdx = -1;
  for (const seg of gs.segments) {
    if (seg.sprites.some(sp => sp.source === SPRITES.AUTO_MECHANIC_SHOP)) { shopSegIdx = seg.index; break; }
  }
  if (shopSegIdx < 0) return { damage: -1, why: 'shop sprite not found on track' };
  // Drive the truck INTO the bay lane damaged & overheating — the auto-stop
  // must park it and the mechanic must fully repair it.
  const pitSeg = gs.segments[shopSegIdx];
  const pit = pitSeg.pitStop || pitSeg.pitStopRef;
  gs.state = 'racing';
  gs.isPulledOver = false;
  gs.timeLeft = 60;
  gs.position = ((shopSegIdx * 200) - c.playerZ - 8 * 200 + gs.trackLength * 3) % gs.trackLength;
  gs.playerX = pit.laneOffset;
  gs.speed = c.maxSpeed * 0.45;
  gs.truckDamage = 2;
  gs.engineHeat = 0.6;
  gs.heatLimp = false;
  gs.outOfFuel = false;
  gs.fuel = Math.max(gs.fuel, 0.5);
  // Neutralize the forced pursuit from earlier test steps — parked trucks
  // get rammed by chasing cops and re-wrecked mid-check otherwise.
  gs.pursuitActive = false;
  gs.heatPoints = 0;
  gs.heatStars = 0;
  // Full police stand-down: the earlier collision step can leave cops mid-
  // pursuit; they'd ram the parked truck during the service window.
  gs.policeImmunity = 999;
  for (const cop of (gs.policeList || [])) {
    if (cop.state === 'pursuit' || cop.sirenOn) {
      cop.state = 'cooldown';
      cop.timer = 30;
      cop.sirenOn = false;
    }
  }
  // Park police well behind the shop so a cruiser doesn't rear-end the
  // parked player truck mid-service.
  for (const cop of (gs.policeList || [])) {
    const oldSeg = gs.segments[Math.floor(cop.z / 200) % gs.segments.length];
    cop.z = ((shopSegIdx - 220 + gs.segments.length) % gs.segments.length) * 200;
    cop.speed = 0;
    const newSeg = gs.segments[Math.floor(cop.z / 200)];
    if (oldSeg !== newSeg) {
      const k = oldSeg.cars.indexOf(cop);
      if (k >= 0) oldSeg.cars.splice(k, 1);
      if (!newSeg.cars.includes(cop)) newSeg.cars.push(cop);
    }
  }
  return { damageSet: true };
});
// Poll fast — latch the repaired state the moment it appears (a cop may
// legitimately ram the truck again after hand-back; that's gameplay, not a
// service failure).
let afterRepair = null, sawRepaired = false;
for (let i = 0; i < 50; i++) {
  await page.waitForTimeout(90);
  const now = await page.evaluate(() => ({
    damage: window.__gameState.truckDamage,
    heat: window.__gameState.engineHeat,
    launch: window.__gameState.pitLaunchTimer,
    assist: window.__gameState.pitAssist
  }));
  if (!sawRepaired && now.damage === 0 && now.heat < 0.1) { sawRepaired = true; afterRepair = now; break; }
  afterRepair = now;
}
check('Auto-stop repair: truck fixed & engine cooled',
  afterRepair.damage === 0 && afterRepair.heat < 0.1,
  JSON.stringify({ ...afterRepair, entry: shopFix }));

check('Zero page errors', errors.length === 0, errors.join(' | '));

console.log('\n====================================================');
console.log(`📊 SERVICES SMOKE SUMMARY: ${passed} Passed | ${failed} Failed | Total: ${passed + failed}`);
console.log('====================================================');
await browser.close();
process.exit(failed > 0 ? 1 : 0);
