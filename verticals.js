const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "data", "verticals.json");

const SQFT_TO_SQM = 0.092903;

const DEFAULT_VERTICALS = {
  version: 1,
  updatedAt: new Date().toISOString(),
  verticals: {
    retail: {
      id: "retail",
      label: "Retail stores",
      tagline: "Autonomous convenience to hypermarket formats",
      description:
        "Walk-in / walk-out grocery and convenience retail. Optimize checkout throughput, shrink, labor coverage, refrigeration energy, and smart-store vision costs across footprints from kiosk to flagship.",
      footprint: {
        unit: "sqft",
        min: 40,
        max: 2500,
        default: 1200,
        sqmPerStaff: 35
      },
      plannerProfileHint: "medium",
      modelConstants: {
        daysPerMonth: 30,
        baseConversion: 0.42,
        averageItemsPerTransaction: 2.6,
        averageProductPrice: 4.8,
        fixedCostPerSqft: 18,
        fixedCostMinimum: 2800,
        laborCostPerPerson: 145,
        penaltyPerException: 16,
        downtimePenaltyAt0h: 0,
        downtimePenaltyAt12h: 1
      },
      defaultInput: {
        baseVisitors: 2400,
        peakLift: 28,
        queueTime: 38,
        restockTime: 20,
        exceptionRate: 4,
        staffCount: 8,
        energyComms: 1800,
        smartTechCost: 4200,
        downtimeHours: 0,
        footprintSqft: 1200
      },
      levers: {
        baseVisitors: { label: "Daily visitors (×30 monthly)", min: 200, max: 8000, step: 50 },
        peakLift: { label: "Peak hour uplift (%)", min: 5, max: 60, step: 1 },
        queueTime: { label: "Queue checkout time (sec)", min: 6, max: 240, step: 2 },
        restockTime: { label: "Shelf replenishment (min)", min: 2, max: 90, step: 1 },
        exceptionRate: { label: "Shrink / exception rate (%)", min: 0.5, max: 12, step: 0.1 },
        staffCount: { label: "Store personnel", min: 1, max: 40, step: 1 },
        energyComms: { label: "Energy & refrigeration (EUR/mo)", min: 400, max: 12000, step: 50 },
        smartTechCost: { label: "Smart store tech (EUR/mo)", min: 0, max: 35000, step: 250 },
        downtimeHours: { label: "Autonomous downtime (hours/mo)", min: 0, max: 12, step: 1 },
        footprintSqft: { label: "Selling area (sq ft)", min: 40, max: 2500, step: 10 }
      },
      costDrivers: [
        {
          activity: "Checkout throughput",
          lever: "queueTime",
          impact: "high",
          benefit: "Revenue ↑ · basket completion",
          impactMechanism: "Lower queueTime → higher queueEfficiency → more transactions × basket size in monthly revenue.",
          rationale: "Walk-out shoppers tolerate ~45s before abandoning; the model scales conversion down as checkout seconds rise.",
          optimize: "Reduce queue seconds to lift conversion and basket completion."
        },
        {
          activity: "Peak capture",
          lever: "peakLift",
          impact: "high",
          benefit: "Revenue ↑ · traffic multiplier",
          impactMechanism: "Higher peakLift amplifies dailyTransactions on top of baseVisitors for commuter burst windows.",
          rationale: "7–10 and 17–20 peaks carry disproportionate share of daily sales; missed peaks are lost same-day demand.",
          optimize: "Staffing and promo timing for commuter peaks (7–10, 17–20)."
        },
        {
          activity: "On-shelf availability",
          lever: "restockTime",
          impact: "medium",
          benefit: "Revenue ↑ · units sold",
          impactMechanism: "Shorter restockTime → higher restockEfficiency → more productsSold per transaction cycle.",
          rationale: "Top SKUs stock out silently; slower replenishment caps sell-through even when footfall is strong.",
          optimize: "Faster replenishment cycles reduce lost sales on top SKUs."
        },
        {
          activity: "Shrink & exceptions",
          lever: "exceptionRate",
          impact: "high",
          benefit: "Net value ↑ · penalty reduction",
          impactMechanism: "Lower exceptionRate × transactions × penaltyPerException directly cuts monthly exceptionPenalty.",
          rationale: "Vision misses and walk-outs are pure margin leakage; each unresolved exception carries a fixed EUR penalty.",
          optimize: "Vision AI and exception desk staffing cut walk-out losses."
        },
        {
          activity: "Labor model",
          lever: "staffCount",
          impact: "medium",
          benefit: "Net value ↔ · tradeoff",
          impactMechanism: "More staff lowers effective exceptionRate (mitigation) but raises staffingMonthlyCost in operatingCosts.",
          rationale: "Floor coverage suppresses shrink but payroll is the largest variable opex line after fixed occupancy.",
          optimize: "Balance floor coverage vs. payroll; ~1 FTE per 35 m² benchmark."
        },
        {
          activity: "Cold chain energy",
          lever: "energyComms",
          impact: "medium",
          benefit: "Net value ↑ · opex reduction",
          impactMechanism: "Lower energyComms subtracts directly from operatingCosts with no revenue trade-off in the model.",
          rationale: "Open-deck refrigeration and HVAC often exceed 15% of utilities in grocery autonomous formats.",
          optimize: "HVAC setpoints and night blinds on open decks."
        },
        {
          activity: "Autonomous stack",
          lever: "smartTechCost",
          impact: "medium",
          benefit: "Net value ↔ · capability vs. opex",
          impactMechanism: "Higher smartTechCost adds monthly opex; value comes indirectly via lower queueTime and exceptionRate in real ops.",
          rationale: "Over-provisioned vision, gates, and edge compute erode margin on small-footprint stores.",
          optimize: "Right-size vision, gates, and edge compute for format."
        },
        {
          activity: "Selling footprint",
          lever: "footprintSqft",
          impact: "medium",
          benefit: "Net value ↔ · scale economics",
          impactMechanism: "Larger footprintSqft raises baseFixedMonthlyCosts (sq ft × rate) but enables higher traffic and assortment scenarios.",
          rationale: "Fixed rent and fit-out scale with area; formats below minimum sq ft carry a cost floor in the model.",
          optimize: "Match selling area to catchment demand — avoid oversizing fixed occupancy."
        },
        {
          activity: "Autonomous uptime",
          lever: "downtimeHours",
          impact: "high",
          benefit: "Revenue protection · downtime penalty",
          impactMechanism: "Each downtime hour adds linear downtimePenalty as a % of monthly revenue (0h→0%, 12h→100%).",
          rationale: "Gate or vision outages halt walk-out entirely; even short outages during peak destroy same-day net value.",
          optimize: "Redundant edge nodes and proactive gate maintenance to stay near 0h downtime."
        }
      ],
      operationalNotes: [
        "Footprint scales fixed occupancy costs and suggests staffing benchmarks.",
        "Queue friction is the primary conversion lever for autonomous checkout.",
        "Cold + ambient energy typically dominates utilities in grocery formats.",
        "Downtime penalty scales linearly from 0h to 12h (0%→100% of revenue)."
      ]
    },
    pharmacy: {
      id: "pharmacy",
      label: "Autonomous pharmacies",
      tagline: "Regulated dispensing with minimal counter time",
      description:
        "OTC plus prescription pickup with robotic dispensing and pharmacist verification. Optimize verification latency, Rx exceptions, consult minutes, cold chain, and formulary accuracy.",
      footprint: {
        unit: "sqft",
        min: 200,
        max: 1800,
        default: 650,
        sqmPerStaff: 28
      },
      plannerProfileHint: "small",
      modelConstants: {
        daysPerMonth: 30,
        baseConversion: 0.36,
        averageItemsPerTransaction: 1.8,
        averageProductPrice: 18.5,
        fixedCostPerSqft: 32,
        fixedCostMinimum: 6200,
        laborCostPerPerson: 185,
        penaltyPerException: 28,
        downtimePenaltyAt0h: 0,
        downtimePenaltyAt12h: 1
      },
      defaultInput: {
        baseVisitors: 680,
        peakLift: 22,
        queueTime: 52,
        restockTime: 35,
        exceptionRate: 2.8,
        staffCount: 4,
        energyComms: 2400,
        smartTechCost: 8500,
        downtimeHours: 0,
        footprintSqft: 650
      },
      levers: {
        baseVisitors: { label: "Daily patient/visitor visits (×30)", min: 120, max: 2200, step: 20 },
        peakLift: { label: "After-work Rx rush uplift (%)", min: 5, max: 45, step: 1 },
        queueTime: { label: "Verification & pickup time (sec)", min: 10, max: 300, step: 2 },
        restockTime: { label: "Formulary refill cycle (min)", min: 5, max: 120, step: 1 },
        exceptionRate: { label: "Rx / compliance exceptions (%)", min: 0.2, max: 8, step: 0.1 },
        staffCount: { label: "Pharmacist + tech staff", min: 2, max: 12, step: 1 },
        energyComms: { label: "Cold chain & HVAC (EUR/mo)", min: 800, max: 8000, step: 50 },
        smartTechCost: { label: "Dispensing automation (EUR/mo)", min: 2000, max: 45000, step: 500 },
        downtimeHours: { label: "Dispenser downtime (hours/mo)", min: 0, max: 12, step: 1 },
        footprintSqft: { label: "Dispensary area (sq ft)", min: 200, max: 1800, step: 10 }
      },
      costDrivers: [
        {
          activity: "Rx verification",
          lever: "queueTime",
          impact: "high",
          benefit: "Revenue ↑ · pickup conversion",
          impactMechanism: "Lower queueTime → higher queueEfficiency → more completed Rx pickups and OTC attach per visitor.",
          rationale: "Patients abandon pickup when verification queues exceed a few minutes; wait time replaces classic checkout friction.",
          optimize: "Parallel verification queues and pre-pack staging cut wait."
        },
        {
          activity: "Regulatory exceptions",
          lever: "exceptionRate",
          impact: "high",
          benefit: "Net value ↑ · penalty reduction",
          impactMechanism: "Lower exceptionRate × transactions × penaltyPerException (EUR 28 each) cuts exceptionPenalty sharply.",
          rationale: "Rx rework, DUR failures, and compliance fines cost far more per incident than grocery shrink.",
          optimize: "Barcode validation and DUR checks reduce rework fines."
        },
        {
          activity: "Consult & counseling",
          lever: "staffCount",
          impact: "medium",
          benefit: "Net value ↔ · compliance vs. payroll",
          impactMechanism: "More pharmacist staff mitigates exceptions faster but adds staffingMonthlyCost at EUR 185/day per FTE.",
          rationale: "Mandatory consult minutes are non-deferrable; understaffing creates regulatory risk and queue spillover.",
          optimize: "Tele-pharmacist coverage for off-peak consult demand."
        },
        {
          activity: "Cold chain integrity",
          lever: "energyComms",
          impact: "high",
          benefit: "Net value ↑ · spoilage & compliance",
          impactMechanism: "Lower energyComms reduces operatingCosts; stable cold chain prevents stock write-offs modeled via exceptionRate.",
          rationale: "Vaccine and biologic fridges require 24/7 monitoring; energy failures trigger mandatory product destruction.",
          optimize: "Monitor vaccine fridges; alarm-linked redundancy."
        },
        {
          activity: "Formulary accuracy",
          lever: "restockTime",
          impact: "medium",
          benefit: "Revenue ↑ · script fulfillment",
          impactMechanism: "Shorter restockTime → higher restockEfficiency → fewer out-of-stock scripts and lost refill revenue.",
          rationale: "Generic PAR gaps cause patients to transfer; refill cycles are predictable and automatable.",
          optimize: "Automated PAR levels for high-turn generics."
        },
        {
          activity: "Automation lease",
          lever: "smartTechCost",
          impact: "high",
          benefit: "Net value ↔ · throughput vs. lease",
          impactMechanism: "smartTechCost is pure monthly opex; robots enable lower queueTime only when capacity matches script volume.",
          rationale: "Dispensing robots sized for peak spike carry idle lease cost off-peak; right-sizing is the main ROI lever.",
          optimize: "Match robot capacity to script volume, not peak spike."
        },
        {
          activity: "Dispensary footprint",
          lever: "footprintSqft",
          impact: "medium",
          benefit: "Net value ↔ · fixed cost base",
          impactMechanism: "footprintSqft × EUR 32/sq ft (min EUR 6,200) sets baseFixedMonthlyCosts before automation and staff.",
          rationale: "Pharmacy fixed costs are higher per sq ft than retail due to clean-room and cold storage requirements.",
          optimize: "Compact layouts with robot storage density reduce occupancy without capping script capacity."
        },
        {
          activity: "Dispenser uptime",
          lever: "downtimeHours",
          impact: "high",
          benefit: "Revenue protection · downtime penalty",
          impactMechanism: "downtimeHours scale linearly to downtimePenalty as % of monthly revenue — halts all autonomous pickup.",
          rationale: "Robot or gate failure blocks every script; patients reroute to competitors within the same day.",
          optimize: "Preventive maintenance windows off-peak; hot-swap robot modules."
        }
      ],
      operationalNotes: [
        "Higher basket value but lower traffic vs. grocery; exceptions are costlier.",
        "Verification time replaces classic checkout queue in the model.",
        "Staff mitigates exceptions more aggressively (pharmacist oversight).",
        "Automation cost is modeled as monthly opex, not CAPEX amortization."
      ]
    },
    cinema_fb: {
      id: "cinema_fb",
      label: "Cinema F&B",
      tagline: "Concession rush aligned to showtimes",
      description:
        "Lobby concessions and grab-and-go for cinema circuits. Optimize pre-show rush, order prep time, order accuracy, spoilage, and showtime-aligned labor.",
      footprint: {
        unit: "sqft",
        min: 400,
        max: 3000,
        default: 900,
        sqmPerStaff: 32
      },
      plannerProfileHint: "medium",
      modelConstants: {
        daysPerMonth: 30,
        baseConversion: 0.55,
        averageItemsPerTransaction: 2.2,
        averageProductPrice: 8.5,
        fixedCostPerSqft: 22,
        fixedCostMinimum: 4800,
        laborCostPerPerson: 125,
        penaltyPerException: 9,
        downtimePenaltyAt0h: 0,
        downtimePenaltyAt12h: 1
      },
      defaultInput: {
        baseVisitors: 3200,
        peakLift: 48,
        queueTime: 28,
        restockTime: 12,
        exceptionRate: 5.5,
        staffCount: 10,
        energyComms: 2200,
        smartTechCost: 2800,
        downtimeHours: 0,
        footprintSqft: 900
      },
      levers: {
        baseVisitors: { label: "Daily guest visits (×30)", min: 400, max: 12000, step: 50 },
        peakLift: { label: "Pre-show rush uplift (%)", min: 10, max: 80, step: 1 },
        queueTime: { label: "Order-to-handoff time (sec)", min: 5, max: 180, step: 2 },
        restockTime: { label: "Prep station turnaround (min)", min: 1, max: 45, step: 1 },
        exceptionRate: { label: "Order error & waste rate (%)", min: 1, max: 15, step: 0.1 },
        staffCount: { label: "Concession crew", min: 3, max: 30, step: 1 },
        energyComms: { label: "Equipment & HVAC (EUR/mo)", min: 600, max: 9000, step: 50 },
        smartTechCost: { label: "Kiosk & order tech (EUR/mo)", min: 0, max: 20000, step: 250 },
        downtimeHours: { label: "POS / kiosk downtime (hours/mo)", min: 0, max: 12, step: 1 },
        footprintSqft: { label: "Concession footprint (sq ft)", min: 400, max: 3000, step: 25 }
      },
      costDrivers: [
        {
          activity: "Pre-show rush",
          lever: "peakLift",
          impact: "high",
          benefit: "Revenue ↑ · showtime multiplier",
          impactMechanism: "Higher peakLift amplifies transactions in the 30–45 min pre-show window on top of baseVisitors.",
          rationale: "Concession revenue clusters around showtimes; flat staffing during rush leaves demand uncaptured.",
          optimize: "Stagger upsells and mobile pre-order to flatten peaks."
        },
        {
          activity: "Order prep speed",
          lever: "queueTime",
          impact: "high",
          benefit: "Revenue ↑ · orders completed",
          impactMechanism: "Lower queueTime → higher queueEfficiency → more guests served before auditorium doors close.",
          rationale: "Guests who miss the trailer rarely return mid-film; handoff seconds directly cap conversion.",
          optimize: "Batch popcorn/drink prep before trailer drop."
        },
        {
          activity: "Station replenishment",
          lever: "restockTime",
          impact: "medium",
          benefit: "Revenue ↑ · prep throughput",
          impactMechanism: "Shorter restockTime → higher restockEfficiency → faster prep-line turnaround between rushes.",
          rationale: "Empty warmers during pre-show are lost upsell minutes; prep turnaround is the availability lever here.",
          optimize: "Prep-line par levels tied to showtime schedule."
        },
        {
          activity: "Order accuracy & waste",
          lever: "exceptionRate",
          impact: "high",
          benefit: "Net value ↑ · waste & remake cost",
          impactMechanism: "Lower exceptionRate × transactions × penaltyPerException (EUR 9) reduces spoilage and remake penalties.",
          rationale: "Wrong combo orders become waste plus remake labor; accuracy is margin in high-spoil categories.",
          optimize: "Kiosk confirmation screens reduce remakes and spoilage."
        },
        {
          activity: "Showtime labor",
          lever: "staffCount",
          impact: "high",
          benefit: "Net value ↔ · speed vs. payroll",
          impactMechanism: "More crew lowers queueTime indirectly in ops but raises staffingMonthlyCost at EUR 125/day per FTE.",
          rationale: "Roster to seat count and show schedule, not average hourly traffic — peaks are binary per showtime.",
          optimize: "Roster to seat count, not average hourly traffic."
        },
        {
          activity: "Equipment energy",
          lever: "energyComms",
          impact: "low",
          benefit: "Net value ↑ · opex reduction",
          impactMechanism: "Lower energyComms subtracts directly from operatingCosts between show cycles.",
          rationale: "Popcorn warmers and compressors idle between shows; scheduling off-cycles saves without touching revenue levers.",
          optimize: "Warmers off between cycles; idle compressor tuning."
        },
        {
          activity: "Concession footprint",
          lever: "footprintSqft",
          impact: "medium",
          benefit: "Net value ↔ · capacity vs. rent",
          impactMechanism: "footprintSqft × EUR 22/sq ft (min EUR 4,800) drives baseFixedMonthlyCosts for lobby concession area.",
          rationale: "Lobby depth limits queue depth; oversized footprint adds rent without adding pre-show throughput.",
          optimize: "Design for queue depth and prep stations, not display area alone."
        },
        {
          activity: "POS / kiosk uptime",
          lever: "downtimeHours",
          impact: "high",
          benefit: "Revenue protection · downtime penalty",
          impactMechanism: "downtimeHours apply linear downtimePenalty on monthly revenue — critical during pre-show windows.",
          rationale: "Kiosk outage during a sold-out premiere is irrecoverable; guests buy nothing once seated.",
          optimize: "Dual POS paths and offline kiosk fallback for peak shows."
        }
      ],
      operationalNotes: [
        "Peak uplift is typically higher than retail due to showtime clustering.",
        "Restock lever models prep-station turnaround, not shelf facing.",
        "Waste from wrong orders is captured in the exception rate penalty.",
        "Mobile pre-order can be explored by lowering queueTime in scenarios."
      ]
    },
    bakery: {
      id: "bakery",
      label: "Smart bakeries",
      tagline: "Fresh production aligned to morning peaks",
      description:
        "Smart bakery with bake-to-demand and grab-and-go. Optimize batch timing, display replenishment, freshness waste, morning peak capture, and production labor.",
      footprint: {
        unit: "sqft",
        min: 150,
        max: 1200,
        default: 450,
        sqmPerStaff: 22
      },
      plannerProfileHint: "small",
      modelConstants: {
        daysPerMonth: 30,
        baseConversion: 0.48,
        averageItemsPerTransaction: 1.8,
        averageProductPrice: 5.2,
        fixedCostPerSqft: 24,
        fixedCostMinimum: 3600,
        laborCostPerPerson: 135,
        penaltyPerException: 7,
        downtimePenaltyAt0h: 0,
        downtimePenaltyAt12h: 1
      },
      defaultInput: {
        baseVisitors: 1100,
        peakLift: 38,
        queueTime: 22,
        restockTime: 18,
        exceptionRate: 6.2,
        staffCount: 5,
        energyComms: 1600,
        smartTechCost: 3200,
        downtimeHours: 0,
        footprintSqft: 450
      },
      levers: {
        baseVisitors: { label: "Daily customer visits (×30)", min: 150, max: 3500, step: 25 },
        peakLift: { label: "Morning / lunch peak uplift (%)", min: 8, max: 65, step: 1 },
        queueTime: { label: "Counter handoff time (sec)", min: 5, max: 120, step: 2 },
        restockTime: { label: "Display replenishment (min)", min: 2, max: 60, step: 1 },
        exceptionRate: { label: "Freshness waste & markdown (%)", min: 2, max: 18, step: 0.1 },
        staffCount: { label: "Bakers + front staff", min: 2, max: 16, step: 1 },
        energyComms: { label: "Ovens & HVAC (EUR/mo)", min: 500, max: 6000, step: 50 },
        smartTechCost: { label: "Production IoT & forecasting (EUR/mo)", min: 0, max: 15000, step: 250 },
        downtimeHours: { label: "Production line downtime (hours/mo)", min: 0, max: 12, step: 1 },
        footprintSqft: { label: "Bakery footprint (sq ft)", min: 150, max: 1200, step: 10 }
      },
      costDrivers: [
        {
          activity: "Bake batch alignment",
          lever: "restockTime",
          impact: "high",
          benefit: "Revenue ↑ · display availability",
          impactMechanism: "Shorter restockTime → higher restockEfficiency → fewer gaps between bake batches on display.",
          rationale: "Mid-morning display gaps lose impulse purchases; batch timing is the bakery equivalent of shelf availability.",
          optimize: "Demand forecasting cuts over-bake and midday gaps."
        },
        {
          activity: "Morning peak capture",
          lever: "peakLift",
          impact: "high",
          benefit: "Revenue ↑ · peak multiplier",
          impactMechanism: "Higher peakLift amplifies dailyTransactions during 7–9am and lunch windows on baseVisitors.",
          rationale: "Fresh-baked demand is time-boxed; missed morning peak cannot be recovered later in the day.",
          optimize: "Pre-open staging and app pre-orders for 7–9am."
        },
        {
          activity: "Counter speed",
          lever: "queueTime",
          impact: "medium",
          benefit: "Revenue ↑ · throughput",
          impactMechanism: "Lower queueTime → higher queueEfficiency → more combo purchases completed per peak hour.",
          rationale: "Coffee + pastry combos need fast handoff; queue friction caps attach rate on high-frequency visits.",
          optimize: "Self-checkout kiosks for coffee + pastry combos."
        },
        {
          activity: "Freshness waste",
          lever: "exceptionRate",
          impact: "high",
          benefit: "Net value ↑ · markdown reduction",
          impactMechanism: "Lower exceptionRate × transactions × penaltyPerException (EUR 7) models less freshness waste and markdown.",
          rationale: "Unsold fresh product is the primary margin leak; waste rate often exceeds retail shrink percentages.",
          optimize: "Markdown automation and donation routing reduce write-offs."
        },
        {
          activity: "Production labor",
          lever: "staffCount",
          impact: "medium",
          benefit: "Net value ↔ · coverage vs. payroll",
          impactMechanism: "More bakers/front staff improve restockTime and exceptionRate in ops but raise staffingMonthlyCost.",
          rationale: "Cross-trained staff cover morning peak and production; understaffing shows up as waste and empty display.",
          optimize: "Cross-train bakers for front coverage in peaks."
        },
        {
          activity: "Oven energy profile",
          lever: "energyComms",
          impact: "medium",
          benefit: "Net value ↑ · opex reduction",
          impactMechanism: "Lower energyComms subtracts from operatingCosts; smart scheduling avoids continuous full-bake mode.",
          rationale: "Oven energy is a high fixed draw relative to bakery revenue, especially on smaller footprints.",
          optimize: "Smart oven scheduling vs. continuous full bake."
        },
        {
          activity: "Production IoT",
          lever: "smartTechCost",
          impact: "medium",
          benefit: "Net value ↔ · forecast accuracy vs. opex",
          impactMechanism: "smartTechCost adds monthly opex; ROI appears as lower exceptionRate and restockTime in operations.",
          rationale: "Forecasting IoT pays off only when bake batches track demand curves, not when running full capacity blindly.",
          optimize: "Link IoT spend to batch-size optimization, not hardware alone."
        },
        {
          activity: "Bakery footprint",
          lever: "footprintSqft",
          impact: "medium",
          benefit: "Net value ↔ · production scale",
          impactMechanism: "footprintSqft × EUR 24/sq ft (min EUR 3,600) sets baseFixedMonthlyCosts for production + retail area.",
          rationale: "Oven and display need minimum area; oversized footprint raises rent without proportional morning peak capture.",
          optimize: "Right-size production cell to peak batch volume, not average day."
        },
        {
          activity: "Production line uptime",
          lever: "downtimeHours",
          impact: "high",
          benefit: "Revenue protection · downtime penalty",
          impactMechanism: "downtimeHours scale linearly to downtimePenalty — oven or POS outage halts sales and production.",
          rationale: "A down oven at 6:30am eliminates the highest-margin daypart entirely.",
          optimize: "Redundant proofers and AM maintenance windows before open."
        }
      ],
      operationalNotes: [
        "Exception rate primarily models freshness waste and markdown loss.",
        "Replenishment lever reflects display gaps between bake batches.",
        "IoT forecasting spend is captured in smart tech monthly cost.",
        "Smaller footprints still carry high oven energy relative to revenue."
      ]
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

function mergeCostDrivers(baseDrivers, savedDrivers) {
  if (!Array.isArray(savedDrivers)) return baseDrivers;
  return baseDrivers.map((def) => {
    const match = savedDrivers.find((s) => s.lever === def.lever && s.activity === def.activity);
    return match ? { ...def, ...match } : def;
  });
}

function normalizeVerticals(input) {
  const base = structuredClone(DEFAULT_VERTICALS);
  if (!input || typeof input !== "object") return base;

  base.version = input.version || 1;
  base.updatedAt = input.updatedAt || new Date().toISOString();

  Object.keys(base.verticals).forEach((id) => {
    if (input.verticals?.[id]) {
      const src = input.verticals[id];
      const { costDrivers: savedCostDrivers, operationalNotes: savedNotes, ...srcRest } = src;
      base.verticals[id] = {
        ...base.verticals[id],
        ...srcRest,
        footprint: { ...base.verticals[id].footprint, ...(src.footprint || {}) },
        modelConstants: { ...base.verticals[id].modelConstants, ...(src.modelConstants || {}) },
        defaultInput: { ...base.verticals[id].defaultInput, ...(src.defaultInput || {}) },
        levers: { ...base.verticals[id].levers, ...(src.levers || {}) }
      };
      if (Array.isArray(savedCostDrivers)) {
        base.verticals[id].costDrivers = mergeCostDrivers(
          DEFAULT_VERTICALS.verticals[id].costDrivers,
          savedCostDrivers
        );
      }
      if (Array.isArray(savedNotes)) base.verticals[id].operationalNotes = savedNotes;
    }
  });

  return base;
}

function loadVerticals() {
  ensureDataDir();
  if (!fs.existsSync(DATA_PATH)) {
    saveVerticals(DEFAULT_VERTICALS);
    return structuredClone(DEFAULT_VERTICALS);
  }
  try {
    return normalizeVerticals(JSON.parse(fs.readFileSync(DATA_PATH, "utf8")));
  } catch (_error) {
    saveVerticals(DEFAULT_VERTICALS);
    return structuredClone(DEFAULT_VERTICALS);
  }
}

function saveVerticals(config) {
  ensureDataDir();
  const normalized = normalizeVerticals(config);
  normalized.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function getVertical(config, verticalId) {
  return config.verticals[verticalId] || null;
}

function resolveModelConstants(vertical, input) {
  const mc = vertical.modelConstants;
  const footprintSqft = clamp(
    Number(input.footprintSqft ?? vertical.defaultInput.footprintSqft ?? vertical.footprint.default),
    vertical.footprint.min,
    vertical.footprint.max
  );
  const baseFixedMonthlyCosts = Math.max(
    mc.fixedCostMinimum || 0,
    footprintSqft * (mc.fixedCostPerSqft || 0)
  );

  return {
    daysPerMonth: mc.daysPerMonth,
    baseConversion: mc.baseConversion,
    averageItemsPerTransaction: mc.averageItemsPerTransaction,
    averageProductPrice: mc.averageProductPrice,
    baseFixedMonthlyCosts,
    laborCostPerPerson: mc.laborCostPerPerson,
    penaltyPerException: mc.penaltyPerException,
    downtimePenaltyAt0h: mc.downtimePenaltyAt0h,
    downtimePenaltyAt12h: mc.downtimePenaltyAt12h,
    footprintSqft
  };
}

function computeForecast(input, verticalId = "retail", config = null) {
  const catalog = config || loadVerticals();
  const vertical = getVertical(catalog, verticalId) || catalog.verticals.retail;
  const modelConstants = resolveModelConstants(vertical, input);

  const peakTrafficFactor = 1 + input.peakLift / 100;
  const queueEfficiency = clamp(1.34 - input.queueTime / 190, 0.42, 1.22);
  const restockEfficiency = clamp(1.26 - input.restockTime / 120, 0.58, 1.19);
  const staffExceptionMitigation = clamp(input.staffCount * 0.042, 0, 0.68);

  const effectiveConversion = modelConstants.baseConversion * queueEfficiency;
  const dailyTransactions = input.baseVisitors * peakTrafficFactor * effectiveConversion;
  const dailyProductsSold = dailyTransactions * modelConstants.averageItemsPerTransaction * restockEfficiency;
  const dailyRevenue = dailyProductsSold * modelConstants.averageProductPrice;

  const effectiveExceptionRate = (input.exceptionRate / 100) * (1 - staffExceptionMitigation);
  const dailyExceptionVolume = dailyTransactions * effectiveExceptionRate;
  const dailyExceptionPenalty = dailyExceptionVolume * modelConstants.penaltyPerException;

  const transactions = dailyTransactions * modelConstants.daysPerMonth;
  const productsSold = dailyProductsSold * modelConstants.daysPerMonth;
  const revenue = dailyRevenue * modelConstants.daysPerMonth;
  const exceptionVolume = dailyExceptionVolume * modelConstants.daysPerMonth;
  const exceptionPenalty = dailyExceptionPenalty * modelConstants.daysPerMonth;

  const staffingMonthlyCost = input.staffCount * modelConstants.laborCostPerPerson * modelConstants.daysPerMonth;
  const operatingCosts =
    modelConstants.baseFixedMonthlyCosts + staffingMonthlyCost + input.energyComms + input.smartTechCost;
  const downtimePenaltyRate =
    modelConstants.downtimePenaltyAt0h +
    (input.downtimeHours / 12) * (modelConstants.downtimePenaltyAt12h - modelConstants.downtimePenaltyAt0h);
  const downtimePenalty =
    revenue * clamp(downtimePenaltyRate, modelConstants.downtimePenaltyAt0h, modelConstants.downtimePenaltyAt12h);
  const netValue = revenue - (operatingCosts + exceptionPenalty + downtimePenalty);
  const netMargin = revenue > 0 ? netValue / revenue : 0;

  return {
    verticalId: vertical.id,
    transactions,
    productsSold,
    revenue,
    exceptionVolume,
    exceptionPenalty,
    downtimePenalty,
    downtimePenaltyRate,
    operatingCosts,
    staffingMonthlyCost,
    fixedOccupancyCosts: modelConstants.baseFixedMonthlyCosts,
    netValue,
    netMargin
  };
}

function listVerticalsForClient(config) {
  return Object.values(config.verticals).map((vertical) => ({
    id: vertical.id,
    label: vertical.label,
    tagline: vertical.tagline,
    description: vertical.description,
    footprint: vertical.footprint,
    plannerProfileHint: vertical.plannerProfileHint,
    defaultInput: vertical.defaultInput,
    levers: vertical.levers,
    costDrivers: vertical.costDrivers,
    operationalNotes: vertical.operationalNotes,
    modelConstants: vertical.modelConstants
  }));
}

const OPPORTUNITY_TEMPLATES = {
  retail: [
    { name: "Cut queue time 20%", tweak: (x) => ({ ...x, queueTime: Math.max(6, x.queueTime * 0.8) }) },
    { name: "Faster shelf replenishment (−25%)", tweak: (x) => ({ ...x, restockTime: Math.max(2, x.restockTime * 0.75) }) },
    { name: "Capture +10 pts peak traffic", tweak: (x) => ({ ...x, peakLift: Math.min(60, x.peakLift + 10) }) },
    { name: "Reduce shrink 1.5 pts", tweak: (x) => ({ ...x, exceptionRate: Math.max(0.5, x.exceptionRate - 1.5) }) },
    { name: "Trim refrigeration spend 15%", tweak: (x) => ({ ...x, energyComms: Math.max(400, x.energyComms * 0.85) }) }
  ],
  pharmacy: [
    { name: "Cut verification time 20%", tweak: (x) => ({ ...x, queueTime: Math.max(10, x.queueTime * 0.8) }) },
    { name: "Reduce Rx exceptions 1 pt", tweak: (x) => ({ ...x, exceptionRate: Math.max(0.2, x.exceptionRate - 1) }) },
    { name: "Faster formulary refill (−20%)", tweak: (x) => ({ ...x, restockTime: Math.max(5, x.restockTime * 0.8) }) },
    { name: "Add 1 pharmacist for peak", tweak: (x) => ({ ...x, staffCount: Math.min(12, x.staffCount + 1) }) },
    { name: "Optimize cold chain spend 12%", tweak: (x) => ({ ...x, energyComms: Math.max(800, x.energyComms * 0.88) }) }
  ],
  cinema_fb: [
    { name: "Cut order time 20%", tweak: (x) => ({ ...x, queueTime: Math.max(5, x.queueTime * 0.8) }) },
    { name: "Prep stations 25% faster", tweak: (x) => ({ ...x, restockTime: Math.max(1, x.restockTime * 0.75) }) },
    { name: "Capture +12 pts pre-show rush", tweak: (x) => ({ ...x, peakLift: Math.min(80, x.peakLift + 12) }) },
    { name: "Cut order errors 2 pts", tweak: (x) => ({ ...x, exceptionRate: Math.max(1, x.exceptionRate - 2) }) },
    { name: "Add 2 crew for peak shows", tweak: (x) => ({ ...x, staffCount: Math.min(30, x.staffCount + 2) }) }
  ],
  bakery: [
    { name: "Cut display gaps 25%", tweak: (x) => ({ ...x, restockTime: Math.max(2, x.restockTime * 0.75) }) },
    { name: "Reduce waste 2 pts", tweak: (x) => ({ ...x, exceptionRate: Math.max(2, x.exceptionRate - 2) }) },
    { name: "Morning peak +10 pts", tweak: (x) => ({ ...x, peakLift: Math.min(65, x.peakLift + 10) }) },
    { name: "Faster counter 20%", tweak: (x) => ({ ...x, queueTime: Math.max(5, x.queueTime * 0.8) }) },
    { name: "Oven energy −15%", tweak: (x) => ({ ...x, energyComms: Math.max(500, x.energyComms * 0.85) }) }
  ]
};

function evaluateOpportunities(baseInput, baseNetValue, verticalId, config = null) {
  const catalog = config || loadVerticals();
  const templates = OPPORTUNITY_TEMPLATES[verticalId] || OPPORTUNITY_TEMPLATES.retail;

  return templates
    .map((item) => {
      const forecast = computeForecast(item.tweak({ ...baseInput }), verticalId, catalog);
      return { label: item.name, uplift: forecast.netValue - baseNetValue };
    })
    .sort((a, b) => b.uplift - a.uplift)
    .slice(0, 3);
}

module.exports = {
  DATA_PATH,
  DEFAULT_VERTICALS,
  SQFT_TO_SQM,
  loadVerticals,
  saveVerticals,
  getVertical,
  resolveModelConstants,
  computeForecast,
  listVerticalsForClient,
  evaluateOpportunities,
  normalizeVerticals
};
