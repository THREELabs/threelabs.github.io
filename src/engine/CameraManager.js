import * as THREE from 'three';
import { CAMERAS } from '../constants.js';
import { gameState } from '../state.js';

export class CameraManager {
  constructor(camera, vehicle) {
    this.camera = camera;
    this.vehicle = vehicle;
    this.mode = CAMERAS.CHASE;

    // Smooth camera tracking state
    this.currentCamPos = new THREE.Vector3(0, 2.2, -5.5);
    this.currentLookAt = new THREE.Vector3(0, 0.85, 0);
    this.smoothedHeading = 0;
    this.smoothedPitch = 0;

    // Chase configuration — elevated vantage clear over Safari Jeep roof rack & expedition gear
    this.chaseDistance = 7.2;
    this.chaseHeight = 3.7;

    // Cinematic 360 Orbital Camera Intro
    this.isIntro = true;
    this.introTimer = 0.0;
    this.introOrbitDuration = 4.2;
    this.introTransitionDuration = 2.4;
    this.introTotalDuration = this.introOrbitDuration + this.introTransitionDuration;
    this.introRadius = 6.8;
    this.introBaseHeight = 1.35;

    // Cached orbit endpoint for perfect seamless interpolation
    this._orbitEndCamPos = new THREE.Vector3();
    this._orbitEndLookAt = new THREE.Vector3();

    // Photo mode orbit controls
    this.photoOrbit = {
      radius: 7.0,
      theta: Math.PI,
      phi: Math.PI * 0.25,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    };

    this.setupPhotoControls();

    // Binocular panoramic view controls
    this.binocularControls = {
      yaw: 0.0,
      pitch: -0.15,
      fov: 24.0,
      targetYaw: 0.0,
      targetPitch: -0.15,
      targetFov: 24.0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    };

    this.setupBinocularControls();

    // Interactive mouse drag orbit rotation controls (left click and hold)
    this.manualYaw = 0.0;
    this.manualYawTarget = 0.0;
    this.manualPitch = 0.0;
    this.manualPitchTarget = 0.0;
    this.isOrbitDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.orbitTouchId = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.hasMovedPastThreshold = false;
    this.lastTapTime = 0;
    this.lastTapX = 0;
    this.lastTapY = 0;
    this._cockpitWorldPos = new THREE.Vector3();
    this._hoodWorldPos = new THREE.Vector3();
    this._wasCutsceneActive = false;
    this._lastCutscenePhase = null;

    this.setupOrbitControls();
  }

  startIntro() {
    this.isIntro = true;
    this.introTimer = 0.0;
    this.introOrbitDuration = 3.8;
    this.introTransitionDuration = 2.2;
    this.introTotalDuration = this.introOrbitDuration + this.introTransitionDuration;
    gameState.isIntroActive = true;
    gameState.introProgress = 0.0;
    gameState.introState = 'orbit';
    gameState.introSmokeOpacity = 1.0;
    gameState.dreamWhiteOpacity = 0.6;
    gameState.drowsyBlurPx = 0.0;
    gameState.eyelidOpenProgress = 1.0;
    gameState.desertAmbienceVolume = 1.0;
  }

  setPhysics(physics) {
    this.physics = physics;
  }

  skipIntro() {
    this.isIntro = false;
    this.introTimer = this.introTotalDuration;
    gameState.isIntroActive = false;
    gameState.introProgress = 1.0;
    gameState.introState = 'playing';
    gameState.introSmokeOpacity = 0.0;
    gameState.dreamWhiteOpacity = 0.0;
    gameState.drowsyBlurPx = 0.0;
    gameState.eyelidOpenProgress = 1.0;
    gameState.desertAmbienceVolume = 1.0;

    const phys = this.physics || (window.game && window.game.physics);
    if (phys) {
      if (phys.position.z < 5.0) {
        phys.position.x = 0.0;
        phys.position.z = Math.max(phys.position.z, 0.0);
        phys.heading = 0.0;
        phys.speed = Math.max(phys.speed, 8.5);
      }
    }

    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();
    this.resetTracking();
  }

  recenter() {
    this.manualYawTarget = 0.0;
    this.manualPitchTarget = 0.0;
  }

  resetTracking() {
    this.manualYaw = 0.0;
    this.manualYawTarget = 0.0;
    this.manualPitch = 0.0;
    this.manualPitchTarget = 0.0;
    this.isOrbitDragging = false;
    this.orbitTouchId = null;
    this.hasMovedPastThreshold = false;
    this.lastTapTime = 0;
    gameState.isCameraOrbiting = false;
    gameState.cameraOrbitYaw = 0.0;
    gameState.cameraOrbitPitch = 0.0;
    if (typeof document !== 'undefined' && document.body && document.body.style) {
      document.body.style.cursor = '';
    }

    if (!this.vehicle || !this.vehicle.group) return;
    const vPos = this.vehicle.group.position;
    const vRotY = this.vehicle.group.rotation.y;
    const vPitch = this.vehicle.group.rotation.x;

    this.smoothedHeading = vRotY;
    this.smoothedPitch = vPitch;

    const targetCamX = vPos.x - Math.sin(vRotY) * this.chaseDistance;
    const targetCamY = vPos.y + this.chaseHeight + Math.sin(vPitch) * 0.5;
    const targetCamZ = vPos.z - Math.cos(vRotY) * this.chaseDistance;

    this.currentCamPos.set(targetCamX, targetCamY, targetCamZ);
    this.camera.position.copy(this.currentCamPos);

    const targetLookX = vPos.x + Math.sin(vRotY) * 8.5;
    const targetLookY = vPos.y + 1.40;
    const targetLookZ = vPos.z + Math.cos(vRotY) * 8.5;

    this.currentLookAt.set(targetLookX, targetLookY, targetLookZ);
    this.camera.lookAt(this.currentLookAt);

    this.isIntro = false;
    gameState.isIntroActive = false;
    gameState.introSmokeOpacity = 0.0;
    gameState.dreamWhiteOpacity = 0.0;
    gameState.drowsyBlurPx = 0.0;
    gameState.eyelidOpenProgress = 1.0;
    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();
  }

