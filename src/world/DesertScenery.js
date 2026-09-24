import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';
import { TrailSpline, MUD_BOG_ZONES } from './TrailSpline.js';
import { DownhillSpline } from './DownhillSpline.js';
import { gameState } from '../state.js';
import { SUMMIT_LAYOUT, placeSummitProp, isInsideSummitClearing, terrainRibbon, trailSign, buildSummitClearing, buildDescentWayfinding } from './TrailExperience.js';

/**
 * Procedural tapered tube along a 3D spline curve with smooth vertex normals.
 * @param {THREE.Curve} curve 3D parametric curve
 * @param {number} numSegments longitudinal divisions
 * @param {number} radialSegments radial divisions
 * @param {number} startRadius radius at t=0
 * @param {number} endRadius radius at t=1
 * @param {boolean} closeCaps whether to close ends with center vertex fans
 */
function createTaperedTubeGeometry(curve, numSegments = 24, radialSegments = 12, startRadius = 2.0, endRadius = 1.0, closeCaps = true) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  const frames = curve.computeFrenetFrames(numSegments, false);

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const point = curve.getPointAt(t);
    const r = THREE.MathUtils.lerp(startRadius, endRadius, t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = -Math.cos(angle);

      const nx = normal.x * cos + binormal.x * sin;
      const ny = normal.y * cos + binormal.y * sin;
      const nz = normal.z * cos + binormal.z * sin;
      const len = Math.hypot(nx, ny, nz) || 1;

      positions.push(
        point.x + (nx / len) * r,
        point.y + (ny / len) * r,
        point.z + (nz / len) * r
      );
      uvs.push(t, v);
    }
  }

  for (let i = 0; i < numSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  if (closeCaps) {
    const startCenter = curve.getPointAt(0);
    const startIdx = positions.length / 3;
    positions.push(startCenter.x, startCenter.y, startCenter.z);
    uvs.push(0, 0.5);
    for (let j = 0; j < radialSegments; j++) {
      indices.push(startIdx, j, j + 1);
    }

    const endCenter = curve.getPointAt(1);
    const endIdx = positions.length / 3;
    positions.push(endCenter.x, endCenter.y, endCenter.z);
    uvs.push(1, 0.5);
    const baseEnd = numSegments * (radialSegments + 1);
    for (let j = 0; j < radialSegments; j++) {
      indices.push(endIdx, baseEnd + j + 1, baseEnd + j);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Procedural continuous lofted body hull for dinosaurs.
 * Sweeps smooth elliptical cross-sections along a spine with seamless Gouraud normals.
 */
function createLoftedBodyGeometry(spinePoints, ringRadiiX, ringRadiiY, radialSegments = 16) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];
  const numRings = spinePoints.length;

  for (let i = 0; i < numRings; i++) {
    const pt = spinePoints[i];
    const rx = ringRadiiX[i];
    const ry = ringRadiiY[i];
    const u = i / (numRings - 1);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      positions.push(
        pt.x + cos * rx,
        pt.y + sin * ry,
        pt.z
      );
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < numRings - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Front cap
  const startIdx = positions.length / 3;
  positions.push(spinePoints[0].x, spinePoints[0].y, spinePoints[0].z);
  uvs.push(0, 0.5);
  for (let j = 0; j < radialSegments; j++) {
    indices.push(startIdx, j + 1, j);
  }

  // Rear cap
  const endIdx = positions.length / 3;
  const lastPt = spinePoints[numRings - 1];
  positions.push(lastPt.x, lastPt.y, lastPt.z);
  uvs.push(1, 0.5);
  const baseEnd = (numRings - 1) * (radialSegments + 1);
  for (let j = 0; j < radialSegments; j++) {
    indices.push(endIdx, baseEnd + j, baseEnd + j + 1);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export class DesertSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.animatedObjects = [];
    this.tumbleweeds = [];
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Desert Palette Materials with Procedural Strata & Normal Maps
    const rockTex = renderer.textures.desertRockStrata(256);
    const rockNorm = renderer.textures.terrainNormalPBR ? renderer.textures.terrainNormalPBR('rock_strata', 512) : null;
    this.matMesaStrata = new THREE.MeshToonMaterial({
      color: 0xdf8450,
      map: rockTex,
      normalMap: rockNorm,
      normalScale: new THREE.Vector2(0.75, 0.75),
      gradientMap: renderer.toonGradients.threeTone
    });
    this.matMesaRed = renderer.createToonMaterial({ color: 0xba4a29, gradientBands: 3, map: rockTex, normalMap: rockNorm });
    this.matMesaGold = renderer.createToonMaterial({ color: 0xd99543, gradientBands: 3, map: rockTex, normalMap: rockNorm });
    this.matMesaCap = renderer.createToonMaterial({ color: 0x6e200e, gradientBands: 2, normalMap: rockNorm });
    this.matMesaTalus = renderer.createToonMaterial({ color: 0xa44626, gradientBands: 3, map: rockTex, normalMap: rockNorm });
    this.matDesertBoulder = renderer.createToonMaterial({ color: 0xb55a36, gradientBands: 3, normalMap: rockNorm });

    // Flora Materials (Procedural Cactus Pleats, Joshua Bark, Sagebrush, Palms)
    const cactusDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('cactus', 256) : null;
    const joshuaTrunkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('joshua', 256) : null;
    const joshuaTuftDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('joshua', 256) : null;
    const palmFrondDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('palm', 256) : null;

    this.matSaguaro = renderer.createToonMaterial({ color: 0x549660, gradientBands: 3, map: cactusDiff });
    this.matSaguaroArm = renderer.createToonMaterial({ color: 0x5fa36c, gradientBands: 3, map: cactusDiff });
    this.matPricklyPad = renderer.createToonMaterial({ color: 0x68b076, gradientBands: 3, map: cactusDiff });
    this.matCactusFlower = renderer.createToonMaterial({ color: 0xf59e0b, gradientBands: 2 });
    this.matCactusMagenta = renderer.createToonMaterial({ color: 0xe11d48, gradientBands: 2 });
    this.matJoshuaTrunk = renderer.createToonMaterial({ color: 0x927552, gradientBands: 2, map: joshuaTrunkDiff });
    this.matJoshuaTuft = renderer.createToonMaterial({ color: 0x66af44, gradientBands: 3, map: joshuaTuftDiff });
    this.matDesertPalmFrond = renderer.createToonMaterial({ color: 0x46a23c, gradientBands: 3, map: palmFrondDiff });
    this.matCottonwoodCrown = renderer.createToonMaterial({ color: 0x4a7337, gradientBands: 3 });
    this.matSagebrush = renderer.createToonMaterial({ color: 0x92ad85, gradientBands: 2 });
    this.matMarigold = renderer.createToonMaterial({ color: 0xfbbf24, gradientBands: 2 });

    // Architecture & Highway Materials (Corrugated Tin, Rusted Metal, Weathered Timber)
    const tinDiff = renderer.textures.corrugatedTinPBR ? renderer.textures.corrugatedTinPBR(256) : null;
    const tinNorm = renderer.textures.corrugatedTinNormalPBR ? renderer.textures.corrugatedTinNormalPBR(256) : null;
    const rustDiff = renderer.textures.rustedMetalPBR ? renderer.textures.rustedMetalPBR(256) : null;
    const rustNorm = renderer.textures.rustedMetalNormalPBR ? renderer.textures.rustedMetalNormalPBR(256) : null;
    const woodNorm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;

    this.matTurbineWhite = renderer.createToonMaterial({ color: 0xf4f6f8, gradientBands: 3 });
    this.matWoodPole = renderer.createToonMaterial({ color: 0x4e3e30, gradientBands: 2, normalMap: woodNorm });
    this.matUtilityWire = new THREE.LineBasicMaterial({ color: 0x1f2429, linewidth: 1.5 });
    this.matRustWreck = renderer.createToonMaterial({ color: 0x9e4428, gradientBands: 3, map: rustDiff, normalMap: rustNorm });
    this.matTinRoof = renderer.createToonMaterial({ color: 0x7a8694, gradientBands: 2, map: tinDiff, normalMap: tinNorm });
    this.matChrome = renderer.createToonMaterial({ color: 0xecf0f3, gradientBands: 4 });
    this.matDinerRed = renderer.createToonMaterial({ color: 0xd92d3a, gradientBands: 3 });
    this.matDinerWhite = renderer.createToonMaterial({ color: 0xffffff, gradientBands: 2 });
    this.matDinerGlass = renderer.createToonMaterial({ color: 0x93c5fd, opacity: 0.85, transparent: true });

    // Dinosaur Landmark Materials — Authentic Claude Bell 1970s/1980s Retro Palette
    this.matBrontoGreen = renderer.createToonMaterial({ color: 0x447750, gradientBands: 3 });
    this.matBrontoBelly = renderer.createToonMaterial({ color: 0x8eb691, gradientBands: 3 });
    this.matRexOrange = renderer.createToonMaterial({ color: 0xb84b25, gradientBands: 3 });
    this.matRexBelly = renderer.createToonMaterial({ color: 0xdf9c6e, gradientBands: 3 });
    this.matRexDark = renderer.createToonMaterial({ color: 0x642414, gradientBands: 2 });
    this.matRexMouth = renderer.createToonMaterial({ color: 0x8a1b24, gradientBands: 2 });
    this.matRexEye = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.matDinoWhite = new THREE.MeshBasicMaterial({ color: 0xf8f8f8 });
    this.matDinoDark = new THREE.MeshBasicMaterial({ color: 0x18181b });
    this.matDinoClaw = renderer.createToonMaterial({ color: 0xeee6d6, gradientBands: 2 });
    this.matDinoWood = renderer.createToonMaterial({ color: 0x5e3d23, gradientBands: 2 });
    this.matDinoWoodStep = renderer.createToonMaterial({ color: 0x432a17, gradientBands: 2 });
    this.matDinoWindowGlow = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.matDinoSignRed = renderer.createToonMaterial({ color: 0xb91c1c, gradientBands: 2 });
    this.matDinoSignGold = new THREE.MeshBasicMaterial({ color: 0xfcd34d });
    this.matDinoSpotlight = renderer.createToonMaterial({ color: 0x27272a, gradientBands: 2 });

    // Neon Emissives
    this.matNeonRed = new THREE.MeshBasicMaterial({ color: 0xff2a48 });
    this.matNeonYellow = new THREE.MeshBasicMaterial({ color: 0xffd23f });
    this.matNeonCyan = new THREE.MeshBasicMaterial({ color: 0x22eeff });
    this.matNeonGreen = new THREE.MeshBasicMaterial({ color: 0x39ff14 });

    // Bottle Tree Glass Colors - Vibrant but balanced
    this.matBottleBlue = new THREE.MeshBasicMaterial({ color: 0x2ea5dc });
    this.matBottleGreen = new THREE.MeshBasicMaterial({ color: 0x1cb354 });
    this.matBottleAmber = new THREE.MeshBasicMaterial({ color: 0xebaa1c });
    this.matBottleRed = new THREE.MeshBasicMaterial({ color: 0xe43350 });

    this.matWigwamWhite = renderer.createToonMaterial({ color: 0xf5f5f0, gradientBands: 2 });
    this.matWigwamStripe = renderer.createToonMaterial({ color: 0x8b3a2e, gradientBands: 2 });
    this.matOutletStucco = renderer.createToonMaterial({ color: 0xf0e6d2, gradientBands: 2 });
    this.matOutletTile = renderer.createToonMaterial({ color: 0xbf4928, gradientBands: 3 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matDesertGravel = renderer.createToonMaterial({ color: 0xd4b896, gradientBands: 2 });
    this.matGasPumpRed = renderer.createToonMaterial({ color: 0xd92d3a, gradientBands: 2 });
    this.matWoodSignBrown = renderer.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2 });

    // Visible Off-Road Dirt Trail & Tire Ruts (PBR Compacted Caliche & Soil with Normal Relief)
    this.matDirtTrail = (() => {
      const diff = renderer.textures.desertRockCrawlTrailPBR ? renderer.textures.desertRockCrawlTrailPBR(512) : null;
      if (diff) {
        diff.repeat.set(2, 64);
        diff.wrapS = diff.wrapT = THREE.RepeatWrapping;
      }
      const norm = renderer.textures.desertRockCrawlTrailNormalPBR ? renderer.textures.desertRockCrawlTrailNormalPBR(512) : null;
      if (norm) {
        norm.repeat.set(2, 64);
        norm.wrapS = norm.wrapT = THREE.RepeatWrapping;
      }
      const m = new THREE.MeshStandardMaterial({
        vertexColors: true,
        color: 0xffffff, // Modulated by per-vertex terrain/shoulder colors
        map: diff,
        normalMap: norm,
        normalScale: new THREE.Vector2(1.5, 1.5),
        roughness: 0.90,
        metalness: 0.02
      });
      m.polygonOffset = true;
      m.polygonOffsetFactor = -3.5;
      m.polygonOffsetUnits = -3.5;
      return m;
    })();

    this.matTireRut = (() => {
      const diff = renderer.textures.gravelShoulderPBR ? renderer.textures.gravelShoulderPBR(256) : null;
      if (diff) {
        diff.repeat.set(1, 64);
        diff.wrapS = diff.wrapT = THREE.RepeatWrapping;
      }
      const norm = renderer.textures.gravelShoulderNormalPBR ? renderer.textures.gravelShoulderNormalPBR(256) : null;
      if (norm) {
        norm.repeat.set(1, 64);
        norm.wrapS = norm.wrapT = THREE.RepeatWrapping;
      }
      const m = new THREE.MeshStandardMaterial({
        color: 0x734426, // Warm compacted Mojave desert soil depression with tire rubber compaction
        map: diff,
        normalMap: norm,
        normalScale: new THREE.Vector2(1.5, 1.5),
        roughness: 0.88,
        metalness: 0.02
      });
      m.polygonOffset = true;
      m.polygonOffsetFactor = -2.8;
      m.polygonOffsetUnits = -2.8;
      return m;
    })();

    this.matTrailShoulder = (() => {
      const diff = renderer.textures.terrainPBR ? renderer.textures.terrainPBR('rock_strata', 512) : null;
      if (diff) {
        diff.repeat.set(2, 36);
        diff.wrapS = diff.wrapT = THREE.RepeatWrapping;
      }
      const m = new THREE.MeshStandardMaterial({
        color: 0xb5633a, // Warm weathered sandstone & scree talus
        map: diff,
        roughness: 0.92,
        metalness: 0.02
      });
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1.2;
      m.polygonOffsetUnits = -1.2;
      return m;
    })();
    this.matTrailSignYellow = renderer.createToonMaterial({ color: 0xd97706, gradientBands: 3 });
    this.matTrailReflectorOrange = renderer.createToonMaterial({ color: 0xc2410c, gradientBands: 3 });
    this.matViewfinderGreen = renderer.createToonMaterial({ color: 0x224229, gradientBands: 3 });
    this.matCastIronDark = renderer.createToonMaterial({ color: 0x27272a, gradientBands: 2 });
    this.matSignSubSlate = renderer.createToonMaterial({ color: 0x1e293b, gradientBands: 2 });
    this.matSignGoldText = renderer.createToonMaterial({ color: 0xf59e0b, gradientBands: 2 });

    // Downhill Express Sprint Materials
    this.matDownhillRoadbed = (() => {
      const diff = renderer.textures.desertRockCrawlTrailPBR ? renderer.textures.desertRockCrawlTrailPBR(512) : null;
      if (diff) {
        diff.repeat.set(2, 64);
        diff.wrapS = diff.wrapT = THREE.RepeatWrapping;
      }
      const norm = renderer.textures.desertRockCrawlTrailNormalPBR ? renderer.textures.desertRockCrawlTrailNormalPBR(512) : null;
      if (norm) {
        norm.repeat.set(2, 64);
        norm.wrapS = norm.wrapT = THREE.RepeatWrapping;
      }
      const m = new THREE.MeshStandardMaterial({
        color: 0xc87042, // Rich warm caliche & desert red sandstone
        map: diff,
        normalMap: norm,
        normalScale: new THREE.Vector2(1.8, 1.8),
        roughness: 0.88,
        metalness: 0.04,
        side: THREE.DoubleSide
      });
      m.polygonOffset = true;
      m.polygonOffsetFactor = -2.0;
      m.polygonOffsetUnits = -2.0;
      return m;
    })();
    this.matRallyRed = renderer.createToonMaterial({ color: 0xdc2626, gradientBands: 3 });
    this.matRallyWhite = renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 2 });
    this.matRallyChevron = renderer.createToonMaterial({ color: 0xf97316, gradientBands: 2 });
    this.matLaunchGateGreen = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    this.matLaunchGateAmber = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    this.downhillLaunchBeacons = [];

    // Technical 4x4 Off-Road Trail Materials
    this.matTireScuff = renderer.createToonMaterial({ color: 0x22252a, gradientBands: 2 });
    this.matGraniteGray = renderer.createToonMaterial({ color: 0x64748b, gradientBands: 3, rimColor: 0x94a3b8, rimPower: 3.0 });
    this.matWetGranite = renderer.createToonMaterial({ color: 0x232d38, gradientBands: 3, rimColor: 0x5a738e, rimPower: 4.0 });
    this.matBlackDiamond = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    this.matWinchOrange = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    this.matSteelCable = renderer.createToonMaterial({ color: 0x94a3b8, gradientBands: 3 });

    // Cougar Ridge 4x4 Trail Enhanced Realism Materials
    this.matRiverReed = renderer.createToonMaterial({ color: 0x3d5a3e, gradientBands: 2 });
    this.matFernGreen = renderer.createToonMaterial({ color: 0x1e7338, gradientBands: 2 });
    this.matManzanitaBark = renderer.createToonMaterial({ color: 0x7c2d12, gradientBands: 2 });
    this.matManzanitaLeaves = renderer.createToonMaterial({ color: 0x4d6849, gradientBands: 2 });
    this.matDriftwood = renderer.createToonMaterial({ color: 0x94a3b8, gradientBands: 2 });
    this.matWildflowerPoppy = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    this.matWildflowerLupine = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    this.matRecoveryBoardOrange = new THREE.MeshBasicMaterial({ color: 0xea580c });
    this.matTrailMarkerBlue = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    this.matTrailMarkerGreen = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    this.matCedarShake = renderer.createToonMaterial({ color: 0x452f1e, gradientBands: 2 });

    // Mountain Stream & Cougar Falls Materials
    this.waterfallCascadeTex = renderer.textures.waterfallCascadePBR ? renderer.textures.waterfallCascadePBR(512) : null;
    if (this.waterfallCascadeTex) {
      this.waterfallCascadeTex.repeat.set(1, 3);
      this.waterfallCascadeTex.wrapS = this.waterfallCascadeTex.wrapT = THREE.RepeatWrapping;
    }
    this.waterfallCascadeNorm = renderer.textures.waterfallCascadeNormalPBR ? renderer.textures.waterfallCascadeNormalPBR(512) : null;
    if (this.waterfallCascadeNorm) {
      this.waterfallCascadeNorm.repeat.set(1, 3);
      this.waterfallCascadeNorm.wrapS = this.waterfallCascadeNorm.wrapT = THREE.RepeatWrapping;
    }
    this.matWaterfallWater = new THREE.MeshStandardMaterial({
      color: 0xecfeff,
      map: this.waterfallCascadeTex,
      normalMap: this.waterfallCascadeNorm,
      normalScale: new THREE.Vector2(1.8, 1.8),
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.90,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matWaterfallWaterInner = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      roughness: 0.10,
      metalness: 0.20,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.waterfallMistTex = renderer.textures.waterfallMist ? renderer.textures.waterfallMist(256) : null;
    this.matWaterfallSpray = new THREE.MeshBasicMaterial({
      map: this.waterfallMistTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.waterfallRippleTex = renderer.textures.waterfallPoolRipplePBR ? renderer.textures.waterfallPoolRipplePBR(256) : null;
    this.waterfallRippleNorm = renderer.textures.waterfallPoolRippleNormalPBR ? renderer.textures.waterfallPoolRippleNormalPBR(256) : null;
    this.matWaterfallRipple = new THREE.MeshStandardMaterial({
      map: this.waterfallRippleTex,
      normalMap: this.waterfallRippleNorm,
      normalScale: new THREE.Vector2(2.4, 2.4),
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      roughness: 0.15,
      metalness: 0.10,
      depthWrite: false
    });

    // Mountain Stream Flowing Water & Foam Textures
    this.streamWaterTex = renderer.textures.mountainStreamPBR ? renderer.textures.mountainStreamPBR(512) : null;
    if (this.streamWaterTex) {
      this.streamWaterTex.repeat.set(2, 4);
      this.streamWaterTex.wrapS = this.streamWaterTex.wrapT = THREE.RepeatWrapping;
    }
    this.streamWaterNorm = renderer.textures.mountainStreamNormalPBR ? renderer.textures.mountainStreamNormalPBR(512) : null;
    if (this.streamWaterNorm) {
      this.streamWaterNorm.repeat.set(2, 4);
      this.streamWaterNorm.wrapS = this.streamWaterNorm.wrapT = THREE.RepeatWrapping;
    }
    this.streamFoamTex = renderer.textures.streamFoam ? renderer.textures.streamFoam(256) : null;
    if (this.streamFoamTex) {
      this.streamFoamTex.repeat.set(2, 2);
      this.streamFoamTex.wrapS = this.streamFoamTex.wrapT = THREE.RepeatWrapping;
    }

    this.matStreamWater = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      map: this.streamWaterTex,
      normalMap: this.streamWaterNorm,
      normalScale: new THREE.Vector2(1.8, 1.8),
      roughness: 0.06,
      metalness: 0.16,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matStreamFoam = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      map: this.streamFoamTex,
      transparent: true,
      opacity: 0.88,
      roughness: 0.35,
      metalness: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matRiverPebble = renderer.createToonMaterial({ color: 0x475569, gradientBands: 2 });
    this.matLushGrass = renderer.createToonMaterial({ color: 0x38b868, gradientBands: 2 });
    this.matPineNeedles = renderer.createToonMaterial({ color: 0x1e3a29, gradientBands: 2 });
    this.matPineNeedlesAlt = renderer.createToonMaterial({ color: 0x144528, gradientBands: 2 });
    this.matWillowFoliage = renderer.createToonMaterial({ color: 0x6bb343, gradientBands: 3 });
    this.matAlderFoliage = renderer.createToonMaterial({ color: 0x3e8a38, gradientBands: 3 });
    this.matAspenTrunk = renderer.createToonMaterial({ color: 0xe2e8f0, gradientBands: 2 });
    this.matAspenFoliage = renderer.createToonMaterial({ color: 0x84cc16, gradientBands: 3 });
    this.matWetRiverBank = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.28, metalness: 0.15 });
    this.matRiverMoss = renderer.createToonMaterial({ color: 0x27672f, gradientBands: 2 });

    // 3D Mud Bog, Viscous Slurry & Glossy Standing Water Puddle Materials
    this.matMudSlurry = new THREE.MeshStandardMaterial({
      color: 0x24160e,
      roughness: 0.20,
      metalness: 0.18,
      bumpScale: 0.09
    });
    this.matMudPuddle = new THREE.MeshStandardMaterial({
      color: 0x1c140c,
      map: this.streamWaterTex,
      normalMap: this.streamWaterNorm,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.04,
      metalness: 0.24,
      transparent: true,
      opacity: 0.90,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matPineBark = renderer.createToonMaterial({ color: 0x4a2e1b, gradientBands: 3 });
    this.matDownedLog = renderer.createToonMaterial({ color: 0x3d2719, gradientBands: 2 });
    this.waterfallMistPlanes = [];

    // Surprise Populated Coastal City (Santa Monica / Malibu Vista) Materials
    this.matStoreAwningRed = renderer.createToonMaterial({ color: 0xdc2626, gradientBands: 2 });
    this.matStoreAwningBlue = renderer.createToonMaterial({ color: 0x2563eb, gradientBands: 2 });
    this.matStoreAwningTeal = renderer.createToonMaterial({ color: 0x0d9488, gradientBands: 2 });
    this.matCityWindowGlow = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.matPacificDeepBlue = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    this.matPierRed = renderer.createToonMaterial({ color: 0xef4444, gradientBands: 3 });
    this.matPierWhite = renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 2 });
    this.matNeonRalphs = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    this.matNeonTeal = new THREE.MeshBasicMaterial({ color: 0x2dd4bf });

    // ── Zone 0 Enhanced Scenery Materials ──
    this.matGoldShield = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0xb4821a,
      emissiveIntensity: 0.35
    });
    this.matGoldShieldTrim = new THREE.MeshBasicMaterial({ color: 0xfff7cc });
    this.matShieldHalo = new THREE.MeshBasicMaterial({
      color: 0xffea75,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.matDustDevil = new THREE.MeshBasicMaterial({
      color: 0xd4a373,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matVulture = new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide });
    this.matRailTie = renderer.createToonMaterial({ color: 0x3e2723, gradientBands: 2 });
    this.matSteelRail = renderer.createToonMaterial({ color: 0x94a3b8, gradientBands: 3 });
    this.matBallastGravel = renderer.createToonMaterial({ color: 0x5a6578, gradientBands: 2 });
    this.matLocomotiveYellow = renderer.createToonMaterial({ color: 0xeab308, gradientBands: 3 });
    this.matBoxcarRust = renderer.createToonMaterial({ color: 0x9a3412, gradientBands: 2 });
    this.matHopperGray = renderer.createToonMaterial({ color: 0x475569, gradientBands: 2 });
    this.matTankerBlack = renderer.createToonMaterial({ color: 0x1c1917, gradientBands: 2 });
    this.matBurmaRed = renderer.createToonMaterial({ color: 0xd90429, gradientBands: 2 });

    // Arrays & state for dynamic Zone 0 features
    this.dustDevils = [];
    this.route66Shields = [];
    this.circlingVultures = [];
    this.arroyoStuntTriggered = false;
    this.trainHornTriggered = false;

    this.buildDesertEnvironment();
  }

  buildDesertEnvironment() {
    this.buildMonumentValleyMesas();
    this.buildCabazonDinosaurs();
    this.buildRoute66DinerAndGasStation();
    // Note: 24HR Mojave Desert Auto Shop is managed by TrafficManager.serviceBays (AUTO_REPAIR_SHOPS) at z=1200
    this.buildElmersBottleTreeRanch();
    this.buildVintageHighwayBillboards();
    this.buildDesertBoulders();
    this.buildWindFarm();
    this.buildPowerPolesWithWires();
    this.buildProspectorCabins();
    this.buildRustedCarWrecks();
    this.buildCadillacRanchArtInstallation();
    this.buildRoute66RoadShields();
    this.buildRoysMotelSign();
    this.buildWigwamMotelCottages();
    this.buildDesertHillsOutletMall();
    this.buildVintageGasStation();
    this.buildCalicoBoulderSignage();
    this.buildRoadsidePulloutAprons();
    this.buildDetailedFlora();
    this.buildCoyoteRidgeTrail();
    this.buildDownhillExpressRoute();

    // Enhanced Zone 0 Highlights
    this.buildDustDevils();
    this.buildCirclingVultures();
    this.buildDesertRailroad();
    this.buildBurmaShaveSigns();
    this.buildRoute66Collectibles();
    this.buildArroyoStuntJump();
  }

  // 1. Layered Sandstone Mesas, Spires & Natural Highway Arch
  buildMonumentValleyMesas() {
    const mesaSpots = [
      { lat: -135, z: 450, topR: 28, baseR: 56, h: 65, rot: 0.15 },
      { lat: 145, z: 950, topR: 32, baseR: 62, h: 72, rot: -0.3 },
      { lat: -150, z: 1600, topR: 36, baseR: 68, h: 78, rot: 0.5 },
      { lat: 140, z: 2100, topR: 30, baseR: 58, h: 66, rot: 0.2 },
    ];

    mesaSpots.forEach(m => {
      const transform = this.splineRoad.getRoadTransformAtZ(m.z, m.lat, 0);
      const mesaGroup = new THREE.Group();
      mesaGroup.position.copy(transform.pos);
      mesaGroup.rotation.y = transform.heading + m.rot;

      // 1. Lower Talus Scree Slope (Wide angled base)
      const talusH = m.h * 0.38 + 18;
      const talusGeo = new THREE.CylinderGeometry(m.baseR * 0.82, m.baseR * 1.35, talusH, 10, 1);
      const talusMesh = new THREE.Mesh(talusGeo, this.matMesaTalus);
      talusMesh.position.y = talusH * 0.5 - 16;
      talusMesh.castShadow = true;
      mesaGroup.add(talusMesh);

      // 2. Middle Layered Cliff Wall (Vertical sedimentary strata)
      const cliffH = m.h * 0.65;
      const cliffGeo = new THREE.CylinderGeometry(m.topR * 1.05, m.baseR * 0.85, cliffH, 10, 1);
      const cliffMesh = new THREE.Mesh(cliffGeo, this.matMesaStrata);
      cliffMesh.position.y = talusH * 0.5 - 16 + talusH * 0.5 + cliffH * 0.5 - 4;
      cliffMesh.castShadow = true;
      mesaGroup.add(cliffMesh);

      // 3. Horizontal Sedimentary Color Inset Band
      const bandGeo = new THREE.CylinderGeometry(m.topR * 1.07, m.topR * 1.15, cliffH * 0.18, 10, 1);
      const bandMesh = new THREE.Mesh(bandGeo, this.matMesaGold);
      bandMesh.position.y = cliffMesh.position.y + cliffH * 0.15;
      mesaGroup.add(bandMesh);

      // 4. Flat Sandstone Rimrock Plateau Cap
      const capGeo = new THREE.CylinderGeometry(m.topR * 1.08, m.topR * 0.98, 4.0, 10, 1);
      const capMesh = new THREE.Mesh(capGeo, this.matMesaCap);
      capMesh.position.y = m.h + 2.0;
      capMesh.castShadow = true;
      mesaGroup.add(capMesh);

      this.group.add(mesaGroup);
    });

    // Desert Rock Spires / Hoodoos
    const spires = [
      { lat: -85, z: 650, r: 4.5, h: 36 },
      { lat: 90, z: 1300, r: 5.0, h: 42 },
      { lat: -105, z: 1950, r: 4.2, h: 34 }
    ];
    spires.forEach(sp => {
      const transform = this.splineRoad.getRoadTransformAtZ(sp.z, sp.lat, 0);
      const spireMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(sp.r * 0.4, sp.r * 1.5, sp.h, 7, 1),
        this.matMesaStrata
      );
      spireMesh.position.copy(transform.pos);
      spireMesh.position.y += sp.h * 0.5 - 4;
      spireMesh.rotation.y = transform.heading;
      spireMesh.castShadow = true;
      this.group.add(spireMesh);
    });

    // Natural Sandstone Highway Arch (Span over highway at z=3850)
    const archTrans = this.splineRoad.getRoadTransformAtZ(3850, 0, 0);
    const arch = new THREE.Group();
    arch.position.copy(archTrans.pos);
    arch.rotation.y = archTrans.heading;

    // Organic rock abutment pillars (outside the road)
    [-23.0, 23.0].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 5.8, 38, 8), this.matMesaRed);
      leg.position.set(lx, 12, 0);
      leg.castShadow = true;
      arch.add(leg);

      const collar = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 5, 8), this.matMesaGold);
      collar.position.set(lx, 24, 0);
      arch.add(collar);
    });

    // Arch Span across the highway
    const archSpan = new THREE.Mesh(new THREE.TorusGeometry(23.0, 3.8, 8, 18, Math.PI), this.matMesaStrata);
    archSpan.position.set(0, 17, 0);
    archSpan.castShadow = true;
    arch.add(archSpan);

    this.group.add(arch);
  }

  // 2. Cabazon Giant Dinosaurs Landmark (z=4500) — Authentic Claude Bell Roadside Attraction
  buildCabazonDinosaurs() {
    const dinoGroup = new THREE.Group();
    // Position 37m back from turnout center (lat = -65) for cinematic framing
    const trans = this.splineRoad.getRoadTransformAtZ(4500, -65, 0);
    dinoGroup.position.copy(trans.pos);
    dinoGroup.rotation.y = trans.heading;

    // -------------------------------------------------------------
    // Grounding: Gravel Tourist Apron, Curb, & Roadside Atmosphere
    // -------------------------------------------------------------
    const gravelPadGeo = new THREE.BoxGeometry(68.0, 0.3, 64.0);
    const gravelPad = new THREE.Mesh(gravelPadGeo, this.matDesertGravel);
    gravelPad.position.set(2.0, 0.15, 0.0);
    gravelPad.receiveShadow = true;
    dinoGroup.add(gravelPad);

    // Weathered timber curb around turnout-facing perimeter (at local -X side)
    const curbFront = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 64.0), this.matDinoWood);
    curbFront.position.set(-30.0, 0.25, 0.0);
    dinoGroup.add(curbFront);

    // Vintage Roadside Welcome Billboard: "CABAZON DINOSAURS" (facing oncoming traffic & turnout entrance)
    const signGroup = new THREE.Group();
    signGroup.position.set(-20.0, 0, -24.0);
    signGroup.rotation.y = Math.PI + 0.62; // Face oncoming traffic, angled ~36° inward toward highway lanes

    const postGeo = new THREE.CylinderGeometry(0.28, 0.34, 6.0, 8);
    [-2.2, 2.2].forEach(px => {
      const post = new THREE.Mesh(postGeo, this.matDinoWood);
      post.position.set(px, 3.0, 0);
      signGroup.add(post);
    });

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.6, 0.35), this.matWoodSignBrown);
    signBoard.position.set(0, 4.5, 0);
    signGroup.add(signBoard);

    // Red banner with bold gold letters
    const banner = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.95, 0.38), this.matDinoSignRed);
    banner.position.set(0, 5.0, 0.02);
    signGroup.add(banner);

    const goldTitle = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.42), this.matDinoSignGold);
    goldTitle.position.set(0, 5.0, 0.03);
    signGroup.add(goldTitle);

    const subPanel = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.4, 0.38), this.matDinoWoodStep);
    subPanel.position.set(0, 3.8, 0.02);
    signGroup.add(subPanel);

    // Neon green decorative top rail
    const neonRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.4, 8), this.matNeonGreen);
    neonRail.rotation.z = Math.PI * 0.5;
    neonRail.position.set(0, 5.9, 0.15);
    signGroup.add(neonRail);
    dinoGroup.add(signGroup);

    // Ground Floodlights illuminating Dinny and Mr. Rex (positioned on turnout side pointing at dinosaurs)
    const lightPositions = [
      { x: -14.0, z: -20.0, rotY: 0.35,  rotX: -0.5 }, // Dinny neck/face
      { x: -16.0, z: -4.0,  rotY: 0.15,  rotX: -0.4 }, // Dinny gift shop door & windows
      { x: -14.0, z: 8.0,   rotY: -0.25, rotX: -0.45 }, // Mr. Rex chest
      { x: -12.0, z: 18.0,  rotY: -0.45, rotX: -0.55 }, // Mr. Rex roaring jaws
    ];
    lightPositions.forEach(lp => {
      const spot = new THREE.Group();
      spot.position.set(lp.x, 0.2, lp.z);
      spot.rotation.y = lp.rotY;

      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8), this.matDinoSpotlight);
      housing.rotation.x = lp.rotX;
      housing.position.y = 0.45;
      spot.add(housing);

      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), this.matDinoWindowGlow);
      lens.rotation.x = lp.rotX - Math.PI * 0.5;
      lens.position.set(0, 0.7, 0.2);
      spot.add(lens);
      dinoGroup.add(spot);
    });

    // -------------------------------------------------------------
    // A. "Dinny the Dinosaur" — 150-Foot Apatosaurus / Brontosaurus
    // -------------------------------------------------------------
    const bronto = new THREE.Group();
    bronto.position.set(2.0, 0, -10.0);
    bronto.rotation.y = -0.05;

    // 1. Continuous Seamless Lofted Anatomical Body Hull
    const spine = [
      new THREE.Vector3(0, 9.4, -7.5),  // Neck base juncture
      new THREE.Vector3(0, 10.2, -5.0), // Muscular shoulder crest
      new THREE.Vector3(0, 10.8, -2.0), // Upper ribcage peak
      new THREE.Vector3(0, 10.6, 1.0),  // Deep barrel torso
      new THREE.Vector3(0, 10.0, 4.0),  // Mid waist
      new THREE.Vector3(0, 9.8, 6.5),   // Muscular hip girdle
      new THREE.Vector3(0, 9.4, 8.0),   // Rear hip slope
      new THREE.Vector3(0, 9.2, 9.0),   // Tail base juncture
    ];
    const radiiX = [2.4, 3.8, 4.6, 4.8, 4.6, 4.4, 3.5, 2.3];
    const radiiY = [2.7, 4.2, 5.2, 5.4, 5.1, 4.8, 3.8, 2.5];

    const bodyGeo = createLoftedBodyGeometry(spine, radiiX, radiiY, 18);
    const brontoBody = new THREE.Mesh(bodyGeo, this.matBrontoGreen);
    brontoBody.castShadow = true;
    bronto.add(brontoBody);

    // Pale sage-green underbelly shell
    const bellySpine = spine.map(p => new THREE.Vector3(p.x, p.y - 1.15, p.z));
    const bellyRx = radiiX.map(r => r * 0.94);
    const bellyRy = radiiY.map(r => r * 0.62);
    const bellyGeo = createLoftedBodyGeometry(bellySpine, bellyRx, bellyRy, 14);
    const brontoBelly = new THREE.Mesh(bellyGeo, this.matBrontoBelly);
    bronto.add(brontoBelly);

    // Subtle dorsal spine scutes along the spine peak
    for (let k = -4; k <= 5; k++) {
      const scute = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 5), this.matBrontoGreen);
      scute.position.set(0, 15.8 - Math.abs(k) * 0.16, k * 1.4);
      scute.rotation.x = -k * 0.05;
      bronto.add(scute);
    }

    // 2. Continuous Sweeping Neck (Graceful arch reaching forward & toward turnout)
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 9.4, -7.5),   // Base at shoulders
      new THREE.Vector3(-1.4, 12.6, -12.5),// Rising forward toward road
      new THREE.Vector3(-2.6, 16.2, -17.0),// Ascending curve
      new THREE.Vector3(-3.0, 19.2, -21.0),// Approaching crest
      new THREE.Vector3(-2.4, 20.4, -24.2),// Gentle crest apex
      new THREE.Vector3(-1.6, 18.8, -26.8),// Throat reaching head looking toward turnout
    ]);
    const neckGeo = createTaperedTubeGeometry(neckCurve, 24, 14, 2.3, 1.05, true);
    const neckMesh = new THREE.Mesh(neckGeo, this.matBrontoGreen);
    neckMesh.castShadow = true;
    bronto.add(neckMesh);

    // Pale throat under-accent
    const throatCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 8.2, -7.5),
      new THREE.Vector3(-1.3, 11.4, -12.5),
      new THREE.Vector3(-2.4, 15.0, -17.0),
      new THREE.Vector3(-2.8, 18.0, -21.0),
      new THREE.Vector3(-2.2, 19.2, -24.2),
      new THREE.Vector3(-1.5, 17.8, -26.6),
    ]);
    const throatGeo = createTaperedTubeGeometry(throatCurve, 20, 10, 1.6, 0.65, false);
    const throatMesh = new THREE.Mesh(throatGeo, this.matBrontoBelly);
    bronto.add(throatMesh);

    // 3. Expressive Sauropod Head (Looking down toward turnout visitors)
    const headGroup = new THREE.Group();
    headGroup.position.set(-1.6, 18.8, -27.0);
    headGroup.rotation.set(0.24, 0.32, 0.08);

    // Cranium
    const skullGeo = new THREE.SphereGeometry(1.55, 14, 12);
    skullGeo.scale(1.0, 1.05, 1.35);
    const skull = new THREE.Mesh(skullGeo, this.matBrontoGreen);
    headGroup.add(skull);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 2.6), this.matBrontoGreen);
    snout.position.set(0, -0.2, -1.5);
    headGroup.add(snout);

    // Nostrils on top of snout
    [-0.38, 0.38].forEach(nx => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), this.matDinoDark);
      nostril.position.set(nx, 0.55, -2.1);
      headGroup.add(nostril);
    });

    // Lower Jaw with friendly smile seam
    const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 2.4), this.matBrontoGreen);
    lowerJaw.position.set(0, -0.85, -1.35);
    headGroup.add(lowerJaw);

    // Expressive Eyes (Left & Right)
    [-1.05, 1.05].forEach(ex => {
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), this.matDinoWhite);
      sclera.position.set(ex, 0.38, -0.3);
      headGroup.add(sclera);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), this.matDinoDark);
      pupil.position.set(ex > 0 ? ex + 0.14 : ex - 0.14, 0.38, -0.42);
      headGroup.add(pupil);

      // Brow ridge
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.9), this.matBrontoGreen);
      brow.position.set(ex, 0.72, -0.3);
      brow.rotation.z = ex > 0 ? -0.2 : 0.2;
      headGroup.add(brow);
    });
    bronto.add(headGroup);

    // 4. Long Sinuous Tapered Tail (Curving backward into desert mesa backdrop, clear of Mr. Rex!)
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 9.2, 9.0),    // Base at hips
      new THREE.Vector3(2.5, 7.8, 14.5),   // Curving into desert background (+X)
      new THREE.Vector3(6.5, 5.4, 20.0),   // Descending away from turnout
      new THREE.Vector3(11.0, 3.2, 24.5),  // Continuing into mesa background
      new THREE.Vector3(15.5, 1.6, 28.0),  // Approaching sand
      new THREE.Vector3(20.0, 0.8, 30.5),  // Slender tip resting on sand
    ]);
    const tailGeo = createTaperedTubeGeometry(tailCurve, 24, 12, 2.3, 0.25, true);
    const tailMesh = new THREE.Mesh(tailGeo, this.matBrontoGreen);
    tailMesh.castShadow = true;
    bronto.add(tailMesh);

    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), this.matBrontoGreen);
    tailTip.position.set(20.0, 0.8, 30.5);
    bronto.add(tailTip);

    // 5. Four Giant Pillar Legs & Toes
    const legCoords = [
      { x: -3.8, z: -5.0 }, // Front Right (faces turnout)
      { x: 3.8,  z: -5.0 }, // Front Left (faces mesa)
      { x: -3.8, z: 5.2  }, // Rear Right (faces turnout)
      { x: 3.8,  z: 5.2  }, // Rear Left (faces mesa)
    ];
    legCoords.forEach(c => {
      const legGroup = new THREE.Group();
      legGroup.position.set(c.x, 0, c.z);

      // Thigh/Shoulder swell
      const thigh = new THREE.Mesh(new THREE.SphereGeometry(2.3, 14, 12), this.matBrontoGreen);
      thigh.scale.set(1.1, 1.25, 1.1);
      thigh.position.set(0, 6.4, 0);
      thigh.castShadow = true;
      legGroup.add(thigh);

      // Columnar Pillar
      const column = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 2.1, 6.4, 12), this.matBrontoGreen);
      column.position.set(0, 3.2, 0);
      column.castShadow = true;
      legGroup.add(column);

      // Padded Foot Base
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.45, 1.1, 12), this.matBrontoGreen);
      foot.position.set(0, 0.55, 0);
      legGroup.add(foot);

      // 3 Ivory Toenails/Claws (pointing toward turnout on right legs)
      [-0.9, 0.0, 0.9].forEach(tx => {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.85, 6), this.matDinoClaw);
        claw.position.set(c.x < 0 ? -2.1 : 2.1, 0.35, tx);
        claw.rotation.z = c.x < 0 ? Math.PI * 0.4 : -Math.PI * 0.4;
        legGroup.add(claw);
      });

      bronto.add(legGroup);
    });

    // 6. Famous Claude Bell Gift Shop Entrance on Dinny's Turnout-Facing Flank (-X side)
    const shopGroup = new THREE.Group();
    shopGroup.position.set(-4.8, 0, 0.5);

    // Deep recessed wood door frame
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 2.0), this.matDinoWood);
    doorFrame.position.set(0, 3.4, 0);
    shopGroup.add(doorFrame);

    // Dark wood paneled door
    const woodDoor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.0, 1.6), this.matDinoWoodStep);
    woodDoor.position.set(-0.05, 3.2, 0);
    shopGroup.add(woodDoor);

    const brassKnob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), this.matChrome);
    brassKnob.position.set(-0.24, 3.1, -0.55);
    shopGroup.add(brassKnob);

    // Wooden Porch Landing
    const porch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 2.6), this.matDinoWoodStep);
    porch.position.set(-1.2, 2.4, 0);
    shopGroup.add(porch);

    // Wooden Staircase descending toward turnout (-X direction)
    const stepCount = 5;
    for (let st = 0; st < stepCount; st++) {
      const stepY = 2.4 * (1 - (st + 1) / (stepCount + 1));
      const stepX = -2.4 - st * 0.55;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 2.2), this.matDinoWoodStep);
      stepMesh.position.set(stepX, stepY, 0);
      shopGroup.add(stepMesh);
    }

    // Split-rail wooden handrails
    const railPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6);
    [[-1.1, -0.4], [1.1, -0.4], [-1.1, -2.2], [1.1, -2.2], [-1.1, -4.4], [1.1, -4.4]].forEach(rp => {
      const railPost = new THREE.Mesh(railPostGeo, this.matDinoWood);
      railPost.position.set(rp[1], 2.4 + 0.9 - (Math.abs(rp[1]) > 2 ? (Math.abs(rp[1]) - 2.2) * 0.45 : 0), rp[0]);
      shopGroup.add(railPost);
    });

    // Hand-painted vintage sign: "DINOSAUR GIFT SHOP & MUSEUM" (facing turnout)
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.95, 3.4), this.matDinoSignRed);
    signBox.position.set(-0.1, 5.3, 0);
    shopGroup.add(signBox);

    const signGoldFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.05, 3.5), this.matDinoSignGold);
    signGoldFrame.position.set(-0.08, 5.3, 0);
    shopGroup.add(signGoldFrame);

    const signGoldText = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 3.0), this.matDinoSignGold);
    signGoldText.position.set(-0.1, 5.3, 0);
    shopGroup.add(signGoldText);

    // 4 Warm Glowing Porthole Windows along Dinny's turnout-facing flank
    [-3.5, -1.2, 1.8, 4.0].forEach(wz => {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 1.1), this.matDinoWood);
      winFrame.position.set(0, 7.8, wz);
      shopGroup.add(winFrame);

      const winGlow = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.85, 0.85), this.matDinoWindowGlow);
      winGlow.position.set(-0.02, 7.8, wz);
      shopGroup.add(winGlow);

      // Window cross mullion
      const mulH = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.85), this.matDinoDark);
      mulH.position.set(-0.03, 7.8, wz);
      shopGroup.add(mulH);
      const mulV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.85, 0.1), this.matDinoDark);
      mulV.position.set(-0.03, 7.8, wz);
      shopGroup.add(mulV);
    });
    bronto.add(shopGroup);

    dinoGroup.add(bronto);

    // -------------------------------------------------------------
    // B. "Mr. Rex" — Giant 65-Foot Retro T-Rex (Claude Bell 1981)
    // -------------------------------------------------------------
    const rex = new THREE.Group();
    // Positioned on the right side of the view, proud and completely unobstructed
    rex.position.set(-4.0, 0, 14.0);
    rex.rotation.y = -Math.PI * 0.40; // Angled proudly toward the turnout and highway!

    // 1. Heavy Tripod Stance & Muscular Pelvis
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), this.matRexOrange);
    pelvis.position.set(0, 9.8, 0);
    pelvis.castShadow = true;
    rex.add(pelvis);

    // Powerful Hind Limbs (Thighs, Knees, Shins, & 3-Toed Talons)
    [-2.5, 2.5].forEach(lx => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0, 0);

      // Muscular Thigh
      const thigh = new THREE.Mesh(new THREE.SphereGeometry(2.35, 14, 12), this.matRexOrange);
      thigh.scale.set(1.15, 2.1, 1.35);
      thigh.position.set(0, 7.6, 0.2);
      thigh.castShadow = true;
      legGroup.add(thigh);

      // Articulated Knee Joint
      const knee = new THREE.Mesh(new THREE.SphereGeometry(1.25, 10, 8), this.matRexOrange);
      knee.position.set(0, 4.8, 1.0);
      legGroup.add(knee);

      // Lower Shin / Calf
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 0.95, 5.2, 10), this.matRexOrange);
      shin.position.set(0, 2.6, 0.5);
      shin.rotation.x = -0.15;
      shin.castShadow = true;
      legGroup.add(shin);

      // Large 3-Toed Foot Pad
      const foot = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 3.8), this.matRexOrange);
      foot.position.set(0, 0.38, 0.8);
      foot.castShadow = true;
      legGroup.add(foot);

      // 3 Curved Dinosaur Talons Gripping Ground
      [-0.65, 0.0, 0.65].forEach(tx => {
        const talon = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.45, 6), this.matDinoClaw);
        talon.position.set(tx, 0.35, 2.8);
        talon.rotation.x = Math.PI * 0.45;
        legGroup.add(talon);
      });
      rex.add(legGroup);
    });

    // 2. Heavy Grounded Tail (Completes vintage retro tripod balance)
    const rexTailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 9.2, 0.2),
      new THREE.Vector3(0.0, 6.0, 4.5),
      new THREE.Vector3(0.0, 2.2, 8.8),
      new THREE.Vector3(0.0, 0.4, 12.2),
    ]);
    const rexTailGeo = createTaperedTubeGeometry(rexTailCurve, 16, 10, 2.3, 0.35, true);
    const rexTailMesh = new THREE.Mesh(rexTailGeo, this.matRexOrange);
    rexTailMesh.castShadow = true;
    rex.add(rexTailMesh);

    // 3. Upright Muscular Torso, Barrel Chest, & Belly Scutes
    const rexTorso = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.6, 9.2, 12), this.matRexOrange);
    rexTorso.position.set(0, 11.8, -0.6);
    rexTorso.rotation.x = 0.12;
    rexTorso.castShadow = true;
    rex.add(rexTorso);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 12), this.matRexOrange);
    chest.scale.set(1.14, 1.22, 1.15);
    chest.position.set(0, 13.4, -0.5);
    rex.add(chest);

    // Pale Belly Scutes
    const bellyScutes = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), this.matRexBelly);
    bellyScutes.scale.set(0.95, 1.4, 0.58);
    bellyScutes.position.set(0, 11.4, 1.25);
    bellyScutes.rotation.x = 0.12;
    rex.add(bellyScutes);

    // Ridge of Dark Dorsal Spines down the back
    for (let sp = 0; sp < 8; sp++) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.85, 4), this.matRexDark);
      spine.position.set(0, 16.5 - sp * 1.0, -1.8 + sp * 0.4);
      spine.rotation.x = -Math.PI * 0.35;
      rex.add(spine);
    }

    // 4. Short Signature T-Rex Forearms with Sharp Dual Claws
    [-1.8, 1.8].forEach(ax => {
      const armGroup = new THREE.Group();
      armGroup.position.set(ax, 14.0, -1.6);
      armGroup.rotation.x = 0.75;
      armGroup.rotation.z = ax > 0 ? 0.2 : -0.2;

      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.36, 1.8, 8), this.matRexOrange);
      upperArm.position.y = -0.8;
      armGroup.add(upperArm);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 1.4, 8), this.matRexOrange);
      forearm.position.set(0, -1.9, 0.3);
      forearm.rotation.x = 0.6;
      armGroup.add(forearm);

      // 2 Ivory Claws
      [-0.14, 0.14].forEach(cx => {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 5), this.matDinoClaw);
        claw.position.set(cx, -2.5, 0.7);
        claw.rotation.x = Math.PI * 0.6;
        armGroup.add(claw);
      });
      rex.add(armGroup);
    });

    // 5. Thick Muscular Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.65, 4.2, 10), this.matRexOrange);
    neck.position.set(0, 16.8, -1.6);
    neck.rotation.x = -0.32;
    rex.add(neck);

    // 6. Fierce Roaring Head & Jaws with Sharp Teeth & Pee-Wee Observation Deck
    const upperSkull = new THREE.Group();
    upperSkull.position.set(0, 19.6, -2.6);

    const cranium = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 3.8), this.matRexOrange);
    upperSkull.add(cranium);

    const rexSnout = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 3.2), this.matRexOrange);
    rexSnout.position.set(0, -0.2, -2.6);
    upperSkull.add(rexSnout);

    // Nostrils
    [-0.5, 0.5].forEach(nx => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), this.matDinoDark);
      nostril.position.set(nx, 0.45, -3.8);
      upperSkull.add(nostril);
    });

    // Heavy Bony Brow Ridges & Menacing Amber Eyes
    [-1.25, 1.25].forEach(ex => {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 1.4), this.matRexDark);
      brow.position.set(ex, 0.85, -1.2);
      brow.rotation.z = ex > 0 ? -0.25 : 0.25;
      upperSkull.add(brow);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.matRexEye);
      eye.position.set(ex > 0 ? ex + 0.1 : ex - 0.1, 0.45, -1.2);
      upperSkull.add(eye);

      const slitPupil = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), this.matDinoDark);
      slitPupil.position.set(ex > 0 ? ex + 0.3 : ex - 0.3, 0.45, -1.2);
      upperSkull.add(slitPupil);
    });

    // Crimson Mouth Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 3.0), this.matRexMouth);
    roof.position.set(0, -0.9, -2.2);
    upperSkull.add(roof);

    // Upper Rows of Sharp White Conical Teeth (12 teeth)
    for (let t = 0; t < 6; t++) {
      const tz = -1.0 - t * 0.5;
      [-1.05, 1.05].forEach(tx => {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.85, 5), this.matDinoWhite);
        tooth.position.set(tx * (1.0 - t * 0.08), -1.1, tz);
        tooth.rotation.x = Math.PI;
        upperSkull.add(tooth);
      });
    }
    rex.add(upperSkull);

    // Gaping Lower Jaw (Angled open wide in mighty roar)
    const lowerJawGroup = new THREE.Group();
    lowerJawGroup.position.set(0, 17.3, -2.3);
    lowerJawGroup.rotation.x = -0.38;

    const lowerJawBone = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 4.5), this.matRexOrange);
    lowerJawBone.position.set(0, 0, -2.0);
    lowerJawGroup.add(lowerJawBone);

    // Deep Crimson Tongue & Mouth Floor
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 3.2), this.matRexMouth);
    tongue.position.set(0, 0.55, -2.0);
    lowerJawGroup.add(tongue);

    // Lower Rows of Sharp White Conical Teeth (12 teeth pointing up)
    for (let t = 0; t < 6; t++) {
      const tz = -0.8 - t * 0.52;
      [-0.95, 0.95].forEach(tx => {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.75, 5), this.matDinoWhite);
        tooth.position.set(tx * (1.0 - t * 0.08), 0.75, tz);
        lowerJawGroup.add(tooth);
      });
    }

    // Iconic Pee-wee's Big Adventure Mouth Observation Platform!
    const obsDeck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 2.4), this.matDinoWoodStep);
    obsDeck.position.set(0, 0.82, -1.8);
    lowerJawGroup.add(obsDeck);

    // Safety railing behind front teeth
    const obsRail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), this.matDinoWood);
    obsRail.rotation.z = Math.PI * 0.5;
    obsRail.position.set(0, 1.25, -2.8);
    lowerJawGroup.add(obsRail);

    rex.add(lowerJawGroup);
    dinoGroup.add(rex);

    // -------------------------------------------------------------
    // Surrounding Desert Flora & Rocks
    // -------------------------------------------------------------
    const floraSpots = [
      { x: -24.0, z: -32.0, type: 'saguaro' }, // Framing left of Dinny's head
      { x: -22.0, z: 28.0,  type: 'saguaro' }, // Framing right of Mr. Rex
      { x: 26.0,  z: -26.0, type: 'saguaro' }, // Background desert flora
      { x: 26.0,  z: 32.0,  type: 'rock' },    // Background rock away from Rex tail
      { x: -26.0, z: -38.0, type: 'rock' },    // Left perimeter rock
    ];
    floraSpots.forEach(f => {
      if (f.type === 'saguaro') {
        const saguaro = new THREE.Group();
        saguaro.position.set(f.x, 0, f.z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 8.5, 8), this.matSaguaro);
        trunk.position.y = 4.25;
        trunk.castShadow = true;
        saguaro.add(trunk);

        // Arm
        const armH = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 2.2, 6), this.matSaguaroArm);
        armH.rotation.z = Math.PI * 0.5;
        armH.position.set(1.2, 5.0, 0);
        saguaro.add(armH);
        const armV = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 2.6, 6), this.matSaguaroArm);
        armV.position.set(2.1, 6.2, 0);
        saguaro.add(armV);
        dinoGroup.add(saguaro);
      } else {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), this.matMesaTalus);
        rock.scale.set(1.4, 0.9, 1.2);
        rock.position.set(f.x, 1.2, f.z);
        rock.rotation.set(0.3, 0.8, -0.2);
        dinoGroup.add(rock);
      }
    });

    this.group.add(dinoGroup);
  }

  // 3. Route 66 Retro Neon Diner & Vintage Gas Station (z=1900)
  buildRoute66DinerAndGasStation() {
    const complex = new THREE.Group();
    const trans = this.splineRoad.getRoadTransformAtZ(1900, 34, 0);
    complex.position.copy(trans.pos);
    // Face 30 degrees angled toward oncoming traffic so the front facade, ribbon glass, and signs are in full view
    complex.rotation.y = trans.heading + Math.PI * 0.62;

    // A. Authentic Streamline Moderne Porcelain-Enamel Diner with Rounded Corners & Panoramic Glass
    const diner = this.structureBuilder.buildRoadsideDinerOrMotel({
      width: 24.0,
      depth: 12.0,
      colorStucco: 0xf8fafc, // Gleaming Porcelain White
      colorTrim: 0x0284c7,   // Electric 1950s Turquoise
      colorAccent: 0xd92d3a, // Fire-Engine Diner Red
      subterraneanDepth: 3.5
    });
    diner.position.set(6.0, 0, -4.0);
    complex.add(diner);

    // B. Reconstructed 1950s Googie Winged Gas Station Island (Set side-by-side with diner)
    const gasIsland = new THREE.Group();
    gasIsland.position.set(-14.0, 0, 6.0);

    // Raised Concrete Curb with Red-and-White Safety Chevrons
    const islandCurb = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.4, 4.2), this.matDinerWhite);
    islandCurb.position.set(0, 0.2, 0);
    gasIsland.add(islandCurb);

    // 4 Vintage 1950s Wayne Tall Gas Pumps with Illuminated Route 66 Glass Globes
    [-5.5, -1.8, 1.8, 5.5].forEach(px => {
      const pump = new THREE.Group();
      pump.position.set(px, 0.4, 0);

      // Heavy enamel pump body with chrome side panels
      const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.6, 1.1), this.matDinerRed);
      pumpBody.position.y = 1.3;
      pumpBody.castShadow = true;
      pump.add(pumpBody);

      // Chrome face trim & volume counter dial
      const dialPlate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.2), this.matChrome);
      dialPlate.position.y = 1.7;
      pump.add(dialPlate);
      const dialFace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.25),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      dialFace.position.y = 1.7;
      pump.add(dialFace);

      // Chrome fueling nozzle & black coiled hose
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), this.matChrome);
      nozzle.position.set(0.72, 1.3, 0);
      nozzle.rotation.z = 0.4;
      pump.add(nozzle);

      // Illuminated Glass Globe on Top ("ROUTE 66")
      const globeNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.3, 8), this.matChrome);
      globeNeck.position.y = 2.75;
      pump.add(globeNeck);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 10), this.matNeonYellow);
      globe.position.y = 3.2;
      pump.add(globe);

      gasIsland.add(pump);
    });

    // Yellow Safety Guard Crash Bollards
    [-8.2, 8.2].forEach(bx => {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.3, 8), this.matNeonYellow);
      bollard.position.set(bx, 0.65, 0);
      gasIsland.add(bollard);
    });

    // Googie Winged Gas Canopy with Red-and-Turquoise Illuminated Fascia
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.5, 9.0), this.matDinerWhite);
    canopyRoof.position.set(0, 5.2, 0);
    gasIsland.add(canopyRoof);

    // Winged upward angled Googie fascia
    const fasciaRed = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.6, 9.6), this.matDinerRed);
    fasciaRed.position.set(0, 5.2, 0);
    gasIsland.add(fasciaRed);
    const fasciaNeon = new THREE.Mesh(new THREE.BoxGeometry(20.8, 0.15, 9.8), this.matNeonCyan);
    fasciaNeon.position.set(0, 5.2, 0);
    gasIsland.add(fasciaNeon);

    // Heavy Tubular Steel Posts (4 Chrome Columns)
    [[-7.5, -2.5], [-7.5, 2.5], [7.5, -2.5], [7.5, 2.5]].forEach(([cx, cz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.2, 8), this.matChrome);
      post.position.set(cx, 2.6, cz);
      gasIsland.add(post);
    });

    // Under-canopy recessed soffit warm lights
    for (let lx = -6; lx <= 6; lx += 4) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), this.matNeonYellow);
      light.position.set(lx, 4.9, 0);
      gasIsland.add(light);
    }

    complex.add(gasIsland);

    // C. Giant Freestanding 1950s Googie Starburst Neon Pylon Sign
    const signGroup = new THREE.Group();
    signGroup.position.set(-22.0, 0, 18.0);

    // Main 16-meter angled steel pylon posts
    const pylonA = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 16.0, 8), this.matChrome);
    pylonA.position.set(-0.8, 8.0, 0);
    pylonA.rotation.z = -0.06;
    signGroup.add(pylonA);
    const pylonB = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 16.0, 8), this.matChrome);
    pylonB.position.set(0.8, 8.0, 0);
    pylonB.rotation.z = 0.06;
    signGroup.add(pylonB);

    // Retro Boomerang Neon Sign Board
    const signBoardMain = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.2, 0.8), this.matDinerRed);
    signBoardMain.position.set(0, 13.5, 0);
    signGroup.add(signBoardMain);

    // Glowing Neon Yellow Text: "ROUTE 66"
    const textR66 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.1, 0.95), this.matNeonYellow);
    textR66.position.set(0, 14.5, 0);
    signGroup.add(textR66);

    // Glowing Neon Cyan Text: "DINER & GAS"
    const textDiner = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.8, 0.95), this.matNeonCyan);
    textDiner.position.set(0, 12.8, 0);
    signGroup.add(textDiner);

    // Flashing Red Neon Downward Arrow pointing into the turnout!
    const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 0.5), this.matNeonRed);
    arrowShaft.position.set(4.8, 11.5, 0);
    arrowShaft.rotation.z = 0.35;
    signGroup.add(arrowShaft);
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.2, 4), this.matNeonRed);
    arrowHead.position.set(5.8, 9.4, 0);
    arrowHead.rotation.z = Math.PI;
    signGroup.add(arrowHead);

    complex.add(signGroup);

    // D. Authentic Roadside Props: Vintage Coca-Cola Vending Machine & Ice Box
    // Classic Red Coca-Cola Bottle Vending Machine on Diner Porch
    const cokeMachine = new THREE.Group();
    cokeMachine.position.set(3.5, 0.3, 2.5);
    const cokeBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 1.1), this.matDinerRed);
    cokeBody.position.y = 1.2;
    cokeMachine.add(cokeBody);
    const cokeSign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.15),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    cokeSign.position.y = 2.0;
    cokeMachine.add(cokeSign);
    const coinSlot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 1.16), this.matChrome);
    coinSlot.position.set(0.35, 1.3, 0);
    cokeMachine.add(coinSlot);
    complex.add(cokeMachine);

    // White "ICE" Freezer Chest
    const iceBox = new THREE.Group();
    iceBox.position.set(1.5, 0.3, 2.5);
    const iceBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 1.2), this.matDinerWhite);
    iceBody.position.y = 0.65;
    iceBox.add(iceBody);
    const iceLid = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 1.1), this.matChrome);
    iceLid.position.y = 1.35;
    iceLid.rotation.x = -0.3;
    iceBox.add(iceLid);
    const iceText = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.25), this.matNeonCyan);
    iceText.position.y = 0.85;
    iceBox.add(iceText);
    complex.add(iceBox);

    // Vintage Air & Water Tower
    const airTower = new THREE.Group();
    airTower.position.set(-8.0, 0, 16.0);
    const airPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.4, 8), this.matDinerRed);
    airPole.position.y = 1.2;
    airTower.add(airPole);
    const airHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), this.matChrome);
    airHead.position.y = 2.5;
    airTower.add(airHead);
    const airGauge = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    airGauge.rotation.x = Math.PI * 0.5;
    airGauge.position.set(0, 2.5, 0.32);
    airTower.add(airGauge);
    complex.add(airTower);

    // E. Parked 1957 Turquoise Retro Cruiser Car in the Parking Stall
    const retroCar = new THREE.Group();
    retroCar.position.set(14.0, 0.1, 10.0);
    retroCar.rotation.y = -0.35;

    // Car Body & Fins
    const matCarTurquoise = this.renderer.createToonMaterial({ color: 0x06b6d4, gradientBands: 3 });
    const carLower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 5.2), matCarTurquoise);
    carLower.position.y = 0.55;
    retroCar.add(carLower);
    const carCabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 2.6), this.matDinerWhite);
    carCabin.position.set(0, 1.2, -0.3);
    retroCar.add(carCabin);
    const carGlass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 2.5), this.matDinerGlass);
    carGlass.position.set(0, 1.2, -0.3);
    retroCar.add(carGlass);
    // Chrome bumpers & tail fins
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.4), this.matChrome);
    frontBumper.position.set(0, 0.45, 2.6);
    retroCar.add(frontBumper);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.4), this.matChrome);
    rearBumper.position.set(0, 0.45, -2.6);
    retroCar.add(rearBumper);
    // 4 Wheels
    [[-1.2, 1.5], [1.2, 1.5], [-1.2, -1.5], [1.2, -1.5]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10),
        new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(wx, 0.42, wz);
      retroCar.add(wheel);
      const hubcap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.38, 8), this.matChrome);
      hubcap.rotation.z = Math.PI * 0.5;
      hubcap.position.set(wx, 0.42, wz);
      retroCar.add(hubcap);
    });
    complex.add(retroCar);

    // E2. Outdoor Checkered Dining Terrace & Retro Umbrella Tables
    const patioMat = this.renderer.createToonMaterial({ color: 0xe2e8f0, gradientBands: 2 });
    const patio = new THREE.Mesh(new THREE.BoxGeometry(14, 0.35, 8), patioMat);
    patio.position.set(6.0, 0.18, 4.2);
    complex.add(patio);

    // Checkered red border rim
    const patioBorder = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.4, 0.4), this.matDinerRed);
    patioBorder.position.set(6.0, 0.2, 8.2);
    complex.add(patioBorder);

    // 3 Chrome-Pedestal Diner Patio Tables with Red Striped Umbrellas
    [-4.0, 0.0, 4.0].forEach(tx => {
      const tableGroup = new THREE.Group();
      tableGroup.position.set(6.0 + tx, 0.35, 4.2);

      // Chrome pedestal & round table top
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 8), this.matChrome);
      stem.position.y = 0.55;
      tableGroup.add(stem);

      const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.08, 14), this.matDinerWhite);
      tableTop.position.y = 1.1;
      tableGroup.add(tableTop);

      const tableRim = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.06, 14), this.matChrome);
      tableRim.position.y = 1.1;
      tableGroup.add(tableRim);

      // Umbrella pole & canopy
      const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), this.matChrome);
      umbrellaPole.position.y = 1.6;
      tableGroup.add(umbrellaPole);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 10), this.matDinerRed);
      canopy.position.y = 2.7;
      tableGroup.add(canopy);

      // 3 Red Vinyl Diner Stools surrounding table
      for (let s = 0; s < 3; s++) {
        const angle = (s / 3) * Math.PI * 2;
        const stoolStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), this.matChrome);
        stoolStem.position.set(Math.cos(angle) * 1.35, 0.3, Math.sin(angle) * 1.35);
        tableGroup.add(stoolStem);

        const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 10), this.matDinerRed);
        stoolSeat.position.set(Math.cos(angle) * 1.35, 0.65, Math.sin(angle) * 1.35);
        tableGroup.add(stoolSeat);
      }

      complex.add(tableGroup);
    });

    // F. Wide Smooth Asphalt Parking Apron with White Painted Stalls
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(54, 48), this.matAsphaltLot);
    apron.rotateX(-Math.PI * 0.5);
    apron.position.set(0, 0.05, 8);
    complex.add(apron);

    // White Stall Stripes
    const matWhiteStall = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let s = 0; s < 5; s++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.5), matWhiteStall);
      stripe.rotateX(-Math.PI * 0.5);
      stripe.position.set(6 + s * 3.5, 0.07, 10);
      complex.add(stripe);
    }

    // Stunt Jump Dirt Ramp behind complex
    const rampGeo = new THREE.BoxGeometry(9, 2.4, 8);
    const ramp = new THREE.Mesh(rampGeo, this.matMesaRed);
    ramp.position.set(22, 0.9, -16);
    ramp.rotation.x = Math.PI * 0.12;
    complex.add(ramp);

    this.group.add(complex);
  }


  // 3b. Roadside Mechanic & 24HR Speed Repair Bay (Deprecated - superseded by TrafficManager.serviceBays AUTO_REPAIR_SHOPS at z=1200)
  buildMojaveMechanicShop() {
    return; // Inactive: Auto shop is built by TrafficManager with full gameplay, lift mechanics, and collision geometry
    const shopGroup = new THREE.Group();
    const trans = this.splineRoad.getRoadTransformAtZ(1200, 16, 0);
    if (!trans) return;
    shopGroup.position.copy(trans.pos);
    shopGroup.rotation.y = trans.heading - Math.PI * 0.48;

    // 1. Paved Driveway Apron connecting to Highway 1
    const apronGeo = new THREE.PlaneGeometry(28, 22);
    const apron = new THREE.Mesh(apronGeo, this.renderer.createToonMaterial({ color: 0x22262c }));
    apron.rotation.x = -Math.PI * 0.5;
    apron.position.set(0, 0.04, 6);
    shopGroup.add(apron);

    // 2. Yellow-Striped Service Bay Pad
    const padGeo = new THREE.PlaneGeometry(7.5, 11);
    const pad = new THREE.Mesh(padGeo, this.renderer.createToonMaterial({ color: 0x2d3748 }));
    pad.rotation.x = -Math.PI * 0.5;
    pad.position.set(-4.0, 0.06, 7);
    shopGroup.add(pad);

    // Yellow Hazard Stripes on Service Pad
    for (let s = -4; s <= 4; s++) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 6.8),
        this.matNeonYellow
      );
      stripe.rotation.x = -Math.PI * 0.5;
      stripe.rotation.z = Math.PI * 0.25;
      stripe.position.set(-4.0, 0.08, 7 + s * 1.1);
      shopGroup.add(stripe);
    }

    // 3. Hydraulic Two-Post Automotive Lift
    const liftGroup = new THREE.Group();
    liftGroup.position.set(-4.0, 0, 7);

    [-2.2, 2.2].forEach(lx => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 0.45), this.matChrome);
      post.position.set(lx, 2.1, 0);
      post.castShadow = true;
      liftGroup.add(post);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.22), this.matNeonYellow);
      arm.position.set(lx > 0 ? lx - 0.7 : lx + 0.7, 0.85, 0);
      liftGroup.add(arm);
    });

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.35), this.matChrome);
    crossBeam.position.set(0, 4.2, 0);
    liftGroup.add(crossBeam);
    shopGroup.add(liftGroup);

    // 4. Main Garage & Workshop Building (Procedural Industrial Architecture)
    const building = this.structureBuilder.buildWarehouseOrBarn({
      width: 24.0,
      depth: 14.0,
      height: 6.8,
      colorWall: 0xd97706, // Desert Ochre / Amber Steel
      colorRoof: 0x475569, // Weathered Tin
      colorTrim: 0x1e293b,
      subterraneanDepth: 3.5
    });
    building.position.set(0, 0, -5.5);
    shopGroup.add(building);


    // Roll-Up Service Bay Doors
    [-5.5, 5.5].forEach(rx => {
      const door = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 4.8), this.matChrome);
      door.position.set(rx, 2.4, 1.55);
      shopGroup.add(door);

      for (let sl = 0; sl < 8; sl++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.08, 0.04), this.matDarkTrim);
        slat.position.set(rx, 0.6 + sl * 0.55, 1.58);
        shopGroup.add(slat);
      }
    });

    // 5. Illuminated Neon Sign: "MECHANIC / 24HR SPEED REPAIR"
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(16, 2.4, 0.5), this.matDarkTrim);
    signBoard.position.set(0, 8.2, -5.0);
    shopGroup.add(signBoard);

    const signNeonTop = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.7), this.matNeonGreen);
    signNeonTop.position.set(0, 8.6, -5.0);
    shopGroup.add(signNeonTop);

    const signNeonBot = new THREE.Mesh(new THREE.BoxGeometry(10, 0.45, 0.7), this.matNeonCyan);
    signNeonBot.position.set(0, 7.7, -5.0);
    shopGroup.add(signNeonBot);

    // 6. Roadside Props: Tire Racks, Tool Cabinets, Oil Drums
    const rack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 0.8), this.matDarkTrim);
    rack.position.set(7.5, 1.2, 5.0);
    shopGroup.add(rack);

    for (let t = 0; t < 6; t++) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10), this.matTire);
      tire.rotation.z = Math.PI * 0.5;
      tire.position.set(6.2 + (t % 3) * 1.1, t < 3 ? 0.6 : 1.7, 5.0);
      shopGroup.add(tire);
    }

    const toolChest = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.8), this.matDinerRed);
    toolChest.position.set(-8.5, 0.7, 4.5);
    shopGroup.add(toolChest);

    [-7.8, -8.6, -9.2].forEach((ox, idx) => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 10), this.renderer.createToonMaterial({ color: 0x1d4ed8 }));
      drum.position.set(ox, 0.55, 6.0 + (idx % 2) * 0.4);
      shopGroup.add(drum);
    });

    this.group.add(shopGroup);
  }

  // 4. Elmer's Bottle Tree Ranch / Desert Folk Art (z=600)
  buildElmersBottleTreeRanch() {
    const ranch = new THREE.Group();
    ranch.name = 'Scenic_ElmersBottleTreeRanch';
    const trans = this.splineRoad.getRoadTransformAtZ(600, -34.0, 0);
    ranch.position.copy(trans.pos);
    ranch.rotation.y = trans.heading + 0.2;

    // Rustic Wood Entrance Arch
    const woodGeoms = [];
    const bottleGeoms = [[], [], [], []]; // blue, green, amber, red
    const bottleMats = [this.matBottleBlue, this.matBottleGreen, this.matBottleAmber, this.matBottleRed];

    [-6, 6].forEach(px => {
      const g = new THREE.BoxGeometry(0.4, 6.0, 0.4).toNonIndexed();
      g.translate(px, 3.0, 0);
      woodGeoms.push(g);
    });
    const headerGeo = new THREE.BoxGeometry(13.2, 0.8, 0.4).toNonIndexed();
    headerGeo.translate(0, 5.8, 0);
    woodGeoms.push(headerGeo);

    const treeOffsets = [
      [-7, -6], [-2, -8], [4, -7], [8, -5],
      [-5, -12], [0, -14], [6, -12]
    ];

    treeOffsets.forEach((pos, treeIdx) => {
      const treeH = 4.8 + ((treeIdx * 0.37) % 2.0);
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, treeH, 6).toNonIndexed();
      trunkGeo.translate(pos[0], treeH * 0.5, pos[1]);
      woodGeoms.push(trunkGeo);

      const BRANCH_TIERS = 5;
      for (let b = 0; b < BRANCH_TIERS; b++) {
        const by = 1.2 + b * 0.9;
        const branchAngles = [0, 1.26, 2.51, 3.77, 5.03];
        branchAngles.forEach((angle, aIdx) => {
          const m = new THREE.Matrix4();
          m.makeRotationY(angle);
          m.multiply(new THREE.Matrix4().makeRotationZ(Math.PI * 0.42));
          m.setPosition(pos[0] + Math.cos(angle) * 0.55, by, pos[1] + Math.sin(angle) * 0.55);

          const branchGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.3, 4).toNonIndexed();
          branchGeo.applyMatrix4(m);
          woodGeoms.push(branchGeo);

          const colorIdx = (treeIdx + b + aIdx) % 4;
          const bm = new THREE.Matrix4();
          bm.makeRotationY(angle);
          bm.multiply(new THREE.Matrix4().makeRotationZ(Math.PI * 0.42));
          bm.setPosition(pos[0] + Math.cos(angle) * 1.2, by + 0.1, pos[1] + Math.sin(angle) * 1.2);

          const bottleGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.55, 6).toNonIndexed();
          bottleGeo.applyMatrix4(bm);
          bottleGeoms[colorIdx].push(bottleGeo);
        });
      }
    });

    if (woodGeoms.length > 0) {
      const mergedWood = mergeGeometries(woodGeoms, false);
      if (mergedWood) {
        const woodMesh = new THREE.Mesh(mergedWood, this.matWoodPole);
        woodMesh.castShadow = false;
        woodMesh.receiveShadow = true;
        ranch.add(woodMesh);
      }
    }

    bottleMats.forEach((mat, idx) => {
      const geoms = bottleGeoms[idx];
      if (geoms.length > 0) {
        const mergedBottle = mergeGeometries(geoms, false);
        if (mergedBottle) {
          const bottleMesh = new THREE.Mesh(mergedBottle, mat);
          ranch.add(bottleMesh);
        }
      }
    });

    this.group.add(ranch);
  }

  // 5. Vintage Route 66 Roadside Highway Billboards
  buildVintageHighwayBillboards() {
    const billboardConfigs = [
      { z: 380, lat: 26, title: 'ROUTE 66', sub: 'THE MOTHER ROAD', accent: '#e63946' },
      { z: 1100, lat: -28, title: 'CABAZON DINOS', sub: 'GIFT SHOP & MUSEUM', accent: '#e76f51' },
      { z: 1900, lat: 28, title: 'ROY\'S MOTEL', sub: 'AIR CONDITIONED CABINS', accent: '#2a9d8f' },
    ];

    billboardConfigs.forEach(b => {
      const trans = this.splineRoad.getRoadTransformAtZ(b.z, b.lat, 0);
      const boardGroup = new THREE.Group();
      boardGroup.name = 'Scenic_Billboard_' + b.title.replace(/[^a-zA-Z0-9]/g, '_');
      boardGroup.position.copy(trans.pos);
      boardGroup.position.y += 0.8; // Elevate above level terrain pad
      boardGroup.rotation.y = trans.heading + (b.lat > 0 ? -0.62 : 0.62); // Angled ~36° inward toward highway traffic lanes

      // Heavy timber A-frame support posts
      [-4.0, 4.0].forEach(px => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 12, 0.4), this.matWoodPole);
        post.position.set(px, 5.5, 0);
        post.castShadow = true;
        boardGroup.add(post);

        const diagonalBrace = new THREE.Mesh(new THREE.BoxGeometry(0.3, 10.5, 0.3), this.matWoodPole);
        diagonalBrace.position.set(px, 4.8, 2.2);
        diagonalBrace.rotation.x = 0.45;
        boardGroup.add(diagonalBrace);
      });

      // Billboard Graphic Board (Both front and back textured so oncoming drivers see full art)
      const bTex = this.renderer.textures.retroBillboard(b.title, b.sub, b.accent);
      const bMat = new THREE.MeshBasicMaterial({ map: bTex });
      const bMats = [
        this.matWoodSignBrown,
        this.matWoodSignBrown,
        this.matWoodSignBrown,
        this.matWoodSignBrown,
        bMat,
        bMat
      ];
      const board = new THREE.Mesh(new THREE.BoxGeometry(10, 5.5, 0.3), bMats);
      board.name = 'Scenic_BillboardBoard_' + b.title.replace(/[^a-zA-Z0-9]/g, '_');
      board.position.set(0, 8.8, 0);
      board.castShadow = true;
      boardGroup.add(board);

      this.group.add(boardGroup);
    });
  }

  // 6. Telegraph Poles with Sagging Overhead Wire Lines (skip z=1150..1280 to keep arch clear)
  buildPowerPolesWithWires() {
    const POLE_COUNT = 27;
    const polePositions = [];
    const mainPoleMatrices = [];
    const crossArmMatrices = [];
    const insulatorMatrices = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < POLE_COUNT; i++) {
      const z = 350 + i * 85;
      if (z > 1140 && z < 1270) continue; // Keep arch corridor clear

      const transform = this.splineRoad.getRoadTransformAtZ(z, -19.5, 0);
      const poleQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);

      // Main pole: position transform.pos + local (0, 5.5, 0) rotated by poleQuat
      dummy.position.copy(transform.pos).add(new THREE.Vector3(0, 5.5, 0).applyQuaternion(poleQuat));
      dummy.quaternion.copy(poleQuat);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mainPoleMatrices.push(dummy.matrix.clone());

      // Crossarm: local (0, 12.2, 0)
      dummy.position.copy(transform.pos).add(new THREE.Vector3(0, 12.2, 0).applyQuaternion(poleQuat));
      dummy.quaternion.copy(poleQuat);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      crossArmMatrices.push(dummy.matrix.clone());

      // Insulators
      [-1.6, 0, 1.6].forEach(ix => {
        dummy.position.copy(transform.pos).add(new THREE.Vector3(ix, 12.5, 0).applyQuaternion(poleQuat));
        dummy.quaternion.copy(poleQuat);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        insulatorMatrices.push(dummy.matrix.clone());
      });

      const worldCrossPos = transform.pos.clone().add(new THREE.Vector3(0, 12.5, 0));
      polePositions.push({ pos: worldCrossPos, z });
    }

    if (mainPoleMatrices.length > 0) {
      const poleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 15, 6), this.matWoodPole, mainPoleMatrices.length);
      poleMesh.name = 'Instanced_TelegraphPoles';
      for (let i = 0; i < mainPoleMatrices.length; i++) poleMesh.setMatrixAt(i, mainPoleMatrices[i]);
      poleMesh.instanceMatrix.needsUpdate = true;
      poleMesh.castShadow = true;
      this.group.add(poleMesh);

      const crossMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(3.6, 0.22, 0.22), this.matWoodPole, crossArmMatrices.length);
      crossMesh.name = 'Instanced_TelegraphCrossarms';
      for (let i = 0; i < crossArmMatrices.length; i++) crossMesh.setMatrixAt(i, crossArmMatrices[i]);
      crossMesh.instanceMatrix.needsUpdate = true;
      this.group.add(crossMesh);

      const insMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 5), this.matBottleGreen, insulatorMatrices.length);
      insMesh.name = 'Instanced_TelegraphInsulators';
      for (let i = 0; i < insulatorMatrices.length; i++) insMesh.setMatrixAt(i, insulatorMatrices[i]);
      insMesh.instanceMatrix.needsUpdate = true;
      this.group.add(insMesh);
    }

    // Connect poles with smooth catenary sagging wire curves merged into a single LineSegments draw call
    const wireSegmentPositions = [];
    for (let i = 0; i < polePositions.length - 1; i++) {
      const p1 = polePositions[i];
      const p2 = polePositions[i + 1];
      if (Math.abs(p2.z - p1.z) > 160) continue;

      [-1.4, 0, 1.4].forEach(offset => {
        const curve = new THREE.QuadraticBezierCurve3(
          p1.pos.clone().add(new THREE.Vector3(offset, 0, 0)),
          p1.pos.clone().lerp(p2.pos, 0.5).add(new THREE.Vector3(offset, -1.8, 0)),
          p2.pos.clone().add(new THREE.Vector3(offset, 0, 0))
        );
        const pts = curve.getPoints(10);
        for (let j = 0; j < pts.length - 1; j++) {
          wireSegmentPositions.push(pts[j].x, pts[j].y, pts[j].z);
          wireSegmentPositions.push(pts[j + 1].x, pts[j + 1].y, pts[j + 1].z);
        }
      });
    }

    if (wireSegmentPositions.length > 0) {
      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wireSegmentPositions, 3));
      wireGeo.computeBoundingSphere();
      const wireMesh = new THREE.LineSegments(wireGeo, this.matUtilityWire);
      wireMesh.name = 'Scenic_DesertTelegraphWires';
      this.group.add(wireMesh);
    }
  }

  // 7. Desert Boulders along the desert floor (positioned to never block roadside landmarks)
  buildDesertBoulders() {
    const rockGeo = new THREE.DodecahedronGeometry(2.4, 1);
    const matrices = [];
    const dummy = new THREE.Object3D();

    for (let r = 0; r < 120; r++) {
      const z = 340 + r * 18.5 + (Math.random() - 0.5) * 12;
      const side = (r % 2 === 0) ? 1 : -1;
      const latOffset = side * (24.0 + Math.random() * 38);

      // Skip spawning within landmark view corridors and Coyote Ridge trail corridor
      if ((z > 330 && z < 440 && side < 0) || (z > 680 && z < 820) || (z > 930 && z < 1190 && side < 0) || (z > 1140 && z < 1280) || (z > 1480 && z < 1620) || (z > 2220 && z < 2380)) {
        continue;
      }
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      dummy.position.copy(transform.pos);
      dummy.position.y += 1.4;
      const s = 0.7 + Math.random() * 1.1;
      dummy.scale.set(s * 1.3, s * 0.8, s * 1.1);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();

      matrices.push(dummy.matrix.clone());
    }

    if (matrices.length > 0) {
      const instancedBoulders = new THREE.InstancedMesh(rockGeo, this.matDesertBoulder, matrices.length);
      instancedBoulders.name = 'Instanced_DesertBoulders';
      for (let i = 0; i < matrices.length; i++) {
        instancedBoulders.setMatrixAt(i, matrices[i]);
      }
      instancedBoulders.instanceMatrix.needsUpdate = true;
      instancedBoulders.castShadow = true;
      this.group.add(instancedBoulders);
    }
  }

  // 8. Mojave Wind Turbine Farm
  buildWindFarm() {
    const turbineSpots = [
      { lat: 70, z: 450, h: 48 },
      { lat: 95, z: 900, h: 54 },
      { lat: 75, z: 1350, h: 46 },
      { lat: 105, z: 1800, h: 56 },
      { lat: 80, z: 2250, h: 50 },
    ];

    turbineSpots.forEach(t => {
      const transform = this.splineRoad.getRoadTransformAtZ(t.z, t.lat, 0);
      const turbine = new THREE.Group();
      turbine.position.copy(transform.pos);
      turbine.rotation.y = transform.heading;

      const foundation = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, 5, 8), this.matTinRoof);
      foundation.position.y = 0;
      turbine.add(foundation);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.0, t.h, 8), this.matTurbineWhite);
      tower.position.y = t.h * 0.5;
      tower.castShadow = true;
      turbine.add(tower);

      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 5.0), this.matTurbineWhite);
      nacelle.position.set(0, t.h, 0);
      turbine.add(nacelle);

      const rotor = new THREE.Group();
      rotor.position.set(0, t.h, 2.6);

      const noseGeo = new THREE.ConeGeometry(1.1, 2.2, 8);
      noseGeo.rotateX(Math.PI * 0.5);
      const nose = new THREE.Mesh(noseGeo, this.matTurbineWhite);
      rotor.add(nose);

      const bladeGeo = new THREE.BoxGeometry(0.7, 20, 0.16);
      bladeGeo.translate(0, 10, 0);

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(bladeGeo, this.matTurbineWhite);
        blade.rotation.z = (b / 3) * Math.PI * 2;
        rotor.add(blade);
      }

      turbine.add(rotor);
      this.animatedObjects.push({ obj: rotor, rotZ: 0.024 + Math.random() * 0.012 });

      this.group.add(turbine);
    });
  }

  // 9. Desert Prospector Shacks
  buildProspectorCabins() {
    const shacks = [
      { lat: 34, z: 550, rot: Math.PI * 0.5 - 0.2 },
      { lat: -38, z: 1850, rot: -Math.PI * 0.5 + 0.3 }
    ];

    shacks.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, s.lat, 0);
      const cabin = this.structureBuilder.buildHistoricLodge({
        width: 10.0,
        depth: 8.0,
        stories: 1,
        colorStone: 0x6e523b,
        colorTimber: 0x4e3e30,
        colorRoof: 0x7a8694,
        subterraneanDepth: 3.0
      });
      cabin.position.copy(transform.pos);
      cabin.rotation.y = transform.heading + s.rot;
      this.group.add(cabin);
    });
  }


  // 10. Half-Buried Rusted Muscle Car Wrecks in Dunes
  buildRustedCarWrecks() {
    const wrecks = [
      { lat: 26, z: 400, rot: 0.6 },
      { lat: -28, z: 1400, rot: -0.8 },
      { lat: 30, z: 2150, rot: 1.2 }
    ];

    wrecks.forEach(w => {
      const transform = this.splineRoad.getRoadTransformAtZ(w.z, w.lat, 0);
      const car = new THREE.Group();
      car.position.copy(transform.pos);
      car.rotation.y = transform.heading + w.rot;

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 4.4), this.matRustWreck);
      body.position.y = 0.3;
      body.castShadow = true;
      car.add(body);

      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.9), this.matRustWreck);
      cab.position.set(0, 1.15, -0.2);
      car.add(cab);

      this.group.add(car);
    });
  }

  // 10b. Route 66 Cadillac Ranch Art Installation (Z = 4100m, X = -36m)
  // 6 Vintage American cruisers half-buried nose-down at 45° with vibrant multi-colored graffiti layers
  buildCadillacRanchArtInstallation() {
    const t = this.splineRoad.getRoadTransformAtZ(4100, -36, 0);
    const ranchGroup = new THREE.Group();
    ranchGroup.position.copy(t.pos);
    ranchGroup.rotation.y = t.heading;

    const matGravelApron = this.renderer.createToonMaterial({ color: 0xc8b293, gradientBands: 2 });
    const matTimberSign = this.renderer.createToonMaterial({ color: 0x543d2b, gradientBands: 2 });
    const matTailLight = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const matUnderChassis = this.renderer.createToonMaterial({ color: 0x27272a, gradientBands: 2 });

    // 1. Gravel Turnout Viewing Ground Pad (22m wide x 38m long)
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(22, 38), matGravelApron);
    pad.rotateX(-Math.PI * 0.5);
    pad.position.set(2, 0.05, 0);
    ranchGroup.add(pad);

    // 2. Six Tailfin Cruisers Half-Buried at 45° Angle in the Desert Sand
    const carColors = [
      0xf43f5e, // Hot Rose/Pink
      0x06b6d4, // Electric Turquoise
      0x84cc16, // Lime Green
      0xa855f7, // Vivid Neon Purple
      0xfacc15, // Golden Amarillo Yellow
      0xf97316  // Mojave Sunset Orange
    ];

    const dripColors = [
      0x06b6d4, 0xfacc15, 0xf43f5e, 0x84cc16, 0x3b82f6, 0xec4899
    ];

    carColors.forEach((col, idx) => {
      const carZ = -14 + idx * 5.6;
      const carGroup = new THREE.Group();
      carGroup.position.set(-2.0, 0, carZ);

      // Pitch nose-down at authentic 45-degree angle
      carGroup.rotation.z = Math.PI * 0.25;

      const matBody = this.renderer.createToonMaterial({ color: col, gradientBands: 3, rimColor: 0xffffff, rimPower: 2.2 });
      const matDrip = new THREE.MeshBasicMaterial({ color: dripColors[idx] });

      // Main Cruiser Body (half submerged)
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 5.2), matBody);
      carBody.position.set(0, 1.4, 0);
      carBody.castShadow = true;
      carGroup.add(carBody);

      // Distinctive 1959-Style Exaggerated Rear Tailfins
      [-1.12, 1.12].forEach(fx => {
        const finGeo = new THREE.ConeGeometry(0.35, 1.6, 4);
        finGeo.rotateZ(Math.PI * 0.5);
        const fin = new THREE.Mesh(finGeo, matBody);
        fin.position.set(fx, 2.3, -1.8);
        carGroup.add(fin);

        // Chrome bullet rocket taillight on fin tip
        const bulletLight = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), matTailLight);
        bulletLight.rotateX(-Math.PI * 0.5);
        bulletLight.position.set(fx, 2.8, -1.8);
        carGroup.add(bulletLight);
      });

      // Contrasting Graffiti Drip Splashes on Trunk
      const dripSplat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), matDrip);
      dripSplat.position.set(0, 2.05, -0.6);
      carGroup.add(dripSplat);

      // Exposed Rear Undercarriage, Differential & Axle Tube
      const diffMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), matUnderChassis);
      diffMesh.position.set(0, 0.7, -1.2);
      carGroup.add(diffMesh);

      const axleTube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), matUnderChassis);
      axleTube.rotateZ(Math.PI * 0.5);
      axleTube.position.set(0, 0.7, -1.2);
      carGroup.add(axleTube);

      // Chrome Dual Exhaust Tips pointing to sky
      [-0.6, 0.6].forEach(ex => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), this.matChrome);
        pipe.rotateX(Math.PI * 0.5);
        pipe.position.set(ex, 0.85, -2.4);
        carGroup.add(pipe);
      });

      ranchGroup.add(carGroup);

      // Scatter authentic colorful spray paint cans on the sand nearby
      [-1, 1].forEach(side => {
        const canMat = new THREE.MeshBasicMaterial({ color: dripColors[(idx + side + 6) % 6] });
        const sprayCan = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 6), canMat);
        sprayCan.position.set(2.5 + side * 0.8, 0.1, carZ + side * 0.5);
        sprayCan.rotation.z = side * 1.2;
        ranchGroup.add(sprayCan);
      });
    });

    // 3. Weathered Wooden Post-and-Rail Fence Along Highway Edge
    for (let fz = -18; fz <= 18; fz += 4.5) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), matTimberSign);
      post.position.set(10.5, 0.6, fz);
      ranchGroup.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 36), matTimberSign);
    rail.position.set(10.5, 0.9, 0);
    ranchGroup.add(rail);

    // 4. Iconic Route 66 "Cadillac Ranch" Roadside Wooden Sign
    const signPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.8, 6), matTimberSign);
    signPostL.position.set(7.5, 1.9, 14);
    ranchGroup.add(signPostL);
    const signPostR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.8, 6), matTimberSign);
    signPostR.position.set(7.5, 1.9, 10);
    ranchGroup.add(signPostR);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 4.8), matTimberSign);
    signBoard.position.set(7.5, 2.7, 12);
    ranchGroup.add(signBoard);

    // Multi-color graffiti text band
    const signText = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 4.4),
      new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    signText.position.set(7.52, 2.7, 12);
    ranchGroup.add(signText);

    this.group.add(ranchGroup);
  }

  // 11. Route 66 Road Shields Painted On Asphalt across both lanes
  buildRoute66RoadShields() {
    const shieldTex = this.renderer.textures.route66Shield(256);
    const shieldMat = new THREE.MeshBasicMaterial({ map: shieldTex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

    [380, 650, 950, 1300, 1650, 2000, 2350, 2550].forEach(z => {
      [-5.5, 5.5].forEach(laneX => {
        const transform = this.splineRoad.getRoadTransformAtZ(z, laneX, 0.16);
        const shield = new THREE.Group();
        shield.position.copy(transform.pos);
        shield.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);

        const baseGeo = new THREE.PlaneGeometry(3.6, 4.4);
        baseGeo.rotateX(-Math.PI * 0.5);
        shield.add(new THREE.Mesh(baseGeo, shieldMat));

        this.group.add(shield);
      });
    });
  }

  // 12. Roy's Motel Neon Sign, Cafe & Bungalows (z=6300)
  buildRoysMotelSign() {
    const transform = this.splineRoad.getRoadTransformAtZ(6300, 36, 0);
    const roys = new THREE.Group();
    roys.position.copy(transform.pos);
    // Face across the road, angled toward oncoming traffic
    roys.rotation.y = transform.heading - Math.PI * 0.5 - 0.25;

    // Iconic leaning pylon
    const pylonGroup = new THREE.Group();
    pylonGroup.rotation.z = -Math.PI * 0.105;
    roys.add(pylonGroup);

    const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 26, 1.2), this.matNeonYellow);
    pylon.position.set(0, 13, 0);
    pylon.castShadow = true;
    pylonGroup.add(pylon);

    // "ROY'S" red blade at top
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 0.8), this.matNeonRed);
    signBox.position.set(0, 23.5, 0);
    signBox.castShadow = true;
    pylonGroup.add(signBox);

    const signInset = new THREE.Mesh(new THREE.BoxGeometry(7.4, 3.6, 0.9), new THREE.MeshBasicMaterial({ color: 0xfff6e8 }));
    signInset.position.set(0, 23.5, 0);
    pylonGroup.add(signInset);

    const letterBar = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.6, 1.0), this.matNeonRed);
    letterBar.position.set(0, 23.5, 0);
    pylonGroup.add(letterBar);

    // "MOTEL / CAFE / GAS" cyan blade lower on the pylon
    const motelSign = new THREE.Mesh(new THREE.BoxGeometry(7, 1.8, 0.6), this.matNeonCyan);
    motelSign.position.set(0, 18.5, 0);
    pylonGroup.add(motelSign);

    // Signature Googie STARBURST
    const starburst = new THREE.Group();
    starburst.position.set(0, 6.5, 0);
    pylonGroup.add(starburst);

    const poleMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
    const POLES = 14;
    for (let i = 0; i < POLES; i++) {
      const angle = -Math.PI * 0.62 + (i / (POLES - 1)) * Math.PI * 1.05;
      const len = 7 + Math.sin((i / (POLES - 1)) * Math.PI) * 4.5;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 5), poleMat);
      pole.position.set(Math.cos(angle) * len * 0.5, Math.sin(angle) * len * 0.5, 0);
      pole.rotation.z = angle - Math.PI / 2;
      starburst.add(pole);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 6, 5),
        i % 2 === 0 ? this.matNeonRed : this.matNeonCyan
      );
      tip.position.set(Math.cos(angle) * len, Math.sin(angle) * len, 0);
      starburst.add(tip);
    }

    // Roy's Iconic 1950s Cafe
    const cafe = this.structureBuilder.buildRoadsideDinerOrMotel({
      width: 14.0,
      depth: 9.0,
      colorStucco: 0xfaf5eb,
      colorTrim: 0xd92d3a,
      colorAccent: 0x0284c7,
      subterraneanDepth: 3.0
    });
    cafe.position.set(16.0, 0, 0);
    roys.add(cafe);

    // Motel cabins row behind the courtyard
    for (let c = 0; c < 4; c++) {
      const cabin = this.structureBuilder.buildCoastalCottage({
        width: 7.2,
        depth: 6.0,
        height: 3.8,
        colorSiding: 0xd9c49a,
        colorRoof: 0x8a4b2a,
        colorTrim: 0xffffff,
        subterraneanDepth: 2.5
      });
      cabin.position.set(-16 + c * 8.5, 0, -10);
      roys.add(cabin);
    }

    this.group.add(roys);
  }



  // 13. Rich Multi-Species Desert Flora (Clear sight lines to roadside attractions) - Instanced for 60 FPS
  buildDetailedFlora() {
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const parentDummy = new THREE.Object3D();
    const childDummy = new THREE.Object3D();
    const worldMatrix = new THREE.Matrix4();

    // A. Multi-Armed Saguaro Cacti
    const saguaroTrunkMatrices = [];
    const saguaroArmOut1Matrices = [];
    const saguaroArmUp1Matrices = [];
    const saguaroArmOut2Matrices = [];
    const saguaroArmUp2Matrices = [];

    const saguaroTrunkGeo = new THREE.CylinderGeometry(0.42, 0.52, 1.0, 8);
    const saguaroArmOut1Geo = new THREE.BoxGeometry(2.0, 0.45, 0.45);
    const saguaroArmUp1Geo = new THREE.CylinderGeometry(0.35, 0.38, 2.8, 7);
    const saguaroArmOut2Geo = new THREE.BoxGeometry(1.8, 0.42, 0.42);
    const saguaroArmUp2Geo = new THREE.CylinderGeometry(0.34, 0.36, 2.4, 7);

    const saguaroCount = isMobile ? 75 : 150;
    for (let i = 0; i < saguaroCount; i++) {
      const z = 340 + Math.random() * 2210;
      const side = Math.random() > 0.5 ? 1 : -1;
      const latOffset = side * (20.0 + Math.random() * 45);
      if ((z > 700 && z < 800) || (z > 940 && z < 1180 && side < 0) || (z > 1500 && z < 1600) || (z > 2250 && z < 2350)) continue;
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      parentDummy.position.copy(transform.pos);
      parentDummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      parentDummy.scale.set(1, 1, 1);
      parentDummy.updateMatrix();

      const h = 5.5 + Math.random() * 4.5;
      const totalH = h + 1.5;

      // Trunk
      childDummy.position.set(0, totalH * 0.5 - 0.8, 0);
      childDummy.rotation.set(0, 0, 0);
      childDummy.scale.set(1, totalH, 1);
      childDummy.updateMatrix();
      worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
      saguaroTrunkMatrices.push(worldMatrix.clone());

      // Arm 1 (Left)
      if (Math.random() > 0.25) {
        const arm1H = h * (0.4 + Math.random() * 0.25);
        childDummy.position.set(-1.1, arm1H, 0);
        childDummy.rotation.set(0, 0, 0);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
        saguaroArmOut1Matrices.push(worldMatrix.clone());

        childDummy.position.set(-2.0, arm1H + 1.4, 0);
        childDummy.rotation.set(0, 0, 0);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
        saguaroArmUp1Matrices.push(worldMatrix.clone());
      }

      // Arm 2 (Right, at different height)
      if (Math.random() > 0.4) {
        const arm2H = h * (0.55 + Math.random() * 0.25);
        childDummy.position.set(1.0, arm2H, 0);
        childDummy.rotation.set(0, 0, 0);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
        saguaroArmOut2Matrices.push(worldMatrix.clone());

        childDummy.position.set(1.8, arm2H + 1.2, 0);
        childDummy.rotation.set(0, 0, 0);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
        saguaroArmUp2Matrices.push(worldMatrix.clone());
      }
    }

    const addInstanced = (geo, mat, matrices, name, castShadow = true) => {
      if (!matrices || matrices.length === 0) return;
      const mesh = new THREE.InstancedMesh(geo, mat, matrices.length);
      mesh.name = name;
      for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = castShadow;
      this.group.add(mesh);
    };

    addInstanced(saguaroTrunkGeo, this.matSaguaro, saguaroTrunkMatrices, 'Instanced_SaguaroTrunk', false);
    addInstanced(saguaroArmOut1Geo, this.matSaguaroArm, saguaroArmOut1Matrices, 'Instanced_SaguaroArmOut1', false);
    addInstanced(saguaroArmUp1Geo, this.matSaguaroArm, saguaroArmUp1Matrices, 'Instanced_SaguaroArmUp1', false);
    addInstanced(saguaroArmOut2Geo, this.matSaguaroArm, saguaroArmOut2Matrices, 'Instanced_SaguaroArmOut2', false);
    addInstanced(saguaroArmUp2Geo, this.matSaguaroArm, saguaroArmUp2Matrices, 'Instanced_SaguaroArmUp2', false);

    // B. Prickly Pear Cactus Clusters with Blossoms
    const padGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 7);
    padGeo.rotateX(Math.PI * 0.5);
    const flowerGeo = new THREE.DodecahedronGeometry(0.18, 1);
    const padMatrices = [];
    const flowerFlowerMatrices = [];
    const flowerMagentaMatrices = [];

    const pricklyCount = isMobile ? 55 : 110;
    for (let i = 0; i < pricklyCount; i++) {
      const z = 340 + Math.random() * 2200;
      const side = Math.random() > 0.5 ? 1 : -1;
      if ((z > 700 && z < 800) || (z > 920 && z < 1250 && side < 0) || (z > 1500 && z < 1600)) continue;

      const latOffset = side * (19.0 + Math.random() * 38);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      parentDummy.position.copy(transform.pos);
      parentDummy.rotation.set(0, 0, 0);
      parentDummy.scale.set(1, 1, 1);
      parentDummy.updateMatrix();

      const PAD_COUNT = 5 + Math.floor(Math.random() * 4);
      for (let p = 0; p < PAD_COUNT; p++) {
        const px = (p % 3 - 1) * 0.6 + (Math.random() - 0.5) * 0.3;
        const py = 0.4 + Math.floor(p / 3) * 0.6;
        const pz = (Math.random() - 0.5) * 0.6;
        childDummy.position.set(px, py, pz);
        childDummy.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
        padMatrices.push(worldMatrix.clone());

        if (p >= 3 && Math.random() > 0.3) {
          childDummy.position.set(px, py + 0.5, pz);
          childDummy.rotation.set(0, 0, 0);
          childDummy.scale.set(1, 1, 1);
          childDummy.updateMatrix();
          worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
          if (Math.random() > 0.5) {
            flowerFlowerMatrices.push(worldMatrix.clone());
          } else {
            flowerMagentaMatrices.push(worldMatrix.clone());
          }
        }
      }
    }

    addInstanced(padGeo, this.matPricklyPad, padMatrices, 'Instanced_PricklyPad', false);
    addInstanced(flowerGeo, this.matCactusFlower, flowerFlowerMatrices, 'Instanced_CactusFlower', false);
    addInstanced(flowerGeo, this.matCactusMagenta, flowerMagentaMatrices, 'Instanced_CactusMagenta', false);

    // C. Joshua Trees
    const jTrunkGeo = new THREE.CylinderGeometry(0.38, 0.68, 5.8, 6);
    const jBranchGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.2, 5);
    const jTuftGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const jTrunkMatrices = [];
    const jBranchMatrices = [];
    const jTuftMatrices = [];

    const joshuaCount = isMobile ? 55 : 110;
    for (let i = 0; i < joshuaCount; i++) {
      const z = 340 + Math.random() * 2200;
      const side = Math.random() > 0.5 ? 1 : -1;
      if ((z > 700 && z < 800) || (z > 920 && z < 1250 && side < 0) || (z > 1500 && z < 1600)) continue;

      const latOffset = side * (20.0 + Math.random() * 52);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      parentDummy.position.copy(transform.pos);
      parentDummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      parentDummy.scale.set(1, 1, 1);
      parentDummy.updateMatrix();

      // Trunk
      childDummy.position.set(0, 2.2, 0);
      childDummy.rotation.set(0, 0, 0);
      childDummy.scale.set(1, 1, 1);
      childDummy.updateMatrix();
      worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
      jTrunkMatrices.push(worldMatrix.clone());

      // Angled branches with spiky leaf tufts
      const BRANCH_COUNT = 3 + Math.floor(Math.random() * 3);
      for (let b = 0; b < BRANCH_COUNT; b++) {
        const bAngle = (b / BRANCH_COUNT) * Math.PI * 2;
        childDummy.position.set(Math.cos(bAngle) * 0.7, 4.8, Math.sin(bAngle) * 0.7);
        childDummy.rotation.set(0, bAngle, 0.6);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
        jBranchMatrices.push(worldMatrix.clone());

        childDummy.position.set(Math.cos(bAngle) * 1.6, 5.8, Math.sin(bAngle) * 1.6);
        childDummy.rotation.set(0, 0, 0);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        worldMatrix.multiplyMatrices(parentDummy.matrix, childDummy.matrix);
        jTuftMatrices.push(worldMatrix.clone());
      }
    }

    addInstanced(jTrunkGeo, this.matJoshuaTrunk, jTrunkMatrices, 'Instanced_JoshuaTrunk', true);
    addInstanced(jBranchGeo, this.matJoshuaTrunk, jBranchMatrices, 'Instanced_JoshuaBranch', false);
    addInstanced(jTuftGeo, this.matJoshuaTuft, jTuftMatrices, 'Instanced_JoshuaTuft', false);

    // D. Sagebrush and Desert Gold Marigolds
    const sageGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const marigoldGeo = new THREE.DodecahedronGeometry(0.4, 1);
    const sageMatrices = [];
    const marigoldMatrices = [];

    const sageCount = isMobile ? 85 : 180;
    for (let i = 0; i < sageCount; i++) {
      const z = 340 + Math.random() * 2220;
      const side = Math.random() > 0.5 ? 1 : -1;
      if (z > 920 && z < 1250 && side < 0) continue;
      const latOffset = side * (19.5 + Math.random() * 42);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const rad = 0.95 + Math.random() * 0.6;
      childDummy.position.copy(transform.pos);
      childDummy.position.y += 0.2;
      childDummy.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, 0);
      childDummy.scale.set(rad * 1.4, rad * 0.75, rad * 1.2);
      childDummy.updateMatrix();
      sageMatrices.push(childDummy.matrix.clone());

      if (Math.random() > 0.6) {
        childDummy.position.copy(transform.pos);
        childDummy.position.x += (Math.random() - 0.5) * 1.8;
        childDummy.position.y += 0.25;
        childDummy.rotation.set(0, Math.random() * Math.PI, 0);
        childDummy.scale.set(1, 1, 1);
        childDummy.updateMatrix();
        marigoldMatrices.push(childDummy.matrix.clone());
      }
    }

    addInstanced(sageGeo, this.matSagebrush, sageMatrices, 'Instanced_Sagebrush', false);
    addInstanced(marigoldGeo, this.matMarigold, marigoldMatrices, 'Instanced_Marigold', false);
  }

  buildTumbleweeds() {
    this.tumbleweeds = [];
  }

  // 15. Wigwam Motel — 19 Teepee Cabins in Horseshoe Arc (Z=1250m, X=+36)
  buildWigwamMotelCottages() {
    const baseT = this.splineRoad.getRoadTransformAtZ(1250, 36, 0);
    const motel = new THREE.Group();
    motel.position.copy(baseT.pos);
    motel.rotation.y = baseT.heading - 0.25;

    // Gravel horseshoe courtyard
    const gravel = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), this.matDesertGravel);
    gravel.rotateX(-Math.PI * 0.5);
    gravel.position.set(0, 0.04, 0);
    motel.add(gravel);

    // 19 Teepees arranged in a horseshoe arc
    const numTeepees = 19;
    for (let i = 0; i < numTeepees; i++) {
      const angle = (i / (numTeepees - 1)) * Math.PI * 0.95 - Math.PI * 0.475;
      const radius = 18;
      const tx = Math.sin(angle) * radius;
      const tz = -Math.cos(angle) * radius * 0.65;

      const teepee = new THREE.Group();
      teepee.position.set(tx, 0, tz);

      // Main cone structure
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3.5, 7.5, 8), this.matWigwamWhite);
      cone.position.y = 3.75;
      cone.castShadow = true;
      teepee.add(cone);

      // Zig-zag / stripe band near bottom
      const band = new THREE.Mesh(new THREE.ConeGeometry(3.55, 1.2, 8), this.matWigwamStripe);
      band.position.y = 2.0;
      teepee.add(band);

      // Small door cutout
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x3a2215 }));
      door.position.set(0, 1.0, 3.2);
      teepee.add(door);

      // Vintage car parked beside every other teepee
      if (i % 2 === 0) {
        const carCol = [0x2563eb, 0xdc2626, 0x16a34a, 0xf59e0b, 0x475569][(i / 2) % 5];
        const car = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 4.2),
          this.renderer.createToonMaterial({ color: carCol, gradientBands: 2 }));
        car.position.set(tx > 0 ? 3.5 : -3.5, 0.7, 0);
        teepee.add(car);
      }

      motel.add(teepee);
    }

    // "WIGWAM MOTEL" Neon sign
    const signT = this.splineRoad.getRoadTransformAtZ(1235, 22, 0);
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), this.matWoodPole);
    signPost.position.set(signT.pos.x, signT.pos.y + 3, signT.pos.z);
    this.group.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 0.3),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    signBoard.position.set(signT.pos.x, signT.pos.y + 6.5, signT.pos.z);
    this.group.add(signBoard);
    const signNeon = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.7, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff }));
    signNeon.position.set(signT.pos.x, signT.pos.y + 6.5, signT.pos.z + 0.1);
    this.group.add(signNeon);

    this.group.add(motel);
  }

  // 16. Desert Hills Premium Outlets Mall (Z=5150m, X=+36)
  buildDesertHillsOutletMall() {
    const transform = this.splineRoad.getRoadTransformAtZ(5150, 36, 0);
    const mall = new THREE.Group();
    mall.position.copy(transform.pos);
    // Face across the road toward oncoming traffic
    mall.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;

    // Mediterranean Stucco Market Arcade
    const mainArcade = this.structureBuilder.buildMarketArcade({
      width: 65.0,
      depth: 16.0,
      stories: 2,
      storyHeight: 4.2,
      colorBrick: 0xe2d6c3,
      colorTrim: 0xb04a28,
      subterraneanDepth: 3.5
    });
    mall.add(mainArcade);

    // Large Parking Lot with palm islands
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), this.matAsphaltLot);
    lot.rotateX(-Math.PI * 0.5);
    lot.position.set(0, 0.04, 38);
    mall.add(lot);

    // Parking lines
    const matStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let r = 0; r < 3; r++) {
      for (let s = 0; s < 14; s++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 5.5), matStripe);
        stripe.rotateX(-Math.PI * 0.5);
        stripe.position.set(-30 + s * 4.6, 0.06, 20 + r * 14);
        mall.add(stripe);
      }
    }

    // Tall Pylon sign: "DESERT HILLS PREMIUM OUTLETS"
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.0, 16, 2.0), this.matOutletStucco);
    pylon.position.set(-36, 8, 12);
    mall.add(pylon);
    const pylonSign = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 2.4),
      this.renderer.createToonMaterial({ color: 0x1e293b, gradientBands: 2 }));
    pylonSign.position.set(-36, 14, 12);
    mall.add(pylonSign);
    const pylonNeon = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 2.6),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    pylonNeon.position.set(-36, 14, 12);
    mall.add(pylonNeon);

    this.group.add(mall);
  }

  // 17. Vintage Gas Station & General Store (Z=2150m, X=+32)
  buildVintageGasStation() {
    const transform = this.splineRoad.getRoadTransformAtZ(2150, 32, 0);
    const station = new THREE.Group();
    station.position.copy(transform.pos);
    // Face across the road toward oncoming traffic
    station.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;


    // Authentic roadside service office
    const office = this.structureBuilder.buildRoadsideDinerOrMotel({
      width: 12.0,
      depth: 8.0,
      height: 4.6,
      colorBody: 0xf5ede0,
      colorCanopy: 0x9b2c2c,
      subterraneanDepth: 3.0
    });
    office.position.set(0, 0, -6);
    station.add(office);


    // Large tin canopy on 4 posts over pump island
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 10), this.matTinRoof);
    canopy.position.set(0, 5.2, 5);
    station.add(canopy);
    [[-6, 1], [-6, 9], [6, 1], [6, 9]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.2, 6), this.matChrome);
      post.position.set(px, 2.6, pz);
      station.add(post);
    });

    // 2 Vintage Gas Pumps
    [-3, 3].forEach(px => {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.6), this.matGasPumpRed);
      pump.position.set(px, 1.1, 5);
      station.add(pump);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      globe.position.set(px, 2.45, 5);
      station.add(globe);
    });

    // Soda vending machine
    const cokeMachine = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.8), this.matGasPumpRed);
    cokeMachine.position.set(-6.5, 1.1, -2);
    station.add(cokeMachine);

    // Asphalt apron
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(24, 22), this.matAsphaltLot);
    apron.rotateX(-Math.PI * 0.5);
    apron.position.set(0, 0.04, 2);
    station.add(apron);

    this.group.add(station);
  }

  // 18. Calico Ghost Town Historical Signage & Distant Silhouette (Z=5700m, X=+28)
  buildCalicoBoulderSignage() {
    const transform = this.splineRoad.getRoadTransformAtZ(5700, 28, 0);
    const calicoGroup = new THREE.Group();
    calicoGroup.position.copy(transform.pos);
    calicoGroup.rotation.y = transform.heading - 0.3;

    // Boulder base
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5, 1), this.matDesertBoulder);
    boulder.position.set(0, 1.5, 0);
    boulder.scale.set(1.5, 0.9, 1.2);
    calicoGroup.add(boulder);

    // Rustic wooden sign mounted on boulder
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.0, 0.35), this.matWoodSignBrown);
    signBoard.position.set(0, 3.2, 0.5);
    signBoard.castShadow = true;
    calicoGroup.add(signBoard);

    const calicoPlaque = trailSign('CALICO GHOST TOWN', 'HISTORIC 1881 SILVER MINING CAMP', 6.0, '#78350f');
    calicoPlaque.position.set(0, 3.2, 0.69);
    calicoGroup.add(calicoPlaque);

    // Distant water tower silhouette on ridge (X = +100)
    const towerT = this.splineRoad.getRoadTransformAtZ(5720, 100, 15);
    const waterTower = new THREE.Group();
    waterTower.position.copy(towerT.pos);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 6, 8), this.matWoodSignBrown);
    tank.position.y = 15;
    waterTower.add(tank);
    const tankRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.5, 8), this.matTinRoof);
    tankRoof.position.y = 19.25;
    waterTower.add(tankRoof);
    for (let leg = 0; leg < 4; leg++) {
      const angle = (leg / 4) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 13, 4), this.matWoodPole);
      p.position.set(Math.cos(angle) * 3.5, 6.5, Math.sin(angle) * 3.5);
      waterTower.add(p);
    }
    this.group.add(waterTower);

    this.group.add(calicoGroup);
  }

  // 19. Roadside Pullout Rest Aprons (Z = 480, 920, 1320, 1750)
  buildRoadsidePulloutAprons() {
    const pulloutZs = [480, 920, 1320, 1750];
    pulloutZs.forEach((z, idx) => {
      const side = (idx % 2 === 0) ? -1 : 1;
      const transform = this.splineRoad.getRoadTransformAtZ(z, side * 28, 0);
      const pullout = new THREE.Group();
      pullout.position.copy(transform.pos);
      pullout.rotation.y = transform.heading;

      // Sandy gravel paved apron
      const apron = new THREE.Mesh(new THREE.PlaneGeometry(16, 28), this.matDesertGravel);
      apron.rotateX(-Math.PI * 0.5);
      apron.position.set(0, 0.04, 0);
      pullout.add(apron);


      this.group.add(pullout);
    });
  }

  // 20. Cougar Ridge Grand 4x4 Off-Road Trail & Summit Overlook (508m expedition, Elev: 0.1m -> 56.0m)
  buildCoyoteRidgeTrail() {
    const trailGroup = new THREE.Group();
    trailGroup.name = 'CoyoteRidgeTrail';
    this.coyoteRidgeTrail = trailGroup;

    const deepTrailGroup = new THREE.Group();
    deepTrailGroup.name = 'CougarRidgeDeepTrailFeatures';
    this.deepTrailGroup = deepTrailGroup;
    trailGroup.add(deepTrailGroup);

    // Precompute 256 spine points along the entire 1,200-meter expedition route from TrailSpline
    const segments = 256;
    const spinePoints = TrailSpline.getSpinePoints(segments).map((sp) => {
      const trans = this.splineRoad.getRoadTransformAtZ(sp.z, sp.lat, 0);
      const groundY = this.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z);
      return {
        t: sp.t,
        lat: sp.lat,
        z: sp.z,
        elev: sp.elev,
        width: sp.width,
        pos: new THREE.Vector3(trans.pos.x, groundY, trans.pos.z),
        heading: trans.heading
      };
    });

    // Helper: compute forward tangent and horizontal normal for each spine point
    const trailFrames = [];
    for (let i = 0; i <= segments; i++) {
      let dir;
      if (i === 0) {
        dir = spinePoints[1].pos.clone().sub(spinePoints[0].pos).setY(0).normalize();
      } else if (i === segments) {
        dir = spinePoints[segments].pos.clone().sub(spinePoints[segments - 1].pos).setY(0).normalize();
      } else {
        dir = spinePoints[i + 1].pos.clone().sub(spinePoints[i - 1].pos).setY(0).normalize();
      }
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      trailFrames.push({ dir, norm });
    }

    // =========================================================================
    // 1. VOLUMETRIC 3D CAMBERED ROADBED WITH PACKED RUTS & BLENDED SHOULDERS (1,200M)
    // =========================================================================
    const trailVertices = [];
    const trailColors = [];
    const trailUvs = [];
    const trailIndices = [];

    // Cross-section profile template: [uCoord, deltaY, r, g, b]
    // 0: Seamless outer left skirt (dY = 0.0, blends 100% flush with mountain slope)
    // 1: Left talus shoulder (crushed sandstone scree)
    // 2: Left trail edge berm (compacted gravel)
    // 3: Left tire rut depression (warm compacted desert dirt)
    // 4: Center crown (high-contrast caliche & crushed sandstone gravel)
    // 5: Right tire rut depression (warm compacted desert dirt)
    // 6: Right trail edge berm (compacted gravel)
    // 7: Right talus shoulder (crushed sandstone scree)
    // 8: Seamless outer right skirt (dY = 0.0, blends 100% flush with mountain slope)
    const crossProfile = [
      { u: 0.00, dY: 0.00, r: 0.82, g: 0.62, b: 0.38 },
      { u: 0.12, dY: 0.04, r: 0.76, g: 0.56, b: 0.33 },
      { u: 0.25, dY: 0.09, r: 0.70, g: 0.50, b: 0.30 },
      { u: 0.38, dY: 0.06, r: 0.50, g: 0.33, b: 0.19 },   // packed dark rut (compacted soil + rubber)
      { u: 0.50, dY: 0.12, r: 0.88, g: 0.70, b: 0.47 },   // high caliche crown
      { u: 0.62, dY: 0.06, r: 0.50, g: 0.33, b: 0.19 },   // packed dark rut
      { u: 0.75, dY: 0.09, r: 0.70, g: 0.50, b: 0.30 },
      { u: 0.88, dY: 0.04, r: 0.76, g: 0.56, b: 0.33 },
      { u: 1.00, dY: 0.00, r: 0.82, g: 0.62, b: 0.38 }
    ];

    for (let i = 0; i <= segments; i++) {
      const sp = spinePoints[i];
      const { norm } = trailFrames[i];
      const halfW = (sp.width || 8.0) * 0.5;

      const offsets = [
        -halfW - 5.2,
        -halfW - 2.6,
        -halfW,
        -1.65,
        0.0,
        1.65,
        halfW,
        halfW + 2.6,
        halfW + 5.2
      ];

      // Dynamic environmental color modulation along the 1,200m expedition:
      let cModR = 1.0;
      let cModG = 1.0;
      let cModB = 1.0;

      // Subtle woven trail-wear jitter: deterministic light/dark patchiness so the
      // packed line reads as a repeatedly-driven technical line, not a flat ribbon.
      const _wearPhase = Math.sin(sp.t * 17.3) * 0.5 + 0.5;
      const _wear = 0.88 + _wearPhase * 0.10;
      cModR *= _wear; cModG *= _wear; cModB *= _wear;

      if ((sp.t >= 0.132 && sp.t <= 0.265) || (sp.t >= 0.58 && sp.t <= 0.66)) {
        // Wet mountain riverbed silt & dark cobblestones
        cModR = 0.44;
        cModG = 0.46;
        cModB = 0.48;
      } else if (sp.t >= 0.32 && sp.t <= 0.38) {
        // Damp waterfall spray zone with darkened moisture sheen
        cModR = 0.68;
        cModG = 0.65;
        cModB = 0.62;
      } else if (sp.t >= 0.85) {
        // High alpine granite gravel & weathered pine needle duff
        cModR = 0.74;
        cModG = 0.72;
        cModB = 0.68;
      }

      for (let k = 0; k < 9; k++) {
        const off = offsets[k];
        const p = sp.pos.clone().addScaledVector(norm, off);
        const y = this.splineRoad.getGroundElevation(p.x, p.z) + crossProfile[k].dY;

        trailVertices.push(p.x, y, p.z);
        trailColors.push(crossProfile[k].r * cModR, crossProfile[k].g * cModG, crossProfile[k].b * cModB);
        trailUvs.push(crossProfile[k].u, sp.t * 128.0);
      }

      if (i < segments) {
        const b0 = i * 9;
        const b1 = (i + 1) * 9;
        for (let k = 0; k < 8; k++) {
          trailIndices.push(b0 + k, b0 + k + 1, b1 + k);
          trailIndices.push(b0 + k + 1, b1 + k + 1, b1 + k);
        }
      }
    }

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(trailVertices, 3));
    trailGeo.setAttribute('color', new THREE.Float32BufferAttribute(trailColors, 3));
    trailGeo.setAttribute('uv', new THREE.Float32BufferAttribute(trailUvs, 2));
    trailGeo.setIndex(trailIndices);
    trailGeo.computeVertexNormals();

    const trailMesh = new THREE.Mesh(trailGeo, this.matDirtTrail);
    trailMesh.name = 'CoyoteRidgeDirtRoadbed';
    trailMesh.receiveShadow = true;
    trailGroup.add(trailMesh);

    // =========================================================================
    // 2. DUAL PRESSED TIRE RUTS (Left & Right 4x4 Wheel Tracks)
    // =========================================================================
    const createRutMesh = (lateralOffset) => {
      const rutVertices = [];
      const rutUvs = [];
      const rutIndices = [];
      const halfRutW = 0.42;

      for (let i = 0; i <= segments; i++) {
        const sp = spinePoints[i];
        const { norm } = trailFrames[i];
        const rutCenter = sp.pos.clone().addScaledVector(norm, lateralOffset);

        const pL = rutCenter.clone().addScaledVector(norm, -halfRutW);
        const pR = rutCenter.clone().addScaledVector(norm, halfRutW);

        const yL = this.splineRoad.getGroundElevation(pL.x, pL.z) + 0.045;
        const yR = this.splineRoad.getGroundElevation(pR.x, pR.z) + 0.045;

        rutVertices.push(pL.x, yL, pL.z);
        rutVertices.push(pR.x, yR, pR.z);

        rutUvs.push(0, sp.t * 160.0);
        rutUvs.push(1, sp.t * 160.0);

        if (i < segments) {
          const b = i * 2;
          rutIndices.push(b, b + 1, b + 2);
          rutIndices.push(b + 1, b + 3, b + 2);
        }
      }

      const rutGeo = new THREE.BufferGeometry();
      rutGeo.setAttribute('position', new THREE.Float32BufferAttribute(rutVertices, 3));
      rutGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rutUvs, 2));
      rutGeo.setIndex(rutIndices);
      rutGeo.computeVertexNormals();

      const rutMesh = new THREE.Mesh(rutGeo, this.matTireRut);
      rutMesh.receiveShadow = true;
      return rutMesh;
    };

    trailGroup.add(createRutMesh(-1.65));
    trailGroup.add(createRutMesh(1.65));

    // =========================================================================
    // 3. TURNOUT ENTRANCE APRON & DIRECTIONAL SIGNAGE
    // =========================================================================
    const apronGeo = new THREE.BufferGeometry();
    const apronPos0 = this.splineRoad.getRoadTransformAtZ(2536, -18, 0).pos;
    const apronPos1 = this.splineRoad.getRoadTransformAtZ(2564, -18, 0).pos;
    const apronPos2 = spinePoints[0].pos;
    const apronVertices = new Float32Array([
      apronPos0.x, this.splineRoad.getGroundElevation(apronPos0.x, apronPos0.z) + 0.10, apronPos0.z,
      apronPos1.x, this.splineRoad.getGroundElevation(apronPos1.x, apronPos1.z) + 0.10, apronPos1.z,
      apronPos2.x - 5.5, this.splineRoad.getGroundElevation(apronPos2.x - 5.5, apronPos2.z) + 0.10, apronPos2.z,

      apronPos1.x, this.splineRoad.getGroundElevation(apronPos1.x, apronPos1.z) + 0.10, apronPos1.z,
      apronPos2.x + 5.5, this.splineRoad.getGroundElevation(apronPos2.x + 5.5, apronPos2.z) + 0.10, apronPos2.z,
      apronPos2.x - 5.5, this.splineRoad.getGroundElevation(apronPos2.x - 5.5, apronPos2.z) + 0.10, apronPos2.z,
    ]);
    apronGeo.setAttribute('position', new THREE.BufferAttribute(apronVertices, 3));
    const apronUvs = new Float32Array([
      0, 0,
      1, 0,
      0.5, 1,
      1, 0,
      1, 1,
      0.5, 1,
    ]);
    apronGeo.setAttribute('uv', new THREE.BufferAttribute(apronUvs, 2));
    const apronColors = new Float32Array([
      0.85, 0.67, 0.41,
      0.85, 0.67, 0.41,
      0.78, 0.58, 0.36,
      0.85, 0.67, 0.41,
      0.78, 0.58, 0.36,
      0.78, 0.58, 0.36,
    ]);
    apronGeo.setAttribute('color', new THREE.BufferAttribute(apronColors, 3));
    apronGeo.computeVertexNormals();
    const apronMesh = new THREE.Mesh(apronGeo, this.matDirtTrail);
    apronMesh.receiveShadow = true;
    trailGroup.add(apronMesh);


    // Directional pavement arrows
    [-8, 0, 8].forEach(dz => {
      const arrTrans = this.splineRoad.getRoadTransformAtZ(2550 + dz, -16, 0.13);
      const arrGroup = new THREE.Group();
      arrGroup.position.copy(arrTrans.pos);
      arrGroup.rotation.y = arrTrans.heading - Math.PI * 0.5;

      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), this.matTrailSignYellow);
      shaft.rotation.x = -Math.PI * 0.5;
      arrGroup.add(shaft);

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 3), this.matTrailSignYellow);
      head.rotation.x = -Math.PI * 0.5;
      head.rotation.z = Math.PI * 0.5;
      head.position.set(1.4, 0, 0);
      arrGroup.add(head);

      trailGroup.add(arrGroup);
    });

    // =========================================================================
    // 4. TIMBER TRAILHEAD ENTRY GATEWAY ARCH & AIR-DOWN BASIN (t ≈ 0.03)
    // =========================================================================
    const archIdx = 8;
    const archSp = spinePoints[archIdx];
    const archFrame = trailFrames[archIdx];

    const gateGroup = new THREE.Group();
    gateGroup.position.copy(archSp.pos);
    gateGroup.rotation.y = Math.atan2(archFrame.dir.x, archFrame.dir.z);

    const postGeo = new THREE.CylinderGeometry(0.38, 0.46, 6.2, 8);
    const postLeft = new THREE.Mesh(postGeo, this.matWoodPole);
    postLeft.position.set(-5.2, 3.1, 0);
    postLeft.castShadow = true;
    gateGroup.add(postLeft);

    const postRight = new THREE.Mesh(postGeo, this.matWoodPole);
    postRight.position.set(5.2, 3.1, 0);
    postRight.castShadow = true;
    gateGroup.add(postRight);

    const beamGeo = new THREE.CylinderGeometry(0.35, 0.35, 12.0, 8);
    const crossbeam = new THREE.Mesh(beamGeo, this.matWoodPole);
    crossbeam.rotation.z = Math.PI * 0.5;
    crossbeam.position.set(0, 5.7, 0);
    crossbeam.castShadow = true;
    gateGroup.add(crossbeam);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(10.6, 2.2, 0.25), this.matWoodSignBrown);
    signBoard.position.set(0, 4.6, 0);
    signBoard.castShadow = true;
    gateGroup.add(signBoard);

    // Double Black Diamond Badges on timber board ends
    [-5.0, 5.0].forEach(dx => {
      const diamOuter = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.35), this.matSignSubSlate);
      diamOuter.position.set(dx, 4.6, -0.14);
      diamOuter.rotation.z = Math.PI * 0.25;
      gateGroup.add(diamOuter);

      [-0.12, 0.12].forEach(ddx => {
        const diamInner = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.38), this.matBlackDiamond);
        diamInner.position.set(dx + ddx, 4.6, -0.16);
        diamInner.rotation.z = Math.PI * 0.25;
        gateGroup.add(diamInner);
      });
    });

    // Trailhead Stone Cairn & Information Kiosk
    const cairnBase = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 7), this.matDesertBoulder);
    cairnBase.position.set(-7.2, 1.1, 1.2);
    gateGroup.add(cairnBase);

    const mapBoard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 0.15), this.matWoodSignBrown);
    mapBoard.position.set(-7.2, 2.6, 1.2);
    mapBoard.rotation.y = 0.3;
    gateGroup.add(mapBoard);

    const mapFace = trailSign('TRAILHEAD INFORMATION', 'SUMMIT 5,640 FT • 4WD HIGH CLEARANCE', 2.0, '#1e293b');
    mapFace.position.set(-7.2, 2.6, 1.29);
    mapFace.rotation.y = 0.3;
    gateGroup.add(mapFace);

    const airDownBacker = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.70, 0.10), this.matWoodSignBrown);
    airDownBacker.position.set(6.4, 2.3, 0.95);
    gateGroup.add(airDownBacker);

    const airDownSign = trailSign('AIR DOWN STATION', 'RECOMMENDED 15-20 PSI FOR TRACTION', 2.4, '#1e3a8a');
    airDownSign.position.set(6.4, 2.3, 1.02);
    gateGroup.add(airDownSign);

    // 1. Dedicated Overhead Archway Header Banner (USFS Green)
    const grandTitle = trailSign('COUGAR RIDGE 4x4 EXPEDITION', 'DIFFICULT • HIGH-CLEARANCE 4WD LOW GEAR ONLY', 8.5);
    grandTitle.position.set(0, 4.6, -0.16);
    grandTitle.rotation.y = Math.PI;
    gateGroup.add(grandTitle);

    // 2. Dedicated Separate Freestanding Roadside Regulatory Signpost (USFS Crimson Red)
    // Placed on the right roadside shoulder 5.5m before the arch
    const regSignGroup = new THREE.Group();
    regSignGroup.name = 'TrailheadOneWayRegulatorySign';
    regSignGroup.position.set(7.6, 0, -5.5);
    regSignGroup.rotation.y = Math.PI - 0.22;

    const regPostGeo = new THREE.CylinderGeometry(0.12, 0.15, 3.2, 6);
    [-1.6, 1.6].forEach(px => {
      const p = new THREE.Mesh(regPostGeo, this.matWoodPole);
      p.position.set(px, 1.6, 0);
      p.castShadow = true;
      regSignGroup.add(p);
    });

    const regBoard = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.4, 0.12), this.matWoodSignBrown);
    regBoard.position.set(0, 2.2, 0.04);
    regBoard.castShadow = true;
    regSignGroup.add(regBoard);

    const regSign = trailSign('UPHILL ONLY • ONE WAY', 'RETURN VIA DOWNHILL EXPRESS CHUTE', 4.5, '#991b1b');
    regSign.position.set(0, 2.2, 0.12);
    regSignGroup.add(regSign);

    gateGroup.add(regSignGroup);
    trailGroup.add(gateGroup);

    const summitExit = new THREE.Group();
    summitExit.name = 'TrailOneWaySummitExit';
    const exitFrame = trailFrames[238];
    summitExit.position.copy(spinePoints[238].pos);
    summitExit.rotation.y = Math.atan2(exitFrame.dir.x, exitFrame.dir.z);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.0, 6), this.matWoodPole);
      post.position.set(side * 8, 1.5, 0);
      summitExit.add(post);

      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.2, 0.12), this.matWoodSignBrown);
      signBoard.position.set(side * 8, 2.6, 0);
      summitExit.add(signBoard);

      const sign = trailSign('DO NOT ENTER', 'UPHILL EXIT • USE EXPRESS DESCENT', 4.0, '#852a25');
      sign.position.set(side * 8, 2.6, 0.07);
      summitExit.add(sign);
    }
    trailGroup.add(summitExit);

    // =========================================================================
    // 5. CONTINUOUS FLANKING BORDER STONES LINING 1,200M EXPEDITION (Instanced)
    // =========================================================================
    const stoneTransforms = [];
    for (let i = 14; i <= segments - 4; i += 3) {
      const sp = spinePoints[i];
      if (sp.pos.y > 48.0) continue;
      // Skip right inside stream crossing pools
      if ((sp.t >= 0.15 && sp.t <= 0.19) || (sp.t >= 0.60 && sp.t <= 0.64)) continue;

      const { norm } = trailFrames[i];
      const halfW = (sp.width || 8.0) * 0.5;

      [-1, 1].forEach(side => {
        const offsetDist = halfW + 1.8 + ((i * 7 + side * 3) % 4) * 0.15;
        const bx = sp.pos.x + norm.x * (side * offsetDist);
        const bz = sp.pos.z + norm.z * (side * offsetDist);
        const by = this.splineRoad.getGroundElevation(bx, bz);

        const scaleVal = (i % 9 === 0) ? 0.98 : (i % 6 === 0 ? 0.70 : 0.45);
        stoneTransforms.push({
          pos: [bx, by + 0.22, bz],
          rot: [(i * 1.3) % 3, (i * 2.1) % 3, (side * 1.7) % 3],
          scale: [scaleVal, scaleVal, scaleVal]
        });
      });
    }

    if (stoneTransforms.length > 0) {
      const instancedBorderStones = new THREE.InstancedMesh(
        new THREE.DodecahedronGeometry(1.0, 1),
        this.matDesertBoulder,
        stoneTransforms.length
      );
      instancedBorderStones.name = 'Instanced_CoyoteBorderStones';
      instancedBorderStones.castShadow = true;
      instancedBorderStones.receiveShadow = true;
      const dummy = new THREE.Object3D();
      stoneTransforms.forEach((st, idx) => {
        dummy.position.set(...st.pos);
        dummy.rotation.set(...st.rot);
        dummy.scale.set(...st.scale);
        dummy.updateMatrix();
        instancedBorderStones.setMatrixAt(idx, dummy.matrix);
      });
      instancedBorderStones.instanceMatrix.needsUpdate = true;
      trailGroup.add(instancedBorderStones);
    }

    // =========================================================================
    // 6. RETRO-REFLECTIVE TRAIL GUIDE STAKES WITH DIRECTIONAL CHEVRONS (Instanced)
    // =========================================================================
    const guideTransforms = [];
    for (let i = 6; i < segments - 4; i += 6) {
      const sp = spinePoints[i];
      if (sp.pos.y > 52.0) continue;
      if ((sp.t >= 0.15 && sp.t <= 0.19) || (sp.t >= 0.60 && sp.t <= 0.64)) continue;

      const { dir, norm } = trailFrames[i];
      const halfW = (sp.width || 8.0) * 0.5;

      [-1, 1].forEach((side) => {
        const postX = sp.pos.x + norm.x * (side * (halfW + 0.70));
        const postZ = sp.pos.z + norm.z * (side * (halfW + 0.70));
        const postY = this.splineRoad.getGroundElevation(postX, postZ);
        const heading = Math.atan2(dir.x, dir.z);
        guideTransforms.push({ postX, postY, postZ, heading, side });
      });
    }

    if (guideTransforms.length > 0) {
      const count = guideTransforms.length;
      const instStakes = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.09, 0.11, 2.5, 6),
        this.matWoodPole,
        count
      );
      instStakes.name = 'Instanced_CoyoteGuideStakes';
      instStakes.castShadow = true;

      const instBlazes = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.28, 0.46, 0.10),
        this.matTrailReflectorOrange,
        count
      );
      instBlazes.name = 'Instanced_CoyoteGuideBlazes';

      if (!this.matTrailChevronArrow) {
        this.matTrailChevronArrow = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      }

      const instChevrons = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.36, 0.30, 0.08),
        this.matTrailSignYellow,
        count
      );
      instChevrons.name = 'Instanced_CoyoteGuideChevrons';

      const instArrows = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.24, 0.09, 0.10),
        this.matTrailChevronArrow,
        count
      );
      instArrows.name = 'Instanced_CoyoteGuideArrows';

      const parentDummy = new THREE.Object3D();
      const childDummy = new THREE.Object3D();
      parentDummy.add(childDummy);

      guideTransforms.forEach((gt, idx) => {
        parentDummy.position.set(gt.postX, gt.postY, gt.postZ);
        parentDummy.rotation.set(0, gt.heading, 0);

        // Stake
        childDummy.position.set(0, 1.25, 0);
        childDummy.rotation.set(0, 0, 0);
        childDummy.scale.set(1, 1, 1);
        parentDummy.updateMatrixWorld(true);
        instStakes.setMatrixAt(idx, childDummy.matrixWorld);

        // Blaze
        childDummy.position.set(0, 2.1, 0.06);
        childDummy.rotation.set(0, 0, 0);
        parentDummy.updateMatrixWorld(true);
        instBlazes.setMatrixAt(idx, childDummy.matrixWorld);

        // Chevron board
        childDummy.position.set(0, 1.6, 0.07);
        childDummy.rotation.set(0, 0, 0);
        parentDummy.updateMatrixWorld(true);
        instChevrons.setMatrixAt(idx, childDummy.matrixWorld);

        // Chevron arrow
        childDummy.position.set(0, 1.6, 0.08);
        childDummy.rotation.set(0, 0, gt.side > 0 ? -0.45 : 0.45);
        parentDummy.updateMatrixWorld(true);
        instArrows.setMatrixAt(idx, childDummy.matrixWorld);
      });

      instStakes.instanceMatrix.needsUpdate = true;
      instBlazes.instanceMatrix.needsUpdate = true;
      instChevrons.instanceMatrix.needsUpdate = true;
      instArrows.instanceMatrix.needsUpdate = true;

      trailGroup.add(instStakes);
      trailGroup.add(instBlazes);
      trailGroup.add(instChevrons);
      trailGroup.add(instArrows);
    }

    // =========================================================================
    // 7. WATER STREAMS & SPECTACULAR WATERFALLS NETWORK
    // =========================================================================

    // =========================================================================
    // 7A: COUGAR CREEK GRAND EXTENDED RIVER CROSSING & FORD (t ≈ 0.132 - 0.265, indices 34-68, ~160M)
    // =========================================================================
    const creekStreamGroup = new THREE.Group();
    creekStreamGroup.name = 'CougarCreekStream';

    const creekStartIdx = 34; // t ≈ 0.133
    const creekEndIdx = 68;   // t ≈ 0.266
    const nCreek = (creekEndIdx - creekStartIdx) + 1;

    // 1. Contoured Shallow Riverbed Water Surface Conforming Smoothly to Mountain Canyon Spline
    const fordSegX = 12;
    const fordW = 24.0;
    const fordVertices = [];
    const fordUvs = [];
    const fordIndices = [];

    for (let i = creekStartIdx; i <= creekEndIdx; i++) {
      const sp = spinePoints[i];
      const { norm } = trailFrames[i];
      const tAlong = (i - creekStartIdx) / (creekEndIdx - creekStartIdx);
      const edgeDistZ = Math.min((i - creekStartIdx) / 4.0, (creekEndIdx - i) / 4.0, 1.0);

      for (let ix = 0; ix <= fordSegX; ix++) {
        const fracX = (ix / fordSegX) - 0.5;
        const offX = fracX * fordW;

        const wx = sp.pos.x + norm.x * offX;
        const wz = sp.pos.z + norm.z * offX;
        const gy = this.splineRoad.getGroundElevation(wx, wz);

        const edgeDistX = 1.0 - Math.abs(fracX * 2.0);
        const edgeFade = Math.min(edgeDistX, edgeDistZ);
        const waterRise = 0.16 + edgeFade * 0.18;

        fordVertices.push(wx, gy + waterRise, wz);
        fordUvs.push(ix / fordSegX, tAlong * 16.0);
      }
    }

    for (let row = 0; row < nCreek - 1; row++) {
      const b0 = row * (fordSegX + 1);
      const b1 = (row + 1) * (fordSegX + 1);
      for (let ix = 0; ix < fordSegX; ix++) {
        const a = b0 + ix;
        const b = a + 1;
        const c = b1 + ix;
        const d = c + 1;
        fordIndices.push(a, b, c);
        fordIndices.push(b, d, c);
      }
    }

    const fordGeo = new THREE.BufferGeometry();
    fordGeo.setAttribute('position', new THREE.Float32BufferAttribute(fordVertices, 3));
    fordGeo.setAttribute('uv', new THREE.Float32BufferAttribute(fordUvs, 2));
    fordGeo.setIndex(fordIndices);
    fordGeo.computeVertexNormals();

    const fordMesh = new THREE.Mesh(fordGeo, this.matStreamWater);
    fordMesh.receiveShadow = true;
    creekStreamGroup.add(fordMesh);

    // 2. Whitewater Rapids Foam Fringes & Intermediate River Riffles
    const creekEntrySp = spinePoints[creekStartIdx];
    const creekEntryFrame = trailFrames[creekStartIdx];
    const creekExitSp = spinePoints[creekEndIdx];
    const creekExitFrame = trailFrames[creekEndIdx];

    // Threshold rapids at river entrance and exit
    [
      { sp: creekEntrySp, frame: creekEntryFrame },
      { sp: creekExitSp, frame: creekExitFrame }
    ].forEach(({ sp, frame }) => {
      const foamMesh = new THREE.Mesh(new THREE.PlaneGeometry(fordW + 2.0, 4.2), this.matStreamFoam);
      foamMesh.rotation.x = -Math.PI * 0.5;
      foamMesh.rotation.z = Math.atan2(frame.dir.x, frame.dir.z);
      foamMesh.position.set(sp.pos.x, sp.pos.y + 0.12, sp.pos.z);
      creekStreamGroup.add(foamMesh);
    });

    // Mid-river cascade riffles where water pours over riverbed cobblestones
    [42, 50, 58, 64].forEach(idx => {
      const rSp = spinePoints[idx];
      const rFrame = trailFrames[idx];
      const riffle = new THREE.Mesh(new THREE.PlaneGeometry(18.0, 3.2), this.matStreamFoam);
      riffle.rotation.x = -Math.PI * 0.5;
      riffle.rotation.z = Math.atan2(rFrame.dir.x, rFrame.dir.z);
      riffle.position.set(rSp.pos.x, rSp.pos.y + 0.14, rSp.pos.z);
      creekStreamGroup.add(riffle);
    });

    // 3. Upstream Feeder Ribbon (flowing down from high canyon peaks into entry) and Downstream Outflow
    const upstreamPoints = [
      new THREE.Vector3(191.3, this.splineRoad.getGroundElevation(191.3, 1312.1) + 0.12, 1312.1),
      new THREE.Vector3(175.0, this.splineRoad.getGroundElevation(175.0, 1270.0) + 0.12, 1270.0),
      new THREE.Vector3(155.0, this.splineRoad.getGroundElevation(155.0, 1225.0) + 0.12, 1225.0),
      new THREE.Vector3(125.0, this.splineRoad.getGroundElevation(125.0, 1160.0) + 0.12, 1160.0),
      new THREE.Vector3(creekEntrySp.pos.x - creekEntryFrame.norm.x * 12.0, creekEntrySp.pos.y + 0.10, creekEntrySp.pos.z - creekEntryFrame.norm.z * 12.0),
      new THREE.Vector3(creekEntrySp.pos.x, creekEntrySp.pos.y + 0.10, creekEntrySp.pos.z)
    ];
    creekStreamGroup.add(terrainRibbon(this.splineRoad, upstreamPoints, 14.0, this.matWetGranite, 0.045, 'CougarCreekWetBanksUpstream'));
    creekStreamGroup.add(terrainRibbon(this.splineRoad, upstreamPoints, 10.0, this.matStreamWater, 0.20, 'CougarCreekWaterUpstream'));

    const downstreamPoints = [
      new THREE.Vector3(creekExitSp.pos.x, creekExitSp.pos.y + 0.10, creekExitSp.pos.z),
      new THREE.Vector3(creekExitSp.pos.x + creekExitFrame.norm.x * 12.0, creekExitSp.pos.y + 0.08, creekExitSp.pos.z + creekExitFrame.norm.z * 12.0),
      new THREE.Vector3(75.0, this.splineRoad.getGroundElevation(75.0, 1260.0) + 0.10, 1260.0),
      new THREE.Vector3(55.0, this.splineRoad.getGroundElevation(55.0, 1285.0) + 0.08, 1285.0)
    ];
    creekStreamGroup.add(terrainRibbon(this.splineRoad, downstreamPoints, 14.0, this.matWetGranite, 0.045, 'CougarCreekWetBanksDownstream'));
    creekStreamGroup.add(terrainRibbon(this.splineRoad, downstreamPoints, 10.0, this.matStreamWater, 0.20, 'CougarCreekWaterDownstream'));

    // 4. Rich Riverbed Boulders, Wet Granite Slabs & Bank Stones (spanning all ~160M)
    const riverStones = [
      // Entry rapids & bank boulders (indices 35-42)
      { idx: 35, sideOff: -11.5, rad: 2.2, h: 0.85, type: 'bank' },
      { idx: 36, sideOff:  11.8, rad: 2.0, h: 0.80, type: 'bank' },
      { idx: 38, sideOff:  -4.8, rad: 1.6, h: 0.60, type: 'mid' },
      { idx: 39, sideOff:  10.5, rad: 2.4, h: 0.90, type: 'bank' },
      { idx: 41, sideOff: -10.8, rad: 1.9, h: 0.75, type: 'bank' },
      { idx: 42, sideOff:   4.2, rad: 1.7, h: 0.65, type: 'mid' },

      // Mid-canyon river crossing boulders & slabs (indices 44-52)
      { idx: 44, sideOff: -11.2, rad: 2.5, h: 0.95, type: 'bank' },
      { idx: 45, sideOff:  11.0, rad: 2.3, h: 0.88, type: 'bank' },
      { idx: 47, sideOff:  -3.8, rad: 1.8, h: 0.68, type: 'mid' },
      { idx: 48, sideOff:  11.5, rad: 2.6, h: 1.05, type: 'bank' },
      { idx: 50, sideOff:   3.6, rad: 1.9, h: 0.72, type: 'mid' },
      { idx: 51, sideOff: -10.5, rad: 2.2, h: 0.85, type: 'bank' },
      { idx: 52, sideOff:  12.0, rad: 2.4, h: 0.92, type: 'bank' },

      // Deep canyon pool & cascading rapids boulders (indices 54-61)
      { idx: 54, sideOff: -11.8, rad: 2.7, h: 1.10, type: 'bank' },
      { idx: 55, sideOff:  -4.2, rad: 1.8, h: 0.70, type: 'mid' },
      { idx: 56, sideOff:  11.2, rad: 2.5, h: 0.95, type: 'bank' },
      { idx: 58, sideOff:   4.5, rad: 1.7, h: 0.66, type: 'mid' },
      { idx: 59, sideOff: -10.8, rad: 2.3, h: 0.88, type: 'bank' },
      { idx: 61, sideOff:  11.5, rad: 2.8, h: 1.15, type: 'bank' },

      // Exit reach & threshold boulders (indices 63-68)
      { idx: 63, sideOff:  -4.0, rad: 1.9, h: 0.75, type: 'mid' },
      { idx: 64, sideOff: -11.5, rad: 2.4, h: 0.92, type: 'bank' },
      { idx: 65, sideOff:   4.2, rad: 1.8, h: 0.68, type: 'mid' },
      { idx: 66, sideOff:  11.8, rad: 2.6, h: 1.00, type: 'bank' },
      { idx: 67, sideOff: -11.0, rad: 2.1, h: 0.80, type: 'bank' },
      { idx: 68, sideOff:  12.2, rad: 2.5, h: 0.95, type: 'bank' }
    ];

    riverStones.forEach((st, sIdx) => {
      const sp = spinePoints[st.idx];
      const { norm } = trailFrames[st.idx];
      const sx = sp.pos.x + norm.x * st.sideOff;
      const sz = sp.pos.z + norm.z * st.sideOff;
      const sy = this.splineRoad.getGroundElevation(sx, sz);

      const stoneMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(st.rad, 1),
        sIdx % 3 === 0 ? this.matRiverMoss : (sIdx % 2 === 0 ? this.matWetGranite : this.matRiverPebble)
      );
      stoneMesh.position.set(sx, sy + st.h * 0.38, sz);
      stoneMesh.scale.set(1.35, 0.65, 1.2);
      stoneMesh.rotation.set(0.1, sIdx * 1.3, 0.15);
      stoneMesh.castShadow = true;
      stoneMesh.receiveShadow = true;
      creekStreamGroup.add(stoneMesh);

      // Hydraulic eddy wake foam downstream of each stone
      const eddy = new THREE.Mesh(new THREE.PlaneGeometry(st.rad * 2.2, st.rad * 1.6), this.matStreamFoam);
      eddy.rotation.x = -Math.PI * 0.5;
      eddy.position.set(sx, sy + 0.11, sz + st.rad * 0.9);
      creekStreamGroup.add(eddy);
    });

    // 5. Submerged Riverbed Pebble Carpet visible through clear water across full length
    for (let p = 0; p < 54; p++) {
      const pT = p / 54;
      const pIdx = Math.floor(creekStartIdx + pT * (creekEndIdx - creekStartIdx));
      const sp = spinePoints[pIdx];
      const { norm } = trailFrames[pIdx];
      const lateralShift = Math.sin(p * 2.7) * (fordW * 0.36);
      const px = sp.pos.x + norm.x * lateralShift;
      const pz = sp.pos.z + norm.z * lateralShift;
      const py = this.splineRoad.getGroundElevation(px, pz);

      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + (p % 3) * 0.15, 1), this.matRiverPebble);
      pebble.position.set(px, py + 0.05, pz);
      pebble.scale.set(1.4, 0.4, 1.2);
      pebble.rotation.set((p * 1.7) % 3, p, 0);
      creekStreamGroup.add(pebble);
    }

    // 6. Official Creek Fording Depth Gauge Posts (Entry, Mid-point, Exit)
    [
      { idx: 35, text: 'COUGAR CREEK FORD • ENTRY' },
      { idx: 51, text: 'COUGAR CREEK FORD • MID-CROSSING' },
      { idx: 67, text: 'COUGAR CREEK FORD • EXIT' }
    ].forEach(({ idx }) => {
      const sp = spinePoints[idx];
      const frame = trailFrames[idx];

      [-1, 1].forEach(side => {
        const gPost = new THREE.Group();
        const gx = sp.pos.x + frame.norm.x * (side * 5.8);
        const gz = sp.pos.z + frame.norm.z * (side * 5.8);
        const gy = this.splineRoad.getGroundElevation(gx, gz);
        gPost.position.set(gx, gy, gz);
        gPost.rotation.y = Math.atan2(frame.dir.x, frame.dir.z) + Math.PI - 0.25 * side;

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.2, 8), this.matWoodPole);
        pole.position.set(0, 1.6, -0.09);
        pole.castShadow = true;
        gPost.add(pole);

        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.65, 0.12), this.matWoodSignBrown);
        signBoard.position.y = 2.2;
        signBoard.castShadow = true;
        gPost.add(signBoard);

        const creekPlaque = trailSign('RIVER FORDING POINT', 'MAINTAIN STEADY MOMENTUM', 3.8, '#0369a1');
        creekPlaque.position.set(0, 2.2, 0.08);
        gPost.add(creekPlaque);

        creekStreamGroup.add(gPost);
      });
    });

    // 7. Lush Riparian Tree Groves along Riverbanks (Cottonwoods, Willows, Alders)
    const riparianTrees = [
      { idx: 35, sideOff: -12.5, type: 'cottonwood', h: 8.5 },
      { idx: 36, sideOff:  13.0, type: 'cottonwood', h: 9.0 },
      { idx: 39, sideOff: -13.0, type: 'willow',     h: 6.8 },
      { idx: 41, sideOff:  13.5, type: 'alder',      h: 7.5 },
      { idx: 44, sideOff: -13.2, type: 'cottonwood', h: 9.5 },
      { idx: 46, sideOff:  13.0, type: 'willow',     h: 7.2 },
      { idx: 49, sideOff: -13.5, type: 'alder',      h: 7.0 },
      { idx: 51, sideOff:  13.8, type: 'cottonwood', h: 8.8 },
      { idx: 54, sideOff: -13.0, type: 'cottonwood', h: 9.2 },
      { idx: 56, sideOff:  13.2, type: 'willow',     h: 6.5 },
      { idx: 59, sideOff: -13.8, type: 'alder',      h: 7.8 },
      { idx: 61, sideOff:  13.5, type: 'cottonwood', h: 9.0 },
      { idx: 64, sideOff: -13.2, type: 'willow',     h: 7.0 },
      { idx: 65, sideOff:  13.8, type: 'cottonwood', h: 8.5 },
      { idx: 67, sideOff: -13.0, type: 'alder',      h: 7.2 },
      { idx: 68, sideOff:  13.5, type: 'willow',     h: 6.8 }
    ];

    riparianTrees.forEach((tCfg) => {
      const sp = spinePoints[tCfg.idx];
      const frame = trailFrames[tCfg.idx];
      const tree = new THREE.Group();
      const tx = sp.pos.x + frame.norm.x * tCfg.sideOff;
      const tz = sp.pos.z + frame.norm.z * tCfg.sideOff;
      const ty = this.splineRoad.getGroundElevation(tx, tz);
      tree.position.set(tx, ty, tz);

      if (tCfg.type === 'cottonwood') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, tCfg.h * 0.5, 6), this.matJoshuaTrunk);
        trunk.position.y = tCfg.h * 0.25;
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), this.matCottonwoodCrown);
        crown.position.y = tCfg.h * 0.65;
        crown.scale.set(1.3, 1.25, 1.2);
        crown.castShadow = true;
        tree.add(crown);

        const crownTop = new THREE.Mesh(new THREE.DodecahedronGeometry(2.3, 1), this.matCottonwoodCrown);
        crownTop.position.set(0.3, tCfg.h * 0.88, -0.2);
        crownTop.castShadow = true;
        tree.add(crownTop);
      } else if (tCfg.type === 'willow') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.40, tCfg.h * 0.46, 6), this.matWoodPole);
        trunk.position.y = tCfg.h * 0.23;
        trunk.rotation.z = (tCfg.sideOff > 0 ? -0.16 : 0.16);
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 1.8, 3.0, 8), this.matWillowFoliage);
        crown.position.y = tCfg.h * 0.62;
        crown.castShadow = true;
        tree.add(crown);
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, tCfg.h * 0.48, 6), this.matWoodPole);
        trunk.position.y = tCfg.h * 0.24;
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), this.matAlderFoliage);
        crown.position.y = tCfg.h * 0.68;
        crown.scale.set(1.1, 1.4, 1.1);
        crown.castShadow = true;
        tree.add(crown);
      }

      creekStreamGroup.add(tree);
    });

    deepTrailGroup.add(creekStreamGroup);

    // =========================================================================
    // 7B: COUGAR FALLS SCENIC VISTA OVERLOOK & WATERFALL (t ≈ 0.35, index ~90)
    // =========================================================================
    const fallsGroup = new THREE.Group();
    fallsGroup.name = 'CougarFallsSystem';

    const turnSp = spinePoints[90];
    const turnFrame = trailFrames[90];
    const turnNorm = turnFrame.norm;

    // Overlook retaining wall & heavy rustic guardrails along cliff edge
    [84, 88, 92, 96].forEach((idx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const halfW = (sp.width || 12.0) * 0.5;
      const testOff = halfW + 0.6;
      const side = -1; // Outer gorge side facing waterfall

      const cx = sp.pos.x + norm.x * (side * testOff);
      const cz = sp.pos.z + norm.z * (side * testOff);
      const groundH = this.splineRoad.getGroundElevation(cx, cz);

      // Low rustic stone curb foundation (0.45m high, 0.55m wide)
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 7.5), this.matGraniteGray);
      curb.position.set(cx, groundH + 0.22, cz);
      curb.rotation.y = Math.atan2(dir.x, dir.z);
      curb.castShadow = true;
      curb.receiveShadow = true;
      fallsGroup.add(curb);

      // Rustic vertical timber posts (spaced along the segment)
      [-2.6, 0, 2.6].forEach(postOff => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.15, 6), this.matWoodPole);
        post.position.set(cx + dir.x * postOff, groundH + 0.55, cz + dir.z * postOff);
        post.castShadow = true;
        fallsGroup.add(post);
      });

      // Lower rustic peeled log rail (at 0.65m height)
      const lowerRail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 7.5, 6), this.matWoodPole);
      lowerRail.position.set(cx, groundH + 0.65, cz);
      lowerRail.rotation.x = Math.PI * 0.5;
      lowerRail.rotation.y = Math.atan2(dir.x, dir.z);
      lowerRail.castShadow = true;
      fallsGroup.add(lowerRail);

      // Upper rustic peeled log handrail (at 1.05m height - open panoramic sightline!)
      const upperRail = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 7.5, 6), this.matWoodPole);
      upperRail.position.set(cx, groundH + 1.05, cz);
      upperRail.rotation.x = Math.PI * 0.5;
      upperRail.rotation.y = Math.atan2(dir.x, dir.z);
      upperRail.castShadow = true;
      fallsGroup.add(upperRail);
    });


    // Two-Tier Cougar Falls Canyon Cascade (Across gorge at lat: -200, z: 2830)
    const wfTrans = this.splineRoad.getRoadTransformAtZ(2830.0, -200.0, 0);
    const wfX = wfTrans.pos.x;
    const wfZ = wfTrans.pos.z;
    const wfPoolY = 25.0;
    const wfMidY = 36.5;
    const wfTopY = 48.0;

    // Angle pointing from waterfall towards the overlook trailbed (turnSp)
    const wfDirX = turnSp.pos.x - wfX;
    const wfDirZ = turnSp.pos.z - wfZ;
    const wfRotY = Math.atan2(wfDirX, wfDirZ);

    // Canyon Bluff Amphitheater with craggy rock ledges
    const bluffBacking = new THREE.Mesh(new THREE.CylinderGeometry(18, 24, 28, 14, 1, false, -0.45, Math.PI * 0.9), this.matMesaRed);
    bluffBacking.position.set(wfX - Math.sin(wfRotY) * 5.0, (wfTopY + wfPoolY) * 0.5, wfZ - Math.cos(wfRotY) * 5.0);
    bluffBacking.rotation.y = wfRotY + Math.PI;
    bluffBacking.castShadow = true;
    fallsGroup.add(bluffBacking);

    // Wet rock wall directly behind the falling water curtains (dark wet basalt with specular sheen)
    const wetCliffGeo = new THREE.PlaneGeometry(12.0, wfTopY - wfPoolY + 2.0);
    const wetCliff = new THREE.Mesh(wetCliffGeo, this.matWetGranite);
    wetCliff.position.set(wfX - Math.sin(wfRotY) * 0.8, (wfTopY + wfPoolY) * 0.5, wfZ - Math.cos(wfRotY) * 0.8);
    wetCliff.rotation.y = wfRotY;
    wetCliff.receiveShadow = true;
    fallsGroup.add(wetCliff);

    // Flanking natural rock groynes framing the cascade
    [-4.5, 4.5].forEach((gx, gIdx) => {
      const gX = wfX + Math.cos(wfRotY) * gx;
      const gZ = wfZ - Math.sin(wfRotY) * gx;
      const rockGroyne = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5 + gIdx * 0.5, 1), this.matDesertBoulder);
      rockGroyne.position.set(gX, wfMidY, gZ);
      rockGroyne.scale.set(1.2, 2.5, 1.4);
      rockGroyne.rotation.set(0.2, gIdx * 1.5, 0.1);
      rockGroyne.castShadow = true;
      fallsGroup.add(rockGroyne);
    });

    // ── Upper Cascade (46m -> 32.5m) ─────────────────────────────────────────
    const upperH = wfTopY - wfMidY;

    // Curved crest lip where stream rolls over the rock edge
    const crestLipGeo = new THREE.CylinderGeometry(1.2, 1.2, 6.8, 12, 1, true, -Math.PI * 0.5, Math.PI * 0.5);
    const crestLip = new THREE.Mesh(crestLipGeo, this.matWaterfallWater);
    crestLip.position.set(wfX - Math.sin(wfRotY) * 1.0, wfTopY, wfZ - Math.cos(wfRotY) * 1.0);
    crestLip.rotation.y = wfRotY;
    crestLip.rotation.z = Math.PI * 0.5;
    fallsGroup.add(crestLip);

    // Inner deep rushing water sheet
    const upperInner = new THREE.Mesh(new THREE.PlaneGeometry(5.8, upperH), this.matWaterfallWaterInner);
    upperInner.position.set(wfX - Math.sin(wfRotY) * 0.2, wfMidY + upperH * 0.5, wfZ - Math.cos(wfRotY) * 0.2);
    upperInner.rotation.y = wfRotY;
    fallsGroup.add(upperInner);

    // Outer frothy cascading water curtain
    const upperSheet = new THREE.Mesh(new THREE.PlaneGeometry(6.6, upperH), this.matWaterfallWater);
    upperSheet.position.set(wfX, wfMidY + upperH * 0.5, wfZ);
    upperSheet.rotation.y = wfRotY;
    fallsGroup.add(upperSheet);

    // Flanking spray veil streamers
    [-3.1, 3.1].forEach(sx => {
      const sprayVeil = new THREE.Mesh(new THREE.PlaneGeometry(1.8, upperH * 0.85), this.matWaterfallSpray);
      sprayVeil.position.set(wfX + Math.cos(wfRotY) * sx, wfMidY + upperH * 0.45, wfZ - Math.sin(wfRotY) * sx);
      sprayVeil.rotation.y = wfRotY + (sx > 0 ? 0.2 : -0.2);
      fallsGroup.add(sprayVeil);
    });

    // ── Mid Shelf Splash Basin & Rock Ledges ────────────────────────────────
    const midShelf = new THREE.Mesh(new THREE.DodecahedronGeometry(5.2, 1), this.matWetGranite);
    midShelf.position.set(wfX + Math.sin(wfRotY) * 1.4, wfMidY - 1.2, wfZ + Math.cos(wfRotY) * 1.4);
    midShelf.scale.set(1.8, 0.6, 1.4);
    midShelf.castShadow = true;
    fallsGroup.add(midShelf);

    const midBoil = new THREE.Mesh(new THREE.CircleGeometry(4.2, 16), this.matWaterfallRipple);
    midBoil.rotation.x = -Math.PI * 0.5;
    midBoil.position.set(wfX + Math.sin(wfRotY) * 1.4, wfMidY + 0.35, wfZ + Math.cos(wfRotY) * 1.4);
    fallsGroup.add(midBoil);

    // ── Lower Cascade (32.5m -> 19.5m) ───────────────────────────────────────
    const lowerH = wfMidY - wfPoolY;

    const lowerInner = new THREE.Mesh(new THREE.PlaneGeometry(7.8, lowerH), this.matWaterfallWaterInner);
    lowerInner.position.set(wfX + Math.sin(wfRotY) * 2.3, wfPoolY + lowerH * 0.5, wfZ + Math.cos(wfRotY) * 2.3);
    lowerInner.rotation.y = wfRotY;
    fallsGroup.add(lowerInner);

    const lowerSheet = new THREE.Mesh(new THREE.PlaneGeometry(9.2, lowerH), this.matWaterfallWater);
    lowerSheet.position.set(wfX + Math.sin(wfRotY) * 2.6, wfPoolY + lowerH * 0.5, wfZ + Math.cos(wfRotY) * 2.6);
    lowerSheet.rotation.y = wfRotY;
    fallsGroup.add(lowerSheet);

    // ── Plunge Pool Basin & Concentric Ripples ──────────────────────────────
    const poolCenter = new THREE.Vector3(wfX + Math.sin(wfRotY) * 6.5, wfPoolY + 0.12, wfZ + Math.cos(wfRotY) * 6.5);

    // Plunge pool water body (deep mountain turquoise)
    const poolGeo = new THREE.CircleGeometry(12.5, 32);
    const poolMesh = new THREE.Mesh(poolGeo, this.matStreamWater);
    poolMesh.rotation.x = -Math.PI * 0.5;
    poolMesh.position.copy(poolCenter);
    poolMesh.receiveShadow = true;
    fallsGroup.add(poolMesh);

    // Expanding concentric wave ripples
    const rippleGeo = new THREE.PlaneGeometry(24.0, 24.0);
    const poolRipples = new THREE.Mesh(rippleGeo, this.matWaterfallRipple);
    poolRipples.rotation.x = -Math.PI * 0.5;
    poolRipples.position.set(poolCenter.x, poolCenter.y + 0.05, poolCenter.z);
    fallsGroup.add(poolRipples);

    // Hydraulic impact boil foam ring at foot of cascade
    const boilGeo = new THREE.CircleGeometry(4.8, 20);
    const impactBoil = new THREE.Mesh(boilGeo, this.matStreamFoam);
    impactBoil.rotation.x = -Math.PI * 0.5;
    impactBoil.position.set(wfX + Math.sin(wfRotY) * 3.8, wfPoolY + 0.20, wfZ + Math.cos(wfRotY) * 3.8);
    fallsGroup.add(impactBoil);

    // Natural ring of wet granite boulders framing the plunge pool
    for (let r = 0; r < 14; r++) {
      const angle = (r / 14) * Math.PI * 2;
      const bDist = 11.2 + ((r * 7) % 5) * 0.6;
      const bx = poolCenter.x + Math.cos(angle) * bDist;
      const bz = poolCenter.z + Math.sin(angle) * bDist;
      const by = this.splineRoad.getGroundElevation(bx, bz);
      const bGeo = new THREE.DodecahedronGeometry(1.2 + (r % 3) * 0.45, 1);
      const bMat = (r % 2 === 0) ? this.matWetGranite : this.matRiverPebble;
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(bx, by + 0.5, bz);
      bMesh.scale.set(1.4, 0.8, 1.2);
      bMesh.rotation.set((r * 1.3) % 3, (r * 2.1) % 3, 0.2);
      bMesh.castShadow = true;
      fallsGroup.add(bMesh);
    }

    // ── Volumetric Soft Gaussian Mist Clouds (Zero Cardboard Edges) ─────────
    const cougarMistConfigs = [
      { offX: 3.8, offZ: 3.8, y: wfPoolY + 2.5,  w: 12.0, h: 8.0,  phase: 0.0 },
      { offX: 5.5, offZ: 5.5, y: wfPoolY + 4.5,  w: 15.0, h: 10.0, phase: 1.2 },
      { offX: 2.5, offZ: 2.5, y: wfPoolY + 1.8,  w: 10.0, h: 7.0,  phase: 2.4 },
      { offX: 1.4, offZ: 1.4, y: wfMidY + 1.5,   w: 11.0, h: 7.5,  phase: 3.6 },
      { offX: 4.8, offZ: 4.8, y: wfPoolY + 7.0,  w: 16.0, h: 11.0, phase: 4.8 }
    ];

    cougarMistConfigs.forEach((cfg) => {
      const mistGeo = new THREE.PlaneGeometry(cfg.w, cfg.h);
      const mist = new THREE.Mesh(mistGeo, this.matWaterfallSpray);
      const mx = wfX + Math.sin(wfRotY) * cfg.offX;
      const mz = wfZ + Math.cos(wfRotY) * cfg.offZ;
      mist.position.set(mx, cfg.y, mz);
      mist.rotation.y = wfRotY + (Math.sin(cfg.phase) * 0.25);
      fallsGroup.add(mist);
      this.waterfallMistPlanes.push({
        mesh: mist,
        baseY: cfg.y,
        phase: cfg.phase
      });
    });

    deepTrailGroup.add(fallsGroup);

    // =========================================================================
    // 7C: BOULDER CANYON TECHNICAL ROCK CRAWL ARENA (t ≈ 0.44, indices ~105-120)
    // =========================================================================
    [106, 110, 114, 118].forEach((idx, bIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];

      const bRad = 1.6 + (bIdx % 3) * 0.3;
      const bSide = (bIdx % 2 === 0) ? -1 : 1;
      const bX = sp.pos.x + norm.x * (bSide * 3.6);
      const bZ = sp.pos.z + norm.z * (bSide * 3.6);
      const bY = this.splineRoad.getGroundElevation(bX, bZ);

      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(bRad, 1), this.matGraniteGray);
      boulder.position.set(bX, bY + bRad * 0.40, bZ);
      boulder.scale.set(1.35, 0.75, 1.15);
      boulder.rotation.set((bIdx * 1.4) % 3, (bIdx * 2.2) % 3, 0.2);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      trailGroup.add(boulder);

      const scuff = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 1.2), this.matTireScuff);
      scuff.position.set(bX - norm.x * (bSide * (bRad * 0.45)), bY + bRad * 0.38, bZ - norm.z * (bSide * (bRad * 0.45)));
      scuff.rotation.y = Math.atan2(dir.x, dir.z);
      trailGroup.add(scuff);

      // Natural granite climbing approach wedge
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.6), this.matGraniteGray);
      ramp.position.set(sp.pos.x + norm.x * (bSide * 2.4), sp.pos.y + 0.16, sp.pos.z);
      ramp.rotation.y = Math.atan2(dir.x, dir.z);
      ramp.rotation.x = 0.20;
      ramp.castShadow = true;
      trailGroup.add(ramp);
    });

    // Boulder Canyon Line-Choice Directional Signboard
    const sledgeSp = spinePoints[102];
    const sledgeFrame = trailFrames[102];
    const sledgeGroup = new THREE.Group();
    const sledgeX = sledgeSp.pos.x - sledgeFrame.norm.x * 4.8;
    const sledgeZ = sledgeSp.pos.z - sledgeFrame.norm.z * 4.8;
    const sledgeY = this.splineRoad.getGroundElevation(sledgeX, sledgeZ);
    sledgeGroup.position.set(sledgeX, sledgeY, sledgeZ);
    // Face oncoming uphill traffic (angled inward toward driver approach)
    sledgeGroup.rotation.y = Math.atan2(sledgeFrame.dir.x, sledgeFrame.dir.z) + Math.PI + 0.25;

    // Rear timber posts behind the board
    [-1.8, 1.8].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.8, 8), this.matWoodPole);
      p.position.set(px, 1.8, -0.12);
      p.castShadow = true;
      sledgeGroup.add(p);
    });

    const sledgeSignBoard = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.3, 0.14), this.matWoodSignBrown);
    sledgeSignBoard.position.y = 2.5;
    sledgeSignBoard.castShadow = true;
    sledgeGroup.add(sledgeSignBoard);

    // Front face plaque (facing uphill climbers - large high-contrast lettering)
    const sledgePlaque = trailSign('SLEDGEHAMMER BOULDER CRAWL', 'DIFFICULT OBSTACLE • RIGHT FOR EASY BYPASS', 5.4, '#991b1b');
    sledgePlaque.position.set(0, 2.5, 0.08);
    sledgeGroup.add(sledgePlaque);

    // Reverse face plaque (facing descending drivers)
    const sledgePlaqueBack = trailSign('SLEDGEHAMMER BOULDER GARDEN', 'CAUTION: ROCK LEDGES • LOW GEAR', 5.4, '#991b1b');
    sledgePlaqueBack.position.set(0, 2.5, -0.08);
    sledgePlaqueBack.rotation.y = Math.PI;
    sledgeGroup.add(sledgePlaqueBack);

    trailGroup.add(sledgeGroup);

    // =========================================================================
    // 7D: THUNDER CANYON & ROARING THUNDER FALLS (t ≈ 0.53, indices ~130-145)
    // =========================================================================
    // The jewel of the expedition: a massive, towering 3-tier mountain waterfall!
    const thunderGroup = new THREE.Group();
    thunderGroup.name = 'ThunderFallsGrandCascade';

    const tfTrans = this.splineRoad.getRoadTransformAtZ(3025.0, -275.0, 0);
    const tfX = tfTrans.pos.x;
    const tfZ = tfTrans.pos.z;
    const tfPoolY = 35.0;
    const tfLowY = 42.0;
    const tfMidY = 48.0;
    const tfTopY = 65.0;

    const tfTurnSp = spinePoints[136];
    const tfTurnFrame = trailFrames[136];

    // Angle pointing from Thunder Falls towards the overlook trailbed (tfTurnSp)
    const tfDirX = tfTurnSp.pos.x - tfX;
    const tfDirZ = tfTurnSp.pos.z - tfZ;
    const tfRotY = Math.atan2(tfDirX, tfDirZ);

    // Massive Red Rock & Granite Canyon Amphitheater Bluff
    const thunderBluff = new THREE.Mesh(
      new THREE.CylinderGeometry(24, 32, 38, 16, 1, false, -0.6, Math.PI * 0.95),
      this.matMesaRed
    );
    thunderBluff.position.set(tfX - Math.sin(tfRotY) * 8.0, (tfTopY + tfPoolY) * 0.5, tfZ - Math.cos(tfRotY) * 8.0);
    thunderBluff.rotation.y = tfRotY + Math.PI;
    thunderBluff.castShadow = true;
    thunderGroup.add(thunderBluff);

    // Wet rock wall backing behind falling cascades
    const tfWetCliff = new THREE.Mesh(new THREE.PlaneGeometry(16.0, tfTopY - tfPoolY + 4.0), this.matWetGranite);
    tfWetCliff.position.set(tfX - Math.sin(tfRotY) * 1.0, (tfTopY + tfPoolY) * 0.5, tfZ - Math.cos(tfRotY) * 1.0);
    tfWetCliff.rotation.y = tfRotY;
    thunderGroup.add(tfWetCliff);

    // ── Tier 1: Upper Mountain Plunge (65m -> 48m, 17m drop) ───────────────────
    const tH1 = tfTopY - tfMidY;

    // Curved crest roll-over lip
    const tfCrestLip = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 9.5, 12, 1, true, -Math.PI * 0.5, Math.PI * 0.5),
      this.matWaterfallWater
    );
    tfCrestLip.position.set(tfX - Math.sin(tfRotY) * 1.2, tfTopY, tfZ - Math.cos(tfRotY) * 1.2);
    tfCrestLip.rotation.y = tfRotY;
    tfCrestLip.rotation.z = Math.PI * 0.5;
    thunderGroup.add(tfCrestLip);

    const tInner1 = new THREE.Mesh(new THREE.PlaneGeometry(8.5, tH1), this.matWaterfallWaterInner);
    tInner1.position.set(tfX - Math.sin(tfRotY) * 0.2, tfMidY + tH1 * 0.5, tfZ - Math.cos(tfRotY) * 0.2);
    tInner1.rotation.y = tfRotY;
    thunderGroup.add(tInner1);

    const tSheet1 = new THREE.Mesh(new THREE.PlaneGeometry(10.0, tH1), this.matWaterfallWater);
    tSheet1.position.set(tfX, tfMidY + tH1 * 0.5, tfZ);
    tSheet1.rotation.y = tfRotY;
    thunderGroup.add(tSheet1);

    // Tier 1 Shelf Splash Rock & Churning Pool
    const tShelf1 = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5, 1), this.matWetGranite);
    tShelf1.position.set(tfX + Math.sin(tfRotY) * 2.0, tfMidY - 1.2, tfZ + Math.cos(tfRotY) * 2.0);
    tShelf1.scale.set(2.0, 0.6, 1.4);
    tShelf1.castShadow = true;
    thunderGroup.add(tShelf1);

    const tBoil1 = new THREE.Mesh(new THREE.CircleGeometry(5.2, 16), this.matWaterfallRipple);
    tBoil1.rotation.x = -Math.PI * 0.5;
    tBoil1.position.set(tfX + Math.sin(tfRotY) * 2.0, tfMidY + 0.35, tfZ + Math.cos(tfRotY) * 2.0);
    thunderGroup.add(tBoil1);

    // ── Tier 2: Mid Cascading Sheet (48m -> 42m, 6m drop) ─────────────────────
    const tH2 = tfMidY - tfLowY;
    const tInner2 = new THREE.Mesh(new THREE.PlaneGeometry(10.8, tH2), this.matWaterfallWaterInner);
    tInner2.position.set(tfX + Math.sin(tfRotY) * 3.0, tfLowY + tH2 * 0.5, tfZ + Math.cos(tfRotY) * 3.0);
    tInner2.rotation.y = tfRotY;
    thunderGroup.add(tInner2);

    const tSheet2 = new THREE.Mesh(new THREE.PlaneGeometry(12.5, tH2), this.matWaterfallWater);
    tSheet2.position.set(tfX + Math.sin(tfRotY) * 3.3, tfLowY + tH2 * 0.5, tfZ + Math.cos(tfRotY) * 3.3);
    tSheet2.rotation.y = tfRotY;
    thunderGroup.add(tSheet2);

    // Tier 2 Shelf Splash Rock
    const tShelf2 = new THREE.Mesh(new THREE.DodecahedronGeometry(7.2, 1), this.matWetGranite);
    tShelf2.position.set(tfX + Math.sin(tfRotY) * 4.2, tfLowY - 1.2, tfZ + Math.cos(tfRotY) * 4.2);
    tShelf2.scale.set(2.2, 0.6, 1.4);
    tShelf2.castShadow = true;
    thunderGroup.add(tShelf2);

    // ── Tier 3: Lower Roaring Plunge (42m -> 35m, 7m drop) ────────────────────
    const tH3 = tfLowY - tfPoolY;
    const tInner3 = new THREE.Mesh(new THREE.PlaneGeometry(13.2, tH3), this.matWaterfallWaterInner);
    tInner3.position.set(tfX + Math.sin(tfRotY) * 5.0, tfPoolY + tH3 * 0.5, tfZ + Math.cos(tfRotY) * 5.0);
    tInner3.rotation.y = tfRotY;
    thunderGroup.add(tInner3);

    const tSheet3 = new THREE.Mesh(new THREE.PlaneGeometry(15.5, tH3), this.matWaterfallWater);
    tSheet3.position.set(tfX + Math.sin(tfRotY) * 5.4, tfPoolY + tH3 * 0.5, tfZ + Math.cos(tfRotY) * 5.4);
    tSheet3.rotation.y = tfRotY;
    thunderGroup.add(tSheet3);

    // ── Thunder Falls Plunge Pool (26m diameter turquoise mountain pool) ────────
    const tPoolCenter = new THREE.Vector3(tfX + Math.sin(tfRotY) * 10.2, tfPoolY + 0.12, tfZ + Math.cos(tfRotY) * 10.2);

    const tPoolMesh = new THREE.Mesh(new THREE.CircleGeometry(14.0, 32), this.matStreamWater);
    tPoolMesh.rotation.x = -Math.PI * 0.5;
    tPoolMesh.position.copy(tPoolCenter);
    tPoolMesh.receiveShadow = true;
    thunderGroup.add(tPoolMesh);

    // Expanding concentric wave ripples
    const tPoolRipples = new THREE.Mesh(new THREE.PlaneGeometry(28.0, 28.0), this.matWaterfallRipple);
    tPoolRipples.rotation.x = -Math.PI * 0.5;
    tPoolRipples.position.set(tPoolCenter.x, tPoolCenter.y + 0.05, tPoolCenter.z);
    thunderGroup.add(tPoolRipples);

    // Churning hydraulic impact boil foam
    const tImpactBoil = new THREE.Mesh(new THREE.CircleGeometry(6.2, 20), this.matStreamFoam);
    tImpactBoil.rotation.x = -Math.PI * 0.5;
    tImpactBoil.position.set(tfX + Math.sin(tfRotY) * 7.2, tfPoolY + 0.18, tfZ + Math.cos(tfRotY) * 7.2);
    thunderGroup.add(tImpactBoil);

    // Ring of wet granite boulders framing the plunge pool
    for (let r = 0; r < 16; r++) {
      const angle = (r / 16) * Math.PI * 2;
      const bDist = 12.8 + ((r * 5) % 4) * 0.7;
      const bx = tPoolCenter.x + Math.cos(angle) * bDist;
      const bz = tPoolCenter.z + Math.sin(angle) * bDist;
      const by = this.splineRoad.getGroundElevation(bx, bz);
      const bMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 + (r % 3) * 0.5, 1), (r % 2 === 0) ? this.matWetGranite : this.matGraniteGray);
      bMesh.position.set(bx, by + 0.6, bz);
      bMesh.scale.set(1.4, 0.8, 1.2);
      bMesh.rotation.set((r * 1.5) % 3, (r * 2.3) % 3, 0.15);
      bMesh.castShadow = true;
      thunderGroup.add(bMesh);
    }

    // ── Rising Mist Cloud Spray Planes (Gaussian Soft-Radial) ───────────────────
    const thunderMistConfigs = [
      { offX: 6.0,  offZ: 6.0,  y: tfPoolY + 3.0,  w: 16.0, h: 10.0, phase: 0.2 },
      { offX: 8.5,  offZ: 8.5,  y: tfPoolY + 5.5,  w: 19.0, h: 12.0, phase: 1.4 },
      { offX: 4.2,  offZ: 4.2,  y: tfPoolY + 2.0,  w: 13.0, h: 8.5,  phase: 2.6 },
      { offX: 2.8,  offZ: 2.8,  y: tfMidY + 2.0,   w: 14.0, h: 9.0,  phase: 3.8 },
      { offX: 7.0,  offZ: 7.0,  y: tfPoolY + 8.5,  w: 20.0, h: 13.0, phase: 5.0 },
      { offX: 10.0, offZ: 10.0, y: tfPoolY + 11.0, w: 22.0, h: 14.0, phase: 0.8 }
    ];

    thunderMistConfigs.forEach(cfg => {
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, cfg.h), this.matWaterfallSpray);
      const mx = tfX + Math.sin(tfRotY) * cfg.offX;
      const mz = tfZ + Math.cos(tfRotY) * cfg.offZ;
      mist.position.set(mx, cfg.y, mz);
      mist.rotation.y = tfRotY + (Math.sin(cfg.phase) * 0.2);
      thunderGroup.add(mist);
      this.waterfallMistPlanes.push({
        mesh: mist,
        baseY: cfg.y,
        phase: cfg.phase
      });
    });

    // ── Thunder Falls Vista Overlook Deck (Spine point 136, lat: -250, z: 1450) ──
    const tfCribX = tfTurnSp.pos.x - tfTurnFrame.norm.x * 8.5;
    const tfCribZ = tfTurnSp.pos.z - tfTurnFrame.norm.z * 8.5;
    const tfCribY = this.splineRoad.getGroundElevation(tfCribX, tfCribZ);
    const tfHeading = Math.atan2(tfTurnFrame.dir.x, tfTurnFrame.dir.z);

    // Low rustic stone curb foundation (0.45m high, 0.55m wide)
    const tfCurb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 14.0), this.matGraniteGray);
    tfCurb.position.set(tfCribX, tfCribY + 0.22, tfCribZ);
    tfCurb.rotation.y = tfHeading;
    tfCurb.castShadow = true;
    tfCurb.receiveShadow = true;
    thunderGroup.add(tfCurb);

    // Rustic vertical timber posts (spaced along the deck)
    [-5.5, -2.75, 0, 2.75, 5.5].forEach(postOff => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.15, 6), this.matWoodPole);
      post.position.set(tfCribX + tfTurnFrame.dir.x * postOff, tfCribY + 0.55, tfCribZ + tfTurnFrame.dir.z * postOff);
      post.castShadow = true;
      thunderGroup.add(post);
    });

    // Lower rustic peeled log rail
    const tfLowerRail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 14.0, 6), this.matWoodPole);
    tfLowerRail.position.set(tfCribX, tfCribY + 0.65, tfCribZ);
    tfLowerRail.rotation.x = Math.PI * 0.5;
    tfLowerRail.rotation.y = tfHeading;
    tfLowerRail.castShadow = true;
    thunderGroup.add(tfLowerRail);

    // Upper rustic peeled log handrail (1.05m height - open panoramic sightline!)
    const tfUpperRail = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 14.0, 6), this.matWoodPole);
    tfUpperRail.position.set(tfCribX, tfCribY + 1.05, tfCribZ);
    tfUpperRail.rotation.x = Math.PI * 0.5;
    tfUpperRail.rotation.y = tfHeading;
    tfUpperRail.castShadow = true;
    thunderGroup.add(tfUpperRail);


    // Framing Alpine Pines around Thunder Falls Amphitheater
    [
      { dx: -10, dz: -12, h: 12.0 },
      { dx: 16,  dz: 6,   h: 11.5 },
      { dx: 18,  dz: -16, h: 13.0 },
      { dx: -14, dz: 10,  h: 10.5 },
      { dx: -22, dz: -8,  h: 14.0 },
      { dx: 24,  dz: -6,  h: 12.5 },
      { dx: -18, dz: -22, h: 13.5 },
      { dx: 12,  dz: -26, h: 11.0 },
      { dx: -8,  dz: 16,  h: 10.0 },
      { dx: 22,  dz: 14,  h: 11.8 }
    ].forEach((pCfg) => {
      const pine = new THREE.Group();
      const px = tfX + pCfg.dx;
      const pz = tfZ + pCfg.dz;
      const py = this.splineRoad.getGroundElevation(px, pz);
      pine.position.set(px, py, pz);

      const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.52, pCfg.h * 0.5, 6), this.matJoshuaTrunk);
      pTrunk.position.y = pCfg.h * 0.25;
      pTrunk.castShadow = true;
      pine.add(pTrunk);

      for (let t = 0; t < 3; t++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4 - t * 0.7, 3.8, 7), (pCfg.h > 12 ? this.matPineNeedlesAlt : this.matPineNeedles));
        cone.position.y = pCfg.h * 0.35 + t * 2.6;
        cone.castShadow = true;
        pine.add(cone);
      }
      thunderGroup.add(pine);
    });

    deepTrailGroup.add(thunderGroup);

    // =========================================================================
    // 7E: THUNDER CREEK WATERFALL FORD & STEP CASCADES (t ≈ 0.62, indices ~155-165)
    // =========================================================================
    // The outflow from Thunder Falls rushes across the trailbed in an exciting water crossing!
    const thunderFordGroup = new THREE.Group();
    thunderFordGroup.name = 'ThunderCreekFord';

    const tcSp = spinePoints[160];
    const tcFrame = trailFrames[160];

    // Wide water crossing ford contoured to ground elevation across trailbed
    const tcNormDir = tcFrame.norm;
    const tcFwdDir = tcFrame.dir;
    const tcFordW = 40.0;
    const tcFordL = 48.0;
    const tcFordSegX = 18;
    const tcFordSegZ = 20;
    const tcVertices = [];
    const tcUvs = [];
    const tcIndices = [];

    for (let iz = 0; iz <= tcFordSegZ; iz++) {
      const fracZ = (iz / tcFordSegZ) - 0.5;
      const offZ = fracZ * tcFordL;
      for (let ix = 0; ix <= tcFordSegX; ix++) {
        const fracX = (ix / tcFordSegX) - 0.5;
        const offX = fracX * tcFordW;

        const wx = tcSp.pos.x + tcNormDir.x * offZ + tcFwdDir.x * offX;
        const wz = tcSp.pos.z + tcNormDir.z * offZ + tcFwdDir.z * offX;
        const gy = this.splineRoad.getGroundElevation(wx, wz);

        const edgeDistX = 1.0 - Math.abs(fracX * 2.0);
        const edgeDistZ = 1.0 - Math.abs(fracZ * 2.0);
        const edgeFade = Math.min(edgeDistX, edgeDistZ);
        const waterRise = 0.15 + edgeFade * 0.17;

        tcVertices.push(wx, gy + waterRise, wz);
        tcUvs.push(ix / tcFordSegX, (iz / tcFordSegZ) * 3.5);
      }
    }

    for (let iz = 0; iz < tcFordSegZ; iz++) {
      for (let ix = 0; ix < tcFordSegX; ix++) {
        const a = iz * (tcFordSegX + 1) + ix;
        const b = a + 1;
        const c = a + (tcFordSegX + 1);
        const d = c + 1;
        tcIndices.push(a, b, c);
        tcIndices.push(b, d, c);
      }
    }

    const tcFordGeo = new THREE.BufferGeometry();
    tcFordGeo.setAttribute('position', new THREE.Float32BufferAttribute(tcVertices, 3));
    tcFordGeo.setAttribute('uv', new THREE.Float32BufferAttribute(tcUvs, 2));
    tcFordGeo.setIndex(tcIndices);
    tcFordGeo.computeVertexNormals();

    const tcFordMesh = new THREE.Mesh(tcFordGeo, this.matStreamWater);
    tcFordMesh.receiveShadow = true;
    thunderFordGroup.add(tcFordMesh);

    // Rapids foam across the ford thresholds (upstream and downstream)
    [-17.0, 17.0].forEach(sideDist => {
      const fx = tcSp.pos.x + tcNormDir.x * sideDist;
      const fz = tcSp.pos.z + tcNormDir.z * sideDist;
      const fy = this.splineRoad.getGroundElevation(fx, fz) + 0.09;
      const tcFoam = new THREE.Mesh(new THREE.PlaneGeometry(34.0, 4.4), this.matStreamFoam);
      tcFoam.rotation.x = -Math.PI * 0.5;
      tcFoam.rotation.z = Math.atan2(tcFwdDir.x, tcFwdDir.z);
      tcFoam.position.set(fx, fy, fz);
      thunderFordGroup.add(tcFoam);
    });

    // Connecting outflow river ribbon from Thunder Falls plunge pool down into the ford
    const tcp1 = this.splineRoad.getRoadTransformAtZ(2970, -280, 0).pos;
    const tcp3 = this.splineRoad.getRoadTransformAtZ(2880, -298, 0).pos;
    const tcp4 = this.splineRoad.getRoadTransformAtZ(2830, -310, 0).pos;
    const tcRibbonPoints = [
      new THREE.Vector3(tfX + Math.sin(tfRotY) * 9.5, tfPoolY + 0.12, tfZ + Math.cos(tfRotY) * 9.5),
      new THREE.Vector3(tcp1.x, this.splineRoad.getGroundElevation(tcp1.x, tcp1.z) + 0.10, tcp1.z),
      new THREE.Vector3(tcSp.pos.x, tcSp.pos.y + 0.10, tcSp.pos.z),
      new THREE.Vector3(tcp3.x, this.splineRoad.getGroundElevation(tcp3.x, tcp3.z) + 0.10, tcp3.z),
      new THREE.Vector3(tcp4.x, this.splineRoad.getGroundElevation(tcp4.x, tcp4.z) + 0.08, tcp4.z)
    ];

    thunderFordGroup.add(terrainRibbon(this.splineRoad, tcRibbonPoints, 15.5, this.matWetGranite, 0.045, 'ThunderCreekWetBanks'));
    thunderFordGroup.add(terrainRibbon(this.splineRoad, tcRibbonPoints, 10.8, this.matStreamWater, 0.20, 'ThunderCreekContinuousWater'));

    // Riverbed boulders lining the banks of Thunder Creek flanking the ford
    const tcRiverStones = [
      // Left riverbank boulders
      { offX: -5.8, offZ: -3.0, rad: 1.7, h: 0.68 },
      { offX: -6.4, offZ: 2.0,  rad: 1.8, h: 0.72 },
      { offX: -5.6, offZ: -6.5, rad: 1.4, h: 0.52 },
      // Right riverbank boulders
      { offX: 6.0,  offZ: -2.0, rad: 1.8, h: 0.72 },
      { offX: 5.8,  offZ: 4.0,  rad: 1.6, h: 0.65 },
      { offX: 6.2,  offZ: 7.5,  rad: 1.5, h: 0.58 }
    ];

    tcRiverStones.forEach((st, sIdx) => {
      const stoneMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(st.rad, 1),
        sIdx % 2 === 0 ? this.matWetGranite : this.matRiverPebble
      );
      stoneMesh.position.set(tcSp.pos.x + st.offX, tcSp.pos.y + st.h * 0.40, tcSp.pos.z + st.offZ);
      stoneMesh.scale.set(1.4, 0.7, 1.2);
      stoneMesh.rotation.set(0.15, sIdx * 1.4, 0.1);
      stoneMesh.castShadow = true;
      stoneMesh.receiveShadow = true;
      thunderFordGroup.add(stoneMesh);

      // Hydraulic eddy wake foam downstream of each stone
      const eddy = new THREE.Mesh(new THREE.PlaneGeometry(st.rad * 2.2, st.rad * 1.5), this.matStreamFoam);
      eddy.rotation.x = -Math.PI * 0.5;
      eddy.position.set(tcSp.pos.x + st.offX, tcSp.pos.y + 0.11, tcSp.pos.z + st.offZ + st.rad * 0.85);
      thunderFordGroup.add(eddy);
    });

    // Step cascades beside the trail
    for (let sc = 0; sc < 3; sc++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.7, 4.0), this.matGraniteGray);
      stepMesh.position.set(tcSp.pos.x + tcFrame.norm.x * (10.0 + sc * 4.5), tcSp.pos.y - sc * 0.65, tcSp.pos.z + tcFrame.norm.z * (10.0 + sc * 4.5));
      stepMesh.castShadow = true;
      thunderFordGroup.add(stepMesh);

      const stepWater = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 3.6), this.matStreamWater);
      stepWater.rotation.x = -Math.PI * 0.5;
      stepWater.position.set(stepMesh.position.x, stepMesh.position.y + 0.38, stepMesh.position.z);
      thunderFordGroup.add(stepWater);
    }

    // Lush riparian trees framing Thunder Creek Ford
    const tcFordTrees = [
      { sideOff: -11.0, fwd: -4.0, type: 'willow', h: 7.2 },
      { sideOff: 11.5,  fwd: -2.5, type: 'willow', h: 7.5 },
      { sideOff: -12.5, fwd: 6.5,  type: 'alder',  h: 8.0 },
      { sideOff: 13.0,  fwd: 7.5,  type: 'pine',   h: 11.0 },
      { sideOff: -16.0, fwd: 12.0, type: 'pine',   h: 12.0 },
      { sideOff: 15.5,  fwd: -10.0,type: 'alder',  h: 8.5 }
    ];

    tcFordTrees.forEach((tCfg) => {
      const tree = new THREE.Group();
      const tx = tcSp.pos.x + tcFrame.norm.x * tCfg.sideOff + tcFrame.dir.x * tCfg.fwd;
      const tz = tcSp.pos.z + tcFrame.norm.z * tCfg.sideOff + tcFrame.dir.z * tCfg.fwd;
      const ty = this.splineRoad.getGroundElevation(tx, tz);
      tree.position.set(tx, ty, tz);

      if (tCfg.type === 'willow') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.40, tCfg.h * 0.46, 6), this.matWoodPole);
        trunk.position.y = tCfg.h * 0.23;
        trunk.rotation.z = (tCfg.sideOff > 0 ? -0.16 : 0.16);
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 1.8, 3.2, 8), this.matWillowFoliage);
        crown.position.y = tCfg.h * 0.62;
        crown.castShadow = true;
        tree.add(crown);
      } else if (tCfg.type === 'alder') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, tCfg.h * 0.48, 6), this.matWoodPole);
        trunk.position.y = tCfg.h * 0.24;
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), this.matAlderFoliage);
        crown.position.y = tCfg.h * 0.68;
        crown.scale.set(1.2, 1.35, 1.15);
        crown.castShadow = true;
        tree.add(crown);
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.48, tCfg.h * 0.5, 6), this.matJoshuaTrunk);
        trunk.position.y = tCfg.h * 0.25;
        trunk.castShadow = true;
        tree.add(trunk);

        for (let c = 0; c < 3; c++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4 - c * 0.7, 3.8, 7), this.matPineNeedlesAlt);
          cone.position.y = tCfg.h * 0.35 + c * 2.5;
          cone.castShadow = true;
          tree.add(cone);
        }
      }
      thunderFordGroup.add(tree);
    });

    // Crossing warning signposts
    [-1, 1].forEach(side => {
      const post = new THREE.Group();
      const px = tcSp.pos.x + tcFrame.norm.x * (side * 7.5);
      const pz = tcSp.pos.z + tcFrame.norm.z * (side * 7.5);
      const py = this.splineRoad.getGroundElevation(px, pz);
      post.position.set(px, py, pz);
      post.rotation.y = Math.atan2(tcFrame.dir.x, tcFrame.dir.z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.6, 6), this.matWoodPole);
      pole.position.y = 1.3;
      post.add(pole);

      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.12), this.matTrailReflectorOrange);
      sign.position.y = 2.0;
      post.add(sign);
      thunderFordGroup.add(post);
    });

    deepTrailGroup.add(thunderFordGroup);

    // =========================================================================
    // 7F: DEVIL'S BACKBONE KNIFE-EDGE ALPINE RIDGE (t ≈ 0.72, indices ~180-190)
    // =========================================================================
    [180, 185, 190].forEach((idx, kIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];

      [-1, 1].forEach(side => {
        const bRad = 0.95 + (kIdx % 2) * 0.35;
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(bRad, 1), this.matDesertBoulder);
        const cx = sp.pos.x + norm.x * (side * 4.8);
        const cz = sp.pos.z + norm.z * (side * 4.8);
        const cy = this.splineRoad.getGroundElevation(cx, cz);
        stone.position.set(cx, cy + bRad * 0.45, cz);
        stone.castShadow = true;
        trailGroup.add(stone);
      });
    });

    // =========================================================================
    // 7G: DEVIL'S SHELF CASCADING WATERFALL ROCK LEDGES (t ≈ 0.81, indices ~200-215)
    // =========================================================================
    [202, 206, 210, 214].forEach((idx, shelfIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const slabW = 9.8;
      const slabLen = 4.8;
      const slabH = 0.65;

      // Heavy granite ledge tier (dark wet mountain granite)
      const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(slabW, slabH, slabLen), this.matWetGranite);
      slabMesh.position.set(sp.pos.x, sp.pos.y + slabH * 0.35, sp.pos.z);
      slabMesh.rotation.y = Math.atan2(dir.x, dir.z);
      slabMesh.rotation.x = 0.14;
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      trailGroup.add(slabMesh);

      // Rubber tire climb scuff mark on ledge face
      const scuffMesh = new THREE.Mesh(new THREE.BoxGeometry(slabW * 0.7, 0.12, 0.6), this.matTireScuff);
      scuffMesh.position.set(sp.pos.x, sp.pos.y + slabH * 0.42, sp.pos.z + 0.3);
      scuffMesh.rotation.y = Math.atan2(dir.x, dir.z);
      trailGroup.add(scuffMesh);

      // Glistening wet stone trickle sheet on rock shelf
      const trickleMesh = new THREE.Mesh(new THREE.PlaneGeometry(slabW * 0.75, slabLen * 0.65), this.matStreamWater);
      trickleMesh.rotation.x = -Math.PI * 0.5;
      trickleMesh.position.set(sp.pos.x, sp.pos.y + slabH * 0.52, sp.pos.z);
      trickleMesh.rotation.z = Math.atan2(dir.x, dir.z);
      trailGroup.add(trickleMesh);

      // Flanking canyon boulders
      [-1, 1].forEach(side => {
        const bRad = 2.6 + ((shelfIdx * 3 + side) % 3) * 0.5;
        const bMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(bRad, 1), this.matDesertBoulder);
        const bx = sp.pos.x + norm.x * (side * (slabW * 0.5 + bRad * 0.75));
        const bz = sp.pos.z + norm.z * (side * (slabW * 0.5 + bRad * 0.75));
        const by = this.splineRoad.getGroundElevation(bx, bz);
        bMesh.position.set(bx, by + bRad * 0.55, bz);
        bMesh.scale.set(1.2, 0.9, 1.1);
        bMesh.castShadow = true;
        trailGroup.add(bMesh);
      });

      if (shelfIdx < 2) {
        const winchPost = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 1.3, 8), this.matCastIronDark);
        const wpx = sp.pos.x + norm.x * 5.4;
        const wpz = sp.pos.z + norm.z * 5.4;
        winchPost.position.set(wpx, this.splineRoad.getGroundElevation(wpx, wpz) + 0.65, wpz);
        winchPost.castShadow = true;
        trailGroup.add(winchPost);

        const winchRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), this.matWinchOrange);
        winchRing.position.set(wpx, this.splineRoad.getGroundElevation(wpx, wpz) + 1.25, wpz);
        winchRing.rotation.x = Math.PI * 0.5;
        trailGroup.add(winchRing);
      }
    });

    // =========================================================================
    // 7H: HANGING VALLEY PONDEROSA PINE FOREST (t ≈ 0.90, indices ~225-240)
    // =========================================================================
    [226, 232, 238].forEach((idx, pIdx) => {
      const sp = spinePoints[idx];
      const { norm } = trailFrames[idx];

      [-7.5, 8.0].forEach((sideOff, sIdx) => {
        const pine = new THREE.Group();
        const px = sp.pos.x + norm.x * sideOff;
        const pz = sp.pos.z + norm.z * sideOff;
        const py = this.splineRoad.getGroundElevation(px, pz);
        pine.position.set(px, py, pz);

        const pH = 9.0 + (pIdx * 2 + sIdx) * 1.2;
        const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.45, pH * 0.5, 6), this.matJoshuaTrunk);
        pTrunk.position.y = pH * 0.25;
        pTrunk.castShadow = true;
        pine.add(pTrunk);

        for (let t = 0; t < 3; t++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(2.8 - t * 0.6, 3.2, 7), this.matPineNeedles);
          cone.position.y = pH * 0.35 + t * 2.2;
          cone.castShadow = true;
          pine.add(cone);
        }
        trailGroup.add(pine);
      });
    });

    // Mountain Pass Elevation Signboard
    // Section sign: "EAGLE PASS • ELEV 4,850 FT"
    const passSp = spinePoints[230];
    const passFrame = trailFrames[230];
    const passSign = new THREE.Group();
    passSign.name = 'TrailSign_EaglePass';
    const passX = passSp.pos.x + passFrame.norm.x * 4.6;
    const passZ = passSp.pos.z + passFrame.norm.z * 4.6;
    const passY = this.splineRoad.getGroundElevation(passX, passZ);
    passSign.position.set(passX, passY, passZ);
    // Face approaching uphill traffic (rotated toward approaching vehicle):
    passSign.rotation.y = Math.atan2(passFrame.dir.x, passFrame.dir.z) + Math.PI - 0.28;

    // Heavy timber mounting posts strictly BEHIND the board
    [-1.8, 1.8].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.8, 8), this.matWoodPole);
      post.position.set(px, 1.9, -0.12);
      post.castShadow = true;
      passSign.add(post);
    });

    const passBoard = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.3, 0.14), this.matWoodSignBrown);
    passBoard.position.y = 2.6;
    passBoard.castShadow = true;
    passSign.add(passBoard);

    // Front face plaque (facing uphill climbing drivers - large high-contrast lettering)
    const passPlaque = trailSign('EAGLE PASS', 'ELEVATION 4,850 FT • 4WD LOW GEAR', 5.4, '#163f39');
    passPlaque.position.set(0, 2.6, 0.08);
    passSign.add(passPlaque);

    // Reverse face plaque (facing descending drivers)
    const passPlaqueBack = trailSign('EAGLE PASS', 'ELEVATION 4,850 FT • STEEP DESCENT', 5.4, '#163f39');
    passPlaqueBack.position.set(0, 2.6, -0.08);
    passPlaqueBack.rotation.y = Math.PI;
    passSign.add(passPlaqueBack);

    trailGroup.add(passSign);


    // =========================================================================
    // 8. GRAND SUMMIT VISTA OBSERVATION OVERLOOK PLATFORM (Elev: 56.0m, Lat: -245m)
    // =========================================================================
    const summitSp = spinePoints[segments];

    const overlookGroup = new THREE.Group();
    overlookGroup.name = 'SummitObservationDeck';
    overlookGroup.position.set(summitSp.pos.x, summitSp.pos.y + 0.14, summitSp.pos.z);
    overlookGroup.rotation.y = 0.0; // Aligned with cardinal axes (+X=East/Route 66, -X=West/Surprise City)

    // Weathered Timber Observation Deck (dimensions: 26.0m x 18.0m, elevation on summit plateau)
    const deckGeo = new THREE.BoxGeometry(26.0, 0.35, 18.0);
    const deckMesh = new THREE.Mesh(deckGeo, this.matWoodSignBrown);
    deckMesh.position.set(0, 0.0, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    overlookGroup.add(deckMesh);

    // Foundation support timbers beneath the main deck
    for (let gx = -10.0; gx <= 10.0; gx += 5.0) {
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 18.0), this.matWoodPole);
      sleeper.position.set(gx, -0.4, 0);
      sleeper.castShadow = true;
      overlookGroup.add(sleeper);
    }

    // Cantilevered Cliff Rim Boardwalk leading to Western Desert Vista Promontory (Widened to 6.8m for vehicles)
    const boardwalkAngle = Math.atan2(-38.0, -28.0);
    const boardwalkLen = 47.5;
    const boardwalkGroup = new THREE.Group();
    boardwalkGroup.position.set(-19.0, 0.0, -14.0);
    boardwalkGroup.rotation.y = boardwalkAngle;

    // Main heavy timber driving deck
    const boardwalkMesh = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.38, boardwalkLen), this.matWoodSignBrown);
    boardwalkMesh.castShadow = true;
    boardwalkMesh.receiveShadow = true;
    boardwalkGroup.add(boardwalkMesh);

    // Timber wheel guide curbs along both sides
    [-3.2, 3.2].forEach(curbX => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.42, boardwalkLen), this.matWoodPole);
      curb.position.set(curbX, 0.32, 0);
      curb.castShadow = true;
      boardwalkGroup.add(curb);
    });

    // Guardrail posts along boardwalk flanks
    for (let bz = -boardwalkLen * 0.45; bz <= boardwalkLen * 0.45; bz += 4.5) {
      [-3.35, 3.35].forEach(sideX => {
        const bp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.25, 0.18), this.matWoodPole);
        bp.position.set(sideX, 0.72, bz);
        bp.castShadow = true;
        boardwalkGroup.add(bp);

        const topCap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), this.matTrailReflectorOrange);
        topCap.position.set(sideX, 1.36, bz);
        boardwalkGroup.add(topCap);
      });
    }
    // Continuous top and mid rails
    [-3.35, 3.35].forEach(sideX => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, boardwalkLen), this.matWoodPole);
      rail.position.set(sideX, 1.25, 0);
      boardwalkGroup.add(rail);
      const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, boardwalkLen), this.matWoodPole);
      midRail.position.set(sideX, 0.72, 0);
      boardwalkGroup.add(midRail);
    });

    // Structural timber trestle pylon bents supporting boardwalk into bedrock
    [-16.0, -8.0, 0.0, 8.0, 16.0].forEach(pz => {
      const bentHeight = 18.0;
      [-2.8, 2.8].forEach(px => {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, bentHeight, 8), this.matWoodPole);
        pylon.position.set(px, -bentHeight * 0.5, pz);
        pylon.castShadow = true;
        boardwalkGroup.add(pylon);
      });
      // Cap beam
      const capBeam = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.45, 0.45), this.matWoodPole);
      capBeam.position.set(0, -0.4, pz);
      boardwalkGroup.add(capBeam);
      // Diagonal cross brace
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 6.2), this.matWoodPole);
      brace.rotation.x = Math.PI * 0.5;
      brace.rotation.y = 0.65;
      brace.position.set(0, -bentHeight * 0.35, pz);
      boardwalkGroup.add(brace);
    });

    overlookGroup.add(boardwalkGroup);

    // Cantilevered Observation Promontory Deck perched directly over cliff edge (Widened to 6.8m radius)
    const promontoryRadius = 6.8;
    const promontoryMesh = new THREE.Mesh(new THREE.CylinderGeometry(promontoryRadius, promontoryRadius, 0.38, 24), this.matWoodSignBrown);
    promontoryMesh.position.set(-38.0, 0.0, -28.0);
    promontoryMesh.castShadow = true;
    promontoryMesh.receiveShadow = true;
    overlookGroup.add(promontoryMesh);

    // Heavy mountain rock foundation buttress directly under promontory
    const buttressHeight = 26.0;
    const promButtress = new THREE.Mesh(new THREE.CylinderGeometry(promontoryRadius * 0.95, promontoryRadius * 1.35, buttressHeight, 14), this.matMesaStrata);
    promButtress.position.set(-38.0, -buttressHeight * 0.5 - 0.15, -28.0);
    promButtress.castShadow = true;
    promButtress.receiveShadow = true;
    overlookGroup.add(promButtress);

    // Cantilever diagonal timber knee braces radiating outwards under promontory rim
    for (let ka = 0; ka < Math.PI * 2; ka += Math.PI * 0.33) {
      const kx = -38.0 + Math.cos(ka) * 4.6;
      const kz = -28.0 + Math.sin(ka) * 4.6;
      const kneeBrace = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.5, 0.35), this.matWoodPole);
      kneeBrace.position.set(kx, -3.2, kz);
      kneeBrace.rotation.y = ka;
      kneeBrace.rotation.z = Math.PI * 0.20;
      kneeBrace.castShadow = true;
      overlookGroup.add(kneeBrace);
    }

    // Promontory perimeter safety railing posts along outer cliff rim (open towards boardwalk approach)
    const railMat = this.matWoodPole;
    const fencePostGeo = new THREE.BoxGeometry(0.18, 1.25, 0.18);
    for (let a = 1.1; a < Math.PI * 1.85; a += 0.42) {
      const px = -38.0 + Math.cos(a) * (promontoryRadius - 0.3);
      const pz = -28.0 + Math.sin(a) * (promontoryRadius - 0.3);
      const post = new THREE.Mesh(fencePostGeo, railMat);
      post.position.set(px, 0.72, pz);
      post.castShadow = true;
      overlookGroup.add(post);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 0.12), railMat);
      rail.position.set(px, 1.22, pz);
      rail.rotation.y = a + Math.PI * 0.5;
      overlookGroup.add(rail);

      const midRail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.10, 0.10), railMat);
      midRail.position.set(px, 0.72, pz);
      midRail.rotation.y = a + Math.PI * 0.5;
      overlookGroup.add(midRail);
    }

    // The arrival/east edge is completely open to the gravel turning terrace.
    // Keep rails only at exposed cliff edges, not between summit activity zones.

    // 2. Back (Western Cliff Rim): Left open for seamless vehicle access into the Cougar Ridge Downhill Express Chute and the cantilevered boardwalk thoroughfare.


    // North edge flows straight into the open camp clearing; no interior fence.

    // 4. South Rail (z = -9.0, leaves open corner for boardwalk at x <= -5.0)
    const southRailTop = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.12, 0.12), railMat);
    southRailTop.position.set(4.0, 1.22, -9.0);
    overlookGroup.add(southRailTop);
    const southRailMid = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.10, 0.10), railMat);
    southRailMid.position.set(4.0, 0.72, -9.0);
    overlookGroup.add(southRailMid);
    for (let xf = -5.0; xf <= 13.0; xf += 3.6) {
      const ps = new THREE.Mesh(fencePostGeo, railMat);
      ps.position.set(xf, 0.72, -9.0);
      ps.castShadow = true;
      overlookGroup.add(ps);
    }

    // =========================================================================
    // OVERLAND EXPEDITION BASE CAMP & SUMMIT REGISTER (Campfire, Tent & Kiosk)
    // =========================================================================
    // 1. Stone Campfire Pit with Glowing Embers (North camp perimeter beside tent)
    const fireGroup = new THREE.Group();
    fireGroup.name = 'SummitCampfire';
    placeSummitProp(fireGroup, this.splineRoad, overlookGroup.position, SUMMIT_LAYOUT.fire);

    // Stone fire ring
    for (let c = 0; c < 10; c++) {
      const angle = (c / 10) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), this.matDesertBoulder);
      rock.position.set(Math.cos(angle) * 1.4, 0.18, Math.sin(angle) * 1.4);
      rock.scale.set(1.1, 0.8, 1.0);
      rock.castShadow = true;
      fireGroup.add(rock);
    }

    // Glowing Embers Core
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xff3700,
      emissive: 0xff4400,
      emissiveIntensity: 1.8,
      roughness: 0.8
    });
    const embers = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.22, 10), emberMat);
    embers.position.y = 0.12;
    fireGroup.add(embers);

    // Crossed charred logs
    const logMat = new THREE.MeshStandardMaterial({ color: 0x1f1610, roughness: 0.95 });
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 6), logMat);
      log.rotation.z = Math.PI * 0.42;
      log.rotation.y = (l / 4) * Math.PI;
      log.position.y = 0.28;
      fireGroup.add(log);
    }
    overlookGroup.add(fireGroup);

    // 2. Expedition A-Frame Canvas Wall Tent (North flank of deck)
    const tentGroup = new THREE.Group();
    tentGroup.name = 'SummitTent';
    placeSummitProp(tentGroup, this.splineRoad, overlookGroup.position, SUMMIT_LAYOUT.tent);
    tentGroup.rotation.y = -0.4;

    const tentMat = new THREE.MeshStandardMaterial({ color: 0xb4a480, roughness: 0.92 });
    const tentRoofL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 2.6), tentMat);
    tentRoofL.position.set(-0.9, 1.3, 0);
    tentRoofL.rotation.z = Math.PI * 0.22;
    tentRoofL.castShadow = true;
    tentGroup.add(tentRoofL);

    const tentRoofR = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 2.6), tentMat);
    tentRoofR.position.set(0.9, 1.3, 0);
    tentRoofR.rotation.z = -Math.PI * 0.22;
    tentRoofR.castShadow = true;
    tentGroup.add(tentRoofR);

    // Wooden ridgepole
    const ridgepole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 6), this.matWoodPole);
    ridgepole.rotation.x = Math.PI * 0.5;
    ridgepole.position.set(0, 2.15, 0);
    tentGroup.add(ridgepole);

    // Stacked Expedition Ammo / Gear Crates
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x3d4936, roughness: 0.7 });
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), crateMat);
    crate1.position.set(2.4, 0.35, 0.8);
    crate1.castShadow = true;
    tentGroup.add(crate1);

    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), crateMat);
    crate2.position.set(2.4, 0.95, 0.8);
    crate2.rotation.y = 0.2;
    crate2.castShadow = true;
    tentGroup.add(crate2);

    overlookGroup.add(tentGroup);

    // 3. Official Cougar Ridge Summit Register Kiosk Pedestal
    const regGroup = new THREE.Group();
    regGroup.name = 'SummitRegister';
    placeSummitProp(regGroup, this.splineRoad, overlookGroup.position, SUMMIT_LAYOUT.register);
    regGroup.rotation.y = 0.3;

    const regPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.4, 6), this.matWoodPole);
    regPost.position.y = 0.7;
    regPost.castShadow = true;
    regGroup.add(regPost);

    const regBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.45), this.matCastIronDark);
    regBox.position.set(0, 1.5, 0);
    regBox.castShadow = true;
    regGroup.add(regBox);

    const regPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.48), this.matTrailSignYellow);
    regPlaque.position.set(0, 1.5, 0.02);
    regGroup.add(regPlaque);

    overlookGroup.add(regGroup);

    // =========================================================================
    // TWIN DIRECTIONAL SCENIC VIEWINDERS (East: Route 66 / West: Surprise City)
    // =========================================================================
    this.scenicViewfinders = [];

    const vfConfigs = [
      // Viewfinder 0: Cougar Ridge Telescope (Desert Vista & Crime Scene) — Cantilevered Skywalk Promontory
      {
        id: 'coyote_summit_east',
        name: 'Cougar Ridge Telescope (Desert Vista)',
        sub: 'High-Power Dual-Optics Overlook • Route 66, Arrowhead Canyon & Desert Basin',
        elevation: '3,500 FT',
        deckPos: new THREE.Vector3(-41.8, 0.14, -30.8),
        rotY: -2.45, // Faces 220° SW directly toward White Canyon Ranch, Arrowhead Canyon & Desert Valley
        eyeOffset: new THREE.Vector3(-42.6, 0.14 + 1.85, -31.4),
        heading: -2.45, // 220° SW toward sweeping Desert Valley & Highway Panorama
        basePitch: -0.06, // Natural panoramic framing overlooking desert valley and mesas
        standPos: new THREE.Vector3(-39.5, 0.14, -29.0)
      },
      // Viewfinder 1: Pacific Pass Viewfinder (Surprise City Vista) — Eastern Grand Rim of Observation Deck
      {
        id: 'coyote_summit_west',
        name: 'Pacific Pass Viewfinder (Surprise City Vista)',
        sub: 'High-Power Dual-Optics Overlook • Santa Monica & Coastal Metropolis',
        elevation: '3,500 FT',
        deckPos: new THREE.Vector3(12.6, 0.14, 0.0),
        rotY: 1.47, // Faces 084° E toward Santa Monica Pier, Ferris Wheel & Pacific Ocean
        eyeOffset: new THREE.Vector3(13.5, 0.14 + 1.85, 0.0),
        heading: 1.47, // 084° E toward Santa Monica Pier & Pacific Park
        basePitch: -0.06, // Natural panoramic framing overlooking Santa Monica Pier, Ferris wheel & Pacific bay
        standPos: new THREE.Vector3(11.0, 0.14, 0.0)
      }
    ];

    vfConfigs.forEach((cfg) => {
      const binoGroup = new THREE.Group();
      binoGroup.position.copy(cfg.deckPos);
      binoGroup.rotation.y = cfg.rotY;
      binoGroup.rotation.x = 0.04; // Gentle natural optic tilt

      // Pedestal stand - heavy cast iron base
      const bPed = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 1.25, 8), this.matCastIronDark);
      bPed.position.y = 0.625;
      bPed.castShadow = true;
      binoGroup.add(bPed);

      // Cast metal housing - vintage NPS forest green
      const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.6), this.matViewfinderGreen);
      bBody.position.y = 1.35;
      binoGroup.add(bBody);

      // Dual optical barrels - vintage NPS forest green
      const barrelGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.75, 8);
      [-0.14, 0.14].forEach(bx => {
        const barrel = new THREE.Mesh(barrelGeo, this.matViewfinderGreen);
        barrel.rotation.x = Math.PI * 0.5;
        barrel.position.set(bx, 1.4, 0.35);
        barrel.castShadow = true;
        binoGroup.add(barrel);
      });

      // Dark cast iron coin box & mechanism
      const coinBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.2), this.matCastIronDark);
      coinBox.position.set(0, 1.25, -0.22);
      binoGroup.add(coinBox);

      overlookGroup.add(binoGroup);

      // World coordinates
      const worldStand = cfg.standPos.clone().add(overlookGroup.position);
      const worldEye = cfg.eyeOffset.clone().add(overlookGroup.position);

      this.scenicViewfinders.push({
        id: cfg.id,
        name: cfg.name,
        sub: cfg.sub,
        elevation: cfg.elevation,
        pos: worldStand,
        eyePos: worldEye,
        baseHeading: cfg.heading,
        basePitch: cfg.basePitch || -0.06,
        group: binoGroup
      });
    });

    if (this.splineRoad) {
      this.splineRoad.scenicViewfinders = this.scenicViewfinders;
    }
    if (typeof window !== 'undefined') {
      window.scenicViewfinders = this.scenicViewfinders;
    }

    // Large Summit Elevation & Panorama Sign
    const sumSignGroup = new THREE.Group();
    sumSignGroup.name = 'SummitPanoramaSign';
    placeSummitProp(sumSignGroup, this.splineRoad, overlookGroup.position, { x: 0, z: 34 });
    sumSignGroup.rotation.y = 0; // Faces vehicle entering overlook deck from trail

    const sumPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 4.4, 8), this.matWoodPole);
    sumPost1.position.set(-2.8, 2.2, -0.14);
    sumPost1.castShadow = true;
    sumSignGroup.add(sumPost1);
    const sumPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 4.4, 8), this.matWoodPole);
    sumPost2.position.set(2.8, 2.2, -0.14);
    sumPost2.castShadow = true;
    sumSignGroup.add(sumPost2);

    const sumBoard = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.9, 0.18), this.matWoodSignBrown);
    sumBoard.position.set(0, 3.0, 0);
    sumBoard.castShadow = true;
    sumSignGroup.add(sumBoard);

    // High-resolution USFS summit sign plaque (grand monument scale)
    const sumPlaque = trailSign('COUGAR RIDGE SUMMIT OVERLOOK', 'ELEVATION 5,640 FT • MOJAVE DESERT PANORAMA', 7.4, '#163f39');
    sumPlaque.position.set(0, 3.0, 0.10);
    sumSignGroup.add(sumPlaque);

    overlookGroup.add(sumSignGroup);

    // Rustic Timber Benches
    [-6, 7].forEach(xb => {
      const bench = new THREE.Group();
      bench.name = 'SummitRimBench';
      bench.position.set(xb, 0.14, -7.2);
      bench.rotation.y = 0;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.6), this.matWoodSignBrown);
      seat.position.y = 0.55;
      bench.add(seat);

      [-0.9, 0.9].forEach(bx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.5), this.matWoodPole);
        leg.position.set(bx, 0.275, 0);
        bench.add(leg);
      });
      overlookGroup.add(bench);
    });

    // Dedicated circular stone viewing pads & golden perimeter rings for both telescope viewpoints
    // With polygonOffset and proper vertical clearance to eliminate coplanar z-fighting with the deck meshes below
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x2d3238,
      roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -2.0
    });
    const goldRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      polygonOffset: true,
      polygonOffsetFactor: -3.0,
      polygonOffsetUnits: -3.0
    });

    // Pad 0: Cantilevered Skywalk Promontory
    // promontoryMesh top face is at y = 0.19. We set pad0 center to y = 0.22 (height 0.05, bottom at y = 0.195, top at y = 0.245)
    // and pad0Ring to y = 0.25 to sit cleanly above the timber promontory without any z-fighting.
    const pad0 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.45, 0.05, 32), padMat);
    pad0.position.set(-39.5, 0.22, -29.0);
    pad0.receiveShadow = true;
    overlookGroup.add(pad0);

    const pad0Ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 8, 32), goldRingMat);
    pad0Ring.rotation.x = Math.PI * 0.5;
    pad0Ring.position.set(-39.5, 0.25, -29.0);
    overlookGroup.add(pad0Ring);

    // Pad 1: Eastern Grand Rim
    // deckMesh top face is at y = 0.175. We set pad1 center to y = 0.21 (height 0.05, bottom at y = 0.185, top at y = 0.235)
    // and pad1Ring to y = 0.24.
    const pad1 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.45, 0.05, 32), padMat);
    pad1.position.set(11.0, 0.21, 0.0);
    pad1.receiveShadow = true;
    overlookGroup.add(pad1);

    const pad1Ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 8, 32), goldRingMat);
    pad1Ring.rotation.x = Math.PI * 0.5;
    pad1Ring.position.set(11.0, 0.24, 0.0);
    overlookGroup.add(pad1Ring);

    // Summit Flagpole & Gold Star Waypoint Banner placed beside telescope viewpoint
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 7.5, 8);
    const flagPole = new THREE.Mesh(poleGeo, this.matCastIronDark);
    flagPole.position.set(12.6, 3.87, 2.5);
    flagPole.castShadow = true;
    overlookGroup.add(flagPole);

    const flag = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.05), this.matTrailReflectorOrange);
    flag.position.set(11.8, 7.0, 2.5);
    overlookGroup.add(flag);

    // Cliff Edge Summit Waypoint Arch framing the telescope at the promontory rim
    const wpArch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.14, 8, 24, Math.PI), this.matSignGoldText);
    wpArch.position.set(-41.8, 3.6, -30.8);
    wpArch.rotation.y = -2.45;
    overlookGroup.add(wpArch);

    // Luminous Golden Summit Sky Beam reaching 42m into the sky directly over the telescope
    const matSkyBeam = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const skyBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.8, 42.0, 12, 1, true), matSkyBeam);
    skyBeam.position.set(-41.8, 21.0, -30.8);
    overlookGroup.add(skyBeam);

    // Golden Diamond Star Beacon Marker hovering over the telescope viewpoint
    const matStar = new THREE.MeshBasicMaterial({ color: 0xffe066 });
    const starMarker = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), matStar);
    starMarker.position.set(-41.8, 5.8, -30.8);
    overlookGroup.add(starMarker);

    // 10. CRAGGY CANYON GEOLOGY, STRATIFIED BLUFFS & NATURAL ROCK ARCH
    this.buildTrailCanyonGeology(deepTrailGroup, spinePoints, trailFrames, segments);

    // 10B. 3D MUD BOGS, VISCOUS SLURRY & REFLECTIVE WATER PUDDLE BASINS
    this.buildTrailMudBogsAndPuddles(deepTrailGroup, spinePoints, trailFrames, segments);

    // 11. ELEVATION-TIERED WILDERNESS FLORA (DESERT WASH, RIPARIAN, MID-CANYON & ALPINE)
    this.buildTrailWildernessVegetation(deepTrailGroup, spinePoints, trailFrames, segments);

    // 12. BACKCOUNTRY 4x4 / OVERLAND TRAIL INFRASTRUCTURE, RECOVERY GEAR & USFS SIGNS
    this.buildTrailOverlandInfrastructure(deepTrailGroup, spinePoints, trailFrames, segments);

    // 13. GRAND SUMMIT BASE CAMP POLISH (OBSERVATION PAVILION, CAMP GEAR & WEATHER STATION)
    this.buildSummitBaseCampDetails(overlookGroup);

    deepTrailGroup.add(buildSummitClearing(this.splineRoad, summitSp.pos, this.matDesertGravel, this.matWoodPole));
    deepTrailGroup.add(overlookGroup);

    // =========================================================================
    // 9. THE SURPRISE POPULATED COASTAL CITY VISTA (Santa Monica / Malibu)
    // =========================================================================
    const surpriseCity = this.buildSurpriseCityVista(summitSp.pos);
    this.surpriseCityGroup = surpriseCity;
    // Default to hidden when on the highway; dynamically revealed as a scenic surprise on mountain ascent
    surpriseCity.visible = false;
    trailGroup.add(surpriseCity);

    this.group.add(trailGroup);
  }

  /**
   * ⚡ Build Cougar Ridge Downhill Express Sprint Route
   * High-speed gravity descent route from Coyote Ridge Summit Overlook (elev 56m)
   * down to Highway 1 Coyote Ridge Turnout (elev 0.1m).
   */
  buildDownhillExpressRoute() {
    const routeGroup = new THREE.Group();
    routeGroup.name = 'CougarRidgeDownhillExpressRoute';
    this.downhillExpressRoute = routeGroup;

    const segments = 128;
    const spinePoints = DownhillSpline.getSpinePoints(segments).map((sp) => {
      const trans = this.splineRoad.getRoadTransformAtZ(sp.z, sp.lat, 0);
      const groundY = this.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z);
      return {
        t: sp.t,
        lat: sp.lat,
        z: sp.z,
        elev: sp.elev,
        bank: sp.bank || 0,
        width: sp.width || 16.0,
        pos: new THREE.Vector3(trans.pos.x, groundY, trans.pos.z)
      };
    });

    const routeFrames = [];
    for (let i = 0; i <= segments; i++) {
      let dir;
      if (i === 0) {
        dir = spinePoints[1].pos.clone().sub(spinePoints[0].pos).setY(0).normalize();
      } else if (i === segments) {
        dir = spinePoints[segments].pos.clone().sub(spinePoints[segments - 1].pos).setY(0).normalize();
      } else {
        dir = spinePoints[i + 1].pos.clone().sub(spinePoints[i - 1].pos).setY(0).normalize();
      }
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      routeFrames.push({ dir, norm });
    }

    // 1. 3D Banked Roadbed Ribbon
    const roadVertices = [];
    const roadUvs = [];
    const roadIndices = [];

    const profileT = [-1.15, -0.75, -0.25, 0.25, 0.75, 1.15];
    for (let i = 0; i <= segments; i++) {
      const sp = spinePoints[i];
      const { norm } = routeFrames[i];
      const halfW = (sp.width || 16.0) * 0.5;
      const bank = sp.bank || 0;

      for (let k = 0; k < profileT.length; k++) {
        const pT = profileT[k];
        const off = pT * halfW;
        const bankLift = pT * bank * halfW * 0.35;
        const pt = sp.pos.clone().addScaledVector(norm, off);
        const y = this.splineRoad.getGroundElevation(pt.x, pt.z) + 0.14;

        roadVertices.push(pt.x, y, pt.z);
        roadUvs.push((pT + 1.15) / 2.3, sp.t * 32.0);
      }

      if (i < segments) {
        const rowA = i * profileT.length;
        const rowB = (i + 1) * profileT.length;
        for (let k = 0; k < profileT.length - 1; k++) {
          roadIndices.push(rowA + k, rowB + k + 1, rowB + k);
          roadIndices.push(rowA + k, rowA + k + 1, rowB + k + 1);
        }
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, this.matDownhillRoadbed);
    roadMesh.name = 'DownhillExpressRoadbed';
    roadMesh.receiveShadow = true;
    routeGroup.add(roadMesh);

    // 2. High-Speed Banked Red & White Rally Kerbs along sweeping corners
    const kerbZones = [
      { start: 0.16, end: 0.32, side: 1 },  // Outer right side
      { start: 0.35, end: 0.48, side: -1 }, // Outer left side
      { start: 0.62, end: 0.76, side: 1 }   // Outer right side
    ];

    kerbZones.forEach((kz) => {
      const startIdx = Math.floor(kz.start * segments);
      const endIdx = Math.ceil(kz.end * segments);
      for (let i = startIdx; i <= endIdx; i += 2) {
        const sp = spinePoints[i];
        const { norm, dir } = routeFrames[i];
        const halfW = (sp.width || 16.0) * 0.5;
        const kerbPos = sp.pos.clone().addScaledVector(norm, kz.side * (halfW - 0.2));
        kerbPos.y = this.splineRoad.getGroundElevation(kerbPos.x, kerbPos.z) + 0.12;

        const kerbMat = (Math.floor(i / 2) % 2 === 0) ? this.matRallyRed : this.matRallyWhite;
        const kerb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 2.4), kerbMat);
        kerb.position.copy(kerbPos);
        kerb.rotation.y = Math.atan2(dir.x, dir.z);
        kerb.castShadow = true;
        routeGroup.add(kerb);
      }
    });

    // 3. Reflective Chevron Corner Arrows along the route
    const chevronIndices = [18, 32, 50, 68, 86, 105];
    chevronIndices.forEach((cIdx, idx) => {
      const sp = spinePoints[cIdx];
      const { norm, dir } = routeFrames[cIdx];
      const halfW = (sp.width || 16.0) * 0.5;
      const side = (idx % 2 === 0) ? 1 : -1;
      const cPos = sp.pos.clone().addScaledVector(norm, side * (halfW + 2.2));
      cPos.y = this.splineRoad.getGroundElevation(cPos.x, cPos.z);

      const markerGroup = new THREE.Group();
      markerGroup.position.copy(cPos);
      markerGroup.rotation.y = Math.atan2(dir.x, dir.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6), this.matWoodPole);
      post.position.y = 1.0;
      markerGroup.add(post);

      const sign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.08), this.matRallyChevron);
      sign.position.set(0, 1.6, 0);
      markerGroup.add(sign);

      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), this.matRallyWhite);
      arrow.rotation.z = (side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5);
      arrow.position.set(0, 1.6, 0.05);
      markerGroup.add(arrow);

      routeGroup.add(markerGroup);
    });

    // 4. Summit Launch Archway (At the very top, t = 0)
    const launchSp = spinePoints[0];
    const launchFrame = routeFrames[0];
    const launchArch = new THREE.Group();
    launchArch.position.copy(launchSp.pos);
    launchArch.rotation.y = Math.atan2(launchFrame.dir.x, launchFrame.dir.z);

    const archHalfW = (launchSp.width || 16.0) * 0.5 + 0.8;
    // Left & right timber pillars
    [-archHalfW, archHalfW].forEach((xSide) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 6.2, 8), this.matWoodPole);
      pillar.position.set(xSide, 3.1, 0);
      pillar.castShadow = true;
      launchArch.add(pillar);

      // Strobe beacon atop each pillar
      const beaconGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.42, 8);
      const beacon = new THREE.Mesh(beaconGeo, this.matLaunchGateAmber);
      beacon.position.set(xSide, 6.4, 0);
      launchArch.add(beacon);
      this.downhillLaunchBeacons.push(beacon);
    });

    // Overhead truss beam placed strictly above sign board
    const trussBeam = new THREE.Mesh(new THREE.BoxGeometry(archHalfW * 2 + 1.2, 0.45, 0.45), this.matWoodPole);
    trussBeam.position.set(0, 6.0, 0);
    trussBeam.castShadow = true;
    launchArch.add(trussBeam);

    // Hanging brackets
    [-2.6, 2.6].forEach((bx) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.22), this.matCastIronDark);
      b.position.set(bx, 5.5, 0);
      launchArch.add(b);
    });

    // Header sign plaque (solid backer board hanging below beam at y = 4.5)
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.9, 0.20), this.matSignSubSlate);
    signBoard.position.set(0, 4.5, 0);
    signBoard.castShadow = true;
    launchArch.add(signBoard);

    // Yellow decorative banner rim
    const signBorder = new THREE.Mesh(new THREE.BoxGeometry(8.36, 2.06, 0.16), this.matTrailSignYellow);
    signBorder.position.set(0, 4.5, 0);
    launchArch.add(signBorder);

    // Launch arrows pointing forward into the downhill run
    [-3.6, 0, 3.6].forEach((ax) => {
      const arr = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 4), this.matLaunchGateGreen);
      arr.rotation.x = Math.PI * 0.5;
      arr.position.set(ax, 3.2, 0);
      launchArch.add(arr);
    });

    const launchLabel = trailSign('DOWNHILL  /  HIGHWAY 1', 'RETURN ROUTE  •  HIGH GEAR', 7.8);
    launchLabel.position.set(0, 4.5, -0.12);
    launchLabel.rotation.y = Math.PI;
    launchArch.add(launchLabel);
    routeGroup.add(launchArch);
    routeGroup.add(buildDescentWayfinding(this.splineRoad, spinePoints, routeFrames, this.matViewfinderGreen));

    // 5. Highway 1 Re-entry Finish Archway (Cougar Ridge Downhill Canyon Portal)
    // Positioned at t ≈ 0.90 (alluvial fan threshold), framing the canyon descent with >30m clean clearance from Highway 1 shoulder & turnout signs
    const exitIdx = Math.floor(segments * 0.90);
    const exitSp = spinePoints[exitIdx];
    const exitFrame = routeFrames[exitIdx];
    const exitArch = new THREE.Group();
    exitArch.name = 'CougarRidgeExitArch';
    exitArch.position.copy(exitSp.pos);
    exitArch.rotation.y = Math.atan2(exitFrame.dir.x, exitFrame.dir.z);

    const exitArchW = 10.8;
    const exitArchHalfW = exitArchW * 0.5;
    const postH = 6.2;
    [-exitArchHalfW, exitArchHalfW].forEach((xSide) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, postH, 8), this.matWoodPole);
      p.position.set(xSide, postH * 0.5, 0);
      p.castShadow = true;
      exitArch.add(p);

      // Strobe beacon atop each pillar
      const beaconGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.38, 8);
      const beacon = new THREE.Mesh(beaconGeo, this.matLaunchGateAmber);
      beacon.position.set(xSide, postH + 0.19, 0);
      exitArch.add(beacon);
      if (this.downhillLaunchBeacons) this.downhillLaunchBeacons.push(beacon);
    });

    // Overhead truss beam placed strictly ABOVE the sign (at y = 6.0, zero beam clipping!)
    const exitBeam = new THREE.Mesh(new THREE.BoxGeometry(exitArchW + 1.2, 0.45, 0.45), this.matWoodPole);
    exitBeam.position.set(0, 6.0, 0);
    exitBeam.castShadow = true;
    exitArch.add(exitBeam);

    // Hanging iron brackets connecting sign board to the beam
    [-2.4, 2.4].forEach((bx) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.22), this.matCastIronDark);
      bracket.position.set(bx, 5.5, 0);
      exitArch.add(bracket);
    });

    // Solid opaque backer board for the sign (hanging below beam at y = 4.5, height 1.9, width 7.6, depth 0.20)
    const signW = 7.6;
    const signH = 1.9;
    const signD = 0.20;
    const exitSignBoard = new THREE.Mesh(new THREE.BoxGeometry(signW, signH, signD), this.matWoodSignBrown);
    exitSignBoard.position.set(0, 4.5, 0);
    exitSignBoard.castShadow = true;
    exitArch.add(exitSignBoard);

    // Decorative amber/gold border frame
    const exitBorder = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.16, signH + 0.16, signD - 0.04), this.matTrailSignYellow);
    exitBorder.position.set(0, 4.5, 0);
    exitArch.add(exitBorder);

    // Front Face (+Z: facing oncoming traffic looking from the base/highway up towards the mountain descent)
    const labelW = 7.2;
    const exitOnlyLabel = trailSign('DOWNHILL ROUTE', 'COUGAR RIDGE DESCENT • TWO-WAY 4x4 ACCESS', labelW, '#163f39');
    exitOnlyLabel.position.set(0, 4.5, signD * 0.5 + 0.02);
    exitArch.add(exitOnlyLabel);

    // Back Face (-Z: facing downhill traffic arriving from the summit descent heading out to Highway 1)
    const returnLabel = trailSign('HIGHWAY 1 ACCESS', 'DESCENT FINISH • MERGE SAFELY', labelW, '#163f39');
    returnLabel.position.set(0, 4.5, -(signD * 0.5 + 0.02));
    returnLabel.rotation.y = Math.PI;
    exitArch.add(returnLabel);

    routeGroup.add(exitArch);

    // 6. Craggy Canyon Geology, Monoliths, Guardrail Boulders & Chicanes
    this.buildDownhillCanyonGeology(routeGroup, spinePoints, routeFrames, segments);

    // 7. Bridalveil Waterfall Grotto (Drive-Through / Drive-Under Waterfall)
    this.buildDownhillWaterfallGrotto(routeGroup, spinePoints, routeFrames, segments);

    // 8. Alpine Pines, Cypresses & Riparian Forest Foliage
    this.buildDownhillForestFoliage(routeGroup, spinePoints, routeFrames, segments);

    this.group.add(routeGroup);
  }

  /**
   * 🪨 Build Cougar Ridge Downhill Canyon Geology:
   * Granite Gateway monoliths, cliff-edge guide boulders with amber reflectors,
   * Cougar Fangs split slalom boulders, and stratified sandstone canyon bluffs.
   */
  buildDownhillCanyonGeology(routeGroup, spinePoints, routeFrames, segments) {
    const geoGroup = new THREE.Group();
    geoGroup.name = 'DownhillCanyonGeology';

    const boulderGeo = new THREE.DodecahedronGeometry(2.2, 1);
    const megaBoulderGeo = new THREE.DodecahedronGeometry(4.0, 1);
    const bluffBaseGeo = new THREE.CylinderGeometry(8.5, 11.0, 5.0, 8);
    const bluffMidGeo = new THREE.CylinderGeometry(6.8, 8.8, 5.0, 8);
    const bluffCapGeo = new THREE.CylinderGeometry(7.5, 6.2, 1.8, 8);
    const talusGeo = new THREE.ConeGeometry(4.2, 3.2, 7);

    // 1. The Granite Gateway Twin Monoliths (t ≈ 0.10, idx ≈ 13)
    const gateIdx = Math.floor(segments * 0.10);
    const gateSp = spinePoints[gateIdx];
    const gateFrame = routeFrames[gateIdx];
    const gateHalfW = (gateSp.width || 14.0) * 0.5;

    [-gateHalfW - 3.2, gateHalfW + 3.2].forEach((xSide, pIdx) => {
      const gX = gateSp.pos.x + gateFrame.norm.x * xSide;
      const gZ = gateSp.pos.z + gateFrame.norm.z * xSide;
      const gY = this.splineRoad.getGroundElevation(gX, gZ);

      const monolith = new THREE.Group();
      monolith.position.set(gX, gY, gZ);
      monolith.rotation.y = Math.atan2(gateFrame.dir.x, gateFrame.dir.z) + (pIdx === 0 ? 0.35 : -0.35);

      // Base megalith
      const baseRock = new THREE.Mesh(megaBoulderGeo, this.matWetGranite);
      baseRock.scale.set(1.4, 2.2, 1.3);
      baseRock.position.y = 5.0;
      baseRock.castShadow = true;
      baseRock.receiveShadow = true;
      monolith.add(baseRock);

      // Upper spire needle
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.8, 9.5, 7), this.matDesertBoulder);
      spire.position.y = 11.5;
      spire.rotation.z = (pIdx === 0 ? 0.12 : -0.12);
      spire.castShadow = true;
      monolith.add(spire);

      // Talus rubble around base
      const talus = new THREE.Mesh(talusGeo, this.matMesaTalus);
      talus.position.set(pIdx === 0 ? 1.5 : -1.5, 1.8, 0.5);
      talus.scale.set(1.1, 0.9, 1.1);
      monolith.add(talus);

      geoGroup.add(monolith);
    });

    // 2. Eagle Ridge Cliffside Guard Boulders & Amber Reflector Posts (t ≈ 0.16 - 0.28)
    for (let i = Math.floor(segments * 0.16); i <= Math.floor(segments * 0.28); i += 2) {
      const sp = spinePoints[i];
      const { dir, norm } = routeFrames[i];
      const halfW = (sp.width || 15.0) * 0.5;

      const bX = sp.pos.x + norm.x * (halfW + 1.2);
      const bZ = sp.pos.z + norm.z * (halfW + 1.2);
      const bY = this.splineRoad.getGroundElevation(bX, bZ);

      const guardBoulder = new THREE.Mesh(boulderGeo, (i % 4 === 0) ? this.matDesertBoulder : this.matWetGranite);
      guardBoulder.position.set(bX, bY + 1.0, bZ);
      guardBoulder.scale.set(1.0 + (i % 3) * 0.25, 0.8 + (i % 2) * 0.3, 1.1);
      guardBoulder.rotation.set((i * 0.3) % 1.0, (i * 0.7) % 3.0, 0);
      guardBoulder.castShadow = true;
      guardBoulder.receiveShadow = true;
      geoGroup.add(guardBoulder);

      if (i % 4 === 0) {
        const postGroup = new THREE.Group();
        postGroup.position.set(bX, bY, bZ);
        postGroup.rotation.y = Math.atan2(dir.x, dir.z);

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 6), this.matWoodPole);
        post.position.y = 1.6;
        postGroup.add(post);

        const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.08), this.matTrailReflectorOrange);
        reflector.position.set(0, 2.2, 0.08);
        postGroup.add(reflector);

        geoGroup.add(postGroup);
      }
    }

    // 3. Cougar Fangs Slalom Boulders (t ≈ 0.46 - 0.52)
    const fangDefs = [
      { idx: Math.floor(segments * 0.46), side: -1, name: 'CougarFangLeft' },
      { idx: Math.floor(segments * 0.50), side: 1,  name: 'CougarFangRight' }
    ];

    fangDefs.forEach((fd) => {
      const sp = spinePoints[fd.idx];
      const { dir, norm } = routeFrames[fd.idx];
      const halfW = (sp.width || 14.0) * 0.5;
      const fX = sp.pos.x + norm.x * (fd.side * (halfW + 1.0));
      const fZ = sp.pos.z + norm.z * (fd.side * (halfW + 1.0));
      const fY = this.splineRoad.getGroundElevation(fX, fZ);

      const fangGroup = new THREE.Group();
      fangGroup.name = fd.name;
      fangGroup.position.set(fX, fY, fZ);
      fangGroup.rotation.y = Math.atan2(dir.x, dir.z) + (fd.side > 0 ? -0.2 : 0.2);

      const fangMesh = new THREE.Mesh(megaBoulderGeo, this.matWetGranite);
      fangMesh.scale.set(1.5, 2.6, 1.4);
      fangMesh.position.y = 5.2;
      fangMesh.castShadow = true;
      fangMesh.receiveShadow = true;
      fangGroup.add(fangMesh);

      const spur = new THREE.Mesh(new THREE.ConeGeometry(2.4, 7.5, 6), this.matDesertBoulder);
      spur.position.set(fd.side * 0.6, 9.8, 0);
      spur.rotation.z = fd.side * -0.25;
      spur.castShadow = true;
      fangGroup.add(spur);

      geoGroup.add(fangGroup);
    });

    // 4. Stratified Sandstone Canyon Bluffs along mountain wall (t ≈ 0.60, 0.74, 0.84)
    const bluffSteps = [
      { idx: Math.floor(segments * 0.60), side: 1, hScale: 1.1 },
      { idx: Math.floor(segments * 0.74), side: 1, hScale: 0.9 },
      { idx: Math.floor(segments * 0.84), side: 1, hScale: 0.8 }
    ];

    bluffSteps.forEach((bs) => {
      const sp = spinePoints[bs.idx];
      const { dir, norm } = routeFrames[bs.idx];
      const halfW = (sp.width || 16.0) * 0.5;
      const bX = sp.pos.x + norm.x * (bs.side * (halfW + 16.5));
      const bZ = sp.pos.z + norm.z * (bs.side * (halfW + 16.5));
      const bY = this.splineRoad.getGroundElevation(bX, bZ);

      const bGroup = new THREE.Group();
      bGroup.position.set(bX, bY, bZ);
      bGroup.rotation.y = Math.atan2(dir.x, dir.z);

      const base = new THREE.Mesh(bluffBaseGeo, this.matMesaRed);
      base.position.y = 2.5 * bs.hScale;
      base.scale.set(1.0, bs.hScale, 1.05);
      base.castShadow = true;
      base.receiveShadow = true;
      bGroup.add(base);

      const mid = new THREE.Mesh(bluffMidGeo, this.matMesaStrata);
      mid.position.set(0.4, 7.0 * bs.hScale, 0);
      mid.scale.set(1.0, bs.hScale, 1.0);
      mid.castShadow = true;
      bGroup.add(mid);

      const cap = new THREE.Mesh(bluffCapGeo, this.matMesaCap);
      cap.position.set(0.5, 9.8 * bs.hScale, 0);
      cap.castShadow = true;
      bGroup.add(cap);

      const talus = new THREE.Mesh(talusGeo, this.matMesaTalus);
      talus.position.set(0, 1.6, -1.8);
      talus.scale.set(1.0, 0.9, 1.0);
      bGroup.add(talus);

      geoGroup.add(bGroup);
    });

    routeGroup.add(geoGroup);
  }

  /**
   * 🌊 Build Bridalveil Waterfall Grotto (Drive-Through / Under Waterfall)
   * A natural rock cantilever arch spanning completely over the downhill track with
   * an animated cascading mountain waterfall plunging right across and over the roadbed,
   * with wet basalt cliffs, plunge basin, churning foam, and billowy mist banks.
   */
  buildDownhillWaterfallGrotto(routeGroup, spinePoints, routeFrames, segments) {
    const wfGroup = new THREE.Group();
    wfGroup.name = 'BridalveilWaterfallGrotto';

    const wfIdx = Math.floor(segments * 0.38);
    const sp = spinePoints[wfIdx];
    const { dir } = routeFrames[wfIdx];
    const halfW = (sp.width || 14.5) * 0.5;

    const rotY = Math.atan2(dir.x, dir.z);

    wfGroup.position.copy(sp.pos);
    wfGroup.rotation.y = rotY;

    // 1. Rock Cantilever Arch Overhead (Spanning across road at y = 7.8m)
    const leftButtress = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.8, 12.0, 8), this.matWetGranite);
    leftButtress.position.set(-halfW - 3.5, 6.0, 0);
    leftButtress.scale.set(1.2, 1.0, 1.4);
    leftButtress.castShadow = true;
    leftButtress.receiveShadow = true;
    wfGroup.add(leftButtress);

    const rightButtress = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 5.2, 16.0, 8), this.matWetGranite);
    rightButtress.position.set(halfW + 3.5, 4.0, 0);
    rightButtress.scale.set(1.1, 1.0, 1.3);
    rightButtress.castShadow = true;
    rightButtress.receiveShadow = true;
    wfGroup.add(rightButtress);

    const archRoofGeo = new THREE.BoxGeometry(halfW * 2 + 9.0, 2.6, 8.5);
    const archRoof = new THREE.Mesh(archRoofGeo, this.matWetGranite);
    archRoof.position.set(0, 7.8, 0);
    archRoof.rotation.z = 0.04;
    archRoof.castShadow = true;
    archRoof.receiveShadow = true;
    wfGroup.add(archRoof);

    [-5.0, -1.8, 2.2, 5.5].forEach((rx, rIdx) => {
      const stalactite = new THREE.Mesh(new THREE.ConeGeometry(0.8 + (rIdx % 2) * 0.4, 2.2 + (rIdx % 3) * 0.5, 6), this.matWetGranite);
      stalactite.position.set(rx, 6.2, ((rIdx * 1.7) % 3.0) - 1.5);
      stalactite.rotation.x = Math.PI;
      stalactite.castShadow = true;
      wfGroup.add(stalactite);
    });

    // 2. Wet basalt roadbed apron under the falls
    const wetRoadGeo = new THREE.PlaneGeometry(halfW * 2 + 1.0, 14.0);
    const wetRoadMesh = new THREE.Mesh(wetRoadGeo, this.matWetGranite);
    wetRoadMesh.rotation.x = -Math.PI * 0.5;
    wetRoadMesh.position.set(0, 0.08, 0);
    wetRoadMesh.receiveShadow = true;
    wfGroup.add(wetRoadMesh);

    // 3. Upper Mountain Stream Trough (Rushing across top of rock arch from left mountain)
    const streamTroughGeo = new THREE.PlaneGeometry(halfW + 5.0, 4.0);
    const streamTrough = new THREE.Mesh(streamTroughGeo, this.matStreamWater);
    streamTrough.rotation.x = -Math.PI * 0.5;
    streamTrough.position.set(-halfW * 0.4, 9.2, 0);
    wfGroup.add(streamTrough);

    // 4. Cascading Waterfall Curtains (Rushing down across outer shoulder / track verge)
    const fallH = 18.5;
    const fallCenterY = -0.75;

    const wfCurtainGeo = new THREE.PlaneGeometry(7.5, fallH);
    const wfCurtain = new THREE.Mesh(wfCurtainGeo, this.matWaterfallWater);
    wfCurtain.position.set(halfW - 1.0, fallCenterY, 0.4);
    wfCurtain.rotation.y = 0.15;
    wfGroup.add(wfCurtain);

    const wfInnerGeo = new THREE.PlaneGeometry(6.5, fallH);
    const wfInner = new THREE.Mesh(wfInnerGeo, this.matWaterfallWaterInner);
    wfInner.position.set(halfW - 1.2, fallCenterY, 0.2);
    wfInner.rotation.y = 0.15;
    wfGroup.add(wfInner);

    const sprayVeilGeo = new THREE.PlaneGeometry(5.0, 7.5);
    const sprayVeil = new THREE.Mesh(sprayVeilGeo, this.matWaterfallSpray);
    sprayVeil.position.set(halfW - 3.8, 3.8, 0.6);
    sprayVeil.rotation.y = -0.1;
    wfGroup.add(sprayVeil);

    const sprayVeil2 = new THREE.Mesh(sprayVeilGeo, this.matWaterfallSpray);
    sprayVeil2.position.set(halfW - 2.5, 3.5, -2.0);
    sprayVeil2.rotation.y = 0.25;
    wfGroup.add(sprayVeil2);

    // 5. Lower Gorge Plunge Pool Basin & Concentric Ripples
    const plungeCenter = new THREE.Vector3(halfW + 6.0, -9.8, 0.5);

    const plungePoolMesh = new THREE.Mesh(new THREE.CircleGeometry(8.5, 24), this.matStreamWater);
    plungePoolMesh.rotation.x = -Math.PI * 0.5;
    plungePoolMesh.position.copy(plungeCenter);
    plungePoolMesh.receiveShadow = true;
    wfGroup.add(plungePoolMesh);

    const rippleMesh = new THREE.Mesh(new THREE.CircleGeometry(6.5, 20), this.matWaterfallRipple);
    rippleMesh.rotation.x = -Math.PI * 0.5;
    rippleMesh.position.set(plungeCenter.x, plungeCenter.y + 0.08, plungeCenter.z);
    wfGroup.add(rippleMesh);

    const boilMesh = new THREE.Mesh(new THREE.CircleGeometry(3.5, 16), this.matWaterfallWater);
    boilMesh.rotation.x = -Math.PI * 0.5;
    boilMesh.position.set(halfW + 1.2, -9.7, 0.5);
    wfGroup.add(boilMesh);

    // 6. Volumetric Billowy Waterfall Mist Banks
    const mistOffsets = [
      { x: halfW - 2.0, y: 1.8,  z: 0.0,  s: 6.0, ph: 0.0 },
      { x: halfW + 1.0, y: 3.5,  z: 2.5,  s: 7.5, ph: 1.2 },
      { x: halfW - 4.5, y: 2.2,  z: -2.0, s: 5.5, ph: 2.4 },
      { x: halfW + 4.0, y: -6.0, z: 1.0,  s: 9.0, ph: 3.6 },
      { x: halfW + 2.0, y: -4.0, z: -2.5, s: 8.0, ph: 4.8 }
    ];

    mistOffsets.forEach((mo, mIdx) => {
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(mo.s, mo.s), this.matWaterfallSpray);
      mist.position.set(mo.x, mo.y, mo.z);
      mist.rotation.y = (mIdx * 0.8) % Math.PI;
      wfGroup.add(mist);

      if (this.waterfallMistPlanes) {
        this.waterfallMistPlanes.push({
          mesh: mist,
          baseY: mo.y,
          phase: mo.ph
        });
      }
    });

    // 7. Scenic Waterfall Vista Timber Lookout Platform
    const lookIdx = Math.floor(segments * 0.42);
    const lookSp = spinePoints[lookIdx];
    const lookFrame = routeFrames[lookIdx];
    const lookHalfW = (lookSp.width || 14.5) * 0.5;

    const lookX = lookSp.pos.x + lookFrame.norm.x * (lookHalfW + 3.8);
    const lookZ = lookSp.pos.z + lookFrame.norm.z * (lookHalfW + 3.8);
    const lookY = this.splineRoad.getGroundElevation(lookX, lookZ);

    const platformGroup = new THREE.Group();
    platformGroup.position.set(lookX, lookY, lookZ);
    platformGroup.rotation.y = Math.atan2(lookFrame.dir.x, lookFrame.dir.z);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 4.5), this.matWoodPole);
    deck.position.y = 1.2;
    deck.castShadow = true;
    platformGroup.add(deck);

    const railMat = this.matWoodPole;
    [-1.6, 1.6].forEach(rx => {
      const rPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), railMat);
      rPost.position.set(rx, 1.8, 0);
      platformGroup.add(rPost);
    });

    const signLabel = trailSign('BRIDALVEIL GROTTO', 'WATERFALL CASCADE • ELEV 2,200 FT', 3.2, '#163f39');
    signLabel.position.set(0, 2.6, 0);
    platformGroup.add(signLabel);

    routeGroup.add(platformGroup);
    routeGroup.add(wfGroup);
  }

  /**
   * 🌲 Build Cougar Ridge Downhill Forest Foliage:
   * Alpine Ponderosa Pines, Mountain Firs, Twisted Cypresses,
   * Riparian Willows, Cottonwoods, and Mountain Wildflowers.
   */
  buildDownhillForestFoliage(routeGroup, spinePoints, routeFrames, segments) {
    const foliageGroup = new THREE.Group();
    foliageGroup.name = 'DownhillForestFoliage';

    const pineTrunkGeo = new THREE.CylinderGeometry(0.28, 0.44, 4.2, 7);
    const pineTier1Geo = new THREE.ConeGeometry(3.2, 4.0, 7);
    const pineTier2Geo = new THREE.ConeGeometry(2.4, 3.5, 7);
    const pineTier3Geo = new THREE.ConeGeometry(1.6, 3.0, 7);

    const cypressTrunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 3.5, 6);
    const cypressCrownGeo = new THREE.DodecahedronGeometry(2.4, 1);

    const willowTrunkGeo = new THREE.CylinderGeometry(0.25, 0.42, 3.8, 6);
    const willowCrownGeo = new THREE.CylinderGeometry(3.4, 1.8, 3.2, 8);

    const cottonwoodTrunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 4.5, 6);
    const cottonwoodCrownGeo = new THREE.DodecahedronGeometry(3.2, 1);

    const fernGeo = new THREE.ConeGeometry(0.6, 0.5, 5);
    const flowerGeo = new THREE.DodecahedronGeometry(0.22, 0);

    const downhillTrees = [
      // Eagle Ridge High Bank Pines & Mountain Cypresses (t = 0.18 - 0.30)
      { t: 0.18, side: -1, off: 10.5, type: 'pine',    h: 10.5 },
      { t: 0.20, side: -1, off: 12.5, type: 'cypress', h: 7.5  },
      { t: 0.23, side: -1, off: 11.0, type: 'pine',    h: 11.0 },
      { t: 0.25, side:  1, off: 11.5, type: 'cypress', h: 6.8  },
      { t: 0.27, side: -1, off: 12.0, type: 'cypress', h: 7.2  },
      { t: 0.29, side:  1, off: 12.2, type: 'pine',    h: 9.8  },

      // Bridalveil Waterfall Gorge Alpine & Clifftop Flora (t = 0.33 - 0.44)
      { t: 0.33, side: -1, off: 10.5, type: 'pine',    h: 11.5 },
      { t: 0.35, side: -1, off: 13.0, type: 'cypress', h: 8.0  },
      { t: 0.41, side:  1, off: 11.5, type: 'cypress', h: 7.5  },
      { t: 0.43, side: -1, off: 11.0, type: 'pine',    h: 10.0 },

      // Cougar Fangs Chicane Mountain Cypresses & Pines (t = 0.46 - 0.58)
      { t: 0.47, side:  1, off: 10.8, type: 'cypress', h: 7.2  },
      { t: 0.49, side: -1, off: 11.5, type: 'pine',    h: 9.5  },
      { t: 0.52, side:  1, off: 11.2, type: 'cypress', h: 7.0  },
      { t: 0.55, side: -1, off: 10.5, type: 'cypress', h: 7.8  },
      { t: 0.57, side:  1, off: 11.8, type: 'pine',    h: 10.5 },

      // Mojave Halfpipe Rollercoaster Canyon Trees (t = 0.60 - 0.72)
      { t: 0.61, side: -1, off: 11.5, type: 'cypress',    h: 7.5 },
      { t: 0.63, side:  1, off: 12.0, type: 'willow',     h: 7.2 },
      { t: 0.66, side: -1, off: 11.8, type: 'cottonwood', h: 8.8 },
      { t: 0.69, side:  1, off: 12.5, type: 'willow',     h: 7.0 },
      { t: 0.71, side: -1, off: 11.5, type: 'cottonwood', h: 9.2 },

      // Riparian Red Rock Chute Lush Groves (t = 0.74 - 0.88)
      { t: 0.74, side:  1, off: 12.0, type: 'willow',     h: 7.5 },
      { t: 0.76, side: -1, off: 11.5, type: 'cottonwood', h: 9.0 },
      { t: 0.79, side:  1, off: 12.8, type: 'willow',     h: 6.8 },
      { t: 0.81, side: -1, off: 12.0, type: 'cottonwood', h: 9.5 },
      { t: 0.83, side:  1, off: 13.0, type: 'willow',     h: 7.2 },
      { t: 0.85, side: -1, off: 12.5, type: 'cottonwood', h: 8.5 },
      { t: 0.88, side:  1, off: 13.5, type: 'willow',     h: 7.0 }
    ];

    downhillTrees.forEach((tCfg, tIdx) => {
      const idx = Math.min(segments, Math.max(0, Math.floor(tCfg.t * segments)));
      const sp = spinePoints[idx];
      const { norm } = routeFrames[idx];
      const halfW = (sp.width || 16.0) * 0.5;

      const tX = sp.pos.x + norm.x * (tCfg.side * (halfW + tCfg.off));
      const tZ = sp.pos.z + norm.z * (tCfg.side * (halfW + tCfg.off));
      const tY = this.splineRoad.getGroundElevation(tX, tZ);

      const tree = new THREE.Group();
      tree.position.set(tX, tY, tZ);
      tree.rotation.y = (tIdx * 1.37) % (Math.PI * 2);

      if (tCfg.type === 'pine') {
        const trunk = new THREE.Mesh(pineTrunkGeo, this.matJoshuaTrunk);
        trunk.position.y = 2.1;
        trunk.castShadow = true;
        tree.add(trunk);

        const tier1 = new THREE.Mesh(pineTier1Geo, this.matViewfinderGreen);
        tier1.position.y = 4.2;
        tier1.castShadow = true;
        tree.add(tier1);

        const tier2 = new THREE.Mesh(pineTier2Geo, this.matViewfinderGreen);
        tier2.position.y = 6.8;
        tier2.castShadow = true;
        tree.add(tier2);

        const tier3 = new THREE.Mesh(pineTier3Geo, this.matViewfinderGreen);
        tier3.position.y = 9.0;
        tier3.castShadow = true;
        tree.add(tier3);
      } else if (tCfg.type === 'cypress') {
        const trunk = new THREE.Mesh(cypressTrunkGeo, this.matWoodPole);
        trunk.position.y = 1.75;
        trunk.rotation.z = (tCfg.side > 0 ? -0.12 : 0.12);
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(cypressCrownGeo, this.matRiverReed);
        crown.position.set(tCfg.side * 0.4, 4.0, 0);
        crown.scale.set(1.2, 1.4, 1.1);
        crown.castShadow = true;
        tree.add(crown);
      } else if (tCfg.type === 'willow') {
        const trunk = new THREE.Mesh(willowTrunkGeo, this.matWoodPole);
        trunk.position.y = 1.9;
        trunk.rotation.z = (tCfg.side > 0 ? -0.15 : 0.15);
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(willowCrownGeo, this.matWillowFoliage);
        crown.position.set(tCfg.side * 0.5, 4.5, 0);
        crown.castShadow = true;
        tree.add(crown);
      } else {
        const trunk = new THREE.Mesh(cottonwoodTrunkGeo, this.matJoshuaTrunk);
        trunk.position.y = 2.25;
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(cottonwoodCrownGeo, this.matCottonwoodCrown);
        crown.position.set(0, 5.2, 0);
        crown.scale.set(1.3, 1.2, 1.2);
        crown.castShadow = true;
        tree.add(crown);
      }

      foliageGroup.add(tree);
    });

    // 2. Wildflower & Alpine Fern Clusters around the Waterfall Grotto & moist rocks
    const wfGrottoIdx = Math.floor(segments * 0.38);
    for (let f = -4; f <= 4; f += 2) {
      const idx = Math.min(segments, Math.max(0, wfGrottoIdx + f));
      const sp = spinePoints[idx];
      const { norm } = routeFrames[idx];
      const halfW = (sp.width || 14.5) * 0.5;

      [-1, 1].forEach((side) => {
        const fX = sp.pos.x + norm.x * (side * (halfW + 1.8 + Math.abs(f) * 0.4));
        const fZ = sp.pos.z + norm.z * (side * (halfW + 1.8 + Math.abs(f) * 0.4));
        const fY = this.splineRoad.getGroundElevation(fX, fZ);

        const fern = new THREE.Mesh(fernGeo, this.matFernGreen);
        fern.position.set(fX, fY + 0.25, fZ);
        fern.rotation.set(0.1, f * 0.8, 0);
        foliageGroup.add(fern);

        const poppy = new THREE.Mesh(flowerGeo, (Math.abs(f) % 4 === 0) ? this.matWildflowerPoppy : this.matWildflowerLupine);
        poppy.position.set(fX + 0.3, fY + 0.35, fZ - 0.2);
        foliageGroup.add(poppy);
      });
    }

    routeGroup.add(foliageGroup);
  }

  /**
   * 🪨 Build Craggy Canyon Geology, Stratified Bluffs, Talus Scree & Natural Rock Arch
   * Dramatic red sandstone walls and granite megaliths lining the Cougar Ridge canyon corridor
   */
  buildTrailCanyonGeology(trailGroup, spinePoints, trailFrames, segments) {
    const canyonGroup = new THREE.Group();
    canyonGroup.name = 'CougarRidgeCanyonGeology';

    // Shared reusable terraced geometries for high performance
    const bluffBaseGeo = new THREE.CylinderGeometry(6.5, 8.5, 5.0, 8);
    const bluffMidGeo = new THREE.CylinderGeometry(5.2, 6.8, 5.0, 8);
    const bluffCapGeo = new THREE.CylinderGeometry(5.8, 4.8, 1.8, 8);
    const talusGeo = new THREE.ConeGeometry(3.2, 2.8, 7);
    const spireGeo = new THREE.ConeGeometry(2.4, 14.0, 7);
    const megaBoulderGeo = new THREE.DodecahedronGeometry(3.2, 1);
    const slabGeo = new THREE.BoxGeometry(6.5, 1.6, 8.0);

    // 1. Lower Canyon Wash Stratified Red Sandstone Bluffs (t ≈ 0.05 - 0.13)
    const lowerBluffIndices = [12, 18, 24, 30];
    lowerBluffIndices.forEach((idx, bIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const halfW = (sp.width || 9.0) * 0.5;
      const side = 1;
      const wallDist = halfW + 22.0 + (bIdx % 3) * 2.0;

      const bx = sp.pos.x + norm.x * (side * wallDist);
      const bz = sp.pos.z + norm.z * (side * wallDist);
      const by = this.splineRoad.getGroundElevation(bx, bz);

      const bGroup = new THREE.Group();
      bGroup.position.set(bx, by, bz);
      bGroup.rotation.y = Math.atan2(dir.x, dir.z) + (side > 0 ? 0.3 : -0.3);

      // Terraced Base Tier (Sedimentary red rock)
      const baseMesh = new THREE.Mesh(bluffBaseGeo, (bIdx % 2 === 0) ? this.matMesaStrata : this.matMesaRed);
      baseMesh.position.y = 2.5;
      baseMesh.scale.set(0.95 + (bIdx % 3) * 0.2, 1.0, 1.05);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      bGroup.add(baseMesh);

      // Intermediate Stepped Tier (Indented ledge with varnish)
      const midMesh = new THREE.Mesh(bluffMidGeo, this.matMesaRed);
      midMesh.position.set(0.4, 7.0, -0.3);
      midMesh.scale.set(0.9 + (bIdx % 2) * 0.2, 1.0, 1.0);
      midMesh.castShadow = true;
      midMesh.receiveShadow = true;
      bGroup.add(midMesh);

      // Weathered Capstone (Sedona dark rimrock cap)
      const capMesh = new THREE.Mesh(bluffCapGeo, this.matMesaCap);
      capMesh.position.set(0.5, 9.8, -0.4);
      capMesh.castShadow = true;
      bGroup.add(capMesh);

      // Sloping talus scree cone at the base of the bluff (facing mountain side, zero road encroachment)
      const talus = new THREE.Mesh(talusGeo, this.matMesaTalus);
      talus.position.set(0, 1.6, -1.8);
      talus.scale.set(1.0, 0.9, 1.0);
      talus.rotation.y = bIdx * 1.4;
      talus.castShadow = true;
      bGroup.add(talus);

      canyonGroup.add(bGroup);
    });

    // 2. Cougar Creek Canyon Gorge & Dramatic Rock Overhang (t ≈ 0.26 - 0.32)
    const gorgeIndices = [68, 76];
    gorgeIndices.forEach((idx, gIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const halfW = (sp.width || 10.0) * 0.5;

      // Steep gorge wall on outer canyon side
      const wallDist = halfW + 28.0;
      const gx = sp.pos.x - norm.x * wallDist;
      const gz = sp.pos.z - norm.z * wallDist;
      const gy = this.splineRoad.getGroundElevation(gx, gz);

      const wall = new THREE.Mesh(bluffBaseGeo, this.matMesaRed);
      wall.position.set(gx, gy + 3.0, gz);
      wall.rotation.y = Math.atan2(dir.x, dir.z);
      wall.scale.set(0.9, 1.6, 1.4);
      wall.castShadow = true;
      wall.receiveShadow = true;
      canyonGroup.add(wall);

      // Rock overhang jutting above trail shoulder with safe vertical clearance (> 7.5m overhead)
      if (gIdx === 0) {
        const overhang = new THREE.Mesh(slabGeo, this.matMesaCap);
        overhang.position.set(sp.pos.x - norm.x * (halfW + 8.5), sp.pos.y + 8.2, sp.pos.z - norm.z * (halfW + 8.5));
        overhang.rotation.y = Math.atan2(dir.x, dir.z);
        overhang.rotation.z = -0.12;
        overhang.castShadow = true;
        canyonGroup.add(overhang);
      }
    });

    // 3. Majestic Red Sandstone Natural Arch (t ≈ 0.40, index ~102)
    // Towering natural portal archway framing entrance to Boulder Canyon Rock Crawl Arena
    const archSp = spinePoints[102];
    const archFrame = trailFrames[102];
    const archGroup = new THREE.Group();
    archGroup.position.copy(archSp.pos);
    archGroup.rotation.y = Math.atan2(archFrame.dir.x, archFrame.dir.z);

    // Arch Left Tapered Abutment (placed at x = -16.5m, giving 12.5m+ clear opening from roadbed halfW ~6.75m)
    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 4.0, 14.0, 8), this.matMesaRed);
    pillarL.position.set(-16.5, 7.0, 0);
    pillarL.rotation.z = 0.06;
    pillarL.castShadow = true;
    pillarL.receiveShadow = true;
    archGroup.add(pillarL);

    // Arch Right Tapered Abutment
    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 4.0, 14.0, 8), this.matMesaRed);
    pillarR.position.set(16.5, 7.0, 0);
    pillarR.rotation.z = -0.06;
    pillarR.castShadow = true;
    pillarR.receiveShadow = true;
    archGroup.add(pillarR);

    // Arch Sculpted Natural Span (spanning 33m across with > 12m vertical center clearance)
    const archSpan = new THREE.Mesh(new THREE.TorusGeometry(16.5, 2.6, 8, 16, Math.PI), this.matMesaStrata);
    archSpan.position.set(0, 7.5, 0);
    archSpan.scale.set(1.0, 0.82, 1.3);
    archSpan.castShadow = true;
    archSpan.receiveShadow = true;
    archGroup.add(archSpan);

    // Weathered eroded capstone on top of arch apex
    const archCap = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.8, 5.0), this.matMesaCap);
    archCap.position.set(0, 19.0, 0);
    archCap.castShadow = true;
    archGroup.add(archCap);

    canyonGroup.add(archGroup);

    // 4. Boulder Canyon Amphitheater Megaliths (t ≈ 0.44 - 0.49)
    [112, 124].forEach((idx, mIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const halfW = (sp.width || 12.0) * 0.5;

      [-1, 1].forEach((side, sIdx) => {
        const mDist = halfW + 14.5 + sIdx * 2.5;
        const mx = sp.pos.x + norm.x * (side * mDist);
        const mz = sp.pos.z + norm.z * (side * mDist);
        const my = this.splineRoad.getGroundElevation(mx, mz);

        const megalith = new THREE.Mesh(megaBoulderGeo, this.matGraniteGray);
        megalith.position.set(mx, my + 1.8, mz);
        megalith.scale.set(1.3, 1.1, 1.2);
        megalith.rotation.set((mIdx + sIdx) * 1.2, (mIdx * 2 + sIdx) * 1.5, 0.25);
        megalith.castShadow = true;
        megalith.receiveShadow = true;
        canyonGroup.add(megalith);
      });
    });

    // 5. Devil's Backbone Alpine Ridge Needle Spires (t ≈ 0.69 - 0.75, indices ~176-192)
    // Dizzying vertical rock pinnacles rising from the canyon depths along the knife-edge traverse
    [178, 184, 190].forEach((idx, pIdx) => {
      const sp = spinePoints[idx];
      const { norm } = trailFrames[idx];
      const halfW = (sp.width || 9.0) * 0.5;

      [-1, 1].forEach((side) => {
        const sDist = halfW + 11.5;
        const sx = sp.pos.x + norm.x * (side * sDist);
        const sz = sp.pos.z + norm.z * (side * sDist);
        const sy = this.splineRoad.getGroundElevation(sx, sz);

        const spire = new THREE.Mesh(spireGeo, this.matGraniteGray);
        spire.position.set(sx, sy + 5.0, sz);
        spire.rotation.set(0.08 * side, pIdx * 1.3, -0.05 * side);
        spire.scale.set(1.0 + (pIdx % 2) * 0.3, 0.9 + (pIdx % 3) * 0.3, 1.0);
        spire.castShadow = true;
        spire.receiveShadow = true;
        canyonGroup.add(spire);
      });
    });

    trailGroup.add(canyonGroup);
  }

  /**
   * 🌊 Build 3D Mud Bogs, Viscous Slurry Rut Basins & Reflective Water Puddles
   */
  buildTrailMudBogsAndPuddles(trailGroup, spinePoints, trailFrames, segments) {
    const mudGroup = new THREE.Group();
    mudGroup.name = 'CougarRidgeMudBogsAndPuddles';

    MUD_BOG_ZONES.forEach((bog) => {
      // Find spine points within bog.tMin to bog.tMax
      const bogSpine = [];
      const bogFrames = [];
      for (let i = 0; i <= segments; i++) {
        const sp = spinePoints[i];
        if (sp.t >= bog.tMin && sp.t <= bog.tMax) {
          bogSpine.push(sp);
          bogFrames.push(trailFrames[i]);
        }
      }
      if (bogSpine.length < 2) return;

      const nBog = bogSpine.length;

      // 1. Churned Mud Bed Mesh with Raised Berms
      const mudVertices = [];
      const mudUvs = [];
      const mudIndices = [];
      const mudColors = [];

      const crossOffsets = [-5.0, -3.4, -1.8, -0.6, 0.0, 0.6, 1.8, 3.4, 5.0];
      const crossDepths  = [ 0.02,  0.11, -0.16, -0.06, 0.04, -0.06, -0.16,  0.11, 0.02];

      for (let i = 0; i < nBog; i++) {
        const sp = bogSpine[i];
        const { norm } = bogFrames[i];
        const edgeT = Math.sin((i / (nBog - 1)) * Math.PI);

        for (let k = 0; k < crossOffsets.length; k++) {
          const off = crossOffsets[k];
          const dY = crossDepths[k] * edgeT;
          const px = sp.pos.x + norm.x * off;
          const pz = sp.pos.z + norm.z * off;
          const py = this.splineRoad.getGroundElevation(px, pz) + dY + 0.04;

          mudVertices.push(px, py, pz);
          mudUvs.push(k / (crossOffsets.length - 1), (i / nBog) * 8.0);
          
          const cTint = 0.88 + Math.sin(i * 1.5 + k) * 0.12;
          mudColors.push(0.18 * cTint, 0.11 * cTint, 0.07 * cTint);
        }

        if (i < nBog - 1) {
          const rowLen = crossOffsets.length;
          const b0 = i * rowLen;
          const b1 = (i + 1) * rowLen;
          for (let k = 0; k < rowLen - 1; k++) {
            mudIndices.push(b0 + k, b0 + k + 1, b1 + k);
            mudIndices.push(b0 + k + 1, b1 + k + 1, b1 + k);
          }
        }
      }

      const mudGeo = new THREE.BufferGeometry();
      mudGeo.setAttribute('position', new THREE.Float32BufferAttribute(mudVertices, 3));
      mudGeo.setAttribute('uv', new THREE.Float32BufferAttribute(mudUvs, 2));
      mudGeo.setAttribute('color', new THREE.Float32BufferAttribute(mudColors, 3));
      mudGeo.setIndex(mudIndices);
      mudGeo.computeVertexNormals();

      const mudMesh = new THREE.Mesh(mudGeo, this.matMudSlurry);
      mudMesh.receiveShadow = true;
      mudGroup.add(mudMesh);

      // 2. Glossy Standing Water Puddle Pools in Tire Ruts
      [-1.2, 1.2].forEach((rutOff) => {
        const puddleVertices = [];
        const puddleUvs = [];
        const puddleIndices = [];

        for (let i = 0; i < nBog; i++) {
          const sp = bogSpine[i];
          const { norm } = bogFrames[i];
          const edgeT = Math.sin((i / (nBog - 1)) * Math.PI);

          const wHalf = 1.15 * edgeT;
          const pL = sp.pos.clone().addScaledVector(norm, rutOff - wHalf);
          const pR = sp.pos.clone().addScaledVector(norm, rutOff + wHalf);

          const yL = this.splineRoad.getGroundElevation(pL.x, pL.z) + 0.045;
          const yR = this.splineRoad.getGroundElevation(pR.x, pR.z) + 0.045;

          puddleVertices.push(pL.x, yL, pL.z);
          puddleVertices.push(pR.x, yR, pR.z);
          puddleUvs.push(0, (i / nBog) * 6.0);
          puddleUvs.push(1, (i / nBog) * 6.0);

          if (i < nBog - 1) {
            const b = i * 2;
            puddleIndices.push(b, b + 1, b + 2);
            puddleIndices.push(b + 1, b + 3, b + 2);
          }
        }

        const puddleGeo = new THREE.BufferGeometry();
        puddleGeo.setAttribute('position', new THREE.Float32BufferAttribute(puddleVertices, 3));
        puddleGeo.setAttribute('uv', new THREE.Float32BufferAttribute(puddleUvs, 2));
        puddleGeo.setIndex(puddleIndices);
        puddleGeo.computeVertexNormals();

        const puddleMesh = new THREE.Mesh(puddleGeo, this.matMudPuddle);
        puddleMesh.receiveShadow = true;
        mudGroup.add(puddleMesh);
      });

      // 3. Scattered Moss Cobblestones along Bog Margins
      for (let r = 0; r < 8; r++) {
        const tFrac = 0.15 + (r / 8) * 0.70;
        const spIdx = Math.floor(tFrac * (nBog - 1));
        const sp = bogSpine[spIdx];
        const { norm } = bogFrames[spIdx];
        const side = (r % 2 === 0) ? -1 : 1;
        const latDist = (sp.width || 8.0) * 0.42 + (r % 3) * 0.5;

        const rx = sp.pos.x + norm.x * (side * latDist);
        const rz = sp.pos.z + norm.z * (side * latDist);
        const ry = this.splineRoad.getGroundElevation(rx, rz);

        const stoneMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.65 + (r % 4) * 0.15, 1),
          r % 2 === 0 ? this.matRiverMoss : this.matWetGranite
        );
        stoneMesh.position.set(rx, ry + 0.15, rz);
        stoneMesh.scale.set(1.3, 0.6, 1.1);
        stoneMesh.rotation.set((r * 0.7) % 2, r * 1.1, 0);
        stoneMesh.castShadow = true;
        stoneMesh.receiveShadow = true;
        mudGroup.add(stoneMesh);
      }
    });

    trailGroup.add(mudGroup);
  }

  /**
   * 🌲 Build Elevation-Tiered Wilderness Vegetation
   * Botanical progression: Desert Wash scrub & cacti -> Riparian reeds & cottonwoods -> Mountain manzanita -> Alpine Ponderosa pines & wildflowers
   */
  buildTrailWildernessVegetation(trailGroup, spinePoints, trailFrames, segments) {
    const vegGroup = new THREE.Group();
    vegGroup.name = 'CougarRidgeWildernessFlora';

    // Helper to merge buffer geometries with local transform
    const makeTransformed = (geo, pos, rot, scale) => {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (scale) g.scale(scale.x, scale.y, scale.z);
      if (rot) {
        if (rot.x) g.rotateX(rot.x);
        if (rot.y) g.rotateY(rot.y);
        if (rot.z) g.rotateZ(rot.z);
      }
      if (pos) g.translate(pos.x, pos.y, pos.z);
      return g;
    };

    // 1. Author High-Fidelity Archetype Geometries
    // Upgraded 5-Tier Sculpted Alpine Ponderosa Pine with Drooping Boughs
    const coniferCanopyGeo = mergeGeometries([
      makeTransformed(new THREE.ConeGeometry(4.4, 3.2, 8), { x: 0, y: 3.0, z: 0 }, { y: 0.0 }),
      makeTransformed(new THREE.ConeGeometry(3.6, 2.9, 8), { x: 0, y: 4.9, z: 0 }, { y: 0.42 }),
      makeTransformed(new THREE.ConeGeometry(2.9, 2.6, 8), { x: 0, y: 6.7, z: 0 }, { y: 0.85 }),
      makeTransformed(new THREE.ConeGeometry(2.1, 2.2, 8), { x: 0, y: 8.3, z: 0 }, { y: 1.30 }),
      makeTransformed(new THREE.ConeGeometry(1.3, 1.9, 7), { x: 0, y: 9.7, z: 0 }, { y: 1.72 })
    ]);
    const coniferTrunkGeo = mergeGeometries([
      makeTransformed(new THREE.CylinderGeometry(0.24, 0.52, 5.2, 7), { x: 0, y: 2.6, z: 0 }),
      makeTransformed(new THREE.CylinderGeometry(0.06, 0.04, 1.2, 5), { x: 0.45, y: 2.1, z: 0 }, { z: 1.35 }),
      makeTransformed(new THREE.CylinderGeometry(0.05, 0.03, 1.1, 5), { x: -0.42, y: 2.5, z: 0.15 }, { z: -1.35 })
    ]);

    // Upgraded Quaking Aspen (Slender pale trunk with delicate multi-cluster shimmering canopies)
    const aspenTrunkGeo = mergeGeometries([
      makeTransformed(new THREE.CylinderGeometry(0.14, 0.24, 5.2, 6), { x: 0, y: 2.6, z: 0 }),
      makeTransformed(new THREE.CylinderGeometry(0.06, 0.04, 1.3, 5), { x: 0.4, y: 3.8, z: 0.1 }, { z: 0.95 }),
      makeTransformed(new THREE.CylinderGeometry(0.05, 0.04, 1.2, 5), { x: -0.38, y: 4.4, z: -0.1 }, { z: -0.92 })
    ]);
    const aspenCanopyGeo = mergeGeometries([
      makeTransformed(new THREE.DodecahedronGeometry(1.8, 1), { x: 0, y: 5.2, z: 0 }, null, { x: 1.15, y: 1.3, z: 1.15 }),
      makeTransformed(new THREE.DodecahedronGeometry(1.4, 1), { x: 0.45, y: 6.4, z: -0.25 }, null, { x: 0.95, y: 1.1, z: 0.95 }),
      makeTransformed(new THREE.DodecahedronGeometry(1.2, 1), { x: -0.4, y: 5.8, z: 0.3 }, null, { x: 0.9, y: 1.05, z: 0.9 }),
      makeTransformed(new THREE.DodecahedronGeometry(1.0, 1), { x: 0.1, y: 7.3, z: 0.1 }, null, { x: 0.85, y: 0.95, z: 0.85 })
    ]);

    // Upgraded Riparian Cottonwood (Sprawling gnarled riverbank branches reaching toward water)
    const cottonTrunkGeo = mergeGeometries([
      makeTransformed(new THREE.CylinderGeometry(0.36, 0.62, 4.4, 7), { x: 0, y: 2.2, z: 0 }),
      makeTransformed(new THREE.CylinderGeometry(0.24, 0.18, 2.2, 6), { x: 0.7, y: 3.6, z: 0.2 }, { z: 0.65 }),
      makeTransformed(new THREE.CylinderGeometry(0.22, 0.16, 2.0, 6), { x: -0.65, y: 3.8, z: -0.2 }, { z: -0.62 })
    ]);
    const cottonCanopyGeo = mergeGeometries([
      makeTransformed(new THREE.DodecahedronGeometry(3.2, 1), { x: 0, y: 5.0, z: 0 }, null, { x: 1.35, y: 1.15, z: 1.35 }),
      makeTransformed(new THREE.DodecahedronGeometry(2.4, 1), { x: 1.2, y: 5.6, z: 0.4 }, null, { x: 1.1, y: 1.0, z: 1.1 }),
      makeTransformed(new THREE.DodecahedronGeometry(2.2, 1), { x: -1.1, y: 5.7, z: -0.3 }, null, { x: 1.05, y: 0.95, z: 1.05 }),
      makeTransformed(new THREE.DodecahedronGeometry(1.8, 1), { x: 0.2, y: 7.0, z: -0.1 }, null, { x: 0.95, y: 0.9, z: 0.95 })
    ]);

    // Upgraded Weeping Willow (Cascading drooping canopy along creek waters)
    const willowTrunkGeo = mergeGeometries([
      makeTransformed(new THREE.CylinderGeometry(0.26, 0.46, 4.0, 6), { x: 0, y: 2.0, z: 0 }),
      makeTransformed(new THREE.CylinderGeometry(0.18, 0.12, 1.8, 5), { x: 0.5, y: 3.3, z: 0 }, { z: 0.5 })
    ]);
    const willowCanopyGeo = mergeGeometries([
      makeTransformed(new THREE.CylinderGeometry(3.6, 2.4, 3.4, 8), { x: 0, y: 4.4, z: 0 }),
      makeTransformed(new THREE.DodecahedronGeometry(2.2, 1), { x: 0.6, y: 3.6, z: 0.5 }, null, { x: 1.1, y: 1.3, z: 1.1 }),
      makeTransformed(new THREE.DodecahedronGeometry(2.0, 1), { x: -0.6, y: 3.5, z: -0.4 }, null, { x: 1.05, y: 1.25, z: 1.05 })
    ]);

    // Weathered Fallen Alpine Timber / Downed Log
    const downedLogGeo = mergeGeometries([
      makeTransformed(new THREE.CylinderGeometry(0.28, 0.22, 6.8, 6), { x: 0, y: 0.26, z: 0 }, { z: Math.PI * 0.5 }),
      makeTransformed(new THREE.CylinderGeometry(0.08, 0.05, 0.9, 5), { x: 1.4, y: 0.6, z: 0.1 }, { x: 0.35, z: 0.2 }),
      makeTransformed(new THREE.CylinderGeometry(0.07, 0.04, 0.8, 5), { x: -1.2, y: 0.55, z: -0.15 }, { x: -0.4, z: -0.25 })
    ]);

    const manzanitaTrunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.4, 6);
    manzanitaTrunkGeo.translate(0, 0.7, 0);
    const manzanitaCanopyGeo = mergeGeometries([
      makeTransformed(new THREE.DodecahedronGeometry(1.1, 1), { x: -0.4, y: 1.5, z: 0 }, null, { x: 0.9, y: 0.7, z: 0.85 }),
      makeTransformed(new THREE.DodecahedronGeometry(1.0, 1), { x: 0.4, y: 1.7, z: 0.2 }, null, { x: 0.85, y: 0.65, z: 0.8 })
    ]);

    const sagebrushGeo = makeTransformed(new THREE.DodecahedronGeometry(0.95, 1), { x: 0, y: 0.45, z: 0 }, null, { x: 1.35, y: 0.7, z: 1.2 });

    const pricklyPearGeo = mergeGeometries([
      makeTransformed(new THREE.BoxGeometry(0.48, 0.62, 0.12), { x: -0.3, y: 0.35, z: 0 }, { x: 0.1, y: 0, z: 0.2 }),
      makeTransformed(new THREE.BoxGeometry(0.46, 0.58, 0.12), { x: 0.3, y: 0.38, z: 0.05 }, { x: -0.1, y: 0.2, z: -0.18 }),
      makeTransformed(new THREE.BoxGeometry(0.42, 0.52, 0.12), { x: -0.1, y: 0.75, z: -0.05 }, { x: 0, y: -0.1, z: 0.08 }),
      makeTransformed(new THREE.BoxGeometry(0.38, 0.48, 0.12), { x: 0.35, y: 0.82, z: 0.08 }, { x: 0.1, y: 0.1, z: -0.22 })
    ]);

    const wildflowerGeo = mergeGeometries([
      makeTransformed(new THREE.DodecahedronGeometry(0.28, 1), { x: -0.25, y: 0.22, z: 0 }),
      makeTransformed(new THREE.DodecahedronGeometry(0.30, 1), { x: 0.25, y: 0.26, z: 0.1 }),
      makeTransformed(new THREE.ConeGeometry(0.22, 0.75, 5), { x: 0, y: 0.42, z: -0.15 }),
      makeTransformed(new THREE.ConeGeometry(0.20, 0.65, 5), { x: -0.2, y: 0.36, z: 0.2 })
    ]);

    const riverReedGeo = mergeGeometries([
      makeTransformed(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 5), { x: -0.2, y: 0.8, z: 0 }, { x: 0.05, y: 0, z: -0.1 }),
      makeTransformed(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 5), { x: 0.15, y: 0.9, z: 0.1 }, { x: -0.05, y: 0, z: 0.08 }),
      makeTransformed(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 5), { x: 0, y: 0.75, z: -0.15 }, { x: 0.08, y: 0, z: 0.04 }),
      makeTransformed(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 5), { x: 0.15, y: 1.6, z: 0.1 })
    ]);

    const riverStoneGeo = makeTransformed(new THREE.DodecahedronGeometry(1.0, 1), { x: 0, y: 0.35, z: 0 }, null, { x: 1.35, y: 0.55, z: 1.2 });
    const talusBoulderGeo = makeTransformed(new THREE.DodecahedronGeometry(1.0, 1), { x: 0, y: 0.55, z: 0 }, null, { x: 1.25, y: 0.95, z: 1.15 });

    // Placement records
    const pineMatrices = [];
    const aspenMatrices = [];
    const cottonMatrices = [];
    const willowMatrices = [];
    const downedLogMatrices = [];
    const manzanitaMatrices = [];
    const sageMatrices = [];
    const cactusMatrices = [];
    const flowerMatrices = [];
    const reedMatrices = [];
    const riverStoneMatrices = [];
    const talusMatrices = [];

    const dummy = new THREE.Object3D();

    for (let i = 2; i <= segments - 2; i += 2) {
      const sp = spinePoints[i];
      const { dir, norm } = trailFrames[i];
      const halfW = (sp.width || 9.0) * 0.5;
      const t = sp.t;

      [-1, 1].forEach((side, sIdx) => {
        const seed = (i * 17 + sIdx * 31) % 100;
        const seed2 = (i * 23 + sIdx * 47) % 100;

        // ── TIER 0: Lower Desert Wash (t = 0.00 - 0.14) ──────────────────────
        if (t <= 0.14) {
          // Sagebrush
          if (seed < 70) {
            const d = halfW + 1.8 + (seed % 20) * 0.15;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed * 0.1, 0);
            const s = 0.85 + (seed % 30) * 0.015;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            sageMatrices.push(dummy.matrix.clone());
          }
          // Prickly Pear Cacti
          if (seed2 < 45) {
            const d = halfW + 3.2 + (seed2 % 25) * 0.15;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed2 * 0.15, 0);
            const s = 0.9 + (seed2 % 20) * 0.02;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            cactusMatrices.push(dummy.matrix.clone());
          }
          // Talus boulders
          if (seed < 35) {
            const d = halfW + 5.5 + (seed % 30) * 0.2;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(seed * 0.2, seed * 0.3, 0);
            const s = 0.8 + (seed % 40) * 0.025;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            talusMatrices.push(dummy.matrix.clone());
          }
        }

        // ── TIER 1: Cougar Creek & Riparian Canyon (t = 0.14 - 0.35) ─────────
        else if (t > 0.14 && t <= 0.35) {
          // Reeds along water's edge
          if (t >= 0.15 && t <= 0.23 && seed < 75) {
            const d = halfW + 0.8 + (seed % 15) * 0.1;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed * 0.2, 0);
            dummy.scale.set(1, 1 + (seed % 20) * 0.02, 1);
            dummy.updateMatrix();
            reedMatrices.push(dummy.matrix.clone());
          }
          // River stones in creek bed
          if (t >= 0.15 && t <= 0.23 && seed2 < 60) {
            const d = (seed2 % 30 - 15) * 0.25;
            const px = sp.pos.x + norm.x * d;
            const pz = sp.pos.z + norm.z * d;
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz) - 0.02, pz);
            dummy.rotation.set(0.1, seed2 * 0.3, 0.1);
            const s = 0.9 + (seed2 % 30) * 0.02;
            dummy.scale.set(s, s * 0.6, s);
            dummy.updateMatrix();
            riverStoneMatrices.push(dummy.matrix.clone());
          }
          // Riparian Trees (Cottonwoods & Willows)
          if (i % 6 === 0) {
            const d = halfW + 4.5 + (seed % 25) * 0.2;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed * 0.3, (side > 0 ? -0.1 : 0.1));
            const s = 1.0 + (seed % 30) * 0.015;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            if (sIdx === 0) {
              cottonMatrices.push(dummy.matrix.clone());
            } else {
              willowMatrices.push(dummy.matrix.clone());
            }
          }
        }

        // ── TIER 2: Mid-Canyon & Boulder Arena (t = 0.35 - 0.65) ─────────────
        else if (t > 0.35 && t <= 0.65) {
          // Thunder Creek reeds & river stones
          if (t >= 0.58 && t <= 0.65) {
            if (seed < 70) {
              const d = halfW + 0.8 + (seed % 15) * 0.1;
              const px = sp.pos.x + norm.x * (side * d);
              const pz = sp.pos.z + norm.z * (side * d);
              dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
              dummy.rotation.set(0, seed * 0.2, 0);
              dummy.scale.set(1, 1, 1);
              dummy.updateMatrix();
              reedMatrices.push(dummy.matrix.clone());
            }
            if (seed2 < 60) {
              const d = (seed2 % 30 - 15) * 0.25;
              const px = sp.pos.x + norm.x * d;
              const pz = sp.pos.z + norm.z * d;
              dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz) - 0.02, pz);
              dummy.rotation.set(0.1, seed2 * 0.3, 0.1);
              const s = 0.9 + (seed2 % 30) * 0.02;
              dummy.scale.set(s, s * 0.6, s);
              dummy.updateMatrix();
              riverStoneMatrices.push(dummy.matrix.clone());
            }
          }
          // Manzanita shrubs
          if (seed < 55) {
            const d = halfW + 2.4 + (seed % 20) * 0.15;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed * 0.25, 0);
            const s = 0.9 + (seed % 25) * 0.02;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            manzanitaMatrices.push(dummy.matrix.clone());
          }
          // Talus boulders & scree
          if (seed2 < 40) {
            const d = halfW + 4.8 + (seed2 % 30) * 0.2;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(seed2 * 0.1, seed2 * 0.2, 0);
            const s = 1.0 + (seed2 % 40) * 0.03;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            talusMatrices.push(dummy.matrix.clone());
          }
        }

        // ── TIER 3 & 4: Alpine Ridge, Hanging Valley & Summit (t = 0.65 - 1.00) ──
        else {
          // Alpine Ponderosa Pines (Dense evergreen forest)
          if (i % 4 === 0) {
            const d = halfW + 5.2 + (seed % 35) * 0.25;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed * 0.4, (seed % 10 - 5) * 0.015);
            const s = 1.0 + (seed % 40) * 0.02;
            dummy.scale.set(s, s * (1.0 + (seed2 % 20) * 0.015), s);
            dummy.updateMatrix();
            pineMatrices.push(dummy.matrix.clone());
          }
          // Dense background grove in Hanging Valley (t = 0.82 - 0.95)
          if (t >= 0.82 && t <= 0.95 && i % 4 === 2) {
            const d = halfW + 14.0 + (seed2 % 40) * 0.3;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed2 * 0.3, 0);
            const s = 1.2 + (seed2 % 30) * 0.02;
            dummy.scale.set(s, s * 1.2, s);
            dummy.updateMatrix();
            pineMatrices.push(dummy.matrix.clone());
          }
          // Quaking Aspens in Hanging Valley
          if (t >= 0.84 && t <= 0.94 && i % 6 === 0) {
            const d = halfW + 3.8 + (seed % 20) * 0.2;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed * 0.35, 0);
            const s = 0.95 + (seed % 25) * 0.02;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            aspenMatrices.push(dummy.matrix.clone());
          }
          // Wildflower carpets (poppies & lupines)
          if (seed < 65) {
            const d = halfW + 1.2 + (seed % 20) * 0.12;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz), pz);
            dummy.rotation.set(0, seed * 0.2, 0);
            const s = 0.8 + (seed % 30) * 0.015;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            flowerMatrices.push(dummy.matrix.clone());
          }
          // Fallen alpine logs framing trail borders in upper canyon & Hanging Valley
          if (t >= 0.70 && i % 8 === 0 && seed < 65) {
            const d = halfW + 1.8 + (seed % 15) * 0.12;
            const px = sp.pos.x + norm.x * (side * d);
            const pz = sp.pos.z + norm.z * (side * d);
            dummy.position.set(px, this.splineRoad.getGroundElevation(px, pz) + 0.05, pz);
            dummy.rotation.set(0.03, Math.atan2(dir.x, dir.z) + (seed % 10 - 5) * 0.08, 0.02);
            dummy.scale.set(1.0, 1.0, 0.9 + (seed2 % 25) * 0.02);
            dummy.updateMatrix();
            downedLogMatrices.push(dummy.matrix.clone());
          }
        }
      });
    }

    // Keep trunks, canopies, logs and ground clutter out of the clearing together.
    // The extra 7m setback accounts for canopy overhang, not just trunk position.
    const summitAnchor = spinePoints[segments].pos;
    const createInstanced = (geo, mat, matrices, name, castShadow = true) => {
      matrices = matrices.filter(m => !isInsideSummitClearing(
        m.elements[12] - summitAnchor.x, m.elements[14] - summitAnchor.z, 7));
      if (!matrices.length) return null;
      const inst = new THREE.InstancedMesh(geo, mat, matrices.length);
      inst.name = name;
      inst.castShadow = castShadow;
      inst.receiveShadow = true;
      for (let m = 0; m < matrices.length; m++) {
        inst.setMatrixAt(m, matrices[m]);
      }
      inst.instanceMatrix.needsUpdate = true;
      return inst;
    };

    // Instantiate all wilderness flora batches
    const pineCanopyInst = createInstanced(coniferCanopyGeo, this.matPineNeedles, pineMatrices, 'Instanced_PineCanopies');
    const pineTrunkInst = createInstanced(coniferTrunkGeo, this.matPineBark, pineMatrices, 'Instanced_PineTrunks');
    if (pineCanopyInst) vegGroup.add(pineCanopyInst);
    if (pineTrunkInst) vegGroup.add(pineTrunkInst);

    const downedLogInst = createInstanced(downedLogGeo, this.matDownedLog, downedLogMatrices, 'Instanced_DownedLogs');
    if (downedLogInst) vegGroup.add(downedLogInst);

    const aspenCanopyInst = createInstanced(aspenCanopyGeo, this.matAspenFoliage, aspenMatrices, 'Instanced_AspenCanopies');
    const aspenTrunkInst = createInstanced(aspenTrunkGeo, this.matAspenTrunk, aspenMatrices, 'Instanced_AspenTrunks');
    if (aspenCanopyInst) vegGroup.add(aspenCanopyInst);
    if (aspenTrunkInst) vegGroup.add(aspenTrunkInst);

    const cottonCanopyInst = createInstanced(cottonCanopyGeo, this.matCottonwoodCrown, cottonMatrices, 'Instanced_CottonwoodCanopies');
    const cottonTrunkInst = createInstanced(cottonTrunkGeo, this.matJoshuaTrunk, cottonMatrices, 'Instanced_CottonwoodTrunks');
    if (cottonCanopyInst) vegGroup.add(cottonCanopyInst);
    if (cottonTrunkInst) vegGroup.add(cottonTrunkInst);

    const willowCanopyInst = createInstanced(willowCanopyGeo, this.matWillowFoliage, willowMatrices, 'Instanced_WillowCanopies');
    const willowTrunkInst = createInstanced(willowTrunkGeo, this.matWoodPole, willowMatrices, 'Instanced_WillowTrunks');
    if (willowCanopyInst) vegGroup.add(willowCanopyInst);
    if (willowTrunkInst) vegGroup.add(willowTrunkInst);

    const manzanitaCanopyInst = createInstanced(manzanitaCanopyGeo, this.matManzanitaLeaves, manzanitaMatrices, 'Instanced_ManzanitaCanopies');
    const manzanitaTrunkInst = createInstanced(manzanitaTrunkGeo, this.matManzanitaBark, manzanitaMatrices, 'Instanced_ManzanitaTrunks');
    if (manzanitaCanopyInst) vegGroup.add(manzanitaCanopyInst);
    if (manzanitaTrunkInst) vegGroup.add(manzanitaTrunkInst);

    const sageInst = createInstanced(sagebrushGeo, this.matSagebrush, sageMatrices, 'Instanced_DesertSagebrush');
    if (sageInst) vegGroup.add(sageInst);

    const cactusInst = createInstanced(pricklyPearGeo, this.matPricklyPad, cactusMatrices, 'Instanced_PricklyPearCacti');
    if (cactusInst) vegGroup.add(cactusInst);

    const flowerInst = createInstanced(wildflowerGeo, this.matWildflowerPoppy, flowerMatrices, 'Instanced_Wildflowers', false);
    if (flowerInst) vegGroup.add(flowerInst);

    const reedInst = createInstanced(riverReedGeo, this.matRiverReed, reedMatrices, 'Instanced_RiverReeds');
    if (reedInst) vegGroup.add(reedInst);

    const riverStoneInst = createInstanced(riverStoneGeo, this.matWetGranite, riverStoneMatrices, 'Instanced_RiverStones');
    if (riverStoneInst) vegGroup.add(riverStoneInst);

    const talusInst = createInstanced(talusBoulderGeo, this.matDesertBoulder, talusMatrices, 'Instanced_TalusBoulders');
    if (talusInst) vegGroup.add(talusInst);

    trailGroup.add(vegGroup);
  }

  /**
   * 🪧 Build Backcountry 4x4 / Overland Trail Infrastructure, Recovery Gear & USFS Signs
   * Realistic routed timber signage, grade warnings, winch anchor points & traction boards
   */
  buildTrailOverlandInfrastructure(trailGroup, spinePoints, trailFrames, segments) {
    const infraGroup = new THREE.Group();
    infraGroup.name = 'CougarRidgeOverlandInfrastructure';

    // Helper: generate an authentic routed cedar USFS/BLM backcountry trail sign texture with true aspect ratio & high readability
    const generateTrailSignTexture = (textLine1, textLine2, badgeType, width, height) => {
      const planeW = width * 0.96;
      const planeH = height * 0.90;
      const aspect = planeW / planeH;
      const W = 2048;
      const H = Math.max(512, Math.round(W / aspect));

      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Weathered Routed Cedar Plank Base
      ctx.fillStyle = '#341a0e';
      ctx.fillRect(0, 0, W, H);

      // Procedural horizontal wood grain striations
      for (let y = 0; y < H; y += 4) {
        const grainAlpha = 0.05 + Math.sin(y * 0.15) * 0.035 + (Math.random() * 0.03);
        ctx.fillStyle = (y % 8 === 0) ? `rgba(15, 8, 4, ${grainAlpha * 1.8})` : `rgba(85, 48, 26, ${grainAlpha})`;
        ctx.fillRect(0, y, W, 3 + Math.random() * 2);
      }

      // Outer chiseled border rim
      ctx.strokeStyle = '#1a0d06';
      ctx.lineWidth = 22;
      ctx.strokeRect(20, 20, W - 40, H - 40);

      // Inner routed groove with subtle bevel highlight
      ctx.strokeStyle = '#120703';
      ctx.lineWidth = 8;
      ctx.strokeRect(36, 36, W - 72, H - 72);
      ctx.strokeStyle = 'rgba(195, 135, 85, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(44, 44, W - 88, H - 88);

      // Brass corner mounting bolts
      const boltMargin = 58;
      const bolts = [
        [boltMargin, boltMargin],
        [W - boltMargin, boltMargin],
        [boltMargin, H - boltMargin],
        [W - boltMargin, H - boltMargin]
      ];
      bolts.forEach(([bx, by]) => {
        ctx.fillStyle = '#0f0602';
        ctx.beginPath();
        ctx.arc(bx + 3, by + 3, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b48148';
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(bx - 3, by - 3, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Top Agency Header
      const headerY = Math.round(H * 0.13);
      const headerFontSize = Math.max(32, Math.round(H * 0.076));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${headerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = '#100703';
      ctx.fillText('★  U.S. FOREST SERVICE • COUGAR RIDGE 4x4 TRAIL  ★', W * 0.5 + 2, headerY + 2);
      ctx.fillStyle = '#fef3c7';
      ctx.fillText('★  U.S. FOREST SERVICE • COUGAR RIDGE 4x4 TRAIL  ★', W * 0.5, headerY);

      // Separator rule under agency header
      const ruleY = Math.round(H * 0.21);
      ctx.strokeStyle = '#120703';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, ruleY + 1);
      ctx.lineTo(W - 100, ruleY + 1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, ruleY);
      ctx.lineTo(W - 100, ruleY);
      ctx.stroke();

      // 3. Trail Difficulty Badge Emblem (left side, 1:1 true aspect ratio)
      const bCenterX = Math.round(W * 0.125);
      const bCenterY = Math.round(H * 0.53);
      let textStartX = W * 0.5;
      let maxTextW = W - 180;

      if (badgeType) {
        textStartX = Math.round(W * 0.575);
        maxTextW = Math.round(W * 0.73);
        const badgeRadius = Math.round(H * 0.185);

        if (badgeType === 'green') {
          // Green Circle: Easy / Scenic
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(bCenterX, bCenterY, badgeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${Math.round(badgeRadius * 0.38)}px sans-serif`;
          ctx.fillText('EASY', bCenterX, bCenterY);
        } else if (badgeType === 'blue') {
          // Blue Square: More Difficult
          const halfSide = badgeRadius;
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(bCenterX - halfSide, bCenterY - halfSide, halfSide * 2, halfSide * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 8;
          ctx.strokeRect(bCenterX - halfSide, bCenterY - halfSide, halfSide * 2, halfSide * 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${Math.round(badgeRadius * 0.32)}px sans-serif`;
          ctx.fillText('MODERATE', bCenterX, bCenterY);
        } else if (badgeType === 'black') {
          // Black Diamond: Technical Rock Crawl
          const diamondHalf = Math.round(badgeRadius * 0.92);
          ctx.save();
          ctx.translate(bCenterX, bCenterY);
          ctx.rotate(Math.PI * 0.25);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-diamondHalf, -diamondHalf, diamondHalf * 2, diamondHalf * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 8;
          ctx.strokeRect(-diamondHalf, -diamondHalf, diamondHalf * 2, diamondHalf * 2);
          ctx.restore();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${Math.round(badgeRadius * 0.31)}px sans-serif`;
          ctx.fillText('DIFFICULT', bCenterX, bCenterY);
        } else if (badgeType === 'double_black') {
          // Double Black Diamond: Extreme / Expert
          const dHalf = Math.round(badgeRadius * 0.65);
          [-Math.round(dHalf * 0.85), Math.round(dHalf * 0.85)].forEach(dx => {
            ctx.save();
            ctx.translate(bCenterX + dx, bCenterY - 12);
            ctx.rotate(Math.PI * 0.25);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-dHalf, -dHalf, dHalf * 2, dHalf * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 7;
            ctx.strokeRect(-dHalf, -dHalf, dHalf * 2, dHalf * 2);
            ctx.restore();
          });
          ctx.fillStyle = '#ef4444';
          ctx.font = `900 ${Math.round(badgeRadius * 0.32)}px sans-serif`;
          ctx.fillText('EXTREME', bCenterX, bCenterY + badgeRadius + 4);
        }
      }

      // 4. Primary Carved Highway Title (deep-engraved routed lettering)
      const titleY = textLine2 ? Math.round(H * 0.44) : Math.round(H * 0.53);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let titleFontSize = Math.round(H * 0.16);
      ctx.font = `900 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
      let textW = ctx.measureText(textLine1).width;
      while (textW > maxTextW && titleFontSize > 48) {
        titleFontSize -= 2;
        ctx.font = `900 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
        textW = ctx.measureText(textLine1).width;
      }

      // Routed carved 3D effect: dark drop shadow + carved wood highlight
      ctx.fillStyle = '#0a0402';
      ctx.fillText(textLine1, textStartX + 4, titleY + 4);
      ctx.fillStyle = '#5c361e';
      ctx.fillText(textLine1, textStartX - 2, titleY - 2);
      // Bright routed highway enamel yellow face
      ctx.fillStyle = '#ffe044';
      ctx.fillText(textLine1, textStartX, titleY);

      // 5. Secondary Guidance Text (Subtitle)
      if (textLine2) {
        const subY = Math.round(H * 0.65);
        let subFontSize = Math.round(H * 0.095);
        ctx.font = `800 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
        let subW = ctx.measureText(textLine2).width;
        while (subW > maxTextW && subFontSize > 30) {
          subFontSize -= 2;
          ctx.font = `800 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
          subW = ctx.measureText(textLine2).width;
        }

        // Drop shadow & bright ivory/white text
        ctx.fillStyle = '#0a0402';
        ctx.fillText(textLine2, textStartX + 3, subY + 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(textLine2, textStartX, subY);
      }

      // 6. Regulatory Bottom Footer
      const footerRuleY = Math.round(H * 0.81);
      ctx.strokeStyle = '#120703';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, footerRuleY + 1);
      ctx.lineTo(W - 100, footerRuleY + 1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, footerRuleY);
      ctx.lineTo(W - 100, footerRuleY);
      ctx.stroke();

      const footerY = Math.round(H * 0.89);
      const footerFontSize = Math.max(22, Math.round(H * 0.054));
      ctx.font = `800 ${footerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#0a0402';
      ctx.fillText('4WD HIGH-CLEARANCE TRAIL • STAY ON MARKED ROUTE • TREAD LIGHTLY!®', W * 0.5 + 2, footerY + 2);
      ctx.fillStyle = '#fde68a';
      ctx.fillText('4WD HIGH-CLEARANCE TRAIL • STAY ON MARKED ROUTE • TREAD LIGHTLY!®', W * 0.5, footerY);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      return tex;
    };

    // Helper: create a routed timber backcountry signpost
    const createRoutedSign = (textLine1, textLine2, badgeType, width = 6.0, height = 2.5) => {
      const g = new THREE.Group();

      const boardCenterY = 2.75;
      const postH = 4.8;
      const postOffset = width * 0.38;
      const postGeo = new THREE.CylinderGeometry(0.16, 0.20, postH, 8);

      [-postOffset, postOffset].forEach(px => {
        const post = new THREE.Mesh(postGeo, this.matWoodPole);
        post.position.set(px, postH * 0.5 - 0.2, -0.06);
        post.castShadow = true;
        post.receiveShadow = true;
        g.add(post);

        // Angled timber brace underneath
        const braceGeo = new THREE.CylinderGeometry(0.08, 0.10, 1.6, 6);
        const brace = new THREE.Mesh(braceGeo, this.matWoodPole);
        const signSide = px > 0 ? 1 : -1;
        brace.position.set(px - signSide * 0.55, 1.25, -0.06);
        brace.rotation.z = signSide * 0.62;
        brace.castShadow = true;
        g.add(brace);
      });

      // Rustic routed backboard (dark brown weathered cedar)
      const board = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.16), this.matWoodSignBrown);
      board.position.set(0, boardCenterY, 0);
      board.castShadow = true;
      board.receiveShadow = true;
      g.add(board);

      // Top weather protective timber roof / lintel cap
      const cap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.45, 0.18, 0.30), this.matWoodPole);
      cap.position.set(0, boardCenterY + height * 0.5 + 0.08, 0);
      cap.castShadow = true;
      g.add(cap);

      // Front routed sign graphic face with exact 1:1 aspect ratio mapping
      const signTex = generateTrailSignTexture(textLine1, textLine2, badgeType, width, height);
      const faceMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.FrontSide });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.96, height * 0.90), faceMat);
      face.position.set(0, boardCenterY, 0.085); // 5mm in front of board front surface
      g.add(face);

      return g;
    };

    // Helper: place a sign along the trail at a given parameter t
    const placeTrailSign = (t, side, text1, text2, badgeType, width = 6.0, height = 2.5) => {
      const idx = Math.floor(t * segments);
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const halfW = (sp.width || 10.0) * 0.5;

      const sx = sp.pos.x + norm.x * (side * (halfW + 2.5));
      const sz = sp.pos.z + norm.z * (side * (halfW + 2.5));
      const sy = this.splineRoad.getGroundElevation(sx, sz);

      const sign = createRoutedSign(text1, text2, badgeType, width, height);
      sign.position.set(sx, sy, sz);
      sign.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI + (side > 0 ? -0.55 : 0.55); // Face oncoming vehicles, angled ~32° inward toward trail
      infraGroup.add(sign);
    };

    // 1. Trailhead Expedition Billboard (t = 0.015)
    placeTrailSign(0.015, -1, 'COUGAR RIDGE 4x4 EXPEDITION', 'HIGH CLEARANCE 4WD ONLY', 'green', 6.6, 2.6);

    // 2. Steep Incline & Low Range Advisory (t = 0.28)
    placeTrailSign(0.28, 1, 'STEEP GRADE 18% • 4L LOW ONLY', 'MAINTAIN FORWARD MOMENTUM', 'blue', 6.2, 2.5);

    // 3. Boulder Canyon Extreme Crawl Notice (t = 0.38)
    placeTrailSign(0.38, -1, 'BOULDER CANYON ROCK CRAWL', 'LOCK DIFFERENTIALS • CRAWL 4:1', 'black', 6.2, 2.5);

    // 4. Thunder Creek Rapids Crossing Notice (t = 0.58)
    placeTrailSign(0.58, 1, 'THUNDER CREEK RAPIDS FORD', 'WATERFALL OUTFLOW • 18 IN DEPTH', 'blue', 6.2, 2.5);

    // 5. Devil\'s Backbone Knife-Edge Warning (t = 0.69)
    placeTrailSign(0.69, -1, "DEVIL'S BACKBONE KNIFE-EDGE", 'STAY IN TRACKS • 1,000 FT DROP', 'double_black', 6.4, 2.6);

    // 6. Summit Threshold Benchmark (t = 0.96)
    placeTrailSign(0.96, 1, 'GRAND SUMMIT PLATEAU', 'ELEVATION 3,500 FT • 360° VISTA', 'green', 6.2, 2.5);

    // =========================================================================
    // TECHNICAL 4x4 RECOVERY HARDWARE (TRACTION BOARDS & WINCH ANCHORS)
    // =========================================================================
    // High-visibility Orange Traction Recovery Boards (Maxtrax style)
    const recoveryBoardSpots = [
      { t: 0.21, side: 1 },  // Creek exit mud bank
      { t: 0.46, side: -1 }, // Boulder Arena apex
      { t: 0.64, side: 1 }   // Thunder Creek exit
    ];

    recoveryBoardSpots.forEach(rb => {
      const idx = Math.floor(rb.t * segments);
      const sp = spinePoints[idx];
      const { norm, dir } = trailFrames[idx];
      const halfW = (sp.width || 10.0) * 0.5;

      const px = sp.pos.x + norm.x * (rb.side * (halfW + 1.2));
      const pz = sp.pos.z + norm.z * (rb.side * (halfW + 1.2));
      const py = this.splineRoad.getGroundElevation(px, pz);

      const rackGroup = new THREE.Group();
      rackGroup.position.set(px, py, pz);
      rackGroup.rotation.y = Math.atan2(dir.x, dir.z);

      // Timber post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.9, 6), this.matWoodPole);
      post.position.y = 0.95;
      post.castShadow = true;
      rackGroup.add(post);

      // Pair of orange traction boards mounted on post
      [-0.04, 0.04].forEach(bz => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.15, 0.05), this.matRecoveryBoardOrange);
        board.position.set(0, 1.1, bz);
        board.castShadow = true;
        rackGroup.add(board);
      });

      infraGroup.add(rackGroup);
    });

    trailGroup.add(infraGroup);
  }

  /**
   * ⛺ Build Grand Summit Base Camp Polish, Observation Pavilion & Weather Station
   * Timber shelter, camp table with topo map, lantern, campfire kettle & anemometer
   */
  buildSummitBaseCampDetails(overlookGroup) {
    const campGroup = new THREE.Group();
    campGroup.name = 'SummitBaseCampDetails';

    // =========================================================================
    // 1. RUSTIC TIMBER OBSERVATION PAVILION / SHELTER (NW Corner of Deck)
    // =========================================================================
    const shelterGroup = new THREE.Group();
    shelterGroup.name = 'SummitPavilion';
    placeSummitProp(shelterGroup, this.splineRoad, overlookGroup.position, SUMMIT_LAYOUT.shelter);
    shelterGroup.rotation.y = 0.25;

    const postH = 3.6;
    const postGeo = new THREE.CylinderGeometry(0.18, 0.22, postH, 8);

    // 4 Corner Timber Posts
    [
      { x: -3.2, z: -2.4 },
      { x: 3.2, z: -2.4 },
      { x: -3.2, z: 2.4 },
      { x: 3.2, z: 2.4 }
    ].forEach(pPos => {
      const p = new THREE.Mesh(postGeo, this.matWoodPole);
      p.position.set(pPos.x, postH * 0.5, pPos.z);
      p.castShadow = true;
      shelterGroup.add(p);
    });

    // Top Perimeter Ring Beams
    const beamLong = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.32, 0.32), this.matWoodPole);
    beamLong.position.set(0, postH, -2.4);
    beamLong.castShadow = true;
    shelterGroup.add(beamLong);

    const beamLong2 = beamLong.clone();
    beamLong2.position.set(0, postH, 2.4);
    shelterGroup.add(beamLong2);

    const beamShort = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 5.1), this.matWoodPole);
    beamShort.position.set(-3.2, postH, 0);
    beamShort.castShadow = true;
    shelterGroup.add(beamShort);

    const beamShort2 = beamShort.clone();
    beamShort2.position.set(3.2, postH, 0);
    shelterGroup.add(beamShort2);

    // Pitched Roof Clad in Weathered Cedar Shakes
    const roofSlopeL = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.12, 3.2), this.matCedarShake);
    roofSlopeL.position.set(0, postH + 0.85, -1.25);
    roofSlopeL.rotation.x = Math.PI * 0.18;
    roofSlopeL.castShadow = true;
    shelterGroup.add(roofSlopeL);

    const roofSlopeR = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.12, 3.2), this.matCedarShake);
    roofSlopeR.position.set(0, postH + 0.85, 1.25);
    roofSlopeR.rotation.x = -Math.PI * 0.18;
    roofSlopeR.castShadow = true;
    shelterGroup.add(roofSlopeR);

    // Vintage Green Camp Lantern hanging from central shelter ridge beam
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, postH - 0.25, 0);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 4), this.matCastIronDark);
    cord.position.y = -0.22;
    lanternGroup.add(cord);

    const lanternTop = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 8), this.matViewfinderGreen);
    lanternTop.position.y = -0.48;
    lanternGroup.add(lanternTop);

    const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.22, 8), this.matCityWindowGlow);
    lanternGlass.position.y = -0.62;
    lanternGroup.add(lanternGlass);

    const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.10, 8), this.matViewfinderGreen);
    lanternBase.position.y = -0.76;
    lanternGroup.add(lanternBase);

    shelterGroup.add(lanternGroup);

    // =========================================================================
    // 2. WEATHERED TIMBER EXPEDITION PICNIC TABLE WITH TOPOGRAPHIC MAP
    // =========================================================================
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);

    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.10, 1.4), this.matWoodSignBrown);
    tabletop.position.y = 0.85;
    tabletop.castShadow = true;
    tableGroup.add(tabletop);

    // Table legs
    [-1.0, 1.0].forEach(tx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 1.2), this.matWoodPole);
      leg.position.set(tx, 0.425, 0);
      leg.castShadow = true;
      tableGroup.add(leg);

      // Attached benches
      [-1.1, 1.1].forEach(bz => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.38), this.matWoodSignBrown);
        bench.position.set(0, 0.52, bz);
        bench.castShadow = true;
        tableGroup.add(bench);
      });
    });

    // Topographic Map Sheet spread across table
    const mapSheet = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), this.matTrailSignYellow);
    mapSheet.rotation.x = -Math.PI * 0.5;
    mapSheet.position.set(0, 0.91, 0);
    tableGroup.add(mapSheet);

    shelterGroup.add(tableGroup);
    campGroup.add(shelterGroup);

    // =========================================================================
    // 3. FIREWOOD STACK BUNDLE WITH CANVAS TARP
    // =========================================================================
    const woodpileGroup = new THREE.Group();
    woodpileGroup.name = 'SummitFirewood';
    placeSummitProp(woodpileGroup, this.splineRoad, overlookGroup.position, SUMMIT_LAYOUT.wood);
    woodpileGroup.rotation.y = -0.35;

    // Stack of 6 chopped pine logs
    for (let r = 0; r < 2; r++) {
      for (let l = 0; l < 3; l++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 6), this.matWoodPole);
        log.rotation.x = Math.PI * 0.5;
        log.position.set((l - 1) * 0.26, 0.14 + r * 0.24, 0);
        log.castShadow = true;
        woodpileGroup.add(log);
      }
    }

    // Olive weather-cover tarp draped over rear half of logs
    const tarp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 1.6), this.matJoshuaTuft);
    tarp.position.set(0, 0.56, 0);
    tarp.castShadow = true;
    woodpileGroup.add(tarp);

    campGroup.add(woodpileGroup);

    // =========================================================================
    // 4. METEOROLOGICAL SUMMIT WEATHER STATION & ANEMOMETER
    // =========================================================================
    const weatherStationGroup = new THREE.Group();
    weatherStationGroup.name = 'SummitWeather';
    placeSummitProp(weatherStationGroup, this.splineRoad, overlookGroup.position, SUMMIT_LAYOUT.weather);

    const mastH = 5.2;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, mastH, 8), this.matCastIronDark);
    mast.position.y = mastH * 0.5;
    mast.castShadow = true;
    weatherStationGroup.add(mast);

    // Instrument crossbar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), this.matCastIronDark);
    crossbar.position.y = mastH - 0.2;
    crossbar.rotation.z = Math.PI * 0.5;
    weatherStationGroup.add(crossbar);

    // Rotating 3-Cup Anemometer Rotor (animated in update loop!)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(-0.6, mastH - 0.05, 0);

    const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), this.matCastIronDark);
    rotorGroup.add(rotorHub);

    for (let c = 0; c < 3; c++) {
      const angle = (c / 3) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.02), this.matCastIronDark);
      arm.position.set(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18);
      arm.rotation.y = angle;
      rotorGroup.add(arm);

      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6, 0, Math.PI), this.matTrailSignYellow);
      cup.position.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35);
      cup.rotation.y = angle + Math.PI * 0.5;
      rotorGroup.add(cup);
    }

    weatherStationGroup.add(rotorGroup);
    this.anemometerRotor = rotorGroup; // Linked to render update loop!

    // Wind Direction Vane
    const vaneGroup = new THREE.Group();
    vaneGroup.position.set(0.6, mastH - 0.05, 0);
    const vaneFin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.02), this.matTrailReflectorOrange);
    vaneFin.position.set(-0.15, 0.08, 0);
    vaneGroup.add(vaneFin);
    const vaneArrow = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), this.matTrailReflectorOrange);
    vaneArrow.position.set(0.22, 0.08, 0);
    vaneArrow.rotation.z = -Math.PI * 0.5;
    vaneGroup.add(vaneArrow);
    weatherStationGroup.add(vaneGroup);

    campGroup.add(weatherStationGroup);

    overlookGroup.add(campGroup);
  }

  /**
   * 🌆 Build the Surprise Populated Coastal Metropolis (Santa Monica / Malibu)
   * Positioned beyond the mountain saddle pass (X: +400m to +750m, Z: 950m to 1250m)
   */
  buildSurpriseCityVista(summitPos) {
    const cityGroup = new THREE.Group();
    cityGroup.name = 'SurprisePacificCityVista';

    const cityBaseX = 480;
    const cityBaseY = 12.0;
    const cityBaseZ = 1100;

    // 1. Shimmering Pacific Ocean Bay Horizon
    const oceanGeo = new THREE.PlaneGeometry(900, 1200);
    const ocean = new THREE.Mesh(oceanGeo, this.matPacificDeepBlue);
    ocean.rotation.x = -Math.PI * 0.5;
    ocean.position.set(800, cityBaseY - 0.4, cityBaseZ);
    cityGroup.add(ocean);

    // Ocean container cargo freighters on the horizon
    [-180, 160].forEach((dz, sIdx) => {
      const ship = new THREE.Group();
      ship.position.set(740 + sIdx * 80, cityBaseY + 0.5, cityBaseZ + dz);
      const hull = new THREE.Mesh(new THREE.BoxGeometry(54, 7.0, 11.0), this.matCastIronDark);
      hull.position.y = 3.5;
      ship.add(hull);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(15, 11.0, 9.0), this.matPierWhite);
      bridge.position.set(14, 11.0, 0);
      ship.add(bridge);
      const containers = new THREE.Mesh(new THREE.BoxGeometry(26, 7.0, 8.5), this.matStoreAwningRed);
      containers.position.set(-9, 8.5, 0);
      ship.add(containers);
      cityGroup.add(ship);
    });

    // White sailboats drifting in the bay
    [-90, 35, 210].forEach((dz, bIdx) => {
      const boat = new THREE.Group();
      boat.position.set(620 + bIdx * 45, cityBaseY, cityBaseZ + dz);
      const hull = new THREE.Mesh(new THREE.BoxGeometry(10.0, 1.6, 3.2), this.matPierWhite);
      hull.position.y = 0.8;
      boat.add(hull);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 10.0, 5), this.matWoodPole);
      mast.position.y = 5.2;
      boat.add(mast);
      const sail = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8.5, 3), this.matPierWhite);
      sail.position.set(-0.9, 5.4, 0);
      sail.rotation.z = 0.15;
      boat.add(sail);
      cityGroup.add(boat);
    });

    // 2. Santa Monica Pier & Pacific Park
    const pierGroup = new THREE.Group();
    pierGroup.position.set(620, cityBaseY, cityBaseZ + 65);

    // Historic timber pier structure
    const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(110, 2.2, 26), this.matWoodSignBrown);
    pierDeck.position.set(35, 1.1, 0);
    pierDeck.castShadow = true;
    pierGroup.add(pierDeck);

    // Pier archway (facing west towards summit)
    const pierArch = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10.0, 24), this.matNeonTeal);
    pierArch.position.set(-16, 6.0, 0);
    pierGroup.add(pierArch);
    const archSign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 20), this.matNeonRalphs);
    archSign.position.set(-16, 9.8, 0);
    pierGroup.add(archSign);

    // Red Coaster Trestle Framework
    const coaster = new THREE.Group();
    coaster.position.set(55, 2.2, 5);
    const trestle = new THREE.Mesh(new THREE.BoxGeometry(60, 15, 12), this.matPierWhite);
    trestle.position.set(0, 7.5, 0);
    coaster.add(trestle);
    const rails = new THREE.Mesh(new THREE.BoxGeometry(64, 2.0, 13), this.matPierRed);
    rails.position.set(0, 15.5, 0);
    coaster.add(rails);
    pierGroup.add(coaster);

    // 🎡 Rotating Pacific Ferris Wheel (Diameter: 32m, 16 Gondolas)
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(22, 18.5, -4);

    const aLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 18, 6), this.matPierWhite);
    aLeft.rotation.z = 0.28;
    aLeft.position.set(-3.5, -9.0, 0);
    wheelGroup.add(aLeft);
    const aRight = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 18, 6), this.matPierWhite);
    aRight.rotation.z = -0.28;
    aRight.position.set(3.5, -9.0, 0);
    wheelGroup.add(aRight);

    const wheelRotor = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.2, 12), this.matNeonYellow);
    hub.rotation.x = Math.PI * 0.5;
    wheelRotor.add(hub);

    const rimOut = new THREE.Mesh(new THREE.TorusGeometry(14, 0.35, 8, 24), this.matNeonTeal);
    wheelRotor.add(rimOut);
    const rimIn = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.25, 8, 24), this.matPierRed);
    wheelRotor.add(rimIn);

    const gondolaColors = [this.matStoreAwningRed, this.matNeonYellow, this.matStoreAwningBlue, this.matNeonTeal];
    for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 14, 4), this.matPierWhite);
      spoke.position.set(Math.cos(ang) * 7.0, Math.sin(ang) * 7.0, 0);
      spoke.rotation.z = ang + Math.PI * 0.5;
      wheelRotor.add(spoke);

      const gondola = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.6), gondolaColors[k % 4]);
      gondola.position.set(Math.cos(ang) * 14.0, Math.sin(ang) * 14.0, 0);
      wheelRotor.add(gondola);
    }
    wheelGroup.add(wheelRotor);
    this.animatedObjects.push({ obj: wheelRotor, rotZ: 0.012 });
    pierGroup.add(wheelGroup);

    cityGroup.add(pierGroup);

    // 3. Sprawling Commercial Retail Streetscape & Branded Storefronts
    // Facing West (-X) toward the mountain summit overlook
    const stores = [
      {
        name: 'Ralphs',
        x: 430, z: cityBaseZ - 65, w: 42, h: 14, d: 24,
        wallMat: this.matDinerWhite,
        signMat: this.matNeonRalphs, signH: 2.8, signW: 24,
        awningMat: this.matStoreAwningRed
      },
      {
        name: 'CrossCreek',
        x: 430, z: cityBaseZ - 18, w: 38, h: 12, d: 22,
        wallMat: this.matOutletStucco,
        signMat: this.matNeonYellow, signH: 2.2, signW: 28,
        awningMat: this.matStoreAwningTeal
      },
      {
        name: 'MalibuSurf',
        x: 430, z: cityBaseZ + 30, w: 32, h: 11, d: 20,
        wallMat: this.matOutletStucco,
        signMat: this.matNeonTeal, signH: 2.2, signW: 22,
        awningMat: this.matStoreAwningBlue
      },
      {
        name: 'PacificDiner',
        x: 430, z: cityBaseZ + 75, w: 28, h: 10, d: 18,
        wallMat: this.matChrome,
        signMat: this.matNeonRed, signH: 2.0, signW: 20,
        awningMat: this.matStoreAwningRed
      },
      {
        name: 'Pharmacy',
        x: 475, z: cityBaseZ - 50, w: 30, h: 16, d: 20,
        wallMat: this.matOutletStucco,
        signMat: this.matNeonTeal, signH: 2.0, signW: 20,
        awningMat: this.matStoreAwningTeal
      },
      {
        name: 'BeachMotel',
        x: 475, z: cityBaseZ - 8, w: 46, h: 18, d: 22,
        wallMat: this.matDinerWhite,
        signMat: this.matNeonYellow, signH: 2.4, signW: 26,
        awningMat: this.matStoreAwningBlue
      },
      {
        name: 'CommercialTower',
        x: 475, z: cityBaseZ + 42, w: 36, h: 28, d: 24,
        wallMat: this.matOutletStucco,
        signMat: this.matSignGoldText, signH: 2.6, signW: 24,
        awningMat: this.matStoreAwningTeal
      },
      {
        name: 'Bakery',
        x: 475, z: cityBaseZ + 84, w: 26, h: 11, d: 18,
        wallMat: this.matWoodSignBrown,
        signMat: this.matNeonYellow, signH: 2.0, signW: 18,
        awningMat: this.matStoreAwningRed
      }
    ];

    stores.forEach(s => {
      const bGroup = new THREE.Group();
      bGroup.position.set(s.x, cityBaseY, s.z);

      // Building main body
      const body = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), s.wallMat);
      body.position.y = s.h * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);

      // Ground floor glass retail display storefront facing west (-X) towards summit
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.8, s.d * 0.88), this.matCityWindowGlow);
      glass.position.set(-s.w * 0.5 - 0.15, 2.2, 0);
      bGroup.add(glass);

      // Striped retail canvas awning over sidewalk facing west
      const awning = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, s.d * 0.92), s.awningMat);
      awning.position.set(-s.w * 0.5 - 1.2, 4.3, 0);
      awning.rotation.z = 0.2;
      bGroup.add(awning);

      // Illuminated Store Signboard facing west
      const signBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, s.signH, s.signW), this.matCastIronDark);
      signBack.position.set(-s.w * 0.5 - 0.3, s.h * 0.82, 0);
      bGroup.add(signBack);

      const signGlow = new THREE.Mesh(new THREE.BoxGeometry(0.6, s.signH * 0.75, s.signW * 0.92), s.signMat);
      signGlow.position.set(-s.w * 0.5 - 0.35, s.h * 0.82, 0);
      bGroup.add(signGlow);

      // Rooftop AC chiller units
      const ac = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.2, 3.5), this.matTinRoof);
      ac.position.set(0, s.h + 1.1, s.d * 0.25);
      bGroup.add(ac);

      cityGroup.add(bGroup);
    });

    // 4. Secondary Commercial High-Rises & Hotel Skyline (10 additional blocks)
    for (let h = 0; h < 10; h++) {
      const hx = 515 + (h % 3) * 28;
      const hz = cityBaseZ - 110 + h * 24;
      const height = 18 + ((h * 7) % 5) * 4;
      const width = 22 + ((h * 3) % 4) * 4;
      const depth = 20;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.matOutletStucco);
      tower.position.set(hx, cityBaseY + height * 0.5, hz);
      tower.castShadow = true;
      cityGroup.add(tower);

      // Illuminated window bands
      const win = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, height * 0.75, depth * 0.85), this.matCityWindowGlow);
      win.position.set(hx, cityBaseY + height * 0.5, hz);
      cityGroup.add(win);
    }

    // 5. Coastal Highway 1 Boulevard & Moving Traffic Streams
    const roadAsphalt = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 420), this.matAsphaltLot);
    roadAsphalt.position.set(410, cityBaseY + 0.1, cityBaseZ);
    cityGroup.add(roadAsphalt);

    // Double yellow center lines
    const yLines = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 400), this.matTrailSignYellow);
    yLines.position.set(410, cityBaseY + 0.12, cityBaseZ);
    cityGroup.add(yLines);

    // Rows of California Fan Palms along Boulevard Sidewalks
    for (let pz = -190; pz <= 190; pz += 28) {
      [-1, 1].forEach(side => {
        const palmGroup = new THREE.Group();
        palmGroup.position.set(410 + side * 10.5, cityBaseY, cityBaseZ + pz);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 12, 6), this.matJoshuaTrunk);
        trunk.position.y = 6.0;
        palmGroup.add(trunk);

        const tuft = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), this.matDesertPalmFrond);
        tuft.position.y = 12.0;
        tuft.scale.set(1.4, 0.8, 1.4);
        palmGroup.add(tuft);

        cityGroup.add(palmGroup);

        // Streetlamp with warm illuminated light bulb
        if (pz % 56 === 0) {
          const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 8.5, 6), this.matCastIronDark);
          lamp.position.set(410 + side * 9.2, cityBaseY + 4.25, cityBaseZ + pz);
          cityGroup.add(lamp);

          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), this.matCityWindowGlow);
          bulb.position.set(410 + side * 9.2, cityBaseY + 8.8, cityBaseZ + pz);
          cityGroup.add(bulb);
        }
      });
    }

    // 6. Animated Cruising Vehicle Headlights / Taillights on Coastal Boulevard
    const trafficCars = new THREE.Group();
    const carPairs = [];
    for (let c = 0; c < 8; c++) {
      const isNorthbound = (c % 2 === 0);
      const laneX = isNorthbound ? 407 : 413;
      const initialZ = cityBaseZ - 180 + c * 45;

      const car = new THREE.Group();
      car.position.set(laneX, cityBaseY + 0.8, initialZ);

      // Vehicle body silhouette
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 4.4), this.matCastIronDark);
      car.add(carBody);

      if (isNorthbound) {
        // Glowing white headlights
        const lights = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.3), this.matDinerWhite);
        lights.position.set(0, 0, 2.2);
        car.add(lights);
      } else {
        // Glowing red taillights
        const lights = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.3), this.matNeonRed);
        lights.position.set(0, 0, -2.2);
        car.add(lights);
      }

      trafficCars.add(car);
      carPairs.push({ obj: car, speedZ: isNorthbound ? 22 : -20, minZ: cityBaseZ - 200, maxZ: cityBaseZ + 200 });
    }
    cityGroup.add(trafficCars);

    // Update traffic positions in animation loop
    this.animatedObjects.push({
      update: (dt) => {
        if (!cityGroup.visible) return;
        carPairs.forEach(cp => {
          cp.obj.position.z += cp.speedZ * dt;
          if (cp.speedZ > 0 && cp.obj.position.z > cp.maxZ) {
            cp.obj.position.z = cp.minZ;
          } else if (cp.speedZ < 0 && cp.obj.position.z < cp.minZ) {
            cp.obj.position.z = cp.maxZ;
          }
        });
      }
    });

    // 7. Radio Communications Tower with blinking red beacon
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 1.6, 42, 4), this.matPierWhite);
    tower.position.set(530, cityBaseY + 21, cityBaseZ - 80);
    cityGroup.add(tower);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 6), this.matNeonRed);
    beacon.position.set(530, cityBaseY + 42, cityBaseZ - 80);
    cityGroup.add(beacon);

    return cityGroup;
  }

  // ── Zone 0 Enhanced Scenery Builders ─────────────────────────────

  // 1. Procedural Dust Devils / Tornadoes (Removed per user request)
  buildDustDevils() {
    this.dustDevils = [];
  }

  // 3. Thermal Updraft Circling Vultures (Raptor Silhouettes over Sandstone Mesas)
  buildCirclingVultures() {
    const mesaFlocks = [
      { z: 480, lat: -125, altitude: 82, count: 4 },
      { z: 980, lat: 135, altitude: 92, count: 5 }
    ];

    mesaFlocks.forEach((flock, fIdx) => {
      const trans = this.splineRoad.getRoadTransformAtZ(flock.z, flock.lat, 0, false);
      if (!trans) return;

      const centerX = trans.pos.x;
      const centerZ = trans.pos.z;

      for (let i = 0; i < flock.count; i++) {
        const vultureGroup = new THREE.Group();
        vultureGroup.name = `Vulture_${fIdx}_${i}`;

        // Low-poly raptor body & tapered beak
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 6), this.matVulture);
        body.rotation.x = Math.PI * 0.5;
        vultureGroup.add(body);

        // Broad Dihedral Wings
        const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.55), this.matVulture);
        wingL.position.set(-0.75, 0.06, -0.1);
        wingL.rotation.x = -Math.PI * 0.5;
        wingL.rotation.y = 0.12;
        vultureGroup.add(wingL);

        const wingR = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.55), this.matVulture);
        wingR.position.set(0.75, 0.06, -0.1);
        wingR.rotation.x = -Math.PI * 0.5;
        wingR.rotation.y = -0.12;
        vultureGroup.add(wingR);

        // Fan tail
        const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), this.matVulture);
        tail.position.set(0, 0.04, -0.9);
        tail.rotation.x = -Math.PI * 0.5;
        vultureGroup.add(tail);

        this.group.add(vultureGroup);

        this.circlingVultures.push({
          group: vultureGroup,
          centerX: centerX,
          centerZ: centerZ,
          altitude: flock.altitude + (i * 4.2 - 8.0),
          radius: 28.0 + i * 8.5,
          angle: (i * Math.PI * 2) / flock.count + fIdx * 1.5,
          speed: 0.45 + (i % 2) * 0.12,
          phase: i * 1.7
        });
      }
    });
  }

  // 4. Parallel Transcontinental Railroad & Staged Freight Train (Z = 500m to 1950m)
  buildDesertRailroad() {
    const railGroup = new THREE.Group();
    railGroup.name = 'Scenic_DesertTranscontinentalRailroad';

    const startZ = 480;
    const endZ = 1960;
    const trackLat = 46.0; // Parallel on the right shoulder

    const _railDummy = new THREE.Object3D();

    // A. Gravel Ballast Embankment Bed (InstancedMesh)
    const ballastMatrices = [];
    for (let z = startZ; z <= endZ; z += 60) {
      const trans = this.splineRoad.getRoadTransformAtZ(z, trackLat, 0, false);
      if (!trans) continue;
      _railDummy.position.set(trans.pos.x, trans.pos.y + 0.15, trans.pos.z);
      _railDummy.rotation.set(0, trans.heading, 0);
      _railDummy.scale.set(1, 1, 1);
      _railDummy.updateMatrix();
      ballastMatrices.push(_railDummy.matrix.clone());
    }
    if (ballastMatrices.length > 0) {
      const ballastGeo = new THREE.BoxGeometry(5.8, 0.42, 60.5);
      const instBallast = new THREE.InstancedMesh(ballastGeo, this.matBallastGravel, ballastMatrices.length);
      instBallast.name = 'Instanced_DesertBallast';
      for (let i = 0; i < ballastMatrices.length; i++) instBallast.setMatrixAt(i, ballastMatrices[i]);
      instBallast.instanceMatrix.needsUpdate = true;
      instBallast.castShadow = false;
      instBallast.receiveShadow = true;
      railGroup.add(instBallast);
    }

    // B. Weathered Creosote Ties (InstancedMesh - collapses 616 draw calls to 1)
    const tieMatrices = [];
    for (let z = startZ; z <= endZ; z += 3.2) {
      const trans = this.splineRoad.getRoadTransformAtZ(z, trackLat, 0, false);
      if (!trans) continue;
      _railDummy.position.set(trans.pos.x, trans.pos.y + 0.38, trans.pos.z);
      _railDummy.rotation.set(0, trans.heading, 0);
      _railDummy.scale.set(1, 1, 1);
      _railDummy.updateMatrix();
      tieMatrices.push(_railDummy.matrix.clone());
    }
    if (tieMatrices.length > 0) {
      const tieGeo = new THREE.BoxGeometry(2.6, 0.18, 0.24);
      const instTies = new THREE.InstancedMesh(tieGeo, this.matRailTie, tieMatrices.length);
      instTies.name = 'Instanced_DesertRailTies';
      for (let i = 0; i < tieMatrices.length; i++) instTies.setMatrixAt(i, tieMatrices[i]);
      instTies.instanceMatrix.needsUpdate = true;
      instTies.castShadow = false;
      instTies.receiveShadow = true;
      railGroup.add(instTies);
    }

    // C. Dual Parallel Continuous Steel Rails (InstancedMesh)
    const railMatrices = [];
    [-0.72, 0.72].forEach(gaugeOffset => {
      for (let z = startZ; z <= endZ; z += 80) {
        const trans = this.splineRoad.getRoadTransformAtZ(z, trackLat + gaugeOffset, 0, false);
        if (!trans) continue;
        _railDummy.position.set(trans.pos.x, trans.pos.y + 0.52, trans.pos.z);
        _railDummy.rotation.set(0, trans.heading, 0);
        _railDummy.scale.set(1, 1, 1);
        _railDummy.updateMatrix();
        railMatrices.push(_railDummy.matrix.clone());
      }
    });
    if (railMatrices.length > 0) {
      const railGeo = new THREE.BoxGeometry(0.12, 0.16, 80.5);
      const instRails = new THREE.InstancedMesh(railGeo, this.matSteelRail, railMatrices.length);
      instRails.name = 'Instanced_DesertRails';
      for (let i = 0; i < railMatrices.length; i++) instRails.setMatrixAt(i, railMatrices[i]);
      instRails.instanceMatrix.needsUpdate = true;
      instRails.castShadow = false;
      instRails.receiveShadow = true;
      railGroup.add(instRails);
    }

    // D. Staged Santa Fe / Union Pacific Freight Train (Parked on Siding at Z = 1040m to 1200m)
    // 1. EMD SD40-2 Diesel-Electric Locomotive at Z = 1200m
    const locoTrans = this.splineRoad.getRoadTransformAtZ(1200, trackLat, 0, false);
    if (locoTrans) {
      const locoGroup = new THREE.Group();
      locoGroup.name = 'Freight_SD40_Locomotive';
      locoGroup.position.set(locoTrans.pos.x, locoTrans.pos.y + 0.58, locoTrans.pos.z);
      locoGroup.rotation.y = locoTrans.heading;

      // Chassis frame
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.55, 20.0), this.matTankerBlack);
      chassis.position.set(0, 0.5, 0);
      locoGroup.add(chassis);

      // Yellow Long Hood Body
      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.9, 13.5), this.matLocomotiveYellow);
      hood.position.set(0, 2.2, -2.5);
      locoGroup.add(hood);

      // Elevated Crew Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.2, 3.8), this.matLocomotiveYellow);
      cab.position.set(0, 2.4, 5.5);
      locoGroup.add(cab);

      // Tinted Cab Windshields
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 0.1), this.matDinerGlass);
      windshield.position.set(0, 3.1, 7.42);
      locoGroup.add(windshield);

      // Front Short Hood Nose
      const nose = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.3, 2.4), this.matLocomotiveYellow);
      nose.position.set(0, 1.9, 8.4);
      locoGroup.add(nose);

      // Front Pilot Snowplow with Hazard Stripes
      const plow = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.2, 0.35), this.matDinerRed);
      plow.position.set(0, 0.7, 9.8);
      locoGroup.add(plow);

      // Locomotive Dual Headlight Lens
      const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), this.matCityWindowGlow);
      headlight.rotation.x = Math.PI * 0.5;
      headlight.position.set(0, 2.4, 9.65);
      locoGroup.add(headlight);

      // Dual Roof Train Horns
      [-0.4, 0.4].forEach(hx => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 8), this.matChrome);
        horn.rotation.x = -Math.PI * 0.5;
        horn.position.set(hx, 4.2, 6.2);
        locoGroup.add(horn);
      });

      railGroup.add(locoGroup);
    }

    // 2. Freight Consist: Boxcars, Grain Hoppers, Tankers
    const consist = [
      { z: 1176, type: 'boxcar', color: this.matBoxcarRust, label: 'SANTA FE' },
      { z: 1156, type: 'boxcar', color: this.matMesaRed, label: 'ROUTE 66' },
      { z: 1137, type: 'hopper', color: this.matHopperGray },
      { z: 1119, type: 'hopper', color: this.matHopperGray },
      { z: 1102, type: 'tanker', color: this.matTankerBlack },
      { z: 1085, type: 'tanker', color: this.matTankerBlack }
    ];

    consist.forEach(car => {
      const carTrans = this.splineRoad.getRoadTransformAtZ(car.z, trackLat, 0, false);
      if (!carTrans) return;

      const carGroup = new THREE.Group();
      carGroup.position.set(carTrans.pos.x, carTrans.pos.y + 0.58, carTrans.pos.z);
      carGroup.rotation.y = carTrans.heading;

      if (car.type === 'boxcar') {
        const box = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.4, 16.5), car.color);
        box.position.set(0, 2.3, 0);
        carGroup.add(box);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.25, 16.8), this.matTinRoof);
        roof.position.set(0, 4.05, 0);
        carGroup.add(roof);
      } else if (car.type === 'hopper') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 15.5, 12), car.color);
        body.rotation.x = Math.PI * 0.5;
        body.position.set(0, 2.4, 0);
        carGroup.add(body);
      } else if (car.type === 'tanker') {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 15.0, 14), car.color);
        tank.rotation.x = Math.PI * 0.5;
        tank.position.set(0, 2.2, 0);
        carGroup.add(tank);

        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), car.color);
        dome.position.set(0, 3.65, 0);
        carGroup.add(dome);
      }

      railGroup.add(carGroup);
    });

    this.group.add(railGroup);
  }

  // 5. Authentic 1950s Burma-Shave Sequential Roadside Rhyme Signs (Z = 210m to 370m on dedicated open stretch)
  buildBurmaShaveSigns() {
    const signs = [
      { z: 210, text: 'DROVE TOO FAST' },
      { z: 250, text: 'BROKE THE WHEEL' },
      { z: 290, text: 'NOW HE WALKS' },
      { z: 330, text: 'WITH LESS APPEAL' },
      { z: 370, text: 'BURMA-SHAVE' }
    ];

    signs.forEach((s, idx) => {
      const trans = this.splineRoad.getRoadTransformAtZ(s.z, 12.8, 0, false);
      if (!trans) return;

      const signGroup = new THREE.Group();
      signGroup.name = `RoadSign_BurmaShave_${idx}`;
      signGroup.position.set(trans.pos.x, trans.pos.y, trans.pos.z);
      // Face oncoming traffic: rotate 180° (Math.PI) and cant ~36° inward toward the road lanes for direct sightline
      signGroup.rotation.y = trans.heading + Math.PI - 0.62;

      // 1. Two weathered wooden mounting posts strictly BEHIND the board (z = -0.06)
      [-1.1, 1.1].forEach(px => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.4, 0.14), this.matWoodPole);
        post.position.set(px, 1.2, -0.06);
        post.castShadow = true;
        signGroup.add(post);
      });

      // 2. High-DPI Red Board Canvas Texture (1024x256)
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = '#b91c1c'; // Deep Americana Crimson Red
      ctx.fillRect(0, 0, 1024, 256);

      // Reflective White Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 14;
      ctx.strokeRect(14, 14, 996, 228);

      // Sign Text - Open Sans-serif, High-Glance Legibility
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillText(s.text, 512, 128);

      const signTex = new THREE.CanvasTexture(canvas);
      signTex.colorSpace = THREE.SRGBColorSpace;
      signTex.generateMipmaps = true;
      signTex.minFilter = THREE.LinearMipmapLinearFilter;
      signTex.magFilter = THREE.LinearFilter;
      signTex.anisotropy = 8;
      signTex.needsUpdate = true;

      const signMat = new THREE.MeshBasicMaterial({ map: signTex });

      // Wooden Signboard Plaque (Elevated to eye level 1.9m, posts behind board)
      const boardGeo = new THREE.BoxGeometry(3.2, 0.82, 0.08);
      const boardMaterials = [
        this.matWoodPole, // +X
        this.matWoodPole, // -X
        this.matWoodPole, // +Y
        this.matWoodPole, // -Y
        signMat,          // +Z (Front face facing oncoming traffic!)
        this.matWoodPole  // -Z (Back face - weathered timber!)
      ];
      const board = new THREE.Mesh(boardGeo, boardMaterials);
      board.position.set(0, 1.9, 0.04);
      board.castShadow = true;
      signGroup.add(board);

      this.group.add(signGroup);
    });
  }

  // 6. 5 Interactive Golden Route 66 Shield Collectibles
  buildRoute66Collectibles() {
    const shieldLocations = [
      { id: 'shield_bottle_tree', z: 600, lat: -38, yOffset: 2.2, name: "Elmer's Bottle Tree Grove" },
      { id: 'shield_natural_arch', z: 3850, lat: 0.0, yOffset: 5.6, name: 'Sandstone Natural Highway Arch' },
      { id: 'shield_cabazon_dino', z: 4500, lat: -75, yOffset: 2.4, name: 'Dinny the Dinosaur Sanctuary' },
      { id: 'shield_arroyo_jump', z: 4900, lat: -28, yOffset: 3.6, name: 'Mojave Arroyo Stunt Wash' },
      { id: 'shield_coyote_summit', z: 2890, lat: -310, yOffset: 44.6, name: 'Coyote Ridge Summit Overlook' }
    ];

    shieldLocations.forEach((loc, idx) => {
      const trans = this.splineRoad.getRoadTransformAtZ(loc.z, loc.lat, 0, false);
      if (!trans) return;

      const shieldGroup = new THREE.Group();
      shieldGroup.name = `Route66Shield_${idx}`;
      const posX = trans.pos.x;
      const posY = trans.pos.y + loc.yOffset;
      const posZ = trans.pos.z;
      shieldGroup.position.set(posX, posY, posZ);

      // A. Golden Highway Shield Shape
      const shape = new THREE.Shape();
      shape.moveTo(-0.7, 0.85);
      shape.lineTo(0.7, 0.85);
      shape.lineTo(0.7, 0.1);
      shape.quadraticCurveTo(0.65, -0.6, 0.0, -0.95);
      shape.quadraticCurveTo(-0.65, -0.6, -0.7, 0.1);
      shape.closePath();

      const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.06, bevelThickness: 0.06 };
      const shieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const shieldMesh = new THREE.Mesh(shieldGeo, this.matGoldShield);
      shieldGroup.add(shieldMesh);

      // B. Embossed Inner Emblem Badge
      const innerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.26, 16), this.matGoldShieldTrim);
      innerMesh.rotation.x = Math.PI * 0.5;
      innerMesh.position.set(0, 0.15, 0.05);
      shieldGroup.add(innerMesh);

      // C. Outer Pulsating Halos
      const haloGeo = new THREE.RingGeometry(0.95, 1.35, 24);
      const halo = new THREE.Mesh(haloGeo, this.matShieldHalo);
      halo.position.set(0, 0, 0.12);
      shieldGroup.add(halo);

      this.group.add(shieldGroup);

      this.route66Shields.push({
        id: loc.id,
        name: loc.name,
        group: shieldGroup,
        halo: halo,
        pos: new THREE.Vector3(posX, posY, posZ),
        baseY: posY,
        collected: false,
        spinSpeed: 2.2 + (idx % 2) * 0.4,
        phase: idx * 1.3
      });
    });
  }

  // 7. Arroyo Wash Stunt Jump (Z = 1730m to 1780m)
  buildArroyoStuntJump() {
    const trans = this.splineRoad.getRoadTransformAtZ(1750, -28, 0, false);
    if (!trans) return;

    const arroyoGroup = new THREE.Group();
    arroyoGroup.name = 'Scenic_ArroyoStuntJump';
    arroyoGroup.position.set(trans.pos.x, trans.pos.y, trans.pos.z);
    arroyoGroup.rotation.y = trans.heading;

    // A. Wedge-Shaped Sandstone Launch Ramp (Tilted at 17 degrees)
    const rampGeo = new THREE.BoxGeometry(6.5, 1.8, 11.0);
    const ramp = new THREE.Mesh(rampGeo, this.matMesaRed);
    ramp.position.set(0, 0.65, -12.0);
    ramp.rotation.x = -0.30; // ~17 degree upslope launch
    arroyoGroup.add(ramp);

    // B. Desert Gully Wash Void (Depression)
    const washGeo = new THREE.PlaneGeometry(16.0, 18.0);
    washGeo.rotateX(-Math.PI * 0.5);
    const wash = new THREE.Mesh(washGeo, this.matDesertGravel);
    wash.position.set(0, -1.85, 0);
    arroyoGroup.add(wash);

    // C. Abandoned Rusted 1960s Station Wagon down in the wash
    const wreck = new THREE.Group();
    wreck.position.set(0, -1.2, 0);
    wreck.rotation.y = 0.45;
    wreck.rotation.z = 0.18; // Tilted into sand

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 4.6), this.matRustWreck);
    wreck.add(chassis);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 2.6), this.matRustWreck);
    cab.position.set(0, 0.9, -0.4);
    wreck.add(cab);
    arroyoGroup.add(wreck);

    // D. Landing Sand Dune Apron
    const landingGeo = new THREE.BoxGeometry(7.2, 1.2, 12.0);
    const landing = new THREE.Mesh(landingGeo, this.matMesaTalus);
    landing.position.set(0, -0.2, 12.0);
    landing.rotation.x = 0.15; // Downward sloping landing cushion
    arroyoGroup.add(landing);

    this.group.add(arroyoGroup);
  }

  update(dt, playerPosition) {
    // 1. Animated Waterfall Flow (Downward cascading UVs & normal map motion)
    if (this.waterfallCascadeTex) {
      this.waterfallCascadeTex.offset.y += dt * 1.15;
      if (this.waterfallCascadeTex.offset.y > 100) this.waterfallCascadeTex.offset.y -= 100;
    }
    if (this.waterfallCascadeNorm) {
      this.waterfallCascadeNorm.offset.y += dt * 1.15;
      if (this.waterfallCascadeNorm.offset.y > 100) this.waterfallCascadeNorm.offset.y -= 100;
    }

    // 1B. Animated Mountain Stream Current & Rapids Flow
    // Shared sin value: compute once, reuse for both tex and norm to avoid 4 Date.now() calls.
    const _streamSin = Math.sin(Date.now() * 0.0004) * 0.05;
    if (this.streamWaterTex) {
      this.streamWaterTex.offset.y -= dt * 0.65;
      this.streamWaterTex.offset.x = _streamSin;
      if (this.streamWaterTex.offset.y < -100) this.streamWaterTex.offset.y += 100;
    }
    if (this.streamWaterNorm) {
      this.streamWaterNorm.offset.y -= dt * 0.65;
      this.streamWaterNorm.offset.x = _streamSin;
      if (this.streamWaterNorm.offset.y < -100) this.streamWaterNorm.offset.y += 100;
    }
    if (this.streamFoamTex) {
      this.streamFoamTex.offset.y -= dt * 0.32;
      if (this.streamFoamTex.offset.y < -100) this.streamFoamTex.offset.y += 100;
    }

    // Compute shared time value once per frame — avoids 6+ repeated Date.now() calls
    const nowSec = Date.now() * 0.001;

    // 2. Animated Plunge Pool Concentric Ripple Pulsing
    if (this.waterfallRippleTex) {
      this.waterfallRippleTex.offset.x = Math.sin(nowSec * 0.5) * 0.01;
      this.waterfallRippleTex.offset.y = Math.cos(nowSec * 0.5) * 0.01;
    }

    // 3. Volumetric Mist Rising, Breathing & Turbulence (Zero Object Allocation)
    if (this.waterfallMistPlanes && this.waterfallMistPlanes.length > 0) {
      this.mistTime = (this.mistTime || 0) + dt;
      const mt = this.mistTime;
      for (let i = 0; i < this.waterfallMistPlanes.length; i++) {
        const item = this.waterfallMistPlanes[i];
        if (item.mesh) {
          const ph = item.phase || 0;
          item.mesh.position.y = item.baseY + Math.sin(mt * 1.6 + ph) * 0.75;
          const s = 1.0 + Math.sin(mt * 1.2 + ph) * 0.12;
          item.mesh.scale.set(s, s, 1.0);
        }
      }
    }

    // 4. Summit Meteorological Station Anemometer Rotation
    if (this.anemometerRotor) {
      this.anemometerRotor.rotation.y += dt * 4.5;
    }

    // 4B. Animated Downhill Express Launch Gate Beacons (Pulsing emerald green when unlocked)
    if (this.downhillLaunchBeacons && this.downhillLaunchBeacons.length > 0) {
      const isUnlocked = Boolean(gameState.downhillUnlocked);
      const targetMat = isUnlocked ? this.matLaunchGateGreen : this.matLaunchGateAmber;
      const pulse = Math.sin(nowSec * 7.0) * 0.5 + 0.5;
      if (isUnlocked) {
        targetMat.emissiveIntensity = 0.6 + pulse * 1.4;
      }
      for (let b = 0; b < this.downhillLaunchBeacons.length; b++) {
        const beacon = this.downhillLaunchBeacons[b];
        if (beacon.material !== targetMat) {
          beacon.material = targetMat;
        }
      }
    }

    this.animatedObjects.forEach(item => {
      if (item.rotZ) item.obj.rotation.z += item.rotZ;
      if (item.rotY) item.obj.rotation.y += item.rotY;
      if (item.update) item.update(dt);
    });

    // Stagger frame counter for secondary particle/wobble updates
    this._dustDevilFrame = (this._dustDevilFrame || 0) + 1;

    // 5. Dynamic Dust Devils Swirling & Wandering
    if (this.dustDevils && this.dustDevils.length > 0) {
      // Ring position (sin/cos) is throttled to every 2nd frame — rings spin fast
      // enough that the wobble displacement update at ~30Hz is imperceptible.
      const doRingPos = (this._dustDevilFrame % 2 === 1);
      this.dustDevils.forEach(dd => {
        // Slow wandering across the desert floor
        dd.driftAngle += (Math.sin(nowSec + dd.timePhase) * 0.15) * dt;
        dd.curX += Math.cos(dd.driftAngle) * dd.driftSpeed * dt;
        dd.curZ += Math.sin(dd.driftAngle) * dd.driftSpeed * dt;

        // Leash to base region
        const distFromBase = Math.hypot(dd.curX - dd.baseX, dd.curZ - dd.baseZ);
        if (distFromBase > 45.0) {
          dd.driftAngle = Math.atan2(dd.baseZ - dd.curZ, dd.baseX - dd.curX);
        }

        const groundY = this.splineRoad.getGroundElevation(dd.curX, dd.curZ);
        dd.group.position.set(dd.curX, groundY, dd.curZ);

        // Rotate individual funnel rings with vortex shear (every frame for smooth spin)
        // Ring position wobble update throttled to every 2nd frame
        for (let r = 0; r < dd.rings.length; r++) {
          const ring = dd.rings[r];
          ring.mesh.rotation.y += dt * (3.5 + r * 0.5) * dd.spinDir;
          if (doRingPos) {
            ring.mesh.position.x = Math.sin(nowSec * 2.8 + r * 0.6 + dd.timePhase) * (0.15 + r * 0.18);
            ring.mesh.position.z = Math.cos(nowSec * 2.4 + r * 0.5 + dd.timePhase) * (0.15 + r * 0.18);
          }
        }
      });
    }

    // 6. Circling Raptor / Vulture Silhouettes
    if (this.circlingVultures && this.circlingVultures.length > 0) {
      this.circlingVultures.forEach(v => {
        v.angle += v.speed * dt;
        const vx = v.centerX + Math.cos(v.angle) * v.radius;
        const vz = v.centerZ + Math.sin(v.angle) * v.radius;
        const vy = v.altitude + Math.sin(v.angle * 1.5 + v.phase) * 2.5;

        v.group.position.set(vx, vy, vz);
        // Heading tangent to circle banked inward
        v.group.rotation.y = -v.angle;
        v.group.rotation.z = 0.22; // Banked flight angle
      });
    }

    // 6B. Dynamic Surprise City Vista Visibility Trigger
    // When cruising the highway, the city is completely hidden behind the mountain.
    // Reveal it only when the player scales the Cougar Ridge trail or reaches the summit overlook.
    const playerPos = playerPosition || ((window.game && window.game.physics) ? window.game.physics.position : null);
    const playerZ = playerPos ? playerPos.z : ((typeof gameState !== 'undefined' && gameState.distanceMeters) ? gameState.distanceMeters : 0);

    if (this.surpriseCityGroup) {
      if (playerPos) {
        const isHighAltitude = playerPos.y > 22.0;
        const isNearSummit = Math.abs(playerPos.z - 1100) < 400 && playerPos.x > 180;
        this.surpriseCityGroup.visible = Boolean(isHighAltitude || isNearSummit);
      } else {
        this.surpriseCityGroup.visible = false;
      }
    }

    // 6C. Cougar Ridge Off-Road Course Distance Culling
    // Keeps the trail geometry, waterways, and summits visible throughout Zone 0 (Mojave Desert),
    // eliminating sudden mid-zone visibility flips and shader/texture compilation freezes at Z=450m & Z=600m
    const nearTrail = (playerZ <= 2200) || (playerPos && playerPos.x < -18);
    if (this.coyoteRidgeTrail) {
      this.coyoteRidgeTrail.visible = nearTrail;
    }
    if (this.downhillExpressRoute) {
      this.downhillExpressRoute.visible = nearTrail;
    }
    if (this.deepTrailGroup) {
      this.deepTrailGroup.visible = nearTrail;
    }

    // 8. Staged Freight Train Diesel Horn Proximity
    if (!this.trainHornTriggered && playerZ >= 1160 && playerZ <= 1240) {
      this.trainHornTriggered = true;
      if (window.game && window.game.sound && window.game.sound.playTrainHorn) {
        window.game.sound.playTrainHorn();
      }
      if (window.game && window.game.hud && window.game.hud.showActionToast) {
        window.game.hud.showActionToast('🚂 PACIFIC FREIGHT DIESEL', 'SANTA FE CORRIDOR • HORN BLASTED', 3000);
      }
    }

    // 9. Golden Route 66 Shields Collectible Tracking & Pickup Chimes
    // nowSec is already computed above — reuse it here (no extra Date.now() needed).
    if (this.route66Shields && this.route66Shields.length > 0) {
      this.route66Shields.forEach(s => {
        if (!s.collected) {
          // Continuous 3D spin and vertical hover
          s.group.rotation.y += s.spinSpeed * dt;
          s.group.position.y = s.baseY + Math.sin(nowSec * 3.0 + s.phase) * 0.28;

          // Pulsating halo
          const haloScale = 1.0 + Math.sin(nowSec * 4.5 + s.phase) * 0.15;
          s.halo.scale.set(haloScale, haloScale, 1.0);

          // Proximity collision detection: Z-axis cheap early-out before 3D distanceTo
          if (playerPos && Math.abs(playerPos.z - s.pos.z) < 20.0) {
            const dist = playerPos.distanceTo(s.pos);
            if (dist < 5.2) {
              s.collected = true;
              s.group.visible = false;

              // Update gameState metrics
              if (typeof gameState !== 'undefined') {
                gameState.route66ShieldsCollected = (gameState.route66ShieldsCollected || 0) + 1;
                gameState.score = (gameState.score || 0) + 500;
              }

              if (window.game && window.game.sound && window.game.sound.playRoute66ShieldCollectChime) {
                window.game.sound.playRoute66ShieldCollectChime();
              }

              if (window.game && window.game.hud && window.game.hud.showActionToast) {
                const count = (typeof gameState !== 'undefined') ? gameState.route66ShieldsCollected : 1;
                window.game.hud.showActionToast(
                  `⭐ ROUTE 66 GOLDEN SHIELD (${count}/5)`,
                  `+500 PTS • ${s.name.toUpperCase()}`,
                  3500
                );
              }
            }
          }
        }
      });
    }

    // 10. Mojave Arroyo Stunt Jump Airtime Trigger
    if (!this.arroyoStuntTriggered && playerPos) {
      const inArroyoX = playerPos.x >= -36.0 && playerPos.x <= -20.0;
      const inArroyoZ = playerPos.z >= 1735.0 && playerPos.z <= 1775.0;
      const isFast = (typeof gameState !== 'undefined' && gameState.speedMph >= 38.0);
      const isAir = (typeof gameState !== 'undefined' && gameState.isAirborne);

      if (inArroyoX && inArroyoZ && isFast && isAir) {
        this.arroyoStuntTriggered = true;
        if (typeof gameState !== 'undefined') {
          gameState.score = (gameState.score || 0) + 1000;
        }
        if (window.game && window.game.sound && window.game.sound.playScenicDiscoveryChime) {
          window.game.sound.playScenicDiscoveryChime();
        }
        if (window.game && window.game.hud && window.game.hud.showActionToast) {
          window.game.hud.showActionToast('🏜️ MOJAVE ARROYO STUNT JUMP!', 'CLEARED THE GULLY • +1,000 AIRTIME BONUS!', 3800);
        }
      }
    }
  }
}

