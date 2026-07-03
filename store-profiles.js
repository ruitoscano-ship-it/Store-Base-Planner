const fs = require("fs");
const path = require("path");
const {
  estimateStoreCapex,
  mergeAssumptionsWithOverrides
} = require("./planner-sensei-cost");

const DATA_PATH = path.join(__dirname, "data", "store-profiles.json");
const SENSEI_ASSUMPTIONS_PATH = path.join(__dirname, "data", "sensei-setup-assumptions.json");

const DEFAULT_PLANNER = {
  wallHeightMeters: 2.8,
  wallThicknessMeters: 0.12,
  layoutGapMeters: 0.15
};

const DEFAULT_ARTIFACTS = {
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
    label: "Back office / MEP",
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
    label: "Service counter zone",
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

const LEGACY_ARTIFACTS = {
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

function getAllArtifacts() {
  return { ...DEFAULT_ARTIFACTS, ...LEGACY_ARTIFACTS };
}

const DEFAULT_SENSEI_DEFAULTS = {
  projectType: "full",
  format: "auto",
  country: "PT",
  uplink: "Wired + 5G",
  useRefurbished: false,
  addSpare: false,
  scaleDiscount: 0,
  hasExternalTeam: false,
  pctRef: null
};

const DEFAULT_SENSEI_PRICING_OVERRIDES = {
  cameraUnitPrice: 47.54,
  bridgeUnitPrice: 66.97,
  camerasSpare: 0.05,
  scalesSpare: 0.05
};

const DEFAULT_STORE_PROFILES = {
  version: 2,
  updatedAt: new Date().toISOString(),
  planner: structuredClone(DEFAULT_PLANNER),
  artifacts: structuredClone(DEFAULT_ARTIFACTS),
  senseiDefaults: structuredClone(DEFAULT_SENSEI_DEFAULTS),
  senseiPricingOverrides: structuredClone(DEFAULT_SENSEI_PRICING_OVERRIDES),
  bespoke: {
    areaDivisors: { ambient: 13, cold: 32, hot: 45 },
    mins: { ambient: 12, cold: 4, hot: 2 },
    maxs: { ambient: 80, cold: 28, hot: 16 }
  },
  profiles: {
    small: {
      id: "small",
      label: "Small",
      blurb: "~100 m² convenience / kiosk",
      widthMeters: 10,
      heightMeters: 10,
      shelves: { ambient: 10, cold: 4, hot: 2 }
    },
    medium: {
      id: "medium",
      label: "Medium",
      blurb: "~250 m² neighbourhood store",
      widthMeters: 18,
      heightMeters: 14,
      shelves: { ambient: 18, cold: 8, hot: 4 }
    },
    large: {
      id: "large",
      label: "Large",
      blurb: "~620 m² supermarket format",
      widthMeters: 28,
      heightMeters: 22,
      shelves: { ambient: 34, cold: 16, hot: 8 }
    },
    xlarge: {
      id: "xlarge",
      label: "X-Large",
      blurb: "~1,200 m² hypermarket / flagship",
      widthMeters: 40,
      heightMeters: 30,
      shelves: { ambient: 52, cold: 24, hot: 14 }
    },
    bespoke: {
      id: "bespoke",
      label: "Bespoke",
      blurb: "Uses custom width/depth · layout derived from area divisors",
      dynamicSize: true
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
    gatePalette: input.gatePalette ?? base.gatePalette,
    monitorCapability: input.monitorCapability ?? base.monitorCapability,
    monitorMetrics: Array.isArray(input.monitorMetrics) ? [...input.monitorMetrics] : base.monitorMetrics
  };
}

function normalizeStoreProfiles(input) {
  const base = structuredClone(DEFAULT_STORE_PROFILES);
  if (!input || typeof input !== "object") return base;

  base.version = 2;
  base.updatedAt = input.updatedAt || new Date().toISOString();
  base.planner = {
    ...base.planner,
    ...(input.planner || {}),
    wallHeightMeters: clamp(Number(input.planner?.wallHeightMeters ?? base.planner.wallHeightMeters), 2, 6),
    wallThicknessMeters: clamp(Number(input.planner?.wallThicknessMeters ?? base.planner.wallThicknessMeters), 0.05, 0.5),
    layoutGapMeters: clamp(Number(input.planner?.layoutGapMeters ?? base.planner.layoutGapMeters), 0, 2)
  };

  base.artifacts = {};
  Object.keys(getAllArtifacts()).forEach((kind) => {
    base.artifacts[kind] = normalizeArtifact(kind, input.artifacts?.[kind], getAllArtifacts()[kind]);
  });

  base.senseiDefaults = {
    ...DEFAULT_SENSEI_DEFAULTS,
    ...(input.senseiDefaults || {})
  };
  delete base.senseiDefaults.setupPercent;
  delete base.senseiDefaults.contingencyPercent;
  base.senseiPricingOverrides = {
    ...DEFAULT_SENSEI_PRICING_OVERRIDES,
    ...(base.senseiPricingOverrides || {}),
    ...(input.senseiPricingOverrides || {})
  };
  base.bespoke = {
    ...base.bespoke,
    ...(input.bespoke || {}),
    areaDivisors: { ...base.bespoke.areaDivisors, ...(input.bespoke?.areaDivisors || {}) },
    mins: { ...base.bespoke.mins, ...(input.bespoke?.mins || {}) },
    maxs: { ...base.bespoke.maxs, ...(input.bespoke?.maxs || {}) }
  };

  Object.keys(base.profiles).forEach((id) => {
    if (input.profiles?.[id]) {
      const { integrationFixed, setupPercent, contingencyPercent, ...profileRest } = input.profiles[id];
      base.profiles[id] = {
        ...base.profiles[id],
        ...profileRest,
        id,
        shelves: {
          ...(base.profiles[id].shelves || {}),
          ...(input.profiles[id].shelves || {})
        }
      };
    }
    delete base.profiles[id].integrationFixed;
    delete base.profiles[id].setupPercent;
    delete base.profiles[id].contingencyPercent;
  });

  delete base.costs;
  if (base.bespoke) {
    delete base.bespoke.integrationFixed;
    delete base.bespoke.setupPercent;
    delete base.bespoke.contingencyPercent;
  }

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

function loadSenseiAssumptions(config) {
  ensureDataDir();
  if (!fs.existsSync(SENSEI_ASSUMPTIONS_PATH)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(SENSEI_ASSUMPTIONS_PATH, "utf8"));
    return mergeAssumptionsWithOverrides(parsed, config?.senseiPricingOverrides || {});
  } catch (_error) {
    return null;
  }
}

function buildSenseiPricingOptions(config, options = {}) {
  const defaults = { ...DEFAULT_SENSEI_DEFAULTS, ...(config.senseiDefaults || {}) };
  return {
    format: options.format || defaults.format || "auto",
    projectType: options.projectType || defaults.projectType || "full",
    country: options.country || defaults.country || "PT",
    uplink: options.uplink || defaults.uplink || "Wired + 5G",
    useRefurbished: options.useRefurbished != null ? Boolean(options.useRefurbished) : Boolean(defaults.useRefurbished),
    addSpare: options.addSpare != null ? Boolean(options.addSpare) : Boolean(defaults.addSpare),
    scaleDiscount: Number(options.scaleDiscount ?? defaults.scaleDiscount) || 0,
    hasExternalTeam:
      options.hasExternalTeam != null ? Boolean(options.hasExternalTeam) : Boolean(defaults.hasExternalTeam),
    pctRef: options.pctRef != null ? options.pctRef : defaults.pctRef
  };
}

function buildSourcingPayload(config, profileId, options = {}) {
  const resolved = resolveProfile(config, profileId, options);
  if (!resolved) return null;

  const { profile, widthMeters, heightMeters, areaSqm, shelves } = resolved;
  const assumptions = loadSenseiAssumptions(config);
  if (!assumptions) return null;

  const pricingOptions = buildSenseiPricingOptions(config, options);
  const coldTotal = shelves.cold || 0;
  const moduleTotal = (shelves.ambient || 0) + coldTotal + (shelves.hot || 0);
  if (pricingOptions.pctRef == null && moduleTotal > 0) {
    pricingOptions.pctRef = coldTotal / moduleTotal;
  }

  const sensei = estimateStoreCapex(
    assumptions,
    {
      widthMeters,
      heightMeters,
      counts: {
        ambient: shelves.ambient || 0,
        cold: shelves.cold || 0,
        hot: shelves.hot || 0,
        island: 0
      },
      doors: Math.max(1, Number(options.doors) || 1)
    },
    pricingOptions
  );

  if (sensei.error) return null;

  const flatElements = [];
  Object.entries(sensei.bom || {}).forEach(([group, items]) => {
    (items || []).forEach((item) => {
      flatElements.push({
        sku: item.sku,
        type: group,
        category: group,
        label: item.label,
        quantity: item.qty,
        unitCostEur: item.price,
        lineTotalEur: item.total
      });
    });
  });

  return {
    profileId,
    profileLabel: profile.label,
    profileBlurb: profile.blurb,
    footprint: { widthMeters, heightMeters, areaSqm },
    shelves,
    estimator: "sensei",
    format: sensei.format,
    quantities: sensei.quantities,
    elements: flatElements,
    summary: {
      ...sensei.summary,
      capexPerSqmEur: sensei.summary.capexEur / Math.max(1, areaSqm)
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  DATA_PATH,
  SENSEI_ASSUMPTIONS_PATH,
  DEFAULT_STORE_PROFILES,
  DEFAULT_PLANNER,
  DEFAULT_ARTIFACTS,
  DEFAULT_SENSEI_DEFAULTS,
  DEFAULT_SENSEI_PRICING_OVERRIDES,
  LEGACY_ARTIFACTS,
  getAllArtifacts,
  loadStoreProfiles,
  saveStoreProfiles,
  normalizeStoreProfiles,
  resolveProfile,
  loadSenseiAssumptions,
  buildSenseiPricingOptions,
  buildSourcingPayload
};