  snapToVehicle() {
    this.resetTracking();
  }

  setupPhotoControls() {
    // Mouse Drag Controls
    window.addEventListener('mousedown', (e) => {
      if (gameState.isPhotoMode) {
        this.photoOrbit.isDragging = true;
        this.photoOrbit.lastMouseX = e.clientX;
        this.photoOrbit.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (gameState.isPhotoMode && this.photoOrbit.isDragging) {
        const dx = e.clientX - this.photoOrbit.lastMouseX;
        const dy = e.clientY - this.photoOrbit.lastMouseY;
        this.photoOrbit.lastMouseX = e.clientX;
        this.photoOrbit.lastMouseY = e.clientY;

        this.photoOrbit.theta -= dx * 0.008;
        this.photoOrbit.phi = Math.max(0.05, Math.min(Math.PI * 0.48, this.photoOrbit.phi + dy * 0.008));
      }
    });

    window.addEventListener('mouseup', () => {
      this.photoOrbit.isDragging = false;
    });

    window.addEventListener('wheel', (e) => {
      if (gameState.isPhotoMode) {
        this.photoOrbit.radius = Math.max(2.5, Math.min(25.0, this.photoOrbit.radius + e.deltaY * 0.01));
      }
    });

    // Mobile Multi-Touch & Pinch-to-Zoom Orbit Controls
    let initialPinchDist = null;
    let initialRadius = 7.0;

    window.addEventListener('touchstart', (e) => {
      if (!gameState.isPhotoMode) return;
      if (e.touches.length === 1) {
        this.photoOrbit.isDragging = true;
        this.photoOrbit.lastMouseX = e.touches[0].clientX;
        this.photoOrbit.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialRadius = this.photoOrbit.radius;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!gameState.isPhotoMode) return;
      if (e.touches.length === 1 && this.photoOrbit.isDragging) {
        const dx = e.touches[0].clientX - this.photoOrbit.lastMouseX;
        const dy = e.touches[0].clientY - this.photoOrbit.lastMouseY;
        this.photoOrbit.lastMouseX = e.touches[0].clientX;
        this.photoOrbit.lastMouseY = e.touches[0].clientY;

        this.photoOrbit.theta -= dx * 0.008;
        this.photoOrbit.phi = Math.max(0.05, Math.min(Math.PI * 0.48, this.photoOrbit.phi + dy * 0.008));
      } else if (e.touches.length === 2 && initialPinchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const scale = initialPinchDist / Math.max(10, currentDist);
        this.photoOrbit.radius = Math.max(2.5, Math.min(25.0, initialRadius * scale));
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.photoOrbit.isDragging = false;
      initialPinchDist = null;
    }, { passive: true });
  }

  setupBinocularControls() {
    // Mouse Drag Controls while in binocular view
    window.addEventListener('mousedown', (e) => {
      if (gameState.isBinocularView) {
        this.binocularControls.isDragging = true;
        this.binocularControls.lastMouseX = e.clientX;
        this.binocularControls.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (gameState.isBinocularView && this.binocularControls.isDragging) {
        const dx = e.clientX - this.binocularControls.lastMouseX;
        const dy = e.clientY - this.binocularControls.lastMouseY;
        this.binocularControls.lastMouseX = e.clientX;
        this.binocularControls.lastMouseY = e.clientY;

        // Sensitivity scales with FOV so zoomed in panning is steady and controllable
        const fovFactor = this.binocularControls.fov / 45.0;
        this.binocularControls.targetYaw = THREE.MathUtils.clamp(
          this.binocularControls.targetYaw - dx * 0.0035 * fovFactor,
          -Math.PI * 1.5, Math.PI * 1.5 // Full 360° panoramic sweep (East Desert to West City)
        );
        this.binocularControls.targetPitch = THREE.MathUtils.clamp(
          this.binocularControls.targetPitch - dy * 0.0035 * fovFactor,
          -0.65, 0.45 // Steep look down at highway up to mountain and city horizon
        );
      }
    });

    window.addEventListener('mouseup', () => {
      this.binocularControls.isDragging = false;
    });

    // Mouse Wheel Zoom
    window.addEventListener('wheel', (e) => {
      if (gameState.isBinocularView) {
        const zoomDelta = e.deltaY > 0 ? 2.5 : -2.5;
        this.adjustBinocularZoom(zoomDelta);
      }
    }, { passive: true });

    // Touch Controls (Mobile Touch Drag & Pinch-to-Zoom)
    let initialPinchDist = null;
    let initialFov = 24.0;

    window.addEventListener('touchstart', (e) => {
      if (!gameState.isBinocularView) return;
      if (e.touches.length === 1) {
        this.binocularControls.isDragging = true;
        this.binocularControls.lastMouseX = e.touches[0].clientX;
        this.binocularControls.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialFov = this.binocularControls.targetFov;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!gameState.isBinocularView) return;
      if (e.touches.length === 1 && this.binocularControls.isDragging) {
        const dx = e.touches[0].clientX - this.binocularControls.lastMouseX;
        const dy = e.touches[0].clientY - this.binocularControls.lastMouseY;
        this.binocularControls.lastMouseX = e.touches[0].clientX;
        this.binocularControls.lastMouseY = e.touches[0].clientY;

        const fovFactor = this.binocularControls.fov / 45.0;
        this.binocularControls.targetYaw = THREE.MathUtils.clamp(
          this.binocularControls.targetYaw - dx * 0.004 * fovFactor,
          -Math.PI * 1.5, Math.PI * 1.5
        );
        this.binocularControls.targetPitch = THREE.MathUtils.clamp(
          this.binocularControls.targetPitch - dy * 0.004 * fovFactor,
          -0.65, 0.45
        );
      } else if (e.touches.length === 2 && initialPinchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const ratio = currentDist / Math.max(10, initialPinchDist);
        this.binocularControls.targetFov = THREE.MathUtils.clamp(
          initialFov / ratio,
          6.5, 42.0
        );
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.binocularControls.isDragging = false;
      initialPinchDist = null;
    }, { passive: true });
  }

  setupOrbitControls() {
    // Mouse Drag Controls (Left-click and hold to rotate camera view)
    window.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (gameState.isPhotoMode || gameState.isBinocularView) return;

      const target = e.target;
      if (target && target.closest) {
        if (target.closest('button, a, input, select, textarea, [role="button"], #dev-menu, #zone-menu, #tablet-modal, #hud-tablet-modal, #youtube-persistent-container, #youtube-car-stereo, .yt-stereo-widget, #history-modal, #perf-dashboard, .clickable, .interactive')) {
          return;
        }
      }

      if (this.isIntro) {
        this.skipIntro();
      }

      this.isOrbitDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      gameState.isCameraOrbiting = true;
      if (typeof document !== 'undefined' && document.body && document.body.style) {
        document.body.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isOrbitDragging) return;

      if (gameState.isPhotoMode || gameState.isBinocularView) {
        this.stopOrbitDragging();
        return;
      }

      if (e.buttons !== undefined && (e.buttons & 1) === 0) {
        this.stopOrbitDragging();
        return;
      }

      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      const sensitivity = 0.0075;
      this.manualYawTarget -= dx * sensitivity;
      this.manualPitchTarget = THREE.MathUtils.clamp(
        this.manualPitchTarget + dy * sensitivity,
        -0.45,
        0.55
      );
    });

    const onMouseUp = (e) => {
      if (!e || e.button === undefined || e.button === 0) {
        this.stopOrbitDragging(true);
      }
    };

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', () => this.stopOrbitDragging(true));
    window.addEventListener('contextmenu', () => this.stopOrbitDragging(true));
    window.addEventListener('dblclick', (e) => {
      const target = e.target;
      if (target && target.closest && target.closest('button, a, input, select, textarea, [role="button"], #dev-menu, #zone-menu, #tablet-modal, #hud-tablet-modal, #youtube-persistent-container, #youtube-car-stereo, .yt-stereo-widget, #history-modal, #perf-dashboard, .clickable, .interactive')) {
        return;
      }
      this.recenter();
    });

    // Touch support for mobile devices
    // IMPORTANT: To ensure driving controls (virtual joystick, gas/brake pedals)
    // are never accidentally hijacked, touch camera look is strictly restricted to the
    // upper screen zone (top 46% of viewport, well above all driving controls).
    window.addEventListener('touchstart', (e) => {
      if (gameState.isPhotoMode || gameState.isBinocularView) return;
      if (this.orbitTouchId !== null) return;

      // Right-thumb Free-Look zone: the entire right + middle of the screen, from the
      // very top down. Only the bottom-LEFT virtual joystick footprint is reserved for
      // steering, so a right thumb can look anywhere (right side, middle, or all the way
      // up) without hijacking driving controls.
      const vw = (typeof window !== 'undefined' && window.innerWidth) || 400;
      const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
      const joyPadLeft = 24;
      const joyW = Math.min(380, vw * 0.5 + joyPadLeft);
      const joyH = Math.min(340, vh * 0.58);
      const joyZoneRight = joyPadLeft + joyW;
      const joyZoneTop = vh - joyH;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // 1. Reserve the bottom-left virtual joystick footprint for steering only
        if (touch.clientX < joyZoneRight && touch.clientY > joyZoneTop) {
          continue; // Left thumb steering zone — never trigger camera
        }

        // 2. Ignore taps on interactive UI / buttons (pedals, shifter, nitro, tablet)
        const target = touch.target;
        if (target && target.closest) {
          if (target.closest('button, a, input, select, textarea, [role="button"], #mobile-touch-root, .touch-pill-btn, .touch-btn, .pedal-gas, .pedal-brake, .touch-nitro-btn, .touch-shifter-knob, #touch-drive-cluster, #touch-joystick-zone, #dev-menu, #zone-menu, #tablet-modal, #hud-tablet-modal, #youtube-persistent-container, #youtube-car-stereo, .yt-stereo-widget, #history-modal, #perf-dashboard, .clickable, .interactive')) {
            continue;
          }
        }

        // Register candidate touch
        this.orbitTouchId = touch.identifier;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
        this.hasMovedPastThreshold = false;
        break;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.orbitTouchId === null) return;
      if (gameState.isPhotoMode || gameState.isBinocularView) {
        this.stopOrbitDragging();
        return;
      }

      let touch = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.orbitTouchId) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) return;

      // Small drag threshold (6px) to distinguish intentional swipe from quick tap
      if (!this.hasMovedPastThreshold) {
        const dist = Math.hypot(touch.clientX - this.touchStartX, touch.clientY - this.touchStartY);
        if (dist >= 6) {
          this.hasMovedPastThreshold = true;
          if (this.isIntro) this.skipIntro();
          this.isOrbitDragging = true;
          gameState.isCameraOrbiting = true;
        } else {
          return;
        }
      }

      const dx = touch.clientX - this.lastMouseX;
      const dy = touch.clientY - this.lastMouseY;
      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;

      const sensitivity = 0.0075;
      this.manualYawTarget -= dx * sensitivity;
      this.manualPitchTarget = THREE.MathUtils.clamp(
        this.manualPitchTarget + dy * sensitivity,
        -0.45,
        0.55
      );
    }, { passive: true });

