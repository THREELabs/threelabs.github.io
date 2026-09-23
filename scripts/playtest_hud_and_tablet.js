import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for updated HUD & Tablet playtest...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5175', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('🌐 Launching Chrome in Mobile / Touch viewport...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  // Mobile viewport test first
  const mobileContext = await browser.newContext({
    viewport: { width: 844, height: 390 }, // iPhone landscape
    hasTouch: true,
    isMobile: true
  });
  const page = await mobileContext.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  console.log('🏎️ Navigating mobile page...');
  await page.goto('http://localhost:5175');
  await page.waitForTimeout(2000);

  // Dismiss start screen if present
  try {
    await page.click('#start-awaken-screen', { timeout: 1000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  // Take mobile driving HUD screenshot (showing pedals on right, speedometer top-left, clean road)
  await page.screenshot({ path: 'scripts/mobile_driving_hud.png' });
  console.log('📸 Captured mobile driving HUD: scripts/mobile_driving_hud.png');

  // Open tablet
  await page.click('#hud-tablet-btn');
  await page.waitForTimeout(800);

  // Open Milestones App
  await page.click('[data-open-app="milestones"]');
  await page.waitForTimeout(800);

  // Take screenshot of new Milestones & Live GPS Map app on tablet
  await page.screenshot({ path: 'scripts/tablet_milestones_gps_app.png' });
  console.log('📸 Captured tablet Milestones & GPS app: scripts/tablet_milestones_gps_app.png');

  // Go back to home and open Zone Skipper Dev App
  await page.click('[data-back-home="true"]');
  await page.waitForTimeout(500);
  await page.click('[data-open-app="zones"]');
  await page.waitForTimeout(500);

  // Take screenshot of Zone Skipper Dev App
  await page.screenshot({ path: 'scripts/tablet_zone_skipper_dev_app.png' });
  console.log('📸 Captured tablet Zone Skipper Dev app: scripts/tablet_zone_skipper_dev_app.png');

  await browser.close();
  server.kill();

  if (consoleErrors.length > 0) {
    console.error(`💥 Failed with ${consoleErrors.length} errors.`);
    process.exit(1);
  } else {
    console.log('🎉 PLAYTEST COMPLETED WITH ZERO ERRORS!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal Playtest Error:', err);
  process.exit(1);
});
