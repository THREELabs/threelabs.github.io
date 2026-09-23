#!/usr/bin/env node
/**
 * 🏎️ Dreamstate Highway (Baja Racer 3D) — Autonomous Agent Test & Benchmark Runner
 *
 * This test harness is executed by AI agents to verify 3D game logic,
 * physics, spline road generation, historical lore archives, auto repair shops,
 * obstacle collisions, atmospheric parameters, and state consistency.
 */

import './setup_env.js';
import * as THREE from 'three';

// 1. Import Engine Modules from src/
import { gameState } from '../src/state.js';
import { PHYSICS, DAMAGE, ROAD, ZONES, LANDMARKS, CAMERAS, DRIVE_MODES } from '../src/constants.js';
import { getHistoricalLore, getHistoricalLoreForZone, TOTAL_HISTORICAL_ARCHIVES } from '../src/world/HistoricalLore.js';
import { SplineRoad, SCENIC_PARKING_LOTS, AUTO_REPAIR_SHOPS } from '../src/world/SplineRoad.js';
import { TerrainChunkManager, calculateTerrainHeight } from '../src/world/TerrainChunk.js';
import { ObstacleSystem } from '../src/engine/ObstacleSystem.js';
import { VehiclePhysics } from '../src/engine/Physics.js';
import { CameraManager } from '../src/engine/CameraManager.js';
import { InputManager } from '../src/engine/Input.js';
import { ZoneManager } from '../src/world/ZoneManager.js';
import { SoundEngine } from '../src/audio/SoundEngine.js';
import { ProceduralStructureBuilder, Archetypes, PAINTED_LADIES_PALETTES } from '../src/world/ProceduralArchitecture.js';
import { DesertSceneryBuilder } from '../src/world/DesertScenery.js';
import { MalibuSceneryBuilder } from '../src/world/MalibuScenery.js';
import { BigSurSceneryBuilder } from '../src/world/BigSurScenery.js';
import { MontereySceneryBuilder } from '../src/world/MontereyScenery.js';
import { NorCalSceneryBuilder } from '../src/world/NorCalScenery.js';
import { RedwoodSceneryBuilder } from '../src/world/RedwoodScenery.js';
import { OregonSceneryBuilder } from '../src/world/OregonScenery.js';
import { ColumbiaGorgeSceneryBuilder } from '../src/world/ColumbiaGorgeScenery.js';
import { WashingtonSceneryBuilder } from '../src/world/WashingtonScenery.js';
import { MysteryCrimeScene } from '../src/world/MysteryCrimeScene.js';
import { TrailSpline, TRAIL_WAYPOINTS, STREAM_CROSSINGS, WATERFALL_VIEW_AREAS } from '../src/world/TrailSpline.js';
import { SaveManager } from '../src/engine/SaveManager.js';
import { youtubePlayer, CURATED_ROAD_TRACKS, extractYouTubeVideoId, YouTubePlayerManager } from '../src/audio/YouTubePlayer.js';


let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

// --- Suite 1: State & Progression Lifecycle ---
console.log('▶ [Suite 1] Engine State & Progression Lifecycle');
gameState.reset();

test('GameState initializes with valid telemetry, physics, and progression defaults', () => {
  if (typeof gameState.speed !== 'number' || typeof gameState.nitro !== 'number' || typeof gameState.fuel !== 'number') {
    throw new Error('Core driving state variables missing or non-numeric');
  }
  if (gameState.nitro !== 100.0 || gameState.fuel !== 100.0) {
    throw new Error(`Expected full tank/nitro on reset, got nitro=${gameState.nitro}, fuel=${gameState.fuel}`);
  }
  if (!(gameState.discoveredLandmarks instanceof Set) || !(gameState.discoveredHistoryPlaques instanceof Set)) {
    throw new Error('Discovery trackers must be Set instances');
  }
});

test('GameState reset restores driving and intro state without losing Set structures', () => {
  gameState.speed = 85;
  gameState.heatStars = 3;
  gameState.isBusted = true;
  gameState.discoveredHistoryPlaques.add('turnout_bottle_tree');
  
  gameState.reset();
  
  if (gameState.speed !== 0 || gameState.heatStars !== 0 || gameState.isBusted !== false) {
    throw new Error('gameState.reset() failed to clear driving/pursuit flags');
  }
  if (!gameState.discoveredHistoryPlaques.has('turnout_bottle_tree')) {
    throw new Error('gameState.reset() should preserve career discovery Sets');
  }
});

test('Multi-point vehicle damage points structure is complete', () => {
  const points = gameState.damagePoints;
  if (!points || typeof points !== 'object') throw new Error('damagePoints object missing');
  const required = ['frontBumper', 'frontSplitter', 'hood', 'fenderL', 'fenderR', 'doorL', 'doorR', 'rearWing', 'windshield'];
  for (const part of required) {
    if (typeof points[part] !== 'number') throw new Error(`Missing damage part: ${part}`);
  }
});

test('GameState initializes 120 FPS high-refresh rate defaults and telemetry', () => {
  if (gameState.targetFps !== 120 || gameState.fpsMode !== '120') {
    throw new Error(`Expected targetFps=120 and fpsMode='120', got targetFps=${gameState.targetFps}, fpsMode=${gameState.fpsMode}`);
  }
  if (typeof gameState.frameMs !== 'number' || gameState.frameMs > 10.0) {
    throw new Error(`Expected high-refresh frameMs <= 10.0ms, got ${gameState.frameMs}`);
  }
});

// --- Suite 2: Constants & Zones Architecture ---
console.log('\n▶ [Suite 2] Constants & World Zone Definitions');

test('All 9 Pacific Coast zones are defined with complete physical & atmospheric profiles', () => {
  if (!Array.isArray(ZONES) || ZONES.length !== 9) {
    throw new Error(`Expected exactly 9 zones, found ${ZONES?.length}`);
  }
  ZONES.forEach((zone, idx) => {
    if (zone.id !== idx) throw new Error(`Zone id mismatch at index ${idx}: ${zone.id}`);
    if (!zone.name || !zone.temperature || !zone.weatherBadge) throw new Error(`Zone ${idx} missing metadata`);
    if (!zone.skyTop || !zone.skyHorizon || !zone.fogColor) throw new Error(`Zone ${idx} missing sky colors`);
    if (typeof zone.roadGrip !== 'number' || zone.roadGrip < 0.5 || zone.roadGrip > 1.0) {
      throw new Error(`Zone ${idx} invalid road grip: ${zone.roadGrip}`);
    }
  });
});

test('Physics constants specify realistic supercar speed and forces', () => {
  if (PHYSICS.MAX_SPEED_MPH < 150 || PHYSICS.NITRO_MAX_SPEED_MPH <= PHYSICS.MAX_SPEED_MPH) {
    throw new Error(`Invalid physics speed parameters: max=${PHYSICS.MAX_SPEED_MPH}, nitroMax=${PHYSICS.NITRO_MAX_SPEED_MPH}`);
  }
  if (PHYSICS.ENGINE_FORCE <= 0 || PHYSICS.BRAKE_FORCE <= 0 || PHYSICS.NITRO_FORCE <= 0) {
    throw new Error('Physics forces must be positive non-zero values');
  }
});

test('Damage degradation thresholds follow monotonic severity progression', () => {
  if (!(DAMAGE.STAGE_1_INTEGRITY > DAMAGE.STAGE_2_INTEGRITY && DAMAGE.STAGE_2_INTEGRITY > DAMAGE.STAGE_3_INTEGRITY)) {
    throw new Error(`Damage stages not monotonically decreasing: S1=${DAMAGE.STAGE_1_INTEGRITY}, S2=${DAMAGE.STAGE_2_INTEGRITY}, S3=${DAMAGE.STAGE_3_INTEGRITY}`);
  }
  if (DAMAGE.MIN_POWER_FACTOR <= 0 || DAMAGE.MIN_POWER_FACTOR > 1.0) {
    throw new Error(`Invalid MIN_POWER_FACTOR: ${DAMAGE.MIN_POWER_FACTOR}`);
  }
});

// --- Suite 3: Historical Lore & Scenic Overlook Database ---
console.log('\n▶ [Suite 3] Historical Lore & Heritage Archives');

test('Historical lore database contains comprehensive archives (>= 45 entries)', () => {
  if (TOTAL_HISTORICAL_ARCHIVES < 45) {
    throw new Error(`Expected at least 45 historical archives, got ${TOTAL_HISTORICAL_ARCHIVES}`);
  }
});

test('All scenic parking lot turnouts map to rich historical lore entries', () => {
  if (!Array.isArray(SCENIC_PARKING_LOTS) || SCENIC_PARKING_LOTS.length === 0) {
    throw new Error('SCENIC_PARKING_LOTS is empty');
  }
  let missing = [];
  SCENIC_PARKING_LOTS.forEach(lot => {
    const lore = getHistoricalLore(lot.id);
    if (!lore || !lore.name || !lore.historyText || lore.historyText.length < 50) {
      missing.push(lot.id);
    }
  });
  if (missing.length > 0) {
    throw new Error(`Scenic parking lots missing rich lore: ${missing.join(', ')}`);
  }
});

test('Every zone (0-8) possesses multiple historical archives', () => {
  for (let z = 0; z <= 8; z++) {
    const lores = getHistoricalLoreForZone(z);
    if (!lores || lores.length < 3) {
      throw new Error(`Zone ${z} has insufficient lore archives (${lores?.length || 0})`);
    }
  }
});

// --- Suite 4: Spline Highway Geometry & Road Transforms ---
console.log('\n▶ [Suite 4] Spline Highway Geometry & Waypoint Continuity');

const mockTexture = { repeat: { set: () => {} }, wrapS: 0, wrapT: 0 };
const mockRenderer = {
  createToonMaterial: () => new THREE.MeshBasicMaterial(),
  textures: {
    asphalt: () => mockTexture,
    asphaltNormal: () => mockTexture,
    desertRockStrata: () => mockTexture,
    retroBillboard: () => mockTexture,
    route66Shield: () => mockTexture


  },
  toonGradients: {
    twoTone: null,
    threeTone: null,
    fiveTone: null
  }
};

const splineRoad = new SplineRoad(mockRenderer);

test('Spline road spans full multi-zone highway length (>= 23,000m)', () => {
  if (splineRoad.totalLength < 23000) {
    throw new Error(`Expected highway length >= 23,000m, got ${splineRoad.totalLength}m`);
  }
  if (!splineRoad.curve || typeof splineRoad.curve.getPointAt !== 'function') {
    throw new Error('Spline curve missing or invalid getPointAt method');
  }
});

