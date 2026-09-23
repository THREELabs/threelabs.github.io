import * as THREE from 'three';

/**
 * ProceduralPBRTextures — Photorealistic Procedural Texture & Normal Map Synthesis
 * 
 * Generates high-fidelity PBR texture sets (Diffuse, Normal, Roughness) in memory using
 * procedural multi-octave noise, heightfield Sobel filtering, and authentic material simulation:
 * - Asphalt (Crushed aggregate mineral chips, bitumen binder, tire polishing wear, micro-sand normal)
 * - Road Markings (Thermoplastic highway striping, retroreflective glass beads, edge chipping)
 * - Concrete Curbs (Formwork seams, aggregate porosity, tire scrub marks)
 * - Crushed Gravel Shoulders (Loose multi-colored aggregate, compacted dirt)
 * - Multi-Biome Terrain (Desert sand ripples, loamy dirt, forest moss duff, sedimentary rock strata)
 * - Concrete Jersey Barriers (Poured form seams, bug holes, rainwater drainage, road splash grime)
 * - Galvanized Steel Guardrails (Zinc spangle crystallization, W-beam corrugation profile)
 * - Stone Masonry (Ashlar stonework, recessed mortar joints, chiseled faces)
 * - Weathered Wood (Cedar/redwood grain, knots, drying checks, silver-gray patina)
 * - Volumetric Cloud Noise (Multi-octave billowy cumulus density field)
 */

// Helper: 2D Value / Gradient Noise Generator with Fractal Octaves
class ProceduralNoise {
  constructor(seed = 1337) {
    this.seed = seed;
    this._p = new Uint8Array(512);
    this._initPermutation();
  }

  _initPermutation() {
    let s = this.seed;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) this._p[i] = p[i & 255];
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);

    const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);

    const p = this._p;
    const a = p[X] + Y;
    const b = p[X + 1] + Y;

    const grad = (hash, gx, gy) => {
      const h = hash & 7;
      const u = h < 4 ? gx : gy;
      const v = h < 4 ? gy : gx;
      return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    };

    const g00 = grad(p[a], fx, fy);
    const g10 = grad(p[b], fx - 1, fy);
    const g01 = grad(p[a + 1], fx, fy - 1);
    const g11 = grad(p[b + 1], fx - 1, fy - 1);

    const x1 = g00 + u * (g10 - g00);
    const x2 = g01 + u * (g11 - g01);
    return (x1 + v * (x2 - x1)) * 0.5 + 0.5;
  }

  fbm(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let total = 0, frequency = 1.0, amplitude = 1.0, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
}

const noiseGen = new ProceduralNoise(4242);

/**
 * Computes a high-quality tangent-space Normal Map from a heightfield array using Sobel filter.
 * @param {Float32Array} heightfield Array of size*size normalized heights [0..1]
 * @param {number} size Width & height of the heightfield
 * @param {number} strength Normal relief intensity (e.g. 1.5 to 5.0)
 * @returns {ImageData} Normal map image data (R = X, G = Y, B = Z, A = 255)
 */
export function sobelHeightToNormal(heightfield, size, strength = 3.0) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const sample = (x, y) => {
    const px = (x + size) % size;
    const py = (y + size) % size;
    return heightfield[py * size + px];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sobel kernel X:
      // [-1 0 1]
      // [-2 0 2]
      // [-1 0 1]
      const tl = sample(x - 1, y - 1);
      const l  = sample(x - 1, y);
      const bl = sample(x - 1, y + 1);
      const tr = sample(x + 1, y - 1);
      const r  = sample(x + 1, y);
      const br = sample(x + 1, y + 1);

      // Sobel kernel Y:
      // [-1 -2 -1]
      // [ 0  0  0]
      // [ 1  2  1]
      const t  = sample(x, y - 1);
      const b  = sample(x, y + 1);

      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

      // Vector: (-dX * strength, -dY * strength, 1.0)
      const nx = -dX * strength;
      const ny = -dY * strength;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1.0;

      const idx = (y * size + x) * 4;
      data[idx + 0] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  return imgData;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HIGH-FIDELITY ASPHALT SYSTEM (Diffuse, Normal, Roughness)
// ─────────────────────────────────────────────────────────────────────────────

export function createRealisticAsphaltTextures(size = 512) {
  const canvasDiffuse = document.createElement('canvas');
  canvasDiffuse.width = size; canvasDiffuse.height = size;
  const ctx = canvasDiffuse.getContext('2d');

  const canvasRoughness = document.createElement('canvas');
  canvasRoughness.width = size; canvasRoughness.height = size;
  const ctxRough = canvasRoughness.getContext('2d');
  const imgRough = ctxRough.createImageData(size, size);

  const rawHeightfield = new Float32Array(size * size);
  const smoothHeightfield = new Float32Array(size * size);

  // 1. Smooth Dark Highway Bitumen Base
  ctx.fillStyle = '#26292e';
  ctx.fillRect(0, 0, size, size);

  // Gentle low-frequency organic Perlin tone variation (no 1px speckles)
  const baseImg = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      // Gentle rolling tonal flow
      const n = noiseGen.fbm(x * 0.02, y * 0.02, 3);
      const v = Math.round(38 + (n - 0.5) * 8);
      baseImg.data[idx * 4 + 0] = v;
      baseImg.data[idx * 4 + 1] = v;
      baseImg.data[idx * 4 + 2] = v + 2;
      baseImg.data[idx * 4 + 3] = 255;
      rawHeightfield[idx] = 0.22 + (n - 0.5) * 0.06;
    }
  }
  ctx.putImageData(baseImg, 0, 0);

  // 2. Soft, Cohesive Crushed Mineral Aggregate Stones (Natural Highway Aggregate)
  // Low-contrast slate & warm-grey aggregate tones blended into the bitumen matrix
  const aggregateColors = [
    'rgba(58, 62, 70, 0.75)',
    'rgba(50, 53, 60, 0.70)',
    'rgba(66, 70, 78, 0.65)',
    'rgba(54, 57, 64, 0.80)',
    'rgba(46, 49, 55, 0.85)',
    'rgba(62, 65, 72, 0.60)'
  ];

  const numMediumStones = Math.floor(size * size * 0.0032);
  for (let i = 0; i < numMediumStones; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const rad = 1.4 + Math.random() * 2.8;
    const col = aggregateColors[Math.floor(Math.random() * aggregateColors.length)];

    ctx.fillStyle = col;
    ctx.beginPath();
    const vertices = 6;
    for (let v = 0; v < vertices; v++) {
      const angle = (v / vertices) * Math.PI * 2;
      const r = rad * (0.82 + Math.random() * 0.36);
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Soft aggregate elevation in heightfield
    const ix = Math.floor(x), iy = Math.floor(y);
    const irad = Math.ceil(rad);
    for (let dy = -irad; dy <= irad; dy++) {
      for (let dx = -irad; dx <= irad; dx++) {
        const dSq = dx * dx + dy * dy;
        if (dSq <= rad * rad) {
          const px = (ix + dx + size) % size;
          const py = (iy + dy + size) % size;
          const falloff = 1.0 - Math.sqrt(dSq) / rad;
          rawHeightfield[py * size + px] = Math.min(1.0, rawHeightfield[py * size + px] + falloff * 0.28);
        }
      }
    }
  }

  // 3. Realistic Smooth Wheel Contact Polishing & Oil Drip Tracks along V direction
  const wearGrad = ctx.createLinearGradient(0, 0, 0, size);
  wearGrad.addColorStop(0.00, 'rgba(8, 8, 10, 0.0)');
  wearGrad.addColorStop(0.20, 'rgba(12, 13, 16, 0.26)'); // Left tire compaction band
  wearGrad.addColorStop(0.38, 'rgba(8, 8, 10, 0.0)');
  wearGrad.addColorStop(0.48, 'rgba(18, 16, 14, 0.14)'); // Center drip track
  wearGrad.addColorStop(0.58, 'rgba(8, 8, 10, 0.0)');
  wearGrad.addColorStop(0.76, 'rgba(12, 13, 16, 0.26)'); // Right tire compaction band
  wearGrad.addColorStop(0.95, 'rgba(8, 8, 10, 0.0)');
  ctx.fillStyle = wearGrad;
  ctx.fillRect(0, 0, size, size);

  // 4. Smooth Heightfield with 3x3 Box Blur to eliminate all single-pixel normal spikes
  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;

      const sum =
        rawHeightfield[yPrev * size + xPrev] + rawHeightfield[yPrev * size + x] + rawHeightfield[yPrev * size + xNext] +
        rawHeightfield[y * size + xPrev]     + rawHeightfield[y * size + x] * 2 + rawHeightfield[y * size + xNext] +
        rawHeightfield[yNext * size + xPrev] + rawHeightfield[yNext * size + x] + rawHeightfield[yNext * size + xNext];

      smoothHeightfield[y * size + x] = sum / 10.0;
    }
  }

  // 5. Compute Roughness Map: Satin wheel tracks (0.65), porous bitumen (0.82), smooth aggregate (0.72)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const h = smoothHeightfield[idx];
      const stoneFactor = THREE.MathUtils.clamp((h - 0.22) / 0.35, 0, 1);
      const roughVal = Math.round((0.82 - stoneFactor * 0.16) * 255);
      const pIdx = idx * 4;
      imgRough.data[pIdx + 0] = roughVal;
      imgRough.data[pIdx + 1] = roughVal;
      imgRough.data[pIdx + 2] = roughVal;
      imgRough.data[pIdx + 3] = 255;
    }
  }
  ctxRough.putImageData(imgRough, 0, 0);

  // 6. Generate Gentle Tactile Normal Map (Sobel strength 1.15 for smooth, non-flickering micro-relief)
  const normalImg = sobelHeightToNormal(smoothHeightfield, size, 1.15);
  const canvasNormal = document.createElement('canvas');
  canvasNormal.width = size; canvasNormal.height = size;
  canvasNormal.getContext('2d').putImageData(normalImg, 0, 0);

  // Create Three.js Textures with High-Quality Filtering
  const texDiffuse = new THREE.CanvasTexture(canvasDiffuse);
  texDiffuse.wrapS = texDiffuse.wrapT = THREE.RepeatWrapping;
  texDiffuse.colorSpace = THREE.SRGBColorSpace;
  texDiffuse.minFilter = THREE.LinearMipmapLinearFilter;
  texDiffuse.magFilter = THREE.LinearFilter;
  texDiffuse.generateMipmaps = true;
  texDiffuse.anisotropy = 8;

  const texNormal = new THREE.CanvasTexture(canvasNormal);
  texNormal.wrapS = texNormal.wrapT = THREE.RepeatWrapping;
  texNormal.minFilter = THREE.LinearMipmapLinearFilter;
  texNormal.magFilter = THREE.LinearFilter;
  texNormal.generateMipmaps = true;
  texNormal.anisotropy = 8;

  const texRoughness = new THREE.CanvasTexture(canvasRoughness);
  texRoughness.wrapS = texRoughness.wrapT = THREE.RepeatWrapping;
  texRoughness.minFilter = THREE.LinearMipmapLinearFilter;
  texRoughness.magFilter = THREE.LinearFilter;
  texRoughness.generateMipmaps = true;
  texRoughness.anisotropy = 8;

  return { diffuse: texDiffuse, normal: texNormal, roughness: texRoughness };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WEATHERED ROAD MARKINGS & STRIPING (Thermoplastic + Retroreflective Beads)
