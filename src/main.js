import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { batchStaticProps } from './engine/StaticMeshBatcher.js';
import { gameState } from './state.js';
import { ZONES } from './constants.js';
import { SceneRenderer } from './engine/Renderer.js';
import { InputManager } from './engine/Input.js';
import { SafariJeep } from './vehicles/SafariJeep.js';
import { SportsCar } from './vehicles/SportsCar.js';
import { VehiclePhysics } from './engine/Physics.js';
import { CameraManager } from './engine/CameraManager.js';
import { SplineRoad } from './world/SplineRoad.js';
import { TerrainChunkManager } from './world/TerrainChunk.js';
import { LandmarkLoader } from './world/LandmarkLoader.js';
import { DesertSceneryBuilder } from './world/DesertScenery.js';
import { MalibuSceneryBuilder } from './world/MalibuScenery.js';
import { BigSurSceneryBuilder } from './world/BigSurScenery.js';
import { MontereySceneryBuilder } from './world/MontereyScenery.js';
import { NorCalSceneryBuilder } from './world/NorCalScenery.js';
import { RedwoodSceneryBuilder } from './world/RedwoodScenery.js';
import { OregonSceneryBuilder } from './world/OregonScenery.js';
import { ColumbiaGorgeSceneryBuilder } from './world/ColumbiaGorgeScenery.js';
import { WashingtonSceneryBuilder } from './world/WashingtonScenery.js';
import { CascadeSceneryBuilder } from './world/CascadeScenery.js';
import { IdahoPanhandleSceneryBuilder } from './world/IdahoPanhandleScenery.js';
import { MontanaGlacierSceneryBuilder } from './world/MontanaGlacierScenery.js';
import { EnvironmentManager } from './world/Environment.js';
import { ZoneManager } from './world/ZoneManager.js';
import { WorldBoundaries } from './world/WorldBoundaries.js';
import { TrafficManager } from './world/TrafficManager.js';
import { VehicleDebrisManager } from './world/VehicleDebrisManager.js';
import { VehicleDamageVFX } from './world/VehicleDamageVFX.js';
import { DreamSmokeVFX } from './world/DreamSmokeVFX.js';
import { GPUVFXManager } from './world/GPUVFXSystem.js';
import { DynamicSkidmarks } from './world/DynamicSkidmarks.js';
import { SoundEngine } from './audio/SoundEngine.js';
import { TowTruckManager } from './engine/TowTruckManager.js';
import { MechanicSceneManager } from './engine/MechanicSceneManager.js';
import { ObstacleSystem } from './engine/ObstacleSystem.js';
import { MysteryCrimeScene } from './world/MysteryCrimeScene.js';
import { SaveManager } from './engine/SaveManager.js';
import { HUD } from './ui/HUD.js';
import { StartupReveal } from './ui/StartupReveal.js';

const startupReveal = new StartupReveal();

console.log('🏎️ Starting Dreamstate Highway 3D (Google3D)...');

// 1. Initialize 3D Engine & WebGL2 Cel-Shaded Renderer
const canvasContainer = document.getElementById('canvas-container') || document.body;
const renderer = new SceneRenderer(canvasContainer);

// 2. Build 3D Road & Continuous Biome Terrain
const splineRoad = new SplineRoad(renderer);
renderer.scene.add(splineRoad.group);

const terrain = new TerrainChunkManager(renderer, splineRoad);
renderer.scene.add(terrain.group);

// 2b. Visual Guardrails, Finish Line Arch & Perimeter Fences
const worldBoundaries = new WorldBoundaries(renderer, splineRoad);
renderer.scene.add(worldBoundaries.group);

// 3. Build All 10 Authentic Regional Zone Sceneries with Dynamic Distance Culling
const zoneBuilders = [
  { builder: new DesertSceneryBuilder(renderer, splineRoad), zMin: 0, zMax: 2600 },
  { builder: new MalibuSceneryBuilder(renderer, splineRoad), zMin: 2600, zMax: 5200 },
  { builder: new BigSurSceneryBuilder(renderer, splineRoad), zMin: 5200, zMax: 7800 },
  { builder: new MontereySceneryBuilder(renderer, splineRoad), zMin: 7800, zMax: 10400 },
  { builder: new NorCalSceneryBuilder(renderer, splineRoad), zMin: 10400, zMax: 13000 },
  { builder: new RedwoodSceneryBuilder(renderer, splineRoad), zMin: 13000, zMax: 15600 },
  { builder: new OregonSceneryBuilder(renderer, splineRoad), zMin: 15600, zMax: 18200 },
  { builder: new ColumbiaGorgeSceneryBuilder(renderer, splineRoad), zMin: 18200, zMax: 20800 },
  { builder: new WashingtonSceneryBuilder(renderer, splineRoad), zMin: 20800, zMax: 23400 },
  { builder: new CascadeSceneryBuilder(renderer, splineRoad), zMin: 23400, zMax: 26000 },
  { builder: new IdahoPanhandleSceneryBuilder(renderer, splineRoad), zMin: 26000, zMax: 28600 },
  { builder: new MontanaGlacierSceneryBuilder(renderer, splineRoad), zMin: 28600, zMax: 31200 }
];

