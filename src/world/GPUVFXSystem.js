import * as THREE from 'three';

/**
 * GPUVFXSystem — High-Density Single-Draw-Call Instanced Particle Engine
 * 
 * Provides silky-smooth, photorealistic particle simulation for:
 * - Realistic Exhaust Smoke Puffs (Soft Gaussian alpha, turbulent expansion & swirl)
 * - Multi-Stage Nitro Exhaust Plumes & Afterburner Trails
 * - Ballistic Scrape & Crash Sparks (with HDR bloom glow)
 * - Tire Roostertail Dust, Burnout Smoke, and Wet Weather Spray
 * - Radiator Steam, Heavy Engine Smoke, and Engine Bay Fire
 */
export class GPUVFXManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.dummy = new THREE.Object3D();
    this._scratchColor = new THREE.Color();

    // Active particle index sets for zero-waste O(active) simulation
    this.activeSparks = new Set();
    this.activeNitro = new Set();
    this.activeExhaust = new Set();
    this.activeRooster = new Set();
    this.activeDamage = new Set();

    this.initProceduralTextures();
    this.initSparkPool();
    this.initNitroPool();
    this.initExhaustSmokePool();
    this.initRoostertailPool();
    this.initDamagePool();
  }

  // ─── Procedural Soft Particle Alpha Textures ─────────────────────────────
  initProceduralTextures() {
    // 0. High-Resolution Multi-Lobe Turbulent Smoke Atlas (4 unique billow quadrants)
    this.texExhaustAtlas = this.generateSmokeAtlasTexture();

    // 1. Feathered Radial Smoke Puff Texture (Gaussian alpha, zero square edges)
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = smokeCanvas.height = 64;
    const sCtx = smokeCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.95)');
    sGrad.addColorStop(0.25, 'rgba(250, 250, 250, 0.70)');
    sGrad.addColorStop(0.55, 'rgba(235, 235, 235, 0.32)');
    sGrad.addColorStop(0.80, 'rgba(220, 220, 220, 0.10)');
    sGrad.addColorStop(1.00, 'rgba(200, 200, 200, 0.00)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 64, 64);
    this.texSmoke = new THREE.CanvasTexture(smokeCanvas);

    // 2. Whispy Exhaust Smoke Puff Texture (Multi-core turbulent dissipation)
    const exCanvas = document.createElement('canvas');
    exCanvas.width = exCanvas.height = 64;
    const exCtx = exCanvas.getContext('2d');
    const exGrad = exCtx.createRadialGradient(30, 32, 0, 32, 32, 32);
    exGrad.addColorStop(0.00, 'rgba(240, 242, 245, 0.85)');
    exGrad.addColorStop(0.30, 'rgba(220, 224, 230, 0.55)');
    exGrad.addColorStop(0.65, 'rgba(180, 185, 195, 0.20)');
    exGrad.addColorStop(1.00, 'rgba(140, 145, 155, 0.00)');
    exCtx.fillStyle = exGrad;
    exCtx.fillRect(0, 0, 64, 64);
    this.texExhaust = new THREE.CanvasTexture(exCanvas);

    // 3. Incandescent Nitro Flame / Plasma Core Texture
    const nitroCanvas = document.createElement('canvas');
    nitroCanvas.width = nitroCanvas.height = 64;
    const nCtx = nitroCanvas.getContext('2d');
    const nGrad = nCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    nGrad.addColorStop(0.00, 'rgba(255, 255, 255, 1.00)');
    nGrad.addColorStop(0.20, 'rgba(140, 240, 255, 0.90)');
    nGrad.addColorStop(0.50, 'rgba(30, 180, 255, 0.50)');
    nGrad.addColorStop(0.80, 'rgba(220, 40, 255, 0.18)');
    nGrad.addColorStop(1.00, 'rgba(120, 0, 200, 0.00)');
    nCtx.fillStyle = nGrad;
    nCtx.fillRect(0, 0, 64, 64);
    this.texNitro = new THREE.CanvasTexture(nitroCanvas);

    // 4. Spark Particle Texture (Bright pinpoint center with soft halo)
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = sparkCanvas.height = 32;
    const spCtx = sparkCanvas.getContext('2d');
    const spGrad = spCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    spGrad.addColorStop(0.00, 'rgba(255, 255, 255, 1.00)');
    spGrad.addColorStop(0.30, 'rgba(255, 235, 160, 0.90)');
    spGrad.addColorStop(0.65, 'rgba(255, 140, 40, 0.35)');
    spGrad.addColorStop(1.00, 'rgba(255, 60, 0, 0.00)');
    spCtx.fillStyle = spGrad;
    spCtx.fillRect(0, 0, 32, 32);
    this.texSpark = new THREE.CanvasTexture(sparkCanvas);
  }

  generateSmokeAtlasTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.clearRect(0, 0, size, size);

    const half = size / 2; // 256
    const quadrants = [
      { ox: 0, oy: 0, seed: 1.1 },
      { ox: half, oy: 0, seed: 2.7 },
      { ox: 0, oy: half, seed: 4.3 },
      { ox: half, oy: half, seed: 5.9 }
    ];

    quadrants.forEach((q) => {
      const cx = q.ox + half * 0.5;
      const cy = q.oy + half * 0.5;
      const maxR = half * 0.42;

      // 18 overlapping soft lobes per quadrant for organic cauliflower/billow silhouette
      const lobeCount = 18;
      for (let i = 0; i < lobeCount; i++) {
        const angle = (i / lobeCount) * Math.PI * 2 + Math.sin(i * 3.1 + q.seed) * 0.45;
        const distRatio = Math.pow(Math.abs(Math.sin(i * 1.7 + q.seed)), 1.4) * 0.52;
        const dist = distRatio * maxR;
        const lx = cx + Math.cos(angle) * dist;
        const ly = cy + Math.sin(angle) * dist;

        const lobeR = maxR * (0.35 + 0.38 * (1.0 - distRatio * 0.6));

        // Directional illumination (sunlight scatter from upper right, soft shadow on lower left)
        const lightAngle = -Math.PI * 0.25;
        const lightDot = Math.cos(angle - lightAngle);
        const lum = Math.floor(220 + lightDot * 30);
        const lumEdge = Math.floor(180 + lightDot * 20);

        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
        grad.addColorStop(0.00, `rgba(${lum}, ${lum}, ${Math.min(255, lum + 5)}, 0.45)`);
        grad.addColorStop(0.35, `rgba(${lum}, ${lum}, ${Math.min(255, lum + 4)}, 0.30)`);
        grad.addColorStop(0.70, `rgba(${lumEdge}, ${lumEdge}, ${lumEdge + 6}, 0.10)`);
        grad.addColorStop(1.00, `rgba(${lumEdge}, ${lumEdge}, ${lumEdge}, 0.00)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
        ctx.fill();
      }

      // High-density core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.60);
      coreGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.65)');
      coreGrad.addColorStop(0.40, 'rgba(240, 242, 245, 0.38)');
      coreGrad.addColorStop(0.80, 'rgba(215, 220, 228, 0.08)');
      coreGrad.addColorStop(1.00, 'rgba(200, 205, 210, 0.00)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.60, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  // ─── 1. Ballistic Sparks Pool ─────────────────────────────────────────────
  initSparkPool() {
    this.maxSparks = 250;
    this.sparkIndex = 0;
    const sparkGeo = new THREE.PlaneGeometry(0.12, 0.28);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(4.5, 4.0, 1.2), // HDR glow triggers bloom
      map: this.texSpark,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, this.maxSparks);
    this.sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sparkMesh.frustumCulled = false;
    this.group.add(this.sparkMesh);

    this.sparks = [];
    for (let i = 0; i < this.maxSparks; i++) {
      this.sparks.push({
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 6.0,
        scale: 1, active: false
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.sparkMesh.setMatrixAt(i, this.dummy.matrix);
    }
  }

  emitSparks(pos, normal, count = 12, speedScale = 1.0) {
    for (let i = 0; i < count; i++) {
      const idx = this.sparkIndex;
      const p = this.sparks[idx];
      this.sparkIndex = (this.sparkIndex + 1) % this.maxSparks;

      p.active = true;
      this.activeSparks.add(idx);
      p.x = pos.x + (Math.random() - 0.5) * 0.2;
      p.y = pos.y + (Math.random() - 0.5) * 0.2;
      p.z = pos.z + (Math.random() - 0.5) * 0.2;

      const nx = normal ? normal.x : 0;
      const nz = normal ? normal.z : 1;
      const spread = 8.0 * speedScale;

      p.vx = (nx * 6.0 + (Math.random() - 0.5) * spread);
      p.vy = (Math.random() * 8.0 + 3.0) * speedScale;
      p.vz = (nz * 6.0 + (Math.random() - 0.5) * spread);

      p.life = 0;
      p.maxLife = 0.25 + Math.random() * 0.40;
      p.scale = 0.6 + Math.random() * 0.8;
      p.rot = Math.random() * Math.PI * 2;
    }
  }

  // ─── 2. Nitro Exhaust Plumes ──────────────────────────────────────────────
  initNitroPool() {
    this.maxNitro = 300;
    this.nitroIndex = 0;
    const nitroGeo = new THREE.PlaneGeometry(0.35, 0.55);
    const nitroMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(2.0, 4.5, 6.0),
      map: this.texNitro,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.nitroMesh = new THREE.InstancedMesh(nitroGeo, nitroMat, this.maxNitro);
    this.nitroMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.nitroMesh.frustumCulled = false;
    this.group.add(this.nitroMesh);

    this.nitroParticles = [];
    for (let i = 0; i < this.maxNitro; i++) {
      this.nitroParticles.push({
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4.0,
        scale: 1, active: false
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.nitroMesh.setMatrixAt(i, this.dummy.matrix);
    }
  }

  emitNitroPlume(pos, heading, carSpeed, count = 3) {
    const sinH = Math.sin(heading);
    const cosH = Math.cos(heading);

    for (let i = 0; i < count; i++) {
      const idx = this.nitroIndex;
      const p = this.nitroParticles[idx];
      this.nitroIndex = (this.nitroIndex + 1) % this.maxNitro;

      p.active = true;
      this.activeNitro.add(idx);
      p.x = pos.x + (Math.random() - 0.5) * 0.12;
      p.y = pos.y + (Math.random() - 0.5) * 0.10;
      p.z = pos.z + (Math.random() - 0.5) * 0.12;

      // Eject backwards relative to vehicle heading
      const ejectSpeed = 16.0 + Math.random() * 10.0 + carSpeed * 0.5;
      p.vx = -sinH * ejectSpeed + (Math.random() - 0.5) * 2.0;
      p.vy = (Math.random() - 0.5) * 1.2;
      p.vz = -cosH * ejectSpeed + (Math.random() - 0.5) * 2.0;

      p.life = 0;
      p.maxLife = 0.22 + Math.random() * 0.20;
      p.scale = 0.7 + Math.random() * 0.5;
      p.rot = Math.random() * Math.PI * 2;
    }
  }

  // ─── 3. Realistic Exhaust Smoke Puffs Pool ────────────────────────────────
  initExhaustSmokePool() {
    this.maxExhaust = 500;
    this.exhaustIndex = 0;
    const exGeo = new THREE.PlaneGeometry(1.0, 1.0);

    this.exhaustAlphaArray = new Float32Array(this.maxExhaust);
    this.exhaustUvOffsetArray = new Float32Array(this.maxExhaust * 2);

    this.attrExhaustAlpha = new THREE.InstancedBufferAttribute(this.exhaustAlphaArray, 1);
    this.attrExhaustAlpha.setUsage(THREE.DynamicDrawUsage);
    exGeo.setAttribute('instanceAlpha', this.attrExhaustAlpha);

    this.attrExhaustUvOffset = new THREE.InstancedBufferAttribute(this.exhaustUvOffsetArray, 2);
    this.attrExhaustUvOffset.setUsage(THREE.DynamicDrawUsage);
    exGeo.setAttribute('instanceUvOffset', this.attrExhaustUvOffset);

    const exMat = new THREE.MeshBasicMaterial({
      map: this.texExhaustAtlas,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    exMat.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float instanceAlpha;
        attribute vec2 instanceUvOffset;
        varying float vInstanceAlpha;
        varying vec2 vSmokeUv;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vSmokeUv = uv * 0.5 + instanceUvOffset;
        vInstanceAlpha = instanceAlpha;`
      );

      shader.fragmentShader = `
        varying float vInstanceAlpha;
        varying vec2 vSmokeUv;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        vec4 sampledDiffuseColor = texture2D( map, vSmokeUv );
        diffuseColor *= sampledDiffuseColor;
        diffuseColor.a *= vInstanceAlpha;
        if (diffuseColor.a < 0.003) discard;
        `
      );
    };

    this.exhaustMesh = new THREE.InstancedMesh(exGeo, exMat, this.maxExhaust);
    this.exhaustMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.exhaustMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.maxExhaust * 3), 3);
    this.exhaustMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.exhaustMesh.frustumCulled = false;
    this.group.add(this.exhaustMesh);

    this.exhaustParticles = [];
    for (let i = 0; i < this.maxExhaust; i++) {
      this.exhaustParticles.push({
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1.0,
        initialScale: 0.25,
        maxScale: 1.6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.8,
        baseAlpha: 0.65,
        r: 0.85, g: 0.87, b: 0.90,
        uvX: 0, uvY: 0,
        drag: 2.2,
        buoyancy: 0.45,
        wakeStrength: 0.0,
        curlX: 0, curlZ: 0,
        active: false
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.exhaustMesh.setMatrixAt(i, this.dummy.matrix);
      this.exhaustMesh.setColorAt(i, this._scratchColor.setRGB(0.85, 0.87, 0.90));
    }
  }

  emitExhaustSmoke(pos, heading, carSpeed, throttle = 1.0, count = 1, options = {}) {
    const sinH = Math.sin(heading);
    const cosH = Math.cos(heading);
    const isIdle = options.isIdle || (carSpeed < 1.0 && throttle < 0.2);
    const isBackfire = options.isBackfire || false;
    const isNitro = options.isNitro || false;

    for (let i = 0; i < count; i++) {
      const idx = this.exhaustIndex;
      const p = this.exhaustParticles[idx];
      this.exhaustIndex = (this.exhaustIndex + 1) % this.maxExhaust;

      p.active = true;
      this.activeExhaust.add(idx);

      // Micro nozzle jitter
      p.x = pos.x + (Math.random() - 0.5) * 0.06;
      p.y = pos.y + (Math.random() - 0.5) * 0.06;
      p.z = pos.z + (Math.random() - 0.5) * 0.06;

      p.uvX = Math.random() < 0.5 ? 0.0 : 0.5;
      p.uvY = Math.random() < 0.5 ? 0.0 : 0.5;

      p.rot = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * (isIdle ? 0.8 : 2.2);

      if (isIdle) {
        // Delicate translucent condensation vapor pulsing from idle tailpipe
        const ejectSpeed = 0.35 + Math.random() * 0.35;
        p.vx = -sinH * ejectSpeed + (Math.random() - 0.5) * 0.2;
        p.vy = 0.35 + Math.random() * 0.25;
        p.vz = -cosH * ejectSpeed + (Math.random() - 0.5) * 0.2;

        p.life = 0;
        p.maxLife = 0.70 + Math.random() * 0.30;
        p.initialScale = 0.16 + Math.random() * 0.06;
        p.maxScale = 0.75 + Math.random() * 0.25;
        p.baseAlpha = 0.30 + Math.random() * 0.12;

        p.r = 0.92;
        p.g = 0.94;
        p.b = 0.97;
        p.drag = 1.4;
        p.buoyancy = 0.65;
        p.wakeStrength = 0.0;
      } else if (isBackfire) {
        // Explosive carbon soot puff from unburnt fuel detonation
        const ejectSpeed = 6.0 + Math.random() * 4.0;
        p.vx = -sinH * ejectSpeed + (Math.random() - 0.5) * 1.5;
        p.vy = 0.4 + Math.random() * 0.6;
        p.vz = -cosH * ejectSpeed + (Math.random() - 0.5) * 1.5;

        p.life = 0;
        p.maxLife = 1.2 + Math.random() * 0.4;
        p.initialScale = 0.28;
        p.maxScale = 2.4 + Math.random() * 0.6;
        p.baseAlpha = 0.80;

        p.r = 0.22;
        p.g = 0.22;
        p.b = 0.24;
        p.drag = 2.6;
        p.buoyancy = 0.55;
        p.wakeStrength = 0.6;
        p.curlX = (Math.random() - 0.5) * 3.5;
        p.curlZ = (Math.random() - 0.5) * 3.5;
      } else if (isNitro) {
        // High-velocity expanding vapor envelope around nitro core
        const ejectSpeed = 10.0 + Math.random() * 6.0;
        p.vx = -sinH * ejectSpeed + (Math.random() - 0.5) * 1.8;
        p.vy = 0.2 + (Math.random() - 0.5) * 0.5;
        p.vz = -cosH * ejectSpeed + (Math.random() - 0.5) * 1.8;

        p.life = 0;
        p.maxLife = 0.9 + Math.random() * 0.4;
        p.initialScale = 0.35;
        p.maxScale = 2.6 + Math.random() * 0.5;
        p.baseAlpha = 0.70;

        p.r = 0.82;
        p.g = 0.92;
        p.b = 1.00;
        p.drag = 3.2;
        p.buoyancy = 0.35;
        p.wakeStrength = 0.8;
        p.curlX = (Math.random() - 0.5) * 3.0;
        p.curlZ = (Math.random() - 0.5) * 3.0;
      } else {
        // Standard throttle-driven exhaust billows
        const normThrottle = Math.min(1.5, Math.max(0.1, throttle));
        const ejectSpeed = 1.8 + normThrottle * 3.8 + carSpeed * 0.12;

        p.vx = -sinH * ejectSpeed + sinH * carSpeed * 0.75 + (Math.random() - 0.5) * 0.8;
        p.vy = 0.25 + normThrottle * 0.35 + (Math.random() - 0.5) * 0.3;
        p.vz = -cosH * ejectSpeed + cosH * carSpeed * 0.75 + (Math.random() - 0.5) * 0.8;

        const throttleScale = Math.min(1.0, Math.max(0.1, throttle));
        p.life = 0;
        p.maxLife = 0.65 + normThrottle * 0.35 + Math.random() * 0.20;
        p.initialScale = (0.18 + normThrottle * 0.12) * Math.max(0.45, throttleScale);
        p.maxScale = (1.0 + normThrottle * 1.1) * Math.max(0.45, throttleScale);
        p.baseAlpha = (0.35 + normThrottle * 0.35) * throttleScale;

        if (normThrottle > 0.85) {
          p.r = 0.48 + (Math.random() - 0.5) * 0.08;
          p.g = 0.50 + (Math.random() - 0.5) * 0.08;
          p.b = 0.53 + (Math.random() - 0.5) * 0.08;
        } else {
          p.r = 0.78 + (Math.random() - 0.5) * 0.06;
          p.g = 0.80 + (Math.random() - 0.5) * 0.06;
          p.b = 0.84 + (Math.random() - 0.5) * 0.06;
        }

        p.drag = 2.4;
        p.buoyancy = 0.42 + normThrottle * 0.25;
        p.wakeStrength = Math.min(1.0, carSpeed / 22.0);
        p.curlX = (Math.random() - 0.5) * 2.8;
        p.curlZ = (Math.random() - 0.5) * 2.8;
      }
    }
  }

  // ─── 4. Tire Roostertails & Dust Pool ─────────────────────────────────────
  initRoostertailPool() {
    this.maxRooster = 500;
    this.roosterIndex = 0;
    const roosterGeo = new THREE.PlaneGeometry(1.0, 1.0);

    this.roosterAlphaArray = new Float32Array(this.maxRooster);
    this.roosterUvOffsetArray = new Float32Array(this.maxRooster * 2);

    this.attrRoosterAlpha = new THREE.InstancedBufferAttribute(this.roosterAlphaArray, 1);
    this.attrRoosterAlpha.setUsage(THREE.DynamicDrawUsage);
    roosterGeo.setAttribute('instanceAlpha', this.attrRoosterAlpha);

    this.attrRoosterUvOffset = new THREE.InstancedBufferAttribute(this.roosterUvOffsetArray, 2);
    this.attrRoosterUvOffset.setUsage(THREE.DynamicDrawUsage);
    roosterGeo.setAttribute('instanceUvOffset', this.attrRoosterUvOffset);

    const roosterMat = new THREE.MeshBasicMaterial({
      map: this.texExhaustAtlas,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    roosterMat.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float instanceAlpha;
        attribute vec2 instanceUvOffset;
        varying float vInstanceAlpha;
        varying vec2 vSmokeUv;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vSmokeUv = uv * 0.5 + instanceUvOffset;
        vInstanceAlpha = instanceAlpha;`
      );

      shader.fragmentShader = `
        varying float vInstanceAlpha;
        varying vec2 vSmokeUv;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        vec4 sampledDiffuseColor = texture2D( map, vSmokeUv );
        diffuseColor *= sampledDiffuseColor;
        diffuseColor.a *= vInstanceAlpha;
        if (diffuseColor.a < 0.003) discard;
        `
      );
    };

    this.roosterMesh = new THREE.InstancedMesh(roosterGeo, roosterMat, this.maxRooster);
    this.roosterMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.roosterMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.maxRooster * 3), 3);
    this.roosterMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.roosterMesh.frustumCulled = false;
    this.group.add(this.roosterMesh);

    this.roosterParticles = [];
    for (let i = 0; i < this.maxRooster; i++) {
      this.roosterParticles.push({
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.8,
        initialScale: 0.35,
        maxScale: 1.8,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.8,
        baseAlpha: 0.65,
        r: 0.92, g: 0.92, b: 0.94,
        uvX: 0, uvY: 0,
        active: false
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.roosterMesh.setMatrixAt(i, this.dummy.matrix);
      this.roosterMesh.setColorAt(i, this._scratchColor.setRGB(0.92, 0.92, 0.94));
    }
  }

  emitRoostertail(wheelPos, carSpeed, heading, isRain = false, count = 2) {
    this.emitTireSmoke(wheelPos, carSpeed, heading, false, isRain, count);
  }

  emitTireSmoke(wheelPos, carSpeed, heading, isOffRoad = false, isRain = false, count = 2) {
    const sinH = Math.sin(heading);
    const cosH = Math.cos(heading);

    for (let i = 0; i < count; i++) {
      const idx = this.roosterIndex;
      const p = this.roosterParticles[idx];
      this.roosterIndex = (this.roosterIndex + 1) % this.maxRooster;

      p.active = true;
      this.activeRooster.add(idx);

      p.x = wheelPos.x + (Math.random() - 0.5) * 0.25;
      p.y = wheelPos.y + 0.06;
      p.z = wheelPos.z + (Math.random() - 0.5) * 0.25;

      p.uvX = Math.random() < 0.5 ? 0.0 : 0.5;
      p.uvY = Math.random() < 0.5 ? 0.0 : 0.5;

      p.rot = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 2.0;

      const ejectSpeed = Math.max(2.0, carSpeed * 0.22) + Math.random() * 2.5;
      p.vx = -sinH * ejectSpeed * 0.40 + (Math.random() - 0.5) * 1.8;
      p.vy = isRain ? (Math.random() * 3.2 + 1.0) : (Math.random() * 1.4 + 0.4);
      p.vz = -cosH * ejectSpeed * 0.40 + (Math.random() - 0.5) * 1.8;

      p.life = 0;
      p.maxLife = isRain ? (0.45 + Math.random() * 0.3) : (0.9 + Math.random() * 0.5);
      p.initialScale = 0.30 + Math.random() * 0.15;
      p.maxScale = isRain ? 1.4 : (2.2 + Math.random() * 0.8);

      if (isRain) {
        p.baseAlpha = 0.35 + Math.random() * 0.15;
        p.r = 0.84; p.g = 0.88; p.b = 0.94;
      } else if (isOffRoad) {
        p.baseAlpha = 0.55 + Math.random() * 0.15;
        p.r = 0.84; p.g = 0.72; p.b = 0.52;
      } else {
        p.baseAlpha = 0.65 + Math.random() * 0.20;
        p.r = 0.94; p.g = 0.94; p.b = 0.96;
      }
    }
  }

  // ─── 5. Engine Damage Smoke & Fire Pool ───────────────────────────────────
  initDamagePool() {
    this.maxDamage = 300;
    this.damageIndex = 0;
    const damageGeo = new THREE.PlaneGeometry(0.52, 0.52);
    const damageMat = new THREE.MeshBasicMaterial({
      color: 0x333338,
      map: this.texSmoke,
      transparent: true,
      opacity: 0.60,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.damageMesh = new THREE.InstancedMesh(damageGeo, damageMat, this.maxDamage);
    this.damageMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.damageMesh.frustumCulled = false;
    this.group.add(this.damageMesh);

    this.damageParticles = [];
    for (let i = 0; i < this.maxDamage; i++) {
      this.damageParticles.push({
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.9,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.0,
        scale: 1, active: false
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.damageMesh.setMatrixAt(i, this.dummy.matrix);
    }
  }

  emitEngineSmoke(hoodPos, severity = 1.0, count = 2) {
    for (let i = 0; i < count; i++) {
      const idx = this.damageIndex;
      const p = this.damageParticles[idx];
      this.damageIndex = (this.damageIndex + 1) % this.maxDamage;

      p.active = true;
      this.activeDamage.add(idx);
      p.x = hoodPos.x + (Math.random() - 0.5) * 0.4;
      p.y = hoodPos.y + 0.2;
      p.z = hoodPos.z + (Math.random() - 0.5) * 0.4;

      p.vx = (Math.random() - 0.5) * 1.2;
      p.vy = Math.random() * 3.0 + 1.8;
      p.vz = (Math.random() - 0.5) * 1.2;

      p.life = 0;
      p.maxLife = 0.5 + severity * 0.5;
      p.scale = 0.7 + severity * 1.0;
      p.rot = Math.random() * Math.PI * 2;
    }
  }

  // ─── Simulation Update Loop (Locked 60 FPS Single Draw Upload) ────────────
  update(dt, camera) {
    const camQuat = camera ? camera.quaternion : null;

    // 1. Update Sparks
    if (this.activeSparks.size > 0) {
      let sparkNeedsUpdate = false;
      for (const i of this.activeSparks) {
        const p = this.sparks[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.activeSparks.delete(i);
          this.dummy.position.set(0, -999, 0);
        } else {
          p.vy -= 24.0 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;

          if (p.y < 0.05) {
            p.y = 0.05;
            p.vy = -p.vy * 0.45;
            p.vx *= 0.75;
            p.vz *= 0.75;
          }

          const lifeRatio = 1.0 - (p.life / p.maxLife);
          const s = p.scale * lifeRatio;
          this.dummy.position.set(p.x, p.y, p.z);
          this.dummy.scale.set(s, s * 1.6, s);

          if (camQuat) {
            this.dummy.quaternion.copy(camQuat);
            this.dummy.rotateZ(p.rot + p.rotSpeed * p.life);
          }
        }
        this.dummy.updateMatrix();
        this.sparkMesh.setMatrixAt(i, this.dummy.matrix);
        sparkNeedsUpdate = true;
      }
      if (sparkNeedsUpdate) this.sparkMesh.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Nitro Plumes
    if (this.activeNitro.size > 0) {
      let nitroNeedsUpdate = false;
      for (const i of this.activeNitro) {
        const p = this.nitroParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.activeNitro.delete(i);
          this.dummy.position.set(0, -999, 0);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.vz *= 0.92;

          const lifeRatio = 1.0 - (p.life / p.maxLife);
          const s = p.scale * (0.7 + (p.life / p.maxLife) * 1.8) * lifeRatio;
          this.dummy.position.set(p.x, p.y, p.z);
          this.dummy.scale.set(s, s, s);

          if (camQuat) {
            this.dummy.quaternion.copy(camQuat);
            this.dummy.rotateZ(p.rot + p.rotSpeed * p.life);
          }
        }
        this.dummy.updateMatrix();
        this.nitroMesh.setMatrixAt(i, this.dummy.matrix);
        nitroNeedsUpdate = true;
      }
      if (nitroNeedsUpdate) this.nitroMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Exhaust Smoke Puffs
    if (this.activeExhaust.size > 0) {
      let exhaustNeedsUpdate = false;
      for (const i of this.activeExhaust) {
        const p = this.exhaustParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.activeExhaust.delete(i);
          this.exhaustAlphaArray[i] = 0.0;
          this.dummy.position.set(0, -999, 0);
          this.dummy.updateMatrix();
          this.exhaustMesh.setMatrixAt(i, this.dummy.matrix);
          exhaustNeedsUpdate = true;
        } else {
          const progress = p.life / p.maxLife;

          // Atmospheric Drag against ambient air
          const dragFactor = Math.exp(-dt * p.drag);
          p.vx *= dragFactor;
          p.vz *= dragFactor;

          // Aerodynamic wake vortex swirl
          if (p.wakeStrength > 0.01) {
            p.wakeStrength *= Math.exp(-dt * 2.5);
            p.vx += p.curlX * p.wakeStrength * dt;
            p.vz += p.curlZ * p.wakeStrength * dt;
          }

          // Thermal Buoyancy (hot exhaust gently rises)
          p.vy += (0.40 + p.buoyancy) * dt;
          p.vy *= Math.exp(-dt * 0.7);

          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;

          // Soft ground roll (conform above asphalt, deflect upwards)
          if (p.y < 0.12) {
            p.y = 0.12;
            p.vy = Math.max(0.08, p.vy * 0.3);
          }

          // Volumetric expansion: starts compact, rapidly expands into wide billowy cloud
          const expandEase = Math.sqrt(progress);
          const currentScale = p.initialScale + (p.maxScale - p.initialScale) * expandEase;

          // True volumetric dissipation (opacity fade-out while expanding, never shrinking!)
          let alphaMult = 1.0;
          if (progress < 0.10) {
            alphaMult = progress / 0.10;
          } else {
            const fadeProg = (progress - 0.10) / 0.90;
            alphaMult = Math.max(0.0, (1.0 - fadeProg) * (1.0 - fadeProg));
          }
          const currentAlpha = p.baseAlpha * alphaMult;

          this.dummy.position.set(p.x, p.y, p.z);
          this.dummy.scale.set(currentScale, currentScale, currentScale);

          if (camQuat) {
            this.dummy.quaternion.copy(camQuat);
            this.dummy.rotateZ(p.rot + p.rotSpeed * p.life);
          }

          this.dummy.updateMatrix();
          this.exhaustMesh.setMatrixAt(i, this.dummy.matrix);

          this.exhaustAlphaArray[i] = currentAlpha;
          this.exhaustUvOffsetArray[i * 2] = p.uvX;
          this.exhaustUvOffsetArray[i * 2 + 1] = p.uvY;

          // Ambient light scattering tint: expanding puff scatters more daylight
          const scatterLight = 1.0 + progress * 0.35;
          this._scratchColor.setRGB(
            Math.min(1.0, p.r * scatterLight),
            Math.min(1.0, p.g * scatterLight),
            Math.min(1.0, p.b * scatterLight)
          );
          this.exhaustMesh.setColorAt(i, this._scratchColor);

          exhaustNeedsUpdate = true;
        }
      }

      if (exhaustNeedsUpdate) {
        this.exhaustMesh.instanceMatrix.needsUpdate = true;
        if (this.exhaustMesh.instanceColor) this.exhaustMesh.instanceColor.needsUpdate = true;
        this.attrExhaustAlpha.needsUpdate = true;
        this.attrExhaustUvOffset.needsUpdate = true;
      }
    }

    // 4. Update Roostertails & Tire Burnout Smoke
    if (this.activeRooster.size > 0) {
      let roosterNeedsUpdate = false;
      for (const i of this.activeRooster) {
        const p = this.roosterParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.activeRooster.delete(i);
          this.roosterAlphaArray[i] = 0.0;
          this.dummy.position.set(0, -999, 0);
          this.dummy.updateMatrix();
          this.roosterMesh.setMatrixAt(i, this.dummy.matrix);
          roosterNeedsUpdate = true;
        } else {
          const progress = p.life / p.maxLife;

          p.vx *= Math.exp(-dt * 2.0);
          p.vz *= Math.exp(-dt * 2.0);
          p.vy += 0.35 * dt;
          p.vy *= Math.exp(-dt * 0.9);

          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;

          if (p.y < 0.08) {
            p.y = 0.08;
            p.vy = Math.max(0.05, p.vy * 0.2);
          }

          const expandEase = Math.sqrt(progress);
          const currentScale = p.initialScale + (p.maxScale - p.initialScale) * expandEase;

          let alphaMult = 1.0;
          if (progress < 0.10) {
            alphaMult = progress / 0.10;
          } else {
            const fadeProg = (progress - 0.10) / 0.90;
            alphaMult = Math.max(0.0, (1.0 - fadeProg) * (1.0 - fadeProg));
          }
          const currentAlpha = p.baseAlpha * alphaMult;

          this.dummy.position.set(p.x, p.y, p.z);
          this.dummy.scale.set(currentScale, currentScale, currentScale);

          if (camQuat) {
            this.dummy.quaternion.copy(camQuat);
            this.dummy.rotateZ(p.rot + p.rotSpeed * p.life);
          }

          this.dummy.updateMatrix();
          this.roosterMesh.setMatrixAt(i, this.dummy.matrix);

          this.roosterAlphaArray[i] = currentAlpha;
          this.roosterUvOffsetArray[i * 2] = p.uvX;
          this.roosterUvOffsetArray[i * 2 + 1] = p.uvY;

          this._scratchColor.setRGB(p.r, p.g, p.b);
          this.roosterMesh.setColorAt(i, this._scratchColor);

          roosterNeedsUpdate = true;
        }
      }

      if (roosterNeedsUpdate) {
        this.roosterMesh.instanceMatrix.needsUpdate = true;
        if (this.roosterMesh.instanceColor) this.roosterMesh.instanceColor.needsUpdate = true;
        this.attrRoosterAlpha.needsUpdate = true;
        this.attrRoosterUvOffset.needsUpdate = true;
      }
    }

    // 5. Update Engine Damage Smoke & Fire
    if (this.activeDamage.size > 0) {
      let damageNeedsUpdate = false;
      for (const i of this.activeDamage) {
        const p = this.damageParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.activeDamage.delete(i);
          this.dummy.position.set(0, -999, 0);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;

          const lifeRatio = 1.0 - (p.life / p.maxLife);
          const growth = 1.0 + (p.life / p.maxLife) * 2.5;
          const s = p.scale * growth * lifeRatio;
          this.dummy.position.set(p.x, p.y, p.z);
          this.dummy.scale.set(s, s, s);

          if (camQuat) {
            this.dummy.quaternion.copy(camQuat);
            this.dummy.rotateZ(p.rot + p.rotSpeed * p.life);
          }
        }
        this.dummy.updateMatrix();
        this.damageMesh.setMatrixAt(i, this.dummy.matrix);
        damageNeedsUpdate = true;
      }
      if (damageNeedsUpdate) this.damageMesh.instanceMatrix.needsUpdate = true;
    }
  }
}
