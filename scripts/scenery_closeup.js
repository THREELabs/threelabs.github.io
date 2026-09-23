#!/usr/bin/env node
/** Close-up re-shoot for two landmarks that verified low at cruise distance. */
import { chromium } from 'playwright-core';
const BASE = 'http://127.0.0.1:8017';
const SPOTS = [['ROYS_MOTEL_SIGN', 0.099], ['PIKE_PLACE_MARKET', 0.926]];

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto(BASE + '/index.html?dev=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

for (const [name, pct] of SPOTS) {
  for (const back of [8, 4]) {
    await page.evaluate(([pct, back]) => {
      const gs = window.__gameState;
      const seg = Math.floor(gs.segments.length * pct);
      gs.position = (seg - back) * 200;
      gs.speed = 60;
      gs.playerX = -0.2;
    }, [pct, back]);
    await page.waitForTimeout(420);
    await page.screenshot({ path: `/tmp/baja-scenery/close_${name}_${back}.png` });
    console.log(`📸 ${name} from ${back} segments`);
  }
}
await browser.close();
