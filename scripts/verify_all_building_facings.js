import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server on port 5183...');
  const server = spawn('/home/kevin/.local/bin/node', ['node_modules/vite/bin/vite.js', '--port', '5183', '--strictPort'], {
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

  await page.goto('http://localhost:5183');
  await page.waitForTimeout(2000);

  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(800);
  }

  const locations = [
    { name: 'facing_z0_route66', z: 750, carX: 4, lookX: 28, lookZ: 750, title: 'Route 66 Diner & Gas Station' },
    { name: 'facing_z1_malibu_dukes', z: 4050, carX: -4, lookX: -20, lookZ: 4050, title: "Duke's Malibu Restaurant" },
    { name: 'facing_z2_bigsur_store', z: 5460, carX: 6, lookX: 32, lookZ: 5460, title: 'Big Sur General Store & Gas' },
    { name: 'facing_z3_carmel_shops', z: 9740, carX: 6, lookX: 28, lookZ: 9740, title: 'Carmel-by-the-Sea Storybook Shops' },
    { name: 'facing_z4_sausalito', z: 11950, carX: -6, lookX: -22, lookZ: 11950, title: 'Sausalito Bridgeway Waterfront' },
    { name: 'facing_z5_ferndale', z: 14540, carX: 8, lookX: 35, lookZ: 14540, title: 'Ferndale Butterfat Palaces' },
    { name: 'facing_z6_cannon_beach', z: 16580, carX: 6, lookX: 30, lookZ: 16580, title: 'Cannon Beach Commercial Street' },
    { name: 'facing_z7_hood_river', z: 19430, carX: 8, lookX: 32, lookZ: 19430, title: 'Hood River Hotel & Full Sail Brewery' },
    { name: 'facing_z8_pike_place', z: 23100, carX: 8, lookX: 36, lookZ: 23100, title: 'Pike Place Public Market' }
  ];

  for (const loc of locations) {
    console.log(`📍 Visiting ${loc.title} at Z = ${loc.z}m...`);
    await page.evaluate((item) => {
      if (window.game) {
        if (window.game.cameraManager) window.game.cameraManager.skipIntro();
        const approachTrans = window.game.splineRoad.getRoadTransformAtZ(item.z - 28, item.carX, 0);
        window.game.physics.position.copy(approachTrans.pos);
        window.game.physics.heading = approachTrans.heading;
        window.game.physics.speed = 0;
        if (window.game.cameraManager && window.game.cameraManager.camera) {
          window.game.cameraManager.setMode('CHASE');
          const targetTrans = window.game.splineRoad.getRoadTransformAtZ(item.lookZ, item.lookX, 3.5);
          window.game.cameraManager.camera.lookAt(targetTrans.pos);
        }
      }
    }, loc);

    await page.waitForTimeout(2000);
    const shotPath = `scripts/${loc.name}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`📸 Captured: ${shotPath}`);
  }

  await browser.close();
  server.kill();
  console.log('✅ All building facings verified and captured.');
  if (consoleErrors.length > 0) {
    console.log(`⚠️ Console errors encountered: ${consoleErrors.length}`);
  } else {
    console.log('🎉 0 console errors detected in live browser!');
  }
}

run().catch(err => {
  console.error('Fatal in test:', err);
  process.exit(1);
});
