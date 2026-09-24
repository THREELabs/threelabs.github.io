import * as THREE from 'three';
import { ROAD, TOTAL_HIGHWAY_LENGTH } from '../constants.js';
import { gameState } from '../state.js';
import { calculateTerrainHeight } from './TerrainHeight.js';
import { ZONE_CLUES_CONFIG } from './MysteryCrimeScene.js';
import { DownhillSpline } from './DownhillSpline.js';

export const SCENIC_PARKING_LOTS = [
  // ── Zone 0: Mojave Desert (0 - 6500m) ──────────────────────────────
  {
    id: 'turnout_bottle_tree',
    zone: 0,
    name: "Elmer's Bottle Tree Ranch",
    sub: 'Folk Art & Welded Bottle Tree Forest',
    z: 600,
    side: 'left',
    xOffset: -25.0,
    width: 22.0,
    length: 48.0,
    theme: 'desert_timber',
    viewDir: 'left'
  },
  {
    id: 'turnout_wigwam_motel',
    zone: 0,
    name: 'Wigwam Village Motel',
    sub: 'Route 66 Historic Teepee Courtyard',
    z: 1250,
    side: 'right',
    xOffset: 26.0,
    width: 22.0,
    length: 48.0,
    theme: 'desert_timber',
    viewDir: 'right'
  },
  {
    id: 'turnout_route66_diner',
    zone: 0,
    name: 'Route 66 Neon Diner & Vintage Gas',
    sub: 'Streamline Moderne Roadside Cafe',
    z: 1900,
    side: 'right',
    xOffset: 26.0,
    width: 24.0,
    length: 50.0,
    theme: 'desert_timber',
    viewDir: 'right'
  },
  {
    id: 'turnout_coyote_ridge',
    zone: 0,
    name: 'Coyote Ridge 4x4 Trailhead',
    sub: 'Rocky Mountain Trail & Panoramic Desert Vista',
    z: 2550,
    side: 'left',
    xOffset: -18.0,
    width: 24.0,
    length: 56.0,
    theme: 'desert_timber',
    viewDir: 'left'
  },
  {
    id: 'turnout_mojave_mesas',
    zone: 0,
    name: 'Mojave Mesas & Highway Stone Arch',
    sub: 'Natural Sandstone Arch Panorama',
    z: 3850,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'desert_timber',
    viewDir: 'left'
  },
  {
    id: 'turnout_cabazon_dinos',
    zone: 0,
    name: 'Cabazon Dinosaurs Lookout',
    sub: 'Dinny the Bronto & Mr. Rex Vista',
    z: 4500,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 52.0,
    theme: 'desert_timber',
    viewDir: 'left'
  },
  {
    id: 'turnout_desert_outlets',
    zone: 0,
    name: 'Desert Hills Outlets Plaza',
    sub: 'Spanish Stucco Arcade & Palm Court',
    z: 5150,
    side: 'right',
    xOffset: 27.0,
    width: 24.0,
    length: 50.0,
    theme: 'modern_plaza',
    viewDir: 'right'
  },
  {
    id: 'turnout_calico_ghost',
    zone: 0,
    name: 'Calico Ghost Town Historical Overlook',
    sub: 'Historic 1881 Silver Mining Ridge',
    z: 5700,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 46.0,
    theme: 'desert_timber',
    viewDir: 'right'
  },
  {
    id: 'turnout_roys_motel',
    zone: 0,
    name: "Roy's Motel & Neon Starburst",
    sub: 'Iconic Route 66 Googie Signpost',
    z: 6300,
    side: 'right',
    xOffset: 27.0,
    width: 24.0,
    length: 50.0,
    theme: 'desert_timber',
    viewDir: 'right'
  },

  // ── Zone 1: Malibu & PCH (6500 - 14500m) ────────────────────────────
  {
    id: 'turnout_muscle_beach',
    zone: 1,
    name: 'Santa Monica Muscle Beach',
    sub: 'Original Calisthenics Boardwalk',
    z: 7050,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_santa_monica_pier',
    zone: 1,
    name: 'Santa Monica Pier Yacht Harbor',
    sub: 'Historic 1909 Ocean Pier & Arch',
    z: 7600,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_california_incline',
    zone: 1,
    name: 'California Incline & Palisades Bluffs',
    sub: 'Coastal Palisades Ocean Bluffs',
    z: 8150,
    side: 'right',
    xOffset: 26.0,
    width: 22.0,
    length: 48.0,
    theme: 'modern_plaza',
    viewDir: 'right'
  },
  {
    id: 'turnout_pacific_park',
    zone: 1,
    name: 'Pacific Park Pier & Solar Wheel',
    sub: 'Pacific Park Coaster & Ferris Wheel',
    z: 8700,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 52.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_will_rogers',
    zone: 1,
    name: 'Will Rogers State Beach & Baywatch HQ',
    sub: 'Lifeguard Headquarters & Surf Break',
    z: 9250,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_getty_villa',
    zone: 1,
    name: 'The Getty Villa Roman Colonnade',
    sub: 'Roman Peristyle & Hillside Gardens',
    z: 9800,
    side: 'right',
    xOffset: 28.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'right'
  },
  {
    id: 'turnout_topanga_canyon',
    zone: 1,
    name: 'Topanga Beach Surf Shack & VW Bus',
    sub: 'Bohemian Surfer Haven & Point Break',
    z: 10350,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 48.0,
    theme: 'coastal_boardwalk',
    viewDir: 'right'
  },
  {
    id: 'turnout_malibu_pier',
    zone: 1,
    name: 'Malibu Pier & Surfrider Beach',
    sub: 'Historic Twin White Pier Pavilions',
    z: 11200,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_carbon_beach',
    zone: 1,
    name: 'Carbon Beach Stilt Mansions',
    sub: "Modern Billionaires' Row Architecture",
    z: 11800,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_zuma_beach',
    zone: 1,
    name: 'Zuma Beach & Lifeguard Tower 26',
    sub: 'Pristine White Sands & Shorebreak',
    z: 12400,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_point_dume',
    zone: 1,
    name: 'Point Dume Marine Nature Reserve',
    sub: 'Coastal Headland & Whale Watching Bluff',
    z: 12950,
    side: 'left',
    xOffset: -27.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_el_matador',
    zone: 1,
    name: 'El Matador Sea Arches & Caves',
    sub: 'Cathedral Rock Natural Sea Portals',
    z: 13500,
    side: 'left',
    xOffset: -27.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_neptunes_net',
    zone: 1,
    name: "Neptune's Net Seafood Roadhouse",
    sub: 'Iconic Highway 1 Seafood Shack',
    z: 14000,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 48.0,
    theme: 'coastal_boardwalk',
    viewDir: 'right'
  },
  {
    id: 'turnout_point_mugu',
    zone: 1,
    name: 'Point Mugu Rock Bluff Cut',
    sub: 'Mountain Sea Cliff Highway Gateway',
    z: 14400,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },

  // ── Zone 2: Big Sur (14500 - 20500m) ─────────────────────────────────
  {
    id: 'turnout_big_sur_inn',
    zone: 2,
    name: 'Big Sur River Inn & Redwoods',
    sub: 'Rustic Mountain Lodge & River Deck',
    z: 15100,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 48.0,
    theme: 'timber_log',
    viewDir: 'right'
  },
  {
    id: 'turnout_hurricane_point',
    zone: 2,
    name: 'Hurricane Point Ocean Vista',
    sub: 'High-Altitude Big Sur Precipice',
    z: 15800,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_mcway_falls',
    zone: 2,
    name: 'McWay Falls Waterfall Cove',
    sub: '80-Foot Tidefall & Turquoise Inlet',
    z: 16500,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_henry_miller',
    zone: 2,
    name: 'Henry Miller Library in the Pines',
    sub: 'Bohemian Sculpture Garden in Redwoods',
    z: 17200,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 48.0,
    theme: 'timber_log',
    viewDir: 'right'
  },
  {
    id: 'turnout_nepenthe',
    zone: 2,
    name: 'Nepenthe Cliffside Vista Deck',
    sub: '800-Foot Ocean Panorama Dining',
    z: 17900,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_bixby_bridge',
    zone: 2,
    name: 'Bixby Creek Bridge North Vista',
    sub: 'Iconic Concrete Open-Spandrel Arch',
    z: 18650,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 52.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_pfeiffer_arch',
    zone: 2,
    name: 'Pfeiffer Beach Keyhole Arch Rock',
    sub: 'Natural Sea Arch & Purple Sand Beach',
    z: 19400,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_point_sur_light',
    zone: 2,
    name: 'Point Sur Historic Lightstation',
    sub: '1889 Volcanic Rock Lighthouse Crest',
    z: 20150,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 52.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },

  // ── Zone 3: Monterey & Carmel (20500 - 25500m) ──────────────────────
  {
    id: 'turnout_cannery_row',
    zone: 3,
    name: 'Cannery Row & Monterey Aquarium',
    sub: 'Steinbeck Historic Sardine Waterfront',
    z: 21300,
    side: 'left',
    xOffset: -27.0,
    width: 24.0,
    length: 50.0,
    theme: 'coastal_stone',
    viewDir: 'left'
  },
  {
    id: 'turnout_pebble_beach',
    zone: 3,
    name: 'Pebble Beach 18th Hole Ocean Vista',
    sub: 'World-Famous Coastal Links Fairway',
    z: 22250,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'coastal_stone',
    viewDir: 'left'
  },
  {
    id: 'turnout_lone_cypress',
    zone: 3,
    name: 'The Lone Cypress 250-Year Landmark',
    sub: 'Granite Cliff Icon on 17-Mile Drive',
    z: 23200,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'coastal_stone',
    viewDir: 'left'
  },
  {
    id: 'turnout_carmel_cottages',
    zone: 3,
    name: 'Carmel-by-the-Sea Fairytale Cottages',
    sub: 'Hugh Comstock Storybook Architecture',
    z: 24150,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 48.0,
    theme: 'timber_log',
    viewDir: 'right'
  },
  {
    id: 'turnout_carmel_mission',
    zone: 3,
    name: 'Carmel Mission Basilica San Carlos',
    sub: 'Historic 1797 Adobe Bell Tower & Quad',
    z: 25100,
    side: 'right',
    xOffset: 26.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'right'
  },

  // ── Zone 4: NorCal & Marin (25500 - 31000m) ────────────────────────
  {
    id: 'turnout_painted_ladies',
    zone: 4,
    name: 'SF Painted Ladies Victorian Row',
    sub: 'Alamo Square Pastel Mansions',
    z: 26300,
    side: 'right',
    xOffset: 26.0,
    width: 24.0,
    length: 50.0,
    theme: 'modern_plaza',
    viewDir: 'right'
  },
  {
    id: 'turnout_sf_cable_car',
    zone: 4,
    name: 'San Francisco Historic Cable Car',
    sub: '1890s Powell-Mason Wooden Turntable',
    z: 27150,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 48.0,
    theme: 'modern_plaza',
    viewDir: 'right'
  },
  {
    id: 'turnout_marin_headlands',
    zone: 4,
    name: 'Marin Headlands Coastal Bunkers',
    sub: 'WWII Coastal Battery & Pacific Straits',
    z: 28000,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_golden_gate',
    zone: 4,
    name: 'Golden Gate Bridge Vista Plaza',
    sub: 'International Orange Suspension Towers',
    z: 28900,
    side: 'right',
    xOffset: 28.0,
    width: 26.0,
    length: 54.0,
    theme: 'modern_plaza',
    viewDir: 'left'
  },
  {
    id: 'turnout_sonoma_vineyard',
    zone: 4,
    name: 'Sonoma Mission Chateau & Vineyards',
    sub: 'Rolling Wine Country Hillside Terraces',
    z: 29800,
    side: 'right',
    xOffset: 26.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'right'
  },
  {
    id: 'turnout_bodega_church',
    zone: 4,
    name: 'Bodega Bay & St. Teresa Church',
    sub: 'Historic 1859 White Steeple Parish',
    z: 30650,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'coastal_boardwalk',
    viewDir: 'left'
  },

  // ── Zone 5: Redwood Forest (31000 - 36000m) ────────────────────────
  {
    id: 'turnout_covered_bridge',
    zone: 5,
    name: 'Redwood Creek Covered Timber Bridge',
    sub: 'Cedar Shingle Historic Stream Crossing',
    z: 31850,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'timber_log',
    viewDir: 'left'
  },
  {
    id: 'turnout_chandelier_tree',
    zone: 5,
    name: 'Chandelier Drive-Thru Redwood Tree',
    sub: '315-Foot Ancient Tunnel Tree',
    z: 32800,
    side: 'right',
    xOffset: 25.0,
    width: 22.0,
    length: 48.0,
    theme: 'timber_log',
    viewDir: 'right'
  },
  {
    id: 'turnout_carson_mansion',
    zone: 5,
    name: 'Carson Mansion Eureka Victorian',
    sub: 'Historic Queen Anne Redwood Estate',
    z: 33750,
    side: 'right',
    xOffset: 27.0,
    width: 24.0,
    length: 50.0,
    theme: 'timber_log',
    viewDir: 'right'
  },
  {
    id: 'turnout_bigfoot_museum',
    zone: 5,
    name: 'Legend of Bigfoot Forest Museum',
    sub: 'Sasquatch Carvings & Forest Lore',
    z: 34700,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'timber_log',
    viewDir: 'left'
  },
  {
    id: 'turnout_sawmill_camp',
    zone: 5,
    name: 'Redwood Sawmill & Steam Donkey Camp',
    sub: 'Historic 19th Century Steam Logging',
    z: 35600,
    side: 'right',
    xOffset: 26.0,
    width: 24.0,
    length: 48.0,
    theme: 'timber_log',
    viewDir: 'right'
  },

  // ── Zone 6: Oregon Coast (36000 - 40500m) ──────────────────────────
  {
    id: 'turnout_yaquina_light',
    zone: 6,
    name: 'Yaquina Head Lighthouse & Cobble Beach',
    sub: '93-Foot Coastal Beacon & Headlands',
    z: 36900,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 52.0,
    theme: 'driftwood_timber',
    viewDir: 'left'
  },
  {
    id: 'turnout_haystack_rock',
    zone: 6,
    name: 'Haystack Rock & The Needles Overlook',
    sub: '235-Foot Marine Monolith Sea Stack',
    z: 37950,
    side: 'left',
    xOffset: -29.0,
    width: 26.0,
    length: 54.0,
    theme: 'driftwood_timber',
    viewDir: 'left'
  },
  {
    id: 'turnout_driftwood_caves',
    zone: 6,
    name: 'Oregon Driftwood Beach & Sea Caves',
    sub: 'Pacific Tide Pools & Weathered Logs',
    z: 39000,
    side: 'left',
    xOffset: -26.0,
    width: 22.0,
    length: 48.0,
    theme: 'driftwood_timber',
    viewDir: 'left'
  },
  {
    id: 'turnout_tillamook_barn',
    zone: 6,
    name: 'Tillamook Creamery & Historic Barn',
    sub: 'Oregon Valley Dairy & Yellow Barn',
    z: 40050,
    side: 'right',
    xOffset: 27.0,
    width: 24.0,
    length: 50.0,
    theme: 'driftwood_timber',
    viewDir: 'right'
  },

  // ── Zone 7: Columbia River Gorge (40500 - 45000m) ──────────────────
  {
    id: 'turnout_bridge_of_gods',
    zone: 7,
    name: 'Bridge of the Gods Steel Cantilever',
    sub: 'PCT Columbia River Mountain Span',
    z: 41400,
    side: 'left',
    xOffset: -26.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_multnomah_falls',
    zone: 7,
    name: 'Multnomah Falls 620-Foot Cascade',
    sub: 'Two-Tier Waterfall & Benson Stone Arch',
    z: 42450,
    side: 'right',
    xOffset: 28.0,
    width: 26.0,
    length: 54.0,
    theme: 'stone_masonry',
    viewDir: 'right'
  },
  {
    id: 'turnout_bonneville_dam',
    zone: 7,
    name: 'Bonneville Hydroelectric Dam Spillway',
    sub: 'Columbia River Spillway & Fish Ladders',
    z: 43500,
    side: 'left',
    xOffset: -27.0,
    width: 24.0,
    length: 50.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },
  {
    id: 'turnout_vista_house',
    zone: 7,
    name: 'Vista House at Crown Point (1918)',
    sub: '733-Foot Clifftop Marble Rotunda',
    z: 44550,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 52.0,
    theme: 'stone_masonry',
    viewDir: 'left'
  },

  // ── Zone 8: Washington & Olympic (45000 - 49500m) ──────────────────
  {
    id: 'turnout_snoqualmie_falls',
    zone: 8,
    name: 'Snoqualmie Falls & Salish Mountain Lodge',
    sub: '268-Foot Roaring Cascade & River Gorge',
    z: 45900,
    side: 'right',
    xOffset: 27.0,
    width: 24.0,
    length: 52.0,
    theme: 'urban_esplanade',
    viewDir: 'right'
  },
  {
    id: 'turnout_puget_ferry',
    zone: 8,
    name: 'Puget Sound Jumbo Ferry Dock',
    sub: 'Washington State Jumbo Ferry Crossing',
    z: 46950,
    side: 'left',
    xOffset: -28.0,
    width: 24.0,
    length: 52.0,
    theme: 'urban_esplanade',
    viewDir: 'left'
  },
  {
    id: 'turnout_space_needle',
    zone: 8,
    name: 'Seattle Space Needle & Mount Rainier Plaza',
    sub: '605-Foot Observation Spire & Skyline',
    z: 48000,
    side: 'left',
    xOffset: -29.0,
    width: 26.0,
    length: 54.0,
    theme: 'urban_esplanade',
    viewDir: 'left'
  },
  {
    id: 'turnout_pike_place',
    zone: 8,
    name: 'Pike Place Market & Historic Neon Clock',
    sub: 'Historic Farmers Market & Waterfront Esplanade',
    z: 49050,
    side: 'right',
    xOffset: 26.0,
    width: 24.0,
    length: 50.0,
    theme: 'urban_esplanade',
    viewDir: 'right'
  },

  // ── Zone 9: Cascade Pass & Mount Rainier (49500 - 53500m) ─────────
  {
    id: 'turnout_paradise_lodge',
    zone: 9,
    name: 'Paradise Historic Timber Lodge (1916)',
    sub: '5,420-Foot Subalpine Timber Landmark',
    z: 50700,
    side: 'right',
    xOffset: 26.0,
    width: 24.0,
    length: 52.0,
    theme: 'timber_lodge',
    viewDir: 'right'
  },
  {
    id: 'turnout_narada_falls',
    zone: 9,
    name: 'Narada Falls Basalt Chasm Overlook',
    sub: '176-Foot Columnar Basalt Glacial Cascade',
    z: 52300,
    side: 'left',
    xOffset: -27.0,
    width: 24.0,
    length: 52.0,
    theme: 'timber_lodge',
    viewDir: 'left'
  },
  {
    id: 'turnout_rainier_summit',
    zone: 9,
    name: 'Mount Rainier Glacier Summit Overlook',
    sub: '14,411-Foot Stratovolcano Icecap & Glacial Panorama',
    z: 53100,
    side: 'right',
    xOffset: 26.0,
    width: 26.0,
    length: 54.0,
    theme: 'timber_lodge',
    viewDir: 'right'
  },

  // ── Zone 10: Idaho Panhandle & Lake Coeur d'Alene (53500 - 57500m) ──
  {
    id: 'turnout_coeur_dalene_boardwalk',
    zone: 10,
    name: "Lake Coeur d'Alene Floating Boardwalk",
    sub: "Sapphire Lake Marina & Resort Promenade",
    z: 54700,
    side: 'left',
    xOffset: -27.0,
    width: 26.0,
    length: 56.0,
    theme: 'lakeside_boardwalk',
    viewDir: 'left'
  },
  {
    id: 'turnout_cataldo_mission',
    zone: 10,
    name: "Cataldo Old Mission (1853)",
    sub: "Idaho's Oldest Standing Building — Jesuit Frontier Church",
    z: 56300,
    side: 'right',
    xOffset: 27.0,
    width: 24.0,
    length: 52.0,
    theme: 'mission_adobe',
    viewDir: 'right'
  },
  {
    id: 'turnout_silver_valley_mine',
    zone: 10,
    name: "Silver Valley Mine Headframe & Ore Chutes",
    sub: "Historic Mining District Headframe & Timber Trestle",
    z: 57100,
    side: 'left',
    xOffset: -27.0,
    width: 24.0,
    length: 52.0,
    theme: 'mission_adobe',
    viewDir: 'left'
  },

  // ── Zone 11: Montana Big Sky & Glacier (57500 - 62000m) ──
  {
    id: 'turnout_lake_mcdonald',
    zone: 11,
    name: "Lake McDonald Glacial Vista & Colored Pebble Shore",
    sub: "1913 Swiss Chalet Cedar Lodge & Glacial Fjord Overlook",
    z: 58800,
    side: 'left',
    xOffset: -28.0,
    width: 26.0,
    length: 56.0,
    theme: 'timber_lodge',
    viewDir: 'left'
  },
  {
    id: 'turnout_weeping_wall',
    zone: 11,
    name: "The Weeping Wall & Triple Stone Arches",
    sub: "Rimrock Shelf Waterfall & Garden Wall Crest",
    z: 60000,
    side: 'left',
    xOffset: -28.0,
    width: 26.0,
    length: 56.0,
    theme: 'timber_lodge',
    viewDir: 'left'
  },
  {
    id: 'turnout_logan_pass',
    zone: 11,
    name: "Logan Pass Continental Divide (6,646 ft)",
    sub: "Crown of the Continent Alpine Visitor Center & Highline Trailhead",
    z: 61200,
    side: 'right',
    xOffset: 28.0,
    width: 28.0,
    length: 58.0,
    theme: 'timber_lodge',
    viewDir: 'right'
  },
  // ── Zone 12: Las Vegas Strip & Red Rock Canyon (62000 - 66500m) ──
  {
    id: 'turnout_vegas_sign',
    zone: 12,
    name: "Welcome to Fabulous Las Vegas Neon Sign",
    sub: "1959 Betty Willis Googie Neon Landmark & Turf Plaza",
    z: 63100,
    side: 'left',
    xOffset: -28.0,
    width: 26.0,
    length: 56.0,
    theme: 'desert_oasis',
    viewDir: 'left'
  },
  {
    id: 'turnout_red_rock_canyon',
    zone: 12,
    name: "Red Rock Canyon Sandstone Escarpment",
    sub: "Keystone Thrust & Aztec Sandstone Calico Hills Overlook",
    z: 65500,
    side: 'right',
    xOffset: 28.0,
    width: 28.0,
    length: 58.0,
    theme: 'stone_canyon',
    viewDir: 'right'
  }
];

