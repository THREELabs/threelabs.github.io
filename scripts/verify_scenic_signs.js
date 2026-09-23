import { chromium } from 'playwright-core';

async function run() {
  console.log('🌐 Launching Chrome with Playwright for Scenic Signs Verification...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  console.log('🏎️ Connecting to dev server at http://localhost:5173 ...');
  await page.goto('http://localhost:5173/index.html', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Dismiss Awakening / Start Screen
  await page.evaluate(() => {
    const startBtn = document.getElementById('start-awaken-btn');
    if (startBtn) startBtn.click();
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.skipIntro();
      window.game.cameraManager.setMode('CHASE');
    }
  });
  await page.waitForTimeout(1000);

  const artifactDir = '/home/kevin/.gemini/antigravity/brain/04fcecf0-6138-4667-a623-6059250fe1d7';

  // 1. Advance Warning Sign (Approach View: Z=62, Sign is at Z=90 on left shoulder)
  console.log('📸 View 1: Advance Warning Sign Approach...');
  await page.evaluate(() => {
    const g = window.game;
    const trans = g.splineRoad.getRoadTransformAtZ(62, -3.5, 0);
    g.physics.position.copy(trans.pos);
    g.physics.heading = trans.heading;
    g.physics.speed = 0;
  });
  await page.waitForTimeout(1500);
  const shot1 = `${artifactDir}/01_advance_warning_sign_approach.png`;
  await page.screenshot({ path: shot1 });
  console.log(`Captured: ${shot1}`);

  // 2. Advance Warning Sign (Close-Up View: Z=80)
  console.log('📸 View 2: Advance Warning Sign Detail...');
  await page.evaluate(() => {
    const g = window.game;
    const trans = g.splineRoad.getRoadTransformAtZ(78, -5.5, 0);
    g.physics.position.copy(trans.pos);
    g.physics.heading = trans.heading;
    g.physics.speed = 0;
  });
  await page.waitForTimeout(1500);
  const shot2 = `${artifactDir}/02_advance_warning_sign_detail.png`;
  await page.screenshot({ path: shot2 });
  console.log(`Captured: ${shot2}`);

  // 3. Turnout Entrance Sign (Approach View: Z=275, Sign is at Z=309 on left shoulder)
  console.log('📸 View 3: Turnout Entrance Sign Approach...');
  await page.evaluate(() => {
    const g = window.game;
    const trans = g.splineRoad.getRoadTransformAtZ(275, -4.0, 0);
    g.physics.position.copy(trans.pos);
    g.physics.heading = trans.heading;
    g.physics.speed = 0;
  });
  await page.waitForTimeout(1500);
  const shot3 = `${artifactDir}/03_turnout_entrance_sign_approach.png`;
  await page.screenshot({ path: shot3 });
  console.log(`Captured: ${shot3}`);

  // 4. Turnout Entrance Sign (Close-Up View: Z=298)
  console.log('📸 View 4: Turnout Entrance Sign Detail...');
  await page.evaluate(() => {
    const g = window.game;
    const trans = g.splineRoad.getRoadTransformAtZ(298, -6.0, 0);
    g.physics.position.copy(trans.pos);
    g.physics.heading = trans.heading;
    g.physics.speed = 0;
  });
  await page.waitForTimeout(1500);
  const shot4 = `${artifactDir}/04_turnout_entrance_sign_detail.png`;
  await page.screenshot({ path: shot4 });
  console.log(`Captured: ${shot4}`);

  // 5. Check console errors
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
  }

  await browser.close();
  console.log('🎉 Verification screenshots completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
