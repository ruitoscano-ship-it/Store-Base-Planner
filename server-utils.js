/** Shared HTTP helpers — path safety, security headers, optional admin auth. */
const fs = require("fs");
const path = require("path");

function loadDotEnv(rootDir) {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}

const MIME_TYPES = {
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
  ".gltf": "model/gltf+json",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

/** Paths that must never be served as static files. */
const BLOCKED_STATIC_PREFIXES = ["/data/", "/.git/", "/node_modules/"];
const BLOCKED_STATIC_EXACT = new Set([
  "/server.js",
  "/server-utils.js",
  "/store-profiles.js",
  "/verticals.js",
  "/package.json",
  "/package-lock.json",
  "/.env",
  "/.gitignore",
  "/Dockerfile",
  "/.dockerignore"
]);

function loadConfig(rootDir = __dirname) {
  loadDotEnv(rootDir);
  const isProduction = process.env.NODE_ENV === "production";
  return {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || (isProduction ? "0.0.0.0" : "127.0.0.1"),
    isProduction,
    adminToken: process.env.ADMIN_TOKEN || "",
    corsOrigin: process.env.CORS_ORIGIN || (isProduction ? "" : "*"),
    maxBodyBytes: Number(process.env.MAX_BODY_BYTES) || 1_000_000
  };
}

function setSecurityHeaders(res, { isProduction = false } = {}) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "worker-src 'self' blob: https://cdnjs.cloudflare.com",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'"
    ].join("; ")
  );
}

function setCorsHeaders(res, corsOrigin) {
  if (!corsOrigin) return;
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, statusCode, payload, config) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=UTF-8");
  setSecurityHeaders(res, config);
  setCorsHeaders(res, config.corsOrigin);
  res.end(JSON.stringify(payload));
}

function isAuthorized(req, config) {
  if (!config.adminToken) return true;
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return token.length > 0 && token === config.adminToken;
}

function requireAdmin(req, res, config) {
  if (isAuthorized(req, config)) return true;
  sendJson(res, 401, { error: "Unauthorized — admin token required for write operations." }, config);
  return false;
}

function resolvePublicFile(root, pathname) {
  if (!pathname || pathname.includes("\0")) return null;

  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const lower = requestPath.toLowerCase();

  if (BLOCKED_STATIC_EXACT.has(lower)) return null;
  if (BLOCKED_STATIC_PREFIXES.some((prefix) => lower.startsWith(prefix))) return null;

  const normalized = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const relative = normalized.replace(/^[/\\]+/, "");
  const absolute = path.resolve(root, relative);
  const rootResolved = path.resolve(root);

  if (absolute !== rootResolved && !absolute.startsWith(`${rootResolved}${path.sep}`)) {
    return null;
  }

  return absolute;
}

function cacheControlFor(ext) {
  if (ext === ".html") return "no-cache";
  if ([".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".woff2", ".glb", ".gltf"].includes(ext)) {
    return "public, max-age=86400, immutable";
  }
  return "no-cache";
}

function serveStatic(root, pathname, res, config) {
  const filePath = resolvePublicFile(root, pathname);
  if (!filePath) {
    res.statusCode = 403;
    setSecurityHeaders(res, config);
    res.setHeader("Content-Type", "text/plain; charset=UTF-8");
    res.end("403 Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.statusCode = error.code === "ENOENT" ? 404 : 500;
      setSecurityHeaders(res, config);
      res.setHeader("Content-Type", "text/plain; charset=UTF-8");
      res.end(error.code === "ENOENT" ? "404 Not Found" : "500 Internal Server Error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    setSecurityHeaders(res, config);
    res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", cacheControlFor(ext));
    res.end(content);
  });
}

function parseJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", () => reject(new Error("Request stream error")));
  });
}

function logRequest(req, pathname, statusCode) {
  const ts = new Date().toISOString();
  console.log(`${ts} ${req.method} ${pathname} ${statusCode}`);
}

module.exports = {
  loadConfig,
  sendJson,
  requireAdmin,
  serveStatic,
  parseJsonBody,
  logRequest
};
