import { chromium } from "playwright-core";

async function run() {
  console.log("🚀 Launching Chrome to inspect both summit binoculars...");
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("console", msg => {
    if (msg.type() === "error") console.log(`Console error: ${msg.text()}`);
  });

  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1000);

  try {
    await page.click("#start-awaken-screen", { timeout: 3000 });
  } catch (e) {}
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.skipIntro();
    }
  });

  // TEST 1: Viewfinder 0 (Desert Vista: Route 66 & White Canyon Ranch)
  console.log("📸 Testing Viewfinder 0 (Desert Vista)...");
  const vf0Info = await page.evaluate(() => {
    const g = window.game;
    const road = g.splineRoad;
    const vf0 = road.scenicViewfinders[0];
    
    g.physics.position.copy(vf0.pos);
    g.physics.speed = 0;
    g.physics.velocity.set(0, 0, 0);
    g.sportsCar.group.position.copy(vf0.pos);
    
    road.update(1/60, g.physics.position);
    g.hud.update(g.physics, road, 1/60);
    
    g.hud.openBinocularView();
    g.cameraManager.update(1/60);
    g.hud.update(g.physics, road, 1/60);

    return {
      name: g.gameState.nearbyViewfinder ? g.gameState.nearbyViewfinder.name : null,
      azimuth: g.gameState.binocularAzimuthDeg,
      target: g.gameState.binocularTargetName
    };
  });
  console.log("VF0 Status:", vf0Info);

  await page.waitForTimeout(600);
  await page.screenshot({ path: "scripts/vf0_desert_vista_default.png" });
  console.log("Saved scripts/vf0_desert_vista_default.png");

  await page.evaluate(() => {
    const g = window.game;
    g.cameraManager.binocularControls.targetFov = 24.0;
    g.cameraManager.binocularControls.fov = 24.0;
    g.cameraManager.update(1/60);
    g.hud.update(g.physics, g.splineRoad, 1/60);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scripts/vf0_desert_vista_zoomed.png" });
  console.log("Saved scripts/vf0_desert_vista_zoomed.png");

  await page.evaluate(() => {
    window.game.hud.closeBinocularView();
  });
  await page.waitForTimeout(500);

  // TEST 2: Viewfinder 1 (Pacific Pass: Santa Monica Pier & Ocean Vista)
  console.log("📸 Testing Viewfinder 1 (Pacific Pass Vista)...");
  const vf1Info = await page.evaluate(() => {
    const g = window.game;
    const road = g.splineRoad;
    const vf1 = road.scenicViewfinders[1];
    
    g.physics.position.copy(vf1.pos);
    g.physics.speed = 0;
    g.physics.velocity.set(0, 0, 0);
    g.sportsCar.group.position.copy(vf1.pos);
    
    road.update(1/60, g.physics.position);
    g.hud.update(g.physics, road, 1/60);
    
    g.hud.openBinocularView();
    g.cameraManager.update(1/60);
    g.hud.update(g.physics, road, 1/60);

    return {
      name: g.gameState.nearbyViewfinder ? g.gameState.nearbyViewfinder.name : null,
      azimuth: g.gameState.binocularAzimuthDeg,
      target: g.gameState.binocularTargetName
    };
  });
  console.log("VF1 Status:", vf1Info);

  await page.waitForTimeout(600);
  await page.screenshot({ path: "scripts/vf1_pacific_vista_default.png" });
  console.log("Saved scripts/vf1_pacific_vista_default.png");

  await page.evaluate(() => {
    const g = window.game;
    g.cameraManager.binocularControls.targetFov = 20.0;
    g.cameraManager.binocularControls.fov = 20.0;
    g.cameraManager.update(1/60);
    g.hud.update(g.physics, g.splineRoad, 1/60);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scripts/vf1_pacific_vista_zoomed.png" });
  console.log("Saved scripts/vf1_pacific_vista_zoomed.png");

  await browser.close();
  console.log("🏁 Finished inspection capturing successfully!");
}

run().catch(e => {
  console.error("Error during capture:", e);
  process.exit(1);
});
