/**
 * Procedural assisted-food store layouts with bounds checking and collision avoidance.
 * Pattern: front entry + checkout, left cold wall, back hot/service, centre gondola runs, rear BOH.
 */

const AISLE_WIDTH = 1.45;
const FRONT_CLEARANCE = 2.45;
const CHECKOUT_ROW_Y = 1.85;
const PLACEMENT_PAD = 0.1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function specSize(artifacts, kind) {
  const spec = artifacts[kind] || {};
  return {
    w: spec.widthMeters ?? spec.w ?? 1.2,
    d: spec.depthMeters ?? spec.h ?? 0.45
  };
}

function aabbFor(kind, x, y, angle, artifacts) {
  const { w, d } = specSize(artifacts, kind);
  const normalized = ((Math.round(angle) % 360) + 360) % 360;
  const spanX = normalized === 90 || normalized === 270 ? d : w;
  const spanY = normalized === 90 || normalized === 270 ? w : d;
  return {
    minX: x - spanX / 2,
    maxX: x + spanX / 2,
    minY: y - spanY / 2,
    maxY: y + spanY / 2
  };
}

function withinStore(box, width, depth, margin) {
  return box.minX >= margin && box.maxX <= width - margin && box.minY >= margin && box.maxY <= depth - margin;
}

function overlaps(a, b, pad = PLACEMENT_PAD) {
  return !(
    a.maxX + pad <= b.minX ||
    a.minX - pad >= b.maxX ||
    a.maxY + pad <= b.minY ||
    a.minY - pad >= b.maxY
  );
}

function canPlace(placements, kind, x, y, angle, width, depth, margin, artifacts) {
  const box = aabbFor(kind, x, y, angle, artifacts);
  if (!withinStore(box, width, depth, margin)) return false;
  for (const placed of placements) {
    if (overlaps(box, aabbFor(placed.kind, placed.x, placed.y, placed.angle, artifacts))) return false;
  }
  return true;
}

function tryPlace(placements, kind, x, y, angle, width, depth, margin, artifacts) {
  if (!canPlace(placements, kind, x, y, angle, width, depth, margin, artifacts)) return false;
  placements.push({ kind, x, y, angle: angle || 0 });
  return true;
}

function checkoutCount(width, depth) {
  const area = width * depth;
  if (area < 140) return 1;
  if (area < 320) return 2;
  if (area < 650) return 3;
  return clamp(Math.floor(width / 8.5), 4, 6);
}

function backOfHouseSize(width, depth) {
  const area = width * depth;
  const compact = area < 150 ? 0.72 : area < 320 ? 0.86 : 1;
  const warehouse = {
    w: clamp(width * 0.22 * compact, 2.2, 5.5),
    d: clamp(depth * 0.17 * compact, 1.9, 4.5)
  };
  const technical = {
    w: clamp(width * 0.15 * compact, 1.8, 3.8),
    d: clamp(depth * 0.13 * compact, 1.6, 3.2)
  };
  return { warehouse, technical };
}

function placeLine(placements, kind, start, count, axis, fixed, angle, width, depth, margin, gap, artifacts) {
  const { w, d } = specSize(artifacts, kind);
  const normalized = ((Math.round(angle) % 360) + 360) % 360;
  const step = (normalized === 90 || normalized === 270 ? w : w) + gap;
  let placed = 0;

  for (let i = 0; i < count; i += 1) {
    const offset = start + i * step;
    const x = axis === "y" ? fixed : offset + (normalized === 90 || normalized === 270 ? d : w) / 2;
    const y = axis === "y" ? offset + (normalized === 90 || normalized === 270 ? w : d) / 2 : fixed;
    if (tryPlace(placements, kind, x, y, angle, width, depth, margin, artifacts)) {
      placed += 1;
    } else {
      break;
    }
  }
  return placed;
}

function placeGondolaRuns(placements, count, width, depth, margin, gap, runStartY, runEndY, leftX, rightX, artifacts) {
  const { w, d } = specSize(artifacts, "shelf-ambient");
  let placed = 0;
  let row = 0;

  while (placed < count) {
    const runY = runStartY + row * (d + AISLE_WIDTH);
    if (runY + d / 2 > runEndY) break;

    const facing = 0;
    let x = leftX + w / 2;
    while (x + w / 2 <= rightX && placed < count) {
      if (tryPlace(placements, "shelf-ambient", x, runY + d / 2, facing, width, depth, margin, artifacts)) {
        placed += 1;
      }
      x += w + gap;
    }
    row += 1;
  }

  return placed;
}

/**
 * @param {object} options
 * @param {number} options.widthMeters
 * @param {number} options.depthMeters
 * @param {{ ambient: number, cold: number, hot: number }} options.shelves
 * @param {object} options.artifacts - artifact catalog with widthMeters/depthMeters
 * @param {number} [options.gapMeters=0.15]
 * @param {number} [options.marginMeters=0.55]
 * @param {boolean} [options.includeMonitoring=true]
 */
