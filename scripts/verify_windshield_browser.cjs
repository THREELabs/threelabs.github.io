const { chromium } = require('playwright-core');

async function run() {
  console.log('🚀 Launching headless browser for windshield verification...');
  const browser = await chromium.launch({
    headless: true,
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

  // Inspect windshield hierarchy and material properties
  const windshieldInfo = await page.evaluate(() => {
    const jeep = window.game.sportsCar;
    const wsGroup = jeep.windshieldGroup;
    let glassCount = 0;
    let transparentGlassFound = false;
    let doubleSidedFound = false;
    let glassOpacity = null;

    wsGroup.traverse(child => {
      if (child.isMesh && child.material) {
        if (child.material.transparent && child.material.opacity < 0.5) {
          glassCount++;
          transparentGlassFound = true;
          glassOpacity = child.material.opacity;
          if (child.material.side === 2) { // THREE.DoubleSide === 2
            doubleSidedFound = true;
          }
        }
      }
    });

    return {
      childrenCount: wsGroup.children.length,
      glassCount,
      transparentGlassFound,
      doubleSidedFound,
      glassOpacity,
      crackedVisible: jeep.crackedWindshieldMesh ? jeep.crackedWindshieldMesh.visible : null
    };
  });

  console.log('Windshield hierarchy & material info:', windshieldInfo);

  // 1. Capture front exterior beauty view looking through the windshield into the cabin
  await page.evaluate(() => {
    window.game.cameraManager.isIntro = false;
    window.game.gameState.isIntroActive = false;
    window.game.gameState.introState = 'playing';
    window.game.cameraManager.isOrbitDragging = true;
    window.game.cameraManager.manualYaw = Math.PI; // 180 deg to look at front of jeep
    window.game.cameraManager.manualYawTarget = Math.PI;
    window.game.cameraManager.manualPitch = -0.15;
    window.game.cameraManager.manualPitchTarget = -0.15;
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/windshield_front_view.png' });
  console.log('📸 Captured front exterior view: scripts/windshield_front_view.png');

  // 2. Switch to cockpit camera looking forward through windshield
  await page.evaluate(() => {
    window.game.gameState.isCameraOrbiting = false;
    window.game.gameState.cameraOrbitYaw = 0.0;
    window.game.cameraManager.setMode('COCKPIT');
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/windshield_cockpit_view.png' });
  console.log('📸 Captured cockpit view: scripts/windshield_cockpit_view.png');

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error('Console errors encountered:', consoleErrors);
    process.exit(1);
  }

  if (!windshieldInfo.transparentGlassFound || !windshieldInfo.doubleSidedFound) {
    console.error('Windshield glass verification failed!');
    process.exit(1);
  }

  console.log('🎉 Browser verification complete! Windshield is transparent, double-sided, and see-through.');
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
