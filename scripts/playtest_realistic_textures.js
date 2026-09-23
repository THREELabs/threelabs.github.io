import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite server on port 5188...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5188', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', d => {
    // console.log(`[Vite] ${d}`);
  });
  server.stderr.on('data', d => {
    console.error(`[Vite ERR] ${d}`);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('🌐 Launching Chrome...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error(`[Browser Error]: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.error(`[Page Error]: ${err.message}`);
  });

  console.log('Loading http://localhost:5188 ...');
  await page.goto('http://localhost:5188', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click awaken button to start if present
  try {
    const awakenBtn = await page.$('#start-awaken-btn');
    if (awakenBtn) {
      await page.evaluate(el => el.click(), awakenBtn);
    }
  } catch (e) {}

  await page.waitForTimeout(1500);

  // 1. Capture Orbit Intro with Sky, Clouds, Ground, and Safari Jeep
  console.log('📸 Capturing textures_intro_sky_ground.png...');
  await page.screenshot({ path: 'scripts/textures_intro_sky_ground.png' });

  // 2. Press KeyW to accelerate and bypass into driving state
  console.log('Accelerating into driving mode...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scripts/textures_driving_road_shoulder.png' });
  await page.keyboard.up('KeyW');

  // 3. Drive slightly off-road onto dirt/sand
  console.log('Steering toward shoulder/ground...');
  await page.keyboard.down('KeyW');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyD');
  await page.keyboard.up('KeyW');

  console.log('📸 Capturing textures_offroad_dirt_barrier.png...');
  await page.screenshot({ path: 'scripts/textures_offroad_dirt_barrier.png' });

  // Check render metrics
  const metrics = await page.evaluate(() => {
    if (window.game && window.game.renderer) {
      return window.game.renderer.getRenderMetrics();
    }
    return null;
  });
  console.log('📊 Render metrics:', metrics);

  await browser.close();
  server.kill();

  console.log(`✅ Test complete. Errors detected: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Errors:', errors);
    process.exit(1);
  }
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
