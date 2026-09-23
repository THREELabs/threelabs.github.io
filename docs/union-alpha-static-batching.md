# First-zone performance work: static prop batching

Branch: union-alpha. Complements the low-power post-processing fix in docs/union-alpha-performance-review.md.

## What was added

- src/engine/StaticMeshBatcher.js: batchStaticProps(root, {exclude}) merges leaf static meshes sharing geometry layout, material and render flags into one geometry per bucket. Preserves all node transforms, cast/receiveShadow, renderOrder, layers, frustumCulled; skips transparent, multi-material, callback-bearing, instanced, skinned and morph-target meshes; skips mirrored (negative determinant) transforms; never disposes shared source resources; idempotent.
- main.js: applies it to scenic parking lot interiors (excluding all animated plaque beacon, sky beam, star marker nodes) and to auto repair shops (excluding the animated holographic wrench), after existing outer batching, before freezeStaticHierarchy. Window.game.propBatchStats exposes per-lot results.
- main.js: matrixAutoUpdate now restored for skyBeam and starMarker as well as beaconGroup, because batching preserved those nodes inside otherwise frozen hierarchies.

## Measured results (Chrome automation, SwiftShader software GPU, 640x360)

Single-scene-pass draw-call audit, same methodology before and after:
- Desert spawn: 2,047 → 1,695 calls.
- Desert at Z=1200: 1,857 → 1,503.
- Malibu at Z=3000: 1,587 → 1,253.
- Scenic lot detail: ~88-94 calls per lot → 13-18. Repair shops no longer appear in the top call groups.
- Triangles essentially unchanged (e.g. 495,383 → 491,507 in one sample); geometry was merged, not removed.

Fixed-scene, paused-simulation A/B (baseline stashed, then restored, one sequential run each, identical viewport and methodology):
- Without batcher: 0.835/0.883 FPS (composer on), 1.499/1.631 (composer off).
- With batcher: 0.835/0.910 (composer on), 1.665/1.718 (composer off).
On this software rasterizer the absolute FPS is dominated by fill rate, so the A/B shows only a small improvement (~+0.1-0.15 FPS composer-off) despite 17% fewer calls. On real hardware, draw-call counts typically matter far more than they do under SwiftShader; the structural reduction is the primary evidence.

## Verification

- node scripts/test_static_batcher.js: PASS (transforms, geometry counts, render flags, exclusions, shared-resource safety, idempotence).
- node scripts/test_postprocessing_quality.js: PASS.
- npm run build: PASS (same large-chunk warning as baseline).
- Browser: zero page errors; baseline glError 0; baseline post=false confirms Turbo fix active; geometries 1,937 → 1,643, textures 79 → 66.

Post-processing pass isolation (composer enabled, paused, fixed scene, one sequence): all-on 0.797 FPS → bloom-off 0.979 → grade-off 0.944 → both-off 1.016 → all-on-again 0.908 (drift within run order). Each pass costs roughly 0.1-0.2 FPS under SwiftShader; scene submission remains the dominant cost there. Zero GL errors across all configurations.

## Limitations

Tested only via automated Chrome (SwiftShader); no hardware-FPS claim. Batching covers scenic lots and repair shops only; trail (98), crime scene (117), vehicles and player Jeep remain unbatched. Render-flag behavior under the project's shadow toggles was audited but not screenshot-compared; a visual spot-check on real hardware is advisable.
