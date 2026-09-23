const { chromium } = require('playwright-core');

async function testSafariJeep() {
  console.log('🚀 Launching Chrome to test Safari Jeep movement in live browser...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to http://localhost:8000 ...');
  await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click start screen
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
  }
  await page.waitForTimeout(1000);

  const initialZ = await page.evaluate(() => {
    return {
      physZ: window.game.physics.position.z,
      carZ: window.game.sportsCar.group.position.z
    };
  });
  console.log('Initial positions before driving:', initialZ);

  // Press and hold ArrowUp to accelerate
  console.log('🏎️ Holding KeyW to drive forward...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(3000);
  await page.keyboard.up('KeyW');

  const afterDriveZ = await page.evaluate(() => {
    return {
      physZ: window.game.physics.position.z,
      carZ: window.game.sportsCar.group.position.z,
      speed: window.game.physics.speed,
      isIntroActive: window.game.gameState.isIntroActive
    };
  });
  console.log('Positions after driving:', afterDriveZ);

  // Check movement
  const movedCar = afterDriveZ.carZ > initialZ.carZ + 5;
  const inSync = Math.abs(afterDriveZ.carZ - afterDriveZ.physZ) < 0.01;
  console.log(`Car moved forward: ${movedCar} (${initialZ.carZ} -> ${afterDriveZ.carZ})`);
  console.log(`Car matches physics position: ${inSync}`);

  await page.screenshot({ path: 'scripts/safari_jeep_moving.png' });
  await browser.close();

  if (!movedCar || !inSync) {
    console.error('❌ FAILURE: Car did not move or was out of sync!');
    process.exit(1);
  }

  console.log('🎉 SUCCESS: Safari Jeep moves and drives forward smoothly down the road!');
}

testSafariJeep().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
