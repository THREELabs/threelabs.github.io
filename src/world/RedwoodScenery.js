import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';

export class RedwoodSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Redwood Forest Materials with Procedural PBR & Normal Maps
    const rwBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('redwood', 256) : null;
    const rwBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('redwood', 256) : null;
    const rwFoliageDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('redwood', 256) : null;
    const rwFoliageNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('redwood', 256) : null;
    const plankRedwoodDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('redwood', 256) : null;
    const plankRedwoodNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('redwood', 256) : null;
    const plankBarnDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('barn_red', 256) : null;
    const plankBarnNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('barn_red', 256) : null;
    const woodNorm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;
    const stoneNorm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;

    this.matRedwoodBark = renderer.createToonMaterial({ color: 0x6e3b22, gradientBands: 3, map: rwBarkDiff, normalMap: rwBarkNorm });
    this.matRedwoodFoliage = renderer.createToonMaterial({ color: 0x1e5230, gradientBands: 3, map: rwFoliageDiff, normalMap: rwFoliageNorm });
    this.matTunnelWood = renderer.createToonMaterial({ color: 0x3b2014, gradientBands: 2, map: rwBarkDiff, normalMap: rwBarkNorm });
    this.matCarsonGreen = renderer.createToonMaterial({ color: 0x375e4e, gradientBands: 3 });
    this.matCarsonGold = renderer.createToonMaterial({ color: 0xc89d5c, gradientBands: 2 });
    this.matCarsonRoof = renderer.createToonMaterial({ color: 0x242d32, gradientBands: 2, normalMap: woodNorm });
    this.matBigfootFur = renderer.createToonMaterial({ color: 0x4a321f, gradientBands: 3 });
    this.matBigfootLodge = renderer.createToonMaterial({ color: 0x7c4e2a, gradientBands: 2, map: plankRedwoodDiff, normalMap: plankRedwoodNorm });
    this.matNeonFootprint = new THREE.MeshBasicMaterial({ color: 0x76ff03 });
    this.matCoveredBridge = renderer.createToonMaterial({ color: 0x99241e, gradientBands: 3, map: plankBarnDiff, normalMap: plankBarnNorm });
    this.matBridgeRoof = renderer.createToonMaterial({ color: 0x3d3530, gradientBands: 2, normalMap: woodNorm });
    this.matSteamDonkey = renderer.createToonMaterial({ color: 0x37474f, gradientBands: 2 });
    this.matSwordFern = renderer.createToonMaterial({ color: 0x2e7d32, gradientBands: 2, map: rwFoliageDiff, normalMap: rwFoliageNorm });

    this.matSignGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 });
    this.matWhiteSign = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    this.matGodRay = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.matBrickRed = renderer.createToonMaterial({ color: 0x8b3a2e, gradientBands: 3, normalMap: stoneNorm });
    this.matBrickCream = renderer.createToonMaterial({ color: 0xf0ede0, gradientBands: 2, normalMap: stoneNorm });
    this.matHalfTimber = renderer.createToonMaterial({ color: 0x2a1e10, gradientBands: 2, normalMap: woodNorm });
    this.matVictNavy = renderer.createToonMaterial({ color: 0x1e3060, gradientBands: 2 });
    this.matVictGold = renderer.createToonMaterial({ color: 0xb8860b, gradientBands: 2 });
    this.matVictSage = renderer.createToonMaterial({ color: 0x4a6a4a, gradientBands: 2 });
    this.matVictPeach = renderer.createToonMaterial({ color: 0xf5a87a, gradientBands: 2 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matIronLamp = renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 });
    this.matTankerSilver = renderer.createToonMaterial({ color: 0xb0b8b8, gradientBands: 2 });

    this.buildRedwoodEnvironment();
  }

  buildRedwoodEnvironment() {
    this.buildAvenueOfGiantsTrees();
    this.buildCanopyGodRays();
    this.buildChandelierDriveThruTree();
    this.buildFallenRedwoodLogTunnelAndRoots();
    this.buildRedwoodAutoCare();
    this.buildCarsonMansion();
    this.buildLegendOfBigfootMuseum();
    this.buildHistoricCoveredBridge();
    this.buildLoggingSawmillCamp();
    this.buildForestFloorFerns();
    this.buildEurekaOldTownStrip();
    this.buildFerndaleMansions();
    this.buildBigfootMerchandiseFront();
    this.buildRedwoodHighwaySignage();
  }

  // Volumetric Sun Shafts / God Rays filtering through the cathedral redwood canopy
  buildCanopyGodRays() {
    const rayGeo = new THREE.CylinderGeometry(0.8, 12.0, 75, 8, 1, true);

    for (let z = 13050; z < 15550; z += 160) {
      const transform = this.splineRoad.getRoadTransformAtZ(z, (Math.random() - 0.5) * 16, 0);
      const ray = new THREE.Mesh(rayGeo, this.matGodRay);
      ray.position.set(transform.pos.x + 8, transform.pos.y + 37.5, transform.pos.z);
      ray.rotation.z = Math.PI * 0.12;
      ray.rotation.x = Math.PI * 0.08;
      this.group.add(ray);
    }
  }

  // 1. Avenue of the Giants: Towering 300ft Ancient Coast Redwoods
  buildAvenueOfGiantsTrees() {
    const trunkGeo = new THREE.CylinderGeometry(3.5, 6.0, 85, 10);
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const treeCount = isMobile ? 75 : 150;
    const zStep = isMobile ? 34.0 : 17.0;

    for (let i = 0; i < treeCount; i++) {
      const z = 13020 + i * zStep + (Math.random() - 0.5) * 8;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (26.0 + Math.random() * 32); // OUTSIDE THE 16M ROAD WIDTH!
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const tree = new THREE.Group();
      tree.position.copy(transform.pos);
      tree.rotation.y = transform.heading;

      const hScale = 0.9 + Math.random() * 0.45;
      const trunk = new THREE.Mesh(trunkGeo, this.matRedwoodBark);
      trunk.position.y = 42.5 * hScale;
      trunk.scale.set(1, hScale, 1);
      trunk.castShadow = !isMobile;
      tree.add(trunk);

      for (let y = 35; y <= 85; y += 12) {
        const branch = new THREE.Mesh(new THREE.ConeGeometry(8.5 - (y * 0.08), 14, 8), this.matRedwoodFoliage);
        branch.position.y = y * hScale;
        branch.scale.set(1.0, 0.8, 1.0);
        branch.castShadow = !isMobile;
        tree.add(branch);
      }

      this.group.add(tree);
    }
  }

  // 2. Chandelier Drive-Thru Redwood (Z = 13900m)
  buildChandelierDriveThruTree() {
    const transform = this.splineRoad.getRoadTransformAtZ(13900, 30, 0);
    const tree = new THREE.Group();
    tree.position.copy(transform.pos);
    tree.rotation.y = transform.heading;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 9.5, 90, 12), this.matRedwoodBark);
    trunk.position.y = 45;
    trunk.castShadow = true;
    tree.add(trunk);

    const tunnel = new THREE.Mesh(new THREE.BoxGeometry(8.5, 6.5, 14), this.matTunnelWood);
    tunnel.position.set(0, 3.25, 0);
    tree.add(tunnel);

    this.group.add(tree);
  }

  // 2a. Fallen Redwood Giant, Walk-Through Hollow Log & Upturned Root Disc (Z = 13620m, X = -30m)
  buildFallenRedwoodLogTunnelAndRoots() {
    const t = this.splineRoad.getRoadTransformAtZ(13620, -30, 0);
    const fallenGroup = new THREE.Group();
    fallenGroup.position.copy(t.pos);
    fallenGroup.rotation.y = t.heading + 0.18;

    const matMossyBark = this.renderer.createToonMaterial({ color: 0x3d281a, gradientBands: 3 });
    const matRootCore = this.renderer.createToonMaterial({ color: 0x24170e, gradientBands: 2 });
    const matMossCap = this.renderer.createToonMaterial({ color: 0x2e4c22, gradientBands: 2 });
    const matTrailWood = this.renderer.createToonMaterial({ color: 0x6e5239, gradientBands: 2 });
    const matParkSign = this.renderer.createToonMaterial({ color: 0x422e1b, gradientBands: 2 });

    // 1. Massive Upturned Root Disc (11m diameter vertical root fan)
    const rootDisc = new THREE.Group();
    rootDisc.position.set(0, 5.2, -18);

    const rootBacking = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 1.8, 12), matRootCore);
    rootBacking.rotateX(Math.PI * 0.5);
    rootDisc.add(rootBacking);

    // Gnarled radiating root buttresses
    for (let a = 0; a < 10; a++) {
      const angle = (a / 10) * Math.PI * 2;
      const rootArm = new THREE.Mesh(new THREE.ConeGeometry(0.85, 5.6, 6), matMossyBark);
      rootArm.position.set(Math.cos(angle) * 3.6, Math.sin(angle) * 3.6, -0.4);
      rootArm.rotation.z = angle - Math.PI * 0.5;
      rootDisc.add(rootArm);
    }
    fallenGroup.add(rootDisc);

    // 2. Colossal Fallen Horizontal Trunk (Length 34m, Radius 2.7m)
    const logGeo = new THREE.CylinderGeometry(2.1, 2.8, 34, 14);
    logGeo.rotateX(Math.PI * 0.5);
    const trunk = new THREE.Mesh(logGeo, matMossyBark);
    trunk.position.set(0, 2.7, 0);
    trunk.castShadow = true;
    fallenGroup.add(trunk);

    // Moss carpet on top spine of log
    const mossSpine = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 32), matMossCap);
    mossSpine.position.set(0, 5.2, 0);
    fallenGroup.add(mossSpine);

    // 3. Carved Walk-Through Tunnel Section (at center of trunk z = 0)
    const tunnelVoid = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 7.5), this.matTunnelWood);
    tunnelVoid.position.set(0, 2.0, 0);
    fallenGroup.add(tunnelVoid);

    // Raised wooden trail boardwalk leading through tunnel
    const boardwalk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 18), matTrailWood);
    boardwalk.position.set(0, 0.35, 0);
    fallenGroup.add(boardwalk);

    // Timber handrails on boardwalk
    [-1.15, 1.15].forEach(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 18), matTrailWood);
      rail.position.set(rx, 1.25, 0);
      fallenGroup.add(rail);
      for (let pz = -8; pz <= 8; pz += 4) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.12), matTrailWood);
        post.position.set(rx, 0.8, pz);
        fallenGroup.add(post);
      }
    });

    // 4. State Park Interpretive Trail Sign
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), matParkSign);
    signPost.position.set(3.5, 1.2, 7.5);
    fallenGroup.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 0.12), matParkSign);
    signBoard.position.set(3.5, 2.1, 7.5);
    fallenGroup.add(signBoard);
    const signText = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    signText.position.set(3.5, 2.2, 7.5);
    fallenGroup.add(signText);

    this.group.add(fallenGroup);
  }

  // 2b. Redwood Creek Auto Care & Service Bay (Z = 14200m)
  buildRedwoodAutoCare() {
    const shopGroup = new THREE.Group();
    const trans = this.splineRoad.getRoadTransformAtZ(14200, 32, 0);
    if (!trans) return;
    shopGroup.position.copy(trans.pos);
    shopGroup.rotation.y = trans.heading - Math.PI * 0.45;

    // Driveway Apron
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), this.renderer.createToonMaterial({ color: 0x22262a }));
    apron.rotation.x = -Math.PI * 0.5;
    apron.position.set(0, 0.04, 6);
    shopGroup.add(apron);

    // Yellow Hazard Service Pad
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 11), this.renderer.createToonMaterial({ color: 0x334155 }));
    pad.rotation.x = -Math.PI * 0.5;
    pad.position.set(-4.0, 0.06, 7);
    shopGroup.add(pad);

    const matYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let s = -4; s <= 4; s++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 6.8), matYellow);
      stripe.rotation.x = -Math.PI * 0.5;
      stripe.rotation.z = Math.PI * 0.25;
      stripe.position.set(-4.0, 0.08, 7 + s * 1.1);
      shopGroup.add(stripe);
    }

    // Heavy-Duty 2-Post Shop Lift
    const liftGroup = new THREE.Group();
    liftGroup.position.set(-4.0, 0, 7);
    [-2.2, 2.2].forEach(lx => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 0.45), this.matSteamDonkey);
      post.position.set(lx, 2.1, 0);
      liftGroup.add(post);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.22), matYellow);
      arm.position.set(lx > 0 ? lx - 0.7 : lx + 0.7, 0.85, 0);
      liftGroup.add(arm);
    });
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.35), this.matSteamDonkey);
    crossBeam.position.set(0, 4.2, 0);
    liftGroup.add(crossBeam);
    shopGroup.add(liftGroup);

    // Rustic Cedar Log Workshop Building
    const building = new THREE.Mesh(new THREE.BoxGeometry(22, 6.5, 14), this.matBigfootLodge);
    building.position.set(0, 3.25, -5.5);
    building.castShadow = true;
    shopGroup.add(building);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(23.5, 0.8, 15.5), this.matBridgeRoof);
    roof.position.set(0, 6.7, -5.5);
    shopGroup.add(roof);

    // Neon Sign: "REDWOOD CREEK AUTO CARE"
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.5), this.matSteamDonkey);
    signBoard.position.set(0, 8.2, -5.0);
    shopGroup.add(signBoard);

    const signNeon = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.7), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
    signNeon.position.set(0, 8.2, -5.0);
    shopGroup.add(signNeon);

    this.group.add(shopGroup);
  }

  // 3. Carson Mansion (Eureka) (Z = 14400m)
  buildCarsonMansion() {
    const transform = this.splineRoad.getRoadTransformAtZ(14400, 38, 0);
    const mansion = this.structureBuilder.buildVictorianManor({
      width: 24.0,
      depth: 18.0,
      colorBody: 0x375e4e,
      colorTrim: 0xf2ebe1,
      colorAccent: 0xc89d5c,
      colorRoof: 0x242d32,
      subterraneanDepth: 4.5
    });
    mansion.position.copy(transform.pos);
    // Right side: face front entrance veranda and 4-story turret across road toward oncoming traffic
    mansion.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;

    this.group.add(mansion);
  }

  // 4. Legend of Bigfoot Curiosity Museum (Z = 14850m)
  buildLegendOfBigfootMuseum() {
    const transform = this.splineRoad.getRoadTransformAtZ(14850, -36, 0);
    const museumGroup = new THREE.Group();
    museumGroup.position.copy(transform.pos);
    // Left side: face across road toward oncoming traffic
    museumGroup.rotation.y = transform.heading + Math.PI * 0.5 + 0.22;


    // Authentic Heavy Timber Lodge
    const lodge = this.structureBuilder.buildHistoricLodge({
      width: 22.0,
      depth: 16.0,
      stories: 2,
      colorStone: 0x4a433d,
      colorTimber: 0x7c4e2a,
      colorRoof: 0x3d3530,
      subterraneanDepth: 3.5
    });
    museumGroup.add(lodge);

    // 18-Foot Carved Redwood Sasquatch Statue in front of lodge
    const sasquatch = new THREE.Group();
    sasquatch.position.set(10, 0, 10);

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.0, 1.8), this.matBigfootFur);
    body.position.y = 5.0;
    body.castShadow = true;
    sasquatch.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), this.matBigfootFur);
    head.position.set(0, 8.8, 0);
    sasquatch.add(head);

    museumGroup.add(sasquatch);
    this.group.add(museumGroup);
  }


  // 5. Covered Bridge Enclosure (Z = 13500m)
  buildHistoricCoveredBridge() {
    const transform = this.splineRoad.getRoadTransformAtZ(13500, 0, 0);
    const bridge = new THREE.Group();
    bridge.position.copy(transform.pos);
    bridge.rotation.y = transform.heading;

    // Red timber walls on outside of road (halfW = 16m, walls safely at +/-18.5m)
    const wallsL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.0, 42), this.matCoveredBridge);
    wallsL.position.set(-18.5, 3.0, 0);
    bridge.add(wallsL);

    const wallsR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.0, 42), this.matCoveredBridge);
    wallsR.position.set(18.5, 3.0, 0);
    bridge.add(wallsR);

    // High Shingle Roof over road
    const roof = new THREE.Mesh(new THREE.ConeGeometry(28, 5.0, 4), this.matBridgeRoof);
    roof.position.set(0, 9.5, 0);
    roof.rotation.y = Math.PI * 0.25;
    roof.scale.set(1.1, 1.0, 3.4);
    bridge.add(roof);

    this.group.add(bridge);
  }

  // 6. Redwood Logging Camp (Z = 15300m)
  buildLoggingSawmillCamp() {
    const transform = this.splineRoad.getRoadTransformAtZ(15300, 34, 0);
    const camp = new THREE.Group();
    camp.position.copy(transform.pos);
    camp.rotation.y = transform.heading - 0.25;

    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.5, 8), this.matSteamDonkey);
    boiler.position.set(0, 2.25, 0);
    camp.add(boiler);

    this.group.add(camp);
  }

  // 7. Forest Floor Sword Ferns (Z = 13020 - 15580m)
  buildForestFloorFerns() {
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const fernCount = isMobile ? 80 : 180;
    for (let f = 0; f < fernCount; f++) {
      const z = 13020 + Math.random() * 2540;
      const side = (Math.random() > 0.5 ? 1 : -1);
      const latOffset = side * (19.0 + Math.random() * 32);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0.4);

      const fern = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 7), this.matSwordFern);
      fern.position.copy(transform.pos);
      fern.rotation.x = Math.PI;
      fern.scale.set(1.4, 0.6, 1.4);
      this.group.add(fern);
    }
  }

  // 8. Redwood Highway Signage
  buildRedwoodHighwaySignage() {
    const signs = [
      { z: 13050, text: 'AVENUE OF THE GIANTS\nHUMBOLDT REDWOODS STATE PARK' },
      { z: 13850, text: 'CHANDELIER DRIVE-THRU TREE\nFAMOUS LIVING REDWOOD' },
      { z: 14350, text: 'HISTORIC EUREKA\nCARSON MANSION 1884' },
      { z: 14800, text: 'LEGEND OF BIGFOOT\nROADSIDE CURIOSITY MUSEUM' }
    ];

    signs.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, 19.5, 0);
      const signGroup = new THREE.Group();
      signGroup.position.copy(transform.pos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      signGroup.rotateY(Math.PI); // Face oncoming traffic!
      signGroup.rotateY(-0.60); // Angled ~35° inward toward highway lanes for direct sightline

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.matSteamDonkey);
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

  // Old Town Eureka Victorian Commercial Strip (Z=14300–14450m, X=+34)
  buildEurekaOldTownStrip() {
    const units = [
      { z: 14308, xOff: 34, w: 10, colMain: 0x8b3a2e, label: 'LOST COAST BREWERY', neonCol: 0xf97316, isMural: true },
      { z: 14330, xOff: 34, w: 10, colMain: 0x9a4030, label: 'EUREKA GENERAL', neonCol: 0xf5c518, isMural: false },
      { z: 14352, xOff: 34, w: 10, colMain: 0x8b3a2e, label: 'BOOKS & CO.', neonCol: 0xffffff, isMural: false },
      { z: 14374, xOff: 34, w: 10, colMain: 0x993830, label: 'OLD TOWN CAFE', neonCol: 0x86efac, isMural: false },
      { z: 14400, xOff: 34, w: 14, colMain: 0x7a3028, label: 'EUREKA INN', neonCol: 0xf5c842, isMural: false, isInn: true },
    ];

    units.forEach(u => {
      const transform = this.splineRoad.getRoadTransformAtZ(u.z, u.xOff, 0);
      const bldg = new THREE.Group();
      bldg.position.copy(transform.pos);
      bldg.rotation.y = transform.heading - 0.25;

      // 2-story brick building body
      const body = new THREE.Mesh(new THREE.BoxGeometry(u.w, u.isInn ? 18 : 9, 10), this.matBrickRed);
      body.position.y = u.isInn ? 9 : 4.5;
      body.castShadow = true;
      bldg.add(body);

      // Ornate cast-iron ground floor columns (Victorian commercial)
      for (let px = -(u.w * 0.5 - 1.5); px <= u.w * 0.5 - 1.5; px += u.w * 0.33) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 4, 8),
          this.renderer.createToonMaterial({ color: 0x2a2e30, gradientBands: 2 }));
        column.position.set(px, 2, 5.1);
        bldg.add(column);
      }

      // Bay window projections on upper floor
      if (!u.isInn) {
        const bayWin = new THREE.Mesh(new THREE.BoxGeometry(u.w * 0.55, 3.5, 1.5),
          new THREE.MeshBasicMaterial({ color: 0x7ab8cc, transparent: true, opacity: 0.65 }));
        bayWin.position.set(0, 6.8, 5.8);
        bldg.add(bayWin);
        const bayFrame = new THREE.Mesh(new THREE.BoxGeometry(u.w * 0.6, 3.7, 0.25), this.matBrickCream);
        bayFrame.position.set(0, 6.8, 5.65);
        bldg.add(bayFrame);
      }

      // Eureka Inn: Tudor Revival half-timbered facade
      if (u.isInn) {
        for (let ty = 3; ty <= 16; ty += 4) {
          const timber = new THREE.Mesh(new THREE.BoxGeometry(u.w + 0.5, 0.4, 0.5), this.matHalfTimber);
          timber.position.set(0, ty, 5.2);
          bldg.add(timber);
        }
        for (let tx = -5; tx <= 5; tx += 5) {
          const vTimber = new THREE.Mesh(new THREE.BoxGeometry(0.4, 16, 0.5), this.matHalfTimber);
          vTimber.position.set(tx, 9, 5.2);
          bldg.add(vTimber);
        }
        // Carved stone eagle over entrance
        const eagle = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0),
          this.renderer.createToonMaterial({ color: 0x8a8878, gradientBands: 2 }));
        eagle.scale.set(1.6, 0.8, 0.6);
        eagle.position.set(0, 19, 5.1);
        bldg.add(eagle);
      }

      // Lost Coast Brewery mural on the end wall
      if (u.isMural) {
        const mural = new THREE.Mesh(new THREE.BoxGeometry(u.w, 7, 0.3),
          this.renderer.createToonMaterial({ color: 0x2c4a8a, gradientBands: 2 }));
        mural.position.set(0, 5.5, -5.2);
        bldg.add(mural);
        const muralText = new THREE.Mesh(new THREE.BoxGeometry(u.w * 0.85, 2.0, 0.45),
          new THREE.MeshBasicMaterial({ color: 0xf5c842 }));
        muralText.position.set(0, 5.5, -5.1);
        bldg.add(muralText);
        // Delivery tanker truck in parking area
        const tanker = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.2, 11), this.matTankerSilver);
        tanker.position.set(-8, 1.6, -12);
        bldg.add(tanker);
        const tankerCab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.8, 4.5), this.matTankerSilver);
        tankerCab.position.set(-8, 1.9, -18);
        bldg.add(tankerCab);
      }

      // Sign
      const signBg = new THREE.Mesh(new THREE.BoxGeometry(u.w * 0.8, 1.4, 0.35),
        this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
      signBg.position.set(0, u.isInn ? 20.5 : 10.3, 5.1);
      bldg.add(signBg);
      const signNeon = new THREE.Mesh(new THREE.BoxGeometry(u.w * 0.7, 0.5, 0.45),
        new THREE.MeshBasicMaterial({ color: u.neonCol }));
      signNeon.position.set(0, u.isInn ? 20.5 : 10.3, 5.2);
      bldg.add(signNeon);

      // Old-style iron streetlamp
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.5, 6), this.matIronLamp);
      lampPost.position.set(-u.w * 0.5 - 0.8, 2.75, 5.5);
      bldg.add(lampPost);
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), this.matIronLamp);
      lampHead.position.set(-u.w * 0.5 - 0.8, 5.65, 5.5);
      bldg.add(lampHead);
      const lampGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffee88 }));
      lampGlobe.position.set(-u.w * 0.5 - 0.8, 5.65, 5.5);
      bldg.add(lampGlobe);

      this.group.add(bldg);
    });

    // Wide sidewalk apron
    const sidewalkT = this.splineRoad.getRoadTransformAtZ(14360, 18, 0);
    const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(7, 125),
      this.renderer.createToonMaterial({ color: 0xb8a898, gradientBands: 2 }));
    sidewalk.rotateX(-Math.PI * 0.5);
    sidewalk.position.copy(sidewalkT.pos);
    sidewalk.position.y = 0.06;
    this.group.add(sidewalk);

    // Angle parking
    const parkT = this.splineRoad.getRoadTransformAtZ(14360, 14, 0);
    const parkApron = new THREE.Mesh(new THREE.PlaneGeometry(6, 125), this.matAsphaltLot);
    parkApron.rotateX(-Math.PI * 0.5);
    parkApron.position.copy(parkT.pos);
    parkApron.position.y = 0.04;
    this.group.add(parkApron);
  }

  // Ferndale Victorian "Butterfat Palace" Mansions (Z=14520–14580m, X=+22)
  buildFerndaleMansions() {
    const ferndalePalettes = [
      { body: 0x223850, trim: 0xf5f0e0, accent: 0xc89d5c, roof: 0x1a1a2a, foundation: 0x5a5550, door: 0xa83232, glass: 0x1c2b36, hardware: 0xd4af37 },
      { body: 0xd4af37, trim: 0x2a5a7a, accent: 0x8c3a27, roof: 0x2a1a1a, foundation: 0x5a5550, door: 0x2d4030, glass: 0x1c2b36, hardware: 0xd4af37 },
      { body: 0x7a9a7a, trim: 0xfef9ed, accent: 0x7a2a2a, roof: 0x1a2a1a, foundation: 0x5a5550, door: 0x7c2d12, glass: 0x1c2b36, hardware: 0xd4af37 },
      { body: 0xd48b7b, trim: 0xfffcf2, accent: 0x3d2b56, roof: 0x2a2030, foundation: 0x5a5550, door: 0x233142, glass: 0x1c2b36, hardware: 0xd4af37 },
    ];
    const mansions = [
      { z: 14525, xOff: 34, bay: 'right' },
      { z: 14548, xOff: 36, bay: 'left' },
      { z: 14568, xOff: 34, bay: 'right' },
      { z: 14588, xOff: 36, bay: 'left' },
    ];

    mansions.forEach((m, idx) => {
      const transform = this.splineRoad.getRoadTransformAtZ(m.z, m.xOff, 0);
      const mansion = this.structureBuilder.buildVictorianHouse({
        palette: ferndalePalettes[idx],
        width: 10.5,
        depth: 14.5,
        stories: 3,
        storyHeight: 3.2,
        subterraneanDepth: 4.0,
        baySide: m.bay,
        hasGableOrnament: true,
        hasPorchRailings: true
      });
      mansion.position.copy(transform.pos);
      // Right side: face front facade across road toward oncoming traffic
      mansion.rotation.y = transform.heading - Math.PI * 0.5 - 0.22;


      this.group.add(mansion);
    });


    // Brick-style sidewalk
    const sidewalkT = this.splineRoad.getRoadTransformAtZ(14555, 24, 0);
    const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(4, 90),
      this.renderer.createToonMaterial({ color: 0xc8a898, gradientBands: 2 }));
    sidewalk.rotateX(-Math.PI * 0.5);
    sidewalk.position.copy(sidewalkT.pos);
    sidewalk.position.y = 0.06;
    this.group.add(sidewalk);

    // Free angle parking on street
    const parkT = this.splineRoad.getRoadTransformAtZ(14555, 19.5, 0);
    const parkApron = new THREE.Mesh(new THREE.PlaneGeometry(4, 90), this.matAsphaltLot);
    parkApron.rotateX(-Math.PI * 0.5);
    parkApron.position.copy(parkT.pos);
    parkApron.position.y = 0.04;
    this.group.add(parkApron);
  }

  // Bigfoot Museum Enhanced Exterior — Sasquatch Statue + Neon + Gravel Lot (Z=14850m)
  buildBigfootMerchandiseFront() {
    const statueT = this.splineRoad.getRoadTransformAtZ(14855, -34, 0);
    const sasquatch = new THREE.Group();
    sasquatch.position.copy(statueT.pos);
    sasquatch.rotation.y = statueT.heading + 0.5; // faces toward road

    const legs = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 1.6), this.matBigfootFur);
    legs.position.y = 1.6;
    sasquatch.add(legs);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.8, 2.0), this.matBigfootFur);
    torso.position.y = 5.4;
    torso.castShadow = true;
    sasquatch.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), this.matBigfootFur);
    head.position.y = 8.2;
    sasquatch.add(head);
    // Arms spread wide
    const armL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.8, 1.2), this.matBigfootFur);
    armL.position.set(-3.2, 5.8, 0);
    armL.rotation.z = 0.4;
    sasquatch.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.8, 1.2), this.matBigfootFur);
    armR.position.set(3.2, 5.8, 0);
    armR.rotation.z = -0.4;
    sasquatch.add(armR);
    // Eyes
    const matEye = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    [-0.45, 0.45].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), matEye);
      eye.position.set(ex, 8.4, 1.1);
      sasquatch.add(eye);
    });

    this.group.add(sasquatch);

    // "BIGFOOT SIGHTINGS" glowing green footprint sign
    const neonSignT = this.splineRoad.getRoadTransformAtZ(14848, -22, 0);
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), this.matBigfootLodge);
    signPost.position.set(neonSignT.pos.x, neonSignT.pos.y + 2.5, neonSignT.pos.z);
    this.group.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.5, 0.35),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    signBoard.position.set(neonSignT.pos.x, neonSignT.pos.y + 5.8, neonSignT.pos.z);
    this.group.add(signBoard);
    const neonText = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.7, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x76ff03 }));
    neonText.position.set(neonSignT.pos.x, neonSignT.pos.y + 5.8, neonSignT.pos.z + 0.1);
    this.group.add(neonText);
    // Glowing green footprint
    const footprint = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 2.5),
      new THREE.MeshBasicMaterial({ color: 0x76ff03 }));
    footprint.position.set(neonSignT.pos.x + 4, neonSignT.pos.y + 4.8, neonSignT.pos.z);
    this.group.add(footprint);

    // Gravel parking apron
    const gravelT = this.splineRoad.getRoadTransformAtZ(14852, -28, 0);
    const gravel = new THREE.Mesh(new THREE.PlaneGeometry(22, 16),
      this.renderer.createToonMaterial({ color: 0x9a8a78, gradientBands: 2 }));
    gravel.rotateX(-Math.PI * 0.5);
    gravel.position.copy(gravelT.pos);
    gravel.position.y = 0.04;
    this.group.add(gravel);

    // Souvenir shop window signage
    const shopSignT = this.splineRoad.getRoadTransformAtZ(14850, -33, 0);
    const shopWin = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x7ab8cc, transparent: true, opacity: 0.7 }));
    shopWin.position.copy(shopSignT.pos);
    shopWin.position.y += 2.0;
    this.group.add(shopWin);
    const shopSignText = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x76ff03 }));
    shopSignText.position.copy(shopSignT.pos);
    shopSignText.position.y += 3.3;
    this.group.add(shopSignText);
  }

  update(dt) {}
}