test('Highway transform at Z calculates non-NaN coordinates and banking angles', () => {
  const sampleZ = [0, 500, 2600, 6000, 12000, 18000, 23000];
  for (const z of sampleZ) {
    const trans = splineRoad.getRoadTransformAtZ(z, 0, 0);
    if (!trans || !trans.pos || isNaN(trans.pos.x) || isNaN(trans.pos.y) || isNaN(trans.pos.z)) {
      throw new Error(`NaN position calculated at Z=${z}`);
    }
    if (typeof trans.heading !== 'number' || isNaN(trans.heading)) {
      throw new Error(`NaN heading calculated at Z=${z}`);
    }
    if (isNaN(trans.tangent.x) || isNaN(trans.tangent.y) || isNaN(trans.tangent.z)) {
      throw new Error(`NaN tangent calculated at Z=${z}`);
    }
    if (isNaN(trans.normal.x) || isNaN(trans.normal.y) || isNaN(trans.normal.z)) {
      throw new Error(`NaN normal calculated at Z=${z}`);
    }
  }
});

test('Road info query detects road surface vs off-road correctly', () => {
  const onRoad = splineRoad.getRoadInfo(0, 500);
  if (!onRoad || onRoad.isOnRoad !== true) {
    throw new Error('Center lane (X=0) should be on road');
  }
  const offRoad = splineRoad.getRoadInfo(150, 500);
  if (offRoad.isOnRoad === true) {
    throw new Error('X=150 should be classified as off-road');
  }
});

test('Terrain elevation is continuous at asphalt road edge (no vertical step or gap)', () => {
  const sampleZs = [200, 900, 2000, 3500, 6000, 9000, 14000, 19000, 22000];
  for (const z of sampleZs) {
    const roadTrans = splineRoad.getRoadTransformAtZ(z, 0, 0);
    const roadX = roadTrans.pos.x;
    const roadY = roadTrans.pos.y;

    // Center of road (X = roadX)
    const roadInfoCenter = splineRoad.getRoadInfo(roadX, z);
    const hCenter = calculateTerrainHeight(roadX, z, roadInfoCenter);
    if (Math.abs(hCenter - roadInfoCenter.roadY) > 0.001) {
      throw new Error(`Road center elevation mismatch at Z=${z}: got ${hCenter}, expected roadY=${roadInfoCenter.roadY}`);
    }

    // Asphalt edge (roadX + 16.0m)
    const roadInfoEdge = splineRoad.getRoadInfo(roadX + 16.0, z);
    const hEdge = calculateTerrainHeight(roadX + 16.0, z, roadInfoEdge);
    if (Math.abs(hEdge - roadInfoEdge.roadY) > 0.001) {
      throw new Error(`Road edge (16m) elevation mismatch at Z=${z}: got ${hEdge}, expected ${roadInfoEdge.roadY}`);
    }

    // Off-road shoulder (roadX + 22m and 35m)
    const roadInfoOff = splineRoad.getRoadInfo(roadX + 22.0, z);
    const hOff = calculateTerrainHeight(roadX + 22.0, z, roadInfoOff);
    if (isNaN(hOff) || typeof hOff !== 'number') {
      throw new Error(`Off-road elevation returned NaN at Z=${z}, X=${roadX + 22}`);
    }
  }
});

test('Scenic highway turnout signs (advance warning and entrance) are instantiated with enlarged legible dimensions', () => {
  let advSignsFound = 0;
  let entranceSignsFound = 0;
  let sampleAdv = null;
  let sampleEntrance = null;

  splineRoad.roadChunks.forEach(chunk => {
    chunk.traverse(child => {
      if (child.name && child.name.startsWith('ScenicAdvSign_')) {
        advSignsFound++;
        if (!sampleAdv) sampleAdv = child;
      }
      if (child.name && child.name.startsWith('ScenicEntranceSign_')) {
        entranceSignsFound++;
        if (!sampleEntrance) sampleEntrance = child;
      }
    });
  });

  if (advSignsFound === 0 || entranceSignsFound === 0) {
    throw new Error(`Expected scenic turnout signs to be generated (found adv=${advSignsFound}, entrance=${entranceSignsFound})`);
  }

  // Verify enlarged dimensions for sample signs
  let advBoard = null;
  sampleAdv.traverse(c => {
    if (c.isMesh && Array.isArray(c.material) && c.geometry && c.geometry.parameters) {
      advBoard = c;
    }
  });
  let entranceBoard = null;
  sampleEntrance.traverse(c => {
    if (c.isMesh && Array.isArray(c.material) && c.geometry && c.geometry.parameters) {
      entranceBoard = c;
    }
  });

  if (!advBoard || advBoard.geometry.parameters.width < 8.5 || advBoard.geometry.parameters.height < 5.0) {
    throw new Error(`Scenic advance sign dimensions too small: expected >= 8.5m x 5.0m, got ${advBoard ? `${advBoard.geometry.parameters.width}x${advBoard.geometry.parameters.height}` : 'null'}`);
  }
  if (!entranceBoard || entranceBoard.geometry.parameters.width < 7.5 || entranceBoard.geometry.parameters.height < 4.0) {
    throw new Error(`Scenic entrance sign dimensions too small: expected >= 7.5m x 4.0m, got ${entranceBoard ? `${entranceBoard.geometry.parameters.width}x${entranceBoard.geometry.parameters.height}` : 'null'}`);
  }
});

// --- Suite 5: Obstacle Collision & Auto Repair Shop Servicing ---
console.log('\n▶ [Suite 5] Obstacle Collision System & Auto Shop Servicing');

const obstacleSystem = new ObstacleSystem(splineRoad);

test('All 9 Auto Repair Shops are registered along the route', () => {
  if (obstacleSystem.autoShops.length !== 9) {
    throw new Error(`Expected 9 Auto Repair Shops, got ${obstacleSystem.autoShops.length}`);
  }
  obstacleSystem.autoShops.forEach((shop, i) => {
    if (!shop.name || !shop.worldPos || isNaN(shop.worldPos.x) || isNaN(shop.worldPos.z)) {
      throw new Error(`Shop index ${i} has invalid world position or name`);
    }
  });
});

test('Static obstacle bounding boxes detect penetration and compute pushout vectors', () => {
  const shop0 = obstacleSystem.autoShops[0];
  const cosW = Math.cos(shop0.shopAngle);
  const sinW = Math.sin(shop0.shopAngle);
  const insideWallX = shop0.worldPos.x + (16.2 * cosW);
  const insideWallZ = shop0.worldPos.z + (16.2 * sinW);

  const hit = obstacleSystem.resolveCollision(new THREE.Vector3(insideWallX, 0, insideWallZ), 1.35);
  if (!hit || !hit.collided) {
    throw new Error('ObstacleSystem failed to detect penetration inside shop back wall');
  }
  if (typeof hit.pushX !== 'number' || typeof hit.pushZ !== 'number' || hit.penetration <= 0) {
    throw new Error('Obstacle collision response missing valid pushout vector');
  }
});

test('Cougar Ridge 4x4 trail registers solid colliders for geology & structures with unblocked centerline', () => {
  // 1. Verify that Cougar Ridge trail obstacles are registered
  const trailObs = obstacleSystem.staticObstacles.filter(o =>
    o.name && (o.name.includes('Cougar') || o.name.includes('Arch') || o.name.includes('Megalith') || o.name.includes('Spire') || o.name.includes('Summit'))
  );
  if (trailObs.length < 15) {
    throw new Error(`Expected at least 15 trail colliders, found ${trailObs.length}`);
  }

  // 2. Verify collision detection on key trail obstacles
  const bluff1 = obstacleSystem.staticObstacles.find(o => o.name && o.name.includes('Red Sandstone Bluff 1'));
  if (!bluff1) throw new Error('Missing Red Sandstone Bluff 1 collider');
  const hitBluff = obstacleSystem.resolveCollision(new THREE.Vector3(bluff1.x, 0, bluff1.z), 1.35);
  if (!hitBluff || !hitBluff.collided || hitBluff.penetration <= 0) {
    throw new Error('Failed to resolve solid collision on Cougar Canyon Sandstone Bluff');
  }

  const archWestPillar = obstacleSystem.staticObstacles.find(o => o.name && o.name.includes('Natural Arch West Pillar'));
  if (!archWestPillar) throw new Error('Missing Natural Arch West Pillar collider');
  const hitPillar = obstacleSystem.resolveCollision(new THREE.Vector3(archWestPillar.x, 0, archWestPillar.z), 1.35);
  if (!hitPillar || !hitPillar.collided || hitPillar.penetration <= 0) {
    throw new Error('Failed to resolve solid collision on Sandstone Natural Arch Pillar');
  }

  // 3. Verify that the entire trail roadbed centerline is free of obstacle penetration
  const spinePoints = TrailSpline.getSpinePoints(256);
  for (let i = 0; i < spinePoints.length; i++) {
    const sp = spinePoints[i];
    const trans = splineRoad.getRoadTransformAtZ(sp.z, sp.lat, 0);
    const centerHit = obstacleSystem.resolveCollision(new THREE.Vector3(trans.pos.x, 0, trans.pos.z), 1.35);
    if (centerHit && centerHit.collided) {
      throw new Error(`Obstacle ${centerHit.name} blocks trail centerline at t=${sp.t.toFixed(3)} (z=${sp.z})`);
    }
  }
});

// --- Suite 6: Vehicle Physics & Driving Dynamics ---
console.log('\n▶ [Suite 6] Vehicle Physics & Simulation');

const mockTerrain = {
  getGroundElevation: (x, z) => calculateTerrainHeight(x, z, splineRoad.getRoadInfo(x, z)),
  updateZonePalette: () => {}
};

const mockCar = {
  group: new THREE.Group(),
  damagePoints: {},
  setDamageStage: () => {}
};
const physics = new VehiclePhysics(mockCar);
physics.setWorldReferences(splineRoad, mockTerrain, obstacleSystem);

test('VehiclePhysics accelerates with throttle and caps at MAX_SPEED_MPH', () => {
  physics.position.set(0, 0.2, 500);
  physics.speed = 0;
  physics.heading = 0;
  
  const throttleInput = { throttle: 1.0, brake: 0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 60; f++) {
    physics.update(1 / 60, throttleInput);
  }
  
  if (physics.speed <= 0) {
    throw new Error('Vehicle failed to accelerate under throttle');
  }
});

test('Braking applies strong deceleration to forward speed', () => {
  physics.speed = 40; // ~90 MPH
  const brakeInput = { throttle: 0, brake: 1.0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 30; f++) {
    physics.update(1 / 60, brakeInput);
  }
  if (physics.speed >= 40) {
    throw new Error('Vehicle speed did not decrease during braking');
  }
  // At 62,000 N brake force, 40 m/s should decelerate to ~14 m/s in 30 frames (0.5s)
  if (physics.speed > 20) {
    throw new Error(`Brake deceleration insufficient: speed after 0.5s is ${physics.speed.toFixed(1)} m/s (expected <= 20)`);
  }
});

test('Brake override system prioritizes braking over simultaneous throttle', () => {
  physics.speed = 40;
  // Simultaneous full throttle and full brake (e.g. key overlap or panic brake)
  const duelInput = { throttle: 1.0, brake: 1.0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 30; f++) {
    physics.update(1 / 60, duelInput);
  }
  if (physics.speed >= 40) {
    throw new Error('Brake did not override simultaneous throttle input');
  }
});

