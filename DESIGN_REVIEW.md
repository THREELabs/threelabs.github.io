# Baja Blast — Design Review

> Working file for ox-alpha design reviews of THREELabs-Baja-Racer.
> **Status:** 2026-08-22 (**`drive-thru-services` branch**, rev 2) — garage drive-in rework + collision overhaul. 49/49 node · 16/16 browser smoke · services smoke stable ×6.

## Shipped this cycle (rev 2) — Garage Drive-In & No-More-Vanishing-Cars

### REPAIR-O-RAMA is now a real drive-in garage
- **New sprite (760×400, up from 520×380):** full-width open-front building —
  deep dark interior with fluorescent-lit work area, tool cabinets, empty lift
  waiting, rolled-up door slats on rails, concrete approach slab. The truck
  visually drives *into* the building, not alongside it.
- **Longer entry road:** mechanic guide lane 26 → **40 segments** (~2× the
  fuel lane) with advance signage moved out accordingly.
- **Wider driveway:** lane `halfWidth` 0.62 → **0.88** for mechanics, painted
  as a double dash row; corridor clearance widened to match (+0.9 vs +0.35).
- **Deeper bay:** garage interior counts 14 segments deep (fuel stays 8).

### Collision overhaul — "cars just disappear" fixed
Two compounding root causes found:
1. **Render skip:** the car-draw loop ran `n > 0`, excluding the player's own
   segment. Any car you rear-ended (old code snapped you onto its position)
   sat in segment 0 and literally could not render — the vanish bug. Now
   `n >= 0` with a negative-scale guard (`scSafe`) that also fixes a latent
   `IndexSizeError` crash from negative ellipse radii at the camera plane.
2. **Teleport rear-end:** player-vs-AI contact snapped the player's world
   position onto the struck car. Replaced with momentum exchange: struck car
   shoved forward (+40 z), player scrubs speed and slides around it. No snaps.
3. **AI-vs-AI bumps:** previously avoidance steering only (ghost-through with
   occasional damage ping). Now real momentum exchange on contact — closing
   speed splits between both cars, lateral shove apart, thud audio, damage
   only on hard hits. Nobody passes through anybody.

### Tests added (47 → 49)
- Rear-end bump: rival survives in-world + in-segment, player never teleports,
  momentum actually exchanged.
- Mechanic bays assert longer/wider: halfWidth > 0.8 for shops, < 0.8 for
  fuel; ≥70 double-painted dash rows across the two garage driveways.
- Services smoke: police stand-down during the service window (cops ramming
  parked trucks was polluting the repair check); repair latch polls faster.

## Shipped this cycle (rev 1) — Drive-Thru Services

- Gas stations 4→2 (REQUIRED, fuel-balanced), mechanic shops 1→2 (OPTIONAL).
- pitExit state machine: auto-launch + adaptive merge arc back onto the road,
  crew liability window (no new damage/heat while the crew drives).
- Brake anytime = instant manual takeover during automated exit.

## Previous cycle — Pit Stop QoL (merged)

- Auto-stop assist, mechanic-work audio loop, advance signage suite,
  corridor clearance sweep, AI pit clamp fix.

### Facility layout rework
- **Gas stations: 4 → 2** at `N×0.16` / `N×0.58` — REQUIRED stops. Fuel burn
  is balanced against these two: skipping one strands you before the next.
- **Mechanic shops: 1 → 2** at `N×0.075` / `N×0.47` — OPTIONAL. Clean runs
  never need them; damage/overheat sends you to whichever is next.

### Fully automatic drive-thru flow
- **Entry:** drive into a painted bay lane → kinematic auto-brake → auto-park
  (unchanged from previous cycle).
- **Service:** starts automatically once stopped (conditional: nothing happens
  if the truck is healthy/full).
- **Exit (NEW):** zero input required. The truck LAUNCHES itself out of the
  bay (thrust beats coast drag, ~3.2x accelRate net) and then MERGES back
  onto the highway with an adaptive steering arc that glides onto the asphalt
  just as it reaches merge speed (0.55 of max). Control hands back when
  merged; brake takes over instantly anytime during the exit.
- **Crew liability:** while the crew drives you out, any NEW damage or engine
  heat picked up mid-exit is reverted at hand-back — no unfair wrecks during
  the automated sequence.
- HUD: "AUTO-MERGING BACK TO THE ROAD…" during exit; prompt copy now says
  "FULL SERVICE, AUTO EXIT".

### Tuning notes
- Exit thrust constant matters: anything under ~2.8x accelRate loses to the
  main loop's coast decel and the truck crawls out of the bay forever.
- Merge is adaptive (`latDist/timeToTargetSpeed`) rather than fixed-rate —
  fixed-rate either merges too early (slow handback) or drives down the
  shoulder into uncleared scenery.

### Tests
- Facility counts asserted: exactly 2 shops + 2 stations, 4 bays/signs/guide-lanes.
- New test: drive-thru exit completes within 12s, truck back on asphalt
  (>|0.92|→<1.05 band) at ≥0.35 of max speed.
- Launch-window assertions replaced by exit-state-machine assertions.

## Previous cycle — Pit Stop QoL (merged to main)

### Pit auto-stop assist
- Kinematic auto-brake into bays, auto-park, conditional service, bay-depth
  cells (`pitStopRef`), launch window, "on the lift" pinning during service.
### Mechanic-work audio
- `Sound.updateGarageWork()` air-ratchet loop while parked in a repair bay.
### Wayfinding overhaul
- Amber advance signs (MECHANIC/FUEL × L/R variants) at every stop, guide
  dashes road-edge→bay-mouth, chevrons flip-fixed, side-aware HUD prompts,
  🔧/⛽ icons on the progress strip.
### Root causes fixed
- Shoulder flora/hazards across bay approaches (PIT CORRIDOR CLEARANCE sweep),
  AI offset clamp preventing deep-bay entries, pit-field leaks in reset.

## Shipped in previous cycles (for reference)

- **Scenery updates:** 12 researched landmarks, zone placement fixes, verification tooling (Suite 9).
- **P0 (5/5):** police rebalance, pacing telemetry, persistence layer, strobe safety, dev-toolbar gating
- **P1 (5/5):** rubber-band AI, near-miss bonus, collision differentiation, mirror run + weather variety, repo hygiene
- **P2 (3/3):** gamepad support descoped; mobile control redesign + procedural fallback music shipped
- **Creative picks shipped:** Heat Levels (Felon Mode), REPAIR-O-RAMA shop, fuel economy + gas stations, rival damage model

## Open items

(none — awaiting next review)

Candidate ideas for next cycle:
- Night-only neon variants for Roy's sign & Pike Place (they'd glow beautifully)
- Zone-specific ambient audio beds (sea lions at Monterey, rain at Olympic)
- A few more desert oddities (Cabot's Pueblo Museum, Noah Purifoy's Outdoor Desert Art Museum)
