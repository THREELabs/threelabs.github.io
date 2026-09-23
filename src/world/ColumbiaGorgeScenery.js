import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';

export class ColumbiaGorgeSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Columbia Gorge Materials with Procedural PBR Textures & Normal Maps
    const firBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('pine', 256) : null;
    const firBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('pine', 256) : null;
    const firFoliageDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('conifer', 256) : null;
    const firFoliageNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('conifer', 256) : null;
    const rockNorm = renderer.textures.mountainRidgeNormalPBR ? renderer.textures.mountainRidgeNormalPBR(512) : null;
    const stoneNorm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;
    const woodNorm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;

    this.matBasaltCanyon = renderer.createToonMaterial({ color: 0x3e4442, gradientBands: 3, normalMap: rockNorm });
    this.matBasaltColumn = renderer.createToonMaterial({ color: 0x2e3533, gradientBands: 2, normalMap: rockNorm });
    this.matStoneLodge = renderer.createToonMaterial({ color: 0x8d8376, gradientBands: 3, normalMap: stoneNorm });
    this.matVistaStone = renderer.createToonMaterial({ color: 0xc8baa8, gradientBands: 3, normalMap: stoneNorm });
    this.matVistaDome = renderer.createToonMaterial({ color: 0x2e7054, gradientBands: 3 });
    this.matTrussSteel = renderer.createToonMaterial({ color: 0x263238, gradientBands: 2 });
    this.matDamConcrete = renderer.createToonMaterial({ color: 0xa0aab2, gradientBands: 3, normalMap: stoneNorm });
    this.matWaterfallWater = new THREE.MeshBasicMaterial({ color: 0xcee5f2, transparent: true, opacity: 0.95 });
    this.matWaterfallMist = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
    this.matMountHoodSnow = renderer.createToonMaterial({ color: 0xffffff, gradientBands: 2 });
    this.matMountHoodRock = renderer.createToonMaterial({ color: 0x455a64, gradientBands: 3, normalMap: rockNorm });
    this.matFirTrunk = renderer.createToonMaterial({ color: 0x42362b, gradientBands: 2, map: firBarkDiff, normalMap: firBarkNorm });
    this.matFirFoliage = renderer.createToonMaterial({ color: 0x1b4332, gradientBands: 3, map: firFoliageDiff, normalMap: firFoliageNorm });

    this.matSignGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 });
    this.matWhiteSign = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    this.matSteelGray = renderer.createToonMaterial({ color: 0x6e7882, gradientBands: 2 });
    this.matBrownOak = renderer.createToonMaterial({ color: 0x7c5c3a, gradientBands: 3, normalMap: woodNorm });
    this.matBrownPub = renderer.createToonMaterial({ color: 0x4a3828, gradientBands: 2, normalMap: woodNorm });
    this.matHotelBrick = renderer.createToonMaterial({ color: 0x8b3a2e, gradientBands: 3, normalMap: stoneNorm });
    this.matHotelGreen = renderer.createToonMaterial({ color: 0x1a3d1e, gradientBands: 2 });
    this.matOrchardGreen = renderer.createToonMaterial({ color: 0x3a6b2a, gradientBands: 3 });
    this.matFruitStand = renderer.createToonMaterial({ color: 0xe8c87a, gradientBands: 2 });
    this.matSteamWhite = renderer.createToonMaterial({ color: 0xf0f0ec, gradientBands: 2 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matGraniteGuard = renderer.createToonMaterial({ color: 0x7a8080, gradientBands: 3, normalMap: stoneNorm });
    this.matLodgeStone = renderer.createToonMaterial({ color: 0x786860, gradientBands: 3, normalMap: stoneNorm });

    this.buildGorgeEnvironment();
  }

  buildGorgeEnvironment() {
    this.buildMountHoodBackdrop();
    this.buildBridgeOfTheGods();
    this.buildMultnomahFallsAndLodge();
    this.buildColumbiaSpeedWorks();
    this.buildBonnevilleDamSpillway();
    this.buildVistaHouseCrownPoint();
    this.buildCrownPointViaductAndArches();
    this.buildColumbiaGorgeFirs();
    this.buildCascadeLocksMarina();
    this.buildHoodRiverTownStreet();
    this.buildHistoricHwyStoneGuardrails();
    this.buildMultnomahLodgeEnhanced();
    this.buildVistaHouseParking();
    this.buildGorgeHighwaySignage();
  }

  // 1. Mount Hood Snow-Capped Peak on Horizon
  buildMountHoodBackdrop() {
    const transform = this.splineRoad.getRoadTransformAtZ(19500, 220, 20);
    const mtHood = new THREE.Group();
    mtHood.position.copy(transform.pos);

    const base = new THREE.Mesh(new THREE.ConeGeometry(130, 150, 8), this.matMountHoodRock);
    base.position.y = 75;
    mtHood.add(base);

    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(55, 60, 8), this.matMountHoodSnow);
    snowCap.position.y = 120;
    mtHood.add(snowCap);

    this.group.add(mtHood);
  }

  // 2. Bridge of the Gods Cantilever Steel Truss Bridge (Z = 18700m)
  buildBridgeOfTheGods() {
    const transform = this.splineRoad.getRoadTransformAtZ(18700, -32, 0);
    const bridge = new THREE.Group();
    bridge.position.copy(transform.pos);
    bridge.rotation.y = transform.heading;

    const SPAN = 90, DEPTH = 7.5;
    const chordGeo = new THREE.BoxGeometry(0.9, 0.9, SPAN);
    // Top & bottom chords (both sides of roadway)
    [-6.5, 6.5].forEach(lx => {
      const bot = new THREE.Mesh(chordGeo, this.matTrussSteel);
      bot.position.set(lx, 2.2, 0);
      bridge.add(bot);
      const top = new THREE.Mesh(chordGeo, this.matTrussSteel);
      top.position.set(lx, 2.2 + DEPTH, 0);
      bridge.add(top);
    });
    // Warren diagonals + verticals along both trusses
    const diagGeo = new THREE.BoxGeometry(0.45, 0.45, 1);
    const PANELS = 12;
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < PANELS; i++) {
        const z0 = -SPAN / 2 + (i * SPAN) / PANELS;
        const z1 = -SPAN / 2 + ((i + 1) * SPAN) / PANELS;
        const len = Math.hypot(DEPTH, z1 - z0);
        const diag = new THREE.Mesh(diagGeo, this.matTrussSteel);
        diag.scale.z = len;
        diag.position.set(s * 6.5, 2.2 + DEPTH / 2, (z0 + z1) / 2);
        diag.rotation.x = Math.atan2(z1 - z0, i % 2 === 0 ? DEPTH : -DEPTH);
        if (i % 2 !== 0) diag.rotation.x = -diag.rotation.x;
        bridge.add(diag);
        const vert = new THREE.Mesh(diagGeo, this.matTrussSteel);
        vert.scale.z = DEPTH;
        vert.position.set(s * 6.5, 2.2 + DEPTH / 2, z0);
        bridge.add(vert);
      }
    }
    // Cross top laterals (portal bracing)
    for (let i = 0; i <= PANELS; i += 2) {
      const lat = new THREE.Mesh(diagGeo, this.matTrussSteel);
      lat.scale.z = 13;
      lat.rotation.y = Math.PI / 2;
      lat.position.set(0, 2.2 + DEPTH, -SPAN / 2 + (i * SPAN) / PANELS);
      bridge.add(lat);
    }

    this.group.add(bridge);
  }

  // 3. Multnomah Falls, Historic Lodge & Scenic Overlook Spur (Z = 19250m)
  buildMultnomahFallsAndLodge() {
    const transform = this.splineRoad.getRoadTransformAtZ(19250, 48, 0);
    const falls = new THREE.Group();
    falls.position.copy(transform.pos);
    falls.rotation.y = transform.heading;

    // Scenic Paved Turnout Spur Road
    const spur = new THREE.Mesh(new THREE.PlaneGeometry(24, 60), this.renderer.createToonMaterial({ color: 0x334155 }));
    spur.rotateX(-Math.PI * 0.5);
    spur.position.set(0, 0.05, 0);
    falls.add(spur);

    // Stone Retaining Wall along Overlook
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 58), this.matStoneLodge);
    wall.position.set(11.5, 0.6, 0);
    falls.add(wall);

    // Observation Telescopes
    [-14, 0, 14].forEach(tz => {
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.3, 8), this.matTrussSteel);
      scope.position.set(11.0, 0.65, tz);
      falls.add(scope);
    });

    // Basalt Canyon Cliff Wall (set back +26m from spur)
    const canyonWall = new THREE.Mesh(new THREE.BoxGeometry(32, 95, 26), this.matBasaltCanyon);
    canyonWall.position.set(28, 47.5, 0);
    canyonWall.castShadow = true;
    falls.add(canyonWall);

    // Upper Falls Cascading Plunge
    const upperFall = new THREE.Mesh(new THREE.PlaneGeometry(8, 55), this.matWaterfallWater);
    upperFall.position.set(28, 62, 13.2);
    falls.add(upperFall);

    // Benson Footbridge
    const footbridge = new THREE.Group();
    footbridge.position.set(28, 36, 17);
    const bDeck = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 3.2), this.matStoneLodge);
    footbridge.add(bDeck);
    falls.add(footbridge);

    // Lower Falls
    const lowerFall = new THREE.Mesh(new THREE.PlaneGeometry(10, 34), this.matWaterfallWater);
    lowerFall.position.set(28, 17, 15.2);
    falls.add(lowerFall);

    // Historic Stone Lodge (1925 Cascadian Rustic Architecture)
    const lodge = this.structureBuilder.buildHistoricLodge({
      width: 24.0,
      depth: 16.0,
      stories: 2,
      colorStone: 0x4a4f56,
      colorTimber: 0x5c3a21,
      colorRoof: 0x242b26,
      subterraneanDepth: 4.5
    });
    lodge.position.set(12, 0.05, 18);
    // Face across road toward oncoming traffic (local -X in falls group)
    lodge.rotation.y = -Math.PI * 0.5 - 0.25;
    falls.add(lodge);



    this.group.add(falls);
  }

  // 3b. Columbia Gorge Speed Works & Service Bay (Z = 19600m)
  buildColumbiaSpeedWorks() {
    const shopGroup = new THREE.Group();
    const trans = this.splineRoad.getRoadTransformAtZ(19600, 32, 0);
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

    // Heavy Industrial 2-Post Shop Lift
    const liftGroup = new THREE.Group();
    liftGroup.position.set(-4.0, 0, 7);
    [-2.2, 2.2].forEach(lx => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 0.45), this.matTrussSteel);
      post.position.set(lx, 2.1, 0);
      liftGroup.add(post);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.22), matYellow);
      arm.position.set(lx > 0 ? lx - 0.7 : lx + 0.7, 0.85, 0);
      liftGroup.add(arm);
    });
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.35), this.matTrussSteel);
    crossBeam.position.set(0, 4.2, 0);
    liftGroup.add(crossBeam);
    shopGroup.add(liftGroup);

    // Workshop Building (Basalt masonry & steel trim)
    const building = new THREE.Mesh(new THREE.BoxGeometry(22, 6.5, 14), this.matBasaltCanyon);
    building.position.set(0, 3.25, -5.5);
    building.castShadow = true;
    shopGroup.add(building);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(23.5, 0.8, 15.5), this.matTrussSteel);
    roof.position.set(0, 6.7, -5.5);
    shopGroup.add(roof);

    // Neon Sign: "COLUMBIA GORGE SPEED WORKS"
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(18, 2.2, 0.5), this.matTrussSteel);
    signBoard.position.set(0, 8.2, -5.0);
    shopGroup.add(signBoard);

    const signNeon = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 0.7), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    signNeon.position.set(0, 8.2, -5.0);
    shopGroup.add(signNeon);

    this.group.add(shopGroup);
  }

  // 4. Bonneville Dam Spillway (Z = 19850m)
  buildBonnevilleDamSpillway() {
    const transform = this.splineRoad.getRoadTransformAtZ(19850, -35, 0);
    const dam = new THREE.Group();
    dam.position.copy(transform.pos);
    dam.rotation.y = transform.heading;

    const wall = new THREE.Mesh(new THREE.BoxGeometry(34, 18, 14), this.matDamConcrete);
    wall.position.y = 9;
    wall.castShadow = true;
    dam.add(wall);

    this.group.add(dam);
  }

  // 5. Vista House on Crown Point (Z = 20450m)
  buildVistaHouseCrownPoint() {
    const transform = this.splineRoad.getRoadTransformAtZ(20450, -38, 4);
    const vista = new THREE.Group();
    vista.position.copy(transform.pos);
    vista.rotation.y = transform.heading + 0.3;

    const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(11, 12, 10, 8), this.matVistaStone);
    rotunda.position.y = 18;
    rotunda.castShadow = true;
    vista.add(rotunda);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(11, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), this.matVistaDome);
    dome.position.y = 23;
    vista.add(dome);

    this.group.add(vista);
  }

  // 5b. Historic Columbia River Highway Crown Point Viaduct & Basalt Arches (Z = 20380m, X = -24m)
  buildCrownPointViaductAndArches() {
    const t = this.splineRoad.getRoadTransformAtZ(20380, -24, 0);
    const viaductGroup = new THREE.Group();
    viaductGroup.position.copy(t.pos);
    viaductGroup.rotation.y = t.heading;

    const matBasaltArch = this.renderer.createToonMaterial({ color: 0x524e49, gradientBands: 3 });
    const matConcreteDeck = this.renderer.createToonMaterial({ color: 0x9ca3af, gradientBands: 2 });
    const matLampGlow = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // 1. Elevated Observation Promenade Deck (48m long x 6.5m wide)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.8, 48), matConcreteDeck);
    deck.position.set(0, 4.4, 0);
    viaductGroup.add(deck);

    // 2. Continuous Basalt Pier Foundation Skirt & Arch Vaults
    const archGeo = new THREE.CylinderGeometry(2.4, 2.4, 6.5, 12, 1, false, 0, Math.PI);
    archGeo.rotateZ(Math.PI * 0.5);

    // Pier columns and open arches underneath viaduct
    for (let az = -18; az <= 18; az += 9) {
      // Supporting concrete pier
      const pier = new THREE.Mesh(new THREE.BoxGeometry(6.2, 7.5, 2.2), matBasaltArch);
      pier.position.set(0, 0.25, az);
      viaductGroup.add(pier);

      // Open structural arch cutout appearance between piers
      if (az < 18) {
        const archRib = new THREE.Mesh(archGeo, matBasaltArch);
        archRib.position.set(0, 2.8, az + 4.5);
        viaductGroup.add(archRib);
      }
    }

    // Subterranean foundation wall anchoring viaduct into basalt cliff slope
    const subCliff = new THREE.Mesh(new THREE.BoxGeometry(7.2, 8.0, 50), matBasaltArch);
    subCliff.position.set(-1.5, -3.5, 0);
    viaductGroup.add(subCliff);

    // 3. Hand-Hewn Basalt Stone Guardrail Balustrade with Arched Niches
    [-3.1, 3.1].forEach(gx => {
      const balustrade = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 48), this.matGraniteGuard);
      balustrade.position.set(gx, 5.35, 0);
      viaductGroup.add(balustrade);

      // Decorative end pillars
      [-24, 24].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), this.matGraniteGuard);
        pillar.position.set(gx, 5.5, pz);
        viaductGroup.add(pillar);
      });
    });

    // 4. Semicircular Overlook Balcony extending toward the river canyon
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.8, 16, 1, false, 0, Math.PI), matConcreteDeck);
    balcony.rotateY(-Math.PI * 0.5);
    balcony.position.set(-3.25, 4.4, 0);
    viaductGroup.add(balcony);

    const balconyRail = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.1, 16, 1, true, 0, Math.PI), this.matGraniteGuard);
    balconyRail.rotateY(-Math.PI * 0.5);
    balconyRail.position.set(-3.25, 5.35, 0);
    viaductGroup.add(balconyRail);

    // 5. Historic 1916 Bronze Commemorative Plinth & Highway Engineer Marker
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.8), matBasaltArch);
    plinth.position.set(-3.2, 5.55, 0);
    viaductGroup.add(plinth);
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    plaque.position.set(-3.12, 5.7, 0);
    viaductGroup.add(plaque);

    // 6. Historic Gaslight-Style Street Lanterns
    [-18, 0, 18].forEach(lz => {
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6), this.matSteelGray);
      lampPost.position.set(2.8, 6.4, lz);
      viaductGroup.add(lampPost);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), matLampGlow);
      globe.position.set(2.8, 8.0, lz);
      viaductGroup.add(globe);
    });

    this.group.add(viaductGroup);
  }

  // 6. Columbia Gorge Douglas Firs & Basalt Canyon Columns (Z = 18220 - 20780m)
  buildColumbiaGorgeFirs() {
    const basaltColGeo = new THREE.CylinderGeometry(1.6, 2.2, 14, 6);
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const treeCount = isMobile ? 65 : 130;
    const zStep = isMobile ? 39.0 : 19.5;

    for (let i = 0; i < treeCount; i++) {
      const z = 18220 + i * zStep + (Math.random() - 0.5) * 8;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (20.0 + Math.random() * 28);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const fir = new THREE.Group();
      fir.position.copy(transform.pos);
      fir.rotation.y = transform.heading;

      const h = 15.0 + Math.random() * 7.0;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, h, 6), this.matFirTrunk);
      trunk.position.y = h * 0.5;
      fir.add(trunk);

      for (let y = 5; y <= h + 2; y += 3.4) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(5.0 - (y * 0.16), 4.8, 6), this.matFirFoliage);
        cone.position.y = y;
        cone.castShadow = !isMobile;
        fir.add(cone);
      }

      this.group.add(fir);

      // Basalt column clusters along gorge walls
      if (Math.random() > 0.6) {
        const col = new THREE.Mesh(basaltColGeo, this.matBasaltColumn);
        const colLat = side * (26.0 + Math.random() * 25);
        const colTrans = this.splineRoad.getRoadTransformAtZ(z, colLat, 0);
        col.position.copy(colTrans.pos);
        col.position.y += 6;
        col.rotation.y = Math.PI * Math.random();
        this.group.add(col);
      }
    }
  }

  // 7. Columbia River Gorge Highway Signage
  buildGorgeHighwaySignage() {
    const signs = [
      { z: 18250, text: 'COLUMBIA RIVER GORGE\nNATIONAL SCENIC AREA' },
      { z: 18650, text: 'BRIDGE OF THE GODS\nOREGON-WASHINGTON SPAN' },
      { z: 19200, text: 'MULTNOMAH FALLS & LODGE\nELEVATION 620 FT CASCADE' },
      { z: 20400, text: 'VISTA HOUSE AT CROWN POINT\n1918 HISTORIC ROTUNDA' }
    ];

    signs.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, 19.5, 0);
      const signGroup = new THREE.Group();
      signGroup.position.copy(transform.pos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      signGroup.rotateY(Math.PI); // Face oncoming traffic!
      signGroup.rotateY(-0.60); // Angled ~35° inward toward highway lanes for direct sightline

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.matTrussSteel);
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

  // Cascade Locks Marine Park & Thunder Island Brewing (Z=18650–18710m)
  buildCascadeLocksMarina() {
    const baseZ = 18670;
    const transform = this.splineRoad.getRoadTransformAtZ(baseZ, -48, 0);
    const marina = new THREE.Group();
    marina.position.copy(transform.pos);
    marina.rotation.y = transform.heading + 0.2;

    // Marine park paved deck
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(42, 60), this.matAsphaltLot);
    deck.rotateX(-Math.PI * 0.5);
    deck.position.set(0, 0.05, 0);
    marina.add(deck);

    // NPS Visitor Center building
    const vcBuilding = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 10), this.matStoneLodge);
    vcBuilding.position.set(-12, 3, -20);
    marina.add(vcBuilding);
    const vcRoof = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.5, 11.5),
      this.renderer.createToonMaterial({ color: 0x3a3028, gradientBands: 2 }));
    vcRoof.position.set(-12, 6.25, -20);
    marina.add(vcRoof);
    const vcSign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 0.35), this.matStoneLodge);
    vcSign.position.set(-12, 7.2, -14.7);
    marina.add(vcSign);
    const vcSignNeon = new THREE.Mesh(new THREE.BoxGeometry(9, 0.45, 0.45),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    vcSignNeon.position.set(-12, 7.2, -14.6);
    marina.add(vcSignNeon);

    // Thunder Island Brewing taproom
    const pub = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 10), this.matBrownPub);
    pub.position.set(10, 3.5, -16);
    pub.castShadow = true;
    marina.add(pub);
    const pubRoof = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.5, 11.5),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    pubRoof.position.set(10, 7.25, -16);
    marina.add(pubRoof);
    // Mural on side wall — painted lettering
    const mural = new THREE.Mesh(new THREE.BoxGeometry(11, 3.0, 0.3),
      this.renderer.createToonMaterial({ color: 0x2c4a8a, gradientBands: 2 }));
    mural.position.set(10, 4.5, -10.7);
    marina.add(mural);
    const muralText = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.0, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    muralText.position.set(10, 5.0, -10.6);
    marina.add(muralText);

    // Historic sternwheeler paddle steamer at dock
    const steamGrp = new THREE.Group();
    steamGrp.position.set(-18, 0, 18);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(12, 3.5, 28), this.matBasaltCanyon);
    hull.position.y = 1.75;
    steamGrp.add(hull);
    const superStruct = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 22), this.matSteamWhite);
    superStruct.position.y = 6.5;
    steamGrp.add(superStruct);
    const smokestack = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 7, 8), this.matBasaltColumn);
    smokestack.position.set(-2, 10, -6);
    steamGrp.add(smokestack);
    // Paddle wheel on the side
    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.5, 8),
      this.renderer.createToonMaterial({ color: 0x8b4513, gradientBands: 2 }));
    wheelHub.rotation.z = Math.PI * 0.5;
    wheelHub.position.set(6.5, 1.5, 2);
    steamGrp.add(wheelHub);
    for (let a = 0; a < 8; a++) {
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 3.2),
        this.renderer.createToonMaterial({ color: 0x8b4513, gradientBands: 2 }));
      const angle = (a / 8) * Math.PI * 2;
      paddle.position.set(6.5 + Math.cos(angle) * 3, 1.5 + Math.sin(angle) * 3, 2);
      paddle.rotation.z = angle;
      steamGrp.add(paddle);
    }
    marina.add(steamGrp);

    // Marina dock slips — wooden piers
    for (let d = 0; d < 3; d++) {
      const dock = new THREE.Mesh(new THREE.PlaneGeometry(4, 18), this.matBrownOak);
      dock.rotateX(-Math.PI * 0.5);
      dock.position.set(-22 + d * 5, 0.08, 22 + d * 3);
      marina.add(dock);
    }

    this.group.add(marina);
  }

  // Hood River Town — Hotel, Full Sail Brewing, Fruit Stand, Orchard Rows (Z=19400–19490m)
  buildHoodRiverTownStreet() {
    // Hood River Hotel (1913)
    const hotelT = this.splineRoad.getRoadTransformAtZ(19410, 32, 0);
    const hotel = new THREE.Group();
    hotel.position.copy(hotelT.pos);
    // Right side: face across street toward oncoming traffic
    hotel.rotation.y = hotelT.heading - Math.PI * 0.5 - 0.22;

    // Hood River Hotel — 3-story historic masonry building
    const hotelBuilding = this.structureBuilder.buildCommercialBuilding({
      width: 18.0,
      depth: 14.0,
      stories: 3,
      storyHeight: 4.2,
      colorWall: 0x8b3a2a,
      colorTrim: 0xc8a060,
      subterraneanDepth: 4.0
    });
    hotel.add(hotelBuilding);

    // "HOOD RIVER HOTEL — EST. 1913" sign on dark green fascia
    const hotelFascia = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.4), this.matHotelGreen);
    hotelFascia.position.set(0, 15.5, 6.3);
    hotel.add(hotelFascia);
    const hotelSignNeon = new THREE.Mesh(new THREE.BoxGeometry(13, 0.7, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xf5c842 }));
    hotelSignNeon.position.set(0, 15.5, 6.5);
    hotel.add(hotelSignNeon);

    this.group.add(hotel);

    // Full Sail Brewing
    const brewT = this.splineRoad.getRoadTransformAtZ(19450, 32, 0);
    const brew = new THREE.Group();
    brew.position.copy(brewT.pos);
    // Right side: face across street toward oncoming traffic
    brew.rotation.y = brewT.heading - Math.PI * 0.5 - 0.22;

    const brewFactory = this.structureBuilder.buildCanneryFactory({
      width: 20.0,
      depth: 14.0,
      height: 8.5,
      colorBrick: 0x8b3a2a,
      colorRoof: 0x242d32,
      subterraneanDepth: 3.5
    });
    brew.add(brewFactory);

    // Full Sail Brewing mural on side wall
    const brewMural = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 0.35),
      this.renderer.createToonMaterial({ color: 0x1a3a6b, gradientBands: 2 }));
    brewMural.position.set(0, 5, 6.3);
    brew.add(brewMural);
    const brewNeon = new THREE.Mesh(new THREE.BoxGeometry(15, 1.2, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    brewNeon.position.set(0, 6.5, 6.5);
    brew.add(brewNeon);

    // Tap room "OPEN" sandwich board
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 0.12),
      this.renderer.createToonMaterial({ color: 0x8b7355, gradientBands: 2 }));
    board.position.set(-11, 1.4, 6.5);
    brew.add(board);

    this.group.add(brew);

    // Hood River Fruit Stand
    const standT = this.splineRoad.getRoadTransformAtZ(19485, 28, 0);
    const stand = new THREE.Group();
    stand.position.copy(standT.pos);
    // Right side: face across street toward oncoming traffic
    stand.rotation.y = standT.heading - Math.PI * 0.5 - 0.22;

    const standShack = this.structureBuilder.buildCoastalSeafoodShack({
      width: 8.5,
      depth: 6.0,
      height: 4.0,
      colorSiding: 0x8a6840,
      colorRoof: 0x5c3a1e,
      subterraneanDepth: 2.0
    });
    stand.add(standShack);


    // Wooden crates with colorful fruit
    const fruitColors = [0xff6633, 0xffcc00, 0x22aa44, 0xcc3333];
    for (let cr = 0; cr < 6; cr++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.2),
        new THREE.MeshBasicMaterial({ color: fruitColors[cr % fruitColors.length] }));
      crate.position.set(-3 + (cr % 3) * 2.2, 0.5, 3.2);
      stand.add(crate);
    }

    // Hand-painted sign board on the stand front
    const standSign = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 0.25),
      this.renderer.createToonMaterial({ color: 0xf5f0d8, gradientBands: 2 }));
    standSign.position.set(0, 2.8, 2.6);
    stand.add(standSign);

    this.group.add(stand);

    // Orchard rows on hillside behind Hood River
    const orchardCrownGeo = new THREE.DodecahedronGeometry(3.2, 1);
    for (let row = 0; row < 5; row++) {
      for (let tree = 0; tree < 8; tree++) {
        const oZ = 19400 + tree * 14;
        const oX = 42 + row * 9;
        const oT = this.splineRoad.getRoadTransformAtZ(oZ, oX, 0);
        const orchard = new THREE.Group();
        orchard.position.copy(oT.pos);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 4, 6), this.matFirTrunk);
        trunk.position.y = 2;
        orchard.add(trunk);
        const crown = new THREE.Mesh(orchardCrownGeo, this.matOrchardGreen);
        crown.position.y = 5.5;
        crown.scale.set(1.2, 0.9, 1.1);
        orchard.add(crown);
        this.group.add(orchard);
      }
    }
  }

  // Historic Columbia River Highway (US-30) Stone Masonry Guardrails — National Historic Landmark
  buildHistoricHwyStoneGuardrails() {
    for (let z = 18320; z < 20750; z += 42) {
      // Skip landmark zones to avoid clipping
      const atBridge = (z > 18640 && z < 18760);
      const atFalls = (z > 19200 && z < 19320);
      const atDam = (z > 19810 && z < 19920);
      if (atBridge || atFalls || atDam) continue;

      const t = this.splineRoad.getRoadTransformAtZ(z, -19.5, 0);

      // Stone pillar
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.55), this.matGraniteGuard);
      pillar.position.set(t.pos.x, t.pos.y + 0.55, t.pos.z);
      this.group.add(pillar);

      // Stone coping wall between pillars
      const coping = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 42), this.matGraniteGuard);
      coping.position.set(t.pos.x, t.pos.y + 0.42, t.pos.z);
      coping.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
      this.group.add(coping);
    }
  }

  // Multnomah Falls Lodge Enhancement — Proper NPS Parking + Gift Shop (Z=19250m)
  buildMultnomahLodgeEnhanced() {
    const parkT = this.splineRoad.getRoadTransformAtZ(19250, 32, 0);
    const parkGroup = new THREE.Group();
    parkGroup.position.copy(parkT.pos);
    parkGroup.rotation.y = parkT.heading;

    // NPS parking lot apron (gravel-asphalt mix)
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(32, 40),
      this.renderer.createToonMaterial({ color: 0x3a3630, gradientBands: 2 }));
    lot.rotateX(-Math.PI * 0.5);
    lot.position.set(0, 0.04, 14);
    parkGroup.add(lot);

    // NPS fee pay kiosk
    const kiosk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.5, 2.8), this.matLodgeStone);
    kiosk.position.set(-14, 2.25, -4);
    parkGroup.add(kiosk);
    const kioskRoof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.8, 4), this.matVistaStone);
    kioskRoof.position.set(-14, 5.2, -4);
    kioskRoof.rotation.y = Math.PI * 0.25;
    parkGroup.add(kioskRoof);

    // Gift shop annex attached to lodge
    const giftShop = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), this.matStoneLodge);
    giftShop.position.set(12, 3, 26);
    parkGroup.add(giftShop);
    const giftSign = new THREE.Mesh(new THREE.BoxGeometry(7, 1.0, 0.3),
      this.renderer.createToonMaterial({ color: 0x2d4a1e, gradientBands: 2 }));
    giftSign.position.set(12, 6.8, 22.2);
    parkGroup.add(giftSign);
    const giftNeon = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.4, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x86efac }));
    giftNeon.position.set(12, 6.8, 22.1);
    parkGroup.add(giftNeon);

    this.group.add(parkGroup);
  }

  // Vista House at Crown Point — Scenic Overlook Parking (Z=20450m)
  buildVistaHouseParking() {
    const transform = this.splineRoad.getRoadTransformAtZ(20450, -38, 4);
    const vPark = new THREE.Group();
    vPark.position.copy(transform.pos);
    vPark.rotation.y = transform.heading + 0.3;

    // Paved circular overlook apron
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(38, 36), this.matAsphaltLot);
    apron.rotateX(-Math.PI * 0.5);
    apron.position.set(0, 0.05, 0);
    vPark.add(apron);

    // Stone retaining wall around the perimeter (cliff side)
    const retWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 36), this.matGraniteGuard);
    retWall.position.set(-18, 0.6, 0);
    vPark.add(retWall);

    // 3 observation telescopes
    [-10, 0, 10].forEach(tz => {
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.3, 8), this.matTrussSteel);
      scope.position.set(-17, 0.65, tz);
      vPark.add(scope);
      const scopeHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.55), this.matBasaltColumn);
      scopeHead.position.set(-17.1, 1.4, tz);
      vPark.add(scopeHead);
    });

    // Carved wooden interpretive sign
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 6), this.matFirTrunk);
    signPost.position.set(14, 1.25, -15);
    vPark.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.2, 0.25), this.matFirTrunk);
    signBoard.position.set(14, 2.8, -15);
    vPark.add(signBoard);
    const signFace = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.85, 0.3), this.matSteamWhite);
    signFace.position.set(14, 2.8, -14.9);
    vPark.add(signFace);

    this.group.add(vPark);
  }

  update(dt) {}
}