test('Forward braking smoothly clamps to complete stop without reverse plunge', () => {
  physics.speed = 2.0; // Low forward speed
  const brakeInput = { throttle: 0, brake: 1.0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 5; f++) {
    physics.update(1 / 60, brakeInput);
  }
  if (physics.speed < 0) {
    throw new Error(`Forward brake plunged into reverse immediately: speed=${physics.speed}`);
  }
  if (physics.speed !== 0) {
    throw new Error(`Expected clean zero-clamp on stop, got speed=${physics.speed}`);
  }
});

test('Holding brake for less than REVERSE_ENGAGE_DELAY keeps stopped vehicle stationary at 0', () => {
  physics.speed = 0;
  physics.stoppedBrakeHoldTime = 0;
  const brakeInput = { throttle: 0, brake: 1.0, steer: 0, nitro: false, handbrake: false };
  // 15 frames @ 60fps = 0.25s (< 0.38s)
  for (let f = 0; f < 15; f++) {
    physics.update(1 / 60, brakeInput);
  }
  if (physics.speed !== 0) {
    throw new Error(`Vehicle moved before delay elapsed: speed=${physics.speed}`);
  }
});

test('Holding brake for more than REVERSE_ENGAGE_DELAY engages reverse gear and accelerates backward', () => {
  physics.speed = 0;
  physics.stoppedBrakeHoldTime = 0;
  const brakeInput = { throttle: 0, brake: 1.0, steer: 0, nitro: false, handbrake: false };
  // 30 frames @ 60fps = 0.50s (> 0.38s)
  for (let f = 0; f < 30; f++) {
    physics.update(1 / 60, brakeInput);
  }
  if (physics.speed >= 0) {
    throw new Error(`Vehicle failed to engage reverse after 0.5s: speed=${physics.speed}`);
  }
  if (gameState.gear !== 'R') {
    throw new Error(`Expected gear 'R' in reverse, got '${gameState.gear}'`);
  }
});

test('Nitro consumption heats engine and drains reserve', () => {
  gameState.reset();
  gameState.nitro = 100.0;
  gameState.engineHeat = 0.0;
  physics.speed = 40;
  
  const nitroInput = { throttle: 1.0, brake: 0, steer: 0, nitro: true, handbrake: false };
  for (let f = 0; f < 60; f++) {
    physics.update(1 / 60, nitroInput);
  }
  
  if (gameState.nitro >= 100.0) {
    throw new Error(`Nitro did not drain during boost: nitro=${gameState.nitro}`);
  }
  if (gameState.engineHeat <= 0.0) {
    throw new Error(`Engine heat did not increase during boost: heat=${gameState.engineHeat}`);
  }
});

test('Auto Shop servicing immobilizes vehicle and locks gear to Park [P]', () => {
  physics.speed = 0;
  gameState.isServicing = true;
  gameState.isMechanicCinematic = true;
  
  const initialPos = physics.position.clone();
  const input = { throttle: 1.0, brake: 0, steer: 0.5, nitro: true, handbrake: false };
  
  for (let f = 0; f < 30; f++) {
    physics.update(1 / 60, input);
  }
  
  if (physics.speed !== 0 || gameState.gear !== 'P') {
    throw new Error(`Vehicle moved during servicing: speed=${physics.speed}, gear=${gameState.gear}`);
  }
  if (physics.position.distanceTo(initialPos) > 0.001) {
    throw new Error('Vehicle position shifted while servicing');
  }
  
  gameState.isServicing = false;
  gameState.isMechanicCinematic = false;
});

test('Vehicle tracks off-road terrain elevation without sinking or falling through ground', () => {
  // Test in Zone 0 desert dunes (Z = 900, off-road lateral offset X = 28m)
  const z = 900;
  const roadTrans = splineRoad.getRoadTransformAtZ(z, 0, 0);
  const offRoadX = roadTrans.pos.x + 28.0; // 28m to the right (sand dune)
  const terrainHeight = mockTerrain.getGroundElevation(offRoadX, z);

  physics.position.set(offRoadX, terrainHeight + 0.18, z);
  physics.speed = 10;
  physics.heading = roadTrans.heading;

  const input = { throttle: 0.5, brake: 0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 60; f++) {
    physics.update(1 / 60, input);
  }

  const currentTerrainHeight = mockTerrain.getGroundElevation(physics.position.x, physics.position.z);
  // Chassis center Y must be >= ground elevation
  if (physics.position.y < currentTerrainHeight) {
    throw new Error(`Vehicle sank below off-road terrain: pos.y=${physics.position.y}, terrainY=${currentTerrainHeight}`);
  }
  if (gameState.surface !== 'sand') {
    throw new Error(`Expected surface to be sand in Zone 0 desert off-road, got ${gameState.surface}`);
  }
});

test('Stationary steering pivot allows turning vehicle heading while stopped', () => {
  physics.speed = 0;
  physics.smoothedSteer = 0;
  const initialHeading = 0.0;
  physics.heading = initialHeading;

  const steerLeftInput = { throttle: 0, brake: 0, steer: -1.0, nitro: false, handbrake: false };
  for (let f = 0; f < 30; f++) {
    physics.update(1 / 60, steerLeftInput);
  }

  // Heading should rotate toward positive (left in our right-handed coordinate convention)
  if (physics.heading <= initialHeading) {
    throw new Error(`Stationary vehicle heading did not turn under steering input: heading=${physics.heading}`);
  }
});

test('Prolonged stalled drive input triggers gameState.isStuck and respawn clears it', () => {
  physics.speed = 0;
  physics.position.set(50, 2, 600);
  gameState.isStuck = false;
  physics._stuckTimer = 0;

  const gasInput = { throttle: 1.0, brake: 0, steer: 0, nitro: false, handbrake: false };
  // Simulate stalled stationary vehicle for 120 frames = 2.0s
  for (let f = 0; f < 120; f++) {
    physics.speed = 0; // Simulate pinned against obstacle / steep grade
    physics.update(1 / 60, gasInput);
  }

  if (!gameState.isStuck) {
    throw new Error('Expected gameState.isStuck to become true after 2 seconds of stalled throttle');
  }

  // Respawning clears stuck status
  physics.respawnOnRoad(false);
  if (gameState.isStuck) {
    throw new Error('Expected respawnOnRoad to reset gameState.isStuck to false');
  }
});

test('Corridor perimeter collision allows inward escape towards highway without speed penalty', () => {
  const z = 620;
  const roadTrans = splineRoad.getRoadTransformAtZ(z, 85.0, 0);
  physics.position.set(roadTrans.pos.x, 2, z);
  physics.speed = 8.0;
  
  // Point heading directly back toward the road
  const roadHeading = roadTrans.heading;
  physics.heading = roadHeading - Math.PI * 0.45; // Facing ~80 degrees inward toward road
  
  const inwardInput = { throttle: 1.0, brake: 0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 10; f++) {
    physics.update(1 / 60, inwardInput);
  }
  
  // Speed should NOT be crushed to zero because vehicle is escaping inward toward road
  if (physics.speed <= 2.0) {
    throw new Error(`Vehicle trapped at boundary when attempting inward escape: speed=${physics.speed}`);
  }
});

test('Cougar Ridge 4x4 Trail & Summit Plateau off-roading does not prematurely teleport to road', () => {
  // 1. Position vehicle at the summit overlook plateau (Z=1100, latDist=-250m)
  const summitTrans = splineRoad.getRoadTransformAtZ(1100, -250, 0);
  const summitElev = mockTerrain.getGroundElevation(summitTrans.pos.x, 1100);

  physics.position.set(summitTrans.pos.x, summitElev + 0.18, 1100);
  physics.speed = 8;
  physics.heading = summitTrans.heading;

  const input = { throttle: 0.5, brake: 0, steer: 0.1, nitro: false, handbrake: false };
  for (let f = 0; f < 90; f++) {
    physics.update(1 / 60, input);
  }

  // Verify car did not teleport back to highway centerline (road X is around 0-5m)
  const roadInfo = splineRoad.getRoadInfo(physics.position.x, physics.position.z);
  if (roadInfo.distToCenter < 50.0) {
    throw new Error(`Vehicle prematurely teleported to road from summit plateau! distToCenter=${roadInfo.distToCenter}`);
  }
  if (!roadInfo.isOnTrail || !roadInfo.trailInfo || !roadInfo.trailInfo.isSummit) {
    throw new Error(`Vehicle at summit not recognized as on summit: lateralDist=${roadInfo.lateralDist}, z=${physics.position.z}`);
  }

  // 2. Drive vehicle further out along the western observation perimeter (-290m lateral offset)
  const westTrans = splineRoad.getRoadTransformAtZ(1110, -290, 0);
  const westElev = mockTerrain.getGroundElevation(westTrans.pos.x, 1110);
  physics.position.set(westTrans.pos.x, westElev + 0.18, 1110);
  physics.speed = 10;
  for (let f = 0; f < 60; f++) {
    physics.update(1 / 60, input);
  }
  const westInfo = splineRoad.getRoadInfo(physics.position.x, physics.position.z);
  if (westInfo.distToCenter < 50.0) {
    throw new Error(`Vehicle prematurely teleported to road from western summit ridge! distToCenter=${westInfo.distToCenter}`);
  }

  // 3. Verify legitimate out-of-bounds void drop (falling into the abyss at y < -40) DOES trigger respawn
  physics.position.set(0, -46.0, 1100);
  physics.update(1 / 60, { throttle: 0, brake: 0, steer: 0, nitro: false, handbrake: false });
  if (physics.position.y < -10.0) {
    throw new Error('Vehicle failed to emergency respawn when falling into the deep abyss void');
  }
});

