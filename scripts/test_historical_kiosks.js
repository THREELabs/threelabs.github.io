#!/usr/bin/env node
import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import { mkdirSync } from 'fs';

const shots = '/tmp/historical-kiosk-test';
mkdirSync(shots, { recursive: true });

console.log('🚀 Starting Vite preview server...');
const server = spawn('node', ['./node_modules/vite/bin/vite.js', '--port', '8099'], {
  cwd: process.cwd(),
  env: { ...process.env, PATH: `/home/kevin/.local/bin:${process.env.PATH}` }
});

let serverReady = false;
server.stdout.on('data', data => {
  const str = data.toString();
  if (str.includes('http://localhost:8099/') || str.includes('Local:')) {
    serverReady = true;
  }
});
server.stderr.on('data', data => console.error('Server err:', data.toString()));

// Wait for server
for (let i = 0; i < 30; i++) {
  if (serverReady) break;
  await new Promise(r => setTimeout(r, 200));
}

console.log('🌐 Launching Headless Chrome with Playwright...');
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--enable-webgl']
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
page.on('console', m => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

let passed = 0;
let failed = 0;
function test(name, cond, extra) {
  if (cond) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${name}${extra ? ' — ' + extra : ''}`);
  }
}

try {
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Check Console Errors
  test('Game loads with 0 console errors', consoleErrors.length === 0, consoleErrors.join(' | '));

  // 2. Check Historical Plaques Registry
  const plaquesCount = await page.evaluate(() => {
    return window.game && window.game.splineRoad && window.game.splineRoad.historicalPlaques
      ? window.game.splineRoad.historicalPlaques.length
      : 0;
  });
  test('All 40+ historical kiosks registered in splineRoad', plaquesCount >= 40, `count=${plaquesCount}`);

  // 3. Check Awakening / Start Screen and Dismiss
  await page.evaluate(() => {
    const startBtn = document.getElementById('start-awaken-btn');
    if (startBtn) startBtn.click();
  });
  await page.waitForTimeout(1500);

  // 4. Warp Player near first turnout: Elmer's Bottle Tree Ranch (z=350, x=-24)
  const proximityBefore = await page.evaluate(() => {
    window.game.physics.position.set(-24, 0.2, 350);
    window.game.sportsCar.group.position.copy(window.game.physics.position);
    window.game.splineRoad.update(1/60, window.game.physics.position);
    window.game.hud.update(window.game.physics, window.game.splineRoad, 1/60);
    return {
      nearby: window.game.gameState.nearbyHistoryPlaque,
      promptPillVisible: document.getElementById('hud-history-prompt-pill')?.classList.contains('visible')
    };
  });
  test('Nearby historical plaque detected at turnout (z=350)', !!proximityBefore.nearby && proximityBefore.nearby.id === 'turnout_bottle_tree', JSON.stringify(proximityBefore));
  test('History prompt pill appears on screen', proximityBefore.promptPillVisible === true);

  await page.screenshot({ path: `${shots}/01_turnout_kiosk_world.png` });

  // 5. Test pressing [E] to open Heritage Archive Modal
  const modalOpened = await page.evaluate(() => {
    window.game.hud.openHistoryModal('turnout_bottle_tree');
    const modal = document.getElementById('hud-history-modal');
    return {
      isOpen: modal?.classList.contains('open'),
      isReading: window.game.gameState.isReadingHistory,
      title: document.getElementById('history-modal-title')?.textContent,
      sub: document.getElementById('history-modal-sub')?.textContent,
      yearEst: document.getElementById('history-year-est')?.textContent,
      coords: document.getElementById('history-coords')?.textContent,
      loreLength: document.getElementById('history-lore-text')?.textContent?.length,
      fastFact: document.getElementById('history-fast-fact-body')?.textContent
    };
  });
  test('Heritage modal opens with correct Elmer\'s Bottle Tree Ranch content', modalOpened.isOpen && modalOpened.title?.includes("Bottle Tree"), JSON.stringify(modalOpened));
  test('Heritage modal contains detailed historical lore and fast facts', (modalOpened.loreLength || 0) > 200 && (modalOpened.fastFact?.length || 0) > 20);

  await page.screenshot({ path: `${shots}/02_heritage_archive_modal_open.png` });

  // 6. Test Closing the Modal
  const modalClosed = await page.evaluate(() => {
    window.game.hud.closeHistoryModal();
    const modal = document.getElementById('hud-history-modal');
    return {
      isOpen: modal?.classList.contains('open'),
      isReading: window.game.gameState.isReadingHistory
    };
  });
  test('Heritage modal closes cleanly and isReadingHistory resets', !modalClosed.isOpen && !modalClosed.isReading);

  // 7. Test Discovery Tracker in Big Sur (Bixby Bridge)
  const bixbyDiscovery = await page.evaluate(() => {
    window.game.physics.position.set(-28, 36.2, 6650);
    window.game.splineRoad.update(1/60, window.game.physics.position);
    window.game.hud.openHistoryModal('turnout_bixby_bridge');
    return {
      bixbyDiscovered: window.game.gameState.discoveredHistoryPlaques.has('turnout_bixby_bridge'),
      totalDiscovered: window.game.gameState.discoveredHistoryPlaques.size,
      bixbyTitle: document.getElementById('history-modal-title')?.textContent,
      bixbyYear: document.getElementById('history-year-est')?.textContent
    };
  });
  test('Bixby Creek Bridge historical archive discovered and recorded in state', bixbyDiscovery.bixbyDiscovered && bixbyDiscovery.totalDiscovered >= 2, JSON.stringify(bixbyDiscovery));

  await page.screenshot({ path: `${shots}/03_bixby_bridge_history_modal.png` });

  console.log(`\n🏁 Test Results: ${passed} passed, ${failed} failed`);
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
