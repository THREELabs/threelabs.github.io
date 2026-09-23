// The dome IS rendering but appears gray — likely the toon gradient lighting is not
// applied (MeshBasicMaterial ignores lights) so it should show raw texture colors.
// Gray = the TEXTURE itself renders gray?? The skyGradient canvas: 4x256 with gradient
// from #1a4f8b to #e4a058. That should be blue->orange, not gray.
// UNLESS tone mapping (ACES) + srgb double-conversion washes it out.
// Test: hide everything except dome and sample:
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-gl=angle','--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5174/', { waitUntil: 'load' });
await page.waitForTimeout(10000);
await page.evaluate(() => {
  const g = window.game;
  g.renderer.scene.traverse(o => { if ((o.isMesh || o.isPoints) && o !== g.renderer.scene.children.find(c => c.type === 'Group' && c.children.length === 1)) o.visible = false; });
});
// hide all groups except the single-child group (dome)
await page.evaluate(() => {
  const g = window.game;
  g.renderer.scene.children.forEach(o => {
    if (o.isGroup && o.children.length !== 1) o.visible = false;
    else if (o.isGroup) {
      // check child is our dome (sphere radius 2600)
      const kid = o.children[0];
      if (!(kid.geometry && kid.geometry.parameters && kid.geometry.parameters.radius > 2000)) o.visible = false;
    }
  });
});
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/dome_alone.png' });
console.log('done');
await browser.close();
