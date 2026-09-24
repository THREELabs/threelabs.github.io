import * as THREE from 'three';

/**
 * 🏔️ COUGAR RIDGE GRAND 4x4 EXPEDITION TRAIL SPLINE
 * 1,200+ meter multi-stage mountain canyon expedition route with water streams & waterfalls.
 */

export const TRAIL_WAYPOINTS = [
  // 0: Staging Area & Air-Down Basin (Turnout entrance)
  { t: 0.00, lat: -22.0,  z: 2550.0, elev: 0.1,  width: 14.0 },
  // 1: Lower Canyon Red Rock Wash & S-Curves
  { t: 0.08, lat: -55.0,  z: 2600.0, elev: 6.5,  width: 11.0 },
  // 2: Cougar Creek Lower Stream Crossing & River Pebble Ford
  { t: 0.17, lat: -95.0,  z: 2680.0, elev: 13.0, width: 11.5 },
  // 3: Cougar Creek Canyon Run & Rushing Rapids
  { t: 0.26, lat: -135.0, z: 2770.0, elev: 20.0, width: 12.0 },
  // 4: Cougar Falls Scenic Vista Overlook & Hairpin Turn
  { t: 0.35, lat: -155.0, z: 2850.0, elev: 26.0, width: 16.0 },
  // 5: Boulder Canyon Technical Rock Crawl Arena
  { t: 0.44, lat: -195.0, z: 2930.0, elev: 33.0, width: 13.5 },
  // 6: Thunder Canyon & Roaring Thunder Falls Vista
  { t: 0.53, lat: -250.0, z: 2990.0, elev: 39.0, width: 15.0 },
  // 7: Thunder Creek Waterfall Ford & Step Cascades
  { t: 0.62, lat: -290.0, z: 2920.0, elev: 43.5, width: 12.5 },
  // 8: Devil's Backbone Knife-Edge Alpine Ridge Traverse
  { t: 0.72, lat: -295.0, z: 2800.0, elev: 48.0, width: 9.5  },
  // 9: Devil's Shelf Cascading Waterfall Rock Ledges
  { t: 0.81, lat: -275.0, z: 2710.0, elev: 52.0, width: 11.0 },
  // 10: Hanging Valley Ponderosa Pine Forest Grove
  { t: 0.90, lat: -255.0, z: 2610.0, elev: 54.5, width: 13.0 },
  // 11: Grand Summit Vista Plateau & Cantilever Skybridge
  { t: 1.00, lat: -245.0, z: 2640.0, elev: 56.0, width: 26.0 }
];

export const STREAM_CROSSINGS = [
  {
    id: 'cougar_creek',
    name: 'Cougar Creek Grand River Crossing',
    tMin: 0.132,
    tMax: 0.265,
    centerLat: -115.0,
    centerZ: 2725.0,
    radius: 85.0,
    waterLevelOffset: 0.08,
    depth: 0.30,
    flowDir: new THREE.Vector2(0.65, -0.76)
  },
  {
    id: 'thunder_creek',
    name: 'Thunder Creek Waterfall Ford',
    tMin: 0.59,
    tMax: 0.66,
    centerLat: -290.0,
    centerZ: 2920.0,
    radius: 38.0,
    waterLevelOffset: 0.08,
    depth: 0.32,
    flowDir: new THREE.Vector2(-0.70, -0.71)
  }
];

// Backwards compatibility for single stream crossing references
export const STREAM_CROSSING = STREAM_CROSSINGS[0];

export const WATERFALL_VIEW_AREAS = [
  {
    id: 'cougar_falls',
    name: 'Cougar Falls Scenic Vista',
    t: 0.35,
    lat: -155.0,
    z: 2850.0,
    elev: 26.0,
    radius: 32.0,
    waterfallPos: { lat: -200.0, z: 2830.0, topElev: 48.0, midElev: 36.5, plungeElev: 25.0 }
  },
  {
    id: 'thunder_falls',
    name: 'Thunder Falls Grand Amphitheater',
    t: 0.53,
    lat: -250.0,
    z: 2990.0,
    elev: 39.0,
    radius: 36.0,
    waterfallPos: { lat: -275.0, z: 3025.0, topElev: 65.0, midElev: 48.0, plungeElev: 35.0 }
  }
];

