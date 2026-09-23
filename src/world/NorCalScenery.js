import * as THREE from 'three';
import { ProceduralStructureBuilder, PAINTED_LADIES_PALETTES } from './ProceduralArchitecture.js';

export class NorCalSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded NorCal & SF Materials
    this.matBridgeOrange = renderer.createToonMaterial({ color: 0xf04824, gradientBands: 3 });
    this.matBridgeCable = renderer.createToonMaterial({ color: 0xd63d1a, gradientBands: 2 });
    this.matBeaconRed = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    this.matVictorianPastel1 = renderer.createToonMaterial({ color: 0x90caf9, gradientBands: 2 });
    this.matVictorianPastel2 = renderer.createToonMaterial({ color: 0xffcc80, gradientBands: 2 });
    this.matVictorianPastel3 = renderer.createToonMaterial({ color: 0xa5d6a7, gradientBands: 2 });
    this.matVictorianTrim = renderer.createToonMaterial({ color: 0xffffff, gradientBands: 2 });
    this.matVictorianRoof = renderer.createToonMaterial({ color: 0x37474f, gradientBands: 2 });

    this.matCableCarGreen = renderer.createToonMaterial({ color: 0x2e7d32, gradientBands: 2 });
    this.matCableCarRed = renderer.createToonMaterial({ color: 0xc62828, gradientBands: 2 });
    this.matDarkSteel = renderer.createToonMaterial({ color: 0x263238, gradientBands: 2 });

    this.matBunkerConcrete = renderer.createToonMaterial({ color: 0x78909c, gradientBands: 3 });
    this.matChateauStone = renderer.createToonMaterial({ color: 0xd7ccc8, gradientBands: 3 });
    this.matChateauTile = renderer.createToonMaterial({ color: 0xa8422b, gradientBands: 3 });
    // Cel-Shaded NorCal Materials with Procedural PBR Textures & Normal Maps
    const oakBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('oak', 256) : null;
    const oakBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('oak', 256) : null;
    const oakFoliageDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('oak', 256) : null;
    const oakFoliageNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('oak', 256) : null;
    const stoneNorm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;
    const woodNorm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;
    const plankDriftDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('driftwood', 256) : null;
    const plankDriftNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('driftwood', 256) : null;

    this.matVineGreen = renderer.createToonMaterial({ color: 0x33691e, gradientBands: 2 });

    this.matChurchWhite = renderer.createToonMaterial({ color: 0xf5f5f5, gradientBands: 3, normalMap: stoneNorm });
    this.matEucalyptusTrunk = renderer.createToonMaterial({ color: 0xb0bec5, gradientBands: 2, map: oakBarkDiff, normalMap: oakBarkNorm });
    this.matEucalyptusFoliage = renderer.createToonMaterial({ color: 0x546e7a, gradientBands: 3, map: oakFoliageDiff, normalMap: oakFoliageNorm });

    this.matSignGreen = renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 });
    this.matWhiteSign = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });

    this.matSausalitoWhite = renderer.createToonMaterial({ color: 0xf0ede8, gradientBands: 2 });
    this.matSausalitoBlue = renderer.createToonMaterial({ color: 0x1e4a7a, gradientBands: 2 });
    this.matSausalitoTeal = renderer.createToonMaterial({ color: 0x2a7a6a, gradientBands: 2 });
    this.matHouseboat = renderer.createToonMaterial({ color: 0x7a8a6a, gradientBands: 2, normalMap: woodNorm });
    this.matWineryStone = renderer.createToonMaterial({ color: 0x8a7a68, gradientBands: 3, normalMap: stoneNorm });
    this.matWineryIvy = renderer.createToonMaterial({ color: 0x2a5a1a, gradientBands: 2 });
    this.matVineRow = renderer.createToonMaterial({ color: 0x3a6a2a, gradientBands: 2 });
    this.matCrabBoat = renderer.createToonMaterial({ color: 0xc87a30, gradientBands: 2 });
    this.matWharfWood = renderer.createToonMaterial({ color: 0x8a7060, gradientBands: 2, map: plankDriftDiff, normalMap: plankDriftNorm });
    this.matWharfBlue = renderer.createToonMaterial({ color: 0x1a4a8a, gradientBands: 2 });
    this.matAsphaltLot = renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matGravel = renderer.createToonMaterial({ color: 0x9a8a78, gradientBands: 2 });

    this.buildNorCalEnvironment();
  }

  buildNorCalEnvironment() {
    this.buildPaintedLadiesVictorians();
    this.buildSFCableCar();
    this.buildMarinHeadlandsBunkers();
    this.buildGoldenGateBridgeStructure();
    this.buildSonomaVineyardEstate();
    this.buildBodegaBayChurch();
    this.buildEucalyptusGroves();
    this.buildMarinVistaParkingLot();
    this.buildSausalitoWaterfrontStreet();
    this.buildSonomaWineryTastingRooms();
    this.buildBodegaBayWaterfront();
    this.buildNorCalHighwaySignage();
  }

  // 1. San Francisco "Painted Ladies" Victorian Row Houses (Z = 10800m)
  buildPaintedLadiesVictorians() {
    const transform = this.splineRoad.getRoadTransformAtZ(10800, 36, 0);
    const rowGroup = new THREE.Group();
    rowGroup.position.copy(transform.pos);
    // Face towards the road and turnout (angle +92 deg toward road, tilted slightly toward oncoming traffic)
    rowGroup.rotation.y = transform.heading + Math.PI * 0.5 - 0.25;

    // Alamo Square Streetscape Materials
    const matSidewalk = this.renderer.createToonMaterial({ color: 0xd6d3cb, gradientBands: 2 });
    const matRetainingWall = this.renderer.createToonMaterial({ color: 0x475569, gradientBands: 3 });
    const matCurb = this.renderer.createToonMaterial({ color: 0x94a3b8, gradientBands: 2 });
    const matLampPost = this.renderer.createToonMaterial({ color: 0x111827, gradientBands: 2 });
    const matLanternGlow = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const matIronFence = this.renderer.createToonMaterial({ color: 0x1f2937, gradientBands: 2 });
    const matBoxwood = this.renderer.createToonMaterial({ color: 0x365314, gradientBands: 3 });
    const matRoseFlower = this.renderer.createToonMaterial({ color: 0xf43f5e, gradientBands: 2 });

    // 1. Build the iconic 5-House "Postcard Row"
    const houseCount = 5;
    const houseSpacing = 10.4;

    for (let h = 0; h < houseCount; h++) {
      const houseX = (h - 2) * houseSpacing;
      // Steiner Street hill incline: stepped elevation along Alamo Square
      const houseY = (h - 2) * 0.7;
      const palette = PAINTED_LADIES_PALETTES[h % PAINTED_LADIES_PALETTES.length];
      const baySide = h % 2 === 0 ? 'right' : 'left';

      const victorianHouse = this.structureBuilder.buildVictorianHouse({
        palette,
        width: 9.0,
        depth: 13.0,
        stories: 3,
        storyHeight: 3.1,
        foundationHeight: 1.5,
        subterraneanDepth: 4.8, // Deep foundation anchor prevents any floating on hillside
        baySide,
        hasGableOrnament: true,
        hasPorchRailings: true
      });

      victorianHouse.position.set(houseX, houseY, 0);
      rowGroup.add(victorianHouse);

      // Garden Boxwood Shrubs flanking each stoop
      const porchSideSign = baySide === 'right' ? -1 : 1;
      const porchX = houseX + porchSideSign * 2.2;
      [-1.6, 1.6].forEach(sx => {
        const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), matBoxwood);
        shrub.position.set(porchX + sx, houseY + 0.55, 8.8);
        shrub.castShadow = true;
        rowGroup.add(shrub);

        // Blooming roses on shrub tops
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), matRoseFlower);
        flower.position.set(porchX + sx, houseY + 1.1, 8.8);
        rowGroup.add(flower);
      });

      // Wrought Iron Front Yard Railing
      const fenceW = 4.2;
      const fenceX = houseX - porchSideSign * 2.2;
      const fenceZ = 8.5;
      const fence = new THREE.Mesh(new THREE.BoxGeometry(fenceW, 0.85, 0.08), matIronFence);
      fence.position.set(fenceX, houseY + 0.45, fenceZ);
      rowGroup.add(fence);
    }

    // 2. Alamo Square Pedestrian Terrace & Sidewalk Promenade
    const terraceW = 56.0;
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(terraceW, 4.0, 7.5), matRetainingWall);
    terrace.position.set(0, -1.8, 6.2);
    terrace.receiveShadow = true;
    rowGroup.add(terrace);

    const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(terraceW - 2.0, 0.25, 4.4), matSidewalk);
    sidewalk.position.set(0, 0.12, 7.2);
    sidewalk.receiveShadow = true;
    rowGroup.add(sidewalk);

    const curb = new THREE.Mesh(new THREE.BoxGeometry(terraceW - 2.0, 0.35, 0.35), matCurb);
    curb.position.set(0, 0.16, 9.45);
    rowGroup.add(curb);

    // 3. Ornate Victorian Cast-Iron Streetlamps along the Sidewalk
    for (let lx = -22; lx <= 22; lx += 11) {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lx, 0.2, 8.8);

      // Fluted Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 3.8, 8), matLampPost);
      pole.position.y = 1.9;
      pole.castShadow = true;
      lampGroup.add(pole);

      // Base Plinth
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 8), matLampPost);
      base.position.y = 0.25;
      lampGroup.add(base);

      // Lantern Bracket & Cage
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.55), matLampPost);
      bracket.position.y = 3.75;
      lampGroup.add(bracket);

      const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.65, 6), matLanternGlow);
      lanternGlass.position.y = 4.1;
      lampGroup.add(lanternGlass);

      const lanternRoof = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.4, 6), matLampPost);
      lanternRoof.position.y = 4.55;
      lampGroup.add(lanternRoof);

      rowGroup.add(lampGroup);
    }

    this.group.add(rowGroup);
  }

  // 2. San Francisco Historic Wooden Cable Car (Z = 11100m)
  buildSFCableCar() {
    const transform = this.splineRoad.getRoadTransformAtZ(11100, 24, 0);
    const carGroup = new THREE.Group();
    carGroup.position.copy(transform.pos);
    carGroup.rotation.y = transform.heading;

    const bodyLower = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 8.5), this.matCableCarGreen);
    bodyLower.position.y = 1.0;
    carGroup.add(bodyLower);

    const bodyUpper = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 8.0), this.matCableCarRed);
    bodyUpper.position.y = 2.5;
    carGroup.add(bodyUpper);

    this.group.add(carGroup);
  }

  // 3. Marin Headlands Artillery Bunkers (Z = 11400m)
  buildMarinHeadlandsBunkers() {
    const transform = this.splineRoad.getRoadTransformAtZ(11400, -42, 0);
    const bunker = new THREE.Group();
    bunker.position.copy(transform.pos);
    bunker.rotation.y = transform.heading + 0.4;

    const fortress = new THREE.Mesh(new THREE.BoxGeometry(22, 6, 16), this.matBunkerConcrete);
    fortress.position.y = 3;
    bunker.add(fortress);

    this.group.add(bunker);
  }

  // 4. Golden Gate Suspension Bridge Structure (Z = 11700m)
  buildGoldenGateBridgeStructure() {
    const transform = this.splineRoad.getRoadTransformAtZ(11700, 0, 0);
    const ggb = new THREE.Group();
    ggb.position.copy(transform.pos);
    ggb.rotation.y = transform.heading;

    // 1. Two 746-Foot Art Deco International Orange Towers along span
    [-65, 65].forEach(tz => {
      const tower = new THREE.Group();
      tower.position.set(0, 0, tz);

      // Deep Water Oval Concrete Fender Caissons / Piers (anchored into SF Bay floor: Y = -22m to 2m)
      [-19.5, 19.5].forEach(lx => {
        const caisson = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.8, 26, 12), this.matBunkerConcrete);
        caisson.position.set(lx, -11, 0);
        caisson.scale.set(1.0, 1.0, 1.6);
        tower.add(caisson);
      });

      // Left and Right Legs of the Tower (outside the 32m road width: +/-19.5m)
      [-19.5, 19.5].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(3.8, 125, 4.8), this.matBridgeOrange);
        leg.position.set(lx, 42.5, 0);
        tower.add(leg);

        // Tower Top Aviation Flashing Red Beacon
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.9, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff1515 })
        );
        beacon.position.set(lx, 105.8, 0);
        tower.add(beacon);
      });

      // Art Deco Portal Cross-Bracing Struts
      for (let y = 22; y <= 100; y += 18) {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(36, 4.2, 4.2), this.matBridgeOrange);
        strut.position.set(0, y, 0);
        tower.add(strut);
      }

      ggb.add(tower);
    });

    // 2. Roadway Steel Stiffening Truss Framework (Under the road deck: Y = -1.8m to -5.5m)
    const trussDeck = new THREE.Mesh(new THREE.BoxGeometry(35.5, 3.2, 340), this.matBridgeCable);
    trussDeck.position.set(0, -1.6, 0);
    ggb.add(trussDeck);

    // 3. Sweeping Catenary Main Suspension Cables (Left and Right: +/-19.5m)
    [-19.5, 19.5].forEach(cableX => {
      const cablePoints = [];
      const SPAN = 320;
      const numSegments = 40;

      for (let s = 0; s <= numSegments; s++) {
        const cz = -SPAN * 0.5 + (s / numSegments) * SPAN;
        let cy = 0;

        // Catenary curve profile across center span and side backstays
        if (Math.abs(cz) <= 65) {
          // Center main span sag between the two towers
          const normZ = cz / 65; // -1 to +1
          cy = 14 + Math.pow(normZ, 2) * (105 - 14);
        } else {
          // Side backstay drape down to the anchorages
          const sideNorm = (Math.abs(cz) - 65) / (SPAN * 0.5 - 65);
          cy = 105 - Math.pow(sideNorm, 0.85) * (105 - 6);
        }

        cablePoints.push(new THREE.Vector3(cableX, cy, cz));

        // Vertical Wire Suspenders connecting main cable to roadway deck
        if (s % 2 === 0 && cy > 4.5 && Math.abs(cz) < 135) {
          const suspenderHeight = Math.max(1, cy - 1.5);
          const suspender = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, suspenderHeight, 6),
            this.matBridgeOrange
          );
          suspender.position.set(cableX, 1.5 + suspenderHeight * 0.5, cz);
          ggb.add(suspender);
        }
      }

      const mainCableCurve = new THREE.CatmullRomCurve3(cablePoints);
      const cableGeo = new THREE.TubeGeometry(mainCableCurve, 48, 0.42, 8, false);
      const cableMesh = new THREE.Mesh(cableGeo, this.matBridgeOrange);
      ggb.add(cableMesh);
    });

    // 4. Bridge Side Railings (along road edge: +/-16.4m)
    [-16.4, 16.4].forEach(cx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 340), this.matBridgeOrange);
      rail.position.set(cx, 1.2, 0);
      ggb.add(rail);
    });

    // 5. San Francisco Bay Maritime Traffic (Cruising underneath the bridge on water at Y = -22m relative to road)
    // A. Cargo Container Ship sailing east into San Francisco Bay
    const cargoShip = new THREE.Group();
    cargoShip.position.set(65, -21.5, 12);
    cargoShip.rotation.y = Math.PI * 0.5;

    const shipHull = new THREE.Mesh(new THREE.BoxGeometry(16, 8.5, 68), this.matDarkSteel);
    shipHull.position.y = 4.2;
    cargoShip.add(shipHull);

    // Colorful cargo container stacks
    const containerColors = [this.matVictorianPastel1, this.matVictorianPastel2, this.matVictorianPastel3, this.matBridgeOrange];
    for (let cx = -4.5; cx <= 4.5; cx += 4.5) {
      for (let cz = -22; cz <= 18; cz += 9.5) {
        const cStack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 5.5, 8.5), containerColors[Math.floor(Math.random() * containerColors.length)]);
        cStack.position.set(cx, 10.5, cz);
        cargoShip.add(cStack);
      }
    }
    // Ship Bridge Superstructure
    const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(12, 14, 10), this.matChurchWhite);
    bridgeTower.position.set(0, 14.5, 26);
    cargoShip.add(bridgeTower);
    ggb.add(cargoShip);

    // B. White Sailboats in San Francisco Bay & Pacific Gate
    [
      { x: -75, z: -85, rot: 0.6 },
      { x: -110, z: 95, rot: -0.8 },
      { x: 125, z: -45, rot: 1.4 },
      { x: 95, z: 120, rot: -2.1 }
    ].forEach(s => {
      const sailboat = new THREE.Group();
      sailboat.position.set(s.x, -21.8, s.z);
      sailboat.rotation.y = s.rot;

      const boatHull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 11), this.matChurchWhite);
      boatHull.position.y = 0.9;
      sailboat.add(boatHull);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 14, 6), this.matDarkSteel);
      mast.position.set(0, 7.5, 0);
      sailboat.add(mast);

      // Triangular Sail
      const sailGeo = new THREE.BufferGeometry();
      const sailVerts = new Float32Array([
        0, 1.5, -4.5,
        0, 13.5, 0,
        0, 1.5, 3.5
      ]);
      sailGeo.setAttribute('position', new THREE.BufferAttribute(sailVerts, 3));
      sailGeo.computeVertexNormals();
      const sail = new THREE.Mesh(sailGeo, new THREE.MeshBasicMaterial({ color: 0xfefefe, side: THREE.DoubleSide }));
      sailboat.add(sail);

      ggb.add(sailboat);
    });

    // 6. Historic Fort Point Brick Bastion Fortress (South abutment: Z = 11510m)
    const fortPoint = new THREE.Group();
    fortPoint.position.set(38, -12, -165);
    const fortBase = new THREE.Mesh(new THREE.BoxGeometry(26, 12, 34), this.matChateauTile);
    fortBase.position.y = 6;
    fortPoint.add(fortBase);
    ggb.add(fortPoint);

    this.group.add(ggb);
  }

  // 5. Sonoma Vineyard Estate (Z = 12400m)
  buildSonomaVineyardEstate() {
    const transform = this.splineRoad.getRoadTransformAtZ(12400, 36, 0);
    const estate = new THREE.Group();
    estate.position.copy(transform.pos);
    estate.rotation.y = transform.heading + Math.PI * 0.5 - 0.25;

    // Authentic Limestone Winery Chateau with Wine Cellars & Tasting Pergola
    const chateau = this.structureBuilder.buildWineryChateau({
      width: 24.0,
      depth: 16.0,
      height: 9.5,
      colorStone: 0xd7ccc8,
      colorTile: 0xa8422b,
      subterraneanDepth: 3.5
    });
    estate.add(chateau);

    this.group.add(estate);
  }

  // 6. Bodega Bay Church (Historic 1859 St. Teresa of Avila) (Z = 12700m)
  buildBodegaBayChurch() {
    const transform = this.splineRoad.getRoadTransformAtZ(12700, -34, 0);
    const church = new THREE.Group();
    church.position.copy(transform.pos);
    church.rotation.y = transform.heading - Math.PI * 0.5 + 0.25;

    // Historic White Coastal Parish Church
    const churchBldg = this.structureBuilder.buildVictorianHouse({
      width: 12.0,
      depth: 20.0,
      stories: 2,
      storyHeight: 4.0,
      subterraneanDepth: 3.5,
      hasPorchRailings: true,
      hasGableOrnament: true,
      palette: {
        body: 0xfafafa,
        trim: 0xffffff,
        accent: 0xdcdcdc,
        roof: 0x374151,
        foundation: 0x6b7280,
        door: 0x4a2c16,
        glass: 0x1f2937,
        hardware: 0xd4af37
      }
    });
    church.add(churchBldg);

    // Historic Church Steeple & Belfry Spire atop roof
    const steeple = new THREE.Mesh(new THREE.ConeGeometry(2.2, 11, 8), this.matChurchWhite);
    steeple.position.set(0, 16.5, 6);
    church.add(steeple);

    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.1), this.matChurchWhite);
    cross.position.set(0, 22.8, 6);
    church.add(cross);

    this.group.add(church);
  }


  // 7. Eucalyptus Groves & Valley Oaks (Z = 10420 - 12980m)
  buildEucalyptusGroves() {
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const treeCount = isMobile ? 60 : 120;
    const zStep = isMobile ? 42.0 : 21.0;

    for (let i = 0; i < treeCount; i++) {
      const z = 10420 + i * zStep + (Math.random() - 0.5) * 8;
      // Do not spawn trees on the Golden Gate Bridge open water span!
      if (z >= 11400 && z <= 12000) continue;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (19.5 + Math.random() * 28);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);

      const euca = new THREE.Group();
      euca.position.copy(transform.pos);
      euca.rotation.y = transform.heading;

      const h = 16.0 + Math.random() * 8.0;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, h, 6), this.matEucalyptusTrunk);
      trunk.position.y = h * 0.5;
      euca.add(trunk);

      for (let f = 0; f < 3; f++) {
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(3.2 - f * 0.5, 6.5, 6), this.matEucalyptusFoliage);
        foliage.position.set((Math.random() - 0.5) * 1.5, h - 2.0 + f * 2.8, (Math.random() - 0.5) * 1.5);
        euca.add(foliage);
      }

      this.group.add(euca);
    }
  }

  // 8. Northern California Highway Signage
  buildNorCalHighwaySignage() {
    const signs = [
      { z: 10450, text: 'SAN FRANCISCO & MARIN\nGOLDEN GATE BRIDGE 3 MI' },
      { z: 11350, text: 'MARIN HEADLANDS\nHAWK HILL VISTA POINT' },
      { z: 11650, text: 'GOLDEN GATE BRIDGE\nUS-101 / CA-1 SOUTHBOUND' },
      { z: 12350, text: 'SONOMA WINE COUNTRY\nNAPA VALLEY VINEYARDS' }
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

  // Marin Vista Point Semi-Circular Overlook Parking Lot (Z=11720m, X=-30)
  buildMarinVistaParkingLot() {
    const transform = this.splineRoad.getRoadTransformAtZ(11720, -30, 0);
    const vista = new THREE.Group();
    vista.position.copy(transform.pos);
    vista.rotation.y = transform.heading;

    // Large semi-circle paved lot apron
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(55, 45), this.matAsphaltLot);
    lot.rotateX(-Math.PI * 0.5);
    lot.position.set(0, 0.05, 0);
    vista.add(lot);

    // Brown concrete barrier wall along the bay-view edge
    const barrierWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 52),
      this.renderer.createToonMaterial({ color: 0x6a6060, gradientBands: 2 }));
    barrierWall.position.set(-26, 0.6, 0);
    vista.add(barrierWall);

    // Informational plaque kiosk
    const kioskPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6), this.matDarkSteel);
    kioskPost.position.set(-24, 1.25, 18);
    vista.add(kioskPost);
    const kioskPanel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 0.22), this.matSausalitoWhite);
    kioskPanel.position.set(-24, 2.8, 18);
    vista.add(kioskPanel);

    // Parked tourist vehicles (simple box clusters)
    const carColors = [0xc8c8c8, 0x2a4a8a, 0x1a1a1a, 0x8a2a2a, 0x2a6a3a, 0x8a7a50];
    const carPositions = [[-10, 20], [0, 20], [10, 20], [-15, -5], [-5, -5], [5, -5]];
    carPositions.forEach(([cx, cz], i) => {
      const car = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 4.5),
        this.renderer.createToonMaterial({ color: carColors[i], gradientBands: 2 }));
      car.position.set(cx, 0.75, cz);
      vista.add(car);
    });

    // Entry taper apron from US-101
    const entryApron = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), this.matAsphaltLot);
    entryApron.rotateX(-Math.PI * 0.5);
    entryApron.position.set(-16, 0.04, -28);
    vista.add(entryApron);

    this.group.add(vista);
  }

  // Sausalito Bridgeway Avenue Waterfront Shops (Z=11900–12000m, X=-28)
  buildSausalitoWaterfrontStreet() {
    const shops = [
      { z: 11910, xOff: -28, w: 14, h: 8, d: 9, col: 0x2a3a4a, label: 'BARREL HOUSE', neonCol: 0xf97316 },
      { z: 11942, xOff: -28, w: 12, h: 7, d: 8, col: 0xf0ede0, label: 'LE GARAGE', neonCol: 0x3a7a5a },
      { z: 11970, xOff: -28, w: 11, h: 6, d: 7, col: 0xd8c8b0, label: 'GALLERY', neonCol: 0x88aaff },
      { z: 11996, xOff: -28, w: 10, h: 6, d: 7, col: 0xf5f0e0, label: 'ICE CREAM', neonCol: 0xff88cc },
      { z: 12022, xOff: -28, w: 11, h: 6, d: 7, col: 0xf5f5f5, label: 'GG FERRY', neonCol: 0x3a9aff },
    ];

    shops.forEach(s => {
      const transform = this.splineRoad.getRoadTransformAtZ(s.z, s.xOff, 0);
      const shop = new THREE.Group();
      shop.position.copy(transform.pos);
      // Left side: face across road toward oncoming traffic
      shop.rotation.y = transform.heading + Math.PI * 0.5 + 0.22;


      // Authentic Commercial Main Street Storefront with Display Windows & Awning
      const commercial = this.structureBuilder.buildCommercialBuilding({
        width: s.w,
        depth: s.d,
        stories: 2,
        storyHeight: s.h * 0.5,
        colorWall: s.col,
        colorTrim: s.neonCol,
        subterraneanDepth: 3.5
      });
      shop.add(commercial);

      // Sign
      const signBg = new THREE.Mesh(new THREE.BoxGeometry(s.w * 0.75, 1.2, 0.35),
        this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
      signBg.position.set(0, s.h + 0.8, s.d * 0.5);
      shop.add(signBg);
      const signNeon = new THREE.Mesh(new THREE.BoxGeometry(s.w * 0.62, 0.45, 0.45),
        new THREE.MeshBasicMaterial({ color: s.neonCol }));
      signNeon.position.set(0, s.h + 0.8, s.d * 0.5 + 0.1);
      shop.add(signNeon);

      this.group.add(shop);
    });


    // Metered parking angle apron along front
    const meterParkT = this.splineRoad.getRoadTransformAtZ(11960, -22, 0);
    const meterPark = new THREE.Mesh(new THREE.PlaneGeometry(7, 140), this.matAsphaltLot);
    meterPark.rotateX(-Math.PI * 0.5);
    meterPark.position.copy(meterParkT.pos);
    meterPark.position.y = 0.04;
    this.group.add(meterPark);

    // Yellow parking meter posts every 12m
    const matMeterPost = new THREE.MeshBasicMaterial({ color: 0xf5c518 });
    for (let z = 11912; z <= 12030; z += 12) {
      const t = this.splineRoad.getRoadTransformAtZ(z, -19.5, 0);
      const meterPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), matMeterPost);
      meterPost.position.set(t.pos.x, t.pos.y + 0.6, t.pos.z);
      this.group.add(meterPost);
      const meterHead = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.18), matMeterPost);
      meterHead.position.set(t.pos.x, t.pos.y + 1.25, t.pos.z);
      this.group.add(meterHead);
    }

    // Houseboat community at X=-35 (floating homes silhouettes)
    const matHouseboatBlue = this.renderer.createToonMaterial({ color: 0x3a5a7a, gradientBands: 2 });
    const houseBoatShapes = [
      { z: 11920, xOff: -38, w: 9, h: 6 },
      { z: 11945, xOff: -40, w: 7, h: 5 },
      { z: 11968, xOff: -37, w: 10, h: 7 },
      { z: 11992, xOff: -39, w: 8, h: 5 },
      { z: 12015, xOff: -38, w: 9, h: 6 },
      { z: 12038, xOff: -40, w: 7, h: 8 },
    ];
    houseBoatShapes.forEach(hb => {
      const t = this.splineRoad.getRoadTransformAtZ(hb.z, hb.xOff, 0);
      const hull = new THREE.Mesh(new THREE.BoxGeometry(hb.w, 2.0, hb.w * 0.7),
        this.renderer.createToonMaterial({ color: 0x4a5a3a, gradientBands: 2 }));
      hull.position.set(t.pos.x, 1.0, t.pos.z);
      this.group.add(hull);
      const house = new THREE.Mesh(new THREE.BoxGeometry(hb.w * 0.85, hb.h, hb.w * 0.65), matHouseboatBlue);
      house.position.set(t.pos.x, 2.0 + hb.h * 0.5, t.pos.z);
      this.group.add(house);
      const housRoof = new THREE.Mesh(new THREE.BoxGeometry(hb.w * 0.9, 0.35, hb.w * 0.7),
        this.renderer.createToonMaterial({ color: 0x2a2a3a, gradientBands: 2 }));
      housRoof.position.set(t.pos.x, 2.0 + hb.h + 0.18, t.pos.z);
      this.group.add(housRoof);
    });
  }

  // Sonoma Valley Wine Country — Benziger, Gundlach Bundschu, Vineyard Rows (Z=12350–12450m)
  buildSonomaWineryTastingRooms() {
    // Benziger Family Winery entrance
    const benzT = this.splineRoad.getRoadTransformAtZ(12370, 34, 0);
    const benziger = new THREE.Group();
    benziger.position.copy(benzT.pos);
    // Right side: face across road toward oncoming traffic
    benziger.rotation.y = benzT.heading - Math.PI * 0.5 - 0.22;

    // Stone gate pillars
    [[-4.5, 0], [4.5, 0]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.8, 1.3), this.matWineryStone);
      pillar.position.set(px, 1.4, pz);
      benziger.add(pillar);
      const pillarCap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), this.matWineryStone);
      pillarCap.position.set(px, 2.95, pz);
      benziger.add(pillarCap);
    });

    // Carved wooden winery sign on a post
    const wineSignPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6), this.matWineryStone);
    wineSignPost.position.set(0, 1.25, -3);
    benziger.add(wineSignPost);
    const wineSign = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.2, 0.28),
      this.renderer.createToonMaterial({ color: 0x5c3a1e, gradientBands: 2 }));
    wineSign.position.set(0, 2.8, -3);
    benziger.add(wineSign);
    const wineSignText = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.5, 0.38),
      new THREE.MeshBasicMaterial({ color: 0xf5c842 }));
    wineSignText.position.set(0, 2.8, -2.9);
    benziger.add(wineSignText);

    // Long gravel driveway through vines
    const driveway = new THREE.Mesh(new THREE.PlaneGeometry(6, 45), this.matGravel);
    driveway.rotateX(-Math.PI * 0.5);
    driveway.position.set(0, 0.04, 22);
    benziger.add(driveway);

    // Oak barrel displayed outside
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.5, 10),
      this.renderer.createToonMaterial({ color: 0x4a3018, gradientBands: 2 }));
    barrel.rotation.z = Math.PI * 0.5;
    barrel.position.set(6, 0.7, -1);
    benziger.add(barrel);

    // "TASTING OPEN" chalkboard A-frame
    const aframe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.15),
      this.renderer.createToonMaterial({ color: 0x2a3a22, gradientBands: 2 }));
    aframe.position.set(-7, 1.25, 0);
    benziger.add(aframe);
    const aframeText = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.22),
      new THREE.MeshBasicMaterial({ color: 0xf5f0e0 }));
    aframeText.position.set(-7, 1.6, 0.1);
    benziger.add(aframeText);

    this.group.add(benziger);

    // Gundlach Bundschu — German Gothic stone winery chateau
    const gbT = this.splineRoad.getRoadTransformAtZ(12430, 34, 0);
    const gb = new THREE.Group();
    gb.position.copy(gbT.pos);
    // Right side: face across road toward oncoming traffic
    gb.rotation.y = gbT.heading - Math.PI * 0.5 - 0.22;

    const gbChateau = this.structureBuilder.buildWineryChateau({
      width: 22.0,
      depth: 14.0,
      height: 10.0,
      colorStone: 0x8d8376,
      colorTile: 0x2a2e32,
      subterraneanDepth: 4.0
    });
    gb.add(gbChateau);


    // Ivy covering the walls (DodecahedronGeometry clusters on wall face)
    const ivyGeo = new THREE.DodecahedronGeometry(0.8, 0);
    for (let ix = -9; ix <= 9; ix += 3) {
      for (let iy = 1; iy <= 8; iy += 2.5) {
        if (Math.random() > 0.35) {
          const ivy = new THREE.Mesh(ivyGeo, this.matWineryIvy);
          ivy.position.set(ix + (Math.random() - 0.5), iy, 7.1);
          ivy.scale.set(1.2, 0.7, 0.5);
          gb.add(ivy);
        }
      }
    }

    // Heavy iron entrance gate
    const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 3.5),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    gateFrame.position.set(-12, 1.75, 7);
    gb.add(gateFrame);

    this.group.add(gb);

    // Vineyard rows (12 rows × 8 vines) at X=+20 to +50 behind the wineries
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const plantStep = isMobile ? 2 : 1;
    for (let row = 0; row < (isMobile ? 3 : 5); row++) {
      for (let plant = 0; plant < 12; plant += plantStep) {
        const vZ = 12340 + plant * 12;
        const vX = 32 + row * 7;
        const vT = this.splineRoad.getRoadTransformAtZ(vZ, vX, 0);
        const vine = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), this.matVineRow);
        vine.position.set(vT.pos.x, vT.pos.y + 0.5, vT.pos.z);
        this.group.add(vine);
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.6, 10.0), this.matVineRow);
        canopy.position.set(vT.pos.x, vT.pos.y + 1.05, vT.pos.z);
        this.group.add(canopy);
      }
    }
  }

  // Bodega Bay Working Fishing Harbor — Lucas Wharf, Spud Point, Crab Boat (Z=12750–12820m)
  buildBodegaBayWaterfront() {
    // Lucas Wharf Restaurant
    const lucasT = this.splineRoad.getRoadTransformAtZ(12760, -32, 0);
    const lucas = new THREE.Group();
    lucas.position.copy(lucasT.pos);
    // Left side: face across road toward oncoming traffic
    lucas.rotation.y = lucasT.heading + Math.PI * 0.5 + 0.22;

    const lucasShack = this.structureBuilder.buildCoastalSeafoodShack({
      width: 18.0,
      depth: 12.0,
      height: 9.0,
      colorSiding: 0x7c5836,
      colorRoof: 0x4a525d,
      subterraneanDepth: 3.5
    });
    lucas.add(lucasShack);


    // Fish cleaning table on the exterior side
    const cleanTable = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 1.5),
      this.renderer.createToonMaterial({ color: 0x6a8a9a, gradientBands: 2 }));
    cleanTable.position.set(-10, 1.0, -5.5);
    lucas.add(cleanTable);

    // "LUCAS WHARF" sign in blue
    const lucasSign = new THREE.Mesh(new THREE.BoxGeometry(12, 2.0, 0.4),
      this.renderer.createToonMaterial({ color: 0x1a3a6a, gradientBands: 2 }));
    lucasSign.position.set(0, 10.5, 5.1);
    lucas.add(lucasSign);
    const lucasSignNeon = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.65, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    lucasSignNeon.position.set(0, 10.5, 5.2);
    lucas.add(lucasSignNeon);

    // Pelicans on pilings
    const matPelican = this.renderer.createToonMaterial({ color: 0x8a8878, gradientBands: 2 });
    [-6, 0, 6].forEach(px => {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 4, 6), this.matWharfWood);
      piling.position.set(px, -2, -7);
      lucas.add(piling);
      const bird = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.1), matPelican);
      bird.position.set(px, 2.35, -7);
      lucas.add(bird);
      const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.6), matPelican);
      beak.position.set(px, 2.35, -7.65);
      lucas.add(beak);
    });

    this.group.add(lucas);

    // Spud Point Crab Co. — famous tiny blue-and-white stand
    const spudT = this.splineRoad.getRoadTransformAtZ(12800, -20, 0);
    const spud = new THREE.Group();
    spud.position.copy(spudT.pos);
    spud.rotation.y = spudT.heading + 0.2;

    const spudBody = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.5, 4), this.matWharfBlue);
    spudBody.position.y = 1.75;
    spud.add(spudBody);
    const spudTrim = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.4, 4.5),
      this.renderer.createToonMaterial({ color: 0xf5f5f5, gradientBands: 2 }));
    spudTrim.position.y = 3.7;
    spud.add(spudTrim);
    // Service window
    const serviceWindow = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x88ccee, transparent: true, opacity: 0.8 }));
    serviceWindow.position.set(0, 1.8, 2.1);
    spud.add(serviceWindow);
    // Hand-painted chalkboard menu sign
    const menuBoard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.5, 0.2),
      this.renderer.createToonMaterial({ color: 0x1a2a1a, gradientBands: 2 }));
    menuBoard.position.set(0, 4.5, 2);
    spud.add(menuBoard);
    const menuText = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xf0f0e0 }));
    menuText.position.set(0, 4.7, 2.05);
    spud.add(menuText);
    // Outdoor picnic tables
    [[-5, 0], [0, 5]].forEach(([tx, tz]) => {
      const tablePicnic = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 1.0),
        this.renderer.createToonMaterial({ color: 0x6a5a40, gradientBands: 2 }));
      tablePicnic.position.set(tx, 0.78, tz);
      spud.add(tablePicnic);
    });

    this.group.add(spud);

    // Harbor crab boat at the dock
    const boatT = this.splineRoad.getRoadTransformAtZ(12775, -34, 0);
    const boat = new THREE.Group();
    boat.position.copy(boatT.pos);
    boat.rotation.y = boatT.heading + 0.4;

    const boatHull = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 14), this.matCrabBoat);
    boatHull.position.y = 1.25;
    boat.add(boatHull);
    const wheelhouse = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 6),
      this.renderer.createToonMaterial({ color: 0xf0f0e0, gradientBands: 2 }));
    wheelhouse.position.set(0, 5, -3);
    boat.add(wheelhouse);
    // Crab pots stacked on deck
    const potMat = this.renderer.createToonMaterial({ color: 0x8a7050, gradientBands: 2 });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const pot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), potMat);
        pot.position.set(-2 + r * 2, 2.5 + c * 1.0, 3);
        boat.add(pot);
      }
    }

    this.group.add(boat);
  }

  update(dt) {}
}
