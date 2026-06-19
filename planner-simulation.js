/** Occupancy → interaction capture estimates for store monitoring layouts. */

import { DEFAULT_PLANNER } from "./planner-artifacts.js";
import {
  buildFixtureZones,
  buildLayoutObstacles,
  CHECKOUT_KINDS,
  GATE_KINDS,
  resolveMovement,
  SHELF_KINDS,
  shopperTouchesFixture,
  SHOPPER_BODY_RADIUS
} from "./planner-collision.js";
import { findStorePath, pathGoalKey } from "./planner-pathfinding.js";

export const SIM_CELL_SIZE = 1;
export const CAMERA_GRID_SPACING = 3;
const AVG_DWELL_MINUTES = 12;
const INTERACTIONS_PER_VISIT = 4.2;
const TRACK_EVENTS_PER_VISIT = 18;
const SHELF_TOUCH_COOLDOWN = 4.5;
const CHECKOUT_PASS_RADIUS = 0.45;
const CHECKOUT_ARRIVAL_RADIUS = 0.95;
const CHECKOUT_OUTSIDE_DISTANCE = 1.05;
const CHECKOUT_SERVICE_MIN = 0.5;
const CHECKOUT_SERVICE_MAX = 1;
const QUEUE_SPACING = 0.92;
const BROWSE_MIN_SECONDS = 1;
const BROWSE_MAX_SECONDS = 90;
const VISIT_MIN_SECONDS = 5;
const VISIT_MAX_SECONDS = 35;
export const SIM_REQUIREMENTS_MESSAGE = "Please add an entrance and checkout to run the simulation.";

export function getSimulationRequirements(layout) {
  const objects = layout?.objects || [];
  const gates = buildFixtureZones(objects, GATE_KINDS);
  const checkouts = buildFixtureZones(objects, CHECKOUT_KINDS);
  const canRun = gates.length > 0 && checkouts.length > 0;
  return {
    canRun,
    gateCount: gates.length,
    checkoutCount: checkouts.length,
    message: canRun ? null : SIM_REQUIREMENTS_MESSAGE
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pointInRotatedRect(x, z, zone) {
  const cx = zone.meters.x;
  const cz = zone.meters.z;
  const hw = zone.meters.w / 2;
  const hd = zone.meters.h / 2;
  const angle = ((zone.angle || 0) * Math.PI) / 180;
  const dx = x - cx;
  const dz = z - cz;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  return Math.abs(lx) <= hw && Math.abs(lz) <= hd;
}

function listCeilingCameras(widthMeters, depthMeters) {
  const cameras = [];
  for (let x = CAMERA_GRID_SPACING / 2; x < widthMeters; x += CAMERA_GRID_SPACING) {
    for (let z = CAMERA_GRID_SPACING / 2; z < depthMeters; z += CAMERA_GRID_SPACING) {
      cameras.push({ x, z });
    }
  }
  return cameras;
}

function cameraCoverageAt(x, z, cameras) {
  const captureRadius = 2.85;
  let best = 0;
  cameras.forEach((cam) => {
    const dist = Math.hypot(x - cam.x, z - cam.z);
    if (dist <= captureRadius) {
      const t = 1 - dist / captureRadius;
      best = Math.max(best, t * t);
    }
  });
  return best;
}

function zoneWeightAt(x, z, zones) {
  let weight = 1;
  zones.forEach((zone) => {
    if (!pointInRotatedRect(x, z, zone)) return;
    if (zone.capability === "track") weight = Math.max(weight, 2.2);
    else if (zone.capability === "interaction") weight = Math.max(weight, zone.kind === "monitor-shelf-zone" ? 3.2 : 2.6);
    else if (zone.capability === "count") weight = Math.max(weight, 1.8);
  });
  return weight;
}

function heatColor(t) {
  const v = clamp(t, 0, 1);
  let r;
  let g;
  let b;
  if (v < 0.25) {
    const u = v / 0.25;
    r = Math.round(30 + u * 20);
    g = Math.round(64 + u * 100);
    b = Math.round(180 - u * 40);
  } else if (v < 0.55) {
    const u = (v - 0.25) / 0.3;
    r = Math.round(50 + u * 180);
    g = Math.round(164 + u * 60);
    b = Math.round(140 - u * 100);
  } else if (v < 0.8) {
    const u = (v - 0.55) / 0.25;
    r = Math.round(230 + u * 25);
    g = Math.round(224 - u * 80);
    b = Math.round(40 - u * 20);
  } else {
    const u = (v - 0.8) / 0.2;
    r = Math.round(255 - u * 20);
    g = Math.round(144 - u * 110);
    b = Math.round(20 + u * 20);
  }
  return [r, g, b];
}

function buildCaptureGrid(w, d, cameras) {
  const cols = Math.max(1, Math.ceil(w / SIM_CELL_SIZE));
  const rows = Math.max(1, Math.ceil(d / SIM_CELL_SIZE));
  const grid = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = (col + 0.5) * SIM_CELL_SIZE;
      const z = (row + 0.5) * SIM_CELL_SIZE;
      if (x > w || z > d) continue;
      grid[row * cols + col] = cameraCoverageAt(x, z, cameras);
    }
  }
  return { cols, rows, grid };
}

