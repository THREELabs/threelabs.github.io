const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.goto('http://127.0.0.1:8031/index.html');
  await page.waitForTimeout(4000);
  // start race (any key)
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/kevin/hermes-agent/projects/THREELabs-Baja-Racer/road_edits_menu.png' });
  // drive through several zones: hold gas ~40s
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(20000);
  await page.screenshot({ path: '/home/kevin/hermes-agent/projects/THREELabs-Baja-Racer/road_edits_mid.png' });
  await page.waitForTimeout(15000);
  await page.keyboard.up('ArrowUp');
  await page.screenshot({ path: '/home/kevin/hermes-agent/projects/THREELabs-Baja-Racer/road_edits_late.png' });
  console.log(JSON.stringify({ errors: errors.slice(0, 10) }));
  await browser.close();
})();
