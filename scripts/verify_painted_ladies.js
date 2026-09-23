import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for Painted Ladies verification...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5178', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('🌐 Launching headless Chrome...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:5178');
  await page.waitForTimeout(2000);

  // Click start screen to awaken engine
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(600);
  }

  console.log('📍 Teleporting vehicle to approaching Painted Ladies turnout (Z = 10750m)...');
  await page.evaluate(() => {
    if (window.game) {
      if (window.game.cameraManager) window.game.cameraManager.skipIntro();
      const trans = window.game.splineRoad.getRoadTransformAtZ(10760, 2.0, 0);
      window.game.physics.position.copy(trans.pos);
      window.game.physics.heading = trans.heading;
      window.game.physics.speed = 35;
      if (window.game.cameraManager) window.game.cameraManager.setMode('CHASE');
    }
  });

  // Let multiple frames render so camera and scenery are fully settled
  await page.waitForTimeout(2500);

  // Capture verification screenshot
  const screenshotPath = 'scripts/painted_ladies_turnout.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot captured: ${screenshotPath}`);

  // Now let's pull up into the turnout and look directly at the Victorian row front facade!
  await page.evaluate(() => {
    if (window.game) {
      const turnoutTrans = window.game.splineRoad.getRoadTransformAtZ(10800, 20.0, 0);
      window.game.physics.position.copy(turnoutTrans.pos);
      // Look directly across turnout towards the houses (-X direction in world)
      window.game.physics.heading = turnoutTrans.heading - Math.PI * 0.48;
      window.game.physics.speed = 0;
    }
  });

  await page.waitForTimeout(1500);
  const closeupPath = 'scripts/painted_ladies_closeup.png';
  await page.screenshot({ path: closeupPath });
  console.log(`📸 Close-up screenshot captured: ${closeupPath}`);

  await browser.close();
  server.kill();

  if (consoleErrors.length > 0) {
    console.error('❌ Console errors detected:', consoleErrors);
    process.exit(1);
  } else {
    console.log('✅ Browser verification passed with 0 console errors!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
