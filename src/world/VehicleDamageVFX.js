import * as THREE from 'three';
import { gameState } from '../state.js';

/**
 * VehicleDamageVFX — Progressive Smoke & Fire Particle System
 *
 * Stage 1 (integrity < 70%): light grey radiator steam from hood
 * Stage 2 (integrity < 45%): heavy black oily smoke billowing behind the car
 * Stage 3 (integrity < 25%): orange-red fire + pulsing engine bay point light
 *
 * Uses a fixed pool of billboard quads (no per-frame allocation).
 * All arrays are pre-allocated; particles are recycled by resetting on death.
 */
export class VehicleDamageVFX {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Particle counts — kept low for 60 FPS budget
    this.SMOKE_COUNT = 60;
    this.FIRE_COUNT  = 36;

    this._buildTextures();
    this._buildSmokePools();
    this._buildFirePool();
    this._buildFireLight();

    // Track last vehicle position for spawn placement
    this._carPos = new THREE.Vector3();
    this._carHeading = 0;
    this._emitTimer = 0;
  }

  // ─── Procedural Textures ─────────────────────────────────────────────────

  _buildTextures() {
    // Soft radial smoke puff
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = smokeCanvas.height = 64;
    const sc = smokeCanvas.getContext('2d');
    const sg = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0.00, 'rgba(255,255,255,0.90)');
    sg.addColorStop(0.35, 'rgba(200,200,200,0.65)');
    sg.addColorStop(0.70, 'rgba(120,120,120,0.25)');
    sg.addColorStop(1.00, 'rgba(80,80,80,0.00)');
    sc.fillStyle = sg;
    sc.fillRect(0, 0, 64, 64);
    this.texSmoke = new THREE.CanvasTexture(smokeCanvas);

    // Warm fire/ember puff
    const fireCanvas = document.createElement('canvas');
    fireCanvas.width = fireCanvas.height = 64;
    const fc = fireCanvas.getContext('2d');
    const fg = fc.createRadialGradient(32, 32, 0, 32, 32, 32);
    fg.addColorStop(0.00, 'rgba(255,255,200,1.00)');
    fg.addColorStop(0.18, 'rgba(255,200,40,0.95)');
    fg.addColorStop(0.45, 'rgba(255,80,10,0.65)');
    fg.addColorStop(0.75, 'rgba(180,20,0,0.25)');
    fg.addColorStop(1.00, 'rgba(80,0,0,0.00)');
    fc.fillStyle = fg;
    fc.fillRect(0, 0, 64, 64);
    this.texFire = new THREE.CanvasTexture(fireCanvas);
  }

  // ─── Pool Builders ────────────────────────────────────────────────────────

  _buildSmokePools() {
    const geo = new THREE.PlaneGeometry(1, 1);

    // Steam pool (light grey, small)
    this.steamMat = new THREE.MeshBasicMaterial({
      map: this.texSmoke,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      color: new THREE.Color(0xdddddd)
    });
    this.steamPool = [];
    for (let i = 0; i < this.SMOKE_COUNT / 2; i++) {
      const m = new THREE.Mesh(geo, this.steamMat.clone());
      m.visible = false;
      this.group.add(m);
      this.steamPool.push({ mesh: m, active: false, life: 0, maxLife: 0, vel: new THREE.Vector3(), size: 1, opacity: 0 });
    }

    // Heavy smoke pool (dark, large)
    this.smokeMat = new THREE.MeshBasicMaterial({
      map: this.texSmoke,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      color: new THREE.Color(0x222222)
    });
    this.smokePool = [];
    for (let i = 0; i < this.SMOKE_COUNT; i++) {
      const m = new THREE.Mesh(geo, this.smokeMat.clone());
      m.visible = false;
      this.group.add(m);
      this.smokePool.push({ mesh: m, active: false, life: 0, maxLife: 0, vel: new THREE.Vector3(), size: 1, opacity: 0 });
    }
  }

  _buildFirePool() {
    const geo = new THREE.PlaneGeometry(1, 1);
    this.fireMat = new THREE.MeshBasicMaterial({
      map: this.texFire,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.firePool = [];
    for (let i = 0; i < this.FIRE_COUNT; i++) {
      const m = new THREE.Mesh(geo, this.fireMat.clone());
      m.visible = false;
      this.group.add(m);
      this.firePool.push({ mesh: m, active: false, life: 0, maxLife: 0, vel: new THREE.Vector3(), size: 1, opacity: 0 });
    }
  }

  _buildFireLight() {
    // A warm orange point light that flickers when on fire
    this.fireLight = new THREE.PointLight(0xff4400, 0, 8);
    this.fireLight.visible = false;
    this.scene.add(this.fireLight);
  }

  // ─── Particle Spawners ────────────────────────────────────────────────────

  _spawnSteam(pos, carSpeed) {
    const p = this.steamPool.find(p => !p.active);
    if (!p) return;
    p.active = true;
    p.life = 0;
    p.maxLife = 1.2 + Math.random() * 0.8;
    // Hood-top position with slight random spread
    p.mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.4,
      pos.y + 0.6 + Math.random() * 0.2,
      pos.z + (Math.random() - 0.5) * 0.4
    );
    p.vel.set(
      (Math.random() - 0.5) * 0.8,
      1.4 + Math.random() * 0.8,
      (Math.random() - 0.5) * 0.8 - carSpeed * 0.05
    );
    p.size = 0.35 + Math.random() * 0.3;
    p.mesh.scale.setScalar(p.size);
    p.mesh.visible = true;
    p.mesh.rotation.z = Math.random() * Math.PI * 2;
  }

  _spawnSmoke(pos, carSpeed, heading) {
    const p = this.smokePool.find(p => !p.active);
    if (!p) return;
    p.active = true;
    p.life = 0;
    p.maxLife = 2.2 + Math.random() * 1.2;
    // Spawns from hood/engine area with trailing offset behind the car
    const bx = -Math.sin(heading) * 0.5;
    const bz = -Math.cos(heading) * 0.5;
    p.mesh.position.set(
      pos.x + bx + (Math.random() - 0.5) * 0.6,
      pos.y + 0.5 + Math.random() * 0.3,
      pos.z + bz + (Math.random() - 0.5) * 0.6
    );
    // Drifts up and backwards
    p.vel.set(
      (Math.random() - 0.5) * 1.2 - Math.sin(heading) * carSpeed * 0.03,
      1.8 + Math.random() * 1.0,
      (Math.random() - 0.5) * 1.2 - Math.cos(heading) * carSpeed * 0.06
    );
    p.size = 0.8 + Math.random() * 0.6;
    p.mesh.scale.setScalar(p.size);
    p.mesh.visible = true;
    p.mesh.rotation.z = Math.random() * Math.PI * 2;
  }

  _spawnFire(pos) {
    const p = this.firePool.find(p => !p.active);
    if (!p) return;
    p.active = true;
    p.life = 0;
    p.maxLife = 0.35 + Math.random() * 0.25;
    // Engine bay — slightly below hood, near front
    p.mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.55,
      pos.y + 0.3 + Math.random() * 0.3,
      pos.z + 0.5 + (Math.random() - 0.5) * 0.4
    );
    p.vel.set(
      (Math.random() - 0.5) * 1.5,
      3.5 + Math.random() * 2.0,
      (Math.random() - 0.5) * 1.5
    );
    p.size = 0.25 + Math.random() * 0.35;
    p.mesh.scale.setScalar(p.size);
    p.mesh.visible = true;
    p.mesh.rotation.z = Math.random() * Math.PI * 2;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  update(dt, carGroup, carHeading) {
    if (!carGroup) return;
    if (dt > 0.05) dt = 0.05;

    this._carPos.copy(carGroup.position);
    this._carHeading = carHeading;

    const integrity = gameState.carIntegrity !== undefined ? gameState.carIntegrity : 100;
    const carSpeed  = gameState.speed !== undefined ? Math.abs(gameState.speed) : 0;
    const time      = gameState.gameTime || 0;

    // Face all billboards toward the camera
    const cam = window.game && window.game.renderer ? window.game.renderer.camera : null;

    // ── Emission ─────────────────────────────────────────────────────────────
    this._emitTimer += dt;

    const steamRate  = integrity < 45 ? (integrity < 25 ? 0.05 : 0.14) : 9999;
    const smokeRate  = integrity < 25 ? (integrity < 12 ? 0.05 : 0.10) : 9999;
    const fireRate   = integrity < 10 ? 0.03 : 9999;

    const hoodPos = this._carPos.clone();
    // Offset to hood-top in world space (front of car, above bonnet)
    hoodPos.x += Math.sin(this._carHeading) * 1.2;
    hoodPos.z += Math.cos(this._carHeading) * 1.2;

    if (this._emitTimer >= steamRate) {
      this._emitTimer = 0;
      this._spawnSteam(hoodPos, carSpeed);
    }
    if (integrity < 25 && this._emitTimer >= smokeRate) {
      this._spawnSmoke(hoodPos, carSpeed, this._carHeading);
    }
    if (integrity < 10) {
      // Fire emits only at extreme wreck condition (< 10%)
      const fireCount = integrity < 5 ? 2 : 1;
      for (let f = 0; f < fireCount; f++) {
        this._spawnFire(hoodPos);
      }
    }

    // ── Particle Update ───────────────────────────────────────────────────────
    const gravity = -1.5;

    const updatePool = (pool, isAdditive) => {
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }

        const t = p.life / p.maxLife; // 0→1 over lifetime

        // Physics
        p.vel.y += gravity * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;

        // Grow over lifetime, slow down lateral drift
        p.vel.x *= 0.985;
        p.vel.z *= 0.985;
        const growScale = p.size * (1.0 + t * 2.2);
        p.mesh.scale.setScalar(growScale);

        // Fade in, then out — fire fades faster
        let alpha;
        if (isAdditive) {
          alpha = t < 0.2 ? (t / 0.2) : Math.max(0, 1.0 - ((t - 0.2) / 0.8));
          alpha *= 0.85;
        } else {
          alpha = t < 0.15 ? (t / 0.15) : Math.max(0, 1.0 - ((t - 0.15) / 0.85));
          alpha *= 0.58;
        }
        p.mesh.material.opacity = alpha;

        // Slow spin
        p.mesh.rotation.z += dt * (isAdditive ? 1.8 : 0.55);

        // Billboard toward camera
        if (cam) p.mesh.lookAt(cam.position);
      }
    };

    updatePool(this.steamPool, false);
    updatePool(this.smokePool, false);
    updatePool(this.firePool, true);

    // ── Fire Light ────────────────────────────────────────────────────────────
    if (integrity < 25) {
      this.fireLight.position.set(
        hoodPos.x,
        hoodPos.y + 0.6,
        hoodPos.z
      );
      // Flicker: fast sine noise
      const flicker = 0.7 + 0.3 * Math.sin(time * 38.0) * Math.sin(time * 17.3);
      const baseIntensity = integrity < 12 ? 22 : 14;
      this.fireLight.intensity = baseIntensity * flicker;
      this.fireLight.color.set(integrity < 12 ? 0xff2200 : 0xff6600);
      this.fireLight.visible = true;
      this.fireLight.distance = integrity < 12 ? 12 : 8;
    } else {
      this.fireLight.visible = false;
      this.fireLight.intensity = 0;
    }

    // ── Hide everything when car is serviced / pristine ───────────────────────
    if (integrity > 72 || gameState.isServicing) {
      this._hideAll();
    }
  }

  _hideAll() {
    [...this.steamPool, ...this.smokePool, ...this.firePool].forEach(p => {
      if (p.active) {
        p.active = false;
        p.mesh.visible = false;
      }
    });
    this.fireLight.visible = false;
  }

  reset() {
    this._hideAll();
  }
}
