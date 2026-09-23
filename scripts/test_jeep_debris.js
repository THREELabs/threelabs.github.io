import './setup_env.js';
import * as THREE from 'three';
import { VehicleDebrisManager } from '../src/world/VehicleDebrisManager.js';
import { SafariJeep } from '../src/vehicles/SafariJeep.js';
import { gameState } from '../src/state.js';

console.log('🧪 Testing Safari Jeep Debris & Paint Synchronization...');

// 1. Setup mock renderer with createToonMaterial
const mockRenderer = {
  createToonMaterial: ({ color, gradientBands }) => {
    return new THREE.MeshBasicMaterial({ color });
  }
};

const mockScene = new THREE.Group();
const mockSplineRoad = {
  getRoadTransformAtZ: () => ({ pos: { y: 0 }, heading: 0 })
};

const debrisManager = new VehicleDebrisManager(mockScene, mockSplineRoad, mockRenderer);

// Test initial paint color
console.log('Test 1: Default Paint Color');
const initialHex = debrisManager.matPaint.color.getHex();
console.log(`Initial debris matPaint hex: 0x${initialHex.toString(16)}`);
if (initialHex === 0xf43f85) {
  throw new Error('Debris matPaint is still hardcoded pink (0xf43f85)!');
}
if (initialHex !== 0xc2a679) {
  throw new Error(`Expected Sahara Sand (0xc2a679), got 0x${initialHex.toString(16)}`);
}
console.log('✅ PASS: Debris matPaint defaults to Sahara Sand (0xc2a679)');

// Test setPaintColor
console.log('\nTest 2: Dynamic Paint Synchronization');
debrisManager.setPaintColor(0x4a5840); // Olive Drab Safari
if (debrisManager.matPaint.color.getHex() !== 0x4a5840) {
  throw new Error('setPaintColor failed to update matPaint');
}
if (debrisManager.matBeadlockRing.color.getHex() !== 0x4a5840) {
  throw new Error('setPaintColor failed to update matBeadlockRing');
}
console.log('✅ PASS: setPaintColor dynamically updates debris paint and beadlock ring');

// Test debris mesh creation for all parts
console.log('\nTest 3: Jeep Component Debris Generation');
const partTypes = [
  'doorL', 'doorR', 'hood', 'rearWing', 'rearCarrier',
  'frontBumper', 'mirrorL', 'mirrorR', 'tireShred',
  'jerryCanRed', 'jerryCanOlive', 'tractionBoard', 'shovel', 'snorkel'
];

for (const part of partTypes) {
  const meshGroup = debrisManager.createDebrisMesh(part);
  if (!meshGroup || meshGroup.children.length === 0) {
    throw new Error(`Failed to generate debris mesh for [${part}]: no children`);
  }

  // Traverse all meshes in debris piece to ensure NONE use pink (0xf43f85)
  meshGroup.traverse(child => {
    if (child.isMesh && child.material && child.material.color) {
      if (child.material.color.getHex() === 0xf43f85) {
        throw new Error(`Part [${part}] contains child with old pink color (0xf43f85)!`);
      }
    }
  });

  console.log(`  ✅ [PASS] Created authentic Jeep component [${part}] with ${meshGroup.children.length} sub-elements`);
}

// Test SafariJeep integration
console.log('\nTest 4: SafariJeep Damage, Detach, and Repair Lifecycle');
const jeep = new SafariJeep(mockRenderer);
window.game = {
  sportsCar: jeep,
  debrisManager,
  physics: { velocity: new THREE.Vector3(0, 0, 20), carIntegrity: 100 }
};

// Detach parts
jeep.detachPart('doorL');
jeep.detachPart('hood');
jeep.detachPart('rearWing');
jeep.detachPart('jerryCanRed');
jeep.detachPart('tractionBoard');

if (jeep.partStates.doorL !== 'detached' || jeep.doorLGroup.visible !== false) {
  throw new Error('doorL failed to detach');
}
if (jeep.partStates.hood !== 'detached' || jeep.hoodGroup.visible !== false) {
  throw new Error('hood failed to detach');
}
if (jeep.partStates.rearWing !== 'detached' || jeep.rearCarrierGroup.visible !== false) {
  throw new Error('rearWing failed to detach');
}
if (jeep.fuelCanGroup.visible !== false) {
  throw new Error('fuelCanGroup failed to hide on detach');
}
if (jeep.tractionBoardsGroup.visible !== false) {
  throw new Error('tractionBoardsGroup failed to hide on detach');
}
console.log('✅ PASS: All parts detach, hide from chassis, and spawn debris');

// Repair vehicle
jeep.repairVehicle();
if (jeep.partStates.doorL !== 'attached' || jeep.doorLGroup.visible !== true) {
  throw new Error('doorL failed to restore on repair');
}
if (jeep.partStates.hood !== 'attached' || jeep.hoodGroup.visible !== true) {
  throw new Error('hood failed to restore on repair');
}
if (jeep.partStates.rearWing !== 'attached' || jeep.rearCarrierGroup.visible !== true) {
  throw new Error('rearWing failed to restore on repair');
}
if (jeep.fuelCanGroup.visible !== true) {
  throw new Error('fuelCanGroup failed to restore on repair');
}
if (jeep.tractionBoardsGroup.visible !== true) {
  throw new Error('tractionBoardsGroup failed to restore on repair');
}
console.log('✅ PASS: repairVehicle successfully restores all detached components and cargo');

// Test Jeep setPaintColor propagation to debrisManager
console.log('\nTest 5: Jeep Paint Studio Propagation');
jeep.setPaintColor(0xe5a93b, 'Golden Eagle Mustard');
if (jeep.matPaint.color.getHex() !== 0xe5a93b) {
  throw new Error('Jeep matPaint failed to update');
}
if (debrisManager.matPaint.color.getHex() !== 0xe5a93b) {
  throw new Error('Debris matPaint failed to sync with Jeep paint change');
}
console.log('✅ PASS: Changing Jeep color automatically updates debris paint material');

console.log('\n====================================================');
console.log('🎉 ALL JEEP CRASH DEBRIS TESTS PASSED WITH 0 ERRORS!');
console.log('====================================================\n');
