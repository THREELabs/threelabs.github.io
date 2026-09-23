import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';

export class BigSurSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.animatedObjects = [];
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Big Sur Materials
    // Cel-Shaded Big Sur Materials with Procedural PBR Textures & Normal Maps
    const cypBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('cypress', 256) : null;
    const cypBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('cypress', 256) : null;
    const cypFoliageDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('cypress', 256) : null;
    const cypFoliageNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('cypress', 256) : null;
    const rockNorm = renderer.textures.mountainRidgeNormalPBR ? renderer.textures.mountainRidgeNormalPBR(512) : null;
    const woodNorm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;
    const stoneNorm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;
    const guardNorm = renderer.textures.guardrailSteelNormalPBR ? renderer.textures.guardrailSteelNormalPBR(256) : null;
    const tinNorm = renderer.textures.corrugatedTinNormalPBR ? renderer.textures.corrugatedTinNormalPBR(256) : null;

    this.matConcrete = renderer.createToonMaterial({ color: 0xd6d8d9, gradientBands: 3, normalMap: stoneNorm });
    this.matConcreteDark = renderer.createToonMaterial({ color: 0x9aa0a6, gradientBands: 2, normalMap: stoneNorm });
    this.matRedwoodWood = renderer.createToonMaterial({ color: 0x5c3620, gradientBands: 2, normalMap: woodNorm });
    this.matDarkTrim = renderer.createToonMaterial({ color: 0x272c33, gradientBands: 2 });

    this.matBasaltCliff = renderer.createToonMaterial({ color: 0x4a4f56, gradientBands: 3, normalMap: rockNorm });
    this.matGraniteRock = renderer.createToonMaterial({ color: 0x6e7680, gradientBands: 3, normalMap: rockNorm });
    this.matSandPurple = renderer.createToonMaterial({ color: 0xc4b2c6, gradientBands: 2 });
    this.matWaterfallWater = new THREE.MeshBasicMaterial({ color: 0xd0efff, transparent: true, opacity: 0.9 });
    this.matWaterfallSpray = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

    this.matLighthouseWhite = renderer.createToonMaterial({ color: 0xf4f6f8, gradientBands: 3, normalMap: stoneNorm });
    this.matLighthouseDome = renderer.createToonMaterial({ color: 0x1f2937, gradientBands: 2 });
    this.matLightBeam = new THREE.MeshBasicMaterial({ color: 0xfffae0, transparent: true, opacity: 0.25, side: THREE.DoubleSide });

    this.matCypressTrunk = renderer.createToonMaterial({ color: 0x786a5c, gradientBands: 2, map: cypBarkDiff, normalMap: cypBarkNorm });
    this.matCypressFoliage = renderer.createToonMaterial({ color: 0x467c55, gradientBands: 3, map: cypFoliageDiff, normalMap: cypFoliageNorm });
    this.matCoastalChaparral = renderer.createToonMaterial({ color: 0x587d52, gradientBands: 2 });
    this.matWildLilac = renderer.createToonMaterial({ color: 0x6b7db3, gradientBands: 2 });

    this.matWoodFence = renderer.createToonMaterial({ color: 0x6d5a47, gradientBands: 2, normalMap: woodNorm });
    this.matGuardrail = renderer.createToonMaterial({ color: 0x8a929e, gradientBands: 3, normalMap: guardNorm });
    this.matSignGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 });
    this.matWhiteSign = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });

    this.matDarkWood = renderer.createToonMaterial({ color: 0x3d2a14, gradientBands: 2, normalMap: woodNorm });
    this.matCraftsmanRoof = renderer.createToonMaterial({ color: 0x2e5c28, gradientBands: 2, normalMap: woodNorm });
    this.matWhiteWash = renderer.createToonMaterial({ color: 0xf0ede4, gradientBands: 2 });
    this.matGravel = renderer.createToonMaterial({ color: 0x9a8a78, gradientBands: 2 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matParkBrown = renderer.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2, normalMap: woodNorm });
    this.matStoneConcrete = renderer.createToonMaterial({ color: 0x9a9590, gradientBands: 3, normalMap: stoneNorm });
    this.matConvexMirror = new THREE.MeshBasicMaterial({ color: 0xd0d8e0 });
    this.matGasPump = renderer.createToonMaterial({ color: 0xcc2222, gradientBands: 2 });
    this.matTinCanopy = renderer.createToonMaterial({ color: 0x8a8580, gradientBands: 2, normalMap: tinNorm });

    this.buildBigSurEnvironment();
  }

  buildBigSurEnvironment() {
    this.buildBigSurRiverInn();
    this.buildMcWayFallsCove();
    this.buildNepentheRestaurant();
    this.buildBixbyCreekBridge();
    this.buildHurricanePointLookout();
    this.buildPfeifferKeyholeArch();
    this.buildPointSurLighthouse();
    this.buildMontereyCypressFlora();
    this.buildCoastalSplitRailFences();
    this.buildBigSurHighwaySignage();
    this.buildBigSurGeneralStoreAndGas();
    this.buildBigSurBakery();
    this.buildNepentheApproachAndDeck();
    this.buildStateParklots();
    this.buildBlindCurveMirrors();
    this.buildHenryMillerLibrary();
  }

  // Driveable Hurricane Point Scenic Overlook Turnout (Z = 7050m)
  buildHurricanePointLookout() {
    const transform = this.splineRoad.getRoadTransformAtZ(7050, -28, 0);
    const lookout = new THREE.Group();
    lookout.position.copy(transform.pos);
    lookout.rotation.y = transform.heading;

    // Driveable Asphalt Overlook Paved Loop
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(28, 55), this.matConcreteDark);
    apron.rotateX(-Math.PI * 0.5);
    apron.position.set(0, 0.05, 0);
    lookout.add(apron);

    // Stone Picnic Tables
    [-8, 8].forEach(tz => {
      const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.8), this.matConcrete);
      table.position.set(-10, 0.45, tz);
      lookout.add(table);
    });

    // Ocean Vista Fence along cliff edge
    const fence = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 54), this.matWoodFence);
    fence.position.set(-13.5, 0.6, 0);
    lookout.add(fence);

    // Iconic Coin-Operated Scenic Dual-Barrel Binoculars Viewfinders
    [-14, 0, 14].forEach(vz => {
      const viewerGroup = new THREE.Group();
      viewerGroup.position.set(-13.2, 0, vz);
      viewerGroup.rotation.y = -Math.PI * 0.5; // Aiming out over the Pacific

      // Cast iron fluted base and post
      const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.2, 10), this.matDarkTrim);
      baseMesh.position.y = 0.1;
      viewerGroup.add(baseMesh);

      const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.35, 8), this.matDarkTrim);
      postMesh.position.y = 0.8;
      viewerGroup.add(postMesh);

      // Swivel yoke and coin housing box
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.25), this.matDarkTrim);
      yoke.position.y = 1.55;
      viewerGroup.add(yoke);

      // Twin optical barrels
      [-0.1, 0.1].forEach(bx => {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 8), this.matConcreteDark);
        barrel.rotateX(Math.PI * 0.5);
        barrel.position.set(bx, 1.62, 0.15);
        viewerGroup.add(barrel);
      });

      lookout.add(viewerGroup);
    });

    this.group.add(lookout);
  }

  // 1. Big Sur River Inn (Z = 5500m)
  buildBigSurRiverInn() {
    const transform = this.splineRoad.getRoadTransformAtZ(5500, 34, 0);
    const inn = new THREE.Group();
    inn.position.copy(transform.pos);
    // Face across road toward oncoming traffic
    inn.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;

    // Authentic Big Sur River Redwood Timber Lodge
    const lodge = this.structureBuilder.buildHistoricLodge({
      width: 26.0,
      depth: 16.0,
      stories: 2,
      colorStone: 0x4a4f56,
      colorTimber: 0x5c3620,
      colorRoof: 0x272c33,
      subterraneanDepth: 4.0
    });
    inn.add(lodge);

    // 2. Big Sur River Channel (Running behind and alongside the inn)
    const riverBed = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 40), this.matGravel);
    riverBed.position.set(0, -0.3, -16);
    inn.add(riverBed);

    const riverWater = new THREE.Mesh(new THREE.PlaneGeometry(15, 38), this.matWaterfallWater);
    riverWater.rotateX(-Math.PI * 0.5);
    riverWater.position.set(0, -0.05, -16);
    inn.add(riverWater);

    // River boulders along the banks
    const boulderGeo = new THREE.DodecahedronGeometry(0.8, 1);
    [-6, -3, 2, 5].forEach((bx, idx) => {
      const rock = new THREE.Mesh(boulderGeo, this.matGraniteRock);
      rock.scale.set(1.4, 0.7, 1.2);
      rock.position.set(bx, 0.1, -16 + (idx % 2 === 0 ? 8 : -8));
      inn.add(rock);
    });

    // 3. World-Famous Big Sur Wooden Adirondack Chairs (sitting directly in the river water)
    const matAdirondack = this.renderer.createToonMaterial({ color: 0x8b5a2b, gradientBands: 2 });
    for (let c = 0; c < 5; c++) {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(-5 + c * 2.5, 0.1, -15);
      chairGroup.rotation.y = Math.PI * 0.1 * (c % 2 === 0 ? 1 : -1);

      // Slanted seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), matAdirondack);
      seat.position.set(0, 0.35, 0);
      seat.rotation.x = -0.15;
      chairGroup.add(seat);

      // Angled fan backrest
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.08), matAdirondack);
      backrest.position.set(0, 0.85, -0.42);
      backrest.rotation.x = -0.35;
      chairGroup.add(backrest);

      // Wide flat armrests
      [-0.52, 0.52].forEach(ax => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.9), matAdirondack);
        arm.position.set(ax, 0.58, -0.05);
        chairGroup.add(arm);

        // Armrest support legs
        const legFront = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), matAdirondack);
        legFront.position.set(ax, 0.28, 0.35);
        chairGroup.add(legFront);

        const legRear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), matAdirondack);
        legRear.position.set(ax, 0.22, -0.38);
        chairGroup.add(legRear);
      });

      inn.add(chairGroup);
    }

    // Overhead string lantern posts along the riverbank
    [-8, 8].forEach(pz => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6), this.matDarkTrim);
      post.position.set(6.5, 2.2, -16 + pz);
      inn.add(post);

      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      lantern.position.set(6.5, 4.2, -16 + pz);
      inn.add(lantern);
    });

    this.group.add(inn);
  }

  // 2. McWay Falls & Pristine Sandy Cove (Z = 5950m)
  buildMcWayFallsCove() {
    const transform = this.splineRoad.getRoadTransformAtZ(5950, -48, 0);
    const mcway = new THREE.Group();
    mcway.position.copy(transform.pos);
    mcway.rotation.y = transform.heading;

    const cliff = new THREE.Mesh(new THREE.BoxGeometry(40, 42, 30), this.matBasaltCliff);
    cliff.position.set(-6, 18, 0);
    cliff.castShadow = true;
    mcway.add(cliff);

    const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 36), this.matWaterfallWater);
    waterfall.position.set(8, 16, 2);
    waterfall.rotation.y = Math.PI * 0.15;
    mcway.add(waterfall);

    this.group.add(mcway);
  }

  // 3. Nepenthe Cliffside Restaurant (Z = 6300m)
  buildNepentheRestaurant() {
    const transform = this.splineRoad.getRoadTransformAtZ(6300, -36, 4);
    const nepenthe = new THREE.Group();
    nepenthe.position.copy(transform.pos);
    // Left side: face across road toward oncoming traffic
    nepenthe.rotation.y = transform.heading + Math.PI * 0.5 + 0.22;


    // Iconic Cliffside Redwood Pavilion Lodge
    const lodge = this.structureBuilder.buildHistoricLodge({
      width: 22.0,
      depth: 14.0,
      stories: 2,
      colorStone: 0x4a4f56,
      colorTimber: 0x5c3620,
      colorRoof: 0x2e5c28,
      subterraneanDepth: 4.5
    });
    nepenthe.add(lodge);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(28, 0.8, 20), this.matRedwoodWood);
    deck.position.set(0, 1.2, -6);
    nepenthe.add(deck);


    this.group.add(nepenthe);
  }

  // 4. Bixby Creek Bridge (Monumental 260ft Arch at Z = 6650m)
  buildBixbyCreekBridge() {
    const transform = this.splineRoad.getRoadTransformAtZ(6650, 0, 0);
    const bixby = new THREE.Group();
    bixby.position.copy(transform.pos);
    bixby.rotation.y = transform.heading;

    const archGeo = new THREE.TorusGeometry(36, 2.8, 8, 20, Math.PI);
    const mainArch = new THREE.Mesh(archGeo, this.matConcrete);
    mainArch.rotation.z = Math.PI;
    mainArch.position.set(0, -14, 0);
    bixby.add(mainArch);

    for (let i = -5; i <= 5; i++) {
      const colHeight = 12 + Math.cos((i / 5) * (Math.PI * 0.5)) * 14;
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.6, colHeight, 1.6), this.matConcrete);
      col.position.set(i * 6.5, -colHeight * 0.5 + 1.0, 0);
      bixby.add(col);
    }

    // Concrete Bridge Railings outside road edges (halfW = 16m, rails at +/-16.4m)
    [-16.4, 16.4].forEach(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 90), this.matConcrete);
      rail.position.set(rx, 1.0, 0);
      bixby.add(rail);
    });

    this.group.add(bixby);
  }

  // 5. Pfeiffer Beach Keyhole Arch (Z = 7300m)
  buildPfeifferKeyholeArch() {
    const transform = this.splineRoad.getRoadTransformAtZ(7300, -56, 0);
    const keyhole = new THREE.Group();
    keyhole.position.copy(transform.pos);
    keyhole.rotation.y = transform.heading;

    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(26, 1), this.matBasaltCliff);
    rock.scale.set(1.4, 2.0, 1.0);
    rock.position.set(0, 22, 0);
    keyhole.add(rock);

    this.group.add(keyhole);
  }

  // 6. Point Sur Historic Lightstation (Z = 7600m)
  buildPointSurLighthouse() {
    const transform = this.splineRoad.getRoadTransformAtZ(7600, -68, 0);
    const lightStation = new THREE.Group();
    lightStation.position.copy(transform.pos);
    lightStation.rotation.y = transform.heading;

    const domeHill = new THREE.Mesh(new THREE.DodecahedronGeometry(36, 1), this.matBasaltCliff);
    domeHill.scale.set(1.5, 1.4, 1.5);
    domeHill.position.set(0, 24, 0);
    lightStation.add(domeHill);

    const house = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 12), this.matLighthouseWhite);
    house.position.set(0, 46, 0);
    lightStation.add(house);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.8, 16, 8), this.matLighthouseWhite);
    tower.position.set(0, 56, 0);
    lightStation.add(tower);

    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3.5, 8), this.matLighthouseDome);
    lantern.position.set(0, 65, 0);
    lightStation.add(lantern);

    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 65, 0);

    const beamCone = new THREE.ConeGeometry(18, 180, 8, 1, true);
    beamCone.rotateX(Math.PI * 0.5);
    beamCone.translate(0, 0, 90);
    const beamMesh = new THREE.Mesh(beamCone, this.matLightBeam);
    beamGroup.add(beamMesh);

    lightStation.add(beamGroup);
    this.animatedObjects.push({ obj: beamGroup, rotY: 0.025 });

    this.group.add(lightStation);
  }

  // 7. Windswept Monterey Cypress Flora (Z = 5220 - 7780m)
  buildMontereyCypressFlora() {
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const treeCount = isMobile ? 65 : 130;
    const zStep = isMobile ? 39.0 : 19.5;
    for (let i = 0; i < treeCount; i++) {
      const z = 5220 + i * zStep + (Math.random() - 0.5) * 8;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (20.0 + Math.random() * 28);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const tree = new THREE.Group();
      tree.position.copy(transform.pos);
      tree.rotation.y = transform.heading;

      const h = 8.0 + Math.random() * 5.0;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, h, 6), this.matCypressTrunk);
      trunk.position.set(0, h * 0.5, 0);
      trunk.rotation.z = side * 0.18;
      tree.add(trunk);

      for (let f = 0; f < 3; f++) {
        const foliage = new THREE.Mesh(new THREE.CylinderGeometry(3.5 - f * 0.6, 4.2 - f * 0.6, 1.2, 7), this.matCypressFoliage);
        foliage.position.set(side * (f * 0.8 + 0.5), h + f * 1.1, 0);
        foliage.scale.set(1.4, 0.6, 1.1);
        tree.add(foliage);
      }

      this.group.add(tree);
    }
  }

  // 8. Coastal Split-Rail Wooden Fences
  buildCoastalSplitRailFences() {
    for (let f = 0; f < 48; f++) {
      const z = 5240 + f * 52;
      const transform = this.splineRoad.getRoadTransformAtZ(z, -18.5, 0);
      const fence = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 40), this.matWoodFence);
      fence.position.set(transform.pos.x, transform.pos.y + 0.55, transform.pos.z);
      fence.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      this.group.add(fence);
    }
  }

  // 9. Big Sur Highway Directional Signage
  buildBigSurHighwaySignage() {
    const signs = [
      { z: 5250, text: 'HWY 1 BIG SUR COAST\nBIXBY ARCH 6 MI' },
      { z: 5900, text: 'MCWAY FALLS\nJULIA PFEIFFER BURNS SP' },
      { z: 6600, text: 'HISTORIC BIXBY CREEK BRIDGE\nELEVATION 280 FT' },
      { z: 7550, text: 'POINT SUR LIGHTSTATION\nHISTORIC SITE' }
    ];

    signs.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, 19.5, 0);
      const signGroup = new THREE.Group();
      signGroup.position.copy(transform.pos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      signGroup.rotateY(Math.PI); // Face oncoming traffic!
      signGroup.rotateY(-0.60); // Angled ~35° inward toward highway lanes for direct sightline

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.matDarkTrim);
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

  // Big Sur General Store & Last Gas Station (Z=5460m, X=+32)
  buildBigSurGeneralStoreAndGas() {
    const transform = this.splineRoad.getRoadTransformAtZ(5460, 32.0, 0);
    const store = new THREE.Group();
    store.position.copy(transform.pos);
    // Face across road toward oncoming traffic
    store.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;

    // Reconstructed rustic craftsman general store
    const storeBuilding = this.structureBuilder.buildHistoricLodge({
      width: 14.0,
      depth: 9.0,
      stories: 2,
      storyHeight: 3.2,
      colorStone: 0x5a5550,
      colorTimber: 0x3d2817,
      colorRoof: 0x2e3d30,
      subterraneanDepth: 3.5
    });
    store.add(storeBuilding);

    // Gas canopy over pump island
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 8), this.matTinCanopy);
    canopy.position.set(0, 5.5, 10);
    store.add(canopy);
    // Canopy posts
    [-7.5, 7.5].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 5.5, 6),
        this.matTinCanopy);
      post.position.set(px, 2.75, 10);
      store.add(post);
    });

    // Two vintage gas pumps
    [-3, 3].forEach(px => {
      const pumpBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.5, 8),
        this.matGasPump);
      pumpBase.position.set(px, 0.75, 10);
      store.add(pumpBase);
      const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.55), this.matGasPump);
      pumpBody.position.set(px, 2.0, 10);
      store.add(pumpBody);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffee88 }));
      globe.position.set(px, 3.2, 10);
      store.add(globe);
    });

    // Gas price sign pylon
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.5, 0.35),
      this.matStoneConcrete);
    pylon.position.set(-10, 3.25, 10);
    store.add(pylon);
    const priceBoard = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.2, 0.28),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    priceBoard.position.set(-10, 6.8, 10);
    store.add(priceBoard);
    const priceNeon = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.35),
      new THREE.MeshBasicMaterial({ color: 0xff4400 }));
    priceNeon.position.set(-10, 7.1, 10.1);
    store.add(priceNeon);

    // "LAST GAS 65 MILES" hand-painted sign
    const lastGasSign = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.6, 0.25),
      this.renderer.createToonMaterial({ color: 0xf5f0e0, gradientBands: 2 }));
    lastGasSign.position.set(0, 7.2, 4.2);
    store.add(lastGasSign);
    const lastGasNeon = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.5, 0.35),
      new THREE.MeshBasicMaterial({ color: 0xff2200 }));
    lastGasNeon.position.set(0, 7.2, 4.3);
    store.add(lastGasNeon);

    // Dirt/gravel apron
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), this.matGravel);
    apron.rotateX(-Math.PI * 0.5);
    apron.position.set(0, 0.04, 6);
    store.add(apron);

    this.group.add(store);
  }

  // Big Sur Bakery — beloved roadside converted station (Z=5520m, X=+30)
  buildBigSurBakery() {
    const transform = this.splineRoad.getRoadTransformAtZ(5520, 30.0, 0);
    const bakery = new THREE.Group();
    bakery.position.copy(transform.pos);
    // Face across road toward oncoming traffic
    bakery.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;

    // Authentic storybook bakery cottage
    const bakeryCottage = this.structureBuilder.buildStorybookCottage({
      width: 10.0,
      depth: 8.0,
      colorStucco: 0xf5ede0,
      colorThatch: 0x4a3220,
      subterraneanDepth: 3.0
    });
    bakery.add(bakeryCottage);



    // Chalk menu board on exterior wall
    const chalkBoard = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.0, 0.2),
      this.renderer.createToonMaterial({ color: 0x1a2a1a, gradientBands: 2 }));
    chalkBoard.position.set(-3, 2.5, 3.6);
    bakery.add(chalkBoard);
    const chalkText = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xf0f0e0 }));
    chalkText.position.set(-3, 2.8, 3.65);
    bakery.add(chalkText);

    // Outdoor wood-slab tables on a small gravel area
    const gravelPad = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), this.matGravel);
    gravelPad.rotateX(-Math.PI * 0.5);
    gravelPad.position.set(6, 0.04, 0);
    bakery.add(gravelPad);

    const tableCol = this.renderer.createToonMaterial({ color: 0x6a5040, gradientBands: 2 });
    [[-3, 3], [3, 3], [8, 3], [-3, -2], [3, -2]].forEach(([tx, tz]) => {
      const tabletop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.9), tableCol);
      tabletop.position.set(tx, 0.88, tz);
      bakery.add(tabletop);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.88, 4), tableCol);
      leg.position.set(tx, 0.44, tz);
      bakery.add(leg);
    });

    this.group.add(bakery);
  }

  // Nepenthe Restaurant — approach sign, elevated deck, Phoenix sculpture (Z=6300m)
  buildNepentheApproachAndDeck() {
    // Road-level sign
    const signT = this.splineRoad.getRoadTransformAtZ(6295, 18.5, 0);
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6),
      this.matDarkWood);
    signPost.position.set(signT.pos.x, signT.pos.y + 1.2, signT.pos.z);
    this.group.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 0.22), this.matDarkWood);
    signBoard.position.set(signT.pos.x, signT.pos.y + 2.65, signT.pos.z);
    this.group.add(signBoard);
    const signText = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.45, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xf5c842 }));
    signText.position.set(signT.pos.x, signT.pos.y + 2.65, signT.pos.z + 0.1);
    this.group.add(signText);

    // Elevated terrace deck platform (at Y += 8)
    const deckT = this.splineRoad.getRoadTransformAtZ(6300, 22, 8);
    const deck = new THREE.Group();
    deck.position.copy(deckT.pos);
    deck.rotation.y = deckT.heading - 0.25;

    const deckFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 14),
      this.renderer.createToonMaterial({ color: 0x6a5040, gradientBands: 2 }));
    deckFloor.rotateX(-Math.PI * 0.5);
    deckFloor.position.set(0, 0.05, 0);
    deck.add(deckFloor);

    // Railing posts every 3m
    for (let rz = -18; rz <= 18; rz += 4) {
      const railPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6),
        this.matDarkWood);
      railPost.position.set(19.5, 0.55, rz);
      deck.add(railPost);
    }
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 40), this.matDarkWood);
    topRail.position.set(19.5, 1.1, 0);
    deck.add(topRail);

    // Phoenix sculpture at center (abstract bronze)
    const phoenixBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.5, 0.8),
      this.renderer.createToonMaterial({ color: 0x8b6914, gradientBands: 3 }));
    phoenixBody.position.set(0, 1.75, 0);
    deck.add(phoenixBody);
    const phoenixWingL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 2.0),
      this.renderer.createToonMaterial({ color: 0x8b6914, gradientBands: 3 }));
    phoenixWingL.position.set(-2.5, 3.5, 0);
    phoenixWingL.rotation.z = 0.35;
    deck.add(phoenixWingL);
    const phoenixWingR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 2.0),
      this.renderer.createToonMaterial({ color: 0x8b6914, gradientBands: 3 }));
    phoenixWingR.position.set(2.5, 3.5, 0);
    phoenixWingR.rotation.z = -0.35;
    deck.add(phoenixWingR);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.2, 8),
      this.matStoneConcrete);
    pedestal.position.set(0, 0.6, 0);
    deck.add(pedestal);

    this.group.add(deck);
  }

  // NPS/State Park Parking Pullouts at McWay Falls, Nepenthe, Pfeiffer Arch (Z=5900, 6280, 7100)
  buildStateParklots() {
    const lotZs = [5900, 6280, 7100];
    const matConcrete = this.renderer.createToonMaterial({ color: 0x909090, gradientBands: 2 });
    const matFeeBox = this.renderer.createToonMaterial({ color: 0x4a4a4a, gradientBands: 2 });

    lotZs.forEach(z => {
      const side = -1; // ocean / cliff side
      const xOff = side * 34.0;
      const transform = this.splineRoad.getRoadTransformAtZ(z, xOff, 0);
      const lot = new THREE.Group();
      lot.position.copy(transform.pos);
      lot.rotation.y = transform.heading;

      // Paved apron
      const apron = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), this.matAsphaltLot);
      apron.rotateX(-Math.PI * 0.5);
      apron.position.set(0, 0.05, 0);
      lot.add(apron);

      // NPS brown sign
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6), this.matParkBrown);
      signPost.position.set(-8, 1.4, -5);
      lot.add(signPost);
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.0, 0.22), this.matParkBrown);
      signBoard.position.set(-8, 2.8, -5);
      lot.add(signBoard);

      // Self-pay fee station
      const feePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), matFeeBox);
      feePipe.position.set(-7, 0.7, 5);
      lot.add(feePipe);
      const feeBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.28), matFeeBox);
      feeBox.position.set(-7, 1.42, 5);
      lot.add(feeBox);

      // Pit toilet building
      const toilet = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 3.0), matConcrete);
      toilet.position.set(7, 1.3, -4);
      lot.add(toilet);

      // 3-rail split-rail fence at cliff edge
      for (let r = -7; r <= 7; r += 5) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), this.matDarkWood);
        post.position.set(r, 0.6, 7);
        lot.add(post);
      }
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 15), this.matDarkWood);
      railTop.position.set(0, 0.95, 7);
      lot.add(railTop);
      const railBot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 15), this.matDarkWood);
      railBot.position.set(0, 0.55, 7);
      lot.add(railBot);

      this.group.add(lot);
    });
  }

  // Convex Safety Mirrors at Big Sur Blind Switchback Curves
  buildBlindCurveMirrors() {
    const mirrorZs = [5640, 6090, 6820, 7180, 7520];
    const matPole = this.renderer.createToonMaterial({ color: 0x7a8080, gradientBands: 2 });

    mirrorZs.forEach(z => {
      const t = this.splineRoad.getRoadTransformAtZ(z, -18.5, 0);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), matPole);
      pole.position.set(t.pos.x, t.pos.y + 1.6, t.pos.z);
      this.group.add(pole);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
        this.matConvexMirror);
      dome.position.set(t.pos.x, t.pos.y + 3.3, t.pos.z);
      dome.rotation.x = Math.PI * 0.5;
      this.group.add(dome);
    });
  }

  // Henry Miller Library — quirky roadside literary landmark (Z=6450m, X=+32)
  buildHenryMillerLibrary() {
    const transform = this.splineRoad.getRoadTransformAtZ(6450, 32.0, 0);
    const library = new THREE.Group();
    library.position.copy(transform.pos);
    // Face across road toward oncoming traffic
    library.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;

    // Rustic Redwood Barn & Literary Cabin with subterranean plinth
    const libraryCabin = this.structureBuilder.buildHistoricBarn({
      width: 14.0,
      depth: 10.0,
      height: 6.2,
      colorWall: 0x4a3220,
      colorRoof: 0x2d3748,
      subterraneanDepth: 3.5
    });
    library.add(libraryCabin);


    // Hand-painted entry gate arch
    const gateL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 0.4),
      this.renderer.createToonMaterial({ color: 0x5c3a1e, gradientBands: 2 }));
    gateL.position.set(-2.5, 2.25, 3.6);
    library.add(gateL);
    const gateR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 0.4),
      this.renderer.createToonMaterial({ color: 0x5c3a1e, gradientBands: 2 }));
    gateR.position.set(2.5, 2.25, 3.6);
    library.add(gateR);
    const gateTop = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.4, 0.4),
      this.renderer.createToonMaterial({ color: 0x5c3a1e, gradientBands: 2 }));
    gateTop.position.set(0, 4.7, 3.6);
    library.add(gateTop);
    const gateSign = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 0.25), this.matWhiteWash);
    gateSign.position.set(0, 4.7, 3.65);
    library.add(gateSign);
    const gateNeon = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.38, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
    gateNeon.position.set(0, 4.7, 3.7);
    library.add(gateNeon);

    // Outdoor picnic area with tables + string lights
    const gravelPad = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), this.matGravel);
    gravelPad.rotateX(-Math.PI * 0.5);
    gravelPad.position.set(0, 0.04, 8);
    library.add(gravelPad);

    const tableCol = this.renderer.createToonMaterial({ color: 0x4a3828, gradientBands: 2 });
    [[-5, 8], [0, 8], [5, 8]].forEach(([tx, tz]) => {
      const tabletop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), tableCol);
      tabletop.position.set(tx, 0.88, tz);
      library.add(tabletop);
    });

    // String light posts
    [-8, 8].forEach(px => {
      const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.5, 6), tableCol);
      lp.position.set(px, 2.25, 8);
      library.add(lp);
    });
    const stringLight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 18),
      new THREE.MeshBasicMaterial({ color: 0xffee88 }));
    stringLight.position.set(0, 4.3, 8);
    library.add(stringLight);

    // Small gravel parking area at road level
    const parkApron = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), this.matGravel);
    parkApron.rotateX(-Math.PI * 0.5);
    parkApron.position.set(0, 0.03, -5);
    library.add(parkApron);

    this.group.add(library);
  }

  update(dt) {
    this.animatedObjects.forEach(item => {
      if (item.rotY) item.obj.rotation.y += item.rotY;
    });
  }
}
