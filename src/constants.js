import * as THREE from 'three';

export const PHYSICS = {
  GRAVITY: -55.0,
  MASS: 1430,             // 911 GT3 RS lightweight curb weight
  ENGINE_FORCE: 24000,    // High-revving flat-6 / twin-turbo thrust
  BRAKE_FORCE: 62000,     // High-performance carbon ceramic braking power (increased for responsive, authoritative stopping)
  HANDBRAKE_FORCE: 54000, // Rear axle locking brake force for drifting and sharp stops
  REVERSE_ENGAGE_DELAY: 0.38, // Responsive brief delay (~380ms) holding brake while stopped before reverse gear engages
  NITRO_FORCE: 32000,
  MAX_SPEED_MPH: 195,
  NITRO_MAX_SPEED_MPH: 235,
  SPEED_SCALE: 0.60,      // Calibrated world translation scaling: keeps 195/235 MPH HUD display while providing realistic scenic highway distance and traversal pacing
  DRAG_COEFF: 0.35,       // Aerodynamic drag coefficient
  COAST_DRAG_ACCEL: 0.00035, // Smooth aerodynamic drag deceleration factor
  ROLLING_RESISTANCE_ACCEL: 0.75, // Smooth tire rolling resistance deceleration (m/s^2)
  STEER_SPEED: 3.2,       // Agile Porsche GT3 RS track steering response
  MAX_STEER_ANGLE: 0.48,  // Enhanced track steering angle (~28 deg) for sharper cornering
  MAX_LATERAL_OFFSET: 78.0, // Generous drivable corridor half-width from road center
  MAX_LATERAL_OFFSET_DESERT: 88.0, // Expanded desert sand dune exploration corridor
  
  // Track Suspension & Stance
  SUSPENSION_REST_LENGTH: 0.35,
  SUSPENSION_STIFFNESS: 58000,
  SUSPENSION_DAMPING: 4200,
  SUSPENSION_SPRING_RATE: 28.0,
  SUSPENSION_REBOUND_DAMP: 14.0,
  MAX_SUSPENSION_TRAVEL: 0.16,
  WHEEL_RADIUS: 0.34,
  TIRE_LATERAL_GRIP: 1.85,
  DRIFT_LATERAL_GRIP: 0.95,
  DRIFT_INERTIA: 0.88,
  CORNERING_STIFFNESS: 4.2,
  
  // Engine Heat & Turbo
  HEAT_GAIN_NITRO: 0.15,
  HEAT_GAIN_REDLINE: 0.22,  // heat-soak rate when redlining without nitro (scaled by proximity to redline)
  HEAT_LOSS_CRUISE: 0.09,
  HEAT_LOSS_IDLE: 0.20,
  HEAT_OVERHEAT_LIMIT: 1.0,
  NITRO_CAPACITY: 100.0,
  NITRO_RECHARGE_RATE: 5.0,
  NITRO_DRAIN_RATE: 22.0,
};

export const DRIVE_MODES = {
  MODE_HIGH: 'HIGH',
  MODE_MID: 'MID',
  MODE_LOW: 'LOW',
  // Backwards compatibility aliases
  MODE_2H: 'HIGH',
  MODE_4H: 'HIGH',
  MODE_4L: 'LOW',
  SPECS: {
    'HIGH': {
      name: 'HIGH GEAR',
      shortName: 'HIGH',
      maxSpeedMph: 195.0,
      torqueMult: 1.0,
      steerRateMult: 1.0,
      crawlAssist: false,
      diffLocked: false,
      transferWhine: 0.0,
      desc: 'High Range • Highway Touring & Speed'
    },
    'MID': {
      name: 'MID GEAR',
      shortName: 'MID',
      maxSpeedMph: 30.0,
      torqueMult: 2.1,
      steerRateMult: 0.92,
      crawlAssist: true,
      diffLocked: true,
      transferWhine: 0.45,
      desc: 'Mid Range 4WD (Gear 2) • Packed Dirt & Flowing Trail'
    },
    'LOW': {
      name: 'LOW GEAR',
      shortName: 'LOW',
      maxSpeedMph: 18.0,
      torqueMult: 3.8,
      steerRateMult: 0.88,
      crawlAssist: true,
      diffLocked: true,
      transferWhine: 1.0,
      desc: 'Low Range Crawl (Gear 1) • Rock Crawling, Mud Bogs & Riverbeds'
    },
    // Aliases to ensure no runtime errors from legacy references
    '2H': {
      name: 'HIGH GEAR',
      shortName: 'HIGH',
      maxSpeedMph: 195.0,
      torqueMult: 1.0,
      steerRateMult: 1.0,
      crawlAssist: false,
      diffLocked: false,
      transferWhine: 0.0,
      desc: 'High Range • Highway Touring & Speed'
    },
    '4H': {
      name: 'HIGH GEAR',
      shortName: 'HIGH',
      maxSpeedMph: 195.0,
      torqueMult: 1.0,
      steerRateMult: 1.0,
      crawlAssist: false,
      diffLocked: false,
      transferWhine: 0.0,
      desc: 'High Range • Highway Touring & Speed'
    },
    '4L': {
      name: 'LOW GEAR',
      shortName: 'LOW',
      maxSpeedMph: 18.0,
      torqueMult: 3.8,
      steerRateMult: 0.88,
      crawlAssist: true,
      diffLocked: true,
      transferWhine: 1.0,
      desc: 'Low Range Crawl (Gear 1) • Rock Crawling, Mud Bogs & Riverbeds'
    }
  }
};

