import * as THREE from 'three';
import { gameState } from '../state.js';
import { ZONES } from '../constants.js';

/**
 * Ultra-Realistic Porsche Flat-6 & Twin-Turbo Web Audio Engine
 * with Atmospheric Desert Ambience, Procedural Birdsong & Dream Awakening Resonance
 * 
 * Features:
 * - Multi-Oscillator Flat-6 Boxer Engine Synthesis (9,000 RPM high-revving roar)
 * - Dynamic Turbocharger Spool Whine (Boost pressure 0.0 to 1.8 Bar)
 * - Authentic Turbo Blow-Off Valve (BOV) with Multi-Pulse Compressor Surge Flutter ("Tsu-tsu-tsu-pshhh!")
 * - Transmission Shift Detection (PDK 7-Speed upshift drops & downshift rev-blips)
 * - Exhaust Overrun Pops & Bangs (Unburnt fuel detonation crackles on throttle lift)
 * - Aerodynamic High-Speed Wind Rush & Lateral Tire Screech
 * - Atmospheric Mojave Desert Breeze & Warm Air Gusts
 * - Procedural Desert Songbirds, Sparrows, Meadowlarks & High-Altitude Falcons
 * - Dream Awakening Resonant Harmony Shimmer
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;

    // Transmission & Turbo state
    this.lastGear = 1;
    this.lastThrottle = 0;
    this.lastSpeed = 0;
    this.turboBoost = 0.0;     // 0.0 to 1.8 Bar
    this.shiftCooldown = 0;
    this.turboCruiseFade = 1.0; // 1.0 = fully active, fades slowly to 0.0 above 195 km/h
    this.lastUpdateTime = 0;

    // Desert & Dream Ambience state
    this.birdTimer = 0.6;       // Immediate first bird call
    this.dreamChordPlayed = false;

    // Immediately instantiate Web Audio on load
    this.setupAudio();

    // Unlock / Resume Web Audio on first genuine user gesture
    const unlockAudio = () => {
      if (!this.isInitialized) {
        this.setupAudio();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          console.log('🔊 AudioContext Active & Engine Audio Running');
          cleanupListeners();
        }).catch(err => console.warn('Audio resume:', err));
      } else if (this.ctx && this.ctx.state === 'running') {
        cleanupListeners();
      }
    };

    const interactionEvents = ['click', 'pointerdown', 'touchstart', 'keydown'];
    const cleanupListeners = () => {
      interactionEvents.forEach(evt => {
        window.removeEventListener(evt, unlockAudio);
      });
    };

    interactionEvents.forEach(evt => {
      window.addEventListener(evt, unlockAudio, { passive: true });
    });
  }

  async setupAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Master Output Low-Pass Filter
      this.awakeningFilter = this.ctx.createBiquadFilter();
      this.awakeningFilter.type = 'lowpass';
      this.awakeningFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
      this.awakeningFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      this.awakeningFilter.connect(this.masterGain);

      // Dynamics Compressor (Pristine studio mix, prevents clipping)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);
      this.compressor.connect(this.awakeningFilter);

      // Generate White Noise Buffer (Used for Turbo Spool, BOV, Wind, Desert Breeze, and Tire Screech)
      this.setupNoiseBuffer();

      // 1. Procedural Porsche Flat-6 Boxer Engine Voice (no samples)
      this.setupProceduralEngine();

      // 2. Turbocharger Spool Whine Synthesizer
      this.setupTurboSpoolSynth();

      // 3. Tire Screech & Wind Synthesis
      this.setupTireAndWindSynth();
      this.setupRimGrindSynth();

      // 4. Nitro Rocket Jet Thruster Synthesizer
      this.setupNitroJetSynth();

      // 5. Desert Breeze & Procedural Morning Birdsong
      this.setupDesertAndBirdSynth();

      // 6. Ethereal Dream Awakening Synthesizer, Sub-Bass Heartbeat & Celestial Glass Bells
      this.setupDreamAtmosphereSynth();
      this.setupHeartbeatSynth();

      // 7. Real Weather Audio (Rain Ambience & Acoustic Thunder Strikes)
      this.setupRealWeatherAudio();

      // 8. Real Safari Jeep Audio Samples (Idle Loop, Gear Shifts, Starter, Overrun, Horn)
      this.setupRealJeepAudio();

      // 9. Off-Road 4x4 Transfer Case Whine & Skid Plate Rock Scrape Synth
      this.setupOffRoadAudio();

      this.isInitialized = true;
      console.log('🔊 High-Fidelity Audio Engine Active (Porsche Flat-6 + Heartbeat Awakening + Real Weather Audio + Birdsong)');
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  setupNoiseBuffer() {
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Fully procedural Porsche flat-6 engine voice (no audio files).
   */
  setupProceduralEngine() {
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Deep Low-Pass Muffler Filter (Throaty cast-iron 4x4 exhaust thrum)
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(340, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(14); // Warm cast-iron cylinder compression warmth
    this.distortion.oversample = '2x';

    // Primary Low-Rev Firing Strokes (24 Hz idle ~ 720 RPM)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(26, this.ctx.currentTime);

    // Secondary Detuned Cylinder Stroke (Slight pulse beating)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sawtooth';
    this.osc2.frequency.setValueAtTime(26.3, this.ctx.currentTime);

    // Deep Piston Stroke Sub-Harmonic (Thumping iron block pulse)
    this.oscFire = this.ctx.createOscillator();
    this.oscFire.type = 'square';
    this.oscFire.frequency.setValueAtTime(13, this.ctx.currentTime);
    this.oscFireGain = this.ctx.createGain();
    this.oscFireGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
    this.oscFire.connect(this.oscFireGain);

    // Valvetrain Mechanical Tappet Ticking / Mid Harmonic
    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = 'triangle';
    this.osc3.frequency.setValueAtTime(52, this.ctx.currentTime);
    this.osc3Gain = this.ctx.createGain();
    this.osc3Gain.gain.setValueAtTime(0.32, this.ctx.currentTime);
    this.osc3Gain.connect(this.engineFilter);

    // Heavy Sub-Bass Rumble
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(13, this.ctx.currentTime);

    this.osc1.connect(this.engineFilter);
    this.osc2.connect(this.engineFilter);
    this.oscFireGain.connect(this.engineFilter);
    this.subOsc.connect(this.engineFilter);

    this.engineFilter.connect(this.distortion);
    this.distortion.connect(this.engineGain);
    this.engineGain.connect(this.compressor);

    // Carburetor Throat Air Intake Gulp
    this.intakeSource = this.ctx.createBufferSource();
    this.intakeSource.buffer = this.noiseBuffer;
    this.intakeSource.loop = true;
    this.intakeFilter = this.ctx.createBiquadFilter();
    this.intakeFilter.type = 'bandpass';
    this.intakeFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
    this.intakeFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);
    this.intakeGain = this.ctx.createGain();
    this.intakeGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.intakeSource.connect(this.intakeFilter);
    this.intakeFilter.connect(this.intakeGain);
    this.intakeGain.connect(this.compressor);
    this.intakeSource.start();

    // Long Glasspack / Steel Pipe Exhaust Resonance
    this.exhaustDelay = this.ctx.createDelay(0.08);
    this.exhaustDelay.delayTime.setValueAtTime(0.018, this.ctx.currentTime);
    this.exhaustFeedback = this.ctx.createGain();
    this.exhaustFeedback.gain.setValueAtTime(0.32, this.ctx.currentTime);
    this.exhaustWet = this.ctx.createGain();
    this.exhaustWet.gain.setValueAtTime(0.28, this.ctx.currentTime);
    this.distortion.connect(this.exhaustDelay);
    this.exhaustDelay.connect(this.exhaustFeedback);
    this.exhaustFeedback.connect(this.exhaustDelay);
    this.exhaustDelay.connect(this.exhaustWet);
    this.exhaustWet.connect(this.compressor);

    this.osc1.start();
    this.osc2.start();
    this.oscFire.start();
    this.osc3.start();
    this.subOsc.start();
  }

  // 4WD Transfer Case & Straight-Cut Transmission Gear Whine
  setupTurboSpoolSynth() {
    this.turboWhineOsc = this.ctx.createOscillator();
    this.turboWhineOsc.type = 'triangle';
    this.turboWhineOsc.frequency.setValueAtTime(220, this.ctx.currentTime);

    this.turboWhineFilter = this.ctx.createBiquadFilter();
    this.turboWhineFilter.type = 'bandpass';
    this.turboWhineFilter.frequency.setValueAtTime(440, this.ctx.currentTime);
    this.turboWhineFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    this.turboWhineGain = this.ctx.createGain();
    this.turboWhineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.turboWhineOsc.connect(this.turboWhineFilter);
    this.turboWhineFilter.connect(this.turboWhineGain);
    this.turboWhineGain.connect(this.compressor);
    this.turboWhineOsc.start();

    this.turboAirSource = this.ctx.createBufferSource();
    this.turboAirSource.buffer = this.noiseBuffer;
    this.turboAirSource.loop = true;

    this.turboAirFilter = this.ctx.createBiquadFilter();
    this.turboAirFilter.type = 'bandpass';
    this.turboAirFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    this.turboAirFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.turboAirGain = this.ctx.createGain();
    this.turboAirGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.turboAirSource.connect(this.turboAirFilter);
    this.turboAirFilter.connect(this.turboAirGain);
    this.turboAirGain.connect(this.compressor);
    this.turboAirSource.start();
  }

  setupTireAndWindSynth() {
    this.tireSource = this.ctx.createBufferSource();
    this.tireSource.buffer = this.noiseBuffer;
    this.tireSource.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.tireSource.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.compressor);
    this.tireSource.start();

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.compressor);
    this.windSource.start();
  }

  setupRimGrindSynth() {
    if (!this.ctx || !this.noiseBuffer) return;
    this.rimNoise = this.ctx.createBufferSource();
    this.rimNoise.buffer = this.noiseBuffer;
    this.rimNoise.loop = true;

    this.rimFilter = this.ctx.createBiquadFilter();
    this.rimFilter.type = 'bandpass';
    this.rimFilter.frequency.setValueAtTime(820, this.ctx.currentTime);
    this.rimFilter.Q.setValueAtTime(2.8, this.ctx.currentTime);

    this.rimGain = this.ctx.createGain();
    this.rimGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.rimNoise.connect(this.rimFilter);
    this.rimFilter.connect(this.rimGain);
    this.rimGain.connect(this.compressor);
    this.rimNoise.start();

    // High-pitched metallic screech scraping oscillator
    this.rimMetalOsc = this.ctx.createOscillator();
    this.rimMetalOsc.type = 'sawtooth';
    this.rimMetalOsc.frequency.setValueAtTime(240, this.ctx.currentTime);

    this.rimMetalGain = this.ctx.createGain();
    this.rimMetalGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.rimMetalOsc.connect(this.rimMetalGain);
    this.rimMetalGain.connect(this.compressor);
    this.rimMetalOsc.start();
  }

  setupNitroJetSynth() {
    this.nitroSource = this.ctx.createBufferSource();
    this.nitroSource.buffer = this.noiseBuffer;
    this.nitroSource.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.nitroFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.nitroSource.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.compressor);
    this.nitroSource.start();

    this.nitroRumbleOsc = this.ctx.createOscillator();
    this.nitroRumbleOsc.type = 'sawtooth';
    this.nitroRumbleOsc.frequency.setValueAtTime(58, this.ctx.currentTime);

    this.nitroRumbleFilter = this.ctx.createBiquadFilter();
    this.nitroRumbleFilter.type = 'lowpass';
    this.nitroRumbleFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.nitroRumbleGain = this.ctx.createGain();
    this.nitroRumbleGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.nitroRumbleOsc.connect(this.nitroRumbleFilter);
    this.nitroRumbleFilter.connect(this.nitroRumbleGain);
    this.nitroRumbleGain.connect(this.compressor);
    this.nitroRumbleOsc.start();
  }

  /**
   * Desert Ambience Synthesizer & Procedural Morning Birdsong
   */
  setupDesertAndBirdSynth() {
    const now = this.ctx.currentTime;

    // 1. Warm Desert Breeze / Sand Dune Wind
    this.desertBreezeSource = this.ctx.createBufferSource();
    this.desertBreezeSource.buffer = this.noiseBuffer;
    this.desertBreezeSource.loop = true;

    this.desertBreezeFilter = this.ctx.createBiquadFilter();
    this.desertBreezeFilter.type = 'bandpass';
    this.desertBreezeFilter.frequency.setValueAtTime(360, now);
    this.desertBreezeFilter.Q.setValueAtTime(0.9, now);

    this.desertBreezeLowpass = this.ctx.createBiquadFilter();
    this.desertBreezeLowpass.type = 'lowpass';
    this.desertBreezeLowpass.frequency.setValueAtTime(620, now);

    this.desertBreezeGain = this.ctx.createGain();
    this.desertBreezeGain.gain.setValueAtTime(0.0, now);

    this.desertBreezeSource.connect(this.desertBreezeFilter);
    this.desertBreezeFilter.connect(this.desertBreezeLowpass);
    this.desertBreezeLowpass.connect(this.desertBreezeGain);
    this.desertBreezeGain.connect(this.compressor);
    this.desertBreezeSource.start();

    // 2. Master Gain for Procedural Birdcalls
    this.birdMasterGain = this.ctx.createGain();
    this.birdMasterGain.gain.setValueAtTime(0.32, now);
    this.birdMasterGain.connect(this.compressor);

    // 3. Subtle Desert Canyon Delay / Echo for Spatial Atmosphere
    this.birdEchoDelay = this.ctx.createDelay(0.4);
    this.birdEchoDelay.delayTime.setValueAtTime(0.18, now);

    this.birdEchoFeedback = this.ctx.createGain();
    this.birdEchoFeedback.gain.setValueAtTime(0.25, now);

    this.birdEchoFilter = this.ctx.createBiquadFilter();
    this.birdEchoFilter.type = 'lowpass';
    this.birdEchoFilter.frequency.setValueAtTime(2400, now);

    this.birdEchoDelay.connect(this.birdEchoFeedback);
    this.birdEchoFeedback.connect(this.birdEchoFilter);
    this.birdEchoFilter.connect(this.birdEchoDelay);
    this.birdEchoFilter.connect(this.birdMasterGain);
  }

  /**
   * Procedural Desert Birdsong Generator
   * Produces authentic, natural morning songbirds, sparrows, meadowlarks, and desert hawks
   */
  triggerProceduralBirdCall(intensity = 1.0) {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;
    const species = Math.floor(Math.random() * 3);

    // Spatial Stereo Panner if supported
    let panner = null;
    if (this.ctx.createStereoPanner) {
      panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() - 0.5) * 1.5, now); // -0.75 to +0.75 stereo spread
      panner.connect(this.birdMasterGain);
      panner.connect(this.birdEchoDelay);
    }

    const dest = panner || this.birdMasterGain;

    if (species === 0) {
      // -----------------------------------------------------------
      // Species A: Mojave Desert Songbird / Sparrow (Delicate 3-4 chirp warble)
      // -----------------------------------------------------------
      const chirpCount = 3 + Math.floor(Math.random() * 2);
      const basePitch = 3200 + Math.random() * 600;

      for (let c = 0; c < chirpCount; c++) {
        const startTime = now + c * 0.085;
        const duration = 0.065;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const chirpStartPitch = basePitch + c * 180 + (Math.random() - 0.5) * 100;
        const chirpEndPitch = chirpStartPitch + 450 + Math.random() * 300;

        osc.frequency.setValueAtTime(chirpStartPitch, startTime);
        osc.frequency.exponentialRampToValueAtTime(chirpEndPitch, startTime + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(chirpStartPitch * 0.95, startTime + duration);

        // Rapid harmonic vibrato
        const vib = this.ctx.createOscillator();
        vib.type = 'sine';
        vib.frequency.setValueAtTime(38, startTime);
        const vibGain = this.ctx.createGain();
        vibGain.gain.setValueAtTime(120, startTime);
        vib.connect(vibGain);
        vibGain.connect(osc.frequency);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.24 * intensity, startTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(dest);

        vib.start(startTime);
        vib.stop(startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
      }

    } else if (species === 1) {
      // -----------------------------------------------------------
      // Species B: Western Meadowlark (Sweet 4-note melodic whistle)
      // -----------------------------------------------------------
      const notes = [
        2600 + Math.random() * 200,
        3400 + Math.random() * 250,
        4200 + Math.random() * 300,
        3100 + Math.random() * 200
      ];

      for (let n = 0; n < notes.length; n++) {
        const startTime = now + n * 0.14;
        const duration = 0.12;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const pitch = notes[n];

        osc.frequency.setValueAtTime(pitch * 0.96, startTime);
        osc.frequency.linearRampToValueAtTime(pitch, startTime + 0.02);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.92, startTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.22 * intensity, startTime + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
      }

    } else {
      // -----------------------------------------------------------
      // Species C: Distant High-Altitude Desert Hawk / Falcon Cry
      // -----------------------------------------------------------
      const startTime = now;
      const duration = 0.72;

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2850 + Math.random() * 200, startTime);
      osc.frequency.exponentialRampToValueAtTime(1750, startTime + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, startTime);
      filter.Q.setValueAtTime(3.5, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.16 * intensity, startTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    }
  }

  /**
   * Ethereal Dream Awakening Chord (Played as the camera turns into driving view)
   * Warm, uplifting D Major 9th shimmer chord
   */
  playDreamRealizationChord() {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;
    const frequencies = [293.66, 440.00, 587.33, 739.99, 880.00, 1108.73, 1318.51]; // D4, A4, D5, F#5, A5, C#6, E6

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.075 / (idx + 1) * 1.8, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);

      osc.start(now);
      osc.stop(now + 4.0);
    });

    // Also trigger an early morning bird call alongside the chord
    setTimeout(() => this.triggerProceduralBirdCall(1.2), 350);
  }

  /**
   * Crisp, luminous audio chime played when the temperature flashes and the driver awakens
   */
  playTempFlashChime() {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;

    const chimeNotes = [
      { freq: 659.25, time: 0.00, dur: 0.8 }, // E5
      { freq: 880.00, time: 0.08, dur: 0.9 }, // A5
      { freq: 1318.5, time: 0.16, dur: 1.4 }, // E6 (Sparkling apex note)
    ];

    chimeNotes.forEach((note) => {
      const startTime = now + note.time;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(startTime);
      osc.stop(startTime + note.dur + 0.05);
    });
  }

  /**
   * Continuous, lush ethereal ambient dream pad synthesizer
   */
  setupDreamAtmosphereSynth() {
    this.dreamGain = this.ctx.createGain();
    this.dreamGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.dreamFilter = this.ctx.createBiquadFilter();
    this.dreamFilter.type = 'lowpass';
    this.dreamFilter.frequency.setValueAtTime(850, this.ctx.currentTime);
    this.dreamFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Ethereal Lush Harmonized Chord: Dmaj9 / F#m11 (146.83, 220.00, 277.18, 369.99, 440.00, 554.37 Hz)
    const chordFreqs = [146.83, 220.00, 277.18, 369.99, 440.00, 554.37];
    this.dreamOscs = [];

    chordFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.20 / (idx * 0.45 + 1.0), this.ctx.currentTime);

      osc.connect(subGain);
      subGain.connect(this.dreamFilter);
      osc.start();
      this.dreamOscs.push(osc);
    });

    this.dreamFilter.connect(this.dreamGain);
    this.dreamGain.connect(this.compressor);

    this.dreamShimmerTimer = 0.5;
  }

  /**
   * Plays a delicate celestial glass bell / music box note during the dream state
   */
  triggerDreamShimmer(intensity = 1.0) {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;
    const shimmerNotes = [659.25, 739.99, 880.00, 987.77, 1108.73, 1318.51, 1479.98, 1760.00];
    const freq = shimmerNotes[Math.floor(Math.random() * shimmerNotes.length)];
    const duration = 1.4 + Math.random() * 0.9;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09 * intensity, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.compressor);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  setupHeartbeatSynth() {
    this.heartbeatTimer = 0.6;
    this.heartbeatRate = 1.0;
  }

  /**
   * Deep, visceral sub-bass heartbeat pulse (double-beat "lub-dub")
   */
  triggerHeartbeat(intensity = 1.0) {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;

    // Pulse 1: "Lub" (Deeper, punchier)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(54, now);
    osc1.frequency.exponentialRampToValueAtTime(32, now + 0.12);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.44 * intensity, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(this.compressor);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Pulse 2: "Dub" (Secondary rhythmic echo)
    const time2 = now + 0.14;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(46, time2);
    osc2.frequency.exponentialRampToValueAtTime(28, time2 + 0.16);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.001, time2);
    gain2.gain.linearRampToValueAtTime(0.34 * intensity, time2 + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, time2 + 0.18);

    osc2.connect(gain2);
    gain2.connect(this.compressor);
    osc2.start(time2);
    osc2.stop(time2 + 0.20);
  }

  /**
   * Visceral 12V starter motor compression chugs & Old Jeep inline engine catch
   */
  triggerStarterCrankAndIgnition() {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Slow, heavy starter compression pulses (4 deep chugs)
    const crankCount = 4;
    const crankInterval = 0.15;
    for (let i = 0; i < crankCount; i++) {
      const crankTime = now + i * crankInterval;

      const crankOsc = this.ctx.createOscillator();
      crankOsc.type = 'sawtooth';
      crankOsc.frequency.setValueAtTime(88 + i * 10, crankTime);
      crankOsc.frequency.exponentialRampToValueAtTime(42, crankTime + 0.12);

      const crankFilter = this.ctx.createBiquadFilter();
      crankFilter.type = 'bandpass';
      crankFilter.frequency.setValueAtTime(280, crankTime);
      crankFilter.Q.setValueAtTime(2.2, crankTime);

      const crankGain = this.ctx.createGain();
      crankGain.gain.setValueAtTime(0.35, crankTime);
      crankGain.gain.exponentialRampToValueAtTime(0.001, crankTime + 0.13);

      crankOsc.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(this.compressor);

      crankOsc.start(crankTime);
      crankOsc.stop(crankTime + 0.14);
    }

    // 2. Firing point: Carbureted inline engine catches and idles with a guttural chug!
    const catchTime = now + (crankCount * crankInterval);

    const punchOsc = this.ctx.createOscillator();
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(80, catchTime);
    punchOsc.frequency.exponentialRampToValueAtTime(28, catchTime + 0.45);

    const punchGain = this.ctx.createGain();
    punchGain.gain.setValueAtTime(0.001, catchTime);
    punchGain.gain.linearRampToValueAtTime(0.68, catchTime + 0.04);
    punchGain.gain.exponentialRampToValueAtTime(0.001, catchTime + 0.50);

    punchOsc.connect(punchGain);
    punchGain.connect(this.compressor);
    punchOsc.start(catchTime);
    punchOsc.stop(catchTime + 0.52);

    // Initial startup rev blip
    setTimeout(() => {
      this.triggerExhaustPop(1.0);
      setTimeout(() => this.triggerExhaustPop(0.7), 130);
    }, (crankCount * crankInterval + 0.08) * 1000);
  }

  /**
   * Heavy mechanical manual transmission gear shift (Clunk, Shifter Gate, Clutch Bite)
   * 100% Procedurally Synthesized
   */
  triggerManualGearShift(newGear, oldGear) {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Shifter Gate "Clack" (High-mid metallic notch)
    const gateOsc = this.ctx.createOscillator();
    gateOsc.type = 'triangle';
    gateOsc.frequency.setValueAtTime(360, now);
    gateOsc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    const gateFilter = this.ctx.createBiquadFilter();
    gateFilter.type = 'bandpass';
    gateFilter.frequency.setValueAtTime(1100, now);
    gateFilter.Q.setValueAtTime(3.2, now);

    const gateGain = this.ctx.createGain();
    gateGain.gain.setValueAtTime(0.32, now);
    gateGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    gateOsc.connect(gateFilter);
    gateFilter.connect(gateGain);
    gateGain.connect(this.compressor);

    gateOsc.start(now);
    gateOsc.stop(now + 0.045);

    // 2. Heavy Gear Dog Engagement "THUNK" (40ms later)
    const thunkTime = now + 0.038;
    const thunkOsc = this.ctx.createOscillator();
    thunkOsc.type = 'sine';
    thunkOsc.frequency.setValueAtTime(95, thunkTime);
    thunkOsc.frequency.exponentialRampToValueAtTime(32, thunkTime + 0.09);

    const thunkFilter = this.ctx.createBiquadFilter();
    thunkFilter.type = 'lowpass';
    thunkFilter.frequency.setValueAtTime(260, thunkTime);
    thunkFilter.Q.setValueAtTime(2.0, thunkTime);

    const thunkGain = this.ctx.createGain();
    thunkGain.gain.setValueAtTime(0.48, thunkTime);
    thunkGain.gain.exponentialRampToValueAtTime(0.001, thunkTime + 0.10);

    thunkOsc.connect(thunkFilter);
    thunkFilter.connect(thunkGain);
    thunkGain.connect(this.compressor);

    thunkOsc.start(thunkTime);
    thunkOsc.stop(thunkTime + 0.11);

    // 3. Clutch Re-Engagement Friction Scuff
    if (this.noiseBuffer) {
      const clutchNoise = this.ctx.createBufferSource();
      clutchNoise.buffer = this.noiseBuffer;

      const clutchFilter = this.ctx.createBiquadFilter();
      clutchFilter.type = 'bandpass';
      clutchFilter.frequency.setValueAtTime(620, thunkTime);
      clutchFilter.Q.setValueAtTime(2.5, thunkTime);

      const clutchGain = this.ctx.createGain();
      clutchGain.gain.setValueAtTime(0.22, thunkTime);
      clutchGain.gain.exponentialRampToValueAtTime(0.001, thunkTime + 0.065);

      clutchNoise.connect(clutchFilter);
      clutchFilter.connect(clutchGain);
      clutchGain.connect(this.compressor);

      clutchNoise.start(thunkTime);
      clutchNoise.stop(thunkTime + 0.07);
    }

    // Overrun exhaust burble on gear change
    setTimeout(() => {
      this.triggerCarburetorOverrun(0.65);
    }, 45);
  }

  /**
   * Authentic old carbureted exhaust overrun burble & unburnt fuel bubbling
   */
  triggerCarburetorOverrun(intensity = 0.8) {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;

    // Play real Jeep overrun audio sample if loaded
    if (this.jeepOverrunBuffer) {
      this.playBufferOneShot(this.jeepOverrunBuffer, 0.60 * intensity);
    }
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const popTime = now + i * 0.07 + Math.random() * 0.03;
      const freq = 65 + Math.random() * 45;

      const popOsc = this.ctx.createOscillator();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(freq, popTime);
      popOsc.frequency.exponentialRampToValueAtTime(25, popTime + 0.06);

      const popGain = this.ctx.createGain();
      popGain.gain.setValueAtTime(0.28 * intensity * (1.0 - i * 0.18), popTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.065);

      popOsc.connect(popGain);
      popGain.connect(this.compressor);

      popOsc.start(popTime);
      popOsc.stop(popTime + 0.07);
    }
  }

  /**
   * Radiator Cap Steam Hiss (When engine overheats or radiator takes front impact)
   */
  triggerRadiatorSteamHiss(intensity = 0.5) {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;
    if (!this.noiseBuffer) return;

    const steam = this.ctx.createBufferSource();
    steam.buffer = this.noiseBuffer;

    const steamFilter = this.ctx.createBiquadFilter();
    steamFilter.type = 'bandpass';
    steamFilter.frequency.setValueAtTime(2400 + Math.random() * 600, now);
    steamFilter.Q.setValueAtTime(2.0, now);

    const steamGain = this.ctx.createGain();
    steamGain.gain.setValueAtTime(0.18 * intensity, now);
    steamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    steam.connect(steamFilter);
    steamFilter.connect(steamGain);
    steamGain.connect(this.compressor);

    steam.start(now);
    steam.stop(now + 0.38);
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Triggers an authentic Twin-Turbo Blow-Off Valve (BOV) with Compressor Surge Flutter
   */
  triggerBlowOffValve(intensity = 1.0) {
    if (!this.ctx || !this.isInitialized) return;
    const now = this.ctx.currentTime;
    const boost = Math.min(1.0, Math.max(0.2, intensity));

    const ventNoise = this.ctx.createBufferSource();
    ventNoise.buffer = this.noiseBuffer;

    const ventFilter = this.ctx.createBiquadFilter();
    ventFilter.type = 'bandpass';
    ventFilter.frequency.setValueAtTime(4200, now);
    ventFilter.frequency.exponentialRampToValueAtTime(1600, now + 0.38);
    ventFilter.Q.setValueAtTime(2.8, now);

    const ventGain = this.ctx.createGain();
    ventGain.gain.setValueAtTime(0.35 * boost, now);
    ventGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    ventNoise.connect(ventFilter);
    ventFilter.connect(ventGain);
    ventGain.connect(this.compressor);

    ventNoise.start(now);
    ventNoise.stop(now + 0.45);

    const flutterPulses = 4;
    const pulseInterval = 0.048;

    for (let p = 0; p < flutterPulses; p++) {
      const pulseTime = now + 0.05 + p * pulseInterval;
      const pulseDecay = Math.pow(0.70, p);

      const chirpOsc = this.ctx.createOscillator();
      chirpOsc.type = 'triangle';
      chirpOsc.frequency.setValueAtTime(2400 - p * 120, pulseTime);
      chirpOsc.frequency.exponentialRampToValueAtTime(900, pulseTime + 0.04);

      const chirpGain = this.ctx.createGain();
      chirpGain.gain.setValueAtTime(0.18 * boost * pulseDecay, pulseTime);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.045);

      chirpOsc.connect(chirpGain);
      chirpGain.connect(this.compressor);

      chirpOsc.start(pulseTime);
      chirpOsc.stop(pulseTime + 0.05);

      const sputterNoise = this.ctx.createBufferSource();
      sputterNoise.buffer = this.noiseBuffer;

      const sputterFilter = this.ctx.createBiquadFilter();
      sputterFilter.type = 'bandpass';
      sputterFilter.frequency.setValueAtTime(3400 - p * 200, pulseTime);
      sputterFilter.Q.setValueAtTime(4.5, pulseTime);

      const sputterGain = this.ctx.createGain();
      sputterGain.gain.setValueAtTime(0.24 * boost * pulseDecay, pulseTime);
      sputterGain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.042);

      sputterNoise.connect(sputterFilter);
      sputterFilter.connect(sputterGain);
      sputterGain.connect(this.compressor);

      sputterNoise.start(pulseTime);
      sputterNoise.stop(pulseTime + 0.05);
    }
  }

  /**
   * Triggers realistic exhaust overrun crackles, backfire pops and bangs
   */
  triggerExhaustPop(volume = 0.8) {
    if (!this.ctx || !this.isInitialized) return;
    const now = this.ctx.currentTime;

    const popNoise = this.ctx.createBufferSource();
    popNoise.buffer = this.noiseBuffer;

    const popFilter = this.ctx.createBiquadFilter();
    popFilter.type = 'bandpass';
    popFilter.frequency.setValueAtTime(1800 + Math.random() * 800, now);
    popFilter.Q.setValueAtTime(1.5, now);

    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.28 * volume, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    popNoise.connect(popFilter);
    popFilter.connect(popGain);
    popGain.connect(this.compressor);

    popNoise.start(now);
    popNoise.stop(now + 0.05);

    const thudOsc = this.ctx.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(90, now);
    thudOsc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0.35 * volume, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    thudOsc.connect(thudGain);
    thudGain.connect(this.compressor);

    thudOsc.start(now);
    thudOsc.stop(now + 0.08);

    if (window.game && window.game.sportsCar) {
      window.game.sportsCar.triggerShiftSparksAndPop();
    }
  }

  update() {
    if (!this.isInitialized || !this.ctx || gameState.isMuted) {
      if (this.masterGain) this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const dt = this.lastUpdateTime > 0 ? Math.min(0.1, now - this.lastUpdateTime) : 0.016;
    this.lastUpdateTime = now;
    this.masterGain.gain.setValueAtTime(0.42, now);

    // Master Low-Pass Filter (Full-Spectrum Crystal-Clear 20kHz)
    if (this.awakeningFilter) {
      this.awakeningFilter.frequency.setTargetAtTime(20000, now, 0.08);
    }

    const currentRpm = gameState.engineRpm || 1000;
    const currentGear = gameState.gear || 1;
    const throttle = gameState.throttleInput || 0;
    const speed = Math.abs(gameState.speed || 0);
    const speedMph = gameState.speedMph || 0;
    const isBoosting = gameState.isBoosting && gameState.nitro > 0 && !gameState.isOverheated;

    // -------------------------------------------------------------
    // 0. Desert Ambience, Procedural Birdsong & Dream Atmosphere Synth
    // -------------------------------------------------------------
    const ambVolume = gameState.desertAmbienceVolume !== undefined ? gameState.desertAmbienceVolume : 1.0;
    
    // Continuous Ethereal Dream Pad Synth Modulation
    if (this.dreamGain) {
      const dreamOp = gameState.dreamWhiteOpacity !== undefined ? gameState.dreamWhiteOpacity : 1.0;
      const isIntro = gameState.isIntroActive || gameState.introState === 'orbit' || gameState.introState === 'transition';
      const targetDreamVol = isIntro ? Math.max(0.08, dreamOp * 0.42) : 0.0;
      this.dreamGain.gain.setTargetAtTime(targetDreamVol, now, 0.12);

      // Organic resonant LFO filter drift
      const filterFreq = 540 + Math.sin(now * 0.4) * 220 + Math.sin(now * 0.15) * 160;
      this.dreamFilter.frequency.setTargetAtTime(filterFreq, now, 0.12);

      // Periodic delicate celestial glass bell chimes while in the dream state
      if (isIntro && (dreamOp > 0.08 || gameState.introState === 'orbit')) {
        this.dreamShimmerTimer -= dt;
        if (this.dreamShimmerTimer <= 0) {
          this.triggerDreamShimmer(Math.max(0.6, dreamOp));
          this.dreamShimmerTimer = 0.8 + Math.random() * 1.4; // Chime note every 0.8 - 2.2s
        }
      }
    }

    // Desert breeze volume modulates smoothly with time and fades at high speeds
    const speedAttenuation = Math.max(0, 1.0 - (speedMph / 45));
    const targetBreezeVol = ambVolume * 0.18 * Math.max(0.15, speedAttenuation);
    if (this.desertBreezeGain) {
      this.desertBreezeGain.gain.setTargetAtTime(targetBreezeVol, now, 0.15);
      // Gentle wind breeze LFO drift
      const breezeLFO = Math.sin(now * 0.25) * 80 + Math.sin(now * 0.09) * 120;
      this.desertBreezeFilter.frequency.setTargetAtTime(340 + breezeLFO, now, 0.15);
    }

    // Trigger Dream Awakening Chord once upon entering the transition phase
    if (gameState.introState === 'transition' && !this.dreamChordPlayed) {
      this.dreamChordPlayed = true;
      this.playDreamRealizationChord();
    } else if (gameState.introState === 'orbit') {
      this.dreamChordPlayed = false;
    }

    // Periodic Procedural Birdsong scheduler (prominent during intro & low-speed driving)
    if (ambVolume > 0.1 && speedMph < 40) {
      this.birdTimer -= dt;
      if (this.birdTimer <= 0) {
        this.triggerProceduralBirdCall(Math.min(1.0, ambVolume * (1.0 - speedMph / 50)));
        this.birdTimer = 2.4 + Math.random() * 3.6; // Next bird call in 2.4-6.0 seconds
      }
    }

    // Real Ambient Rain Audio modulation
    const currentZone = ZONES[gameState.currentZoneIndex] || ZONES[0];
    const isRaining = gameState.debugRainMode === 'on' || (currentZone && currentZone.precipitation === 'rain');
    if (this.rainGain && this.ctx && this.ctx.state === 'running') {
      const targetRainVol = isRaining ? 0.38 : 0.0;
      this.rainGain.gain.setTargetAtTime(targetRainVol, now, 0.25);
      if (isRaining && !this.rainSource && this.rainBuffer) {
        this.startRainLoop();
      }
    }

    // -------------------------------------------------------------
    // 1. Manual Transmission Gear Shift & Throttle Lift Detection
    // -------------------------------------------------------------
    if (this.shiftCooldown > 0) {
      this.shiftCooldown -= dt;
    }

    if (currentGear !== this.lastGear) {
      // Trigger Heavy Mechanical Manual Gear Shift (Gate notch, dog teeth thunk, clutch bite)
      this.triggerManualGearShift(currentGear, this.lastGear);
      this.shiftCooldown = 0.40;
      this.lastGear = currentGear;
    }

    // Throttle Lift Carburetor Overrun (Unburnt fuel chugs & burble)
    if (this.lastThrottle > 0.60 && throttle < 0.15 && this.shiftCooldown <= 0) {
      this.triggerCarburetorOverrun(0.85);
      this.shiftCooldown = 0.45;
    }
    this.lastThrottle = throttle;

    // Realistic Engine Misfire / Cylinder Cutouts under heavy damage (< 15% integrity)
    const integrity = gameState.carIntegrity !== undefined ? gameState.carIntegrity : 100;
    if (integrity < 15 && throttle > 0.1 && speed > 1.5) {
      this.misfireTimer = (this.misfireTimer || 0.4) - dt;
      if (this.misfireTimer <= 0) {
        this.triggerEngineMisfire(1.0 - integrity / 15.0);
        this.misfireTimer = 0.22 + Math.random() * (integrity / 15.0 * 0.7 + 0.15);
      }
    }

    // Radiator Boiling Steam Hiss (When damaged < 40% or engine overheating)
    if ((integrity < 40 || gameState.engineHeat > 0.85) && Math.random() < 0.04) {
      this.triggerRadiatorSteamHiss(0.45);
    }

    // -------------------------------------------------------------
    // 2. 4WD Transfer Case & Straight-Cut Transmission Gear Whine
    // -------------------------------------------------------------
    const mode = gameState.driveMode || 'HIGH';
    const isLowGear = (mode === 'LOW' || mode === '4L' || gameState.gear === 1);

    // In low gear, straight-cut gear whine must not screech at high frequencies.
    // Drop to a deep 36-80 Hz mechanical mesh hum with attenuated volume so there is zero high-pitch buzz!
    const gearMeshFreq = isLowGear
      ? THREE.MathUtils.clamp(36 + (speed * 3.8) + (currentRpm / 5000) * 16, 36, 82)
      : THREE.MathUtils.clamp(160 + (speed * 18.5) + (currentRpm / 5000) * 80, 160, 1250);

    this.turboWhineOsc.frequency.setTargetAtTime(gearMeshFreq, now, 0.08);
    this.turboWhineFilter.frequency.setTargetAtTime(isLowGear ? gearMeshFreq * 1.2 : gearMeshFreq * 1.5, now, 0.08);

    const transferWhineVol = isLowGear
      ? Math.min(0.04, (speed / 35.0) * 0.03 + (throttle * 0.015)) // Subdued in low gear
      : Math.min(0.18, (speed / 35.0) * 0.14 + (throttle * 0.05));
    this.turboWhineGain.gain.setTargetAtTime(transferWhineVol, now, 0.08);

    // Chassis/Air Draught around Safari Roof Rack & Windshield
    this.turboAirFilter.frequency.setTargetAtTime(1400 + Math.min(1800, speed * 45), now, 0.10);
    const roofRackDraughtVol = Math.min(0.20, (speed / 40.0) * 0.18);
    this.turboAirGain.gain.setTargetAtTime(roofRackDraughtVol, now, 0.10);

    // -------------------------------------------------------------
    // 3. Low-Revving 4x4 Straight-6 / Inline-4 Engine Firing Modulation
    // -------------------------------------------------------------
    // 650 RPM idle -> ~4,500-5,000 RPM working redline
    const normRpm = THREE.MathUtils.clamp((currentRpm - 650) / 4200, 0.0, 1.0);
    const baseFreq = 24.0 + (normRpm * 88.0);

    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.osc2.frequency.setTargetAtTime(baseFreq * 1.009, now, 0.04);
    this.oscFire.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

    // In low gear, boost the deep engine iron-block pulse and sub-harmonic
    const fireGainVal = isLowGear ? (0.46 + throttle * 0.36) : (0.38 + throttle * 0.30);
    this.oscFireGain.gain.setTargetAtTime(fireGainVal, now, 0.05);

    // Mid-frequency valvetrain harmonic — soften in low gear to avoid buzzing
    this.osc3.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.04);
    const osc3Vol = isLowGear
      ? (0.10 + (normRpm * 0.06) + (throttle * 0.06))
      : (0.22 + (normRpm * 0.18) + (throttle * 0.12));
    this.osc3Gain.gain.setTargetAtTime(osc3Vol, now, 0.05);

    this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

    // Carburetor Throat Suction Gulp (Rich opening on throttle punch)
    this.intakeFilter.frequency.setTargetAtTime(
      280 + (normRpm * 380) + (throttle * 420), now, 0.05
    );
    this.intakeGain.gain.setTargetAtTime(
      Math.min(0.26, (normRpm * 0.14) + (throttle * 0.16)), now, 0.05
    );

    this.exhaustDelay.delayTime.setTargetAtTime(
      THREE.MathUtils.clamp(0.024 - (normRpm * 0.010), 0.012, 0.028), now, 0.08
    );
    this.exhaustWet.gain.setTargetAtTime(0.24 + throttle * 0.16, now, 0.05);

    // Deep Throaty Glasspack Tone (Low-Pass Filter ~ 240Hz idle to 620Hz at speed)
    const filterCutoff = 240 + (throttle * 320) + (normRpm * 260);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.04);

    // Ambient/Intro Idle Pacing & Master Procedural Engine Voice
    const isIntroOrbit = gameState.introState === 'orbit';
    const isEngineStalled = Boolean(gameState.isEngineStalled);

    if (isEngineStalled) {
      this.engineGain.gain.setTargetAtTime(0.0, now, 0.05);
    } else {
      const baseEngineIdle = isIntroOrbit ? 0.08 : 0.22;
      const engineVolume = baseEngineIdle + (throttle * 0.40) + (normRpm * 0.24);
      this.engineGain.gain.setTargetAtTime(engineVolume, now, 0.04);
    }

    // Procedural Exhaust Overrun Pops on Throttle Lift
    if (throttle < 0.08 && this.lastThrottle > 0.42 && currentRpm > 2400) {
      if (!this.lastOverrunTime || now - this.lastOverrunTime > 1.2) {
        this.lastOverrunTime = now;
        this.triggerExhaustPop(0.85);
        setTimeout(() => this.triggerExhaustPop(0.55), 130);
      }
    }

    // -------------------------------------------------------------
    // 4. Tire Scrub, Drift Squeal & Damaged Tire Rubbing (Dynamic Slip-Angle Synthesis)
    // -------------------------------------------------------------
    const slipSpeed = Math.abs(gameState.lateralSlipVelocity || 0);
    const isDrifting = gameState.isDrifting || (speed > 10 && Math.abs(gameState.steerInput || 0) > 0.4) || slipSpeed > 1.2;
    const rubFriction = (gameState.tireRubFriction || 0) * (speed / 20.0);
    const driftIntensity = isDrifting ? Math.min(1.0, (speed / 25.0) * 0.45 + (slipSpeed / 7.0) * 0.55) : 0;

    // Carbon-ceramic brake bite & tire scrub acoustic feedback on firm braking
    const brakeInput = gameState.brakeInput || 0;
    const isHardBraking = brakeInput > 0.25 && speed > 8;
    const brakeScrubVolume = isHardBraking ? Math.min(0.35, (brakeInput - 0.2) * (speed / 28.0) * 0.40) : 0;

    const tireVolume = Math.max(
      isDrifting ? Math.min(0.40, driftIntensity * 0.40) : Math.min(0.28, rubFriction * 0.35),
      brakeScrubVolume
    );
    this.tireGain.gain.setTargetAtTime(tireVolume, now, 0.05);

    // Dynamic pitch modulation based on physical tire lateral slip velocity & brake bite
    if (this.tireFilter && (isDrifting || isHardBraking)) {
      const targetPitch = isHardBraking
        ? 1500 + Math.min(900, speed * 15)
        : (1200 + Math.min(1600, slipSpeed * 130 + speed * 15));
      this.tireFilter.frequency.setTargetAtTime(targetPitch, now, 0.04);
    }

    // Mechanical Cylinder Misfires & Sputters
    if (gameState.engineMisfireActive && Math.random() < 0.30) {
      this.triggerEngineMisfire(0.85);
    }

    // -------------------------------------------------------------
    // 5. Aerodynamic High-Speed Wind Rush
    // -------------------------------------------------------------
    const windVolume = Math.min(0.25, Math.pow(speed / 80, 2) * 0.25);
    this.windGain.gain.setTargetAtTime(windVolume, now, 0.08);

    // -------------------------------------------------------------
    // 6. High-Pressure Nitro Jet Thruster & Rocket Rumble
    // -------------------------------------------------------------
    if (this.nitroGain && this.nitroRumbleGain) {
      const nitroTarget = isBoosting ? 0.32 : 0.0;
      this.nitroGain.gain.setTargetAtTime(nitroTarget, now, 0.04);
      this.nitroRumbleGain.gain.setTargetAtTime(isBoosting ? 0.38 : 0.0, now, 0.04);
      if (isBoosting) {
        this.nitroFilter.frequency.setTargetAtTime(1200 + (currentRpm / 9000) * 1600, now, 0.04);
        this.nitroRumbleOsc.frequency.setTargetAtTime(54 + (speed / 80) * 28, now, 0.04);
      }
    }

    // -------------------------------------------------------------
    // 7. Bare Alloy Rim Grinding Audio (when driving on blown tire)
    // -------------------------------------------------------------
    if (this.rimGain && this.rimMetalGain) {
      if (gameState.isTireBlown && speed > 0.5) {
        const rimVol = Math.min(0.55, 0.15 + (speed / 30.0) * 0.35);
        this.rimGain.gain.setTargetAtTime(rimVol, now, 0.05);
        this.rimMetalGain.gain.setTargetAtTime(rimVol * 0.22, now, 0.05);
        if (this.rimMetalOsc) {
          this.rimMetalOsc.frequency.setTargetAtTime(180 + speed * 12.0, now, 0.05);
        }
        if (this.rimFilter) {
          this.rimFilter.frequency.setTargetAtTime(750 + speed * 25.0, now, 0.05);
        }
      } else {
        this.rimGain.gain.setTargetAtTime(0.0, now, 0.08);
        this.rimMetalGain.gain.setTargetAtTime(0.0, now, 0.08);
      }
    }

    // -------------------------------------------------------------
    // 6. 4x4 Off-Road Transfer Case Whine & Skid Plate Rock Scrape
    // -------------------------------------------------------------
    if (this.transferWhineGain) {
      const mode = gameState.driveMode || 'HIGH';
      let targetWhineVol = 0.0;
      let whineFreq = 140;

      if (mode === 'LOW' || mode === '4L' || gameState.gear === 1) {
        // Authentic Jeep Low Range (4-Low / 1st gear):
        // Deep guttural planetary transfer case torque mesh (38 - 62 Hz).
        // Lowpass filtered with no high-pitch buzzing or harsh resonance.
        const driveLoad = Math.max(0.15, throttle * 0.85 + (speedMph / 28.0) * 0.45);
        targetWhineVol = Math.min(0.14, 0.03 + driveLoad * 0.09);
        whineFreq = 38.0 + (speedMph / 28.0) * 20.0 + (currentRpm / 5000.0) * 12.0;

        if (this.transferWhineFilter) {
          this.transferWhineFilter.type = 'lowpass';
          this.transferWhineFilter.frequency.setTargetAtTime(140 + (speedMph / 28.0) * 60, now, 0.08);
          this.transferWhineFilter.Q.setTargetAtTime(0.7, now, 0.08);
        }
      } else if (mode === 'MID' || gameState.gear === 2) {
        targetWhineVol = Math.min(0.06, throttle * 0.04 + (speedMph / 72.0) * 0.03);
        whineFreq = 95 + speedMph * 3.5;
        if (this.transferWhineFilter) {
          this.transferWhineFilter.type = 'lowpass';
          this.transferWhineFilter.frequency.setTargetAtTime(260, now, 0.08);
        }
      } else {
        // HIGH / 3rd gear
        targetWhineVol = Math.min(0.04, throttle * 0.03 + (speedMph / 120.0) * 0.02);
        whineFreq = 160 + speedMph * 2.0;
        if (this.transferWhineFilter) {
          this.transferWhineFilter.type = 'lowpass';
          this.transferWhineFilter.frequency.setTargetAtTime(320, now, 0.08);
        }
      }

      this.transferWhineGain.gain.setTargetAtTime(targetWhineVol, now, 0.08);
      if (this.transferWhineOsc1) this.transferWhineOsc1.frequency.setTargetAtTime(whineFreq, now, 0.08);
      if (this.transferWhineOsc2) this.transferWhineOsc2.frequency.setTargetAtTime(whineFreq * 1.45, now, 0.08);
    }

    if (this.skidScrapeGain) {
      const isScraping = !!gameState.skidPlateScraping;
      const targetScrapeVol = isScraping ? Math.min(0.35, 0.15 + (speed / 10.0) * 0.20) : 0.0;
      this.skidScrapeGain.gain.setTargetAtTime(targetScrapeVol, now, 0.04);
    }

    // Mountain Waterfalls Proximity Ambient Roar (Cougar Falls & Thunder Falls)
    if (this.waterfallGain) {
      let targetWfVol = 0.0;
      let closestFallT = 0.0;
      if (gameState.carPosition) {
        const cx = gameState.carPosition.x || 0;
        const cz = gameState.carPosition.z || 0;

        // 1. Cougar Falls (lat: -200, z: 1290 -> world: x: 191.3, z: 1312.1)
        const d1 = Math.hypot(cx - 191.3, cz - 1312.1);
        if (d1 < 190.0) {
          const f1 = Math.max(0, 1.0 - d1 / 190.0);
          if (f1 > closestFallT) closestFallT = f1;
        }

        // 2. Thunder Falls (lat: -275, z: 1485 -> world: x: 250.8, z: 1494.2)
        const d2 = Math.hypot(cx - 250.8, cz - 1494.2);
        if (d2 < 220.0) {
          const f2 = Math.max(0, 1.0 - d2 / 220.0);
          if (f2 > closestFallT) closestFallT = f2;
        }

        // 3. Bridalveil Falls Downhill Waterfall Grotto (lat: -132, z: 1142 -> world: x: 130.5, z: 1146.0)
        const d3 = Math.hypot(cx - 130.5, cz - 1146.0);
        if (d3 < 190.0) {
          const f3 = Math.max(0, 1.0 - d3 / 190.0);
          if (f3 > closestFallT) closestFallT = f3;
        }

        if (closestFallT > 0) {
          targetWfVol = closestFallT * closestFallT * 0.46;
          if (this.waterfallFilter) {
            this.waterfallFilter.frequency.setTargetAtTime(550 + closestFallT * 1300, now, 0.1);
          }
        }
      }
      this.waterfallGain.gain.setTargetAtTime(targetWfVol, now, 0.12);
    }

    // Cougar Creek Water Fording / Splash Audio
    if (this.streamWaterGain) {
      const inStream = gameState.surface === 'stream_water' || gameState.isInStream;
      const targetStreamVol = inStream ? Math.min(0.38, 0.12 + (speed / 12.0) * 0.26) : 0.0;
      this.streamWaterGain.gain.setTargetAtTime(targetStreamVol, now, 0.06);
    }
  }

  /**
   * Real Weather Audio Preloader & Routing
   * Preloads real recorded audio for rain ambience and thunderclaps.
   */
  setupRealWeatherAudio() {
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.rainGain.connect(this.compressor);

    this.rainBuffer = null;
    this.rainSource = null;
    this.thunderBuffers = [];

    // Preload real rain loop
    this.loadAudioBuffer('./audio/rain_loop.ogg').then(buf => {
      if (!buf) return;
      this.rainBuffer = buf;
      if (this.ctx && this.ctx.state === 'running') {
        const currentZone = ZONES[gameState.currentZoneIndex] || ZONES[0];
        const isRaining = gameState.debugRainMode === 'on' || (currentZone && currentZone.precipitation === 'rain');
        if (isRaining) this.startRainLoop();
      }
    }).catch(e => console.warn('Rain audio load:', e));

    // Preload real thunder claps
    ['./audio/thunder_1.ogg', './audio/thunder_2.ogg'].forEach((url, idx) => {
      this.loadAudioBuffer(url).then(buf => {
        if (buf) this.thunderBuffers.push(buf);
      }).catch(e => console.warn(`Thunder audio ${idx} load:`, e));
    });
  }

  async loadAudioBuffer(url) {
    if (!this.ctx) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuf);
    } catch (err) {
      console.warn('Audio buffer load failed for:', url, err);
      return null;
    }
  }

  startRainLoop() {
    if (!this.ctx || !this.rainBuffer || this.rainSource) return;
    try {
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = this.rainBuffer;
      this.rainSource.loop = true;
      this.rainSource.connect(this.rainGain);
      this.rainSource.start(0);
    } catch (e) {
      console.warn('Start rain loop error:', e);
    }
  }

  /**
   * Procedural Safari Jeep Audio System (100% Generated Web Audio Synthesis)
   * All audio is mathematically synthesized in real time with physics parameters.
   */
  setupRealJeepAudio() {
    // Backwards-compatible properties
    this.jeepIdleGain = this.ctx.createGain();
    this.jeepIdleGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.realIdleGain = this.jeepIdleGain;
    this.realEngineGain = this.ctx.createGain();
    this.realEngineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.jeepIdleBuffer = null;
    this.jeepIdleSource = null;
    this.jeepShiftBuffer = null;
    this.jeepStarterBuffer = null;
    this.jeepOverrunBuffer = null;
    this.jeepHornBuffer = null;
    this.realBuffers = {};
    this.realSources = {};
  }

  /**
   * Procedural 4x4 Off-Road Audio Synthesizer:
   * - 4L Straight-Cut Low-Range Spur Gear Whine
   * - Skid Plate & Rock Surface Scrape Filter
   * - Mechanical Transfer Case Shift Clunk
   */
  setupOffRoadAudio() {
    if (!this.ctx) return;

    try {
      // 1. Low-Range Transfer Case Gear Whine (Deep mechanical crawl rumble, warm lowpass)
      this.transferWhineOsc1 = this.ctx.createOscillator();
      this.transferWhineOsc1.type = 'triangle';
      this.transferWhineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.transferWhineOsc2 = this.ctx.createOscillator();
      this.transferWhineOsc2.type = 'sine';
      this.transferWhineOsc2.frequency.setValueAtTime(65, this.ctx.currentTime);

      this.transferWhineFilter = this.ctx.createBiquadFilter();
      this.transferWhineFilter.type = 'lowpass';
      this.transferWhineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.transferWhineFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.transferWhineGain = this.ctx.createGain();
      this.transferWhineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.transferWhineOsc1.connect(this.transferWhineFilter);
      this.transferWhineOsc2.connect(this.transferWhineFilter);
      this.transferWhineFilter.connect(this.transferWhineGain);
      this.transferWhineGain.connect(this.compressor);

      this.transferWhineOsc1.start();
      this.transferWhineOsc2.start();

      // 2. Skid Plate & Rock Scrape Synthesizer (Filtered noise + metallic crunch)
      this.skidScrapeGain = this.ctx.createGain();
      this.skidScrapeGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      if (this.noiseBuffer) {
        this.skidNoiseSource = this.ctx.createBufferSource();
        this.skidNoiseSource.buffer = this.noiseBuffer;
        this.skidNoiseSource.loop = true;

        this.skidNoiseFilter = this.ctx.createBiquadFilter();
        this.skidNoiseFilter.type = 'bandpass';
        this.skidNoiseFilter.frequency.setValueAtTime(580, this.ctx.currentTime);
        this.skidNoiseFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

        this.skidNoiseSource.connect(this.skidNoiseFilter);
        this.skidNoiseFilter.connect(this.skidScrapeGain);
        this.skidNoiseSource.start();
      }
      this.skidScrapeGain.connect(this.compressor);

      // 3. Cougar Falls Canyon Waterfall Ambient Roar
      this.waterfallGain = this.ctx.createGain();
      this.waterfallGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      if (this.noiseBuffer) {
        this.waterfallNoiseSource = this.ctx.createBufferSource();
        this.waterfallNoiseSource.buffer = this.noiseBuffer;
        this.waterfallNoiseSource.loop = true;

        this.waterfallFilter = this.ctx.createBiquadFilter();
        this.waterfallFilter.type = 'lowpass';
        this.waterfallFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
        this.waterfallFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

        this.waterfallNoiseSource.connect(this.waterfallFilter);
        this.waterfallFilter.connect(this.waterfallGain);
        this.waterfallGain.connect(this.compressor);
        this.waterfallNoiseSource.start();
      }

      // 4. Cougar Creek Water Fording / Splashing Synth
      this.streamWaterGain = this.ctx.createGain();
      this.streamWaterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      if (this.noiseBuffer) {
        this.streamNoiseSource = this.ctx.createBufferSource();
        this.streamNoiseSource.buffer = this.noiseBuffer;
        this.streamNoiseSource.loop = true;

        this.streamFilter = this.ctx.createBiquadFilter();
        this.streamFilter.type = 'bandpass';
        this.streamFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        this.streamFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        this.streamNoiseSource.connect(this.streamFilter);
        this.streamFilter.connect(this.streamWaterGain);
        this.streamWaterGain.connect(this.compressor);
        this.streamNoiseSource.start();
      }
    } catch (e) {
      console.warn('Off-Road Audio Setup error:', e);
    }
  }

  playStreamSplash() {
    if (!this.ctx || gameState.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  playMudSplash() {
    if (!this.ctx || gameState.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy wet squelch and muddy sludge churn
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.42);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(90, now + 0.40);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.43);
    } catch (e) {}
  }

  triggerSuspensionBottomOut(intensity = 1.0) {
    if (!this.ctx || gameState.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Harsh metallic chassis frame bottom-out clack + spring rebound crunch
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190 + Math.random() * 60, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.26);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, now);
      filter.Q.setValueAtTime(2.2, now);

      const gain = this.ctx.createGain();
      const vol = THREE.MathUtils.clamp(0.40 * intensity, 0.25, 0.70);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.30);
    } catch (e) {}
  }

  triggerSkidPlateScrape(speed = 5.0) {
    if (!this.ctx || gameState.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Procedural metallic rock crunch
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

      const gain = this.ctx.createGain();
      const intensity = THREE.MathUtils.clamp(speed / 15.0, 0.18, 0.45);
      gain.gain.setValueAtTime(intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Audio safety
    }
  }

  triggerTransferCaseShift(newMode = '4L') {
    if (!this.ctx || gameState.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Mechanical transfer case shift lever gate notch & clunk
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const isLow = (newMode === 'LOW' || newMode === '4L' || newMode === 1);
      const baseFreq = isLow ? 135 : 175;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.52, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      // Audio safety
    }
  }

  checkAndStartRealAudioLoops() {
    // No-op: Procedural engine handles all audio synthesis dynamically
  }

  startJeepIdleLoop() {
    // No-op: Procedural engine voice runs continuously in setupProceduralEngine()
  }

  playBufferOneShot(buffer, volume = 1.0, playbackRate = 1.0) {
    if (!this.ctx || !buffer || this.ctx.state !== 'running' || gameState.isMuted) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = playbackRate;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      src.connect(gain);
      gain.connect(this.compressor);
      src.start(0);
    } catch (e) {
      console.warn('One-shot audio play error:', e);
    }
  }

  /**
   * Procedural Dual-Tone Vintage 4x4 Horn Synthesizer
   * Dual brass acoustic resonators (F4 ~435Hz, F3 ~345Hz + overtone) with realistic attack/decay
   */
  triggerJeepHorn() {
    if (!this.ctx || !this.isInitialized || gameState.isMuted) return;
    const now = this.ctx.currentTime;

    const tones = [
      { freq: 435, vol: 0.38, type: 'sawtooth' },
      { freq: 345, vol: 0.34, type: 'sawtooth' },
      { freq: 870, vol: 0.12, type: 'triangle' }
    ];

    const hornBus = this.ctx.createGain();
    hornBus.gain.setValueAtTime(0.001, now);
    hornBus.gain.linearRampToValueAtTime(0.70, now + 0.025);
    hornBus.gain.setValueAtTime(0.70, now + 0.38);
    hornBus.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    const hornFilter = this.ctx.createBiquadFilter();
    hornFilter.type = 'bandpass';
    hornFilter.frequency.setValueAtTime(520, now);
    hornFilter.Q.setValueAtTime(2.0, now);

    hornBus.connect(hornFilter);
    hornFilter.connect(this.compressor);

    tones.forEach(({ freq, vol, type }) => {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, now);
      osc.connect(g);
      g.connect(hornBus);
      osc.start(now);
      osc.stop(now + 0.54);
    });
  }

  /**
   * Real Recorded & Procedural Multi-Stage Rolling Thunder
   * Simulates supersonic ionization snap, sub-bass pressure wave,
   * and long-decay mountain acoustic reverberation.
   */
  triggerThunder(strikeDistance = 600, panX = 0) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;

    // Delay based on speed of sound (340 m/s)
    const delaySec = Math.max(0.12, Math.min(2.2, strikeDistance / 650));

    setTimeout(() => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Stereo Panner
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(Math.max(-0.85, Math.min(0.85, panX)), now);
      }

      // Master Thunder Bus
      const thunderBus = this.ctx.createGain();
      thunderBus.gain.setValueAtTime(1.15, now);
      if (panner) {
        thunderBus.connect(panner);
        panner.connect(this.compressor);
      } else {
        thunderBus.connect(this.compressor);
      }

      // 1. Play Real Thunder Recording if loaded
      if (this.thunderBuffers && this.thunderBuffers.length > 0) {
        const buf = this.thunderBuffers[Math.floor(Math.random() * this.thunderBuffers.length)];
        const source = this.ctx.createBufferSource();
        source.buffer = buf;
        source.connect(thunderBus);
        source.start(now);
        return;
      }

      // 2. Procedural Synthesis Fallback
      // Stage 1: Sharp Ionization Crack / Shockwave snap
      const snapNoise = this.ctx.createBufferSource();
      snapNoise.buffer = this.noiseBuffer;
      const snapFilter = this.ctx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(1200, now);
      snapFilter.Q.setValueAtTime(2.5, now);
      const snapGain = this.ctx.createGain();
      snapGain.gain.setValueAtTime(0.0, now);
      snapGain.gain.linearRampToValueAtTime(0.45, now + 0.015);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      snapNoise.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(thunderBus);
      snapNoise.start(now);
      snapNoise.stop(now + 0.20);

      // Stage 2: Sub-Bass Body Boom (35Hz - 85Hz Sine drop)
      const subBoom = this.ctx.createOscillator();
      subBoom.type = 'sine';
      subBoom.frequency.setValueAtTime(95, now);
      subBoom.frequency.exponentialRampToValueAtTime(38, now + 0.45);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.0, now);
      subGain.gain.linearRampToValueAtTime(0.55, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      subBoom.connect(subGain);
      subGain.connect(thunderBus);
      subBoom.start(now);
      subBoom.stop(now + 1.25);

      // Stage 3: Low-Frequency Mountain Rolling Rumble (Decaying over 4.2s)
      const rumbleNoise = this.ctx.createBufferSource();
      rumbleNoise.buffer = this.noiseBuffer;
      rumbleNoise.loop = true;
      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(140, now);
      rumbleFilter.frequency.linearRampToValueAtTime(80, now + 3.5);
      rumbleFilter.Q.setValueAtTime(4.0, now);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.0, now);
      rumbleGain.gain.linearRampToValueAtTime(0.50, now + 0.12);
      rumbleGain.gain.setValueAtTime(0.38, now + 0.8);
      rumbleGain.gain.setValueAtTime(0.44, now + 1.6);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.2);

      rumbleNoise.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(thunderBus);
      rumbleNoise.start(now);
      rumbleNoise.stop(now + 4.5);
    }, delaySec * 1000);
  }

  /**
   * Procedural Crash, Metal Crumple & Glass Shatter Audio Synthesizer
   */
  triggerCrash(stage = 1) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Sub-Bass Heavy Kinetic Impact Slam
    const impactOsc = this.ctx.createOscillator();
    impactOsc.type = 'sine';
    impactOsc.frequency.setValueAtTime(140, now);
    impactOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    const impactGain = this.ctx.createGain();
    impactGain.gain.setValueAtTime(0.75, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    impactOsc.connect(impactGain);
    impactGain.connect(this.compressor);
    impactOsc.start(now);
    impactOsc.stop(now + 0.50);

    // 2. Distorted Metal Crumple & Sheet Metal Crunch
    const crunchNoise = this.ctx.createBufferSource();
    crunchNoise.buffer = this.noiseBuffer;
    const crunchFilter = this.ctx.createBiquadFilter();
    crunchFilter.type = 'bandpass';
    crunchFilter.frequency.setValueAtTime(650, now);
    crunchFilter.frequency.linearRampToValueAtTime(320, now + 0.28);
    crunchFilter.Q.setValueAtTime(3.5, now);

    const crunchGain = this.ctx.createGain();
    crunchGain.gain.setValueAtTime(0.60, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    crunchNoise.connect(crunchFilter);
    crunchFilter.connect(crunchGain);
    crunchGain.connect(this.compressor);
    crunchNoise.start(now);
    crunchNoise.stop(now + 0.40);

    // 3. Glass Shatter & Crystalline Tinkle (Stage 2 & 3 Heavy Impacts)
    if (stage >= 2) {
      const glassNoise = this.ctx.createBufferSource();
      glassNoise.buffer = this.noiseBuffer;
      const glassFilter = this.ctx.createBiquadFilter();
      glassFilter.type = 'highpass';
      glassFilter.frequency.setValueAtTime(3200, now);

      const glassGain = this.ctx.createGain();
      glassGain.gain.setValueAtTime(0.40, now + 0.04);
      glassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      glassNoise.connect(glassFilter);
      glassFilter.connect(glassGain);
      glassGain.connect(this.compressor);
      glassNoise.start(now + 0.04);
      glassNoise.stop(now + 0.60);

      // Resonant Glass Crystal Shards
      [2400, 3600, 4800].forEach((freq, idx) => {
        const ping = this.ctx.createOscillator();
        ping.type = 'sine';
        ping.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 200, now + idx * 0.03);
        const pingGain = this.ctx.createGain();
        pingGain.gain.setValueAtTime(0.18, now + idx * 0.03);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.25);
        ping.connect(pingGain);
        pingGain.connect(this.compressor);
        ping.start(now + idx * 0.03);
        ping.stop(now + idx * 0.03 + 0.30);
      });
    }
  }

  /**
   * Sputtering Exhaust / Engine Cylinder Misfire Sound
   */
  triggerEngineMisfire(severity = 0.5) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    if (this.noiseBuffer) {
      const pop = this.ctx.createBufferSource();
      pop.buffer = this.noiseBuffer;

      const popFilter = this.ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(260 + Math.random() * 220, now);
      popFilter.Q.setValueAtTime(3.5, now);

      const popGain = this.ctx.createGain();
      popGain.gain.setValueAtTime(0.38 * severity, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      pop.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.compressor);

      pop.start(now);
      pop.stop(now + 0.09);
    }
  }

  /**
   * Procedural Latch Pop & Hinge Creak Audio (When parts unlatch and start hanging off)
   */
  triggerPartLoosen(partType = 'door') {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Metallic ping / latch pop
    const popOsc = this.ctx.createOscillator();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(partType.startsWith('mirror') ? 950 : 420, now);
    popOsc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.35, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    popOsc.connect(popGain);
    popGain.connect(this.compressor);
    popOsc.start(now);
    popOsc.stop(now + 0.10);

    // Subtle metal creak / rattle
    if (this.noiseBuffer) {
      const creak = this.ctx.createBufferSource();
      creak.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(4.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      creak.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      creak.start(now);
      creak.stop(now + 0.16);
    }
  }

  /**
   * Procedural Metal Shearing & Panel Snap Audio (Mirrors, Doors, Wings, Hood)
   */
  triggerPartDetach(partType = 'door') {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Sharp Metal Bolt Snap Impulse
    const snapOsc = this.ctx.createOscillator();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(partType === 'mirror' ? 1400 : 750, now);
    snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.48, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    snapOsc.connect(snapGain);
    snapGain.connect(this.compressor);
    snapOsc.start(now);
    snapOsc.stop(now + 0.15);

    // 2. Shearing Noise Crunch & Clatter
    if (this.noiseBuffer) {
      const crunch = this.ctx.createBufferSource();
      crunch.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      crunch.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      crunch.start(now);
      crunch.stop(now + 0.30);
    }
  }

  /**
   * Pneumatic Tire Blowout & Rubber Separation Audio
   */
  triggerTireBlowout() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Explosive Pneumatic Blast
    const blastOsc = this.ctx.createOscillator();
    blastOsc.type = 'sine';
    blastOsc.frequency.setValueAtTime(160, now);
    blastOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    const blastGain = this.ctx.createGain();
    blastGain.gain.setValueAtTime(0.85, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

    blastOsc.connect(blastGain);
    blastGain.connect(this.compressor);
    blastOsc.start(now);
    blastOsc.stop(now + 0.42);

    // 2. High-Pressure Air Hiss & Shredded Rubber Pop
    if (this.noiseBuffer) {
      const hiss = this.ctx.createBufferSource();
      hiss.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);

      hiss.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      hiss.start(now);
      hiss.stop(now + 0.52);
    }
  }

  /**
   * Roadside Mechanic Shop Service Bay Audio (Pneumatic Wrench + Hydraulic Hiss + Restored Chime)
   */
  triggerServiceBaySound() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Pneumatic Air Wrench Rattle (4 rapid bursts: "Zzzt! Zzzt! Zzzt! Zzzt!")
    for (let b = 0; b < 4; b++) {
      const burstTime = now + b * 0.14;
      const wrenchNoise = this.ctx.createBufferSource();
      wrenchNoise.buffer = this.noiseBuffer;
      const wrenchFilter = this.ctx.createBiquadFilter();
      wrenchFilter.type = 'bandpass';
      wrenchFilter.frequency.setValueAtTime(1550 + (b % 2) * 200, burstTime);
      wrenchFilter.Q.setValueAtTime(4.2, burstTime);

      const wrenchGain = this.ctx.createGain();
      wrenchGain.gain.setValueAtTime(0.40, burstTime);
      wrenchGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.11);

      wrenchNoise.connect(wrenchFilter);
      wrenchFilter.connect(wrenchGain);
      wrenchGain.connect(this.compressor);
      wrenchNoise.start(burstTime);
      wrenchNoise.stop(burstTime + 0.13);
    }

    // 2. Hydraulic Lift Pressure Release Hiss
    if (this.noiseBuffer) {
      const hissTime = now + 0.6;
      const hiss = this.ctx.createBufferSource();
      hiss.buffer = this.noiseBuffer;
      const hissFilter = this.ctx.createBiquadFilter();
      hissFilter.type = 'highpass';
      hissFilter.frequency.setValueAtTime(3200, hissTime);
      const hissGain = this.ctx.createGain();
      hissGain.gain.setValueAtTime(0.18, hissTime);
      hissGain.gain.exponentialRampToValueAtTime(0.001, hissTime + 0.45);

      hiss.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(this.compressor);
      hiss.start(hissTime);
      hiss.stop(hissTime + 0.48);
    }

    // 3. High-Grade Celestial Repair Completion Chime (C6 - E6 - G6 - C7 arpeggio)
    const chimeFreqs = [1046.5, 1318.5, 1567.98, 2093.0];
    chimeFreqs.forEach((freq, idx) => {
      const chimeTime = now + 0.75 + idx * 0.09;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chimeTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.26, chimeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.85);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(chimeTime);
      osc.stop(chimeTime + 0.90);
    });
  }

  /**
   * Pneumatic Impact Wheel Gun Rapid Burst (RAT-TAT-TAT-TAT!)
   */
  triggerPneumaticImpactGun(duration = 0.45) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const burstCount = Math.floor(duration / 0.055);

    for (let i = 0; i < burstCount; i++) {
      const t = now + i * 0.055;
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800 + (i % 3) * 250, t);
        filter.Q.setValueAtTime(5.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.38, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.compressor);
        noise.start(t);
        noise.stop(t + 0.05);
      }

      // Metallic impact click
      const click = this.ctx.createOscillator();
      click.type = 'square';
      click.frequency.setValueAtTime(320 + (i % 2) * 80, t);
      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.22, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      click.connect(clickGain);
      clickGain.connect(this.compressor);
      click.start(t);
      click.stop(t + 0.04);
    }
  }

  /**
   * Hydraulic Lift Motor Ascent / Descent Whir
   */
  triggerHydraulicLiftWhir(isAscending = true) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const startFreq = isAscending ? 65 : 120;
    const endFreq = isAscending ? 135 : 55;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(endFreq, now + 1.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain.gain.setValueAtTime(0.25, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    osc.start(now);
    osc.stop(now + 2.0);
  }

  /**
   * Metallic Socket / Wrench Clank Sound
   */
  triggerToolClank() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    [0, 0.08].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 1420 : 980, now + offset);
      osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now + offset);
      osc.stop(now + offset + 0.20);
    });
  }

  /**
   * Engine Revving & Exhaust Pop upon Overhaul Completion
   */
  triggerOverhaulRevSound() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Dual-tone engine rev
    [110, 220].forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 3.2, now + 0.45);
      osc.frequency.exponentialRampToValueAtTime(f * 1.4, now + 1.1);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.linearRampToValueAtTime(2400, now + 0.45);
      filter.frequency.linearRampToValueAtTime(500, now + 1.1);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 1.25);
    });

    // Exhaust pop
    if (this.noiseBuffer) {
      const popTime = now + 0.48;
      const pop = this.ctx.createBufferSource();
      pop.buffer = this.noiseBuffer;
      const popFilter = this.ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(800, popTime);
      popFilter.Q.setValueAtTime(2.0, popTime);
      const popGain = this.ctx.createGain();
      popGain.gain.setValueAtTime(0.45, popTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.12);
      pop.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.compressor);
      pop.start(popTime);
      pop.stop(popTime + 0.15);
    }
  }

  /**
   * Roadside Tow Truck Dispatch Audio (Radio static burst + Two-tone flatbed horn + Winch motor)
   */
  triggerTowTruckSound() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Radio Static Click / Squelch
    if (this.noiseBuffer) {
      const squelch = this.ctx.createBufferSource();
      squelch.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(3.0, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      squelch.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      squelch.start(now);
      squelch.stop(now + 0.20);
    }

    // 2. Heavy Tow Truck Horn (Two-tone diesel blast)
    const hornFreqs = [220, 277.18]; // A3 & C#4
    hornFreqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + 0.15);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now + 0.15);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      osc.start(now + 0.15);
      osc.stop(now + 0.90);
    });

    // 3. Hydraulic Winch Cable Pull Sound
    const winchOsc = this.ctx.createOscillator();
    winchOsc.type = 'triangle';
    winchOsc.frequency.setValueAtTime(120, now + 0.7);
    winchOsc.frequency.linearRampToValueAtTime(240, now + 1.4);
    const winchGain = this.ctx.createGain();
    winchGain.gain.setValueAtTime(0.18, now + 0.7);
    winchGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    winchOsc.connect(winchGain);
    winchGain.connect(this.compressor);
    winchOsc.start(now + 0.7);
    winchOsc.stop(now + 1.55);
  }

  /**
   * Air Brake Pneumatic Hiss Sound (Commercial Truck Braking)
   */
  triggerAirBrakeSound() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    if (this.noiseBuffer) {
      const hiss = this.ctx.createBufferSource();
      hiss.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(1.8, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      hiss.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      hiss.start(now);
      hiss.stop(now + 0.70);
    }
  }

  /**
   * Heavy Steel Hitch Latch & Tow Chain Lock Sound
   */
  triggerTowHitchLockSound() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Dual metallic impacts
    [0, 0.12].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 540 : 380, now + offset);
      osc.frequency.exponentialRampToValueAtTime(80, now + offset + 0.25);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now + offset);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.30);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      osc.start(now + offset);
      osc.stop(now + offset + 0.35);
    });
  }

  /**
   * Radar Detector Proximity Warning Beep (2.8 kHz Ka-Band Pulse)
   */
  triggerRadarAlert(distanceMeters = 300) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this._lastRadarBeep && (now - this._lastRadarBeep) < Math.max(0.12, distanceMeters / 600)) {
      return;
    }
    this._lastRadarBeep = now;

    const beep = this.ctx.createOscillator();
    beep.type = 'square';
    beep.frequency.setValueAtTime(2850, now);

    const beepFilter = this.ctx.createBiquadFilter();
    beepFilter.type = 'bandpass';
    beepFilter.frequency.setValueAtTime(2850, now);
    beepFilter.Q.setValueAtTime(6.0, now);

    const beepGain = this.ctx.createGain();
    beepGain.gain.setValueAtTime(0.22, now);
    beepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    beep.connect(beepFilter);
    beepFilter.connect(beepGain);
    beepGain.connect(this.compressor);
    beep.start(now);
    beep.stop(now + 0.06);
  }

  /**
   * Critical Vehicle Damage Emergency Dashboard Chime
   */
  triggerCriticalDamageAlert() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this._lastCritChime && (now - this._lastCritChime) < 4.0) return;
    this._lastCritChime = now;

    [
      { freq: 880, delay: 0 },
      { freq: 587, delay: 0.14 },
      { freq: 880, delay: 0.28 },
      { freq: 587, delay: 0.42 }
    ].forEach(tone => {
      const tStart = now + tone.delay;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(tone.freq, tStart);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, tStart);
      gain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.12);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(tStart);
      osc.stop(tStart + 0.13);
    });
  }

  /**
   * Police Pursuit Cruiser Siren Synthesizer
   */
  startPoliceSiren() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running' || this.sirenActive) return;
    this.sirenActive = true;
    const now = this.ctx.currentTime;

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0.0, now);
    this.sirenGain.gain.linearRampToValueAtTime(0.35, now + 0.4);
    this.sirenGain.connect(this.compressor);

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(720, now);

    this.sirenLfo = this.ctx.createOscillator();
    this.sirenLfo.type = 'sine';
    this.sirenLfo.frequency.setValueAtTime(0.65, now); // Wail cycle: ~1.5s period

    this.sirenLfoGain = this.ctx.createGain();
    this.sirenLfoGain.gain.setValueAtTime(420, now); // Modulates 720 +/- 420Hz (300Hz to 1140Hz)

    this.sirenLfo.connect(this.sirenLfoGain);
    this.sirenLfoGain.connect(this.sirenOsc.frequency);

    this.sirenFilter = this.ctx.createBiquadFilter();
    this.sirenFilter.type = 'lowpass';
    this.sirenFilter.frequency.setValueAtTime(2600, now);

    this.sirenOsc.connect(this.sirenFilter);
    this.sirenFilter.connect(this.sirenGain);

    this.sirenOsc.start(now);
    this.sirenLfo.start(now);

    this.triggerPoliceRadio();
  }

  updatePoliceSiren(dist = 50, isAttacking = false) {
    if (!this.sirenActive || !this.ctx || !this.sirenGain) return;
    const now = this.ctx.currentTime;
    
    // Distance attenuation: loud up close (0.42), muffled far away (0.05)
    const normDist = Math.max(0, Math.min(1, dist / 220));
    const targetGain = isAttacking ? 0.45 : (0.40 * (1 - normDist * 0.85) + 0.05);
    this.sirenGain.gain.setTargetAtTime(targetGain, now, 0.15);

    // If attacking / close, switch to high-urgency fast yelp mode
    if (this.sirenLfo) {
      const targetLfoFreq = isAttacking || dist < 20 ? 1.8 : (0.65 + (1 - normDist) * 0.4);
      this.sirenLfo.frequency.setTargetAtTime(targetLfoFreq, now, 0.2);
    }

    if (this.sirenFilter) {
      const targetFilterFreq = 1200 + (1 - normDist) * 2000;
      this.sirenFilter.frequency.setTargetAtTime(targetFilterFreq, now, 0.2);
    }
  }

  stopPoliceSiren() {
    if (!this.sirenActive || !this.ctx) return;
    this.sirenActive = false;
    const now = this.ctx.currentTime;
    if (this.sirenGain) {
      this.sirenGain.gain.linearRampToValueAtTime(0.0, now + 0.35);
      setTimeout(() => {
        try {
          if (this.sirenOsc) this.sirenOsc.stop();
          if (this.sirenLfo) this.sirenLfo.stop();
        } catch (e) {}
      }, 400);
    }
  }

  /**
   * Procedural Police Radio Dispatch Beep & Mic-Click
   */
  triggerPoliceRadio() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Dual-tone dispatch chime (960Hz -> 1440Hz)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const radioGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1240, now + 0.07);
    osc2.frequency.setValueAtTime(1100, now);
    osc2.frequency.setValueAtTime(1480, now + 0.07);

    radioGain.gain.setValueAtTime(0.0, now);
    radioGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    radioGain.gain.setValueAtTime(0.18, now + 0.14);
    radioGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(radioGain);
    osc2.connect(radioGain);
    radioGain.connect(this.compressor);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.23);
    osc2.stop(now + 0.23);
  }

  /**
   * Heavy Police Ramming & Metal Crash Sound FX
   */
  triggerPoliceRam(severity = 1.0) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Sub-bass kinetic thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    subGain.gain.setValueAtTime(0.55 * severity, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

    subOsc.connect(subGain);
    subGain.connect(this.compressor);
    subOsc.start(now);
    subOsc.stop(now + 0.42);

    // 2. Metal scrape / crunch noise burst
    if (this.noiseBuffer) {
      const crunch = this.ctx.createBufferSource();
      crunch.buffer = this.noiseBuffer;

      const crunchFilter = this.ctx.createBiquadFilter();
      crunchFilter.type = 'bandpass';
      crunchFilter.frequency.setValueAtTime(1400, now);
      crunchFilter.frequency.exponentialRampToValueAtTime(350, now + 0.4);
      crunchFilter.Q.setValueAtTime(3.5, now);

      const crunchGain = this.ctx.createGain();
      crunchGain.gain.setValueAtTime(0.48 * severity, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      crunch.connect(crunchFilter);
      crunchFilter.connect(crunchGain);
      crunchGain.connect(this.compressor);
      crunch.start(now);
      crunch.stop(now + 0.48);
    }
  }

  /**
   * Epic Cop Takedown / Interceptor Wreck Sound FX
   */
  triggerCopTakedown() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Massive explosion sub-bass impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(24, now + 0.85);

    subGain.gain.setValueAtTime(0.75, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.90);

    subOsc.connect(subGain);
    subGain.connect(this.compressor);
    subOsc.start(now);
    subOsc.stop(now + 0.95);

    // 2. Heavy metal crunch and rolling debris noise
    if (this.noiseBuffer) {
      const crunch = this.ctx.createBufferSource();
      crunch.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.70, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      crunch.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      crunch.start(now);
      crunch.stop(now + 0.90);
    }

    // 3. Siren death pitch drop / power-down whine
    const whine = this.ctx.createOscillator();
    const whineGain = this.ctx.createGain();
    whine.type = 'sine';
    whine.frequency.setValueAtTime(950, now);
    whine.frequency.exponentialRampToValueAtTime(80, now + 0.7);

    whineGain.gain.setValueAtTime(0.40, now);
    whineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    whine.connect(whineGain);
    whineGain.connect(this.compressor);
    whine.start(now);
    whine.stop(now + 0.80);
  }

  /**
   * Busted Doom Sound
   */
  triggerPoliceBusted() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(140, now);
    bass.frequency.exponentialRampToValueAtTime(30, now + 1.2);

    bassGain.gain.setValueAtTime(0.6, now);
    bassGain.gain.linearRampToValueAtTime(0.4, now + 0.6);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    bass.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(this.compressor);

    bass.start(now);
    bass.stop(now + 1.35);
  }

  /**
   * Near-Miss Slipstream Doppler Pass
   */
  triggerNearMiss() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const whoosh = this.ctx.createBufferSource();
    whoosh.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.35);
    filter.Q.setValueAtTime(2.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    whoosh.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    whoosh.start(now);
    whoosh.stop(now + 0.40);
  }

  /**
   * ⚙️ Drivetrain Terrain / Weather Advisor Alert Chime
   * Soft dual-tone cockpit notification chime (D5 -> A5 / 587Hz -> 880Hz)
   */
  triggerDrivetrainAlertSound() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    [587.33, 880.0].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.10);

      gain.gain.setValueAtTime(0.0, now + i * 0.10);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.10 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.10 + 0.30);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(now + i * 0.10);
      osc.stop(now + i * 0.10 + 0.35);
    });
  }

  /**
   * 📖 Scenic Heritage Historical Plaque Discovery Chime
   * Warm acoustic multi-harmonic bell chime on opening a historical archive
   */
  playHistoryPlaqueChime() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Harmonic bell frequencies (E Major 9 / Dreamy West Coast Chord: E5, G#5, B5, D#6, F#6)
    const notes = [659.25, 830.61, 987.77, 1244.51, 1479.98];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0.001, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.18 / (i + 1), now + i * 0.05 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 1.6);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 1.7);
    });
  }

  /**
   * Historical Archive Dismiss Chime
   */
  playHistoryCloseChime() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(440.0, now + 0.15); // A4

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.compressor);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * 🅿️ Scenic Highway Turnout Advance Warning Chime
   * Bright, optimistic navigational discovery chime when approaching a scenic overlook
   */
  playScenicDiscoveryChime() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Navigational chime: C#5 (554.37) -> F#5 (739.99) -> G#5 (830.61) -> C#6 (1108.73)
    const notes = [554.37, 739.99, 830.61, 1108.73];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.001, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.16 / (i * 0.5 + 1), now + i * 0.07 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 1.2);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 1.3);
    });
  }

  /**
   * 🪙 Coin-Operated Scenic Binoculars: Coin Insertion & Optical Shutter Open
   * Metallic coin slide ping, internal mechanical ratchet latch, and aperture shutter snap
   */
  playBinocularCoinDrop() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. High Metallic Coin Ping (2450 Hz)
    const coinOsc = this.ctx.createOscillator();
    const coinGain = this.ctx.createGain();
    coinOsc.type = 'sine';
    coinOsc.frequency.setValueAtTime(2450, now);
    coinOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
    coinGain.gain.setValueAtTime(0.001, now);
    coinGain.gain.linearRampToValueAtTime(0.22, now + 0.015);
    coinGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    coinOsc.connect(coinGain);
    coinGain.connect(this.compressor);
    coinOsc.start(now);
    coinOsc.stop(now + 0.36);

    // 2. Mechanical Tumbler Gate Latch (t = 0.10s, 380 Hz hollow metal tap)
    const gateOsc = this.ctx.createOscillator();
    const gateGain = this.ctx.createGain();
    gateOsc.type = 'triangle';
    gateOsc.frequency.setValueAtTime(420, now + 0.10);
    gateOsc.frequency.exponentialRampToValueAtTime(220, now + 0.20);
    gateGain.gain.setValueAtTime(0.001, now + 0.10);
    gateGain.gain.linearRampToValueAtTime(0.28, now + 0.11);
    gateGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    gateOsc.connect(gateGain);
    gateGain.connect(this.compressor);
    gateOsc.start(now + 0.10);
    gateOsc.stop(now + 0.25);

    // 3. Heavy Optical Shutter Spring Release & Snap Open (t = 0.22s, 160 Hz + metallic ring)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(320, now + 0.22);
    snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.38);
    snapGain.gain.setValueAtTime(0.001, now + 0.22);
    snapGain.gain.linearRampToValueAtTime(0.35, now + 0.23);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    snapOsc.connect(snapGain);
    snapGain.connect(this.compressor);
    snapOsc.start(now + 0.22);
    snapOsc.stop(now + 0.46);
  }

  /**
   * 🔍 Binocular Lens Zoom Mechanism Ratchet Click
   */
  playBinocularZoom() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.035);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * 🚪 Binocular Shutter Close Snap
   */
  playBinocularExit() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * 💥 Procedural Gunshot & Desert Canyon Echo
   * Synthesizes transient pop, explosive noise blast, and reverberant canyon echo
   */
  triggerGunshot() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Initial High-Velocity Transient Spike (sharp punch)
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(950, now);
    popOsc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

    popGain.gain.setValueAtTime(0.7, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    popOsc.connect(popGain);
    popGain.connect(this.compressor);
    popOsc.start(now);
    popOsc.stop(now + 0.1);

    // 2. Gunpowder Explosive Blast (Noise Burst through bandpass)
    if (this.noiseBuffer) {
      const blastSource = this.ctx.createBufferSource();
      blastSource.buffer = this.noiseBuffer;

      const blastFilter = this.ctx.createBiquadFilter();
      blastFilter.type = 'bandpass';
      blastFilter.frequency.setValueAtTime(1600, now);
      blastFilter.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      blastFilter.Q.setValueAtTime(1.8, now);

      const blastGain = this.ctx.createGain();
      blastGain.gain.setValueAtTime(0.85, now);
      blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      blastSource.connect(blastFilter);
      blastFilter.connect(blastGain);
      blastGain.connect(this.compressor);
      blastSource.start(now);
      blastSource.stop(now + 0.42);

      // 3. Desert Canyon Echo Delays (3 distinct reflective echoes off canyon walls)
      const echoDelays = [0.18, 0.38, 0.62];
      const echoGains = [0.28, 0.16, 0.08];

      echoDelays.forEach((delay, idx) => {
        const echoSource = this.ctx.createBufferSource();
        echoSource.buffer = this.noiseBuffer;

        const echoFilter = this.ctx.createBiquadFilter();
        echoFilter.type = 'lowpass';
        echoFilter.frequency.setValueAtTime(1200 - idx * 250, now + delay);

        const echoGain = this.ctx.createGain();
        echoGain.gain.setValueAtTime(0.001, now);
        echoGain.gain.setValueAtTime(echoGains[idx], now + delay);
        echoGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28);

        echoSource.connect(echoFilter);
        echoFilter.connect(echoGain);
        echoGain.connect(this.compressor);
        echoSource.start(now + delay);
        echoSource.stop(now + delay + 0.3);
      });
    }
  }

  /**
   * 🔍 Suspenseful Clue Discovery Chime
   */
  playClueDiscoveredChime() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Mysterious suspended arpeggio (C#4 -> G#4 -> B4 -> E5)
    const freqs = [277.18, 415.30, 493.88, 659.25];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.85);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.9);
    });
  }

  /**
   * ⭐ GTA-Style Mission Accomplished Fanfare
   */
  playMissionAccomplishedFanfare() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Powerful triumphant brass resolution chord (D minor -> D major victory)
    const chord1 = [293.66, 349.23, 440.00, 587.33]; // Dm
    const chord2 = [293.66, 369.99, 440.00, 587.33, 739.99]; // D Maj resolution

    chord1.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.6);
    });

    const resTime = now + 0.45;
    chord2.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, resTime);

      gain.gain.setValueAtTime(0.001, resTime);
      gain.gain.linearRampToValueAtTime(0.2, resTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, resTime + 1.8);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(resTime);
      osc.stop(resTime + 1.9);
    });
  }

  /**
   * 📻 Sheriff Police Radio Dispatch Squelch & Tone
   */
  playSheriffRadioReport() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Squelch burst
    if (this.noiseBuffer) {
      const squelch = this.ctx.createBufferSource();
      squelch.buffer = this.noiseBuffer;
      const sFilter = this.ctx.createBiquadFilter();
      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(2400, now);
      sFilter.Q.setValueAtTime(3.0, now);

      const sGain = this.ctx.createGain();
      sGain.gain.setValueAtTime(0.25, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      squelch.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(this.compressor);
      squelch.start(now);
      squelch.stop(now + 0.09);
    }

    // Two-tone 10-4 acknowledgment tones (1020Hz -> 1380Hz)
    const tones = [1020, 1380];
    tones.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + 0.09 + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + 0.09 + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.09 + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09 + idx * 0.08 + 0.12);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now + 0.09 + idx * 0.08);
      osc.stop(now + 0.09 + idx * 0.08 + 0.13);
    });
  }

  /**
   * ✈️ Edwards AFB Supersonic Military Jet Low-Altitude Flyby & Double Sonic Boom
   */
  playSupersonicFlyby() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. High-speed jet engine roar with Doppler bandpass sweep
    if (this.noiseBuffer) {
      const jetNoise = this.ctx.createBufferSource();
      jetNoise.buffer = this.noiseBuffer;

      const bpFilter = this.ctx.createBiquadFilter();
      bpFilter.type = 'bandpass';
      bpFilter.frequency.setValueAtTime(2800, now);
      bpFilter.frequency.exponentialRampToValueAtTime(320, now + 2.2);
      bpFilter.Q.setValueAtTime(2.4, now);

      const jetGain = this.ctx.createGain();
      jetGain.gain.setValueAtTime(0.001, now);
      jetGain.gain.linearRampToValueAtTime(0.38, now + 0.7);
      jetGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      jetNoise.connect(bpFilter);
      bpFilter.connect(jetGain);
      jetGain.connect(this.compressor);

      jetNoise.start(now);
      jetNoise.stop(now + 2.9);
    }

    // 2. Dual Sonic Boom Shockwaves (Classic N-wave overpressure signature)
    [0.72, 0.82].forEach((boomTime, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(74 - idx * 16, now + boomTime);
      osc.frequency.exponentialRampToValueAtTime(26, now + boomTime + 0.45);

      gain.gain.setValueAtTime(0.001, now + boomTime);
      gain.gain.linearRampToValueAtTime(0.55, now + boomTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + boomTime + 0.55);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(now + boomTime);
      osc.stop(now + boomTime + 0.6);
    });
  }

  /**
   * ⭐ Route 66 Golden Shield Collectible Chime (Sparkling E-major pentatonic arpeggio)
   */
  playRoute66ShieldCollectChime() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22]; // E5, G#5, B5, E6, G#6
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 4 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.24, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.65);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(noteTime);
      osc.stop(noteTime + 0.7);
    });
  }

  /**
   * 🚂 Historic Mojave Freight Diesel Multi-Chime Air Horn (D#4 + F#4 + A#4)
   */
  playTrainHorn() {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const freqs = [311.13, 369.99, 466.16]; // Leslie Nathan chord
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f + (i === 1 ? -1.5 : 1.2), now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
      gain.gain.setValueAtTime(0.18, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);

      osc.start(now);
      osc.stop(now + 1.9);
    });
  }
}


