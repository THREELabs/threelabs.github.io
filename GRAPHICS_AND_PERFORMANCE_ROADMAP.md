# Dreamstate Highway — Graphics & Performance Engineering Roadmap

This document outlines the architectural roadmap for maximizing visual fidelity and achieving sustained 60 FPS on both desktop and mobile/integrated hardware for **Dreamstate Highway / Baja Racer**.

---

## 1. Engine & Runtime Performance (FPS)

### 1.1 Terrain Spatial Chunking & Distance Culling (High Impact)
* **Diagnosis**: The terrain was historically instantiated as a monolithic 23,600m plane with 144,000 quads (~288,000 vertices). Because its bounding box enclosed the entire highway, Three.js frustum culling could never discard it, forcing the GPU to process off-screen geometry.
* **Architecture**:
  * Partition the continuous highway terrain into **1,000m spatial chunks** matching regional zones.
  * Dynamically toggle `chunk.visible` based on vehicle distance (`playerZ`), keeping only immediate forward and backward chunks active (~2,000m visible radius).
  * Drastically slashes vertex pipeline load, memory bus bandwidth, and transform overhead by **80–90%**.

### 1.2 Repeated Roadside Props Instancing (`THREE.InstancedMesh`)
* **Diagnosis**: Repeated props (guardrail posts, road delineator retroreflectors, road studs, Joshua trees, coastal boulders) previously generated separate meshes or merged geometries.
* **Architecture**:
  * Utilize `THREE.InstancedMesh` for repeated roadside elements with uniform or palette-varied instances.
  * Retains a single draw call per prop type across entire 500m–1000m stretches.

### 1.3 Contact Ambient Occlusion Ground Disc
* **Diagnosis**: Dynamic directional shadow maps require frequent buffer re-renders and PCF filtering, which creates GPU fill-rate strain on integrated GPUs and mobile.
* **Architecture**:
  * Provide an authored soft-edged contact shadow / AO quad directly underneath the vehicle chassis.
  * Dynamically scale opacity and footprint based on suspension heave, pitch, and roll.
  * Allows disabling or heavily throttling directional shadow map updates on `balanced` and `performance` presets without the vehicle appearing ungrounded.

### 1.4 Downsampled Post-Processing Pipeline
* **Architecture**:
  * Allocate intermediate post-processing buffers at **0.75x–0.5x resolution** on mobile/low-power profiles.
  * Reduces fragment shader invocations on full-screen passes (bloom blur pyramids, color grading, tone mapping) by up to 75%.

---

## 2. Visuals & Graphics Fidelity

### 2.1 Selective HDR Bloom & Neon Atmosphere
* **Architecture**:
  * Integrate an optimized `UnrealBloomPass` with high luminance thresholding into `PostProcessingManager`.
  * **Emissive Hierarchy**:
    1. **Porsche Full-Width Lightbar & Matrix LED Quad Lights**: Arcade-glow signature silhouette.
    2. **Exhaust Nitro Afterburners & Backfire**: Intense neon cyan/violet bursts during boost.
    3. **Roadside Landmarks & Route 66 Signs**: Vintage neon signs (Roy's Motel, Wigwam Village, diner signs) pop against twilight/night skies.
    4. **Brake Rotor Thermal Radiation**: High-speed brake glow.

### 2.2 Dynamic Brake Rotor Incandescence
* **Architecture**:
  * Carbon-ceramic brake rotors track thermal state in `SportsCar.js`.
  * Heavy braking from high speeds (>100 MPH) rapidly raises disc temperature, driving an emissive orange/red incandescence shader on `matBrakeRotor` that naturally cools off via convection.

### 2.3 Dynamic Road Wetness & Specular Sheen
* **Architecture**:
  * Wire `gameState.rainIntensity` directly into the road surface shader.
  * Modulates asphalt roughness, specular reflectivity, and puddle normal perturbations during rain showers.

### 2.4 Drifting Rubber Skid Marks
* **Architecture**:
  * Continuous circular buffer stamping dark rubber tire track decals onto the road surface during hard cornering and handbrake slides.

### 2.5 Horizon Aerial Perspective & Sun Glare
* **Architecture**:
  * Multi-gradient horizon haze blending into regional biomes (Mojave desert heat shimmer, Big Sur sea fog, Columbia Gorge river mist).
  * Camera speed-line streaks at super-high velocity (>190 MPH with Nitro).

---

## 3. Implementation Phasing

| Phase | System | Target Metric |
| :--- | :--- | :--- |
| **Phase 1** | Terrain 1000m Spatial Chunking & Distance Culling | +15–25 FPS, 85% vertex reduction |
| **Phase 2** | Selective HDR Bloom Pass (`UnrealBloomPass`) | High visual impact, neon glow |
| **Phase 3** | Vehicle Dynamic Brake Rotor Thermal Glow | Interactive physical feedback |
| **Phase 4** | Dynamic Road Wetness & Weather Response | Atmospheric immersion |
| **Phase 5** | Prop Instancing & Contact Shadow System | Low-end hardware optimization |
