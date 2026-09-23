const { chromium } = require('playwright-core');

async function testJeepDebrisBrowser() {
  console.log('🚀 Launching Chrome to test authentic Jeep crash debris and paint synchronization...');
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

  // Click start screen if active
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    await startScreen.click();
  }
  await page.waitForTimeout(1000);

  // 1. Verify Initial Debris Material Color (Sahara Sand, NOT pink)
  console.log('🔍 Checking initial debris paint color in browser context...');
  const initialPaintReport = await page.evaluate(() => {
    const debris = window.game.debrisManager;
    const jeep = window.game.sportsCar;
    return {
      debrisPaintHex: '0x' + debris.matPaint.color.getHex().toString(16),
      jeepPaintHex: '0x' + jeep.matPaint.color.getHex().toString(16),
      isPink: debris.matPaint.color.getHex() === 0xf43f85
    };
  });
  console.log('Paint verification report:', initialPaintReport);

  if (initialPaintReport.isPink) {
    throw new Error('FAILED: Debris matPaint is pink (0xf43f85)!');
  }

  // 2. Test Paint Synchronization from Tablet HUD
  console.log('🎨 Testing paint change to Golden Eagle Mustard (0xe5a93b)...');
  const paintSyncReport = await page.evaluate(() => {
    const jeep = window.game.sportsCar;
    const debris = window.game.debrisManager;

    // Apply new overland paint
    jeep.setPaintColor(0xe5a93b, 'Golden Eagle Mustard');

    return {
      jeepHex: '0x' + jeep.matPaint.color.getHex().toString(16),
      debrisHex: '0x' + debris.matPaint.color.getHex().toString(16),
      beadlockHex: '0x' + debris.matBeadlockRing.color.getHex().toString(16)
    };
  });
  console.log('Paint sync report:', paintSyncReport);

  if (paintSyncReport.debrisHex !== '0xe5a93b') {
    throw new Error('FAILED: Debris manager did not sync paint with Jeep!');
  }

  // 3. Accelerate and apply severe impact to trigger component breakdown
  console.log('🏎️ Accelerating vehicle...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyW');

  console.log('💥 Triggering major vehicle breakdown and physical debris spawn...');
  const crashReport = await page.evaluate(() => {
    const car = window.game.sportsCar;
    const phys = window.game.physics;
    const debris = window.game.debrisManager;

    phys.carIntegrity = 5;
    window.game.gameState.carIntegrity = 5;

    car.damagePoints.frontBumper = 0.95;
    car.damagePoints.hood = 0.90;
    car.damagePoints.doorL = 0.90;
    car.damagePoints.doorR = 0.90;
    car.damagePoints.rearWing = 0.90;
    car.damagePoints.fenderL = 0.90;
    car.damagePoints.fenderR = 0.90;

    car.applyVisualDeformations();

    // Collect info on active debris items
    const activeItems = debris.activeDebris.map(d => ({
      type: d.type,
      pos: { x: d.pos.x, y: d.pos.y, z: d.pos.z },
      childCount: d.meshGroup.children[0] ? d.meshGroup.children[0].children.length : 0
    }));

    // Check all materials across all spawned debris to ensure zero pink
    let pinkDetected = false;
    debris.group.traverse(child => {
      if (child.isMesh && child.material && child.material.color) {
        if (child.material.color.getHex() === 0xf43f85) {
          pinkDetected = true;
        }
      }
    });

    return {
      activeDebrisCount: debris.activeDebris.length,
      activeItems,
      pinkDetected,
      detachedStates: { ...car.partStates }
    };
  });

  console.log('Crash & debris report:', crashReport);

  if (crashReport.pinkDetected) {
    throw new Error('FAILED: Old pink color (0xf43f85) detected on debris meshes!');
  }
  if (crashReport.activeDebrisCount === 0) {
    throw new Error('FAILED: No debris was spawned upon vehicle breakdown!');
  }

  // Step simulation forward to capture screenshot of tumbling parts
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/jeep_debris_tumbling.png' });
  console.log('📸 Captured scripts/jeep_debris_tumbling.png');

  // 4. Test Auto Shop Repair
  console.log('🛠️ Testing repairVehicle()...');
  const repairReport = await page.evaluate(() => {
    const car = window.game.sportsCar;
    car.repairVehicle();

    return {
      doorL: car.partStates.doorL,
      hood: car.partStates.hood,
      rearWing: car.partStates.rearWing,
      frontBumper: car.partStates.frontBumper,
      doorLVisible: car.doorLGroup.visible,
      hoodVisible: car.hoodGroup.visible,
      fuelCanVisible: car.fuelCanGroup.visible,
      tractionBoardsVisible: car.tractionBoardsGroup.visible
    };
  });
  console.log('Repair report:', repairReport);

  if (repairReport.doorL !== 'attached' || !repairReport.doorLVisible || !repairReport.fuelCanVisible) {
    throw new Error('FAILED: repairVehicle did not restore all parts!');
  }

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error('❌ Console errors detected:', consoleErrors);
    process.exit(1);
  }

  console.log('🎉 BROWSER VERIFICATION COMPLETE: Authentic Safari Jeep components break off with correct paint and zero pink artifacts!');
}

testJeepDebrisBrowser().catch(err => {
  console.error('Fatal browser test error:', err);
  process.exit(1);
});
