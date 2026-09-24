import * as THREE from 'three';
import { SCENIC_PARKING_LOTS, AUTO_REPAIR_SHOPS } from './SplineRoad.js';
import { ROAD } from '../constants.js';
import { TrailSpline } from './TrailSpline.js';
import { DownhillSpline } from './DownhillSpline.js';

export function calculateTerrainHeight(x, z, roadInfo) {
  const roadY = roadInfo ? roadInfo.roadY : 0;
  const latDist = roadInfo ? (roadInfo.lateralDist !== undefined ? roadInfo.lateralDist : (x - roadInfo.roadPoint.x)) : x;
  // Spline waypoints use highway arc distance, not world Z (up to 25m apart here).
  const routeZ = roadInfo?.routeZ ?? z;
  const isRightSide = latDist > 0;
  const absDist = Math.abs(latDist);
  const roadHalfW = ROAD.HALF_WIDTH; // 16.0m

  // 1. Scenic Parking Lots & Turnouts (Level with highway deck)
  if (roadInfo && SCENIC_PARKING_LOTS) {
    for (let i = 0; i < SCENIC_PARKING_LOTS.length; i++) {
      const lot = SCENIC_PARKING_LOTS[i];
      const dz = Math.abs(z - lot.z);
      if (dz <= lot.length * 0.5 + 16.0) {
        const isRightLot = lot.side === 'right';
        const lotMinLat = isRightLot ? (roadHalfW - 1.0) : (lot.xOffset - lot.width * 0.5 - 4.0);
        const lotMaxLat = isRightLot ? (lot.xOffset + lot.width * 0.5 + 4.0) : -(roadHalfW - 1.0);
        if (latDist >= lotMinLat && latDist <= lotMaxLat) {
          if (lot.id === 'turnout_coyote_ridge' && latDist < -22.0) {
            const downhillQuery = DownhillSpline.queryDownhill(latDist, routeZ);
            if (downhillQuery && downhillQuery.dist <= (downhillQuery.width * 0.5 + 4.0)) {
              const blendT = THREE.MathUtils.clamp((-latDist - 22.0) / 12.0, 0, 1);
              const smoothBlend = blendT * blendT * (3.0 - 2.0 * blendT);
              return THREE.MathUtils.lerp(roadY, roadY + downhillQuery.targetElev, smoothBlend);
            }
            const trailQuery = TrailSpline.queryTrail(latDist, routeZ);
            if (trailQuery) {
              const blendT = THREE.MathUtils.clamp((-latDist - 22.0) / 12.0, 0, 1);
              const smoothBlend = blendT * blendT * (3.0 - 2.0 * blendT);
              return THREE.MathUtils.lerp(roadY, roadY + trailQuery.targetElev, smoothBlend);
            }
          }
          return roadY;
        }
      }
    }
  }

  // 2. Auto Repair Shops (Level with highway deck)
  if (roadInfo && AUTO_REPAIR_SHOPS) {
    for (let i = 0; i < AUTO_REPAIR_SHOPS.length; i++) {
      const shop = AUTO_REPAIR_SHOPS[i];
      const dz = Math.abs(z - shop.z);
      if (dz <= shop.length * 0.5 + 36.0) {
        const isRightShop = shop.side === 'right';
        const shopMinLat = isRightShop ? (roadHalfW - 3.0) : (shop.xOffset - shop.width * 0.5 - 10.0);
        const shopMaxLat = isRightShop ? (shop.xOffset + shop.width * 0.5 + 10.0) : -(roadHalfW - 3.0);
        if (latDist >= shopMinLat && latDist <= shopMaxLat) {
          return roadY;
        }
      }
    }
  }

  // 3. Direct Asphalt Highway Deck & Shoulder (0m to 17.5m from road centerline)
  if (absDist <= roadHalfW + 1.5) {
    return roadY;
  }

  // 4. Smooth Shoulder Transition Buffer (17.5m -> 32.0m)
  // Cubic smoothstep ensures 0 slope discontinuity right at the asphalt edge
  const rawT = THREE.MathUtils.clamp((absDist - (roadHalfW + 1.5)) / 14.5, 0, 1);
  const shoulderBlend = rawT * rawT * (3.0 - 2.0 * rawT);

  // 5. Zone-specific natural terrain offset relative to road grade
  let terrainOffset = 0;

  // Zone 0: Mojave Desert (Z < 6500m) - Rolling sand dunes & desert ridge slopes
  if (z < 6500) {
    const rawDune = Math.sin(x * 0.022 + z * 0.014) * 2.8 + Math.cos(x * 0.045 - z * 0.025) * 1.5;
    const ridge = absDist > 30 ? Math.min(22.0, (absDist - 30) * 0.40 + Math.sin(z * 0.015) * 3.5) : 0;
    const naturalDune = rawDune + ridge;

    // Smoothly leveled ground pads with cubic Hermite margin blending
    const pads = [
      { zMin: 1850, zMax: 1950, latMin: 16, latMax: 60 },     // Route 66 Diner (Z=1900)
      { zMin: 4450, zMax: 4550, latMin: -65, latMax: -16 },   // Cabazon Dinosaurs (Z=4500)
      { zMin: 6250, zMax: 6350, latMin: 16, latMax: 60 },     // Roy's Motel (Z=6300)
      { zMin: 550, zMax: 650, latMin: -55, latMax: -16 },     // Bottle Ranch (Z=600)
      { zMin: 1210, zMax: 1290, latMin: 14, latMax: 60 },     // Wigwam Village (Z=1250)
      { zMin: 5100, zMax: 5200, latMin: 20, latMax: 75 },     // Outlet Mall (Z=5150)
      { zMin: 350, zMax: 450, latMin: 16, latMax: 45 },       // R66 Billboard
      { zMin: 5950, zMax: 6050, latMin: 16, latMax: 48 },     // Roy's Billboard
    ];

    let padWeight = 0;
    for (let p = 0; p < pads.length; p++) {
      const pad = pads[p];
      const margin = 18.0;
      if (z >= pad.zMin - margin && z <= pad.zMax + margin &&
          latDist >= pad.latMin - margin && latDist <= pad.latMax + margin) {
        
        const dz = (z < pad.zMin) ? (pad.zMin - z) : (z > pad.zMax ? (z - pad.zMax) : 0);
        const dLat = (latDist < pad.latMin) ? (pad.latMin - latDist) : (latDist > pad.latMax ? (latDist - pad.latMax) : 0);
        
        const tz = THREE.MathUtils.clamp(1.0 - dz / margin, 0, 1);
        const tLat = THREE.MathUtils.clamp(1.0 - dLat / margin, 0, 1);
        const smoothW = (tz * tz * (3 - 2 * tz)) * (tLat * tLat * (3 - 2 * tLat));
        if (smoothW > padWeight) padWeight = smoothW;
      }
    }

    terrainOffset = THREE.MathUtils.lerp(naturalDune, 0.05, padWeight);

    // Santa Monica Coastal Valley Pass & Pacific Bay Plain (Z: 6100m - 6600m, latDist >= 20m)
    // Carves an open scenic corridor leading to Santa Monica Pier and the Pacific Ocean (Base Elev: 12.0m)
    if (z >= 6100 && z <= 6600 && latDist >= 20.0) {
      const bayZDist = Math.abs(z - 6350.0);
      const bayZT = THREE.MathUtils.clamp(1.0 - bayZDist / 250.0, 0, 1);
      const bayZWeight = bayZT * bayZT * (3.0 - 2.0 * bayZT);
      if (bayZWeight > 0) {
        const coastT = THREE.MathUtils.clamp((latDist - 20.0) / 160.0, 0, 1);
        const coastElev = THREE.MathUtils.lerp(0.0, 12.0, coastT * coastT * (3.0 - 2.0 * coastT));
        terrainOffset = THREE.MathUtils.lerp(terrainOffset, coastElev, bayZWeight);
      }
    }

    // Coyote Ridge Off-Road Rock Crawling Mountain & Summit Overlook (Z: 2465m - 3080m, latDist <= -16m)
    if (z >= 2465 && z <= 3080 && latDist <= -16 && latDist >= -420) {
      const hillT = THREE.MathUtils.clamp((-latDist - 20.0) / 240.0, 0, 1);
      const ridgeBaseHeight = (hillT * hillT * (3.0 - 2.0 * hillT)) * 56.0;

      const zDist = Math.abs(z - 2780);
      const zT = THREE.MathUtils.clamp(1.0 - zDist / 340.0, 0, 1);
      let mountainWeight = zT * zT * (3.0 - 2.0 * zT);
      let mountainElev = ridgeBaseHeight * mountainWeight;

      const downhillQuery = DownhillSpline.queryDownhill(latDist, routeZ);
      const trailQuery = TrailSpline.queryTrail(latDist, routeZ);

      // Prioritize downhill route when closer to downhill corridor
      const isDownhillPrimary = Boolean(downhillQuery && (!trailQuery || downhillQuery.dist < trailQuery.dist));

      if (isDownhillPrimary && downhillQuery) {
        const halfW = (downhillQuery.width || 16.0) * 0.5;
        const dist = downhillQuery.dist;
        let finalRidgeElev;
        if (dist <= halfW) {
          finalRidgeElev = downhillQuery.targetElev;
        } else {
          const shoulderW = 12.0;
          const shoulderT = THREE.MathUtils.clamp((dist - halfW) / shoulderW, 0, 1);
          const smoothShoulder = shoulderT * shoulderT * (3.0 - 2.0 * shoulderT);
          finalRidgeElev = THREE.MathUtils.lerp(downhillQuery.targetElev, mountainElev, smoothShoulder);
        }
        const corridorWeight = THREE.MathUtils.clamp(1.0 - (dist - halfW) / 12.0, 0, 1);
        const smoothCorridor = (dist <= halfW) ? 1.0 : (corridorWeight * corridorWeight * (3.0 - 2.0 * corridorWeight));
        const effectiveWeight = Math.max(mountainWeight, smoothCorridor);
        terrainOffset = THREE.MathUtils.lerp(terrainOffset, finalRidgeElev, effectiveWeight);
      } else if (trailQuery) {
        if (trailQuery.inSummitPlateau) {
          terrainOffset = 56.0;
        } else {
          const halfW = (trailQuery.width || 9.0) * 0.5;
          const dist = trailQuery.dist;
          let finalRidgeElev;
          if (dist <= halfW) {
            // Authentic level roadbed bench with technical micro-obstacles
            finalRidgeElev = trailQuery.targetElev;
          } else {
            // Natural canyon wall / talus shoulder transition
            const shoulderW = 14.0;
            const shoulderT = THREE.MathUtils.clamp((dist - halfW) / shoulderW, 0, 1);
            const smoothShoulder = shoulderT * shoulderT * (3.0 - 2.0 * shoulderT);
            finalRidgeElev = THREE.MathUtils.lerp(trailQuery.targetElev, mountainElev, smoothShoulder);
          }

          // Inside the trail corridor, trail geometry 100% overrides the desert dune slope
          const corridorWeight = THREE.MathUtils.clamp(1.0 - (dist - halfW) / 14.0, 0, 1);
          const smoothCorridor = (dist <= halfW) ? 1.0 : (corridorWeight * corridorWeight * (3.0 - 2.0 * corridorWeight));
          const effectiveWeight = Math.max(mountainWeight, smoothCorridor);
          terrainOffset = THREE.MathUtils.lerp(terrainOffset, finalRidgeElev, effectiveWeight);
        }
      } else {
        terrainOffset = THREE.MathUtils.lerp(terrainOffset, mountainElev, mountainWeight);
      }

      // 1. Cougar Falls Gorge & Plunge Pool (latDist: -180m to -220m, z: 2808m to 2852m)
      if (latDist <= -180.0 && latDist >= -220.0 && z >= 2808.0 && z <= 2852.0) {
        const wfDistX = Math.abs(latDist - (-200.0));
        const wfDistZ = Math.abs(z - 2830.0);
        const poolRadius = 18.0;
        const poolDist = Math.sqrt(wfDistX * wfDistX + wfDistZ * wfDistZ);
        if (poolDist < poolRadius) {
          const poolT = THREE.MathUtils.clamp(1.0 - poolDist / poolRadius, 0, 1);
          const poolWeight = poolT * poolT * (3.0 - 2.0 * poolT);
          // Pool water level is at 25.0m, bedrock basin bottom at 23.5m
          terrainOffset = THREE.MathUtils.lerp(terrainOffset, 23.5, poolWeight * 0.85);
        }
      }

      // 2. Thunder Falls Gorge & Grand Amphitheater Plunge Pool (latDist: -255m to -295m, z: 3005m to 3045m)
      if (latDist <= -255.0 && latDist >= -295.0 && z >= 3005.0 && z <= 3045.0) {
        const twfDistX = Math.abs(latDist - (-275.0));
        const twfDistZ = Math.abs(z - 3025.0);
        const tPoolRadius = 22.0;
        const tPoolDist = Math.sqrt(twfDistX * twfDistX + twfDistZ * twfDistZ);
        if (tPoolDist < tPoolRadius) {
          const tPoolT = THREE.MathUtils.clamp(1.0 - tPoolDist / tPoolRadius, 0, 1);
          const tPoolWeight = tPoolT * tPoolT * (3.0 - 2.0 * tPoolT);
          // Thunder pool water level at 35.0m, bedrock basin at 33.8m
          terrainOffset = THREE.MathUtils.lerp(terrainOffset, 33.8, tPoolWeight * 0.85);
        }
      }

      // Protect the authored downhill descent and 4x4 expedition trail from decorative cliff/pool carving.
      if (downhillQuery && downhillQuery.dist <= downhillQuery.width * 0.5 + 1.0) {
        return roadY + downhillQuery.targetElev;
      }
      if (trailQuery && trailQuery.dist <= (trailQuery.width || 9.0) * 0.5 + 2.5) {
        return roadY + trailQuery.targetElev;
      }

      // Grand Overlook Canyon Precipice: drops 48m straight down in front of the viewing deck
      if (latDist > -232.5 && latDist <= -80.0 && z >= 2540.0 && z <= 2700.0) {
        const isBridgeCorridor = (latDist <= -185.0 && z >= 2610.0 && z <= 2680.0);
        if (!isBridgeCorridor) {
          const amphZDist = Math.abs(z - 2620.0);
          const amphZT = THREE.MathUtils.clamp(1.0 - amphZDist / 70.0, 0, 1);
          const amphWeight = amphZT * amphZT * (3.0 - 2.0 * amphZT);
          if (amphWeight > 0) {
            const dropT = THREE.MathUtils.clamp((-latDist - 215.0) / 17.5, 0, 1);
            const cliffH = THREE.MathUtils.lerp(7.5, 56.0, dropT * dropT * dropT);
            terrainOffset = THREE.MathUtils.lerp(terrainOffset, cliffH, amphWeight);
          }
        }
      }
    }

    // Western Coastal Valley Basin & City Bay Floor (latDist <= -330m, z: 2480m - 2940m)
    if (z >= 2480 && z <= 2940 && latDist <= -330 && latDist >= -600) {
      const basinDist = Math.abs(z - 2660);
      const basinZWeight = THREE.MathUtils.clamp(1.0 - basinDist / 240.0, 0, 1);
      const smoothZ = basinZWeight * basinZWeight * (3.0 - 2.0 * basinZWeight);

      // Smooth descent from mountain edge (-330m) to coastal plain (-365m), then flat 12.0m
      const slopeT = THREE.MathUtils.clamp((-latDist - 330.0) / 35.0, 0, 1);
      const targetElev = THREE.MathUtils.lerp(56.0, 12.0, slopeT * slopeT * (3.0 - 2.0 * slopeT));

      terrainOffset = THREE.MathUtils.lerp(terrainOffset, targetElev, smoothZ);
    }
  }
  // Zone 1: Malibu & PCH (Z: 6500m - 14500m)
  else if (z >= 6500 && z < 14500) {
    const isCrossCreekLot = (z >= 10700 && z <= 10820 && latDist > 14 && latDist < 75);
    const isZumaLot = (z >= 12340 && z <= 12460 && latDist < -12 && latDist > -40);

    if (isCrossCreekLot || isZumaLot) {
      terrainOffset = 0;
    } else if (isRightSide) {
      const hillDist = absDist - roadHalfW;
      const ridgeNoise = Math.sin(z * 0.02) * 5.0 + Math.cos(x * 0.035 + z * 0.028) * 3.2;
      terrainOffset = Math.min(48.0, hillDist * 0.58 + ridgeNoise);
    } else {
      // Pacific beach slope down to water level
      const beachDrop = (absDist - roadHalfW) * 0.08;
      terrainOffset = -Math.min(roadY + 0.2, beachDrop);
    }
  }
  // Zone 2: Big Sur Highway 1 (Z: 14500m - 20500m)
  else if (z >= 14500 && z < 20500) {
    // Bixby Creek Bridge Chasm cutout (Z: 18550m - 18750m)
    if (z >= 18550 && z <= 18750) {
      const chasmFactor = Math.sin(((z - 18550) / 200) * Math.PI);
      const chasmDepth = -28.0 * chasmFactor;
      terrainOffset = isRightSide ? (absDist > 55 ? (absDist - 55) * 0.45 : chasmDepth) : chasmDepth;
    } else {
      if (isRightSide) {
        terrainOffset = (absDist - roadHalfW) * 0.65;
      } else {
        terrainOffset = -Math.min(roadY + 8.0, (absDist - roadHalfW) * 0.85);
      }
    }
  }
  // Zone 3: Monterey Bay & Carmel (Z: 20500m - 25500m)
  else if (z >= 20500 && z < 25500) {
    const isCanneryGarage = (z >= 21250 && z <= 21350 && latDist > 16 && latDist < 45);
    if (isCanneryGarage) {
      terrainOffset = 0;
    } else {
      const roll = Math.sin(x * 0.02) * Math.cos(z * 0.015) * 3.5;
      if (isRightSide) {
        terrainOffset = roll + (absDist - roadHalfW) * 0.38;
      } else {
        terrainOffset = Math.max(-roadY - 0.2, roll - (absDist - roadHalfW) * 0.15);
      }
    }
  }
  // Zone 4: Golden Gate & SF Bay Channel (Z: 25500m - 31000m)
  else if (z >= 25500 && z < 31000) {
    if (z >= 28500 && z <= 29300) {
      // Golden Gate Strait deep water channel
      terrainOffset = -roadY - 12.0;
      if (absDist > 240) {
        terrainOffset += (absDist - 240) * 0.40;
      }
    } else if (z > 29300) {
      const marinT = Math.min(1.0, (z - 29300) / 350);
      terrainOffset = 14.0 * marinT + (absDist > 18 ? (absDist - 18) * 0.60 : 0);
    } else {
      const sfT = Math.min(1.0, (28500 - z) / 350);
      terrainOffset = 10.0 * sfT + (isRightSide && absDist > 18 ? (absDist - 18) * 0.45 : 0);
    }
  }
  // Zone 5: Redwood Forest (Z: 31000m - 36000m)
  else if (z >= 31000 && z < 36000) {
    const roll = Math.sin(x * 0.015) * Math.cos(z * 0.012) * 3.0;
    terrainOffset = roll + (absDist > 20 ? (absDist - 20) * 0.40 : 0);
  }
  // Zone 6: Oregon Coast (Z: 36000m - 40500m)
  else if (z >= 36000 && z < 40500) {
    const isTillamookLot = (z >= 39980 && z <= 40120 && latDist > 18 && latDist < 80);
    if (isTillamookLot) {
      terrainOffset = 0;
    } else if (!isRightSide) {
      terrainOffset = -Math.min(roadY + 0.2, (absDist - roadHalfW) * 0.08);
    } else {
      terrainOffset = (absDist - roadHalfW) * 0.55 + Math.sin(z * 0.02) * 3.5;
    }
  }
  // Zone 7: Columbia River Gorge (Z: 40500m - 45000m)
  else if (z >= 40500 && z < 45000) {
    if (!isRightSide) {
      terrainOffset = -Math.min(roadY + 0.1, (absDist - roadHalfW) * 0.10);
    } else {
      terrainOffset = Math.min(52.0, (absDist - roadHalfW) * 0.95);
    }
  }
  // Zone 8: Washington & Olympic (Z: 45000m - 49500m)
  else if (z >= 45000 && z < 49500) {
    if (!isRightSide) {
      terrainOffset = -Math.min(roadY + 0.1, (absDist - roadHalfW) * 0.08);
    } else {
      terrainOffset = (absDist - roadHalfW) * 0.48;
    }
  }
  // Zone 9: Cascade Alpine Pass & Mount Rainier (Z: 49500m - 53500m)
  else if (z >= 49500 && z < 53500) {
    // Preserve level ground for Paradise Lodge turnout (Z: 50700, right) and Narada Falls (Z: 52300, left)
    const isParadiseTurnout = (z >= 50640 && z <= 50760 && latDist > 14 && latDist < 60);
    const isNaradaTurnout = (z >= 52240 && z <= 52360 && latDist < -14 && latDist > -60);
    if (isParadiseTurnout || isNaradaTurnout) {
      terrainOffset = 0;
    } else if (isRightSide) {
      // Ascending Mount Rainier stratovolcano massif & crags
      terrainOffset = Math.min(85.0, (absDist - roadHalfW) * 0.85);
    } else {
      // Glacial Nisqually / Paradise canyon gorge drop-off on left
      terrainOffset = -Math.min(35.0, (absDist - roadHalfW) * 0.45);
    }
  }
  // Zone 10: Idaho Panhandle & Lake Coeur d'Alene (Z: 53500m - 57500m)
  else if (z >= 53500 && z < 57500) {
    const isBoardwalkTurnout = (z >= 54640 && z <= 54760 && latDist < -14 && latDist > -60);
    const isCataldoTurnout = (z >= 56240 && z <= 56360 && latDist > 14 && latDist < 60);
    if (isBoardwalkTurnout || isCataldoTurnout) {
      terrainOffset = 0;
    } else if (!isRightSide) {
      // Lake Coeur d'Alene sapphire water basin
      terrainOffset = -Math.min(roadY + 0.1, (absDist - roadHalfW) * 0.08);
    } else {
      // Bitterroot cedar and pine ridges
      terrainOffset = (absDist - roadHalfW) * 0.42;
    }
  }
  // Zone 11: Montana Big Sky & Glacier Going-to-the-Sun (Z: 57500m - 62000m)
  else {
    const isLakeMcDonaldTurnout = (z >= 58740 && z <= 58860 && latDist < -14 && latDist > -60);
    const isLoganPassTurnout = (z >= 61140 && z <= 61260 && latDist > 14 && latDist < 65);
    if (isLakeMcDonaldTurnout || isLoganPassTurnout) {
      terrainOffset = 0;
    } else if (z < 59400) {
      // Lake McDonald Glacial Shore & Valley
      if (!isRightSide) {
        terrainOffset = -Math.min(roadY + 0.1, (absDist - roadHalfW) * 0.07);
      } else {
        terrainOffset = (absDist - roadHalfW) * 0.38;
      }
    } else if (z < 60800) {
      // The Weeping Wall & Garden Wall Sheer Cliff
      if (isRightSide) {
        // Vertical Weeping Wall and Rimrock cliff face rising sharply
        terrainOffset = Math.min(65.0, (absDist - roadHalfW) * 1.15);
      } else {
        // Deep U-shaped glacial cirque drop-off into McDonald Valley
        terrainOffset = -Math.min(48.0, (absDist - roadHalfW) * 0.65);
      }
    } else {
      // Logan Pass Continental Divide (6,646 ft) & Alpine Tundra
      if (isRightSide) {
        // Towering Mount Reynolds horn peak and alpine crags
        terrainOffset = Math.min(85.0, (absDist - roadHalfW) * 0.88);
      } else {
        // Clements Mountain and Hidden Lake alpine hanging saddle
        terrainOffset = Math.min(50.0, (absDist - roadHalfW) * 0.52);
      }
    }
  }

  return roadY + shoulderBlend * terrainOffset;
}
