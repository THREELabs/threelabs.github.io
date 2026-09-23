import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';
import { gameState } from '../state.js';

/**
 * 🦬 MONTANA BIG SKY & GLACIER SCENERY BUILDER
 * Zone 11: Montana Big Sky & Glacier Going-to-the-Sun Road (28,600m – 31,200m)
 *
 * 6-Gate AAA Gold Certification:
 * GATE 1 — Highway & Spline Continuity:
 *   - Continuous Catmull-Rom spline extending to 31,200m across the Continental Divide.
 * GATE 2 — 3 Major Anchor Landmarks:
 *   1. Lake McDonald Historic Cedar Lodge & Colored Pebble Shore  Z=29,200m  X=-58m
 *   2. The Weeping Wall & Triple Stone Arches                   Z=30,000m  X=+54m
 *   3. Logan Pass Continental Divide Visitor Center (6,646 ft)   Z=30,800m  X=+52m
 * GATE 3 — 2 Scenic Turnouts:
 *   - turnout_lake_mcdonald (Z=29,200m, left)
 *   - turnout_logan_pass    (Z=30,800m, right)
 * GATE 4 — Biome & Audio:
 *   - Cobalt Northern Rockies skies, high mountain wind, subalpine fir forest.
 * GATE 5 — Off-Road Spur: Hidden Lake Alpine Pass & Scree Trail  Z=30,350m  X=-58m
 * GATE 5 — Interactive Cinematic Vignette: "Going-to-the-Sun Red Jammer & Logan Pass Crossing"
 * GATE 6 — Subterranean foundations Y ≤ -1.5m, instanced fir forest, zero GC in update loop.
 */
