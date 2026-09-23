import { chromium } from 'playwright-core';
import fs from 'fs';

async function test() {
  console.log('🚗 Starting Browser Playtest for Landmark & Zone Pacing...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader'
    ]
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173');
  await page.waitForFunction(() => window.game && window.game.physics && window.game.gameState, { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Click on start screen or dismiss intro
  await page.evaluate(() => {
    if (window.game && window.game.gameState) {
      window.game.gameState.isIntroActive = false;
      const startOverlay = document.getElementById('start-overlay');
      if (startOverlay) startOverlay.style.display = 'none';
    }
  });
  await page.waitForTimeout(1000);

  // Drive forward: hold ArrowUp for 4 seconds
  console.log('🏎️ Accelerating vehicle forward down Highway 1...');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(4000);
  await page.keyboard.up('ArrowUp');

  // Read telemetry from gameState
  const telemetry = await page.evaluate(() => {
    const gs = window.game.gameState;
    const banner = document.getElementById('hud-scenic-waypoint');
    const bannerVisible = banner ? banner.classList.contains('visible') : false;
    const bannerName = document.getElementById('scenic-lot-name')?.textContent || '';
    const bannerSub = document.getElementById('scenic-lot-sub')?.textContent || '';
    const bannerDist = document.getElementById('scenic-lot-dist')?.textContent || '';
    const bannerHint = document.getElementById('scenic-action-hint')?.textContent || '';
    const exitSide = document.getElementById('scenic-exit-side')?.textContent || '';

    return {
      speedMph: gs.speedMph,
      distanceMeters: Math.round(gs.distanceMeters || 0),
      currentZone: gs.currentZoneIndex,
      bannerVisible,
      bannerName,
      bannerSub,
      bannerDist,
      bannerHint,
      exitSide
    };
  });

  console.log('📊 Telemetry Sample 1 (Zone 0 cruising):', telemetry);

  // Screenshot during cruise with advance waypoint alert
  const screenshotPath1 = 'scripts/highway_pacing_cruise.png';
  await page.screenshot({ path: screenshotPath1 });
  console.log(`📸 Saved screenshot: ${screenshotPath1}`);

  // Accelerate further towards Route 66 Diner / Cabazon (warp to 1200m to inspect Cabazon advance corridor)
  console.log('🚀 Checking advance corridor banner at Z=1200m...');
  await page.evaluate(() => {
    if (window.game && window.game.physics) {
      window.game.physics.respawnOnRoad(false, 1200);
      window.game.gameState.distanceMeters = 1200;
      window.game.physics.speed = 25; // ~95 MPH
    }
  });
  await page.waitForTimeout(1500);

  const telemetry2 = await page.evaluate(() => {
    const gs = window.game.gameState;
    const banner = document.getElementById('hud-scenic-waypoint');
    const bannerVisible = banner ? banner.classList.contains('visible') : false;
    const bannerName = document.getElementById('scenic-lot-name')?.textContent || '';
    const bannerSub = document.getElementById('scenic-lot-sub')?.textContent || '';
    const bannerDist = document.getElementById('scenic-lot-dist')?.textContent || '';
    const bannerHint = document.getElementById('scenic-action-hint')?.textContent || '';
    const exitSide = document.getElementById('scenic-exit-side')?.textContent || '';

    return {
      speedMph: gs.speedMph,
      distanceMeters: Math.round(gs.distanceMeters || 0),
      currentZone: gs.currentZoneIndex,
      bannerVisible,
      bannerName,
      bannerSub,
      bannerDist,
      bannerHint,
      exitSide
    };
  });
  console.log('📊 Telemetry Sample 2 (Cabazon corridor advance banner):', telemetry2);

  const screenshotPath2 = 'scripts/cabazon_corridor_advance.png';
  await page.screenshot({ path: screenshotPath2 });
  console.log(`📸 Saved screenshot: ${screenshotPath2}`);

  // Test Santa Monica corridor approach (Z=2200m)
  console.log('🌊 Checking Santa Monica corridor approach at Z=2200m...');
  await page.evaluate(() => {
    if (window.game && window.game.physics) {
      window.game.physics.position.set(0, 0.2, 2200);
      window.game.gameState.distanceMeters = 2200;
      window.game.physics.speed = 28;
    }
  });
  await page.waitForTimeout(1500);

  const telemetry3 = await page.evaluate(() => {
    const gs = window.game.gameState;
    const banner = document.getElementById('hud-scenic-waypoint');
    const bannerVisible = banner ? banner.classList.contains('visible') : false;
    const bannerName = document.getElementById('scenic-lot-name')?.textContent || '';
    const bannerSub = document.getElementById('scenic-lot-sub')?.textContent || '';
    const bannerDist = document.getElementById('scenic-lot-dist')?.textContent || '';
    const bannerHint = document.getElementById('scenic-action-hint')?.textContent || '';
    const exitSide = document.getElementById('scenic-exit-side')?.textContent || '';

    return {
      speedMph: gs.speedMph,
      distanceMeters: Math.round(gs.distanceMeters || 0),
      currentZone: gs.currentZoneIndex,
      bannerVisible,
      bannerName,
      bannerSub,
      bannerDist,
      bannerHint,
      exitSide
    };
  });
  console.log('📊 Telemetry Sample 3 (Santa Monica Pier advance banner):', telemetry3);

  const screenshotPath3 = 'scripts/santa_monica_advance.png';
  await page.screenshot({ path: screenshotPath3 });
  console.log(`📸 Saved screenshot: ${screenshotPath3}`);

  await browser.close();

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  }
  console.log('Zone 0 Corridor Banner Active:', telemetry.bannerVisible, `("${telemetry.bannerName}")`);
  console.log('Cabazon Corridor Banner Active:', telemetry2.bannerVisible, `("${telemetry2.bannerName}")`);
  console.log('Santa Monica Corridor Banner Active:', telemetry3.bannerVisible, `("${telemetry3.bannerName}")`);

  if (consoleErrors.length === 0 && telemetry2.bannerVisible && telemetry3.bannerVisible) {
    console.log('\n🎉 BROWSER PLAYTEST VERIFIED CLEANLY!');
  } else {
    console.error('\n❌ VERIFICATION COMPLETED WITH WARNINGS');
  }
}

test().catch(err => {
  console.error('Fatal Playtest Error:', err);
  process.exit(1);
});