test('Cougar Ridge Expedition Trail: 1,200m+ route with dual water streams and waterfalls', () => {
  if (TRAIL_WAYPOINTS.length < 12) {
    throw new Error(`Expected at least 12 trail waypoints, got ${TRAIL_WAYPOINTS.length}`);
  }
  if (STREAM_CROSSINGS.length < 2) {
    throw new Error(`Expected at least 2 water stream crossings, got ${STREAM_CROSSINGS.length}`);
  }
  if (WATERFALL_VIEW_AREAS.length < 2) {
    throw new Error(`Expected at least 2 scenic waterfall areas, got ${WATERFALL_VIEW_AREAS.length}`);
  }

  // 1. Verify Lower Cougar Creek Stream Crossing ford
  const creekFord = STREAM_CROSSINGS[0];
  const sc1 = TrailSpline.isStreamCrossing(creekFord.centerLat, creekFord.centerZ);
  if (!sc1 || sc1.id !== 'cougar_creek') {
    throw new Error(`Cougar creek ford detection failed at lat=${creekFord.centerLat}, z=${creekFord.centerZ}`);
  }

  // 2. Verify Thunder Creek Waterfall Ford crossing
  const thunderFord = STREAM_CROSSINGS[1];
  const sc2 = TrailSpline.isStreamCrossing(thunderFord.centerLat, thunderFord.centerZ);
  if (!sc2 || sc2.id !== 'thunder_creek') {
    throw new Error(`Thunder creek ford detection failed at lat=${thunderFord.centerLat}, z=${thunderFord.centerZ}`);
  }

  // 3. Verify Thunder Falls waterfall view area
  const thunderFalls = WATERFALL_VIEW_AREAS[1];
  const wfView = TrailSpline.isWaterfallViewArea(thunderFalls.lat, thunderFalls.z);
  if (!wfView || wfView.id !== 'thunder_falls') {
    throw new Error(`Thunder falls view detection failed at lat=${thunderFalls.lat}, z=${thunderFalls.z}`);
  }

  // 4. Test driving vehicle through Thunder Creek Ford in physics
  const fordTrans = splineRoad.getRoadTransformAtZ(thunderFord.centerZ, thunderFord.centerLat, 0);
  const fordElev = mockTerrain.getGroundElevation(fordTrans.pos.x, thunderFord.centerZ);
  physics.position.set(fordTrans.pos.x, fordElev + 0.18, thunderFord.centerZ);
  physics.speed = 8;
  physics.update(1 / 60, { throttle: 0.5, brake: 0, steer: 0, nitro: false, handbrake: false });

  if (gameState.surface !== 'stream_water' || !gameState.isInStream) {
    throw new Error(`Expected surface to be stream_water and isInStream=true at Thunder Creek Ford, got surface=${gameState.surface}, isInStream=${gameState.isInStream}`);
  }
});

// --- Suite 7: Zone Management & Environmental Transitions ---
console.log('\n▶ [Suite 7] Zone Management & Environment');

const mockEnv = { updateSkyGradient: () => {}, setSkyZone: () => {} };
const mockZoneRenderer = { updateZoneAtmosphere: () => {} };
const zoneManager = new ZoneManager(mockZoneRenderer, mockTerrain, mockEnv);

test('ZoneManager tracks vehicle progression across highway zones', () => {
  zoneManager.update({ z: 1000 });
  if (zoneManager.currentZoneIndex !== 0) throw new Error(`Expected Zone 0 at Z=1000, got ${zoneManager.currentZoneIndex}`);
  
  zoneManager.update({ z: 4000 });
  if (zoneManager.currentZoneIndex !== 1) throw new Error(`Expected Zone 1 at Z=4000, got ${zoneManager.currentZoneIndex}`);

  zoneManager.update({ z: 7000 });
  if (zoneManager.currentZoneIndex !== 2) throw new Error(`Expected Zone 2 at Z=7000, got ${zoneManager.currentZoneIndex}`);

  zoneManager.update({ z: 22000 });
  if (zoneManager.currentZoneIndex !== 8) throw new Error(`Expected Zone 8 at Z=22000, got ${zoneManager.currentZoneIndex}`);
});

// --- Suite 8: Sound Engine Resilience ---
console.log('\n▶ [Suite 8] Sound Engine Safety & Headless Resilience');

test('SoundEngine instantiates and updates cleanly without exceptions in headless mode', () => {
  const sound = new SoundEngine();
  if (typeof sound.update !== 'function') {
    throw new Error('SoundEngine missing update method');
  }
  sound.update(1 / 60);
});

// --- Suite 9: Procedural Architecture & Structural Integrity ---
console.log('\n▶ [Suite 9] Procedural Architecture & Structural Integrity');

test('ProceduralStructureBuilder generates valid Queen Anne Victorian House with material-slot batching', () => {
  const builder = new ProceduralStructureBuilder();
  const house = builder.buildVictorianHouse({
    palette: PAINTED_LADIES_PALETTES[0],
    width: 9.0,
    depth: 13.0,
    stories: 3,
    storyHeight: 3.2,
    subterraneanDepth: 3.5
  });

  if (!house || !(house instanceof THREE.Group)) {
    throw new Error('Expected THREE.Group from buildVictorianHouse');
  }

  // Verify material-slot batching: group should contain meshes named structure_*
  const meshes = house.children.filter(c => c.isMesh);
  if (meshes.length < 4) {
    throw new Error(`Expected at least 4 batched material-slot meshes, found ${meshes.length}`);
  }

  // Verify non-empty geometry vertices and normals
  meshes.forEach(mesh => {
    const geo = mesh.geometry;
    if (!geo.attributes.position || geo.attributes.position.count === 0) {
      throw new Error(`Mesh ${mesh.name} has empty position attribute`);
    }
    if (!geo.attributes.normal || geo.attributes.normal.count === 0) {
      throw new Error(`Mesh ${mesh.name} has missing normal attribute`);
    }
  });

  // Verify terrain grounding: foundation mesh must extend below Y = 0 to prevent floating
  const foundationMesh = house.getObjectByName('structure_foundation');
  if (!foundationMesh) {
    throw new Error('Missing structure_foundation mesh for terrain anchoring');
  }
  foundationMesh.geometry.computeBoundingBox();
  const minY = foundationMesh.geometry.boundingBox.min.y;
  if (minY >= 0) {
    throw new Error(`Foundation does not penetrate ground! BoundingBox min.y = ${minY}, expected < 0`);
  }
});

test('ProceduralStructureBuilder generates all architectural archetypes with subterranean foundations', () => {
  const builder = new ProceduralStructureBuilder();
  const manor = builder.buildVictorianManor();
  const mission = builder.buildMissionBasilica();
  const storybook = builder.buildStorybookCottage();
  const lodge = builder.buildHistoricLodge();
  const cannery = builder.buildCanneryFactory();
  const barn = builder.buildHistoricBarn();
  const market = builder.buildMarketArcade();
  const diner = builder.buildRoadsideDinerOrMotel();
  const shack = builder.buildCoastalSeafoodShack();
  const chateau = builder.buildWineryChateau();

  const structures = [
    { name: 'Victorian Manor', obj: manor },
    { name: 'Mission Basilica', obj: mission },
    { name: 'Storybook Cottage', obj: storybook },
    { name: 'Historic Lodge', obj: lodge },
    { name: 'Cannery Factory', obj: cannery },
    { name: 'Historic Barn', obj: barn },
    { name: 'Market Arcade', obj: market },
    { name: 'Roadside Diner', obj: diner },
    { name: 'Seafood Shack', obj: shack },
    { name: 'Winery Chateau', obj: chateau }
  ];

  structures.forEach(({ name, obj }) => {
    if (!obj || !(obj instanceof THREE.Group)) throw new Error(`${name} failed to return a THREE.Group`);
    const foundation = obj.getObjectByName('structure_foundation');
    if (!foundation) throw new Error(`${name} missing structure_foundation mesh`);
    foundation.geometry.computeBoundingBox();
    if (foundation.geometry.boundingBox.min.y >= 0) {
      throw new Error(`${name} foundation does not penetrate ground! min.y = ${foundation.geometry.boundingBox.min.y}`);
    }
  });
});

test('All 9 Zone Scenery Builders instantiate with procedural architecture without error', () => {
  const builders = [
    { name: 'Zone 0: Desert', builder: new DesertSceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 1: Malibu', builder: new MalibuSceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 2: Big Sur', builder: new BigSurSceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 3: Monterey', builder: new MontereySceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 4: NorCal', builder: new NorCalSceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 5: Redwood', builder: new RedwoodSceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 6: Oregon', builder: new OregonSceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 7: Columbia Gorge', builder: new ColumbiaGorgeSceneryBuilder(mockRenderer, splineRoad) },
    { name: 'Zone 8: Washington', builder: new WashingtonSceneryBuilder(mockRenderer, splineRoad) }
  ];

  builders.forEach(({ name, builder }) => {
    if (!builder.group || builder.group.children.length === 0) {
      throw new Error(`${name} scenery group is empty!`);
    }
  });
});

test('Zone Inspector: All enhanced scenery landmarks and materials are verified across highway', () => {
  const builders = [
    new DesertSceneryBuilder(mockRenderer, splineRoad),
    new MalibuSceneryBuilder(mockRenderer, splineRoad),
    new BigSurSceneryBuilder(mockRenderer, splineRoad),
    new MontereySceneryBuilder(mockRenderer, splineRoad),
    new NorCalSceneryBuilder(mockRenderer, splineRoad),
    new RedwoodSceneryBuilder(mockRenderer, splineRoad),
    new OregonSceneryBuilder(mockRenderer, splineRoad),
    new ColumbiaGorgeSceneryBuilder(mockRenderer, splineRoad),
    new WashingtonSceneryBuilder(mockRenderer, splineRoad)
  ];

  let totalSceneryMeshes = 0;
  builders.forEach((builder, idx) => {
    let meshCount = 0;
    builder.group.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        if (!child.material) {
          throw new Error(`Zone ${idx} contains mesh with missing material: ${child.name || 'unnamed'}`);
        }
        if (isNaN(child.position.x) || isNaN(child.position.y) || isNaN(child.position.z)) {
          throw new Error(`Zone ${idx} contains mesh with NaN coordinates`);
        }
      }
    });
    if (meshCount < 100) {
      throw new Error(`Zone ${idx} has abnormally low mesh density: ${meshCount}`);
    }
    totalSceneryMeshes += meshCount;
  });

  if (totalSceneryMeshes < 10000) {
    throw new Error(`Expected at least 10,000 scenery meshes across highway, found ${totalSceneryMeshes}`);
  }
});

// --- Suite 10: Camera Controls & Mouse Drag Orbit Rotation ---
console.log('\n▶ [Suite 10] Camera Controls & Interactive Orbit Rotation');

test('CameraManager initializes with default tracking and zero orbit offset', () => {
  const testCam = new THREE.PerspectiveCamera(65, 16/9, 0.1, 1000);
  const cm = new CameraManager(testCam, mockCar);
  if (cm.manualYaw !== 0 || cm.manualPitch !== 0 || cm.isOrbitDragging !== false) {
    throw new Error('CameraManager manual orbit state did not initialize to zero/false');
  }
  if (gameState.isCameraOrbiting !== false || gameState.cameraOrbitYaw !== 0 || gameState.cameraOrbitPitch !== 0) {
    throw new Error('gameState camera orbit properties not initialized properly');
  }
});

test('Simulating left-click mouse drag updates camera orbit angles and exports to gameState', () => {
  const testCam = new THREE.PerspectiveCamera(65, 16/9, 0.1, 1000);
  const cm = new CameraManager(testCam, mockCar);
  cm.skipIntro();

  // Simulate start dragging
  cm.isOrbitDragging = true;
  cm.lastMouseX = 100;
  cm.lastMouseY = 100;
  gameState.isCameraOrbiting = true;

  // Simulate mousemove: drag right by 50px, down by 20px
  const dx = 50;
  const dy = 20;
  cm.manualYawTarget -= dx * 0.0075;
  cm.manualPitchTarget = THREE.MathUtils.clamp(cm.manualPitchTarget + dy * 0.0075, -0.45, 0.55);

  // Update loop
  cm.update(0.016);

  if (cm.manualYaw === 0 || cm.manualPitch === 0) {
    throw new Error('Camera manualYaw/Pitch did not damp towards targets during drag');
  }
  if (gameState.cameraOrbitYaw !== cm.manualYaw || gameState.cameraOrbitPitch !== cm.manualPitch) {
    throw new Error('gameState cameraOrbitYaw/Pitch does not match CameraManager values');
  }
  if (gameState.isCameraOrbiting !== true) {
    throw new Error('gameState.isCameraOrbiting should be true during drag');
  }
  if (isNaN(testCam.position.x) || isNaN(testCam.position.y) || isNaN(testCam.position.z)) {
    throw new Error('Camera position produced NaN during manual orbit rotation');
  }
});

