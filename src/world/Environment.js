import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gameState } from '../state.js';
import { ZONES } from '../constants.js';
import { calculateTerrainHeight } from './TerrainHeight.js';

export class EnvironmentManager {
  constructor(renderer, vehicle) {
    this.renderer = renderer;
    this.vehicle = vehicle;
    this.group = new THREE.Group();
    this.time = 0;

    this.setupSunAndAtmosphere();
    this.setupDistantMountainChains();
    this.setupVolumetricClouds();
    this.setupDustParticles();
    this.setupDustDevils();
    this.setupPrecipitationParticles();
    this.setupGroundSplashes();
    this.setupLightningSystem();
  }

  setSoundEngine(soundEngine) {
    this.soundEngine = soundEngine;
  }

  setupDistantMountainChains() {
    // Distant Horizon Mountain Ridge Chains across the 12,500m Pacific Coast drive
    this.mountainsGroup = new THREE.Group();

    const mountainGeo = new THREE.PlaneGeometry(160, 13000, 24, 260);
    mountainGeo.rotateX(-Math.PI * 0.5);
    mountainGeo.translate(0, 0, 6500);

    const pos = mountainGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cDesertRidge = new THREE.Color(0xb25e3b);
    const cCoastalRidge = new THREE.Color(0x425442);
    const cMarinRidge = new THREE.Color(0x607248);
    const cRedwoodRidge = new THREE.Color(0x233828);
    const cCascadeRidge = new THREE.Color(0x2a3832);
    const cSnowPeak = new THREE.Color(0xe2e8f0);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Natural arched ridge cross-section: peak at spine (vx=0), dropping to base at boundaries (vx=±80)
      const crossArch = Math.max(0, 1.0 - Math.pow(vx / 80.0, 2));
      const ridgeNoise = Math.sin(vz * 0.008) * 65 + Math.cos(vz * 0.022) * 40 + Math.sin(vz * 0.055) * 22;
      const rawPeak = Math.max(28, 90 + ridgeNoise);

      // Smoothly carve pass in Zone 0 (Z: 850m - 1350m) to open sightlines through Cougar Ridge to Surprise City
      let passWeight = 1.0;
      if (vz >= 850 && vz <= 1350) {
        const passDist = Math.abs(vz - 1100);
        const passT = THREE.MathUtils.clamp(passDist / 250.0, 0, 1);
        passWeight = passT * passT * (3.0 - 2.0 * passT);
      }

      // Edges and pass notch sink below ground level to guarantee clean sightlines to Surprise City & no gaps
      const peakY = -12.0 + (rawPeak * crossArch + 12.0) * passWeight;
      pos.setY(i, peakY);

      let col = new THREE.Color(0x425442);
      if (vz < 2600) {
        col.copy(cDesertRidge);
      } else if (vz < 7800) {
        col.copy(cCoastalRidge);
      } else if (vz < 13000) {
        col.copy(cMarinRidge);
      } else if (vz < 15600) {
        col.copy(cRedwoodRidge);
      } else {
        col.copy(cCascadeRidge);
        if (peakY > 165) col.lerp(cSnowPeak, 0.85); // Snowcaps in PNW
      }

      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    mountainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mountainGeo.computeVertexNormals();

    const diffMountain = this.renderer.textures && this.renderer.textures.mountainRidgePBR 
      ? this.renderer.textures.mountainRidgePBR(512) 
      : null;
    const normMountain = this.renderer.textures && this.renderer.textures.mountainRidgeNormalPBR 
      ? this.renderer.textures.mountainRidgeNormalPBR(512) 
      : null;
    if (diffMountain) {
      diffMountain.repeat.set(4, 52);
      diffMountain.wrapS = diffMountain.wrapT = THREE.RepeatWrapping;
    }
    if (normMountain) {
      normMountain.repeat.set(4, 52);
      normMountain.wrapS = normMountain.wrapT = THREE.RepeatWrapping;
    }

    const matMountain = new THREE.MeshToonMaterial({
      vertexColors: true,
      map: diffMountain,
      normalMap: normMountain,
      normalScale: new THREE.Vector2(0.85, 0.85),
      gradientMap: this.renderer.toonGradients.threeTone
    });

    // Right inland ridge
    const rightRidge = new THREE.Mesh(mountainGeo, matMountain);
    rightRidge.position.set(440, 0, 0);
    this.mountainsGroup.add(rightRidge);

    // Left coastal backdrop ridge (positioned further out past the Pacific Ocean)
    const leftRidge = new THREE.Mesh(mountainGeo.clone(), matMountain);
    leftRidge.position.set(-680, 0, 0);
    this.mountainsGroup.add(leftRidge);

    this.group.add(this.mountainsGroup);
  }

  setupSunAndAtmosphere() {
    const initialZone = ZONES[0];
    this.targetSkyTop = new THREE.Color(initialZone.skyTop);
    this.targetSkyMid = new THREE.Color(initialZone.skyMid || '#2a7ac2');
    this.targetSkyHorizon = new THREE.Color(initialZone.skyHorizon);
    this.targetHazeColor = new THREE.Color(initialZone.hazeColor || '#f2d8a0');
    this.targetSunColor = new THREE.Color(initialZone.sunColor || '#fffaf0');
    this.targetAlpenglowColor = new THREE.Color(initialZone.alpenglowColor || '#e8c48f');
    this.targetMieG = initialZone.mieG !== undefined ? initialZone.mieG : 0.84;
    this.targetHeatShimmer = initialZone.heatShimmer !== undefined ? initialZone.heatShimmer : 1.0;
    this.targetStarVisibility = initialZone.starVisibility !== undefined ? initialZone.starVisibility : 0.0;
    this.targetSunGlow = initialZone.sunGlow !== undefined ? initialZone.sunGlow : 1.60;
    this.targetCloudDensity = initialZone.cloudDensity !== undefined ? initialZone.cloudDensity : 0.20;
    this.targetCloudSpeed = initialZone.cloudSpeed !== undefined ? initialZone.cloudSpeed : 0.8;
    this.targetZoneId = initialZone.id;

    this.renderer.scene.background = new THREE.Color(initialZone.skyTop);

    // 1. Physically-Inspired Atmospheric Scattering & Celestial Sky Dome Shader
    const skyGeo = new THREE.SphereGeometry(2900, 64, 40);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(initialZone.skyTop) },
        uMidColor: { value: new THREE.Color(initialZone.skyMid || '#2a7ac2') },
        uHorizonColor: { value: new THREE.Color(initialZone.skyHorizon) },
        uHazeColor: { value: new THREE.Color(initialZone.hazeColor || '#f2d8a0') },
        uSunPosition: { value: new THREE.Vector3(0, 1, 0) },
        uSunColor: { value: new THREE.Color(initialZone.sunColor || '#fffaf0') },
        uSunGlowIntensity: { value: initialZone.sunGlow || 1.60 },
        uMieG: { value: initialZone.mieG || 0.84 },
        uHeatShimmer: { value: initialZone.heatShimmer || 1.0 },
        uStarVisibility: { value: initialZone.starVisibility || 0.0 },
        uCloudDensity: { value: initialZone.cloudDensity || 0.20 },
        uAlpenglowColor: { value: new THREE.Color(initialZone.alpenglowColor || '#e8c48f') },
        uTimeOfDay: { value: gameState.timeOfDay },
        uTime: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;
        void main() {
          vLocalPosition = position;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uHazeColor;
        uniform vec3 uSunPosition;
        uniform vec3 uSunColor;
        uniform float uSunGlowIntensity;
        uniform float uMieG;
        uniform float uHeatShimmer;
        uniform float uStarVisibility;
        uniform float uCloudDensity;
        uniform vec3 uAlpenglowColor;
        uniform float uTimeOfDay;
        uniform float uTime;

        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;

        // Hash-based 2D noise for procedural cloud detail and stars
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(a, b, f.x) + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.x * f.y;
        }