// ─────────────────────────────────────────────────────────────────────────────

export function createRoadMarkingTexture(colorHex = '#facc15', size = 256) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  // Base painted stripe with subtle edge margin
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, size, size);

  // Retroreflective glass bead micro-sparkle (glass bead beads embedded in road paint)
  const beadCount = size * size * 0.04;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < beadCount; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    ctx.fillRect(x, y, 1, 1);
  }

  // Weathering, micro-abrasions, and asphalt bleed-through
  ctx.fillStyle = 'rgba(30, 32, 36, 0.28)';
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const w = 2 + Math.random() * 8, h = 1.5 + Math.random() * 3;
    ctx.fillRect(x, y, w, h);
  }

  // Chipped paint edges
  for (let i = 0; i < size; i += 4) {
    if (Math.random() > 0.6) {
      ctx.clearRect(0, i, Math.random() * 4, 3);
      ctx.clearRect(size - Math.random() * 4, i, 4, 3);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONCRETE CURB & GRAVEL SHOULDERS
// ─────────────────────────────────────────────────────────────────────────────

export function createCurbConcreteTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  // Base poured concrete color
  ctx.fillStyle = '#b4b8be';
  ctx.fillRect(0, 0, size, size);

  // Formwork board lines
  ctx.strokeStyle = 'rgba(70, 75, 82, 0.35)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y < size; y += size / 4) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Concrete air voids (pockmarks / bug holes)
  ctx.fillStyle = 'rgba(50, 52, 56, 0.45)';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + Math.random() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Black tire scrub marks along outer face
  const scrubGrad = ctx.createLinearGradient(0, size * 0.5, 0, size);
  scrubGrad.addColorStop(0.0, 'rgba(20, 20, 24, 0.0)');
  scrubGrad.addColorStop(0.6, 'rgba(20, 20, 24, 0.32)');
  scrubGrad.addColorStop(1.0, 'rgba(20, 20, 24, 0.55)');
  ctx.fillStyle = scrubGrad;
  ctx.fillRect(0, size * 0.5, size, size * 0.5);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createGravelShoulderTextures(size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  // Base compacted dirt tone
  ctx.fillStyle = '#6e6252';
  ctx.fillRect(0, 0, size, size);

  // Dense crushed stone chips
  const gravelCols = ['#9e9486', '#b5ab9a', '#544c40', '#7a6f60', '#c2b8a7', '#423d35'];
  for (let i = 0; i < size * size * 0.035; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 1.0 + Math.random() * 3.0;
    ctx.fillStyle = gravelCols[Math.floor(Math.random() * gravelCols.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const ix = Math.floor(x), iy = Math.floor(y);
    const ir = Math.ceil(r);
    for (let dy = -ir; dy <= ir; dy++) {
      for (let dx = -ir; dx <= ir; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const px = (ix + dx + size) % size;
          const py = (iy + dy + size) % size;
          heightfield[py * size + px] = Math.min(1.0, heightfield[py * size + px] + 0.6);
        }
      }
    }
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 3.5);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MULTI-BIOME TERRAIN PBR TEXTURES
// ─────────────────────────────────────────────────────────────────────────────

export function createBiomeTerrainTextures(biomeKey = 'desert_sand', size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  if (biomeKey === 'desert_sand') {
    // Mojave Desert Wind-Sculpted Sand & Fine Caliche
    ctx.fillStyle = '#d8aa68';
    ctx.fillRect(0, 0, size, size);

    // Multi-octave organic wind drift heightfield with curving dune wavelets
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n1 = noiseGen.fbm(x * 0.012, y * 0.012, 3);
        const wave1 = Math.sin(x * 0.028 + y * 0.016 + n1 * 3.8) * 0.07;
        const wave2 = Math.cos(x * 0.055 - y * 0.035 + n1 * 2.2) * 0.035;
        const grain = (Math.random() - 0.5) * 0.035;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, 0.5 + wave1 + wave2 + grain));
      }
    }

    // Soft organic windward & leeward drift sweeps
    for (let i = 0; i < 32; i++) {
      const cy = (i / 32) * size;
      const driftGrad = ctx.createRadialGradient(size * 0.5, cy, 0, size * 0.5, cy, size * 0.65);
      driftGrad.addColorStop(0.0, 'rgba(245, 218, 172, 0.22)');
      driftGrad.addColorStop(0.55, 'rgba(190, 138, 78, 0.12)');
      driftGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = driftGrad;
      ctx.fillRect(0, cy - 24, size, 48);
    }

    // Caliche mineral & quartz grains
    for (let i = 0; i < size * size * 0.015; i++) {
      const isLight = Math.random() > 0.45;
      ctx.fillStyle = isLight ? 'rgba(255, 250, 230, 0.48)' : 'rgba(145, 78, 35, 0.32)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.2, 1.2);
    }

  } else if (biomeKey === 'soil_dirt') {
    // Loamy Agricultural Soil, Humus & Compressed Earth
    ctx.fillStyle = '#4e3928';
    ctx.fillRect(0, 0, size, size);

    // Organic clumps and soil grain heightfield
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.028, y * 0.028, 4);
        const micro = (Math.random() - 0.5) * 0.08;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, n + micro));
      }
    }

    // Humus color variation
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 20 + Math.random() * 45;
      const humusGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      humusGrad.addColorStop(0.0, 'rgba(40, 28, 18, 0.35)');
      humusGrad.addColorStop(1.0, 'rgba(40, 28, 18, 0.0)');
      ctx.fillStyle = humusGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine organic rootlets
    ctx.strokeStyle = 'rgba(65, 45, 30, 0.45)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * size, sy = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(
        sx + (Math.random() - 0.5) * 25,
        sy + (Math.random() - 0.5) * 25,
        sx + (Math.random() - 0.5) * 45,
        sy + (Math.random() - 0.5) * 45
      );
      ctx.stroke();
    }

    // Pebble scatter
    const pebbleCols = ['#756554', '#8c7a68', '#382e25', '#5a4d3f', '#9b8b78'];
    for (let i = 0; i < size * size * 0.022; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 0.8 + Math.random() * 2.4;
      ctx.fillStyle = pebbleCols[Math.floor(Math.random() * pebbleCols.length)];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (biomeKey === 'forest_moss') {
    // Pacific Northwest & Redwood Forest Floor Duff & Lush Moss
    ctx.fillStyle = '#22331c';
    ctx.fillRect(0, 0, size, size);

    // Multi-octave organic moss duff heightfield
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n1 = noiseGen.fbm(x * 0.035, y * 0.035, 4);
        const n2 = noiseGen.fbm(x * 0.08, y * 0.08, 2) * 0.2;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, n1 + n2));
      }
    }

    // Velvety emerald & olive moss cushion mounds
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 8 + Math.random() * 22;
      const isVibrant = Math.random() > 0.4;
      const mossGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      if (isVibrant) {
        mossGrad.addColorStop(0.0, 'rgba(88, 148, 56, 0.80)');
        mossGrad.addColorStop(0.65, 'rgba(54, 98, 36, 0.50)');
        mossGrad.addColorStop(1.0, 'rgba(30, 48, 22, 0.0)');
      } else {
        mossGrad.addColorStop(0.0, 'rgba(68, 115, 45, 0.75)');
        mossGrad.addColorStop(0.65, 'rgba(42, 75, 30, 0.45)');
        mossGrad.addColorStop(1.0, 'rgba(25, 40, 18, 0.0)');
      }
      ctx.fillStyle = mossGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fallen redwood and cedar needles
    ctx.strokeStyle = 'rgba(138, 62, 28, 0.65)';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const len = 5 + Math.random() * 9;
      const angle = Math.random() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

  } else if (biomeKey === 'rock_strata') {
    // Sedimentary Terracotta Rock Strata & Desert Varnish
    ctx.fillStyle = '#a64d2b';
    ctx.fillRect(0, 0, size, size);

    // Geological horizontal sedimentary strata bands
    const strataColors = ['#7c2b16', '#c8763d', '#521d0e', '#b85a2e', '#da9556', '#662211', '#8c3518'];
    let curY = 0;
    while (curY < size) {
      const bandH = 10 + Math.random() * 28;
      const col = strataColors[Math.floor(Math.random() * strataColors.length)];
      ctx.fillStyle = col;
      ctx.fillRect(0, curY, size, bandH);

      // Fine internal horizontal striations
      for (let s = 0; s < 5; s++) {
        const sy = curY + Math.random() * bandH;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.16)';
        ctx.fillRect(0, sy, size, 1.2 + Math.random() * 1.5);
      }
      curY += bandH;
    }

    // Vertical erosion fissures
    ctx.fillStyle = 'rgba(25, 10, 8, 0.48)';
    for (let x = 0; x < size; x += 18 + Math.random() * 32) {
      ctx.fillRect(x, 0, 2 + Math.random() * 3, size);
    }

    // Heightfield derived from stepped strata ledges
    for (let y = 0; y < size; y++) {
      const step = ((y % 36) / 36) * 0.75;
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.04, y * 0.04, 2) * 0.25;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, step + n));
      }
    }

  } else if (biomeKey === 'mountain_rock') {
    // Alpine Granite, Basalt Cliff Faces & Tectonic Joint Planes
    ctx.fillStyle = '#4e555e';
    ctx.fillRect(0, 0, size, size);

    // Angular fracture planes and joint fissures
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n1 = noiseGen.fbm(x * 0.02, y * 0.02, 4);
        const crag = Math.abs(Math.sin(x * 0.04 + n1 * 4.0) * Math.cos(y * 0.035 + n1 * 3.5));
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, crag * 0.7 + n1 * 0.3));
      }
    }

    // Mineral facet variations (slate, granite, basalt)
    const rockTones = ['#383e46', '#646c76', '#2d333a', '#525a64', '#78828c'];
    for (let i = 0; i < 70; i++) {
      const rx = Math.random() * size, ry = Math.random() * size;
      const rw = 25 + Math.random() * 55, rh = 18 + Math.random() * 40;
      ctx.fillStyle = rockTones[Math.floor(Math.random() * rockTones.length)];
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + rw, ry + (Math.random() - 0.5) * 15);
      ctx.lineTo(rx + rw * 0.8, ry + rh);
      ctx.lineTo(rx - rw * 0.2, ry + rh * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Scree pebbles and quartz flecks
    for (let i = 0; i < size * size * 0.018; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(230, 235, 245, 0.45)' : 'rgba(25, 28, 32, 0.45)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.3, 1.3);
    }

  } else if (biomeKey === 'trail_dirt') {
    // 4x4 Rugged Off-Road Compacted Trail & Crushed Rock Aggregate
    ctx.fillStyle = '#5c4532';
    ctx.fillRect(0, 0, size, size);

    // Compacted wheel rut track bands along horizontal direction
    const trackGrad = ctx.createLinearGradient(0, 0, size, 0);
    trackGrad.addColorStop(0.00, 'rgba(35, 25, 18, 0.0)');
    trackGrad.addColorStop(0.22, 'rgba(35, 25, 18, 0.45)'); // Left tire track
    trackGrad.addColorStop(0.40, 'rgba(35, 25, 18, 0.0)');
    trackGrad.addColorStop(0.50, 'rgba(85, 65, 48, 0.35)'); // Center ridge
    trackGrad.addColorStop(0.60, 'rgba(35, 25, 18, 0.0)');
    trackGrad.addColorStop(0.78, 'rgba(35, 25, 18, 0.45)'); // Right tire track
    trackGrad.addColorStop(1.00, 'rgba(35, 25, 18, 0.0)');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, 0, size, size);

    // Dense crushed gravel chips
    const gravelTones = ['#8d7b68', '#a89885', '#45382c', '#726252', '#b5a794'];
    for (let i = 0; i < size * size * 0.028; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 1.0 + Math.random() * 2.8;
      ctx.fillStyle = gravelTones[Math.floor(Math.random() * gravelTones.length)];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      const ix = Math.floor(x), iy = Math.floor(y);
      const ir = Math.ceil(r);
      for (let dy = -ir; dy <= ir; dy++) {
        for (let dx = -ir; dx <= ir; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = (ix + dx + size) % size;
            const py = (iy + dy + size) % size;
            heightfield[py * size + px] = Math.min(1.0, heightfield[py * size + px] + 0.45);
          }
        }
      }
    }
  }

  // Smooth Heightfield with 3x3 Box Blur to eliminate all single-pixel normal spikes
  const smoothHeightfield = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;

      const sum =
        heightfield[yPrev * size + xPrev] + heightfield[yPrev * size + x] + heightfield[yPrev * size + xNext] +
        heightfield[y * size + xPrev]     + heightfield[y * size + x] * 2 + heightfield[y * size + xNext] +
        heightfield[yNext * size + xPrev] + heightfield[yNext * size + x] + heightfield[yNext * size + xNext];

      smoothHeightfield[y * size + x] = sum / 10.0;
    }
  }

  // Generate Normal Map
  const normalStrength = biomeKey === 'mountain_rock' ? 3.5 : (biomeKey === 'rock_strata' ? 3.2 : 2.2);
  const normalImg = sobelHeightToNormal(smoothHeightfield, size, normalStrength);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CONCRETE JERSEY BARRIERS (Poured Form Seams, Pockmarks, Rain Streaks)
