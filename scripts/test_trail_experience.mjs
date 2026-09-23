import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--enable-unsafe-swiftshader']});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/');
 await page.waitForFunction(()=>window.game?.physics,{timeout:180000});
 const result=await page.evaluate(()=>{
  const g=window.game,r=g.splineRoad;
  const summit=r.getRoadTransformAtZ(1100,-245).pos;
  const launch=r.getRoadTransformAtZ(1102,-228).pos;
  return {summitY:summit.y,launchY:launch.y,joinDrop:Math.abs(summit.y-launch.y),launchOnDownhill:r.getRoadInfo(launch.x,launch.z).isOnDownhillRoute};
 });
 console.log(JSON.stringify(result,null,2));
 assert.ok(result.joinDrop<1,`Summit/downhill join drops ${result.joinDrop.toFixed(2)}m (must be <1m)`);
 assert.equal(result.launchOnDownhill,true,'Launch must be recognized as downhill');
 assert.deepEqual(errors,[]);
 console.log('PASS: summit/downhill join and runtime errors');
} finally {await browser.close();}
