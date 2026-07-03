/** Interior wall segment snapping and link detection for the 2D planner. */

export const WALL_KIND = "separator-wall";
export const WALL_LINK_DISTANCE = 0.65;
export const WALL_LINKED_DISTANCE = 0.18;

export function isWallKind(kind) {
  return kind === WALL_KIND;
}

function normalizeAngle(degrees) {
  return ((Number(degrees) || 0) % 360 + 360) % 360;
}

export function wallLengthMetersFromSize(widthMeters, depthMeters) {
  return Math.max(Number(widthMeters) || 1, Number(depthMeters) || 0.12);
}

export function wallLengthMeters(obj, spec = {}) {
  const w = obj.plannerMeters?.w ?? spec.w ?? spec.widthMeters ?? 1;
  const h = obj.plannerMeters?.h ?? spec.h ?? spec.depthMeters ?? 0.12;
  return wallLengthMetersFromSize(w, h);
}

export function wallEndpoints(pose, lengthMeters) {
  const rad = (normalizeAngle(pose.angle) * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dz = Math.sin(rad);
  const half = lengthMeters / 2;
  return {
    start: { x: pose.x - half * dx, z: pose.z - half * dz },
    end: { x: pose.x + half * dx, z: pose.z + half * dz },
    dir: { x: dx, z: dz }
  };
}

export function anglesParallel(a, b, toleranceDeg = 15) {
  const da = normalizeAngle(a);
  const db = normalizeAngle(b);
  const raw = Math.abs(da - db);
  const diff = Math.min(raw, 360 - raw);
  return diff <= toleranceDeg || Math.abs(diff - 180) <= toleranceDeg;
}

const ENDPOINT_PAIRS = [
  ["start", "end"],
  ["end", "start"],
  ["start", "start"],
  ["end", "end"]
];

export function findWallSnapFromEndpoints(movingEndpoints, pose, wallId, others, { maxDistanceMeters = WALL_LINK_DISTANCE } = {}) {
  if (!movingEndpoints?.start || !movingEndpoints?.end) return null;

  let best = null;
  for (const other of others) {
    if (!other?.endpoints || other.id === wallId) continue;
    if (!anglesParallel(pose.angle, other.pose?.angle ?? pose.angle)) continue;

    for (const [myEnd, otherEnd] of ENDPOINT_PAIRS) {
      const a = movingEndpoints[myEnd];
      const b = other.endpoints[otherEnd];
      const distance = Math.hypot(a.x - b.x, a.z - b.z);
      if (distance > maxDistanceMeters) continue;
      if (best && distance >= best.distance) continue;

      best = {
        distance,
        pose: {
          x: pose.x + (b.x - a.x),
          z: pose.z + (b.z - a.z),
          angle: normalizeAngle(pose.angle)
        },
        myEnd,
        otherId: other.id,
        otherEnd
      };
    }
  }

  return best;
}

export function findWallSnap(pose, lengthMeters, wallId, others, options = {}) {
  const movingEndpoints = options.movingEndpoints ?? wallEndpoints(pose, lengthMeters);
  const angleCandidates = new Set([normalizeAngle(pose.angle)]);
  others.forEach((other) => {
    if (other?.pose) {
      angleCandidates.add(normalizeAngle(other.pose.angle));
      angleCandidates.add(normalizeAngle(other.pose.angle + 180));
    }
  });
  [0, 90, 180, 270].forEach((angle) => angleCandidates.add(angle));

  let best = null;
  for (const angle of angleCandidates) {
    const candidatePose = { ...pose, angle };
    const endpoints =
      angle === normalizeAngle(pose.angle) && options.movingEndpoints
        ? options.movingEndpoints
        : options.endpointForPose?.(candidatePose, lengthMeters) ?? wallEndpoints(candidatePose, lengthMeters);

    const snap = findWallSnapFromEndpoints(endpoints, candidatePose, wallId, others, options);
    if (snap && (!best || snap.distance < best.distance)) {
      best = snap;
    }
  }

  return best;
}

export function snapWallAngle(pose, others, { toleranceDeg = 15 } = {}) {
  const candidates = new Set([0, 90, 180, 270]);
  others.forEach((other) => {
    if (other?.pose) {
      candidates.add(normalizeAngle(other.pose.angle));
      candidates.add(normalizeAngle(other.pose.angle + 180));
    }
  });

  const current = normalizeAngle(pose.angle);
  let bestAngle = current;
  let bestDiff = Infinity;
  candidates.forEach((candidate) => {
    const raw = Math.abs(current - candidate);
    const diff = Math.min(raw, 360 - raw);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestAngle = candidate;
    }
  });

  if (bestDiff > toleranceDeg) return pose;
  return { ...pose, angle: bestAngle };
}

export function computeWallLinksFromEndpoints(endpoints, wallId, others, { maxDistanceMeters = WALL_LINKED_DISTANCE } = {}) {
  const links = { start: null, end: null };
  if (!endpoints?.start || !endpoints?.end) return links;

  for (const other of others) {
    if (!other?.endpoints || other.id === wallId) continue;

    for (const [myEnd, otherEnd] of ENDPOINT_PAIRS) {
      const a = endpoints[myEnd];
      const b = other.endpoints[otherEnd];
      if (Math.hypot(a.x - b.x, a.z - b.z) > maxDistanceMeters) continue;
      if (!links[myEnd]) links[myEnd] = other.id;
    }
  }

  return links;
}

export function computeWallLinks(pose, lengthMeters, wallId, others, options = {}) {
  const endpoints =
    options.movingEndpoints ??
    options.endpointForPose?.(pose, lengthMeters) ??
    wallEndpoints(pose, lengthMeters);
  return computeWallLinksFromEndpoints(endpoints, wallId, others, options);
}
