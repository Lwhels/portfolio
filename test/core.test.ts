import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import { findPath, findPathDetailed } from "../app/components/3d/pathfinding";
import {
  world,
  ZONES,
  zoneAt,
  zoneName,
  wrapAngle,
  OBSTACLES,
  TOUR_STOPS,
  COLLECTIBLES,
  RACE_CHECKPOINTS,
  SPAWN,
  WAYMO,
} from "../app/components/3d/worldStore";
import { getGlyphGeometry, GLYPH_H, GLYPH_W } from "../app/components/3d/voxelFont";
import { THEMES, THEME_ORDER, ThemeId } from "../app/components/3d/themes";
import { soundFx } from "../app/components/3d/SoundController";
import { useMousePosition } from "../util/mouse";
import { renderHook } from "@testing-library/react";

describe("Pathfinding & A* Grid", () => {
  it("finds a direct path when unobstructed", () => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(3, 0, 3);
    const path = findPath(start, end);
    expect(path).toBeDefined();
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
  });

  it("finds detailed path with explored nodes wavefront", () => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(12, 0, 12);
    const { waypoints, explored } = findPathDetailed(start, end);
    expect(waypoints.length).toBeGreaterThan(0);
    expect(Array.isArray(explored)).toBe(true);
  });

  it("handles out of bounds and clamped coordinates safely", () => {
    const start = new THREE.Vector3(-999, 0, -999);
    const end = new THREE.Vector3(999, 0, 999);
    const path = findPath(start, end);
    expect(path).toBeDefined();
  });

  it("navigates around known obstacles", () => {
    // Waymo obstacle is at (-18, 0, 0) with radius 4.2
    const start = new THREE.Vector3(-25, 0, 0);
    const end = new THREE.Vector3(-10, 0, 0);
    const { waypoints } = findPathDetailed(start, end);
    expect(waypoints.length).toBeGreaterThan(0);
  });
});

describe("WorldStore Singleton & Event Bus", () => {
  beforeEach(() => {
    world.score = 0;
    world.car.pos.copy(SPAWN);
    world.clearPath();
  });

  it("handles scoring and emits score events", () => {
    let emittedScore = -1;
    const unsub = world.on("score", (s) => {
      emittedScore = s as number;
    });
    world.addScore(250);
    expect(world.score).toBe(250);
    expect(emittedScore).toBe(250);
    unsub();
  });

  it("manages pad toggles", () => {
    world.togglePad("density", true);
    expect(world.pads.density).toBe(true);
    world.togglePad("density");
    expect(world.pads.density).toBe(false);
  });

  it("manages zone resolution and events", () => {
    let currentZone = "";
    const unsub = world.on("zone", (z) => {
      currentZone = z as string;
    });
    world.setZone("waymo");
    expect(world.zone).toBe("waymo");
    expect(currentZone).toBe("waymo");
    unsub();

    const zName = zoneName("waymo");
    expect(zName).toContain("Waymo");

    const zNearWaymo = zoneAt(-18, 0);
    expect(zNearWaymo).toBe("waymo");

    const zPlains = zoneAt(50, 50);
    expect(zPlains).toBe("plains");
  });

  it("wraps angles correctly in (-PI, PI]", () => {
    expect(wrapAngle(0)).toBeCloseTo(0);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI * 3)).toBeCloseTo(Math.PI);
  });

  it("manages tour navigation", () => {
    world.startTour(0);
    expect(world.tourActive).toBe(true);
    expect(world.tourStopIndex).toBe(0);

    world.nextTourStop();
    expect(world.tourStopIndex).toBe(1);

    world.prevTourStop();
    expect(world.tourStopIndex).toBe(0);

    world.stopTour();
    expect(world.tourActive).toBe(false);
  });

  it("manages time trial race, checkpoints, and ghost trail", () => {
    world.startRace();
    expect(world.raceActive).toBe(true);
    expect(world.raceCheckpoint).toBe(0);

    world.recordLapSample();
    expect(world.currentLapTrail.length).toBeGreaterThan(0);

    for (let cp = 1; cp < RACE_CHECKPOINTS.length; cp++) {
      world.passCheckpoint(cp);
    }
    // Finish race by passing checkpoint 0
    world.passCheckpoint(0);
    expect(world.raceActive).toBe(false);

    world.generateDefaultGhostTrail();
    expect(world.ghostTrail.length).toBeGreaterThan(0);
  });

  it("handles collectibles", () => {
    const item = COLLECTIBLES[0];
    world.collectArtifact(item.id);
    expect(world.collectedSet.has(item.id)).toBe(true);

    // Collect all
    COLLECTIBLES.forEach((c) => world.collectArtifact(c.id));
    expect(world.collectedSet.size).toBe(COLLECTIBLES.length);
  });

  it("manages EMP pulse and cooldown", () => {
    world.lastEmpTime = 0;
    const fired = world.triggerEmp();
    expect(fired).toBe(true);
    expect(world.empToken).toBeGreaterThan(0);
    expect(world.empActive).toBe(true);

    // Immediately re-trigger should fail due to cooldown
    const retriggered = world.triggerEmp();
    expect(retriggered).toBe(false);
  });

  it("toggles LiDAR and Telemetry modes", () => {
    world.toggleLidar(true);
    expect(world.lidarEnabled).toBe(true);
    world.toggleLidar();
    expect(world.lidarEnabled).toBe(false);

    world.toggleTelemetry(true);
    expect(world.telemetryOpen).toBe(true);
    world.toggleTelemetry();
    expect(world.telemetryOpen).toBe(false);
  });

  it("manages circuit autopilot and path clear", () => {
    world.toggleCircuitAutopilot();
    expect(world.circuitAutopilot).toBe(true);
    expect(world.path.length).toBeGreaterThan(0);

    world.toggleCircuitAutopilot();
    expect(world.circuitAutopilot).toBe(false);
  });

  it("emits particle bursts", () => {
    const mockEmit = vi.fn();
    world.emitParticle = mockEmit;

    world.burst(new THREE.Vector3(0, 0, 0), "#06b6d4", 10, 5);
    expect(mockEmit).toHaveBeenCalled();

    world.burst(new THREE.Vector3(0, 0, 0), "#06b6d4", 5, 5, { implode: true });
    expect(mockEmit).toHaveBeenCalled();
  });

  it("handles car state saving, restoring, toast, and requests", () => {
    world.saveCarState();
    world.restoreCarState();
    world.toast("Simulation ready");
    world.requestRebuild();
    expect(world.rebuildToken).toBeGreaterThan(0);
    world.requestFire();
    world.requestOpenProject({ slug: "Waymo" });
  });
});

