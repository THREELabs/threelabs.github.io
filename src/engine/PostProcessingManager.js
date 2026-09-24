import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { gameState } from '../state.js';

/**
 * Biome Color Grading & Tonal Response Shader
 * Implements perceptual filmic grading, shadow/highlight split toning,
 * temperature/tint adjustment, vibrance, contrast, and subtle edge vignette.
 */
export const BiomeColorGradeShader = {
  name: 'BiomeColorGradeShader',
  uniforms: {
    tDiffuse: { value: null },
    uExposure: { value: 1.0 },
    uContrast: { value: 1.02 },
    uSaturation: { value: 1.04 },
    uVibrance: { value: 0.08 },
    uTemperature: { value: 0.0 }, // -1.0 (cool blue) to +1.0 (warm amber)
    uTint: { value: 0.0 },        // -1.0 (emerald green) to +1.0 (magenta)
    uShadowTint: { value: new THREE.Color(1.0, 1.0, 1.0) },
    uHighlightTint: { value: new THREE.Color(1.0, 1.0, 1.0) },
    uGradingIntensity: { value: 1.0 },
    uVignetteIntensity: { value: 0.0 },
    uVignetteRoundness: { value: 0.85 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uExposure;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uVibrance;
    uniform float uTemperature;
    uniform float uTint;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    uniform float uGradingIntensity;
    uniform float uVignetteIntensity;
    uniform float uVignetteRoundness;
    varying vec2 vUv;

    // Perceptual luminance weights (Rec. 709)
    float getLuma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    void main() {
      vec4 baseTex = texture2D(tDiffuse, vUv);
      vec3 col = baseTex.rgb * uExposure;

      float luma = getLuma(col);

      // 1. Tonal split weights
      float shadowWeight = 1.0 - smoothstep(0.05, 0.55, luma);
      float highlightWeight = smoothstep(0.45, 0.95, luma);

      // 2. White Balance / Temperature & Tint Adjustment
      vec3 tempShift = vec3(
        uTemperature * 0.12 + uTint * 0.05,
        uTint * -0.08,
        -uTemperature * 0.12 + uTint * 0.04
      );
      col += tempShift * luma;

      // 3. Shadow / Highlight Split Toning
      vec3 graded = col;
      graded = mix(graded, graded * uShadowTint, shadowWeight * 0.65);
      graded = mix(graded, graded * uHighlightTint, highlightWeight * 0.65);

      // 4. Contrast S-Curve around middle-gray (0.18)
      graded = clamp(graded, 0.0, 1.5);
      graded = (graded - 0.18) * uContrast + 0.18;

      // 5. Vibrance (boosts low-saturated colors without blowing out skin/car primaries)
      float maxChan = max(graded.r, max(graded.g, graded.b));
      float minChan = min(graded.r, min(graded.g, graded.b));
      float sat = (maxChan - minChan) / max(maxChan, 0.001);
      float vibranceFactor = (1.0 - sat) * uVibrance;
      float newLuma = getLuma(graded);
      graded = mix(vec3(newLuma), graded, 1.0 + vibranceFactor);

      // 6. Global Saturation
      graded = mix(vec3(newLuma), graded, uSaturation);

      // 7. Blend grading intensity
      col = mix(col, clamp(graded, 0.0, 2.0), uGradingIntensity);

      // 8. Subtle Filmic Lens Vignette
      vec2 uvCentered = vUv - 0.5;
      uvCentered.x *= uVignetteRoundness;
      float dist = length(uvCentered);
      float vignette = smoothstep(0.85, 0.25, dist * (1.0 + uVignetteIntensity * 1.5));
      col *= mix(1.0, vignette, uVignetteIntensity);

      gl_FragColor = vec4(col, baseTex.a);
    }
  `
};

export const ZONE_COLOR_PROFILES = [
  // 0: Southern California Desert (Mojave & Route 66) - Clean daylight, sunny road
  {
    exposure: 1.04,
    contrast: 1.02,
    saturation: 1.05,
    vibrance: 0.10,
    temperature: 0.0,
    tint: 0.0,
    shadowTint: new THREE.Color(1.0, 1.0, 1.0),
    highlightTint: new THREE.Color(1.0, 1.0, 1.0),
    vignette: 0.0
  },
  // 1: Malibu & Pacific Coast Highway - Crisp coastal cyan, ocean reflections
  {
    exposure: 1.04,
    contrast: 1.08,
    saturation: 1.15,
    vibrance: 0.22,
    temperature: -0.04,
    tint: -0.02,
    shadowTint: new THREE.Color(0.82, 0.92, 1.02),
    highlightTint: new THREE.Color(1.02, 1.05, 1.08),
    vignette: 0.16
  },
  // 2: Big Sur Highway 1 - Dramatic alpenglow, rocky cliff contrast
  {
    exposure: 1.08,
    contrast: 1.03,
    saturation: 1.10,
    vibrance: 0.16,
    temperature: 0.05,
    tint: 0.01,
    shadowTint: new THREE.Color(0.96, 0.98, 1.02),
    highlightTint: new THREE.Color(1.06, 1.04, 1.00),
    vignette: 0.12
  },
  // 3: Monterey Bay & Carmel - Cool oceanic mist, soft marine layer
  {
    exposure: 1.00,
    contrast: 1.04,
    saturation: 1.02,
    vibrance: 0.14,
    temperature: -0.12,
    tint: -0.01,
    shadowTint: new THREE.Color(0.84, 0.90, 0.98),
    highlightTint: new THREE.Color(0.98, 1.00, 1.04),
    vignette: 0.18
  },
  // 4: NorCal & Marin Headlands - Golden Gate coastal air & rolling bay fog
  {
    exposure: 1.02,
    contrast: 1.06,
    saturation: 1.08,
    vibrance: 0.18,
    temperature: 0.02,
    tint: 0.01,
    shadowTint: new THREE.Color(0.85, 0.90, 0.92),
    highlightTint: new THREE.Color(1.04, 1.03, 0.98),
    vignette: 0.18
  },
  // 5: Redwood National Forest - Rich emerald shadows, lush moss, filtered sunlight
  {
    exposure: 1.02,
    contrast: 1.10,
    saturation: 1.20,
    vibrance: 0.25,
    temperature: -0.03,
    tint: -0.08,
    shadowTint: new THREE.Color(0.70, 0.88, 0.74),
    highlightTint: new THREE.Color(1.02, 1.08, 0.94),
    vignette: 0.30
  },
  // 6: Oregon Coast & Cannon Beach - Overcast rain storm, moody desaturated drama
  {
    exposure: 0.96,
    contrast: 1.04,
    saturation: 0.86,
    vibrance: 0.10,
    temperature: -0.16,
    tint: 0.02,
    shadowTint: new THREE.Color(0.75, 0.82, 0.92),
    highlightTint: new THREE.Color(0.92, 0.96, 1.02),
    vignette: 0.26
  },
  // 7: Columbia River Gorge - Crisp mountain river valley, clean greens & stone
  {
    exposure: 1.00,
    contrast: 1.08,
    saturation: 1.06,
    vibrance: 0.18,
    temperature: -0.06,
    tint: -0.02,
    shadowTint: new THREE.Color(0.78, 0.86, 0.88),
    highlightTint: new THREE.Color(0.98, 1.03, 0.98),
    vignette: 0.20
  },
  // 8: Washington & Olympic Peninsula - Cold alpine mist, glacier blues & twilight finale
  {
    exposure: 1.02,
    contrast: 1.12,
    saturation: 1.15,
    vibrance: 0.22,
    temperature: -0.08,
    tint: 0.02,
    shadowTint: new THREE.Color(0.76, 0.82, 0.96),
    highlightTint: new THREE.Color(1.02, 1.00, 1.08),
    vignette: 0.25
  },
  // 9: Cascade Alpine Pass & Rainier - Cold alpine flurries, crisp subzero blues
  {
    exposure: 1.02,
    contrast: 1.10,
    saturation: 1.05,
    vibrance: 0.18,
    temperature: -0.12,
    tint: 0.01,
    shadowTint: new THREE.Color(0.72, 0.82, 0.95),
    highlightTint: new THREE.Color(1.04, 1.02, 1.06),
    vignette: 0.22
  },
  // 10: Idaho Panhandle & Coeur d'Alene - Sapphire lake water, deep pine forest greens
  {
    exposure: 1.04,
    contrast: 1.06,
    saturation: 1.12,
    vibrance: 0.20,
    temperature: -0.04,
    tint: -0.03,
    shadowTint: new THREE.Color(0.78, 0.88, 0.92),
    highlightTint: new THREE.Color(1.02, 1.04, 0.98),
    vignette: 0.18
  },
  // 11: Montana Big Sky & Glacier - High-altitude alpine divide, cobalt skies & limestone
  {
    exposure: 1.06,
    contrast: 1.12,
    saturation: 1.14,
    vibrance: 0.22,
    temperature: -0.06,
    tint: 0.0,
    shadowTint: new THREE.Color(0.80, 0.85, 0.95),
    highlightTint: new THREE.Color(1.05, 1.02, 1.00),
    vignette: 0.20
  },
  // 12: Las Vegas Strip & Red Rock Canyon - Electrifying desert twilight, neon magenta glow & rich amber
  {
    exposure: 1.08,
    contrast: 1.15,
    saturation: 1.25,
    vibrance: 0.30,
    temperature: 0.08,
    tint: 0.06,
    shadowTint: new THREE.Color(0.68, 0.52, 0.82),
    highlightTint: new THREE.Color(1.10, 0.96, 0.82),
    vignette: 0.24
  }
];

export class PostProcessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    this.qualityMode = 'high'; // 'high' | 'balanced' | 'performance'

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
    const isWebGL2 = Boolean(this.renderer && this.renderer.capabilities && this.renderer.capabilities.isWebGL2);

    // 1. High-Performance Render Target with WebGL2 4x Hardware MSAA for razor-sharp edge definition
    const renderTarget = new THREE.WebGLRenderTarget(Math.round(width * dpr), Math.round(height * dpr), {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: isWebGL2 ? 4 : 0
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.setPixelRatio(dpr);

    // 2. Base Scene Render Pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 2b. Selective HDR Bloom Pass
    // Calibrated with HDR threshold (1.65) so sunlit daylight asphalt/terrain/fog do not wash out,
    // while high-emissive elements (matrix LEDs, lightbars, nitro plumes, heated rotors, neon signs) bloom.
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.55, // strength
      0.35, // radius
      1.65  // threshold (HDR pre-tone-map calibration)
    );
    this.composer.addPass(this.bloomPass);

    // 3. Biome Color Grading Pass
    this.colorGradePass = new ShaderPass(BiomeColorGradeShader);
    this.composer.addPass(this.colorGradePass);

    // 4. Final Output Pass (Tone Mapping & Color Space Conversion)
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // Current & Target Color Grading Interpolation State
    this.currentZoneIndex = 0;
    this.targetZoneIndex = 0;
    this.transitionProgress = 1.0;

    // Working color grading parameters (Clean, bright, neutral daylight)
    this.activeProfile = {
      exposure: 1.04,
      contrast: 1.02,
      saturation: 1.05,
      vibrance: 0.10,
      temperature: 0.0,
      tint: 0.0,
      shadowTint: new THREE.Color(1.0, 1.0, 1.0),
      highlightTint: new THREE.Color(1.0, 1.0, 1.0),
      vignette: 0.0
    };

    this.applyColorProfile(this.activeProfile);
  }

  setQualityMode(mode, isLowPower = false, isMobile = false) {
    this.qualityMode = mode;
    this.isLowPower = isLowPower;
    this.isMobile = isMobile;
    // Turbo is the default preset, so it must honor the low-power path just
    // like balanced. Lower bloom strength does not reduce the number of passes.
    if (mode === 'performance' || isMobile || (isLowPower && (mode === 'balanced' || mode === 'turbo120'))) {
      this.enabled = false;
    } else {
      this.enabled = true;
      if (this.bloomPass) {
        if (mode === 'turbo120') {
          this.bloomPass.strength = 0.25;
          this.bloomPass.radius = 0.20;
        } else if (mode === 'balanced') {
          this.bloomPass.strength = 0.35;
          this.bloomPass.radius = 0.25;
        } else {
          this.bloomPass.strength = 0.65;
          this.bloomPass.radius = 0.38;
        }
      }
    }
  }

  setZone(zoneIndex) {
    if (zoneIndex !== this.targetZoneIndex) {
      this.currentZoneIndex = this.targetZoneIndex;
      this.targetZoneIndex = Math.min(Math.max(0, zoneIndex), ZONE_COLOR_PROFILES.length - 1);
      this.transitionProgress = 0.0;
    }
  }

  update(deltaSeconds) {
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + deltaSeconds * 0.45);
      const fromProfile = ZONE_COLOR_PROFILES[this.currentZoneIndex] || ZONE_COLOR_PROFILES[0];
      const toProfile = ZONE_COLOR_PROFILES[this.targetZoneIndex] || ZONE_COLOR_PROFILES[0];
      const t = this.transitionProgress;

      this.activeProfile.exposure = THREE.MathUtils.lerp(fromProfile.exposure, toProfile.exposure, t);
      this.activeProfile.contrast = THREE.MathUtils.lerp(fromProfile.contrast, toProfile.contrast, t);
      this.activeProfile.saturation = THREE.MathUtils.lerp(fromProfile.saturation, toProfile.saturation, t);
      this.activeProfile.vibrance = THREE.MathUtils.lerp(fromProfile.vibrance, toProfile.vibrance, t);
      this.activeProfile.temperature = THREE.MathUtils.lerp(fromProfile.temperature, toProfile.temperature, t);
      this.activeProfile.tint = THREE.MathUtils.lerp(fromProfile.tint, toProfile.tint, t);
      this.activeProfile.vignette = THREE.MathUtils.lerp(fromProfile.vignette, toProfile.vignette, t);
      this.activeProfile.shadowTint.lerpColors(fromProfile.shadowTint, toProfile.shadowTint, t);
      this.activeProfile.highlightTint.lerpColors(fromProfile.highlightTint, toProfile.highlightTint, t);

      this.applyColorProfile(this.activeProfile);
    }
  }

  applyColorProfile(p) {
    const u = this.colorGradePass.uniforms;
    u.uExposure.value = p.exposure;
    u.uContrast.value = p.contrast;
    u.uSaturation.value = p.saturation;
    u.uVibrance.value = p.vibrance;
    u.uTemperature.value = p.temperature;
    u.uTint.value = p.tint;
    u.uShadowTint.value.copy(p.shadowTint);
    u.uHighlightTint.value.copy(p.highlightTint);
    u.uVignetteIntensity.value = p.vignette;
  }

  setPixelRatio(pixelRatio) {
    if (this.composer) {
      this.composer.setPixelRatio(pixelRatio);
    }
  }

  setSize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  render(deltaTime = 0.016) {
    this.update(deltaTime);
    if (this.enabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