// ─────────────────────────────────────────────────────────────────────────────

export function createConcreteBarrierTextures(size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  // Base cured concrete gray
  ctx.fillStyle = '#8e939a';
  ctx.fillRect(0, 0, size, size);

  // Formwork plywood panel joint lines (horizontal and vertical)
  ctx.strokeStyle = 'rgba(50, 55, 62, 0.45)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.5); ctx.lineTo(size, size * 0.5);
  ctx.moveTo(size * 0.5, 0); ctx.lineTo(size * 0.5, size);
  ctx.stroke();

  // Pockmarks / bug holes
  ctx.fillStyle = 'rgba(40, 44, 50, 0.55)';
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 0.8 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const ix = Math.floor(x), iy = Math.floor(y);
    const ir = Math.ceil(r);
    for (let dy = -ir; dy <= ir; dy++) {
      for (let dx = -ir; dx <= ir; dx++) {
        const px = (ix + dx + size) % size;
        const py = (iy + dy + size) % size;
        heightfield[py * size + px] = -0.4;
      }
    }
  }

  // Vertical rainwater drainage streaks from top edge
  for (let x = 0; x < size; x += 18 + Math.random() * 30) {
    const streakGrad = ctx.createLinearGradient(x, 0, x, size * (0.4 + Math.random() * 0.4));
    streakGrad.addColorStop(0.0, 'rgba(55, 60, 68, 0.45)');
    streakGrad.addColorStop(1.0, 'rgba(55, 60, 68, 0.0)');
    ctx.fillStyle = streakGrad;
    ctx.fillRect(x, 0, 3 + Math.random() * 5, size * 0.7);
  }

  // Road splash dirt / tire grime along base (bottom 25%)
  const splashGrad = ctx.createLinearGradient(0, size * 0.72, 0, size);
  splashGrad.addColorStop(0.0, 'rgba(55, 45, 35, 0.0)');
  splashGrad.addColorStop(0.5, 'rgba(65, 52, 40, 0.35)');
  splashGrad.addColorStop(1.0, 'rgba(45, 36, 28, 0.65)');
  ctx.fillStyle = splashGrad;
  ctx.fillRect(0, size * 0.72, size, size * 0.28);

  const normalImg = sobelHeightToNormal(heightfield, size, 2.8);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. GALVANIZED STEEL GUARDRAILS (Zinc Spangle + W-Beam Corrugations)