export const ROAD = {
  WIDTH: 32.0,            // Expansive 32-meter multi-lane scenic highway (increased from 22.0m)
  HALF_WIDTH: 16.0,
  LANE_OFFSET: 5.2,       // Center lateral position for civilian & NPC traffic lanes
};

export const DAMAGE = {
  IMPACT_DAMAGE_BASE: 0.20,       // Baseline kinetic impact damage (reduced from 0.5)
  IMPACT_DAMAGE_SCALE: 2.0,       // Max collision impact scaling (reduced from 4.5)
  BARRIER_DAMAGE_BASE: 0.25,      // Baseline barrier scrape damage (reduced from 0.8)
  BARRIER_DAMAGE_SCALE: 1.8,      // Barrier crash scaling (reduced from 4.5)
  ROLLOVER_DAMAGE: 5.0,           // Damage on inverted rollover (reduced from 18.0)
  OFFROAD_DAMAGE_BASE: 0.15,      // Undercarriage off-road wear (reduced from 0.5)
  OFFROAD_DAMAGE_SCALE: 0.35,     // Max off-road speed scaling (reduced from 1.0)
  OFFROAD_ACCUMULATE_TIME: 4.5,   // Seconds between off-road damage ticks (increased from 2.4s)
  FATIGUE_INTEGRITY_THRESHOLD: 30.0, // Only incurs speed fatigue when integrity < 30% (was 50%)
  // Technical Trail Bottoming-Out & High-Speed Harsh Impact Damage
  TRAIL_BOTTOMING_DAMAGE_BASE: 0.75,
  TRAIL_BOTTOMING_DAMAGE_SCALE: 2.50,
  TRAIL_SAFE_SPEED_MID_MPH: 22.0,
  TRAIL_SAFE_SPEED_TECH_MPH: 12.0,
  FATIGUE_WEAR_RATE: 0.005,       // Structural fatigue rate at high speed (reduced from 0.02)
  
  // Integrity Threshold Stages (Higher tolerance buffer: stays pristine down to 50%)
  STAGE_1_INTEGRITY: 50,          // Scrapes and cosmetic marks below 50% (was 70%)
  STAGE_2_INTEGRITY: 25,          // Moderate denting & light steam below 25% (was 45%)
  STAGE_3_INTEGRITY: 10,          // Critical breakdown / limp mode below 10% (was 20%)
  TIRE_BLOWOUT_INTEGRITY: 4.0,    // Rim blowout only at extreme damage < 4% (was 8%)
  TIRE_FATIGUE_TIME: 60.0,        // Prolonged driving under 8% before blowout (was 25s at < 12%)
  MISFIRE_INTEGRITY: 8.0,         // Engine sputter only at extreme damage < 8% (was 15%)
  
  // Mechanical Handling Retention Factors
  MIN_POWER_FACTOR: 0.75,         // Engine retains 75% power even at 0% integrity (was 55%)
  MIN_SPEED_CAP_MPH: 120.0,       // Top speed cap retains 120 mph even at 0% integrity (was 65 mph)
  WHEEL_PULL_MULT: 0.08,          // Steering alignment pull multiplier (reduced from 0.18)
  CHASSIS_WOBBLE_MULT: 0.09,      // High-speed wheel vibration multiplier (reduced from 0.25)
  TIRE_RUB_MULT: 0.08,            // Fender tire friction multiplier (reduced from 0.20)
  BRAKE_SWERVE_MULT: 0.05,        // Braking swerve multiplier (reduced from 0.12)
};

export const CAMERAS = {
  CHASE: 'CHASE',
  COCKPIT: 'COCKPIT',
  HOOD: 'HOOD',
  PHOTO: 'PHOTO'
};

