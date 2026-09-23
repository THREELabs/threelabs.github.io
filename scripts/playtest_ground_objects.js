import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for object grounding playtest...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5174', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('🌐 Launching Chrome...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Browser Console Error: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  console.log('🏎️ Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  // Dismiss start awaken screen if present
  try {
    await page.click('#start-awaken-screen', { timeout: 1000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  // Capture initial desert road screenshot with cacti
  await page.screenshot({ path: 'scripts/grounding_desert_start.png' });
  console.log('📸 Captured desert start view: scripts/grounding_desert_start.png');

  // Drive forward a bit to inspect different dunes and roadside objects
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(3000);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'scripts/grounding_desert_drive.png' });
  console.log('📸 Captured desert drive view: scripts/grounding_desert_drive.png');

  await browser.close();
  server.kill();

  if (consoleErrors.length > 0) {
    console.error(`💥 Failed with ${consoleErrors.length} console errors.`);
    process.exit(1);
  } else {
    console.log('🎉 GROUNDING VERIFICATION PASSED WITH ZERO CONSOLE ERRORS!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal Grounding Playtest Error:', err);
  process.exit(1);
});
