import { getHistoricalLore, getHistoricalLoreForZone, TOTAL_HISTORICAL_ARCHIVES } from '../src/world/HistoricalLore.js';
import { SCENIC_PARKING_LOTS } from '../src/world/SplineRoad.js';
import { gameState } from '../src/state.js';

let passed = 0;
let failed = 0;

function assert(name, cond, details = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${name} ${details}`);
  }
}

console.log('🏛️ Testing Historical Landmarks & Heritage Lore Database:');

// 1. Lore count test
assert('Total historical archives count is at least 45', TOTAL_HISTORICAL_ARCHIVES >= 45, `got ${TOTAL_HISTORICAL_ARCHIVES}`);

// 2. Scenic parking lot matching test
let matchedLots = 0;
let missingLots = [];
SCENIC_PARKING_LOTS.forEach(lot => {
  const lore = getHistoricalLore(lot.id);
  if (lore) {
    matchedLots++;
  } else {
    missingLots.push(lot.id);
  }
});
assert(`All ${SCENIC_PARKING_LOTS.length} scenic parking lots have rich historical lore entries`, matchedLots === SCENIC_PARKING_LOTS.length, `missing: ${missingLots.join(', ')}`);

// 3. Zone coverage test (All 9 zones 0-8)
for (let zone = 0; zone <= 8; zone++) {
  const zoneLores = getHistoricalLoreForZone(zone);
  assert(`Zone ${zone} has multiple historical archives`, zoneLores.length >= 3, `got ${zoneLores.length}`);
}

// 4. Content richness verification
SCENIC_PARKING_LOTS.slice(0, 10).forEach(lot => {
  const lore = getHistoricalLore(lot.id);
  assert(`Plaque ${lot.id} has valid name & sub`, !!lore.name && !!lore.sub);
  assert(`Plaque ${lot.id} has authentic yearEst & coords`, !!lore.yearEst && !!lore.coords);
  assert(`Plaque ${lot.id} has detailed historyText (>150 chars)`, lore.historyText && lore.historyText.length > 150, `len=${lore.historyText?.length}`);
  assert(`Plaque ${lot.id} has fastFact & sceneryHighlight`, !!lore.fastFact && !!lore.sceneryHighlight);
});

// 5. Game State integration test
console.log('\n🎮 Testing Game State & Discovery Tracking:');
gameState.reset();
assert('gameState has discoveredHistoryPlaques Set', gameState.discoveredHistoryPlaques instanceof Set);
assert('gameState has activeHistoryPlaque null initially', gameState.activeHistoryPlaque === null);
assert('gameState isReadingHistory is false initially', gameState.isReadingHistory === false);
assert('gameState nearbyHistoryPlaque is null initially', gameState.nearbyHistoryPlaque === null);

// Simulate discovery
gameState.discoveredHistoryPlaques.add('turnout_bottle_tree');
assert('Plaque discovery recorded in Set', gameState.discoveredHistoryPlaques.has('turnout_bottle_tree'));

console.log(`\n🏁 Summary: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
