import { chromium } from 'playwright-core';
const b = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport:{width:1280,height:720}});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto('http://127.0.0.1:5173/');
await p.waitForFunction(()=>window.game?.physics,{timeout:180000});
console.log(JSON.stringify(await p.evaluate(async()=>{
const {TrailSpline}=await import('/src/world/TrailSpline.js');
const {DownhillSpline}=await import('/src/world/DownhillSpline.js');
const g=window.game;
return {zones:Object.keys(g.zoneBuilders),intro:g.gameState.introState,points:[0,.17,.35,.53,.62,.9,1].map(t=>{let s=TrailSpline.getPointAt(t),p=g.splineRoad.getRoadTransformAtZ(s.z,s.lat).pos;return {t,auth:s,world:p,lat:g.splineRoad.getRoadInfo(p.x,p.z).lateralDist}}),downhill:[0,.2,.4,.6,.8,1].map(t=>{let s=DownhillSpline.getPointAt(t),p=g.splineRoad.getRoadTransformAtZ(s.z,s.lat).pos;return {t,auth:s,world:p}})};
}),null,2));
await b.close();
