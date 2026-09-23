#!/usr/bin/env node
/**
 * 3D Cinematic Tow Truck Dispatch & Highway Convoy Verification Test
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { chromium } from 'playwright-core';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8033;
const BASE = `http://127.0.0.1:${PORT}`;

console.log('====================================================');
console.log('🚚 3D CINEMATIC TOW TRUCK VERIFICATION SUITE');
console.log('====================================================\n');

// 1. Start Vite Server
const vite = spawn('/home/kevin/.local/bin/node', ['./node_modules/.bin/vite', '--port', String(PORT), '--strictPort'], {
  cwd: rootDir,
  stdio: 'pipe',
  env: { ...process.env, PATH: `/home/kevin/.local/bin:${process.env.PATH}` }
});

vite.stdout.on('data', d => {
  // console.log(`[Vite] ${d}`);
});
vite.stderr.on('data', d => console.error(`[Vite ERR] ${d}`));

await new Promise(res => setTimeout(res, 2200));

let passed = 0;
let failed = 0;

function check(name, cond, extra) {
  if (cond) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${name}${extra ? ' — ' + extra : ''}`);
  }
}

try {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

  console.log('▶ [Test 1] Booting 3D Game Engine & Verifying Zero Console Errors');
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Awake game from start screen
  await page.evaluate(() => {
    if (window.game && window.game.hud && window.game.hud.startScreen) {
      window.game.hud.startScreen.click();
    }
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.resetTracking();
    }
  });
  await page.waitForTimeout(1000);

  const gameReady = await page.evaluate(() => !!window.game && !!window.game.towTruckManager);
  check('Game and TowTruckManager initialized on window.game', gameReady);
  check('Zero fatal page errors on boot', consoleErrors.length === 0, consoleErrors.join(' | '));

  console.log('\n▶ [Test 2] Inflicting Heavy Damage & Triggering Roadside Tow Dispatch');
  await page.evaluate(() => {
    // Inflict 100% damage to total vehicle
    window.game.physics.applyDamage(100);
  });
  await page.waitForTimeout(600);

  const isDamaged = await page.evaluate(() => window.game.gameState.carIntegrity === 0);
  check('Vehicle successfully damaged to 0% health', isDamaged);

  // Dispatch Tow Truck
  await page.evaluate(() => {
    window.game.hud.callTowTruck();
  });
  await page.waitForTimeout(500);

  const towState = await page.evaluate(() => ({
    isTowing: window.game.gameState.isTowing,
    phase: window.game.towTruckManager.phase,
    towShopName: window.game.gameState.towShopName,
    truckVisible: window.game.towTruckManager.towTruck.group.visible
  }));

  check('Tow Truck Dispatch initiated (gameState.isTowing is true)', towState.isTowing);
  check('Tow truck 3D model visible in scene', towState.truckVisible);
  check(`Tow destination identified: "${towState.towShopName}"`, !!towState.towShopName);
  check(`Phase 1: APPROACH active (phase="${towState.phase}")`, towState.phase === 'APPROACH');

  await page.screenshot({ path: join(rootDir, 'tow_cinematic_phase1_approach.png') });
  console.log('  📸 Screenshot saved: tow_cinematic_phase1_approach.png');

  console.log('\n▶ [Test 3] Watching Phase 2 (Hitch & Winch Connection)');
  // Poll until HITCH or TOW_CRUISE
  let reachedHitch = false;
  for (let i = 0; i < 70; i++) {
    await page.waitForTimeout(150);
    const p = await page.evaluate(() => window.game.towTruckManager.phase);
    if (p === 'HITCH' || p === 'TOW_CRUISE') {
      reachedHitch = true;
      break;
    }
  }
  check('Phase 2: HITCH reached', reachedHitch);
  await page.screenshot({ path: join(rootDir, 'tow_cinematic_phase2_hitch.png') });
  console.log('  📸 Screenshot saved: tow_cinematic_phase2_hitch.png');

  console.log('\n▶ [Test 4] Watching Phase 3 (Scenic Highway 1 Convoy Cruise)');
  // Poll until TOW_CRUISE
  let reachedCruise = false;
  for (let i = 0; i < 70; i++) {
    await page.waitForTimeout(150);
    const p = await page.evaluate(() => window.game.towTruckManager.phase);
    if (p === 'TOW_CRUISE') {
      reachedCruise = true;
      break;
    }
  }
  check('Phase 3: TOW_CRUISE reached', reachedCruise);

  await page.waitForTimeout(1000);
  const cruiseState = await page.evaluate(() => ({
    speedMph: window.game.gameState.speedMph,
    progress: window.game.gameState.towProgress,
    distToShop: window.game.towTruckManager.distanceToShop
  }));
  check(`TOW_CRUISE rolling at ${cruiseState.speedMph} MPH`, cruiseState.speedMph > 0);
  check(`Convoy progress advancing (${Math.round(cruiseState.progress * 100)}%)`, cruiseState.progress > 0);

  await page.screenshot({ path: join(rootDir, 'tow_cinematic_phase3_cruise.png') });
  console.log('  📸 Screenshot saved: tow_cinematic_phase3_cruise.png');

  console.log('\n▶ [Test 5] Testing Instant Skip [SPACE] & Complete Vehicle Overhaul');
  // Press Space to skip remaining cinematic
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);

  const restoredState = await page.evaluate(() => ({
    isTowing: window.game.gameState.isTowing,
    carIntegrity: window.game.gameState.carIntegrity,
    nitro: window.game.gameState.nitro,
    damageStage: window.game.gameState.damageStage,
    truckVisible: window.game.towTruckManager.towTruck.group.visible,
    playerZ: window.game.physics.position.z
  }));

  check('Skip cinematic cleanly ends towing (gameState.isTowing is false)', !restoredState.isTowing);
  check('Tow truck 3D model safely de-spawned', !restoredState.truckVisible);
  check('Vehicle integrity 100% fully restored', restoredState.carIntegrity === 100);
  check('Nitro fully refilled to 100%', restoredState.nitro === 100);
  check('Damage stage cleared to 0 (pristine)', restoredState.damageStage === 0);
  check('Player placed safely at mechanic shop', restoredState.playerZ > 0);

  await page.screenshot({ path: join(rootDir, 'tow_cinematic_restored_shop.png') });
  console.log('  📸 Screenshot saved: tow_cinematic_restored_shop.png');

  await browser.close();
} catch (err) {
  console.error('❌ Test error:', err);
  failed++;
} finally {
  vite.kill();
}

console.log('\n====================================================');
console.log(`📊 TOW TRUCK CINEMATIC SUMMARY: ${passed} Passed | ${failed} Failed`);
console.log('====================================================');

process.exit(failed > 0 ? 1 : 0);
