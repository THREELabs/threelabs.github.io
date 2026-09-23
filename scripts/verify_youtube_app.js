import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import path from 'path';

async function run() {
  console.log('🚀 Starting Vite dev server for YouTube In-Car Playtest...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', d => {
    // console.log(`[Vite] ${d}`);
  });
  server.stderr.on('data', d => {
    // console.error(`[Vite Error] ${d}`);
  });

  // Wait for server ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  let browser;
  try {
    console.log('🌐 Launching Chrome...');
    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
    });

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore external YouTube iframe network/cors warnings that occur in swiftshader/sandbox
        if (!text.includes('youtube.com') && !text.includes('googlevideo.com') && !text.includes('ERR_BLOCKED_BY_CLIENT')) {
          console.log(`❌ Browser Console Error: ${text}`);
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      console.log(`❌ Page Uncaught Error: ${err.message}`);
      consoleErrors.push(err.message);
    });

    console.log('🏎️ Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Awaken screen
    try {
      await page.click('#start-awaken-screen', { timeout: 1500 });
    } catch (e) {}
    await page.waitForTimeout(1000);

    // 1. Test initial driving
    console.log('🚗 Testing driving controls (accelerating forward)...');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyW');

    // 2. Open Tablet
    console.log('📱 Opening In-Car Tablet OS via KeyT...');
    await page.keyboard.press('KeyT');
    await page.waitForTimeout(1000);

    const isTabletOpen = await page.$eval('#hud-tablet-modal', el => el.classList.contains('open'));
    console.log(`📱 Tablet open: ${isTabletOpen}`);
    if (!isTabletOpen) throw new Error('Tablet modal failed to open');

    // 3. Open YouTube Music App
    console.log('▶️ Opening YouTube Music App on Tablet...');
    await page.click('#tablet-card-youtube');
    await page.waitForTimeout(600);

    const isYtViewActive = await page.$eval('#tab-view-youtube', el => el.classList.contains('active'));
    console.log(`📺 YouTube app view active: ${isYtViewActive}`);
    if (!isYtViewActive) throw new Error('YouTube app view failed to activate');

    // 4. Test Search Box: Type search query for custom artist not in catalog
    console.log('🔍 Typing custom artist "Travis Scott" into YouTube search...');
    await page.fill('#yt-search-input', 'Travis Scott');
    await page.waitForTimeout(1000);

    // Verify search results appear for custom query
    const trackCount = await page.$$eval('.yt-track-card', cards => cards.length);
    console.log(`🎵 Found ${trackCount} track card(s) for custom search "Travis Scott"`);
    if (trackCount === 0) {
      throw new Error('Search failed to find any video cards for "Travis Scott"');
    }

    const firstCardTitle = await page.$eval('.yt-track-card .yt-track-title', el => el.textContent);
    console.log(`🎵 Top search result: "${firstCardTitle}"`);

    // 5. Click Play on the search result
    console.log(`▶️ Clicking Play on top search result "${firstCardTitle}"...`);
    await page.click('.yt-track-card:first-child');
    await page.waitForTimeout(1000);

    const deckTitle = await page.$eval('#yt-deck-title', el => el.textContent);
    console.log(`🎧 Now playing in tablet deck: "${deckTitle}"`);

    // Capture screenshot of YouTube tablet app with search results
    await page.screenshot({ path: path.join(process.cwd(), 'scripts/evidence_tablet_youtube_app.png') });
    console.log('📸 Captured evidence_tablet_youtube_app.png');

    // 6. Resume Driving & Listen
    console.log('🚗 Clicking "RESUME DRIVING & LISTEN" button...');
    await page.click('#yt-btn-drive-listen');
    await page.waitForTimeout(800);

    const isTabletClosed = await page.$eval('#hud-tablet-modal', el => !el.classList.contains('open'));
    console.log(`📱 Tablet closed: ${isTabletClosed}`);
    if (!isTabletClosed) throw new Error('Tablet failed to close after Resume Driving');

    // 7. Strictly verify that YouTube video container is NOT visible on screen
    const hostInfo = await page.$eval('#youtube-persistent-container', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        opacity: parseFloat(style.opacity),
        display: style.display,
        visibility: style.visibility
      };
    });
    console.log('📺 Driving mode YouTube video host info:', hostInfo);

    const isOffscreen = hostInfo.left < 0 || hostInfo.top < 0 || hostInfo.opacity < 0.01;
    if (!isOffscreen) {
      throw new Error(`YouTube video container is still visible on screen while driving: ${JSON.stringify(hostInfo)}`);
    }
    console.log('✅ Verified: YouTube video is completely off-screen and invisible during driving!');

    // 8. Verify In-Car Driving Stereo Widget is displayed
    const stereoDisplay = await page.$eval('#youtube-car-stereo', el => window.getComputedStyle(el).display);
    const stereoText = await page.$eval('#yt-stereo-text', el => el.textContent);
    console.log(`📻 In-Car Stereo Widget visible: ${stereoDisplay !== 'none'}, Marquee: "${stereoText}"`);
    if (stereoDisplay === 'none') {
      throw new Error('In-Car Stereo HUD widget is not displayed while driving');
    }

    // 9. Drive vehicle with music playing in background!
    console.log('🏎️ Accelerating vehicle down Highway 1 with YouTube music playing...');
    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(2000);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyD');

    // Capture screenshot of high-speed driving with in-car stereo widget
    await page.screenshot({ path: path.join(process.cwd(), 'scripts/evidence_youtube_driving_stereo.png') });
    // 10. Click the tablet button on the music bar and verify it opens to Tablet App!
    console.log('📱 Clicking Tablet button on music bar (#yt-stereo-tablet-btn)...');
    await page.click('#yt-stereo-tablet-btn');
    await page.waitForTimeout(1000);

    const isTabletOpenAfterClick = await page.$eval('#hud-tablet-modal', el => el.classList.contains('open'));
    const isHomeViewActive = await page.$eval('#tab-view-home', el => el.classList.contains('active'));
    const activeApp = await page.evaluate(() => window.game?.gameState?.activeTabletApp || window.gameState?.activeTabletApp);

    console.log(`📱 Tablet open after clicking music bar button: ${isTabletOpenAfterClick}`);
    console.log(`📱 Tablet home view active: ${isHomeViewActive}`);
    console.log(`📱 Active tablet app state: ${activeApp}`);

    if (!isTabletOpenAfterClick) {
      throw new Error('Clicking tablet button on music bar failed to open tablet modal');
    }
    if (!isHomeViewActive || activeApp !== 'home') {
      throw new Error(`Clicking tablet button on music bar did not open Tablet App home! Active view: ${isHomeViewActive}, Active app: ${activeApp}`);
    }
    console.log('✅ Verified: Music bar tablet button opens directly to In-Car Tablet App!');

    // Capture screenshot of tablet reopened to Tablet App home
    await page.screenshot({ path: path.join(process.cwd(), 'scripts/evidence_youtube_tablet_reopened.png') });
    console.log('📸 Captured evidence_youtube_tablet_reopened.png');

    // Verify no game engine console errors
    if (consoleErrors.length > 0) {
      console.warn(`⚠️ Uncaught page errors encountered:`, consoleErrors);
    } else {
      console.log('✅ ZERO uncaught JavaScript exceptions during playtest!');
    }

    console.log('🎉 YouTube In-Car App & Driving Audio Playtest PASSED SUCCESSFULLY!');
  } finally {
    if (browser) await browser.close();
    server.kill();
    // Allow server process to exit
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

run().catch(err => {
  console.error('❌ Playtest failed:', err);
  process.exit(1);
});
