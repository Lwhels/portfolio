import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Voxel typography: a 5x7 bitmap font whose "on" pixels are extruded as
 * small cubes and merged into a single BufferGeometry per glyph. Zero network
 * font loading, one draw call per letter, and a data-viz aesthetic.
 */

const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
};

export const VOXEL = 0.27;
export const GLYPH_W = 5 * VOXEL;
export const GLYPH_H = 7 * VOXEL;
const DEPTH = 0.55;

const cache = new Map<string, THREE.BufferGeometry>();

export function getGlyphGeometry(char: string): THREE.BufferGeometry {
  const key = char.toUpperCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const rows = GLYPHS[key] ?? GLYPHS.A;
  const parts: THREE.BufferGeometry[] = [];
  const cube = VOXEL * 0.9;

  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== "1") continue;
      const g = new THREE.BoxGeometry(cube, cube, DEPTH);
      g.translate(
        (c - 2) * VOXEL, // centre horizontally
        (3 - r) * VOXEL, // centre vertically
        0
      );
      parts.push(g);
    }
  });

  const utils = BufferGeometryUtils as Record<string, unknown>;
  const mergeFn = (utils.mergeGeometries || utils.mergeBufferGeometries) as ((geoms: THREE.BufferGeometry[], useGroups?: boolean) => THREE.BufferGeometry) | undefined;

  let merged: THREE.BufferGeometry | null = null;
  if (typeof mergeFn === "function") {
    try {
      merged = mergeFn(parts, false);
    } catch {
      merged = null;
    }
  }

  if (!merged) {
    merged = new THREE.BoxGeometry(GLYPH_W, GLYPH_H, DEPTH);
  }

  parts.forEach((p) => p.dispose());
  merged.computeBoundingSphere();
  cache.set(key, merged);
  return merged;
}
