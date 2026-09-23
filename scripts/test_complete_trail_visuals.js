import { chromium } from 'playwright-core';
import { TrailSpline } from '../src/world/TrailSpline.js';

async function run() {
  console.log('🚀 Running complete trail visual verification across all 10 stages...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(1500);

  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
  } catch (e) {}
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.skipIntro();
    }
  });
  await page.waitForTimeout(500);

  // Helper to place vehicle at highway or trail coordinate
  async function placeVehicle(x, y, z, heading) {
    return await page.evaluate(({ x, y, z, heading }) => {
      const g = window.game;
      if (!g || !g.physics) return null;
      g.physics.position.set(x, y, z);
      g.physics.speed = 0;
      g.physics.heading = heading;

      if (g.sportsCar && g.sportsCar.group) {
        g.sportsCar.group.position.copy(g.physics.position);
        g.sportsCar.group.rotation.y = heading;
      }
      if (g.cameraManager) {
        g.cameraManager.skipIntro();
        g.cameraManager.resetTracking();
        // Step camera slightly so it immediately aligns behind vehicle
        g.cameraManager.update(0.1);
      }
      return { x, y, z, heading };
    }, { x, y, z, heading });
  }

  // Helper to place on trail by t
  async function placeOnTrail(t) {
    const pt = TrailSpline.getPointAt(t);
    const nextPt = TrailSpline.getPointAt(Math.min(1.0, t + 0.02));
    return await page.evaluate(({ pt, nextPt }) => {
      const g = window.game;
      const trans = g.splineRoad.getRoadTransformAtZ(pt.z, pt.lat, 0);
      const groundY = g.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z);
      const nextTrans = g.splineRoad.getRoadTransformAtZ(nextPt.z, nextPt.lat, 0);

      const dx = nextTrans.pos.x - trans.pos.x;
      const dz = nextTrans.pos.z - trans.pos.z;
      const heading = Math.atan2(dx, dz);

      g.physics.position.set(trans.pos.x, groundY + 0.35, trans.pos.z);
      g.physics.speed = 0;
      g.physics.heading = heading;

      if (g.sportsCar && g.sportsCar.group) {
        g.sportsCar.group.position.copy(g.physics.position);
        g.sportsCar.group.rotation.y = heading;
      }
      if (g.cameraManager) {
        g.cameraManager.skipIntro();
        g.cameraManager.resetTracking();
        g.cameraManager.update(0.1);
      }
      return { t: pt.t, x: trans.pos.x, y: groundY, z: trans.pos.z, heading };
    }, { pt, nextPt });
  }

  // 1. Highway approach to turnout (Z=970, looking towards turnout entrance)
  console.log('📸 1. Highway Turnout Approach (Z=970)...');
  await page.evaluate(() => {
    const g = window.game;
    const trans = g.splineRoad.getRoadTransformAtZ(970, 0, 0);
    const gy = g.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z);
    g.physics.position.set(trans.pos.x, gy + 0.35, trans.pos.z);
    g.physics.speed = 0;
    g.physics.heading = trans.heading;
    g.cameraManager.resetTracking();
    g.cameraManager.update(0.1);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_01_highway_approach.png' });

  // 2. Turnout Apron facing Trailhead Gate Arch (t=0.01)
  console.log('📸 2. Trailhead Gate Arch (t=0.01)...');
  await placeOnTrail(0.01);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_02_trailhead_arch.png' });

  // 3. Lower Canyon S-Curves (t=0.10)
  console.log('📸 3. Lower Canyon (t=0.10)...');
  await placeOnTrail(0.10);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_03_lower_canyon.png' });

  // 4. Cougar Creek Stream Crossing (t=0.18)
  console.log('📸 4. Cougar Creek Crossing (t=0.18)...');
  await placeOnTrail(0.18);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_04_cougar_creek.png' });

  // 5. Cougar Falls Hairpin (t=0.35)
  console.log('📸 5. Cougar Falls Hairpin (t=0.35)...');
  await placeOnTrail(0.35);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_05_cougar_falls.png' });

  // 6. Boulder Crawl Arena (t=0.48)
  console.log('📸 6. Boulder Crawl Arena (t=0.48)...');
  await placeOnTrail(0.48);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_06_boulder_arena.png' });

  // 7. Thunder Creek Ford (t=0.62)
  console.log('📸 7. Thunder Creek Ford (t=0.62)...');
  await placeOnTrail(0.62);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_07_thunder_creek.png' });

  // 8. Devil\'s Backbone Ridge (t=0.74)
  console.log('📸 8. Devil\'s Backbone Ridge (t=0.74)...');
  await placeOnTrail(0.74);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_08_devils_backbone.png' });

  // 9. Hanging Valley Grove (t=0.88)
  console.log('📸 9. Hanging Valley Grove (t=0.88)...');
  await placeOnTrail(0.88);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_09_hanging_valley.png' });

  // 10. Summit Skybridge Plateau (t=0.98)
  console.log('📸 10. Summit Skybridge Plateau (t=0.98)...');
  await placeOnTrail(0.98);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/trail_view_10_summit_plateau.png' });

  console.log('🎉 All 10 trail verification views captured successfully!');
  await browser.close();
}

run();
