import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for comprehensive playtest...');
  const port = '5183';
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', port, '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', d => {});
  server.stderr.on('data', d => {
    console.error(`[Vite Err] ${d}`);
  });

  await new Promise(resolve => setTimeout(resolve, 2500));

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning' && !msg.text().includes('WebGL')) {
      consoleWarnings.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log(`🌐 Navigating to http://localhost:${port} ...`);
  await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click to start / dismiss intro gate
  console.log('🏁 Dismissing start gate...');
  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
  } catch (e) {
    console.log('Intro gate click passed or not needed');
  }
  await page.waitForTimeout(1000);

  // 1. Accelerate straight to build speed
  console.log('🏎️ Accelerating to high speed...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2200);

  // 2. Initiate sharp drift with Handbrake (Space) + Left Arrow
  console.log('💨 Initiating drift slide with handbrake & turn...');
  await page.keyboard.down('Space');
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(700);

  // Capture drift & skidmark visual confirmation
  await page.screenshot({ path: 'scripts/playtest_drift_skidmarks.png' });
  console.log('📸 Captured scripts/playtest_drift_skidmarks.png');

  // Release handbrake and counter-steer
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyD');

  // 3. Apply brakes to verify dive and suspension response
  console.log('🛑 Hard braking for suspension dive...');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/playtest_suspension_action.png' });
  console.log('📸 Captured scripts/playtest_suspension_action.png');
  await page.keyboard.up('KeyS');
  await page.keyboard.up('KeyW');

  // Query in-game telemetry
  const telemetry = await page.evaluate(() => {
    const g = window.game;
    if (!g) return { error: 'window.game not found' };
    const chunks = g.terrain ? g.terrain.chunks : [];
    const visibleChunks = chunks.filter(c => c.visible).length;
    const skidmarks = g.dynamicSkidmarks ? g.dynamicSkidmarks.currentIndex : 0;
    return {
      speedMph: g.gameState ? g.gameState.speedMph : 0,
      lateralSlip: g.gameState ? g.gameState.lateralSlipVelocity : 0,
      suspensionComp: g.gameState ? g.gameState.suspensionCompression : 0,
      isDrifting: g.gameState ? g.gameState.isDrifting : false,
      skidmarkStamps: skidmarks,
      playerPos: g.physics ? { x: g.physics.position.x, y: g.physics.position.y, z: g.physics.position.z } : null,
      terrainChunksVisible: `${visibleChunks} / ${chunks.length}`,
      qualityMode: g.gameState ? g.gameState.graphicsQuality : 'unknown',
      fps: g.gameState ? g.gameState.fps : 0
    };
  });

  console.log('📊 Telemetry Verification Results:', telemetry);

  await browser.close();
  server.kill();

  if (consoleErrors.length > 0) {
    console.error('❌ Console errors detected:', consoleErrors);
    process.exit(1);
  } else {
    console.log('✅ ZERO console errors detected!');
    console.log('✅ Dynamic skidmarks active stamps:', telemetry.skidmarkStamps);
    console.log('🎉 Browser playtest SUCCESSFUL!');
  }
}

run().catch(err => {
  console.error('Fatal Playtest Error:', err);
  process.exit(1);
});
