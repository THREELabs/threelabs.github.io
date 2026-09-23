import * as THREE from 'three';
import { gameState } from '../state.js';

export class LandmarkLoader {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.landmarksList = [];

    this.registerAllDiscoveryTriggers();
  }

  registerAllDiscoveryTriggers() {
    this.landmarksList = [
      // Zone 0: Desert (0 - 2600m)
      { id: 'bottle_tree', pos: new THREE.Vector3(-25, 0, 350), name: "Elmer's Bottle Tree Ranch", radius: 70 },
      { id: 'wigwam_motel', pos: new THREE.Vector3(26, 0, 420), name: 'Wigwam Village Motel', radius: 70 },
      { id: 'route66_diner', pos: new THREE.Vector3(25, 0, 750), name: 'Route 66 Neon Diner', radius: 70 },
      { id: 'mojave_mesas', pos: new THREE.Vector3(-26, 0, 1420), name: 'Mojave Mesas & Highway Stone Arch', radius: 75 },
      { id: 'cabazon_dinos', pos: new THREE.Vector3(-35, 0, 1550), name: 'Cabazon Giant Dinosaurs', radius: 75 },
      { id: 'desert_outlets', pos: new THREE.Vector3(36, 0, 1615), name: 'Desert Hills Premium Outlets Plaza', radius: 75 },
      { id: 'calico_ghost', pos: new THREE.Vector3(22, 0, 1900), name: 'Calico Ghost Town Historical Overlook', radius: 70 },
      { id: 'roys_motel', pos: new THREE.Vector3(36, 0, 2300), name: "Roy's Motel Neon Sign", radius: 75 },

      // Zone 1: Malibu & PCH (2600 - 5200m)
      { id: 'muscle_beach', pos: new THREE.Vector3(-22, 2, 2700), name: 'Original Santa Monica Muscle Beach', radius: 65 },
      { id: 'santa_monica_arch', pos: new THREE.Vector3(0, 2, 2750), name: 'Santa Monica Pier Yacht Harbor Arch', radius: 70 },
      { id: 'california_incline', pos: new THREE.Vector3(25, 12, 2820), name: 'California Incline & Palisades Bluffs', radius: 75 },
      { id: 'pacific_park', pos: new THREE.Vector3(-35, 2, 2900), name: 'Pacific Park Solar Wheel & Pier', radius: 80 },
      { id: 'will_rogers', pos: new THREE.Vector3(-25, 2, 3200), name: 'Will Rogers State Beach & Baywatch HQ', radius: 70 },
      { id: 'getty_villa', pos: new THREE.Vector3(38, 16, 3500), name: 'The Getty Villa Roman Colonnade', radius: 75 },
      { id: 'topanga_canyon', pos: new THREE.Vector3(24, 4, 3800), name: 'Topanga Beach Surf Shack & VW Bus', radius: 70 },
      { id: 'malibu_pier', pos: new THREE.Vector3(-35, 2, 4100), name: 'Malibu Pier & Surfrider Beach', radius: 75 },
      { id: 'carbon_beach', pos: new THREE.Vector3(-25, 3, 4400), name: "Carbon Beach Stilt Mansions", radius: 70 },
      { id: 'zuma_beach', pos: new THREE.Vector3(-25, 2, 4650), name: 'Zuma Beach Lifeguard Tower 26', radius: 70 },
      { id: 'point_dume', pos: new THREE.Vector3(-32, 8, 4800), name: 'Point Dume Marine Nature Reserve', radius: 75 },
      { id: 'el_matador', pos: new THREE.Vector3(-30, 3, 4950), name: 'El Matador Sea Arches', radius: 75 },
      { id: 'neptunes_net', pos: new THREE.Vector3(22, 3, 5050), name: "Neptune's Net Seafood Roadhouse", radius: 65 },
      { id: 'point_mugu', pos: new THREE.Vector3(0, 3, 5150), name: 'Point Mugu Rock Bluff Cut', radius: 80 },

      // Zone 2: Big Sur (5200 - 7800m)
      { id: 'big_sur_inn', pos: new THREE.Vector3(20, 14, 5550), name: 'Big Sur River Inn', radius: 65 },
      { id: 'hurricane_point', pos: new THREE.Vector3(-28, 18, 5700), name: 'Hurricane Point Ocean Vista', radius: 75 },
      { id: 'mcway_falls', pos: new THREE.Vector3(-35, 10, 5950), name: 'McWay Falls Waterfall Cove', radius: 75 },
      { id: 'henry_miller', pos: new THREE.Vector3(24, 12, 6150), name: 'Henry Miller Library in the Pines', radius: 70 },
      { id: 'nepenthe', pos: new THREE.Vector3(-30, 24, 6300), name: 'Nepenthe Cliffside Restaurant', radius: 70 },
      { id: 'bixby_bridge', pos: new THREE.Vector3(0, 36, 6650), name: 'Bixby Creek Arch Bridge', radius: 85 },
      { id: 'pfeiffer_arch', pos: new THREE.Vector3(-45, 10, 7100), name: 'Pfeiffer Beach Keyhole Arch', radius: 75 },
      { id: 'point_sur_light', pos: new THREE.Vector3(-55, 20, 7550), name: 'Point Sur Historic Lightstation', radius: 85 },

      // Zone 3: Monterey & Carmel (7800 - 10400m)
      { id: 'cannery_row', pos: new THREE.Vector3(0, 8, 8300), name: 'Cannery Row & Monterey Bay Aquarium', radius: 75 },
      { id: 'pebble_beach', pos: new THREE.Vector3(-30, 5, 8800), name: 'Pebble Beach Golf Links', radius: 70 },
      { id: 'lone_cypress', pos: new THREE.Vector3(-50, 8, 9300), name: '17-Mile Drive The Lone Cypress', radius: 80 },
      { id: 'carmel_cottages', pos: new THREE.Vector3(25, 6, 9750), name: 'Carmel Storybook Thatched Cottages', radius: 65 },
      { id: 'carmel_mission', pos: new THREE.Vector3(28, 5, 10150), name: 'Carmel Mission Basilica (1797)', radius: 75 },

      // Zone 4: NorCal & Marin (10400 - 13000m)
      { id: 'painted_ladies', pos: new THREE.Vector3(30, 16, 10800), name: 'SF Painted Ladies Victorian Row', radius: 70 },
      { id: 'cable_car', pos: new THREE.Vector3(15, 16, 11100), name: 'San Francisco Historic Cable Car', radius: 60 },
      { id: 'marin_headlands', pos: new THREE.Vector3(-30, 18, 11400), name: 'Marin Headlands Artillery Bunkers', radius: 75 },
      { id: 'golden_gate', pos: new THREE.Vector3(0, 22, 11700), name: 'Golden Gate Suspension Bridge', radius: 95 },
      { id: 'sonoma_vineyard', pos: new THREE.Vector3(30, 12, 12400), name: 'Sonoma Valley Mission Chateau & Vineyards', radius: 75 },
      { id: 'bodega_church', pos: new THREE.Vector3(-25, 14, 12800), name: 'Bodega Bay St. Teresa Church', radius: 70 },

      // Zone 5: Redwood Forest (13000 - 15600m)
      { id: 'covered_bridge', pos: new THREE.Vector3(0, 7, 13450), name: 'Redwood Creek Covered Timber Bridge', radius: 65 },
      { id: 'chandelier_tree', pos: new THREE.Vector3(18, 6, 13900), name: 'Chandelier Drive-Thru Redwood', radius: 75 },
      { id: 'carson_mansion', pos: new THREE.Vector3(32, 8, 14400), name: 'Carson Mansion Eureka Victorian', radius: 80 },
      { id: 'bigfoot_museum', pos: new THREE.Vector3(-22, 6, 14950), name: 'Legend of Bigfoot Curiosity Museum', radius: 70 },
      { id: 'sawmill_camp', pos: new THREE.Vector3(24, 5, 15400), name: 'Redwood Logging Sawmill & Steam Donkey', radius: 65 },

      // Zone 6: Oregon Coast (15600 - 18200m)
      { id: 'yaquina_light', pos: new THREE.Vector3(-55, 15, 16100), name: 'Yaquina Head Lighthouse', radius: 80 },
      { id: 'haystack_rock', pos: new THREE.Vector3(-65, 5, 16600), name: 'Haystack Rock & The Needles (Cannon Beach)', radius: 85 },
      { id: 'driftwood_caves', pos: new THREE.Vector3(-30, 2, 17200), name: 'Oregon Driftwood Beach & Sea Caves', radius: 70 },
      { id: 'tillamook_barn', pos: new THREE.Vector3(32, 3, 17800), name: 'Tillamook Cheese Creamery & Giant Barn', radius: 80 },

      // Zone 7: Columbia River Gorge (18200 - 20800m)
      { id: 'bridge_of_gods', pos: new THREE.Vector3(-20, 18, 18650), name: 'Bridge of the Gods Steel Cantilever Span', radius: 85 },
      { id: 'multnomah_falls', pos: new THREE.Vector3(40, 18, 19250), name: 'Multnomah Falls & Benson Stone Bridge', radius: 85 },
      { id: 'bonneville_dam', pos: new THREE.Vector3(-30, 12, 19850), name: 'Bonneville Hydroelectric Dam Spillway', radius: 80 },
      { id: 'vista_house', pos: new THREE.Vector3(-32, 24, 20450), name: 'Vista House at Crown Point (1918 Rotunda)', radius: 85 },

      // Zone 8: Washington & Olympic (20800 - 23400m)
      { id: 'snoqualmie_falls', pos: new THREE.Vector3(35, 8, 21350), name: 'Snoqualmie Falls & Great Northern Lodge', radius: 80 },
      { id: 'puget_ferry', pos: new THREE.Vector3(-80, 0, 21950), name: 'Washington State Jumbo Puget Sound Ferry', radius: 85 },
      { id: 'space_needle', pos: new THREE.Vector3(-55, 8, 22550), name: 'Seattle Space Needle & Mount Rainier', radius: 95 },
      { id: 'pike_place', pos: new THREE.Vector3(28, 4, 23100), name: 'Pike Place Public Market & Neon Clock', radius: 75 },

      // Zone 9: Cascade Pass & Mount Rainier (23400 - 26000m)
      { id: 'paradise_lodge', pos: new THREE.Vector3(45, 32, 24100), name: 'Paradise Historic Timber Lodge (1916)', radius: 85 },
      { id: 'narada_falls', pos: new THREE.Vector3(-42, 48, 24900), name: 'Narada Falls Basalt Chasm', radius: 85 },
      { id: 'rainier_summit', pos: new THREE.Vector3(35, 56, 25600), name: 'Mount Rainier Glacier Summit Overlook', radius: 95 }
    ];
  }

  update(dt, playerPos) {
    this.landmarksList.forEach(lm => {
      const dist = playerPos.distanceTo(lm.pos);
      if (dist < lm.radius) {
        if (!gameState.discoveredLandmarks.has(lm.id)) {
          gameState.discoveredLandmarks.add(lm.id);
          gameState.currentLookout = lm;
          console.log('🌟 Landmark Discovered:', lm.name);
        }
      }
    });
  }
}
