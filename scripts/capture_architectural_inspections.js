import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  const server = spawn('/home/kevin/.local/bin/node', ['node_modules/vite/bin/vite.js', '--port', '5186', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 2500));

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5186');
  await page.waitForTimeout(2000);

  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
    await page.waitForTimeout(800);
  }

  // Define building inspection spots: place camera on road looking directly at building front facade
  const inspections = [
    { name: 'inspect_z1_malibu_dukes', bldgZ: 4050, bldgX: -20, camZ: 4032, camX: -6, camY: 3.5, title: "Duke's Malibu Restaurant" },
    { name: 'inspect_z2_bigsur_store', bldgZ: 5460, bldgX: 32, camZ: 5442, camX: 14, camY: 3.2, title: 'Big Sur General Store & Gas' },
    { name: 'inspect_z3_carmel_shops', bldgZ: 9735, bldgX: 28, camZ: 9718, camX: 12, camY: 3.0, title: 'Carmel Storybook Shops' },
    { name: 'inspect_z4_sausalito', bldgZ: 11950, bldgX: -22, camZ: 11932, camX: -8, camY: 3.2, title: 'Sausalito Bridgeway Waterfront' },
    { name: 'inspect_z5_ferndale', bldgZ: 14545, bldgX: 35, camZ: 14528, camX: 15, camY: 4.0, title: 'Ferndale Butterfat Palaces' },
    { name: 'inspect_z6_cannon_beach', bldgZ: 16580, bldgX: 30, camZ: 16562, camX: 12, camY: 3.2, title: 'Cannon Beach Hemlock Street' },
    { name: 'inspect_z7_hood_river', bldgZ: 19430, bldgX: 32, camZ: 19412, camX: 14, camY: 4.0, title: 'Hood River Historic Street' },
    { name: 'inspect_z8_pike_place', bldgZ: 23100, bldgX: 36, camZ: 23080, camX: 16, camY: 3.8, title: 'Pike Place Public Market' }
  ];

  for (const item of inspections) {
    await page.evaluate((loc) => {
      if (window.game) {
        window.game.cameraManager.skipIntro();
        const bldgTrans = window.game.splineRoad.getRoadTransformAtZ(loc.bldgZ, loc.bldgX, 0);
        const camTrans = window.game.splineRoad.getRoadTransformAtZ(loc.camZ, loc.camX, 0);

        // Position vehicle at camera spot
        window.game.physics.position.copy(camTrans.pos);
        const veh = window.game.sportsCar || window.game.vehicle;
        if (veh && veh.group) veh.group.position.copy(camTrans.pos);

        // Aim camera directly from road spot toward building front facade
        const cam = window.game.cameraManager.camera;
        cam.position.set(camTrans.pos.x, camTrans.pos.y + loc.camY, camTrans.pos.z);
        cam.lookAt(bldgTrans.pos.x, bldgTrans.pos.y + 4.0, bldgTrans.pos.z);
      }
    }, item);

    await page.waitForTimeout(1400);
    const shotPath = `scripts/${item.name}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`📸 Captured inspection: ${shotPath}`);
  }

  await browser.close();
  server.kill();
  console.log('✅ Inspection complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
