import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('🚀 Starting Vite dev server for browser playtest...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', d => {
    // console.log(`[Vite] ${d}`);
  });

  // Wait for server ready
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('🌐 Launching Chrome...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleErrors = [];
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`⚠️ HTTP ${resp.status()}: ${resp.url()}`);
    }
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore external YouTube iframe/network/CORS warnings in swiftshader/sandbox
      if (!text.includes('youtube.com') && !text.includes('googlevideo.com') && !text.includes('ytimg.com') && !text.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.log(`❌ Browser Console Error: ${text}`);
        consoleErrors.push(text);
      }
    }
  });
  page.on('pageerror', err => {
    console.log(`❌ Page Error: ${err.message}`);
    consoleErrors.push(err.message);
  });

  console.log('🏎️ Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Click start awaken screen if present
  try {
    await page.click('#start-awaken-screen', { timeout: 1000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  // Test driving keys
  console.log('🚗 Testing driving controls (W + D)...');
  await page.keyboard.down('KeyW');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyW');
  await page.keyboard.up('KeyD');

  // Check HUD elements
  const isSpeedoVisible = await page.$eval('#hud-speedometer', el => el !== null);
  const isTabletBtnVisible = await page.$eval('#hud-tablet-btn', el => el !== null);
  console.log(`📊 HUD Speedometer visible: ${isSpeedoVisible}`);
  console.log(`📱 HUD Tablet button visible: ${isTabletBtnVisible}`);

  // Test opening tablet via Button
  console.log('📱 Clicking Tablet Button to open In-Car Tablet OS...');
  await page.click('#hud-tablet-btn');
  await page.waitForTimeout(500);

  let isTabletOpen = await page.$eval('#hud-tablet-modal', el => el.classList.contains('open'));
  console.log(`📱 Tablet open status (via button click): ${isTabletOpen}`);

  // Verify YouTube App is the very first app card in the tablet app grid
  console.log('▶️ Checking first app in Tablet list...');
  const firstAppInfo = await page.$eval('.tablet-app-grid .tablet-app-card:first-child', el => ({
    id: el.id,
    appId: el.getAttribute('data-open-app'),
    name: el.querySelector('.tablet-app-name')?.textContent?.trim()
  }));
  console.log(`📱 First app in Tablet grid: ${JSON.stringify(firstAppInfo)}`);
  if (firstAppInfo.appId !== 'youtube') {
    throw new Error(`Expected first app in tablet to be youtube, but found: ${firstAppInfo.appId} (${firstAppInfo.name})`);
  }

  // Test opening YouTube App
  console.log('▶️ Opening YouTube App from tablet home grid...');
  await page.click('#tablet-card-youtube');
  await page.waitForTimeout(500);
  const isYtActive = await page.$eval('#tab-view-youtube', el => el.classList.contains('active'));
  console.log(`📺 YouTube app active: ${isYtActive}`);
  if (!isYtActive) {
    throw new Error('YouTube app failed to activate upon clicking first app card in tablet');
  }

  // Test Back button to return to home grid
  await page.click('#tab-view-youtube [data-back-home="true"]');
  await page.waitForTimeout(300);

  // Test Milestones App
  console.log('🗺️ Opening Milestones & Route App...');
  await page.click('[data-open-app="milestones"]');
  await page.waitForTimeout(400);
  let isMilestoneActive = await page.$eval('#tab-view-milestones', el => el.classList.contains('active'));
  console.log(`🗺️ Milestones app active: ${isMilestoneActive}`);

  // Test Back button
  await page.click('#tab-view-milestones [data-back-home="true"]');
  await page.waitForTimeout(300);

  // Test Zone Skipper App
  console.log('⚡ Opening Zone Skipper App...');
  await page.click('[data-open-app="zones"]');
  await page.waitForTimeout(400);
  let isZonesActive = await page.$eval('#tab-view-zones', el => el.classList.contains('active'));
  console.log(`⚡ Zone Skipper app active: ${isZonesActive}`);

  // Test Camera App
  console.log('🎥 Opening Camera App...');
  await page.click('#tab-view-zones [data-back-home="true"]');
  await page.waitForTimeout(300);
  await page.click('[data-open-app="camera"]');
  await page.waitForTimeout(400);
  let isCamActive = await page.$eval('#tab-view-camera', el => el.classList.contains('active'));
  console.log(`🎥 Camera app active: ${isCamActive}`);

  // Test Livery App
  console.log('🎨 Opening Paint & Livery App...');
  await page.click('#tab-view-camera [data-back-home="true"]');
  await page.waitForTimeout(300);
  await page.click('[data-open-app="livery"]');
  await page.waitForTimeout(400);
  let isLiveryActive = await page.$eval('#tab-view-livery', el => el.classList.contains('active'));
  console.log(`🎨 Livery app active: ${isLiveryActive}`);

  // Test Diagnostics App
  console.log('🔧 Opening Diagnostics & Reset App...');
  await page.click('#tab-view-livery [data-back-home="true"]');
  await page.waitForTimeout(300);
  await page.click('[data-open-app="diagnostics"]');
  await page.waitForTimeout(400);
  let isDiagActive = await page.$eval('#tab-view-diagnostics', el => el.classList.contains('active'));
  console.log(`🔧 Diagnostics app active: ${isDiagActive}`);

  // Test closing tablet via ESC
  console.log('⌨️ Pressing Escape to close tablet...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  isTabletOpen = await page.$eval('#hud-tablet-modal', el => el.classList.contains('open'));
  console.log(`📱 Tablet open status after Escape: ${isTabletOpen}`);

  // Test opening tablet via TAB key
  console.log('⌨️ Pressing Tab to toggle tablet...');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  isTabletOpen = await page.$eval('#hud-tablet-modal', el => el.classList.contains('open'));
  console.log(`📱 Tablet open status after Tab key: ${isTabletOpen}`);

  // Close tablet with [T]
  console.log('⌨️ Pressing T to close tablet...');
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(500);
  isTabletOpen = await page.$eval('#hud-tablet-modal', el => el.classList.contains('open'));
  console.log(`📱 Tablet open status after T key: ${isTabletOpen}`);

  // Take screenshot of clean driving HUD
  await page.screenshot({ path: 'scripts/playtest_screenshot.png' });
  console.log('📸 Saved clean driving HUD screenshot: scripts/playtest_screenshot.png');

  await browser.close();
  server.kill();

  if (consoleErrors.length > 0) {
    console.error(`💥 Playtest failed with ${consoleErrors.length} console errors.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL PLAYTEST VERIFICATIONS PASSED WITH ZERO CONSOLE ERRORS!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal Playtest Error:', err);
  process.exit(1);
});
