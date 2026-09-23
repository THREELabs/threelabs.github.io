import * as THREE from 'three';
import { gameState } from '../state.js';

/**
 * VehicleDebrisManager — Physical 3D Tumbling Vehicle Debris System
 * 
 * Spawns and simulates authentic 3D detached Safari Jeep components:
 * - Safari Cutaway Half-Doors with matching active Jeep body paint and chrome handles
 * - Tapered Safari Hood with cooling louvers, external rubber latches, and power bulge
 * - 35-inch Knobby Mud-Terrain Spare Tire & Beadlock Wheel on Swing-Out Carrier with Hi-Lift Farm Jack
 * - Heavy-Duty Tubular Steel Winch Bumper with Warn Winch, Red D-Rings & Amber Fog Lamps
 * - Square Safari Trail Mirrors on tubular stalks with reflective glass
 * - 35-inch Knobby Mud-Terrain Tire Shreds from blowouts
 * - Overland Gear: NATO Jerry Cans, MaxTrax Traction Boards, Trail Shovel & Safari Snorkel
 * 
 * Physics & Simulation:
 * - Ballistic trajectories with vehicle forward velocity & impulse inheritance
 * - Angular tumbling spin & road-elevation collision detection against SplineRoad
 * - Kinetic asphalt friction, ground bounces, and zero-allocation pooled recycling
 */
export class VehicleDebrisManager {
  constructor(scene, splineRoad, renderer) {
    this.scene = scene;
    this.splineRoad = splineRoad;
    this.renderer = renderer;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.activeDebris = [];
    this.pool = [];
    this.maxDebris = 24;

    // Authentic Overland Safari Jeep Materials (matching SafariJeep.js)
    // Default paint: Sahara Sand (0xc2a679) — dynamically updated when car paint changes
    this.matPaint = renderer.createToonMaterial({ color: 0xc2a679, gradientBands: 3 });
    this.matSteel = renderer.createToonMaterial({ color: 0x1e2226, gradientBands: 2 });
    this.matChassis = renderer.createToonMaterial({ color: 0x15171a, gradientBands: 2 });
    this.matChrome = renderer.createToonMaterial({ color: 0xe2e8f0, gradientBands: 2 });
    this.matTire = renderer.createToonMaterial({ color: 0x161719, gradientBands: 2 });
    this.matRim = renderer.createToonMaterial({ color: 0x1a1d20, gradientBands: 2 });
    this.matBeadlockRing = renderer.createToonMaterial({ color: 0xc2a679, gradientBands: 2 });
    this.matFuelRed = renderer.createToonMaterial({ color: 0xb92b27, gradientBands: 2 });
    this.matOlive = renderer.createToonMaterial({ color: 0x485338, gradientBands: 2 });
    this.matTractionOrange = renderer.createToonMaterial({ color: 0xdd6b20, gradientBands: 2 });
    this.matAmber = renderer.createToonMaterial({ color: 0xfacc15, gradientBands: 2 });
    this.matLeather = renderer.createToonMaterial({ color: 0x6b4423, gradientBands: 2 });

    // Backward compatibility aliases
    this.matCarbon = this.matSteel;
    this.matLivery = this.matChrome;

    this.initPool();
  }

  setPaintColor(hexColor) {
    if (this.matPaint) {
      this.matPaint.color.setHex(hexColor);
    }
    if (this.matBeadlockRing) {
      this.matBeadlockRing.color.setHex(hexColor);
    }
  }

  initPool() {
    for (let i = 0; i < this.maxDebris; i++) {
      const debrisObj = {
        meshGroup: new THREE.Group(),
        type: 'none',
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 6.0,
        groundY: 0,
        bounces: 0
      };
      debrisObj.meshGroup.visible = false;
      this.group.add(debrisObj.meshGroup);
      this.pool.push(debrisObj);
    }
  }

