import { chromium } from 'playwright-core';

async function run() {
  console.log('🌐 Launching Chrome for Coyote Ridge Dirt Trail visual verification...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  console.log('🏎️ Connecting to dev server at http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  // Click to start game
  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
    console.log('✅ Awaken screen dismissed');
  } catch (e) {
    console.log('Start screen already dismissed or clicked');
  }
  await page.waitForTimeout(1500);

  // Dismiss intro and switch to active chase camera
  await page.evaluate(() => {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.skipIntro();
    }
  });
  await page.waitForTimeout(500);

  // Helper to teleport vehicle on trail facing along trail spline
  async function teleportToTrail(t, customHeading = null) {
    return await page.evaluate(({ t, customHeading }) => {
      const g = window.game;
      if (!g || !g.physics || !g.splineRoad) return null;

      const lat = -22.0 - t * 88.0;
      const z = 1010.0 + t * 75.0 + Math.sin(t * Math.PI) * 14.0;

      const trans = g.splineRoad.getRoadTransformAtZ(z, lat, 0);
      const groundY = g.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z);

      // Next point for forward heading along trail
      const nextT = Math.min(1.0, t + 0.05);
      const nextLat = -22.0 - nextT * 88.0;
      const nextZ = 1010.0 + nextT * 75.0 + Math.sin(nextT * Math.PI) * 14.0;
      const nextTrans = g.splineRoad.getRoadTransformAtZ(nextZ, nextLat, 0);

      const dx = nextTrans.pos.x - trans.pos.x;
      const dz = nextTrans.pos.z - trans.pos.z;
      const forwardHeading = Math.atan2(dx, dz);
      const heading = (customHeading !== null) ? customHeading : forwardHeading;

      g.physics.position.x = trans.pos.x;
      g.physics.position.z = trans.pos.z;
      g.physics.position.y = groundY + 0.25;
      g.physics.speed = 0;
      g.physics.heading = heading;

      if (g.sportsCar && g.sportsCar.group) {
        g.sportsCar.group.position.copy(g.physics.position);
        g.sportsCar.group.rotation.y = heading;
      }
      if (g.cameraManager) {
        g.cameraManager.skipIntro();
        g.cameraManager.resetTracking();
      }
      return { x: trans.pos.x, y: groundY, z: trans.pos.z, heading };
    }, { t, customHeading });
  }

  // 1. View: Turnout Entrance facing Trailhead Dirt Apron, Timber Gateway Arch & Signs
  console.log('📸 View 1: Capturing Turnout Entrance facing Dirt Apron & Gateway Arch...');
  await teleportToTrail(0.01);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/evidence_trail_entrance.png' });
  console.log('  Saved: scripts/evidence_trail_entrance.png');

  // 2. View: Mid-Climb along Continuous 3D Dirt Trail, Dual Tire Ruts & Border Rocks
  console.log('📸 View 2: Capturing Mid-Climb 3D Dirt Roadbed with Ruts, Border Rocks, and Guide Stakes...');
  await teleportToTrail(0.48);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/evidence_trail_climb.png' });
  console.log('  Saved: scripts/evidence_trail_climb.png');

  // 3. View: Approaching Summit Observation Deck & Waypoint Arch
  console.log('📸 View 3: Capturing Summit Approach & Waypoint Arch...');
  await teleportToTrail(0.95);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/evidence_trail_summit.png' });
  console.log('  Saved: scripts/evidence_trail_summit.png');

  // 4. View: Looking Down from Summit Overlook Platform onto Route 66 Desert Valley
  console.log('📸 View 4: Capturing Summit Overlook Panoramic View down onto Route 66...');
  // Point heading east (toward highway, angle ~ -Math.PI * 0.5)
  await teleportToTrail(1.0, -Math.PI * 0.5);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/evidence_trail_overlook_view.png' });
  console.log('  Saved: scripts/evidence_trail_overlook_view.png');

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error(`💥 Playtest encountered ${consoleErrors.length} errors.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL PLAYTEST VIEWS CAPTURED WITH ZERO CONSOLE ERRORS!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Playtest failed:', err);
  process.exit(1);
});
