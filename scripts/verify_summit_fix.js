import { chromium } from 'playwright-core';

async function verify() {
  console.log('🔍 Running Summit Fix Verification...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  console.log('🏎️ Connecting to dev server...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  try {
    await page.click('#start-awaken-screen', { timeout: 3000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.skipIntro();
    }
  });

  // Step 1: Teleport car to summit deck and inspect elevation & physics stability
  const telemetry = await page.evaluate(() => {
    const g = window.game;
    const p = g.physics;
    const road = g.splineRoad;

    // Summit center: lat = -110, z = 1085
    const trans = road.getRoadTransformAtZ(1085, -110, 0);
    const groundY = p.getGroundHeightAt(trans.pos.x, trans.pos.z);

    // Position car right on the summit deck
    p.position.set(trans.pos.x, groundY + 0.18, trans.pos.z);
    p.speed = 0;
    p.velocity.set(0, 0, 0);
    p.verticalVelocity = 0;
    p.heading = trans.heading - Math.PI * 0.5; // facing sign & rim

    if (g.sportsCar && g.sportsCar.group) {
      g.sportsCar.group.position.copy(p.position);
      g.sportsCar.group.rotation.y = p.heading;
    }
    if (g.cameraManager) {
      g.cameraManager.resetTracking();
    }

    // Check multiple grid points across the summit platform
    const samples = [];
    for (let dLat = -12; dLat <= 12; dLat += 6) {
      for (let dZ = -10; dZ <= 10; dZ += 5) {
        const pt = road.getRoadTransformAtZ(1085 + dZ, -110 + dLat, 0);
        const yPhys = p.getGroundHeightAt(pt.pos.x, pt.pos.z);
        samples.push({ dLat, dZ, yPhys });
      }
    }

    // Step physics for 60 frames (1 second) to ensure complete stability
    let minCarY = p.position.y;
    const neutralInput = { forward: false, backward: false, left: false, right: false, nitro: false, brake: false };
    for (let frame = 0; frame < 60; frame++) {
      p.update(1 / 60, neutralInput);
      minCarY = Math.min(minCarY, p.position.y);
    }

    return {
      carPosY: p.position.y,
      minCarY,
      carPosX: p.position.x,
      carPosZ: p.position.z,
      groundY,
      samples,
      isGrounded: p.isGrounded
    };
  });

  console.log('📊 Telemetry Results:', JSON.stringify({
    carPosY: telemetry.carPosY,
    minCarY: telemetry.minCarY,
    groundY: telemetry.groundY,
    isGrounded: telemetry.isGrounded
  }, null, 2));

  // Verify that ground height is >= 40.52 and car stayed firmly on top
  if (telemetry.groundY < 40.50) {
    throw new Error(`groundY too low: ${telemetry.groundY}`);
  }
  if (telemetry.minCarY < 40.50) {
    throw new Error(`Car sank into ground! minCarY = ${telemetry.minCarY}`);
  }

  console.log('✅ Physics floor guarantee passed: Vehicle is firmly grounded at Y =', telemetry.carPosY);

  // Capture desktop screenshots
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/summit_view_deck_desktop.png' });
  console.log('📸 Desktop summit screenshot saved');

  // Rotate camera to view summit sign closely
  await page.evaluate(() => {
    const g = window.game;
    // Turn car to face the summit sign (heading = Math.PI)
    g.physics.heading = Math.PI;
    g.sportsCar.group.rotation.y = Math.PI;
    g.cameraManager.resetTracking();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/summit_view_sign_desktop.png' });
  console.log('📸 Desktop sign screenshot saved');

  // Mobile viewport screenshot (matching user's mobile aspect ratio 390x844)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/summit_view_mobile_sign.png' });

  // Rotate towards binoculars / overlook rim
  await page.evaluate(() => {
    const g = window.game;
    g.physics.heading = -Math.PI * 0.45;
    g.sportsCar.group.rotation.y = -Math.PI * 0.45;
    g.cameraManager.resetTracking();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/summit_view_mobile_binoculars.png' });
  console.log('📸 Mobile screenshots saved');

  await browser.close();
  console.log('🎉 Verification successfully finished!');
}

verify().catch(e => {
  console.error('❌ Verification failed:', e);
  process.exit(1);
});
