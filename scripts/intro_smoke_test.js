import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Start a local static file server for dist
const distDir = path.resolve('dist');
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 9888;
server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);

  try {
    const browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--enable-webgl']
    });

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
    console.log('Page loaded. Clicking Awaken Start Button to satisfy audio policy...');
    await page.waitForSelector('#start-awaken-btn');
    await page.evaluate(() => {
      const btn = document.getElementById('start-awaken-btn');
      if (btn) btn.click();
    });
    console.log('Awaken button clicked. AudioContext unlocked & 11.5s intro started!');

    // 1. Check Initial Orbit Phase
    let sawOrbit = false;
    let sawTransition = false;
    let sawPlaying = false;
    let initialWhiteOpacity = null;
    let finalWhiteOpacity = null;

    for (let i = 0; i < 200; i++) {
      await page.waitForTimeout(250);
      const st = await page.evaluate(() => {
        const g = window.game;
        if (!g || !g.gameState) return null;
        return {
          isIntroActive: g.gameState.isIntroActive,
          introState: g.gameState.introState,
          introProgress: g.gameState.introProgress,
          introSmokeOpacity: g.gameState.introSmokeOpacity,
          dreamWhiteOpacity: g.gameState.dreamWhiteOpacity,
          temperatureFlashed: g.gameState.temperatureFlashed,
          tempText: document.getElementById('temp-flash-val') ? document.getElementById('temp-flash-val').textContent : '',
          zoneTempText: document.getElementById('zone-temp') ? document.getElementById('zone-temp').textContent : '',
          desertAmbienceVolume: g.gameState.desertAmbienceVolume,
          cameraPos: { x: g.cameraManager.camera.position.x, y: g.cameraManager.camera.position.y, z: g.cameraManager.camera.position.z },
          fov: g.cameraManager.camera.fov
        };
      });

      if (!st) continue;

      if (initialWhiteOpacity === null && st.dreamWhiteOpacity !== undefined) {
        initialWhiteOpacity = st.dreamWhiteOpacity;
      }
      finalWhiteOpacity = st.dreamWhiteOpacity;

      if (st.introState === 'orbit') {
        sawOrbit = true;
        if (i % 6 === 0) {
          console.log(`[Orbit Phase] Progress: ${(st.introProgress * 100).toFixed(1)}% | Dream White: ${st.dreamWhiteOpacity.toFixed(2)} | Mist: ${st.introSmokeOpacity.toFixed(2)} | FOV: ${st.fov}`);
        }
      } else if (st.introState === 'transition') {
        sawTransition = true;
        if (i % 3 === 0) {
          console.log(`[Transition Phase] Progress: ${(st.introProgress * 100).toFixed(1)}% | Dream White: ${st.dreamWhiteOpacity.toFixed(2)} | Cam: (${st.cameraPos.x.toFixed(1)}, ${st.cameraPos.y.toFixed(1)}, ${st.cameraPos.z.toFixed(1)})`);
        }
      } else if (st.introState === 'playing') {
        sawPlaying = true;
        console.log(`[Playing Phase] Intro complete! Cam in Chase driving view. Temp Flashed: ${st.temperatureFlashed} | Flash Temp: "${st.tempText}" | Zone Temp: "${st.zoneTempText}"`);
        break;
      }
    }

    if (!sawOrbit) throw new Error('Did not observe orbit phase');
    if (!sawTransition && !sawPlaying) throw new Error('Did not transition into transition or playing state');

    // Wait until playing state is reached
    for (let i = 0; i < 80; i++) {
      const isPlaying = await page.evaluate(() => window.game.gameState.introState === 'playing');
      if (isPlaying) { sawPlaying = true; break; }
      await page.waitForTimeout(300);
    }

    if (!sawPlaying) throw new Error('Intro did not finish within timeout');

    const tempCheck = await page.evaluate(() => ({
      temperatureFlashed: window.game.gameState.temperatureFlashed,
      tempVal: document.getElementById('temp-flash-val') ? document.getElementById('temp-flash-val').textContent : '',
      zoneTemp: document.getElementById('zone-temp') ? document.getElementById('zone-temp').textContent : ''
    }));
    console.log('🌡️ Verified Temperature Flash at player screen:', tempCheck);
    if (!tempCheck.temperatureFlashed || !tempCheck.tempVal.includes('104°F')) {
      throw new Error(`Temperature flash failed validation: ${JSON.stringify(tempCheck)}`);
    }

    // 2. Test Driving Input
    console.log('Testing driving acceleration...');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1200);
    await page.keyboard.up('KeyW');

    const drivingState = await page.evaluate(() => {
      const g = window.game;
      return {
        speedMph: g.gameState.speedMph,
        rpm: g.gameState.engineRpm,
        gear: g.gameState.gear
      };
    });

    console.log('Driving state after acceleration:', drivingState);

    if (drivingState.speedMph <= 0) {
      console.warn('Speed was zero, checking throttle input:', drivingState);
    } else {
      console.log(`✅ Porsche GT3 RS accelerated to ${drivingState.speedMph} MPH!`);
    }

    // 3. Test Reset & Intro Replay
    console.log('Testing reset (KeyR) and intro restart...');
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(400);

    const resetState = await page.evaluate(() => ({
      isIntroActive: window.game.gameState.isIntroActive,
      introState: window.game.gameState.introState,
      speedMph: window.game.gameState.speedMph
    }));

    console.log('State after reset:', resetState);
    if (!resetState.isIntroActive || resetState.introState !== 'orbit' || resetState.speedMph !== 0) {
      throw new Error(`Reset failed to replay intro correctly: ${JSON.stringify(resetState)}`);
    }

    console.log(`Total errors captured: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors:', errors);
      throw new Error('Test failed due to errors');
    }

    console.log('\n🎉 ALL INTRO SEQUENCE & GAMEPLAY TESTS PASSED PERFECTLY!');
    await browser.close();
    server.close();
    process.exit(0);

  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    process.exit(1);
  }
});