  createDebrisMesh(type) {
    const group = new THREE.Group();

    if (type === 'mirrorL' || type === 'mirrorR') {
      // Rugged Square Safari Trail Mirror on Steel Stalk
      const isLeft = (type === 'mirrorL');
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 6), this.matSteel);
      stalk.rotation.z = isLeft ? -Math.PI / 4 : Math.PI / 4;

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.14), this.matSteel);
      head.position.set(isLeft ? -0.12 : 0.12, 0.10, 0);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), this.matChrome);
      glass.position.set(isLeft ? -0.142 : 0.142, 0.10, 0);
      glass.rotation.y = isLeft ? -Math.PI / 2 : Math.PI / 2;

      stalk.castShadow = true;
      head.castShadow = true;
      group.add(stalk, head, glass);

    } else if (type === 'doorL' || type === 'doorR') {
      // Authentic Safari Cutaway Half-Door in Active Jeep Body Paint
      const isLeft = (type === 'doorL');
      const doorSkin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.88), this.matPaint);
      doorSkin.castShadow = true;

      // Classic Safari Cutaway Top Dip
      const dip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.48), this.matPaint);
      dip.position.set(0, 0.12, 0);
      dip.castShadow = true;

      // Chrome Paddle Handle
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.12), this.matChrome);
      handle.position.set(isLeft ? -0.05 : 0.05, 0.10, -0.28);

      // Heavy-Duty Black Steel Exterior Hinge Knuckles
      const hingeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8), this.matSteel);
      hingeTop.position.set(isLeft ? 0.04 : -0.04, 0.14, 0.38);
      const hingeBtm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8), this.matSteel);
      hingeBtm.position.set(isLeft ? 0.04 : -0.04, -0.14, 0.38);

      // Interior Door Release Pull Strap
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.18), this.matLeather);
      strap.position.set(isLeft ? 0.045 : -0.045, 0.02, -0.05);

      group.add(doorSkin, dip, handle, hingeTop, hingeBtm, strap);

    } else if (type === 'rearWing' || type === 'rearCarrier') {
      // Full 35-Inch Beadlock Spare Tire & Swing-Out Tubular Carrier Arm + 48" Hi-Lift Farm Jack
      const carrierArm = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.10, 0.08), this.matSteel);
      carrierArm.castShadow = true;

      const hingeSpindle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10), this.matSteel);
      hingeSpindle.position.set(0.62, 0, 0.02);

      const mountStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8), this.matSteel);
      mountStalk.rotation.x = Math.PI / 2;
      mountStalk.position.set(0.05, 0.15, -0.10);

      // 35" Knobby Mud-Terrain Spare Tire
      const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 20), this.matTire);
      spareTire.rotation.x = Math.PI / 2;
      spareTire.position.set(0.05, 0.15, -0.26);
      spareTire.castShadow = true;

      // Heavy-Duty Beadlock Rim & Matching Accent Ring
      const spareRim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.29, 16), this.matRim);
      spareRim.rotation.x = Math.PI / 2;
      spareRim.position.set(0.05, 0.15, -0.26);

      const spareBeadlock = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 16), this.matBeadlockRing);
      spareBeadlock.position.set(0.05, 0.15, -0.40);

      // Vertically Mounted 48-Inch Hi-Lift Farm Recovery Trail Jack
      const jackBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.03), this.matFuelRed);
      jackBar.position.set(-0.46, 0.20, -0.12);
      jackBar.castShadow = true;

      const jackFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.12), this.matChassis);
      jackFoot.position.set(-0.46, -0.38, -0.12);

      const jackMech = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.08), this.matSteel);
      jackMech.position.set(-0.46, 0.05, -0.12);

      group.add(carrierArm, hingeSpindle, mountStalk, spareTire, spareRim, spareBeadlock, jackBar, jackFoot, jackMech);

    } else if (type === 'hood') {
      // Flat Safari Hood with Matching Body Paint, Louvers, Tie-Down Latches & Underside Ribs
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.14, 1.15), this.matPaint);
      hood.castShadow = true;
      hood.receiveShadow = true;

      // Center Elevated Power Bulge in Matching Body Paint
      const bulge = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.05, 0.95), this.matPaint);
      bulge.position.set(0, 0.09, 0.02);
      bulge.castShadow = true;

      group.add(hood, bulge);

      // Functional Black Cooling Louver Vent Slits
      for (let i = -3; i <= 3; i++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.04), this.matChassis);
        louver.position.set(0, 0.12, i * 0.10);
        group.add(louver);
      }

      // External Rubber Hood Latches with Steel Clamps
      [-0.64, 0.64].forEach(x => {
        const latchBase = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.06), this.matChassis);
        latchBase.position.set(x, 0.02, 0.22);
        const latchArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6), this.matSteel);
        latchArm.position.set(x, 0.02, 0.22);
        group.add(latchBase, latchArm);
      });

      // Windshield Resting Rubber Bumpers
      [-0.32, 0.32].forEach(x => {
        const bumperBlock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.08), this.matChassis);
        bumperBlock.position.set(x, 0.09, -0.38);
        group.add(bumperBlock);
      });

      // Center Chrome Footman Tie-Down Loop
      const footman = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 10, Math.PI), this.matChrome);
      footman.rotation.x = Math.PI / 2;
      footman.position.set(0, 0.12, -0.38);
      group.add(footman);

      // Underside Structural X-Bracing Frame (visible during tumbling)
      const rib1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.45, 6), this.matSteel);
      rib1.rotation.y = Math.PI / 4;
      rib1.rotation.z = Math.PI / 2;
      rib1.position.set(0, -0.07, 0);

      const rib2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.45, 6), this.matSteel);
      rib2.rotation.y = -Math.PI / 4;
      rib2.rotation.z = Math.PI / 2;
      rib2.position.set(0, -0.07, 0);

      group.add(rib1, rib2);

    } else if (type === 'frontBumper') {
      // Heavy-Duty Tubular Steel Winch Bumper + Warn Winch + D-Rings + Yellow Fog Spotlights
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.16, 0.14), this.matSteel);
      bar.castShadow = true;

      // Welded Tubular Center Brush Guard Hoop
      const hoopTop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8), this.matSteel);
      hoopTop.rotation.z = Math.PI / 2;
      hoopTop.position.set(0, 0.36, 0.04);

      const hoopL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), this.matSteel);
      hoopL.position.set(-0.34, 0.20, 0.04);
      hoopL.rotation.z = -0.12;

      const hoopR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), this.matSteel);
      hoopR.position.set(0.34, 0.20, 0.04);
      hoopR.rotation.z = 0.12;

      // Warn-Style Electric Recovery Winch Assembly
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

      const fairlead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.04), this.matChrome);
      fairlead.position.set(0.02, 0.18, 0.16);

      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 8, 12, Math.PI * 1.5), this.matFuelRed);
      hook.position.set(0.02, 0.16, 0.20);
      hook.rotation.x = Math.PI / 2;

      group.add(bar, hoopTop, hoopL, hoopR, winchBase, winchMotor, winchDrum, winchSolenoid, fairlead, hook);

      // Dual Heavy-Duty Welded Safety Red D-Ring Recovery Shackles
      [-0.42, 0.42].forEach(x => {
        const clevis = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), this.matSteel);
        clevis.position.set(x, 0.0, 0.11);
        const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 12), this.matFuelRed);
        shackle.position.set(x, -0.04, 0.16);
        group.add(clevis, shackle);
      });

      // Twin Bumper Driving / Fog Spotlights with Amber Yellow Lenses
      [-0.24, 0.24].forEach(x => {
        const fogHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14), this.matSteel);
        fogHousing.rotateX(Math.PI / 2);
        fogHousing.position.set(x, 0.26, 0.08);

        const fogLens = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 14), this.matAmber);
        fogLens.rotateX(Math.PI / 2);
        fogLens.position.set(x, 0.26, 0.10);

        group.add(fogHousing, fogLens);
      });

    } else if (type === 'tireShred') {
      // Chunky 35-inch Mud-Terrain Knobby Off-Road Tire Tread Shred
      const shred = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 12, 1, true, 0, Math.PI * 1.3), this.matTire);
      shred.rotation.z = Math.PI * 0.5;
      shred.castShadow = true;

      // Aggressive Off-Road Mud-Terrain Knobby Blocks
      for (let k = 0; k < 6; k++) {
        const lug = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.12), this.matTire);
        const ang = (k / 5.0) * Math.PI * 1.2;
        lug.position.set(Math.cos(ang) * 0.45, Math.sin(ang) * 0.45, (k % 2 === 0 ? 0.06 : -0.06));
        shred.add(lug);
      }
      group.add(shred);

    } else if (type === 'jerryCanRed' || type === 'jerryCan') {
      // NATO 20L Steel Fuel Can in Safety Red
      const can = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.32), this.matFuelRed);
      can.castShadow = true;

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), this.matSteel);
      handle.position.set(0, 0.23, 0);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8), this.matSteel);
      cap.position.set(0, 0.24, 0.10);

      group.add(can, handle, cap);

    } else if (type === 'jerryCanOlive') {
      // NATO 20L Steel Water Can in Military Olive Drab
      const can = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.32), this.matOlive);
      can.castShadow = true;

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), this.matSteel);
      handle.position.set(0, 0.23, 0);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8), this.matSteel);
      cap.position.set(0, 0.24, 0.10);

      group.add(can, handle, cap);

    } else if (type === 'tractionBoard') {
      // MaxTrax-Style High-Traction Sand Recovery Ladder in Bright Safety Orange
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 1.10), this.matTractionOrange);
      board.castShadow = true;

      // Traction cleats
      for (let c = -4; c <= 4; c++) {
        const cleat1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.04), this.matTractionOrange);
        cleat1.position.set(0.03, -0.06, c * 0.11);
        const cleat2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.04), this.matTractionOrange);
        cleat2.position.set(0.03, 0.06, c * 0.11);
        group.add(cleat1, cleat2);
      }
      group.add(board);

    } else if (type === 'shovel') {
      // Heavy-Duty Overland Trail Recovery Shovel
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.95, 6), this.matLeather);
      handle.rotation.x = Math.PI / 2;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.22), this.matSteel);
      blade.position.set(0, 0, -0.48);
      blade.castShadow = true;

      group.add(handle, blade);

    } else if (type === 'snorkel') {
      // High-Mount Off-Road Snorkel with Cyclone Pre-Cleaner Cap
      const snkLower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10), this.matChassis);
      snkLower.rotation.x = -Math.PI / 4;
      snkLower.position.set(0, 0.10, 0.0);

      const snkRiser = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.85, 10), this.matChassis);
      snkRiser.position.set(0, 0.58, -0.06);

      const snkCap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 14), this.matChassis);
      snkCap.position.set(0, 1.02, -0.06);

      const snkGrille = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14), this.matSteel);
      snkGrille.position.set(0, 0.98, -0.06);

      group.add(snkLower, snkRiser, snkCap, snkGrille);
    }

    return group;
  }

  spawnDebris(type, worldPos, vehicleVelocity, vehicleHeading) {
    const item = this.pool.find(d => !d.active);
    if (!item) return;

    // Dynamically synchronize paint material with player's active vehicle
    if (typeof window !== 'undefined' && window.game && window.game.sportsCar && window.game.sportsCar.matPaint) {
      this.matPaint.color.copy(window.game.sportsCar.matPaint.color);
      if (this.matBeadlockRing) {
        this.matBeadlockRing.color.copy(window.game.sportsCar.matPaint.color);
      }
    }

    // Clear old children and build specific mesh
    while (item.meshGroup.children.length > 0) {
      item.meshGroup.remove(item.meshGroup.children[0]);
    }
    const mesh = this.createDebrisMesh(type);
    item.meshGroup.add(mesh);

    item.type = type;
    item.active = true;
    item.life = 0;
    item.maxLife = 8.0;
    item.bounces = 0;
    item.pos.copy(worldPos);

    // Car forward & normal vectors
    const fwdX = Math.sin(vehicleHeading);
    const fwdZ = Math.cos(vehicleHeading);
    const normX = -fwdZ; // Vector pointing to left
    const normZ = fwdX;

    const speed = vehicleVelocity ? vehicleVelocity.length() : 16.0;

    let vx = 0;
    let vy = 6.0;
    let vz = 0;
    let rx = (Math.random() - 0.5) * 16.0;
    let ry = (Math.random() - 0.5) * 18.0;
    let rz = (Math.random() - 0.5) * 16.0;

    if (type === 'mirrorL') {
      vx = fwdX * (speed * 0.7) + normX * 6.0;
      vy = 5.5 + Math.random() * 3.0;
      vz = fwdZ * (speed * 0.7) + normZ * 6.0;
      rz = 22.0;
    } else if (type === 'mirrorR') {
      vx = fwdX * (speed * 0.7) - normX * 6.0;
      vy = 5.5 + Math.random() * 3.0;
      vz = fwdZ * (speed * 0.7) - normZ * 6.0;
      rz = -22.0;
    } else if (type === 'doorL') {
      // Driver safari door launches high and flings outward to the left
      vx = fwdX * (speed * 0.6) + normX * 8.5;
      vy = 8.0 + Math.random() * 3.5;
      vz = fwdZ * (speed * 0.6) + normZ * 8.5;
      rx = 12.0;
      rz = 16.0;
    } else if (type === 'doorR') {
      // Passenger safari door launches high and flings outward to the right
      vx = fwdX * (speed * 0.6) - normX * 8.5;
      vy = 8.0 + Math.random() * 3.5;
      vz = fwdZ * (speed * 0.6) - normZ * 8.5;
      rx = 12.0;
      rz = -16.0;
    } else if (type === 'rearWing' || type === 'rearCarrier') {
      // 35-inch spare wheel & tire carrier cartwheels down the highway
      vx = fwdX * (speed * 0.45) + (Math.random() - 0.5) * 4.0;
      vy = 9.5 + Math.random() * 4.0;
      vz = fwdZ * (speed * 0.45) + (Math.random() - 0.5) * 4.0;
      rx = 24.0; // Fast end-over-end cartwheel spin
    } else if (type === 'hood') {
      // Safari Hood flies UP and BACKWARDS right over the roof and camera view!
      vx = fwdX * (speed * 0.35) + (Math.random() - 0.5) * 4.0;
      vy = 12.0 + Math.random() * 5.0; // Super high loft
      vz = fwdZ * (speed * 0.35) + (Math.random() - 0.5) * 4.0;
      rx = -18.0; // Backward aerodynamic sail flip
    } else if (type === 'frontBumper') {
      // Tubular winch bumper drops forward and tumbles violently end-over-end across the asphalt
      vx = fwdX * (speed * 0.85) + (Math.random() - 0.5) * 3.0;
      vy = 4.5 + Math.random() * 2.5;
      vz = fwdZ * (speed * 0.85) + (Math.random() - 0.5) * 3.0;
      rx = 18.0;
      ry = (Math.random() - 0.5) * 10.0;
    } else if (type === 'tireShred') {
      vx = fwdX * (speed * 0.8) + (Math.random() - 0.5) * 6.0;
      vy = 6.0 + Math.random() * 3.0;
      vz = fwdZ * (speed * 0.8) + (Math.random() - 0.5) * 6.0;
      rx = 30.0;
    } else if (type === 'jerryCanRed' || type === 'jerryCan' || type === 'jerryCanOlive') {
      vx = fwdX * (speed * 0.5) + normX * 7.0;
      vy = 9.0 + Math.random() * 4.0;
      vz = fwdZ * (speed * 0.5) + normZ * 7.0;
      rx = 20.0;
      ry = 15.0;
    } else if (type === 'tractionBoard') {
      // MaxTrax traction board flutters spinning through the air
      vx = fwdX * (speed * 0.55) - normX * 8.0;
      vy = 10.0 + Math.random() * 3.5;
      vz = fwdZ * (speed * 0.55) - normZ * 8.0;
      rz = 28.0;
      rx = 8.0;
    } else if (type === 'shovel') {
      vx = fwdX * (speed * 0.5) + (Math.random() - 0.5) * 5.0;
      vy = 8.5 + Math.random() * 3.0;
      vz = fwdZ * (speed * 0.5) + (Math.random() - 0.5) * 5.0;
      rx = 32.0;
    } else if (type === 'snorkel') {
      vx = fwdX * (speed * 0.6) - normX * 6.0;
      vy = 7.0 + Math.random() * 3.0;
      vz = fwdZ * (speed * 0.6) - normZ * 6.0;
      ry = 20.0;
    } else {
      vx = fwdX * (speed * 0.6) + (Math.random() - 0.5) * 6.0;
      vy = 7.0 + Math.random() * 4.0;
      vz = fwdZ * (speed * 0.6) + (Math.random() - 0.5) * 6.0;
    }

    item.vel.set(vx, vy, vz);
    item.rotVel.set(rx, ry, rz);

    item.meshGroup.position.copy(item.pos);
    item.meshGroup.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    item.meshGroup.visible = true;

    this.activeDebris.push(item);
  }

  update(dt) {
    if (this.activeDebris.length === 0) return;

    const gravity = -18.0;

    for (let i = this.activeDebris.length - 1; i >= 0; i--) {
      const d = this.activeDebris[i];
      d.life += dt;

      if (d.life >= d.maxLife) {
        d.active = false;
        d.meshGroup.visible = false;
        this.activeDebris.splice(i, 1);
        continue;
      }

      // Physics integration
      d.vel.y += gravity * dt;
      d.pos.x += d.vel.x * dt;
      d.pos.y += d.vel.y * dt;
      d.pos.z += d.vel.z * dt;

      // Tumbling rotation
      d.meshGroup.rotation.x += d.rotVel.x * dt;
      d.meshGroup.rotation.y += d.rotVel.y * dt;
      d.meshGroup.rotation.z += d.rotVel.z * dt;

      // Ground collision query against road
      let roadY = 0;
      if (this.splineRoad) {
        const trans = this.splineRoad.getRoadTransformAtZ(d.pos.z, 0, 0);
        if (trans) {
          roadY = trans.pos.y;
        }
      }

      const groundLimit = roadY + 0.08;
      if (d.pos.y <= groundLimit) {
        d.pos.y = groundLimit;
        d.bounces++;

        // Bounce restitution and friction
        d.vel.y = Math.abs(d.vel.y) * 0.42;
        d.vel.x *= 0.72;
        d.vel.z *= 0.72;
        d.rotVel.multiplyScalar(0.65);

        // Once bounced enough and moving slowly, settle on asphalt
        if (d.vel.length() < 1.2 && d.bounces > 3) {
          d.vel.set(0, 0, 0);
          d.rotVel.set(0, 0, 0);
        }
      }

      // Fade out smoothly near end of life
      if (d.life > d.maxLife - 1.2) {
        const fade = (d.maxLife - d.life) / 1.2;
        d.meshGroup.scale.set(fade, fade, fade);
      } else {
        d.meshGroup.scale.set(1, 1, 1);
      }

      d.meshGroup.position.copy(d.pos);
    }
  }

  clearAll() {
    this.activeDebris.forEach(d => {
      d.active = false;
      d.meshGroup.visible = false;
    });
    this.activeDebris = [];
  }
}
