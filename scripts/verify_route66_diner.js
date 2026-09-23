import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for Route 66 Diner inspection...');
  const server = spawn('/home/kevin/.local/bin/node', ['node_modules/vite/bin/vite.js', '--port', '5182', '--strictPort'], {
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

  await page.goto('http://localhost:5182');
  await page.waitForTimeout(2000);

  // Click start screen
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(600);
  }

  // Teleport car to Z = 720m (approach to Route 66 Diner turnout at Z = 750m)
  await page.evaluate(() => {
    if (window.game) {
      if (window.game.cameraManager) window.game.cameraManager.skipIntro();
      const trans = window.game.splineRoad.getRoadTransformAtZ(725, 0, 0);
      window.game.physics.position.copy(trans.pos);
      window.game.physics.heading = trans.heading;
      window.game.physics.speed = 0;
      if (window.game.cameraManager) {
        window.game.cameraManager.setMode('CHASE');
      }
    }
  });

  await page.waitForTimeout(2000);
  const shotPath = 'scripts/route66_diner_redesign.png';
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot captured: ${shotPath}`);

  // Also take a closer shot from the parking apron
  await page.evaluate(() => {
    if (window.game) {
      const trans = window.game.splineRoad.getRoadTransformAtZ(745, 22, 0);
      window.game.physics.position.copy(trans.pos);
      window.game.physics.heading = trans.heading + 0.35;
      window.game.physics.speed = 0;
    }
  });

  await page.waitForTimeout(1500);
  const closeupPath = 'scripts/route66_diner_closeup.png';
  await page.screenshot({ path: closeupPath });
  console.log(`📸 Screenshot captured: ${closeupPath}`);

  // Take direct shot facing the Diner facade
  await page.evaluate(() => {
    if (window.game) {
      const trans = window.game.splineRoad.getRoadTransformAtZ(732, 46, 0);
      window.game.physics.position.copy(trans.pos);
      window.game.physics.heading = trans.heading + Math.PI * 0.15;
      window.game.physics.speed = 0;
    }
  });

  await page.waitForTimeout(1500);
  const frontDinerPath = 'scripts/route66_diner_facade.png';
  await page.screenshot({ path: frontDinerPath });
  console.log(`📸 Screenshot captured: ${frontDinerPath}`);


  await browser.close();
  server.kill();

  console.log('\n====================================================');
  console.log(`Verification Complete: ${consoleErrors.length} console errors`);
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
