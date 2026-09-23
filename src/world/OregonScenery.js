import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';

export class OregonSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.animatedObjects = [];
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Oregon Coast Materials with Procedural PBR Textures & Normal Maps
    const spruceBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('pine', 256) : null;
    const spruceBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('pine', 256) : null;
    const spruceFoliageDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('conifer', 256) : null;
    const spruceFoliageNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('conifer', 256) : null;
    const rockNorm = renderer.textures.mountainRidgeNormalPBR ? renderer.textures.mountainRidgeNormalPBR(512) : null;
    const plankDriftDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('driftwood', 256) : null;
    const plankDriftNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('driftwood', 256) : null;
    const plankBarnDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('barn_red', 256) : null;
    const plankBarnNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('barn_red', 256) : null;
    const stoneNorm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;

    this.matBasaltDark = renderer.createToonMaterial({ color: 0x373b40, gradientBands: 3, normalMap: rockNorm });
    this.matBasaltWet = renderer.createToonMaterial({ color: 0x212529, gradientBands: 2, normalMap: rockNorm });
    this.matTideSand = renderer.createToonMaterial({ color: 0xab9b83, gradientBands: 2 });

    this.matTillamookWhite = renderer.createToonMaterial({ color: 0xf5f5f5, gradientBands: 3 });
    this.matTillamookBlack = renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 });
    this.matTillamookYellow = renderer.createToonMaterial({ color: 0xffb300, gradientBands: 2 });
    this.matSiloSilver = renderer.createToonMaterial({ color: 0x90a4ae, gradientBands: 2 });

    this.matLighthouseWhite = renderer.createToonMaterial({ color: 0xfafafa, gradientBands: 3, normalMap: stoneNorm });
    this.matLighthouseBlack = renderer.createToonMaterial({ color: 0x263238, gradientBands: 2 });
    this.matLightBeam = new THREE.MeshBasicMaterial({ color: 0xfff9c4, transparent: true, opacity: 0.28, side: THREE.DoubleSide });

    this.matSpruceTrunk = renderer.createToonMaterial({ color: 0x3e332a, gradientBands: 2, map: spruceBarkDiff, normalMap: spruceBarkNorm });
    this.matSpruceFoliage = renderer.createToonMaterial({ color: 0x1d3d2e, gradientBands: 3, map: spruceFoliageDiff, normalMap: spruceFoliageNorm });
    this.matDriftwood = renderer.createToonMaterial({ color: 0x8d857b, gradientBands: 2, map: plankDriftDiff, normalMap: plankDriftNorm });

    this.matSignGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 });
    this.matWhiteSign = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    this.matShopBlue = renderer.createToonMaterial({ color: 0x3b6ea5, gradientBands: 2 });
    this.matShopPink = renderer.createToonMaterial({ color: 0xf7d6d6, gradientBands: 2 });
    this.matShopCream = renderer.createToonMaterial({ color: 0xfdf5e6, gradientBands: 2 });
    this.matShopDark = renderer.createToonMaterial({ color: 0x2d3436, gradientBands: 2 });
    this.matTillamookBuilding = renderer.createToonMaterial({ color: 0xc8a96a, gradientBands: 3, map: plankBarnDiff, normalMap: plankBarnNorm });
    this.matTillamookGlass = new THREE.MeshBasicMaterial({ color: 0x7ecac8, transparent: true, opacity: 0.65 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matParkBrown = renderer.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2 });
    this.matWharfDark = renderer.createToonMaterial({ color: 0x2b2f33, gradientBands: 2 });
    this.matWharfWood = renderer.createToonMaterial({ color: 0x8b7355, gradientBands: 2, map: plankDriftDiff, normalMap: plankDriftNorm });
    this.matWharfWhite = renderer.createToonMaterial({ color: 0xf5f5f0, gradientBands: 2 });
    this.matCandyCane = new THREE.MeshBasicMaterial({ color: 0xe8273b });
    this.matTsunamiBlue = new THREE.MeshBasicMaterial({ color: 0x1565c0 });

    this.buildOregonEnvironment();
  }

  buildOregonEnvironment() {
    this.buildYaquinaHeadLighthouse();
    this.buildHaystackRockAndNeedles();
    this.buildDriftwoodBeachAndCaves();
    this.buildTillamookCreameryBarn();
    this.buildSitkaSpruceForest();
    this.buildNewportBayfront();
    this.buildCannonBeachHemlock();
    this.buildOregonStateBeachAccessPoints();
    this.buildTillamookCreameryModern();
    this.buildOregonRoadFurniture();
    this.buildOregonHighwaySignage();
    this.buildCoastalGuardrails();
  }

  // 1. Yaquina Head Lighthouse with Rotating Beacon (Z = 16100m)
  buildYaquinaHeadLighthouse() {
    const transform = this.splineRoad.getRoadTransformAtZ(16100, -65, 0);
    const lighthouse = new THREE.Group();
    lighthouse.position.copy(transform.pos);
    lighthouse.rotation.y = transform.heading;

    // High Basalt Headland Promontory
    const headland = new THREE.Mesh(new THREE.DodecahedronGeometry(28, 1), this.matBasaltDark);
    headland.scale.set(1.4, 1.2, 1.4);
    headland.position.set(0, 16, 0);
    headland.castShadow = true;
    lighthouse.add(headland);

    // 93-Foot Conical Brick White Tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.8, 22, 8), this.matLighthouseWhite);
    tower.position.set(0, 36, 0);
    tower.castShadow = true;
    lighthouse.add(tower);

    // Black Lantern Room & Gallery
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3.8, 8), this.matLighthouseBlack);
    lantern.position.set(0, 48, 0);
    lighthouse.add(lantern);

    // Rotating Powerful Light Beam
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 48, 0);

    const beamCone = new THREE.ConeGeometry(16, 170, 8, 1, true);
    beamCone.rotateX(Math.PI * 0.5);
    beamCone.translate(0, 0, 85);
    const beam = new THREE.Mesh(beamCone, this.matLightBeam);
    beamGroup.add(beam);

    lighthouse.add(beamGroup);
    this.animatedObjects.push({ obj: beamGroup, rotY: 0.02 });

    this.group.add(lighthouse);
  }

  // 2. Haystack Rock & The Needles (Cannon Beach at Z = 16600m)
  buildHaystackRockAndNeedles() {
    const transform = this.splineRoad.getRoadTransformAtZ(16600, -78, 0);
    const haystack = new THREE.Group();
    haystack.position.copy(transform.pos);
    haystack.rotation.y = transform.heading;

    // Monumental 235-Foot Basalt Sea Stack (Haystack Rock)
    const rockGeo = new THREE.DodecahedronGeometry(32, 1);
    rockGeo.scale(1.2, 2.3, 1.4);
    const mainRock = new THREE.Mesh(rockGeo, this.matBasaltDark);
    mainRock.position.set(0, 34, 0);
    mainRock.castShadow = true;
    haystack.add(mainRock);

    // The Needles: Sharp jagged companion sea rocks
    const needle1 = new THREE.Mesh(new THREE.ConeGeometry(7, 28, 5), this.matBasaltWet);
    needle1.position.set(24, 14, 18);
    haystack.add(needle1);

    const needle2 = new THREE.Mesh(new THREE.ConeGeometry(5, 22, 5), this.matBasaltWet);
    needle2.position.set(28, 11, -22);
    haystack.add(needle2);

    // Tidal Sand Bed
    const tideSand = new THREE.Mesh(new THREE.PlaneGeometry(65, 90), this.matTideSand);
    tideSand.position.set(10, 0.1, 0);
    tideSand.rotation.x = -Math.PI * 0.5;
    haystack.add(tideSand);

    this.group.add(haystack);
  }

  // 3. Oregon Driftwood Beach & Coastal Sea Caves (Z = 17100m)
  buildDriftwoodBeachAndCaves() {
    const transform = this.splineRoad.getRoadTransformAtZ(17100, -42, 0);
    const beach = new THREE.Group();
    beach.position.copy(transform.pos);
    beach.rotation.y = transform.heading;

    // Weathered Giant Driftwood Logs scattered along tide line
    for (let l = 0; l < 8; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 14, 6), this.matDriftwood);
      log.position.set((l % 2 === 0 ? 0 : 8) + (Math.random() - 0.5) * 4, 0.6, (l - 4) * 12);
      log.rotation.z = Math.PI * 0.5;
      log.rotation.y = (Math.random() - 0.5) * 1.2;
      beach.add(log);
    }

    // Basalt Sea Cave carved into cliff face
    const caveRock = new THREE.Mesh(new THREE.BoxGeometry(24, 16, 28), this.matBasaltDark);
    caveRock.position.set(-18, 8, 0);
    beach.add(caveRock);

    const caveArch = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 20), this.matBasaltWet);
    caveArch.position.set(-8, 4, 0);
    beach.add(caveArch);

    this.group.add(beach);
  }

  // 4. Tillamook Cheese Creamery & Historic Giant Barn (Z = 17650m)
  buildTillamookCreameryBarn() {
    const transform = this.splineRoad.getRoadTransformAtZ(17650, 42, 0);
    const tillamook = new THREE.Group();
    tillamook.position.copy(transform.pos);
    // Face the Dutch gambrel loft facade and silos toward the road & turnout
    tillamook.rotation.y = transform.heading + Math.PI * 0.5 - 0.25;

    // Authentic Dutch Gambrel Dairy Barn & Silo
    const barn = this.structureBuilder.buildHistoricBarn({
      width: 26.0,
      depth: 36.0,
      wallHeight: 9.0,
      hasSilo: true,
      colorWall: 0xf5f5f5,
      colorRoof: 0x1a1a1a,
      subterraneanDepth: 4.0
    });
    tillamook.add(barn);


    // Bright Yellow Tillamook Cheese Tour Bus / Delivery Truck
    const bus = new THREE.Group();
    bus.position.set(-12, 0.4, 16);

    const busBody = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 7.5), this.matTillamookYellow);
    busBody.position.y = 1.6;
    bus.add(busBody);

    [-1.6, 1.6].forEach(wx => {
      [-2.2, 2.2].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8), this.matTillamookBlack);
        wheel.position.set(wx, 0.5, wz);
        wheel.rotation.z = Math.PI * 0.5;
        bus.add(wheel);
      });
    });

    tillamook.add(bus);
    this.group.add(tillamook);
  }

  // 5. Dense Windswept Sitka Spruce & Western Hemlock Forest (Z = 15620 - 18180m)
  buildSitkaSpruceForest() {
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const treeCount = isMobile ? 65 : 130;
    const zStep = isMobile ? 39.0 : 19.5;

    for (let i = 0; i < treeCount; i++) {
      const z = 15620 + i * zStep + (Math.random() - 0.5) * 8;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (20.0 + Math.random() * 28);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const h = 14.0 + Math.random() * 8.0;
      const spruce = new THREE.Group();
      spruce.position.copy(transform.pos);
      spruce.rotation.y = Math.random() * Math.PI * 2;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, h, 6), this.matSpruceTrunk);
      trunk.position.y = h * 0.5;
      spruce.add(trunk);

      // Drooping layered tiered evergreen boughs
      for (let y = 5; y <= h + 2; y += 3.2) {
        const bough = new THREE.Mesh(new THREE.ConeGeometry(5.2 - (y * 0.16), 4.5, 6), this.matSpruceFoliage);
        bough.position.y = y;
        bough.castShadow = !isMobile;
        spruce.add(bough);
      }

      this.group.add(spruce);
    }
  }

  // 6. Coastal Rustic Timber Guardrails
  buildCoastalGuardrails() {
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const zStep = isMobile ? 48 : 24;
    for (let z = 15650; z < 18150; z += zStep) {
      const transform = this.splineRoad.getRoadTransformAtZ(z, -19.5, 0);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, zStep + 0.2), this.matDriftwood);
      rail.position.set(transform.pos.x, transform.pos.y + 0.6, transform.pos.z);
      rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      this.group.add(rail);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 6), this.matSpruceTrunk);
      post.position.set(transform.pos.x, transform.pos.y + 0.5, transform.pos.z);
      this.group.add(post);
    }
  }

  // 7. Oregon Coast Highway Signage
  buildOregonHighwaySignage() {
    const signs = [
      { z: 15650, text: 'OREGON COAST PACIFIC HWY 101\nCANNON BEACH 6 MI' },
      { z: 16050, text: 'CAPE MEARES LIGHTHOUSE\nSCENIC VIEWPOINT' },
      { z: 16550, text: 'CANNON BEACH\nHAYSTACK ROCK & THE NEEDLES' },
      { z: 17550, text: 'TILLAMOOK CHEESE FACTORY\nCREAMERY & DAIRY FARM' }
    ];

    signs.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, 19.5, 0);
      const signGroup = new THREE.Group();
      signGroup.position.copy(transform.pos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      signGroup.rotateY(Math.PI); // Face oncoming traffic!
      signGroup.rotateY(-0.60); // Angled ~35° inward toward highway lanes for direct sightline

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.matTillamookBlack);
      pole.position.set(0, 3.25, -0.16);
      signGroup.add(pole);

      const [line1, line2] = s.text.split('\n');
      const signTex = this.renderer.textures.highwaySign(line1, line2 || '', '#1b5e20');
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signMaterials = [
        this.matSignGreen, // +X
        this.matSignGreen, // -X
        this.matSignGreen, // +Y
        this.matSignGreen, // -Y
        signMat,           // +Z (Front face facing oncoming traffic)
        this.matSignGreen  // -Z (Back face)
      ];
      const board = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.6, 0.22), signMaterials);
      board.position.y = 5.5;
      signGroup.add(board);

      this.group.add(signGroup);
    });
  }

  // Newport Oregon Bayfront — Local Ocean, Claim 52 Brewing, Nye Beach Hotel (Z=16050–16120m)
  buildNewportBayfront() {
    const baseZ = 16060;
    const buildings = [
      { z: baseZ, xOff: -32, w: 12, h: 6, d: 6, mat: 'matWharfWood', name: 'LOCAL OCEAN', nameCol: 0xffffff },
      { z: baseZ + 40, xOff: -32, w: 18, h: 7, d: 8, mat: 'matWharfDark', name: 'CLAIM 52 BREWING', nameCol: 0xf97316 },
      { z: baseZ + 80, xOff: -32, w: 12, h: 6, d: 7, mat: 'matWharfWhite', name: 'NYE BEACH', nameCol: 0x1e3a5f },
    ];

    buildings.forEach(b => {
      const transform = this.splineRoad.getRoadTransformAtZ(b.z, b.xOff, 0);
      const bldg = new THREE.Group();
      bldg.position.copy(transform.pos);
      // Left side: face across road toward oncoming traffic
      bldg.rotation.y = transform.heading + Math.PI * 0.5 + 0.22;

      let structure;
      if (b.name === 'CLAIM 52 BREWING') {
        structure = this.structureBuilder.buildCanneryFactory({
          width: b.w,
          depth: b.d,
          height: b.h,
          colorBrick: 0x5a3e36,
          colorRoof: 0x2e3438,
          subterraneanDepth: 3.0
        });
      } else {
        structure = this.structureBuilder.buildCoastalSeafoodShack({
          width: b.w,
          depth: b.d,
          height: b.h,
          colorSiding: b.name === 'LOCAL OCEAN' ? 0x8a6a4a : 0xd8d8d4,
          colorRoof: b.name === 'LOCAL OCEAN' ? 0x2e3438 : 0x1e3a5f,
          subterraneanDepth: 3.0
        });
      }
      bldg.add(structure);

      const signBg = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.8, 1.4, 0.4),
        this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
      signBg.position.set(0, b.h + 1.1, b.d * 0.5);
      bldg.add(signBg);

      const signNeon = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.7, 0.5, 0.45),
        new THREE.MeshBasicMaterial({ color: b.nameCol }));
      signNeon.position.set(0, b.h + 1.1, b.d * 0.5 + 0.1);
      bldg.add(signNeon);

      this.group.add(bldg);
    });


    // Harbor pier extending ocean-side
    const pierTransform = this.splineRoad.getRoadTransformAtZ(baseZ + 40, -35, 0);
    const pier = new THREE.Group();
    pier.position.copy(pierTransform.pos);
    pier.rotation.y = pierTransform.heading;
    const pierDeck = new THREE.Mesh(new THREE.PlaneGeometry(8, 40), this.matWharfWood);
    pierDeck.rotateX(-Math.PI * 0.5);
    pierDeck.position.y = 0.08;
    pier.add(pierDeck);
    for (let p = -16; p <= 16; p += 8) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 6),
        this.matSpruceTrunk);
      piling.position.set(0, -2, p);
      pier.add(piling);
    }
    this.group.add(pier);
  }

  // Cannon Beach Hemlock Street Commercial Core (Z=16550–16680m)
  buildCannonBeachHemlock() {
    const shops = [
      { z: 16555, xOff: 30, w: 9,  h: 5.5, d: 8, col: 0xf5d0d0, roofCol: 0x8b0000, signCol: 0xe8273b,  label: "BRUCE'S CANDY" },
      { z: 16585, xOff: 30, w: 11, h: 6.0, d: 8, col: 0x2a3a5a, roofCol: 0x1a3a6b, signCol: 0xffffff,  label: 'CB BOOK CO.' },
      { z: 16618, xOff: 30, w: 12, h: 6.0, d: 8, col: 0xe8e4d8, roofCol: 0x4a4a4a, signCol: 0x2e7d32,  label: 'DRAGONFIRE GALLERY' },
      { z: 16652, xOff: 30, w: 14, h: 6.5, d: 9, col: 0x5c4030, roofCol: 0x2a2a2a, signCol: 0xfacc15, label: 'HARDWARE & PUB' },
      { z: 16688, xOff: 30, w: 11, h: 6.0, d: 8, col: 0x2d3436, roofCol: 0x1a1a1a, signCol: 0xff8f00,  label: 'ELEPHANT & CASTLE' },
    ];

    shops.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, s.xOff, 0);
      const shop = new THREE.Group();
      shop.position.copy(transform.pos);
      // Right side: face across road toward oncoming traffic
      shop.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;

      // Authentic coastal commercial buildings with display glass and awnings
      const building = this.structureBuilder.buildCommercialBuilding({
        width: s.w,
        depth: s.d,
        stories: 2,
        storyHeight: s.h * 0.5,
        colorWall: s.col,
        colorTrim: s.roofCol,
        subterraneanDepth: 3.5
      });
      shop.add(building);

      // Shop sign panel
      const signBg = new THREE.Mesh(new THREE.BoxGeometry(s.w * 0.85, 1.2, 0.35),
        this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
      signBg.position.set(0, s.h + 0.8, s.d * 0.5 + 0.1);
      shop.add(signBg);

      const signNeon = new THREE.Mesh(new THREE.BoxGeometry(s.w * 0.75, 0.45, 0.4),
        new THREE.MeshBasicMaterial({ color: s.signCol }));
      signNeon.position.set(0, s.h + 0.8, s.d * 0.5 + 0.2);
      shop.add(signNeon);

      // Awning (candy kitchen gets candy-stripe)
      const awningCol = s.label === "BRUCE'S CANDY" ? 0xe8273b : 0x2e5d1a;
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(s.w + 1.2, 0.18, 2.0),
        this.renderer.createToonMaterial({ color: awningCol, gradientBands: 2 }));
      awning.position.set(0, s.h - 0.8, s.d * 0.5 + 1.0);
      shop.add(awning);

      this.group.add(shop);
    });


    // Shared street parking apron
    const parkTransform = this.splineRoad.getRoadTransformAtZ(16620, 22, 0);
    const parkApron = new THREE.Mesh(new THREE.PlaneGeometry(8, 160), this.matAsphaltLot);
    parkApron.rotateX(-Math.PI * 0.5);
    parkApron.position.copy(parkTransform.pos);
    parkApron.position.y = 0.04;
    this.group.add(parkApron);

    // Parking stripes
    const matStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 10; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 5.5), matStripe);
      stripe.rotateX(-Math.PI * 0.5);
      const st = this.splineRoad.getRoadTransformAtZ(16555 + i * 14, 19.5, 0);
      stripe.position.copy(st.pos);
      stripe.position.y = 0.06;
      this.group.add(stripe);
    }

    // Street trees (Oregon oak)
    const matOakTrunk = this.renderer.createToonMaterial({ color: 0x5c4033, gradientBands: 2 });
    const matOakCrown = this.renderer.createToonMaterial({ color: 0x2e5c1e, gradientBands: 3 });
    for (let i = 0; i < 5; i++) {
      const z = 16558 + i * 32;
      const t = this.splineRoad.getRoadTransformAtZ(z, 26, 0);
      const oak = new THREE.Group();
      oak.position.copy(t.pos);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 5.5, 6), matOakTrunk);
      trunk.position.y = 2.75;
      oak.add(trunk);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), matOakCrown);
      crown.position.y = 7.5;
      crown.scale.set(1.4, 0.75, 1.3);
      oak.add(crown);
      this.group.add(oak);
    }
  }

  // Oregon State Park Beach Access Points with Tsunami Hazard Signs — every ~350m through zone
  buildOregonStateBeachAccessPoints() {
    const accessZs = [15820, 16170, 16520, 16870, 17220, 17570, 17920];
    const matConcrete = this.renderer.createToonMaterial({ color: 0x909090, gradientBands: 2 });
    const matFeeBox = this.renderer.createToonMaterial({ color: 0x4a4a4a, gradientBands: 2 });

    accessZs.forEach((z) => {
      const side = -1; // always ocean side
      const transform = this.splineRoad.getRoadTransformAtZ(z, side * 28, 0);
      const access = new THREE.Group();
      access.position.copy(transform.pos);
      access.rotation.y = transform.heading;

      // Paved lot apron
      const lot = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), this.matAsphaltLot);
      lot.rotateX(-Math.PI * 0.5);
      lot.position.set(0, 0.05, 0);
      access.add(lot);

      // OPRD brown park sign
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6), this.matParkBrown);
      signPost.position.set(-8, 1.4, -6);
      access.add(signPost);
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.0, 0.22), this.matParkBrown);
      signBoard.position.set(-8, 2.8, -6);
      access.add(signBoard);
      const signFace = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.7, 0.28), this.matWhiteSign);
      signFace.position.set(-8, 2.8, -6);
      access.add(signFace);

      // Self-pay fee station pipe+box
      const feePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), matFeeBox);
      feePipe.position.set(-7, 0.7, 6);
      access.add(feePipe);
      const feeBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.28), matFeeBox);
      feeBox.position.set(-7, 1.42, 6);
      access.add(feeBox);

      // Pit toilet building
      const toilet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 3.2), matConcrete);
      toilet.position.set(7, 1.3, -5);
      access.add(toilet);
      const toiletRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 3.6),
        this.renderer.createToonMaterial({ color: 0x5a5a5a, gradientBands: 2 }));
      toiletRoof.position.set(7, 2.75, -5);
      access.add(toiletRoof);

      // Split rail fence at lot edge
      const railMat = this.matSpruceTrunk;
      for (let r = -7; r <= 7; r += 4) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), railMat);
        post.position.set(r, 0.6, 8);
        access.add(post);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 16), railMat);
      rail.position.set(0, 0.9, 8);
      access.add(rail);

      this.group.add(access);

      // Tsunami Hazard Zone sign on road side — blue diamond
      const tsunamiT = this.splineRoad.getRoadTransformAtZ(z - 20, -19.5, 0);
      const tsunamiPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6),
        this.renderer.createToonMaterial({ color: 0x555555, gradientBands: 2 }));
      tsunamiPost.position.set(tsunamiT.pos.x, tsunamiT.pos.y + 1.75, tsunamiT.pos.z);
      this.group.add(tsunamiPost);

      const tsunamiSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.12), this.matTsunamiBlue);
      tsunamiSign.position.set(tsunamiT.pos.x, tsunamiT.pos.y + 3.6, tsunamiT.pos.z);
      tsunamiSign.rotation.y = Math.PI * 0.25; // diamond orientation
      this.group.add(tsunamiSign);
      const tsunamiWave = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.18),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tsunamiWave.position.set(tsunamiT.pos.x, tsunamiT.pos.y + 3.7, tsunamiT.pos.z + 0.1);
      this.group.add(tsunamiWave);
    });
  }

  // Tillamook Creamery — Modern 2018 Barn-Inspired Building (Z=17760m, X=+48)
  buildTillamookCreameryModern() {
    const transform = this.splineRoad.getRoadTransformAtZ(17760, 48, 0);
    const tillamook = new THREE.Group();
    tillamook.position.copy(transform.pos);
    // Right side: face across highway toward oncoming traffic
    tillamook.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;


    // Main architectural barn-inspired visitor center
    const mainBuilding = this.structureBuilder.buildHistoricLodge({
      width: 44.0,
      depth: 24.0,
      stories: 2,
      storyHeight: 6.0,
      colorTimber: 0x9a7a50,
      colorRoof: 0x3a2e22,
      subterraneanDepth: 4.0
    });
    tillamook.add(mainBuilding);

    // Glass visitor entrance wing
    const glassWing = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 10), this.matTillamookGlass);
    glassWing.position.set(-8, 5, 15);
    tillamook.add(glassWing);

    // Old original factory building alongside
    const oldFactory = this.structureBuilder.buildWarehouseOrBarn({
      width: 22.0,
      depth: 16.0,
      height: 9.0,
      colorWall: 0xe8e0d0,
      colorRoof: 0x4a4a4a,
      subterraneanDepth: 3.5
    });
    oldFactory.position.set(28, 0, -2);
    tillamook.add(oldFactory);


    // Flagpole
    const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 16, 6),
      this.renderer.createToonMaterial({ color: 0xcccccc, gradientBands: 2 }));
    flagpole.position.set(-20, 8, 13);
    tillamook.add(flagpole);

    const flag = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.0, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xcc1122 }));
    flag.position.set(-18.2, 15.5, 13);
    tillamook.add(flag);

    // TILLAMOOK CREAMERY sign (green on white)
    const signBase = new THREE.Mesh(new THREE.BoxGeometry(22, 3.5, 0.5),
      this.renderer.createToonMaterial({ color: 0xf8f8f8, gradientBands: 2 }));
    signBase.position.set(0, 17.5, 13.2);
    tillamook.add(signBase);
    const signText = new THREE.Mesh(new THREE.BoxGeometry(19, 1.0, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x1a5c1a }));
    signText.position.set(0, 17.8, 13.3);
    tillamook.add(signText);

    this.group.add(tillamook);

    // Large parking lot (US-101 side)
    const lotTransform = this.splineRoad.getRoadTransformAtZ(17780, 50, 0);
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), this.matAsphaltLot);
    lot.rotateX(-Math.PI * 0.5);
    lot.position.copy(lotTransform.pos);
    lot.position.y = 0.04;
    this.group.add(lot);

    // Parking stripes
    const matStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let row = 0; row < 2; row++) {
      for (let stall = 0; stall < 18; stall++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 5.5), matStripe);
        stripe.rotateX(-Math.PI * 0.5);
        const sz = 17755 + stall * 4.4;
        const sx = 38 + row * 12;
        const st = this.splineRoad.getRoadTransformAtZ(sz, sx, 0);
        stripe.position.copy(st.pos);
        stripe.position.y = 0.06;
        this.group.add(stripe);
      }
    }

    // Dedicated US-101 turn lane entry apron
    const entryTransform = this.splineRoad.getRoadTransformAtZ(17760, 26, 0);
    const entryApron = new THREE.Mesh(new THREE.PlaneGeometry(14, 22), this.matAsphaltLot);
    entryApron.rotateX(-Math.PI * 0.5);
    entryApron.position.copy(entryTransform.pos);
    entryApron.position.y = 0.03;
    this.group.add(entryApron);
  }

  // Oregon Coast Road Furniture — Wildlife signs, wooden guardrail, Public Beach Access signs
  buildOregonRoadFurniture() {
    const matPost = this.renderer.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2 });
    const matWoodRail = this.renderer.createToonMaterial({ color: 0x8b7355, gradientBands: 2 });
    const matYellowSign = new THREE.MeshBasicMaterial({ color: 0xf5c518 });
    const matBrownSign = this.renderer.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2 });

    // Wildlife warning signs (elk graphic) every 600m, alternating sides
    const wildlifeZs = [15750, 16350, 16950, 17550, 18100];
    wildlifeZs.forEach((z, i) => {
      const xOff = (i % 2 === 0) ? 20.0 : -20.0;
      const t = this.splineRoad.getRoadTransformAtZ(z, xOff, 0);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6), matPost);
      post.position.set(t.pos.x, t.pos.y + 1.75, t.pos.z);
      this.group.add(post);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.1), matYellowSign);
      sign.position.set(t.pos.x, t.pos.y + 3.6, t.pos.z);
      this.group.add(sign);
    });

    // Public Beach Access wooden directional signs every 400m, ocean side
    const beachSignZs = [15900, 16300, 16700, 17100, 17500, 17900];
    beachSignZs.forEach(z => {
      const t = this.splineRoad.getRoadTransformAtZ(z, -20.0, 0);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6), matPost);
      post.position.set(t.pos.x, t.pos.y + 1.3, t.pos.z);
      this.group.add(post);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.75, 0.18), matBrownSign);
      sign.position.set(t.pos.x, t.pos.y + 2.7, t.pos.z);
      this.group.add(sign);
      const arrow = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 0.24), this.matWhiteSign);
      arrow.position.set(t.pos.x, t.pos.y + 2.7, t.pos.z + 0.05);
      this.group.add(arrow);
    });

    // Wooden guardrail posts on cliff/beach side (replacing metal W-beam)
    for (let z = 15700; z < 18100; z += 40) {
      const skipZones = (z > 16540 && z < 16700); // skip Hemlock Street area
      if (skipZones) continue;
      const t = this.splineRoad.getRoadTransformAtZ(z, -18.2, 0);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), matWoodRail);
      post.position.set(t.pos.x, t.pos.y + 0.6, t.pos.z);
      this.group.add(post);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 40.5), matWoodRail);
      rail.position.set(t.pos.x, t.pos.y + 1.1, t.pos.z);
      rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
      this.group.add(rail);
    }
  }

  update(dt) {
    this.animatedObjects.forEach(item => {
      if (item.rotY) item.obj.rotation.y += item.rotY;
    });
  }
}
