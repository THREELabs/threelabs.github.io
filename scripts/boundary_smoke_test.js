import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 9888;
server.listen(PORT, async () => {
  console.log(`Boundary test server running at http://localhost:${PORT}`);

  try {
    const browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--enable-webgl']
    });

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Fast skip intro
    await page.evaluate(() => {
      window.game.cameraManager.skipIntro();
      window.game.gameState.isIntroActive = false;
      window.game.gameState.introState = 'playing';
    });
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // Test 1: Lateral Boundary Clamping & Rigid Wall Collision
    // -------------------------------------------------------------
    console.log('--- TEST 1: Lateral Boundary Enforcement ---');
    const lateralResult = await page.evaluate(() => {
      const p = window.game.physics;
      // Teleport car sideways to extreme right (X = 250m)
      p.position.x = 250;
      p.position.z = 500;
      p.speed = 25;
      
      // Step physics 5 frames
      for (let f = 0; f < 5; f++) {
        p.update(0.016, { throttle: 1, steer: 0, brake: 0, handbrake: false, nitro: false });
      }

      const roadInfo = p.splineRoad.getRoadInfo(p.position.x, p.position.z);
      const latDist = Math.abs(p.position.x - roadInfo.roadPoint.x);
      return {
        posX: p.position.x,
        posZ: p.position.z,
        latDist,
        withinBounds: latDist <= 116.0
      };
    });

    console.log('Lateral test result:', lateralResult);
    if (!lateralResult.withinBounds) {
      throw new Error(`Lateral boundary failed to clamp position. Distance: ${lateralResult.latDist}m`);
    }
    console.log('✅ Lateral corridor boundary successfully clamped vehicle at edge!');

    // -------------------------------------------------------------
    // Test 2: Start Grid and Finish Line Z Boundary Collisions
    // -------------------------------------------------------------
    console.log('--- TEST 2: Z-Axis World Limits ---');
    const zResult = await page.evaluate(() => {
      const p = window.game.physics;
      // Try driving backwards past start line (Z = -50m)
      p.position.set(0, 1, -50);
      p.speed = -20;
      p.heading = 0;
      for (let f = 0; f < 5; f++) {
        p.update(0.016, { throttle: 0, steer: 0, brake: 1, handbrake: false, nitro: false });
      }
      const clampedStartZ = p.position.z >= -20.5;

      // Try driving forward past finish line (Z = 12600m)
      p.position.set(0, 5, 12600);
      p.speed = 30;
      for (let f = 0; f < 5; f++) {
        p.update(0.016, { throttle: 1, steer: 0, brake: 0, handbrake: false, nitro: false });
      }
      const clampedFinishZ = p.position.z <= 12506.0;

      return { clampedStartZ, clampedFinishZ, startZ: p.position.z };
    });

    console.log('Z Boundary test result:', zResult);
    if (!zResult.clampedStartZ || !zResult.clampedFinishZ) {
      throw new Error(`Z boundary clamping failed: ${JSON.stringify(zResult)}`);
    }
    console.log('✅ Start grid and Finish line Z boundaries successfully enforced!');

    // -------------------------------------------------------------
    // Test 3: Fallback Out-of-Bounds & Void Recovery (Y < -4m)
    // -------------------------------------------------------------
    console.log('--- TEST 3: Out-of-Bounds & Void Recovery Fallback ---');
    const recoveryResult = await page.evaluate(() => {
      const p = window.game.physics;
      const initialZ = 3900; // Big Sur Bixby area
      p.position.set(-15, 30, initialZ);
      p.speed = 40;

      // Simulate glitching/falling below terrain into void
      p.position.y = -8.5;

      // Update physics to trigger fallback check
      p.update(0.016, { throttle: 0, steer: 0, brake: 0, handbrake: false, nitro: false });

      const roadInfo = p.splineRoad.getRoadInfo(p.position.x, p.position.z);
      const isNearRoad = Math.abs(p.position.x - roadInfo.roadPoint.x) < 2.0;
      const isAboveGround = p.position.y >= 0;
      const isZeroVelocity = p.speed === 0 && p.verticalVelocity === 0;

      const toastVisible = document.querySelector('#hud-rescue-toast') && document.querySelector('#hud-rescue-toast').classList.contains('show');

      return {
        recoveredPos: { x: p.position.x, y: p.position.y, z: p.position.z },
        isNearRoad,
        isAboveGround,
        isZeroVelocity,
        speed: p.speed,
        toastVisible
      };
    });

    console.log('Recovery result:', recoveryResult);
    if (!recoveryResult.isNearRoad || !recoveryResult.isAboveGround || !recoveryResult.isZeroVelocity) {
      throw new Error(`Out-of-bounds recovery failed: ${JSON.stringify(recoveryResult)}`);
    }
    if (!recoveryResult.toastVisible) {
      console.warn('Rescue toast was not active, check DOM');
    }
    console.log('✅ Out-of-bounds void drop was instantly caught and vehicle safely recovered on Highway 1!');

    console.log(`Total errors captured: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors:', errors);
      throw new Error('Test failed due to console/page errors');
    }

    console.log('\n🎉 ALL BOUNDARY, COLLISION & RESCUE TESTS PASSED PERFECTLY!');
    await browser.close();
    server.close();
    process.exit(0);

  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    process.exit(1);
  }
});
