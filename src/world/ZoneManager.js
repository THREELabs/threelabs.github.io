import { ZONES } from '../constants.js';
import { gameState } from '../state.js';

export class ZoneManager {
  constructor(renderer, terrainChunk, environment) {
    this.renderer = renderer;
    this.terrainChunk = terrainChunk;
    this.environment = environment;
    this.currentZoneIndex = 0;
    this.zones = ZONES;
  }

  update(playerPos) {
    const z = Math.max(0, playerPos.z);
    let zoneIdx = 0;

    if (z < 2600) zoneIdx = 0;        // SoCal Desert (0 - 2600m)
    else if (z < 5200) zoneIdx = 1;   // Malibu & PCH (2600 - 5200m)
    else if (z < 7800) zoneIdx = 2;   // Big Sur (5200 - 7800m)
    else if (z < 10400) zoneIdx = 3;  // Monterey Bay (7800 - 10400m)
    else if (z < 13000) zoneIdx = 4;  // NorCal / Marin (10400 - 13000m)
    else if (z < 15600) zoneIdx = 5;  // Redwood Forest (13000 - 15600m)
    else if (z < 18200) zoneIdx = 6;  // Oregon Coast (15600 - 18200m)
    else if (z < 20800) zoneIdx = 7;  // Columbia River Gorge (18200 - 20800m)
    else if (z < 23400) zoneIdx = 8;  // Washington & Olympic (20800 - 23400m)
    else if (z < 26000) zoneIdx = 9;  // Cascade Alpine Pass & Mount Rainier (23400 - 26000m)
    else if (z < 28600) zoneIdx = 10; // Idaho Panhandle & Lake Coeur d'Alene (26000 - 28600m)
    else zoneIdx = 11;                // Montana Big Sky & Glacier (28600 - 31200m)

    const currentZone = ZONES[zoneIdx] || ZONES[0];

    if (zoneIdx !== this.currentZoneIndex) {
      this.currentZoneIndex = zoneIdx;
      gameState.currentZoneIndex = zoneIdx;
      console.log('📍 Entered Zone:', currentZone.name);
      if (this.environment) {
        this.environment.updateSkyGradient(currentZone.skyTop, currentZone.skyHorizon);
        this.environment.setSkyZone(currentZone);
      }
      if (typeof window !== 'undefined' && window.game && window.game.saveManager) {
        window.game.saveManager.save(true);
      }
      if (this.onZoneChange) {
        this.onZoneChange(zoneIdx, currentZone);
      }
    }

    this.renderer.updateZoneAtmosphere(zoneIdx);
    this.terrainChunk.updateZonePalette(currentZone);
  }
}
