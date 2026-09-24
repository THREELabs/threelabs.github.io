import { TrailSpline } from './TrailSpline.js';
import { DownhillSpline } from './DownhillSpline.js';

// Rules operate in world space, just like vehicle movement. Both authored splines
// run in the permitted direction: trailhead -> summit, summit -> highway.
export class TrailTrafficRules {
  constructor(road) {
    this.routes = [this.buildRoute(road, TrailSpline, 'ascent'), this.buildRoute(road, DownhillSpline, 'descent')];
    this.activeRoute = null;
    this.furthest = 0;
    this.descentAdmitted = false;
    this.initialized = false;
  }

  buildRoute(road, spline, id) {
    const points = spline.getSpinePoints(256).map(s => {
      const p = road.getRoadTransformAtZ(s.z, s.lat).pos;
      return { x:p.x, y:p.y, z:p.z, width:s.width, t:s.t, distance:0 };
    });
    for (let i=1;i<points.length;i++) points[i].distance = points[i-1].distance + Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);
    return {id, points};
  }

  project(position) {
    if (position.z < 2440 || position.z > 3100) return null;
    let best = null;
    for (const route of this.routes) {
      for (let i=0;i<route.points.length-1;i++) {
        const a=route.points[i], b=route.points[i+1], dx=b.x-a.x, dz=b.z-a.z;
        const len2=dx*dx+dz*dz;
        if (len2 < 0.000001) continue;
        const u=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/len2));
        const x=a.x+dx*u, z=a.z+dz*u;
        const distance=Math.hypot(position.x-x,position.z-z);
        const width=a.width+(b.width-a.width)*u;
        if (distance > width*0.5+3) continue;
        const y=a.y+(b.y-a.y)*u, t=a.t+(b.t-a.t)*u;
        // The summit clearing is free-roam. Leave enough space to park/turn.
        // Evaluate the complete curve before exempting the summit, otherwise
        // the returning hairpin incorrectly projects onto its earlier segment.
        // Vertical separation disambiguates the overlapping mountain routes.
        const score=distance + Math.abs(position.y-y)*0.65;
        if (!best || score<best.score) best={id:route.id,t,score,distance,
          progress:a.distance+Math.sqrt(len2)*u,
          tx:dx/Math.sqrt(len2),tz:dz/Math.sqrt(len2)};
      }
    }
    return best?.id === 'ascent' && best.t > 0.94 ? null : best;
  }

  /** Return a warning to reject this horizontal movement, otherwise null.
   * Two metres TOTAL rollback lets a crawler back off a rock without driving an
   * entire route backwards. A high-water mark prevents repeated tiny reversals.
   * Deliberately uses displacement, not throttle, gear, heading, or speed sign. */
  check(from, to) {
    const before=this.project(from), after=this.project(to);
    if (!this.initialized) {
      this.initialized=true;
      // A legacy save already on the descent may finish downhill, never climb it.
      this.descentAdmitted=before?.id==='descent';
    }
    if (!after) {
      this.activeRoute=null;
      return null;
    }
    const same=before?.id===after.id;
    const entering=this.activeRoute!==after.id;
    const dx=to.x-from.x, dz=to.z-from.z;
    const forward=dx*after.tx+dz*after.tz;
    if (after.id==='descent' && !this.descentAdmitted) {
      if (after.t<0.10 && forward>=-0.001) this.descentAdmitted=true;
      // A blocked driver must be able to back out toward the highway. This
      // does not admit the descent: subsequent uphill attempts still reject.
      else if (same && after.t>0.90 && (forward>0.001 || after.distance>before.distance+0.001)) return null;
      else return 'DOWNHILL EXIT ONLY • Enter from the summit. Use the 4x4 trail to climb.';
    }
    const start=same ? before.progress : after.progress;
    const peak=entering ? start : Math.max(this.furthest,start);
    // No rollback allowance at the bottom exit or summit end: prevent entry
    // through the wrong portal even at walking speed or in reverse gear.
    const wrongPortal=after.id==='descent' ? after.t>0.90 : after.t>0.89;
    if (forward < -0.001 && (wrongPortal || !same || after.progress<peak-2)) {
      return after.id==='descent'
        ? 'WRONG WAY • Downhill route goes to the highway only.'
        : 'UPHILL ONLY • Continue to the summit; use the express route to return.';
    }
    this.activeRoute=after.id;
    this.furthest=Math.max(peak,after.progress);
    if (after.id==='ascent' && after.t<0.08) this.descentAdmitted=false;
    return null;
  }
}
