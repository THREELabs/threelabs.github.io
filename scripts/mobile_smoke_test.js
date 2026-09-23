#!/usr/bin/env node
/**
 * P2-12 mobile control redesign — live verification.
 * Boots the real game in an emulated phone (coarse pointer / no hover / touch),
 * then checks the two-thumb layout geometry, touch button binding, the
 * show/hide chip (+persistence), and analog tilt steering through the
 * actual update() physics.
 *
 * Usage: node scripts/mobile_smoke_test.js [baseURL]
 */
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://127.0.0.1:8017';
let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ✅ [PASS] ${name}`); }
  else { failed++; console.error(`  ❌ [FAIL] ${name}${extra ? ' — ' + extra : ''}`); }
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },          // iPhone-ish
  hasTouch: true,
  isMobile: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

// Emulate coarse pointer / no hover so the (hover:none) CSS media queries fire
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setEmulatedMedia', {
  features: [
    { name: 'hover', value: 'none' },
    { name: 'any-hover', value: 'none' },
    { name: 'pointer', value: 'coarse' },
    { name: 'any-pointer', value: 'coarse' }
  ]
});

await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => localStorage.removeItem('baja_pad_visible_v1'));
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);

// ---------- 1. Pad visible on touch devices ----------
const padVisible = await page.evaluate(() => {
  const el = document.getElementById('pad');
  return getComputedStyle(el).display !== 'none';
});
check('Pad controls visible on emulated touch device', padVisible);

// ---------- 2. Two-thumb geometry ----------
const geo = await page.evaluate(() => {
  const r = id => document.getElementById(id).getBoundingClientRect();
  const L = r('bL'), R = r('bR'), N = r('bN'), B = r('bB'), A = r('bA');
  return {
    steerSideBySide: Math.abs(L.top - R.top) < 8 && R.left > L.right - 2,
    steerLeftHalf: R.right < window.innerWidth * 0.62,
    nitroAboveBrakeRow: N.bottom <= B.top + 4,
    gasWiderThanBrake: A.width > B.width,
    bigSteerTargets: L.height >= 80 && R.height >= 80
  };
});
check('◀ ▶ sit side-by-side under the left thumb', geo.steerSideBySide);
check('Steer zone stays in the left half of the screen', geo.steerLeftHalf);
check('NITRO stacked ABOVE the brake/gas row (review spec)', geo.nitroAboveBrakeRow);
check('GAS button larger than BRK (most-used control wins area)', geo.gasWiderThanBrake);
check('Steer buttons ≥80px tall (finger-sized targets)', geo.bigSteerTargets);

// ---------- 3. Touch presses drive the game keys ----------
const BTN_TO_KEY = { bL: 'left', bR: 'right', bA: 'gas', bB: 'brake', bN: 'nitro' };
async function pressKey(btnId) {
  const keyName = BTN_TO_KEY[btnId];
  const el = await page.locator('#' + btnId);
  await el.dispatchEvent('pointerdown');
  const held = await page.evaluate(k => window.__inputKeys[k], keyName);
  await el.dispatchEvent('pointerup');
  const released = await page.evaluate(k => !window.__inputKeys[k], keyName);
  return { held, released };
}
// expose keys for assertion (read-only handle, mirrors __gameState pattern)
await page.evaluate(async () => {
  const m = await import('/js/input.js');
  window.__inputKeys = m.keys;
});
await page.waitForTimeout(100);
const gasTap = await pressKey('bA');
check('Touch-hold GAS engages throttle, release disengages',
  gasTap.held && gasTap.released, JSON.stringify(gasTap));
const steerTap = await pressKey('bL');
check('Touch-hold ◀ steers left', steerTap.held && steerTap.released, JSON.stringify(steerTap));

// ---------- 4. Show/hide chip + persistence ----------
const chip = await page.evaluate(() => {
  const el = document.getElementById('bPadToggle');
  return { exists: !!el, visible: el && getComputedStyle(el).display !== 'none' };
});
check('Show/hide chip exists and is visible on touch devices',
  chip.exists && chip.visible, JSON.stringify(chip));

await page.locator('#bPadToggle').dispatchEvent('click');
const hiddenState = await page.evaluate(() => ({
  cls: document.body.classList.contains('pad-hidden'),
  stored: localStorage.getItem('baja_pad_visible_v1'),
  display: getComputedStyle(document.getElementById('pad')).display
}));
check('Chip hides the pad and remembers the choice',
  hiddenState.cls && hiddenState.stored === '0' && hiddenState.display === 'none',
  JSON.stringify(hiddenState));
check('Chip label flips to SHOW state',
  (await page.textContent('#bPadToggle')).includes('SHOW'));

await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);
const stillHidden = await page.evaluate(() =>
  document.body.classList.contains('pad-hidden'));
check('Hidden pad survives a reload (persisted pref)', stillHidden);

await page.locator('#bPadToggle').dispatchEvent('click'); // restore for later checks
const restored = await page.evaluate(() =>
  !document.body.classList.contains('pad-hidden') &&
  localStorage.getItem('baja_pad_visible_v1') === '1');
check('Chip brings the pad back', restored);

// ---------- 5. Analog tilt steering through real physics ----------
await page.evaluate(() => window.triggerCopTakedownTest()); // start a race
await page.waitForTimeout(600);
// Release the dev bot first — triggerCopTakedownTest() enables autopilot,
// and its AI steering would fight the tilt input we're trying to verify.
await page.evaluate(async () => {
  const { toggleAutopilot } = await import('/js/autopilot.js');
  toggleAutopilot(false); // MANUAL DRIVING RESTORED
});
const tiltResult = await page.evaluate(async () => {
  const storage = await import('/js/storage.js');
  const input = await import('/js/input.js');
  storage.updateSettings({ tiltSteer: true });
  input.enableTilt();
  const ev = new DeviceOrientationEvent('deviceorientation', { gamma: 18 });
  window.dispatchEvent(ev);
  const strong = { x: input.tilt.x, active: input.tilt.active };
  const dz = new DeviceOrientationEvent('deviceorientation', { gamma: 1 });
  window.dispatchEvent(dz);
  const dead = { x: input.tilt.x };
  const neutral = new DeviceOrientationEvent('deviceorientation', { gamma: 18 });
  window.dispatchEvent(neutral); // restore strong tilt for the physics check
  return { strong, dead };
});
check('Tilt 18° produces strong analog steer (~0.6+)',
  tiltResult.strong.x > 0.55 && tiltResult.strong.active, JSON.stringify(tiltResult.strong));
check('Tilt inside deadzone produces zero steer',
  tiltResult.dead.x === 0, JSON.stringify(tiltResult.dead));

// Drive the physics synchronously: re-fire the tilt event every simulated
// frame (as a real phone's sensor would) so a stray browser-emitted
// null-gamma event can't zero the value between dispatch and read.
const steerInput = await page.evaluate(async () => {
  const track = await import('/js/track.js');
  const c = await import('/js/constants.js');
  const { update } = await import('/js/update.js');
  let last = 0;
  for (let i = 0; i < 45; i++) {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { gamma: 18 }));
    const ps = track.findSegment(window.__gameState.position + c.playerZ);
    update(1 / 60, ps);
    last = window.__gameState.steerInput;
  }
  return last;
});
check('Game physics steers toward tilt (steerInput > 0.3)',
  steerInput > 0.3, `steerInput=${steerInput}`);

// T-key toggle round-trip
const tToggle = await page.evaluate(async () => {
  const storage = await import('/js/storage.js');
  return storage.getSettings().tiltSteer;
});
await page.keyboard.press('KeyT');
await page.waitForTimeout(200);
const tAfter = await page.evaluate(async () =>
  (await import('/js/storage.js')).getSettings().tiltSteer);
check('T key toggles tilt setting off', tToggle === true && tAfter === false,
  `before=${tToggle} after=${tAfter}`);
await page.keyboard.press('KeyT'); // leave ON

// ---------- 6. Desktop regression: pad + chip stay hidden, no tilt listener ---
const desk = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await desk.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await desk.waitForTimeout(1500);
const desktopState = await desk.evaluate(() => ({
  pad: getComputedStyle(document.getElementById('pad')).display,
  chip: getComputedStyle(document.getElementById('bPadToggle')).display
}));
check('Desktop: pad hidden as before', desktopState.pad === 'none', JSON.stringify(desktopState));
check('Desktop: toggle chip hidden', desktopState.chip === 'none');

await page.waitForTimeout(800);
check('P2-12: zero page errors during mobile session', errors.length === 0, errors.join(' | '));

console.log('\n====================================================');
console.log(`📊 P2-12 MOBILE SMOKE SUMMARY: ${passed} Passed | ${failed} Failed | Total: ${passed + failed}`);
console.log('====================================================');
await browser.close();
process.exit(failed > 0 ? 1 : 0);
