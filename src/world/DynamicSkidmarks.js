import * as THREE from 'three';
import { gameState } from '../state.js';

/**
 * DynamicSkidmarks — High-Performance Ring-Buffered Instanced Tire Skidmark Engine
 * 
 * Generates dynamic asphalt tire rubber tracks during:
 * - Handbrake drifts & high-speed lateral slide cornering
 * - Hard deceleration & locked-wheel threshold braking
 * - Bare alloy rim grinding gouges from blown tires
 * 
 * Features:
 * - Single-draw-call InstancedMesh (zero per-frame geometry allocations)
 * - Ring-buffered recycling with smooth distance-based segment dropping
 * - Elevation-aware placement conforming to road profile
 */
export class DynamicSkidmarks {
  constructor(scene, splineRoad) {
    this.scene = scene;
    this.splineRoad = splineRoad;
    this.maxMarks = 240; // 120 left + 120 right segments
    this.currentIndex = 0;

    // Dual-surface material: Dark rubber for drifts/braking, silvery gouge for bare rim
    this.matSkid = new THREE.MeshBasicMaterial({
      color: 0x111115,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const skidGeo = new THREE.PlaneGeometry(0.34, 1.4);
    skidGeo.rotateX(-Math.PI * 0.5); // Lay flat on the ground plane

    this.mesh = new THREE.InstancedMesh(skidGeo, this.matSkid, this.maxMarks);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    // Initialize all instances below world floor
    this.dummy = new THREE.Object3D();
    this.dummy.position.set(0, -999, 0);
    this.dummy.updateMatrix();
    for (let i = 0; i < this.maxMarks; i++) {
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    this.scene.add(this.mesh);

    this.lastSpawnPos = new THREE.Vector3(-999, -999, -999);
    this.minDist = 1.1; // Minimum distance between successive skid stamps (meters)

    // Pre-allocated scratch vectors to prevent GC allocations
    this._vL = new THREE.Vector3();
    this._vR = new THREE.Vector3();
    this._forward = new THREE.Vector3();
  }

  update(dt, physics, input) {
    if (!physics || !physics.position) return;

    const speed = Math.abs(physics.speed || 0);
    if (speed < 3.0) return;

    const isDrifting = gameState.isDrifting || Math.abs(gameState.lateralSlipVelocity || 0) > 1.8;
    const isHardBraking = (input && input.brake > 0.45 && speed > 7.0);
    const isRimGrinding = physics.isTireBlown && speed > 2.0;

    if (!isDrifting && !isHardBraking && !isRimGrinding) return;

    // Ensure vehicle has traveled minimum distance since last mark
    const distSq = this.lastSpawnPos.distanceToSquared(physics.position);
    if (distSq < this.minDist * this.minDist) return;
    this.lastSpawnPos.copy(physics.position);

    const heading = physics.heading || 0;
    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);
    const halfTrack = 0.94;

    // Wheel contact offsets relative to vehicle center
    // Left rear tire stamp
    this._vL.set(
      physics.position.x - cosH * halfTrack - sinH * 1.3,
      physics.position.y,
      physics.position.z + sinH * halfTrack - cosH * 1.3
    );

    // Right rear tire stamp
    this._vR.set(
      physics.position.x + cosH * halfTrack - sinH * 1.3,
      physics.position.y,
      physics.position.z - sinH * halfTrack - cosH * 1.3
    );

    // Sample ground elevation
    const yL = physics.getGroundHeightAt(this._vL.x, this._vL.z) + 0.028;
    const yR = physics.getGroundHeightAt(this._vR.x, this._vR.z) + 0.028;

    this._vL.y = yL;
    this._vR.y = yR;

    // Left Mark
    this.spawnMark(this._vL, heading, isRimGrinding && (physics.blownWheelIndex === 0 || physics.blownWheelIndex === 2));

    // Right Mark
    this.spawnMark(this._vR, heading, isRimGrinding && (physics.blownWheelIndex === 1 || physics.blownWheelIndex === 3));

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  spawnMark(pos, heading, isMetalGouge = false) {
    this.dummy.position.copy(pos);
    this.dummy.rotation.set(0, heading, 0);
    if (isMetalGouge) {
      this.dummy.scale.set(0.45, 1.0, 1.3); // Narrower metallic gouge streak
    } else {
      this.dummy.scale.set(1.0, 1.0, 1.0);
    }
    this.dummy.updateMatrix();

    this.mesh.setMatrixAt(this.currentIndex, this.dummy.matrix);
    this.currentIndex = (this.currentIndex + 1) % this.maxMarks;
  }
}
