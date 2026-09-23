#!/usr/bin/env node
/** Final close-range pass: teleport to N-3 segments for every new landmark. */
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://127.0.0.1:8017';
const SPOTS = [
  ['BOTTLE_TREE_RANCH',   0.028],
  ['ROYS_MOTEL_SIGN',     0.109],
  ['SALVATION_MOUNTAIN',  0.114],
  ['GETTY_VILLA',         0.1465],
  ['POINT_MUGU_ROCK',     0.163],
  ['CANNERY_ROW_SIGN',    0.442],
  ['SONOMA_MISSION',      0.538],
  ['CHINA_CAMP_VILLAGE',  0.569],
  ['GOLDEN_GATE_LOOKOUT', 0.585],
  ['CAPE_MEARES_LIGHT',   0.777],
  ['RUBY_BEACH_DRIFTWOOD',0.882],
  ['PIKE_PLACE_MARKET',   0.926, 6],
];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto(BASE + '/index.html?dev=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
for (const [name, pct] of SPOTS) {
  await page.evaluate(([pct, back]) => {
    const gs = window.__gameState;
    const seg = Math.floor(gs.segments.length * pct);
    gs.position = Math.max(0, (seg - (back || 3))) * 200;
    gs.speed = 0;
    gs.playerX = 0;
    gs.gameTime = 135;   // pin to midday (gameTime%180==135 => darkness t=0)
  }, [pct]);
  await page.waitForTimeout(420);
  await page.screenshot({ path: `/tmp/baja-scenery/final_${name}.png` });
  console.log('📸 final_' + name);
}
await browser.close();
