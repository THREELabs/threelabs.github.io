import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';

export class MontereySceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Monterey Materials
    this.matCanneryRed = renderer.createToonMaterial({ color: 0x9e382b, gradientBands: 3 });
    // Cel-Shaded Monterey Materials with Procedural PBR Textures & Normal Maps
    const pineBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('pine', 256) : null;
    const pineBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('pine', 256) : null;
    const pineFoliageDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('conifer', 256) : null;
    const pineFoliageNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('conifer', 256) : null;
    const rockNorm = renderer.textures.mountainRidgeNormalPBR ? renderer.textures.mountainRidgeNormalPBR(512) : null;
    const stoneNorm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;
    const woodNorm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;
    const plankDriftDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('driftwood', 256) : null;
    const plankDriftNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('driftwood', 256) : null;

    this.matCanneryIron = renderer.createToonMaterial({ color: 0x6e7882, gradientBands: 2 });
    this.matDarkSteel = renderer.createToonMaterial({ color: 0x22272e, gradientBands: 2 });
    this.matGraniteRock = renderer.createToonMaterial({ color: 0x707880, gradientBands: 3, normalMap: rockNorm });
    this.matGolfGreen = renderer.createToonMaterial({ color: 0x2e8540, gradientBands: 3 });
    this.matGolfSand = renderer.createToonMaterial({ color: 0xf5f1db, gradientBands: 2 });
    this.matGolfFlag = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    this.matMissionAdobe = renderer.createToonMaterial({ color: 0xecd7b4, gradientBands: 3, normalMap: stoneNorm });
    this.matMissionTile = renderer.createToonMaterial({ color: 0xbf4928, gradientBands: 3 });
    this.matMissionBell = renderer.createToonMaterial({ color: 0xb8860b, gradientBands: 2 });

    this.matStorybookStucco = renderer.createToonMaterial({ color: 0xfdf6e2, gradientBands: 2, normalMap: stoneNorm });
    this.matStorybookThatch = renderer.createToonMaterial({ color: 0x8a6844, gradientBands: 2, normalMap: woodNorm });

    this.matPineTrunk = renderer.createToonMaterial({ color: 0x544338, gradientBands: 2, map: pineBarkDiff, normalMap: pineBarkNorm });
    this.matPineFoliage = renderer.createToonMaterial({ color: 0x244f36, gradientBands: 3, map: pineFoliageDiff, normalMap: pineFoliageNorm });
    this.matIcePlantPink = renderer.createToonMaterial({ color: 0xd94b7a, gradientBands: 2 });

    this.matSignGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 });
    this.matWhiteSign = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });

    this.matPierWood = renderer.createToonMaterial({ color: 0x7a6a58, gradientBands: 2, map: plankDriftDiff, normalMap: plankDriftNorm });
    this.matChowderWhite = renderer.createToonMaterial({ color: 0xf5f5f0, gradientBands: 2 });
    this.matNavyBlue = renderer.createToonMaterial({ color: 0x1e3a5f, gradientBands: 2 });
    this.matCarmelStone = renderer.createToonMaterial({ color: 0xc8b89a, gradientBands: 3, normalMap: stoneNorm });
    this.matCarmelThatch = renderer.createToonMaterial({ color: 0x9a7a3a, gradientBands: 2, normalMap: woodNorm });
    this.matCarmelCream = renderer.createToonMaterial({ color: 0xfdf5e0, gradientBands: 2 });
    this.matWineBarrel = renderer.createToonMaterial({ color: 0x5c3a1e, gradientBands: 2, normalMap: woodNorm });
    this.matIronGate = renderer.createToonMaterial({ color: 0x2a2a2a, gradientBands: 2 });
    this.matAquariumBlue = renderer.createToonMaterial({ color: 0x1565c0, gradientBands: 3 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matParkBrown = renderer.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2, normalMap: woodNorm });
    this.matGraniteGate = renderer.createToonMaterial({ color: 0x8a8888, gradientBands: 3, normalMap: stoneNorm });

    this.buildMontereyEnvironment();
  }

  buildMontereyEnvironment() {
    this.buildCanneryRowAndAquarium();
    this.buildCanneryRowLocomotiveAndSpur();
    this.buildPebbleBeachGolfLinks();
    this.buildMontereyTuningBay();
    this.buildTheLoneCypress();
    this.buildCarmelStorybookCottages();
    this.buildCarmelMissionBasilica();
    this.buildMontereyPinesAndIcePlant();
    this.buildMontereyHighwaySignage();
    this.buildCanneryRowStreetscape();
    this.buildOldFishmansWharf();
    this.buildCarmelVillageShops();
    this.build17MileDriveGatehouse();
    this.buildCarmelMissionParking();
  }

  // 1. Cannery Row with Overhead Pedestrian Skywalk (Z = 8300m)
  buildCanneryRowAndAquarium() {
    const transform = this.splineRoad.getRoadTransformAtZ(8300, 0, 0);
    const canneryGroup = new THREE.Group();
    canneryGroup.position.copy(transform.pos);
    canneryGroup.rotation.y = transform.heading;

    // Left Cannery Building (outside left shoulder: -34m)
    const canL = this.structureBuilder.buildCanneryFactory({
      width: 22,
      depth: 38,
      height: 13,
      colorBrick: 0x9e382b,
      subterraneanDepth: 4.0
    });
    canL.position.set(-34, 0, 0);
    // Face toward street
    canL.rotation.y = Math.PI * 0.5;
    canneryGroup.add(canL);

    // Right Cannery Building (outside right shoulder: +34m)
    const canR = this.structureBuilder.buildCanneryFactory({
      width: 20,
      depth: 34,
      height: 11,
      colorBrick: 0x853023,
      subterraneanDepth: 4.0
    });
    canR.position.set(34, 0, 0);
    // Face toward street
    canR.rotation.y = -Math.PI * 0.5;
    canneryGroup.add(canR);

    // Overhead Enclosed Corrugated Steel Skywalk spanning across the wide road (width 48m)
    const skywalkW = 48.0;
    const skywalkH = 4.2;
    const skywalkD = 5.4;
    const skywalkY = 11.5;
    const skywalk = new THREE.Mesh(new THREE.BoxGeometry(skywalkW, skywalkH, skywalkD), this.matCanneryIron);
    skywalk.position.set(0, skywalkY, 0);
    skywalk.castShadow = true;
    canneryGroup.add(skywalk);

    // Skywalk Windows & Structural Support Brackets
    [-1, 1].forEach(sgn => {
      for (let sx = -16; sx <= 16; sx += 8) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.1), this.matDarkSteel);
        win.position.set(sx, skywalkY, sgn * (skywalkD * 0.5 + 0.05));
        canneryGroup.add(win);
      }
    });

    this.group.add(canneryGroup);
  }

  // 1b. Cannery Row Vintage Southern Pacific Locomotive & Rail Spur (Z = 8240m, X = +28m)
  buildCanneryRowLocomotiveAndSpur() {
    const t = this.splineRoad.getRoadTransformAtZ(8240, 28, 0);
    const railGroup = new THREE.Group();
    railGroup.position.copy(t.pos);
    railGroup.rotation.y = t.heading;

    const matBallast = this.renderer.createToonMaterial({ color: 0x5a534c, gradientBands: 2 });
    const matRailSteel = this.renderer.createToonMaterial({ color: 0x71717a, gradientBands: 3 });
    const matTieWood = this.renderer.createToonMaterial({ color: 0x3f2e22, gradientBands: 2 });
    const matLocoBoiler = this.renderer.createToonMaterial({ color: 0x18181b, gradientBands: 3 });
    const matBoxcarWood = this.renderer.createToonMaterial({ color: 0x8b2518, gradientBands: 2 });
    const matBrassLantern = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // 1. Crushed Rock Ballast Bed (42m long x 4.8m wide)
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.4, 42), matBallast);
    ballast.position.set(0, 0.2, 0);
    railGroup.add(ballast);

    // 2. Wooden Cross Ties & Dual Steel Rails
    const tieGeo = new THREE.BoxGeometry(3.2, 0.2, 0.35);
    for (let tz = -19; tz <= 19; tz += 0.85) {
      const tie = new THREE.Mesh(tieGeo, matTieWood);
      tie.position.set(0, 0.42, tz);
      railGroup.add(tie);
    }
    [-0.9, 0.9].forEach(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 41), matRailSteel);
      rail.position.set(rx, 0.58, 0);
      railGroup.add(rail);
    });

    // 3. Southern Pacific 0-6-0 Steam Switcher Locomotive (centered at z = -8)
    const loco = new THREE.Group();
    loco.position.set(0, 0.6, -8);

    // Chassis & heavy wheel base
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 9.5), this.matDarkSteel);
    chassis.position.set(0, 0.8, 0);
    loco.add(chassis);

    // 6 Large Cast Iron Drive Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.22, 14);
    wheelGeo.rotateZ(Math.PI * 0.5);
    [-1.05, 1.05].forEach(wx => {
      [-2.6, 0, 2.6].forEach(wz => {
        const wheel = new THREE.Mesh(wheelGeo, this.matDarkSteel);
        wheel.position.set(wx, 0.7, wz);
        loco.add(wheel);
      });
      // Side connecting rod
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 5.6), matRailSteel);
      rod.position.set(wx * 1.15, 0.7, 0);
      loco.add(rod);
    });

    // Cylindrical Steam Boiler
    const boilerGeo = new THREE.CylinderGeometry(0.9, 0.9, 6.2, 16);
    boilerGeo.rotateX(Math.PI * 0.5);
    const boiler = new THREE.Mesh(boilerGeo, matLocoBoiler);
    boiler.position.set(0, 2.2, 0.5);
    loco.add(boiler);

    // Front Smokebox, Door & Cowcatcher
    const smokebox = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), this.matDarkSteel);
    smokebox.position.set(0, 2.2, 3.6);
    smokebox.rotateX(-Math.PI * 0.5);
    loco.add(smokebox);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 1.4, 10), this.matDarkSteel);
    stack.position.set(0, 3.7, 2.8);
    loco.add(stack);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), matRailSteel);
    dome.position.set(0, 3.2, 0.8);
    loco.add(dome);

    const pilot = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.1, 4), this.matDarkSteel);
    pilot.rotation.y = Math.PI * 0.25;
    pilot.rotation.x = -Math.PI * 0.5;
    pilot.position.set(0, 0.7, 4.8);
    loco.add(pilot);

    // Brass glowing headlight
    const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 10), this.matDarkSteel);
    headlight.rotateX(Math.PI * 0.5);
    headlight.position.set(0, 3.3, 3.8);
    loco.add(headlight);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 10), matBrassLantern);
    lens.position.set(0, 3.3, 4.12);
    loco.add(lens);

    // Engineer Cab with Arched Windows
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.8), matLocoBoiler);
    cab.position.set(0, 2.7, -3.2);
    loco.add(cab);
    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 3.2), this.matDarkSteel);
    cabRoof.position.set(0, 4.05, -3.2);
    loco.add(cabRoof);

    // Attached Coal/Oil Tender Tank
    const tender = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 4.5), matLocoBoiler);
    tender.position.set(0, 2.0, -7.0);
    loco.add(tender);

    railGroup.add(loco);

    // 4. Historic Red Wood Boxcar ("PACIFIC FRUIT EXPRESS / SARDINES") (centered at z = +9)
    const boxcar = new THREE.Group();
    boxcar.position.set(0, 0.6, 9.5);

    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.8, 9.8), matBoxcarWood);
    carBody.position.set(0, 2.4, 0);
    boxcar.add(carBody);

    const carRoof = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.25, 10.1), this.matDarkSteel);
    carRoof.position.set(0, 3.85, 0);
    boxcar.add(carRoof);

    // Sliding center door frame
    [-1.4, 1.4].forEach(dx => {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 2.4), this.matDarkSteel);
      door.position.set(dx, 2.3, 0);
      boxcar.add(door);
    });

    // Boxcar Trucks (wheels)
    [-3.4, 3.4].forEach(bz => {
      [-1.0, 1.0].forEach(bx => {
        const carWheel = new THREE.Mesh(wheelGeo, this.matDarkSteel);
        carWheel.position.set(bx, 0.5, bz);
        boxcar.add(carWheel);
      });
    });

    railGroup.add(boxcar);

    // 5. Cast Iron Switch Target Lantern on Post
    const switchPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), this.matDarkSteel);
    switchPost.position.set(2.4, 1.2, 17);
    railGroup.add(switchPost);
    const switchTarget = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xd97706 }));
    switchTarget.position.set(2.4, 2.1, 17);
    railGroup.add(switchTarget);

    this.group.add(railGroup);
  }

  // 2. Pebble Beach Golf Links (Z = 8800m)
  buildPebbleBeachGolfLinks() {
    const transform = this.splineRoad.getRoadTransformAtZ(8800, -35, 0);
    const golf = new THREE.Group();
    golf.position.copy(transform.pos);
    golf.rotation.y = transform.heading;

    const green = new THREE.Mesh(new THREE.CylinderGeometry(18, 20, 0.4, 16), this.matGolfGreen);
    green.position.y = 0.2;
    golf.add(green);

    const bunker = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.5, 0.2, 8), this.matGolfSand);
    bunker.position.set(12, 0.25, 4);
    golf.add(bunker);

    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 4), this.matDarkSteel);
    pin.position.set(0, 1.6, 0);
    golf.add(pin);

    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), this.matGolfFlag);
    flag.position.set(0.4, 2.9, 0);
    golf.add(flag);

    this.group.add(golf);
  }

  // 2b. Monterey Bay Performance & Tuning Bay (Z = 9100m)
  buildMontereyTuningBay() {
    const shopGroup = new THREE.Group();
    const trans = this.splineRoad.getRoadTransformAtZ(9100, 32, 0);
    if (!trans) return;
    shopGroup.position.copy(trans.pos);
    shopGroup.rotation.y = trans.heading - Math.PI * 0.45;

    // Driveway Apron
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), this.renderer.createToonMaterial({ color: 0x24292f }));
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

    // Modern 2-Post Workshop Car Lift
    const liftGroup = new THREE.Group();
    liftGroup.position.set(-4.0, 0, 7);
    [-2.2, 2.2].forEach(lx => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 0.45), this.matDarkSteel);
      post.position.set(lx, 2.1, 0);
      liftGroup.add(post);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.22), matYellow);
      arm.position.set(lx > 0 ? lx - 0.7 : lx + 0.7, 0.85, 0);
      liftGroup.add(arm);
    });
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.35), this.matDarkSteel);
    crossBeam.position.set(0, 4.2, 0);
    liftGroup.add(crossBeam);
    shopGroup.add(liftGroup);

    // Workshop Building
    const building = new THREE.Mesh(new THREE.BoxGeometry(22, 6.5, 14), this.matCanneryRed);
    building.position.set(0, 3.25, -5.5);
    building.castShadow = true;
    shopGroup.add(building);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(23.5, 0.8, 15.5), this.matCanneryIron);
    roof.position.set(0, 6.7, -5.5);
    shopGroup.add(roof);

    // Neon Sign: "MONTEREY BAY TUNING & SERVICE"
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.5), this.matDarkSteel);
    signBoard.position.set(0, 8.2, -5.0);
    shopGroup.add(signBoard);

    const signNeon = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.7), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    signNeon.position.set(0, 8.2, -5.0);
    shopGroup.add(signNeon);

    this.group.add(shopGroup);
  }

  // 3. 17-Mile Drive & The Lone Cypress Scenic Turnout (Z = 9300m)
  buildTheLoneCypress() {
    const transform = this.splineRoad.getRoadTransformAtZ(9300, -42, 0);
    const turnout = new THREE.Group();
    turnout.position.copy(transform.pos);
    turnout.rotation.y = transform.heading;

    // Paved Scenic Pull-Off Loop
    const pavedApron = new THREE.Mesh(new THREE.PlaneGeometry(18, 48), this.renderer.createToonMaterial({ color: 0x374151 }));
    pavedApron.rotateX(-Math.PI * 0.5);
    pavedApron.position.set(0, 0.05, 0);
    turnout.add(pavedApron);

    // Stone Retaining Wall along Ocean Cliff
    const wallGeo = new THREE.BoxGeometry(0.6, 1.1, 46);
    const wall = new THREE.Mesh(wallGeo, this.matGraniteRock);
    wall.position.set(-8.5, 0.55, 0);
    turnout.add(wall);

    // Brass Observation Telescopes
    [-12, 0, 12].forEach(tz => {
      const scopeGroup = new THREE.Group();
      scopeGroup.position.set(-8.2, 0.6, tz);

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.1, 8), this.matCanneryIron);
      stand.position.y = 0.55;
      scopeGroup.add(stand);

      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 0.6, 8), this.matMissionBell);
      head.rotation.x = Math.PI * 0.5 - 0.2;
      head.position.set(0, 1.15, 0.1);
      scopeGroup.add(head);

      turnout.add(scopeGroup);
    });

    // Lone Cypress Sea Stack Rock offshore (-20m from turnout, so ~-52m from road)
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(14, 1), this.matGraniteRock);
    rock.scale.set(1.4, 1.8, 1.2);
    rock.position.set(-20, 14, 0);
    rock.castShadow = true;
    turnout.add(rock);

    const tree = new THREE.Group();
    tree.position.set(-20, 24, 0);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 9, 6), this.matPineTrunk);
    trunk.position.set(0, 4.5, 0);
    trunk.rotation.z = 0.25;
    tree.add(trunk);

    const foliageOffsets = [
      { x: 1.8, y: 7.5, z: 0, s: 2.8 },
      { x: 3.2, y: 9.2, z: 0.8, s: 2.2 },
      { x: 0.5, y: 8.8, z: -0.6, s: 1.8 }
    ];

    foliageOffsets.forEach(fo => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(fo.s * 0.8, fo.s, 0.9, 6), this.matPineFoliage);
      pad.position.set(fo.x, fo.y, fo.z);
      pad.scale.set(1.4, 0.6, 1.1);
      tree.add(pad);
    });

    turnout.add(tree);
    this.group.add(turnout);
  }

  // 4. Carmel Storybook Thatched Cottages (Z = 9700m - 9800m)
  buildCarmelStorybookCottages() {
    [9700, 9770, 9840].forEach((z, idx) => {
      const transform = this.splineRoad.getRoadTransformAtZ(z, 30, 0);
      const cottage = this.structureBuilder.buildStorybookCottage({
        width: idx === 1 ? 11.0 : 9.5,
        depth: 9.0,
        subterraneanDepth: 3.5,
        colorStucco: idx === 0 ? 0xfdf6e2 : (idx === 1 ? 0xf4ede1 : 0xfaebd7),
        colorThatch: idx === 1 ? 0x9a7a3a : 0x8a6844
      });
      cottage.position.copy(transform.pos);
      // Face front facade with stone chimney toward the road
      cottage.rotation.y = transform.heading + Math.PI * 0.5 - 0.25;
      this.group.add(cottage);
    });
  }

  // 5. Carmel Mission Basilica (Z = 10100m)
  buildCarmelMissionBasilica() {
    const transform = this.splineRoad.getRoadTransformAtZ(10100, 36, 0);
    const mission = this.structureBuilder.buildMissionBasilica({
      width: 19.0,
      depth: 30.0,
      subterraneanDepth: 4.0,
      colorWall: 0xe8d5b5,
      colorTile: 0xc04928
    });
    mission.position.copy(transform.pos);
    // Orient portal and bell tower toward the turnout and road
    mission.rotation.y = transform.heading + Math.PI * 0.5 - 0.2;
    this.group.add(mission);
  }


  // 6. Monterey Pines & Coastal Dunes Groundcover (Z = 7820 - 10380m)
  buildMontereyPinesAndIcePlant() {
    const icePlantGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const matIcePlant = this.renderer.createToonMaterial({ color: 0xe0407a, gradientBands: 2 });
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const pineCount = isMobile ? 65 : 130;
    const zStep = isMobile ? 39.0 : 19.5;

    for (let i = 0; i < pineCount; i++) {
      const z = 7820 + i * zStep + (Math.random() - 0.5) * 8;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (22.0 + Math.random() * 28);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const pine = new THREE.Group();
      pine.position.copy(transform.pos);
      pine.rotation.y = transform.heading;

      const h = 9.0 + Math.random() * 5.5;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, h, 6), this.matPineTrunk);
      trunk.position.y = h * 0.5;
      pine.add(trunk);

      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8, 1), this.matPineFoliage);
      crown.position.y = h + 1.8;
      crown.scale.set(1.3, 0.9, 1.2);
      pine.add(crown);

      this.group.add(pine);

      // Pink Ice Plant Groundcover along the roadside
      if (Math.random() > 0.4) {
        const ice = new THREE.Mesh(icePlantGeo, matIcePlant);
        const iceLat = side * (18.5 + Math.random() * 8.0);
        const iceTrans = this.splineRoad.getRoadTransformAtZ(z + (Math.random() - 0.5) * 6, iceLat, 0.2);
        ice.position.copy(iceTrans.pos);
        ice.scale.set(1.6, 0.4, 1.6);
        this.group.add(ice);
      }
    }
  }

  // 7. Monterey Highway Signage
  buildMontereyHighwaySignage() {
    const signs = [
      { z: 7850, text: 'MONTEREY BAY & CARMEL\nCANNERY ROW 3 MI' },
      { z: 8250, text: 'HISTORIC CANNERY ROW\nMONTEREY BAY AQUARIUM' },
      { z: 8750, text: '17-MILE DRIVE\nPEBBLE BEACH GOLF LINKS' },
      { z: 9650, text: 'CARMEL-BY-THE-SEA\nCARMEL MISSION BASILICA 1797' }
    ];

    signs.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, 19.5, 0);
      const signGroup = new THREE.Group();
      signGroup.position.copy(transform.pos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      signGroup.rotateY(Math.PI); // Face oncoming traffic!
      signGroup.rotateY(-0.60); // Angled ~35° inward toward highway lanes for direct sightline

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.matDarkSteel);
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

  // Full Cannery Row Commercial Streetscape — Aquarium, Bubba Gump, Sardine Factory (Z=8250–8380m)
  buildCanneryRowStreetscape() {
    // Monterey Bay Aquarium — ocean side (X=-36)
    const aquariumT = this.splineRoad.getRoadTransformAtZ(8300, -36, 0);
    const aquarium = new THREE.Group();
    aquarium.position.copy(aquariumT.pos);
    aquarium.rotation.y = aquariumT.heading - 0.15;

    // Reconstructed Aquarium main hall with authentic industrial factory architecture
    const aquaFactory = this.structureBuilder.buildCanneryFactory({
      width: 30.0,
      depth: 22.0,
      height: 12.0,
      colorBrick: 0x4a525d,
      colorRoof: 0x242d35,
      subterraneanDepth: 4.0
    });
    aquarium.add(aquaFactory);

    // Modern glass atrium addition
    const atrium = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x6abcce, transparent: true, opacity: 0.7 }));
    atrium.position.set(-10, 5, 10);
    aquarium.add(atrium);

    // Blue + white Aquarium banners
    for (let bx = -10; bx <= 10; bx += 10) {
      const banner = new THREE.Mesh(new THREE.BoxGeometry(2.0, 6.5, 0.22), this.matAquariumBlue);
      banner.position.set(bx, 10.5, 9.2);
      aquarium.add(banner);
      const bannerStripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.28),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      bannerStripe.position.set(bx, 12.5, 9.2);
      aquarium.add(bannerStripe);
    }

    // Outdoor tide pool tank
    const tidePool = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 7),
      this.renderer.createToonMaterial({ color: 0x3a5a5a, gradientBands: 2 }));
    tidePool.position.set(0, 0.4, 11);
    aquarium.add(tidePool);
    const tideWater = new THREE.Mesh(new THREE.PlaneGeometry(20, 5.5),
      new THREE.MeshBasicMaterial({ color: 0x0077aa, transparent: true, opacity: 0.75 }));
    tideWater.rotateX(-Math.PI * 0.5);
    tideWater.position.set(0, 0.82, 11);
    aquarium.add(tideWater);

    this.group.add(aquarium);

    // Bubba Gump Shrimp Co. — inland side (X=+32)
    const bubbaT = this.splineRoad.getRoadTransformAtZ(8270, 32, 0);
    const bubba = new THREE.Group();
    bubba.position.copy(bubbaT.pos);
    // Face across street toward oncoming traffic
    bubba.rotation.y = bubbaT.heading - Math.PI * 0.5 - 0.22;

    const bubbaShack = this.structureBuilder.buildCoastalSeafoodShack({
      width: 18.0,
      depth: 14.0,
      height: 8.0,
      colorSiding: 0x8a4b38,
      colorRoof: 0x4a3828,
      subterraneanDepth: 3.5
    });
    bubba.add(bubbaShack);

    // Fishing net decoration on front facade
    const net = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 0.12),
      this.renderer.createToonMaterial({ color: 0x8a7050, gradientBands: 2 }));
    net.position.set(0, 5, 7.1);
    bubba.add(net);
    // Yellow lettered sign
    const bubbaSign = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 0.4),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    bubbaSign.position.set(0, 9.3, 7.1);
    bubba.add(bubbaSign);
    const bubbaSignNeon = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.75, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xf5c518 }));
    bubbaSignNeon.position.set(0, 9.3, 7.2);
    bubba.add(bubbaSignNeon);
    // "RUN FORREST RUN" bench out front
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.7),
      this.renderer.createToonMaterial({ color: 0x8b6914, gradientBands: 2 }));
    bench.position.set(0, 0.62, 9.0);
    bubba.add(bench);
    const benchLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.7),
      this.renderer.createToonMaterial({ color: 0x8b6914, gradientBands: 2 }));
    benchLeg.position.set(-0.8, 0.31, 9.0);
    bubba.add(benchLeg);
    const benchLeg2 = benchLeg.clone();
    benchLeg2.position.set(0.8, 0.31, 9.0);
    bubba.add(benchLeg2);

    this.group.add(bubba);

    // Sardine Factory — Victorian storefront (X=+34, Z=8350)
    const sardineT = this.splineRoad.getRoadTransformAtZ(8350, 34, 0);
    const sardine = new THREE.Group();
    sardine.position.copy(sardineT.pos);
    // Face across street toward oncoming traffic
    sardine.rotation.y = sardineT.heading - Math.PI * 0.5 - 0.22;

    const sardineBuilding = this.structureBuilder.buildCommercialBuilding({
      width: 14.0,
      depth: 11.0,
      stories: 2,
      storyHeight: 3.6,
      colorWall: 0xf5eedc,
      colorTrim: 0x2e5c1a,
      subterraneanDepth: 3.5
    });
    sardine.add(sardineBuilding);

    // Green awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 2.5),
      this.renderer.createToonMaterial({ color: 0x2e5c1a, gradientBands: 2 }));
    awning.position.set(0, 3.5, 6.5);
    sardine.add(awning);
    // Gas lamp posts
    [-4, 4].forEach(lx => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6),
        this.matDarkSteel);
      lamp.position.set(lx, 1.75, 6.2);
      sardine.add(lamp);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffee88 }));
      globe.position.set(lx, 3.7, 6.2);
      sardine.add(globe);
    });

    this.group.add(sardine);

    // Parking garage — 4-story at Z=8380, X=+26
    const garageT = this.splineRoad.getRoadTransformAtZ(8380, 26, 0);
    const garage = new THREE.Group();
    garage.position.copy(garageT.pos);
    garage.rotation.y = garageT.heading - Math.PI * 0.5 - 0.22;


    const garageBody = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 18),
      this.renderer.createToonMaterial({ color: 0x9aa0a8, gradientBands: 2 }));
    garageBody.position.y = 8;
    garage.add(garageBody);
    // Level stripe details
    for (let lev = 1; lev <= 3; lev++) {
      const levelStripe = new THREE.Mesh(new THREE.BoxGeometry(22.5, 0.35, 0.28),
        this.renderer.createToonMaterial({ color: 0x6a7080, gradientBands: 2 }));
      levelStripe.position.set(0, lev * 4, 9.1);
      garage.add(levelStripe);
    }

    this.group.add(garage);
  }

  // Old Fisherman's Wharf — chowder shacks, whale watching, fish market (Z=8150m, X=-38)
  buildOldFishmansWharf() {
    const transform = this.splineRoad.getRoadTransformAtZ(8150, -38, 0);
    const wharf = new THREE.Group();
    wharf.position.copy(transform.pos);
    wharf.rotation.y = transform.heading;

    // Pier deck extending into the ocean
    const pierDeck = new THREE.Mesh(new THREE.PlaneGeometry(10, 70), this.matPierWood);
    pierDeck.rotateX(-Math.PI * 0.5);
    pierDeck.position.set(0, 0.08, 0);
    wharf.add(pierDeck);

    // Wooden pilings
    for (let pz = -30; pz <= 30; pz += 10) {
      [-4.5, 4.5].forEach(px => {
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), this.matPierWood);
        piling.position.set(px, -2.5, pz);
        wharf.add(piling);
      });
    }

    // 4 Chowder shacks along the pier
    const shackData = [
      { z: -22, name: 'CHOWDER', col: 0xf5e8c8 },
      { z: -8,  name: 'CLAM CO', col: 0xc8d8e8 },
      { z: 8,   name: 'SEAFOOD', col: 0xe8c8c8 },
      { z: 22,  name: 'FISH MKT', col: 0xd8e8c8 },
    ];
    shackData.forEach(s => {
      const shack = this.structureBuilder.buildCoastalSeafoodShack({
        width: 6.0,
        depth: 5.0,
        height: 3.8,
        colorSiding: s.col,
        colorRoof: 0x3d4a3d,
        subterraneanDepth: 2.0
      });
      shack.position.set(0, 0, s.z);
      wharf.add(shack);

      // "CHOWDER IN A SOURDOUGH BOWL" sign
      const chowSign = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.7, 0.2),
        this.renderer.createToonMaterial({ color: 0x8b3a2e, gradientBands: 2 }));
      chowSign.position.set(0, 4.3, s.z + 2.5);
      wharf.add(chowSign);
    });

    // Whale watching charter office at pier start
    const charterOffice = this.structureBuilder.buildCoastalSeafoodShack({
      width: 8.0,
      depth: 6.5,
      height: 4.8,
      colorSiding: 0x1e3a5f,
      colorRoof: 0x2e3b4e,
      subterraneanDepth: 2.0
    });
    charterOffice.position.set(0, 0, -33);
    wharf.add(charterOffice);

    const charterSign = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 0.3), this.matChowderWhite);
    charterSign.position.set(0, 5.9, -30.2);
    wharf.add(charterSign);
    const charterNeon = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    charterNeon.position.set(0, 5.9, -30.1);
    wharf.add(charterNeon);

    this.group.add(wharf);
  }

  // Carmel-by-the-Sea Storybook Village Shops (Z=9700–9820m, X=+28)
  buildCarmelVillageShops() {
    const shopData = [
      { z: 9705, xOff: 28, type: 'tuck_box', label: 'TUCK BOX TEA', neonCol: 0xf5c842 },
      { z: 9735, xOff: 28, type: 'pine_inn', label: 'PINE INN HOTEL', neonCol: 0xffffff },
      { z: 9765, xOff: 28, type: 'gallery', label: 'GALLERY', neonCol: 0x88ccff },
      { z: 9795, xOff: 28, type: 'wine', label: 'WINE TASTING', neonCol: 0xd4a0d4 },
      { z: 9820, xOff: 28, type: 'arts', label: 'CARMEL ARTS', neonCol: 0x7ee8a2 },
    ];

    shopData.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, s.xOff, 0);
      const shop = new THREE.Group();
      shop.position.copy(transform.pos);
      // Face across street angled 35 deg toward oncoming traffic
      shop.rotation.y = transform.heading - Math.PI * 0.5 - 0.55;


      let bldg;
      if (s.type === 'tuck_box') {
        bldg = this.structureBuilder.buildStorybookCottage({
          width: 9.5,
          depth: 8.5,
          colorStucco: 0xfdf5e0,
          colorThatch: 0x9a7a3a,
          subterraneanDepth: 3.5
        });
      } else if (s.type === 'pine_inn') {
        bldg = this.structureBuilder.buildVictorianHouse({
          width: 12.0,
          depth: 14.0,
          stories: 3,
          storyHeight: 3.0,
          subterraneanDepth: 3.5,
          palette: {
            body: 0xf0ede4,
            trim: 0xffffff,
            accent: 0x3a4a50,
            roof: 0x242d32,
            foundation: 0x6e6863,
            door: 0x5c381e,
            glass: 0x1c2b36,
            hardware: 0xd4af37
          }
        });
      } else if (s.type === 'wine') {
        bldg = this.structureBuilder.buildWineryChateau({
          width: 10.0,
          depth: 9.0,
          height: 6.5,
          colorStone: 0xc8b898,
          colorTile: 0xa8422b,
          subterraneanDepth: 3.5
        });
      } else {
        bldg = this.structureBuilder.buildStorybookCottage({
          width: 10.0,
          depth: 9.0,
          colorStucco: s.type === 'gallery' ? 0xd8c8b8 : 0xf0f0ea,
          colorThatch: s.type === 'gallery' ? 0x4a3020 : 0x3a3840,
          subterraneanDepth: 3.5
        });
      }
      shop.add(bldg);

      // Carved wooden shop sign (no neon — Carmel ordinance bans it, soft warm painted sign)
      const signZ = s.type === 'pine_inn' ? 7.6 : (s.type === 'tuck_box' ? 4.9 : 5.2);
      const signPlank = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.9, 0.25), this.matCarmelThatch);
      signPlank.position.set(0, 5.2, signZ);
      shop.add(signPlank);
      const signText = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 0.32),
        new THREE.MeshBasicMaterial({ color: s.neonCol }));
      signText.position.set(0, 5.2, signZ + 0.05);
      shop.add(signText);

      // Wine barrel planter by the door (wine tasting shop only)

      if (s.label === 'WINE TASTING') {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.3, 10), this.matWineBarrel);
        barrel.position.set(4.0, 0.65, 5.0);
        shop.add(barrel);
      }


      // Free angle parking (no meters!)
      if (s.z === 9765) {
        const parkStreetApron = new THREE.Mesh(new THREE.PlaneGeometry(8, 130), this.matAsphaltLot);
        parkStreetApron.rotateX(-Math.PI * 0.5);
        parkStreetApron.position.set(-9, 0.04, 60);
        shop.add(parkStreetApron);
      }


      this.group.add(shop);
    });

    // Oak tree canopy (Carmel's trademark)
    const oakCrownGeo = new THREE.DodecahedronGeometry(4.5, 1);
    const matOakCrown = this.renderer.createToonMaterial({ color: 0x2a5a1a, gradientBands: 3 });
    const matOakTrunk = this.renderer.createToonMaterial({ color: 0x5c4030, gradientBands: 2 });
    [9710, 9745, 9775, 9805, 9828].forEach(z => {
      const t = this.splineRoad.getRoadTransformAtZ(z, 19.5, 0);
      const oak = new THREE.Group();
      oak.position.copy(t.pos);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 6, 6), matOakTrunk);
      trunk.position.y = 3;
      oak.add(trunk);
      const crown = new THREE.Mesh(oakCrownGeo, matOakCrown);
      crown.position.y = 8.5;
      crown.scale.set(1.5, 0.7, 1.4);
      oak.add(crown);
      this.group.add(oak);
    });
  }

  // Pebble Beach 17-Mile Drive Entry Gatehouse (Z=8800m, X=+20)
  build17MileDriveGatehouse() {
    const transform = this.splineRoad.getRoadTransformAtZ(8800, 20, 0);
    const gate = new THREE.Group();
    gate.position.copy(transform.pos);
    gate.rotation.y = transform.heading - 0.3;

    // Stone gatehouse body
    const gatehouse = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.5, 4.5), this.matGraniteGate);
    gatehouse.position.y = 2.25;
    gate.add(gatehouse);

    // Green tiled hip roof
    const gateRoof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 2.2, 4),
      this.renderer.createToonMaterial({ color: 0x2e5a2a, gradientBands: 2 }));
    gateRoof.position.y = 5.75;
    gateRoof.rotation.y = Math.PI * 0.25;
    gate.add(gateRoof);

    // "PEBBLE BEACH" carved lettering panel
    const letterPanel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 0.35), this.matGraniteRock);
    letterPanel.position.set(0, 2.5, 2.35);
    gate.add(letterPanel);
    const letterNeon = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 0.45),
      new THREE.MeshBasicMaterial({ color: 0xf5c842 }));
    letterNeon.position.set(0, 2.5, 2.4);
    gate.add(letterNeon);

    // Fee kiosk window recess
    const window = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x3a5a6a, transparent: true, opacity: 0.8 }));
    window.position.set(0, 2.8, 2.36);
    gate.add(window);

    // Swing arm barrier
    const armBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), this.matGraniteGate);
    armBase.position.set(4, 0.6, 0);
    gate.add(armBase);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 14),
      new THREE.MeshBasicMaterial({ color: 0xee4444 }));
    arm.position.set(4, 1.6, 7);
    arm.rotation.z = 0.3; // slightly raised
    gate.add(arm);

    // Stone wall extending from gatehouse
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 28), this.matGraniteGate);
    wallL.position.set(-16, 0.55, 0);
    gate.add(wallL);

    this.group.add(gate);
  }

  // Carmel Mission Basilica Small Free Parking Lot (Z=10100–10140m, X=+30)
  buildCarmelMissionParking() {
    const transform = this.splineRoad.getRoadTransformAtZ(10120, 30, 0);
    const parking = new THREE.Group();
    parking.position.copy(transform.pos);
    parking.rotation.y = transform.heading - 0.3;

    // Asphalt lot
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(28, 22), this.matAsphaltLot);
    lot.rotateX(-Math.PI * 0.5);
    lot.position.set(0, 0.05, 0);
    parking.add(lot);

    // White parking stripes
    const matStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 8; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 5.5), matStripe);
      stripe.rotateX(-Math.PI * 0.5);
      stripe.position.set((i - 3.5) * 3.3, 0.06, 8);
      parking.add(stripe);
    }

    // Free parking wooden sign
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 6), this.matParkBrown);
    signPost.position.set(-12, 1.4, -9);
    parking.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.2, 0.22), this.matParkBrown);
    signBoard.position.set(-12, 2.8, -9);
    parking.add(signBoard);
    const signFace = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.85, 0.3), this.matChowderWhite);
    signFace.position.set(-12, 2.8, -8.9);
    parking.add(signFace);

    // Stone garden wall on far side (Mission compound)
    const compoundWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 30), this.matCarmelStone);
    compoundWall.position.set(13, 0.9, 0);
    parking.add(compoundWall);

    // Stone fountain at garden entrance
    const basinRim = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.7, 10), this.matCarmelStone);
    basinRim.position.set(10, 0.35, -10);
    parking.add(basinRim);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.2, 6), this.matCarmelStone);
    stem.position.set(10, 1.05, -10);
    parking.add(stem);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), this.matCarmelStone);
    bowl.position.set(10, 1.7, -10);
    parking.add(bowl);

    this.group.add(parking);
  }

  update(dt) {}
}
