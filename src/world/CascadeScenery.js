import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';
import { gameState } from '../state.js';

/**
 * 🏔️ CASCADE SCENERY BUILDER (Zone 9: Cascade Alpine Pass & Mount Rainier, 23,400m - 26,000m)
 *
 * Implements the 6-Gate AAA Standard & Hard Scope Budget:
 * 1. Exactly 3 Major Anchor Landmarks:
 *    - Paradise Historic Timber Lodge (1916) at Z = 24,100m, X = +45m
 *    - Narada Falls Basalt Chasm at Z = 24,900m, X = -42m
 *    - Mount Rainier Glacier Summit Overlook at Z = 25,600m, X = +35m to +180m
 * 2. Exactly 2 Scenic Turnouts (integrated with SplineRoad SCENIC_PARKING_LOTS):
 *    - turnout_paradise_lodge (Z = 24,100m, right)
 *    - turnout_narada_falls (Z = 24,900m, left)
 * 3. Exactly 1 Off-Road / Secret Spur:
 *    - Skyline Glacier Trail & Reflection Basin at Z = 24,500m (left side)
 * 4. Exactly 1 Player-Triggered Interactive Cinematic Vignette:
 *    - Glacial Avalanche Snow Shed Thunder at Z = 25,160m - 25,240m
 * 5. Architectural Integrity:
 *    - Subterranean foundation skirts sinking Y <= -1.5m
 *    - Batched via batchChunkStaticMeshes() (<= 3 draw calls per 500m chunk)
 *    - Zero runtime allocations in the 60 FPS update loop
 */