// Performance Optimization: Batch static meshes sharing identical materials inside spatial chunks
// Collapses thousands of separate draw calls down to ~1-3 draw calls per material bucket
function batchChunkStaticMeshes(chunkGroup, dynamicSet = new Set()) {
  if (!chunkGroup || !chunkGroup.children || chunkGroup.children.length <= 1) return;

  const buckets = new Map();
  const preservedChildren = [];

  const topChildren = [...chunkGroup.children];
  topChildren.forEach(child => {
    // 0. Skip or preserve invisible objects
    if (child.visible === false) {
      preservedChildren.push(child);
      return;
    }

    // 1. Preserve instanced meshes
    if (child.isInstancedMesh || (child.name && child.name.startsWith('Instanced_'))) {
      preservedChildren.push(child);
      return;
    }

    // 2. Preserve active interactive landmarks, triggers, and canvas signs
    if (
      child.name && (
        child.name.startsWith('RoadSign_') ||
        child.name.startsWith('Historical_') ||
        child.name.startsWith('POI_') ||
        child.name.startsWith('Scenic_') ||
        child.name.startsWith('ScenicLot_') ||
        child.name.startsWith('ScenicAdvSign_') ||
        child.name.startsWith('ScenicEntranceSign_') ||
        child.name.includes('Telescope') ||
        child.name.includes('Viewfinder') ||
        child.name.includes('Trail') ||
        child.name.includes('Coyote') ||
        child.name.includes('Cougar') ||
        child.name.includes('Downhill') ||
        child.name.includes('Supersonic') ||
        child.name.includes('Jet')
      )
    ) {
      preservedChildren.push(child);
      return;
    }

    // 3. Preserve dynamic objects
    let hasDynamic = false;
    child.traverse(n => {
      if (dynamicSet.has(n)) hasDynamic = true;
    });
    if (hasDynamic) {
      preservedChildren.push(child);
      return;
    }

    // 4. Preserve multi-material meshes or groups containing multi-material meshes
    let hasMultiMat = false;
    child.traverse(n => {
      if (n.isMesh && Array.isArray(n.material)) hasMultiMat = true;
    });
    if (hasMultiMat) {
      preservedChildren.push(child);
      return;
    }

    // 5. Traverse static children to batch meshes sharing identical single materials
    child.traverse(mesh => {
      if (mesh.visible === false) return;
      if (mesh.isMesh && mesh.geometry && mesh.material && !Array.isArray(mesh.material)) {
        mesh.updateWorldMatrix(true, false);
        const g = mesh.geometry.clone();
        g.applyMatrix4(mesh.matrixWorld);

        let list = buckets.get(mesh.material);
        if (!list) {
          list = [];
          buckets.set(mesh.material, list);
        }
        list.push(g);
      }
    });
  });

  while (chunkGroup.children.length > 0) {
    chunkGroup.remove(chunkGroup.children[0]);
  }

  preservedChildren.forEach(c => chunkGroup.add(c));

  for (const [material, geoms] of buckets.entries()) {
    if (geoms.length === 1) {
      chunkGroup.add(new THREE.Mesh(geoms[0], material));
    } else {
      try {
        const hasIndexed = geoms.some(g => !!g.index);
        const hasNonIndexed = geoms.some(g => !g.index);
        let normalizedGeoms = (hasIndexed && hasNonIndexed)
          ? geoms.map(g => (g.index ? g.toNonIndexed() : g))
          : geoms;

        // Ensure all geometries share identical attributes (e.g. UVs)
        const hasUv = normalizedGeoms.some(g => !!g.attributes.uv);
        const missingUv = normalizedGeoms.some(g => !g.attributes.uv);
        if (hasUv && missingUv) {
          normalizedGeoms = normalizedGeoms.map(g => {
            if (!g.attributes.uv) {
              const clone = g.clone();
              const count = clone.attributes.position.count;
              clone.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
              return clone;
            }
            return g;
          });
        }

        const mergedGeo = mergeGeometries(normalizedGeoms, false);
        if (mergedGeo) {
          const batchMesh = new THREE.Mesh(mergedGeo, material);
          batchMesh.castShadow = false; // Static scenery chunks do not need shadow casting; saves thousands of shadow map draw calls
          batchMesh.receiveShadow = true;
          chunkGroup.add(batchMesh);
        } else {
          geoms.forEach(g => chunkGroup.add(new THREE.Mesh(g, material)));
        }
      } catch (e) {
        geoms.forEach(g => chunkGroup.add(new THREE.Mesh(g, material)));
      }
    }
  }
}