        void main() {
          vec3 dir = normalize(vLocalPosition);
          float h = dir.y; // Elevation angle (-1 to +1)

          // 1. Analytical Multi-Stop Rayleigh Atmospheric Scattering Elevation Ramp
          vec3 sky;
          if (h > 0.28) {
            float t = smoothstep(0.28, 0.90, h);
            sky = mix(uMidColor, uTopColor, t);
          } else if (h > 0.0) {
            float t = smoothstep(0.0, 0.28, h);
            sky = mix(uHorizonColor, uMidColor, t);
          } else {
            float t = smoothstep(-0.25, 0.0, h);
            sky = mix(uHazeColor, uHorizonColor, t);
          }

          // 2. Solar Direction & Mie Scattering
          vec3 sunDir = normalize(uSunPosition);
          float cosTheta = dot(dir, sunDir);
          float forwardTheta = max(0.0, cosTheta);

          // Mie Single-Scattering Phase Function approximation
          float g = uMieG;
          float g2 = g * g;
          float miePhase = (3.0 * (1.0 - g2) / (2.0 * (2.0 + g2))) * 
                           ((1.0 + forwardTheta * forwardTheta) / pow(max(0.01, 1.0 + g2 - 2.0 * g * forwardTheta), 1.5));

          // Multi-layer Solar Flare & Corona (Calibrated to keep sky background below bloom threshold 1.65)
          float sunGlowWide = pow(forwardTheta, 48.0) * 0.12;
          float sunGlowBroad = min(miePhase * 0.015, 0.28);

          vec3 solarGlow = uSunColor * (sunGlowWide + sunGlowBroad) * min(uSunGlowIntensity, 1.1);

          // Horizon Sun Warmth (Forward Scattering at Low Elevation)
          float sunHorizonBoost = pow(forwardTheta, 4.5) * max(0.0, 1.0 - abs(h) * 2.5) * 0.25;
          vec3 horizonWarmth = mix(uSunColor, vec3(1.0, 0.84, 0.55), 0.5) * sunHorizonBoost;

          // Anti-Solar Twilight Alpenglow Blush (Opposite side of the sun near horizon)
          float antiSunAngle = max(0.0, -cosTheta);
          float alpenglowFactor = pow(antiSunAngle, 1.8) * smoothstep(0.35, 0.02, max(0.0, h)) * 0.40;
          vec3 alpenglow = uAlpenglowColor * alpenglowFactor;

          // Compose base atmosphere - capped safely below bloom threshold (1.65)
          vec3 finalCol = min(sky + solarGlow + horizonWarmth + alpenglow, vec3(1.35));
          // Sharp solar core (only the crisp solar disc triggers localized bloom)
          finalCol += uSunColor * pow(forwardTheta, 600.0) * 1.8;

          // 3. Thermal Horizon Mirage Refraction / Heat Shimmer (Desert & Hot Zones)
          if (uHeatShimmer > 0.01 && h > -0.06 && h < 0.12) {
            float az = atan(dir.x, dir.z);
            float shimmer = sin(az * 160.0 + uTime * 6.0) * cos(h * 90.0 + uTime * 4.0) * 0.035 * uHeatShimmer;
            float shimmerMask = (1.0 - smoothstep(0.0, 0.12, h)) * smoothstep(-0.06, 0.0, h);
            finalCol += uHazeColor * shimmer * shimmerMask;
          }

          // 4. Twilight Zenith Starfield (Washington & Nightfall Transitions)
          if (uStarVisibility > 0.01 && h > 0.42) {
            vec2 skyCoords = vec2(
              atan(dir.x, dir.z) / (3.14159265 * 2.0) + 0.5,
              h
            );
            vec2 starGrid = floor(skyCoords * 320.0);
            float starHash = hash(starGrid);
            if (starHash > 0.972) {
              float twinkle = sin(uTime * 3.5 + starHash * 45.0) * 0.35 + 0.65;
              float starAltitudeFade = smoothstep(0.42, 0.72, h) * uStarVisibility;
              vec3 starCol = mix(vec3(0.92, 0.96, 1.0), vec3(1.0, 0.88, 0.75), hash(starGrid + 0.3));
              finalCol += starCol * twinkle * starAltitudeFade * 1.8;
            }
          }

          // 5. Procedural High-Altitude Cirrus Clouds
          vec2 cirrusCoords = vec2(
            atan(dir.x, dir.z) / (3.14159265 * 2.0) + 0.5,
            dir.y * 0.5 + 0.5
          );
          cirrusCoords.x += uTimeOfDay * 0.02 + uTime * 0.0006;
          float cirrus = noise(cirrusCoords * vec2(22.0, 7.0)) * 0.50 +
                         noise(cirrusCoords * vec2(44.0, 14.0) + vec2(uTimeOfDay * 4.0, 0.0)) * 0.30 +
                         noise(cirrusCoords * vec2(88.0, 28.0) + vec2(uTimeOfDay * 10.0, 0.0)) * 0.20;
          cirrus = smoothstep(0.52, 0.88, cirrus);
          cirrus *= smoothstep(0.12, 0.42, h); // Upper sky only
          float cloudOpacity = cirrus * uCloudDensity * 0.55;
          vec3 cloudCol = mix(vec3(1.0, 0.96, 0.90), uSunColor, sunHorizonBoost * 0.4);
          finalCol = mix(finalCol, cloudCol, cloudOpacity);

          // 6. Subtle atmospheric dithering to eliminate 8-bit color banding
          float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0 * 1.4;
          finalCol += dither;

          gl_FragColor = vec4(finalCol, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });

    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.skyDome.renderOrder = -20;
    this.group.add(this.skyDome);

    // 2. Multi-Layer Radiant Sun Hierarchy
    this.sunGroup = new THREE.Group();

