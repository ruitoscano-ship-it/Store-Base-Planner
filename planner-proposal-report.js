/** Proposal Approach report — preview HTML and PDF export. */

const CAPEX_RANGE_FACTOR = 0.15;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(value, formatter) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return formatter ? formatter.format(n) : `€${Math.round(n).toLocaleString()}`;
}

function capexRange(capexEur) {
  const base = Number(capexEur);
  if (!Number.isFinite(base) || base <= 0) return null;
  return {
    low: base * (1 - CAPEX_RANGE_FACTOR),
    mid: base,
    high: base * (1 + CAPEX_RANGE_FACTOR)
  };
}

function riskClass(risk) {
  const key = String(risk || "").toLowerCase();
  if (key === "critical") return "proposal-risk-critical";
  if (key === "high") return "proposal-risk-high";
  if (key === "medium") return "proposal-risk-medium";
  return "proposal-risk-low";
}

function buildProposalReportData(context) {
  const areaSqm = Math.max(0, Number(context.areaSqm) || 0);
  const capex = capexRange(context.capexEur);
  const opexMonthly = Number(context.opexMonthlyEur);
  const questions = context.questions || globalThis.PlannerDiscoveryQuestions?.DISCOVERY_QUESTIONS || [];

  return {
    generatedAt: context.generatedAt || new Date().toISOString(),
    storeLabel: context.storeLabel || "Store layout",
    dimensionsLabel: context.dimensionsLabel || "—",
    areaSqm,
    format: context.format || "—",
    snapshotDataUrl: context.snapshotDataUrl || null,
    capex,
    opexMonthly: Number.isFinite(opexMonthly) ? opexMonthly : null,
    opexFormula: context.opexFormula || null,
    opexBandLabel: context.opexBandLabel || null,
    calibrationLabel: context.calibrationLabel || null,
    questions
  };
}

