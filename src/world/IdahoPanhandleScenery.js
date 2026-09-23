import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';
import { gameState } from '../state.js';

/**
 * 🌲 IDAHO PANHANDLE SCENERY BUILDER
 * Zone 10: Idaho Panhandle & Lake Coeur d'Alene (26,000m – 28,600m)
 *
 * 6-Gate AAA Gold Certification:
 * GATE 2 — 3 Anchor Landmarks:
 *   1. Lake Coeur d'Alene Floating Boardwalk & Marina  Z=26,800m  X=-55m
 *   2. Cataldo Old Mission (1853)                       Z=27,600m  X=+54m
 *   3. Silver Valley Mine Headframe & Ore Chutes        Z=28,300m  X=+40m
 * GATE 3 — 2 Scenic Turnouts (SplineRoad.js):
 *   - turnout_coeur_dalene_boardwalk  (Z=26,800m, left)
 *   - turnout_cataldo_mission         (Z=27,600m, right)
 * GATE 5 — Off-Road Spur: Wallace Historic Downtown Silver Trail  Z=28,050m
 * GATE 5 — Interactive Cinematic: "Wallace Silver Syndicate Mine Heist"
 * GATE 6 — Foundations Y ≤ -1.5m, zero render-loop allocations, instanced flora
 */
