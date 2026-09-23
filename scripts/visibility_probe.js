#!/usr/bin/env node
/**
 * Visibility probe: are police + civilian cars actually inside the player's
 * draw window (drawDistance segments ahead)? Boots the real track, spawns
 * everything, then simulates driving a full lap while counting how often
 * police/civilians appear within the visible segment window.
 */
import './setup_env.js';
import { gameState, resetGameState } from '../js/state.js';
import { resetRoad, resetSprites, findSegment } from '../js/track.js';
import { resetPolice } from '../js/police.js';
import { resetTraffic } from '../js/traffic.js';
import { segmentLength, drawDistance } from '../js/constants.js';

resetRoad();
resetSprites();
resetGameState();
resetPolice();
resetTraffic();

const N = gameState.segments.length;
const visWindow = (playerIdx) => {
  let cops = 0, civ = 0;
  for (let n = 0; n < drawDistance; n++) {
    const seg = gameState.segments[(playerIdx + n) % N];
    for (const car of seg.cars) {
      if (car.isPolice) cops++; else civ++;
    }
  }
  return { cops, civ };
};

// Sample the visibility at many points around the whole lap
const SAMPLES = 200;
let copVisibleSamples = 0, civVisibleSamples = 0;
let totalCopsSeenMax = 0, totalCivsSeenMax = 0;
for (let s = 0; s < SAMPLES; s++) {
  const idx = Math.floor((s / SAMPLES) * N);
  const v = visWindow(idx);
  if (v.cops > 0) copVisibleSamples++;
  if (v.civ > 0) civVisibleSamples++;
  totalCopsSeenMax = Math.max(totalCopsSeenMax, v.cops);
  totalCivsSeenMax = Math.max(totalCivsSeenMax, v.civ);
}

console.log(`segments=${N} drawDistance=${drawDistance}`);
console.log(`police:   visible in ${copVisibleSamples}/${SAMPLES} samples (${(100*copVisibleSamples/SAMPLES).toFixed(0)}%) — max ${totalCopsSeenMax} on screen`);
console.log(`civilian: visible in ${civVisibleSamples}/${SAMPLES} samples (${(100*civVisibleSamples/SAMPLES).toFixed(0)}%) — max ${totalCivsSeenMax} on screen`);

// Where are the police? Distribution by zone
const zoneCount = [0,0,0,0,0,0,0,0];
for (const cop of gameState.policeList) {
  const seg = findSegment(cop.z);
  zoneCount[seg.zoneIdx || 0]++;
}
console.log('police per zone:', zoneCount.join(','), `(total ${gameState.policeList.length})`);
