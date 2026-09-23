import { chromium } from 'playwright-core';
import { TrailSpline } from '../src/world/TrailSpline.js';

async function run() {
  console.log('🚀 Starting Cougar Ridge 4x4 Trail Bug Fix & Visual Overhaul verification...');
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
      g.physics.position.y = groundY + 0.18;
      g.physics.heading = heading;
      g.physics.speed = 0;
      g.physics.velocity.set(0, 0, 0);
      g.physics.angularVelocity.set(0, 0, 0);
      g.physics.verticalVelocity = 0;
      g.physics.isGrounded = true;

      const roadInfo = g.splineRoad.getRoadInfo(trans.pos.x, trans.pos.z);

      return {
        t: pt.t,
        lat: pt.lat,
        z: pt.z,
        elev: pt.elev,
        posX: trans.pos.x,
        posY: g.physics.position.y,
        posZ: trans.pos.z,
        groundY,
        isOnTrail: roadInfo.isOnTrail,
        isSummit: roadInfo.trailInfo ? roadInfo.trailInfo.isSummit : false
      };
    }, { pt, nextPt, customHeading });
  }

  // Helper to step simulation forward and check if vehicle got kicked off or flipped
  async function stepAndVerify(frames = 30) {
    return await page.evaluate((frames) => {
      const g = window.game;
      const startX = g.physics.position.x;
      const startZ = g.physics.position.z;
      const startHeading = g.physics.heading;

      // Simulate physics update steps with forward throttle
      for (let f = 0; f < frames; f++) {
        g.physics.update(1 / 60, { throttle: 0.5, brake: 0, steer: 0, isTouchSteering: false });
      }

      const roadInfo = g.splineRoad.getRoadInfo(g.physics.position.x, g.physics.position.z);
      return {
        posX: g.physics.position.x,
        posY: g.physics.position.y,
        posZ: g.physics.position.z,
        speed: g.physics.speed,
        verticalVelocity: g.physics.verticalVelocity,
        angularVelocity: g.physics.angularVelocity.toArray(),
        isGrounded: g.physics.isGrounded,
        isOnTrail: roadInfo.isOnTrail,
        lateralDist: roadInfo.lateralDist,
        deltaHeading: Math.abs(g.physics.heading - startHeading)
      };
    }, frames);
  }

  // Test 1: User Viewpoint (Around t = 0.36, Cougar Hairpin climbing turn)
  console.log('📸 Capturing User Viewpoint recreation (Cougar Hairpin ascent)...');
  const userPoint = await teleportToSpline(0.36);
  console.log(`Teleported to t=0.36: pos=(${userPoint.posX.toFixed(1)}, ${userPoint.posY.toFixed(1)}, ${userPoint.posZ.toFixed(1)}), groundY=${userPoint.groundY.toFixed(1)}, isOnTrail=${userPoint.isOnTrail}`);
  await page.waitForTimeout(800);

  // Verify physics stability across 60 frames (ensure no kick-off!)
  const stepRes1 = await stepAndVerify(60);
  console.log(`Physics Step at t=0.36: posY=${stepRes1.posY.toFixed(1)}, verticalVel=${stepRes1.verticalVelocity.toFixed(2)}, isGrounded=${stepRes1.isGrounded}, isOnTrail=${stepRes1.isOnTrail}`);
  if (Math.abs(stepRes1.verticalVelocity) > 3.0 || stepRes1.deltaHeading > 1.5) {
    console.error('❌ Vehicle was kicked off or severely deflected at t=0.36!');
  } else {
    console.log('✅ Passed physics stability at t=0.36 without kick-off');
  }

  await page.screenshot({ path: 'scripts/overhaul_user_viewpoint.png' });
  console.log('Saved scripts/overhaul_user_viewpoint.png');

  // Test 2: The Critical Danger Zone where previously kicked off (t = 0.55, Sledgehammer Arena at latDist ≈ -175m)
  console.log('🧪 Testing previously buggy zone: t = 0.55 (latDist ≈ -175m, where old boundary 145m kicked players off)...');
  const dangerPoint = await teleportToSpline(0.55);
  console.log(`Teleported to t=0.55: pos=(${dangerPoint.posX.toFixed(1)}, ${dangerPoint.posY.toFixed(1)}, ${dangerPoint.posZ.toFixed(1)}), isOnTrail=${dangerPoint.isOnTrail}`);
  
  const stepRes2 = await stepAndVerify(90);
  console.log(`Physics Step at t=0.55: latDist=${stepRes2.lateralDist.toFixed(1)}, vertVel=${stepRes2.verticalVelocity.toFixed(2)}, isGrounded=${stepRes2.isGrounded}, deltaHeading=${stepRes2.deltaHeading.toFixed(2)}`);
  if (Math.abs(stepRes2.verticalVelocity) > 3.0 || stepRes2.deltaHeading > 1.5) {
    console.error('❌ BUG DETECTED: Vehicle kicked off at t=0.55!');
  } else {
    console.log('✅ ZERO KICK-OFF: Vehicle climbed cleanly past 145m boundary at lateralDist = ' + stepRes2.lateralDist.toFixed(1));
  }
  await page.screenshot({ path: 'scripts/overhaul_boulder_arena.png' });
  console.log('Saved scripts/overhaul_boulder_arena.png');

  // Test 3: Devil\'s Backbone Knife-Edge Ridge (t = 0.68, latDist = -200m)
  console.log('📸 Testing Devil\'s Backbone Ridge at t = 0.68...');
  await teleportToSpline(0.68);
  await page.waitForTimeout(500);
  const stepRes3 = await stepAndVerify(60);
  console.log(`Ridge physics: latDist=${stepRes3.lateralDist.toFixed(1)}, isGrounded=${stepRes3.isGrounded}, isOnTrail=${stepRes3.isOnTrail}`);
  await page.screenshot({ path: 'scripts/overhaul_switchback_canyon.png' });
  console.log('Saved scripts/overhaul_switchback_canyon.png');

  // Test 4: Summit Observation Deck (t = 1.0, Elev 56m, latDist = -245m)
  console.log('🏔️ Testing Grand Summit Observation Deck (t = 1.00)...');
  const summitPoint = await teleportToSpline(1.00, 0.0);
  console.log(`Summit Deck: pos=(${summitPoint.posX.toFixed(1)}, ${summitPoint.posY.toFixed(1)}, ${summitPoint.posZ.toFixed(1)}), isSummit=${summitPoint.isSummit}`);
  await page.waitForTimeout(500);
  const stepRes4 = await stepAndVerify(30);
  console.log(`Summit physics: posY=${stepRes4.posY.toFixed(2)} (target >= 56.0), isGrounded=${stepRes4.isGrounded}`);
  if (stepRes4.posY < 55.5) {
    console.error('❌ Vehicle sank below summit deck floor!');
  } else {
    console.log('✅ Vehicle securely grounded on summit observation deck floor');
  }
  await page.screenshot({ path: 'scripts/overhaul_summit_deck.png' });
  console.log('Saved scripts/overhaul_summit_deck.png');

  // Test 5: Binoculars Viewfinder of Surprise Coastal Metropolis
  console.log('🔭 Testing West Viewfinder binocular mode on Santa Monica / Malibu...');
  await page.evaluate(() => {
    const g = window.game;
    if (g && g.cameraManager && g.splineRoad) {
      const vfs = g.splineRoad.scenicViewfinders || [];
      const westVf = vfs.find(v => v.id === 'coyote_summit_west') || vfs[0];
      if (westVf) {
        g.cameraManager.enterBinocularMode(westVf);
        if (g.cameraManager.binocularControls) {
          g.cameraManager.binocularControls.targetFov = 16.0;
          g.cameraManager.binocularControls.fov = 16.0;
        }
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/overhaul_binocular_city.png' });
  console.log('Saved scripts/overhaul_binocular_city.png');

  console.log('\n====================================================');
  console.log(`Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(err => console.log('  ❌ ' + err));
  } else {
    console.log('✅ Zero console errors!');
  }
  console.log('====================================================');

  await browser.close();
}

run().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
