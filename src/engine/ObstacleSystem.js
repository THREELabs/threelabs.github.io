import * as THREE from 'three';
import { AUTO_REPAIR_SHOPS, SCENIC_PARKING_LOTS } from '../world/SplineRoad.js';
import { TrailSpline } from '../world/TrailSpline.js';
import { DownhillSpline } from '../world/DownhillSpline.js';
import { SUMMIT_LAYOUT } from '../world/TrailExperience.js';
import { ZONE_CONTROL_POINTS, interpolateZoneZ } from '../constants.js';

/**
 * ObstacleSystem
 * Efficient collision detection for:
 * - Auto Repair Shops: walls, pillars, lifts, tire racks, dumpster bins
 * - Landmark buildings: McWay Waterfall Lookout, Point Lobos Ranger Station, Bixby Vista Pavilion,
 *   Pfeiffer Canyon Trading Post, Ragged Point Overlook, Elephant Seal Boardwalk,
 *   Gorda Springs General Store, San Simeon Pier Tackle Shop, Cambria Pine Center
 * - Perimeter barriers: highway terminal gates (North End & South End)
 * - Cougar Ridge 4x4 Trail geology: sandstone bluffs, gorge walls, natural portal arch, megaliths, spires, and base camp
 * - Cougar Ridge Downhill geology: Granite Gateway, Waterfall Grotto, and Cougar Fangs boulders
 *
 * Uses a spatial partition grid (Z-buckets) for fast Broad-Phase pruning.
 */
export class ObstacleSystem {
  constructor(splineRoad) {
    this.splineRoad = splineRoad;
    this.autoShops = [];
    this.staticObstacles = [];
    this.spatialZGrid = new Map(); // Fast Z-bucket lookup
    this._collisionResult = {
      collided: true,
      pushX: 0,
      pushZ: 0,
      normalX: 0,
      normalZ: 0,
      penetration: 0,
      name: ''
    };

    this.initAutoShopColliders();
    this.initLandmarkBuildingColliders();
    this.initPerimeterBarrierColliders();
    this.initCougarRidgeTrailColliders();
    this.initDownhillTrailColliders();
    this.buildSpatialIndex();
  }

