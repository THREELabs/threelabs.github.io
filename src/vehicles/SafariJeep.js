import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gameState } from '../state.js';

/**
 * Museum-Quality Cel-Shaded Old Safari Expedition Jeep (Overland 4x4)
 * "A vehicle that looks like it travels all the time"
 * 
 * Master Features & Overland Equipment:
 * - Classic rugged 4x4 chassis: Boxy open-cab silhouette, exposed ladder frame, high-clearance wheel arches
 * - Front Fascia: Vintage 7-slot vertical grille, round sealed-beam halogen headlights with wire stone guards,
 *   amber turn indicator lenses, heavy-duty tubular steel front bumper with welded recovery D-shackles
 * - Recovery Winch: Center-mounted electric Warn-style winch with wound steel cable, roller fairleads, and safety red hook
 * - Bumper Driving Lamps: Twin vintage round yellow amber fog lamps mounted on the bumper hoop
 * - Safari Hood: Flat tapered hood with functional center louvers, external rubber tie-down latches, and windshield resting bumpers
 * - Snorkel: High-mount matte black off-road snorkel running up passenger A-pillar with cyclone pre-cleaner intake cap
 * - Fold-Down Windshield: Heavy-duty metal windshield frame with dual top wipers and tinted safari glass
 * - Safari Half-Doors: Cutaway steel half-doors with rugged latches and square trail mirrors on steel stalks
 * - Full Tubular Roll Cage: Heavy-duty 6-point DOM steel safety cage protecting the open cabin
 * - Expedition Safari Roof Rack Basket:
 *   - Quad round KC-style safari spotlights facing forward with yellow lenses and stone guards
 *   - Dual NATO steel Jerry cans (red fuel can, olive water can) in side-locking cages
 *   - 2x Strapped heavy-duty overland storage cargo crates / ammo boxes
 *   - High-traction orange recovery traction boards (MaxTrax style) clamped to the rack flank
 *   - Waterproof canvas rooftop tent / swag bedroll secured with leather cinch straps
 *   - Trail recovery shovel clamped to the rack side
 * - Rear Tailgate & Equipment:
 *   - Heavy-duty swing-out tubular rear tire carrier bearing a full-size 5th matching beadlock off-road wheel & knobby tire
 *   - Vertically mounted cast-steel 48-inch Hi-Lift farm recovery jack
 *   - Classic rectangular red/amber taillights with reverse lenses
 *   - Rear steel step bumper with 2-inch receiver hitch (compatible with TowTruckManager)
 *   - Flexible CB radio whip antenna with fluttering orange trail pennant flag
 * - Running Gear:
 *   - 4x Chunky 35-inch knobby mud-terrain balloon tires on steel beadlock wheels with perimeter bolts & front locking hubs
 *   - Visible solid live front & rear beam axles, differential pumpkins, steering tie-rods, and coil springs
 * - Progressive Multi-Point Damage:
 *   - Detachable square mirrors, half-doors, hood, rear spare tire carrier
 *   - Crumpling bumper, buckled hood, cracked windshield, radiator steam, and full Auto Shop repairability
 */
export class SafariJeep {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.group = new THREE.Group();
    this.group.rotation.order = 'YXZ';

    // Vintage Safari Paint Palettes
    this.paintPalette = [
      { name: 'Sahara Sand', color: 0xc2a679, accent: 0x3a352c },
      { name: 'Olive Drab Safari', color: 0x4a5840, accent: 0x272b22 },
      { name: 'Golden Eagle Mustard', color: 0xe5a93b, accent: 0x222220 },
      { name: 'Red Rock Canyon Rust', color: 0x9c412b, accent: 0x2a221f },
      { name: 'Pacific Trail Blue', color: 0x3c6b75, accent: 0x1f2a2e },
      { name: 'Sierra Expedition White', color: 0xe8e6df, accent: 0x26282b }
    ];
    this.currentPaletteIndex = 0;

    const initialSpec = this.paintPalette[0];
    const primaryColor = options.primaryColor || initialSpec.color;
    const steelDark = 0x1e2226;       // Heavy-duty powder-coated steel
    const chassisBlack = 0x15171a;    // Underbody ladder frame
    const canvasColor = 0xb09e80;     // Weathered safari canvas
    const oliveDrab = 0x485338;       // Jerry can / ammo crate olive
    const fuelRed = 0xb92b27;         // NATO fuel can red
    const tractionOrange = 0xdd6b20;  // Recovery sand ladder orange
    const leatherBrown = 0x6b4423;    // Straps and accents