function layoutSignature(layout) {
  const zones = layout?.monitoring?.zones || [];
  const objects = layout?.objects || [];
  return `${layout?.widthMeters || 0}x${layout?.heightMeters || 0}:${objects.map((o) => `${o.id}:${o.kind}`).join("|")}:${zones.map((z) => `${z.id}:${z.meters?.x},${z.meters?.z}`).join("|")}`;
}

function outwardFromStoreCenter(checkout, widthMeters, depthMeters) {
  const dx = checkout.cx - widthMeters * 0.5;
  const dz = checkout.cz - depthMeters * 0.5;
  const len = Math.hypot(dx, dz);
  if (len < 0.08) {
    return { x: 0, z: -1 };
  }
  return { x: dx / len, z: dz / len };
}

function queueSlotPosition(checkout, slotIndex, widthMeters, depthMeters) {
  const outward = outwardFromStoreCenter(checkout, widthMeters, depthMeters);
  const dist = slotIndex * QUEUE_SPACING;
  return {
    x: checkout.cx - outward.x * dist,
    z: checkout.cz - outward.z * dist
  };
}

function checkoutOutsidePosition(checkout, widthMeters, depthMeters) {
  const outward = outwardFromStoreCenter(checkout, widthMeters, depthMeters);
  const dist = (checkout.hd || 0.09) + CHECKOUT_OUTSIDE_DISTANCE;
  return {
    x: checkout.cx + outward.x * dist,
    z: checkout.cz + outward.z * dist
  };
}

function hasPassedThroughCheckoutGate(shopper, checkout, widthMeters, depthMeters) {
  if (!checkout) return false;
  const outward = outwardFromStoreCenter(checkout, widthMeters, depthMeters);
  const relX = shopper.x - checkout.cx;
  const relZ = shopper.z - checkout.cz;
  const along = relX * outward.x + relZ * outward.z;
  return along >= checkout.hd + 0.25;
}

function navigateToward(shopper, target, minSpeed = 0.75) {
  const dx = target.x - shopper.x;
  const dz = target.z - shopper.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.08) return dist;
  const speed = Math.max(minSpeed, Math.hypot(shopper.vx, shopper.vz));
  shopper.vx = (dx / dist) * speed;
  shopper.vz = (dz / dist) * speed;
  return dist;
}

/** Animated shoppers with decaying floor heatmap for live simulation. */
export class ShopperSim {
  constructor(layout, count = 24) {
    this.nextShopperId = 1;
    this.checkoutQueues = new Map();
    this.applyLayout(layout);
    this.heat = new Float32Array(this.cols * this.rows);
    this.pixels = new Uint8ClampedArray(this.cols * this.rows * 4);
    this.shoppers = [];
    this.sessionCaptures = 0;
    this.sessionRaw = 0;
    this.sessionEntries = 0;
    this.sessionLeaves = 0;
    this.sessionShelfInteractions = 0;
    this.sessionPaymentInteractions = 0;
    this.targetOccupancy = 0;
    this.elapsed = 0;
    this.setCount(count, { trackEntries: false });
  }

  applyLayout(layout) {
    this.layout = layout;
    this.w = layout?.widthMeters || 20;
    this.d = layout?.heightMeters || 20;
    this.margin = 0.55;
    this.zones = layout?.monitoring?.zones || [];
    const objects = layout?.objects || [];
    const wallThickness = layout?.planner?.wallThicknessMeters ?? DEFAULT_PLANNER.wallThicknessMeters;
    this.obstacles = buildLayoutObstacles(objects, { wallThickness });
    this.gates = buildFixtureZones(objects, GATE_KINDS);
    this.checkouts = buildFixtureZones(objects, CHECKOUT_KINDS);
    this.checkoutIds = new Set(this.checkouts.map((checkout) => checkout.id));
    this.shelves = buildFixtureZones(objects, SHELF_KINDS);
    this.requirements = getSimulationRequirements(layout);
    this.simulationEnabled = this.requirements.canRun;
    this.checkoutQueues = new Map(this.checkouts.map((checkout) => [checkout.id, []]));
    this.cameras = listCeilingCameras(this.w, this.d);
    this.cols = Math.max(1, Math.ceil(this.w / SIM_CELL_SIZE));
    this.rows = Math.max(1, Math.ceil(this.d / SIM_CELL_SIZE));
    const { grid } = buildCaptureGrid(this.w, this.d, this.cameras);
    this.captureGrid = grid;
    this.signature = layoutSignature(layout);
    const cells = this.cols * this.rows;
    if (!this.heat || this.heat.length !== cells) {
      this.heat = new Float32Array(cells);
      this.pixels = new Uint8ClampedArray(cells * 4);
    }
    if (!this.simulationEnabled) {
      this.shoppers = [];
      this.targetOccupancy = 0;
    }
  }

  getStatusMessage() {
    return this.simulationEnabled ? null : this.requirements?.message || SIM_REQUIREMENTS_MESSAGE;
  }

