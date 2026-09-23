import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  console.log('🚀 Starting Vite dev server on port 5177...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5177', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  let browser;
  try {
    const chromePath = fs.existsSync('/usr/bin/google-chrome')
      ? '/usr/bin/google-chrome'
      : '/home/kevin/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

    console.log(`🌐 Launching Chrome (${chromePath})...`);
    browser = await chromium.launch({
      executablePath: chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
        consoleErrors.push(msg.text());
      }
    });

    console.log('🏎️ Session 1: Navigating to game...');
    await page.goto('http://localhost:5177', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Dismiss start screen
    try {
      await page.click('#start-awaken-screen', { timeout: 1500 });
    } catch (e) {}
    await page.waitForTimeout(1000);

    console.log('⚡ Session 1: Warping to Zone 2 (Big Sur, Z=5400m) and accumulating state...');
    const stateBefore = await page.evaluate(() => {
      if (window.__THREE_GAME_TEST_HOOKS__) {
        window.__THREE_GAME_TEST_HOOKS__.teleportToZone(2);
      }
      window.game.gameState.score = 4200;
      window.game.gameState.route66ShieldsCollected = 3;
      window.game.gameState.discoveredLandmarks.add('bixby_bridge');
      window.game.gameState.mysteryMission.cluesFound = 2;
      window.game.gameState.mysteryMission.clues.zone0 = true;
      window.game.gameState.mysteryMission.clues.zone1 = true;
      window.game.saveManager.save(true);

      return {
        zone: window.game.gameState.currentZoneIndex,
        z: window.game.physics.position.z,
        score: window.game.gameState.score,
        hasSave: window.game.saveManager.hasSave(),
        rawLocal: localStorage.getItem('baja_racer_save_v1')
      };
    });

    console.log('💾 Session 1 state saved:', {
      zone: stateBefore.zone,
      z: Math.round(stateBefore.z),
      score: stateBefore.score,
      hasSave: stateBefore.hasSave
    });

    if (!stateBefore.hasSave || !stateBefore.rawLocal) {
      throw new Error('localStorage did not receive save data!');
    }

    // Open tablet and inspect Save & Progress app
    console.log('📱 Opening tablet and navigating to Save & Progress app...');
    await page.click('#hud-tablet-btn');
    await page.waitForTimeout(600);

    await page.click('[data-open-app="savegame"]');
    await page.waitForTimeout(600);

    await page.screenshot({ path: 'scripts/tablet_savegame_app.png' });
    console.log('📸 Captured tablet Save & Progress view: scripts/tablet_savegame_app.png');

    // Close tablet
    await page.click('#tablet-home-bar');
    await page.waitForTimeout(400);

    // Session 2: Reload the page to simulate leaving and coming back!
    console.log('🔄 Session 2: Reloading browser page to test auto-resume...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Dismiss start gate if audio gate appears
    try {
      await page.click('#start-awaken-screen', { timeout: 1000 });
    } catch (e) {}
    await page.waitForTimeout(1000);

    const resumedState = await page.evaluate(() => {
      return {
        zone: window.game.gameState.currentZoneIndex,
        z: window.game.physics.position.z,
        score: window.game.gameState.score,
        shields: window.game.gameState.route66ShieldsCollected,
        clues: window.game.gameState.mysteryMission ? window.game.gameState.mysteryMission.cluesFound : 0,
        isIntroActive: window.game.gameState.isIntroActive,
        introState: window.game.gameState.introState
      };
    });

    console.log('✨ Session 2 resumed state:', resumedState);

    if (resumedState.zone !== 2) {
      throw new Error(`Expected resumed zone 2, got ${resumedState.zone}`);
    }
    if (resumedState.z < 5000) {
      throw new Error(`Expected vehicle Z >= 5000m, got ${resumedState.z}`);
    }
    if (resumedState.score !== 4200) {
      throw new Error(`Expected resumed score 4200, got ${resumedState.score}`);
    }
    if (resumedState.shields !== 3) {
      throw new Error(`Expected 3 Route 66 shields, got ${resumedState.shields}`);
    }
    if (resumedState.clues !== 2) {
      throw new Error(`Expected 2 mystery clues, got ${resumedState.clues}`);
    }
    if (resumedState.isIntroActive !== false) {
      throw new Error('Intro should not be active for resumed run');
    }

    await page.screenshot({ path: 'scripts/resumed_gameplay_road.png' });
    console.log('📸 Captured resumed gameplay on Highway 1: scripts/resumed_gameplay_road.png');

    console.log(`✅ All browser save/load assertions passed with ${consoleErrors.length} console errors!`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🛑 Browser closed.');
    }
    server.kill();
    console.log('🛑 Dev server terminated.');
  }
}

run().catch(err => {
  console.error('❌ Playtest failed:', err);
  process.exit(1);
});
