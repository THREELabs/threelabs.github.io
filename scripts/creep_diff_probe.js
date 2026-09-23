#!/usr/bin/env node
// Flicker ground-truth probe: drive at a CREEP (~2% speed) so legit motion
// is ~3 units/frame (usually sub-pixel), then diff consecutive rendered
// frames. Structural flicker (draw-order fighting, alpha toggling) shows up
// as LARGE alternating diffs at sprite locations even at a creep.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://127.0.0.1:8023';

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.evaluate(() => window.triggerCopTakedownTest());
await page.waitForTimeout(3500);            // countdown -> racing

const report = await page.evaluate(async () => {
  const gs = window.__gameState;
  const { maxSpeed } = await import('/js/constants.js');
  gs.autoPilot = false;
  gs.speed = maxSpeed * 0.02;               // creep: ~3 units/frame
  // settle one second
  await new Promise(r => setTimeout(r, 1000));

  const c = document.getElementById('game');
  const W = c.width, H = c.height;
  const ctx = c.getContext('2d');
  let prev = null;
  const frames = [];
  const snap = () => {
    const d = ctx.getImageData(0, 0, W, H).data;
    let h = 0;
    for (let k = 0; k < d.length; k += 401) h = (h * 31 + d[k]) | 0;
    return { d, h };
  };
  for (let f = 0; f < 40; f++) {
    await new Promise(r => requestAnimationFrame(() => r()));
    // canvas was just painted by the game's own rAF (main.js renders each frame)
    const s = snap();
    if (prev) {
      let diff = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
      const step = 4; // RGBA
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          const i = (y * W + x) * step;
          if (Math.abs(s.d[i] - prev.d[i]) > 12 || Math.abs(s.d[i+1] - prev.d[i+1]) > 12 || Math.abs(s.d[i+2] - prev.d[i+2]) > 12) {
            diff++;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      frames.push({ hash: s.h, diffPx: diff, box: diff ? [minX, minY, maxX, maxY] : null });
    } else {
      frames.push({ hash: s.h, diffPx: null, box: null });
    }
    prev = s;
  }
  return { speed: gs.speed, zone: window.currentZone, weather: gs.weather, frames };
});
await browser.close();

const diffs = report.frames.filter(f => f.diffPx !== null).map(f => f.diffPx);
const big = diffs.filter(d => d > 800);
console.log(`speed=${report.speed.toFixed(0)} zone=${report.zone} weather=${report.weather}`);
console.log(`frames compared: ${diffs.length}, median diff px: ${diffs.sort((a,b)=>a-b)[Math.floor(diffs.length/2)]}, max: ${Math.max(...diffs)}`);
console.log(`frames with >800px change: ${big.length}`);
report.frames.forEach((f, i) => {
  if (f.diffPx !== null && f.diffPx > 300) console.log(`  frame ${i}: ${f.diffPx}px changed, box=${f.box}`);
});