// Performance Optimization: Partition zone scenery objects into 500m spatial chunks
function partitionZoneScenery(builder, zMin, zMax) {
  if (!builder || !builder.group) return;
  const CHUNK_SIZE = 500;
  const numChunks = Math.ceil((zMax - zMin) / CHUNK_SIZE) + 1;
  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    const cg = new THREE.Group();
    cg.name = `ZoneChunk_${zMin + i * CHUNK_SIZE}`;
    chunks.push(cg);
  }

  const dynamicSet = new Set();
  if (builder.animatedObjects) {
    builder.animatedObjects.forEach(item => { if (item.obj) item.obj.traverse(c => dynamicSet.add(c)); });
  }
  if (builder.tumbleweeds) {
    builder.tumbleweeds.forEach(tw => { if (tw.mesh) tw.mesh.traverse(c => dynamicSet.add(c)); });
  }
  if (builder.waveMeshes) {
    builder.waveMeshes.forEach(w => { if (w.mesh) w.mesh.traverse(c => dynamicSet.add(c)); });
  }
  if (builder.jetGroup) {
    builder.jetGroup.traverse(c => dynamicSet.add(c));
  }
  if (builder.circlingVultures) {
    builder.circlingVultures.forEach(v => { if (v.group) v.group.traverse(c => dynamicSet.add(c)); });
  }
  if (builder.dustDevils) {
    builder.dustDevils.forEach(dd => { if (dd.group) dd.group.traverse(c => dynamicSet.add(c)); });
  }
  if (builder.anemometerRotor) {
    builder.anemometerRotor.traverse(c => dynamicSet.add(c));
  }
  if (builder.pelicanFlock) {
    builder.pelicanFlock.traverse(c => dynamicSet.add(c));
  }

  const preservedZoneGlobals = [];
  const candidateChildren = [];

  [...builder.group.children].forEach(child => {
    if (child.name && child.name.startsWith('ZoneChunk_')) return;

    // 1. Universal Spatial Partitioning: Slice InstancedMesh instances (foliage, boulders, trees)
    // across 500m chunks so distant instances are fully culled with their spatial chunk
    if (child.isInstancedMesh && child.count > 0) {
      const m = new THREE.Matrix4();
      const chunkMatrices = Array.from({ length: numChunks }, () => []);
      for (let i = 0; i < child.count; i++) {
        child.getMatrixAt(i, m);
        const instZ = m.elements[14];
        const chunkIdx = Math.max(0, Math.min(numChunks - 1, Math.floor((instZ - zMin) / CHUNK_SIZE)));
        chunkMatrices[chunkIdx].push(m.clone());
      }
      for (let c = 0; c < numChunks; c++) {
        if (chunkMatrices[c].length > 0) {
          const chunkInst = new THREE.InstancedMesh(child.geometry, child.material, chunkMatrices[c].length);
          chunkInst.name = `${child.name || 'Instanced'}_Chunk_${c}`;
          chunkInst.castShadow = child.castShadow;
          chunkInst.receiveShadow = child.receiveShadow;
          chunkInst.matrixAutoUpdate = false;
          for (let i = 0; i < chunkMatrices[c].length; i++) {
            chunkInst.setMatrixAt(i, chunkMatrices[c][i]);
          }
          chunkInst.instanceMatrix.needsUpdate = true;
          chunkInst.computeBoundingSphere();
          chunks[c].add(chunkInst);
        }
      }
      child.removeFromParent();
      return;
    }

    if (
      child.isInstancedMesh ||
      (child.name && child.name.startsWith('Instanced_')) ||
      (child.name && (
        child.name.includes('Trail') ||
        child.name.includes('Coyote') ||
        child.name.includes('Cougar') ||
        child.name.includes('Downhill') ||
        child.name.includes('Supersonic') ||
        child.name.includes('Jet') ||
        child.name === 'EdwardsAFB_SupersonicJet'
      )) ||
      child === builder.jetGroup
    ) {
      preservedZoneGlobals.push(child);
      return;
    }
    candidateChildren.push(child);
  });

  candidateChildren.forEach(child => {
    let z = (child.position && typeof child.position.z === 'number' && !isNaN(child.position.z) && Math.abs(child.position.z) > 0.1)
      ? child.position.z
      : zMin;

    // Content-aware chunking: if object is at root (0, 0, 0), find its true Z center from content
    if (z === 0 || z === zMin) {
      if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
        const pos = child.geometry.attributes.position;
        if (pos.count > 0) {
          let sumZ = 0, sampleCount = 0;
          const step = Math.max(1, Math.floor(pos.count / 10));
          for (let i = 0; i < pos.count; i += step) {
            sumZ += pos.getZ(i);
            sampleCount++;
          }
          if (sampleCount > 0) z = sumZ / sampleCount;
        }
      } else if (child.children && child.children.length > 0) {
        let sumZ = 0, count = 0;
        child.traverse(c => {
          if (c !== child) {
            if (c.position && typeof c.position.z === 'number' && Math.abs(c.position.z) > 0.1) {
              sumZ += c.position.z;
              count++;
            } else if (c.geometry && c.geometry.attributes && c.geometry.attributes.position) {
              const pos = c.geometry.attributes.position;
              if (pos.count > 0) {
                const step = Math.max(1, Math.floor(pos.count / 8));
                for (let k = 0; k < pos.count; k += step) {
                  sumZ += pos.getZ(k);
                  count++;
                }
              }
            }
          }
        });
        if (count > 0) z = sumZ / count;
      }
    }

    const chunkIdx = Math.max(0, Math.min(numChunks - 1, Math.floor((z - zMin) / CHUNK_SIZE)));
    chunks[chunkIdx].add(child);
  });

  chunks.forEach(cg => {
    batchChunkStaticMeshes(cg, dynamicSet);
    // Universal Landmark Batching: Batch static sub-meshes of preserved Scenic_ and RoadSign_ landmarks
    [...cg.children].forEach(child => {
      if (
        child.name &&
        (child.name.startsWith('Scenic_') || child.name.startsWith('RoadSign_')) &&
        !child.isInstancedMesh
      ) {
        batchStaticProps(child, { exclude: dynamicSet });
      }
    });
    builder.group.add(cg);
  });
  preservedZoneGlobals.forEach(inst => builder.group.add(inst));
  builder._sceneryChunks = chunks;
  builder._chunkZMin = zMin;
  builder._chunkSize = CHUNK_SIZE;

  // Initialize: keep initial zone chunks active so starting zone is fully loaded
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].visible = (zMin === 0) || (i <= 6);
  }
}

// Performance Optimization: Freeze transformation matrices on all static world geometry
// and disable shadow casting on background props to eliminate 30,000 shadow map draw calls
function freezeStaticHierarchy(rootObject) {
  if (!rootObject) return;
  rootObject.traverse((child) => {
    if (child.isMesh || child.isLine || child.isPoints || child.isSprite) {
      child.matrixAutoUpdate = false;
      child.updateMatrix();
      if (child.isMesh) {
        child.castShadow = false;
      }
    }
  });
}

zoneBuilders.forEach(zb => {
  partitionZoneScenery(zb.builder, zb.zMin, zb.zMax);
  renderer.scene.add(zb.builder.group);
  freezeStaticHierarchy(zb.builder.group);

  // Preserve live matrix updates on dynamic animated scenery objects
  if (zb.builder.animatedObjects) {
    zb.builder.animatedObjects.forEach(item => {
      if (item.obj) {
        item.obj.matrixAutoUpdate = true;
        item.obj.traverse(c => { c.matrixAutoUpdate = true; });
      }
    });
  }
  if (zb.builder.tumbleweeds) {
    zb.builder.tumbleweeds.forEach(tw => {
      if (tw.mesh) {
        tw.mesh.matrixAutoUpdate = true;
        tw.mesh.traverse(c => { c.matrixAutoUpdate = true; });
      }
    });
  }
  if (zb.builder.waveMeshes) {
    zb.builder.waveMeshes.forEach(w => {
      if (w.mesh) {
        w.mesh.matrixAutoUpdate = true;
        w.mesh.traverse(c => { c.matrixAutoUpdate = true; });
      }
    });
  }

  // Restore matrixAutoUpdate on all Desert Zone 0 per-frame animated objects
  // that are NOT in animatedObjects[] — vultures, dust devil groups, jet, anemometer
  if (zb.builder.circlingVultures) {
    zb.builder.circlingVultures.forEach(v => {
      if (v.group) {
        v.group.matrixAutoUpdate = true;
        v.group.traverse(c => { c.matrixAutoUpdate = true; });
      }
    });
  }
  if (zb.builder.dustDevils) {
    zb.builder.dustDevils.forEach(dd => {
      if (dd.group) {
        dd.group.matrixAutoUpdate = true;
        dd.group.traverse(c => { c.matrixAutoUpdate = true; });
      }
    });
  }
  if (zb.builder.anemometerRotor) {
    zb.builder.anemometerRotor.matrixAutoUpdate = true;
    zb.builder.anemometerRotor.traverse(c => { c.matrixAutoUpdate = true; });
  }

  // Restore matrixAutoUpdate on Malibu pelicans and animated palm crowns
  if (zb.builder.pelicanFlock) {
    zb.builder.pelicanFlock.matrixAutoUpdate = true;
    zb.builder.pelicanFlock.traverse(c => { c.matrixAutoUpdate = true; });
  }
  if (zb.builder.palmCrowns) {
    zb.builder.palmCrowns.forEach(c => {
      if (c.mesh) c.mesh.matrixAutoUpdate = true;
    });
  }

  // Restore matrixAutoUpdate on Washington Aurora Borealis ribbons
  if (zb.builder.auroraRibbons) {
    zb.builder.auroraRibbons.forEach(r => {
      if (r.mesh) r.mesh.matrixAutoUpdate = true;
    });
  }
});