export class CascadeSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.group.name = 'CascadeSceneryGroup';
    this.animatedObjects = [];
    this.structureBuilder = new ProceduralStructureBuilder(renderer);

    // Pre-allocated scratch objects for zero garbage collection
    this._tempVec1 = new THREE.Vector3();
    this._tempVec2 = new THREE.Vector3();
    this._tempCamPos = new THREE.Vector3();
    this._tempLookAt = new THREE.Vector3();
    this._camResult = { pos: this._tempCamPos, lookAt: this._tempLookAt, fov: 54 };

    // Vignette / Cinematic state
    this.isCinematicPlaying = false;
    this.cinematicTime = 0.0;
    this.cinematicDuration = 13.0;
    this.cinematicPhase = 'IDLE';
    this.hasTriggeredVignette = false;

    // Materials
    this.initMaterials();

    // Build World
    this.buildScenery();
  }

  get isActive() {
    return this.isCinematicPlaying;
  }

  initMaterials() {
    const r = this.renderer;
    const woodNorm = r.textures && r.textures.weatheredWoodNormalPBR ? r.textures.weatheredWoodNormalPBR(512) : null;
    const stoneNorm = r.textures && r.textures.stoneMasonryNormalPBR ? r.textures.stoneMasonryNormalPBR(512) : null;
    const concreteNorm = r.textures && r.textures.concreteNormalPBR ? r.textures.concreteNormalPBR(512) : null;
    const pineBarkDiff = r.textures && r.textures.treeBarkPBR ? r.textures.treeBarkPBR('pine', 256) : null;
    const pineBarkNorm = r.textures && r.textures.treeBarkNormalPBR ? r.textures.treeBarkNormalPBR('pine', 256) : null;
    const firFoliageDiff = r.textures && r.textures.treeFoliagePBR ? r.textures.treeFoliagePBR('conifer', 256) : null;
    const firFoliageNorm = r.textures && r.textures.treeFoliageNormalPBR ? r.textures.treeFoliageNormalPBR('conifer', 256) : null;
    const rusticPlankDiff = r.textures && r.textures.rusticPlankPBR ? r.textures.rusticPlankPBR('redwood', 256) : null;
    const rusticPlankNorm = r.textures && r.textures.rusticPlankNormalPBR ? r.textures.rusticPlankNormalPBR('redwood', 256) : null;

    // Timber & Lodge
    this.matLodgeLogs = r.createToonMaterial({
      color: 0x5c3d28,
      gradientBands: 3,
      map: rusticPlankDiff,
      normalMap: rusticPlankNorm
    });
    this.matLodgeShakes = r.createToonMaterial({
      color: 0x2b3336,
      gradientBands: 2,
      normalMap: woodNorm
    });
    this.matGlacialStone = r.createToonMaterial({
      color: 0x475159,
      gradientBands: 3,
      normalMap: stoneNorm
    });
    this.matWindowWarm = new THREE.MeshBasicMaterial({
      color: 0xffd180
    });

    // Waterfall & Basalt Chasm
    this.matColumnarBasalt = r.createToonMaterial({
      color: 0x23272a,
      gradientBands: 3,
      normalMap: stoneNorm
    });
    this.matGlacialWater = new THREE.MeshBasicMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.92
    });
    this.matWaterMist = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.55
    });
    this.matWaterPool = r.createToonMaterial({
      color: 0x0e7490,
      gradientBands: 3
    });

    // Mount Rainier Summit Massif & Glaciers
    this.matGlacialSnow = r.createToonMaterial({
      color: 0xf8fafc,
      gradientBands: 3,
      rimColor: 0xbae6fd,
      rimPower: 2.2
    });
    this.matCragRock = r.createToonMaterial({
      color: 0x334155,
      gradientBands: 3,
      normalMap: stoneNorm
    });
    this.matGlacialIce = r.createToonMaterial({
      color: 0x7dd3fc,
      gradientBands: 2,
      rimColor: 0x38bdf8,
      rimPower: 1.8
    });

    // Brutalist Concrete Snow Shed Gallery
    this.matBrutalistConcrete = r.createToonMaterial({
      color: 0x64748b,
      gradientBands: 3,
      normalMap: concreteNorm
    });
    this.matBeaconAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matBeaconRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matSteelRail = r.createToonMaterial({ color: 0x1e293b, gradientBands: 2 });

    // Flora
    this.matSubalpineTrunk = r.createToonMaterial({
      color: 0x3b2f2f,
      gradientBands: 2,
      map: pineBarkDiff,
      normalMap: pineBarkNorm
    });
    this.matSubalpineFir = r.createToonMaterial({
      color: 0x1e392a,
      gradientBands: 3,
      map: firFoliageDiff,
      normalMap: firFoliageNorm,
      rimColor: 0x4ade80,
      rimPower: 2.5
    });
    this.matAlpineLarch = r.createToonMaterial({
      color: 0xd97706, // Golden alpine larch needle foliage
      gradientBands: 3,
      rimColor: 0xfde047,
      rimPower: 2.0
    });

    // Signage & Props
    this.matParkSignBrown = r.createToonMaterial({ color: 0x3d271d, gradientBands: 2 });
    this.matSignWhite = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.matSignYellow = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.matBronzeMap = r.createToonMaterial({ color: 0xb45309, gradientBands: 2 });
    this.matTrailGravel = r.createToonMaterial({ color: 0x71717a, gradientBands: 2 });
    this.matFinishBanner = r.createToonMaterial({ color: 0x38bdf8, gradientBands: 2 });
  }

  buildScenery() {
    // 1. Major Anchor Landmark 1: Paradise Historic Timber Lodge (1916)
    this.buildParadiseLodge();

    // 2. Major Anchor Landmark 2: Narada Falls Basalt Chasm
    this.buildNaradaFalls();

    // 3. Major Anchor Landmark 3: Mount Rainier Glacier Summit Overlook
    this.buildRainierGlacierSummitOverlook();

    // 4. Off-Road / Secret Spur: Skyline Glacier Trail & Reflection Basin
    this.buildSkylineGlacierTrail();

    // 5. Interactive Cinematic Vignette: Concrete Avalanche Snow Shed Gallery
    this.buildAvalancheSnowShedGallery();

    // 6. Subalpine Forest: Instanced Subalpine Firs & Golden Alpine Larches
    this.buildAlpineFlora();

    // 7. National Park Highway Signage & Markers
    this.buildCascadeHighwaySignage();

    // 8. Cascade Continental Terminus Grand Finish Line Gateway
    this.buildCascadeFinishLine();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. ANCHOR LANDMARK 1: Paradise Historic Timber Lodge (Z = 24,100m, X = +45m)
  // ─────────────────────────────────────────────────────────────────────────
  buildParadiseLodge() {
    const t = this.splineRoad.getRoadTransformAtZ(24100, 46, 0);
    const lodgeGroup = new THREE.Group();
    lodgeGroup.name = 'Scenic_ParadiseLodge';
    lodgeGroup.position.copy(t.pos);
    lodgeGroup.rotation.y = t.heading - Math.PI * 0.52;

    // Subterranean Stone Foundation (Sinking Y <= -2.5m)
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(44.0, 4.0, 24.0),
      this.matGlacialStone
    );
    foundation.position.set(0, -0.5, 0); // Bottom is at Y = -2.5m
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    lodgeGroup.add(foundation);

    // Main 3-Story Great Hall Body (Massive Timber Log Walls)
    const greatHall = new THREE.Mesh(
      new THREE.BoxGeometry(42.0, 11.0, 22.0),
      this.matLodgeLogs
    );
    greatHall.position.set(0, 6.0, 0);
    greatHall.castShadow = true;
    greatHall.receiveShadow = true;
    lodgeGroup.add(greatHall);

    // Steep 60-Degree Gabled Cedar Shake Roof
    const roofPrismGeo = new THREE.ConeGeometry(24.0, 10.5, 4);
    roofPrismGeo.rotateY(Math.PI * 0.25);
    const roofMesh = new THREE.Mesh(roofPrismGeo, this.matLodgeShakes);
    roofMesh.scale.set(1.45, 1.0, 0.75);
    roofMesh.position.set(0, 16.5, 0);
    roofMesh.castShadow = true;
    lodgeGroup.add(roofMesh);

    // Twin Glacial Boulder Hearth Chimneys (Subterranean skirt to Y = -2.5m)
    [-15.0, 15.0].forEach((cx) => {
      const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 23.0, 4.2),
        this.matGlacialStone
      );
      chimney.position.set(cx, 9.0, 0); // Sinks to Y = -2.5m, rises to Y = 20.5m
      chimney.castShadow = true;
      lodgeGroup.add(chimney);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.8, 4.8),
        this.matGlacialStone
      );
      cap.position.set(cx, 20.8, 0);
      lodgeGroup.add(cap);
    });

    // Multi-Tier Dormer Windows with Lit Window Emissives
    [-12.0, -4.0, 4.0, 12.0].forEach((dx) => {
      [-11.2, 11.2].forEach((dz) => {
        const dormer = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, 2.8, 2.4),
          this.matLodgeLogs
        );
        dormer.position.set(dx, 14.2, dz > 0 ? dz - 1.2 : dz + 1.2);
        lodgeGroup.add(dormer);

        const dormerRoof = new THREE.Mesh(
          new THREE.ConeGeometry(2.4, 2.0, 4),
          this.matLodgeShakes
        );
        dormerRoof.rotateY(Math.PI * 0.25);
        dormerRoof.position.set(dx, 16.2, dz > 0 ? dz - 1.2 : dz + 1.2);
        lodgeGroup.add(dormerRoof);

        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(2.2, 1.8),
          this.matWindowWarm
        );
        win.position.set(dx, 14.2, dz > 0 ? dz + 0.05 : dz - 0.05);
        if (dz < 0) win.rotateY(Math.PI);
        lodgeGroup.add(win);
      });
    });

    // Great Hall Clerestory Front Windows (Glowing Amber)
    for (let floor = 0; floor < 3; floor++) {
      const fy = 3.5 + floor * 3.4;
      [-14, -8, -2, 4, 10, 16].forEach((wx) => {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 2.2),
          this.matWindowWarm
        );
        win.position.set(wx, fy, 11.05);
        lodgeGroup.add(win);
      });
    }

    // Heavy Cedar Log Porte-Cochère facing Turnout Road
    const pcRoof = new THREE.Mesh(
      new THREE.BoxGeometry(16.0, 1.2, 12.0),
      this.matLodgeShakes
    );
    pcRoof.position.set(0, 5.5, 17.0);
    lodgeGroup.add(pcRoof);

    // Porte-Cochère Heavy Log Pillars (Subterranean skirt to Y = -2.0m)
    [-7.0, 7.0].forEach((px) => {
      [12.0, 22.0].forEach((pz) => {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.65, 8.0, 8),
          this.matLodgeLogs
        );
        pillar.position.set(px, 2.0, pz); // Sinks to Y = -2.0m
        pillar.castShadow = true;
        lodgeGroup.add(pillar);
      });
    });

    // Historic Bronze Entry Sign
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 1.6, 0.25),
      this.matParkSignBrown
    );
    signBoard.position.set(0, 4.8, 23.2);
    lodgeGroup.add(signBoard);

    const signText = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.5, 0.3),
      this.matSignWhite
    );
    signText.position.set(0, 4.8, 23.2);
    lodgeGroup.add(signText);

    this.group.add(lodgeGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ANCHOR LANDMARK 2: Narada Falls Basalt Chasm (Z = 24,900m, X = -42m)
  // ─────────────────────────────────────────────────────────────────────────
  buildNaradaFalls() {
    const t = this.splineRoad.getRoadTransformAtZ(24900, -42, 0);
    const fallsGroup = new THREE.Group();
    fallsGroup.name = 'Scenic_NaradaFalls';
    fallsGroup.position.copy(t.pos);
    fallsGroup.rotation.y = t.heading + Math.PI * 0.48;

    // Hexagonal Columnar Basalt Cliff Amphitheater (Subterranean foundations Y <= -3.0m)
    const hexCols = [
      { x: -16, z: -8, h: 28, r: 2.2 },
      { x: -12, z: -14, h: 32, r: 2.4 },
      { x: -6, z: -18, h: 36, r: 2.5 },
      { x: 2, z: -20, h: 38, r: 2.6 },
      { x: 10, z: -18, h: 35, r: 2.4 },
      { x: 16, z: -12, h: 30, r: 2.3 },
      { x: 20, z: -6, h: 26, r: 2.1 },
      // Tiered gorge flank columns
      { x: -22, z: 2, h: 22, r: 2.0 },
      { x: 24, z: 4, h: 20, r: 2.0 },
      { x: -24, z: 12, h: 16, r: 1.8 },
      { x: 26, z: 14, h: 15, r: 1.8 }
    ];

    hexCols.forEach((c) => {
      const colGeo = new THREE.CylinderGeometry(c.r, c.r * 1.05, c.h, 6);
      const colMesh = new THREE.Mesh(colGeo, this.matColumnarBasalt);
      colMesh.position.set(c.x, c.h * 0.5 - 4.0, c.z); // Sinks 4m below ground (Y <= -4.0m)
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      fallsGroup.add(colMesh);
    });

    // 176-Foot Plunging Waterfall (Multi-tier sheer drop planes)
    const upperFall = new THREE.Mesh(
      new THREE.PlaneGeometry(12.0, 28.0, 4, 8),
      this.matGlacialWater
    );
    upperFall.position.set(0, 14.0, -17.5);
    upperFall.rotateX(0.08); // Slight forward slant
    fallsGroup.add(upperFall);

    const midCascade = new THREE.Mesh(
      new THREE.PlaneGeometry(14.0, 14.0, 4, 4),
      this.matGlacialWater
    );
    midCascade.position.set(0, 4.0, -13.0);
    midCascade.rotateX(0.22);
    fallsGroup.add(midCascade);

    // Billowy Plunge Pool Spray & Rainbow Mist
    for (let i = 0; i < 6; i++) {
      const mist = new THREE.Mesh(
        new THREE.SphereGeometry(3.5 + i * 0.4, 8, 6),
        this.matWaterMist
      );
      mist.position.set((i % 2 === 0 ? 1 : -1) * (i * 1.5), 1.5 + (i * 0.6), -9.0 + (i * 0.8));
      fallsGroup.add(mist);
    }

    // Turquoise Glacial Plunge Pool Basin (Subterranean skirt Y <= -2.5m)
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(18.0, 19.5, 4.0, 16),
      this.matWaterPool
    );
    pool.position.set(0, -1.0, -5.0); // Sinks to Y = -3.0m
    fallsGroup.add(pool);

    // Historic Timber-and-Stone Overlook Footbridge spanning across gorge
    const bridgeSpan = new THREE.Mesh(
      new THREE.BoxGeometry(28.0, 1.0, 4.2),
      this.matLodgeLogs
    );
    bridgeSpan.position.set(0, 3.5, 8.0);
    bridgeSpan.castShadow = true;
    fallsGroup.add(bridgeSpan);

    // Stone Abutments on both sides (Sinking Y <= -2.0m)
    [-13.0, 13.0].forEach((bx) => {
      const abutment = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 6.5, 5.0),
        this.matGlacialStone
      );
      abutment.position.set(bx, 1.25, 8.0); // Sinks to Y = -2.0m
      abutment.castShadow = true;
      fallsGroup.add(abutment);
    });

    // Cedar Overlook Railings
    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(28.0, 1.2, 0.15),
      this.matLodgeShakes
    );
    railing.position.set(0, 4.6, 6.0);
    fallsGroup.add(railing);

    // Interpretive Geological Kiosk Sign
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 1.4, 0.2),
      this.matParkSignBrown
    );
    sign.position.set(-8.0, 4.5, 9.8);
    fallsGroup.add(sign);

    this.group.add(fallsGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. ANCHOR LANDMARK 3: Mount Rainier Glacier Summit Overlook (Z = 25,600m)
  // ─────────────────────────────────────────────────────────────────────────
  buildRainierGlacierSummitOverlook() {
    const t = this.splineRoad.getRoadTransformAtZ(25600, 38, 0);
    const summitGroup = new THREE.Group();
    summitGroup.name = 'Scenic_RainierSummitOverlook';
    summitGroup.position.copy(t.pos);
    summitGroup.rotation.y = t.heading - Math.PI * 0.5;

    // Colossal 14,411-Foot Glaciated Volcanic Massif (Dominating eastern horizon)
    const peakGroup = new THREE.Group();
    peakGroup.position.set(160.0, 40.0, -80.0);

    // Primary Volcanic Stratovolcano Cone (Width 280m, Height 160m)
    const peakGeo = new THREE.ConeGeometry(140.0, 160.0, 12);
    const peakMesh = new THREE.Mesh(peakGeo, this.matGlacialSnow);
    peakMesh.position.set(0, 80.0, 0);
    peakMesh.castShadow = true;
    peakMesh.receiveShadow = true;
    peakGroup.add(peakMesh);

    // Crater Rim Caldera & Glacial Cirques
    const craterGeo = new THREE.CylinderGeometry(28.0, 38.0, 18.0, 10);
    const craterMesh = new THREE.Mesh(craterGeo, this.matCragRock);
    craterMesh.position.set(0, 152.0, 0);
    peakGroup.add(craterMesh);

    // Nisqually & Paradise Glacier Ridges (Cascading blue glacial ice tongues)
    [-35.0, 0.0, 40.0].forEach((gx, idx) => {
      const glacierGeo = new THREE.BoxGeometry(22.0 + idx * 6.0, 95.0, 34.0);
      glacierGeo.rotateX(0.35);
      const glacierMesh = new THREE.Mesh(glacierGeo, this.matGlacialIce);
      glacierMesh.position.set(gx, 65.0 - idx * 8.0, 25.0 + idx * 12.0);
      peakGroup.add(glacierMesh);
    });

    summitGroup.add(peakGroup);

    // Alpine Summit Observation Terrace along Roadside (Subterranean foundations Y <= -2.0m)
    const terraceBase = new THREE.Mesh(
      new THREE.CylinderGeometry(22.0, 24.0, 4.0, 16),
      this.matGlacialStone
    );
    terraceBase.position.set(0, -1.0, 0); // Sinks to Y = -3.0m
    terraceBase.castShadow = true;
    terraceBase.receiveShadow = true;
    summitGroup.add(terraceBase);

    // Terrace Flagstone Walking Pavement
    const pavement = new THREE.Mesh(
      new THREE.CylinderGeometry(21.5, 21.5, 0.4, 16),
      this.matTrailGravel
    );
    pavement.position.set(0, 1.1, 0);
    summitGroup.add(pavement);

    // Heavy Stone Perimeter Balustrade
    for (let a = 0; a < Math.PI * 1.5; a += 0.35) {
      const bx = Math.sin(a) * 20.5;
      const bz = Math.cos(a) * 20.5;
      const baluster = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.3, 0.6),
        this.matGlacialStone
      );
      baluster.position.set(bx, 1.8, bz);
      baluster.rotation.y = a;
      summitGroup.add(baluster);
    }

    // Panoramic Bronze Relief Topographic Map Table
    const mapPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.1, 1.1, 8),
      this.matGlacialStone
    );
    mapPedestal.position.set(0, 1.6, 4.0);
    summitGroup.add(mapPedestal);

    const mapPlaque = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.25, 12),
      this.matBronzeMap
    );
    mapPlaque.position.set(0, 2.2, 4.0);
    mapPlaque.rotateX(-0.2); // Tilted toward observer
    summitGroup.add(mapPlaque);

    // Twin High-Power Brass Viewfinders
    [-6.0, 6.0].forEach((vx) => {
      const scopePed = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.26, 1.4, 8),
        this.matBronzeMap
      );
      scopePed.position.set(vx, 1.8, 14.0);
      summitGroup.add(scopePed);

      const scopeHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.25, 0.7),
        this.matBronzeMap
      );
      scopeHead.position.set(vx, 2.6, 14.0);
      scopeHead.rotateX(-0.18); // Aimed up at Rainier summit
      summitGroup.add(scopeHead);
    });

    this.group.add(summitGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. OFF-ROAD / SECRET SPUR: Skyline Glacier Trail & Reflection Basin (Z = 24,500m)
  // ─────────────────────────────────────────────────────────────────────────
  buildSkylineGlacierTrail() {
    const t = this.splineRoad.getRoadTransformAtZ(24500, -26, 0);
    const trailGroup = new THREE.Group();
    trailGroup.name = 'Trail_SkylineGlacierSpur';
    trailGroup.position.copy(t.pos);
    trailGroup.rotation.y = t.heading + Math.PI * 0.45;

    // Rustic Timber Trailhead Portal Arch (Subterranean posts Y <= -1.8m)
    [-4.5, 4.5].forEach((px) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.55, 6.5, 8),
        this.matLodgeLogs
      );
      post.position.set(px, 1.8, 0); // Sinks to Y = -1.45m
      post.castShadow = true;
      trailGroup.add(post);
    });

    const crossbeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 10.5, 8),
      this.matLodgeLogs
    );
    crossbeam.rotateZ(Math.PI * 0.5);
    crossbeam.position.set(0, 4.8, 0);
    trailGroup.add(crossbeam);

    // Carved Wood Park Signboard
    const trailSign = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 1.2, 0.18),
      this.matParkSignBrown
    );
    trailSign.position.set(0, 4.2, 0.15);
    trailGroup.add(trailSign);

    const trailText = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 0.4, 0.22),
      this.matSignWhite
    );
    trailText.position.set(0, 4.2, 0.15);
    trailGroup.add(trailText);

    // Compacted Scree / Dirt Switchback Trail Track (Ascending ridge toward tarn)
    const trailGeo = new THREE.PlaneGeometry(8.0, 48.0, 4, 12);
    trailGeo.rotateX(-Math.PI * 0.5);
    const trailMesh = new THREE.Mesh(trailGeo, this.matTrailGravel);
    trailMesh.position.set(0, 0.08, 24.0);
    trailGroup.add(trailMesh);

    // Stacked Stone Trail Cairns & Guide Bollards
    [-3.8, 3.8].forEach((cx, idx) => {
      [8.0, 20.0, 32.0, 44.0].forEach((cz) => {
        const cairnBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.65, 0.9, 0.6, 6),
          this.matGlacialStone
        );
        cairnBase.position.set(cx + (idx % 2 === 0 ? 0.3 : -0.3), 0.3, cz);
        trailGroup.add(cairnBase);

        const cairnTop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.55, 0.6, 5),
          this.matGlacialStone
        );
        cairnTop.position.set(cx + (idx % 2 === 0 ? 0.3 : -0.3), 0.8, cz);
        trailGroup.add(cairnTop);
      });
    });

    // Hidden Alpine Reflection Tarn Basin at Trail Terminus (Z = 50m deep)
    const tarnBase = new THREE.Mesh(
      new THREE.CylinderGeometry(16.0, 18.0, 3.0, 14),
      this.matGlacialStone
    );
    tarnBase.position.set(0, -0.8, 52.0); // Sinks to Y = -2.3m
    trailGroup.add(tarnBase);

    // Glassy Alpine Reflection Water Plane
    const tarnWater = new THREE.Mesh(
      new THREE.CircleGeometry(15.5, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 })
    );
    tarnWater.rotateX(-Math.PI * 0.5);
    tarnWater.position.set(0, 0.65, 52.0);
    trailGroup.add(tarnWater);

    this.group.add(trailGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. INTERACTIVE CINEMATIC VIGNETTE: Concrete Avalanche Snow Shed Gallery
  // (Z = 25,160m to 25,240m) — Preset: Glacial Avalanche Snow Shed Thunder
  // ─────────────────────────────────────────────────────────────────────────
  buildAvalancheSnowShedGallery() {
    this.avalancheGalleryGroup = new THREE.Group();
    this.avalancheGalleryGroup.name = 'Vignette_AvalancheSnowShed';

    const shedStartZ = 25160;
    const shedEndZ = 25240;
    const shedLen = shedEndZ - shedStartZ;
    const centerZ = (shedStartZ + shedEndZ) * 0.5;

    // Gallery Center Transform
    this.galleryTransform = this.splineRoad.getRoadTransformAtZ(centerZ, 0, 0);
    this.avalancheGalleryGroup.position.copy(this.galleryTransform.pos);
    this.avalancheGalleryGroup.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      this.galleryTransform.tangent
    );

    // Massive Angled Reinforced Concrete Avalanche Deflection Roof (Width 32m, Length 82m)
    // Slanted to deflect tumbling snow and boulders over highway into valley
    const roofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(32.0, 2.2, shedLen + 2.0),
      this.matBrutalistConcrete
    );
    roofSlab.position.set(2.0, 8.5, 0);
    roofSlab.rotateZ(-0.16); // Slanted downward toward valley (left)
    roofSlab.castShadow = true;
    roofSlab.receiveShadow = true;
    this.avalancheGalleryGroup.add(roofSlab);

    // Mountain Cliff Retaining Wall on Right (Subterranean skirt sinking Y <= -2.5m)
    const mountainWall = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 14.0, shedLen + 4.0),
      this.matBrutalistConcrete
    );
    mountainWall.position.set(16.0, 4.0, 0); // Sinks to Y = -3.0m
    mountainWall.castShadow = true;
    this.avalancheGalleryGroup.add(mountainWall);

    // Colonnade Heavy Concrete Valley Piers on Left Side (Subterranean skirt sinking Y <= -3.0m)
    this.colonnadePillars = [];
    for (let pz = -shedLen * 0.5 + 4; pz <= shedLen * 0.5 - 4; pz += 9.0) {
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 12.0, 2.8),
        this.matBrutalistConcrete
      );
      pier.position.set(-14.0, 3.0, pz); // Sinks to Y = -3.0m
      pier.castShadow = true;
      this.avalancheGalleryGroup.add(pier);
      this.colonnadePillars.push(pier);
    }

    // Heavy Valley Concrete Parapet Barrier (Between piers)
    const valleyParapet = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.6, shedLen),
      this.matBrutalistConcrete
    );
    valleyParapet.position.set(-14.0, 0.8, 0);
    this.avalancheGalleryGroup.add(valleyParapet);

    // Emergency Avalanche Monitoring Alcove & Maintenance Station at Z = 25,200m
    const alcove = new THREE.Mesh(
      new THREE.BoxGeometry(8.0, 6.0, 14.0),
      this.matBrutalistConcrete
    );
    alcove.position.set(18.0, 3.0, 0);
    this.avalancheGalleryGroup.add(alcove);

    // Flashing Emergency Warning Beacons (Amber / Red)
    this.beacons = [];
    [-3.0, 3.0].forEach((bz, idx) => {
      const beaconHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8),
        this.matSteelRail
      );
      beaconHousing.position.set(14.2, 5.0, bz);
      this.avalancheGalleryGroup.add(beaconHousing);

      const beaconLens = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 8, 8),
        idx === 0 ? this.matBeaconAmber : this.matBeaconRed
      );
      beaconLens.position.set(14.2, 5.5, bz);
      beaconLens.name = 'AvalancheWarningBeacon';
      this.avalancheGalleryGroup.add(beaconLens);
      this.beacons.push({ mesh: beaconLens, isAmber: idx === 0, baseMat: idx === 0 ? this.matBeaconAmber : this.matBeaconRed });
    });

    // Emergency Callbox & Warning Plaque
    const callbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.2, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    callbox.position.set(14.0, 2.2, 0);
    this.avalancheGalleryGroup.add(callbox);

    const callboxSign = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.2, 0.15),
      this.matSignYellow
    );
    callboxSign.position.set(14.0, 4.0, 0);
    this.avalancheGalleryGroup.add(callboxSign);

    // Snow Flurry Slide Slab simulation atop roof
    const snowDebris = new THREE.Mesh(
      new THREE.BoxGeometry(28.0, 1.4, shedLen * 0.7),
      this.matGlacialSnow
    );
    snowDebris.position.set(3.0, 9.8, 0);
    snowDebris.rotateZ(-0.16);
    this.avalancheGalleryGroup.add(snowDebris);

    this.group.add(this.avalancheGalleryGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. SUBALPINE FOREST: Instanced Subalpine Firs & Golden Alpine Larches
  // ─────────────────────────────────────────────────────────────────────────
  buildAlpineFlora() {
    const firCount = 240;
    const firTrunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 9.0, 5);
    const firFoliageGeo = new THREE.ConeGeometry(4.2, 14.0, 5);

    const instTrunk = new THREE.InstancedMesh(firTrunkGeo, this.matSubalpineTrunk, firCount);
    const instFoliage = new THREE.InstancedMesh(firFoliageGeo, this.matSubalpineFir, firCount);
    const instLarch = new THREE.InstancedMesh(firFoliageGeo, this.matAlpineLarch, Math.floor(firCount * 0.35));

    instTrunk.name = 'InstancedSubalpineTrunks';
    instFoliage.name = 'InstancedSubalpineFirs';
    instLarch.name = 'InstancedAlpineLarches';

    const dummy = new THREE.Object3D();
    let larchIdx = 0;

    for (let i = 0; i < firCount; i++) {
      // Scatter from 23,400m to 25,950m
      const z = 23420 + Math.random() * 2530;
      const isRight = Math.random() > 0.48;
      const latDist = isRight ? (18.0 + Math.random() * 65.0) : -(18.0 + Math.random() * 55.0);

      // Avoid placing trees in middle of road or inside avalanche shed
      if (z >= 25150 && z <= 25250 && Math.abs(latDist) < 22) continue;

      const t = this.splineRoad.getRoadTransformAtZ(z, latDist, 0);
      const scale = 0.75 + Math.random() * 0.65;

      // Sunk into terrain for seamless planting
      dummy.position.copy(t.pos);
      dummy.position.y += 3.5 * scale;
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.updateMatrix();

      instTrunk.setMatrixAt(i, dummy.matrix);

      // Foliage sits atop trunk
      dummy.position.y += 4.5 * scale;
      dummy.updateMatrix();

      const isLarch = (i % 3 === 0) && (larchIdx < Math.floor(firCount * 0.35));
      if (isLarch) {
        instLarch.setMatrixAt(larchIdx++, dummy.matrix);
      } else {
        instFoliage.setMatrixAt(i, dummy.matrix);
      }
    }

    instTrunk.instanceMatrix.needsUpdate = true;
    instFoliage.instanceMatrix.needsUpdate = true;
    instLarch.instanceMatrix.needsUpdate = true;

    this.group.add(instTrunk);
    this.group.add(instFoliage);
    this.group.add(instLarch);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. NATIONAL PARK HIGHWAY SIGNAGE & MARKERS
  // ─────────────────────────────────────────────────────────────────────────
  buildCascadeHighwaySignage() {
    const signs = [
      { z: 23450, text: 'MOUNT RAINIER NATIONAL PARK • ELEV 3,800 FT', side: 'right' },
      { z: 23900, text: 'PARADISE HISTORIC LODGE • 1/2 MILE', side: 'right' },
      { z: 24750, text: 'NARADA FALLS BASALT CHASM • SCENIC TURNOUT', side: 'left' },
      { z: 25100, text: 'SNOW SHED AHEAD • DO NOT STOP IN TUNNEL', side: 'right' },
      { z: 25500, text: 'RAINIER GLACIER SUMMIT OVERLOOK • ELEV 5,420 FT', side: 'right' }
    ];

    signs.forEach((s) => {
      const isRight = s.side === 'right';
      const lat = isRight ? 13.5 : -13.5;
      const t = this.splineRoad.getRoadTransformAtZ(s.z, lat, 0);

      const signGroup = new THREE.Group();
      signGroup.name = `RoadSign_Cascade_${s.z}`;
      signGroup.position.copy(t.pos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
      signGroup.rotateY(Math.PI); // Face oncoming traffic!
      signGroup.rotateY(isRight ? -0.60 : 0.60); // Angled ~35° inward toward highway lanes for direct sightline

      // Support Posts (Sinking Y <= -1.5m, behind board at z = -0.12)
      [-1.8, 1.8].forEach((px) => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 4.8, 6),
          this.matParkSignBrown
        );
        post.position.set(px, 1.2, -0.12);
        post.castShadow = true;
        signGroup.add(post);
      });

      const parts = s.text.split(' • ');
      const line1 = parts[0];
      const line2 = parts.slice(1).join(' • ');
      const signTex = this.renderer.textures.highwaySign(line1, line2, '#3d271d');
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signMaterials = [
        this.matParkSignBrown, // +X
        this.matParkSignBrown, // -X
        this.matParkSignBrown, // +Y
        this.matParkSignBrown, // -Y
        signMat,               // +Z (Front face facing oncoming traffic)
        this.matParkSignBrown  // -Z (Back face)
      ];

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 2.2, 0.15),
        signMaterials
      );
      board.position.set(0, 2.8, 0);
      signGroup.add(board);

      this.group.add(signGroup);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. CASCADE TERMINUS GRAND FINISH LINE GATEWAY (Z = 53,500m)
  // ─────────────────────────────────────────────────────────────────────────
  buildCascadeFinishLine() {
    const t = this.splineRoad.getRoadTransformAtZ(53500, 0, 0);
    const finishGroup = new THREE.Group();
    finishGroup.name = 'Scenic_CascadeTerminusFinishLine';
    finishGroup.position.copy(t.pos);
    finishGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);

    // Colossal Stone Gateway Pillars (Subterranean skirt sinking Y <= -2.5m)
    [-14.5, 14.5].forEach((px) => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 16.0, 3.6),
        this.matGlacialStone
      );
      pillar.position.set(px, 6.0, 0); // Sinks to Y = -2.0m
      pillar.castShadow = true;
      finishGroup.add(pillar);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 1.2, 4.4),
        this.matGlacialStone
      );
      cap.position.set(px, 14.6, 0);
      finishGroup.add(cap);
    });

    // Overhead Timber Archway Span (Height 13.5m)
    const archSpan = new THREE.Mesh(
      new THREE.BoxGeometry(32.0, 2.4, 2.8),
      this.matLodgeLogs
    );
    archSpan.position.set(0, 13.8, 0);
    finishGroup.add(archSpan);

    // Grand Continental Highway Banner
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(24.0, 3.0, 0.2),
      this.matFinishBanner
    );
    banner.position.set(0, 11.2, 0);
    finishGroup.add(banner);

    const bannerText = new THREE.Mesh(
      new THREE.BoxGeometry(22.0, 0.8, 0.26),
      this.matSignWhite
    );
    bannerText.position.set(0, 11.2, 0.05);
    finishGroup.add(bannerText);

    // Checkerboard Road Surface Decal
    const checker = new THREE.Mesh(
      new THREE.PlaneGeometry(22.0, 4.0),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    checker.rotateX(-Math.PI * 0.5);
    checker.position.set(0, 0.05, 0);
    finishGroup.add(checker);

    this.group.add(finishGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERACTIVE VIGNETTE PLAYBACK CONTROLS & CAMERA CHOREOGRAPHY
  // ─────────────────────────────────────────────────────────────────────────
  triggerAvalancheCinematic() {
    if (this.isCinematicPlaying) return;
    this.isCinematicPlaying = true;
    this.cinematicTime = 0.0;
    this.cinematicPhase = 'SHOT_1_APPROACH';
    this.hasTriggeredVignette = true;

    // Activate Cutscene State
    gameState.isCutsceneActive = true;
    gameState.cutsceneName = 'zone9_avalanche_shed';
    gameState.cutsceneDuration = this.cinematicDuration;
    gameState.cutsceneTitleCard = '🎬 GLACIAL AVALANCHE SNOW SHED THUNDER';
    gameState.cutsceneSubtitles = 'CASCADE PASS ELEVATION 5,420 FT: Extreme winter avalanche risk detected along Nisqually Glacier ridge.';

    // Register active cutscene provider on window.game
    if (typeof window !== 'undefined' && window.game) {
      window.game.activeZoneCutscene = this;
      if (window.game.sound && window.game.sound.playRumbleSound) {
        window.game.sound.playRumbleSound();
      }
      if (window.game.hud && window.game.hud.showActionToast) {
        window.game.hud.showActionToast(
          '🎬 AVALANCHE DEFENSE GALLERY',
          'Inspecting brutalist concrete snow shed gallery... 12s surveillance',
          3500
        );
      }
    }
  }

  skipCutscene() {
    if (!this.isCinematicPlaying) return;
    this.completeCinematic();
  }

  completeCinematic() {
    this.isCinematicPlaying = false;
    this.cinematicPhase = 'IDLE';
    gameState.isCutsceneActive = false;
    gameState.cutsceneSubtitles = '';
    gameState.cutsceneTitleCard = '';

    // Award discovery points
    gameState.score += 500;

    if (typeof window !== 'undefined' && window.game) {
      if (window.game.activeZoneCutscene === this) {
        window.game.activeZoneCutscene = null;
      }
      if (window.game.hud && window.game.hud.showActionToast) {
        window.game.hud.showActionToast(
          '🏅 VIGNETTE COMPLETE',
          'Glacial Avalanche Defense Gallery Inspected! +500 PTS',
          4500
        );
      }
      if (window.game.saveManager) {
        window.game.saveManager.save(true);
      }
    }
  }

  getCurrentCutsceneCam() {
    const t = this.galleryTransform;
    if (!t) return null;

    const time = this.cinematicTime;

    if (time < 4.5) {
      // Shot 1: Wide exterior establishing shot from valley looking up at brutalist gallery
      this.cinematicPhase = 'SHOT_1_ESTABLISHING';
      gameState.cutsceneSubtitles = 'CASCADE PASS ELEVATION 5,420 FT: Extreme winter avalanche risk detected along Nisqually Glacier ridge.';

      const progress = time / 4.5;
      this._tempCamPos.copy(t.pos)
        .addScaledVector(t.normal, -38.0 + progress * 8.0)
        .addScaledVector(t.tangent, -24.0 + progress * 10.0);
      this._tempCamPos.y = t.pos.y + 16.0 - progress * 2.0;

      this._tempLookAt.copy(t.pos)
        .addScaledVector(t.normal, 4.0)
        .addScaledVector(t.tangent, 0);
      this._tempLookAt.y = t.pos.y + 7.5;

      this._camResult.fov = 56;
      return this._camResult;
    } else if (time < 9.0) {
      // Shot 2: Dramatic high-angle roof deflection camera showing cascading snow
      this.cinematicPhase = 'SHOT_2_DEFLECTION_ROOF';
      gameState.cutsceneSubtitles = 'BRUTALIST CONCRETE SNOW SHED: Heavy reinforced galleries direct thousands of tons of alpine ice safely over the highway.';

      const progress = (time - 4.5) / 4.5;
      this._tempCamPos.copy(t.pos)
        .addScaledVector(t.normal, 18.0)
        .addScaledVector(t.tangent, -20.0 + progress * 22.0);
      this._tempCamPos.y = t.pos.y + 19.5;

      this._tempLookAt.copy(t.pos)
        .addScaledVector(t.normal, -4.0)
        .addScaledVector(t.tangent, 5.0 + progress * 15.0);
      this._tempLookAt.y = t.pos.y + 8.0;

      this._camResult.fov = 50;
      return this._camResult;
    } else {
      // Shot 3: Colonnade exit camera looking toward glowing summit of Mount Rainier
      this.cinematicPhase = 'SHOT_3_EXIT_VISTA';
      gameState.cutsceneSubtitles = 'AVALANCHE DEFENSE SECURE: Route cleared through Cascade Alpine Pass. Ahead: Paradise Valley & Rainier Summit.';

      const progress = (time - 9.0) / 4.0;
      this._tempCamPos.copy(t.pos)
        .addScaledVector(t.normal, -8.0)
        .addScaledVector(t.tangent, 15.0 + progress * 14.0);
      this._tempCamPos.y = t.pos.y + 4.2;

      this._tempLookAt.copy(t.pos)
        .addScaledVector(t.normal, 22.0)
        .addScaledVector(t.tangent, 55.0);
      this._tempLookAt.y = t.pos.y + 24.0;

      this._camResult.fov = 52;
      return this._camResult;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 60 FPS MAIN LOOP UPDATE (Zero Heap Allocations)
  // ─────────────────────────────────────────────────────────────────────────
  update(dt, playerPos) {
    // 1. Animate Warning Beacons (Flashing Amber & Red)
    if (this.beacons && this.beacons.length > 0) {
      const flash = Math.sin(gameState.gameTime * 6.0) > 0.0;
      this.beacons.forEach((b) => {
        b.mesh.visible = flash;
      });
    }

    // 2. Proximity Check for Interactive Cutscene Trigger
    // Emergency alcove at Z = 25,200m
    const zDist = Math.abs(playerPos.z - 25200);
    if (!this.isCinematicPlaying && !this.hasTriggeredVignette && zDist < 35.0) {
      this._tempVec1.set(playerPos.x, playerPos.y, playerPos.z);
      const galleryCenter = this.galleryTransform.pos;
      const d = this._tempVec1.distanceTo(galleryCenter);

      if (d < 24.0) {
        // Show prompt if speed is low or stopped
        if (typeof window !== 'undefined' && window.game && window.game.hud) {
          if (gameState.speedMph < 45.0) {
            window.game.hud.showActionToast(
              '⚠️ AVALANCHE DEFENSE GALLERY',
              'Press [E] or Pull In to Inspect Emergency Snow Shed',
              1500
            );
          }
        }

        // Auto-trigger if player stops or pulls directly into the emergency alcove
        if (gameState.speedMph < 12.0 && playerPos.x > 8.0) {
          this.triggerAvalancheCinematic();
        }
      }
    }

    // 3. Progress Active Cutscene
    if (this.isCinematicPlaying) {
      this.cinematicTime += dt;
      if (this.cinematicTime >= this.cinematicDuration) {
        this.completeCinematic();
      }
    }
  }
}
