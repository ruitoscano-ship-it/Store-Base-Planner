/** Sensei Setup Calculator rules — shared by store planner and sourcing API. */

const STORE_FORMATS = ["Supermercado", "Conveniência", "POD", "Corner"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function inferStoreFormat(areaSqm) {
  if (areaSqm <= 50) return "POD";
  if (areaSqm <= 150) return "Corner";
  if (areaSqm <= 800) return "Conveniência";
  return "Supermercado";
}

function deriveLayoutInputs({
  widthMeters,
  heightMeters,
  counts = {},
  doors = 0,
  options = {}
}) {
  const area = Math.max(1, Number(widthMeters) * Number(heightMeters));
  // Every merchandised bay is a monitored module: dry/cold/hot gondolas and
  // islands, plus produce displays and assisted-service / self-service counters
  // (deli, bakery, fish, coffee, juice). They all drive shelf cameras + bridges.
  const gondolaModules =
    (counts.ambient || 0) + (counts.cold || 0) + (counts.hot || 0) + (counts.island || 0);
  const modules = Math.max(
    0,
    gondolaModules + (counts.produce || 0) + (counts.service || 0)
  );
  const shelfModules = Math.max(1, modules);
  const inferredPctRef = (counts.cold || 0) / Math.max(1, gondolaModules);
  const format =
    options.format && options.format !== "auto" ? options.format : inferStoreFormat(area);

  return {
    format,
    area,
    modules: modules || Math.max(1, Math.round(area * (options.assumptions?.formatDefaults?.[format]?.modulesPerM2 || 0.25))),
    doors: Math.max(1, doors || 1),
    pctRef:
      options.pctRef != null && !Number.isNaN(Number(options.pctRef))
        ? clamp(Number(options.pctRef), 0, 1)
        : clamp(inferredPctRef || options.assumptions?.formatDefaults?.[format]?.pctRef || 0.3, 0, 1)
  };
}

function pickServerModel(assumptions, { area, useRefurbished, srvModelId }) {
  const models = assumptions.servers?.models || [];
  if (srvModelId) {
    return models.find((m) => m.id === srvModelId) || models[0];
  }
  const useSmall = area <= (assumptions.servers?.smallThreshold || 40);
  const condition = useRefurbished ? "refurbished" : "new";
  const flag = useRefurbished ? "activeRefurb" : "activeNew";
  return (
    models.find((m) => Boolean(m.isSmall) === useSmall && m.condition === condition && m[flag]) ||
    models.find((m) => m[flag]) ||
    models.find((m) => m.activeNew || m.activeRefurb) ||
    models[0]
  );
}

function autoCalc(assumptions, input) {
  const {
    format,
    area,
    modules,
    doors,
    projectType = "full",
    useRefurbished = false,
    addSpare = false,
    srvModelId = null,
    overrides = {}
  } = input;
  const isPT = projectType === "tracking";
  const cameras = assumptions.cameras || {};
  const cam21 =
    overrides.cam21 != null
      ? Number(overrides.cam21)
      : Math.ceil(area * (cameras["CAM-21-TPT"]?.ratios?.[format] || 0));
  const cam28pt =
    overrides.cam28pt != null
      ? Number(overrides.cam28pt)
      : Math.ceil(area * (cameras["CAM-28-PT"]?.ratios?.[format] || 0));
  const cam28door = overrides.cam28door != null ? Number(overrides.cam28door) : Math.ceil(doors);
  const camSpare = 1 + (assumptions.camerasSpare || 0);
  const scaleSpare = 1 + (assumptions.scalesSpare || 0);
  const cam36sm = isPT ? 0 : overrides.cam36sm != null ? Number(overrides.cam36sm) : Math.ceil(modules * camSpare);
  const cam36stv = isPT ? 0 : overrides.cam36stv != null ? Number(overrides.cam36stv) : Math.ceil(modules * camSpare);
  const totalScales =
    isPT || overrides.totalScales != null
      ? Number(overrides.totalScales || 0)
      : Math.ceil(area * (assumptions.scalesPerM2?.[format] || 1.68) * scaleSpare);

  const model = pickServerModel(assumptions, { area, useRefurbished, srvModelId });
  const r = model?.ratios || assumptions.servers?.ratios || {};
  const buf = assumptions.servers?.buffer ?? 0.05;
  const pctSpares = assumptions.servers?.spares ?? 0.05;
  const useSmall = area <= (assumptions.servers?.smallThreshold || 40);
  const vramPerGPU = model?.vramPerGPU || 16;

  if (area > 2000) {
    return {
      _areaError: true,
      cam21,
      cam28pt,
      cam28door,
      cam36sm,
      cam36stv,
      totalCams: cam21 + cam28pt + cam28door + cam36sm + cam36stv,
      totalScales,
      numSrv: 0,
      srvModel: model?.id || null,
      _nSrvRaw: 0
    };
  }

  const tier = area <= 50 ? 1 : area <= 500 ? 2 : 3;
  const camTracking = cam21 + cam28pt + cam28door;
  const camShelf = isPT ? 0 : cam36sm;
  const storeCapPM2 = assumptions.formatDefaults?.[format]?.storeCapPM2 || 0.3;
  const inhand = isPT ? 0 : Math.round(area * storeCapPM2 * 0.1);

  const vramShelf = useSmall || isPT ? 0 : r[`vramShelfT${tier}`] ?? 0;
  const vramInhand = useSmall || isPT ? 0 : r[`vramInhandT${tier}`] ?? 0;
  const vramShelfIntel = useSmall || isPT ? 0 : r[`vramShelfIntelT${tier}`] ?? 0;
  const cpuShelfConst = useSmall || isPT ? 0 : r[`cpuShelfConstT${tier}`] ?? 0;
  const cpuInhandConst = useSmall || isPT ? 0 : r[`cpuInhandConstT${tier}`] ?? 0;
  const cpuShelfIntelConst = useSmall || isPT ? 0 : r[`cpuShelfIntelConstT${tier}`] ?? 0;
  const ramShelfConst = useSmall || isPT ? 0 : r[`ramShelfConstT${tier}`] ?? 0;
  const ramInhandConst = useSmall || isPT ? 0 : r[`ramInhandConstT${tier}`] ?? 0;
  const ramShelfIntelConst = useSmall || isPT ? 0 : r[`ramShelfIntelConstT${tier}`] ?? 0;

  const sc_gpu_t = Math.ceil(camTracking / (r.gpuTracking || 35) / (1 - buf));
  const vramShared = vramShelf + vramInhand + vramShelfIntel;
  const sc_gpu_si = useSmall ? 0 : Math.ceil(vramShared / vramPerGPU);
  const sc_gpu_total = sc_gpu_t + sc_gpu_si;

  const sc_cpu_t = Math.ceil(camTracking / (r.cpuTracking || 1.64) / (1 - buf));
  const sc_cpu_s = Math.ceil(camShelf / (r.cpuShelf || 2.85) + cpuShelfConst);
  const sc_cpu_i = Math.ceil(inhand / (r.cpuInhand || 2.85) + cpuInhandConst);
  const sc_cpu_si = useSmall ? 0 : cpuShelfIntelConst;
  const sc_cpu_total = sc_cpu_t + sc_cpu_s + sc_cpu_i + sc_cpu_si;

  const sc_ram_t = Math.ceil(camTracking / (r.ramTracking || 2.39));
  const sc_ram_s = useSmall ? 0 : Math.ceil(camShelf / (r.ramShelf || 1.5) + ramShelfConst);
  const sc_ram_i = useSmall ? 0 : ramInhandConst;
  const sc_ram_si = useSmall ? 0 : ramShelfIntelConst;
  const sc_ram_total = sc_ram_t + sc_ram_s + sc_ram_i + sc_ram_si;

  const frac_gpu = sc_gpu_total / (model?.gpus || 5);
  const frac_cpu = sc_cpu_total / (model?.cpuThreads || 96);
  const frac_ram = sc_ram_total / (model?.ramGB || 128);
  let nSrv = Math.max(1, Math.ceil(Math.max(frac_gpu, frac_cpu, frac_ram)));
  const nSrvRaw = nSrv;
  if (nSrv === 2 && !useSmall) nSrv = 3;
  const nSpares = addSpare ? Math.ceil(nSrv * pctSpares) : 0;

  return {
    cam21,
    cam28pt,
    cam28door,
    cam36sm,
    cam36stv,
    totalCams: cam21 + cam28pt + cam28door + cam36sm + cam36stv,
    totalScales,
    numSrv: nSrv + nSpares,
    srvModel: model?.id || null,
    _nSrvRaw: nSrvRaw,
    _isPT: isPT,
    _model: model
  };
}

function buildScaleBOM(assumptions, { format, pctRef, totalScales, scaleDiscount = 0 }) {
  if (!totalScales) return { items: [], total: 0 };
  const baseMix = assumptions.scaleMix?.[format] || assumptions.scaleMix?.Supermercado || {};
  const allRefs = Object.keys(assumptions.scalePrices || {});
  const ambRefs = allRefs.filter((r) => r.includes("-AB-"));
  const frioRefs = allRefs.filter((r) => r.includes("-WB-"));
  const effectivePctRef = clamp(Number(pctRef) || 0.3, 0, 1);
  const ambSum = ambRefs.reduce((sum, ref) => sum + (baseMix[ref] || 0), 0);
  const frioSum = frioRefs.reduce((sum, ref) => sum + (baseMix[ref] || 0), 0);
  const scalesFrio = Math.round(totalScales * effectivePctRef);
  const scalesAmb = totalScales - scalesFrio;
  const items = [];

  if (ambSum > 0 && scalesAmb > 0) {
    ambRefs.forEach((ref) => {
      const weight = (baseMix[ref] || 0) / ambSum;
      if (weight <= 0) return;
      const qty = Math.round(scalesAmb * weight);
      if (qty <= 0) return;
      const price = assumptions.scalePrices[ref] || 0;
      items.push({ sku: ref, label: assumptions.scaleLabels?.[ref] || ref, qty, price, total: qty * price });
    });
  }
  if (frioSum > 0 && scalesFrio > 0) {
    frioRefs.forEach((ref) => {
      const weight = (baseMix[ref] || 0) / frioSum;
      if (weight <= 0) return;
      const qty = Math.round(scalesFrio * weight);
      if (qty <= 0) return;
      const price = assumptions.scalePrices[ref] || 0;
      items.push({ sku: ref, label: assumptions.scaleLabels?.[ref] || ref, qty, price, total: qty * price });
    });
  }

  let total = items.reduce((sum, item) => sum + item.total, 0);
  if (scaleDiscount > 0) total = Math.round(total * (1 - scaleDiscount / 100));
  return { items, total };
}

function buildNetworkingBOM(assumptions, eff) {
  const net = assumptions.networking || {};
  const pr = net.prices || {};
  const pcp = net.patchCordPrices || {};
  const isPT = eff.projectType === "tracking";
  const sw24 = net.switches?.find((s) => s.ports === 24) || { price: 864 };
  const sw48 = net.switches?.find((s) => s.ports === 48) || { price: 1179 };
  const scaleSpare = 1 + (assumptions.scalesSpare || 0);
  const bridges = isPT ? 0 : Math.ceil(eff.modules * (assumptions.bridge?.modulesFactor || 0.73) * scaleSpare);
  const trackingCams = eff.cam21 + eff.cam28pt + eff.cam28door;
  const camSwQ = Math.ceil(trackingCams / 46);
  const srvPortsCore = eff.numSrv === 1 ? 2 : eff.numSrv;
  const corePortsNeeded = camSwQ + 1 + bridges + srvPortsCore;
  let coreRem = corePortsNeeded;
  const coreSw48Q = Math.floor(coreRem / 48);
  coreRem -= coreSw48Q * 48;
  const coreSw24Q = coreRem > 0 ? Math.ceil(coreRem / 24) : 0;
  const items = [];
  let total = 0;

  const add = (sku, label, qty, price) => {
    if (!qty || !price) return;
    items.push({ sku, label, qty, price, total: qty * price });
    total += qty * price;
  };

  add(sw48.id || "ARUBA48", `${sw48.label || "Aruba 48p"} (cameras)`, camSwQ, sw48.price);
  add(`${sw48.id || "ARUBA48"}_core`, `${sw48.label || "Aruba 48p"} (core)`, coreSw48Q, sw48.price);
  add(`${sw24.id || "ARUBA24"}_core`, `${sw24.label || "Aruba 24p"} (core)`, coreSw24Q, sw24.price);

  const uplink = eff.uplink || "Wired Only";
  if (uplink === "Wired Only" || uplink === "Wired + 5G") add("RUTX08", "Teltonika RUTX08", 1, pr.RUTX08 || 0);
  if (uplink === "Wired + 5G") add("RUT241", "Teltonika RUT241 (5G backup)", 1, pr.RUT241 || 0);

  const pp48Q = Math.ceil((camSwQ + coreSw48Q + coreSw24Q) / 2);
  add("PP48", "Patch Panel 48G Cat5e", pp48Q, net.patchPrice || 0);
  add("PC050", "Patch Cords 0.50m", Math.ceil(trackingCams * 1.1), pcp.c050 || 0);
  add("PC300", "Patch Cords 3.00m", Math.ceil(bridges + eff.numSrv * 2 + eff.doors), pcp.c300 || 0);
  if (eff.numSrv >= 3) add("DAC3", "DAC 3m (servers)", eff.numSrv + 1, pcp.DAC3 || 0);

  return { items, total, bridges };
}

function calcHardwareBOM(assumptions, eff) {
  const isPT = eff.projectType === "tracking";
  const groups = {};
  const cameras = assumptions.cameras || {};

  const camItems = [
    ["CAM-21-TPT", eff.cam21],
    ["CAM-28-PT", eff.cam28pt],
    ["CAM-28-DOOR", eff.cam28door],
    ["CAM-36-SM", isPT ? 0 : eff.cam36sm],
    ["CAM-36-STV", isPT ? 0 : eff.cam36stv]
  ]
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({
      sku: id,
      label: cameras[id]?.label || id,
      qty,
      price: cameras[id]?.price || 0,
      total: qty * (cameras[id]?.price || 0)
    }));

  groups.cameras = camItems;
  const scaleGroup = buildScaleBOM(assumptions, eff);
  groups.scales = scaleGroup.items;

  const model =
    assumptions.servers?.models?.find((m) => m.id === eff.srvModel) ||
    pickServerModel(assumptions, { area: eff.area, useRefurbished: eff.useRefurbished, srvModelId: eff.srvModel });
  groups.servers = model
    ? [
        {
          sku: model.id,
          label: `${model.label} × ${eff.numSrv}`,
          qty: eff.numSrv,
          price: model.price,
          total: eff.numSrv * model.price
        }
      ]
    : [];

  const net = buildNetworkingBOM(assumptions, eff);
  groups.networking = net.items;

  if (!isPT) {
    const bridgeQty = net.bridges || 0;
    const bridgeItems = [];
    if (bridgeQty > 0) {
      bridgeItems.push({
        sku: "BRIDGE",
        label: "SENSEI Smart Bridge",
        qty: bridgeQty,
        price: assumptions.bridge?.unitPrice || 66.97,
        total: Math.round(bridgeQty * (assumptions.bridge?.unitPrice || 66.97))
      });
      const adapters = Math.ceil(bridgeQty * (assumptions.bridge?.adaptersPerBridge || 0.086));
      if (adapters > 0) {
        bridgeItems.push({
          sku: "BRIDGE_AD",
          label: "F-Bridge Adapter",
          qty: adapters,
          price: assumptions.bridge?.adapterPrice || 1.32,
          total: Math.round(adapters * (assumptions.bridge?.adapterPrice || 1.32) * 100) / 100
        });
      }
    }
    groups.scales = [...groups.scales, ...bridgeItems];
    if (eff.doors > 0) {
      groups.peripherals = [
        {
          sku: "IOC",
          label: "IO Controller (gates)",
          qty: Math.ceil(eff.doors * 1.1),
          price: assumptions.peripherals?.gateIoController || 142,
          total: Math.ceil(eff.doors * 1.1) * (assumptions.peripherals?.gateIoController || 142)
        },
        {
          sku: "QRC",
          label: "QR Code Reader",
          qty: Math.ceil(eff.doors * 1.1),
          price: assumptions.peripherals?.gateQrReader || 104,
          total: Math.ceil(eff.doors * 1.1) * (assumptions.peripherals?.gateQrReader || 104)
        },
        {
          sku: "ARU",
          label: "Aruco Cube (calibration)",
          qty: 1,
          price: assumptions.peripherals?.arucoCube || 491,
          total: assumptions.peripherals?.arucoCube || 491
        }
      ];
    }
  }

  const sumGroup = (items) => (items || []).reduce((sum, item) => sum + item.total, 0);
  const hardwareTotal =
    sumGroup(groups.cameras) +
    sumGroup(groups.scales) +
    sumGroup(groups.servers) +
    sumGroup(groups.networking) +
    sumGroup(groups.peripherals);

  return { groups, hardwareTotal, scaleTotal: scaleGroup.total };
}