// ─────────────────────────────────────────────────────────────────────────────

export function createGuardrailSteelTextures(size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  // Base metallic zinc steel
  ctx.fillStyle = '#a6abb2';
  ctx.fillRect(0, 0, size, size);

  // Zinc spangle crystalline mottling
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 2.5 + Math.random() * 6.5;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(225, 230, 238, 0.35)' : 'rgba(125, 130, 138, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // W-Beam Corrugation profile along horizontal bands
  for (let y = 0; y < size; y++) {
    // Dual convex W-beam ridge curve
    const wave = Math.sin((y / size) * Math.PI * 4.0);
    const h = wave * 0.5 + 0.5;
    for (let x = 0; x < size; x++) {
      heightfield[y * size + x] = h;
    }
  }

  // Horizontal stamped shading to match W-beam profile
  const wBeamGrad = ctx.createLinearGradient(0, 0, 0, size);
  wBeamGrad.addColorStop(0.00, 'rgba(70, 75, 82, 0.45)');
  wBeamGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.35)'); // Top ridge highlight
  wBeamGrad.addColorStop(0.50, 'rgba(60, 65, 72, 0.55)');   // Center valley shadow
  wBeamGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.35)'); // Bottom ridge highlight
  wBeamGrad.addColorStop(1.00, 'rgba(70, 75, 82, 0.45)');
  ctx.fillStyle = wBeamGrad;
  ctx.fillRect(0, 0, size, size);

  const normalImg = sobelHeightToNormal(heightfield, size, 4.0);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. STONE MASONRY (Ashlar Blocks + Recessed Mortar Joints)
// ─────────────────────────────────────────────────────────────────────────────

export function createStoneMasonryTextures(size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  // Recessed dark mortar bed
  ctx.fillStyle = '#3c3a38';
  ctx.fillRect(0, 0, size, size);

  const stoneCols = [
    '#7c838d', '#959da8', '#646b74', '#868d96', '#726d66', '#a19c92', '#585e66'
  ];

  // Grid of offset rectangular ashlar stones
  const rows = 8;
  const rowH = size / rows;
  const mortar = 4;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH + mortar * 0.5;
    const h = rowH - mortar;
    const offset = (r % 2 === 0) ? 0 : 35;
    let x = -offset;

    while (x < size + 50) {
      const w = 45 + Math.sin(r * 3 + x) * 20 + 35;
      const col = stoneCols[Math.floor(Math.abs(Math.sin(r * 12 + x)) * stoneCols.length)];

      ctx.fillStyle = col;
      ctx.fillRect(x + mortar * 0.5, y, w - mortar, h);

      // Chiseled surface variation
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + mortar * 0.5, y, w - mortar, h * 0.35);

      // Mark heightfield for normal relief (recessed mortar joints)
      const xStart = Math.max(0, Math.floor(x + mortar * 0.5));
      const xEnd = Math.min(size - 1, Math.floor(x + w - mortar * 0.5));
      const yStart = Math.max(0, Math.floor(y));
      const yEnd = Math.min(size - 1, Math.floor(y + h));

      for (let py = yStart; py <= yEnd; py++) {
        for (let px = xStart; px <= xEnd; px++) {
          heightfield[py * size + px] = 0.85 + (Math.random() - 0.5) * 0.15;
        }
      }

      x += w;
    }
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 4.2);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. WEATHERED WOOD (Cedar / Redwood Grain, Knots, Silver Patina)
// ─────────────────────────────────────────────────────────────────────────────

export function createWeatheredWoodTextures(size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  // Aged cedar / redwood base tone
  ctx.fillStyle = '#624734';
  ctx.fillRect(0, 0, size, size);

  // Longitudinal wood grain fibers
  for (let x = 0; x < size; x++) {
    const grainFreq = noiseGen.fbm(x * 0.08, 0, 3);
    const val = grainFreq * 0.25;
    for (let y = 0; y < size; y++) {
      const fiber = (Math.sin(y * 0.05 + x * 0.1) * 0.08 + (Math.random() - 0.5) * 0.05);
      heightfield[y * size + x] = Math.max(0, Math.min(1.0, 0.5 + val + fiber));
    }
  }

  // Grain streaks
  for (let x = 0; x < size; x += 3 + Math.random() * 6) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(40, 24, 15, 0.35)' : 'rgba(165, 135, 110, 0.22)';
    ctx.fillRect(x, 0, 1.5 + Math.random() * 2, size);
  }

  // Silver-gray weather oxidation wash
  const silverGrad = ctx.createLinearGradient(0, 0, size, 0);
  silverGrad.addColorStop(0.0, 'rgba(135, 140, 145, 0.25)');
  silverGrad.addColorStop(0.5, 'rgba(135, 140, 145, 0.10)');
  silverGrad.addColorStop(1.0, 'rgba(135, 140, 145, 0.28)');
  ctx.fillStyle = silverGrad;
  ctx.fillRect(0, 0, size, size);

  // Wood knots with concentric rings
  for (let k = 0; k < 6; k++) {
    const kx = 40 + Math.random() * (size - 80);
    const ky = 40 + Math.random() * (size - 80);
    const kr = 8 + Math.random() * 12;

    const knotGrad = ctx.createRadialGradient(kx, ky, 2, kx, ky, kr);
    knotGrad.addColorStop(0.0, '#2d180c');
    knotGrad.addColorStop(0.4, '#482a16');
    knotGrad.addColorStop(0.8, '#5d3820');
    knotGrad.addColorStop(1.0, 'rgba(98, 71, 52, 0.0)');
    ctx.fillStyle = knotGrad;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr * 0.65, kr, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 3.2);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. VOLUMETRIC CLOUD NOISE TEXTURE (Multi-Octave Soft Cumulus Field)
// ─────────────────────────────────────────────────────────────────────────────