  // ---------------------------------------------------------------------------
  // 1. Auto Repair Shop Structural Colliders (All 9 Locations)
  // ---------------------------------------------------------------------------
  initAutoShopColliders() {
    AUTO_REPAIR_SHOPS.forEach(shop => {
      const lateral = shop.side === 'right' ? -34.0 : 34.0;
      const shopTrans = this.splineRoad ? this.splineRoad.getRoadTransformAtZ(shop.z, lateral, 0.18) : null;
      if (!shopTrans) return;

      // Local shop orientation (Facing towards street)
      // Local X is depth into garage (0 = entrance threshold, 16 = back wall)
      // Local Z is lateral width (-7 = left wall, 0 = bay center, +7 = divider, +13 = bay 2, +24 = office)
      const shopAngle = shopTrans.heading - Math.PI * 0.5;

      this.autoShops.push({
        id: shop.id,
        name: shop.name,
        worldPos: shopTrans.pos,
        worldZ: shopTrans.pos.z,
        shopAngle: shopAngle,
        cosA: Math.cos(-shopAngle),
        sinA: Math.sin(-shopAngle),
        cosW: Math.cos(shopAngle),
        sinW: Math.sin(shopAngle),
        // Local box colliders [minX, maxX, minZ, maxZ, name]
        boxes: [
          // 1. Back Interior Wall (X: 15.5 to 18.0, Z: -7.6 to 7.6)
          { minX: 15.5, maxX: 18.0, minZ: -7.6, maxZ: 7.6, name: `${shop.name} Back Wall` },
          // 2. Left Interior Wall (X: -0.5 to 16.5, Z: -7.6 to -6.4)
          { minX: -0.5, maxX: 16.5, minZ: -7.6, maxZ: -6.4, name: `${shop.name} Left Wall` },
          // 3. Bay 02 & Office Right Solid Enclosure (X: -0.5 to 17.5, Z: 6.5 to 30.0)
          { minX: -0.5, maxX: 17.5, minZ: 6.5, maxZ: 30.0, name: `${shop.name} Office & Bay 02 Wing` },
          // 4. Rear Shop Apron Perimeter & Utility Enclosure (X: 16.5 to 24.0, Z: -9.0 to 32.0)
          { minX: 16.5, maxX: 24.0, minZ: -9.0, maxZ: 32.0, name: `${shop.name} Rear Utility Shed` }
        ],
        // 4-Post Hydraulic Lift Columns in Bay 01 (Local X: 8.0 ± 3.8, Local Z: ±4.5)
        cylinders: [
          { lx: 4.2, lz: -4.5, radius: 0.55, name: 'Lift Post Front-Left' },
          { lx: 11.8, lz: -4.5, radius: 0.55, name: 'Lift Post Rear-Left' },
          { lx: 4.2, lz: 4.5, radius: 0.55, name: 'Lift Post Front-Right' },
          { lx: 11.8, lz: 4.5, radius: 0.55, name: 'Lift Post Rear-Right' }
        ]
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Landmark Buildings, Diners, Motels & Roadside Structures
  // ---------------------------------------------------------------------------
  initLandmarkBuildingColliders() {
    // Registered world-space solid buildings, side mountains, and architectural structures
    const landmarks = [
      // --- Zone 0: Desert (0 - 2600m) ---
      { name: "Billboard Post Z=380", z: 380, lat: 26.0, hx: 2.0, hz: 4.0 },
      { name: "Elmer's Bottle Tree Ranch House", z: 350, lat: -34.0, hx: 7.0, hz: 6.0 },
      { name: 'Wigwam Village Motel Main Office', z: 420, lat: 36.0, hx: 8.0, hz: 6.5 },
      { name: 'Route 66 Neon Diner Building', z: 750, lat: 36.0, hx: 9.0, hz: 7.5 },
      { name: "Billboard Post Z=1100", z: 1100, lat: -28.0, hx: 2.0, hz: 4.0 },
      { name: 'Mojave Mesa Arch Stone Footings', z: 1420, lat: -36.0, hx: 8.0, hz: 8.0 },
      { name: 'Cabazon Giant Dinosaurs', z: 1550, lat: -65.0, hx: 16.0, hz: 32.0 },
      { name: 'Desert Hills Outlet Store Complex', z: 1615, lat: 36.0, hx: 12.0, hz: 10.0 },
      { name: "Billboard Post Z=1900", z: 1900, lat: 28.0, hx: 2.0, hz: 4.0 },
      { name: 'Calico Ghost Town Saloon & Mine Store', z: 1900, lat: 28.0, hx: 9.0, hz: 7.5 },
      { name: "Roy's Motel Main Lobby & Neon Tower Base", z: 2300, lat: 36.0, hx: 8.5, hz: 8.0 },

      // --- Zone 1: Malibu & PCH (2600 - 5200m) ---
      { name: 'Santa Monica Sandstone Bluffs Base', z: 2800, lat: 48.0, hx: 14.0, hz: 24.0 },
      { name: 'Pacific Park Looff Hippodrome Building', z: 2900, lat: -42.0, hx: 10.0, hz: 8.5 },
      { name: 'The Getty Villa Roman Colonnade Wall', z: 3500, lat: 40.0, hx: 14.0, hz: 8.0 },
      { name: 'Topanga Canyon Surf Shack', z: 3800, lat: 36.0, hx: 8.0, hz: 6.0 },
      { name: 'Malibu Pier Bait & Tackle Shop', z: 4100, lat: -42.0, hx: 7.5, hz: 6.5 },
      { name: 'Carbon Beach Oceanfront Estate Walls', z: 4400, lat: -32.0, hx: 8.5, hz: 7.5 },
      { name: 'Point Dume Marine Station & Gift Shop', z: 4800, lat: -34.0, hx: 8.0, hz: 7.0 },
      { name: "Neptune's Net Seafood Restaurant & Patio", z: 5050, lat: 28.0, hx: 11.0, hz: 8.5 },
      { name: 'Point Mugu Sandstone Sea Rock', z: 5180, lat: -44.0, hx: 14.0, hz: 16.0 },

      // --- Zone 2: Big Sur (5200 - 7800m) ---
      { name: 'Big Sur River Inn Timber Lodge', z: 5550, lat: 34.0, hx: 10.0, hz: 8.0 },
      { name: 'Henry Miller Memorial Library Redwood House', z: 6450, lat: 32.0, hx: 8.0, hz: 7.0 },
      { name: 'Nepenthe Cliffside Restaurant Lodge', z: 6300, lat: -34.0, hx: 11.0, hz: 9.0 },
      { name: 'Bixby Bridge North Approach Stone Abutment', z: 6540, lat: 14.0, hx: 3.5, hz: 5.0 },
      { name: 'Bixby Bridge South Approach Stone Abutment', z: 6760, lat: -14.0, hx: 3.5, hz: 5.0 },
      { name: 'Pfeiffer Beach Keyhole Sea Arch Rock', z: 7300, lat: -56.0, hx: 16.0, hz: 16.0 },
      { name: 'Point Sur Lightstation Hill & Keepers Quarters', z: 7600, lat: -68.0, hx: 18.0, hz: 18.0 },

      // --- Zone 3: Monterey & Carmel (7800 - 10400m) ---
      { name: 'Cannery Row Brick Cannery Factory Left', z: 8300, lat: -32.0, hx: 10.0, hz: 12.0 },
      { name: 'Cannery Row Brick Cannery Factory Right', z: 8300, lat: 32.0, hx: 10.0, hz: 12.0 },
      { name: 'Monterey Bay Aquarium Stone Entry Facade', z: 8450, lat: -36.0, hx: 12.0, hz: 10.0 },
      { name: 'Pebble Beach Clubhouse & Stone Pavilion', z: 8800, lat: -36.0, hx: 11.0, hz: 9.0 },
      { name: 'The Lone Cypress Sea Stack Rock', z: 9300, lat: -42.0, hx: 12.0, hz: 12.0 },
      { name: 'Carmel Storybook Thatched Cottage', z: 9750, lat: 30.0, hx: 7.5, hz: 6.5 },
      { name: 'Carmel Mission Basilica Stone Walls (1797)', z: 10150, lat: 34.0, hx: 12.0, hz: 10.0 },

      // --- Zone 4: NorCal & Marin (10400 - 13000m) ---
      { name: 'Painted Ladies Victorian House 01', z: 10800, lat: 36.0, hx: 8.5, hz: 7.0 },
      { name: 'Painted Ladies Victorian House 02', z: 10825, lat: 36.0, hx: 8.5, hz: 7.0 },
      { name: 'Marin Headlands Artillery Bunker Left', z: 11400, lat: -42.0, hx: 9.0, hz: 9.0 },
      { name: 'Golden Gate South Tower Anchorage Pier', z: 11650, lat: 14.5, hx: 4.5, hz: 6.5 },
      { name: 'Golden Gate North Tower Anchorage Pier', z: 11750, lat: -14.5, hx: 4.5, hz: 6.5 },
      { name: 'Sonoma Valley Mission Chateau & Cellar', z: 12400, lat: 36.0, hx: 12.0, hz: 9.5 },
      { name: 'Bodega Bay St. Teresa Historic Church', z: 12800, lat: -34.0, hx: 8.5, hz: 8.0 },

      // --- Zone 5: Redwood Forest (13000 - 15600m) ---
      { name: 'Redwood Creek Covered Bridge Timber Portals', z: 13500, lat: 18.5, hx: 3.5, hz: 6.0 },
      { name: 'Chandelier Drive-Thru Redwood Base', z: 13900, lat: 30.0, hx: 7.0, hz: 7.0 },
      { name: 'Carson Mansion Eureka Victorian Manor', z: 14400, lat: 38.0, hx: 11.0, hz: 9.5 },
      { name: 'Legend of Bigfoot Discovery Museum Lodge', z: 14950, lat: -36.0, hx: 9.5, hz: 8.0 },
      { name: 'Redwood Sawmill Main Mill & Boiler House', z: 15300, lat: 34.0, hx: 12.0, hz: 10.0 },

      // --- Zone 6: Oregon Coast (15600 - 18200m) ---
      { name: 'Yaquina Head Lighthouse Keepers Residence', z: 16100, lat: -57.0, hx: 9.0, hz: 8.0 },
      { name: 'Haystack Rock Basalt Sea Stack', z: 16600, lat: -78.0, hx: 22.0, hz: 22.0 },
      { name: 'Cannon Beach Commercial Core Shops', z: 16620, lat: 30.0, hx: 10.0, hz: 30.0 },
      { name: 'Cape Perpetua Basalt Sea Cave Rock', z: 17100, lat: -42.0, hx: 14.0, hz: 14.0 },
      { name: 'Tillamook Cheese Creamery Historic Barn', z: 17650, lat: 42.0, hx: 14.0, hz: 12.0 },
      { name: 'Tillamook Creamery Modern Building', z: 17760, lat: 48.0, hx: 16.0, hz: 14.0 },

      // --- Zone 7: Columbia River Gorge (18200 - 20800m) ---
      { name: 'Cascade Locks Marine Visitor Center', z: 18670, lat: -48.0, hx: 10.0, hz: 12.0 },
      { name: 'Bridge of the Gods Tower Pier South', z: 18700, lat: -14.5, hx: 4.5, hz: 6.0 },
      { name: 'Multnomah Falls Historic Stone Lodge', z: 19250, lat: 48.0, hx: 14.0, hz: 12.0 },
      { name: 'Hood River Commercial Core', z: 19440, lat: 32.0, hx: 10.0, hz: 20.0 },
      { name: 'Bonneville Hydroelectric Powerhouse & Spillway', z: 19850, lat: -35.0, hx: 14.0, hz: 12.0 },
      { name: 'Vista House at Crown Point 1918 Rotunda', z: 20450, lat: -38.0, hx: 12.0, hz: 12.0 },

      // --- Zone 8: Washington & Seattle (20800 - 23400m) ---
      { name: 'Snoqualmie Falls Great Northern Timber Lodge', z: 21450, lat: 48.0, hx: 14.0, hz: 12.0 },
      { name: 'Puget Sound Ferry Terminal Building', z: 21950, lat: -36.0, hx: 12.0, hz: 10.0 },
      { name: 'Seattle Space Needle Base Tripod', z: 22550, lat: -65.0, hx: 14.0, hz: 14.0 },
      { name: 'Pike Place Public Market Historic Brick Arcade', z: 23100, lat: 36.0, hx: 14.0, hz: 12.0 },

      // --- Zone 9: Cascade Pass & Mount Rainier (23400 - 26000m) ---
      { name: 'Paradise Historic Timber Lodge Great Hall', z: 24100, lat: 46.0, hx: 22.0, hz: 12.0 },
      { name: 'Narada Falls Basalt Cliff Face & Overlook Pier', z: 24900, lat: -42.0, hx: 14.0, hz: 16.0 },
      { name: 'Glacial Avalanche Snow Shed Mountain Retaining Wall', z: 25200, lat: 16.0, hx: 2.5, hz: 40.0 },
      { name: 'Glacial Avalanche Snow Shed Colonnade Piers', z: 25200, lat: -14.0, hx: 2.0, hz: 40.0 },
      { name: 'Rainier Summit Observation Stone Terrace', z: 25600, lat: 38.0, hx: 12.0, hz: 12.0 }
    ];

    landmarks.forEach(b => {
      const zoneIdx = b.z < 2600 ? 0 : Math.min(11, Math.floor(b.z / 2600));
      const targetZ = zoneIdx === 0 ? b.z : interpolateZoneZ(b.z, ZONE_CONTROL_POINTS[zoneIdx]);
      const transform = this.splineRoad ? this.splineRoad.getRoadTransformAtZ(targetZ, b.lat, 0) : null;
      const wx = transform ? transform.pos.x : b.lat;
      const wz = transform ? transform.pos.z : targetZ;

      this.staticObstacles.push({
        type: 'AABB',
        name: b.name,
        z: wz,
        minX: wx - b.hx,
        maxX: wx + b.hx,
        minZ: wz - b.hz,
        maxZ: wz + b.hz
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Start Plaza & Finish Line Perimeter Barriers
  // ---------------------------------------------------------------------------
  initPerimeterBarrierColliders() {
    // 1. Race Staging Plaza Rear Boundary Wall (Z = -68m)
    this.staticObstacles.push({
      type: 'AABB',
      name: 'Staging Plaza Rear Concrete Barrier',
      z: -68,
      minX: -60.0,
      maxX: 60.0,
      minZ: -72.0,
      maxZ: -67.0
    });

    // 2. Montana Glacier Terminus Finish Line Deceleration Safety Barrier (Z = 62015m)
    this.staticObstacles.push({
      type: 'AABB',
      name: 'Montana Glacier Terminus Finish Line Concrete Safety Barrier',
      z: 62015,
      minX: -60.0,
      maxX: 60.0,
      minZ: 62014.0,
      maxZ: 62025.0
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Cougar Ridge 4x4 Expedition Trail Geology & Structural Colliders
  // ---------------------------------------------------------------------------
  initCougarRidgeTrailColliders() {
    if (!this.splineRoad) return;

    const segments = 256;
    const spinePoints = TrailSpline.getSpinePoints(segments).map(sp => {
      const trans = this.splineRoad.getRoadTransformAtZ(sp.z, sp.lat, 0);
      return {
        t: sp.t,
        lat: sp.lat,
        z: sp.z,
        width: sp.width,
        pos: new THREE.Vector3(trans.pos.x, 0, trans.pos.z),
        heading: trans.heading
      };
    });

    const trailFrames = [];
    for (let i = 0; i <= segments; i++) {
      let dir;
      if (i === 0) {
        dir = spinePoints[1].pos.clone().sub(spinePoints[0].pos).setY(0).normalize();
      } else if (i === segments) {
        dir = spinePoints[segments].pos.clone().sub(spinePoints[segments - 1].pos).setY(0).normalize();
      } else {
        dir = spinePoints[i + 1].pos.clone().sub(spinePoints[i - 1].pos).setY(0).normalize();
      }
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      trailFrames.push({ dir, norm });
    }

    // 1. Lower Canyon Wash Stratified Sandstone Bluffs (t ≈ 0.05 - 0.13)
    const lowerBluffIndices = [12, 18, 24, 30];
    lowerBluffIndices.forEach((idx, bIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const halfW = (sp.width || 9.0) * 0.5;
      const side = 1;
      const wallDist = halfW + 22.0 + (bIdx % 3) * 2.0;

      const bx = sp.pos.x + norm.x * (side * wallDist);
      const bz = sp.pos.z + norm.z * (side * wallDist);
      const rotY = Math.atan2(dir.x, dir.z) + (side > 0 ? 0.3 : -0.3);

      this.addStaticObstacle({
        type: 'OBB',
        name: `Cougar Canyon Red Sandstone Bluff ${bIdx + 1}`,
        x: bx,
        z: bz,
        hx: 4.5,
        hz: 5.0,
        rotY: rotY
      });
    });

    // 2. Cougar Creek Canyon Gorge Walls (t ≈ 0.26 - 0.32)
    const gorgeIndices = [68, 76];
    gorgeIndices.forEach((idx, gIdx) => {
      const sp = spinePoints[idx];
      const { dir, norm } = trailFrames[idx];
      const halfW = (sp.width || 10.0) * 0.5;
      const wallDist = halfW + 28.0;
      const gx = sp.pos.x - norm.x * wallDist;
      const gz = sp.pos.z - norm.z * wallDist;
      const rotY = Math.atan2(dir.x, dir.z);

      this.addStaticObstacle({
        type: 'OBB',
        name: `Cougar Creek Gorge Wall ${gIdx + 1}`,
        x: gx,
        z: gz,
        hx: 5.5,
        hz: 9.0,
        rotY: rotY
      });
    });

    // Cougar Falls Amphitheater Bluff (Across gorge, solid rock mass)
    const wfTrans = this.splineRoad.getRoadTransformAtZ(2830.0, -200.0, 0);
    this.addStaticObstacle({
      type: 'CYLINDER',
      name: 'Cougar Falls Amphitheater Bluff',
      x: wfTrans.pos.x,
      z: wfTrans.pos.z,
      radius: 18.0
    });

    // 3. Majestic Red Sandstone Natural Arch Pillars (index 102)
    const archSp = spinePoints[102];
    const archFrame = trailFrames[102];
    [-16.5, 16.5].forEach((pillarDist, pIdx) => {
      const px = archSp.pos.x + archFrame.norm.x * pillarDist;
      const pz = archSp.pos.z + archFrame.norm.z * pillarDist;
      this.addStaticObstacle({
        type: 'CYLINDER',
        name: pIdx === 0 ? 'Sandstone Natural Arch West Pillar' : 'Sandstone Natural Arch East Pillar',
        x: px,
        z: pz,
        radius: 3.5
      });
    });

    // 4. Boulder Canyon Amphitheater Megaliths
    [112, 124].forEach((idx, mIdx) => {
      const sp = spinePoints[idx];
      const { norm } = trailFrames[idx];
      const halfW = (sp.width || 12.0) * 0.5;

      [-1, 1].forEach((side, sIdx) => {
        const mDist = halfW + 14.5 + sIdx * 2.5;
        const mx = sp.pos.x + norm.x * (side * mDist);
        const mz = sp.pos.z + norm.z * (side * mDist);
        this.addStaticObstacle({
          type: 'CYLINDER',
          name: `Boulder Canyon Megalith ${mIdx * 2 + sIdx + 1}`,
          x: mx,
          z: mz,
          radius: 3.8
        });
      });
    });

    // 5. Devil's Backbone Needle Spires
    [178, 184, 190].forEach((idx, pIdx) => {
      const sp = spinePoints[idx];
      const { norm } = trailFrames[idx];
      const halfW = (sp.width || 9.0) * 0.5;

      [-1, 1].forEach((side) => {
        const sDist = halfW + 11.5;
        const sx = sp.pos.x + norm.x * (side * sDist);
        const sz = sp.pos.z + norm.z * (side * sDist);
        this.addStaticObstacle({
          type: 'CYLINDER',
          name: `Devil's Backbone Needle Spire ${pIdx + 1}`,
          x: sx,
          z: sz,
          radius: 2.4
        });
      });
    });

    // 6. Boulder Canyon Technical Rock Crawl Arena Boulders (t ≈ 0.44, indices 106, 110, 114, 118)
    // Prevents vehicle from penetrating or clipping through the large granite boulders on the trail
    [106, 110, 114, 118].forEach((idx, bIdx) => {
      const sp = spinePoints[idx];
      const { norm } = trailFrames[idx];
      const bRad = 1.6 + (bIdx % 3) * 0.3;
      const bSide = (bIdx % 2 === 0) ? -1 : 1;
      const bX = sp.pos.x + norm.x * (bSide * 3.6);
      const bZ = sp.pos.z + norm.z * (bSide * 3.6);

      this.addStaticObstacle({
        type: 'CYLINDER',
        name: `Boulder Canyon Granite Boulder ${bIdx + 1}`,
        x: bX,
        z: bZ,
        radius: bRad * 1.25
      });
    });

    // 7. Cougar Creek Riverbed & Bank Boulders (indices 35 to 68)
    const cougarRiverStones = [
      { idx: 35, sideOff: -11.5, rad: 2.2 },
      { idx: 36, sideOff:  11.8, rad: 2.0 },
      { idx: 38, sideOff:  -4.8, rad: 1.6 },
      { idx: 39, sideOff:  10.5, rad: 2.4 },
      { idx: 41, sideOff: -10.8, rad: 1.9 },
      { idx: 42, sideOff:   4.2, rad: 1.7 },
      { idx: 44, sideOff: -11.2, rad: 2.5 },
      { idx: 45, sideOff:  11.0, rad: 2.3 },
      { idx: 47, sideOff:  -3.8, rad: 1.8 },
      { idx: 48, sideOff:  11.5, rad: 2.6 },
      { idx: 50, sideOff:   3.6, rad: 1.9 },
      { idx: 51, sideOff: -10.5, rad: 2.2 },
      { idx: 52, sideOff:  12.0, rad: 2.4 },
      { idx: 54, sideOff: -11.8, rad: 2.7 },
      { idx: 55, sideOff:  -4.2, rad: 1.8 },
      { idx: 56, sideOff:  11.2, rad: 2.5 },
      { idx: 58, sideOff:   4.5, rad: 1.7 },
      { idx: 59, sideOff: -10.8, rad: 2.3 },
      { idx: 61, sideOff:  11.5, rad: 2.8 },
      { idx: 63, sideOff:  -4.0, rad: 1.9 },
      { idx: 64, sideOff: -11.5, rad: 2.4 },
      { idx: 65, sideOff:   4.2, rad: 1.8 },
      { idx: 66, sideOff:  11.8, rad: 2.6 },
      { idx: 67, sideOff: -11.0, rad: 2.1 },
      { idx: 68, sideOff:  12.2, rad: 2.5 }
    ];
    cougarRiverStones.forEach((st, sIdx) => {
      const sp = spinePoints[st.idx];
      const { norm } = trailFrames[st.idx];
      const sx = sp.pos.x + norm.x * st.sideOff;
      const sz = sp.pos.z + norm.z * st.sideOff;
      this.addStaticObstacle({
        type: 'CYLINDER',
        name: `Cougar Creek River Boulder ${sIdx + 1}`,
        x: sx,
        z: sz,
        radius: st.rad * 1.15
      });
    });

    // 8. Thunder Creek Waterfall Ford Flanking Boulders (index 160)
    const tcSp = spinePoints[160];
    if (tcSp) {
      const tcRiverStones = [
        { offX: -5.8, offZ: -3.0, rad: 1.7 },
        { offX: -6.4, offZ:  2.0, rad: 1.8 },
        { offX: -5.6, offZ: -6.5, rad: 1.4 },
        { offX:  6.0, offZ: -2.0, rad: 1.8 },
        { offX:  5.8, offZ:  4.0, rad: 1.6 },
        { offX:  6.2, offZ:  7.5, rad: 1.5 }
      ];
      tcRiverStones.forEach((st, sIdx) => {
        this.addStaticObstacle({
          type: 'CYLINDER',
          name: `Thunder Creek Bank Boulder ${sIdx + 1}`,
          x: tcSp.pos.x + st.offX,
          z: tcSp.pos.z + st.offZ,
          radius: st.rad * 1.15
        });
      });
    }

    // 9. Thunder Falls Amphitheater Bluff
    const tfTrans = this.splineRoad.getRoadTransformAtZ(3025.0, -275.0, 0);
    if (tfTrans) {
      this.addStaticObstacle({
        type: 'CYLINDER',
        name: 'Thunder Falls Amphitheater Bluff',
        x: tfTrans.pos.x,
        z: tfTrans.pos.z,
        radius: 16.0
      });
    }

    // 10. Devil's Backbone Knife-Edge Ridge Rocks
    [180, 185, 190].forEach((idx, kIdx) => {
      const sp = spinePoints[idx];
      const { norm } = trailFrames[idx];
      [-1, 1].forEach(side => {
        const bRad = 0.95 + (kIdx % 2) * 0.35;
        const cx = sp.pos.x + norm.x * (side * 4.8);
        const cz = sp.pos.z + norm.z * (side * 4.8);
        this.addStaticObstacle({
          type: 'CYLINDER',
          name: `Devil's Backbone Ridge Rock ${kIdx * 2 + (side > 0 ? 1 : 2)}`,
          x: cx,
          z: cz,
          radius: bRad * 1.15
        });
      });
    });

    // 11. Devil's Shelf Cascading Waterfall Flanking Canyon Boulders
    [202, 206, 210, 214].forEach((idx, shelfIdx) => {
      const sp = spinePoints[idx];
      const { norm } = trailFrames[idx];
      const slabW = 9.8;
      [-1, 1].forEach(side => {
        const bRad = 2.6 + ((shelfIdx * 3 + side) % 3) * 0.5;
        const bx = sp.pos.x + norm.x * (side * (slabW * 0.5 + bRad * 0.75));
        const bz = sp.pos.z + norm.z * (side * (slabW * 0.5 + bRad * 0.75));
        this.addStaticObstacle({
          type: 'CYLINDER',
          name: `Devil's Shelf Canyon Boulder ${shelfIdx * 2 + (side > 0 ? 1 : 2)}`,
          x: bx,
          z: bz,
          radius: bRad * 1.15
        });
      });
    });

    // 12. Summit Base Camp Structures (Observation Pavilion, Mast, Tent, Firewood, Campfire)
    const summitSp = spinePoints[segments];
    if (summitSp) {
      // Shared authored layout prevents invisible collisions at old prop positions.
      const shelterBaseX = summitSp.pos.x + SUMMIT_LAYOUT.shelter.x;
      const shelterBaseZ = summitSp.pos.z + SUMMIT_LAYOUT.shelter.z;
      [
        { x: -3.2, z: -2.4 },
        { x: 3.2, z: -2.4 },
        { x: -3.2, z: 2.4 },
        { x: 3.2, z: 2.4 }
      ].forEach((pPos, pIdx) => {
        this.addStaticObstacle({
          type: 'CYLINDER',
          name: `Summit Pavilion Post ${pIdx + 1}`,
          x: shelterBaseX + pPos.x * Math.cos(0.25) + pPos.z * Math.sin(0.25),
          z: shelterBaseZ - pPos.x * Math.sin(0.25) + pPos.z * Math.cos(0.25),
          radius: 0.35
        });
      });

      for (const [key, name, radius] of [
        ['weather', 'Summit Meteorological Mast', 0.35],
        ['fire', 'Summit Campfire Stone Ring', 1.5]
      ]) {
        const p = SUMMIT_LAYOUT[key];
        this.addStaticObstacle({type:'CYLINDER', name, x:summitSp.pos.x+p.x, z:summitSp.pos.z+p.z, radius});
      }
      for (const [key, name, hx, hz, rotY] of [
        ['tent', 'Summit Base Camp Wall Tent', 3.1, 1.5, -0.4],
        ['wood', 'Summit Firewood Stack', 0.8, 1.0, -0.35]
      ]) {
        const p = SUMMIT_LAYOUT[key];
        this.addStaticObstacle({type:'OBB', name, x:summitSp.pos.x+p.x, z:summitSp.pos.z+p.z, hx, hz, rotY});
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Cougar Ridge Downhill Express Geology & Waterfall Colliders
  // ---------------------------------------------------------------------------
  initDownhillTrailColliders() {
    if (!this.splineRoad) return;

    const segments = 128;
    const spinePoints = DownhillSpline.getSpinePoints(segments).map(sp => {
      const trans = this.splineRoad.getRoadTransformAtZ(sp.z, sp.lat, 0);
      return {
        t: sp.t,
        lat: sp.lat,
        z: sp.z,
        width: sp.width,
        pos: new THREE.Vector3(trans.pos.x, 0, trans.pos.z)
      };
    });

    const routeFrames = [];
    for (let i = 0; i <= segments; i++) {
      let dir;
      if (i === 0) {
        dir = spinePoints[1].pos.clone().sub(spinePoints[0].pos).setY(0).normalize();
      } else if (i === segments) {
        dir = spinePoints[segments].pos.clone().sub(spinePoints[segments - 1].pos).setY(0).normalize();
      } else {
        dir = spinePoints[i + 1].pos.clone().sub(spinePoints[i - 1].pos).setY(0).normalize();
      }
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      routeFrames.push({ dir, norm });
    }

    // 1. Granite Gateway Twin Monoliths (t ≈ 0.10, idx ≈ 13)
    const gateIdx = Math.floor(segments * 0.10);
    const gateSp = spinePoints[gateIdx];
    const gateFrame = routeFrames[gateIdx];
    const gateHalfW = (gateSp.width || 14.0) * 0.5;
    [-gateHalfW - 2.8, gateHalfW + 2.8].forEach((xSide, pIdx) => {
      this.addStaticObstacle({
        type: 'CYLINDER',
        name: `Granite Gateway Pillar ${pIdx + 1}`,
        x: gateSp.pos.x + gateFrame.norm.x * xSide,
        z: gateSp.pos.z + gateFrame.norm.z * xSide,
        radius: 2.5
      });
    });

    // 2. Bridalveil Waterfall Grotto Rock Columns (t ≈ 0.38, idx ≈ 49)
    const wfIdx = Math.floor(segments * 0.38);
    const wfSp = spinePoints[wfIdx];
    const wfFrame = routeFrames[wfIdx];
    const wfHalfW = (wfSp.width || 14.5) * 0.5;
    [-wfHalfW - 3.2, wfHalfW + 3.2].forEach((xSide, pIdx) => {
      this.addStaticObstacle({
        type: 'CYLINDER',
        name: `Waterfall Grotto Rock Column ${pIdx + 1}`,
        x: wfSp.pos.x + wfFrame.norm.x * xSide,
        z: wfSp.pos.z + wfFrame.norm.z * xSide,
        radius: 3.0
      });
    });

    // 3. Cougar Fangs Slalom Boulders (t ≈ 0.48, idx ≈ 61)
    const fangIdx = Math.floor(segments * 0.48);
    const fangSp = spinePoints[fangIdx];
    const fangFrame = routeFrames[fangIdx];
    const fangHalfW = (fangSp.width || 14.0) * 0.5;
    [-fangHalfW - 1.2, fangHalfW + 1.2].forEach((xSide, pIdx) => {
      this.addStaticObstacle({
        type: 'CYLINDER',
        name: `Cougar Fang Boulder ${pIdx + 1}`,
        x: fangSp.pos.x + fangFrame.norm.x * xSide,
        z: fangSp.pos.z + fangFrame.norm.z * xSide,
        radius: 2.2
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Register Static Obstacle (AABB, CYLINDER, or OBB)
  // ---------------------------------------------------------------------------
  addStaticObstacle(obs) {
    if (!obs) return;
    if (obs.type === 'CYLINDER' || obs.type === 'CIRCLE') {
      obs.minX = obs.x - obs.radius;
      obs.maxX = obs.x + obs.radius;
      obs.minZ = obs.z - obs.radius;
      obs.maxZ = obs.z + obs.radius;
    } else if (obs.type === 'OBB') {
      const diag = Math.sqrt(obs.hx * obs.hx + obs.hz * obs.hz);
      obs.minX = obs.x - diag;
      obs.maxX = obs.x + diag;
      obs.minZ = obs.z - diag;
      obs.maxZ = obs.z + diag;
      if (obs.rotY !== undefined) {
        obs.cosA = Math.cos(-obs.rotY);
        obs.sinA = Math.sin(-obs.rotY);
        obs.cosW = Math.cos(obs.rotY);
        obs.sinW = Math.sin(obs.rotY);
      }
    }
    this.staticObstacles.push(obs);

    const bMin = Math.floor(obs.minZ / 100);
    const bMax = Math.floor(obs.maxZ / 100);
    for (let b = bMin; b <= bMax; b++) {
      if (!this.spatialZGrid.has(b)) {
        this.spatialZGrid.set(b, []);
      }
      this.spatialZGrid.get(b).push(obs);
    }
  }

  // ---------------------------------------------------------------------------
  // Fast Spatial Grid (100m buckets)
  // ---------------------------------------------------------------------------
  buildSpatialIndex() {
    this.spatialZGrid.clear();

    const addToBucket = (bucketKey, obs) => {
      if (!this.spatialZGrid.has(bucketKey)) {
        this.spatialZGrid.set(bucketKey, []);
      }
      this.spatialZGrid.get(bucketKey).push(obs);
    };

    this.staticObstacles.forEach(obs => {
      const bMin = Math.floor(obs.minZ / 100);
      const bMax = Math.floor(obs.maxZ / 100);
      for (let b = bMin; b <= bMax; b++) {
        addToBucket(b, obs);
      }
    });

    this.autoShops.forEach(shop => {
      const bMin = Math.floor((shop.worldZ - 60) / 100);
      const bMax = Math.floor((shop.worldZ + 60) / 100);
      for (let b = bMin; b <= bMax; b++) {
        addToBucket(b, shop);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Query Nearby Obstacles
  // ---------------------------------------------------------------------------
  getObstaclesNear(z) {
    const bucket = Math.floor(z / 100);
    const list = [];
    for (let b = bucket - 1; b <= bucket + 1; b++) {
      const items = this.spatialZGrid.get(b);
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (!list.includes(items[i])) list.push(items[i]);
        }
      }
    }
    return list;
  }

  // ---------------------------------------------------------------------------
  // Check and Resolve Physical Collisions
  // ---------------------------------------------------------------------------
  resolveCollision(carPos, carRadius = 1.35) {
    const nearby = this.getObstaclesNear(carPos.z);
    if (!nearby || nearby.length === 0) return null;

    let totalPushX = 0;
    let totalPushZ = 0;
    let maxPenetration = 0;
    let contactNormalX = 0;
    let contactNormalZ = 0;
    let hitObstacleName = '';
    let hasCollided = false;

    for (let i = 0; i < nearby.length; i++) {
      const obs = nearby[i];

      // Case A: Auto Repair Shop with Local-Space Wall Colliders
      if (obs.shopAngle !== undefined) {
        // Transform car world coordinates into shop local space
        const dx = carPos.x - obs.worldPos.x;
        const dz = carPos.z - obs.worldPos.z;
        const lx = dx * obs.cosA - dz * obs.sinA;
        const lz = dx * obs.sinA + dz * obs.cosA;

        // 1. Check local boxes (Walls, dividers, office building)
        for (let b = 0; b < obs.boxes.length; b++) {
          const box = obs.boxes[b];
          if (lx >= box.minX - carRadius && lx <= box.maxX + carRadius &&
              lz >= box.minZ - carRadius && lz <= box.maxZ + carRadius) {
            
            // Calculate minimum penetration depth in local space
            const penLeft = (lx + carRadius) - box.minX;
            const penRight = box.maxX - (lx - carRadius);
            const penBottom = (lz + carRadius) - box.minZ;
            const penTop = box.maxZ - (lz - carRadius);

            const minPen = Math.min(penLeft, penRight, penBottom, penTop);

            if (minPen > 0) {
              let localNormX = 0;
              let localNormZ = 0;

              if (minPen === penLeft) localNormX = -1;
              else if (minPen === penRight) localNormX = 1;
              else if (minPen === penBottom) localNormZ = -1;
              else localNormZ = 1;

              // Rotate local push back to world space
              const cosW = obs.cosW !== undefined ? obs.cosW : Math.cos(obs.shopAngle);
              const sinW = obs.sinW !== undefined ? obs.sinW : Math.sin(obs.shopAngle);
              const worldNormX = localNormX * cosW - localNormZ * sinW;
              const worldNormZ = localNormX * sinW + localNormZ * cosW;

              totalPushX += worldNormX * minPen;
              totalPushZ += worldNormZ * minPen;
              if (minPen > maxPenetration) {
                maxPenetration = minPen;
                contactNormalX = worldNormX;
                contactNormalZ = worldNormZ;
                hitObstacleName = box.name;
              }
              hasCollided = true;
            }
          }
        }

        // 2. Check local cylinders (Lift posts)
        if (obs.cylinders) {
          for (let c = 0; c < obs.cylinders.length; c++) {
            const cyl = obs.cylinders[c];
            const cdx = lx - cyl.lx;
            const cdz = lz - cyl.lz;
            const distSq = cdx * cdx + cdz * cdz;
            const minDist = carRadius + cyl.radius;
            if (distSq < minDist * minDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const pen = minDist - dist;
              const localNormX = cdx / dist;
              const localNormZ = cdz / dist;

              const cosW = obs.cosW !== undefined ? obs.cosW : Math.cos(obs.shopAngle);
              const sinW = obs.sinW !== undefined ? obs.sinW : Math.sin(obs.shopAngle);
              const worldNormX = localNormX * cosW - localNormZ * sinW;
              const worldNormZ = localNormX * sinW + localNormZ * cosW;

              totalPushX += worldNormX * pen;
              totalPushZ += worldNormZ * pen;
              if (pen > maxPenetration) {
                maxPenetration = pen;
                contactNormalX = worldNormX;
                contactNormalZ = worldNormZ;
                hitObstacleName = `${obs.name} (${cyl.name})`;
              }
              hasCollided = true;
            }
          }
        }
      }

      // Case B: Static World AABB Building / Barrier
      else if (obs.type === 'AABB') {
        if (carPos.x >= obs.minX - carRadius && carPos.x <= obs.maxX + carRadius &&
            carPos.z >= obs.minZ - carRadius && carPos.z <= obs.maxZ + carRadius) {
          
          const penLeft = (carPos.x + carRadius) - obs.minX;
          const penRight = obs.maxX - (carPos.x - carRadius);
          const penBack = (carPos.z + carRadius) - obs.minZ;
          const penFront = obs.maxZ - (carPos.z - carRadius);

          const minPen = Math.min(penLeft, penRight, penBack, penFront);

          if (minPen > 0) {
            let normX = 0;
            let normZ = 0;

            if (minPen === penLeft) normX = -1;
            else if (minPen === penRight) normX = 1;
            else if (minPen === penBack) normZ = -1;
            else normZ = 1;

            totalPushX += normX * minPen;
            totalPushZ += normZ * minPen;
            if (minPen > maxPenetration) {
              maxPenetration = minPen;
              contactNormalX = normX;
              contactNormalZ = normZ;
              hitObstacleName = obs.name;
            }
            hasCollided = true;
          }
        }
      }

      // Case C: Cylindrical / Circular Solid Obstacles (Pillars, Masts, Spires, Megaliths)
      else if (obs.type === 'CYLINDER' || obs.type === 'CIRCLE') {
        const dx = carPos.x - obs.x;
        const dz = carPos.z - obs.z;
        const distSq = dx * dx + dz * dz;
        const minDist = carRadius + obs.radius;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const pen = minDist - dist;
          const normX = dist > 0.0001 ? dx / dist : 1.0;
          const normZ = dist > 0.0001 ? dz / dist : 0.0;

          totalPushX += normX * pen;
          totalPushZ += normZ * pen;
          if (pen > maxPenetration) {
            maxPenetration = pen;
            contactNormalX = normX;
            contactNormalZ = normZ;
            hitObstacleName = obs.name;
          }
          hasCollided = true;
        }
      }

      // Case D: Oriented Bounding Box (OBB) (Angled Canyon Bluffs & Gorge Walls)
      else if (obs.type === 'OBB') {
        const dx = carPos.x - obs.x;
        const dz = carPos.z - obs.z;
        const lx = dx * obs.cosA - dz * obs.sinA;
        const lz = dx * obs.sinA + dz * obs.cosA;

        if (lx >= -obs.hx - carRadius && lx <= obs.hx + carRadius &&
            lz >= -obs.hz - carRadius && lz <= obs.hz + carRadius) {
          const penLeft = (lx + carRadius) - (-obs.hx);
          const penRight = obs.hx - (lx - carRadius);
          const penBottom = (lz + carRadius) - (-obs.hz);
          const penTop = obs.hz - (lz - carRadius);

          const minPen = Math.min(penLeft, penRight, penBottom, penTop);

          if (minPen > 0) {
            let localNormX = 0;
            let localNormZ = 0;

            if (minPen === penLeft) localNormX = -1;
            else if (minPen === penRight) localNormX = 1;
            else if (minPen === penBottom) localNormZ = -1;
            else localNormZ = 1;

            const worldNormX = localNormX * obs.cosW - localNormZ * obs.sinW;
            const worldNormZ = localNormX * obs.sinW + localNormZ * obs.cosW;

            totalPushX += worldNormX * minPen;
            totalPushZ += worldNormZ * minPen;
            if (minPen > maxPenetration) {
              maxPenetration = minPen;
              contactNormalX = worldNormX;
              contactNormalZ = worldNormZ;
              hitObstacleName = obs.name;
            }
            hasCollided = true;
          }
        }
      }
    }

    if (!hasCollided) return null;

    const res = this._collisionResult;
    res.collided = true;
    res.pushX = totalPushX;
    res.pushZ = totalPushZ;
    res.normalX = contactNormalX;
    res.normalZ = contactNormalZ;
    res.penetration = maxPenetration;
    res.name = hitObstacleName;
    return res;
  }
}
