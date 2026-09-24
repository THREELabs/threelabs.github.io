import * as THREE from 'three';
import { SCENIC_PARKING_LOTS, AUTO_REPAIR_SHOPS } from './SplineRoad.js';
import { ROAD } from '../constants.js';
import { OceanWaterManager } from './OceanWaterSystem.js';
import { calculateTerrainHeight } from './TerrainHeight.js';
import { TrailSpline } from './TrailSpline.js';
import { DownhillSpline } from './DownhillSpline.js';

export { calculateTerrainHeight };

export class TerrainChunkManager {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();

    // Biome-specific PBR Terrain Materials with Normal & Micro-Relief Mapping
    const setupTerrainMat = (biomeKey, repX = 24, repY = 40) => {
      const diff = this.renderer.textures.terrainPBR ? this.renderer.textures.terrainPBR(biomeKey, 512) : null;
      if (diff) {
        diff.repeat.set(repX, repY);
        diff.wrapS = diff.wrapT = THREE.RepeatWrapping;
      }
      const norm = this.renderer.textures.terrainNormalPBR ? this.renderer.textures.terrainNormalPBR(biomeKey, 512) : null;
      if (norm) {
        norm.repeat.set(repX, repY);
        norm.wrapS = norm.wrapT = THREE.RepeatWrapping;
      }
      return new THREE.MeshStandardMaterial({
        vertexColors: true,
        map: diff,
        normalMap: norm,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: biomeKey === 'desert_sand' ? 0.90 : (biomeKey === 'forest_moss' ? 0.92 : 0.85),
        metalness: 0.02
      });
    };

    this.matTerrainDesert = setupTerrainMat('desert_sand', 28, 48);
    this.matTerrainCoastal = setupTerrainMat('soil_dirt', 24, 44);
    this.matTerrainForest = setupTerrainMat('forest_moss', 26, 46);
    this.matTerrainSoil = setupTerrainMat('soil_dirt', 25, 45);
    this.matTerrainMountain = setupTerrainMat('mountain_rock', 24, 44);
    this.matTerrain = this.matTerrainDesert; // Retain backward compatibility

    this.chunks = [];
    this.buildTerrain();

