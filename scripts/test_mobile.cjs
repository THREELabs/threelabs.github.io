const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/kevin/.gemini/antigravity-cli/brain/f3f222a4-fd94-4f18-8c77-83d72503c352';

async function testMobile() {
  const preview = spawn('/home/kevin/.local/bin/node', ['./node_modules/vite/bin/vite.js', 'preview', '--port', '4173'], {
    cwd: '/home/kevin/Documents/THREELabs-Baja-Racer'
  });
  await new Promise(r => setTimeout(r, 1800));

  const chrome = spawn('/home/kevin/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell', [
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--remote-debugging-port=9222',
    'http://localhost:4173'
  ]);
  await new Promise(r => setTimeout(r, 2200));

  const listRes = await new Promise((resolve) => {
    http.get('http://localhost:9222/json', res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
  });

  const ws = new WebSocket(listRes[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const curId = id++;
      const handler = (evt) => {
        const res = JSON.parse(evt.data);
        if (res.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(res.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  let errorCount = 0;
  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errorCount++;
      console.error('EXCEPTION:', msg.params.exceptionDetails.text);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  // Emulate iPhone 14 Pro Landscape (844 x 390, touch enabled)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 844,
    height: 390,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 5
  });

  await new Promise(r => setTimeout(r, 1200));

  console.log('--- 1. Capturing Mobile Touch UI In-Game Screenshot ---');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_gameplay.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved: mobile_gameplay.png');

  console.log('--- 2. Testing Touch Acceleration (Gas Pedal) ---');
  // Dispatch touch on Gas button
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("#touch-gas-btn").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));'
  });
  await new Promise(r => setTimeout(r, 2000));

  const gasState = await send('Runtime.evaluate', {
    expression: 'JSON.stringify({ speedMph: window.game.gameState.speedMph, throttle: window.game.gameState.throttleInput, rpm: Math.round(window.game.gameState.engineRpm) })',
    returnByValue: true
  });
  console.log('State after 2s of Touch Gas:', gasState.result.value);

  // Release Gas button
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("#touch-gas-btn").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));'
  });

  console.log('--- 3. Testing Touch Steering Left ---');
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("#touch-steer-l").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));'
  });
  await new Promise(r => setTimeout(r, 1000));

  const steerState = await send('Runtime.evaluate', {
    expression: 'JSON.stringify({ steer: window.game.gameState.steerInput })',
    returnByValue: true
  });
  console.log('Steering Input State:', steerState.result.value);

  await send('Runtime.evaluate', {
    expression: 'document.querySelector("#touch-steer-l").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));'
  });

  console.log('--- 4. Testing Touch Camera & Livery Buttons ---');
  await send('Runtime.evaluate', { expression: 'document.querySelector("#touch-cam-btn").click();' });
  await new Promise(r => setTimeout(r, 400));
  const camState = await send('Runtime.evaluate', {
    expression: 'window.game.gameState.cameraMode',
    returnByValue: true
  });
  console.log('Camera Mode after touch:', camState.result.value);

  await send('Runtime.evaluate', { expression: 'document.querySelector("#touch-livery-btn").click();' });
  await new Promise(r => setTimeout(r, 400));

  console.log('Total Runtime Exceptions:', errorCount);

  ws.close();
  chrome.kill();
  preview.kill();
}

testMobile().catch(console.error);