export const ZONES = [
  {
    id: 0,
    name: 'SOUTHERN CALIFORNIA DESERT',
    sub: 'Mojave Desert & Route 66',
    temperature: '104°F',
    tempC: '40°C',
    tempLabel: '104°F • HOT & DRY',
    skyTop: '#0a3d71',      // Deep cerulean at zenith (clean desert air)
    skyMid: '#2a7ac2',      // Mid-sky transition blue
    skyHorizon: '#e8c48f',  // Warm golden horizon haze
    hazeColor: '#f2d8a0',   // Ground-level atmospheric haze
    fogColor: '#e8c48f',    // Matching horizon haze for seamless transitions
    fogNear: 350,
    fogFar: 2400,
    sunColor: '#fffaf0',    // Warm sun disc
    ambientColor: '#fbdec5', // Warm ambient fill matching sandstone
    groundColor: '#d8aa6b',
    roadColor: '#363430',
    rockColor: '#b45a32',
    plantType: 'cactus',
    lengthMeters: 6500,
    cloudType: 'cirrus',
    cloudDensity: 0.20,
    cloudScale: 0.85,
    cloudSpeed: 0.8,
    heatShimmer: 0.32,
    mieG: 0.84,
    sunGlow: 1.60,
    starVisibility: 0.0,
    alpenglowColor: '#e8c48f',
    roadGrip: 1.0,
    windForce: 0.0,
    windAngle: 0.0,
    precipitation: 'none',
    heatRateMult: 1.25,
    coolRateMult: 0.85,
    weatherBadge: '☀️ 104°F • HOT & DRY • GRIP 100%',
  },
  {
    id: 1,
    name: 'MALIBU & PACIFIC COAST HIGHWAY',
    sub: 'Santa Monica to Point Mugu',
    temperature: '75°F',
    tempC: '24°C',
    tempLabel: '75°F • COASTAL BREEZE',
    skyTop: '#0e4a8c',
    skyMid: '#3282be',
    skyHorizon: '#7cc4e8',
    hazeColor: '#aee0f5',
    fogColor: '#96cee8',
    fogNear: 380,
    fogFar: 2200,
    sunColor: '#fff8e6',
    ambientColor: '#d6ecf8',
    groundColor: '#6f8252',
    roadColor: '#303236',
    rockColor: '#9c8a74',
    plantType: 'fan_palm',
    lengthMeters: 8000,
    cloudType: 'marine_stratus',
    cloudDensity: 0.45,
    cloudScale: 1.20,
    cloudSpeed: 1.1,
    heatShimmer: 0.08,
    mieG: 0.77,
    sunGlow: 1.25,
    starVisibility: 0.0,
    alpenglowColor: '#f7c4a0',
    roadGrip: 1.0,
    windForce: 4.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 1.0,
    coolRateMult: 1.0,
    weatherBadge: '🌊 75°F • COASTAL BREEZE • GRIP 100%',
  },
  {
    id: 2,
    name: 'BIG SUR HIGHWAY 1',
    sub: 'Cliffs of Bixby & McWay Falls',
    temperature: '66°F',
    tempC: '19°C',
    tempLabel: '66°F • OCEAN MIST',
    skyTop: '#184e80',
    skyMid: '#4584b4',
    skyHorizon: '#94bed8',
    hazeColor: '#b8d8ec',
    fogColor: '#a8cee0',
    fogNear: 320,
    fogFar: 2200,
    sunColor: '#fff5dc',
    ambientColor: '#d8ecf8',
    groundColor: '#6a9460',
    roadColor: '#484c52',
    rockColor: '#889098',
    plantType: 'cypress',
    lengthMeters: 6000,
    cloudType: 'cliff_fog',
    cloudDensity: 0.65,
    cloudScale: 1.35,
    cloudSpeed: 0.9,
    heatShimmer: 0.0,
    mieG: 0.73,
    sunGlow: 1.15,
    starVisibility: 0.0,
    alpenglowColor: '#f0bca0',
    roadGrip: 0.94,
    windForce: 8.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 0.90,
    coolRateMult: 1.15,
    weatherBadge: '🌫️ 66°F • OCEAN MIST • GRIP 94%',
  },
  {
    id: 3,
    name: 'MONTEREY BAY & CARMEL',
    sub: 'Cannery Row & 17-Mile Drive',
    temperature: '62°F',
    tempC: '17°C',
    tempLabel: '62°F • MILD & CRISP',
    skyTop: '#184c76',
    skyMid: '#4482a6',
    skyHorizon: '#8ec2d8',
    hazeColor: '#b0d8ea',
    fogColor: '#9ac4d4',
    fogNear: 320,
    fogFar: 2200,
    sunColor: '#fff2d6',
    ambientColor: '#c4e0ea',
    groundColor: '#2e8540',
    roadColor: '#2e3033',
    rockColor: '#707880',
    plantType: 'monterey_pine',
    lengthMeters: 5000,
    cloudType: 'altocumulus',
    cloudDensity: 0.52,
    cloudScale: 1.10,
    cloudSpeed: 1.2,
    heatShimmer: 0.0,
    mieG: 0.75,
    sunGlow: 1.10,
    starVisibility: 0.0,
    alpenglowColor: '#f4c6b0',
    roadGrip: 0.98,
    windForce: 4.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 0.95,
    coolRateMult: 1.05,
    weatherBadge: '🌤️ 62°F • MILD & CRISP • GRIP 98%',
  },
  {
    id: 4,
    name: 'NORTHERN CALIFORNIA & MARIN',
    sub: 'Golden Gate & Wine Country',
    temperature: '64°F',
    tempC: '18°C',
    tempLabel: '64°F • SUNNY VALLEYS',
    skyTop: '#144472',
    skyMid: '#3a78a6',
    skyHorizon: '#72a8cc',
    hazeColor: '#9ecde8',
    fogColor: '#82a8be',
    fogNear: 300,
    fogFar: 2200,
    sunColor: '#fff8ea',
    ambientColor: '#ccdbe6',
    groundColor: '#546e42',
    roadColor: '#2d2f33',
    rockColor: '#607274',
    plantType: 'eucalyptus',
    lengthMeters: 5500,
    cloudType: 'microclimate_fog',
    cloudDensity: 0.58,
    cloudScale: 1.25,
    cloudSpeed: 1.3,
    heatShimmer: 0.0,
    mieG: 0.76,
    sunGlow: 1.20,
    starVisibility: 0.0,
    alpenglowColor: '#f7d0a8',
    roadGrip: 0.96,
    windForce: 6.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 1.0,
    coolRateMult: 1.0,
    weatherBadge: '☀️ 64°F • SUNNY VALLEYS • GRIP 96%',
  },
  {
    id: 5,
    name: 'REDWOOD FOREST',
    sub: 'Avenue of the Giants',
    temperature: '58°F',
    tempC: '14°C',
    tempLabel: '58°F • DEEP CANOPY SHADE',
    skyTop: '#0a2a46',
    skyMid: '#265470',
    skyHorizon: '#4e8296',
    hazeColor: '#5a8c88',
    fogColor: '#426c7a',
    fogNear: 220,
    fogFar: 2000,
    sunColor: '#ffd89e',
    ambientColor: '#8ca69e',
    groundColor: '#1e3020',
    roadColor: '#28292b',
    rockColor: '#4a443e',
    plantType: 'redwood',
    lengthMeters: 5000,
    cloudType: 'canopy_mist',
    cloudDensity: 0.38,
    cloudScale: 0.95,
    cloudSpeed: 0.6,
    heatShimmer: 0.0,
    mieG: 0.68,
    sunGlow: 0.95,
    starVisibility: 0.0,
    alpenglowColor: '#e0c8b0',
    roadGrip: 0.94,
    windForce: 0.0,
    windAngle: 0.0,
    precipitation: 'none',
    heatRateMult: 0.65,
    coolRateMult: 1.45,
    weatherBadge: '🌲 58°F • CANOPY SHADE • COOL BOOST',
  },
  {
    id: 6,
    name: 'OREGON COAST',
    sub: 'Cannon Beach & Haystack Rock',
    temperature: '55°F',
    tempC: '13°C',
    tempLabel: '55°F • PACIFIC SPRAY',
    skyTop: '#163a5e',
    skyMid: '#3c6e94',
    skyHorizon: '#749cb6',
    hazeColor: '#9ec4dc',
    fogColor: '#7898ac',
    fogNear: 280,
    fogFar: 2200,
    sunColor: '#f7ebcf',
    ambientColor: '#b5cbd6',
    groundColor: '#ab9b83',
    roadColor: '#282b2e',
    rockColor: '#373b40',
    plantType: 'spruce',
    lengthMeters: 4500,
    cloudType: 'storm_cumulus',
    cloudDensity: 0.80,
    cloudScale: 1.45,
    cloudSpeed: 1.5,
    heatShimmer: 0.0,
    mieG: 0.70,
    sunGlow: 0.90,
    starVisibility: 0.0,
    alpenglowColor: '#e8b898',
    roadGrip: 0.84,
    windForce: 14.0,
    windAngle: 1.57,
    precipitation: 'rain',
    heatRateMult: 0.85,
    coolRateMult: 1.20,
    weatherBadge: '🌧️ 55°F • PACIFIC RAIN • GRIP 84%',
  },
  {
    id: 7,
    name: 'COLUMBIA RIVER GORGE',
    sub: 'Multnomah Falls & Crown Point',
    temperature: '60°F',
    tempC: '16°C',
    tempLabel: '60°F • RIVER BREEZE',
    skyTop: '#123e68',
    skyMid: '#38729e',
    skyHorizon: '#78a8ca',
    hazeColor: '#a4d0ec',
    fogColor: '#78a2be',
    fogNear: 300,
    fogFar: 2200,
    sunColor: '#fff2db',
    ambientColor: '#bed3e0',
    groundColor: '#3e4442',
    roadColor: '#2b2d30',
    rockColor: '#2e3533',
    plantType: 'douglas_fir',
    lengthMeters: 4500,
    cloudType: 'scud_gorge',
    cloudDensity: 0.65,
    cloudScale: 1.20,
    cloudSpeed: 2.8,
    heatShimmer: 0.0,
    mieG: 0.74,
    sunGlow: 1.10,
    starVisibility: 0.0,
    alpenglowColor: '#f4baa0',
    roadGrip: 0.96,
    windForce: 38.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 0.90,
    coolRateMult: 1.25,
    weatherBadge: '💨 60°F • GORGE GUSTS 45MPH • WIND PULL',
  },
  {
    id: 8,
    name: 'WASHINGTON & CASCADE PASS',
    sub: 'Alpine Summit & Snowfall',
    temperature: '26°F',
    tempC: '-3°C',
    tempLabel: '26°F • ALPINE SNOWFALL',
    skyTop: '#102038',
    skyMid: '#304c68',
    skyHorizon: '#688ca8',
    hazeColor: '#9bb8d0',
    fogColor: '#789cb8',
    fogNear: 200,
    fogFar: 1800,
    sunColor: '#fff5e0',
    ambientColor: '#c0d4e8',
    groundColor: '#d6e4ee',
    roadColor: '#3a4048',
    rockColor: '#5a626c',
    plantType: 'snow_fir',
    lengthMeters: 4500,
    cloudType: 'snow_overcast',
    cloudDensity: 0.85,
    cloudScale: 1.40,
    cloudSpeed: 0.8,
    heatShimmer: 0.0,
    mieG: 0.72,
    sunGlow: 0.80,
    starVisibility: 0.1,
    alpenglowColor: '#e0c8d8',
    roadGrip: 0.70,
    windForce: 12.0,
    windAngle: 1.57,
    precipitation: 'snow',
    heatRateMult: 0.50,
    coolRateMult: 1.60,
    weatherBadge: '❄️ 26°F • ALPINE SNOWFALL • GRIP 70%',
  },
  {
    id: 9,
    name: 'CASCADE ALPINE PASS & RAINIER',
    sub: 'Mount Rainier & Paradise Valley',
    temperature: '34°F',
    tempC: '1°C',
    tempLabel: '34°F • ALPINE FLURRIES',
    skyTop: '#0c2238',
    skyMid: '#244866',
    skyHorizon: '#6e8ea8',
    hazeColor: '#90a8be',
    fogColor: '#7a96ae',
    fogNear: 220,
    fogFar: 2000,
    sunColor: '#fff2db',
    ambientColor: '#bed3e0',
    groundColor: '#78887a',
    roadColor: '#303438',
    rockColor: '#4a5056',
    plantType: 'alpine_larch',
    lengthMeters: 4000,
    cloudType: 'alpine_stratus',
    cloudDensity: 0.75,
    cloudScale: 1.30,
    cloudSpeed: 1.1,
    heatShimmer: 0.0,
    mieG: 0.74,
    sunGlow: 1.05,
    starVisibility: 0.05,
    alpenglowColor: '#f7c0b0',
    roadGrip: 0.82,
    windForce: 18.0,
    windAngle: 1.57,
    precipitation: 'snow',
    heatRateMult: 0.70,
    coolRateMult: 1.50,
    weatherBadge: '❄️ 34°F • ALPINE FLURRIES • GRIP 82%',
  },
  {
    id: 10,
    name: 'IDAHO PANHANDLE & LAKE COEUR D\'ALENE',
    sub: 'Timber Country & Silver Valley Mining',
    temperature: '62°F',
    tempC: '17°C',
    tempLabel: '62°F • CLEAR MOUNTAIN AIR',
    skyTop: '#0e3a6e',         // Deep cobalt Inland Northwest sky
    skyMid: '#2a6aaa',         // Rich afternoon blue
    skyHorizon: '#7ec8e8',     // Crystal-clear horizon
    hazeColor: '#b8e4f4',      // Crisp pine-scented air
    fogColor: '#92cce0',       // Distant cedar-valley haze
    fogNear: 340,
    fogFar: 2400,
    sunColor: '#fff8e0',       // Warm high-mountain sun disc
    ambientColor: '#c4dce8',   // Cool sapphire lake ambient fill
    groundColor: '#3e5c30',    // Deep Northwest pine forest floor
    roadColor: '#2c3030',      // Dark asphalt with timber trestle bridges
    rockColor: '#5a5248',      // Weathered quartzite and schist
    plantType: 'ponderosa_pine',
    lengthMeters: 4000,
    cloudType: 'fair_weather_cumulus',
    cloudDensity: 0.35,
    cloudScale: 1.10,
    cloudSpeed: 1.0,
    heatShimmer: 0.0,
    mieG: 0.76,
    sunGlow: 1.20,
    starVisibility: 0.02,
    alpenglowColor: '#f4d0a0',
    roadGrip: 0.95,
    windForce: 5.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 0.92,
    coolRateMult: 1.10,
    weatherBadge: '🌲 62°F • CLEAR MOUNTAIN AIR • GRIP 95%',
  },
  {
    id: 11,
    name: 'MONTANA BIG SKY & GLACIER',
    sub: 'Going-to-the-Sun Road & Logan Pass',
    temperature: '48°F',
    tempC: '9°C',
    tempLabel: '48°F • CONTINENTAL DIVIDE',
    skyTop: '#062044',         // Deep cobalt Northern Rockies alpine sky
    skyMid: '#1e5288',         // Cold crisp mountain afternoon blue
    skyHorizon: '#6fa6d4',     // Bright alpenglow horizon
    hazeColor: '#9ec0de',      // Glacial cirque mist
    fogColor: '#789cbe',       // Distant Siyeh limestone haze
    fogNear: 350,
    fogFar: 2600,
    sunColor: '#fff5e0',       // Radiant high-altitude sun disc
    ambientColor: '#bed3e0',   // Cold glacial ice ambient fill
    groundColor: '#4f5a48',    // Subalpine tundra & lichen rock
    roadColor: '#2b2d30',      // Going-to-the-Sun historic roadbed
    rockColor: '#6c584c',      // Grinnell red argillite & Siyeh limestone
    plantType: 'subalpine_fir',
    lengthMeters: 4500,
    cloudType: 'swift_scud',
    cloudDensity: 0.50,
    cloudScale: 1.35,
    cloudSpeed: 2.2,
    heatShimmer: 0.0,
    mieG: 0.78,
    sunGlow: 1.30,
    starVisibility: 0.05,
    alpenglowColor: '#f8bca0',
    roadGrip: 0.92,
    windForce: 24.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 0.85,
    coolRateMult: 1.30,
    weatherBadge: '🏔️ 48°F • CONTINENTAL DIVIDE • GRIP 92%',
  },
  {
    id: 12,
    name: 'LAS VEGAS STRIP & RED ROCK',
    sub: 'Neon Boulevard & Aztec Sandstone Canyons',
    temperature: '88°F',
    tempC: '31°C',
    tempLabel: '88°F • NEON DESERT NIGHT',
    skyTop: '#080614',         // Deep desert night sky with violet-indigo tint
    skyMid: '#1a102c',         // Atmospheric twilight neon glow
    skyHorizon: '#4a1e42',     // Vibrant magenta-amber city glow horizon
    hazeColor: '#6b325c',      // Neon haze over the valley
    fogColor: '#421a38',       // Distant Spring Mountain silhouettes
    fogNear: 350,
    fogFar: 2800,
    sunColor: '#ffddaa',       // Warm desert dusk illumination
    ambientColor: '#c8a4d4',   // Neon ambient fill
    groundColor: '#785642',    // Mojave desert sand & caliche clay
    roadColor: '#242426',      // Smooth dark asphalt boulevard
    rockColor: '#9e3a2b',      // Crimson & cream banded Aztec sandstone
    plantType: 'joshua_tree',
    lengthMeters: 4500,
    cloudType: 'desert_cirrus',
    cloudDensity: 0.20,
    cloudScale: 1.10,
    cloudSpeed: 0.6,
    heatShimmer: 0.28,
    mieG: 0.82,
    sunGlow: 1.40,
    starVisibility: 0.85,
    alpenglowColor: '#e07a5f',
    roadGrip: 1.00,
    windForce: 6.0,
    windAngle: 1.57,
    precipitation: 'none',
    heatRateMult: 1.15,
    coolRateMult: 0.85,
    weatherBadge: '🎰 88°F • NEON DESERT NIGHT • GRIP 100%',
  }
];

