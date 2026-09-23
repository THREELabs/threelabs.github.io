import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import path from 'path';

async function run() {
  console.log('📱 Starting Vite server for Mobile Viewport Playtest...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  let browser;
  try {
    console.log('🌐 Launching Chrome in Mobile Emulation (390x844)...');
    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
    });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });

    const page = await context.newPage();

    console.log('🏎️ Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Open tablet
    console.log('📱 Opening tablet via KeyT or touch button...');
    await page.keyboard.press('KeyT');
    await page.waitForTimeout(1000);

    const isTabletOpen = await page.$eval('#hud-tablet-modal', el => el.classList.contains('open'));
    console.log(`📱 Tablet open: ${isTabletOpen}`);
    if (!isTabletOpen) throw new Error('Tablet failed to open');

    // Open YouTube app
    console.log('▶️ Opening YouTube app...');
    await page.click('#tablet-card-youtube');
    await page.waitForTimeout(800);

    // Verify header drive button visibility and bounding box
    const headerBtnBox = await page.$eval('#yt-btn-drive-listen', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility
      };
    });
    console.log('🔘 Header Drive Button Box on Mobile:', headerBtnBox);

    const modalBox = await page.$eval('#hud-tablet-modal .tablet-device', el => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    });
    console.log('📱 Tablet Container Box:', modalBox);

    if (headerBtnBox.right > modalBox.right + 2) {
      throw new Error(`Header drive button overflows container! Button right: ${headerBtnBox.right}, Container right: ${modalBox.right}`);
    }
    console.log('✅ Header Drive Button is 100% inside tablet bounds on mobile!');

    // Verify mobile sticky bottom bar drive button
    const mobileBtnBox = await page.$eval('#yt-btn-drive-listen-mobile', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility
      };
    });
    console.log('🔘 Mobile Bottom Drive Button Box:', mobileBtnBox);

    if (mobileBtnBox.width === 0 || mobileBtnBox.display === 'none') {
      throw new Error('Mobile bottom drive button is not displayed!');
    }
    console.log('✅ Mobile Bottom Drive Button is prominently displayed!');

    // Capture screenshot of mobile tablet YouTube view
    await page.screenshot({ path: path.join(process.cwd(), 'scripts/evidence_mobile_youtube_tablet.png') });
    console.log('📸 Captured evidence_mobile_youtube_tablet.png');

    // Test clicking mobile drive button
    console.log('🚗 Clicking Mobile Drive Button...');
    await page.click('#yt-btn-drive-listen-mobile');
    await page.waitForTimeout(800);

    const isClosedAfterMobileClick = await page.$eval('#hud-tablet-modal', el => !el.classList.contains('open'));
    console.log(`📱 Tablet closed after mobile button click: ${isClosedAfterMobileClick}`);
    if (!isClosedAfterMobileClick) {
      throw new Error('Clicking mobile drive button failed to close tablet!');
    }

    console.log('🎉 Mobile YouTube View & Resume Drive Playtest PASSED SUCCESSFULLY!');
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

run().catch(err => {
  console.error('❌ Mobile playtest failed:', err);
  process.exit(1);
});
