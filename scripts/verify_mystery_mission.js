import { chromium } from 'playwright-core';

async function run() {
  console.log('🚀 Launching Chrome to test Mystery Crime Scene & GTA Mission...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('  [BROWSER ERROR]', msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error('  [PAGE ERROR]', err.message);
  });

  await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Dismiss start gate / activate audio and game loop
  await page.evaluate(() => {
    window.dispatchEvent(new Event('click'));
  });
  await page.waitForTimeout(1000);

  // Test 1: Check initial mysteryMission state
  const initialMission = await page.evaluate(() => window.game.gameState.mysteryMission);
  console.log('  Initial Mission State:', initialMission.state, 'Total Clues:', initialMission.totalClues);

  // Test 2: Trigger Crime Scene Sequence & Verify Cinematic Letterbox Cutscene
  await page.evaluate(() => {
    window.game.mysteryCrimeScene.triggerCrimeScene();
  });
  await page.waitForTimeout(300);

  const cutsceneActive = await page.evaluate(() => ({
    isCutsceneActive: window.game.gameState.isCutsceneActive,
    cutsceneName: window.game.gameState.cutsceneName,
    overlayHasClass: document.querySelector('#hud-cutscene-overlay')?.classList.contains('active'),
    subtitles: document.querySelector('#cutscene-subtitles-text')?.textContent
  }));
  console.log('  Cutscene Active State:', cutsceneActive);

  // Take screenshot of live letterbox cutscene
  await page.screenshot({ path: 'scripts/evidence_cutscene_letterbox.png' });
  console.log('  📸 Screenshot saved: scripts/evidence_cutscene_letterbox.png');

  // Advance murder cutscene past gunshot into peelout escape
  await page.evaluate(() => {
    window.game.mysteryCrimeScene.update(12.5);
  });
  await page.waitForTimeout(500);

  const afterMurderMission = await page.evaluate(() => window.game.gameState.mysteryMission);
  console.log('  After Murder Mission State:', {
    state: afterMurderMission.state,
    witnessedMurder: afterMurderMission.witnessedMurder
  });

  // End cutscene cleanly
  await page.evaluate(() => {
    window.game.mysteryCrimeScene.skipCutscene();
    window.game.mysteryCrimeScene.update(0.1);
  });
  await page.waitForTimeout(300);

  // Test 3: Open Tablet and switch to Case Files App (all 9 zones)
  await page.evaluate(() => {
    window.game.hud.openTablet('casefiles');
  });
  await page.waitForTimeout(600);

  const casefilesHtml = await page.evaluate(() => {
    const el = document.querySelector('#tab-casefiles-body');
    return el ? el.innerText.slice(0, 250) : null;
  });
  console.log('  Tablet Case Files Content Preview:\n', casefilesHtml);

  await page.screenshot({ path: 'scripts/evidence_tablet_casefiles.png' });
  console.log('  📸 Screenshot saved: scripts/evidence_tablet_casefiles.png');

  // Test 4: Simulate Clue Discovery across multiple zones
  // Zone 0: Mojave (Z=920m)
  await page.evaluate(() => {
    window.game.splineRoad.update(0.016, { x: 103.5, y: 25.5, z: 920.0 });
  });
  // Zone 1: Malibu (Z=2750m)
  await page.evaluate(() => {
    window.game.splineRoad.update(0.016, { x: 13.0, y: 1.85, z: 2750.0 });
  });
  // Zone 2: Big Sur (Z=6400m)
  await page.evaluate(() => {
    window.game.splineRoad.update(0.016, { x: -28.5, y: 12.4, z: 6400.0 });
  });
  // Zone 8: Olympic (Z=22200m)
  await page.evaluate(() => {
    window.game.splineRoad.update(0.016, { x: -28.0, y: 7.5, z: 22200.0 });
  });
  await page.waitForTimeout(300);

  const cluesTelemetry = await page.evaluate(() => ({
    cluesFound: window.game.gameState.mysteryMission.cluesFound,
    zone0: window.game.gameState.mysteryMission.clues.zone0,
    zone1: window.game.gameState.mysteryMission.clues.zone1,
    getawayCar: window.game.gameState.mysteryMission.clues.getawayCar,
    zone2: window.game.gameState.mysteryMission.clues.zone2,
    zone8: window.game.gameState.mysteryMission.clues.zone8,
    score: window.game.gameState.score
  }));
  console.log('  Clues Telemetry:', cluesTelemetry);

  // Test 5: Turn in evidence at Washington Federal Regional HQ (Z=22,800m)
  // First give all 9 clues to test Master Detective reward
  await page.evaluate(() => {
    for (let i = 0; i < 9; i++) {
      window.game.gameState.mysteryMission.clues[`zone${i}`] = true;
    }
    window.game.gameState.mysteryMission.cluesFound = 9;
    window.game.splineRoad.update(0.016, { x: 38.0, y: 3.5, z: 22800.0 });
  });
  await page.waitForTimeout(500);

  const solvedMission = await page.evaluate(() => ({
    state: window.game.gameState.mysteryMission.state,
    reported: window.game.gameState.mysteryMission.reportedToPolice,
    station: window.game.gameState.mysteryMission.reportingStation,
    scoreAwarded: window.game.gameState.mysteryMission.scoreAwarded,
    totalScore: window.game.gameState.score,
    isCutsceneActive: window.game.gameState.isCutsceneActive
  }));
  console.log('  Solved Mission State & Score:', solvedMission);

  // Screenshot during police turn-in cutscene
  await page.screenshot({ path: 'scripts/evidence_police_turnin.png' });
  console.log('  📸 Screenshot saved: scripts/evidence_police_turnin.png');

  // Re-open tablet to inspect updated Case Files dossier showing Master Detective solved badge
  await page.evaluate(() => {
    window.game.mysteryCrimeScene.skipCutscene();
    window.game.hud.openTablet('casefiles');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/evidence_case_solved.png' });
  console.log('  📸 Screenshot saved: scripts/evidence_case_solved.png');

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error('❌ Found console errors:', consoleErrors);
    process.exit(1);
  } else {
    console.log('🎉 Browser Playtest Passed with ZERO console errors!');
  }
}

run().catch(err => {
  console.error('Fatal Playtest Error:', err);
  process.exit(1);
});