    // Hot Pure-White Solar Core Disc
    const coreGeo = new THREE.SphereGeometry(24, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    this.sunCore = new THREE.Mesh(coreGeo, coreMat);
    this.sunGroup.add(this.sunCore);

    // Glowing Atmospheric Corona Halo Sprite
    const coronaTex = this.renderer.textures.sunCorona(256);
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      color: 0xfff0cf,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    this.coronaSprite = new THREE.Sprite(coronaMat);
    this.coronaSprite.scale.set(130, 130, 1);
    this.sunGroup.add(this.coronaSprite);

    // Anamorphic Starburst Flare Rays
    const starburstTex = this.renderer.textures.sunStarburst ? this.renderer.textures.sunStarburst(256) : coronaTex;
    const starburstMat = new THREE.SpriteMaterial({
      map: starburstTex,
      color: 0xffe29a,
      transparent: true,
      opacity: 0.30,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    this.starburstSprite = new THREE.Sprite(starburstMat);
    this.starburstSprite.scale.set(180, 180, 1);
    this.sunGroup.add(this.starburstSprite);

    // Outer Atmospheric Glow Flare
    const outerHaloMat = new THREE.SpriteMaterial({
      map: coronaTex,
      color: 0xffa726,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    this.outerHalo = new THREE.Sprite(outerHaloMat);
    this.outerHalo.scale.set(240, 240, 1);
    this.sunGroup.add(this.outerHalo);

    this.group.add(this.sunGroup);
  }

  updateSkyGradient(topColor, horizonColor) {
    if (this.renderer && this.renderer.scene) {
      if (!this._cachedBgCol) this._cachedBgCol = new THREE.Color();
      this._cachedBgCol.set(topColor);
      this.renderer.scene.background.copy(this._cachedBgCol);
    }
  }

  /** Swap the sky dome shader uniforms to a zone's panoramic atmospheric palette. */
  setSkyZone(zone) {
    if (!zone) return;
    if (!this.targetSkyTop) {
      this.targetSkyTop = new THREE.Color(zone.skyTop);
      this.targetSkyMid = new THREE.Color(zone.skyMid || '#286fa8');
      this.targetSkyHorizon = new THREE.Color(zone.skyHorizon);
      this.targetHazeColor = new THREE.Color(zone.hazeColor || '#f7c894');
      this.targetSunColor = new THREE.Color(zone.sunColor || '#fff6e2');
      this.targetAlpenglowColor = new THREE.Color(zone.alpenglowColor || '#f4baa0');
    } else {
      this.targetSkyTop.set(zone.skyTop);
      this.targetSkyMid.set(zone.skyMid || '#286fa8');
      this.targetSkyHorizon.set(zone.skyHorizon);
      this.targetHazeColor.set(zone.hazeColor || '#f7c894');
      this.targetSunColor.set(zone.sunColor || '#fff6e2');
      this.targetAlpenglowColor.set(zone.alpenglowColor || '#f4baa0');
    }
    this.targetMieG = zone.mieG !== undefined ? zone.mieG : 0.76;
    this.targetHeatShimmer = zone.heatShimmer !== undefined ? zone.heatShimmer : 0.0;
    this.targetStarVisibility = zone.starVisibility !== undefined ? zone.starVisibility : 0.0;
    this.targetSunGlow = zone.sunGlow !== undefined ? zone.sunGlow : 1.2;
    this.targetCloudDensity = zone.cloudDensity !== undefined ? zone.cloudDensity : 0.5;
    this.targetCloudSpeed = zone.cloudSpeed !== undefined ? zone.cloudSpeed : 1.0;
    this.targetZoneId = zone.id;

    this.updateSkyGradient(zone.skyTop, zone.skyHorizon);

    if (this.cloudShaderMat && this.cloudShaderMat.uniforms) {
      this.cloudShaderMat.uniforms.uSunColor.value.copy(this.targetSunColor);
      this.cloudShaderMat.uniforms.uAmbientColor.value.copy(this.targetSkyMid);
      this.cloudShaderMat.uniforms.uCloudOpacity.value = Math.min(0.92, Math.max(0.65, this.targetCloudDensity * 1.2));
      if (this.stormCloudShaderMat && this.stormCloudShaderMat.uniforms) {
        this.stormCloudShaderMat.uniforms.uSunColor.value.copy(this.targetSunColor);
        this.stormCloudShaderMat.uniforms.uAmbientColor.value.copy(this.targetSkyMid);
      }
    }
  }

  setupVolumetricClouds() {
    this.cloudsGroup = new THREE.Group();
    
    // Photorealistic Sun-Lit Volumetric Cloud Shader Materials
    const cloudNoiseTex = this.renderer.textures.cloudNoisePBR ? this.renderer.textures.cloudNoisePBR(256) : null;

    this.cloudShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uCloudMap: { value: cloudNoiseTex },
        uSunPosition: { value: new THREE.Vector3(30, 50, 30).normalize() },
        uSunColor: { value: new THREE.Color(0xfffbf2) },
        uAmbientColor: { value: new THREE.Color(0xdee7f2) },
        uCloudBellyColor: { value: new THREE.Color(0x9ca9bb) },
        uCloudOpacity: { value: 0.85 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uCloudMap;
        uniform vec3 uSunPosition;
        uniform vec3 uSunColor;
        uniform vec3 uAmbientColor;
        uniform vec3 uCloudBellyColor;
        uniform float uCloudOpacity;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        void main() {
          vec3 norm = normalize(vNormal);
          vec3 sunDir = normalize(uSunPosition);
          
          // Directional solar lighting
          float NdotL = dot(norm, sunDir);
          float sunFactor = smoothstep(-0.25, 0.75, NdotL);
          
          // Underside self-shadowing
          float heightFactor = smoothstep(-0.7, 0.5, norm.y);
          
          // Forward scattering / silver lining rim towards sun
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float forwardScatter = pow(max(0.0, dot(viewDir, -sunDir)), 2.8) * (1.0 - abs(NdotL) * 0.6);
          
          // Fractal cloud density noise
          vec4 tex = texture2D(uCloudMap, vUv);
          float density = tex.a;
          
          vec3 sunHighlight = uSunColor * (sunFactor * 0.85 + forwardScatter * 1.5 + 0.18);
          vec3 shadowTone = mix(uCloudBellyColor, uAmbientColor, heightFactor * 0.55);
          vec3 finalColor = mix(shadowTone, sunHighlight, sunFactor * 0.7 + heightFactor * 0.3);
          
          float alpha = density * smoothstep(0.05, 0.40, density) * uCloudOpacity;
          if (alpha < 0.02) discard;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Storm / Coastal underside cloud shader
    this.stormCloudShaderMat = this.cloudShaderMat.clone();
    this.stormCloudShaderMat.uniforms.uCloudBellyColor.value = new THREE.Color(0x4b5563);
    this.stormCloudShaderMat.uniforms.uAmbientColor.value = new THREE.Color(0x6b7280);

    this.cloudMat = this.cloudShaderMat;
    this.stormCloudMat = this.stormCloudShaderMat;

    const puffGeo = new THREE.SphereGeometry(1, 14, 10);
    this.clouds = [];
    const CLOUD_COUNT = 48;

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = new THREE.Group();
      
      // Determine zone slice along the 23,400m Pacific Highway
      const highwayZ = (i / CLOUD_COUNT) * 24000;
      let isStormZone = (highwayZ >= 15600 && highwayZ < 18200); // Oregon coast storm cumulus
      let isCliffFog = (highwayZ >= 5200 && highwayZ < 7800);  // Big Sur cliff mist
      let isOceanBank = (highwayZ >= 2600 && highwayZ < 5200); // Malibu marine layer
      let isGorgeWind = (highwayZ >= 18200 && highwayZ < 20800); // Columbia Gorge scud

      const tier = i % 4;
      let baseScale = tier === 0 ? 28 : (tier === 1 ? 22 : (tier === 2 ? 16 : 11));
      let numPuffs = tier === 0 ? 9 : (tier === 1 ? 7 : (tier === 2 ? 5 : 4));
      
      if (isStormZone) {
        baseScale *= 1.35;
        numPuffs += 3;
      }

      const widthSpread = baseScale * 1.8;
      const activeMat = (isStormZone && Math.random() > 0.45) ? this.stormCloudMat : this.cloudMat;

      const puffGeoms = [];
      for (let p = 0; p < numPuffs; p++) {
        const t = (p - numPuffs * 0.5) / (numPuffs * 0.5); // -1.0 to +1.0
        
        const offsetX = t * widthSpread + (Math.random() - 0.5) * (baseScale * 0.4);
        const offsetY = (1.0 - Math.pow(Math.abs(t), 1.5)) * (baseScale * 0.7) + (Math.random() - 0.5) * (baseScale * 0.3);
        const offsetZ = (Math.random() - 0.5) * (baseScale * 0.6);

        const puffRadius = baseScale * (0.65 + (1.0 - Math.abs(t)) * 0.45) * (0.85 + Math.random() * 0.3);
        const g = puffGeo.clone();
        g.scale(puffRadius * 1.3, puffRadius * 0.9, puffRadius * 1.1);
        g.translate(offsetX, offsetY, offsetZ);
        puffGeoms.push(g);
      }

      try {
        const mergedCloud = mergeGeometries(puffGeoms, false);
        if (mergedCloud) {
          cloud.add(new THREE.Mesh(mergedCloud, activeMat));
        } else {
          puffGeoms.forEach(g => cloud.add(new THREE.Mesh(g, activeMat)));
        }
      } catch (e) {
        puffGeoms.forEach(g => cloud.add(new THREE.Mesh(g, activeMat)));
      }

      let cx, cy, cz;
      if (i < 20) {
        // Panoramic viewing canopy around player
        const angle = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const dist = 320 + Math.random() * 850;
        cx = Math.sin(angle) * dist;
        cz = Math.cos(angle) * dist * 1.1 + 250;
        cy = 200 + Math.random() * 140;
      } else {
        // Highway-spanning cloud formations across the 12,500m Pacific Highway
        cz = highwayZ;
        if (isOceanBank) {
          // Concentrate Malibu/PCH marine cloud banks out over Pacific (West / negative X)
          cx = -180 - Math.random() * 450;
          cy = 160 + Math.random() * 110;
        } else if (isCliffFog) {
          // Low-altitude coastal fog hugging Big Sur cliffs
          cx = -80 - Math.random() * 320;
          cy = 90 + Math.random() * 90;
        } else {
          cx = (Math.random() - 0.5) * 1900;
          cy = 210 + Math.random() * 140;
        }
      }

      cloud.position.set(cx, cy, cz);
      cloud.visible = (cz >= -600 && cz <= 3200);
      this.cloudsGroup.add(cloud);
      this.clouds.push({
        group: cloud,
        speedX: (isGorgeWind ? 3.8 : 1.2) + Math.random() * 1.5,
        baseY: cy,
        bobPhase: Math.random() * Math.PI * 2
      });
    }

    // High-Altitude Silky Cirrus Cloud Ribbons
    const cirrusTex = this.renderer.textures.cirrusWisp ? this.renderer.textures.cirrusWisp(512, 128) : null;
    if (cirrusTex) {
      const cirrusGeo = new THREE.PlaneGeometry(280, 65);
      cirrusGeo.rotateX(-Math.PI * 0.5);
      const cirrusMat = new THREE.MeshBasicMaterial({
        map: cirrusTex,
        transparent: true,
        opacity: 0.40,
        depthWrite: false,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide
      });

      for (let c = 0; c < 30; c++) {
        const cirrusMesh = new THREE.Mesh(cirrusGeo, cirrusMat);
        const cirrusX = (Math.random() - 0.5) * 2000;
        const cirrusY = 390 + Math.random() * 110;
        const cirrusZ = (c / 30) * 13000 - 400;
        cirrusMesh.position.set(cirrusX, cirrusY, cirrusZ);
        cirrusMesh.rotation.y = (Math.random() - 0.5) * 0.6;
        cirrusMesh.scale.set(1.3 + Math.random() * 0.8, 1, 1.2 + Math.random() * 0.6);
        this.cloudsGroup.add(cirrusMesh);
      }
    }

    this.group.add(this.cloudsGroup);
  }

  createCircleParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.1)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  createSandGritTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    // Soft organic dust mote center
    const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 28);
    grad.addColorStop(0.0, 'rgba(215, 165, 110, 0.95)');
    grad.addColorStop(0.35, 'rgba(195, 140, 85, 0.65)');
    grad.addColorStop(0.70, 'rgba(175, 115, 65, 0.20)');
    grad.addColorStop(1.0, 'rgba(150, 95, 50, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    // Secondary micro-specks for gritty sand texture (eliminates synthetic glowing spheres)
    for (let s = 0; s < 8; s++) {
      const sx = 18 + Math.random() * 28;
      const sy = 18 + Math.random() * 28;
      const sr = 1.2 + Math.random() * 3.2;
      const sGrad = ctx.createRadialGradient(sx, sy, 0.4, sx, sy, sr);
      sGrad.addColorStop(0.0, 'rgba(180, 110, 55, 0.85)');
      sGrad.addColorStop(1.0, 'rgba(160, 90, 40, 0.0)');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createDustVortexTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);

    // 1. Soft atmospheric desert dust haze envelope
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0.0, 'rgba(180, 120, 70, 0.0)');
    bgGrad.addColorStop(0.18, 'rgba(195, 135, 80, 0.16)');
    bgGrad.addColorStop(0.50, 'rgba(210, 150, 90, 0.24)');
    bgGrad.addColorStop(0.82, 'rgba(185, 125, 75, 0.18)');
    bgGrad.addColorStop(1.0, 'rgba(170, 110, 60, 0.0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Multi-layered swirling desert dust striations & shear wind filaments
    for (let i = 0; i < 72; i++) {
      const x0 = (i / 72) * 512;
      const alpha = 0.18 + Math.random() * 0.40;
      const width = 12 + Math.random() * 30;
      const slant = 180 + Math.random() * 60;

      const grad = ctx.createLinearGradient(x0, 0, x0 + slant, 512);
      const hue = Math.random();
      if (hue < 0.38) {
        // Terracotta / red sand band
        grad.addColorStop(0.0, 'rgba(175, 90, 45, 0)');
        grad.addColorStop(0.25, `rgba(198, 114, 59, ${alpha * 0.85})`);
        grad.addColorStop(0.5, `rgba(180, 95, 48, ${alpha})`);
        grad.addColorStop(0.8, `rgba(160, 80, 38, ${alpha * 0.75})`);
        grad.addColorStop(1.0, 'rgba(145, 70, 32, 0)');
      } else if (hue < 0.78) {
        // Golden ochre / warm desert silt
        grad.addColorStop(0.0, 'rgba(215, 160, 95, 0)');
        grad.addColorStop(0.25, `rgba(228, 178, 112, ${alpha * 0.9})`);
        grad.addColorStop(0.5, `rgba(212, 156, 88, ${alpha})`);
        grad.addColorStop(0.8, `rgba(190, 136, 74, ${alpha * 0.8})`);
        grad.addColorStop(1.0, 'rgba(170, 115, 58, 0)');
      } else {
        // Sandy tan / ambient wind streak
        grad.addColorStop(0.0, 'rgba(230, 195, 145, 0)');
        grad.addColorStop(0.3, `rgba(235, 202, 155, ${alpha * 0.7})`);
        grad.addColorStop(0.6, `rgba(218, 180, 130, ${alpha * 0.8})`);
        grad.addColorStop(1.0, 'rgba(195, 150, 100, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x0 - width, 0);
      ctx.lineTo(x0 + width, 0);
      ctx.lineTo(x0 + slant + width, 512);
      ctx.lineTo(x0 + slant - width, 512);
      ctx.closePath();
      ctx.fill();

      // Wrap-around seamlessly across U boundary
      ctx.beginPath();
      ctx.moveTo(x0 - width - 512, 0);
      ctx.lineTo(x0 + width - 512, 0);
      ctx.lineTo(x0 + slant + width - 512, 512);
      ctx.lineTo(x0 + slant - width - 512, 512);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Fine high-frequency turbulent filaments
    for (let f = 0; f < 36; f++) {
      const fx = Math.random() * 512;
      const fWidth = 2 + Math.random() * 4;
      const fAlpha = 0.14 + Math.random() * 0.22;
      ctx.fillStyle = `rgba(235, 190, 135, ${fAlpha})`;
      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.lineTo(fx + fWidth, 0);
      ctx.lineTo(fx + 220 + fWidth, 512);
      ctx.lineTo(fx + 220, 512);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Vertical alpha shaping: smooth touchdown neck, dense energetic column, feathered natural plume top
    ctx.globalCompositeOperation = 'destination-in';
    const vertGrad = ctx.createLinearGradient(0, 0, 0, 512);
    vertGrad.addColorStop(0.00, 'rgba(0, 0, 0, 0.0)');
    vertGrad.addColorStop(0.08, 'rgba(0, 0, 0, 0.45)');
    vertGrad.addColorStop(0.20, 'rgba(0, 0, 0, 0.88)');
    vertGrad.addColorStop(0.50, 'rgba(0, 0, 0, 0.95)');
    vertGrad.addColorStop(0.80, 'rgba(0, 0, 0, 0.75)');
    vertGrad.addColorStop(0.95, 'rgba(0, 0, 0, 0.20)');
    vertGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = vertGrad;
    ctx.fillRect(0, 0, 512, 512);
    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  createDustSkirtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128, cy = 128;

    ctx.clearRect(0, 0, 256, 256);

    // Multi-lobed radial churning spiral dust cloud
    for (let lobe = 0; lobe < 10; lobe++) {
      const angle = (lobe / 10) * Math.PI * 2;
      const lx = cx + Math.cos(angle) * 36;
      const ly = cy + Math.sin(angle) * 36;
      const radGrad = ctx.createRadialGradient(lx, ly, 4, cx, cy, 116);
      radGrad.addColorStop(0.0, 'rgba(215, 155, 95, 0.72)');
      radGrad.addColorStop(0.35, 'rgba(195, 130, 75, 0.48)');
      radGrad.addColorStop(0.70, 'rgba(175, 110, 60, 0.18)');
      radGrad.addColorStop(1.0, 'rgba(160, 95, 50, 0.0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spiral swirling dust arms
    for (let arm = 0; arm < 6; arm++) {
      const baseA = (arm / 6) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(225, 170, 110, 0.32)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      for (let r = 10; r < 110; r += 6) {
        const a = baseA + (r / 110) * 2.2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (r === 10) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createHyperbolicFunnelGeometry(bottomRadius, topRadius, height, radialSegments = 28, heightSegments = 16) {
    const geo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, radialSegments, heightSegments, true);
    const pos = geo.attributes.position;
    // Morph straight cone cylinder into natural hyperbolic tornado curvature (tight neck, flared plume)
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + height * 0.5) / height; // 0 (ground contact) to 1 (high plume)
      const currentRadius = bottomRadius + (topRadius - bottomRadius) * t;
      const curvedT = Math.pow(t, 1.85);
      const targetRadius = bottomRadius + (topRadius - bottomRadius) * curvedT;
      const scale = currentRadius > 0.001 ? (targetRadius / currentRadius) : 1.0;
      pos.setX(i, pos.getX(i) * scale);
      pos.setZ(i, pos.getZ(i) * scale);
    }
    geo.computeVertexNormals();
    geo.translate(0, height * 0.5, 0);
    return geo;
  }

  setupDustParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const sandTex = this.createSandGritTexture();
    const mat = new THREE.PointsMaterial({
      color: 0xecd7b4,
      size: 1.4,
      map: sandTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.dustSystem = new THREE.Points(geometry, mat);
    this.group.add(this.dustSystem);

    this.dustParticles = [];
    for (let i = 0; i < particleCount; i++) {
      this.dustParticles.push({
        x: 0, y: -100, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.9
      });
    }
  }

  createRainStreakTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 32, 128);

    // Realistic glassy water streak down center
    const grad = ctx.createLinearGradient(16, 0, 16, 128);
    grad.addColorStop(0.0, 'rgba(200, 230, 255, 0.0)');
    grad.addColorStop(0.15, 'rgba(225, 245, 255, 0.65)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.92, 'rgba(255, 255, 255, 0.70)');
    grad.addColorStop(1.0, 'rgba(200, 230, 255, 0.0)');
    
    ctx.fillStyle = grad;
    // Slender needle streak
    ctx.fillRect(14, 2, 4, 124);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)');
    grad.addColorStop(0.35, 'rgba(240, 248, 255, 0.88)');
    grad.addColorStop(0.70, 'rgba(215, 235, 255, 0.45)');
    grad.addColorStop(1.0, 'rgba(200, 225, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createSplashRippleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 64, 64);

    // Expanding water ripple ring
    ctx.strokeStyle = 'rgba(215, 240, 255, 0.70)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(32, 32, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle inner ripple
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, 32, 12, 0, Math.PI * 2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  setupGroundSplashes() {
    this.splashCount = 120;
    const ringGeo = new THREE.PlaneGeometry(1.4, 1.4);
    ringGeo.rotateX(-Math.PI * 0.5);

    const splashTex = this.createSplashRippleTexture();
    const splashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: splashTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending,
      fog: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.splashMesh = new THREE.InstancedMesh(ringGeo, splashMat, this.splashCount);
    this.splashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.splashMesh.frustumCulled = false;
    this.splashMesh.renderOrder = 5;
    this.group.add(this.splashMesh);

    this.splashDummy = new THREE.Object3D();
    this.splashes = [];
    this.splashIdx = 0;
    for (let i = 0; i < this.splashCount; i++) {
      this.splashes.push({
        x: 0, y: -100, z: 0,
        life: 0,
        maxLife: 0.28,
        active: false
      });
    }
  }

  spawnGroundSplash(x, y, z) {
    if (!this.splashes) return;
    const s = this.splashes[this.splashIdx];
    s.x = x;
    s.y = y;
    s.z = z;
    s.life = 0;
    s.active = true;
    this.splashIdx = (this.splashIdx + 1) % this.splashCount;
  }

  setupPrecipitationParticles() {
    this.rainCount = 1600;
    const rainGeo = new THREE.PlaneGeometry(0.09, 2.2);

    this.rainTex = this.createRainStreakTexture();
    this.snowTex = this.createSnowflakeTexture();
    this.currentPrecipMode = 'rain';

    this.rainMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.rainTex,
      transparent: true,
      opacity: 0.80,
      blending: THREE.NormalBlending,
      fog: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.rainMesh = new THREE.InstancedMesh(rainGeo, this.rainMat, this.rainCount);
    this.rainMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.renderOrder = 10;
    this.group.add(this.rainMesh);

    this.rainDummy = new THREE.Object3D();

    this.precipParticles = [];
    for (let i = 0; i < this.rainCount; i++) {
      this.precipParticles.push({
        x: (Math.random() - 0.5) * 44.0,
        y: Math.random() * 26.0 + 1.0,
        z: -5.0 + Math.random() * 45.0,
        speed: 22 + Math.random() * 14
      });
    }
  }

  setupHeatMirageParticles() {
    // Road heat mirage steam removed per user request
  }

  setupDustDevils() {
    // Tornadoes / Dust devils removed per user request to improve performance and eliminate lag
    this.dustDevils = [];
  }

  setupLightningSystem() {
    this.lightningTimer = 6.0 + Math.random() * 6.0;
    this.isFlashing = false;
    this.flashTime = 0.0;
    this.flashDuration = 0.42;
    this.flashIntensity = 0.0;
    this.strikePos = new THREE.Vector3();

    // 3D Branched Lightning Bolt Geometry & Material (Instanced 3D Cylinders)
    this.maxBoltSegments = 250;
    const cylGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.0, 5);
    cylGeo.translate(0, 0.5, 0); // Origin at base for easy alignment

    const boltMat = new THREE.MeshBasicMaterial({
      color: 0xf5faff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.lightningMesh = new THREE.InstancedMesh(cylGeo, boltMat, this.maxBoltSegments);
    this.lightningMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.lightningMesh.frustumCulled = false;
    this.lightningMesh.renderOrder = 25;
    this.group.add(this.lightningMesh);

    this.boltDummy = new THREE.Object3D();
    this.boltSegments = [];

    // Hide all instances initially
    for (let i = 0; i < this.maxBoltSegments; i++) {
      this.boltDummy.position.set(0, -500, 0);
      this.boltDummy.updateMatrix();
      this.lightningMesh.setMatrixAt(i, this.boltDummy.matrix);
    }
    this.lightningMesh.instanceMatrix.needsUpdate = true;

    // Atmospheric High-Voltage Directional Light Flash
    this.lightningLight = new THREE.DirectionalLight(0xd4e8ff, 0.0);
    this.lightningLight.position.set(0, 200, 0);
    this.group.add(this.lightningLight);
  }

  generateLightningBranch(p1, p2, depth, segments, branchProbability = 0.70, isMain = true) {
    if (depth <= 0) {
      if (segments.length < this.maxBoltSegments) {
        segments.push({
          p1: p1.clone(),
          p2: p2.clone(),
          radius: isMain ? (1.2 + Math.random() * 0.4) : (0.55 + Math.random() * 0.3)
        });
      }
      return;
    }

    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const dist = p1.distanceTo(p2);
    const jitter = dist * 0.25;

    mid.x += (Math.random() - 0.5) * jitter;
    mid.y += (Math.random() - 0.5) * jitter * 0.40;
    mid.z += (Math.random() - 0.5) * jitter;

    this.generateLightningBranch(p1, mid, depth - 1, segments, branchProbability * 0.75, isMain);
    this.generateLightningBranch(mid, p2, depth - 1, segments, branchProbability * 0.75, isMain);

    // Forked sub-branch
    if (Math.random() < branchProbability && depth >= 2 && segments.length < this.maxBoltSegments - 20) {
      const forkEnd = mid.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * dist * 0.75,
        -dist * (0.35 + Math.random() * 0.35),
        (Math.random() - 0.5) * dist * 0.75
      ));
      this.generateLightningBranch(mid, forkEnd, depth - 1, segments, 0.35, false);
    }
  }

  triggerLightningStrike(forced = false) {
    const playerPos = this.vehicle ? this.vehicle.group.position : new THREE.Vector3(0, 0, 0);
    
    // Choose horizon strike location (forward quadrant in camera view)
    const angle = (Math.random() - 0.5) * 0.90; // -25 to +25 deg
    const dist = 180 + Math.random() * 260;
    const strikeX = playerPos.x + Math.sin(angle) * dist + (Math.random() - 0.5) * 40;
    const strikeZ = playerPos.z + Math.cos(angle) * dist;
    const strikeY = Math.max(4, playerPos.y + (Math.random() - 0.5) * 15); // Mountain ridge / ground level

    const cloudTopX = strikeX + (Math.random() - 0.5) * 45;
    const cloudTopY = playerPos.y + 155 + Math.random() * 35;
    const cloudTopZ = strikeZ + (Math.random() - 0.5) * 45;

    const pStart = new THREE.Vector3(cloudTopX, cloudTopY, cloudTopZ);
    const pEnd = new THREE.Vector3(strikeX, strikeY, strikeZ);
    this.strikePos.copy(pEnd);

    // Generate 3D fractal jagged bolt segments
    const segments = [];
    this.generateLightningBranch(pStart, pEnd, 4, segments, 0.75, true);

    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    for (let i = 0; i < this.maxBoltSegments; i++) {
      if (i < segments.length) {
        const s = segments[i];
        dir.subVectors(s.p2, s.p1);
        const len = dir.length();
        dir.normalize();

        quat.setFromUnitVectors(up, dir);
        this.boltDummy.position.copy(s.p1);
        this.boltDummy.quaternion.copy(quat);
        this.boltDummy.scale.set(s.radius, len, s.radius);
        this.boltDummy.updateMatrix();
        this.lightningMesh.setMatrixAt(i, this.boltDummy.matrix);
      } else {
        this.boltDummy.position.set(0, -500, 0);
        this.boltDummy.updateMatrix();
        this.lightningMesh.setMatrixAt(i, this.boltDummy.matrix);
      }
    }
    this.lightningMesh.instanceMatrix.needsUpdate = true;

    // Position dynamic flash light near strike
    this.lightningLight.position.set(strikeX, strikeY + 80, strikeZ);

    // Begin multi-stroke flash animation
    this.isFlashing = true;
    this.flashTime = 0.0;

    // Pan audio based on strike angle relative to player (-1 to +1)
    const panX = Math.sin(angle);
    if (this.soundEngine && this.soundEngine.triggerThunder) {
      this.soundEngine.triggerThunder(dist, panX);
    }
  }

  update(dt, playerPos) {
    this.time += dt;

    // 0. Sky dome follows the player so its horizon always lines up perfectly
    if (this.skyDome) {
      this.skyDome.position.set(playerPos.x, 0, playerPos.z);
      
      // Smoothly interpolate sky shader palette toward active zone targets
      if (this.skyMat && this.skyMat.uniforms) {
        const u = this.skyMat.uniforms;
        if (this.targetSkyTop) u.uTopColor.value.lerp(this.targetSkyTop, 0.05);
        if (this.targetSkyMid) u.uMidColor.value.lerp(this.targetSkyMid, 0.05);
        if (this.targetSkyHorizon) u.uHorizonColor.value.lerp(this.targetSkyHorizon, 0.05);
        if (this.targetHazeColor) u.uHazeColor.value.lerp(this.targetHazeColor, 0.05);
        if (this.targetSunColor) u.uSunColor.value.lerp(this.targetSunColor, 0.05);
        if (this.targetAlpenglowColor) u.uAlpenglowColor.value.lerp(this.targetAlpenglowColor, 0.05);
        
        u.uSunGlowIntensity.value += (this.targetSunGlow - u.uSunGlowIntensity.value) * 0.05;
        u.uMieG.value += (this.targetMieG - u.uMieG.value) * 0.05;
        u.uHeatShimmer.value += (this.targetHeatShimmer - u.uHeatShimmer.value) * 0.05;
        u.uStarVisibility.value += (this.targetStarVisibility - u.uStarVisibility.value) * 0.05;
        u.uCloudDensity.value += (this.targetCloudDensity - u.uCloudDensity.value) * 0.05;
        
        u.uTimeOfDay.value = gameState.timeOfDay;
        u.uTime.value = this.time;
      }
    }

    // 1. Orbiting Sun with Multi-Stage Corona positioned relative to player
    const sunAngle = (gameState.timeOfDay * Math.PI * 2) + Math.PI * 0.45;
    const sunDist = 950;
    const sunX = playerPos.x + Math.sin(sunAngle) * sunDist;
    const sunY = playerPos.y + Math.max(160, Math.cos(sunAngle) * 620);
    const sunZ = playerPos.z + 420;

    this.sunGroup.position.set(sunX, sunY, sunZ);
    this.sunGroup.lookAt(playerPos.x, playerPos.y + 2, playerPos.z);
    this.renderer.updateSunShadowCenter(playerPos);

    if (this.skyMat && this.skyMat.uniforms && this.skyDome) {
      if (!this._sunRel) this._sunRel = new THREE.Vector3();
      this._sunRel.set(sunX - playerPos.x, sunY - playerPos.y, sunZ - playerPos.z).normalize();
      this.skyMat.uniforms.uSunPosition.value.copy(this._sunRel);
      if (this.cloudShaderMat && this.cloudShaderMat.uniforms) {
        this.cloudShaderMat.uniforms.uSunPosition.value.copy(this._sunRel);
      }
      if (this.stormCloudShaderMat && this.stormCloudShaderMat.uniforms) {
        this.stormCloudShaderMat.uniforms.uSunPosition.value.copy(this._sunRel);
      }
    }

    if (this.starburstSprite && this.starburstSprite.material) {
      this.starburstSprite.material.rotation += dt * 0.03;
      const glowFactor = this.targetSunGlow || 1.0;
      this.starburstSprite.scale.set(380 * glowFactor, 380 * glowFactor, 1);
    }

    // 2. Drift & Recycle Atmospheric Clouds
    const currentSpeedFactor = this.targetCloudSpeed || 1.0;
    this.clouds.forEach(c => {
      c.group.position.x += c.speedX * currentSpeedFactor * dt;
      c.bobPhase += dt * 0.5;
      c.group.position.y = c.baseY + Math.sin(c.bobPhase) * 3.5;

      if (c.group.position.x > 850) {
        c.group.position.x = -850;
      }

      // Recycle clouds forward/backward relative to player
      if (c.group.position.z < playerPos.z - 1200) {
        c.group.position.z += 12500;
      } else if (c.group.position.z > playerPos.z + 11500) {
        c.group.position.z -= 12500;
      }

      // Distance culling outside fog horizon
      const isVisible = (c.group.position.z >= playerPos.z - 600 && c.group.position.z <= playerPos.z + 3200);
      if (c.group.visible !== isVisible) c.group.visible = isVisible;
    });

    // Determine current active zone for weather VFX
    const z = Math.max(0, playerPos.z);
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
    const precipType = currentZone.precipitation || 'none';

    // 3. Update Dust & Tire Roostertail Burnout Spray Particles
    let hasActiveDust = false;
    if (Math.abs(gameState.speed) > 1.0) {
      const pIdx = Math.floor(Math.random() * this.dustParticles.length);
      const p = this.dustParticles[pIdx];
      
      if (!this._rearWheelL) {
        this._rearWheelL = new THREE.Vector3();
        this._rearWheelR = new THREE.Vector3();
      }
      const rearL = this._rearWheelL.set(-0.95, 0.2, -1.35).applyMatrix4(this.vehicle.group.matrixWorld);
      const rearR = this._rearWheelR.set( 0.95, 0.2, -1.35).applyMatrix4(this.vehicle.group.matrixWorld);
      const spawnPt = Math.random() > 0.5 ? rearL : rearR;

      const isWetZone = (precipType === 'rain');

      p.x = spawnPt.x + (Math.random() - 0.5) * 0.4;
      p.y = spawnPt.y;
      p.z = spawnPt.z + (Math.random() - 0.5) * 0.4;
      p.vx = (Math.random() - 0.5) * 2.5;
      p.vy = (isWetZone ? 2.5 : 1.4) + Math.random() * (isWetZone ? 4.5 : 3.2);
      p.vz = -Math.sign(gameState.speed) * (gameState.isDrifting ? 7.5 : 4.5);
      p.life = 0;
      hasActiveDust = true;
    }

    const posAttr = this.dustSystem.geometry.attributes.position;
    for (let i = 0; i < this.dustParticles.length; i++) {
      const p = this.dustParticles[i];
      if (p.y > -50) {
        hasActiveDust = true;
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 1.4 * dt;

        if (p.life >= p.maxLife) {
          p.y = -100;
        }

        posAttr.setXYZ(i, p.x, p.y, p.z);
      }
    }
    // Dust particles only exist meaningfully in Zone 0 (Mojave Desert) — skip
    // the 200-particle CPU loop entirely in all other zones for a free +1-3 FPS.
    const isZone0 = (playerPos.z < 2800);
    if (isZone0) {
      posAttr.needsUpdate = true;
    } else if (hasActiveDust) {
      posAttr.needsUpdate = true;
    }

    let isRaining = (precipType === 'rain');
    let isSnowing = (precipType === 'snow');
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

    gameState.isRaining = isRaining;
    gameState.isSnowing = isSnowing;

    const targetRainIntensity = (isRaining || isSnowing) ? 1.0 : 0.0;
    gameState.rainIntensity = (gameState.rainIntensity !== undefined) ? gameState.rainIntensity : 0.0;
    gameState.rainIntensity += (targetRainIntensity - gameState.rainIntensity) * Math.min(1.0, dt * 1.5);

    // Dynamic wheel roostertail spray color
    if (this.dustSystem && this.dustSystem.material) {
      if (isSnowing) {
        this.dustSystem.material.color.setHex(0xf4f9ff);
        this.dustSystem.material.size = 2.4;
      } else if (gameState.rainIntensity > 0.3) {
        this.dustSystem.material.color.setHex(0xd0e8ff);
        this.dustSystem.material.size = 2.8;
      } else {
        this.dustSystem.material.color.setHex(0xecd7b4);
        this.dustSystem.material.size = 1.8;
      }
    }

    // 4. Dynamic Multi-Layer 3D Physical Precipitation Mesh
    if (this.rainMesh && this.precipParticles) {
      const shouldPrecip = gameState.rainIntensity > 0.02 && (isRaining || isSnowing);
      if (!shouldPrecip) {
        if (this.rainMesh.visible) this.rainMesh.visible = false;
      } else {
        if (!this.rainMesh.visible) this.rainMesh.visible = true;

        // Texture and material mode switching between rain streak and snow crystal
        const precipMode = isSnowing ? 'snow' : 'rain';
        if (this.currentPrecipMode !== precipMode) {
          this.currentPrecipMode = precipMode;
          this.rainMat.map = isSnowing ? this.snowTex : this.rainTex;
          this.rainMat.opacity = isSnowing ? 0.92 : 0.80;
          this.rainMat.needsUpdate = true;
        }

        const carSpeed = gameState.speed || 0;
        const groundY = playerPos.y;
        const cam = this.renderer.camera;
        const camX = cam ? cam.position.x : playerPos.x;
        const camZ = cam ? cam.position.z : playerPos.z;

        // Mobile / performance modes scale active count for massive fillrate savings
        const isMobileOrPerf = this.renderer.isMobile || this.renderer.qualityMode === 'performance';
        const activeRainCount = isMobileOrPerf ? Math.min(this.rainCount, 500) : (this.renderer.qualityMode === 'balanced' ? Math.min(this.rainCount, 900) : this.rainCount);
        const timeVal = gameState.gameTime || 0;

        for (let i = 0; i < activeRainCount; i++) {
          const p = this.precipParticles[i];
          let vx, vy;
          if (isSnowing) {
            vx = -(currentZone.windForce || 0) * 0.20 + Math.sin(timeVal * 2.2 + i * 0.5) * 1.4;
            vy = - (4.2 + (p.speed % 4.5));
          } else {
            vx = -(currentZone.windForce || 0) * 0.35;
            vy = -p.speed;
          }
          const vz = -carSpeed * 0.25;

          p.x += vx * dt;
          p.y += vy * dt;
          p.z += vz * dt;

          // Ground impact detection: trigger asphalt splash ripple rings (rain only)
          if (!isSnowing && p.y <= groundY + 0.20 && p.y >= groundY - 0.4) {
            if (Math.random() < 0.25) {
              this.spawnGroundSplash(p.x, groundY + 0.04, p.z);
            }
          }

          // Keep rain particles in front of camera view in full height column
          const relCamX = p.x - camX;
          const relCamZ = p.z - camZ;

          if (p.y < groundY - 0.8 || p.y > groundY + 12.0 || Math.abs(relCamX) > 20.0 || relCamZ < 1.0 || relCamZ > 34.0) {
            p.y = groundY + 7.5 + Math.random() * 4.5;
            p.x = camX + (Math.random() - 0.5) * 36.0;
            p.z = camZ + 1.0 + Math.random() * 32.0;
          }

          this.rainDummy.position.set(p.x, p.y, p.z);
          if (isSnowing) {
            this.rainDummy.scale.set(1.4, 0.35, 1.4);
          } else {
            this.rainDummy.scale.set(1.0, 1.0, 1.0);
          }
          // Pure vertical billboard facing camera horizontally
          const yaw = Math.atan2(camX - p.x, camZ - p.z);
          this.rainDummy.rotation.set(0, yaw, 0);
          this.rainDummy.updateMatrix();
          this.rainMesh.setMatrixAt(i, this.rainDummy.matrix);
        }

        this.rainMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // 4b. Update 3D Ground Splash Ripple Rings (Instanced Ground Quads)
    if (this.splashMesh && this.splashes) {
      if (!isRaining) {
        if (this.splashMesh.visible) this.splashMesh.visible = false;
      } else {
        if (!this.splashMesh.visible) this.splashMesh.visible = true;
        let anyActive = false;
        for (let i = 0; i < this.splashCount; i++) {
          const s = this.splashes[i];
          if (s.active) {
            anyActive = true;
            s.life += dt;
            const progress = s.life / s.maxLife;
            if (progress >= 1.0) {
              s.active = false;
              this.splashDummy.position.set(0, -100, 0);
            } else {
              const scale = 0.3 + progress * 1.1;
              this.splashDummy.position.set(s.x, s.y, s.z);
              this.splashDummy.scale.set(scale, 1, scale);
            }
            this.splashDummy.updateMatrix();
            this.splashMesh.setMatrixAt(i, this.splashDummy.matrix);
          }
        }
        if (anyActive) {
          this.splashMesh.instanceMatrix.needsUpdate = true;
        }
      }
    }

    // 5. Update Desert Dust Devils (Zone 0 only when player is near)
    if (this.dustDevils && this.dustDevils.length > 0 && playerPos.z < 2800) {
      if (this.texDustVortex) {
        // Continuous upward suction vertical texture flow
        this.texDustVortex.offset.y -= dt * 1.5;
      }
      // Throttle particle GPU buffer uploads to every 2nd frame — halves buffer write cost
      // for 4 × 150 particle positions without affecting visible motion smoothness.
      this._ddFrame = (this._ddFrame || 0) + 1;
      const doDDParticleUpload = (this._ddFrame % 2 === 0);

      this.dustDevils.forEach(dd => {
        const distZ = Math.abs(dd.baseZ - playerPos.z);
        if (distZ > 380) {
          dd.group.visible = false;
          return;
        }
        dd.group.visible = true;
        dd.wobble += dt * 0.75;
        // Meandering natural drift across desert floor
        dd.group.position.x = dd.baseX + Math.sin(dd.wobble) * 14.0 + Math.cos(dd.wobble * 0.45) * 6.0;
        dd.group.position.z = dd.baseZ + Math.cos(dd.wobble * 0.65) * 10.0 + Math.sin(dd.wobble * 0.3) * 5.0;
        dd.group.position.y = calculateTerrainHeight(dd.group.position.x, dd.group.position.z);

        // Subtle aerodynamic lean / tilt in wind
        dd.group.rotation.z = Math.sin(dd.wobble * 1.1) * 0.08;
        dd.group.rotation.x = Math.cos(dd.wobble * 0.85) * 0.06;

        // Differential vortex column spinning (Core fastest, outer diffuse plume counter-eddy)
        if (dd.innerMesh) dd.innerMesh.rotation.y += dt * 3.8;
        if (dd.outerMesh) dd.outerMesh.rotation.y -= dt * 2.2;
        if (dd.coreMesh) dd.coreMesh.rotation.y += dt * 5.2;

        // Multi-tier ground churning sand skirts rotation & breathing
        if (dd.groundSkirt1) {
          dd.groundSkirt1.rotation.z += dt * 2.8;
          const s1 = 1.0 + Math.sin(dd.wobble * 2.4) * 0.12;
          dd.groundSkirt1.scale.set(s1, s1, 1.0);
        }
        if (dd.groundSkirt2) {
          dd.groundSkirt2.rotation.z -= dt * 2.1;
          const s2 = 1.45 + Math.cos(dd.wobble * 1.8) * 0.16;
          dd.groundSkirt2.scale.set(s2, s2, 1.0);
        }
        if (dd.groundSkirt3) {
          dd.groundSkirt3.rotation.z += dt * 1.4;
          const s3 = 2.10 + Math.sin(dd.wobble * 1.3) * 0.20;
          dd.groundSkirt3.scale.set(s3, s3, 1.0);
        }

        // Swirling 3D Hyperbolic Sand Grains & Grit Motes (skip vertex upload if > 200m away)
        if (dd.particles && dd.particlePoints && distZ < 220) {
          const posAttr = dd.particlePoints.geometry.attributes.position;
          const pCount = dd.particles.length;
          for (let i = 0; i < pCount; i++) {
            const p = dd.particles[i];
            p.y += p.vY * dt;
            p.angle += p.speed * dt;

            // Recycle particles to ground base once reaching top plume
            if (p.y > 46.0) {
              p.y = 0.1 + Math.random() * 0.8;
              p.angle = Math.random() * Math.PI * 2;
            }

            // Tapered hyperbolic helical radius expanding with height
            const heightNorm = p.y / 46.0;
            const r = (0.75 + Math.pow(heightNorm, 1.85) * 11.0) * p.radiusFactor;
            const px = Math.cos(p.angle) * r;
            const pz = Math.sin(p.angle) * r;

            posAttr.setXYZ(i, px, p.y, pz);
          }
          // Throttled GPU buffer upload — physics advance every frame, upload every 2nd
          if (doDDParticleUpload) {
            posAttr.needsUpdate = true;
          }
        }
      });
    }

    // 6. Dynamic Thunderstorm Multi-Pulse Lightning Strobe Animation & Scheduler
    if (this.isFlashing) {
      this.flashTime += dt;
      const t = this.flashTime;
      let intensity = 0;

      // Realistic 3-stroke return pulse curve
      if (t < 0.045) {
        // Stroke 1: primary ionization shock (instant 100% burst)
        intensity = 1.0 - (t / 0.045) * 0.55;
      } else if (t < 0.080) {
        // Micro-lull
        intensity = 0.45 - ((t - 0.045) / 0.035) * 0.25;
      } else if (t < 0.135) {
        // Stroke 2: Secondary return stroke re-strike (90% peak)
        intensity = 0.90 * (1.0 - (t - 0.080) / 0.055 * 0.5);
      } else if (t < 0.170) {
        // Micro-lull 2
        intensity = 0.45 - ((t - 0.135) / 0.035) * 0.25;
      } else if (t < 0.230) {
        // Stroke 3: Tertiary discharge
        intensity = 0.55 * (1.0 - (t - 0.170) / 0.060);
      } else if (t < 0.420) {
        // Exponential afterglow dissolution
        intensity = 0.20 * Math.exp(-(t - 0.230) * 12.0);
      } else {
        this.isFlashing = false;
        intensity = 0;
      }

      this.flashIntensity = intensity;

      // Drive atmospheric lighting surges
      if (this.renderer) {
        if (this.renderer.ambientLight) {
          this.renderer.ambientLight.intensity = 1.05 + intensity * 2.8;
        }
        if (this.renderer.hemiLight) {
          this.renderer.hemiLight.intensity = 0.65 + intensity * 2.2;
        }
        if (this.lightningLight) {
          this.lightningLight.intensity = intensity * 3.8;
        }
      }

      // Drive 3D branched bolt visibility
      if (this.lightningMesh && this.lightningMesh.material) {
        this.lightningMesh.material.opacity = Math.min(1.0, intensity * 1.5);
      }
    } else {
      if (this.lightningMesh && this.lightningMesh.material) {
        this.lightningMesh.material.opacity = 0.0;
      }
      if (this.lightningLight) {
        this.lightningLight.intensity = 0.0;
      }
    }

    // Dynamic lightning trigger scheduler during rain or storm
    if (isRaining) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.triggerLightningStrike();
        this.lightningTimer = 7.5 + Math.random() * 11.0; // Next strike in 7.5-18.5 seconds
      }
    }
  }
}