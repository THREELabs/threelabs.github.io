import * as THREE from 'three';
import { gameState } from '../state.js';
import { AUTO_REPAIR_SHOPS } from '../world/SplineRoad.js';

/**
 * MechanicSceneManager: 3D Cinematic Auto Mechanic Pit Crew & Overhaul Director
 *
 * Directs an authentic, 5-phase cinematic scene inside the Auto Repair Shop:
 * 1. ARRIVAL_LIFT: Car enters Bay 01, hydraulic 4-post lift smoothly elevates vehicle with amber warning strobes.
 * 2. ENGINE_TUNING: Close-up on engine bay as lead mechanic tunes ignition timing with diagnostic sparks.
 * 3. WHEEL_TIRE_SWAP: Dynamic wheel angle as pit crew technician fires high-torque pneumatic impact gun with flying sparks.
 * 4. UNDERBODY_DYNO: Low angle under elevated chassis as technician inspects suspension and dyno telemetry screen pulses.
 * 5. OVERHAUL_REV: Lift lowers to ground, exhaust pops with flame bursts, crew chief gives thumbs-up, and control returns smoothly to player.
 */
export class MechanicSceneManager {
  constructor(renderer, splineRoad, physics, sportsCar, soundEngine) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.physics = physics;
    this.sportsCar = sportsCar;
    this.soundEngine = soundEngine;

    this.group = new THREE.Group();
    this.group.name = 'MechanicSceneManager_Group';

    // Cinematic State Machine
    this.isActive = false;
    this.phase = 'IDLE'; // 'IDLE' | 'ARRIVAL_LIFT' | 'ENGINE_TUNING' | 'WHEEL_TIRE_SWAP' | 'UNDERBODY_DYNO' | 'LOWER_LIFT' | 'DRIVE_OUT_PARKING'
    this.phaseTimer = 0.0;
    this.totalSceneTimer = 0.0;
    this.targetShop = null;

    // Phase Durations (Extended so crew dialogue lines can be comfortably read)
    this.DURATIONS = {
      ARRIVAL_LIFT: 2.8,
      ENGINE_TUNING: 3.2,
      WHEEL_TIRE_SWAP: 3.0,
      UNDERBODY_DYNO: 3.0,
      LOWER_LIFT: 2.6,
      DRIVE_OUT_PARKING: 3.2
    };

    // World & Transform anchors
    this.shopPos = new THREE.Vector3();
    this.shopHeading = 0;
    this.shopRotY = 0;
    this.isRightSide = true;
    this.parkingLotPos = new THREE.Vector3();
    this.parkingLotHeading = 0;

    // Camera Director State
    this.cinematicCamPos = new THREE.Vector3();
    this.cinematicLookAt = new THREE.Vector3();
    this.cameraFov = 62;

    // Materials
    this.initMaterials();

    // 3D Mechanic Characters Group
    this.crewGroup = new THREE.Group();
    this.group.add(this.crewGroup);

    // Particle VFX Group (Sparks, Steam, Polish Gleams)
    this.vfxGroup = new THREE.Group();
    this.group.add(this.vfxGroup);

    // Hydraulic Lift Height Tracking
    this.liftHeight = 0.0;
    this.targetLiftHeight = 0.0;

    // Build Character Models & VFX
    this.buildMechanicCrew();
    this.initVFXPool();

