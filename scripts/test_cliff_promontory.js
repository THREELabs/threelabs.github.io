import { chromium } from 'playwright-core';

async function testPromontory() {
  console.log('📸 Capturing Cougar Ridge Cliff Promontory & Telescope...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const g = window.game;
    if (g.cameraManager) g.cameraManager.skipIntro();

    // Place car on the main summit timber deck
    const road = g.splineRoad;
    const p = g.physics;
    const overlookWorld = road.scenicViewfinders[0].group.parent.position;

    // Car on timber deck at (-15, 0.5, -5) relative to overlookGroup
    p.position.set(overlookWorld.x - 12.0, overlookWorld.y + 0.5, overlookWorld.z - 8.0);
    p.heading = Math.atan2(-26, -20); // Facing the promontory
    p.speed = 0;
    if (g.sportsCar && g.sportsCar.group) {
      g.sportsCar.group.position.copy(p.position);
      g.sportsCar.group.rotation.y = p.heading;
    }
    if (g.cameraManager) {
      g.cameraManager.resetTracking();
      // Set chase camera
      g.cameraManager.update(1 / 60);
    }
    road.update(1 / 60, p.position);
    g.hud.update(p, road, 1 / 60);
  });

  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scripts/summit_promontory_edge.png' });
  console.log('📸 Promontory edge screenshot saved: scripts/summit_promontory_edge.png');

  await browser.close();
}

testPromontory().catch(e => {
  console.error(e);
  process.exit(1);
});