// Batch SplineRoad static chunks (road studs, center lines, delineator posts)
if (splineRoad.roadChunks) {
  const roadDynamic = new Set();
  if (splineRoad.animatedPlaqueBeacons) {
    splineRoad.animatedPlaqueBeacons.forEach(b => {
      if (b.beaconGroup) b.beaconGroup.traverse(c => roadDynamic.add(c));
    });
  }
  splineRoad.roadChunks.forEach(chunk => batchChunkStaticMeshes(chunk, roadDynamic));
}
// The outer chunk batcher deliberately preserves interactive scenic lots.
// Batch only their static interiors; keep every animated/interactive registry node.
const propBatchStats = [];
const scenicDynamic = new Set();
for (const plaque of splineRoad.animatedPlaqueBeacons || []) {
  for (const key of ['beaconGroup', 'skyBeam', 'skyBeamCore', 'starMarker']) {
    if (plaque[key]) scenicDynamic.add(plaque[key]);
  }
}
const scenicLots = [];
splineRoad.group.traverse(node => {
  if (node.name.startsWith('ScenicLot_')) scenicLots.push(node);
});
for (const lot of scenicLots) {
  propBatchStats.push({ name: lot.name, ...batchStaticProps(lot, { exclude: scenicDynamic }) });
}
freezeStaticHierarchy(splineRoad.group);
if (splineRoad.animatedPlaqueBeacons) {
  splineRoad.animatedPlaqueBeacons.forEach(b => {
    for (const node of [b.beaconGroup, b.skyBeam, b.starMarker]) {
      if (node) node.traverse(c => { c.matrixAutoUpdate = true; });
    }
  });
}

// Batch WorldBoundaries static chunks (guardrails, posts, reflectors)
if (worldBoundaries.boundaryChunks) {
  worldBoundaries.boundaryChunks.forEach(chunk => batchChunkStaticMeshes(chunk));
}
freezeStaticHierarchy(worldBoundaries.group);

// 4. Landmark Proximity Discovery System
const landmarks = new LandmarkLoader(renderer, splineRoad);
renderer.scene.add(landmarks.group);
freezeStaticHierarchy(landmarks.group);

// 5. Build Player Vehicle (Old Safari Overland Expedition Jeep 4x4)
const sportsCar = new SafariJeep(renderer);
renderer.scene.add(sportsCar.group);

const environment = new EnvironmentManager(renderer, sportsCar);
renderer.scene.add(environment.group);

const zoneManager = new ZoneManager(renderer, terrain, environment);

// 7. Solid Obstacle Collision Engine, Physics Controller & Input Management
const obstacleSystem = new ObstacleSystem(splineRoad);
const physics = new VehiclePhysics(sportsCar);
physics.setWorldReferences(splineRoad, terrain, obstacleSystem, [splineRoad.roadMesh, terrain.terrainMesh]);

// 7b. Highway Traffic & Police Radar Speed Trap Manager
const traffic = new TrafficManager(renderer, splineRoad, physics);
renderer.scene.add(traffic.group);
for (const shop of traffic.serviceBayMeshes) {
  propBatchStats.push({ name: shop.bay.name,
    ...batchStaticProps(shop.group, { exclude: new Set([shop.wrench]) }) });
}

// 7c. Physical 3D Tumbling Vehicle Debris Manager
const debrisManager = new VehicleDebrisManager(renderer.scene, splineRoad, renderer);

// 7d. Progressive Vehicle Smoke & Fire VFX
const damageVFX = new VehicleDamageVFX(renderer.scene);

// 7d-2. High-Density GPU Instanced VFX Engine (Nitro plumes, Roostertail, Sparks)
const gpuVFX = new GPUVFXManager(renderer.scene);
physics.setGPUVFX(gpuVFX);

// 7d-3. High-Performance Instanced Dynamic Asphalt Skidmarks
const dynamicSkidmarks = new DynamicSkidmarks(renderer.scene, splineRoad);

// 7d-4. Ethereal Dream Clouds & Rolling Morning Smoke Engine
const dreamSmokeVFX = new DreamSmokeVFX(renderer, sportsCar);
renderer.scene.add(dreamSmokeVFX.group);

const input = new InputManager();
input.physics = physics;
const cameraManager = new CameraManager(renderer.camera, sportsCar);
cameraManager.setPhysics(physics);
input.cameraManager = cameraManager;
const sound = new SoundEngine();
environment.setSoundEngine(sound);
const hud = new HUD();
hud.setSoundEngine(sound);
hud.setPhysics(physics);

// 7e. 3D Cinematic Tow Truck Dispatch & Highway Convoy Director
const towTruckManager = new TowTruckManager(renderer, splineRoad, physics, sportsCar, sound);
renderer.scene.add(towTruckManager.group);

// 7f. 3D Cinematic Auto Mechanic Pit Crew & Overhaul Director
const mechanicSceneManager = new MechanicSceneManager(renderer, splineRoad, physics, sportsCar, sound);
renderer.scene.add(mechanicSceneManager.group);