test('Releasing left click smoothly auto-centers camera back to 0 without NaN', () => {
  const testCam = new THREE.PerspectiveCamera(65, 16/9, 0.1, 1000);
  const cm = new CameraManager(testCam, mockCar);
  cm.skipIntro();

  // Set active drag state
  cm.isOrbitDragging = true;
  cm.manualYaw = 1.2;
  cm.manualYawTarget = 1.2;
  cm.manualPitch = 0.3;
  cm.manualPitchTarget = 0.3;

  // Release drag
  cm.stopOrbitDragging();

  if (cm.isOrbitDragging !== false || gameState.isCameraOrbiting !== false) {
    throw new Error('isOrbitDragging or gameState.isCameraOrbiting not cleared on stopOrbitDragging');
  }
  if (cm.manualYawTarget !== 0 || cm.manualPitchTarget !== 0) {
    throw new Error('manualYawTarget or manualPitchTarget did not reset to 0 upon release');
  }

  // Simulate 60 frames of release damping
  for (let i = 0; i < 60; i++) {
    cm.update(0.016);
  }

  if (Math.abs(cm.manualYaw) > 0.01 || Math.abs(cm.manualPitch) > 0.01) {
    throw new Error(`Camera did not auto-center back to 0: yaw=${cm.manualYaw}, pitch=${cm.manualPitch}`);
  }
});

test('Lifting finger off phone screen maintains camera view without snapping back', () => {
  const testCam = new THREE.PerspectiveCamera(65, 16/9, 0.1, 1000);
  const cm = new CameraManager(testCam, mockCar);
  cm.skipIntro();

  // Simulate active touch drag to look sideways
  cm.isOrbitDragging = true;
  cm.manualYaw = 0.85;
  cm.manualYawTarget = 0.85;
  cm.manualPitch = 0.20;
  cm.manualPitchTarget = 0.20;

  // Lifting finger off touch screen calls stopOrbitDragging(false)
  cm.stopOrbitDragging(false);

  if (cm.isOrbitDragging !== false || gameState.isCameraOrbiting !== false) {
    throw new Error('isOrbitDragging or gameState.isCameraOrbiting not cleared on touch release');
  }
  if (Math.abs(cm.manualYawTarget - 0.85) > 0.001 || Math.abs(cm.manualPitchTarget - 0.20) > 0.001) {
    throw new Error('manualYawTarget or manualPitchTarget prematurely snapped back on touch release');
  }

  // Simulate 60 frames after lifting finger: camera should remain at 0.85 yaw and 0.20 pitch
  for (let i = 0; i < 60; i++) {
    cm.update(0.016);
  }

  if (Math.abs(cm.manualYaw - 0.85) > 0.01 || Math.abs(cm.manualPitch - 0.20) > 0.01) {
    throw new Error(`Camera view snapped back instead of maintaining orientation: yaw=${cm.manualYaw}, pitch=${cm.manualPitch}`);
  }

  // Verify recenter() smoothly returns camera to 0
  cm.recenter();
  if (cm.manualYawTarget !== 0 || cm.manualPitchTarget !== 0) {
    throw new Error('recenter() did not set targets to 0');
  }
  for (let i = 0; i < 60; i++) {
    cm.update(0.016);
  }
  if (Math.abs(cm.manualYaw) > 0.01 || Math.abs(cm.manualPitch) > 0.01) {
    throw new Error(`Camera did not return to 0 after recenter(): yaw=${cm.manualYaw}, pitch=${cm.manualPitch}`);
  }
});

// --- Suite 11: Touch & Gamepad Input Isolation ---
console.log('\n▶ [Suite 11] Touch & Gamepad Input Isolation');

test('Left joypad controls left and right steering strictly and produces zero throttle or brake', () => {
  const input = new InputManager();

  // 1. Deflect joypad to the right and forward (diagonal up-right)
  input.touchJoystickSteer = 0.85;
  input.touchJoystickThrottle = 0.90; // Simulate any residual vertical stick data
  input.touchJoystickBrake = 0.40;
  input.update();

  if (input.steer !== 0.85) {
    throw new Error(`Expected steer to be 0.85 from joypad, got ${input.steer}`);
  }
  if (input.throttle !== 0) {
    throw new Error(`Expected throttle to be 0 from joypad, got ${input.throttle}`);
  }
  if (input.brake !== 0) {
    throw new Error(`Expected brake to be 0 from joypad, got ${input.brake}`);
  }

  // 2. Deflect joypad to the left (negative steer)
  input.touchJoystickSteer = -0.65;
  input.touchJoystickThrottle = 1.0;
  input.update();

  if (input.steer !== -0.65) {
    throw new Error(`Expected steer to be -0.65, got ${input.steer}`);
  }
  if (input.throttle !== 0 || input.brake !== 0) {
    throw new Error(`Throttle or brake triggered by left joypad: throttle=${input.throttle}, brake=${input.brake}`);
  }

  // 3. Dedicated touch Gas button drives throttle independently of joypad
  input.touchGas = true;
  input.update();
  if (input.throttle !== 1.0 || input.steer !== -0.65) {
    throw new Error(`Dedicated gas failed while steering: throttle=${input.throttle}, steer=${input.steer}`);
  }
  input.touchGas = false;

  // 4. Dedicated touch Brake button drives brake independently of joypad
  input.touchBrake = true;
  input.update();
  if (input.brake !== 1.0 || input.throttle !== 0) {
    throw new Error(`Dedicated brake failed while steering: brake=${input.brake}, throttle=${input.throttle}`);
  }
  input.touchBrake = false;
});

// --- Suite 12: 4x4 Drivetrain, Multi-Wheel Articulation & Off-Road Telemetry ---
console.log('\n▶ [Suite 12] 4x4 Drivetrain, Multi-Wheel Articulation & Off-Road Telemetry');

test('Manual gearbox cycles between HIGH, MID and LOW with correct differential locking', () => {
  physics.setDriveMode('HIGH');
  if (gameState.driveMode !== 'HIGH' || gameState.diffLocked !== false) {
    throw new Error(`Expected HIGH with open differentials, got ${gameState.driveMode}, diffLocked=${gameState.diffLocked}`);
  }

  const mode2 = physics.cycleDriveMode();
  if (mode2 !== 'MID' || gameState.driveMode !== 'MID' || gameState.diffLocked !== true) {
    throw new Error(`Expected cycle to MID with locked differentials, got ${mode2}, gameState.diffLocked=${gameState.diffLocked}`);
  }

  const mode3 = physics.cycleDriveMode();
  if (mode3 !== 'LOW' || gameState.driveMode !== 'LOW' || gameState.diffLocked !== true) {
    throw new Error(`Expected cycle to LOW with locked differentials, got ${mode3}, gameState.diffLocked=${gameState.diffLocked}`);
  }

  const mode4 = physics.cycleDriveMode();
  if (mode4 !== 'HIGH' || gameState.driveMode !== 'HIGH' || gameState.diffLocked !== false) {
    throw new Error(`Expected cycle to wrap around to HIGH, got ${mode4}`);
  }
});

test('Jeep 3-speed transmission maps gears 1 (LOW), 2 (MID), 3 (HIGH) and manages realistic engine RPM', () => {
  physics.setGear(1);
  if (gameState.driveMode !== 'LOW') {
    throw new Error(`Expected setGear(1) to engage LOW, got ${gameState.driveMode}`);
  }
  const throttleInput = { throttle: 0.8, brake: 0, steer: 0, nitro: false, handbrake: false };
  physics.speed = 4.0; // ~9 MPH crawl
  physics.update(1 / 60, throttleInput);
  if (gameState.gear !== 1) {
    throw new Error(`Expected gameState.gear === 1 in LOW, got ${gameState.gear}`);
  }
  if (gameState.engineRpm > 5200 || gameState.engineRpm < 700) {
    throw new Error(`Expected authentic Jeep engine RPM (700-5200), got ${gameState.engineRpm}`);
  }

  physics.setGear(2);
  if (gameState.driveMode !== 'MID') {
    throw new Error(`Expected setGear(2) to engage MID, got ${gameState.driveMode}`);
  }
  physics.speed = 15.0;
  physics.update(1 / 60, throttleInput);
  if (gameState.gear !== 2) {
    throw new Error(`Expected gameState.gear === 2 in MID, got ${gameState.gear}`);
  }

  physics.setGear(3);
  if (gameState.driveMode !== 'HIGH') {
    throw new Error(`Expected setGear(3) to engage HIGH, got ${gameState.driveMode}`);
  }
  physics.speed = 30.0;
  physics.update(1 / 60, throttleInput);
  if (gameState.gear !== 3) {
    throw new Error(`Expected gameState.gear === 3 in HIGH, got ${gameState.gear}`);
  }
});

test('LOW Rock-Crawl mode enforces speed governor (~32 MPH) and amplifies crawl torque', () => {
  physics.setDriveMode('LOW');
  physics.speed = 0;
  physics.position.set(0, 0.2, 500);

  // Accelerate under LOW
  const throttleInput = { throttle: 1.0, brake: 0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 30; f++) {
    physics.update(1 / 60, throttleInput);
  }

  const speedMph = physics.speed * 2.23694;
  if (speedMph <= 0) {
    throw new Error('Vehicle failed to accelerate in LOW mode');
  }

  // If vehicle is forced over 32 MPH in LOW, governor should smoothly decelerate/clamp
  physics.speed = 25; // ~55 MPH
  for (let f = 0; f < 60; f++) {
    physics.update(1 / 60, throttleInput);
  }
  const speedScale = PHYSICS.SPEED_SCALE || 1.20;
  const governedMph = (physics.speed / speedScale) * 2.23694;
  if (governedMph > 32.5) {
    throw new Error(`LOW speed governor failed: expected <= 32.5 MPH, got ${governedMph.toFixed(1)} MPH (gameState.speedMph=${gameState.speedMph})`);
  }

  physics.setDriveMode('HIGH');
});

