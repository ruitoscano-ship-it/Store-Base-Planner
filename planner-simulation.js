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

export const SIM_CELL_SIZE = 1;
export const CAMERA_GRID_SPACING = 3;
const AVG_DWELL_MINUTES = 12;
const INTERACTIONS_PER_VISIT = 4.2;
const TRACK_EVENTS_PER_VISIT = 18;
const SHELF_TOUCH_COOLDOWN = 4.5;
const CHECKOUT_PASS_RADIUS = 0.58;

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

/** Animated shoppers with decaying floor heatmap for live simulation. */
export class ShopperSim {
  constructor(layout, count = 24) {
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
  }

  matchesLayout(layout) {
    return this.signature === layoutSignature(layout);
  }

  setCount(count, { trackEntries = true } = {}) {
    const target = clamp(Math.round(Number(count) || 0), 0, 120);
    this.targetOccupancy = target;
    while (this.shoppers.length < target) {
      this.shoppers.push(this.spawnShopper({ atEntrance: true, countEntry: trackEntries }));
    }
    while (this.shoppers.length > target) {
      const shopper = this.shoppers.pop();
      if (trackEntries && shopper && (shopper.state === "inside" || shopper.state === "leaving")) {
        this.sessionLeaves += 1;
      }
    }
  }

  pickGate() {
    if (this.gates.length) {
      return this.gates[Math.floor(Math.random() * this.gates.length)];
    }
    return {
      id: "default-gate",
      cx: this.w / 2,
      cz: Math.min(1.4, this.d * 0.12),
      hw: Math.min(2.25, this.w * 0.22),
      hd: 0.6,
      angle: 0
    };
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
    if (shopper.state === "leaving" && shopper.exitCheckoutId) {
      return this.obstacles.filter((obs) => obs.id !== shopper.exitCheckoutId);
    }
    return this.obstacles;
  }

  pickCheckoutTarget() {
    if (!this.checkouts.length) {
      return {
        id: null,
        x: this.w / 2,
        z: Math.min(2.2, this.d * 0.18)
      };
    }
    const checkout = this.checkouts[Math.floor(Math.random() * this.checkouts.length)];
    return { id: checkout.id, x: checkout.cx, z: checkout.cz };
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
      point = this.pickGateSpawn(gate);
      enterTarget = this.pickGateEntryTarget(gate);
    } else {
      point = this.pickInsidePoint();
    }

    const angle = enterTarget
      ? Math.atan2(enterTarget.x - point.x, enterTarget.z - point.z)
      : Math.random() * Math.PI * 2;