// Calibrate each scenic parking lot lateral offset so its inner road-facing edge lines up flush with the highway shoulder edge
SCENIC_PARKING_LOTS.forEach(lot => {
  const roadHalfW = ROAD.HALF_WIDTH;
  lot.xOffset = lot.side === 'right' ? (roadHalfW + lot.width * 0.5) : -(roadHalfW + lot.width * 0.5);
});

export const AUTO_REPAIR_SHOPS = [
  {
    id: 'zone0_bay',
    zone: 0,
    name: 'Mojave Desert 24HR Garage',
    sub: 'Route 66 Vintage Speed Shop',
    z: 3200,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0xd97706,
    neonCol: 0xf97316
  },
  {
    id: 'zone1_bay',
    zone: 1,
    name: 'Malibu Coastal Speed & Tune',
    sub: 'Pacific Coast Highway Tuner Bay',
    z: 10750,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x0284c7,
    neonCol: 0x38bdf8
  },
  {
    id: 'zone2_bay',
    zone: 2,
    name: 'Big Sur Cliffside Auto Care',
    sub: 'Bixby Canyon Performance Pitstop',
    z: 17550,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x0f766e,
    neonCol: 0x2dd4bf
  },
  {
    id: 'zone3_bay',
    zone: 3,
    name: 'Monterey Bay Performance Bay',
    sub: 'Laguna Seca Speed Works',
    z: 22700,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x1d4ed8,
    neonCol: 0x60a5fa
  },
  {
    id: 'zone4_bay',
    zone: 4,
    name: 'Marin Headlands Service Depot',
    sub: 'Golden Gate Northbound Bay',
    z: 27600,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0xb91c1c,
    neonCol: 0xf87171
  },
  {
    id: 'zone5_bay',
    zone: 5,
    name: 'Redwood Creek Auto Care',
    sub: 'Avenue of Giants Forest Bay',
    z: 33300,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x15803d,
    neonCol: 0x4ade80
  },
  {
    id: 'zone6_bay',
    zone: 6,
    name: 'Oregon Pacific Coastal Garage',
    sub: 'Haystack Rock Marine Speed Shop',
    z: 38500,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x334155,
    neonCol: 0x38bdf8
  },
  {
    id: 'zone7_bay',
    zone: 7,
    name: 'Columbia Gorge Speed Works',
    sub: 'Bridge of the Gods Mountain Bay',
    z: 42950,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0xc2410c,
    neonCol: 0xfbbf24
  },
  {
    id: 'zone8_bay',
    zone: 8,
    name: 'Seattle Gateway Pitstop Garage',
    sub: 'Puget Sound Finish Line Auto Care',
    z: 47500,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x4338ca,
    neonCol: 0x818cf8
  },
  {
    id: 'zone9_bay',
    zone: 9,
    name: 'Mount Rainier Alpine Depot',
    sub: 'Paradise Glacier Mountain Bay',
    z: 51500,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x334155,
    neonCol: 0x38bdf8
  },
  {
    id: 'zone10_bay',
    zone: 10,
    name: "Coeur d'Alene Lakeside Speed Bay",
    sub: 'Silver Valley Performance Garage',
    z: 55500,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0x0f766e,
    neonCol: 0x2dd4bf
  },
  {
    id: 'zone11_bay',
    zone: 11,
    name: 'Glacier Pass Alpine Garage',
    sub: 'Going-to-the-Sun Mountain Works',
    z: 60000,
    side: 'right',
    xOffset: 28.0,
    width: 48.0,
    length: 84.0,
    radius: 24.0,
    wallCol: 0xb91c1c,
    neonCol: 0xf87171
  }
];

