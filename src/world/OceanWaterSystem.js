import * as THREE from 'three';

/**
 * Ocean Optics & Gerstner Wave Shader
 * Implements multi-frequency analytic wave displacement, side-aware Fresnel,
 * sun glint specular highlights, Beer-Lambert depth absorption, and crest foam.
 */
export const OceanOpticsShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uDeepColor: { value: new THREE.Color(0x062846) },
    uShallowColor: { value: new THREE.Color(0x14a0c8) },
    uSkyColor: { value: new THREE.Color(0x7cc4e8) },
    uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.5).normalize() },
    uSunColor: { value: new THREE.Color(0xfff8e6) },
    uFoamColor: { value: new THREE.Color(0xffffff) },
    uWaveSteepness: { value: 0.38 },
    uWaveSpeed: { value: 0.65 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uWaveSteepness;
    uniform float uWaveSpeed;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vCrestFoam;

    // Gerstner wave harmonic calculation
    vec3 calculateGerstnerWave(vec4 wave, vec3 pos, inout vec3 tangent, inout vec3 binormal, out float crestFactor) {
      // wave: (dirX, dirZ, steepness, wavelength)
      float steepness = wave.z * uWaveSteepness;
      float wavelength = wave.w;
      float k = 2.0 * 3.14159265 / wavelength;
      float c = sqrt(9.8 / k) * uWaveSpeed;
      vec2 d = normalize(wave.xy);
      float f = k * (dot(d, pos.xz) - c * uTime);
      float a = steepness / k;

      tangent += vec3(
        -d.x * d.x * (steepness * sin(f)),
        d.x * (steepness * cos(f)),
        -d.x * d.y * (steepness * sin(f))
      );
      binormal += vec3(
        -d.x * d.y * (steepness * sin(f)),
        d.y * (steepness * cos(f)),
        -d.y * d.y * (steepness * sin(f))
      );

      // Height displacement
      float h = a * sin(f);
      crestFactor = max(0.0, sin(f) - 0.45) * 1.8;

      return vec3(
        d.x * (a * cos(f)),
        h,
        d.y * (a * cos(f))
      );
    }

    void main() {
      vUv = uv;
      vec3 gridPos = position;

      vec3 tangent = vec3(1.0, 0.0, 0.0);
      vec3 binormal = vec3(0.0, 0.0, 1.0);
      vec3 displacedPos = gridPos;
      float totalCrest = 0.0;

      // 4 Authored Gerstner Ocean Wave Trains (Pacific swell + coastal chop)
      vec4 w1 = vec4( 0.85,  0.52, 0.28, 48.0); // Primary deep-water Pacific swell
      vec4 w2 = vec4( 0.35,  0.93, 0.22, 26.0); // Secondary cross-swell
      vec4 w3 = vec4(-0.60,  0.80, 0.16, 14.0); // Nearshore breaker harmonic
      vec4 w4 = vec4( 0.95, -0.31, 0.10,  7.5); // Capillary surface chop

      float c1 = 0.0, c2 = 0.0, c3 = 0.0, c4 = 0.0;
      displacedPos += calculateGerstnerWave(w1, gridPos, tangent, binormal, c1);
      displacedPos += calculateGerstnerWave(w2, gridPos, tangent, binormal, c2);
      displacedPos += calculateGerstnerWave(w3, gridPos, tangent, binormal, c3);
      displacedPos += calculateGerstnerWave(w4, gridPos, tangent, binormal, c4);

      totalCrest = (c1 * 0.4 + c2 * 0.3 + c3 * 0.2 + c4 * 0.1);
      vCrestFoam = clamp(totalCrest, 0.0, 1.0);

      // Analytic normal from cross product of wave tangents
      vec3 normal = normalize(cross(binormal, tangent));
      vNormal = normalize(mat3(modelMatrix) * normal);

      vec4 worldPosition = modelMatrix * vec4(displacedPos, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uDeepColor;
    uniform vec3 uShallowColor;
    uniform vec3 uSkyColor;
    uniform vec3 uSunDirection;
    uniform vec3 uSunColor;
    uniform vec3 uFoamColor;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vCrestFoam;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      // 1. Schlick Fresnel Approximation
      float NdotV = max(0.0, dot(normal, viewDir));
      float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 4.5);

      // 2. Sun Specular Glint (Blinn-Phong / GGX reflection lobe)
      vec3 halfDir = normalize(uSunDirection + viewDir);
      float NdotH = max(0.0, dot(normal, halfDir));
      float specular = pow(NdotH, 128.0) * 1.85;
      vec3 sunSpecular = uSunColor * specular;

      // 3. Depth-Based Water Color Gradient (Beer-Lambert Approximation)
      // Shoreline proximity derived from coordinates
      float shoreDistance = smoothstep(-75.0, -180.0, vWorldPosition.x);
      vec3 waterBodyColor = mix(uShallowColor, uDeepColor, shoreDistance);

      // 4. Sky Reflection Composition
      vec3 surfaceColor = mix(waterBodyColor, uSkyColor, fresnel * 0.65);

      // 5. Sun Glint and Crest Scatter
      surfaceColor += sunSpecular;

      // 6. Whitecap Crest Foam Composition
      float foamPattern = vCrestFoam * (0.65 + 0.35 * sin(vWorldPosition.z * 0.4 + vWorldPosition.x * 0.2));
      surfaceColor = mix(surfaceColor, uFoamColor, smoothstep(0.40, 0.75, foamPattern));

      gl_FragColor = vec4(surfaceColor, 0.92);
    }
  `
};

export class OceanWaterManager {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. Initialize Ocean Shader Material
    this.oceanMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(OceanOpticsShader.uniforms),
      vertexShader: OceanOpticsShader.vertexShader,
      fragmentShader: OceanOpticsShader.fragmentShader,
      transparent: true,
      side: THREE.FrontSide
    });

    // Initial palette targets
    this.targetDeepColor = new THREE.Color(0x062846);
    this.targetShallowColor = new THREE.Color(0x14a0c8);

    // 2. Build Multi-Grid Coastal Ocean Geometries
    this.buildOceanSurfaces();
    this.scene.add(this.group);
  }

  buildOceanSurfaces() {
    // A. Main Pacific Coast High-Resolution Shore Water (22,000m length, dense vertex grid for Gerstner waves)
    const oceanGeo = new THREE.PlaneGeometry(1200, 22000, 64, 280);
    oceanGeo.rotateX(-Math.PI * 0.5);
    oceanGeo.translate(-580, -0.05, 12500);

    this.oceanMesh = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.oceanMesh.receiveShadow = true;
    this.group.add(this.oceanMesh);

    // B. San Francisco Bay & Golden Gate Strait Channel Water (Z: 11,350m - 12,050m)
    const sfBayGeo = new THREE.PlaneGeometry(900, 700, 36, 36);
    sfBayGeo.rotateX(-Math.PI * 0.5);
    sfBayGeo.translate(200, -0.05, 11700);

    const sfBayMesh = new THREE.Mesh(sfBayGeo, this.oceanMat);
    sfBayMesh.receiveShadow = true;
    this.group.add(sfBayMesh);

    // C. Columbia River Gorge Water Body (Z: 18,200m - 20,800m)
    const riverGeo = new THREE.PlaneGeometry(450, 2600, 24, 72);
    riverGeo.rotateX(-Math.PI * 0.5);
    riverGeo.translate(-220, -0.05, 19500);

    const riverMesh = new THREE.Mesh(riverGeo, this.oceanMat);
    riverMesh.receiveShadow = true;
    this.group.add(riverMesh);

    // D. Dynamic Coastal Shoreline Surf Foam Ribbon
    const surfGeo = new THREE.PlaneGeometry(28, 22000, 2, 200);
    surfGeo.rotateX(-Math.PI * 0.5);
    surfGeo.translate(-38, 0.08, 12500);

    this.matSurfFoam = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    this.surfFoamMesh = new THREE.Mesh(surfGeo, this.matSurfFoam);
    this.group.add(this.surfFoamMesh);
  }

  updateZonePalette(zone) {
    // 10-Zone Pacific Coast Water Color Grading
    const zoneWaterPalettes = [
      { deep: 0x0a2238, shallow: 0x186884 }, // 0: Mojave (distant basin)
      { deep: 0x004e75, shallow: 0x00c4e8 }, // 1: Malibu (tropical Pacific turquoise)
      { deep: 0x064268, shallow: 0x1aa8d4 }, // 2: Santa Barbara (coastal azure)
      { deep: 0x083658, shallow: 0x128eb5 }, // 3: Big Sur (deep sapphire & alpenglow)
      { deep: 0x0a3248, shallow: 0x1a7288 }, // 4: Monterey Bay (cool oceanic teal)
      { deep: 0x0c3c34, shallow: 0x188a70 }, // 5: Redwood National Forest (emerald ocean)
      { deep: 0x0e2838, shallow: 0x1e5a70 }, // 6: Oregon Coast (stormy slate blue)
      { deep: 0x08343c, shallow: 0x1e828a }, // 7: Columbia River Gorge (alpine river teal)
      { deep: 0x0a2638, shallow: 0x185670 }, // 8: Washington Cascades (cold fjord blue)
      { deep: 0x061e34, shallow: 0x124868 }  // 9: Olympic Peninsula (deep twilight blue)
    ];

    const p = zoneWaterPalettes[zone.id] || zoneWaterPalettes[1];
    this.targetDeepColor = new THREE.Color(p.deep);
    this.targetShallowColor = new THREE.Color(p.shallow);

    if (zone.skyTop) {
      this.oceanMat.uniforms.uSkyColor.value.lerp(new THREE.Color(zone.skyTop), 0.08);
    }
    if (zone.sunColor) {
      this.oceanMat.uniforms.uSunColor.value.lerp(new THREE.Color(zone.sunColor), 0.08);
    }
  }

  update(dt) {
    if (!this.oceanMat) return;

    // Advance wave animation time
    this.oceanMat.uniforms.uTime.value += dt;

    // Smooth color transitions between biomes
    this.oceanMat.uniforms.uDeepColor.value.lerp(this.targetDeepColor, 0.04);
    this.oceanMat.uniforms.uShallowColor.value.lerp(this.targetShallowColor, 0.04);

    // Dynamic coastal breaker foam rhythm
    if (this.surfFoamMesh) {
      const t = this.oceanMat.uniforms.uTime.value;
      const waveOffset = Math.sin(t * 0.95) * 3.5;
      this.surfFoamMesh.position.x = waveOffset;
      this.matSurfFoam.opacity = 0.50 + Math.sin(t * 0.95) * 0.28;
    }
  }
}
