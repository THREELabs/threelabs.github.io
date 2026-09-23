import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

async function run() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('Browser error:', msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error('Browser page error:', err.message);
  });

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait for window.game to initialize
  await page.waitForFunction(() => !!window.game && !!window.game.splineRoad && !!window.game.physics, { timeout: 15000 });
  console.log('window.game initialized successfully!');
  await page.waitForTimeout(1000);

  // Waypoints and inspection locations along the 1,200m+ trail
  const inspectionPoints = [
    {
      id: 'trailhead_staging',
      name: 'Trailhead Staging & Turnout Apron',
      latDist: -30,
      z: 1015,
      camOffset: { x: 8, y: 3.5, z: -10 },
      lookOffset: { x: -8, y: 1.0, z: 15 }
    },
    {
      id: 'cougar_creek_ford',
      name: 'Lower Cougar Creek Ford (Water Stream Crossing)',
      latDist: -95,
      z: 1140,
      camOffset: { x: 12, y: 3.2, z: -12 },
      lookOffset: { x: -8, y: 0.5, z: 10 },
      verifyStreamSurface: true
    },
    {
      id: 'cougar_falls_view',
      name: 'Cougar Falls Canyon & Plunge Pool',
      latDist: -155,
      z: 1310,
      camOffset: { x: -6, y: 3.5, z: 10 },
      lookOffset: { x: 1.3, y: 0.0, z: -37 }
    },
    {
      id: 'thunder_canyon_falls',
      name: 'Thunder Canyon & Towering Thunder Falls',
      latDist: -250,
      z: 1450,
      camOffset: { x: -12, y: 10.0, z: -12 },
      lookOffset: { x: 23.5, y: 16.0, z: 30.5 }
    },
    {
      id: 'thunder_creek_ford',
      name: 'Thunder Creek Waterfall Ford',
      latDist: -290,
      z: 1380,
      camOffset: { x: 10, y: 3.5, z: -10 },
      lookOffset: { x: -6, y: 0.5, z: 12 },
      verifyStreamSurface: true
    },
    {
      id: 'summit_overlook',
      name: 'Summit Vista Overlook Deck',
      latDist: -120,
      z: 1460,
      camOffset: { x: 8, y: 4.0, z: -10 },
      lookOffset: { x: -15, y: 0.5, z: 20 }
    }
  ];

  const results = [];

  for (const pt of inspectionPoints) {
    console.log(`\nInspecting: ${pt.name} (lat: ${pt.latDist}, z: ${pt.z})`);

    const evalResult = await page.evaluate((point) => {
      if (!window.game) return { error: 'window.game not found' };
      window.game.cameraManager.skipIntro();

      const splineRoad = window.game.splineRoad;
      const physics = window.game.physics;
      const veh = window.game.sportsCar || window.game.vehicle;

      // Transform at target road z and lateral offset
      const roadTrans = splineRoad.getRoadTransformAtZ(point.z, point.latDist, 0);

      // Position vehicle
      physics.position.copy(roadTrans.pos);
      physics.speed = 2.0; // small speed to tick ground contact
      if (veh && veh.group) {
        veh.group.position.copy(roadTrans.pos);
      }

      // Step physics tick with valid input
      if (typeof physics.update === 'function') {
        physics.update(0.016, window.game.input || { nitro: false, throttle: 0, brake: 0, steer: 0 });
      }

      // Aim camera to capture the scenery
      const cam = window.game.cameraManager.camera;
      cam.position.set(
        roadTrans.pos.x + point.camOffset.x,
        roadTrans.pos.y + point.camOffset.y,
        roadTrans.pos.z + point.camOffset.z
      );
      cam.lookAt(
        roadTrans.pos.x + point.lookOffset.x,
        roadTrans.pos.y + point.lookOffset.y,
        roadTrans.pos.z + point.lookOffset.z
      );

      const roadInfo = splineRoad.getRoadInfo(roadTrans.pos.x, roadTrans.pos.z);

      return {
        pos: { x: roadTrans.pos.x, y: roadTrans.pos.y, z: roadTrans.pos.z },
        surfaceType: physics.surfaceType,
        isOnTrail: roadInfo ? roadInfo.isOnTrail : false,
        coyoteRidge: splineRoad.isCoyoteRidgeTrail(roadTrans.pos.x, roadTrans.pos.z)
      };
    }, pt);

    console.log('Telemetry:', evalResult);
    results.push({ pt, evalResult });

    await page.waitForTimeout(1200);
    const shotPath = `scripts/trail_expedition_${pt.id}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`📸 Screenshot saved to ${shotPath}`);
  }

  // Check FPS and WebGL stability
  const perfInfo = await page.evaluate(() => {
    return {
      gameStateActive: !!window.gameState,
      hasRenderer: !!(window.game && window.game.renderer),
      vehiclePosition: window.game?.physics?.position
    };
  });
  console.log('\nFinal engine status:', perfInfo);

  await browser.close();

  console.log('\n=============================================');
  console.log(`Browser Playtest Completed.`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errors encountered:', consoleErrors);
  }
  console.log('=============================================');

  if (consoleErrors.length > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Playtest failed:', err);
  process.exit(1);
});
