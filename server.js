const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const root = __dirname;
const MAX_BODY_BYTES = 1_000_000;

const modelConstants = {
  daysPerMonth: 30,
  baseConversion: 0.42,
  averageItemsPerTransaction: 2.6,
  averageProductPrice: 4.8,
  baseFixedMonthlyCosts: 54000,
  laborCostPerPerson: 145,
  penaltyPerException: 16,
  downtimePenaltyAt0h: 0,
  downtimePenaltyAt12h: 1
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function computeForecast(input) {
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
  const operatingCosts = modelConstants.baseFixedMonthlyCosts + staffingMonthlyCost + input.energyComms + input.smartTechCost;
  const downtimePenaltyRate =
    modelConstants.downtimePenaltyAt0h +
    (input.downtimeHours / 12) * (modelConstants.downtimePenaltyAt12h - modelConstants.downtimePenaltyAt0h);
  const downtimePenalty = revenue * clamp(downtimePenaltyRate, modelConstants.downtimePenaltyAt0h, modelConstants.downtimePenaltyAt12h);
  const netValue = revenue - (operatingCosts + exceptionPenalty + downtimePenalty);
  const netMargin = revenue > 0 ? netValue / revenue : 0;

  return {
    transactions,
    productsSold,
    revenue,
    exceptionVolume,
    exceptionPenalty,
    downtimePenalty,
    downtimePenaltyRate,
    operatingCosts,
    netValue,
    netMargin
  };
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=UTF-8");
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
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, { ok: true, service: "smart-store-simulator-api" });
    return;
  }

  if (req.method === "POST" && req.url === "/api/forecast") {
    try {
      const body = await parseJsonBody(req);
      const forecast = computeForecast(body.input || body);
      sendJson(res, 200, { forecast, modelConstants });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const requestPath = req.url === "/" ? "/index.html" : req.url;
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
});
