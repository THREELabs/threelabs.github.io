import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SCENIC_PARKING_LOTS, AUTO_REPAIR_SHOPS } from './SplineRoad.js';

/**
 * WorldBoundaries - Visual Guardrails, Perimeter Walls & Safety Barriers
 * 
 * Renders authentic highway visual barriers along perimeter boundaries:
 * - Start Grid Checkered Safety Wall (Z = -24m)
 * - Seattle Finish Line Deceleration Arch & Barrier (Z = 12515m)
 * - Perimeter Steel Guardrails & Hazard Delineator Posts along outer limits
 */
export class WorldBoundaries {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();

    // Photorealistic Highway Barrier & Boundary Materials
    this.matBarrierConcrete = (() => {
      const tex = renderer.textures.concreteBarrierPBR ? renderer.textures.concreteBarrierPBR(512) : null;
      if (tex) tex.repeat.set(3, 1);
      const norm = renderer.textures.concreteBarrierNormalPBR ? renderer.textures.concreteBarrierNormalPBR(512) : null;
      if (norm) norm.repeat.set(3, 1);
      return new THREE.MeshStandardMaterial({
        color: 0x989ca2,
        map: tex,
        normalMap: norm,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughness: 0.85,
        metalness: 0.05
      });
    })();

    this.matStripesYellow = renderer.createToonMaterial({ color: 0xfacc15, gradientBands: 2 });
    this.matStripesBlack = renderer.createToonMaterial({ color: 0x18181b, gradientBands: 2 });

    this.matGuardrailSteel = (() => {
      const tex = renderer.textures.guardrailSteelPBR ? renderer.textures.guardrailSteelPBR(256) : null;
      if (tex) tex.repeat.set(1, 8);
      const norm = renderer.textures.guardrailSteelNormalPBR ? renderer.textures.guardrailSteelNormalPBR(256) : null;
      if (norm) norm.repeat.set(1, 8);
      return new THREE.MeshStandardMaterial({
        color: 0xafb4ba,
        map: tex,
        normalMap: norm,
        normalScale: new THREE.Vector2(1.2, 1.2),
        roughness: 0.45,
        metalness: 0.75
      });
    })();

    this.matWoodPost = (() => {
      const tex = renderer.textures.weatheredWoodPBR ? renderer.textures.weatheredWoodPBR(512) : null;
      if (tex) tex.repeat.set(1, 2);
      const norm = renderer.textures.weatheredWoodNormalPBR ? renderer.textures.weatheredWoodNormalPBR(512) : null;
      if (norm) norm.repeat.set(1, 2);
      return new THREE.MeshStandardMaterial({
        color: 0x6e5240,
        map: tex,
        normalMap: norm,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.88,
        metalness: 0.02
      });
    })();

    this.matReflectorRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matReflectorAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matFinishBanner = renderer.createToonMaterial({ color: 0x0284c7, gradientBands: 2 });

    // Race Staging Materials & Textures (2048x256 High-DPI Gantry Banner)
    const gantryCanvas = document.createElement('canvas');
    gantryCanvas.width = 2048;
    gantryCanvas.height = 256;
    const gCtx = gantryCanvas.getContext('2d');
    gCtx.fillStyle = '#0f172a';
    gCtx.fillRect(0, 0, 2048, 256);
    // Gold neon border
    gCtx.strokeStyle = '#f59e0b';
    gCtx.lineWidth = 12;
    gCtx.strokeRect(12, 12, 2024, 232);
    // Main Title
    gCtx.fillStyle = '#ffffff';
    gCtx.font = '900 104px "Arial Black", Impact, system-ui, sans-serif';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.shadowColor = '#f59e0b';
    gCtx.shadowBlur = 24;
    gCtx.fillText('★ CALIFORNIA DREAMING ★', 1024, 110);
    // Subtitle
    gCtx.fillStyle = '#fde047';
    gCtx.font = '800 48px "Segoe UI", Arial, sans-serif';
    gCtx.shadowBlur = 12;
    gCtx.fillText('ROUTE 66 • PACIFIC HIGHWAY 1 • 23.4 KM EXPEDITION', 1024, 195);
    this.texGantryBanner = new THREE.CanvasTexture(gantryCanvas);
    this.texGantryBanner.colorSpace = THREE.SRGBColorSpace;
    this.texGantryBanner.generateMipmaps = false;
    this.texGantryBanner.minFilter = THREE.LinearFilter;
    this.texGantryBanner.magFilter = THREE.LinearFilter;
    this.texGantryBanner.anisotropy = 16;