export class SplineRoad {
  constructor(renderer) {
    this.renderer = renderer;
    this.group = new THREE.Group();

    // Road Materials (Photorealistic PBR with Depth Polygon Offset for Crisp Overlay)
    this.matAsphalt = (() => {
      const tex = renderer.textures.asphaltPBR ? renderer.textures.asphaltPBR(512) : renderer.textures.asphalt(256);
      tex.repeat.set(4, 2);
      const normalTex = renderer.textures.asphaltNormalPBR ? renderer.textures.asphaltNormalPBR(512) : (renderer.textures.asphaltNormal ? renderer.textures.asphaltNormal(256) : null);
      if (normalTex) normalTex.repeat.set(4, 2);
      const m = new THREE.MeshStandardMaterial({
        color: 0x52565e,
        map: tex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(0.32, 0.32),
        roughness: 0.82,
        metalness: 0.05
      });
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1.0;
      m.polygonOffsetUnits = -1.0;
      return m;
    })();

    this.matAsphaltShoulder = (() => {
      const tex = renderer.textures.gravelShoulderPBR ? renderer.textures.gravelShoulderPBR(256) : null;
      if (tex) tex.repeat.set(6, 12);
      const norm = renderer.textures.gravelShoulderNormalPBR ? renderer.textures.gravelShoulderNormalPBR(256) : null;
      if (norm) norm.repeat.set(6, 12);
      return new THREE.MeshStandardMaterial({
        color: 0x8a7f72,
        map: tex,
        normalMap: norm,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.95,
        metalness: 0.02
      });
    })();

    const yellowStripeTex = renderer.textures.roadMarkingsPBR ? renderer.textures.roadMarkingsPBR('#facc15', 256) : null;
    if (yellowStripeTex) yellowStripeTex.repeat.set(1, 4);
    this.matLanes = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: yellowStripeTex,
      roughness: 0.55,
      metalness: 0.05
    });

    const whiteStripeTex = renderer.textures.roadMarkingsPBR ? renderer.textures.roadMarkingsPBR('#f8fafc', 256) : null;
    if (whiteStripeTex) whiteStripeTex.repeat.set(1, 4);
    this.matWhiteLanes = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: whiteStripeTex,
      roughness: 0.55,
      metalness: 0.05
    });

    this.matRumbleRed = renderer.createToonMaterial({ color: 0xef4444, gradientBands: 2 });
    this.matRumbleWhite = renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 2 });
    this.matTurnout = (() => {
      const tex = renderer.textures.asphaltPBR ? renderer.textures.asphaltPBR(512) : renderer.textures.asphalt(256);
      if (tex) {
        tex.repeat.set(4, 6);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      }
      const norm = renderer.textures.asphaltNormalPBR ? renderer.textures.asphaltNormalPBR(512) : null;
      if (norm) {
        norm.repeat.set(4, 6);
        norm.wrapS = norm.wrapT = THREE.RepeatWrapping;
      }
      const m = new THREE.MeshStandardMaterial({
        color: 0x484b54, // Authentic clean paved turnout asphalt
        map: tex,
        normalMap: norm,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.86,
        metalness: 0.04
      });
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1.0;
      m.polygonOffsetUnits = -1.0;
      return m;
    })();

    this.matParkingStripeWhite = this.matWhiteLanes;
    this.matParkingStripeYellow = this.matLanes;
    this.matParkingStripeBlue = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.matRubberBurnout = new THREE.MeshBasicMaterial({
      color: 0x111316,
      transparent: true,
      opacity: 0.76,
      depthWrite: false
    });

    // Weathered Wood Railings & Fences
    this.matWoodRailing = (() => {
      const tex = renderer.textures.weatheredWoodPBR ? renderer.textures.weatheredWoodPBR(512) : null;
      if (tex) tex.repeat.set(1, 4);
      const norm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;
      if (norm) norm.repeat.set(1, 4);
      return new THREE.MeshStandardMaterial({
        color: 0x7d6350,
        map: tex,
        normalMap: norm,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.88,
        metalness: 0.02
      });
    })();

    // Authentic Stone Masonry Walls
    this.matStoneWall = (() => {
      const tex = renderer.textures.stoneMasonryPBR ? renderer.textures.stoneMasonryPBR(512) : null;
      if (tex) tex.repeat.set(2, 1);
      const norm = renderer.textures.stoneMasonryNormalPBR ? renderer.textures.stoneMasonryNormalPBR(512) : null;
      if (norm) norm.repeat.set(2, 1);
      return new THREE.MeshStandardMaterial({
        color: 0x889098,
        map: tex,
        normalMap: norm,
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughness: 0.85,
        metalness: 0.05
      });
    })();

    // Realistic Concrete Curb for Parking Wheel Stops
    this.matCurb = (() => {
      const tex = renderer.textures.curbConcretePBR ? renderer.textures.curbConcretePBR(256) : null;
      if (tex) tex.repeat.set(2, 1);
      return new THREE.MeshStandardMaterial({
        color: 0xeab308,
        map: tex,
        roughness: 0.78,
        metalness: 0.05
      });
    })();

    this.matSignMetal = renderer.createToonMaterial({ color: 0x0284c7, gradientBands: 2 });
    this.matSignPost = renderer.createToonMaterial({ color: 0x334155, gradientBands: 2 });
    this.matTelescope = renderer.createToonMaterial({ color: 0x94a3b8, gradientBands: 2 });
    this.matSkidMark = new THREE.MeshBasicMaterial({ color: 0x111115, transparent: true, opacity: 0.55 });

    this.matBeaconHousing = renderer.createToonMaterial({ color: 0x0f172a, gradientBands: 2 });
    this.matLuminaireArm = renderer.createToonMaterial({ color: 0x475569, gradientBands: 2 });
    this.matLuminaireLight = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    // Highway Scenic Turnout Sign Materials & Active Warning Strobes
    this.matSignBacker = renderer.createToonMaterial({ color: 0x1e293b, gradientBands: 2 });
    this.matSignFrameGold = renderer.createToonMaterial({ color: 0xd97706, gradientBands: 2 });
    this.matSignBeaconA = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.matSignBeaconB = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Historical Plaque & Heritage Kiosk Materials
    this.matPlaqueTimber = this.matWoodRailing;
    this.matPlaqueBronze = renderer.createToonMaterial({ color: 0x9a7b4f, gradientBands: 3 });
    this.matPlaqueGold = renderer.createToonMaterial({ color: 0xf59e0b, gradientBands: 2 });
    this.matPlaqueBeacon = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.matPlaqueBeaconGlow = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

    // 3D Scenic Sky Beacon Materials (High-visibility celestial pillar & waypoint star)
    this.matSkyBeam = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.matSkyBeamCore = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // Interactive Plaque & Viewfinder Registries
    this.historicalPlaques = [];
    this.animatedPlaqueBeacons = [];
    this.scenicViewfinders = [];

    // Delineator Post Materials
    this.matPostWhite = renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 2 });
    this.matReflectorAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matReflectorWhite = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    this.roadWidth = ROAD.WIDTH; // Expansive 32-meter coastal highway (increased from 22.0m)
    this.splinePoints = [];
    this.curve = null;
    this.roadMesh = null;
    this.collidables = [];
    this.totalLength = TOTAL_HIGHWAY_LENGTH;

    // Spatial partitioning for highway markers (lines, studs, delineators, turnouts)
    this.chunkSize = 500;
    this.numChunks = Math.ceil(this.totalLength / this.chunkSize) + 2;
    this.roadChunks = [];
    for (let i = 0; i < this.numChunks; i++) {
      const chunkGroup = new THREE.Group();
      chunkGroup.name = `RoadChunk_${i}`;
      this.roadChunks.push(chunkGroup);
      this.group.add(chunkGroup);
    }
    this._lastRoadChunk = -1;

    this.generateScenicHighwaySpline();
    this.buildRoadMesh();
    this.buildStartStagingPlaza();
    this.buildReflectiveRoadStuds();
    this.buildScenicParkingLots();
    this.buildCurveDelineatorPosts();
    this.buildAsphaltSkidMarks();

    // Initial chunk visibility (first 2 chunks around start grid)
    for (let i = 0; i < this.numChunks; i++) {
      this.roadChunks[i].visible = (i <= 2);
    }
  }

  addToChunk(object, z) {
    const chunkIdx = Math.max(0, Math.min(this.numChunks - 1, Math.floor(z / this.chunkSize)));
    this.roadChunks[chunkIdx].add(object);
  }

  // Raised Reflective Pavement Markers (RPM / Cats-Eyes) (Instanced)
  buildReflectiveRoadStuds() {
    const studGeo = new THREE.BoxGeometry(0.18, 0.06, 0.18);
    const shoulderOffset = this.roadWidth * 0.5 - 1.2;

    const amberTransforms = [];
    const whiteTransforms = [];

    for (let z = 340; z < this.totalLength - 100; z += 24) {
      amberTransforms.push(this.getRoadTransformAtZ(z, 0, 0.14));

      [-shoulderOffset, shoulderOffset].forEach(sx => {
        whiteTransforms.push(this.getRoadTransformAtZ(z, sx, 0.14));
      });
    }

    const dummy = new THREE.Object3D();

    if (amberTransforms.length > 0) {
      const instAmber = new THREE.InstancedMesh(studGeo, this.matReflectorAmber, amberTransforms.length);
      instAmber.name = 'Instanced_RoadStudsAmber';
      amberTransforms.forEach((t, idx) => {
        dummy.position.copy(t.pos);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instAmber.setMatrixAt(idx, dummy.matrix);
      });
      instAmber.instanceMatrix.needsUpdate = true;
      this.group.add(instAmber);
    }

    if (whiteTransforms.length > 0) {
      const instWhite = new THREE.InstancedMesh(studGeo, this.matReflectorWhite, whiteTransforms.length);
      instWhite.name = 'Instanced_RoadStudsWhite';
      whiteTransforms.forEach((t, idx) => {
        dummy.position.copy(t.pos);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instWhite.setMatrixAt(idx, dummy.matrix);
      });
      instWhite.instanceMatrix.needsUpdate = true;
      this.group.add(instWhite);
    }
  }

  generateScenicHighwaySpline() {
    const points = [];

    // 1. Mojave Desert (0 - 6500m)
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(0, 0, 800));
    points.push(new THREE.Vector3(30, 2, 2200));
    points.push(new THREE.Vector3(-25, 3, 3800));
    points.push(new THREE.Vector3(35, 4, 5200));
    points.push(new THREE.Vector3(0, 2, 6500));

    // 2. Malibu & PCH (6500 - 14500m)
    points.push(new THREE.Vector3(-15, 2, 7500));
    points.push(new THREE.Vector3(14, 3, 8500));
    points.push(new THREE.Vector3(20, 3, 9500));
    points.push(new THREE.Vector3(-22, 2, 10500));
    points.push(new THREE.Vector3(-14, 3, 11800));
    points.push(new THREE.Vector3(-26, 2, 12600));
    points.push(new THREE.Vector3(16, 4, 13500));
    points.push(new THREE.Vector3(10, 3, 14000));
    points.push(new THREE.Vector3(0, 2, 14500));

    // 3. Big Sur (14500 - 20500m)
    points.push(new THREE.Vector3(-30, 18, 15500));
    points.push(new THREE.Vector3(0, 36, 18650));   // Bixby Arch Bridge
    points.push(new THREE.Vector3(40, 22, 19800));
    points.push(new THREE.Vector3(10, 12, 20500));

    // 4. Monterey Bay & Carmel (20500 - 25500m)
    points.push(new THREE.Vector3(-20, 8, 21500));  // Cannery Row
    points.push(new THREE.Vector3(30, 6, 23200));   // Lone Cypress
    points.push(new THREE.Vector3(10, 5, 25500));   // Carmel Mission

    // 5. Golden Gate & Marin (25500 - 31000m)
    points.push(new THREE.Vector3(40, 16, 27000));
    points.push(new THREE.Vector3(0, 22, 28900));   // Golden Gate Bridge
    points.push(new THREE.Vector3(-30, 14, 30500)); // Sonoma Valley
    points.push(new THREE.Vector3(0, 10, 31000));

    // 6. Redwood Forest (31000 - 36000m)
    points.push(new THREE.Vector3(-15, 8, 32000));
    points.push(new THREE.Vector3(20, 6, 33500));   // Chandelier Drive-Thru
    points.push(new THREE.Vector3(-10, 5, 35000));  // Bigfoot Museum
    points.push(new THREE.Vector3(0, 6, 36000));

    // 7. Oregon Coast (36000 - 40500m)
    points.push(new THREE.Vector3(30, 4, 37500));   // Haystack Rock
    points.push(new THREE.Vector3(50, 3, 39500));   // Tillamook Creamery
    points.push(new THREE.Vector3(20, 6, 40500));

    // 8. Columbia River Gorge (40500 - 45000m)
    points.push(new THREE.Vector3(30, 18, 42000));  // Multnomah Falls
    points.push(new THREE.Vector3(0, 12, 44000));   // Vista House
    points.push(new THREE.Vector3(10, 10, 45000));

    // 9. Washington Cascades & Puget Sound (45000 - 49500m)
    points.push(new THREE.Vector3(0, 8, 46500));
    points.push(new THREE.Vector3(0, 4, 48000));    // Space Needle / Pike Place
    points.push(new THREE.Vector3(15, 12, 49500));  // Cascade Gateway climb

    // 10. Cascade Pass & Mount Rainier (49500 - 53500m)
    points.push(new THREE.Vector3(45, 32, 50700));  // Hairpin climb to Paradise Lodge
    points.push(new THREE.Vector3(-30, 48, 52300)); // Narada Falls switchback
    points.push(new THREE.Vector3(0, 56, 53200));   // Rainier summit crest overlook
    points.push(new THREE.Vector3(0, 42, 53500));   // Zone boundary

    // 11. Idaho Panhandle & Lake Coeur d'Alene (53500 - 57500m)
    points.push(new THREE.Vector3(-35, 22, 54200)); // Descent into pine valley
    points.push(new THREE.Vector3(-55, 8, 54800));  // Lake Coeur d'Alene Floating Boardwalk
    points.push(new THREE.Vector3(-20, 4, 55600));  // Shoreline sweeping curve
    points.push(new THREE.Vector3(30, 6, 56400));   // Cataldo Old Mission valley floor
    points.push(new THREE.Vector3(50, 18, 57000));  // Bitterroot grade climb
    points.push(new THREE.Vector3(0, 20, 57500));   // Zone boundary / Panhandle terminus

    // 12. Montana Big Sky & Glacier Going-to-the-Sun (57500 - 62000m)
    points.push(new THREE.Vector3(-42, 14, 58800)); // Lake McDonald glacial fjord shore curve
    points.push(new THREE.Vector3(28, 36, 59500));  // Avalanche Creek canyon gorge climb
    points.push(new THREE.Vector3(58, 64, 60200));  // The Weeping Wall sheer cliff & rimrock shelf
    points.push(new THREE.Vector3(-32, 92, 60800)); // Triple Stone Arches & Garden Wall hairpin curve
    points.push(new THREE.Vector3(12, 114, 61400)); // Logan Pass Continental Divide summit crest (6,646 ft)
    points.push(new THREE.Vector3(0, 98, 62000));   // Continental Divide East descent / Zone boundary

    // 13. Las Vegas Strip & Red Rock Canyon (62000 - 66500m)
    points.push(new THREE.Vector3(25, 42, 62600));  // Sweeping descent into Las Vegas desert valley basin
    points.push(new THREE.Vector3(-15, 12, 63100)); // Welcome to Fabulous Las Vegas Sign & Googie median plaza
    points.push(new THREE.Vector3(35, 10, 63700));  // Entering the Strip neon corridor, casino pylon towers
    points.push(new THREE.Vector3(10, 10, 64300));  // The Strip: Luxor Pyramid & Bellagio Grand Fountains oasis
    points.push(new THREE.Vector3(-40, 24, 64900)); // Transition west onto Red Rock Scenic Byway & Calico trail
    points.push(new THREE.Vector3(30, 48, 65500));  // Red Rock Canyon Sandstone Escarpment & Calico Hills hairpin bend
    points.push(new THREE.Vector3(-15, 62, 66100)); // Climbing through Aztec sandstone bluffs and Keystone Thrust
    points.push(new THREE.Vector3(0, 54, 66500));   // Zone 12 boundary / Southwest Red Rock Corridor terminus

    this.splinePoints = points;
    this.curve = new THREE.CatmullRomCurve3(points);
    this.curve.curveType = 'centripetal';
  }

  getGroundElevation(x, z) {
    const roadInfo = this.getRoadInfo(x, z);
    return calculateTerrainHeight(x, z, roadInfo);
  }

  /**
   * Fast, zero-allocation road transform computation for dynamic scenery.
   * Directly writes world X, Y, Z to targetPos without allocating new Vector3s or objects.
   * @param {number} z Road distance
   * @param {number} lateralOffset Perpendicular offset from centerline
   * @param {THREE.Vector3} targetPos Vector3 to write result to
   * @returns {THREE.Vector3} targetPos
   */
  getRoadPositionFast(z, lateralOffset, targetPos) {
    if (!this.curve || !this.totalLength) {
      targetPos.set(lateralOffset, 0, z);
      return targetPos;
    }
    const t = Math.max(0, Math.min(1, z / this.totalLength));
    if (!this._fastTangent) {
      this._fastTangent = new THREE.Vector3();
    }
    this.curve.getPointAt(t, targetPos);
    this.curve.getTangentAt(t, this._fastTangent);
    this._fastTangent.normalize();

    // Normal in XZ plane: cross((tx, ty, tz), (0, 1, 0)) = (-tz, 0, tx)
    const nx = -this._fastTangent.z;
    const nz = this._fastTangent.x;
    const invLen = 1.0 / (Math.hypot(nx, nz) || 1.0);

    targetPos.x += nx * invLen * lateralOffset;
    targetPos.z += nz * invLen * lateralOffset;
    return targetPos;
  }

  /**
   * Zero-allocation ground elevation query when roadY and lateralOffset are already known.
   * Avoids the expensive 10-iteration golden-section search and CatmullRom evaluations in getRoadInfo.
   * @param {number} x World X coordinate
   * @param {number} z World Z coordinate
   * @param {number} roadY Highway centerline elevation at z
   * @param {number} lateralDist Signed lateral offset from centerline
   * @returns {number} Ground elevation Y
   */
  getGroundElevationAtKnownRoadOffset(x, z, roadY, lateralDist) {
    if (!this._fastRoadInfo) {
      this._fastRoadInfo = { roadY: 0, lateralDist: 0 };
    }
    this._fastRoadInfo.roadY = roadY;
    this._fastRoadInfo.lateralDist = lateralDist;
    return calculateTerrainHeight(x, z, this._fastRoadInfo);
  }

  getRoadTransformAtZ(z, lateralOffset = 0, yOffset = 0, matchTerrain = true) {
    const t = Math.max(0, Math.min(1, z / this.totalLength));
    const pt = this.curve.getPointAt(t);
    const tangent = this.curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const pos = new THREE.Vector3()
      .copy(pt)
      .addScaledVector(normal, lateralOffset);

    if (matchTerrain && Math.abs(lateralOffset) > (this.roadWidth * 0.5 + 1.0)) {
      const roadInfo = this.getRoadInfo(pos.x, pos.z);
      pos.y = calculateTerrainHeight(pos.x, pos.z, roadInfo) + yOffset;
    } else {
      pos.y += yOffset;
    }

    const heading = Math.atan2(tangent.x, tangent.z);
    const quaternion = new THREE.Quaternion().setFromAxisAngle(up, heading);
    return { pos, tangent, normal, heading, quaternion, pt };
  }

  getRoadInfo(x, z) {
    if (z < 0) {
      const approachY = 0.12;
      const distToCenter = Math.abs(x);
      const isOnRoad = distToCenter <= (this.roadWidth * 0.5 + 2.5);
      return {
        roadY: approachY,
        isOnRoad,
        distToCenter,
        lateralDist: x,
        tangent: new THREE.Vector3(0, 0, 1),
        normal: new THREE.Vector3(1, 0, 0),
        roadPoint: new THREE.Vector3(0, approachY, z),
        t: 0,
        isTurnout: false,
        turnoutData: null
      };
    }

    const tGuess = Math.max(0, Math.min(1, z / this.totalLength));
    let tMin = Math.max(0, tGuess - 0.025);
    let tMax = Math.min(1, tGuess + 0.025);

    for (let iter = 0; iter < 10; iter++) {
      const t1 = tMin + (tMax - tMin) * 0.382;
      const t2 = tMin + (tMax - tMin) * 0.618;
      const p1 = this.curve.getPointAt(t1);
      const p2 = this.curve.getPointAt(t2);
      const d1 = (p1.x - x) ** 2 + (p1.z - z) ** 2;
      const d2 = (p2.x - x) ** 2 + (p2.z - z) ** 2;
      if (d1 < d2) {
        tMax = t2;
      } else {
        tMin = t1;
      }
    }

    const bestT = (tMin + tMax) * 0.5;
    const bestPoint = this.curve.getPointAt(bestT);
    const tangent = this.curve.getTangentAt(bestT).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Compute signed lateral distance from road centerline
    const toVehicle = new THREE.Vector3(x - bestPoint.x, 0, z - bestPoint.z);
    const lateralDist = toVehicle.dot(normal); // signed distance (- = left, + = right)
    const distToCenter = Math.abs(lateralDist);

    // Standard Highway Deck
    let isOnRoad = distToCenter <= (this.roadWidth * 0.5 + 3.0);
    let roadY = bestPoint.y;
    let isTurnout = false;
    let turnoutData = null;

    // Check if vehicle is inside or entering any of the scenic parking lots
    const roadHalfW = this.roadWidth * 0.5;
    for (let i = 0; i < SCENIC_PARKING_LOTS.length; i++) {
      const lot = SCENIC_PARKING_LOTS[i];
      const dz = Math.abs(z - lot.z);
      const halfLen = lot.length * 0.5 + 16.0; // includes smooth entrance/exit aprons

      if (dz <= halfLen) {
        const isRightSide = lot.side === 'right';
        const lotMinLat = isRightSide ? (roadHalfW - 1.0) : (lot.xOffset - lot.width * 0.5 - 3.5);
        const lotMaxLat = isRightSide ? (lot.xOffset + lot.width * 0.5 + 3.5) : -(roadHalfW - 1.0);

        if (lateralDist >= lotMinLat && lateralDist <= lotMaxLat) {
          isOnRoad = true;
          if (distToCenter >= roadHalfW - 1.0) {
            isTurnout = true;
            turnoutData = lot;
          }
          // Parking deck matches the highway surface elevation exactly at lot.z
          const lotTrans = this.getRoadTransformAtZ(z, 0, 0);
          if (lotTrans) roadY = lotTrans.pos.y;
          break;
        }
      }
    }

    // Check if vehicle is inside or driving around any of the 9 Auto Repair Shops
    if (!isTurnout) {
      for (let i = 0; i < AUTO_REPAIR_SHOPS.length; i++) {
        const shop = AUTO_REPAIR_SHOPS[i];
        const dz = Math.abs(z - shop.z);
        const halfLen = 45.0; // generous drivable driveway, entry deceleration & exit acceleration tapers

        if (dz <= halfLen) {
          if (distToCenter >= (this.roadWidth * 0.5 - 2.5) && distToCenter <= 58.0) {
            isOnRoad = true;
            isTurnout = true;
            turnoutData = shop;
            // Shop apron elevation seamlessly matches the highway elevation
            const shopTrans = this.getRoadTransformAtZ(z, 0, 0);
            if (shopTrans) roadY = shopTrans.pos.y;
            break;
          }
        }
      }
    }

    // Cougar Ridge Grand 1,200m+ Off-Road Expedition Corridor & Summit Plateau
    const isTrailZone = (z >= 2460 && z <= 3080 && lateralDist <= -14 && lateralDist >= -420);
    const isSummit = isTrailZone && (lateralDist <= -170 && lateralDist >= -340 && z >= 2560 && z <= 2740);
    const routeZ = bestT * this.totalLength;
    const isOnDownhill = DownhillSpline.isDownhillRoute(lateralDist, routeZ);

    const downhillInfo = isOnDownhill ? {
      isOnDownhillRoute: true,
      name: 'Cougar Ridge Downhill Express Run',
      gradePct: -18.0
    } : null;

    const trailInfo = (isTrailZone && !isOnDownhill) ? {
      isOnTrail: true,
      isSummit: isSummit,
      trailName: 'Cougar Ridge Grand Expedition 4x4 Trail',
      summitName: 'Cougar Ridge Summit Overlook'
    } : null;
    const isOnTrail = isTrailZone && !isOnDownhill;

    return {
      roadY,
      isOnRoad: isOnRoad || isOnTrail || isOnDownhill,
      distToCenter,
      lateralDist,
      tangent,
      normal,
      roadPoint: bestPoint,
      t: bestT,
      routeZ,
      isTurnout,
      turnoutData,
      isOnTrail,
      isOnDownhillRoute: isOnDownhill,
      downhillInfo,
      trailInfo
    };
  }

  isCoyoteRidgeTrail(x, z) {
    if (z < 2440 || z > 3100) return false;
    const rInfo = this.getRoadInfo(x, z);
    return !!rInfo.isOnTrail;
  }

  getCoyoteRidgeTrailInfo(x, z) {
    if (z < 2440 || z > 3100) return null;
    const rInfo = this.getRoadInfo(x, z);
    return rInfo.trailInfo;
  }

  buildRoadMesh() {
    const segments = 600;
    const roadWidth = this.roadWidth;
    const halfW = roadWidth / 2;

    const vertices = [];
    const uvs = [];
    const indices = [];

    const curvePoints = this.curve.getSpacedPoints(segments);
    
    for (let i = 0; i <= segments; i++) {
      const p = curvePoints[i];
      const t = i / segments;
      const tangent = this.curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const pL = new THREE.Vector3().copy(p).addScaledVector(normal, -halfW);
      const pR = new THREE.Vector3().copy(p).addScaledVector(normal, halfW);

      vertices.push(pL.x, pL.y + 0.12, pL.z);
      vertices.push(pR.x, pR.y + 0.12, pR.z);

      uvs.push(0, t * 140);
      uvs.push(1, t * 140);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    this.roadMesh = new THREE.Mesh(roadGeo, this.matAsphalt);
    this.roadMesh.receiveShadow = true;
    this.group.add(this.roadMesh);

    // Double Center Yellow Highway Striping
    this.buildCenterLanes(curvePoints);
    // White Fog Shoulder Line Markings
    this.buildShoulderLines(curvePoints);
  }

  buildCenterLanes(curvePoints) {
    const segments = curvePoints.length - 1;
    const dummy = new THREE.Object3D();
    const chunkMatrices = new Map(); // chunkIdx -> [] of matrices for double-yellow dashes

    for (let i = 0; i < segments; i += 3) {
      const p1 = curvePoints[i];
      const p2 = curvePoints[i + 1];
      const t = i / segments;
      const tangent = this.curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Double yellow lines
      [-0.25, 0.25].forEach(offset => {
        const mid = new THREE.Vector3().copy(p1).lerp(p2, 0.5).addScaledVector(normal, offset);
        const chunkIdx = Math.max(0, Math.min(this.numChunks - 1, Math.floor(mid.z / this.chunkSize)));
        dummy.position.set(mid.x, mid.y + 0.18, mid.z);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        dummy.updateMatrix();
        if (!chunkMatrices.has(chunkIdx)) chunkMatrices.set(chunkIdx, []);
        chunkMatrices.get(chunkIdx).push(dummy.matrix.clone());
      });
    }

    const lineGeo = new THREE.PlaneGeometry(0.25, 5.0);
    lineGeo.rotateX(-Math.PI * 0.5);
    for (const [chunkIdx, matrices] of chunkMatrices) {
      const inst = new THREE.InstancedMesh(lineGeo, this.matLanes, matrices.length);
      inst.name = `Instanced_CenterYellow_${chunkIdx}`;
      for (let i = 0; i < matrices.length; i++) inst.setMatrixAt(i, matrices[i]);
      inst.instanceMatrix.needsUpdate = true;
      this.roadChunks[chunkIdx].add(inst);
    }
  }

  buildShoulderLines(curvePoints) {
    const segments = curvePoints.length - 1;
    const halfW = this.roadWidth * 0.5 - 1.2;
    const dummy = new THREE.Object3D();
    const chunkMatrices = new Map(); // chunkIdx -> [] matrices for white shoulder dashes

    for (let i = 0; i < segments; i += 4) {
      const p1 = curvePoints[i];
      const p2 = curvePoints[i + 1];
      const t = i / segments;
      const tangent = this.curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      [-halfW, halfW].forEach(offset => {
        const mid = new THREE.Vector3().copy(p1).lerp(p2, 0.5).addScaledVector(normal, offset);
        const chunkIdx = Math.max(0, Math.min(this.numChunks - 1, Math.floor(mid.z / this.chunkSize)));
        dummy.position.set(mid.x, mid.y + 0.18, mid.z);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        dummy.updateMatrix();
        if (!chunkMatrices.has(chunkIdx)) chunkMatrices.set(chunkIdx, []);
        chunkMatrices.get(chunkIdx).push(dummy.matrix.clone());
      });
    }

    const lineGeo = new THREE.PlaneGeometry(0.3, 6.5);
    lineGeo.rotateX(-Math.PI * 0.5);
    for (const [chunkIdx, matrices] of chunkMatrices) {
      const inst = new THREE.InstancedMesh(lineGeo, this.matWhiteLanes, matrices.length);
      inst.name = `Instanced_ShoulderWhite_${chunkIdx}`;
      for (let i = 0; i < matrices.length; i++) inst.setMatrixAt(i, matrices[i]);
      inst.instanceMatrix.needsUpdate = true;
      this.roadChunks[chunkIdx].add(inst);
    }
  }

  // Flexible Highway Curve Delineator Reflector Posts (Instanced)
  buildCurveDelineatorPosts() {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6);
    const reflectorGeo = new THREE.BoxGeometry(0.14, 0.18, 0.04);
    const postOffset = this.roadWidth * 0.5 + 0.8;

    const postTransforms = [];
    const amberReflectors = [];
    const whiteReflectors = [];

    for (let z = 340; z < 23300; z += 40) {
      [-postOffset, postOffset].forEach(offset => {
        const isRight = offset > 0;
        const inTurnoutEntrance = SCENIC_PARKING_LOTS.some(
          lot => (lot.side === (isRight ? 'right' : 'left')) && Math.abs(z - lot.z) <= (lot.length * 0.5 + 16.0)
        ) || AUTO_REPAIR_SHOPS.some(
          shop => (shop.side === (isRight ? 'right' : 'left')) && Math.abs(z - shop.z) <= (shop.length * 0.5 + 40.0)
        );
        if (inTurnoutEntrance) return;

        const transform = this.getRoadTransformAtZ(z, offset, 0);
        postTransforms.push(transform);
        if (offset < 0) {
          amberReflectors.push(transform);
        } else {
          whiteReflectors.push(transform);
        }
      });
    }

    const parentDummy = new THREE.Object3D();
    const childDummy = new THREE.Object3D();
    parentDummy.add(childDummy);

    if (postTransforms.length > 0) {
      const instPosts = new THREE.InstancedMesh(postGeo, this.matPostWhite, postTransforms.length);
      instPosts.name = 'Instanced_DelineatorPosts';
      postTransforms.forEach((t, idx) => {
        parentDummy.position.copy(t.pos);
        parentDummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
        childDummy.position.set(0, 0.6, 0);
        childDummy.quaternion.identity();
        childDummy.scale.set(1, 1, 1);
        parentDummy.updateMatrixWorld(true);
        instPosts.setMatrixAt(idx, childDummy.matrixWorld);
      });
      instPosts.instanceMatrix.needsUpdate = true;
      this.group.add(instPosts);
    }

    if (amberReflectors.length > 0) {
      const instAmberRef = new THREE.InstancedMesh(reflectorGeo, this.matReflectorAmber, amberReflectors.length);
      instAmberRef.name = 'Instanced_DelineatorAmberReflectors';
      amberReflectors.forEach((t, idx) => {
        parentDummy.position.copy(t.pos);
        parentDummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
        childDummy.position.set(0, 1.0, 0.06);
        childDummy.quaternion.identity();
        parentDummy.updateMatrixWorld(true);
        instAmberRef.setMatrixAt(idx, childDummy.matrixWorld);
      });
      instAmberRef.instanceMatrix.needsUpdate = true;
      this.group.add(instAmberRef);
    }

    if (whiteReflectors.length > 0) {
      const instWhiteRef = new THREE.InstancedMesh(reflectorGeo, this.matReflectorWhite, whiteReflectors.length);
      instWhiteRef.name = 'Instanced_DelineatorWhiteReflectors';
      whiteReflectors.forEach((t, idx) => {
        parentDummy.position.copy(t.pos);
        parentDummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.tangent);
        childDummy.position.set(0, 1.0, 0.06);
        childDummy.quaternion.identity();
        parentDummy.updateMatrixWorld(true);
        instWhiteRef.setMatrixAt(idx, childDummy.matrixWorld);
      });
      instWhiteRef.instanceMatrix.needsUpdate = true;
      this.group.add(instWhiteRef);
    }
  }

  // Asphalt Tire Drift Rubber & Skid Marks at High-Speed Sweepers
  buildAsphaltSkidMarks() {
    const skidZones = [900, 1550, 3400, 4100, 4950, 5600, 6650, 7300, 9300, 11000, 12600, 14100, 16400, 19100, 21800];

    skidZones.forEach(z => {
      [-2.5, 2.5].forEach(laneX => {
        const transform = this.getRoadTransformAtZ(z, laneX, 0.16);
        const skidMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 18.0), this.matSkidMark);
        skidMesh.rotateX(-Math.PI * 0.5);
        skidMesh.position.copy(transform.pos);
        skidMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
        this.addToChunk(skidMesh, z);
      });
    });
  }

  buildScenicParkingLots() {
    // Helper to draw auto-fitting, wrapped typography that NEVER overflows canvas bounds
    const drawFittedLandmarkName = (ctx, rawName, centerY = 455, maxW = 1750, maxSingleSize = 180) => {
      const name = (rawName || 'Scenic Overlook').toUpperCase();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Check if it's a short name (<= 22 chars) that fits comfortably on 1 line
      const testSize = 145;
      ctx.font = `900 ${testSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const singleW = ctx.measureText(name).width;

      if (singleW <= maxW && name.length <= 22) {
        // Fits comfortably on 1 line! Scale up to maxSingleSize if short
        const fitSize = Math.min(maxSingleSize, Math.floor(testSize * (maxW / singleW)));
        ctx.font = `900 ${fitSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        ctx.fillText(name, 1024, centerY);
      } else {
        // Wrap into 2 balanced lines on space boundaries
        const words = name.split(/\s+/);
        let line1 = '';
        let line2 = '';
        const targetLen = name.length * 0.52;
        let running = 0;

        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          if ((running + w.length <= targetLen || i === 0) && (i < words.length - 1)) {
            line1 += (line1 ? ' ' : '') + w;
            running = line1.length;
          } else {
            line2 += (line2 ? ' ' : '') + w;
          }
        }

        // Auto-scale both lines so neither exceeds maxW
        let twoLineSize = 145;
        ctx.font = `900 ${twoLineSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        const w1 = ctx.measureText(line1).width;
        const w2 = ctx.measureText(line2).width;
        const widest = Math.max(w1, w2);
        if (widest > maxW) {
          twoLineSize = Math.max(76, Math.floor(twoLineSize * (maxW / widest)));
        }

        ctx.font = `900 ${twoLineSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        const lineSpacing = twoLineSize * 1.15;
        ctx.fillText(line1, 1024, centerY - lineSpacing * 0.48);
        ctx.fillText(line2, 1024, centerY + lineSpacing * 0.52);
      }
      ctx.shadowColor = 'transparent';
    };

    // Helper to create high-contrast canvas texture for Turnout Entrance Signposts (2048x1024 matching 8.2m x 4.4m board)
    const createSignTexture = (name, sub, isRightSide) => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Authentic Federal Highway Scenic Byway Dark Brown Board
      ctx.fillStyle = '#1c130c';
      ctx.fillRect(0, 0, 2048, 1024);

      // Outer White Reflective Border (MUTCD standard heavy 32px stroke)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 32;
      ctx.strokeRect(28, 28, 1992, 968);

      // Inner Amber Pinstripe Border (12px stroke)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 12;
      ctx.strokeRect(64, 64, 1920, 896);

      // Corner Mounting Rivets
      const corners = [[64, 64], [1984, 64], [64, 960], [1984, 960]];
      ctx.fillStyle = '#fde047';
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vector Helper: Highway Turnout "P" Emblem Badge
      const drawTurnoutBadge = (bx, by, radius) => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(bx, by, radius - 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${Math.round(radius * 1.35)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', bx, by + 2);
        ctx.restore();
      };

      // Vector Helper: Crisp Highway Directional Arrow
      const drawSignArrow = (ax, ay, length, isLeft) => {
        ctx.save();
        ctx.translate(ax, ay);
        if (isLeft) ctx.scale(-1, 1);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const halfH = 18;
        const shaftLen = length * 0.52;
        ctx.rect(-length * 0.5, -halfH, shaftLen, halfH * 2);
        ctx.moveTo(-length * 0.5 + shaftLen - 8, -halfH * 2.2);
        ctx.lineTo(length * 0.5, 0);
        ctx.lineTo(-length * 0.5 + shaftLen - 8, halfH * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      // Top Header Ribbon (Authentic National Scenic Byway Deep Green)
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(96, 96, 1856, 140);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 5;
      ctx.strokeRect(96, 96, 1856, 140);

      drawTurnoutBadge(180, 166, 46);
      drawTurnoutBadge(1868, 166, 46);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SCENIC HIGHWAY OVERLOOK', 1024, 166);

      // Landmark Name in Dynamically Wrapped, Auto-Fitted Typography
      drawFittedLandmarkName(ctx, name, 455);

      // Action Prompt Banner: Authentic National Park Guide Pill
      const arrowLeft = !isRightSide;
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(110, 710, 1828, 200);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.strokeRect(110, 710, 1828, 200);

      drawSignArrow(240, 810, 110, arrowLeft);
      drawSignArrow(1808, 810, 110, arrowLeft);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 88px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
      const actionText = arrowLeft
        ? 'SLOW & PULL IN LEFT  •  PHOTO OVERLOOK'
        : 'SLOW & PULL IN RIGHT  •  PHOTO OVERLOOK';
      ctx.fillText(actionText, 1024, 810);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    // Helper to create advance highway sign texture (260m warning before turnout) (2048x1024 matching 9.6m x 5.2m board)
    const createAdvanceSignTexture = (lot) => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Authentic National Scenic Byway Deep Brown Base
      ctx.fillStyle = '#1c130c';
      ctx.fillRect(0, 0, 2048, 1024);

      // Outer White Reflective Border (32px)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 32;
      ctx.strokeRect(28, 28, 1992, 968);

      // Inner Amber Pinstripe Border (12px)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 12;
      ctx.strokeRect(64, 64, 1920, 896);

      // Corner Mounting Rivets
      const corners = [[64, 64], [1984, 64], [64, 960], [1984, 960]];
      ctx.fillStyle = '#fde047';
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vector Helper: Crisp Highway Directional Arrow
      const drawSignArrow = (ax, ay, length, isLeft) => {
        ctx.save();
        ctx.translate(ax, ay);
        if (isLeft) ctx.scale(-1, 1);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const halfH = 18;
        const shaftLen = length * 0.52;
        ctx.rect(-length * 0.5, -halfH, shaftLen, halfH * 2);
        ctx.moveTo(-length * 0.5 + shaftLen - 8, -halfH * 2.2);
        ctx.lineTo(length * 0.5, 0);
        ctx.lineTo(-length * 0.5 + shaftLen - 8, halfH * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      // Top Header Ribbon (Warm Highway Gold)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(96, 96, 1856, 140);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 6;
      ctx.strokeRect(96, 96, 1856, 140);

      ctx.fillStyle = '#fffbeb';
      ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SCENIC HIGHWAY TURNOUT AHEAD', 1024, 166);

      // Landmark Name in Dynamically Wrapped, Auto-Fitted Typography
      drawFittedLandmarkName(ctx, lot.name, 455);

      // Exit Distance & Direction Action Pill (Authentic Interstate Green)
      const isRightSide = lot.side === 'right';
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(110, 700, 1828, 210);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 8;
      ctx.strokeRect(110, 700, 1828, 210);

      drawSignArrow(240, 805, 120, !isRightSide);
      drawSignArrow(1808, 805, 120, !isRightSide);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 96px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
      const exitDirText = isRightSide ? '1/4 MILE  •  EXIT RIGHT' : '1/4 MILE  •  EXIT LEFT';
      ctx.fillText(exitDirText, 1024, 805);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    // Helper to create high-contrast canvas texture for 3D Historical Landmark Kiosks
    const createPlaqueTexture = (lot) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Heritage Bronze & Slate Board Base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1024, 768);

      // Gold Ornamental Double Border
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 16;
      ctx.strokeRect(20, 20, 984, 728);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, 944, 688);

      // Corner Rosettes
      const corners = [[40, 40], [984, 40], [40, 728], [984, 728]];
      ctx.fillStyle = '#f59e0b';
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
      });

      // Top Emblem Banner
      ctx.fillStyle = '#d97706';
      ctx.fillRect(60, 64, 904, 84);
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★  HISTORICAL HERITAGE ARCHIVE  ★', 512, 106);

      // Landmark Name
      ctx.fillStyle = '#ffffff';
      const name = lot.name || 'Historic Overlook';
      const pFontSize = name.length > 24 ? 62 : 72;
      ctx.font = `900 ${pFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(name, 512, 220);

      // Subtitle
      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(lot.sub || 'National Scenic Landmark', 512, 310);

      // Action pill prompt
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, 390, 864, 180);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(80, 390, 864, 180);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('PRESS  [ E ]  OR  TAP  PLAQUE', 512, 455);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('TO OPEN PHOTO & HISTORICAL DOSSIER', 512, 525);

      // Bottom Era badge
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('HISTORIC PRESERVATION • PACIFIC COAST HIGHWAY', 512, 690);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };


    SCENIC_PARKING_LOTS.forEach(lot => {
      const lotGroup = new THREE.Group();
      lotGroup.name = `ScenicLot_${lot.id}`;
      const isRightSide = lot.side === 'right';
      const roadHalfW = this.roadWidth * 0.5;
      const roadEdge = isRightSide ? roadHalfW : -roadHalfW;
      const transform = this.getRoadTransformAtZ(lot.z, lot.xOffset, 0.12);

      // 1. Main Asphalt Parking Lot Deck (Inner edge meets road edge at ±roadHalfW)
      const lotGeo = new THREE.PlaneGeometry(lot.width, lot.length, 6, 12);
      lotGeo.rotateX(-Math.PI * 0.5);
      const lotMesh = new THREE.Mesh(lotGeo, this.matTurnout);
      lotMesh.position.copy(transform.pos);
      lotMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      lotMesh.receiveShadow = true;
      lotGroup.add(lotMesh);

      // 2. Smooth Highway Entrance & Exit Connecting Taper Aprons (Strictly outside roadway: |lateral| >= roadHalfW)
      const taperLen = 14.0;
      const taperWidth = Math.min(10.0, lot.width * 0.5);
      const halfLen = lot.length * 0.5;

      const createTriangleTaper = (v0, v1, v2) => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array([
          v0.x, v0.y, v0.z,
          v1.x, v1.y, v1.z,
          v2.x, v2.y, v2.z
        ]);
        const uvs = new Float32Array([0, 0, 1, 0, 0, 1]);
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geo.computeVertexNormals();
        if (geo.attributes.normal.getY(0) < 0) {
          const tempX = pos[3], tempY = pos[4], tempZ = pos[5];
          pos[3] = pos[6]; pos[4] = pos[7]; pos[5] = pos[8];
          pos[6] = tempX; pos[7] = tempY; pos[8] = tempZ;
          geo.computeVertexNormals();
        }
        return geo;
      };

      // Entrance Taper: flares from road edge at (lot.z - halfLen - taperLen) outward to (roadEdge ± taperWidth) at (lot.z - halfLen)
      const entryV0 = this.getRoadTransformAtZ(lot.z - halfLen - taperLen, roadEdge, 0.12).pos;
      const entryV1 = this.getRoadTransformAtZ(lot.z - halfLen, roadEdge, 0.12).pos;
      const entryV2 = this.getRoadTransformAtZ(lot.z - halfLen, roadEdge + (isRightSide ? taperWidth : -taperWidth), 0.12).pos;
      const entryTaperGeo = createTriangleTaper(entryV0, entryV1, entryV2);
      const entryTaperMesh = new THREE.Mesh(entryTaperGeo, this.matTurnout);
      entryTaperMesh.receiveShadow = true;
      lotGroup.add(entryTaperMesh);

      // Exit Taper: narrows from (roadEdge ± taperWidth) at (lot.z + halfLen) back to road edge at (lot.z + halfLen + taperLen)
      const exitV0 = this.getRoadTransformAtZ(lot.z + halfLen, roadEdge, 0.12).pos;
      const exitV1 = this.getRoadTransformAtZ(lot.z + halfLen, roadEdge + (isRightSide ? taperWidth : -taperWidth), 0.12).pos;
      const exitV2 = this.getRoadTransformAtZ(lot.z + halfLen + taperLen, roadEdge, 0.12).pos;
      const exitTaperGeo = createTriangleTaper(exitV0, exitV1, exitV2);
      const exitTaperMesh = new THREE.Mesh(exitTaperGeo, this.matTurnout);
      exitTaperMesh.receiveShadow = true;
      lotGroup.add(exitTaperMesh);

      // 3. Painted Parking Bays & Wheel Stops
      const numStalls = 6;
      const stallSpacing = (lot.length - 10.0) / numStalls;
      const stripeLen = 5.6;
      const stripeGeo = new THREE.PlaneGeometry(0.16, stripeLen);
      stripeGeo.rotateX(-Math.PI * 0.5);
      stripeGeo.rotateY(Math.PI * 0.5); // align perpendicular to road

      const curbGeo = new THREE.BoxGeometry(0.24, 0.16, 2.2);

      for (let s = 0; s <= numStalls; s++) {
        const stallZ = -lot.length * 0.5 + 5.0 + s * stallSpacing;
        const isHandicap = (s === numStalls - 1);
        const stripeMat = isHandicap ? this.matParkingStripeBlue : this.matParkingStripeWhite;

        // Outer Parking Divider Stripe
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        const stripeLocalPos = new THREE.Vector3(
          isRightSide ? (lot.width * 0.5 - stripeLen * 0.5 - 0.8) : -(lot.width * 0.5 - stripeLen * 0.5 - 0.8),
          0.02,
          stallZ
        );
        stripe.position.copy(transform.pos).add(
          new THREE.Vector3()
            .addScaledVector(transform.normal, stripeLocalPos.x)
            .addScaledVector(transform.tangent, stripeLocalPos.z)
        );
        stripe.position.y += 0.02;
        stripe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
        lotGroup.add(stripe);

        // Concrete Wheel Stop at head of stall (skip for off-road trail entrance on Coyote Ridge)
        if (s < numStalls && lot.id !== 'turnout_coyote_ridge') {
          const curb = new THREE.Mesh(curbGeo, this.matCurb);
          const curbLocalX = isRightSide ? (lot.width * 0.5 - 1.2) : -(lot.width * 0.5 - 1.2);
          const curbLocalZ = stallZ + stallSpacing * 0.5;
          curb.position.copy(transform.pos).add(
            new THREE.Vector3()
              .addScaledVector(transform.normal, curbLocalX)
              .addScaledVector(transform.tangent, curbLocalZ)
          );
          curb.position.y += 0.08;
          curb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
          curb.castShadow = true;
          lotGroup.add(curb);
        }
      }

      // 4. Perimeter Scenic Viewpoint Railings & Balustrades
      // For turnout_coyote_ridge, the outer back edge connects directly to the off-road trail and downhill merge.
      // Leave the outer back edge open so vehicles can drive freely onto the mountain trail.
      const outerRailX = isRightSide ? (lot.width * 0.5 + 0.2) : -(lot.width * 0.5 + 0.2);
      if (lot.id !== 'turnout_coyote_ridge') {
        const railSteps = Math.floor(lot.length / 3.0);

        for (let r = 0; r <= railSteps; r++) {
          const railZ = -lot.length * 0.5 + r * 3.0;

          if (lot.theme.includes('stone')) {
            // Stone masonry parapet pillar
            const stonePost = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 0.45), this.matStoneWall);
            stonePost.position.copy(transform.pos).add(
              new THREE.Vector3()
                .addScaledVector(transform.normal, outerRailX)
                .addScaledVector(transform.tangent, railZ)
            );
            stonePost.position.y += 0.5;
            stonePost.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
            stonePost.castShadow = true;
            lotGroup.add(stonePost);

            if (r < railSteps) {
              const stoneWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 2.6), this.matStoneWall);
              stoneWall.position.copy(transform.pos).add(
                new THREE.Vector3()
                  .addScaledVector(transform.normal, outerRailX)
                  .addScaledVector(transform.tangent, railZ + 1.5)
              );
              stoneWall.position.y += 0.35;
              stoneWall.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
              stoneWall.castShadow = true;
              lotGroup.add(stoneWall);
            }
          } else {
            // Timber / Boardwalk Railing
            const postGeo = new THREE.BoxGeometry(0.18, 1.2, 0.18);
            const post = new THREE.Mesh(postGeo, this.matWoodRailing);
            post.position.copy(transform.pos).add(
              new THREE.Vector3()
                .addScaledVector(transform.normal, outerRailX)
                .addScaledVector(transform.tangent, railZ)
            );
            post.position.y += 0.6;
            post.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
            post.castShadow = true;
            lotGroup.add(post);

            if (r < railSteps) {
              const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 2.9), this.matWoodRailing);
              topRail.position.copy(transform.pos).add(
                new THREE.Vector3()
                  .addScaledVector(transform.normal, outerRailX)
                  .addScaledVector(transform.tangent, railZ + 1.5)
              );
              topRail.position.y += 1.05;
              topRail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
              lotGroup.add(topRail);

              const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 2.9), this.matWoodRailing);
              midRail.position.copy(transform.pos).add(
                new THREE.Vector3()
                  .addScaledVector(transform.normal, outerRailX)
                  .addScaledVector(transform.tangent, railZ + 1.5)
              );
              midRail.position.y += 0.55;
              midRail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
              lotGroup.add(midRail);
            }
          }
        }
      }

      // 5. Scenic Viewpoint Binoculars (Coin-Op Telescope) & Park Bench
      const scopeGroup = new THREE.Group();
      const basePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.3, 10), this.matTelescope);
      basePedestal.position.y = 0.65;
      scopeGroup.add(basePedestal);

      const scopeHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.55), this.matTelescope);
      scopeHead.position.set(0, 1.35, 0);
      scopeHead.rotateX(-0.15); // tilted slightly up towards the view
      scopeGroup.add(scopeHead);

      const lens1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), this.matSignPost);
      lens1.rotateX(Math.PI * 0.5);
      lens1.position.set(-0.09, 1.35, isRightSide ? 0.25 : -0.25);
      scopeGroup.add(lens1);

      const lens2 = lens1.clone();
      lens2.position.x = 0.09;
      scopeGroup.add(lens2);

      const scopeOuterX = isRightSide ? (lot.width * 0.5 - 1.2) : -(lot.width * 0.5 - 1.2);
      const scopeZOffset = lot.id === 'turnout_coyote_ridge' ? -lot.length * 0.38 : 0;
      scopeGroup.position.copy(transform.pos).add(
        new THREE.Vector3()
          .addScaledVector(transform.normal, scopeOuterX)
          .addScaledVector(transform.tangent, scopeZOffset)
      );
      scopeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      lotGroup.add(scopeGroup);

      if (!this.scenicViewfinders) this.scenicViewfinders = [];
      this.scenicViewfinders.push({
        id: `vf_${lot.id}`,
        name: `${lot.name} Observation Telescope`,
        sub: lot.sub,
        elevation: `${Math.round(transform.pos.y * 3.28084)} FT`,
        pos: scopeGroup.position.clone(),
        eyePos: scopeGroup.position.clone().add(new THREE.Vector3(0, 1.35, 0)),
        baseHeading: transform.heading + (isRightSide ? Math.PI * 0.5 : -Math.PI * 0.5),
        basePitch: 0.05,
        group: scopeGroup
      });

      // Park Bench
      const benchGroup = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 1.8), this.matWoodRailing);
      seat.position.set(0, 0.45, 0);
      benchGroup.add(seat);

      const backRest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 1.8), this.matWoodRailing);
      backRest.position.set(isRightSide ? -0.28 : 0.28, 0.72, 0);
      benchGroup.add(backRest);

      [-0.7, 0.7].forEach(bz => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.08), this.matSignPost);
        leg.position.set(0, 0.225, bz);
        benchGroup.add(leg);
      });

      benchGroup.position.copy(transform.pos).add(
        new THREE.Vector3()
          .addScaledVector(transform.normal, outerRailX - (isRightSide ? 1.6 : -1.6))
          .addScaledVector(transform.tangent, 5.5)
      );
      benchGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      lotGroup.add(benchGroup);


      // 6. Highway Scenic Overlook Signpost (Positioned on road shoulder right at entrance taper)
      const entranceSignGroup = new THREE.Group();
      entranceSignGroup.name = `ScenicEntranceSign_${lot.id}`;

      const entryTaperZ = lot.z - halfLen - taperLen;
      const shoulderSignX = isRightSide ? (roadHalfW + 3.8) : -(roadHalfW + 3.8);
      const entranceSignTrans = this.getRoadTransformAtZ(entryTaperZ - 4.0, shoulderSignX, 0.15);

      const signW = 8.2;
      const signH = 4.4;
      const signD = 0.16;

      // Heavy timber / steel support posts strictly BEHIND the sign (signPostZ = -0.20)
      const signPostSpacing = 5.0;
      const signPostW = 0.32;
      const signPostH = 6.6;
      const signPostZ = -0.20;

      [-signPostSpacing * 0.5, signPostSpacing * 0.5].forEach(px => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(signPostW, signPostH, signPostW), this.matSignPost);
        post.position.set(px, signPostH * 0.5, signPostZ);
        post.castShadow = true;
        entranceSignGroup.add(post);

        // Concrete Footing
        const footer = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.38, 0.55, 8), this.matCurb);
        footer.position.set(px, 0.27, signPostZ);
        entranceSignGroup.add(footer);
      });

      // Horizontal mounting stringers behind board
      [2.8, 5.2].forEach(sy => {
        const stringer = new THREE.Mesh(new THREE.BoxGeometry(signW * 0.88, 0.16, 0.10), this.matSignPost);
        stringer.position.set(0, sy, signPostZ + 0.10);
        entranceSignGroup.add(stringer);
      });

      // Main Sign Board with multi-material (front face +Z textured, back face and sides dark backer)
      const signTex = createSignTexture(lot.name, lot.sub, isRightSide);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const entranceMaterials = [
        this.matSignBacker, // +X
        this.matSignBacker, // -X
        this.matSignBacker, // +Y
        this.matSignBacker, // -Y
        signMat,            // +Z (Front face facing oncoming traffic)
        this.matSignBacker  // -Z (Back face)
      ];
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(signW, signH, signD), entranceMaterials);
      signBoard.position.set(0, 4.3, 0);
      signBoard.castShadow = true;
      entranceSignGroup.add(signBoard);

      // Gold / Amber Raised Frame Border around the board
      const entranceFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.14, signH + 0.14, 0.08), this.matSignFrameGold);
      entranceFrameMesh.position.set(0, 4.3, -0.05);
      entranceSignGroup.add(entranceFrameMesh);

      // Top Center Flashing Amber Hazard Advisory Beacon
      const beaconHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.32, 10), this.matBeaconHousing);
      beaconHousing.position.set(0, 4.3 + signH * 0.5 + 0.16, 0);
      entranceSignGroup.add(beaconHousing);

      const beaconLens = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.7), this.matSignBeaconA);
      beaconLens.position.set(0, 4.3 + signH * 0.5 + 0.32, 0);
      entranceSignGroup.add(beaconLens);

      // Overhead Solar Luminaire Arms & Downlights
      [-2.0, 2.0].forEach(lx => {
        const lumArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.85), this.matLuminaireArm);
        lumArm.position.set(lx, 4.3 + signH * 0.5 + 0.22, 0.38);
        entranceSignGroup.add(lumArm);

        const lumLamp = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.10, 0.25), this.matLuminaireArm);
        lumLamp.position.set(lx, 4.3 + signH * 0.5 + 0.18, 0.78);
        entranceSignGroup.add(lumLamp);

        const lumLightFace = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.20), this.matLuminaireLight);
        lumLightFace.rotateX(Math.PI * 0.5);
        lumLightFace.position.set(lx, 4.3 + signH * 0.5 + 0.12, 0.78);
        entranceSignGroup.add(lumLightFace);
      });

      // Position & Orient on road shoulder facing ONCOMING traffic
      entranceSignGroup.position.copy(entranceSignTrans.pos);
      entranceSignGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), entranceSignTrans.tangent);
      entranceSignGroup.rotateY(Math.PI); // Rotate 180° so +Z faces oncoming traffic!
      entranceSignGroup.rotateY(isRightSide ? -0.65 : 0.65); // Angled ~37° inward facing oncoming driver lanes
      lotGroup.add(entranceSignGroup);

      // 7. 3D Historical Landmark Interpretive Kiosk & Glowing Beacon
      const kioskGroup = new THREE.Group();

      // Heavy timber support posts
      const postW = 0.16;
      const postH = 1.35;
      const legSpacing = 0.9;
      [-legSpacing * 0.5, legSpacing * 0.5].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(postW, postH, postW), this.matPlaqueTimber);
        leg.position.set(lx, postH * 0.5, 0);
        leg.castShadow = true;
        kioskGroup.add(leg);

        // Stone footers
        const footer = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.26), this.matStoneWall);
        footer.position.set(lx, 0.1, 0);
        kioskGroup.add(footer);
      });

      // Cross timber brace
      const crossBrace = new THREE.Mesh(new THREE.BoxGeometry(legSpacing + postW, 0.12, 0.12), this.matPlaqueTimber);
      crossBrace.position.set(0, 0.5, 0);
      kioskGroup.add(crossBrace);

      // Angled display board lectern (tilted back ~28 degrees)
      const lecternGroup = new THREE.Group();
      lecternGroup.position.set(0, postH - 0.05, 0);
      lecternGroup.rotation.x = -0.48; // ~28 deg tilt

      // Bronze Backplate / Frame
      const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 0.08), this.matPlaqueBronze);
      frameMesh.castShadow = true;
      lecternGroup.add(frameMesh);

      // Gold Raised Trim Border
      const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.99, 0.04), this.matPlaqueGold);
      trimMesh.position.z = -0.01;
      lecternGroup.add(trimMesh);

      // Top Bronze Crest Emblem
      const crestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), this.matPlaqueGold);
      crestMesh.rotation.x = Math.PI * 0.5;
      crestMesh.position.set(0, 0.52, 0.02);
      lecternGroup.add(crestMesh);

      // Textured Plaque Surface
      const plaqueTex = createPlaqueTexture(lot);
      const plaqueMat = new THREE.MeshBasicMaterial({ map: plaqueTex });
      const plaqueFace = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.88), plaqueMat);
      plaqueFace.position.z = 0.045;
      lecternGroup.add(plaqueFace);

      kioskGroup.add(lecternGroup);

      // 3D Floating Beacon Marker (Animated Bobbing / Spinning 📖 icon)
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(0, postH + 1.15, 0);

      // Golden Bookmark / Tablet Icon
      const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.06), this.matPlaqueBeacon);
      beaconGroup.add(bookCover);

      const bookPages = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.07), this.matPlaqueBeaconGlow);
      beaconGroup.add(bookPages);

      // Orbiting Golden Diamond Star Halo Ring
      const haloGeo = new THREE.TorusGeometry(0.32, 0.035, 6, 16);
      haloGeo.rotateX(Math.PI * 0.5);
      const haloMesh = new THREE.Mesh(haloGeo, this.matPlaqueBeacon);
      beaconGroup.add(haloMesh);

      kioskGroup.add(beaconGroup);

      // 3D Luminous Sky Pillar / Beacon Column (extends 42m into sky)
      const skyBeamHeight = 42;
      const skyBeamGeo = new THREE.CylinderGeometry(0.6, 3.2, skyBeamHeight, 10, 1, true);
      skyBeamGeo.translate(0, skyBeamHeight * 0.5, 0);
      const skyBeamMesh = new THREE.Mesh(skyBeamGeo, this.matSkyBeam);
      skyBeamMesh.position.set(0, postH + 1.2, 0);
      kioskGroup.add(skyBeamMesh);

      const skyBeamCoreGeo = new THREE.CylinderGeometry(0.2, 1.0, skyBeamHeight, 8, 1, true);
      skyBeamCoreGeo.translate(0, skyBeamHeight * 0.5, 0);
      const skyBeamCoreMesh = new THREE.Mesh(skyBeamCoreGeo, this.matSkyBeamCore);
      skyBeamCoreMesh.position.set(0, postH + 1.2, 0);
      kioskGroup.add(skyBeamCoreMesh);

      // High-altitude floating golden star / diamond waypoint (hovering 16m above turnout)
      const starMarkerGeo = new THREE.OctahedronGeometry(1.4, 0);
      const starMarker = new THREE.Mesh(starMarkerGeo, this.matPlaqueBeacon);
      starMarker.position.set(0, postH + 16.0, 0);
      kioskGroup.add(starMarker);

      // Place Kiosk along scenic turnout walkway
      const kioskLocalX = outerRailX - (isRightSide ? 1.6 : -1.6);
      const kioskLocalZ = -4.0;
      const kioskWorldPos = new THREE.Vector3()
        .copy(transform.pos)
        .addScaledVector(transform.normal, kioskLocalX)
        .addScaledVector(transform.tangent, kioskLocalZ);

      kioskGroup.position.copy(kioskWorldPos);
      kioskGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), transform.tangent);
      if (isRightSide) {
        kioskGroup.rotateY(Math.PI - 0.45); // Angled facing oncoming vehicles entering turnout bay
      } else {
        kioskGroup.rotateY(Math.PI + 0.45);
      }

      lotGroup.add(kioskGroup);

      // 8. Advance Highway Warning Signpost (260m before turnout with active alternating hazard beacons)
      if (lot.z >= 180) {
        const advGroup = new THREE.Group();
        advGroup.name = `ScenicAdvSign_${lot.id}`;
        const advSignZ = Math.max(80, lot.z - 260);
        const advShoulderOffset = isRightSide ? (this.roadWidth * 0.5 + 4.2) : -(this.roadWidth * 0.5 + 4.2);
        const advTrans = this.getRoadTransformAtZ(advSignZ, advShoulderOffset, 0.15);

        const advW = 9.6;
        const advH = 5.2;
        const advD = 0.18;

        // Dual heavy-duty support posts strictly BEHIND the sign (Zero pole clipping on front face!)
        const advPostSpacing = 5.8;
        const advPostW = 0.36;
        const advPostH = 7.4;
        const advPostZ = -0.22;

        [-advPostSpacing * 0.5, advPostSpacing * 0.5].forEach((px, pIdx) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(advPostW, advPostH, advPostW), this.matSignPost);
          post.position.set(px, advPostH * 0.5, advPostZ);
          post.castShadow = true;
          advGroup.add(post);

          // Footing
          const footer = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.40, 0.60, 8), this.matCurb);
          footer.position.set(px, 0.30, advPostZ);
          advGroup.add(footer);

          // Dual Flashing Amber Hazard Beacons on top of posts (alternating strobes)
          const bHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.32, 10), this.matBeaconHousing);
          bHousing.position.set(px, advPostH + 0.16, advPostZ);
          advGroup.add(bHousing);

          const beaconMat = (pIdx === 0) ? this.matSignBeaconA : this.matSignBeaconB;
          const bLens = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.7), beaconMat);
          bLens.position.set(px, advPostH + 0.32, advPostZ);
          advGroup.add(bLens);
        });

        // Horizontal mounting stringers behind board
        [3.0, 5.8].forEach(sy => {
          const stringer = new THREE.Mesh(new THREE.BoxGeometry(advW * 0.88, 0.18, 0.12), this.matSignPost);
          stringer.position.set(0, sy, advPostZ + 0.12);
          advGroup.add(stringer);
        });

        // Main Board with multi-material (front face +Z textured, back face and sides dark backer)
        const advSignTex = createAdvanceSignTexture(lot);
        const advSignMat = new THREE.MeshBasicMaterial({ map: advSignTex });
        const advMaterials = [
          this.matSignBacker, // +X
          this.matSignBacker, // -X
          this.matSignBacker, // +Y
          this.matSignBacker, // -Y
          advSignMat,         // +Z (Front face facing oncoming traffic)
          this.matSignBacker  // -Z (Back face)
        ];
        const advBoard = new THREE.Mesh(new THREE.BoxGeometry(advW, advH, advD), advMaterials);
        advBoard.position.set(0, 4.8, 0);
        advBoard.castShadow = true;
        advGroup.add(advBoard);

        // Frame backer
        const advFrame = new THREE.Mesh(new THREE.BoxGeometry(advW + 0.14, advH + 0.14, 0.08), this.matSignFrameGold);
        advFrame.position.set(0, 4.8, -0.06);
        advGroup.add(advFrame);

        // Dual Overhead Solar Luminaire Downlights
        [-2.4, 2.4].forEach(lx => {
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.95), this.matLuminaireArm);
          arm.position.set(lx, 4.8 + advH * 0.5 + 0.22, 0.42);
          advGroup.add(arm);

          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.10, 0.26), this.matLuminaireArm);
          lamp.position.set(lx, 4.8 + advH * 0.5 + 0.18, 0.88);
          advGroup.add(lamp);

          const lightFace = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.22), this.matLuminaireLight);
          lightFace.rotateX(Math.PI * 0.5);
          lightFace.position.set(lx, 4.8 + advH * 0.5 + 0.12, 0.88);
          advGroup.add(lightFace);
        });

        // Position & Orient on road shoulder facing ONCOMING traffic
        advGroup.position.copy(advTrans.pos);
        advGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), advTrans.tangent);
        advGroup.rotateY(Math.PI); // Rotate 180° so +Z faces oncoming traffic!
        advGroup.rotateY(isRightSide ? -0.65 : 0.65); // Angled ~37° inward facing oncoming driver lanes

        this.addToChunk(advGroup, advSignZ);
      }


      // Register for interaction & animation
      const plaqueData = {
        id: lot.id,
        lotId: lot.id,
        name: lot.name,
        sub: lot.sub,
        zone: lot.zone,
        pos: kioskWorldPos.clone(),
        beaconGroup: beaconGroup,
        skyBeam: skyBeamMesh,
        starMarker: starMarker,
        baseY: postH + 1.15
      };
      this.historicalPlaques.push(plaqueData);
      this.animatedPlaqueBeacons.push(plaqueData);

      this.addToChunk(lotGroup, lot.z);
    });
  }

  // Authentic Start Line Staging Plaza with Checker Line, Grid Boxes & Racing Rumble Curbs
  buildStartStagingPlaza() {
    const stagingGroup = new THREE.Group();

    // 1. Approach Highway Asphalt extending seamlessly backward from Z = -70m to Z = 0m
    const approachLength = 70;
    const approachGeo = new THREE.PlaneGeometry(this.roadWidth, approachLength, 8, 20);
    approachGeo.rotateX(-Math.PI * 0.5);
    const approachMesh = new THREE.Mesh(approachGeo, this.matAsphalt);
    approachMesh.position.set(0, 0.12, -approachLength * 0.5);
    approachMesh.receiveShadow = true;
    stagingGroup.add(approachMesh);

    // Soft beveled asphalt apron transition dipping into the desert dunes at Z = -70m
    const bevelGeo = new THREE.PlaneGeometry(this.roadWidth + 4.0, 12.0);
    bevelGeo.rotateX(-Math.PI * 0.5);
    bevelGeo.rotateX(0.06); // gentle downslope into sand
    const bevelMesh = new THREE.Mesh(bevelGeo, this.matAsphaltShoulder);
    bevelMesh.position.set(0, 0.04, -approachLength - 5.5);
    stagingGroup.add(bevelMesh);

    // 2. Double Yellow Centerline along Approach (Z = -65m to Z = -2m)
    for (let z = -65; z <= -3; z += 6) {
      [-0.25, 0.25].forEach(offset => {
        const lineGeo = new THREE.PlaneGeometry(0.25, 4.2);
        lineGeo.rotateX(-Math.PI * 0.5);
        const line = new THREE.Mesh(lineGeo, this.matLanes);
        line.position.set(offset, 0.18, z);
        stagingGroup.add(line);
      });
    }

    // 3. White Shoulder Lines along Approach (Z = -66m to Z = -2m)
    const halfW = this.roadWidth * 0.5 - 1.2;
    for (let z = -66; z <= -2; z += 8) {
      [-halfW, halfW].forEach(offset => {
        const lineGeo = new THREE.PlaneGeometry(0.3, 6.0);
        lineGeo.rotateX(-Math.PI * 0.5);
        const line = new THREE.Mesh(lineGeo, this.matWhiteLanes);
        line.position.set(offset, 0.18, z);
        stagingGroup.add(line);
      });
    }

    // 4. Staging Grid Tire Launch Burnout Marks (Dual rubber strips at X = ±0.92m, Z = -3m to 26m)
    [-0.92, 0.92].forEach(tx => {
      // Multiple layered burnout patches for authentic feathered rubber deposition
      const burnoutGeo = new THREE.PlaneGeometry(0.36, 32.0);
      burnoutGeo.rotateX(-Math.PI * 0.5);
      const burnoutMesh = new THREE.Mesh(burnoutGeo, this.matRubberBurnout);
      burnoutMesh.position.set(tx, 0.17, 12.0);
      stagingGroup.add(burnoutMesh);

      // Darker concentrated launch patch right at the staging line (Z = -2m to 6m)
      const heavyGeo = new THREE.PlaneGeometry(0.42, 8.0);
      heavyGeo.rotateX(-Math.PI * 0.5);
      const heavyMesh = new THREE.Mesh(heavyGeo, this.matRubberBurnout);
      heavyMesh.position.set(tx, 0.175, 2.0);
      stagingGroup.add(heavyMesh);
    });

    this.group.add(stagingGroup);
  }

  /**
   * Update dynamic animated scenery elements (3D Historical Plaque Beacons) & proximity
   */
  update(dt, playerPos) {
    // 0. Spatial Chunk Visibility Culling (Road markers, studs, lines, delineators, turnouts)
    if (playerPos && this.roadChunks) {
      const curChunk = Math.floor(playerPos.z / this.chunkSize);
      if (curChunk !== this._lastRoadChunk) {
        this._lastRoadChunk = curChunk;
        const minChunk = Math.max(0, curChunk - 1);
        const maxChunk = Math.min(this.numChunks - 1, curChunk + 2);
        for (let i = 0; i < this.numChunks; i++) {
          this.roadChunks[i].visible = (i >= minChunk && i <= maxChunk);
        }
      }
    }

    const time = gameState.gameTime;

    // 1. Animate spinning & bobbing 3D Historical Plaque Beacons & Sky Pillars
    for (let i = 0; i < this.animatedPlaqueBeacons.length; i++) {
      const b = this.animatedPlaqueBeacons[i];
      if (b.beaconGroup) {
        b.beaconGroup.rotation.y += dt * 1.6;
        b.beaconGroup.position.y = b.baseY + Math.sin(time * 2.8 + i * 0.4) * 0.08;
      }
      if (b.skyBeam) {
        b.skyBeam.rotation.y += dt * 0.4;
      }
      if (b.starMarker) {
        b.starMarker.rotation.y += dt * 1.2;
        b.starMarker.position.y = (b.baseY + 14.85) + Math.sin(time * 2.2 + i) * 0.35;
      }
    }

    // 1.5. Alternate Flashing Amber Hazard Beacons on Scenic Turnout Highway Signs (MUTCD 1.5 Hz strobes)
    const flashPhase = Math.floor(time * 3.0) % 2 === 0;
    if (this.matSignBeaconA) {
      this.matSignBeaconA.color.setHex(flashPhase ? 0xfbbf24 : 0x78350f);
    }
    if (this.matSignBeaconB) {
      this.matSignBeaconB.color.setHex(flashPhase ? 0x78350f : 0xfbbf24);
    }

    // 2. Check Proximity to Historical Markers & Scenic Viewfinders
    if (playerPos && playerPos.x !== undefined && playerPos.z !== undefined) {
      const getDist = (targetPos) => {
        if (!targetPos) return 99999;
        if (typeof playerPos.distanceTo === 'function') return playerPos.distanceTo(targetPos);
        const dx = playerPos.x - targetPos.x;
        const dy = (playerPos.y || 0) - (targetPos.y || 0);
        const dz = playerPos.z - targetPos.z;
        return Math.hypot(dx, dy, dz);
      };

      let nearestPlaque = null;
      let minDistance = 22.0; // 22-meter interaction sphere around kiosks

      for (let i = 0; i < this.historicalPlaques.length; i++) {
        const plaque = this.historicalPlaques[i];
        const dist = getDist(plaque.pos);
        if (dist < minDistance) {
          minDistance = dist;
          nearestPlaque = {
            ...plaque,
            distance: dist
          };
        }
      }

      gameState.nearbyHistoryPlaque = nearestPlaque;

      // Check Proximity to Coin-Operated Scenic Viewfinders (within 5.5m of specific telescope stand)
      let nearestViewfinder = null;
      let minBinoDist = 5.5;
      if (this.scenicViewfinders && this.scenicViewfinders.length > 0) {
        for (let j = 0; j < this.scenicViewfinders.length; j++) {
          const vf = this.scenicViewfinders[j];
          const dist = getDist(vf.pos);
          if (dist < minBinoDist) {
            minBinoDist = dist;
            nearestViewfinder = {
              ...vf,
              distance: dist
            };
          }
        }
      }
      if (!gameState.isBinocularView) {
        gameState.nearbyViewfinder = nearestViewfinder;
      }

      // 🕵️ Mystery Crime Scene & Evidence Proximity Checks (All 9 Zones)
      const mission = gameState.mysteryMission;
      if (mission && mission.witnessedMurder && !mission.reportedToPolice) {
        if (!mission.clues) mission.clues = {};

        // Loop all 9 zone physical clue props
        for (let i = 0; i < ZONE_CLUES_CONFIG.length; i++) {
          const cfg = ZONE_CLUES_CONFIG[i];
          if (!mission.clues[cfg.key]) {
            const dist = getDist(cfg.pos);
            if (dist < (cfg.radius || 18.0)) {
              mission.clues[cfg.key] = true;
              if (cfg.key === 'zone1') mission.clues.getawayCar = true;
              if (cfg.key === 'zone2') mission.clues.burnerEvidence = true;
              mission.cluesFound = (mission.cluesFound || 0) + 1;
              gameState.score += 500;

              if (typeof window !== 'undefined' && window.game) {
                if (window.game.sound && window.game.sound.playClueDiscoveredChime) {
                  window.game.sound.playClueDiscoveredChime();
                }
                if (window.game.hud) {
                  window.game.hud.showActionToast(
                    `📁 EVIDENCE COLLECTED (${mission.cluesFound}/${mission.totalClues || 9})`,
                    `${cfg.name} discovered in ${cfg.locName}! +500 PTS`,
                    4500
                  );
                }
                if (window.game.saveManager) {
                  window.game.saveManager.save(true);
                }
              }
            }
          }
        }

        // Option A: Turn in Evidence at Malibu Sheriff Station (Z=5,050m)
        const malibuStationDist = getDist({ x: 22.0, y: 2.36, z: 5050.0 });
        if (malibuStationDist < 22.0) {
          mission.reportedToPolice = true;
          mission.reportedTime = Date.now();
          mission.reportingStation = 'Malibu';
          mission.state = 'solved';
          const pts = (mission.cluesFound >= 9) ? 15000 : (mission.cluesFound >= 4 ? 7500 : 2500);
          mission.scoreAwarded = pts;
          mission.rewardPoints = pts;
          gameState.score += pts;

          if (typeof window !== 'undefined' && window.game && window.game.mysteryCrimeScene) {
            window.game.mysteryCrimeScene.triggerPoliceTurnIn('Malibu Sheriff Station', pts);
          }
          if (typeof window !== 'undefined' && window.game && window.game.saveManager) {
            window.game.saveManager.save(true);
          }
        }

        // Option B: Turn in Evidence at Washington Federal Regional HQ (Z=22,800m)
        const fedStationDist = getDist({ x: 38.0, y: 3.5, z: 22800.0 });
        if (fedStationDist < 26.0) {
          mission.reportedToPolice = true;
          mission.reportedTime = Date.now();
          mission.reportingStation = 'Washington';
          mission.state = 'solved';
          const pts = (mission.cluesFound >= 9) ? 15000 : (mission.cluesFound >= 4 ? 7500 : 2500);
          mission.scoreAwarded = pts;
          mission.rewardPoints = pts;
          gameState.score += pts;

          if (typeof window !== 'undefined' && window.game && window.game.mysteryCrimeScene) {
            window.game.mysteryCrimeScene.triggerPoliceTurnIn('Washington Federal Headquarters', pts);
          }
          if (typeof window !== 'undefined' && window.game && window.game.saveManager) {
            window.game.saveManager.save(true);
          }
        }
      }
    }

    // 3. Dynamic Road Asphalt Wetness Response (Rain sheen & puddle darkening)
    const wetness = gameState.rainIntensity || 0.0;
    if (this.matAsphalt) {
      if (!this._cAsphaltDry) this._cAsphaltDry = new THREE.Color(0xd0d4da);
      if (!this._cAsphaltWet) this._cAsphaltWet = new THREE.Color(0x727a85);
      this.matAsphalt.color.copy(this._cAsphaltDry).lerp(this._cAsphaltWet, wetness);
    }
  }
}

