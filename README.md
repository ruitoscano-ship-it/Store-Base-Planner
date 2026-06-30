# Store Base Operations

Smart Store value realization simulator and 3D store planner for Sensei retail deployments.

## Applications

| URL | Purpose |
|-----|---------|
| `/` | Value simulator — forecast net value by vertical (retail, pharmacy, cinema F&B, bakery) |
| `/planner.html` | Store planner — 2D layout, 3D view, occupancy simulation, CAPEX estimates |
| `/backoffice.html` | Admin — store profiles, Sensei pricing defaults, fixture dimensions |
| `/Setup_Calculator.html` | Standalone Sensei setup calculator (Portuguese) |

## Requirements

- **Node.js ≥ 18** (no npm dependencies — stdlib only)
- Outbound HTTPS for CDN assets in the planner (Three.js, Fabric.js, PDF.js)

## Local development

```bash
npm run dev
```

Open:

- http://127.0.0.1:3000/
- http://127.0.0.1:3000/planner.html
- http://127.0.0.1:3000/backoffice.html

## Production deployment

### 1. Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `HOST` | Yes | `0.0.0.0` to accept external connections |
| `PORT` | No | Default `3000` |
| `ADMIN_TOKEN` | **Strongly recommended** | Protects `PUT /api/store-profiles` and `PUT /api/verticals` |
| `CORS_ORIGIN` | Optional | Restrict API CORS (empty = same-origin only in production) |

Generate a token:

```bash
openssl rand -hex 32
```

Enter the token in Backoffice (admin token field) before saving configuration.

### 2. Docker

```bash
docker build -t store-base-operations .
docker run -d \
  -p 3000:3000 \
  -e ADMIN_TOKEN="your-secret-token" \
  -v store-data:/app/data \
  --name store-sim \
  store-base-operations
```

Health check: `GET /api/health`

### 3. Reverse proxy (recommended)

Terminate TLS at nginx, Caddy, or Cloudflare. Example nginx location:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

### 4. Persistent data

Writable volume required for:

- `data/store-profiles.json` — store presets, artifacts, Sensei overrides
- `data/verticals.json` — simulator vertical definitions

`data/sensei-setup-assumptions.json` is read-only pricing reference data.

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/verticals` | — | List verticals |
| GET | `/api/store-profiles` | — | Full store configuration |
| PUT | `/api/store-profiles` | Admin token | Save store configuration |
| PUT | `/api/verticals` | Admin token | Save verticals |
| GET | `/api/sensei-assumptions` | — | Sensei pricing assumptions |
| POST | `/api/planner/estimate` | — | CAPEX estimate for a layout |
| POST | `/api/forecast` | — | Value forecast for a vertical |

## Architecture

```
server.js              HTTP entry — routes API, delegates static serving
server-utils.js        Path safety, security headers, admin auth, static files
store-profiles.js      Store profile persistence + Sensei pricing bridge
verticals.js           Vertical definitions + forecast engine
planner-sensei-cost.js Shared CAPEX/BOM calculator (client + server)
planner-app.js         Planner UI (Fabric.js 2D, Three.js 3D, simulation)
planner-simulation.js  Occupancy simulation with shopper journey script
data/                  JSON configuration (writable in production)
models/kenney/         Optional GLB 3D assets
```

## Security notes

- Static file serving blocks path traversal, `/data/` direct access, and server source files
- Security headers (CSP, X-Frame-Options, nosniff) applied to all responses
- Blueprint upload is **client-side only** — files never reach the server
- Set `ADMIN_TOKEN` before exposing Backoffice publicly

## Calibration

Simulator assumptions live in `data/verticals.json` (editable via API/backoffice).  
Planner CAPEX uses `data/sensei-setup-assumptions.json` with optional overrides in store profiles.
