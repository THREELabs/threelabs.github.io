import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Batch explicitly static prop roots, not arbitrary scene/interactive hierarchies.
 * Retains groups and excluded subtrees; never disposes shared source resources.
 * Transparent surfaces stay separate to preserve Three.js depth sorting.
 */
export function batchStaticProps(root, { exclude = new Set() } = {}) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map();
  const visit = node => {
    if (exclude.has(node) || (node !== root && !node.visible)) return;
    if (node !== root && node.isGroup && node.renderOrder !== 0) return;
    if (node.isMesh && !node.isInstancedMesh && !node.isSkinnedMesh &&
        !node.children.length && !Array.isArray(node.material) &&
        !node.material.transparent && !node.morphTargetInfluences &&
        node.onBeforeRender === THREE.Object3D.prototype.onBeforeRender &&
        node.onAfterRender === THREE.Object3D.prototype.onAfterRender &&
        node.geometry.drawRange.start === 0 && node.geometry.drawRange.count === Infinity) {
      const matrix = new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld);
      if (matrix.determinant() > 0) {
        const attrs = Object.entries(node.geometry.attributes).sort().map(([k,a]) =>
          `${k}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`).join('|');
        const key = [node.material.uuid, node.castShadow, node.receiveShadow,
          node.renderOrder, node.layers.mask, node.frustumCulled, attrs].join(';');
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push({ node, matrix });
      }
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
  let sourceMeshes = 0, batches = 0;
  for (const entries of buckets.values()) {
    if (entries.length < 2) continue;
    const copies = entries.map(({node, matrix}) => {
      const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
      return geometry.applyMatrix4(matrix);
    });
    const merged = mergeGeometries(copies, false);
    copies.forEach(g => g.dispose());
    if (!merged) continue;
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const first = entries[0].node;
    const batch = new THREE.Mesh(merged, first.material);
    batch.name = `StaticBatch_${batches}`;
    batch.castShadow = first.castShadow;
    batch.receiveShadow = first.receiveShadow;
    batch.renderOrder = first.renderOrder;
    batch.layers.mask = first.layers.mask;
    batch.frustumCulled = first.frustumCulled;
    for (const {node} of entries) node.removeFromParent();
    root.add(batch);
    sourceMeshes += entries.length;
    batches++;
  }
  return { sourceMeshes, batches, savedMeshes: sourceMeshes - batches };
}
