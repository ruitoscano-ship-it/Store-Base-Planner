/** Simple grid BFS pathfinding for shopper simulation. */

import { pointInObstacle, SHOPPER_BODY_RADIUS } from "./planner-collision.js";

export const PATH_CELL_SIZE = 0.5;

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cellIndex(col, row, cols) {
  return row * cols + col;
}

function worldToCell(x, z, cell, cols, rows) {
  return {
    col: clamp(Math.floor(x / cell), 0, cols - 1),
    row: clamp(Math.floor(z / cell), 0, rows - 1)
  };
}

function cellToWorld(col, row, cell) {
  return {
    x: col * cell + cell * 0.5,
    z: row * cell + cell * 0.5
  };
}

function cellWalkable(x, z, w, d, margin, obstacles, excludeIds, radius) {
  if (x < margin || z < margin || x > w - margin || z > d - margin) return false;
  for (const obs of obstacles) {
    if (excludeIds.has(obs.id)) continue;
    if (pointInObstacle(x, z, { ...obs, hw: obs.hw + radius, hd: obs.hd + radius })) {
      return false;
    }
  }
  return true;
}

function nearestWalkableCell(startCol, startRow, w, d, margin, cell, cols, rows, obstacles, excludeIds, radius) {
  if (
    cellWalkable(
      cellToWorld(startCol, startRow, cell).x,
      cellToWorld(startCol, startRow, cell).z,
      w,
      d,
      margin,
      obstacles,
      excludeIds,
      radius
    )
  ) {
    return { col: startCol, row: startRow };
  }

  for (let ring = 1; ring <= 10; ring += 1) {
    for (let dc = -ring; dc <= ring; dc += 1) {
      for (let dr = -ring; dr <= ring; dr += 1) {
        if (Math.abs(dc) !== ring && Math.abs(dr) !== ring) continue;
        const col = clamp(startCol + dc, 0, cols - 1);
        const row = clamp(startRow + dr, 0, rows - 1);
        const point = cellToWorld(col, row, cell);
        if (cellWalkable(point.x, point.z, w, d, margin, obstacles, excludeIds, radius)) {
          return { col, row };
        }
      }
    }
  }

  return { col: startCol, row: startRow };
}

/**
 * Find a path across the store floor using BFS on a meter grid.
 * @returns {Array<{x:number,z:number}>|null}
 */
export function findStorePath(
  {
    widthMeters,
    depthMeters,
    margin,
    obstacles,
    excludeIds = new Set(),
    cell = PATH_CELL_SIZE,
    radius = SHOPPER_BODY_RADIUS * 0.9
  },
  startX,
  startZ,
  goalX,
  goalZ
) {
  const w = widthMeters;
  const d = depthMeters;
  const cols = Math.max(1, Math.ceil(w / cell));
  const rows = Math.max(1, Math.ceil(d / cell));
  const startCell = worldToCell(startX, startZ, cell, cols, rows);
  const goalCell = worldToCell(goalX, goalZ, cell, cols, rows);
  const walkableStart = nearestWalkableCell(
    startCell.col,
    startCell.row,
    w,
    d,
    margin,
    cell,
    cols,
    rows,
    obstacles,
    excludeIds,
    radius
  );
  const walkableGoal = nearestWalkableCell(
    goalCell.col,
    goalCell.row,
    w,
    d,
    margin,
    cell,
    cols,
    rows,
    obstacles,
    excludeIds,
    radius
  );

  const startIdx = cellIndex(walkableStart.col, walkableStart.row, cols);
  const goalIdx = cellIndex(walkableGoal.col, walkableGoal.row, cols);
  if (startIdx === goalIdx) {
    return [{ x: goalX, z: goalZ }];
  }

  const total = cols * rows;
  const visited = new Uint8Array(total);
  const prev = new Int32Array(total);
  prev.fill(-1);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  queue[tail++] = startIdx;
  visited[startIdx] = 1;

  while (head < tail) {
    const idx = queue[head++];
    if (idx === goalIdx) break;

    const col = idx % cols;
    const row = Math.floor(idx / cols);

    for (const [dc, dr] of NEIGHBORS) {
      const nextCol = col + dc;
      const nextRow = row + dr;
      if (nextCol < 0 || nextRow < 0 || nextCol >= cols || nextRow >= rows) continue;

      const nextIdx = cellIndex(nextCol, nextRow, cols);
      if (visited[nextIdx]) continue;

      const point = cellToWorld(nextCol, nextRow, cell);
      if (!cellWalkable(point.x, point.z, w, d, margin, obstacles, excludeIds, radius)) continue;

      visited[nextIdx] = 1;
      prev[nextIdx] = idx;
      queue[tail++] = nextIdx;
    }
  }

  if (!visited[goalIdx]) return null;

  const cells = [];
  let cursor = goalIdx;
  while (cursor >= 0) {
    cells.push(cursor);
    if (cursor === startIdx) break;
    cursor = prev[cursor];
  }
  cells.reverse();

  const waypoints = cells.map((idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return cellToWorld(col, row, cell);
  });

  waypoints[waypoints.length - 1] = { x: goalX, z: goalZ };

  if (waypoints.length > 2) {
    const simplified = [waypoints[0]];
    for (let i = 1; i < waypoints.length - 1; i += 1) {
      const a = simplified[simplified.length - 1];
      const b = waypoints[i];
      const c = waypoints[i + 1];
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const bcx = c.x - b.x;
      const bcz = c.z - b.z;
      const cross = abx * bcz - abz * bcx;
      if (Math.abs(cross) > 0.05) simplified.push(b);
    }
    simplified.push(waypoints[waypoints.length - 1]);
    return simplified;
  }

  return waypoints;
}

export function pathGoalKey(x, z) {
  return `${Math.round(x * 4) / 4},${Math.round(z * 4) / 4}`;
}
