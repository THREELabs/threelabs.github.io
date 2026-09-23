import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  const server = spawn('/home/kevin/.local/bin/node', ['node_modules/vite/bin/vite.js', '--port', '5185', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 2500));

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5185');
  await page.waitForTimeout(2000);

  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(800);
  }

  const targets = [
    { name: 'facade_carmel_village', z: 9740, carX: 10, dZ: -12, angle: 0.85, title: 'Carmel Village Shops' },
    { name: 'facade_sausalito_waterfront', z: 11950, carX: -8, dZ: -14, angle: -0.90, title: 'Sausalito Bridgeway Waterfront' },
    { name: 'facade_ferndale_victorian', z: 14545, carX: 12, dZ: -14, angle: 0.90, title: 'Ferndale Butterfat Palaces' },
    { name: 'facade_cannon_beach', z: 16580, carX: 10, dZ: -12, angle: 0.85, title: 'Cannon Beach Commercial Street' },
    { name: 'facade_hood_river', z: 19430, carX: 10, dZ: -14, angle: 0.85, title: 'Hood River Hotel & Full Sail Brewery' },
    { name: 'facade_pike_place', z: 23100, carX: 10, dZ: -15, angle: 0.85, title: 'Pike Place Market' }
  ];

  for (const t of targets) {
    await page.evaluate((item) => {
      if (window.game) {
        if (window.game.cameraManager) window.game.cameraManager.skipIntro();
        const trans = window.game.splineRoad.getRoadTransformAtZ(item.z + item.dZ, item.carX, 0);
        const targetRot = trans.heading + item.angle;
        window.game.physics.position.copy(trans.pos);
        window.game.physics.heading = targetRot;
        window.game.physics.speed = 0;
        if (window.game.vehicle && window.game.vehicle.group) {
          window.game.vehicle.group.position.copy(trans.pos);
          window.game.vehicle.group.rotation.y = targetRot;
        }
        if (window.game.cameraManager) {
          window.game.cameraManager.setMode('CHASE');
          window.game.cameraManager.resetTracking();
        }
      }
    }, t);

    await page.waitForTimeout(1600);
    const shotPath = `scripts/${t.name}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`📸 Captured: ${shotPath}`);
  }

  await browser.close();
  server.kill();
  console.log('✅ All facade closeups captured!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