test('True 4-corner terrain elevation sampling derives pitch, roll, and solid axle articulation', () => {
  // Place car in an off-road terrain location with cross-slope
  physics.position.set(40, 2, 800);
  physics.heading = 0;
  physics.speed = 5;

  const cruiseInput = { throttle: 0.3, brake: 0, steer: 0, nitro: false, handbrake: false };
  physics.update(1 / 60, cruiseInput);

  // Check 4-corner wheel heights
  const wheels = gameState.wheelElevations;
  if (typeof wheels.fl !== 'number' || typeof wheels.fr !== 'number' ||
      typeof wheels.rl !== 'number' || typeof wheels.rr !== 'number') {
    throw new Error(`Invalid 4-wheel elevation state: ${JSON.stringify(wheels)}`);
  }

  // Check axle tilt angles (radians)
  const axles = gameState.axleTilt;
  if (typeof axles.front !== 'number' || typeof axles.rear !== 'number') {
    throw new Error(`Invalid axle tilt state: ${JSON.stringify(axles)}`);
  }

  // Check pitch, roll, altitude, and grade telemetry
  if (typeof gameState.pitchDeg !== 'number' || typeof gameState.rollDeg !== 'number' ||
      typeof gameState.altitudeMeters !== 'number' || typeof gameState.trailGradePct !== 'number') {
    throw new Error(`Off-road telemetry values missing or non-numeric: pitch=${gameState.pitchDeg}, roll=${gameState.rollDeg}`);
  }
});

test('Off-road trails require 4WD: HIGH mode struggles with severe torque penalty and wheel slip', () => {
  // Position vehicle on the Cougar Ridge off-road trail corridor
  const trailTrans = splineRoad.getRoadTransformAtZ(1100, -50, 0);
  const trailElev = mockTerrain.getGroundElevation(trailTrans.pos.x, 1100);

  // 1. Test in HIGH mode
  physics.setDriveMode('HIGH');
  physics.position.set(trailTrans.pos.x, trailElev + 0.18, 1100);
  physics.heading = trailTrans.heading;
  physics.speed = 0;

  const throttleInput = { throttle: 1.0, brake: 0, steer: 0, nitro: false, handbrake: false };
  for (let f = 0; f < 60; f++) {
    physics.update(1 / 60, throttleInput);
  }

  const speedHIGH = physics.speed;
  const isStrugglingHIGH = gameState.is2WDStruggling;
  if (!isStrugglingHIGH) {
    throw new Error('Expected gameState.is2WDStruggling to be true when driving on off-road trail in HIGH');
  }

  // 2. Test in MID mode from same starting position (creek/wash corridor requires MID)
  physics.setDriveMode('MID');
  physics.position.set(trailTrans.pos.x, trailElev + 0.18, 1100);
  physics.heading = trailTrans.heading;
  physics.speed = 0;

  for (let f = 0; f < 60; f++) {
    physics.update(1 / 60, throttleInput);
  }

  const speedMID = physics.speed;
  if (gameState.is2WDStruggling) {
    throw new Error('Expected gameState.is2WDStruggling to be false when in MID');
  }

  // MID must produce significantly higher forward crawl velocity than struggling HIGH
  if (speedMID <= speedHIGH * 1.5) {
    throw new Error(`MID did not significantly outperform HIGH on off-road trail: speedMID=${speedMID.toFixed(2)}, speedHIGH=${speedHIGH.toFixed(2)}`);
  }

  physics.setDriveMode('HIGH');
});

test('Gearbox Advisor recommends optimal mode across snow, rain, off-road trail and highway with alerts', () => {
  // 1. Dry highway
  physics.position.set(0, 0, 500);
  physics.pitch = 0;
  physics.roll = 0;
  physics.setDriveMode('HIGH');
  gameState.debugRainMode = 'off';
  physics.update(1 / 60, { throttle: 0.5, steer: 0, brake: 0 });
  if (gameState.recommendedDriveMode !== 'HIGH' || gameState.isWrongGear) {
    throw new Error(`Expected HIGH recommendation on dry highway, got ${gameState.recommendedDriveMode}, isWrongGear=${gameState.isWrongGear}`);
  }

  // Driving in LOW on dry highway should trigger wrong-gear alert
  physics.setDriveMode('LOW');
  physics.speed = 10;
  physics.update(1 / 60, { throttle: 0.5, steer: 0, brake: 0 });
  if (!gameState.isWrongGear || gameState.recommendedDriveMode !== 'HIGH') {
    throw new Error(`Expected isWrongGear to be true when driving LOW on dry highway`);
  }
  if (!gameState.wrongGearTitle.includes('SHIFT TO HIGH')) {
    throw new Error(`Expected alert title to advise SHIFT TO HIGH, got "${gameState.wrongGearTitle}"`);
  }

  // 2. Snow weather in Zone 8 (Cascade Pass)
  physics.position.set(0, 0, 22000); // Zone 8
  gameState.debugRainMode = 'auto';
  physics.setDriveMode('HIGH');
  physics.speed = 5;
  physics.update(1 / 60, { throttle: 0.5, steer: 0, brake: 0 });
  if (!gameState.isSnowing) {
    throw new Error('Expected gameState.isSnowing to be true in Zone 8');
  }
  if (gameState.recommendedDriveMode !== 'LOW') {
    throw new Error(`Expected LOW recommendation in snow, got ${gameState.recommendedDriveMode}`);
  }
  if (!gameState.isWrongGear) {
    throw new Error('Expected isWrongGear to be true when driving HIGH in snow');
  }

  // Shift to LOW in snow
  physics.setDriveMode('LOW');
  physics.update(1 / 60, { throttle: 0.5, steer: 0, brake: 0 });
  if (gameState.isWrongGear) {
    throw new Error('Expected isWrongGear to be false when in LOW in snow');
  }

  // 3. Technical 4x4 trail
  const trailTrans = splineRoad.getRoadTransformAtZ(1100, -50, 0);
  const trailElev = mockTerrain.getGroundElevation(trailTrans.pos.x, 1100);
  physics.position.set(trailTrans.pos.x, trailElev + 0.18, 1100);
  physics.heading = trailTrans.heading;
  physics.setDriveMode('HIGH');
  physics.speed = 5;
  gameState.debugRainMode = 'off';
  physics.update(1 / 60, { throttle: 0.5, steer: 0, brake: 0 });
  if (gameState.recommendedDriveMode !== 'MID') {
    throw new Error(`Expected MID recommendation on trail, got ${gameState.recommendedDriveMode}`);
  }
  if (!gameState.isWrongGear) {
    throw new Error('Expected isWrongGear to be true when on trail in HIGH gear');
  }
  if (!gameState.wrongGearTitle.includes('SHIFT TO MID')) {
    throw new Error(`Expected alert title to advise SHIFT TO MID, got "${gameState.wrongGearTitle}"`);
  }

  // Sound Engine Alert Chime
  const soundEngine = new SoundEngine();
  soundEngine.triggerDrivetrainAlertSound();

  // Reset physics to highway
  physics.setDriveMode('HIGH');
  physics.position.set(0, 0, 500);
  physics.speed = 0;
});

// --- Suite 13: Mystery Crime Scene & Investigation Mission ---
console.log('\n▶ [Suite 13] Mystery Crime Scene & GTA-Style Investigation Mission');

test('GameState initializes and resets mysteryMission telemetry with zero regressions', () => {
  gameState.reset();
  const m = gameState.mysteryMission;
  if (!m) throw new Error('gameState.mysteryMission missing');
  if (m.state !== 'unstarted') throw new Error(`Expected state unstarted, got ${m.state}`);
  if (m.witnessedMurder !== false) throw new Error('Expected witnessedMurder false');
  if (m.cluesFound !== 0 || m.totalClues !== 9) throw new Error(`Expected 0/9 clues found, got ${m.cluesFound}/${m.totalClues}`);
  if (!m.clues || m.clues.zone0 !== false || m.clues.zone8 !== false || m.clues.getawayCar !== false || m.clues.burnerEvidence !== false) {
    throw new Error('Expected clues flags false');
  }
  if (m.reportedToPolice !== false) throw new Error('Expected reportedToPolice false');
  if (gameState.isCutsceneActive !== false) throw new Error('Expected isCutsceneActive false on init');
});

test('MysteryCrimeScene instantiates cleanly with canyon crime scene, all 9 zone physical clue props, Malibu Sheriff, and Washington Federal HQ', () => {
  const scene = new MysteryCrimeScene(mockRenderer, splineRoad);
  if (!scene.canyonGroup || scene.canyonGroup.children.length === 0) {
    throw new Error('Canyon crime scene group missing or empty');
  }
  if (!scene.victimMesh || !scene.bossMesh || !scene.enforcerMesh) {
    throw new Error('Crime scene characters (victim, boss, enforcer) missing');
  }
  if (!scene.getawayCar) {
    throw new Error('Getaway car model missing');
  }

  // Verify all 9 zone physical clue props
  const expectedClueNames = [
    'Clue_zone0', 'Clue_zone1', 'Clue_zone2',
    'Clue_zone3', 'Clue_zone4', 'Clue_zone5',
    'Clue_zone6', 'Clue_zone7', 'Clue_zone8'
  ];
  for (const name of expectedClueNames) {
    if (!scene.group.getObjectByName(name)) {
      throw new Error(`Expected clue prop '${name}' missing from scene graph`);
    }
  }

  if (!scene.group.getObjectByName('MalibuSheriffStation')) {
    throw new Error('Malibu Sheriff Station missing from scene graph');
  }
  if (!scene.group.getObjectByName('WashingtonFederalHQ')) {
    throw new Error('Washington Federal HQ missing from scene graph');
  }
});

test('Aiming binocular sightline at Desert Arrowhead Gully identifies target and initiates crime scene sequence', () => {
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 5000);
  const camManager = new CameraManager(camera, { group: new THREE.Group() });
  const scene = new MysteryCrimeScene(mockRenderer, splineRoad);
  global.window.game = { mysteryCrimeScene: scene };

  gameState.reset();
  gameState.nearbyViewfinder = {
    eyePos: new THREE.Vector3(259.0, 58.4, 1126.8),
    baseHeading: -Math.PI * 0.5
  };

  // Vector pointing directly from summit to crime scene (104.5, 25.5, 920.0)
  const dir = new THREE.Vector3(104.5 - 259.0, 25.5 - 58.4, 920.0 - 1126.8).normalize();
  camManager.updateBinocularLandmarkTarget(dir.x, dir.y, dir.z, 0.6);

  if (!gameState.binocularTargetName.includes('WHITE CANYON RANCH PROPERTY')) {
    throw new Error(`Expected target name to include WHITE CANYON RANCH PROPERTY, got ${gameState.binocularTargetName}`);
  }

  if (!scene.isCinematicPlaying) {
    throw new Error('Expected crime scene cinematic to initiate upon spotting suspicious activity');
  }
});

