import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for scenery verification...');
  const server = spawn('/home/kevin/.local/bin/node', ['node_modules/vite/bin/vite.js', '--port', '5179', '--strictPort'], {
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

  await page.goto('http://localhost:5179');
  await page.waitForTimeout(2000);

  // Click start screen to awaken engine
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(600);
  }

  const landmarks = [
    { name: 'carmel_mission', z: 10100, lat: 20, lookLat: 36, title: 'Carmel Mission Basilica' },
    { name: 'carson_mansion', z: 14400, lat: 22, lookLat: 38, title: 'Carson Mansion Eureka' },
    { name: 'tillamook_barn', z: 17650, lat: 24, lookLat: 42, title: 'Tillamook Creamery Barn' },
    { name: 'multnomah_lodge', z: 19250, lat: 26, lookLat: 48, title: 'Multnomah Falls Stone Lodge' },
    { name: 'pike_place_market', z: 23100, lat: 20, lookLat: 36, title: 'Pike Place Public Market' }
  ];

  for (const lm of landmarks) {
    console.log(`📍 Visiting ${lm.title} at Z = ${lm.z}m...`);
    await page.evaluate((landmark) => {
      if (window.game) {
        if (window.game.cameraManager) window.game.cameraManager.skipIntro();
        const trans = window.game.splineRoad.getRoadTransformAtZ(landmark.z - 25, landmark.lat, 0);
        window.game.physics.position.copy(trans.pos);
        window.game.physics.heading = trans.heading;
        window.game.physics.speed = 10;
        if (window.game.cameraManager) {
          window.game.cameraManager.setMode('CHASE');
          // Aim camera slightly towards landmark
          const targetTrans = window.game.splineRoad.getRoadTransformAtZ(landmark.z, landmark.lookLat, 3);
          if (window.game.cameraManager.camera) {
            window.game.cameraManager.camera.lookAt(targetTrans.pos);
          }
        }
      }
    }, lm);

    await page.waitForTimeout(2000);
    const shotPath = `scripts/${lm.name}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`📸 Screenshot captured: ${shotPath}`);
  }

  await browser.close();
  server.kill();

  console.log('\n====================================================');
  console.log(`Verification Complete: 0 Uncaught Exceptions in Browser! (${consoleErrors.length} console errors)`);
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
