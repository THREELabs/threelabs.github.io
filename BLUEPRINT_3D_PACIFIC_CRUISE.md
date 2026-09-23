# Pacific Coast Cruise & Rush (3D Cel-Shaded Blueprint)

> **Branch:** `Google3D`  
> **Aesthetic:** Stylized Cel-Shaded / Toon-Shaded (*Auto Modellista* × *Art of Rally* × *The Witness*)  
> **Core Gameplay:** Scenic West Coast Road Trip Exploration + High-Speed Arcade Highway Racing  
> **Tech Stack:** Three.js (r160+ / WebGL2), Vite, Rapier.js 3D Physics (Raycast Vehicle)

---

## 1. Vision & Gameplay Duality

The game seamlessly combines two complementary experiences:

1. **The Chill Scenic Cruise (Free Drive & Exploration):**
   - Cruise along the Pacific West Coast across 9 iconic, continuous regional zones.
   - Switch freely between **Cockpit / First-Person View** (working rearview mirrors, dashboard speedometer/tachometer, steering wheel, windshield rain streaks) and **3rd-Person Dynamic / Cinematic Orbit Cam**.
   - Pull over at scenic lookouts, coastal turnouts, Route 66 diners, and gas stations.
   - Interactive landmark discovery prompts, photo mode (`P` key) with free camera controls and postcard saving.
   - Dynamic day/night cycle, atmospheric lighting (god rays, heat mirages, lighthouse beams, aurora borealis), and multi-station in-car radio.

2. **The Highway Rush & Street Racer (Optional Action):**
   - Full throttle with Nitro / Turbo boost and engine heat management.
   - Weave through civilian highway traffic with near-miss scoring and slipstream drafting.
   - Regional Highway Patrol police forces (CHP, Sheriff, OSP, WSP) with escalating Heat Levels (1–4 Stars), roadblocks, and pursuits.
   - Speed traps, sector time trials, and leaderboard progression.

---

## 2. Visual Style: Cel-Shading & Art Direction

- **Toon Lighting (`THREE.MeshToonMaterial`):** Discrete 3-tone lighting bands for vehicles, rock formations, and architectural landmarks using custom gradient ramp textures.
- **Inverted-Hull / Post-Processing Outlines:** Crisp comic/anime-style black ink outlines around vehicles and landmark silhouettes.
- **Atmospheric Palette Transitions:** Dynamic horizon fog, sun god rays in the desert, sea haze along Big Sur, waterfall mist in the Columbia Gorge, and night aurora borealis in Washington.
- **Lightweight Low-Poly Geometry:** Optimized GLTF meshes for landmarks and vehicles, ensuring ultra-smooth 60–120 FPS across mobile and desktop.

---

## 3. The 9 Regional Zones & Iconic 3D Landmarks

1. **Zone 0: SoCal Desert & Mojave**
   - *Atmosphere:* Amber god rays, heat shimmer mirage, saguaro/Joshua tree flora, warm gold lighting.
   - *Landmarks:* Route 66 Diner, Cabazon Dinosaurs, Palm Springs Mid-Century Estate, Roy's Motel Neon Sign, Salvation Mountain, Mojave Wind Turbines.
2. **Zone 1: Malibu & Pacific Coast Highway (PCH)**
   - *Atmosphere:* Ocean coastline on the left, fan palms on the right, golden hour water reflections.
   - *Landmarks:* Santa Monica Pier & Pacific Wheel, Malibu Pier, Point Mugu Rock arch, Venice Muscle Beach, Lifeguard Towers.
3. **Zone 2: Big Sur Highway 1**
   - *Atmosphere:* High cliff drops, coastal cypress, moody sea fog, dramatic switchback elevation.
   - *Landmarks:* Bixby Creek Bridge (drive over the high arch!), McWay Falls cove, Pfeiffer Keyhole Arch, Point Sur Lighthouse with rotating beacon beam.
4. **Zone 3: Monterey Coast & Carmel**
   - *Atmosphere:* Rolling green headlands, Monterey pines, rocky tidepools.
   - *Landmarks:* Cannery Row, Monterey Bay Aquarium complex, Lone Cypress, Carmel Mission, Silicon Valley ring campus.
5. **Zone 4: Northern California & Marin**
   - *Atmosphere:* Heavy marine fog, rolling golden/green hills, eucalyptus and vineyards.
   - *Landmarks:* Golden Gate Bridge Art Deco Towers (drive through the cables!), SF Cable Cars & Painted Ladies, Sonoma Mission, Bodega Bay Church.
6. **Zone 5: Redwood Forest (Avenue of the Giants)**
   - *Atmosphere:* Massive cathedral canopy, sunbeams filtering through giant redwood trunks, sword fern carpets.
   - *Landmarks:* Chandelier Drive-Thru Tree (drive your vehicle through the trunk!), Carson Mansion Eureka, Bigfoot Roadside Museum, Redwood Covered Bridge.
