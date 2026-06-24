/**
 * Procedural assisted-food store layouts with bounds checking and collision avoidance.
 * Pattern: front entry + checkout, left cold wall, back hot/service, centre gondola runs, rear BOH.
 */

/** Cross-aisle width for two shoppers passing (~150 cm retail guidance). */
const AISLE_WIDTH = 1.5;
const FRONT_CLEARANCE = 2.45;
const CHECKOUT_ROW_Y = 1.85;
const PLACEMENT_PAD = 0.1;
const DEFAULT_TECHNICAL_AREA_RATIO = 0.075;

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

/**
 * Checkout lanes from sales area (m²).
 * Convenience / small format: ~1 lane / 90 m²; larger stores ~1 / 120–150 m².
 */
export function checkoutCountForArea(width, depth) {
  const area = width * depth;
  if (area < 80) return 1;
  if (area < 400) return clamp(Math.ceil(area / 90), 1, 4);
  if (area < 800) return clamp(Math.ceil(area / 120), 3, 6);
  return clamp(Math.ceil(area / 150), 4, 8);
}

const FORMAT_MODULES_PER_M2 = {
  POD: 0.54,
  Corner: 0.54,
  Conveniência: 0.3655,
  Supermercado: 0.25
};

const FORMAT_PCT_REF = {
  POD: 0.43,
  Corner: 0.43,
  Conveniência: 0.3,
  Supermercado: 0.3
};

function inferStoreFormatFromArea(areaSqm) {
  if (areaSqm <= 50) return "POD";
  if (areaSqm <= 150) return "Corner";
  if (areaSqm <= 800) return "Conveniência";
  return "Supermercado";
}

/**
 * Module counts from floor area using Sensei formatDefaults modules/m².
 */
export function inferFixtureCounts({
  widthMeters,
  heightMeters,
  format = null,
  modulesPerM2 = null,
  pctRef = null
}) {
  const areaSqm = widthMeters * heightMeters;
  const storeFormat = format || inferStoreFormatFromArea(areaSqm);
  const density = modulesPerM2 ?? FORMAT_MODULES_PER_M2[storeFormat] ?? 0.3655;
  const refPct = pctRef ?? FORMAT_PCT_REF[storeFormat] ?? 0.3;
  const modules = Math.max(3, Math.round(areaSqm * density));
  const cold = Math.max(1, Math.round(modules * refPct));
  const hot = Math.max(1, Math.round(modules * (storeFormat === "Supermercado" ? 0.1 : 0.12)));
  const ambient = Math.max(1, modules - cold - hot);
  return { format: storeFormat, modules, shelves: { ambient, cold, hot } };
}

function backOfHouseSize(width, depth, technicalAreaRatio = DEFAULT_TECHNICAL_AREA_RATIO) {
  const area = width * depth;
  const techRatio = clamp(technicalAreaRatio, 0.05, 0.1);
  const technicalTarget = area * techRatio;
  const technical = {
    w: clamp(Math.sqrt(technicalTarget * 1.35), 1.8, Math.min(width * 0.35, 8)),
    d: clamp(technicalTarget / Math.max(1.8, Math.sqrt(technicalTarget * 1.35)), 1.6, Math.min(depth * 0.28, 6))
  };
  const warehouseTarget = area * 0.04;
  const compact = area < 150 ? 0.72 : area < 320 ? 0.86 : 1;
  const warehouse = {
    w: clamp(Math.sqrt(warehouseTarget * 1.2) * compact, 2, Math.min(width * 0.22, 5.5)),
    d: clamp(warehouseTarget / Math.max(2, Math.sqrt(warehouseTarget * 1.2)) * compact, 1.6, Math.min(depth * 0.17, 4.5))
  };
  return { warehouse, technical, technicalAreaSqm: technical.w * technical.d };
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

function placeIslandGondolas(placements, count, width, depth, margin, gap, runStartY, runEndY, leftX, rightX, artifacts) {
  const island = specSize(artifacts, "shelf-island");
  const aisleCentreX = leftX + (rightX - leftX) / 2;
  let placed = 0;
  let row = 0;

  while (placed < count) {
    const runY = runStartY + row * (island.d + AISLE_WIDTH * 1.35);
    if (runY + island.d / 2 > runEndY) break;
    if (
      tryPlace(
        placements,
        "shelf-island",
        aisleCentreX,
        runY + island.d / 2,
        0,
        width,
        depth,
        margin,
        artifacts
      )
    ) {
      placed += 1;
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
 * @param {number} [options.technicalAreaRatio=0.075] - 5–10% of floor for MEP / technical room
 */
export function buildStorePresetLayout({
  widthMeters: W,
  depthMeters: D,
  shelves,
  artifacts,
  gapMeters = 0.15,
  marginMeters = 0.55,
  includeMonitoring = true,
  technicalAreaRatio = DEFAULT_TECHNICAL_AREA_RATIO
}) {
  const placements = [];
  const margin = marginMeters;
  const gap = gapMeters;
  const cold = specSize(artifacts, "shelf-cold");
  const hot = specSize(artifacts, "shelf-hot");
  const boh = backOfHouseSize(W, D, technicalAreaRatio);

  const backReserveY = margin + boh.warehouse.d + gap + 0.25;
  const runEndY = D - backReserveY;
  const runStartY = FRONT_CLEARANCE + margin * 0.5;

  // --- Front: entrance + checkout (decompression zone kept clear) ---
  const entryDepth = specSize(artifacts, "entry-gated").d;
  tryPlace(placements, "entry-gated", W / 2, margin + entryDepth / 2 + 0.02, 0, W, D, margin, artifacts);

  if (includeMonitoring) {
    tryPlace(placements, "monitor-entrance", W / 2, margin + 0.42, 0, W, D, margin, artifacts);
  }

  const lanes = checkoutCountForArea(W, D);
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

  // --- Centre: parallel ambient gondola runs + island gondolas in main aisle ---
  const leftRunX = margin + cold.d + AISLE_WIDTH;
  const rightRunX = W - margin - AISLE_WIDTH;
  const islandTarget = Math.max(0, Math.floor(shelves.ambient * 0.25));
  const wallAmbientTarget = Math.max(0, shelves.ambient - islandTarget);
  const ambientPlaced = placeGondolaRuns(
    placements,
    wallAmbientTarget,
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
  const islandPlaced = placeIslandGondolas(
    placements,
    islandTarget,
    W,
    D,
    margin,
    gap,
    runStartY + AISLE_WIDTH * 0.6,
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
      island: islandPlaced,
      cold: coldPlaced,
      hot: hotPlaced,
      checkout: checkoutsPlaced
    },
    requested: { ...shelves }
  };
}
