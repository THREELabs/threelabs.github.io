const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/kevin/.gemini/antigravity-cli/brain/f3f222a4-fd94-4f18-8c77-83d72503c352';

async function capture() {
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

  await send('Runtime.enable');
  await send('Page.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 1200));

  async function takeShot(name) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACT_DIR, name), buf);
    console.log(`Saved: ${name}`);
  }

  // 1. Chase Cam
  await send('Runtime.evaluate', { expression: 'window.game.cameraManager.setMode("CHASE");' });
  await new Promise(r => setTimeout(r, 600));
  await takeShot('cam_chase.png');

  // 2. Cockpit Cam
  await send('Runtime.evaluate', { expression: 'window.game.cameraManager.setMode("COCKPIT");' });
  await new Promise(r => setTimeout(r, 600));
  await takeShot('cam_cockpit.png');

  // 3. Hood Cam
  await send('Runtime.evaluate', { expression: 'window.game.cameraManager.setMode("HOOD");' });
  await new Promise(r => setTimeout(r, 600));
  await takeShot('cam_hood.png');

  // 4. Photo Mode: Front Angle
  await send('Runtime.evaluate', {
    expression: 'window.game.gameState.isPhotoMode = true; window.game.cameraManager.photoOrbit.theta = Math.PI * 0.28; window.game.cameraManager.photoOrbit.phi = Math.PI * 0.38; window.game.cameraManager.photoOrbit.radius = 5.2;'
  });
  await new Promise(r => setTimeout(r, 600));
  await takeShot('cam_orbit_front.png');

  // 5. Photo Mode: Rear Angle
  await send('Runtime.evaluate', {
    expression: 'window.game.gameState.isPhotoMode = true; window.game.cameraManager.photoOrbit.theta = Math.PI * 1.25; window.game.cameraManager.photoOrbit.phi = Math.PI * 0.36; window.game.cameraManager.photoOrbit.radius = 5.4;'
  });
  await new Promise(r => setTimeout(r, 600));
  await takeShot('cam_orbit_rear.png');

  ws.close();
  chrome.kill();
  preview.kill();
}

capture().catch(console.error);
