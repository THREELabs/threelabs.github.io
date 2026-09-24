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

    for (let i = 0; i < this.zones.length; i++) {
      const zone = this.zones[i];
      if (zone.zMin !== undefined && zone.zMax !== undefined) {
        if (z >= zone.zMin && (i === this.zones.length - 1 || z < zone.zMax)) {
          zoneIdx = i;
          break;
        }
      }
    }

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
