const { chromium } = require('playwright-core');

async function captureCloseup() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) await startScreen.click();
  await page.waitForTimeout(1000);

  // Position camera at a dramatic three-quarter side/front angle looking at the Jeep
  await page.evaluate(() => {
    const car = window.game.sportsCar;
    const phys = window.game.physics;
    
    // Set hanging damage
    phys.carIntegrity = 45;
    window.game.gameState.carIntegrity = 45;
    car.damagePoints.doorL = 0.50;
    car.damagePoints.hood = 0.50;
    car.damagePoints.fenderL = 0.40;
    car.damagePoints.frontBumper = 0.45;
    car.applyVisualDeformations();

    // Manually reposition camera to dramatic three-quarter front-left perspective
    const cam = window.game.renderer.camera;
    const carPos = car.group.position;
    cam.position.set(carPos.x - 3.2, carPos.y + 1.6, carPos.z + 3.8);
    cam.lookAt(carPos.x, carPos.y + 0.8, carPos.z);
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/parts_hanging_closeup.png' });
  console.log('📸 Captured scripts/parts_hanging_closeup.png');

  await browser.close();
}

captureCloseup().catch(err => {
  console.error(err);
  process.exit(1);
});
