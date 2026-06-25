/**
 * Blueprint upload → store layout inference.
 * Benchmarks align with Sensei Setup Calculator formatDefaults and common retail planning guides:
 * - Main/cross aisles ≥1.5 m (two shoppers passing, ~ADA 152 cm guidance)
 * - Checkout density ~1 lane / 90–150 m² depending on format
 * - Gondola modules from modules/m² (Sensei assumptions)
 * - ~25% island gondolas in centre aisles
 * - 5–10% sales floor reserved for technical / MEP back office
 */

import { buildStorePresetLayout, inferFixtureCounts, checkoutCountForArea } from "./planner-layout-builder.js";

/** Minimum aisle width for two people crossing (m). */
export const CROSS_AISLE_WIDTH_M = 1.5;
/** Main customer circulation aisle (m). */
export const MAIN_AISLE_WIDTH_M = 1.8;
/** Technical / MEP reserve as fraction of gross floor area. */
export const TECHNICAL_AREA_RATIO = 0.075;

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function inferStoreFormatFromArea(areaSqm) {
  if (areaSqm <= 50) return "POD";
  if (areaSqm <= 150) return "Corner";
  if (areaSqm <= 800) return "Conveniência";
  return "Supermercado";
}

/**
 * Scan blueprint raster for dark rectangular regions (likely gondola symbols).
 */
export function analyzeBlueprintImage(renderCanvas) {
  const targetWidth = Math.min(960, renderCanvas.width);
  const scale = targetWidth / renderCanvas.width;
  const targetHeight = Math.max(60, Math.floor(renderCanvas.height * scale));
  const probeCanvas = document.createElement("canvas");
  probeCanvas.width = targetWidth;
  probeCanvas.height = targetHeight;
  const probeCtx = probeCanvas.getContext("2d");
  probeCtx.drawImage(renderCanvas, 0, 0, targetWidth, targetHeight);
  const { data, width, height } = probeCtx.getImageData(0, 0, targetWidth, targetHeight);
  const visited = new Uint8Array(width * height);

  const brightnessAt = (idx) => data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
  const isDark = (x, y) => {
    const px = (y * width + x) * 4;
    return brightnessAt(px) < 110;
  };

  const components = [];
  const qx = [];
  const qy = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const key = y * width + x;
      if (visited[key] || !isDark(x, y)) continue;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;
      qx.length = 0;
      qy.length = 0;
      qx.push(x);
      qy.push(y);
      visited[key] = 1;

      while (qx.length) {
        const cx = qx.pop();
        const cy = qy.pop();
        area += 1;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) continue;
            const nx = cx + ox;
            const ny = cy + oy;
            if (nx < 1 || ny < 1 || nx >= width - 1 || ny >= height - 1) continue;
            const nKey = ny * width + nx;
            if (visited[nKey] || !isDark(nx, ny)) continue;
            visited[nKey] = 1;
            qx.push(nx);
            qy.push(ny);
          }
        }
      }

      const compW = maxX - minX + 1;
      const compH = maxY - minY + 1;
      const aspect = compW / Math.max(1, compH);
      const fillRatio = area / Math.max(1, compW * compH);
      if (area >= 90 && area <= 22000 && compW >= 22 && compH >= 6 && aspect >= 1.4 && aspect <= 12 && fillRatio <= 0.78) {
        const cxPx = (minX + maxX) / 2;
        const cyPx = (minY + maxY) / 2;
        components.push({
          area,
          compW,
          compH,
          aspect,
          fillRatio,
          cx: cxPx,
          cy: cyPx,
          // Normalized centroid in [0,1] (origin top-left, matches store W×D overlay)
          nx: cxPx / width,
          ny: cyPx / height,
          // A run drawn wider than tall reads as a horizontal gondola, else vertical
          orientation: compW >= compH ? "horizontal" : "vertical"
        });
      }
    }
  }

  const detectedModules = components.length;
  const frontBand = components.filter((c) => c.cy > height * 0.72);
  const entranceLikely = frontBand.length > 0 || height > width * 0.8;

  // Area-weighted dominant orientation → suggested aisle/run direction
  let horizontalWeight = 0;
  let verticalWeight = 0;
  components.forEach((c) => {
    if (c.orientation === "horizontal") horizontalWeight += c.area;
    else verticalWeight += c.area;
  });
  const dominantOrientation =
    detectedModules === 0 ? null : verticalWeight > horizontalWeight * 1.15 ? "vertical" : "horizontal";

  // Normalized regions where fixtures actually appear (used to bias placement)
  const regions = components.map((c) => ({
    nx: c.nx,
    ny: c.ny,
    orientation: c.orientation,
    area: c.area
  }));

  return {
    detectedModules,
    components,
    regions,
    dominantOrientation,
    orientationConfidence:
      detectedModules >= 4 && Math.abs(horizontalWeight - verticalWeight) > Math.max(horizontalWeight, verticalWeight) * 0.2
        ? "medium"
        : "low",
    entranceLikely,
    confidence: detectedModules >= 3 ? "medium" : detectedModules >= 1 ? "low" : "benchmark-only"
  };
}

/**
 * Infer shelf/gondola counts from store dimensions + optional blueprint scan hints.
 */