  checkoutById(id) {
    return this.checkouts.find((checkout) => checkout.id === id) || null;
  }

  removeFromCheckoutQueues(shopperId) {
    this.checkoutQueues.forEach((queue, checkoutId) => {
      const index = queue.indexOf(shopperId);
      if (index >= 0) queue.splice(index, 1);
      this.checkoutQueues.set(checkoutId, queue);
    });
  }

  queuePositionFor(shopper) {
    const checkout = this.checkoutById(shopper.assignedCheckoutId);
    if (!checkout) return null;
    const queue = this.checkoutQueues.get(checkout.id) || [];
    const index = queue.indexOf(shopper.id);
    if (index < 0) return { x: checkout.cx, z: checkout.cz };
    return queueSlotPosition(checkout, index, this.w, this.d);
  }

  checkoutExitTarget(checkout) {
    if (!checkout) return null;
    return checkoutOutsidePosition(checkout, this.w, this.d);
  }

  pathContext(excludeIds = null) {
    return {
      widthMeters: this.w,
      depthMeters: this.d,
      margin: this.margin,
      obstacles: this.obstacles,
      excludeIds: excludeIds || new Set()
    };
  }

  pathExcludeIds(shopper) {
    const ids = new Set();
    if ((shopper.state === "checking_out" || shopper.state === "exiting") && shopper.assignedCheckoutId) {
      ids.add(shopper.assignedCheckoutId);
    }
    return ids;
  }

  clearShopperPath(shopper) {
    shopper.pathWaypoints = null;
    shopper.pathIndex = 0;
    shopper.pathGoalKey = null;
    shopper.pathStuckTime = 0;
  }

  ensureShopperPath(shopper, goalX, goalZ, excludeIds) {
    const key = pathGoalKey(goalX, goalZ);
    if (shopper.pathGoalKey === key && shopper.pathWaypoints?.length) return true;
    const path = findStorePath(this.pathContext(excludeIds), shopper.x, shopper.z, goalX, goalZ);
    if (!path?.length) {
      shopper.pathWaypoints = null;
      shopper.pathGoalKey = null;
      return false;
    }
    shopper.pathWaypoints = path;
    shopper.pathIndex = 0;
    shopper.pathGoalKey = key;
    shopper.pathStuckTime = 0;
    return true;
  }

  navigateShopperPath(shopper, goalX, goalZ, excludeIds, minSpeed) {
    const hasPath = this.ensureShopperPath(shopper, goalX, goalZ, excludeIds);
    if (!hasPath || !shopper.pathWaypoints?.length) {
      return navigateToward(shopper, { x: goalX, z: goalZ }, minSpeed);
    }

    while (shopper.pathIndex < shopper.pathWaypoints.length - 1) {
      const waypoint = shopper.pathWaypoints[shopper.pathIndex];
      const waypointDist = Math.hypot(shopper.x - waypoint.x, shopper.z - waypoint.z);
      if (waypointDist < 0.42) shopper.pathIndex += 1;
      else break;
    }

    const target = shopper.pathWaypoints[shopper.pathIndex];
    return navigateToward(shopper, target, minSpeed);
  }

  checkoutLaneBusy(checkoutId) {
    return this.shoppers.some(
      (shopper) =>
        shopper.assignedCheckoutId === checkoutId &&
        (shopper.state === "checking_out" || shopper.state === "exiting")
    );
  }

  dequeueShopper(shopperId, checkoutId) {
    const queue = this.checkoutQueues.get(checkoutId) || [];
    const index = queue.indexOf(shopperId);
    if (index >= 0) queue.splice(index, 1);
    this.checkoutQueues.set(checkoutId, queue);
  }

  promoteCheckoutIfReady() {
    for (const checkout of this.checkouts) {
      const queue = this.checkoutQueues.get(checkout.id) || [];
      if (!queue.length || this.checkoutLaneBusy(checkout.id)) continue;
      const nextId = queue[0];
      const shopper = this.shoppers.find((entry) => entry.id === nextId);
      if (!shopper || shopper.state !== "queuing") continue;
      shopper.state = "checking_out";
      shopper.checkoutReady = false;
      shopper.checkoutServiceRemaining = 0;
      shopper.checkoutWaitRemaining = 6;
      shopper.seekTarget = null;
    }
  }

  matchesLayout(layout) {
    return this.signature === layoutSignature(layout);
  }

  setCount(count, { trackEntries = true } = {}) {
    if (!this.simulationEnabled) {
      this.targetOccupancy = 0;
      this.shoppers = [];
      this.checkoutQueues = new Map(this.checkouts.map((checkout) => [checkout.id, []]));
      return;
    }
    const target = clamp(Math.round(Number(count) || 0), 0, 120);
    this.targetOccupancy = target;
    while (this.shoppers.length < target) {
      const spawned = this.spawnShopper({ atEntrance: true, countEntry: trackEntries });
      if (!spawned) break;
      this.shoppers.push(spawned);
    }
    while (this.shoppers.length > target) {
      const shopper = this.shoppers.pop();
      if (shopper) this.removeFromCheckoutQueues(shopper.id);
      if (trackEntries && shopper && (shopper.state === "shopping" || shopper.state === "browsing" || shopper.state === "queuing" || shopper.state === "checking_out")) {
        this.sessionLeaves += 1;
      }
    }
  }

