import { chromium } from 'playwright-core';
import fs from 'node:fs';
const tag=process.argv[2] || 'before';
const out=`/tmp/trail-review-${tag}`; fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:1280,height:720}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{let s=8128;Math.random=()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};});
await page.goto('http://127.0.0.1:5173/');
await page.waitForFunction(()=>window.game?.physics,{timeout:180000});
await page.evaluate(()=>{const g=window.game;g.gameState.isPaused=true;g.cameraManager.update=()=>{};document.querySelectorAll('body > :not(canvas):not(script)').forEach(e=>{if(!e.querySelector('canvas'))e.style.visibility='hidden';});});
const views=[{name:'summit',t:1,eye:[-65,48,68],look:[-8,0,14]},{name:'cougar-ford',t:.17,eye:[-16,8,-24],look:[3,0,10]},{name:'thunder-ford',t:.62,eye:[15,8,25],look:[0,0,-14]},{name:'descent',downhill:true,t:.05,eye:[9,7,-22],look:[-12,-4,14]}];
const reports=[];
for(const v of views){
 reports.push(await page.evaluate(async(v)=>{
 const g=window.game,THREE=window.THREE;
 const {TrailSpline}=await import('/src/world/TrailSpline.js');
 const {DownhillSpline}=await import('/src/world/DownhillSpline.js');
 const sp=(v.downhill?DownhillSpline:TrailSpline).getPointAt(v.t);
 const anchor=g.splineRoad.getRoadTransformAtZ(sp.z,sp.lat).pos;
 g.physics.position.copy(anchor);g.gameState.playerZ=anchor.z;
 const zone=g.zoneBuilders[0].builder;zone.group.visible=true;zone.coyoteRidgeTrail.visible=true;zone.deepTrailGroup.visible=true;
 g.renderer.camera.position.copy(anchor).add(new THREE.Vector3(...v.eye));
 g.renderer.camera.lookAt(anchor.clone().add(new THREE.Vector3(...v.look)));
 g.renderer.camera.updateMatrixWorld(true);
 return {name:v.name,anchor:anchor.toArray(),eye:g.renderer.camera.position.toArray(),metrics:g.renderer.renderer.info.render};
 },v));
 await page.waitForTimeout(350);
 await page.screenshot({path:`${out}/${v.name}.png`});
}
fs.writeFileSync(`${out}/report.json`,JSON.stringify({views:reports,errors},null,2));
console.log(JSON.stringify({out,errors,views:reports},null,2));
await b.close();
if(errors.length)process.exitCode=1;