export function inferFixtureCountsFromBlueprint({ widthMeters, heightMeters, analysis = null, format = null }) {
  const areaSqm = widthMeters * heightMeters;
  const storeFormat = format && format !== "auto" ? format : inferStoreFormatFromArea(areaSqm);
  const benchmark = inferFixtureCounts({
    widthMeters,
    heightMeters,
    format: storeFormat,
    modulesPerM2: FORMAT_MODULES_PER_M2[storeFormat],
    pctRef: FORMAT_PCT_REF[storeFormat]
  });

  const detected = analysis?.detectedModules ?? 0;
  let modules = benchmark.modules;
  if (detected > 0) {
    modules = Math.round(clamp(detected * 0.4 + benchmark.modules * 0.6, benchmark.modules * 0.65, benchmark.modules * 1.35));
  }

  const pctRef = FORMAT_PCT_REF[storeFormat] ?? 0.3;
  const cold = Math.max(1, Math.round(modules * pctRef));
  const hot = Math.max(1, Math.round(modules * (storeFormat === "Supermercado" ? 0.1 : 0.12)));
  const ambient = Math.max(1, modules - cold - hot);
  const checkouts = checkoutCountForArea(widthMeters, heightMeters);
  const technicalAreaSqm = areaSqm * TECHNICAL_AREA_RATIO;

  const suggestedOrientation = analysis?.dominantOrientation ?? "horizontal";

  return {
    format: storeFormat,
    areaSqm,
    shelves: { ambient, cold, hot },
    modules,
    checkouts,
    technicalAreaSqm,
    entranceRequired: true,
    aisleWidthM: CROSS_AISLE_WIDTH_M,
    mainAisleWidthM: MAIN_AISLE_WIDTH_M,
    suggestedOrientation,
    orientationConfidence: analysis?.orientationConfidence ?? "low",
    analysisConfidence: analysis?.confidence ?? "benchmark-only",
    detectedModules: detected,
    benchmarkModules: benchmark.modules
  };
}

/**
 * Map normalized blueprint regions into candidate gondola positions (meters),
 * de-duplicating clustered detections so we suggest placements roughly where
 * the uploaded plan already shows fixtures.
 */
export function regionsToGondolaHints({ regions = [], widthMeters, heightMeters, minSpacingMeters = 1.2 }) {
  if (!regions.length) return [];
  const hints = regions
    .map((r) => ({
      x: clamp(r.nx * widthMeters, 0.5, widthMeters - 0.5),
      y: clamp(r.ny * heightMeters, 0.5, heightMeters - 0.5),
      orientation: r.orientation,
      area: r.area
    }))
    .sort((a, b) => b.area - a.area);

  const kept = [];
  hints.forEach((hint) => {
    const tooClose = kept.some(
      (k) => Math.hypot(k.x - hint.x, k.y - hint.y) < minSpacingMeters
    );
    if (!tooClose) kept.push(hint);
  });
  return kept;
}

/** Fixture kinds placed automatically from blueprint inference. */
export const BLUEPRINT_INFERRED_KINDS = new Set([
  "shelf-ambient",
  "shelf-island",
  "shelf-cold",
  "shelf-hot",
  "entry-gated",
  "entry-open",
  "checkout",
  "technical",
  "warehouse",
  "monitor-entrance",
  "monitor-people-zone"
]);

/**
 * Build collision-aware layout from inferred counts (entrance, checkouts, BOH, gondolas).
 */
export function buildBlueprintInferredLayout({
  widthMeters,
  heightMeters,
  shelves,
  artifacts,
  analysis = null,
  gapMeters = 0.15,
  marginMeters = 0.55,
  technicalAreaRatio = TECHNICAL_AREA_RATIO,
  includeMonitoring = true
}) {
  const runOrientation = analysis?.dominantOrientation ?? "horizontal";
  const gondolaHints =
    analysis?.regions && analysis.regions.length
      ? regionsToGondolaHints({ regions: analysis.regions, widthMeters, heightMeters })
      : [];

  return buildStorePresetLayout({
    widthMeters,
    depthMeters: heightMeters,
    shelves,
    artifacts,
    gapMeters,
    marginMeters,
    technicalAreaRatio,
    includeMonitoring,
    runOrientation,
    gondolaHints
  });
}

export function summarizeBlueprintInference(inference, placed) {
  const orientationLabel =
    inference.suggestedOrientation === "vertical" ? "vertical runs" : "horizontal runs";
  const orientationNote =
    inference.detectedModules > 0
      ? `Suggested gondola orientation: ${orientationLabel} (from blueprint)`
      : `Suggested gondola orientation: ${orientationLabel} (default)`;
  const lines = [
    `Format: ${inference.format} · ${inference.areaSqm.toFixed(0)} m²`,
    `Modules: ${inference.modules} (scan ${inference.detectedModules}, benchmark ${inference.benchmarkModules})`,
    orientationNote,
    `Placed — ambient ${placed.ambient}, island ${placed.island}, cold ${placed.cold}, hot ${placed.hot}, checkout ${placed.checkout}`,
    `Technical reserve ~${inference.technicalAreaSqm.toFixed(0)} m² (${(TECHNICAL_AREA_RATIO * 100).toFixed(1)}%)`,
    `Aisles ≥${inference.aisleWidthM} m · entrance + checkout at front`
  ];
  return lines.join(" · ");
}
