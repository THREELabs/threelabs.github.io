# One-way Cougar Ridge routing

- Technical route: trailhead to summit only.
- Express route: enter near the summit, travel toward highway only.
- Summit clearing remains free-roam; at most 2m of accumulated rollback inside a route permits rock-crawl repositioning. Wrong-end portals allow no rollback.
- Enforcement compares actual horizontal displacement against world-space spline tangents; reverse gear and lateral slip do not bypass direction checks.
- Projection uses elevation to distinguish nearby overlapping routes. Test the complete final hairpin before exempting the summit, otherwise the approach projects onto an earlier uphill segment.
- Legacy saves already on the descent may finish downhill; no new save schema or dependency on the summit movie unlock.
- Roadside signs and throttled HUD warnings explain blocked movement. No physical drop arms were added: they would misleadingly block legal outbound traffic without additional animation/collision logic.

## Verification
`node scripts/test_one_way_trails.mjs` against local Vite on port 5173:
600-step legal ascent and descent, combined loop, wrong portals, mid-route turnarounds, side-entry rejection, summit admission, and actual VehiclePhysics.update reverse-gear blocking. Uses Chrome/Playwright. Build: `npm run build`.

## Entrance regression
The original portals were 5.13m apart: centerline tests passed but all three highway approaches hit the descent boundary. The lower descent now ends at routeZ 960 (trailhead 1010), giving 50.85m world-space separation. Terrain/query bounds follow the relocated route. Rejected drivers may retreat toward the highway without unlocking uphill travel. Direction blocks suppress misleading gear alerts.

Regression coverage includes highway approaches at center and ±5m, actual LOW-gear VehiclePhysics movement across the apron, exit retreat/rejection, and portal spacing. All three vehicle approaches travel >19m without direction or terminal gear warnings. Always test approach transitions, not only spline-center traversal.

## Scope
This is a gameplay direction rule, not an anti-cheat checkpoint system. Debug teleporting or leaving the authored routes is not proof of completing every section. Asset appearance and a full manually driven lap still warrant player review.