    return {
      x: point.x,
      z: point.z,
      vx: Math.sin(angle) * speed,
      vz: Math.cos(angle) * speed,
      wander: 1 + Math.random() * 2.5,
      state: atEntrance ? "entering" : "inside",
      enterTarget,
      gate,
      exitTarget: null,
      exitCheckoutId: null,
      remainingDwell: 25 + Math.random() * 55,
      shelfCooldowns: {},
      entryCounted: !countEntry
    };
  }

  randomize() {
    this.heat.fill(0);
    this.sessionCaptures = 0;
    this.sessionRaw = 0;
    this.sessionEntries = 0;
    this.sessionLeaves = 0;
    this.sessionShelfInteractions = 0;
    this.sessionPaymentInteractions = 0;
    this.elapsed = 0;
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

  trackShelfTouches(shopper, stepDt) {
    if (shopper.state !== "inside") return;

    for (const shelf of this.shelves) {
      const remaining = shopper.shelfCooldowns[shelf.id] || 0;
      if (remaining > 0) {
        shopper.shelfCooldowns[shelf.id] = remaining - stepDt;
        continue;
      }
      if (!shopperTouchesFixture(shopper.x, shopper.z, SHOPPER_BODY_RADIUS, shelf)) continue;
      shopper.shelfCooldowns[shelf.id] = SHELF_TOUCH_COOLDOWN + Math.random() * 2;
      this.sessionShelfInteractions += 1;
    }
  }

  step(dt) {
    const stepDt = clamp(dt, 0.001, 0.05);
    this.elapsed += stepDt;
    const decay = Math.pow(0.935, stepDt * 60);
    for (let i = 0; i < this.heat.length; i += 1) this.heat[i] *= decay;

    const nextShoppers = [];

    this.shoppers.forEach((shopper) => {
      if (shopper.state === "entering" && shopper.enterTarget) {
        const dx = shopper.enterTarget.x - shopper.x;
        const dz = shopper.enterTarget.z - shopper.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.5 || shopper.z >= shopper.enterTarget.z - 0.12) {
          shopper.state = "inside";
          shopper.enterTarget = null;
          shopper.remainingDwell = 25 + Math.random() * 55;
          if (!shopper.entryCounted) {
            shopper.entryCounted = true;
            this.sessionEntries += 1;
          }
        } else {
          const speed = Math.max(0.75, Math.hypot(shopper.vx, shopper.vz));
          shopper.vx = (dx / dist) * speed;
          shopper.vz = (dz / dist) * speed;
        }
      } else if (shopper.state === "leaving" && shopper.exitTarget) {
        const dx = shopper.exitTarget.x - shopper.x;
        const dz = shopper.exitTarget.z - shopper.z;
        const dist = Math.hypot(dx, dz);
        if (dist < CHECKOUT_PASS_RADIUS) {
          this.sessionPaymentInteractions += 1;
          this.sessionLeaves += 1;
          return;
        }
        const speed = Math.max(0.85, Math.hypot(shopper.vx, shopper.vz));
        shopper.vx = (dx / dist) * speed;
        shopper.vz = (dz / dist) * speed;
      } else if (shopper.state === "inside") {
        shopper.remainingDwell -= stepDt;
        if (shopper.remainingDwell <= 0) {
          const checkout = this.pickCheckoutTarget();
          shopper.state = "leaving";
          shopper.exitTarget = { x: checkout.x, z: checkout.z };
          shopper.exitCheckoutId = checkout.id;
        } else {
          shopper.wander -= stepDt;
          if (shopper.wander <= 0) {
            const speed = Math.hypot(shopper.vx, shopper.vz) || 0.9;
            const angle = Math.random() * Math.PI * 2;
            shopper.vx = Math.sin(angle) * speed;
            shopper.vz = Math.cos(angle) * speed;
            shopper.wander = 1.2 + Math.random() * 2.8;
          }
        }
      }

      const prevX = shopper.x;
      const prevZ = shopper.z;
      shopper.x += shopper.vx * stepDt;
      shopper.z += shopper.vz * stepDt;

      const collisionOpts =
        shopper.state === "leaving" && shopper.exitCheckoutId ? { excludeId: shopper.exitCheckoutId } : {};
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

      if (shopper.state === "inside" || shopper.state === "leaving") {
        if (shopper.x < this.margin) {
          shopper.x = this.margin;
          shopper.vx = Math.abs(shopper.vx);
        } else if (shopper.x > this.w - this.margin) {
          shopper.x = this.w - this.margin;
          shopper.vx = -Math.abs(shopper.vx);
        }
        if (shopper.z < this.margin + 0.3 && shopper.state === "inside") {
          shopper.z = this.margin + 0.3;
          shopper.vz = Math.abs(shopper.vz);
        } else if (shopper.z > this.d - this.margin) {
          shopper.z = this.d - this.margin;
          shopper.vz = -Math.abs(shopper.vz);
        }
      }

      this.trackShelfTouches(shopper, stepDt);

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
      this.shoppers.push(this.spawnShopper({ atEntrance: true, countEntry: true }));
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
    return {
      elapsed: this.elapsed,
      shopperCount: this.shoppers.length,
      peopleInside: this.shoppers.filter((shopper) => shopper.state === "inside" || shopper.state === "leaving").length,
      sessionEntries: this.sessionEntries,
      sessionLeaves: this.sessionLeaves,
      sessionShelfInteractions: this.sessionShelfInteractions,
      sessionPaymentInteractions: this.sessionPaymentInteractions,
      entriesPerHour: Math.round(this.sessionEntries * hourly),
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