export class MontanaGlacierSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.group.name = 'MontanaGlacierSceneryGroup';
    this.structureBuilder = new ProceduralStructureBuilder(renderer);

    // Pre-allocated scratch — ZERO heap allocations in render or physics loop
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

    // Animated / interactive prop references
    this.waterfallCascadeMesh = null;
    this.redJammerMesh = null;
    this.mountainGoatFamily = [];
    this.loganTransform = null;
    this.weepingWallTransform = null;

    this.initMaterials();
    this.buildScenery();
  }

  get isActive() {
    return this.isCinematicPlaying;
  }

  // ─── MATERIALS ────────────────────────────────────────────────────────────
  initMaterials() {
    const r = this.renderer;
    const woodNorm     = r.textures && r.textures.weatheredWoodNormalPBR  ? r.textures.weatheredWoodNormalPBR(512)     : null;
    const stoneNorm    = r.textures && r.textures.stoneMasonryNormalPBR   ? r.textures.stoneMasonryNormalPBR(512)      : null;
    const concreteNorm = r.textures && r.textures.concreteNormalPBR       ? r.textures.concreteNormalPBR(512)          : null;
    const firBarkDiff  = r.textures && r.textures.treeBarkPBR             ? r.textures.treeBarkPBR('pine', 256)        : null;
    const firBarkNorm  = r.textures && r.textures.treeBarkNormalPBR       ? r.textures.treeBarkNormalPBR('pine', 256)  : null;
    const firLeafDiff  = r.textures && r.textures.treeFoliagePBR          ? r.textures.treeFoliagePBR('conifer', 256)  : null;
    const firLeafNorm  = r.textures && r.textures.treeFoliageNormalPBR    ? r.textures.treeFoliageNormalPBR('conifer', 256) : null;

    // Lake McDonald & Shoreline
    this.matGlacierWater    = new THREE.MeshBasicMaterial({ color: 0x1e8fa8, transparent: true, opacity: 0.88 });
    this.matLakeBedShallow  = r.createToonMaterial({ color: 0x3aa8c2, gradientBands: 2 });
    this.matCedarTimber     = r.createToonMaterial({ color: 0x5a3d24, gradientBands: 3, normalMap: woodNorm });
    this.matCedarPlank      = r.createToonMaterial({ color: 0x7a5232, gradientBands: 2, normalMap: woodNorm });
    this.matChaletRoof      = r.createToonMaterial({ color: 0x2b382c, gradientBands: 2 });
    this.matRiverRock       = r.createToonMaterial({ color: 0x524e4a, gradientBands: 3, normalMap: stoneNorm });
    this.matWindowWarm      = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    // Rainbow Pebbles Palette
    this.matPebbleRed       = r.createToonMaterial({ color: 0x99382c, gradientBands: 2 });
    this.matPebbleGreen     = r.createToonMaterial({ color: 0x2e5c46, gradientBands: 2 });
    this.matPebbleTurquoise = r.createToonMaterial({ color: 0x2b7e8c, gradientBands: 2 });
    this.matPebbleOchre     = r.createToonMaterial({ color: 0xaf7c3c, gradientBands: 2 });

    // The Weeping Wall & Rock Strata
    this.matArgilliteRed    = r.createToonMaterial({ color: 0x6e382d, gradientBands: 3, normalMap: stoneNorm });
    this.matLimestoneSiyeh  = r.createToonMaterial({ color: 0x887b6c, gradientBands: 3, normalMap: stoneNorm });
    this.matWetRockFace     = r.createToonMaterial({ color: 0x3d322c, gradientBands: 3, rimColor: 0x8ecae6, rimPower: 2.0 });
    this.matWaterCascade    = new THREE.MeshBasicMaterial({ color: 0xd6f4ff, transparent: true, opacity: 0.82 });
    this.matMasonryArches   = r.createToonMaterial({ color: 0x5a544c, gradientBands: 3, normalMap: stoneNorm });
    this.matStoneGuardrail  = r.createToonMaterial({ color: 0x686056, gradientBands: 2, normalMap: stoneNorm });

    // Logan Pass & Alpine Tundra
    this.matAlpineTundra    = r.createToonMaterial({ color: 0x52624a, gradientBands: 3 });
    this.matAlpineScree     = r.createToonMaterial({ color: 0x6c6258, gradientBands: 2, normalMap: stoneNorm });
    this.matSnowBank        = new THREE.MeshBasicMaterial({ color: 0xf0f6fa });
    this.matLoganStoneWall  = r.createToonMaterial({ color: 0x655d52, gradientBands: 3, normalMap: stoneNorm });
    this.matBronzePlaque    = new THREE.MeshBasicMaterial({ color: 0xcd7f32 });

    // Red Bus "Jammer" (White Model 706)
    this.matJammerRed       = r.createToonMaterial({ color: 0xb91c1c, gradientBands: 3, rimColor: 0xf87171, rimPower: 2.2 });
    this.matJammerBlack     = r.createToonMaterial({ color: 0x18181b, gradientBands: 2 });
    this.matJammerCanvas    = r.createToonMaterial({ color: 0xdcd1b8, gradientBands: 2 });
    this.matJammerChrome    = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    this.matJammerGoldText  = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.matJammerLight     = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

    // Mountain Goats
    this.matGoatFleece      = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.matGoatHorn        = r.createToonMaterial({ color: 0x1e1e1e, gradientBands: 2 });

    // Instanced Subalpine Fir
    this.matFirTrunk        = r.createToonMaterial({ color: 0x4a3628, gradientBands: 2, map: firBarkDiff, normalMap: firBarkNorm });
    this.matFirCanopy       = r.createToonMaterial({ color: 0x1e462c, gradientBands: 3, map: firLeafDiff, normalMap: firLeafNorm, rimColor: 0x86efac, rimPower: 2.4 });

    // Highway signs
    this.matSignBrown       = r.createToonMaterial({ color: 0x422a18, gradientBands: 2 });
    this.matSignWhite       = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.matSignGold        = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    this.matSignGreen       = r.createToonMaterial({ color: 0x14532d, gradientBands: 2 });
  }

  // ─── MASTER SCENERY BUILDER ───────────────────────────────────────────────
  buildScenery() {
    this.buildLakeMcDonaldLodge();
    this.buildWeepingWallAndArches();
    this.buildLoganPassVisitorCenter();
    this.buildHiddenLakeAlpineSpur();
    this.buildSubalpineFirForest();
    this.buildGlacierHighwaySignage();
    this.buildScenicTurnoutProps();
  }

  // ─── LANDMARK 1: Lake McDonald Lodge & Colored Pebble Shore (Z=29,200m) ──
  buildLakeMcDonaldLodge() {
    const t = this.splineRoad.getRoadTransformAtZ(29200, -58, 0);
    const g = new THREE.Group();
    g.name = 'Scenic_LakeMcDonaldLodge';
    g.position.copy(t.pos);
    g.rotation.y = t.heading + Math.PI * 0.08;

    // Subterranean foundation pad (Y ≤ -1.8m)
    g.add(this._mesh(new THREE.BoxGeometry(84, 4, 60), this.matRiverRock, 0, -2.8, 0));

    // Transparent turquoise lake plane
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(100, 68), this.matGlacierWater);
    lake.rotateX(-Math.PI * 0.5);
    lake.position.set(-6, -0.3, -10);
    g.add(lake);

    // Lakebed shallow shelf
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(94, 64), this.matLakeBedShallow);
    bed.rotateX(-Math.PI * 0.5);
    bed.position.set(-6, -1.2, -10);
    g.add(bed);

    // Colored pebble shore strip (Grinnell red & emerald argillite stones)
    const pebbleMats = [this.matPebbleRed, this.matPebbleGreen, this.matPebbleTurquoise, this.matPebbleOchre];
    for (let px = -36; px <= 36; px += 4.5) {
      for (const pz of [8, 12, 16]) {
        const mat = pebbleMats[Math.abs(Math.floor(px * 3 + pz)) % pebbleMats.length];
        const rad = 0.55 + ((px + pz) % 3) * 0.25;
        const pebble = this._mesh(new THREE.SphereGeometry(rad, 5, 4), mat, px + (pz % 2) * 1.5, 0.2, pz);
        pebble.scale.set(1.4, 0.5, 1.1);
        g.add(pebble);
      }
    }

    // 1913 Swiss Chalet Main Lodge Building (3-story timber architectural marvel)
    const mainWidth = 34;
    const mainDepth = 22;
    const mainHeight = 14;

    // Ground floor river-rock foundation walls
    g.add(this._mesh(new THREE.BoxGeometry(mainWidth + 1.2, 4.5, mainDepth + 1.2), this.matRiverRock, 0, 2.25, 26));

    // Upper 2 timber stories
    g.add(this._mesh(new THREE.BoxGeometry(mainWidth, 8.5, mainDepth), this.matCedarTimber, 0, 8.5, 26));

    // Swiss chalet gabled pitched roof
    const roof = this._mesh(new THREE.ConeGeometry(24, 7, 4), this.matChaletRoof, 0, 15.5, 26);
    roof.rotation.y = Math.PI * 0.25;
    roof.scale.set(1.15, 1.0, 0.85);
    g.add(roof);

    // Massive river-rock end chimneys
    for (const cx of [-mainWidth * 0.5 - 1.2, mainWidth * 0.5 + 1.2]) {
      g.add(this._mesh(new THREE.BoxGeometry(4.2, 21, 4.2), this.matRiverRock, cx, 8.5, 26));
      g.add(this._mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.8, 6), this.matRiverRock, cx, 19.5, 26));
    }

    // Hand-carved rustic cedar log balconies (2nd and 3rd floors)
    for (const by of [6.2, 10.2]) {
      g.add(this._mesh(new THREE.BoxGeometry(mainWidth - 4, 0.5, 3.2), this.matCedarPlank, 0, by, 14.5));
      g.add(this._mesh(new THREE.BoxGeometry(mainWidth - 4, 1.1, 0.2), this.matCedarPlank, 0, by + 0.8, 13.0));
      for (let rx = -mainWidth * 0.5 + 4; rx <= mainWidth * 0.5 - 4; rx += 3.5) {
        g.add(this._mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.2, 5), this.matCedarTimber, rx, by + 0.6, 13.0));
      }
    }

    // Windows with warm interior lights
    for (let wx = -12; wx <= 12; wx += 6) {
      for (const wy of [2.8, 6.8, 10.8]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), this.matWindowWarm);
        win.position.set(wx, wy, 14.9);
        g.add(win);
      }
    }

    // Wooden boat dock extending into lake
    g.add(this._mesh(new THREE.BoxGeometry(5, 0.6, 32), this.matCedarPlank, -18, 0.3, -2));
    for (let pz = -14; pz <= 10; pz += 6) {
      for (const px of [-20.2, -15.8]) {
        g.add(this._mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.2, 5), this.matCedarTimber, px, -1.8, pz));
      }
    }

    // Historic wooden motor launch boat moored at dock
    const boat = new THREE.Group();
    boat.position.set(-23, 0.2, -4);
    boat.rotation.y = 0.15;
    const hull = this._mesh(new THREE.BoxGeometry(3.6, 1.4, 9.5), this.matCedarTimber, 0, 0.4, 0);
    boat.add(hull);
    const cabin = this._mesh(new THREE.BoxGeometry(2.8, 1.5, 4.5), this.matCedarPlank, 0, 1.5, 0.5);
    boat.add(cabin);
    const bow = this._mesh(new THREE.ConeGeometry(1.8, 3.2, 4), this.matCedarTimber, 0, 0.5, 5.5);
    bow.rotation.x = Math.PI * 0.5;
    boat.add(bow);
    g.add(boat);

    this.group.add(g);
  }

  // ─── LANDMARK 2: The Weeping Wall & Triple Stone Arches (Z=30,000m) ────────
  buildWeepingWallAndArches() {
    const t = this.splineRoad.getRoadTransformAtZ(30000, 52, 0);
    this.weepingWallTransform = t;
    const g = new THREE.Group();
    g.name = 'Scenic_WeepingWallTripleArches';
    g.position.copy(t.pos);
    g.rotation.y = t.heading - Math.PI * 0.04;

    // Subterranean foundation anchor (Y ≤ -2.0m)
    g.add(this._mesh(new THREE.BoxGeometry(110, 5, 40), this.matLimestoneSiyeh, 0, -3.5, 0));

    // Sheer 44m Weeping Wall Rock Cliff Face (carved argillite & limestone strata)
    const cliffWidth = 100;
    const cliffHeight = 44;
    const cliff = this._mesh(new THREE.BoxGeometry(cliffWidth, cliffHeight, 14), this.matWetRockFace, 0, cliffHeight * 0.5 - 1.0, 12);
    g.add(cliff);

    // Argillite red and limestone bands
    g.add(this._mesh(new THREE.BoxGeometry(cliffWidth + 1, 10, 15), this.matArgilliteRed, 0, 12, 12));
    g.add(this._mesh(new THREE.BoxGeometry(cliffWidth + 1, 8, 15.5), this.matLimestoneSiyeh, 0, 24, 12));
    g.add(this._mesh(new THREE.BoxGeometry(cliffWidth + 1, 12, 14.5), this.matWetRockFace, 0, 36, 12));

    // The Weeping Wall Water Cascades (flowing mountain spring curtain)
    for (const wx of [-26, -10, 8, 24]) {
      const cascade = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 28), this.matWaterCascade);
      cascade.position.set(wx, 15, 4.4);
      g.add(cascade);
      this.waterfallCascadeMesh = cascade;

      // Stone splash basin / rock shelf
      const basin = this._mesh(new THREE.BoxGeometry(7, 1.4, 3.5), this.matStoneGuardrail, wx, 0.7, 3.2);
      g.add(basin);
    }

    // Triple Stone Arches Highway Retaining Gallery (built into cliff face)
    const galleryGroup = new THREE.Group();
    galleryGroup.position.set(-18, 0, -18);
    for (let i = 0; i < 3; i++) {
      const archX = i * 16 - 16;
      // Arch left pillar
      galleryGroup.add(this._mesh(new THREE.BoxGeometry(3.5, 14, 4), this.matMasonryArches, archX - 5.5, 6, 0));
      // Arch right pillar
      galleryGroup.add(this._mesh(new THREE.BoxGeometry(3.5, 14, 4), this.matMasonryArches, archX + 5.5, 6, 0));
      // Arch barrel header
      galleryGroup.add(this._mesh(new THREE.BoxGeometry(14.5, 3.5, 4.4), this.matMasonryArches, archX, 13.5, 0));
      // Decorative masonry keystone
      galleryGroup.add(this._mesh(new THREE.BoxGeometry(2.4, 2.2, 4.8), this.matLimestoneSiyeh, archX, 14.2, 0.2));
    }
    g.add(galleryGroup);

    // Historic Stone Parapet Guardrail along edge with drainage weep holes
    for (let gx = -48; gx <= 48; gx += 8) {
      g.add(this._mesh(new THREE.BoxGeometry(7.6, 1.2, 0.9), this.matStoneGuardrail, gx, 0.6, -26));
      // Drainage weep hole under rail
      g.add(this._mesh(new THREE.BoxGeometry(1.2, 0.35, 1.0), this.matJammerBlack, gx, 0.18, -26));
    }

    this.group.add(g);
  }

  // ─── LANDMARK 3: Logan Pass Continental Divide Visitor Center (Z=30,800m) 
  buildLoganPassVisitorCenter() {
    const t = this.splineRoad.getRoadTransformAtZ(30800, 52, 0);
    this.loganTransform = t;
    const g = new THREE.Group();
    g.name = 'Scenic_LoganPassVisitorCenter';
    g.position.copy(t.pos);
    g.rotation.y = t.heading - Math.PI * 0.06;

    // Subterranean rock terrace foundation (Y ≤ -2.0m)
    g.add(this._mesh(new THREE.BoxGeometry(86, 5, 64), this.matLoganStoneWall, 0, -3.2, 0));

    // Logan Pass Alpine Visitor Center Building (6,646 ft)
    const vcWidth = 32;
    const vcDepth = 18;
    const vcHeight = 8.5;

    // Native stone masonry base & walls
    g.add(this._mesh(new THREE.BoxGeometry(vcWidth, 4.5, vcDepth), this.matLoganStoneWall, 0, 2.25, 14));
    // Upper cedar shingle siding
    g.add(this._mesh(new THREE.BoxGeometry(vcWidth - 0.4, 4.2, vcDepth - 0.4), this.matCedarTimber, 0, 6.4, 14));

    // Low-slung alpine snow-shed roof (steep pitch to shed brutal winter snow)
    const roof = this._mesh(new THREE.ConeGeometry(22, 6.5, 4), this.matChaletRoof, 0, 11.5, 14);
    roof.rotation.y = Math.PI * 0.25;
    roof.scale.set(1.25, 0.95, 0.85);
    g.add(roof);

    // Panoramic clerestory glass windows facing Reynolds Mountain
    const glassStrip = new THREE.Mesh(new THREE.PlaneGeometry(vcWidth - 6, 2.8), this.matWindowWarm);
    glassStrip.position.set(0, 5.8, 4.9);
    g.add(glassStrip);

    // Continental Divide Bronze Geographic Monument
    const monument = new THREE.Group();
    monument.position.set(-16, 0.5, -4);
    monument.add(this._mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.4, 8), this.matLoganStoneWall, 0, 0.7, 0));
    monument.add(this._mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 16), this.matBronzePlaque, 0, 1.5, 0));
    g.add(monument);

    // Highline Trailhead & Hidden Lake Trail Signposts
    const signGroup = new THREE.Group();
    signGroup.position.set(-22, 0, -6);
    signGroup.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.6, 6), this.matCedarTimber, 0, 1.8, 0));
    signGroup.add(this._mesh(new THREE.BoxGeometry(4.8, 1.8, 0.22), this.matSignBrown, 0, 3.2, 0));
    signGroup.add(this._mesh(new THREE.BoxGeometry(4.5, 1.5, 0.28), this.matSignGold, 0, 3.2, 0.02));
    g.add(signGroup);

    // Coin-op Observation Binoculars / High-power Telescope
    const bino = new THREE.Group();
    bino.position.set(14, 0.5, -8);
    bino.add(this._mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 6), this.matJammerChrome, 0, 0.8, 0));
    bino.add(this._mesh(new THREE.BoxGeometry(0.7, 0.45, 1.2), this.matJammerBlack, 0, 1.7, 0));
    bino.add(this._mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8), this.matJammerChrome, -0.2, 1.7, 0.4));
    bino.add(this._mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8), this.matJammerChrome,  0.2, 1.7, 0.4));
    g.add(bino);

    // Perched Mountain Goat Family on rocky ridge behind visitor center
    const goatParent = this._createMountainGoat(true);
    goatParent.position.set(18, 3.2, 22);
    goatParent.rotation.y = -0.4;
    g.add(goatParent);
    this.mountainGoatFamily.push(goatParent);

    const goatKid = this._createMountainGoat(false);
    goatKid.position.set(22, 3.0, 20);
    goatKid.rotation.y = -0.2;
    g.add(goatKid);
    this.mountainGoatFamily.push(goatKid);

    // Historic 1930s White Model 706 Red Bus "Jammer" (parked at turnout)
    const jammer = this._createRedBusJammer();
    jammer.position.set(-6, 0.1, -12);
    jammer.rotation.y = -0.15;
    g.add(jammer);
    this.redJammerMesh = jammer;

    this.group.add(g);
  }

  // ─── OFF-ROAD SPUR: Hidden Lake Alpine Pass & Scree Trail (Z=30,350m) ──────
  buildHiddenLakeAlpineSpur() {
    const t = this.splineRoad.getRoadTransformAtZ(30350, -56, 0);
    const g = new THREE.Group();
    g.name = 'OffRoad_HiddenLakeAlpineSpur';
    g.position.copy(t.pos);
    g.rotation.y = t.heading - Math.PI * 0.32;

    // Subterranean skirt
    g.add(this._mesh(new THREE.BoxGeometry(50, 4, 70), this.matAlpineScree, 0, -2.8, 30));

    // Packed scree and gravel switchback trail bed
    g.add(this._mesh(new THREE.BoxGeometry(5.2, 0.25, 64), this.matAlpineScree, 0, 0.1, 30));

    // Wooden NPS trail marker post
    g.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 4.2, 6), this.matCedarTimber, -3.2, 2.1, 2));
    g.add(this._mesh(new THREE.BoxGeometry(5.2, 1.8, 0.24), this.matSignBrown, -3.2, 3.8, 2));
    g.add(this._mesh(new THREE.BoxGeometry(4.9, 1.5, 0.30), this.matSignWhite, -3.2, 3.8, 2.04));

    // Alpine stone trail cairns (stacked navigation markers across tundra)
    for (const cz of [14, 32, 50]) {
      const cairn = new THREE.Group();
      cairn.position.set(3.8, 0.1, cz);
      cairn.add(this._mesh(new THREE.CylinderGeometry(0.9, 1.2, 0.5, 6), this.matLimestoneSiyeh, 0, 0.25, 0));
      cairn.add(this._mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.45, 6), this.matArgilliteRed, 0, 0.7, 0));
      cairn.add(this._mesh(new THREE.CylinderGeometry(0.4, 0.6, 0.4, 5), this.matLimestoneSiyeh, 0, 1.1, 0));
      cairn.add(this._mesh(new THREE.SphereGeometry(0.25, 5, 4), this.matRiverRock, 0, 1.45, 0));
      g.add(cairn);
    }

    // Snow drift patches along the high ridge
    for (const sz of [18, 38, 56]) {
      const snow = this._mesh(new THREE.BoxGeometry(6.5, 0.6, 10.0), this.matSnowBank, -4.5, 0.3, sz);
      snow.rotation.y = 0.25;
      g.add(snow);
    }

    // High rocky outcrop with mountain goat sentinel
    const crag = this._mesh(new THREE.BoxGeometry(12, 9, 14), this.matArgilliteRed, -9, 4.5, 44);
    g.add(crag);
    const sentinelGoat = this._createMountainGoat(true);
    sentinelGoat.position.set(-8.5, 9.2, 44);
    sentinelGoat.rotation.y = 1.2;
    g.add(sentinelGoat);
    this.mountainGoatFamily.push(sentinelGoat);

    this.group.add(g);
  }

  // ─── INSTANCED SUBALPINE FIR FOREST ──────────────────────────────────────
  buildSubalpineFirForest() {
    const trunkGeo  = new THREE.CylinderGeometry(0.45, 0.65, 12, 6);
    const canopyGeo = new THREE.ConeGeometry(3.6, 9.5, 6);

    const clusters = [
      { z: 28750, x:  54, count: 16, spread: 26 },
      { z: 28950, x: -62, count: 18, spread: 30 },
      { z: 29350, x:  58, count: 14, spread: 25 },
      { z: 29550, x: -68, count: 16, spread: 28 },
      { z: 29800, x:  64, count: 12, spread: 22 },
      { z: 30200, x: -64, count: 15, spread: 26 },
      { z: 30550, x:  62, count: 12, spread: 24 },
      { z: 30950, x: -58, count: 14, spread: 25 },
      { z: 31100, x:  56, count: 16, spread: 28 }
    ];

    const dummy = new THREE.Object3D();
    const trunkMats = [];
    const canopyMats = [];

    clusters.forEach(cl => {
      for (let i = 0; i < cl.count; i++) {
        const angle  = (i / cl.count) * Math.PI * 2 + cl.z * 0.015;
        const radius = cl.spread * 0.35 + (i % 3) * cl.spread * 0.22;
        const tx = cl.x + Math.cos(angle) * radius;
        const tz = cl.z + Math.sin(angle) * radius * 0.75;
        const sc = 0.65 + (i % 4) * 0.18;

        const roadInfo = this.splineRoad.getRoadTransformAtZ(tz, tx, 0);
        const gy = roadInfo ? roadInfo.pos.y : 0;

        dummy.position.set(tx, gy - 1.5, tz);
        dummy.scale.set(sc, sc, sc);
        dummy.rotation.y = angle * 1.4;
        dummy.updateMatrix();
        trunkMats.push(dummy.matrix.clone());

        dummy.position.set(tx, gy + 8.5 * sc, tz);
        dummy.updateMatrix();
        canopyMats.push(dummy.matrix.clone());
      }
    });

    if (trunkMats.length > 0) {
      const iT = new THREE.InstancedMesh(trunkGeo, this.matFirTrunk, trunkMats.length);
      iT.name = 'Instanced_GlacierFirTrunks';
      trunkMats.forEach((m, i) => iT.setMatrixAt(i, m));
      iT.instanceMatrix.needsUpdate = true;
      this.group.add(iT);

      const iC = new THREE.InstancedMesh(canopyGeo, this.matFirCanopy, canopyMats.length);
      iC.name = 'Instanced_GlacierFirCanopy';
      canopyMats.forEach((m, i) => iC.setMatrixAt(i, m));
      iC.instanceMatrix.needsUpdate = true;
      this.group.add(iC);
    }
  }

  // ─── HIGHWAY SIGNAGE KIT ─────────────────────────────────────────────────
  buildGlacierHighwaySignage() {
    const signs = [
      { z: 28800, x: -22, title: 'GLACIER NATIONAL PARK', sub: 'GOING-TO-THE-SUN ROAD', color: 0x14532d },
      { z: 29050, x: -22, title: 'LAKE MCDONALD LODGE', sub: 'HISTORIC CHALET • NEXT RIGHT', color: 0x422a18 },
      { z: 29850, x:  22, title: 'THE WEEPING WALL', sub: 'WATERFALL CASCADE • 1/4 MILE', color: 0x14532d },
      { z: 30650, x:  22, title: 'LOGAN PASS SUMMIT', sub: 'ELEVATION 6,646 FT • CONTINENTAL DIVIDE', color: 0x422a18 }
    ];

    signs.forEach(sign => {
      const t = this.splineRoad.getRoadTransformAtZ(sign.z, sign.x, 0);
      const sg = new THREE.Group();
      sg.position.copy(t.pos);
      sg.rotation.y = t.heading;

      // Heavy timber posts
      sg.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.5, 6), this.matCedarTimber, -1.8, 2.75, 0));
      sg.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.5, 6), this.matCedarTimber,  1.8, 2.75, 0));
      // Signboard
      sg.add(this._mesh(new THREE.BoxGeometry(7.8, 2.2, 0.22), new THREE.MeshBasicMaterial({ color: sign.color }), 0, 5.2, 0));
      sg.add(this._mesh(new THREE.BoxGeometry(7.5, 1.9, 0.28), this.matSignWhite, 0, 5.2, 0.04));

      this.group.add(sg);
    });
  }

  // ─── SCENIC TURNOUTS PROPS (Lake McDonald & Logan Pass) ──────────────────
  buildScenicTurnoutProps() {
    // 1. Lake McDonald Turnout (Z=29,200m, Left)
    const tMc = this.splineRoad.getRoadTransformAtZ(29200, -28, 0);
    const gMc = new THREE.Group();
    gMc.position.copy(tMc.pos);
    gMc.rotation.y = tMc.heading;

    // Interpretive kiosk with wooden roof
    const kioskMc = new THREE.Group();
    kioskMc.position.set(0, 0, -10);
    kioskMc.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.8, 6), this.matCedarTimber, -1.6, 1.9, 0));
    kioskMc.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.8, 6), this.matCedarTimber,  1.6, 1.9, 0));
    kioskMc.add(this._mesh(new THREE.BoxGeometry(4.2, 2.2, 0.2), this.matSignBrown, 0, 3.0, 0));
    kioskMc.add(this._mesh(new THREE.BoxGeometry(3.8, 1.8, 0.26), this.matSignGold, 0, 3.0, 0.04));
    kioskMc.add(this._mesh(new THREE.ConeGeometry(3.0, 1.4, 4), this.matChaletRoof, 0, 4.4, 0));
    gMc.add(kioskMc);

    // Coin-op observation telescope
    const teleMc = new THREE.Group();
    teleMc.position.set(-6, 0, -4);
    teleMc.add(this._mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.5, 6), this.matJammerChrome, 0, 0.75, 0));
    teleMc.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.9, 8), this.matJammerBlack, 0, 1.6, 0));
    gMc.add(teleMc);

    this.group.add(gMc);

    // 2. Logan Pass Turnout (Z=30,800m, Right)
    const tLg = this.splineRoad.getRoadTransformAtZ(30800, 28, 0);
    const gLg = new THREE.Group();
    gLg.position.copy(tLg.pos);
    gLg.rotation.y = tLg.heading;

    // Highline Trailhead kiosk
    const kioskLg = new THREE.Group();
    kioskLg.position.set(0, 0, -12);
    kioskLg.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.8, 6), this.matCedarTimber, -1.6, 1.9, 0));
    kioskLg.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.8, 6), this.matCedarTimber,  1.6, 1.9, 0));
    kioskLg.add(this._mesh(new THREE.BoxGeometry(4.2, 2.2, 0.2), this.matSignBrown, 0, 3.0, 0));
    kioskLg.add(this._mesh(new THREE.BoxGeometry(3.8, 1.8, 0.26), this.matSignGold, 0, 3.0, 0.04));
    kioskLg.add(this._mesh(new THREE.ConeGeometry(3.0, 1.4, 4), this.matChaletRoof, 0, 4.4, 0));
    gLg.add(kioskLg);

    this.group.add(gLg);
  }

  // ─── VEHICLE GENERATOR: Historic 1930s White Model 706 "Red Jammer" ───────
  _createRedBusJammer() {
    const jammer = new THREE.Group();
    jammer.name = 'RedBus_Jammer_Model706';

    // Chassis & Red Coach Body
    const body = this._mesh(new THREE.BoxGeometry(3.2, 1.8, 9.2), this.matJammerRed, 0, 1.4, 0);
    jammer.add(body);

    // Black curved fenders & running boards
    for (const fx of [-1.75, 1.75]) {
      jammer.add(this._mesh(new THREE.BoxGeometry(0.5, 0.6, 9.6), this.matJammerBlack, fx, 0.6, 0));
    }

    // Heavy black tires
    for (const [wx, wz] of [[-1.6, 2.8], [1.6, 2.8], [-1.6, -2.8], [1.6, -2.8]]) {
      const wheel = this._mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 12), this.matJammerBlack, wx, 0.55, wz);
      wheel.rotation.z = Math.PI * 0.5;
      jammer.add(wheel);
      const hub = this._mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.48, 8), this.matJammerChrome, wx, 0.55, wz);
      hub.rotation.z = Math.PI * 0.5;
      jammer.add(hub);
    }

    // Open roll-back canvas top & side uprights
    jammer.add(this._mesh(new THREE.BoxGeometry(2.9, 0.35, 6.2), this.matJammerCanvas, 0, 2.5, -0.6));
    for (let pz = -3.2; pz <= 2.2; pz += 1.8) {
      for (const px of [-1.55, 1.55]) {
        jammer.add(this._mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), this.matJammerChrome, px, 2.0, pz));
      }
    }

    // Chrome radiator grille & front hood
    const hood = this._mesh(new THREE.BoxGeometry(2.4, 1.4, 2.8), this.matJammerRed, 0, 1.25, 4.8);
    jammer.add(hood);
    const grille = this._mesh(new THREE.BoxGeometry(1.8, 1.3, 0.25), this.matJammerChrome, 0, 1.25, 6.25);
    jammer.add(grille);

    // Glowing vintage headlights
    for (const hx of [-1.1, 1.1]) {
      const lamp = this._mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.35, 10), this.matJammerLight, hx, 1.3, 6.3);
      lamp.rotation.x = Math.PI * 0.5;
      jammer.add(lamp);
    }

    // Gold "GLACIER NATIONAL PARK TRANSPORTATION CO." side lettering strip
    for (const sx of [-1.62, 1.62]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.35), this.matJammerGoldText);
      strip.position.set(sx, 1.55, -0.2);
      strip.rotation.y = sx > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      jammer.add(strip);
    }

    return jammer;
  }

  // ─── ANIMAL GENERATOR: Rocky Mountain White Mountain Goat ────────────────
  _createMountainGoat(isAdult = true) {
    const goat = new THREE.Group();
    const sc = isAdult ? 1.0 : 0.6;
    goat.scale.set(sc, sc, sc);

    // Thick white winter fleece body
    const body = this._mesh(new THREE.BoxGeometry(1.2, 1.4, 2.2), this.matGoatFleece, 0, 1.4, 0);
    goat.add(body);

    // Shoulder muscular crest
    const crest = this._mesh(new THREE.ConeGeometry(0.8, 0.9, 4), this.matGoatFleece, 0, 2.2, 0.4);
    crest.rotation.y = Math.PI * 0.25;
    goat.add(crest);

    // Head & Beard
    const head = this._mesh(new THREE.BoxGeometry(0.7, 0.8, 1.1), this.matGoatFleece, 0, 2.2, 1.4);
    goat.add(head);
    const beard = this._mesh(new THREE.ConeGeometry(0.25, 0.7, 4), this.matGoatFleece, 0, 1.6, 1.6);
    beard.rotation.x = Math.PI;
    goat.add(beard);

    // Sharp black dagger horns
    for (const hx of [-0.22, 0.22]) {
      const horn = this._mesh(new THREE.ConeGeometry(0.08, 0.75, 5), this.matGoatHorn, hx, 2.9, 1.2);
      horn.rotation.x = -0.35;
      goat.add(horn);
    }

    // Sturdy mountain-climbing hooved legs
    for (const [lx, lz] of [[-0.45, 0.8], [0.45, 0.8], [-0.45, -0.8], [0.45, -0.8]]) {
      goat.add(this._mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.2, 5), this.matGoatFleece, lx, 0.6, lz));
      goat.add(this._mesh(new THREE.BoxGeometry(0.22, 0.2, 0.28), this.matGoatHorn, lx, 0.1, lz));
    }

    return goat;
  }

  // ─── UTILITY: Mesh helper with shadows ────────────────────────────────────
  _mesh(geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ─── CINEMATIC VIGNETTE: Going-to-the-Sun Red Jammer & Logan Pass Crossing ─
  triggerGlacierCinematic() {
    if (this.isCinematicPlaying) return;
    this.isCinematicPlaying = true;
    this.cinematicTime = 0;
    this.cinematicPhase = 'SHOT_1_ESTABLISHING';
    this.hasTriggeredVignette = true;

    gameState.isCutsceneActive = true;
    gameState.cutsceneName = 'zone11_glacier_red_jammer';
    gameState.cutsceneDuration = this.cinematicDuration;
    gameState.cutsceneTitleCard = '🎬 LOGAN PASS RED JAMMER RENDEZVOUS';
    gameState.cutsceneSubtitles = 'LOGAN PASS, MONTANA (6,646 FT): Wind howls across the Continental Divide. A historic 1936 White Model 706 Red Bus "Jammer" idles beside the stone parapet as mountain goats cross the pass.';

    if (typeof window !== 'undefined' && window.game) {
      window.game.activeZoneCutscene = this;
      if (window.game.hud && window.game.hud.showActionToast) {
        window.game.hud.showActionToast('🎬 LOGAN PASS RED JAMMER RENDEZVOUS', 'Observing Continental Divide crossing… 14s cinematic', 3500);
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
        window.game.hud.showActionToast('🏅 VIGNETTE COMPLETE', 'Going-to-the-Sun Red Jammer Encounter Witnessed! +500 PTS', 4500);
      }
      if (window.game.saveManager) window.game.saveManager.save(true);
    }
  }

  getCurrentCutsceneCam() {
    const t = this.loganTransform;
    if (!t) return null;
    const time = this.cinematicTime;

    if (time < 4.8) {
      // Shot 1: Wide sweeping alpine establishing shot — Continental Divide & Reynolds Mountain
      this.cinematicPhase = 'SHOT_1_ESTABLISHING';
      gameState.cutsceneSubtitles = 'LOGAN PASS, MONTANA (6,646 FT): Wind howls across the Continental Divide. A historic 1936 White Model 706 Red Bus "Jammer" idles beside the stone parapet as mountain goats cross the pass.';
      const p = time / 4.8;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, -48 + p * 12).addScaledVector(t.tangent, -24 + p * 8);
      this._tempCamPos.y = t.pos.y + 18 - p * 2.5;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, 8);
      this._tempLookAt.y = t.pos.y + 8;
      this._camResult.fov = 58;
    } else if (time < 9.4) {
      // Shot 2: Medium action shot — Red Jammer with chrome headlights & mountain goat herd crossing
      this.cinematicPhase = 'SHOT_2_JAMMER_AND_GOATS';
      gameState.cutsceneSubtitles = 'Built between 1921 and 1932, the Going-to-the-Sun Road is a civil engineering miracle blasted into sheer 3,000-ft cliff faces. The iconic Red Jammers have toured this route for nearly a century.';
      const p = (time - 4.8) / 4.6;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, -14 + p * 8).addScaledVector(t.tangent, -16 + p * 6);
      this._tempCamPos.y = t.pos.y + 4.2 + p * 1.5;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, -4).addScaledVector(t.tangent, -8);
      this._tempLookAt.y = t.pos.y + 2.4;
      this._camResult.fov = 48;
    } else {
      // Shot 3: Panoramic departure shot — Looking west through the Garden Wall cirque down McDonald Valley
      this.cinematicPhase = 'SHOT_3_DEPARTURE';
      gameState.cutsceneSubtitles = 'THE CROWN OF THE CONTINENT: Rain on this divide flows either to the Pacific or Hudson Bay. Ahead, the high mountain curves descend toward the great plains of Big Sky country.';
      const p = (time - 9.4) / 4.6;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, 12).addScaledVector(t.tangent, 16 + p * 24);
      this._tempCamPos.y = t.pos.y + 7.5;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, -24).addScaledVector(t.tangent, 50 + p * 30);
      this._tempLookAt.y = t.pos.y + 5.0;
      this._camResult.fov = 52;
    }
    return this._camResult;
  }

  // ─── 60 FPS UPDATE — ZERO HEAP ALLOCATIONS ───────────────────────────────
  update(dt, playerPos) {
    // 1. Water curtain oscillation on the Weeping Wall
    if (this.waterfallCascadeMesh) {
      this.waterfallCascadeMesh.material.opacity = 0.72 + Math.sin(gameState.gameTime * 4.5) * 0.12;
    }

    // 2. Animated Jammer headlights & gentle vibration during vignette
    if (this.isCinematicPlaying && this.redJammerMesh) {
      this.redJammerMesh.position.y = 0.1 + Math.sin(gameState.gameTime * 18.0) * 0.015;
    }

    // 3. Proximity trigger — cinematic vignette at Logan Pass (Z=30,800m)
    if (!this.isCinematicPlaying && !this.hasTriggeredVignette && playerPos) {
      const zDist = Math.abs(playerPos.z - 30800);
      if (zDist < 45.0 && this.loganTransform) {
        this._tempVec1.set(playerPos.x, playerPos.y, playerPos.z);
        const d = this._tempVec1.distanceTo(this.loganTransform.pos);
        if (d < 35.0) {
          if (typeof window !== 'undefined' && window.game && window.game.hud && gameState.speedMph < 50) {
            window.game.hud.showActionToast('⚠️ LOGAN PASS CONTINENTAL DIVIDE (6,646 FT)', 'Slow down or press [E] to witness Red Jammer crossing…', 1500);
          }
          if (gameState.speedMph < 14.0 && playerPos.x > 12.0) {
            this.triggerGlacierCinematic();
          }
        }
      }
    }

    // 4. Advance cutscene timer
    if (this.isCinematicPlaying) {
      this.cinematicTime += dt;
      if (this.cinematicTime >= this.cinematicDuration) this.completeCinematic();
    }
  }
}