    // Route 66 Shield Texture (512x512 High-DPI)
    const shieldCanvas = document.createElement('canvas');
    shieldCanvas.width = 512;
    shieldCanvas.height = 512;
    const sCtx = shieldCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.fillStyle = '#ffffff';
    sCtx.beginPath();
    sCtx.roundRect(20, 20, 472, 472, 60);
    sCtx.fill();
    sCtx.lineWidth = 20;
    sCtx.strokeStyle = '#0f172a';
    sCtx.stroke();
    sCtx.fillStyle = '#0f172a';
    sCtx.font = '900 72px "Arial Black", Impact, system-ui, sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('ROUTE', 256, 150);
    sCtx.font = '900 220px "Arial Black", Impact, system-ui, sans-serif';
    sCtx.fillText('66', 256, 370);
    this.texRoute66 = new THREE.CanvasTexture(shieldCanvas);
    this.texRoute66.colorSpace = THREE.SRGBColorSpace;
    this.texRoute66.generateMipmaps = false;
    this.texRoute66.minFilter = THREE.LinearFilter;
    this.texRoute66.magFilter = THREE.LinearFilter;
    this.texRoute66.anisotropy = 16;

    this.matTrussSteel = renderer.createToonMaterial({ color: 0x27272a, gradientBands: 2 });
    this.matGantryBanner = new THREE.MeshBasicMaterial({ map: this.texGantryBanner });
    this.matShield66 = new THREE.MeshBasicMaterial({ map: this.texRoute66 });
    this.matLightRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matLightGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    this.matLightHousing = renderer.createToonMaterial({ color: 0x09090b, gradientBands: 2 });
    this.matConeOrange = renderer.createToonMaterial({ color: 0xf97316, gradientBands: 2 });
    this.matConeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.matTireBlack = renderer.createToonMaterial({ color: 0x18181b, gradientBands: 2 });
    this.matTireWhite = renderer.createToonMaterial({ color: 0xf8fafc, gradientBands: 2 });
    this.matTentBlue = renderer.createToonMaterial({ color: 0x0284c7, gradientBands: 3 });
    this.matTentYellow = renderer.createToonMaterial({ color: 0xeab308, gradientBands: 3 });

    // Spatial partitioning for boundary guardrails and fences
    this.totalLength = Math.max(31200, (this.splineRoad && this.splineRoad.totalLength) ? this.splineRoad.totalLength : 31200);
    this.chunkSize = 500;
    this.numChunks = Math.ceil(this.totalLength / this.chunkSize) + 2;
    this.boundaryChunks = [];
    for (let i = 0; i < this.numChunks; i++) {
      const chunkGroup = new THREE.Group();
      chunkGroup.name = `BoundaryChunk_${i}`;
      this.boundaryChunks.push(chunkGroup);
      this.group.add(chunkGroup);
    }
    this._lastChunk = -1;

    this.buildStartLineBarrier();
    this.buildFinishLineBarrier();
    this.buildCoastalCliffGuardrails();
    this.buildCorridorPerimeterGuardrails();
    this.batchBoundaryChunks();

