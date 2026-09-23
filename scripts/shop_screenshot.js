#!/usr/bin/env node
// Visual check: render the REPAIR-O-RAMA shop sprite and a drive-by scene.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://127.0.0.1:8021';

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);

// Teleport the camera just before the shop so it's on-screen, then screenshot
await page.evaluate(() => window.triggerCopTakedownTest());
await page.waitForTimeout(800);
await page.evaluate(async () => {
  const gs = window.__gameState;
  const c = await import('/js/constants.js');
  const N = gs.segments.length;
  const shopSeg = Math.floor(N * 0.075);
  // 25 segments before the shop — building large in view
  gs.position = ((shopSeg - 25) * 200 - c.playerZ + gs.trackLength * 2) % gs.trackLength;
  gs.speed = 400;
});
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/repair_shop_driveby.png' });

// Farther out — sign visible down the road
await page.evaluate(async () => {
  const gs = window.__gameState;
  const c = await import('/js/constants.js');
  const N = gs.segments.length;
  const shopSeg = Math.floor(N * 0.075);
  gs.position = ((shopSeg - 90) * 200 - c.playerZ + gs.trackLength * 2) % gs.trackLength;
});
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/repair_shop_distant.png' });
console.log('saved /tmp/repair_shop_driveby.png and /tmp/repair_shop_distant.png');
await browser.close();
