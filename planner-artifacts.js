/** Shared artifact helpers for planner 2D/3D (browser + Node). */

export const DEFAULT_PLANNER = {
  wallHeightMeters: 2.8,
  wallThicknessMeters: 0.12,
  layoutGapMeters: 0.15
};

/** Physical store fixtures and zones for assisted-food retail layouts. */
export const DEFAULT_ARTIFACTS = {
  "shelf-ambient": {
    label: "Dry grocery gondola",
    type: "gondola",
    widthMeters: 1.2,
    depthMeters: 0.45,
    heightMeters: 1.85,
    shelfLevels: 4,
    palette: { fill: "#f5f0d8", stroke: "#78716c" },
    color3d: "#d9e57a",
    badge3d: "#bef264",
    emissive3d: "#84cc16",
    tag2d: "DRY"
  },
  "shelf-island": {
    label: "Island gondola",
    type: "gondola-island",
    widthMeters: 2.4,
    depthMeters: 0.9,
    heightMeters: 1.85,
    shelfLevels: 4,
    palette: { fill: "#f5f0d8", stroke: "#78716c" },
    color3d: "#e5e7eb",
    badge3d: "#d1d5db",
    emissive3d: "#9ca3af",
    tag2d: "ISL"
  },
  "shelf-cold": {
    label: "Refrigerated case",
    type: "gondola",
    widthMeters: 1.2,
    depthMeters: 0.55,
    heightMeters: 1.85,
    shelfLevels: 4,
    palette: { fill: "#dbeafe", stroke: "#1d4ed8" },
    color3d: "#38bdf8",
    badge3d: "#3b82f6",
    emissive3d: "#0284c7",
    tag2d: "COLD"
  },
  "shelf-hot": {
    label: "Hot counter",
    type: "gondola",
    widthMeters: 1,
    depthMeters: 0.6,
    heightMeters: 1.85,
    shelfLevels: 4,
    palette: { fill: "#ffedd5", stroke: "#c2410c" },
    color3d: "#fb923c",
    badge3d: "#f97316",
    emissive3d: "#ea580c",
    tag2d: "HOT"
  },
  aisle: {
    label: "Customer aisle",
    type: "aisle",
    widthMeters: 1.4,
    depthMeters: 4,
    heightMeters: 0.02,
    shelfLevels: 0,
    color3d: "#f3f4f6",
    opacity3d: 0.35
  },
  "entry-open": {
    label: "Open entrance",
    type: "entry-open",
    widthMeters: 1.8,
    depthMeters: 0.12,
    heightMeters: 2.4,
    shelfLevels: 0,
    color3d: "#a78bfa"
  },
  "entry-gated": {
    label: "Gated entrance",
    type: "entry-gated",
    widthMeters: 1.8,
    depthMeters: 0.18,
    heightMeters: 2.4,
    shelfLevels: 0,
    color3d: "#f472b6"
  },
  checkout: {
    label: "Gated exit",
    type: "entry-gated",
    widthMeters: 1.8,
    depthMeters: 0.18,
    heightMeters: 2.4,
    shelfLevels: 0,
    color3d: "#f59e0b",
    gatePalette: "checkout"
  },
  "separator-wall": {
    label: "Interior wall",
    type: "wall",
    widthMeters: 4,
    depthMeters: 0.12,
    heightMeters: 2.8,
    shelfLevels: 0,
    color3d: "#374151"
  },
  warehouse: {
    label: "Back of house",
    type: "zone",
    widthMeters: 4,
    depthMeters: 3,
    heightMeters: 0.08,
    shelfLevels: 0,
    palette: { fill: "#e8dfd0", stroke: "#713f12" },
    color3d: "#a16207",
    opacity3d: 0.55
  },
  technical: {
    label: "Back office",
    type: "zone",
    widthMeters: 3,
    depthMeters: 2.5,
    heightMeters: 0.08,
    shelfLevels: 0,
    palette: { fill: "#dcefe3", stroke: "#14532d" },
    color3d: "#22c55e",
    opacity3d: 0.55
  },
  "monitor-entrance": {
    label: "Entrance counting",
    type: "monitor-entrance",
    widthMeters: 2,
    depthMeters: 0.35,
    heightMeters: 0.05,
    shelfLevels: 0,
    monitorCapability: "count",
    monitorMetrics: ["entries", "exits", "occupancy"],
    palette: { fill: "#cffafe", stroke: "#0e7490" },
    color3d: "#06b6d4",
    opacity3d: 0.58,
    tag2d: "IN/OUT"
  },
  "monitor-people-zone": {
    label: "Traffic zone",
    type: "monitor-zone",
    widthMeters: 4,
    depthMeters: 3,
    heightMeters: 0.05,
    shelfLevels: 0,
    monitorCapability: "track",
    monitorMetrics: ["footfall", "dwell", "path"],
    palette: { fill: "#e0f2fe", stroke: "#0369a1" },
    color3d: "#38bdf8",
    opacity3d: 0.4,
    tag2d: "TRACK"
  },
  "monitor-shelf-zone": {
    label: "Shelf interaction",
    type: "monitor-zone",
    widthMeters: 1.2,
    depthMeters: 0.85,
    heightMeters: 0.05,
    shelfLevels: 0,
    monitorCapability: "interaction",
    monitorMetrics: ["pick", "touch", "attention"],
    palette: { fill: "#ede9fe", stroke: "#6d28d9" },
    color3d: "#a78bfa",
    opacity3d: 0.45,
    tag2d: "SHELF"
  },
  "monitor-interaction-zone": {
    label: "Service counter",
    type: "monitor-zone",
    widthMeters: 2.5,
    depthMeters: 2,
    heightMeters: 0.05,
    shelfLevels: 0,
    monitorCapability: "interaction",
    monitorMetrics: ["engagement", "conversion", "queue"],
    palette: { fill: "#fce7f3", stroke: "#be185d" },
    color3d: "#f472b6",
    opacity3d: 0.42,
    tag2d: "SERVICE"
  }
};

