import * as THREE from 'three';
import {
  createRealisticAsphaltTextures,
  createRoadMarkingTexture,
  createCurbConcreteTexture,
  createGravelShoulderTextures,
  createBiomeTerrainTextures,
  createConcreteBarrierTextures,
  createGuardrailSteelTextures,
  createStoneMasonryTextures,
  createWeatheredWoodTextures,
  createCloudNoiseTexture,
  createTreeBarkTextures,
  createTreeFoliageTextures,
  createRusticPlankTextures,
  createCorrugatedTinTextures,
  createRustedMetalTextures,
  createMountainRidgeTextures,
  createWaterfallCascadeTextures,
  createWaterfallMistTexture,
  createWaterfallPoolRippleTextures,
  createDesertRockCrawlTrailTextures,
  createMountainStreamTextures,
  createStreamFoamTexture
} from './ProceduralPBRTextures.js';

/**
 * Procedural canvas textures — no external assets needed.
 * Generates tiling asphalt, terrain detail noise, and a sky gradient dome texture.
 */
export class TextureFactory {
  constructor() {
    this._cache = new Map();
  }

  _makeCanvas(size) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    return c;
  }

  /** Realistic PBR Asphalt System (Diffuse, Normal, Roughness) */
  asphaltPBR(size = 512) {
    const key = 'asphalt_pbr_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createRealisticAsphaltTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('asphalt_normal_pbr_' + size, pbr.normal);
    this._cache.set('asphalt_roughness_pbr_' + size, pbr.roughness);
    return pbr.diffuse;
  }

  asphaltNormalPBR(size = 512) {
    const key = 'asphalt_normal_pbr_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.asphaltPBR(size);
    return this._cache.get(key);
  }

  asphaltRoughnessPBR(size = 512) {
    const key = 'asphalt_roughness_pbr_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.asphaltPBR(size);
    return this._cache.get(key);
  }

  /** Realistic Road Markings / Striping */
  roadMarkingsPBR(colorHex = '#facc15', size = 256) {
    const key = 'road_markings_' + colorHex + '_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const tex = createRoadMarkingTexture(colorHex, size);
    this._cache.set(key, tex);
    return tex;
  }

  /** Concrete Curbs & Parking Stops */
  curbConcretePBR(size = 256) {
    const key = 'curb_concrete_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const tex = createCurbConcreteTexture(size);
    this._cache.set(key, tex);
    return tex;
  }

  /** Crushed Gravel Road Shoulder */
  gravelShoulderPBR(size = 256) {
    const key = 'gravel_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createGravelShoulderTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('gravel_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  gravelShoulderNormalPBR(size = 256) {
    const key = 'gravel_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.gravelShoulderPBR(size);
    return this._cache.get(key);
  }

  /** Multi-Biome Terrain Diffuse & Normal Maps */
  terrainPBR(biomeKey = 'desert_sand', size = 512) {
    const key = 'terrain_diff_' + biomeKey + '_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createBiomeTerrainTextures(biomeKey, size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('terrain_norm_' + biomeKey + '_' + size, pbr.normal);
    return pbr.diffuse;
  }

  terrainNormalPBR(biomeKey = 'desert_sand', size = 512) {
    const key = 'terrain_norm_' + biomeKey + '_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.terrainPBR(biomeKey, size);
    return this._cache.get(key);
  }

  /** Concrete Jersey Barriers (Poured Form Seams, Pockmarks, Grime) */
  concreteBarrierPBR(size = 512) {
    const key = 'barrier_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createConcreteBarrierTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('barrier_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  concreteBarrierNormalPBR(size = 512) {
    const key = 'barrier_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.concreteBarrierPBR(size);
    return this._cache.get(key);
  }

  /** Galvanized Steel Guardrails (W-Beam Profile + Zinc Spangle) */
  guardrailSteelPBR(size = 256) {
    const key = 'guardrail_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createGuardrailSteelTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('guardrail_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  guardrailSteelNormalPBR(size = 256) {
    const key = 'guardrail_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.guardrailSteelPBR(size);
    return this._cache.get(key);
  }

  /** Authentic Stone Masonry */
  stoneMasonryPBR(size = 512) {
    const key = 'stone_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createStoneMasonryTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('stone_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  stoneMasonryNormalPBR(size = 512) {
    const key = 'stone_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.stoneMasonryPBR(size);
    return this._cache.get(key);
  }

  /** Weathered Timber / Wood */
  weatheredWoodPBR(size = 512) {
    const key = 'wood_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createWeatheredWoodTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('wood_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  weatheredWoodNormalPBR(size = 512) {
    const key = 'wood_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.weatheredWoodPBR(size);
    return this._cache.get(key);
  }

  /** Volumetric Soft Cloud Noise */
  cloudNoisePBR(size = 256) {
    const key = 'cloud_noise_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const tex = createCloudNoiseTexture(size);
    this._cache.set(key, tex);
    return tex;
  }

  /** Distant Mountain Ridge Rock Crags & Sedimentary Strata */
  mountainRidgePBR(size = 512) {
    const key = 'mountain_ridge_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createMountainRidgeTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('mountain_ridge_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  mountainRidgeNormalPBR(size = 512) {
    const key = 'mountain_ridge_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.mountainRidgePBR(size);
    return this._cache.get(key);
  }

  /** Cascading Mountain Waterfall Water (Striated flow, aerated whitewater foam) */
  waterfallCascadePBR(size = 512) {
    const key = 'wf_cascade_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createWaterfallCascadeTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('wf_cascade_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  waterfallCascadeNormalPBR(size = 512) {
    const key = 'wf_cascade_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.waterfallCascadePBR(size);
    return this._cache.get(key);
  }

  /** Soft Billowy Waterfall Mist (Gaussian radial alpha falloff, zero square card edges) */
  waterfallMist(size = 256) {
    const key = 'wf_mist_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const tex = createWaterfallMistTexture(size);
    this._cache.set(key, tex);
    return tex;
  }

  /** Plunge Pool Concentric Expanding Ripples & Hydraulic Impact Foam */
  waterfallPoolRipplePBR(size = 256) {
    const key = 'wf_ripple_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createWaterfallPoolRippleTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('wf_ripple_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  waterfallPoolRippleNormalPBR(size = 256) {
    const key = 'wf_ripple_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.waterfallPoolRipplePBR(size);
    return this._cache.get(key);
  }

  /** Mountain Stream Flowing Water PBR (Directional Current, Caustics, Depth) */
  mountainStreamPBR(size = 512) {
    const key = 'mtn_stream_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createMountainStreamTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('mtn_stream_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  mountainStreamNormalPBR(size = 512) {
    const key = 'mtn_stream_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.mountainStreamPBR(size);
    return this._cache.get(key);
  }

  /** Stream Rapids & Obstacle Eddy Foam Lace (Soft Organic Whitewater) */
  streamFoam(size = 256) {
    const key = 'stream_foam_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const tex = createStreamFoamTexture(size);
    this._cache.set(key, tex);
    return tex;
  }

  /** Authentic Mojave Desert Mountain Rock Crawl Trail PBR (Sunbaked caliche, gravel ruts) */
  desertRockCrawlTrailPBR(size = 512) {
    const key = 'desert_trail_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createDesertRockCrawlTrailTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('desert_trail_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  desertRockCrawlTrailNormalPBR(size = 512) {
    const key = 'desert_trail_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.desertRockCrawlTrailPBR(size);
    return this._cache.get(key);
  }

  /** Tree Bark PBR (Redwood, Pine, Cypress, Oak, Palm, Joshua) */
  treeBarkPBR(type = 'redwood', size = 256) {
    const key = `tree_bark_diff_${type}_${size}`;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createTreeBarkTextures(type, size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set(`tree_bark_norm_${type}_${size}`, pbr.normal);
    return pbr.diffuse;
  }

  treeBarkNormalPBR(type = 'redwood', size = 256) {
    const key = `tree_bark_norm_${type}_${size}`;
    if (this._cache.has(key)) return this._cache.get(key);
    this.treeBarkPBR(type, size);
    return this._cache.get(key);
  }

  /** Tree Foliage PBR (Redwood, Conifer, Cypress, Oak, Palm, Cactus, Joshua) */
  treeFoliagePBR(type = 'conifer', size = 256) {
    const key = `tree_foliage_diff_${type}_${size}`;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createTreeFoliageTextures(type, size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set(`tree_foliage_norm_${type}_${size}`, pbr.normal);
    return pbr.diffuse;
  }

  treeFoliageNormalPBR(type = 'conifer', size = 256) {
    const key = `tree_foliage_norm_${type}_${size}`;
    if (this._cache.has(key)) return this._cache.get(key);
    this.treeFoliagePBR(type, size);
    return this._cache.get(key);
  }

  /** Rustic Wood Planks (Redwood, Barn Red, Driftwood) */
  rusticPlankPBR(type = 'redwood', size = 256) {
    const key = `rustic_plank_diff_${type}_${size}`;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createRusticPlankTextures(type, size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set(`rustic_plank_norm_${type}_${size}`, pbr.normal);
    return pbr.diffuse;
  }

  rusticPlankNormalPBR(type = 'redwood', size = 256) {
    const key = `rustic_plank_norm_${type}_${size}`;
    if (this._cache.has(key)) return this._cache.get(key);
    this.rusticPlankPBR(type, size);
    return this._cache.get(key);
  }

  /** Corrugated Galvanized Tin */
  corrugatedTinPBR(size = 256) {
    const key = 'corrugated_tin_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createCorrugatedTinTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('corrugated_tin_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  corrugatedTinNormalPBR(size = 256) {
    const key = 'corrugated_tin_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.corrugatedTinPBR(size);
    return this._cache.get(key);
  }

  /** Pitted Rusted Metal */
  rustedMetalPBR(size = 256) {
    const key = 'rusted_metal_diff_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const pbr = createRustedMetalTextures(size);
    this._cache.set(key, pbr.diffuse);
    this._cache.set('rusted_metal_norm_' + size, pbr.normal);
    return pbr.diffuse;
  }

  rustedMetalNormalPBR(size = 256) {
    const key = 'rusted_metal_norm_' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    this.rustedMetalPBR(size);
    return this._cache.get(key);
  }

  /** Tiling asphalt with subtle smooth aggregate + wear streaks (smooth, non-speckly). */
  asphalt(size = 256) {
    const key = 'asphalt' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#2a2d33';
    ctx.fillRect(0, 0, size, size);

    // Subtle blended aggregate chips
    const numChips = Math.floor(size * size / 160);
    for (let i = 0; i < numChips; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const rad = 1.2 + Math.random() * 2.0;
      ctx.fillStyle = `rgba(68,72,80,${0.18 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faint tire-wear darker compaction bands along V direction
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.18, 'rgba(0,0,0,0)');
    grad.addColorStop(0.30, 'rgba(12,13,16,0.22)');
    grad.addColorStop(0.42, 'rgba(0,0,0,0)');
    grad.addColorStop(0.60, 'rgba(0,0,0,0)');
    grad.addColorStop(0.72, 'rgba(12,13,16,0.22)');
    grad.addColorStop(0.85, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, tex);
    return tex;
  }

  /** Procedural Asphalt Normal Map (Smooth tactile micro-relief without flickering) */
  asphaltNormal(size = 256) {
    const key = 'asphaltNormal' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Smooth normal perturbation (subdued variance, base 128,128,255)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n1 = (Math.random() - 0.5) * 8.0;
        const n2 = (Math.random() - 0.5) * 8.0;
        data[idx + 0] = Math.min(255, Math.max(0, 128 + n1));
        data[idx + 1] = Math.min(255, Math.max(0, 128 + n2));
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this._cache.set(key, tex);
    return tex;
  }

  /** Terrain detail overlay: multi-octave value noise in grayscale to multiply over vertex colors. */
  terrainNoise(size = 256) {
    const key = 'tnoise' + size;
    if (this._cache.has(key)) return this._cache.get(key);
    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);

    // simple value-noise via layered random grids
    const grid = (n) => {
      const g = [];
      for (let i = 0; i <= n; i++) { g.push([]); for (let j = 0; j <= n; j++) g[i].push(Math.random()); }
      return (u, v) => {
        const gx = u * n, gy = v * n;
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const fx = gx - x0, fy = gy - y0;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = g[x0][y0] * (1-sx) + g[x0+1][y0] * sx;
        const b2 = g[x0][y0+1] * (1-sx) + g[x0+1][y0+1] * sx;
        return a * (1-sy) + b2 * sy;
      };
    };
    const n1 = grid(8), n2 = grid(16), n3 = grid(32), n4 = grid(64);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / size;
        // tileable: sample with wrap by mirroring
        const val =
          n1(u % 0.125 === 0 ? u : u, v) * 0.45 +
          n2(u, v) * 0.28 +
          n3(u, v) * 0.17 +
          n4(u, v) * 0.10;
        const g = Math.floor(150 + val * 105); // 150..255 brightness
        const i = (y * size + x) * 4;
        img.data[i] = g; img.data[i+1] = g; img.data[i+2] = g; img.data[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    this._cache.set(key, tex);
    return tex;
  }

  /** Advanced Panoramic Sky Dome Texture: multi-stop atmosphere, cirrus clouds, and distant mountain silhouettes. */
  skyDomePanorama(zone, width = 1024, height = 512) {
    const key = `sky_pano_${zone.id || 0}_${zone.skyTop}_${zone.skyHorizon}`;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');

    const topHex = zone.skyTop || '#13467e';
    const midHex = zone.skyMid || mixHex(topHex, zone.skyHorizon || '#f0ad65', 0.4);
    const horizonHex = zone.skyHorizon || '#f0ad65';
    const hazeHex = zone.hazeColor || lightenHex(horizonHex, 0.35);

    // 1. Atmosphere Gradient (Rayleigh / Mie scattering model)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0.00, lightenHex(topHex, -0.25));        // Deep space zenith
    skyGrad.addColorStop(0.22, lightenHex(topHex, -0.08));
    skyGrad.addColorStop(0.48, midHex);                           // Mid-sky hue
    skyGrad.addColorStop(0.70, mixHex(midHex, horizonHex, 0.60)); // Warm transition
    skyGrad.addColorStop(0.85, horizonHex);                       // Radiant golden horizon band
    skyGrad.addColorStop(0.96, hazeHex);                          // Ground haze
    skyGrad.addColorStop(1.00, lightenHex(hazeHex, 0.15));

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. High-Altitude Cirrus Cloud Wisps (Soft feathered streaks)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 18; i++) {
      const cy = height * (0.12 + (i / 18) * 0.42);
      const cx = (i * 137.5) % width;
      const w = 140 + (i % 5) * 60;
      const h = 8 + (i % 3) * 6;
      const alpha = 0.08 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 0.12;

      const cirrusGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, w * 0.5);
      cirrusGrad.addColorStop(0.0, `rgba(255, 250, 240, ${alpha})`);
      cirrusGrad.addColorStop(0.5, `rgba(255, 240, 220, ${alpha * 0.5})`);
      cirrusGrad.addColorStop(1.0, 'rgba(255, 240, 220, 0)');

      ctx.fillStyle = cirrusGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.5, h * 0.5, (i % 2 === 0 ? 0.08 : -0.06), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Distant Mountain Silhouettes on Horizon
    const horizonY = height * 0.52;
    const isDesert = (zone && zone.id === 0);

    // Layer A: Far Mountain Ridge (Deep atmospheric purple/blue-gray)
    ctx.save();
    const farPeakCol = isDesert
      ? mixHex(horizonHex, '#582438', 0.45) // Desert purple-rose ridge
      : mixHex(horizonHex, '#1a2a3a', 0.45);
    ctx.fillStyle = farPeakCol;
    ctx.globalAlpha = 0.55;

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 10) {
      const nx = x / width;
      let peakH = (Math.sin(nx * Math.PI * 8.0) * 0.5 + Math.sin(nx * Math.PI * 18.0) * 0.3 + Math.cos(nx * Math.PI * 34.0) * 0.2);
      peakH = Math.max(0, peakH) * (isDesert ? 80 : 90);
      if (isDesert && Math.abs(x - width * 0.35) < 110) peakH += 55 * Math.cos((x - width * 0.35) / 110 * Math.PI * 0.5);
      if (isDesert && Math.abs(x - width * 0.72) < 130) peakH += 68 * Math.cos((x - width * 0.72) / 130 * Math.PI * 0.5);
      ctx.lineTo(x, horizonY - peakH);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Layer B: Mid-Distant Mountain Ridge (Sharper, rich atmospheric contrast)
    ctx.save();
    const midPeakCol = isDesert
      ? mixHex(horizonHex, '#7d3826', 0.60) // Rich terracotta desert ridges
      : mixHex(horizonHex, '#1e3848', 0.65);
    ctx.fillStyle = midPeakCol;
    ctx.globalAlpha = 0.78;

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 10) {
      const nx = x / width;
      let ridgeH = (Math.sin((nx + 0.15) * Math.PI * 11.0) * 0.6 + Math.cos(nx * Math.PI * 23.0) * 0.4);
      ridgeH = Math.max(0, ridgeH) * (isDesert ? 55 : 65);
      // Distinctive mesa flat-top silhouettes in desert
      if (isDesert && ((x > 160 && x < 280) || (x > 580 && x < 720) || (x > 820 && x < 930))) {
        ridgeH = 58 + Math.sin(x * 0.05) * 3;
      }
      ctx.lineTo(x, horizonY - ridgeH + 4);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Horizon Ground Fog Layer (Blends mountains smoothly into terrain elevation)
    const hazeGrad = ctx.createLinearGradient(0, horizonY - 10, 0, height);
    hazeGrad.addColorStop(0.0, 'rgba(255,255,255,0)');
    hazeGrad.addColorStop(0.7, hexToRgba(hazeHex, 0.70));
    hazeGrad.addColorStop(1.0, hexToRgba(hazeHex, 0.95));
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, horizonY - 10, width, height - (horizonY - 10));

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    this._cache.set(key, tex);
    return tex;
  }

  /** Radiant Sun Corona Texture with multi-stage glow rings & solar rays. */
  sunCorona(size = 256) {
    const key = 'sun_corona_' + size;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');
    const center = size * 0.5;

    // 1. Soft Outer Atmospheric Halo
    const outerGrad = ctx.createRadialGradient(center, center, 0, center, center, center);
    outerGrad.addColorStop(0.0, 'rgba(255, 250, 220, 0.9)');
    outerGrad.addColorStop(0.18, 'rgba(255, 235, 170, 0.65)');
    outerGrad.addColorStop(0.42, 'rgba(255, 205, 110, 0.28)');
    outerGrad.addColorStop(0.75, 'rgba(255, 170, 70, 0.08)');
    outerGrad.addColorStop(1.0, 'rgba(255, 140, 40, 0.0)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Solar Flare Light Rays
    ctx.save();
    ctx.translate(center, center);
    const RAY_COUNT = 16;
    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = (i / RAY_COUNT) * Math.PI * 2;
      const rayLen = (i % 2 === 0 ? center * 0.95 : center * 0.65);
      const rayWidth = (i % 2 === 0 ? 0.09 : 0.05);

      const rayGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rayLen);
      rayGrad.addColorStop(0.0, 'rgba(255, 255, 245, 0.6)');
      rayGrad.addColorStop(0.3, 'rgba(255, 230, 150, 0.25)');
      rayGrad.addColorStop(1.0, 'rgba(255, 200, 100, 0.0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rayLen, angle - rayWidth, angle + rayWidth);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Ultra-Bright White-Hot Core Bloom
    const coreGrad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.28);
    coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    coreGrad.addColorStop(0.4, 'rgba(255, 255, 240, 0.95)');
    coreGrad.addColorStop(0.8, 'rgba(255, 245, 200, 0.5)');
    coreGrad.addColorStop(1.0, 'rgba(255, 230, 160, 0.0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, tex);
    return tex;
  }

  /** High-Altitude Feathered Cirrus Cloud Ribbon Texture */
  cirrusWisp(width = 512, height = 128) {
    const key = `cirrus_${width}_${height}`;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    grad.addColorStop(0.3, 'rgba(255, 252, 245, 0.65)');
    grad.addColorStop(0.5, 'rgba(255, 250, 240, 0.95)');
    grad.addColorStop(0.7, 'rgba(255, 245, 230, 0.60)');
    grad.addColorStop(1.0, 'rgba(255, 240, 220, 0.0)');

    // Feathered streaks with soft brush strokes
    ctx.fillStyle = grad;
    for (let i = 0; i < 14; i++) {
      const sx = (i * 37) % (width * 0.7);
      const sw = width * (0.3 + (i % 4) * 0.18);
      const sy = height * (0.2 + (i % 5) * 0.12);
      const sh = height * (0.15 + (i % 3) * 0.15);
      ctx.beginPath();
      ctx.ellipse(sx + sw * 0.5, sy + sh * 0.5, sw * 0.5, sh * 0.5, -0.04 + (i % 2) * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    // Feather horizontal edges to prevent rectangular artifacts
    ctx.globalCompositeOperation = 'destination-in';
    const edgeFade = ctx.createLinearGradient(0, 0, width, 0);
    edgeFade.addColorStop(0.0, 'rgba(0,0,0,0)');
    edgeFade.addColorStop(0.18, 'rgba(0,0,0,1)');
    edgeFade.addColorStop(0.82, 'rgba(0,0,0,1)');
    edgeFade.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeFade;
    ctx.fillRect(0, 0, width, height);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    this._cache.set(key, tex);
    return tex;
  }

  /** Ethereal Aurora Borealis Curtain Ribbon Texture (Zero Rectangle Artifacts) */
  auroraCurtain(type = 'green', width = 512, height = 256) {
    const key = `aurora_${type}_${width}_${height}`;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');

    const baseColor = (type === 'green') ? [0, 255, 140] : [186, 104, 200];
    const topColor = (type === 'green') ? [56, 189, 248] : [244, 114, 182];

    // Multi-beam vertical northern lights rays
    const RAY_COUNT = 28;
    for (let r = 0; r < RAY_COUNT; r++) {
      const rx = (r / RAY_COUNT) * width;
      const rw = (width / RAY_COUNT) * (1.6 + Math.sin(r * 1.4) * 0.6);
      const rayHeight = height * (0.65 + Math.cos(r * 2.3) * 0.3);
      const alpha = (Math.sin(r * 0.9) * 0.35 + 0.65) * 0.55;

      const grad = ctx.createLinearGradient(0, height, 0, height - rayHeight);
      grad.addColorStop(0.0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.18, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha * 0.85})`);
      grad.addColorStop(0.65, `rgba(${topColor[0]}, ${topColor[1]}, ${topColor[2]}, ${alpha * 0.5})`);
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(rx, height * 0.5, rw * 0.55, height * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4-Way Feathered Boundary Mask (100% transparent edges)
    ctx.globalCompositeOperation = 'destination-in';
    const horizMask = ctx.createLinearGradient(0, 0, width, 0);
    horizMask.addColorStop(0.0, 'rgba(0,0,0,0)');
    horizMask.addColorStop(0.20, 'rgba(0,0,0,1)');
    horizMask.addColorStop(0.80, 'rgba(0,0,0,1)');
    horizMask.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = horizMask;
    ctx.fillRect(0, 0, width, height);

    const vertMask = ctx.createLinearGradient(0, 0, 0, height);
    vertMask.addColorStop(0.0, 'rgba(0,0,0,0)');
    vertMask.addColorStop(0.25, 'rgba(0,0,0,1)');
    vertMask.addColorStop(0.75, 'rgba(0,0,0,1)');
    vertMask.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = vertMask;
    ctx.fillRect(0, 0, width, height);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    this._cache.set(key, tex);
    return tex;
  }

  /** Anamorphic Solar Starburst Flare Texture */
  sunStarburst(size = 256) {
    const key = 'sun_starburst_' + size;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');
    const center = size * 0.5;

    ctx.save();
    ctx.translate(center, center);

    // 4 major anamorphic rays
    for (let r = 0; r < 4; r++) {
      const angle = (r * Math.PI * 0.5) + (Math.PI * 0.25);
      const rayGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, center * 0.95);
      rayGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.9)');
      rayGrad.addColorStop(0.15, 'rgba(255, 235, 170, 0.5)');
      rayGrad.addColorStop(0.6, 'rgba(255, 200, 100, 0.12)');
      rayGrad.addColorStop(1.0, 'rgba(255, 180, 80, 0.0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, center * 0.95, 3.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, tex);
    return tex;
  }

  /** Sedimentary Sandstone Rock Strata Texture with distinct geological layers. */
  desertRockStrata(size = 256) {
    const key = 'rock_strata_' + size;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');

    // Base Terracotta Stone
    ctx.fillStyle = '#b6532d';
    ctx.fillRect(0, 0, size, size);

    // Geological sedimentary horizontal strata bands
    const strata = [
      { y: 0.05, h: 0.12, col: '#7a2814' }, // Dark iron-rich cap
      { y: 0.22, h: 0.08, col: '#d88b43' }, // Golden sandstone band
      { y: 0.35, h: 0.04, col: '#5c1e0e' }, // Dark manganese desert varnish stripe
      { y: 0.44, h: 0.16, col: '#c46234' }, // Red ochre
      { y: 0.65, h: 0.09, col: '#e2a358' }, // Light buff sand
      { y: 0.78, h: 0.05, col: '#6d2412' }, // Iron seam
      { y: 0.88, h: 0.10, col: '#9c4224' }  // Lower talus red
    ];

    strata.forEach(s => {
      ctx.fillStyle = s.col;
      const sy = s.y * size;
      const sh = s.h * size;
      ctx.fillRect(0, sy, size, sh);

      // Add horizontal striations along the band
      for (let j = 0; j < 6; j++) {
        const lineY = sy + Math.random() * sh;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.14)';
        ctx.fillRect(0, lineY, size, 1.5 + Math.random() * 2);
      }
    });

    // Vertical erosion fissures
    for (let x = 0; x < size; x += 18 + Math.random() * 24) {
      ctx.fillStyle = 'rgba(40, 10, 5, 0.12)';
      ctx.fillRect(x, 0, 3 + Math.random() * 4, size);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, tex);
    return tex;
  }

  /** Route 66 Highway Shield Texture. */
  route66Shield(size = 512) {
    const key = 'r66_shield_' + size;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');

    // Transparent Background
    ctx.clearRect(0, 0, size, size);

    // Outer Black Shield Silhouette
    ctx.fillStyle = '#18181c';
    drawShieldPath(ctx, size * 0.5, size * 0.48, size * 0.42);
    ctx.fill();

    // White Shield Field
    ctx.fillStyle = '#f8f8f2';
    drawShieldPath(ctx, size * 0.5, size * 0.48, size * 0.38);
    ctx.fill();

    // Inner Black Border
    ctx.lineWidth = size * 0.028;
    ctx.strokeStyle = '#18181c';
    drawShieldPath(ctx, size * 0.5, size * 0.48, size * 0.35);
    ctx.stroke();

    // Text: "ROUTE" top
    ctx.fillStyle = '#18181c';
    ctx.font = `900 ${Math.round(size * 0.12)}px 'Arial Black', Impact, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROUTE', size * 0.5, size * 0.28);

    // Text: "66" bold center
    ctx.font = `900 ${Math.round(size * 0.40)}px 'Arial Black', Impact, system-ui, sans-serif`;
    ctx.fillText('66', size * 0.5, size * 0.58);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.anisotropy = 16;
    this._cache.set(key, tex);
    return tex;
  }

  /** Retro Highway Billboard Texture — High-Contrast, Razor Sharp 2048x1024 with 16x Anisotropy. */
  retroBillboard(title = 'ROUTE 66', sub = 'DINER & GAS', accent = '#e63946', size = 2048) {
    const key = `billboard_${title}_${sub}_${accent}_${size}`;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = document.createElement('canvas');
    c.width = size;
    c.height = Math.round(size * 0.5); // Power-of-two 3072 x 1536
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;

    // High-contrast clean ivory background
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, w, h);

    // Weathered Outer Border Frame (Accent color, heavy stroke)
    ctx.lineWidth = 44;
    ctx.strokeStyle = accent;
    ctx.strokeRect(22, 22, w - 44, h - 44);

    // Deep Navy Inner Contrast Pinstripe Frame
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(58, 58, w - 116, h - 116);

    // Header Badge / Banner across top (Solid vibrant accent background)
    ctx.fillStyle = accent;
    ctx.fillRect(80, 80, w - 160, 160);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(80, 80, w - 160, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(w * 0.040)}px 'Arial Black', Impact, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText('★  HISTORIC MOTHER ROAD  ★', w * 0.5, 160);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Main Title: Massive, bold, high-contrast with 3D drop shadow
    const titleSize = title.length > 14 ? Math.round(w * 0.082) : (title.length > 10 ? Math.round(w * 0.098) : Math.round(w * 0.125));
    ctx.font = `900 ${titleSize}px 'Arial Black', Impact, system-ui, sans-serif`;

    // Drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillText(title, w * 0.5 + 8, h * 0.54 + 8);

    // Main title fill: Deep rich navy black
    ctx.fillStyle = '#0a192f';
    ctx.fillText(title, w * 0.5, h * 0.54);

    // Subtitle Ribbon - High-contrast dark pill container with gold border
    const subW = Math.min(w - 280, Math.max(800, sub.length * 48));
    const subH = 146;
    const subX = (w - subW) * 0.5;
    const subY = h * 0.74;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(subX, subY, subW, subH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.strokeRect(subX, subY, subW, subH);

    ctx.fillStyle = '#fef08a';
    const subFontSize = sub.length > 22 ? Math.round(w * 0.034) : Math.round(w * 0.040);
    ctx.font = `900 ${subFontSize}px 'Arial Black', Impact, system-ui, sans-serif`;
    ctx.fillText(sub, w * 0.5, subY + subH * 0.5);

    // Retro Starburst Icons on both sides of title
    drawRetroStar(ctx, 160, h * 0.54, 58, '#f59e0b');
    drawRetroStar(ctx, w - 160, h * 0.54, 58, '#f59e0b');

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    this._cache.set(key, tex);
    return tex;
  }

  /** Regional Highway Guide Signboard Texture — High-contrast Highway Gothic on Interstate Green / Park Brown */
  highwaySign(line1 = 'HIGHWAY 1', line2 = '', color = '#065f46', width = 1024, height = 512) {
    const key = `hwy_sign_${line1}_${line2}_${color}_${width}x${height}`;
    if (this._cache.has(key)) return this._cache.get(key);

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Base Highway Sign Color (Dark Green or Park Brown)
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Subtle brushed road sign sheen / gradient
    const sheen = ctx.createLinearGradient(0, 0, 0, height);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(1, 'rgba(0, 0, 0, 0.20)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, width, height);

    // Reflective Heavy White Outer Border (Highway Standard)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 16;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Rounded Inner Inset Pinstripe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // Text rendering with drop shadow for legibility
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    if (line2 && line2.trim().length > 0) {
      // Two-line layout
      const fSize1 = line1.length > 24 ? 54 : (line1.length > 18 ? 64 : 76);
      ctx.font = `900 ${fSize1}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
      ctx.fillText(line1, width * 0.5, height * 0.38, width - 80);

      const fSize2 = line2.length > 28 ? 42 : (line2.length > 20 ? 50 : 58);
      ctx.fillStyle = '#fef08a'; // Subtle warm yellow for secondary info / advisory
      ctx.font = `800 ${fSize2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
      ctx.fillText(line2, width * 0.5, height * 0.68, width - 80);
    } else {
      // Single prominent line
      const fSize = line1.length > 20 ? 68 : (line1.length > 14 ? 84 : 100);
      ctx.font = `900 ${fSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
      ctx.fillText(line1, width * 0.5, height * 0.52, width - 80);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    this._cache.set(key, tex);
    return tex;
  }

  /** Sky gradient dome texture: vertical gradient with horizon glow band. (Legacy fallback) */
  skyGradient(topHex, horizonHex, size = 256) {
    const key = 'sky' + topHex + horizonHex;
    if (this._cache.has(key)) return this._cache.get(key);
    const c = document.createElement('canvas');
    c.width = 4; c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.00, lightenHex(topHex, -0.22));
    grad.addColorStop(0.45, topHex);
    grad.addColorStop(0.72, mixHex(topHex, horizonHex, 0.55));
    grad.addColorStop(0.88, horizonHex);
    grad.addColorStop(1.00, lightenHex(horizonHex, 0.40));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    this._cache.set(key, tex);
    return tex;
  }

  /** Sandy/dirt ground detail: warm speckle + ripple bands. */
  groundDetail(baseHex = '#c9a05a', size = 256) {
    const key = 'ground' + baseHex;
    if (this._cache.has(key)) return this._cache.get(key);
    const c = this._makeCanvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);
    // ripples
    for (let y = 0; y < size; y += 6 + Math.random() * 8) {
      ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.04})`;
      ctx.fillRect(0, y, size, 2 + Math.random() * 3);
    }
    // pebbles
    for (let i = 0; i < size * size / 220; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const dark = Math.random() > 0.5;
      ctx.fillStyle = dark ? `rgba(70,50,30,${0.15 + Math.random()*0.25})` : `rgba(255,235,190,${0.15 + Math.random()*0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, tex);
    return tex;
  }

  disposeAll() {
    for (const tex of this._cache.values()) tex.dispose();
    this._cache.clear();
  }
}

function hexToRgb(hex) {
  const h = parseInt(hex.replace('#', ''), 16);
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}
function rgbToHex(r, g, b) {
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + ((1 << 24) | (cl(r) << 16) | (cl(g) << 8) | cl(b)).toString(16).slice(1);
}
function hexToRgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t);
}
function lightenHex(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  return rgbToHex(r+(255-r)*amt, g+(255-g)*amt, b+(255-b)*amt);
}

function drawShieldPath(ctx, cx, cy, rad) {
  ctx.beginPath();
  ctx.moveTo(cx - rad, cy - rad * 0.85);
  ctx.lineTo(cx + rad, cy - rad * 0.85);
  ctx.bezierCurveTo(cx + rad * 1.05, cy, cx + rad * 0.8, cy + rad * 0.8, cx, cy + rad * 1.25);
  ctx.bezierCurveTo(cx - rad * 0.8, cy + rad * 0.8, cx - rad * 1.05, cy, cx - rad, cy - rad * 0.85);
  ctx.closePath();
}

function drawRetroStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const len = (i % 2 === 0) ? r : r * 0.38;
    const x = cx + Math.cos(a) * len;
    const y = cy + Math.sin(a) * len;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