// Backwards compatibility for single waterfall reference
export const WATERFALL_VIEW_AREA = WATERFALL_VIEW_AREAS[0];

/**
 * 🧗 TECHNICAL TRAIL ZONES (STRICTLY REQUIRE 1ST LOW GEAR)
 * Traversing these sections in 2nd/MID or 3rd/HIGH gear causes intense chassis bucking,
 * suspension bottoming out, metal crunch SFX, sparks, and progressive vehicle damage.
 */
export const TECHNICAL_TRAIL_ZONES = [
  {
    id: 'cougar_mud_and_creek',
    name: 'Cougar Creek Extended Riverbed & Mud Bogs',
    shortName: 'EXTENDED RIVERBED & BOULDERS',
    tMin: 0.105,
    tMax: 0.290,
    requiredGear: 'LOW',
    maxSafeSpeedMph: 12.0,
    roughnessFactor: 2.2,
    terrainType: 'mud_riverbed',
    warning: 'EXTENDED RIVERBED & BOULDERS • SHIFT TO 1ST LOW GEAR',
    spotterTip: 'Extended riverbed & rocks: crawl in 1st Low or your suspension will bottom out!'
  },
  {
    id: 'boulder_canyon_arena',
    name: 'Boulder Canyon Technical Rock Crawl',
    shortName: 'EXTREME ROCK CRAWL',
    tMin: 0.40,
    tMax: 0.50,
    requiredGear: 'LOW',
    maxSafeSpeedMph: 10.0,
    roughnessFactor: 3.2,
    terrainType: 'rock_crawl',
    warning: 'EXTREME ROCK CRAWL ARENA • STRICTLY 1ST LOW GEAR',
    spotterTip: 'Granite boulder field! 2nd gear will smash your skid plate — drop to 1st LOW!'
  },
  {
    id: 'thunder_waterfall_ford',
    name: 'Thunder Creek Waterfall Ford & Rapids',
    shortName: 'WATERFALL RAPIDS FORD',
    tMin: 0.58,
    tMax: 0.67,
    requiredGear: 'LOW',
    maxSafeSpeedMph: 11.0,
    roughnessFactor: 2.4,
    terrainType: 'water_rapids',
    warning: 'RUSHING WATERFALL FORD • 1ST LOW GEAR REQUIRED',
    spotterTip: 'Waterfall torrent & slick river rock! Maintain steady crawl in 1st LOW!'
  },
  {
    id: 'devils_backbone_ridge',
    name: "Devil's Backbone Alpine Knife-Edge",
    shortName: 'KNIFE-EDGE RIDGE',
    tMin: 0.68,
    tMax: 0.77,
    requiredGear: 'LOW',
    maxSafeSpeedMph: 14.0,
    roughnessFactor: 1.9,
    terrainType: 'ridge_traverse',
    warning: "KNIFE-EDGE CLIFF RIDGE • 1ST LOW GEAR RECOMMENDED",
    spotterTip: 'Sheer cliff drops on both sides! Slow crawl in 1st LOW for maximum wheel control!'
  },
  {
    id: 'devils_shelf_cascades',
    name: "Devil's Shelf Stepped Rock Cascades",
    shortName: 'STEPPED ROCK SHELVES',
    tMin: 0.78,
    tMax: 0.86,
    requiredGear: 'LOW',
    maxSafeSpeedMph: 10.0,
    roughnessFactor: 2.8,
    terrainType: 'stepped_shelf',
    warning: "STEPPED ROCK LEDGES • 1ST LOW GEAR REQUIRED",
    spotterTip: 'Cascading stone ledges! Let your lockers crawl in 1st LOW to climb each tier!'
  }
];

/**
 * 🌊 3D MUD BOG & PUDDLE BASIN LOCATIONS
 */
