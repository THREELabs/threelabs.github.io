import * as THREE from 'three';
import { PHYSICS, DAMAGE, ZONES, DRIVE_MODES } from '../constants.js';
import { gameState } from '../state.js';
import { TrailSpline } from '../world/TrailSpline.js';
import { DownhillSpline } from '../world/DownhillSpline.js';
import { TrailTrafficRules } from '../world/TrailTrafficRules.js';


export class VehiclePhysics {
  constructor(vehicleObject) {
    this.vehicle = vehicleObject;

    // Rigid body state
    this.position = new THREE.Vector3(0, 0.18, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // Yaw angle (radians)
    this.speed = 0;   // Forward velocity (m/s)
    
    // 4x4 Drivetrain & Transfer Case State
    this.driveMode = DRIVE_MODES.MODE_HIGH;
    this.diffLocked = false;
    this.trailStage = '';
    this.lastTrailStage = '';
    this._suggested4wd = false;
    this.is2WDStruggling = false;
    this._trailStruggleTimer = 0.0;

    this.pitch = 0;   // Ground slope pitch
    this.roll = 0;    // Ground slope roll
    this.tumblePitch = 0; // Dynamic 3D crash tumble pitch
    this.tumbleRoll = 0;  // Dynamic 3D crash tumble roll
    this.angularVelocity = new THREE.Vector3(0, 0, 0); // (pitchRate, yawRate, rollRate)
    this.isFlipped = false;
    this.rescueTimer = 0.0;
    this.carIntegrity = 100.0; // 100.0% -> 0.0% continuous health
    this.damageLevel = 0; // 0=pristine, 1=scrapes, 2=heavy impact, 3=catastrophic rollover

    // Blown Tire / Bare Rim Grinding State
    this.isTireBlown = false;
    this.blownWheelIndex = -1;
    this.criticalFatigueTimer = 0.0;

    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.driftFactor = 0;
    this.smoothedSteer = 0; // Smooth non-twitchy steering

    // Dynamic Lateral Slip & Authentic Drift Inertia
    this.lateralVelocity = 0; // Lateral slide velocity (m/s)
    this.slipAngle = 0;       // Tire slip angle (radians)

    // Dynamic Suspension Heave & Touchdown Compliance
    this.suspensionCompression = 0; // Vertical displacement (m)

    // Reverse Engagement Delay Timer (holding brake while stopped)
    this.stoppedBrakeHoldTime = 0.0;

    this.splineRoad = null;
    this.terrainChunk = null;
    this.obstacleSystem = null;
    this.gpuVFX = null;
    this.collidables = [];
  }

  setGPUVFX(gpuVFX) {
    this.gpuVFX = gpuVFX;
  }

  setWorldReferences(splineRoad, terrainChunk, obstacleSystemOrCollidables = null, collidableList = []) {
    this.splineRoad = splineRoad;
    this.trailTrafficRules = new TrailTrafficRules(splineRoad);
    this._trafficCandidate = new THREE.Vector3();
    this.terrainChunk = terrainChunk;
    if (obstacleSystemOrCollidables && obstacleSystemOrCollidables.resolveCollision) {
      this.obstacleSystem = obstacleSystemOrCollidables;
      this.collidables = collidableList;
    } else if (Array.isArray(obstacleSystemOrCollidables)) {
      this.collidables = obstacleSystemOrCollidables;
    }
  }

  setObstacleSystem(obstacleSystem) {
    this.obstacleSystem = obstacleSystem;
  }

  cycleDriveMode() {
    const modes = [DRIVE_MODES.MODE_HIGH, DRIVE_MODES.MODE_MID, DRIVE_MODES.MODE_LOW];
    const currentIndex = modes.indexOf(this.driveMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    this.setDriveMode(nextMode);
    return nextMode;
  }

  /** Direct 3-speed gear selection (1 = LOW, 2 = MID, 3 = HIGH) */
  setGear(gearNum) {
    if (gearNum === 1 || gearNum === '1' || gearNum === 'LOW') {
      return this.setDriveMode('LOW');
    } else if (gearNum === 2 || gearNum === '2' || gearNum === 'MID') {
      return this.setDriveMode('MID');
    } else {
      return this.setDriveMode('HIGH');
    }
  }

  /** 3-Speed gearbox: grade cap + trail climbing requirement */
  getGearClimbInfo(rInfoCheck) {
    // Precomputed per-gear max sustainable climb grade (%)
    // HIGH (3rd): ~4% (highway overdrive, stalls on trails & hills)
    // MID (2nd): ~16% (locked 4WD trail momentum; cannot conquer technical rock/mud/steep climbs)
    // LOW (1st): ~48% (rock crawl 4:1 torque multiplication with dual locked diffs)
    const GEAR_MAX_GRADE = { 'HIGH': 4.0, 'MID': 16.0, 'LOW': 48.0 };
    const smoothedPitch = (this._smoothedPitch !== undefined) ? this._smoothedPitch : this.pitch;
    let gradePct = Math.max(0, Math.tan(-smoothedPitch) * 100.0);
    let phaseGear = 'HIGH';
    let t = null;
    let isTechnical = false;
    let technicalReason = '';

    const isOnTrail = Boolean(rInfoCheck && rInfoCheck.isOnTrail);
    const trailLat = (rInfoCheck && typeof rInfoCheck.lateralDist === 'number') ? rInfoCheck.lateralDist : this.position.x;

    if (isOnTrail) {
      const trailQ = TrailSpline.queryTrail(trailLat, this.position.z);
      if (trailQ) {
        t = trailQ.t;
      }
      const techCheck = TrailSpline.isTechnicalClimb ? TrailSpline.isTechnicalClimb(trailLat, this.position.z, smoothedPitch) : null;
      if (techCheck && techCheck.isTechnical) {
        isTechnical = true;
        technicalReason = techCheck.reason;
        phaseGear = 'LOW'; // Technical section strictly requires Gear 1 (LOW)
      } else {
        phaseGear = 'MID'; // Moderate flowing trail sections can be climbed in Gear 2 (MID)
      }
    } else if (rInfoCheck && !rInfoCheck.isOnRoad) {
      // Off-road terrain outside marked trail (steep dunes, rocky canyon hills)
      if (gradePct > 16.0 || smoothedPitch < -0.16) {
        isTechnical = true;
        technicalReason = 'STEEP OFF-ROAD HILL (>16% GRADE)';
        phaseGear = 'LOW';
      } else if (gradePct > 4.0 || smoothedPitch < -0.04) {
        phaseGear = 'MID';
      } else {
        phaseGear = 'HIGH';
      }
    }

    return {
      gradePct,
      phaseGear,
      t,
      isTechnical,
      technicalReason,
      maxGrade: GEAR_MAX_GRADE[this.driveMode] || 4.0
    };
  }

  setDriveMode(rawMode) {
    let mode = rawMode;
    if (mode === '2H' || mode === '4H') mode = 'HIGH';
    if (mode === '4L') mode = 'LOW';
    if (!DRIVE_MODES.SPECS[mode]) mode = 'HIGH';

    this.driveMode = mode;
    this.diffLocked = DRIVE_MODES.SPECS[mode].diffLocked;
    gameState.driveMode = mode;
    gameState.diffLocked = this.diffLocked;
    this._wrongGearPhase = null;

    let isWrong = false;
    const rInfo = this.splineRoad ? this.splineRoad.getRoadInfo(this.position.x, this.position.z) : null;
    const climb = this.getGearClimbInfo(rInfo);

    if (gameState.isOnTrail || (rInfo && rInfo.isOnTrail)) {
      if (climb && climb.isTechnical) {
        // Technical sections strictly require Gear 1 (LOW)
        isWrong = (mode !== 'LOW');
      } else {
        // Moderate trail sections require LOW or MID (HIGH is wrong)
        isWrong = (mode === 'HIGH');
      }
    } else if (rInfo && !rInfo.isOnRoad) {
      if (climb && climb.isTechnical) {
        isWrong = (mode !== 'LOW');
      } else {
        // Off-road dirt/sand/slopes: LOW and MID are valid 4WD gears; HIGH (highway overdrive) is wrong
        isWrong = (mode === 'HIGH');
      }
    } else {
      const recMode = gameState.recommendedDriveMode || 'HIGH';
      isWrong = (mode !== recMode);
    }

    gameState.isWrongDrivetrain = isWrong;
    gameState.isWrongGear = isWrong;
    if (!isWrong) {
      this._wrongGearDuration = 0;
      this._trailStruggleTimer = 0;
      this.is2WDStruggling = false;
      gameState.is2WDStruggling = false;
      gameState.wrongGearTitle = '';
      gameState.wrongGearSubtitle = '';
      gameState.wrongGearAction = '';
      const alertEl = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('hud-gear-alert') : null;
      if (alertEl && alertEl.classList && typeof alertEl.classList.remove === 'function') {
        alertEl.classList.remove('visible');
      }
    }

    // Trigger mechanical transfer case clunk/click audio
    if (window.game && window.game.sound && window.game.sound.triggerTransferCaseShift) {
      window.game.sound.triggerTransferCaseShift(mode);
    }

    // Update HUD button state
    const spec = DRIVE_MODES.SPECS[mode];
    const hud = (window.game && window.game.hud) || this.hud;
    if (hud) {
      if (hud.btnToggle4x4) hud.btnToggle4x4.textContent = `[ ${mode} ]`;
      if (hud.telemetryBtnLabel) hud.telemetryBtnLabel.textContent = `GEAR [${mode}]`;
    }

    // Synchronize Shift Knob DOM if present
    const shifterKnob = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('touch-shifter-knob') : null;
    if (shifterKnob && typeof shifterKnob.setAttribute === 'function') {
      shifterKnob.setAttribute('data-mode', mode);
      const modeLabel = shifterKnob.querySelector ? shifterKnob.querySelector('#shifter-mode-text') : null;
      if (modeLabel) modeLabel.textContent = (mode === 'HIGH' ? '3' : (mode === 'MID' ? '2' : '1'));
      const posList = shifterKnob.querySelectorAll ? shifterKnob.querySelectorAll('.pattern-pos') : [];
      posList.forEach(p => {
        if (p.classList && p.getAttribute) {
          p.classList.toggle('active', p.getAttribute('data-pos') === mode);
        }
      });
      const lever = shifterKnob.querySelector ? shifterKnob.querySelector('#shifter-lever-assembly') : null;
      if (lever && !lever.classList.contains('dragging')) {
        const topPx = (mode === 'LOW') ? 50 : ((mode === 'MID') ? 27 : 4);
        lever.style.top = `${topPx}px`;
      }
    }
  }

  getGroundHeightAt(x, z) {
    let groundY = 0;
    if (this.terrainChunk) {
      groundY = this.terrainChunk.getGroundElevation(x, z);
    } else if (this.splineRoad) {
      const roadInfo = this.splineRoad.getRoadInfo(x, z);
      groundY = roadInfo.roadY;
    }
    // Cougar Ridge Summit Overlook, Boardwalk Bridge & Promontory Deck floor guarantee:
    // Ensures vehicle never falls through the timber bridge planks or drops into the canyon beneath the bridge
    const pDeck = { x: 259.02, z: 1126.81 }; // Overlook center
    const pProm = { x: 221.02, z: 1098.81 }; // Promontory center (telescope / arch)
    const bdx = pProm.x - pDeck.x;
    const bdz = pProm.z - pDeck.z;
    const bLenSq = bdx * bdx + bdz * bdz; // ~2228
    const bt = THREE.MathUtils.clamp(((x - pDeck.x) * bdx + (z - pDeck.z) * bdz) / bLenSq, 0, 1);
    const bProjX = pDeck.x + bt * bdx;
    const bProjZ = pDeck.z + bt * bdz;
    const bDistSq = (x - bProjX) ** 2 + (z - bProjZ) ** 2;
    const promDistSq = (x - pProm.x) ** 2 + (z - pProm.z) ** 2;
    const deckDistX = Math.abs(x - pDeck.x);
    const deckDistZ = Math.abs(z - pDeck.z);

    const onBoardwalkBridge = (bDistSq <= 5.2 * 5.2); // 10.4m wide collision buffer for the 6.8m bridge
    const onPromontoryDeck = (promDistSq <= 9.0 * 9.0); // 9.0m radius for the 6.8m circular deck
    const onMainOverlookDeck = (deckDistX <= 16.0 && deckDistZ <= 13.0); // 32m x 26m deck buffer

    if (onBoardwalkBridge || onPromontoryDeck || onMainOverlookDeck) {
      groundY = Math.max(groundY, 58.74);
    } else if (this.splineRoad && this.splineRoad.getCoyoteRidgeTrailInfo) {
      const trailInfo = this.splineRoad.getCoyoteRidgeTrailInfo(x, z);
      if (trailInfo && trailInfo.isSummit) {
        groundY = Math.max(groundY, 58.40);
      }
    }

    // Technical 4x4 Rock Crawling Obstacles elevation check (drive OVER rocks)
    if (this.splineRoad && this.splineRoad.getRoadInfo) {
      const rInfo = this.splineRoad.getRoadInfo(x, z);
      if (rInfo && rInfo.isOnTrail) {
        const rockBump = TrailSpline.getRockHeightAt(rInfo.lateralDist, z);
        if (rockBump > 0) {
          groundY += rockBump;
        }
      }
    }
    return groundY;
  }

  /**
   * Apply Structural & Kinetic Collision Damage with Localized Deformation Coordinates
   */
  applyDamage(amount, impactSpeedMph = 0, localX = 0, localZ = 1.0, localY = 0) {
    this.carIntegrity = THREE.MathUtils.clamp(this.carIntegrity - amount, 0, 100);
    gameState.carIntegrity = Math.round(this.carIntegrity);

    // Derive visual damage stage from continuous integrity (buffered so car stays pristine until 50%):
    // Stage 0: 50-100% (pristine — 100% top speed & handling, zero dents/wobble)
    // Stage 1: 25-49% (minor scrapes & light cosmetic marks)
    // Stage 2: 10-24% (moderate denting & slight radiator steam)
    // Stage 3: 0-9% (critical wreck, broken hanging wing, limp mode)
    let newStage = 0;
    if (this.carIntegrity < DAMAGE.STAGE_3_INTEGRITY) newStage = 3;
    else if (this.carIntegrity < DAMAGE.STAGE_2_INTEGRITY) newStage = 2;
    else if (this.carIntegrity < DAMAGE.STAGE_1_INTEGRITY) newStage = 1;

    this.damageLevel = newStage;
    gameState.damageStage = newStage;
    gameState.isDamageCritical = this.carIntegrity < DAMAGE.STAGE_3_INTEGRITY;

    // Check Critical Tire Blowout on Heavy Impact (only at < 4% integrity)
    if (this.carIntegrity < DAMAGE.TIRE_BLOWOUT_INTEGRITY && !this.isTireBlown) {
      this.triggerTireBlowout();
    }

    if (this.vehicle && this.vehicle.applyLocalizedImpact) {
      this.vehicle.applyLocalizedImpact(localX, localZ, localY, impactSpeedMph || 45);
    } else if (this.vehicle && this.vehicle.setDamageStage) {
      this.vehicle.setDamageStage(newStage, this.carIntegrity);
    }

    if (window.game && window.game.sound && window.game.sound.triggerCrash) {
      window.game.sound.triggerCrash(newStage);
    }
  }

  /**
   * Emergency Out-of-Bounds Rescue & Teleport Function
   * Safely places the vehicle directly onto the highway centerline with zero velocity, 
   * zero drift, and aligned road tangent heading.
   * NOTE: Damage is PRESERVED upon rescue (must visit an Auto Repair Shop).
   */
  respawnOnRoad(showToast = true, targetZ = null) {
    const desiredZ = targetZ !== null && targetZ !== undefined ? targetZ : this.position.z;
    const safeZ = THREE.MathUtils.clamp(desiredZ, 0, 23350);
    const trans = this.splineRoad ? this.splineRoad.getRoadTransformAtZ(safeZ, 0, 0) : null;
    const roadX = trans ? trans.pos.x : 0;
    const roadHeading = trans ? trans.heading : 0;
    const groundY = this.getGroundHeightAt(roadX, safeZ);

    this.position.set(roadX, groundY + 0.18, safeZ);
    this.speed = 0;
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.pitch = 0;
    this.roll = 0;
    this.tumblePitch = 0;
    this.tumbleRoll = 0;
    this.angularVelocity.set(0, 0, 0);
    this.isFlipped = false;
    this.rescueTimer = 0.0;
    this.heading = roadHeading;
    this.driftFactor = 0;
    this.smoothedSteer = 0;
    this.lateralVelocity = 0;
    this.slipAngle = 0;
    this.suspensionCompression = 0;
    this.stoppedBrakeHoldTime = 0.0;
    this._undergroundTimer = 0.0;

    gameState.speed = 0;
    gameState.speedMph = 0;
    gameState.isDrifting = false;
    gameState.isFlipped = false;
    gameState.isStuck = false;
    gameState.isOutOfBounds = false;
    this._stuckTimer = 0.0;
    this._stuckIdleTimer = 0.0;
    this._outOfBoundsTimer = 0.0;
    gameState.currentDriftChain = 0;
    gameState.driftMultiplier = 1.0;
    gameState.lateralSlipVelocity = 0;
    gameState.suspensionCompression = 0;

    // Reset off-road tracking state
    this._offRoadDamageTimer = 0;
    this._shownOffRoadWarning = false;

    // Damage & Integrity remain intact (must be repaired at an auto shop)

    if (this.vehicle && this.vehicle.group) {
      this.vehicle.group.position.copy(this.position);
      this.vehicle.group.rotation.order = 'YXZ';
      this.vehicle.group.rotation.set(0, this.heading, 0);
    }

    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.resetTracking();
    }

    if (showToast && window.game && window.game.hud && window.game.hud.showRescueToast) {
      window.game.hud.showRescueToast();
    }

    console.log(`⚠️ Vehicle placed cleanly on Highway 1 at Z=${safeZ.toFixed(0)}m (Integrity: ${Math.round(this.carIntegrity)}%)`);
  }

  /**
   * Restore vehicle to an exact spot if valid ground exists, or fallback cleanly to nearby road center.
   * @param {number|null} targetX - Exact lateral position
   * @param {number} targetZ - Longitudinal highway position
   * @param {number} [targetHeading] - Heading in radians
   * @returns {boolean} True if restored to exact spot, false if fell back to road
   */
  restorePosition(targetX, targetZ, targetHeading = 0) {
    const hasExact = typeof targetX === 'number' && !Number.isNaN(targetX);
    const safeZ = THREE.MathUtils.clamp(typeof targetZ === 'number' ? targetZ : 0, 0, 23350);

    if (hasExact) {
      const groundY = this.getGroundHeightAt(targetX, safeZ);
      const isGroundValid = typeof groundY === 'number' && !Number.isNaN(groundY) && Number.isFinite(groundY) && groundY > -150;
      const isBoundsValid = Math.abs(targetX) < 450;

      if (isGroundValid && isBoundsValid) {
        this.position.set(targetX, groundY + 0.18, safeZ);
        this.heading = (typeof targetHeading === 'number' && !Number.isNaN(targetHeading)) ? targetHeading : 0;
        this.speed = 0;
        this.velocity.set(0, 0, 0);
        this.verticalVelocity = 0;
        this.angularVelocity.set(0, 0, 0);
        this.isGrounded = true;
        // Calculate ground pitch at target location
        const halfBase = 1.35;
        const yFront = this.getGroundHeightAt(targetX + Math.sin(this.heading) * halfBase, safeZ + Math.cos(this.heading) * halfBase);
        const yRear = this.getGroundHeightAt(targetX - Math.sin(this.heading) * halfBase, safeZ - Math.cos(this.heading) * halfBase);
        const initialPitch = THREE.MathUtils.clamp(Math.atan2(yFront - yRear, halfBase * 2), -0.75, 0.75);
        this.pitch = initialPitch;
        this._smoothedPitch = initialPitch;
        this.roll = 0;
        this.tumblePitch = 0;
        this.tumbleRoll = 0;
        this.driftFactor = 0;
        this.smoothedSteer = 0;
        this.lateralVelocity = 0;
        this.slipAngle = 0;
        this.suspensionCompression = 0;
        this.isFlipped = false;
        this.rescueTimer = 0.0;
        this._stuckTimer = 0.0;
        this._stuckIdleTimer = 0.0;
        this._outOfBoundsTimer = 0.0;
        this.is2WDStruggling = false;
        gameState.is2WDStruggling = false;
        this._trailStruggleTimer = 0.0;
        this._wrongGearPhase = null;
        this.stoppedBrakeHoldTime = 0.0;

        gameState.speed = 0;
        gameState.speedMph = 0;
        gameState.isDrifting = false;
        gameState.isFlipped = false;
        gameState.isStuck = false;
        gameState.isOutOfBounds = false;
        gameState.playerX = this.position.x;
        gameState.playerY = this.position.y;
        gameState.playerZ = this.position.z;
        gameState.playerHeading = this.heading;

        if (this.vehicle && this.vehicle.group) {
          this.vehicle.group.position.copy(this.position);
          this.vehicle.group.rotation.order = 'YXZ';
          this.vehicle.group.rotation.set(0, this.heading, 0);
        }

        if (window.game && window.game.cameraManager) {
          window.game.cameraManager.resetTracking();
        }

        console.log(`📍 Exact Position Restored: X=${targetX.toFixed(1)}m, Y=${this.position.y.toFixed(1)}m, Z=${safeZ.toFixed(1)}m, Heading=${(this.heading * 180 / Math.PI).toFixed(0)}°`);
        return true;
      } else {
        console.warn(`⚠️ Exact position (X=${targetX.toFixed(1)}m, Z=${safeZ.toFixed(1)}m) no longer valid on terrain. Spawning nearby on Highway 1.`);
      }
    }

    // Fallback: spawn nearby on Highway 1 road center
    this.respawnOnRoad(false, safeZ);
    return false;
  }

  /**
   * Instantly relocate vehicle to target Z along the spline highway
   */
  teleportToZ(targetZ) {
    this.respawnOnRoad(false, targetZ);
  }

  /**
   * Instantly relocate vehicle to exact world coordinates and heading
   */
  teleportToCoords(x, y, z, heading = 0) {
    const groundY = (y !== undefined && y !== null) ? y : (this.getGroundHeightAt(x, z) + 0.18);
    this.position.set(x, groundY, z);
    this.speed = 0;
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.pitch = 0;
    this._smoothedPitch = 0;
    this.roll = 0;
    this.tumblePitch = 0;
    this.tumbleRoll = 0;
    this.angularVelocity.set(0, 0, 0);
    this.isFlipped = false;
    this.rescueTimer = 0.0;
    this.heading = heading;
    this.driftFactor = 0;
    this.smoothedSteer = 0;
    this.lateralVelocity = 0;
    this.slipAngle = 0;
    this.suspensionCompression = 0;
    this.stoppedBrakeHoldTime = 0.0;
    this._undergroundTimer = 0.0;

    gameState.speed = 0;
    gameState.speedMph = 0;
    gameState.isDrifting = false;
    gameState.isFlipped = false;
    gameState.isStuck = false;
    gameState.isOutOfBounds = false;
    this._stuckTimer = 0.0;
    this._stuckIdleTimer = 0.0;
    this._outOfBoundsTimer = 0.0;
    this.is2WDStruggling = false;
    gameState.is2WDStruggling = false;
    this._trailStruggleTimer = 0.0;
    this._wrongGearPhase = null;
    gameState.currentDriftChain = 0;
    gameState.driftMultiplier = 1.0;
    gameState.lateralSlipVelocity = 0;
    gameState.suspensionCompression = 0;

    this._offRoadDamageTimer = 0;
    this._shownOffRoadWarning = false;

    // When teleporting onto off-road terrain or mountain trails, engage LOW crawler gear
    if (this.splineRoad && this.splineRoad.getRoadInfo) {
      const rInfo = this.splineRoad.getRoadInfo(x, z);
      if (rInfo && (rInfo.isOnTrail || !rInfo.isOnRoad)) {
        if (this.setDriveMode) {
          this.setDriveMode('LOW');
        } else {
          this.driveMode = 'LOW';
          gameState.driveMode = 'LOW';
        }
      }
    }

    if (this.vehicle && this.vehicle.group) {
      this.vehicle.group.position.copy(this.position);
      this.vehicle.group.rotation.order = 'YXZ';
      this.vehicle.group.rotation.set(0, this.heading, 0);
    }

    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.resetTracking();
    }

    if (window.game && window.game.zoneManager) {
      window.game.zoneManager.update(this.position);
    }
    if (window.game && window.game.environment) {
      window.game.environment.update(0.05, this.position);
    }
    if (this.splineRoad) {
      this.splineRoad.update(1 / 60, this.position);
    }
  }

