import * as THREE from 'three';
import { gameState } from '../state.js';
import { AUTO_REPAIR_SHOPS } from '../world/SplineRoad.js';
import { TowTruck } from '../vehicles/TowTruck.js';

/**
 * TowTruckManager: 3D Cinematic Tow Truck Dispatch & Highway Convoy Director
 * 
 * Orchestrates an authentic, 5-phase cinematic experience:
 * 1. APPROACH: Heavy-duty commercial tow truck drives on scene with flashing strobes & air brakes.
 * 2. HITCH: Tow truck backs up, extends winch arm & cable, locking securely to the player's sports car.
 * 3. TOW_CRUISE: Convoy cruises along Highway 1 at 45 mph with dynamic scenic camera cuts & live GPS telemetry.
 * 4. SHOP_ENTRY: Tow truck pulls off Highway 1 across the forecourt apron into the illuminated Drive-In Service Bay.
 * 5. OVERHAUL: Full vehicle overhaul completed, pneumatic tools sound, and smooth camera return to player.
 */
export class TowTruckManager {
  constructor(renderer, splineRoad, physics, sportsCar, soundEngine) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.physics = physics;
    this.sportsCar = sportsCar;
    this.soundEngine = soundEngine;

    // 3D Tow Truck Vehicle
    this.towTruck = new TowTruck(renderer);
    this.towTruck.group.visible = false;
    this.group = new THREE.Group();
    this.group.name = 'TowTruckManager_Group';
    this.group.visible = false;
    this.group.add(this.towTruck.group);

    // Cinematic State Machine
    this.phase = 'IDLE'; // 'IDLE' | 'APPROACH' | 'HITCH' | 'TOW_CRUISE' | 'SHOP_ENTRY' | 'OVERHAUL'
    this.phaseTimer = 0.0;
    this.totalTowTimer = 0.0;

    // Phase Durations
    this.DURATIONS = {
      APPROACH: 3.8,
      HITCH: 3.2,
      TOW_CRUISE: 8.5,
      SHOP_ENTRY: 3.6,
      OVERHAUL: 2.2
    };

    // Tracking & Navigation
    this.targetShop = null;
    this.startRoadZ = 0;
    this.startCarPos = new THREE.Vector3();
    this.startCarHeading = 0;
    this.currentTowTruckPos = new THREE.Vector3();
    this.currentTowTruckHeading = 0;
    this.towCruisingSpeedMps = 20.0; // ~45 mph

    // Camera Director State
    this.cinematicCamPos = new THREE.Vector3();
    this.cinematicLookAt = new THREE.Vector3();
    this.cameraCutIndex = 0;
    this.cameraCutTimer = 0.0;

