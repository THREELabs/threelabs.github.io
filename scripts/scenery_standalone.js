#!/usr/bin/env node
/** Render new landmarks standalone from the live SPRITES registry. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const NAMES = ['BOTTLE_TREE_RANCH','ROYS_MOTEL_SIGN','SALVATION_MOUNTAIN','GETTY_VILLA',
  'POINT_MUGU_ROCK','CANNERY_ROW_SIGN','SONOMA_MISSION','CHINA_CAMP_VILLAGE',
  'GOLDEN_GATE_LOOKOUT','CAPE_MEARES_LIGHT','RUBY_BEACH_DRIFTWOOD','PIKE_PLACE_MARKET'];

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto('http://127.0.0.1:8017/index.html?dev=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);

for (const n of NAMES) {
  const dataUrl = await page.evaluate((n) => {
    const s = window.__SPRITES[n];
    if (!s) return null;
    const c = document.createElement('canvas');
    c.width = s.w; c.height = s.h;
    c.getContext('2d').drawImage(s.img, 0, 0);
    return c.toDataURL('image/png');
  }, n);
  if (!dataUrl) { console.log('MISSING:', n); continue; }
  writeFileSync(`/tmp/baja-scenery/art_${n}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('art_' + n + '.png saved');
}
await browser.close();
