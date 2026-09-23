#!/usr/bin/env node
/**
 * Scenery-updates visual verification.
 * Boots the real game in headless Chrome, teleports through every region and
 * screenshots each new landmark from the scenery-updates branch.
 *
 * Usage: node scripts/scenery_screenshot.js [baseURL]
 */
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://127.0.0.1:8017';
const OUT = '/tmp/baja-scenery';

// landmark name -> track pct (must mirror js/constants.js ZONE_LANDMARKS)
const SPOTS = [
  ['BOTTLE_TREE_RANCH',   0.028],
  ['ROYS_MOTEL_SIGN',     0.099],
  ['SALVATION_MOUNTAIN',  0.114],
  ['GETTY_VILLA',         0.1465],
  ['POINT_MUGU_ROCK',     0.163],
  ['CANNERY_ROW_SIGN',    0.442],
  ['SONOMA_MISSION',      0.538],
  ['CHINA_CAMP_VILLAGE',  0.569],
  ['GOLDEN_GATE_LOOKOUT', 0.585],
  ['CAPE_MEARES_LIGHT',   0.777],
  ['RUBY_BEACH_DRIFTWOOD',0.882],
  ['PIKE_PLACE_MARKET',   0.926],
];

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(BASE + '/index.html?dev=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

let ok = 0, bad = [];
for (const [name, pct] of SPOTS) {
  try {
    const r = await page.evaluate(([name, pct]) => {
      const gs = window.__gameState;
      const seg = Math.floor(gs.segments.length * pct);
      gs.position = (seg - 14) * 200;                 // stop ~14 segments before
      gs.speed = 120;                                 // slow cruise
      gs.playerX = (name === 'GOLDEN_GATE_TOWER') ? -0.5 : 0.35; // lean toward the sight line
      return { total: gs.segments.length, seg };
    }, [name, pct]);
    await page.waitForTimeout(420);                   // let a few frames render
    await page.screenshot({ path: `${OUT}/${String(SPOTS.findIndex(s => s[0] === name)).padStart(2, '0')}_${name}.png` });
    console.log(`  📸 ${name} @ seg ${r.seg}/${r.total}`);
    ok++;
  } catch (e) {
    console.error(`  ❌ ${name}: ${e.message}`);
    bad.push(name);
  }
}

console.log(`\n${ok}/${SPOTS.length} screenshots captured`);
if (errors.length) console.log('Console errors:', errors.slice(0, 5).join(' | '));
await browser.close();
process.exit(bad.length ? 1 : 0);
