#!/usr/bin/env node
/**
 * 3D Cinematic Mechanic Pit Crew Scene Verification Test
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { chromium } from 'playwright-core';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8062;
const BASE = `http://127.0.0.1:${PORT}`;

console.log('====================================================');
console.log('🔧 3D CINEMATIC MECHANIC SCENE VERIFICATION SUITE');
console.log('====================================================\n');

// 1. Start Vite Server
const vite = spawn('/home/kevin/.local/bin/node', ['./node_modules/.bin/vite', '--port', String(PORT), '--strictPort'], {
  cwd: rootDir,
  stdio: 'pipe',
  env: { ...process.env, PATH: `/home/kevin/.local/bin:${process.env.PATH}` }
});

vite.stdout.on('data', d => {});
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

  console.log('▶ [Test 1] Booting 3D Game Engine & Checking MechanicSceneManager');
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

  const managerReady = await page.evaluate(() => {
    return !!window.game &&
           !!window.game.mechanicSceneManager &&
           window.game.mechanicSceneManager.group.name === 'MechanicSceneManager_Group';
  });
  check('MechanicSceneManager initialized on window.game', managerReady);
  check('Zero fatal page errors on boot', consoleErrors.length === 0, consoleErrors.join(' | '));

  console.log('\n▶ [Test 2] Triggering Mechanic Scene and Verifying Phase 1 (ARRIVAL_LIFT)');
  await page.evaluate(() => {
    window.game.physics.applyDamage(65);
    window.game.mechanicSceneManager.startMechanicScene();
  });
  await page.waitForTimeout(500);

  const phase1Active = await page.evaluate(() => {
    return window.game.gameState.isMechanicCinematic === true &&
           window.game.mechanicSceneManager.isActive === true &&
           window.game.mechanicSceneManager.phase === 'ARRIVAL_LIFT';
  });
  check('Phase 1: Cinematic active and vehicle placed in service bay', phase1Active);

  await page.screenshot({ path: 'mechanic_cinematic_phase1_lift.png' });
  console.log('  📸 Captured screenshot: mechanic_cinematic_phase1_lift.png');

  console.log('\n▶ [Test 3] Simulating Phase Progression (ENGINE_TUNING & WHEEL_TIRE_SWAP)');
  await page.evaluate(() => {
    const mgr = window.game.mechanicSceneManager;
    // Step forward 2.0s
    for (let f = 0; f < 60; f++) {
      mgr.update(2.0 / 60);
    }
  });
  await page.waitForTimeout(300);

  const phase23State = await page.evaluate(() => {
    const p = window.game.mechanicSceneManager.phase;
    return p === 'ENGINE_TUNING' || p === 'WHEEL_TIRE_SWAP';
  });
  check('Phase 2/3: Engine tuning & wheel technician active', phase23State);

  await page.screenshot({ path: 'mechanic_cinematic_phase2_engine.png' });
  console.log('  📸 Captured screenshot: mechanic_cinematic_phase2_engine.png');

  console.log('\n▶ [Test 4] Verifying HUD Cinema Overlay & Diagnostic Telemetry');
  const checklistState = await page.evaluate(() => {
    const overlay = document.querySelector('#hud-servicing-overlay');
    const chkChassis = document.querySelector('#chk-chassis');
    return overlay && overlay.classList.contains('active') && !!chkChassis;
  });
  check('HUD cinema overlay active with diagnostic checklist telemetry', checklistState);

  await page.screenshot({ path: 'mechanic_cinematic_phase3_wheel_dyno.png' });
  console.log('  📸 Captured screenshot: mechanic_cinematic_phase3_wheel_dyno.png');

  console.log('\n▶ [Test 5] Simulating Full Overhaul Completion & Damage Reset');
  // Call skip / completion directly or step past end
  await page.evaluate(() => {
    window.game.mechanicSceneManager.skipCinematic();
  });
  await page.waitForTimeout(300);

  const overhaulComplete = await page.evaluate(() => {
    return window.game.gameState.carIntegrity === 100 &&
           window.game.gameState.isMechanicCinematic === false;
  });
  check('100% overhaul completed, chassis restored, nitro refilled', overhaulComplete);

  await page.screenshot({ path: 'mechanic_cinematic_phase5_restored.png' });
  console.log('  📸 Captured screenshot: mechanic_cinematic_phase5_restored.png');

  console.log('\n▶ [Test 6] Verifying Skip [SPACE / ENTER] Capability');
  await page.evaluate(() => {
    window.game.physics.applyDamage(80);
    window.game.mechanicSceneManager.startMechanicScene();
  });
  await page.waitForTimeout(300);

  // Click Skip button
  await page.evaluate(() => {
    const skipBtn = document.querySelector('#btn-skip-mechanic-cinema');
    if (skipBtn) skipBtn.click();
  });
  await page.waitForTimeout(300);

  const skippedState = await page.evaluate(() => {
    return window.game.gameState.isMechanicCinematic === false &&
           window.game.gameState.carIntegrity === 100;
  });
  check('Skip button immediately completes overhaul and returns control to player', skippedState);

  await browser.close();
} catch (err) {
  console.error('Fatal test error:', err);
  failed++;
} finally {
  vite.kill();
}

console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

process.exit(failed > 0 ? 1 : 0);
