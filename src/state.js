import { CAMERAS } from './constants.js';

export const gameState = {
  // Driving & Physics
  speed: 0,            // m/s
  speedMph: 0,         // mph display
  engineRpm: 1000,
  gear: 1,
  steerInput: 0,
  throttleInput: 0,
  brakeInput: 0,
  handbrake: false,
  isDrifting: false,
  lateralSlipVelocity: 0,
  suspensionCompression: 0,
  isAirborne: false,
  isStuck: false,
  isOutOfBounds: false,
  
  // 4x4 Manual Gearbox & Off-Road Telemetry
  driveMode: 'HIGH',       // 'HIGH' (High Range Touring) | 'LOW' (Low Range Rock Crawl)
  recommendedDriveMode: 'HIGH', // Optimal gearbox mode for current terrain, incline & weather
  isWrongDrivetrain: false,   // True when current mode differs from recommendation
  isWrongGear: false,         // Prominent wrong-gear alert flag
  wrongGearTitle: '',         // Alert title (e.g. 'SHIFT TO LOW GEAR')
  wrongGearSubtitle: '',      // Reason (e.g. 'Off-Road Trail & Steep Climbing')
  wrongGearAction: '',        // Action prompt (e.g. 'Press [SPACE] or Tap Shifter')
  diffLocked: false,     // Electronic differential lockers (True in LOW)
  pitchDeg: 0.0,         // Vehicle longitudinal tilt (-90..+90 deg)
  rollDeg: 0.0,          // Vehicle lateral tilt (-90..+90 deg)
  altitudeMeters: 0.0,   // Elevation above sea level
  trailGradePct: 0.0,    // Slope incline percentage
  isOnTrail: false,      // Inside technical trail corridor
  isOnDownhillRoute: false, // On high-speed downhill sprint chute
  downhillUnlocked: false,  // Unlocked after watching summit movie cutscene
  downhillAnnounced: false, // Toast/audio triggered
  is2WDStruggling: false,// 2WD mode slipping / struggling on offroad trail
  isSnowing: false,      // Active snowfall weather in alpine zone
  currentTrailStage: '', // Active trail section milestone name
  skidPlateScraping: false,
  wheelElevations: { fl: 0, fr: 0, rl: 0, rr: 0 },
  wheelComp: { fl: 0, fr: 0, rl: 0, rr: 0 },
  axleTilt: { front: 0, rear: 0 },

  // Nitro & Engine Heat
  nitro: 100.0,
  isBoosting: false,
  engineHeat: 0.0,
  isOverheated: false,
  fuel: 100.0,

  // World & Progression
  distanceMeters: 0,
  playerX: 0,
  playerY: 0,
  playerZ: 0,
  playerHeading: 0,
  currentZoneIndex: 0,
  lap: 1,
  totalLaps: 3,
  gameTime: 0,         // seconds elapsed
  timeOfDay: 0.35,     // 0..1 (0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset)
  weather: 'clear',    // 'clear' | 'fog' | 'rain' | 'overcast'
  debugRainMode: 'auto', // 'auto' | 'on' | 'off'

  // Camera & Mode
  cameraMode: CAMERAS.CHASE,
  isCameraOrbiting: false,
  cameraOrbitYaw: 0.0,
  cameraOrbitPitch: 0.0,
  isPhotoMode: false,
  isPaused: false,
  isMuted: false,
  graphicsQuality: 'turbo120', // 'high' | 'balanced' | 'turbo120' | 'performance'
  targetFps: 120,          // 60 | 120 | 144 | 'uncapped'
  fpsMode: '120',          // '60' | '120' | '144' | 'uncapped'
  fps: 120,
  frameMs: 8.3,
  fpsAvg: 120,
  fpsMin: 120,
  fpsMax: 120,
  fpsLow1Pct: 120,
  isFpsPanelOpen: false,
  autoFpsTarget: true,
  renderStats: {
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    dpr: 1.0
  },

  // Game State & Atmosphere
  hasGameStarted: true,
  isIntroActive: true,
  introProgress: 0.0,
  introState: 'orbit',
  introSmokeOpacity: 0.0,
  dreamWhiteOpacity: 0.0,
  eyelidOpenProgress: 1.0,  // Fully open / clear
  drowsyBlurPx: 0.0,
  heartbeatRate: 1.0,
  ignitionRoarProgress: 0.0,
  fellowPlayers: [],
  desertAmbienceVolume: 1.0,
  temperatureFlashed: false,
  ambientTemp: '104°F',
  ambientTempLabel: '104°F • HOT & DRY',

  // Discovery & Score
  score: 0,
  route66ShieldsCollected: 0,
  totalRoute66Shields: 5,
  driftScore: 0,
  currentDriftChain: 0,
  driftMultiplier: 1.0,
  brakeHeat: 0.0,
  discoveredLandmarks: new Set(),
  discoveredHistoryPlaques: new Set(),
  activeHistoryPlaque: null,
  isReadingHistory: false,
  isZoneMenuOpen: false,
  isTabletOpen: false,
  activeTabletApp: 'home',
  youtubeApp: {
    isPlaying: false,
    currentVideoId: 'MV_3Dpw-BRY',
    currentTitle: 'Nightcall',
    currentArtist: 'Kavinsky',
    currentThumbnail: 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg',
    isSearchQuery: false,
    searchQuery: '',
    volume: 100,
    isMuted: false,
    isStereoWidgetVisible: true,
    history: []
  },
  nearbyHistoryPlaque: null,
  currentLookout: null, // near a scenic overlook?

  // Coin-Operated Scenic Binoculars & Panoramic Viewfinder
  isBinocularView: false,
  nearbyViewfinder: null,
  binocularFov: 24.0,
  binocularYaw: 0.0,
  binocularPitch: -0.15,
  binocularAzimuthDeg: 94,
  binocularTargetName: '',
  surveillanceLockProgress: 0.0,

  // 🕵️ GTA-Style Mystery Mission: Mojave Gully Mob Hit & Multi-Zone Investigation
  mysteryMission: {
    state: 'unstarted', // 'unstarted' | 'witnessed' | 'investigating' | 'solved'
    witnessedMurder: false,
    witnessedTime: 0,
    cluesFound: 0,
    totalClues: 9,
    clues: {
      zone0: false, // Shell Casings & Bloodstained Ledger (Mojave Z=920m)
      zone1: false, // Abandoned Getaway Sedan (Malibu Z=2,750m)
      zone2: false, // Discarded Burner Phone & Wiretap Tape (Big Sur Z=6,400m)
      zone3: false, // Smuggler Briefcase & Passports (Monterey Z=9,650m)
      zone4: false, // Frequency Scanner & Transponder (Marin Z=11,500m)
      zone5: false, // Cartel Flight Manifest (Mendocino Z=14,200m)
      zone6: false, // Contraband Drop Crates & Beacon (Cannon Beach Z=16,800m)
      zone7: false, // Encrypted Satellite Radio (Columbia Gorge Z=19,400m)
      zone8: false, // Hitman Sniper Case & Hit List (Washington Z=22,200m)
      getawayCar: false,
      burnerEvidence: false
    },
    reportedToPolice: false,
    reportingStation: '',
    scoreAwarded: 0
  },

  // 🎬 Authored Cinematic Cutscene Engine
  isCutsceneActive: false,
  cutsceneName: '', // 'murder' | 'police_turnin'
  cutscenePhase: 'IDLE',
  cutsceneTime: 0.0,
  cutsceneDuration: 6.5,
  cutsceneSubtitles: '',
  cutsceneTitleCard: '',
  
  // Police & Heat & Radar
  heatStars: 0,        // 0..4
  crimePoints: 0,
  isEvading: false,
  evasionTimer: 0,
  radarActive: false,
  radarDistance: 0,
  pursuitActive: false,
  policeDistance: 0,
  policeHealth: 100,   // 100% -> 0%
  pursuitWarning: '',
  policeAttackType: null,
  isBusted: false,
  bustedProgress: 0.0,

  // Vehicle Damage, Health & Auto Repair Service
  carIntegrity: 100.0, // 100% -> 0%
  damageStage: 0,      // 0=pristine, 1=scrapes, 2=heavy impact, 3=critical rollover
  isDamageCritical: false,
  nearestShopName: 'Mojave Desert 24HR Garage',
  nearestShopDist: 1200,
  isFlipped: false,
  isServicing: false,
  serviceProgress: 0.0,
  isMechanicCinematic: false,
  mechanicCinematicPhase: 'IDLE',
  mechanicCinematicProgress: 0.0,
  mechanicShopName: '',
  mechanicSubtitle: '',
  isTowing: false,
  towProgress: 0.0,
  towShopName: '',
  hasDeclinedTowPrompt: false,

  // Multi-Point Deformable Vehicle Damage (0.0 = pristine, 1.0 = fully crushed)
  damagePoints: {
    frontBumper: 0.0,
    frontSplitter: 0.0,
    hood: 0.0,
    fenderL: 0.0,
    fenderR: 0.0,
    doorL: 0.0,
    doorR: 0.0,
    rearHaunchL: 0.0,
    rearHaunchR: 0.0,
    rearWing: 0.0,
    rearDiffuser: 0.0,
    windshield: 0.0,
    wheelAlignmentFL: 0.0, // Camber/toe angle offset (rad)
    wheelAlignmentFR: 0.0,
    wheelAlignmentRL: 0.0,
    wheelAlignmentRR: 0.0
  },
  engineMisfireActive: false,
  steeringPullDirection: 0.0, // -1 (pulls left) .. +1 (pulls right)
  chassisVibration: 0.0,      // 0..1 amplitude
  tireRubFriction: 0.0,       // 0..1 drag factor

  reset() {
    this.speed = 0;
    this.speedMph = 0;
    this.engineRpm = 1000;
    this.gear = 1;
    this.nitro = 100.0;
    this.isBoosting = false;
    this.engineHeat = 0.0;
    this.isOverheated = false;
    this.fuel = 100.0;
    this.distanceMeters = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.playerHeading = 0;
    this.currentZoneIndex = 0;
    this.gameTime = 0;
    this.score = 0;
    this.driftScore = 0;
    this.discoveredLandmarks = new Set();
    this.discoveredHistoryPlaques = new Set();
    this.heatStars = 0;
    this.pursuitActive = false;
    this.policeDistance = 0;
    this.policeHealth = 100;
    this.pursuitWarning = '';
    this.policeAttackType = null;
    this.isBusted = false;
    this.bustedProgress = 0.0;
    this.isEvading = false;
    this.evasionTimer = 0;
    this.currentDriftChain = 0;
    this.route66ShieldsCollected = 0;
    this.driftMultiplier = 1.0;
    this.lateralSlipVelocity = 0;
    this.suspensionCompression = 0;
    this.isStuck = false;
    this.isOutOfBounds = false;
    this.brakeHeat = 0.0;
    this.isReadingHistory = false;
    this.isTabletOpen = false;
    this.activeTabletApp = 'home';
    this.youtubeApp = {
      isPlaying: false,
      currentVideoId: 'MV_3Dpw-BRY',
      currentTitle: 'Nightcall',
      currentArtist: 'Kavinsky',
      currentThumbnail: 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg',
      isSearchQuery: false,
      searchQuery: '',
      volume: 100,
      isMuted: false,
      isStereoWidgetVisible: true,
      history: []
    };
    this.activeHistoryPlaque = null;
    this.nearbyHistoryPlaque = null;
    this.isBinocularView = false;
    this.nearbyViewfinder = null;
    this.binocularFov = 24.0;
    this.binocularYaw = 0.0;
    this.binocularPitch = -0.15;
    this.binocularAzimuthDeg = 94;
    this.binocularTargetName = '';
    this.surveillanceLockProgress = 0.0;
    this.mysteryMission = {
      state: 'unstarted',
      witnessedMurder: false,
      witnessedTime: 0,
      cluesFound: 0,
      totalClues: 9,
      clues: {
        zone0: false,
        zone1: false,
        zone2: false,
        zone3: false,
        zone4: false,
        zone5: false,
        zone6: false,
        zone7: false,
        zone8: false,
        getawayCar: false,
        burnerEvidence: false
      },
      reportedToPolice: false,
      reportingStation: '',
      scoreAwarded: 0
    };
    this.isCutsceneActive = false;
    this.cutsceneName = '';
    this.cutscenePhase = 'IDLE';
    this.cutsceneTime = 0.0;
    this.cutsceneDuration = 6.5;
    this.cutsceneSubtitles = '';
    this.cutsceneTitleCard = '';
    this.isIntroActive = true;
    this.introProgress = 0.0;
    this.introState = 'orbit';
    this.introSmokeOpacity = 0.0;
    this.dreamWhiteOpacity = 0.0;
    this.eyelidOpenProgress = 1.0;
    this.drowsyBlurPx = 0.0;
    this.isCameraOrbiting = false;
    this.cameraOrbitYaw = 0.0;
    this.cameraOrbitPitch = 0.0;
    this.desertAmbienceVolume = 1.0;
    this.temperatureFlashed = false;
    this.driveMode = 'HIGH';
    this.recommendedDriveMode = 'HIGH';
    this.isWrongDrivetrain = false;
    this.isWrongGear = false;
    this.wrongGearTitle = '';
    this.wrongGearSubtitle = '';
    this.wrongGearAction = '';
    this.diffLocked = false;
    this.pitchDeg = 0.0;
    this.rollDeg = 0.0;
    this.altitudeMeters = 0.0;
    this.trailGradePct = 0.0;
    this.isOnTrail = false;
    this.isOnDownhillRoute = false;
    this.downhillUnlocked = false;
    this.downhillAnnounced = false;
    this.is2WDStruggling = false;
    this.isSnowing = false;
    this.currentTrailStage = '';
    this.skidPlateScraping = false;
    this.wheelElevations = { fl: 0, fr: 0, rl: 0, rr: 0 };
    this.wheelComp = { fl: 0, fr: 0, rl: 0, rr: 0 };
    this.axleTilt = { front: 0, rear: 0 };
  }
};
