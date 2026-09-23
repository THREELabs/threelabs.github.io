import { chromium } from "playwright-core";
import { spawn } from "child_process";

async function testLoreModalPhoto() {
  console.log("🚀 Running Lore Modal Photo Verification...");

  // Start Vite server on port 5173 if not running
  let server = null;
  const isServerRunning = await fetch("http://localhost:5173").then(() => true).catch(() => false);
  if (!isServerRunning) {
    console.log("Starting Vite server on port 5173...");
    server = spawn("./node_modules/.bin/vite", ["--port", "5173"], { stdio: "pipe" });
    let ready = false;
    server.stdout.on("data", d => {
      if (d.toString().includes("Local:") || d.toString().includes("5173")) ready = true;
    });
    for (let i = 0; i < 40; i++) {
      if (ready) break;
      await new Promise(r => setTimeout(r, 250));
    }
  }

  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--enable-webgl"]
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const consoleErrors = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        console.log(`❌ Console Error: ${msg.text()}`);
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 25000 });
    await page.waitForTimeout(1000);

    try {
      await page.click("#start-awaken-screen", { timeout: 3000 });
    } catch (e) {}
    await page.waitForTimeout(1000);

    // 1. Test Coyote Ridge history modal
    console.log("Opening Coyote Ridge history modal...");
    await page.evaluate(() => {
      const g = window.game;
      if (g && g.hud) {
        g.hud.openHistoryModal("turnout_coyote_ridge");
      }
    });
    await page.waitForTimeout(1200);

    const coyotePhotos = await page.evaluate(() => {
      const img = document.querySelector("#history-desc-photos img.history-place-photo");
      const caption = document.querySelector("#history-desc-photos .history-photo-caption")?.textContent;
      const credit = document.querySelector("#history-desc-photos .history-photo-credit")?.textContent;
      return {
        hasImg: !!img,
        src: img?.src,
        naturalWidth: img?.naturalWidth,
        caption,
        credit
      };
    });
    console.log("Coyote Ridge description photo check:", coyotePhotos);
    await page.screenshot({ path: "scripts/lore_modal_coyote_ridge.png" });
    console.log("📸 Screenshot saved: scripts/lore_modal_coyote_ridge.png");

    // 2. Test Route 66 Diner
    console.log("Opening Route 66 Diner history modal...");
    await page.evaluate(() => {
      const g = window.game;
      if (g && g.hud) {
        g.hud.openHistoryModal("turnout_route66_diner");
      }
    });
    await page.waitForTimeout(1200);

    const dinerPhotos = await page.evaluate(() => {
      const img = document.querySelector("#history-desc-photos img.history-place-photo");
      const caption = document.querySelector("#history-desc-photos .history-photo-caption")?.textContent;
      return { hasImg: !!img, src: img?.src, naturalWidth: img?.naturalWidth, caption };
    });
    console.log("Route 66 Diner description photo check:", dinerPhotos);
    await page.screenshot({ path: "scripts/lore_modal_route66_diner.png" });
    console.log("📸 Screenshot saved: scripts/lore_modal_route66_diner.png");

    // 3. Test Bixby Bridge
    console.log("Opening Bixby Bridge history modal...");
    await page.evaluate(() => {
      const g = window.game;
      if (g && g.hud) {
        g.hud.openHistoryModal("turnout_bixby_bridge");
      }
    });
    await page.waitForTimeout(1200);

    const bixbyPhotos = await page.evaluate(() => {
      const img = document.querySelector("#history-desc-photos img.history-place-photo");
      const caption = document.querySelector("#history-desc-photos .history-photo-caption")?.textContent;
      return { hasImg: !!img, src: img?.src, naturalWidth: img?.naturalWidth, caption };
    });
    console.log("Bixby Bridge description photo check:", bixbyPhotos);
    await page.screenshot({ path: "scripts/lore_modal_bixby_bridge.png" });
    console.log("📸 Screenshot saved: scripts/lore_modal_bixby_bridge.png");

    // 4. Test Elmer's Bottle Tree Ranch
    console.log("Opening Bottle Tree history modal...");
    await page.evaluate(() => {
      const g = window.game;
      if (g && g.hud) {
        g.hud.openHistoryModal("turnout_bottle_tree");
      }
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: "scripts/lore_modal_bottle_tree.png" });
    console.log("📸 Screenshot saved: scripts/lore_modal_bottle_tree.png");

    // Verify canvas pixel content has been drawn (not blank)
    const isDrawn = await page.evaluate(() => {
      const canvas = document.querySelector("#history-modal-photo-canvas");
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonZero = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        if (imgData[i] !== 0 || imgData[i + 1] !== 0 || imgData[i + 2] !== 0) {
          nonZero++;
        }
      }
      return nonZero > (canvas.width * canvas.height * 0.9);
    });

    console.log("Canvas non-zero pixel test:", isDrawn);
    if (!isDrawn) {
      throw new Error("Canvas was blank or failed to render!");
    }

    if (!coyotePhotos.hasImg || !dinerPhotos.hasImg || !bixbyPhotos.hasImg) {
      throw new Error("Description photo element was missing!");
    }

    console.log("✅ PASS: Historical landmark description photos and modal render perfectly!");
  } finally {
    await browser.close();
    if (server) server.kill("SIGTERM");
  }
}

testLoreModalPhoto().catch(err => {
  console.error(err);
  process.exit(1);
});
