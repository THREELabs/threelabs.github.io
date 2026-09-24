/**
 * 💾 Dreamstate Highway / Baja Racer 3D — Persistent Save Manager
 *
 * Provides database-free client-side state persistence using browser localStorage.
 * Handles serialization of progression, historical archives, mystery investigation clues,
 * vehicle health, and player settings. Safe for headless/Node.js testing with in-memory fallback.
 */

export const CURRENT_SAVE_VERSION = 1;
export const GAME_VERSION = '1.2.0';
export const PRIMARY_STORAGE_KEY = 'baja_racer_save_v1';
export const BACKUP_STORAGE_KEY = 'baja_racer_save_backup';
export const KNOWN_STORAGE_KEYS = [
  'baja_racer_save_v1',
  'baja_racer_save_v2',
  'baja_racer_save',
  'dreamstate_highway_save_v1',
  'baja_racer_save_v0'
];
export const ROAD_MAX_Z = 62000;
const MIN_SAVE_INTERVAL_MS = 2000; // Throttle frequent saves to protect 60/120 FPS performance

/**
 * Pure numeric clamp helper
 */
function clamp(val, min, max) {
  if (typeof val !== 'number' || Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Safe deep clone helper for plain objects and arrays
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  const copy = {};
  for (const key of Object.keys(obj)) {
    copy[key] = deepClone(obj[key]);
  }
  return copy;
}

/**
 * Baseline canonical save schema template
 */
const DEFAULT_SAVE_DATA = {
  version: CURRENT_SAVE_VERSION,
  gameVersion: GAME_VERSION,
  savedAt: 0,
  savedAtIso: '',

  // World & Progression
  currentZoneIndex: 0,
  distanceMeters: 0,
  playerX: 0,
  playerY: 0,
  playerZ: 0,
  playerHeading: 0,
  score: 0,
  route66ShieldsCollected: 0,
  totalRoute66Shields: 5,
  driftScore: 0,
  lap: 1,

  // Archives & Collections
  discoveredLandmarks: [],
  discoveredHistoryPlaques: [],

  // GTA-Style Investigation Clues
  mysteryMission: {
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
  },

  // Vehicle Condition & Telemetry
  carIntegrity: 100,
  damageStage: 0,
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
    wheelAlignmentFL: 0.0,
    wheelAlignmentFR: 0.0,
    wheelAlignmentRL: 0.0,
    wheelAlignmentRR: 0.0
  },
  fuel: 100,
  nitro: 100,
  driveMode: 'HIGH',
  paintIndex: 0,
  paintColor: 0x908538,

  // Police Heat
  heatStars: 0,
  crimePoints: 0,

  // Environment & Atmosphere
  timeOfDay: 0.35,
  weather: 'clear',

  // User Settings & Controls
  cameraMode: 'CHASE',
  graphicsQuality: 'turbo120',
  targetFps: 120,
  fpsMode: '120',
  isMuted: false
};

/**
 * Sequential Schema Migration Pipeline
 */
const MIGRATIONS = {
  // Legacy/unversioned (v0) -> Version 1
  0: (data) => {
    return {
      ...data,
      version: 1,
      gameVersion: data.gameVersion || '1.0.0'
    };
  }
};

export class SaveManager {
  constructor(gameState, physics = null) {
    this.gameState = gameState;
    this.physics = physics;
    this.storageKey = PRIMARY_STORAGE_KEY;
    this.backupKey = BACKUP_STORAGE_KEY;
    this.lastSaveTime = 0;
    this.onSaveListeners = [];
    this.onLoadListeners = [];

    // In-memory fallback if localStorage is unavailable (e.g. Node tests, strict iframe sandbox)
    this._memoryStorage = new Map();

    this._setupWindowListeners();
  }

  setPhysics(physics) {
    this.physics = physics;
  }

  onSave(callback) {
    if (typeof callback === 'function') this.onSaveListeners.push(callback);
  }

