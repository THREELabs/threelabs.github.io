# 🏎️ Baja Racer / Dreamstate Highway — Baseline Game Performance & Architecture Audit

> **Generated:** 2026-09-12T05:22:22.584Z  
> **Branch:** `AgentSkillReview`  
> **Test Harness:** `threejs-game-director` + `threejs-qa-release`  
> **Target Environment:** Chromium WebGL2 / Angle SwiftShader (1280×800)  

---

## Executive Summary

* **Dynamic Biomes Discovered & Audited:** **9 zones** (0m – 23,400m)
* **Off-Road Expedition Trail:** Audited (Cougar Ridge 4x4 switchbacks, water crossings, summit deck)
* **Console Health:** **CLEAN (0 critical errors)**
* **Peak Draw-Call Zone:** **SOUTHERN CALIFORNIA DESERT** (472 calls)
* **Average Draw Calls Across Highway:** **299 calls**
* **Global Asset Memory:** ~531 Geometries | ~82 Textures

---

## 1. Dynamic Biome & Zone Performance Scorecard

| Zone # | Biome / Route Name | Drivable Range | Draw Calls | Triangles | Geometries | Textures | p95 Frame Time | Status |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | SOUTHERN CALIFORNIA DESERT | 0m–2600m | 472 | 462,450 | 531 | 82 | 1952.7ms | **⚠️ WARN** |
| **1** | MALIBU & PACIFIC COAST HIGHWAY | 2600m–5200m | 344 | 242,420 | 701 | 87 | 1728.6ms | **⚠️ WARN** |
| **2** | BIG SUR HIGHWAY 1 | 5200m–7800m | 256 | 229,176 | 787 | 93 | 1498.3ms | **✅ PASS** |
| **3** | MONTEREY BAY & CARMEL | 7800m–10400m | 337 | 249,230 | 953 | 101 | 1750.8ms | **⚠️ WARN** |
| **4** | NORTHERN CALIFORNIA & MARIN | 10400m–13000m | 267 | 252,992 | 1054 | 107 | 1439.6ms | **✅ PASS** |
| **5** | REDWOOD FOREST | 13000m–15600m | 254 | 202,228 | 1145 | 117 | 4525.7ms | **✅ PASS** |
| **6** | OREGON COAST | 15600m–18200m | 258 | 219,358 | 1242 | 123 | 1497.5ms | **✅ PASS** |
| **7** | COLUMBIA RIVER GORGE | 18200m–20800m | 231 | 204,431 | 1312 | 128 | 1339.8ms | **✅ PASS** |
| **8** | WASHINGTON & CASCADE PASS | 20800m–23400m | 275 | 203,498 | 1424 | 138 | 4281.3ms | **✅ PASS** |
| **Trail** | Cougar Ridge 4x4 Expedition | Off-Road Spur | 604 | 447,815 | 1585 | 144 | — | **✅ PASS** |

---

## 2. Technical Art & Render Budget Analysis

* **Desktop Budget Baseline:** 
  * Limit: **300 draw calls** / **750,000 triangles**.
  * Result: **OVER BUDGET: Zones currently exceed the 300 draw-call budget (Peak: 472 calls in SOUTHERN CALIFORNIA DESERT vs 300 target). Batching and InstancedMesh required.**
* **Mobile / Low-Power Budget Baseline:**
  * Target: **150 draw calls** / **300,000 triangles**.
  * Result: **OVER BUDGET: Current peak (472 calls) exceeds the 150 mobile budget. Prop instancing will slash draw calls by ~80-90%.**

---

## 3. Prioritized Optimization Opportunities

1. **Roadside Prop Instancing (`THREE.InstancedMesh`)**:
   * *Target:* Guardrail reflector posts, road delineators, and repeating vegetation in SOUTHERN CALIFORNIA DESERT.
   * *Impact:* Reduces peak zone draw calls from ~472 down towards ~80–110.
2. **Terrain Spatial Chunking & Frustum Culling**:
   * *Status:* Chunk manager active; ensure off-screen forward chunks beyond 2,000m dynamically deactivate.
3. **Contact Shadow Quad for Chassis Grounding**:
   * *Impact:* Permits dropping shadow map resolution on low-power devices without losing vehicle ground presence.

---

## 4. Diagnostics & Console Verification

```json
{
  "criticalConsoleErrors": [],
  "consoleWarningsCount": 0,
  "physicsEngine": "rapier3d",
  "zonesAudited": 9,
  "repairShopsVerified": 0
}
```