    // Photorealistic Overland PBR Materials
    this.matPaint = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.42,
      metalness: 0.28
    });

    this.matSteel = new THREE.MeshStandardMaterial({
      color: steelDark,
      roughness: 0.58,
      metalness: 0.72
    });

    this.matChassis = new THREE.MeshStandardMaterial({
      color: chassisBlack,
      roughness: 0.82,
      metalness: 0.45
    });

    this.matCanvas = new THREE.MeshStandardMaterial({
      color: canvasColor,
      roughness: 0.92,
      metalness: 0.02
    });

    this.matOlive = new THREE.MeshStandardMaterial({
      color: oliveDrab,
      roughness: 0.55,
      metalness: 0.50
    });

    this.matFuelRed = new THREE.MeshStandardMaterial({
      color: fuelRed,
      roughness: 0.48,
      metalness: 0.52
    });

    this.matTractionOrange = new THREE.MeshStandardMaterial({
      color: tractionOrange,
      roughness: 0.65,
      metalness: 0.08
    });

    this.matLeather = new THREE.MeshStandardMaterial({
      color: leatherBrown,
      roughness: 0.72,
      metalness: 0.04
    });

    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xd4d8de,
      roughness: 0.12,
      metalness: 0.95
    });

    this.matDiamondPlate = new THREE.MeshStandardMaterial({
      color: 0x6e7681,
      roughness: 0.38,
      metalness: 0.82
    });

    this.matTire = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.94,
      metalness: 0.04
    });

    this.matRim = new THREE.MeshStandardMaterial({
      color: 0x24282e,
      roughness: 0.45,
      metalness: 0.75
    });

    this.matBeadlockRing = new THREE.MeshStandardMaterial({
      color: 0x8c959f,
      roughness: 0.32,
      metalness: 0.88
    });

    this.matGlass = renderer.createToonMaterial({
      color: 0x90b8cf,
      opacity: 0.25,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.matYellowLens = renderer.createToonMaterial({
      color: 0xf6ad55,
      gradientBands: 3
    });

    this.matHeadlightOn = new THREE.MeshBasicMaterial({
      color: 0xfff6d6
    });

    this.matFogLightOn = new THREE.MeshBasicMaterial({
      color: 0xffcc00
    });

    this.matTailRed = new THREE.MeshBasicMaterial({
      color: 0xd92626
    });

    this.matAmberBlinker = new THREE.MeshBasicMaterial({
      color: 0xf08c00
    });

    this.matScrape = renderer.createToonMaterial({
      color: 0x5a6068,
      gradientBands: 2
    });

    this.matBareMetal = renderer.createToonMaterial({
      color: 0x9aa0a6,
      gradientBands: 2
    });

    this.matCrackedGlass = renderer.createToonMaterial({
      color: 0xffffff,
      opacity: 0.65,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Multi-Point Damage State (100% compatible with test suite & HUD)
    this.damagePoints = {
      frontBumper: 0.0,
      frontSplitter: 0.0, // Winch skid plate
      hood: 0.0,
      fenderL: 0.0,
      fenderR: 0.0,
      doorL: 0.0,
      doorR: 0.0,
      rearHaunchL: 0.0,
      rearHaunchR: 0.0,
      rearWing: 0.0,       // Rear spare tire carrier & roof rack
      rearDiffuser: 0.0,
      windshield: 0.0,
      wheelAlignmentFL: 0.0,
      wheelAlignmentFR: 0.0,
      wheelAlignmentRL: 0.0,
      wheelAlignmentRR: 0.0
    };

    // Progressive Damage Breakdown State: 'attached' | 'hanging' | 'detached'
    this.partStates = {
      mirrorL: 'attached',
      mirrorR: 'attached',
      doorL: 'attached',
      doorR: 'attached',
      hood: 'attached',
      rearWing: 'attached',
      frontBumper: 'attached',
      jerryCanRed: 'attached',
      jerryCanOlive: 'attached',
      tractionBoard: 'attached',
      shovel: 'attached',
      snorkel: 'attached'
    };

    // Detached parts tracking (boolean flags for backward compatibility)
    this.detached = {
      mirrorL: false,
      mirrorR: false,
      doorL: false,
      doorR: false,
      hood: false,
      rearWing: false,
      frontBumper: false,
      jerryCanRed: false,
      jerryCanOlive: false,
      tractionBoard: false,
      shovel: false,
      snorkel: false
    };

    // Base rest transforms for seamless repair restoration
    this.baseTransforms = {
      mirrorL: { pos: new THREE.Vector3(-0.84, 1.12, 0.38), rot: new THREE.Euler(0, 0, 0) },
      mirrorR: { pos: new THREE.Vector3(0.84, 1.12, 0.38), rot: new THREE.Euler(0, 0, 0) },
      doorL: { pos: new THREE.Vector3(-0.76, 0.72, 0.46), rot: new THREE.Euler(0, 0, 0) },
      doorR: { pos: new THREE.Vector3(0.76, 0.72, 0.46), rot: new THREE.Euler(0, 0, 0) },
      hood: { pos: new THREE.Vector3(0, 0.88, 1.05), rot: new THREE.Euler(0, 0, 0) },
      rearCarrier: { pos: new THREE.Vector3(0, 0.88, -1.48), rot: new THREE.Euler(0, 0, 0) },
      frontBumper: { pos: new THREE.Vector3(0, 0.46, 1.84), rot: new THREE.Euler(0, 0, 0) }
    };

    // Wheel animation tracking
    this.wheels = [];
    this.wheelMounts = [];
    this.frontWheelHubs = [];
    this.frontWheelMeshes = [];
    this.rearWheelMeshes = [];

    // Sub-hierarchies
    this.bodyGroup = new THREE.Group();
    this.chassisGroup = new THREE.Group();
    this.cockpitGroup = new THREE.Group();
    this.roofRackGroup = new THREE.Group();
    this.bumperGroup = new THREE.Group();
    this.winchGroup = new THREE.Group();
    this.hoodGroup = new THREE.Group();
    this.fenderLGroup = new THREE.Group();
    this.fenderRGroup = new THREE.Group();
    this.doorLGroup = new THREE.Group();
    this.doorRGroup = new THREE.Group();
    this.mirrorLGroup = new THREE.Group();
    this.mirrorRGroup = new THREE.Group();
    this.rearCarrierGroup = new THREE.Group();
    this.windshieldGroup = new THREE.Group();
    this.damageVFXGroup = new THREE.Group();

    // Modular Overland Equipment Groups (can be detached during collisions)
    this.fuelCanGroup = new THREE.Group();
    this.waterCanGroup = new THREE.Group();
    this.tractionBoardsGroup = new THREE.Group();
    this.shovelGroup = new THREE.Group();

    this.group.add(this.chassisGroup);
    this.group.add(this.bodyGroup);
    this.group.add(this.cockpitGroup);
    this.group.add(this.roofRackGroup);
    this.group.add(this.damageVFXGroup);

    // Build the 3D Safari Vehicle
    this.buildLadderChassis();
    this.buildBodyTub();
    this.buildFrontFasciaAndGrille();
    this.buildWinchBumper();
    this.buildSafariHood();
    this.buildFendersAndSliders();
    this.buildWindshield();
    this.buildSafariDoors();
    this.buildRollCage();
    this.buildExpeditionRoofRack();
    this.buildRearTailgateAndCarrier();
    this.buildCockpit();
    this.buildRunningGearAndWheels();
    this.buildLighting();
    this.buildDamageMeshes();
    this.batchStaticMeshes();

    // Attach Camera Anchor Nodes
    this.cockpitCamNode = new THREE.Object3D();
    this.cockpitCamNode.position.set(-0.35, 1.12, 0.08); // Driver eye position behind safari wheel
    this.group.add(this.cockpitCamNode);

    this.hoodCamNode = new THREE.Object3D();
    this.hoodCamNode.position.set(0, 0.95, 1.35); // Over the hood looking forward
    this.group.add(this.hoodCamNode);

    // Dynamic Trail Effects (Antenna whip, backfire flash, etc.)
    this.antennaSway = 0.0;
    this.antennaSwayVel = 0.0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CHASSIS & LADDER FRAME
  // ─────────────────────────────────────────────────────────────────────────
  buildLadderChassis() {
    // Twin Heavy-Duty Steel Box-Section Frame Rails
    const railGeo = new THREE.BoxGeometry(0.12, 0.14, 3.8);
    const railL = new THREE.Mesh(railGeo, this.matChassis);
    railL.position.set(-0.46, 0.32, 0.0);
    const railR = new THREE.Mesh(railGeo, this.matChassis);
    railR.position.set(0.46, 0.32, 0.0);
    this.chassisGroup.add(railL, railR);

    // Crossmembers
    const crossZ = [-1.6, -0.6, 0.4, 1.4];
    crossZ.forEach(z => {
      const cm = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.10, 0.12), this.matChassis);
      cm.position.set(0, 0.32, z);
      this.chassisGroup.add(cm);
    });

    // Heavy-Duty Heavy Steel Skid Plate Under Transfer Case
    const skidGeo = new THREE.BoxGeometry(0.82, 0.04, 1.1);
    const skid = new THREE.Mesh(skidGeo, this.matSteel);
    skid.position.set(0, 0.24, 0.1);
    this.chassisGroup.add(skid);

    // Rear Tow-Hitch Receiver Bar (Z = -1.92, Y = 0.36)
    const hitchGeo = new THREE.BoxGeometry(0.12, 0.12, 0.35);
    const hitch = new THREE.Mesh(hitchGeo, this.matSteel);
    hitch.position.set(0, 0.36, -1.92);
    this.chassisGroup.add(hitch);

    // Classic 2-inch receiver hitch opening
    const hitchHole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), this.matChassis);
    hitchHole.position.set(0, 0.36, -2.08);
    this.chassisGroup.add(hitchHole);

    // ─────────────────────────────────────────────────────────────
    // Authentic 4x4 Overland Exhaust System & Rear Tailpipe
    // ─────────────────────────────────────────────────────────────
    // High-clearance cylindrical muffler tucked beside the passenger frame rail
    const mufflerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12);
    mufflerGeo.rotateX(Math.PI * 0.5);
    const muffler = new THREE.Mesh(mufflerGeo, this.matSteel);
    muffler.position.set(0.42, 0.32, -0.95);
    this.chassisGroup.add(muffler);

    // Mandrel-bent exhaust tubing over rear axle to tailpipe
    const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 10);
    pipeGeo.rotateX(Math.PI * 0.5);
    const tailpipe = new THREE.Mesh(pipeGeo, this.matSteel);
    tailpipe.position.set(0.48, 0.28, -1.55);
    this.chassisGroup.add(tailpipe);

    // Heavy-duty stainless steel exhaust tip angled slightly out rear-right
    const tipOuterGeo = new THREE.CylinderGeometry(0.052, 0.048, 0.22, 12);
    tipOuterGeo.rotateX(Math.PI * 0.5);
    const tipOuter = new THREE.Mesh(tipOuterGeo, this.matChrome);
    tipOuter.position.set(0.48, 0.27, -1.95);
    this.chassisGroup.add(tipOuter);

    // Darkened carbon-soot hollow bore interior
    const tipBoreGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.05, 12);
    tipBoreGeo.rotateX(Math.PI * 0.5);
    const tipBore = new THREE.Mesh(tipBoreGeo, this.matChassis);
    tipBore.position.set(0.48, 0.27, -2.05);
    this.chassisGroup.add(tipBore);

    // Chassis hanger bracket
    const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.03), this.matChassis);
    hanger.position.set(0.48, 0.33, -1.80);
    this.chassisGroup.add(hanger);

    // Precise world-space exhaust emission reference point
    this.exhaustTip = new THREE.Object3D();
    this.exhaustTip.position.set(0.48, 0.27, -2.08);
    this.group.add(this.exhaustTip);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. BODY TUB & CABIN
  // ─────────────────────────────────────────────────────────────────────────
  buildBodyTub() {
    // Main Lower Tub
    const tubGeo = new THREE.BoxGeometry(1.52, 0.46, 2.30);
    const tub = new THREE.Mesh(tubGeo, this.matPaint);
    tub.position.set(0, 0.62, -0.28);
    tub.castShadow = true;
    tub.receiveShadow = true;
    this.bodyGroup.add(tub);

    // Rear Quarter Panels (Boxy classic Jeep haunches)
    const haunchL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 1.25), this.matPaint);
    haunchL.position.set(-0.76, 0.76, -0.78);
    haunchL.castShadow = true;
    const haunchR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 1.25), this.matPaint);
    haunchR.position.set(0.76, 0.76, -0.78);
    haunchR.castShadow = true;
    this.bodyGroup.add(haunchL, haunchR);

    // Rear Tailgate Base
    const tgGeo = new THREE.BoxGeometry(1.42, 0.50, 0.10);
    const tailgate = new THREE.Mesh(tgGeo, this.matPaint);
    tailgate.position.set(0, 0.74, -1.41);
    tailgate.castShadow = true;
    this.bodyGroup.add(tailgate);

    // Embossed vintage 4x4 tailgate stamped center
    const stampGeo = new THREE.BoxGeometry(0.85, 0.22, 0.04);
    const stamp = new THREE.Mesh(stampGeo, this.matPaint);
    stamp.position.set(0, 0.74, -1.45);
    this.bodyGroup.add(stamp);

    // Embossed "4x4" badge
    const badgeGeo = new THREE.BoxGeometry(0.24, 0.08, 0.02);
    const badge = new THREE.Mesh(badgeGeo, this.matChrome);
    badge.position.set(0.42, 0.74, -1.46);
    this.bodyGroup.add(badge);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. FRONT FASCIA & 7-SLOT GRILLE
  // ─────────────────────────────────────────────────────────────────────────
  buildFrontFasciaAndGrille() {
    this.fasciaGroup = new THREE.Group();
    this.fasciaGroup.position.set(0, 0.78, 1.62);

    // Upright Front Grille Surround (Iconic flat vertical face)
    const surroundGeo = new THREE.BoxGeometry(1.42, 0.62, 0.08);
    const surround = new THREE.Mesh(surroundGeo, this.matPaint);
    surround.castShadow = true;
    this.fasciaGroup.add(surround);

    // Recessed Radiator Core Mesh (Dark metal backing)
    const radCore = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.44, 0.04), this.matChassis);
    radCore.position.set(0, 0.02, 0.02);
    this.fasciaGroup.add(radCore);

    // Iconic 7 Vertical Grille Slots
    const slotW = 0.055;
    const slotH = 0.38;
    const slotD = 0.06;
    const slotGeo = new THREE.BoxGeometry(slotW, slotH, slotD);
    const slotSpacing = 0.105;

    for (let i = -3; i <= 3; i++) {
      const slot = new THREE.Mesh(slotGeo, this.matPaint);
      slot.position.set(i * slotSpacing, 0.02, 0.035);
      this.fasciaGroup.add(slot);
    }

    // Classic Round Sealed-Beam Halogen Headlights (Left & Right)
    const lightHousingGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 18);
    lightHousingGeo.rotateX(Math.PI / 2);

    [-0.56, 0.56].forEach((x, idx) => {
      const housing = new THREE.Mesh(lightHousingGeo, this.matChrome);
      housing.position.set(x, 0.04, 0.04);

      const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 18);
      lensGeo.rotateX(Math.PI / 2);
      const lens = new THREE.Mesh(lensGeo, this.matHeadlightOn);
      lens.position.set(x, 0.04, 0.06);

      // Protective Steel Wire Stone Guard Grille over headlight
      const guardH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.01), this.matSteel);
      guardH.position.set(x, 0.04, 0.085);
      const guardV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.24, 0.01), this.matSteel);
      guardV.position.set(x, 0.04, 0.085);

      this.fasciaGroup.add(housing, lens, guardH, guardV);
    });

    // Round Amber Turn Signal Indicators (Mounted below headlights)
    const turnGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.03, 14);
    turnGeo.rotateX(Math.PI / 2);
    [-0.56, 0.56].forEach(x => {
      const turn = new THREE.Mesh(turnGeo, this.matAmberBlinker);
      turn.position.set(x, -0.16, 0.05);
      this.fasciaGroup.add(turn);
    });

    this.bodyGroup.add(this.fasciaGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. FRONT WINCH BUMPER & RECOVERY GEAR
  // ─────────────────────────────────────────────────────────────────────────
  buildWinchBumper() {
    this.bumperGroup.position.set(0, 0.46, 1.84);

    // Heavy-Duty Tubular Steel Rock-Crawler Bumper Main Bar
    const bumperBar = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.16, 0.18), this.matSteel);
    bumperBar.castShadow = true;
    this.bumperGroup.add(bumperBar);

    // Angled Bumper End Wings (Stubby rock clearance)
    [-0.82, 0.82].forEach((x, idx) => {
      const endWing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.16), this.matSteel);
      endWing.position.set(x, 0.02, -0.06);
      endWing.rotation.y = idx === 0 ? 0.35 : -0.35;
      this.bumperGroup.add(endWing);
    });

    // Center Bull-Bar Stinger / Protection Hoop
    const hoopTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.06), this.matSteel);
    hoopTop.position.set(0, 0.38, 0.04);
    const hoopL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), this.matSteel);
    hoopL.position.set(-0.34, 0.20, 0.04);
    hoopL.rotation.z = -0.12;
    const hoopR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), this.matSteel);
    hoopR.position.set(0.34, 0.20, 0.04);
    hoopR.rotation.z = 0.12;
    this.bumperGroup.add(hoopTop, hoopL, hoopR);

    // Electric Warn-Style Recovery Winch (Mounted on top plate)
    const winchBase = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.24), this.matSteel);
    winchBase.position.set(0, 0.12, 0.02);

    const winchMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), this.matSteel);
    winchMotor.rotation.z = Math.PI / 2;
    winchMotor.position.set(-0.16, 0.20, 0.02);

    const winchDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 12), this.matChrome);
    winchDrum.rotation.z = Math.PI / 2;
    winchDrum.position.set(0.02, 0.20, 0.02);

    const winchSolenoid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.14), this.matChassis);
    winchSolenoid.position.set(0.02, 0.32, 0.02);

    // Roller Fairlead and Bright Red Recovery Hook
    const fairlead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.04), this.matChrome);
    fairlead.position.set(0.02, 0.18, 0.16);

    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 8, 12, Math.PI * 1.5), this.matFuelRed);
    hook.position.set(0.02, 0.16, 0.20);
    hook.rotation.x = Math.PI / 2;

    this.winchGroup.add(winchBase, winchMotor, winchDrum, winchSolenoid, fairlead, hook);
    this.bumperGroup.add(this.winchGroup);

    // Dual Heavy-Duty D-Ring Recovery Shackles
    [-0.42, 0.42].forEach(x => {
      const clevisMount = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), this.matSteel);
      clevisMount.position.set(x, 0.0, 0.11);
      const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 12), this.matFuelRed);
      shackle.position.set(x, -0.04, 0.16);
      this.bumperGroup.add(clevisMount, shackle);
    });

    // Twin Bumper Driving / Fog Spotlights (Yellow Lenses)
    [-0.24, 0.24].forEach(x => {
      const fogHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14), this.matSteel);
      fogHousing.rotateX(Math.PI / 2);
      fogHousing.position.set(x, 0.26, 0.08);

      const fogLens = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 14), this.matFogLightOn);
      fogLens.rotateX(Math.PI / 2);
      fogLens.position.set(x, 0.26, 0.10);

      this.bumperGroup.add(fogHousing, fogLens);
    });

    this.bodyGroup.add(this.bumperGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. SAFARI HOOD & ENGINE BAY
  // ─────────────────────────────────────────────────────────────────────────
  buildSafariHood() {
    this.hoodGroup.position.set(0, 0.88, 1.05);

    // Main Tapered Hood Sheet Metal
    const hoodGeo = new THREE.BoxGeometry(1.28, 0.14, 1.15);
    const hood = new THREE.Mesh(hoodGeo, this.matPaint);
    hood.castShadow = true;
    hood.receiveShadow = true;
    this.hoodGroup.add(hood);

    // Center Elevated Power Bulge with Cooling Louvers
    const bulgeGeo = new THREE.BoxGeometry(0.68, 0.05, 0.95);
    const bulge = new THREE.Mesh(bulgeGeo, this.matPaint);
    bulge.position.set(0, 0.09, 0.02);
    this.hoodGroup.add(bulge);

    // Functional Black Louver Vent Slits
    for (let i = -3; i <= 3; i++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.01, 0.04), this.matChassis);
      louver.position.set(0, 0.12, i * 0.10);
      this.hoodGroup.add(louver);
    }

    // Classic External Rubber Side Hood Latches (Catch clamps on fender edge)
    [-0.64, 0.64].forEach(x => {
      const latchBase = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.06), this.matChassis);
      latchBase.position.set(x, 0.02, 0.22);
      const latchArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6), this.matSteel);
      latchArm.position.set(x, 0.02, 0.22);
      this.hoodGroup.add(latchBase, latchArm);
    });

    // Windshield Resting Rubber Bumpers (When fold-down windshield is lowered)
    [-0.32, 0.32].forEach(x => {
      const bumperBlock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.08), this.matChassis);
      bumperBlock.position.set(x, 0.09, -0.38);
      this.hoodGroup.add(bumperBlock);
    });

    // Center Footman Loop (Tie-down loop on hood)
    const footman = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 10, Math.PI), this.matChrome);
    footman.rotation.x = Math.PI / 2;
    footman.position.set(0, 0.12, -0.38);
    this.hoodGroup.add(footman);

    this.bodyGroup.add(this.hoodGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. FLAT FENDERS, ROCK SLIDERS & HIGH-MOUNT SNORKEL
  // ─────────────────────────────────────────────────────────────────────────
  buildFendersAndSliders() {
    // Front Flat Fenders (Classic Willys/CJ angular trapezoid flat fenders)
    const frontFenderGeo = new THREE.BoxGeometry(0.32, 0.10, 1.15);

    this.fenderLGroup.position.set(-0.78, 0.78, 1.05);
    const ffL = new THREE.Mesh(frontFenderGeo, this.matPaint);
    ffL.castShadow = true;
    const ffLipL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 1.15), this.matPaint);
    ffLipL.position.set(-0.16, -0.06, 0);
    ffLipL.castShadow = true;
    this.fenderLGroup.add(ffL, ffLipL);

    this.fenderRGroup.position.set(0.78, 0.78, 1.05);
    const ffR = new THREE.Mesh(frontFenderGeo, this.matPaint);
    ffR.castShadow = true;
    const ffLipR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 1.15), this.matPaint);
    ffLipR.position.set(0.16, -0.06, 0);
    ffLipR.castShadow = true;
    this.fenderRGroup.add(ffR, ffLipR);

    this.bodyGroup.add(this.fenderLGroup, this.fenderRGroup);

    // Rear High-Clearance Angular Flares
    [-0.86, 0.86].forEach((x, idx) => {
      const flareGeo = new THREE.BoxGeometry(0.16, 0.08, 0.95);
      const flare = new THREE.Mesh(flareGeo, this.matPaint);
      flare.position.set(x, 0.86, -0.78);
      flare.castShadow = true;
      this.bodyGroup.add(flare);
    });

    // Heavy-Duty Diamond-Plate Aluminum Rocker Guards / Rock Sliders
    [-0.80, 0.80].forEach(x => {
      const sliderGeo = new THREE.BoxGeometry(0.08, 0.14, 1.65);
      const slider = new THREE.Mesh(sliderGeo, this.matSteel);
      slider.position.set(x, 0.44, 0.0);
      slider.castShadow = true;

      // Outer Tubular Step Rail
      const stepTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.55, 8), this.matSteel);
      stepTube.rotation.x = Math.PI / 2;
      stepTube.position.set(x > 0 ? x + 0.12 : x - 0.12, 0.44, 0.0);
      stepTube.castShadow = true;

      this.bodyGroup.add(slider, stepTube);
    });

    // High-Mount Off-Road Snorkel (Runs up right A-pillar)
    this.snorkelGroup = new THREE.Group();
    this.snorkelGroup.position.set(0.78, 0.88, 0.52);

    // Lower tube coming from fender
    const snkLower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10), this.matChassis);
    snkLower.rotation.x = -Math.PI / 4;
    snkLower.position.set(0.06, 0.10, 0.0);

    // Vertical riser tube running alongside A-pillar
    const snkRiser = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.85, 10), this.matChassis);
    snkRiser.position.set(0.08, 0.58, -0.06);
    snkRiser.rotation.z = -0.04;

    // Cyclone / Mushroom Pre-Cleaner Top Intake Cap
    const snkCap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 14), this.matChassis);
    snkCap.position.set(0.10, 1.02, -0.06);

    const snkGrille = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14), this.matSteel);
    snkGrille.position.set(0.10, 0.98, -0.06);

    this.snorkelGroup.add(snkLower, snkRiser, snkCap, snkGrille);
    this.bodyGroup.add(this.snorkelGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // 7. FOLD-DOWN SAFARI WINDSHIELD (SEE-THROUGH HOLLOW FRAME & TINTED GLASS)
  // ─────────────────────────────────────────────────────────────────────────
  buildWindshield() {
    this.windshieldGroup.position.set(0, 1.15, 0.48);
    this.windshieldGroup.rotation.x = -0.12; // Slight vintage rake (~7 deg)

    const frameDepth = 0.055;

    // Upright Stamped Steel Frame Perimeter (Hollow structure allowing true see-through visibility)
    // Top Horizontal Header Rail
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, frameDepth), this.matPaint);
    topRail.position.set(0, 0.31, 0);
    topRail.castShadow = true;

    // Bottom Cowl Frame Rail
    const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, frameDepth), this.matPaint);
    bottomRail.position.set(0, -0.30, 0);
    bottomRail.castShadow = true;

    // Left A-Pillar Upright
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, frameDepth), this.matPaint);
    pillarL.position.set(-0.67, 0.01, 0);
    pillarL.castShadow = true;

    // Right A-Pillar Upright
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, frameDepth), this.matPaint);
    pillarR.position.set(0.67, 0.01, 0);
    pillarR.castShadow = true;

    // Center Vertical Divider Post (Iconic vintage Safari two-pane split)
    const centerPost = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.54, frameDepth), this.matPaint);
    centerPost.position.set(0, 0.01, 0);
    centerPost.castShadow = true;

    this.windshieldGroup.add(topRail, bottomRail, pillarL, pillarR, centerPost);

    // Weatherstripping Rubber Seals (Dark chassis beading framing each glass pane)
    [-0.325, 0.325].forEach(x => {
      const gTop = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.014, frameDepth + 0.004), this.matChassis);
      gTop.position.set(x, 0.273, 0);
      const gBottom = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.014, frameDepth + 0.004), this.matChassis);
      gBottom.position.set(x, -0.253, 0);
      const gSideIn = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.512, frameDepth + 0.004), this.matChassis);
      gSideIn.position.set(x > 0 ? x - 0.298 : x + 0.298, 0.01, 0);
      const gSideOut = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.512, frameDepth + 0.004), this.matChassis);
      gSideOut.position.set(x > 0 ? x + 0.298 : x - 0.298, 0.01, 0);
      this.windshieldGroup.add(gTop, gBottom, gSideIn, gSideOut);
    });

    // Fold-down windshield lower pivot brackets / hold-down hinges
    [-0.67, 0.67].forEach(x => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.035), this.matSteel);
      bracket.position.set(x, -0.30, 0.025);
      const hingePin = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.07, 8), this.matChrome);
      hingePin.rotation.z = Math.PI / 2;
      hingePin.position.set(x, -0.30, 0.032);
      this.windshieldGroup.add(bracket, hingePin);
    });

    // Transparent Glass Panes (Double-sided tinted automotive glass — completely see-through)
    const glassGeo = new THREE.PlaneGeometry(0.61, 0.54);
    const glassL = new THREE.Mesh(glassGeo, this.matGlass);
    glassL.position.set(-0.325, 0.01, 0);
    const glassR = new THREE.Mesh(glassGeo, this.matGlass);
    glassR.position.set(0.325, 0.01, 0);
    this.windshieldGroup.add(glassL, glassR);

    // Top-Mounted Vintage Windshield Wipers (Motor at top of frame)
    [-0.32, 0.32].forEach(x => {
      const wiperMotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.03), this.matChassis);
      wiperMotor.position.set(x, 0.30, 0.035);
      const wiperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 6), this.matSteel);
      wiperArm.position.set(x + 0.04, 0.14, 0.04);
      wiperArm.rotation.z = -0.35;
      const wiperBlade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.28, 0.01), this.matChassis);
      wiperBlade.position.set(x + 0.09, 0.12, 0.045);
      wiperBlade.rotation.z = -0.35;
      this.windshieldGroup.add(wiperMotor, wiperArm, wiperBlade);
    });

    // Lower Windshield Cowl Vent & Piano Hinge
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.03, 0.04), this.matChrome);
    hinge.position.set(0, -0.32, 0.02);
    this.windshieldGroup.add(hinge);

    // Cracked Spiderweb Glass Overlay (Activated on heavy rollover/crash)
    this.crackedWindshieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.54), this.matCrackedGlass);
    this.crackedWindshieldMesh.position.set(0, 0.01, 0.005);
    this.crackedWindshieldMesh.visible = false;
    this.windshieldGroup.add(this.crackedWindshieldMesh);

    this.bodyGroup.add(this.windshieldGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. SAFARI HALF-DOORS & TRAIL MIRRORS
  // ─────────────────────────────────────────────────────────────────────────
  buildSafariDoors() {
    // Left Cutaway Half-Door (hinged at front A-pillar z = +0.46)
    this.doorLGroup.position.set(-0.76, 0.72, 0.46);
    const doorGeo = new THREE.BoxGeometry(0.08, 0.44, 0.88);
    const doorSkinL = new THREE.Mesh(doorGeo, this.matPaint);
    doorSkinL.position.set(0, 0, -0.44);
    doorSkinL.castShadow = true;

    // Cutaway top dip (Classic safari low cutout)
    const dipGeoL = new THREE.BoxGeometry(0.09, 0.12, 0.48);
    const dipL = new THREE.Mesh(dipGeoL, this.matPaint);
    dipL.position.set(0, 0.12, -0.44);

    // Steel paddle handle & exterior hinges
    const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.12), this.matChrome);
    handleL.position.set(-0.05, 0.10, -0.72);
    this.doorLGroup.add(doorSkinL, dipL, handleL);

    // Left Square Safari Trail Mirror on Tubular Stalk
    this.mirrorLGroup.position.set(-0.84, 1.12, 0.38);
    const mirrorStalkL = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 6), this.matSteel);
    mirrorStalkL.rotation.z = -Math.PI / 4;
    const mirrorHeadL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.14), this.matSteel);
    mirrorHeadL.position.set(-0.12, 0.10, 0);
    const mirrorGlassL = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), this.matChrome);
    mirrorGlassL.position.set(-0.142, 0.10, 0);
    mirrorGlassL.rotation.y = -Math.PI / 2;
    this.mirrorLGroup.add(mirrorStalkL, mirrorHeadL, mirrorGlassL);

    // Right Cutaway Half-Door (hinged at front A-pillar z = +0.46)
    this.doorRGroup.position.set(0.76, 0.72, 0.46);
    const doorSkinR = new THREE.Mesh(doorGeo, this.matPaint);
    doorSkinR.position.set(0, 0, -0.44);
    doorSkinR.castShadow = true;

    const dipGeoR = new THREE.BoxGeometry(0.09, 0.12, 0.48);
    const dipR = new THREE.Mesh(dipGeoR, this.matPaint);
    dipR.position.set(0, 0.12, -0.44);

    const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.12), this.matChrome);
    handleR.position.set(0.05, 0.10, -0.72);
    this.doorRGroup.add(doorSkinR, dipR, handleR);

    // Right Square Safari Trail Mirror
    this.mirrorRGroup.position.set(0.84, 1.12, 0.38);
    const mirrorStalkR = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 6), this.matSteel);
    mirrorStalkR.rotation.z = Math.PI / 4;
    const mirrorHeadR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.14), this.matSteel);
    mirrorHeadR.position.set(0.12, 0.10, 0);
    const mirrorGlassR = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), this.matChrome);
    mirrorGlassR.position.set(0.142, 0.10, 0);
    mirrorGlassR.rotation.y = Math.PI / 2;
    this.mirrorRGroup.add(mirrorStalkR, mirrorHeadR, mirrorGlassR);

    this.bodyGroup.add(this.doorLGroup, this.doorRGroup);
    this.bodyGroup.add(this.mirrorLGroup, this.mirrorRGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. HEAVY-DUTY TUBULAR ROLL CAGE
  // ─────────────────────────────────────────────────────────────────────────
  buildRollCage() {
    this.rollCageGroup = new THREE.Group();
    const cageTubeRadius = 0.032;

    // Main B-Pillar Center Hoop (Directly behind driver seats)
    const bTop = new THREE.Mesh(new THREE.CylinderGeometry(cageTubeRadius, cageTubeRadius, 1.34, 10), this.matSteel);
    bTop.rotation.z = Math.PI / 2;
    bTop.position.set(0, 1.62, -0.32);
    const bLegL = new THREE.Mesh(new THREE.CylinderGeometry(cageTubeRadius, cageTubeRadius, 0.95, 10), this.matSteel);
    bLegL.position.set(-0.67, 1.18, -0.32);
    const bLegR = new THREE.Mesh(new THREE.CylinderGeometry(cageTubeRadius, cageTubeRadius, 0.95, 10), this.matSteel);
    bLegR.position.set(0.67, 1.18, -0.32);
    this.rollCageGroup.add(bTop, bLegL, bLegR);

    // Front Windshield Bars (A-Pillar stringers connecting windshield to B-hoop)
    [-0.67, 0.67].forEach(x => {
      const aBar = new THREE.Mesh(new THREE.CylinderGeometry(cageTubeRadius, cageTubeRadius, 0.92, 10), this.matSteel);
      aBar.position.set(x, 1.54, 0.10);
      aBar.rotation.x = Math.PI / 2 - 0.15;
      this.rollCageGroup.add(aBar);
    });

    // Rear Down-Leg Struts (Angle back into rear tub corners)
    [-0.67, 0.67].forEach(x => {
      const rearStrut = new THREE.Mesh(new THREE.CylinderGeometry(cageTubeRadius, cageTubeRadius, 1.25, 10), this.matSteel);
      rearStrut.position.set(x, 1.18, -0.88);
      rearStrut.rotation.x = -0.55;
      this.rollCageGroup.add(rearStrut);
    });

    // Center Spreader Bar (Overhead center spine)
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(cageTubeRadius * 0.8, cageTubeRadius * 0.8, 0.88, 8), this.matSteel);
    spine.rotation.x = Math.PI / 2;
    spine.position.set(0, 1.62, 0.12);
    this.rollCageGroup.add(spine);

    this.bodyGroup.add(this.rollCageGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10. EXPEDITION SAFARI ROOF RACK & "TRAVELS ALL THE TIME" GEAR
  // ─────────────────────────────────────────────────────────────────────────
  buildExpeditionRoofRack() {
    this.roofRackGroup.position.set(0, 1.68, -0.30);

    // Welded Heavy-Duty Tubular Steel Basket Frame
    const basketW = 1.38;
    const basketL = 1.65;
    const basketH = 0.16;
    const tubeR = 0.022;

    // Bottom Perimeter Bar
    const bSideL = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketL, 8), this.matSteel);
    bSideL.rotation.x = Math.PI / 2;
    bSideL.position.set(-basketW / 2, 0, 0);
    const bSideR = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketL, 8), this.matSteel);
    bSideR.rotation.x = Math.PI / 2;
    bSideR.position.set(basketW / 2, 0, 0);
    const bFront = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketW, 8), this.matSteel);
    bFront.rotation.z = Math.PI / 2;
    bFront.position.set(0, 0, basketL / 2);
    const bRear = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketW, 8), this.matSteel);
    bRear.rotation.z = Math.PI / 2;
    bRear.position.set(0, 0, -basketL / 2);
    this.roofRackGroup.add(bSideL, bSideR, bFront, bRear);

    // Top Perimeter Rail
    const tSideL = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketL, 8), this.matSteel);
    tSideL.rotation.x = Math.PI / 2;
    tSideL.position.set(-basketW / 2, basketH, 0);
    const tSideR = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketL, 8), this.matSteel);
    tSideR.rotation.x = Math.PI / 2;
    tSideR.position.set(basketW / 2, basketH, 0);
    const tFront = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketW, 8), this.matSteel);
    tFront.rotation.z = Math.PI / 2;
    tFront.position.set(0, basketH, basketL / 2);
    const tRear = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, basketW, 8), this.matSteel);
    tRear.rotation.z = Math.PI / 2;
    tRear.position.set(0, basketH, -basketL / 2);
    this.roofRackGroup.add(tSideL, tSideR, tFront, tRear);

    // Slatted Basket Floor Tubes
    for (let z = -basketL / 2 + 0.2; z <= basketL / 2 - 0.2; z += 0.22) {
      const slat = new THREE.Mesh(new THREE.CylinderGeometry(tubeR * 0.7, tubeR * 0.7, basketW - 0.05, 6), this.matSteel);
      slat.rotation.z = Math.PI / 2;
      slat.position.set(0, 0.01, z);
      this.roofRackGroup.add(slat);
    }

    // Quad Round KC Daylighter Safari Rally Spotlights (Mounted on front bar)
    const spotX = [-0.48, -0.16, 0.16, 0.48];
    spotX.forEach(x => {
      const spotHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.07, 14), this.matSteel);
      spotHousing.rotateX(Math.PI / 2);
      spotHousing.position.set(x, basketH + 0.04, basketL / 2 + 0.06);

      const spotLens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 14), this.matFogLightOn);
      spotLens.rotateX(Math.PI / 2);
      spotLens.position.set(x, basketH + 0.04, basketL / 2 + 0.08);

      // KC Stone Guard Grille Cross
      const gH = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.015, 0.01), this.matSteel);
      gH.position.set(x, basketH + 0.04, basketL / 2 + 0.11);
      const gV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.17, 0.01), this.matSteel);
      gV.position.set(x, basketH + 0.04, basketL / 2 + 0.11);

      this.roofRackGroup.add(spotHousing, spotLens, gH, gV);
    });

    // ─────────────────────────────────────────────────────────────
    // OVERLAND EXPEDITION LOADED CARGO (The "Travels All The Time" Look)
    // ─────────────────────────────────────────────────────────────

    // 1. Dual NATO Steel Jerry Cans in locking side cradle (Red fuel + Olive water)
    const canGeo = new THREE.BoxGeometry(0.18, 0.42, 0.32);
    // Red Fuel Can
    const fuelCan = new THREE.Mesh(canGeo, this.matFuelRed);
    fuelCan.position.set(-basketW / 2 + 0.16, basketH + 0.12, -0.45);
    fuelCan.castShadow = true;
    const canHandle1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), this.matSteel);
    canHandle1.position.set(-basketW / 2 + 0.16, basketH + 0.35, -0.45);
    this.fuelCanGroup.add(fuelCan, canHandle1);
    this.roofRackGroup.add(this.fuelCanGroup);

    // Olive Water Can
    const waterCan = new THREE.Mesh(canGeo, this.matOlive);
    waterCan.position.set(-basketW / 2 + 0.16, basketH + 0.12, -0.10);
    waterCan.castShadow = true;
    const canHandle2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), this.matSteel);
    canHandle2.position.set(-basketW / 2 + 0.16, basketH + 0.35, -0.10);
    this.waterCanGroup.add(waterCan, canHandle2);
    this.roofRackGroup.add(this.waterCanGroup);

    // 2. Heavy-Duty Overland Storage Crates / Ammo Boxes (Center & Front)
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.28, 0.65), this.matOlive);
    crate1.position.set(0.18, basketH + 0.06, -0.28);
    crate1.castShadow = true;
    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.24, 0.52), this.matChassis);
    crate2.position.set(0.20, basketH + 0.04, 0.35);
    crate2.castShadow = true;

    // Metal Latches & Tie-Down Straps over crates
    const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.30, 0.06), this.matLeather);
    strap1.position.set(0.18, basketH + 0.06, -0.28);
    this.roofRackGroup.add(crate1, crate2, strap1);

    // 3. Rolled Waterproof Canvas Safari Swag / Bedroll (Strapped across front basket)
    const bedrollGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.95, 14);
    bedrollGeo.rotateZ(Math.PI / 2);
    const bedroll = new THREE.Mesh(bedrollGeo, this.matCanvas);
    bedroll.position.set(-0.10, basketH + 0.08, 0.42);
    bedroll.castShadow = true;

    // Leather Cinch Straps on bedroll
    [-0.35, 0.15].forEach(x => {
      const cinch = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.015, 6, 12), this.matLeather);
      cinch.position.set(x, basketH + 0.08, 0.42);
      cinch.rotation.y = Math.PI / 2;
      this.roofRackGroup.add(cinch);
    });
    this.roofRackGroup.add(bedroll);

    // 4. Heavy-Duty Sand Recovery Traction Ladders (MaxTrax style, orange, clamped to right flank)
    const boardGeo = new THREE.BoxGeometry(0.04, 0.24, 1.10);
    const board1 = new THREE.Mesh(boardGeo, this.matTractionOrange);
    board1.position.set(basketW / 2 + 0.04, basketH + 0.04, 0.0);
    board1.castShadow = true;
    const board2 = new THREE.Mesh(boardGeo, this.matTractionOrange);
    board2.position.set(basketW / 2 + 0.08, basketH + 0.04, 0.0);
    board2.castShadow = true;

    // Recovery board mounting pins
    [-0.35, 0.35].forEach(z => {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), this.matChrome);
      pin.rotation.z = Math.PI / 2;
      pin.position.set(basketW / 2 + 0.06, basketH + 0.04, z);
      this.roofRackGroup.add(pin);
    });
    this.tractionBoardsGroup.add(board1, board2);
    this.roofRackGroup.add(this.tractionBoardsGroup);

    // 5. Heavy-Duty Trail Shovel (Clamped to left rack side)
    const shovelHdl = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.95, 6), this.matLeather);
    shovelHdl.rotation.x = Math.PI / 2;
    shovelHdl.position.set(-basketW / 2 - 0.03, basketH + 0.05, 0.10);
    const shovelBlade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.22), this.matSteel);
    shovelBlade.position.set(-basketW / 2 - 0.03, basketH + 0.05, -0.42);
    this.shovelGroup.add(shovelHdl, shovelBlade);
    this.roofRackGroup.add(this.shovelGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 11. REAR TAILGATE, SWING-OUT TIRE CARRIER & CB ANTENNA
  // ─────────────────────────────────────────────────────────────────────────
  buildRearTailgateAndCarrier() {
    this.rearCarrierGroup.position.set(0, 0.88, -1.48);

    // Swing-Out Tubular Steel Tire Carrier Arm
    const carrierArm = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.10, 0.08), this.matSteel);
    carrierArm.castShadow = true;
    this.rearCarrierGroup.add(carrierArm);

    // Heavy-duty hinge spindle on passenger side
    const hingeSpindle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10), this.matSteel);
    hingeSpindle.position.set(0.62, 0, 0.02);
    this.rearCarrierGroup.add(hingeSpindle);

    // Center Spare Wheel Mounting Stalk
    const mountStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8), this.matSteel);
    mountStalk.rotation.x = Math.PI / 2;
    mountStalk.position.set(0.05, 0.15, -0.10);
    this.rearCarrierGroup.add(mountStalk);

    // Full-Size 5th Matching Spare Beadlock Wheel & 35-inch Knobby Tire
    this.spareWheelGroup = new THREE.Group();
    this.spareWheelGroup.position.set(0.05, 0.15, -0.26);

    const spareTireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.28, 20);
    spareTireGeo.rotateX(Math.PI / 2);
    const spareTire = new THREE.Mesh(spareTireGeo, this.matTire);
    spareTire.castShadow = true;

    const spareRimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 16);
    spareRimGeo.rotateX(Math.PI / 2);
    const spareRim = new THREE.Mesh(spareRimGeo, this.matRim);

    const spareBeadlock = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 16), this.matBeadlockRing);
    spareBeadlock.position.set(0, 0, -0.14);

    this.spareWheelGroup.add(spareTire, spareRim, spareBeadlock);
    this.rearCarrierGroup.add(this.spareWheelGroup);

    // Vertically Mounted 48-Inch Hi-Lift Farm Recovery Trail Jack
    const jackBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.03), this.matFuelRed);
    jackBar.position.set(-0.46, 0.20, -0.12);
    jackBar.castShadow = true;
    const jackFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.12), this.matChassis);
    jackFoot.position.set(-0.46, -0.38, -0.12);
    const jackMech = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.08), this.matSteel);
    jackMech.position.set(-0.46, 0.05, -0.12);
    this.rearCarrierGroup.add(jackBar, jackFoot, jackMech);

    this.bodyGroup.add(this.rearCarrierGroup);

    // Dual Vintage Rectangular Taillights (Mounted on rear corners)
    [-0.64, 0.64].forEach(x => {
      const tailHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.06), this.matSteel);
      tailHousing.position.set(x, 0.74, -1.45);

      const redLens = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.14), this.matTailRed);
      redLens.position.set(x, 0.77, -1.485);
      redLens.rotation.y = Math.PI;

      const amberLens = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.06), this.matAmberBlinker);
      amberLens.position.set(x, 0.67, -1.485);
      amberLens.rotation.y = Math.PI;

      this.bodyGroup.add(tailHousing, redLens, amberLens);
    });

    // Flexible CB Radio Whip Antenna with Fluttering Trail Pennant Flag
    this.antennaGroup = new THREE.Group();
    this.antennaGroup.position.set(-0.76, 0.95, -1.35);

    const antennaSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), this.matChrome);
    antennaSpring.position.set(0, 0.04, 0);

    // Whip rod
    this.antennaRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.003, 1.85, 6), this.matSteel);
    this.antennaRod.position.set(0, 0.96, 0);

    // Trail safety pennant flag on top
    const flagGeo = new THREE.PlaneGeometry(0.24, 0.14);
    this.flagMesh = new THREE.Mesh(flagGeo, this.matTractionOrange);
    this.flagMesh.position.set(0.12, 1.78, 0);
    this.flagMesh.rotation.y = Math.PI / 2;

    this.antennaGroup.add(antennaSpring, this.antennaRod, this.flagMesh);
    this.bodyGroup.add(this.antennaGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 12. VINTAGE SAFARI COCKPIT & INTERIOR
  // ─────────────────────────────────────────────────────────────────────────
  buildCockpit() {
    // Flat Metal Dashboard (Vintage painted steel dash)
    const dashGeo = new THREE.BoxGeometry(1.36, 0.32, 0.22);
    const dash = new THREE.Mesh(dashGeo, this.matPaint);
    dash.position.set(0, 0.92, 0.38);
    this.cockpitGroup.add(dash);

    // Vintage Round Chrome Analog Gauges (Speedometer, Tachometer, Fuel, Temp)
    const gaugeX = [-0.42, -0.22, 0.0, 0.22];
    gaugeX.forEach((x, idx) => {
      const gaugeHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 12), this.matChrome);
      gaugeHousing.rotateX(Math.PI / 2);
      gaugeHousing.position.set(x, 0.94, 0.28);

      const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.015, 12), this.matChassis);
      gaugeFace.rotateX(Math.PI / 2);
      gaugeFace.position.set(x, 0.94, 0.27);

      this.cockpitGroup.add(gaugeHousing, gaugeFace);
    });

    // Vintage 3-Spoke Deep-Dish Steering Wheel
    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 10), this.matChrome);
    wheelHub.rotation.x = Math.PI / 4;
    wheelHub.position.set(-0.35, 0.88, 0.26);

    const rimGeo = new THREE.TorusGeometry(0.18, 0.02, 8, 20);
    const steerRim = new THREE.Mesh(rimGeo, this.matLeather);
    steerRim.rotation.x = Math.PI / 4;
    steerRim.position.set(-0.35, 0.94, 0.20);

    const centerHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), this.matChrome);
    centerHorn.rotation.x = Math.PI / 4;
    centerHorn.position.set(-0.35, 0.94, 0.20);

    this.cockpitGroup.add(wheelHub, steerRim, centerHorn);

    // Tall Manual Stick-Shift Lever & 4x4 Transfer Case Lever
    const stickBoot = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.10, 8), this.matLeather);
    stickBoot.position.set(-0.06, 0.62, 0.08);
    const stickRod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), this.matChrome);
    stickRod.position.set(-0.06, 0.78, 0.08);
    const shiftKnob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), this.matChassis);
    shiftKnob.position.set(-0.06, 0.94, 0.08);

    // Twin-stick / 4WD transfer case selector lever
    const tcaseRod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6), this.matChrome);
    tcaseRod.position.set(0.10, 0.72, 0.14);
    const tcaseKnob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), this.matFuelRed);
    tcaseKnob.position.set(0.10, 0.83, 0.14);

    this.cockpitGroup.add(stickBoot, stickRod, shiftKnob, tcaseRod, tcaseKnob);

    // Rugged Low-Back Safari Vinyl Bucket Seats
    [-0.34, 0.34].forEach(x => {
      const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.44), this.matLeather);
      seatCushion.position.set(x, 0.62, -0.06);

      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.12), this.matLeather);
      seatBack.position.set(x, 0.90, -0.28);
      seatBack.rotation.x = -0.12;

      this.cockpitGroup.add(seatCushion, seatBack);
    });

    // Passenger Grab Handle (Classic dash safety bar)
    const grabBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 8), this.matSteel);
    grabBar.rotation.z = Math.PI / 2;
    grabBar.position.set(0.34, 0.92, 0.26);
    this.cockpitGroup.add(grabBar);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 13. RUNNING GEAR, SOLID AXLES & 35-INCH KNOBBY WHEELS
  // ─────────────────────────────────────────────────────────────────────────
  buildRunningGearAndWheels() {
    this.runningGearGroup = new THREE.Group();

    // Solid Live Front Beam Axle with Center Differential Pumpkin
    const frontAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.54, 10), this.matSteel);
    frontAxle.rotation.z = Math.PI / 2;
    frontAxle.position.set(0, 0.44, 1.15);

    const frontDiff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), this.matSteel);
    frontDiff.position.set(-0.18, 0.44, 1.15);

    // Solid Rear Live Axle with Center Differential Pumpkin
    const rearAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.54, 10), this.matSteel);
    rearAxle.rotation.z = Math.PI / 2;
    rearAxle.position.set(0, 0.44, -1.05);

    const rearDiff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), this.matSteel);
    rearDiff.position.set(0.0, 0.44, -1.05);

    this.frontAxleMesh = frontAxle;
    this.rearAxleMesh = rearAxle;
    this.runningGearGroup.add(frontAxle, frontDiff, rearAxle, rearDiff);

    // Heavy-Duty Off-Road Suspension Coil Springs & Shocks with Red Reservoir Canisters
    const wheelPositions = [
      { x: -0.78, y: 0.44, z: 1.15, isFront: true, isLeft: true },
      { x:  0.78, y: 0.44, z: 1.15, isFront: true, isLeft: false },
      { x: -0.78, y: 0.44, z: -1.05, isFront: false, isLeft: true },
      { x:  0.78, y: 0.44, z: -1.05, isFront: false, isLeft: false }
    ];

    wheelPositions.forEach(pos => {
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 8), this.matSteel);
      spring.position.set(pos.x * 0.72, pos.y + 0.16, pos.z);

      const shockReservoir = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8), this.matFuelRed);
      shockReservoir.position.set(pos.x * 0.65, pos.y + 0.22, pos.z + 0.08);

      this.runningGearGroup.add(spring, shockReservoir);
    });

    this.group.add(this.runningGearGroup);

    // ─────────────────────────────────────────────────────────────
    // 35-INCH KNOBBY MUD-TERRAIN WHEELS & STEEL BEADLOCK RIMS
    // ─────────────────────────────────────────────────────────────
    const tireRadius = 0.44;
    const tireWidth = 0.32;
    const rimRadius = 0.24;

    wheelPositions.forEach((pos, idx) => {
      const wheelMount = new THREE.Group();
      wheelMount.position.set(pos.x, pos.y, pos.z);

      // Knobby Mud-Terrain Tire Geometry with Integrated Lug Blocks
      const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireGeos = [tireGeo.toNonIndexed()];

      // Knobby Tread Lug Blocks (Simulating deep aggressive off-road lugs)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const lugGeo = new THREE.BoxGeometry(0.28, 0.035, 0.08);
        lugGeo.rotateX(-a);
        lugGeo.translate(
          0,
          Math.cos(a) * (tireRadius + 0.012),
          Math.sin(a) * (tireRadius + 0.012)
        );
        tireGeos.push(lugGeo.toNonIndexed());
      }
      const combinedTireGeo = mergeGeometries(tireGeos, false) || tireGeo;
      const tireMesh = new THREE.Mesh(combinedTireGeo, this.matTire);
      tireMesh.castShadow = true;
      tireMesh.receiveShadow = true;

      // Satin Steel Beadlock Rim
      const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.01, 18);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.matRim);

      // Outer Beadlock Bolt Ring
      const beadlockGeo = new THREE.TorusGeometry(rimRadius - 0.01, 0.022, 8, 20);
      const beadlock = new THREE.Mesh(beadlockGeo, this.matBeadlockRing);
      beadlock.rotation.y = Math.PI / 2;
      beadlock.position.set(pos.isLeft ? -tireWidth / 2 - 0.008 : tireWidth / 2 + 0.008, 0, 0);

      // Front Manual 4x4 Locking Hubs (Warn/MileMarker style)
      if (pos.isFront) {
        const hubGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.10, 10);
        hubGeo.rotateZ(Math.PI / 2);
        const hub = new THREE.Mesh(hubGeo, this.matChrome);
        hub.position.set(pos.isLeft ? -tireWidth / 2 - 0.04 : tireWidth / 2 + 0.04, 0, 0);

        const hubDial = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), this.matFuelRed);
        hubDial.rotateZ(Math.PI / 2);
        hubDial.position.set(pos.isLeft ? -tireWidth / 2 - 0.09 : tireWidth / 2 + 0.09, 0, 0);

        rimMesh.add(hub, hubDial);
      }

      // Spin container (Rotates around X as car drives)
      const spinGroup = new THREE.Group();
      spinGroup.add(tireMesh, rimMesh, beadlock);

      if (pos.isFront) {
        // Steering Hub (Rotates around Y with steering input)
        const steerGroup = new THREE.Group();
        steerGroup.add(spinGroup);
        wheelMount.add(steerGroup);

        this.frontWheelHubs.push(steerGroup);
        this.frontWheelMeshes.push(spinGroup);
      } else {
        wheelMount.add(spinGroup);
        this.rearWheelMeshes.push(spinGroup);
      }

      this.wheels.push(spinGroup);
      this.wheelMounts.push({ mount: wheelMount, baseY: pos.y, isFront: pos.isFront, isLeft: pos.isLeft });
      this.group.add(wheelMount);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 14. LIGHTING SYSTEM
  // ─────────────────────────────────────────────────────────────────────────
  buildLighting() {
    this.headlights = [];

    // Left Spot Headlight
    this.spotL = new THREE.SpotLight(0xfff6d6, 3.8, 120, Math.PI / 5, 0.35, 1.2);
    this.spotL.position.set(-0.56, 0.82, 1.72);
    this.spotTargetL = new THREE.Object3D();
    this.spotTargetL.position.set(-0.56, 0.4, 25);
    this.group.add(this.spotTargetL);
    this.spotL.target = this.spotTargetL;
    this.group.add(this.spotL);

    // Right Spot Headlight
    this.spotR = new THREE.SpotLight(0xfff6d6, 3.8, 120, Math.PI / 5, 0.35, 1.2);
    this.spotR.position.set(0.56, 0.82, 1.72);
    this.spotTargetR = new THREE.Object3D();
    this.spotTargetR.position.set(0.56, 0.4, 25);
    this.group.add(this.spotTargetR);
    this.spotR.target = this.spotTargetR;
    this.group.add(this.spotR);

    this.headlights.push(this.spotL, this.spotR);

    // Tail Brake Glow
    this.brakeLight = new THREE.PointLight(0xd92626, 0, 8);
    this.brakeLight.position.set(0, 0.74, -1.55);
    this.group.add(this.brakeLight);

    // Exhaust Backfire Flash Light
    this.backfireLight = new THREE.PointLight(0xff7700, 0, 10);
    this.backfireLight.position.set(0.48, 0.35, -1.82);
    this.group.add(this.backfireLight);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 15. MULTI-POINT DAMAGE MESHES & VISUAL DEFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  buildDamageMeshes() {
    // Front Bumper Dent Mesh
    this.dentBumperMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.12), this.matScrape);
    this.dentBumperMesh.position.set(0.45, 0.02, 0.08);
    this.dentBumperMesh.visible = false;
    this.bumperGroup.add(this.dentBumperMesh);

    // Hood Buckle / Crumple Mesh
    this.hoodFoldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.35), this.matBareMetal);
    this.hoodFoldMesh.position.set(0, 0.16, 0.25);
    this.hoodFoldMesh.rotation.x = 0.35;
    this.hoodFoldMesh.visible = false;
    this.hoodGroup.add(this.hoodFoldMesh);

    // Left Fender Trail Scrape
    this.scrapeFenderL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.65), this.matScrape);
    this.scrapeFenderL.position.set(-0.17, -0.04, 0);
    this.scrapeFenderL.visible = false;
    this.fenderLGroup.add(this.scrapeFenderL);

    // Right Fender Trail Scrape
    this.scrapeFenderR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.65), this.matScrape);
    this.scrapeFenderR.position.set(0.17, -0.04, 0);
    this.scrapeFenderR.visible = false;
    this.fenderRGroup.add(this.scrapeFenderR);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPACT, DAMAGE & PART DETACHMENT SYSTEM
  // ─────────────────────────────────────────────────────────────────────────
  applyLocalizedImpact(localX, localZ, localY = 0, impactSpeedMph = 45) {
    const intensity = Math.min(1.0, impactSpeedMph / 80.0);

    // Frontal impact (Bumper, Winch, Grille, Hood)
    if (localZ > 0.8) {
      this.damagePoints.frontBumper = Math.min(1.0, this.damagePoints.frontBumper + intensity * 0.8);
      this.damagePoints.frontSplitter = Math.min(1.0, this.damagePoints.frontSplitter + intensity * 0.7);

      if (localZ > 1.2) {
        this.damagePoints.hood = Math.min(1.0, this.damagePoints.hood + intensity * 0.65);
      }
      if (localX < -0.3) {
        this.damagePoints.fenderL = Math.min(1.0, this.damagePoints.fenderL + intensity * 0.7);
        this.damagePoints.wheelAlignmentFL = Math.min(0.25, this.damagePoints.wheelAlignmentFL + intensity * 0.12);
      } else if (localX > 0.3) {
        this.damagePoints.fenderR = Math.min(1.0, this.damagePoints.fenderR + intensity * 0.7);
        this.damagePoints.wheelAlignmentFR = Math.min(0.25, this.damagePoints.wheelAlignmentFR + intensity * 0.12);
      }
    }
    // Rear impact (Tailgate, Spare Tire, Rear carrier)
    else if (localZ < -0.6) {
      this.damagePoints.rearWing = Math.min(1.0, this.damagePoints.rearWing + intensity * 0.8);
      this.damagePoints.rearDiffuser = Math.min(1.0, this.damagePoints.rearDiffuser + intensity * 0.6);

      if (localX < -0.3) {
        this.damagePoints.rearHaunchL = Math.min(1.0, this.damagePoints.rearHaunchL + intensity * 0.6);
      } else if (localX > 0.3) {
        this.damagePoints.rearHaunchR = Math.min(1.0, this.damagePoints.rearHaunchR + intensity * 0.6);
      }
    }
    // Flank / Side impact
    else {
      if (localX < -0.4) {
        this.damagePoints.doorL = Math.min(1.0, this.damagePoints.doorL + intensity * 0.85);
        this.damagePoints.fenderL = Math.min(1.0, this.damagePoints.fenderL + intensity * 0.5);
      } else if (localX > 0.4) {
        this.damagePoints.doorR = Math.min(1.0, this.damagePoints.doorR + intensity * 0.85);
        this.damagePoints.fenderR = Math.min(1.0, this.damagePoints.fenderR + intensity * 0.5);
      }
    }

    this.applyVisualDeformations();
  }

  loosenPart(partType) {
    if (this.partStates[partType] !== 'attached') return;
    this.partStates[partType] = 'hanging';

    let toastBadge = '⚠️ PART UNLATCHED';
    let toastTitle = 'LOOSE & RATTLING';

    if (partType === 'mirrorL') {
      toastBadge = '⚠️ LEFT MIRROR BROKEN LOOSE';
      toastTitle = 'DANGLING BY WIRE • VISIT AUTO SHOP';
    } else if (partType === 'mirrorR') {
      toastBadge = '⚠️ RIGHT MIRROR BROKEN LOOSE';
      toastTitle = 'DANGLING BY WIRE • VISIT AUTO SHOP';
    } else if (partType === 'doorL') {
      toastBadge = '⚠️ DRIVER DOOR UNLATCHED';
      toastTitle = 'FLAPPING IN WIND • VISIT AUTO SHOP';
    } else if (partType === 'doorR') {
      toastBadge = '⚠️ PASSENGER DOOR UNLATCHED';
      toastTitle = 'FLAPPING IN WIND • VISIT AUTO SHOP';
    } else if (partType === 'hood') {
      toastBadge = '⚠️ SAFARI HOOD UNLATCHED';
      toastTitle = 'POPPED AJAR & FLUTTERING • VISIT AUTO SHOP';
    } else if (partType === 'rearWing') {
      toastBadge = '⚠️ SPARE CARRIER UNPINNED';
      toastTitle = 'SWINGING LOOSE • VISIT AUTO SHOP';
    } else if (partType === 'frontBumper') {
      toastBadge = '⚠️ FRONT BUMPER MOUNT CRACKED';
      toastTitle = 'SAGGING TOWARD ROAD • VISIT AUTO SHOP';
    }

    if (window.game && window.game.sound && window.game.sound.triggerPartLoosen) {
      window.game.sound.triggerPartLoosen(partType);
    }

    if (window.game && window.game.hud && window.game.hud.showActionToast) {
      window.game.hud.showActionToast(toastBadge, toastTitle, 2600);
    }

    console.log(`⚠️ Safari Jeep part [${partType}] is now hanging loose!`);
  }

  detachPart(partType, localOffset = null) {
    if (this.partStates[partType] === 'detached') return;
    this.partStates[partType] = 'detached';
    this.detached[partType] = true;

    let targetGroup = null;
    let fallbackOffset = new THREE.Vector3(0, 0.8, 0);
    let toastBadge = '⚠️ PART DETACHED';
    let toastTitle = 'VISIT AUTO REPAIR SHOP';

    if (partType === 'mirrorL') {
      targetGroup = this.mirrorLGroup;
      fallbackOffset.set(-0.84, 1.12, 0.38);
      toastBadge = '⚠️ LEFT TRAIL MIRROR SNAPPED';
      toastTitle = 'TRAIL DAMAGE • VISIT AUTO SHOP';
    } else if (partType === 'mirrorR') {
      targetGroup = this.mirrorRGroup;
      fallbackOffset.set(0.84, 1.12, 0.38);
      toastBadge = '⚠️ RIGHT TRAIL MIRROR SNAPPED';
      toastTitle = 'TRAIL DAMAGE • VISIT AUTO SHOP';
    } else if (partType === 'doorL') {
      targetGroup = this.doorLGroup;
      fallbackOffset.set(-0.76, 0.72, 0.02);
      toastBadge = '⚠️ DRIVER SAFARI DOOR TORN OFF';
      toastTitle = 'CABIN EXPOSED • VISIT AUTO SHOP';
    } else if (partType === 'doorR') {
      targetGroup = this.doorRGroup;
      fallbackOffset.set(0.76, 0.72, 0.02);
      toastBadge = '⚠️ PASSENGER SAFARI DOOR LOST';
      toastTitle = 'CABIN EXPOSED • VISIT AUTO SHOP';
    } else if (partType === 'hood') {
      targetGroup = this.hoodGroup;
      fallbackOffset.set(0, 0.88, 1.05);
      toastBadge = '⚠️ SAFARI HOOD TORN OFF';
      toastTitle = 'ENGINE EXPOSED • VISIT AUTO SHOP';
    } else if (partType === 'rearWing' || partType === 'rearCarrier') {
      // Maps to rear spare tire & carrier assembly
      targetGroup = this.rearCarrierGroup;
      fallbackOffset.set(0.05, 1.03, -1.74);
      toastBadge = '⚠️ 35" SPARE TIRE TORN LOOSE';
      toastTitle = 'REAR CARRIER LOST • VISIT AUTO SHOP';
    } else if (partType === 'frontBumper') {
      targetGroup = this.bumperGroup;
      fallbackOffset.set(0, 0.46, 1.84);
      toastBadge = '⚠️ FRONT BUMPER TORN OFF';
      toastTitle = 'CHASSIS EXPOSED • VISIT AUTO SHOP';
    } else if (partType === 'jerryCanRed' || partType === 'jerryCan') {
      targetGroup = this.fuelCanGroup;
      fallbackOffset.set(-0.55, 1.80, -0.75);
      toastBadge = '⚠️ RED FUEL CAN TORN LOOSE';
      toastTitle = 'RESERVE FUEL LOST • VISIT AUTO SHOP';
    } else if (partType === 'jerryCanOlive') {
      targetGroup = this.waterCanGroup;
      fallbackOffset.set(-0.55, 1.80, -0.40);
      toastBadge = '⚠️ OLIVE WATER CAN LOST';
      toastTitle = 'EXPEDITION WATER LOST';
    } else if (partType === 'tractionBoard') {
      targetGroup = this.tractionBoardsGroup;
      fallbackOffset.set(0.75, 1.76, -0.30);
      toastBadge = '⚠️ MAXTRAX BOARDS TORN OFF';
      toastTitle = 'SAND RECOVERY LADDERS LOST';
    } else if (partType === 'shovel') {
      targetGroup = this.shovelGroup;
      fallbackOffset.set(-0.75, 1.76, -0.20);
      toastBadge = '⚠️ TRAIL SHOVEL LOST';
      toastTitle = 'RECOVERY GEAR LOST';
    } else if (partType === 'snorkel') {
      targetGroup = this.snorkelGroup;
      fallbackOffset.set(0.78, 1.46, 0.46);
      toastBadge = '⚠️ SAFARI SNORKEL TORN OFF';
      toastTitle = 'A-PILLAR INTAKE COMPROMISED';
    }

    if (targetGroup) {
      targetGroup.visible = false;
    }

    // Compute spawn world position for tumbling debris
    const spawnPos = this.group.position.clone();
    const offset = localOffset || fallbackOffset;
    const worldRot = this.group.rotation.y;
    spawnPos.x += offset.x * Math.cos(worldRot) + offset.z * Math.sin(worldRot);
    spawnPos.y += offset.y;
    spawnPos.z += -offset.x * Math.sin(worldRot) + offset.z * Math.cos(worldRot);

    // Spawn 3D tumbling debris
    if (window.game && window.game.debrisManager) {
      const vel = window.game.physics ? window.game.physics.velocity : new THREE.Vector3(0, 0, 15);
      window.game.debrisManager.spawnDebris(partType, spawnPos, vel, worldRot);
    }

    if (window.game && window.game.sound && window.game.sound.triggerPartDetach) {
      window.game.sound.triggerPartDetach(partType);
    }

    if (window.game && window.game.hud && window.game.hud.showActionToast) {
      window.game.hud.showActionToast(toastBadge, toastTitle, 2800);
    }

    console.log(`💥 Detached Safari Jeep part [${partType}] from chassis!`);
  }

  applyVisualDeformations() {
    const dp = this.damagePoints;
    if (gameState.damagePoints) {
      Object.assign(gameState.damagePoints, dp);
    }

    const integrity = (window.game && window.game.physics && window.game.physics.carIntegrity !== undefined)
      ? window.game.physics.carIntegrity
      : (gameState.carIntegrity !== undefined ? gameState.carIntegrity : 100);

    // Progressive Multi-Stage Part Breakdown:
    // 1. Left Mirror: Hangs dangling at <72% (or fenderL/doorL > 0.30), snaps at <46% (or > 0.60)
    if (this.partStates.mirrorL === 'attached' && (dp.fenderL > 0.30 || dp.doorL > 0.30 || integrity < 72)) {
      this.loosenPart('mirrorL');
    }
    if (this.partStates.mirrorL !== 'detached' && (dp.fenderL > 0.60 || dp.doorL > 0.60 || integrity < 46)) {
      this.detachPart('mirrorL', new THREE.Vector3(-0.84, 1.12, 0.38));
    }

    // 2. Right Mirror: Hangs dangling at <68% (or fenderR/doorR > 0.30), snaps at <40% (or > 0.60)
    if (this.partStates.mirrorR === 'attached' && (dp.fenderR > 0.30 || dp.doorR > 0.30 || integrity < 68)) {
      this.loosenPart('mirrorR');
    }
    if (this.partStates.mirrorR !== 'detached' && (dp.fenderR > 0.60 || dp.doorR > 0.60 || integrity < 40)) {
      this.detachPart('mirrorR', new THREE.Vector3(0.84, 1.12, 0.38));
    }

    // 3. Safari Hood: Unlatches & flutters at <58% (or hood > 0.35), tears off at <14% (or > 0.72)
    if (this.partStates.hood === 'attached' && (dp.hood > 0.35 || integrity < 58)) {
      this.loosenPart('hood');
    }
    if (this.partStates.hood !== 'detached' && (dp.hood > 0.72 || integrity < 14)) {
      this.detachPart('hood', new THREE.Vector3(0, 0.88, 1.05));
    }

    // 4. Driver Safari Door: Unlatches & flaps at <48% (or doorL > 0.38), tears off at <22% (or > 0.70)
    if (this.partStates.doorL === 'attached' && (dp.doorL > 0.38 || integrity < 48)) {
      this.loosenPart('doorL');
    }
    if (this.partStates.doorL !== 'detached' && (dp.doorL > 0.70 || integrity < 22)) {
      this.detachPart('doorL', new THREE.Vector3(-0.76, 0.72, 0.02));
    }

    // 5. Passenger Safari Door: Unlatches & flaps at <42% (or doorR > 0.38), tears off at <18% (or > 0.70)
    if (this.partStates.doorR === 'attached' && (dp.doorR > 0.38 || integrity < 42)) {
      this.loosenPart('doorR');
    }
    if (this.partStates.doorR !== 'detached' && (dp.doorR > 0.70 || integrity < 18)) {
      this.detachPart('doorR', new THREE.Vector3(0.76, 0.72, 0.02));
    }

    // 6. Rear Spare Tire Carrier: Unpins & swings at <38% (or rearWing > 0.38), snaps at <14% (or > 0.68)
    if (this.partStates.rearWing === 'attached' && (dp.rearWing > 0.38 || integrity < 38)) {
      this.loosenPart('rearWing');
    }
    if (this.partStates.rearWing !== 'detached' && (dp.rearWing > 0.68 || integrity < 14)) {
      this.detachPart('rearWing', new THREE.Vector3(0.05, 1.03, -1.74));
    }

    // 7. Front Winch Bumper: Sags down on one mount at <32% (or frontBumper > 0.40), tears off at <10% (or > 0.78)
    if (this.partStates.frontBumper === 'attached' && (dp.frontBumper > 0.40 || integrity < 32)) {
      this.loosenPart('frontBumper');
    }
    if (this.partStates.frontBumper !== 'detached' && (dp.frontBumper > 0.78 || integrity < 10)) {
      this.detachPart('frontBumper', new THREE.Vector3(0, 0.46, 1.84));
    }

    // 8. Overland Expedition Gear & Snorkel Breakdowns on Severe Impacts:
    if (this.partStates.jerryCanRed !== 'detached' && (integrity < 34 || dp.rearHaunchL > 0.65)) {
      this.detachPart('jerryCanRed');
    }
    if (this.partStates.tractionBoard !== 'detached' && (integrity < 28 || dp.rearHaunchR > 0.65)) {
      this.detachPart('tractionBoard');
    }
    if (this.partStates.shovel !== 'detached' && (integrity < 22 || dp.doorL > 0.65)) {
      this.detachPart('shovel');
    }
    if (this.partStates.jerryCanOlive !== 'detached' && (integrity < 18 || dp.doorL > 0.75)) {
      this.detachPart('jerryCanOlive');
    }
    if (this.partStates.snorkel !== 'detached' && (integrity < 14 || dp.fenderR > 0.75)) {
      this.detachPart('snorkel');
    }

    // Deformations & Scrapes
    if (this.scrapeFenderL) this.scrapeFenderL.visible = (dp.fenderL > 0.25);
    if (this.scrapeFenderR) this.scrapeFenderR.visible = (dp.fenderR > 0.25);
    if (this.dentBumperMesh) this.dentBumperMesh.visible = (dp.frontBumper > 0.35);
    if (this.hoodFoldMesh) this.hoodFoldMesh.visible = (dp.hood > 0.40);
    if (this.crackedWindshieldMesh) this.crackedWindshieldMesh.visible = (integrity < 20.0 || dp.windshield > 0.35);

    // Front Bumper Tilt / Bend when still attached (not hanging)
    if (this.bumperGroup && this.partStates.frontBumper === 'attached') {
      this.bumperGroup.rotation.z = (dp.fenderL - dp.fenderR) * 0.14;
      this.bumperGroup.rotation.x = -dp.frontBumper * 0.12;
    }

    // Hood Buckle Tilt when still attached
    if (this.hoodGroup && this.partStates.hood === 'attached') {
      this.hoodGroup.rotation.x = dp.hood * 0.16;
    }
  }

  setDamageStage(stage, integrity = 100) {
    if (stage >= 1) {
      this.damagePoints.fenderL = Math.max(this.damagePoints.fenderL, 0.30);
      this.damagePoints.fenderR = Math.max(this.damagePoints.fenderR, 0.30);
      this.damagePoints.frontBumper = Math.max(this.damagePoints.frontBumper, 0.30);
    }
    if (stage >= 2) {
      this.damagePoints.hood = Math.max(this.damagePoints.hood, 0.55);
      this.damagePoints.doorL = Math.max(this.damagePoints.doorL, 0.50);
      this.damagePoints.doorR = Math.max(this.damagePoints.doorR, 0.50);
    }
    if (stage >= 3) {
      this.damagePoints.windshield = 0.85;
      this.damagePoints.frontBumper = 0.90;
      this.damagePoints.hood = 0.85;
    }
    this.applyVisualDeformations();
  }

  repairVehicle() {
    this.damagePoints = {
      frontBumper: 0.0,
      frontSplitter: 0.0,
      hood: 0.0,
      fenderL: 0.0,
      fenderR: 0.0,
      doorL: 0.0,
      doorR: 0.0,
      rearHaunchL: 0.0,
      rearHaunchR: 0.0,
      rearWing: 0.0,
      rearDiffuser: 0.0,
      windshield: 0.0,
      wheelAlignmentFL: 0.0,
      wheelAlignmentFR: 0.0,
      wheelAlignmentRL: 0.0,
      wheelAlignmentRR: 0.0
    };

    if (gameState.damagePoints) {
      Object.assign(gameState.damagePoints, this.damagePoints);
    }

    // Reset all part states
    for (const k in this.partStates) {
      this.partStates[k] = 'attached';
      this.detached[k] = false;
    }

    // Restore base transforms and visibility
    if (this.mirrorLGroup) {
      this.mirrorLGroup.visible = true;
      this.mirrorLGroup.position.copy(this.baseTransforms.mirrorL.pos);
      this.mirrorLGroup.rotation.copy(this.baseTransforms.mirrorL.rot);
    }
    if (this.mirrorRGroup) {
      this.mirrorRGroup.visible = true;
      this.mirrorRGroup.position.copy(this.baseTransforms.mirrorR.pos);
      this.mirrorRGroup.rotation.copy(this.baseTransforms.mirrorR.rot);
    }
    if (this.doorLGroup) {
      this.doorLGroup.visible = true;
      this.doorLGroup.position.copy(this.baseTransforms.doorL.pos);
      this.doorLGroup.rotation.copy(this.baseTransforms.doorL.rot);
    }
    if (this.doorRGroup) {
      this.doorRGroup.visible = true;
      this.doorRGroup.position.copy(this.baseTransforms.doorR.pos);
      this.doorRGroup.rotation.copy(this.baseTransforms.doorR.rot);
    }
    if (this.hoodGroup) {
      this.hoodGroup.visible = true;
      this.hoodGroup.position.copy(this.baseTransforms.hood.pos);
      this.hoodGroup.rotation.copy(this.baseTransforms.hood.rot);
    }
    if (this.rearCarrierGroup) {
      this.rearCarrierGroup.visible = true;
      this.rearCarrierGroup.position.copy(this.baseTransforms.rearCarrier.pos);
      this.rearCarrierGroup.rotation.copy(this.baseTransforms.rearCarrier.rot);
    }
    if (this.spareWheelGroup) this.spareWheelGroup.visible = true;
    if (this.bumperGroup) {
      this.bumperGroup.visible = true;
      this.bumperGroup.position.copy(this.baseTransforms.frontBumper.pos);
      this.bumperGroup.rotation.copy(this.baseTransforms.frontBumper.rot);
    }
    if (this.fuelCanGroup) this.fuelCanGroup.visible = true;
    if (this.waterCanGroup) this.waterCanGroup.visible = true;
    if (this.tractionBoardsGroup) this.tractionBoardsGroup.visible = true;
    if (this.shovelGroup) this.shovelGroup.visible = true;
    if (this.snorkelGroup) this.snorkelGroup.visible = true;

    // Hide damage meshes
    if (this.scrapeFenderL) this.scrapeFenderL.visible = false;
    if (this.scrapeFenderR) this.scrapeFenderR.visible = false;
    if (this.dentBumperMesh) this.dentBumperMesh.visible = false;
    if (this.hoodFoldMesh) this.hoodFoldMesh.visible = false;
    if (this.crackedWindshieldMesh) this.crackedWindshieldMesh.visible = false;

    console.log('🛠️ Safari Overland Jeep Fully Repaired & Serviced!');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DYNAMIC UPDATE LOOP & ANIMATIONS
  // ─────────────────────────────────────────────────────────────────────────
  update(physicsData, inputData, dt = 0.016) {
    // 0. Synchronize 3D Vehicle Root Position & Orientation (YXZ Euler order)
    if (physicsData && physicsData.position) {
      this.group.rotation.order = 'YXZ';
      this.group.position.copy(physicsData.position);
      this.group.rotation.y = physicsData.heading || 0;
      this.group.rotation.x = -(physicsData.pitch || 0);
      this.group.rotation.z = -(physicsData.roll || 0);
    }

    const speed = physicsData ? Math.abs(physicsData.speed || 0) : 0;
    const steer = inputData ? (inputData.steer || 0) : 0;
    const brake = inputData ? (inputData.brake || 0) : 0;
    const throttle = inputData ? (inputData.throttle || 0) : 0;

    // 4x4 Live Body Sway & Pitch (Rugged suspension roll on acceleration/braking/turning)
    if (this.bodyGroup && physicsData) {
      const targetRoll = steer * Math.min(1.0, speed / 20.0) * 0.05;
      const targetPitch = (brake * 0.055) - (throttle * 0.025);
      this.bodyGroup.rotation.z = THREE.MathUtils.damp(this.bodyGroup.rotation.z, targetRoll, 8.0, dt);
      this.bodyGroup.rotation.x = THREE.MathUtils.damp(this.bodyGroup.rotation.x, targetPitch, 8.0, dt);
    }

    // Dynamic 4x4 Wheel Suspension Travel & Live Axle Articulation
    const suspensionComp = (gameState && gameState.suspensionCompression) || 0;
    const diveTransfer = (brake * 0.060) - (throttle * 0.035);
    const rollTransfer = steer * Math.min(1.0, speed / 22.0) * 0.04;
    const wElev = (gameState && gameState.wheelElevations) || null;
    const aTilt = (gameState && gameState.axleTilt) || null;

    if (this.wheelMounts && this.wheelMounts.length > 0) {
      let fL_Y = 0.44, fR_Y = 0.44, rL_Y = 0.44, rR_Y = 0.44;
      this.wheelMounts.forEach(wm => {
        const pitchDelta = wm.isFront ? diveTransfer : -diveTransfer * 0.8;
        const rollDelta = wm.isLeft ? -rollTransfer : rollTransfer;

        // Ground terrain bump displacement per wheel
        let terrainBump = 0;
        if (wElev && physicsData && physicsData.position) {
          const elev = wm.isFront ? (wm.isLeft ? wElev.fl : wElev.fr) : (wm.isLeft ? wElev.rl : wElev.rr);
          // Compare wheel ground contact elevation with vehicle root elevation
          const relH = elev - (physicsData.position.y - 0.22);
          const isPaved = gameState && (gameState.surface === 'asphalt' || gameState.surface === 'paved');
          if (isPaved) {
            // Deadband sub-centimeter ripples on paved road to keep suspension rock-solid
            const absH = Math.abs(relH);
            if (absH > 0.035) {
              terrainBump = THREE.MathUtils.clamp(Math.sign(relH) * (absH - 0.035) * 0.5, -0.15, 0.15);
            }
          } else {
            terrainBump = THREE.MathUtils.clamp(relH * 0.65, -0.22, 0.28);
          }
        }

        const targetY = wm.baseY + suspensionComp * 0.7 + pitchDelta + rollDelta + terrainBump;
        wm.mount.position.y = THREE.MathUtils.damp(wm.mount.position.y, targetY, 22.0, dt);
        if (wm.isFront && wm.isLeft) fL_Y = wm.mount.position.y;
        else if (wm.isFront && !wm.isLeft) fR_Y = wm.mount.position.y;
        else if (!wm.isFront && !wm.isLeft) rL_Y = wm.mount.position.y;
        else if (!wm.isFront && wm.isLeft) rR_Y = wm.mount.position.y;
      });

      // Articulate solid live front & rear beam axles with authentic off-road tilt
      if (this.frontAxleMesh) {
        this.frontAxleMesh.position.y = (fL_Y + fR_Y) * 0.5;
        const liveFrontTilt = aTilt ? aTilt.front * 0.75 : (fR_Y - fL_Y) * 0.4;
        const targetRotZ = Math.PI / 2 + liveFrontTilt;
        this.frontAxleMesh.rotation.z = THREE.MathUtils.damp(this.frontAxleMesh.rotation.z, targetRotZ, 20.0, dt);
      }
      if (this.rearAxleMesh) {
        this.rearAxleMesh.position.y = (rL_Y + rR_Y) * 0.5;
        const liveRearTilt = aTilt ? aTilt.rear * 0.75 : (rR_Y - rL_Y) * 0.4;
        const targetRotZ = Math.PI / 2 + liveRearTilt;
        this.rearAxleMesh.rotation.z = THREE.MathUtils.damp(this.rearAxleMesh.rotation.z, targetRotZ, 20.0, dt);
      }
    }

    // 1. Front Wheels Steering Angle
    const maxSteerAngle = 0.44; // ~25 deg rugged solid axle steering lock
    const targetSteerAngle = -steer * maxSteerAngle;
    this.frontWheelHubs.forEach(hub => {
      hub.rotation.y = targetSteerAngle;
    });

    // 2. Wheel Spinning Rotation (Around wheel axle)
    const tireCircumference = 2 * Math.PI * 0.44; // 35" tire ~ 2.76m
    const spinDelta = (speed * dt / tireCircumference) * Math.PI * 2;

    this.wheels.forEach(wheel => {
      wheel.rotation.x += spinDelta;
    });

    // 3. CB Radio Whip Antenna Sway Dynamics
    const swayTarget = -steer * 0.25 - (speed / 40.0) * 0.18;
    this.antennaSway = THREE.MathUtils.damp(this.antennaSway, swayTarget, 6.0, dt);
    if (this.antennaGroup) {
      this.antennaGroup.rotation.z = this.antennaSway;
      this.antennaGroup.rotation.x = -(speed / 35.0) * 0.15;
    }

    // 4. Trail Pennant Flag Flutter
    if (this.flagMesh) {
      this.flagMesh.rotation.y = Math.PI / 2 + Math.sin(performance.now() * 0.02) * 0.25;
    }

    // 5. Brake Light Glow Modulation & Taillight Lens Illumination
    const isBraking = brake > 0.08 || !!gameState.handbrake;
    if (this.brakeLight) {
      this.brakeLight.intensity = isBraking ? 3.0 : 0.0;
    }
    if (this.matTailRed) {
      this.matTailRed.color.setHex(isBraking ? 0xff2222 : 0x881818);
    }

    // 6. Backfire Light Decay
    if (this.backfireLight && this.backfireLight.intensity > 0) {
      this.backfireLight.intensity = Math.max(0, this.backfireLight.intensity - dt * 8.0);
    }

    // 7. Dynamic Progressive Breakdown Animation for Hanging Parts
    const time = performance.now() * 0.001;

    // (a) Driver Safari Door Flapping & Sagging
    if (this.doorLGroup && this.partStates.doorL === 'hanging') {
      const baseAngle = 0.32;
      const turnSwing = steer * (speed / 24.0) * 0.30;
      const pitchSwing = (brake * 0.16) - (throttle * 0.10);
      const flutter = Math.sin(time * 22.0) * 0.05 * Math.min(1.6, 0.3 + speed / 20.0);

      const openY = THREE.MathUtils.clamp(baseAngle + turnSwing + pitchSwing + flutter, 0.06, 0.65);
      this.doorLGroup.rotation.y = THREE.MathUtils.damp(this.doorLGroup.rotation.y, openY, 12.0, dt);
      this.doorLGroup.rotation.z = -0.12 + Math.sin(time * 16.0) * 0.02; // Door sag
    }

    // (b) Passenger Safari Door Flapping & Sagging
    if (this.doorRGroup && this.partStates.doorR === 'hanging') {
      const baseAngle = -0.32;
      const turnSwing = steer * (speed / 24.0) * 0.30;
      const pitchSwing = -(brake * 0.16) + (throttle * 0.10);
      const flutter = Math.sin(time * 23.5 + 1.0) * 0.05 * Math.min(1.6, 0.3 + speed / 20.0);

      const openY = THREE.MathUtils.clamp(baseAngle + turnSwing + pitchSwing + flutter, -0.65, -0.06);
      this.doorRGroup.rotation.y = THREE.MathUtils.damp(this.doorRGroup.rotation.y, openY, 12.0, dt);
      this.doorRGroup.rotation.z = 0.12 + Math.sin(time * 17.0) * 0.02; // Door sag
    }

    // (c) Safari Hood Unlatched Fluttering
    if (this.hoodGroup && this.partStates.hood === 'hanging') {
      const flutterFreq = time * (22.0 + speed * 0.4);
      const flutterAmp = 0.03 + (speed / 40.0) * 0.07;
      const targetPitch = -0.14 - Math.abs(Math.sin(flutterFreq)) * flutterAmp;
      this.hoodGroup.rotation.x = THREE.MathUtils.damp(this.hoodGroup.rotation.x, targetPitch, 18.0, dt);
      this.hoodGroup.rotation.z = 0.05 + Math.sin(time * 18.0) * 0.02;
    }

    // (d) Left Mirror Dangling on Wire
    if (this.mirrorLGroup && this.partStates.mirrorL === 'hanging') {
      const swayZ = -1.15 + Math.sin(time * 15.0) * 0.14;
      const dragX = -(speed / 35.0) * 0.28 + Math.cos(time * 13.0) * 0.08;
      this.mirrorLGroup.rotation.z = THREE.MathUtils.damp(this.mirrorLGroup.rotation.z, swayZ, 10.0, dt);
      this.mirrorLGroup.rotation.x = THREE.MathUtils.damp(this.mirrorLGroup.rotation.x, dragX, 10.0, dt);
      this.mirrorLGroup.position.set(-0.84, 1.04 + Math.sin(time * 19.0) * 0.02, 0.36);
    }

    // (e) Right Mirror Dangling on Wire
    if (this.mirrorRGroup && this.partStates.mirrorR === 'hanging') {
      const swayZ = 1.15 + Math.sin(time * 16.0) * 0.14;
      const dragX = -(speed / 35.0) * 0.28 + Math.cos(time * 14.0) * 0.08;
      this.mirrorRGroup.rotation.z = THREE.MathUtils.damp(this.mirrorRGroup.rotation.z, swayZ, 10.0, dt);
      this.mirrorRGroup.rotation.x = THREE.MathUtils.damp(this.mirrorRGroup.rotation.x, dragX, 10.0, dt);
      this.mirrorRGroup.position.set(0.84, 1.04 + Math.sin(time * 19.5) * 0.02, 0.36);
    }

    // (f) Rear Spare Tire Carrier Swinging & Heavy Bounce
    if (this.rearCarrierGroup && this.partStates.rearWing === 'hanging') {
      const targetSwingY = 0.22 + steer * 0.10 + Math.sin(time * 10.0) * 0.05;
      const bounceX = Math.sin(time * 13.0) * 0.04;
      this.rearCarrierGroup.rotation.y = THREE.MathUtils.damp(this.rearCarrierGroup.rotation.y, targetSwingY, 8.0, dt);
      this.rearCarrierGroup.rotation.x = THREE.MathUtils.damp(this.rearCarrierGroup.rotation.x, bounceX, 8.0, dt);
    }

    // (g) Front Bumper Sagging & Shuddering
    if (this.bumperGroup && this.partStates.frontBumper === 'hanging') {
      const sagZ = -0.22 + Math.sin(time * 24.0) * 0.03;
      const yawY = 0.08 + Math.sin(time * 18.0) * 0.02;
      this.bumperGroup.rotation.z = THREE.MathUtils.damp(this.bumperGroup.rotation.z, sagZ, 10.0, dt);
      this.bumperGroup.rotation.y = THREE.MathUtils.damp(this.bumperGroup.rotation.y, yawY, 10.0, dt);
      this.bumperGroup.position.set(-0.06, 0.36 + Math.sin(time * 25.0) * 0.02, 1.82);
    }
  }

  triggerBackfireFlash() {
    if (this.backfireLight) {
      this.backfireLight.intensity = 4.0;
    }
  }

  triggerShiftSparksAndPop() {
    this.triggerBackfireFlash();
  }

  setSteeringAngle(angle) {
    this.frontWheelHubs.forEach(hub => {
      hub.rotation.y = angle;
    });
  }

  updateWheels(speed, dt = 0.016) {
    const tireCircumference = 2 * Math.PI * 0.44;
    const spinDelta = (speed * dt / tireCircumference) * Math.PI * 2;
    this.wheels.forEach(wheel => {
      wheel.rotation.x += spinDelta;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAINT & COLOR CUSTOMIZATION
  // ─────────────────────────────────────────────────────────────────────────
  setPaintColor(hexColor, name = '') {
    if (this.matPaint) {
      this.matPaint.color.setHex(hexColor);
    }
    if (this.matBeadlockRing) {
      this.matBeadlockRing.color.setHex(hexColor);
    }
    if (typeof window !== 'undefined' && window.game && window.game.debrisManager && window.game.debrisManager.setPaintColor) {
      window.game.debrisManager.setPaintColor(hexColor);
    }
  }

  cyclePaintColor() {
    this.currentPaletteIndex = (this.currentPaletteIndex + 1) % this.paintPalette.length;
    const nextSpec = this.paintPalette[this.currentPaletteIndex];
    this.setPaintColor(nextSpec.color, nextSpec.name);
    return nextSpec.name;
  }

  getExhaustWorldPosition(target) {
    if (this.exhaustTip) {
      return this.exhaustTip.getWorldPosition(target);
    }
    return target.copy(this.group.position);
  }

  _batchGroup(group, preserveNodes = []) {
    if (!group) return;
    const preserveSet = new Set(preserveNodes);
    const meshesToBatch = [];

    group.traverse(obj => {
      if (obj.isMesh) {
        let isPreserved = false;
        let curr = obj;
        while (curr && curr !== group) {
          if (preserveSet.has(curr)) {
            isPreserved = true;
            break;
          }
          curr = curr.parent;
        }
        if (!isPreserved) {
          meshesToBatch.push(obj);
        }
      }
    });

    if (meshesToBatch.length <= 1) return;

    const buckets = new Map();
    meshesToBatch.forEach(mesh => {
      mesh.updateWorldMatrix(true, false);
      group.updateWorldMatrix(true, false);
      const m = new THREE.Matrix4().copy(group.matrixWorld).invert().multiply(mesh.matrixWorld);

      const g = mesh.geometry.clone();
      g.applyMatrix4(m);

      const mat = mesh.material;
      if (!buckets.has(mat)) buckets.set(mat, []);
      buckets.get(mat).push({ geom: g, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow });
    });

    meshesToBatch.forEach(mesh => {
      if (mesh.parent) mesh.parent.remove(mesh);
    });

    for (const [material, items] of buckets.entries()) {
      if (items.length === 1) {
        const m = new THREE.Mesh(items[0].geom, material);
        m.castShadow = items[0].castShadow;
        m.receiveShadow = items[0].receiveShadow;
        group.add(m);
      } else {
        const geoms = items.map(it => it.geom);
        const hasIndexed = geoms.some(g => !!g.index);
        const hasNonIndexed = geoms.some(g => !g.index);
        const normalized = (hasIndexed && hasNonIndexed)
          ? geoms.map(g => (g.index ? g.toNonIndexed() : g.clone()))
          : geoms.map(g => g.clone());

        const merged = mergeGeometries(normalized, false);
        if (merged) {
          const m = new THREE.Mesh(merged, material);
          m.castShadow = items.some(it => it.castShadow);
          m.receiveShadow = items.some(it => it.receiveShadow);
          group.add(m);
        } else {
          items.forEach(it => {
            const m = new THREE.Mesh(it.geom, material);
            m.castShadow = it.castShadow;
            m.receiveShadow = it.receiveShadow;
            group.add(m);
          });
        }
      }
    }
  }

  batchStaticMeshes() {
    // 1. Ladder chassis
    this._batchGroup(this.chassisGroup);

    // 2. Full tubular roll cage
    this._batchGroup(this.rollCageGroup);

    // 3. Cockpit interior (preserve dynamic steering wheel & gauges)
    this._batchGroup(this.cockpitGroup, [
      this.steeringWheelMesh,
      this.speedoNeedle,
      this.tachNeedle
    ]);

    // 4. Expedition roof rack basket (preserve detachable cargo)
    this._batchGroup(this.roofRackGroup, [
      this.fuelCanGroup,
      this.waterCanGroup,
      this.tractionBoardsGroup,
      this.shovelGroup
    ]);

    // 5. Safari hood (preserve damage buckle fold)
    this._batchGroup(this.hoodGroup, [this.hoodFoldMesh]);

    // 6. Winch front bumper (preserve damage dent)
    this._batchGroup(this.bumperGroup, [this.dentBumperMesh]);

    // 7. Fold-down windshield (preserve cracked glass overlay)
    this._batchGroup(this.windshieldGroup, [this.crackedWindshieldMesh]);

    // 8. Rear spare tire carrier & Hi-Lift jack
    this._batchGroup(this.rearCarrierGroup);

    // 9. Solid live beam axles & suspension links (preserve tilting axle tubes)
    this._batchGroup(this.runningGearGroup, [this.frontAxleMesh, this.rearAxleMesh]);

    // 10. Main body tub & front fascia (preserve all detachable assemblies & anim nodes)
    this._batchGroup(this.bodyGroup, [
      this.bumperGroup,
      this.hoodGroup,
      this.doorLGroup,
      this.doorRGroup,
      this.mirrorLGroup,
      this.mirrorRGroup,
      this.fenderLGroup,
      this.fenderRGroup,
      this.windshieldGroup,
      this.rearCarrierGroup,
      this.snorkelGroup,
      this.antennaGroup,
      this.rollCageGroup,
      this.scrapeFenderL,
      this.scrapeFenderR
    ]);
  }

  setVisible(v) {
    this.group.visible = v;
  }
}

// Backward compatibility alias: re-export SafariJeep as SportsCar and TrophyTruck
export { SafariJeep as SportsCar };
export { SafariJeep as TrophyTruck };