  onLoad(callback) {
    if (typeof callback === 'function') this.onLoadListeners.push(callback);
  }

  _notifySave(data) {
    this.onSaveListeners.forEach(cb => {
      try { cb(data); } catch (e) { console.warn('Save listener error:', e); }
    });
  }

  _notifyLoad(data) {
    this.onLoadListeners.forEach(cb => {
      try { cb(data); } catch (e) { console.warn('Load listener error:', e); }
    });
  }

  /**
   * Check if localStorage is supported and accessible
   */
  isStorageAvailable() {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const testKey = '__baja_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  _getStorageItem(key) {
    if (this.isStorageAvailable()) {
      return window.localStorage.getItem(key);
    }
    return this._memoryStorage.get(key) || null;
  }

  _setStorageItem(key, value) {
    if (this.isStorageAvailable()) {
      window.localStorage.setItem(key, value);
    } else {
      this._memoryStorage.set(key, value);
    }
  }

  _removeStorageItem(key) {
    if (this.isStorageAvailable()) {
      window.localStorage.removeItem(key);
    } else {
      this._memoryStorage.delete(key);
    }
  }

  /**
   * Scan storage across primary key, rolling backup, known legacy keys,
   * and dynamic patterns to locate the most recent valid save data.
   * @returns {{ raw: string, sourceKey: string } | null}
   */
  _findRawSaveData() {
    // 1. Try primary storage key
    const primaryRaw = this._getStorageItem(this.storageKey);
    if (primaryRaw) {
      return { raw: primaryRaw, sourceKey: this.storageKey };
    }

    // 2. Try backup key if primary is empty
    const backupRaw = this._getStorageItem(this.backupKey);
    if (backupRaw) {
      return { raw: backupRaw, sourceKey: this.backupKey };
    }

    // 3. Try known legacy keys
    for (const legacyKey of KNOWN_STORAGE_KEYS) {
      if (legacyKey === this.storageKey) continue;
      const legRaw = this._getStorageItem(legacyKey);
      if (legRaw) {
        return { raw: legRaw, sourceKey: legacyKey };
      }
    }

    // 4. Dynamic key search in localStorage
    if (this.isStorageAvailable()) {
      try {
        const storage = window.localStorage;
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k && (k.startsWith('baja_racer_save') || k.startsWith('dreamstate_save'))) {
            const rawVal = storage.getItem(k);
            if (rawVal) {
              return { raw: rawVal, sourceKey: k };
            }
          }
        }
      } catch {
        // Continue silently
      }
    }

    return null;
  }

  /**
   * Check if a valid save exists in primary storage, backup, or legacy keys
   */
  hasSave() {
    try {
      const found = this._findRawSaveData();
      if (!found || !found.raw) return false;
      const data = JSON.parse(found.raw);
      if (!data) return false;
      return Boolean(
        data &&
        (typeof data.version !== 'undefined' || typeof data.playerZ !== 'undefined') &&
        (Number(data.distanceMeters) > 0 || Number(data.score) > 0 || Number(data.playerZ) > 10 ||
         (Array.isArray(data.discoveredLandmarks) && data.discoveredLandmarks.length > 0) ||
         (Array.isArray(data.discoveredHistoryPlaques) && data.discoveredHistoryPlaques.length > 0))
      );
    } catch {
      return false;
    }
  }

  /**
   * Migrate raw loaded data through sequential schema upgrades
   * @param {Object} rawData
   * @returns {Object} Migrated data object
   */
  migrate(rawData) {
    if (!rawData || typeof rawData !== 'object') {
      return deepClone(DEFAULT_SAVE_DATA);
    }

    let data = { ...rawData };
    // Determine version; unversioned legacy saves start at version 0
    let v = typeof data.version === 'number' ? data.version : (data.version ? parseInt(data.version, 10) : 0);
    if (Number.isNaN(v)) v = 0;

    // Sequentially apply migrations up to CURRENT_SAVE_VERSION
    while (v < CURRENT_SAVE_VERSION) {
      const migrator = MIGRATIONS[v];
      if (typeof migrator === 'function') {
        try {
          data = migrator(data);
          v = typeof data.version === 'number' ? data.version : v + 1;
        } catch (mErr) {
          console.warn(`SaveManager: Migration from version ${v} threw error:`, mErr);
          v++;
          data.version = v;
        }
      } else {
        v++;
        data.version = v;
      }
    }

    return data;
  }

  /**
   * Deeply normalize and sanitize save data against the default schema,
   * guaranteeing no undefined values, invalid coordinates, or corrupted numbers.
   * @param {Object} inputData
   * @returns {Object} Cleaned, bounded, normalized save data
   */
  normalizeAndValidate(inputData) {
    const defaults = deepClone(DEFAULT_SAVE_DATA);
    const result = { ...defaults, ...(inputData || {}) };

    // Metadata
    result.version = CURRENT_SAVE_VERSION;
    result.gameVersion = inputData?.gameVersion || GAME_VERSION;
    result.savedAt = inputData?.savedAt || Date.now();
    result.savedAtIso = inputData?.savedAtIso || new Date().toISOString();

    // World & Progression sanitization
    result.playerX = (typeof result.playerX === 'number' && !Number.isNaN(result.playerX))
      ? Math.round(result.playerX * 100) / 100
      : (typeof inputData?.playerX === 'number' && !Number.isNaN(inputData.playerX) ? Math.round(inputData.playerX * 100) / 100 : null);
    result.playerY = (typeof result.playerY === 'number' && !Number.isNaN(result.playerY))
      ? Math.round(result.playerY * 100) / 100
      : (typeof inputData?.playerY === 'number' && !Number.isNaN(inputData.playerY) ? Math.round(inputData.playerY * 100) / 100 : null);
    result.playerZ = clamp(Number(result.playerZ), 0, ROAD_MAX_Z);
    result.playerHeading = (typeof result.playerHeading === 'number' && !Number.isNaN(result.playerHeading))
      ? Math.round(result.playerHeading * 1000) / 1000
      : (typeof inputData?.playerHeading === 'number' && !Number.isNaN(inputData.playerHeading) ? Math.round(inputData.playerHeading * 1000) / 1000 : null);
    result.distanceMeters = Math.max(0, Math.round(Number(result.distanceMeters) || 0));
    result.score = Math.max(0, Math.round(Number(result.score) || 0));
    result.driftScore = Math.max(0, Math.round(Number(result.driftScore) || 0));
    result.lap = Math.max(1, Math.round(Number(result.lap) || 1));
    result.route66ShieldsCollected = clamp(Number(result.route66ShieldsCollected), 0, 50);
    result.totalRoute66Shields = clamp(Number(result.totalRoute66Shields) || 5, 1, 50);

    // Calculate/validate zone index based on coordinates
    if (typeof result.currentZoneIndex !== 'number' || result.currentZoneIndex < 0 || result.currentZoneIndex > 8) {
      const z = result.playerZ;
      if (z < 2600) result.currentZoneIndex = 0;
      else if (z < 5200) result.currentZoneIndex = 1;
      else if (z < 7800) result.currentZoneIndex = 2;
      else if (z < 10400) result.currentZoneIndex = 3;
      else if (z < 13000) result.currentZoneIndex = 4;
      else if (z < 15600) result.currentZoneIndex = 5;
      else if (z < 18200) result.currentZoneIndex = 6;
      else if (z < 20800) result.currentZoneIndex = 7;
      else result.currentZoneIndex = 8;
    }

    // Archives & Collections
    result.discoveredLandmarks = Array.isArray(result.discoveredLandmarks)
      ? result.discoveredLandmarks.filter(id => typeof id === 'string')
      : [];
    result.discoveredHistoryPlaques = Array.isArray(result.discoveredHistoryPlaques)
      ? result.discoveredHistoryPlaques.filter(id => typeof id === 'string')
      : [];

    // Mystery Mission Clues Deep Merge
    result.mysteryMission = {
      ...defaults.mysteryMission,
      ...(inputData?.mysteryMission || {})
    };
    result.mysteryMission.clues = {
      ...defaults.mysteryMission.clues,
      ...(inputData?.mysteryMission?.clues || {})
    };
    result.mysteryMission.cluesFound = clamp(Number(result.mysteryMission.cluesFound), 0, 20);
    result.mysteryMission.totalClues = clamp(Number(result.mysteryMission.totalClues) || 9, 1, 20);

    // Vehicle Condition & Telemetry
    result.carIntegrity = clamp(Number(result.carIntegrity !== undefined ? result.carIntegrity : 100), 0, 100);
    result.carIntegrity = Math.round(result.carIntegrity * 10) / 10;
    result.damageStage = clamp(Number(result.damageStage), 0, 3);
    result.fuel = clamp(Number(result.fuel !== undefined ? result.fuel : 100), 0, 100);
    result.fuel = Math.round(result.fuel * 10) / 10;
    result.nitro = clamp(Number(result.nitro !== undefined ? result.nitro : 100), 0, 100);
    result.nitro = Math.round(result.nitro * 10) / 10;
    result.driveMode = (result.driveMode === 'LOW' || result.driveMode === 'MID') ? result.driveMode : 'HIGH';

    // Vehicle Livery & Paint
    result.paintIndex = Math.max(0, Math.round(Number(result.paintIndex) || 0));
    if (typeof result.paintColor !== 'number' || Number.isNaN(result.paintColor)) {
      result.paintColor = defaults.paintColor;
    }

    // Damage Points Deep Normalization
    result.damagePoints = {
      ...defaults.damagePoints,
      ...(inputData?.damagePoints || {})
    };
    for (const key of Object.keys(result.damagePoints)) {
      result.damagePoints[key] = clamp(Number(result.damagePoints[key]), 0, 1);
    }

    // Police Heat
    result.heatStars = clamp(Number(result.heatStars), 0, 4);
    result.crimePoints = Math.max(0, Math.round(Number(result.crimePoints) || 0));

    // Atmosphere
    result.timeOfDay = clamp(Number(result.timeOfDay !== undefined ? result.timeOfDay : 0.35), 0, 1);
    result.weather = typeof result.weather === 'string' ? result.weather : 'clear';

    // Settings
    result.cameraMode = typeof result.cameraMode === 'string' ? result.cameraMode : 'CHASE';
    result.graphicsQuality = typeof result.graphicsQuality === 'string' ? result.graphicsQuality : 'turbo120';
    result.isMuted = !!result.isMuted;

    return result;
  }

  /**
   * Serialize active in-memory game state into a portable JSON-safe plain object
   */
  serialize() {
    const gs = this.gameState || {};
    const playerX = (this.physics && this.physics.position && typeof this.physics.position.x === 'number')
      ? this.physics.position.x
      : (gs.playerX || 0);
    const playerY = (this.physics && this.physics.position && typeof this.physics.position.y === 'number')
      ? this.physics.position.y
      : (gs.playerY || 0);
    const playerZ = (this.physics && this.physics.position && typeof this.physics.position.z === 'number')
      ? this.physics.position.z
      : (gs.playerZ || 0);
    const playerHeading = (this.physics && typeof this.physics.heading === 'number')
      ? this.physics.heading
      : (gs.playerHeading || 0);

    // Vehicle livery & paint color resolution
    let currentPaintIndex = 0;
    let currentPaintColor = 0x908538;
    const vehicle = this.physics?.vehicle || (typeof window !== 'undefined' && window.game?.sportsCar);
    if (vehicle) {
      if (typeof vehicle.currentPaletteIndex === 'number') {
        currentPaintIndex = vehicle.currentPaletteIndex;
      }
      if (Array.isArray(vehicle.paintPalette) && vehicle.paintPalette[currentPaintIndex]) {
        currentPaintColor = vehicle.paintPalette[currentPaintIndex].color;
      }
    }

    const rawData = {
      version: CURRENT_SAVE_VERSION,
      gameVersion: GAME_VERSION,
      savedAt: Date.now(),
      savedAtIso: new Date().toISOString(),

      // World & Progression
      currentZoneIndex: gs.currentZoneIndex || 0,
      distanceMeters: Math.round(gs.distanceMeters || 0),
      playerX: Math.round(playerX * 100) / 100,
      playerY: Math.round(playerY * 100) / 100,
      playerZ: Math.round(playerZ * 100) / 100,
      playerHeading: Math.round(playerHeading * 1000) / 1000,
      score: Math.round(gs.score || 0),
      route66ShieldsCollected: gs.route66ShieldsCollected || 0,
      totalRoute66Shields: gs.totalRoute66Shields || 5,
      driftScore: Math.round(gs.driftScore || 0),
      lap: gs.lap || 1,

      // Archives & Collections (Convert Set to Array for JSON)
      discoveredLandmarks: gs.discoveredLandmarks ? Array.from(gs.discoveredLandmarks) : [],
      discoveredHistoryPlaques: gs.discoveredHistoryPlaques ? Array.from(gs.discoveredHistoryPlaques) : [],

      // GTA-Style Investigation Clues
      mysteryMission: gs.mysteryMission ? {
        state: gs.mysteryMission.state || 'unstarted',
        witnessedMurder: !!gs.mysteryMission.witnessedMurder,
        witnessedTime: gs.mysteryMission.witnessedTime || 0,
        cluesFound: gs.mysteryMission.cluesFound || 0,
        totalClues: gs.mysteryMission.totalClues || 9,
        clues: gs.mysteryMission.clues ? { ...gs.mysteryMission.clues } : {},
        reportedToPolice: !!gs.mysteryMission.reportedToPolice,
        reportingStation: gs.mysteryMission.reportingStation || '',
        scoreAwarded: gs.mysteryMission.scoreAwarded || 0
      } : null,

      // Vehicle Condition & Telemetry
      carIntegrity: Math.round((gs.carIntegrity !== undefined ? gs.carIntegrity : 100) * 10) / 10,
      damageStage: gs.damageStage || 0,
      damagePoints: gs.damagePoints ? { ...gs.damagePoints } : {},
      fuel: Math.round((gs.fuel !== undefined ? gs.fuel : 100) * 10) / 10,
      nitro: Math.round((gs.nitro !== undefined ? gs.nitro : 100) * 10) / 10,
      driveMode: gs.driveMode || 'HIGH',
      paintIndex: currentPaintIndex,
      paintColor: currentPaintColor,

      // Police Heat
      heatStars: gs.heatStars || 0,
      crimePoints: Math.round(gs.crimePoints || 0),

      // Environment & Atmosphere
      timeOfDay: gs.timeOfDay !== undefined ? gs.timeOfDay : 0.35,
      weather: gs.weather || 'clear',

      // User Settings & Controls
      cameraMode: gs.cameraMode || 'CHASE',
      graphicsQuality: gs.graphicsQuality || 'turbo120',
      targetFps: gs.targetFps || 120,
      fpsMode: gs.fpsMode || '120',
      isMuted: !!gs.isMuted
    };

    return this.normalizeAndValidate(rawData);
  }

  /**
   * Save game state to localStorage with anti-corruption rolling backup
   * @param {boolean} force - Skip throttle interval (e.g. for manual save or tab unload)
   */
  save(force = false) {
    const now = Date.now();
    if (!force && (now - this.lastSaveTime < MIN_SAVE_INTERVAL_MS)) {
      return false; // Throttled
    }

    try {
      const data = this.serialize();
      const jsonString = JSON.stringify(data);

      // Rolling anti-corruption backup: preserve prior valid save
      const existingRaw = this._getStorageItem(this.storageKey);
      if (existingRaw && existingRaw.length > 20) {
        this._setStorageItem(this.backupKey, existingRaw);
      }

      // Write active save
      this._setStorageItem(this.storageKey, jsonString);
      this.lastSaveTime = now;
      this._notifySave(data);
      return true;
    } catch (err) {
      console.warn('SaveManager: Failed to write save to localStorage:', err);
      return false;
    }
  }

  /**
   * Load and hydrate game state from localStorage.
   * Seamlessly resolves from primary key, rolling backup, or legacy keys,
   * executing migrations and safe normalization.
   * @returns {Object|null} The hydrated save object, or null if not found
   */
  load() {
    try {
      const found = this._findRawSaveData();
      if (!found || !found.raw) return null;

      let parsed = null;
      try {
        parsed = JSON.parse(found.raw);
      } catch (jsonErr) {
        console.warn(`SaveManager: Corrupted JSON in ${found.sourceKey}, attempting backup recovery:`, jsonErr);
        const backupRaw = this._getStorageItem(this.backupKey);
        if (backupRaw && backupRaw !== found.raw) {
          try {
            parsed = JSON.parse(backupRaw);
            console.log('🛡️ SaveManager: Successfully recovered game save from anti-corruption backup!');
          } catch (bkErr) {
            console.error('SaveManager: Both primary and backup saves were unreadable:', bkErr);
            return null;
          }
        } else {
          return null;
        }
      }

      if (!parsed || typeof parsed !== 'object') return null;

      // Run sequential migration pipeline
      const migrated = this.migrate(parsed);

      // Run deep schema normalization
      const normalized = this.normalizeAndValidate(migrated);

      // Hydrate in-memory gameState
      this.deserialize(normalized);

      // If loaded from legacy key or backup, persist immediately to primary key
      if (found.sourceKey !== this.storageKey) {
        console.log(`💾 SaveManager: Migrated legacy save from [${found.sourceKey}] to [${this.storageKey}]`);
        this._setStorageItem(this.storageKey, JSON.stringify(normalized));
      }

      this._notifyLoad(normalized);
      return normalized;
    } catch (err) {
      console.warn('SaveManager: Failed to read save from localStorage:', err);
      return null;
    }
  }

  /**
   * Hydrate in-memory gameState from a validated save data object
   */
  deserialize(data) {
    if (!data || !this.gameState) return;
    const gs = this.gameState;

    if (typeof data.currentZoneIndex === 'number') gs.currentZoneIndex = data.currentZoneIndex;
    if (typeof data.distanceMeters === 'number') gs.distanceMeters = data.distanceMeters;
    if (typeof data.playerX === 'number') gs.playerX = data.playerX;
    if (typeof data.playerY === 'number') gs.playerY = data.playerY;
    if (typeof data.playerZ === 'number') gs.playerZ = data.playerZ;
    if (typeof data.playerHeading === 'number') gs.playerHeading = data.playerHeading;
    if (typeof data.score === 'number') gs.score = data.score;
    if (typeof data.route66ShieldsCollected === 'number') gs.route66ShieldsCollected = data.route66ShieldsCollected;
    if (typeof data.totalRoute66Shields === 'number') gs.totalRoute66Shields = data.totalRoute66Shields;
    if (typeof data.driftScore === 'number') gs.driftScore = data.driftScore;
    if (typeof data.lap === 'number') gs.lap = data.lap;

    // Rehydrate Sets safely
    if (Array.isArray(data.discoveredLandmarks)) {
      gs.discoveredLandmarks = new Set(data.discoveredLandmarks);
    }
    if (Array.isArray(data.discoveredHistoryPlaques)) {
      gs.discoveredHistoryPlaques = new Set(data.discoveredHistoryPlaques);
    }

    // GTA-Style Investigation Clues
    if (data.mysteryMission && gs.mysteryMission) {
      gs.mysteryMission.state = data.mysteryMission.state || gs.mysteryMission.state;
      gs.mysteryMission.witnessedMurder = !!data.mysteryMission.witnessedMurder;
      gs.mysteryMission.witnessedTime = data.mysteryMission.witnessedTime || 0;
      gs.mysteryMission.cluesFound = data.mysteryMission.cluesFound || 0;
      gs.mysteryMission.totalClues = data.mysteryMission.totalClues || 9;
      if (data.mysteryMission.clues && gs.mysteryMission.clues) {
        Object.assign(gs.mysteryMission.clues, data.mysteryMission.clues);
      }
      gs.mysteryMission.reportedToPolice = !!data.mysteryMission.reportedToPolice;
      gs.mysteryMission.reportingStation = data.mysteryMission.reportingStation || '';
      gs.mysteryMission.scoreAwarded = data.mysteryMission.scoreAwarded || 0;
    }

    // Vehicle Condition
    if (typeof data.carIntegrity === 'number') gs.carIntegrity = data.carIntegrity;
    if (typeof data.damageStage === 'number') gs.damageStage = data.damageStage;
    if (data.damagePoints && gs.damagePoints) {
      Object.assign(gs.damagePoints, data.damagePoints);
    }
    if (typeof data.fuel === 'number') gs.fuel = data.fuel;
    if (typeof data.nitro === 'number') gs.nitro = data.nitro;
    if (data.driveMode) gs.driveMode = data.driveMode;

    // Police Heat
    if (typeof data.heatStars === 'number') gs.heatStars = data.heatStars;
    if (typeof data.crimePoints === 'number') gs.crimePoints = data.crimePoints;

    // Environment
    if (typeof data.timeOfDay === 'number') gs.timeOfDay = data.timeOfDay;
    if (data.weather) gs.weather = data.weather;

    // Settings
    if (data.cameraMode) gs.cameraMode = data.cameraMode;
    if (data.graphicsQuality) gs.graphicsQuality = data.graphicsQuality;
    if (data.targetFps) gs.targetFps = data.targetFps;
    if (data.fpsMode) gs.fpsMode = data.fpsMode;
    if (typeof data.isMuted === 'boolean') gs.isMuted = data.isMuted;
  }

  /**
   * Clear saved progress from primary storage, backup, and legacy keys
   */
  clear() {
    try {
      this._removeStorageItem(this.storageKey);
      this._removeStorageItem(this.backupKey);
      for (const legKey of KNOWN_STORAGE_KEYS) {
        this._removeStorageItem(legKey);
      }
      this.lastSaveTime = 0;
      return true;
    } catch (err) {
      console.warn('SaveManager: Failed to clear save:', err);
      return false;
    }
  }

  /**
   * Export the save data as a downloadable JSON file
   */
  exportJson() {
    const data = this.serialize();
    const jsonStr = JSON.stringify(data, null, 2);
    if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `baja_racer_save_${Math.round(data.playerZ)}m.json`;
        if (typeof a.click === 'function') {
          if (document.body && typeof document.body.appendChild === 'function') {
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            a.click();
          }
        }
        if (typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(url);
        }
      } catch {
        // Headless/test mock environment resilience
      }
    }
    return jsonStr;
  }

  /**
   * Import save data from a JSON string across ANY past, present, or future version
   */
  importJson(jsonString) {
    try {
      const raw = JSON.parse(jsonString);
      if (!raw || typeof raw !== 'object') {
        throw new Error('Invalid save file format');
      }
      // Migrate and normalize imported data
      const migrated = this.migrate(raw);
      const normalized = this.normalizeAndValidate(migrated);

      this.deserialize(normalized);
      this._setStorageItem(this.storageKey, JSON.stringify(normalized));
      this._notifySave(normalized);
      return { success: true, data: normalized };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Attach automatic background window event handlers
   */
  _setupWindowListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Auto-save when user leaves tab or minimizes window
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.save(true);
      }
    });

    // Auto-save right before window/tab is closed or unloaded (desktop & mobile Safari)
    window.addEventListener('beforeunload', () => {
      this.save(true);
    });
    window.addEventListener('pagehide', () => {
      this.save(true);
    });
  }
}