    // Subtitle & Telemetry State
    this.currentRadioSubtitle = '';
    this.distanceToShop = 0;
  }

  startTow() {
    if (gameState.isTowing && this.phase !== 'IDLE') return;

    // 1. Locate Nearest Auto Repair Shop along Highway 1
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

    this.targetShop = closestBay;
    this.startRoadZ = playerZ;
    this.startCarPos.copy(this.physics.position);
    this.startCarHeading = this.physics.heading;

    // Update Global Game State
    gameState.isTowing = true;
    gameState.hasGameStarted = true;
    gameState.isIntroActive = false;
    gameState.towShopName = closestBay.name;
    gameState.towProgress = 0.0;
    gameState.isDamageCritical = false;

    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.isIntro = false;
    }

    // 2. Bring Player Car to safe rest on shoulder/lane
    this.physics.speed = 0;
    this.physics.velocity.set(0, 0, 0);
    this.physics.verticalVelocity = 0;
    this.physics.angularVelocity.set(0, 0, 0);

    // 3. Initialize Tow Truck in Scene
    this.group.visible = true;
    this.towTruck.group.visible = true;

    // Position tow truck ~45m ahead on the road facing backward or rolling in from ahead
    const approachTrans = this.splineRoad.getRoadTransformAtZ(playerZ + 48, -0.6, 0.18);
    if (approachTrans) {
      this.currentTowTruckPos.copy(approachTrans.pos);
      this.currentTowTruckHeading = approachTrans.heading;
      this.towTruck.group.position.copy(this.currentTowTruckPos);
      this.towTruck.group.rotation.y = this.currentTowTruckHeading;
    }

    // 4. Begin Phase 1: Dispatch Arrival
    this.phase = 'APPROACH';
    this.phaseTimer = 0.0;
    this.totalTowTimer = 0.0;
    this.cameraCutIndex = 0;
    this.cameraCutTimer = 0.0;
    this.currentRadioSubtitle = `🚨 HIGHWAY DISPATCH ➔ UNIT 4: Stranded vehicle located at Mile ${(playerZ / 1000).toFixed(1)}. Arriving on scene...`;

    // Trigger Initial Radio Dispatch Horn & Sound
    if (this.soundEngine && this.soundEngine.triggerTowTruckSound) {
      this.soundEngine.triggerTowTruckSound();
    }
  }

  skipCinematic() {
    if (!gameState.isTowing) return;

    // Instant Complete & Overhaul at Nearest Repair Shop
    const targetShop = this.targetShop || AUTO_REPAIR_SHOPS[0];
    const shopZ = targetShop.z;
    const lateral = targetShop.side === 'right' ? -34.0 : 34.0;
    const trans = this.splineRoad.getRoadTransformAtZ(shopZ, lateral, 0.18);

    if (trans) {
      const cosH = Math.cos(trans.heading);
      const sinH = Math.sin(trans.heading);
      const bayWorldX = trans.pos.x + 8.0 * cosH;
      const bayWorldZ = trans.pos.z - 8.0 * sinH;
      const bayWorldY = trans.pos.y + 0.18;

      this.physics.position.set(bayWorldX, bayWorldY, bayWorldZ);
      this.physics.heading = trans.heading;
      this.physics.speed = 0;
      this.physics.velocity.set(0, 0, 0);
      this.sportsCar.group.position.copy(this.physics.position);
      this.sportsCar.group.rotation.y = this.physics.heading;
    }

    // Complete vehicle overhaul
    if (this.physics && this.physics.repairVehicle) {
      this.physics.repairVehicle();
    }

    if (this.soundEngine && this.soundEngine.triggerServiceBaySound) {
      this.soundEngine.triggerServiceBaySound();
    }

    // Cleanup Tow Truck
    this.group.visible = false;
    this.towTruck.group.visible = false;
    this.phase = 'IDLE';
    gameState.isTowing = false;
    gameState.towProgress = 1.0;
    gameState.hasDeclinedTowPrompt = false;

    // Reset Camera
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.resetTracking();
    }

    if (window.game && window.game.hud && window.game.hud.showActionToast) {
      window.game.hud.showActionToast(
        '🔧 100% OVERHAUL COMPLETE',
        `${targetShop.name.toUpperCase()} • CHASSIS RESTORED • NITRO REFILLED`,
        4000
      );
    }
  }

  update(dt) {
    if (!gameState.isTowing || this.phase === 'IDLE') {
      this.group.visible = false;
      this.towTruck.group.visible = false;
      return;
    }

    this.phaseTimer += dt;
    this.totalTowTimer += dt;
    this.cameraCutTimer += dt;

    const totalEstimatedDuration = this.DURATIONS.APPROACH + this.DURATIONS.HITCH + this.DURATIONS.TOW_CRUISE + this.DURATIONS.SHOP_ENTRY + this.DURATIONS.OVERHAUL;
    gameState.towProgress = Math.min(1.0, this.totalTowTimer / totalEstimatedDuration);

    switch (this.phase) {
      case 'APPROACH':
        this.updatePhaseApproach(dt);
        break;
      case 'HITCH':
        this.updatePhaseHitch(dt);
        break;
      case 'TOW_CRUISE':
        this.updatePhaseTowCruise(dt);
        break;
      case 'SHOP_ENTRY':
        this.updatePhaseShopEntry(dt);
        break;
      case 'OVERHAUL':
        this.updatePhaseOverhaul(dt);
        break;
    }

    // Update Tow Truck Internal Animations (Wheels, lightbars, winch cable)
    const hitchPointWorld = new THREE.Vector3(0, 0.45, 1.85).applyMatrix4(this.sportsCar.group.matrixWorld);
    const speedMps = (this.phase === 'APPROACH' || this.phase === 'TOW_CRUISE' || this.phase === 'SHOP_ENTRY') ? 18.0 : 0.0;
    this.towTruck.update(dt, speedMps, 0, (this.phase !== 'APPROACH'), hitchPointWorld);
  }

  // ---------------------------------------------------------------------------
  // Phase 1: Dispatch Arrival
  // ---------------------------------------------------------------------------
  updatePhaseApproach(dt) {
    const dur = this.DURATIONS.APPROACH;
    const p = Math.min(1.0, this.phaseTimer / dur);
    // Smooth deceleration ease
    const easeP = 1.0 - Math.pow(1.0 - p, 2.5);

    const carZ = this.startRoadZ;
    // Tow truck starts 48m ahead and backs up / pulls in right in front of the car (+6.8m ahead)
    const truckZ = THREE.MathUtils.lerp(carZ + 48.0, carZ + 6.8, easeP);
    const trans = this.splineRoad.getRoadTransformAtZ(truckZ, 0.1, 0.18);

    if (trans) {
      this.currentTowTruckPos.copy(trans.pos);
      this.currentTowTruckHeading = trans.heading;
      this.towTruck.group.position.copy(this.currentTowTruckPos);
      this.towTruck.group.rotation.y = this.currentTowTruckHeading;
    }

    // Camera: Low-angle roadside tracking shot framing the arriving tow truck
    const sideTrans = this.splineRoad.getRoadTransformAtZ(carZ - 8.0, -4.5, 1.2);
    if (sideTrans) {
      this.cinematicCamPos.copy(sideTrans.pos);
      this.cinematicLookAt.set(
        (this.currentTowTruckPos.x + this.startCarPos.x) * 0.5,
        this.startCarPos.y + 1.2,
        (this.currentTowTruckPos.z + this.startCarPos.z) * 0.5
      );
    }

    if (p >= 1.0) {
      this.phase = 'HITCH';
      this.phaseTimer = 0.0;
      this.currentRadioSubtitle = '⛓️ UNIT 4: Securing winch cables & wheel-lift stinger to front axle...';
      if (this.soundEngine && this.soundEngine.triggerAirBrakeSound) {
        this.soundEngine.triggerAirBrakeSound();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2: Hitching & Winch Connection
  // ---------------------------------------------------------------------------
  updatePhaseHitch(dt) {
    const dur = this.DURATIONS.HITCH;
    const p = Math.min(1.0, this.phaseTimer / dur);

    // Tow truck firmly locked in front of car (+6.2m)
    const carZ = this.startRoadZ;
    const trans = this.splineRoad.getRoadTransformAtZ(carZ + 6.2, 0.0, 0.18);
    if (trans) {
      this.currentTowTruckPos.copy(trans.pos);
      this.currentTowTruckHeading = trans.heading;
      this.towTruck.group.position.copy(this.currentTowTruckPos);
      this.towTruck.group.rotation.y = this.currentTowTruckHeading;
    }

    // Car front end slightly lifts by 0.12m as winch tightens
    const liftProgress = Math.min(1.0, p * 1.5);
    this.physics.position.y = this.startCarPos.y + liftProgress * 0.12;
    this.sportsCar.group.position.copy(this.physics.position);

    // Camera: Dynamic close-up pan around the connection hitch
    const camAngle = this.currentTowTruckHeading + Math.PI * 0.5 + p * Math.PI * 0.45;
    const camDist = 4.2;
    this.cinematicCamPos.set(
      this.currentTowTruckPos.x - Math.sin(camAngle) * camDist,
      this.currentTowTruckPos.y + 0.85 + Math.sin(p * Math.PI) * 0.35,
      this.currentTowTruckPos.z - Math.cos(camAngle) * camDist
    );
    this.cinematicLookAt.set(
      this.currentTowTruckPos.x,
      this.currentTowTruckPos.y + 0.65,
      this.currentTowTruckPos.z - 2.8
    );

    if (p >= 1.0) {
      this.phase = 'TOW_CRUISE';
      this.phaseTimer = 0.0;
      this.currentRadioSubtitle = `🚚 UNIT 4: Convoy rolling! Towing sports car to ${this.targetShop.name}...`;
      if (this.soundEngine && this.soundEngine.triggerTowHitchLockSound) {
        this.soundEngine.triggerTowHitchLockSound();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 3: Highway Convoy Cruise along Spline Road
  // ---------------------------------------------------------------------------
  updatePhaseTowCruise(dt) {
    const dur = this.DURATIONS.TOW_CRUISE;
    const p = Math.min(1.0, this.phaseTimer / dur);
    // Smooth S-Curve Cruise Pacing
    const s = p * p * (3 - 2 * p);

    const startZ = this.startRoadZ;
    const targetShopZ = this.targetShop ? this.targetShop.z : startZ + 1200;
    // Cruise smoothly from start road coordinate up to shop approach (-25m before shop)
    const currentConvoyZ = THREE.MathUtils.lerp(startZ, targetShopZ - 25.0, s);
    this.distanceToShop = Math.max(0, Math.round(targetShopZ - currentConvoyZ));

    // Update Tow Truck along highway center
    const truckTrans = this.splineRoad.getRoadTransformAtZ(currentConvoyZ + 6.2, 0.0, 0.18);
    if (truckTrans) {
      this.currentTowTruckPos.copy(truckTrans.pos);
      this.currentTowTruckHeading = truckTrans.heading;
      this.towTruck.group.position.copy(this.currentTowTruckPos);
      this.towTruck.group.rotation.y = this.currentTowTruckHeading;
    }

    // Update Player Car rigidly attached behind tow truck
    const carTrans = this.splineRoad.getRoadTransformAtZ(currentConvoyZ, 0.0, 0.18);
    if (carTrans) {
      this.physics.position.copy(carTrans.pos);
      this.physics.position.y += 0.12; // lifted front
      this.physics.heading = carTrans.heading;
      this.sportsCar.group.position.copy(this.physics.position);
      this.sportsCar.group.rotation.y = this.physics.heading;
      // Spin player car wheels during tow
      const spinDelta = (this.towCruisingSpeedMps * dt) / 0.30;
      this.sportsCar.wheels.forEach(w => { w.rotation.x += spinDelta; });
    }

    // Multi-angle Cinematic Camera Cuts every 2.8s
    if (this.cameraCutTimer > 2.8) {
      this.cameraCutIndex = (this.cameraCutIndex + 1) % 3;
      this.cameraCutTimer = 0.0;
    }

    const tPos = this.currentTowTruckPos;
    const tHead = this.currentTowTruckHeading;

    if (this.cameraCutIndex === 0) {
      // Angle A: Side-profile sweeping convoy tracking camera
      const camX = tPos.x - Math.cos(tHead) * 7.5 - Math.sin(tHead) * 1.5;
      const camY = tPos.y + 1.65;
      const camZ = tPos.z + Math.sin(tHead) * 7.5 - Math.cos(tHead) * 1.5;
      this.cinematicCamPos.set(camX, camY, camZ);
      this.cinematicLookAt.set(tPos.x, tPos.y + 1.1, tPos.z - 2.8);
    } else if (this.cameraCutIndex === 1) {
      // Angle B: Low front-three-quarter camera looking back along the highway
      const camX = tPos.x + Math.sin(tHead) * 9.5 + Math.cos(tHead) * 3.5;
      const camY = tPos.y + 0.95;
      const camZ = tPos.z + Math.cos(tHead) * 9.5 - Math.sin(tHead) * 3.5;
      this.cinematicCamPos.set(camX, camY, camZ);
      this.cinematicLookAt.set(tPos.x, tPos.y + 1.2, tPos.z - 2.0);
    } else {
      // Angle C: Elevated scenic drone vista camera overlooking coastal cliffs & highway
      const camX = tPos.x - Math.sin(tHead) * 14.0 - Math.cos(tHead) * 6.0;
      const camY = tPos.y + 6.2;
      const camZ = tPos.z - Math.cos(tHead) * 14.0 + Math.sin(tHead) * 6.0;
      this.cinematicCamPos.set(camX, camY, camZ);
      this.cinematicLookAt.set(tPos.x, tPos.y + 0.8, tPos.z);
    }

    if (p >= 1.0) {
      this.phase = 'SHOP_ENTRY';
      this.phaseTimer = 0.0;
      this.currentRadioSubtitle = `🔧 UNIT 4: Arriving at ${this.targetShop.name}. Pulling into Drive-In Bay 01...`;
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 4: Service Bay Arrival & Drive-In onto Hydraulic Lift
  // ---------------------------------------------------------------------------
  updatePhaseShopEntry(dt) {
    const dur = this.DURATIONS.SHOP_ENTRY;
    const p = Math.min(1.0, this.phaseTimer / dur);
    const easeP = p * p * (3 - 2 * p);

    const shop = this.targetShop || AUTO_REPAIR_SHOPS[0];
    const lateral = shop.side === 'right' ? -34.0 : 34.0;
    const shopTrans = this.splineRoad.getRoadTransformAtZ(shop.z, lateral, 0.18);
    const roadTrans = this.splineRoad.getRoadTransformAtZ(shop.z - 20.0, 0.0, 0.18);

    if (shopTrans && roadTrans) {
      // Forecourt Apron & Bay 01 target coordinates
      const cosH = Math.cos(shopTrans.heading);
      const sinH = Math.sin(shopTrans.heading);
      const bayPadX = shopTrans.pos.x + 8.0 * cosH;
      const bayPadZ = shopTrans.pos.z - 8.0 * sinH;
      const bayPadY = shopTrans.pos.y + 0.18;

      // Tow truck pulls inside Bay 01 and forward slightly to X=12.0
      const truckFinalX = shopTrans.pos.x + 12.5 * cosH;
      const truckFinalZ = shopTrans.pos.z - 12.5 * sinH;

      const truckX = THREE.MathUtils.lerp(roadTrans.pos.x, truckFinalX, easeP);
      const truckY = THREE.MathUtils.lerp(roadTrans.pos.y, bayPadY, easeP);
      const truckZ = THREE.MathUtils.lerp(roadTrans.pos.z, truckFinalZ, easeP);

      this.currentTowTruckPos.set(truckX, truckY, truckZ);
      this.currentTowTruckHeading = THREE.MathUtils.lerp(roadTrans.heading, shopTrans.heading - Math.PI * 0.5, easeP);
      this.towTruck.group.position.copy(this.currentTowTruckPos);
      this.towTruck.group.rotation.y = this.currentTowTruckHeading;

      // Sports car follows into Bay 01 right onto the hydraulic lift pad
      const carX = THREE.MathUtils.lerp(roadTrans.pos.x, bayPadX, easeP);
      const carY = THREE.MathUtils.lerp(roadTrans.pos.y, bayPadY, easeP);
      const carZ = THREE.MathUtils.lerp(roadTrans.pos.z, bayPadZ, easeP);

      this.physics.position.set(carX, carY, carZ);
      this.physics.heading = THREE.MathUtils.lerp(roadTrans.heading, shopTrans.heading - Math.PI * 0.5, easeP);
      this.sportsCar.group.position.copy(this.physics.position);
      this.sportsCar.group.rotation.y = this.physics.heading;

      // Camera: Low interior garage camera looking out toward the entrance door
      const interiorCamX = shopTrans.pos.x + 15.2 * cosH + 4.5 * sinH;
      const interiorCamY = bayPadY + 1.45;
      const interiorCamZ = shopTrans.pos.z - 15.2 * sinH + 4.5 * cosH;

      this.cinematicCamPos.set(interiorCamX, interiorCamY, interiorCamZ);
      this.cinematicLookAt.set(carX, carY + 1.1, carZ);
    }

    if (p >= 1.0) {
      // Towing delivery complete — handover to full 3D Mechanic Pit Crew Scene
      const deliveredShop = this.targetShop || AUTO_REPAIR_SHOPS[0];
      this.towTruck.group.visible = false;
      this.phase = 'IDLE';
      gameState.isTowing = false;
      gameState.towProgress = 1.0;
      gameState.hasDeclinedTowPrompt = false;

      if (window.game && window.game.mechanicSceneManager) {
        window.game.mechanicSceneManager.startMechanicScene(deliveredShop);
      } else {
        this.skipCinematic();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 5: Overhaul Complete & Seamless Return
  // ---------------------------------------------------------------------------
  updatePhaseOverhaul(dt) {
    this.skipCinematic();
  }

  getCameraTransform() {
    return {
      pos: this.cinematicCamPos,
      lookAt: this.cinematicLookAt
    };
  }
}
