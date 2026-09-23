const { chromium } = require('playwright-core');
const { spawn } = require('child_process');

async function run() {
  console.log('🚀 Starting Vite dev server for Cabazon Dinosaurs inspection...');
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5189', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 2500));

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

  await page.goto('http://localhost:5189');
  await page.waitForTimeout(2000);

  // Dismiss start screen
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(800);
  }

  // View 1: Inside Turnout, parked at scenic spot looking directly at dinosaurs
  const dinoInfo = await page.evaluate(() => {
    if (window.game) {
      if (window.game.cameraManager) window.game.cameraManager.skipIntro();
      // In the turnout (lateralOffset = -28m)
      const trans = window.game.splineRoad.getRoadTransformAtZ(1545, -28, 0);
      window.game.physics.position.copy(trans.pos);
      // Turn to look across turnout into the dinosaur park
      window.game.physics.heading = trans.heading + Math.PI * 0.5;
      window.game.physics.speed = 0;
      if (window.game.cameraManager) {
        window.game.cameraManager.setMode('CHASE');
      }
      return {
        carPos: trans.pos,
        heading: trans.heading,
        carHeading: window.game.physics.heading
      };
    }
    return null;
  });
  console.log('Turnout Car Info:', dinoInfo);

  await page.waitForTimeout(1500);
  const shotPathTurnout = '/home/kevin/.gemini/antigravity/brain/10e39d9b-339c-4c1c-afcc-a8ed9f0da9f4/cabazon_dinos_turnout.png';
  await page.screenshot({ path: shotPathTurnout });
  console.log(`📸 Screenshot captured: ${shotPathTurnout}`);

  // View 2: Highway Approach (Z = 1515m, on road)
  await page.evaluate(() => {
    if (window.game) {
      const trans = window.game.splineRoad.getRoadTransformAtZ(1515, 0, 0);
      window.game.physics.position.copy(trans.pos);
      window.game.physics.heading = trans.heading;
      window.game.physics.speed = 0;
    }
  });

  await page.waitForTimeout(1200);
  const shotPathHighway = '/home/kevin/.gemini/antigravity/brain/10e39d9b-339c-4c1c-afcc-a8ed9f0da9f4/cabazon_dinos_highway.png';
  await page.screenshot({ path: shotPathHighway });
  console.log(`📸 Screenshot captured: ${shotPathHighway}`);

  // View 3: Close-up facing Dinny & Rex from the tourist apron
  await page.evaluate(() => {
    if (window.game) {
      const trans = window.game.splineRoad.getRoadTransformAtZ(1550, -38, 0);
      window.game.physics.position.copy(trans.pos);
      window.game.physics.heading = trans.heading + Math.PI * 0.5;
      window.game.physics.speed = 0;
    }
  });

  await page.waitForTimeout(1200);
  const shotPathCloseup = '/home/kevin/.gemini/antigravity/brain/10e39d9b-339c-4c1c-afcc-a8ed9f0da9f4/cabazon_dinos_closeup.png';
  await page.screenshot({ path: shotPathCloseup });
  console.log(`📸 Screenshot captured: ${shotPathCloseup}`);

  await browser.close();
  server.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