  pickGate() {
    if (!this.gates.length) return null;
    return this.gates[Math.floor(Math.random() * this.gates.length)];
  }

  pickGateSpawn(gate) {
    const offsetX = (Math.random() * 2 - 1) * gate.hw * 0.55;
    const spawnZ = Math.max(0.15, gate.cz - gate.hd - 0.55);
    return {
      x: clamp(gate.cx + offsetX, this.margin, this.w - this.margin),
      z: spawnZ
    };
  }

  pickGateEntryTarget(gate) {
    const pastCheckout = this.checkouts.length
      ? Math.max(...this.checkouts.map((checkout) => checkout.cz)) + 0.35
      : gate.cz + gate.hd + 1.0;
    return {
      x: gate.cx,
      z: clamp(pastCheckout, this.margin + 0.9, this.d - this.margin)
    };
  }

  obstaclesForShopper(shopper) {
    if (shopper.state === "entering") {
      return this.obstacles.filter((obs) => !this.checkoutIds.has(obs.id));
    }
    if ((shopper.state === "checking_out" || shopper.state === "exiting") && shopper.assignedCheckoutId) {
      return this.obstacles.filter((obs) => obs.id !== shopper.assignedCheckoutId);
    }
    return this.obstacles;
  }

  pickCheckout() {
    if (!this.checkouts.length) return null;
    let best = this.checkouts[0];
    let bestLen = (this.checkoutQueues.get(best.id) || []).length;
    for (const checkout of this.checkouts) {
      const len = (this.checkoutQueues.get(checkout.id) || []).length;
      if (len < bestLen) {
        best = checkout;
        bestLen = len;
      }
    }
    return best;
  }

  pickRandomShelf() {
    if (!this.shelves.length) return null;
    return this.shelves[Math.floor(Math.random() * this.shelves.length)];
  }

  randomBrowseDuration() {
    return BROWSE_MIN_SECONDS + Math.random() * (BROWSE_MAX_SECONDS - BROWSE_MIN_SECONDS);
  }

  randomVisitDuration() {
    return VISIT_MIN_SECONDS + Math.random() * (VISIT_MAX_SECONDS - VISIT_MIN_SECONDS);
  }

  beginCheckout(shopper) {
    const checkout = this.pickCheckout();
    if (!checkout) return false;
    shopper.assignedCheckoutId = checkout.id;
    shopper.state = "queuing";
    shopper.seekTarget = null;
    shopper.browsingShelfId = null;
    this.clearShopperPath(shopper);
    const queue = this.checkoutQueues.get(checkout.id) || [];
    queue.push(shopper.id);
    this.checkoutQueues.set(checkout.id, queue);
    return true;
  }

  pickInsidePoint() {
    return {
      x: this.margin + Math.random() * Math.max(0.5, this.w - this.margin * 2),
      z: this.margin + 1.8 + Math.random() * Math.max(0.5, this.d - this.margin * 2 - 1.8)
    };
  }

  spawnShopper({ atEntrance = false, countEntry = false } = {}) {
    const speed = 0.65 + Math.random() * 0.85;
    let point;
    let enterTarget = null;
    let gate = null;

    if (atEntrance) {
      gate = this.pickGate();
      if (!gate) return null;
      point = this.pickGateSpawn(gate);
      enterTarget = this.pickGateEntryTarget(gate);
    } else {
      point = this.pickInsidePoint();
    }

    const angle = enterTarget
      ? Math.atan2(enterTarget.x - point.x, enterTarget.z - point.z)
      : Math.random() * Math.PI * 2;

    return {
      id: this.nextShopperId++,
      x: point.x,
      z: point.z,
      vx: Math.sin(angle) * speed,
      vz: Math.cos(angle) * speed,
      wander: 1 + Math.random() * 2.5,
      state: atEntrance ? "entering" : "shopping",
      enterTarget,
      gate,
      assignedCheckoutId: null,
      seekTarget: null,
      exitTarget: null,
      browsingShelfId: null,
      browseRemaining: 0,
      visitRemaining: this.randomVisitDuration(),
      checkoutServiceRemaining: 0,
      checkoutWaitRemaining: 0,
      checkoutReady: false,
      shelfCooldowns: {},
      pathWaypoints: null,
      pathIndex: 0,
      pathGoalKey: null,
      pathStuckTime: 0,
      entryCounted: !countEntry
    };
  }

  randomize() {
    if (!this.simulationEnabled) {
      this.shoppers = [];
      this.checkoutQueues = new Map(this.checkouts.map((checkout) => [checkout.id, []]));
      this.sessionCaptures = 0;
      this.sessionRaw = 0;
      this.sessionEntries = 0;
      this.sessionLeaves = 0;
      this.sessionShelfInteractions = 0;
      this.sessionPaymentInteractions = 0;
      this.elapsed = 0;
      return;
    }
    this.heat.fill(0);
    this.sessionCaptures = 0;
    this.sessionRaw = 0;
    this.sessionEntries = 0;
    this.sessionLeaves = 0;
    this.sessionShelfInteractions = 0;
    this.sessionPaymentInteractions = 0;
    this.elapsed = 0;
    this.checkoutQueues = new Map(this.checkouts.map((checkout) => [checkout.id, []]));
    const count = this.targetOccupancy || this.shoppers.length;
    this.shoppers = [];
    this.setCount(count, { trackEntries: false });
  }

