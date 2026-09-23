---
name: game-playtester
description: >-
  Playtest and verify Baja Racer in a live browser environment. Use this skill
  when an agent needs to test game mechanics, verify 60 FPS performance, check for console
  errors, test autopilot, or record gameplay sessions after making code changes.
---

# Baja Racer Playtesting & QA Skill

This skill provides step-by-step procedures for running automated and interactive browser playtesting on Baja Racer.

---

## Playtesting Workflow

### 1. Check Dev Server
Ensure a local HTTP server is serving the root directory:
```bash
# Check if server is running on port 8000
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000
```
If not running, start one in the background:
```bash
python3 -m http.server 8000 &
```

### 2. Run Module & Logic Integrity Test
Run the automated test runner before launching the browser:
```bash
node scripts/agent_test_runner.js
```

### 3. Launch Browser Playtester Subagent
Invoke a `browser_subagent` with the task of loading `http://localhost:8000`:
* **Start Race**: Click on the canvas or press `Space` / `Enter` to start the countdown.
* **Simulate Driving**:
  * Hold `ArrowUp` or `KeyW` to accelerate.
  * Tap `ArrowLeft` / `ArrowRight` (or `KeyA` / `KeyD`) to steer.
  * Hold `Space` to activate Nitro boost.
  * Press `KeyP` to test Autopilot navigation.
* **Observe Console Logs**: Confirm that no `Uncaught TypeError`, `ReferenceError`, or projection `NaN` warnings are logged.
* **Record Gameplay**: Name the recording (e.g. `playtest_gameplay_demo`) so a WebP artifact is preserved for visual inspection.

### 4. Telemetry Evaluation Criteria
A playtest passes if:
1. Canvas renders background horizons, road segments, player truck, and UI HUD without flickering.
2. Speed accelerates smoothly up to top speed (and beyond with Nitro).
3. Checkpoint banners trigger smoothly as zone distance increments.
4. Pursuit / radar mechanics activate without freezing the render loop.

### 5. Cleanup & Teardown (Mandatory)
Always terminate and stop any background servers, services, or daemon tasks started during testing immediately once playtesting is complete:
* Kill any background dev server (e.g., Vite on port `5173` or Python HTTP server on port `8000`).
* Verify no lingering processes remain bound to test ports (`lsof -ti :5173 -sTCP:LISTEN` / `lsof -ti :8000 -sTCP:LISTEN`).
* Cancel and clean up all background subagents and tasks. Never leave orphaned background processes running.
