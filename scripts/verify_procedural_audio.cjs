const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleErrors = [];
  const networkErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  page.on('requestfailed', req => {
    networkErrors.push(req.url() + ' ' + req.failure().errorText);
  });

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const startScreen = await page.$('#start-awaken-screen');
  if (startScreen) {
    console.log('Clicking start awaken screen...');
    await startScreen.click({ force: true });
  } else {
    await page.mouse.click(640, 360);
  }
  await page.waitForTimeout(1500);

  // Check Web Audio state and procedural synth parameters
  const synthState = await page.evaluate(() => {
    const s = window.game ? window.game.sound : null;
    if (!s) return { foundSound: false };
    return {
      foundSound: true,
      ctxState: s.ctx ? s.ctx.state : 'no-ctx',
      proceduralEngineActive: Boolean(s.osc1 && s.osc2 && s.subOsc && s.intakeSource),
      engineVolume: s.engineGain ? s.engineGain.gain.value : null,
      engineFilterFreq: s.engineFilter ? s.engineFilter.frequency.value : null,
      gearWhineVolume: s.turboWhineGain ? s.turboWhineGain.gain.value : null,
      tireVolume: s.tireGain ? s.tireGain.gain.value : null,
      windVolume: s.windGain ? s.windGain.gain.value : null
    };
  });
  console.log('Synth State:', JSON.stringify(synthState, null, 2));

  // Accelerate forward with KeyW for 3 seconds
  console.log('🏎️ Driving forward with procedural audio engine...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(3000);

  // Read telemetry during driving
  const drivingTelemetry = await page.evaluate(() => {
    const s = window.game ? window.game.sound : null;
    return {
      engineVolume: s && s.engineGain ? Math.round(s.engineGain.gain.value * 100) / 100 : null,
      engineFilterFreq: s && s.engineFilter ? Math.round(s.engineFilter.frequency.value) : null,
      intakeVolume: s && s.intakeGain ? Math.round(s.intakeGain.gain.value * 100) / 100 : null,
      osc1Freq: s && s.osc1 ? Math.round(s.osc1.frequency.value * 10) / 10 : null
    };
  });
  console.log('Driving Telemetry:', JSON.stringify(drivingTelemetry, null, 2));

  // Honk procedural horn with KeyH
  console.log('📢 Testing procedural dual-tone horn (KeyH)...');
  await page.keyboard.press('KeyH');
  await page.waitForTimeout(600);

  // Release throttle to test procedural overrun pops
  console.log('💨 Releasing throttle for procedural overrun crackles...');
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(1500);

  console.log('Errors count:', consoleErrors.length);
  console.log('Network errors count:', networkErrors.length);
  if (consoleErrors.length > 0) console.error('Console errors:', consoleErrors);
  if (networkErrors.length > 0) console.error('Network errors:', networkErrors);

  await browser.close();
})();