  splatHeat(x, z, amount) {
    const col = Math.floor(x / SIM_CELL_SIZE);
    const row = Math.floor(z / SIM_CELL_SIZE);
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const c = col + dc;
        const r = row + dr;
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
        const weight = dc === 0 && dr === 0 ? 1 : 0.42;
        const idx = r * this.cols + c;
        const capture = this.captureGrid[idx] || 0;
        this.heat[idx] += amount * weight * (0.35 + capture * 0.65);
      }
    }
  }

  tryBeginBrowsing(shopper) {
    if (shopper.state !== "shopping") return false;
    for (const shelf of this.shelves) {
      const remaining = shopper.shelfCooldowns[shelf.id] || 0;
      if (remaining > 0) continue;
      if (!shopperTouchesFixture(shopper.x, shopper.z, SHOPPER_BODY_RADIUS, shelf)) continue;
      shopper.state = "browsing";
      shopper.browsingShelfId = shelf.id;
      shopper.browseRemaining = this.randomBrowseDuration();
      shopper.seekTarget = null;
      shopper.vx = 0;
      shopper.vz = 0;
      shopper.shelfCooldowns[shelf.id] = SHELF_TOUCH_COOLDOWN + Math.random() * 2;
      this.sessionShelfInteractions += 1;
      this.clearShopperPath(shopper);
      return true;
    }
    return false;
  }

  stepShopperIntent(shopper, stepDt) {
    if (shopper.state === "entering" && shopper.enterTarget) {
      const dist = navigateToward(shopper, shopper.enterTarget, 0.75);
      if (dist < 0.5 || shopper.z >= shopper.enterTarget.z - 0.12) {
        shopper.state = "shopping";
        shopper.enterTarget = null;
        shopper.visitRemaining = this.randomVisitDuration();
        this.clearShopperPath(shopper);
        if (!shopper.entryCounted) {
          shopper.entryCounted = true;
          this.sessionEntries += 1;
        }
      }
      return;
    }

    if (shopper.state === "browsing") {
      shopper.browseRemaining -= stepDt;
      shopper.visitRemaining -= stepDt;
      if (shopper.browseRemaining <= 0) {
        shopper.state = "shopping";
        shopper.browsingShelfId = null;
        shopper.wander = 0.4 + Math.random() * 1.2;
        this.clearShopperPath(shopper);
      }
      return;
    }

    if (shopper.state === "shopping") {
      shopper.visitRemaining -= stepDt;
      if (shopper.visitRemaining <= 0) {
        this.beginCheckout(shopper);
        return;
      }

      if (shopper.seekTarget) {
        const dist = this.navigateShopperPath(
          shopper,
          shopper.seekTarget.x,
          shopper.seekTarget.z,
          new Set(),
          0.7
        );
        if (dist < 0.55) {
          shopper.seekTarget = null;
          this.clearShopperPath(shopper);
          this.tryBeginBrowsing(shopper);
        }
      } else {
        shopper.wander -= stepDt;
        if (shopper.wander <= 0) {
          const shelf = this.shelves.length && Math.random() < 0.62 ? this.pickRandomShelf() : null;
          if (shelf) {
            shopper.seekTarget = { x: shelf.cx, z: shelf.cz };
            shopper.wander = 2 + Math.random() * 3;
            this.clearShopperPath(shopper);
          } else {
            const speed = Math.hypot(shopper.vx, shopper.vz) || 0.9;
            const angle = Math.random() * Math.PI * 2;
            shopper.vx = Math.sin(angle) * speed;
            shopper.vz = Math.cos(angle) * speed;
            shopper.wander = 1.2 + Math.random() * 2.8;
          }
        }
      }

      if (shopper.state === "shopping") {
        this.tryBeginBrowsing(shopper);
      }
      return;
    }

    if (shopper.state === "queuing") {
      const slot = this.queuePositionFor(shopper);
      if (slot) {
        const dist = this.navigateShopperPath(shopper, slot.x, slot.z, new Set(), 0.65);
        if (dist < 0.35) {
          shopper.vx *= 0.2;
          shopper.vz *= 0.2;
        }
      }
      return;
    }

    if (shopper.state === "checking_out") {
      const checkout = this.checkoutById(shopper.assignedCheckoutId);
      const excludeIds = this.pathExcludeIds(shopper);
      if (checkout) {
        const dist = this.navigateShopperPath(shopper, checkout.cx, checkout.cz, excludeIds, 0.55);
        if (dist < CHECKOUT_ARRIVAL_RADIUS) {
          shopper.vx = 0;
          shopper.vz = 0;
          if (!shopper.checkoutReady) {
            shopper.checkoutReady = true;
            shopper.checkoutServiceRemaining =
              CHECKOUT_SERVICE_MIN + Math.random() * (CHECKOUT_SERVICE_MAX - CHECKOUT_SERVICE_MIN);
          }
          shopper.checkoutServiceRemaining -= stepDt;
        } else {
          shopper.checkoutWaitRemaining = Math.max(0, (shopper.checkoutWaitRemaining || 0) - stepDt);
          if (shopper.checkoutWaitRemaining <= 0) {
            shopper.checkoutReady = true;
            shopper.checkoutServiceRemaining =
              CHECKOUT_SERVICE_MIN + Math.random() * (CHECKOUT_SERVICE_MAX - CHECKOUT_SERVICE_MIN);
            shopper.checkoutServiceRemaining -= stepDt;
          }
        }
      }
      if (shopper.checkoutReady && shopper.checkoutServiceRemaining <= 0) {
        this.sessionPaymentInteractions += 1;
        shopper.state = "exiting";
        shopper.exitTarget = this.checkoutExitTarget(checkout);
        this.clearShopperPath(shopper);
        shopper.vx = 0;
        shopper.vz = 0;
        if (shopper.assignedCheckoutId) {
          this.dequeueShopper(shopper.id, shopper.assignedCheckoutId);
        }
      }
      return;
    }

    if (shopper.state === "exiting") {
      const checkout = this.checkoutById(shopper.assignedCheckoutId);
      const excludeIds = this.pathExcludeIds(shopper);
      const exitTarget =
        shopper.exitTarget || this.checkoutExitTarget(checkout) || { x: this.w / 2, z: Math.max(this.margin, this.d * 0.08) };
      const dist = this.navigateShopperPath(shopper, exitTarget.x, exitTarget.z, excludeIds, 0.95);
      const passedGate = hasPassedThroughCheckoutGate(shopper, checkout, this.w, this.d);
      if (dist < CHECKOUT_PASS_RADIUS || passedGate) {
        this.sessionLeaves += 1;
        this.removeFromCheckoutQueues(shopper.id);
        shopper.remove = true;
      }
    }
  }

  step(dt) {
    if (!this.simulationEnabled) return;

    const stepDt = clamp(dt, 0.001, 0.05);
    this.elapsed += stepDt;
    const decay = Math.pow(0.935, stepDt * 60);
    for (let i = 0; i < this.heat.length; i += 1) this.heat[i] *= decay;

    this.promoteCheckoutIfReady();

    const nextShoppers = [];

    this.shoppers.forEach((shopper) => {
      this.stepShopperIntent(shopper, stepDt);

      if (shopper.remove) return;

      Object.keys(shopper.shelfCooldowns).forEach((shelfId) => {
        shopper.shelfCooldowns[shelfId] -= stepDt;
        if (shopper.shelfCooldowns[shelfId] <= 0) delete shopper.shelfCooldowns[shelfId];
      });

      const moving = shopper.state !== "browsing";

      if (moving) {
        const prevX = shopper.x;
        const prevZ = shopper.z;
        shopper.x += shopper.vx * stepDt;
        shopper.z += shopper.vz * stepDt;

        const collisionOpts =
          (shopper.state === "exiting" || shopper.state === "checking_out") && shopper.assignedCheckoutId
            ? { excludeId: shopper.assignedCheckoutId }
            : {};
        const resolved = resolveMovement(
          prevX,
          prevZ,
          shopper.x,
          shopper.z,
          SHOPPER_BODY_RADIUS,
          this.obstaclesForShopper(shopper),
          collisionOpts
        );
        shopper.x = resolved.x;
        shopper.z = resolved.z;

        if (shopper.pathWaypoints?.length) {
          const movedDist = Math.hypot(shopper.x - prevX, shopper.z - prevZ);
          if (movedDist < 0.012) {
            shopper.pathStuckTime = (shopper.pathStuckTime || 0) + stepDt;
            if (shopper.pathStuckTime > 0.75) {
              shopper.pathGoalKey = null;
              shopper.pathStuckTime = 0;
            }
          } else {
            shopper.pathStuckTime = 0;
          }
        }
      }

      if (shopper.state === "shopping" || shopper.state === "browsing" || shopper.state === "queuing") {
        if (shopper.x < this.margin) {
          shopper.x = this.margin;
          shopper.vx = Math.abs(shopper.vx);
        } else if (shopper.x > this.w - this.margin) {
          shopper.x = this.w - this.margin;
          shopper.vx = -Math.abs(shopper.vx);
        }
        if (shopper.z < this.margin + 0.3 && shopper.state === "shopping") {
          shopper.z = this.margin + 0.3;
          shopper.vz = Math.abs(shopper.vz);
        } else if (shopper.z > this.d - this.margin) {
          shopper.z = this.d - this.margin;
          shopper.vz = -Math.abs(shopper.vz);
        }
      }

      const zoneW = zoneWeightAt(shopper.x, shopper.z, this.zones);
      const capture = cameraCoverageAt(shopper.x, shopper.z, this.cameras);
      this.splatHeat(shopper.x, shopper.z, stepDt * zoneW * 2.4);

      const inInteraction = this.zones.some(
        (zone) => zone.capability === "interaction" && pointInRotatedRect(shopper.x, shopper.z, zone)
      );
      if (inInteraction) {
        this.sessionRaw += stepDt * 0.75;
        this.sessionCaptures += stepDt * 0.75 * capture * clamp(0.35 + zoneW * 0.12, 0.15, 0.95);
      }

      nextShoppers.push(shopper);
    });

    this.shoppers = nextShoppers;

    while (this.shoppers.length < this.targetOccupancy) {
      const spawned = this.spawnShopper({ atEntrance: true, countEntry: true });
      if (spawned) this.shoppers.push(spawned);
      else break;
    }
  }

  getShopperPositions() {
    return this.shoppers.map((shopper) => ({
      x: shopper.x,
      z: shopper.z,
      angle: Math.atan2(shopper.vx, shopper.vz)
    }));
  }

  getHeatmap() {
    let max = 0.001;
    const combined = new Float32Array(this.heat.length);
    for (let i = 0; i < this.heat.length; i += 1) {
      combined[i] = this.heat[i] * (0.25 + (this.captureGrid[i] || 0) * 0.75);
      max = Math.max(max, combined[i]);
    }
    for (let i = 0; i < combined.length; i += 1) {
      const norm = combined[i] / max;
      const [r, g, b] = heatColor(norm);
      const o = i * 4;
      this.pixels[o] = r;
      this.pixels[o + 1] = g;
      this.pixels[o + 2] = b;
      this.pixels[o + 3] = norm > 0.02 ? 210 : 0;
    }
    return {
      cols: this.cols,
      rows: this.rows,
      cellSize: SIM_CELL_SIZE,
      widthMeters: this.w,
      depthMeters: this.d,
      pixels: this.pixels
    };
  }

  getLiveMetrics() {
    const hourly = this.elapsed > 0.5 ? 3600 / this.elapsed : 0;
    const inStoreStates = new Set(["entering", "shopping", "browsing", "queuing", "checking_out"]);
    return {
      elapsed: this.elapsed,
      simulationEnabled: this.simulationEnabled,
      statusMessage: this.getStatusMessage(),
      shopperCount: this.shoppers.length,
      peopleInside: this.shoppers.filter((shopper) => inStoreStates.has(shopper.state)).length,
      queueLength: Array.from(this.checkoutQueues.values()).reduce((sum, queue) => sum + queue.length, 0),
      sessionEntries: this.sessionEntries,
      sessionExits: this.sessionLeaves,
      sessionLeaves: this.sessionLeaves,
      sessionShelfInteractions: this.sessionShelfInteractions,
      sessionPaymentInteractions: this.sessionPaymentInteractions,
      entriesPerHour: Math.round(this.sessionEntries * hourly),
      exitsPerHour: Math.round(this.sessionLeaves * hourly),
      leavesPerHour: Math.round(this.sessionLeaves * hourly),
      shelfInteractionsPerHour: Math.round(this.sessionShelfInteractions * hourly),
      paymentInteractionsPerHour: Math.round(this.sessionPaymentInteractions * hourly),
      sessionCaptures: Math.round(this.sessionCaptures),
      sessionRaw: Math.round(this.sessionRaw),
      liveCapturedPerHour: Math.round(this.sessionCaptures * hourly),
      liveRawPerHour: Math.round(this.sessionRaw * hourly)
    };
  }
}

