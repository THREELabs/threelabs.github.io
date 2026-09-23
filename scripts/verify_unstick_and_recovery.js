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

const PORT = 9889;
server.listen(PORT, async () => {
  console.log(`Unstick playtest server running at http://localhost:${PORT}`);

  try {
    const browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--enable-webgl']
    });

    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);

    // Skip intro
    await page.evaluate(() => {
      if (window.game && window.game.cameraManager) {
        window.game.cameraManager.skipIntro();
      }
      window.game.gameState.isIntroActive = false;
      window.game.gameState.introState = 'playing';
    });
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // Scenario: Reproduce user position at Z = 626m on Desert sand dune (right side)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Desert Dune Side-of-Road Positioning & Stationary Pivot ---');
    const pivotResult = await page.evaluate(() => {
      const p = window.game.physics;
      const rInfo = p.splineRoad.getRoadInfo(0, 626);
      const roadX = rInfo.roadPoint.x;
      // Position 45m out to the right up on the dune slope
      const duneX = roadX + 45.0;
      const groundY = p.getGroundHeightAt(duneX, 626);

      p.position.set(duneX, groundY + 0.18, 626);
      p.speed = 0;
      p.heading = 0.35; // Angled outward/uphill like screenshot
      p.smoothedSteer = 0;

      const initialHeading = p.heading;

      // Simulate steering left (-1) while stopped to turn back towards road
      for (let f = 0; f < 30; f++) {
        p.update(0.016, { throttle: 0, steer: -1.0, brake: 0, handbrake: false, nitro: false, isTouchSteering: true });
      }

      return {
        initialHeading,
        turnedHeading: p.heading,
        headingChanged: p.heading !== initialHeading,
        speed: p.speed,
        posX: p.position.x,
        posZ: p.position.z
      };
    });

    console.log('Pivot test result:', pivotResult);
    if (!pivotResult.headingChanged) {
      throw new Error('Vehicle failed to pivot while stopped on sand dune');
    }
    console.log('✅ Stationary steering pivot works: vehicle can rotate toward road from standstill!');

    // -------------------------------------------------------------
    // Test 2: Driving Back Inward from Dune Slope
    // -------------------------------------------------------------
    console.log('--- TEST 2: Driving Back Inward Towards Highway ---');
    const driveBackResult = await page.evaluate(() => {
      const p = window.game.physics;
      // Point vehicle directly inward towards highway (heading = -Math.PI / 2)
      p.heading = -Math.PI * 0.5;
      const initialDistToCenter = p.splineRoad.getRoadInfo(p.position.x, p.position.z).distToCenter;

      // Apply forward throttle for 45 frames
      for (let f = 0; f < 45; f++) {
        p.update(0.016, { throttle: 1.0, steer: 0, brake: 0, handbrake: false, nitro: false, isTouchSteering: true });
      }

      const endDistToCenter = p.splineRoad.getRoadInfo(p.position.x, p.position.z).distToCenter;
      return {
        initialDistToCenter,
        endDistToCenter,
        movedInward: endDistToCenter < initialDistToCenter,
        speedMph: window.game.gameState.speedMph
      };
    });

    console.log('Drive back result:', driveBackResult);
    if (!driveBackResult.movedInward || driveBackResult.speedMph <= 5) {
      throw new Error(`Vehicle failed to accelerate back toward road: ${JSON.stringify(driveBackResult)}`);
    }
    console.log('✅ Vehicle smoothly accelerates back down sand slope towards Highway!');

    // -------------------------------------------------------------
    // Test 3: Stuck Detection & HUD Rescue Button
    // -------------------------------------------------------------
    console.log('--- TEST 3: Stuck Detection & One-Tap Rescue ---');
    const stuckResult = await page.evaluate(() => {
      const p = window.game.physics;
      p.position.set(55, 5, 626);
      p.speed = 0;
      window.game.gameState.isStuck = false;

      // Hold gas while artificially kept stationary (simulating wedged wheels)
      for (let f = 0; f < 120; f++) {
        p.speed = 0;
        p.update(0.016, { throttle: 1.0, steer: 0, brake: 0, handbrake: false, nitro: false, isTouchSteering: true });
      }

      const isStuckState = window.game.gameState.isStuck;
      // Step HUD update
      window.game.hud.update(0.016, p, p.splineRoad);

      const stuckAlertEl = document.querySelector('#hud-stuck-alert');
      const isAlertVisible = stuckAlertEl ? stuckAlertEl.classList.contains('show') : false;

      return {
        isStuckState,
        isAlertVisible
      };
    });

    console.log('Stuck detection result:', stuckResult);
    if (!stuckResult.isStuckState || !stuckResult.isAlertVisible) {
      throw new Error(`Stuck alert failed to display: ${JSON.stringify(stuckResult)}`);
    }
    console.log('✅ Stuck alert displayed prominently on screen!');

    // Take screenshot of stuck alert on mobile
    await page.screenshot({ path: 'scripts/stuck_alert_mobile.png' });
    console.log('📸 Saved scripts/stuck_alert_mobile.png');

    // Click rescue button
    await page.click('#btn-stuck-rescue');
    await page.waitForTimeout(300);

    const rescueResult = await page.evaluate(() => {
      const p = window.game.physics;
      const rInfo = p.splineRoad.getRoadInfo(p.position.x, p.position.z);
      return {
        isOnRoad: rInfo.isOnRoad,
        distToCenter: rInfo.distToCenter,
        isStuck: window.game.gameState.isStuck,
        alertVisible: document.querySelector('#hud-stuck-alert').classList.contains('show')
      };
    });

    console.log('Rescue result:', rescueResult);
    if (!rescueResult.isOnRoad || rescueResult.isStuck || rescueResult.alertVisible) {
      throw new Error(`Rescue failed to restore vehicle cleanly: ${JSON.stringify(rescueResult)}`);
    }
    console.log('✅ One-tap road rescue successfully restored car cleanly to Highway 1 deck!');

    await page.screenshot({ path: 'scripts/stuck_recovered_mobile.png' });
    console.log('📸 Saved scripts/stuck_recovered_mobile.png');

    console.log(`Total errors captured: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors:', errors);
      throw new Error('Test failed due to console/page errors');
    }

    console.log('\n🎉 ALL UNSTICK & PLAYTEST VERIFICATION TESTS PASSED PERFECTLY!');
    await browser.close();
    server.close();
    process.exit(0);

  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    process.exit(1);
  }
});
