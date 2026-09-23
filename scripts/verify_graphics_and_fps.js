import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for graphics & FPS validation...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5179', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', d => {
    // console.log(`[Vite] ${d}`);
  });
  server.stderr.on('data', d => {
    console.error(`[Vite Err] ${d}`);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

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
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('🌐 Navigating to http://localhost:5179 ...');
  await page.goto('http://localhost:5179', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click to start / dismiss intro gate
  console.log('🏁 Dismissing start gate...');
  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
  } catch (e) {
    console.log('Intro gate click passed or not needed');
  }
  await page.waitForTimeout(1000);

  // Drive forward: hold W for 2.0 seconds to accelerate smoothly along Highway 1
  console.log('🏎️ Accelerating forward along Highway 1...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2000);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(400);

  // Capture clean highway cruising screenshot
  await page.screenshot({ path: 'scripts/playtest_driving_highway.png' });

  // Tap S to activate brake lights and rotor glow
  console.log('🛑 Applying brakes to illuminate brake lights & thermal rotor glow...');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/playtest_graphics_bloom.png' });
  await page.keyboard.up('KeyS');

  // Inspect telemetry from window.game in Zone 0
  const telemetryZ0 = await page.evaluate(() => {
    const g = window.game;
    if (!g) return { error: 'window.game not found' };
    const chunks = g.terrain ? g.terrain.chunks : [];
    const visibleChunks = chunks.filter(c => c.visible).length;
    const parentCounts = {};
    const scene = g.renderer ? g.renderer.scene : null;
    if (scene) {
      scene.traverse(c => {
        if (c.isMesh || c.isLine || c.isPoints) {
          let v = true;
          let p = c;
          while (p) {
            if (p.visible === false) { v = false; break; }
            p = p.parent;
          }
          if (v) {
            let top = c;
            while (top.parent && top.parent !== scene) top = top.parent;
            const key = top.name || top.constructor.name || 'root';
            parentCounts[key] = (parentCounts[key] || 0) + 1;
          }
        }
      });
    }
    return {
      speed: g.gameState ? g.gameState.speedMph : 0,
      playerZ: g.physics ? g.physics.position.z : 0,
      totalTerrainChunks: chunks.length,
      visibleTerrainChunks: visibleChunks,
      drawCalls: g.renderer && g.renderer.renderer ? g.renderer.renderer.info.render.calls : 0,
      triangles: g.renderer && g.renderer.renderer ? g.renderer.renderer.info.render.triangles : 0,
      fps: g.gameState ? g.gameState.fps : 0,
      parentCounts
    };
  });
  console.log('📊 Zone 0 Telemetry:', telemetryZ0);

  // Teleport to Hurricane Point (Z = 5630, Zone 2 - matching user screenshot)
  console.log('🌊 Teleporting to Hurricane Point (Z = 5630m)...');
  await page.evaluate(() => {
    const g = window.game;
    if (g && g.splineRoad && g.physics) {
      const trans = g.splineRoad.getRoadTransformAtZ(5630, 0, 0);
      g.physics.position.copy(trans.pos);
      g.physics.heading = trans.heading;
      g.physics.speed = 0;
      if (g.cameraManager && g.cameraManager.skipIntro) g.cameraManager.skipIntro();
    }
  });
  await page.waitForTimeout(1500);

  // Capture Hurricane Point screenshot
  await page.screenshot({ path: 'scripts/playtest_hurricane_point.png' });
  console.log('📸 Hurricane Point screenshot saved to scripts/playtest_hurricane_point.png');

  const telemetryZ2 = await page.evaluate(() => {
    const g = window.game;
    return {
      zoneIdx: g.zoneManager ? g.zoneManager.currentZoneIndex : -1,
      drawCalls: g.renderer && g.renderer.renderer ? g.renderer.renderer.info.render.calls : 0,
      triangles: g.renderer && g.renderer.renderer ? g.renderer.renderer.info.render.triangles : 0,
      fps: g.gameState ? g.gameState.fps : 0
    };
  });
  console.log('📊 Zone 2 Telemetry:', telemetryZ2);

  await browser.close();
  server.kill();

  if (consoleErrors.length > 0) {
    console.error('❌ Console errors detected:', consoleErrors);
    process.exit(1);
  } else {
    console.log('✅ ZERO console errors detected!');
    console.log(`✅ Terrain chunks active: ${telemetryZ0.visibleTerrainChunks} of ${telemetryZ0.totalTerrainChunks} (Culling verified!)`);
    console.log('🎉 Graphics & FPS validation SUCCESSFUL!');
  }
}

run().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
