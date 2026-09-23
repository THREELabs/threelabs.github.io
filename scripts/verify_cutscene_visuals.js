import { chromium } from 'playwright-core';
import { spawn } from 'child_process';

async function run() {
  console.log('🚀 Launching Vite dev server for Cutscene Verification on port 5195...');
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5195', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stderr.on('data', data => console.error(`[Vite Error] ${data}`));

  await new Promise(resolve => setTimeout(resolve, 2500));

  console.log('🌐 Launching headless Chrome via Playwright...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('  [BROWSER ERROR]', msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
      console.error('  [PAGE ERROR]', err.message);
    });

    console.log('📡 Navigating to http://localhost:5195...');
    await page.goto('http://localhost:5195', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Activate game loop and skip intro if present
    await page.evaluate(() => {
      window.dispatchEvent(new Event('click'));
      if (window.game && window.game.cameraManager && window.game.cameraManager.skipIntro) {
        window.game.cameraManager.skipIntro();
      }
    });
    await page.waitForTimeout(1000);

    // Trigger crime scene cutscene
    console.log('🎬 Triggering Mystery Crime Scene Cutscene...');
    await page.evaluate(() => {
      window.game.mysteryCrimeScene.triggerCrimeScene();
    });
    await page.waitForTimeout(600);

    // Measure subtitle box bounding rect in viewport (verify elevated position)
    const subBoxRect = await page.evaluate(() => {
      const el = document.querySelector('#cutscene-subtitles-box');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        distFromBottom: window.innerHeight - rect.bottom
      };
    });

    console.log('📐 Subtitle Box Geometry:', subBoxRect);
    if (!subBoxRect) {
      throw new Error('Subtitle box #cutscene-subtitles-box not found in DOM');
    }

    // Check that distFromBottom is elevated higher than old 24px + 8vh (~82px)
    // Now with clamp(68px, 10.5vh, 98px) + bottom bar (~58-72px), distFromBottom is >= 130px
    console.log(`  Distance from viewport bottom: ${subBoxRect.distFromBottom.toFixed(1)}px (Screen height: 720px)`);
    if (subBoxRect.distFromBottom < 115) {
      throw new Error(`Subtitles not raised high enough: distFromBottom=${subBoxRect.distFromBottom}`);
    }
    if (subBoxRect.top < 380) {
      throw new Error(`Subtitles too high up, might occlude central car action: top=${subBoxRect.top}`);
    }
    console.log('  ✅ Subtitle positioning is verified in lower-third sweet spot (elevated & clear of central objects)!');

    // Capture Shot 1: Establishing Wide Panorama
    console.log('📸 Capturing Shot 1: Establishing Wide Panorama (t=2.0s)...');
    await page.evaluate(() => {
      const s = window.game.mysteryCrimeScene;
      s.animTime = 2.0;
      s.getCurrentCutsceneCam();
      window.game.cameraManager.update(0.016);
      window.game.hud.update(window.game.physics, window.game.splineRoad, 0.016);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'scripts/evidence_cutscene_shot1_wide.png' });

    // Capture Shot 2: Standoff with Accusing Gestures & Defensive Stance
    console.log('📸 Capturing Shot 2: Standoff Confrontation (t=10.0s)...');
    await page.evaluate(() => {
      const s = window.game.mysteryCrimeScene;
      s.animTime = 10.0;
      s.update(0.016);
      s.getCurrentCutsceneCam();
      window.game.cameraManager.update(0.016);
      window.game.hud.update(window.game.physics, window.game.splineRoad, 0.016);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'scripts/evidence_cutscene_shot2_standoff.png' });

    // Capture Shot 3: Weapon Draw Angle & Enforcer Advance
    console.log('📸 Capturing Shot 3: Escalation / Weapon Draw Angle (t=19.0s)...');
    await page.evaluate(() => {
      const s = window.game.mysteryCrimeScene;
      s.animTime = 19.0;
      s.update(0.016);
      s.getCurrentCutsceneCam();
      window.game.cameraManager.update(0.016);
      window.game.hud.update(window.game.physics, window.game.splineRoad, 0.016);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'scripts/evidence_cutscene_shot3_draw.png' });

    // Capture Shot 4: Execution & Weapon Kick
    console.log('📸 Capturing Shot 4: Execution Dramatic Profile (t=26.0s)...');
    await page.evaluate(() => {
      const s = window.game.mysteryCrimeScene;
      s.animTime = 26.0;
      s.update(0.016);
      s.getCurrentCutsceneCam();
      window.game.cameraManager.update(0.016);
      window.game.hud.update(window.game.physics, window.game.splineRoad, 0.016);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'scripts/evidence_cutscene_shot4_execution.png' });

    // Capture Shot 5: Peelout Escape & Dynamic Tracking
    console.log('📸 Capturing Shot 5: Peelout Tracking Overview (t=33.0s)...');
    const peeloutData = await page.evaluate(() => {
      const s = window.game.mysteryCrimeScene;
      s.animTime = 33.0;
      s.update(0.016);
      s.getCurrentCutsceneCam();
      window.game.cameraManager.update(0.016);
      window.game.hud.update(window.game.physics, window.game.splineRoad, 0.016);
      return {
        phase: s.cinematicPhase,
        carPos: s.getawayCar ? { x: s.getawayCar.position.x, z: s.getawayCar.position.z } : null,
        activeDustCount: s.getawayDustPool ? s.getawayDustPool.filter(d => d.visible).length : 0,
        breezeCount: s.canyonBreezeParticles ? s.canyonBreezeParticles.length : 0
      };
    });
    console.log('  Peelout Data:', peeloutData);
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'scripts/evidence_cutscene_shot5_peelout.png' });

    if (consoleErrors.length > 0) {
      throw new Error(`Browser console errors detected: ${consoleErrors.join(' | ')}`);
    }

    console.log('🎉 All visual checks and screenshot captures passed with 0 console errors!');
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
