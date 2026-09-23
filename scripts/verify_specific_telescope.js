import { chromium } from 'playwright-core';

async function verifySpecificTelescope() {
  console.log('🔍 Running Dedicated Telescope Viewpoint Station Verification...');
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

  // Step 1: Car is on the summit plateau, but away from the telescope (12m away)
  console.log('📍 Phase 1: Checking summit plateau (NOT at specific telescope stand)...');
  const checkFar = await page.evaluate(() => {
    const g = window.game;
    const p = g.physics;
    const road = g.splineRoad;
    const vf = road.scenicViewfinders.find(v => v.id === 'coyote_summit_east');

    // Park in the center of the summit deck (11m away from the telescope)
    const deckCenter = vf.group.parent.position;
    p.position.set(deckCenter.x, deckCenter.y + 0.3, deckCenter.z);
    p.speed = 0;
    p.velocity.set(0, 0, 0);
    p.heading = 0;

    road.update(1 / 60, p.position);
    g.hud.update(p, road, 1 / 60);

    return {
      distToTelescope: p.position.distanceTo(vf.pos),
      nearbyVf: !!g.gameState.nearbyViewfinder,
      promptVisible: g.hud.binocularPromptPill ? g.hud.binocularPromptPill.classList.contains('visible') : false
    };
  });

  console.log('📊 Far from telescope check:', checkFar);
  if (checkFar.nearbyVf || checkFar.promptVisible) {
    throw new Error(`Telescope prompt triggered prematurely at ${checkFar.distToTelescope.toFixed(1)}m away! Must require specific point.`);
  }
  console.log('✅ PASS: Telescope CANNOT be triggered from anywhere on the summit!');

  // Step 2: Move car directly onto the specific telescope viewing pad at the cliff rim
  console.log('📍 Phase 2: Pulling vehicle directly up to specific telescope viewpoint pad...');
  const checkNear = await page.evaluate(() => {
    const g = window.game;
    const p = g.physics;
    const road = g.splineRoad;
    const vf = road.scenicViewfinders.find(v => v.id === 'coyote_summit_east');

    p.position.set(vf.pos.x, vf.pos.y + 0.25, vf.pos.z);
    p.speed = 0;
    p.velocity.set(0, 0, 0);
    p.heading = vf.baseHeading || 0;

    if (g.sportsCar && g.sportsCar.group) {
      g.sportsCar.group.position.copy(p.position);
      g.sportsCar.group.rotation.y = p.heading;
    }
    if (g.cameraManager) {
      g.cameraManager.resetTracking();
      g.cameraManager.update(1 / 60);
    }

    road.update(1 / 60, p.position);
    g.hud.update(p, road, 1 / 60);

    return {
      distToTelescope: p.position.distanceTo(vf.pos),
      nearbyVf: !!g.gameState.nearbyViewfinder,
      vfName: g.gameState.nearbyViewfinder ? g.gameState.nearbyViewfinder.name : null,
      promptVisible: g.hud.binocularPromptPill ? g.hud.binocularPromptPill.classList.contains('visible') : false
    };
  });

  console.log('📊 At telescope viewpoint station check:', checkNear);
  if (!checkNear.nearbyVf || !checkNear.promptVisible) {
    throw new Error('Telescope prompt did not appear when standing at specific viewpoint pad!');
  }
  console.log('✅ PASS: Specific telescope point correctly triggered interaction prompt!');

  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/specific_telescope_point_parked.png' });
  console.log('📸 Parked at telescope screenshot: scripts/specific_telescope_point_parked.png');

  // Step 3: Look through telescope & verify good wide panoramic view of everything
  console.log('🔭 Phase 3: Looking through telescope (wide panoramic view of everything)...');
  const vistaCheck = await page.evaluate(() => {
    const g = window.game;
    g.hud.openBinocularView();
    g.cameraManager.update(1 / 60);
    g.hud.update(g.physics, g.splineRoad, 1 / 60);

    return {
      isBinocularView: g.gameState.isBinocularView,
      overlayOpen: g.hud.binocularOverlay.classList.contains('open'),
      camFov: g.renderer.camera.fov,
      headingText: g.hud.binocularHeadingVal ? g.hud.binocularHeadingVal.textContent : '',
      targetText: g.hud.binocularTargetVal ? g.hud.binocularTargetVal.textContent : '',
      isCutsceneActive: g.gameState.isCutsceneActive
    };
  });

  console.log('📊 Panoramic vista check:', vistaCheck);
  if (vistaCheck.camFov < 45) {
    throw new Error(`FOV too narrow (${vistaCheck.camFov}°)! Expected >= 45° for wide vista.`);
  }
  if (vistaCheck.isCutsceneActive) {
    throw new Error('Cutscene triggered prematurely upon opening binoculars!');
  }

  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/telescope_good_view_of_everything.png' });
  console.log('📸 Wide view of everything saved: scripts/telescope_good_view_of_everything.png');

  // Step 4: Survey the valley & explore other landmarks without triggering cutscene
  console.log('🔭 Phase 4: Free-look surveying other landmarks across the valley...');
  const exploreCheck = await page.evaluate(() => {
    const g = window.game;
    const cm = g.cameraManager;

    // Pan across to Monument Valley Sandstone Mesas (yaw offset ~+0.35)
    cm.binocularControls.targetYaw = 0.38;
    cm.binocularControls.yaw = 0.38;
    cm.binocularControls.targetPitch = 0.05;
    cm.binocularControls.pitch = 0.05;

    for (let f = 0; f < 30; f++) {
      cm.update(1 / 60);
      g.hud.update(g.physics, g.splineRoad, 1 / 60);
    }

    return {
      targetText: g.hud.binocularTargetVal ? g.hud.binocularTargetVal.textContent : '',
      isCutsceneActive: g.gameState.isCutsceneActive
    };
  });

  console.log('📊 Exploring landmarks check:', exploreCheck);
  if (exploreCheck.isCutsceneActive) {
    throw new Error('Cutscene triggered while player was surveying other landmarks!');
  }

  // Step 5: Center on Arrowhead Canyon, observe surveillance lock countdown, and transition to cutscene
  console.log('🔭 Phase 5: Aiming at Arrowhead Canyon and verifying steady surveillance lock progression...');
  const lockProgress = await page.evaluate(() => {
    const g = window.game;
    const cm = g.cameraManager;
    const vf = g.gameState.nearbyViewfinder;

    // Vector pointing to crime scene
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
    cm.binocularControls.targetFov = 20.0;
    cm.binocularControls.fov = 20.0;

    // Advance 45 frames (~0.75s) to check progress
    for (let f = 0; f < 45; f++) {
      cm.update(1 / 60);
      g.hud.update(g.physics, g.splineRoad, 1 / 60);
    }

    return {
      lockProgress: g.gameState.surveillanceLockProgress,
      targetText: g.hud.binocularTargetVal ? g.hud.binocularTargetVal.textContent : '',
      isCutsceneActive: g.gameState.isCutsceneActive
    };
  });

  console.log('📊 Dwell lock progress check:', lockProgress);
  if (lockProgress.lockProgress <= 0) {
    throw new Error('Surveillance lock progress did not increment when centered on canyon!');
  }

  // Complete the remaining dwell to trigger cutscene
  const cutsceneCheck = await page.evaluate(() => {
    const g = window.game;
    const cm = g.cameraManager;

    for (let f = 0; f < 75; f++) {
      cm.update(1 / 60);
      g.hud.update(g.physics, g.splineRoad, 1 / 60);
    }

    return {
      isCutsceneActive: g.gameState.isCutsceneActive,
      cutsceneName: g.gameState.cutsceneName
    };
  });

  console.log('🎬 Cutscene triggered check:', cutsceneCheck);
  if (!cutsceneCheck.isCutsceneActive || cutsceneCheck.cutsceneName !== 'murder') {
    throw new Error('Cutscene did not trigger after steady surveillance dwell on canyon!');
  }

  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/telescope_cinematic_scene_transition.png' });
  console.log('📸 Cinematic scene transition saved: scripts/telescope_cinematic_scene_transition.png');

  // Clean exit
  await page.evaluate(() => {
    const g = window.game;
    if (g.mysteryCrimeScene && g.mysteryCrimeScene.isCinematicPlaying) {
      g.mysteryCrimeScene.skipCutscene();
    }
    g.hud.closeBinocularView();
  });

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error(`Encountered ${consoleErrors.length} console errors.`);
    process.exit(1);
  }

  console.log('🎉 ALL SPECIFIC TELESCOPE & VISTA VERIFICATIONS PASSED WITH ZERO ERRORS!');
}

verifySpecificTelescope().catch(e => {
  console.error('❌ Verification failed:', e);
  process.exit(1);
});
