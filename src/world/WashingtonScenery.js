import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';

export class WashingtonSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.animatedObjects = [];
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Washington & Seattle Materials
    // Cel-Shaded Washington & Seattle Materials with Procedural PBR Textures & Normal Maps
    const firBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('pine', 256) : null;
    const firBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('pine', 256) : null;
    const firFoliageDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('conifer', 256) : null;
    const firFoliageNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('conifer', 256) : null;
    const woodNorm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;
    const stoneNorm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;
    const plankLodgeDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('redwood', 256) : null;
    const plankLodgeNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('redwood', 256) : null;

    this.matSpaceNeedleWhite = renderer.createToonMaterial({ color: 0xf5f7fa, gradientBands: 3 });
    this.matNeedleRoofGold = renderer.createToonMaterial({ color: 0xffb74d, gradientBands: 2 });
    this.matNeedleSpire = renderer.createToonMaterial({ color: 0x37474f, gradientBands: 2 });
    this.matMarketBrick = renderer.createToonMaterial({ color: 0x8d493a, gradientBands: 3, normalMap: stoneNorm });
    this.matNeonMarketRed = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.matMarketAwning = renderer.createToonMaterial({ color: 0x2e7d32, gradientBands: 2 });
    this.matFerryWhite = renderer.createToonMaterial({ color: 0xf5f5f5, gradientBands: 3 });
    this.matFerryGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 3 });
    this.matFerryWake = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    this.matLodgeWood = renderer.createToonMaterial({ color: 0x543d2b, gradientBands: 3, map: plankLodgeDiff, normalMap: plankLodgeNorm });
    this.matLodgeRoof = renderer.createToonMaterial({ color: 0x2b3338, gradientBands: 2, normalMap: woodNorm });
    this.matWaterfallWater = new THREE.MeshBasicMaterial({ color: 0xd0efff, transparent: true, opacity: 0.95 });
    this.matFirTrunk = renderer.createToonMaterial({ color: 0x3d3126, gradientBands: 2, map: firBarkDiff, normalMap: firBarkNorm });
    this.matFirFoliage = renderer.createToonMaterial({ color: 0x1b4332, gradientBands: 3, map: firFoliageDiff, normalMap: firFoliageNorm, rimColor: 0x2d6a4f, rimPower: 3.0 });
    // Ethereal Aurora Borealis Materials (Zero-rectangle feathered texture + Additive Glow)
    const auroraGreenTex = renderer.textures.auroraCurtain ? renderer.textures.auroraCurtain('green') : null;
    const auroraVioletTex = renderer.textures.auroraCurtain ? renderer.textures.auroraCurtain('violet') : null;

    this.matAuroraGreen = new THREE.MeshBasicMaterial({
      map: auroraGreenTex,
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matAuroraViolet = new THREE.MeshBasicMaterial({
      map: auroraVioletTex,
      color: 0xd884f8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.matFinishBanner = renderer.createToonMaterial({ color: 0xffeb3b, gradientBands: 2 });
    this.matSignGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 });
    this.matWhiteSign = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });

    this.matSalishGreen = renderer.createToonMaterial({ color: 0x1a3d1e, gradientBands: 2 });
    this.matFerryGray = renderer.createToonMaterial({ color: 0x8a9aaa, gradientBands: 2 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matGumPink = new THREE.MeshBasicMaterial({ color: 0xf06090 });
    this.matGumBlue = new THREE.MeshBasicMaterial({ color: 0x4090f0 });
    this.matGumPurple = new THREE.MeshBasicMaterial({ color: 0xa040d0 });
    this.matGumWhite = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
    this.matStarbucksGreen = renderer.createToonMaterial({ color: 0x00704a, gradientBands: 2 });
    this.matWheelWhite = renderer.createToonMaterial({ color: 0xf0f0f0, gradientBands: 2 });
    this.matSteelDark = renderer.createToonMaterial({ color: 0x2a2e32, gradientBands: 2 });

    this.buildWashingtonEnvironment();
  }

  buildWashingtonEnvironment() {
    this.buildAuroraBorealis();
    this.buildSnoqualmieFallsAndLodge();
    this.buildPugetSoundJumboFerry();
    this.buildSeattleSpaceNeedle();
    this.buildPikePlacePublicMarket();
    this.buildOlympicEvergreenRainforest();
    this.buildOlympicNurseLogAndMossArchway();
    this.buildSalishLodgePorteCochere();
    this.buildPugetFerryTerminal();
    this.buildSeattleGreatWheel();
    this.buildPikePlaceGumWall();
    this.buildFinishLineArch();
    this.buildWashingtonHighwaySignage();
  }

  // 1. Shimmering Ethereal Curved Aurora Borealis in Sky (No Rectangles)
  buildAuroraBorealis() {
    this.auroraRibbons = [];

    // Arc geometry for natural celestial drape
    for (let r = 0; r < 4; r++) {
      const z = 21600 + r * 550;
      const transform = this.splineRoad.getRoadTransformAtZ(z, (r % 2 === 0 ? -40 : 40), 220);
      
      // Curved cylinder segment forming an undulating sky ribbon
      const ribbonGeo = new THREE.CylinderGeometry(480, 520, 95, 32, 4, true, -Math.PI * 0.45, Math.PI * 0.90);
      const ribbonMat = (r % 2 === 0) ? this.matAuroraGreen : this.matAuroraViolet;
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);

      ribbon.position.copy(transform.pos);
      ribbon.rotation.x = Math.PI * 0.08;
      ribbon.rotation.y = transform.heading + (r * 0.15 - 0.22);
      this.group.add(ribbon);

      this.auroraRibbons.push({
        mesh: ribbon,
        baseY: transform.pos.y,
        phase: r * 1.5,
        speed: 0.6 + r * 0.25
      });
    }
  }

  // 2. Snoqualmie Falls & Timber Lodge & Scenic Overlook Turnout (Z = 21450m)
  buildSnoqualmieFallsAndLodge() {
    const transform = this.splineRoad.getRoadTransformAtZ(21450, 48, 0);
    const snoqualmie = new THREE.Group();
    snoqualmie.position.copy(transform.pos);
    snoqualmie.rotation.y = transform.heading - 0.25;

    // Scenic Paved Turnout Deck
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(22, 48), this.renderer.createToonMaterial({ color: 0x334155 }));
    deck.rotateX(-Math.PI * 0.5);
    deck.position.set(0, 0.05, 0);
    snoqualmie.add(deck);

    // Cedar Split-Rail Fence along Overlook
    const fence = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 46), this.matLodgeWood);
    fence.position.set(10.5, 0.6, 0);
    snoqualmie.add(fence);

    // Observation Telescopes
    [-10, 0, 10].forEach(tz => {
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.3, 8), this.matNeedleSpire);
      scope.position.set(10.0, 0.65, tz);
      snoqualmie.add(scope);
    });

    const canyon = new THREE.Mesh(new THREE.BoxGeometry(40, 65, 30), this.matFirTrunk);
    canyon.position.set(24, 32.5, 0);
    canyon.castShadow = true;
    snoqualmie.add(canyon);

    const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(12, 55), this.matWaterfallWater);
    waterfall.position.set(14, 32, 2.2);
    snoqualmie.add(waterfall);

    const lodge = this.structureBuilder.buildHistoricLodge({
      width: 26,
      depth: 18,
      stories: 3,
      colorStone: 0x4a4f56,
      colorTimber: 0x543d2b,
      colorRoof: 0x242b26,
      subterraneanDepth: 4.5
    });
    lodge.position.set(14, 60, -4);
    snoqualmie.add(lodge);


    this.group.add(snoqualmie);
  }

  // 3. Washington State Jumbo Ferry on Puget Sound (Z = 21950m)
  buildPugetSoundJumboFerry() {
    const transform = this.splineRoad.getRoadTransformAtZ(21950, -85, 0);
    const ferry = new THREE.Group();
    ferry.position.set(transform.pos.x, 0.0, transform.pos.z);
    ferry.rotation.y = transform.heading + 0.5;

    const hullLower = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 48), this.matFerryGreen);
    hullLower.position.y = 2.25;
    hullLower.castShadow = true;
    ferry.add(hullLower);

    const superStructure = new THREE.Mesh(new THREE.BoxGeometry(11, 6.5, 36), this.matFerryWhite);
    superStructure.position.y = 7.5;
    superStructure.castShadow = true;
    ferry.add(superStructure);

    this.group.add(ferry);
  }

  // 4. Seattle Space Needle (Z = 22550m)
  buildSeattleSpaceNeedle() {
    const transform = this.splineRoad.getRoadTransformAtZ(22550, -65, 0);
    const needle = new THREE.Group();
    needle.position.copy(transform.pos);
    needle.rotation.y = transform.heading;

    const tripod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 4.5, 95, 6), this.matSpaceNeedleWhite);
    tripod.position.y = 47.5;
    tripod.castShadow = true;
    needle.add(tripod);

    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(16, 8, 5.5, 16), this.matSpaceNeedleWhite);
    saucer.position.y = 96;
    saucer.castShadow = true;
    needle.add(saucer);

    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(14, 1.2, 6, 20), this.matNeedleRoofGold);
    goldRing.position.y = 98.5;
    goldRing.rotation.x = Math.PI * 0.5;
    needle.add(goldRing);

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.6, 28, 6), this.matNeedleSpire);
    spire.position.y = 113;
    needle.add(spire);

    this.group.add(needle);
  }

  // 5. Pike Place Public Market (Z = 23100m)
  buildPikePlacePublicMarket() {
    const transform = this.splineRoad.getRoadTransformAtZ(23100, 36, 0);
    const market = new THREE.Group();
    market.position.copy(transform.pos);
    // Right side: face across highway toward oncoming traffic
    market.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;


    // Authentic Brick Market Arcade with Colonnade, Continuous Glass & Street Clock
    const arcade = this.structureBuilder.buildMarketArcade({
      width: 32.0,
      depth: 18.0,
      stories: 2,
      colorBrick: 0x8d493a,
      colorPillar: 0x1e3f28,
      subterraneanDepth: 4.0
    });
    market.add(arcade);


    // Row of produce-stall awnings along the front
    const awningMat = this.matMarketAwning;
    for (let s = 0; s < 5; s++) {
      const awning = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.6, 12, 1, false, 0, Math.PI), awningMat);
      awning.rotation.z = Math.PI / 2;
      awning.rotation.y = Math.PI / 2;
      awning.position.set(-11 + s * 5.5, 5.2, 9.4);
      awning.castShadow = true;
      market.add(awning);
      // Stall posts
      [-1.8, 1.8].forEach(px => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 5), this.matDarkTrim);
        post.position.set(-11 + s * 5.5 + px * 0, 1.8 + 0.4, 9.4 + 1.55);
        market.add(post);
      });
      // Crates of produce under each awning
      const crateColors = [0xe65100, 0xc62828, 0xf9a825, 0x2e7d32];
      for (let cr = 0; cr < 2; cr++) {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.8, 1.1),
          new THREE.MeshBasicMaterial({ color: crateColors[(s + cr) % crateColors.length] })
        );
        crate.position.set(-11 + s * 5.5 + cr * 1.7 - 0.85, 1.15, 10.6);
        market.add(crate);
      }
    }

    this.group.add(market);
  }

  // 6. Olympic Evergreen Rainforest & Mossy Fallen Logs (Z = 20820 - 23380m)
  buildOlympicEvergreenRainforest() {
    const matMossLog = this.renderer.createToonMaterial({ color: 0x2e4228, gradientBands: 2 });
    const logGeo = new THREE.CylinderGeometry(0.6, 0.9, 12, 6);
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const treeCount = isMobile ? 65 : 130;
    const zStep = isMobile ? 39.0 : 19.5;

    for (let i = 0; i < treeCount; i++) {
      const z = 20820 + i * zStep + (Math.random() - 0.5) * 8;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (20.0 + Math.random() * 28);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const tree = new THREE.Group();
      tree.position.copy(transform.pos);
      tree.rotation.y = transform.heading;

      const h = 18.0 + Math.random() * 8.0;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, h, 6), this.matFirTrunk);
      trunk.position.y = h * 0.5;
      tree.add(trunk);

      for (let y = 6; y <= h + 2; y += 3.8) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(5.5 - (y * 0.16), 5.2, 6), this.matFirFoliage);
        cone.position.y = y;
        cone.castShadow = !isMobile;
        tree.add(cone);
      }

      this.group.add(tree);

      // Mossy fallen logs
      if (Math.random() > 0.65) {
        const log = new THREE.Mesh(logGeo, matMossLog);
        const logLat = side * (18.5 + Math.random() * 10);
        const logTrans = this.splineRoad.getRoadTransformAtZ(z + (Math.random() - 0.5) * 6, logLat, 0.3);
        log.position.copy(logTrans.pos);
        log.rotation.z = Math.PI * 0.5;
        log.rotation.y = (Math.random() - 0.5) * 1.5;
        this.group.add(log);
      }
    }
  }

  // 6b. Hoh Rainforest Ancient Nurse Log & Giant Stilt Root Archway (Z = 22250m, X = -26m)
  buildOlympicNurseLogAndMossArchway() {
    const t = this.splineRoad.getRoadTransformAtZ(22250, -26, 0);
    const archGroup = new THREE.Group();
    archGroup.position.copy(t.pos);
    archGroup.rotation.y = t.heading + 0.25;

    const matMossCedar = this.renderer.createToonMaterial({ color: 0x24331e, gradientBands: 3 });
    const matSproutBark = this.renderer.createToonMaterial({ color: 0x423122, gradientBands: 2 });
    const matFungusShelf = this.renderer.createToonMaterial({ color: 0xc4823f, gradientBands: 2 });
    const matParkSign = this.renderer.createToonMaterial({ color: 0x2b1e14, gradientBands: 2 });

    // 1. Massive Decayed Cedar Nurse Log (Length 24m, Diameter 2.2m)
    const logGeo = new THREE.CylinderGeometry(0.9, 1.3, 24, 12);
    logGeo.rotateX(Math.PI * 0.5);
    const nurseLog = new THREE.Mesh(logGeo, matMossCedar);
    nurseLog.position.set(0, 1.1, 0);
    nurseLog.castShadow = true;
    archGroup.add(nurseLog);

    // Polypore shelf fungus brackets clinging to the side of the nurse log
    [-6, -2, 3, 7].forEach(fz => {
      const shelf = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 8, 1, false, 0, Math.PI), matFungusShelf);
      shelf.rotateZ(-Math.PI * 0.5);
      shelf.position.set(1.15, 1.2, fz);
      archGroup.add(shelf);
    });

    // 2. Three Hemlock Saplings Sprouted Directly Along Top of Nurse Log
    const saplingHeights = [4.5, 7.2, 5.8];
    const saplingZ = [-5.5, 0.5, 6.0];
    saplingHeights.forEach((h, idx) => {
      const sz = saplingZ[idx];
      const saplingTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, h, 6), matSproutBark);
      saplingTrunk.position.set(0, 2.0 + h * 0.5, sz);
      archGroup.add(saplingTrunk);

      // Stilt roots wrapping around nurse log down into forest floor
      [-0.45, 0.45].forEach(rx => {
        const root = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.2, 5), matSproutBark);
        root.position.set(rx, 1.0, sz + rx * 0.5);
        root.rotation.z = rx * 0.6;
        archGroup.add(root);
      });

      // Sapling foliage tiers
      for (let y = 1.5; y <= h; y += 1.4) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4 - y * 0.22, 1.8, 6), this.matFirFoliage);
        cone.position.set(0, 2.0 + y, sz);
        archGroup.add(cone);
      }
    });

    // 3. Stilt Root Cathedral Archway (Arching 4.2m overhead)
    const archTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 14, 8), matSproutBark);
    archTrunk.position.set(-4.5, 8.5, -4.0);
    archGroup.add(archTrunk);

    // Arching stilt roots forming a natural gothic flying buttress
    const rootArch1 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.35, 6, 12, Math.PI * 0.5), matMossCedar);
    rootArch1.rotation.y = Math.PI * 0.3;
    rootArch1.position.set(-3.2, 2.8, -4.0);
    archGroup.add(rootArch1);

    const rootArch2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.3, 6, 12, Math.PI * 0.5), matMossCedar);
    rootArch2.rotation.y = -Math.PI * 0.2;
    rootArch2.position.set(-5.5, 2.6, -4.0);
    archGroup.add(rootArch2);

    // 4. Olympic National Park Rustic Educational Sign
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), matParkSign);
    signPost.position.set(2.8, 1.1, -9.0);
    archGroup.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.1), matParkSign);
    signBoard.position.set(2.8, 1.9, -9.0);
    archGroup.add(signBoard);
    const signText = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x86efac }));
    signText.position.set(2.8, 1.9, -9.0);
    archGroup.add(signText);

    this.group.add(archGroup);
  }

  // 7. Cascade Pass Gateway Arch (Z = 23400m)
  buildFinishLineArch() {
    const transform = this.splineRoad.getRoadTransformAtZ(23400, 0, 0);
    const gatewayArch = new THREE.Group();
    gatewayArch.position.copy(transform.pos);
    gatewayArch.rotation.y = transform.heading;

    // Dual Steel Towers (outside 32m road width: +/-18m)
    [-18, 18].forEach(tx => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.8, 14, 1.8), this.matNeedleSpire);
      tower.position.set(tx, 7, 0);
      tower.castShadow = true;
      gatewayArch.add(tower);
    });

    const banner = new THREE.Mesh(new THREE.BoxGeometry(38, 3.2, 0.4), this.matSignGreen);
    banner.position.y = 12.5;
    gatewayArch.add(banner);

    this.group.add(gatewayArch);
  }

  // 8. Washington Highway Signage
  buildWashingtonHighwaySignage() {
    const signs = [
      { z: 20850, text: 'WASHINGTON STATE & CASCADES\nSEATTLE METRO 30 MI' },
      { z: 21400, text: 'SNOQUALMIE FALLS\nGREAT NORTHERN TIMBER LODGE' },
      { z: 22500, text: 'SEATTLE SPACE NEEDLE\nPUGET SOUND FERRY' },
      { z: 23050, text: 'PIKE PLACE PUBLIC MARKET\nCASCADE PASS 350M AHEAD' }
    ];

    signs.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, 19.5, 0);
      const signGroup = new THREE.Group();
      signGroup.position.copy(transform.pos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      signGroup.rotateY(Math.PI); // Face oncoming traffic!
      signGroup.rotateY(-0.60); // Angled ~35° inward toward highway lanes for direct sightline

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.matNeedleSpire);
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

  // Salish Lodge & Spa — Porte-Cochère, Dark Roof, Parking Lot (Z=21450m, X=+34)
  buildSalishLodgePorteCochere() {
    const cochereT = this.splineRoad.getRoadTransformAtZ(21450, 34, 0);
    const cochere = new THREE.Group();
    cochere.position.copy(cochereT.pos);
    // Right side: face across highway toward oncoming traffic
    cochere.rotation.y = cochereT.heading - Math.PI * 0.5 - 0.22;

    // Covered entry canopy (porte-cochère)
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 7), this.matSalishGreen);
    canopyRoof.position.set(0, 6.5, 0);
    cochere.add(canopyRoof);
    // Timber support posts
    [-7.5, 7.5].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 6.5, 6), this.matLodgeWood);
      post.position.set(px, 3.25, 0);
      cochere.add(post);
    });

    // "SALISH LODGE & SPA" carved wood sign on facade
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6), this.matLodgeWood);
    signPost.position.set(0, 1.25, -3);
    cochere.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(12, 1.8, 0.3), this.matLodgeWood);
    signBoard.position.set(0, 2.8, -3);
    cochere.add(signBoard);
    const signText = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.55, 0.42),
      new THREE.MeshBasicMaterial({ color: 0xf5c842 }));
    signText.position.set(0, 2.8, -2.9);
    cochere.add(signText);

    this.group.add(cochere);

    // Parking lot
    const lotT = this.splineRoad.getRoadTransformAtZ(21455, 34, 0);
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(40, 28), this.matAsphaltLot);
    lot.rotateX(-Math.PI * 0.5);
    lot.position.copy(lotT.pos);
    lot.position.y = 0.04;
    this.group.add(lot);

    // Parking stripes
    const matStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 8; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 5.5), matStripe);
      stripe.rotateX(-Math.PI * 0.5);
      const st = this.splineRoad.getRoadTransformAtZ(21440 + i * 4.5, 32, 0);
      stripe.position.copy(st.pos);
      stripe.position.y = 0.06;
      this.group.add(stripe);
    }

    // Valet stand kiosk at the entry
    const valetT = this.splineRoad.getRoadTransformAtZ(21448, 28, 0);
    const valetKiosk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.8, 1.5), this.matLodgeWood);
    valetKiosk.position.set(valetT.pos.x, valetT.pos.y + 1.4, valetT.pos.z);
    this.group.add(valetKiosk);
    const valetRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.2, 4), this.matSalishGreen);
    valetRoof.position.set(valetT.pos.x, valetT.pos.y + 3.3, valetT.pos.z);
    valetRoof.rotation.y = Math.PI * 0.25;
    this.group.add(valetRoof);
  }

  // Puget Sound Ferry Terminal Building (Z=21950m, X=-36)
  buildPugetFerryTerminal() {
    const transform = this.splineRoad.getRoadTransformAtZ(21950, -36, 0);
    const terminal = new THREE.Group();
    terminal.position.copy(transform.pos);
    // Left side: face across highway toward oncoming traffic
    terminal.rotation.y = transform.heading + Math.PI * 0.5 + 0.22;


    // Main terminal building (WSF green-and-white)
    const termBuilding = this.structureBuilder.buildCommercialBuilding({
      width: 22.0,
      depth: 14.0,
      stories: 2,
      storyHeight: 4.0,
      colorWall: 0xf5f5f5,
      colorTrim: 0x1a5c38,
      subterraneanDepth: 3.5
    });
    terminal.add(termBuilding);


    // "BAINBRIDGE ISLAND FERRY" sign
    const termSign = new THREE.Mesh(new THREE.BoxGeometry(16, 1.8, 0.35),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    termSign.position.set(0, 9.3, 6.2);
    terminal.add(termSign);
    const termSignNeon = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.45),
      new THREE.MeshBasicMaterial({ color: 0x22cc66 }));
    termSignNeon.position.set(0, 9.3, 6.3);
    terminal.add(termSignNeon);

    // Loading apron with yellow lane dividers
    const loadApron = new THREE.Mesh(new THREE.PlaneGeometry(30, 40), this.matAsphaltLot);
    loadApron.rotateX(-Math.PI * 0.5);
    loadApron.position.set(0, 0.04, 22);
    terminal.add(loadApron);

    // Yellow lane divider stripes
    const matYellowLane = new THREE.MeshBasicMaterial({ color: 0xf5c518 });
    [-8, 0, 8].forEach(lx => {
      const divider = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 38), matYellowLane);
      divider.rotateX(-Math.PI * 0.5);
      divider.position.set(lx, 0.06, 22);
      terminal.add(divider);
    });

    // Overhead waiting canopy (flat roof on 4 tall posts)
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 14), this.matFerryGray);
    canopyRoof.position.set(0, 6, 22);
    terminal.add(canopyRoof);
    [[-12, 16], [-12, 28], [12, 16], [12, 28]].forEach(([cx, cz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 6), this.matSteelDark);
      post.position.set(cx, 3, cz);
      terminal.add(post);
    });

    // Ticket booth kiosk at the lane entrance
    const booth = new THREE.Mesh(new THREE.BoxGeometry(3, 4.5, 2.5), this.matFerryGreen);
    booth.position.set(-12, 2.25, 3);
    terminal.add(booth);
    const boothRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 3), this.matFerryGreen);
    boothRoof.position.set(-12, 4.65, 3);
    terminal.add(boothRoof);
    const boothWindow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x88ccee, transparent: true, opacity: 0.8 }));
    boothWindow.position.set(-12, 2.8, 1.36);
    terminal.add(boothWindow);

    this.group.add(terminal);
  }

  // Seattle Great Wheel — Iconic Ferris Wheel at the Waterfront (Z=22560m, X=-48)
  buildSeattleGreatWheel() {
    const transform = this.splineRoad.getRoadTransformAtZ(22560, -48, 0);
    const wheelGroup = new THREE.Group();
    wheelGroup.position.copy(transform.pos);
    wheelGroup.rotation.y = transform.heading;

    // Pier platform
    const pier = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), this.matWheelWhite);
    pier.rotateX(-Math.PI * 0.5);
    pier.position.set(0, 0.08, 0);
    wheelGroup.add(pier);

    // Wheel rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(18, 1.4, 12, 40), this.matWheelWhite);
    rim.position.set(0, 20, 0);
    rim.rotation.x = Math.PI * 0.5;
    wheelGroup.add(rim);

    // Inner structural ring
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(14, 0.6, 8, 32),
      this.renderer.createToonMaterial({ color: 0xd0d4da, gradientBands: 2 }));
    innerRim.position.set(0, 20, 0);
    innerRim.rotation.x = Math.PI * 0.5;
    wheelGroup.add(innerRim);

    // Hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.0, 10),
      this.renderer.createToonMaterial({ color: 0x4a4a5a, gradientBands: 2 }));
    hub.position.set(0, 20, 0);
    wheelGroup.add(hub);

    // Spokes
    for (let s = 0; s < 12; s++) {
      const angle = (s / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.3, 18, 0.3),
        this.renderer.createToonMaterial({ color: 0xb0b8c0, gradientBands: 2 }));
      spoke.position.set(
        Math.cos(angle) * 9,
        20 + Math.sin(angle) * 9,
        0
      );
      spoke.rotation.z = angle;
      wheelGroup.add(spoke);
    }

    // 6 gondola cars
    const gondolaMat = new THREE.MeshBasicMaterial({ color: 0xee2244 });
    for (let g = 0; g < 6; g++) {
      const angle = (g / 6) * Math.PI * 2;
      const gondola = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 1.8), gondolaMat);
      gondola.position.set(
        Math.cos(angle) * 17.5,
        20 + Math.sin(angle) * 17.5,
        0
      );
      wheelGroup.add(gondola);
    }

    // Support pylons
    [-6, 6].forEach(px => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.2, 8, 2.2), this.matSteelDark);
      pylon.position.set(px, 4, 0);
      wheelGroup.add(pylon);
    });

    this.group.add(wheelGroup);

    // Add to animated objects for slow rotation
    if (!this.animatedObjects) this.animatedObjects = [];
    this.animatedObjects.push({ obj: rim, rotZ: 0.004 });
    this.animatedObjects.push({ obj: innerRim, rotZ: 0.004 });
  }

  // Pike Place Market Post Alley with Gum Wall + Starbucks Reserve Roastery (Z=23100m)
  buildPikePlaceGumWall() {
    const transform = this.splineRoad.getRoadTransformAtZ(23100, 36, 0);
    const alley = new THREE.Group();
    alley.position.copy(transform.pos);
    alley.rotation.y = transform.heading - 0.25;

    // Post Alley floor (narrow, between brick buildings)
    const alleyFloor = new THREE.Mesh(new THREE.PlaneGeometry(5, 30),
      this.renderer.createToonMaterial({ color: 0x4a4040, gradientBands: 2 }));
    alleyFloor.rotateX(-Math.PI * 0.5);
    alleyFloor.position.set(-8, 0.05, 5);
    alley.add(alleyFloor);

    // The GUM WALL — one brick wall face covered in multicolored gum
    const wallBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 28),
      this.matMarketBrick);
    wallBase.position.set(-10, 2.5, 5);
    alley.add(wallBase);

    // ~60 gum blobs in multicolored MeshBasicMaterial
    const gumMats = [this.matGumPink, this.matGumBlue, this.matGumPurple, this.matGumWhite,
      new THREE.MeshBasicMaterial({ color: 0xff8800 }),
      new THREE.MeshBasicMaterial({ color: 0x44ff44 }),
    ];
    const gumGeo = new THREE.SphereGeometry(0.12, 4, 4);
    for (let g = 0; g < 60; g++) {
      const gum = new THREE.Mesh(gumGeo, gumMats[g % gumMats.length]);
      gum.position.set(
        -9.8,
        0.5 + Math.random() * 4.5,
        -9 + g * 0.5 + (Math.random() - 0.5) * 0.3
      );
      gum.scale.set(
        0.8 + Math.random() * 1.4,
        0.5 + Math.random() * 0.8,
        0.6 + Math.random() * 1.2
      );
      alley.add(gum);
    }

    // Starbucks Reserve Roastery nearby facade
    const sbBody = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 10), this.matStarbucksGreen);
    sbBody.position.set(12, 5, -10);
    sbBody.castShadow = true;
    alley.add(sbBody);
    const sbRoof = new THREE.Mesh(new THREE.BoxGeometry(17, 0.5, 11),
      this.renderer.createToonMaterial({ color: 0x1a2a1a, gradientBands: 2 }));
    sbRoof.position.set(12, 10.25, -10);
    alley.add(sbRoof);
    // Copper accent band (Roastery signature)
    const sbBand = new THREE.Mesh(new THREE.BoxGeometry(16.5, 2, 0.3),
      this.renderer.createToonMaterial({ color: 0xb87333, gradientBands: 2 }));
    sbBand.position.set(12, 6.5, -4.85);
    alley.add(sbBand);
    const sbSign = new THREE.Mesh(new THREE.BoxGeometry(13, 0.8, 0.45),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    sbSign.position.set(12, 9.0, -4.8);
    alley.add(sbSign);

    // Produce stalls spilling into the street from the main market building
    const produceColors = [0xff6633, 0xffcc00, 0x22aa44, 0xcc3333, 0xff9933, 0x6633cc];
    for (let pc = 0; pc < 8; pc++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.2),
        new THREE.MeshBasicMaterial({ color: produceColors[pc % produceColors.length] }));
      crate.position.set(2 + pc * 3.5, 0.6, 12);
      alley.add(crate);
      // Stall post
      const stallPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 5),
        this.renderer.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2 }));
      stallPost.position.set(3 + pc * 3.5, 1.75, 13.5);
      alley.add(stallPost);
    }

    this.group.add(alley);
  }

  update(dt) {
    if (this.animatedObjects) {
      this.animatedObjects.forEach(item => {
        if (item.rotZ) item.obj.rotation.z += item.rotZ;
        if (item.rotY) item.obj.rotation.y += item.rotY;
      });
    }

    // Only fade in Aurora Borealis when player enters Washington / Seattle zone (Z >= 20800m)
    let targetOpacity = 0.0;
    if (window.game && window.game.physics) {
      const vZ = window.game.physics.position.z;
      if (vZ >= 20800) {
        targetOpacity = Math.min(0.48, (vZ - 20800) / 800 * 0.48);
      }
    }

    if (this.matAuroraGreen) {
      this.matAuroraGreen.opacity = THREE.MathUtils.lerp(this.matAuroraGreen.opacity, targetOpacity, dt * 2.0);
    }
    if (this.matAuroraViolet) {
      this.matAuroraViolet.opacity = THREE.MathUtils.lerp(this.matAuroraViolet.opacity, targetOpacity * 0.85, dt * 2.0);
    }

    if (this.auroraRibbons) {
      this.auroraRibbons.forEach(r => {
        r.phase += r.speed * dt;
        r.mesh.position.y = r.baseY + Math.sin(r.phase) * 12;
        r.mesh.rotation.z = Math.sin(r.phase * 0.7) * 0.06;
      });
    }
  }
}
