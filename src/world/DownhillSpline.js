import * as THREE from 'three';

/**
 * ⚡ COUGAR RIDGE DOWNHILL EXPRESS SPRINT SPLINE
 * High-speed gravity descent route from the Coyote Ridge Summit Overlook (elev 56m)
 * down to Highway 1 Coyote Ridge Turnout (elev 0.1m).
 * Specifically engineered for High-Gear (3rd / Overdrive) downhill cruising.
 */

export const DOWNHILL_WAYPOINTS = [
  // 0: Summit Launch Portal & Staging Gate (elev 56m)
  { t: 0.00, lat: -228.0, z: 1102.0, elev: 56.0, width: 16.0, bank: 0.00 },
  // 1: Granite Gateway Chute (Rapid initial drop through twin monoliths)
  { t: 0.10, lat: -208.0, z: 1122.0, elev: 49.5, width: 14.0, bank: 0.05 },
  // 2: Eagle Ridge High Bank (Banked left sweeper around mountain shoulder)
  { t: 0.22, lat: -176.0, z: 1148.0, elev: 42.0, width: 15.0, bank: 0.08 },
  // 3: Bridalveil Waterfall Approach (Fast canyon descent approaching the rock grotto)
  { t: 0.32, lat: -148.0, z: 1152.0, elev: 35.5, width: 15.0, bank: -0.05 },
  // 4: Bridalveil Waterfall Grotto (Under-Waterfall natural rock arch passage)
  { t: 0.38, lat: -132.0, z: 1142.0, elev: 31.5, width: 14.5, bank: 0.02 },
  // 5: Cougar Fangs Slalom Chicane (Banked S-curve through split granite boulders)
  { t: 0.48, lat: -112.0, z: 1118.0, elev: 26.0, width: 14.0, bank: -0.07 },
  // 6: Mojave Halfpipe Rollercoaster Dip (Compression dip into an acceleration rise)
  { t: 0.60, lat: -92.0,  z: 1075.0, elev: 19.5, width: 15.5, bank: 0.06 },
  // 7: Red Rock Sandstone Chute (Desert willow groves & canyon bluffs)
  { t: 0.72, lat: -74.0,  z: 1038.0, elev: 14.0, width: 16.0, bank: -0.04 },
  // 8: Alluvial Delta Sprint (Wide high-speed canyon exit glide)
  { t: 0.86, lat: -48.0,  z: 998.0,  elev: 7.0,  width: 18.0, bank: 0.02 },
  // 9: Highway 1 Turnout Re-entry Arch (Smooth merge onto Highway 1 turnout apron)
  { t: 1.00, lat: -22.0,  z: 960.0,  elev: 0.1,  width: 22.0, bank: 0.00 }
];

export const DOWNHILL_STAGES = [
  { tMin: 0.00, tMax: 0.16, id: 'summit_chute', name: '⚡ SUMMIT CHUTE & GRANITE GATE', spotterTip: 'Clear the granite gate: carry high-gear momentum down the chute' },
  { tMin: 0.16, tMax: 0.28, id: 'eagle_ridge', name: '🦅 EAGLE RIDGE HIGH BANK', spotterTip: 'Banked left sweeper: hug inner camber line around mountain shoulder' },
  { tMin: 0.28, tMax: 0.44, id: 'waterfall_grotto', name: '🌊 BRIDALVEIL WATERFALL GROTTO', spotterTip: 'Drive under the waterfall: blast straight through cascading water veil!' },
  { tMin: 0.44, tMax: 0.56, id: 'cougar_fangs', name: '🐾 COUGAR FANGS CHICANE', spotterTip: 'Technical S-chicane: watch split boulders on inner apex' },
  { tMin: 0.56, tMax: 0.70, id: 'mojave_halfpipe', name: '🎢 MOJAVE HALFPIPE ROLLERCOASTER', spotterTip: 'Rollercoaster dip: brace for suspension compression and crest jump' },
  { tMin: 0.70, tMax: 0.86, id: 'riparian_chute', name: '🌿 RIPARIAN RED ROCK CHUTE', spotterTip: 'Riparian willow grove: fast sandstone canyon sprint' },
  { tMin: 0.86, tMax: 1.00, id: 'alluvial_delta', name: '🏁 ALLUVIAL DELTA MERGE', spotterTip: 'Finish portal ahead: high-speed glide into Highway 1 turnout' }
];