    // Hidden until triggered
    this.group.visible = false;
  }

  initMaterials() {
    // Cel-Shaded Toon Materials for Pit Crew
    this.matCoverallsNavy = this.renderer.createToonMaterial({ color: 0x1e3a8a, gradientBands: 3 });
    this.matCoverallsOrange = this.renderer.createToonMaterial({ color: 0xea580c, gradientBands: 3 });
    this.matCoverallsSlate = this.renderer.createToonMaterial({ color: 0x334155, gradientBands: 3 });
    this.matSkinTone1 = this.renderer.createToonMaterial({ color: 0xf6d7b0, gradientBands: 2 });
    this.matSkinTone2 = this.renderer.createToonMaterial({ color: 0xd4a373, gradientBands: 2 });
    this.matSkinTone3 = this.renderer.createToonMaterial({ color: 0x8d5524, gradientBands: 2 });
    this.matCapRed = this.renderer.createToonMaterial({ color: 0xdc2626, gradientBands: 2 });
    this.matCapBlack = this.renderer.createToonMaterial({ color: 0x18181b, gradientBands: 2 });
    this.matToolChrome = this.renderer.createToonMaterial({ color: 0xe2e8f0, gradientBands: 3 });
    this.matToolRed = this.renderer.createToonMaterial({ color: 0xb91c1c, gradientBands: 2 });
    this.matToolGrip = this.renderer.createToonMaterial({ color: 0x0f172a, gradientBands: 2 });
    this.matScreenGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.matWorkLamp = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.matBoots = this.renderer.createToonMaterial({ color: 0x27272a, gradientBands: 2 });
  }

  // ---------------------------------------------------------------------------
  // Build Stylized 3D Cel-Shaded Mechanic Pit Crew
  // ---------------------------------------------------------------------------
  buildMechanicCrew() {
    // 1. Lead Engine Tuner
    this.mechanicEngine = this.createMechanicCharacter({
      role: 'tuner',
      coverallMat: this.matCoverallsNavy,
      skinMat: this.matSkinTone1,
      capMat: this.matCapRed,
      hasCap: true,
      tool: 'wrench'
    });
    this.crewGroup.add(this.mechanicEngine.root);

    // 2. Left Front Wheel Technician
    this.mechanicWheelL = this.createMechanicCharacter({
      role: 'wheel_left',
      coverallMat: this.matCoverallsOrange,
      skinMat: this.matSkinTone2,
      capMat: this.matCapBlack,
      hasCap: true,
      tool: 'impact_gun'
    });
    this.crewGroup.add(this.mechanicWheelL.root);

    // 3. Right Brake & Tire Tech
    this.mechanicWheelR = this.createMechanicCharacter({
      role: 'wheel_right',
      coverallMat: this.matCoverallsOrange,
      skinMat: this.matSkinTone3,
      capMat: this.matCapBlack,
      hasCap: false,
      tool: 'torque_wrench'
    });
    this.crewGroup.add(this.mechanicWheelR.root);

    // 4. Pit Crew Chief / Diagnostics Foreman
    this.mechanicChief = this.createMechanicCharacter({
      role: 'chief',
      coverallMat: this.matCoverallsSlate,
      skinMat: this.matSkinTone1,
      capMat: this.matCapBlack,
      hasCap: true,
      tool: 'clipboard'
    });
    this.crewGroup.add(this.mechanicChief.root);

    // 5. Underbody Inspector
    this.mechanicUnderbody = this.createMechanicCharacter({
      role: 'underbody',
      coverallMat: this.matCoverallsNavy,
      skinMat: this.matSkinTone2,
      capMat: this.matCapRed,
      hasCap: true,
      tool: 'work_lamp'
    });
    this.crewGroup.add(this.mechanicUnderbody.root);
  }

  createMechanicCharacter({ role, coverallMat, skinMat, capMat, hasCap, tool }) {
    const root = new THREE.Group();
    root.name = `Mechanic_${role}`;

    // Torso (Coveralls body)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.32), coverallMat);
    torso.position.set(0, 1.15, 0);
    torso.castShadow = true;
    root.add(torso);

    // Coveralls Collar & Chest Patch
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.34), coverallMat);
    collar.position.set(0, 1.48, 0);
    root.add(collar);

    const logoBadge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.02), this.matScreenGlow);
    logoBadge.position.set(-0.14, 1.30, 0.17);
    root.add(logoBadge);

    // Pelvis / Belt
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.30), coverallMat);
    pelvis.position.set(0, 0.82, 0);
    root.add(pelvis);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.32), this.matToolGrip);
    belt.position.set(0, 0.88, 0);
    root.add(belt);

    // Tool Holster on Belt
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.10), this.matToolGrip);
    holster.position.set(0.28, 0.84, 0.05);
    root.add(holster);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0);
    root.add(headGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.32, 0.30), skinMat);
    headGroup.add(head);

    // Eyes / Brow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.04), this.matBoots);
    brow.position.set(0, 0.06, 0.155);
    headGroup.add(brow);

    if (hasCap) {
      const capCrown = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.16, 0.33), capMat);
      capCrown.position.set(0, 0.16, 0);
      headGroup.add(capCrown);

      const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.22), capMat);
      capBrim.position.set(0, 0.10, 0.24);
      headGroup.add(capBrim);
    }

    // Left Arm (Shoulder & Forearm)
    const armL = new THREE.Group();
    armL.position.set(-0.35, 1.40, 0);
    root.add(armL);

    const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.16), coverallMat);
    upperArmL.position.set(0, -0.16, 0);
    armL.add(upperArmL);

    const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), skinMat);
    forearmL.position.set(0, -0.42, 0.06);
    armL.add(forearmL);

    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), this.matToolGrip);
    handL.position.set(0, -0.60, 0.10);
    armL.add(handL);

    // Right Arm (Shoulder & Forearm)
    const armR = new THREE.Group();
    armR.position.set(0.35, 1.40, 0);
    root.add(armR);

    const upperArmR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.16), coverallMat);
    upperArmR.position.set(0, -0.16, 0);
    armR.add(upperArmR);

    const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), skinMat);
    forearmR.position.set(0, -0.42, 0.06);
    armR.add(forearmR);

    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), this.matToolGrip);
    handR.position.set(0, -0.60, 0.10);
    armR.add(handR);

    // Attached Tool in Hand
    let toolMesh = null;
    if (tool === 'wrench') {
      toolMesh = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.04), this.matToolChrome);
      const headC = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), this.matToolChrome);
      headC.position.set(0, 0.18, 0);
      toolMesh.add(handle, headC);
      toolMesh.position.set(0, -0.64, 0.18);
      toolMesh.rotation.x = Math.PI * 0.45;
      armR.add(toolMesh);
    } else if (tool === 'impact_gun') {
      toolMesh = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.16), this.matToolRed);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.24, 8), this.matToolChrome);
      barrel.rotation.x = Math.PI * 0.5;
      barrel.position.set(0, 0.04, 0.18);
      const airHose = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), this.matToolGrip);
      airHose.position.set(0, -0.22, -0.06);
      toolMesh.add(body, barrel, airHose);
      toolMesh.position.set(0, -0.62, 0.20);
      toolMesh.rotation.x = Math.PI * 0.45;
      armR.add(toolMesh);
    } else if (tool === 'torque_wrench') {
      toolMesh = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.05), this.matToolChrome);
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), this.matToolRed);
      dial.position.set(0, 0.15, 0);
      toolMesh.add(shaft, dial);
      toolMesh.position.set(0, -0.62, 0.20);
      toolMesh.rotation.x = Math.PI * 0.45;
      armR.add(toolMesh);
    } else if (tool === 'clipboard') {
      toolMesh = new THREE.Group();
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.03), this.matToolGrip);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.36), this.matScreenGlow);
      screen.position.set(0, 0, 0.02);
      toolMesh.add(board, screen);
      toolMesh.position.set(0, -0.55, 0.22);
      toolMesh.rotation.x = Math.PI * 0.30;
      armL.add(toolMesh);
    } else if (tool === 'work_lamp') {
      toolMesh = new THREE.Group();
      const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 8), this.matToolRed);
      const lampGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), this.matWorkLamp);
      lampGlow.position.set(0, 0.06, 0);
      toolMesh.add(lampBody, lampGlow);
      toolMesh.position.set(0, -0.58, 0.15);
      toolMesh.rotation.x = Math.PI * 0.25;
      armR.add(toolMesh);
    }

    // Legs & Boots
    const legL = new THREE.Group();
    legL.position.set(-0.16, 0.72, 0);
    root.add(legL);

    const upperLegL = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.42, 0.20), coverallMat);
    upperLegL.position.set(0, -0.20, 0);
    legL.add(upperLegL);

    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.34), this.matBoots);
    bootL.position.set(0, -0.56, 0.06);
    legL.add(bootL);

    const legR = new THREE.Group();
    legR.position.set(0.16, 0.72, 0);
    root.add(legR);

    const upperLegR = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.42, 0.20), coverallMat);
    upperLegR.position.set(0, -0.20, 0);
    legR.add(upperLegR);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.34), this.matBoots);
    bootR.position.set(0, -0.56, 0.06);
    legR.add(bootR);

    return {
      root,
      headGroup,
      armL,
      armR,
      legL,
      legR,
      torso,
      toolMesh,
      role
    };
  }

  // ---------------------------------------------------------------------------
  // Particle VFX Engine (Sparks, Steam, Polish Gleams)
  // ---------------------------------------------------------------------------
  initVFXPool() {
    this.sparkParticles = [];
    this.maxSparks = 60;
    const sparkGeo = new THREE.BoxGeometry(0.045, 0.045, 0.12);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    for (let i = 0; i < this.maxSparks; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat);
      mesh.visible = false;
      this.vfxGroup.add(mesh);
      this.sparkParticles.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.35
      });
    }

    // Steam / Pneumatic Air Puff Sprites
    this.steamPuffs = [];
    this.maxSteam = 20;
    const steamGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < this.maxSteam; i++) {
      const mesh = new THREE.Mesh(steamGeo, steamMat);
      mesh.visible = false;
      this.vfxGroup.add(mesh);
      this.steamPuffs.push({
        mesh,
        vel: new THREE.Vector3(),
        scaleSpeed: 1.8,
        life: 0,
        maxLife: 0.65
      });
    }

    // Polish Starburst Gleam Flares
    this.gleamFlares = [];
    this.maxGleams = 8;
    const gleamGeo = new THREE.OctahedronGeometry(0.28, 0);
    const gleamMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < this.maxGleams; i++) {
      const mesh = new THREE.Mesh(gleamGeo, gleamMat);
      mesh.visible = false;
      this.vfxGroup.add(mesh);
      this.gleamFlares.push({
        mesh,
        life: 0,
        maxLife: 0.45,
        rotSpeed: 8.0
      });
    }
  }

  emitSparks(originPos, count = 12, dir = new THREE.Vector3(0, 1, 0), spread = 0.8) {
    let emitted = 0;
    for (let i = 0; i < this.sparkParticles.length && emitted < count; i++) {
      const sp = this.sparkParticles[i];
      if (sp.life <= 0) {
        sp.mesh.visible = true;
        sp.mesh.position.copy(originPos);
        sp.vel.set(
          dir.x + (Math.random() - 0.5) * spread * 2,
          dir.y + Math.random() * spread * 1.5 + 0.5,
          dir.z + (Math.random() - 0.5) * spread * 2
        ).normalize().multiplyScalar(4.5 + Math.random() * 6.5);
        sp.life = 0.001;
        sp.maxLife = 0.25 + Math.random() * 0.25;
        emitted++;
      }
    }
  }

  emitSteam(originPos, count = 4) {
    let emitted = 0;
    for (let i = 0; i < this.steamPuffs.length && emitted < count; i++) {
      const st = this.steamPuffs[i];
      if (st.life <= 0) {
        st.mesh.visible = true;
        st.mesh.position.copy(originPos);
        st.mesh.scale.set(0.4, 0.4, 0.4);
        st.vel.set(
          (Math.random() - 0.5) * 1.2,
          0.8 + Math.random() * 1.4,
          (Math.random() - 0.5) * 1.2
        );
        st.life = 0.001;
        st.maxLife = 0.45 + Math.random() * 0.35;
        emitted++;
      }
    }
  }

  emitGleam(originPos) {
    for (let i = 0; i < this.gleamFlares.length; i++) {
      const gl = this.gleamFlares[i];
      if (gl.life <= 0) {
        gl.mesh.visible = true;
        gl.mesh.position.copy(originPos);
        gl.life = 0.001;
        gl.maxLife = 0.40;
        break;
      }
    }
  }

  updateVFX(dt) {
    // 1. Sparks
    for (let i = 0; i < this.sparkParticles.length; i++) {
      const sp = this.sparkParticles[i];
      if (sp.life > 0) {
        sp.life += dt;
        if (sp.life >= sp.maxLife) {
          sp.life = 0;
          sp.mesh.visible = false;
        } else {
          sp.vel.y -= 14.0 * dt; // gravity
          sp.mesh.position.addScaledVector(sp.vel, dt);
          sp.mesh.lookAt(sp.mesh.position.clone().add(sp.vel));
          const fade = 1.0 - (sp.life / sp.maxLife);
          sp.mesh.scale.setScalar(fade);
        }
      }
    }

    // 2. Steam
    for (let i = 0; i < this.steamPuffs.length; i++) {
      const st = this.steamPuffs[i];
      if (st.life > 0) {
        st.life += dt;
        if (st.life >= st.maxLife) {
          st.life = 0;
          st.mesh.visible = false;
        } else {
          st.mesh.position.addScaledVector(st.vel, dt);
          const p = st.life / st.maxLife;
          const sc = 0.4 + p * 2.2;
          st.mesh.scale.setScalar(sc);
          st.mesh.material.opacity = (1.0 - p) * 0.65;
        }
      }
    }

    // 3. Gleams
    for (let i = 0; i < this.gleamFlares.length; i++) {
      const gl = this.gleamFlares[i];
      if (gl.life > 0) {
        gl.life += dt;
        if (gl.life >= gl.maxLife) {
          gl.life = 0;
          gl.mesh.visible = false;
        } else {
          const p = gl.life / gl.maxLife;
          const scale = Math.sin(p * Math.PI) * 1.5;
          gl.mesh.scale.setScalar(scale);
          gl.mesh.rotation.y += gl.rotSpeed * dt;
          gl.mesh.rotation.z += gl.rotSpeed * 0.5 * dt;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Start / Skip Cinematic Scene
  // ---------------------------------------------------------------------------
  startMechanicScene(targetShop = null) {
    if (this.isActive) return;

    // Locate closest or specified auto repair shop
    if (!targetShop) {
      const playerZ = this.physics ? this.physics.position.z : 0;
      let closestBay = AUTO_REPAIR_SHOPS[0];
      let closestDist = Math.abs(closestBay.z - playerZ);
      for (let i = 0; i < AUTO_REPAIR_SHOPS.length; i++) {
        const bay = AUTO_REPAIR_SHOPS[i];
        const dist = Math.abs(bay.z - playerZ);
        if (dist < closestDist) {
          closestDist = dist;
          closestBay = bay;
        }
      }
      targetShop = closestBay;
    }

    this.triggerMechanicScene(targetShop);
  }

  getShopWorldPos(locX, locY, locZ) {
    const cosR = Math.cos(this.shopRotY);
    const sinR = Math.sin(this.shopRotY);
    return new THREE.Vector3(
      this.shopPos.x + locX * cosR + locZ * sinR,
      this.shopPos.y + locY,
      this.shopPos.z - locX * sinR + locZ * cosR
    );
  }

  triggerMechanicScene(targetShop) {
    if (this.isActive) return;
    this.targetShop = targetShop;
    this.isActive = true;
    this.phase = 'ARRIVAL_LIFT';
    this.phaseTimer = 0.0;
    this.totalSceneTimer = 0.0;
    this.liftHeight = 0.0;
    this.targetLiftHeight = 0.0;
    this.group.visible = true;

    // Update Global Game State
    gameState.isMechanicCinematic = true;
    gameState.isServicing = true;
    gameState.mechanicShopName = targetShop.name;
    gameState.mechanicCinematicPhase = 'ARRIVAL_LIFT';
    gameState.mechanicCinematicProgress = 0.0;
    gameState.mechanicSubtitle = `🔧 PIT CREW CHIEF: "Vehicle locked on Bay 01 lift! Commencing complete chassis overhaul..."`;

    if (window.game && window.game.traffic) {
      window.game.traffic.servicedThisVisit = true;
    }

    // Position Player Vehicle squarely on hydraulic lift pad inside Bay 01
    const isRight = (targetShop.side === 'right');
    const lateral = isRight ? 34.0 : -34.0;
    const shopTrans = this.splineRoad.getRoadTransformAtZ(targetShop.z, lateral, 0.18);
    if (shopTrans) {
      this.shopPos.set(shopTrans.pos.x, shopTrans.pos.y, shopTrans.pos.z);
      this.shopHeading = shopTrans.heading;
      this.shopRotY = shopTrans.heading + (isRight ? -Math.PI * 0.5 : Math.PI * 0.5);
      this.isRightSide = isRight;

      // Inside Bay 01 lift pad: local X = 8.0, Y = 0.18, Z = 0.0
      const liftWorldPos = this.getShopWorldPos(8.0, 0.18, 0.0);
      this.bayPadX = liftWorldPos.x;
      this.bayPadY = liftWorldPos.y;
      this.bayPadZ = liftWorldPos.z;
      this.bayHeading = this.shopRotY + Math.PI; // facing out the garage door towards -X

      // Parking Lot Apron Staging Stance (outside in open lot, local X = -14.0, Y = 0.18, Z = 14.0)
      const parkWorldPos = this.getShopWorldPos(-14.0, 0.18, 14.0);
      this.parkingLotPos.copy(parkWorldPos);
      // Angled towards the highway merge ramp
      this.parkingLotHeading = isRight ? (shopTrans.heading - 0.22) : (shopTrans.heading + 0.22);

      // Bring car to full stop on lift pad
      this.physics.position.set(this.bayPadX, this.bayPadY, this.bayPadZ);
      this.physics.heading = this.bayHeading;
      this.physics.speed = 0;
      this.physics.velocity.set(0, 0, 0);
      this.physics.angularVelocity.set(0, 0, 0);
      this.physics.verticalVelocity = 0;
      this.physics.isGrounded = true;
      this.sportsCar.group.position.copy(this.physics.position);
      this.sportsCar.group.rotation.y = this.physics.heading;
      this.sportsCar.group.rotation.x = 0;
      this.sportsCar.group.rotation.z = 0;
      this.sportsCar.setSteeringAngle(0);

      // Position Pit Crew members relative to car on lift
      this.positionCrewMembers();
    }

    // Trigger Initial Hydraulic Whir and Air Brake
    if (this.soundEngine) {
      if (this.soundEngine.triggerHydraulicLiftWhir) {
        this.soundEngine.triggerHydraulicLiftWhir(true);
      }
      if (this.soundEngine.triggerAirBrakeSound) {
        this.soundEngine.triggerAirBrakeSound();
      }
    }
  }

  positionCrewMembers() {
    // 1. Lead Engine Tuner: in front of hood looking back at car
    const tunerPos = this.getShopWorldPos(10.7, 0, 0.0);
    this.mechanicEngine.root.position.copy(tunerPos);
    this.mechanicEngine.root.rotation.y = this.shopRotY;

    // 2. Left Front Wheel Tech: kneeling beside front-left wheel
    const wheelLPos = this.getShopWorldPos(9.35, 0, -1.55);
    this.mechanicWheelL.root.position.copy(wheelLPos);
    this.mechanicWheelL.root.rotation.y = this.shopRotY - Math.PI * 0.5;

    // 3. Right Brake Tech: beside rear-right wheel
    const wheelRPos = this.getShopWorldPos(6.65, 0, 1.55);
    this.mechanicWheelR.root.position.copy(wheelRPos);
    this.mechanicWheelR.root.rotation.y = this.shopRotY + Math.PI * 0.5;

    // 4. Pit Crew Chief: standing near diagnostic dyno screen
    const chiefPos = this.getShopWorldPos(11.8, 0, 2.6);
    this.mechanicChief.root.position.copy(chiefPos);
    this.mechanicChief.root.rotation.y = this.shopRotY - Math.PI * 0.75;

    // 5. Underbody Inspector: underneath center of car
    const underPos = this.getShopWorldPos(7.8, 0, 0.0);
    this.mechanicUnderbody.root.position.copy(underPos);
    this.mechanicUnderbody.root.rotation.y = this.shopRotY + Math.PI;
  }

  skipCinematic() {
    if (!this.isActive) return;

    // Instantly complete vehicle overhaul
    if (this.physics && this.physics.repairVehicle) {
      this.physics.repairVehicle();
    }
    if (this.soundEngine && this.soundEngine.triggerServiceBaySound) {
      this.soundEngine.triggerServiceBaySound();
    }
    if (this.soundEngine && this.soundEngine.triggerOverhaulRevSound) {
      this.soundEngine.triggerOverhaulRevSound();
    }

    // Safely station vehicle on the spacious parking lot apron facing the highway
    const finalPos = this.parkingLotPos && this.parkingLotPos.x !== 0 ? this.parkingLotPos : this.getShopWorldPos(-14.0, 0.18, 14.0);
    const finalHeading = this.parkingLotHeading || this.shopHeading;

    this.physics.position.set(finalPos.x, finalPos.y, finalPos.z);
    this.physics.heading = finalHeading;
    this.physics.speed = 0;
    this.physics.velocity.set(0, 0, 0);
    this.physics.angularVelocity.set(0, 0, 0);
    this.physics.verticalVelocity = 0;
    this.physics.isGrounded = true;
    this.physics.tumblePitch = 0;
    this.physics.tumbleRoll = 0;

    this.sportsCar.group.position.copy(this.physics.position);
    this.sportsCar.group.rotation.y = this.physics.heading;
    this.sportsCar.group.rotation.x = 0;
    this.sportsCar.group.rotation.z = 0;
    this.sportsCar.setSteeringAngle(0);

    this.isActive = false;
    this.phase = 'IDLE';
    this.group.visible = false;
    gameState.isMechanicCinematic = false;
    gameState.isServicing = false;
    gameState.mechanicCinematicProgress = 1.0;

    // Reset Camera behind vehicle on the parking lot
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.resetTracking();
    }

    // Action Toast
    const shopName = this.targetShop ? this.targetShop.name : 'AUTO REPAIR SHOP';
    if (window.game && window.game.hud && window.game.hud.showActionToast) {
      window.game.hud.showActionToast(
        '✨ 100% OVERHAUL COMPLETE',
        `${shopName.toUpperCase()} • CHASSIS RESTORED • READY TO DRIVE`,
        4000
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Main Update Loop
  // ---------------------------------------------------------------------------
  update(dt) {
    if (!this.isActive || this.phase === 'IDLE') {
      this.group.visible = false;
      return;
    }

    this.phaseTimer += dt;
    this.totalSceneTimer += dt;

    const totalDur = this.DURATIONS.ARRIVAL_LIFT +
                     this.DURATIONS.ENGINE_TUNING +
                     this.DURATIONS.WHEEL_TIRE_SWAP +
                     this.DURATIONS.UNDERBODY_DYNO +
                     this.DURATIONS.LOWER_LIFT +
                     this.DURATIONS.DRIVE_OUT_PARKING;

    gameState.mechanicCinematicProgress = Math.min(1.0, this.totalSceneTimer / totalDur);
    gameState.mechanicCinematicPhase = this.phase;

    // Update Hydraulic Lift Elevation (during bay lift phases)
    if (this.phase !== 'DRIVE_OUT_PARKING') {
      this.liftHeight = THREE.MathUtils.lerp(this.liftHeight, this.targetLiftHeight, dt * 3.5);
      this.physics.position.y = this.bayPadY + this.liftHeight;
      this.sportsCar.group.position.y = this.physics.position.y;
    }

    // Update Particle VFX
    this.updateVFX(dt);

    // State Machine Phases
    switch (this.phase) {
      case 'ARRIVAL_LIFT':
        this.updatePhaseArrivalLift(dt);
        break;
      case 'ENGINE_TUNING':
        this.updatePhaseEngineTuning(dt);
        break;
      case 'WHEEL_TIRE_SWAP':
        this.updatePhaseWheelSwap(dt);
        break;
      case 'UNDERBODY_DYNO':
        this.updatePhaseUnderbody(dt);
        break;
      case 'LOWER_LIFT':
        this.updatePhaseLowerLift(dt);
        break;
      case 'DRIVE_OUT_PARKING':
        this.updatePhaseDriveOutParking(dt);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 1: Arrival & Hydraulic Lift Rise
  // ---------------------------------------------------------------------------
  updatePhaseArrivalLift(dt) {
    const dur = this.DURATIONS.ARRIVAL_LIFT;
    const p = Math.min(1.0, this.phaseTimer / dur);
    this.targetLiftHeight = 1.15; // Lift vehicle 1.15m up

    // Animate Crew approaching the car
    const headNod = Math.sin(this.phaseTimer * 8.0) * 0.12;
    this.mechanicEngine.headGroup.rotation.x = 0.25 + headNod;
    this.mechanicChief.armL.rotation.x = -Math.PI * 0.35 + Math.sin(this.phaseTimer * 4.0) * 0.1;

    // Camera Shot 1: Low-Angle 3/4 Front tracking shot framing the ascending vehicle
    const carPos = this.sportsCar.group.position;
    const carHead = this.bayHeading;
    const camDist = 5.2;
    const camAngle = carHead + Math.PI * 0.32;

    this.cinematicCamPos.set(
      carPos.x - Math.sin(camAngle) * camDist,
      carPos.y + 0.65 + p * 0.45,
      carPos.z - Math.cos(camAngle) * camDist
    );
    this.cinematicLookAt.set(carPos.x, carPos.y + 0.65, carPos.z);
    this.cameraFov = 64;

    if (p >= 1.0) {
      this.phase = 'ENGINE_TUNING';
      this.phaseTimer = 0.0;
      gameState.mechanicSubtitle = `⚡ LEAD TUNER: "Ignition timing advanced, high-flow injectors mapped, manifold pressurized..."`;
      if (this.soundEngine && this.soundEngine.triggerToolClank) {
        this.soundEngine.triggerToolClank();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2: Engine Bay Tuning & Diagnostic Sparks
  // ---------------------------------------------------------------------------
  updatePhaseEngineTuning(dt) {
    const dur = this.DURATIONS.ENGINE_TUNING;
    const p = Math.min(1.0, this.phaseTimer / dur);

    // Animate Engine Tuner actively wrenching and checking engine block
    const wrenchRate = Math.sin(this.phaseTimer * 16.0);
    this.mechanicEngine.armR.rotation.x = -Math.PI * 0.45 + wrenchRate * 0.25;
    this.mechanicEngine.armR.rotation.z = wrenchRate * 0.15;
    this.mechanicEngine.headGroup.rotation.x = 0.35 + Math.sin(this.phaseTimer * 10.0) * 0.08;

    // Emit diagnostic engine bay sparks intermittently
    if (Math.random() < 0.32) {
      const carPos = this.sportsCar.group.position;
      const hoodWorld = new THREE.Vector3(
        carPos.x + Math.sin(this.bayHeading) * 1.8 + (Math.random() - 0.5) * 0.5,
        carPos.y + 0.65,
        carPos.z + Math.cos(this.bayHeading) * 1.8 + (Math.random() - 0.5) * 0.5
      );
      this.emitSparks(hoodWorld, 6, new THREE.Vector3(0, 1, 0), 0.6);
      if (Math.random() < 0.25 && this.soundEngine && this.soundEngine.triggerToolClank) {
        this.soundEngine.triggerToolClank();
      }
    }

    // Camera Shot 2: Over-The-Shoulder Close-Up into the glowing engine bay
    const carPos = this.sportsCar.group.position;
    const carHead = this.bayHeading;

    this.cinematicCamPos.set(
      carPos.x + Math.sin(carHead) * 3.2 + Math.cos(carHead) * 0.6,
      carPos.y + 1.65,
      carPos.z + Math.cos(carHead) * 3.2 - Math.sin(carHead) * 0.6
    );
    this.cinematicLookAt.set(
      carPos.x + Math.sin(carHead) * 1.5,
      carPos.y + 0.60,
      carPos.z + Math.cos(carHead) * 1.5
    );
    this.cameraFov = 54;

    if (p >= 1.0) {
      this.phase = 'WHEEL_TIRE_SWAP';
      this.phaseTimer = 0.0;
      gameState.mechanicSubtitle = `🛞 TIRE SPECIALIST: "High-grip compound slicks mounted, caliper torqued to spec!"`;
      if (this.soundEngine && this.soundEngine.triggerPneumaticImpactGun) {
        this.soundEngine.triggerPneumaticImpactGun(0.65);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 3: Pneumatic Impact Wheel Gun & Sparks
  // ---------------------------------------------------------------------------
  updatePhaseWheelSwap(dt) {
    const dur = this.DURATIONS.WHEEL_TIRE_SWAP;
    const p = Math.min(1.0, this.phaseTimer / dur);

    // Animate Wheel Technician with rapid impact gun vibration
    const gunShake = Math.sin(this.phaseTimer * 38.0) * 0.08;
    this.mechanicWheelL.armR.position.z = gunShake;
    this.mechanicWheelL.armR.rotation.x = -Math.PI * 0.40 + gunShake * 1.2;
    this.mechanicWheelL.headGroup.rotation.y = 0.25 + gunShake * 0.5;

    // Right side tech also works
    this.mechanicWheelR.armR.rotation.x = -Math.PI * 0.45 + Math.sin(this.phaseTimer * 12.0) * 0.2;

    // Burst sparks & steam from front-left wheel lug nuts
    if (this.phaseTimer > 0.3 && this.phaseTimer < 1.7 && Math.random() < 0.45) {
      const carPos = this.sportsCar.group.position;
      const wheelWorld = new THREE.Vector3(
        carPos.x + Math.sin(this.bayHeading) * 1.3 - Math.cos(this.bayHeading) * 1.05,
        carPos.y + 0.32,
        carPos.z + Math.cos(this.bayHeading) * 1.3 + Math.sin(this.bayHeading) * 1.05
      );
      this.emitSparks(wheelWorld, 8, new THREE.Vector3(-Math.cos(this.bayHeading), 0.6, Math.sin(this.bayHeading)), 0.7);
      if (Math.random() < 0.35) {
        this.emitSteam(wheelWorld, 3);
      }
    }

    // Camera Shot 3: Wheel-Level Dynamic Low Camera framing the pneumatic gun & rim
    const carPos = this.sportsCar.group.position;
    const carHead = this.bayHeading;
    const wheelX = carPos.x + Math.sin(carHead) * 1.3 - Math.cos(carHead) * 1.05;
    const wheelZ = carPos.z + Math.cos(carHead) * 1.3 + Math.sin(carHead) * 1.05;

    this.cinematicCamPos.set(
      wheelX - Math.cos(carHead) * 1.85 + Math.sin(carHead) * 0.4,
      carPos.y + 0.35 + Math.sin(p * Math.PI) * 0.15,
      wheelZ + Math.sin(carHead) * 1.85 + Math.cos(carHead) * 0.4
    );
    this.cinematicLookAt.set(wheelX, carPos.y + 0.35, wheelZ);
    this.cameraFov = 56;

    if (p >= 1.0) {
      this.phase = 'UNDERBODY_DYNO';
      this.phaseTimer = 0.0;
      gameState.mechanicSubtitle = `🔍 DIAGNOSTICS: "Laser suspension geometry true, nitro reserves topped to 100%!"`;
      if (this.soundEngine && this.soundEngine.triggerToolClank) {
        this.soundEngine.triggerToolClank();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 4: Underbody Inspection & Dyno Screen
  // ---------------------------------------------------------------------------
  updatePhaseUnderbody(dt) {
    const dur = this.DURATIONS.UNDERBODY_DYNO;
    const p = Math.min(1.0, this.phaseTimer / dur);

    // Animate Underbody Inspector shining work lamp underneath chassis
    const sweepRate = Math.sin(this.phaseTimer * 5.0);
    this.mechanicUnderbody.armR.rotation.y = sweepRate * 0.4;
    this.mechanicUnderbody.armR.rotation.x = -Math.PI * 0.25 + sweepRate * 0.15;
    this.mechanicUnderbody.headGroup.rotation.x = -0.45;

    // Animate Pit Chief tapping clipboard tablet
    this.mechanicChief.armR.rotation.x = -Math.PI * 0.35 + Math.sin(this.phaseTimer * 10.0) * 0.1;

    // Polish gleam sparkles appearing across vehicle body panels
    if (Math.random() < 0.4) {
      const carPos = this.sportsCar.group.position;
      const gleamPos = new THREE.Vector3(
        carPos.x + (Math.random() - 0.5) * 1.6,
        carPos.y + 0.75 + Math.random() * 0.4,
        carPos.z + (Math.random() - 0.5) * 3.2
      );
      this.emitGleam(gleamPos);
    }

    // Camera Shot 4: Low-Angle looking up under the vehicle toward the glowing shop dyno screen
    const carPos = this.sportsCar.group.position;
    const carHead = this.bayHeading;

    this.cinematicCamPos.set(
      carPos.x - Math.sin(carHead) * 3.4 + Math.cos(carHead) * 1.8,
      carPos.y - 0.25,
      carPos.z - Math.cos(carHead) * 3.4 - Math.sin(carHead) * 1.8
    );
    this.cinematicLookAt.set(
      carPos.x + Math.sin(carHead) * 1.2,
      carPos.y + 0.85,
      carPos.z + Math.cos(carHead) * 1.2
    );
    this.cameraFov = 62;

    if (p >= 1.0) {
      this.phase = 'LOWER_LIFT';
      this.phaseTimer = 0.0;
      this.targetLiftHeight = 0.0; // Lower lift back to ground!
      gameState.mechanicSubtitle = `✨ CREW CHIEF: "All systems green! Lowering lift and firing ignition!"`;

      // Full vehicle overhaul restoration
      if (this.physics && this.physics.repairVehicle) {
        this.physics.repairVehicle();
      }

      // Audio: Lower lift whir + Celestial Chime + Starter Crank
      if (this.soundEngine) {
        if (this.soundEngine.triggerHydraulicLiftWhir) {
          this.soundEngine.triggerHydraulicLiftWhir(false);
        }
        if (this.soundEngine.triggerServiceBaySound) {
          this.soundEngine.triggerServiceBaySound();
        }
        if (this.soundEngine.triggerStarterCrankAndIgnition) {
          this.soundEngine.triggerStarterCrankAndIgnition();
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 5: Lift Lowering & Ignition Roar
  // ---------------------------------------------------------------------------
  updatePhaseLowerLift(dt) {
    const dur = this.DURATIONS.LOWER_LIFT;
    const p = Math.min(1.0, this.phaseTimer / dur);
    this.targetLiftHeight = 0.0;

    // Pit Chief gives a proud thumbs-up!
    this.mechanicChief.armR.rotation.x = -Math.PI * 0.55;
    this.mechanicChief.armR.rotation.z = -0.35;
    this.mechanicChief.headGroup.rotation.x = 0.1;

    // Twin exhaust puffs & sparks as engine roars to life
    if (this.phaseTimer > 0.3 && this.phaseTimer < 1.3 && Math.random() < 0.6) {
      const carPos = this.sportsCar.group.position;
      const exhaustWorld = new THREE.Vector3(
        carPos.x - Math.sin(this.bayHeading) * 2.2 + (Math.random() - 0.5) * 0.6,
        carPos.y + 0.25,
        carPos.z - Math.cos(this.bayHeading) * 2.2 + (Math.random() - 0.5) * 0.6
      );
      this.emitSteam(exhaustWorld, 3);
      this.emitSparks(exhaustWorld, 4, new THREE.Vector3(-Math.sin(this.bayHeading), 0.3, -Math.cos(this.bayHeading)), 0.4);
    }

    // Camera: Hero 3/4 Front Angle framing the car settling onto the pad
    const carPos = this.sportsCar.group.position;
    const camAngle = this.bayHeading - Math.PI * 0.28;
    const camDist = 5.2;

    this.cinematicCamPos.set(
      carPos.x - Math.sin(camAngle) * camDist,
      carPos.y + 1.25,
      carPos.z - Math.cos(camAngle) * camDist
    );
    this.cinematicLookAt.set(carPos.x, carPos.y + 0.75, carPos.z);
    this.cameraFov = 60;

    if (p >= 1.0) {
      this.phase = 'DRIVE_OUT_PARKING';
      this.phaseTimer = 0.0;
      gameState.mechanicSubtitle = `🚗 PIT CREW CHIEF: "You're cleared to roll! Take her away!"`;

      if (this.soundEngine && this.soundEngine.triggerOverhaulRevSound) {
        this.soundEngine.triggerOverhaulRevSound();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 6: Drive Out of Bay into the Open Parking Lot (Cinematic Roll-Out)
  // ---------------------------------------------------------------------------
  updatePhaseDriveOutParking(dt) {
    const dur = this.DURATIONS.DRIVE_OUT_PARKING;
    const p = Math.min(1.0, this.phaseTimer / dur);
    // Smooth Hermite S-Curve easing for realistic roll out and stop
    const s = p * p * (3.0 - 2.0 * p);

    // 1. Vehicle Trajectory: From Bay 01 lift (local X=8, Z=0) -> garage door threshold (local X=0) -> parking lot (local X=-14, Z=14)
    const curLocX = THREE.MathUtils.lerp(8.0, -14.0, s);
    const curLocZ = s < 0.35 ? 0.0 : THREE.MathUtils.lerp(0.0, 14.0, Math.pow((s - 0.35) / 0.65, 1.4));

    const worldCarPos = this.getShopWorldPos(curLocX, 0.18, curLocZ);
    this.physics.position.copy(worldCarPos);
    this.sportsCar.group.position.copy(worldCarPos);

    // 2. Vehicle Heading: Smooth turn towards highway merge orientation
    const curHeading = s < 0.25 
      ? this.bayHeading 
      : THREE.MathUtils.lerp(this.bayHeading, this.parkingLotHeading, (s - 0.25) / 0.75);
    this.physics.heading = curHeading;
    this.sportsCar.group.rotation.y = curHeading;

    // 3. Dynamic Wheel Steering Angle & Rolling
    const steerAngle = (s > 0.25 && s < 0.85) ? (this.isRightSide ? -0.32 : 0.32) : 0.0;
    this.sportsCar.setSteeringAngle(steerAngle);

    const driveSpeed = (1.0 - Math.abs(p - 0.5) * 1.8) * 12.0;
    this.sportsCar.updateWheels(driveSpeed, dt);

    // 4. Pit Crew Waving from garage doorway
    this.mechanicChief.armR.rotation.x = -Math.PI * 0.65 + Math.sin(this.phaseTimer * 8.0) * 0.25;
    this.mechanicChief.armR.rotation.z = -0.4;
    this.mechanicEngine.armR.rotation.x = -Math.PI * 0.60 + Math.sin(this.phaseTimer * 8.0 + 1.0) * 0.2;

    // 5. Cinematic Tracking Camera: Stationed in the open parking lot backing up ahead of the car
    // Gives a breathtaking cinematic view of the car rolling out of the garage into the sunlit parking lot
    const camTargetLocX = curLocX - 5.8;
    const camTargetLocZ = curLocZ + 4.5;
    const camHeight = 1.65 + Math.sin(p * Math.PI) * 0.35;
    const targetCamWorld = this.getShopWorldPos(camTargetLocX, camHeight, camTargetLocZ);

    this.cinematicCamPos.lerp(targetCamWorld, 0.14);
    this.cinematicLookAt.set(worldCarPos.x, worldCarPos.y + 0.85, worldCarPos.z);
    this.cameraFov = THREE.MathUtils.lerp(58, 64, s);

    // Gentle exhaust haze during roll out
    if (Math.random() < 0.35) {
      const exhaustWorld = new THREE.Vector3(
        worldCarPos.x - Math.sin(curHeading) * 2.2,
        worldCarPos.y + 0.25,
        worldCarPos.z - Math.cos(curHeading) * 2.2
      );
      this.emitSteam(exhaustWorld, 2);
    }

    if (p >= 1.0) {
      this.skipCinematic();
    }
  }

  getCameraTransform() {
    return {
      pos: this.cinematicCamPos,
      lookAt: this.cinematicLookAt,
      fov: this.cameraFov
    };
  }
}