export function createCloudNoiseTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const center = size * 0.5;
  const maxR = size * 0.48;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.hypot(dx, dy);

      // Spherical radial falloff (soft edges, 0 at border)
      const radialMask = Math.max(0.0, 1.0 - (dist / maxR));
      const smoothMask = radialMask * radialMask * (3.0 - 2.0 * radialMask);

      // Multi-octave Perlin-Worley noise for billowy cumulus puff details
      const nx = x / size * 5.0;
      const ny = y / size * 5.0;
      const n1 = noiseGen.fbm(nx, ny, 3);
      const n2 = noiseGen.fbm(nx * 2.5 + 4.0, ny * 2.5 + 4.0, 2);
      const cloudDensity = Math.max(0.0, (n1 * 0.7 + n2 * 0.3) - 0.25) * 1.35;

      const alpha = Math.min(255, Math.max(0, Math.round(cloudDensity * smoothMask * 255)));

      const idx = (y * size + x) * 4;
      data[idx + 0] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. TREE BARK PBR TEXTURES (Redwood, Pine, Cypress, Oak, Palm, Joshua)
// ─────────────────────────────────────────────────────────────────────────────

export function createTreeBarkTextures(type = 'redwood', size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  if (type === 'redwood') {
    // Ancient Coast Redwood (Deep Furrowed Cinnamon-Russet Bark)
    ctx.fillStyle = '#6e3b22';
    ctx.fillRect(0, 0, size, size);

    // Deep longitudinal vertical furrow ridges
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n1 = noiseGen.fbm(x * 0.06, y * 0.015, 3);
        const wave = Math.sin(x * 0.14 + n1 * 3.5);
        const furrow = wave > 0.4 ? (wave - 0.4) * 1.6 : 0;
        const fiber = (Math.random() - 0.5) * 0.08;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, furrow * 0.8 + n1 * 0.2 + fiber));
      }
    }

    // Deep dark vertical fissure shadows
    for (let x = 0; x < size; x += 18 + Math.random() * 16) {
      ctx.fillStyle = 'rgba(42, 18, 10, 0.55)';
      ctx.fillRect(x, 0, 3 + Math.random() * 3, size);
    }

    // Fibrous cinnamon wood highlights along ridge crests
    for (let x = 0; x < size; x += 12 + Math.random() * 10) {
      ctx.fillStyle = 'rgba(145, 82, 50, 0.38)';
      ctx.fillRect(x, 0, 2 + Math.random() * 3, size);
    }

  } else if (type === 'pine' || type === 'fir') {
    // Western Conifer & Douglas Fir (Scaly Resinous Plates & Dark Crevices)
    ctx.fillStyle = '#3e3126';
    ctx.fillRect(0, 0, size, size);

    // Overlapping scaly bark plates
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n1 = noiseGen.fbm(x * 0.05, y * 0.05, 3);
        const scaleWave = Math.sin(x * 0.12) * Math.sin(y * 0.08 + n1 * 2.0);
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, scaleWave * 0.5 + 0.5 + (Math.random() - 0.5) * 0.08));
      }
    }

    // Irregular scaly bark plate patches
    const scaleColors = ['#4e3d30', '#5c493a', '#2c221a', '#44352a'];
    for (let i = 0; i < 90; i++) {
      const sx = Math.random() * size, sy = Math.random() * size;
      const sw = 14 + Math.random() * 22, sh = 18 + Math.random() * 30;
      ctx.fillStyle = scaleColors[Math.floor(Math.random() * scaleColors.length)];
      ctx.fillRect(sx, sy, sw, sh);
      // Dark border crevice around plate
      ctx.strokeStyle = 'rgba(22, 16, 12, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, sy, sw, sh);
    }

  } else if (type === 'cypress') {
    // Monterey Cypress (Twisted Corded Fibrous Driftwood Bark)
    ctx.fillStyle = '#4e433b';
    ctx.fillRect(0, 0, size, size);

    // Spiraling, twisted longitudinal corded grain
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n1 = noiseGen.fbm(x * 0.04, y * 0.02, 3);
        const twist = Math.sin(x * 0.10 + y * 0.035 + n1 * 3.0);
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, twist * 0.4 + 0.5 + (Math.random() - 0.5) * 0.06));
      }
    }

    // Weathered silvery-gray salt spray streaks
    for (let x = 0; x < size; x += 8 + Math.random() * 12) {
      const isSilver = Math.random() > 0.45;
      ctx.fillStyle = isSilver ? 'rgba(125, 118, 110, 0.35)' : 'rgba(45, 38, 32, 0.45)';
      ctx.fillRect(x, 0, 1.5 + Math.random() * 2.5, size);
    }

  } else if (type === 'oak') {
    // California Coastal Live Oak (Rugged Chunky Blocky Bark)
    ctx.fillStyle = '#544638';
    ctx.fillRect(0, 0, size, size);

    // Chunky rectangular block furrows
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.04, y * 0.04, 3);
        const bx = Math.sin(x * 0.09) * 0.3;
        const by = Math.sin(y * 0.06) * 0.3;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, 0.5 + bx + by + n * 0.3));
      }
    }

    // Lichen patches
    for (let i = 0; i < 25; i++) {
      const lx = Math.random() * size, ly = Math.random() * size, lr = 6 + Math.random() * 14;
      ctx.fillStyle = 'rgba(140, 158, 132, 0.35)';
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (type === 'palm') {
    // California Fan Palm (Horizontal Ringed Leaf Scars & Fibrous Coir)
    ctx.fillStyle = '#69533c';
    ctx.fillRect(0, 0, size, size);

    // Horizontal ringed leaf scars
    for (let y = 0; y < size; y++) {
      const ring = Math.sin(y * 0.22) * 0.45 + 0.5;
      for (let x = 0; x < size; x++) {
        const fiber = (Math.random() - 0.5) * 0.12;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, ring + fiber));
      }
    }

    // Horizontal ring bands
    for (let y = 0; y < size; y += 28) {
      ctx.fillStyle = 'rgba(45, 34, 22, 0.65)';
      ctx.fillRect(0, y, size, 3);
      ctx.fillStyle = 'rgba(145, 120, 92, 0.45)';
      ctx.fillRect(0, y + 3, size, 2);
    }

    // Fine vertical fibrous coir strands
    for (let x = 0; x < size; x += 3 + Math.random() * 4) {
      ctx.fillStyle = 'rgba(50, 38, 26, 0.25)';
      ctx.fillRect(x, 0, 1.2, size);
    }

  } else if (type === 'joshua') {
    // Mojave Desert Joshua Tree (Shaggy Dried Leaf Scales) - Sun-warmed desert bark
    ctx.fillStyle = '#8e6e4f';
    ctx.fillRect(0, 0, size, size);

    // Prickly cross-hatched scales
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.08, y * 0.08, 2);
        const prickle = Math.sin(x * 0.18 + y * 0.15) * 0.4;
        heightfield[y * size + x] = Math.max(0, Math.min(1.0, 0.5 + prickle + n * 0.3));
      }
    }

    // Fibrous dried leaf tips with light sunlit accents
    for (let i = 0; i < 180; i++) {
      const jx = Math.random() * size, jy = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(200, 174, 135, 0.60)' : 'rgba(112, 84, 56, 0.45)';
      ctx.fillRect(jx, jy, 2 + Math.random() * 4, 3 + Math.random() * 6);
    }
  }

  // Smooth Heightfield with 3x3 Box Blur
  const smoothHeightfield = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;
      const sum =
        heightfield[yPrev * size + xPrev] + heightfield[yPrev * size + x] + heightfield[yPrev * size + xNext] +
        heightfield[y * size + xPrev]     + heightfield[y * size + x] * 2 + heightfield[y * size + xNext] +
        heightfield[yNext * size + xPrev] + heightfield[yNext * size + x] + heightfield[yNext * size + xNext];
      smoothHeightfield[y * size + x] = sum / 10.0;
    }
  }

  const normalImg = sobelHeightToNormal(smoothHeightfield, size, 3.2);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. TREE FOLIAGE PBR TEXTURES (Redwood, Conifer, Cypress, Oak, Palm, Cactus, Joshua)
// ─────────────────────────────────────────────────────────────────────────────

