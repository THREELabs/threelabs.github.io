import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for Zone 0 browser verification...');
  const port = '5189';
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', port, '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', () => {});
  server.stderr.on('data', d => console.error(`[Vite Err] ${d}`));

  await new Promise(resolve => setTimeout(resolve, 2500));

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    console.log(`🌐 Navigating to http://localhost:${port} ...`);
    await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    // Click canvas to dismiss intro/awaken overlay
    console.log('🏁 Dismissing start gate...');
    await page.mouse.click(640, 360);
    await page.waitForTimeout(1000);

    // 1. Inspect initial Zone 0 state & scenery
    const zone0State = await page.evaluate(() => {
      const g = window.game;
      const desert = g.zoneBuilders[0].builder;
      const childNames = [];
      desert.group.traverse(c => { if (c.name) childNames.push(c.name); });

      return {
        zoneName: g.gameState.ambientTempLabel,
        heatShimmer: g.zones[0].heatShimmer,
        shieldsCount: desert.route66Shields.length,
        dustDevilsCount: desert.dustDevils.length,
        vulturesCount: desert.circlingVultures.length,
        hasRailroad: childNames.includes('Scenic_DesertTranscontinentalRailroad'),
        hasBurmaShave: childNames.some(n => n.startsWith('RoadSign_BurmaShave')),
        hasArroyoJump: childNames.includes('Scenic_ArroyoStuntJump'),
        hasJetGroup: !!desert.jetGroup
      };
    });

    if (zone0State.hasJetGroup) {
      throw new Error('Jet is present at start/intro! Expected jet to be completely removed.');
    }

    console.log('📊 Zone 0 Scenery Inspection:', JSON.stringify(zone0State, null, 2));

    // Capture starting line screenshot showing Burma-Shave corridor and staging
    await page.screenshot({ path: 'scripts/zone0_start_staging.png' });
    console.log('📸 Captured scripts/zone0_start_staging.png');

    // 2. Drive forward past Burma-Shave signs (Z = 220m to 380m)
    console.log('🏎️ Driving forward along Route 66...');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(4000);
    await page.keyboard.up('KeyW');

    // 3. Teleport to check Golden Shield Collectible pickup
    console.log('⭐ Testing Golden Route 66 Shield pickup...');
    const shieldResult = await page.evaluate(() => {
      const g = window.game;
      const desert = g.zoneBuilders[0].builder;
      const shield = desert.route66Shields[0];
      // Position car directly at shield position
      g.physics.position.copy(shield.pos);
      desert.update(0.016);
      return {
        collected: shield.collected,
        totalCollected: g.gameState.route66ShieldsCollected,
        score: g.gameState.score
      };
    });
    console.log('🏆 Shield Collect Telemetry:', JSON.stringify(shieldResult, null, 2));

    // 4. Test Freight Train Diesel Horn trigger at Z = 1200m
    console.log('🚂 Testing Freight Train Diesel Horn trigger...');
    const trainResult = await page.evaluate(() => {
      const g = window.game;
      const desert = g.zoneBuilders[0].builder;
      g.physics.position.set(0, 0.5, 1220);
      desert.update(0.016);
      return {
        trainHornTriggered: desert.trainHornTriggered
      };
    });
    console.log('🚂 Train Horn Telemetry:', JSON.stringify(trainResult, null, 2));

    // Capture train landmark view
    await page.screenshot({ path: 'scripts/zone0_jet_and_train.png' });
    console.log('📸 Captured scripts/zone0_jet_and_train.png');

    // 5. Check Console Errors
    if (consoleErrors.length > 0) {
      console.error('❌ Console Errors detected during browser playtest:');
      consoleErrors.forEach(err => console.error('  - ', err));
      throw new Error(`Browser playtest failed with ${consoleErrors.length} console errors.`);
    } else {
      console.log('✅ ZERO console errors during live browser playtest!');
    }

    console.log('🎉 Browser playtest passed completely!');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
    console.log('🛑 Development server stopped.');
  }
}

run().catch(err => {
  console.error('Playtest error:', err);
  process.exit(1);
});
