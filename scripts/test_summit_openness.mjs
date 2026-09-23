import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out = process.env.OUT || '/tmp/summit-open-review';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1280,height:720}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/',{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>window.game?.physics,{timeout:180000});
 const result=await page.evaluate(async()=>{
  const g=window.game, r=g.splineRoad, T=window.THREE;
  const {SUMMIT_LAYOUT,isInsideSummitClearing}=await import('/src/world/TrailExperience.js');
  const anchor=r.getRoadTransformAtZ(1100,-245).pos;
  const launch=r.getRoadTransformAtZ(1102,-228).pos;
  const scene=window.__THREE_GAME_DIAGNOSTICS__.getScene();
  g.gameState.isPaused=true; g.cameraManager.update=()=>{};
  g.physics.position.copy(anchor);g.gameState.playerZ=anchor.z;
  const zone=g.zoneBuilders[0].builder;
  zone.group.visible=true;zone.coyoteRidgeTrail.visible=true;zone.deepTrailGroup.visible=true;
  document.querySelectorAll('body > :not(canvas):not(script)').forEach(e=>{if(!e.querySelector('canvas'))e.style.visibility='hidden';});
  const pads=Object.entries(SUMMIT_LAYOUT).map(([key,p])=>({key,x:p.x,z:p.z,ground:r.getGroundElevation(anchor.x+p.x,anchor.z+p.z)}));
  const named=[];scene.traverse(o=>{if(/Summit|Pine|Aspen/.test(o.name))named.push({name:o.name,type:o.type,children:o.children.length,count:o.count,position:o.getWorldPosition(new T.Vector3()).toArray()});});
  const ground=[];for(let x=-4;x<=28;x+=4)for(let z=4;z<=28;z+=4)ground.push(r.getGroundElevation(anchor.x+x,anchor.z+z));
  const obstacles=g.obstacleSystem?.staticObstacles || g.physics.obstacleSystem?.staticObstacles || [];
  const terrace=scene.getObjectByName('SummitGravelTerrace');
  const verts=terrace.geometry.attributes.position;
  let terraceMin=Infinity,terraceMax=-Infinity,maxDrapeError=0;
  for(let i=0;i<verts.count;i++) {
   const p=new T.Vector3().fromBufferAttribute(verts,i).applyMatrix4(terrace.matrixWorld);
   terraceMin=Math.min(terraceMin,p.y);terraceMax=Math.max(terraceMax,p.y);
   maxDrapeError=Math.max(maxDrapeError,Math.abs(p.y-r.getGroundElevation(p.x,p.z)-0.1));
  }
  let vegetationInside=0,vegetationSamples=0;
  scene.traverse(o=>{
   if(!o.isInstancedMesh || !/^Instanced_(Pine|Aspen|Downed|Wildflower)/.test(o.name))return;
   for(let i=0;i<o.count;i++){
    const m=new T.Matrix4();o.getMatrixAt(i,m);
    const p=new T.Vector3().setFromMatrixPosition(m).applyMatrix4(o.matrixWorld);
    vegetationSamples++;
    if(isInsideSummitClearing(p.x-anchor.x,p.z-anchor.z,6.99))vegetationInside++;
   }
  });
  const summitObstacles=obstacles.filter(o=>/Summit/.test(o.name));
  const blockedTurning=summitObstacles.filter(o=>o.maxX>anchor.x+5&&o.minX<anchor.x+32&&o.maxZ>anchor.z+4&&o.minZ<anchor.z+29);
  return {anchor:anchor.toArray(),joinDrop:Math.abs(anchor.y-launch.y),launchOnDownhill:r.getRoadInfo(launch.x,launch.z).isOnDownhillRoute,pads,groundRange:[Math.min(...ground),Math.max(...ground)],terraceRange:[terraceMin,terraceMax],maxDrapeError,blockedTurning,vegetationInside,vegetationSamples,named,obstacles:summitObstacles};
 });
 for(const v of [{name:'overview',eye:[-65,48,80],look:[7,0,23]},{name:'arrival',eye:[4,3,3],look:[15,2,35]},{name:'deck',eye:[20,3,22],look:[-15,2,-10]}]){
  await page.evaluate(({v,anchor})=>{const g=window.game,T=window.THREE;g.renderer.camera.position.set(...anchor).add(new T.Vector3(...v.eye));g.renderer.camera.lookAt(new T.Vector3(...anchor).add(new T.Vector3(...v.look)));g.renderer.camera.updateMatrixWorld(true);},{v,anchor:result.anchor});
  await page.waitForTimeout(800);await page.screenshot({path:`${out}/${v.name}.png`,timeout:180000});
 }
 result.errors=errors;fs.writeFileSync(`${out}/report.json`,JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 assert.ok(result.joinDrop<1,'Summit/downhill join <1m');assert.equal(result.launchOnDownhill,true);assert.deepEqual(errors,[]);
 assert.equal(result.pads.length,6);
 for(const p of result.pads)assert.ok(Math.abs(p.ground-result.anchor[1])<0.5,`${p.key} on level summit ground`);
 assert.ok(result.groundRange[1]-result.groundRange[0]<0.2,'Level turning area');
 assert.equal(result.obstacles.length,8,'Summit colliders loaded');
 assert.deepEqual(result.blockedTurning,[],'27x25m turning area clear of summit colliders');
 assert.ok(result.vegetationSamples>0,'Vegetation tested');assert.equal(result.vegetationInside,0,'Vegetation setback clear');
 assert.ok(result.maxDrapeError<0.03,'Gravel follows physical terrain');
 console.log('PASS: level pads, clear turning area, vegetation setback, gravel grounding, descent join and runtime; three views captured');
} finally {await browser.close();}
