# Baja Racer — Agent Architecture & Engineering Rules

These rules govern how AI agents should inspect, design, modify, and verify code within the **Baja Racer** repository.

---

## 1. Engine & Runtime Architecture
* **Vanilla ES Modules**: The engine runs in modern browsers with Vite development and bundling. All source code resides in `src/` (e.g., `import { gameState } from './state.js';`).
* **Frame Rate Budget (60 FPS)**:
  * Never allocate large objects or arrays inside the main animation loop (`render()` in `Renderer.js` or `update()` in `Physics.js`).
  * Reuse particle and geometry pools where possible.
  * Clamp all particle arrays to maximum capacity.
* **AudioNode Pooling & Synthesis**:
  * For frequent SFX (skids, collisions, tire screech), reuse Web Audio oscillator/gain nodes to avoid garbage collection hitches.

---

## 2. State & Separation of Concerns
* **State Mutation**: All game state variables live in `src/state.js` in `gameState`. Never introduce ad-hoc global window variables.
* **Pure Math & Helper Utilities**: Mathematical helpers reside in `src/utils/` or dedicated domain classes.
* **Constants**: Tune physics, car speeds, scoring values, and zone dimensions in `src/constants.js`.

---

## 3. Agent Development Loop Standards
When modifying or expanding the game, all agents must follow the **OODA Loop**:
1. **Observe**: Inspect code, state, and relevant files directly. Do NOT run `node scripts/agent_test_runner.js` or automated test suites (the user conducts all testing).
2. **Implement**: Keep changes focused, strictly typed in comments where helpful, and adhere to modular file boundaries.
3. **User Testing & Verification**: The user handles all testing, playtesting, and verification directly in their hardware-accelerated browser to conserve context, tokens, and turnaround time. Do NOT run automated test runners or headless passes unless the user explicitly requests an automated test run.
4. **Teardown & Cleanup**: Always terminate and stop any background services, web servers (e.g., Vite on port `5173` or Python HTTP server on port `8000`), or background tasks once work is complete. Never leave orphaned background processes running.

---

## 4. Git & Release Standards
* **Updating Main**: Whenever asked to "update main", "push main", or "commit to main", always commit locally to `main` AND push to remote `origin/main` automatically so both are always synchronized in lockstep.