describe("Voxel Font & Themes", () => {
  it("provides valid glyph geometry for characters", () => {
    const geomA = getGlyphGeometry("A");
    expect(geomA).toBeDefined();
    expect(geomA.attributes.position).toBeDefined();

    const geomUnknown = getGlyphGeometry("?");
    expect(geomUnknown).toBeDefined();
  });

  it("defines standard dimensions", () => {
    expect(GLYPH_H).toBeGreaterThan(0);
    expect(GLYPH_W).toBeGreaterThan(0);
  });

  it("contains all theme definitions", () => {
    THEME_ORDER.forEach((id) => {
      const theme = THEMES[id];
      expect(theme).toBeDefined();
      expect(theme.primary).toBeDefined();
      expect(theme.secondary).toBeDefined();
      expect(theme.accent).toBeDefined();
    });
  });
});

describe("SoundController Synthesizers", () => {
  it("initializes and unlocks audio context", () => {
    soundFx.init();
    soundFx.unlock();
    expect(soundFx.getAudioEnergy()).toBeGreaterThan(0);
  });

  it("plays various synthesized audio cues", () => {
    soundFx.playHapticTick();
    soundFx.playChime();
    soundFx.playChimeSound();
    soundFx.playCollisionSound(1.0, { x: 0, y: 1, z: 0 });
    soundFx.playFireSound({ x: 0, y: 1, z: 0 }, 0);
    soundFx.playHitSound({ x: 0, y: 1, z: 0 });
    soundFx.playJumpSound();
    soundFx.playClickSound();
    soundFx.playPadSound(true);
    soundFx.playPadSound(false);
    soundFx.playRebuildSound();
    soundFx.playRingSound();
    soundFx.playZoneChime(110);
    soundFx.playChord(110);
    soundFx.playEmpSound({ x: 0, y: 1, z: 0 });
    soundFx.playLidarChirp(true);
    soundFx.playLidarChirp(false);
  });

  it("toggles and updates mute state and listener", () => {
    const muted = soundFx.toggleMute();
    expect(typeof muted).toBe("boolean");
    soundFx.setMuted(false);
    expect(soundFx.getMuted()).toBe(false);

    soundFx.setVolume(0.8);
    expect(soundFx.getVolume()).toBeCloseTo(0.8);
    soundFx.setAmbient(true);
    expect(soundFx.getAmbient()).toBe(true);
    soundFx.setAmbient(false);
    expect(soundFx.getAmbient()).toBe(false);
    soundFx.toggleBgm();
    expect(typeof soundFx.getBgm()).toBe("boolean");
    soundFx.startEngine();
    soundFx.playNote(440, 0.4);
  });
});

describe("useMousePosition Utility", () => {
  it("tracks mouse coordinates on window move", () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current.x).toBe(0);
    expect(result.current.y).toBe(0);

    const { act } = require("@testing-library/react");
    act(() => {
      const event = new MouseEvent("mousemove", { clientX: 120, clientY: 240 });
      window.dispatchEvent(event);
    });

    expect(result.current.x).toBe(120);
    expect(result.current.y).toBe(240);
  });
});
