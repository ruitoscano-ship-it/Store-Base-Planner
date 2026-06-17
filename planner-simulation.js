/** Occupancy → interaction capture estimates for store monitoring layouts. */

export const SIM_CELL_SIZE = 1;
export const CAMERA_GRID_SPACING = 3;
const AVG_DWELL_MINUTES = 12;
const INTERACTIONS_PER_VISIT = 4.2;
const TRACK_EVENTS_PER_VISIT = 18;

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