function renderProposalReportHtml(data, { currencyFormatter } = {}) {
  const dateLabel = new Date(data.generatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const capexBlock = data.capex
    ? `<p class="proposal-metric-range">${formatCurrency(data.capex.low, currencyFormatter)} – ${formatCurrency(data.capex.high, currencyFormatter)}</p>
       <p class="proposal-metric-mid">Midpoint estimate: <strong>${formatCurrency(data.capex.mid, currencyFormatter)}</strong> (±15% ballpark)</p>`
    : `<p class="proposal-metric-mid">CapEx estimate unavailable — add fixtures and Sensei assumptions to compute hardware scope.</p>`;

  const opexBlock =
    data.opexMonthly != null
      ? `<p class="proposal-metric-range"><strong>${formatCurrency(data.opexMonthly, currencyFormatter)}</strong> / month</p>
         ${data.opexBandLabel ? `<p class="proposal-metric-note">Tier band: ${escapeHtml(data.opexBandLabel)}</p>` : ""}
         ${data.opexFormula ? `<p class="proposal-metric-note">${escapeHtml(data.opexFormula)}</p>` : ""}`
      : `<p class="proposal-metric-mid">OpEx estimate unavailable — set store selling area to compute SaaS pricing.</p>`;

  const snapshotBlock = data.snapshotDataUrl
    ? `<figure class="proposal-snapshot"><img src="${data.snapshotDataUrl}" alt="Isometric 3D layout snapshot" /></figure>`
    : `<p class="proposal-metric-note">3D snapshot unavailable — place fixtures on the plan and try again.</p>`;

  const questionRows = data.questions
    .map(
      (item, index) => `<li class="proposal-question">
        <div class="proposal-question-head">
          <span class="proposal-question-num">${index + 1}</span>
          <span class="proposal-question-category">${escapeHtml(item.category)}</span>
          <span class="proposal-risk ${riskClass(item.risk)}">${escapeHtml(item.risk)}</span>
        </div>
        <p class="proposal-question-text">${escapeHtml(item.question)}</p>
        <p class="proposal-question-mitigation"><strong>Why it matters:</strong> ${escapeHtml(item.mitigation)}</p>
      </li>`
    )
    .join("");

  return `<article class="proposal-report" id="proposalReportDocument">
    <header class="proposal-report-header">
      <p class="proposal-report-kicker">Sensei · Smart Store</p>
      <h1 class="proposal-report-title">Proposal Approach</h1>
      <p class="proposal-report-meta">${escapeHtml(data.storeLabel)} · ${escapeHtml(data.dimensionsLabel)} · ${escapeHtml(String(data.areaSqm))} m² · ${escapeHtml(data.format)}</p>
      <p class="proposal-report-meta">Generated ${escapeHtml(dateLabel)}</p>
      ${data.calibrationLabel ? `<p class="proposal-report-calibration">${escapeHtml(data.calibrationLabel)}</p>` : ""}
    </header>

    <section class="proposal-section">
      <h2>Store layout</h2>
      <p class="proposal-section-lead">Isometric 3D snapshot of the current plan.</p>
      ${snapshotBlock}
    </section>

    <section class="proposal-section">
      <h2>CapEx ballpark</h2>
      <p class="proposal-section-lead">Hardware, installation, and deployment scope from the Sensei CAPEX estimator (±15%).</p>
      ${capexBlock}
    </section>

    <section class="proposal-section">
      <h2>Suggested monthly OpEx</h2>
      <p class="proposal-section-lead">Tiered SaaS pricing from selling area (€/m² per month).</p>
      ${opexBlock}
    </section>

    <section class="proposal-section">
      <h2>Top 10 qualification questions</h2>
      <p class="proposal-section-lead">Use these discovery items to strengthen deal qualification before commitment.</p>
      <ol class="proposal-question-list">${questionRows}</ol>
    </section>

    <footer class="proposal-report-footer">
      <p>Indicative figures for discussion — final scope confirmed after site survey and integration discovery.</p>
    </footer>
  </article>`;
}

function proposalReportPrintStyles() {
  return `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: Georgia, "Times New Roman", serif; color: #111; background: #fff; }
    .proposal-report { max-width: 820px; margin: 0 auto; }
    .proposal-report-kicker { margin: 0 0 4px; font: 600 0.72rem/1.2 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.12em; text-transform: uppercase; color: #666; }
    .proposal-report-title { margin: 0 0 8px; font-size: 1.85rem; }
    .proposal-report-meta { margin: 0 0 4px; font: 0.9rem/1.4 ui-sans-serif, system-ui, sans-serif; color: #444; }
    .proposal-report-calibration { margin: 10px 0 0; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font: 0.85rem/1.4 ui-sans-serif, system-ui, sans-serif; background: #faf8f0; }
    .proposal-section { margin-top: 28px; page-break-inside: avoid; }
    .proposal-section h2 { margin: 0 0 6px; font-size: 1.15rem; border-bottom: 1px solid #111; padding-bottom: 4px; }
    .proposal-section-lead { margin: 0 0 12px; font: 0.88rem/1.45 ui-sans-serif, system-ui, sans-serif; color: #555; }
    .proposal-snapshot { margin: 0; }
    .proposal-snapshot img { display: block; width: 100%; max-height: 340px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; background: #f6f6f6; }
    .proposal-metric-range { margin: 0 0 6px; font-size: 1.35rem; font-weight: 700; }
    .proposal-metric-mid, .proposal-metric-note { margin: 0 0 6px; font: 0.9rem/1.45 ui-sans-serif, system-ui, sans-serif; color: #333; }
    .proposal-question-list { margin: 0; padding: 0; list-style: none; }
    .proposal-question { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #e5e5e5; border-radius: 4px; page-break-inside: avoid; }
    .proposal-question-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 6px; font: 0.75rem/1.2 ui-sans-serif, system-ui, sans-serif; }
    .proposal-question-num { font-weight: 700; }
    .proposal-question-category { color: #555; }
    .proposal-risk { padding: 2px 6px; border-radius: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.68rem; }
    .proposal-risk-critical { background: #fde8e8; color: #9b1c1c; }
    .proposal-risk-high { background: #fff3e0; color: #b45309; }
    .proposal-risk-medium { background: #fff9db; color: #946200; }
    .proposal-risk-low { background: #edf7ed; color: #2f6b2f; }
    .proposal-question-text { margin: 0 0 6px; font-size: 0.95rem; line-height: 1.45; }
    .proposal-question-mitigation { margin: 0; font: 0.82rem/1.45 ui-sans-serif, system-ui, sans-serif; color: #555; }
    .proposal-report-footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #ddd; font: 0.78rem/1.4 ui-sans-serif, system-ui, sans-serif; color: #666; }
    @media print {
      body { padding: 0; }
      .proposal-section { page-break-inside: avoid; }
    }
  `;
}

function exportProposalReportPdf(reportHtml, title = "Proposal Approach") {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    alert("Allow pop-ups to export the PDF, then use Save as PDF in the print dialog.");
    return false;
  }
  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${proposalReportPrintStyles()}</style>
</head>
<body>${reportHtml}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  const triggerPrint = () => {
    printWindow.print();
  };
  if (printWindow.document.readyState === "complete") triggerPrint();
  else printWindow.addEventListener("load", triggerPrint);
  return true;
}

const PlannerProposalReport = {
  CAPEX_RANGE_FACTOR,
  capexRange,
  buildProposalReportData,
  renderProposalReportHtml,
  exportProposalReportPdf,
  proposalReportPrintStyles
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = PlannerProposalReport;
}
if (typeof globalThis !== "undefined") {
  globalThis.PlannerProposalReport = PlannerProposalReport;
}
