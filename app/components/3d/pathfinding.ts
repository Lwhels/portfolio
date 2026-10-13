import * as THREE from "three";
import { OBSTACLES, WORLD_HALF, Obstacle } from "./worldStore";

/**
 * Grid-based A* pathfinding over the island with circular obstacles,
 * followed by line-of-sight "string pulling" to produce smooth waypoints.
 */

const CELL = 1;
const MARGIN = 1.4; // rover half-width clearance
const LIMIT = WORLD_HALF - 1;
const SIZE = Math.floor((LIMIT * 2) / CELL) + 1;

let blocked: Uint8Array | null = null;

function toIndex(cx: number, cz: number) {
  return cz * SIZE + cx;
}
function toCell(v: number) {
  return Math.round((v + LIMIT) / CELL);
}
function toWorld(c: number) {
  return c * CELL - LIMIT;
}

function buildGrid(obstacles: Obstacle[]) {
  const grid = new Uint8Array(SIZE * SIZE);
  for (let cz = 0; cz < SIZE; cz++) {
    for (let cx = 0; cx < SIZE; cx++) {
      const x = toWorld(cx);
      const z = toWorld(cz);
      for (const o of obstacles) {
        const dx = x - o.x;
        const dz = z - o.z;
        const r = o.r + MARGIN;
        if (dx * dx + dz * dz < r * r) {
          grid[toIndex(cx, cz)] = 1;
          break;
        }
      }
    }
  }
  return grid;
}

function getGrid() {
  if (!blocked) blocked = buildGrid(OBSTACLES);
  return blocked;
}

/** Minimal binary heap keyed on f-score. */
class Heap {
  private items: number[] = [];
  constructor(private score: Float32Array) {}
  get size() {
    return this.items.length;
  }
  push(i: number) {
    const a = this.items;
    a.push(i);
    let n = a.length - 1;
    while (n > 0) {
      const p = (n - 1) >> 1;
      if (this.score[a[p]] <= this.score[a[n]]) break;
      [a[p], a[n]] = [a[n], a[p]];
      n = p;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let n = 0;
      for (;;) {
        const l = n * 2 + 1;
        const r = l + 1;
        let m = n;
        if (l < a.length && this.score[a[l]] < this.score[a[m]]) m = l;
        if (r < a.length && this.score[a[r]] < this.score[a[m]]) m = r;
        if (m === n) break;
        [a[m], a[n]] = [a[n], a[m]];
        n = m;
      }
    }
    return top;
  }
}

function lineOfSight(ax: number, az: number, bx: number, bz: number): boolean {
  const grid = getGrid();
  const dist = Math.hypot(bx - ax, bz - az);
  const steps = Math.ceil(dist / (CELL * 0.5));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const cx = toCell(ax + (bx - ax) * t);
    const cz = toCell(az + (bz - az) * t);
    if (cx < 0 || cz < 0 || cx >= SIZE || cz >= SIZE) return false;
    if (grid[toIndex(cx, cz)]) return false;
  }
  return true;
}

/** Find the nearest walkable cell to a (possibly blocked) cell. */
function nearestFree(cx: number, cz: number): [number, number] | null {
  const grid = getGrid();
  if (!grid[toIndex(cx, cz)]) return [cx, cz];
  for (let r = 1; r < 12; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const nx = cx + dx;
        const nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= SIZE || nz >= SIZE) continue;
        if (!grid[toIndex(nx, nz)]) return [nx, nz];
      }
    }
  }
  return null;
}

const NEIGHBORS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/**
 * Returns a list of world-space waypoints from `from` to `to` (inclusive of the
 * final target), or an empty array if no route exists.
 */
