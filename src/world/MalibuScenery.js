import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';

export class MalibuSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.animatedObjects = [];
    this.waveMeshes = [];
    this.structureBuilder = new ProceduralStructureBuilder(renderer);


    // Cel-Shaded Malibu Palette Materials with Rim Highlights
    this.matStuccoWhite = renderer.createToonMaterial({ color: 0xf6f7f8, gradientBands: 3, rimColor: 0xffffff, rimPower: 3.5 });
    this.matModernWood = renderer.createToonMaterial({ color: 0x9c6d48, gradientBands: 2 });
    this.matDarkTrim = renderer.createToonMaterial({ color: 0x2b303a, gradientBands: 2 });
    this.matGlassAqua = renderer.createToonMaterial({ color: 0x64c4d6, gradientBands: 2, transparent: true, opacity: 0.65 });
    this.matPoolWater = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.85 });

    // Cel-Shaded Malibu Materials with Procedural PBR Textures & Normal Maps
    const palmBarkDiff = renderer.textures.treeBarkPBR ? renderer.textures.treeBarkPBR('palm', 256) : null;
    const palmBarkNorm = renderer.textures.treeBarkNormalPBR ? renderer.textures.treeBarkNormalPBR('palm', 256) : null;
    const palmFrondDiff = renderer.textures.treeFoliagePBR ? renderer.textures.treeFoliagePBR('palm', 256) : null;
    const palmFrondNorm = renderer.textures.treeFoliageNormalPBR ? renderer.textures.treeFoliageNormalPBR('palm', 256) : null;
    const rockNorm = renderer.textures.mountainRidgeNormalPBR ? renderer.textures.mountainRidgeNormalPBR(512) : null;
    const sandNorm = renderer.textures.terrainNormalPBR ? renderer.textures.terrainNormalPBR('desert_sand', 512) : null;
    const plankDriftDiff = renderer.textures.rusticPlankPBR ? renderer.textures.rusticPlankPBR('driftwood', 256) : null;
    const plankDriftNorm = renderer.textures.rusticPlankNormalPBR ? renderer.textures.rusticPlankNormalPBR('driftwood', 256) : null;
    const tinNorm = renderer.textures.corrugatedTinNormalPBR ? renderer.textures.corrugatedTinNormalPBR(256) : null;

    this.matPierWood = renderer.createToonMaterial({ color: 0x7c6956, gradientBands: 2, map: plankDriftDiff, normalMap: plankDriftNorm });
    this.matPierDeck = renderer.createToonMaterial({ color: 0x948270, gradientBands: 2, map: plankDriftDiff, normalMap: plankDriftNorm });
    this.matRoofGreen = renderer.createToonMaterial({ color: 0x3d6b52, gradientBands: 3 });

    this.matLifeguardBlue = renderer.createToonMaterial({ color: 0x4aa3df, gradientBands: 3, rimColor: 0xbfe5ff, rimPower: 3.0 });
    this.matLifeguardWhite = renderer.createToonMaterial({ color: 0xf5f7fa, gradientBands: 2 });
    this.matRescueRed = new THREE.MeshBasicMaterial({ color: 0xff3b30 });

    this.matSandstoneMugu = renderer.createToonMaterial({ color: 0x8a7762, gradientBands: 3, normalMap: rockNorm, rimColor: 0xd6c2aa, rimPower: 3.5 });
    this.matSandstoneGold = renderer.createToonMaterial({ color: 0xb59b7c, gradientBands: 3, normalMap: rockNorm });
    this.matBeachSand = renderer.createToonMaterial({ color: 0xe5ce9f, gradientBands: 3, normalMap: sandNorm });

    this.matPalmTrunk = renderer.createToonMaterial({ color: 0x69533c, gradientBands: 2, map: palmBarkDiff, normalMap: palmBarkNorm });
    this.matPalmSkirt = renderer.createToonMaterial({ color: 0x826442, gradientBands: 2, map: palmBarkDiff, normalMap: palmBarkNorm });
    this.matPalmFrond = renderer.createToonMaterial({ color: 0x2d7738, gradientBands: 3, map: palmFrondDiff, normalMap: palmFrondNorm, rimColor: 0x86efac, rimPower: 3.0 });
    this.matBougainvillea = renderer.createToonMaterial({ color: 0xd81b60, gradientBands: 2 });

    // California Wildflowers
    this.matGoldenPoppy = renderer.createToonMaterial({ color: 0xf97316, gradientBands: 2 });
    this.matCoastalLupine = renderer.createToonMaterial({ color: 0x8b5cf6, gradientBands: 2 });
    this.matPoppyFoliage = renderer.createToonMaterial({ color: 0x4d7c0f, gradientBands: 2 });

    this.matUmbrellaRed = renderer.createToonMaterial({ color: 0xe53935, gradientBands: 2 });
    this.matUmbrellaYellow = renderer.createToonMaterial({ color: 0xfbc02d, gradientBands: 2 });
    this.matUmbrellaTeal = renderer.createToonMaterial({ color: 0x00897b, gradientBands: 2 });

    this.matNeptuneRed = renderer.createToonMaterial({ color: 0xb71c1c, gradientBands: 3, rimColor: 0xfca5a5, rimPower: 3.0 });
    this.matTinRoof = renderer.createToonMaterial({ color: 0x78909c, gradientBands: 2, normalMap: tinNorm });
    this.matNeonYellow = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    this.matNeonCyan = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.matNeonLobster = new THREE.MeshBasicMaterial({ color: 0xff5252 });

    this.matTileTerraCotta = renderer.createToonMaterial({ color: 0xbf4928, gradientBands: 3 });
    this.matNeonArchBlue = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    this.matCoasterRed = renderer.createToonMaterial({ color: 0xef4444, gradientBands: 3 });
    this.matVolleyballNet = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    this.matInclineConcrete = renderer.createToonMaterial({ color: 0xd4d8dc, gradientBands: 3 });
    this.matBluffLawn = renderer.createToonMaterial({ color: 0x3d8c40, gradientBands: 2 });
    this.matRoute66Brown = renderer.createToonMaterial({ color: 0x6e4e32, gradientBands: 2 });

    this.matBaywatchYellow = renderer.createToonMaterial({ color: 0xfacc15, gradientBands: 3 });
    this.matVWTeal = renderer.createToonMaterial({ color: 0x0ea5e9, gradientBands: 3 });
    this.matVWWhite = renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 2 });
    this.matChromeBar = renderer.createToonMaterial({ color: 0xe2e8f0, gradientBands: 4 });
    this.matRomanMarble = renderer.createToonMaterial({ color: 0xf1f5f9, gradientBands: 3, rimColor: 0xffffff, rimPower: 3.0 });
    this.matCypressGreen = renderer.createToonMaterial({ color: 0x1e3a24, gradientBands: 2 });
    this.matHarleyBlack = renderer.createToonMaterial({ color: 0x18181b, gradientBands: 3 });
    this.matFastOrange = renderer.createToonMaterial({ color: 0xf97316, gradientBands: 3 });

    this.matCountryMart = this.renderer.createToonMaterial({ color: 0xf0e8d8, gradientBands: 2 });
    this.matLumberYard = this.renderer.createToonMaterial({ color: 0x8a7060, gradientBands: 2 });
    this.matRalphs = this.renderer.createToonMaterial({ color: 0xf5f5f5, gradientBands: 2 });
    this.matDukesTeal = this.renderer.createToonMaterial({ color: 0x2a7a8a, gradientBands: 2 });
    this.matNobuDark = this.renderer.createToonMaterial({ color: 0x2a2218, gradientBands: 2 });
    this.matAsphaltLot = this.renderer.createToonMaterial({ color: 0x2a2e31, gradientBands: 2 });
    this.matGravel = this.renderer.createToonMaterial({ color: 0x9a8a78, gradientBands: 2 });
    this.matBeachSignBlue = new THREE.MeshBasicMaterial({ color: 0x1565c0 });

    this.matStoreAwningRed = this.renderer.createToonMaterial({ color: 0xd9383a, gradientBands: 2 });
    this.matStoreAwningBlue = this.renderer.createToonMaterial({ color: 0x1976d2, gradientBands: 2 });
    this.matStoreAwningTeal = this.renderer.createToonMaterial({ color: 0x00897b, gradientBands: 2 });
    this.matNeonRalphs = new THREE.MeshBasicMaterial({ color: 0x1565c0 });
    this.matNeonRed = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    this.matWindowGlow = new THREE.MeshBasicMaterial({ color: 0xfff3cc });

    this.buildMalibuEnvironment();
  }

  buildMalibuEnvironment() {
    this.buildOriginalMuscleBeach();
    this.buildSantaMonicaBluffsAndCaliforniaIncline();
    this.buildSantaMonicaPier();
    this.buildSantaMonicaBeachAndBoardwalk();
    this.buildSantaMonicaCommercialPromenade();
    this.buildWillRogersAndBaywatchHQ();
    this.buildTheGettyVilla();
    this.buildTopangaCanyonSurfShackAndVWBus();
    this.buildCrossCreekShoppingComplex();
    this.buildMalibuPier();
    this.buildDukesMalibuRestaurant();
    this.buildMoonshadowsAndNobuRow();
    this.buildCarbonBeachMansions();
    this.buildHillsideModernVillas();
    this.buildZumaBeachParkingLot();
    this.buildZumaLifeguardTowers();
    this.buildPointDumeMarineReserve();
    this.buildElMatadorSeaArches();
    this.buildNeptunesNetRoadhouse();
    this.buildNeptuneMotorcycleLot();
    this.buildPointMuguRock();
    this.buildPointMuguMissilePark();
    this.buildCaliforniaFanPalms();
    this.buildCoastalGuardrails();
    this.buildPCHStateBeachSignage();
    this.buildMalibuHighwaySignage();
    this.buildCaliforniaWildflowers();
    this.buildCoastalBeachProps();
    this.buildOceanWavesAndSailboats();
    this.buildGlidingPelicans();
  }

  // 1. Santa Monica Bluffs, Palisades Park & California Incline Viaduct (Z = 2650m - 3150m)
  buildSantaMonicaBluffsAndCaliforniaIncline() {
    const bluffsGroup = new THREE.Group();

    // A. Santa Monica Sandstone Coastal Bluffs (Inland side: X = 38m to 72m, Z = 2650m to 3150m)
    for (let bz = 2650; bz <= 3150; bz += 50) {
      const transform = this.splineRoad.getRoadTransformAtZ(bz, 48, 0);
      const bluff = new THREE.Group();
      bluff.position.copy(transform.pos);
      bluff.rotation.y = transform.heading;

      // Sandstone Cliff Face
      const cliffGeo = new THREE.BoxGeometry(22, 24, 52);
      const cliff = new THREE.Mesh(cliffGeo, this.matSandstoneGold);
      cliff.position.set(11, 12, 0);
      cliff.castShadow = true;
      bluff.add(cliff);

      // Palisades Park Top Green Lawn (Y = 24m)
      const parkLawn = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 52), this.matBluffLawn);
      parkLawn.position.set(11, 24.3, 0);
      bluff.add(parkLawn);

      // White Perimeter Fence along Palisades Park bluff edge
      const fence = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 52), this.matLifeguardWhite);
      fence.position.set(-0.5, 25.1, 0);
      bluff.add(fence);

      // Park Vista Benches
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 2.4), this.matModernWood);
      bench.position.set(1.5, 24.8, 0);
      bluff.add(bench);

      // Row of Tall Mexican Fan Palms atop the bluffs
      const palmTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 18, 6), this.matPalmTrunk);
      palmTrunk.position.set(7, 33.3, 0);
      palmTrunk.castShadow = true;
      bluff.add(palmTrunk);

      const palmCrown = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.2, 8), this.matPalmFrond);
      palmCrown.position.set(7, 42.5, 0);
      palmCrown.castShadow = true;
      bluff.add(palmCrown);

      // Cascading Bougainvillea magenta vines draping over bluff rim
      const vine = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.5, 6.5), this.matBougainvillea);
      vine.position.set(-0.2, 22.0, (Math.random() - 0.5) * 12);
      bluff.add(vine);

      bluffsGroup.add(bluff);
    }

    // B. Sweeping California Incline Highway Viaduct (Z = 2720m to 2980m)
    const zStart = 2720;
    const zEnd = 2980;
    const step = 20;

    const getViaductPoint = (zVal) => {
      const t = Math.max(0, Math.min(1, (zVal - zStart) / (zEnd - zStart)));
      const latOffset = 22.0 + t * 16.0;
      const trans = this.splineRoad.getRoadTransformAtZ(zVal, latOffset, 0, false);
      const groundAtPoint = this.splineRoad.getGroundElevation ? this.splineRoad.getGroundElevation(trans.pos.x, trans.pos.z) : trans.pos.y;
      const elev = Math.max(groundAtPoint + 0.4, trans.pos.y + 0.8 + t * 23.5);
      return new THREE.Vector3(trans.pos.x, elev, trans.pos.z);
    };

    for (let iz = zStart; iz < zEnd; iz += step) {
      const nextZ = Math.min(zEnd, iz + step);
      const pA = getViaductPoint(iz);
      const pB = getViaductPoint(nextZ);
      const dir = new THREE.Vector3().subVectors(pB, pA);
      const segLength = dir.length();
      if (segLength < 0.1) continue;

      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      const viaductSegment = new THREE.Group();
      viaductSegment.position.copy(mid);

      const forward = dir.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, forward).normalize();
      const segUp = new THREE.Vector3().crossVectors(forward, right).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(right, segUp, forward);
      viaductSegment.quaternion.setFromRotationMatrix(rotMatrix);

      const deck = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.8, segLength + 0.25), this.matInclineConcrete);
      deck.castShadow = true;
      viaductSegment.add(deck);

      [-3.1, 3.1].forEach(px => {
        const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, segLength + 0.25), this.matInclineConcrete);
        barrier.position.set(px, 0.65, 0);
        viaductSegment.add(barrier);
      });

      bluffsGroup.add(viaductSegment);

      const groundY = this.splineRoad.getGroundElevation ? this.splineRoad.getGroundElevation(mid.x, mid.z) : 0;
      const deckBottom = mid.y - 0.4;
      if (deckBottom > groundY + 1.2) {
        const pierHeight = deckBottom - groundY + 1.2;
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, pierHeight, 8), this.matInclineConcrete);
        pier.position.set(mid.x, groundY + pierHeight * 0.5 - 0.6, mid.z);
        pier.castShadow = true;
        bluffsGroup.add(pier);
      }
    }

    this.group.add(bluffsGroup);
  }

  // 2. Santa Monica Pier, Historic Entrance Arch, Looff Hippodrome & Pacific Park (Z = 2900m)
  buildSantaMonicaPier() {
    const transform = this.splineRoad.getRoadTransformAtZ(2900, -42, 0);
    const pier = new THREE.Group();
    pier.position.copy(transform.pos);
    pier.rotation.y = transform.heading;

    // A. Main Heavy Timber Pier Boardwalk Deck (Width 32m, Length 130m extending into Pacific)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(32, 1.6, 130), this.matPierDeck);
    deck.position.set(0, 1.8, 0);
    deck.castShadow = true;
    pier.add(deck);

    // Pier Timber Support Pilings into ocean water
    for (let x = -13; x <= 13; x += 6.5) {
      for (let z = -60; z <= 60; z += 12) {
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 7.5, 6), this.matPierWood);
        piling.position.set(x, -1.2, z);
        pier.add(piling);
      }
    }

    // B. Iconic "Santa Monica Yacht Harbor" Neon Entrance Arch Gate (at ramp entry: Z = -58m)
    const archGroup = new THREE.Group();
    archGroup.position.set(16, 2.5, -58);
    archGroup.rotation.y = -Math.PI * 0.25;

    // Dual Arch Support Posts
    [-6.5, 6.5].forEach(ax => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7.5, 6), this.matInclineConcrete);
      post.position.set(ax, 3.75, 0);
      archGroup.add(post);
    });

    // Glowing Cyan/Blue Overhead Arch
    const archSpan = new THREE.Mesh(new THREE.BoxGeometry(14.5, 1.4, 0.6), this.matNeonArchBlue);
    archSpan.position.set(0, 7.2, 0);
    archGroup.add(archSpan);

    // Glowing Yellow "SANTA MONICA PIER" Neon Plate
    const archSign = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.9, 0.8), this.matNeonYellow);
    archSign.position.set(0, 7.2, 0);
    archGroup.add(archSign);
    pier.add(archGroup);

    // C. Route 66 "End of the Trail" Historic Wooden Landmark Sign (Z = -44m)
    const r66Sign = new THREE.Group();
    r66Sign.position.set(6, 2.5, -44);
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 6), this.matRoute66Brown);
    signPole.position.y = 2.1;
    r66Sign.add(signPole);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 0.2), this.matRoute66Brown);
    signBoard.position.set(0, 3.2, 0);
    r66Sign.add(signBoard);

    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), this.matStuccoWhite);
    signFace.position.set(0, 3.2, 0.12);
    r66Sign.add(signFace);
    pier.add(r66Sign);

    // D. Historic Looff Hippodrome & Carousel Building (1916 Spanish Revival: Z = -26m)
    const hippodrome = new THREE.Group();
    hippodrome.position.set(-6, 2.5, -26);

    const hippoBody = new THREE.Mesh(new THREE.BoxGeometry(18, 7.5, 20), this.matStuccoWhite);
    hippoBody.position.y = 3.75;
    hippoBody.castShadow = true;
    hippodrome.add(hippoBody);

    // Spanish Terra Cotta Dome Roof
    const hippoDome = new THREE.Mesh(new THREE.SphereGeometry(7.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), this.matTileTerraCotta);
    hippoDome.position.set(0, 7.5, 0);
    hippodrome.add(hippoDome);

    const hippoSpire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.5, 6), this.matModernWood);
    hippoSpire.position.set(0, 15.0, 0);
    hippodrome.add(hippoSpire);
    pier.add(hippodrome);

    // E. Pacific Park — Rotating Pacific Wheel (Solar Powered Ferris Wheel: Z = +16m)
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(-4, 25, 16);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(18, 0.9, 6, 24), this.matNeonYellow);
    wheelGroup.add(rim);

    // Central Solar LED Hub
    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 12), this.matNeonCyan);
    wheelHub.rotation.x = Math.PI * 0.5;
    wheelGroup.add(wheelHub);

    // 16 Radiating Neon Spokes & Multi-Color Passenger Gondolas
    for (let s = 0; s < 16; s++) {
      const ang = (s / 16) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 36, 4), this.matStuccoWhite);
      spoke.rotation.z = ang;
      wheelGroup.add(spoke);

      const gondolaMat = s % 2 === 0 ? this.matNeonCyan : this.matNeonLobster;
      const gondola = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 1.8), gondolaMat);
      gondola.position.set(Math.cos(ang) * 18, Math.sin(ang) * 18, 0);
      wheelGroup.add(gondola);
    }

    // A-frame Steel Wheel Support Stanchions
    [-5.5, 5.5].forEach(sx => {
      const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 26, 6), this.matInclineConcrete);
      stanchion.position.set(sx, -12, 0);
      stanchion.rotation.z = sx > 0 ? 0.22 : -0.22;
      wheelGroup.add(stanchion);
    });

    this.animatedObjects.push({ obj: wheelGroup, rotZ: 0.008 });
    pier.add(wheelGroup);

    // F. West Coaster — Red Tubular Steel Roller Coaster Circuit (Z = +45m)
    const coaster = new THREE.Group();
    coaster.position.set(2, 2.5, 45);

    for (let loop = 0; loop < 4; loop++) {
      const cz = (loop - 1.5) * 14;
      const ch = 10.0 + Math.sin(loop * 1.5) * 6.0;

      // Track Pillars
      const cpillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, ch, 4), this.matCoasterRed);
      cpillar.position.set(0, ch * 0.5, cz);
      coaster.add(cpillar);

      // Red Tubular Rails
      const railMesh = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.4, 14.5), this.matCoasterRed);
      railMesh.position.set(0, ch, cz);
      railMesh.rotation.x = (loop % 2 === 0 ? 0.15 : -0.15);
      coaster.add(railMesh);
    }
    pier.add(coaster);

    this.group.add(pier);
  }

  // 3. Santa Monica Beach Boardwalk, Lifeguard Tower 26 & Woody Wagon (Z = 2650m - 3150m)
  buildSantaMonicaBeachAndBoardwalk() {
    const beachGroup = new THREE.Group();

    // A. Lifeguard Tower 26 (Classic Teal Wooden Stilt Lookout on Beach Sand: Z = 2750m, X = -28m)
    const transformTower = this.splineRoad.getRoadTransformAtZ(2750, -28, 0);
    const tower26 = new THREE.Group();
    tower26.position.copy(transformTower.pos);
    tower26.rotation.y = transformTower.heading + 0.3;

    // Stilt legs
    for (let lx = -1.8; lx <= 1.8; lx += 3.6) {
      for (let lz = -1.8; lz <= 1.8; lz += 3.6) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.0, 4), this.matModernWood);
        leg.position.set(lx, 2.0, lz);
        tower26.add(leg);
      }
    }

    // Wooden Lookout Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, 4.2), this.matLifeguardBlue);
    cabin.position.y = 5.0;
    cabin.castShadow = true;
    tower26.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 5.0), this.matLifeguardWhite);
    roof.position.y = 6.6;
    tower26.add(roof);

    // Red Rescue Torpedo Canister
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 6), this.matRescueRed);
    can.position.set(2.2, 4.4, 0);
    tower26.add(can);

    // Access Ramp
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 6.5), this.matModernWood);
    ramp.position.set(0, 1.8, -3.8);
    ramp.rotation.x = -Math.PI * 0.18;
    tower26.add(ramp);

    beachGroup.add(tower26);

    // B. Beach Volleyball Courts (Z = 2820m, X = -24m)
    const transformCourt = this.splineRoad.getRoadTransformAtZ(2820, -24, 0);
    const court = new THREE.Group();
    court.position.copy(transformCourt.pos);
    court.rotation.y = transformCourt.heading;

    [-6.5, 6.5].forEach(vx => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6), this.matInclineConcrete);
      pole.position.set(vx, 1.7, 0);
      court.add(pole);
    });

    const net = new THREE.Mesh(new THREE.PlaneGeometry(13.0, 1.2), this.matVolleyballNet);
    net.position.set(0, 2.4, 0);
    court.add(net);

    const vBall = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), this.matNeonYellow);
    vBall.position.set(2.2, 0.3, 2.5);
    court.add(vBall);
    beachGroup.add(court);

    // C. Classic 1950s California Woody Surf Wagon parked on sand apron (Z = 2710m, X = -18m)
    const transformWoody = this.splineRoad.getRoadTransformAtZ(2710, -18, 0);
    const woodyCar = new THREE.Group();
    woodyCar.position.copy(transformWoody.pos);
    woodyCar.rotation.y = transformWoody.heading + 0.35;

    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 4.8), this.matModernWood);
    carBody.position.y = 0.9;
    carBody.castShadow = true;
    woodyCar.add(carBody);

    beachGroup.add(woodyCar);

    this.group.add(beachGroup);
  }

  // 3B. Santa Monica Commercial Promenade — Ralphs Fresh Market, Cross Creek Stores, Malibu Surf Co., Pacific Diner (Z = 3000m - 3180m, X = +28m)
  buildSantaMonicaCommercialPromenade() {
    const promenadeGroup = new THREE.Group();

    // 1. Ralphs Fresh Market & Grocery (Z = 3015m, X = +28m)
    const ralphsT = this.splineRoad.getRoadTransformAtZ(3015, 28, 0);
    const ralphs = new THREE.Group();
    ralphs.position.copy(ralphsT.pos);
    ralphs.rotation.y = ralphsT.heading - Math.PI * 0.5;

    const ralphsBuilding = this.structureBuilder.buildCommercialBuilding({
      width: 32.0,
      depth: 16.0,
      stories: 2,
      storyHeight: 3.8,
      colorWall: 0xf3f4f6,
      colorTrim: 0x1565c0,
      colorRoof: 0x1e293b,
      subterraneanDepth: 3.5
    });
    ralphs.add(ralphsBuilding);

    // Iconic Ralphs Blue/White Fascia Sign
    const ralphsSign = new THREE.Mesh(new THREE.BoxGeometry(22, 2.6, 0.5), this.matNeonRalphs);
    ralphsSign.position.set(0, 8.8, 8.2);
    ralphs.add(ralphsSign);

    const ralphsText = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ralphsText.position.set(0, 8.8, 8.3);
    ralphs.add(ralphsText);

    // Red striped store entrance awning
    const ralphsAwning = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 3.2), this.matStoreAwningRed);
    ralphsAwning.position.set(0, 3.8, 9.2);
    ralphsAwning.rotation.x = 0.15;
    ralphs.add(ralphsAwning);

    // Front grocery cart corral
    const corral = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 2.0), this.matBaywatchYellow);
    corral.position.set(-10, 0.2, 10.5);
    ralphs.add(corral);

    promenadeGroup.add(ralphs);

    // 2. Cross Creek Trading Post & Country Boutique (Z = 3060m, X = +28m)
    const ccT = this.splineRoad.getRoadTransformAtZ(3060, 28, 0);
    const crossCreek = new THREE.Group();
    crossCreek.position.copy(ccT.pos);
    crossCreek.rotation.y = ccT.heading - Math.PI * 0.5;

    const ccArcade = this.structureBuilder.buildMarketArcade({
      width: 28.0,
      depth: 14.0,
      stories: 2,
      storyHeight: 3.6,
      colorBrick: 0xf5eedb,
      colorTrim: 0x00897b,
      subterraneanDepth: 3.5
    });
    crossCreek.add(ccArcade);

    // Storefront Teal Awning & Sign
    const ccSign = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 0.4), this.matStoreAwningTeal);
    ccSign.position.set(0, 8.2, 7.2);
    crossCreek.add(ccSign);

    const ccText = new THREE.Mesh(new THREE.BoxGeometry(15, 0.8, 0.5), this.matNeonYellow);
    ccText.position.set(0, 8.2, 7.3);
    crossCreek.add(ccText);

    // Potted palms along arcade entrance
    [-8, 8].forEach(px => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.8, 8), this.matTileTerraCotta);
      pot.position.set(px, 0.4, 7.8);
      crossCreek.add(pot);
      const palm = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.0, 6), this.matPalmFrond);
      palm.position.set(px, 1.8, 7.8);
      crossCreek.add(palm);
    });

    promenadeGroup.add(crossCreek);

    // 3. Malibu Surf Co. & Board Shop (Z = 3105m, X = +28m)
    const surfT = this.splineRoad.getRoadTransformAtZ(3105, 28, 0);
    const surfShop = new THREE.Group();
    surfShop.position.copy(surfT.pos);
    surfShop.rotation.y = surfT.heading - Math.PI * 0.5;

    const surfBldg = this.structureBuilder.buildCommercialBuilding({
      width: 24.0,
      depth: 14.0,
      stories: 2,
      storyHeight: 3.5,
      colorWall: 0xeedcbd,
      colorTrim: 0x0284c7,
      subterraneanDepth: 3.5
    });
    surfShop.add(surfBldg);

    // Surf shop glowing sign
    const surfSign = new THREE.Mesh(new THREE.BoxGeometry(16, 2.0, 0.4), this.matStoreAwningBlue);
    surfSign.position.set(0, 7.8, 7.2);
    surfShop.add(surfSign);

    const surfText = new THREE.Mesh(new THREE.BoxGeometry(13, 0.9, 0.5), this.matNeonCyan);
    surfText.position.set(0, 7.8, 7.3);
    surfShop.add(surfText);

    // Outdoor Surfboard Display Racks with vibrant surfboards
    const boardColors = [0x00e5ff, 0xffeb3b, 0xff3b30, 0x10b981];
    boardColors.forEach((col, i) => {
      const boardMat = new THREE.MeshBasicMaterial({ color: col });
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.65), boardMat);
      board.position.set(-6 + i * 1.0, 1.4, 7.8);
      board.rotation.z = 0.08;
      surfShop.add(board);
    });

    promenadeGroup.add(surfShop);

    // 4. Pacific Coast Diner & Soda Fountain (Z = 3150m, X = +28m)
    const dinerT = this.splineRoad.getRoadTransformAtZ(3150, 28, 0);
    const diner = new THREE.Group();
    diner.position.copy(dinerT.pos);
    diner.rotation.y = dinerT.heading - Math.PI * 0.5;

    const dinerBldg = this.structureBuilder.buildCommercialBuilding({
      width: 22.0,
      depth: 12.0,
      stories: 1,
      storyHeight: 4.2,
      colorWall: 0xf1f5f9,
      colorTrim: 0xd9383a,
      subterraneanDepth: 3.5
    });
    diner.add(dinerBldg);

    // Rooftop Neon "PACIFIC DINER" Sign
    const dinerSign = new THREE.Mesh(new THREE.BoxGeometry(14, 1.8, 0.4), this.matNeonRed);
    dinerSign.position.set(0, 5.4, 6.2);
    diner.add(dinerSign);

    const dinerText = new THREE.Mesh(new THREE.BoxGeometry(11, 0.8, 0.5), this.matNeonYellow);
    dinerText.position.set(0, 5.4, 6.3);
    diner.add(dinerText);

    // Diner outdoor umbrella patio
    [-4, 4].forEach(tx => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8), this.matInclineConcrete);
      table.position.set(tx, 0.75, 7.5);
      diner.add(table);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), this.matChromeBar);
      pole.position.set(tx, 1.6, 7.5);
      diner.add(pole);
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 8), this.matStoreAwningRed);
      umbrella.position.set(tx, 3.0, 7.5);
      diner.add(umbrella);
    });

    promenadeGroup.add(diner);

    // Continuous asphalt apron & sidewalk in front of stores (Z = 2995m to 3175m)
    for (let pz = 3000; pz <= 3160; pz += 40) {
      const lotT = this.splineRoad.getRoadTransformAtZ(pz, 24, 0);
      const apron = new THREE.Mesh(new THREE.PlaneGeometry(28, 40), this.matAsphaltLot);
      apron.rotateX(-Math.PI * 0.5);
      apron.position.copy(lotT.pos);
      apron.position.y = 0.03;
      promenadeGroup.add(apron);
    }

    this.group.add(promenadeGroup);
  }

  // 2. Malibu Pier & Surfrider Beach (Z = 2260m)
  buildMalibuPier() {
    const transform = this.splineRoad.getRoadTransformAtZ(2260, -42, 0);
    const pier = new THREE.Group();
    pier.position.copy(transform.pos);
    pier.rotation.y = transform.heading;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(18, 1.4, 95), this.matPierDeck);
    deck.position.set(0, 1.8, 0);
    pier.add(deck);

    // Drive-on Access Ramp from PCH Shoulder
    const accessRamp = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 34), this.matPierDeck);
    accessRamp.position.set(20, 0.9, -44);
    accessRamp.rotation.z = Math.PI * 0.04;
    pier.add(accessRamp);

    // Ocean Stunt Launch Ramp at End of Pier
    const launchRamp = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 8), this.matPierDeck);
    launchRamp.position.set(0, 2.3, 44);
    launchRamp.rotation.x = -Math.PI * 0.10;
    pier.add(launchRamp);

    [-24, 24].forEach(pz => {
      const pav = new THREE.Group();
      pav.position.set(0, 2.5, pz);

      const bldg = new THREE.Mesh(new THREE.BoxGeometry(12, 6.5, 14), this.matStuccoWhite);
      bldg.position.y = 3.25;
      pav.add(bldg);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 4.0, 4), this.matRoofGreen);
      roof.position.y = 8.25;
      roof.rotation.y = Math.PI * 0.25;
      pav.add(roof);

      pier.add(pav);
    });

    this.group.add(pier);
  }

  // 3. Carbon Beach Luxury Mansions
  buildCarbonBeachMansions() {
    const mansionZs = [2420, 2520, 2620];
    mansionZs.forEach((z, idx) => {
      const transform = this.splineRoad.getRoadTransformAtZ(z, -36, 0);
      const villa = new THREE.Group();
      villa.position.copy(transform.pos);
      villa.rotation.y = transform.heading + 0.15 * (idx % 2 === 0 ? 1 : -1);

      for (let stX = -9; stX <= 9; stX += 6) {
        for (let stZ = -6; stZ <= 6; stZ += 6) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), this.matDarkTrim);
          stilt.position.set(stX, 2.5, stZ);
          villa.add(stilt);
        }
      }

      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 15), this.matStuccoWhite);
      floor1.position.y = 7.75;
      floor1.castShadow = true;
      villa.add(floor1);

      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 12), this.matModernWood);
      floor2.position.set(2, 12.75, 0);
      villa.add(floor2);

      const pool = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 5), this.matPoolWater);
      pool.position.set(0, 5.2, 9);
      villa.add(pool);

      this.group.add(villa);
    });
  }

  // 4. Hillside Modern Villas
  buildHillsideModernVillas() {
    const villaSpots = [1900, 2100, 2700, 3000];
    villaSpots.forEach(z => {
      const transform = this.splineRoad.getRoadTransformAtZ(z, 32, 6);
      const villa = new THREE.Group();
      villa.position.copy(transform.pos);
      villa.rotation.y = transform.heading - 0.25;

      const mainBox = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 14), this.matStuccoWhite);
      mainBox.position.y = 3.5;
      mainBox.castShadow = true;
      villa.add(mainBox);

      const vine = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), this.matBougainvillea);
      vine.position.set(-8, 5, 6);
      vine.scale.set(1.4, 0.7, 1.2);
      villa.add(vine);

      this.group.add(villa);
    });
  }

  // 5. Zuma Beach Lifeguard Towers
  buildZumaLifeguardTowers() {
    const towers = [2720, 2820];
    towers.forEach((z) => {
      const transform = this.splineRoad.getRoadTransformAtZ(z, -30, 0);
      const tower = new THREE.Group();
      tower.position.copy(transform.pos);
      tower.rotation.y = transform.heading;

      for (let lx = -2.2; lx <= 2.2; lx += 4.4) {
        for (let lz = -2.2; lz <= 2.2; lz += 4.4) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5, 4), this.matModernWood);
          leg.position.set(lx, 2.25, lz);
          tower.add(leg);
        }
      }

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 4.5), this.matLifeguardBlue);
      cabin.position.y = 5.8;
      cabin.castShadow = true;
      tower.add(cabin);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 5.2), this.matLifeguardWhite);
      roof.position.y = 7.5;
      tower.add(roof);

      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.9, 6), this.matRescueRed);
      can.position.set(2.4, 5.0, 0);
    tower.add(can);

      this.group.add(tower);
    });
  }

  // 1. Original Santa Monica Muscle Beach (Z = 2700m, X = -28m)
  buildOriginalMuscleBeach() {
    const transform = this.splineRoad.getRoadTransformAtZ(2700, -28.0, 0);
    const gym = new THREE.Group();
    gym.position.copy(transform.pos);
    gym.rotation.y = transform.heading;

    // Raised Wood/Sand Fitness Deck
    const platform = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), this.matModernWood);
    platform.position.y = 0.2;
    platform.castShadow = true;
    gym.add(platform);

    // Gymnastics Ring Tower (Tall A-frame posts with hanging rings)
    [-4.5, 4.5].forEach(tx => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.matChromeBar);
      post.position.set(tx, 3.25, -3);
      gym.add(post);
    });
    const ringCrossBar = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.15, 0.15), this.matChromeBar);
    ringCrossBar.position.set(0, 6.4, -3);
    gym.add(ringCrossBar);

    // Gymnastic Rings
    [-1.2, 1.2].forEach(rx => {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 4), this.matModernWood);
      rope.position.set(rx, 5.2, -3);
      gym.add(rope);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 6, 12), this.matModernWood);
      ring.position.set(rx, 4.0, -3);
      gym.add(ring);
    });

    // Parallel Bars
    [-1.8, 1.8].forEach(px => {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 6), this.matModernWood);
      bar.rotation.x = Math.PI * 0.5;
      bar.position.set(px, 1.4, 2.5);
      gym.add(bar);

      [-1.8, 1.8].forEach(pz => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 4), this.matChromeBar);
        leg.position.set(px, 0.7, 2.5 + pz);
        gym.add(leg);
      });
    });

    // Cast Iron Barbell & Weight Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 2.4), this.matDarkTrim);
    bench.position.set(4.5, 0.5, 2.0);
    gym.add(bench);

    const barbellBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), this.matChromeBar);
    barbellBar.rotation.z = Math.PI * 0.5;
    barbellBar.position.set(4.5, 1.2, 2.0);
    gym.add(barbellBar);

    [-0.95, 0.95].forEach(wx => {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 8), this.matDarkTrim);
      plate.rotation.z = Math.PI * 0.5;
      plate.position.set(4.5 + wx, 1.2, 2.0);
      gym.add(plate);
    });

    this.group.add(gym);
  }

  // 4. Will Rogers State Beach & Baywatch Lifeguard HQ (Z = 3200m, X = -25m)
  buildWillRogersAndBaywatchHQ() {
    const transform = this.splineRoad.getRoadTransformAtZ(3200, -25, 0);
    const hq = new THREE.Group();
    hq.position.copy(transform.pos);
    hq.rotation.y = transform.heading + Math.PI * 0.45;

    // Two-Story Main Lifeguard Headquarters
    const bldgLower = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 10), this.matStuccoWhite);
    bldgLower.position.y = 2.25;
    bldgLower.castShadow = true;
    hq.add(bldgLower);

    const bldgUpper = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 8), this.matLifeguardBlue);
    bldgUpper.position.set(0, 6.25, 0);
    bldgUpper.castShadow = true;
    hq.add(bldgUpper);

    // Observation Tower & Antenna
    const tower = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.0, 4.5), this.matLifeguardWhite);
    tower.position.set(0, 9.5, 0);
    hq.add(tower);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 6.0, 4), this.matChromeBar);
    antenna.position.set(0, 14.0, 0);
    hq.add(antenna);

    // Yellow Baywatch Rescue 4x4 Truck parked in lot
    const truck = new THREE.Group();
    truck.position.set(10, 0, 8);
    truck.rotation.y = -Math.PI * 0.3;

    const truckBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 4.8), this.matBaywatchYellow);
    truckBody.position.y = 1.1;
    truckBody.castShadow = true;
    truck.add(truckBody);

    const truckCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 2.6), this.matBaywatchYellow);
    truckCab.position.set(0, 2.3, -0.4);
    truck.add(truckCab);

    // Flashing Red Emergency Lightbar on roof
    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.4), this.matRescueRed);
    lightbar.position.set(0, 2.9, -0.4);
    truck.add(lightbar);

    // Yellow Rescue Surfboard in Truck Bed
    const truckBoard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 2.8), this.matRescueRed);
    truckBoard.position.set(0.4, 1.8, 1.4);
    truckBoard.rotation.x = 0.2;
    truck.add(truckBoard);

    hq.add(truck);
    this.group.add(hq);
  }

  // 5. The Getty Villa — Roman Country House & Colonnade (Z = 3500m, X = +38m)
  buildTheGettyVilla() {
    const transform = this.splineRoad.getRoadTransformAtZ(3500, 38, 0);
    const villa = new THREE.Group();
    villa.position.copy(transform.pos);
    villa.position.y += 12; // Elevated on Pacific Palisades hillside
    villa.rotation.y = transform.heading - Math.PI * 0.45;

    // Grand Roman Peristyle Main Hall
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 20), this.matRomanMarble);
    mainHall.position.y = 4.5;
    mainHall.castShadow = true;
    villa.add(mainHall);

    // Classical Terracotta Pediment Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(22, 5.0, 4), this.matTileTerraCotta);
    roof.position.y = 11.5;
    roof.rotation.y = Math.PI * 0.25;
    villa.add(roof);

    // Grand Outer Colonnade (12 Fluted Marble Columns)
    for (let c = -14; c <= 14; c += 5.6) {
      const colFront = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 8.5, 8), this.matRomanMarble);
      colFront.position.set(c, 4.25, 11.5);
      colFront.castShadow = true;
      villa.add(colFront);
    }

    // Central Sunken Reflecting Pool (Teal Water)
    const pool = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 12), this.matPoolWater);
    pool.position.set(0, 0.3, 18);
    villa.add(pool);

    // Italian Cypress Trees flanking the villa
    [-18, 18].forEach(cx => {
      [6, 18].forEach(cz => {
        const cypress = new THREE.Mesh(new THREE.ConeGeometry(1.6, 12.0, 6), this.matCypressGreen);
        cypress.position.set(cx, 6.0, cz);
        cypress.castShadow = true;
        villa.add(cypress);
      });
    });

    this.group.add(villa);
  }

  // 6. Topanga Canyon Bohemian Surf Shack & Classic VW Hippie Bus (Z = 3800m, X = +36m)
  buildTopangaCanyonSurfShackAndVWBus() {
    const transform = this.splineRoad.getRoadTransformAtZ(3800, 36, 0);
    const topanga = new THREE.Group();
    topanga.position.copy(transform.pos);
    topanga.rotation.y = transform.heading - Math.PI * 0.4;

    // Authentic Coastal Cedar Surf Shack with Pilings Foundation & Tin Roof
    const shack = this.structureBuilder.buildCoastalSeafoodShack({
      width: 16.0,
      depth: 10.0,
      height: 5.5,
      colorSiding: 0x9c6d48,
      colorRoof: 0x78909c,
      subterraneanDepth: 3.0
    });
    topanga.add(shack);


    // Handcrafted Wooden Surf Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.6, 0.3), this.matRoute66Brown);
    sign.position.set(0, 7.0, 5.2);
    topanga.add(sign);

    // Classic 1968 Volkswagen Type 2 Westfalia Camper Van ("Hippie Bus")
    const bus = new THREE.Group();
    bus.position.set(11, 0, 4);
    bus.rotation.y = -Math.PI * 0.2;

    // Teal Lower Body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 4.6), this.matVWTeal);
    lowerBody.position.y = 0.8;
    lowerBody.castShadow = true;
    bus.add(lowerBody);

    // White Upper Cab & Roof
    const upperCab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 4.4), this.matVWWhite);
    upperCab.position.set(0, 1.95, 0);
    bus.add(upperCab);

    // Panoramic Windshield & Side Glass
    const busGlass = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.7, 4.2), this.matGlassAqua);
    busGlass.position.set(0, 1.95, 0);
    bus.add(busGlass);

    // Dual Colorful Surfboards on Bus Roof Rack
    const busBoard1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 3.4), this.matGoldenPoppy);
    busBoard1.position.set(-0.4, 2.6, 0);
    bus.add(busBoard1);

    const busBoard2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 3.2), this.matSurfboardCyan);
    busBoard2.position.set(0.4, 2.6, 0);
    bus.add(busBoard2);

    topanga.add(bus);
    this.group.add(topanga);
  }

  // 7. Malibu Pier & Surfrider Beach (Z = 4100m)
  buildMalibuPier() {
    const transform = this.splineRoad.getRoadTransformAtZ(4100, -42, 0);
    const pier = new THREE.Group();
    pier.position.copy(transform.pos);
    pier.rotation.y = transform.heading;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(18, 1.4, 95), this.matPierDeck);
    deck.position.set(0, 1.8, 0);
    pier.add(deck);

    // Drive-on Access Ramp from PCH Shoulder
    const accessRamp = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 34), this.matPierDeck);
    accessRamp.position.set(20, 0.9, -44);
    accessRamp.rotation.z = Math.PI * 0.04;
    pier.add(accessRamp);

    // Ocean Stunt Launch Ramp at End of Pier
    const launchRamp = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 8), this.matPierDeck);
    launchRamp.position.set(0, 2.3, 44);
    launchRamp.rotation.x = -Math.PI * 0.10;
    pier.add(launchRamp);

    [-24, 24].forEach(pz => {
      const pav = new THREE.Group();
      pav.position.set(0, 2.5, pz);

      const bldg = new THREE.Mesh(new THREE.BoxGeometry(12, 6.5, 14), this.matStuccoWhite);
      bldg.position.y = 3.25;
      pav.add(bldg);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 4.0, 4), this.matRoofGreen);
      roof.position.y = 8.25;
      roof.rotation.y = Math.PI * 0.25;
      pav.add(roof);

      pier.add(pav);
    });

    this.group.add(pier);
  }

  // 8. Carbon Beach Luxury Mansions (Z = 4300 - 4550m)
  buildCarbonBeachMansions() {
    const mansionZs = [4300, 4420, 4540];
    mansionZs.forEach((z, idx) => {
      const transform = this.splineRoad.getRoadTransformAtZ(z, -36, 0);
      const villa = new THREE.Group();
      villa.position.copy(transform.pos);
      villa.rotation.y = transform.heading + 0.15 * (idx % 2 === 0 ? 1 : -1);

      for (let stX = -9; stX <= 9; stX += 6) {
        for (let stZ = -6; stZ <= 6; stZ += 6) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), this.matDarkTrim);
          stilt.position.set(stX, 2.5, stZ);
          villa.add(stilt);
        }
      }

      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 15), this.matStuccoWhite);
      floor1.position.y = 7.75;
      floor1.castShadow = true;
      villa.add(floor1);

      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 12), this.matModernWood);
      floor2.position.set(2, 12.75, 0);
      villa.add(floor2);

      const pool = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 5), this.matPoolWater);
      pool.position.set(0, 5.2, 9);
      villa.add(pool);

      this.group.add(villa);
    });
  }

  // 9. Hillside Modern Villas (Z = 3350m - 4750m)
  buildHillsideModernVillas() {
    const villaSpots = [3350, 3650, 4250, 4750];
    villaSpots.forEach(z => {
      const transform = this.splineRoad.getRoadTransformAtZ(z, 32, 6);
      const villa = new THREE.Group();
      villa.position.copy(transform.pos);
      villa.rotation.y = transform.heading - 0.25;

      const mainBox = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 14), this.matStuccoWhite);
      mainBox.position.y = 3.5;
      mainBox.castShadow = true;
      villa.add(mainBox);

      const vine = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), this.matBougainvillea);
      vine.position.set(-8, 5, 6);
      vine.scale.set(1.4, 0.7, 1.2);
      villa.add(vine);

      this.group.add(villa);
    });
  }

  // 10. Zuma Beach Lifeguard Towers (Z = 4600m, 4700m)
  buildZumaLifeguardTowers() {
    const towers = [4600, 4700];
    towers.forEach((z) => {
      const transform = this.splineRoad.getRoadTransformAtZ(z, -30, 0);
      const tower = new THREE.Group();
      tower.position.copy(transform.pos);
      tower.rotation.y = transform.heading;

      for (let lx = -2.2; lx <= 2.2; lx += 4.4) {
        for (let lz = -2.2; lz <= 2.2; lz += 4.4) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5, 4), this.matModernWood);
          leg.position.set(lx, 2.25, lz);
          tower.add(leg);
        }
      }

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 4.5), this.matLifeguardBlue);
      cabin.position.y = 5.8;
      cabin.castShadow = true;
      tower.add(cabin);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 5.2), this.matLifeguardWhite);
      roof.position.y = 7.5;
      tower.add(roof);

      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.9, 6), this.matRescueRed);
      can.position.set(2.4, 5.0, 0);
      tower.add(can);

      this.group.add(tower);
    });
  }

  // 11. Point Dume Marine Nature Reserve & Whale Overlook (Z = 4800m, X = -32m)
  buildPointDumeMarineReserve() {
    const transform = this.splineRoad.getRoadTransformAtZ(4800, -32, 0);
    const dume = new THREE.Group();
    dume.position.copy(transform.pos);
    dume.rotation.y = transform.heading + Math.PI * 0.45;

    // Rocky Headland Bluff Monolith projecting toward ocean
    const cliff = new THREE.Mesh(new THREE.DodecahedronGeometry(18, 1), this.matSandstoneMugu);
    cliff.scale.set(1.4, 1.2, 1.6);
    cliff.position.set(0, 8, 0);
    cliff.castShadow = true;
    dume.add(cliff);

    // Wooden Observation Lookout Deck atop headland
    const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 16), this.matModernWood);
    deck.position.set(0, 15.4, 0);
    dume.add(deck);

    // White Perimeter Safety Railings
    const railing = new THREE.Mesh(new THREE.BoxGeometry(16.2, 1.2, 16.2), this.matLifeguardWhite);
    railing.position.set(0, 16.2, 0);
    dume.add(railing);

    // Whale-Watching Telescope Viewers
    [-4, 4].forEach(tx => {
      const scopePost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), this.matChromeBar);
      scopePost.position.set(tx, 16.5, -6.5);
      dume.add(scopePost);

      const scopeHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.8), this.matChromeBar);
      scopeHead.position.set(tx, 17.2, -6.5);
      scopeHead.rotation.x = -0.15;
      dume.add(scopeHead);
    });

    this.group.add(dume);
  }

  // 12. El Matador Sea Arches & Wave-Carved Stacks (Z = 4950m, X = -38m)
  buildElMatadorSeaArches() {
    const transform = this.splineRoad.getRoadTransformAtZ(4950, -38, 0);
    const archGroup = new THREE.Group();
    archGroup.position.copy(transform.pos);
    archGroup.rotation.y = transform.heading;

    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(22, 1), this.matSandstoneMugu);
    rock.scale.set(1.4, 1.8, 1.1);
    rock.position.set(0, 16, 0);
    rock.castShadow = true;
    archGroup.add(rock);

    // Wave-carved hollow arch cutout
    const archTunnel = new THREE.Mesh(new THREE.TorusGeometry(10, 3.2, 8, 16, Math.PI), this.matSandstoneGold);
    archTunnel.position.set(0, 10, 0);
    archTunnel.rotation.x = Math.PI * 0.5;
    archGroup.add(archTunnel);

    this.group.add(archGroup);
  }

  // 13. Upgraded Neptune's Net Seafood Roadhouse (Z = 5050m, X = +34m)
  buildNeptunesNetRoadhouse() {
    const transform = this.splineRoad.getRoadTransformAtZ(5050, 34, 0);
    const roadhouse = new THREE.Group();
    roadhouse.position.copy(transform.pos);
    roadhouse.rotation.y = transform.heading - Math.PI * 0.15;

    // Authentic Weathered Red Seafood Roadhouse with Wharf Pier Deck
    const shack = this.structureBuilder.buildCoastalSeafoodShack({
      width: 26.0,
      depth: 16.0,
      height: 7.0,
      colorSiding: 0xb71c1c,
      colorRoof: 0x78909c,
      subterraneanDepth: 3.5
    });
    roadhouse.add(shack);


    // Giant Glowing Neon Lobster Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(14, 3.2, 0.6), this.matNeonLobster);
    sign.position.set(0, 10.2, 8.4);
    roadhouse.add(sign);

    // Outdoor Gravel Dining Patio with Red Picnic Tables
    for (let t = -8; t <= 8; t += 8) {
      const table = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 2.2), this.matNeptuneRed);
      table.position.set(t, 0.45, 12);
      table.castShadow = true;
      roadhouse.add(table);
    }

    // Row of Parked Harley-Style Cruiser Motorcycles
    [-6, -3, 0].forEach(mx => {
      const bike = new THREE.Group();
      bike.position.set(mx, 0, 17);
      bike.rotation.y = Math.PI * 0.1;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 2.2), this.matHarleyBlack);
      frame.position.y = 0.6;
      bike.add(frame);

      const engine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), this.matChromeBar);
      engine.position.set(0, 0.5, 0);
      bike.add(engine);

      roadhouse.add(bike);
    });

    // Fast & Furious Tribute Orange Tuner Sports Car
    const orangeCar = new THREE.Group();
    orangeCar.position.set(8, 0, 18);
    orangeCar.rotation.y = -Math.PI * 0.15;

    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.1, 4.8), this.matFastOrange);
    carBody.position.y = 0.7;
    carBody.castShadow = true;
    orangeCar.add(carBody);

    const carCab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 2.4), this.matDarkTrim);
    carCab.position.set(0, 1.5, -0.3);
    orangeCar.add(carCab);

    const carWing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.6), this.matDarkTrim);
    carWing.position.set(0, 1.7, -2.1);
    orangeCar.add(carWing);

    roadhouse.add(orangeCar);
    this.group.add(roadhouse);
  }

  // 14. Point Mugu Rock Monolith (Z = 5150m)
  buildPointMuguRock() {
    const leftTrans = this.splineRoad.getRoadTransformAtZ(5150, -28, 0);
    const muguRock = new THREE.Group();
    muguRock.position.copy(leftTrans.pos);
    muguRock.rotation.y = leftTrans.heading;

    const rockGeo = new THREE.DodecahedronGeometry(26, 1);
    rockGeo.scale(1.2, 2.2, 1.3);
    const rockMesh = new THREE.Mesh(rockGeo, this.matSandstoneMugu);
    rockMesh.position.y = 26;
    rockMesh.castShadow = true;
    muguRock.add(rockMesh);
    this.group.add(muguRock);

    const rightTrans = this.splineRoad.getRoadTransformAtZ(5150, 28, 0);
    const mountainBluff = new THREE.Group();
    mountainBluff.position.copy(rightTrans.pos);
    mountainBluff.rotation.y = rightTrans.heading;

    const bluffGeo = new THREE.DodecahedronGeometry(30, 1);
    bluffGeo.scale(1.5, 2.0, 1.5);
    const bluffMesh = new THREE.Mesh(bluffGeo, this.matSandstoneGold);
    bluffMesh.position.y = 28;
    mountainBluff.add(bluffMesh);
    this.group.add(mountainBluff);
  }

  // 14b. Point Mugu Naval Missile Park Memorial & Telemetry Tracker (Z = 5120m, X = +34m)
  buildPointMuguMissilePark() {
    const t = this.splineRoad.getRoadTransformAtZ(5120, 34, 0);
    const parkGroup = new THREE.Group();
    parkGroup.position.copy(t.pos);
    parkGroup.rotation.y = t.heading - Math.PI * 0.5;

    const matPlaza = this.renderer.createToonMaterial({ color: 0x94a3b8, gradientBands: 3 });
    const matMissileWhite = this.renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 4, rimColor: 0x38bdf8, rimPower: 2.5 });
    const matMissileRed = this.renderer.createToonMaterial({ color: 0xd97706, gradientBands: 2 });
    const matPylon = this.renderer.createToonMaterial({ color: 0x475569, gradientBands: 2 });
    const matRadar = this.renderer.createToonMaterial({ color: 0x64748b, gradientBands: 2 });

    // 1. Concrete Memorial Plaza Platform (28m x 20m)
    const plaza = new THREE.Mesh(new THREE.BoxGeometry(28, 1.2, 20), matPlaza);
    plaza.position.set(0, 0.4, 0);
    plaza.receiveShadow = true;
    parkGroup.add(plaza);

    // 2. Concrete Angled Launcher Pylon
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.8, 7.5), matPylon);
    pylon.position.set(-3, 2.5, 0);
    parkGroup.add(pylon);

    // 3. Supersonic Interceptor Missile Monument (mounted on angled rail)
    const missileMount = new THREE.Group();
    missileMount.position.set(-3, 4.4, 0);
    missileMount.rotation.z = 0.45; // 26-degree climb launch angle

    // Main fuselage cylinder
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 12, 16), matMissileWhite);
    fuselage.rotation.z = Math.PI * 0.5;
    missileMount.add(fuselage);

    // Conical radome nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.2, 16), matMissileRed);
    nose.rotation.z = -Math.PI * 0.5;
    nose.position.set(7.6, 0, 0);
    missileMount.add(nose);

    // Dual swept delta wings
    const wingGeo = new THREE.BoxGeometry(4.8, 0.12, 6.2);
    const wings = new THREE.Mesh(wingGeo, matMissileWhite);
    wings.position.set(-1.0, 0, 0);
    missileMount.add(wings);

    // Quad cruciform tail control fins
    [-1, 1].forEach(sign => {
      const vFin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 0.1), matMissileRed);
      vFin.position.set(-5.0, sign * 1.1, 0);
      missileMount.add(vFin);
      const hFin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 2.2), matMissileRed);
      hFin.position.set(-5.0, 0, sign * 1.1);
      missileMount.add(hFin);
    });

    // Rear rocket nozzle
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.4, 12), matPylon);
    nozzle.rotation.z = Math.PI * 0.5;
    nozzle.position.set(-6.5, 0, 0);
    missileMount.add(nozzle);

    parkGroup.add(missileMount);

    // 4. Parabolic Naval Telemetry Radar Dish
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 5.5, 8), matPylon);
    radarMast.position.set(7.5, 3.4, -5.5);
    parkGroup.add(radarMast);

    const dish = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), matRadar);
    dish.position.set(7.5, 6.0, -5.5);
    dish.rotation.x = -0.5;
    dish.rotation.y = 0.8;
    parkGroup.add(dish);

    // 5. Ceremonial Flagpole & Bronze Memorial Plinth
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 10, 8), this.matChromeBar);
    flagPole.position.set(9.0, 5.5, 5.5);
    parkGroup.add(flagPole);

    const flag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.06), matMissileRed);
    flag.position.set(10.1, 9.6, 5.5);
    parkGroup.add(flag);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.4), matPylon);
    plinth.position.set(2.0, 1.4, 6.5);
    parkGroup.add(plinth);

    const bronzePlaque = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    bronzePlaque.position.set(2.0, 1.6, 7.25);
    parkGroup.add(bronzePlaque);

    this.group.add(parkGroup);
  }

  // 15. Tall California Fan Palms with Gentle Wind Sway (Z = 2620 - 5180m)
  buildCaliforniaFanPalms() {
    const palmGeoTrunk = new THREE.CylinderGeometry(0.28, 0.48, 16, 6);
    const palmGeoSkirt = new THREE.ConeGeometry(1.2, 2.6, 6);
    const palmGeoFrond = new THREE.ConeGeometry(3.6, 1.4, 7);

    this.palmCrowns = [];
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const palmCount = isMobile ? 80 : 160;
    const zStep = isMobile ? 32 : 16;

    for (let i = 0; i < palmCount; i++) {
      const z = 2620 + i * zStep + (Math.random() - 0.5) * 8;
      const side = (i % 2 === 0) ? 1 : -1;
      const latOffset = side * (15.5 + Math.random() * 26);

      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0);
      const palm = new THREE.Group();
      palm.position.copy(transform.pos);
      palm.rotation.y = transform.heading;

      const trunk = new THREE.Mesh(palmGeoTrunk, this.matPalmTrunk);
      trunk.position.y = 8.0;
      trunk.rotation.z = (Math.random() - 0.5) * 0.08;
      palm.add(trunk);

      const skirt = new THREE.Mesh(palmGeoSkirt, this.matPalmSkirt);
      skirt.position.y = 15.2;
      palm.add(skirt);

      const crown = new THREE.Mesh(palmGeoFrond, this.matPalmFrond);
      crown.position.y = 16.5;
      crown.scale.set(1.4, 0.8, 1.4);
      crown.castShadow = true;
      palm.add(crown);

      this.palmCrowns.push({
        mesh: crown,
        z: transform.pos.z,
        phase: i * 0.4,
        speed: 1.8 + Math.random() * 0.6
      });

      this.group.add(palm);
    }
  }

  // 16. California Golden Poppies & Coastal Purple Lupines
  buildCaliforniaWildflowers() {
    const poppyGeo = new THREE.DodecahedronGeometry(0.45, 1);
    const lupineGeo = new THREE.ConeGeometry(0.35, 1.2, 5);
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const flowerCount = isMobile ? 50 : 120;
    const zStep = isMobile ? 50 : 21;

    for (let w = 0; w < flowerCount; w++) {
      const z = 2650 + w * zStep + (Math.random() - 0.5) * 12;
      const side = Math.random() > 0.5 ? 1 : -1;
      const latOffset = side * (14.5 + Math.random() * 16);
      const transform = this.splineRoad.getRoadTransformAtZ(z, latOffset, 0.2);

      const cluster = new THREE.Group();
      cluster.position.copy(transform.pos);

      // Poppies
      for (let p = 0; p < 4; p++) {
        const flower = new THREE.Mesh(poppyGeo, this.matGoldenPoppy);
        flower.position.set((Math.random() - 0.5) * 2.0, 0.3, (Math.random() - 0.5) * 2.0);
        cluster.add(flower);
      }

      // Coastal Lupines
      for (let l = 0; l < 3; l++) {
        const lupine = new THREE.Mesh(lupineGeo, this.matCoastalLupine);
        lupine.position.set((Math.random() - 0.5) * 2.2, 0.6, (Math.random() - 0.5) * 2.2);
        cluster.add(lupine);
      }

      this.group.add(cluster);
    }
  }

  // 17. Steel Guardrails
  buildCoastalGuardrails() {
    const isMobile = Boolean(this.renderer && this.renderer.isMobile);
    const guardrailStep = isMobile ? 60 : 30;
    for (let z = 2620; z <= 5180; z += guardrailStep) {
      const transform = this.splineRoad.getRoadTransformAtZ(z, -18.0, 0);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, guardrailStep), this.matGuardrail);
      rail.position.set(transform.pos.x, transform.pos.y + 0.6, transform.pos.z);
      rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      this.group.add(rail);

      for (let pz = -12; pz <= 12; pz += 6) {
        const postTrans = this.splineRoad.getRoadTransformAtZ(z + pz, -18.0, 0);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 4), this.matDarkTrim);
        post.position.set(postTrans.pos.x, postTrans.pos.y + 0.6, postTrans.pos.z);
        this.group.add(post);
      }
    }
  }

  // 18. Caltrans Highway Signage
  buildMalibuHighwaySignage() {
    const signs = [
      { z: 2650, text: 'CA-1 PACIFIC COAST HWY\nMALIBU 8 MI / PT MUGU 24 MI' },
      { z: 3700, text: 'MALIBU PIER & SURFRIDER BEACH\nNEXT RIGHT' },
      { z: 4600, text: 'ZUMA BEACH\nLIFEGUARD HEADQUARTERS' },
      { z: 5000, text: "NEPTUNE'S NET SEAFOOD\nFAMOUS ROADSIDE EATS" }
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
      const signTex = this.renderer.textures.highwaySign(line1, line2 || '', '#065f46');
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signMaterials = [
        this.matHwySignGreen, // +X
        this.matHwySignGreen, // -X
        this.matHwySignGreen, // +Y
        this.matHwySignGreen, // -Y
        signMat,              // +Z (Front face facing oncoming traffic)
        this.matHwySignGreen  // -Z (Back face)
      ];
      const board = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.6, 0.22), signMaterials);
      board.position.y = 5.5;
      signGroup.add(board);

      this.group.add(signGroup);
    });
  }

  // 19. Beach Cabana Umbrellas
  buildCoastalBeachProps() {
    const umbrellaColors = [this.matUmbrellaRed, this.matUmbrellaYellow, this.matUmbrellaTeal];

    for (let u = 0; u < 22; u++) {
      const z = 2700 + u * 110;
      const transform = this.splineRoad.getRoadTransformAtZ(z, -26.0 - Math.random() * 8, 0);

      const umbrella = new THREE.Group();
      umbrella.position.copy(transform.pos);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 4), this.matModernWood);
      pole.position.y = 1.5;
      umbrella.add(pole);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.8, 8), umbrellaColors[u % 3]);
      canopy.position.y = 2.8;
      umbrella.add(canopy);

      this.group.add(umbrella);
    }
  }

  // 20. Ocean Surf Foam & Offshore Sailboats
  buildOceanWavesAndSailboats() {
    for (let w = 0; w < 16; w++) {
      const z = 2650 + w * 160;
      const transform = this.splineRoad.getRoadTransformAtZ(z, -48.0, 0);

      const waveGeo = new THREE.PlaneGeometry(12.0, 60.0);
      waveGeo.rotateX(-Math.PI * 0.5);
      const waveMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.position.copy(transform.pos);
      waveMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);

      this.group.add(waveMesh);
      this.waveMeshes.push({
        mesh: waveMesh,
        baseX: transform.pos.x,
        phase: w * 0.7,
        speed: 1.1 + Math.random() * 0.4
      });
    }

    [-110, -160, -210, -140].forEach((lat, idx) => {
      const transform = this.splineRoad.getRoadTransformAtZ(2900 + idx * 600, lat, 0);
      const boat = new THREE.Group();
      boat.position.copy(transform.pos);
      boat.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);

      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 12), this.matStuccoWhite);
      hull.position.y = 0.9;
      boat.add(hull);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 16, 4), this.matDarkTrim);
      mast.position.set(0, 8, 0);
      boat.add(mast);

      const sail = new THREE.Mesh(new THREE.ConeGeometry(5.0, 13.0, 3), this.matSailWhite);
      sail.position.set(0, 8, 0);
      sail.scale.set(0.1, 1, 1);
      boat.add(sail);

      this.group.add(boat);
    });
  }

  // 21. Gliding Pelicans
  buildGlidingPelicans() {
    this.pelicanFlock = new THREE.Group();
    this.pelicanFlock.position.set(-30, 32, 7000);

    const pelicanOffsets = [
      { x: 0, z: 0 },
      { x: -5, z: -8 },
      { x: 5, z: -8 },
      { x: -10, z: -16 },
      { x: 10, z: -16 }
    ];

    pelicanOffsets.forEach(po => {
      const p = new THREE.Group();
      p.position.set(po.x, 0, po.z);

      const body = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 4), this.matPelican);
      body.rotation.x = Math.PI * 0.5;
      p.add(body);

      const wings = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 0.7), this.matPelican);
      wings.position.set(0, 0.1, 0.2);
      p.add(wings);

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.2, 4), this.matPelicanBeak);
      beak.position.set(0, -0.1, 1.6);
      beak.rotation.x = Math.PI * 0.5;
      p.add(beak);

      this.pelicanFlock.add(p);
    });

    this.group.add(this.pelicanFlock);
  }

  // Cross Creek / Malibu Country Mart — Primary Commercial Core of Malibu (Z=3700–3780m, X=+34)
  buildCrossCreekShoppingComplex() {
    const baseZ = 3740;

    // Malibu Country Mart — Spanish Colonial & Mediterranean arcade
    const martT = this.splineRoad.getRoadTransformAtZ(baseZ, 34, 0);
    const mart = new THREE.Group();
    mart.position.copy(martT.pos);
    // Face across road toward oncoming traffic
    mart.rotation.y = martT.heading - Math.PI * 0.5 - 0.22;

    const martArcade = this.structureBuilder.buildMarketArcade({
      width: 40.0,
      depth: 14.0,
      stories: 2,
      storyHeight: 3.6,
      colorBrick: 0xe8dcc8,
      colorTrim: 0xb04a28,
      subterraneanDepth: 3.5
    });
    mart.add(martArcade);

    // Outdoor cafe tables with market umbrellas
    for (let t = 0; t < 5; t++) {
      const tableX = -14 + t * 7;
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 10),
        this.renderer.createToonMaterial({ color: 0xf0f0f0, gradientBands: 2 }));
      table.position.set(tableX, 0.75, 8);
      mart.add(table);
      // Market umbrella
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.5, 6),
        this.renderer.createToonMaterial({ color: 0x8a8888, gradientBands: 2 }));
      pole.position.set(tableX, 1.75, 8);
      mart.add(pole);
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 8),
        this.renderer.createToonMaterial({ color: 0xf5f0e8, gradientBands: 2 }));
      umbrella.position.set(tableX, 3.3, 8);
      mart.add(umbrella);
    }

    this.group.add(mart);

    // Malibu Lumber Yard (adjacent, darker raw wood aesthetic)
    const lyardT = this.splineRoad.getRoadTransformAtZ(baseZ + 60, 34, 0);
    const lyard = new THREE.Group();
    lyard.position.copy(lyardT.pos);
    // Face across road toward oncoming traffic
    lyard.rotation.y = lyardT.heading - Math.PI * 0.5 - 0.22;

    const lyardBuilding = this.structureBuilder.buildCommercialBuilding({
      width: 28.0,
      depth: 12.0,
      stories: 2,
      storyHeight: 3.4,
      colorWall: 0x5c3a1e,
      colorTrim: 0xf5f0e8,
      subterraneanDepth: 3.5
    });
    lyard.add(lyardBuilding);

    const lyardSign = new THREE.Mesh(new THREE.BoxGeometry(20, 1.8, 0.35),
      this.renderer.createToonMaterial({ color: 0xf5f0e8, gradientBands: 2 }));
    lyardSign.position.set(0, 8.2, 5.6);
    lyard.add(lyardSign);
    const lyardSignText = new THREE.Mesh(new THREE.BoxGeometry(17, 0.5, 0.45),
      new THREE.MeshBasicMaterial({ color: 0x2a1a0a }));
    lyardSignText.position.set(0, 8.2, 5.65);
    lyard.add(lyardSignText);

    this.group.add(lyard);

    // Ralphs Supermarket
    const ralphsT = this.splineRoad.getRoadTransformAtZ(baseZ + 30, 40, 0);
    const ralphs = new THREE.Group();
    ralphs.position.copy(ralphsT.pos);
    // Face across road toward oncoming traffic
    ralphs.rotation.y = ralphsT.heading - Math.PI * 0.5 - 0.22;


    const ralphsBuilding = this.structureBuilder.buildCommercialBuilding({
      width: 35.0,
      depth: 18.0,
      stories: 2,
      storyHeight: 3.2,
      colorWall: 0xf0efe8,
      colorTrim: 0x1565c0,
      subterraneanDepth: 3.5
    });
    ralphs.add(ralphsBuilding);

    const ralphsSign = new THREE.Mesh(new THREE.BoxGeometry(24, 3, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x1565c0 }));
    ralphsSign.position.set(0, 7.5, 9.2);
    ralphs.add(ralphsSign);
    const ralphsText = new THREE.Mesh(new THREE.BoxGeometry(20, 1.4, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ralphsText.position.set(0, 7.5, 9.3);
    ralphs.add(ralphsText);

    this.group.add(ralphs);

    // Large Ralphs parking lot
    const ralphsLotT = this.splineRoad.getRoadTransformAtZ(baseZ + 30, 52, 0);
    const ralphsLot = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), this.matAsphaltLot);
    ralphsLot.rotateX(-Math.PI * 0.5);
    ralphsLot.position.copy(ralphsLotT.pos);
    ralphsLot.position.y = 0.04;
    this.group.add(ralphsLot);

    // Cart corrals (small yellow painted squares)
    const matCartCorral = new THREE.MeshBasicMaterial({ color: 0xf5c518 });
    [[-20, 10], [0, 10], [20, 10], [-20, -10], [20, -10]].forEach(([cx, cz]) => {
      const corral = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 2), matCartCorral);
      corral.position.set(ralphsLotT.pos.x + cx, ralphsLotT.pos.y + 0.15, ralphsLotT.pos.z + cz);
      this.group.add(corral);
    });

    // Driveway aprons from PCH
    [3705, 3778].forEach(dz => {
      const driveT = this.splineRoad.getRoadTransformAtZ(dz, 18, 0);
      const drive = new THREE.Mesh(new THREE.PlaneGeometry(10, 14), this.matAsphaltLot);
      drive.rotateX(-Math.PI * 0.5);
      drive.position.copy(driveT.pos);
      drive.position.y = 0.03;
      this.group.add(drive);
    });
  }

  // Duke's Malibu — Hawaiian-theme 2-story restaurant on PCH (Z=4050m, X=-32)
  buildDukesMalibuRestaurant() {
    const transform = this.splineRoad.getRoadTransformAtZ(4050, -32, 0);
    const dukes = new THREE.Group();
    dukes.position.copy(transform.pos);
    // Face across highway toward oncoming traffic
    dukes.rotation.y = transform.heading + Math.PI * 0.5 + 0.22;

    // Main 2-story teal coastal pavilion
    const dukesBuilding = this.structureBuilder.buildCoastalSeafoodShack({
      width: 20.0,
      depth: 14.0,
      height: 8.5,
      colorSiding: 0x008080,
      colorRoof: 0x1a3080,
      subterraneanDepth: 3.5
    });
    dukes.add(dukesBuilding);

    // Large windows
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x7ab8cc, transparent: true, opacity: 0.7 });
    const win = new THREE.Mesh(new THREE.BoxGeometry(18, 5.5, 0.3), windowMat);
    win.position.set(0, 5, 7.1);
    dukes.add(win);

    // "DUKE'S" yellow-on-cobalt sign
    const dukesSignBg = new THREE.Mesh(new THREE.BoxGeometry(12, 3.5, 0.5),
      this.renderer.createToonMaterial({ color: 0x1a3080, gradientBands: 2 }));
    dukesSignBg.position.set(0, 9.5, 7.2);
    dukes.add(dukesSignBg);
    const dukesSignText = new THREE.Mesh(new THREE.BoxGeometry(9, 1.8, 0.65),
      new THREE.MeshBasicMaterial({ color: 0xf5c518 }));
    dukesSignText.position.set(0, 9.5, 7.3);
    dukes.add(dukesSignText);

    // Valet stand / parking apron on PCH front side
    const valetApron = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), this.matAsphaltLot);
    valetApron.rotateX(-Math.PI * 0.5);
    valetApron.position.set(0, 0.04, 10);
    dukes.add(valetApron);
    const valetKiosk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    valetKiosk.position.set(-9, 1.25, 12);
    dukes.add(valetKiosk);

    this.group.add(dukes);
  }

  // Moonshadows & Nobu Malibu — Upscale PCH Ocean-Side Restaurants (Z=4200–4280m, X=-32)
  buildMoonshadowsAndNobuRow() {
    // Moonshadows (modern coastal dining pavilion)
    const moonsT = this.splineRoad.getRoadTransformAtZ(4220, -32, 0);
    const moons = new THREE.Group();
    moons.position.copy(moonsT.pos);
    // Face across highway toward oncoming traffic
    moons.rotation.y = moonsT.heading + Math.PI * 0.5 + 0.22;

    const moonsBuilding = this.structureBuilder.buildCoastalSeafoodShack({
      width: 16.0,
      depth: 10.0,
      height: 7.0,
      colorSiding: 0xa8a8a0,
      colorRoof: 0x2a2a2a,
      subterraneanDepth: 3.5
    });
    moons.add(moonsBuilding);

    const moonsSign = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 0.35),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    moonsSign.position.set(0, 7.8, 5.1);
    moons.add(moonsSign);
    const moonsText = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 0.45),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    moonsText.position.set(0, 7.8, 5.2);
    moons.add(moonsText);

    this.group.add(moons);

    // Nobu Malibu (dark vertical cedar Japanese-influenced pavilion)
    const nobuT = this.splineRoad.getRoadTransformAtZ(4275, -32, 0);
    const nobu = new THREE.Group();
    nobu.position.copy(nobuT.pos);
    // Face across highway toward oncoming traffic
    nobu.rotation.y = nobuT.heading + Math.PI * 0.5 + 0.22;


    const nobuBuilding = this.structureBuilder.buildCommercialBuilding({
      width: 18.0,
      depth: 12.0,
      stories: 2,
      storyHeight: 3.8,
      colorWall: 0x2a2420,
      colorTrim: 0xc8a060,
      subterraneanDepth: 3.5
    });
    nobu.add(nobuBuilding);


    // Vertical cedar plank cladding lines
    for (let vx = -7; vx <= 7; vx += 2.5) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7, 0.22),
        this.renderer.createToonMaterial({ color: 0x1e150c, gradientBands: 2 }));
      plank.position.set(vx, 3.5, 6.1);
      nobu.add(plank);
    }

    // "NOBU" simple serif sign
    const nobuSignBg = new THREE.Mesh(new THREE.BoxGeometry(8, 2.2, 0.4),
      this.renderer.createToonMaterial({ color: 0xf5f5f5, gradientBands: 2 }));
    nobuSignBg.position.set(0, 8.3, 6.1);
    nobu.add(nobuSignBg);
    const nobuText = new THREE.Mesh(new THREE.BoxGeometry(5, 0.9, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
    nobuText.position.set(0, 8.3, 6.2);
    nobu.add(nobuText);

    // Ocean deck on pilings
    const deckPlatform = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), this.matNobuDark);
    deckPlatform.rotateX(-Math.PI * 0.5);
    deckPlatform.position.set(0, 0.12, 9);
    nobu.add(deckPlatform);
    for (let px = -5; px <= 5; px += 5) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 6),
        this.matNobuDark);
      piling.position.set(px, -2, 12);
      nobu.add(piling);
    }

    // Valet stand
    const valetKiosk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2),
      this.renderer.createToonMaterial({ color: 0x1a1a1a, gradientBands: 2 }));
    valetKiosk.position.set(-9, 1.25, -8);
    nobu.add(valetKiosk);

    this.group.add(nobu);
  }

  // Zuma Beach Large State Parking Lot (Z=4600–4700m, X=-18)
  buildZumaBeachParkingLot() {
    const lotT = this.splineRoad.getRoadTransformAtZ(4650, -22, 0);
    const lotGroup = new THREE.Group();
    lotGroup.position.copy(lotT.pos);
    lotGroup.rotation.y = lotT.heading;

    // Main asphalt lot (100m × 24m)
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(100, 24), this.matAsphaltLot);
    lot.rotateX(-Math.PI * 0.5);
    lot.position.set(0, 0.05, 0);
    lotGroup.add(lot);

    // White diagonal parking stripes
    const matStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 28; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 5.8), matStripe);
      stripe.rotateX(-Math.PI * 0.5);
      stripe.position.set(-48 + i * 3.5, 0.07, 8);
      lotGroup.add(stripe);
    }

    // Entry kiosk pay booth
    const kiosk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 2.5),
      this.renderer.createToonMaterial({ color: 0x2e6b1a, gradientBands: 2 }));
    kiosk.position.set(-47, 1.75, -5);
    lotGroup.add(kiosk);
    const kioskRoof = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 3),
      this.renderer.createToonMaterial({ color: 0x1a4a10, gradientBands: 2 }));
    kioskRoof.position.set(-47, 3.65, -5);
    lotGroup.add(kioskRoof);

    // "ZUMA BEACH" green state park sign on entry
    const parkSign = new THREE.Mesh(new THREE.BoxGeometry(7, 1.8, 0.3),
      this.renderer.createToonMaterial({ color: 0x1b5e20, gradientBands: 2 }));
    parkSign.position.set(-42, 3.5, -5);
    lotGroup.add(parkSign);
    const parkSignText = new THREE.Mesh(new THREE.BoxGeometry(6, 0.65, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    parkSignText.position.set(-42, 3.5, -4.9);
    lotGroup.add(parkSignText);

    // Concrete block restroom building
    const restroom = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 5),
      this.renderer.createToonMaterial({ color: 0x909090, gradientBands: 2 }));
    restroom.position.set(42, 2, -5);
    lotGroup.add(restroom);
    const restroomRoof = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.3, 5.5),
      this.renderer.createToonMaterial({ color: 0x6a6a6a, gradientBands: 2 }));
    restroomRoof.position.set(42, 4.15, -5);
    lotGroup.add(restroomRoof);

    // Split-rail fence at sand edge
    for (let r = -48; r <= 48; r += 6) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6),
        this.renderer.createToonMaterial({ color: 0x8a7060, gradientBands: 2 }));
      post.position.set(r, 0.6, 11.5);
      lotGroup.add(post);
    }
    const topFenceRail = new THREE.Mesh(new THREE.BoxGeometry(100, 0.12, 0.12),
      this.renderer.createToonMaterial({ color: 0x8a7060, gradientBands: 2 }));
    topFenceRail.position.set(0, 1.1, 11.5);
    lotGroup.add(topFenceRail);

    this.group.add(lotGroup);
  }

  // Blue "OCEAN ACCESS" Signs Along PCH Ocean Side — every 280m through zone
  buildPCHStateBeachSignage() {
    const matPost = this.renderer.createToonMaterial({ color: 0x4a4a4a, gradientBands: 2 });

    for (let z = 2700; z <= 5150; z += 280) {
      const t = this.splineRoad.getRoadTransformAtZ(z, -18.0, 0);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6), matPost);
      post.position.set(t.pos.x, t.pos.y + 1.75, t.pos.z);
      this.group.add(post);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 0.12), this.matBeachSignBlue);
      sign.position.set(t.pos.x, t.pos.y + 3.6, t.pos.z);
      this.group.add(sign);
      // White wave icon
      const waveIcon = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      waveIcon.position.set(t.pos.x, t.pos.y + 3.7, t.pos.z + 0.08);
      this.group.add(waveIcon);
    }
  }

  // Neptune's Net Enhanced Parking Lot — Famous Motorcycle Meet (Z=5040–5065m, X=+22)
  buildNeptuneMotorcycleLot() {
    const lotT = this.splineRoad.getRoadTransformAtZ(5052, 28, 0);
    const lotGroup = new THREE.Group();
    lotGroup.position.copy(lotT.pos);
    lotGroup.rotation.y = lotT.heading - 0.2;

    // Large hybrid gravel/asphalt lot (50m × 30m)
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), this.matGravel);
    lot.rotateX(-Math.PI * 0.5);
    lot.position.set(0, 0.05, 0);
    lotGroup.add(lot);

    // Rows of motorcycles (low box clusters in diagonal rows)
    const motoColors = [0x1a1a1a, 0xcc2222, 0x2222cc, 0xf5c518, 0x228822, 0x8a8a8a];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const moto = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.0, 2.3),
          new THREE.MeshBasicMaterial({ color: motoColors[(row + col) % motoColors.length] }));
        moto.position.set(-18 + row * 10, 0.5, -10 + col * 4.5);
        moto.rotation.y = 0.25; // slight diagonal angle
        lotGroup.add(moto);
      }
    }

    // Weathered picnic tables area
    const tableCol = this.renderer.createToonMaterial({ color: 0x6a5040, gradientBands: 2 });
    for (let t = 0; t < 5; t++) {
      const tabletop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.9), tableCol);
      tabletop.position.set(-20 + t * 10, 0.78, 12);
      lotGroup.add(tabletop);
      // Picnic bench sides
      [-1.3, 1.3].forEach(bz => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.3), tableCol);
        bench.position.set(-20 + t * 10, 0.5, 12 + bz);
        lotGroup.add(bench);
      });
    }

    // String lights overhead between posts
    const lightPost1T = this.splineRoad.getRoadTransformAtZ(5042, 22, 0);
    const lightPost2T = this.splineRoad.getRoadTransformAtZ(5062, 22, 0);
    const lpMat = this.renderer.createToonMaterial({ color: 0x4a4a4a, gradientBands: 2 });
    const lp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), lpMat);
    lp1.position.set(lightPost1T.pos.x, lightPost1T.pos.y + 2.5, lightPost1T.pos.z);
    this.group.add(lp1);
    const lp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), lpMat);
    lp2.position.set(lightPost2T.pos.x, lightPost2T.pos.y + 2.5, lightPost2T.pos.z);
    this.group.add(lp2);

    this.group.add(lotGroup);
  }

  update(dt, playerPosition) {
    this.animatedObjects.forEach(item => {
      if (item.rotZ) item.obj.rotation.z += item.rotZ;
    });

    // Palm Tree Wind Animation — proximity gated to palms within 250m of player
    if (this.palmCrowns) {
      const pZ = playerPosition ? playerPosition.z : (window.game && window.game.physics ? window.game.physics.position.z : 3500);
      this.palmCrowns.forEach(c => {
        if (Math.abs(c.z - pZ) > 260) return;
        c.phase += c.speed * dt;
        c.mesh.rotation.z = Math.sin(c.phase) * 0.06;
        c.mesh.rotation.x = Math.cos(c.phase * 0.8) * 0.04;
      });
    }

    this.waveMeshes.forEach(w => {
      w.phase += w.speed * dt;
      const surge = Math.sin(w.phase);
      w.mesh.position.x = w.baseX + surge * 3.5;
      w.mesh.material.opacity = 0.35 + Math.max(0, surge) * 0.45;
    });

    if (this.pelicanFlock) {
      this.pelicanFlock.position.z += 12.0 * dt;
      if (this.pelicanFlock.position.z > 14450) {
        this.pelicanFlock.position.z = 6600;
      }
    }
  }
}