export const MUD_BOG_ZONES = [
  {
    id: 'cougar_entry_bog',
    name: 'Cougar Creek Approach Mud Slurry',
    tMin: 0.105,
    tMax: 0.132,
    centerLat: -68.0,
    centerZ: 2625.0,
    radius: 18.0,
    depth: 0.35,
    dragFactor: 2.6
  },
  {
    id: 'cougar_exit_bog',
    name: 'Cougar Creek Exit Deep Mud Basin',
    tMin: 0.265,
    tMax: 0.290,
    centerLat: -138.0,
    centerZ: 2780.0,
    radius: 20.0,
    depth: 0.40,
    dragFactor: 2.8
  },
  {
    id: 'thunder_outflow_bog',
    name: 'Thunder Falls Muddy Outflow Flat',
    tMin: 0.575,
    tMax: 0.60,
    centerLat: -270.0,
    centerZ: 2960.0,
    radius: 18.0,
    depth: 0.35,
    dragFactor: 2.7
  },
  {
    id: 'hanging_valley_bog',
    name: 'Hanging Valley Forest Soil Mud Ruts',
    tMin: 0.87,
    tMax: 0.92,
    centerLat: -260.0,
    centerZ: 2625.0,
    radius: 22.0,
    depth: 0.30,
    dragFactor: 2.3
  }
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

// Precompute dense spine samples for sub-millimeter evaluation speed
const SAMPLE_COUNT = 384;
const SPINE_SAMPLES = [];

function initSpineSamples() {
  const pts = TRAIL_WAYPOINTS;
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
      width: p1.width
    };
    const p3 = (seg < n - 2) ? pts[seg + 2] : {
      lat: p2.lat + (p2.lat - p1.lat),
      z: p2.z + (p2.z - p1.z),
      elev: p2.elev + (p2.elev - p1.elev),
      width: p2.width
    };

    const localT = (globalT - p1.t) / (p2.t - p1.t);
    const clampedT = Math.max(0, Math.min(1, localT));

    const lat = catmullRom(p0.lat, p1.lat, p2.lat, p3.lat, clampedT);
    const z = catmullRom(p0.z, p1.z, p2.z, p3.z, clampedT);
    const elev = catmullRom(p0.elev, p1.elev, p2.elev, p3.elev, clampedT);
    const width = THREE.MathUtils.lerp(p1.width, p2.width, clampedT);

    SPINE_SAMPLES.push({ t: globalT, lat, z, elev, width });
  }
}
initSpineSamples();

export class TrailSpline {
  /**
   * Sample trail point by normalized parameter t in [0, 1]
   */
  static getPointAt(t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const sampleIdx = clampedT * SAMPLE_COUNT;
    const i0 = Math.floor(sampleIdx);
    const i1 = Math.min(SAMPLE_COUNT, i0 + 1);
    const frac = sampleIdx - i0;

    const s0 = SPINE_SAMPLES[i0];
    const s1 = SPINE_SAMPLES[i1];

    return {
      t: clampedT,
      lat: THREE.MathUtils.lerp(s0.lat, s1.lat, frac),
      z: THREE.MathUtils.lerp(s0.z, s1.z, frac),
      elev: THREE.MathUtils.lerp(s0.elev, s1.elev, frac),
      width: THREE.MathUtils.lerp(s0.width, s1.width, frac)
    };
  }

  /**
   * Project a 2D world coordinate (latDist, z) onto the trail
   * Returns: { closestT, dist, centerlineLat, centerlineZ, targetElev, width, inSummitPlateau, rockBump }
   */
  static queryTrail(latDist, z) {
    // Quick bounding box rejection across full 1,200m expedition wilderness
    if (latDist > -14.0 || latDist < -420.0 || z < 2460.0 || z > 3100.0) {
      return null;
    }

    // Find closest spine sample
    let minDistSq = Infinity;
    let closestIdx = 0;

    for (let i = 0; i <= SAMPLE_COUNT; i += 3) {
      const s = SPINE_SAMPLES[i];
      const dLat = latDist - s.lat;
      const dZ = z - s.z;
      const dSq = dLat * dLat + dZ * dZ;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestIdx = i;
      }
    }

