import * as THREE from 'three';
import { gameState } from '../state.js';
import { ZONES, PHYSICS } from '../constants.js';
import { AUTO_REPAIR_SHOPS } from './SplineRoad.js';

/**
 * TrafficManager: Highway Traffic & Law Enforcement Systems
 * - Civilian NPC Vehicle Pool & Spline Stream Navigation (Sedans, Pickups, SUVs, Wagons, Box Trucks)
 * - Near-Miss & Slipstream Drafting Proximity System
 * - Highway Patrol Speed Traps with Roadside Radar Officers & Digital Speed Boards
 * - Radar Detector HUD Alerts (Ka-Band)
 * - Police Pursuit Cruiser AI & Heat System (1–3 Stars)
 * - Roadside Mechanic Service Bay Triggers & Full Restoration
 */
export class TrafficManager {
  constructor(renderer, splineRoad, physics) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.physics = physics;
    this.group = new THREE.Group();

    // Material definitions for traffic vehicles
    this.setupMaterials();

    // Civilian traffic pool
    this.vehicles = [];
    this.maxVehicles = 16;
    this.spawnWindowAhead = 420;
    this.spawnWindowBehind = 90;

    // Police Speed Trap Posts
    this.radarPosts = [];

    // Mechanic Shop Service Bay Locations
    this.serviceBays = [];
    this.serviceTimer = 0;
    this.servicedThisVisit = false;

    // Near miss tracking
    this.nearMissCooldowns = new Map();

    // Fellow Player Cars starting on grid
    this.fellowPlayers = [];