export function buildStorePresetLayout({
  widthMeters: W,
  depthMeters: D,
  shelves,
  artifacts,
  gapMeters = 0.15,
  marginMeters = 0.55,
  includeMonitoring = true
}) {
  const placements = [];
  const margin = marginMeters;
  const gap = gapMeters;
  const cold = specSize(artifacts, "shelf-cold");
  const hot = specSize(artifacts, "shelf-hot");
  const boh = backOfHouseSize(W, D);

  const backReserveY = margin + boh.warehouse.d + gap + 0.25;
  const runEndY = D - backReserveY;
  const runStartY = FRONT_CLEARANCE + margin * 0.5;

  // --- Front: entrance + checkout (decompression zone kept clear) ---
  tryPlace(placements, "entry-gated", W / 2, margin + 0.08, 0, W, D, margin, artifacts);

  if (includeMonitoring) {
    tryPlace(placements, "monitor-entrance", W / 2, margin + 0.42, 0, W, D, margin, artifacts);
  }

  const lanes = checkoutCount(W, D);
  const laneSpacing = specSize(artifacts, "checkout").w + gap + 0.35;
  const laneStartX = clamp(W / 2 - ((lanes - 1) * laneSpacing) / 2, margin + 1.1, W - margin - 1.1);
  let checkoutsPlaced = 0;
  const checkoutY = margin + CHECKOUT_ROW_Y;
  for (let i = 0; i < lanes; i += 1) {
    if (
      tryPlace(
        placements,
        "checkout",
        laneStartX + i * laneSpacing,
        checkoutY,
        0,
        W,
        D,
        margin,
        artifacts
      )
    ) {
      checkoutsPlaced += 1;
    }
  }

  // --- Back of house (rear-left corner, typical for food retail) ---
  const whX = margin + boh.warehouse.w / 2;
  const whY = D - margin - boh.warehouse.d / 2;
  tryPlace(placements, "warehouse", whX, whY, 0, W, D, margin, artifacts);

  const techX = whX + boh.warehouse.w / 2 + gap + boh.technical.w / 2;
  const techY = D - margin - boh.technical.d / 2;
  if (techX + boh.technical.w / 2 <= W - margin) {
    tryPlace(placements, "technical", techX, techY, 0, W, D, margin, artifacts);
  } else {
    tryPlace(placements, "technical", whX, whY - boh.warehouse.d / 2 - gap - boh.technical.d / 2, 0, W, D, margin, artifacts);
  }

  // --- Left perimeter: refrigerated run (dairy / chilled wall) ---
  const coldX = margin + cold.d / 2;
  const coldPlaced = placeLine(
    placements,
    "shelf-cold",
    runStartY,
    shelves.cold,
    "y",
    coldX,
    90,
    W,
    D,
    margin,
    gap,
    artifacts
  );

  // --- Back wall: hot food / prepared counter ---
  const hotY = D - margin - hot.d / 2 - 0.05;
  const hotStartX = margin + cold.d + AISLE_WIDTH + hot.w / 2;
  const hotEndX = W - margin - hot.w / 2;
  let hotPlaced = 0;
  let hotX = hotStartX;
  while (hotX <= hotEndX && hotPlaced < shelves.hot) {
    if (tryPlace(placements, "shelf-hot", hotX, hotY, 0, W, D, margin, artifacts)) {
      hotPlaced += 1;
    }
    hotX += hot.w + gap;
  }

  // --- Centre: parallel ambient gondola runs with racetrack aisles ---
  const leftRunX = margin + cold.d + AISLE_WIDTH;
  const rightRunX = W - margin - AISLE_WIDTH;
  const ambientPlaced = placeGondolaRuns(
    placements,
    shelves.ambient,
    W,
    D,
    margin,
    gap,
    runStartY,
    runEndY,
    leftRunX,
    rightRunX,
    artifacts
  );

  // --- Optional traffic zone over main aisle ---
  if (includeMonitoring && ambientPlaced > 0) {
    const trackW = clamp((rightRunX - leftRunX) * 0.55, 2.8, 6);
    const trackD = clamp((runEndY - runStartY) * 0.35, 2.5, 5);
    const trackX = leftRunX + (rightRunX - leftRunX) / 2;
    const trackY = runStartY + (runEndY - runStartY) * 0.45;
    tryPlace(placements, "monitor-people-zone", trackX, trackY, 0, W, D, margin, artifacts);
  }

  return {
    fixtures: placements,
    placed: {
      ambient: ambientPlaced,
      cold: coldPlaced,
      hot: hotPlaced,
      checkout: checkoutsPlaced
    },
    requested: { ...shelves }
  };
}