// Catmull-Rom interpolation helper
function catmullRom(p0, p1, p2, p3, t) {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
         (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
         v0 * t + p1;
}

const SAMPLE_COUNT = 256;
const DOWNHILL_SAMPLES = [];

function initDownhillSamples() {
  const pts = DOWNHILL_WAYPOINTS;
  const n = pts.length;

  for (let s = 0; s <= SAMPLE_COUNT; s++) {
    const globalT = s / SAMPLE_COUNT;

    // Find segment
    let seg = 0;
    for (let i = 0; i < n - 1; i++) {
      if (globalT >= pts[i].t && globalT <= pts[i + 1].t) {
        seg = i;
        break;
      }
    }
    const p1 = pts[seg];
    const p2 = pts[seg + 1];
    const p0 = (seg > 0) ? pts[seg - 1] : {
      lat: p1.lat - (p2.lat - p1.lat),
      z: p1.z - (p2.z - p1.z),
      elev: p1.elev - (p2.elev - p1.elev),
      width: p1.width,
      bank: p1.bank || 0
    };
    const p3 = (seg + 2 < n) ? pts[seg + 2] : {
      lat: p2.lat + (p2.lat - p1.lat),
      z: p2.z + (p2.z - p1.z),
      elev: p2.elev + (p2.elev - p1.elev),
      width: p2.width,
      bank: p2.bank || 0
    };

    const segSpan = p2.t - p1.t;
    const localT = (segSpan > 0.0001) ? (globalT - p1.t) / segSpan : 0;
    const clampedLocalT = Math.max(0, Math.min(1, localT));

    DOWNHILL_SAMPLES.push({
      t: globalT,
      lat: catmullRom(p0.lat, p1.lat, p2.lat, p3.lat, clampedLocalT),
      z: catmullRom(p0.z, p1.z, p2.z, p3.z, clampedLocalT),
      elev: catmullRom(p0.elev, p1.elev, p2.elev, p3.elev, clampedLocalT),
      width: catmullRom(p0.width, p1.width, p2.width, p3.width, clampedLocalT),
      bank: catmullRom(p0.bank || 0, p1.bank || 0, p2.bank || 0, p3.bank || 0, clampedLocalT)
    });
  }
}

initDownhillSamples();

export class DownhillSpline {
  /**
   * Sample downhill point by normalized parameter t in [0, 1]
   */
  static getPointAt(t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const sampleIdx = clampedT * SAMPLE_COUNT;
    const i0 = Math.floor(sampleIdx);
    const i1 = Math.min(SAMPLE_COUNT, i0 + 1);
    const frac = sampleIdx - i0;

    const s0 = DOWNHILL_SAMPLES[i0];
    const s1 = DOWNHILL_SAMPLES[i1];

    return {
      t: clampedT,
      lat: THREE.MathUtils.lerp(s0.lat, s1.lat, frac),
      z: THREE.MathUtils.lerp(s0.z, s1.z, frac),
      elev: THREE.MathUtils.lerp(s0.elev, s1.elev, frac),
      width: THREE.MathUtils.lerp(s0.width, s1.width, frac),
      bank: THREE.MathUtils.lerp(s0.bank || 0, s1.bank || 0, frac)
    };
  }

  /**
   * Query coordinates (latDist, z) against downhill route.
   * Returns null if outside bounding envelope or too far.
   */
  static queryDownhill(latDist, z) {
    // Bounding box for downhill route: latDist in [-250, -12], z in [930, 1175]
    if (latDist < -250.0 || latDist > -12.0 || z < 930.0 || z > 1175.0) {
      return null;
    }

    let minDistSq = Infinity;
    let closestIdx = 0;

    for (let i = 0; i <= SAMPLE_COUNT; i += 2) {
      const s = DOWNHILL_SAMPLES[i];
      const dLat = latDist - s.lat;
      const dZ = z - s.z;
      const dSq = dLat * dLat + dZ * dZ;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestIdx = i;
      }
    }

    // Refine around closest
    const searchStart = Math.max(0, closestIdx - 3);
    const searchEnd = Math.min(SAMPLE_COUNT, closestIdx + 3);
    for (let i = searchStart; i <= searchEnd; i++) {
      const s = DOWNHILL_SAMPLES[i];
      const dLat = latDist - s.lat;
      const dZ = z - s.z;
      const dSq = dLat * dLat + dZ * dZ;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestIdx = i;
      }
    }

    const s = DOWNHILL_SAMPLES[closestIdx];
    const dist = Math.sqrt(minDistSq);
    const halfW = (s.width || 16.0) * 0.5;

    // Reject if further than roadbed + shoulder margin (30m)
    if (dist > halfW + 30.0) {
      return null;
    }

    // Compute banking tilt effect across lateral distance
    const bankAngle = s.bank || 0.0;
    const crossOffset = THREE.MathUtils.clamp((latDist - s.lat) / Math.max(1.0, halfW), -1.0, 1.0);
    const bankLift = crossOffset * bankAngle * halfW * 0.45;

    return {
      t: s.t,
      dist,
      centerlineLat: s.lat,
      centerlineZ: s.z,
      targetElev: s.elev + bankLift,
      baseElev: s.elev,
      width: s.width,
      bank: bankAngle,
      isDownhill: true
    };
  }

  /**
   * Fast check if coordinate is within the driveable downhill route corridor
   */
  static isDownhillRoute(latDist, z) {
    const q = DownhillSpline.queryDownhill(latDist, z);
    if (!q) return false;
    const halfW = (q.width || 16.0) * 0.5;
    return q.dist <= (halfW + 6.0);
  }

  /**
   * Get downhill stage information by normalized t in [0, 1]
   */
  static getStageInfo(t) {
    const clampedT = Math.max(0, Math.min(1, t));
    for (let i = 0; i < DOWNHILL_STAGES.length; i++) {
      const stage = DOWNHILL_STAGES[i];
      if (clampedT >= stage.tMin && clampedT <= stage.tMax) {
        return stage;
      }
    }
    return DOWNHILL_STAGES[0];
  }

  /**
   * Fast check if vehicle is currently passing through the Bridalveil Waterfall Grotto zone
   */
  static isWaterfallGrotto(latDist, z) {
    const q = DownhillSpline.queryDownhill(latDist, z);
    if (!q) return false;
    return q.t >= 0.28 && q.t <= 0.44 && q.dist <= (q.width * 0.5 + 6.0);
  }

  /**
   * Check if vehicle is directly driving through / under the cascading waterfall curtain
   */
  static isUnderWaterfallCurtain(latDist, z) {
    const q = DownhillSpline.queryDownhill(latDist, z);
    if (!q) return false;
    return q.t >= 0.35 && q.t <= 0.41 && q.dist <= (q.width * 0.5 + 2.0);
  }

  /**
   * Precompute spine samples along the route for 3D mesh building
   */
  static getSpinePoints(count = 128) {
    const points = [];
    for (let i = 0; i <= count; i++) {
      points.push(DownhillSpline.getPointAt(i / count));
    }
    return points;
  }
}