  /**
   * Trigger Tire Blowout & Rim Grinding Mode
   */
  triggerTireBlowout() {
    if (this.isTireBlown) return;
    this.isTireBlown = true;
    const dp = gameState.damagePoints || (this.vehicle && this.vehicle.damagePoints) || {};
    // Pick the most damaged side for blowout (0 = front-left, 1 = front-right)
    this.blownWheelIndex = ((dp.wheelAlignmentFL || 0) + (dp.fenderL || 0)) >= ((dp.wheelAlignmentFR || 0) + (dp.fenderR || 0)) ? 0 : 1;
    gameState.isTireBlown = true;
    gameState.blownWheelIndex = this.blownWheelIndex;

    if (window.game && window.game.sound && window.game.sound.triggerTireBlowout) {
      window.game.sound.triggerTireBlowout();
    }

    if (window.game && window.game.hud && window.game.hud.showTireBlowoutToast) {
      window.game.hud.showTireBlowoutToast();
    }

    // Spawn 3D tumbling 35" mud-terrain tire shred debris
    if (typeof window !== 'undefined' && window.game && window.game.debrisManager) {
      const isLeft = (this.blownWheelIndex === 0);
      const spawnPos = this.position.clone();
      const heading = this.heading || 0;
      const fwdX = Math.sin(heading);
      const fwdZ = Math.cos(heading);
      const normX = -fwdZ;
      const normZ = fwdX;
      spawnPos.x += (isLeft ? -0.8 : 0.8) * normX + 1.2 * fwdX;
      spawnPos.y += 0.35;
      spawnPos.z += (isLeft ? -0.8 : 0.8) * normZ + 1.2 * fwdZ;
      window.game.debrisManager.spawnDebris('tireShred', spawnPos, this.velocity, heading);
    }

    console.log(`💥 CRITICAL TIRE BLOWOUT on wheel [${this.blownWheelIndex}]! Rim grinding on asphalt.`);
  }

  /**
   * Full Vehicle Service & Restoration
   * Called when pulling into roadside mechanic bays or service shops.
   */
  repairVehicle() {
    this.carIntegrity = 100.0;
    this.damageLevel = 0;
    this.isTireBlown = false;
    this.blownWheelIndex = -1;
    this.criticalFatigueTimer = 0.0;

    gameState.carIntegrity = 100.0;
    gameState.damageStage = 0;
    gameState.isDamageCritical = false;
    gameState.isTireBlown = false;
    gameState.blownWheelIndex = -1;

    this.tumblePitch = 0;
    this.tumbleRoll = 0;
    this.angularVelocity.set(0, 0, 0);
    this.isFlipped = false;
    this.rescueTimer = 0.0;
    gameState.isFlipped = false;
    gameState.nitro = PHYSICS.NITRO_CAPACITY;
    gameState.engineHeat = 0.0;
    gameState.isOverheated = false;

    if (this.vehicle && this.vehicle.repairVehicle) {
      this.vehicle.repairVehicle();
    }

    if (typeof window !== 'undefined' && window.game && window.game.saveManager) {
      window.game.saveManager.save(true);
    }
  }

  /**
   * External Kinetic Impact (Traffic Collision, Barrier Slam)
   */
  applyImpact(impulseX, impulseZ, relativeSpeedMph = 50) {
    this.speed *= 0.65;
    this.heading += impulseX * 0.06;

    const locX = Math.sign(impulseX) * 0.75;
    const locZ = impulseZ > 0 ? 0.85 : -0.85;

    // Kinetic damage calculation scaled with collision energy (buffered so multiple crashes are required to build damage)
    if (relativeSpeedMph > 25) {
      const vNorm = THREE.MathUtils.clamp((relativeSpeedMph - 25) / 100, 0, 1.5);
      const impactDamage = DAMAGE.IMPACT_DAMAGE_BASE + Math.pow(vNorm, 1.5) * DAMAGE.IMPACT_DAMAGE_SCALE;
      this.applyDamage(impactDamage, relativeSpeedMph, locX, locZ, 0);
    }

    if (relativeSpeedMph > 40) {
      const severity = Math.min(1.0, (relativeSpeedMph - 40) / 60);
      this.angularVelocity.z += (Math.random() > 0.5 ? 1 : -1) * (3.0 + severity * 5.0);
      this.angularVelocity.x += (Math.random() - 0.5) * 4.0;
      // Controlled, weighted hop capped strictly so car never floats into the sky
      this.verticalVelocity = Math.min(4.2, Math.max(0, this.verticalVelocity) + 1.4 + severity * 1.8);
      this.isGrounded = false;
    }
  }

