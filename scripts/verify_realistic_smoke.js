import { chromium } from 'playwright-core';

async function run() {
  console.log('🏎️ Launching Chrome for Realistic Jeep Smoke VFX Verification...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error(`[Browser Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  });

  console.log('🌐 Loading http://localhost:8000 ...');
  await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  try {
    const startScreen = await page.$('#start-awaken-screen');
    if (startScreen) {
      await startScreen.click();
      console.log('🏁 Dismissed awaken start screen');
    }
  } catch (e) {
    console.log('No awaken screen to dismiss');
  }
  await page.waitForTimeout(1500);

  // 1. Verify Idle Smoke Puffs
  console.log('💨 Phase 1: Verifying Idle Smoke Puffs from Safari Jeep Tailpipe...');
  await page.waitForTimeout(2000);
  const idleSmokeCount = await page.evaluate(() => {
    if (!window.game || !window.game.gpuVFX) return 0;
    return window.game.gpuVFX.activeExhaust.size;
  });
  console.log(`  Active exhaust smoke particles during idle: ${idleSmokeCount}`);
  await page.screenshot({ path: 'scripts/smoke_idle_puff.png' });

  // 2. Accelerate and test Throttle Onset & High-Speed Exhaust Billow
  console.log('🏎️ Phase 2: Testing Throttle Onset & High-Speed Exhaust Billows...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2000);

  const accelSmokeData = await page.evaluate(() => {
    const g = window.game;
    return {
      activeExhaust: g.gpuVFX.activeExhaust.size,
      speed: Math.round(g.physics.speed),
      exhaustTip: g.sportsCar.exhaustTip ? {
        x: g.sportsCar.exhaustTip.position.x.toFixed(2),
        y: g.sportsCar.exhaustTip.position.y.toFixed(2),
        z: g.sportsCar.exhaustTip.position.z.toFixed(2)
      } : null
    };
  });
  console.log('  Acceleration Smoke Data:', JSON.stringify(accelSmokeData));
  await page.screenshot({ path: 'scripts/smoke_accelerating.png' });

  // 3. Test Nitro Plumes & High-Velocity Vapor
  console.log('⚡ Phase 3: Testing Nitro Plumes & Vapor Trail...');
  await page.keyboard.down('Space'); // Nitro
  await page.waitForTimeout(1500);
  const nitroSmokeData = await page.evaluate(() => {
    return {
      activeNitro: window.game.gpuVFX.activeNitro.size,
      activeExhaust: window.game.gpuVFX.activeExhaust.size,
      speed: Math.round(window.game.physics.speed)
    };
  });
  console.log('  Nitro Smoke Data:', JSON.stringify(nitroSmokeData));
  await page.screenshot({ path: 'scripts/smoke_nitro_boost.png' });
  await page.keyboard.up('Space');

  // 4. Test Burnout & Tire Friction Smoke
  console.log('🔥 Phase 4: Testing Tire Drift & Burnout Smoke...');
  await page.keyboard.down('KeyA');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(1800);
  const driftSmokeData = await page.evaluate(() => {
    return {
      activeRooster: window.game.gpuVFX.activeRooster.size,
      activeExhaust: window.game.gpuVFX.activeExhaust.size,
      isDrifting: window.game.gameState.isDrifting,
      speed: Math.round(window.game.physics.speed)
    };
  });
  console.log('  Drift Smoke Data:', JSON.stringify(driftSmokeData));
  await page.screenshot({ path: 'scripts/smoke_drift_burnout.png' });

  await page.keyboard.up('KeyA');
  await page.keyboard.up('KeyS');
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(1000);

  console.log('\n================ PLAYTEST VERIFICATION RESULTS ================');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((err, i) => console.error(`  [Error ${i + 1}] ${err}`));
  }

  const passed = consoleErrors.length === 0 &&
                 accelSmokeData.activeExhaust > 0 &&
                 accelSmokeData.exhaustTip !== null;

  if (passed) {
    console.log('✅ [PASS] Realistic Jeep Smoke VFX System verified successfully!');
  } else {
    console.error('❌ [FAIL] Smoke VFX verification failed.');
  }

  await browser.close();
  process.exit(passed ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal Playtest Error:', err);
  process.exit(1);
});
