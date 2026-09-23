import nipplejs from 'nipplejs';
import { gameState } from '../state.js';
import { CAMERAS } from '../constants.js';

export class InputManager {
  constructor() {
    this.keys = {};
    this.gamepad = null;
    
    // Processed unified inputs
    this.steer = 0;
    this.throttle = 0;
    this.brake = 0;
    this.handbrake = false;
    this.nitro = false;

    // Mobile touch & NippleJS virtual joystick inputs
    this.touchJoystickSteer = 0;
    this.touchJoystickThrottle = 0;
    this.touchJoystickBrake = 0;
    this.joystickManager = null;
    this.touchSteerLeft = false;
    this.touchSteerRight = false;
    this.touchGas = false;
    this.touchBrake = false;
    this.touchNitro = false;
    
    this.onCameraCycle = null;
    this.onPhotoModeToggle = null;
    this.onReset = null;
    this.onLiveryCycle = null;
    this.onRainToggle = null;

    this.setupKeyboard();
    this.setupGamepad();
    this.setupTouchControls();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // If typing in an input or textarea (e.g. YouTube search), ignore all game hotkeys
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (e.code === 'Escape') {
          e.target.blur();
          if (gameState.isTabletOpen && window.game && window.game.hud && window.game.hud.closeTablet) {
            window.game.hud.closeTablet();
          }
        }
        return;
      }

      this.keys[e.code] = true;

      // Skip intro or confirm resume when player actively presses driving keys
      if (['KeyW', 'ArrowUp', 'Space', 'Enter', 'KeyS', 'ArrowDown'].includes(e.code)) {
        if (window.game && window.game.hud && window.game.hud.isResumePromptActive) {
          const btnCont = document.getElementById('btn-resume-continue');
          if (btnCont) {
            btnCont.click();
            return;
          }
        }
        if (gameState.isIntroActive) {
          const cm = this.cameraManager || (window.game && window.game.cameraManager);
          if (cm) cm.skipIntro();
        }
      }