// Dynamically compute cumulative zMin and zMax for all zones
let cumulativeZoneZ = 0;
ZONES.forEach(z => {
  z.zMin = cumulativeZoneZ;
  cumulativeZoneZ += z.lengthMeters;
  z.zMax = cumulativeZoneZ;
});
export const TOTAL_HIGHWAY_LENGTH = cumulativeZoneZ; // 66,500 meters

/**
 * Piecewise linear control points mapping each zone builder's authored Z coordinates
 * [zoneIdx * 2600 .. (zoneIdx + 1) * 2600] to the expanded 62km world coordinates.
 */
export const ZONE_CONTROL_POINTS = {
  1: [ // Malibu (authored: 2600..5200 -> world: 6500..14500)
    [2600, 6500],
    [2900, 7600],
    [3500, 9800],
    [4100, 11200],
    [4800, 12950],
    [5050, 14000],
    [5180, 14400],
    [5200, 14500]
  ],
  2: [ // Big Sur (authored: 5200..7800 -> world: 14500..20500)
    [5200, 14500],
    [5500, 15100],
    [6300, 17900],
    [6650, 18650],
    [7300, 19400],
    [7600, 20150],
    [7800, 20500]
  ],
  3: [ // Monterey & Carmel (authored: 7800..10400 -> world: 20500..25500)
    [7800, 20500],
    [8300, 21300],
    [8800, 22250],
    [9300, 23200],
    [9750, 24150],
    [10150, 25100],
    [10400, 25500]
  ],
  4: [ // NorCal & Marin (authored: 10400..13000 -> world: 25500..31000)
    [10400, 25500],
    [10800, 26300],
    [11400, 28000],
    [11700, 28900],
    [12400, 29800],
    [12800, 30650],
    [13000, 31000]
  ],
  5: [ // Redwood Forest (authored: 13000..15600 -> world: 31000..36000)
    [13000, 31000],
    [13500, 31850],
    [13900, 32800],
    [14400, 33750],
    [14950, 34700],
    [15300, 35600],
    [15600, 36000]
  ],
  6: [ // Oregon Coast (authored: 15600..18200 -> world: 36000..40500)
    [15600, 36000],
    [16100, 36900],
    [16600, 37950],
    [17100, 39000],
    [17650, 40050],
    [18200, 40500]
  ],
  7: [ // Columbia River Gorge (authored: 18200..20800 -> world: 40500..45000)
    [18200, 40500],
    [18700, 41400],
    [19250, 42450],
    [19850, 43500],
    [20450, 44550],
    [20800, 45000]
  ],
  8: [ // Washington & Olympic (authored: 20800..23400 -> world: 45000..49500)
    [20800, 45000],
    [21450, 45900],
    [21950, 46950],
    [22550, 48000],
    [23100, 49050],
    [23400, 49500]
  ],
  9: [ // Cascade Pass (authored: 23400..26000 -> world: 49500..53500)
    [23400, 49500],
    [24100, 50700],
    [24900, 52300],
    [25600, 53100],
    [26000, 53500]
  ],
  10: [ // Idaho Panhandle (authored: 26000..28600 -> world: 53500..57500)
    [26000, 53500],
    [26800, 54700],
    [27600, 56300],
    [28300, 57100],
    [28600, 57500]
  ],
  11: [ // Montana Glacier (authored: 28600..31200 -> world: 57500..62000)
    [28600, 57500],
    [29200, 58800],
    [30000, 60000],
    [30800, 61200],
    [31200, 62000]
  ],
  12: [ // Las Vegas & Red Rock (authored: 31200..33800 -> world: 62000..66500)
    [31200, 62000],
    [31800, 63100],
    [32500, 64300],
    [33200, 65500],
    [33800, 66500]
  ]
};

