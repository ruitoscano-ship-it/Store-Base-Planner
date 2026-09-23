# Recreate: Store Base Operations

Copy everything below the line into Claude Code. If this repo (or the deploy zip) is already on disk, tell Claude to treat `README.md` as canonical and implement against the existing file layout rather than inventing a new stack.

---

You are rebuilding **Store Base Operations**: a Smart Store value-realization simulator and 3D store planner for Sensei retail deployments.

## Source of truth

1. Read **`README.md` first**. Follow its Applications table, Requirements, Production deployment, API overview, Architecture, Security notes, and Calibration sections exactly.
2. Match the architecture block in the README — do not introduce a frontend framework, bundler, or npm runtime dependencies.
3. If source files already exist in the workspace, extend/port them; do not replace the stack.

## What the product does

Sensei sales and ops teams use this to:

- **Simulate monthly business value** of autonomous (walk-in / walk-out) retail by vertical.
- **Plan a store in 2D and 3D**, drop fixtures, estimate hardware **CapEx** (Sensei Setup Calculator rules) and **SaaS OpEx**, and export a **Proposal Approach** PDF-style report.
- **Run an occupancy simulation** (shoppers enter, grab products, checkout, leave) with KPIs including value generated from an editable average basket price.
- **Administer** store profiles, fixture dimensions, Sensei pricing defaults, and verticals from a Backoffice.

## Stack constraints (non-negotiable)

- **Node.js ≥ 18**, **zero npm dependencies** (`package.json` scripts only: `dev` = `node server.js`, `start` = `NODE_ENV=production node server.js`).
- Plain HTML + CSS + vanilla JS. Shared look: cream canvas, black type, pale-yellow highlights — `workbench.css` plus page CSS.
- Planner CDNs: Fabric.js 5.3, Three.js 0.160 (import map), PDF.js 3.11.
- Optional 3D assets: none required — fixtures are procedural Three.js meshes.
- Env via `.env` / `.env.example`: `NODE_ENV`, `HOST`, `PORT`, `ADMIN_TOKEN`, `CORS_ORIGIN`, `MAX_BODY_BYTES`.
- Docker: `node:20-alpine`, copy HTML/CSS/JS/`data`, `VOLUME ["/app/data"]`, healthcheck `GET /api/health`.

## Four applications

| URL | File | Purpose |
|-----|------|---------|
| `/` | `index.html` + `index-page.css` | Value simulator |
| `/planner.html` | `planner.html` + `planner-page.css` + `planner-*.js` | Layout, 3D, sim, CapEx/SaaS, proposal |
| `/backoffice.html` | `backoffice.html` | Admin: profiles, fixtures, Sensei defaults, verticals |
| `/Setup_Calculator.html` | standalone | Sensei setup calculator (Portuguese) |

### 1. Simulator (`/`)

- Verticals from `GET /api/verticals`: **retail**, **pharmacy**, **cinema_fb**, **bakery**.
- Levers: footprint (sq ft), daily visitors, peak lift, queue time, restock, exception rate, staff, energy/comms, smart-tech cost, downtime.
- `POST /api/forecast` returns monthly revenue, operating costs, net value, opportunities.
- Tabs including **Discovery Questions Tracker** (10 qualification questions used again in the planner proposal report).
- Currency EUR, period monthly. Persist UI state in localStorage.

### 2. Planner (`/planner.html`)

**Canvas:** Fabric.js 2D plan; meters; grid; drag/rotate fixtures; snap 1 m `separator-wall` segments.

**Views:** 2D Plan · 3D View · Simulation. 3D: isometric/perspective, walk (WASD + collision), ceiling camera grid ~3 m, FOV cones, procedural fixture meshes only. Active toolbar buttons: **black text on pale-yellow**, never white-on-white.

**Baselines:** Small / Medium / Large / X-Large / Bespoke (from store profiles API).

**Prefabs (hardcoded layouts in `planner-app.js`):**

- Base pod, Pod 2 — compact grab-and-go
- Cinema Bar
- Base supermarket
- Base Food Serving
- 12K supermarket — 40×30 m
- Pharmacy — 15.5×10 m, back-wall “PHARMACY” sign (white on mint `#b8e0d2`)
- **Gas Station Conv** — **10×6 m (~60 m²)** so Sensei CapEx stays ~**€65K** (single server; >~61 m² jumps to ~€115K). Layout: 4 back-wall coolers, 2 island gondolas, L-shaped pastry/POS, right-wall ambient + coffee, 2 front doors.

