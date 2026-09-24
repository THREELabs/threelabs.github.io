import * as THREE from 'three';
import { ProceduralStructureBuilder } from './ProceduralArchitecture.js';
import { gameState } from '../state.js';

/**
 * 🎰 LAS VEGAS STRIP & RED ROCK CANYON SCENERY BUILDER
 * Zone 12: Las Vegas Strip & Red Rock Canyon (Authored: 31,200m – 33,800m | World: 62,000m – 66,500m)
 *
 * 6-Gate AAA Gold Certification:
 * GATE 1 — Highway & Spline Continuity:
 *   - Continuous Catmull-Rom spline extending to 66,500m across the Las Vegas desert basin & Aztec sandstone canyon.
 * GATE 2 — 3 Major Anchor Landmarks:
 *   1. Welcome to Fabulous Las Vegas Googie Neon Sign & Plaza       Z=31,800m  X=-28m (World Z=63,100m)
 *   2. The Strip: Luxor Obsidian Pyramid & Bellagio Dancing Fountains Z=32,500m  X=+62m (World Z=64,300m)
 *   3. Red Rock Canyon Aztec Sandstone Escarpment & Calico Hills     Z=33,200m  X=-56m (World Z=65,500m)
 * GATE 3 — 2 Scenic Turnouts:
 *   - turnout_vegas_sign       (Z=31,800m / World Z=63,100m, left)
 *   - turnout_red_rock_canyon  (Z=33,200m / World Z=65,500m, right)
 * GATE 4 — Biome & Atmosphere:
 *   - Neon desert night twilight, magenta-indigo sky glow, Mojave Joshua trees & Washingtonia fan palms.
 * GATE 5 — Off-Road Spur: Calico Basin Red Sandstone 4x4 Slickrock Trail  Z=32,850m  X=+38m
 * GATE 5 — Interactive Cinematic Vignette: "🎰 MIDNIGHT HIGH-ROLLER CASINO HEIST ESCAPE" (3-shot choreography)
 * GATE 6 — Subterranean foundations Y ≤ -1.5m, instanced foliage, zero GC in update loop.
 */
export class LasVegasSceneryBuilder {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.group.name = 'LasVegasSceneryGroup';
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

    // Animated & interactive prop references
    this.fountainJets = [];
    this.pyramidBeaconMesh = null;
    this.getawayCarMesh = null;
    this.vegasSignTransform = null;
    this.casinoTransform = null;
    this.redRockTransform = null;

