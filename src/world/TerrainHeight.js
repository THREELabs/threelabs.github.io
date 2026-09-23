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

  // Zone 0: Mojave Desert (Z < 2600m) - Rolling sand dunes & desert ridge slopes
  if (z < 2600) {
    const rawDune = Math.sin(x * 0.022 + z * 0.014) * 2.8 + Math.cos(x * 0.045 - z * 0.025) * 1.5;
    const ridge = absDist > 30 ? Math.min(22.0, (absDist - 30) * 0.40 + Math.sin(z * 0.015) * 3.5) : 0;
    const naturalDune = rawDune + ridge;

    // Smoothly leveled ground pads with cubic Hermite margin blending
    const pads = [
      { zMin: 700, zMax: 800, latMin: 16, latMax: 60 },      // Route 66 Diner
      { zMin: 1500, zMax: 1600, latMin: -65, latMax: -16 },  // Cabazon Dinosaurs
      { zMin: 2250, zMax: 2350, latMin: 16, latMax: 60 },    // Roy's Motel
      { zMin: 300, zMax: 400, latMin: -55, latMax: -16 },    // Bottle Ranch
      { zMin: 390, zMax: 460, latMin: 14, latMax: 60 },      // Wigwam Village
      { zMin: 1570, zMax: 1660, latMin: 20, latMax: 75 },    // Outlet Mall
      { zMin: 150, zMax: 250, latMin: 16, latMax: 45 },      // R66 Billboard Z=200
      { zMin: 1840, zMax: 1960, latMin: 16, latMax: 48 },    // Roy's Billboard Z=1900
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

    // Santa Monica Coastal Valley Pass & Pacific Bay Plain (Z: 920m - 1280m, latDist >= 20m)
    // Carves an open scenic corridor leading to Santa Monica Pier and the Pacific Ocean (Base Elev: 12.0m)
    if (z >= 920 && z <= 1280 && latDist >= 20.0) {
      const bayZDist = Math.abs(z - 1100.0);
      const bayZT = THREE.MathUtils.clamp(1.0 - bayZDist / 160.0, 0, 1);
      const bayZWeight = bayZT * bayZT * (3.0 - 2.0 * bayZT);
      if (bayZWeight > 0) {
        const coastT = THREE.MathUtils.clamp((latDist - 20.0) / 160.0, 0, 1);
        const coastElev = THREE.MathUtils.lerp(0.0, 12.0, coastT * coastT * (3.0 - 2.0 * coastT));
        terrainOffset = THREE.MathUtils.lerp(terrainOffset, coastElev, bayZWeight);
      }
    }

    // Coyote Ridge Off-Road Rock Crawling Mountain & Summit Overlook (Z: 960m - 1540m, latDist <= -16m)
    if (z >= 925 && z <= 1540 && latDist <= -16 && latDist >= -420) {
      const hillT = THREE.MathUtils.clamp((-latDist - 20.0) / 240.0, 0, 1);
      const ridgeBaseHeight = (hillT * hillT * (3.0 - 2.0 * hillT)) * 56.0;

      const zDist = Math.abs(z - 1240);
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

      // 1. Cougar Falls Gorge & Plunge Pool (latDist: -180m to -220m, z: 1268m to 1312m)
      if (latDist <= -180.0 && latDist >= -220.0 && z >= 1268.0 && z <= 1312.0) {
        const wfDistX = Math.abs(latDist - (-200.0));
        const wfDistZ = Math.abs(z - 1290.0);
        const poolRadius = 18.0;
        const poolDist = Math.sqrt(wfDistX * wfDistX + wfDistZ * wfDistZ);
        if (poolDist < poolRadius) {
          const poolT = THREE.MathUtils.clamp(1.0 - poolDist / poolRadius, 0, 1);
          const poolWeight = poolT * poolT * (3.0 - 2.0 * poolT);
          // Pool water level is at 25.0m, bedrock basin bottom at 23.5m
          terrainOffset = THREE.MathUtils.lerp(terrainOffset, 23.5, poolWeight * 0.85);
        }
      }

      // 2. Thunder Falls Gorge & Grand Amphitheater Plunge Pool (latDist: -255m to -295m, z: 1465m to 1505m)
      if (latDist <= -255.0 && latDist >= -295.0 && z >= 1465.0 && z <= 1505.0) {
        const twfDistX = Math.abs(latDist - (-275.0));
        const twfDistZ = Math.abs(z - 1485.0);
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
      // Eliminates foreground dirt slope completely for binoculars looking out across the valley
      // Preserves boardwalk bridge and promontory observation deck corridor
      if (latDist > -232.5 && latDist <= -80.0 && z >= 1000.0 && z <= 1160.0) {
        const isBridgeCorridor = (latDist <= -185.0 && z >= 1070.0 && z <= 1140.0);
        if (!isBridgeCorridor) {
          const amphZDist = Math.abs(z - 1080.0);
          const amphZT = THREE.MathUtils.clamp(1.0 - amphZDist / 70.0, 0, 1);
          const amphWeight = amphZT * amphZT * (3.0 - 2.0 * amphZT);
          if (amphWeight > 0) {
            const dropT = THREE.MathUtils.clamp((-latDist - 215.0) / 17.5, 0, 1); // 0 at -215, 1 at -232.5
            const cliffH = THREE.MathUtils.lerp(7.5, 56.0, dropT * dropT * dropT);
            terrainOffset = THREE.MathUtils.lerp(terrainOffset, cliffH, amphWeight);
          }
        }
      }
    }

    // Western Coastal Valley Basin & City Bay Floor (latDist <= -330m, z: 940m - 1400m)
    // Carves the descent from the summit mountain rim down to the 12.0m Pacific coastal plain
    if (z >= 940 && z <= 1400 && latDist <= -330 && latDist >= -600) {
      const basinDist = Math.abs(z - 1120);
      const basinZWeight = THREE.MathUtils.clamp(1.0 - basinDist / 240.0, 0, 1);
      const smoothZ = basinZWeight * basinZWeight * (3.0 - 2.0 * basinZWeight);

      // Smooth descent from mountain edge (-330m) to coastal plain (-365m), then flat 12.0m
      const slopeT = THREE.MathUtils.clamp((-latDist - 330.0) / 35.0, 0, 1);
      const targetElev = THREE.MathUtils.lerp(56.0, 12.0, slopeT * slopeT * (3.0 - 2.0 * slopeT));

      terrainOffset = THREE.MathUtils.lerp(terrainOffset, targetElev, smoothZ);
    }
  }
  // Zone 1: Malibu & PCH (Z: 2600m - 5200m)
  else if (z >= 2600 && z < 5200) {
    const isCrossCreekLot = (z >= 3690 && z <= 3810 && latDist > 14 && latDist < 75);
    const isZumaLot = (z >= 4590 && z <= 4710 && latDist < -12 && latDist > -40);

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
  // Zone 2: Big Sur Highway 1 (Z: 5200m - 7800m)
  else if (z >= 5200 && z < 7800) {
    // Bixby Creek Bridge Chasm cutout (Z: 6550m - 6750m)
    if (z >= 6550 && z <= 6750) {
      const chasmFactor = Math.sin(((z - 6550) / 200) * Math.PI);
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
  // Zone 3: Monterey Bay & Carmel (Z: 7800m - 10400m)
  else if (z >= 7800 && z < 10400) {
    const isCanneryGarage = (z >= 8340 && z <= 8420 && latDist > 16 && latDist < 45);
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
  // Zone 4: Golden Gate & SF Bay Channel (Z: 10400m - 13000m)
  else if (z >= 10400 && z < 13000) {
    if (z >= 11400 && z <= 12000) {
      // Golden Gate Strait deep water channel
      terrainOffset = -roadY - 12.0;
      if (absDist > 240) {
        terrainOffset += (absDist - 240) * 0.40;
      }
    } else if (z > 12000) {
      const marinT = Math.min(1.0, (z - 12000) / 350);
      terrainOffset = 14.0 * marinT + (absDist > 18 ? (absDist - 18) * 0.60 : 0);
    } else {
      const sfT = Math.min(1.0, (11400 - z) / 350);
      terrainOffset = 10.0 * sfT + (isRightSide && absDist > 18 ? (absDist - 18) * 0.45 : 0);
    }
  }
  // Zone 5: Redwood Forest (Z: 13000m - 15600m)
  else if (z >= 13000 && z < 15600) {
    const roll = Math.sin(x * 0.015) * Math.cos(z * 0.012) * 3.0;
    terrainOffset = roll + (absDist > 20 ? (absDist - 20) * 0.40 : 0);
  }
  // Zone 6: Oregon Coast (Z: 15600m - 18200m)
  else if (z >= 15600 && z < 18200) {
    const isTillamookLot = (z >= 17720 && z <= 17840 && latDist > 18 && latDist < 80);
    if (isTillamookLot) {
      terrainOffset = 0;
    } else if (!isRightSide) {
      terrainOffset = -Math.min(roadY + 0.2, (absDist - roadHalfW) * 0.08);
    } else {
      terrainOffset = (absDist - roadHalfW) * 0.55 + Math.sin(z * 0.02) * 3.5;
    }
  }
  // Zone 7: Columbia River Gorge (Z: 18200m - 20800m)
  else if (z >= 18200 && z < 20800) {
    if (!isRightSide) {
      terrainOffset = -Math.min(roadY + 0.1, (absDist - roadHalfW) * 0.10);
    } else {
      terrainOffset = Math.min(52.0, (absDist - roadHalfW) * 0.95);
    }
  }
  // Zone 8: Washington & Olympic (Z: 20800m - 23400m)
  else if (z >= 20800 && z < 23400) {
    if (!isRightSide) {
      terrainOffset = -Math.min(roadY + 0.1, (absDist - roadHalfW) * 0.08);
    } else {
      terrainOffset = (absDist - roadHalfW) * 0.48;
    }
  }
  // Zone 9: Cascade Alpine Pass & Mount Rainier (Z: 23400m - 26000m)
  else if (z >= 23400 && z < 26000) {
    // Preserve level ground for Paradise Lodge turnout (Z: 24040-24160, right) and Narada Falls (Z: 24840-24960, left)
    const isParadiseTurnout = (z >= 24040 && z <= 24160 && latDist > 14 && latDist < 60);
    const isNaradaTurnout = (z >= 24840 && z <= 24960 && latDist < -14 && latDist > -60);
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
  // Zone 10: Idaho Panhandle & Lake Coeur d'Alene (Z: 26000m - 28600m)
  else if (z >= 26000 && z < 28600) {
    const isBoardwalkTurnout = (z >= 26740 && z <= 26860 && latDist < -14 && latDist > -60);
    const isCataldoTurnout = (z >= 27540 && z <= 27660 && latDist > 14 && latDist < 60);
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
  // Zone 11: Montana Big Sky & Glacier Going-to-the-Sun (Z: 28600m - 31200m)
  else {
    const isLakeMcDonaldTurnout = (z >= 29140 && z <= 29260 && latDist < -14 && latDist > -60);
    const isLoganPassTurnout = (z >= 30740 && z <= 30860 && latDist > 14 && latDist < 65);
    if (isLakeMcDonaldTurnout || isLoganPassTurnout) {
      terrainOffset = 0;
    } else if (z < 29400) {
      // Lake McDonald Glacial Shore & Valley
      if (!isRightSide) {
        terrainOffset = -Math.min(roadY + 0.1, (absDist - roadHalfW) * 0.07);
      } else {
        terrainOffset = (absDist - roadHalfW) * 0.38;
      }
    } else if (z < 30400) {
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
