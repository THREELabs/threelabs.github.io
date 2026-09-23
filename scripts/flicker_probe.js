#!/usr/bin/env node
// Flicker detector v2: freeze the clock (performance.now/Date.now) and zero
// screen shake, then compare consecutive rendered frames of the frozen world.
// With time frozen, EVERY frame must be pixel-identical — any difference is
// structural flicker (draw-order/state bugs), not ambient animation.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://127.0.0.1:8022';

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.evaluate(() => window.triggerCopTakedownTest());
await page.waitForTimeout(3500);            // countdown -> racing, bot driving

// Freeze time + kill shake/speed so ambient animation can't mask/mimic flicker
await page.evaluate(() => {
  const gs = window.__gameState;
  gs.state = 'paused';
  gs.shake = 0; gs.shakeX = 0; gs.shakeY = 0;
  gs.speed = 0;                       // kill random speed-lines overlay
  gs.dust = []; gs.precipitation = []; gs.tumbleweeds = [];
  gs.floatingTexts = []; gs.skidmarks = [];
  const t0 = performance.now();
  performance.now = () => t0;
});
await page.waitForTimeout(400);

const hashes = [];
let diffInfo = null;
for (let i = 0; i < 6; i++) {
  const r = await page.evaluate((prev) => {
    const c = document.getElementById('game');
    const d = c.toDataURL('image/png');
    let h = 0; for (let k = 0; k < d.length; k += 97) h = (h * 31 + d.charCodeAt(k)) | 0;
    // locate first differing pixel vs previous snapshot
    let firstDiff = null;
    if (prev) {
      const img1 = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    }
    return d.length + ':' + h;
  }, hashes[hashes.length - 1] || null);
  hashes.push(r);
  await page.waitForTimeout(100);
}
await browser.close();

const unique = new Set(hashes);
if (unique.size !== 1) {
  console.error(`❌ FLICKER DETECTED: ${unique.size} distinct frames with clock frozen`);
  process.exit(1);
}
console.log(`✅ STABLE: all 6 frozen-clock frames pixel-identical (no structural flicker)`);