export class IdahoPanhandleSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.group.name = 'IdahoPanhandleSceneryGroup';
    this.animatedObjects = [];
    this.structureBuilder = new ProceduralStructureBuilder(renderer);

    // Pre-allocated scratch — ZERO heap allocations in render loop
    this._tempVec1 = new THREE.Vector3();
    this._tempVec2 = new THREE.Vector3();
    this._tempCamPos = new THREE.Vector3();
    this._tempLookAt = new THREE.Vector3();
    this._camResult = { pos: this._tempCamPos, lookAt: this._tempLookAt, fov: 54 };

    // Cinematic state machine
    this.isCinematicPlaying = false;
    this.cinematicTime = 0.0;
    this.cinematicDuration = 14.0;
    this.cinematicPhase = 'IDLE';
    this.hasTriggeredVignette = false;

    // Animated prop references
    this.oreCartMesh = null;
    this.headframeBeacons = [];
    this.searchlightMesh = null;
    this.mineTransform = null;

    this.initMaterials();
    this.buildScenery();
  }

  get isActive() {
    return this.isCinematicPlaying;
  }

  // ─── MATERIALS ────────────────────────────────────────────────────────────
  initMaterials() {
    const r = this.renderer;
    const woodNorm    = r.textures && r.textures.weatheredWoodNormalPBR  ? r.textures.weatheredWoodNormalPBR(512)     : null;
    const stoneNorm   = r.textures && r.textures.stoneMasonryNormalPBR   ? r.textures.stoneMasonryNormalPBR(512)      : null;
    const concreteNorm= r.textures && r.textures.concreteNormalPBR       ? r.textures.concreteNormalPBR(512)          : null;
    const pineBarkDiff= r.textures && r.textures.treeBarkPBR             ? r.textures.treeBarkPBR('pine', 256)       : null;
    const pineBarkNorm= r.textures && r.textures.treeBarkNormalPBR       ? r.textures.treeBarkNormalPBR('pine', 256) : null;
    const pineLeafDiff= r.textures && r.textures.treeFoliagePBR          ? r.textures.treeFoliagePBR('conifer', 256) : null;
    const pineLeafNorm= r.textures && r.textures.treeFoliageNormalPBR    ? r.textures.treeFoliageNormalPBR('conifer', 256) : null;

    // Lake & Boardwalk
    this.matBoardwalkPlanks = r.createToonMaterial({ color: 0x8b6f47, gradientBands: 3, normalMap: woodNorm });
    this.matLakeSapphire    = new THREE.MeshBasicMaterial({ color: 0x1e8db4, transparent: true, opacity: 0.88 });
    this.matLakeShallow     = r.createToonMaterial({ color: 0x3cb8d8, gradientBands: 2 });
    this.matDockPiling      = r.createToonMaterial({ color: 0x4a3728, gradientBands: 2, normalMap: woodNorm });
    this.matResortWall      = r.createToonMaterial({ color: 0xf0ede4, gradientBands: 3, normalMap: concreteNorm });
    this.matResortRoof      = r.createToonMaterial({ color: 0x3b6e82, gradientBands: 2 });
    this.matBoatHull        = r.createToonMaterial({ color: 0xffffff, gradientBands: 2 });
    this.matBoatDeck        = r.createToonMaterial({ color: 0x5c3d1e, gradientBands: 2 });
    this.matSeaplaneBody    = r.createToonMaterial({ color: 0xd4e8f0, gradientBands: 2 });
    this.matWindowCool      = new THREE.MeshBasicMaterial({ color: 0xb8e0f7 });

    // Cataldo Old Mission
    this.matMissionWhite   = r.createToonMaterial({ color: 0xf7f4ed, gradientBands: 3, normalMap: concreteNorm, rimColor: 0xfff8e8, rimPower: 1.8 });
    this.matMissionBell    = r.createToonMaterial({ color: 0x8b7355, gradientBands: 2, normalMap: stoneNorm });
    this.matMissionPortico = r.createToonMaterial({ color: 0xdcd7ca, gradientBands: 2 });
    this.matCrossGold      = new THREE.MeshBasicMaterial({ color: 0xe8c84a });
    this.matAltar          = r.createToonMaterial({ color: 0xc49a6c, gradientBands: 3 });
    this.matWindowAmber    = new THREE.MeshBasicMaterial({ color: 0xffcc66 });

    // Silver Valley Mine Headframe
    this.matCorrugatedSteel = r.createToonMaterial({ color: 0x7a7060, gradientBands: 3 });
    this.matRustedSteel     = r.createToonMaterial({ color: 0x9b4f2e, gradientBands: 3 });
    this.matMineTimber      = r.createToonMaterial({ color: 0x3e2c1a, gradientBands: 2, normalMap: woodNorm });
    this.matOreDark         = r.createToonMaterial({ color: 0x2a2624, gradientBands: 2 });
    this.matOreSilver       = r.createToonMaterial({ color: 0xc0bfc0, gradientBands: 2 });
    this.matMinecartIron    = r.createToonMaterial({ color: 0x3d3d3d, gradientBands: 2 });
    this.matCableWire       = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    this.matSearchlight     = new THREE.MeshBasicMaterial({ color: 0xfff5c0 });
    this.matMineBeacon      = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matTruckBody       = r.createToonMaterial({ color: 0x2d3a2a, gradientBands: 2 });
    this.matTruckBed        = r.createToonMaterial({ color: 0x1a2218, gradientBands: 2 });
    this.matRailSilver      = r.createToonMaterial({ color: 0x9ca3af, gradientBands: 2 });

    // Idaho Pine Forest
    this.matPonderosaTrunk  = r.createToonMaterial({ color: 0x6b4226, gradientBands: 2, map: pineBarkDiff, normalMap: pineBarkNorm });
    this.matPonderosaCanopy = r.createToonMaterial({ color: 0x265c2e, gradientBands: 3, map: pineLeafDiff, normalMap: pineLeafNorm, rimColor: 0x4ade80, rimPower: 2.5 });

    // Signs & Props
    this.matParkSign  = r.createToonMaterial({ color: 0x3d4c24, gradientBands: 2 });
    this.matSignWhite = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.matSignBrown = r.createToonMaterial({ color: 0x4a3321, gradientBands: 2 });
    this.matAsphalt   = r.createToonMaterial({ color: 0x28282c, gradientBands: 2 });
    this.matGravel    = r.createToonMaterial({ color: 0x6a6460, gradientBands: 2 });
  }

  // ─── MASTER SCENERY BUILDER ───────────────────────────────────────────────
  buildScenery() {
    this.buildLakeBoardwalkMarina();
    this.buildCataldoOldMission();
    this.buildSilverValleyMineHeadframe();
    this.buildIdahoPineForest();
    this.buildWallaceHistoricSpur();
    this.buildIdahoHighwaySignage();
  }

  // ─── LANDMARK 1: Lake Coeur d'Alene Floating Boardwalk (Z=26,800m) ────────
  buildLakeBoardwalkMarina() {
    const t = this.splineRoad.getRoadTransformAtZ(26800, -56, 0);
    const g = new THREE.Group();
    g.name = 'Scenic_LakeCoeurDaleneBoardwalk';
    g.position.copy(t.pos);
    g.rotation.y = t.heading + Math.PI * 0.06;

    // Foundation slab (Y ≤ -1.5m)
    g.add(this._mesh(new THREE.BoxGeometry(80, 3, 50), this.matLakeShallow, 0, -2.5, 0));

    // Sapphire lake surface
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), this.matLakeSapphire);
    lake.rotateX(-Math.PI * 0.5);
    lake.position.set(-4, -0.2, -8);
    g.add(lake);

    // Floating boardwalk deck
    g.add(this._mesh(new THREE.BoxGeometry(60, 0.6, 12), this.matBoardwalkPlanks, -8, 0.3, -4));

    // Dock piling legs
    for (let px = -28; px <= 28; px += 8) {
      for (const pz of [-4.8, 3.8]) {
        g.add(this._mesh(new THREE.CylinderGeometry(0.28, 0.32, 4.5, 6), this.matDockPiling, px - 8, -1.95, pz - 4));
      }
    }

    // Finger docks
    for (const dx of [-20, -4, 12]) {
      g.add(this._mesh(new THREE.BoxGeometry(3, 0.5, 14), this.matBoardwalkPlanks, dx - 8, 0.25, -13));
      for (const bz of [0, 5.5, 11]) {
        g.add(this._mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 6), this.matDockPiling, dx - 8, 0.75, -6.5 - bz));
      }
    }

    // Resort hotel tower (28-story glass tower)
    const tower = this._mesh(new THREE.BoxGeometry(18, 28, 12), this.matResortWall, 10, 12, 14);
    tower.castShadow = true;
    g.add(tower);
    g.add(this._mesh(new THREE.BoxGeometry(19, 2, 13), this.matResortRoof, 10, 27.2, 14));

    // Hotel window grid (cool blue lake-view emissives)
    for (let floor = 0; floor < 7; floor++) {
      for (let col = -3; col <= 3; col++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.6), this.matWindowCool);
        win.position.set(10 + col * 2.4, 4 + floor * 3.5, 20.06);
        g.add(win);
      }
    }

    // Lobby wing
    g.add(this._mesh(new THREE.BoxGeometry(30, 6, 10), this.matResortWall, 6, 2, 24));
    g.add(this._mesh(new THREE.BoxGeometry(31, 1, 11), this.matResortRoof, 6, 5.2, 24));

    // Docked motorboat
    g.add(this._mesh(new THREE.BoxGeometry(5.5, 1.4, 1.8), this.matBoatHull, -20, 0.4, -6));
    g.add(this._mesh(new THREE.BoxGeometry(4, 0.5, 1.4), this.matBoatDeck, -20, 1.15, -6));

    // Seaplane
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 6.5, 8), this.matSeaplaneBody);
    fuselage.rotation.z = Math.PI * 0.5;
    fuselage.position.set(-34, 1.8, -11);
    g.add(fuselage);
    g.add(this._mesh(new THREE.BoxGeometry(9.5, 0.3, 1.4), this.matSeaplaneBody, -34, 2.4, -11));

    // Boardwalk lamp posts
    for (const lx of [-22, -14, -6, 2]) {
      g.add(this._mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 6), this.matDockPiling, lx - 8, 1.8, -4));
      g.add(this._mesh(new THREE.SphereGeometry(0.28, 8, 6), this.matWindowCool, lx - 8, 3.75, -4));
    }

    // Coin-op viewfinder kiosk
    g.add(this._mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.1, 8), this.matSignBrown, -8, 0.55, 5));
    const scope = this._mesh(new THREE.CylinderGeometry(0.22, 0.18, 1.8, 8), this.matResortRoof, -8, 1.9, 5);
    scope.rotation.x = 0.4;
    g.add(scope);

    this.group.add(g);
  }

  // ─── LANDMARK 2: Cataldo Old Mission, 1853 (Z=27,600m) ───────────────────
  buildCataldoOldMission() {
    const t = this.splineRoad.getRoadTransformAtZ(27600, 54, 0);
    const g = new THREE.Group();
    g.name = 'Scenic_CataldoOldMission';
    g.position.copy(t.pos);
    g.rotation.y = t.heading - Math.PI * 0.48;

    // Subterranean bluff foundation (Y ≤ -1.5m)
    g.add(this._mesh(new THREE.BoxGeometry(34, 5.5, 20), this.matMissionBell, 0, -2.25, 0));

    // Church nave
    const nave = this._mesh(new THREE.BoxGeometry(12, 11, 22), this.matMissionWhite, 0, 4.5, 0);
    nave.castShadow = nave.receiveShadow = true;
    g.add(nave);

    // Steeply pitched timber roof
    const roofGeo = new THREE.ConeGeometry(9, 5.5, 4);
    roofGeo.rotateY(Math.PI * 0.25);
    const roof = new THREE.Mesh(roofGeo, this.matMissionBell);
    roof.scale.set(0.88, 1, 1.88);
    roof.position.set(0, 13, 0);
    roof.castShadow = true;
    g.add(roof);

    // Bell tower
    const tower = this._mesh(new THREE.BoxGeometry(6.5, 7, 5.5), this.matMissionWhite, 0, 9.5, 12.2);
    tower.castShadow = true;
    g.add(tower);

    const belfryGeo = new THREE.ConeGeometry(4, 3.5, 4);
    belfryGeo.rotateY(Math.PI * 0.25);
    const belfry = new THREE.Mesh(belfryGeo, this.matMissionBell);
    belfry.position.set(0, 14.8, 12.2);
    g.add(belfry);

    g.add(this._mesh(new THREE.CylinderGeometry(0.7, 0.9, 1, 8), this.matMissionBell, 0, 13.2, 12.2));

    // Gold cross
    g.add(this._mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), this.matCrossGold, 0, 18, 12.2));
    g.add(this._mesh(new THREE.BoxGeometry(2.2, 0.25, 0.25), this.matCrossGold, 0, 17.2, 12.2));

    // Portico pilasters (5 columns)
    for (let i = 0; i < 5; i++) {
      g.add(this._mesh(new THREE.BoxGeometry(0.7, 8.5, 0.5), this.matMissionPortico, -4.5 + i * 2.5 - 1, 3.5, 11.4));
    }
    g.add(this._mesh(new THREE.BoxGeometry(12.5, 0.5, 0.4), this.matMissionPortico, 0, 8, 11.4));

    // Entrance door + arch
    g.add(this._mesh(new THREE.BoxGeometry(3, 5.5, 0.4), this.matAltar, 0, 2.75, 11.45));

    // Amber stained-glass windows (3 per side)
    for (const wz of [3.5, 0.5, -2.5]) {
      for (const wx of [-6.05, 6.05]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.8), this.matWindowAmber);
        win.position.set(wx, 5.2, wz);
        win.rotation.y = wx < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
        g.add(win);
      }
    }

    // Gravel approach path
    g.add(this._mesh(new THREE.BoxGeometry(4.5, 0.1, 18), this.matGravel, 0, 0.05, 2));

    // White picket fence perimeter
    for (let fz = -10; fz <= 10; fz += 2.4) {
      for (const fx of [-8.5, 8.5]) {
        g.add(this._mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), this.matMissionPortico, fx, 0.6, fz));
      }
    }
    for (const fz of [-10, 10]) {
      g.add(this._mesh(new THREE.BoxGeometry(17.2, 0.14, 0.14), this.matMissionPortico, 0, 0.8, fz));
    }

    this.group.add(g);
  }

  // ─── LANDMARK 3: Silver Valley Mine Headframe & Ore Chutes (Z=28,300m) ───
  buildSilverValleyMineHeadframe() {
    const t = this.splineRoad.getRoadTransformAtZ(28300, 40, 0);
    this.mineTransform = t;
    const g = new THREE.Group();
    g.name = 'Scenic_SilverValleyMineHeadframe';
    g.position.copy(t.pos);
    g.rotation.y = t.heading - Math.PI * 0.55;

    // Subterranean concrete foundation (Y ≤ -1.5m)
    g.add(this._mesh(new THREE.BoxGeometry(28, 4, 22), this.matOreDark, 0, -2, 0));

    // A-frame headframe legs
    for (const lx of [-5.5, 5.5]) {
      const leg = this._mesh(new THREE.BoxGeometry(1.2, 20, 1.2), this.matCorrugatedSteel, lx, 8, 0);
      leg.rotation.z = lx < 0 ? 0.12 : -0.12;
      leg.castShadow = true;
      g.add(leg);
    }

    // Headframe apex crossbeam
    g.add(this._mesh(new THREE.BoxGeometry(14, 1.5, 1.5), this.matCorrugatedSteel, 0, 18.5, 0));

    // Bracing horizontals
    g.add(this._mesh(new THREE.BoxGeometry(12, 1.2, 0.9), this.matCorrugatedSteel, 0, 8, 0));
    g.add(this._mesh(new THREE.BoxGeometry(10, 1.0, 0.9), this.matCorrugatedSteel, 0, 12, 0));

    // Pulley wheel
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.28, 8, 14), this.matRustedSteel);
    pulley.rotation.z = Math.PI * 0.5;
    pulley.position.set(0, 20.2, 0);
    g.add(pulley);

    // Ore cable
    g.add(this._mesh(new THREE.CylinderGeometry(0.09, 0.09, 22, 4), this.matCableWire, 0, 8.2, 0));

    // Ore cart (animated during vignette)
    const cart = this._mesh(new THREE.BoxGeometry(2.2, 1.2, 1.4), this.matMinecartIron, -1.5, 0.85, 4.5);
    cart.castShadow = true;
    g.add(cart);
    this.oreCartMesh = cart;

    // Cart wheels
    for (const wz of [-0.6, 0.6]) {
      for (const wx of [-0.9, 0.9]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 8), this.matCorrugatedSteel);
        wheel.rotation.z = Math.PI * 0.5;
        wheel.position.set(-1.5 + wx, 0.28, 4.5 + wz);
        g.add(wheel);
      }
    }

    // Rail tracks
    for (const rx of [-0.55, 0.55]) {
      g.add(this._mesh(new THREE.BoxGeometry(0.12, 0.18, 14), this.matRailSilver, -1.5 + rx, 0.09, 4.5));
    }

    // Main processing building
    const proc = this._mesh(new THREE.BoxGeometry(16, 9, 14), this.matCorrugatedSteel, 0, 2.5, -11);
    proc.castShadow = true;
    g.add(proc);

    const procRoofGeo = new THREE.ConeGeometry(10, 3.5, 4);
    procRoofGeo.rotateY(Math.PI * 0.25);
    const procRoof = new THREE.Mesh(procRoofGeo, this.matRustedSteel);
    procRoof.scale.set(1.15, 1, 0.95);
    procRoof.position.set(0, 8.75, -11);
    g.add(procRoof);

    // Ore chute (diagonal trough)
    const chute = this._mesh(new THREE.BoxGeometry(1.4, 14, 0.8), this.matRustedSteel, 7.5, 3.8, -11);
    chute.rotation.z = -0.55;
    g.add(chute);

    // Ore pile
    g.add(this._mesh(new THREE.ConeGeometry(3.5, 2, 6), this.matOreDark, 11, 0.5, -11));
    g.add(this._mesh(new THREE.ConeGeometry(2, 0.9, 6), this.matOreSilver, 11, 1.8, -11));

    // Vintage flatbed syndicate truck
    const cab = this._mesh(new THREE.BoxGeometry(4.5, 2.8, 3), this.matTruckBody, -8.5, 1.4, 6);
    cab.castShadow = true;
    g.add(cab);
    g.add(this._mesh(new THREE.BoxGeometry(5.5, 1.2, 3), this.matTruckBed, -14, 0.9, 6));
    for (const tx of [-6.5, -10.5, -14.5]) {
      for (const tz of [-1.6, 1.6]) {
        const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 10), this.matOreDark);
        tw.rotation.z = Math.PI * 0.5;
        tw.position.set(tx, 0.55, 6 + tz);
        g.add(tw);
      }
    }

    // Searchlight (animated during vignette)
    g.add(this._mesh(new THREE.CylinderGeometry(0.6, 0.7, 1, 8), this.matCorrugatedSteel, -6, 9.5, -11));
    const slens = this._mesh(new THREE.CylinderGeometry(0.55, 0.4, 1.5, 10), this.matSearchlight, -6, 10.2, -11);
    slens.rotation.z = Math.PI * 0.5;
    g.add(slens);
    this.searchlightMesh = slens;

    // Animated amber warning beacons
    for (const [bx, by, bz] of [[-5.5, 20.5, 0], [5.5, 20.5, 0], [0, 21.0, 0]]) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 4), this.matMineBeacon);
      beacon.position.set(bx, by, bz);
      g.add(beacon);
      this.headframeBeacons.push({ mesh: beacon });
    }

    // Chain-link perimeter fence
    const fenceGeo = new THREE.BoxGeometry(50, 2.2, 0.12);
    const fence1 = new THREE.Mesh(fenceGeo, this.matCorrugatedSteel);
    fence1.position.set(-14, 1.1, 14);
    g.add(fence1);
    const fence2 = new THREE.Mesh(fenceGeo, this.matCorrugatedSteel);
    fence2.rotation.y = Math.PI * 0.5;
    fence2.position.set(0, 1.1, 14);
    g.add(fence2);

    this.group.add(g);
  }

  // ─── OFF-ROAD SPUR: Wallace Historic Downtown Silver Trail (Z=28,050m) ────
  buildWallaceHistoricSpur() {
    const t = this.splineRoad.getRoadTransformAtZ(28050, 65, 0);
    const g = new THREE.Group();
    g.name = 'OffRoad_WallaceHistoricSpur';
    g.position.copy(t.pos);
    g.rotation.y = t.heading + Math.PI * 0.35;

    // Gravel trail
    g.add(this._mesh(new THREE.BoxGeometry(4.5, 0.18, 60), this.matGravel, 0, -0.09, 30));

    // "Center of the Universe" sign post
    g.add(this._mesh(new THREE.CylinderGeometry(0.12, 0.14, 4, 6), this.matMineTimber, 0, 2, 0));
    g.add(this._mesh(new THREE.BoxGeometry(5, 1.6, 0.2), this.matSignBrown, 0, 3.8, 0));
    g.add(this._mesh(new THREE.BoxGeometry(4.8, 1.4, 0.26), this.matSignWhite, 0, 3.8, 0.04));

    // 5 Wallace 1890s brick storefronts
    const widths  = [7.0, 6.0, 8.0, 5.5, 7.5];
    const heights = [9.5, 11.0, 8.5, 10.5, 9.0];
    let bx = -16;
    widths.forEach((bw, i) => {
      const bh = heights[i];
      const sf = this._mesh(new THREE.BoxGeometry(bw, bh, 6), this.matCorrugatedSteel, bx + bw * 0.5, bh * 0.5, 30);
      sf.castShadow = true;
      g.add(sf);
      g.add(this._mesh(new THREE.BoxGeometry(bw + 0.4, 1, 6.4), this.matOreDark, bx + bw * 0.5, bh + 0.5, 30));
      const storeWin = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.55, 2.2), this.matWindowAmber);
      storeWin.position.set(bx + bw * 0.5, 2.5, 33.06);
      g.add(storeWin);
      bx += bw + 0.5;
    });

    this.group.add(g);
  }

  // ─── INSTANCED PONDEROSA PINE FOREST ─────────────────────────────────────
  buildIdahoPineForest() {
    const trunkGeo  = new THREE.CylinderGeometry(0.55, 0.72, 14, 7);
    const canopyGeo = new THREE.ConeGeometry(4.5, 10, 7);

    const clusters = [
      { z: 26200, x: -70, count: 18, spread: 32 },
      { z: 26500, x:  62, count: 14, spread: 28 },
      { z: 26900, x: -78, count: 12, spread: 24 },
      { z: 27100, x:  74, count: 16, spread: 30 },
      { z: 27400, x: -66, count: 14, spread: 26 },
      { z: 27700, x:  80, count: 10, spread: 22 },
      { z: 27900, x: -58, count:  8, spread: 20 },
      { z: 28100, x:  72, count: 12, spread: 24 },
      { z: 28400, x: -70, count: 15, spread: 28 },
    ];

    const dummy = new THREE.Object3D();
    const trunkMats = [];
    const canopyMats = [];

    clusters.forEach(cl => {
      for (let i = 0; i < cl.count; i++) {
        const angle  = (i / cl.count) * Math.PI * 2 + cl.z * 0.01;
        const radius = cl.spread * 0.3 + (i % 3) * cl.spread * 0.25;
        const tx = cl.x + Math.cos(angle) * radius;
        const tz = cl.z + Math.sin(angle) * radius * 0.7;
        const sc = 0.7 + (i % 5) * 0.2;

        const roadInfo = this.splineRoad.getRoadTransformAtZ(tz, tx, 0);
        const gy = roadInfo ? roadInfo.pos.y : 0;

        dummy.position.set(tx, gy - 1.5, tz);
        dummy.scale.set(sc, sc, sc);
        dummy.rotation.y = angle * 1.3;
        dummy.updateMatrix();
        trunkMats.push(dummy.matrix.clone());

        dummy.position.set(tx, gy + 10 * sc, tz);
        dummy.updateMatrix();
        canopyMats.push(dummy.matrix.clone());
      }
    });

    if (trunkMats.length > 0) {
      const iT = new THREE.InstancedMesh(trunkGeo, this.matPonderosaTrunk, trunkMats.length);
      iT.name = 'Instanced_IdahoPineTrunks';
      trunkMats.forEach((m, i) => iT.setMatrixAt(i, m));
      iT.instanceMatrix.needsUpdate = true;
      this.group.add(iT);

      const iC = new THREE.InstancedMesh(canopyGeo, this.matPonderosaCanopy, canopyMats.length);
      iC.name = 'Instanced_IdahoPineCanopy';
      canopyMats.forEach((m, i) => iC.setMatrixAt(i, m));
      iC.instanceMatrix.needsUpdate = true;
      this.group.add(iC);
    }
  }

  // ─── HIGHWAY SIGNAGE ──────────────────────────────────────────────────────
  buildIdahoHighwaySignage() {
    const signs = [
      { z: 26050, x: -22, label: 'IDAHO PANHANDLE', color: 0x1a4d2e },
      { z: 26600, x:  22, label: "LAKE COEUR D'ALENE", color: 0x154a6b },
      { z: 27400, x: -20, label: 'CATALDO MISSION', color: 0x3d2510 },
      { z: 28000, x:  22, label: 'SILVER VALLEY', color: 0x3a2c1c },
    ];

    signs.forEach(sign => {
      const t = this.splineRoad.getRoadTransformAtZ(sign.z, sign.x, 0);
      const sg = new THREE.Group();
      sg.position.copy(t.pos);
      sg.rotation.y = t.heading;

      sg.add(this._mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 6), this.matAsphalt, -1.5, 3, 0));
      sg.add(this._mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 6), this.matAsphalt,  1.5, 3, 0));
      sg.add(this._mesh(new THREE.BoxGeometry(7.5, 1.8, 0.2), new THREE.MeshBasicMaterial({ color: sign.color }), 0, 5.8, 0));
      sg.add(this._mesh(new THREE.BoxGeometry(7.3, 1.6, 0.26), this.matSignWhite, 0, 5.8, 0.04));

      this.group.add(sg);
    });
  }

  // ─── UTILITY: create mesh helper ─────────────────────────────────────────
  _mesh(geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ─── CINEMATIC VIGNETTE: Wallace Silver Syndicate Mine Heist ─────────────
  triggerMineCinematic() {
    if (this.isCinematicPlaying) return;
    this.isCinematicPlaying = true;
    this.cinematicTime = 0;
    this.cinematicPhase = 'SHOT_1_APPROACH';
    this.hasTriggeredVignette = true;

    gameState.isCutsceneActive = true;
    gameState.cutsceneName = 'zone10_silver_mine_heist';
    gameState.cutsceneDuration = this.cinematicDuration;
    gameState.cutsceneTitleCard = '🎬 SILVER SYNDICATE MINE HEIST';
    gameState.cutsceneSubtitles = 'SILVER VALLEY, IDAHO: An ore cart rattles in the dark. Searchlights sweep. Someone is loading pure silver into a flatbed under the headframe at 2 AM.';

    if (typeof window !== 'undefined' && window.game) {
      window.game.activeZoneCutscene = this;
      if (window.game.hud && window.game.hud.showActionToast) {
        window.game.hud.showActionToast('🎬 SILVER SYNDICATE MINE HEIST', 'Investigating Silver Valley Mine… 14s surveillance', 3500);
      }
    }
  }

  skipCutscene() {
    if (this.isCinematicPlaying) this.completeCinematic();
  }

  completeCinematic() {
    this.isCinematicPlaying = false;
    this.cinematicPhase = 'IDLE';
    gameState.isCutsceneActive = false;
    gameState.cutsceneSubtitles = '';
    gameState.cutsceneTitleCard = '';
    gameState.score += 500;

    if (typeof window !== 'undefined' && window.game) {
      if (window.game.activeZoneCutscene === this) window.game.activeZoneCutscene = null;
      if (window.game.hud && window.game.hud.showActionToast) {
        window.game.hud.showActionToast('🏅 VIGNETTE COMPLETE', 'Silver Syndicate Mine Heist Witnessed! +500 PTS', 4500);
      }
      if (window.game.saveManager) window.game.saveManager.save(true);
    }
  }

  getCurrentCutsceneCam() {
    const t = this.mineTransform;
    if (!t) return null;
    const time = this.cinematicTime;

    if (time < 5.0) {
      // Shot 1: Wide exterior establishing — headframe at dusk
      this.cinematicPhase = 'SHOT_1_ESTABLISHING';
      gameState.cutsceneSubtitles = 'SILVER VALLEY, IDAHO: An ore cart rattles in the dark. Searchlights sweep. Someone is loading pure silver into a flatbed under the headframe at 2 AM.';
      const p = time / 5.0;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, -44 + p * 10).addScaledVector(t.tangent, -18 + p * 6);
      this._tempCamPos.y = t.pos.y + 20 - p * 3;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, 6);
      this._tempLookAt.y = t.pos.y + 10;
      this._camResult.fov = 58;
    } else if (time < 9.5) {
      // Shot 2: Close-up ore cart — shadowy figures loading truck
      this.cinematicPhase = 'SHOT_2_CLOSE_HEIST';
      gameState.cutsceneSubtitles = "Three unidentified men loading sealed ore crates into a flatbed truck under cover of darkness. Silver output far exceeds today's declared mine production.";
      const p = (time - 5.0) / 4.5;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, 12 + p * 6).addScaledVector(t.tangent, 8 + p * 4);
      this._tempCamPos.y = t.pos.y + 6 + p * 2;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, -2).addScaledVector(t.tangent, -4);
      this._tempLookAt.y = t.pos.y + 2;
      this._camResult.fov = 46;
    } else {
      // Shot 3: Truck peels out — searchlight sweeps after it
      this.cinematicPhase = 'SHOT_3_ESCAPE';
      gameState.cutsceneSubtitles = 'SILVER SYNDICATE GETAWAY: Flatbed accelerates north toward Wallace. Estimated cargo: $2.4M in unregistered silver ore. Casefile updated.';
      const p = (time - 9.5) / 4.5;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, -8).addScaledVector(t.tangent, 18 + p * 20);
      this._tempCamPos.y = t.pos.y + 5.5;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, 4).addScaledVector(t.tangent, 40 + p * 25);
      this._tempLookAt.y = t.pos.y + 2;
      this._camResult.fov = 52;
    }
    return this._camResult;
  }

  // ─── 60 FPS UPDATE — ZERO HEAP ALLOCATIONS ───────────────────────────────
  update(dt, playerPos) {
    // 1. Flash headframe amber beacons
    if (this.headframeBeacons.length > 0) {
      const flash = Math.sin(gameState.gameTime * 5.5) > 0.0;
      for (let i = 0; i < this.headframeBeacons.length; i++) {
        this.headframeBeacons[i].mesh.visible = flash;
      }
    }

    // 2. Ore cart pendulum during vignette
    if (this.isCinematicPlaying && this.oreCartMesh) {
      this.oreCartMesh.position.x = -1.5 + Math.sin(gameState.gameTime * 2.2) * 0.6;
    }

    // 3. Searchlight sweep during vignette
    if (this.isCinematicPlaying && this.searchlightMesh) {
      this.searchlightMesh.rotation.z = Math.sin(gameState.gameTime * 1.4) * 0.55;
    }

    // 4. Proximity trigger — cinematic vignette at mine (Z=28,300m)
    if (!this.isCinematicPlaying && !this.hasTriggeredVignette) {
      const zDist = Math.abs(playerPos.z - 28300);
      if (zDist < 40.0 && this.mineTransform) {
        this._tempVec1.set(playerPos.x, playerPos.y, playerPos.z);
        const d = this._tempVec1.distanceTo(this.mineTransform.pos);
        if (d < 28.0) {
          if (typeof window !== 'undefined' && window.game && window.game.hud && gameState.speedMph < 45) {
            window.game.hud.showActionToast('⚠️ SILVER VALLEY MINE HEADFRAME', 'Press [E] or slow to inspect mine activity at 2 AM…', 1500);
          }
          if (gameState.speedMph < 12.0 && playerPos.x > 12.0) {
            this.triggerMineCinematic();
          }
        }
      }
    }

    // 5. Advance cutscene timer
    if (this.isCinematicPlaying) {
      this.cinematicTime += dt;
      if (this.cinematicTime >= this.cinematicDuration) this.completeCinematic();
    }
  }
}
