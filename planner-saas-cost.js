/** Tiered SaaS €/m² pricing from store selling area. */

const DEFAULT_SAAS_TIERS = [
  { id: "tier-15", minSqm: 0, maxSqm: 60, rateEur: 16, label: "15–60 m²" },
  { id: "tier-60", minSqm: 60, maxSqm: 200, rateEur: 14, label: "60–200 m²" },
  { id: "tier-200", minSqm: 200, maxSqm: 400, rateEur: 12, label: "200–400 m²" },
  { id: "tier-400", minSqm: 400, maxSqm: 800, rateEur: 10, label: "400–800 m²" },
  { id: "tier-800", minSqm: 800, maxSqm: 1200, rateEur: 7, label: "800–1,200 m²" },
  { id: "tier-1200", minSqm: 1200, maxSqm: Infinity, rateEur: 5, label: "> 1,200 m²" }
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mergeSaasTiers(rateOverrides = {}) {
  return DEFAULT_SAAS_TIERS.map((tier) => {
    const raw = rateOverrides?.[tier.id];
    const rateEur =
      raw != null && !Number.isNaN(Number(raw)) ? clamp(Number(raw), 0, 9999) : tier.rateEur;
    return { ...tier, rateEur };
  });
}

function resolveSaasTier(areaSqm, tiers = DEFAULT_SAAS_TIERS) {
  const area = Math.max(0, Number(areaSqm) || 0);
  const sorted = [...tiers].sort((a, b) => a.minSqm - b.minSqm);
  for (const tier of sorted) {
    if (area >= tier.minSqm && area < tier.maxSqm) return tier;
  }
  return sorted[sorted.length - 1];
}

function formatBandLabel(tier) {
  if (tier.maxSqm === Infinity) return `${tier.minSqm.toLocaleString()}+ m²`;
  if (tier.minSqm <= 0) return `< ${tier.maxSqm} m²`;
  return `${tier.minSqm}–${tier.maxSqm} m²`;
}

function computeSaasProposedCost(areaSqm, rateOverrides = {}) {
  const tiers = mergeSaasTiers(rateOverrides);
  const area = Math.max(0, Number(areaSqm) || 0);
  const tier = resolveSaasTier(area, tiers);
  const rateEurPerSqm = tier.rateEur;
  const totalEur = area * rateEurPerSqm;

  return {
    areaSqm: area,
    tier,
    tiers,
    rateEurPerSqm,
    totalEur,
    bandLabel: tier.label || formatBandLabel(tier),
    formula: `${area.toLocaleString()} m² × €${rateEurPerSqm}/m² = €${Math.round(totalEur).toLocaleString()}`
  };
}

const CAPEX_SAAS_HEALTHY_RATIO = 3;

function evaluateCapexSaasCalibration(capexEur, saasTotalEur) {
  const capex = Number(capexEur);
  const saas = Number(saasTotalEur);
  if (!Number.isFinite(capex) || capex < 0 || !Number.isFinite(saas) || saas <= 0) {
    return {
      healthy: null,
      ratio: null,
      capRatio: CAPEX_SAAS_HEALTHY_RATIO,
      capexEur: Number.isFinite(capex) ? capex : null,
      saasTotalEur: Number.isFinite(saas) ? saas : null,
      saasCapEur: null,
      message: "CapEx and SaaS totals required to calibrate."
    };
  }
  const saasCapEur = CAPEX_SAAS_HEALTHY_RATIO * saas;
  const ratio = capex / saas;
  const healthy = capex < saasCapEur;
  return {
    healthy,
    ratio,
    capRatio: CAPEX_SAAS_HEALTHY_RATIO,
    capexEur: capex,
    saasTotalEur: saas,
    saasCapEur,
    message: healthy
      ? `CapEx is ${ratio.toFixed(2)}× SaaS — below the ${CAPEX_SAAS_HEALTHY_RATIO}× cap (healthy).`
      : `CapEx is ${ratio.toFixed(2)}× SaaS — at or above the ${CAPEX_SAAS_HEALTHY_RATIO}× cap (review pricing).`
  };
}

const PlannerSaasCost = {
  DEFAULT_SAAS_TIERS,
  CAPEX_SAAS_HEALTHY_RATIO,
  mergeSaasTiers,
  resolveSaasTier,
  computeSaasProposedCost,
  evaluateCapexSaasCalibration,
  formatBandLabel
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = PlannerSaasCost;
}
if (typeof globalThis !== "undefined") {
  globalThis.PlannerSaasCost = PlannerSaasCost;
}