7. **Zone 6: Oregon Coast & Cannon Beach**
   - *Atmosphere:* Moody overcast skies, dark basalt cliffs, Sitka spruce, rain squalls, offshore sea stacks.
   - *Landmarks:* Haystack Rock & Needles at Cannon Beach, Tillamook Cheese Barn & Creamery, Yaquina Head Lighthouse.
8. **Zone 7: Columbia River Gorge**
   - *Atmosphere:* Wide river canyon walls, basalt colonnades, drifting waterfall mist, rushing water acoustics.
   - *Landmarks:* Multnomah Falls with Benson Footbridge, Vista House on Crown Point, Bridge of the Gods truss bridge, Bonneville Dam, Mount Hood Overlook.
9. **Zone 8: Washington Cascades & Olympic Peninsula**
   - *Atmosphere:* Evergreen forests, snow-capped peaks, night Aurora Borealis / Northern Lights, coastal rain.
   - *Landmarks:* Seattle Space Needle & Mount Rainier backdrop, Pike Place Market Neon Sign, Washington State Jumbo Ferry crossing the sound, Snoqualmie Falls & Timber Lodge.

---

## 4. Architecture & Module Structure

```text
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                  # Game loop, lifecycle & mode switching
│   ├── state.js                 # Global state (position, speed, heat, mode)
│   ├── constants.js              # Zone definitions, palettes, physics constants
│   ├── engine/
│   │   ├── Renderer.js          # Three.js WebGL renderer, cel-shading & post-processing
│   │   ├── Physics.js           # Rapier.js 3D physics & Raycast Vehicle controller
│   │   ├── CameraManager.js     # Cockpit, Chase, Hood, and Photo Orbit cameras
│   │   └── Input.js             # Keyboard, Gamepad, Touch controls
│   ├── world/
│   │   ├── SplineRoad.js        # 3D Spline road generator (lanes, rumbles, curbs, tunnels, bridges)
│   │   ├── TerrainChunk.js      # Low-poly chunked terrain conforming to road elevation
│   │   ├── ZoneManager.js       # Dynamic zone streaming, palette & fog interpolation
│   │   ├── Environment.js       # Sun/Moon orbital lighting, clouds, weather particles
│   │   ├── LandmarkLoader.js    # 3D Cel-shaded landmark & prop placement
│   │   └── TrafficManager.js    # Civilian traffic AI & Highway Patrol police
│   ├── vehicles/
│   │   ├── TrophyTruck.js       # Player vehicle model, suspension rig, wheel animations
│   │   ├── CockpitView.js       # Interior dashboard, working needles/screens, mirrors
│   │   └── PoliceInterceptor.js # Pursuit AI, regional liveries & flashing lightbars
│   ├── audio/
│   │   ├── SoundEngine.js       # Procedural engine pitch, tire screech, turbo blow-off
│   │   └── RadioPlayer.js       # Multi-station in-car radio (Synthwave, Lo-Fi, Rock, Ambient)
│   ├── ui/
│   │   ├── HUD.js               # Speedometer, Nitro/Heat gauge, Zone tracker, Compass
│   │   ├── ScenicOverlay.js     # Landmark discovery toast, lookout prompt, Photo Mode UI
│   │   └── PauseMenu.js         # Settings, Radio selector, Camera mode, Save ladder
│   └── utils/
│       └── Storage.js           # LocalStorage persistence (odometer, discovered landmarks, best times)
```

---

## 5. Development Roadmap

1. **Milestone 1 — 3D Sandbox & Cel-Shaded Vehicle Physics:**
   - Scaffold Vite + Three.js + Rapier.js.
   - Build Cel-Shaded Trophy Truck with Raycast suspension (independent front, 4-link rear, body roll).
   - Implement First-Person Cockpit View and Third-Person Chase Cam.
2. **Milestone 2 — 3D Spline Road & Terrain Generator:**
   - Implement 3D Bézier spline highway with banking, elevation changes, bridges, and tunnels.
   - Add roadside turnouts and scenic overlook parking areas.
3. **Milestone 3 — 9 Zones & Dynamic Environment:**
   - Stream the 9 West Coast regions with dynamic sky/fog/lighting interpolation.
   - Day/night cycle with sun, moon, stars, headlights, and regional weather.
4. **Milestone 4 — 3D Landmarks, Discoveries & Photo Mode:**
   - Place low-poly cel-shaded landmarks across all 9 zones.
   - Add discovery popups and interactive Photo Mode (`P` key).
5. **Milestone 5 — Highway Traffic, Police Pursuits & Audio Polish:**
   - Add civilian traffic and regional police with 1–4 Star Heat pursuit escalation.
   - Integrate procedural engine audio and multi-station radio player.
