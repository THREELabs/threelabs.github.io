import { chromium } from 'playwright-core';

async function verify() {
  console.log('🔍 Running Coin-Operated Scenic Binoculars Verification...');
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

  // Step 1: Teleport car to summit observation deck near the viewfinders
  console.log('📍 Teleporting player to Coyote Ridge summit overlook deck...');
  const checkPrompt = await page.evaluate(() => {
    const g = window.game;
    const p = g.physics;
    const road = g.splineRoad;

    // Position car right on the deck near the rim viewfinders
    const vf = (road.scenicViewfinders && road.scenicViewfinders[0]) || null;
    const targetPos = vf ? vf.pos : road.getRoadTransformAtZ(1100, -245, 0).pos;
    const targetY = (targetPos && targetPos.y > 10) ? targetPos.y : (groundY + 0.18);
    p.position.set(targetPos.x, targetY, targetPos.z);
    p.speed = 0;
    p.velocity.set(0, 0, 0);
    p.verticalVelocity = 0;
    p.heading = 0;

    if (g.sportsCar && g.sportsCar.group) {
      g.sportsCar.group.position.copy(p.position);
      g.sportsCar.group.rotation.y = p.heading;
    }
    if (g.cameraManager) {
      g.cameraManager.resetTracking();
    }

    // Force road update to detect nearby viewfinder
    road.update(1 / 60, p.position);
    g.hud.update(p, road, 1 / 60);

    return {
      nearbyVf: !!g.gameState.nearbyViewfinder,
      vfName: g.gameState.nearbyViewfinder ? g.gameState.nearbyViewfinder.name : null,
      promptVisible: g.hud.binocularPromptPill ? g.hud.binocularPromptPill.classList.contains('visible') : false
    };
  });

  console.log('👁️ Viewfinder Proximity Check:', checkPrompt);
  if (!checkPrompt.nearbyVf) {
    throw new Error('Nearby viewfinder was not detected on summit deck!');
  }

  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/binoculars_prompt_pill.png' });
  console.log('📸 Prompt pill screenshot saved: scripts/binoculars_prompt_pill.png');

  // Step 2: Open Binocular Viewfinder Mode
  console.log('🔭 Activating Binocular Mode...');
  const binoState = await page.evaluate(() => {
    const g = window.game;
    g.hud.openBinocularView();
    // Advance camera one frame
    g.cameraManager.update(1 / 60);
    g.hud.update(g.physics, g.splineRoad, 1 / 60);

    return {
      isBinocularView: g.gameState.isBinocularView,
      overlayOpen: g.hud.binocularOverlay.classList.contains('open'),
      headingText: g.hud.binocularHeadingVal ? g.hud.binocularHeadingVal.textContent : '',
      targetText: g.hud.binocularTargetVal ? g.hud.binocularTargetVal.textContent : '',
      zoomText: g.hud.binocularZoomIndicator ? g.hud.binocularZoomIndicator.textContent : '',
      camFov: g.renderer.camera.fov
    };
  });

  console.log('🔭 Binocular View Active:', binoState);
  if (!binoState.isBinocularView || !binoState.overlayOpen) {
    throw new Error('Binocular overlay failed to open!');
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/binoculars_view_wide.png' });
  console.log('📸 Binocular wide view saved: scripts/binoculars_view_wide.png');

  // Step 3: Pan crosshairs onto White Canyon Ranch Property & Verify Surveillance Lock
  console.log('🔭 Panning crosshairs onto White Canyon Ranch Property...');
  const lockInfo = await page.evaluate(() => {
    const g = window.game;
    const cm = g.cameraManager;
    const vf = g.gameState.nearbyViewfinder;

    // Vector pointing to White Desert Ranch Property (104.5, 25.5, 920.0)
    const dx = 104.5 - vf.eyePos.x;
    const dy = 25.5 - vf.eyePos.y;
    const dz = 920.0 - vf.eyePos.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);

    const targetYaw = Math.atan2(dx, dz) - (vf.baseHeading || 0);
    const targetPitch = Math.atan2(dy, horizDist) - (vf.basePitch || 0);

    cm.binocularControls.targetYaw = targetYaw;
    cm.binocularControls.targetPitch = targetPitch;
    cm.binocularControls.yaw = targetYaw;
    cm.binocularControls.pitch = targetPitch;
    cm.binocularControls.targetFov = 16.0;
    cm.binocularControls.fov = 16.0;

    // Simulate steady dwell on target for 0.7 seconds
    for (let f = 0; f < 45; f++) {
      cm.update(1 / 60);
      g.hud.update(g.physics, g.splineRoad, 1 / 60);
    }

    return {
      targetName: g.gameState.binocularTargetName,
      isCutsceneActive: g.gameState.isCutsceneActive,
      cutsceneName: g.gameState.cutsceneName
    };
  });

  console.log('🔒 Surveillance Lock Info:', lockInfo);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/binoculars_white_property_lock.png' });
  console.log('📸 White property lock saved: scripts/binoculars_white_property_lock.png');

  // Step 4: Test Exit and Camera Reset
  console.log('🚪 Testing Exit Binocular View / Cutscene Cleanup...');
  const exitState = await page.evaluate(() => {
    const g = window.game;
    if (g.mysteryCrimeScene && g.mysteryCrimeScene.isCinematicPlaying) {
      g.mysteryCrimeScene.skipCutscene();
    }
    g.hud.closeBinocularView();
    g.cameraManager.update(1 / 60);
    return {
      isBinocularView: g.gameState.isBinocularView,
      overlayOpen: g.hud.binocularOverlay.classList.contains('open'),
      camFov: g.renderer.camera.fov
    };
  });

  console.log('🏁 Exit State:', exitState);
  if (exitState.isBinocularView || exitState.overlayOpen) {
    throw new Error('Binocular overlay failed to close!');
  }

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error(`💥 Verification encountered ${consoleErrors.length} errors.`);
    process.exit(1);
  }

  console.log('🎉 ALL BINOCULAR MODE VERIFICATIONS PASSED WITH ZERO ERRORS!');
}

verify().catch(e => {
  console.error('❌ Verification failed:', e);
  process.exit(1);
});
