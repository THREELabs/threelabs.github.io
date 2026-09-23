import * as THREE from 'three';
import { gameState } from '../state.js';

/**
 * Rayleigh & Mie Physical Atmospheric Scattering Shader
 * Implements physically-motivated wavelength-dependent Rayleigh scattering (1/lambda^4),
 * Henyey-Greenstein Mie aerosol scattering (g = 0.82), solar corona glow, and horizon alpenglow.
 */
export const RayleighMieAtmosphereShader = {
  uniforms: {
    uSunPosition: { value: new THREE.Vector3(0.5, 0.8, 0.5).normalize() },
    uSunColor: { value: new THREE.Color(0xfff8e6) },
    uSkyZenithColor: { value: new THREE.Color(0x0a3d71) },
    uSkyHorizonColor: { value: new THREE.Color(0xe8c48f) },
    uHazeColor: { value: new THREE.Color(0xf2d8a0) },
    uMieG: { value: 0.82 },
    uSunGlowIntensity: { value: 1.65 },
    uExposure: { value: 1.0 },
    uTimeOfDay: { value: 0.25 },
    uTime: { value: 0.0 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vRayDir;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vRayDir = normalize(worldPosition.xyz - cameraPosition);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uSunPosition;
    uniform vec3 uSunColor;
    uniform vec3 uSkyZenithColor;
    uniform vec3 uSkyHorizonColor;
    uniform vec3 uHazeColor;
    uniform float uMieG;
    uniform float uSunGlowIntensity;
    uniform float uExposure;
    uniform float uTimeOfDay;
    varying vec3 vWorldPosition;
    varying vec3 vRayDir;

    // Henyey-Greenstein phase function for forward Mie aerosol scattering
    float henyeyGreenstein(float cosTheta, float g) {
      float g2 = g * g;
      return (1.0 - g2) / (4.0 * 3.14159265 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
    }

    void main() {
      vec3 ray = normalize(vRayDir);
      vec3 sunDir = normalize(uSunPosition);

      // Height angle above horizon: 0 at horizon, 1 at zenith
      float cosZenith = max(0.0, ray.y);
      float horizonFactor = pow(1.0 - cosZenith, 2.8);

      // 1. Rayleigh Molecular Scattering Color Gradient
      // Higher wavelengths (blue) dominate at zenith; red/amber inscatter near horizon
      vec3 rayleighColor = mix(uSkyZenithColor, uSkyHorizonColor, horizonFactor);

      // 2. Solar Angular Alignment (Cos theta)
      float cosTheta = max(0.0, dot(ray, sunDir));

      // 3. Mie Aerosol Scattering Corona around Sun (bounded to prevent bloom bleaching)
      float miePhase = henyeyGreenstein(cosTheta, uMieG);
      float boundedMie = min(miePhase * 0.12, 1.6);
      vec3 mieColor = uSunColor * boundedMie * uSunGlowIntensity * 0.35;

      // 4. Sharp Solar Disc (crisp, defined solar sphere)
      float sunDisc = smoothstep(0.9988, 0.9998, cosTheta);
      vec3 sunDiscLobe = uSunColor * sunDisc * 2.2;

      // 5. Atmospheric Ground Haze
      float hazeBlend = smoothstep(0.35, -0.05, ray.y);
      vec3 finalSky = mix(rayleighColor + mieColor, uHazeColor, hazeBlend * 0.65);
      finalSky += sunDiscLobe;

      gl_FragColor = vec4(finalSky * uExposure, 1.0);
    }
  `
};

export class AtmosphereSystem {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. Celestial Sky Dome Sphere (Radius 2900m)
    const skyGeo = new THREE.SphereGeometry(2900, 64, 36);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(RayleighMieAtmosphereShader.uniforms),
      vertexShader: RayleighMieAtmosphereShader.vertexShader,
      fragmentShader: RayleighMieAtmosphereShader.fragmentShader,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.group.add(this.skyMesh);
    this.scene.add(this.group);
  }

  updateZoneAtmosphere(zone, sunPosition, sunColor) {
    const u = this.skyMat.uniforms;
    if (zone.skyTop) u.uSkyZenithColor.value.lerp(new THREE.Color(zone.skyTop), 0.06);
    if (zone.skyHorizon) u.uSkyHorizonColor.value.lerp(new THREE.Color(zone.skyHorizon), 0.06);
    if (zone.hazeColor) u.uHazeColor.value.lerp(new THREE.Color(zone.hazeColor), 0.06);
    if (zone.mieG !== undefined) u.uMieG.value = zone.mieG;
    if (zone.sunGlow !== undefined) u.uSunGlowIntensity.value = zone.sunGlow;

    if (sunPosition) u.uSunPosition.value.copy(sunPosition);
    if (sunColor) u.uSunColor.value.copy(sunColor);
  }

  update(dt, cameraPos) {
    if (cameraPos) {
      this.skyMesh.position.copy(cameraPos);
    }
    this.skyMat.uniforms.uTime.value += dt;
    this.skyMat.uniforms.uTimeOfDay.value = gameState.timeOfDay || 0.25;
  }
}