// 7g. 3D Mystery Crime Scene & Highway Investigation Director
const mysteryCrimeScene = new MysteryCrimeScene(renderer, splineRoad);
renderer.scene.add(mysteryCrimeScene.group);

// 7h. Database-Free Persistent Save Manager (Browser LocalStorage)
const saveManager = new SaveManager(gameState, physics);

// 7i. Comprehensive GPU Texture & WebGL Shader Pipeline Pre-Warming
// Eliminates JIT compilation and texture upload stalls during active driving
if (renderer.prewarmScene) {
  renderer.prewarmScene();
}
// 1-frame warm-up render under startup white overlay to allocate GPU framebuffers, textures & shadow maps
renderer.render(0.016);

// Connect camera, rain, and paint toggle buttons in HUD
if (hud.camBtn) {
  hud.camBtn.addEventListener('click', () => {
    input.cycleCamera();
    cameraManager.setMode(gameState.cameraMode);
  });
}
if (hud.rainBtn) {
  hud.rainBtn.addEventListener('click', () => {
    input.cycleRainMode();
  });
}
// Start / Awakening Gate setup (unmutes Web Audio and activates vehicle)
hud.setupStartGate(() => {
  if (sound.ctx && sound.ctx.state === 'suspended') {
    sound.ctx.resume().catch(e => console.warn('Audio resume error:', e));
  } else if (!sound.isInitialized) {
    sound.setupAudio();
  }
  _startupSmokeTimer = 2.5; // Start exhaust smoke timer right when vehicle awakens
  console.log('🌅 Audio Active & Engine Running');
});

input.onCameraCycle = (mode) => {
  cameraManager.setMode(mode);
};

input.onPhotoModeToggle = () => {
  gameState.isPhotoMode = !gameState.isPhotoMode;
  console.log('📸 Photo Mode:', gameState.isPhotoMode ? 'ACTIVE' : 'OFF');
};

input.onLiveryCycle = () => {
  const colorName = sportsCar.cyclePaintColor();
  console.log('🎨 Vehicle Livery Switched to:', colorName);
};

input.onReset = () => {
  physics.respawnOnRoad();
  _startupSmokeTimer = 2.5;
  console.log('🔄 Vehicle Placed Cleanly on Highway 1');
};

// Set initial grounded vehicle position inside the dream cloud bank (Z = -14m)
const startZ = -14.0;
const initialY = physics.getGroundHeightAt(0, startZ) + 0.18;
physics.position.set(0, initialY, startZ);
physics.heading = 0;
physics.speed = 0;
sportsCar.group.position.copy(physics.position);
sportsCar.group.rotation.set(0, 0, 0);

// Global expedition reset function (clears localStorage, resets state, restarts Mojave sunrise)
function resetExpedition() {
  saveManager.clear();
  gameState.reset();
  const resetZ = -14.0;
  physics.respawnOnRoad(false, resetZ);
  sportsCar.group.position.copy(physics.position);
  sportsCar.group.rotation.set(0, 0, 0);

  gameState.isIntroActive = true;
  gameState.introProgress = 0.0;
  gameState.introState = 'orbit';
  gameState.eyelidOpenProgress = 1.0;
  gameState.drowsyBlurPx = 0.0;

  if (sportsCar.paintPalette && sportsCar.paintPalette.length > 0) {
    sportsCar.currentPaletteIndex = 0;
    sportsCar.setPaintColor(sportsCar.paintPalette[0].color, sportsCar.paintPalette[0].name);
  }

  cameraManager.setMode('CHASE');
  cameraManager.startIntro();

  if (zoneManager) {
    zoneManager.update(physics.position);
  }

  if (hud) {
    hud.updateSaveGameView();
    hud.showActionToast('🔄 NEW EXPEDITION', 'PROGRESS RESET • STARTING FRESH AT ZONE 0', 3500);
  }
  _startupSmokeTimer = 2.5;
  console.log('🔄 Expedition Reset: Started Fresh from Mojave Desert');
}

// Check for existing player save state in browser localStorage
if (saveManager.hasSave()) {
  const saved = saveManager.load();
  if (saved) {
    // Restore vehicle paint/livery if saved
    if (typeof saved.paintIndex === 'number' && sportsCar.paintPalette) {
      const pIdx = Math.max(0, Math.min(sportsCar.paintPalette.length - 1, saved.paintIndex));
      sportsCar.currentPaletteIndex = pIdx;
      sportsCar.setPaintColor(sportsCar.paintPalette[pIdx].color, sportsCar.paintPalette[pIdx].name);
    }

    if (typeof saved.playerZ === 'number' && saved.playerZ > 20) {
      if (physics.restorePosition) {
        physics.restorePosition(saved.playerX, saved.playerZ, saved.playerHeading);
      } else {
        physics.respawnOnRoad(false, saved.playerZ);
      }
      sportsCar.group.position.copy(physics.position);
      sportsCar.group.rotation.order = 'YXZ';
      sportsCar.group.rotation.set(0, physics.heading, 0);

      gameState.isIntroActive = false;
      gameState.introProgress = 1.0;
      gameState.introState = 'driving';
      gameState.eyelidOpenProgress = 1.0;
      gameState.drowsyBlurPx = 0.0;

      // Restore vehicle drive mode / gear to physics engine appropriately for surface
      const rInfo = splineRoad ? splineRoad.getRoadInfo(saved.playerX, saved.playerZ) : null;
      const isTrulyOnHighway = Boolean(rInfo && rInfo.isOnRoad && !rInfo.isOnTrail && !rInfo.isOnDownhillRoute && (rInfo.distToCenter <= 17.5));
      const isOnTrail = Boolean(rInfo && rInfo.isOnTrail);
      const isOffRoad = !isTrulyOnHighway;

      let restoredDriveMode = saved.driveMode;
      if (isOffRoad || isOnTrail) {
        // When resuming on dirt/off-road or on a trail, never force HIGH highway overdrive where car stalls
        if (!restoredDriveMode || restoredDriveMode === 'HIGH') {
          const climbInfo = physics.getGearClimbInfo ? physics.getGearClimbInfo(rInfo) : null;
          restoredDriveMode = (climbInfo && climbInfo.isTechnical) ? 'LOW' : (isOnTrail ? 'MID' : 'LOW');
        }
      } else {
        if (!restoredDriveMode) {
          restoredDriveMode = 'HIGH';
        }
      }

      if (physics.setDriveMode) {
        physics.setDriveMode(restoredDriveMode);
      } else {
        gameState.driveMode = restoredDriveMode;
      }

      if (saved.cameraMode) {
        cameraManager.setMode(saved.cameraMode);
      }
      cameraManager.resetTracking();

      // Instantly synchronize zone atmosphere, sky gradient, and terrain palette
      if (zoneManager) {
        zoneManager.update(physics.position);
      }

      const zName = ZONES[gameState.currentZoneIndex]?.name || 'HIGHWAY 1';
      console.log(`💾 Progress Resumed from LocalStorage: ${zName} (Z=${Math.round(saved.playerZ)}m, Score=${saved.score}, Ver=${saved.version || 1})`);

      // Display interactive Resume Expedition prompt with option to Continue or Start Fresh
      if (hud && hud.showResumePrompt) {
        hud.showResumePrompt(saved, zName, () => {
          if (hud && hud.showActionToast) {
            hud.showActionToast('💾 EXPEDITION RESTORED', `RESUMED AT ${zName.toUpperCase()} (Z=${Math.round(saved.playerZ)}m)`, 3000);
          }
        }, () => {
          resetExpedition();
        });
      } else {
        setTimeout(() => {
          if (hud && hud.showActionToast) {
            hud.showActionToast('💾 EXPEDITION RESTORED', `RESUMED AT ${zName.toUpperCase()} (Z=${Math.round(saved.playerZ)}m)`, 3500);
          }
        }, 800);
      }
    } else {
      // Saved at start or low Z: maintain unlocked lore/score while starting intro smoothly
      if (saved.cameraMode) {
        cameraManager.setMode(saved.cameraMode);
      }
      cameraManager.startIntro();
    }
  } else {
    cameraManager.startIntro();
  }
} else {
  cameraManager.startIntro();
}

