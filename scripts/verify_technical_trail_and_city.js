import { chromium } from 'playwright-core';

async function run() {
  console.log('🚀 Starting Cougar Ridge Technical 4x4 Trail & Surprise City verification...');
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

  console.log('🏎️ Navigating to dev server at http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
    console.log('✅ Awaken screen dismissed');
  } catch (e) {
    console.log('Start screen already dismissed or clicked');
  }
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.skipIntro();
    }
  });
  await page.waitForTimeout(500);

  // Helper to teleport vehicle on trail
  async function teleportToTrail(t, customHeading = null) {
    return await page.evaluate(({ t, customHeading }) => {
      const g = window.game;
      if (!g || !g.physics || !g.splineRoad) return null;

      const lat = -22.0 - t * 88.0;
      const z = 1010.0 + t * 75.0 + Math.sin(t * Math.PI) * 14.0;

      const trans = g.splineRoad.getRoadTransformAtZ(z, lat, 0);
      const groundY = g.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z);

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

  // 1. Trailhead: Double Black Diamond Gateway & Recovery Winch Anchor
  console.log('📸 1. Capturing Trailhead Double Black Diamond Gateway...');
  await teleportToTrail(0.01);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/evidence_trailhead_blackdiamond.png' });

  // 2. Section 7A & 7B: Gatekeeper Articulation Moguls & Sledgehammer Boulder Garden
  console.log('📸 2. Capturing Sledgehammer Boulder Garden & Gatekeeper Moguls...');
  await teleportToTrail(0.26);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/evidence_boulder_garden.png' });

  // 3. Section 7C & 7D: Devil\'s Shelf Rock Steps, Winch Anchor & Cougar V-Notch
  console.log('📸 3. Capturing Devil\'s Shelf dry waterfall steps and Cougar V-Notch...');
  await teleportToTrail(0.55);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/evidence_devils_shelf.png' });

  // 4. Summit Observation Deck: Teleport to Summit Viewfinders
  console.log('📸 4. Teleporting to Summit Observation Deck...');
  await teleportToTrail(0.97);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/evidence_summit_deck.png' });

  // 5. Enter West Viewfinder (Surprise City Vista)
  console.log('🔭 5. Activating West Binoculars Viewfinder (coyote_summit_west)...');
  const binocState = await page.evaluate(() => {
    const g = window.game;
    if (!g || !g.cameraManager) return null;
    const viewfinders = window.scenicViewfinders || (g.splineRoad && g.splineRoad.scenicViewfinders) || [];
    const westVf = viewfinders.find(v => v.id === 'coyote_summit_west');
    if (!westVf) return { error: 'West viewfinder not found', totalVf: viewfinders.length };
    
    g.cameraManager.enterBinocularMode(westVf);
    return {
      activated: true,
      isBinocularView: g.gameState ? g.gameState.isBinocularView : true,
      fov: g.cameraManager.camera.fov
    };
  });
  console.log('  West Viewfinder state:', binocState);

  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'scripts/evidence_surprise_city_wide.png' });

  // 6. Zoom in on Surprise City (Pier, Ferris Wheel, Ralphs, Cross Creek Stores)
  console.log('🔭 6. Zooming in through binoculars on Santa Monica / Malibu skyline...');
  await page.evaluate(() => {
    const cm = window.game.cameraManager;
    if (cm) {
      cm.binocularControls.targetFov = 12.0; // High telephoto zoom
      cm.binocularControls.fov = 12.0;
      cm.camera.fov = 12.0;
      cm.camera.updateProjectionMatrix();
    }
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/evidence_surprise_city_zoomed.png' });

  // 7. Exit Binoculars
  await page.evaluate(() => {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.exitBinocularMode();
    }
  });
  await page.waitForTimeout(500);

  // 8. Teleport down into Zone 1 to verify matching Commercial Promenade
  console.log('🏎️ 8. Teleporting to Zone 1 Santa Monica Commercial Promenade (Z = 3050m)...');
  await page.evaluate(() => {
    const g = window.game;
    if (!g || !g.physics || !g.splineRoad) return;
    const trans = g.splineRoad.getRoadTransformAtZ(3050, 0, 0);
    g.physics.position.set(trans.pos.x, trans.pos.y + 0.3, trans.pos.z);
    g.physics.speed = 0;
    g.physics.heading = trans.heading;
    if (g.sportsCar && g.sportsCar.group) {
      g.sportsCar.group.position.copy(g.physics.position);
      g.sportsCar.group.rotation.y = trans.heading;
    }
    if (g.cameraManager) {
      g.cameraManager.resetTracking();
    }
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/evidence_zone1_commercial_promenade.png' });

  console.log(`\n🎉 Verification Completed! Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
  }

  await browser.close();
}

run().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
