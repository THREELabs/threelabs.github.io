import { chromium } from 'playwright-core';

async function run() {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Teleport car to viewfinder
  await page.evaluate(() => {
    const g = window.game;
    const p = g.physics;
    const road = g.splineRoad;
    g.cameraManager.skipIntro();

    const vf = road.scenicViewfinders[1];
    const targetPos = vf.pos;
    const groundY = p.getGroundHeightAt(targetPos.x, targetPos.z);
    p.position.set(targetPos.x, groundY + 0.18, targetPos.z);
    road.update(1 / 60, p.position);
    g.hud.update(p, road, 1 / 60);
    g.hud.openBinocularView();
  });

  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts/test_bino_viewfinder_1_west.png' });
  console.log('Saved scripts/test_bino_viewfinder_1_west.png');

  // Overlook world position
  const ovPos = await page.evaluate(() => {
    const vf = window.game.splineRoad.scenicViewfinders[0];
    const ov = vf.group.parent.position;
    return { x: ov.x, y: ov.y, z: ov.z };
  });

  // Test: Camera perched at the cliff rim overlooking Route 66 and Pacific bay
  await page.evaluate((ov) => {
    const g = window.game;
    const cm = g.cameraManager;
    // 3 meters past eastern rail, perched over canyon
    cm.camera.position.set(ov.x + 16.5, ov.y + 2.2, ov.z + 3.0);
    cm.binocularControls.pitch = 0.02;
    cm.binocularControls.targetPitch = 0.02;
    cm.binocularControls.fov = 36.0;
    cm.binocularControls.targetFov = 36.0;
    cm.binocularControls.yaw = 0.0;
    cm.binocularControls.targetYaw = 0.0;
    cm.update(1 / 60);
    // Ensure position is kept
    cm.camera.position.set(ov.x + 16.5, ov.y + 2.2, ov.z + 3.0);
    cm.camera.lookAt(ov.x + 16.5 + 100.0, ov.y + 2.2 + 2.0, ov.z + 3.0);
    g.hud.update(g.physics, g.splineRoad, 1 / 60);
  }, ovPos);

  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts/test_bino_cliff_rim_perfect.png' });
  console.log('Saved scripts/test_bino_cliff_rim_perfect.png');



  await browser.close();
}

run().catch(console.error);