**CapEx:** `planner-sensei-cost.js` + `data/sensei-setup-assumptions.json`. Counts: gondolas, cold, hot, islands, produce, service/stations; doors = entries + checkouts.

**SaaS OpEx:** `planner-saas-cost.js` — tiered €/m²/month from selling area (defaults: 15–60→€16, 60–200→€14, 200–400→€12, 400–800→€10, 800–1200→€7, >1200→€5). Editable overrides + reset.

**Price calibration:** Healthy when **CapEx < 3 × annual SaaS** (monthly SaaS × 12). UI: Healthy / Review pricing / Pending.

**Proposal Approach:** Button after calibration. Preview modal then Export PDF (hidden iframe print → Save as PDF; no `window.open(..., "noopener")`). Report: isometric 3D snapshot; CapEx ±15%; monthly SaaS OpEx; the **same 10 discovery questions** as the simulator.

**Simulation KPIs:** people in store, avg dwell, product grabs, avg basket size, people exiting, **editable avg basket value (€)** → **value generated** = exits × basket value. Re-entry off by default (cohort run ends when all leave). Persist basket price with session.

**Full reset:** Clears canvas, blueprint, 20×20 m, costs, SaaS rates, sim prefs, localStorage — with confirm.

**Export/import:** PNG, SVG, plan JSON, session JSON, 3D snapshot, templates. Blueprint PDF/PNG inferred **client-side only**.

### 3. Backoffice

Edit store profiles, artifact dimensions, Sensei defaults/overrides, verticals. Writes require `ADMIN_TOKEN` (`PUT /api/store-profiles`, `PUT /api/verticals`).

## HTTP API (match README)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | — |
| GET | `/api/verticals` | — |
| GET | `/api/verticals/:id` | — |
| PUT | `/api/verticals` | Admin |
| GET | `/api/store-profiles` | — |
| PUT | `/api/store-profiles` | Admin |
| GET | `/api/store-profiles/:id/sourcing` | — |
| GET | `/api/sensei-assumptions` | — |
| POST | `/api/planner/estimate` | — |
| POST | `/api/forecast` | — |

Unknown `/api/*` → 404. Static: block path traversal, `/data/` direct access, and server source files. CSP + X-Frame-Options + nosniff.

## Architecture (implement this split)

```
server.js              HTTP entry — API routes, static via server-utils
server-utils.js        Path safety, security headers, admin auth, static files, .env
store-profiles.js      Persist data/store-profiles.json + Sensei pricing bridge
verticals.js           data/verticals.json + forecast + opportunities
planner-sensei-cost.js Shared CapEx/BOM (browser + Node)
planner-saas-cost.js   Tiered SaaS + CapEx vs annual SaaS calibration
planner-app.js         Planner UI bootstrap
planner-3d.js          Three.js scene
planner-simulation.js  Shopper journey / occupancy
planner-artifacts.js   Fixture catalog
planner-layout-builder.js / planner-layout-document.js
planner-wall-links.js  1 m wall snap
planner-discovery-questions.js
planner-proposal-report.js
data/                  verticals.json, store-profiles.json, sensei-setup-assumptions.json
```

## Calibration data

- Simulator: `data/verticals.json` (editable via API/Backoffice).
- Planner CapEx: `data/sensei-setup-assumptions.json` (+ optional store-profile overrides).
- Formats by area: POD ≤50 m², Corner ≤150, Conveniência ≤800, else Supermercado. Server count jumps around **61 m²** (1 → 3 servers) — keep Gas Station Conv at 60 m².

## Done when

- `npm run dev` serves all four apps on port 3000.
- Forecast, CapEx estimate, store-profiles GET, and health work.
- Planner: prefabs including Gas Station Conv; SaaS + **annual** calibration; Proposal preview + print PDF; sim basket value; Full reset; readable 3D toolbar.
- Docker build includes `*.html`, `*.css`, `planner-*.js`, `data`.
- README matches the running app.

Work incrementally: server + static + APIs, then simulator, then planner 2D/3D/cost, then simulation and proposal.