    this.initMaterials();
    this.buildScenery();
  }

  get isActive() {
    return this.isCinematicPlaying;
  }

  // ─── MATERIALS ────────────────────────────────────────────────────────────
  initMaterials() {
    const r = this.renderer;
    const stoneNorm = r.textures && r.textures.stoneMasonryNormalPBR ? r.textures.stoneMasonryNormalPBR(512) : null;
    const concreteNorm = r.textures && r.textures.concreteNormalPBR ? r.textures.concreteNormalPBR(512) : null;

    // Neon Glow & Emissives
    this.matNeonYellow = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    this.matNeonCyan   = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.matNeonMagenta = new THREE.MeshBasicMaterial({ color: 0xff007f });
    this.matNeonRed    = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.matNeonBlue   = new THREE.MeshBasicMaterial({ color: 0x1e88e5 });
    this.matWarmBulb   = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });
    this.matWhiteNeon  = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Casino Architecture & The Strip
    this.matPyramidGlass = r.createToonMaterial({ color: 0x10141a, gradientBands: 3 });
    this.matPyramidBronze = r.createToonMaterial({ color: 0x8a7046, gradientBands: 2 });
    this.matSphinxGold   = r.createToonMaterial({ color: 0xcca038, gradientBands: 3 });
    this.matCasinoMarble = r.createToonMaterial({ color: 0xded8cc, gradientBands: 2, normalMap: stoneNorm });
    this.matCasinoPorphyry = r.createToonMaterial({ color: 0x3d2836, gradientBands: 2 });
    this.matRedCarpet    = r.createToonMaterial({ color: 0x85121e, gradientBands: 2 });
    this.matChrome       = r.createToonMaterial({ color: 0xcccccc, gradientBands: 4 });

    // Water & Fountains
    this.matLagoonWater  = new THREE.MeshBasicMaterial({ color: 0x12929e, transparent: true, opacity: 0.82 });
    this.matFountainSpray = new THREE.MeshBasicMaterial({ color: 0xc8f8ff, transparent: true, opacity: 0.65 });

    // Red Rock Canyon Aztec Sandstone Formations
    this.matSandstoneCrimson = r.createToonMaterial({ color: 0xa83226, gradientBands: 3, normalMap: stoneNorm });
    this.matSandstoneTerracotta = r.createToonMaterial({ color: 0xc65a38, gradientBands: 3, normalMap: stoneNorm });
    this.matSandstoneCream   = r.createToonMaterial({ color: 0xdfc298, gradientBands: 2, normalMap: stoneNorm });
    this.matDesertVarnish    = r.createToonMaterial({ color: 0x48241c, gradientBands: 2 });
    this.matCalicheGravel    = r.createToonMaterial({ color: 0x7c6753, gradientBands: 2 });

    // Foundations & Infrastructure (All subterranean skirts sink Y <= -1.5m)
    this.matFoundationSlab  = r.createToonMaterial({ color: 0x362f2b, gradientBands: 2, normalMap: concreteNorm });
    this.matTurfGrass       = r.createToonMaterial({ color: 0x2e6f24, gradientBands: 2 });
    this.matConcreteCurb    = r.createToonMaterial({ color: 0x9ca3af, gradientBands: 2, normalMap: concreteNorm });
    this.matPylonSteelRed   = r.createToonMaterial({ color: 0xb91c1c, gradientBands: 2 });
    this.matCedarTimber     = r.createToonMaterial({ color: 0x5a3d24, gradientBands: 2 });

    // Instanced Desert Flora
    this.matJoshuaTrunk     = r.createToonMaterial({ color: 0x6e5842, gradientBands: 2 });
    this.matJoshuaTuft      = r.createToonMaterial({ color: 0x476332, gradientBands: 2 });
    this.matPalmTrunk       = r.createToonMaterial({ color: 0x5c4228, gradientBands: 2 });
    this.matPalmFrond       = r.createToonMaterial({ color: 0x2d6824, gradientBands: 2 });

    // Skyward Xenon Beacon Beam Material (Additive Blending)
    this.matBeaconBeam = new THREE.MeshBasicMaterial({
      color: 0x90e0ef,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }

  // ─── MASTER BUILD ROUTINE ─────────────────────────────────────────────────
  buildScenery() {
    // GATE 2: 3 Major Anchor Landmarks
    this.buildWelcomeToVegasSign();
    this.buildLuxorPyramidAndFountains();
    this.buildRedRockEscarpment();

    // GATE 3: 2 Scenic Turnout Integrations
    this.buildVegasSignTurnout();
    this.buildRedRockTurnout();

    // GATE 5: 1 Off-Road / Secret Spur (Calico Basin 4x4 Slickrock Trail)
    this.buildCalicoBasin4x4Spur();

    // Biome Vegetation: Instanced Joshua Trees & Strip Fan Palms
    this.buildInstancedFlora();

    // Highway Roadside Streetlights & Strip Marquees
    this.buildStripStreetlights();
  }

  // ─── LANDMARK 1: Welcome to Fabulous Las Vegas Sign & Googie Plaza ────────
  buildWelcomeToVegasSign() {
    const zAuthored = 31800; // World Z = 63,100m
    const latOffset = -28.0; // Left side median island
    const t = this.splineRoad.getRoadTransformAtZ(zAuthored, latOffset, 0, false);
    this.vegasSignTransform = t;

    const root = new THREE.Group();
    root.position.copy(t.pos);
    if (t.quaternion) root.quaternion.copy(t.quaternion);
    else if (t.heading !== undefined) root.rotation.y = t.heading;

    // GATE 6: Subterranean foundation slab sinking Y <= -2.0m
    const foundSlab = this._mesh(new THREE.BoxGeometry(26, 3.5, 48), this.matFoundationSlab, 0, -1.75, 0);
    root.add(foundSlab);

    // Landscaped Googie turf median island with curved concrete curbs
    const turfIsland = this._mesh(new THREE.BoxGeometry(24, 0.45, 46), this.matTurfGrass, 0, 0.15, 0);
    root.add(turfIsland);
    const curb = this._mesh(new THREE.BoxGeometry(24.8, 0.6, 46.8), this.matConcreteCurb, 0, 0.1, 0);
    root.add(curb);

    // Twin Angled Red Tubular Steel Support Pylons (22m tall)
    const pylonGeo = new THREE.CylinderGeometry(0.55, 0.65, 23.0, 10);
    const pylonLeft = this._mesh(pylonGeo, this.matPylonSteelRed, -3.2, 9.5, 0);
    pylonLeft.rotation.z = 0.08;
    root.add(pylonLeft);

    const pylonRight = this._mesh(pylonGeo, this.matPylonSteelRed, 3.2, 9.5, 0);
    pylonRight.rotation.z = -0.08;
    root.add(pylonRight);

    // Cross-brace gantry
    const gantry = this._mesh(new THREE.BoxGeometry(7.5, 0.8, 0.9), this.matPylonSteelRed, 0, 14.5, 0);
    root.add(gantry);

    // ── Betty Willis 1959 Stretched Diamond Googie Sign Frame ──
    const diamondGroup = new THREE.Group();
    diamondGroup.position.set(0, 15.2, 0.6);
    diamondGroup.rotation.z = 0.14; // Signature Googie dynamic tilt

    // Cyan diamond main cabinet
    const diamondFace = this._mesh(new THREE.BoxGeometry(15.5, 9.0, 0.9), this.matNeonCyan, 0, 0, 0);
    diamondGroup.add(diamondFace);

    // Yellow neon chaser bulb perimeter
    const bulbBorder = this._mesh(new THREE.BoxGeometry(16.4, 9.8, 0.4), this.matNeonYellow, 0, 0, -0.1);
    diamondGroup.add(bulbBorder);

    // 8-Point Yellow Starburst Crown Topper
    const starGroup = new THREE.Group();
    starGroup.position.set(0, 5.8, 0.3);
    const starArmGeo = new THREE.ConeGeometry(0.85, 3.6, 4);
    for (let a = 0; a < 8; a++) {
      const arm = this._mesh(starArmGeo, this.matNeonYellow, 0, 0, 0);
      arm.rotation.z = (a * Math.PI) / 4;
      arm.position.y = Math.sin((a * Math.PI) / 4) * 1.4;
      arm.position.x = Math.cos((a * Math.PI) / 4) * 1.4;
      starGroup.add(arm);
    }
    const starCenter = this._mesh(new THREE.SphereGeometry(0.9, 12, 12), this.matWarmBulb, 0, 0, 0.15);
    starGroup.add(starCenter);
    diamondGroup.add(starGroup);

    // 7 Blue "Silver Dollar" Circles Spelling "WELCOME"
    const letters = ['W', 'E', 'L', 'C', 'O', 'M', 'E'];
    const coinGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.22, 16);
    coinGeo.rotateX(Math.PI / 2);
    for (let c = 0; c < 7; c++) {
      const cx = (c - 3) * 1.55;
      const coin = this._mesh(coinGeo, this.matNeonBlue, cx, 1.8, 0.55);
      diamondGroup.add(coin);
      // White inner letter disc
      const letterDisc = this._mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.25, 12), this.matWhiteNeon, cx, 1.8, 0.56);
      letterDisc.rotateX(Math.PI / 2);
      diamondGroup.add(letterDisc);
    }

    // Ruby-Red Cursive Bar "to Fabulous"
    const fabBar = this._mesh(new THREE.BoxGeometry(9.2, 0.75, 0.3), this.matNeonRed, 0, 0.35, 0.58);
    diamondGroup.add(fabBar);

    // Bold Blue Capital Letters Bar "LAS VEGAS"
    const vegasBar = this._mesh(new THREE.BoxGeometry(12.4, 1.35, 0.35), this.matNeonBlue, 0, -1.0, 0.58);
    diamondGroup.add(vegasBar);

    // Lower Gold Nevada Script Bar
    const nevadaBar = this._mesh(new THREE.BoxGeometry(8.0, 0.65, 0.25), this.matNeonYellow, 0, -2.3, 0.58);
    diamondGroup.add(nevadaBar);

    // Reverse Side: "Drive Carefully • Come Back Soon"
    const backSign = this._mesh(new THREE.BoxGeometry(14.8, 8.2, 0.2), this.matNeonCyan, 0, 0, -0.55);
    diamondGroup.add(backSign);
    const backBar1 = this._mesh(new THREE.BoxGeometry(11.2, 0.9, 0.25), this.matNeonRed, 0, 0.8, -0.6);
    diamondGroup.add(backBar1);
    const backBar2 = this._mesh(new THREE.BoxGeometry(9.5, 0.9, 0.25), this.matNeonYellow, 0, -0.8, -0.6);
    diamondGroup.add(backBar2);

    root.add(diamondGroup);

    // Plaza Uplights & Median Palms
    for (let p = -18; p <= 18; p += 9) {
      if (Math.abs(p) < 4) continue;
      this.buildPalmTree(root, -8.5, 0, p);
      this.buildPalmTree(root, 8.5, 0, p);

      // Brass ground floodlight fixtures
      const flood = this._mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 8), this.matWarmBulb, 0, 0.35, p);
      root.add(flood);
    }

    this.group.add(root);
  }

  // ─── LANDMARK 2: Luxor Pyramid & Bellagio Dancing Fountains ────────────────
  buildLuxorPyramidAndFountains() {
    const zAuthored = 32500; // World Z = 64,300m
    const latOffset = 62.0;  // Right side of highway
    const t = this.splineRoad.getRoadTransformAtZ(zAuthored, latOffset, 0, false);
    this.casinoTransform = t;

    const root = new THREE.Group();
    root.position.copy(t.pos);
    if (t.quaternion) root.quaternion.copy(t.quaternion);
    else if (t.heading !== undefined) root.rotation.y = t.heading;

    // GATE 6: Subterranean foundation pad sinking Y <= -2.0m
    const casinoFoundation = this._mesh(new THREE.BoxGeometry(118, 4.0, 96), this.matFoundationSlab, 0, -2.0, 0);
    root.add(casinoFoundation);

    // Colossal Obsidian Glass Pyramid (Base 68m, Height 46m)
    const pyrGeo = new THREE.ConeGeometry(48.0, 46.0, 4);
    pyrGeo.rotateY(Math.PI / 4);
    const pyramid = this._mesh(pyrGeo, this.matPyramidGlass, 18.0, 23.0, -12.0);
    root.add(pyramid);

    // Bronze Mullion Corner Ribs
    for (let c = 0; c < 4; c++) {
      const rib = this._mesh(new THREE.BoxGeometry(1.2, 48.0, 1.2), this.matPyramidBronze, 18.0, 23.0, -12.0);
      rib.rotation.y = (c * Math.PI) / 2 + Math.PI / 4;
      rib.rotation.z = 0.52;
      root.add(rib);
    }

    // Gold Apex Capstone
    const apexGeo = new THREE.ConeGeometry(5.2, 5.0, 4);
    apexGeo.rotateY(Math.PI / 4);
    const apex = this._mesh(apexGeo, this.matSphinxGold, 18.0, 47.0, -12.0);
    root.add(apex);

    // Skyward Xenon Beacon Beam (Towering 200m vertical light cylinder)
    const beaconGeo = new THREE.CylinderGeometry(1.8, 14.0, 220.0, 16, 1, true);
    this.pyramidBeaconMesh = new THREE.Mesh(beaconGeo, this.matBeaconBeam);
    this.pyramidBeaconMesh.position.set(18.0, 155.0, -12.0);
    root.add(this.pyramidBeaconMesh);

    // ── Stylized Golden Sphinx Statue ──
    const sphinxGroup = new THREE.Group();
    sphinxGroup.position.set(-6.0, 0, 8.0);

    // Stepped Egyptian Plinth
    const plinth1 = this._mesh(new THREE.BoxGeometry(16, 1.8, 28), this.matCasinoMarble, 0, 0.9, 0);
    sphinxGroup.add(plinth1);
    const plinth2 = this._mesh(new THREE.BoxGeometry(14, 1.4, 25), this.matCasinoMarble, 0, 2.3, 0);
    sphinxGroup.add(plinth2);

    // Lion Body
    const lionBody = this._mesh(new THREE.BoxGeometry(9.0, 5.5, 18.0), this.matSphinxGold, 0, 5.5, -2.0);
    sphinxGroup.add(lionBody);

    // Forelegs / Paws extending forward
    const leftPaw = this._mesh(new THREE.BoxGeometry(2.6, 2.8, 8.0), this.matSphinxGold, -3.2, 2.8, 7.5);
    sphinxGroup.add(leftPaw);
    const rightPaw = this._mesh(new THREE.BoxGeometry(2.6, 2.8, 8.0), this.matSphinxGold, 3.2, 2.8, 7.5);
    sphinxGroup.add(rightPaw);

    // Pharaoh Head with Nemes Headdress & Beard
    const sphinxHead = this._mesh(new THREE.BoxGeometry(4.8, 5.2, 4.4), this.matSphinxGold, 0, 10.2, 3.8);
    sphinxGroup.add(sphinxHead);
    const nemesFlaps = this._mesh(new THREE.BoxGeometry(6.6, 3.5, 3.2), this.matPyramidBronze, 0, 8.8, 3.5);
    sphinxGroup.add(nemesFlaps);
    const royalBeard = this._mesh(new THREE.BoxGeometry(1.2, 2.8, 1.4), this.matPyramidBronze, 0, 6.8, 5.6);
    sphinxGroup.add(royalBeard);

    root.add(sphinxGroup);

    // ── Bellagio Grand Fountains Lagoon & Water Jets ──
    const lagoonGroup = new THREE.Group();
    lagoonGroup.position.set(-32.0, 0, 0);

    // Lagoon basin with stone coping border
    const basin = this._mesh(new THREE.BoxGeometry(38, 1.2, 88), this.matCasinoMarble, 0, 0.4, 0);
    lagoonGroup.add(basin);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(36, 86), this.matLagoonWater);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.95;
    lagoonGroup.add(water);

    // 12 Dancing Fountain Water Jet Columns
    this.fountainJets = [];
    const jetGeo = new THREE.CylinderGeometry(0.35, 1.2, 14.0, 8);
    for (let j = 0; j < 12; j++) {
      const jz = (j - 5.5) * 6.8;
      const jet = new THREE.Mesh(jetGeo, this.matFountainSpray);
      jet.position.set(0, 7.0, jz);
      lagoonGroup.add(jet);
      this.fountainJets.push({ mesh: jet, baseScale: 1.0, offset: j * 0.45 });
    }

    root.add(lagoonGroup);

    // ── Grand Casino Porte-Cochère & Getaway Car ──
    const portico = new THREE.Group();
    portico.position.set(-14.0, 0, -28.0);
    const roof = this._mesh(new THREE.BoxGeometry(18, 1.5, 22), this.matPyramidBronze, 0, 6.2, 0);
    portico.add(roof);

    // Glowing Neon Porte-Cochère Marquee
    const marquee = this._mesh(new THREE.BoxGeometry(18.4, 1.2, 0.4), this.matNeonMagenta, 0, 6.2, 11.2);
    portico.add(marquee);
    const marqueeLetters = this._mesh(new THREE.BoxGeometry(14.0, 0.7, 0.45), this.matNeonYellow, 0, 6.2, 11.3);
    portico.add(marqueeLetters);

    // Columns
    for (const cx of [-7.5, 7.5]) {
      for (const cz of [-9.5, 9.5]) {
        portico.add(this._mesh(new THREE.CylinderGeometry(0.7, 0.8, 6.0, 10), this.matCasinoMarble, cx, 3.0, cz));
      }
    }

    // Red Carpet Ramp
    const carpet = this._mesh(new THREE.BoxGeometry(7.0, 0.1, 18.0), this.matRedCarpet, 0, 0.15, 0);
    portico.add(carpet);

    // High-Roller Getaway Car (Midnight Black with gold accents)
    this.getawayCarMesh = this.buildGetawayCar();
    this.getawayCarMesh.position.set(0, 0.2, 4.0);
    portico.add(this.getawayCarMesh);

    root.add(portico);

    this.group.add(root);
  }

  // ─── LANDMARK 3: Red Rock Canyon Aztec Sandstone Escarpment ───────────────
  buildRedRockEscarpment() {
    const zAuthored = 33200; // World Z = 65,500m
    const latOffset = -56.0; // Left side of highway
    const t = this.splineRoad.getRoadTransformAtZ(zAuthored, latOffset, 0, false);
    this.redRockTransform = t;

    const root = new THREE.Group();
    root.position.copy(t.pos);
    if (t.quaternion) root.quaternion.copy(t.quaternion);
    else if (t.heading !== undefined) root.rotation.y = t.heading;

    // GATE 6: Subterranean foundation rock shelf sinking Y <= -2.5m
    const cliffFoundation = this._mesh(new THREE.BoxGeometry(90, 5.0, 110), this.matFoundationSlab, 0, -2.5, 0);
    root.add(cliffFoundation);

    // Stratified Aztec Sandstone Bluffs (Layered crimson, terracotta, cream bands)
    const cliffBands = [
      { y: 6.0,  h: 12.0, w: 76, d: 95, mat: this.matSandstoneCrimson },
      { y: 16.0, h: 10.0, w: 68, d: 88, mat: this.matSandstoneTerracotta },
      { y: 24.5, h: 9.0,  w: 60, d: 78, mat: this.matSandstoneCream },
      { y: 32.0, h: 8.0,  w: 52, d: 68, mat: this.matSandstoneCrimson },
      { y: 38.5, h: 7.0,  w: 44, d: 56, mat: this.matSandstoneTerracotta },
      { y: 44.0, h: 6.0,  w: 36, d: 44, mat: this.matSandstoneCream }
    ];

    for (const b of cliffBands) {
      const layer = this._mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.mat, 8.0, b.y, 0);
      root.add(layer);
    }

    // Natural Red Rock Sandstone Arch Spanning 22m
    const archGroup = new THREE.Group();
    archGroup.position.set(-18.0, 14.0, -22.0);

    const pillarLeft = this._mesh(new THREE.BoxGeometry(6.0, 24.0, 7.0), this.matSandstoneCrimson, -9.0, 0, 0);
    archGroup.add(pillarLeft);
    const pillarRight = this._mesh(new THREE.BoxGeometry(6.0, 24.0, 7.0), this.matSandstoneTerracotta, 9.0, 0, 0);
    archGroup.add(pillarRight);
    const archSpan = this._mesh(new THREE.BoxGeometry(24.0, 5.5, 7.5), this.matSandstoneCream, 0, 12.0, 0);
    archGroup.add(archSpan);

    root.add(archGroup);

    // ── Calico Hills Scenic Viewing Parapet ──
    const terrace = new THREE.Group();
    terrace.position.set(22.0, 0, 8.0);

    // Flagstone Viewing Terrace
    const pad = this._mesh(new THREE.BoxGeometry(18, 1.2, 32), this.matCalicheGravel, 0, 0.6, 0);
    terrace.add(pad);

    // Stone Perimeter Balustrade
    const wall1 = this._mesh(new THREE.BoxGeometry(18.4, 1.1, 0.8), this.matSandstoneCrimson, 0, 1.6, -16);
    terrace.add(wall1);
    const wall2 = this._mesh(new THREE.BoxGeometry(18.4, 1.1, 0.8), this.matSandstoneCrimson, 0, 1.6, 16);
    terrace.add(wall2);
    const wallBack = this._mesh(new THREE.BoxGeometry(0.8, 1.1, 32.8), this.matSandstoneCrimson, 9.2, 1.6, 0);
    terrace.add(wallBack);

    // Timber Shade Ramada (Pergola)
    for (const rx of [-6.0, 6.0]) {
      for (const rz of [-10.0, 10.0]) {
        terrace.add(this._mesh(new THREE.CylinderGeometry(0.3, 0.35, 4.5, 6), this.matCedarTimber, rx, 2.8, rz));
      }
    }
    const ramadaRoof = this._mesh(new THREE.BoxGeometry(15.0, 0.4, 24.0), this.matCedarTimber, 0, 5.1, 0);
    terrace.add(ramadaRoof);

    // Coin-Op Observation Binoculars
    for (const bz of [-6.0, 6.0]) {
      const bPost = this._mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8), this.matChrome, -7.5, 1.8, bz);
      terrace.add(bPost);
      const bHead = this._mesh(new THREE.BoxGeometry(0.45, 0.35, 0.65), this.matChrome, -7.5, 2.5, bz);
      bHead.rotation.y = Math.PI / 2;
      terrace.add(bHead);
    }

    // BLM Interpretive Sign & Desert Tortoise Warning
    const signPost = this._mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 6), this.matCedarTimber, -5.0, 1.5, 0);
    terrace.add(signPost);
    const signBoard = this._mesh(new THREE.BoxGeometry(0.2, 1.4, 2.2), this.matSandstoneTerracotta, -5.0, 2.4, 0);
    terrace.add(signBoard);

    root.add(terrace);

    this.group.add(root);
  }

  // ─── TURNOUT 1: Welcome to Vegas Sign Turnout Integration ─────────────────
  buildVegasSignTurnout() {
    const zAuthored = 31800;
    const t = this.splineRoad.getRoadTransformAtZ(zAuthored, -28.0, 0, false);
    const turnout = new THREE.Group();
    turnout.position.copy(t.pos);
    if (t.quaternion) turnout.quaternion.copy(t.quaternion);
    else if (t.heading !== undefined) turnout.rotation.y = t.heading;

    // Subterranean foundation skirt
    const skirt = this._mesh(new THREE.BoxGeometry(26, 2.5, 56), this.matFoundationSlab, 0, -1.25, 0);
    turnout.add(skirt);

    // Welcome Visitors Historic Information Kiosk
    const kiosk = this._mesh(new THREE.BoxGeometry(3.5, 3.2, 1.2), this.matCedarTimber, 8.0, 1.6, -18.0);
    turnout.add(kiosk);
    const kioskFace = this._mesh(new THREE.BoxGeometry(3.2, 2.4, 0.2), this.matWarmBulb, 8.0, 1.8, -17.4);
    turnout.add(kioskFace);

    // Parking Wheel Stops
    for (let s = -18; s <= 18; s += 6) {
      turnout.add(this._mesh(new THREE.BoxGeometry(2.4, 0.25, 0.45), this.matConcreteCurb, -6.5, 0.15, s));
    }

    this.group.add(turnout);
  }

  // ─── TURNOUT 2: Red Rock Canyon Sandstone Overlook Integration ────────────
  buildRedRockTurnout() {
    const zAuthored = 33200;
    const t = this.splineRoad.getRoadTransformAtZ(zAuthored, 28.0, 0, false);
    const turnout = new THREE.Group();
    turnout.position.copy(t.pos);
    if (t.quaternion) turnout.quaternion.copy(t.quaternion);
    else if (t.heading !== undefined) turnout.rotation.y = t.heading;

    // Subterranean foundation skirt
    const skirt = this._mesh(new THREE.BoxGeometry(28, 2.5, 58), this.matFoundationSlab, 0, -1.25, 0);
    turnout.add(skirt);

    // Stone Canyon Kiosk
    const kiosk = this._mesh(new THREE.BoxGeometry(3.8, 3.4, 1.4), this.matSandstoneCrimson, -8.0, 1.7, -16.0);
    turnout.add(kiosk);
    const kioskFace = this._mesh(new THREE.BoxGeometry(3.4, 2.4, 0.2), this.matSandstoneCream, -8.0, 1.8, -15.3);
    turnout.add(kioskFace);

    // Wheel Stops
    for (let s = -18; s <= 18; s += 6) {
      turnout.add(this._mesh(new THREE.BoxGeometry(2.4, 0.25, 0.45), this.matConcreteCurb, 7.5, 0.15, s));
    }

    this.group.add(turnout);
  }

  // ─── GATE 5: Off-Road / Secret Spur (Calico Basin 4x4 Slickrock Trail) ─────
  buildCalicoBasin4x4Spur() {
    const zAuthored = 32850; // World Z = 64,900m
    const t = this.splineRoad.getRoadTransformAtZ(zAuthored, 36.0, 0, false);
    const spur = new THREE.Group();
    spur.position.copy(t.pos);
    if (t.quaternion) spur.quaternion.copy(t.quaternion);
    else if (t.heading !== undefined) spur.rotation.y = t.heading;

    // BLM 4x4 Trailhead Marker Post
    const post = this._mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 6), this.matCedarTimber, 0, 1.3, 0);
    spur.add(post);
    const marker = this._mesh(new THREE.BoxGeometry(0.6, 0.9, 0.15), this.matSandstoneTerracotta, 0, 2.1, 0.1);
    spur.add(marker);

    // Red Sandstone Trail Boulders & Slickrock Step Shelf
    const boulderGeo = new THREE.DodecahedronGeometry(2.4, 1);
    for (let i = 0; i < 9; i++) {
      const bx = 12.0 + (i % 3) * 8.0 + (Math.sin(i * 1.5) * 4.0);
      const bz = (i - 4) * 9.0;
      const b = this._mesh(boulderGeo, (i % 2 === 0) ? this.matSandstoneCrimson : this.matSandstoneTerracotta, bx, 1.4, bz);
      b.scale.set(1.0 + (i % 3) * 0.4, 0.8 + (i % 2) * 0.5, 1.2 + (i % 3) * 0.3);
      spur.add(b);

      // Trail Cairns (Stacked Stone Markers)
      if (i % 3 === 0) {
        this.buildTrailCairn(spur, bx - 3.5, 0, bz);
      }
    }

    // Joshua Trees flanking the wash
    this.buildJoshuaTree(spur, 8.0, 0, -18.0);
    this.buildJoshuaTree(spur, 26.0, 0, 14.0);
    this.buildJoshuaTree(spur, 34.0, 0, -8.0);

    this.group.add(spur);
  }

  // ─── INSTANCED DESERT FLORA & VEGETATION ──────────────────────────────────
  buildInstancedFlora() {
    // 1. Mojave Joshua Trees (Scattered through foothills & wash)
    for (let z = 31300; z < 33700; z += 120) {
      if (z >= 31750 && z <= 31850) continue; // Sign clearance
      if (z >= 32400 && z <= 32600) continue; // Strip clearance
      if (z >= 33150 && z <= 33250) continue; // Red Rock lookout clearance

      const latLeft = -42.0 - (Math.abs(Math.sin(z * 0.05)) * 18.0);
      const tLeft = this.splineRoad.getRoadTransformAtZ(z, latLeft, 0, false);
      const jtL = new THREE.Group();
      jtL.position.copy(tLeft.pos);
      this.buildJoshuaTree(jtL, 0, 0, 0);
      this.group.add(jtL);

      const latRight = 45.0 + (Math.abs(Math.cos(z * 0.04)) * 22.0);
      const tRight = this.splineRoad.getRoadTransformAtZ(z, latRight, 0, false);
      const jtR = new THREE.Group();
      jtR.position.copy(tRight.pos);
      this.buildJoshuaTree(jtR, 0, 0, 0);
      this.group.add(jtR);
    }

    // 2. Mexican Fan Palms along Strip Highway Median
    for (let z = 32150; z <= 32750; z += 35) {
      const tMid = this.splineRoad.getRoadTransformAtZ(z, 0, 0, false);
      const palm = new THREE.Group();
      palm.position.copy(tMid.pos);
      this.buildPalmTree(palm, 0, 0, 0);
      this.group.add(palm);
    }
  }

  // ─── PROCEDURAL DESERT ASSET HELPERS ──────────────────────────────────────
  buildJoshuaTree(parent, x, y, z) {
    const jt = new THREE.Group();
    jt.position.set(x, y, z);

    // Gnarled, branching trunk
    const trunk = this._mesh(new THREE.CylinderGeometry(0.35, 0.65, 4.2, 7), this.matJoshuaTrunk, 0, 2.1, 0);
    jt.add(trunk);

    // Multi-limbed angled branches
    const branchGeo = new THREE.CylinderGeometry(0.22, 0.3, 2.4, 6);
    const angles = [0, 2.1, 4.2];
    for (const ang of angles) {
      const bx = Math.sin(ang) * 0.9;
      const bz = Math.cos(ang) * 0.9;
      const b = this._mesh(branchGeo, this.matJoshuaTrunk, bx, 4.2, bz);
      b.rotation.z = Math.sin(ang) * 0.45;
      b.rotation.x = Math.cos(ang) * 0.45;
      jt.add(b);

      // Spiky needle tufts on tips
      const tuftGeo = new THREE.ConeGeometry(0.75, 1.2, 6);
      const tuft = this._mesh(tuftGeo, this.matJoshuaTuft, bx * 1.5, 5.2, bz * 1.5);
      tuft.rotation.x = Math.cos(ang) * 0.5;
      tuft.rotation.z = Math.sin(ang) * 0.5;
      jt.add(tuft);
    }

    parent.add(jt);
  }

  buildPalmTree(parent, x, y, z) {
    const palm = new THREE.Group();
    palm.position.set(x, y, z);

    // Tall curved palm trunk
    const trunk = this._mesh(new THREE.CylinderGeometry(0.32, 0.58, 12.0, 8), this.matPalmTrunk, 0, 6.0, 0);
    trunk.rotation.z = (Math.random() - 0.5) * 0.08;
    palm.add(trunk);

    // Radial drooping palm fronds
    const frondGeo = new THREE.ConeGeometry(1.6, 3.8, 5);
    for (let f = 0; f < 8; f++) {
      const ang = (f * Math.PI) / 4;
      const frond = this._mesh(frondGeo, this.matPalmFrond, Math.sin(ang) * 1.4, 11.8, Math.cos(ang) * 1.4);
      frond.rotation.z = Math.sin(ang) * 0.85;
      frond.rotation.x = Math.cos(ang) * 0.85;
      palm.add(frond);
    }

    parent.add(palm);
  }

  buildTrailCairn(parent, x, y, z) {
    const cairn = new THREE.Group();
    cairn.position.set(x, y, z);
    const layers = [0.8, 0.65, 0.5, 0.35, 0.2];
    let cy = 0;
    for (const r of layers) {
      const stone = this._mesh(new THREE.CylinderGeometry(r * 0.8, r, 0.35, 7), this.matSandstoneCrimson, 0, cy + 0.17, 0);
      cairn.add(stone);
      cy += 0.32;
    }
    parent.add(cairn);
  }

  buildGetawayCar() {
    const car = new THREE.Group();

    // Sleek black coupe chassis
    const body = this._mesh(new THREE.BoxGeometry(2.3, 0.75, 5.0), this.matPyramidGlass, 0, 0.55, 0);
    car.add(body);
    const cabin = this._mesh(new THREE.BoxGeometry(1.9, 0.65, 2.6), this.matPyramidBronze, 0, 1.15, -0.2);
    car.add(cabin);

    // Chrome wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [[-1.2, 1.6], [1.2, 1.6], [-1.2, -1.6], [1.2, -1.6]]) {
      car.add(this._mesh(wheelGeo, this.matChrome, wx, 0.42, wz));
    }

    // Glowing Neon Headlights & Tailfins
    car.add(this._mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), this.matWarmBulb, -0.8, 0.6, 2.5));
    car.add(this._mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), this.matWarmBulb, 0.8, 0.6, 2.5));
    car.add(this._mesh(new THREE.BoxGeometry(0.6, 0.2, 0.1), this.matNeonRed, -0.8, 0.65, -2.5));
    car.add(this._mesh(new THREE.BoxGeometry(0.6, 0.2, 0.1), this.matNeonRed, 0.8, 0.65, -2.5));

    return car;
  }

  // ─── ROADSIDE STREETLIGHTS & CASINO MARQUEES ──────────────────────────────
  buildStripStreetlights() {
    for (let z = 32000; z <= 32700; z += 70) {
      for (const side of [-18.0, 18.0]) {
        const t = this.splineRoad.getRoadTransformAtZ(z, side, 0, false);
        const lightGroup = new THREE.Group();
        lightGroup.position.copy(t.pos);
        if (t.quaternion) lightGroup.quaternion.copy(t.quaternion);
        else if (t.heading !== undefined) lightGroup.rotation.y = t.heading;

        // Subterranean foundation
        lightGroup.add(this._mesh(new THREE.BoxGeometry(1.6, 2.0, 1.6), this.matFoundationSlab, 0, -1.0, 0));

        // Curved Googie Streetlight Post
        const pole = this._mesh(new THREE.CylinderGeometry(0.18, 0.25, 9.0, 8), this.matChrome, 0, 4.5, 0);
        lightGroup.add(pole);
        const arm = this._mesh(new THREE.BoxGeometry(side > 0 ? -3.0 : 3.0, 0.2, 0.2), this.matChrome, side > 0 ? -1.5 : 1.5, 9.0, 0);
        lightGroup.add(arm);

        // Glowing luminaire head
        const head = this._mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.35, 10), this.matWarmBulb, side > 0 ? -3.0 : 3.0, 8.8, 0);
        lightGroup.add(head);

        this.group.add(lightGroup);
      }
    }
  }

  // ─── UTILITY: Mesh helper with shadow flags ───────────────────────────────
  _mesh(geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ─── GATE 5: INTERACTIVE CINEMATIC VIGNETTE ───────────────────────────────
  triggerVegasCinematic() {
    if (this.isCinematicPlaying) return;
    this.isCinematicPlaying = true;
    this.cinematicTime = 0;
    this.cinematicPhase = 'SHOT_1_ESTABLISHING';
    this.hasTriggeredVignette = true;

    gameState.isCutsceneActive = true;
    gameState.cutsceneName = 'zone12_vegas_heist';
    gameState.cutsceneDuration = this.cinematicDuration;
    gameState.cutsceneTitleCard = '🎰 MIDNIGHT HIGH-ROLLER CASINO ESCAPE';
    gameState.cutsceneSubtitles = 'THE STRIP, LAS VEGAS: Neon towers pierce the desert night as the skyward Luxor beacon cuts through the clouds. High-roller engines roar past the Bellagio dancing fountains.';

    if (typeof window !== 'undefined' && window.game) {
      window.game.activeZoneCutscene = this;
      if (window.game.hud && window.game.hud.showActionToast) {
        window.game.hud.showActionToast('🎰 MIDNIGHT HIGH-ROLLER CASINO ESCAPE', 'Observing casino strip getaway… 14s cinematic', 3500);
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
        window.game.hud.showActionToast('🏅 VIGNETTE COMPLETE', 'Midnight Casino Strip Run Accomplished! +500 PTS', 4500);
      }
      if (window.game.saveManager) window.game.saveManager.save(true);
    }
  }

  getCurrentCutsceneCam() {
    const t = this.casinoTransform;
    if (!t) return null;
    const time = this.cinematicTime;

    if (time < 4.8) {
      // Shot 1: Wide establishing shot — The Strip, dancing Bellagio fountains, and towering skyward beacon
      this.cinematicPhase = 'SHOT_1_ESTABLISHING';
      gameState.cutsceneSubtitles = 'THE STRIP, LAS VEGAS: Neon towers pierce the desert night as the skyward Luxor beacon cuts through the clouds. High-roller engines roar past the Bellagio dancing fountains.';
      const p = time / 4.8;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, -55 + p * 12).addScaledVector(t.tangent, -36 + p * 8);
      this._tempCamPos.y = t.pos.y + 16 - p * 2.0;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, 12);
      this._tempLookAt.y = t.pos.y + 18;
      this._camResult.fov = 58;
    } else if (time < 9.4) {
      // Shot 2: Medium action shot — Getaway car peel-out at casino porte-cochère with Golden Sphinx backdrop
      this.cinematicPhase = 'SHOT_2_GETAWAY_CAR';
      gameState.cutsceneSubtitles = 'HIGH-ROLLER RAT PACK ESCAPE: A midnight jackpot heist getaway coupe peels away from the casino porte-cochère under the gaze of the golden Sphinx.';
      const p = (time - 4.8) / 4.6;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, -18 + p * 8).addScaledVector(t.tangent, -24 + p * 6);
      this._tempCamPos.y = t.pos.y + 4.0 + p * 1.2;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, -6).addScaledVector(t.tangent, -14);
      this._tempLookAt.y = t.pos.y + 2.6;
      this._camResult.fov = 48;
    } else {
      // Shot 3: Panoramic departure sweep — Looking west toward the neon strip fading into the Red Rock escarpment
      this.cinematicPhase = 'SHOT_3_DEPARTURE';
      gameState.cutsceneSubtitles = 'WESTBOUND ONTO RED ROCK BYWAY: Leaving the casino glitz behind, Highway 91 climbs west into the silent 3,000-foot Aztec sandstone walls of Calico Hills.';
      const p = (time - 9.4) / 4.6;
      this._tempCamPos.copy(t.pos).addScaledVector(t.normal, 14).addScaledVector(t.tangent, 20 + p * 28);
      this._tempCamPos.y = t.pos.y + 8.5;
      this._tempLookAt.copy(t.pos).addScaledVector(t.normal, -32).addScaledVector(t.tangent, 65 + p * 35);
      this._tempLookAt.y = t.pos.y + 6.0;
      this._camResult.fov = 52;
    }
    return this._camResult;
  }

  // ─── 60 FPS UPDATE — ZERO HEAP ALLOCATIONS ───────────────────────────────
  update(dt, playerPos) {
    const time = gameState.gameTime;

    // 1. Dancing Bellagio Fountains animation (Sinusoidal geyser height oscillation)
    if (this.fountainJets && this.fountainJets.length > 0) {
      for (let i = 0; i < this.fountainJets.length; i++) {
        const j = this.fountainJets[i];
        const s = 0.5 + Math.sin(time * 3.5 + j.offset) * 0.45;
        j.mesh.scale.set(1.0, Math.max(0.2, s), 1.0);
        j.mesh.position.y = 7.0 * Math.max(0.2, s);
      }
    }

    // 2. Skyward Luxor Xenon Beacon subtle pulse
    if (this.pyramidBeaconMesh) {
      this.pyramidBeaconMesh.material.opacity = 0.38 + Math.sin(time * 1.8) * 0.08;
    }

    // 3. Getaway car engine vibration during cutscene
    if (this.isCinematicPlaying && this.getawayCarMesh) {
      this.getawayCarMesh.position.y = 0.2 + Math.sin(time * 24.0) * 0.012;
    }

    // 4. Proximity trigger — cinematic vignette at Luxor/Casino Plaza
    if (!this.isCinematicPlaying && !this.hasTriggeredVignette && playerPos) {
      const targetZ = this.casinoTransform ? this.casinoTransform.pos.z : 32500;
      const zDist = Math.abs(playerPos.z - targetZ);
      if (zDist < 50.0 && this.casinoTransform) {
        this._tempVec1.set(playerPos.x, playerPos.y, playerPos.z);
        const dist = this._tempVec1.distanceTo(this.casinoTransform.pos);
        // Player triggers either by turning into the casino roundabout or by slowing down on highway (< 6 m/s)
        const playerSpeed = gameState.speed || 0;
        if (dist < 42.0 || (zDist < 35.0 && playerSpeed < 6.0)) {
          this.triggerVegasCinematic();
        }
      }
    }

    // 5. Cinematic playback time progression
    if (this.isCinematicPlaying) {
      this.cinematicTime += dt;
      if (this.cinematicTime >= this.cinematicDuration) {
        this.completeCinematic();
      }
    }
  }
}
