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
    palette: { fill: "#f6f6f4", stroke: "#111111" },
    color3d: "#f6f6f4",
    badge3d: "#d9f04f",
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
    palette: { fill: "#f6f6f4", stroke: "#111111" },
    color3d: "#f6f6f4",
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
    palette: { fill: "#f0f7ff", stroke: "#1d4ed8" },
    color3d: "#f0f7ff",
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
    palette: { fill: "#fff8f0", stroke: "#c2410c" },
    color3d: "#fff8f0",
    badge3d: "#f97316",
    emissive3d: "#ea580c",
    tag2d: "HOT"
  },
  "produce-bin": {
    label: "Produce display",
    type: "produce",
    widthMeters: 1.3,
    depthMeters: 1,
    heightMeters: 1.05,
    shelfLevels: 1,
    palette: { fill: "#eef8e6", stroke: "#15803d" },
    color3d: "#caa472",
    badge3d: "#22c55e",
    emissive3d: "#16a34a",
    tag2d: "FRESH"
  },
  "service-deli": {
    label: "Deli / butcher counter",
    type: "service",
    serviceVariant: "deli",
    widthMeters: 2.5,
    depthMeters: 1.1,
    heightMeters: 1.5,
    shelfLevels: 2,
    palette: { fill: "#fdecec", stroke: "#9f1239" },
    color3d: "#f4f4f2",
    badge3d: "#e11d48",
    emissive3d: "#be123c",
    tag2d: "DELI"
  },
  "service-fish": {
    label: "Fishmonger counter",
    type: "service",
    serviceVariant: "fish",
    widthMeters: 2.5,
    depthMeters: 1.1,
    heightMeters: 1.35,
    shelfLevels: 1,
    palette: { fill: "#eaf4fb", stroke: "#0369a1" },
    color3d: "#eef2f5",
    badge3d: "#0ea5e9",
    emissive3d: "#0284c7",
    tag2d: "FISH"
  },
  "service-bakery": {
    label: "Bakery / pastry case",
    type: "service",
    serviceVariant: "bakery",
    widthMeters: 2,
    depthMeters: 1,
    heightMeters: 1.5,
    shelfLevels: 3,
    palette: { fill: "#fdf3e3", stroke: "#b45309" },
    color3d: "#f6efe4",
    badge3d: "#f59e0b",
    emissive3d: "#d97706",
    tag2d: "BAKERY"
  },
  "station-coffee": {
    label: "Self-service coffee",
    type: "station",
    stationVariant: "coffee",
    widthMeters: 1,
    depthMeters: 0.6,
    heightMeters: 1.45,
    shelfLevels: 1,
    palette: { fill: "#f3ece4", stroke: "#7c4a1e" },
    color3d: "#ede4d8",
    badge3d: "#b45309",
    emissive3d: "#92400e",
    tag2d: "COFFEE"
  },
  "station-juice": {
    label: "Self-service juice",
    type: "station",
    stationVariant: "juice",
    widthMeters: 1,
    depthMeters: 0.6,
    heightMeters: 1.45,
    shelfLevels: 1,
    palette: { fill: "#fff1e0", stroke: "#c2410c" },
    color3d: "#f7ede0",
    badge3d: "#f97316",
    emissive3d: "#ea580c",
    tag2d: "JUICE"
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
    label: "Automatic doors",
    type: "entry-open",
    widthMeters: 1.8,
    depthMeters: 0.12,
    heightMeters: 2.4,
    shelfLevels: 0,
    palette: { fill: "#f2f2f0", stroke: "#111111" },
    color3d: "#f2f2f0",
    tag2d: "DOOR"
  },
  "entry-gated": {
    label: "Turnstiles / barriers",
    type: "entry-gated",
    widthMeters: 1.8,
    depthMeters: 0.18,
    heightMeters: 2.4,
    shelfLevels: 0,
    palette: { fill: "#f2f2f0", stroke: "#111111" },
    color3d: "#404040",
    tag2d: "GATE"
  },
  checkout: {
    label: "Checkout self-service",
    type: "checkout",
    widthMeters: 1.8,
    depthMeters: 0.18,
    heightMeters: 2.4,
    shelfLevels: 0,
    palette: { fill: "#404040", stroke: "#111111" },
    color3d: "#404040",
    tag2d: "SCO"
  },
  "separator-wall": {
    label: "Wall segment",
    type: "wall",
    widthMeters: 1,
    depthMeters: 0.12,
    heightMeters: 2.8,
    shelfLevels: 0,
    palette: { fill: "#d1d5db", stroke: "#374151" },
    color3d: "#e5e7eb",
    opacity3d: 0.95,
    tag2d: "WALL"
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
  "produce-bin",
  "service-deli",
  "service-fish",
  "service-bakery",
  "station-coffee",
  "station-juice",
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
      serviceVariant: spec.serviceVariant,
      stationVariant: spec.stationVariant,
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
