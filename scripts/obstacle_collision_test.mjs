// Mock global browser DOM
globalThis.window = { game: null };
globalThis.performance = performance;
globalThis.document = {
  createElement: () => ({
    width: 256,
    height: 256,
    getContext: () => ({
      fillStyle: '',
      fillRect: () => {},
      strokeStyle: '',
      strokeRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {},
      roundRect: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      setLineDash: () => {},
      measureText: () => ({ width: 100 })
    })
  })
};

const THREE = await import('three');
const { SplineRoad } = await import('../src/world/SplineRoad.js');
const { ObstacleSystem } = await import('../src/engine/ObstacleSystem.js');
const { VehiclePhysics } = await import('../src/engine/Physics.js');
const { gameState } = await import('../src/state.js');

console.log('🧪 Running Obstacle Collision & Auto Shop Servicing Tests...');

let passed = 0;
let failed = 0;
function assert(cond, desc) {
  if (cond) {
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    failed++;
  }
}

// 1. Mock minimal renderer for SplineRoad
const mockTexture = {
  repeat: { set: () => {} },
  wrapS: 0,
  wrapT: 0
};
const mockRenderer = {
  createToonMaterial: () => new THREE.MeshBasicMaterial(),
  textures: {
    asphalt: () => mockTexture,
    asphaltNormal: () => mockTexture
  },
  toonGradients: {
    twoTone: null,
    threeTone: null,
    fiveTone: null
  }
};

const splineRoad = new SplineRoad(mockRenderer);
const obstacleSystem = new ObstacleSystem(splineRoad);

assert(obstacleSystem.autoShops.length === 9, 'All 9 Auto Repair Shops registered');
assert(obstacleSystem.staticObstacles.length >= 40, 'Landmark buildings & barriers registered (>40 obstacles)');

// 2. Test Auto Repair Shop Back Wall Collision (Zone 0 Shop at Z = 1200)
const shop0 = obstacleSystem.autoShops[0];
console.log(`  🏬 Testing shop collider: ${shop0.name} at world pos (${shop0.worldPos.x.toFixed(1)}, ${shop0.worldPos.z.toFixed(1)})`);

// In local shop space, back wall is at lx = 16.0.
// Let's compute world position deep inside back wall (lx = 16.2, lz = 0.0)
const cosW = Math.cos(shop0.shopAngle);
const sinW = Math.sin(shop0.shopAngle);
const insideBackWallX = shop0.worldPos.x + (16.2 * cosW - 0.0 * sinW);
const insideBackWallZ = shop0.worldPos.z + (16.2 * sinW + 0.0 * cosW);

const hitBackWall = obstacleSystem.resolveCollision(new THREE.Vector3(insideBackWallX, 0, insideBackWallZ), 1.35);
assert(hitBackWall !== null && hitBackWall.collided, 'Penetrating back wall triggers collision');
assert(hitBackWall && hitBackWall.penetration > 0, `Push-out penetration calculated: ${hitBackWall?.penetration.toFixed(2)}m`);

// Apply push-out and verify car is no longer inside the wall
const resolvedX = insideBackWallX + hitBackWall.pushX;
const resolvedZ = insideBackWallZ + hitBackWall.pushZ;
const retestBackWall = obstacleSystem.resolveCollision(new THREE.Vector3(resolvedX, 0, resolvedZ), 1.35);
assert(retestBackWall === null || retestBackWall.penetration < 0.01, 'Push-out successfully clears car from back wall');

// 3. Test Landmark Building Collision (Route 66 Diner at Z: 750, lat: 36, hx: 9, hz: 7.5)
const dinerTrans = splineRoad.getRoadTransformAtZ(750, 36, 0);
const insideDiner = new THREE.Vector3(dinerTrans.pos.x, 0, dinerTrans.pos.z);
const hitDiner = obstacleSystem.resolveCollision(insideDiner, 1.35);
assert(hitDiner !== null && hitDiner.collided, `Diner collision detected: ${hitDiner?.name}`);
assert(hitDiner && hitDiner.name.includes('Diner'), 'Correct landmark building name identified');

// 4. Test VehiclePhysics Immobilizer during Auto Shop Servicing
const mockCar = {
  group: new THREE.Group(),
  damagePoints: {},
  setDamageStage: () => {}
};
const physics = new VehiclePhysics(mockCar);
physics.setWorldReferences(splineRoad, null, obstacleSystem);

// Set initial position
physics.position.set(shop0.worldPos.x + 8.0 * cosW, shop0.worldPos.y, shop0.worldPos.z + 8.0 * sinW);
physics.speed = 0;

// Engage servicing mode
gameState.isServicing = true;
gameState.isMechanicCinematic = true;

const initialX = physics.position.x;
const initialZ = physics.position.z;

// Attempt full throttle input while servicing is active
const fullThrottleInput = {
  throttle: 1.0,
  brake: 0,
  steer: 1.0,
  nitro: true,
  handbrake: false
};

// Simulate 30 frames of player trying to drive away
for (let f = 0; f < 30; f++) {
  physics.update(0.016, fullThrottleInput);
}

assert(physics.speed === 0, `Speed remains 0 while servicing (actual: ${physics.speed})`);
assert(physics.position.x === initialX && physics.position.z === initialZ, 'Car position strictly pinned — cannot drive out during servicing');
assert(gameState.speedMph === 0, 'HUD speed readout shows 0 MPH');
assert(gameState.gear === 'P', 'Transmission locked in Park [P]');

// End servicing mode and verify driving resumes
gameState.isServicing = false;
gameState.isMechanicCinematic = false;
physics.update(0.016, fullThrottleInput);
assert(physics.speed > 0, `Car accelerates normally once servicing completes (speed: ${physics.speed.toFixed(2)})`);

console.log(`\n🏁 Test Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
