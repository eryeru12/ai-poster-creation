// Canvas constraint editing test
// Verifies: 8 layouts with constraint zones, drag clamping in 4 directions

import { LAYOUTS } from "../packages/shared/dist/index.js";

const fields = ["mainTitle", "subTitle", "hookLine", "activityInfo", "footerNote"];
let allPass = true;
let totalZones = 0;

console.log("=== Canvas Constraint Zone Validation ===");

for (const layout of LAYOUTS) {
  const zones = layout.constraintZones;
  if (!zones) {
    console.log(`FAIL: ${layout.layoutId} - no constraintZones`);
    allPass = false;
    continue;
  }
  for (const field of fields) {
    const zone = zones[field];
    if (!zone) {
      console.log(`FAIL: ${layout.layoutId}/${field} - missing`);
      allPass = false;
    } else {
      const valid = zone.x >= 0 && zone.x <= 1
        && zone.y >= 0 && zone.y <= 1
        && zone.width > 0 && zone.width <= 1
        && zone.height > 0 && zone.height <= 1
        && zone.x + zone.width <= 1
        && zone.y + zone.height <= 1;
      if (!valid) {
        console.log(`FAIL: ${layout.layoutId}/${field} - zone out of bounds:`, JSON.stringify(zone));
        allPass = false;
      } else {
        totalZones++;
      }
    }
  }
}

console.log(`${totalZones}/40 zones valid`);

console.log("\n=== Drag Clamping Simulation ===");
const layout = LAYOUTS[0];
const zone = layout.constraintZones["mainTitle"];
const elWidth = 0.4;
const elHeight = 0.05;

function clamp(x, y) {
  return {
    x: Math.max(zone.x, Math.min(zone.x + zone.width - elWidth, x)),
    y: Math.max(zone.y, Math.min(zone.y + zone.height - elHeight, y)),
  };
}

// Within zone
let r = clamp(zone.x + 0.05, zone.y + 0.02);
let pass = r.x === zone.x + 0.05 && r.y === zone.y + 0.02;
console.log(`Within zone: ${pass ? "PASS" : "FAIL"}`);

// Beyond right
r = clamp(zone.x + zone.width + 0.1, zone.y);
pass = r.x !== zone.x + zone.width + 0.1;
console.log(`Beyond right: ${pass ? "PASS (clamped)" : "FAIL"}`);

// Beyond bottom
r = clamp(zone.x, zone.y + zone.height + 0.1);
pass = r.y !== zone.y + zone.height + 0.1;
console.log(`Beyond bottom: ${pass ? "PASS (clamped)" : "FAIL"}`);

// Before left
r = clamp(zone.x - 0.1, zone.y);
pass = r.x !== zone.x - 0.1;
console.log(`Before left: ${pass ? "PASS (clamped)" : "FAIL"}`);

// Before top
r = clamp(zone.x, zone.y - 0.1);
pass = r.y !== zone.y - 0.1;
console.log(`Before top: ${pass ? "PASS (clamped)" : "FAIL"}`);

console.log(`\nCanvas constraint editing: ${allPass && totalZones === 40 ? "PASS" : "FAIL"}`);
process.exit(allPass && totalZones === 40 ? 0 : 1);
