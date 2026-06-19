/** Canonical store layout document + saved template helpers (browser + Node). */

export const LAYOUT_DOC_VERSION = 2;
export const CANVAS_CUSTOM_PROPS = ["plannerKind", "plannerObjectId", "plannerMeters", "plannerPoseMeters"];
export const TEMPLATES_STORAGE_KEY = "smart_store_planner_templates_v1";

export function layoutSnapshotSignature(layout) {
  if (!layout) return "";
  const objects = layout.objects || [];
  const zones = layout.monitoring?.zones || [];
  return `${layout.widthMeters || 0}x${layout.heightMeters || 0}:${objects
    .map((obj) => `${obj.id}:${obj.kind}:${obj.meters?.x},${obj.meters?.z},${obj.angle}`)
    .join("|")}:${zones.map((zone) => `${zone.id}:${zone.kind}`).join("|")}`;
}

export function buildLayoutDocument({
  widthMeters,
  heightMeters,
  activePresetId = null,
  costModel = null,
  layout = null,
  canvasJson = null,
  preferences = {},
  templateMeta = null
} = {}) {
  return {
    version: LAYOUT_DOC_VERSION,
    exportedAt: new Date().toISOString(),
    templateMeta,
    store: {
      widthMeters: Number(widthMeters) || 20,
      heightMeters: Number(heightMeters) || 20
    },
    activePresetId: activePresetId || null,
    costModel: costModel ? { ...costModel } : null,
    layout: layout ? structuredClone(layout) : null,
    canvasJson: canvasJson || null,
    preferences: {
      showMonitoringViz: preferences.showMonitoringViz !== false,
      simOccupancy: Number(preferences.simOccupancy) || 24,
      simPlaying: preferences.simPlaying !== false
    }
  };
}

export function normalizeLayoutDocument(input) {
  if (!input || typeof input !== "object") return null;

  if (input.version === LAYOUT_DOC_VERSION && input.store) {
    return {
      ...input,
      preferences: {
        showMonitoringViz: input.preferences?.showMonitoringViz !== false,
        simOccupancy: Number(input.preferences?.simOccupancy) || 24,
        simPlaying: input.preferences?.simPlaying !== false
      }
    };
  }

  const widthMeters = input.store?.widthMeters ?? input.widthMeters ?? 20;
  const heightMeters = input.store?.heightMeters ?? input.heightMeters ?? 20;

  return buildLayoutDocument({
    widthMeters,
    heightMeters,
    activePresetId: input.activePresetId ?? null,
    costModel: input.costModel ?? null,
    layout: input.layout ?? null,
    canvasJson: input.canvasJson ?? null,
    preferences: input.preferences ?? {},
    templateMeta: input.templateMeta ?? null
  });
}

export function loadTemplatesStore() {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) return { version: 1, templates: [], seeded: false };
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || 1,
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      seeded: Boolean(parsed.seeded)
    };
  } catch (_error) {
    return { version: 1, templates: [], seeded: false };
  }
}

export function saveTemplatesStore(store) {
  localStorage.setItem(
    TEMPLATES_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      templates: store.templates || [],
      seeded: Boolean(store.seeded)
    })
  );
}

export function upsertTemplate(store, template) {
  const next = { ...store, templates: [...(store.templates || [])] };
  const index = next.templates.findIndex((entry) => entry.id === template.id);
  if (index >= 0) next.templates[index] = template;
  else next.templates.push(template);
  saveTemplatesStore(next);
  return next;
}

export function fixturesToLayoutObjects(fixtures, artifacts, idPrefix = "tpl") {
  return (fixtures || []).map((fixture, index) => {
    const spec = artifacts?.[fixture.kind] || {};
    return {
      id: `${idPrefix}-${index}-${fixture.kind}`,
      kind: fixture.kind,
      angle: fixture.angle || 0,
      meters: {
        x: fixture.x,
        z: fixture.y,
        w: spec.widthMeters ?? 1.2,
        h: spec.depthMeters ?? 0.45
      }
    };
  });
}

export function buildMonitoringFromObjects(objects, getArtifactSpec) {
  const zones = (objects || [])
    .filter((obj) => obj.kind && obj.kind.startsWith("monitor-"))
    .map((obj) => {
      const spec = getArtifactSpec?.(obj.kind) || {};
      return {
        id: obj.id,
        kind: obj.kind,
        label: spec.label || obj.kind,
        capability: spec.monitorCapability,
        metrics: spec.monitorMetrics || [],
        meters: obj.meters,
        angle: obj.angle
      };
    });
  return {
    zoneCount: zones.length,
    entrances: zones.filter((zone) => zone.capability === "count").length,
    tracking: zones.filter((zone) => zone.capability === "track").length,
    interaction: zones.filter((zone) => zone.capability === "interaction").length,
    zones
  };
}