  update(dt, input) {
    if (dt > 0.08) dt = 0.08; // Prevent large delta spikes

    if (gameState.isTowing) {
      const isCruising = window.game && window.game.towTruckManager && window.game.towTruckManager.phase === 'TOW_CRUISE';
      gameState.speedMph = isCruising ? 45 : 0;
      gameState.speed = gameState.speedMph * 0.44704;
      gameState.engineRpm = 1000;
      gameState.isBoosting = false;
      this.speed = gameState.speed;
      this.velocity.set(0, 0, 0);
      return;
    }

    // 0. Auto Shop Servicing & Mechanic Cinematic Immobilizer
    // Locks the vehicle completely on the lift/bay, preventing any driving out while being worked on
    if (gameState.isServicing || gameState.isMechanicCinematic || gameState.isTowing) {
      this.speed = 0;
      this.velocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);
      this.driftFactor = 0;
      this.smoothedSteer = 0;
      gameState.speed = 0;
      gameState.speedMph = 0;
      gameState.engineRpm = 900;
      gameState.gear = 'P';
      gameState.isBoosting = false;
      gameState.isDrifting = false;

      // Pin car strictly to hydraulic lift pad if mechanic cinematic is active
      if (window.game && window.game.mechanicScene && window.game.mechanicScene.isActive) {
        const ms = window.game.mechanicScene;
        if (ms.bayPadX !== undefined) {
          this.position.x = ms.bayPadX;
          this.position.z = ms.bayPadZ;
          this.position.y = ms.bayPadY + (ms.liftHeight || 0);
          this.heading = ms.bayHeading;
        }
      }

      if (this.vehicle && this.vehicle.group) {
        this.vehicle.group.position.copy(this.position);
        this.vehicle.group.rotation.order = 'YXZ';
        this.vehicle.group.rotation.y = this.heading;
        this.vehicle.group.rotation.x = 0;
        this.vehicle.group.rotation.z = 0;
      }
      return;
    }