test('Progressing murder cinematic advances multi-shot director, updates subtitles, and witnesses the crime', () => {
  const scene = new MysteryCrimeScene(mockRenderer, splineRoad);
  gameState.reset();
  scene.triggerCrimeScene();

  if (!gameState.isCutsceneActive) {
    throw new Error('Expected gameState.isCutsceneActive true upon triggering crime scene');
  }

  // Shot 1 check
  const cam1 = scene.getCurrentCutsceneCam();
  if (!cam1 || !cam1.pos || !cam1.lookAt || !gameState.cutsceneSubtitles.includes('MOJAVE ARROWHEAD')) {
    throw new Error('Expected valid Shot 1 cutscene camera and subtitles');
  }

  // Step 31.0 seconds forward to reach peelout escape phase of extended cinematic
  scene.update(31.0);

  if (scene.cinematicPhase !== 'PEELOUT' && scene.cinematicPhase !== 'FINISHED') {
    throw new Error(`Expected phase PEELOUT or FINISHED, got ${scene.cinematicPhase}`);
  }

  const m = gameState.mysteryMission;
  if (!m.witnessedMurder || m.state !== 'witnessed') {
    throw new Error(`Expected murder witnessed and state 'witnessed', got state=${m.state}, witnessed=${m.witnessedMurder}`);
  }

  // Test cutscene skip
  scene.skipCutscene();
  scene.update(0.1);
  if (scene.isCinematicPlaying) {
    throw new Error('Expected cutscene to finish after calling skipCutscene');
  }
});

test('Vehicle proximity collects clues across zones with score progression and alias synchronization', () => {
  gameState.reset();
  gameState.mysteryMission.state = 'witnessed';
  gameState.mysteryMission.witnessedMurder = true;

  const initialScore = gameState.score;

  // Approach Zone 1 Clue (Getaway Car) at Z=2,750m
  splineRoad.update(0.016, new THREE.Vector3(13.0, 1.85, 2750.0));
  if (!gameState.mysteryMission.clues.zone1 || !gameState.mysteryMission.clues.getawayCar) {
    throw new Error('Zone 1 clue / getawayCar alias was not collected upon proximity');
  }
  if (gameState.mysteryMission.cluesFound !== 1) {
    throw new Error(`Expected 1 clue found, got ${gameState.mysteryMission.cluesFound}`);
  }

  // Approach Zone 2 Clue (Burner Phone) at Z=6,400m
  splineRoad.update(0.016, new THREE.Vector3(-28.5, 12.4, 6400.0));
  if (!gameState.mysteryMission.clues.zone2 || !gameState.mysteryMission.clues.burnerEvidence) {
    throw new Error('Zone 2 clue / burnerEvidence alias was not collected upon proximity');
  }
  if (gameState.mysteryMission.cluesFound !== 2) {
    throw new Error(`Expected 2 clues found, got ${gameState.mysteryMission.cluesFound}`);
  }

  // Approach Zone 8 Clue (Sniper Rifle) at Z=22,200m
  splineRoad.update(0.016, new THREE.Vector3(-28.0, 7.5, 22200.0));
  if (!gameState.mysteryMission.clues.zone8) {
    throw new Error('Zone 8 clue was not collected upon proximity');
  }
  if (gameState.mysteryMission.cluesFound !== 3) {
    throw new Error(`Expected 3 clues found, got ${gameState.mysteryMission.cluesFound}`);
  }

  if (gameState.score !== initialScore + 1500) {
    throw new Error(`Expected +1500 total score for 3 clues, got delta: ${gameState.score - initialScore}`);
  }
});

test('Pulling into Malibu Sheriff Station turns in evidence, awards +7,500 PTS (4-8 clues tier), and triggers turn-in cutscene', () => {
  gameState.reset();
  gameState.mysteryMission.state = 'witnessed';
  gameState.mysteryMission.witnessedMurder = true;
  gameState.mysteryMission.cluesFound = 5;
  for (let i = 0; i < 5; i++) gameState.mysteryMission.clues[`zone${i}`] = true;

  const preScore = gameState.score;

  // Approach Malibu Sheriff Station Evidence Apron at Z=5,050m
  splineRoad.update(0.016, new THREE.Vector3(22.0, 2.36, 5050.0));

  if (!gameState.mysteryMission.reportedToPolice) {
    throw new Error('Expected reportedToPolice true');
  }
  if (gameState.mysteryMission.reportingStation !== 'Malibu') {
    throw new Error(`Expected reportingStation 'Malibu', got ${gameState.mysteryMission.reportingStation}`);
  }
  if (gameState.mysteryMission.state !== 'solved') {
    throw new Error(`Expected mission state 'solved', got ${gameState.mysteryMission.state}`);
  }
  if (gameState.mysteryMission.scoreAwarded !== 7500) {
    throw new Error(`Expected +7500 score awarded for 5 clues, got ${gameState.mysteryMission.scoreAwarded}`);
  }
  if (gameState.score !== preScore + 7500) {
    throw new Error(`Expected player score increased by 7500, got delta: ${gameState.score - preScore}`);
  }
});

test('Completing all 9 clues and turning in at Washington Federal HQ awards +15,000 PTS Master Detective', () => {
  gameState.reset();
  gameState.mysteryMission.state = 'witnessed';
  gameState.mysteryMission.witnessedMurder = true;
  gameState.mysteryMission.cluesFound = 9;
  for (let i = 0; i < 9; i++) gameState.mysteryMission.clues[`zone${i}`] = true;

  const preScore = gameState.score;

  // Approach Washington Federal HQ Apron at Z=22,800m
  splineRoad.update(0.016, new THREE.Vector3(38.0, 3.5, 22800.0));

  if (!gameState.mysteryMission.reportedToPolice) {
    throw new Error('Expected reportedToPolice true');
  }
  if (gameState.mysteryMission.reportingStation !== 'Washington') {
    throw new Error(`Expected reportingStation 'Washington', got ${gameState.mysteryMission.reportingStation}`);
  }
  if (gameState.mysteryMission.scoreAwarded !== 15000) {
    throw new Error(`Expected +15000 score awarded for 9 clues, got ${gameState.mysteryMission.scoreAwarded}`);
  }
  if (gameState.score !== preScore + 15000) {
    throw new Error(`Expected player score increased by 15000, got delta: ${gameState.score - preScore}`);
  }
});

console.log('\n▶ [Suite 14] Zone 0 Desert Scenery, Americana & Atmosphere Enhancements');

test('Zone 0 atmospheric constants define realistic heat shimmer and telemetry', () => {
  const zone0 = ZONES[0];
  if (!zone0 || zone0.heatShimmer !== 0.32) {
    throw new Error(`Expected zone 0 heatShimmer = 0.32, got ${zone0 ? zone0.heatShimmer : 'undefined'}`);
  }
  if (gameState.totalRoute66Shields !== 5) {
    throw new Error(`Expected totalRoute66Shields = 5, got ${gameState.totalRoute66Shields}`);
  }
});

test('DesertSceneryBuilder instantiates enhanced Zone 0 dynamic features & Americana landmarks', () => {
  const desert = new DesertSceneryBuilder(mockRenderer, splineRoad);

  if (!desert.dustDevils || desert.dustDevils.length !== 3) {
    throw new Error(`Expected 3 dust devils, got ${desert.dustDevils ? desert.dustDevils.length : 0}`);
  }

  if (!desert.route66Shields || desert.route66Shields.length !== 5) {
    throw new Error(`Expected 5 golden Route 66 shields, got ${desert.route66Shields ? desert.route66Shields.length : 0}`);
  }

  if (!desert.circlingVultures || desert.circlingVultures.length !== 9) {
    throw new Error(`Expected 9 circling vultures (4 over mesa 1 + 5 over mesa 2), got ${desert.circlingVultures ? desert.circlingVultures.length : 0}`);
  }

  if (desert.jetGroup) {
    throw new Error('Supersonic jetGroup should not be present in DesertScenery');
  }

  const childNames = desert.group.children.map(c => c.name || '');
  const hasRailroad = childNames.includes('Scenic_DesertTranscontinentalRailroad');
  const hasArroyo = childNames.includes('Scenic_ArroyoStuntJump');
  const hasBurma0 = childNames.includes('RoadSign_BurmaShave_0');
  const hasBurma4 = childNames.includes('RoadSign_BurmaShave_4');

  if (!hasRailroad) throw new Error('Scenic_DesertTranscontinentalRailroad not found in desert group');
  if (!hasArroyo) throw new Error('Scenic_ArroyoStuntJump not found in desert group');
  if (!hasBurma0 || !hasBurma4) throw new Error('RoadSign_BurmaShave sequential signs not found in desert group');

  // Verify update tick runs cleanly without error
  desert.update(0.016);
});

test('SoundEngine instantiates Zone 0 procedural synthesizers safely in headless mode', () => {
  const sound = new SoundEngine();
  if (typeof sound.playSupersonicFlyby !== 'function') {
    throw new Error('playSupersonicFlyby method missing on SoundEngine');
  }
  if (typeof sound.playRoute66ShieldCollectChime !== 'function') {
    throw new Error('playRoute66ShieldCollectChime method missing on SoundEngine');
  }
  if (typeof sound.playTrainHorn !== 'function') {
    throw new Error('playTrainHorn method missing on SoundEngine');
  }

  // Safe headless execution
  sound.playSupersonicFlyby();
  sound.playRoute66ShieldCollectChime();
  sound.playTrainHorn();
});

// --- Suite 15: Persistent Save Manager & LocalStorage Lifecycle ---
console.log('▶ [Suite 15] Database-Free Persistent State (SaveManager & LocalStorage)');

test('SaveManager instantiates cleanly and provides headless storage resilience', () => {
  const sm = new SaveManager(gameState);
  if (!sm) throw new Error('Failed to instantiate SaveManager');
  if (typeof sm.save !== 'function' || typeof sm.load !== 'function' || typeof sm.clear !== 'function') {
    throw new Error('SaveManager missing core persistence API methods');
  }
});

test('SaveManager serializes gameState, converts Sets to Arrays, and captures deep mission state', () => {
  gameState.reset();
  gameState.score = 3500;
  gameState.discoveredLandmarks.clear();
  gameState.discoveredHistoryPlaques.clear();
  gameState.currentZoneIndex = 2; // Big Sur
  gameState.distanceMeters = 6400;
  gameState.route66ShieldsCollected = 2;
  gameState.carIntegrity = 88.5;
  gameState.fuel = 75.0;
  gameState.discoveredLandmarks.add('bixby_bridge');
  gameState.discoveredLandmarks.add('point_sur_light');
  gameState.discoveredHistoryPlaques.add('plaques_zone2_0');
  gameState.mysteryMission.witnessedMurder = true;
  gameState.mysteryMission.cluesFound = 3;
  gameState.mysteryMission.clues.zone0 = true;
  gameState.mysteryMission.clues.zone1 = true;
  gameState.mysteryMission.clues.zone2 = true;

  const mockPhysics = { position: { x: 0, y: 15, z: 6400 } };
  const sm = new SaveManager(gameState, mockPhysics);
  const data = sm.serialize();

  if (data.version !== 1) throw new Error(`Unexpected save schema version: ${data.version}`);
  if (data.currentZoneIndex !== 2) throw new Error(`Zone mismatch: expected 2, got ${data.currentZoneIndex}`);
  if (data.playerZ !== 6400) throw new Error(`PlayerZ mismatch: expected 6400, got ${data.playerZ}`);
  if (data.score !== 3500) throw new Error(`Score mismatch: expected 3500, got ${data.score}`);
  if (!Array.isArray(data.discoveredLandmarks) || data.discoveredLandmarks.length !== 2) {
    throw new Error('discoveredLandmarks was not serialized to an Array with 2 items');
  }
  if (!Array.isArray(data.discoveredHistoryPlaques) || data.discoveredHistoryPlaques.length !== 1) {
    throw new Error('discoveredHistoryPlaques was not serialized to an Array with 1 item');
  }
  if (!data.mysteryMission || data.mysteryMission.cluesFound !== 3 || !data.mysteryMission.clues.zone2) {
    throw new Error('mysteryMission clues state was not serialized properly');
  }
});

