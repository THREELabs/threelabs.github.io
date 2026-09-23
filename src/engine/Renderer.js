import * as THREE from 'three';
import { ZONES } from '../constants.js';
import { TextureFactory } from './TextureFactory.js';
import { gameState } from '../state.js';
import { PostProcessingManager } from './PostProcessingManager.js';

export function detectMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isCoarseTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 0);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 1024;
  return isMobileUA || (isCoarseTouch && isSmallScreen);
}

export function detectLowPowerDevice() {
  if (typeof window === 'undefined') return false;
  if (detectMobileDevice()) return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const rendererStr = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
        // Only classify genuine software rasterizers or ultra-low-power embedded mobile chips
        if (/llvmpipe|softpipe|SwiftShader|Vivante|Mali-400|Adreno\s*(2|3|4)/i.test(rendererStr)) {
          return true;
        }
      }
    }
  } catch (e) {}
  return false;
}

export class SceneRenderer {
  constructor(canvasContainer) {
    this.container = canvasContainer || document.body;
    this.isMobile = detectMobileDevice();
    this.isLowPower = detectLowPowerDevice();

    // 1. Scene & Camera (Long-range 3500m view distance)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.2, 3500);
    this.camera.position.set(0, 3, -6);

    // 2. High-Performance WebGL2 Cel-Shaded Renderer with Fallback Protection
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isLowPower, // Hardware 4x MSAA runs on-chip inside TBDR tile buffer on modern mobile GPUs
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true
      });
    } catch (err) {
      console.warn('High-performance WebGL context failed, falling back to standard WebGL:', err);
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false
      });
    }

    // Default mobile and integrated GPUs to 'balanced' and 60 FPS target out of the box
    if (this.isMobile && (!gameState.targetFps || gameState.targetFps > 60)) {
      gameState.targetFps = 60;
      gameState.fpsMode = '60';
    }
    if ((this.isMobile || this.isLowPower) && (!gameState.graphicsQuality || gameState.graphicsQuality === 'high')) {
      gameState.graphicsQuality = 'balanced';
    }
    this.qualityMode = gameState.graphicsQuality || ((this.isMobile || this.isLowPower) ? 'balanced' : 'high');

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.currentDpr = this.getDprForQuality(this.qualityMode);
    this.renderer.setPixelRatio(this.currentDpr);
    
    // 3. Crisp High-Performance PCF Shadow System
    const enableShadows = this.qualityMode === 'high' && !this.isMobile && !this.isLowPower;
    this.renderer.shadowMap.enabled = enableShadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Dynamic Adaptive Resolution Pacer
    this._dynamicDpr = this.currentDpr;
    this._underPerfTime = 0;
    this._smoothPerfTime = 0;

    // 4. Post-Processing Pipeline (HDR Bloom, Biome Color Grading, Output Tone Mapping)
    this.postProcessing = new PostProcessingManager(this.renderer, this.scene, this.camera);
    this.postProcessing.setPixelRatio(this.currentDpr);
    this.postProcessing.setQualityMode(this.qualityMode, this.isLowPower, this.isMobile);

    // 5. Pure Hardware DataTexture Toon Gradients
    this.toonGradients = {
      threeTone: this.generateGradientMap(3),
      fourTone: this.generateGradientMap(4),
      stepped: this.generateGradientMap(2)
    };

    // 6. Lighting Setup
    this.initZonePalettes();
    this.setupLighting();
    const initZone = ZONES[0];
    // Desert fog: lighter, warmer, with better clarity
    this.scene.fog = new THREE.Fog(initZone.fogColor, initZone.fogNear || 350, initZone.fogFar || 3000);
    this.scene.background = new THREE.Color(initZone.skyTop);

    // 7. Resize listener
    window.addEventListener('resize', () => this.onResize());

    // 8. Procedural texture factory (asphalt, terrain noise, sky gradient)
    this.textures = new TextureFactory();
  }

  generateGradientMap(stepCount) {
    const data = new Uint8Array(stepCount * 4);
    const minShadow = 110; // Ambient shadow floor prevents toon-shaded meshes from rendering pitch black
    for (let i = 0; i < stepCount; i++) {
      const t = i / (stepCount - 1);
      const v = Math.round(minShadow + t * (255 - minShadow));
      data[i * 4 + 0] = v;
      data[i * 4 + 1] = v;
      data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }

    const texture = new THREE.DataTexture(data, stepCount, 1, THREE.RGBAFormat);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  createToonMaterial(params = {}) {
    const color = params.color !== undefined ? params.color : 0xffffff;
    const gradient = params.gradientBands === 4 
      ? this.toonGradients.fourTone 
      : (params.gradientBands === 2 ? this.toonGradients.stepped : this.toonGradients.threeTone);

    const matConfig = {
      color: new THREE.Color(color),
      gradientMap: gradient,
      vertexColors: params.vertexColors || false,
      wireframe: params.wireframe || false,
      transparent: params.transparent || false,
      opacity: params.opacity !== undefined ? params.opacity : 1.0,
      side: params.side || THREE.FrontSide
    };

    if (params.map) matConfig.map = params.map;
    if (params.normalMap) {
      matConfig.normalMap = params.normalMap;
      if (params.normalScale) {
        matConfig.normalScale = (params.normalScale instanceof THREE.Vector2)
          ? params.normalScale
          : new THREE.Vector2(params.normalScale, params.normalScale);
      } else {
        matConfig.normalScale = new THREE.Vector2(0.65, 0.65);
      }
    }
    if (params.bumpMap) {
      matConfig.bumpMap = params.bumpMap;
      matConfig.bumpScale = params.bumpScale !== undefined ? params.bumpScale : 0.05;
    }

    const mat = new THREE.MeshToonMaterial(matConfig);

    if (params.polygonOffset) {
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = params.polygonOffsetFactor || -1.0;
      mat.polygonOffsetUnits = params.polygonOffsetUnits || -1.0;
    }

    return mat;
  }

  createOutlinedMesh(geometry, toonMaterial, outlineThickness = 0.035, outlineColor = 0x111115) {
    const group = new THREE.Group();
    
    const baseMesh = new THREE.Mesh(geometry, toonMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    const outlineMat = new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide
    });
    const outlineMesh = new THREE.Mesh(geometry, outlineMat);
    outlineMesh.scale.multiplyScalar(1.0 + outlineThickness);
    group.add(outlineMesh);

    return group;
  }

  setupLighting() {
    const initZone = ZONES[0];

    // Initialize lighting directly to Zone 0 values (no initial drift/transition on boot)
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(initZone.ambientColor), 1.15);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(new THREE.Color(initZone.sunColor), 2.3);
    this.sunLight.position.set(30, 50, 30);
    const enableShadows = this.qualityMode === 'high' && !this.isMobile && !this.isLowPower;
    this.sunLight.castShadow = enableShadows;
    const shadowMapDim = (this.isMobile || this.isLowPower) ? 512 : 1024;
    this.sunLight.shadow.mapSize.width = shadowMapDim;
    this.sunLight.shadow.mapSize.height = shadowMapDim;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -16;
    this.sunLight.shadow.camera.right = 16;
    this.sunLight.shadow.camera.top = 16;
    this.sunLight.shadow.camera.bottom = -16;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    this.sunTarget = new THREE.Object3D();
    this.scene.add(this.sunTarget);
    this.sunLight.target = this.sunTarget;

    this.hemiLight = new THREE.HemisphereLight(new THREE.Color(initZone.skyTop), new THREE.Color(initZone.groundColor || '#6a9460'), 1.20);
    this.scene.add(this.hemiLight);
  }

  initZonePalettes() {
    this.zonePalettes = ZONES.map(z => ({
      skyTop: new THREE.Color(z.skyTop),
      sunColor: new THREE.Color(z.sunColor),
      ambientColor: new THREE.Color(z.ambientColor),
      groundColor: new THREE.Color(z.groundColor || '#6a9460'),
      fogColor: new THREE.Color(z.fogColor),
      fogNear: z.fogNear || 350,
      fogFar: z.fogFar || 2600
    }));
  }

  updateZoneAtmosphere(zoneIndex) {
    const palette = this.zonePalettes[zoneIndex] || this.zonePalettes[0];

    this.scene.background.lerp(palette.skyTop, 0.06);
    this.sunLight.color.lerp(palette.sunColor, 0.06);
    this.ambientLight.color.lerp(palette.ambientColor, 0.06);

    // Forward zone switch to Biome Color Grading pipeline
    if (this.postProcessing) {
      this.postProcessing.setZone(zoneIndex);
    }

    // Dynamic sun intensity per zone atmosphere
    let targetSunIntensity = 2.4;
    let targetAmbIntensity = 1.35;
    if (zoneIndex === 0) { targetSunIntensity = 2.4; targetAmbIntensity = 1.25; } // Desert heat
    else if (zoneIndex === 1) { targetSunIntensity = 2.3; targetAmbIntensity = 1.35; } // Malibu sun
    else if (zoneIndex === 2) { targetSunIntensity = 2.3; targetAmbIntensity = 1.45; } // Big Sur coastal clarity
    else if (zoneIndex === 3) { targetSunIntensity = 2.2; targetAmbIntensity = 1.35; } // Monterey Bay
    else if (zoneIndex === 5) { targetSunIntensity = 1.60; targetAmbIntensity = 1.15; } // Redwood canopy shade
    else if (zoneIndex === 6) { targetSunIntensity = 1.40; targetAmbIntensity = 1.10; } // Oregon storm
    else if (zoneIndex === 8) { targetSunIntensity = 1.45; targetAmbIntensity = 1.15; } // PNW drizzle

    this.sunLight.intensity += (targetSunIntensity - this.sunLight.intensity) * 0.06;
    this.ambientLight.intensity += (targetAmbIntensity - this.ambientLight.intensity) * 0.06;

    if (this.hemiLight) {
      this.hemiLight.color.lerp(palette.skyTop, 0.06);
      this.hemiLight.groundColor.lerp(palette.groundColor, 0.06);
    }

    if (this.scene.fog) {
      this.scene.fog.color.lerp(palette.fogColor, 0.06);
      this.scene.fog.near += ( palette.fogNear - this.scene.fog.near ) * 0.06;
      this.scene.fog.far += ( palette.fogFar - this.scene.fog.far ) * 0.06;
    }
  }

  updateSunShadowCenter(targetPos) {
    if (!targetPos) return;
    this.sunTarget.position.copy(targetPos);
    this.sunLight.position.set(targetPos.x - 25, targetPos.y + 55, targetPos.z - 20);
  }

  getDprForQuality(mode) {
    const rawDpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    if (mode === 'performance') {
      return this.isMobile ? Math.min(rawDpr, 1.0) : Math.min(rawDpr, 1.0);
    } else if (mode === 'turbo120') {
      return this.isMobile ? Math.min(rawDpr, 1.15) : Math.min(rawDpr, 1.0);
    } else if (mode === 'balanced') {
      return this.isMobile ? Math.min(rawDpr, 1.35) : Math.min(rawDpr, 1.25);
    } else { // 'high'
      return this.isMobile ? Math.min(rawDpr, 1.75) : Math.min(rawDpr, 2.0);
    }
  }

  getRenderMetrics() {
    const info = this.renderer.info;
    return {
      drawCalls: info.render.calls || 0,
      triangles: info.render.triangles || 0,
      points: info.render.points || 0,
      lines: info.render.lines || 0,
      geometries: info.memory.geometries || 0,
      textures: info.memory.textures || 0,
      dpr: parseFloat(this.renderer.getPixelRatio().toFixed(2)),
      quality: this.qualityMode
    };
  }

  setQualityMode(mode) {
    this.qualityMode = mode; // 'high' | 'balanced' | 'turbo120' | 'performance'
    gameState.graphicsQuality = mode;

    if (this.postProcessing) {
      this.postProcessing.setQualityMode(mode, this.isLowPower, this.isMobile);
    }

    const baseDpr = this.getDprForQuality(mode);
    this._dynamicDpr = baseDpr;
    this.currentDpr = baseDpr;
    this.renderer.setPixelRatio(baseDpr);
    if (this.postProcessing) {
      this.postProcessing.setPixelRatio(baseDpr);
    }

    if (mode === 'performance' || (mode === 'balanced' && (this.isMobile || this.isLowPower))) {
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
    } else if (mode === 'turbo120') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.autoUpdate = false; // Throttled to 60Hz update rate
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 512;
      this.sunLight.shadow.mapSize.height = 512;
      gameState.targetFps = 120;
      gameState.fpsMode = '120';
    } else if (mode === 'balanced') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.autoUpdate = true;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 512;
      this.sunLight.shadow.mapSize.height = 512;
    } else { // 'high'
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.autoUpdate = true;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = (this.isMobile || this.isLowPower) ? 512 : 1024;
      this.sunLight.shadow.mapSize.height = (this.isMobile || this.isLowPower) ? 512 : 1024;
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.postProcessing) {
      this.postProcessing.setSize(window.innerWidth, window.innerHeight);
    }
    return this.qualityMode;
  }

  cycleQualityMode() {
    const modes = ['high', 'balanced', 'turbo120', 'performance'];
    const currentIdx = modes.indexOf(this.qualityMode || (this.isMobile ? 'balanced' : 'high'));
    const nextMode = modes[(currentIdx + 1) % modes.length];
    return this.setQualityMode(nextMode);
  }

  onTargetFpsChanged(fps) {
    this._underPerfTime = 0;
    this._smoothPerfTime = 0;
  }

  adaptResolution(currentFps, dt) {
    if (gameState.autoFpsTarget === false) return;
    const targetMaxDpr = this.getDprForQuality(this.qualityMode);
    const minDpr = this.isMobile ? 1.0 : 0.85;

    // Evaluate dynamic adaptation relative to target FPS
    let targetFps = (typeof gameState.targetFps === 'number' && gameState.targetFps > 0)
      ? gameState.targetFps
      : (gameState.targetFps === 'uncapped' ? 144 : 120);

    // On mobile devices or 60Hz displays, clamp target FPS expectation to 60 FPS
    // so a steady 60 FPS is not penalized as an under-performance state
    if (this.isMobile && targetFps > 60) {
      targetFps = 60;
    }

    const lowThreshold = targetFps * 0.85;   // e.g. ~51 FPS when targeting 60 FPS
    const highThreshold = targetFps * 0.96;  // e.g. ~57.6 FPS when targeting 60 FPS

    // Detect sustained frame drops below target threshold
    if (currentFps > 0 && currentFps < lowThreshold) {
      this._underPerfTime += dt;
      this._smoothPerfTime = 0;
      if (this._underPerfTime > 0.8 && this._dynamicDpr > minDpr) {
        this._dynamicDpr = Math.max(minDpr, this._dynamicDpr - 0.05);
        this.renderer.setPixelRatio(this._dynamicDpr);
        if (this.postProcessing) {
          this.postProcessing.setPixelRatio(this._dynamicDpr);
          this.postProcessing.setSize(window.innerWidth, window.innerHeight);
        }
        this._underPerfTime = 0;
      }
    } else if (currentFps >= highThreshold) {
      this._smoothPerfTime += dt;
      this._underPerfTime = 0;
      if (this._smoothPerfTime > 3.0 && this._dynamicDpr < targetMaxDpr) {
        this._dynamicDpr = Math.min(targetMaxDpr, this._dynamicDpr + 0.05);
        this.renderer.setPixelRatio(this._dynamicDpr);
        if (this.postProcessing) {
          this.postProcessing.setPixelRatio(this._dynamicDpr);
          this.postProcessing.setSize(window.innerWidth, window.innerHeight);
        }
        this._smoothPerfTime = 0;
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const dpr = this._dynamicDpr || this.getDprForQuality(this.qualityMode);
    this.renderer.setPixelRatio(dpr);
    if (this.postProcessing) {
      this.postProcessing.setPixelRatio(dpr);
      this.postProcessing.setSize(window.innerWidth, window.innerHeight);
    }
  }

  prewarmScene() {
    // 1. Pre-upload all scene textures to GPU VRAM ahead of time
    const uploadedTextures = new Set();
    const initTex = (tex) => {
      if (tex && tex.isTexture && !uploadedTextures.has(tex)) {
        uploadedTextures.add(tex);
        try {
          this.renderer.initTexture(tex);
        } catch (e) {
          // Gracefully continue if texture is still loading
        }
      }
    };

    this.scene.traverse((obj) => {
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (!m) continue;
          initTex(m.map);
          initTex(m.normalMap);
          initTex(m.roughnessMap);
          initTex(m.metalnessMap);
          initTex(m.aoMap);
          initTex(m.emissiveMap);
          initTex(m.alphaMap);
          initTex(m.bumpMap);
          initTex(m.specularMap);
          initTex(m.lightMap);
          initTex(m.envMap);
          initTex(m.gradientMap);
        }
      }
    });

    // 2. Pre-compile all WebGL shader programs across the entire scene graph
    try {
      this.renderer.compile(this.scene, this.camera);
      console.log('🚀 Pre-warmed all WebGL shaders and GPU textures');
    } catch (err) {
      console.warn('Shader precompile warning:', err);
    }
  }

  render(deltaTime = 0.016) {
    // Accumulate all draw calls and triangles across scene and post-processing passes
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();

    // Shadow Map Throttling (Every-Other-Frame):
    // Always update directional shadow map at half the display rate (every 2nd frame).
    // The sun position barely changes frame-to-frame, so 30Hz shadow updates are
    // visually identical to 60Hz but recover 15–25% GPU time — critical for the
    // geometry-heavy Mojave Desert zone. Only 'performance' mode skips shadows entirely.
    if (this.renderer.shadowMap.enabled) {
      this._shadowFrameCounter = (this._shadowFrameCounter || 0) + 1;
      this.renderer.shadowMap.autoUpdate = false;
      if (this._shadowFrameCounter % 2 === 0) {
        this.renderer.shadowMap.needsUpdate = true;
      }
    }

    // Dynamic resolution scaling adaptation
    this.adaptResolution(gameState.fps || 120, deltaTime);

    if (this.postProcessing && this.qualityMode !== 'performance' && !this.isMobile) {
      this.postProcessing.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
