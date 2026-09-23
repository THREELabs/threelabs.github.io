import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5176', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await desktopContext.newPage();

  await page.goto('http://localhost:5176');
  await page.waitForTimeout(2000);

  // Dismiss start screen if present
  try {
    await page.click('#start-awaken-screen', { timeout: 1000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  // Take desktop driving HUD screenshot
  await page.screenshot({ path: 'scripts/desktop_driving_hud.png' });

  // Open tablet
  await page.click('#hud-tablet-btn');
  await page.waitForTimeout(800);

  // Open Milestones App
  await page.click('[data-open-app="milestones"]');
  await page.waitForTimeout(800);

  // Take desktop tablet milestones screenshot
  await page.screenshot({ path: 'scripts/desktop_tablet_milestones_gps.png' });

  await browser.close();
  server.kill();
  console.log('🎉 Desktop captures saved!');
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
