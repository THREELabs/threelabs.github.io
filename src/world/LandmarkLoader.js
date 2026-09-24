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
    const getPos = (z, lat = 0, y = 0) => {
      if (this.splineRoad && typeof this.splineRoad.getRoadTransformAtZ === 'function') {
        const tf = this.splineRoad.getRoadTransformAtZ(z, lat, y, false);
        return tf.pos;
      }
      return new THREE.Vector3(lat, y, z);
    };

    this.landmarksList = [
      // Zone 0: Mojave Desert (0 - 6500m)
      { id: 'bottle_tree', pos: getPos(600, -25, 0), name: "Elmer's Bottle Tree Ranch", radius: 75 },
      { id: 'wigwam_motel', pos: getPos(1250, 26, 0), name: 'Wigwam Village Motel', radius: 75 },
      { id: 'route66_diner', pos: getPos(1900, 25, 0), name: 'Route 66 Neon Diner', radius: 75 },
      { id: 'coyote_ridge', pos: getPos(2550, -28, 0), name: 'Coyote Ridge 4x4 Trailhead', radius: 80 },
      { id: 'mojave_mesas', pos: getPos(3850, -26, 0), name: 'Mojave Mesas & Highway Stone Arch', radius: 80 },
      { id: 'cabazon_dinos', pos: getPos(4500, -35, 0), name: 'Cabazon Giant Dinosaurs', radius: 80 },
      { id: 'desert_outlets', pos: getPos(5150, 36, 0), name: 'Desert Hills Premium Outlets Plaza', radius: 80 },
      { id: 'calico_ghost', pos: getPos(5700, 22, 0), name: 'Calico Ghost Town Historical Overlook', radius: 75 },
      { id: 'roys_motel', pos: getPos(6300, 36, 0), name: "Roy's Motel Neon Sign", radius: 80 },

      // Zone 1: Malibu & PCH (6500 - 14500m)
      { id: 'muscle_beach', pos: getPos(7050, -22, 2), name: 'Original Santa Monica Muscle Beach', radius: 75 },
      { id: 'santa_monica_pier', pos: getPos(7600, -28, 2), name: 'Santa Monica Pier Yacht Harbor Arch', radius: 80 },
      { id: 'santa_monica_arch', pos: getPos(7600, 0, 2), name: 'Santa Monica Pier Yacht Harbor Arch', radius: 80 },
      { id: 'california_incline', pos: getPos(8150, 25, 12), name: 'California Incline & Palisades Bluffs', radius: 80 },
      { id: 'pacific_park', pos: getPos(8700, -35, 2), name: 'Pacific Park Solar Wheel & Pier', radius: 85 },
      { id: 'will_rogers', pos: getPos(9250, -25, 2), name: 'Will Rogers State Beach & Baywatch HQ', radius: 75 },
      { id: 'getty_villa', pos: getPos(9800, 38, 16), name: 'The Getty Villa Roman Colonnade', radius: 80 },
      { id: 'topanga_canyon', pos: getPos(10350, 24, 4), name: 'Topanga Beach Surf Shack & VW Bus', radius: 75 },
      { id: 'malibu_pier', pos: getPos(11200, -35, 2), name: 'Malibu Pier & Surfrider Beach', radius: 80 },
      { id: 'carbon_beach', pos: getPos(11800, -25, 3), name: 'Carbon Beach Stilt Mansions', radius: 75 },
      { id: 'zuma_beach', pos: getPos(12400, -25, 2), name: 'Zuma Beach Lifeguard Tower 26', radius: 75 },
      { id: 'point_dume', pos: getPos(12950, -32, 8), name: 'Point Dume Marine Nature Reserve', radius: 80 },
      { id: 'el_matador', pos: getPos(13500, -30, 3), name: 'El Matador Sea Arches', radius: 80 },
      { id: 'neptunes_net', pos: getPos(14000, 22, 3), name: "Neptune's Net Seafood Roadhouse", radius: 75 },
      { id: 'point_mugu', pos: getPos(14400, 0, 3), name: 'Point Mugu Rock Bluff Cut', radius: 85 },

      // Zone 2: Big Sur (14500 - 20500m)
      { id: 'big_sur_inn', pos: getPos(15100, 20, 14), name: 'Big Sur River Inn', radius: 75 },
      { id: 'hurricane_point', pos: getPos(15800, -28, 18), name: 'Hurricane Point Ocean Vista', radius: 80 },
      { id: 'mcway_falls', pos: getPos(16500, -35, 10), name: 'McWay Falls Waterfall Cove', radius: 80 },
      { id: 'henry_miller', pos: getPos(17200, 24, 12), name: 'Henry Miller Library in the Pines', radius: 75 },
      { id: 'nepenthe', pos: getPos(17900, -30, 24), name: 'Nepenthe Cliffside Restaurant', radius: 75 },
      { id: 'bixby_bridge', pos: getPos(18650, 0, 36), name: 'Bixby Creek Arch Bridge', radius: 90 },
      { id: 'pfeiffer_arch', pos: getPos(19400, -45, 10), name: 'Pfeiffer Beach Keyhole Arch', radius: 80 },
      { id: 'point_sur_light', pos: getPos(20150, -55, 20), name: 'Point Sur Historic Lightstation', radius: 90 },

      // Zone 3: Monterey & Carmel (20500 - 25500m)
      { id: 'cannery_row', pos: getPos(21300, 0, 8), name: 'Cannery Row & Monterey Bay Aquarium', radius: 80 },
      { id: 'pebble_beach', pos: getPos(22250, -30, 5), name: 'Pebble Beach Golf Links', radius: 75 },
      { id: 'lone_cypress', pos: getPos(23200, -50, 8), name: '17-Mile Drive The Lone Cypress', radius: 85 },
      { id: 'carmel_cottages', pos: getPos(24150, 25, 6), name: 'Carmel Storybook Thatched Cottages', radius: 75 },
      { id: 'carmel_mission', pos: getPos(25100, 28, 5), name: 'Carmel Mission Basilica (1797)', radius: 80 },

      // Zone 4: NorCal & Marin (25500 - 31000m)
      { id: 'painted_ladies', pos: getPos(26300, 30, 16), name: 'SF Painted Ladies Victorian Row', radius: 75 },
      { id: 'cable_car', pos: getPos(27150, 15, 16), name: 'San Francisco Historic Cable Car', radius: 70 },
      { id: 'marin_headlands', pos: getPos(28000, -30, 18), name: 'Marin Headlands Artillery Bunkers', radius: 80 },
      { id: 'golden_gate', pos: getPos(28900, 0, 22), name: 'Golden Gate Suspension Bridge', radius: 100 },
      { id: 'sonoma_vineyard', pos: getPos(29800, 30, 12), name: 'Sonoma Valley Mission Chateau & Vineyards', radius: 80 },
      { id: 'bodega_church', pos: getPos(30650, -25, 14), name: 'Bodega Bay St. Teresa Church', radius: 75 },

      // Zone 5: Redwood Forest (31000 - 36000m)
      { id: 'covered_bridge', pos: getPos(31850, 0, 7), name: 'Redwood Creek Covered Timber Bridge', radius: 75 },
      { id: 'chandelier_tree', pos: getPos(32800, 18, 6), name: 'Chandelier Drive-Thru Redwood', radius: 80 },
      { id: 'carson_mansion', pos: getPos(33750, 32, 8), name: 'Carson Mansion Eureka Victorian', radius: 85 },
      { id: 'bigfoot_museum', pos: getPos(34700, -22, 6), name: 'Legend of Bigfoot Curiosity Museum', radius: 75 },
      { id: 'sawmill_camp', pos: getPos(35600, 24, 5), name: 'Redwood Logging Sawmill & Steam Donkey', radius: 75 },

      // Zone 6: Oregon Coast (36000 - 40500m)
      { id: 'yaquina_light', pos: getPos(36900, -55, 15), name: 'Yaquina Head Lighthouse', radius: 85 },
      { id: 'haystack_rock', pos: getPos(37950, -65, 5), name: 'Haystack Rock & The Needles (Cannon Beach)', radius: 90 },
      { id: 'driftwood_caves', pos: getPos(39000, -30, 2), name: 'Oregon Driftwood Beach & Sea Caves', radius: 75 },
      { id: 'tillamook_barn', pos: getPos(40050, 32, 3), name: 'Tillamook Cheese Creamery & Giant Barn', radius: 85 },

      // Zone 7: Columbia River Gorge (40500 - 45000m)
      { id: 'bridge_of_gods', pos: getPos(41400, -20, 18), name: 'Bridge of the Gods Steel Cantilever Span', radius: 90 },
      { id: 'multnomah_falls', pos: getPos(42450, 40, 18), name: 'Multnomah Falls & Benson Stone Bridge', radius: 90 },
      { id: 'bonneville_dam', pos: getPos(43500, -30, 12), name: 'Bonneville Hydroelectric Dam Spillway', radius: 85 },
      { id: 'vista_house', pos: getPos(44550, -32, 24), name: 'Vista House at Crown Point (1918 Rotunda)', radius: 90 },

      // Zone 8: Washington & Olympic (45000 - 49500m)
      { id: 'snoqualmie_falls', pos: getPos(45900, 35, 8), name: 'Snoqualmie Falls & Great Northern Lodge', radius: 85 },
      { id: 'puget_ferry', pos: getPos(46950, -80, 0), name: 'Washington State Jumbo Puget Sound Ferry', radius: 90 },
      { id: 'space_needle', pos: getPos(48000, -55, 8), name: 'Seattle Space Needle & Mount Rainier', radius: 100 },
      { id: 'pike_place', pos: getPos(49050, 28, 4), name: 'Pike Place Public Market & Neon Clock', radius: 80 },

      // Zone 9: Cascade Pass & Mount Rainier (49500 - 53500m)
      { id: 'paradise_lodge', pos: getPos(50700, 45, 32), name: 'Paradise Historic Timber Lodge (1916)', radius: 90 },
      { id: 'narada_falls', pos: getPos(52300, -42, 48), name: 'Narada Falls Basalt Chasm', radius: 90 },
      { id: 'rainier_summit', pos: getPos(53100, 35, 56), name: 'Mount Rainier Glacier Summit Overlook', radius: 100 },

      // Zone 10: Idaho Panhandle & Lake Coeur d'Alene (53500 - 57500m)
      { id: 'coeur_dalene_boardwalk', pos: getPos(54700, -35, 10), name: "Lake Coeur d'Alene Floating Boardwalk & Marina", radius: 90 },
      { id: 'cataldo_mission', pos: getPos(56300, 35, 12), name: "Cataldo Old Mission — Idaho's Oldest Building (1853)", radius: 85 },
      { id: 'silver_valley_mine', pos: getPos(57100, 32, 14), name: "Silver Valley Mine Headframe & Ore Chutes", radius: 85 },

      // Zone 11: Montana Big Sky & Glacier (57500 - 62000m)
      { id: 'lake_mcdonald', pos: getPos(58800, -45, 16), name: "Lake McDonald Cedar Chalets & Colored Pebbles", radius: 90 },
      { id: 'weeping_wall', pos: getPos(60000, 25, 24), name: "The Weeping Wall & Triple Stone Arches", radius: 90 },
      { id: 'logan_pass', pos: getPos(61200, 0, 30), name: "Logan Pass Continental Divide (6,646 ft)", radius: 100 },

      // Zone 12: Las Vegas Strip & Red Rock Canyon (62000 - 66500m)
      { id: 'vegas_sign', pos: getPos(63100, -28, 0), name: "Welcome to Fabulous Las Vegas Sign", radius: 90 },
      { id: 'strip_pyramid_fountains', pos: getPos(64300, 45, 0), name: "The Strip: Luxor Pyramid & Bellagio Dancing Fountains", radius: 100 },
      { id: 'red_rock_escarpment', pos: getPos(65500, -45, 12), name: "Red Rock Canyon Aztec Sandstone Escarpment", radius: 95 }
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