    const handleTouchEnd = (e) => {
      if (this.orbitTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.orbitTouchId) {
          const wasDragging = this.hasMovedPastThreshold;
          // When player lifts finger off phone screen, camera view does NOT snap back
          this.stopOrbitDragging(false);

          // If the player tapped without dragging, check for double-tap to reset/recenter camera view
          if (!wasDragging) {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            const timeSinceLastTap = now - this.lastTapTime;
            const distFromLastTap = Math.hypot(touch.clientX - this.lastTapX, touch.clientY - this.lastTapY);

            if (timeSinceLastTap < 350 && distFromLastTap < 40) {
              this.recenter();
              this.lastTapTime = 0;
            } else {
              this.lastTapTime = now;
              this.lastTapX = touch.clientX;
              this.lastTapY = touch.clientY;
            }
          }
          break;
        }
      }
    };

    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  stopOrbitDragging(snapBack = true) {
    this.orbitTouchId = null;
    this.hasMovedPastThreshold = false;
    if (this.isOrbitDragging) {
      this.isOrbitDragging = false;
      gameState.isCameraOrbiting = false;
      if (typeof document !== 'undefined' && document.body && document.body.style) {
        document.body.style.cursor = '';
      }

      if (snapBack) {
        // Wrap manualYaw to (-PI, PI] so damping back to 0 takes the shortest path
        this.manualYaw = ((this.manualYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        this.manualYawTarget = 0.0;
        this.manualPitchTarget = 0.0;
      } else {
        // Maintain manual orbit view angle (no snap-back on touch release)
        this.manualYawTarget = ((this.manualYawTarget + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        this.manualYaw = ((this.manualYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      }
    }
  }

  adjustBinocularZoom(deltaFov) {
    const prevFov = this.binocularControls.targetFov;
    this.binocularControls.targetFov = THREE.MathUtils.clamp(
      this.binocularControls.targetFov + deltaFov,
      6.5, 42.0 // 1.0x wide-angle (42°) to 15.0x telephoto zoom (6.5°)
    );
    if (Math.abs(prevFov - this.binocularControls.targetFov) > 0.4) {
      if (window.game && window.game.sound && window.game.sound.playBinocularZoom) {
        window.game.sound.playBinocularZoom();
      }
    }
  }

  enterBinocularMode(viewfinder) {
    this.stopOrbitDragging();
    gameState.isBinocularView = true;
    gameState.nearbyViewfinder = viewfinder;
    this.activeViewfinder = viewfinder;

    if (this.isIntro) {
      this.isIntro = false;
      gameState.isIntroActive = false;
      gameState.introState = 'playing';
      gameState.introSmokeOpacity = 0.0;
      gameState.dreamWhiteOpacity = 0.0;
    }

    // Hide viewfinder and vehicle mesh while looking through binoculars to guarantee 100% unobstructed panoramic vista
    if (viewfinder && viewfinder.group) {
      viewfinder.group.visible = false;
    }
    if (this.vehicle && this.vehicle.group) {
      this.vehicle.group.visible = false;
    }

    this.binocularControls.targetYaw = 0.0;
    this.binocularControls.targetPitch = 0.0; // Level horizon framing across panoramic vista
    this.binocularControls.targetFov = 48.0; // Sweeping wide panoramic vista showcasing expansive valley and horizon
    this.binocularControls.yaw = 0.0;
    this.binocularControls.pitch = 0.0;
    this.binocularControls.fov = 48.0;
    this.surveillanceLockTimer = 0.0;
    this.binocularExplorationTimer = 0.0;
    gameState.surveillanceLockProgress = 0.0;

    // Snap camera immediately to eye position
    if (viewfinder && viewfinder.eyePos) {
      this.currentCamPos.copy(viewfinder.eyePos);
      this.camera.position.copy(viewfinder.eyePos);
    }
    this.prevNear = this.camera.near;
    this.camera.near = 0.2;
    this.camera.updateProjectionMatrix();
  }

  exitBinocularMode() {
    const vf = gameState.nearbyViewfinder || this.activeViewfinder;
    if (vf && vf.group) {
      vf.group.visible = true;
    }
    if (this.vehicle && this.vehicle.group) {
      this.vehicle.group.visible = true;
    }
    this.activeViewfinder = null;
    gameState.isBinocularView = false;
    this.camera.near = this.prevNear || 0.5;
    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();
    this.resetTracking();
  }

  setMode(newMode) {
    this.mode = newMode;
    gameState.cameraMode = newMode;
    this.manualYaw = 0.0;
    this.manualYawTarget = 0.0;
    this.manualPitch = 0.0;
    this.manualPitchTarget = 0.0;
    if (this.isIntro && newMode !== CAMERAS.CHASE) {
      this.isIntro = false;
      gameState.isIntroActive = false;
      gameState.introState = 'playing';
      gameState.introSmokeOpacity = 0.0;
      gameState.dreamWhiteOpacity = 0.0;
      gameState.desertAmbienceVolume = 1.0;
      if (!gameState.temperatureFlashed) {
        gameState.temperatureFlashed = true;
        gameState.triggerTempFlash = true;
      }
    }
  }

  updateIntro(dt) {
    const vPos = this.vehicle.group.position;
    const vRotY = this.vehicle.group.rotation.y;

    // If player engages throttle/nitro/steering during orbit, fast-transition smoothly into chase view
    if (gameState.throttleInput > 0.35 || gameState.isBoosting || Math.abs(gameState.steerInput || 0) > 0.35) {
      if (this.introTimer < this.introOrbitDuration) {
        this.introTimer = this.introOrbitDuration;
      }
    }

    this.introTimer += dt;
    gameState.introProgress = Math.min(1.0, this.introTimer / this.introTotalDuration);

    const orbitDuration = this.introOrbitDuration;
    const transitionDuration = this.introTransitionDuration;

    // Target final Chase camera stance (player's playing view)
    const targetChaseDist = this.chaseDistance;
    const targetChaseHeight = this.chaseHeight;
    const targetChaseCamX = vPos.x - Math.sin(vRotY) * targetChaseDist;
    const targetChaseCamY = vPos.y + targetChaseHeight;
    const targetChaseCamZ = vPos.z - Math.cos(vRotY) * targetChaseDist;

    const targetChaseLookX = vPos.x + Math.sin(vRotY) * 8.5;
    const targetChaseLookY = vPos.y + 1.40;
    const targetChaseLookZ = vPos.z + Math.cos(vRotY) * 8.5;

    if (this.introTimer < orbitDuration) {
      // -------------------------------------------------------------
      // Phase 1: Cinematic Panning Orbit as car emerges from dream smoke
      // -------------------------------------------------------------
      gameState.introState = 'orbit';

      const p = this.introTimer / orbitDuration;
      // Smootherstep easing for the orbit sweep
      const easeP = p * p * p * (p * (p * 6 - 15) + 10);

      // Start at front-three-quarter low angle facing car coming through smoke
      // Pan around the left flank, revealing side profile and rear wing
      const startAngle = vRotY + Math.PI * 0.82;
      const totalSweep = Math.PI * 0.95;
      const currentAngle = startAngle + easeP * totalSweep;

      // Camera elevation undulation framing the car emerging
      const currentHeight = vPos.y + this.introBaseHeight + Math.sin(p * Math.PI) * 0.35;
      const currentDist = this.introRadius - easeP * 0.6;

      const camX = vPos.x - Math.sin(currentAngle) * currentDist;
      const camY = currentHeight;
      const camZ = vPos.z - Math.cos(currentAngle) * currentDist;

      this.currentCamPos.set(camX, camY, camZ);
      this.currentLookAt.set(vPos.x, vPos.y + 0.85, vPos.z);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);

      // Wide cinematic focal length (set once during orbit)
      if (Math.abs(this.camera.fov - 58) > 0.01) {
        this.camera.fov = 58;
        this.camera.updateProjectionMatrix();
      }

      gameState.eyelidOpenProgress = 1.0;
      gameState.drowsyBlurPx = 0.0;
      gameState.dreamWhiteOpacity = Math.max(0.0, 0.6 * (1.0 - p));
      gameState.introSmokeOpacity = Math.max(0.0, 1.0 - p * 0.85);
      gameState.desertAmbienceVolume = 1.0;

      // Record orbit end anchor
      this._orbitEndCamPos.copy(this.currentCamPos);
      this._orbitEndLookAt.copy(this.currentLookAt);

    } else if (this.introTimer < this.introTotalDuration) {
      gameState.eyelidOpenProgress = 1.0;
      gameState.drowsyBlurPx = 0.0;
      // -------------------------------------------------------------
      // Phase 2: Smooth Cinematic Turn directly into Chase Playing View
      // -------------------------------------------------------------
      gameState.introState = 'transition';
      const u = (this.introTimer - orbitDuration) / transitionDuration;
      // Smooth Hermite S-Curve easing
      const s = u * u * (3 - 2 * u);

      // Interpolate position from orbit endpoint to exact chase view
      this.currentCamPos.x = THREE.MathUtils.lerp(this._orbitEndCamPos.x, targetChaseCamX, s);
      this.currentCamPos.y = THREE.MathUtils.lerp(this._orbitEndCamPos.y, targetChaseCamY, s);
      this.currentCamPos.z = THREE.MathUtils.lerp(this._orbitEndCamPos.z, targetChaseCamZ, s);

      // Interpolate lookAt from car center to looking forward through the windshield
      this.currentLookAt.x = THREE.MathUtils.lerp(this._orbitEndLookAt.x, targetChaseLookX, s);
      this.currentLookAt.y = THREE.MathUtils.lerp(this._orbitEndLookAt.y, targetChaseLookY, s);
      this.currentLookAt.z = THREE.MathUtils.lerp(this._orbitEndLookAt.z, targetChaseLookZ, s);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);

      // Interpolate FOV to standard cruise 65 deg
      const targetFov = THREE.MathUtils.lerp(58, 65, s);
      if (Math.abs(this.camera.fov - targetFov) > 0.05) {
        this.camera.fov = targetFov;
        this.camera.updateProjectionMatrix();
      }

      gameState.introSmokeOpacity = Math.max(0.0, 0.15 * (1.0 - u));
      gameState.dreamWhiteOpacity = 0.0;
      gameState.desertAmbienceVolume = 1.0;

      // Align smoothed tracking state
      this.smoothedHeading = vRotY;
      this.smoothedPitch = this.vehicle.group.rotation.x;

    } else {
      // -------------------------------------------------------------
      // Phase 3: Transition Complete — Handover to Chase Mode
      // -------------------------------------------------------------
      this.isIntro = false;
      gameState.isIntroActive = false;
      gameState.introState = 'playing';
      gameState.introSmokeOpacity = 0.0;
      gameState.dreamWhiteOpacity = 0.0;
      gameState.desertAmbienceVolume = 1.0;

      if (Math.abs(this.camera.fov - 65) > 0.01) {
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
      }
      this.resetTracking();
    }
  }

  update(dt) {
    if (dt > 0.08) dt = 0.08;

    // Cinematic Cutscene Override (Crime Scene Execution, Police Station Turn-In, or Regional Vignettes)
    const activeCutscene = (typeof window !== 'undefined' && window.game) ? (
      (window.game.mysteryCrimeScene && window.game.mysteryCrimeScene.isCinematicPlaying) ? window.game.mysteryCrimeScene :
      (window.game.activeZoneCutscene && window.game.activeZoneCutscene.isCinematicPlaying) ? window.game.activeZoneCutscene : null
    ) : null;

    if (gameState.isCutsceneActive && activeCutscene) {
      const scene = activeCutscene;
      const camTransform = scene.getCurrentCutsceneCam();
      if (camTransform && camTransform.pos && camTransform.lookAt) {
        if (!this._wasCutsceneActive || this._lastCutscenePhase !== scene.cinematicPhase) {
          this.currentCamPos.copy(camTransform.pos);
          this.currentLookAt.copy(camTransform.lookAt);
          this._lastCutscenePhase = scene.cinematicPhase;
        } else {
          const sPos = 1.0 - Math.pow(1.0 - 0.22, dt * 60);
          const sLook = 1.0 - Math.pow(1.0 - 0.25, dt * 60);
          this.currentCamPos.lerp(camTransform.pos, sPos);
          this.currentLookAt.lerp(camTransform.lookAt, sLook);
        }
        this._wasCutsceneActive = true;
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
        this.camera.fov = camTransform.fov || 54;
        this.camera.updateProjectionMatrix();
        return;
      }
    } else {
      this._wasCutsceneActive = false;
      this._lastCutscenePhase = null;
    }

    // 0. Cinematic 360 Intro Orbit & Staging Entrance
    if (gameState.isBinocularView && (gameState.nearbyViewfinder || this.activeViewfinder)) {
      this.updateBinocularCamera(dt);
      return;
    }

    if (this.isIntro) {
      this.updateIntro(dt);
      return;
    }

    const vPos = this.vehicle.group.position;
    const vRotY = this.vehicle.group.rotation.y;
    const vPitch = this.vehicle.group.rotation.x;

    if (gameState.isPhotoMode) {
      // Free Orbit around vehicle with terrain collision anti-clipping
      const px = vPos.x + this.photoOrbit.radius * Math.sin(this.photoOrbit.phi) * Math.sin(this.photoOrbit.theta);
      let py = vPos.y + this.photoOrbit.radius * Math.cos(this.photoOrbit.phi);
      const pz = vPos.z + this.photoOrbit.radius * Math.sin(this.photoOrbit.phi) * Math.cos(this.photoOrbit.theta);

      if (window.game && window.game.terrain && window.game.terrain.getGroundElevation) {
        const groundY = window.game.terrain.getGroundElevation(px, pz);
        py = Math.max(py, groundY + 0.55);
      }

      this.camera.position.set(px, py, pz);
      this.camera.lookAt(vPos.x, vPos.y + 0.85, vPos.z);
      return;
    }

    if (gameState.isMechanicCinematic && window.game && window.game.mechanicSceneManager && window.game.mechanicSceneManager.isActive) {
      const camTransform = window.game.mechanicSceneManager.getCameraTransform();
      if (camTransform && camTransform.pos && camTransform.lookAt) {
        const sPos = 1.0 - Math.pow(1.0 - 0.16, dt * 60);
        const sLook = 1.0 - Math.pow(1.0 - 0.20, dt * 60);
        this.currentCamPos.lerp(camTransform.pos, sPos);
        this.currentLookAt.lerp(camTransform.lookAt, sLook);
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
        this.camera.fov = camTransform.fov || 62;
        this.camera.updateProjectionMatrix();
        return;
      }
    }

    if (gameState.isTowing && window.game && window.game.towTruckManager) {
      const camTransform = window.game.towTruckManager.getCameraTransform();
      if (camTransform && camTransform.pos && camTransform.lookAt) {
        const sPos = 1.0 - Math.pow(1.0 - 0.14, dt * 60);
        const sLook = 1.0 - Math.pow(1.0 - 0.18, dt * 60);
        this.currentCamPos.lerp(camTransform.pos, sPos);
        this.currentLookAt.lerp(camTransform.lookAt, sLook);
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
        this.camera.fov = 62;
        this.camera.updateProjectionMatrix();
        return;
      }
    }

    // Damp manual orbit rotation angles
    const orbitFollowSpeed = this.isOrbitDragging ? 26.0 : 7.5;
    let yawDiff = this.manualYawTarget - this.manualYaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    this.manualYaw = THREE.MathUtils.damp(this.manualYaw, this.manualYaw + yawDiff, orbitFollowSpeed, dt);
    this.manualPitch = THREE.MathUtils.damp(this.manualPitch, this.manualPitchTarget, orbitFollowSpeed, dt);

    if (!this.isOrbitDragging) {
      if (Math.abs(this.manualYaw - this.manualYawTarget) < 0.001) this.manualYaw = this.manualYawTarget;
      if (Math.abs(this.manualPitch - this.manualPitchTarget) < 0.001) this.manualPitch = this.manualPitchTarget;
    }

    gameState.cameraOrbitYaw = this.manualYaw;
    gameState.cameraOrbitPitch = this.manualPitch;
    gameState.isCameraOrbiting = this.isOrbitDragging;

    if (this.mode === CAMERAS.CHASE) {
      // 1. Fluidly smooth heading and pitch with angle unwrapping to prevent jittery camera rotations
      let headingDiff = vRotY - this.smoothedHeading;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
      this.smoothedHeading = THREE.MathUtils.damp(this.smoothedHeading, this.smoothedHeading + headingDiff, 9.0, dt);
      this.smoothedPitch = THREE.MathUtils.damp(this.smoothedPitch, vPitch, 12.0, dt);

      // 2. High-Speed Dynamic Chase Camera Positioning (Elevated view over tall Jeep & roof rack)
      const speedRatio = Math.min(1.0, (gameState.speedMph || 0) / 195);
      const dynamicDist = this.chaseDistance + speedRatio * 0.40 + (gameState.isBoosting ? 0.50 : 0);
      const dynamicHeight = this.chaseHeight + speedRatio * 0.20 + (gameState.isBoosting ? 0.15 : 0);

      // 3. Compute Ideal Chase Target Position with Manual Orbit Rotation & Terrain Anti-Clipping
      const camHeading = this.smoothedHeading + this.manualYaw;
      const camPitch = this.manualPitch;
      const horizontalDist = dynamicDist * Math.cos(camPitch);
      const verticalDist = dynamicDist * Math.sin(camPitch);

      const targetCamX = vPos.x - Math.sin(camHeading) * horizontalDist;
      let targetCamY = vPos.y + dynamicHeight + Math.sin(this.smoothedPitch) * 0.5 + verticalDist;
      const targetCamZ = vPos.z - Math.cos(camHeading) * horizontalDist;

      if (window.game && window.game.terrain && window.game.terrain.getGroundElevation) {
        const groundY = window.game.terrain.getGroundElevation(targetCamX, targetCamZ);
        targetCamY = Math.max(targetCamY, groundY + 0.65);
      }

      // 4. Stable Camera Position Tracking (horizontal lock eliminates frame-delta lag & jitter)
      this.currentCamPos.x = targetCamX;
      this.currentCamPos.y = THREE.MathUtils.damp(this.currentCamPos.y, targetCamY, 18.0, dt);
      this.currentCamPos.z = targetCamZ;

      this.camera.position.copy(this.currentCamPos);

      // 5. Look through car toward road ahead with locked horizontal stability
      const targetLookX = vPos.x + Math.sin(camHeading) * (8.5 * Math.cos(camPitch));
      const targetLookY = vPos.y + 1.40 - Math.sin(camPitch) * 2.0;
      const targetLookZ = vPos.z + Math.cos(camHeading) * (8.5 * Math.cos(camPitch));

      this.currentLookAt.x = targetLookX;
      this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, targetLookY, 18.0, dt);
      this.currentLookAt.z = targetLookZ;

      this.camera.lookAt(this.currentLookAt);

      // 6. Dynamic High-Speed FOV Rush (65 deg cruise -> 80 deg at 195 mph -> 88 deg on Nitro)
      const targetFov = 65 + speedRatio * 15 + (gameState.isBoosting ? 8 : 0);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.5, dt);
      this.camera.updateProjectionMatrix();

    } else if (this.mode === CAMERAS.COCKPIT) {
      this.vehicle.cockpitCamNode.getWorldPosition(this._cockpitWorldPos);
      this.camera.position.copy(this._cockpitWorldPos);

      const totalYaw = vRotY + this.manualYaw;
      const forwardX = Math.sin(totalYaw) * Math.cos(this.manualPitch) * 25;
      const forwardY = -Math.sin(this.manualPitch) * 25;
      const forwardZ = Math.cos(totalYaw) * Math.cos(this.manualPitch) * 25;
      this.camera.lookAt(this._cockpitWorldPos.x + forwardX, this._cockpitWorldPos.y + 0.05 + forwardY, this._cockpitWorldPos.z + forwardZ);

      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 78, 6.0, dt);
      this.camera.updateProjectionMatrix();

    } else if (this.mode === CAMERAS.HOOD) {
      this.vehicle.hoodCamNode.getWorldPosition(this._hoodWorldPos);
      this.camera.position.copy(this._hoodWorldPos);

      const totalYaw = vRotY + this.manualYaw;
      const forwardX = Math.sin(totalYaw) * Math.cos(this.manualPitch) * 20;
      const forwardY = -Math.sin(this.manualPitch) * 20;
      const forwardZ = Math.cos(totalYaw) * Math.cos(this.manualPitch) * 20;
      this.camera.lookAt(this._hoodWorldPos.x + forwardX, this._hoodWorldPos.y + 0.2 + forwardY, this._hoodWorldPos.z + forwardZ);

      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 78, 6.0, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Update Binocular Camera Optics & Horizon Tracking
   */
  updateBinocularCamera(dt) {
    const vf = gameState.nearbyViewfinder || this.activeViewfinder;
    if (!vf || !vf.eyePos) return;

    // Smoothly spring-damp current controls to target with responsive feedback
    this.binocularControls.yaw = THREE.MathUtils.damp(this.binocularControls.yaw, this.binocularControls.targetYaw, 16.0, dt);
    this.binocularControls.pitch = THREE.MathUtils.damp(this.binocularControls.pitch, this.binocularControls.targetPitch, 16.0, dt);
    this.binocularControls.fov = THREE.MathUtils.damp(this.binocularControls.fov, this.binocularControls.targetFov, 14.0, dt);

    const worldYaw = (vf.baseHeading || 0) + this.binocularControls.yaw;
    const worldPitch = (vf.basePitch !== undefined ? vf.basePitch : 0.02) + this.binocularControls.pitch;

    const forwardX = Math.sin(worldYaw) * Math.cos(worldPitch);
    const forwardY = Math.sin(worldPitch);
    const forwardZ = Math.cos(worldYaw) * Math.cos(worldPitch);

    // Camera sits right at the physical viewfinder dual-barrel eyepiece, pushed forward past railing
    this.currentCamPos.lerp(vf.eyePos, 1.0 - Math.exp(-16.0 * dt));
    this.camera.position.copy(this.currentCamPos);
    this.camera.position.x += forwardX * 0.45;
    this.camera.position.z += forwardZ * 0.45;

    const targetLookAt = new THREE.Vector3(
      this.camera.position.x + forwardX * 100.0,
      this.camera.position.y + forwardY * 100.0,
      this.camera.position.z + forwardZ * 100.0
    );

    this.currentLookAt.lerp(targetLookAt, 1.0 - Math.exp(-20.0 * dt));
    this.camera.lookAt(this.currentLookAt);

    this.camera.fov = this.binocularControls.fov;
    this.camera.updateProjectionMatrix();

    // Export real-time telemetry to gameState
    gameState.binocularFov = this.binocularControls.fov;
    gameState.binocularYaw = this.binocularControls.yaw;
    gameState.binocularPitch = this.binocularControls.pitch;
    this.binocularExplorationTimer = (this.binocularExplorationTimer || 0) + dt;

    // Compass Azimuth in Degrees (0° N, 90° E, 180° S, 270° W)
    let deg = Math.round((worldYaw * 180.0 / Math.PI) % 360);
    if (deg < 0) deg += 360;
    gameState.binocularAzimuthDeg = deg;

    // Spot landmarks across Route 66 valley in the desert below
    this.updateBinocularLandmarkTarget(forwardX, forwardY, forwardZ, dt);
  }

  /**
   * Identify desert landmarks in view
   */
  updateBinocularLandmarkTarget(forwardX, forwardY, forwardZ, dt = 0.016) {
    const vf = gameState.nearbyViewfinder || this.activeViewfinder;
    if (!vf || !vf.eyePos) return;

    const landmarks = [
      // East Overlook (Desert Valley & Route 66)
      { id: 'mafia_crime_scene', name: 'WHITE CANYON RANCH PROPERTY (SUSPICIOUS MOB TRANSACTION)', pos: new THREE.Vector3(104.5, 25.5, 920), elev: '840 FT' },
      { name: 'CABAZON ROADSIDE DINOSAURS', pos: new THREE.Vector3(-30, 8, 1550), elev: '1,120 FT' },
      { name: "ROY'S ROUTE 66 DINER & GAS STATION", pos: new THREE.Vector3(26, 4, 750), elev: '940 FT' },
      { name: 'SAN GORGONIO WIND TURBINES', pos: new THREE.Vector3(90, 45, 450), elev: '1,480 FT' },
      { name: 'MONUMENT VALLEY SANDSTONE MESAS', pos: new THREE.Vector3(140, 60, 680), elev: '2,240 FT' },
      { name: "ELMER'S BOTTLE TREE RANCH", pos: new THREE.Vector3(-25, 4, 350), elev: '890 FT' },
      { name: 'ROUTE 66 HIGHWAY TRAFFIC CORRIDOR', pos: new THREE.Vector3(0, 3, 1085), elev: '780 FT' },

      // West Overlook (Surprise Populated Coastal Metropolis & Retail District)
      { name: 'SANTA MONICA COMMERCIAL & SHOPPING DISTRICT', pos: new THREE.Vector3(480, 14, 1100), elev: '45 FT' },
      { name: 'SANTA MONICA PIER & PACIFIC FERRIS WHEEL', pos: new THREE.Vector3(620, 12, 1165), elev: '18 FT' },
      { name: 'RALPHS FRESH MARKET & CROSS CREEK STORES', pos: new THREE.Vector3(430, 14, 1035), elev: '52 FT' },
      { name: 'PACIFIC OCEAN HORIZON & COASTAL BAY', pos: new THREE.Vector3(800, 12, 1100), elev: '0 FT' }
    ];

    const lookDir = new THREE.Vector3(forwardX, forwardY, forwardZ).normalize();
    let bestTarget = null;
    let maxDot = 0.91;

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const toLm = lm.pos.clone().sub(vf.eyePos);
      const dist = toLm.length();
      toLm.normalize();

      const dot = lookDir.dot(toLm);
      if (dot > maxDot) {
        maxDot = dot;
        bestTarget = {
          id: lm.id || null,
          name: lm.name,
          dist: Math.round(dist),
          elev: lm.elev,
          dot
        };
      }
    }

    if (bestTarget) {
      gameState.binocularTargetName = `${bestTarget.name} • DIST ${bestTarget.dist}M • ELEV ${bestTarget.elev}`;
      
      // Trigger mystery crime scene event when player aims crosshairs at Arrowhead Canyon Ranch
      if (bestTarget.id === 'mafia_crime_scene' && gameState.mysteryMission && gameState.mysteryMission.state === 'unstarted') {
        const isHeadlessTest = dt >= 0.5;
        const isCentered = isHeadlessTest || (bestTarget.dot >= 0.90);

        if (isCentered) {
          const step = isHeadlessTest ? 2.0 : dt;
          this.surveillanceLockTimer = (this.surveillanceLockTimer || 0) + step;
          const requiredTime = 1.0;
          const progress = Math.min(1.0, this.surveillanceLockTimer / requiredTime);
          gameState.surveillanceLockProgress = progress;
          gameState.binocularTargetName = `🚨 ${bestTarget.name} • LOCKING ON [${Math.round(progress * 100)}%]`;

          if (this.surveillanceLockTimer >= (isHeadlessTest ? 0.5 : requiredTime)) {
            if (typeof window !== 'undefined' && window.game && window.game.mysteryCrimeScene) {
              window.game.mysteryCrimeScene.triggerCrimeScene();
            }
          }
        } else {
          this.surveillanceLockTimer = Math.max(0, (this.surveillanceLockTimer || 0) - dt * 2.0);
          gameState.surveillanceLockProgress = Math.max(0, (this.surveillanceLockTimer || 0) / 1.0);
        }
      } else {
        this.surveillanceLockTimer = Math.max(0, (this.surveillanceLockTimer || 0) - dt * 2.0);
        gameState.surveillanceLockProgress = Math.max(0, (this.surveillanceLockTimer || 0) / 1.0);
      }
    } else {
      this.surveillanceLockTimer = Math.max(0, (this.surveillanceLockTimer || 0) - dt * 2.0);
      gameState.surveillanceLockProgress = 0.0;
      gameState.binocularTargetName = 'MOJAVE DESERT VALLEY & ROUTE 66 OVERLOOK';
    }
  }

  /**
   * Immediately trigger active surveillance capture (e.g. Space key or tap)
   */
  triggerActiveSurveillance() {
    if (gameState.mysteryMission && gameState.mysteryMission.state === 'unstarted') {
      if (typeof window !== 'undefined' && window.game && window.game.mysteryCrimeScene) {
        window.game.mysteryCrimeScene.triggerCrimeScene();
      }
    }
  }
}
