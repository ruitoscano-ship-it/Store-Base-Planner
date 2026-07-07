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
  const simReentryBtn = document.getElementById("simReentryBtn");
  const simIsoBtn = document.getElementById("simIsoBtn");
  const simFitBtn = document.getElementById("simFitBtn");
  const simZoomInBtn = document.getElementById("simZoomInBtn");
  const simZoomOutBtn = document.getElementById("simZoomOutBtn");
  const simPeopleInside = document.getElementById("simPeopleInside");
  const simPeopleLeaving = document.getElementById("simPeopleLeaving");
  const simAvgDwell = document.getElementById("simAvgDwell");
  const simProductGrabs = document.getElementById("simProductGrabs");
  const simAvgBasket = document.getElementById("simAvgBasket");
  const simFootnote = document.getElementById("simFootnote");
  const applyStoreSizeBtn = document.getElementById("applyStoreSizeBtn");
  const plannerAddButtons = Array.from(document.querySelectorAll(".planner-add-btn"));
  const plannerFixtureButtons = document.getElementById("plannerFixtureButtons");
  const plannerDividerButtons = document.getElementById("plannerDividerButtons");
  const plannerMonitorButtons = document.getElementById("plannerMonitorButtons");
  const plannerExportPngBtn = document.getElementById("plannerExportPngBtn");
  const plannerExportSvgBtn = document.getElementById("plannerExportSvgBtn");
  const plannerExportJsonBtn = document.getElementById("plannerExportJsonBtn");
  const plannerImportJsonBtn = document.getElementById("plannerImportJsonBtn");
  const plannerImportInput = document.getElementById("plannerImportInput");
  const plannerLoadBlueprintBtn = document.getElementById("plannerLoadBlueprintBtn");
  const plannerClearBlueprintBtn = document.getElementById("plannerClearBlueprintBtn");
  const plannerBlueprintInput = document.getElementById("plannerBlueprintInput");
  const plannerBlueprintInfo = document.getElementById("plannerBlueprintInfo");
  const plannerBlueprintBadge = document.getElementById("plannerBlueprintBadge");
  const plannerBlueprintArea = document.getElementById("plannerBlueprintArea");
  const plannerBlueprintDims = document.getElementById("plannerBlueprintDims");
  const plannerBlueprintNote = document.getElementById("plannerBlueprintNote");
  const plannerClearBtn = document.getElementById("plannerClearBtn");
  const plannerFullResetBtn = document.getElementById("plannerFullResetBtn");
  const plannerTemplateSelect = document.getElementById("plannerTemplateSelect");
  const plannerTemplateSummary = document.getElementById("plannerTemplateSummary");
  const plannerLoadTemplateBtn = document.getElementById("plannerLoadTemplateBtn");
  const plannerSaveTemplateBtn = document.getElementById("plannerSaveTemplateBtn");
  const plannerDeleteTemplateBtn = document.getElementById("plannerDeleteTemplateBtn");
  const plannerExportTemplateBtn = document.getElementById("plannerExportTemplateBtn");
  const plannerExport3dSnapshotBtn = document.getElementById("plannerExport3dSnapshotBtn");
  const plannerDeleteSelectedBtn = document.getElementById("plannerDeleteSelectedBtn");
  const plannerStatus = document.getElementById("plannerStatus");
  const senseiFormatSelect = document.getElementById("senseiFormat");
  const senseiProjectTypeSelect = document.getElementById("senseiProjectType");
  const senseiCountrySelect = document.getElementById("senseiCountry");
  const senseiUplinkSelect = document.getElementById("senseiUplink");
  const senseiPctRefInput = document.getElementById("senseiPctRef");
  const senseiScaleDiscountInput = document.getElementById("senseiScaleDiscount");
  const senseiUseRefurbishedInput = document.getElementById("senseiUseRefurbished");
  const senseiAddSpareInput = document.getElementById("senseiAddSpare");
  const senseiExternalTeamInput = document.getElementById("senseiExternalTeam");
  const countAmbientShelfLabel = document.getElementById("countAmbientShelf");
  const countColdShelfLabel = document.getElementById("countColdShelf");
  const countHotShelfLabel = document.getElementById("countHotShelf");
  const countTotalModulesLabel = document.getElementById("countTotalModules");
  const senseiDetectedFormatLabel = document.getElementById("senseiDetectedFormat");
  const senseiAreaLabel = document.getElementById("senseiAreaLabel");
  const senseiDoorCountLabel = document.getElementById("senseiDoorCount");
  const senseiCamTotalLabel = document.getElementById("senseiCamTotal");
  const senseiScaleTotalLabel = document.getElementById("senseiScaleTotal");
  const senseiServerTotalLabel = document.getElementById("senseiServerTotal");
  const plannerHardwareSubtotalLabel = document.getElementById("plannerHardwareSubtotal");
  const plannerInstallSubtotalLabel = document.getElementById("plannerInstallSubtotal");
  const plannerEstimatedCapexLabel = document.getElementById("plannerEstimatedCapex");
  const plannerEstimatedCostPerSqmLabel = document.getElementById("plannerEstimatedCostPerSqm");
  const senseiBomBreakdown = document.getElementById("senseiBomBreakdown");
  const saasTierChart = document.getElementById("saasTierChart");
  const saasTierRates = document.getElementById("saasTierRates");
  const saasTierResetBtn = document.getElementById("saasTierResetBtn");
  const saasActiveBandLabel = document.getElementById("saasActiveBand");
  const saasRatePerSqmLabel = document.getElementById("saasRatePerSqm");
  const saasProposedTotalLabel = document.getElementById("saasProposedTotal");
  const saasFormulaNote = document.getElementById("saasFormulaNote");
  const saasCalibrationFlag = document.getElementById("saasCalibrationFlag");
  const saasCalibrationDetail = document.getElementById("saasCalibrationDetail");
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
  let wallLinksModule = null;
  let cachedLayoutSnapshot = null;
  let cachedLayoutSignature = "";
  let lastSyncedLayoutSignature = "";
  let layoutApplying = false;

  async function ensureWallLinksModule() {
    if (wallLinksModule) return wallLinksModule;
    wallLinksModule = await import("./planner-wall-links.js");
    return wallLinksModule;
  }

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
      costModel: getPlannerSenseiOptions(),
      layout,
      canvasJson: plannerState.canvas
        ? plannerState.canvas.toDatalessJSON(layoutDocModule?.CANVAS_CUSTOM_PROPS || [
            "plannerKind",
            "plannerObjectId",
            "plannerMeters",
            "plannerPoseMeters",
            "plannerWallLinks"
          ])
        : null,
      preferences: {
        showMonitoringViz: showMonitoringVizPref,
        simOccupancy: simOccupancyPref,
        simPlaying: simPlaying,
        simReentry: simReentryPref
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
        artifacts: getMergedProfileArtifacts(storeProfileConfig),
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
    applyPlannerSenseiOptions(doc.costModel || doc.senseiOptions || defaultSenseiOptions);
    plannerState.widthMeters = doc.store.widthMeters;
    plannerState.heightMeters = doc.store.heightMeters;
    syncPlannerMeterScale();
    drawPlannerBoundary();

    if (doc.preferences) {
      showMonitoringVizPref = doc.preferences.showMonitoringViz !== false;
      simOccupancyPref = Number(doc.preferences.simOccupancy) || 24;
      simPlaying = doc.preferences.simPlaying !== false;
      simReentryPref = doc.preferences.simReentry === true;
      syncMonitoringGridButton();
      if (simOccupancySlider) simOccupancySlider.value = String(simOccupancyPref);
      if (simOccupancyVal) simOccupancyVal.textContent = String(simOccupancyPref);
      syncSimPlayButton();
      syncSimReentryButton();
      if (planner3dView) planner3dView.setShowMonitoringViz(showMonitoringVizPref);
    }

    highlightActivePresetButton();
    if (plannerState.activePresetId && STORE_PRESETS[plannerState.activePresetId]) {
      const preset = STORE_PRESETS[plannerState.activePresetId];
      plannerPresetSummary.textContent = `${preset.label}: ${doc.store.widthMeters}×${doc.store.heightMeters} m (${number.format(doc.store.widthMeters * doc.store.heightMeters)} m²)`;
    }

    const restoreFromCanvas = () => restorePlannerCanvasFromJson(doc.canvasJson, { refitViewport: true });

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

  function selectedTemplateEntry(store = null) {
    const mod = layoutDocModule;
    if (!mod || !plannerTemplateSelect?.value) return null;
    const templates = (store || mod.loadTemplatesStore()).templates || [];
    return templates.find((entry) => entry.id === plannerTemplateSelect.value) || null;
  }

  function updateTemplateSummary(selected = null) {
    if (!plannerTemplateSummary) return;
    if (!selected) {
      plannerTemplateSummary.textContent = "No saved templates yet.";
      return;
    }
    plannerTemplateSummary.textContent = `${selected.name} · ${selected.document?.store?.widthMeters || "?"}×${selected.document?.store?.heightMeters || "?"} m${
      selected.builtin ? " · built-in" : ""
    }`;
  }

  function updateTemplateActionState(selected = null) {
    const template = selected ?? selectedTemplateEntry();
    if (plannerDeleteTemplateBtn) {
      const canDelete = Boolean(template && !template.builtin);
      plannerDeleteTemplateBtn.disabled = !canDelete;
      plannerDeleteTemplateBtn.title = template?.builtin
        ? "Built-in templates cannot be deleted"
        : canDelete
          ? "Remove the selected saved template"
          : "Select a saved template to delete";
    }
  }

  function renderTemplateOptions() {
    if (!plannerTemplateSelect) return;
    const mod = layoutDocModule;
    if (!mod) return;
    const store = mod.loadTemplatesStore();
    const previousId = plannerTemplateSelect.value;
    plannerTemplateSelect.innerHTML = store.templates
      .map((template) => `<option value="${template.id}">${template.name}${template.builtin ? " (built-in)" : ""}</option>`)
      .join("");
    if (previousId && store.templates.some((entry) => entry.id === previousId)) {
      plannerTemplateSelect.value = previousId;
    }
    const selected = selectedTemplateEntry(store);
    updateTemplateSummary(selected);
    updateTemplateActionState(selected);
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
        costModel: { ...defaultSenseiOptions },
        layout,
        preferences: { showMonitoringViz: true, simOccupancy: 24, simPlaying: true, simReentry: false },
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

  async function deleteSelectedTemplate() {
    const mod = await ensureLayoutDocumentModule();
    const store = mod.loadTemplatesStore();
    const template = store.templates.find((entry) => entry.id === plannerTemplateSelect?.value);
    if (!template) {
      plannerStatus.textContent = "Select a template to delete.";
      plannerStatus.style.color = "var(--warn)";
      return;
    }
    if (template.builtin) {
      plannerStatus.textContent = "Built-in templates cannot be deleted.";
      plannerStatus.style.color = "var(--warn)";
      return;
    }
    const confirmed = window.confirm(`Delete template “${template.name}”? This cannot be undone.`);
    if (!confirmed) return;
    mod.deleteTemplate(store, template.id);
    renderTemplateOptions();
    plannerStatus.textContent = `Deleted template “${template.name}”.`;
    plannerStatus.style.color = "var(--ok)";
  }

  async function exportSelectedTemplate() {
    const mod = await ensureLayoutDocumentModule();
    const store = mod.loadTemplatesStore();
    const template = store.templates.find((entry) => entry.id === plannerTemplateSelect?.value);
    const layoutDocument = template?.document || buildCurrentLayoutDocument({ exportedManually: true });
    const name = template?.name || "store-layout-template";
    let previewImage = template?.previewImage || null;
    if (!previewImage) previewImage = await captureLayoutPreviewImage();
    const payload = {
      type: "store-layout-template",
      name,
      exportedAt: new Date().toISOString(),
      previewImage,
      document: layoutDocument
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
      artifacts: getMergedProfileArtifacts(storeProfileConfig),
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

  function getMergedProfileArtifacts(config) {
    const defaults = config?.artifactDefaults || {};
    const fromApi = config?.artifacts || {};
    return { ...defaults, ...fromApi };
  }

  function applyArtifactConfigFromProfiles(config) {
    if (!config?.artifacts) return;
    plannerSettings = {
      wallHeightMeters: Math.max(2.8, config.planner?.wallHeightMeters ?? 2.8),
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
        monitorMetrics: spec.monitorMetrics,
        signText: spec.signText,
        textColor: spec.textColor,
        panelColor: spec.panelColor
      };
    });
    renderPlannerAddButtons();
  }

  const DIVIDER_ARTIFACT_KINDS = ["separator-wall"];

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
    renderGroup(
      plannerFixtureButtons,
      storeArtifactKinds.filter((kind) => !DIVIDER_ARTIFACT_KINDS.includes(kind))
    );
    renderGroup(plannerDividerButtons, DIVIDER_ARTIFACT_KINDS);
    renderGroup(plannerMonitorButtons, monitorArtifactKinds);
  }

  function bindPlannerAddButtonContainers() {
    [plannerFixtureButtons, plannerDividerButtons, plannerMonitorButtons].forEach((container) => {
      if (!container || container.dataset.bound === "1") return;
      container.dataset.bound = "1";
      container.addEventListener("click", async (event) => {
        const button = event.target.closest(".planner-add-btn");
        if (!button?.dataset.kind) return;
        await ensureWallLinksModule();
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
  let simReentryPref = false;
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
    shopperSim.setReplenish(simReentryPref);
    return shopperSim;
  }

  function syncSimReentryButton() {
    if (!simReentryBtn) return;
    simReentryBtn.textContent = simReentryPref ? "Re-entry: On" : "Re-entry: Off";
    simReentryBtn.classList.toggle("active", simReentryPref);
  }

  function stopLiveSimulation({ clearShoppers = false } = {}) {
    if (simAnimId) {
      cancelAnimationFrame(simAnimId);
      simAnimId = null;
    }
    if (clearShoppers && planner3dView) planner3dView.clearShoppers();
  }

  function formatDwellTime(seconds) {
    if (!seconds || seconds <= 0) return "—";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  function renderLiveSimulationDashboard(sim) {
    const live = sim.getLiveMetrics();
    if (!live.simulationEnabled) {
      if (simPeopleInside) simPeopleInside.textContent = "0";
      if (simAvgDwell) simAvgDwell.textContent = "—";
      if (simProductGrabs) simProductGrabs.textContent = "0";
      if (simAvgBasket) simAvgBasket.textContent = "0";
      if (simPeopleLeaving) simPeopleLeaving.textContent = "0";
      if (simFootnote) {
        simFootnote.textContent = live.statusMessage || "Please add an entrance and checkout to run the simulation.";
      }
      return;
    }

    if (simPeopleInside) simPeopleInside.textContent = number.format(live.peopleInside);
    if (simAvgDwell) simAvgDwell.textContent = formatDwellTime(live.avgDwellSeconds);
    if (simProductGrabs) simProductGrabs.textContent = number.format(live.sessionProductGrabs);
    if (simAvgBasket) {
      simAvgBasket.textContent = live.avgBasketSize > 0 ? live.avgBasketSize.toFixed(1) : "0";
    }
    if (simPeopleLeaving) {
      const exited = live.sessionLeaves ?? 0;
      if (live.replenish) {
        simPeopleLeaving.textContent = number.format(exited);
      } else {
        const cohort = live.cohortSize || live.sessionEntries || 0;
        simPeopleLeaving.textContent = cohort > 0 ? `${exited} / ${cohort}` : String(exited);
      }
    }

    if (simFootnote) {
      if (live.finished) {
        simFootnote.textContent = `Simulation complete — all ${live.cohortSize || live.sessionLeaves} shoppers exited. Avg dwell ${formatDwellTime(live.avgDwellSeconds)}, avg basket ${live.avgBasketSize.toFixed(1)}.`;
      } else if (live.replenish) {
        simFootnote.textContent = "Continuous mode — new shoppers enter as others leave.";
      } else {
        simFootnote.textContent = `${live.cohortSize || live.peopleInside} shoppers started · grab products, checkout, then exit.`;
      }
    }
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
      const metrics = shopperSim.getLiveMetrics();
      if (metrics.simulationEnabled) {
        planner3dView.updateShoppers(shopperSim.getShopperPositions());
        planner3dView.updateHeatmap(shopperSim.getHeatmap());
      } else {
        planner3dView.clearShoppers();
      }

      if (now - lastDashboardUpdate > 350) {
        lastDashboardUpdate = now;
        renderLiveSimulationDashboard(shopperSim);
      }

      if (metrics.finished) {
        simPlaying = false;
        syncSimPlayButton();
        stopLiveSimulation();
        renderLiveSimulationDashboard(shopperSim);
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
    renderLiveSimulationDashboard(shopperSim);
    startLiveSimulationLoop();
  }

  function syncSimPlayButton() {
    if (!simPlayBtn) return;
    simPlayBtn.textContent = simPlaying ? "Pause" : "Play";
    simPlayBtn.classList.toggle("active", simPlaying);
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
    if (simOccupancyVal) simOccupancyVal.textContent = String(result.occupancy);
    if (planner3dView && plannerViewMode === "simulation") {
      planner3dView.updateHeatmap(result.heatmap);
    }
    return result;
  }

  function syncSimCameraButton() {
    if (!simIsoBtn || !planner3dView) return;
    const next = planner3dView.getCameraView() === "isometric" ? "isometric" : "perspective";
    simIsoBtn.classList.toggle("active", next === "isometric");
    simIsoBtn.textContent = next === "isometric" ? "Isometric" : "Perspective";
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
    if (isSim) syncSimCameraButton();
    if (planner3dHint) {
      if (isSim) {
        const blocked = shopperSim?.getStatusMessage?.();
        planner3dHint.textContent = blocked
          ? blocked
          : simPlaying
            ? "Live simulation · drag to orbit · scroll or Zoom ± · Isometric / Fit for all angles"
            : "Simulation paused · press Play or Restart · use camera controls to explore";
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
    // When an object is part of an active (multi) selection it is temporarily
    // re-parented to a group, so its left/top/angle are stored relative to that
    // group. Project through the group matrix to recover the true canvas pose.
    let center = obj.getCenterPoint();
    let angle = obj.angle || 0;
    if (obj.group) {
      center = fabric.util.transformPoint(center, obj.group.calcTransformMatrix());
      angle = (obj.group.angle || 0) + (obj.angle || 0);
    }
    return {
      x: (center.x - PLANNER_MARGIN) / plannerState.scale,
      z: (center.y - PLANNER_MARGIN) / plannerState.scale,
      angle: normalizePlannerAngle(angle)
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

  function meterPointFromCanvas(point) {
    return {
      x: (point.x - PLANNER_MARGIN) / plannerState.scale,
      z: (point.y - PLANNER_MARGIN) / plannerState.scale
    };
  }

  /** Endpoints in store meters using Fabric's transform (matches the 2D shape). */
  function wallEndpointsFromObject(obj, lengthMeters) {
    if (!window.fabric || !obj?.calcTransformMatrix) {
      const pose = obj.plannerPoseMeters || capturePlannerPoseMeters(obj);
      return wallLinksModule?.wallEndpoints(pose, lengthMeters) ?? { start: { x: pose.x, z: pose.z }, end: { x: pose.x, z: pose.z } };
    }
    const halfPx = (lengthMeters / 2) * plannerState.scale;
    const matrix = obj.calcTransformMatrix();
    const startPx = fabric.util.transformPoint(new fabric.Point(-halfPx, 0), matrix);
    const endPx = fabric.util.transformPoint(new fabric.Point(halfPx, 0), matrix);
    return {
      start: meterPointFromCanvas(startPx),
      end: meterPointFromCanvas(endPx)
    };
  }

  function wallEndpointsForPose(pose, lengthMeters) {
    if (!window.fabric?.util?.composeMatrix) {
      return wallLinksModule?.wallEndpoints(pose, lengthMeters) ?? { start: { x: pose.x, z: pose.z }, end: { x: pose.x, z: pose.z } };
    }
    const halfPx = (lengthMeters / 2) * plannerState.scale;
    const cx = PLANNER_MARGIN + pose.x * plannerState.scale;
    const cy = PLANNER_MARGIN + pose.z * plannerState.scale;
    const matrix = fabric.util.composeMatrix({
      angle: pose.angle || 0,
      translateX: cx,
      translateY: cy
    });
    const startPx = fabric.util.transformPoint(new fabric.Point(-halfPx, 0), matrix);
    const endPx = fabric.util.transformPoint(new fabric.Point(halfPx, 0), matrix);
    return {
      start: meterPointFromCanvas(startPx),
      end: meterPointFromCanvas(endPx)
    };
  }

  function listWallObjectsOnCanvas() {
    if (!plannerState.canvas || !wallLinksModule) return [];
    const { isWallKind, wallLengthMeters } = wallLinksModule;
    return plannerState.canvas
      .getObjects()
      .filter((obj) => isPlannerFixture(obj) && isWallKind(obj.plannerKind))
      .map((obj) => {
        const spec = getArtifactSpec(obj.plannerKind);
        const pose = capturePlannerPoseMeters(obj);
        const lengthMeters = wallLengthMeters(obj, spec);
        return {
          id: ensurePlannerObjectId(obj),
          obj,
          pose,
          lengthMeters,
          endpoints: wallEndpointsFromObject(obj, lengthMeters)
        };
      });
  }

  function refreshAllWallLinks() {
    if (!plannerState.canvas || !wallLinksModule) return;
    const { computeWallLinksFromEndpoints } = wallLinksModule;
    const walls = listWallObjectsOnCanvas();
    walls.forEach((wall) => {
      wall.obj.plannerWallLinks = computeWallLinksFromEndpoints(wall.endpoints, wall.id, walls);
    });
  }

  function applyWallInteraction(target, { snapAngle = true, snapPosition = true } = {}) {
    if (!wallLinksModule || !target || !plannerState.canvas) return false;

    const { isWallKind, findWallSnap, snapWallAngle } = wallLinksModule;
    const endpointForPose = (pose, lengthMeters) => wallEndpointsForPose(pose, lengthMeters);
    let snappedAny = false;

    const processWall = (obj) => {
      if (!isWallKind(obj.plannerKind)) return false;
      const spec = getArtifactSpec(obj.plannerKind);
      const lengthMeters = wallLinksModule.wallLengthMeters(obj, spec);
      let pose = capturePlannerPoseMeters(obj);
      const walls = listWallObjectsOnCanvas();
      const others = walls.filter((wall) => wall.obj !== obj);
      let changed = false;

      if (snapAngle && others.length) {
        const angled = snapWallAngle(pose, others);
        if (angled.angle !== pose.angle) {
          pose = angled;
          changed = true;
        }
      }

      if (changed) {
        writeMeterPoseToFabric(obj, pose);
        obj.setCoords();
      }

      if (snapPosition && others.length) {
        const movingEndpoints = wallEndpointsFromObject(obj, lengthMeters);
        const snap = findWallSnap(pose, lengthMeters, ensurePlannerObjectId(obj), others, {
          movingEndpoints,
          endpointForPose
        });
        if (snap) {
          writeMeterPoseToFabric(obj, snap.pose);
          obj.setCoords();
          changed = true;
        }
      }

      return changed;
    };

    if (isActiveSelectionTarget(target)) {
      snappedAny = target.getObjects().some((child) => processWall(child));
    } else if (isPlannerFixture(target)) {
      snappedAny = processWall(target);
    }

    if (snappedAny) {
      plannerState.canvas.requestRenderAll();
    }
    return snappedAny;
  }

  function selectionContainsWall(target) {
    if (!wallLinksModule || !target) return false;
    const { isWallKind } = wallLinksModule;
    if (isActiveSelectionTarget(target)) {
      return target.getObjects().some((obj) => isWallKind(obj.plannerKind));
    }
    return isWallKind(target.plannerKind);
  }

  function isActiveSelectionTarget(target) {
    return (
      target?.type === "activeSelection" ||
      (target && Array.isArray(target._objects) && !target.plannerKind)
    );
  }

  /**
   * Capture meter poses for whatever a Fabric event touched — a single fixture or
   * a multi-fixture active selection — so the 2D arrangement (position + rotation)
   * reliably propagates to the 3D scene and the persisted layout.
   */
  function capturePlannerPosesFromTarget(target) {
    if (!target) return;
    if (isActiveSelectionTarget(target)) {
      target.getObjects().forEach((child) => {
        if (isPlannerFixture(child)) capturePlannerPoseMeters(child);
      });
      return;
    }
    if (isPlannerFixture(target)) capturePlannerPoseMeters(target);
  }

  /** Inner store rectangle in canvas (px) coordinates. */
  function storePixelBounds() {
    return {
      minX: PLANNER_MARGIN,
      minY: PLANNER_MARGIN,
      maxX: PLANNER_MARGIN + metersToPx(plannerState.widthMeters),
      maxY: PLANNER_MARGIN + metersToPx(plannerState.heightMeters)
    };
  }

  /**
   * Keep a dragged/rotated fixture (or active selection) fully inside the store
   * footprint. Returns true if the object had to be nudged back in.
   */
  function clampObjectWithinStore(obj) {
    if (!obj) return false;
    const bounds = storePixelBounds();
    const rect = obj.getBoundingRect(true, true);
    let dx = 0;
    let dy = 0;
    const overflowX = rect.width - (bounds.maxX - bounds.minX);
    const overflowY = rect.height - (bounds.maxY - bounds.minY);
    // If the fixture is larger than the store on an axis, just pin its top/left edge.
    if (overflowX >= 0) dx = bounds.minX - rect.left;
    else if (rect.left < bounds.minX) dx = bounds.minX - rect.left;
    else if (rect.left + rect.width > bounds.maxX) dx = bounds.maxX - (rect.left + rect.width);
    if (overflowY >= 0) dy = bounds.minY - rect.top;
    else if (rect.top < bounds.minY) dy = bounds.minY - rect.top;
    else if (rect.top + rect.height > bounds.maxY) dy = bounds.maxY - (rect.top + rect.height);
    if (dx === 0 && dy === 0) return false;
    obj.left += dx;
    obj.top += dy;
    obj.setCoords();
    return true;
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
    try {
      const { createPlanner3D } = await import("./planner-3d.js");
      planner3dView = createPlanner3D(planner3dContainer, {
      artifacts: getMergedProfileArtifacts(storeProfileConfig),
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
    } catch (error) {
      console.error("Failed to initialize 3D planner view.", error);
      plannerStatus.textContent = "3D view failed to load. Hard refresh and try again.";
      plannerStatus.style.color = "var(--bad)";
      return null;
    }
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
    if (!view) return;
    view.setActive(true);
    resizePlanner3DView();

    if (mode === "simulation") {
      view.setSimulationMode(true);
      if (simOccupancySlider) simOccupancySlider.value = String(simOccupancyPref);
      simPlaying = true;
      syncSimPlayButton();
      syncSimReentryButton();
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

  function getDefaultSenseiOptionsFromConfig() {
    const defaults = storeProfileConfig?.senseiDefaults || legacyDefaultSenseiOptions;
    return {
      format: defaults.format ?? "auto",
      projectType: defaults.projectType ?? "full",
      country: defaults.country ?? "PT",
      uplink: defaults.uplink ?? "Wired + 5G",
      useRefurbished: Boolean(defaults.useRefurbished),
      addSpare: Boolean(defaults.addSpare),
      scaleDiscount: Number(defaults.scaleDiscount) || 0,
      hasExternalTeam: Boolean(defaults.hasExternalTeam),
      pctRef: defaults.pctRef != null ? Number(defaults.pctRef) : null
    };
  }

  async function loadSenseiAssumptions() {
    try {
      const response = await fetch("/api/sensei-assumptions");
      if (response.ok) {
        const data = await response.json();
        senseiAssumptions = data.assumptions;
        return senseiAssumptions;
      }
    } catch (_error) {
      // Fall back to static JSON when API is unavailable.
    }
    try {
      const response = await fetch("/data/sensei-setup-assumptions.json");
      if (!response.ok) throw new Error("assumptions fetch failed");
      let assumptions = await response.json();
      if (globalThis.PlannerSenseiCost && storeProfileConfig?.senseiPricingOverrides) {
        assumptions = globalThis.PlannerSenseiCost.mergeAssumptionsWithOverrides(
          assumptions,
          storeProfileConfig.senseiPricingOverrides
        );
      }
      senseiAssumptions = assumptions;
      return senseiAssumptions;
    } catch (_error) {
      senseiAssumptions = null;
      return null;
    }
  }

  function formatSenseiBom(bom) {
    if (!bom) return "";
    return Object.entries(bom)
      .map(([group, items]) => {
        const lines = (items || []).map((item) => `  ${item.qty}× ${item.label} @ ${currency.format(item.price)} = ${currency.format(item.total)}`);
        return `${group.toUpperCase()}\n${lines.join("\n") || "  —"}`;
      })
      .join("\n\n");
  }

  let senseiAssumptions = null;
  let senseiAssumptionsLoading = false;

  const legacyDefaultSenseiOptions = {
    format: "auto",
    projectType: "full",
    country: "PT",
    uplink: "Wired + 5G",
    useRefurbished: false,
    addSpare: false,
    scaleDiscount: 0,
    hasExternalTeam: false,
    pctRef: null
  };

  let defaultSenseiOptions = { ...legacyDefaultSenseiOptions };

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
          artifacts: getMergedProfileArtifacts(storeProfileConfig),
          planner: storeProfileConfig.planner
        });
      }
      STORE_PRESETS = buildStorePresetsFromConfig(storeProfileConfig);
      defaultSenseiOptions = getDefaultSenseiOptionsFromConfig();
      applyPlannerSenseiOptions(defaultSenseiOptions);
      await loadSenseiAssumptions();
      updatePlannerEstimate();
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
      areaDivisors: { ambient: 13, cold: 32, hot: 45, produce: 70 },
      mins: { ambient: 12, cold: 4, hot: 2, produce: 0 },
      maxs: { ambient: 80, cold: 28, hot: 16, produce: 14 }
    };
    const produceDivisor = b.areaDivisors.produce ?? 70;
    const produceMin = b.mins.produce ?? 0;
    const produceMax = b.maxs.produce ?? 14;
    return {
      ambient: clamp(Math.round(area / b.areaDivisors.ambient), b.mins.ambient, b.maxs.ambient),
      cold: clamp(Math.round(area / b.areaDivisors.cold), b.mins.cold, b.maxs.cold),
      hot: clamp(Math.round(area / b.areaDivisors.hot), b.mins.hot, b.maxs.hot),
      produce: clamp(Math.round(area / produceDivisor), produceMin, produceMax)
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
    document.querySelectorAll(".planner-pod-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.pod === plannerState.activePresetId);
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

    applyPlannerSenseiOptions(defaultSenseiOptions);

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

  // Prefab pod constructs: compact grab-and-go formats with a back-wall run of
  // 3 shelves + self-service coffee + self-service juice, an entrance gate, and
  // a checkout at the front. Front of each fixture faces the aisle (+Y).
  function makePodFixtures() {
    const backEdge = 0.55;
    const frontY = 3.86;
    const shelfY = backEdge + 0.45 / 2;
    const stationY = backEdge + 0.6 / 2;
    return [
      { kind: "shelf-ambient", x: 1.15, y: shelfY, angle: 0 },
      { kind: "shelf-ambient", x: 2.53, y: shelfY, angle: 0 },
      { kind: "shelf-cold", x: 3.91, y: shelfY, angle: 0 },
      { kind: "station-coffee", x: 5.19, y: stationY, angle: 0 },
      { kind: "station-juice", x: 6.37, y: stationY, angle: 0 },
      { kind: "entry-gated", x: 1.7, y: frontY, angle: 0 },
      { kind: "checkout", x: 6.2, y: frontY, angle: 0 }
    ];
  }

  // "Cinema Bar" prefab: a larger walk-through format — a self-checkout bank and
  // cooler across the back, a central double-sided island gondola, an L-shaped
  // wall gondola run on the right/bottom, and entry gates wrapping the left and
  // bottom-left perimeter. Wall fixtures face the interior.
  function cinemaBarFixtures() {
    const M = 0.55;
    const fixtures = [];
    // Cooler + 3 self-checkouts along the back wall (face +Y interior).
    fixtures.push({ kind: "shelf-cold", x: 1.15, y: M + 0.55 / 2, angle: 0 });
    [3.0, 5.0, 7.0].forEach((x) => fixtures.push({ kind: "checkout", x, y: M + 0.18 / 2, angle: 0 }));
    // Central double-sided island gondola.
    fixtures.push({ kind: "shelf-island", x: 4.5, y: 4.2, angle: 0 });
    // Right wall gondola run (faces -X interior).
    [2.4, 3.75, 5.1, 6.45].forEach((y) =>
      fixtures.push({ kind: "shelf-ambient", x: 10.225, y, angle: 90 })
    );
    // Bottom-right run completing the L (faces -Y interior).
    [7.0, 8.35].forEach((x) => fixtures.push({ kind: "shelf-ambient", x, y: 7.725, angle: 180 }));
    // Entry / exit gates wrapping the left and bottom-left perimeter.
    [4.2, 6.2].forEach((y) => fixtures.push({ kind: "entry-gated", x: 0.64, y, angle: 270 }));
    [2.2, 4.0].forEach((x) => fixtures.push({ kind: "entry-gated", x, y: 7.86, angle: 180 }));
    return fixtures;
  }

  // "Base supermarket" prefab: a full small-format supermarket — a back-wall
  // gondola run + corner cooler, four central double-sided island aisles, a
  // coffee station + entry gates on the right wall, a freezer island and
  // checkout bank on the left, produce bins along the bottom, and bottom-wall
  // entry gates. Wall fixtures face the interior.
  function baseSupermarketFixtures() {
    const fixtures = [];
    // Back wall: corner cooler + dry gondola run (face +Y interior).
    fixtures.push({ kind: "shelf-cold", x: 12.2, y: 0.825, angle: 0 });
    [5.5, 7.0, 8.5, 10.0].forEach((x) => fixtures.push({ kind: "shelf-ambient", x, y: 0.775, angle: 0 }));
    // Four central double-sided island aisles (run along Y, two units each).
    [6.0, 7.9, 9.8, 11.7].forEach((x) => {
      [3.2, 5.6].forEach((y) => fixtures.push({ kind: "shelf-island", x, y, angle: 90 }));
    });
    // Right wall: self-service coffee + entry gates (face -X interior).
    fixtures.push({ kind: "station-coffee", x: 13.15, y: 2.0, angle: 90 });
    [4.8, 6.4].forEach((y) => fixtures.push({ kind: "entry-gated", x: 13.15, y, angle: 90 }));
    // Left: freezer island + checkout bank.
    [2.3, 3.5].forEach((x) => fixtures.push({ kind: "shelf-cold", x, y: 2.6, angle: 0 }));
    [3.0, 4.8].forEach((x) => fixtures.push({ kind: "checkout", x, y: 7.2, angle: 0 }));
    // Bottom: produce bins + entry gates (face -Y interior).
    [2.2, 3.6, 5.0].forEach((x) => fixtures.push({ kind: "produce-bin", x, y: 9.95, angle: 180 }));
    [7.5, 9.3].forEach((x) => fixtures.push({ kind: "entry-gated", x, y: 10.36, angle: 180 }));
    return fixtures;
  }

  // "Base Food Serving" prefab: a café / food-serving venue — an L-shaped
  // serving line (deli + bakery + self-service coffee/juice) across the back and
  // right, a back-wall retail gondola run, two central islands, a checkout at
  // the counter and a small front counter, with entry gates wrapping the left,
  // bottom, and right. The left-centre is left open as a seating zone (no table
  // fixture exists). Wall fixtures face the interior.
  function baseFoodServingFixtures() {
    const fixtures = [];
    // Back wall: retail gondola run + deli/bakery serving line (face +Y).
    [1.8, 3.3, 4.8].forEach((x) => fixtures.push({ kind: "shelf-ambient", x, y: 0.775, angle: 0 }));
    fixtures.push({ kind: "service-deli", x: 6.9, y: 1.1, angle: 0 });
    fixtures.push({ kind: "service-bakery", x: 9.3, y: 1.05, angle: 0 });
    fixtures.push({ kind: "station-coffee", x: 11.2, y: 0.85, angle: 0 });
    // Right wall: retail gondola run + juice station (face -X interior).
    [2.6, 3.95, 5.3].forEach((y) => fixtures.push({ kind: "shelf-ambient", x: 12.225, y, angle: 90 }));
    fixtures.push({ kind: "station-juice", x: 12.1, y: 6.9, angle: 90 });
    // Two central island gondolas.
    [4.0, 5.6].forEach((y) => fixtures.push({ kind: "shelf-island", x: 6.5, y, angle: 0 }));
    // Counter checkout + a small front counter near the seating zone.
    fixtures.push({ kind: "checkout", x: 9.5, y: 3.0, angle: 0 });
    fixtures.push({ kind: "checkout", x: 2.5, y: 9.3, angle: 180 });
    // Entry gates wrapping the left, bottom, and right perimeter.
    [4.2, 5.7, 7.2].forEach((y) => fixtures.push({ kind: "entry-gated", x: 0.64, y, angle: 270 }));
    [5.5, 7.0, 8.5].forEach((x) => fixtures.push({ kind: "entry-gated", x, y: 10.36, angle: 180 }));
    [8.0, 9.2].forEach((y) => fixtures.push({ kind: "entry-gated", x: 12.36, y, angle: 90 }));
    return fixtures;
  }

  // "12K supermarket" prefab: a 1,200 m² (40 × 30 m) full-line supermarket.
  // Perimeter fresh departments (assisted deli/fish/bakery + chilled wall on the
  // back, ambient gondolas down both side walls), a central grid of double-sided
  // gondola island aisles, a produce hall + self-service coffee/juice near the
  // front, a 7-lane checkout bank, and entry/exit gates along the front wall.
  // All wall fixtures face the interior; islands run front-to-back.
  function twelveKSupermarketFixtures() {
    const round = (n) => Number(n.toFixed(2));
    const fixtures = [];

    // Back wall: assisted-service counters + chilled wall (face +Y interior).
    fixtures.push({ kind: "service-deli", x: 3.3, y: 1.25, angle: 0 });
    fixtures.push({ kind: "service-fish", x: 6.3, y: 1.25, angle: 0 });
    fixtures.push({ kind: "service-bakery", x: 8.9, y: 1.2, angle: 0 });
    for (let x = 11.8; x <= 38.4; x += 1.5) {
      fixtures.push({ kind: "shelf-cold", x: round(x), y: 1.05, angle: 0 });
    }

    // Side walls: ambient gondola runs (left faces +X, right faces -X).
    for (let y = 4.0; y <= 25.5; y += 1.4) {
      fixtures.push({ kind: "shelf-ambient", x: 1.0, y: round(y), angle: 270 });
      fixtures.push({ kind: "shelf-ambient", x: 39.0, y: round(y), angle: 90 });
    }

    // Centre: double-sided gondola island aisles, running front-to-back.
    [9.5, 13, 16.5, 20, 23.5, 27, 30.5].forEach((x) => {
      for (let y = 5.5; y <= 18.5; y += 2.5) {
        fixtures.push({ kind: "shelf-island", x, y: round(y), angle: 90 });
      }
    });

    // Produce hall near the front, two rows facing the aisle.
    for (let r = 0; r < 2; r += 1) {
      for (let x = 9.5; x <= 15.5; x += 1.5) {
        fixtures.push({ kind: "produce-bin", x: round(x), y: round(21.5 + r * 1.6), angle: 0 });
      }
    }
    // Self-service coffee + juice beside the produce hall.
    fixtures.push({ kind: "station-coffee", x: 18.0, y: 21.8, angle: 0 });
    fixtures.push({ kind: "station-juice", x: 19.2, y: 21.8, angle: 0 });

    // Front checkout bank (7 lanes) facing the exit.
    for (let i = 0; i < 7; i += 1) {
      fixtures.push({ kind: "checkout", x: round(14 + i * 3.2), y: 26.8, angle: 180 });
    }

    // Entry / exit gates along the front wall.
    [3.0, 5.0, 35.0, 37.0].forEach((x) => fixtures.push({ kind: "entry-gated", x, y: 28.9, angle: 180 }));

    return fixtures;
  }

  // "Pharmacy" prefab: ~155 m² (15.5 × 10 m) community pharmacy — tall OTC /
  // health runs on the left wall, flanking back-wall gondolas with a central
  // cold-chain case, prescription storage on the right, an L-shaped dispensing
  // counter + checkout in the back-right, two central double-sided wellness
  // aisles, a front-right waiting / queue zone (left open), front impulse cold
  // + self-checkout, and entry gates on the front.
  function pharmacyFixtures() {
    const round = (n) => Number(n.toFixed(2));
    const M = 0.55;
    const W = 15.5;
    const D = 10;
    const fixtures = [];

    // Left wall: tall OTC / health product run (faces +X interior).
    [1.8, 3.0, 4.2, 5.4, 6.6, 7.8, 9.0].forEach((y) =>
      fixtures.push({ kind: "shelf-ambient", x: round(M + 0.45 / 2), y: round(y), angle: 270 })
    );

    // Back wall: flanking gondola runs with a central cold-chain gap (faces +Y).
    [2.0, 3.2, 4.4, 5.6].forEach((x) =>
      fixtures.push({ kind: "shelf-ambient", x: round(x), y: round(M + 0.45 / 2), angle: 0 })
    );
    fixtures.push({ kind: "shelf-cold", x: round(7.4), y: round(M + 0.55 / 2), angle: 0 });
    [9.0, 10.2, 11.4, 12.6].forEach((x) =>
      fixtures.push({ kind: "shelf-ambient", x: round(x), y: round(M + 0.45 / 2), angle: 0 })
    );
    // Back-wall "PHARMACY" sign — flush to rear wall so 3D mounts it above the gondolas.
    fixtures.push({ kind: "sign-pharmacy", x: round(W / 2), y: round(0.08), angle: 0 });

    // Right wall: prescription storage behind the service desk (faces -X).
    [1.5, 2.7, 3.9, 5.1, 6.3].forEach((y) =>
      fixtures.push({ kind: "shelf-ambient", x: round(W - M - 0.45 / 2), y: round(y), angle: 90 })
    );
    fixtures.push({ kind: "shelf-cold", x: round(W - M - 0.55 / 2), y: round(7.5), angle: 90 });

    // Back-right L-shaped dispensing counter + pharmacist checkout.
    fixtures.push({ kind: "service-deli", x: round(12.6), y: round(M + 1.1 / 2), angle: 0 });
    fixtures.push({ kind: "service-bakery", x: round(W - M - 1.0 / 2), y: round(2.2), angle: 90 });
    fixtures.push({ kind: "checkout", x: round(11.8), y: round(2.5), angle: 0 });

    // Two central double-sided wellness / cosmetics aisles.
    [5.4, 8.8].forEach((x) => {
      [3.0, 5.2, 7.4].forEach((y) =>
        fixtures.push({ kind: "shelf-island", x: round(x), y: round(y), angle: 90 })
      );
    });

    // Front-right waiting / queue zone (open floor — traffic monitoring only).
    fixtures.push({ kind: "monitor-people-zone", x: round(12.0), y: round(7.8), angle: 0 });

    // Front: impulse cold case + self-checkout near the exit.
    fixtures.push({ kind: "shelf-cold", x: round(10.8), y: round(D - M - 0.55 / 2), angle: 180 });
    fixtures.push({ kind: "checkout", x: round(13.0), y: round(D - M - 0.18 / 2), angle: 180 });

    // Entry / exit gates along the front and a side fire exit.
    [3.0, 5.5, 8.0].forEach((x) =>
      fixtures.push({ kind: "entry-gated", x: round(x), y: round(D - M - 0.18 / 2), angle: 180 })
    );
    fixtures.push({ kind: "entry-gated", x: round(M + 0.18 / 2), y: round(5.5), angle: 270 });

    return fixtures;
  }

  const POD_CONSTRUCTS = {
    "base-pod": {
      label: "Base pod",
      widthMeters: 8,
      heightMeters: 4.5,
      fixtures: makePodFixtures,
      summary: "3 shelves, self-service coffee + juice, 1 checkout, 1 entrance gate."
    },
    "pod-2": {
      label: "Pod 2",
      widthMeters: 8,
      heightMeters: 4.5,
      fixtures: makePodFixtures,
      summary: "3 shelves, self-service coffee + juice, 1 checkout, 1 entrance gate."
    },
    "cinema-bar": {
      label: "Cinema Bar",
      widthMeters: 11,
      heightMeters: 8.5,
      fixtures: cinemaBarFixtures,
      summary: "3 self-checkouts + cooler, central island, L-shaped wall run, 4 entry gates."
    },
    "base-supermarket": {
      label: "Base supermarket",
      widthMeters: 14,
      heightMeters: 11,
      fixtures: baseSupermarketFixtures,
      summary: "4 central aisles, back-wall run, coolers + freezer island, coffee, produce bins, 2 checkouts, 4 entry gates."
    },
    "base-food-serving": {
      label: "Base Food Serving",
      widthMeters: 13,
      heightMeters: 11,
      fixtures: baseFoodServingFixtures,
      summary: "Deli + bakery + coffee/juice serving line, retail gondolas, 2 islands, 2 checkouts, open seating zone, 8 entry gates."
    },
    "12k-supermarket": {
      label: "12K supermarket",
      widthMeters: 40,
      heightMeters: 30,
      fixtures: twelveKSupermarketFixtures,
      summary: "1,200 m² full-line: deli + fish + bakery, chilled wall, ambient side runs, central island grid, produce hall, coffee/juice, 7 checkouts, 4 entry gates."
    },
    pharmacy: {
      label: "Pharmacy",
      widthMeters: 15.5,
      heightMeters: 10,
      fixtures: pharmacyFixtures,
      summary: "155 m² pharmacy: back-wall PHARMACY sign, left-wall OTC run, back-wall gondolas + cold chain, 2 central wellness aisles, L-shaped dispensing counter, waiting zone, 2 checkouts, 4 entry gates."
    }
  };

  function applyPodConstruct(podId) {
    const pod = POD_CONSTRUCTS[podId];
    if (!pod) return;
    if (!initPlanner()) return;
    const { widthMeters, heightMeters } = pod;

    clearPlannerBlueprint();
    clearPlannerObjects();

    plannerWidthInput.value = String(widthMeters);
    plannerHeightInput.value = String(heightMeters);
    applyStoreDimensions();

    applyPlannerSenseiOptions(defaultSenseiOptions);

    plannerBatchAdding = true;
    pod.fixtures().forEach((fixture) => {
      const point = canvasPointFromMeters(fixture.x, fixture.y);
      addPlannerObject(fixture.kind, {
        left: point.left,
        top: point.top,
        angle: fixture.angle || 0,
        silent: true
      });
    });
    plannerBatchAdding = false;

    plannerState.activePresetId = podId;
    highlightActivePresetButton();

    const area = widthMeters * heightMeters;
    plannerPresetSummary.textContent = `${pod.label}: ${widthMeters}×${heightMeters} m (${number.format(area)} m²) · ${pod.summary}`;
    plannerStatus.textContent = `${pod.label} construct loaded — ${pod.summary} Rearrange or duplicate fixtures as needed.`;
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

  function buildTurnstileShapes(width, height, strokeW) {
    const postW = Math.max(5, width * 0.11);
    const panelW = Math.max(4, width * 0.07);
    return [
      new fabric.Rect({
        width,
        height: Math.max(4, height * 0.35),
        fill: "#f2f2f0",
        stroke: "#111111",
        strokeWidth: strokeW,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: postW,
        height: height * 1.6,
        fill: "#404040",
        stroke: "#111111",
        strokeWidth: Math.max(0.6, strokeW * 0.65),
        left: -width / 2 + postW / 2 + 1,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: postW,
        height: height * 1.6,
        fill: "#404040",
        stroke: "#111111",
        strokeWidth: Math.max(0.6, strokeW * 0.65),
        left: width / 2 - postW / 2 - 1,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: panelW,
        height: height * 1.35,
        fill: "#e8e8e6",
        stroke: "#111111",
        strokeWidth: Math.max(0.5, strokeW * 0.55),
        left: -width / 2 + postW + panelW / 2,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: panelW,
        height: height * 1.35,
        fill: "#e8e8e6",
        stroke: "#111111",
        strokeWidth: Math.max(0.5, strokeW * 0.55),
        left: width / 2 - postW - panelW / 2,
        originX: "center",
        originY: "center"
      }),
      new fabric.Line([-width * 0.18, 0, width * 0.02, 0], {
        stroke: "#111111",
        strokeWidth: Math.max(0.8, strokeW * 0.75),
        originX: "center",
        originY: "center"
      })
    ];
  }

  function buildSlidingDoorShapes(width, height, strokeW) {
    const leafW = width * 0.42;
    return [
      new fabric.Rect({
        width,
        height: Math.max(4, height * 0.3),
        fill: "#f2f2f0",
        stroke: "#111111",
        strokeWidth: strokeW,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: leafW,
        height: height * 1.45,
        fill: "#f8fafc",
        stroke: "#111111",
        strokeWidth: Math.max(0.6, strokeW * 0.65),
        left: -width * 0.22,
        originX: "center",
        originY: "center",
        opacity: 0.92
      }),
      new fabric.Rect({
        width: leafW,
        height: height * 1.45,
        fill: "#f8fafc",
        stroke: "#111111",
        strokeWidth: Math.max(0.6, strokeW * 0.65),
        left: width * 0.22,
        originX: "center",
        originY: "center",
        opacity: 0.92
      }),
      new fabric.Line([0, -height * 0.72, 0, height * 0.72], {
        stroke: "#6b7280",
        strokeWidth: Math.max(0.5, strokeW * 0.5),
        strokeDashArray: [3, 3],
        originX: "center",
        originY: "center"
      })
    ];
  }

  function buildSelfCheckoutShapes(width, height, strokeW) {
    const baseW = width * 0.62;
    const baseH = height * 0.55;
    return [
      new fabric.Rect({
        width: baseW,
        height: baseH,
        fill: "#404040",
        stroke: "#111111",
        strokeWidth: strokeW,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: width * 0.28,
        height: height * 1.35,
        fill: "#1f2937",
        stroke: "#111111",
        strokeWidth: Math.max(0.6, strokeW * 0.65),
        left: 0,
        top: -height * 0.35,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: Math.max(6, width * 0.1),
        height: Math.max(5, height * 0.22),
        fill: "#f2f2f0",
        stroke: "#111111",
        strokeWidth: Math.max(0.5, strokeW * 0.5),
        left: width * 0.2,
        top: -height * 0.05,
        originX: "center",
        originY: "center"
      }),
      new fabric.Rect({
        width: Math.max(5, width * 0.07),
        height: Math.max(4, height * 0.16),
        fill: "#e8e8e6",
        stroke: "#111111",
        strokeWidth: Math.max(0.5, strokeW * 0.5),
        left: -width * 0.22,
        top: height * 0.05,
        originX: "center",
        originY: "center"
      }),
      new fabric.Text("SCO", {
        fontSize: Math.max(7, plannerFontSize(0.45)),
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: "700",
        fill: "#f2f2f0",
        left: 0,
        top: height * 0.08,
        originX: "center",
        originY: "center"
      })
    ];
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
      const backInset = height * 0.08;
      const shelfLevels = Math.max(3, Math.min(5, spec.shelfLevels || 4));

      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill: "#f8f8f6",
          stroke: "#111111",
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: width * 0.96,
          height: Math.max(6, backInset),
          fill: "#e4e4e2",
          stroke: "#111111",
          strokeWidth: Math.max(0.7, strokeW * 0.65),
          left: 0,
          top: -height / 2 + backInset / 2 + 1,
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: Math.max(4, width * 0.035),
          height: height * 0.88,
          fill: "#b4b8be",
          stroke: "#111111",
          strokeWidth: Math.max(0.5, strokeW * 0.45),
          left: -width / 2 + width * 0.04,
          top: 0,
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: Math.max(4, width * 0.035),
          height: height * 0.88,
          fill: "#b4b8be",
          stroke: "#111111",
          strokeWidth: Math.max(0.5, strokeW * 0.45),
          left: width / 2 - width * 0.04,
          top: 0,
          originX: "center",
          originY: "center"
        }),
        new fabric.Rect({
          width: width * 0.92,
          height: Math.max(8, height * 0.22),
          fill: bandColor,
          stroke: "#111111",
          strokeWidth: Math.max(0.8, strokeW * 0.5),
          left: 0,
          top: -height / 2 + Math.max(8, height * 0.22) / 2 + backInset + 2,
          originX: "center",
          originY: "center"
        }),
        new fabric.Text(tag, {
          fontSize: Math.max(8, plannerFontSize(0.55)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "700",
          fill: kind === "shelf-ambient" || kind === "shelf-island" ? "#111111" : "#ffffff",
          left: 0,
          top: -height / 2 + Math.max(8, height * 0.22) / 2 + backInset + 2,
          originX: "center",
          originY: "center"
        })
      );

      for (let i = 1; i <= shelfLevels; i += 1) {
        const y = -height / 2 + backInset + (height - backInset) * (i / (shelfLevels + 1));
        const shelfW = i === 1 ? width * 0.9 : width * 0.84;
        shapes.push(
          new fabric.Line([-shelfW / 2, y, shelfW / 2, y], {
            stroke: "#111111",
            strokeWidth: Math.max(0.7, strokeW * 0.75),
            originX: "center",
            originY: "center"
          })
        );
        const dots = 4;
        const spacing = shelfW / (dots + 1);
        for (let d = 1; d <= dots; d += 1) {
          const dotX = -shelfW / 2 + spacing * d;
          shapes.push(
            new fabric.Rect({
              width: Math.max(3, spacing * 0.35),
              height: Math.max(3, spacing * 0.28),
              fill: d % 2 === 0 ? fill : stroke,
              stroke: "#111111",
              strokeWidth: 0.5,
              left: dotX,
              top: y - Math.max(3, spacing * 0.2),
              originX: "center",
              originY: "center"
            })
          );
        }
      }

      if (type === "gondola-island") {
        shapes.push(
          new fabric.Rect({
            width: Math.max(4, width * 0.04),
            height: height * 0.82,
            fill: "#e4e4e2",
            stroke: "#111111",
            strokeWidth: Math.max(0.6, strokeW * 0.55),
            left: 0,
            top: height * 0.04,
            originX: "center",
            originY: "center"
          }),
          new fabric.Line([0, -height / 2 + backInset + 6, 0, height / 2 - 6], {
            stroke: "#6b7280",
            strokeWidth: Math.max(0.6, strokeW * 0.55),
            strokeDashArray: [4, 3],
            originX: "center",
            originY: "center"
          })
        );
      } else {
        shapes.push(
          new fabric.Rect({
            width: width * 0.9,
            height: Math.max(5, height * 0.12),
            fill: "#d8d8d6",
            stroke: "#111111",
            strokeWidth: Math.max(0.5, strokeW * 0.45),
            left: 0,
            top: height / 2 - Math.max(5, height * 0.12) / 2 - 1,
            originX: "center",
            originY: "center"
          })
        );
      }
    } else if (type === "produce") {
      const { fill, stroke } = spec.palette || { fill: "#eef8e6", stroke: "#15803d" };
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill,
          stroke,
          strokeWidth: strokeW,
          rx: Math.min(width, height) * 0.08,
          ry: Math.min(width, height) * 0.08,
          originX: "center",
          originY: "center"
        })
      );
      const produceColors = ["#e23b2e", "#f6b21b", "#2fa84a", "#f4641f", "#7cb518", "#d62828"];
      const cols = 4;
      const rows = 3;
      let pi = 0;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const cx = -width / 2 + ((c + 0.5) * width) / cols;
          const cy = -height / 2 + ((r + 0.5) * height) / rows;
          shapes.push(
            new fabric.Circle({
              radius: Math.max(2.5, Math.min(width / cols, height / rows) * 0.26),
              fill: produceColors[pi % produceColors.length],
              stroke: "#1f2937",
              strokeWidth: 0.4,
              left: cx,
              top: cy,
              originX: "center",
              originY: "center"
            })
          );
          pi += 1;
        }
      }
      shapes.push(
        new fabric.Text(spec.tag2d || "FRESH", {
          fontSize: Math.max(7, plannerFontSize(0.5)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "700",
          fill: stroke,
          left: 0,
          top: height / 2 - Math.max(7, plannerFontSize(0.5)) * 0.7,
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "service") {
      const { fill, stroke } = spec.palette || { fill: "#f1f1ef", stroke: "#374151" };
      const variant = spec.serviceVariant || "deli";
      const dotPalettes = {
        deli: ["#b23a48", "#d1495b", "#e8998d", "#edae49", "#8c2f39"],
        fish: ["#9aa7b1", "#b0c4d4", "#d98a8a", "#8fb8c9", "#de6a5a"],
        bakery: ["#d9a05b", "#c8853c", "#e7b96f", "#a9682f", "#f5e6c8"]
      };
      const dots = dotPalettes[variant] || dotPalettes.deli;
      // Counter body.
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill,
          stroke,
          strokeWidth: strokeW,
          rx: Math.min(width, height) * 0.05,
          ry: Math.min(width, height) * 0.05,
          originX: "center",
          originY: "center"
        })
      );
      // Reserve the right end of a deli counter for the scale + bag dispenser.
      const caseW = variant === "deli" ? width * 0.62 : width * 0.94;
      const caseLeft = variant === "deli" ? -width / 2 + caseW / 2 + width * 0.03 : 0;
      const caseH = height * 0.6;
      // Glass display case toward the back (-Y), product strip toward the front (+Y).
      shapes.push(
        new fabric.Rect({
          width: caseW,
          height: caseH,
          fill: "#eaf3fa",
          stroke,
          strokeWidth: Math.max(0.6, strokeW * 0.6),
          opacity: 0.92,
          left: caseLeft,
          top: -height / 2 + caseH / 2 + height * 0.06,
          originX: "center",
          originY: "center"
        })
      );
      const cols = Math.max(3, Math.round(caseW / 14));
      const rowsS = 2;
      let si = 0;
      for (let r = 0; r < rowsS; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const cx = caseLeft - caseW / 2 + ((c + 0.5) * caseW) / cols;
          const cy = -height / 2 + height * 0.06 + ((r + 0.5) * caseH) / rowsS;
          shapes.push(
            new fabric.Circle({
              radius: Math.max(2, Math.min(caseW / cols, caseH / rowsS) * 0.3),
              fill: dots[si % dots.length],
              stroke: "#1f2937",
              strokeWidth: 0.4,
              left: cx,
              top: cy,
              originX: "center",
              originY: "center"
            })
          );
          si += 1;
        }
      }
      if (variant === "deli") {
        const accX = width / 2 - width * 0.16;
        shapes.push(
          new fabric.Rect({
            width: Math.max(8, width * 0.1),
            height: Math.max(8, width * 0.1),
            fill: "#d8d8d6",
            stroke,
            strokeWidth: Math.max(0.5, strokeW * 0.5),
            left: accX - width * 0.06,
            top: -height * 0.04,
            originX: "center",
            originY: "center"
          }),
          new fabric.Rect({
            width: Math.max(7, width * 0.08),
            height: Math.max(9, height * 0.22),
            fill: "#d9d2c4",
            stroke,
            strokeWidth: Math.max(0.5, strokeW * 0.5),
            left: accX + width * 0.07,
            top: -height * 0.02,
            originX: "center",
            originY: "center"
          })
        );
      }
      shapes.push(
        new fabric.Text(spec.tag2d || "SERVICE", {
          fontSize: Math.max(7, plannerFontSize(0.5)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "700",
          fill: stroke,
          left: 0,
          top: height / 2 - Math.max(7, plannerFontSize(0.5)) * 0.75,
          originX: "center",
          originY: "center"
        })
      );
    } else if (type === "station") {
      const { fill, stroke } = spec.palette || { fill: "#f1f1ef", stroke: "#374151" };
      const variant = spec.stationVariant || "coffee";
      // Counter body.
      shapes.push(
        new fabric.Rect({
          width,
          height,
          fill,
          stroke,
          strokeWidth: strokeW,
          rx: Math.min(width, height) * 0.08,
          ry: Math.min(width, height) * 0.08,
          originX: "center",
          originY: "center"
        })
      );
      if (variant === "juice") {
        // Two juice dispensers toward the back.
        [-width * 0.22, width * 0.22].forEach((dx, i) => {
          shapes.push(
            new fabric.Rect({
              width: Math.max(7, width * 0.18),
              height: Math.max(9, height * 0.4),
              fill: i === 0 ? "#f4751f" : "#e11d48",
              stroke,
              strokeWidth: Math.max(0.5, strokeW * 0.6),
              rx: 2,
              ry: 2,
              left: dx,
              top: -height * 0.14,
              originX: "center",
              originY: "center"
            })
          );
        });
      } else {
        // Coffee brewer + compact espresso unit toward the back.
        shapes.push(
          new fabric.Rect({
            width: Math.max(9, width * 0.3),
            height: Math.max(9, height * 0.42),
            fill: "#52555b",
            stroke,
            strokeWidth: Math.max(0.5, strokeW * 0.6),
            rx: 2,
            ry: 2,
            left: -width * 0.18,
            top: -height * 0.12,
            originX: "center",
            originY: "center"
          }),
          new fabric.Rect({
            width: Math.max(8, width * 0.24),
            height: Math.max(8, height * 0.32),
            fill: "#3a3f46",
            stroke,
            strokeWidth: Math.max(0.5, strokeW * 0.6),
            rx: 2,
            ry: 2,
            left: width * 0.2,
            top: -height * 0.08,
            originX: "center",
            originY: "center"
          })
        );
      }
      // Cup stacks toward the front.
      for (let i = 0; i < 3; i += 1) {
        shapes.push(
          new fabric.Circle({
            radius: Math.max(2, height * 0.07),
            fill: "#f3f1ec",
            stroke,
            strokeWidth: 0.5,
            left: -width * 0.24 + i * (width * 0.24),
            top: height * 0.22,
            originX: "center",
            originY: "center"
          })
        );
      }
      shapes.push(
        new fabric.Text(spec.tag2d || "STATION", {
          fontSize: Math.max(6, plannerFontSize(0.42)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "700",
          fill: stroke,
          left: 0,
          top: height / 2 - Math.max(6, plannerFontSize(0.42)) * 0.8,
          originX: "center",
          originY: "center"
        })
      );
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
      shapes.push(...buildSlidingDoorShapes(width, height, strokeW));
    } else if (kind === "checkout" || type === "checkout") {
      shapes.push(...buildSelfCheckoutShapes(width, height, strokeW));
    } else if (type === "entry-gated") {
      shapes.push(...buildTurnstileShapes(width, height, strokeW));
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
      const fill = spec.palette?.fill || "#d1d5db";
      const stroke = spec.palette?.stroke || "#374151";
      const depthPx = Math.max(4, height);
      shapes.push(
        new fabric.Rect({
          width,
          height: depthPx,
          fill,
          stroke,
          strokeWidth: strokeW,
          originX: "center",
          originY: "center"
        })
      );
      const postRadius = Math.max(2.5, depthPx * 0.75);
      [-width / 2, width / 2].forEach((left) => {
        shapes.push(
          new fabric.Circle({
            radius: postRadius,
            fill: stroke,
            left,
            originX: "center",
            originY: "center"
          })
        );
      });
      if (spec.tag2d) {
        shapes.push(
          new fabric.Text(spec.tag2d, {
            fontSize: Math.max(7, plannerFontSize(0.45)),
            fontFamily: "Inter, Arial, sans-serif",
            fontWeight: "700",
            fill: stroke,
            left: 0,
            top: 0,
            originX: "center",
            originY: "center"
          })
        );
      }
      return shapes;
    } else if (type === "wall-sign" || kind.startsWith("sign-")) {
      const panel = spec.panelColor || spec.palette?.fill || "#b8e0d2";
      const stroke = spec.palette?.stroke || "#5c9a82";
      const text = spec.signText || "SIGN";
      const textColor = spec.textColor || "#ffffff";
      const bandH = Math.max(22, height * 8, width * 0.1);
      shapes.push(
        new fabric.Rect({
          width,
          height: bandH,
          fill: panel,
          stroke,
          strokeWidth: Math.max(strokeW, 1.2),
          originX: "center",
          originY: "center"
        }),
        new fabric.Text(text, {
          fontSize: Math.max(12, plannerFontSize(1.05)),
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: "800",
          fill: textColor,
          charSpacing: 40,
          originX: "center",
          originY: "center"
        })
      );
      return shapes;
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

  function fullResetPlanner({ confirmDialog = true } = {}) {
    if (confirmDialog) {
      const ok = window.confirm(
        "Reset the entire planner? This clears all fixtures, blueprint overlay, dimensions (20×20 m), cost settings, and your saved session so you can design again from scratch."
      );
      if (!ok) return;
    }
    if (!plannerState.canvas) initPlanner();
    if (!plannerState.canvas) return;

    plannerState.canvas.discardActiveObject();
    clearPlannerObjects();
    clearPlannerBlueprint();
    hideBlueprintAreaInfo();
    if (plannerBlueprintInput) plannerBlueprintInput.value = "";

    plannerWidthInput.value = "20";
    plannerHeightInput.value = "20";
    plannerState.widthMeters = 20;
    plannerState.heightMeters = 20;
    plannerState.activePresetId = null;

    applyPlannerSenseiOptions(defaultSenseiOptions);
    initSaasTierRatesUI({});

    highlightActivePresetButton();
    if (plannerPresetSummary) plannerPresetSummary.textContent = "No baseline loaded.";

    simOccupancyPref = 24;
    simReentryPref = false;
    simPlaying = true;
    showMonitoringVizPref = true;
    if (simOccupancySlider) simOccupancySlider.value = "24";
    if (simOccupancyVal) simOccupancyVal.textContent = "24";
    syncSimPlayButton();
    syncSimReentryButton();
    if (planner3dView) planner3dView.setShowMonitoringViz(showMonitoringVizPref);
    if (planner3dGridBtn) planner3dGridBtn.classList.toggle("active", showMonitoringVizPref);

    drawPlannerBoundary();
    refreshAllWallLinks();
    syncPlannerMetaFromCanvas();
    refreshCachedLayout();
    plannerState.canvas.requestRenderAll();

    plannerStatus.textContent = "Planner reset — empty 20×20 m canvas. Add fixtures or load a baseline.";
    plannerStatus.style.color = "var(--ok)";

    updatePlannerEstimate();
    updateMonitoringSummary();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_err) {
      /* ignore */
    }
    persistState();
    void resetLiveSimulation({ randomize: false });
    requestPlanner3DSync({ refitCamera: true, force: true });
    syncSimulationUi();
  }

  function getSaasTierRateOverrides() {
    const overrides = {};
    if (!saasTierRates) return overrides;
    saasTierRates.querySelectorAll("[data-saas-tier-id]").forEach((input) => {
      const id = input.dataset.saasTierId;
      const value = Number(input.value);
      if (id && !Number.isNaN(value)) overrides[id] = value;
    });
    return overrides;
  }

  function saasTierChartLabel(tier) {
    if (tier.id === "tier-15") return "15";
    if (tier.maxSqm === Infinity) return "1200+";
    return String(tier.minSqm);
  }

  function renderSaasTierChart(tiers, activeTierId) {
    if (!saasTierChart) return;
    const maxRate = Math.max(...tiers.map((t) => t.rateEur), 1);
    saasTierChart.innerHTML = tiers
      .map((tier) => {
        const heightPct = Math.max(12, (tier.rateEur / maxRate) * 100);
        const active = tier.id === activeTierId ? " active" : "";
        return `<div class="saas-tier-bar${active}" data-saas-chart-tier="${tier.id}">
          <span class="saas-tier-bar-value">€${tier.rateEur}</span>
          <div class="saas-tier-bar-fill" style="height:${heightPct}px"></div>
          <span class="saas-tier-bar-label">${saasTierChartLabel(tier)}</span>
        </div>`;
      })
      .join("");
  }

  function renderSaasTierRateInputs(tiers, activeTierId) {
    if (!saasTierRates) return;
    saasTierRates.innerHTML = tiers
      .map(
        (tier) => `<div class="saas-tier-rate-row${tier.id === activeTierId ? " active" : ""}" data-saas-row-tier="${tier.id}">
        <label for="saas-rate-${tier.id}">${tier.label} (€/m²)</label>
        <input id="saas-rate-${tier.id}" type="number" min="0" max="9999" step="0.01" value="${tier.rateEur}" data-saas-tier-id="${tier.id}" />
      </div>`
      )
      .join("");
    saasTierRates.querySelectorAll("[data-saas-tier-id]").forEach((input) => {
      input.addEventListener("input", () => {
        updatePlannerEstimate();
        persistState();
      });
    });
  }

  function initSaasTierRatesUI(rateOverrides = {}) {
    const saas = globalThis.PlannerSaasCost;
    if (!saas || !saasTierRates) return;
    const tiers = saas.mergeSaasTiers(rateOverrides);
    renderSaasTierRateInputs(tiers, null);
    renderSaasTierChart(tiers, null);
  }

  function updateSaasProposedCostDisplay(areaSqm) {
    const saas = globalThis.PlannerSaasCost;
    if (!saas) return null;
    const result = saas.computeSaasProposedCost(areaSqm, getSaasTierRateOverrides());
    if (saasActiveBandLabel) saasActiveBandLabel.textContent = result.bandLabel;
    if (saasRatePerSqmLabel) saasRatePerSqmLabel.textContent = currency.format(result.rateEurPerSqm);
    if (saasProposedTotalLabel) saasProposedTotalLabel.textContent = currency.format(result.totalEur);
    if (saasFormulaNote) saasFormulaNote.textContent = result.formula;
    renderSaasTierChart(result.tiers, result.tier.id);
    if (saasTierRates) {
      saasTierRates.querySelectorAll(".saas-tier-rate-row").forEach((row) => {
        row.classList.toggle("active", row.dataset.saasRowTier === result.tier.id);
      });
    }
    return result;
  }

  function updateCapexSaasCalibration(capexEur, saasTotalEur) {
    const saas = globalThis.PlannerSaasCost;
    if (!saas || !saasCalibrationFlag) return;
    const calibration = saas.evaluateCapexSaasCalibration(capexEur, saasTotalEur);
    saasCalibrationFlag.classList.remove("healthy", "unhealthy", "pending");
    if (calibration.healthy === true) {
      saasCalibrationFlag.textContent = "Healthy";
      saasCalibrationFlag.classList.add("healthy");
    } else if (calibration.healthy === false) {
      saasCalibrationFlag.textContent = "Review pricing";
      saasCalibrationFlag.classList.add("unhealthy");
    } else {
      saasCalibrationFlag.textContent = "Pending";
      saasCalibrationFlag.classList.add("pending");
    }
    if (saasCalibrationDetail) {
      if (calibration.healthy == null) {
        saasCalibrationDetail.textContent = calibration.message;
      } else {
        saasCalibrationDetail.textContent = `${calibration.message} CapEx ${currency.format(calibration.capexEur)} vs SaaS ${currency.format(calibration.saasTotalEur)} (cap ${currency.format(calibration.saasCapEur)}).`;
      }
    }
  }

  function getPlannerSenseiOptions() {
    const pctRefRaw = senseiPctRefInput?.value?.trim();
    return {
      format: senseiFormatSelect?.value || "auto",
      projectType: senseiProjectTypeSelect?.value || "full",
      country: senseiCountrySelect?.value || "PT",
      uplink: senseiUplinkSelect?.value || "Wired + 5G",
      useRefurbished: Boolean(senseiUseRefurbishedInput?.checked),
      addSpare: Boolean(senseiAddSpareInput?.checked),
      scaleDiscount: clamp(Number(senseiScaleDiscountInput?.value) || 0, 0, 50),
      hasExternalTeam: Boolean(senseiExternalTeamInput?.checked),
      pctRef: pctRefRaw ? clamp(Number(pctRefRaw) / 100, 0, 1) : null,
      saasTierRates: getSaasTierRateOverrides()
    };
  }

  function applyPlannerSenseiOptions(model) {
    const safeModel = { ...defaultSenseiOptions, ...(model || {}) };
    if (senseiFormatSelect) senseiFormatSelect.value = safeModel.format || "auto";
    if (senseiProjectTypeSelect) senseiProjectTypeSelect.value = safeModel.projectType || "full";
    if (senseiCountrySelect) senseiCountrySelect.value = safeModel.country || "PT";
    if (senseiUplinkSelect) senseiUplinkSelect.value = safeModel.uplink || "Wired + 5G";
    if (senseiScaleDiscountInput) senseiScaleDiscountInput.value = String(clamp(Number(safeModel.scaleDiscount) || 0, 0, 50));
    if (senseiUseRefurbishedInput) senseiUseRefurbishedInput.checked = Boolean(safeModel.useRefurbished);
    if (senseiAddSpareInput) senseiAddSpareInput.checked = Boolean(safeModel.addSpare);
    if (senseiExternalTeamInput) senseiExternalTeamInput.checked = Boolean(safeModel.hasExternalTeam);
    if (senseiPctRefInput) {
      senseiPctRefInput.value =
        safeModel.pctRef != null && !Number.isNaN(Number(safeModel.pctRef))
          ? String(Math.round(Number(safeModel.pctRef) * 100))
          : "";
    }
    initSaasTierRatesUI(safeModel.saasTierRates || {});
  }

  function countLayoutForEstimate() {
    const counts = { ambient: 0, cold: 0, hot: 0, island: 0, produce: 0, service: 0 };
    let doors = 0;
    if (plannerState.canvas) {
      plannerState.canvas.getObjects().forEach((obj) => {
        if (obj.plannerKind === "shelf-ambient") counts.ambient += 1;
        if (obj.plannerKind === "shelf-island") counts.island += 1;
        if (obj.plannerKind === "shelf-cold") counts.cold += 1;
        if (obj.plannerKind === "shelf-hot") counts.hot += 1;
        if (obj.plannerKind === "produce-bin") counts.produce += 1;
        if (
          typeof obj.plannerKind === "string" &&
          (obj.plannerKind.startsWith("service-") || obj.plannerKind.startsWith("station-"))
        )
          counts.service += 1;
        if (obj.plannerKind === "entry-open" || obj.plannerKind === "entry-gated" || obj.plannerKind === "checkout") {
          doors += 1;
        }
      });
    }
    return { counts, doors: Math.max(1, doors || 1) };
  }

  function updatePlannerEstimate() {
    const { counts, doors } = countLayoutForEstimate();
    const totalModules =
      counts.ambient + counts.island + counts.cold + counts.hot + counts.produce + counts.service;
    const areaSqm = Math.max(1, plannerState.widthMeters * plannerState.heightMeters);

    countAmbientShelfLabel.textContent = String(counts.ambient + counts.island + counts.produce + counts.service);
    countColdShelfLabel.textContent = String(counts.cold);
    countHotShelfLabel.textContent = String(counts.hot);
    if (countTotalModulesLabel) countTotalModulesLabel.textContent = String(totalModules);
    if (senseiDoorCountLabel) senseiDoorCountLabel.textContent = String(doors);
    if (senseiAreaLabel) senseiAreaLabel.textContent = number.format(areaSqm);
    const saasResult = updateSaasProposedCostDisplay(areaSqm);

    const sensei = globalThis.PlannerSenseiCost;
    if (!sensei || !senseiAssumptions) {
      if (!senseiAssumptionsLoading) {
        senseiAssumptionsLoading = true;
        void loadSenseiAssumptions().finally(() => {
          senseiAssumptionsLoading = false;
          updatePlannerEstimate();
        });
      }
      updateCapexSaasCalibration(null, saasResult?.totalEur);
      return;
    }

    const result = sensei.estimateStoreCapex(
      senseiAssumptions,
      {
        widthMeters: plannerState.widthMeters,
        heightMeters: plannerState.heightMeters,
        counts,
        doors
      },
      getPlannerSenseiOptions()
    );

    if (result.error) {
      if (senseiDetectedFormatLabel) senseiDetectedFormatLabel.textContent = result.format || "—";
      plannerEstimatedCapexLabel.textContent = "—";
      if (senseiBomBreakdown) senseiBomBreakdown.textContent = result.error;
      updateCapexSaasCalibration(null, saasResult?.totalEur);
      return;
    }

    if (senseiDetectedFormatLabel) senseiDetectedFormatLabel.textContent = result.format;
    if (senseiCamTotalLabel) senseiCamTotalLabel.textContent = String(result.quantities.totalCams);
    if (senseiScaleTotalLabel) senseiScaleTotalLabel.textContent = String(result.quantities.totalScales);
    if (senseiServerTotalLabel) senseiServerTotalLabel.textContent = String(result.quantities.numSrv);
    if (plannerHardwareSubtotalLabel) plannerHardwareSubtotalLabel.textContent = currency.format(result.summary.hardwareSubtotalEur);
    if (plannerInstallSubtotalLabel) plannerInstallSubtotalLabel.textContent = currency.format(result.summary.installationSubtotalEur);
    plannerEstimatedCapexLabel.textContent = currency.format(result.summary.capexEur);
    plannerEstimatedCostPerSqmLabel.textContent = `${currency.format(result.summary.capexPerSqmEur)}/m²`;
    if (senseiBomBreakdown) senseiBomBreakdown.textContent = formatSenseiBom(result.bom);
    updateCapexSaasCalibration(result.summary.capexEur, saasResult?.totalEur);
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

  let blueprintInferenceModule = null;

  async function ensureBlueprintInference() {
    if (blueprintInferenceModule) return blueprintInferenceModule;
    blueprintInferenceModule = await import("./planner-blueprint-inference.js");
    return blueprintInferenceModule;
  }

  function clearBlueprintInferredFixtures() {
    if (!plannerState.canvas) return;
    const kinds =
      blueprintInferenceModule?.BLUEPRINT_INFERRED_KINDS ??
      new Set([
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
    const toRemove = plannerState.canvas.getObjects().filter((obj) => kinds.has(obj.plannerKind));
    toRemove.forEach((obj) => plannerState.canvas.remove(obj));
  }

  async function applyBlueprintInferredLayout(renderCanvas) {
    const mod = await ensureBlueprintInference();
    await ensureLayoutBuilder();
    clearBlueprintInferredFixtures();

    const analysis = mod.analyzeBlueprintImage(renderCanvas);
    const inference = mod.inferFixtureCountsFromBlueprint({
      widthMeters: plannerState.widthMeters,
      heightMeters: plannerState.heightMeters,
      analysis
    });
    const built = mod.buildBlueprintInferredLayout({
      widthMeters: plannerState.widthMeters,
      heightMeters: plannerState.heightMeters,
      shelves: inference.shelves,
      artifacts: artifactCatalogForBuilder(),
      analysis,
      gapMeters: plannerSettings.layoutGapMeters ?? 0.15,
      marginMeters: 0.55
    });

    plannerBatchAdding = true;
    built.fixtures.forEach((fixture) => {
      const point = canvasPointFromMeters(fixture.x, fixture.y);
      addPlannerObject(fixture.kind, {
        left: point.left,
        top: point.top,
        angle: fixture.angle || 0,
        silent: true
      });
    });
    plannerBatchAdding = false;
    plannerState.canvas.requestRenderAll();
    requestPlanner3DSync();
    return { inference, placed: built.placed, analysis };
  }

  function applyBlueprintDimensionsFromAspect(aspectRatio) {
    const area = plannerState.widthMeters * plannerState.heightMeters;
    const ratio = aspectRatio > 0 ? aspectRatio : 1;
    const nextWidth = clamp(Math.sqrt(area * ratio), 5, 200);
    const nextHeight = clamp(area / Math.max(1, nextWidth), 5, 200);
    plannerState.widthMeters = Number(nextWidth.toFixed(1));
    plannerState.heightMeters = Number(nextHeight.toFixed(1));
    plannerWidthInput.value = String(plannerState.widthMeters);
    plannerHeightInput.value = String(plannerState.heightMeters);
    drawPlannerBoundary();
    resizePlannerCanvasToContainer();
  }

  function showBlueprintAreaInfo({ widthMeters, heightMeters, areaSqm, dims }) {
    if (!plannerBlueprintInfo) return;
    const w = Number(widthMeters);
    const h = Number(heightMeters);
    const area = areaSqm != null ? areaSqm : Math.round(w * h);
    if (plannerBlueprintArea) plannerBlueprintArea.textContent = `${number.format(area)} m²`;
    if (plannerBlueprintDims) plannerBlueprintDims.textContent = `${w} × ${h} m`;

    const measured = Boolean(dims);
    if (plannerBlueprintBadge) {
      plannerBlueprintBadge.textContent = measured ? "Measured" : "Estimated";
      plannerBlueprintBadge.style.background = measured ? "var(--wb-highlight, #fff9c4)" : "#f5eeb8";
    }
    if (plannerBlueprintNote) {
      plannerBlueprintNote.textContent = measured
        ? dims.note || `Read from blueprint (${dims.source}).`
        : "No scale or dimensions found in the file — size estimated from page proportions. Adjust width/height if needed.";
    }
    plannerBlueprintInfo.hidden = false;
  }

  function hideBlueprintAreaInfo() {
    if (plannerBlueprintInfo) plannerBlueprintInfo.hidden = true;
  }

  function applyBlueprintDimensionsExact(widthMeters, heightMeters) {
    plannerState.widthMeters = Number(clamp(widthMeters, 5, 200).toFixed(1));
    plannerState.heightMeters = Number(clamp(heightMeters, 5, 200).toFixed(1));
    plannerWidthInput.value = String(plannerState.widthMeters);
    plannerHeightInput.value = String(plannerState.heightMeters);
    drawPlannerBoundary();
    resizePlannerCanvasToContainer();
  }

  async function renderBlueprintOverlay(renderCanvas) {
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
  }

  async function loadPlannerBlueprintImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      });
      applyBlueprintDimensionsFromAspect(img.width / Math.max(1, img.height));
      const maxWidth = Math.max(120, metersToPx(plannerState.widthMeters) - 8);
      const maxHeight = Math.max(120, metersToPx(plannerState.heightMeters) - 8);
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      const renderCanvas = document.createElement("canvas");
      renderCanvas.width = Math.ceil(img.width * scale);
      renderCanvas.height = Math.ceil(img.height * scale);
      const context = renderCanvas.getContext("2d");
      context.drawImage(img, 0, 0, renderCanvas.width, renderCanvas.height);
      await renderBlueprintOverlay(renderCanvas);
      return { renderCanvas, dims: null };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function loadPlannerBlueprintPdf(file) {
    if (!file) return null;

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });

      // Try to read the real store size from the drawing's scale or dimension text.
      let dims = null;
      try {
        const textContent = await page.getTextContent();
        const mod = await ensureBlueprintInference();
        dims = mod.inferDimensionsFromPdfText(textContent, baseViewport);
      } catch (_textError) {
        dims = null;
      }

      if (dims) {
        applyBlueprintDimensionsExact(dims.widthMeters, dims.heightMeters);
      } else {
        applyBlueprintDimensionsFromAspect(baseViewport.width / Math.max(1, baseViewport.height));
      }

      const maxWidth = Math.max(120, metersToPx(plannerState.widthMeters) - 8);
      const maxHeight = Math.max(120, metersToPx(plannerState.heightMeters) - 8);
      const scale = Math.min(maxWidth / baseViewport.width, maxHeight / baseViewport.height);
      const viewport = page.getViewport({ scale: Math.max(0.1, scale) });
      const renderCanvas = document.createElement("canvas");
      const context = renderCanvas.getContext("2d");
      renderCanvas.width = Math.ceil(viewport.width);
      renderCanvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;
      await renderBlueprintOverlay(renderCanvas);
      return { renderCanvas, dims };
    } catch (_error) {
      return null;
    }
  }

  async function loadPlannerBlueprintFile(file) {
    if (!plannerState.canvas) return;
    if (!file) return;

    const isImage =
      (file.type && file.type.startsWith("image/")) || /\.(png|jpe?g|webp)$/i.test(file.name || "");
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");

    try {
      let result = null;
      if (isImage) {
        result = await loadPlannerBlueprintImage(file);
      } else if (isPdf) {
        if (!window.pdfjsLib) {
          plannerStatus.textContent = "PDF support unavailable. Check network and refresh the page.";
          plannerStatus.style.color = "var(--warn)";
          return;
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        result = await loadPlannerBlueprintPdf(file);
      } else {
        plannerStatus.textContent = "Unsupported blueprint format. Upload PDF or PNG/JPEG.";
        plannerStatus.style.color = "var(--warn)";
        return;
      }

      if (!result || !result.renderCanvas) {
        plannerStatus.textContent = "Could not read blueprint. Please upload a valid PDF or image.";
        plannerStatus.style.color = "var(--bad)";
        return;
      }

      const { renderCanvas, dims } = result;
      const mod = await ensureBlueprintInference();
      const { inference, placed, analysis } = await applyBlueprintInferredLayout(renderCanvas);
      updatePlannerEstimate();
      persistState();

      showBlueprintAreaInfo({
        widthMeters: plannerState.widthMeters,
        heightMeters: plannerState.heightMeters,
        areaSqm: dims ? dims.areaSqm : null,
        dims
      });

      const summary = mod.summarizeBlueprintInference(inference, placed);
      const entranceNote = analysis.entranceLikely ? "Entrance at front." : "Entrance placed at front (required).";
      const sizeNote = dims
        ? `Store size guessed ${plannerState.widthMeters}×${plannerState.heightMeters} m (~${dims.areaSqm} m², ${dims.source}). `
        : `Store size set from page proportions (${plannerState.widthMeters}×${plannerState.heightMeters} m) — verify scale. `;
      plannerStatus.textContent = `Blueprint loaded (${file.name}). ${sizeNote}${entranceNote} ${summary}`;
      plannerStatus.style.color = "var(--ok)";
    } catch (_error) {
      plannerStatus.textContent = "Could not read blueprint. Please upload a valid PDF or image.";
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

  function drawPlannerBoundary({ refitViewport = true } = {}) {
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
    if (plannerState.blueprintObject) {
      plannerState.blueprintObject.sendToBack();
      plannerState.gridObjects.forEach((obj) => obj.bringToFront());
      boundary.bringToFront();
    }
    updatePlannerArea();
    if (refitViewport) fitPlannerViewport();
    else plannerState.canvas.requestRenderAll();
  }

  function restorePlannerCanvasFromJson(canvasJson, { refitViewport = true } = {}) {
    return new Promise((resolve) => {
      if (!plannerState.canvas || !canvasJson) {
        drawPlannerBoundary({ refitViewport });
        resolve(false);
        return;
      }
      layoutApplying = true;
      plannerState.canvas.loadFromJSON(canvasJson, () => {
        plannerState.canvas.renderAll();
        syncPlannerMetaFromCanvas();
        refreshAllWallLinks();
        drawPlannerBoundary({ refitViewport });
        layoutApplying = false;
        resolve(true);
      });
    });
  }

  function setStoreDimensionsFromInputs() {
    const widthMeters = clamp(Number(plannerWidthInput.value) || 20, 5, 200);
    const heightMeters = clamp(Number(plannerHeightInput.value) || 20, 5, 200);
    plannerState.widthMeters = widthMeters;
    plannerState.heightMeters = heightMeters;
    plannerWidthInput.value = String(widthMeters);
    plannerHeightInput.value = String(heightMeters);
    syncPlannerMeterScale();
    updatePlannerArea();
  }

  function applyStoreDimensions() {
    setStoreDimensionsFromInputs();
    drawPlannerBoundary();
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
    let spec = PLANNER_ARTIFACTS[kind];
    if (!spec && kind.startsWith("sign-")) {
      spec = {
        label: "Wall sign",
        w: 5,
        h: 0.1,
        type: "wall-sign",
        heightMeters: 2.4,
        signText: "SIGN",
        textColor: "#ffffff",
        panelColor: "#b8e0d2",
        palette: { fill: "#b8e0d2", stroke: "#5c9a82" }
      };
    }
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
      cornerStrokeColor: "#111111",
      transparentCorners: false,
      borderColor: "#111111"
    });
    group.plannerKind = kind;
    group.plannerMeters = { w: spec.w, h: spec.h };
    if (wallLinksModule?.isWallKind(kind)) {
      group.lockScalingX = true;
      group.lockScalingY = true;
      group.lockUniScaling = true;
      group.plannerWallLinks = { start: null, end: null };
    }
    if (options.objectId) {
      group.plannerObjectId = options.objectId;
    } else {
      ensurePlannerObjectId(group);
    }
    plannerState.canvas.add(group);
    group.setCoords();
    clampObjectWithinStore(group);
    capturePlannerPoseMeters(group);
    if (wallLinksModule?.isWallKind(kind)) {
      applyWallInteraction(group, { snapAngle: true, snapPosition: true });
      refreshAllWallLinks();
    }
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

    applyPlannerSenseiOptions(defaultSenseiOptions);
    resizePlannerCanvasToContainer();
    updatePlannerEstimate();
    const sync3d = () => requestPlanner3DSync();
    const liveSync3d = () => {
      if (plannerViewMode === "3d" || plannerViewMode === "simulation") syncPlanner3DView();
    };
    const keepInStore = (target) => {
      if (!target) return;
      if (isPlannerFixture(target) || isActiveSelectionTarget(target)) clampObjectWithinStore(target);
    };
    plannerState.canvas.on("object:modified", (event) => {
      keepInStore(event?.target);
      if (selectionContainsWall(event?.target)) {
        applyWallInteraction(event?.target, { snapAngle: true, snapPosition: true });
        refreshAllWallLinks();
      }
      capturePlannerPosesFromTarget(event?.target);
      persistState();
      sync3d();
    });
    plannerState.canvas.on("object:rotating", (event) => {
      keepInStore(event?.target);
      capturePlannerPosesFromTarget(event?.target);
      liveSync3d();
    });
    plannerState.canvas.on("object:moving", (event) => {
      keepInStore(event?.target);
      if (selectionContainsWall(event?.target)) {
        applyWallInteraction(event?.target, { snapAngle: false, snapPosition: true });
        refreshAllWallLinks();
      }
      capturePlannerPosesFromTarget(event?.target);
      liveSync3d();
    });
    plannerState.canvas.on("object:scaling", (event) => {
      keepInStore(event?.target);
      capturePlannerPosesFromTarget(event?.target);
      liveSync3d();
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
      costModel: getPlannerSenseiOptions(),
      preferences: {
        showMonitoringViz: showMonitoringVizPref,
        simOccupancy: simOccupancyPref,
        simPlaying: simPlaying,
        simReentry: simReentryPref
      },
      canvasJson: plannerState.canvas
        ? plannerState.canvas.toDatalessJSON([
            "plannerKind",
            "plannerObjectId",
            "plannerMeters",
            "plannerPoseMeters",
            "plannerWallLinks"
          ])
        : null
    };
  }

  async function applyPlannerState(state) {
    if (!state || typeof state !== "object") return false;
    if (state.widthMeters) plannerWidthInput.value = state.widthMeters;
    if (state.heightMeters) plannerHeightInput.value = state.heightMeters;
    plannerState.activePresetId = state.activePresetId || null;
    applyPlannerSenseiOptions(state.costModel || state.senseiOptions || defaultSenseiOptions);
    if (state.preferences) {
      showMonitoringVizPref = state.preferences.showMonitoringViz !== false;
      simOccupancyPref = Number(state.preferences.simOccupancy) || 24;
      simPlaying = state.preferences.simPlaying !== false;
      simReentryPref = state.preferences.simReentry === true;
      syncMonitoringGridButton();
      if (simOccupancySlider) simOccupancySlider.value = String(simOccupancyPref);
      if (simOccupancyVal) simOccupancyVal.textContent = String(simOccupancyPref);
      syncSimPlayButton();
      syncSimReentryButton();
      if (planner3dView) planner3dView.setShowMonitoringViz(showMonitoringVizPref);
    }
    highlightActivePresetButton();
    if (state.canvasJson && plannerState.canvas) {
      setStoreDimensionsFromInputs();
      await restorePlannerCanvasFromJson(state.canvasJson, { refitViewport: true });
    } else {
      applyStoreDimensions();
    }
    if (plannerState.activePresetId && STORE_PRESETS[plannerState.activePresetId]) {
      const p = STORE_PRESETS[plannerState.activePresetId];
      plannerPresetSummary.textContent = `${p.label}: ${plannerState.widthMeters}×${plannerState.heightMeters} m (${number.format(plannerState.widthMeters * plannerState.heightMeters)} m²)`;
    }
    updatePlannerEstimate();
    updateMonitoringSummary();
    refreshCachedLayout();
    requestPlanner3DSync({ resetSimulation: false });
    return true;
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializePlannerState()));
    } catch (_err) {}
  }

  async function loadPersistedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        await applyPlannerState(JSON.parse(raw));
        return true;
      }
      const legacyRaw = localStorage.getItem(LEGACY_SIMULATOR_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy.planner) {
          await applyPlannerState(legacy.planner);
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
      await resetLiveSimulation({ randomize: true });
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

  simReentryBtn?.addEventListener("click", async () => {
    simReentryPref = !simReentryPref;
    syncSimReentryButton();
    persistState();
    await ensureShopperSim();
    if (shopperSim) shopperSim.setReplenish(simReentryPref);
    // Turning re-entry back on resumes a finished run.
    if (simReentryPref && plannerViewMode === "simulation") {
      if (!simPlaying) {
        simPlaying = true;
        syncSimPlayButton();
        syncSimulationUi();
      }
      startLiveSimulationLoop();
    }
  });

  simRandomizeBtn?.addEventListener("click", async () => {
    if (!simPlaying) {
      simPlaying = true;
      syncSimPlayButton();
      syncSimulationUi();
    }
    await resetLiveSimulation({ randomize: true });
  });

  simIsoBtn?.addEventListener("click", () => {
    if (!planner3dView) return;
    const next = planner3dView.getCameraView() === "isometric" ? "perspective" : "isometric";
    planner3dView.setCameraView(next);
    syncSimCameraButton();
    if (planner3dIsoBtn) {
      planner3dIsoBtn.classList.toggle("active", next === "isometric");
      planner3dIsoBtn.textContent = next === "isometric" ? "Isometric" : "Perspective";
    }
    planner3dView.fitCamera();
  });

  simFitBtn?.addEventListener("click", () => {
    planner3dView?.fitCamera();
  });

  simZoomInBtn?.addEventListener("click", () => {
    planner3dView?.zoomIn();
  });

  simZoomOutBtn?.addEventListener("click", () => {
    planner3dView?.zoomOut();
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
  document.querySelectorAll(".planner-pod-btn").forEach((button) => {
    button.addEventListener("click", () => {
      applyPodConstruct(button.dataset.pod);
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
    const layoutDocument = buildCurrentLayoutDocument();
    const blob = new Blob([JSON.stringify(layoutDocument, null, 2)], { type: "application/json" });
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
    if (!layoutDocModule) return;
    updateTemplateSummary(selectedTemplateEntry());
    updateTemplateActionState();
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

  plannerDeleteTemplateBtn?.addEventListener("click", () => {
    void deleteSelectedTemplate();
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

  [senseiFormatSelect, senseiProjectTypeSelect, senseiCountrySelect, senseiUplinkSelect]
    .filter(Boolean)
    .forEach((input) =>
      input.addEventListener("change", () => {
        updatePlannerEstimate();
        persistState();
      })
    );

  [
    senseiPctRefInput,
    senseiScaleDiscountInput
  ]
    .filter(Boolean)
    .forEach((input) =>
      input.addEventListener("input", () => {
        updatePlannerEstimate();
        persistState();
      })
    );

  [senseiUseRefurbishedInput, senseiAddSpareInput, senseiExternalTeamInput]
    .filter(Boolean)
    .forEach((input) =>
      input.addEventListener("change", () => {
        updatePlannerEstimate();
        persistState();
      })
    );

  if (saasTierResetBtn) {
    saasTierResetBtn.addEventListener("click", () => {
      initSaasTierRatesUI({});
      updatePlannerEstimate();
      persistState();
    });
  }

  initSaasTierRatesUI();

  plannerLoadBlueprintBtn.addEventListener("click", () => plannerBlueprintInput.click());
  plannerBlueprintInput.addEventListener("change", async (event) => {
    if (!plannerState.canvas) initPlanner();
    const file = event.target.files && event.target.files[0];
    await loadPlannerBlueprintFile(file);
    event.target.value = "";
  });

  plannerClearBlueprintBtn.addEventListener("click", () => {
    if (!plannerState.canvas) initPlanner();
    if (!plannerState.canvas || !plannerState.blueprintObject) return;
    plannerState.canvas.remove(plannerState.blueprintObject);
    plannerState.blueprintObject = null;
    plannerState.canvas.requestRenderAll();
    hideBlueprintAreaInfo();
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

  plannerResetBtn?.addEventListener("click", () => fullResetPlanner());
  plannerFullResetBtn?.addEventListener("click", () => fullResetPlanner());

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
      await applyPlannerState(parsed.data || parsed);
      persistState();
      updateMonitoringSummary();
    } catch (_err) {
      alert("Could not import session file.");
    }
    event.target.value = "";
  });

  (async () => {
    await ensureWallLinksModule();
    bindPlannerAddButtonContainers();
    await loadStoreProfilesFromApi();
    initPlanner();
    await ensureLayoutDocumentModule();
    const restored = await loadPersistedState();
    if (!restored) drawPlannerBoundary();
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
