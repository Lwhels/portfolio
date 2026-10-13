"use client";

import * as THREE from "three";

/**
 * World store
 * -----------
 * A mutable singleton shared by the 3D scene and the HUD.
 *
 * Everything that changes every frame (car telemetry, input, shader params,
 * particles) lives here and is mutated in place, so we never trigger React
 * re-renders from inside the render loop. Low-frequency UI events (score,
 * zone changes, pad toggles, tour, race, collectibles) are broadcast through pub/sub.
 */

export type RoverSkin = "sports" | "tank" | "jet" | "quantum";
export type CameraPreset =
  | "vehicle"
  | "cockpit"
  | "hero"
  | "projects"
  | "dataviz"
  | "arcade"
  | "contact"
  | "waymo"
  | "overview";

export type ZoneId = "hero" | "waymo" | "dataviz" | "projects" | "arcade" | "contact" | "plains";

export interface ZoneDef {
  id: ZoneId;
  name: string;
  short: string;
  center: [number, number]; // x, z
  radius: number;
  /** Root frequency (Hz) of the zone's ambient spatial drone */
  drone: number;
}

/* -------------------------------------------------------------------------- */
/*                                World layout                                */
/* -------------------------------------------------------------------------- */

export const WORLD_HALF = 55;
export const SPAWN = new THREE.Vector3(0, 0, 6);
export const SPAWN_HEADING = Math.PI; // facing -Z, towards the title

export const ZONES: ZoneDef[] = [
  { id: "hero", name: "Hero Hub", short: "Hero", center: [0, -8], radius: 13, drone: 110 },
  { id: "waymo", name: "Waymo Tech Pavilion", short: "Waymo", center: [-18, 0], radius: 11, drone: 123.47 },
  { id: "dataviz", name: "Data Viz Lab", short: "Data Viz", center: [29, -2], radius: 15, drone: 146.83 },
  { id: "projects", name: "Project Holograph Vault", short: "Projects", center: [-2, 22], radius: 16, drone: 130.81 },
  { id: "arcade", name: "Arcade & Physics", short: "Arcade", center: [2, -33], radius: 14, drone: 164.81 },
  { id: "contact", name: "Contact Portal", short: "Contact", center: [-30, -14], radius: 11, drone: 98 },
];

export const WAYMO = {
  pos: new THREE.Vector3(-18, 0, 0),
  radius: 6,
};

export const PROJECT_POSITIONS: [number, number, number][] = [
  [-22, 0, 15],
  [-15, 0, 21],
  [-8, 0, 26],
  [0, 0, 28],
  [8, 0, 26],
  [15, 0, 21],
  [22, 0, 15],
];

export const DATAVIZ = {
  bars: new THREE.Vector3(21, 0, -14),
  surface: new THREE.Vector3(36, 0, -14),
  field: new THREE.Vector3(30, 5.5, 1),
  pads: [
    { id: "density" as const, label: "Density", pos: new THREE.Vector3(24, 0, 11) },
    { id: "entropy" as const, label: "Entropy", pos: new THREE.Vector3(30, 0, 12) },
    { id: "harmonics" as const, label: "Harmonics", pos: new THREE.Vector3(36, 0, 11) },
  ],
};

export const HERO = {
  titleZ: -6,
  lorenz: new THREE.Vector3(0, 9, -15),
  julia: new THREE.Vector3(-16, 0, -9),
  rebuildPad: new THREE.Vector3(13, 0, -2),
};

export const ARCADE = {
  ramp: new THREE.Vector3(0, 0, -20),
  rings: [
    new THREE.Vector3(0, 3.6, -28.5),
    new THREE.Vector3(0, 4.4, -33),
    new THREE.Vector3(0, 3.4, -38),
  ],
  pyramid: new THREE.Vector3(-15, 0, -34),
  targetsCenter: new THREE.Vector3(17, 0, -34),
};

export const CONTACT = {
  portal: new THREE.Vector3(-30, 0, -14),
};

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

/** Static circular colliders – used by rover physics and A* grid. */
export const OBSTACLES: Obstacle[] = [
  ...PROJECT_POSITIONS.map(([x, , z]) => ({ x, z, r: 2.7 })),
  { x: CONTACT.portal.x, z: CONTACT.portal.z, r: 4.6 },
  { x: WAYMO.pos.x, z: WAYMO.pos.z, r: 4.2 },
  { x: DATAVIZ.bars.x, z: DATAVIZ.bars.z, r: 4.0 },
  { x: DATAVIZ.surface.x, z: DATAVIZ.surface.z, r: 5.6 },
  { x: HERO.julia.x, z: HERO.julia.z, r: 1.6 },
  { x: -WORLD_HALF, z: -WORLD_HALF, r: 1 },
  { x: WORLD_HALF, z: -WORLD_HALF, r: 1 },
  { x: -WORLD_HALF, z: WORLD_HALF, r: 1 },
  { x: WORLD_HALF, z: WORLD_HALF, r: 1 },
];

