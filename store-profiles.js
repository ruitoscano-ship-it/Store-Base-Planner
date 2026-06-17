const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "data", "store-profiles.json");

const DEFAULT_PLANNER = {
  wallHeightMeters: 2.8,
  wallThicknessMeters: 0.12,
  layoutGapMeters: 0.15
};

const DEFAULT_ARTIFACTS = {
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

const DEFAULT_STORE_PROFILES = {
  version: 1,
  updatedAt: new Date().toISOString(),
  planner: structuredClone(DEFAULT_PLANNER),
  artifacts: structuredClone(DEFAULT_ARTIFACTS),
  costs: {
    ambientShelf: 1500,
    coldShelf: 4200,
    hotShelf: 3600,
    installPerShelf: 280
  },
  bespoke: {
    areaDivisors: { ambient: 13, cold: 32, hot: 45 },
    mins: { ambient: 12, cold: 4, hot: 2 },
    maxs: { ambient: 80, cold: 28, hot: 16 },
    integrationFixed: 30000,
    setupPercent: 18,
    contingencyPercent: 12
  },
  profiles: {
    small: {
      id: "small",
      label: "Small",
      blurb: "~100 m² convenience / kiosk",
      widthMeters: 10,
      heightMeters: 10,
      shelves: { ambient: 10, cold: 4, hot: 2 },
      integrationFixed: 8500,
      setupPercent: 12,
      contingencyPercent: 8
    },
    medium: {
      id: "medium",
      label: "Medium",
      blurb: "~250 m² neighbourhood store",
      widthMeters: 18,
      heightMeters: 14,
      shelves: { ambient: 18, cold: 8, hot: 4 },
      integrationFixed: 12000,
      setupPercent: 15,
      contingencyPercent: 10
    },
    large: {
      id: "large",
      label: "Large",
      blurb: "~620 m² supermarket format",
      widthMeters: 28,
      heightMeters: 22,
      shelves: { ambient: 34, cold: 16, hot: 8 },
      integrationFixed: 22000,
      setupPercent: 15,
      contingencyPercent: 10
    },
    xlarge: {
      id: "xlarge",
      label: "X-Large",
      blurb: "~1,200 m² hypermarket / flagship",
      widthMeters: 40,
      heightMeters: 30,
      shelves: { ambient: 52, cold: 24, hot: 14 },
      integrationFixed: 40000,
      setupPercent: 16,
      contingencyPercent: 12
    },
    bespoke: {
      id: "bespoke",
      label: "Bespoke",
      blurb: "Uses custom width/depth · custom engineering",
      dynamicSize: true,
      integrationFixed: 30000,
      setupPercent: 18,
      contingencyPercent: 12
    }
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ensureDataDir() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadStoreProfiles() {
  ensureDataDir();
  if (!fs.existsSync(DATA_PATH)) {
    saveStoreProfiles(DEFAULT_STORE_PROFILES);
    return structuredClone(DEFAULT_STORE_PROFILES);
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    return normalizeStoreProfiles(parsed);
  } catch (_error) {
    saveStoreProfiles(DEFAULT_STORE_PROFILES);
    return structuredClone(DEFAULT_STORE_PROFILES);
  }
}

function saveStoreProfiles(config) {
  ensureDataDir();
  const normalized = normalizeStoreProfiles(config);
  normalized.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function normalizeArtifact(kind, input, fallback) {
  const base = structuredClone(fallback);
  if (!input || typeof input !== "object") return base;
  return {
    ...base,
    ...input,
    label: input.label ?? base.label,
    type: input.type ?? base.type,
    widthMeters: clamp(Number(input.widthMeters ?? base.widthMeters), 0.05, 50),
    depthMeters: clamp(Number(input.depthMeters ?? base.depthMeters), 0.05, 50),
    heightMeters: clamp(Number(input.heightMeters ?? base.heightMeters), 0.02, 8),
    shelfLevels: clamp(Math.round(Number(input.shelfLevels ?? base.shelfLevels ?? 0)), 0, 12),
    palette: input.palette ? { ...base.palette, ...input.palette } : base.palette,
    color3d: input.color3d ?? base.color3d,
    badge3d: input.badge3d ?? base.badge3d,
    emissive3d: input.emissive3d ?? base.emissive3d,
    tag2d: input.tag2d ?? base.tag2d,
    opacity3d: input.opacity3d != null ? clamp(Number(input.opacity3d), 0.05, 1) : base.opacity3d,
    monitorCapability: input.monitorCapability ?? base.monitorCapability,
    monitorMetrics: Array.isArray(input.monitorMetrics) ? [...input.monitorMetrics] : base.monitorMetrics
  };
}

function normalizeStoreProfiles(input) {
  const base = structuredClone(DEFAULT_STORE_PROFILES);
  if (!input || typeof input !== "object") return base;

  base.version = input.version || 1;
  base.updatedAt = input.updatedAt || new Date().toISOString();
  base.planner = {
    ...base.planner,
    ...(input.planner || {}),
    wallHeightMeters: clamp(Number(input.planner?.wallHeightMeters ?? base.planner.wallHeightMeters), 2, 6),
    wallThicknessMeters: clamp(Number(input.planner?.wallThicknessMeters ?? base.planner.wallThicknessMeters), 0.05, 0.5),
    layoutGapMeters: clamp(Number(input.planner?.layoutGapMeters ?? base.planner.layoutGapMeters), 0, 2)
  };

  base.artifacts = {};
  Object.keys(DEFAULT_ARTIFACTS).forEach((kind) => {
    base.artifacts[kind] = normalizeArtifact(kind, input.artifacts?.[kind], DEFAULT_ARTIFACTS[kind]);
  });

  base.costs = { ...base.costs, ...(input.costs || {}) };
  base.bespoke = {
    ...base.bespoke,
    ...(input.bespoke || {}),
    areaDivisors: { ...base.bespoke.areaDivisors, ...(input.bespoke?.areaDivisors || {}) },
    mins: { ...base.bespoke.mins, ...(input.bespoke?.mins || {}) },
    maxs: { ...base.bespoke.maxs, ...(input.bespoke?.maxs || {}) }
  };

  Object.keys(base.profiles).forEach((id) => {
    if (input.profiles?.[id]) {
      base.profiles[id] = {
        ...base.profiles[id],
        ...input.profiles[id],
        id,
        shelves: {
          ...(base.profiles[id].shelves || {}),
          ...(input.profiles[id].shelves || {})
        }
      };
    }
  });

  return base;
}

function shelvesForBespoke(config, widthMeters, heightMeters) {
  const area = widthMeters * heightMeters;
  const b = config.bespoke;
  return {
    ambient: clamp(Math.round(area / b.areaDivisors.ambient), b.mins.ambient, b.maxs.ambient),
    cold: clamp(Math.round(area / b.areaDivisors.cold), b.mins.cold, b.maxs.cold),
    hot: clamp(Math.round(area / b.areaDivisors.hot), b.mins.hot, b.maxs.hot)
  };
}

function resolveProfile(config, profileId, options = {}) {
  const profile = config.profiles[profileId];
  if (!profile) return null;

  let widthMeters = profile.widthMeters;
  let heightMeters = profile.heightMeters;
  let shelves = profile.shelves ? { ...profile.shelves } : null;

  if (profile.dynamicSize) {
    widthMeters = clamp(Number(options.widthMeters) || 18, 5, 200);
    heightMeters = clamp(Number(options.heightMeters) || 14, 5, 200);
    shelves = shelvesForBespoke(config, widthMeters, heightMeters);
  }

  if (!shelves) return null;

  return {
    profile,
    widthMeters,
    heightMeters,
    areaSqm: widthMeters * heightMeters,
    shelves
  };
}

function buildSourcingPayload(config, profileId, options = {}) {
  const resolved = resolveProfile(config, profileId, options);
  if (!resolved) return null;

  const { profile, widthMeters, heightMeters, areaSqm, shelves } = resolved;
  const costs = config.costs;
  const shelfCount = shelves.ambient + shelves.cold + shelves.hot;

  const elements = [
    {
      sku: "SHELF-AMBIENT",
      type: "ambient",
      category: "shelf",
      label: "Ambient gondola shelf",
      quantity: shelves.ambient,
      unitCostEur: costs.ambientShelf,
      lineTotalEur: shelves.ambient * costs.ambientShelf
    },
    {
      sku: "SHELF-COLD",
      type: "cold",
      category: "shelf",
      label: "Cold refrigerated shelf",
      quantity: shelves.cold,
      unitCostEur: costs.coldShelf,
      lineTotalEur: shelves.cold * costs.coldShelf
    },
    {
      sku: "SHELF-HOT",
      type: "hot",
      category: "shelf",
      label: "Hot prepared-food shelf",
      quantity: shelves.hot,
      unitCostEur: costs.hotShelf,
      lineTotalEur: shelves.hot * costs.hotShelf
    },
    {
      sku: "INSTALL-SHELF",
      type: "service",
      category: "installation",
      label: "Shelf installation",
      quantity: shelfCount,
      unitCostEur: costs.installPerShelf,
      lineTotalEur: shelfCount * costs.installPerShelf
    },
    {
      sku: "INTEGRATION-FIXED",
      type: "service",
      category: "integration",
      label: "Fixed store integration",
      quantity: 1,
      unitCostEur: profile.integrationFixed,
      lineTotalEur: profile.integrationFixed
    }
  ];

  const shelfSubtotal = elements.slice(0, 3).reduce((sum, item) => sum + item.lineTotalEur, 0);
  const installSubtotal = elements[3].lineTotalEur;
  const integrationSubtotal = elements[4].lineTotalEur;
  const baseSubtotal = shelfSubtotal + installSubtotal + integrationSubtotal;
  const setupEur = baseSubtotal * (profile.setupPercent / 100);
  const contingencyEur = (baseSubtotal + setupEur) * (profile.contingencyPercent / 100);
  const capexEur = baseSubtotal + setupEur + contingencyEur;

  return {
    profileId,
    profileLabel: profile.label,
    profileBlurb: profile.blurb,
    footprint: { widthMeters, heightMeters, areaSqm },
    shelves,
    costs: { ...costs },
    elements,
    summary: {
      shelfSubtotalEur: shelfSubtotal,
      installSubtotalEur: installSubtotal,
      integrationSubtotalEur: integrationSubtotal,
      baseSubtotalEur: baseSubtotal,
      setupPercent: profile.setupPercent,
      setupEur,
      contingencyPercent: profile.contingencyPercent,
      contingencyEur,
      capexEur,
      capexPerSqmEur: capexEur / Math.max(1, areaSqm)
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  DATA_PATH,
  DEFAULT_STORE_PROFILES,
  DEFAULT_PLANNER,
  DEFAULT_ARTIFACTS,
  loadStoreProfiles,
  saveStoreProfiles,
  normalizeStoreProfiles,
  resolveProfile,
  buildSourcingPayload
};
