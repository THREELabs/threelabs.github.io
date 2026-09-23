// The dome DOES render blue when alone! So the gray was clouds covering the sky.
// 24 cloud clusters with big dodecahedron puffs at y=180-270 — the camera looks up
// through cloud undersides. Fix: raise clouds higher, make them sparser, and add a
// subtle horizon fade. Also the dome gradient needs more contrast.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-gl=angle','--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5174/', { waitUntil: 'load' });
await page.waitForTimeout(10000);
// Hide ONLY clouds (the 218-child group) to confirm
await page.evaluate(() => {
  const g = window.game;
  g.renderer.scene.children.forEach(o => {
    if (o.isGroup && o.children.length === 218) o.visible = false;
  });
});
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/no_clouds.png' });
console.log('clouds hidden');
await browser.close();