// 8. High-FPS Game Loop with Distance Frustum & Zone Culling
let lastTime = performance.now();
const CULL_MARGIN = 700; // Optimized zone culling to minimize GPU draw calls
const _exTip = new THREE.Vector3();
let _startupSmokeTimer = 0; // Activated upon awakening or reset
let _idlePuffTimer = 0;
let _wasThrottle = false;
let _throttleSmokeIntensity = 0;
let _throttlePuffTimer = 0;
let _backfirePuffCooldown = 0;
let _roostTimer = 0;

let _smoothedDt = 0.016; // Pacing accumulator for buttery smooth motion
let _autoSaveTimer = 0; // Periodic localStorage heartbeat timer

function animate(now) {
  requestAnimationFrame(animate);

  const rawDt = (now - lastTime) / 1000;
  lastTime = now;

  // Guard against background tab or pause spikes
  const clampedRawDt = Math.min(0.066, Math.max(0.001, rawDt));
  // Responsive frame-pacing filter: eliminates micro-jitter from browser GC while immediately tracking rate changes
  _smoothedDt = _smoothedDt * 0.70 + clampedRawDt * 0.30;
  const dt = _smoothedDt;

  gameState.gameTime += dt;
  gameState.timeOfDay = (gameState.timeOfDay + dt / 600) % 1.0;

  if (!gameState.isPaused) {
    // 1. Process Input
    input.update();

    // 2. Step Vehicle Physics
    physics.update(dt, input);

    // 3. Update Vehicle Animations (steering, wheel spin, body roll, active aero)
    sportsCar.update(physics, input, dt);

    // 4. Spatial Zone Culling & Active Scenery Updates
    const playerZ = physics.position.z;
    for (let i = 0; i < zoneBuilders.length; i++) {
      const zb = zoneBuilders[i];
      const isNear = (playerZ >= zb.zMin - CULL_MARGIN) && (playerZ <= zb.zMax + CULL_MARGIN);
      zb.builder.group.visible = isNear;
      if (isNear) {
        if (zb.builder._sceneryChunks) {
          const forwardChunks = (renderer && renderer.isMobile) ? 4 : 6;
          const curChunk = Math.floor((playerZ - zb.zMin) / zb.builder._chunkSize);
          const minChunk = Math.max(0, curChunk - 2);
          const maxChunk = Math.min(zb.builder._sceneryChunks.length - 1, curChunk + forwardChunks);
          for (let c = 0; c < zb.builder._sceneryChunks.length; c++) {
            zb.builder._sceneryChunks[c].visible = (c >= minChunk && c <= maxChunk);
          }
        }
        if (zb.builder.update) {
          zb.builder.update(dt, physics.position);
        }
      }
    }

    // 6. Update World Systems
    if (splineRoad.update) splineRoad.update(dt, physics.position);
    if (worldBoundaries.update) worldBoundaries.update(dt, physics.position);
    if (terrain.update) terrain.update(dt, physics.position);
    traffic.update(dt, physics.position, physics.speed);
    towTruckManager.update(dt);
    mechanicSceneManager.update(dt);
    debrisManager.update(dt);
    damageVFX.update(dt, sportsCar.group, physics.heading);
    gpuVFX.update(dt, renderer.camera);
    dynamicSkidmarks.update(dt, physics, input);
    dreamSmokeVFX.update(dt, gameState.gameTime, gameState.introSmokeOpacity !== undefined ? gameState.introSmokeOpacity : 1.0, renderer.camera, physics.position.z);

    // Photorealistic Exhaust Smoke VFX — Exclusively From The 3D Muffler Tip
    const p = sportsCar.group.position;
    const h = physics.heading;
    const cosH = Math.cos(h);
    const sinH = Math.sin(h);

    // Track authentic 3D muffler tailpipe world position from SafariJeep model
    if (sportsCar.getExhaustWorldPosition) {
      sportsCar.getExhaustWorldPosition(_exTip);
    } else {
      _exTip.set(
        p.x + cosH * 0.48 - sinH * 2.08,
        p.y + 0.27,
        p.z - sinH * 0.48 - cosH * 2.08
      );
    }

    const isThrottle = Boolean(input.throttle > 0.05 || input.keys['KeyW'] || input.keys['ArrowUp']);
    _backfirePuffCooldown = Math.max(0, _backfirePuffCooldown - dt);

    // Continuous startup timer countdown: exhaust smoke only for the first few seconds after start
    if (_startupSmokeTimer > 0) {
      _startupSmokeTimer = Math.max(0, _startupSmokeTimer - dt);
    }

    // 1. Throttle Press / Repress Detection
    if (isThrottle && !_wasThrottle) {
      // User just pushed the gas pedal: initiate fresh puffs of smoke immediately
      _throttleSmokeIntensity = 1.0;
      _throttlePuffTimer = 0.11; // Fire first puff immediately on pedal press
    }
    _wasThrottle = isThrottle;

    // 2. Throttle Smoke Dissipation: slowly fades off while holding gas down
    if (isThrottle) {
      if (_throttleSmokeIntensity > 0.05) {
        _throttlePuffTimer += dt;
        // Rhythm of exhaust puffs (~9 Hz: every 0.11s)
        if (_throttlePuffTimer >= 0.11) {
          _throttlePuffTimer = 0;
          gpuVFX.emitExhaustSmoke(_exTip, h, physics.speed, _throttleSmokeIntensity * 1.25, 1);
        }
        // Slowly dissipate smoke intensity over ~1.3 seconds of holding gas down until clear
        _throttleSmokeIntensity = Math.max(0, _throttleSmokeIntensity - dt * 0.75);
      } else {
        _throttleSmokeIntensity = 0;
      }
    } else {
      // Releasing gas pedal resets throttle puff state so repressing gas triggers fresh puffs
      _throttleSmokeIntensity = 0;
      _throttlePuffTimer = 0;

      // 3. Initial Startup Smoke: only for the first few seconds after start, then completely fades off
      if (_startupSmokeTimer > 0.4) {
        const fadeRatio = (_startupSmokeTimer - 0.4) / 1.8; // 1.0 -> 0.0
        _idlePuffTimer += dt;
        if (_idlePuffTimer >= 0.15) {
          _idlePuffTimer = 0;
          gpuVFX.emitExhaustSmoke(_exTip, h, 0, 0.16 * Math.min(1.0, fadeRatio), 1, { isIdle: true });
        }
      }
    }

    // 4. Backfire soot pop exclusively from muffler on unburnt fuel detonation
    if (sportsCar.backfireLight && sportsCar.backfireLight.intensity > 1.4 && _backfirePuffCooldown <= 0) {
      _backfirePuffCooldown = 0.35;
      gpuVFX.emitExhaustSmoke(_exTip, h, physics.speed, 1.6, 1, { isBackfire: true });
    }

    // Nitro plume exclusively from muffler when nitro is active
    if ((input.nitro || input.keys['ShiftLeft'] || input.keys['KeyN']) && gameState.nitro > 0 && physics.speed > 1.0) {
      gpuVFX.emitNitroPlume(_exTip, h, physics.speed, 2);
    }

    // 🪨 Off-Road Tire Roostertail Dust — Technical trail / loose dirt kicks a
    // roostertail behind the rear tires (brown-off-road dust path in GPUVFXSystem).
    // Stranded dormant before; now wired so the 4x4 trail finally "throws" dirt.
    const _roostRt = new THREE.Vector3();
    _roostRt.set(
      p.x + cosH * 0.35 - sinH * 1.45,
      p.y + 0.22,
      p.z - sinH * 0.35 - cosH * 1.45
    );
    const _isTrailDust = Boolean(gameState.isOnTrail || gameState.is2WDStruggling || (physics._trailPhaseGear && physics.driveMode !== physics._trailPhaseGear));
    const _dustStrength = Math.min(1.0, Math.max(0.05, Math.abs(physics.speed) * 0.22));
    if (_isTrailDust && isThrottle && _dustStrength > 0.06) {
      _roostTimer = (_roostTimer || 0) + dt;
      const _interval = (physics.driveMode === 'LOW') ? 0.055 : 0.045;
      if (_roostTimer >= _interval) {
        _roostTimer = 0;
        const count = (physics.driveMode === 'LOW') ? 1 : 2;
        gpuVFX.emitTireSmoke(_roostRt, physics.speed, h, true, false, count);
      }
    }

    zoneManager.update(physics.position);
    landmarks.update(dt, physics.position);
    environment.update(dt, physics.position);
    mysteryCrimeScene.update(dt);

    // 7. Update Audio Synthesis (Porsche Flat-6, BOV, Desert Breeze, Birdsong)
    try {
      sound.update();
    } catch (err) {
      console.warn('Audio update error:', err);
    }

    // 7h. Periodic background auto-save heartbeat (every 20 seconds during active driving)
    _autoSaveTimer += dt;
    if (_autoSaveTimer >= 20.0) {
      _autoSaveTimer = 0;
      saveManager.save();
    }
  }

  // 8. Update Dynamic Camera & Render Frame
  cameraManager.update(dt);
  renderer.render(dt);

  // 9. Update UI HUD with exact frame delta time and WebGL GPU telemetry for accurate FPS monitor
  const renderMetrics = renderer.getRenderMetrics ? renderer.getRenderMetrics() : null;
  hud.update(physics, splineRoad, dt, rawDt, renderMetrics);
  startupReveal.update(clampedRawDt);
}