function estimateInstallation(assumptions, eff, options = {}) {
  const sc = assumptions.schedule || {};
  const rates = assumptions.installationRates || {};
  const country = options.country || "PT";
  const rateTable = rates[country] || rates.ROW || { internal: 120, external: 320 };
  const dailyRate = options.hasExternalTeam ? rateTable.external : rateTable.internal;
  const hpd = sc.hoursPerDay || 8;
  const isPT = eff.projectType === "tracking";

  const swCount =
    Math.ceil((eff.cam21 + eff.cam28pt + eff.cam28door) / 46) +
    Math.ceil((Math.ceil((eff.cam21 + eff.cam28pt + eff.cam28door) / 46) + 1 + (eff._bridges || 0) + (eff.numSrv === 1 ? 2 : eff.numSrv)) / 48);

  let hours =
    eff.numSrv * (sc.c1_server_h || 0.5) +
    swCount * (sc.c1_switch_h || 0.1) +
    2 * (sc.c1_patch_h || 0.25) +
    eff.totalCams * ((sc.c2_place_h || 0) + (sc.c2_cable_h || 0) + (sc.c2_angle_h || 0) + (sc.c2_sample_h || 0)) +
    (sc.c5_base || 0) +
    eff.area * (sc.c5_system_h || 0);

  if (!isPT) {
    hours +=
      eff.totalScales * ((sc.c3_install_h || 0) + (sc.c3_diag_h || 0) + (sc.c3_repair_h || 0) + (sc.c4_calib_h || 0) + (sc.c4_planogram_h || 0)) +
      (sc.c3_diag_base || 0);
  }

  const days = hours / hpd;
  return Math.round(days * dailyRate);
}