    // Refine around closest sample
    const searchStart = Math.max(0, closestIdx - 4);
    const searchEnd = Math.min(SAMPLE_COUNT, closestIdx + 4);
    for (let i = searchStart; i <= searchEnd; i++) {
      const s = SPINE_SAMPLES[i];
      const dLat = latDist - s.lat;
      const dZ = z - s.z;
      const dSq = dLat * dLat + dZ * dZ;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestIdx = i;
      }
    }

    const s = SPINE_SAMPLES[closestIdx];
    const dist = Math.sqrt(minDistSq);

    let targetElev = s.elev;
    const trailT = s.t;

    // Technical obstacle micro-elevations along the trail:
    if (trailT >= 0.132 && trailT <= 0.265) {
      // Cougar Creek Riverbed articulation moguls
      const rutSide = Math.sin(trailT * 48.0);
      const crossOffset = THREE.MathUtils.clamp((latDist - s.lat) / 3.2, -1.0, 1.0);
      targetElev += rutSide * 0.32 * crossOffset;
    } else if (trailT >= 0.32 && trailT <= 0.38) {
      // Cougar Hairpin Banked Turn
      const bankOffset = THREE.MathUtils.clamp((latDist - s.lat) / 4.0, -1.0, 1.0);
      targetElev += bankOffset * 0.22;
    } else if (trailT >= 0.40 && trailT <= 0.48) {
      // Boulder Canyon Crawl Arena Moguls
      const bMogul = Math.sin(trailT * 64.0) * Math.cos((latDist - s.lat) * 0.8);
      targetElev += bMogul * 0.35;
    } else if (trailT >= 0.58 && trailT <= 0.65) {
      // Thunder Creek Waterfall Ford river rocks & rapids swell
      const rapWave = Math.sin(trailT * 55.0);
      targetElev += rapWave * 0.28;
    } else if (trailT >= 0.78 && trailT <= 0.85) {
      // Devil's Shelf Stepped Cascading Waterfall Rock Shelves
      const shelfProgress = (trailT - 0.78) / 0.07;
      const stepFreq = shelfProgress * 4.0;
      const stepFrac = stepFreq - Math.floor(stepFreq);
      const stepRise = (stepFrac < 0.25) ? (stepFrac / 0.25) * 0.75 : 0.75;
      targetElev += (stepRise - 0.35);
    }

    // Summit Plateau Area: covers timber observation deck, boardwalk bridge, cantilever promontory (Elev: 56.0m)
    const inSummitPlateau = (latDist <= -185.0 && latDist >= -320.0 && z >= 2560.0 && z <= 2720.0);
    if (inSummitPlateau) {
      targetElev = 56.0;
    }

    // Add rock crawler obstacle elevation so vehicle rolls OVER rocks instead of clipping
    const rockBump = TrailSpline.getRockHeightAt(latDist, z);
    targetElev += rockBump;

    return {
      t: trailT,
      dist,
      centerlineLat: s.lat,
      centerlineZ: s.z,
      targetElev,
      width: s.width,
      inSummitPlateau,
      rockBump
    };
  }

  /**
   * Sample technical rock crawl obstacle height at (latDist, z)
   */
  static getRockHeightAt(latDist, z) {
    let maxBump = 0;
    for (let i = 0; i < TRAIL_ROCK_OBSTACLES.length; i++) {
      const rock = TRAIL_ROCK_OBSTACLES[i];
      const dLat = latDist - rock.lat;
      const dZ = z - rock.z;
      const distSq = dLat * dLat + dZ * dZ;
      const rSq = rock.radius * rock.radius;
      if (distSq < rSq) {
        const factor = 1.0 - distSq / rSq;
        const bump = rock.type === 'slab'
          ? rock.height * Math.min(1.0, factor * 2.5)
          : rock.height * Math.sqrt(factor);
        if (bump > maxBump) maxBump = bump;
      }
    }
    return maxBump;
  }

  /**
   * Check if coordinates lie within any mountain stream crossing ford
   */
  static isStreamCrossing(latDist, z) {
    const q = TrailSpline.queryTrail(latDist, z);
    for (let i = 0; i < STREAM_CROSSINGS.length; i++) {
      const sc = STREAM_CROSSINGS[i];
      if (q && q.t >= sc.tMin && q.t <= sc.tMax && q.dist <= (q.width * 0.5 + 8.0)) {
        return sc;
      }
      const dLat = latDist - sc.centerLat;
      const dZ = z - sc.centerZ;
      if ((dLat * dLat + dZ * dZ) <= (sc.radius * sc.radius)) {
        return sc;
      }
    }
    return null;
  }

  /**
   * Check if coordinates lie within any scenic waterfall view turnout
   */
  static isWaterfallViewArea(latDist, z) {
    for (let i = 0; i < WATERFALL_VIEW_AREAS.length; i++) {
      const wf = WATERFALL_VIEW_AREAS[i];
      const dLat = latDist - wf.lat;
      const dZ = z - wf.z;
      if ((dLat * dLat + dZ * dZ) <= (wf.radius * wf.radius)) {
        return wf;
      }
    }
    return null;
  }

  /**
   * Check if location requires 1st LOW gear crawl due to technical zones,
   * active mud bog, stream crossings, technical rock obstacles, or steep grade.
   */
  static isTechnicalClimb(latDist, z, pitch = 0) {
    const techSec = TrailSpline.getTechnicalSectionInfo(latDist, z);
    if (techSec) return { isTechnical: true, reason: techSec.name, zone: techSec };
    const mud = TrailSpline.isMudBog ? TrailSpline.isMudBog(latDist, z) : null;
    if (mud) return { isTechnical: true, reason: mud.name, zone: mud };
    const stream = TrailSpline.isStreamCrossing ? TrailSpline.isStreamCrossing(latDist, z) : null;
    if (stream) return { isTechnical: true, reason: stream.name, zone: stream };
    const rockBump = TrailSpline.getRockHeightAt ? TrailSpline.getRockHeightAt(latDist, z) : 0;
    if (rockBump > 0.18) return { isTechnical: true, reason: 'ROCK CRAWL OBSTACLES', rockBump };
    if (pitch < -0.16) return { isTechnical: true, reason: 'STEEP TECHNICAL INCLINE' };
    return { isTechnical: false };
  }

  /**
   * Query if coordinates fall into any technical trail section strictly requiring 1st LOW gear
   */
  static getTechnicalSectionInfo(latDist, z) {
    const q = TrailSpline.queryTrail(latDist, z);
    if (!q) return null;
    const t = q.t;
    for (let i = 0; i < TECHNICAL_TRAIL_ZONES.length; i++) {
      const sec = TECHNICAL_TRAIL_ZONES[i];
      if (t >= sec.tMin && t <= sec.tMax) {
        return {
          ...sec,
          t,
          distToCenter: q.dist
        };
      }
    }
    return null;
  }

  /**
   * Query if coordinates are inside a thick mud bog or mud slurry basin
   */
  static isMudBog(latDist, z) {
    const q = TrailSpline.queryTrail(latDist, z);
    if (!q) return null;
    const t = q.t;
    for (let i = 0; i < MUD_BOG_ZONES.length; i++) {
      const mb = MUD_BOG_ZONES[i];
      if (t >= mb.tMin && t <= mb.tMax) {
        return mb;
      }
      const dLat = latDist - mb.centerLat;
      const dZ = z - mb.centerZ;
      if ((dLat * dLat + dZ * dZ) <= (mb.radius * mb.radius)) {
        return mb;
      }
    }
    return null;
  }

  /**
   * Dense spine points array for 3D roadbed mesh generation
   */
  static getSpinePoints(count = 256) {
    const points = [];
    for (let i = 0; i <= count; i++) {
      points.push(TrailSpline.getPointAt(i / count));
    }
    return points;
  }
}