/**
 * @param {object} layout - planner layout snapshot
 * @param {number} concurrentShoppers - people in store at once
 */
export function computeStoreSimulation(layout, concurrentShoppers = 24) {
  const w = layout?.widthMeters || 20;
  const d = layout?.heightMeters || 20;
  const occupancy = clamp(Math.round(Number(concurrentShoppers) || 0), 0, 500);
  const zones = layout?.monitoring?.zones || [];
  const interactionZones = zones.filter((z) => z.capability === "interaction");
  const trackZones = zones.filter((z) => z.capability === "track");
  const countZones = zones.filter((z) => z.capability === "count");

  const cols = Math.max(1, Math.ceil(w / SIM_CELL_SIZE));
  const rows = Math.max(1, Math.ceil(d / SIM_CELL_SIZE));
  const cameras = listCeilingCameras(w, d);
  const storeArea = Math.max(1, w * d);

  const captureValues = new Float32Array(cols * rows);
  const activityValues = new Float32Array(cols * rows);
  const combinedValues = new Float32Array(cols * rows);

  let coveredCells = 0;
  let interactionZoneCells = 0;
  let captureSum = 0;
  let activitySum = 0;
  let interactionCaptureSum = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = (col + 0.5) * SIM_CELL_SIZE;
      const z = (row + 0.5) * SIM_CELL_SIZE;
      if (x > w || z > d) continue;

      const idx = row * cols + col;
      const capture = cameraCoverageAt(x, z, cameras);
      const zoneW = zoneWeightAt(x, z, zones);
      const density = occupancy / storeArea;
      const activity = density * zoneW * (0.35 + capture * 0.65);

      captureValues[idx] = capture;
      activityValues[idx] = activity;
      combinedValues[idx] = activity * (0.25 + capture * 0.75);

      captureSum += capture;
      activitySum += activity;
      if (capture >= 0.28) coveredCells += 1;
      if (interactionZones.some((zone) => pointInRotatedRect(x, z, zone))) {
        interactionZoneCells += 1;
        interactionCaptureSum += capture;
      }
    }
  }

  const cellCount = cols * rows;
  const meanCapture = cellCount ? captureSum / cellCount : 0;
  const meanActivity = cellCount ? activitySum / cellCount : 0;
  const interactionZoneCapture = interactionZoneCells ? interactionCaptureSum / interactionZoneCells : meanCapture;

  let maxCombined = 0.001;
  for (let i = 0; i < combinedValues.length; i += 1) {
    maxCombined = Math.max(maxCombined, combinedValues[i]);
  }
  for (let i = 0; i < combinedValues.length; i += 1) {
    combinedValues[i] /= maxCombined;
  }

  const hourlyTurnover = occupancy * (60 / AVG_DWELL_MINUTES);
  const rawInteractionsPerHour = hourlyTurnover * INTERACTIONS_PER_VISIT;
  const captureRate = clamp(interactionZoneCapture * 0.55 + meanCapture * 0.45, 0.08, 0.98);
  const capturedInteractionsPerHour = rawInteractionsPerHour * captureRate;

  const interactionArea = interactionZones.reduce((sum, zone) => sum + zone.meters.w * zone.meters.h, 0);
  const shelfShare = interactionZones.filter((z) => z.kind === "monitor-shelf-zone").length / Math.max(1, interactionZones.length);
  const shelfInteractionsPerHour = capturedInteractionsPerHour * (interactionZones.length ? shelfShare : 0.55);
  const engagementInteractionsPerHour = capturedInteractionsPerHour - shelfInteractionsPerHour;

  const trackingEventsPerHour = hourlyTurnover * TRACK_EVENTS_PER_VISIT * clamp(meanCapture * 1.1, 0.1, 1);
  const countAccuracyPct = clamp(72 + countZones.length * 8 + meanCapture * 18, 0, 99);

  const zoneBreakdown = zones.map((zone) => {
    const area = zone.meters.w * zone.meters.h;
    let samples = 0;
    let localCapture = 0;
    let localActivity = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = (col + 0.5) * SIM_CELL_SIZE;
        const z = (row + 0.5) * SIM_CELL_SIZE;
        if (!pointInRotatedRect(x, z, zone)) continue;
        const idx = row * cols + col;
        samples += 1;
        localCapture += captureValues[idx];
        localActivity += activityValues[idx];
      }
    }
    const avgCapture = samples ? localCapture / samples : 0;
    const avgActivity = samples ? localActivity / samples : 0;
    let expectedPerHour = 0;
    if (zone.capability === "interaction") {
      expectedPerHour = capturedInteractionsPerHour * (area / Math.max(1, interactionArea || storeArea * 0.25));
    } else if (zone.capability === "track") {
      expectedPerHour = trackingEventsPerHour * (area / Math.max(1, storeArea * 0.4));
    } else if (zone.capability === "count") {
      expectedPerHour = hourlyTurnover;
    }
    return {
      id: zone.id,
      label: zone.label,
      kind: zone.kind,
      capability: zone.capability,
      areaSqm: Number(area.toFixed(1)),
      capturePct: Math.round(avgCapture * 100),
      activityIndex: Number(avgActivity.toFixed(3)),
      expectedPerHour: Math.round(expectedPerHour)
    };
  });

  const pixels = new Uint8ClampedArray(cols * rows * 4);
  for (let i = 0; i < combinedValues.length; i += 1) {
    const [r, g, b] = heatColor(combinedValues[i]);
    const o = i * 4;
    pixels[o] = r;
    pixels[o + 1] = g;
    pixels[o + 2] = b;
    pixels[o + 3] = combinedValues[i] > 0.02 ? 210 : 0;
  }

  return {
    occupancy,
    storeAreaSqm: storeArea,
    cameraCount: cameras.length,
    zoneCount: zones.length,
    entriesPerHour: Math.round(hourlyTurnover),
    exitsPerHour: Math.round(hourlyTurnover),
    coveragePct: Math.round((coveredCells / cellCount) * 100),
    captureRatePct: Math.round(captureRate * 100),
    rawInteractionsPerHour: Math.round(rawInteractionsPerHour),
    capturedInteractionsPerHour: Math.round(capturedInteractionsPerHour),
    shelfInteractionsPerHour: Math.round(shelfInteractionsPerHour),
    engagementInteractionsPerHour: Math.round(engagementInteractionsPerHour),
    trackingEventsPerHour: Math.round(trackingEventsPerHour),
    countAccuracyPct: Math.round(countAccuracyPct),
    meanActivityIndex: Number(meanActivity.toFixed(3)),
    heatmap: {
      cols,
      rows,
      cellSize: SIM_CELL_SIZE,
      widthMeters: w,
      depthMeters: d,
      pixels,
      maxValue: maxCombined
    },
    zoneBreakdown
  };
}
