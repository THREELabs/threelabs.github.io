// Quick smoke test of the deployed Google3D build (mobile + desktop)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = 'https://quick-orbit-hmee.here.now/';
const shots = '/tmp/g3d-deploy';
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--enable-webgl'],
});

for (const [name, opts] of [['desktop', { viewport: { width: 1280, height: 720 } }],
                            ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  const page = await browser.newPage(opts);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: `${shots}/${name}.png` });
  console.log(`${name}: loaded, ${errors.length} errors`);
  errors.slice(0, 3).forEach(e => console.log('  -', e.slice(0, 120)));
  await page.close();
}
await browser.close();