window.THREE = THREE;
window.game = {
  propBatchStats,
  renderer,
  cameraManager,
  saveManager,
  physics,
  sportsCar,
  vehicle: sportsCar,
  dynamicSkidmarks,
  dreamSmokeVFX,
  traffic,
  towTruckManager,
  mechanicSceneManager,
  mysteryCrimeScene,
  obstacleSystem,
  debrisManager,
  damageVFX,
  gpuVFX,
  gameState,
  terrain,
  splineRoad,
  zoneManager,
  zones: ZONES,
  ZONES,
  resetExpedition,
  sound,
  worldBoundaries,
  hud,
  input,
  environment,
  zoneBuilders,
  activeZoneCutscene: null,
  setTargetFps: (fps) => {
    gameState.targetFps = fps === 'uncapped' ? 'uncapped' : parseInt(fps, 10);
    gameState.fpsMode = String(fps);
    if (renderer && renderer.onTargetFpsChanged) renderer.onTargetFpsChanged(gameState.targetFps);
    if (hud && hud.updateFpsTargetButtons) hud.updateFpsTargetButtons(fps);
    if (hud && hud.updateTargetText) hud.updateTargetText();
    return { targetFps: gameState.targetFps };
  },
  getSmokeDebug: () => ({ startupSmokeTimer: _startupSmokeTimer, throttleSmokeIntensity: _throttleSmokeIntensity, activeExhaust: gpuVFX.activeExhaust.size, gameTime: gameState.gameTime })
};

