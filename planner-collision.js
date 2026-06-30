/** Shared 2D footprint collision for walk mode, fixture drag, and shopper simulation. */

export const SHOPPER_BODY_RADIUS = 0.35;
export const WALK_BODY_RADIUS = 0.32;
export const SHELF_TOUCH_RADIUS = 0.42;

export const SHELF_KINDS = new Set(["shelf-ambient", "shelf-island", "shelf-cold", "shelf-hot"]);
export const GATE_KINDS = new Set(["entry-gated", "entry-open"]);
export const CHECKOUT_KINDS = new Set(["checkout"]);

// Every merchandised fixture a shopper can touch and grab a product from.
// Excludes gates (entries) and checkouts (counted separately at payment).
export const MODULE_KINDS = new Set([
  "shelf-ambient",
  "shelf-island",
  "shelf-cold",
  "shelf-hot",
  "produce-bin",
  "service-deli",
  "service-fish",
  "service-bakery",
  "station-coffee",
  "station-juice"
]);

export const COLLISION_KINDS = new Set([
  "shelf-ambient",
  "shelf-island",
  "shelf-cold",
  "shelf-hot",
  "checkout",
  "separator-wall"
]);

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function obstacleFromObject(obj, { wallThickness = 0.12, padding = 0 } = {}) {
  let hw = obj.meters.w / 2;
  let hd = obj.meters.h / 2;

  if (obj.kind === "separator-wall") {
    const angle = obj.angle || 0;
    const isVertical = Math.abs(angle % 180) > 45 && Math.abs(angle % 180) < 135;
    if (isVertical) hw = wallThickness / 2;
    else hd = wallThickness / 2;
  }

  return {
    id: obj.id,
    cx: obj.meters.x,
    cz: obj.meters.z,
    hw: hw + padding,
    hd: hd + padding,
    angle: -degToRad(obj.angle || 0)
  };
}

export function buildLayoutObstacles(objects, options = {}) {
  const padding = options.padding ?? SHOPPER_BODY_RADIUS * 0.18;
  return (objects || [])
    .filter((obj) => COLLISION_KINDS.has(obj.kind))
    .map((obj) => obstacleFromObject(obj, { ...options, padding }));
}

export function buildFixtureZones(objects, kinds, options = {}) {
  const padding = options.padding ?? 0;
  return (objects || [])
    .filter((obj) => kinds.has(obj.kind))
    .map((obj) => ({
      kind: obj.kind,
      ...obstacleFromObject(obj, { ...options, padding })
    }));
}

export function shopperTouchesFixture(x, z, radius, fixture) {
  const touchPad = radius + SHELF_TOUCH_RADIUS * 0.55;
  return pointInObstacle(x, z, {
    ...fixture,
    hw: fixture.hw + touchPad,
    hd: fixture.hd + touchPad
  });
}

function toLocal(x, z, obs) {
  const dx = x - obs.cx;
  const dz = z - obs.cz;
  const cos = Math.cos(-obs.angle);
  const sin = Math.sin(-obs.angle);
  return {
    lx: dx * cos - dz * sin,
    lz: dx * sin + dz * cos
  };
}

function toWorld(lx, lz, obs) {
  const cos = Math.cos(obs.angle);
  const sin = Math.sin(obs.angle);
  return {
    x: obs.cx + lx * cos - lz * sin,
    z: obs.cz + lx * sin + lz * cos
  };
}

export function pointInObstacle(x, z, obs) {
  const { lx, lz } = toLocal(x, z, obs);
  return Math.abs(lx) <= obs.hw && Math.abs(lz) <= obs.hd;
}

export function resolveCircleAgainstObstacles(x, z, radius, obstacles, { excludeId = null } = {}) {
  let px = x;
  let pz = z;

  for (let pass = 0; pass < 4; pass += 1) {
    let moved = false;
    for (const obs of obstacles) {
      if (excludeId && obs.id === excludeId) continue;

      let { lx, lz } = toLocal(px, pz, obs);
      const nearestX = clamp(lx, -obs.hw, obs.hw);
      const nearestZ = clamp(lz, -obs.hd, obs.hd);
      const dx = lx - nearestX;
      const dz = lz - nearestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq >= radius * radius) continue;

      if (distSq <= 1e-8) {
        lx = nearestX + (lx >= 0 ? radius : -radius);
        lz = nearestZ + (lz >= 0 ? radius : -radius);
      } else {
        const dist = Math.sqrt(distSq);
        const push = radius - dist;
        lx += (dx / dist) * push;
        lz += (dz / dist) * push;
      }

      const next = toWorld(lx, lz, obs);
      px = next.x;
      pz = next.z;
      moved = true;
    }
    if (!moved) break;
  }

  return { x: px, z: pz };
}

export function resolveMovement(prevX, prevZ, nextX, nextZ, radius, obstacles, options = {}) {
  const resolved = resolveCircleAgainstObstacles(nextX, nextZ, radius, obstacles, options);
  if (!pointBlocked(resolved.x, resolved.z, radius, obstacles, options)) {
    return resolved;
  }
  const slideX = resolveCircleAgainstObstacles(nextX, prevZ, radius, obstacles, options);
  if (!pointBlocked(slideX.x, slideX.z, radius, obstacles, options)) return slideX;
  const slideZ = resolveCircleAgainstObstacles(prevX, nextZ, radius, obstacles, options);
  if (!pointBlocked(slideZ.x, slideZ.z, radius, obstacles, options)) return slideZ;
  return { x: prevX, z: prevZ };
}

function pointBlocked(x, z, radius, obstacles, options) {
  for (const obs of obstacles) {
    if (options.excludeId && obs.id === options.excludeId) continue;
    if (pointInObstacle(x, z, { ...obs, hw: obs.hw + radius * 0.35, hd: obs.hd + radius * 0.35 })) {
      return true;
    }
  }
  return false;
}
