const { chromium } = require('playwright-core');

async function testDamageAndRoad() {
  console.log('🚀 Launching Chrome to test progressive vehicle breakdown and smooth road...');
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

  // 1. Accelerate and drive on the road to check asphalt smoothness
  console.log('🏎️ Driving forward at high speed...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyW');

  // Take screenshot of smooth asphalt driving
  await page.screenshot({ path: 'scripts/smooth_asphalt_driving.png' });
  console.log('📸 Captured scripts/smooth_asphalt_driving.png');

  // 2. Test Part Hanging Stage (Damage ~50%)
  console.log('💥 Applying moderate damage to test hanging parts (doors open/flapping, hood unlatched, mirrors dangling)...');
  const hangingReport = await page.evaluate(() => {
    const car = window.game.sportsCar;
    const phys = window.game.physics;
    
    // Apply moderate damage
    phys.carIntegrity = 49;
    window.game.gameState.carIntegrity = 49;
    car.damagePoints.doorL = 0.45;
    car.damagePoints.hood = 0.45;
    car.damagePoints.fenderL = 0.35;
    car.applyVisualDeformations();

    return {
      partStates: car.partStates,
      detached: car.detached,
      doorLVisible: car.doorLGroup.visible,
      hoodVisible: car.hoodGroup.visible,
      mirrorLVisible: car.mirrorLGroup.visible
    };
  });
  console.log('Hanging stage report:', hangingReport);

  // Step simulation forward to animate hanging parts
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/vehicle_parts_hanging.png' });
  console.log('📸 Captured scripts/vehicle_parts_hanging.png');

  // 3. Test Full Detachment Stage (Severe damage ~10%)
  console.log('💥 Applying severe damage to test full part detachment & tumbling debris...');
  const detachedReport = await page.evaluate(() => {
    const car = window.game.sportsCar;
    const phys = window.game.physics;

    phys.carIntegrity = 8;
    window.game.gameState.carIntegrity = 8;
    car.damagePoints.doorL = 0.85;
    car.damagePoints.doorR = 0.85;
    car.damagePoints.hood = 0.85;
    car.damagePoints.fenderL = 0.85;
    car.damagePoints.frontBumper = 0.90;
    car.damagePoints.rearWing = 0.85;
    car.applyVisualDeformations();

    return {
      partStates: car.partStates,
      detached: car.detached,
      doorLVisible: car.doorLGroup.visible,
      doorRVisible: car.doorRGroup.visible,
      hoodVisible: car.hoodGroup.visible,
      frontBumperVisible: car.bumperGroup.visible,
      rearCarrierVisible: car.rearCarrierGroup.visible,
      activeDebrisCount: window.game.debrisManager.activeDebris.length
    };
  });
  console.log('Detached stage report:', detachedReport);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/vehicle_parts_detached.png' });
  console.log('📸 Captured scripts/vehicle_parts_detached.png');

  // 4. Test Auto Shop Repair
  console.log('🛠️ Testing repairVehicle()...');
  const repairReport = await page.evaluate(() => {
    const car = window.game.sportsCar;
    car.repairVehicle();

    return {
      partStates: car.partStates,
      detached: car.detached,
      doorLVisible: car.doorLGroup.visible,
      hoodVisible: car.hoodGroup.visible,
      bumperVisible: car.bumperGroup.visible
    };
  });
  console.log('Repair report:', repairReport);

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error('❌ Console errors detected:', consoleErrors);
    process.exit(1);
  }

  // Assertions
  if (hangingReport.partStates.doorL !== 'hanging' || hangingReport.partStates.hood !== 'hanging') {
    console.error('❌ Hanging stage assertion failed!');
    process.exit(1);
  }

  if (detachedReport.partStates.doorL !== 'detached' || detachedReport.doorLVisible !== false) {
    console.error('❌ Detached stage assertion failed!');
    process.exit(1);
  }

  if (repairReport.partStates.doorL !== 'attached' || repairReport.doorLVisible !== true) {
    console.error('❌ Repair assertion failed!');
    process.exit(1);
  }

  console.log('🎉 ALL PLAYTEST VERIFICATIONS PASSED SUCCESSFULLY!');
}

testDamageAndRoad().catch(err => {
  console.error('Fatal playtest error:', err);
  process.exit(1);
});