export function interpolateZoneZ(authoredZ, controlPoints) {
  if (!controlPoints || controlPoints.length === 0) return authoredZ;
  if (authoredZ <= controlPoints[0][0]) return controlPoints[0][1];
  const last = controlPoints[controlPoints.length - 1];
  if (authoredZ >= last[0]) return last[1];

  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = controlPoints[i];
    const p1 = controlPoints[i + 1];
    if (authoredZ >= p0[0] && authoredZ <= p1[0]) {
      const span = p1[0] - p0[0];
      if (span <= 0.0001) return p0[1];
      const t = (authoredZ - p0[0]) / span;
      return p0[1] + t * (p1[1] - p0[1]);
    }
  }
  return last[1];
}

export function inverseZoneZ(worldZ, controlPoints) {
  if (!controlPoints || controlPoints.length === 0) return worldZ;
  if (worldZ <= controlPoints[0][1]) return controlPoints[0][0];
  const last = controlPoints[controlPoints.length - 1];
  if (worldZ >= last[1]) return last[0];

  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = controlPoints[i];
    const p1 = controlPoints[i + 1];
    if (worldZ >= p0[1] && worldZ <= p1[1]) {
      const span = p1[1] - p0[1];
      if (span <= 0.0001) return p0[0];
      const t = (worldZ - p0[1]) / span;
      return p0[0] + t * (p1[0] - p0[0]);
    }
  }
  return last[0];
}