// Standard Three.js Agent Diagnostics Object
window.__THREE_GAME_DIAGNOSTICS__ = {
  renderer: {
    get calls() { return renderer.renderer.info.render.calls; },
    get triangles() { return renderer.renderer.info.render.triangles; },
    get geometries() { return renderer.renderer.info.memory.geometries; },
    get textures() { return renderer.renderer.info.memory.textures; },
    get info() { return renderer.renderer.info; }
  },
  get state() {
    return {
      speedMph: gameState.speedMph,
      playerZ: gameState.playerZ,
      currentZone: gameState.currentZoneIndex,
      isPaused: gameState.isPaused,
      driveMode: gameState.driveMode,
      introState: gameState.introState,
      rainIntensity: gameState.rainIntensity,
    };
  },
  physics: {
    engine: 'rapier3d',
    timestep: 1 / 60,
    get bodies() { return physics.rigidBodies ? physics.rigidBodies.length : 0; },
    get colliders() { return physics.colliders ? physics.colliders.length : 0; },
  },
  get activeZones() {
    return (zoneManager && zoneManager.zones) || ZONES;
  },
  get renderMetrics() {
    return renderer.getRenderMetrics ? renderer.getRenderMetrics() : null;
  },
  getScene: () => renderer.scene,
  getRenderer: () => renderer
};

// Standard Three.js Agent Test Hooks for headless/browser inspection and dynamic profiling
window.__THREE_GAME_TEST_HOOKS__ = {
  setState: (name) => {
    if (name === 'active-play') {
      gameState.introState = 'driving';
      gameState.isCutsceneActive = false;
      gameState.isPaused = false;
      return { state: name };
    }
    if (name === 'rain') {
      gameState.rainIntensity = 1.0;
      return { state: name };
    }
    if (name === 'clear') {
      gameState.rainIntensity = 0.0;
      return { state: name };
    }
    if (name === 'garage-service') {
      if (physics && physics.teleportToZ) {
        physics.teleportToZ(1950);
      }
      return { state: name };
    }
    if (name === 'offroad-trail') {
      if (physics && physics.teleportToZ) {
        physics.teleportToZ(650);
      }
      return { state: name };
    }
    if (typeof name === 'string' && name.startsWith('zone-')) {
      const idx = parseInt(name.replace('zone-', ''), 10);
      if (zoneManager && zoneManager.zones && zoneManager.zones[idx]) {
        const targetZ = zoneManager.zones[idx].zMin !== undefined ? zoneManager.zones[idx].zMin + 120 : idx * 2600 + 120;
        if (physics && physics.teleportToZ) physics.teleportToZ(targetZ);
        return { state: name, zone: zoneManager.zones[idx].name };
      }
    }
    // Fallback acknowledgment for custom state requests
    return { state: name };
  },
  setPausedForScreenshot: (paused) => {
    gameState.isPaused = !!paused;
    return { paused: gameState.isPaused };
  },
  seed: (n) => {
    return { seed: n };
  },
  setReducedMotion: (reduced) => {
    return { reducedMotion: !!reduced };
  },
  hideDebugUi: (hidden) => {
    return { hideDebugUi: !!hidden };
  },
  teleportToZone: (zoneIndex) => {
    if (zoneManager && zoneManager.zones && zoneManager.zones[zoneIndex]) {
      const targetZ = zoneManager.zones[zoneIndex].zMin !== undefined ? zoneManager.zones[zoneIndex].zMin + 120 : zoneIndex * 2600 + 120;
      if (physics && physics.teleportToZ) physics.teleportToZ(targetZ);
      return { zoneIndex, zoneName: zoneManager.zones[zoneIndex].name, z: targetZ };
    }
    throw new Error(`Invalid zone index: ${zoneIndex}`);
  },
  teleportToZ: (targetZ) => {
    if (physics && physics.teleportToZ) {
      physics.teleportToZ(targetZ);
      return { targetZ, actualZ: physics.position.z };
    }
    return null;
  },
  teleportToMountainSummit: () => {
    if (hud && hud.warpToMountainSummit) {
      hud.warpToMountainSummit();
      return { success: true, location: 'Cougar Ridge Summit Overlook', x: 259.02, y: 58.92, z: 1126.81 };
    }
    if (physics && physics.teleportToCoords) {
      physics.teleportToCoords(259.02, 58.92, 1126.81, -Math.PI * 0.55);
      return { success: true, location: 'Cougar Ridge Summit Overlook', x: 259.02, y: 58.92, z: 1126.81 };
    }
    return null;
  },
  setTargetFps: (fps) => {
    gameState.targetFps = fps === 'uncapped' ? 'uncapped' : parseInt(fps, 10);
    gameState.fpsMode = String(fps);
    if (renderer && renderer.onTargetFpsChanged) renderer.onTargetFpsChanged(gameState.targetFps);
    if (hud && hud.updateFpsTargetButtons) hud.updateFpsTargetButtons(fps);
    if (hud && hud.updateTargetText) hud.updateTargetText();
    return { targetFps: gameState.targetFps };
  },
  save: (force = true) => saveManager.save(force),
  load: () => saveManager.load(),
  clearSave: () => saveManager.clear(),
  hasSave: () => saveManager.hasSave(),
  exportSave: () => saveManager.exportJson(),
  importSave: (json) => saveManager.importJson(json),
  getSaveData: () => saveManager.serialize()
};

requestAnimationFrame(animate);
