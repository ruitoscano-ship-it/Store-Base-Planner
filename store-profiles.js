const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "data", "store-profiles.json");

const DEFAULT_STORE_PROFILES = {
  version: 1,
  updatedAt: new Date().toISOString(),
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

function normalizeStoreProfiles(input) {
  const base = structuredClone(DEFAULT_STORE_PROFILES);
  if (!input || typeof input !== "object") return base;

  base.version = input.version || 1;
  base.updatedAt = input.updatedAt || new Date().toISOString();
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
  loadStoreProfiles,
  saveStoreProfiles,
  normalizeStoreProfiles,
  resolveProfile,
  buildSourcingPayload
};