export const LANDMARKS = [
  // Zone 0: Mojave Desert (0 - 6500m)
  { id: 'bottle_tree', name: "Elmer's Bottle Tree Ranch", offsetMeters: 600 },
  { id: 'wigwam_motel', name: 'Wigwam Village Motel', offsetMeters: 1250 },
  { id: 'route66_diner', name: 'Route 66 Neon Diner', offsetMeters: 1900 },
  { id: 'coyote_ridge', name: 'Coyote Ridge 4x4 Trailhead', offsetMeters: 2550 },
  { id: 'mojave_mesas', name: 'Mojave Mesas & Stone Arch', offsetMeters: 3850 },
  { id: 'cabazon_dinos', name: 'Cabazon Giant Dinosaurs', offsetMeters: 4500 },
  { id: 'desert_outlets', name: 'Desert Hills Outlets Plaza', offsetMeters: 5150 },
  { id: 'calico_ghost', name: 'Calico Ghost Town Overlook', offsetMeters: 5700 },
  { id: 'roys_motel', name: "Roy's Motel Neon Sign", offsetMeters: 6300 },

  // Zone 1: Malibu & PCH (6500 - 14500m)
  { id: 'muscle_beach', name: 'Original Santa Monica Muscle Beach', offsetMeters: 7050 },
  { id: 'santa_monica_pier', name: 'Santa Monica Pacific Wheel', offsetMeters: 7600 },
  { id: 'california_incline', name: 'California Incline & Palisades Bluffs', offsetMeters: 8150 },
  { id: 'pacific_park', name: 'Pacific Park Pier & Solar Wheel', offsetMeters: 8700 },
  { id: 'will_rogers', name: 'Will Rogers State Beach & Baywatch HQ', offsetMeters: 9250 },
  { id: 'getty_villa', name: 'The Getty Villa Roman Colonnade', offsetMeters: 9800 },
  { id: 'topanga_canyon', name: 'Topanga Beach Surf Shack & VW Bus', offsetMeters: 10350 },
  { id: 'malibu_pier', name: 'Malibu Pier & Surfrider Beach', offsetMeters: 11200 },
  { id: 'carbon_beach', name: 'Carbon Beach Stilt Mansions', offsetMeters: 11800 },
  { id: 'zuma_beach', name: 'Zuma Beach Lifeguard Tower 26', offsetMeters: 12400 },
  { id: 'point_dume', name: 'Point Dume Marine Nature Reserve', offsetMeters: 12950 },
  { id: 'el_matador', name: 'El Matador Sea Arches', offsetMeters: 13500 },
  { id: 'neptunes_net', name: "Neptune's Net Seafood Roadhouse", offsetMeters: 14000 },
  { id: 'point_mugu', name: 'Point Mugu Rock Bluff Cut', offsetMeters: 14400 },

  // Zone 2: Big Sur (14500 - 20500m)
  { id: 'big_sur_inn', name: 'Big Sur River Inn', offsetMeters: 15100 },
  { id: 'hurricane_point', name: 'Hurricane Point Ocean Vista', offsetMeters: 15800 },
  { id: 'mcway_falls', name: 'McWay Falls Waterfall Cove', offsetMeters: 16500 },
  { id: 'henry_miller', name: 'Henry Miller Library in the Pines', offsetMeters: 17200 },
  { id: 'nepenthe', name: 'Nepenthe Cliffside Restaurant', offsetMeters: 17900 },
  { id: 'bixby_bridge', name: 'Bixby Creek Arch Bridge', offsetMeters: 18650 },
  { id: 'pfeiffer_arch', name: 'Pfeiffer Beach Keyhole Arch', offsetMeters: 19400 },
  { id: 'point_sur_light', name: 'Point Sur Historic Lightstation', offsetMeters: 20150 },

  // Zone 3: Monterey & Carmel (20500 - 25500m)
  { id: 'cannery_row', name: 'Cannery Row & Monterey Bay Aquarium', offsetMeters: 21300 },
  { id: 'pebble_beach', name: 'Pebble Beach Golf Links', offsetMeters: 22250 },
  { id: 'lone_cypress', name: '17-Mile Drive The Lone Cypress', offsetMeters: 23200 },
  { id: 'carmel_cottages', name: 'Carmel Storybook Thatched Cottages', offsetMeters: 24150 },
  { id: 'carmel_mission', name: 'Carmel Mission Basilica (1797)', offsetMeters: 25100 },

  // Zone 4: NorCal & Marin (25500 - 31000m)
  { id: 'painted_ladies', name: 'SF Painted Ladies Victorian Row', offsetMeters: 26300 },
  { id: 'cable_car', name: 'San Francisco Historic Cable Car', offsetMeters: 27150 },
  { id: 'marin_headlands', name: 'Marin Headlands Artillery Bunkers', offsetMeters: 28000 },
  { id: 'golden_gate', name: 'Golden Gate Suspension Bridge', offsetMeters: 28900 },
  { id: 'sonoma_vineyard', name: 'Sonoma Valley Mission Chateau & Vineyards', offsetMeters: 29800 },
  { id: 'bodega_church', name: 'Bodega Bay St. Teresa Church', offsetMeters: 30650 },

  // Zone 5: Redwood Forest (31000 - 36000m)
  { id: 'covered_bridge', name: 'Redwood Creek Covered Timber Bridge', offsetMeters: 31850 },
  { id: 'chandelier_tree', name: 'Chandelier Drive-Thru Redwood', offsetMeters: 32800 },
  { id: 'carson_mansion', name: 'Carson Mansion Eureka Victorian', offsetMeters: 33750 },
  { id: 'bigfoot_museum', name: 'Legend of Bigfoot Curiosity Museum', offsetMeters: 34700 },
  { id: 'sawmill_camp', name: 'Redwood Logging Sawmill & Steam Donkey', offsetMeters: 35600 },

  // Zone 6: Oregon Coast (36000 - 40500m)
  { id: 'yaquina_light', name: 'Yaquina Head Lighthouse', offsetMeters: 36900 },
  { id: 'haystack_rock', name: 'Haystack Rock & The Needles', offsetMeters: 37950 },
  { id: 'driftwood_caves', name: 'Oregon Driftwood Beach & Sea Caves', offsetMeters: 39000 },
  { id: 'tillamook_barn', name: 'Tillamook Cheese Creamery & Giant Barn', offsetMeters: 40050 },

  // Zone 7: Columbia River Gorge (40500 - 45000m)
  { id: 'bridge_of_gods', name: 'Bridge of the Gods Steel Cantilever Span', offsetMeters: 41400 },
  { id: 'multnomah_falls', name: 'Multnomah Falls & Benson Stone Bridge', offsetMeters: 42450 },
  { id: 'bonneville_dam', name: 'Bonneville Hydroelectric Dam Spillway', offsetMeters: 43500 },
  { id: 'vista_house', name: 'Vista House at Crown Point', offsetMeters: 44550 },

  // Zone 8: Washington & Olympic (45000 - 49500m)
  { id: 'snoqualmie_falls', name: 'Snoqualmie Falls & Great Northern Lodge', offsetMeters: 45900 },
  { id: 'puget_ferry', name: 'Washington State Jumbo Puget Sound Ferry', offsetMeters: 46950 },
  { id: 'space_needle', name: 'Seattle Space Needle & Mount Rainier', offsetMeters: 48000 },
  { id: 'pike_place', name: 'Pike Place Public Market & Neon Clock', offsetMeters: 49050 },

  // Zone 9: Cascade Pass & Mount Rainier (49500 - 53500m)
  { id: 'paradise_lodge', name: 'Paradise Historic Timber Lodge (1916)', offsetMeters: 50700 },
  { id: 'narada_falls', name: 'Narada Falls Basalt Chasm', offsetMeters: 52300 },
  { id: 'rainier_summit', name: 'Mount Rainier Glacier Summit Overlook', offsetMeters: 53100 },

  // Zone 10: Idaho Panhandle & Lake Coeur d'Alene (53500 - 57500m)
  { id: 'coeur_dalene_boardwalk', name: "Lake Coeur d'Alene Floating Boardwalk & Marina", offsetMeters: 54700 },
  { id: 'cataldo_mission', name: "Cataldo Old Mission — Idaho's Oldest Building (1853)", offsetMeters: 56300 },
  { id: 'silver_valley_mine', name: "Silver Valley Mine Headframe & Ore Chutes", offsetMeters: 57100 },

  // Zone 11: Montana Big Sky & Glacier (57500 - 62000m)
  { id: 'lake_mcdonald', name: "Lake McDonald Cedar Chalets & Colored Pebbles", offsetMeters: 58800 },
  { id: 'weeping_wall', name: "The Weeping Wall & Triple Stone Arches", offsetMeters: 60000 },
  { id: 'logan_pass', name: "Logan Pass Continental Divide (6,646 ft)", offsetMeters: 61200 },

  // Zone 12: Las Vegas Strip & Red Rock Canyon (62000 - 66500m)
  { id: 'vegas_sign', name: "Welcome to Fabulous Las Vegas Sign", offsetMeters: 63100 },
  { id: 'strip_pyramid_fountains', name: "The Strip: Luxor Pyramid & Bellagio Dancing Fountains", offsetMeters: 64300 },
  { id: 'red_rock_escarpment', name: "Red Rock Canyon Aztec Sandstone Escarpment", offsetMeters: 65500 }
];
