import { chromium } from 'playwright-core';
import { TrailSpline } from '../src/world/TrailSpline.js';

async function run() {
  console.log('🚀 Starting Cougar Ridge Grand 508m 4x4 Trail & Surprise City verification...');
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
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 25000 });
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

  // Helper to teleport vehicle using TrailSpline
  async function teleportToSpline(t, customHeading = null) {
    const pt = TrailSpline.getPointAt(t);
    const nextPt = TrailSpline.getPointAt(Math.min(1.0, t + 0.03));

    return await page.evaluate(({ pt, nextPt, customHeading }) => {
      const g = window.game;
      if (!g || !g.physics || !g.splineRoad) return null;

      const trans = g.splineRoad.getRoadTransformAtZ(pt.z, pt.lat, 0);
      const groundY = g.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z);

      const nextTrans = g.splineRoad.getRoadTransformAtZ(nextPt.z, nextPt.lat, 0);
      const dx = nextTrans.pos.x - trans.pos.x;
      const dz = nextTrans.pos.z - trans.pos.z;
      const forwardHeading = Math.atan2(dx, dz);
      const heading = (customHeading !== null) ? customHeading : forwardHeading;

      g.physics.position.x = trans.pos.x;
      g.physics.position.z = trans.pos.z;
      g.physics.position.y = groundY + 0.35;
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
      return { x: trans.pos.x, y: groundY, z: trans.pos.z, heading, targetElev: pt.elev };
    }, { pt, nextPt, customHeading });
  }

  // 1. Stage 0: Staging Area & Air-Down Basin (Entrance Gateway)
  console.log('📸 1. Capturing Trailhead Staging Area & Double Black Diamond Archway (t=0.03)...');
  const res0 = await teleportToSpline(0.03);
  console.log('   Point:', res0);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/grand_trail_staging.png' });

  // 2. Stage 2: Gatekeeper Articulation Wash (t=0.25)
  console.log('📸 2. Capturing The Gatekeeper Articulation Wash (t=0.25)...');
  const res2 = await teleportToSpline(0.25);
  console.log('   Point:', res2);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/grand_trail_gatekeeper.png' });

  // 3. Stage 3: Cougar Hairpin Switchback (t=0.38)
  console.log('📸 3. Capturing Cougar Hairpin Switchback with Timber Cribbing (t=0.38)...');
  const res3 = await teleportToSpline(0.38);
  console.log('   Point:', res3);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/grand_trail_hairpin.png' });

  // 4. Stage 4: Sledgehammer Boulder Crawl Arena (t=0.52)
  console.log('📸 4. Capturing Sledgehammer Boulder Crawl Arena (t=0.52)...');
  const res4 = await teleportToSpline(0.52);
  console.log('   Point:', res4);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/grand_trail_boulder_arena.png' });

  // 5. Stage 5: Devil\'s Backbone Knife-Edge Ridge Traverse (t=0.68)
  console.log('📸 5. Capturing Devil\'s Backbone Knife-Edge Ridge (t=0.68)...');
  const res5 = await teleportToSpline(0.68);
  console.log('   Point:', res5);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/grand_trail_ridge.png' });

  // 6. Stage 6: Devil\'s Shelf 4-Tier Waterfall Ledges (t=0.82)
  console.log('📸 6. Capturing Devil\'s Shelf 4-Tier Waterfall Ledges (t=0.82)...');
  const res6 = await teleportToSpline(0.82);
  console.log('   Point:', res6);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/grand_trail_waterfall_shelf.png' });

  // 7. Stage 7: Grand Summit Plateau & Observation Deck (t=0.98)
  console.log('📸 7. Capturing Grand Summit Plateau & Observation Deck (t=0.98)...');
  const res7 = await teleportToSpline(0.98);
  console.log('   Point:', res7);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/grand_trail_summit_deck.png' });

  // 8. Enter West Viewfinder (Pacific Pass Viewfinder) overlooking Surprise City
  console.log('🔭 8. Activating Pacific Pass Viewfinder (coyote_summit_west)...');
  const binocState = await page.evaluate(() => {
    const g = window.game;
    if (!g || !g.cameraManager) return null;
    const viewfinders = window.scenicViewfinders || (g.splineRoad && g.splineRoad.scenicViewfinders) || [];
    const westVf = viewfinders.find(v => v.id === 'coyote_summit_west');
    if (!westVf) return { error: 'West viewfinder not found', totalVf: viewfinders.length };
    
    g.cameraManager.enterBinocularMode(westVf);
    return {
      activated: true,
      vfName: westVf.name,
      elevation: westVf.elevation,
      eyePos: westVf.eyePos,
      fov: g.cameraManager.camera.fov
    };
  });
  console.log('   West Viewfinder state:', binocState);

  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'scripts/grand_trail_city_wide.png' });

  // 9. Zoom in on Surprise City through Binoculars (Pier, Ferris Wheel, Storefronts)
  console.log('🔭 9. Zooming in through binoculars onto Santa Monica Pier & Pacific Park...');
  await page.evaluate(() => {
    const cm = window.game.cameraManager;
    if (cm) {
      cm.binocularControls.targetFov = 12.0; // Telephoto zoom
      cm.binocularControls.fov = 12.0;
      cm.camera.fov = 12.0;
      cm.camera.updateProjectionMatrix();
    }
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/grand_trail_city_zoomed.png' });

  // 10. Exit Binoculars
  await page.evaluate(() => {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.exitBinocularMode();
    }
  });
  await page.waitForTimeout(500);

  console.log(`\n🎉 Grand Trail Verification Completed! Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
  }

  await browser.close();
}

run().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