/** Deprecated kinds kept so imported legacy plans still render. */
export const LEGACY_ARTIFACTS = {
  server: {
    label: "Server (legacy)",
    type: "rack",
    widthMeters: 0.6,
    depthMeters: 0.6,
    heightMeters: 1.2,
    shelfLevels: 0,
    color3d: "#64748b"
  },
  "security-cage": {
    label: "Security cage (legacy)",
    type: "cage",
    widthMeters: 3,
    depthMeters: 3,
    heightMeters: 2.2,
    shelfLevels: 0,
    color3d: "#ef4444",
    opacity3d: 0.45
  },
  "entry-zone": {
    label: "Entry zone (legacy)",
    type: "entry-zone",
    widthMeters: 3,
    depthMeters: 2.5,
    heightMeters: 0.08,
    shelfLevels: 0,
    color3d: "#facc15",
    opacity3d: 0.5
  }
};

export const STORE_ARTIFACT_KINDS = [
  "shelf-ambient",
  "shelf-island",
  "shelf-cold",
  "shelf-hot",
  "aisle",
  "entry-open",
  "entry-gated",
  "checkout",
  "separator-wall",
  "warehouse",
  "technical"
];

export const MONITOR_ARTIFACT_KINDS = [
  "monitor-entrance",
  "monitor-people-zone",
  "monitor-shelf-zone",
  "monitor-interaction-zone"
];

export function getAllArtifacts() {
  return { ...DEFAULT_ARTIFACTS, ...LEGACY_ARTIFACTS };
}

export function artifactsToPlannerMap(artifacts = getAllArtifacts()) {
  const map = {};
  Object.entries(artifacts).forEach(([kind, spec]) => {
    map[kind] = {
      label: spec.label,
      w: spec.widthMeters,
      h: spec.depthMeters,
      type: spec.type,
      heightMeters: spec.heightMeters,
      shelfLevels: spec.shelfLevels,
      palette: spec.palette,
      color3d: spec.color3d,
      badge3d: spec.badge3d,
      emissive3d: spec.emissive3d,
      tag2d: spec.tag2d,
      opacity3d: spec.opacity3d,
      monitorCapability: spec.monitorCapability,
      monitorMetrics: spec.monitorMetrics
    };
  });
  return map;
}

export function layoutStepForArtifact(spec, gapMeters = 0.15) {
  if (!spec) return 1.3;
  const w = spec.widthMeters ?? spec.w ?? 1;
  const d = spec.depthMeters ?? spec.h ?? 1;
  return Math.max(w, d) + gapMeters;
}