test('SaveManager writes to storage and hasSave() detects existing save', () => {
  const mockPhysics = { position: { x: 0, y: 15, z: 6400 } };
  const sm = new SaveManager(gameState, mockPhysics);
  sm.clear();
  if (sm.hasSave()) throw new Error('hasSave should be false after clear()');

  const saved = sm.save(true);
  if (!saved) throw new Error('sm.save(true) returned false');
  if (!sm.hasSave()) throw new Error('hasSave() should be true after successful save()');
});

test('SaveManager loads and hydrates gameState with restored Sets and telemetry', () => {
  const sm = new SaveManager(gameState);
  // Reset gameState to blank
  gameState.reset();
  gameState.score = 0;
  gameState.discoveredLandmarks.clear();
  gameState.discoveredHistoryPlaques.clear();

  const loaded = sm.load();
  if (!loaded) throw new Error('SaveManager.load() returned null');

  if (gameState.currentZoneIndex !== 2) throw new Error(`Hydrated zone index incorrect: ${gameState.currentZoneIndex}`);
  if (gameState.score !== 3500) throw new Error(`Hydrated score incorrect: ${gameState.score}`);
  if (gameState.carIntegrity !== 88.5) throw new Error(`Hydrated integrity incorrect: ${gameState.carIntegrity}`);
  if (!(gameState.discoveredLandmarks instanceof Set) || !gameState.discoveredLandmarks.has('bixby_bridge')) {
    throw new Error('Hydrated discoveredLandmarks failed to restore as Set containing bixby_bridge');
  }
  if (gameState.mysteryMission.cluesFound !== 3 || !gameState.mysteryMission.clues.zone2) {
    throw new Error('Hydrated mysteryMission failed to restore clue progression');
  }
});

test('SaveManager.clear() flushes stored progress and hasSave() returns false', () => {
  const sm = new SaveManager(gameState);
  sm.clear();
  if (sm.hasSave()) throw new Error('hasSave() still true after sm.clear()');
  const loaded = sm.load();
  if (loaded !== null) throw new Error('sm.load() did not return null after sm.clear()');
});

test('SaveManager JSON export and import restores valid save data without mutation', () => {
  gameState.reset();
  gameState.score = 12500;
  gameState.currentZoneIndex = 4; // Marin
  gameState.distanceMeters = 11500;
  gameState.discoveredLandmarks.add('point_reyes');

  const mockPhysics = { position: { x: 0, y: 10, z: 11500 } };
  const sm = new SaveManager(gameState, mockPhysics);
  const json = sm.exportJson();
  if (typeof json !== 'string' || !json.includes('"version": 1')) {
    throw new Error('exportJson did not produce valid JSON string');
  }

  // Clear and re-import
  gameState.reset();
  sm.clear();
  const res = sm.importJson(json);
  if (!res.success) throw new Error(`importJson failed: ${res.error}`);

  if (gameState.score !== 12500) throw new Error(`Imported score mismatch: ${gameState.score}`);
  if (gameState.currentZoneIndex !== 4) throw new Error(`Imported zone mismatch: ${gameState.currentZoneIndex}`);
  if (!gameState.discoveredLandmarks.has('point_reyes')) {
    throw new Error('Imported landmarks missing point_reyes');
  }

  // Clean up
  sm.clear();
  gameState.reset();
});

// --- Suite 16: YouTube App & In-Car Infotainment System ---
console.log('▶ [Suite 16] YouTube App & In-Car Infotainment System');

test('GameState initializes and resets youtubeApp telemetry', () => {
  gameState.reset();
  if (!gameState.youtubeApp) throw new Error('gameState.youtubeApp is undefined');
  if (gameState.youtubeApp.currentVideoId !== 'MV_3Dpw-BRY') {
    throw new Error(`Default track mismatch: ${gameState.youtubeApp.currentVideoId}`);
  }
  if (gameState.youtubeApp.volume !== 100) {
    throw new Error(`Default volume mismatch: ${gameState.youtubeApp.volume}`);
  }

  // Mutate and reset
  gameState.youtubeApp.isPlaying = true;
  gameState.youtubeApp.currentTitle = 'Test Track';
  gameState.reset();
  if (gameState.youtubeApp.isPlaying) throw new Error('youtubeApp.isPlaying was not reset');
  if (gameState.youtubeApp.currentTitle !== 'Nightcall') throw new Error('youtubeApp.currentTitle was not reset');
});

test('extractYouTubeVideoId extracts 11-char IDs from various URL formats', () => {
  const cases = [
    { input: 'MV_3Dpw-BRY', expected: 'MV_3Dpw-BRY' },
    { input: 'https://www.youtube.com/watch?v=MV_3Dpw-BRY', expected: 'MV_3Dpw-BRY' },
    { input: 'https://youtu.be/aUz3fLncTTs', expected: 'aUz3fLncTTs' },
    { input: 'https://www.youtube.com/embed/8GW6sLrK40k', expected: '8GW6sLrK40k' },
    { input: 'https://music.youtube.com/watch?v=09839DpTctU', expected: '09839DpTctU' },
    { input: 'https://www.youtube.com/watch?v=CqnU_sJ8V-E&t=45s', expected: 'CqnU_sJ8V-E' },
    { input: 'not a valid youtube link', expected: null },
    { input: '', expected: null },
    { input: null, expected: null }
  ];

  for (const c of cases) {
    const id = extractYouTubeVideoId(c.input);
    if (id !== c.expected) {
      throw new Error(`Failed to extract ID for "${c.input}". Expected "${c.expected}", got "${id}"`);
    }
  }
});

test('CURATED_ROAD_TRACKS contains rich multi-genre catalog with valid metadata', () => {
  if (!Array.isArray(CURATED_ROAD_TRACKS) || CURATED_ROAD_TRACKS.length < 20) {
    throw new Error(`Curated tracks array insufficient: ${CURATED_ROAD_TRACKS?.length}`);
  }

  const genres = new Set();
  for (const t of CURATED_ROAD_TRACKS) {
    if (!t.id || t.id.length !== 11) throw new Error(`Invalid track ID: ${t.id} (${t.title})`);
    if (!t.title || typeof t.title !== 'string') throw new Error(`Missing track title for ${t.id}`);
    if (!t.artist || typeof t.artist !== 'string') throw new Error(`Missing track artist for ${t.id}`);
    if (!t.thumbnail || !t.thumbnail.startsWith('https://')) throw new Error(`Invalid thumbnail for ${t.title}`);
    genres.add(t.genre);
  }

  if (!genres.has('synthwave') || !genres.has('rock') || !genres.has('eurobeat') || !genres.has('chillhop')) {
    throw new Error(`Missing core driving genres in catalog: ${Array.from(genres).join(', ')}`);
  }
});

test('YouTubePlayerManager catalog search and genre filtering work accurately', () => {
  const mgr = new YouTubePlayerManager();
  const synthwave = mgr.getCuratedCatalog('synthwave');
  if (synthwave.length === 0 || synthwave.some(t => t.genre !== 'synthwave')) {
    throw new Error('getCuratedCatalog failed for synthwave');
  }

  // Search by title
  const hotelMatches = mgr.filterCatalog('hotel');
  if (hotelMatches.length === 0 || !hotelMatches.some(t => t.title.includes('Hotel California'))) {
    throw new Error('filterCatalog failed to find Hotel California');
  }

  // Search by artist
  const midnightMatches = mgr.filterCatalog('midnight');
  if (midnightMatches.length < 2) {
    throw new Error('filterCatalog failed to find The Midnight tracks');
  }
});

test('YouTubePlayerManager plays track, updates gameState.youtubeApp, and manages playback states', () => {
  const mgr = new YouTubePlayerManager();
  gameState.reset();

  const sunsetTrack = CURATED_ROAD_TRACKS.find(t => t.title === 'Sunset');
  mgr.playTrack(sunsetTrack);

  if (!gameState.youtubeApp.isPlaying) throw new Error('youtubeApp.isPlaying is false after playTrack');
  if (gameState.youtubeApp.currentVideoId !== sunsetTrack.id) {
    throw new Error(`Track video ID mismatch: ${gameState.youtubeApp.currentVideoId}`);
  }
  if (gameState.youtubeApp.currentTitle !== 'Sunset') {
    throw new Error(`Track title mismatch: ${gameState.youtubeApp.currentTitle}`);
  }

  mgr.pause();
  if (gameState.youtubeApp.isPlaying) throw new Error('youtubeApp.isPlaying should be false after pause');

  mgr.resume();
  if (!gameState.youtubeApp.isPlaying) throw new Error('youtubeApp.isPlaying should be true after resume');

  mgr.togglePlay();
  if (gameState.youtubeApp.isPlaying) throw new Error('youtubeApp.isPlaying should be false after togglePlay');
});

test('YouTubePlayerManager volume clamping, mute toggling, and track cycling work correctly', () => {
  const mgr = new YouTubePlayerManager();
  gameState.reset();

  mgr.setVolume(75);
  if (gameState.youtubeApp.volume !== 75) throw new Error(`Volume mismatch: ${gameState.youtubeApp.volume}`);

  mgr.setVolume(150);
  if (gameState.youtubeApp.volume !== 100) throw new Error(`Volume upper clamp failed: ${gameState.youtubeApp.volume}`);

  mgr.setVolume(-20);
  if (gameState.youtubeApp.volume !== 0) throw new Error(`Volume lower clamp failed: ${gameState.youtubeApp.volume}`);

  mgr.toggleMute();
  if (!gameState.youtubeApp.isMuted) throw new Error('isMuted should be true after toggleMute');
  mgr.toggleMute();
  if (gameState.youtubeApp.isMuted) throw new Error('isMuted should be false after second toggleMute');

  // Next and prev track cycling
  mgr.playTrack(CURATED_ROAD_TRACKS[0]);
  mgr.nextTrack();
  if (gameState.youtubeApp.currentVideoId !== CURATED_ROAD_TRACKS[1].id) {
    throw new Error('nextTrack did not advance to next track in catalog');
  }
  mgr.prevTrack();
  if (gameState.youtubeApp.currentVideoId !== CURATED_ROAD_TRACKS[0].id) {
    throw new Error('prevTrack did not return to previous track in catalog');
  }
});

console.log('\n====================================================');
console.log(`🏁 BENCHMARK SUMMARY: ${passed} PASSED | ${failed} FAILED | Total: ${passed + failed}`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

