import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gameState } from '../state.js';

/**
 * DreamSmokeVFX — Heavenly Fluffy Dream Clouds & Celestial Morning Atmosphere
 * 
 * Creates an ethereal, paradise-like dreamscape behind the player at the start line:
 * - Soft, billowy, cotton-candy cumulus cloud towers with pure white & pastel sunrise rim glow
 * - Rolling sea of fluffy clouds covering the distant horizon
 * - Soft, divine volumetric sunbeams radiating down from the heavens
 * - Shimmering golden stardust and sparkle motes floating on morning breezes
 */
export class DreamSmokeVFX {
  constructor(renderer, vehicle) {
    this.renderer = renderer;
    this.vehicle = vehicle;
    this.isMobile = Boolean(renderer && renderer.isMobile);
    this.group = new THREE.Group();
    this.cloudBanks = [];
    this.godRays = [];
    this.moteData = [];

    this.setupProceduralTextures();
    this.setupHeavenlyCloudscape();
    this.setupDivineSunbeams();
    this.setupCelestialSparkles();
    // NOTE: Vehicle awakening cloud puffs removed — they previously wrapped the
    // spawn and cluttered the intro. The entry is now a clean circling camera that
    // fades from white directly onto the jeep against the distant horizon clouds.
  }

  setupProceduralTextures() {
    // 1. Soft Fluffy Cumulus Cloud Puff Texture (Silky Gaussian feathered edges, zero polygon artifacts)
    this.texCloudWhite = this.generateFluffyPuffTexture({
      coreColor: 'rgba(255, 255, 255, 0.98)',
      midColor: 'rgba(255, 250, 242, 0.82)',
      rimColor: 'rgba(255, 240, 220, 0.35)',
      edgeColor: 'rgba(255, 255, 255, 0.0)'
    });

    // 2. Sun-Kissed Golden Rim Cloud Puff
    this.texCloudGold = this.generateFluffyPuffTexture({
      coreColor: 'rgba(255, 255, 255, 0.98)',
      midColor: 'rgba(255, 242, 210, 0.88)',
      rimColor: 'rgba(255, 222, 160, 0.45)',
      edgeColor: 'rgba(255, 230, 180, 0.0)'
    });

    // 3. Ethereal Pastel Rose / Twilight Mist Puff
    this.texCloudRose = this.generateFluffyPuffTexture({
      coreColor: 'rgba(255, 255, 255, 0.95)',
      midColor: 'rgba(254, 235, 240, 0.80)',
      rimColor: 'rgba(245, 215, 235, 0.38)',
      edgeColor: 'rgba(250, 225, 240, 0.0)'
    });

    // 4. Silky Soft Sunbeam Light Shaft Texture (Vertical fade + smooth Gaussian horizontal profile)
    this.texSunBeam = this.generateSunbeamTexture();

    // 5. Shimmering 4-Point Celestial Star Sparkle Texture
    this.texSparkle = this.generateSparkleTexture();

    // Reusable Materials
    this.matCloudWhite = new THREE.MeshBasicMaterial({
      map: this.texCloudWhite,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.matCloudGold = new THREE.MeshBasicMaterial({
      map: this.texCloudGold,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.matCloudRose = new THREE.MeshBasicMaterial({
      map: this.texCloudRose,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.matSunBeam = new THREE.MeshBasicMaterial({
      map: this.texSunBeam,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
  }

  generateFluffyPuffTexture({ coreColor, midColor, rimColor, edgeColor }) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const center = size / 2;
    const radius = size * 0.46;

    // Multi-layered overlapping soft billows for an authentic cumulus look
    const billowOffsets = [
      { x: 0, y: 0, r: 1.0 },
      { x: -0.22, y: -0.12, r: 0.72 },
      { x: 0.24, y: -0.15, r: 0.75 },
      { x: -0.18, y: 0.18, r: 0.68 },
      { x: 0.20, y: 0.16, r: 0.70 },
      { x: 0.0, y: -0.26, r: 0.65 },
      { x: -0.32, y: 0.05, r: 0.58 },
      { x: 0.34, y: 0.02, r: 0.60 }
    ];

    billowOffsets.forEach(b => {
      const bx = center + b.x * radius * 0.7;
      const by = center + b.y * radius * 0.7;
      const br = radius * b.r;

      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0.00, coreColor);
      grad.addColorStop(0.35, midColor);
      grad.addColorStop(0.70, rimColor);
      grad.addColorStop(1.00, edgeColor);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  generateSunbeamTexture() {
    const w = 256;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.00, 'rgba(255, 250, 230, 0.95)');
    grad.addColorStop(0.18, 'rgba(255, 242, 205, 0.75)');
    grad.addColorStop(0.48, 'rgba(255, 230, 180, 0.42)');
    grad.addColorStop(0.80, 'rgba(255, 220, 160, 0.14)');
    grad.addColorStop(1.00, 'rgba(255, 210, 150, 0.00)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Apply horizontal Gaussian profile to feather edges smoothly
    ctx.globalCompositeOperation = 'destination-in';
    const hGrad = ctx.createLinearGradient(0, 0, w, 0);
    hGrad.addColorStop(0.00, 'rgba(0,0,0,0.0)');
    hGrad.addColorStop(0.20, 'rgba(0,0,0,0.3)');
    hGrad.addColorStop(0.50, 'rgba(0,0,0,1.0)');
    hGrad.addColorStop(0.80, 'rgba(0,0,0,0.3)');
    hGrad.addColorStop(1.00, 'rgba(0,0,0,0.0)');

    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  generateSparkleTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = size / 2;

    // Central circular glow
    const glow = ctx.createRadialGradient(c, c, 0, c, c, c * 0.9);
    glow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    glow.addColorStop(0.25, 'rgba(255, 240, 190, 0.85)');
    glow.addColorStop(0.60, 'rgba(255, 210, 120, 0.30)');
    glow.addColorStop(1.0, 'rgba(255, 180, 80, 0.0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    // 4-pointed sparkle flares
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c, 2); ctx.lineTo(c, size - 2);
    ctx.moveTo(2, c); ctx.lineTo(size - 2, c);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Constructs an organic, billowy cumulus cloud bank from multiple soft billboard puffs
   */
  createFluffyCloudBank(baseScale = 45, puffCount = 18, primaryMat = this.matCloudWhite) {
    if (this.isMobile) {
      puffCount = Math.max(4, Math.floor(puffCount * 0.35));
    }
    const bankGroup = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry(1, 1);

    const widthSpread = baseScale * 2.2;
    const heightSpread = baseScale * 0.95;
    const depthSpread = baseScale * 1.4;

    const buckets = new Map();

    for (let p = 0; p < puffCount; p++) {
      // Alternate soft gold / white / rose rim tones
      let puffMat = primaryMat;
      if (p % 4 === 1) puffMat = this.matCloudGold;
      else if (p % 5 === 2) puffMat = this.matCloudRose;

      const t = (p - puffCount * 0.5) / (puffCount * 0.5); // -1.0 to +1.0
      const offsetX = t * (widthSpread * 0.55) + (Math.random() - 0.5) * (baseScale * 0.35);
      const archFactor = Math.cos(t * Math.PI * 0.5); // Highest in center
      const offsetY = archFactor * heightSpread * (0.65 + Math.random() * 0.45) + (Math.random() - 0.5) * (baseScale * 0.2);
      const offsetZ = (Math.random() - 0.5) * depthSpread;

      // Random gentle rotation & varied scale for natural billowy mounds
      const puffScale = baseScale * (0.75 + archFactor * 0.55) * (0.85 + Math.random() * 0.35);
      const rotZ = (Math.random() - 0.5) * 0.35;

      const g = planeGeo.clone();
      const m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(offsetX, offsetY, offsetZ),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotZ),
        new THREE.Vector3(puffScale * 1.25, puffScale * 0.95, 1)
      );
      g.applyMatrix4(m);

      let list = buckets.get(puffMat);
      if (!list) {
        list = [];
        buckets.set(puffMat, list);
      }
      list.push(g);
    }

    for (const [mat, geoms] of buckets.entries()) {
      try {
        const merged = mergeGeometries(geoms, false);
        if (merged) {
          bankGroup.add(new THREE.Mesh(merged, mat));
        } else {
          geoms.forEach(g => bankGroup.add(new THREE.Mesh(g, mat)));
        }
      } catch (e) {
        geoms.forEach(g => bankGroup.add(new THREE.Mesh(g, mat)));
      }
    }

    return bankGroup;
  }

  setupHeavenlyCloudscape() {
    // Empty desert intro: Low-altitude cloud banks cleared so the player sees the
    // expansive, open Mojave desert terrain, distant mountains, and clean desert sky.
    this.cloudsGroup = new THREE.Group();
    this.cloudBanks = [];
    this.group.add(this.cloudsGroup);
  }

  setupDivineSunbeams() {
    // REMOVED: Divine sunbeams / god-ray fan behind the spawn read as a "jet" shape
    // in the sky once the intro white-fade clears, and clutters the clean entry shot.
    this.raysGroup = new THREE.Group();
    this.godRays = [];
    this.group.add(this.raysGroup);
  }

  setupCelestialSparkles() {
    // Empty desert intro: Sparkles cleared for pristine desert visibility and 120 FPS performance
    this.moteData = [];
    this.motePoints = null;
  }

  setupVehicleAwakeningPuffs() {
    this.awakeningGroup = new THREE.Group();
    this.awakeningGroup.name = 'DreamAwakeningPuffs_Group';
    this.awakeningPuffs = [];
    const planeGeo = new THREE.PlaneGeometry(1, 1);

    // Dedicated materials with soft alpha blending for ground smoke veil
    this.matAwakenWhite = new THREE.MeshBasicMaterial({
      map: this.texCloudWhite,
      transparent: true,
      opacity: 0.50,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matAwakenGold = new THREE.MeshBasicMaterial({
      map: this.texCloudGold,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.matAwakenRose = new THREE.MeshBasicMaterial({
      map: this.texCloudRose,
      transparent: true,
      opacity: 0.40,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mats = [this.matAwakenWhite, this.matAwakenGold, this.matAwakenRose];

    // Author 28 billowy smoke puffs blanketing the space behind the vehicle (Z: -42m to -4m)
    // Flanking the road so the vehicle emerges cleanly through the center
    const puffConfigs = [];
    for (let i = 0; i < 28; i++) {
      const zRatio = i / 27; // 0.0 to 1.0
      const z = -42 + zRatio * 38; // -42m to -4m (behind the car)
      const side = (i % 2 === 0 ? 1 : -1);
      // Flanking side clouds + a few trailing tail mist puffs
      const isTrailingCenter = i < 8;
      const latSpread = isTrailingCenter
        ? (Math.sin(i * 1.3) * 2.2)
        : side * (3.8 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 7.5);
      const y = 0.35 + (Math.sin(i * 2.1) * 0.5 + 0.5) * 1.4;
      const baseScale = isTrailingCenter ? (4.2 + (i % 3) * 1.2) : (5.5 + (Math.sin(i * 1.3) * 0.5 + 0.5) * 4.5);

      puffConfigs.push({
        x: latSpread,
        y: y,
        z: z,
        scale: baseScale,
        mat: mats[i % mats.length],
        driftSpeed: 0.18 + (i % 5) * 0.06,
        swirlSpeed: 0.32 + (i % 4) * 0.10,
        phase: i * 0.85
      });
    }

    puffConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(planeGeo, cfg.mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.scale.set(cfg.scale * 1.35, cfg.scale * 0.95, 1);
      mesh.rotation.z = Math.sin(cfg.phase) * 0.4;
      this.awakeningGroup.add(mesh);

      this.awakeningPuffs.push({
        mesh,
        baseX: cfg.x,
        baseY: cfg.y,
        baseZ: cfg.z,
        baseScale: cfg.scale,
        driftSpeed: cfg.driftSpeed,
        swirlSpeed: cfg.swirlSpeed,
        phase: cfg.phase
      });
    });

    this.group.add(this.awakeningGroup);
  }

  update(dt, time, opacityFactor = 1.0, camera = null, playerZ = 0) {
    if (dt > 0.08) dt = 0.08;

    // High-performance sleep: Dream smoke & sunrise clouds only exist behind the staging plaza (Z <= 120m)
    // Once driving down the highway, sleep the entire system to recover ~55 draw calls & GPU fillrate
    if (playerZ > 120) {
      if (this.group.visible) this.group.visible = false;
      return;
    }
    this.group.visible = true;

    // 1. Animate Heavenly Fluffy Clouds (Gentle floating, breathing & slow drift)
    for (let i = 0; i < this.cloudBanks.length; i++) {
      const b = this.cloudBanks[i];
      const bob = Math.sin(time * b.bobSpeed + b.phase) * 1.4;
      const drift = Math.sin(time * 0.25 + b.phase) * (b.speed * 2.5);
      const breathe = 1.0 + Math.sin(time * 0.6 + b.phase) * 0.025;

      b.group.position.y = b.baseY + bob;
      b.group.position.x = b.baseX + drift;
      b.group.scale.set(breathe, breathe, 1.0);
    }

    // 2. Animate Divine Volumetric Sunbeams (Gentle shimmering alpenglow pulse)
    for (let i = 0; i < this.godRays.length; i++) {
      const ray = this.godRays[i];
      const shimmer = Math.sin(time * ray.pulseSpeed + ray.phase) * 0.06;
      ray.mesh.material.opacity = Math.max(0.04, (ray.baseOpacity + shimmer) * Math.min(1.0, opacityFactor + 0.35));
    }

    // 3. Animate Rising Celestial Stardust Sparkles
    if (this.motePoints) {
      const pos = this.motePoints.geometry.attributes.position;
      for (let i = 0; i < this.moteData.length; i++) {
        const m = this.moteData[i];
        m.y += m.speedY * dt;
        if (m.y > 9.0) {
          m.y = 0.4;
        }
        const driftX = m.x + Math.sin(time * m.driftSpeed + m.phase) * 0.55;
        const driftZ = m.z + Math.cos(time * m.driftSpeed * 0.8 + m.phase) * 0.55;

        pos.setXYZ(i, driftX, m.y, driftZ);
      }
      pos.needsUpdate = true;

      if (this.moteMat) {
        this.moteMat.opacity = Math.max(0.12, 0.92 * Math.min(1.0, opacityFactor + 0.3));
      }
    }

    // 4. (Removed) Ground-hugging awakening cloud puffs around spawn —
    //    the intro is now a clean circling camera with a white fade.
    this._unused_awakening = null;
  }

  reset() {
    this.group.visible = true;
    if (this.awakeningGroup) this.awakeningGroup.visible = true;
  }
}
