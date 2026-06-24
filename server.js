const http = require("http");
const fs = require("fs");
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

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const root = __dirname;
const MAX_BODY_BYTES = 1_000_000;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=UTF-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", () => reject(new Error("Request stream error")));
  });
}

const mimeTypes = {
  ".html": "text/html; charset=UTF-8",
  ".js": "text/javascript; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json"
};

function matchStoreProfileSourcing(pathname) {
  const match = pathname.match(/^\/api\/store-profiles\/([a-z]+)\/sourcing$/);
  return match ? match[1] : null;
}

function matchVerticalId(pathname) {
  const match = pathname.match(/^\/api\/verticals\/([a-z_]+)$/);
  return match ? match[1] : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "smart-store-simulator-api", verticals: true });
    return;
  }

  if (req.method === "GET" && pathname === "/api/verticals") {
    const config = loadVerticals();
    sendJson(res, 200, {
      version: config.version,
      updatedAt: config.updatedAt,
      verticals: listVerticalsForClient(config)
    });
    return;
  }

  const verticalId = matchVerticalId(pathname);
  if (req.method === "GET" && verticalId) {
    const config = loadVerticals();
    const vertical = getVertical(config, verticalId);
    if (!vertical) {
      sendJson(res, 404, { error: `Unknown vertical: ${verticalId}` });
      return;
    }
    sendJson(res, 200, {
      ...listVerticalsForClient(config).find((v) => v.id === verticalId),
      modelConstantsResolved: resolveModelConstants(vertical, vertical.defaultInput)
    });
    return;
  }

  if (req.method === "PUT" && pathname === "/api/verticals") {
    try {
      const body = await parseJsonBody(req);
      const saved = saveVerticals(body);
      sendJson(res, 200, saved);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/sensei-assumptions") {
    const config = loadStoreProfiles();
    const assumptions = loadSenseiAssumptions(config);
    if (!assumptions) {
      sendJson(res, 404, { error: "Sensei assumptions file not found" });
      return;
    }
    sendJson(res, 200, {
      version: assumptions.version,
      exportedAt: assumptions.exportedAt,
      assumptions,
      defaults: config.senseiDefaults,
      pricingOverrides: config.senseiPricingOverrides
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/planner/estimate") {
    try {
      const body = await parseJsonBody(req);
      const config = loadStoreProfiles();
      const assumptions = loadSenseiAssumptions(config);
      if (!assumptions) {
        sendJson(res, 404, { error: "Sensei assumptions file not found" });
        return;
      }
      const pricingOptions = buildSenseiPricingOptions(config, body);
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
      sendJson(res, 200, estimate);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/store-profiles") {
    sendJson(res, 200, loadStoreProfiles());
    return;
  }

  if (req.method === "PUT" && pathname === "/api/store-profiles") {
    try {
      const body = await parseJsonBody(req);
      const saved = saveStoreProfiles(body);
      sendJson(res, 200, saved);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const sourcingProfileId = matchStoreProfileSourcing(pathname);
  if (req.method === "GET" && sourcingProfileId) {
    const config = loadStoreProfiles();
    const payload = buildSourcingPayload(config, sourcingProfileId, {
      widthMeters: url.searchParams.get("widthMeters"),
      heightMeters: url.searchParams.get("heightMeters")
    });
    if (!payload) {
      sendJson(res, 404, { error: `Unknown profile: ${sourcingProfileId}` });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (req.method === "POST" && pathname === "/api/forecast") {
    try {
      const body = await parseJsonBody(req);
      const verticalKey = body.verticalId || body.vertical || "retail";
      const input = body.input || body;
      const config = loadVerticals();
      const vertical = getVertical(config, verticalKey);
      if (!vertical) {
        sendJson(res, 404, { error: `Unknown vertical: ${verticalKey}` });
        return;
      }
      const forecast = computeForecast(input, verticalKey, config);
      const modelConstants = resolveModelConstants(vertical, input);
      const opportunities = evaluateOpportunities(input, forecast.netValue, verticalKey, config);
      sendJson(res, 200, { verticalId: verticalKey, forecast, modelConstants, opportunities });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.statusCode = error.code === "ENOENT" ? 404 : 500;
      res.setHeader("Content-Type", "text/plain; charset=UTF-8");
      res.end(error.code === "ENOENT" ? "404 Not Found" : "500 Internal Server Error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Smart Store simulator running at http://${HOST}:${PORT}`);
  console.log(`Backoffice available at http://${HOST}:${PORT}/backoffice.html`);
});
