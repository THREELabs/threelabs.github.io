# First-zone performance investigation

Branch: union-alpha, based on 8c3ce2b. Scope: first desert region (code zone 0), with a comparison in Malibu (code zone 1).

## Measured findings

Chrome automation on this host selected SwiftShader software rendering. A headed hardware-accelerated attempt timed out. These measurements cannot reproduce or predict the user's hardware FPS.

At 640x360, normal desert rendering submitted 2,064 calls and approximately 491,000 triangles. A single scene-pass audit (no shadow-setting changes) recorded:

- Desert start: 2,049 calls; TrafficManager subtree 789, scenic parking lots 446 across five lots, mystery crime scene 117, trail 98, player Jeep 95.
- Desert at Z=1200: 1,857 calls; TrafficManager subtree 871, five scenic parking lots 440, deep trail features 88, Jeep 95.
- Malibu at Z=3000: 1,585 calls; TrafficManager subtree 791, Jeep 95.

TrafficManager includes repair shops and radar posts as well as vehicles; its entire cost should not be attributed to civilian cars. The batching helper in main.js explicitly preserves ScenicLot/Scenic/Trail groups. Static details inside these groups are candidates for safe batching while preserving interactive and animated nodes.

A separate 1280x720 instrumented sample measured physics around 0.3–0.55 ms/update and renderer JS submission around 26–38 ms at spawn. GPU work is asynchronous and is NOT represented by those JS timings. Disabling HUD updates or pausing simulation did not materially improve that software-rendered test.

Baseline WebGL error checks returned zero. Sampler errors occurred in an earlier experiment that toggled shadows live, not in untouched baseline checks; no baseline shader defect established.

## Confirmed preset issue and limited fix

state.js defaults to turbo120. PostProcessingManager bypassed its composer for low-power balanced but not low-power turbo120. Thus detected software/low-power devices retained HDR targets, 4x MSAA, bloom, grading and output passes on the default preset. Lower bloom strength does not reduce pass count.

Changed only this condition: low-power turbo120 now bypasses composer, like low-power balanced. High remains an explicit opt-in; normal desktop Turbo is unchanged. This does not fix the large scene draw-call count. detectLowPowerDevice does not classify Intel integrated GPUs, so this fix will not automatically apply to every weak desktop GPU.

## Verification

- node scripts/test_postprocessing_quality.js: 9 cases passed.
- npm run build: passed, with existing large-chunk warning (~2.04 MB JS, ~514 KB gzip).
- Browser checked actual default low-power Turbo selection: composer disabled, zero page errors.
- Fixed-scene, paused-simulation A/B/A/B at 640x360, software GPU:
  - Composer enabled: 0.791 FPS; disabled: 1.644 FPS.
  - Composer enabled: 0.887 FPS; disabled: 1.669 FPS.
  - Calls: 2062 vs 2047, triangles: 495383 vs 495368. WebGL errors: zero throughout.

This is evidence of substantial post-processing cost on the test software GPU, NOT a promised hardware speedup or proof the user's 15–20 FPS is resolved.

## Next steps

Obtain user's device/browser, selected quality and exact slow location. Profile on that device. Prioritize static batching/LOD within repair shops and scenic parking lots without removing scenery or interactions, then repeat scene and gameplay verification. No deployment or push performed.
