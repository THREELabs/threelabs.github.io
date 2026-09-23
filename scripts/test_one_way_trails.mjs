import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 await page.waitForFunction(()=>window.game?.physics,{timeout:180000});
 const result=await page.evaluate(async()=>{
  const {TrailTrafficRules}=await import('/src/world/TrailTrafficRules.js');
  const {TrailSpline}=await import('/src/world/TrailSpline.js');
  const {DownhillSpline}=await import('/src/world/DownhillSpline.js');
  const g=window.game, road=g.splineRoad;
  g.gameState.isPaused=true;
  const point=(s,t)=>{const q=s.getPointAt(t);return road.getRoadTransformAtZ(q.z,q.lat).pos;};
  const drive=(s,start,end,count=600)=>{
   const rules=new TrailTrafficRules(road);let p=point(s,start), blocked=null,at=start;
   for(let i=1;i<=count;i++){
    at=start+(end-start)*i/count;const next=point(s,at);blocked=rules.check(p,next);
    if(blocked)break;p=next;
   }
   return {blocked,at};
  };
  const result={
   climb:drive(TrailSpline,0,1),
   descend:drive(DownhillSpline,0,1),
   shortcut:drive(DownhillSpline,1,.8),
   wrongSummitExit:drive(TrailSpline,.94,.8),
   turnAroundDescent:drive(DownhillSpline,.5,.3),
   turnAroundClimb:drive(TrailSpline,.5,.3)
  };
  // No side-entry shortcut. A legitimate approach from the summit is admitted.
  const sideRules=new TrailTrafficRules(road);
  sideRules.check({x:0,y:0,z:0},{x:0,y:0,z:1});
  const middle=point(DownhillSpline,.5), outside={x:middle.x+80,y:middle.y,z:middle.z};
  result.sideEntry=sideRules.check(outside,middle);
  const summitRules=new TrailTrafficRules(road);
  summitRules.check({x:0,y:0,z:0},{x:0,y:0,z:1});
  result.summitEntry=summitRules.check(point(DownhillSpline,0),point(DownhillSpline,.01));
  // A single traversal admits the full climb and subsequent descent.
  const loopRules=new TrailTrafficRules(road);let loopBlocked=null;
  for(const spline of [TrailSpline,DownhillSpline]) {
   let prev=point(spline,0);
   for(let i=1;i<=600;i++) {
    const next=point(spline,i/600);loopBlocked=loopRules.check(prev,next);
    if(loopBlocked) break;prev=next;
   }
   if(loopBlocked) break;
  }
  result.fullLoop=loopBlocked;
  // Approach from the highway across the full trailhead apron, not a teleport
  // directly onto the spline. Both sides of the entrance must remain accessible.
  result.approaches=[];
  for (const offset of [-5,0,5]) {
   const rules=new TrailTrafficRules(road);let blocked=null;
   let prev=road.getRoadTransformAtZ(1010+offset,-5).pos;
   for(let i=1;i<=200;i++) {
    const next=road.getRoadTransformAtZ(1010+offset,-5-22*i/200).pos;
    blocked=rules.check(prev,next); if(blocked)break;prev=next;
   }
   result.approaches.push({offset,blocked});
  }
  result.portalSpacing=point(TrailSpline,0).distanceTo(point(DownhillSpline,1));
  // Runtime physics integration: back up the exit while the Jeep faces downhill.
  const p=g.physics, a=point(DownhillSpline,.97),b=point(DownhillSpline,.96);
  Object.assign(g.gameState,{introState:'driving',isIntroActive:false,isCutsceneActive:false,isServicing:false,isMechanicCinematic:false,isTowing:false,isReadingHistory:false,isZoneMenuOpen:false,isBinocularView:false});
  p.position.copy(a);p.heading=Math.atan2(a.x-b.x,a.z-b.z);p.speed=-5;
  p.trailTrafficRules=new TrailTrafficRules(road);
  const before=p.position.clone();
  p.update(1/60,{throttle:0,brake:0,steer:0});
  result.reverseGear={warning:g.gameState.trailWrongWay,speed:p.speed,moved:Math.hypot(p.position.x-before.x,p.position.z-before.z),wrongGear:g.gameState.isWrongGear};
  const recovery=new TrailTrafficRules(road);
  recovery.initialized=true; // Driver approached from outside, not a legacy save.
  result.exitRecovery={
   rejected:recovery.check(point(DownhillSpline,.98),point(DownhillSpline,.97)),
   retreat:recovery.check(point(DownhillSpline,.97),point(DownhillSpline,.98)),
   stillRejected:recovery.check(point(DownhillSpline,.98),point(DownhillSpline,.97))
  };
  result.vehicleApproaches=[];
  for(const offset of [-5,0,5]) {
   const start=road.getRoadTransformAtZ(1010+offset,-8).pos;
   const end=road.getRoadTransformAtZ(1010+offset,-27).pos;
   p.position.copy(start);p.heading=Math.atan2(end.x-start.x,end.z-start.z);
   p.speed=0;p.lateralVelocity=0;p.verticalVelocity=0;p.driveMode='LOW';
   p.trailTrafficRules=new TrailTrafficRules(road);
   let warning='',wrongGear=false;
   for(let i=0;i<600;i++) {
    p.update(1/60,{throttle:1,brake:0,steer:0});
    warning=g.gameState.trailWrongWay;
    // LOW on asphalt legitimately advises HIGH; assert gear status at the
    // trail mouth, after crossing the highway apron.
    wrongGear = g.gameState.isWrongGear;
    if(warning || p.position.distanceTo(start)>19)break;
   }
   result.vehicleApproaches.push({offset,warning,wrongGear,moved:p.position.distanceTo(start)});
  }
  return result;
 });
 console.log(JSON.stringify(result,null,2));
 assert.equal(result.climb.blocked,null,'Legal ascent blocked');
 assert.equal(result.descend.blocked,null,'Legal descent blocked');
 assert.ok(result.sideEntry,'Side-entry bypass');
 assert.equal(result.summitEntry,null,'Summit entry blocked');
 assert.equal(result.fullLoop,null,'Full loop blocked');
 for(const approach of result.approaches) assert.equal(approach.blocked,null,'Highway approach blocked: '+approach.offset);
 assert.ok(result.portalSpacing>45,'Trail mouths overlap');
 for(const key of ['shortcut','wrongSummitExit','turnAroundDescent','turnAroundClimb'])assert.ok(result[key].blocked,key+' bypass');
 assert.ok(result.reverseGear.warning,'Reverse gear bypass');
 assert.ok(result.reverseGear.moved<0.1,'Wrong-way movement not stopped');
 assert.equal(result.reverseGear.wrongGear,false,'Direction block displayed gear warning');
 assert.ok(result.exitRecovery.rejected);
 assert.equal(result.exitRecovery.retreat,null,'Cannot back out of exit');
 assert.ok(result.exitRecovery.stillRejected,'Retreat unlocked shortcut');
 for(const approach of result.vehicleApproaches) {
  assert.equal(approach.warning,'','Vehicle approach blocked');
  assert.ok(approach.moved>19,'Vehicle stuck at entrance');
  assert.equal(approach.wrongGear,false,'LOW incorrectly rejected at trail mouth');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: legal full routes, wrong portals, turnarounds and reverse-gear physics');
} finally {await browser.close();}
