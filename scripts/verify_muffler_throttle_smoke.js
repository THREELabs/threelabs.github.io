import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite on port 5184...');
  const port = '5184';
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', port, '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log('🏎️ Launching Chrome to verify refined muffler smoke behavior...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  try {
    const startScreen = await page.$('#start-awaken-screen');
    if (startScreen) await startScreen.click();
  } catch (e) {}
  await page.waitForTimeout(1000);

  // Phase 1: First few seconds - smoke puffs out of muffler
  console.log('1. Checking initial startup smoke (first few seconds)...');
  await page.waitForTimeout(500);
  const startupSmoke = await page.evaluate(() => window.game.gpuVFX.activeExhaust.size);
  const debug1 = await page.evaluate(() => window.game.getSmokeDebug());
  console.log(`   Startup smoke count: ${startupSmoke}, startupTimer: ${debug1.startupSmokeTimer.toFixed(2)}s (expected > 0)`);

  // Phase 2: After a few seconds idling - smoke fades off completely
  console.log('2. Waiting for startup smoke to fade off at idle...');
  await page.waitForFunction(() => {
    const d = window.game.getSmokeDebug();
    return d.startupSmokeTimer <= 0.4 && d.activeExhaust === 0;
  }, { timeout: 45000 });
  const idleFadedSmoke = await page.evaluate(() => window.game.gpuVFX.activeExhaust.size);
  const debug2 = await page.evaluate(() => window.game.getSmokeDebug());
  console.log(`   Idle smoke after fade: ${idleFadedSmoke}, startupTimer: ${debug2.startupSmokeTimer.toFixed(2)}s (expected 0)`);
  await page.screenshot({ path: 'scripts/muffler_faded_idle.png' });

  // Phase 3: Push gas pedal - smoke puffs appear again
  console.log('3. Pushing gas pedal - puffs appear...');
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => window.game.gpuVFX.activeExhaust.size > 0, { timeout: 15000 });
  const throttlePuffSmoke = await page.evaluate(() => window.game.gpuVFX.activeExhaust.size);
  console.log(`   Throttle initial puff smoke count: ${throttlePuffSmoke} (expected > 0)`);
  await page.screenshot({ path: 'scripts/muffler_gas_puffs.png' });

  // Phase 4: Holding gas down - slowly dissipates until 0
  console.log('4. Holding gas pedal down - verifying slow dissipation...');
  await page.waitForFunction(() => {
    const d = window.game.getSmokeDebug();
    return d.throttleSmokeIntensity === 0 && d.activeExhaust === 0;
  }, { timeout: 45000 });
  const heldGasSmoke = await page.evaluate(() => window.game.gpuVFX.activeExhaust.size);
  const debug4 = await page.evaluate(() => window.game.getSmokeDebug());
  console.log(`   Held gas smoke count: ${heldGasSmoke}, throttleIntensity: ${debug4.throttleSmokeIntensity.toFixed(2)} (expected 0)`);
  await page.screenshot({ path: 'scripts/muffler_gas_held_dissipated.png' });

  // Phase 5: Release gas and repush - smoke puffs appear again!
  console.log('5. Releasing gas pedal and repushing...');
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(500);
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => window.game.gpuVFX.activeExhaust.size > 0, { timeout: 15000 });
  const repushedSmoke = await page.evaluate(() => window.game.gpuVFX.activeExhaust.size);
  console.log(`   Repushed gas smoke count: ${repushedSmoke} (expected > 0)`);
  await page.screenshot({ path: 'scripts/muffler_gas_repressed.png' });
  await page.keyboard.up('KeyW');

  console.log('\nResults Summary:');
  console.log(`Console Errors: ${errors.length}`);
  const pass = errors.length === 0 &&
               startupSmoke > 0 &&
               idleFadedSmoke === 0 &&
               throttlePuffSmoke > 0 &&
               heldGasSmoke === 0 &&
               repushedSmoke > 0;

  if (pass) {
    console.log('✅ [PASS] All muffler smoke behavioral criteria verified successfully!');
  } else {
    console.error('❌ [FAIL] Criteria not fully met.');
  }

  await browser.close();
  server.kill();
  process.exit(pass ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
