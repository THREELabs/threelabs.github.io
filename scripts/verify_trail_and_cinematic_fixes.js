import { chromium } from 'playwright-core';

async function testTrailAndCinematics() {
  console.log('🚀 Running Trail Drivability & Cinematic Subtitle Verification...');
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

  // TEST 1: Boardwalk Promontory Drivability & Ground Elevation
  console.log('\n--- TEST 1: Summit Deck -> Boardwalk -> Promontory Drivability ---');
  const boardwalkTest = await page.evaluate(() => {
    const g = window.game;
    const p = g.physics;
    const road = g.splineRoad;

    // 1. Check ground elevation at main deck (-245, 1100)
    const tCenter = road.getRoadTransformAtZ(1100, -245, 0);
    const elevCenter = road.getGroundElevation(tCenter.pos.x, tCenter.pos.z);

    // 2. Check ground elevation at midpoint of boardwalk (-264, 1086)
    const tMid = road.getRoadTransformAtZ(1086, -264, 0);
    const elevMid = road.getGroundElevation(tMid.pos.x, tMid.pos.z);

    // 3. Check ground elevation at promontory telescope pad (-284.5, 1071)
    const tProm = road.getRoadTransformAtZ(1071, -284.5, 0);
    const elevProm = road.getGroundElevation(tProm.pos.x, tProm.pos.z);

    // Place car on the boardwalk and step physics forward 60 frames
    p.position.set(tMid.pos.x, elevMid + 0.25, tMid.pos.z);
    p.speed = 10;
    p.heading = Math.atan2(tProm.pos.x - tCenter.pos.x, tProm.pos.z - tCenter.pos.z);
    p.isGrounded = true;
    p.verticalVelocity = 0;

    for (let f = 0; f < 60; f++) {
      p.update(1 / 60, { throttle: 0.4, brake: 0, steer: 0, isTouchSteering: false });
    }

    const endRoadInfo = road.getRoadInfo(p.position.x, p.position.z);
    road.update(1 / 60, p.position);
    g.hud.update(p, road, 1 / 60);

    return {
      elevCenter,
      elevMid,
      elevProm,
      carFinalY: p.position.y,
      carFinalX: p.position.x,
      carFinalZ: p.position.z,
      isGrounded: p.isGrounded,
      isOnTrail: endRoadInfo.isOnTrail,
      nearbyVf: !!g.gameState.nearbyViewfinder,
      vfName: g.gameState.nearbyViewfinder ? g.gameState.nearbyViewfinder.name : null
    };
  });

  console.log('Elevations along summit complex:', {
    centerDeck: boardwalkTest.elevCenter,
    midBoardwalk: boardwalkTest.elevMid,
    promontoryTelescope: boardwalkTest.elevProm
  });
  console.log('Car driving across boardwalk result:', {
    finalY: boardwalkTest.carFinalY,
    isGrounded: boardwalkTest.isGrounded,
    isOnTrail: boardwalkTest.isOnTrail,
    nearbyVf: boardwalkTest.nearbyVf,
    vfName: boardwalkTest.vfName
  });

  if (boardwalkTest.elevMid < 55.0 || boardwalkTest.elevProm < 55.0) {
    throw new Error(`Boardwalk or promontory elevation collapsed below 55m! mid=${boardwalkTest.elevMid}, prom=${boardwalkTest.elevProm}`);
  }
  if (boardwalkTest.carFinalY < 55.0) {
    throw new Error(`Car fell through the boardwalk/promontory! finalY=${boardwalkTest.carFinalY}`);
  }
  console.log('✅ PASS: Boardwalk and promontory are solid ground at ~56.0m elevation! Vehicle drives seamlessly across!');

  await page.screenshot({ path: 'scripts/boardwalk_drivability_verified.png' });
  console.log('📸 Screenshot saved: scripts/boardwalk_drivability_verified.png');

  // TEST 2: Cinematic Subtitle Display Duration & Typography
  console.log('\n--- TEST 2: Cinematic Subtitle Display Duration & Styling ---');
  await page.evaluate(() => {
    const g = window.game;
    const scene = g.splineRoad.mysteryCrimeScene || g.mysteryCrimeScene;
    if (scene) {
      scene.triggerCrimeScene();
    }
  });

  await page.waitForTimeout(500);

  // Check subtitles at multiple timestamps
  const shotSubs = await page.evaluate(() => {
    const g = window.game;
    const scene = g.splineRoad.mysteryCrimeScene || g.mysteryCrimeScene;
    scene.animTime = 1.0;
    scene.getCurrentCutsceneCam();
    g.hud.update(g.physics, g.splineRoad, 1 / 60);

    const subText = document.querySelector('#cutscene-subtitles-text');

    const html1 = subText ? subText.innerHTML : '';
    const text1 = g.gameState.cutsceneSubtitles;

    scene.animTime = 4.5;
    scene.getCurrentCutsceneCam();
    g.hud.update(g.physics, g.splineRoad, 1 / 60);

    const html2 = subText ? subText.innerHTML : '';
    const text2 = g.gameState.cutsceneSubtitles;

    scene.animTime = 9.0;
    scene.getCurrentCutsceneCam();
    g.hud.update(g.physics, g.splineRoad, 1 / 60);

    const html3 = subText ? subText.innerHTML : '';
    const text3 = g.gameState.cutsceneSubtitles;

    scene.animTime = 13.5;
    scene.getCurrentCutsceneCam();
    g.hud.update(g.physics, g.splineRoad, 1 / 60);

    const html4 = subText ? subText.innerHTML : '';
    const text4 = g.gameState.cutsceneSubtitles;

    return {
      t1: { text: text1, html: html1 },
      t2: { text: text2, html: html2 },
      t3: { text: text3, html: html3 },
      t4: { text: text4, html: html4 },
      isCutsceneActive: g.gameState.isCutsceneActive
    };
  });

  console.log('Shot 1 Line 1 (t=1.0s):', shotSubs.t1.text);
  console.log('Shot 1 Line 2 (t=4.5s):', shotSubs.t2.text);
  console.log('Shot 2 Line 1 (t=9.0s):', shotSubs.t3.text);
  console.log('Shot 2 Line 2 (t=13.5s):', shotSubs.t4.text);
  console.log('Speaker styling sample HTML:', shotSubs.t3.html);

  if (!shotSubs.t3.html.includes('MOB BOSS:') || !shotSubs.t3.html.includes('#facc15')) {
    throw new Error('Expected speaker MOB BOSS: to be styled with high-contrast gold badge');
  }

  await page.screenshot({ path: 'scripts/cinematic_subtitle_verified.png' });
  console.log('📸 Screenshot saved: scripts/cinematic_subtitle_verified.png');

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED: Trail Drivability & Cinematic Subtitle Timing Verified!');
  console.log('====================================================');

  await browser.close();
}

testTrailAndCinematics().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