function mergeAssumptionsWithOverrides(assumptions, overrides = {}) {
  if (!overrides || typeof overrides !== "object") return assumptions;
  const merged = structuredClone(assumptions);
  if (overrides.camerasSpare != null) merged.camerasSpare = Number(overrides.camerasSpare);
  if (overrides.scalesSpare != null) merged.scalesSpare = Number(overrides.scalesSpare);
  if (overrides.cameraUnitPrice != null) {
    const price = Number(overrides.cameraUnitPrice);
    Object.keys(merged.cameras || {}).forEach((id) => {
      merged.cameras[id].price = price;
    });
  }
  if (overrides.bridgeUnitPrice != null && merged.bridge) {
    merged.bridge.unitPrice = Number(overrides.bridgeUnitPrice);
  }
  if (overrides.scalesPerM2 && typeof overrides.scalesPerM2 === "object") {
    merged.scalesPerM2 = { ...merged.scalesPerM2, ...overrides.scalesPerM2 };
  }
  if (overrides.scalePrices && typeof overrides.scalePrices === "object") {
    merged.scalePrices = { ...merged.scalePrices, ...overrides.scalePrices };
  }
  return merged;
}

function estimateStoreCapex(assumptions, layout, pricingOptions = {}) {
  const derived = deriveLayoutInputs({
    widthMeters: layout.widthMeters,
    heightMeters: layout.heightMeters,
    counts: layout.counts || {},
    doors: layout.doors || 0,
    options: { ...pricingOptions, assumptions }
  });

  const auto = autoCalc(assumptions, {
    ...derived,
    projectType: pricingOptions.projectType || "full",
    useRefurbished: Boolean(pricingOptions.useRefurbished),
    addSpare: Boolean(pricingOptions.addSpare),
    srvModelId: pricingOptions.srvModelId || null,
    overrides: pricingOptions.overrides || {}
  });

  if (auto._areaError) {
    return {
      error: "Store area exceeds 2,000 m² limit in Setup Calculator rules.",
      areaSqm: derived.area,
      format: derived.format
    };
  }

  const effective = {
    ...derived,
    ...auto,
    country: pricingOptions.country || "PT",
    projectType: pricingOptions.projectType || "full",
    useRefurbished: Boolean(pricingOptions.useRefurbished),
    uplink: pricingOptions.uplink || "Wired + 5G",
    scaleDiscount: Number(pricingOptions.scaleDiscount) || 0,
    hasExternalTeam: Boolean(pricingOptions.hasExternalTeam),
    doors: derived.doors
  };

  const hardware = calcHardwareBOM(assumptions, effective);
  effective._bridges = buildNetworkingBOM(assumptions, effective).bridges;
  const installationTotal = estimateInstallation(assumptions, effective, pricingOptions);
  const hardwareSubtotal = hardware.hardwareTotal;
  const capexEur = hardwareSubtotal + installationTotal;
  const areaSqm = derived.area;

  return {
    format: derived.format,
    areaSqm,
    modules: derived.modules,
    doors: derived.doors,
    pctRef: derived.pctRef,
    quantities: {
      cam21: effective.cam21,
      cam28pt: effective.cam28pt,
      cam28door: effective.cam28door,
      cam36sm: effective.cam36sm,
      cam36stv: effective.cam36stv,
      totalCams: effective.totalCams,
      totalScales: effective.totalScales,
      numSrv: effective.numSrv,
      srvModel: effective.srvModel
    },
    bom: hardware.groups,
    summary: {
      hardwareSubtotalEur: hardwareSubtotal,
      scalesSubtotalEur: hardware.scaleTotal,
      installationSubtotalEur: installationTotal,
      capexEur,
      capexPerSqmEur: capexEur / Math.max(1, areaSqm)
    }
  };
}

const PlannerSenseiCost = {
  STORE_FORMATS,
  inferStoreFormat,
  deriveLayoutInputs,
  autoCalc,
  calcHardwareBOM,
  mergeAssumptionsWithOverrides,
  estimateStoreCapex
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = PlannerSenseiCost;
}
if (typeof globalThis !== "undefined") {
  globalThis.PlannerSenseiCost = PlannerSenseiCost;
}
