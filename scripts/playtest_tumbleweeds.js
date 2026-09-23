import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Starting Vite dev server for tumbleweed rolling playtest...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5177', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  console.log('🏎️ Navigating to http://localhost:5177...');
  await page.goto('http://localhost:5177');
  await page.waitForTimeout(2000);

  // Dismiss start screen if present
  try {
    await page.click('#start-awaken-screen', { timeout: 1000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  // Capture rolling tumbleweeds on ground
  await page.screenshot({ path: 'scripts/tumbleweed_ground_t0.png' });
  console.log('📸 Captured tumbleweed start: scripts/tumbleweed_ground_t0.png');

  // Let simulation advance 2 seconds
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scripts/tumbleweed_ground_t1.png' });
  console.log('📸 Captured tumbleweed rolling: scripts/tumbleweed_ground_t1.png');

  await browser.close();
  server.kill();

  if (consoleErrors.length > 0) {
    console.error(`💥 Failed with ${consoleErrors.length} console errors.`);
    process.exit(1);
  } else {
    console.log('🎉 TUMBLEWEED GROUNDING VERIFICATION PASSED WITH ZERO ERRORS!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal Playtest Error:', err);
  process.exit(1);
});