      if (e.code === 'KeyM' || e.code === 'KeyZ') {
        if (window.game && window.game.hud) {
          if (window.game.hud.toggleDevMenu) {
            window.game.hud.toggleDevMenu();
          } else if (window.game.hud.toggleZoneMenu) {
            window.game.hud.toggleZoneMenu();
          }
        }
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        if (gameState.isMechanicCinematic && window.game && window.game.mechanicSceneManager) {
          window.game.mechanicSceneManager.skipCinematic();
        } else if (gameState.isTowing && window.game && window.game.towTruckManager) {
          window.game.towTruckManager.skipCinematic();
        } else if (gameState.isBinocularView && window.game && window.game.cameraManager && window.game.cameraManager.triggerActiveSurveillance) {
          window.game.cameraManager.triggerActiveSurveillance();
        }
      }
      if (e.code === 'Tab' || e.code === 'KeyT') {
        e.preventDefault();
        if (gameState.isMechanicCinematic && window.game && window.game.mechanicSceneManager) {
          window.game.mechanicSceneManager.skipCinematic();
        } else if (gameState.isTowing && window.game && window.game.towTruckManager) {
          window.game.towTruckManager.skipCinematic();
        } else if (window.game && window.game.hud && window.game.hud.toggleTablet) {
          window.game.hud.toggleTablet();
        }
      }
      if (e.code === 'KeyE') {
        if (gameState.isBinocularView) {
          if (window.game && window.game.hud && window.game.hud.closeBinocularView) {
            window.game.hud.closeBinocularView();
          }
        } else if (gameState.nearbyViewfinder) {
          if (window.game && window.game.hud && window.game.hud.openBinocularView) {
            window.game.hud.openBinocularView();
          }
        } else if (window.game && window.game.hud && window.game.hud.toggleHistoryModal) {
          window.game.hud.toggleHistoryModal();
        }
      }
      if (e.code === 'Escape') {
        if (window.game && window.game.hud && window.game.hud.isResumePromptActive) {
          const btnCont = document.getElementById('btn-resume-continue');
          if (btnCont) {
            btnCont.click();
            return;
          }
        }
        if (gameState.isCutsceneActive) {
          if (window.game && window.game.activeZoneCutscene && window.game.activeZoneCutscene.isCinematicPlaying) {
            window.game.activeZoneCutscene.skipCutscene();
          } else if (window.game && window.game.mysteryCrimeScene) {
            window.game.mysteryCrimeScene.skipCutscene();
          }
        } else if (window.game && window.game.hud && window.game.hud.isTelemetryOpen) {
          window.game.hud.closeTelemetry();
        } else if (gameState.isBinocularView) {
          if (window.game && window.game.hud && window.game.hud.closeBinocularView) {
            window.game.hud.closeBinocularView();
          }
        } else if (gameState.isTabletOpen && window.game && window.game.hud && window.game.hud.closeTablet) {
          window.game.hud.closeTablet();
        } else if (gameState.isReadingHistory && window.game && window.game.hud) {
          window.game.hud.closeHistoryModal();
        } else if (gameState.isMechanicCinematic && window.game && window.game.mechanicSceneManager) {
          window.game.mechanicSceneManager.skipCinematic();
        } else if (gameState.isTowing && window.game && window.game.towTruckManager) {
          window.game.towTruckManager.skipCinematic();
        } else if (window.game && window.game.hud && window.game.hud.dismissTowPrompt) {
          window.game.hud.dismissTowPrompt();
        } else if (window.game && window.game.hud && window.game.hud.isPauseMenuOpen) {
          window.game.hud.closePauseMenu();
        } else if (window.game && window.game.hud && window.game.hud.openPauseMenu) {
          window.game.hud.openPauseMenu();
        }
      }
      if (gameState.isBinocularView && window.game && window.game.cameraManager) {
        const cm = window.game.cameraManager;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') cm.binocularControls.targetYaw = Math.min(Math.PI * 1.5, cm.binocularControls.targetYaw + 0.05);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') cm.binocularControls.targetYaw = Math.max(-Math.PI * 1.5, cm.binocularControls.targetYaw - 0.05);
        if (e.code === 'ArrowUp' || e.code === 'KeyW') cm.binocularControls.targetPitch = Math.min(0.35, cm.binocularControls.targetPitch + 0.04);
        if (e.code === 'ArrowDown' || e.code === 'KeyS') cm.binocularControls.targetPitch = Math.max(-0.65, cm.binocularControls.targetPitch - 0.04);
        if (e.code === 'Equal' || e.code === 'NumpadAdd' || e.code === 'PageUp') cm.adjustBinocularZoom(-3.0);
        if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.code === 'PageDown') cm.adjustBinocularZoom(3.0);
      }
      if (e.code === 'KeyF') {
        if (window.game && window.game.hud && window.game.hud.togglePerfDashboard) {
          window.game.hud.togglePerfDashboard();
        }
      }
      if (e.code === 'KeyH') {
        if (window.game && window.game.hud && window.game.hud.toggleUI) {
          window.game.hud.toggleUI();
        }
      }
      if (e.code === 'KeyB') {
        if (window.game && window.game.sound && window.game.sound.triggerJeepHorn) {
          window.game.sound.triggerJeepHorn();
        }
      }
      if (e.code === 'KeyC') {
        this.cycleCamera();
      }
      if (e.code === 'KeyP') {
        if (window.game && window.game.hud && window.game.hud.cycleQuality) {
          window.game.hud.cycleQuality();
        } else if (this.onPhotoModeToggle) {
          this.onPhotoModeToggle();
        }
      }
      if (e.code === 'KeyR') {
        if ((gameState.isOutOfBounds || gameState.isStuck) && this.onReset) {
          this.onReset();
        } else {
          this.cycleRainMode();
        }
      }
      if (e.code === 'KeyK' || e.code === 'Backspace') {
        if (this.onReset) this.onReset();
      }
      if (e.code === 'KeyL') {
        if (this.onLiveryCycle) this.onLiveryCycle();
      }
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        if (!gameState.isMechanicCinematic && !gameState.isTowing && !gameState.isTabletOpen && !gameState.isBinocularView) {
          const phys = (window.game && window.game.physics) || this.physics;
          if (phys && phys.setDriveMode) {
            phys.setDriveMode('LOW');
          }
        }
      }
      if (e.code === 'Digit2' || e.code === 'Numpad2') {
        if (!gameState.isMechanicCinematic && !gameState.isTowing && !gameState.isTabletOpen && !gameState.isBinocularView) {
          const phys = (window.game && window.game.physics) || this.physics;
          if (phys && phys.setDriveMode) {
            phys.setDriveMode('MID');
          }
        }
      }
      if (e.code === 'Digit3' || e.code === 'Numpad3') {
        if (!gameState.isMechanicCinematic && !gameState.isTowing && !gameState.isTabletOpen && !gameState.isBinocularView) {
          const phys = (window.game && window.game.physics) || this.physics;
          if (phys && phys.setDriveMode) {
            phys.setDriveMode('HIGH');
          }
        }
      }
      if (e.code === 'KeyX' || e.code === 'Digit4' || e.code === 'Space') {
        if (!gameState.isMechanicCinematic && !gameState.isTowing && !gameState.isTabletOpen && !gameState.isBinocularView) {
          const phys = (window.game && window.game.physics) || this.physics;
          if (phys) {
            if (gameState.isWrongGear && gameState.recommendedDriveMode && phys.setDriveMode) {
              // Direct smart shift to recommended gear when wrong gear alert is active
              phys.setDriveMode(gameState.recommendedDriveMode);
            } else if (phys.cycleDriveMode) {
              phys.cycleDriveMode();
            }
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      this.keys[e.code] = false;
    });
  }

  cycleRainMode() {
    const modes = ['auto', 'on', 'snow', 'off'];
    const curIdx = modes.indexOf(gameState.debugRainMode || 'auto');
    const nextIdx = (curIdx + 1) % modes.length;
    gameState.debugRainMode = modes[nextIdx];

    if (this.touchContainer) {
      const touchRain = this.touchContainer.querySelector('#touch-rain-btn');
      if (touchRain) {
        touchRain.textContent = gameState.debugRainMode === 'on' ? '🌧️ RAIN: ON' : (gameState.debugRainMode === 'snow' ? '❄️ SNOW: ON' : (gameState.debugRainMode === 'off' ? '☀️ WX: OFF' : '🌧️ WX: AUTO'));
      }
    }

    if (this.onRainToggle) this.onRainToggle(gameState.debugRainMode);
    console.log('🌧️ Weather Debug Mode:', gameState.debugRainMode.toUpperCase());
  }

  cycleCamera() {
    const modes = [CAMERAS.CHASE, CAMERAS.COCKPIT, CAMERAS.HOOD];
    const currentIndex = modes.indexOf(gameState.cameraMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    gameState.cameraMode = modes[nextIndex];
    if (this.onCameraCycle) this.onCameraCycle(gameState.cameraMode);
  }

  setupGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('🎮 Gamepad connected:', e.gamepad.id);
    });
  }

  setupTouchControls() {
    // Detect Touch Capability
    const isTouchSupported = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (isTouchSupported) {
      document.body.classList.add('has-touch-controls');
    }

    // Dynamic Touch Activation on First Touch Event
    const enableTouchMode = () => {
      document.body.classList.add('has-touch-controls');
      if (this.touchContainer) {
        this.touchContainer.classList.add('touch-enabled');
      }
    };
    window.addEventListener('touchstart', enableTouchMode, { once: true, passive: true });
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') enableTouchMode();
    }, { passive: true });

    // Create Touch UI Overlay Container
    this.touchContainer = document.createElement('div');
    this.touchContainer.id = 'mobile-touch-root';
    if (isTouchSupported) {
      this.touchContainer.classList.add('touch-enabled');
    }
    this.touchContainer.innerHTML = `
      <style>
        #mobile-touch-root {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          width: 100dvw;
          height: 100vh;
          height: 100dvh;
          pointer-events: none;
          z-index: 50;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
          display: block;
          box-sizing: border-box;
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        #mobile-touch-root.touch-visible {
          opacity: 1;
        }

        /* On desktop mouse/keyboard devices without touch enabled, hide virtual joystick and pedals while keeping shifter knob */
        @media (hover: hover) and (pointer: fine) {
          #mobile-touch-root:not(.touch-enabled) #touch-joystick-zone,
          #mobile-touch-root:not(.touch-enabled) .pedal-gas,
          #mobile-touch-root:not(.touch-enabled) .pedal-brake,
          #mobile-touch-root:not(.touch-enabled) .touch-nitro-btn {
            display: none !important;
          }
        }

        .touch-pill-btn {
          background: rgba(15, 23, 42, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 20px;
          padding: 8px 14px;
          color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: transform 0.1s, background 0.15s;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        }

        .touch-pill-btn:active {
          transform: scale(0.92);
          background: rgba(56, 189, 248, 0.35);
          border-color: #38bdf8;
        }

        /* Left Virtual Joystick Area (Powered by NippleJS) */
        #touch-joystick-zone {
          position: absolute;
          bottom: 0;
          left: max(24px, calc(env(safe-area-inset-left, 0px) + 20px));
          width: min(380px, 50vw);
          height: min(340px, 58vh);
          pointer-events: auto;
          touch-action: none;
          z-index: 15;
        }

        .joystick-resting-anchor {
          position: absolute;
          bottom: max(28px, calc(env(safe-area-inset-bottom, 0px) + 24px));
          left: max(56px, calc(env(safe-area-inset-left, 0px) + 52px));
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 2px dashed rgba(56, 189, 248, 0.45);
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #7dd3fc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
        }

        .joystick-resting-anchor svg {
          width: 24px;
          height: 24px;
          fill: #38bdf8;
          margin-bottom: 2px;
          filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.6));
        }

        #touch-joystick-zone.active .joystick-resting-anchor {
          opacity: 0;
          transform: scale(0.85);
        }

        /* NippleJS Neon Hologram Joystick Elements */
        .nipple {
          position: absolute;
          opacity: 0.95;
          transition: opacity 0.2s ease-out;
          pointer-events: none;
          z-index: 20;
        }
        .nipple .back {
          background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.08) 65%, rgba(2, 132, 199, 0.45) 100%) !important;
          border: 2.5px solid rgba(56, 189, 248, 0.9) !important;
          box-shadow: 0 0 28px rgba(56, 189, 248, 0.55), inset 0 0 18px rgba(56, 189, 248, 0.3) !important;
          backdrop-filter: blur(10px);
        }
        .nipple .front {
          background: radial-gradient(circle, #ffffff 0%, #38bdf8 65%, #0284c7 100%) !important;
          border: 2px solid #ffffff !important;
          box-shadow: 0 0 22px rgba(56, 189, 248, 0.95), inset 0 0 10px #ffffff !important;
        }

        /* Right Action / Skeuomorphic Pedals Cluster */
        .touch-action-cluster {
          position: absolute;
          bottom: max(20px, calc(env(safe-area-inset-bottom, 0px) + 16px));
          right: max(20px, calc(env(safe-area-inset-right, 0px) + 18px));
          display: flex;
          align-items: flex-end;
          gap: 14px;
          pointer-events: auto;
          touch-action: none;
          z-index: 20;
        }

        .touch-left-subcluster {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .touch-right-subcluster {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        /* Skeuomorphic Aluminum Racing Gas Pedal */
        .pedal-gas {
          width: 52px;
          height: 94px;
          border-radius: 14px;
          background: linear-gradient(180deg, #334155 0%, #1e293b 40%, #0f172a 100%);
          border: 2px solid #94a3b8;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -4px 8px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 8px 4px;
          color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 1px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.08s ease, border-color 0.1s, box-shadow 0.1s;
        }

        /* Horizontal rubber traction grooves on Gas Pedal */
        .pedal-gas::before {
          content: '';
          position: absolute;
          top: 24px;
          left: 6px;
          right: 6px;
          bottom: 24px;
          background: repeating-linear-gradient(
            0deg,
            #0f172a 0px,
            #0f172a 4px,
            rgba(148, 163, 184, 0.4) 4px,
            rgba(148, 163, 184, 0.4) 8px
          );
          border-radius: 4px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
          pointer-events: none;
        }

        .pedal-gas:active, .pedal-gas.active {
          transform: perspective(300px) rotateX(18deg) translateY(4px);
          border-color: #34d399;
          box-shadow: 0 2px 14px rgba(52, 211, 153, 0.7), inset 0 1px 3px rgba(255,255,255,0.6);
        }

        /* Skeuomorphic Textured Brake Pedal */
        .pedal-brake {
          width: 68px;
          height: 72px;
          border-radius: 12px;
          background: linear-gradient(180deg, #475569 0%, #1e293b 50%, #0f172a 100%);
          border: 2.5px solid #f87171;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 1px;
          cursor: pointer;
          position: relative;
          transition: transform 0.08s ease, border-color 0.1s, box-shadow 0.1s;
        }

        /* Diamond rubber grip plate pattern on Brake Pedal */
        .pedal-brake::before {
          content: '';
          position: absolute;
          top: 6px;
          left: 6px;
          right: 6px;
          bottom: 6px;
          background: radial-gradient(#ef4444 15%, transparent 16%),
                      radial-gradient(#ef4444 15%, transparent 16%);
          background-size: 8px 8px;
          background-position: 0 0, 4px 4px;
          opacity: 0.25;
          border-radius: 6px;
          pointer-events: none;
        }

        .pedal-brake:active, .pedal-brake.active {
          transform: perspective(300px) rotateX(16deg) translateY(3px);
          border-color: #ef4444;
          box-shadow: 0 0 24px rgba(239, 68, 68, 0.8), inset 0 1px 3px rgba(255,255,255,0.6);
        }

        /* Nitro Boost Button (Stacked directly above Brake Pedal) */
        .touch-nitro-btn {
          width: 68px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0284c7 0%, #6366f1 100%);
          border: 2px solid #38bdf8;
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5), inset 0 1px 2px rgba(255,255,255,0.4);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.6px;
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.1s;
        }

        .touch-nitro-btn:active, .touch-nitro-btn.active {
          transform: scale(0.92);
          box-shadow: 0 0 28px #38bdf8, inset 0 1px 4px #ffffff;
          border-color: #ffffff;
        }

        /* Jeep 3-Speed Gated Floor Shifter Console (Stacked directly above Gas Pedal) */
        .touch-shifter-knob {
          width: 92px;
          height: 118px;
          border-radius: 12px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 60%, #020617 100%);
          border: 2px solid #64748b;
          box-shadow: 0 8px 24px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -4px 8px rgba(0,0,0,0.85);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          position: relative;
          padding: 6px 6px 5px 6px;
          user-select: none;
          -webkit-user-select: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          pointer-events: auto;
          outline: none;
          box-sizing: border-box;
        }

        .shifter-console-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.15;
          margin-bottom: 4px;
          pointer-events: none;
        }

        .shifter-brand {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
          color: #cbd5e1;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9);
        }

        .shifter-subhead {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #94a3b8;
          white-space: nowrap;
        }

        .shifter-gate-housing {
          position: relative;
          width: 80px;
          height: 82px;
          background: #090d16;
          border: 1.5px solid rgba(148, 163, 184, 0.25);
          border-radius: 8px;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.9);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3px 4px;
          box-sizing: border-box;
          touch-action: none;
          overflow: hidden;
        }

        .shifter-track-slot {
          position: absolute;
          top: 5px;
          bottom: 5px;
          left: 9px;
          width: 6px;
          background: #020617;
          border-radius: 3px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.95), 0 0 1px rgba(255,255,255,0.1);
          z-index: 1;
          pointer-events: none;
        }

        .gate-slot {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 4px;
          height: 22px;
          margin-left: 23px;
          width: calc(100% - 23px);
          padding: 0 5px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
          pointer-events: auto;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
        }

        .gate-slot .slot-num {
          font-family: monospace, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 900;
          color: #64748b;
          min-width: 8px;
          transition: color 0.15s;
          flex-shrink: 0;
        }

        .gate-slot .slot-label {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #475569;
          transition: color 0.15s;
          flex-shrink: 0;
        }

        .gate-slot:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .shifter-lever-assembly {
          position: absolute;
          left: 0px;
          width: 24px;
          height: 24px;
          z-index: 5;
          pointer-events: auto;
          cursor: grab;
          transition: top 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .shifter-lever-assembly.dragging {
          transition: none !important;
          cursor: grabbing;
        }

        .shifter-knob-ball {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #475569 0%, #1e293b 55%, #020617 100%);
          border: 1.5px solid #94a3b8;
          box-shadow: 0 4px 10px rgba(0,0,0,0.8), inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -3px 5px rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .knob-cap {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .knob-gear-num {
          font-size: 8.5px;
          font-weight: 900;
          color: #ffffff;
          font-family: monospace, sans-serif;
        }

        /* Gear 3: HIGH */
        .touch-shifter-knob[data-mode="HIGH"], .touch-shifter-knob[data-mode="3"] {
          border-color: #38bdf8;
          box-shadow: 0 8px 24px rgba(0,0,0,0.7), 0 0 14px rgba(56, 189, 248, 0.3);
        }
        .touch-shifter-knob[data-mode="HIGH"] .gate-slot.slot-high,
        .touch-shifter-knob[data-mode="3"] .gate-slot.slot-high {
          background: rgba(2, 132, 199, 0.25);
          border: 1px solid rgba(56, 189, 248, 0.4);
        }
        .touch-shifter-knob[data-mode="HIGH"] .gate-slot.slot-high .slot-num,
        .touch-shifter-knob[data-mode="3"] .gate-slot.slot-high .slot-num {
          color: #38bdf8;
          text-shadow: 0 0 8px rgba(56, 189, 248, 0.9);
        }
        .touch-shifter-knob[data-mode="HIGH"] .gate-slot.slot-high .slot-label,
        .touch-shifter-knob[data-mode="3"] .gate-slot.slot-high .slot-label {
          color: #e0f2fe;
          font-weight: 900;
        }
        .touch-shifter-knob[data-mode="HIGH"] .shifter-knob-ball,
        .touch-shifter-knob[data-mode="3"] .shifter-knob-ball {
          border-color: #38bdf8;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.8), inset 0 2px 3px rgba(255,255,255,0.5);
        }

        /* Gear 2: MID */
        .touch-shifter-knob[data-mode="MID"], .touch-shifter-knob[data-mode="2"] {
          border-color: #f59e0b;
          box-shadow: 0 8px 24px rgba(0,0,0,0.7), 0 0 14px rgba(245, 158, 11, 0.3);
        }
        .touch-shifter-knob[data-mode="MID"] .gate-slot.slot-mid,
        .touch-shifter-knob[data-mode="2"] .gate-slot.slot-mid {
          background: rgba(245, 158, 11, 0.22);
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
        .touch-shifter-knob[data-mode="MID"] .gate-slot.slot-mid .slot-num,
        .touch-shifter-knob[data-mode="2"] .gate-slot.slot-mid .slot-num {
          color: #f59e0b;
          text-shadow: 0 0 8px rgba(245, 158, 11, 0.9);
        }
        .touch-shifter-knob[data-mode="MID"] .gate-slot.slot-mid .slot-label,
        .touch-shifter-knob[data-mode="2"] .gate-slot.slot-mid .slot-label {
          color: #fef3c7;
          font-weight: 900;
        }
        .touch-shifter-knob[data-mode="MID"] .shifter-knob-ball,
        .touch-shifter-knob[data-mode="2"] .shifter-knob-ball {
          border-color: #f59e0b;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.8), inset 0 2px 3px rgba(255,255,255,0.5);
        }

        /* Gear 1: LOW */
        .touch-shifter-knob[data-mode="LOW"], .touch-shifter-knob[data-mode="1"] {
          border-color: #ef4444;
          box-shadow: 0 8px 24px rgba(0,0,0,0.7), 0 0 14px rgba(239, 68, 68, 0.3);
        }
        .touch-shifter-knob[data-mode="LOW"] .gate-slot.slot-low,
        .touch-shifter-knob[data-mode="1"] .gate-slot.slot-low {
          background: rgba(239, 68, 68, 0.25);
          border: 1px solid rgba(248, 113, 113, 0.4);
        }
        .touch-shifter-knob[data-mode="LOW"] .gate-slot.slot-low .slot-num,
        .touch-shifter-knob[data-mode="1"] .gate-slot.slot-low .slot-num {
          color: #f87171;
          text-shadow: 0 0 8px rgba(239, 68, 68, 0.9);
        }
        .touch-shifter-knob[data-mode="LOW"] .gate-slot.slot-low .slot-label,
        .touch-shifter-knob[data-mode="1"] .gate-slot.slot-low .slot-label {
          color: #fee2e2;
          font-weight: 900;
        }
        .touch-shifter-knob[data-mode="LOW"] .shifter-knob-ball,
        .touch-shifter-knob[data-mode="1"] .shifter-knob-ball {
          border-color: #ef4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.8), inset 0 2px 3px rgba(255,255,255,0.5);
        }

        /* Gear recommendation alert on slot */
        .gate-slot.recommended {
          box-shadow: 0 0 10px rgba(52, 211, 153, 0.8) !important;
          animation: shifterRecPulse 1.1s infinite ease-in-out;
        }

        .shifter-rec-badge {
          position: absolute;
          top: -8px;
          right: -4px;
          background: #10b981;
          color: #022c22;
          font-size: 7px;
          font-weight: 900;
          padding: 1.5px 5px;
          border-radius: 6px;
          border: 1px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.6);
          pointer-events: none;
          z-index: 10;
          animation: shifterRecPulse 1.1s infinite ease-in-out;
        }

        @keyframes shifterRecPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        /* Wrong gear warning pulse */
        .touch-shifter-knob.wrong-gear-alert {
          border-color: #ef4444 !important;
          animation: shifterAlertPulse 0.9s infinite ease-in-out !important;
        }

        @keyframes shifterAlertPulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.6), inset 0 0 4px rgba(239, 68, 68, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 18px rgba(239, 68, 68, 0.95), inset 0 0 8px rgba(239, 68, 68, 0.5);
            transform: scale(1.04);
          }
        }

        /* Mobile Screen Optimization (Never Clipped, Crisp Shifter) */
        @media (max-width: 920px), (max-height: 520px) {
          .pedal-gas {
            width: 54px;
            height: 86px;
            font-size: 10px;
          }
          .pedal-brake {
            width: 62px;
            height: 66px;
            font-size: 10px;
          }
          .touch-nitro-btn {
            width: 62px;
            height: 44px;
            font-size: 9.5px;
          }
          .touch-shifter-knob {
            width: 88px;
            height: 114px;
            padding: 5px 5px;
          }
          .shifter-gate-housing {
            width: 78px;
            height: 80px;
            padding: 3px 4px;
          }
          .gate-slot {
            margin-left: 23px;
            width: calc(100% - 23px);
            padding: 0 4px;
          }
          .touch-action-cluster {
            bottom: max(14px, calc(env(safe-area-inset-bottom, 0px) + 12px));
            right: max(14px, calc(env(safe-area-inset-right, 0px) + 12px));
            gap: 10px;
          }
        }
      </style>

      <!-- Left Virtual Joystick Zone (Powered by NippleJS) -->
      <div id="touch-joystick-zone">
        <div class="joystick-resting-anchor">
          <svg viewBox="0 0 24 24"><path d="M8.5 7L3.5 12L8.5 17V13H15.5V17L20.5 12L15.5 7V11H8.5V7Z"/></svg>
          <span>STEER</span>
        </div>
      </div>

      <!-- Right Drive & Boost Cluster: Shifter stacked above Gas, Nitro stacked above Brake -->
      <div class="touch-action-cluster" id="touch-drive-cluster">
        <!-- Left sub-column: Nitro directly stacked above Brake Pedal -->
        <div class="touch-left-subcluster">
          <button class="touch-nitro-btn" id="touch-nitro-btn" aria-label="Nitro Boost">
            <span style="font-size:14px;">🚀</span>
            <span>NITRO</span>
          </button>
          <button class="pedal-brake" id="touch-brake-btn" aria-label="Brake Reverse">
            <span style="font-size:15px;">🛑</span>
            <span>BRAKE</span>
            <span style="font-size:8px; opacity:0.8; letter-spacing:0.5px; font-weight:800; margin-top:-2px;">/ REV</span>
          </button>
        </div>

        <!-- Right sub-column: Jeep 3-Speed Gated Shifter directly stacked above Gas Pedal -->
        <div class="touch-right-subcluster">
          <!-- Jeep 3-Speed Gated Floor Shifter Console -->
          <div class="touch-shifter-knob" id="touch-shifter-knob" data-mode="HIGH" role="group" aria-label="Jeep 3-Speed Gated Shifter" title="Jeep 3-Speed Gated Shifter [3: HIGH / 2: MID / 1: LOW] (Drag lever or click gate slot)">
            <div class="shifter-console-header">
              <span class="shifter-brand">JEEP 4WD</span>
              <span class="shifter-subhead">3-SPEED</span>
            </div>
            <div class="shifter-gate-housing" id="shifter-gate-housing">
              <div class="shifter-track-slot"></div>
              
              <!-- Interactive Gate Slots (Click to throw directly into gear) -->
              <div class="pattern-pos gate-slot slot-high active" data-pos="HIGH" data-gear="3" title="Gear 3: HIGH (Highway Overdrive)">
                <span class="slot-num">3</span>
                <span class="slot-label">HIGH</span>
              </div>
              <div class="pattern-pos gate-slot slot-mid" data-pos="MID" data-gear="2" title="Gear 2: MID (Trail Locked 4WD)">
                <span class="slot-num">2</span>
                <span class="slot-label">MID</span>
              </div>
              <div class="pattern-pos gate-slot slot-low" data-pos="LOW" data-gear="1" title="Gear 1: LOW (Rock Crawl Low-Range)">
                <span class="slot-num">1</span>
                <span class="slot-label">LOW</span>
              </div>

              <!-- Physical Draggable Shift Lever & Billet Ball Knob -->
              <div class="shifter-lever-assembly" id="shifter-lever-assembly" style="top: 4px;">
                <div class="shifter-knob-ball" id="shifter-knob-ball">
                  <div class="knob-cap">
                    <span class="knob-gear-num" id="shifter-mode-text">3</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="shifter-rec-badge" id="shifter-rec-text" style="display:none;">REC: LOW</div>
          </div>

          <button class="pedal-gas" id="touch-gas-btn" aria-label="Accelerate Gas">
            <span style="font-size:14px;">⚡</span>
            <span>GAS</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.touchContainer);

    // Bind Pointer Handlers for multi-touch support
    const bindTouchAction = (elId, onStart, onEnd) => {
      const el = this.touchContainer.querySelector(elId);
      if (!el) return;

      const handleDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('active');
        if (navigator.vibrate) {
          try { navigator.vibrate(10); } catch (v) {}
        }
        onStart();
      };

      const handleUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');
        onEnd();
      };

      el.addEventListener('pointerdown', handleDown, { passive: false });
      el.addEventListener('pointerup', handleUp, { passive: false });
      el.addEventListener('pointercancel', handleUp, { passive: false });
      el.addEventListener('pointerleave', handleUp, { passive: false });
    };

    // Setup NippleJS Dynamic Virtual Joystick on Left Touch Area
    const joystickZone = this.touchContainer.querySelector('#touch-joystick-zone');
    if (joystickZone) {
      try {
        this.joystickManager = nipplejs.create({
          zone: joystickZone,
          mode: 'dynamic',
          color: '#38bdf8',
          size: 110,
          threshold: 0.05,
          fadeTime: 200,
          multitouch: false,
          maxNumberOfNipples: 1,
          restOpacity: 0.65,
          lockX: true
        });

        this.joystickManager.on('start', () => {
          joystickZone.classList.add('active');
          if (navigator.vibrate) {
            try { navigator.vibrate(8); } catch (v) {}
          }
        });

        const handleJoystickData = (evt, directData) => {
          const d = (evt && evt.data) ? evt.data : (directData || evt);
          if (!d) return;

          let vx = 0;

          if (d.vector && typeof d.vector.x === 'number') {
            vx = d.vector.x;
          } else if (d.angle && typeof d.angle.radian === 'number') {
            const force = typeof d.force === 'number' ? Math.min(1.0, d.force) : 1.0;
            vx = Math.cos(d.angle.radian) * force;
          }

          // Steer: horizontal axis (-1.0 to 1.0)
          // The left joypad strictly controls left and right steering movements only — no throttle or brake
          this.touchJoystickSteer = Math.max(-1.0, Math.min(1.0, vx));
          this.touchJoystickThrottle = 0;
          this.touchJoystickBrake = 0;
        };

        this.joystickManager.on('move', handleJoystickData);
        this.joystickManager.on('dir', handleJoystickData);
        this.joystickManager.on('plain', handleJoystickData);

        this.joystickManager.on('end', () => {
          joystickZone.classList.remove('active');
          this.touchJoystickSteer = 0;
          this.touchJoystickThrottle = 0;
          this.touchJoystickBrake = 0;
        });
      } catch (err) {
        console.warn('NippleJS initialization warning:', err);
      }
    }

    // Pedals & Thumb Glide Support
    bindTouchAction('#touch-gas-btn', () => { this.touchGas = true; }, () => { this.touchGas = false; });
    bindTouchAction('#touch-brake-btn', () => { this.touchBrake = true; }, () => { this.touchBrake = false; });
    bindTouchAction('#touch-nitro-btn', () => { this.touchNitro = true; }, () => { this.touchNitro = false; });

    // Jeep 3-Speed Gated Floor Shifter: Drag-to-shift & Direct Notch Click
    const shifterEl = this.touchContainer.querySelector('#touch-shifter-knob');
    const leverAssembly = this.touchContainer.querySelector('#shifter-lever-assembly');
    const gateHousing = this.touchContainer.querySelector('#shifter-gate-housing');

    if (shifterEl && leverAssembly && gateHousing) {
      let isInteracting = false;
      let startClientX = 0;
      let startClientY = 0;
      let touchStartTime = 0;
      let isDraggingLever = false;

      const SLOT_POS = {
        'HIGH': 4,
        'MID': 27,
        'LOW': 50
      };

      const getModeFromY = (clientY) => {
        const rect = gateHousing.getBoundingClientRect();
        const relY = clientY - rect.top;
        const normalized = relY / Math.max(1, rect.height);
        if (normalized <= 0.35) return 'HIGH';
        if (normalized >= 0.65) return 'LOW';
        return 'MID';
      };

      const applyShiftMode = (targetMode) => {
        if (!targetMode || (targetMode !== 'HIGH' && targetMode !== 'MID' && targetMode !== 'LOW')) return;
        const phys = (window.game && window.game.physics) || this.physics;
        if (phys && phys.setDriveMode) {
          phys.setDriveMode(targetMode);
        } else if (typeof gameState !== 'undefined') {
          gameState.driveMode = targetMode;
        }
        shifterEl.setAttribute('data-mode', targetMode);
        const modeLabel = shifterEl.querySelector('#shifter-mode-text');
        if (modeLabel) modeLabel.textContent = (targetMode === 'HIGH' ? '3' : (targetMode === 'MID' ? '2' : '1'));
        const posList = shifterEl.querySelectorAll('.pattern-pos');
        posList.forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-pos') === targetMode);
        });
        if (navigator.vibrate) {
          try { navigator.vibrate(28); } catch (v) {}
        }
        leverAssembly.classList.remove('dragging');
        leverAssembly.style.top = `${SLOT_POS[targetMode] ?? 4}px`;
      };

      const onPointerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isInteracting = true;
        isDraggingLever = false;
        startClientX = e.clientX;
        startClientY = e.clientY;
        touchStartTime = Date.now();

        // Check if pointer started directly on lever assembly/ball
        if (leverAssembly.contains(e.target)) {
          isDraggingLever = true;
          leverAssembly.classList.add('dragging');
        }

        if (e.target && e.target.setPointerCapture) {
          try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
        }
      };

      const onPointerMove = (e) => {
        if (!isInteracting) return;
        const deltaX = e.clientX - startClientX;
        const deltaY = e.clientY - startClientY;
        const dist = Math.hypot(deltaX, deltaY);

        if (dist > 8) {
          isDraggingLever = true;
          leverAssembly.classList.add('dragging');
        }

        if (isDraggingLever) {
          const rect = gateHousing.getBoundingClientRect();
          const relY = e.clientY - rect.top;
          // Keep the knob aligned with the pointer within the track [4px, 50px]
          const clampedTop = Math.max(4, Math.min(50, relY - 11));
          leverAssembly.style.top = `${clampedTop}px`;
        }
      };

      const onPointerUp = (e) => {
        if (!isInteracting) return;
        isInteracting = false;
        leverAssembly.classList.remove('dragging');

        const deltaX = e.clientX - startClientX;
        const deltaY = e.clientY - startClientY;
        const totalDist = Math.hypot(deltaX, deltaY);

        // Release capture if held
        if (e.target && e.target.releasePointerCapture) {
          try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        // Case 1: Substantial Drag -> Select mode based on release Y
        if (isDraggingLever && totalDist > 12) {
          const targetMode = getModeFromY(e.clientY);
          applyShiftMode(targetMode);
          return;
        }

        // Case 2: Tap / Click -> Direct Slot Selection or Zone Selection
        let tappedSlot = e.target && e.target.closest ? e.target.closest('.gate-slot') : null;
        if (!tappedSlot && typeof document !== 'undefined' && document.elementFromPoint) {
          const startEl = document.elementFromPoint(startClientX, startClientY);
          tappedSlot = startEl && startEl.closest ? startEl.closest('.gate-slot') : null;
        }
        if (!tappedSlot && typeof document !== 'undefined' && document.elementFromPoint) {
          const endEl = document.elementFromPoint(e.clientX, e.clientY);
          tappedSlot = endEl && endEl.closest ? endEl.closest('.gate-slot') : null;
        }

        if (tappedSlot && tappedSlot.getAttribute('data-pos')) {
          applyShiftMode(tappedSlot.getAttribute('data-pos'));
          return;
        }

        // If tapped inside the gate housing (even if slightly off the text/number), select based on tapped Y
        const rect = gateHousing.getBoundingClientRect();
        if (startClientX >= rect.left && startClientX <= rect.right &&
            startClientY >= rect.top && startClientY <= rect.bottom) {
          const targetMode = getModeFromY(startClientY);
          applyShiftMode(targetMode);
          return;
        }

        // If tapped on the shifter header or outside housing, cycle to next gear
        const phys = (window.game && window.game.physics) || this.physics;
        if (phys && phys.cycleDriveMode) {
          const nextMode = phys.cycleDriveMode();
          applyShiftMode(nextMode);
        }
      };

      gateHousing.addEventListener('pointerdown', onPointerDown, { passive: false });
      shifterEl.addEventListener('pointerdown', onPointerDown, { passive: false });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('pointercancel', onPointerUp, { passive: true });

      // Direct notch clicks (for desktop mouse clicks)
      const gateSlots = shifterEl.querySelectorAll('.gate-slot');
      gateSlots.forEach(slot => {
        slot.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetMode = slot.getAttribute('data-pos');
          if (targetMode) applyShiftMode(targetMode);
        });
      });
    }

    // Enable seamless thumb-glide between Gas and Nitro without lifting contact
    const driveCluster = this.touchContainer.querySelector('#touch-drive-cluster');
    const gasEl = this.touchContainer.querySelector('#touch-gas-btn');
    const nitroEl = this.touchContainer.querySelector('#touch-nitro-btn');
    const brakeEl = this.touchContainer.querySelector('#touch-brake-btn');

    if (driveCluster) {
      const handlePointerMove = (e) => {
        if (e.buttons === 0 && e.pointerType === 'mouse') return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target) return;

        // Do not activate gas/nitro/brake if pointer is interacting with shifter
        if (shifterEl && (shifterEl === target || shifterEl.contains(target))) return;

        const isOverGas = gasEl && (gasEl === target || gasEl.contains(target));
        const isOverNitro = nitroEl && (nitroEl === target || nitroEl.contains(target));
        const isOverBrake = brakeEl && (brakeEl === target || brakeEl.contains(target));

        if (isOverGas) {
          if (!this.touchGas) {
            this.touchGas = true;
            gasEl.classList.add('active');
          }
        }
        if (isOverNitro) {
          if (!this.touchNitro) {
            this.touchNitro = true;
            nitroEl.classList.add('active');
          }
        }
        if (isOverBrake) {
          if (!this.touchBrake) {
            this.touchBrake = true;
            brakeEl.classList.add('active');
          }
        }
      };

      driveCluster.addEventListener('pointermove', handlePointerMove, { passive: true });
    }
  }

  update() {
    // 1. Keyboard Inputs
    let steerK = 0;
    let throttleK = 0;
    let brakeK = 0;
    let nitroK = false;
    let handbrakeK = false;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) steerK -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) steerK += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) throttleK += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) brakeK += 1;
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyN'] || this.keys['KeyF']) nitroK = true;

    // When reading historical plaque, tablet open, or zone menu, park car cleanly with zero pedal inputs
    if (gameState.isReadingHistory || gameState.isZoneMenuOpen || gameState.isTabletOpen) {
      this.steer = 0;
      this.throttle = 0;
      this.brake = 0;
      this.handbrake = true;
      this.nitro = false;
      gameState.steerInput = 0;
      gameState.throttleInput = 0;
      gameState.brakeInput = 0;
      gameState.handbrake = true;
      gameState.isBoosting = false;
      return;
    }

    // 2. Mobile Touch & NippleJS Virtual Joystick Inputs
    let steerT = this.touchJoystickSteer !== 0
      ? this.touchJoystickSteer
      : ((this.touchSteerLeft ? -1 : 0) + (this.touchSteerRight ? 1 : 0));

    // Throttle & Brake on touch screens are solely controlled by dedicated pedals (joypad is steer-only)
    const throttleT = this.touchGas ? 1 : 0;
    const brakeT = this.touchBrake ? 1 : 0;
    const nitroT = this.touchNitro;
    const handbrakeT = false;

    // 3. Gamepad Inputs
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    let steerG = 0, throttleG = 0, brakeG = 0, nitroG = false, handbrakeG = false;

    if (gp) {
      // Left stick X
      if (Math.abs(gp.axes[0]) > 0.15) steerG = gp.axes[0];
      // Right trigger (accelerate) or A button
      if (gp.buttons[7] && gp.buttons[7].value > 0.05) throttleG = gp.buttons[7].value;
      else if (gp.buttons[0] && gp.buttons[0].pressed) throttleG = 1;
      // Left trigger (brake) or B button
      if (gp.buttons[6] && gp.buttons[6].value > 0.05) brakeG = gp.buttons[6].value;
      else if (gp.buttons[1] && gp.buttons[1].pressed) brakeG = 1;
      // X button / R1 for Nitro
      if ((gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[5] && gp.buttons[5].pressed)) nitroG = true;
      // Handbrake (L1 / Square)
      if ((gp.buttons[4] && gp.buttons[4].pressed) || (gp.buttons[3] && gp.buttons[3].pressed)) handbrakeG = true;
    }

    // Combine & Clamp
    this.steer = Math.max(-1, Math.min(1, steerK + steerT + steerG));
    this.brake = Math.max(0, Math.min(1, brakeK + brakeT + brakeG));
    this.handbrake = handbrakeK || handbrakeT || handbrakeG;

    // Nitro-as-gas: holding the nitro button counts as throttle too. While nitro is
    // available it boosts (handled by physics); when the tank empties or overheats,
    // the same held button seamlessly keeps driving as regular throttle — no need to
    // move your thumb back to the gas button.
    const rawThrottle = Math.max(0, Math.min(1, throttleK + throttleT + throttleG));
    this.nitroHeld = nitroK || nitroT || nitroG;
    this.throttle = Math.max(rawThrottle, this.nitroHeld ? 1 : 0);
    if (!this.nitroHeld) this._nitroWasHeld = false;
    else if (!this._nitroWasHeld) this._nitroWasHeld = true;

    this.nitro = this.nitroHeld;

    gameState.steerInput = this.steer;
    gameState.throttleInput = this.throttle;
    gameState.brakeInput = this.brake;
    gameState.handbrake = this.handbrake;
    gameState.isBoosting = this.nitro && gameState.nitro > 0 && !gameState.isOverheated;

    // Immediately skip intro and begin driving if any input is received
    if (gameState.hasGameStarted && gameState.isIntroActive && (this.throttle > 0.05 || Math.abs(this.steer) > 0.1 || this.nitro || this.brake > 0.1)) {
      const cm = this.cameraManager || (window.game && window.game.cameraManager);
      if (cm) cm.skipIntro();
    }

    // Lock driving inputs completely during Auto Shop Servicing, Mechanic Cinematic, Towing, Tablet Open, or Binocular View
    if (gameState.isServicing || gameState.isMechanicCinematic || gameState.isTowing || gameState.isReadingHistory || gameState.isZoneMenuOpen || gameState.isTabletOpen || gameState.isBinocularView) {
      this.steer = 0;
      this.throttle = 0;
      this.brake = 0;
      this.nitro = false;
      this.handbrake = false;
      this.nitroHeld = false;
      gameState.steerInput = 0;
      gameState.throttleInput = 0;
      gameState.brakeInput = 0;
      gameState.handbrake = false;
      gameState.isBoosting = false;
    }

    if (this.touchContainer) {
      if (gameState.hasGameStarted && !gameState.isBinocularView) {
        this.touchContainer.classList.add('touch-visible');
      } else {
        this.touchContainer.classList.remove('touch-visible');
      }
    }
  }

  getInput() {
    if (gameState.isServicing || gameState.isMechanicCinematic || gameState.isTowing || gameState.isReadingHistory || gameState.isZoneMenuOpen || gameState.isTabletOpen || gameState.isBinocularView) {
      return {
        steer: 0,
        throttle: 0,
        brake: 0,
        handbrake: false,
        nitro: false,
        isTouchSteering: false
      };
    }
    return {
      steer: this.steer || 0,
      throttle: this.throttle || 0,
      brake: this.brake || 0,
      handbrake: !!this.handbrake,
      nitro: !!this.nitro,
      // True when touch/joystick is the active steering source and no keyboard key is held.
      // Used by Physics to apply mobile-specific steering tuning independently of desktop.
      isTouchSteering: (this.touchJoystickSteer !== 0 || this.touchSteerLeft || this.touchSteerRight)
        && !this.keys['KeyA'] && !this.keys['ArrowLeft']
        && !this.keys['KeyD'] && !this.keys['ArrowRight']
    };
  }
}