    // Initialize initial chunk visibility (start area)
    for (let i = 0; i < this.numChunks; i++) {
      this.boundaryChunks[i].visible = (i <= 2);
    }
  }

  batchBoundaryChunks() {
    this.boundaryChunks.forEach(chunk => {
      if (!chunk.children || chunk.children.length <= 1) return;
      const buckets = new Map();
      const meshesToBatch = [];
      chunk.traverse(o => {
        if (o.isMesh && o.geometry && o.material) {
          meshesToBatch.push(o);
        }
      });
      if (meshesToBatch.length <= 1) return;

      meshesToBatch.forEach(mesh => {
        mesh.updateWorldMatrix(true, false);
        chunk.updateWorldMatrix(true, false);
        const m = new THREE.Matrix4().copy(chunk.matrixWorld).invert().multiply(mesh.matrixWorld);
        const g = mesh.geometry.clone();
        g.applyMatrix4(m);
        const mat = mesh.material;
        if (!buckets.has(mat)) buckets.set(mat, []);
        buckets.get(mat).push({ geom: g, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow });
      });

      while (chunk.children.length > 0) {
        chunk.remove(chunk.children[0]);
      }

      for (const [material, items] of buckets.entries()) {
        if (items.length === 1) {
          const m = new THREE.Mesh(items[0].geom, material);
          m.castShadow = items[0].castShadow;
          m.receiveShadow = items[0].receiveShadow;
          chunk.add(m);
        } else {
          const geoms = items.map(it => it.geom);
          const hasIndexed = geoms.some(g => !!g.index);
          const hasNonIndexed = geoms.some(g => !g.index);
          const normalized = (hasIndexed && hasNonIndexed)
            ? geoms.map(g => (g.index ? g.toNonIndexed() : g.clone()))
            : geoms.map(g => g.clone());

          const merged = mergeGeometries(normalized, false);
          if (merged) {
            const m = new THREE.Mesh(merged, material);
            m.castShadow = items.some(it => it.castShadow);
            m.receiveShadow = items.some(it => it.receiveShadow);
            chunk.add(m);
          } else {
            items.forEach(it => {
              const m = new THREE.Mesh(it.geom, material);
              m.castShadow = it.castShadow;
              m.receiveShadow = it.receiveShadow;
              chunk.add(m);
            });
          }
        }
      }
    });
  }

  addToChunk(object, z) {
    const chunkIdx = Math.max(0, Math.min(this.numChunks - 1, Math.floor(z / this.chunkSize)));
    this.boundaryChunks[chunkIdx].add(object);
  }

  buildStartLineBarrier() {
    // Ethereal dream intro: Start line is completely open into the rolling cloudscape without concrete barriers
  }

  buildFinishLineBarrier() {
    const finishZ = 26015;
    const finishGroup = new THREE.Group();
    const transform = this.splineRoad.getRoadTransformAtZ(25990, 0, 0);
    finishGroup.position.set(transform.pos.x, transform.pos.y, finishZ);
    finishGroup.rotation.y = transform.heading;

    // Heavy Concrete Finish Line Barrier
    const kRail = new THREE.Mesh(new THREE.BoxGeometry(120, 1.8, 1.5), this.matBarrierConcrete);
    kRail.position.set(0, 0.9, 0);
    kRail.castShadow = true;
    finishGroup.add(kRail);

    // Tire Cushion Dampers along barrier face
    for (let x = -54; x <= 54; x += 3.5) {
      const tireStack = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.6, 12), this.matStripesBlack);
      tireStack.position.set(x, 0.8, -1.4);
      finishGroup.add(tireStack);
    }

    this.group.add(finishGroup);
  }

  /** Continuous Steel Guardrails along Pacific Ocean Coastal Cliff Drop-Offs */
  buildCoastalCliffGuardrails() {
    const postGeo = new THREE.BoxGeometry(0.18, 1.2, 0.18);
    const railGeo = new THREE.BoxGeometry(0.12, 0.42, 20.2);
    const refGeo = new THREE.BoxGeometry(0.14, 0.22, 0.06);

    // Coastal zones: Malibu (6500-14500m), Big Sur (14500-20500m), Oregon Coast (36000-40500m)
    const coastalRanges = [
      { start: 6500, end: 14480 },
      { start: 14520, end: 20480 },
      { start: 36000, end: 40480 }
    ];

    coastalRanges.forEach(range => {
      for (let z = range.start; z <= range.end; z += 20) {
        // Skip guardrails across scenic parking lot turnout entrances and auto repair shops
        const inTurnoutEntrance = SCENIC_PARKING_LOTS.some(
          lot => lot.side === 'left' && Math.abs(z - lot.z) <= (lot.length * 0.5 + 14.0)
        ) || AUTO_REPAIR_SHOPS.some(
          shop => shop.side === 'left' && Math.abs(z - shop.z) <= (shop.length * 0.5 + 36.0)
        );
        if (inTurnoutEntrance) continue;

        const roadTransform = this.splineRoad.getRoadTransformAtZ(z, -17.5, 0);
        
        // Wooden support post
        const post = new THREE.Mesh(postGeo, this.matWoodPost);
        post.position.copy(roadTransform.pos);
        post.position.y += 0.6;
        post.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), roadTransform.tangent);
        this.addToChunk(post, z);

        // Steel W-beam continuous guardrail
        const rail = new THREE.Mesh(railGeo, this.matGuardrailSteel);
        rail.position.copy(roadTransform.pos);
        rail.position.y += 0.75;
        rail.position.addScaledVector(roadTransform.tangent, 10.0);
        rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), roadTransform.tangent);
        this.addToChunk(rail, z);

        // White warning reflector on post
        const ref = new THREE.Mesh(refGeo, this.matReflectorAmber);
        ref.position.copy(roadTransform.pos);
        ref.position.y += 1.05;
        ref.position.x += 0.1;
        ref.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), roadTransform.tangent);
        this.addToChunk(ref, z);
      }
    });
  }

  /** Outer Playable Corridor Guardrails & Boundary Safety Markers (±58m) */
  buildCorridorPerimeterGuardrails() {
    const postGeo = new THREE.BoxGeometry(0.2, 1.4, 0.2);
    const railGeo = new THREE.BoxGeometry(0.14, 0.45, 30.2);
    const reflectorGeo = new THREE.BoxGeometry(0.16, 0.26, 0.06);

    const STEP_Z = 35;
    for (let z = 340; z <= 61950; z += STEP_Z) {
      // Do not build floating outer boundary fences over open bridge water spans
      if ((z >= 18550 && z <= 18750) || (z >= 28600 && z <= 29200) || (z >= 31750 && z <= 31950) || (z >= 41300 && z <= 41500)) continue;

      const roadInfo = this.splineRoad.getRoadInfo(0, z);
      const rx = roadInfo.roadPoint.x;

      [-58, 58].forEach((lateralOffset, sideIdx) => {
        const isRight = lateralOffset > 0;
        // Skip perimeter fence if within parking lot area, auto repair shop, or off-road trail corridor
        const isCoyoteTrailOpening = !isRight && z >= 2440 && z <= 3080;
        if (isCoyoteTrailOpening) return;

        const inTurnoutArea = SCENIC_PARKING_LOTS.some(
          lot => (lot.side === (isRight ? 'right' : 'left')) && Math.abs(z - lot.z) <= (lot.length * 0.5 + 14.0)
        ) || AUTO_REPAIR_SHOPS.some(
          shop => (shop.side === (isRight ? 'right' : 'left')) && Math.abs(z - shop.z) <= (shop.length * 0.5 + 40.0)
        );
        if (inTurnoutArea) return;

        const x = rx + lateralOffset;
        const groundY = 0.5; // elevated boundary berm
        
        // Post
        const post = new THREE.Mesh(postGeo, this.matWoodPost);
        post.position.set(x, groundY + 0.7, z);
        this.addToChunk(post, z);

        // Steel rail segment connecting to next post
        const rail = new THREE.Mesh(railGeo, this.matGuardrailSteel);
        rail.position.set(x, groundY + 0.9, z + STEP_Z * 0.5);
        this.addToChunk(rail, z);

        // Warning Reflector
        const ref = new THREE.Mesh(reflectorGeo, sideIdx === 0 ? this.matReflectorRed : this.matReflectorAmber);
        ref.position.set(x, groundY + 1.25, z);
        this.addToChunk(ref, z);
      });
    }
  }

  update(dt, playerPos) {
    if (playerPos && this.boundaryChunks) {
      const curChunk = Math.floor(playerPos.z / this.chunkSize);
      if (curChunk !== this._lastChunk) {
        this._lastChunk = curChunk;
        const minChunk = Math.max(0, curChunk - 1);
        const maxChunk = Math.min(this.numChunks - 1, curChunk + 2);
        for (let i = 0; i < this.numChunks; i++) {
          this.boundaryChunks[i].visible = (i >= minChunk && i <= maxChunk);
        }
      }
    }
  }
}
