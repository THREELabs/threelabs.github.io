const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function main() {
  const CHROME_PATH = '/home/kevin/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell';
  const ARTIFACT_DIR = '/home/kevin/.gemini/antigravity-cli/brain/f3f222a4-fd94-4f18-8c77-83d72503c352';

  // 1. Start Vite Preview Server
  const preview = spawn('/home/kevin/.local/bin/node', ['./node_modules/vite/bin/vite.js', 'preview', '--port', '4173'], {
    cwd: '/home/kevin/Documents/THREELabs-Baja-Racer'
  });

  await new Promise(r => setTimeout(r, 2000));

  // 2. Launch headless chrome with remote debugging
  const chrome = spawn(CHROME_PATH, [
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--remote-debugging-port=9222',
    '--window-size=1280,720',
    'http://localhost:4173'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await new Promise((resolve, reject) => {
      http.get('http://localhost:9222/json', res => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    const pageTarget = listRes.find(t => t.type === 'page') || listRes[0];
    if (!pageTarget) throw new Error('No page target found');

    // Use native WebSocket in Node 24
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Wait for scene to settle
    await sendCommand('Runtime.evaluate', {
      expression: `new Promise(r => setTimeout(r, 1200))`,
      awaitPromise: true
    });

    const angles = [
      { name: 'car_chase_view.png', script: `
        window.game.gameState.isPhotoMode = false;
        window.game.cameraManager.mode = 'CHASE';
      `},
      { name: 'car_front_angle.png', script: `
        window.game.gameState.isPhotoMode = true;
        window.game.cameraManager.photoOrbit.theta = Math.PI * 0.25;
        window.game.cameraManager.photoOrbit.phi = Math.PI * 0.38;
        window.game.cameraManager.photoOrbit.radius = 5.2;
      `},
      { name: 'car_rear_angle.png', script: `
        window.game.gameState.isPhotoMode = true;
        window.game.cameraManager.photoOrbit.theta = Math.PI * 1.25;
        window.game.cameraManager.photoOrbit.phi = Math.PI * 0.36;
        window.game.cameraManager.photoOrbit.radius = 5.2;
      `},
      { name: 'car_side_angle.png', script: `
        window.game.gameState.isPhotoMode = true;
        window.game.cameraManager.photoOrbit.theta = Math.PI * 0.50;
        window.game.cameraManager.photoOrbit.phi = Math.PI * 0.42;
        window.game.cameraManager.photoOrbit.radius = 5.6;
      `}
    ];

    for (const angle of angles) {
      await sendCommand('Runtime.evaluate', { expression: angle.script });
      await sendCommand('Runtime.evaluate', {
        expression: `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`,
        awaitPromise: true
      });
      await new Promise(r => setTimeout(r, 600));

      const screenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${ARTIFACT_DIR}/${angle.name}`, Buffer.from(screenshot.data, 'base64'));
      console.log(`Saved: ${angle.name}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
    preview.kill();
  }
}

main().catch(console.error);