export function createTreeFoliageTextures(type = 'conifer', size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  if (type === 'redwood') {
    // Coast Redwood Feathery Needle Sprays
    ctx.fillStyle = '#1e5230';
    ctx.fillRect(0, 0, size, size);

    // Layered flat needle sprays
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.05, y * 0.05, 3);
        heightfield[y * size + x] = n;
      }
    }

    // Feathery needle branchlets
    for (let i = 0; i < 350; i++) {
      const bx = Math.random() * size, by = Math.random() * size;
      const angle = (Math.random() - 0.5) * 0.6;
      const len = 8 + Math.random() * 16;
      const isTip = Math.random() > 0.5;

      ctx.strokeStyle = isTip ? 'rgba(68, 165, 98, 0.65)' : 'rgba(28, 88, 48, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(angle) * len, by + Math.sin(angle) * len);
      ctx.stroke();
    }

  } else if (type === 'conifer' || type === 'spruce' || type === 'fir') {
    // Dense Bristling Conifer Needle Tufts
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.06, y * 0.06, 3);
        heightfield[y * size + x] = n;
      }
    }

    // Radial needle clusters
    for (let i = 0; i < 180; i++) {
      const cx = Math.random() * size, cy = Math.random() * size;
      const r = 6 + Math.random() * 14;
      const foliageGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      foliageGrad.addColorStop(0.0, 'rgba(56, 142, 99, 0.75)');
      foliageGrad.addColorStop(0.7, 'rgba(32, 85, 58, 0.50)');
      foliageGrad.addColorStop(1.0, 'rgba(18, 48, 32, 0.0)');
      ctx.fillStyle = foliageGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (type === 'cypress') {
    // Monterey Cypress Compact Rounded Scale Clumps
    ctx.fillStyle = '#244f36';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.04, y * 0.04, 3);
        heightfield[y * size + x] = n;
      }
    }

    // Billowy foliage clumps
    for (let i = 0; i < 140; i++) {
      const cx = Math.random() * size, cy = Math.random() * size;
      const r = 10 + Math.random() * 20;
      const cypGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      cypGrad.addColorStop(0.0, 'rgba(58, 128, 88, 0.80)');
      cypGrad.addColorStop(0.65, 'rgba(38, 85, 58, 0.45)');
      cypGrad.addColorStop(1.0, 'rgba(20, 50, 32, 0.0)');
      ctx.fillStyle = cypGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (type === 'oak' || type === 'broadleaf') {
    // Deciduous Live Oak Leaf Clustered Canopy
    ctx.fillStyle = '#3a6b2a';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.05, y * 0.05, 3);
        heightfield[y * size + x] = n;
      }
    }

    // Leaf cluster mottling with sunlit highlights
    for (let i = 0; i < 200; i++) {
      const lx = Math.random() * size, ly = Math.random() * size;
      const lr = 7 + Math.random() * 16;
      ctx.fillStyle = Math.random() > 0.45 ? 'rgba(98, 168, 70, 0.55)' : 'rgba(42, 85, 32, 0.45)';
      ctx.beginPath();
      ctx.ellipse(lx, ly, lr, lr * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (type === 'palm') {
    // Tropical Fan & Feather Palm Leaflets
    ctx.fillStyle = '#2d7738';
    ctx.fillRect(0, 0, size, size);

    // Parallel leaflet ridges
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const blade = Math.sin(x * 0.25 + y * 0.10) * 0.4 + 0.5;
        heightfield[y * size + x] = blade;
      }
    }

    // Linear radiating leaflet streaks
    for (let x = 0; x < size; x += 6) {
      ctx.fillStyle = 'rgba(78, 185, 95, 0.45)';
      ctx.fillRect(x, 0, 2.5, size);
      ctx.fillStyle = 'rgba(22, 68, 30, 0.40)';
      ctx.fillRect(x + 2.5, 0, 2.5, size);
    }

  } else if (type === 'cactus') {
    // Desert Saguaro Pleated Accordion Ribs & Spine Clusters
    ctx.fillStyle = '#3d6e46';
    ctx.fillRect(0, 0, size, size);

    // Vertical accordion ribs
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const rib = Math.sin((x / size) * Math.PI * 12.0) * 0.5 + 0.5;
        heightfield[y * size + x] = rib;
      }
    }

    // Alternating rib shading (light on crest, dark in valley)
    const ribGrad = ctx.createLinearGradient(0, 0, size, 0);
    for (let r = 0; r < 6; r++) {
      const step = 1.0 / 6;
      const baseT = r * step;
      ribGrad.addColorStop(baseT + 0.00, 'rgba(25, 55, 32, 0.55)');
      ribGrad.addColorStop(baseT + step * 0.5, 'rgba(88, 155, 100, 0.45)');
      ribGrad.addColorStop(baseT + step, 'rgba(25, 55, 32, 0.55)');
    }
    ctx.fillStyle = ribGrad;
    ctx.fillRect(0, 0, size, size);

    // Spine areoles with pale desert spine tufts
    for (let rx = 0; rx < size; rx += size / 6) {
      for (let ry = 12; ry < size; ry += 24) {
        ctx.fillStyle = 'rgba(235, 225, 195, 0.90)';
        ctx.beginPath();
        ctx.arc(rx + size / 12, ry, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

  } else if (type === 'joshua') {
    // Mojave Desert Joshua Tree Spiky Rosette Clumps - Sunlit desert green
    ctx.fillStyle = '#449638';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noiseGen.fbm(x * 0.05, y * 0.05, 3);
        heightfield[y * size + x] = n;
      }
    }

    // Radiating spiky needle rosettes with warm chartreuse highlights
    for (let i = 0; i < 160; i++) {
      const cx = Math.random() * size, cy = Math.random() * size;
      const r = 8 + Math.random() * 16;
      const joshGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      joshGrad.addColorStop(0.0, 'rgba(142, 212, 76, 0.86)');
      joshGrad.addColorStop(0.55, 'rgba(78, 172, 54, 0.58)');
      joshGrad.addColorStop(1.0, 'rgba(36, 110, 24, 0.0)');
      ctx.fillStyle = joshGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Sharp radiating dagger needle strokes
      const numNeedles = 6 + Math.floor(Math.random() * 6);
      for (let s = 0; s < numNeedles; s++) {
        const rad = (s / numNeedles) * Math.PI * 2 + Math.random() * 0.3;
        const nLen = r * (0.8 + Math.random() * 0.6);
        ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(162, 226, 88, 0.76)' : 'rgba(88, 186, 60, 0.68)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * nLen, cy + Math.sin(rad) * nLen);
        ctx.stroke();
      }
    }
  }

  const normalStrength = type === 'cactus' ? 3.4 : (type === 'palm' ? 2.6 : (type === 'joshua' ? 2.8 : 2.2));
  const normalImg = sobelHeightToNormal(heightfield, size, normalStrength);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. RUSTIC WOOD PLANKS (Redwood, Barn Red, Driftwood)
// ─────────────────────────────────────────────────────────────────────────────