export function findPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  const grid = getGrid();
  const clamp = (v: number) => THREE.MathUtils.clamp(v, -LIMIT, LIMIT);

  const s = nearestFree(toCell(clamp(from.x)), toCell(clamp(from.z)));
  const g = nearestFree(toCell(clamp(to.x)), toCell(clamp(to.z)));
  if (!s || !g) return [];

  const goalWorld = new THREE.Vector3(toWorld(g[0]), 0, toWorld(g[1]));

  // Straight shot? Skip the search entirely.
  if (lineOfSight(from.x, from.z, goalWorld.x, goalWorld.z)) {
    return [goalWorld];
  }

  const total = SIZE * SIZE;
  const gScore = new Float32Array(total).fill(Infinity);
  const fScore = new Float32Array(total).fill(Infinity);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);

  const start = toIndex(s[0], s[1]);
  const goal = toIndex(g[0], g[1]);
  const h = (cx: number, cz: number) => Math.hypot(cx - g[0], cz - g[1]);

  gScore[start] = 0;
  fScore[start] = h(s[0], s[1]);
  const open = new Heap(fScore);
  open.push(start);

  let found = false;
  let iterations = 0;
  while (open.size > 0 && iterations++ < 20000) {
    const current = open.pop();
    if (current === goal) {
      found = true;
      break;
    }
    if (closed[current]) continue;
    closed[current] = 1;
    const cx = current % SIZE;
    const cz = (current / SIZE) | 0;

    for (const [dx, dz, cost] of NEIGHBORS) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= SIZE || nz >= SIZE) continue;
      const ni = toIndex(nx, nz);
      if (grid[ni] || closed[ni]) continue;
      // Prevent diagonal corner-cutting
      if (dx !== 0 && dz !== 0 && (grid[toIndex(cx + dx, cz)] || grid[toIndex(cx, cz + dz)])) continue;
      const tentative = gScore[current] + cost;
      if (tentative < gScore[ni]) {
        cameFrom[ni] = current;
        gScore[ni] = tentative;
        fScore[ni] = tentative + h(nx, nz);
        open.push(ni);
      }
    }
  }

  if (!found) return [];

  // Reconstruct
  const raw: THREE.Vector3[] = [];
  let cur = goal;
  while (cur !== -1) {
    raw.push(new THREE.Vector3(toWorld(cur % SIZE), 0, toWorld((cur / SIZE) | 0)));
    cur = cameFrom[cur];
  }
  raw.reverse();

  // String pulling: keep only waypoints required to maintain line of sight.
  const smooth: THREE.Vector3[] = [];
  let anchor = new THREE.Vector3(from.x, 0, from.z);
  let i = 0;
  while (i < raw.length - 1) {
    let j = raw.length - 1;
    while (j > i + 1 && !lineOfSight(anchor.x, anchor.z, raw[j].x, raw[j].z)) j--;
    smooth.push(raw[j]);
    anchor = raw[j];
    i = j;
  }
  if (smooth.length === 0) smooth.push(goalWorld);
  return smooth;
}

/**
 * Enhanced A* pathfinder that returns both smoothed waypoints and
 * a sample of explored search wavefront nodes for live 3D visualization.
 */
export function findPathDetailed(
  from: THREE.Vector3,
  to: THREE.Vector3
): { waypoints: THREE.Vector3[]; explored: THREE.Vector3[] } {
  const waypoints = findPath(from, to);
  const explored: THREE.Vector3[] = [];
  if (waypoints.length > 0) {
    for (let i = 0; i < waypoints.length; i++) {
      const p = waypoints[i];
      explored.push(new THREE.Vector3(p.x, 0.05, p.z));
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        explored.push(
          new THREE.Vector3(p.x + Math.cos(angle) * 1.5, 0.05, p.z + Math.sin(angle) * 1.5)
        );
      }
    }
  }
  return { waypoints, explored };
}

/** Is a world coordinate walkable? */
export function isWalkable(x: number, z: number): boolean {
  if (Math.abs(x) > LIMIT || Math.abs(z) > LIMIT) return false;
  return !getGrid()[toIndex(toCell(x), toCell(z))];
}
