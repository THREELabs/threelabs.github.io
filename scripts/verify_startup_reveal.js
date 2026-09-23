import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    const file = resolve('dist', '.' + (path === '/' ? '/index.html' : path));
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
if (!process.argv[2]) await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = process.argv[2] || `http://127.0.0.1:${server.address().port}`;
const out = '/tmp/jeep-startup-check';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
try {
  for (const mobile of [false, true]) {
    const label = mobile ? 'mobile' : 'desktop';
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let release;
    const gate = new Promise(r => release = r);
    await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
    await page.goto(base, { waitUntil: 'commit' });
    await page.waitForSelector('#startup-white');
    const first = await page.evaluate(() => ({ color: getComputedStyle(document.body).backgroundColor, opacity: getComputedStyle(document.querySelector('#startup-white')).opacity, text: document.querySelector('#startup-white').textContent, gameLoaded: !!window.game }));
    assert.equal(first.color, 'rgb(255, 255, 255)');
    assert.equal(first.opacity, '1');
    assert.equal(first.text, '');
    assert.equal(first.gameLoaded, false);
    await page.screenshot({ path: `${out}/${label}-white.png` });
    // Observe every rendered fade step instead of hoping a timed screenshot catches it.
    await page.evaluate(() => {
      window.revealSamples = [];
      new MutationObserver(() => {
        const el = document.querySelector('#startup-white');
        if (el && window.game) window.revealSamples.push({ opacity: Number(el.style.opacity || 1), intro: window.game.gameState.introState, camera: window.game.renderer.camera.position.toArray(), hud: getComputedStyle(document.querySelector('#hud-root')).visibility });
      }).observe(document.querySelector('#startup-white'), { attributes: true });
    });
    release();
    await page.waitForFunction(() => window.revealSamples.some(s => s.opacity < 0.7), null, { timeout: 120000 });
    await page.screenshot({ path: `${out}/${label}-fading.png` });
    await page.waitForFunction(() => window.game && !document.querySelector('#startup-white'), null, { timeout: 120000 });
    const samples = await page.evaluate(() => window.revealSamples);
    const partial = samples.filter(s => s.opacity > 0 && s.opacity < 1);
    assert(partial.length > 5, 'smooth multi-frame fade');
    assert(samples.every((s, i) => !i || s.opacity <= samples[i - 1].opacity), 'no white flash reappears');
    assert(partial.every(s => s.intro === 'orbit'), 'fade reveals the panning intro');
    assert(partial.every(s => s.hud === 'hidden'), 'no HUD over the reveal');
    assert.notDeepEqual(partial[0].camera, partial.at(-1).camera, 'camera actually pans');
    await page.screenshot({ path: `${out}/${label}-jeep.png` });
    await page.waitForFunction(() => !window.game.cameraManager.isIntro, null, { timeout: 120000 });
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#hud-root')).visibility), 'visible');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ label, first, fadeFrames: partial.length, panVerified: true, chaseReached: true, pageErrors: errors, screenshots: out }));
    await context.close();
  }
} finally { await browser.close(); server.close(); }