    this.initMechanicBays();
    this.initRadarPosts();
    this.initPolicePursuitUnit();
    this.initTrafficPool();
    this.initFellowPlayers();
  }

  setupMaterials() {
    this.matChrome = this.renderer.createToonMaterial({ color: 0xe2e8f0, gradientBands: 3 });
    this.matDarkTrim = this.renderer.createToonMaterial({ color: 0x1e293b, gradientBands: 2 });
    this.matGlass = this.renderer.createToonMaterial({ color: 0x0f172a, opacity: 0.85, transparent: true });
    this.matTire = this.renderer.createToonMaterial({ color: 0x18181b, gradientBands: 2 });
    this.matRim = this.renderer.createToonMaterial({ color: 0x94a3b8, gradientBands: 2 });

    this.matHeadlight = new THREE.MeshBasicMaterial({ color: 0xfffaed });
    this.matTaillight = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
    this.matBrakelight = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matAmberReflector = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matAlloy = this.renderer.createToonMaterial({ color: 0xc8d1dc, gradientBands: 3 });
    this.matBrakeDisc = this.renderer.createToonMaterial({ color: 0x64748b, gradientBands: 2 });
    this.matCalipers = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    this.matCarbonFiber = this.renderer.createToonMaterial({ color: 0x090d16, gradientBands: 2 });

    // Police Materials
    this.matPoliceBody = this.renderer.createToonMaterial({ color: 0x0f172a, gradientBands: 3 });
    this.matPoliceDoorWhite = this.renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 2 });
    this.matPoliceGoldStar = this.renderer.createToonMaterial({ color: 0xfacc15, gradientBands: 2 });
    this.matLightbarBlue = new THREE.MeshBasicMaterial({ color: 0x0088ff });
    this.matLightbarRed = new THREE.MeshBasicMaterial({ color: 0xff1133 });
    this.matStrobeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.matLightbarOff = this.renderer.createToonMaterial({ color: 0x1e293b, gradientBands: 2 });
    this.matOfficerUniform = this.renderer.createToonMaterial({ color: 0x334155, gradientBands: 2 });
    this.matOfficerSkin = this.renderer.createToonMaterial({ color: 0xd4a373, gradientBands: 2 });

    // Auto Mechanic Shop Materials
    this.matShopWall = this.renderer.createToonMaterial({ color: 0xd97706, gradientBands: 3 });
    this.matShopBrick = this.renderer.createToonMaterial({ color: 0x9a3412, gradientBands: 3 });
    this.matShopTinRoof = this.renderer.createToonMaterial({ color: 0x64748b, gradientBands: 2 });
    this.matShopFloor = this.renderer.createToonMaterial({ color: 0x27272a, gradientBands: 2 });
    this.matCautionYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.matCautionBlack = new THREE.MeshBasicMaterial({ color: 0x18181b });
    this.matNeonCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.matNeonGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    this.matNeonRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matNeonOrange = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    this.matToolChestRed = this.renderer.createToonMaterial({ color: 0xdc2626, gradientBands: 3 });
    this.matToolChestBlue = this.renderer.createToonMaterial({ color: 0x2563eb, gradientBands: 3 });
    this.matOilDrumBlue = this.renderer.createToonMaterial({ color: 0x1e40af, gradientBands: 2 });
    this.matOilDrumBlack = this.renderer.createToonMaterial({ color: 0x111827, gradientBands: 2 });
    this.matGasTankGreen = this.renderer.createToonMaterial({ color: 0x15803d, gradientBands: 2 });
    this.matWoodPallet = this.renderer.createToonMaterial({ color: 0xb45309, gradientBands: 2 });
    this.matLiftPost = this.renderer.createToonMaterial({ color: 0xeab308, gradientBands: 3 });

    // Regional Color Palettes
    this.civilianColors = [
      0x3b82f6, // Royal Blue
      0xef4444, // Sunset Red
      0x10b981, // Emerald Green
      0xf59e0b, // Amber Gold
      0x6366f1, // Indigo
      0x8b5cf6, // Purple
      0xec4899, // Magenta
      0x64748b, // Slate Gray
      0xd97706, // Desert Ochre
      0x059669, // Forest Pine
      0xf8fafc, // Pearl White
      0x1e293b  // Midnight Black
    ];
  }

  initMechanicBays() {
    this.serviceBays = AUTO_REPAIR_SHOPS;
    this.serviceBayMeshes = [];

    // Helper: Procedural Canvas Texture for Giant Roadside "AUTO SHOP" Pylon Billboard
    const createPylonSignTexture = (bay) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Deep dark industrial slate background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 1024, 512);

      // Multi-layer glowing neon border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 14;
      ctx.strokeRect(12, 12, 1000, 488);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(26, 26, 972, 460);

      // Top Header Ribbon: "★ 24HR SPEED & REPAIR SERVICE ★"
      ctx.fillStyle = '#facc15';
      ctx.font = '900 34px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.fillText('★ 24HR PITSTOP & REPAIR SERVICE ★', 512, 70);

      // Main Giant Glowing Headline: "AUTO SHOP"
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 26;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 102px "Impact", "Arial Black", sans-serif';
      ctx.fillText('AUTO SHOP', 512, 178);

      // Shop Name & Subtitle
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 36px "Segoe UI", Arial, sans-serif';
      const shopName = bay.name || 'Highway Auto Care';
      ctx.fillText(shopName.toUpperCase(), 512, 240);

      // Service Tags Badge Bar
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(60, 275, 904, 62, 14);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 28px "Segoe UI", Arial, sans-serif';
      ctx.fillText('CHASSIS REPAIR • NITRO REFILL • ENGINE TUNE • TIRES', 512, 317);

      // Bottom Glowing Call to Action: "➔ DRIVE IN FOR FREE SERVICE ➔"
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#22c55e';
      ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
      ctx.fillText('➔ DRIVE IN FOR FREE SERVICE ➔', 512, 412);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText('STOP VEHICLE ON YELLOW HYDRAULIC LIFT PAD TO REPAIR', 512, 465);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    // Helper: Procedural Canvas Texture for Main Building Rooftop Marquee Sign
    const createMarqueeSignTexture = (bay) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1024, 256);

      // Glowing border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 1004, 236);

      // Center Headline: "★ AUTO SHOP ★"
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 86px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ AUTO SHOP ★', 512, 105);

      // Subtitle
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 36px "Segoe UI", Arial, sans-serif';
      ctx.fillText('24/7 COMPLETE AUTO REPAIR • FULL SERVICING', 512, 175);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
      ctx.fillText('FREE CHASSIS OVERHAUL & TUNE-UP PITSTOP', 512, 220);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    // Helper: Procedural Canvas Texture for Advance Highway Roadside Approach Signpost (~90m before shop)
    const createAdvanceSignTexture = (bay) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Highway green background
      ctx.fillStyle = '#065f46';
      ctx.fillRect(0, 0, 1024, 512);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 16;
      ctx.strokeRect(20, 20, 984, 472);

      ctx.fillStyle = '#facc15';
      ctx.font = '900 80px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔧 AUTO SHOP ➔', 512, 136);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 62px "Segoe UI", Arial, sans-serif';
      ctx.fillText('NEXT RIGHT', 512, 245);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '800 44px "Segoe UI", Arial, sans-serif';
      ctx.fillText('FREE PITSTOP REPAIRS', 512, 345);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 36px "Segoe UI", Arial, sans-serif';
      ctx.fillText('CHASSIS • ENGINE • NITRO', 512, 432);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    // Helper: Ground Painted Stencil Decal Texture ("AUTO SHOP ➔")
    const createGroundStencilTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.95)'; // bright caution yellow
      ctx.font = '900 68px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AUTO SHOP', 256, 110);

      // Chevron arrows below
      ctx.font = '900 56px "Segoe UI", Arial, sans-serif';
      ctx.fillText('➔  ➔  ➔', 256, 195);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      tex.needsUpdate = true;
      return tex;
    };

    const groundStencilTex = createGroundStencilTexture();
    const matGroundStencil = new THREE.MeshBasicMaterial({
      map: groundStencilTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

    this.serviceBays.forEach(bay => {
      // Place shop on the right roadside shoulder (lateralOffset = -34.0m in SplineRoad coordinates)
      const lateral = bay.side === 'right' ? -34.0 : 34.0;
      const trans = this.splineRoad.getRoadTransformAtZ(bay.z, lateral, 0);
      if (!trans) return;

      const shopGroup = new THREE.Group();
      shopGroup.position.copy(trans.pos);
      // Aligned along the highway direction:
      // Local +Z is highway forward, Local -Z is highway backward
      // Local +X is away from the road (deep into the lot), Local -X is towards the highway shoulder
      shopGroup.rotation.y = trans.heading;

      // -------------------------------------------------------------
      // 1. Paved Driveway Forecourt Apron & Smooth Highway Tapers
      // -------------------------------------------------------------
      // Main Paved Forecourt (Spanning from highway shoulder at X=-20 to garage entrance at X=0, length 70m)
      const apronGeo = new THREE.PlaneGeometry(20, 70);
      const apron = new THREE.Mesh(apronGeo, this.matShopFloor);
      apron.rotation.x = -Math.PI * 0.5;
      apron.position.set(-10.0, 0.04, 0.0);
      apron.receiveShadow = true;
      shopGroup.add(apron);

      // Highway Entrance Deceleration Taper Ramp (flared from highway right shoulder at Z=-45)
      const entranceTaperGeo = new THREE.PlaneGeometry(16, 30);
      const entranceTaper = new THREE.Mesh(entranceTaperGeo, this.matShopFloor);
      entranceTaper.rotation.x = -Math.PI * 0.5;
      entranceTaper.rotation.z = Math.PI * 0.12;
      entranceTaper.position.set(-14.0, 0.035, -45.0);
      entranceTaper.receiveShadow = true;
      shopGroup.add(entranceTaper);

      // Highway Exit Acceleration Taper Ramp (flared back into highway at Z=+45)
      const exitTaperGeo = new THREE.PlaneGeometry(16, 30);
      const exitTaper = new THREE.Mesh(exitTaperGeo, this.matShopFloor);
      exitTaper.rotation.x = -Math.PI * 0.5;
      exitTaper.rotation.z = -Math.PI * 0.12;
      exitTaper.position.set(-14.0, 0.035, 45.0);
      exitTaper.receiveShadow = true;
      shopGroup.add(exitTaper);

      // Stenciled Yellow Asphalt Ground Decals ("AUTO SHOP ➔") pointing from street into garage
      const groundDecal1 = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), matGroundStencil);
      groundDecal1.rotation.x = -Math.PI * 0.5;
      groundDecal1.rotation.z = -Math.PI * 0.5; // pointing from highway (+X) towards garage
      groundDecal1.position.set(-14.0, 0.08, -14.0);
      shopGroup.add(groundDecal1);

      const groundDecal2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), matGroundStencil);
      groundDecal2.rotation.x = -Math.PI * 0.5;
      groundDecal2.rotation.z = -Math.PI * 0.5;
      groundDecal2.position.set(-5.0, 0.08, 0.0);
      shopGroup.add(groundDecal2);

      // Embedded Amber/White Runway Reflector Lights along outer driveway curve
      for (let c = 0; c <= 8; c++) {
        const curbLight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8), this.matAmberReflector);
        curbLight.position.set(-20.0 + Math.sin(c * 0.38) * 3.0, 0.09, -40.0 + c * 10.0);
        shopGroup.add(curbLight);
      }

      // -------------------------------------------------------------
      // 2. Open Drive-In Garage Bay 01 (Street-Facing with Real Interior)
      // -------------------------------------------------------------
      const wallMat = this.renderer.createToonMaterial({ color: bay.wallCol || 0xd97706, gradientBands: 3 });
      const interiorWallMat = this.renderer.createToonMaterial({ color: 0x334155, gradientBands: 2 });
      const bayFloorMat = this.renderer.createToonMaterial({ color: 0x1e293b, gradientBands: 2 });

      // Interior Bay Polished Concrete Floor Pad (16m deep along X, 14m wide along Z)
      const bayFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), bayFloorMat);
      bayFloor.rotation.x = -Math.PI * 0.5;
      bayFloor.position.set(8.0, 0.06, 0.0);
      bayFloor.receiveShadow = true;
      shopGroup.add(bayFloor);

      // Yellow Hazard Striped Entrance Lip at Garage Door Threshold (X = 0.0)
      for (let s = -5; s <= 5; s++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.2), this.matCautionYellow);
        stripe.rotation.x = -Math.PI * 0.5;
        stripe.rotation.z = Math.PI * 0.25;
        stripe.position.set(0.0, 0.08, s * 1.25);
        shopGroup.add(stripe);
      }

      // Left Interior Wall (Z = -7.0, spanning X from 0 to 16)
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(16.0, 8.5, 0.6), interiorWallMat);
      leftWall.position.set(8.0, 4.25, -7.0);
      leftWall.castShadow = true;
      shopGroup.add(leftWall);

      // Right Divider Wall (Z = +7.0, between Bay 01 and Bay 02)
      const dividerWall = new THREE.Mesh(new THREE.BoxGeometry(16.0, 8.5, 0.6), interiorWallMat);
      dividerWall.position.set(8.0, 4.25, 7.0);
      dividerWall.castShadow = true;
      shopGroup.add(dividerWall);

      // Back Interior Wall (X = 16.0, spanning Z from -7 to +7)
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8.5, 14.6), interiorWallMat);
      backWall.position.set(16.0, 4.25, 0.0);
      backWall.castShadow = true;
      shopGroup.add(backWall);

      // Brick Wainscoting Lower Trim inside and outside
      const brickTrimL = new THREE.Mesh(new THREE.BoxGeometry(16.2, 1.8, 0.7), this.matShopBrick);
      brickTrimL.position.set(8.0, 0.9, -7.0);
      shopGroup.add(brickTrimL);

      const brickTrimBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 14.8), this.matShopBrick);
      brickTrimBack.position.set(16.0, 0.9, 0.0);
      shopGroup.add(brickTrimBack);

      // Interior Diagnostic Telemetry Digital Screen on Back Wall (Facing -X towards garage door)
      const diagScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), this.matNeonCyan);
      diagScreen.position.set(15.65, 5.2, 0.0);
      diagScreen.rotation.y = -Math.PI * 0.5;
      shopGroup.add(diagScreen);

      const diagBorder = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 4.5), this.matDarkTrim);
      diagBorder.position.set(15.75, 5.2, 0.0);
      shopGroup.add(diagBorder);

      // Interior Ceiling over Bay 01
      const bayCeiling = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.4, 14.6), this.matDarkTrim);
      bayCeiling.position.set(8.0, 8.5, 0.0);
      shopGroup.add(bayCeiling);

      // Overhead High-Intensity LED Shop Light Fixtures
      [-4.0, 0.0, 4.0].forEach(lz => {
        const fixture = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.15, 0.4), this.matDarkTrim);
        fixture.position.set(8.0, 8.35, lz);
        shopGroup.add(fixture);

        const lightTube = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.08, 0.25), this.matStrobeWhite);
        lightTube.position.set(8.0, 8.25, lz);
        shopGroup.add(lightTube);
      });

      // Interior Tool Chests & Workbenches inside Bay 01 (Against left wall Z=-6.4)
      const inToolChest = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 1.0), this.matToolChestRed);
      inToolChest.position.set(4.0, 0.9, -6.3);
      shopGroup.add(inToolChest);

      const inTireRack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.6, 0.9), this.matDarkTrim);
      inTireRack.position.set(11.5, 1.3, -6.3);
      shopGroup.add(inTireRack);

      for (let t = 0; t < 6; t++) {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 10), this.matTire);
        tire.rotation.x = Math.PI * 0.5;
        tire.position.set(10.2 + Math.floor(t / 2) * 0.9, 0.6 + (t % 2) * 1.1, -6.3);
        shopGroup.add(tire);
      }

      // -------------------------------------------------------------
      // 3. Heavy-Duty 4-Post Hydraulic Automotive Lift (Inside Bay 01)
      // -------------------------------------------------------------
      const liftGroup = new THREE.Group();
      liftGroup.position.set(8.0, 0, 0.0);

      const postPositions = [
        { x: -3.8, z: -4.5 },
        { x: 3.8, z: -4.5 },
        { x: -3.8, z: 4.5 },
        { x: 3.8, z: 4.5 }
      ];

      postPositions.forEach(pPos => {
        // Vertical Lift Column
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.55, 5.6, 0.65), this.matLiftPost);
        post.position.set(pPos.x, 2.8, pPos.z);
        post.castShadow = true;
        liftGroup.add(post);

        // Chrome Hydraulic Cylinder
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8), this.matChrome);
        cyl.position.set(pPos.x, 2.8, pPos.z > 0 ? pPos.z - 0.32 : pPos.z + 0.32);
        liftGroup.add(cyl);

        // Flashing Amber Warning Light Beacon on Top of Post
        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 8), this.matNeonOrange);
        beacon.position.set(pPos.x, 5.75, pPos.z);
        liftGroup.add(beacon);
      });

      // Upper Crossbeams connecting the posts
      const frontCrossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 9.4), this.matLiftPost);
      frontCrossBeam.position.set(-3.8, 5.5, 0);
      liftGroup.add(frontCrossBeam);

      const rearCrossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 9.4), this.matLiftPost);
      rearCrossBeam.position.set(3.8, 5.5, 0);
      liftGroup.add(rearCrossBeam);

      const sideBeamL = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.38, 0.45), this.matLiftPost);
      sideBeamL.position.set(0, 5.5, -4.5);
      liftGroup.add(sideBeamL);

      const sideBeamR = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.38, 0.45), this.matLiftPost);
      sideBeamR.position.set(0, 5.5, 4.5);
      liftGroup.add(sideBeamR);

      // Heavy Steel Lift Runway Tracks (aligned along X for vehicle drive-in)
      [-2.4, 2.4].forEach(rz => {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.22, 1.2), this.matCautionYellow);
        runner.position.set(0, 0.9, rz);
        liftGroup.add(runner);
      });

      shopGroup.add(liftGroup);

      // -------------------------------------------------------------
      // 4. Street-Facing Garage Door Opening & Header (Bay 01)
      // -------------------------------------------------------------
      // Overhead Rolled-Up Metal Door Drum above the 14m wide door opening (at X = 0.0)
      const rollDrum1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 14.0, 12), this.matChrome);
      rollDrum1.rotation.x = Math.PI * 0.5;
      rollDrum1.position.set(0.0, 7.3, 0.0);
      shopGroup.add(rollDrum1);

      // Bay 01 Header Plaque: "AUTO SHOP • DRIVE-IN SERVICE BAY 01"
      const bay01Header = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.85, 14.0), this.matCautionYellow);
      bay01Header.position.set(0.0, 8.0, 0.0);
      shopGroup.add(bay01Header);

      // -------------------------------------------------------------
      // 5. Bay 02 & Customer Office Wing (Adjacent Solid Building)
      // -------------------------------------------------------------
      // Bay 02 Solid Enclosure (Z from 7.0 to 19.0, depth 16m along X)
      const bay02Building = new THREE.Mesh(new THREE.BoxGeometry(16, 8.5, 12), wallMat);
      bay02Building.position.set(8.0, 4.25, 13.0);
      bay02Building.castShadow = true;
      shopGroup.add(bay02Building);

      const brickTrim02 = new THREE.Mesh(new THREE.BoxGeometry(16.4, 1.8, 12.4), this.matShopBrick);
      brickTrim02.position.set(8.0, 0.9, 13.0);
      shopGroup.add(brickTrim02);

      // Bay 02: Closed Roll-Up Service Door (Facing Street -X)
      const bay02Door = new THREE.Mesh(new THREE.PlaneGeometry(10.0, 6.5), this.matChrome);
      bay02Door.rotation.y = -Math.PI * 0.5;
      bay02Door.position.set(-0.05, 3.25, 13.0);
      shopGroup.add(bay02Door);

      for (let sl = 0; sl < 11; sl++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 9.8), this.matDarkTrim);
        slat.position.set(-0.08, 0.8 + sl * 0.55, 13.0);
        shopGroup.add(slat);
      }

      // Bay 02 Header Plaque: "BAY 02 • SUSPENSION & BRAKES"
      const bay02Header = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 10.2), this.matDarkTrim);
      bay02Header.position.set(-0.1, 8.0, 13.0);
      shopGroup.add(bay02Header);

      // Customer Office Wing (Z from 19.0 to 29.0, depth 16m along X)
      const officeBuilding = new THREE.Mesh(new THREE.BoxGeometry(16, 8.5, 10), wallMat);
      officeBuilding.position.set(8.0, 4.25, 24.0);
      officeBuilding.castShadow = true;
      shopGroup.add(officeBuilding);

      const brickTrimOffice = new THREE.Mesh(new THREE.BoxGeometry(16.4, 1.8, 10.4), this.matShopBrick);
      brickTrimOffice.position.set(8.0, 0.9, 24.0);
      shopGroup.add(brickTrimOffice);

      // Office Window & Door (Facing Street -X)
      const officeWindow = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3.8), this.matGlass);
      officeWindow.rotation.y = -Math.PI * 0.5;
      officeWindow.position.set(-0.05, 4.0, 24.0);
      shopGroup.add(officeWindow);

      const officeDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.6), this.matDarkTrim);
      officeDoor.rotation.y = -Math.PI * 0.5;
      officeDoor.position.set(-0.05, 2.3, 27.0);
      shopGroup.add(officeDoor);

      // Office Neon Sign: "OFFICE / OPEN"
      const signOffice = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 3.2), this.matNeonGreen);
      signOffice.position.set(-0.1, 6.8, 24.0);
      shopGroup.add(signOffice);

      // -------------------------------------------------------------
      // 6. Corrugated Industrial Roof & Rooftop Equipment
      // -------------------------------------------------------------
      const mainRoofGeo = new THREE.BoxGeometry(18, 1.2, 38);
      const mainRoof = new THREE.Mesh(mainRoofGeo, this.matShopTinRoof);
      mainRoof.position.set(8.0, 9.1, 11.0);
      shopGroup.add(mainRoof);

      // Rooftop Industrial HVAC Chillers & Turbovents
      [-2.0, 11.0, 24.0].forEach(rz => {
        const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 1.8, 10), this.matChrome);
        vent.position.set(8.0, 10.5, rz);
        shopGroup.add(vent);
      });

      const hvacUnit = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 5.2), this.matDarkTrim);
      hvacUnit.position.set(8.0, 10.2, 4.0);
      shopGroup.add(hvacUnit);

      // Dual Industrial Smoke & Exhaust Stacks with chrome caps
      [-5.0, 27.0].forEach(sz => {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.8, 10), this.matDarkTrim);
        stack.position.set(13.0, 11.0, sz);
        shopGroup.add(stack);
        const stackCap = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.1, 0.4, 10), this.matChrome);
        stackCap.position.set(13.0, 13.0, sz);
        shopGroup.add(stackCap);
      });

      // Main Building Rooftop Marquee Sign ("★ AUTO SHOP ★") Facing Street (-X)
      const marqueeBoard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.4, 28), this.matDarkTrim);
      marqueeBoard.position.set(0.0, 11.8, 11.0);
      marqueeBoard.rotation.y = -0.22;
      shopGroup.add(marqueeBoard);

      const marqueeTex = createMarqueeSignTexture(bay);
      const marqueeMat = new THREE.MeshBasicMaterial({ map: marqueeTex });
      const marqueeFace = new THREE.Mesh(new THREE.PlaneGeometry(27.6, 3.2), marqueeMat);
      marqueeFace.rotation.y = -Math.PI * 0.5 - 0.22;
      marqueeFace.position.set(-0.32, 11.8, 11.0);
      shopGroup.add(marqueeFace);

      // -------------------------------------------------------------
      // 7. Massive Roadside "AUTO SHOP" Neon Pylon Billboard
      // -------------------------------------------------------------
      const pylonGroup = new THREE.Group();
      // Positioned at entrance corner beside highway shoulder (-15.0, 0, -25.0) angled towards oncoming traffic
      pylonGroup.position.set(-15.0, 0, -25.0);
      pylonGroup.rotation.y = -Math.PI * 0.28;

      // Twin Steel Lattice Towers
      [-2.6, 2.6].forEach(px => {
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.55, 12.0, 0.55), this.matDarkTrim);
        pole.position.set(px, 6.0, 0);
        pole.castShadow = true;
        pylonGroup.add(pole);

        // Lattice Cross-Braces
        for (let b = 1; b <= 4; b++) {
          const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.18), this.matChrome);
          brace.position.set(0, b * 2.2, 0);
          brace.rotation.z = (b % 2 === 0 ? 0.65 : -0.65);
          pylonGroup.add(brace);
        }
      });

      // Main Backlit Double-Sided Billboard Signboard Box
      const pylonBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.4, 10.5), this.matDarkTrim);
      pylonBox.position.set(0, 8.8, 0);
      pylonGroup.add(pylonBox);

      // Billboard Canvas Texture Front & Back Faces ("AUTO SHOP")
      const pylonTex = createPylonSignTexture(bay);
      const pylonMat = new THREE.MeshBasicMaterial({ map: pylonTex });

      const pylonFaceFront = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 5.1), pylonMat);
      pylonFaceFront.rotation.y = Math.PI * 0.5;
      pylonFaceFront.position.set(0.42, 8.8, 0);
      pylonGroup.add(pylonFaceFront);

      const pylonFaceBack = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 5.1), pylonMat);
      pylonFaceBack.rotation.y = -Math.PI * 0.5;
      pylonFaceBack.position.set(-0.42, 8.8, 0);
      pylonGroup.add(pylonFaceBack);

      // Animated Glowing 3D Neon Wrench Crest on Top of Pylon
      const pylonWrench = new THREE.Group();
      pylonWrench.position.set(0, 12.6, 0);

      const neonMat = this.renderer.createToonMaterial({ color: bay.neonCol || 0xf97316, gradientBands: 1 });
      const pShaft = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.25), neonMat);
      pShaft.rotation.z = Math.PI * 0.25;
      pylonWrench.add(pShaft);

      const pHead1 = new THREE.Mesh(new THREE.RingGeometry(0.45, 1.0, 14), neonMat);
      pHead1.position.set(-1.1, 1.1, 0);
      pylonWrench.add(pHead1);

      const pHead2 = new THREE.Mesh(new THREE.RingGeometry(0.45, 1.0, 14), neonMat);
      pHead2.position.set(1.1, -1.1, 0);
      pylonWrench.add(pHead2);

      // Top Hazard Warning Strobe Beacon
      const pylonBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 8), this.matNeonOrange);
      pylonBeacon.position.set(0, 1.8, 0);
      pylonWrench.add(pylonBeacon);

      pylonGroup.add(pylonWrench);
      shopGroup.add(pylonGroup);

      // -------------------------------------------------------------
      // 8. Highway Advance Approach Roadside Signpost (~90m before shop on right shoulder)
      // -------------------------------------------------------------
      const advTrans = this.splineRoad.getRoadTransformAtZ(bay.z - 90, -10.5, 0.15);
      if (advTrans) {
        const advSignGroup = new THREE.Group();
        advSignGroup.position.copy(advTrans.pos);
        advSignGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), advTrans.tangent);
        advSignGroup.rotateY(Math.PI); // Face oncoming traffic!
        advSignGroup.rotateY(0.62); // Angled ~36° inward toward oncoming traffic lanes for direct sightline

        const advPost = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 0.24), this.matDarkTrim);
        advPost.position.set(0, 2.1, -0.10);
        advSignGroup.add(advPost);

        const advTex = createAdvanceSignTexture(bay);
        const advMat = new THREE.MeshBasicMaterial({ map: advTex });
        const advMaterials = [
          this.matDarkTrim,
          this.matDarkTrim,
          this.matDarkTrim,
          this.matDarkTrim,
          advMat,           // +Z (Front face facing oncoming traffic)
          this.matDarkTrim  // -Z (Back face)
        ];
        const advBoard = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.15), advMaterials);
        advBoard.position.set(0, 3.2, 0);
        advSignGroup.add(advBoard);

        this.group.add(advSignGroup);
      }

      // -------------------------------------------------------------
      // 9. Authentic Automotive Mechanic Equipment & Props (Perimeter Left)
      // -------------------------------------------------------------
      const toolChest = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 2.4), this.matToolChestRed);
      toolChest.position.set(2.0, 0.9, -10.0);
      shopGroup.add(toolChest);

      const hoistGroup = new THREE.Group();
      hoistGroup.position.set(6.0, 0, -10.0);
      const hoistBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 1.6), this.matToolChestRed);
      hoistBase.position.set(0, 0.08, 0);
      hoistGroup.add(hoistBase);
      const hoistMast = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.5, 0.22), this.matToolChestRed);
      hoistMast.position.set(-0.7, 1.25, 0);
      hoistGroup.add(hoistMast);
      const hoistBoom = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 0.2), this.matToolChestRed);
      hoistBoom.position.set(0.15, 2.4, 0);
      hoistBoom.rotation.z = Math.PI * 0.12;
      hoistGroup.add(hoistBoom);
      hoistGroup.rotation.y = Math.PI * 0.5;
      shopGroup.add(hoistGroup);

      const pallet = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 2.8), this.matWoodPallet);
      pallet.position.set(12.0, 0.09, -10.0);
      shopGroup.add(pallet);

      [
        { ox: -0.7, oz: -0.7, mat: this.matOilDrumBlue },
        { ox: 0.7, oz: -0.7, mat: this.matOilDrumBlack },
        { ox: 0.0, oz: 0.7, mat: this.matOilDrumBlue }
      ].forEach(drumCfg => {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.25, 10), drumCfg.mat);
        drum.position.set(12.0 + drumCfg.ox, 0.8, -10.0 + drumCfg.oz);
        shopGroup.add(drum);

        const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), this.matChrome);
        pump.position.set(12.0 + drumCfg.ox, 1.6, -10.0 + drumCfg.oz);
        shopGroup.add(pump);
      });

      // -------------------------------------------------------------
      // 10. Floating 3D Holographic "AUTO SHOP" Wrench / Spanner Icon
      // -------------------------------------------------------------
      const wrenchGroup = new THREE.Group();
      wrenchGroup.position.set(0.0, 9.0, 0.0);

      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.22), this.matNeonCyan);
      wrenchGroup.add(shaft);

      const headGeo = new THREE.RingGeometry(0.5, 1.1, 14);
      const headMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const head1 = new THREE.Mesh(headGeo, headMat);
      head1.position.set(0, 1.6, 0);
      wrenchGroup.add(head1);

      shopGroup.add(wrenchGroup);
      shopGroup.visible = Math.abs(bay.z - 0) < 1600;
      this.serviceBayMeshes.push({ group: shopGroup, wrench: wrenchGroup, bay });
      this.group.add(shopGroup);
    });
  }

  initRadarPosts() {
    const radarConfigs = [
      { id: 'radar_0', zone: 0, z: 1650, xOffset: 14.8, state: 'CHP', speedLimit: 85 },
      { id: 'radar_1', zone: 1, z: 3950, xOffset: 14.8, state: 'CHP', speedLimit: 85 },
      { id: 'radar_3', zone: 3, z: 8500, xOffset: 14.8, state: 'CHP', speedLimit: 85 },
      { id: 'radar_4', zone: 4, z: 12100, xOffset: 14.8, state: 'CHP', speedLimit: 85 },
      { id: 'radar_6', zone: 6, z: 16900, xOffset: 14.8, state: 'OSP', speedLimit: 85 },
      { id: 'radar_8', zone: 8, z: 21700, xOffset: 14.8, state: 'WSP', speedLimit: 85 }
    ];

    radarConfigs.forEach(cfg => {
      const postGroup = new THREE.Group();
      const trans = this.splineRoad.getRoadTransformAtZ(cfg.z, cfg.xOffset, 0);

      if (trans) {
        postGroup.position.copy(trans.pos);
        postGroup.rotation.y = trans.heading + Math.PI * 0.15; // Angled slightly facing road
      }

      // 1. Parked Police Cruiser
      const cruiser = this.createPoliceCruiserModel();
      postGroup.add(cruiser);

      // 2. Roadside Trooper with Speed Radar Gun
      const officer = this.createOfficerModel();
      officer.position.set(-1.8, 0, 1.2);
      officer.rotation.y = Math.PI * 0.85; // Aiming radar gun toward oncoming traffic
      postGroup.add(officer);

      // 3. Digital Speed Display Board ("YOUR SPEED: -- MPH")
      const boardGroup = new THREE.Group();
      const boardPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), this.matDarkTrim);
      boardPole.position.set(-2.8, 1.2, 2.2);
      boardGroup.add(boardPole);

      const boardSign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.10), this.matDarkTrim);
      boardSign.position.set(-2.8, 2.1, 2.2);
      boardGroup.add(boardSign);

      const boardHeader = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.22), this.matPoliceDoorWhite);
      boardHeader.position.set(-2.8, 2.35, 2.26);
      boardGroup.add(boardHeader);

      const boardDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
      boardDisplay.position.set(-2.8, 1.90, 2.26);
      boardGroup.add(boardDisplay);

      postGroup.add(boardGroup);
      postGroup.visible = Math.abs(cfg.z - 0) < 1400;

      this.group.add(postGroup);
      this.radarPosts.push({
        config: cfg,
        group: postGroup,
        cruiser: cruiser,
        officer: officer
      });
    });
  }

  initPolicePursuitUnit() {
    this.pursuitCruiser = this.createPoliceCruiserModel(true);
    this.pursuitCruiser.visible = false;
    this.group.add(this.pursuitCruiser);

    this.pursuitState = {
      active: false,
      z: 0,
      lateralOffset: 0,
      speed: 0,
      targetSpeed: 0,
      health: 100,
      maxHealth: 100,
      aiMode: 'SPAWN_PULLOUT', // SPAWN_PULLOUT | CATCH_UP | RAM_SURGE | PIT_ATTACK | BOX_IN | WRECKED | RETREAT
      stateTimer: 0,
      attackCooldown: 2.5,
      currentAttack: null,
      pitSide: 'left',
      contactTimer: 0,
      lightbarFlasher: 0,
      lastImpactTime: 0,
      lastPlayerAttackTime: 0,
      wreckTimer: 0,
      spinMomentum: 0,
      rollMomentum: 0,
      verticalVel: 0,
      altitudeOffset: 0,
      headingOffset: 0,
      rollAngle: 0,
      pitchAngle: 0
    };
  }

  /**
   * Helper to create realistic detailed automotive wheels (tires, rims, spokes, center caps & brake rotors)
   */
  createAutomotiveWheel(radius, width, rimType = 'alloy', customRimMat = null, isDually = false) {
    const wheelHub = new THREE.Group();

    // 1. Rubber Tire with Tread Texture & Shoulder Taper
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 14), this.matTire);
    tire.rotation.z = Math.PI * 0.5;
    tire.castShadow = true;
    wheelHub.add(tire);

    // 2. Rim Barrel (Recessed Inner Wheel)
    const rimMat = customRimMat || (rimType === 'steel_cop' ? this.matRim : (rimType === 'carbon' ? this.matCarbonFiber : this.matAlloy));
    const rimRadius = radius * 0.65;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius, rimRadius, width + 0.01, 12), rimMat);
    rim.rotation.z = Math.PI * 0.5;
    wheelHub.add(rim);

    // 3. Rim Center Cap / Hub Details
    if (rimType === 'steel_cop') {
      // Chrome Dog-Dish Police Center Hubcap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.48, rimRadius * 0.48, width + 0.03, 10), this.matChrome);
      cap.rotation.z = Math.PI * 0.5;
      wheelHub.add(cap);
    } else if (rimType === 'alloy' || rimType === 'sport_5spoke') {
      // 5-Spoke / Star Alloy Hub
      const centerNut = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.28, rimRadius * 0.28, width + 0.025, 8), this.matDarkTrim);
      centerNut.rotation.z = Math.PI * 0.5;
      wheelHub.add(centerNut);

      // 5 Sculpted Spoke Accents
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(rimRadius * 0.14, rimRadius * 0.85, width + 0.02), rimMat);
        spoke.rotation.x = (s * Math.PI * 2) / 5;
        wheelHub.add(spoke);
      }
    } else if (rimType === 'beadlock_truck') {
      // Heavy-Duty Beadlock Ring
      const beadlock = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.88, rimRadius * 0.88, width + 0.025, 12), this.matDarkTrim);
      beadlock.rotation.z = Math.PI * 0.5;
      wheelHub.add(beadlock);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.35, rimRadius * 0.35, width + 0.03, 8), this.matChrome);
      cap.rotation.z = Math.PI * 0.5;
      wheelHub.add(cap);
    }

    // 4. Brake Disc & Red Performance Caliper
    const brakeDisc = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.78, rimRadius * 0.78, width * 0.65, 10), this.matBrakeDisc);
    brakeDisc.rotation.z = Math.PI * 0.5;
    wheelHub.add(brakeDisc);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(rimRadius * 0.42, 0.08, width * 0.72), this.matCalipers);
    caliper.position.set(0, rimRadius * 0.48, 0);
    wheelHub.add(caliper);

    // Duallies (Inner Extra Wheel for Commercial Trucks)
    if (isDually) {
      const innerTire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width * 0.9, 12), this.matTire);
      innerTire.rotation.z = Math.PI * 0.5;
      innerTire.position.x = -Math.sign(width) * (width + 0.06);
      wheelHub.add(innerTire);
    }

    return { wheelHub, tireMesh: tire };
  }

  createPoliceCruiserModel(isPursuitUnit = false) {
    const cruiserGroup = new THREE.Group();
    const wheels = [];

    // 1. Sleek Aerodynamic Interceptor Lower Chassis & Diffuser
    const bodyGeo = new THREE.BoxGeometry(1.92, 0.48, 4.65);
    const body = new THREE.Mesh(bodyGeo, this.matPoliceBody);
    body.position.set(0, 0.42, 0);
    body.castShadow = true;
    cruiserGroup.add(body);

    // Sloped Aerodynamic Front Hood & Fenders (Raked forward 3.5 deg)
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.18, 1.45), this.matPoliceBody);
    hood.position.set(0, 0.56, 1.45);
    hood.rotation.x = Math.PI * 0.045;
    hood.castShadow = true;
    cruiserGroup.add(hood);

    // Dual Hood Heat Extraction Louvers
    [-0.38, 0.38].forEach(hx => {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.55), this.matDarkTrim);
      louver.position.set(hx, 0.66, 1.42);
      louver.rotation.x = Math.PI * 0.045;
      cruiserGroup.add(louver);
    });

    // 2. White Door Panels with California Highway Patrol Gold Shield Emblem Decal
    [-0.97, 0.97].forEach(x => {
      const doorPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 0.44), this.matPoliceDoorWhite);
      doorPanel.position.set(x, 0.43, -0.05);
      doorPanel.rotation.y = x > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      cruiserGroup.add(doorPanel);

      // Gold Star / Shield Badge Decal
      const starDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), this.matPoliceGoldStar);
      starDecal.position.set(x + (x > 0 ? 0.01 : -0.01), 0.45, -0.05);
      starDecal.rotation.y = x > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      starDecal.rotation.z = Math.PI * 0.25;
      cruiserGroup.add(starDecal);

      // Aerodynamic Side Mirror with Integrated Amber Strobe
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), this.matPoliceBody);
      mirror.position.set(x + (x > 0 ? 0.14 : -0.14), 0.72, 0.78);
      cruiserGroup.add(mirror);

      const mirrorStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.14), this.matAmberReflector);
      mirrorStrobe.position.set(x + (x > 0 ? 0.21 : -0.21), 0.72, 0.78);
      cruiserGroup.add(mirrorStrobe);
    });

    // 3. Low-Drag White Roof Cabin with Raked Windshield & Fastback Rear
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.44, 2.25), this.matPoliceDoorWhite);
    cabin.position.set(0, 0.86, -0.15);
    cabin.castShadow = true;
    cruiserGroup.add(cabin);

    // Tinted Aero Windshield (Slanted 34 deg)
    const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 0.48), this.matGlass);
    frontGlass.position.set(0, 0.86, 0.98);
    frontGlass.rotation.x = -Math.PI * 0.30;
    cruiserGroup.add(frontGlass);

    // Fastback Rear Window
    const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.44), this.matGlass);
    rearGlass.position.set(0, 0.86, -1.28);
    rearGlass.rotation.x = Math.PI * 0.28;
    rearGlass.rotation.y = Math.PI;
    cruiserGroup.add(rearGlass);

    // 4. Heavy-Duty Steel Push Bumper / Bull Bar with Angular Brush Guards
    const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.38, 0.14), this.matDarkTrim);
    pushBar.position.set(0, 0.38, 2.38);
    cruiserGroup.add(pushBar);

    [-0.58, 0.58].forEach(bx => {
      const vertGuard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.12), this.matDarkTrim);
      vertGuard.position.set(bx, 0.45, 2.40);
      cruiserGroup.add(vertGuard);

      const upperWing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), this.matDarkTrim);
      upperWing.position.set(bx > 0 ? bx + 0.18 : bx - 0.18, 0.62, 2.36);
      cruiserGroup.add(upperWing);
    });

    // 5. Whelen Low-Profile Aerodynamic LED Lightbar
    const barCasing = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.06, 0.22), this.matDarkTrim);
    barCasing.position.set(0, 1.11, -0.15);
    cruiserGroup.add(barCasing);

    const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.18), this.matLightbarRed);
    lightL.position.set(-0.35, 1.15, -0.15);
    cruiserGroup.add(lightL);

    const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.18), this.matLightbarBlue);
    lightR.position.set(0.35, 1.15, -0.15);
    cruiserGroup.add(lightR);

    // White Center Takedown Flood LED
    const takedownLight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.18), this.matStrobeWhite);
    takedownLight.position.set(0, 1.15, -0.15);
    cruiserGroup.add(takedownLight);

    // Front Grille Strobes (Wig-Wag LEDs)
    const grilleL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.06), this.matLightbarRed);
    grilleL.position.set(-0.42, 0.44, 2.34);
    cruiserGroup.add(grilleL);

    const grilleR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.06), this.matLightbarBlue);
    grilleR.position.set(0.42, 0.44, 2.34);
    cruiserGroup.add(grilleR);

    // 6. Modern Projector Headlights with DRL Eyebrows & Dual Taillights
    [-0.74, 0.74].forEach(x => {
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.06), this.matHeadlight);
      headlight.position.set(x, 0.46, 2.32);
      cruiserGroup.add(headlight);

      const drl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.065), this.matStrobeWhite);
      drl.position.set(x, 0.52, 2.32);
      cruiserGroup.add(drl);

      const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.06), this.matBrakelight);
      taillight.position.set(x, 0.48, -2.33);
      cruiserGroup.add(taillight);
    });

    // Rear Dual Exhaust Tips & Trunk ALPR Camera Scanners
    [-0.52, 0.52].forEach(ex => {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 8), this.matChrome);
      exhaust.rotation.x = Math.PI * 0.5;
      exhaust.position.set(ex, 0.22, -2.36);
      cruiserGroup.add(exhaust);

      const alpr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), this.matDarkTrim);
      alpr.position.set(ex, 0.68, -2.05);
      alpr.rotation.y = ex > 0 ? 0.35 : -0.35;
      cruiserGroup.add(alpr);
    });

    // 7. Heavy-Duty Steel Police Interceptor Wheels with Chrome Center Caps
    const wheelPositions = [
      { x: -0.92, y: 0.32, z:  1.42 },
      { x:  0.92, y: 0.32, z:  1.42 },
      { x: -0.92, y: 0.32, z: -1.38 },
      { x:  0.92, y: 0.32, z: -1.38 }
    ];

    wheelPositions.forEach(pos => {
      const { wheelHub, tireMesh } = this.createAutomotiveWheel(0.33, 0.24, 'steel_cop');
      wheelHub.position.set(pos.x, pos.y, pos.z);
      cruiserGroup.add(wheelHub);
      wheels.push(tireMesh);
    });

    // 8. Dynamic Siren PointLights & Wreck Particle Effects
    let pointLightRed = null;
    let pointLightBlue = null;
    let smokeMesh = null;
    let sparkMesh = null;

    if (isPursuitUnit) {
      pointLightRed = new THREE.PointLight(0xff1133, 0, 35, 1.8);
      pointLightRed.position.set(-0.35, 1.35, -0.15);
      cruiserGroup.add(pointLightRed);

      pointLightBlue = new THREE.PointLight(0x0088ff, 0, 35, 1.8);
      pointLightBlue.position.set(0.35, 1.35, -0.15);
      cruiserGroup.add(pointLightBlue);

      // Wreck Black Smoke Cloud Mesh
      const smokeGeo = new THREE.SphereGeometry(0.65, 8, 8);
      const matWreckSmoke = new THREE.MeshBasicMaterial({ color: 0x18181b, transparent: true, opacity: 0.85 });
      smokeMesh = new THREE.Mesh(smokeGeo, matWreckSmoke);
      smokeMesh.position.set(0, 0.85, 1.1);
      smokeMesh.visible = false;
      cruiserGroup.add(smokeMesh);

      // Wreck Spark Burst Mesh
      const sparkGeo = new THREE.SphereGeometry(0.42, 6, 6);
      const matWreckSpark = new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.95 });
      sparkMesh = new THREE.Mesh(sparkGeo, matWreckSpark);
      sparkMesh.position.set(0, 0.35, 0);
      sparkMesh.visible = false;
      cruiserGroup.add(sparkMesh);
    }

    cruiserGroup.userData = { lightL, lightR, grilleL, grilleR, pointLightRed, pointLightBlue, smokeMesh, sparkMesh, wheels };
    return cruiserGroup;
  }

  createOfficerModel() {
    const officerGroup = new THREE.Group();

    // Uniform Legs / Pants
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.85, 0.25), this.matOfficerUniform);
    legs.position.set(0, 0.42, 0);
    officerGroup.add(legs);

    // Torso / Shirt & Tactical Duty Vest
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.60, 0.28), this.matOfficerUniform);
    torso.position.set(0, 1.10, 0);
    officerGroup.add(torso);

    // Gold Badge
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), this.matPoliceGoldStar);
    badge.position.set(-0.12, 1.22, 0.15);
    officerGroup.add(badge);

    // Head & Trooper Campaign Hat
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), this.matOfficerSkin);
    head.position.set(0, 1.50, 0);
    officerGroup.add(head);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.10, 8), this.matDarkTrim);
    hat.position.set(0, 1.64, 0);
    officerGroup.add(hat);

    // Arms raising radar gun
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.48), this.matOfficerUniform);
    rightArm.position.set(0.24, 1.25, 0.24);
    officerGroup.add(rightArm);

    // Radar Gun
    const radarGun = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.32), this.matDarkTrim);
    radarGun.position.set(0.24, 1.28, 0.48);
    officerGroup.add(radarGun);

    const radarLens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), this.matGlass);
    radarLens.rotation.x = Math.PI * 0.5;
    radarLens.position.set(0.24, 1.28, 0.65);
    officerGroup.add(radarLens);

    return officerGroup;
  }

  createCivilianVehicle(type, colorHex) {
    const vGroup = new THREE.Group();
    const matPaint = this.renderer.createToonMaterial({ color: colorHex, gradientBands: 3 });
    const wheels = [];

    let brakeLightMesh = null;

    if (type === 'sedan') {
      // -------------------------------------------------------------
      // 1. MODERN SPORT FASTBACK SEDAN (BMW M / Audi RS / Sport styling)
      // -------------------------------------------------------------
      const len = 4.45, wid = 1.84, ht = 0.44;

      // Lower Body & Sculpted Side Sills
      const body = new THREE.Mesh(new THREE.BoxGeometry(wid, ht, len), matPaint);
      body.position.set(0, 0.38, 0);
      body.castShadow = true;
      vGroup.add(body);

      // Sloped Sculpted Hood with Dual Center Ridges
      const hood = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.92, 0.16, 1.35), matPaint);
      hood.position.set(0, 0.52, 1.45);
      hood.rotation.x = Math.PI * 0.05;
      hood.castShadow = true;
      vGroup.add(hood);

      // Front Honeycomb Mesh Grille & Chin Splitter
      const grille = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.65, 0.22, 0.08), this.matDarkTrim);
      grille.position.set(0, 0.34, len * 0.5 + 0.02);
      vGroup.add(grille);

      const splitter = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.94, 0.05, 0.18), this.matDarkTrim);
      splitter.position.set(0, 0.18, len * 0.5 + 0.08);
      vGroup.add(splitter);

      // Fastback Greenhouse Roof Cabin (Raked Windshield & Rear Glass)
      const cabinLen = 2.15;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.82, 0.42, cabinLen), matPaint);
      cabin.position.set(0, 0.78, -0.15);
      cabin.castShadow = true;
      vGroup.add(cabin);

      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.78, 0.46), this.matGlass);
      windshield.position.set(0, 0.78, -0.15 + cabinLen * 0.5 + 0.02);
      windshield.rotation.x = -Math.PI * 0.32;
      vGroup.add(windshield);

      const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.76, 0.42), this.matGlass);
      rearGlass.position.set(0, 0.78, -0.15 - cabinLen * 0.5 - 0.02);
      rearGlass.rotation.x = Math.PI * 0.30;
      rearGlass.rotation.y = Math.PI;
      vGroup.add(rearGlass);

      // Integrated Ducktail Trunk Lip
      const trunkLip = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.82, 0.05, 0.14), this.matDarkTrim);
      trunkLip.position.set(0, 0.58, -len * 0.48);
      vGroup.add(trunkLip);

      // Slim LED Projector Headlights
      [-wid * 0.36, wid * 0.36].forEach(x => {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.06), this.matHeadlight);
        head.position.set(x, 0.44, len * 0.5 + 0.02);
        vGroup.add(head);

        const d = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.065), this.matStrobeWhite);
        d.position.set(x, 0.49, len * 0.5 + 0.02);
        vGroup.add(d);
      });

      // Wrap-Around Full Width LED Rear Taillight Bar
      brakeLightMesh = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.88, 0.08, 0.05), this.matTaillight);
      brakeLightMesh.position.set(0, 0.46, -len * 0.5 - 0.02);
      vGroup.add(brakeLightMesh);

      // Dual Polished Chrome Exhaust Tips
      [-0.45, 0.45].forEach(ex => {
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.10, 8), this.matChrome);
        exhaust.rotation.x = Math.PI * 0.5;
        exhaust.position.set(ex, 0.22, -len * 0.5 - 0.04);
        vGroup.add(exhaust);
      });

      // 4 Sport Alloy Wheels
      [
        { x: -wid * 0.48, z:  len * 0.32 },
        { x:  wid * 0.48, z:  len * 0.32 },
        { x: -wid * 0.48, z: -len * 0.32 },
        { x:  wid * 0.48, z: -len * 0.32 }
      ].forEach(pos => {
        const { wheelHub, tireMesh } = this.createAutomotiveWheel(0.31, 0.22, 'alloy');
        wheelHub.position.set(pos.x, 0.31, pos.z);
        vGroup.add(wheelHub);
        wheels.push(tireMesh);
      });

    } else if (type === 'suv') {
      // -------------------------------------------------------------
      // 2. LUXURY PERFORMANCE SUV (Porsche Macan / Range Rover Sport)
      // -------------------------------------------------------------
      const len = 4.75, wid = 1.95, ht = 0.58;

      // Sculpted Muscular SUV Body & Black Rocker Armor
      const body = new THREE.Mesh(new THREE.BoxGeometry(wid, ht, len), matPaint);
      body.position.set(0, 0.48, 0);
      body.castShadow = true;
      vGroup.add(body);

      const rockerCladding = new THREE.Mesh(new THREE.BoxGeometry(wid * 1.02, 0.12, len * 0.98), this.matDarkTrim);
      rockerCladding.position.set(0, 0.24, 0);
      vGroup.add(rockerCladding);

      // High Sculpted Hood & Hexagonal Front Grille
      const hood = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.92, 0.20, 1.45), matPaint);
      hood.position.set(0, 0.68, 1.55);
      hood.rotation.x = Math.PI * 0.04;
      hood.castShadow = true;
      vGroup.add(hood);

      const grille = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.72, 0.32, 0.08), this.matDarkTrim);
      grille.position.set(0, 0.45, len * 0.5 + 0.02);
      vGroup.add(grille);

      // Lower Aluminum Skid Plate
      const skidPlate = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.55, 0.06, 0.22), this.matChrome);
      skidPlate.position.set(0, 0.22, len * 0.5 + 0.05);
      vGroup.add(skidPlate);

      // High-Visibility SUV Cabin & Roof Tailgate Spoiler
      const cabinLen = 2.75;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.84, 0.52, cabinLen), matPaint);
      cabin.position.set(0, 0.94, -0.25);
      cabin.castShadow = true;
      vGroup.add(cabin);

      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.80, 0.54), this.matGlass);
      windshield.position.set(0, 0.94, -0.25 + cabinLen * 0.5 + 0.02);
      windshield.rotation.x = -Math.PI * 0.28;
      vGroup.add(windshield);

      const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.78, 0.48), this.matGlass);
      rearGlass.position.set(0, 0.94, -0.25 - cabinLen * 0.5 - 0.02);
      rearGlass.rotation.x = Math.PI * 0.24;
      rearGlass.rotation.y = Math.PI;
      vGroup.add(rearGlass);

      // Satin Silver Roof Rails & Shark-Fin Antenna
      [-0.70, 0.70].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 2.35), this.matChrome);
        rail.position.set(rx, 1.22, -0.25);
        vGroup.add(rail);
      });

      const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.18), this.matDarkTrim);
      sharkFin.position.set(0, 1.24, -1.25);
      vGroup.add(sharkFin);

      // Quad LED Matrix Projector Headlights
      [-wid * 0.36, wid * 0.36].forEach(x => {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.06), this.matHeadlight);
        head.position.set(x, 0.55, len * 0.5 + 0.02);
        vGroup.add(head);
      });

      // Wrap-Around LED Rear Lightbar
      brakeLightMesh = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.86, 0.09, 0.05), this.matTaillight);
      brakeLightMesh.position.set(0, 0.60, -len * 0.5 - 0.02);
      vGroup.add(brakeLightMesh);

      // 4 Large High-Clearance SUV Wheels
      [
        { x: -wid * 0.49, z:  len * 0.32 },
        { x:  wid * 0.49, z:  len * 0.32 },
        { x: -wid * 0.49, z: -len * 0.32 },
        { x:  wid * 0.49, z: -len * 0.32 }
      ].forEach(pos => {
        const { wheelHub, tireMesh } = this.createAutomotiveWheel(0.35, 0.26, 'alloy');
        wheelHub.position.set(pos.x, 0.35, pos.z);
        vGroup.add(wheelHub);
        wheels.push(tireMesh);
      });

    } else if (type === 'pickup') {
      // -------------------------------------------------------------
      // 3. HEAVY-DUTY CREW CAB TRUCK (Ford Raptor / RAM TRX styling)
      // -------------------------------------------------------------
      const len = 5.25, wid = 2.05, ht = 0.62;

      // Heavy High-Clearance Truck Frame
      const body = new THREE.Mesh(new THREE.BoxGeometry(wid, ht, len), matPaint);
      body.position.set(0, 0.54, 0);
      body.castShadow = true;
      vGroup.add(body);

      // Raised Power-Bulge Hood with Top Scoop
      const hood = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.94, 0.24, 1.65), matPaint);
      hood.position.set(0, 0.78, 1.70);
      hood.rotation.x = Math.PI * 0.035;
      hood.castShadow = true;
      vGroup.add(hood);

      const hoodScoop = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.42, 0.06, 0.45), this.matDarkTrim);
      hoodScoop.position.set(0, 0.91, 1.72);
      vGroup.add(hoodScoop);

      // Massive Heavy-Duty Front Grille & Steel Bumper with Red Tow Hooks
      const grille = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.82, 0.42, 0.12), this.matDarkTrim);
      grille.position.set(0, 0.56, len * 0.5 + 0.02);
      vGroup.add(grille);

      [-0.45, 0.45].forEach(tx => {
        const towHook = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8), this.matCalipers);
        towHook.rotation.x = Math.PI * 0.5;
        towHook.position.set(tx, 0.28, len * 0.5 + 0.08);
        vGroup.add(towHook);
      });

      // 4-Door Crew Cab with Privacy Tinted Glass
      const cabLen = 1.95;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.86, 0.56, cabLen), matPaint);
      cab.position.set(0, 1.04, 0.45);
      cab.castShadow = true;
      vGroup.add(cab);

      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.82, 0.58), this.matGlass);
      windshield.position.set(0, 1.04, 0.45 + cabLen * 0.5 + 0.02);
      windshield.rotation.x = -Math.PI * 0.26;
      vGroup.add(windshield);

      // Tubular Black Step Running Boards
      [-wid * 0.48, wid * 0.48].forEach(sx => {
        const stepBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.85, 8), this.matDarkTrim);
        stepBar.rotation.x = Math.PI * 0.5;
        stepBar.position.set(sx, 0.32, 0.45);
        vGroup.add(stepBar);
      });

      // Open Truck Bed with Ribbed Black Bedliner & Tailgate
      const bedLen = 2.15;
      const bedLiner = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.82, 0.04, bedLen), this.matDarkTrim);
      bedLiner.position.set(0, 0.62, -1.45);
      vGroup.add(bedLiner);

      [-wid * 0.44, wid * 0.44].forEach(bx => {
        const bedWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, bedLen), matPaint);
        bedWall.position.set(bx, 0.84, -1.45);
        bedWall.castShadow = true;
        vGroup.add(bedWall);

        const bedCap = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, bedLen + 0.02), this.matDarkTrim);
        bedCap.position.set(bx, 1.06, -1.45);
        vGroup.add(bedCap);
      });

      const tailgate = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.86, 0.44, 0.08), matPaint);
      tailgate.position.set(0, 0.84, -len * 0.5 + 0.04);
      tailgate.castShadow = true;
      vGroup.add(tailgate);

      // Front Big C-Clamp Headlights
      [-wid * 0.40, wid * 0.40].forEach(x => {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.06), this.matHeadlight);
        head.position.set(x, 0.62, len * 0.5 + 0.02);
        vGroup.add(head);
      });

      // Vertical Rear Tailgate Lights
      brakeLightMesh = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.88, 0.18, 0.04), this.matTaillight);
      brakeLightMesh.position.set(0, 0.72, -len * 0.5 - 0.02);
      vGroup.add(brakeLightMesh);

      // 4 Knobby Off-Road All-Terrain Beadlock Wheels
      [
        { x: -wid * 0.50, z:  len * 0.34 },
        { x:  wid * 0.50, z:  len * 0.34 },
        { x: -wid * 0.50, z: -len * 0.32 },
        { x:  wid * 0.50, z: -len * 0.32 }
      ].forEach(pos => {
        const { wheelHub, tireMesh } = this.createAutomotiveWheel(0.38, 0.28, 'beadlock_truck');
        wheelHub.position.set(pos.x, 0.38, pos.z);
        vGroup.add(wheelHub);
        wheels.push(tireMesh);
      });

    } else if (type === 'wagon') {
      // -------------------------------------------------------------
      // 4. EURO SPORT TURISMO WAGON (Audi RS6 Avant / Taycan Cross)
      // -------------------------------------------------------------
      const len = 4.70, wid = 1.88, ht = 0.45;

      const body = new THREE.Mesh(new THREE.BoxGeometry(wid, ht, len), matPaint);
      body.position.set(0, 0.39, 0);
      body.castShadow = true;
      vGroup.add(body);

      // Sloped Low Sports Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.92, 0.16, 1.45), matPaint);
      hood.position.set(0, 0.53, 1.50);
      hood.rotation.x = Math.PI * 0.045;
      hood.castShadow = true;
      vGroup.add(hood);

      // Extended Wagon Greenhouse Cabin & Panoramic Roof
      const cabinLen = 2.85;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.82, 0.42, cabinLen), matPaint);
      cabin.position.set(0, 0.79, -0.32);
      cabin.castShadow = true;
      vGroup.add(cabin);

      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.78, 0.48), this.matGlass);
      windshield.position.set(0, 0.79, -0.32 + cabinLen * 0.5 + 0.02);
      windshield.rotation.x = -Math.PI * 0.30;
      vGroup.add(windshield);

      const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.76, 0.44), this.matGlass);
      rearGlass.position.set(0, 0.79, -0.32 - cabinLen * 0.5 - 0.02);
      rearGlass.rotation.x = Math.PI * 0.26;
      rearGlass.rotation.y = Math.PI;
      vGroup.add(rearGlass);

      // Flush Black Roof Cargo Rails & Wagon Roof Spoiler
      [-0.68, 0.68].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 2.45), this.matDarkTrim);
        rail.position.set(rx, 1.02, -0.32);
        vGroup.add(rail);
      });

      const roofSpoiler = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.82, 0.05, 0.22), this.matDarkTrim);
      roofSpoiler.position.set(0, 1.02, -len * 0.48);
      vGroup.add(roofSpoiler);

      // LED Headlights & Taillights
      [-wid * 0.36, wid * 0.36].forEach(x => {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.10, 0.06), this.matHeadlight);
        head.position.set(x, 0.45, len * 0.5 + 0.02);
        vGroup.add(head);
      });

      brakeLightMesh = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.86, 0.08, 0.05), this.matTaillight);
      brakeLightMesh.position.set(0, 0.48, -len * 0.5 - 0.02);
      vGroup.add(brakeLightMesh);

      // 4 Low-Profile Sports Wheels
      [
        { x: -wid * 0.48, z:  len * 0.32 },
        { x:  wid * 0.48, z:  len * 0.32 },
        { x: -wid * 0.48, z: -len * 0.32 },
        { x:  wid * 0.48, z: -len * 0.32 }
      ].forEach(pos => {
        const { wheelHub, tireMesh } = this.createAutomotiveWheel(0.32, 0.23, 'alloy');
        wheelHub.position.set(pos.x, 0.32, pos.z);
        vGroup.add(wheelHub);
        wheels.push(tireMesh);
      });

    } else if (type === 'boxtruck') {
      // -------------------------------------------------------------
      // 5. COMMERCIAL DELIVERY BOX TRUCK (Freightliner / Isuzu NPR)
      // -------------------------------------------------------------
      const len = 6.45, wid = 2.25, ht = 0.72;

      // Heavy Commercial Ladder Chassis
      const body = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.95, ht, len), this.matDarkTrim);
      body.position.set(0, 0.58, 0);
      body.castShadow = true;
      vGroup.add(body);

      // Forward-Control Cab-Over-Engine Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.96, 0.95, 1.85), matPaint);
      cab.position.set(0, 1.15, 2.15);
      cab.castShadow = true;
      vGroup.add(cab);

      // Panoramic High-Visibility Cab Windshield
      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.90, 0.65), this.matGlass);
      windshield.position.set(0, 1.25, 3.08);
      windshield.rotation.x = -Math.PI * 0.12;
      vGroup.add(windshield);

      // Aerodynamic Wind Deflector Cone Fairing on Cab Roof
      const windCone = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.88, 0.45, 1.2), this.matPoliceDoorWhite);
      windCone.position.set(0, 1.82, 1.95);
      windCone.rotation.x = -Math.PI * 0.18;
      vGroup.add(windCone);

      // Commercial Dual-Arm Side Mirrors
      [-wid * 0.54, wid * 0.54].forEach(mx => {
        const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), this.matDarkTrim);
        mirrorArm.position.set(mx > 0 ? mx - 0.06 : mx + 0.06, 1.25, 2.65);
        vGroup.add(mirrorArm);

        const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.16), this.matDarkTrim);
        mirrorGlass.position.set(mx, 1.25, 2.65);
        vGroup.add(mirrorGlass);
      });

      // Heavy Aluminum Commercial Cargo Box with Corner Protectors
      const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(wid * 1.06, 1.85, 4.35), this.matPoliceDoorWhite);
      cargoBox.position.set(0, 1.55, -0.92);
      cargoBox.castShadow = true;
      vGroup.add(cargoBox);

      // Red / White Reflective Hazard Stripe Along Cargo Box Bottom
      [-wid * 0.535, wid * 0.535].forEach(sx => {
        const hazardStripe = new THREE.Mesh(new THREE.PlaneGeometry(4.30, 0.08), this.matCautionYellow);
        hazardStripe.position.set(sx, 0.72, -0.92);
        hazardStripe.rotation.y = sx > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
        vGroup.add(hazardStripe);
      });

      // Commercial Rear Roll-Up Door Frame & Cam Locking Rod
      const rearDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.94, 1.65, 0.06), this.matDarkTrim);
      rearDoorFrame.position.set(0, 1.55, -3.11);
      vGroup.add(rearDoorFrame);

      const lockingRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.55, 6), this.matChrome);
      lockingRod.position.set(0.15, 1.55, -3.15);
      vGroup.add(lockingRod);

      // Under-Chassis Diesel Fuel Tank (Right) & Battery Box (Left)
      const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 10), this.matChrome);
      fuelTank.rotation.z = Math.PI * 0.5;
      fuelTank.position.set(wid * 0.44, 0.42, 0.45);
      vGroup.add(fuelTank);

      const batteryBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, 0.85), this.matDarkTrim);
      batteryBox.position.set(-wid * 0.44, 0.42, 0.45);
      vGroup.add(batteryBox);

      // Heavy Commercial Front Bumper & Headlights
      const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(wid * 1.02, 0.28, 0.18), this.matDarkTrim);
      frontBumper.position.set(0, 0.45, 3.12);
      vGroup.add(frontBumper);

      [-wid * 0.42, wid * 0.42].forEach(x => {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.06), this.matHeadlight);
        head.position.set(x, 0.52, 3.14);
        vGroup.add(head);
      });

      // Commercial Taillight Bar with Heavy Steel Rear Step
      brakeLightMesh = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.88, 0.12, 0.06), this.matTaillight);
      brakeLightMesh.position.set(0, 0.45, -3.15);
      vGroup.add(brakeLightMesh);

      // Front Wheels & Heavy-Duty Dually Rear Wheels (2 Wheels Per Side on Rear Axle)
      const { wheelHub: fL, tireMesh: tFL } = this.createAutomotiveWheel(0.38, 0.26, 'steel_cop');
      fL.position.set(-wid * 0.48, 0.38, 2.25);
      vGroup.add(fL);
      wheels.push(tFL);

      const { wheelHub: fR, tireMesh: tFR } = this.createAutomotiveWheel(0.38, 0.26, 'steel_cop');
      fR.position.set(wid * 0.48, 0.38, 2.25);
      vGroup.add(fR);
      wheels.push(tFR);

      // Rear Duallies
      const { wheelHub: rL, tireMesh: tRL } = this.createAutomotiveWheel(0.38, 0.26, 'steel_cop', null, true);
      rL.position.set(-wid * 0.45, 0.38, -1.75);
      vGroup.add(rL);
      wheels.push(tRL);

      const { wheelHub: rR, tireMesh: tRR } = this.createAutomotiveWheel(0.38, 0.26, 'steel_cop', null, true);
      rR.position.set(wid * 0.45, 0.38, -1.75);
      vGroup.add(rR);
      wheels.push(tRR);
    }

    vGroup.userData = { wheels, brakeLightMesh };
    return vGroup;
  }

  initTrafficPool() {
    const types = ['sedan', 'pickup', 'suv', 'wagon', 'boxtruck'];

    for (let i = 0; i < this.maxVehicles; i++) {
      const type = types[i % types.length];
      const color = this.civilianColors[i % this.civilianColors.length];
      const vehicle = this.createCivilianVehicle(type, color);

      // Initial placement far down the highway so the start grid is 100% clear for the player
      const lane = (i % 2 === 0) ? 5.2 : -5.2; // Right lane vs Left lane
      const zPos = 450 + i * 110; // First car starts at 450m down the road
      const speedScale = PHYSICS.SPEED_SCALE || 0.60;
      const baseMps = (lane > 0) ? (20 + (i % 3) * 2.5) : (27 + (i % 4) * 2.0); // 45–65 mph
      const speed = baseMps * speedScale;

      vehicle.userData = {
        type: type,
        lane: lane,
        targetLane: lane,
        z: zPos,
        speed: speed,
        baseSpeed: speed,
        isActive: true,
        wheels: vehicle.userData.wheels || [],
        brakeLightMesh: vehicle.userData.brakeLightMesh
      };

      // Set initial transform far down the highway immediately
      const trans = this.splineRoad.getRoadTransformAtZ(zPos, lane, 0);
      if (trans) {
        vehicle.position.copy(trans.pos);
        vehicle.rotation.y = trans.heading;
      } else {
        vehicle.position.set(0, -999, zPos);
      }

      vehicle.visible = false; // Start hidden on intro screen
      this.group.add(vehicle);
      this.vehicles.push(vehicle);
    }
  }

  initFellowPlayers() {
    this.fellowPlayers = [];
    gameState.fellowPlayers = [];
  }

  update(dt, playerPos, playerSpeed) {
    if (dt > 0.08) dt = 0.08;

    // 0. Update Speed Radar Traps & Service Bays distance culling (ensures inactive shops stay hidden even during intro)
    this.updateRadarSpeedTraps(dt, playerPos, playerSpeed);
    this.updateServiceBays(dt, playerPos, playerSpeed);

    const isIntro = !gameState.hasGameStarted || gameState.isIntroActive || gameState.introState === 'orbit' || gameState.introState === 'transition';

    if (isIntro) {
      // Hide other cars completely during intro screen to eliminate lag and focus purely on hero car
      for (let i = 0; i < this.vehicles.length; i++) {
        if (this.vehicles[i].visible) this.vehicles[i].visible = false;
      }
      if (this.pursuitCruiser && this.pursuitCruiser.visible) {
        this.pursuitCruiser.visible = false;
      }
      return;
    }

    // Ensure traffic vehicles are visible once game begins
    for (let i = 0; i < this.vehicles.length; i++) {
      if (!this.vehicles[i].visible) this.vehicles[i].visible = true;
    }

    // 1. Update Fellow Player Cars (Starting grid idle & highway launch)
    this.updateFellowPlayers(dt, playerPos);

    // 2. Update Civilian Traffic
    this.updateCivilianTraffic(dt, playerPos, playerSpeed);

    // 4. Update Active Highway Patrol Police Pursuit AI & Attack System
    this.updatePolicePursuit(dt, playerPos, playerSpeed);
  }

  updateFellowPlayers(dt, playerPos) {
    gameState.fellowPlayers = [];
  }

  updateCivilianTraffic(dt, playerPos, playerSpeed) {
    if (gameState.isIntroActive) return; // Keep CPU/GPU fully dedicated to hero car during 360 intro

    const playerZ = playerPos.z;
    const speedScale = PHYSICS.SPEED_SCALE || 0.60;

    this.vehicles.forEach(vehicle => {
      const u = vehicle.userData;

      // Move forward along Highway 1 spline
      u.z += u.speed * dt;

      // Check if vehicle has fallen behind or gotten too far ahead -> recycle & respawn ahead
      const minAheadZ = Math.max(380, playerZ + 200);
      if (u.z < playerZ - this.spawnWindowBehind || (playerZ < 200 && u.z < 350)) {
        u.z = Math.max(minAheadZ, playerZ + this.spawnWindowAhead + Math.random() * 90);
        u.lane = (Math.random() > 0.5) ? 5.2 : -5.2;
        const baseMps = (u.lane > 0) ? (20 + Math.random() * 6) : (26 + Math.random() * 6);
        u.speed = baseMps * speedScale;
      } else if (u.z > playerZ + this.spawnWindowAhead + 140) {
        u.z = Math.max(minAheadZ, playerZ + this.spawnWindowAhead * 0.6 + Math.random() * 60);
      }

      // Smoothly follow spline road curvature & ground elevation
      const trans = this.splineRoad.getRoadTransformAtZ(u.z, u.lane, 0);
      if (trans) {
        vehicle.position.copy(trans.pos);
        vehicle.rotation.y = trans.heading;
      }

      // Spin wheels
      if (u.wheels) {
        const spinDelta = (u.speed / 0.32) * dt;
        u.wheels.forEach(w => { w.rotation.x += spinDelta; });
      }

      // Proximity check with player (Collision & Near-Miss Drafting)
      const dx = playerPos.x - vehicle.position.x;
      const dz = playerPos.z - vehicle.position.z;
      const distSq = dx * dx + dz * dz;

      // A. Collision detection (Lateral / bumper bump)
      if (distSq < 4.8) {
        const dist = Math.sqrt(distSq);
        const relSpeedMph = Math.abs((playerSpeed - u.speed) / speedScale) * 2.23694;

        if (this.physics && this.physics.applyImpact) {
          const impulseX = (dx / (dist + 0.001)) * 4.0;
          this.physics.applyImpact(impulseX, -2.0, relSpeedMph);
        }

        // Push civilian car away
        u.speed = Math.max(8.0 * speedScale, u.speed - 6.0 * speedScale);
        if (u.brakeLightMesh) u.brakeLightMesh.material = this.matBrakelight;
      }
      // B. Near-Miss Proximity Bonus & Slipstream Drafting
      else if (distSq < 10.5 && (playerSpeed / speedScale) > 34.0) { // > 76 mph within ~3.2m
        const now = performance.now();
        const lastMiss = this.nearMissCooldowns.get(vehicle) || 0;

        if (now - lastMiss > 3500) {
          this.nearMissCooldowns.set(vehicle, now);
          gameState.score += 250;
          gameState.driftScore += 150;

          // Trigger slipstream boost (free +8 nitro)
          gameState.nitro = Math.min(100.0, gameState.nitro + 8.0);

          if (window.game && window.game.sound && window.game.sound.triggerNearMiss) {
            window.game.sound.triggerNearMiss();
          }

          if (window.game && window.game.hud && window.game.hud.showNearMissToast) {
            window.game.hud.showNearMissToast(250);
          }
        }
      }
    });
  }

  updateRadarSpeedTraps(dt, playerPos, playerSpeed) {
    const playerZ = playerPos.z;
    const SPEED_SCALE = PHYSICS.SPEED_SCALE || 0.60;
    const playerSpeedMph = (typeof gameState.speedMph === 'number' && gameState.speedMph >= 0)
      ? gameState.speedMph
      : Math.round(Math.abs(playerSpeed / SPEED_SCALE) * 2.23694);

    let nearestRadarDist = Infinity;
    let inRadarZone = false;

    // Cougar Ridge 4x4 mountain corridor (Z 930-1570): no radar posts patrol the
    // off-road expedition trail, so silence the detector beep while on the mountain.
    const onMountain = playerZ >= 930 && playerZ <= 1570;

    this.radarPosts.forEach(post => {
      const cfg = post.config;
      const dz = cfg.z - playerZ;
      const isNear = Math.abs(dz) < 1400;
      if (post.group.visible !== isNear) post.group.visible = isNear;

      // Radar Detector range (within 450m ahead)
      if (dz > 0 && dz < 450) {
        inRadarZone = true;
        if (dz < nearestRadarDist) nearestRadarDist = dz;
      }

      // Speed Violation Detection Cone (within 45m of radar post)
      // Police strictly allow speeds up to 85 MPH; pursuit triggers ONLY if player exceeds 85 MPH
      if (Math.abs(dz) < 45) {
        if (playerSpeedMph > cfg.speedLimit) {
          // Launch / Escalate Highway Patrol Pursuit
          if (!this.pursuitState.active) {
            this.pursuitState.active = true;
            this.pursuitState.z = Math.max(0, playerZ - 38);
            this.pursuitState.lateralOffset = cfg.xOffset > 0 ? 10.5 : -10.5;
            this.pursuitState.speed = Math.max(playerSpeed * 0.95, 36.0);
            this.pursuitState.aiMode = 'SPAWN_PULLOUT';
            this.pursuitState.stateTimer = 1.0;
            this.pursuitState.attackCooldown = 2.4;
            this.pursuitState.contactTimer = 0;
            this.pursuitCruiser.visible = true;

            gameState.heatStars = Math.min(3, Math.max(1, (gameState.heatStars || 0) + 1));
            gameState.isEvading = false;
            gameState.evasionTimer = 5.0;
            gameState.pursuitActive = true;

            if (window.game && window.game.sound && window.game.sound.startPoliceSiren) {
              window.game.sound.startPoliceSiren();
            }

            if (window.game && window.game.hud && window.game.hud.showSpeedViolationToast) {
              window.game.hud.showSpeedViolationToast(playerSpeedMph, cfg.speedLimit);
            }

            if (window.game && window.game.hud && window.game.hud.showActionToast) {
              window.game.hud.showActionToast('🚨 POLICE PURSUIT ENGAGED', `SPEED VIOLATION: ${playerSpeedMph} MPH > ${cfg.speedLimit} MPH!`, 3500);
            }
          }
        }
      }
    });

    // Update Radar Detector HUD state
    if (inRadarZone && !onMountain) {
      gameState.radarActive = true;
      gameState.radarDistance = Math.round(nearestRadarDist);
      if (window.game && window.game.sound && window.game.sound.triggerRadarAlert) {
        window.game.sound.triggerRadarAlert(nearestRadarDist);
      }
    } else {
      gameState.radarActive = false;
      gameState.radarDistance = 0;
    }
  }

  triggerPolicePursuit() {
    if (!this.pursuitState) return;
    const playerZ = this.physics ? this.physics.position.z : 0;
    const playerSpeed = this.physics ? this.physics.speed : 30;

    this.pursuitState.active = true;
    this.pursuitState.z = Math.max(0, playerZ - 38);
    this.pursuitState.lateralOffset = 7.5;
    this.pursuitState.speed = Math.max(playerSpeed * 0.95, 36.0);
    this.pursuitState.health = 100;
    this.pursuitState.maxHealth = 100;
    this.pursuitState.aiMode = 'SPAWN_PULLOUT';
    this.pursuitState.stateTimer = 1.0;
    this.pursuitState.attackCooldown = 2.4;
    this.pursuitState.contactTimer = 0;
    this.pursuitState.wreckTimer = 0;
    this.pursuitState.spinMomentum = 0;
    this.pursuitState.rollMomentum = 0;
    this.pursuitState.verticalVel = 0;
    this.pursuitState.altitudeOffset = 0;
    this.pursuitState.headingOffset = 0;
    this.pursuitState.rollAngle = 0;
    this.pursuitState.pitchAngle = 0;
    this.pursuitCruiser.visible = true;

    const u = this.pursuitCruiser.userData;
    if (u) {
      if (u.smokeMesh) u.smokeMesh.visible = false;
      if (u.sparkMesh) u.sparkMesh.visible = false;
    }

    gameState.heatStars = Math.min(3, Math.max(1, (gameState.heatStars || 0) + 1));
    gameState.isEvading = false;
    gameState.evasionTimer = 6.0;
    gameState.pursuitActive = true;
    gameState.policeHealth = 100;

    if (window.game && window.game.sound && window.game.sound.startPoliceSiren) {
      window.game.sound.startPoliceSiren();
    }
  }

  triggerCopWreck(reason = 'TAKEDOWN') {
    const ps = this.pursuitState;
    if (!ps || !ps.active || ps.aiMode === 'WRECKED') return;

    ps.health = 0;
    gameState.policeHealth = 0;
    ps.aiMode = 'WRECKED';
    ps.wreckTimer = 3.4;
    ps.spinMomentum = (Math.random() > 0.5 ? 1 : -1) * (11.0 + Math.random() * 5.0);
    ps.rollMomentum = (Math.random() > 0.5 ? 1 : -1) * (7.0 + Math.random() * 4.0);
    ps.verticalVel = 4.2;

    if (window.game && window.game.sound) {
      if (window.game.sound.triggerCopTakedown) {
        window.game.sound.triggerCopTakedown();
      } else if (window.game.sound.triggerPoliceRam) {
        window.game.sound.triggerPoliceRam(2.0);
      }
    }

    let title = '💥 POLICE TAKEDOWN!';
    let msg = 'INTERCEPTOR CRUSHED &bull; PURSUIT BROKEN! +2,500 PTS';
    if (reason === 'BRAKE_CHECK') {
      title = '🛑 BRUTAL BRAKE-CHECK TAKEDOWN!';
      msg = 'POLICE SMASHED REAR BUMPER & FLIPPED! +3,000 PTS';
    } else if (reason === 'SIDE_SLAM') {
      title = '💥 PIT-REVERSAL SIDE-SLAM!';
      msg = 'POLICE INTERCEPTOR DEFLECTED & WRECKED! +3,000 PTS';
    } else if (reason === 'TRAFFIC') {
      title = '💥 TRAFFIC INTERCEPTION TAKEDOWN!';
      msg = 'POLICE CRUSHED IN CIVILIAN TRAFFIC! +3,500 PTS';
    } else if (reason === 'GUARDRAIL') {
      title = '💥 BARRIER CRASH TAKEDOWN!';
      msg = 'POLICE OVERSHOT & SMASHED STEEL GUARDRAIL! +3,000 PTS';
    }

    gameState.score += 3000;
    gameState.driftScore += 1500;
    gameState.nitro = Math.min(100, (gameState.nitro || 0) + 50); // Reward nitro for aggressive takedown

    if (window.game && window.game.hud && window.game.hud.showActionToast) {
      window.game.hud.showActionToast(title, msg, 3600);
    }
  }

  /**
   * Tactical Police Pursuit Interceptor AI, Attacks, Counter-Attacks & Siren Lighting
   */
  updatePolicePursuit(dt, playerPos, playerSpeed) {
    const ps = this.pursuitState;
    if (!ps || !ps.active) {
      if (this.pursuitCruiser && this.pursuitCruiser.visible) {
        this.pursuitCruiser.visible = false;
      }
      return;
    }

    const u = this.pursuitCruiser.userData;
    const playerZ = playerPos.z;
    const gapZ = playerZ - ps.z; // Positive = player is ahead

    const dx = playerPos.x - this.pursuitCruiser.position.x;
    const dz = playerPos.z - this.pursuitCruiser.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    gameState.policeDistance = Math.round(dist);
    gameState.pursuitActive = true;
    gameState.policeHealth = ps.health;

    // 0. Handle Wrecked Animation Sequence
    if (ps.aiMode === 'WRECKED') {
      ps.wreckTimer -= dt;
      ps.speed = THREE.MathUtils.damp(ps.speed, 0, 3.5, dt);
      ps.lateralOffset += (ps.spinMomentum > 0 ? 1.8 : -1.8) * dt;

      ps.headingOffset += ps.spinMomentum * dt;
      ps.rollAngle += ps.rollMomentum * dt;
      ps.spinMomentum = THREE.MathUtils.damp(ps.spinMomentum, 0, 1.6, dt);
      ps.rollMomentum = THREE.MathUtils.damp(ps.rollMomentum, 0, 2.0, dt);

      ps.verticalVel -= 14.0 * dt;
      ps.altitudeOffset = Math.max(0, ps.altitudeOffset + ps.verticalVel * dt);

      if (u) {
        if (u.smokeMesh) {
          u.smokeMesh.visible = true;
          const pulse = 1.0 + Math.sin(performance.now() * 0.02) * 0.45;
          u.smokeMesh.scale.set(pulse, pulse, pulse);
        }
        if (u.sparkMesh) {
          u.sparkMesh.visible = (ps.wreckTimer > 1.2);
        }
        if (u.lightL) u.lightL.material = this.matLightbarOff;
        if (u.lightR) u.lightR.material = this.matLightbarOff;
        if (u.grilleL) u.grilleL.material = this.matLightbarOff;
        if (u.grilleR) u.grilleR.material = this.matLightbarOff;
        if (u.pointLightRed) u.pointLightRed.intensity = 0;
        if (u.pointLightBlue) u.pointLightBlue.intensity = 0;
      }

      ps.z += ps.speed * dt;
      const cTrans = this.splineRoad.getRoadTransformAtZ(ps.z, ps.lateralOffset, 0);
      if (cTrans) {
        this.pursuitCruiser.position.copy(cTrans.pos);
        this.pursuitCruiser.position.y += ps.altitudeOffset;
        this.pursuitCruiser.rotation.y = cTrans.heading + ps.headingOffset;
        this.pursuitCruiser.rotation.z = ps.rollAngle;
        this.pursuitCruiser.rotation.x = Math.sin(ps.wreckTimer * 8.0) * 0.25;
      }

      gameState.pursuitWarning = '💥 COP WRECKED! PURSUIT NEUTRALIZED!';
      gameState.policeAttackType = null;

      if (ps.wreckTimer <= 0) {
        this.endPursuit(true, true);
      }
      return;
    }

    // 1. Dynamic 3D Siren Lightbar & PointLights Strobing
    ps.lightbarFlasher += dt * 20.0;
    const flashStep = Math.floor(ps.lightbarFlasher) % 4;
    const isRedLit = (flashStep === 0 || flashStep === 1);
    const isBlueLit = (flashStep === 2 || flashStep === 3);

    if (u) {
      if (u.lightL) u.lightL.material = isRedLit ? this.matLightbarRed : this.matLightbarOff;
      if (u.lightR) u.lightR.material = isBlueLit ? this.matLightbarBlue : this.matLightbarOff;
      if (u.grilleL) u.grilleL.material = isRedLit ? this.matLightbarRed : this.matLightbarOff;
      if (u.grilleR) u.grilleR.material = isBlueLit ? this.matLightbarBlue : this.matLightbarOff;
      if (u.pointLightRed) u.pointLightRed.intensity = isRedLit ? 4.5 : 0;
      if (u.pointLightBlue) u.pointLightBlue.intensity = isBlueLit ? 4.5 : 0;
      if (u.smokeMesh) u.smokeMesh.visible = (ps.health < 40);
    }

    // 2. Audio Distance Attenuation & Urgency
    const isAttacking = (ps.aiMode === 'RAM_SURGE' || ps.aiMode === 'PIT_ATTACK');
    if (window.game && window.game.sound && window.game.sound.updatePoliceSiren) {
      window.game.sound.updatePoliceSiren(dist, isAttacking);
    }

    // 3. Compute Player's Lateral Highway Centerline Offset & Read Controls
    const pTrans = this.splineRoad.getRoadTransformAtZ(playerZ, 0, 0);
    let playerRoadOffset = 0;
    if (pTrans && pTrans.normal) {
      const toPlayer = new THREE.Vector3().subVectors(playerPos, pTrans.pos);
      playerRoadOffset = toPlayer.dot(pTrans.normal);
    }
    playerRoadOffset = THREE.MathUtils.clamp(playerRoadOffset, -7.5, 7.5);

    const input = (window.game && window.game.input && typeof window.game.input.getInput === 'function')
      ? window.game.input.getInput()
      : {
          steer: gameState.steerInput || 0,
          throttle: gameState.throttleInput || 0,
          brake: gameState.brakeInput || 0,
          handbrake: !!gameState.handbrake,
          nitro: !!gameState.isBoosting
        };
    const now = performance.now();
    const copIsLeft = (ps.lateralOffset < playerRoadOffset);

    // 4. PLAYER COUNTER-ATTACK DETECTION (Player can smash, reverse-PIT, or brake-check cop)
    const isAlongside = Math.abs(gapZ) < 5.2 && Math.abs(dx) < 3.2;
    const isSteeringIntoCop = isAlongside && (
      (copIsLeft && (input.steer < -0.20 || (this.physics && this.physics.angularVelocity.z > 1.2))) ||
      (!copIsLeft && (input.steer > 0.20 || (this.physics && this.physics.angularVelocity.z < -1.2)))
    );

    // A. Defensive Side-Slam / Counter-PIT onto Cop
    if (isSteeringIntoCop && (now - ps.lastPlayerAttackTime > 550)) {
      ps.lastPlayerAttackTime = now;
      const dmg = 45 + Math.floor(Math.random() * 20);
      ps.health = Math.max(0, ps.health - dmg);
      gameState.policeHealth = ps.health;

      // Deflect cop laterally away with torque
      // Deflect cop laterally away with torque
      ps.lateralOffset += copIsLeft ? -3.8 : 3.8;
      ps.headingOffset += copIsLeft ? -0.35 : 0.35;
      ps.speed *= 0.65; // Stun cop speed on side impact
      ps.attackCooldown = 3.5;
      ps.aiMode = 'CATCH_UP';

      if (window.game && window.game.sound && window.game.sound.triggerPoliceRam) {
        window.game.sound.triggerPoliceRam(1.5);
      }

      if (ps.health <= 0) {
        this.triggerCopWreck('SIDE_SLAM');
        return;
      } else {
        if (window.game && window.game.hud && window.game.hud.showActionToast) {
          window.game.hud.showActionToast('💥 COUNTER-RAM HIT!', `POLICE INTERCEPTOR DAMAGED! HP: ${ps.health}%`, 2200);
        }
      }
    }

    // B. Brake-Check Evasion (Player slams brakes when cop is on rear bumper)
    const isDirectlyBehind = (gapZ < 5.8 && gapZ > -1.2 && Math.abs(dx) < 2.2);
    const isHardBraking = (input.brake > 0.35 || input.handbrake);

    if (isDirectlyBehind && isHardBraking && (now - ps.lastPlayerAttackTime > 650) && (ps.aiMode === 'RAM_SURGE' || ps.speed > playerSpeed + 2.0)) {
      ps.lastPlayerAttackTime = now;
      const dmg = 50 + Math.floor(Math.random() * 25);
      ps.health = Math.max(0, ps.health - dmg);
      gameState.policeHealth = ps.health;

      ps.speed = playerSpeed * 0.35; // Severe front-end crush deceleration
      ps.attackCooldown = 4.0;
      ps.aiMode = 'CATCH_UP';

      if (window.game && window.game.sound && window.game.sound.triggerPoliceRam) {
        window.game.sound.triggerPoliceRam(1.6);
      }

      if (ps.health <= 0) {
        this.triggerCopWreck('BRAKE_CHECK');
        return;
      } else {
        if (window.game && window.game.hud && window.game.hud.showActionToast) {
          window.game.hud.showActionToast('🛑 BRAKE-CHECK HIT!', `POLICE NOSE CRUSHED! HP: ${ps.health}%`, 2400);
        }
      }
    }

    // C. Guardrail Baiting (Cop driven off road into barrier)
    if (Math.abs(ps.lateralOffset) > 13.5 && ps.speed > 22.0) {
      const dmg = 55 + Math.floor(Math.random() * 30);
      ps.health = Math.max(0, ps.health - dmg);
      gameState.policeHealth = ps.health;
      ps.lateralOffset = Math.sign(ps.lateralOffset) * 11.5;
      ps.speed *= 0.45;
      ps.attackCooldown = 3.8;

      if (window.game && window.game.sound && window.game.sound.triggerPoliceRam) {
        window.game.sound.triggerPoliceRam(1.8);
      }

      if (ps.health <= 0) {
        this.triggerCopWreck('GUARDRAIL');
        return;
      } else {
        if (window.game && window.game.hud && window.game.hud.showActionToast) {
          window.game.hud.showActionToast('💥 GUARDRAIL DEFLECTION!', `POLICE HIT BARRIER! HP: ${ps.health}%`, 2200);
        }
      }
    }

    // D. Civilian Traffic Baiting
    if (this.vehicles && this.vehicles.length > 0) {
      for (let v of this.vehicles) {
        const vdz = Math.abs(v.userData.z - ps.z);
        const vdx = Math.abs(v.userData.lane - ps.lateralOffset);
        if (vdz < 3.4 && vdx < 2.1) {
          v.userData.speed = THREE.MathUtils.damp(v.userData.speed, 0, 5.0, dt);
          v.userData.lane += (Math.random() > 0.5 ? 3.2 : -3.2);
          this.triggerCopWreck('TRAFFIC');
          return;
        }
      }
    }

    // 5. Pursuit AI Dynamics & Realistic Top Speed Balancing
    // Police cruiser top speed: ~148 MPH, Burst Ram: ~156 MPH
    const SPEED_SCALE = PHYSICS.SPEED_SCALE || 0.60;
    const COP_MAX_PURSUIT_SPEED = (148.0 * 0.44704) * SPEED_SCALE;
    const COP_BURST_ATTACK_SPEED = (156.0 * 0.44704) * SPEED_SCALE;

    // A. Road Curvature Slowdown: Heavier highway patrol cruisers must brake in tight corners
    let corneringSlowdown = 1.0;
    const copTransCur = this.splineRoad ? this.splineRoad.getRoadTransformAtZ(ps.z, 0, 0) : null;
    const copTransAhead = this.splineRoad ? this.splineRoad.getRoadTransformAtZ(ps.z + 35, 0, 0) : null;
    if (copTransCur && copTransAhead && copTransCur.tangent && copTransAhead.tangent) {
      const dotT = THREE.MathUtils.clamp(copTransCur.tangent.dot(copTransAhead.tangent), -1, 1);
      const curveAngle = Math.acos(dotT);
      if (curveAngle > 0.035) {
        corneringSlowdown = Math.max(0.72, 1.0 - (curveAngle - 0.035) * 2.8);
      }
    }

    // B. Civilian Traffic Obstruction: Cruiser must steer and brake if civilian vehicle blocks path
    let trafficObstructionSlowdown = 1.0;
    if (this.vehicles && this.vehicles.length > 0) {
      for (let v of this.vehicles) {
        const vdz = v.userData.z - ps.z;
        const vdx = Math.abs(v.userData.lane - ps.lateralOffset);
        if (vdz > 6.0 && vdz < 32.0 && vdx < 3.2) {
          trafficObstructionSlowdown = Math.min(trafficObstructionSlowdown, 0.72);
          ps.lateralOffset += (ps.lateralOffset > v.userData.lane ? 3.2 : -3.2) * dt * 2.5;
        }
      }
    }

    ps.stateTimer -= dt;
    ps.attackCooldown -= dt;

    if (ps.aiMode === 'SPAWN_PULLOUT') {
      const pulloutTargetSpeed = Math.min(COP_MAX_PURSUIT_SPEED, Math.max(playerSpeed + 9.0 * (SPEED_SCALE / 1.70), 44.0 * (SPEED_SCALE / 1.70))) * corneringSlowdown;
      ps.lateralOffset = THREE.MathUtils.damp(ps.lateralOffset, playerRoadOffset, 4.0, dt);
      ps.speed = THREE.MathUtils.damp(ps.speed, pulloutTargetSpeed, 5.5, dt);
      gameState.pursuitWarning = '🚨 POLICE INTERCEPTOR DISPATCHED!';
      gameState.policeAttackType = null;

      if (ps.stateTimer <= 0) {
        ps.aiMode = 'CATCH_UP';
      }
    } else if (ps.aiMode === 'CATCH_UP') {
      // Interceptor pursuit speed:
      // If player's car has good health, player (160-195 MPH) outruns the cruiser (capped at 148 MPH).
      // If player's car is damaged (110-135 MPH), cruiser (148 MPH) rapidly catches up!
      let targetCopSpeed = Math.min(COP_MAX_PURSUIT_SPEED, Math.max(playerSpeed + 9.0 * (SPEED_SCALE / 1.70), 48.0 * (SPEED_SCALE / 1.70)));
      if (gapZ > 75 && corneringSlowdown > 0.90) {
        targetCopSpeed = COP_MAX_PURSUIT_SPEED;
      }
      if (gapZ < 14) targetCopSpeed = Math.min(targetCopSpeed, playerSpeed + 3.0 * (SPEED_SCALE / 1.70));
      if (gapZ < 4) targetCopSpeed = Math.min(targetCopSpeed, playerSpeed - 0.5 * (SPEED_SCALE / 1.70));

      targetCopSpeed *= (corneringSlowdown * trafficObstructionSlowdown);

      ps.speed = THREE.MathUtils.damp(ps.speed, targetCopSpeed, 4.2, dt);
      ps.lateralOffset = THREE.MathUtils.damp(ps.lateralOffset, playerRoadOffset, 3.8, dt);

      gameState.pursuitWarning = gapZ < 26 
        ? `⚠️ POLICE ON TAIL (HP: ${ps.health}%) • BRAKE-CHECK OR SIDE-SLAM!`
        : `🚨 POLICE PURSUIT (HP: ${ps.health}%) • BAIT INTO TRAFFIC!`;
      gameState.policeAttackType = null;

      // When close enough, select an attack tactic
      if (gapZ < 22 && gapZ > -6 && ps.attackCooldown <= 0) {
        const roll = Math.random();
        if (roll < 0.55 || (gameState.heatStars || 1) === 1) {
          ps.aiMode = 'RAM_SURGE';
          ps.stateTimer = 2.4;
          ps.currentAttack = 'RAM';
          if (window.game && window.game.sound && window.game.sound.triggerPoliceRadio) {
            window.game.sound.triggerPoliceRadio();
          }
        } else if (roll < 0.85) {
          ps.aiMode = 'PIT_ATTACK';
          ps.stateTimer = 3.2;
          ps.currentAttack = 'PIT';
          ps.pitSide = (ps.lateralOffset < playerRoadOffset) ? 'left' : 'right';
        } else {
          ps.aiMode = 'BOX_IN';
          ps.stateTimer = 2.8;
          ps.currentAttack = 'BOX_IN';
        }
      }
    } else if (ps.aiMode === 'RAM_SURGE') {
      // Ramming Surge: Full throttle attack into player's rear bumper
      gameState.pursuitWarning = '🚨 WARNING: POLICE RAM ATTACK! [BRAKE-CHECK TO WRECK!]';
      gameState.policeAttackType = 'RAM';

      const surgeTargetSpeed = Math.min(COP_BURST_ATTACK_SPEED, playerSpeed + 12.0 * (SPEED_SCALE / 1.70)) * (corneringSlowdown * trafficObstructionSlowdown);
      ps.speed = THREE.MathUtils.damp(ps.speed, surgeTargetSpeed, 6.5, dt);
      ps.lateralOffset = THREE.MathUtils.damp(ps.lateralOffset, playerRoadOffset, 6.0, dt);

      if (dist < 4.8 || (gapZ < 4.4 && gapZ > -2.0 && Math.abs(dx) < 2.3)) {
        if (now - ps.lastImpactTime > 750) {
          ps.lastImpactTime = now;
          const relSpeedMph = Math.max(55, Math.abs((ps.speed - playerSpeed) / SPEED_SCALE) * 2.23694 + 42);
          const impulseX = (Math.random() - 0.5) * 5.0;

          if (this.physics && this.physics.applyImpact) {
            this.physics.applyImpact(impulseX, -4.5, relSpeedMph);
          }

          if (window.game && window.game.sound && window.game.sound.triggerPoliceRam) {
            window.game.sound.triggerPoliceRam(1.3);
          }

          if (window.game && window.game.hud && window.game.hud.showActionToast) {
            window.game.hud.showActionToast('🚨 POLICE RAMMED!', 'HEAVY IMPACT &bull; LOSS OF TRACTION!', 2200);
          }

          ps.speed = playerSpeed * 0.80;
          ps.attackCooldown = 3.8;
          ps.aiMode = 'CATCH_UP';
        }
      }

      if (ps.stateTimer <= 0) {
        ps.aiMode = 'CATCH_UP';
        ps.attackCooldown = 3.2;
      }
    } else if (ps.aiMode === 'PIT_ATTACK') {
      // PIT Maneuver: Sweeps alongside rear quarter and hard-steers inward to spin player
      gameState.pursuitWarning = '🚨 WARNING: POLICE PIT ATTACK! [STEER INTO COP TO COUNTER-RAM!]';
      gameState.policeAttackType = 'PIT';

      const targetOffset = playerRoadOffset + (ps.pitSide === 'left' ? -2.2 : 2.2);
      const pitTargetSpeed = Math.min(COP_MAX_PURSUIT_SPEED, playerSpeed + 2.5) * (corneringSlowdown * trafficObstructionSlowdown);
      ps.speed = THREE.MathUtils.damp(ps.speed, pitTargetSpeed, 5.0, dt);
      ps.lateralOffset = THREE.MathUtils.damp(ps.lateralOffset, targetOffset, 4.5, dt);

      if (Math.abs(gapZ) < 3.8) {
        const steerInward = (ps.pitSide === 'left' ? 3.0 : -3.0);
        ps.lateralOffset += steerInward * dt * 3.5;

        if (dist < 4.4) {
          if (now - ps.lastImpactTime > 850) {
            ps.lastImpactTime = now;
            const torqueDir = (ps.pitSide === 'left' ? 1 : -1);

            if (this.physics) {
              this.physics.heading += torqueDir * 0.18;
              this.physics.angularVelocity.z += torqueDir * 10.0;
              if (this.physics.applyImpact) {
                this.physics.applyImpact(torqueDir * 7.0, -2.5, 65);
              }
            }

            if (window.game && window.game.sound && window.game.sound.triggerPoliceRam) {
              window.game.sound.triggerPoliceRam(1.1);
            }

            if (window.game && window.game.hud && window.game.hud.showActionToast) {
              window.game.hud.showActionToast('🚨 PIT MANEUVERED!', 'TAIL SPUN OUT &bull; RECOVER STEERING!', 2200);
            }

            ps.attackCooldown = 4.2;
            ps.aiMode = 'CATCH_UP';
          }
        }
      }

      if (ps.stateTimer <= 0) {
        ps.aiMode = 'CATCH_UP';
        ps.attackCooldown = 3.4;
      }
    } else if (ps.aiMode === 'BOX_IN') {
      // Box-in / Cut-off
      gameState.pursuitWarning = '🚨 WARNING: POLICE CUT-OFF! [RAM REAR QUARTER TO CRUSH!]';
      gameState.policeAttackType = 'BOX_IN';

      const boxTargetSpeed = Math.min(COP_BURST_ATTACK_SPEED, playerSpeed + 7.5) * (corneringSlowdown * trafficObstructionSlowdown);
      ps.speed = THREE.MathUtils.damp(ps.speed, boxTargetSpeed, 5.0, dt);
      ps.lateralOffset = THREE.MathUtils.damp(ps.lateralOffset, playerRoadOffset, 5.0, dt);

      if (gapZ < -3.5) {
        ps.speed = THREE.MathUtils.damp(ps.speed, playerSpeed * 0.72, 4.5, dt);
      }

      if (ps.stateTimer <= 0) {
        ps.aiMode = 'CATCH_UP';
        ps.attackCooldown = 3.8;
      }
    }

    // 6. Pinning & Arrest / Busted Detection
    if (playerSpeed < 4.2 && dist < 6.8) {
      ps.contactTimer += dt;
      gameState.bustedProgress = Math.min(1.0, ps.contactTimer / 2.2);
      const remaining = Math.max(0, 2.2 - ps.contactTimer).toFixed(1);
      gameState.pursuitWarning = `🚨 PULL OVER! BUSTED IN ${remaining}s`;

      if (ps.contactTimer >= 2.2 && !gameState.isBusted) {
        gameState.isBusted = true;
        if (window.game && window.game.sound && window.game.sound.triggerPoliceBusted) {
          window.game.sound.triggerPoliceBusted();
        }
        if (window.game && window.game.hud && window.game.hud.showBustedAlert) {
          window.game.hud.showBustedAlert();
        }
        setTimeout(() => {
          if (this.physics && this.physics.respawnOnRoad) {
            this.physics.respawnOnRoad();
          }
          this.endPursuit(false);
          gameState.isBusted = false;
        }, 3400);
      }
    } else {
      ps.contactTimer = Math.max(0, ps.contactTimer - dt * 1.5);
      gameState.bustedProgress = 0;
    }

    // 7. Evasion & Escape Verification
    // A. Pure high-speed outrunning (> 105m gap)
    // B. Tactical evasion through curves, traffic weaving, or post-counter-attack stun (> 68m gap)
    const isTacticalLOSBreak = (gapZ > 68 && (corneringSlowdown < 0.88 || trafficObstructionSlowdown < 0.85 || ps.speed < playerSpeed * 0.82));
    const isPureDistanceEscape = (gapZ > 105);

    if (isPureDistanceEscape || isTacticalLOSBreak) {
      gameState.isEvading = true;
      gameState.evasionTimer -= dt;
      const evMsg = isTacticalLOSBreak ? 'TACTICAL EVASION' : 'OUTRUNNING COP';
      gameState.pursuitWarning = `🚨 ${evMsg}... ${Math.ceil(gameState.evasionTimer)}s [MAINTAIN GAP!]`;
      if (gameState.evasionTimer <= 0) {
        if (window.game && window.game.hud && window.game.hud.showEvadedToast) {
          window.game.hud.showEvadedToast(500);
        }
        this.endPursuit(true, false);
      }
    } else if (gapZ < 60) {
      gameState.isEvading = false;
      gameState.evasionTimer = 5.0;
    }

    // 8. Update 3D Spline Transform & Spin Wheels
    ps.z += ps.speed * dt;
    const cTrans = this.splineRoad.getRoadTransformAtZ(ps.z, ps.lateralOffset, 0);
    if (cTrans) {
      this.pursuitCruiser.position.copy(cTrans.pos);
      this.pursuitCruiser.rotation.y = cTrans.heading + ps.headingOffset;
      ps.headingOffset = THREE.MathUtils.damp(ps.headingOffset, 0, 4.0, dt);
    }

    if (u && u.wheels) {
      const spinDelta = (ps.speed / 0.32) * dt;
      u.wheels.forEach(w => { w.rotation.x += spinDelta; });
    }
  }

  endPursuit(escaped = true, copWrecked = false) {
    const ps = this.pursuitState;
    if (!ps) return;

    ps.active = false;
    ps.aiMode = 'RETREAT';
    this.pursuitCruiser.visible = false;

    const u = this.pursuitCruiser.userData;
    if (u) {
      if (u.pointLightRed) u.pointLightRed.intensity = 0;
      if (u.pointLightBlue) u.pointLightBlue.intensity = 0;
      if (u.smokeMesh) u.smokeMesh.visible = false;
      if (u.sparkMesh) u.sparkMesh.visible = false;
    }

    gameState.pursuitActive = false;
    gameState.isEvading = false;
    gameState.pursuitWarning = '';
    gameState.policeAttackType = null;
    gameState.policeHealth = 100;
    gameState.heatStars = Math.max(0, (gameState.heatStars || 1) - 1);

    if (window.game && window.game.sound && window.game.sound.stopPoliceSiren) {
      window.game.sound.stopPoliceSiren();
    }

    if (escaped) {
      const bonus = copWrecked ? 2500 : 1000;
      gameState.score += bonus;
      gameState.driftScore += 500;
      if (window.game && window.game.hud && window.game.hud.showEvadedToast) {
        window.game.hud.showEvadedToast(bonus);
      }
    }
  }

  updateServiceBays(dt, playerPos, playerSpeed) {
    const playerZ = playerPos.z;
    const playerX = playerPos.x;
    const time = gameState.gameTime || 0;

    // 1. Animate 3D Floating Holographic Wrench Markers & Distance Cull Inactive Shops
    if (this.serviceBayMeshes) {
      this.serviceBayMeshes.forEach((item, idx) => {
        const isNear = Math.abs(item.bay.z - playerZ) < 1600;
        if (item.group.visible !== isNear) item.group.visible = isNear;
        if (isNear && item.wrench) {
          item.wrench.rotation.y += dt * 2.2;
          item.wrench.position.y = 7.5 + Math.sin(time * 2.8 + idx * 0.7) * 0.45;
        }
      });
    }

    // 2. Determine Nearest Forward Auto Repair Shop for HUD GPS Telemetry
    let nearestForwardBay = null;
    let minForwardDist = Infinity;
    let nearestAnyBay = null;
    let minAnyDist = Infinity;

    this.serviceBays.forEach(bay => {
      const dz = bay.z - playerZ;
      const absDz = Math.abs(dz);

      if (absDz < minAnyDist) {
        minAnyDist = absDz;
        nearestAnyBay = bay;
      }
      if (dz >= -25 && dz < minForwardDist) {
        minForwardDist = dz;
        nearestForwardBay = bay;
      }
    });

    const targetShop = nearestForwardBay || nearestAnyBay;
    if (targetShop) {
      gameState.nearestShopName = targetShop.name;
      gameState.nearestShopDist = Math.max(0, Math.round(targetShop.z - playerZ));
    }

    // 3. Check if Player is Pulling into a Service Bay
    let isNearBay = false;

    this.serviceBays.forEach(bay => {
      const dz = bay.z - playerZ;
      if (Math.abs(dz) < 45) {
        const lateral = bay.side === 'right' ? -28.0 : 28.0;
        const trans = this.splineRoad.getRoadTransformAtZ(bay.z, lateral, 0);
        if (trans) {
          const cosH = Math.cos(trans.heading);
          const sinH = Math.sin(trans.heading);
          const padWorldX = trans.pos.x + 8.0 * cosH;
          const padWorldZ = trans.pos.z - 8.0 * sinH;
          const dist = Math.hypot(playerX - padWorldX, playerZ - padWorldZ);

          if (dist < (bay.radius || 26.0)) {
            isNearBay = true;

            // Player has pulled in and stopped/slowed down (< 6.0 m/s / ~13.5 mph)
            if (playerSpeed < 6.0 && !gameState.isTowing) {
              if (!this.servicedThisVisit && !gameState.isMechanicCinematic) {
                this.servicedThisVisit = true;
                if (window.game && window.game.mechanicSceneManager) {
                  window.game.mechanicSceneManager.startMechanicScene(bay);
                } else if (this.physics && this.physics.repairVehicle) {
                  this.physics.repairVehicle();
                }
              }
            }
          }
        }
      }
    });

    if (gameState.isMechanicCinematic) {
      this.servicedThisVisit = true;
    }

    if (!isNearBay) {
      this.serviceTimer = 0;
      this.servicedThisVisit = false;
      if (!gameState.isMechanicCinematic) {
        gameState.isServicing = false;
        gameState.serviceProgress = 0;
      }
    }
  }
}
