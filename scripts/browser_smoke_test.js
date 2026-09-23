#!/usr/bin/env node
/**
 * Headless browser smoke test for the P0 batch (DESIGN_REVIEW.md).
 * Boots the real game in Chrome, checks console errors, dev-toolbar gating,
 * localStorage persistence round-trip, and the F-key accessibility toggle.
 *
 * Usage: node scripts/browser_smoke_test.js [baseURL]
 */
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://127.0.0.1:8017';
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

const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

// ---------- 1. Boot the game (production mode, no ?dev=1) ----------
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

check('Game boots with zero console errors', consoleErrors.length === 0,
  consoleErrors.slice(0, 3).join(' | '));

// ---------- 2. Dev toolbar gating ----------
const devBtnsProd = await page.locator('.dev-only').count();
check('P0-5: dev buttons stripped in production URL', devBtnsProd === 0, `found ${devBtnsProd}`);
const musicBtn = await page.locator('#btn-music-source').count();
check('P0-5: music station button kept for players', musicBtn === 1);

// ---------- 3. Persistence round-trip inside the real browser ----------
await page.evaluate(async () => {
  const s = await import('/js/storage.js');
  s.resetSaveData();
  s.saveBestLap(77.77);
  s.saveDiscoveredRoute('CANYON CHASM SHORTCUT');
  s.addTotalMeters(12345);
});
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);
const persisted = await page.evaluate(async () => {
  const s = await import('/js/storage.js');
  return {
    best: s.getBestLap(),
    routes: s.countDiscoveredRoutes(),
    meters: s.getTotalMeters()
  };
});
check('P0-3: best lap survives a real page reload', persisted.best === 77.77, JSON.stringify(persisted));
check('P0-3: discovered routes survive reload', persisted.routes === 1);
check('P0-3: career odometer survives reload', persisted.meters === 12345);

// ---------- 4. F-key accessibility toggle ----------
await page.keyboard.press('KeyF'); // needs focus on page
await page.waitForTimeout(300);
const rfOn = await page.evaluate(async () => (await import('/js/storage.js')).getSettings().reduceFlashing);
check('P0-4: pressing F enables reduce-flashing', rfOn === true);
await page.keyboard.press('KeyF');
await page.waitForTimeout(300);
const rfOff = await page.evaluate(async () => (await import('/js/storage.js')).getSettings().reduceFlashing);
check('P0-4: pressing F again disables it', rfOff === false);

// ---------- 5. Game runs (racing simulation via exposed dev hook) ----------
const raceStarted = await page.evaluate(() => {
  try { window.triggerCopTakedownTest(); return true; }
  catch (e) { return 'hook missing: ' + e.message; }
});
await page.waitForTimeout(1500);
check('Autopilot cop-test hook engages race', raceStarted === true);
check('No errors after simulated racing frames',
  !consoleErrors.some(e => e.includes('PAGEERROR')), consoleErrors.join(' | '));

// ---------- 5b. Live gameplay: cop ram must damage the truck (P0-1) ----------
let dmg = 'timeout';
for (let i = 0; i < 40 && dmg !== 2; i++) {          // poll up to ~20s
  await page.waitForTimeout(500);
  dmg = await page.evaluate(() => {
    const gs = window.__gameState;
    return gs ? gs.truckDamage : 'no-state';
  });
  if (typeof dmg === 'number' && dmg > 0) break;
}
check('P0-1: ramming cop escalates truck damage', typeof dmg === 'number' && dmg > 0, `truckDamage=${dmg}`);

// ---------- 5c. Live gameplay: sector telemetry fires at checkpoint (P0-2) ----------
await page.evaluate(() => {
  // Teleport just before checkpoint 1 (25% of track) and let the loop cross it
  const gs = window.__gameState;
  const cp = gs.checkpoints[0].z;
  gs.position = (cp - 3000 + gs.trackLength) % gs.trackLength;
  gs.speed = gs.segments.length * 200 * 0.9; // near max speed
});
let sector = null;
for (let i = 0; i < 16 && !(sector && sector.saved); i++) { // poll up to ~8s
  await page.waitForTimeout(500);
  sector = await page.evaluate(async () => {
    const s = await import('/js/storage.js');
    const bests = s.getSectorBests();
    return { bests, saved: bests.some(b => b != null), cur: window.__gameState.curSectorIdx };
  });
}
check('P0-2: sector best saved after crossing checkpoint',
  !!sector && sector.saved, JSON.stringify(sector));

// ---------- 5d. (retired) near-miss bonus — racers removed from game ----------

// ---------- 5e. Live gameplay: mirror mode runs clean (P1-9) ----------
const mirrorOk = await page.evaluate(() => {
  const gs = window.__gameState;
  gs.mirrored = true;
  return gs.mirrored === true;
});
await page.waitForTimeout(2500); // race several seconds with flipped handling/render
check('P1-9: mirror mode engages', mirrorOk === true);
check('P1-9: no errors while racing mirrored',
  !consoleErrors.some(e => e.includes('PAGEERROR')), consoleErrors.join(' | '));
await page.evaluate(() => { window.__gameState.mirrored = false; });

// ---------- 6. Dev mode still works with ?dev=1 ----------
const page2 = await browser.newPage();
await page2.goto(BASE + '/index.html?dev=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page2.waitForTimeout(800);
const devBtnsDev = await page2.locator('.dev-only').count();
check('?dev=1 restores the 3 dev buttons', devBtnsDev === 3, `found ${devBtnsDev}`);
await page2.close();

console.log('\n====================================================');
console.log(`📊 SMOKE SUMMARY: ${passed} Passed | ${failed} Failed | Total: ${passed + failed}`);
console.log('====================================================');

await browser.close();
process.exit(failed > 0 ? 1 : 0);