export function createRusticPlankTextures(type = 'redwood', size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  const baseCol = type === 'barn_red' ? '#8d2b24' : (type === 'driftwood' ? '#7a746c' : '#623c26');
  ctx.fillStyle = baseCol;
  ctx.fillRect(0, 0, size, size);

  // Horizontal plank seams every 32px
  const plankH = 32;
  const numPlanks = size / plankH;

  for (let p = 0; p < numPlanks; p++) {
    const py = p * plankH;
    // Plank color variation
    const plankAlpha = (Math.sin(p * 2.3) * 0.5 + 0.5) * 0.15;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${plankAlpha})` : `rgba(0,0,0,${plankAlpha})`;
    ctx.fillRect(0, py, size, plankH);

    // Wood grain lines
    for (let g = 0; g < 4; g++) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, py + Math.random() * plankH, size, 1.2);
    }

    // Recessed dark seam
    ctx.fillStyle = 'rgba(20, 12, 8, 0.65)';
    ctx.fillRect(0, py + plankH - 2, size, 2);

    // Iron nail heads
    for (let nx = 18; nx < size; nx += 64) {
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(nx, py + plankH * 0.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Heightfield for recessed plank seams
  for (let y = 0; y < size; y++) {
    const plankY = y % plankH;
    const seam = (plankY >= plankH - 2) ? 0.2 : 0.8;
    for (let x = 0; x < size; x++) {
      const fiber = (Math.random() - 0.5) * 0.08;
      heightfield[y * size + x] = seam + fiber;
    }
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 3.4);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. CORRUGATED TIN & RUSTED METAL
// ─────────────────────────────────────────────────────────────────────────────

export function createCorrugatedTinTextures(size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  ctx.fillStyle = '#8a929b';
  ctx.fillRect(0, 0, size, size);

  // Sinusoidal corrugation waves along horizontal axis
  for (let x = 0; x < size; x++) {
    const wave = Math.sin((x / size) * Math.PI * 16.0);
    const h = wave * 0.5 + 0.5;
    for (let y = 0; y < size; y++) {
      heightfield[y * size + x] = h;
    }
  }

  // Wave lighting gradient
  const waveGrad = ctx.createLinearGradient(0, 0, size, 0);
  for (let w = 0; w < 8; w++) {
    const step = 1.0 / 8;
    const baseT = w * step;
    waveGrad.addColorStop(baseT + 0.00, 'rgba(60, 65, 72, 0.45)');
    waveGrad.addColorStop(baseT + step * 0.5, 'rgba(255, 255, 255, 0.35)');
    waveGrad.addColorStop(baseT + step, 'rgba(60, 65, 72, 0.45)');
  }
  ctx.fillStyle = waveGrad;
  ctx.fillRect(0, 0, size, size);

  // Zinc spangle crystalline mottling
  for (let i = 0; i < 220; i++) {
    const sx = Math.random() * size, sy = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(230, 235, 245, 0.35)' : 'rgba(95, 102, 110, 0.35)';
    ctx.fillRect(sx, sy, 3 + Math.random() * 5, 3 + Math.random() * 5);
  }

  // Drainage rust streaks along bottom edge
  const rustGrad = ctx.createLinearGradient(0, size * 0.7, 0, size);
  rustGrad.addColorStop(0.0, 'rgba(139, 68, 43, 0.0)');
  rustGrad.addColorStop(0.6, 'rgba(139, 68, 43, 0.35)');
  rustGrad.addColorStop(1.0, 'rgba(110, 48, 28, 0.65)');
  ctx.fillStyle = rustGrad;
  ctx.fillRect(0, size * 0.7, size, size * 0.3);

  const normalImg = sobelHeightToNormal(heightfield, size, 4.0);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

export function createRustedMetalTextures(size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  ctx.fillStyle = '#5a3424';
  ctx.fillRect(0, 0, size, size);

  // Multi-octave pitted corrosion heightfield
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = noiseGen.fbm(x * 0.04, y * 0.04, 4);
      heightfield[y * size + x] = n;
    }
  }

  // Flaking orange-brown rust patches & dark pits
  const rustColors = ['#aa4824', '#c25a30', '#853218', '#38160c', '#542614'];
  for (let i = 0; i < 160; i++) {
    const rx = Math.random() * size, ry = Math.random() * size;
    const r = 4 + Math.random() * 18;
    ctx.fillStyle = rustColors[Math.floor(Math.random() * rustColors.length)];
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Worn bare steel highlights
  for (let i = 0; i < 30; i++) {
    const sx = Math.random() * size, sy = Math.random() * size;
    ctx.fillStyle = 'rgba(160, 168, 175, 0.45)';
    ctx.fillRect(sx, sy, 2 + Math.random() * 6, 2 + Math.random() * 4);
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 3.5);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. DISTANT MOUNTAIN RIDGE CRAGS & STRATA (Multi-Zone Alpine & Desert Rock)
// ─────────────────────────────────────────────────────────────────────────────

export function createMountainRidgeTextures(size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  // Alpine / Mountain Base Rock
  ctx.fillStyle = '#484f58';
  ctx.fillRect(0, 0, size, size);

  // Horizontal geological strata bands
  const strataColors = ['#5a626c', '#383d44', '#685444', '#7c6552', '#2f343b', '#4e555e', '#6e7782'];
  let curY = 0;
  while (curY < size) {
    const bandH = 14 + Math.random() * 36;
    const col = strataColors[Math.floor(Math.random() * strataColors.length)];
    ctx.fillStyle = col;
    ctx.fillRect(0, curY, size, bandH);

    // Fine internal striations
    for (let s = 0; s < 4; s++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, curY + Math.random() * bandH, size, 1.5);
    }
    curY += bandH;
  }

  // Vertical avalanche couloirs, erosion chutes & tectonic fissures
  for (let x = 0; x < size; x += 16 + Math.random() * 28) {
    const chuteGrad = ctx.createLinearGradient(x, 0, x + 10, size);
    chuteGrad.addColorStop(0.0, 'rgba(20, 24, 28, 0.65)');
    chuteGrad.addColorStop(1.0, 'rgba(20, 24, 28, 0.25)');
    ctx.fillStyle = chuteGrad;
    ctx.fillRect(x, 0, 4 + Math.random() * 8, size);
  }

  // Heightfield derived from stepped cliff ledges and couloirs
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n1 = noiseGen.fbm(x * 0.02, y * 0.02, 3);
      const step = ((y % 45) / 45) * 0.6;
      const crag = Math.sin(x * 0.05 + n1 * 3.0) * 0.25;
      heightfield[y * size + x] = Math.max(0, Math.min(1.0, step + crag + n1 * 0.25));
    }
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 3.8);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;
  texDiff.anisotropy = 4;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;
  texNorm.anisotropy = 4;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. WATERFALL CASCADE PBR TEXTURES (Rushing Aerated Foam & Striated Flow)
// ─────────────────────────────────────────────────────────────────────────────

export function createWaterfallCascadeTextures(size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  ctx.clearRect(0, 0, size, size);
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      // Edge mask: smooth horizontal falloff towards sides (0 at edges, 1 at center)
      const edgeDist = Math.sin(u * Math.PI);
      const edgeAlpha = Math.pow(edgeDist, 0.42);

      // Fast vertical striation noise: stretch noise heavily along Y
      const n1 = noiseGen.fbm(x * 0.045, y * 0.008, 4);
      const n2 = noiseGen.noise(x * 0.09 + 20.0, y * 0.015);
      const verticalStream = Math.sin(x * 0.15 + n1 * 4.0) * 0.5 + 0.5;

      // Foam streak intensity
      const foam = Math.pow(n1 * 0.65 + verticalStream * 0.35, 1.35) * (0.8 + 0.2 * n2);

      // Deep mountain water: rich cyan/turquoise; Foam: crisp bright white
      const r = Math.min(255, Math.floor((110 * (1.0 - foam) + 252 * foam)));
      const g = Math.min(255, Math.floor((210 * (1.0 - foam) + 255 * foam)));
      const b = Math.min(255, Math.floor((238 * (1.0 - foam) + 255 * foam)));

      // Semi-translucent water body (0.55), fully opaque white frothy cascades (0.95)
      const alpha = Math.min(255, Math.floor((0.55 + 0.42 * foam) * edgeAlpha * 255));

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = alpha;

      heightfield[y * size + x] = Math.max(0, Math.min(1.0, foam * 0.8 + verticalStream * 0.2));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Micro-bubble spray aeration specks
  for (let i = 0; i < size * size * 0.02; i++) {
    const rx = Math.random() * size;
    const ry = Math.random() * size;
    const u = rx / size;
    const edgeAlpha = Math.sin(u * Math.PI);
    if (Math.random() < edgeAlpha) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(rx, ry, 1.2, 2.5);
    }
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 3.2);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. WATERFALL SOFT GAUSSIAN MIST TEXTURE (Zero Cardboard Edges)
// ─────────────────────────────────────────────────────────────────────────────

export function createWaterfallMistTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const center = size * 0.5;
  const maxR = size * 0.48;

  for (let y = 0; y < size; y++) {
    const dy = (y - center) / maxR;
    for (let x = 0; x < size; x++) {
      const dx = (x - center) / maxR;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= 1.0) {
        continue;
      }

      // Smooth Gaussian radial falloff to 0 at perimeter
      const radialFade = Math.exp(-dist * dist * 3.5) * Math.cos(dist * Math.PI * 0.5);

      // Organic multi-octave cloud turbulence
      const nx = x * 0.025;
      const ny = y * 0.025;
      const noise = noiseGen.fbm(nx, ny, 3);
      const turbulence = 0.65 + 0.35 * noise;

      const alpha = Math.max(0, Math.min(255, Math.floor(radialFade * turbulence * 210)));

      const idx = (y * size + x) * 4;
      // Pale aerated mist with soft sky-reflectance
      data[idx] = 242;
      data[idx + 1] = 250;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. WATERFALL PLUNGE POOL & RIPPLE TEXTURES (Impact Boil & Concentric Waves)
// ─────────────────────────────────────────────────────────────────────────────

export function createWaterfallPoolRippleTextures(size = 256) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  const center = size * 0.5;
  const maxR = size * 0.48;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    const dy = (y - center) / maxR;
    for (let x = 0; x < size; x++) {
      const dx = (x - center) / maxR;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= 1.0) {
        heightfield[y * size + x] = 0.5;
        continue;
      }

      const fade = Math.cos(dist * Math.PI * 0.5);
      const n = noiseGen.noise(x * 0.05, y * 0.05);

      // Concentric ripples expanding outward
      const wave = Math.sin(dist * 36.0 + n * 4.0);
      heightfield[y * size + x] = 0.5 + wave * 0.4 * fade;

      // Foam rings and central hydraulic boil
      const isBoil = dist < 0.28;
      const boilFoam = isBoil ? (1.0 - dist / 0.28) * (0.7 + 0.3 * n) : 0.0;
      const crestFoam = Math.max(0.0, wave - 0.5) * 1.6 * fade;
      const totalFoam = Math.min(1.0, boilFoam + crestFoam);

      const alpha = Math.floor(totalFoam * 220);
      const idx = (y * size + x) * 4;
      data[idx] = 235;
      data[idx + 1] = 248;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const normalImg = sobelHeightToNormal(heightfield, size, 4.0);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.ClampToEdgeWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.generateMipmaps = true;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.ClampToEdgeWrapping;
  texNorm.generateMipmaps = true;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. DESERT ROCK CRAWL & DIRT EXPEDITION TRAIL PBR TEXTURES
// ─────────────────────────────────────────────────────────────────────────────

export function createDesertRockCrawlTrailTextures(size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  // Base sunbaked decomposed granite & sandstone dirt (#b6834d)
  ctx.fillStyle = '#b6834d';
  ctx.fillRect(0, 0, size, size);

  // Caliche and compressed dirt heightfield
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      // Tire rut depressions at u ≈ 0.28 and u ≈ 0.72
      const dL = Math.abs(u - 0.28);
      const dR = Math.abs(u - 0.72);
      const rutDepth = (dL < 0.12 ? Math.cos((dL / 0.12) * Math.PI * 0.5) : 0.0) +
                       (dR < 0.12 ? Math.cos((dR / 0.12) * Math.PI * 0.5) : 0.0);

      const n1 = noiseGen.fbm(x * 0.03, y * 0.03, 4);
      const microGravel = (Math.random() - 0.5) * 0.12;

      const h = Math.max(0, Math.min(1.0, 0.55 + n1 * 0.3 - rutDepth * 0.25 + microGravel));
      heightfield[y * size + x] = h;
    }
  }

  // Multi-toned earth sweeps (warm ochre, sunbleached sandstone, sienna)
  for (let i = 0; i < 40; i++) {
    const rx = Math.random() * size, ry = Math.random() * size, r = 18 + Math.random() * 45;
    const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, r);
    const isLight = Math.random() > 0.45;
    grad.addColorStop(0.0, isLight ? 'rgba(230, 185, 125, 0.40)' : 'rgba(135, 78, 38, 0.30)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark tire rubber compaction tracks
  [0.28, 0.72].forEach(trackU => {
    const trackX = trackU * size;
    const trackGrad = ctx.createLinearGradient(trackX - 35, 0, trackX + 35, 0);
    trackGrad.addColorStop(0.0, 'rgba(60, 42, 28, 0.0)');
    trackGrad.addColorStop(0.5, 'rgba(48, 32, 20, 0.45)');
    trackGrad.addColorStop(1.0, 'rgba(60, 42, 28, 0.0)');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(trackX - 35, 0, 70, size);
  });

  // Loose mineral stones & quartz pebbles
  for (let i = 0; i < size * size * 0.012; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const isPebble = Math.random() > 0.5;
    ctx.fillStyle = isPebble ? 'rgba(240, 230, 210, 0.75)' : 'rgba(75, 48, 25, 0.65)';
    const rad = 1.0 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 3.5);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 19. MOUNTAIN STREAM FLOWING WATER PBR (Directional Current, Caustics, Ripples)
// ─────────────────────────────────────────────────────────────────────────────

export function createMountainStreamTextures(size = 512) {
  const cDiff = document.createElement('canvas');
  cDiff.width = size; cDiff.height = size;
  const ctx = cDiff.getContext('2d');
  const heightfield = new Float32Array(size * size);

  ctx.clearRect(0, 0, size, size);
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;

      // Elongated current noise along Y (downstream flow)
      const nCurrent = noiseGen.fbm(x * 0.035, y * 0.012, 4);
      const nTurbulence = noiseGen.noise(x * 0.07 + 15.0, y * 0.025 + 32.0);
      const wave = Math.sin(y * 0.09 + nCurrent * 5.0 + Math.sin(x * 0.05) * 2.0) * 0.5 + 0.5;

      // Subtle simulated underwater caustic refraction patterns
      const nCaustic1 = noiseGen.noise(x * 0.06, y * 0.06);
      const nCaustic2 = noiseGen.noise(x * 0.06 + 50.0, y * 0.06 + 50.0);
      const caustic = Math.pow(Math.abs(nCaustic1 - nCaustic2), 0.75);

      // Deep clear mountain water with emerald/cyan gradient and bright current ripples
      const depthFactor = 0.70 + 0.30 * nCurrent;
      const rippleHighlight = Math.pow(wave * 0.65 + nTurbulence * 0.35, 2.0) * 0.55;

      const r = Math.min(255, Math.floor((14 + 18 * depthFactor + rippleHighlight * 140 + caustic * 35)));
      const g = Math.min(255, Math.floor((142 * depthFactor + rippleHighlight * 95 + caustic * 40)));
      const b = Math.min(255, Math.floor((210 * depthFactor + rippleHighlight * 45 + caustic * 30)));
      const alpha = Math.min(255, Math.floor((0.72 + 0.22 * wave) * 255));

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = alpha;

      heightfield[y * size + x] = Math.max(0, Math.min(1.0, wave * 0.65 + nCurrent * 0.25 + caustic * 0.10));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Micro-glint water sparkle points
  for (let i = 0; i < size * size * 0.006; i++) {
    const rx = Math.random() * size;
    const ry = Math.random() * size;
    ctx.fillStyle = 'rgba(235, 250, 255, 0.70)';
    ctx.fillRect(rx, ry, 1.2, 1.2);
  }

  const normalImg = sobelHeightToNormal(heightfield, size, 2.6);
  const cNorm = document.createElement('canvas');
  cNorm.width = size; cNorm.height = size;
  cNorm.getContext('2d').putImageData(normalImg, 0, 0);

  const texDiff = new THREE.CanvasTexture(cDiff);
  texDiff.wrapS = texDiff.wrapT = THREE.RepeatWrapping;
  texDiff.colorSpace = THREE.SRGBColorSpace;
  texDiff.minFilter = THREE.LinearMipmapLinearFilter;
  texDiff.magFilter = THREE.LinearFilter;
  texDiff.generateMipmaps = true;

  const texNorm = new THREE.CanvasTexture(cNorm);
  texNorm.wrapS = texNorm.wrapT = THREE.RepeatWrapping;
  texNorm.minFilter = THREE.LinearMipmapLinearFilter;
  texNorm.magFilter = THREE.LinearFilter;
  texNorm.generateMipmaps = true;

  return { diffuse: texDiff, normal: texNorm };
}

// ─────────────────────────────────────────────────────────────────────────────
// 20. STREAM EDDY & RAPIDS FOAM TEXTURE (Aerated Bubbles, Soft Organic Lace)
// ─────────────────────────────────────────────────────────────────────────────

export function createStreamFoamTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n1 = noiseGen.fbm(x * 0.045, y * 0.045, 4);
      const n2 = noiseGen.noise(x * 0.10 + 25.0, y * 0.10 + 25.0);
      const cellNoise = Math.pow(n1 * 0.70 + n2 * 0.30, 1.5);

      // Foam lace threshold
      const isFoam = cellNoise > 0.42;
      const foamVal = isFoam ? Math.min(1.0, (cellNoise - 0.42) / 0.58) : 0;
      const alpha = Math.floor(foamVal * 225);

      const idx = (y * size + x) * 4;
      data[idx] = Math.min(255, 235 + Math.floor(foamVal * 20));
      data[idx + 1] = Math.min(255, 248 + Math.floor(foamVal * 7));
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}



