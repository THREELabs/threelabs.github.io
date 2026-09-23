const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Click start awaken screen if present
  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    console.log('Clicking start awaken screen...');
    await startScreen.click({ force: true });
  } else {
    await page.mouse.click(640, 360);
  }
  await page.waitForTimeout(1500);

  // Check Web Audio state and loaded buffers
  const audioState = await page.evaluate(() => {
    const s = window.game ? window.game.sound : null;
    if (!s) return { foundSound: false };
    return {
      foundSound: true,
      ctxState: s.ctx ? s.ctx.state : 'no-ctx',
      buffersLoaded: {
        idle: Boolean(s.realBuffers && s.realBuffers.idle),
        heavy: Boolean(s.realBuffers && s.realBuffers.heavy),
        low: Boolean(s.realBuffers && s.realBuffers.low),
        mid: Boolean(s.realBuffers && s.realBuffers.mid),
        high: Boolean(s.realBuffers && s.realBuffers.high),
        revLimit: Boolean(s.realBuffers && s.realBuffers.revLimit),
        shift: Boolean(s.realBuffers && s.realBuffers.shift),
        starter: Boolean(s.realBuffers && s.realBuffers.starter),
        overrun: Boolean(s.realBuffers && s.realBuffers.overrun),
        horn: Boolean(s.realBuffers && s.realBuffers.horn)
      },
      sourcesActive: {
        idle: Boolean(s.realSources && s.realSources.idle),
        heavy: Boolean(s.realSources && s.realSources.heavy),
        low: Boolean(s.realSources && s.realSources.low),
        mid: Boolean(s.realSources && s.realSources.mid),
        high: Boolean(s.realSources && s.realSources.high),
        revLimit: Boolean(s.realSources && s.realSources.revLimit)
      },
      busVolume: s.realEngineGain ? s.realEngineGain.gain.value : 0
    };
  });
  console.log('Audio State:', JSON.stringify(audioState, null, 2));

  // Accelerate forward with KeyW for 3 seconds
  console.log('🏎️ Accelerating forward with KeyW...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(3000);

  // Read telemetry during driving
  const drivingTelemetry = await page.evaluate(() => {
    const s = window.game ? window.game.sound : null;
    const gs = window.gameState || {};
    return {
      speed: Math.round(gs.speed || 0),
      engineRpm: Math.round(gs.engineRpm || 0),
      gear: gs.gear,
      throttle: Math.round((gs.throttle || 0) * 100) / 100,
      realIdleGain: s && s.realIdleGain ? Math.round(s.realIdleGain.gain.value * 100) / 100 : null,
      realHeavyGain: s && s.realHeavyGain ? Math.round(s.realHeavyGain.gain.value * 100) / 100 : null,
      realLowGain: s && s.realLowGain ? Math.round(s.realLowGain.gain.value * 100) / 100 : null,
      realMidGain: s && s.realMidGain ? Math.round(s.realMidGain.gain.value * 100) / 100 : null,
      realHighGain: s && s.realHighGain ? Math.round(s.realHighGain.gain.value * 100) / 100 : null,
      realRevLimitGain: s && s.realRevLimitGain ? Math.round(s.realRevLimitGain.gain.value * 100) / 100 : null,
      realEngineBusGain: s && s.realEngineGain ? Math.round(s.realEngineGain.gain.value * 100) / 100 : null
    };
  });
  console.log('Driving Telemetry:', JSON.stringify(drivingTelemetry, null, 2));

  // Honk horn with KeyH
  console.log('📢 Testing vintage Jeep horn (KeyH)...');
  await page.keyboard.press('KeyH');
  await page.waitForTimeout(600);

  // Release throttle to test overrun burble
  console.log('💨 Releasing throttle to trigger real exhaust overrun burble...');
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(1500);

  // Take screenshot of driving action
  await page.screenshot({ path: 'scripts/real_jeep_audio_driving.png' });
  console.log('📸 Saved screenshot: scripts/real_jeep_audio_driving.png');

  console.log('Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }

  await browser.close();
})();