export const TRAIL_ROCK_OBSTACLES = [
  // 1: Cougar Creek Stream Crossing riverbed stones & articulation wash (Stage 2-3, t ≈ 0.135 - 0.265)
  { t: 0.140, lat: -80.0,  z: 2650.0, radius: 2.4, height: 0.52, type: 'dome', name: 'Riverbed Entry Cobblestone' },
  { t: 0.155, lat: -88.0,  z: 2665.0, radius: 2.6, height: 0.60, type: 'dome', name: 'Lower Creek Stone 1' },
  { t: 0.170, lat: -93.0,  z: 2680.0, radius: 2.5, height: 0.55, type: 'dome', name: 'Cougar Ford Bank Rock' },
  { t: 0.185, lat: -103.0, z: 2698.0, radius: 2.8, height: 0.65, type: 'dome', name: 'Lower Creek Mid Slab' },
  { t: 0.200, lat: -109.0, z: 2715.0, radius: 2.6, height: 0.58, type: 'dome', name: 'Riverbed Center Boulder' },
  { t: 0.215, lat: -116.0, z: 2735.0, radius: 2.7, height: 0.65, type: 'dome', name: 'Rapids Boulder 1' },
  { t: 0.230, lat: -123.0, z: 2745.0, radius: 2.5, height: 0.56, type: 'dome', name: 'Canyon Rapids Stone' },
  { t: 0.245, lat: -128.0, z: 2755.0, radius: 2.9, height: 0.70, type: 'dome', name: 'Rapids Boulder 2' },
  { t: 0.258, lat: -134.0, z: 2768.0, radius: 2.7, height: 0.62, type: 'slab', name: 'Riverbed Exit Threshold Slab' },

  // 2: Boulder Canyon Technical Rock Crawl Arena (Stage 5-6)
  { t: 0.410, lat: -180.0, z: 2905.0, radius: 3.2, height: 0.85, type: 'dome', name: 'Sledgehammer Rock 1' },
  { t: 0.425, lat: -188.0, z: 2918.0, radius: 3.1, height: 0.88, type: 'slab', name: 'Crawl Incline Wedge' },
  { t: 0.440, lat: -195.0, z: 2930.0, radius: 3.4, height: 0.92, type: 'dome', name: 'Boulder Arena Apex' },
  { t: 0.455, lat: -205.0, z: 2945.0, radius: 3.2, height: 0.90, type: 'slab', name: 'Center Shelf Step' },
  { t: 0.470, lat: -218.0, z: 2960.0, radius: 3.5, height: 0.92, type: 'dome', name: 'Granite Apex Boulder' },
  { t: 0.490, lat: -232.0, z: 2975.0, radius: 3.3, height: 0.88, type: 'dome', name: 'Thunder Canyon Gate Rock' },

  // 3: Thunder Creek Waterfall Ford riverbed stones & rapids (Stage 7-8)
  { t: 0.595, lat: -278.0, z: 2945.0, radius: 2.8, height: 0.65, type: 'dome', name: 'Thunder Creek Approach Stone' },
  { t: 0.615, lat: -282.0, z: 2925.0, radius: 2.6, height: 0.58, type: 'dome', name: 'Thunder Ford Bank Stone' },
  { t: 0.630, lat: -292.0, z: 2910.0, radius: 3.0, height: 0.70, type: 'slab', name: 'Thunder Creek Exit Ledge' },

  // 4: Devil's Shelf Cascading Waterfall Rock Ledges (Stage 9-10)
  { t: 0.785, lat: -282.0, z: 2745.0, radius: 5.0, height: 0.65, type: 'slab', name: 'Shelf Tier 1' },
  { t: 0.805, lat: -276.0, z: 2715.0, radius: 5.2, height: 0.65, type: 'slab', name: 'Shelf Tier 2' },
  { t: 0.820, lat: -272.0, z: 2695.0, radius: 4.8, height: 0.68, type: 'slab', name: 'Cascade Ledge' },
  { t: 0.835, lat: -268.0, z: 2675.0, radius: 5.0, height: 0.65, type: 'slab', name: 'Shelf Tier 3' },
  { t: 0.850, lat: -264.0, z: 2655.0, radius: 4.6, height: 0.70, type: 'slab', name: 'Summit Threshold Slab' }
];
