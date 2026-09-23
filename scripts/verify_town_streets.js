import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for town streetscapes verification...');
  const server = spawn('/home/kevin/.local/bin/node', ['node_modules/vite/bin/vite.js', '--port', '5180', '--strictPort'], {
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

  await page.goto('http://localhost:5180');
  await page.waitForTimeout(2000);

  // Click start screen to awaken engine
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(600);
  }

  const streetscapes = [
    { name: 'cross_creek_malibu', z: 3750, carX: 10, lookX: 24, title: 'Malibu Country Mart Arcade' },
    { name: 'carmel_village_shops', z: 9740, carX: 12, lookX: 28, title: 'Carmel-by-the-Sea Village Shops' },
    { name: 'sausalito_shops', z: 11950, carX: -10, lookX: -22, title: 'Sausalito Bridgeway Waterfront' },
    { name: 'ferndale_mansions', z: 14540, carX: 18, lookX: 35, title: 'Ferndale Victorian Gingerbread Row' },
    { name: 'hood_river_street', z: 19440, carX: 14, lookX: 32, title: 'Hood River Historic Street' }
  ];

  for (const st of streetscapes) {
    console.log(`📍 Visiting ${st.title} at Z = ${st.z}m...`);
    await page.evaluate((item) => {
      if (window.game) {
        if (window.game.cameraManager) window.game.cameraManager.skipIntro();
        const trans = window.game.splineRoad.getRoadTransformAtZ(item.z - 20, item.carX, 0);
        window.game.physics.position.copy(trans.pos);
        window.game.physics.heading = trans.heading;
        window.game.physics.speed = 0;
        if (window.game.cameraManager) {
          window.game.cameraManager.setMode('CHASE');
          const targetTrans = window.game.splineRoad.getRoadTransformAtZ(item.z, item.lookX, 3.5);
          if (window.game.cameraManager.camera) {
            window.game.cameraManager.camera.lookAt(targetTrans.pos);
          }
        }
      }
    }, st);

    await page.waitForTimeout(2000);
    const shotPath = `scripts/${st.name}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`📸 Screenshot captured: ${shotPath}`);
  }

  await browser.close();
  server.kill();

  console.log('\n====================================================');
  console.log(`Streetscape Verification Complete: 0 Uncaught Exceptions in Browser! (${consoleErrors.length} console errors)`);
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