/* -------------------------------------------------------------------------- */
/*                                 Guided Tour                                */
/* -------------------------------------------------------------------------- */

export interface TourStop {
  id: string;
  name: string;
  zone: ZoneId;
  targetPos: [number, number]; // x, z
  targetHeading: number;
  title: string;
  description: string;
  highlights: string[];
}

export const TOUR_STOPS: TourStop[] = [
  {
    id: "hero",
    name: "Hero Hub",
    zone: "hero",
    targetPos: [0, 4],
    targetHeading: Math.PI,
    title: "Welcome to Lucas Wheeler's 3D Vault",
    description: "Interactive spatial showcase engineered by Lucas Wheeler (Mathematics of Computation @ UCLA, GPA 3.964).",
    highlights: ["Real-time 3D Graphics", "Custom Vehicle Dynamics", "Interactive Audio Synths"],
  },
  {
    id: "waymo",
    name: "Waymo Tech Pavilion",
    zone: "waymo",
    targetPos: [-14, 0],
    targetHeading: -Math.PI / 2,
    title: "Waymo Software Engineer Internship",
    description: "Spearheaded internal telemetry plotting tools. Accelerated autocomplete 400x (C++ server) and load speed 10x with downsampling.",
    highlights: ["Ranked #1 Code Count", "C++, gRPC, Protobuf", "Three.js & D3.js Visualization"],
  },
  {
    id: "projects",
    name: "Project Holograph Amphitheater",
    zone: "projects",
    targetPos: [0, 16],
    targetHeading: 0,
    title: "Project Hologram Vault",
    description: "Interactive holographic amphitheater displaying 3D Solar System, EXT-2 Filesystem, BetFree, Polymarket, and more.",
    highlights: ["3D Holographic Pedestals", "One-Click Case Studies", "Proximity Sensors"],
  },
  {
    id: "dataviz",
    name: "Data Viz & Math Lab",
    zone: "dataviz",
    targetPos: [20, -2],
    targetHeading: Math.PI / 2,
    title: "Chaos Theory & Mathematical Dynamics",
    description: "Live Lorenz Strange Attractor, Julia set fractal, and real-time 3D parametric harmonic wave surfaces.",
    highlights: ["Lorenz Strange Attractor", "Julia Complex Fractal", "Interactive Parameter Pads"],
  },
  {
    id: "arcade",
    name: "Arcade Physics & Mini-Games",
    zone: "arcade",
    targetPos: [2, -20],
    targetHeading: Math.PI,
    title: "Arcade Physics & Mini-Games",
    description: "Supersonic jump ramps through airborne rings, pinball force bumpers, and dynamic projectile target shooting.",
    highlights: ["Ring Jump Physics", "Moving Target Shooter", "Drift Mini-Turbo Boost"],
  },
  {
    id: "contact",
    name: "Contact Portal",
    zone: "contact",
    targetPos: [-24, -14],
    targetHeading: -Math.PI / 2,
    title: "Contact Portal",
    description: "Connect with Lucas for full-time SWE roles, systems engineering, 3D graphics, or technical collaborations.",
    highlights: ["Cupertino & Los Angeles", "wheeler.lucas2002@gmail.com", "Resume Download Available"],
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Time Trial                                 */
/* -------------------------------------------------------------------------- */

export interface RaceCheckpoint {
  id: number;
  pos: THREE.Vector3;
  heading: number;
  radius: number;
}

export interface LapPoint {
  t: number;
  x: number;
  z: number;
  heading: number;
}

export const RACE_CHECKPOINTS: RaceCheckpoint[] = [
  { id: 0, pos: new THREE.Vector3(0, 0, 36), heading: 0, radius: 5.5 },
  { id: 1, pos: new THREE.Vector3(34, 0, 22), heading: Math.PI / 4, radius: 5.0 },
  { id: 2, pos: new THREE.Vector3(42, 0, -20), heading: Math.PI / 2, radius: 5.0 },
  { id: 3, pos: new THREE.Vector3(4, 0, -44), heading: Math.PI, radius: 5.5 },
  { id: 4, pos: new THREE.Vector3(-38, 0, -24), heading: -Math.PI / 2, radius: 5.0 },
  { id: 5, pos: new THREE.Vector3(-34, 0, 22), heading: -Math.PI / 4, radius: 5.0 },
];

/* -------------------------------------------------------------------------- */
/*                                Collectibles                                */
/* -------------------------------------------------------------------------- */

export interface CollectibleDef {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
  symbol: string;
  lore: string;
}

export const COLLECTIBLES: CollectibleDef[] = [
  {
    id: "paw",
    name: "Golden Bruin Paw",
    pos: [10, 1.2, -4],
    color: "#f59e0b",
    symbol: "🐻",
    lore: "UCLA Mathematics of Computation pride. GPA 3.964.",
  },
  {
    id: "euler",
    name: "Euler's Formula",
    pos: [0, 2.5, -15],
    color: "#8b5cf6",
    symbol: "e^iπ",
    lore: "e^(iπ) + 1 = 0. The most beautiful equation in mathematics.",
  },
  {
    id: "lidar",
    name: "Waymo LiDAR Puck",
    pos: [-18, 1.8, 0],
    color: "#06b6d4",
    symbol: "📡",
    lore: "Autonomous sensing: 400x faster autocomplete, 10x faster load.",
  },
  {
    id: "turing",
    name: "Turing Tape",
    pos: [-6, 1.2, 28],
    color: "#10b981",
    symbol: "💾",
    lore: "Foundational theory of computation and automata.",
  },
  {
    id: "matrix",
    name: "Quantum Matrix Glyph",
    pos: [17, 1.5, -34],
    color: "#ec4899",
    symbol: "⚛️",
    lore: "Linear algebra, eigenstates, and high-performance graphics shaders.",
  },
];

/* -------------------------------------------------------------------------- */
/*                                  Store                                     */
/* -------------------------------------------------------------------------- */

type EventName =
  | "score"
  | "zone"
  | "pads"
  | "path"
  | "toast"
  | "rebuild"
  | "openProject"
  | "openProjectArchive"
  | "tour"
  | "race"
  | "collectibles"
  | "turbo"
  | "autopilot"
  | "lidar"
  | "telemetry"
  | "emp";

type Listener = (payload?: unknown) => void;

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  drift: boolean;
  joyX: number;
  joyY: number;
  touchBoost: boolean;
}

export interface MathParams {
  frequency: number;
  amplitude: number;
  morph: number;
  juliaIter: number;
  juliaSpeed: number;
  lorenzRho: number;
}

export interface PadState {
  density: boolean;
  entropy: boolean;
  harmonics: boolean;
}

export type PadId = keyof PadState;

class WorldStore {
  input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    drift: false,
    joyX: 0,
    joyY: 0,
    touchBoost: false,
  };

  car = {
    pos: SPAWN.clone(),
    heading: SPAWN_HEADING,
    speed: 0,
    boosting: false,
    drifting: false,
    inAir: false,
    maxSpeed: 22,
    headlights: true,
    driftCharge: 0, // 0 to 1
    hasTurbo: false,
  };

  /** Click-to-move & Pathfinding */
  path: THREE.Vector3[] = [];
  pathIndex = 0;
  pathTarget: THREE.Vector3 | null = null;
  exploredPathNodes: THREE.Vector3[] = []; // Live A* search wavefront

  /** Guided Tour State */
  tourActive = false;
  tourStopIndex = 0;
  circuitAutopilot = false;

  /** Race State */
  raceActive = false;
  raceStartTime = 0;
  raceCurrentLapTime = 0;
  raceBestTime: number | null = null;
  raceCheckpoint = 0;
  currentLapTrail: LapPoint[] = [];
  ghostTrail: LapPoint[] = [];
  lastSampleTime = 0;

  /** Collectibles */
  collectedSet = new Set<string>();

  params: MathParams = {
    frequency: 0.8,
    amplitude: 1.0,
    morph: 0.0,
    juliaIter: 96,
    juliaSpeed: 1.0,
    lorenzRho: 28,
  };

  pads: PadState = { density: false, entropy: false, harmonics: false };

  score = 0;
  ringsCleared = 0;
  zone: ZoneId = "hero";
  rebuildToken = 0;
  fireRequested = false;
  activeProjectiles: { pos: THREE.Vector3; vel: THREE.Vector3; active: boolean }[] = [];

  /** LiDAR Autonomous Sensor View */
  lidarEnabled = false;

  /** Waymo Telemetry Drawer */
  telemetryOpen = false;

  /** EMP Shockwave ability */
  empToken = 0;
  empActive = false;
  empPos = new THREE.Vector3();
  lastEmpTime = 0;
  empCooldownSec = 3.5;

  stats = { fps: 0, frameMs: 0, calls: 0, triangles: 0, points: 0, lines: 0 };

  private listeners = new Map<EventName, Set<Listener>>();

  on(evt: EventName, fn: Listener): () => void {
    let set = this.listeners.get(evt);
    if (!set) {
      set = new Set();
      this.listeners.set(evt, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
    };
  }

  emit(evt: EventName, payload?: unknown) {
    this.listeners.get(evt)?.forEach((fn) => fn(payload));
  }

  /* ----------------------------- convenience ----------------------------- */

  toggleLidar(force?: boolean) {
    this.lidarEnabled = force !== undefined ? force : !this.lidarEnabled;
    this.emit("lidar", this.lidarEnabled);
    this.toast(this.lidarEnabled ? "📡 LiDAR 360° Point Cloud Scan ACTIVE" : "LiDAR Sensor Mode Disengaged");
  }

  toggleTelemetry(force?: boolean) {
    this.telemetryOpen = force !== undefined ? force : !this.telemetryOpen;
    this.emit("telemetry", this.telemetryOpen);
  }

  triggerEmp(): boolean {
    const now = performance.now();
    const elapsed = (now - this.lastEmpTime) / 1000;
    if (this.lastEmpTime > 0 && elapsed < this.empCooldownSec) {
      const remaining = (this.empCooldownSec - elapsed).toFixed(1);
      this.toast(`⚠️ EMP Recharging (${remaining}s remaining)`);
      return false;
    }
    this.lastEmpTime = now;
    this.empToken++;
    this.empPos.copy(this.car.pos);
    this.empActive = true;
    this.burst(this.car.pos, "#38bdf8", 45, 12, { size: 0.55 });
    this.toast("💥 EMP SHOCKWAVE PULSE RELEASED!");
    this.emit("emp", { token: this.empToken, pos: this.empPos.clone() });
    return true;
  }

  addScore(points: number) {
    this.score += points;
    this.emit("score", this.score);
  }

  togglePad(id: PadId, value?: boolean) {
    this.pads[id] = value ?? !this.pads[id];
    this.emit("pads", { ...this.pads });
  }

  setZone(z: ZoneId) {
    if (z === this.zone) return;
    this.zone = z;
    this.emit("zone", z);
  }

  requestRebuild() {
    this.rebuildToken++;
    this.emit("rebuild", this.rebuildToken);
  }

  requestFire() {
    this.fireRequested = true;
  }

  requestOpenProject(project: unknown) {
    this.saveCarState();
    this.emit("openProject", project);
  }

  saveCarState() {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("rover_pos_x", this.car.pos.x.toFixed(3));
        sessionStorage.setItem("rover_pos_y", this.car.pos.y.toFixed(3));
        sessionStorage.setItem("rover_pos_z", this.car.pos.z.toFixed(3));
        sessionStorage.setItem("rover_heading", this.car.heading.toFixed(3));
      } catch {
        // ignore storage errors
      }
    }
  }

  restoreCarState() {
    if (typeof window !== "undefined") {
      try {
        const x = sessionStorage.getItem("rover_pos_x");
        const y = sessionStorage.getItem("rover_pos_y");
        const z = sessionStorage.getItem("rover_pos_z");
        const h = sessionStorage.getItem("rover_heading");
        if (x !== null && y !== null && z !== null && h !== null) {
          this.car.pos.set(parseFloat(x), parseFloat(y), parseFloat(z));
          this.car.heading = parseFloat(h);
          this.car.speed = 0;
          return true;
        }
        const savedTrail = localStorage.getItem("rover_ghost_trail");
        if (savedTrail) {
          try {
            this.ghostTrail = JSON.parse(savedTrail);
          } catch {}
        }
        const savedBest = localStorage.getItem("rover_best_lap");
        if (savedBest) {
          this.raceBestTime = parseFloat(savedBest);
        }
        if (this.ghostTrail.length === 0) {
          this.generateDefaultGhostTrail();
        }
      } catch {
        // ignore storage errors
      }
    }
    return false;
  }

  generateDefaultGhostTrail() {
    this.raceBestTime = 25.4;
    const waypoints = [
      { x: 0, z: 36, h: 0 },
      { x: 34, z: 22, h: Math.PI / 4 },
      { x: 42, z: -20, h: Math.PI / 2 },
      { x: 4, z: -44, h: Math.PI },
      { x: -38, z: -24, h: -Math.PI / 2 },
      { x: -34, z: 22, h: -Math.PI / 4 },
      { x: 0, z: 36, h: 0 },
    ];
    const totalTime = 25.4;
    const steps = 140;
    this.ghostTrail = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const t = u * totalTime;
      const segFloat = u * (waypoints.length - 1);
      const segIdx = Math.min(Math.floor(segFloat), waypoints.length - 2);
      const segT = segFloat - segIdx;
      const p0 = waypoints[segIdx];
      const p1 = waypoints[segIdx + 1];
      const x = p0.x + (p1.x - p0.x) * segT;
      const z = p0.z + (p1.z - p0.z) * segT;
      const heading = p0.h + (p1.h - p0.h) * segT;
      this.ghostTrail.push({ t, x, z, heading });
    }
  }

  setPath(points: THREE.Vector3[], target: THREE.Vector3 | null, explored: THREE.Vector3[] = []) {
    this.path = points;
    this.pathIndex = 0;
    this.pathTarget = target;
    this.exploredPathNodes = explored;
    this.emit("path", target);
  }

  clearPath() {
    this.circuitAutopilot = false;
    if (!this.pathTarget && this.path.length === 0) return;
    this.setPath([], null);
  }

  toggleCircuitAutopilot() {
    this.circuitAutopilot = !this.circuitAutopilot;
    if (this.circuitAutopilot) {
      const circuitWaypoints = RACE_CHECKPOINTS.map((g) => g.pos.clone());
      circuitWaypoints.push(RACE_CHECKPOINTS[0].pos.clone());
      this.setPath(circuitWaypoints, circuitWaypoints[circuitWaypoints.length - 1]);
      this.toast("🤖 Autonomous Circuit Autopilot Engaged!");
    } else {
      this.clearPath();
      this.toast("Manual Control Restored");
    }
    this.emit("autopilot", this.circuitAutopilot);
  }

  /* ----------------------------- Guided Tour ----------------------------- */

  startTour(startIndex = 0) {
    this.tourActive = true;
    this.tourStopIndex = startIndex;
    const stop = TOUR_STOPS[startIndex];
    this.setZone(stop.zone);
    this.emit("tour", { active: true, stopIndex: startIndex, stop });
  }

  nextTourStop() {
    if (!this.tourActive) return;
    const nextIdx = (this.tourStopIndex + 1) % TOUR_STOPS.length;
    this.tourStopIndex = nextIdx;
    const stop = TOUR_STOPS[nextIdx];
    this.setZone(stop.zone);
    this.emit("tour", { active: true, stopIndex: nextIdx, stop });
  }

  prevTourStop() {
    if (!this.tourActive) return;
    const prevIdx = (this.tourStopIndex - 1 + TOUR_STOPS.length) % TOUR_STOPS.length;
    this.tourStopIndex = prevIdx;
    const stop = TOUR_STOPS[prevIdx];
    this.setZone(stop.zone);
    this.emit("tour", { active: true, stopIndex: prevIdx, stop });
  }

  stopTour() {
    this.tourActive = false;
    this.emit("tour", { active: false, stopIndex: this.tourStopIndex, stop: null });
  }

  /* ----------------------------- Time Trial ------------------------------ */

  startRace() {
    this.raceActive = true;
    this.raceStartTime = performance.now();
    this.raceCurrentLapTime = 0;
    this.raceCheckpoint = 0;
    this.currentLapTrail = [
      { t: 0, x: this.car.pos.x, z: this.car.pos.z, heading: this.car.heading },
    ];
    this.lastSampleTime = 0;
    this.toast("🏁 Time Trial Started! Hit Checkpoint 1!");
    this.emit("race", { active: true, checkpoint: 0, time: 0 });
  }

  recordLapSample() {
    if (!this.raceActive) return;
    const now = (performance.now() - this.raceStartTime) / 1000;
    this.raceCurrentLapTime = now;
    if (now - this.lastSampleTime >= 0.08) {
      this.lastSampleTime = now;
      this.currentLapTrail.push({
        t: now,
        x: this.car.pos.x,
        z: this.car.pos.z,
        heading: this.car.heading,
      });
    }
  }

  passCheckpoint(index: number) {
    if (!this.raceActive) {
      if (index === 0) {
        this.startRace();
      }
      return;
    }

    if (index === (this.raceCheckpoint + 1) % RACE_CHECKPOINTS.length) {
      this.raceCheckpoint = index;
      this.addScore(100);

      // Lap Completed!
      if (index === 0) {
        const lapTime = (performance.now() - this.raceStartTime) / 1000;
        this.raceActive = false;
        if (!this.raceBestTime || lapTime < this.raceBestTime) {
          this.raceBestTime = lapTime;
          this.ghostTrail = [...this.currentLapTrail];
          this.toast(`🏆 NEW RECORD! Lap Time: ${lapTime.toFixed(2)}s!`);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("rover_best_lap", lapTime.toFixed(2));
              localStorage.setItem("rover_ghost_trail", JSON.stringify(this.ghostTrail));
            } catch {}
          }
        } else {
          this.toast(`🏁 Lap Completed: ${lapTime.toFixed(2)}s (Best: ${this.raceBestTime.toFixed(2)}s)`);
        }
        this.emit("race", { active: false, checkpoint: 0, time: lapTime, completed: true });
        return;
      }

      this.toast(`Checkpoint ${this.raceCheckpoint} / ${RACE_CHECKPOINTS.length - 1}!`);
      this.emit("race", { active: true, checkpoint: this.raceCheckpoint, time: this.raceCurrentLapTime });
    }
  }

  /* ----------------------------- Collectibles ---------------------------- */

  collectArtifact(id: string) {
    if (this.collectedSet.has(id)) return;
    this.collectedSet.add(id);
    const item = COLLECTIBLES.find((c) => c.id === id);
    this.addScore(500);
    this.toast(`🌟 Found: ${item?.name ?? id}! (+500 pts)`);
    this.burst(this.car.pos, item?.color ?? "#f59e0b", 30, 8);

    if (this.collectedSet.size === COLLECTIBLES.length) {
      this.toast("🎉 ALL 5 ARTIFACTS COLLECTED! Quantum Skin Unlocked!");
    }
    this.emit("collectibles", {
      count: this.collectedSet.size,
      total: COLLECTIBLES.length,
      unlocked: this.collectedSet.size === COLLECTIBLES.length,
    });
  }

  toast(message: string) {
    this.emit("toast", message);
  }

  /* ------------------------------ particles ------------------------------ */
  /** Bound by <ParticleSystem/> when mounted. */
  emitParticle: (
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    color: THREE.Color,
    life: number,
    size: number,
    gravity?: number
  ) => void = () => {};

  /** Radial burst of sparks. `implode` makes them converge onto the point. */
  burst(
    pos: THREE.Vector3,
    color: THREE.Color | string,
    count = 24,
    speed = 6,
    opts: { implode?: boolean; life?: number; size?: number; gravity?: number } = {}
  ) {
    const c = typeof color === "string" ? new THREE.Color(color) : color;
    const life = opts.life ?? 0.9;
    const size = opts.size ?? 0.35;
    const gravity = opts.gravity ?? (opts.implode ? 0 : 1);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const dx = s * Math.cos(t);
      const dy = Math.abs(u) * 0.9 + 0.1;
      const dz = s * Math.sin(t);
      const sp = speed * (0.5 + Math.random() * 0.7);
      if (opts.implode) {
        const r = sp * life;
        this.emitParticle(
          pos.x + dx * r,
          pos.y + dy * r,
          pos.z + dz * r,
          -dx * sp,
          -dy * sp,
          -dz * sp,
          c,
          life,
          size,
          gravity
        );
      } else {
        this.emitParticle(pos.x, pos.y, pos.z, dx * sp, dy * sp, dz * sp, c, life, size, gravity);
      }
    }
  }
}

export const world = new WorldStore();

/** Which zone contains (x, z)? Nearest centre within its radius, else plains. */
export function zoneAt(x: number, z: number): ZoneId {
  let best: ZoneId = "plains";
  let bestD = Infinity;
  for (const zone of ZONES) {
    const dx = x - zone.center[0];
    const dz = z - zone.center[1];
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < zone.radius && d < bestD) {
      bestD = d;
      best = zone.id;
    }
  }
  return best;
}

export function zoneName(id: ZoneId): string {
  return ZONES.find((z) => z.id === id)?.name ?? "Open Datascape";
}

/** Wrap an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a <= -Math.PI) a += Math.PI * 2;
  return a;
}
