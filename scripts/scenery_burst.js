#!/usr/bin/env node
/** Drive-by burst: roll through a landmark and snap frames, keep the best. */
import { chromium } from 'playwright-core';
const BASE = 'http://127.0.0.1:8017';

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto(BASE + '/index.html?dev=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

const spots = [
  ['ROYS_MOTEL_SIGN', 0.099],
  ['PIKE_PLACE_MARKET', 0.926],
];

for (const [name, pct] of spots) {
  await page.evaluate(([pct]) => {
    const gs = window.__gameState;
    const seg = Math.floor(gs.segments.length * pct);
    gs.position = (seg - 16) * 200;
    gs.speed = 2600;              // real cruise speed so we approach naturally
    gs.state = 'racing';
    window.__burstSeg = seg;
  }, [pct]);
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(130);
    const dist = await page.evaluate(() => {
      const gs = window.__gameState;
      return Math.round((window.__burstSeg * 200 - gs.position) / 200);
    });
    await page.screenshot({ path: `/tmp/baja-scenery/burst_${name}_${i}_d${dist}.png` });
    console.log(`${name} frame ${i} (${dist} segs out)`);
    if (dist < -3) break;
  }
}
await browser.close();