    // High-Fidelity Pacific Ocean Optics System (Gerstner waves, Fresnel, sun glints, foam)
    this.oceanSystem = new OceanWaterManager(this.renderer, this.group);
  }

  getGroundElevation(x, z) {
    const roadInfo = this.splineRoad ? this.splineRoad.getRoadInfo(x, z) : null;
    return calculateTerrainHeight(x, z, roadInfo);
  }

  buildTerrain() {
    const width = 600;
    const totalLength = Math.max(31200, (this.splineRoad && this.splineRoad.totalLength) ? this.splineRoad.totalLength : 31200);
    const CHUNK_SIZE = 1000;
    const numChunks = Math.ceil(totalLength / CHUNK_SIZE);
    const segsW = 60;
    const segsL = 50;

    const cDesertSand = new THREE.Color(0xd8aa68);
    const cDesertDune = new THREE.Color(0xebd098);
    const cDesertClay = new THREE.Color(0xc66c42);
    const cDesertRock = new THREE.Color(0xae4e2c);
    const cMalibuBeach = new THREE.Color(0xe5ce9f);
    const cMalibuWetSand = new THREE.Color(0xcfb37e);
    const cMalibuChaparral = new THREE.Color(0x6e8252);
    const cMalibuMountain = new THREE.Color(0x566a42);
    const cMalibuRock = new THREE.Color(0x94836f);

    const cBigSurGreen = new THREE.Color(0x628c5a);
    const cBigSurCliff = new THREE.Color(0x8a929a);
    const cMontereyGolf = new THREE.Color(0x529858);
    const cMontereyRock = new THREE.Color(0x8e9aa4);

    const cNorCalHills = new THREE.Color(0x546e42);
    const cRedwoodForest = new THREE.Color(0x1e3020);
    const cOregonTideSand = new THREE.Color(0xab9b83);
    const cOregonSpruce = new THREE.Color(0x254530);
    const cColumbiaBasalt = new THREE.Color(0x3e4442);
    const cWashingtonForest = new THREE.Color(0x1a3322);
    const cCascadeSnow = new THREE.Color(0xecf3f8);
    const cCascadeGranite = new THREE.Color(0x4a525a);
    const cIdahoPine = new THREE.Color(0x3e5c30);
    const cIdahoLake = new THREE.Color(0x1e8db4);
    const cGlacierTundra = new THREE.Color(0x52624a);
    const cGlacierArgillite = new THREE.Color(0x785648);
    const cGlacierSnow = new THREE.Color(0xf0f6fa);
    const cGlacierLake = new THREE.Color(0x289cb8);

    for (let c = 0; c < numChunks; c++) {
      const zMin = -200 + c * CHUNK_SIZE;
      const zMax = zMin + CHUNK_SIZE;

      const chunkGeo = new THREE.PlaneGeometry(width, CHUNK_SIZE, segsW, segsL);
      chunkGeo.rotateX(-Math.PI * 0.5);
      chunkGeo.translate(0, 0, zMin + CHUNK_SIZE * 0.5);

      const pos = chunkGeo.attributes.position;
      const colors = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const elevation = this.getGroundElevation(vx, vz);
        pos.setY(i, elevation);

        let vertexCol = new THREE.Color(0x6e8252);

        // Zone 0: Mojave Desert (Z < 6500m)
        if (vz < 6500) {
          vertexCol.copy(cDesertSand);
          if (elevation > 2.5) vertexCol.lerp(cDesertDune, Math.min(0.7, (elevation - 2.5) * 0.25));
          if (elevation < 0.2) vertexCol.lerp(cDesertClay, 0.4);
          if (elevation > 7.0 || Math.abs(vx) > 42) vertexCol.lerp(cDesertRock, 0.55);

          // Cougar Ridge 4x4 Mountain Massif & Expedition Trail (Z: 2480m - 3100m)
          if (vz >= 2480 && vz <= 3100) {
            const roadTrans = this.splineRoad.getRoadTransformAtZ(vz, 0, 0);
            const latFromCenter = (vx - roadTrans.pos.x) * (-1); // negative is mountain side

            if (latFromCenter <= -16 && latFromCenter >= -420) {
              const cGranite = new THREE.Color(0x78716c);
              const cSedonaRed = new THREE.Color(0x99391e);
              const cRimrock = new THREE.Color(0x602613);

              // Mountain massif strata: rich red sandstone and granite rimrock
              vertexCol.copy(cDesertRock);
              if (elevation > 35.0) {
                vertexCol.lerp(cGranite, 0.65);
              } else if (elevation > 12.0) {
                vertexCol.lerp(cSedonaRed, 0.55);
              } else {
                vertexCol.lerp(cRimrock, 0.40);
              }

              // Query DownhillSpline & TrailSpline to paint authentic compacted surfaces
              const downhillQuery = DownhillSpline.queryDownhill(latFromCenter, vz);
              const trailQuery = TrailSpline.queryTrail(latFromCenter, vz);

              if (downhillQuery && (!trailQuery || downhillQuery.dist < trailQuery.dist)) {
                const halfW = (downhillQuery.width || 16.0) * 0.5;
                if (downhillQuery.dist <= halfW) {
                  // High-speed graded clay/caliche chute with packed tire ruts
                  const cDownhillBed = new THREE.Color(0x542913);
                  const cDownhillRuts = new THREE.Color(0x381909);
                  const rutPattern = Math.cos((latFromCenter - downhillQuery.centerlineLat) * 1.2);
                  const bedCol = cDownhillBed.clone().lerp(cDownhillRuts, Math.max(0, rutPattern * 0.45));
                  vertexCol.copy(bedCol);
                } else if (downhillQuery.dist <= halfW + 6.0) {
                  const shoulderFactor = (downhillQuery.dist - halfW) / 6.0;
                  const cShoulder = new THREE.Color(0x753d1d);
                  vertexCol.lerp(cShoulder, 1.0 - shoulderFactor);
                }
              } else if (trailQuery) {
                const halfW = (trailQuery.width || 9.0) * 0.5;
                const streamCross = TrailSpline.isStreamCrossing(latFromCenter, vz);
                if (streamCross) {
                  const cWetRiverMud = new THREE.Color(0x271f18);
                  const cRiverPebbleBed = new THREE.Color(0x38414a);
                  const riverCol = cWetRiverMud.clone().lerp(cRiverPebbleBed, Math.sin(latFromCenter * 2.0) * 0.5 + 0.5);
                  vertexCol.lerp(riverCol, 0.88);
                } else if (trailQuery.inSummitPlateau) {
                  const cSummitGravel = new THREE.Color(0x52483d);
                  vertexCol.lerp(cSummitGravel, 0.85);
                } else if (trailQuery.dist <= halfW) {
                  const cTrailBed = new THREE.Color(0x4a2411);
                  const cCrushedGravel = new THREE.Color(0x6b4423);
                  const bedCol = cTrailBed.clone().lerp(cCrushedGravel, Math.sin(trailQuery.t * 30.0) * 0.3 + 0.5);
                  vertexCol.copy(bedCol);
                } else if (trailQuery.dist <= halfW + 6.0) {
                  const shoulderFactor = (trailQuery.dist - halfW) / 6.0;
                  const cShoulder = new THREE.Color(0x6b3519);
                  vertexCol.lerp(cShoulder, 1.0 - shoulderFactor);
                }
              }
            }
          }
        }
        // Zone 1: Malibu & PCH (Z: 6500m - 14500m)
        else if (vz >= 6500 && vz < 14500) {
          const roadTrans = this.splineRoad.getRoadTransformAtZ(vz, 0, 0);
          const latDist = vx - roadTrans.pos.x;
          if (latDist < -10) {
            vertexCol.copy(cMalibuBeach);
            if (latDist < -22) vertexCol.lerp(cMalibuWetSand, 0.6);
          } else if (latDist > 12) {
            vertexCol.copy(cMalibuChaparral);
            if (elevation > 14.0) vertexCol.lerp(cMalibuMountain, 0.7);
            if (elevation > 28.0) vertexCol.lerp(cMalibuRock, 0.6);
          } else {
            vertexCol.copy(cMalibuBeach);
          }
        }
        // Zone 2: Big Sur (Z: 14500m - 20500m)
        else if (vz >= 14500 && vz < 20500) {
          vertexCol.copy(cBigSurGreen);
          if (elevation > 18.0 || Math.abs(vx) > 28) vertexCol.lerp(cBigSurCliff, 0.6);
        }
        // Zone 3: Monterey Bay & Carmel (Z: 20500m - 25500m)
        else if (vz >= 20500 && vz < 25500) {
          vertexCol.copy(cMontereyGolf);
          if (vx < -18 || elevation > 10.0) vertexCol.lerp(cMontereyRock, 0.5);
        }
        // Zone 4: NorCal & Marin (Z: 25500m - 31000m)
        else if (vz >= 25500 && vz < 31000) {
          vertexCol.copy(cNorCalHills);
        }
        // Zone 5: Redwood Forest (Z: 31000m - 36000m)
        else if (vz >= 31000 && vz < 36000) {
          vertexCol.copy(cRedwoodForest);
        }
        // Zone 6: Oregon Coast (Z: 36000m - 40500m)
        else if (vz >= 36000 && vz < 40500) {
          if (vx < -14) {
            vertexCol.copy(cOregonTideSand);
          } else {
            vertexCol.copy(cOregonSpruce);
          }
        }
        // Zone 7: Columbia River Gorge (Z: 40500m - 45000m)
        else if (vz >= 40500 && vz < 45000) {
          vertexCol.copy(cColumbiaBasalt);
        }
        // Zone 8: Washington & Olympic (Z: 45000m - 49500m)
        else if (vz >= 45000 && vz < 49500) {
          vertexCol.copy(cWashingtonForest);
        }
        // Zone 9: Cascade Alpine Pass & Mount Rainier (Z: 49500m - 53500m)
        else if (vz >= 49500 && vz < 53500) {
          if (elevation > 35.0 || vx > 30.0) {
            vertexCol.copy(cCascadeSnow);
          } else {
            vertexCol.copy(cCascadeGranite);
          }
        }
        // Zone 10: Idaho Panhandle & Lake Coeur d'Alene (Z: 53500m - 57500m)
        else if (vz >= 53500 && vz < 57500) {
          if (vx < -18 && elevation < 6.0) {
            vertexCol.copy(cIdahoLake);
          } else {
            vertexCol.copy(cIdahoPine);
          }
        }
        // Zone 11: Montana Big Sky & Glacier Going-to-the-Sun (Z: 57500m - 62000m)
        else {
          if (vz < 59400 && vx < -18 && elevation < 14.0) {
            vertexCol.copy(cGlacierLake);
          } else if (elevation > 60.0) {
            vertexCol.copy(cGlacierSnow);
          } else if (elevation > 28.0 || Math.abs(vx) > 35) {
            vertexCol.copy(cGlacierArgillite);
          } else {
            vertexCol.copy(cGlacierTundra);
          }
        }

        colors[i * 3 + 0] = vertexCol.r;
        colors[i * 3 + 1] = vertexCol.g;
        colors[i * 3 + 2] = vertexCol.b;
      }

      chunkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      chunkGeo.computeVertexNormals();
      chunkGeo.computeBoundingBox();
      chunkGeo.computeBoundingSphere();

      let chunkMat = this.matTerrainDesert;
      if (zMin >= 57500) { // Montana Glacier Alpine Pass
        chunkMat = this.matTerrainMountain;
      } else if (zMin >= 53500) { // Idaho Panhandle Timber Country
        chunkMat = this.matTerrainForest;
      } else if (zMin >= 49500) { // Cascade Alpine Mountains & Glaciers
        chunkMat = this.matTerrainMountain;
      } else if (zMin >= 45000) { // Washington Olympic Forest
        chunkMat = this.matTerrainForest;
      } else if (zMin >= 40500) { // Columbia Gorge Basalt & Mountains
        chunkMat = this.matTerrainMountain;
      } else if (zMin >= 31000) { // Redwood & Oregon Forest
        chunkMat = this.matTerrainForest;
      } else if (zMin >= 14500 && zMin < 25500) { // Big Sur & Monterey Cliffs
        chunkMat = this.matTerrainCoastal;
      } else if (zMin >= 6500) { // Malibu & NorCal Hills
        chunkMat = this.matTerrainSoil;
      }

      const chunkMesh = new THREE.Mesh(chunkGeo, chunkMat);
      chunkMesh.name = `TerrainChunk_${zMin}_${zMax}`;
      chunkMesh.receiveShadow = true;
      chunkMesh.userData = { zMin, zMax, index: c };

      this.chunks.push(chunkMesh);
      this.group.add(chunkMesh);
    }

    // Retain this.terrainMesh backward compatibility pointing to root group
    this.terrainMesh = this.group;
  }

  update(dt, playerPos = null) {
    if (this.oceanSystem) {
      this.oceanSystem.update(dt);
    }

    if (playerPos && typeof playerPos.z === 'number' && this.chunks.length > 0) {
      const pZ = playerPos.z;
      const VISIBLE_MARGIN_BEHIND = 1200;
      const VISIBLE_MARGIN_AHEAD = 2800;

      for (let i = 0; i < this.chunks.length; i++) {
        const chunk = this.chunks[i];
        const { zMin, zMax } = chunk.userData;
        const isVisible = (zMax >= pZ - VISIBLE_MARGIN_BEHIND) && (zMin <= pZ + VISIBLE_MARGIN_AHEAD);
        chunk.visible = isVisible;
      }
    }
  }

  updateZonePalette(zone) {
    if (this.oceanSystem) {
      this.oceanSystem.updateZonePalette(zone);
    }
  }
}
