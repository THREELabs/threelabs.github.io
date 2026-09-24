# 🏎️ Dreamstate Highway

[![Three.js](https://img.shields.io/badge/Three.js-r185-black?style=flat&logo=three.js)](https://threejs.org/)
[![Rapier3D](https://img.shields.io/badge/Rapier-3D_Physics-orange?style=flat)](https://rapier.rs/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/)
[![Community Driven](https://img.shields.io/badge/Community--Driven-Open_to_All-00C853?style=flat&logo=github)](https://github.com/)
[![Open Game](https://img.shields.io/badge/Game-Open_World_Expansion-purple.svg)](AUTONOMOUS_ZONE_EXPANSION_PLAYBOOK.md)

> 🤝 **A Community-Driven Game — Open to All to Expand On!**  
> Dreamstate Highway is a 100% open, community-driven game built by and for the developer and gaming community. **All developers, 3D artists, and enthusiasts of any skill level are welcome!** Whether you want to pave a brand-new zone, build custom vehicle models, tweak physics, compose generative audio, or polish the engine — this project is open to all to expand on.

**Dreamstate Highway** (formerly *Baja Racer*) is an open-world, 3D stylized WebGL road-trip simulator and arcade driving game built with **Three.js**, **Rapier 3D**, and the **Web Audio API**. Cruise an expansive, cel-shaded West Coast & Southwest highway corridor spanning **33.8 continuous kilometers** — from the sun-baked Mojave Desert through the soaring peaks of Montana's Glacier National Park and the electrifying neon oasis of the Las Vegas Strip to the dramatic sandstone canyons of Red Rock.

Soak in scenic vistas, pull over into roadside turnouts, view landmarks through coin-operated binoculars, and read historical lore plaques. Or drop the hammer: unleash nitro, power-slide around coastal switchbacks, dodge civilian highway traffic, and outrun Highway Patrol radar speed traps.

---

> 🌟 **v2.0 Overhaul:** Rebuilt from the ground up in true 3D (Three.js + Rapier physics), replacing the retro pseudo-3D engine. Now featuring a **13-zone continuous highway corridor (33,800 meters)**, dynamic day/night cycles, interactive narrative vignettes, weather-affected tire grip, procedural engine audio synthesis, photo mode, and responsive multi-touch mobile controls.

---

## 🗺️ The 13 Zones (Pacific Coast → Northern Rockies → Southwest Red Rock Corridor)

Drive through 13 distinct, fully realized biomes covering **33,800 meters** of continuous highway, each with unique color grading, atmospheric haze, custom flora, dynamic weather, and iconic landmarks:

| # | Distance | Zone | Environment & Weather | Iconic Landmarks & Highlights |
|---|:---:|------|----------------------|-------------------------------|
| **0** | `0 – 2,600m` | **SoCal Desert & Mojave** | ☀️ 104°F • Hot & dry • Heat shimmer | Route 66 Diner, Cabazon Dinosaurs, wind turbine farms, sandstone mesas |
| **1** | `2,600 – 5,200m` | **Malibu & Pacific Coast Highway** | 🌊 75°F • Coastal breeze • 100% grip | Santa Monica Pier & Ferris wheel, lifeguard towers, Point Mugu Rock |
| **2** | `5,200 – 7,800m` | **Big Sur Highway 1** | 🌫️ 66°F • Ocean mist • 94% grip | Bixby Creek Arch Bridge, Point Sur Lighthouse, McWay Falls |
| **3** | `7,800 – 10,400m` | **Monterey Bay & Carmel** | 🌤️ 62°F • Mild & crisp • 98% grip | The Lone Cypress, Cannery Row, 17-Mile Drive, rocky tidepools |
| **4** | `10,400 – 13,000m` | **Northern California & Marin** | ☀️ 64°F • Sunny valleys • 96% grip | Golden Gate suspension towers, Marin Headlands bunkers, rolling wine country |
| **5** | `13,000 – 15,600m` | **Redwood Forest** | 🌲 58°F • Canopy shade • Engine cooling boost | Avenue of the Giants, Chandelier Drive-Thru Tree, ancient cathedral redwoods |
| **6** | `15,600 – 18,200m` | **Oregon Coast** | 🌧️ 55°F • Pacific rain • Slick 84% grip | Haystack Rock sea stacks, Yaquina Head Lighthouse, coastal tideflats |
| **7** | `18,200 – 20,800m` | **Columbia River Gorge** | 💨 60°F • River gusts 45 MPH • Wind pull | Multnomah Falls & Benson Bridge, Crown Point Vista House overlook |
| **8** | `20,800 – 23,400m` | **Washington & Puget Sound** | ❄️ 26°F • Alpine snowfall • 70% grip | Space Needle silhouette, Pike Place Market neon, Seattle waterfront ferry dock |
| **9** | `23,400 – 26,000m` | **Cascade Alpine Pass & Mount Rainier** | ❄️ 34°F • Alpine flurries • 82% grip | Mount Rainier summit, Paradise Valley, concrete avalanche snow sheds |
| **10** | `26,000 – 28,600m` | **Idaho Panhandle & Lake Coeur d'Alene** | 🌲 62°F • Clear mountain air • 95% grip | Lake Coeur d'Alene Floating Boardwalk, Cataldo Old Mission (1853), Silver Valley Mine Headframe |
| **11** | `28,600 – 31,200m` | **Montana Big Sky & Glacier** | 🏔️ 48°F • Continental Divide • 92% grip | Lake McDonald Historic Cedar Lodge & Colored Pebbles, The Weeping Wall & Triple Stone Arches, Logan Pass Continental Divide (6,646 ft) |
| **12** | `31,200 – 33,800m` | **Las Vegas Strip & Red Rock Canyon** | 🎰 88°F • Neon desert twilight • 100% grip | Welcome to Fabulous Las Vegas Googie Neon Sign, The Strip: Luxor Obsidian Glass Pyramid & Bellagio Dancing Fountains, Red Rock Canyon Aztec Sandstone Escarpment & Calico Hills Overlook |

---

## ⚡ Core Features

- **True 3D Cel-Shaded Aesthetics** — Built with Three.js (WebGL2) using `MeshToonMaterial` and hardware gradient maps for a vibrant anime/graphic-novel aesthetic, dynamic sun and moon orbital arcs, starry night skies, and alpenglow.
- **Rapier 3D Vehicle Dynamics** — Raycast vehicle controller with tuned multi-link suspension springs, tire slip curves, aerodynamic downforce, drifting, and high-velocity nitrous injection.
- **Atmospheric Weather & Road Grip** — Realistic microclimates across zones: desert heat distortion, heavy ocean mist, torrential rain with roostertail spray (lowered grip), high gorge crosswinds pulling the vehicle, and alpine snowfall/ice.
- **Interactive Scenic Turnouts & Overlooks** — Pull into paved highway lookouts, interact with coin-operated viewfinders/telescopes with dynamic camera zoom, inspect historical kiosks with rich regional lore, and capture collectible canvas postcards.
- **Narrative Cinematic Vignettes** — Player-triggered, interactive cinematic sequences throughout the highway (Mojave mob drop-offs, Big Sur lighthouse ghosts, bootlegger train switchers, Cold War radar intercepts, and glacial avalanches).
- **Living Traffic & Highway Patrol** — Civilian AI cruising the lanes (sedans, trucks, muscle cars); Highway Patrol units equipped with radar speed traps and escalating 1–4★ pursuit heat levels with flashing lightbars and two-tone sirens.
- **100% Procedural Web Audio Engine** — Zero external audio downloads needed for the engine voice. Fully synthesized Porsche flat-6 boxer engine (intake growl, turbo spool, blow-off valve flutter, tire skid screech), procedural wind/weather audio, and 3 generative radio stations (Synthwave, Lo-Fi, Drive Rock).
- **In-Dash Tablet & Photo Mode** — Freeze time, pan and orbit the camera, adjust field-of-view, and capture postcard screenshots (`P` then `Enter`).
- **Responsive Controls** — Seamless support for keyboard/gamepad on desktop as well as touch-screen mobile devices (virtual analog d-pad, gas, brake, nitro, drift buttons, and safe-area HUD).

---

## 🌐 A Community-Driven Game — Open to All to Expand On!

**Dreamstate Highway is a community-driven game open to everyone.** We believe the best road-trip experience is one built collaboratively by a passionate community of developers, 3D artists, game designers, sound engineers, and players from around the world.

> 💡 **All Developers Are Welcome!**  
> Whether you are an experienced Three.js/WebGL engineer or a beginner looking to make your first open-source contribution, your ideas, code, and creativity have a home here. We actively support and encourage contributors at every level.

### Ways You Can Contribute & Expand the Game

You don't need to build an entire region from scratch to get involved! Here are just a few ways developers and creators can contribute:

- 🛣️ **Add New Highway Zones:** Pave iconic routes like Route 66 through Arizona and New Mexico, the Rocky Mountain High Pass, the Blue Ridge Parkway, the Overseas Highway (US-1 to Key West), or international dream roads (Amalfi Coast, Japanese Touge passes, Australian Great Ocean Road).
- 🏎️ **Vehicle Models & Liveries:** Author low-poly / cel-shaded sports cars, classic muscle cars, vintage pickup trucks, camper vans, or custom paint liveries.
- ⚙️ **Physics & Vehicle Dynamics:** Tune tire grip models, weight transfer, drift initiations, suspension spring damping, or aerodynamic slipstreams.
- 🎨 **Shaders, VFX & Lighting:** Enhance toon materials, procedural weather effects (sandstorms, aurora borealis, thunderstorms), particle systems (smoke, sparks, roostertails), and lighting passes.
- 🔊 **Procedural Web Audio & Radio:** Build generative Web Audio synthesizers, engine acoustic models, tire screech variations, or new stations for the in-car radio.
- 📜 **Lore, Postcards & Regional Culture:** Write historical kiosks, roadside attraction lore in `HistoricalLore.js`, or author procedural canvas postcards in `LandmarkPhotos.js`.
- 🕹️ **Game Modes & Mechanics:** Create time-trial checkpoints, speed trap leaderboards, traffic density modes, photo challenges, or off-road trail mini-events.
- 📱 **Engine Optimization & Mobile UX:** Improve WebGL2 draw call batching, memory efficiency, mobile UI ergonomics, or gamepad bindings.

---

### How Zone Expansion Works

The world is engineered around a modular, streamed chunk architecture. Each zone spans **2,600 meters** along a continuous Catmull-Rom road spline:

```
src/
├── constants.js            # 1. Register zone atmosphere, sky gradient, weather & grip
├── world/
│   ├── SplineRoad.js       # 2. Add road spline control points (curves, grades, banking)
│   ├── YourZoneScenery.js  # 3. Create your zone scenery builder (props, landmarks, flora)
│   ├── HistoricalLore.js   # 4. Add turnout historical kiosks and interpretive plaques
│   ├── LandmarkPhotos.js   # 5. Author collectible canvas postcard art
│   └── ZoneManager.js      # 6. Register zone transitions and boundaries
└── main.js                 # 7. Mount scenery builder and spatial culling partitions
```

### The 6-Gate Quality Standard for PR Review

To ensure every contributed zone delivers a consistent AAA arcade feel, all zone PRs are evaluated against our **6-Gate Gold Certification standard** (detailed in [`AUTONOMOUS_ZONE_EXPANSION_PLAYBOOK.md`](AUTONOMOUS_ZONE_EXPANSION_PLAYBOOK.md)):

1. **🛣️ Highway & Spline Continuity**: Smooth 2,600m road section with proper banking, striping, and terrain elevation conformances.
2. **🏛️ The Rule of Three Anchor Landmarks**: 3 distinct, culturally authentic procedural 3D landmarks visible from 400m+ down the corridor.
3. **🔭 Scenic Turnouts & POIs**: 2 accessible turnouts with roadside signs, coin-op telescopes, and historical lore kiosks.
4. **🌦️ Biome & Audio Identity**: Dedicated sky gradient, atmospheric haze, vegetation kit, and weather/wind parameters in `constants.js`.
5. **🎬 Narrative Signature Vignette**: 1 optional player-triggered interactive cutscene or off-road trail excursion.
6. **🛡️ Performance & 60 FPS Budget**: Subterranean foundations (`Y ≤ -1.0m` skirts to avoid floating geometry), static mesh batching (≤ 3 draw calls per 500m chunk), zero console errors, and clean `npm run build`.

### How to Submit a Pull Request (PR)

We love pull requests! Here's how to get your code into the game:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/zone-your-region-name
   # or for other features:
   git checkout -b feature/awesome-new-vehicle
   ```
3. **Implement Your Changes** following the modular architecture and clean code guidelines.
4. **Verify Locally**:
   ```bash
   npm run dev      # Test driving through your changes at a smooth 60 FPS
   npm run build    # Ensure the Vite production bundle builds without errors
   ```
5. **Open a Pull Request**:
   - Give your PR a clear, descriptive title (e.g. `feat(zone): Add Route 66 Arizona Red Rocks` or `feat(physics): Add progressive drift countersteer`).
   - Include screenshots or a short GIF/video showing your changes in action.
   - Describe what was added and any specific highlights or considerations.
   - Maintainers will review your PR, test it, provide friendly feedback, and merge it into `main`!

---

## 🎮 Controls

### Desktop Controls

| Key | Action |
|:---:|--------|
| `W` / `↑` | Accelerate (Gas) |
| `S` / `↓` | Brake / Reverse |
| `A` / `D` or `←` / `→` | Steering |
| `Space` | Handbrake / Drift Initiate |
| `Shift` | Nitrous Boost |
| `C` | Cycle Camera (Chase / Cockpit / Hood / Orbit) |
| `L` | Cycle Vehicle Livery Paint |
| `M` | Cycle Radio Station (Synthwave / Lo-Fi / Drive Rock / Off) |
| `P` | Photo Mode (`Enter` = Take Postcard Screenshot, `Esc` = Exit) |
| `R` | Reset Vehicle to Center of Highway |
| `E` | Interact (Telescopes, Kiosks, Cutscenes) |

### Mobile Touch Controls

- **Steering:** Virtual analog D-pad / thumbstick on bottom-left.
- **Driving Actions:** Large touch targets for **GAS**, **BRAKE**, **NITRO**, and **DRIFT** on bottom-right.
- **Action Pills:** Quick-access buttons for camera cycling, vehicle reset, radio station, and postcard photo mode.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation & Local Play

```bash
# 1. Clone the repository
git clone https://github.com/THREELabs/THREELabs-Dreamstate-Highway.git
cd THREELabs-Dreamstate-Highway

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to start driving!

### Production Build

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠️ Technology Stack & Architecture

- **Rendering Engine:** [Three.js](https://threejs.org/) (WebGL2) utilizing custom toon shaders, hardware gradient maps, and custom instanced VFX.
- **Physics Engine:** [Rapier 3D](https://rapier.rs/) (`@dimforge/rapier3d-compat`) WebAssembly physics engine with a custom raycast spring vehicle simulation.
- **World & Road Generation:** Catmull-Rom spline road extrusion with dynamic cross-sectional banking and streamed low-poly terrain meshes.
- **Procedural Texturing:** Procedural canvas generators for asphalt wear, road striping, terrain noise, and sky domes (zero remote image asset dependencies).
- **Sound Engine:** Pure [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) real-time audio synthesis (multi-oscillator boxer engine synthesis, noise buffers, resonant bi-quad filters).
- **Build System:** [Vite](https://vitejs.dev/) with ES Modules.

---

## 📜 Project History

This project began as **Baja Blast / Baja Racer**, an OutRun-inspired retro pseudo-3D canvas sprite-scaling game. That prototype engine remains preserved in early git history (prior to v2.0 and on the `zone-extender` branch). 

Recognizing the potential for an expansive, cinematic road trip across the American continent, the project was completely reimagined and rebuilt into **Dreamstate Highway** — an open, full-scale 3D WebGL scenic simulator and arcade racer designed for community expansion.

---

## 🔊 Audio & Asset Attribution

The game relies almost exclusively on procedural Web Audio synthesis for vehicle physics, screech, wind, and engine noise. Environmental sound recordings used for dynamic weather are licensed under Creative Commons and public domain:

- **Rain Ambience (`public/audio/rain_loop.ogg`)**:
  - **Source**: [Wikimedia Commons - File:Rain (1).ogg](https://commons.wikimedia.org/wiki/File:Rain_(1).ogg) / [PDSounds #682](http://www.pdsounds.org/sounds/rain)
  - **Author**: ezwa
  - **License**: Public Domain (CC0 / PD-author)
- **Thunderstrike 1 (`public/audio/thunder_1.ogg`)**:
  - **Source**: [Wikimedia Commons - File:Thunder 01.ogg](https://commons.wikimedia.org/wiki/File:Thunder_01.ogg)
  - **Author**: [Amuzujoe](https://commons.wikimedia.org/wiki/User:Amuzujoe)
  - **License**: Creative Commons Attribution-ShareAlike 4.0 International ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/))
- **Thunderstrike 2 (`public/audio/thunder_2.ogg`)**:
  - **Source**: [Wikimedia Commons - File:Thunder Claps.ogg](https://commons.wikimedia.org/wiki/File:Thunder_Claps.ogg)
  - **Author**: [Jonathan Hunt (Interactii)](https://commons.wikimedia.org/wiki/User:Interactii)
  - **License**: Creative Commons Attribution-ShareAlike 4.0 International ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/))

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Contributions submitted via Pull Requests are welcomed under the same license terms.
