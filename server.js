const http = require("http");
const path = require("path");
const {
  loadStoreProfiles,
  saveStoreProfiles,
  buildSourcingPayload,
  loadSenseiAssumptions,
  buildSenseiPricingOptions
} = require("./store-profiles");
const { estimateStoreCapex } = require("./planner-sensei-cost");
const {
  loadVerticals,
  saveVerticals,
  getVertical,
  computeForecast,
  resolveModelConstants,
  listVerticalsForClient,
  evaluateOpportunities
} = require("./verticals");
const {
  loadConfig,
  sendJson,
  requireAdmin,
  serveStatic,
  parseJsonBody,
  logRequest
} = require("./server-utils");

const root = __dirname;
const config = loadConfig(root);

function matchStoreProfileSourcing(pathname) {
  const match = pathname.match(/^\/api\/store-profiles\/([a-z]+)\/sourcing$/);
  return match ? match[1] : null;
}

function matchVerticalId(pathname) {
  const match = pathname.match(/^\/api\/verticals\/([a-z_]+)$/);
  return match ? match[1] : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${config.host}:${config.port}`);
  const pathname = url.pathname;
  let statusCode = 200;

  const finishJson = (code, payload) => {
    statusCode = code;
    sendJson(res, code, payload, config);
    logRequest(req, pathname, statusCode);
  };

  try {
    if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
      finishJson(204, {});
      return;
    }

    if (req.method === "GET" && pathname === "/api/health") {
      finishJson(200, {
        ok: true,
        service: "smart-store-simulator-api",
        verticals: true,
        version: "1.0.0"
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/verticals") {
      const verticalsConfig = loadVerticals();
      finishJson(200, {
        version: verticalsConfig.version,
        updatedAt: verticalsConfig.updatedAt,
        verticals: listVerticalsForClient(verticalsConfig)
      });
      return;
    }

    const verticalId = matchVerticalId(pathname);
    if (req.method === "GET" && verticalId) {
      const verticalsConfig = loadVerticals();
      const vertical = getVertical(verticalsConfig, verticalId);
      if (!vertical) {
        finishJson(404, { error: `Unknown vertical: ${verticalId}` });
        return;
      }
      finishJson(200, {
        ...listVerticalsForClient(verticalsConfig).find((v) => v.id === verticalId),
        modelConstantsResolved: resolveModelConstants(vertical, vertical.defaultInput)
      });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/verticals") {
      if (!requireAdmin(req, res, config)) {
        logRequest(req, pathname, 401);
        return;
      }
      const body = await parseJsonBody(req, config.maxBodyBytes);
      const saved = saveVerticals(body);
      finishJson(200, saved);
      return;
    }

    if (req.method === "GET" && pathname === "/api/sensei-assumptions") {
      const profilesConfig = loadStoreProfiles();
      const assumptions = loadSenseiAssumptions(profilesConfig);
      if (!assumptions) {
        finishJson(404, { error: "Sensei assumptions file not found" });
        return;
      }
      finishJson(200, {
        version: assumptions.version,
        exportedAt: assumptions.exportedAt,
        assumptions,
        defaults: profilesConfig.senseiDefaults,
        pricingOverrides: profilesConfig.senseiPricingOverrides
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/planner/estimate") {
      const body = await parseJsonBody(req, config.maxBodyBytes);
      const profilesConfig = loadStoreProfiles();
      const assumptions = loadSenseiAssumptions(profilesConfig);
      if (!assumptions) {
        finishJson(404, { error: "Sensei assumptions file not found" });
        return;
      }
      const pricingOptions = buildSenseiPricingOptions(profilesConfig, body);
      const estimate = estimateStoreCapex(
        assumptions,
        {
          widthMeters: body.widthMeters,
          heightMeters: body.heightMeters,
          counts: body.counts || {},
          doors: body.doors
        },
        pricingOptions
      );
      finishJson(200, estimate);
      return;
    }

    if (req.method === "GET" && pathname === "/api/store-profiles") {
      finishJson(200, loadStoreProfiles());
      return;
    }

    if (req.method === "PUT" && pathname === "/api/store-profiles") {
      if (!requireAdmin(req, res, config)) {
        logRequest(req, pathname, 401);
        return;
      }
      const body = await parseJsonBody(req, config.maxBodyBytes);
      const saved = saveStoreProfiles(body);
      finishJson(200, saved);
      return;
    }

    const sourcingProfileId = matchStoreProfileSourcing(pathname);
    if (req.method === "GET" && sourcingProfileId) {
      const profilesConfig = loadStoreProfiles();
      const payload = buildSourcingPayload(profilesConfig, sourcingProfileId, {
        widthMeters: url.searchParams.get("widthMeters"),
        heightMeters: url.searchParams.get("heightMeters")
      });
      if (!payload) {
        finishJson(404, { error: `Unknown profile: ${sourcingProfileId}` });
        return;
      }
      finishJson(200, payload);
      return;
    }

    if (req.method === "POST" && pathname === "/api/forecast") {
      const body = await parseJsonBody(req, config.maxBodyBytes);
      const verticalKey = body.verticalId || body.vertical || "retail";
      const input = body.input || body;
      const verticalsConfig = loadVerticals();
      const vertical = getVertical(verticalsConfig, verticalKey);
      if (!vertical) {
        finishJson(404, { error: `Unknown vertical: ${verticalKey}` });
        return;
      }
      const forecast = computeForecast(input, verticalKey, verticalsConfig);
      const modelConstants = resolveModelConstants(vertical, input);
      const opportunities = evaluateOpportunities(input, forecast.netValue, verticalKey, verticalsConfig);
      finishJson(200, { verticalId: verticalKey, forecast, modelConstants, opportunities });
      return;
    }

    if (pathname.startsWith("/api/")) {
      finishJson(404, { error: "Not found" });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      finishJson(405, { error: "Method not allowed" });
      return;
    }

    serveStatic(root, pathname, res, config);
  } catch (error) {
    finishJson(400, { error: error.message || "Bad request" });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Smart Store simulator running at http://${config.host}:${config.port}`);
  console.log(`Backoffice: http://${config.host}:${config.port}/backoffice.html`);
  console.log(`Planner:    http://${config.host}:${config.port}/planner.html`);
  if (config.isProduction && !config.adminToken) {
    console.warn("WARNING: ADMIN_TOKEN is not set — write APIs are open. Set ADMIN_TOKEN in production.");
  }
  if (!config.isProduction) {
    console.log("Development mode — listening on localhost. Set NODE_ENV=production for deploy defaults.");
  }
});