    if (gameState.isReadingHistory || gameState.isZoneMenuOpen || gameState.isBinocularView) {
      this.speed = 0;
      this.velocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);
      gameState.speed = 0;
      gameState.speedMph = 0;
      gameState.engineRpm = 950;
      gameState.isBoosting = false;
      return;
    }

    // 0. Cinematic Intro Vehicle Motion (Emerging smoothly from dream clouds into picture)
    if (gameState.isIntroActive) {
      const hasDriveInput = input && (
        input.throttle > 0.05 ||
        input.nitro ||
        Math.abs(input.steer || 0) > 0.1 ||
        (input.keys && (input.keys['KeyW'] || input.keys['ArrowUp'] || input.keys['KeyS'] || input.keys['ArrowDown'] || input.keys['Space']))
      );
      if (hasDriveInput) {
        gameState.isIntroActive = false;
        gameState.introState = 'playing';
        if (window.game && window.game.cameraManager) {
          window.game.cameraManager.skipIntro();
        }
      } else if (gameState.introState === 'orbit' || gameState.introState === 'transition') {
        // Vehicle smoothly glides forward emerging through the dream smoke and morning clouds
        const u = Math.min(1.0, Math.max(0.0, gameState.introProgress || 0));
        // S-curve acceleration from dream glide (~3.2 m/s, ~7 mph) into smooth highway cruise (~8.5 m/s, ~19 mph)
        const glideSpeed = THREE.MathUtils.lerp(3.2, 8.5, u * u);
        this.speed = glideSpeed;
        this.position.z += this.speed * dt;
        this.position.x = 0;
        this.heading = 0;
        this.position.y = this.getGroundHeightAt(this.position.x, this.position.z) + 0.18;

        gameState.speed = this.speed;
        gameState.speedMph = Math.round(this.speed * 2.23694);
        gameState.engineRpm = THREE.MathUtils.lerp(1200, 2400, u);
        gameState.gear = 'D';

        if (this.vehicle && this.vehicle.setSteeringAngle) {
          this.vehicle.setSteeringAngle(0);
        }
        if (this.vehicle && this.vehicle.updateWheels) {
          this.vehicle.updateWheels(this.speed, dt);
        }
      }

      if (this.vehicle && this.vehicle.group) {
        this.vehicle.group.position.copy(this.position);
        this.vehicle.group.rotation.order = 'YXZ';
        this.vehicle.group.rotation.y = this.heading;
        this.vehicle.group.rotation.x = 0;
        this.vehicle.group.rotation.z = 0;
      }
      return;
    }

    // Determine current zone for weather physics (2,600m per zone across 23.4km)
    const z = Math.max(0, this.position.z);
    let zoneIdx = 0;
    if (z < 2600) zoneIdx = 0;
    else if (z < 5200) zoneIdx = 1;
    else if (z < 7800) zoneIdx = 2;
    else if (z < 10400) zoneIdx = 3;
    else if (z < 13000) zoneIdx = 4;
    else if (z < 15600) zoneIdx = 5;
    else if (z < 18200) zoneIdx = 6;
    else if (z < 20800) zoneIdx = 7;
    else zoneIdx = 8;
    const currentZone = ZONES[zoneIdx] || ZONES[0];

    // 1. Nitro & Turbo Boost Logic with Climate Thermodynamics
    let currentMaxSpeedMph = PHYSICS.MAX_SPEED_MPH;
    let accelMultiplier = 1.0;

    const isRequestingBoost = input.nitro || gameState.isBoosting;
    const canBoost = isRequestingBoost && gameState.nitro > 0.5 && !gameState.isOverheated;

    const heatRateMultiplier = currentZone.heatRateMult !== undefined ? currentZone.heatRateMult : 1.0;
    const coolRateMultiplier = currentZone.coolRateMult !== undefined ? currentZone.coolRateMult : 1.0;

    if (canBoost) {
      gameState.isBoosting = true;
      gameState.nitro = Math.max(0, gameState.nitro - PHYSICS.NITRO_DRAIN_RATE * dt);
      gameState.engineHeat = Math.min(1.0, gameState.engineHeat + (PHYSICS.HEAT_GAIN_NITRO * heatRateMultiplier) * dt);
      currentMaxSpeedMph = PHYSICS.NITRO_MAX_SPEED_MPH;
      accelMultiplier = 1.8;

      if (gameState.engineHeat >= PHYSICS.HEAT_OVERHEAT_LIMIT || gameState.nitro <= 0) {
        gameState.isOverheated = (gameState.engineHeat >= PHYSICS.HEAT_OVERHEAT_LIMIT);
        gameState.isBoosting = false;
      }
    } else {
      gameState.isBoosting = false;
      accelMultiplier = 1.0;
      currentMaxSpeedMph = PHYSICS.MAX_SPEED_MPH;

      const nitroDepleted = gameState.nitro <= 0 || gameState.isOverheated;
      if (!input.nitro || nitroDepleted) {
        gameState.nitro = Math.min(PHYSICS.NITRO_CAPACITY, gameState.nitro + PHYSICS.NITRO_RECHARGE_RATE * dt);
      }
      
      const baseCoolRate = input.throttle > 0 ? PHYSICS.HEAT_LOSS_CRUISE : PHYSICS.HEAT_LOSS_IDLE;
      const coolRate = baseCoolRate * coolRateMultiplier;
      gameState.engineHeat = Math.max(0, gameState.engineHeat - coolRate * dt);
      if (gameState.isOverheated && gameState.engineHeat < 0.4) {
        gameState.isOverheated = false;
      }
    }

    // Progressive Mechanical Handling Degradation based on Cumulative Structural Integrity & Localized Damage
    // Generous Damage Tolerance Buffer:
    // Vehicle remains 100% pristine (top speed, horsepower, zero pull, zero wobble) while integrity >= STAGE_1_INTEGRITY (50%)
    const effectiveDamage = Math.max(0, (DAMAGE.STAGE_1_INTEGRITY - this.carIntegrity) / DAMAGE.STAGE_1_INTEGRITY); // 0.0 at 50-100%, 1.0 at 0%
    const perfRatio = 1.0 - effectiveDamage; // 1.0 down to 0.0
    const dp = gameState.damagePoints || (this.vehicle && this.vehicle.damagePoints) || {};

    // Top Speed Degradation: Stays 100% full top speed until crossing below 50% integrity
    const damageSpeedCapMph = THREE.MathUtils.lerp(DAMAGE.MIN_SPEED_CAP_MPH, PHYSICS.MAX_SPEED_MPH, Math.pow(perfRatio, 0.45));
    if (gameState.isBoosting) {
      const nitroSpeedCapMph = THREE.MathUtils.lerp(DAMAGE.MIN_SPEED_CAP_MPH + 20.0, PHYSICS.NITRO_MAX_SPEED_MPH, Math.pow(perfRatio, 0.40));
      currentMaxSpeedMph = Math.min(currentMaxSpeedMph, nitroSpeedCapMph);
    } else {
      currentMaxSpeedMph = Math.min(currentMaxSpeedMph, damageSpeedCapMph);
    }

    // 4x4 Transfer Case Gearing & Crawl Ratio
    const driveModeSpec = (DRIVE_MODES.SPECS && DRIVE_MODES.SPECS[this.driveMode]) || DRIVE_MODES.SPECS['HIGH'];
    currentMaxSpeedMph = Math.min(currentMaxSpeedMph, driveModeSpec.maxSpeedMph);
    accelMultiplier *= driveModeSpec.torqueMult;

    // Engine Horsepower & Torque Degradation: 100% while >= 50%, gently reduces down to 75% at 0%
    const damagePowerFactor = THREE.MathUtils.lerp(DAMAGE.MIN_POWER_FACTOR, 1.0, Math.pow(perfRatio, 0.50));
    accelMultiplier *= damagePowerFactor;

    // Progressive Structural Fatigue & Wear only if driving a heavily damaged car (< 30%) at high speed without repair
    if (this.carIntegrity < DAMAGE.FATIGUE_INTEGRITY_THRESHOLD && Math.abs(this.speed) > 16.0) {
      const fatigueWear = effectiveDamage * (Math.abs(this.speed) / 50.0) * DAMAGE.FATIGUE_WEAR_RATE * dt;
      this.carIntegrity = Math.max(3.0, this.carIntegrity - fatigueWear);
      gameState.carIntegrity = Math.round(this.carIntegrity);
    }

    // Critical Tire Blowout Check (Integrity < 4% or prolonged driving at < 8% without mechanic visit)
    if (!this.isTireBlown) {
      if (this.carIntegrity < DAMAGE.TIRE_BLOWOUT_INTEGRITY) {
        this.triggerTireBlowout();
      } else if (this.carIntegrity < 8.0 && Math.abs(this.speed) > 10.0) {
        this.criticalFatigueTimer += dt;
        if (this.criticalFatigueTimer > DAMAGE.TIRE_FATIGUE_TIME) {
          this.triggerTireBlowout();
        }
      }
    }

    // Bare Alloy Rim Grinding Drag & Asymmetric Pull (Limp mode speed)
    if (this.isTireBlown) {
      const blownSign = (this.blownWheelIndex === 0 || this.blownWheelIndex === 2) ? -1 : 1;
      // Cap maximum speed to emergency limp mode (45 MPH)
      currentMaxSpeedMph = Math.min(currentMaxSpeedMph, 45.0);
      accelMultiplier *= 0.72;
      
      // Heavy steering pull towards the blown tire side
      if (Math.abs(this.speed) > 1.0) {
        this.heading += blownSign * 0.18 * dt * (Math.abs(this.speed) / 16.0);
      }
      // Tilts body roll towards the deflated tire corner
      this.roll += blownSign * 0.035 * dt * 4.0;

      // Continuous shower of bright rim grinding sparks onto the pavement
      if (this.gpuVFX && this.gpuVFX.emitSparks && Math.abs(this.speed) > 3.0) {
        if (!this._rimSparkTimer) this._rimSparkTimer = 0;
        this._rimSparkTimer += dt;
        if (this._rimSparkTimer > 0.05) {
          this._rimSparkTimer = 0;
          if (!this._rimSparkPos) {
            this._rimSparkPos = new THREE.Vector3();
            this._rimSparkNorm = new THREE.Vector3();
          }
          const cosH = Math.cos(this.heading);
          const sinH = Math.sin(this.heading);
          this._rimSparkPos.set(
            this.position.x + cosH * blownSign * 0.9,
            this.position.y + 0.05,
            this.position.z - sinH * blownSign * 0.9
          );
          this._rimSparkNorm.set(-blownSign * 0.3, 0.7, -Math.sign(this.speed) * 0.6).normalize();
          this.gpuVFX.emitSparks(this._rimSparkPos, this._rimSparkNorm, 4, 0.9);
        }
      }
    }

    // Engine Sputter / Cylinder Misfire only at extreme critical integrity (< 8%)
    let throttleEffect = input.throttle;
    if (this.carIntegrity < DAMAGE.MISFIRE_INTEGRITY && input.throttle > 0) {
      const misfireNoise = Math.sin(gameState.gameTime * 35.0) * Math.cos(gameState.gameTime * 17.0);
      if (misfireNoise > 0.75) {
        throttleEffect *= 0.35; // Engine hesitates / sputters
        gameState.engineMisfireActive = true;
      } else {
        gameState.engineMisfireActive = false;
      }
    } else {
      gameState.engineMisfireActive = false;
    }

    // Steering Alignment Drift (only active when effectiveDamage > 0)
    const flDmg = dp.wheelAlignmentFL || (dp.fenderL ? dp.fenderL * 0.7 : 0);
    const frDmg = dp.wheelAlignmentFR || (dp.fenderR ? dp.fenderR * 0.7 : 0);
    const netWheelPull = ((flDmg - frDmg) * DAMAGE.WHEEL_PULL_MULT + effectiveDamage * Math.sin(gameState.gameTime * 1.2) * 0.02) * effectiveDamage;
    if (Math.abs(netWheelPull) > 0.02 && Math.abs(this.speed) > 1.0) {
      this.heading += netWheelPull * (Math.abs(this.speed) / 22.0) * dt;
      gameState.steeringPullDirection = THREE.MathUtils.clamp(netWheelPull * 4.0, -1.0, 1.0);
    } else {
      gameState.steeringPullDirection = 0;
    }

    // High-Speed Chassis Wheel Wobble & Vibration (only active when effectiveDamage > 0)
    const totalWobble = ((flDmg + frDmg + (dp.wheelAlignmentRL || 0) + (dp.wheelAlignmentRR || 0)) * DAMAGE.CHASSIS_WOBBLE_MULT + effectiveDamage * 0.10) * effectiveDamage;
    if (totalWobble > 0.05 && Math.abs(this.speed) > 4.0) {
      const wobbleFreq = 38.0;
      const speedWobbleFactor = Math.min(1.2, Math.abs(this.speed) / 20.0);
      this.roll += Math.sin(gameState.gameTime * wobbleFreq) * totalWobble * speedWobbleFactor * dt * 0.35;
      this.pitch += Math.cos(gameState.gameTime * (wobbleFreq * 0.8)) * totalWobble * speedWobbleFactor * dt * 0.20;
      gameState.chassisVibration = Math.min(1.0, totalWobble * speedWobbleFactor);
    } else {
      gameState.chassisVibration = 0;
    }

    // Tire Rubbing & Friction Drag from Crushed Fenders (only active when effectiveDamage > 0)
    const tireRub = ((dp.fenderL || 0) + (dp.fenderR || 0) + (dp.rearHaunchL || 0) + (dp.rearHaunchR || 0)) * DAMAGE.TIRE_RUB_MULT * effectiveDamage;
    if (tireRub > 0.08) {
      this.speed *= (1.0 - tireRub * 0.20 * dt);
      gameState.tireRubFriction = tireRub;
    } else {
      gameState.tireRubFriction = 0;
    }

    // Asymmetrical Braking Swerve
    if (input.brake > 0.1 && (flDmg > 0.1 || frDmg > 0.1) && Math.abs(this.speed) > 2.0 && effectiveDamage > 0) {
      this.heading += (flDmg - frDmg) * input.brake * DAMAGE.BRAKE_SWERVE_MULT * dt * (Math.abs(this.speed) / 20.0) * effectiveDamage;
    }

    // Speed Feel Multiplier: calibrated world translation velocity scaling
    const SPEED_SCALE = PHYSICS.SPEED_SCALE || 0.60;
    let currentMaxSpeed = currentMaxSpeedMph * 0.44704 * SPEED_SCALE; // Scaled physical m/s

    // 2. Drive & Brake Acceleration
    // Brake Override System: pressing the brake actively cuts throttle and engages stopping power
    if (input.brake > 0) {
      throttleEffect = Math.max(0, throttleEffect - input.brake * 1.5);
    }

    const reverseDelay = PHYSICS.REVERSE_ENGAGE_DELAY || 1.0;

    if (input.brake > 0.05) {
      const brakeDecel = (PHYSICS.BRAKE_FORCE / PHYSICS.MASS) * input.brake * dt;
      if (this.speed > 0.1) {
        // High-performance forward braking clamped cleanly to stop (preventing reverse-overshoot)
        this.speed = Math.max(0, this.speed - brakeDecel);
        this.stoppedBrakeHoldTime = 0.0;
      } else if (this.speed < -0.1) {
        if (this.stoppedBrakeHoldTime >= reverseDelay) {
          // Actively driving in reverse: continue accelerating backward with full torque support
          const revAccel = (PHYSICS.ENGINE_FORCE / PHYSICS.MASS) * 0.72 * accelMultiplier * input.brake * dt * SPEED_SCALE;
          this.speed = Math.max(-16 * SPEED_SCALE, this.speed - revAccel);
        } else {
          // Rolling backward prior to reverse gear: braking decelerates vehicle smoothly back to 0
          this.speed = Math.min(0, this.speed + brakeDecel);
          if (this.speed === 0) {
            this.stoppedBrakeHoldTime = (this.stoppedBrakeHoldTime || 0) + dt;
          }
        }
      } else {
        // Vehicle is at a complete stop: holding brake for > reverseDelay seconds engages reverse gear
        this.speed = 0;
        if (throttleEffect <= 0) {
          this.stoppedBrakeHoldTime = (this.stoppedBrakeHoldTime || 0) + dt;
          if (this.stoppedBrakeHoldTime >= reverseDelay) {
            const revAccel = (PHYSICS.ENGINE_FORCE / PHYSICS.MASS) * 0.72 * accelMultiplier * input.brake * dt * SPEED_SCALE;
            this.speed = Math.max(-16 * SPEED_SCALE, this.speed - revAccel);
          }
        } else {
          this.stoppedBrakeHoldTime = 0.0;
        }
      }
    } else {
      // Brake is not pressed: reset stopped hold timer
      this.stoppedBrakeHoldTime = 0.0;

      if (throttleEffect > 0) {
        if (this.speed < -0.1) {
          // Reverse braking: applying throttle while rolling backward decelerates vehicle to 0
          const revBrakeDecel = (PHYSICS.BRAKE_FORCE / PHYSICS.MASS) * throttleEffect * dt;
          this.speed = Math.min(0, this.speed + revBrakeDecel);
        } else if (this.speed < currentMaxSpeed) {
          const rInfoCheck = this.splineRoad ? this.splineRoad.getRoadInfo(this.position.x, this.position.z) : null;
          const isOnDownhill = Boolean(rInfoCheck && rInfoCheck.isOnDownhillRoute) || DownhillSpline.isDownhillRoute(this.position.x, this.position.z);
          const isOnTrail = rInfoCheck ? (Boolean(rInfoCheck.isOnTrail) && !isOnDownhill) : false;
          const isOffRoad = rInfoCheck ? (!rInfoCheck.isOnRoad && !isOnTrail && !isOnDownhill) : false;

          let crawlAssist = 1.0;
          const isLowGear = (this.driveMode === 'LOW' || this.driveMode === '4L');
          const isMidGear = (this.driveMode === 'MID');
          const isHighGear = (this.driveMode === 'HIGH');
          const climb = this.getGearClimbInfo(rInfoCheck);
          const gearRequired = climb.phaseGear;
          this._trailPhaseGear = gearRequired;
          this._trailCurrentGrade = Math.round(climb.gradePct);

          const isTechnicalClimb = Boolean(climb && climb.isTechnical);

          if (isOnDownhill) {
            // ── ⚡ DOWNHILL EXPRESS SPRINT: HIGH GEAR FULL POWER ───────────────
            // Downhill gravity sprint: High gear is cleared and optimal!
            crawlAssist = isHighGear ? 1.40 : (isMidGear ? 1.20 : 1.0);
            this.is2WDStruggling = false;
            this._wrongGearPhase = null;
          } else if (isOnTrail) {
            // ── 3-Speed off-road trail climbing requirements ─────────────────
            if (isLowGear) {
              crawlAssist = 1.80; // Massive rock crawl torque transfer with dual locked diffs
              this.is2WDStruggling = false;
              this._wrongGearPhase = null;
            } else if (isMidGear) {
              if (isTechnicalClimb) {
                // In technical sections (rock crawl arena, boulder steps, mud bog, waterfall ford, stepped ledges),
                // 2nd gear lacks the 4:1 crawl ratio & locked diffs: severe transmission stall & wheel slip!
                crawlAssist = 0.08; // Insufficient drive torque to push heavy jeep over technical obstacles
                currentMaxSpeed = Math.min(currentMaxSpeed, 2.0 * SPEED_SCALE);
                this.is2WDStruggling = true;
                this._wrongGearPhase = 'LOW';
              } else {
                // Moderate flowing trail sections: 2nd gear provides locked 4WD momentum & climb power
                crawlAssist = 1.35;
                this.is2WDStruggling = false;
                this._wrongGearPhase = null;
              }
            } else {
              // HIGH gear cannot climb off-road trails:
              // Open differential and tall highway gearing loses drive torque to wheel slip & stall
              crawlAssist = 0.02; // Severe transmission stall: virtually zero forward drive torque
              currentMaxSpeed = Math.min(currentMaxSpeed, 1.4 * SPEED_SCALE);
              this.is2WDStruggling = true;
              this._wrongGearPhase = isTechnicalClimb ? 'LOW' : 'MID';
            }
          } else if (isOffRoad) {
            if (isLowGear) {
              crawlAssist = 1.35;
              this.is2WDStruggling = false;
              this._wrongGearPhase = null;
            } else if (isMidGear) {
              if (isTechnicalClimb || this.pitch < -0.16 || climb.gradePct > 16.0) {
                // Steep off-road hill climb > 16% grade: 2nd gear cannot make it up
                crawlAssist = 0.12;
                currentMaxSpeed = Math.min(currentMaxSpeed, 2.2 * SPEED_SCALE);
                this.is2WDStruggling = true;
                this._wrongGearPhase = 'LOW';
              } else {
                crawlAssist = 1.15;
                this.is2WDStruggling = false;
                this._wrongGearPhase = null;
              }
            } else {
              crawlAssist = 0.35; // HIGH gear struggles in loose off-road sand & dirt
              currentMaxSpeed = Math.min(currentMaxSpeed, 22.0 * 0.44704 * SPEED_SCALE);
              if (this.pitch < -0.04 || climb.gradePct > 4.0) {
                crawlAssist = 0.02;
                this.is2WDStruggling = true;
                this._wrongGearPhase = isTechnicalClimb ? 'LOW' : 'MID';
              }
            }
          }

          // Progressive torque curve: drops smoothly to 0 at max speed
          const powerCurve = Math.max(0, 1.0 - Math.pow(Math.abs(this.speed) / currentMaxSpeed, 2.0));
          this.speed += (PHYSICS.ENGINE_FORCE / PHYSICS.MASS) * throttleEffect * powerCurve * accelMultiplier * dt * SPEED_SCALE * crawlAssist;

          // Downhill Gravity Assist Acceleration:
          if (isOnDownhill || (this.pitch > 0.03 && this.speed > 0)) {
            const downGrade = Math.max(0.04, Math.sin(this.pitch));
            const gravityBoost = downGrade * 16.5 * dt * SPEED_SCALE;
            this.speed += gravityBoost;
          }

          // Trail & Hill Incline Gravity Drag & Gearing Stall (Bypassed entirely on Downhill Express):
          const isStrugglingAgainstHill = !isOnDownhill && (
            (isHighGear && (isOnTrail || isOffRoad || this.pitch < -0.04)) ||
            (isMidGear && isTechnicalClimb && (isOnTrail || isOffRoad || this.pitch < -0.06))
          );

          if (isStrugglingAgainstHill) {
            const slope = Math.max(0.08, Math.sin(-this.pitch));
            const baseDrag = isHighGear ? 10.0 : 6.5;
            const multDrag = isHighGear ? 42.0 : 28.0;
            const gradeDrag = Math.max(baseDrag, slope * multDrag) * dt * SPEED_SCALE;
            this.speed = Math.max(-5.0 * SPEED_SCALE, this.speed - gradeDrag);

            // Shudder chassis when attempting to throttle in inadequate gear against the hill
            if (throttleEffect > 0.05) {
              const shudderFreq = isHighGear ? 48.0 : 36.0;
              const pitchAmp = isHighGear ? 0.008 : 0.006;
              const rollAmp = isHighGear ? 0.006 : 0.004;
              this.pitch += Math.sin(gameState.gameTime * shudderFreq) * pitchAmp * throttleEffect;
              this.roll += Math.cos(gameState.gameTime * (shudderFreq * 0.75)) * rollAmp * throttleEffect;
              gameState.chassisVibration = Math.max(gameState.chassisVibration || 0, (isHighGear ? 0.90 : 0.75) * throttleEffect);
            }
          }
        } else {
          // In LOW / MID range, low-range gearing applies aggressive engine compression braking if exceeding max speed
          if (this.driveMode === 'LOW' || this.driveMode === '4L' || this.driveMode === 'MID') {
            const overspeedDecel = Math.max(22.0 * dt * SPEED_SCALE, (this.speed - currentMaxSpeed) * 16.0 * dt);
            this.speed = Math.max(currentMaxSpeed, this.speed - overspeedDecel);
          } else {
            // Natural aerodynamic coasting down to max speed if currently exceeding it
            const aeroDrag = PHYSICS.COAST_DRAG_ACCEL * (this.speed * this.speed) * dt;
            this.speed -= aeroDrag;
          }
        }
      } else {
        // LOW / MID Hill Descent & Crawl Hold: low-range gearing acts as heavy engine braking
        if (this.driveMode === 'LOW' || this.driveMode === '4L' || this.driveMode === 'MID') {
          const holdDecel = 6.5 * dt * SPEED_SCALE;
          if (Math.abs(this.speed) <= holdDecel) {
            this.speed = 0;
          } else {
            this.speed -= holdDecel * Math.sign(this.speed);
          }
        } else {
          // Smooth realistic coasting in neutral (mild aerodynamic drag + tire rolling resistance)
          const aeroDragAccel = PHYSICS.COAST_DRAG_ACCEL * (this.speed * this.speed) * Math.sign(this.speed);
          const rollResistanceAccel = PHYSICS.ROLLING_RESISTANCE_ACCEL * Math.sign(this.speed) * SPEED_SCALE;
          const totalDecel = (aeroDragAccel + rollResistanceAccel) * dt;

          if (Math.abs(this.speed) <= Math.abs(totalDecel)) {
            this.speed = 0;
          } else {
            this.speed -= totalDecel;
          }
        }
      }
    }

    // Handbrake drift & rear axle braking force
    if (input.handbrake) {
      const handbrakeDecel = (PHYSICS.HANDBRAKE_FORCE / PHYSICS.MASS) * 0.75 * dt;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - handbrakeDecel);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + handbrakeDecel);
      }
      this.driftFactor = THREE.MathUtils.damp(this.driftFactor, 1.0, 8.0, dt);
    } else {
      this.driftFactor = THREE.MathUtils.damp(this.driftFactor, 0.0, 5.0, dt);
    }

    this.speed = Math.max(-15 * SPEED_SCALE, Math.min(PHYSICS.NITRO_MAX_SPEED_MPH * 0.44704 * SPEED_SCALE, this.speed));

    // 3. Fluid, Progressive Steering Dynamics with Zone Weather & Off-Road Surface Grip
    let isOnRoad = true;
    let surfaceType = 'asphalt';
    let rInfo = null;
    let trailLat = this.position.x;
    let trailQ = null;
    let isDownhillActive = false;
    if (this.splineRoad) {
      rInfo = this.splineRoad.getRoadInfo(this.position.x, this.position.z);
      isOnRoad = rInfo.isOnRoad;
      trailLat = (rInfo && typeof rInfo.lateralDist === 'number') ? rInfo.lateralDist : this.position.x;
      trailQ = TrailSpline.queryTrail(trailLat, this.position.z);
      isDownhillActive = Boolean(rInfo && rInfo.isOnDownhillRoute) || DownhillSpline.isDownhillRoute(trailLat, this.position.z);
      gameState.isOnDownhillRoute = isDownhillActive;

      if (isDownhillActive) {
        const downhillQ = DownhillSpline.queryDownhill(trailLat, this.position.z);
        const stageInfo = downhillQ ? DownhillSpline.getStageInfo(downhillQ.t) : null;
        const isUnderCurtain = DownhillSpline.isUnderWaterfallCurtain ? DownhillSpline.isUnderWaterfallCurtain(trailLat, this.position.z) : false;
        const isWaterfallGrotto = DownhillSpline.isWaterfallGrotto ? DownhillSpline.isWaterfallGrotto(trailLat, this.position.z) : false;

        surfaceType = isUnderCurtain ? 'stream_water' : (isWaterfallGrotto ? 'wet_rock' : 'downhill_chute');
        isOnRoad = true;
        gameState.isOnTrail = false;
        gameState.is2WDStruggling = false;
        this.is2WDStruggling = false;
        this._trailStruggleTimer = 0;
        this._wrongGearPhase = null;
        this._currentTrailTechSection = null;
        this._currentTrailMudBog = null;
        gameState.isInWaterfall = isUnderCurtain || isWaterfallGrotto;

        const stage = stageInfo ? stageInfo.name : '⚡ DOWNHILL SPRINT';
        const spotterTip = stageInfo ? stageInfo.spotterTip : 'Downhill express sprint: carry high-gear momentum';
        gameState.currentTrailStage = stage;
        if (stage !== this.lastTrailStage) {
          this.lastTrailStage = stage;
          if (window.game && window.game.hud && window.game.hud.spotterRadioText) {
            window.game.hud.spotterRadioText.textContent = spotterTip;
          }
        }

        // Trigger waterfall splash sound when blasting through the waterfall curtain
        if (isUnderCurtain && window.game && window.game.sound && window.game.sound.playStreamSplash && Math.abs(this.speed) > 1.0 && !this._inWaterfallSplashPlaying) {
          this._inWaterfallSplashPlaying = true;
          window.game.sound.playStreamSplash();
          setTimeout(() => { this._inWaterfallSplashPlaying = false; }, 350);
        }
      } else if (rInfo.isOnTrail) {
        surfaceType = 'rock_trail';
        isOnRoad = true;
        gameState.isOnTrail = true;

        // Trail entrance
        if (!this._enteredCoyoteTrail) {
          this._enteredCoyoteTrail = true;
        }

        // Technical Trail Stage & Radio Spotter Guidance
        const techSection = TrailSpline.getTechnicalSectionInfo ? TrailSpline.getTechnicalSectionInfo(trailLat, this.position.z) : null;
        const mudBog = TrailSpline.isMudBog ? TrailSpline.isMudBog(trailLat, this.position.z) : null;
        this._currentTrailTechSection = techSection;
        this._currentTrailMudBog = mudBog;

        const isTechnicalClimbZone = Boolean(techSection || mudBog || (TrailSpline.isTechnicalClimb && TrailSpline.isTechnicalClimb(trailLat, this.position.z, this._smoothedPitch).isTechnical));
        const isStrugglingInGear = (this.driveMode === 'HIGH' || this.driveMode === '2H') ||
                                   (this.driveMode === 'MID' && isTechnicalClimbZone);

        if (isStrugglingInGear) {
          gameState.is2WDStruggling = true;
          this.is2WDStruggling = true;
        } else {
          gameState.is2WDStruggling = false;
          this.is2WDStruggling = false;
          this._trailStruggleTimer = 0;
          this._wrongGearPhase = null;
        }

        let stage = '';
        let spotterTip = '';
        if (trailQ) {
          const t = trailQ.t;
          const isStream = TrailSpline.isStreamCrossing(trailLat, this.position.z);
          const isWaterfallView = TrailSpline.isWaterfallViewArea(trailLat, this.position.z);

          if (mudBog) {
            surfaceType = 'mud';
            gameState.isInMud = true;
            gameState.isInStream = false;
            stage = mudBog.name.toUpperCase();
            spotterTip = 'Thick churning mud bog! Engage 1st Low [4L] to power through with lockers!';
            if (window.game && window.game.sound && window.game.sound.playMudSplash && Math.abs(this.speed) > 1.0 && !this._inMudSplashPlaying) {
              this._inMudSplashPlaying = true;
              window.game.sound.playMudSplash();
              setTimeout(() => { this._inMudSplashPlaying = false; }, 420);
            }
          } else if (isStream) {
            surfaceType = 'stream_water';
            gameState.isInStream = true;
            gameState.isInMud = false;
            if (isStream.id === 'thunder_creek') {
              stage = 'THUNDER CREEK WATERFALL FORD';
              spotterTip = 'Waterfall outflow rapids: maintain 1st Low momentum through rushing current';
            } else {
              stage = 'COUGAR CREEK EXTENDED RIVER CROSSING';
              spotterTip = 'Extended river ford & boulders: steady throttle in 1st Low, crawl through cobblestones';
            }
            if (window.game && window.game.sound && window.game.sound.playStreamSplash && Math.abs(this.speed) > 1.2 && !this._inStreamSplashPlaying) {
              this._inStreamSplashPlaying = true;
              window.game.sound.playStreamSplash();
              setTimeout(() => { this._inStreamSplashPlaying = false; }, 400);
            }
          } else {
            gameState.isInStream = false;
            gameState.isInMud = false;
            if (techSection) {
              stage = techSection.name.toUpperCase();
              spotterTip = techSection.spotterTip;
            } else if (t < 0.06) {
              stage = 'STAGING & AIR-DOWN BASIN';
              spotterTip = 'Air down tires & engage 4WD Low [4L]';
            } else if (t < 0.132) {
              stage = 'RED ROCK CANYON WASH';
              spotterTip = 'Carve winding canyon curves, keep in packed sand line';
            } else if (t < 0.265) {
              stage = 'COUGAR CREEK EXTENDED RIVER CROSSING';
              spotterTip = 'Extended riverbed ford: steady throttle through river boulders & rapids';
            } else if (t < 0.35) {
              stage = 'COUGAR CREEK CANYON RAPIDS';
              spotterTip = 'Drive alongside rushing mountain creek rapids';
            } else if (t < 0.40) {
              stage = 'COUGAR FALLS SCENIC OVERLOOK';
              spotterTip = 'Scenic turnout: 85-FT Cougar Falls cascade & plunge pool';
            } else if (t < 0.49) {
              stage = 'BOULDER CANYON ROCK CRAWL ARENA';
              spotterTip = 'Extreme rock crawl: ONLY 1ST LOW will clear these granite boulders — shift [SPACE]';
            } else if (t < 0.58) {
              stage = 'THUNDER CANYON & THUNDER FALLS';
              spotterTip = 'Roaring 125-FT Thunder Falls: dramatic 3-tier cascade and rising mist';
            } else if (t < 0.67) {
              stage = 'THUNDER CREEK WATERFALL CROSSING';
              spotterTip = 'Ford rushing waterfall outflow: watch stepped rock cascades';
            } else if (t < 0.77) {
              stage = "DEVIL'S BACKBONE RIDGE TRAVERSE";
              spotterTip = 'Knife-edge ridge: steady steering, mind both cliff drop-offs';
            } else if (t < 0.86) {
              stage = "DEVIL'S SHELF WATERFALL ROCK CASCADES";
              spotterTip = 'Stepped stone ledges: crawl over rock steps, let lockers bite';
            } else if (t < 0.95) {
              stage = 'HANGING VALLEY PONDEROSA GROVE';
              spotterTip = 'Alpine pine forest: Elev 3,400 FT • Follow timber fence line';
            } else {
              stage = 'GRAND SUMMIT VISTA OVERLOOK';
              spotterTip = 'Summit conquered! Elev 3,500 FT • Look through the panoramic binoculars';
            }
          }
        } else if (rInfo && rInfo.trailInfo && rInfo.trailInfo.isSummit) {
          stage = 'GRAND SUMMIT VISTA OVERLOOK';
          spotterTip = 'Summit conquered! Elev 3,500 FT • Look through the panoramic binoculars';
        } else {
          stage = 'COUGAR RIDGE 4x4 TRAIL';
          spotterTip = 'Technical 4x4 trail corridor: maintain slow crawl';
        }

        gameState.currentTrailStage = stage;
        if (stage !== this.lastTrailStage) {
          this.lastTrailStage = stage;
          if (window.game && window.game.hud && window.game.hud.spotterRadioText) {
            window.game.hud.spotterRadioText.textContent = spotterTip;
          }
        }

        // Summit overlook milestone toast & score bonus
        if (rInfo.trailInfo && rInfo.trailInfo.isSummit && !this._reachedCoyoteSummit) {
          this._reachedCoyoteSummit = true;
          gameState.score = (gameState.score || 0) + 1500;
          if (window.game && window.game.hud && window.game.hud.showActionToast) {
            window.game.hud.showActionToast('⭐ SUMMIT REACHED (+1,500 PTS)', 'COUGAR RIDGE • ELEV 3,500 FT • DESERT PANORAMA', 4500);
          }
          if (window.game && window.game.sound && window.game.sound.triggerNearMiss) {
            window.game.sound.triggerNearMiss();
          }
        }
      } else {
        gameState.isOnTrail = false;
        gameState.is2WDStruggling = false;
        gameState.isInStream = false;
        this.is2WDStruggling = false;
        this._currentTrailTechSection = null;
        this._currentTrailMudBog = null;
        gameState.currentTrailStage = '';
        if (rInfo.isTurnout) {
          surfaceType = 'asphalt'; // Smooth paved parking lot driving
          isOnRoad = true;

          // Check if player has parked inside a scenic turnout
          if (Math.abs(this.speed) < 1.8 && rInfo.turnoutData) {
            if (!this.discoveredTurnouts) this.discoveredTurnouts = new Set();
            if (!this.discoveredTurnouts.has(rInfo.turnoutData.id)) {
              this.discoveredTurnouts.add(rInfo.turnoutData.id);
              gameState.score = (gameState.score || 0) + 300;
              if (window.game && window.game.hud && window.game.hud.showScenicVistaToast) {
                window.game.hud.showScenicVistaToast(rInfo.turnoutData.name, rInfo.turnoutData.sub);
              }
              if (window.game && window.game.sound && window.game.sound.triggerNearMiss) {
                window.game.sound.triggerNearMiss();
              }
            }
          }
        } else if (!isOnRoad) {
          if (this.position.z < 2600 || (this.position.z >= 2600 && this.position.z < 5200 && this.position.x < -16)) {
            surfaceType = 'sand';
          } else {
            surfaceType = 'dirt';
          }
        }
      }
    }

    let surfaceGrip = surfaceType === 'sand' ? 0.82 : (surfaceType === 'rock_trail' ? 0.94 : (surfaceType === 'stream_water' ? 0.86 : (surfaceType === 'mud' ? 0.68 : (surfaceType === 'dirt' ? 0.90 : 1.0))));
    const isLowGearMode = (this.driveMode === 'LOW' || this.driveMode === '4L');
    if (isLowGearMode) {
      surfaceGrip *= (surfaceType === 'rock_trail' ? 1.32 : (surfaceType === 'stream_water' ? 1.28 : (surfaceType === 'mud' ? 1.26 : 1.22))); // Extreme rock crawl, mud & creek grip with lockers
    } else if (surfaceType === 'rock_trail' || surfaceType === 'stream_water' || surfaceType === 'mud') {
      surfaceGrip *= (surfaceType === 'mud' ? 0.28 : 0.40); // Severe tire slip on technical rocks, mud slurry & creek bed in HIGH/MID gear
    }

    // Mud Slurry Viscous Drag: Thick viscous mud bogs down 2nd/3rd gear, requiring 1st LOW crawl torque
    if (surfaceType === 'mud' && Math.abs(this.speed) > 0.4) {
      const mudBogFactor = (this._currentTrailMudBog && this._currentTrailMudBog.dragFactor) || 2.5;
      if (!isLowGearMode) {
        // High or Mid gear bogs down severely in mud, spinning tires without crawl ratio
        const mudDrag = 0.46 * mudBogFactor;
        this.speed *= Math.max(0.32, 1.0 - mudDrag * dt);
      } else {
        // Low gear crawl torque powers cleanly through mud
        const mudDrag = 0.09 * mudBogFactor;
        this.speed *= Math.max(0.85, 1.0 - mudDrag * dt);
      }
    }

    let isRaining = (currentZone.precipitation === 'rain');
    let isSnowing = (currentZone.precipitation === 'snow');
    if (gameState.debugRainMode === 'on') {
      isRaining = true;
      isSnowing = false;
    } else if (gameState.debugRainMode === 'snow') {
      isRaining = false;
      isSnowing = true;
    } else if (gameState.debugRainMode === 'off') {
      isRaining = false;
      isSnowing = false;
    }
    gameState.isSnowing = isSnowing;
    gameState.isRaining = isRaining;

    let weatherRoadGrip = 1.0;
    if (isSnowing) {
      weatherRoadGrip = 0.70;
      if (isLowGearMode) {
        weatherRoadGrip = 0.88; // Low gear locked 4WD recovers snow traction!
      }
    } else if (isRaining) {
      weatherRoadGrip = 0.84;
      if (isLowGearMode) {
        weatherRoadGrip = 0.94; // Low gear wet road stability
      }
    } else if (currentZone.roadGrip !== undefined) {
      weatherRoadGrip = currentZone.roadGrip;
    }
    surfaceGrip *= weatherRoadGrip; // Wet roads / snow decrease tire grip

    // ── Manual Gearbox (HIGH / MID / LOW) Terrain & Incline Advisor ──────────
    const isTrailActive = Boolean(rInfo && rInfo.isOnTrail);

    // Exponential moving average for pitch to filter out suspension bounce over rocks/bumps
    this._smoothedPitch = (this._smoothedPitch === undefined)
      ? this.pitch
      : THREE.MathUtils.damp(this._smoothedPitch, this.pitch, 3.0, dt);
    const currentGrade = Math.abs(Math.tan(-this._smoothedPitch) * 100);
    const isSteepIncline = this._smoothedPitch < -0.06 || currentGrade > 10;

    let recommendedMode = 'HIGH';
    let alertTitle = '';
    let alertMessage = '';
    let alertAction = '';
    let isWrong = false;

    if (isDownhillActive) {
      // ⚡ Downhill Express Chute: HIGH gear is optimal and fully cleared!
      isWrong = false;
      recommendedMode = 'HIGH';
      alertTitle = '⚡ DOWNHILL EXPRESS RUN';
      alertMessage = (this.driveMode === 'HIGH')
        ? 'GRAVITY DESCENT • HIGH GEAR ENGAGED • MAXIMUM HIGHWAY SPRINT'
        : 'GRAVITY DESCENT • SHIFT TO HIGH GEAR [3] TO UNLEASH SPEED';
      alertAction = (this.driveMode === 'HIGH') ? 'CRUISE DOWNHILL TO HIGHWAY 1' : 'PRESS [3] OR [SPACE] FOR HIGH';
    } else if (isTrailActive) {
      const isTechZone = Boolean(this._currentTrailTechSection || this._currentTrailMudBog ||
        (TrailSpline.isTechnicalClimb && TrailSpline.isTechnicalClimb(trailLat, this.position.z, this._smoothedPitch).isTechnical));

      if (isTechZone) {
        // Strict Technical Zone (Rock crawl, boulder steps, mud bog, waterfall ford, stepped cascades)
        // STRICTLY REQUIRES 1ST LOW GEAR! 2nd (MID) or 3rd (HIGH) will stall / lug / bottom out
        if (!isLowGearMode) {
          isWrong = true;
          recommendedMode = 'LOW';
          alertTitle = '⚠️ SHIFT TO 1ST LOW GEAR';
          const secName = this._currentTrailTechSection ? this._currentTrailTechSection.shortName : (this._currentTrailMudBog ? 'MUD BOG' : 'TECHNICAL ROCK CRAWL');
          alertMessage = (this.driveMode === 'MID')
            ? `${secName} • 2ND GEAR LACKS CRAWL TORQUE • SHIFT TO 1ST [SPACE]`
            : `${secName} • HIGH GEAR CANNOT CLIMB • SHIFT TO 1ST [SPACE]`;
          alertAction = 'PRESS [1] OR [SPACE] FOR 1ST LOW';
        } else {
          isWrong = false;
          recommendedMode = 'LOW';
        }
      } else {
        // Flowing trail section (wash, canyon run, pine forest): Gear 2 (MID) or Gear 1 (LOW) are valid
        const isLowOrMid = (this.driveMode === 'LOW' || this.driveMode === '4L' || this.driveMode === 'MID');
        if (!isLowOrMid) {
          // Player is in HIGH gear (highway overdrive)
          isWrong = true;
          recommendedMode = 'MID';
          alertTitle = '⚠️ SHIFT TO 2ND OR 1ST GEAR';
          alertMessage = 'OFF-ROAD TRAIL • HIGH GEAR CANNOT CLIMB • SHIFT TO 2ND [2]';
          alertAction = 'PRESS [2] OR [SPACE] FOR 4WD';
        } else {
          isWrong = false;
          recommendedMode = this.driveMode;
        }
      }
    } else if (!isOnRoad) {
      // Off-road terrain outside trail (sand dunes, desert dirt, mountain slopes)
      const isLowOrMid = (this.driveMode === 'LOW' || this.driveMode === '4L' || this.driveMode === 'MID');
      const isSteepClimb = currentGrade > 16.0 || this._smoothedPitch < -0.16;

      if (isSteepClimb) {
        // Steep hill climb >16% strictly requires Gear 1 (LOW)
        if (!isLowGearMode) {
          isWrong = true;
          recommendedMode = 'LOW';
          alertTitle = '⚠️ SHIFT TO 1ST LOW GEAR';
          alertMessage = (this.driveMode === 'MID')
            ? 'STEEP OFF-ROAD HILL • 2ND GEAR CANNOT CLIMB • SHIFT TO 1ST [1]'
            : 'STEEP OFF-ROAD HILL • HIGH GEAR CANNOT CLIMB • SHIFT TO 1ST [SPACE]';
          alertAction = 'PRESS [1] OR [SPACE] FOR 1ST LOW';
        } else {
          isWrong = false;
          recommendedMode = 'LOW';
        }
      } else if (!isLowOrMid && (isSteepIncline || isSnowing || surfaceType === 'sand')) {
        isWrong = true;
        recommendedMode = 'MID';
        alertTitle = '⚠️ SHIFT TO 2ND OR 1ST GEAR';
        alertMessage = isSteepIncline
          ? 'OFF-ROAD INCLINE • SHIFT TO 2ND/1ST GEAR FOR CLIMBING TORQUE'
          : (isSnowing ? 'ALPINE SNOW • SHIFT TO 4WD FOR TRACTION' : 'LOOSE OFF-ROAD SAND • SHIFT TO 2ND [2]');
        alertAction = 'PRESS [2] OR [SPACE] FOR 4WD';
      } else {
        isWrong = false;
        recommendedMode = this.driveMode;
      }
    } else {
      // Dry asphalt highway
      recommendedMode = 'HIGH';
      if (isLowGearMode || this.driveMode === 'MID') {
        isWrong = true;
        alertTitle = '⚠️ WRONG GEAR • SHIFT TO HIGH';
        alertMessage = 'PAVED HIGHWAY • SHIFT TO HIGH GEAR TO RELEASE SPEED LIMITER';
        alertAction = 'PRESS [3] OR [SPACE] FOR HIGH';
      }
    }

    gameState.recommendedDriveMode = recommendedMode;
    gameState.isWrongDrivetrain = isWrong;
    gameState.isWrongGear = isWrong;
    gameState.wrongGearTitle = isWrong ? alertTitle : '';
    gameState.wrongGearSubtitle = isWrong ? alertMessage : '';
    gameState.wrongGearAction = isWrong ? alertAction : '';

    this._wrongGearDuration = 0;

    // ── Trail Dynamic Bumpiness, Suspension Bottoming-Out & Off-Road Damage ──
    const inStagingBasin = Boolean(
      (trailQ && trailQ.t <= 0.12) ||
      (rInfo && rInfo.isTurnout) ||
      (this.position.z >= 930 && this.position.z <= 1090 && trailLat <= -8.0 && trailLat >= -65.0)
    );

    // Natural deceleration assist in the sandy/gravel staging basin when transitioning from highway
    if (inStagingBasin && Math.abs(this.speed) > 12.0) {
      this.speed *= (1.0 - 0.50 * dt); // Safely slows from highway speeds down to staging speeds
    }

    // Cooldown timer decay
    if (this._trailBottomingCooldown > 0) {
      this._trailBottomingCooldown -= dt;
    }

    if (isTrailActive && !inStagingBasin && Math.abs(this.speed) > 1.2 && !gameState.isServicing) {
      const speedMph = Math.abs(this.speed) * 2.23694;
      const techSec = this._currentTrailTechSection;

      // Only technical zones or rough rock/mogul/mud terrain produce bottoming-out hazards
      const hasRoughObstacles = Boolean(techSec || (trailQ && trailQ.rockBump > 0.08) || gameState.isInMud);
      const safeSpeed = techSec ? techSec.maxSafeSpeedMph : (DAMAGE.TRAIL_SAFE_SPEED_MID_MPH || 22.0);
      const roughness = techSec ? techSec.roughnessFactor : 1.25;

      // In LOW gear, long-travel crawl damping soaks up bumps smoothly up to crawl limit (18 mph) with 0 damage
      const gearHarshness = (this.driveMode === 'HIGH' ? 2.5 : (this.driveMode === 'MID' ? 1.4 : 0.0));

      if (hasRoughObstacles && speedMph > safeSpeed && gearHarshness > 0) {
        const overSpeed = speedMph - safeSpeed;
        const bumpIntensity = THREE.MathUtils.clamp((overSpeed / 12.0) * gearHarshness * (roughness * 0.6), 0.15, 1.0);

        // High frequency chassis vibration & teeth-rattling camera trauma
        gameState.chassisVibration = Math.max(gameState.chassisVibration || 0, bumpIntensity);

        // Dynamic pitch and roll rocking (chassis violently bucking over ruts & rocks)
        const bumpFreq = speedMph * 1.15;
        this.pitch += Math.sin(gameState.gameTime * bumpFreq) * 0.020 * bumpIntensity;
        this.roll += Math.cos(gameState.gameTime * (bumpFreq * 0.85)) * 0.028 * bumpIntensity;

        // Suspension Bottoming-Out with strict cooldown (at most once every 1.5 seconds)
        if (!isLowGearMode && overSpeed > 3.0) {
          gameState.suspensionCompression = 1.0;

          if (!this._trailBottomingCooldown || this._trailBottomingCooldown <= 0) {
            this._trailBottomingCooldown = 1.5; // Guaranteed 1.5s cooldown between damage hits

            // Capped progressive bottom-out damage (0.8% to 3.2% max)
            const bottomDmg = THREE.MathUtils.clamp(
              DAMAGE.TRAIL_BOTTOMING_DAMAGE_BASE + (overSpeed / 16.0) * DAMAGE.TRAIL_BOTTOMING_DAMAGE_SCALE * (roughness * 0.5),
              0.8,
              3.5
            );
            this.applyDamage(bottomDmg, speedMph, (Math.random() - 0.5) * 1.5, -0.6, -0.15);

            gameState.skidPlateScraping = true;

            // Audio: metal crunch & suspension slam
            if (window.game && window.game.sound) {
              if (window.game.sound.triggerSuspensionBottomOut) {
                window.game.sound.triggerSuspensionBottomOut(bumpIntensity);
              }
              if (window.game.sound.triggerSkidPlateScrape) {
                window.game.sound.triggerSkidPlateScrape(Math.abs(this.speed));
              }
            }

            // Sparks flying from crushed skid plate
            if (this.gpuVFX && this.gpuVFX.emitSparks) {
              const sPos = new THREE.Vector3(this.position.x, this.position.y + 0.05, this.position.z);
              this.gpuVFX.emitSparks(sPos, new THREE.Vector3(0, 1, 0), 10, 0.8);
            }

            // Screen toast warning
            if (window.game && window.game.hud && window.game.hud.showActionToast) {
              const reason = techSec ? techSec.shortName : 'ROUGH TERRAIN';
              window.game.hud.showActionToast(
                `⚠️ SUSPENSION BOTTOMING (-${bottomDmg.toFixed(1)}%)`,
                `${reason} • SHIFT TO 1ST LOW GEAR [1]`,
                2200
              );
            }
          }
        }
      }
    } else if (!isOnRoad && !isTrailActive && Math.abs(this.speed) > 4.0 && !gameState.isServicing) {
      // Exempt trailhead approach from off-road wear
      const isNearTrailhead = (this.position.z >= 930 && this.position.z <= 1090 && trailLat <= -8.0 && trailLat >= -70.0);
      if (!isNearTrailhead) {
        // Gentle wear depending on speed and surface harshness
        const offRoadSpeedFactor = THREE.MathUtils.clamp((Math.abs(this.speed) - 4.0) / 20.0, 0, 1.0);
        const surfaceHarshness = surfaceType === 'sand' ? 0.08 : 0.05; // sand = slightly rougher; dirt = softer
        const offRoadWear = surfaceHarshness * offRoadSpeedFactor * dt;

        // Accumulate in a timer; apply damage every 4.5s
        this._offRoadDamageTimer = (this._offRoadDamageTimer || 0) + offRoadWear;
        if (this._offRoadDamageTimer >= DAMAGE.OFFROAD_ACCUMULATE_TIME) {
          this._offRoadDamageTimer = 0;
          // Scaled mild off-road jolt with speed
          const offRoadDmg = DAMAGE.OFFROAD_DAMAGE_BASE + offRoadSpeedFactor * DAMAGE.OFFROAD_DAMAGE_SCALE;
          this.applyDamage(offRoadDmg, 0, (Math.random() - 0.5) * 2, -0.3, 0);
        }
      }
    } else {
      this._offRoadDamageTimer = Math.max(0, (this._offRoadDamageTimer || 0) - dt * 0.5);
      if (isOnRoad) this._shownOffRoadWarning = false; // Reset warning next excursion
    }

    // Mobile touch gets snappier, wider steering; keyboard/gamepad use original desktop tuning.
    const touchSteering = !!input.isTouchSteering;
    const steerDamp     = touchSteering ? 22.0 : (gameState.isBoosting ? 18.0 : 14.0);
    const steerSpeedMult = touchSteering ? (4.2 / 3.2) : 1.0;   // ~+31% turn rate on touch
    const maxAngleMult   = touchSteering ? (0.52 / 0.48) : 1.0; // wider lock on touch only

    this.smoothedSteer = THREE.MathUtils.damp(this.smoothedSteer, input.steer, steerDamp, dt);

    if (Math.abs(this.speed) > 0.2) {
      const steerSpeedFactor = Math.min(1.0, Math.abs(this.speed) / 5.0);
      // High-speed downforce curve: maintains high aerodynamic turn-in bite across 120-195+ MPH
      const highSpeedDampCoeff = touchSteering ? 0.0055 : 0.0070;
      let highSpeedDamp = 1.0 / (1.0 + Math.max(0, Math.abs(this.speed) - 25) * highSpeedDampCoeff);

      // Active aerodynamic downforce assist in Turbo / Nitro boost:
      // Stabilizes high-speed handling at 235 MPH, preventing understeer or twitchiness
      if (gameState.isBoosting) {
        highSpeedDamp = Math.max(0.55, highSpeedDamp * 1.15);
      }

      const steerDir = Math.sign(this.speed);
      const offRoadDriftBonus = surfaceType !== 'asphalt' ? 0.45 : (weatherRoadGrip < 0.9 ? 0.35 : 0.0);
      const boostGripBonus = gameState.isBoosting ? 0.18 : 0.0;
      const maxTurnRate = (PHYSICS.MAX_STEER_ANGLE * maxAngleMult * steerSpeedFactor * highSpeedDamp) * (1.0 + (this.driftFactor * 0.75 + offRoadDriftBonus * 0.5 + boostGripBonus));
      this.heading += -this.smoothedSteer * maxTurnRate * PHYSICS.STEER_SPEED * steerSpeedMult * surfaceGrip * dt * steerDir;

      // High-speed straight-line tracking stability in Turbo mode
      if (gameState.isBoosting && Math.abs(input.steer) < 0.035 && Math.abs(this.smoothedSteer) < 0.035) {
        this.heading = THREE.MathUtils.damp(this.heading, this.heading, 8.0, dt);
      }
    } else if (Math.abs(this.smoothedSteer) > 0.04) {
      // Low-speed & stationary steering pivot assist (3-point turn & recovery when stuck)
      const isReversing = input.brake > 0.1 || gameState.gear === 'R';
      const pivotDir = isReversing ? -1 : 1;
      const pivotRate = PHYSICS.MAX_STEER_ANGLE * maxAngleMult * (PHYSICS.STEER_SPEED * 0.70) * steerSpeedMult * Math.max(0.65, surfaceGrip);
      this.heading += -this.smoothedSteer * pivotRate * dt * pivotDir;
    }

    // 4. Aerodynamic Crosswinds (Columbia Gorge & Coastal Gaps)
    if (currentZone.windForce && currentZone.windForce > 0) {
      const gustNoise = Math.sin(this.position.z * 0.04 + gameState.timeOfDay * 15.0) * 0.35 + 0.65;
      const bridgeBonus = (this.position.z >= 18600 && this.position.z <= 18800) ? 1.65 : 1.0; // High bridge crosswind
      const crosswindPush = currentZone.windForce * gustNoise * bridgeBonus * dt * 0.16;
      this.position.x += crosswindPush;
    }

    // 4b. Desert Dust Devil Proximity Vortex Turbulence (Zone 0)
    if (zoneIdx === 0 && window.game && window.game.environment && window.game.environment.dustDevils && window.game.environment.dustDevils.length > 0) {
      for (const dd of window.game.environment.dustDevils) {
        const dx = this.position.x - dd.group.position.x;
        const dz = this.position.z - dd.group.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < 144.0) { // Within 12m of dust devil
          const dist = Math.sqrt(distSq);
          const vortexEffect = (1.0 - dist / 12.0);
          this.heading += Math.sin(dd.wobble * 2.5) * vortexEffect * 0.85 * dt;
          this.speed *= (1.0 - 0.12 * vortexEffect * dt);
        }
      }
    }

    // 5. Integrate Dynamic 2D Velocity & Lateral Drift Inertia
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);
    const rightX = Math.cos(this.heading);
    const rightZ = -Math.sin(this.heading);

    // Calculate lateral slip velocity when drifting or turning aggressively
    const isDriftActive = this.driftFactor > 0.25 || (surfaceGrip < 0.95 && Math.abs(this.smoothedSteer) > 0.35);
    const lateralTarget = isDriftActive
      ? -this.smoothedSteer * Math.abs(this.speed) * (0.35 * this.driftFactor + 0.20 * (1.0 - surfaceGrip))
      : 0.0;

    const latGripRate = isDriftActive ? (PHYSICS.DRIFT_LATERAL_GRIP || 0.95) * 5.5 : (PHYSICS.TIRE_LATERAL_GRIP || 1.85) * 12.0;
    this.lateralVelocity = THREE.MathUtils.damp(this.lateralVelocity, lateralTarget, latGripRate * surfaceGrip, dt);
    if (Math.abs(this.speed) < 0.5) {
      this.lateralVelocity = 0;
    }

    const vWorldX = forwardX * this.speed + rightX * this.lateralVelocity;
    const vWorldZ = forwardZ * this.speed + rightZ * this.lateralVelocity;

    this.position.x += vWorldX * dt;
    this.position.z += vWorldZ * dt;
    this.velocity.set(vWorldX, this.verticalVelocity, vWorldZ);
    gameState.trailWrongWay = '';

    this.slipAngle = Math.abs(this.speed) > 1.5 ? Math.atan2(this.lateralVelocity, Math.abs(this.speed)) : 0;
    gameState.lateralSlipVelocity = this.lateralVelocity;

    // 4a. Solid World Obstacle Collisions (Auto Repair Shops, Buildings, Walls & Structures)
    // Prevents vehicle from penetrating or driving through walls and physical buildings
    if (this.obstacleSystem) {
      const collision = this.obstacleSystem.resolveCollision(this.position, 1.35);
      if (collision && collision.collided) {
        // Displace car immediately outside the solid obstacle hull
        this.position.x += collision.pushX;
        this.position.z += collision.pushZ;

        const speedMph = Math.abs(this.speed / SPEED_SCALE) * 2.23694;
        const now = performance.now();

        // Project velocity onto wall plane (cancel normal penetration velocity)
        const vX = forwardX * this.speed;
        const vZ = forwardZ * this.speed;
        const vDotN = vX * collision.normalX + vZ * collision.normalZ;

        if (vDotN < 0) {
          const restitution = 0.20; // Mild elastic rebound off solid concrete/brick walls
          const newVx = (vX - (1.0 + restitution) * vDotN * collision.normalX) * 0.55;
          const newVz = (vZ - (1.0 + restitution) * vDotN * collision.normalZ) * 0.55;
          this.speed = (newVx * forwardX + newVz * forwardZ);
        }

        // Apply physical impact damage & crash feedback on hard collisions
        if (speedMph > 14) {
          // High-speed obstacle impact & scrape sparks
          if (this.gpuVFX && this.gpuVFX.emitSparks) {
            if (!this._obsSparkPos) {
              this._obsSparkPos = new THREE.Vector3();
              this._obsSparkNorm = new THREE.Vector3();
            }
            this._obsSparkPos.set(this.position.x - collision.normalX * 0.8, this.position.y + 0.35, this.position.z - collision.normalZ * 0.8);
            this._obsSparkNorm.set(collision.normalX, 0.4, collision.normalZ).normalize();
            this.gpuVFX.emitSparks(this._obsSparkPos, this._obsSparkNorm, Math.min(22, Math.round(speedMph * 0.25)), speedMph / 60);
          }

          if (!this.lastObstacleImpactTime || now - this.lastObstacleImpactTime > 400) {
            this.lastObstacleImpactTime = now;
            const impactSeverity = THREE.MathUtils.clamp((speedMph - 14) / 75, 0, 1.6);
            const obstacleDamage = DAMAGE.BARRIER_DAMAGE_BASE + Math.pow(impactSeverity, 1.4) * (DAMAGE.BARRIER_DAMAGE_SCALE * 1.2);
            this.applyDamage(obstacleDamage, speedMph, -collision.normalX * 0.8, -collision.normalZ * 0.8, 0);

            // Hard impact roll/pitch moment
            if (speedMph > 35) {
              this.angularVelocity.z = collision.normalX * 4.0;
              this.angularVelocity.x = -collision.normalZ * 3.5;
            }
          }
        } else if (speedMph > 0.8) {
          // Low-speed physical rock / barrier crawl scrape feedback
          if (!this.lastObstacleScrapeTime || now - this.lastObstacleScrapeTime > 320) {
            this.lastObstacleScrapeTime = now;
            if (window.game && window.game.sound && window.game.sound.triggerSkidPlateScrape) {
              window.game.sound.triggerSkidPlateScrape(speedMph);
            }
          }
        }
      }
    }

    // 4b. Rigid World Boundaries & Corridor Perimeter Collision Enforcers
    const MIN_WORLD_Z = -64.0; // Staging plaza rear barrier at Z = -68m
    const MAX_WORLD_Z = 23408.0; // Seattle finish line barrier at Z = 23415m
    const corridorOffset = (zoneIdx === 0) ? (PHYSICS.MAX_LATERAL_OFFSET_DESERT || 88.0) : (PHYSICS.MAX_LATERAL_OFFSET || 78.0);

    if (this.splineRoad) {
      const roadInfo = this.splineRoad.getRoadInfo(this.position.x, this.position.z);
      const roadCenter = roadInfo.roadPoint;
      const lateralDist = (roadInfo && typeof roadInfo.lateralDist === 'number') ? roadInfo.lateralDist : (this.position.x - roadCenter.x);
      const isBridge = (this.position.z >= 18550 && this.position.z <= 18750) ||
                       (this.position.z >= 28600 && this.position.z <= 29200) ||
                       (this.position.z >= 31750 && this.position.z <= 31950) ||
                       (this.position.z >= 41300 && this.position.z <= 41500);
      const inTrailCorridor = !!(roadInfo && roadInfo.isOnTrail) || (this.position.z >= 2440 && this.position.z <= 3080 && lateralDist < -14);
      const effectiveMaxLeft = inTrailCorridor ? 380.0 : (roadInfo.isTurnout ? 85.0 : corridorOffset);
      const effectiveMaxRight = roadInfo.isTurnout ? 85.0 : corridorOffset;
      const clampMaxLateral = (lateralDist < 0) ? effectiveMaxLeft : effectiveMaxRight;
      const effectiveMaxLateral = isBridge ? 16.0 : clampMaxLateral;

      if (Math.abs(lateralDist) > effectiveMaxLateral) {
        // Rigid perimeter guardrail collision: clamp position along road normal
        const sign = Math.sign(lateralDist);
        const normX = roadInfo.normal ? roadInfo.normal.x : 1;
        const normZ = roadInfo.normal ? roadInfo.normal.z : 0;
        this.position.x = roadCenter.x + normX * (sign * effectiveMaxLateral);
        this.position.z = roadCenter.z + normZ * (sign * effectiveMaxLateral);
        
        // Calculate vehicle velocity component directed outward into the barrier
        const vWorldX = forwardX * this.speed + rightX * this.lateralVelocity;
        const vWorldZ = forwardZ * this.speed + rightZ * this.lateralVelocity;
        const outwardVel = (vWorldX * normX + vWorldZ * normZ) * sign;

        // ONLY absorb kinetic energy and deflect heading if vehicle is actively moving OUTWARD into the barrier
        if (outwardVel > 0.05) {
          const speedMph = Math.abs(this.speed / SPEED_SCALE) * 2.23694;
          const now = performance.now();

          // High-speed guardrail scrape sparks
          if (this.gpuVFX && this.gpuVFX.emitSparks && speedMph > 20) {
            if (!this._barrierSparkPos) {
              this._barrierSparkPos = new THREE.Vector3();
              this._barrierSparkNorm = new THREE.Vector3();
            }
            this._barrierSparkPos.set(this.position.x, this.position.y + 0.35, this.position.z);
            this._barrierSparkNorm.set(-sign * 0.8, 0.4, -Math.sign(this.speed) * 0.4).normalize();
            this.gpuVFX.emitSparks(this._barrierSparkPos, this._barrierSparkNorm, Math.min(20, Math.round(speedMph * 0.2)), speedMph / 70);
          }

          if (speedMph > 25) {
            // Debounce barrier impact impulses so it doesn't trigger 60 times a second
            if (!this.lastBarrierImpactTime || now - this.lastBarrierImpactTime > 600) {
              this.lastBarrierImpactTime = now;

              const impactFactor = THREE.MathUtils.clamp((speedMph - 28) / 90, 0, 1.5);
              const barrierDamage = DAMAGE.BARRIER_DAMAGE_BASE + Math.pow(impactFactor, 1.5) * DAMAGE.BARRIER_DAMAGE_SCALE;
              this.applyDamage(barrierDamage, speedMph, sign * 0.85, 0.45, 0);

              if (speedMph > 45) {
                // Hard barrier impact: trigger controlled angular moment & small weighted hop
                const impactSeverity = Math.min(1.0, (speedMph - 45) / 60);
                this.angularVelocity.z = -sign * (4.5 + impactSeverity * 6.5); // Roll moment
                this.angularVelocity.x = (Math.random() - 0.5) * 4.5;          // Pitch moment
                // Controlled upward hop, capped tightly so car doesn't fly into the stratosphere
                this.verticalVelocity = Math.min(4.5, 1.8 + impactSeverity * 2.4);
                this.isGrounded = false;
              }
            }
          }

          // Absorb outward impact kinetic energy
          this.speed *= 0.68;
          
          // Deflect heading inward towards the highway
          const roadHeading = Math.atan2(roadInfo.tangent.x, roadInfo.tangent.z);
          const inwardTarget = roadHeading - sign * 0.45;
          this.heading = THREE.MathUtils.damp(this.heading, inwardTarget, 10.0, dt);
        }
      }
    }

    // Start Grid & Finish Line Z Boundary Collisions
    if (this.position.z < MIN_WORLD_Z) {
      this.position.z = MIN_WORLD_Z;
      if (this.speed < 0) this.speed = 0;
    } else if (this.position.z > MAX_WORLD_Z) {
      this.position.z = MAX_WORLD_Z;
      this.speed *= 0.85;
    }

    // 5. Multi-Point Ground Elevation & Slope Alignment (4-Corner Wheel Sampling)
    const halfBase = 1.28;
    const halfTrack = 0.94;
    const wheelBaseOffset = halfBase * 0.92;
    const wheelTrackOffset = halfTrack * 0.95;

    // 4 Corner Wheel World Coordinates
    const flX = this.position.x + forwardX * wheelBaseOffset - rightX * wheelTrackOffset;
    const flZ = this.position.z + forwardZ * wheelBaseOffset - rightZ * wheelTrackOffset;
    const frX = this.position.x + forwardX * wheelBaseOffset + rightX * wheelTrackOffset;
    const frZ = this.position.z + forwardZ * wheelBaseOffset + rightZ * wheelTrackOffset;
    const rlX = this.position.x - forwardX * wheelBaseOffset - rightX * wheelTrackOffset;
    const rlZ = this.position.z - forwardZ * wheelBaseOffset - rightZ * wheelTrackOffset;
    const rrX = this.position.x - forwardX * wheelBaseOffset + rightX * wheelTrackOffset;
    const rrZ = this.position.z - forwardZ * wheelBaseOffset + rightZ * wheelTrackOffset;

    const yCenter = this.getGroundHeightAt(this.position.x, this.position.z);
    const yFL = this.getGroundHeightAt(flX, flZ);
    const yFR = this.getGroundHeightAt(frX, frZ);
    const yRL = this.getGroundHeightAt(rlX, rlZ);
    const yRR = this.getGroundHeightAt(rrX, rrZ);

    const yFront = (yFL + yFR) * 0.5;
    const yRear = (yRL + yRR) * 0.5;
    const yLeft = (yFL + yRL) * 0.5;
    const yRight = (yFR + yRR) * 0.5;

    // Solid Live Axle Articulation Tilt Angles (radians)
    const frontAxleTilt = Math.atan2(yFR - yFL, wheelTrackOffset * 2);
    const rearAxleTilt = Math.atan2(yRR - yRL, wheelTrackOffset * 2);
    gameState.axleTilt = { front: frontAxleTilt, rear: rearAxleTilt };
    gameState.wheelElevations = { fl: yFL, fr: yFR, rl: yRL, rr: yRR };

    // 5b. Multi-Layer Fallback Out-of-Bounds & Void Protection
    const roadInfoCheck = this.splineRoad ? this.splineRoad.getRoadInfo(this.position.x, this.position.z) : null;
    const inTrailCorridor = !!(roadInfoCheck && roadInfoCheck.isOnTrail) || (this.position.z >= 960 && this.position.z <= 1530 && roadInfoCheck && roadInfoCheck.lateralDist < -14);
    const maxAllowedDist = inTrailCorridor ? 480.0 : 115.0;
    const isExtremeLateral = roadInfoCheck && (roadInfoCheck.distToCenter > maxAllowedDist);

    // Skid Plate & Rock High-Centering Contact Detection
    // Occurs exclusively when off-road or on technical rock crawling trails when
    // a boulder, rock ridge, or mogul crest between the wheels protrudes significantly
    // higher than the wheel contact plane and strikes the chassis belly pan.
    const isPavedRoad = roadInfoCheck && roadInfoCheck.isOnRoad && !inTrailCorridor;
    const wheelPlaneAvgY = (yFL + yFR + yRL + yRR) * 0.25;
    const rockHumpHeight = yCenter - wheelPlaneAvgY;
    const chassisBottomY = this.position.y - 0.14;

    const isSkidScraping = !isPavedRoad && (rockHumpHeight > 0.12) && (yCenter > chassisBottomY) && Math.abs(this.speed) > 0.4 && this.isGrounded;
    if (isSkidScraping) {
      gameState.skidPlateScraping = true;
      this.speed *= (1.0 - 0.12 * dt); // Frictional belly pan drag
      if (this.gpuVFX && this.gpuVFX.emitSparks && Math.abs(this.speed) > 2.5) {
        if (!this._skidSparkTimer) this._skidSparkTimer = 0;
        this._skidSparkTimer += dt;
        if (this._skidSparkTimer > 0.12) {
          this._skidSparkTimer = 0;
          const sPos = new THREE.Vector3(this.position.x, yCenter + 0.06, this.position.z);
          const sNorm = new THREE.Vector3(0, 1, 0);
          this.gpuVFX.emitSparks(sPos, sNorm, 3, 0.4);
        }
      }
      if (!this._skidAudioTimer) this._skidAudioTimer = 0;
      this._skidAudioTimer += dt;
      if (this._skidAudioTimer > 0.32) {
        this._skidAudioTimer = 0;
        if (window.game && window.game.sound && window.game.sound.triggerSkidPlateScrape) {
          window.game.sound.triggerSkidPlateScrape(Math.abs(this.speed));
        }
      }
    } else {
      gameState.skidPlateScraping = false;
      this._skidAudioTimer = 0.32; // Ready to trigger immediately on first contact
    }
    const isExtremeZ = this.position.z < -85.0 || this.position.z > 23450.0;
    const isCorrupted = isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z);

    // Void detection: only trigger emergency road rescue if vehicle has plunged into the void
    // or remains severely stuck underground for multiple continuous frames.
    // Steep rock ledges, moguls, and summit platforms will never falsely trigger respawn.
    const isVoidDrop = this.position.y < -35.0;
    const isSeverelyUnderground = (this.position.y < (yCenter - 14.0));
    if (isSeverelyUnderground || isVoidDrop) {
      this._undergroundTimer = (this._undergroundTimer || 0) + dt;
    } else {
      this._undergroundTimer = 0;
    }
    const isUnderground = (this._undergroundTimer > 0.8) || (this.position.y < -45.0);

    // Way Out of Bounds detection:
    // When the vehicle wanders far past the corridor limits (lateral > 115m or > 480m in trail corridor, or extreme Z),
    // flag isOutOfBounds so the HUD can show the rescue popup and give the player control to recover.
    const isWayOutOfBounds = Boolean(isExtremeLateral || isExtremeZ);
    const isCatastrophicBounds = (roadInfoCheck && roadInfoCheck.distToCenter > (maxAllowedDist + 80.0)) || (this.position.z < -160.0 || this.position.z > 23600.0);

    if (isWayOutOfBounds && !isCatastrophicBounds && !isUnderground && !isCorrupted) {
      this._outOfBoundsTimer = (this._outOfBoundsTimer || 0) + dt;
      gameState.isOutOfBounds = true;
      // Auto-rescue safety fallback if player stays out of bounds for over 15 seconds
      if (this._outOfBoundsTimer > 15.0) {
        this.respawnOnRoad(true);
        return;
      }
    } else {
      this._outOfBoundsTimer = 0.0;
      gameState.isOutOfBounds = false;
    }

    if (isUnderground || isCatastrophicBounds || isCorrupted) {
      this.respawnOnRoad(true);
      return;
    }

    const targetPitch = THREE.MathUtils.clamp(Math.atan2(yFront - yRear, halfBase * 2), -0.75, 0.75);
    const targetRoll = THREE.MathUtils.clamp(Math.atan2(yLeft - yRight, halfTrack * 2), -0.75, 0.75);

    // Multi-point contact height resolution:
    // Ensures whichever wheel contact point is highest on the slope lifts the chassis,
    // guaranteeing that no wheel, tire, front splitter, or rear diffuser is ever below the ground surface.
    const frontLift = Math.sin(this.pitch) * halfBase;
    const rearLift = -Math.sin(this.pitch) * halfBase;
    const leftLift = Math.sin(this.roll) * halfTrack;
    const rightLift = -Math.sin(this.roll) * halfTrack;

    const reqYCenter = yCenter + 0.18;
    const reqYFront = yFront + 0.18 - frontLift;
    const reqYRear = yRear + 0.18 - rearLift;
    const reqYLeft = yLeft + 0.18 - leftLift;
    const reqYRight = yRight + 0.18 - rightLift;

    // The vehicle wheels rest on the surface, guaranteeing the chassis cannot sink into dirt or slopes
    let targetY;
    if (isPavedRoad) {
      targetY = reqYCenter;
    } else {
      const maxWheelY = Math.max(yFL, yFR, yRL, yRR);
      targetY = Math.max(reqYCenter, reqYFront, reqYRear, reqYLeft, reqYRight, maxWheelY);
    }

    // Ballistic Airborne Jump Physics & 3D Tumbling Suspension Dynamics
    if (this.position.y > targetY + 0.12) {
      // Vehicle is airborne in flight — Strong, snappy racing vehicle gravity & aerodynamic downforce
      this.isGrounded = false;
      const downforceGravity = 58.0; // Increased from 28.0 m/s^2 to 58.0 m/s^2 for heavy, realistic grounded car weight
      this.verticalVelocity -= downforceGravity * dt;
      this.position.y += this.verticalVelocity * dt;

      // Integrate 3D Tumbling Moments with active air drag
      this.tumbleRoll += this.angularVelocity.z * dt;
      this.tumblePitch += this.angularVelocity.x * dt;
      this.angularVelocity.x *= Math.max(0, 1.0 - 2.0 * dt);
      this.angularVelocity.z *= Math.max(0, 1.0 - 2.0 * dt);

      // Clamp max flight altitude above ground so car never gets lost in the clouds
      const maxAirborneHeight = targetY + 3.8; // Max 3.8 meters above road
      if (this.position.y > maxAirborneHeight) {
        this.position.y = maxAirborneHeight;
        this.verticalVelocity = Math.min(0, this.verticalVelocity);
      }

      if (this.position.y <= targetY) {
        // Touchdown — shock absorption & spring compression
        this.position.y = targetY;
        const landingSpeed = Math.abs(this.verticalVelocity);
        this.suspensionCompression = Math.min(PHYSICS.MAX_SUSPENSION_TRAVEL || 0.16, landingSpeed * 0.018);
        this.verticalVelocity = 0;
        this.isGrounded = true;

        // Hard touchdown sparks on heavy landings
        if (landingSpeed > 18.0 && this.gpuVFX && this.gpuVFX.emitSparks) {
          if (!this._landSparkPos) {
            this._landSparkPos = new THREE.Vector3();
            this._landSparkNorm = new THREE.Vector3(0, 1, 0);
          }
          this._landSparkPos.set(this.position.x, targetY, this.position.z);
          this.gpuVFX.emitSparks(this._landSparkPos, this._landSparkNorm, 12, 0.7);
        }
      }
    } else {
      // On the ground — check for launch upward velocity over crests/ramps
      const slopeLaunchVelocity = Math.tan(this.pitch) * this.speed;
      if (slopeLaunchVelocity > 6.0 && Math.abs(this.speed) > 22.0) {
        this.verticalVelocity = Math.min(4.0, slopeLaunchVelocity * 0.45);
        this.isGrounded = false;
        this.position.y += this.verticalVelocity * dt;
      } else {
        // Rebound damping on suspension compression
        this.suspensionCompression = THREE.MathUtils.damp(this.suspensionCompression, 0.0, PHYSICS.SUSPENSION_REBOUND_DAMP || 14.0, dt);
        this.position.y = Math.max(targetY - Math.min(0.08, this.suspensionCompression * 0.35), THREE.MathUtils.damp(this.position.y, targetY, 32.0, dt));
        this.isGrounded = true;
        this.verticalVelocity = 0;
      }

      // Check if vehicle is upside down (roof ground-contact detection: cos(tumbleRoll) < 0.1)
      const isUpsideDown = Math.cos(this.tumbleRoll) < 0.15 || Math.cos(this.tumblePitch) < -0.4;
      if (isUpsideDown) {
        this.isFlipped = true;
        gameState.isFlipped = true;

        // Inverted chassis friction deceleration
        this.speed *= Math.max(0, 1.0 - 2.2 * dt);
        this.angularVelocity.multiplyScalar(Math.max(0, 1.0 - 4.5 * dt));

        if (this.damageLevel < 3) {
          this.applyDamage(DAMAGE.ROLLOVER_DAMAGE); // Structural roof impact on inverted rollover
        }

        this.rescueTimer += dt;
        if (this.rescueTimer >= 2.5) {
          this.respawnOnRoad();
        }
      } else {
        this.isFlipped = false;
        gameState.isFlipped = false;
        this.rescueTimer = 0.0;
        // Smoothly settle tumble angles back to upright
        this.tumbleRoll = THREE.MathUtils.damp(this.tumbleRoll, 0, 10.0, dt);
        this.tumblePitch = THREE.MathUtils.damp(this.tumblePitch, 0, 10.0, dt);
      }
    }

    this.pitch = THREE.MathUtils.damp(this.pitch, targetPitch + this.tumblePitch, 16.0, dt);
    this.roll = THREE.MathUtils.damp(this.roll, targetRoll + this.tumbleRoll, 16.0, dt);

    // 6. Update Game State Displays & Inputs
    gameState.speed = this.speed / SPEED_SCALE;
    gameState.speedMph = Math.min(gameState.isBoosting ? PHYSICS.NITRO_MAX_SPEED_MPH : PHYSICS.MAX_SPEED_MPH, Math.round(Math.abs(this.speed / SPEED_SCALE) * 2.23694));
    gameState.distanceMeters = Math.max(0, this.position.z);
    gameState.playerX = this.position.x;
    gameState.playerY = this.position.y;
    gameState.playerZ = this.position.z;
    gameState.playerHeading = this.heading;
    gameState.isAirborne = !this.isGrounded;
    gameState.isDrifting = this.driftFactor > 0.3 || (surfaceType !== 'asphalt' && Math.abs(this.smoothedSteer) > 0.4 && Math.abs(this.speed) > 12);
    gameState.suspensionCompression = this.suspensionCompression;
    gameState.surface = surfaceType;
    gameState.throttleInput = input.throttle;
    gameState.brakeInput = input.brake;
    gameState.steerInput = input.steer;
    gameState.handbrake = input.handbrake;

    // Stuck Detection Assist:
    // If the player is actively applying throttle or brake while trapped at near-zero speed (< 2.2 MPH)
    const isPlayerInputtingDrive = (input.throttle > 0.20 || input.brake > 0.20);
    const isVirtuallyStopped = Math.abs(this.speed) < 1.0 && !this.isFlipped && !gameState.isServicing && !gameState.isIntroActive;

    if (gameState.isStuck) {
      // Once stuck, latch the state so the player can comfortably lift finger and tap "RESCUE TO ROAD"
      // Automatically clears if vehicle gets moving (> 5.5 MPH), visits mechanic, or remains idle > 10s
      if (Math.abs(this.speed) > 2.5 || gameState.isServicing || gameState.isIntroActive) {
        gameState.isStuck = false;
        this._stuckTimer = 0.0;
        this._stuckIdleTimer = 0.0;
      } else if (!isPlayerInputtingDrive) {
        this._stuckIdleTimer = (this._stuckIdleTimer || 0) + dt;
        if (this._stuckIdleTimer > 10.0) {
          gameState.isStuck = false;
          this._stuckTimer = 0.0;
          this._stuckIdleTimer = 0.0;
        }
      } else {
        this._stuckIdleTimer = 0.0;
      }
    } else {
      if (isPlayerInputtingDrive && isVirtuallyStopped) {
        this._stuckTimer = (this._stuckTimer || 0) + dt;
        if (this._stuckTimer > 1.6) {
          gameState.isStuck = true;
          this._stuckIdleTimer = 0.0;
        }
      } else {
        this._stuckTimer = Math.max(0, (this._stuckTimer || 0) - dt * 1.5);
      }
    }

    // Off-Road Pitch, Roll, Altitude & Incline Grade Telemetry
    gameState.pitchDeg = Math.round((-this.pitch * 180 / Math.PI) * 10) / 10;
    gameState.rollDeg = Math.round((-this.roll * 180 / Math.PI) * 10) / 10;
    gameState.altitudeMeters = Math.round(this.position.y * 10) / 10;
    gameState.trailGradePct = Math.round(Math.tan(-this.pitch) * 100);

    // 7. Authentic Jeep 3-Speed Transmission & AMC Inline Engine Tachometer
    // Gear 1: Low-Range Rock Crawl (Extreme climb crawl torque, 0–32 MPH)
    // Gear 2: Mid-Range Trail 4x4 (All-terrain locked 4WD momentum, ~25–72 MPH)
    // Gear 3: High-Range Touring Overdrive (Highway cruising speed, ~60–195 MPH)
    let gear = 1;
    let gearRatio = 0;
    let minRpm = 850;
    const currentMode = this.driveMode || 'HIGH';

    if (currentMode === 'LOW') {
      gear = 1;
      const crawlMax = (DRIVE_MODES.SPECS['LOW'] && DRIVE_MODES.SPECS['LOW'].maxSpeedMph) || 28.0;
      gearRatio = Math.min(1.0, (Math.abs(this.speed) * 2.23694) / crawlMax);
      minRpm = 850;
    } else if (currentMode === 'MID') {
      gear = 2;
      const midMax = (DRIVE_MODES.SPECS['MID'] && DRIVE_MODES.SPECS['MID'].maxSpeedMph) || 72.0;
      gearRatio = Math.min(1.0, (Math.abs(this.speed) * 2.23694) / midMax);
      minRpm = 1100;
    } else {
      // HIGH mode
      gear = 3;
      const highMax = (DRIVE_MODES.SPECS['HIGH'] && DRIVE_MODES.SPECS['HIGH'].maxSpeedMph) || 195.0;
      gearRatio = Math.min(1.0, (Math.abs(this.speed) * 2.23694) / highMax);
      minRpm = 1250;
    }

    if (this.speed < -0.2 || (Math.abs(this.speed) <= 0.2 && this.stoppedBrakeHoldTime >= (PHYSICS.REVERSE_ENGAGE_DELAY || 1.0))) {
      gameState.gear = 'R';
    } else if (Math.abs(this.speed) < 0.2 && input.throttle <= 0 && input.brake <= 0) {
      gameState.gear = 'N';
    } else {
      gameState.gear = gear;
    }

    let redline = canBoost ? 5600 : 4900;
    let cruiseCeiling = 3800;
    if (gear === 1) {
      cruiseCeiling = 3200;
      redline = 4200;
    } else if (gear === 2) {
      cruiseCeiling = 3600;
      redline = 4600;
    }

    const ceiling = THREE.MathUtils.lerp(cruiseCeiling, redline, Math.pow(input.throttle, 0.6));
    let targetRpm = minRpm + gearRatio * (ceiling - minRpm);
    if (this.is2WDStruggling && (currentMode === 'HIGH' || currentMode === 'MID') && input.throttle > 0.05) {
      // Transmission lugging: engine bogs down under hill climb load instead of revving freely
      const lugFreq = currentMode === 'HIGH' ? 32.0 : 26.0;
      targetRpm = minRpm + 180 * Math.sin(gameState.gameTime * lugFreq) + Math.random() * 40;
    } else if (input.throttle <= 0 && Math.abs(this.speed) < 1.0) {
      targetRpm = 850; // Idle RPM
    } else if (input.throttle <= 0) {
      targetRpm = Math.max(850, targetRpm * 0.70); // Deceleration engine drag
    }

    gameState.engineRpm = THREE.MathUtils.damp(gameState.engineRpm || 850, targetRpm, 14.0, dt);

    // 8. Redline Heat Soak (Authentic Jeep Inline-6 threshold)
    const REDLINE_HEAT_THRESHOLD = 4700;
    if (!canBoost && gameState.engineRpm >= REDLINE_HEAT_THRESHOLD && input.throttle > 0.5) {
      const redlineIntensity =
        (gameState.engineRpm - REDLINE_HEAT_THRESHOLD) / (redline - REDLINE_HEAT_THRESHOLD);
      gameState.engineHeat = Math.min(
        PHYSICS.HEAT_OVERHEAT_LIMIT,
        gameState.engineHeat + PHYSICS.HEAT_GAIN_REDLINE * redlineIntensity * dt
      );
      if (gameState.engineHeat >= PHYSICS.HEAT_OVERHEAT_LIMIT && !gameState.isOverheated) {
        gameState.isOverheated = true;
        console.warn('🔥 Engine overheat! Sustained redline — lift off and let it cool.');
      }
    }

    // 9. Drift Scoring Chain & Multiplier System
    if (gameState.isDrifting && Math.abs(this.speed) > 8.0) {
      const driftSpeedFactor = Math.abs(this.speed) / 20.0;
      gameState.currentDriftChain += dt * 350 * this.driftFactor * driftSpeedFactor;
      gameState.driftMultiplier = Math.min(5.0, gameState.driftMultiplier + dt * 0.45);
    } else if (gameState.currentDriftChain > 0) {
      gameState.driftScore += Math.round(gameState.currentDriftChain * gameState.driftMultiplier);
      gameState.score += Math.round(gameState.currentDriftChain * gameState.driftMultiplier);
      gameState.currentDriftChain = 0;
      gameState.driftMultiplier = 1.0;
    }

    // 10. Brake Heat Dynamics
    if (input.brake > 0.1 && Math.abs(this.speed) > 10.0) {
      const brakePower = (Math.abs(this.speed) / 35.0) * input.brake;
      gameState.brakeHeat = Math.min(1.0, (gameState.brakeHeat || 0) + brakePower * dt * 0.75);
    } else {
      gameState.brakeHeat = Math.max(0.0, (gameState.brakeHeat || 0) - dt * 0.35);
    }
  }
}
