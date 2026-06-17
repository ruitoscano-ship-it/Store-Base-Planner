/** Shared artifact helpers for planner 2D/3D (browser + Node). */
export const DEFAULT_PLANNER = {
  wallHeightMeters: 2.8,
  wallThicknessMeters: 0.12,
  layoutGapMeters: 0.15
};

export const DEFAULT_ARTIFACTS = {
  server: {
    label: "Server",
    type: "rack",
    widthMeters: 0.6,
    depthMeters: 0.6,
    heightMeters: 1.2,
    shelfLevels: 0,
    color3d: "#64748b"
  },
  aisle: {
    label: "Aisle",
    type: "aisle",
    widthMeters: 1.4,
    depthMeters: 4,
    heightMeters: 0.02,
    shelfLevels: 0,
    color3d: "#f3f4f6",
    opacity3d: 0.35
  },
  "shelf-ambient": {
    label: "Ambient",
    type: "gondola",
    widthMeters: 1.2,
    depthMeters: 0.45,
    heightMeters: 1.85,
    shelfLevels: 4,
    palette: { fill: "#f5f0d8", stroke: "#78716c" },
    color3d: "#d9e57a",
    badge3d: "#bef264",
    emissive3d: "#84cc16",
    tag2d: "AMB"
  },
  "shelf-cold": {
    label: "Cold",
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
    label: "Hot",
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
  "entry-open": {
    label: "Entry",
    type: "entry-open",
    widthMeters: 1.8,
    depthMeters: 0.12,
    heightMeters: 2.4,
    shelfLevels: 0,
    color3d: "#a78bfa"
  },
  "entry-gated": {
    label: "Gated",
    type: "entry-gated",
    widthMeters: 1.8,
    depthMeters: 0.18,
    heightMeters: 2.4,
    shelfLevels: 0,
    color3d: "#f472b6"
  },
  checkout: {
    label: "POS",
    type: "checkout",
    widthMeters: 1.6,
    depthMeters: 0.9,
    heightMeters: 1.05,
    shelfLevels: 0,
    color3d: "#fbbf24"
  },
  warehouse: {
    label: "Warehouse",
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
    label: "Tech",
    type: "zone",
    widthMeters: 3,
    depthMeters: 2.5,
    heightMeters: 0.08,
    shelfLevels: 0,
    palette: { fill: "#dcefe3", stroke: "#14532d" },
    color3d: "#22c55e",
    opacity3d: 0.55
  },
  "separator-wall": {
    label: "Wall",
    type: "wall",
    widthMeters: 4,
    depthMeters: 0.12,
    heightMeters: 2.8,
    shelfLevels: 0,
    color3d: "#374151"
  },
  "security-cage": {
    label: "Secure",
    type: "cage",
    widthMeters: 3,
    depthMeters: 3,
    heightMeters: 2.2,
    shelfLevels: 0,
    color3d: "#ef4444",
    opacity3d: 0.45
  },
  "entry-zone": {
    label: "Entry zone",
    type: "entry-zone",
    widthMeters: 3,
    depthMeters: 2.5,
    heightMeters: 0.08,
    shelfLevels: 0,
    color3d: "#facc15",
    opacity3d: 0.5
  },
  "monitor-entrance": {
    label: "Count entrance",
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
    label: "People zone",
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
    label: "Shelf monitor",
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
    label: "Interaction zone",
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
    tag2d: "ENGAGE"
  }
};

export function artifactsToPlannerMap(artifacts = DEFAULT_ARTIFACTS) {
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
