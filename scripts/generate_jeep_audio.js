import fs from 'fs';
import path from 'path';

function createWavBuffer(sampleRate, numChannels, samples) {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1.0, Math.min(1.0, samples[i]));
    const intVal = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intVal), offset);
    offset += 2;
  }

  return buffer;
}

const SR = 44100;
const outDir = path.resolve('public/audio/jeep');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// 1. JEEP IDLE LOOP (2.5 seconds seamless loop)
// Authentic carbureted inline-6 / 4-cyl low-rev rumble (~720 RPM, ~24 Hz firing)
// ─────────────────────────────────────────────────────────────────────────────
{
  const duration = 2.5;
  const numSamples = Math.floor(duration * SR);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const firingFreq = 24.0; // 720 RPM for 4-stroke inline
  for (let i = 0; i < numSamples; i++) {
    const t = i / SR;
    const phase = (t * firingFreq) % 1.0;

    // Asymmetric cylinder firing pulse
    let pulse = Math.sin(phase * Math.PI * 2) * 0.45;
    pulse += Math.sin(phase * Math.PI * 4) * 0.28;
    pulse += Math.sin(phase * Math.PI * 6 + 0.3) * 0.18;
    // Sub-bass thrum
    pulse += Math.sin(phase * Math.PI * 1) * 0.35;

    // Cylinder compression thud (decaying transient per stroke)
    const strokePhase = (phase * 4) % 1.0;
    const compression = Math.exp(-strokePhase * 12.0) * Math.sin(strokePhase * 180.0) * 0.22;

    // Mechanical valvetrain / tappet tick
    const tickPhase = (phase * 12) % 1.0;
    const tick = Math.exp(-tickPhase * 25.0) * (Math.random() - 0.5) * 0.08;

    // Carburetor air hiss & manifold resonance
    const hiss = (Math.random() - 0.5) * 0.04 * (1.0 + Math.sin(t * 12));

    const total = (pulse + compression + tick + hiss) * 0.75;

    // Subtle stereo widening
    left[i] = total * 0.95;
    right[i] = total * 1.02;
  }

  // Crossfade boundary for seamless looping
  const fadeLen = Math.floor(0.08 * SR);
  for (let i = 0; i < fadeLen; i++) {
    const factor = i / fadeLen;
    left[i] = left[i] * factor + left[numSamples - fadeLen + i] * (1 - factor);
    right[i] = right[i] * factor + right[numSamples - fadeLen + i] * (1 - factor);
  }

  const interleaved = new Float32Array(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    interleaved[i * 2] = left[i];
    interleaved[i * 2 + 1] = right[i];
  }

  fs.writeFileSync(path.join(outDir, 'jeep_idle_loop.wav'), createWavBuffer(SR, 2, interleaved));
  console.log('✅ Generated public/audio/jeep/jeep_idle_loop.wav');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. JEEP MANUAL GEAR SHIFT CLUNK (0.35s)
// Shifter gate notch + heavy steel dog teeth slam + clutch bite
// ─────────────────────────────────────────────────────────────────────────────
{
  const duration = 0.35;
  const numSamples = Math.floor(duration * SR);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SR;
    let s = 0;

    // 0ms - 30ms: Shifter gate metallic notch "clack"
    if (t < 0.045) {
      const gateEnv = Math.exp(-t * 90.0);
      s += Math.sin(t * 2 * Math.PI * 420.0) * gateEnv * 0.6;
      s += (Math.random() - 0.5) * gateEnv * 0.35;
    }

    // 35ms - 180ms: Heavy iron transmission dog engagement "THUNK"
    if (t >= 0.032) {
      const dt = t - 0.032;
      const thunkEnv = Math.exp(-dt * 28.0);
      s += Math.sin(dt * 2 * Math.PI * (110.0 - dt * 250.0)) * thunkEnv * 0.95;
      s += Math.sin(dt * 2 * Math.PI * 55.0) * thunkEnv * 0.70;
      // Metallic ringing resonance (cast iron casing)
      s += Math.sin(dt * 2 * Math.PI * 880.0) * Math.exp(-dt * 45.0) * 0.25;
    }

    // 50ms - 140ms: Clutch plate friction scuff
    if (t >= 0.05 && t < 0.16) {
      const dt = t - 0.05;
      const clutchEnv = Math.sin((dt / 0.11) * Math.PI);
      s += (Math.random() - 0.5) * clutchEnv * 0.22;
    }

    left[i] = s * 0.85;
    right[i] = s * 0.88;
  }

  const interleaved = new Float32Array(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    interleaved[i * 2] = left[i];
    interleaved[i * 2 + 1] = right[i];
  }

  fs.writeFileSync(path.join(outDir, 'jeep_shift_clunk.wav'), createWavBuffer(SR, 2, interleaved));
  console.log('✅ Generated public/audio/jeep/jeep_shift_clunk.wav');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. JEEP 12V HEAVY STARTER CRANK (1.2s)
// 4 slow, heavy starter compression chugs + ignition fire
// ─────────────────────────────────────────────────────────────────────────────
{
  const duration = 1.35;
  const numSamples = Math.floor(duration * SR);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SR;
    let s = 0;

    // 4 Cranking strokes at t = 0.05, 0.22, 0.39, 0.56
    const crankTimes = [0.05, 0.22, 0.39, 0.56];
    for (let c = 0; c < crankTimes.length; c++) {
      const ct = crankTimes[c];
      if (t >= ct && t < ct + 0.18) {
        const dt = t - ct;
        const env = Math.exp(-dt * 20.0);
        const freq = 90 - dt * 250;
        s += Math.sin(dt * 2 * Math.PI * Math.max(30, freq)) * env * 0.85;
        // Starter motor whining armature undertone
        s += Math.sin(dt * 2 * Math.PI * 480.0) * Math.exp(-dt * 12.0) * 0.25;
      }
    }

    // Engine catches fire at t = 0.72s
    if (t >= 0.72) {
      const dt = t - 0.72;
      const roarEnv = Math.exp(-dt * 3.5);
      // Guttural ignition bark
      s += Math.sin(dt * 2 * Math.PI * 75.0) * roarEnv * 0.80;
      s += Math.sin(dt * 2 * Math.PI * 150.0) * roarEnv * 0.45;
      s += Math.sin(dt * 2 * Math.PI * 35.0) * roarEnv * 0.60;
      s += (Math.random() - 0.5) * Math.exp(-dt * 6.0) * 0.30;
    }

    left[i] = s * 0.8;
    right[i] = s * 0.82;
  }

  const interleaved = new Float32Array(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    interleaved[i * 2] = left[i];
    interleaved[i * 2 + 1] = right[i];
  }

  fs.writeFileSync(path.join(outDir, 'jeep_starter.wav'), createWavBuffer(SR, 2, interleaved));
  console.log('✅ Generated public/audio/jeep/jeep_starter.wav');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. JEEP CARBURATOR OVERRUN & EXHAUST POP (0.4s)
// Throttle lift sputtering and unburnt fuel burbles
// ─────────────────────────────────────────────────────────────────────────────
{
  const duration = 0.42;
  const numSamples = Math.floor(duration * SR);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const popTimes = [0.02, 0.11, 0.22, 0.31];
  for (let i = 0; i < numSamples; i++) {
    const t = i / SR;
    let s = 0;

    for (let p = 0; p < popTimes.length; p++) {
      const pt = popTimes[p];
      if (t >= pt && t < pt + 0.09) {
        const dt = t - pt;
        const env = Math.exp(-dt * 35.0);
        s += Math.sin(dt * 2 * Math.PI * (70 + p * 15)) * env * 0.75;
        s += (Math.random() - 0.5) * env * 0.35;
      }
    }

    left[i] = s * 0.75;
    right[i] = s * 0.78;
  }

  const interleaved = new Float32Array(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    interleaved[i * 2] = left[i];
    interleaved[i * 2 + 1] = right[i];
  }

  fs.writeFileSync(path.join(outDir, 'jeep_overrun.wav'), createWavBuffer(SR, 2, interleaved));
  console.log('✅ Generated public/audio/jeep/jeep_overrun.wav');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VINTAGE JEEP HORN (0.5s)
// Dual-tone classic utility horn (370 Hz + 435 Hz)
// ─────────────────────────────────────────────────────────────────────────────
{
  const duration = 0.55;
  const numSamples = Math.floor(duration * SR);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SR;
    let env = 1.0;
    if (t < 0.02) env = t / 0.02;
    if (t > duration - 0.06) env = (duration - t) / 0.06;

    let s = Math.sin(t * 2 * Math.PI * 370.0) * 0.55;
    s += Math.sin(t * 2 * Math.PI * 435.0) * 0.50;
    s += Math.sin(t * 2 * Math.PI * 740.0) * 0.20;
    s += Math.sin(t * 2 * Math.PI * 870.0) * 0.18;

    s *= env * 0.80;
    left[i] = s * 0.95;
    right[i] = s * 1.0;
  }

  const interleaved = new Float32Array(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    interleaved[i * 2] = left[i];
    interleaved[i * 2 + 1] = right[i];
  }

  fs.writeFileSync(path.join(outDir, 'jeep_horn.wav'), createWavBuffer(SR, 2, interleaved));
  console.log('✅ Generated public/audio/jeep/jeep_horn.wav');
}

console.log('🎉 All Safari Jeep audio files generated successfully!');
