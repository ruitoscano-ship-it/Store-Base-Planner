/**
 * Store Planner — standalone page bootstrap.
 */
(function bootstrapPlannerApp() {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const plannerWidthInput = document.getElementById("plannerWidth");
  const plannerHeightInput = document.getElementById("plannerHeight");
  const plannerAreaLabel = document.getElementById("plannerArea");
  const plannerGridScaleLabel = document.getElementById("plannerGridScale");
  const plannerPresetSummary = document.getElementById("plannerPresetSummary");
  const plannerPresetButtons = Array.from(document.querySelectorAll(".planner-preset-btn"));
  const plannerCanvasWrap = document.getElementById("plannerCanvasWrap");
  const planner3dWrap = document.getElementById("planner3dWrap");
  const planner3dContainer = document.getElementById("planner3dContainer");
  const planner3dMoveBtn = document.getElementById("planner3dMoveBtn");
  const planner3dRotateBtn = document.getElementById("planner3dRotateBtn");
  const planner3dHumanBtn = document.getElementById("planner3dHumanBtn");
  const planner3dWalkBtn = document.getElementById("planner3dWalkBtn");
  const planner3dFitBtn = document.getElementById("planner3dFitBtn");
  const planner3dIsoBtn = document.getElementById("planner3dIsoBtn");
  const planner3dZoomInBtn = document.getElementById("planner3dZoomInBtn");
  const planner3dZoomOutBtn = document.getElementById("planner3dZoomOutBtn");
  const planner3dGridBtn = document.getElementById("planner3dGridBtn");
  const planner3dDeleteBtn = document.getElementById("planner3dDeleteBtn");
  const planner3dHint = document.getElementById("planner3dHint");
  const plannerView2dBtn = document.getElementById("plannerView2dBtn");
  const plannerView3dBtn = document.getElementById("plannerView3dBtn");
  const plannerViewSimBtn = document.getElementById("plannerViewSimBtn");
  const planner3dToolbar = document.getElementById("planner3dToolbar");
  const plannerSimDashboard = document.getElementById("plannerSimDashboard");
  const simOccupancySlider = document.getElementById("simOccupancySlider");
  const simOccupancyVal = document.getElementById("simOccupancyVal");
  const simPlayBtn = document.getElementById("simPlayBtn");
  const simRandomizeBtn = document.getElementById("simRandomizeBtn");
  const simSessionCaptures = document.getElementById("simSessionCaptures");
  const simPeopleInside = document.getElementById("simPeopleInside");
  const simPeopleEntering = document.getElementById("simPeopleEntering");
  const simPeopleLeaving = document.getElementById("simPeopleLeaving");
  const simLiveRate = document.getElementById("simLiveRate");
  const simCapturedInteractions = document.getElementById("simCapturedInteractions");
  const simRawInteractions = document.getElementById("simRawInteractions");
  const simCaptureRate = document.getElementById("simCaptureRate");
  const simCoveragePct = document.getElementById("simCoveragePct");
  const simShelfInteractions = document.getElementById("simShelfInteractions");
  const simShelfInteractionsLive = document.getElementById("simShelfInteractionsLive");
  const simPaymentInteractions = document.getElementById("simPaymentInteractions");
  const simTrackingEvents = document.getElementById("simTrackingEvents");
  const simZoneList = document.getElementById("simZoneList");
  const simFootnote = document.getElementById("simFootnote");
  const applyStoreSizeBtn = document.getElementById("applyStoreSizeBtn");
  const plannerAddButtons = Array.from(document.querySelectorAll(".planner-add-btn"));
  const plannerFixtureButtons = document.getElementById("plannerFixtureButtons");
  const plannerMonitorButtons = document.getElementById("plannerMonitorButtons");
  const plannerExportPngBtn = document.getElementById("plannerExportPngBtn");
  const plannerExportSvgBtn = document.getElementById("plannerExportSvgBtn");
  const plannerExportJsonBtn = document.getElementById("plannerExportJsonBtn");
  const plannerImportJsonBtn = document.getElementById("plannerImportJsonBtn");
  const plannerImportInput = document.getElementById("plannerImportInput");
  const plannerLoadBlueprintBtn = document.getElementById("plannerLoadBlueprintBtn");
  const plannerClearBlueprintBtn = document.getElementById("plannerClearBlueprintBtn");
  const plannerBlueprintInput = document.getElementById("plannerBlueprintInput");
  const plannerClearBtn = document.getElementById("plannerClearBtn");
  const plannerTemplateSelect = document.getElementById("plannerTemplateSelect");
  const plannerTemplateSummary = document.getElementById("plannerTemplateSummary");
  const plannerLoadTemplateBtn = document.getElementById("plannerLoadTemplateBtn");
  const plannerSaveTemplateBtn = document.getElementById("plannerSaveTemplateBtn");
  const plannerExportTemplateBtn = document.getElementById("plannerExportTemplateBtn");
  const plannerExport3dSnapshotBtn = document.getElementById("plannerExport3dSnapshotBtn");
  const plannerDeleteSelectedBtn = document.getElementById("plannerDeleteSelectedBtn");
  const plannerStatus = document.getElementById("plannerStatus");
  const costAmbientShelfInput = document.getElementById("costAmbientShelf");
  const costColdShelfInput = document.getElementById("costColdShelf");
  const costHotShelfInput = document.getElementById("costHotShelf");
  const costInstallPerShelfInput = document.getElementById("costInstallPerShelf");
  const costIntegrationFixedInput = document.getElementById("costIntegrationFixed");
  const costSetupPercentInput = document.getElementById("costSetupPercent");
  const costContingencyPercentInput = document.getElementById("costContingencyPercent");
  const countAmbientShelfLabel = document.getElementById("countAmbientShelf");
  const countColdShelfLabel = document.getElementById("countColdShelf");
  const countHotShelfLabel = document.getElementById("countHotShelf");
  const plannerEstimatedSubtotalLabel = document.getElementById("plannerEstimatedSubtotal");
  const plannerEstimatedSetupLabel = document.getElementById("plannerEstimatedSetup");
  const plannerEstimatedContingencyLabel = document.getElementById("plannerEstimatedContingency");
  const plannerEstimatedCapexLabel = document.getElementById("plannerEstimatedCapex");
  const plannerEstimatedCostPerSqmLabel = document.getElementById("plannerEstimatedCostPerSqm");
  const plannerEstimatedMonthlyLabel = document.getElementById("plannerEstimatedMonthly");
  const STORAGE_KEY = "smart_store_planner_v1";
  const LEGACY_SIMULATOR_KEY = "smart_store_simulator_v1";
  const PLANNER_MARGIN = 20;
  const PLANNER_MIN_PX_PER_M = 18;
  const PLANNER_MAX_PX_PER_M = 30;

  let PLANNER_ARTIFACTS = {};
  let plannerSettings = {
    wallHeightMeters: 2.8,
    wallThicknessMeters: 0.12,
    layoutGapMeters: 0.15
  };
  let layoutStepForArtifact = null;
  let buildStorePresetLayoutFn = null;
  let storeArtifactKinds = [];
  let monitorArtifactKinds = [];
  let layoutDocModule = null;
  let cachedLayoutSnapshot = null;
  let cachedLayoutSignature = "";
  let lastSyncedLayoutSignature = "";
  let layoutApplying = false;

  async function ensureLayoutDocumentModule() {
    if (layoutDocModule) return layoutDocModule;
    layoutDocModule = await import("./planner-layout-document.js");
    return layoutDocModule;
  }

  function refreshCachedLayout() {
    cachedLayoutSnapshot = getPlannerLayoutSnapshot();
    cachedLayoutSignature = layoutDocModule
      ? layoutDocModule.layoutSnapshotSignature(cachedLayoutSnapshot)
      : `${cachedLayoutSnapshot?.widthMeters || 0}x${cachedLayoutSnapshot?.heightMeters || 0}`;
    return cachedLayoutSnapshot;
  }

  function getCachedLayoutSnapshot() {
    if (!cachedLayoutSnapshot) refreshCachedLayout();
    return cachedLayoutSnapshot;
  }

  function captureAllFixturePoses() {
    if (!plannerState.canvas) return;
    plannerState.canvas.getObjects().forEach((obj) => {
      if (isPlannerFixture(obj)) capturePlannerPoseMeters(obj);
    });
  }

  function buildCurrentLayoutDocument(templateMeta = null) {
    flushPlanner3DTransforms();
    captureAllFixturePoses();
    const layout = refreshCachedLayout();
    return layoutDocModule?.buildLayoutDocument({
      widthMeters: plannerState.widthMeters,
      heightMeters: plannerState.heightMeters,
      activePresetId: plannerState.activePresetId,
      costModel: getPlannerCostModel(),
      layout,
      canvasJson: plannerState.canvas
        ? plannerState.canvas.toDatalessJSON(layoutDocModule?.CANVAS_CUSTOM_PROPS || [
            "plannerKind",
            "plannerObjectId",
            "plannerMeters",
            "plannerPoseMeters"
          ])
        : null,
      preferences: {
        showMonitoringViz: showMonitoringVizPref,
        simOccupancy: simOccupancyPref,
        simPlaying: simPlaying
      },
      templateMeta
    });
  }

  async function syncLayoutAcrossViews(options = {}) {
    if (planner3dSyncLock && !options.force) return;
    await ensureLayoutDocumentModule();
    const layout = refreshCachedLayout();
    if (!layout) return;

    const layoutChanged = cachedLayoutSignature !== lastSyncedLayoutSignature;

    if (planner3dView) {
      if (plannerViewMode === "3d" || plannerViewMode === "simulation") {
        flushPlanner3DTransforms();
      }
      const syncOpts = {
        artifacts: storeProfileConfig?.artifacts,
        planner: storeProfileConfig?.planner,
        refitCamera: Boolean(options.refitCamera)
      };
      if (plannerViewMode === "3d" || plannerViewMode === "simulation") {
        planner3dView.sync(layout, syncOpts);
      } else {
        planner3dView.cacheLayout(layout, syncOpts);
      }
    }

    if (plannerViewMode === "simulation") {
      if (options.forceSimulationReset || (options.resetSimulation && layoutChanged)) {
        await resetLiveSimulation({ randomize: Boolean(options.randomizeSimulation) });
      } else {
        await ensureShopperSim();
        if (shopperSim) {
          shopperSim.applyLayout(layout);
          if (planner3dView) {
            planner3dView.updateShoppers(shopperSim.getShopperPositions());
            planner3dView.updateHeatmap(shopperSim.getHeatmap());
          }
        }
      }
    }

    lastSyncedLayoutSignature = cachedLayoutSignature;

    if (options.persist !== false) persistState();
  }

  async function applyLayoutDocument(docInput, { sourceLabel = "layout" } = {}) {
    const mod = await ensureLayoutDocumentModule();
    const doc = mod.normalizeLayoutDocument(docInput);
    if (!doc || !plannerState.canvas) return false;

    layoutApplying = true;
    clearPlannerBlueprint();
    clearPlannerObjects();

    plannerWidthInput.value = String(doc.store.widthMeters);
    plannerHeightInput.value = String(doc.store.heightMeters);
    plannerState.activePresetId = doc.activePresetId || null;
    applyPlannerCostModel(doc.costModel || defaultPlannerCostModel);
    plannerState.widthMeters = doc.store.widthMeters;
    plannerState.heightMeters = doc.store.heightMeters;
    syncPlannerMeterScale();
    drawPlannerBoundary();
    fitPlannerViewport();

    if (doc.preferences) {
      showMonitoringVizPref = doc.preferences.showMonitoringViz !== false;
      simOccupancyPref = Number(doc.preferences.simOccupancy) || 24;
      simPlaying = doc.preferences.simPlaying !== false;
      syncMonitoringGridButton();
      if (simOccupancySlider) simOccupancySlider.value = String(simOccupancyPref);
      if (simOccupancyVal) simOccupancyVal.textContent = String(simOccupancyPref);
      syncSimPlayButton();
      if (planner3dView) planner3dView.setShowMonitoringViz(showMonitoringVizPref);
    }

    highlightActivePresetButton();
    if (plannerState.activePresetId && STORE_PRESETS[plannerState.activePresetId]) {
      const preset = STORE_PRESETS[plannerState.activePresetId];
      plannerPresetSummary.textContent = `${preset.label}: ${doc.store.widthMeters}×${doc.store.heightMeters} m (${number.format(doc.store.widthMeters * doc.store.heightMeters)} m²)`;
    }

    const restoreFromCanvas = () =>
      new Promise((resolve) => {
        plannerState.canvas.loadFromJSON(doc.canvasJson, () => {
          plannerState.canvas.renderAll();
          syncPlannerMetaFromCanvas();
          resolve();
        });
      });

    if (doc.canvasJson) {
      await restoreFromCanvas();
    } else if (doc.layout?.objects?.length) {
      plannerBatchAdding = true;
      doc.layout.objects.forEach((obj) => {
        const pose = {
          x: obj.meters.x,
          z: obj.meters.z,
          angle: normalizePlannerAngle(obj.angle)
        };
        addPlannerObject(obj.kind, {
          left: canvasPointFromMeters(pose.x, pose.z).left,
          top: canvasPointFromMeters(pose.x, pose.z).top,
          angle: pose.angle,
          objectId: obj.id,
          silent: true
        });
        const fabricObj = findFabricObjectByPlannerId(obj.id);
        if (fabricObj) writeMeterPoseToFabric(fabricObj, pose);
      });
      plannerBatchAdding = false;
      plannerState.canvas.requestRenderAll();
    }

    updatePlannerEstimate();
    updateMonitoringSummary();
    layoutApplying = false;
    await syncLayoutAcrossViews({
      refitCamera: true,
      forceSimulationReset: true,
      randomizeSimulation: plannerViewMode === "simulation",
      force: true
    });
    plannerStatus.textContent = `${sourceLabel} loaded — layout synced across 2D, 3D, and simulation.`;
    plannerStatus.style.color = "var(--ok)";
    return true;
  }

  function renderTemplateOptions() {
    if (!plannerTemplateSelect) return;
    const mod = layoutDocModule;
    if (!mod) return;
    const store = mod.loadTemplatesStore();
    plannerTemplateSelect.innerHTML = store.templates
      .map((template) => `<option value="${template.id}">${template.name}${template.builtin ? " (built-in)" : ""}</option>`)
      .join("");
    if (plannerTemplateSummary) {
      const selected = store.templates.find((entry) => entry.id === plannerTemplateSelect.value);
      plannerTemplateSummary.textContent = selected
        ? `${selected.name} · ${selected.document?.store?.widthMeters || "?"}×${selected.document?.store?.heightMeters || "?"} m`
        : "No saved templates yet.";
    }
  }

  async function seedBuiltinTemplates() {
    const mod = await ensureLayoutDocumentModule();
    await ensureLayoutBuilder();
    let store = mod.loadTemplatesStore();
    if (store.seeded) {
      renderTemplateOptions();
      return;
    }

    for (const presetId of ["small", "medium", "large", "xlarge"]) {
      const preset = STORE_PRESETS[presetId];
      if (!preset || preset.dynamicSize) continue;
      const built = resolvePresetLayout(presetId);
      if (!built) continue;
      const objects = mod.fixturesToLayoutObjects(built.fixtures, artifactCatalogForBuilder(), `builtin-${presetId}`);
      const layout = {
        widthMeters: built.widthMeters,
        heightMeters: built.heightMeters,
        objects,
        monitoring: mod.buildMonitoringFromObjects(objects, getArtifactSpec)
      };
      const document = mod.buildLayoutDocument({
        widthMeters: built.widthMeters,
        heightMeters: built.heightMeters,
        activePresetId: presetId,
        costModel: {
          ...defaultPlannerCostModel,
          integrationFixed: preset.integrationFixed,
          setupPercent: preset.setupPercent ?? defaultPlannerCostModel.setupPercent,
          contingencyPercent: preset.contingencyPercent ?? defaultPlannerCostModel.contingencyPercent
        },
        layout,
        preferences: { showMonitoringViz: true, simOccupancy: 24, simPlaying: true },
        templateMeta: { presetId, builtin: true }
      });
      store = mod.upsertTemplate(store, {
        id: `builtin-${presetId}`,
        name: `${preset.label} store template`,
        builtin: true,
        updatedAt: new Date().toISOString(),
        document
      });
    }

    store.seeded = true;
    mod.saveTemplatesStore(store);
    renderTemplateOptions();
  }

  async function saveCurrentLayoutTemplate(name) {
    const mod = await ensureLayoutDocumentModule();
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    const document = buildCurrentLayoutDocument({ savedAt: new Date().toISOString(), name: trimmed });
    const previewImage = await captureLayoutPreviewImage();
    const id = `user-${Date.now()}`;
    const store = mod.loadTemplatesStore();
    mod.upsertTemplate(store, {
      id,
      name: trimmed,
      builtin: false,
      updatedAt: new Date().toISOString(),
      previewImage,
      document
    });
    renderTemplateOptions();
    if (plannerTemplateSelect) plannerTemplateSelect.value = id;
    plannerStatus.textContent = `Saved template “${trimmed}”.`;
    plannerStatus.style.color = "var(--ok)";
  }

  async function loadSelectedTemplate() {
    const mod = await ensureLayoutDocumentModule();
    const store = mod.loadTemplatesStore();
    const template = store.templates.find((entry) => entry.id === plannerTemplateSelect?.value);
    if (!template?.document) {
      plannerStatus.textContent = "Select a template to load.";
      plannerStatus.style.color = "var(--warn)";
      return;
    }
    await applyLayoutDocument(template.document, { sourceLabel: template.name });
  }

  async function exportSelectedTemplate() {
    const mod = await ensureLayoutDocumentModule();
    const store = mod.loadTemplatesStore();
    const template = store.templates.find((entry) => entry.id === plannerTemplateSelect?.value);
    const document = template?.document || buildCurrentLayoutDocument({ exportedManually: true });
    const name = template?.name || "store-layout-template";
    let previewImage = template?.previewImage || null;
    if (!previewImage) previewImage = await captureLayoutPreviewImage();
    const payload = {
      type: "store-layout-template",
      name,
      exportedAt: new Date().toISOString(),
      previewImage,
      document
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function captureLayoutPreviewImage() {
    if (!plannerState.canvas) return null;
    await ensurePlanner3D();
    const prevActive = plannerViewMode !== "2d";
    if (!prevActive) {
      planner3dView.setActive(true);
      resizePlanner3DView();
    }
    const layout = refreshCachedLayout();
    planner3dView.sync(layout, {
      artifacts: storeProfileConfig?.artifacts,
      planner: storeProfileConfig?.planner,
      refitCamera: true
    });
    let previewImage = null;
    try {
      previewImage = planner3dView.captureSnapshot();
    } catch (_error) {
      previewImage = null;
    }
    if (!prevActive) planner3dView.setActive(false);
    return previewImage;
  }

  async function export3dSnapshotPng() {
    if (!plannerState.canvas) initPlanner();
    const dataUrl = await captureLayoutPreviewImage();
    if (!dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = "store-planner-3d-snapshot.png";
    anchor.click();
  }

  async function ensureLayoutBuilder() {
    if (buildStorePresetLayoutFn) return buildStorePresetLayoutFn;
    const mod = await import("./planner-layout-builder.js");
    buildStorePresetLayoutFn = mod.buildStorePresetLayout;
    return buildStorePresetLayoutFn;
  }

  function artifactCatalogForBuilder() {
    const catalog = {};
    Object.entries(PLANNER_ARTIFACTS).forEach(([kind, spec]) => {
      catalog[kind] = {
        widthMeters: spec.w,
        depthMeters: spec.h
      };
    });
    return catalog;
  }

  function getArtifactSpec(kind) {
    return PLANNER_ARTIFACTS[kind] || { label: kind, w: 1, h: 1, widthMeters: 1, depthMeters: 1 };
  }

  function applyArtifactConfigFromProfiles(config) {
    if (!config?.artifacts) return;
    plannerSettings = {
      wallHeightMeters: config.planner?.wallHeightMeters ?? 2.8,
      wallThicknessMeters: config.planner?.wallThicknessMeters ?? 0.12,
      layoutGapMeters: config.planner?.layoutGapMeters ?? 0.15
    };
    PLANNER_ARTIFACTS = {};
    const mergedArtifacts = { ...(config.artifactDefaults || {}), ...config.artifacts };
    Object.entries(mergedArtifacts).forEach(([kind, spec]) => {
      PLANNER_ARTIFACTS[kind] = {
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
        gatePalette: spec.gatePalette,
        monitorCapability: spec.monitorCapability,
        monitorMetrics: spec.monitorMetrics
      };
    });
    renderPlannerAddButtons();
  }

  function renderPlannerAddButtons() {
    const renderGroup = (container, kinds) => {
      if (!container) return;
      container.innerHTML = kinds
        .map((kind) => {
          const label = PLANNER_ARTIFACTS[kind]?.label || kind;
          return `<button type="button" class="action-btn planner-add-btn" data-kind="${kind}">${label}</button>`;
        })
        .join("");
    };
    renderGroup(plannerFixtureButtons, storeArtifactKinds);
    renderGroup(plannerMonitorButtons, monitorArtifactKinds);
  }

  function bindPlannerAddButtonContainers() {
    [plannerFixtureButtons, plannerMonitorButtons].forEach((container) => {
      if (!container || container.dataset.bound === "1") return;
      container.dataset.bound = "1";
      container.addEventListener("click", (event) => {
        const button = event.target.closest(".planner-add-btn");
        if (!button?.dataset.kind) return;
        if (!plannerState.canvas) initPlanner();
        addPlannerObject(button.dataset.kind);
      });
    });
  }

  function artifactLayoutStep(kind) {
    const spec = getArtifactSpec(kind);
    const gap = plannerSettings.layoutGapMeters ?? 0.15;
    if (layoutStepForArtifact) return layoutStepForArtifact(spec, gap);
    return Math.max(spec.w || 1, spec.h || 1) + gap;
  }

  const plannerState = {
    canvas: null,
    scale: 26,
    widthMeters: 20,
    heightMeters: 20,
    boundary: null,
    gridObjects: [],
    blueprintObject: null,
    activePresetId: null
  };

  let plannerViewMode = "2d";
  let planner3dView = null;
  let planner3dSyncLock = false;
  let plannerBatchAdding = false;
  let showMonitoringVizPref = true;
  let simOccupancyPref = 24;
  let computeStoreSimulationFn = null;
  let ShopperSimClass = null;
  let shopperSim = null;
  let simPlaying = true;
  let simAnimId = null;
  let lastSimFrame = 0;
  let lastDashboardUpdate = 0;

  async function loadSimulationEngine() {
    if (computeStoreSimulationFn && ShopperSimClass) {
      return { computeStoreSimulation: computeStoreSimulationFn, ShopperSim: ShopperSimClass };
    }
    const mod = await import("./planner-simulation.js");
    computeStoreSimulationFn = mod.computeStoreSimulation;
    ShopperSimClass = mod.ShopperSim;
    return mod;
  }

  async function ensureShopperSim() {
    const layout = getCachedLayoutSnapshot();
    if (!layout) return null;
    await loadSimulationEngine();
    const count = Number(simOccupancySlider?.value || simOccupancyPref);
    if (!shopperSim || !shopperSim.matchesLayout(layout)) {
      shopperSim = new ShopperSimClass(layout, count);
    } else {
      shopperSim.applyLayout(layout);
      shopperSim.setCount(count);
    }
    return shopperSim;
  }

  function stopLiveSimulation({ clearShoppers = false } = {}) {
    if (simAnimId) {
      cancelAnimationFrame(simAnimId);
      simAnimId = null;
    }
    if (clearShoppers && planner3dView) planner3dView.clearShoppers();
  }

  function renderLiveSimulationDashboard(sim, staticResult) {
    const live = sim.getLiveMetrics();
    if (!live.simulationEnabled) {
      simPeopleInside.textContent = "0";
      simPeopleEntering.textContent = "0";
      simPeopleLeaving.textContent = "0";
      if (simShelfInteractionsLive) simShelfInteractionsLive.textContent = "0";
      if (simPaymentInteractions) simPaymentInteractions.textContent = "0";
      simSessionCaptures.textContent = "0";
      simLiveRate.textContent = "—";
      if (simFootnote) {
        simFootnote.textContent = live.statusMessage || "Please add an entrance and checkout to run the simulation.";
      }
      if (planner3dHint) {
        planner3dHint.textContent = live.statusMessage || "Please add an entrance and checkout to run the simulation.";
      }
      return;
    }
    simPeopleInside.textContent = number.format(live.peopleInside);
    simPeopleEntering.textContent = number.format(live.sessionEntries);
    simPeopleLeaving.textContent = number.format(live.sessionLeaves);
    if (simShelfInteractionsLive) {
      simShelfInteractionsLive.textContent = number.format(live.sessionShelfInteractions);
    }
    if (simPaymentInteractions) {
      simPaymentInteractions.textContent = number.format(live.sessionPaymentInteractions);
    }
    simSessionCaptures.textContent = number.format(live.sessionCaptures);
    simLiveRate.textContent = live.elapsed > 0.5 ? `${number.format(live.liveCapturedPerHour)}/hr` : "—";
    if (staticResult) renderSimulationDashboard(staticResult, live);
  }

  function startLiveSimulationLoop() {
    stopLiveSimulation();
    if (plannerViewMode !== "simulation" || !simPlaying) return;

    lastSimFrame = performance.now();
    lastDashboardUpdate = 0;

    const tick = (now) => {
      if (plannerViewMode !== "simulation") return;
      simAnimId = requestAnimationFrame(tick);
      if (!simPlaying || !shopperSim || !planner3dView) return;

      const dt = Math.min(0.05, (now - lastSimFrame) / 1000);
      lastSimFrame = now;

      shopperSim.step(dt);
      if (shopperSim.getLiveMetrics().simulationEnabled) {
        planner3dView.updateShoppers(shopperSim.getShopperPositions());
        planner3dView.updateHeatmap(shopperSim.getHeatmap());
      } else {
        planner3dView.clearShoppers();
      }

      if (now - lastDashboardUpdate > 350) {
        lastDashboardUpdate = now;
        const layout = getCachedLayoutSnapshot();
        const staticResult = layout && computeStoreSimulationFn
          ? computeStoreSimulationFn(layout, shopperSim.shoppers.length)
          : null;
        renderLiveSimulationDashboard(shopperSim, staticResult);
      }
    };

    simAnimId = requestAnimationFrame(tick);
  }

  async function resetLiveSimulation({ randomize = false } = {}) {
    await ensureShopperSim();
    if (!shopperSim) return;
    if (randomize) shopperSim.randomize();
    if (planner3dView) {
      if (shopperSim.getLiveMetrics().simulationEnabled) {
        planner3dView.updateShoppers(shopperSim.getShopperPositions());
        planner3dView.updateHeatmap(shopperSim.getHeatmap());
      } else {
        planner3dView.clearShoppers();
      }
    }
    const layout = getPlannerLayoutSnapshot();
    const staticResult = layout && computeStoreSimulationFn
      ? computeStoreSimulationFn(layout, shopperSim.shoppers.length)
      : null;
    renderLiveSimulationDashboard(shopperSim, staticResult);
    startLiveSimulationLoop();
  }

  function syncSimPlayButton() {
    if (!simPlayBtn) return;
    simPlayBtn.textContent = simPlaying ? "Pause" : "Play";
    simPlayBtn.classList.toggle("active", simPlaying);
  }

  function renderSimulationDashboard(result, live = null) {
    if (!result) return;
    simOccupancyVal.textContent = String(result.occupancy);
    simCapturedInteractions.textContent = number.format(
      live?.liveCapturedPerHour > 0 ? live.liveCapturedPerHour : result.capturedInteractionsPerHour
    );
    simRawInteractions.textContent = number.format(result.rawInteractionsPerHour);
    simCaptureRate.textContent = `${result.captureRatePct}%`;
    simCoveragePct.textContent = `${result.coveragePct}%`;
    simShelfInteractions.textContent = number.format(
      live?.shelfInteractionsPerHour > 0 ? live.shelfInteractionsPerHour : result.shelfInteractionsPerHour
    );
    simTrackingEvents.textContent = number.format(result.trackingEventsPerHour);

    if (!result.zoneCount) {
      simZoneList.innerHTML = '<p class="offline-note" style="margin:0;">Add monitoring zones on the 2D plan to refine capture estimates.</p>';
    } else {
      simZoneList.innerHTML = result.zoneBreakdown
        .map(
          (zone) => `
        <div class="planner-sim-zone-row">
          <div><strong>${zone.label}</strong><br /><span style="color:var(--muted);">${zone.capability} · ${zone.areaSqm} m²</span></div>
          <div style="text-align:right;">${number.format(zone.expectedPerHour)}/hr<br /><span style="color:var(--muted);">${zone.capturePct}% cam</span></div>
        </div>`
        )
        .join("");
    }

    simFootnote.textContent = live?.statusMessage
      ? live.statusMessage
      : `${result.cameraCount} ceiling cameras · ${result.zoneCount} monitoring zones · ${number.format(result.storeAreaSqm)} m² selling area. Shoppers enter via the gate, browse shelves (1–90 s per stop), then queue at checkout one by one.`;
  }

  async function runStoreSimulation() {
    if (plannerViewMode === "simulation" && simPlaying) {
      await resetLiveSimulation();
      return shopperSim;
    }
    const layout = getPlannerLayoutSnapshot();
    if (!layout) return null;
    const { computeStoreSimulation } = await loadSimulationEngine();
    const occupancy = Number(simOccupancySlider?.value || simOccupancyPref);
    const result = computeStoreSimulation(layout, occupancy);
    simOccupancyPref = result.occupancy;
    renderSimulationDashboard(result);
    if (planner3dView && plannerViewMode === "simulation") {
      planner3dView.updateHeatmap(result.heatmap);
    }
    return result;
  }

  function syncSimulationUi() {
    const isSim = plannerViewMode === "simulation";
    plannerView2dBtn.classList.toggle("active", plannerViewMode === "2d");
    plannerView3dBtn.classList.toggle("active", plannerViewMode === "3d");
    plannerViewSimBtn.classList.toggle("active", isSim);
    plannerCanvasWrap.classList.toggle("hidden", plannerViewMode !== "2d");
    planner3dWrap.classList.toggle("hidden", plannerViewMode === "2d");
    planner3dToolbar?.classList.toggle("hidden", isSim);
    plannerSimDashboard?.classList.toggle("hidden", !isSim);
    if (planner3dHint) {
      if (isSim) {
        const blocked = shopperSim?.getStatusMessage?.();
        planner3dHint.textContent = blocked
          ? blocked
          : simPlaying
            ? "Live simulation · enter via gate · browse shelves · queue at checkout"
            : "Simulation paused · press Play or Randomize to continue";
      } else {
        planner3dHint.textContent = planner3dHumanPlaced
          ? "Stick figure placed · Drop human to reposition · Walk for first-person tour"
          : "Click a fixture to select · Drop human for scale · Walk to explore the store";
      }
    }
  }

  function syncMonitoringGridButton() {
    if (planner3dGridBtn) {
      planner3dGridBtn.classList.toggle("active", showMonitoringVizPref);
    }
  }

  function ensurePlannerObjectId(obj) {
    if (!obj.plannerObjectId) {
      obj.plannerObjectId = `fixture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    return obj.plannerObjectId;
  }

  function findFabricObjectByPlannerId(objectId) {
    if (!plannerState.canvas || !objectId) return null;
    return plannerState.canvas.getObjects().find((obj) => obj.plannerObjectId === objectId) || null;
  }

  function buildMonitoringPlan(objects) {
    const zones = (objects || [])
      .filter((obj) => obj.kind && obj.kind.startsWith("monitor-"))
      .map((obj) => {
        const spec = getArtifactSpec(obj.kind);
        return {
          id: obj.id,
          kind: obj.kind,
          label: spec.label,
          capability: spec.monitorCapability || obj.monitor?.capability,
          metrics: spec.monitorMetrics || obj.monitor?.metrics || [],
          meters: obj.meters,
          angle: obj.angle
        };
      });
    return {
      zoneCount: zones.length,
      entrances: zones.filter((z) => z.capability === "count").length,
      tracking: zones.filter((z) => z.capability === "track").length,
      interaction: zones.filter((z) => z.capability === "interaction").length,
      zones
    };
  }

  function updateMonitoringSummary() {
    const summaryEl = document.getElementById("plannerMonitoringSummary");
    if (!summaryEl || !plannerState.canvas) return;
    const layout = getPlannerLayoutSnapshot();
    if (!layout) {
      summaryEl.textContent = "No monitoring zones placed.";
      return;
    }
    const plan = layout.monitoring;
    if (!plan?.zoneCount) {
      summaryEl.textContent = "No monitoring zones placed.";
      return;
    }
    summaryEl.textContent = `${plan.zoneCount} zones · ${plan.entrances} count entrances · ${plan.tracking} people tracking · ${plan.interaction} interaction`;
  }

  function isPlannerFixture(obj) {
    if (!obj?.plannerKind) return false;
    if (obj === plannerState.boundary || obj === plannerState.blueprintObject) return false;
    if (plannerState.gridObjects.includes(obj)) return false;
    return true;
  }

  function normalizePlannerAngle(degrees) {
    return ((Number(degrees) || 0) % 360 + 360) % 360;
  }

  function readMeterPoseFromFabric(obj) {
    const center = obj.getCenterPoint();
    return {
      x: (center.x - PLANNER_MARGIN) / plannerState.scale,
      z: (center.y - PLANNER_MARGIN) / plannerState.scale,
      angle: normalizePlannerAngle(obj.angle)
    };
  }

  function writeMeterPoseToFabric(obj, pose) {
    if (!obj || !pose) return;
    const normalizedAngle = normalizePlannerAngle(pose.angle);
    obj.set({ originX: "center", originY: "center", angle: normalizedAngle });
    obj.setPositionByOrigin(
      new fabric.Point(PLANNER_MARGIN + pose.x * plannerState.scale, PLANNER_MARGIN + pose.z * plannerState.scale),
      "center",
      "center"
    );
    obj.setCoords();
    obj.plannerPoseMeters = { x: pose.x, z: pose.z, angle: normalizedAngle };
  }

  function capturePlannerPoseMeters(obj) {
    const pose = readMeterPoseFromFabric(obj);
    obj.plannerPoseMeters = pose;
    return pose;
  }

  function repositionFixturesFromMeterPoses() {
    if (!plannerState.canvas) return;
    plannerState.canvas.getObjects().forEach((obj) => {
      if (!isPlannerFixture(obj)) return;
      const pose = obj.plannerPoseMeters || readMeterPoseFromFabric(obj);
      writeMeterPoseToFabric(obj, pose);
    });
  }

  function flushPlanner3DTransforms() {
    planner3dView?.flushActiveTransform?.();
  }

  function getPlannerLayoutSnapshot() {
    if (!plannerState.canvas) return null;
    const skip = new Set([plannerState.boundary, plannerState.blueprintObject, ...plannerState.gridObjects]);
    const objects = plannerState.canvas
      .getObjects()
      .filter((obj) => obj.plannerKind && !skip.has(obj))
      .map((obj) => {
        const kind = obj.plannerKind;
        const spec = PLANNER_ARTIFACTS[kind] || { w: 1, h: 1 };
        const pose = obj.plannerPoseMeters || capturePlannerPoseMeters(obj);
        const footprintW = (obj.plannerMeters?.w ?? spec.w) * Math.abs(obj.scaleX ?? 1);
        const footprintD = (obj.plannerMeters?.h ?? spec.h) * Math.abs(obj.scaleY ?? 1);
        return {
          id: ensurePlannerObjectId(obj),
          kind,
          angle: normalizePlannerAngle(pose.angle),
          meters: {
            x: pose.x,
            z: pose.z,
            w: footprintW,
            h: footprintD
          },
          ...(kind.startsWith("monitor-")
            ? {
                monitor: {
                  capability: spec.monitorCapability,
                  metrics: spec.monitorMetrics || []
                }
              }
            : {})
        };
      });

    return {
      widthMeters: plannerState.widthMeters,
      heightMeters: plannerState.heightMeters,
      monitoring: buildMonitoringPlan(objects),
      objects
    };
  }

  function applyPlannerTransformFrom3D(change) {
    if (!plannerState.canvas || !change?.id) return;
    const fabricObj = findFabricObjectByPlannerId(change.id);
    if (!fabricObj) return;

    planner3dSyncLock = true;
    const pose = {
      x: change.x,
      z: change.z,
      angle: normalizePlannerAngle(change.angle)
    };
    writeMeterPoseToFabric(fabricObj, pose);
    plannerState.canvas.requestRenderAll();
    updatePlannerEstimate();
    persistState();
    planner3dSyncLock = false;

    if (planner3dHint) {
      planner3dHint.textContent = `Updated ${change.kind || "fixture"} · synced to 2D plan`;
    }
  }

  let planner3dHumanPlaced = false;

  function updatePlanner3dHint(mode) {
    if (!planner3dHint) return;
    if (mode === "placeHuman") {
      planner3dHint.textContent = "Click the floor to drop a 1.75 m stick figure for scale";
      return;
    }
    if (mode === "walk") {
      planner3dHint.textContent = "First-person walk · WASD or arrows · mouse to look · Esc exits walk mode";
      return;
    }
    planner3dHint.textContent = planner3dHumanPlaced
      ? "Stick figure placed · Drop human to reposition · Walk for first-person tour"
      : "Click a fixture to select · Move/rotate gizmo · Delete or Backspace to remove";
  }

  function deletePlannerObjectById(objectId) {
    if (!objectId || !plannerState.canvas) return false;
    const fabricObj = findFabricObjectByPlannerId(objectId);
    if (!fabricObj || !isPlannerFixture(fabricObj)) return false;
    plannerState.canvas.remove(fabricObj);
    plannerState.canvas.discardActiveObject();
    plannerState.canvas.requestRenderAll();
    updatePlannerEstimate();
    updateMonitoringSummary();
    persistState();
    requestPlanner3DSync();
    plannerStatus.textContent = "Selected fixture removed from layout.";
    plannerStatus.style.color = "var(--ok)";
    return true;
  }

  function syncPlanner3dToolbar(mode) {
    const isPlace = mode === "placeHuman";
    const isWalk = mode === "walk";
    planner3dHumanBtn.classList.toggle("active", isPlace);
    planner3dWalkBtn.classList.toggle("active", isWalk);
    planner3dMoveBtn.disabled = isWalk || isPlace;
    planner3dRotateBtn.disabled = isWalk || isPlace;
    planner3dZoomInBtn.disabled = isWalk || isPlace;
    planner3dZoomOutBtn.disabled = isWalk || isPlace;
    planner3dFitBtn.disabled = isWalk || isPlace;
    if (planner3dIsoBtn) planner3dIsoBtn.disabled = isWalk || isPlace;
    planner3dHumanBtn.disabled = isWalk;
    planner3dWalkBtn.textContent = isWalk ? "Exit walk" : "Walk";
    if (planner3dDeleteBtn) planner3dDeleteBtn.disabled = isWalk || isPlace;
    if (isWalk || isPlace) {
      planner3dMoveBtn.classList.remove("active");
      planner3dRotateBtn.classList.remove("active");
    } else {
      planner3dMoveBtn.classList.add("active");
    }
  }

  async function ensurePlanner3D() {
    if (planner3dView) return planner3dView;
    const { createPlanner3D } = await import("./planner-3d.js");
    planner3dView = createPlanner3D(planner3dContainer, {
      artifacts: storeProfileConfig?.artifacts,
      planner: storeProfileConfig?.planner,
      onObjectTransform: applyPlannerTransformFrom3D,
      onObjectDelete: deletePlannerObjectById,
      onInteractionModeChange: (mode, meta) => {
        planner3dHumanPlaced = !!meta.humanPlaced;
        syncPlanner3dToolbar(mode);
        updatePlanner3dHint(mode);
      },
      onSelectionChange: (objectId) => {
        if (!planner3dHint || planner3dView?.getInteractionMode?.() !== "edit") return;
        if (!objectId) {
          updatePlanner3dHint("edit");
          return;
        }
        const fabricObj = findFabricObjectByPlannerId(objectId);
        const spec = fabricObj ? getArtifactSpec(fabricObj.plannerKind) : null;
        planner3dHint.textContent = fabricObj
          ? `Selected: ${spec?.label || fabricObj.plannerKind} · drag to move · Delete to remove`
          : "Fixture selected";
      }
    });
    planner3dView.setShowMonitoringViz(showMonitoringVizPref);
    syncMonitoringGridButton();
    planner3dView.setTransformMode("translate");
    syncPlanner3dToolbar("edit");
    updatePlanner3dHint("edit");
    return planner3dView;
  }

  function resizePlanner3DView() {
    if (!planner3dView || !planner3dWrap) return;
    planner3dView.resize(planner3dWrap.clientWidth, planner3dWrap.clientHeight);
  }

  function syncPlanner3DView(options = {}) {
    if (planner3dSyncLock || !planner3dView) return;
    void syncLayoutAcrossViews({ ...options, resetSimulation: false });
  }

  async function setPlannerViewMode(mode) {
    if (mode !== "simulation") stopLiveSimulation({ clearShoppers: true });

    plannerViewMode = mode;
    syncSimulationUi();

    if (mode === "2d") {
      if (planner3dView) {
        flushPlanner3DTransforms();
        refreshCachedLayout();
        planner3dView.setSimulationMode(false);
        planner3dView.setActive(false);
      }
      if (plannerState.canvas) resizePlannerCanvasToContainer();
      return;
    }

    if (!plannerState.canvas) initPlanner();
    const view = await ensurePlanner3D();
    view.setActive(true);
    resizePlanner3DView();

    if (mode === "simulation") {
      view.setSimulationMode(true);
      if (simOccupancySlider) simOccupancySlider.value = String(simOccupancyPref);
      simPlaying = true;
      syncSimPlayButton();
      await syncLayoutAcrossViews({
        refitCamera: true,
        forceSimulationReset: true,
        randomizeSimulation: true,
        force: true
      });
      return;
    }

    view.setSimulationMode(false);
    setPlanner3dTool("translate");
    await syncLayoutAcrossViews({ refitCamera: true, resetSimulation: false, force: true });
  }

  function requestPlanner3DSync(options = {}) {
    if (layoutApplying || planner3dSyncLock) return;
    refreshCachedLayout();
    const layoutChanged = cachedLayoutSignature !== lastSyncedLayoutSignature;
    void syncLayoutAcrossViews({
      resetSimulation: layoutChanged,
      ...options
    });
  }

  function setPlanner3dTool(mode) {
    if (!planner3dView) return;
    if (planner3dView.getInteractionMode() === "walk") {
      planner3dView.setInteractionMode("edit");
    }
    if (planner3dView.getInteractionMode() === "placeHuman") {
      planner3dView.setInteractionMode("edit");
    }
    planner3dView.setTransformMode(mode);
    planner3dMoveBtn.classList.toggle("active", mode === "translate");
    planner3dRotateBtn.classList.toggle("active", mode === "rotate");
  }

  let storeProfileConfig = null;
  let STORE_PRESETS = {};

  function buildStorePresetsFromConfig(config) {
    if (!config) return {};
    const merged = {};
    Object.keys(config.profiles).forEach((id) => {
      const profile = config.profiles[id];
      merged[id] = {
        ...profile,
        shelves: profile.shelves ? { ...profile.shelves } : undefined,
        dynamicSize: Boolean(profile.dynamicSize || id === "bespoke")
      };
    });
    return merged;
  }

  function getDefaultPlannerCostModel() {
    const costs = storeProfileConfig?.costs || legacyDefaultPlannerCostModel;
    return {
      ambientShelf: costs.ambientShelf ?? legacyDefaultPlannerCostModel.ambientShelf,
      coldShelf: costs.coldShelf ?? legacyDefaultPlannerCostModel.coldShelf,
      hotShelf: costs.hotShelf ?? legacyDefaultPlannerCostModel.hotShelf,
      installPerShelf: costs.installPerShelf ?? legacyDefaultPlannerCostModel.installPerShelf,
      integrationFixed: legacyDefaultPlannerCostModel.integrationFixed,
      setupPercent: legacyDefaultPlannerCostModel.setupPercent,
      contingencyPercent: legacyDefaultPlannerCostModel.contingencyPercent
    };
  }

  const legacyDefaultPlannerCostModel = {
    ambientShelf: 1500,
    coldShelf: 4200,
    hotShelf: 3600,
    installPerShelf: 280,
    integrationFixed: 12000,
    setupPercent: 15,
    contingencyPercent: 10
  };

  let defaultPlannerCostModel = legacyDefaultPlannerCostModel;

  async function ensureArtifactKindLists() {
    if (storeArtifactKinds.length && monitorArtifactKinds.length) return null;
    const mod = await import("./planner-artifacts.js");
    storeArtifactKinds = mod.STORE_ARTIFACT_KINDS;
    monitorArtifactKinds = mod.MONITOR_ARTIFACT_KINDS;
    if (!layoutStepForArtifact) layoutStepForArtifact = mod.layoutStepForArtifact;
    return mod;
  }

  async function loadStoreProfilesFromApi() {
    try {
      const response = await fetch("/api/store-profiles");
      if (!response.ok) throw new Error("profile fetch failed");
      storeProfileConfig = await response.json();
      const mod = await ensureArtifactKindLists();
      if (mod) storeProfileConfig.artifactDefaults = mod.getAllArtifacts();
      applyArtifactConfigFromProfiles(storeProfileConfig);
      if (planner3dView) {
        planner3dView.setConfig({
          artifacts: storeProfileConfig.artifacts,
          planner: storeProfileConfig.planner
        });
      }
      STORE_PRESETS = buildStorePresetsFromConfig(storeProfileConfig);
      defaultPlannerCostModel = getDefaultPlannerCostModel();
      applyPlannerCostModel(defaultPlannerCostModel);
      await ensureLayoutBuilder();
      return true;
    } catch (_error) {
      try {
        const mod = await ensureArtifactKindLists();
        if (mod) {
          applyArtifactConfigFromProfiles({ planner: mod.DEFAULT_PLANNER, artifacts: mod.getAllArtifacts() });
        }
        await ensureLayoutBuilder();
      } catch (_importError) {
        // Keep empty artifacts if module fails.
      }
      plannerStatus.textContent = "Could not load store profiles from API. Start server.js and configure in Backoffice.";
      plannerStatus.style.color = "var(--warn)";
      return false;
    }
  }

  function updatePlannerArea() {
    const area = plannerState.widthMeters * plannerState.heightMeters;
    plannerAreaLabel.textContent = `${number.format(area)} m²`;
  }

  function metersToPx(meters) {
    return meters * plannerState.scale;
  }

  function canvasPointFromMeters(xMeters, yMeters) {
    return {
      left: PLANNER_MARGIN + metersToPx(xMeters),
      top: PLANNER_MARGIN + metersToPx(yMeters)
    };
  }


  function shelvesForBespokeArea(widthMeters, heightMeters) {
    const area = widthMeters * heightMeters;
    const b = storeProfileConfig?.bespoke || {
      areaDivisors: { ambient: 13, cold: 32, hot: 45 },
      mins: { ambient: 12, cold: 4, hot: 2 },
      maxs: { ambient: 80, cold: 28, hot: 16 }
    };
    return {
      ambient: clamp(Math.round(area / b.areaDivisors.ambient), b.mins.ambient, b.maxs.ambient),
      cold: clamp(Math.round(area / b.areaDivisors.cold), b.mins.cold, b.maxs.cold),
      hot: clamp(Math.round(area / b.areaDivisors.hot), b.mins.hot, b.maxs.hot)
    };
  }

  function resolvePresetLayout(presetId) {
    const preset = STORE_PRESETS[presetId];
    if (!preset || !buildStorePresetLayoutFn) return null;

    let widthMeters = preset.widthMeters;
    let heightMeters = preset.heightMeters;
    if (preset.dynamicSize) {
      widthMeters = clamp(Number(plannerWidthInput.value) || 18, 5, 200);
      heightMeters = clamp(Number(plannerHeightInput.value) || 14, 5, 200);
    }

    let shelves = preset.shelves;
    if (preset.dynamicSize || !shelves) {
      shelves = shelvesForBespokeArea(widthMeters, heightMeters);
    }

    const built = buildStorePresetLayoutFn({
      widthMeters,
      depthMeters: heightMeters,
      shelves,
      artifacts: artifactCatalogForBuilder(),
      gapMeters: plannerSettings.layoutGapMeters ?? 0.15,
      marginMeters: 0.55,
      includeMonitoring: true
    });

    return {
      preset,
      widthMeters,
      heightMeters,
      shelves,
      fixtures: built.fixtures,
      placed: built.placed,
      requested: built.requested
    };
  }

  function clearPlannerBlueprint() {
    if (!plannerState.canvas || !plannerState.blueprintObject) return;
    plannerState.canvas.remove(plannerState.blueprintObject);
    plannerState.blueprintObject = null;
  }

  function highlightActivePresetButton() {
    plannerPresetButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === plannerState.activePresetId);
    });
  }

  function applyStorePreset(presetId) {
    if (!STORE_PRESETS[presetId]) {
      plannerStatus.textContent = "Store profiles not loaded. Open via server and configure in Backoffice.";
      plannerStatus.style.color = "var(--warn)";
      return;
    }
    const layout = resolvePresetLayout(presetId);
    if (!layout) return;
    if (!initPlanner()) return;

    const { preset, widthMeters, heightMeters, shelves, fixtures } = layout;
    clearPlannerBlueprint();
    clearPlannerObjects();

    plannerWidthInput.value = String(widthMeters);
    plannerHeightInput.value = String(heightMeters);
    applyStoreDimensions();

    applyPlannerCostModel({
      ...defaultPlannerCostModel,
      integrationFixed: preset.integrationFixed,
      setupPercent: preset.setupPercent ?? defaultPlannerCostModel.setupPercent,
      contingencyPercent: preset.contingencyPercent ?? defaultPlannerCostModel.contingencyPercent
    });

    plannerBatchAdding = true;
    fixtures.forEach((fixture) => {
      const point = canvasPointFromMeters(fixture.x, fixture.y);
      addPlannerObject(fixture.kind, {
        left: point.left,
        top: point.top,
        angle: fixture.angle || 0,
        silent: true
      });
    });
    plannerBatchAdding = false;

    plannerState.activePresetId = presetId;
    highlightActivePresetButton();

    const area = widthMeters * heightMeters;
    const placed = layout.placed || {};
    const requested = layout.requested || shelves;
    const shelfTotal = (placed.ambient ?? 0) + (placed.island ?? 0) + (placed.cold ?? 0) + (placed.hot ?? 0);
    const requestedTotal = (requested.ambient ?? 0) + (requested.cold ?? 0) + (requested.hot ?? 0);
    const fitNote =
      shelfTotal < requestedTotal
        ? ` · ${shelfTotal}/${requestedTotal} shelves fit without overlap`
        : "";
    const islandNote = placed.island ? ` / ${placed.island} island` : "";
    plannerPresetSummary.textContent = `${preset.label}: ${widthMeters}×${heightMeters} m (${number.format(area)} m²) · ${shelfTotal} shelves (${placed.ambient ?? 0} dry${islandNote} / ${placed.cold ?? 0} cold / ${placed.hot ?? 0} hot)${fitNote}`;
    plannerStatus.textContent = `${preset.label} baseline loaded — ${preset.blurb}. Adjust layout and costs as needed.`;
    plannerStatus.style.color = "var(--ok)";

    plannerState.canvas.discardActiveObject();
    plannerState.canvas.requestRenderAll();
    fitPlannerViewport();
    updatePlannerEstimate();
    persistState();
    requestPlanner3DSync();
  }

  function plannerStroke(mult = 1) {
    return Math.max(0.8, plannerState.scale * 0.045 * mult);
  }

  function plannerFontSize(mult = 1) {
    return Math.max(8, Math.min(12, plannerState.scale * 0.42 * mult));
  }

  function syncPlannerMeterScale() {
    if (!plannerCanvasWrap) return;
    const canvasW = plannerState.canvas ? plannerState.canvas.getWidth() : Math.max(640, plannerCanvasWrap.clientWidth - 2);
    const canvasH = plannerState.canvas ? plannerState.canvas.getHeight() : Math.max(460, plannerCanvasWrap.clientHeight - 2);
    const innerW = Math.max(320, canvasW - PLANNER_MARGIN * 2 - 8);
    const innerH = Math.max(280, canvasH - PLANNER_MARGIN * 2 - 8);
    const fitScale = Math.min(innerW / plannerState.widthMeters, innerH / plannerState.heightMeters);
    const nextScale = clamp(fitScale * 0.9, PLANNER_MIN_PX_PER_M, PLANNER_MAX_PX_PER_M);
    const scaleChanged = plannerState.scale && Math.abs(nextScale - plannerState.scale) > 0.001;
    plannerState.scale = nextScale;
    if (scaleChanged) repositionFixturesFromMeterPoses();
  }

  function updatePlannerGridScaleLabel(zoom = 1) {
    if (!plannerGridScaleLabel) return;
    const onScreen = plannerState.scale * zoom;
    plannerGridScaleLabel.textContent = `1 m ≈ ${onScreen.toFixed(0)} px on screen`;
  }

  function buildGatePanelShapes(width, height, strokeW, { fill, stroke, postFill }) {
    const shapes = [
      new fabric.Rect({
        width,
        height: Math.max(5, height),
        fill,
        stroke,
        strokeWidth: strokeW,
        originX: "center",
        originY: "center"
      })
    ];
    [-0.28, 0, 0.28].forEach((offset) => {
      shapes.push(
        new fabric.Rect({
          width: Math.max(2, width * 0.04),
          height: Math.max(8, height * 2.2),
          left: width * offset,
          fill: postFill,
          originX: "center",
          originY: "center"
        })
      );
    });
    return shapes;
  }

  function buildPlannerArtifactShapes(kind, width, height, spec) {
    const shapes = [];
    const strokeW = plannerStroke();
    const type = spec.type;

    if (type === "gondola" || type === "gondola-island") {
      const { fill, stroke } = spec.palette;
      const bandColor =
        kind === "shelf-cold" ? "#3b82f6" : kind === "shelf-hot" ? "#f97316" : kind === "shelf-island" ? "#9ca3af" : "#d9f04f";
      const tag =
        spec.tag2d ||
        (kind === "shelf-cold" ? "COLD" : kind === "shelf-hot" ? "HOT" : kind === "shelf-island" ? "ISL" : "DRY");
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill,
          stroke,
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: width * 0.92,
          height: Math.max(8, height * 0.24),
          fill: bandColor,
          stroke: "#111111",
          strokeWidth: Math.max(0.8, strokeW * 0.5),
          left: 0,
          top: -height / 2 + Math.max(8, height * 0.24) / 2 + 2,
          originX: "center",
          originY: "center"
        }),
        new fabric.Text(tag, {
          fontSize: Math.max(8, plannerFontSize(0.55)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "700",
          fill: kind === "shelf-ambient" || kind === "shelf-island" ? "#111111" : "#ffffff",
          left: 0,
          top: -height / 2 + Math.max(8, height * 0.24) / 2 + 2,
          originX: "center",
          originY: "center"
        })
      );
      for (let i = 1; i <= 3; i += 1) {
        const y = -height / 2 + (height * i) / 4;
        shapes.push(
          new fabric.Line([-width / 2 + 4, y, width / 2 - 4, y], {
            stroke,
            strokeWidth: Math.max(0.6, strokeW * 0.7),
            originX: "center",
            originY: "center"
          })
        );
      }
      if (type === "gondola-island") {
        shapes.push(
          new fabric.Line([0, -height / 2 + 4, 0, height / 2 - 4], {
            stroke,
            strokeWidth: Math.max(0.6, strokeW * 0.6),
            strokeDashArray: [5, 4],
            originX: "center",
            originY: "center"
          })
        );
      }
    } else if (type === "aisle") {
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill: "#f7f7f4",
          stroke: "#4b5563",
          strokeWidth: strokeW,
          strokeDashArray: [6, 4],
          originX: "center",
          originY: "center"
        })
      );
      const lane = width * 0.35;
      shapes.push(
        new fabric.Rect({
          width: lane,
          height: height - 8,
          fill: "transparent",
          stroke: "#9ca3af",
          strokeWidth: Math.max(0.6, strokeW * 0.6),
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "rack") {
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill: "#e8eef8",
          stroke: "#1e3a8a",
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: width * 0.7,
          height: height * 0.55,
          fill: "#cbd5e1",
          stroke: "#1e3a8a",
          strokeWidth: Math.max(0.6, strokeW * 0.7),
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "entry-open") {
      shapes.push(
        new fabric.Rect({
          width,
          height: Math.max(4, height),
          fill: "#ede9fe",
          stroke: "#5b21b6",
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        }),
        new fabric.Triangle({
          width: Math.max(8, width * 0.12),
          height: Math.max(8, width * 0.1),
          fill: "#5b21b6",
          angle: 90,
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "entry-gated" || kind === "checkout") {
      const isExit = kind === "checkout" || spec.gatePalette === "checkout";
      shapes.push(
        ...buildGatePanelShapes(width, height, strokeW, {
          fill: isExit ? "#fffbeb" : "#fce7f3",
          stroke: isExit ? "#b45309" : "#9d174d",
          postFill: isExit ? "#b45309" : "#9d174d"
        })
      );
    } else if (type === "zone") {
      const { fill, stroke } = spec.palette;
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill,
          stroke,
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        }),
        new fabric.Line([-width / 2 + 6, -height / 2 + 6, width / 2 - 6, height / 2 - 6], {
          stroke,
          strokeWidth: Math.max(0.6, strokeW * 0.6),
          opacity: 0.5
        }),
        new fabric.Line([-width / 2 + 6, height / 2 - 6, width / 2 - 6, -height / 2 + 6], {
          stroke,
          strokeWidth: Math.max(0.6, strokeW * 0.6),
          opacity: 0.5
        })
      );
    } else if (type === "wall") {
      shapes.push(
        new fabric.Rect({
          width,
          height: Math.max(3, height),
          fill: "#4b5563",
          stroke: "#111827",
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "cage") {
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill: "#ffffff",
          stroke: "#991b1b",
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        })
      );
      const stripes = 6;
      for (let i = 0; i < stripes; i += 1) {
        const x = -width / 2 + ((i + 0.5) * width) / stripes;
        shapes.push(
          new fabric.Rect({
            width: Math.max(3, width / (stripes * 2)),
            height,
            left: x,
            angle: 24,
            fill: "#ef4444",
            opacity: 0.75,
            originX: "center",
            originY: "center"
          })
        );
      }
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill: "transparent",
          stroke: "#7f1d1d",
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "entry-zone") {
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill: "#fffbeb",
          stroke: "#a16207",
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        })
      );
      const stripes = 7;
      for (let i = 0; i < stripes; i += 1) {
        const x = -width / 2 + ((i + 0.5) * width) / stripes;
        shapes.push(
          new fabric.Rect({
            width: Math.max(3, width / (stripes * 2.2)),
            height,
            left: x,
            angle: 24,
            fill: "#facc15",
            opacity: 0.8,
            originX: "center",
            originY: "center"
          })
        );
      }
    } else if (type === "monitor-entrance") {
      const { fill, stroke } = spec.palette || { fill: "#cffafe", stroke: "#0e7490" };
      const cell = Math.max(12, width / 4);
      for (let gx = -width / 2; gx < width / 2; gx += cell) {
        shapes.push(
          new fabric.Line([gx, -height / 2, gx, height / 2], {
            stroke,
            strokeWidth: 0.6,
            opacity: 0.25,
            originX: "center",
            originY: "center"
          })
        );
      }
      shapes.push(
        new fabric.Circle({
          radius: Math.max(5, width * 0.08),
          fill: stroke,
          top: -height / 2 - Math.max(6, width * 0.06),
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: Math.max(8, width * 0.12),
          height: Math.max(5, width * 0.07),
          fill: "#1f2937",
          top: -height / 2 - Math.max(8, width * 0.08),
          originX: "center",
          originY: "center"
        })
      );
      shapes.push(
        new fabric.Rect({
          width,
          height: Math.max(6, height),
          fill,
          stroke,
          strokeWidth: strokeW,
          strokeDashArray: [8, 4],
          originX: "center",
          originY: "center"
        })
      );
      [-0.32, 0.32].forEach((offset) => {
        shapes.push(
          new fabric.Triangle({
            width: Math.max(10, width * 0.14),
            height: Math.max(10, width * 0.12),
            left: width * offset,
            fill: stroke,
            angle: offset < 0 ? -90 : 90,
            originX: "center",
            originY: "center"
          })
        );
      });
      shapes.push(
        new fabric.Text(spec.tag2d || "IN/OUT", {
          fontSize: Math.max(8, plannerFontSize(0.5)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "700",
          fill: stroke,
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "monitor-zone") {
      const { fill, stroke } = spec.palette || { fill: "#e0f2fe", stroke: "#0369a1" };
      const cellW = Math.max(14, width / 3);
      const cellH = Math.max(14, height / 3);
      for (let gx = -width / 2; gx <= width / 2; gx += cellW) {
        shapes.push(
          new fabric.Line([gx, -height / 2, gx, height / 2], {
            stroke,
            strokeWidth: 0.6,
            opacity: 0.28,
            originX: "center",
            originY: "center"
          })
        );
      }
      for (let gy = -height / 2; gy <= height / 2; gy += cellH) {
        shapes.push(
          new fabric.Line([-width / 2, gy, width / 2, gy], {
            stroke,
            strokeWidth: 0.6,
            opacity: 0.28,
            originX: "center",
            originY: "center"
          })
        );
      }
      shapes.push(
        new fabric.Circle({
          radius: Math.max(6, Math.min(width, height) * 0.09),
          fill: stroke,
          top: -height / 2 + Math.max(8, height * 0.12),
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: Math.max(10, Math.min(width, height) * 0.14),
          height: Math.max(6, Math.min(width, height) * 0.08),
          fill: "#1f2937",
          top: -height / 2 + Math.max(6, height * 0.1),
          originX: "center",
          originY: "center"
        })
      );
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill,
          stroke,
          strokeWidth: strokeW,
          strokeDashArray: [10, 5],
          originX: "center",
          originY: "center"
        })
      );
      const stripes = 5;
      for (let i = 0; i < stripes; i += 1) {
        const x = -width / 2 + ((i + 0.5) * width) / stripes;
        shapes.push(
          new fabric.Line([x, -height / 2 + 4, x + width * 0.08, height / 2 - 4], {
            stroke,
            strokeWidth: Math.max(0.5, strokeW * 0.45),
            opacity: 0.35,
            originX: "center",
            originY: "center"
          })
        );
      }
      shapes.push(
        new fabric.Text(spec.tag2d || "ZONE", {
          fontSize: Math.max(9, plannerFontSize(0.55)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "800",
          fill: stroke,
          originX: "center",
          originY: "center"
        })
      );
    }

    shapes.push(
      new fabric.Text(spec.label, {
        fontSize: plannerFontSize(),
        fontFamily: "Inter, Arial, sans-serif",
        fill: "#111111",
        left: 0,
        top: height / 2 + plannerFontSize(0.35),
        originX: "center",
        originY: "center"
      })
    );

    return shapes;
  }

  function syncPlannerMetaFromCanvas() {
    if (!plannerState.canvas) return;
    plannerState.canvas.getObjects().forEach((obj) => {
      if (!obj.plannerKind && obj.type === "group" && obj._objects && obj._objects[1] && obj._objects[1].text) {
        obj.plannerKind = obj._objects[1].text;
      }
      if (obj.plannerKind) {
        ensurePlannerObjectId(obj);
        const fabricPose = readMeterPoseFromFabric(obj);
        const pose = obj.plannerPoseMeters
          ? {
              x: obj.plannerPoseMeters.x,
              z: obj.plannerPoseMeters.z,
              angle: normalizePlannerAngle(obj.plannerPoseMeters.angle ?? fabricPose.angle)
            }
          : fabricPose;
        writeMeterPoseToFabric(obj, pose);
      }
    });
  }

  function clearPlannerObjects() {
    if (!plannerState.canvas) return;
    const toRemove = plannerState.canvas
      .getObjects()
      .filter((obj) => obj !== plannerState.boundary && obj !== plannerState.blueprintObject && !plannerState.gridObjects.includes(obj));
    toRemove.forEach((obj) => plannerState.canvas.remove(obj));
    updatePlannerEstimate();
  }

  function getPlannerCostModel() {
    return {
      ambientShelf: clamp(Number(costAmbientShelfInput.value) || 0, 0, 200000),
      coldShelf: clamp(Number(costColdShelfInput.value) || 0, 0, 200000),
      hotShelf: clamp(Number(costHotShelfInput.value) || 0, 0, 200000),
      installPerShelf: clamp(Number(costInstallPerShelfInput.value) || 0, 0, 200000),
      integrationFixed: clamp(Number(costIntegrationFixedInput.value) || 0, 0, 2000000),
      setupPercent: clamp(Number(costSetupPercentInput.value) || 0, 0, 100),
      contingencyPercent: clamp(Number(costContingencyPercentInput.value) || 0, 0, 100)
    };
  }

  function applyPlannerCostModel(model) {
    const safeModel = { ...defaultPlannerCostModel, ...(model || {}) };
    costAmbientShelfInput.value = String(clamp(Number(safeModel.ambientShelf) || 0, 0, 200000));
    costColdShelfInput.value = String(clamp(Number(safeModel.coldShelf) || 0, 0, 200000));
    costHotShelfInput.value = String(clamp(Number(safeModel.hotShelf) || 0, 0, 200000));
    costInstallPerShelfInput.value = String(clamp(Number(safeModel.installPerShelf) || 0, 0, 200000));
    costIntegrationFixedInput.value = String(clamp(Number(safeModel.integrationFixed) || 0, 0, 2000000));
    costSetupPercentInput.value = String(clamp(Number(safeModel.setupPercent) || 0, 0, 100));
    costContingencyPercentInput.value = String(clamp(Number(safeModel.contingencyPercent) || 0, 0, 100));
  }

  function updatePlannerEstimate() {
    const counts = { ambient: 0, cold: 0, hot: 0 };
    if (plannerState.canvas) {
      plannerState.canvas.getObjects().forEach((obj) => {
        if (obj.plannerKind === "shelf-ambient" || obj.plannerKind === "shelf-island") counts.ambient += 1;
        if (obj.plannerKind === "shelf-cold") counts.cold += 1;
        if (obj.plannerKind === "shelf-hot") counts.hot += 1;
      });
    }

    const costModel = getPlannerCostModel();
    const shelfCount = counts.ambient + counts.cold + counts.hot;
    const shelfAndInstallSubtotal =
      counts.ambient * costModel.ambientShelf +
      counts.cold * costModel.coldShelf +
      counts.hot * costModel.hotShelf +
      shelfCount * costModel.installPerShelf;
    const baseSubtotal = shelfAndInstallSubtotal + costModel.integrationFixed;
    const setupAddon = baseSubtotal * (costModel.setupPercent / 100);
    const contingencyAddon = (baseSubtotal + setupAddon) * (costModel.contingencyPercent / 100);
    const capex = baseSubtotal + setupAddon + contingencyAddon;
    const areaSqm = Math.max(1, plannerState.widthMeters * plannerState.heightMeters);
    const capexPerSqm = capex / areaSqm;
    const monthlyService = capex * 0.12 / 12;

    countAmbientShelfLabel.textContent = String(counts.ambient);
    countColdShelfLabel.textContent = String(counts.cold);
    countHotShelfLabel.textContent = String(counts.hot);
    plannerEstimatedSubtotalLabel.textContent = currency.format(baseSubtotal);
    plannerEstimatedSetupLabel.textContent = currency.format(setupAddon);
    plannerEstimatedContingencyLabel.textContent = currency.format(contingencyAddon);
    plannerEstimatedCapexLabel.textContent = currency.format(capex);
    plannerEstimatedCostPerSqmLabel.textContent = `${currency.format(capexPerSqm)}/m²`;
    plannerEstimatedMonthlyLabel.textContent = currency.format(monthlyService);
    updateMonitoringSummary();
  }

  function resizePlannerCanvasToContainer() {
    if (!plannerState.canvas || !plannerCanvasWrap) return;
    const width = Math.max(640, Math.floor(plannerCanvasWrap.clientWidth) - 2);
    const height = Math.max(460, Math.floor(plannerCanvasWrap.clientHeight) - 2);
    plannerState.canvas.setWidth(width);
    plannerState.canvas.setHeight(height);
    syncPlannerMeterScale();
    drawPlannerBoundary();
    fitPlannerViewport();
  }

  function fitPlannerViewport() {
    if (!plannerState.canvas) return;
    const canvasWidth = plannerState.canvas.getWidth();
    const canvasHeight = plannerState.canvas.getHeight();
    const contentWidth = metersToPx(plannerState.widthMeters) + PLANNER_MARGIN * 2;
    const contentHeight = metersToPx(plannerState.heightMeters) + PLANNER_MARGIN * 2;
    const padding = 20;
    const fitZoom = Math.min(
      (canvasWidth - padding * 2) / contentWidth,
      (canvasHeight - padding * 2) / contentHeight
    );
    const minZoomForMeter = PLANNER_MIN_PX_PER_M / plannerState.scale;
    let zoom = fitZoom;
    if (fitZoom >= minZoomForMeter) {
      zoom = Math.min(fitZoom, 1.08);
    }
    zoom = clamp(zoom, 0.28, 1.08);

    const offsetX = (canvasWidth - contentWidth * zoom) / 2;
    const offsetY = (canvasHeight - contentHeight * zoom) / 2;
    plannerState.canvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY]);
    updatePlannerGridScaleLabel(zoom);
    plannerState.canvas.requestRenderAll();
  }

  function estimateShelfCountFromBlueprint(renderCanvas) {
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
        if (area >= 110 && area <= 18000 && compW >= 26 && compH >= 8 && aspect >= 1.8 && aspect <= 9 && fillRatio <= 0.72) {
          components.push({ area, compW, compH, aspect, fillRatio, minX, minY });
        }
      }
    }

    const estimatedCount = clamp(components.length, 0, 40);
    if (estimatedCount > 0) return estimatedCount;
    const fallbackFromArea = Math.round((plannerState.widthMeters * plannerState.heightMeters) / 24);
    return clamp(fallbackFromArea, 4, 30);
  }

  function clearAutoShelfObjects() {
    if (!plannerState.canvas) return;
    const kinds = new Set(["shelf-ambient", "shelf-island", "shelf-cold", "shelf-hot"]);
    const toRemove = plannerState.canvas.getObjects().filter((obj) => kinds.has(obj.plannerKind));
    toRemove.forEach((obj) => plannerState.canvas.remove(obj));
  }

  function preloadShelvesFromBlueprint(estimatedCount) {
    if (!plannerState.canvas) return;
    clearAutoShelfObjects();
    const total = clamp(Math.round(estimatedCount), 1, 60);
    const cold = Math.max(1, Math.round(total * 0.25));
    const hot = Math.max(1, Math.round(total * 0.15));
    const ambient = Math.max(1, total - cold - hot);

    const placements = [];
    for (let i = 0; i < ambient; i += 1) placements.push("shelf-ambient");
    for (let i = 0; i < cold; i += 1) placements.push("shelf-cold");
    for (let i = 0; i < hot; i += 1) placements.push("shelf-hot");

    const boundaryLeft = PLANNER_MARGIN;
    const boundaryTop = PLANNER_MARGIN;
    const widthPx = metersToPx(plannerState.widthMeters);
    const heightPx = metersToPx(plannerState.heightMeters);
    const cols = Math.max(3, Math.ceil(Math.sqrt(placements.length)));
    const rows = Math.max(1, Math.ceil(placements.length / cols));
    const cellW = widthPx / cols;
    const cellH = heightPx / rows;
    const yStart = boundaryTop + Math.max(18, heightPx * 0.42);

    placements.forEach((kind, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const left = boundaryLeft + cellW * col + cellW * 0.5;
      const top = Math.min(boundaryTop + heightPx - 18, yStart + row * cellH + cellH * 0.45);
      const angle = row % 2 === 0 ? 0 : 90;
      addPlannerObject(kind, { left, top, angle });
    });
  }

  async function loadPlannerBlueprintPdf(file) {
    if (!plannerState.canvas) return;
    if (!file) return;
    if (!window.pdfjsLib) {
      plannerStatus.textContent = "PDF support unavailable. Check network and refresh the page.";
      plannerStatus.style.color = "var(--warn)";
      return;
    }

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const ratio = baseViewport.width / Math.max(1, baseViewport.height);
      const area = plannerState.widthMeters * plannerState.heightMeters;
      const nextWidth = clamp(Math.sqrt(area * ratio), 5, 200);
      const nextHeight = clamp(area / Math.max(1, nextWidth), 5, 200);
      plannerState.widthMeters = Number(nextWidth.toFixed(1));
      plannerState.heightMeters = Number(nextHeight.toFixed(1));
      plannerWidthInput.value = String(plannerState.widthMeters);
      plannerHeightInput.value = String(plannerState.heightMeters);
      drawPlannerBoundary();
      resizePlannerCanvasToContainer();
      const maxWidth = Math.max(120, metersToPx(plannerState.widthMeters) - 8);
      const maxHeight = Math.max(120, metersToPx(plannerState.heightMeters) - 8);
      const scale = Math.min(maxWidth / baseViewport.width, maxHeight / baseViewport.height);
      const viewport = page.getViewport({ scale: Math.max(0.1, scale) });
      const renderCanvas = document.createElement("canvas");
      const context = renderCanvas.getContext("2d");
      renderCanvas.width = Math.ceil(viewport.width);
      renderCanvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;

      if (plannerState.blueprintObject) plannerState.canvas.remove(plannerState.blueprintObject);

      const image = new fabric.Image(renderCanvas, {
        left: PLANNER_MARGIN + 4,
        top: PLANNER_MARGIN + 4,
        selectable: false,
        evented: false,
        opacity: 0.46,
        excludeFromExport: true
      });
      image.plannerKind = "blueprint";
      plannerState.blueprintObject = image;
      plannerState.canvas.add(image);
      image.sendToBack();
      plannerState.gridObjects.forEach((obj) => obj.bringToFront());
      if (plannerState.boundary) plannerState.boundary.bringToFront();
      fitPlannerViewport();
      plannerState.canvas.requestRenderAll();

      const estimatedShelves = estimateShelfCountFromBlueprint(renderCanvas);
      preloadShelvesFromBlueprint(estimatedShelves);
      updatePlannerEstimate();

      plannerStatus.textContent = `Blueprint loaded (${file.name}) - page 1. Preloaded ${estimatedShelves} shelf units for adjustment.`;
      plannerStatus.style.color = "var(--ok)";
    } catch (_error) {
      plannerStatus.textContent = "Could not read PDF blueprint. Please upload a valid PDF.";
      plannerStatus.style.color = "var(--bad)";
    }
  }

  function drawPlannerGrid() {
    if (!plannerState.canvas) return;
    plannerState.gridObjects.forEach((obj) => plannerState.canvas.remove(obj));
    plannerState.gridObjects = [];

    const startX = PLANNER_MARGIN;
    const startY = PLANNER_MARGIN;
    const widthPx = metersToPx(plannerState.widthMeters);
    const heightPx = metersToPx(plannerState.heightMeters);
    const oneMeterPx = metersToPx(1);

    for (let x = 0; x <= widthPx; x += oneMeterPx) {
      const meter = Math.round(x / oneMeterPx);
      const isMajor = meter % 5 === 0;
      const line = new fabric.Line([startX + x, startY, startX + x, startY + heightPx], {
        stroke: isMajor ? "#6b7280" : "#c5c9c0",
        strokeWidth: isMajor ? 1.2 : 0.7,
        selectable: false,
        evented: false,
        excludeFromExport: true
      });
      plannerState.canvas.add(line);
      plannerState.gridObjects.push(line);
      if (isMajor && meter > 0) {
        const label = new fabric.Text(`${meter}m`, {
          left: startX + x + 2,
          top: startY + 2,
          fontSize: plannerFontSize(0.85),
          fill: "#374151",
          fontFamily: "ui-monospace, monospace",
          selectable: false,
          evented: false,
          excludeFromExport: true
        });
        plannerState.canvas.add(label);
        plannerState.gridObjects.push(label);
      }
    }

    for (let y = 0; y <= heightPx; y += oneMeterPx) {
      const meter = Math.round(y / oneMeterPx);
      const isMajor = meter % 5 === 0;
      const line = new fabric.Line([startX, startY + y, startX + widthPx, startY + y], {
        stroke: isMajor ? "#6b7280" : "#c5c9c0",
        strokeWidth: isMajor ? 1.2 : 0.7,
        selectable: false,
        evented: false,
        excludeFromExport: true
      });
      plannerState.canvas.add(line);
      plannerState.gridObjects.push(line);
    }
  }

  function deleteSelectedPlannerObjects() {
    if (!plannerState.canvas) return;
    const selected = plannerState.canvas.getActiveObjects();
    if (!selected || selected.length === 0) {
      plannerStatus.textContent = "No selected object to delete.";
      plannerStatus.style.color = "var(--warn)";
      return;
    }

    selected.forEach((obj) => {
      if (obj !== plannerState.boundary) plannerState.canvas.remove(obj);
    });
    plannerState.canvas.discardActiveObject();
    plannerState.canvas.requestRenderAll();
    updatePlannerEstimate();
    updateMonitoringSummary();
    plannerStatus.textContent = "Selected object deleted.";
    plannerStatus.style.color = "var(--ok)";
    persistState();
    requestPlanner3DSync();
  }

  function drawPlannerBoundary() {
    if (!plannerState.canvas) return;
    if (plannerState.boundary) plannerState.canvas.remove(plannerState.boundary);
    drawPlannerGrid();
    const boundary = new fabric.Rect({
      left: PLANNER_MARGIN,
      top: PLANNER_MARGIN,
      width: metersToPx(plannerState.widthMeters),
      height: metersToPx(plannerState.heightMeters),
      fill: "transparent",
      stroke: "#111111",
      strokeWidth: 1.6,
      rx: 2,
      ry: 2,
      selectable: false,
      evented: false,
      excludeFromExport: true
    });
    plannerState.boundary = boundary;
    plannerState.canvas.add(boundary);
    boundary.bringToFront();
    updatePlannerArea();
    fitPlannerViewport();
    plannerState.canvas.renderAll();
  }

  function applyStoreDimensions() {
    const widthMeters = clamp(Number(plannerWidthInput.value) || 20, 5, 200);
    const heightMeters = clamp(Number(plannerHeightInput.value) || 20, 5, 200);
    plannerState.widthMeters = widthMeters;
    plannerState.heightMeters = heightMeters;
    plannerWidthInput.value = String(widthMeters);
    plannerHeightInput.value = String(heightMeters);
    syncPlannerMeterScale();
    drawPlannerBoundary();
    fitPlannerViewport();
    requestPlanner3DSync();
    persistState();
  }

  function defaultPlannerPlacement() {
    const w = metersToPx(plannerState.widthMeters);
    const h = metersToPx(plannerState.heightMeters);
    return {
      left: PLANNER_MARGIN + w * 0.35 + Math.random() * w * 0.3,
      top: PLANNER_MARGIN + h * 0.35 + Math.random() * h * 0.25
    };
  }

  function addPlannerObject(kind, options = {}) {
    if (!plannerState.canvas) return;
    flushPlanner3DTransforms();
    const spec = PLANNER_ARTIFACTS[kind];
    if (!spec) return;
    const width = metersToPx(spec.w);
    const height = metersToPx(spec.h);
    const placement = defaultPlannerPlacement();
    const shapes = buildPlannerArtifactShapes(kind, width, height, spec);

    const group = new fabric.Group(shapes, {
      originX: "center",
      originY: "center",
      left: options.left ?? placement.left,
      top: options.top ?? placement.top,
      angle: normalizePlannerAngle(options.angle ?? 0),
      hasRotatingPoint: true,
      cornerStyle: "rect",
      cornerColor: "#111111",
      cornerStrokeColor: "#d9f04f",
      transparentCorners: false,
      borderColor: "#111111"
    });
    group.plannerKind = kind;
    group.plannerMeters = { w: spec.w, h: spec.h };
    if (options.objectId) {
      group.plannerObjectId = options.objectId;
    } else {
      ensurePlannerObjectId(group);
    }
    capturePlannerPoseMeters(group);
    plannerState.canvas.add(group);
    if (!options.silent) {
      plannerState.canvas.setActiveObject(group);
    }
    plannerState.canvas.renderAll();
    if (!options.silent) {
      updatePlannerEstimate();
      persistState();
    }
  }


  function initPlanner() {
    if (plannerState.canvas) return true;
    if (!window.fabric) {
      plannerStatus.textContent = "Planner library failed to load. Refresh the page.";
      plannerStatus.style.color = "var(--bad)";
      return false;
    }
    plannerState.canvas = new fabric.Canvas("plannerCanvas", {
      preserveObjectStacking: true,
      selection: true
    });

    applyPlannerCostModel(defaultPlannerCostModel);
    resizePlannerCanvasToContainer();
    updatePlannerEstimate();
    const sync3d = () => requestPlanner3DSync();
    plannerState.canvas.on("object:modified", (event) => {
      if (event?.target && isPlannerFixture(event.target)) capturePlannerPoseMeters(event.target);
      persistState();
      sync3d();
    });
    plannerState.canvas.on("object:rotating", (event) => {
      if (event?.target && isPlannerFixture(event.target)) {
        capturePlannerPoseMeters(event.target);
        if (plannerViewMode === "3d" || plannerViewMode === "simulation") {
          syncPlanner3DView();
        }
      }
    });
    plannerState.canvas.on("object:added", () => {
      updatePlannerEstimate();
      persistState();
      if (!plannerBatchAdding) sync3d();
    });
    plannerState.canvas.on("object:removed", () => {
      updatePlannerEstimate();
      persistState();
      if (!plannerBatchAdding) sync3d();
    });
    plannerStatus.textContent = "Planner ready. Add objects and drag them on the canvas.";
    plannerStatus.style.color = "var(--ok)";
    return true;
  }

  function serializePlannerState() {
    return {
      version: 2,
      widthMeters: plannerState.widthMeters,
      heightMeters: plannerState.heightMeters,
      activePresetId: plannerState.activePresetId,
      costModel: getPlannerCostModel(),
      preferences: {
        showMonitoringViz: showMonitoringVizPref,
        simOccupancy: simOccupancyPref,
        simPlaying: simPlaying
      },
      canvasJson: plannerState.canvas
        ? plannerState.canvas.toDatalessJSON(["plannerKind", "plannerObjectId", "plannerMeters", "plannerPoseMeters"])
        : null
    };
  }

  function applyPlannerState(state) {
    if (!state || typeof state !== "object") return;
    if (state.widthMeters) plannerWidthInput.value = state.widthMeters;
    if (state.heightMeters) plannerHeightInput.value = state.heightMeters;
    plannerState.activePresetId = state.activePresetId || null;
    applyPlannerCostModel(state.costModel || defaultPlannerCostModel);
    if (state.preferences) {
      showMonitoringVizPref = state.preferences.showMonitoringViz !== false;
      simOccupancyPref = Number(state.preferences.simOccupancy) || 24;
      simPlaying = state.preferences.simPlaying !== false;
      syncMonitoringGridButton();
      if (simOccupancySlider) simOccupancySlider.value = String(simOccupancyPref);
      if (simOccupancyVal) simOccupancyVal.textContent = String(simOccupancyPref);
      syncSimPlayButton();
      if (planner3dView) planner3dView.setShowMonitoringViz(showMonitoringVizPref);
    }
    applyStoreDimensions();
    highlightActivePresetButton();
    if (plannerState.activePresetId && STORE_PRESETS[plannerState.activePresetId]) {
      const p = STORE_PRESETS[plannerState.activePresetId];
      plannerPresetSummary.textContent = `${p.label}: ${plannerState.widthMeters}×${plannerState.heightMeters} m (${number.format(plannerState.widthMeters * plannerState.heightMeters)} m²)`;
    }
    if (state.canvasJson && plannerState.canvas) {
      layoutApplying = true;
      plannerState.canvas.loadFromJSON(state.canvasJson, () => {
        plannerState.canvas.renderAll();
        syncPlannerMetaFromCanvas();
        updatePlannerEstimate();
        updateMonitoringSummary();
        layoutApplying = false;
        refreshCachedLayout();
        requestPlanner3DSync({ resetSimulation: false });
      });
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializePlannerState()));
    } catch (_err) {}
  }

  function loadPersistedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applyPlannerState(JSON.parse(raw));
        return true;
      }
      const legacyRaw = localStorage.getItem(LEGACY_SIMULATOR_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy.planner) {
          applyPlannerState(legacy.planner);
          persistState();
          return true;
        }
      }
      return false;
    } catch (_err) {
      return false;
    }
  }

  plannerView2dBtn.addEventListener("click", () => {
    setPlannerViewMode("2d");
  });

  plannerView3dBtn.addEventListener("click", async () => {
    await setPlannerViewMode("3d");
  });

  plannerViewSimBtn.addEventListener("click", async () => {
    await setPlannerViewMode("simulation");
  });

  simOccupancySlider?.addEventListener("input", async () => {
    simOccupancyPref = Number(simOccupancySlider.value);
    if (simOccupancyVal) simOccupancyVal.textContent = String(simOccupancyPref);
    persistState();
    if (plannerViewMode === "simulation") {
      await ensureShopperSim();
      if (shopperSim) {
        shopperSim.setCount(simOccupancyPref);
        if (planner3dView) planner3dView.updateShoppers(shopperSim.getShopperPositions());
      }
    } else {
      runStoreSimulation();
    }
  });

  simPlayBtn?.addEventListener("click", () => {
    simPlaying = !simPlaying;
    syncSimPlayButton();
    syncSimulationUi();
    persistState();
    if (simPlaying) startLiveSimulationLoop();
    else stopLiveSimulation();
  });

  simRandomizeBtn?.addEventListener("click", async () => {
    await ensureShopperSim();
    if (!shopperSim) return;
    shopperSim.randomize();
    if (planner3dView) {
      planner3dView.updateShoppers(shopperSim.getShopperPositions());
      planner3dView.updateHeatmap(shopperSim.getHeatmap());
    }
    if (!simPlaying) {
      simPlaying = true;
      syncSimPlayButton();
      syncSimulationUi();
    }
    startLiveSimulationLoop();
  });

  planner3dMoveBtn.addEventListener("click", () => setPlanner3dTool("translate"));
  planner3dRotateBtn.addEventListener("click", () => setPlanner3dTool("rotate"));
  planner3dHumanBtn.addEventListener("click", () => {
    if (!planner3dView) return;
    const mode = planner3dView.getInteractionMode();
    planner3dView.setInteractionMode(mode === "placeHuman" ? "edit" : "placeHuman");
  });
  planner3dWalkBtn.addEventListener("click", () => {
    if (!planner3dView) return;
    const mode = planner3dView.getInteractionMode();
    planner3dView.setInteractionMode(mode === "walk" ? "edit" : "walk");
  });
  planner3dIsoBtn?.addEventListener("click", () => {
    if (!planner3dView) return;
    const next = planner3dView.getCameraView() === "isometric" ? "perspective" : "isometric";
    planner3dView.setCameraView(next);
    planner3dIsoBtn.classList.toggle("active", next === "isometric");
    planner3dIsoBtn.textContent = next === "isometric" ? "Isometric" : "Perspective";
    planner3dView.fitCamera();
  });
  planner3dFitBtn.addEventListener("click", () => {
    if (planner3dView) planner3dView.fitCamera();
  });
  planner3dZoomInBtn.addEventListener("click", () => {
    if (planner3dView) planner3dView.zoomIn();
  });
  planner3dZoomOutBtn.addEventListener("click", () => {
    if (planner3dView) planner3dView.zoomOut();
  });
  planner3dGridBtn.addEventListener("click", () => {
    showMonitoringVizPref = !showMonitoringVizPref;
    syncMonitoringGridButton();
    if (planner3dView) {
      planner3dView.setShowMonitoringViz(showMonitoringVizPref);
    }
    persistState();
  });

  planner3dDeleteBtn?.addEventListener("click", () => {
    planner3dView?.deleteSelectedFixture?.();
  });

  applyStoreSizeBtn.addEventListener("click", () => {
    if (!plannerState.canvas) initPlanner();
    applyStoreDimensions();
  });

  plannerPresetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyStorePreset(button.dataset.preset);
    });
  });
  bindPlannerAddButtonContainers();
  plannerClearBtn.addEventListener("click", () => {
    if (!plannerState.canvas) initPlanner();
    clearPlannerObjects();
    if (plannerState.canvas) plannerState.canvas.renderAll();
    updatePlannerEstimate();
    updateMonitoringSummary();
    requestPlanner3DSync();
  });
  plannerDeleteSelectedBtn.addEventListener("click", () => {
    if (!plannerState.canvas) initPlanner();
    deleteSelectedPlannerObjects();
  });

  plannerExportPngBtn.addEventListener("click", () => {
    if (!plannerState.canvas) initPlanner();
    if (!plannerState.canvas) return;
    const dataURL = plannerState.canvas.toDataURL({ format: "png", multiplier: 2 });
    const anchor = document.createElement("a");
    anchor.href = dataURL;
    anchor.download = "store-planner-layout.png";
    anchor.click();
  });

  plannerExportSvgBtn.addEventListener("click", () => {
    if (!plannerState.canvas) initPlanner();
    if (!plannerState.canvas) return;
    const svg = plannerState.canvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "store-planner-layout.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  plannerExportJsonBtn.addEventListener("click", async () => {
    if (!plannerState.canvas) initPlanner();
    if (!plannerState.canvas) return;
    await ensureLayoutDocumentModule();
    const document = buildCurrentLayoutDocument();
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "store-planner-layout.json";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  plannerImportJsonBtn.addEventListener("click", () => plannerImportInput.click());
  plannerImportInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!plannerState.canvas) initPlanner();
    if (!file || !plannerState.canvas) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.type === "store-layout-template" && parsed.document) {
        await applyLayoutDocument(parsed.document, { sourceLabel: parsed.name || "Template" });
        event.target.value = "";
        return;
      }
      const doc = parsed.document || parsed;
      await applyLayoutDocument(doc, { sourceLabel: "Imported plan" });
    } catch (_err) {
      alert("Could not import planner JSON file.");
    }
    event.target.value = "";
  });

  plannerTemplateSelect?.addEventListener("change", () => {
    if (!layoutDocModule || !plannerTemplateSummary) return;
    const store = layoutDocModule.loadTemplatesStore();
    const selected = store.templates.find((entry) => entry.id === plannerTemplateSelect.value);
    plannerTemplateSummary.textContent = selected
      ? `${selected.name} · ${selected.document?.store?.widthMeters || "?"}×${selected.document?.store?.heightMeters || "?"} m`
      : "No saved templates yet.";
  });

  plannerLoadTemplateBtn?.addEventListener("click", () => {
    void loadSelectedTemplate();
  });

  plannerSaveTemplateBtn?.addEventListener("click", async () => {
    if (!plannerState.canvas) initPlanner();
    const name = window.prompt("Template name", plannerState.activePresetId ? `${STORE_PRESETS[plannerState.activePresetId]?.label || "Store"} layout` : "My store layout");
    if (!name) return;
    await saveCurrentLayoutTemplate(name);
  });

  plannerExportTemplateBtn?.addEventListener("click", () => {
    void exportSelectedTemplate();
  });

  plannerExport3dSnapshotBtn?.addEventListener("click", () => {
    void export3dSnapshotPng();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Delete" && event.key !== "Backspace") return;

    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
      return;
    }

    if (plannerViewMode === "3d" && planner3dView?.deleteSelectedFixture?.()) {
      event.preventDefault();
      return;
    }

    if (!plannerState.canvas) return;
    event.preventDefault();
    deleteSelectedPlannerObjects();
  });

  [costAmbientShelfInput, costColdShelfInput, costHotShelfInput, costInstallPerShelfInput, costIntegrationFixedInput].forEach((input) =>
    input.addEventListener("input", () => {
      updatePlannerEstimate();
      persistState();
    })
  );

  [costSetupPercentInput, costContingencyPercentInput].forEach((input) =>
    input.addEventListener("input", () => {
      updatePlannerEstimate();
      persistState();
    })
  );

  plannerLoadBlueprintBtn.addEventListener("click", () => plannerBlueprintInput.click());
  plannerBlueprintInput.addEventListener("change", async (event) => {
    if (!plannerState.canvas) initPlanner();
    const file = event.target.files && event.target.files[0];
    await loadPlannerBlueprintPdf(file);
    event.target.value = "";
  });

  plannerClearBlueprintBtn.addEventListener("click", () => {
    if (!plannerState.canvas) initPlanner();
    if (!plannerState.canvas || !plannerState.blueprintObject) return;
    plannerState.canvas.remove(plannerState.blueprintObject);
    plannerState.blueprintObject = null;
    plannerState.canvas.requestRenderAll();
    plannerStatus.textContent = "Blueprint removed.";
    plannerStatus.style.color = "var(--ok)";
  });

  window.addEventListener("resize", () => {
    if (!plannerState.canvas) return;
    if (plannerViewMode === "3d" || plannerViewMode === "simulation") resizePlanner3DView();
    else resizePlannerCanvasToContainer();
  });

  const plannerResetBtn = document.getElementById("plannerResetBtn");
  const plannerExportStateBtn = document.getElementById("plannerExportStateBtn");
  const plannerImportStateBtn = document.getElementById("plannerImportStateBtn");
  const plannerImportStateInput = document.getElementById("plannerImportStateInput");

  plannerResetBtn?.addEventListener("click", () => {
    plannerWidthInput.value = "20";
    plannerHeightInput.value = "20";
    plannerState.widthMeters = 20;
    plannerState.heightMeters = 20;
    plannerState.activePresetId = null;
    applyPlannerCostModel(defaultPlannerCostModel);
    applyStoreDimensions();
    clearPlannerObjects();
    clearPlannerBlueprint();
    highlightActivePresetButton();
    plannerPresetSummary.textContent = "No baseline loaded.";
    updatePlannerEstimate();
    updateMonitoringSummary();
    persistState();
    requestPlanner3DSync();
  });

  plannerExportStateBtn?.addEventListener("click", () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "Smart Store Planner",
      version: 1,
      data: serializePlannerState()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "store-planner-session.json";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  plannerImportStateBtn?.addEventListener("click", () => plannerImportStateInput?.click());
  plannerImportStateInput?.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!plannerState.canvas) initPlanner();
    try {
      const parsed = JSON.parse(await file.text());
      applyPlannerState(parsed.data || parsed);
      persistState();
      updateMonitoringSummary();
    } catch (_err) {
      alert("Could not import session file.");
    }
    event.target.value = "";
  });

  (async () => {
    bindPlannerAddButtonContainers();
    await loadStoreProfilesFromApi();
    initPlanner();
    await ensureLayoutDocumentModule();
    loadPersistedState();
    syncPlannerMetaFromCanvas();
    refreshCachedLayout();
    updatePlannerEstimate();
    updateMonitoringSummary();
    await seedBuiltinTemplates();
    ensurePlanner3D().then(() => {
      syncLayoutAcrossViews({ persist: false, resetSimulation: false });
    });
  })();
})();
