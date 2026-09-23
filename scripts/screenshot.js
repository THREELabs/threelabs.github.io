#!/usr/bin/env node
// Capture title-screen + mid-race screenshots for visual verification.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://127.0.0.1:8017';

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/baja_title.png' });

await page.evaluate(() => window.triggerCopTakedownTest());
await page.waitForTimeout(3500); // countdown -> racing, autopilot driving
await page.screenshot({ path: '/tmp/baja_racing.png' });
console.log('screenshots saved');
await browser.close();
