#!/usr/bin/env node
import { chromium } from 'playwright-core';
import fs from 'fs';

const BASE = process.argv[2] || 'http://localhost:5173';
let passed = 0;
let failed = 0;

function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${name}${extra ? ' — ' + extra : ''}`);
  }
}

async function run() {
  console.log('🚀 Launching Playwright Chromium for Off-Road Experience verification...');
  const executablePath = '/home/kevin/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(executablePath) ? executablePath : '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows'
    ]
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const consoleErrors = [];
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

  console.log(`📡 Navigating to ${BASE}...`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Filter out any benign favicon or sound asset 404s if any
  const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('audio-unlock'));
  check('Game boots with zero critical console errors', criticalErrors.length === 0, criticalErrors.join(' | '));

  // 1. Verify Off-Road HUD Cluster DOM presence
  const clusterCount = await page.locator('#hud-offroad-cluster').count();
  check('Off-Road Telemetry Cluster (#hud-offroad-cluster) is mounted in DOM', clusterCount === 1);

  const rollGaugeCount = await page.locator('#inclinometer-roll-disc').count();
  const pitchGaugeCount = await page.locator('#inclinometer-pitch-ladder').count();
  const driveBtnCount = await page.locator('#btn-toggle-4x4').count();
  const spotterCount = await page.locator('#spotter-radio-text').count();
  check('Inclinometer Roll gauge exists', rollGaugeCount === 1);
  check('Inclinometer Pitch gauge exists', pitchGaugeCount === 1);
  check('Drive Mode selector button exists', driveBtnCount === 1);
  check('Spotter radio advice ticker exists', spotterCount === 1);

  // Dismiss awaken screen if present
  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  // Start game from intro
  await page.evaluate(() => {
    if (window.game) {
      window.game.gameState.isAwakening = false;
      window.game.gameState.isIntroActive = false;
      window.game.gameState.introState = 'playing';
      window.game.gameState.hasGameStarted = true;
      if (window.game.cameraManager) window.game.cameraManager.skipIntro();
    }
  });
  await page.waitForTimeout(500);

  // 2. Verify Initial State: Closed by default so controls are 100% free
  const isClusterOpenInitially = await page.evaluate(() => document.querySelector('#hud-offroad-cluster')?.classList.contains('open'));
  check('Telemetry cluster is closed by default (does not obstruct controls)', isClusterOpenInitially === false);

  // 2. Verify Initial Shifter State: HIGH by default
  const shifterKnob = await page.locator('#touch-shifter-knob');
  const initialMode = await page.evaluate(() => document.querySelector('#touch-shifter-knob')?.getAttribute('data-mode'));
  check('Shifter knob displays HIGH gear initially', initialMode === 'HIGH', `got "${initialMode}"`);

  // 3. Test Clicking Shifter Knob: Shifts to LOW
  await page.evaluate(() => document.querySelector('#touch-shifter-knob')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await page.waitForTimeout(300);
  const modeAfterClick = await page.evaluate(() => document.querySelector('#touch-shifter-knob')?.getAttribute('data-mode'));
  check('Tapping shifter knob shifts to LOW gear', modeAfterClick === 'LOW', `got "${modeAfterClick}"`);

  // Verify locked differentials in LOW
  const isDiffLocked = await page.evaluate(() => window.game && window.game.physics ? window.game.physics.diffLocked : null);
  check('LOW mode engages locked differentials in physics', isDiffLocked === true, `got ${isDiffLocked}`);

  // Tap again to shift back to HIGH
  await page.evaluate(() => document.querySelector('#touch-shifter-knob')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await page.waitForTimeout(300);
  const modeAfterClick2 = await page.evaluate(() => document.querySelector('#touch-shifter-knob')?.getAttribute('data-mode'));
  check('Tapping shifter knob again wraps around to HIGH gear', modeAfterClick2 === 'HIGH', `got "${modeAfterClick2}"`);

  // 4. Test KeyX / Space hotkey dispatch: shifts to LOW
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' })));
  await page.waitForTimeout(300);
  const modeAfterKeyX = await page.evaluate(() => document.querySelector('#touch-shifter-knob')?.getAttribute('data-mode'));
  check('Pressing KeyX cycles to LOW GEAR', modeAfterKeyX === 'LOW', `got "${modeAfterKeyX}"`);

  // KeyX back to HIGH
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' })));
  await page.waitForTimeout(300);

  // 4. Test Inclinometer & Spotter Telemetry on Cougar Ridge 4x4 Trail
  console.log('🏔️ Teleporting vehicle onto Cougar Ridge technical trail in HIGH gear to verify alert...');
  const teleportResult = await page.evaluate(() => {
    if (!window.game || !window.game.physics || !window.game.splineRoad) return false;
    const summitTrans = window.game.splineRoad.getRoadTransformAtZ(1100, -250, 0);
    const elev = window.game.terrain ? window.game.terrain.getGroundElevation(summitTrans.pos.x, 1100) : 56.0;
    window.game.physics.setDriveMode('HIGH');
    window.game.physics.position.set(summitTrans.pos.x, elev + 0.2, 1100.0);
    window.game.physics.heading = summitTrans.heading;
    window.game.physics.speed = 5.0; // Moving on trail in HIGH triggers alert
    return true;
  });
  check('Vehicle teleported to Cougar Ridge trail', teleportResult === true);

  // Step physics and let HUD update
  await page.evaluate(() => {
    if (window.game && window.game.physics) {
      window.game.physics.update(1 / 60, { throttle: 0.5, brake: 0, steer: 0, isTouchSteering: false });
      if (window.game.hud) window.game.hud.update(1 / 60);
    }
  });
  await page.waitForTimeout(800);

  // Verify prominent wrong-gear alert shows on screen!
  const alertStatus = await page.evaluate(() => {
    const alertEl = document.querySelector('#hud-gear-alert');
    const gs = window.game ? window.game.gameState : {};
    return {
      hasEl: !!alertEl,
      hasVisible: alertEl ? alertEl.classList.contains('visible') : false,
      classList: alertEl ? Array.from(alertEl.classList) : [],
      isWrongGear: gs.isWrongGear,
      isWrongDrivetrain: gs.isWrongDrivetrain,
      recommendedDriveMode: gs.recommendedDriveMode,
      driveMode: gs.driveMode,
      isIntroActive: gs.isIntroActive,
      isServicing: gs.isServicing,
      isTabletOpen: gs.isTabletOpen
    };
  });
  console.log('🔍 Alert Status:', JSON.stringify(alertStatus));
  const isAlertVisible = alertStatus.hasVisible;
  check('Wrong gear alert banner is visible when driving on trail in HIGH gear', isAlertVisible === true);
  await page.screenshot({ path: 'scripts/wrong_gear_alert.png' });

  // Shift to LOW on trail
  await page.evaluate(() => {
    window.game.physics.setDriveMode('LOW');
  });
  await page.waitForTimeout(400);

  const isAlertCleared = await page.evaluate(() => {
    const alertEl = document.querySelector('#hud-gear-alert');
    return alertEl ? !alertEl.classList.contains('visible') : true;
  });
  check('Shifting to LOW on trail clears the wrong gear alert', isAlertCleared === true);
  await page.waitForTimeout(1500);

  const telemetry = await page.evaluate(() => {
    const gs = window.game.gameState;
    return {
      pitchDeg: gs.pitchDeg,
      rollDeg: gs.rollDeg,
      altitudeMeters: gs.altitudeMeters,
      trailGradePct: gs.trailGradePct,
      isOnTrail: gs.isOnTrail,
      currentTrailStage: gs.currentTrailStage,
      wheelElevations: gs.wheelElevations,
      axleTilt: gs.axleTilt
    };
  });

  console.log('📊 Cougar Ridge Telemetry Snapshot:', JSON.stringify(telemetry, null, 2));

  check('Vehicle reports isOnTrail on Cougar Ridge', telemetry.isOnTrail === true);
  check('Altitude is tracked (> 10m on trail)', telemetry.altitudeMeters > 10, `got ${telemetry.altitudeMeters}m`);
  check('Spotter stage or trail info is detected', !!telemetry.currentTrailStage, `got "${telemetry.currentTrailStage}"`);
  check('4-wheel elevations are computed', typeof telemetry.wheelElevations?.fl === 'number');
  check('Live solid axle tilt is computed', typeof telemetry.axleTilt?.front === 'number');

  // 5. Capture screenshot of the off-road HUD telemetry and terrain
  const screenshotPath = 'scripts/offroad_telemetry_hud.png';
  await page.screenshot({ path: screenshotPath });
  check('Captured playtest screenshot', fs.existsSync(screenshotPath));

  await browser.close();

  console.log('\n====================================================');
  console.log(`🏁 OFFROAD PLAYTEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

run().catch(err => {
  console.error('Fatal playtest error:', err);
  process.exit(1);
});
