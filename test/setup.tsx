import "@testing-library/jest-dom";
import { vi } from "vitest";
import * as THREE from "three";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as any);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
} as any;

// Mock global.fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
}) as any;

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Three.js Mock properties on HTMLElement for R3F mock nodes
Object.defineProperties(HTMLElement.prototype, {
  position: {
    get() {
      if (!this._mockPos) {
        this._mockPos = new THREE.Vector3();
        const posAttr = this.getAttribute && this.getAttribute("position");
        if (posAttr) {
          const parts = String(posAttr).split(",").map(Number);
          if (parts.length === 3 && !parts.some(isNaN)) {
            this._mockPos.set(parts[0], parts[1], parts[2]);
          }
        }
      }
      return this._mockPos;
    },
    set(v) {
      if (!this._mockPos) this._mockPos = new THREE.Vector3();
      if (Array.isArray(v)) this._mockPos.set(v[0], v[1], v[2]);
      else if (v && typeof v === "object") this._mockPos.copy(v);
    },
    configurable: true,
  },
  rotation: {
    get() {
      if (!this._mockRot) {
        this._mockRot = new THREE.Euler();
      }
      return this._mockRot;
    },
    set(v) {
      if (!this._mockRot) this._mockRot = new THREE.Euler();
      if (Array.isArray(v)) this._mockRot.set(v[0], v[1], v[2]);
    },
    configurable: true,
  },
  scale: {
    get() {
      if (!this._mockScale) {
        this._mockScale = new THREE.Vector3(1, 1, 1);
      }
      return this._mockScale;
    },
    set(v) {
      if (!this._mockScale) this._mockScale = new THREE.Vector3(1, 1, 1);
      if (Array.isArray(v)) this._mockScale.set(v[0], v[1], v[2]);
      else if (typeof v === "number") this._mockScale.set(v, v, v);
    },
    configurable: true,
  },
  quaternion: {
    get() {
      if (!this._mockQuat) {
        this._mockQuat = new THREE.Quaternion();
      }
      return this._mockQuat;
    },
    configurable: true,
  },
  geometry: {
    get() {
      if (!this._mockGeom) {
        this._mockGeom = {
          attributes: {
            position: { needsUpdate: false, array: new Float32Array(600) },
            color: { needsUpdate: false, array: new Float32Array(600) },
          },
          computeVertexNormals: vi.fn(),
        };
      }
      return this._mockGeom;
    },
    configurable: true,
  },
  material: {
    get() {
      if (!this._mockMat) {
        this._mockMat = {
          opacity: 1,
          emissiveIntensity: 1,
          color: { set: vi.fn(), r: 1, g: 1, b: 1 },
        };
      }
      return this._mockMat;
    },
    configurable: true,
  },
  instanceMatrix: {
    get() {
      if (!this._mockInstMat) {
        this._mockInstMat = { needsUpdate: false };
      }
      return this._mockInstMat;
    },
    configurable: true,
  },
  setMatrixAt: {
    value: vi.fn(),
    writable: true,
    configurable: true,
  },
  getMatrixAt: {
    value: vi.fn(),
    writable: true,
    configurable: true,
  },
  setColorAt: {
    value: vi.fn(),
    writable: true,
    configurable: true,
  },
  target: {
    get() {
      if (!this._mockTarget) {
        this._mockTarget = {
          position: {
            x: 0,
            y: 0,
            z: 0,
            set: vi.fn(),
          },
        };
      }
      return this._mockTarget;
    },
    configurable: true,
  },
  add: {
    value: vi.fn(),
    writable: true,
    configurable: true,
  },
  remove: {
    value: vi.fn(),
    writable: true,
    configurable: true,
  },
});

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId) => {
  if (contextId === "2d") {
    return {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 10 }),
      set strokeStyle(val: any) {},
      set fillStyle(val: any) {},
      set lineWidth(val: any) {},
    };
  }
  return {
    getExtension: vi.fn(),
    getParameter: vi.fn(),
    createShader: vi.fn(),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    createProgram: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    useProgram: vi.fn(),
  };
}) as any;

// Mock Web Audio API
class MockAudioNode {
  connect() { return this; }
  disconnect() {}
}

class MockAudioParam {
  value = 0;
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  setTargetAtTime() { return this; }
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockOscillatorNode extends MockAudioNode {
  frequency = new MockAudioParam();
  type = "sine";
  start() {}
  stop() {}
}

class MockBiquadFilterNode extends MockAudioNode {
  frequency = new MockAudioParam();
  type = "lowpass";
}

class MockPannerNode extends MockAudioNode {
  positionX = new MockAudioParam();
  positionY = new MockAudioParam();
  positionZ = new MockAudioParam();
  orientationX = new MockAudioParam();
  orientationY = new MockAudioParam();
  orientationZ = new MockAudioParam();
  setPosition() {}
  setOrientation() {}
}

class MockAnalyserNode extends MockAudioNode {
  fftSize = 64;
  smoothingTimeConstant = 0.8;
  frequencyBinCount = 32;
  getByteFrequencyData(arr: Uint8Array) {
    arr.fill(10);
  }
}

class MockAudioContext {
  state = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = new MockAudioNode();
  listener = {
    positionX: new MockAudioParam(),
    positionY: new MockAudioParam(),
    positionZ: new MockAudioParam(),
    forwardX: new MockAudioParam(),
    forwardY: new MockAudioParam(),
    forwardZ: new MockAudioParam(),
    upX: new MockAudioParam(),
    upY: new MockAudioParam(),
    upZ: new MockAudioParam(),
    setPosition: vi.fn(),
    setOrientation: vi.fn(),
  };

  createGain() { return new MockGainNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createPanner() { return new MockPannerNode(); }
  createAnalyser() { return new MockAnalyserNode(); }
  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: () => new Float32Array(length),
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  resume() { return Promise.resolve(); }
}

// Attach audio context to window
(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;

// Polyfill HTMLCollection.prototype.forEach for Three.js group.children
if (!(HTMLCollection.prototype as any).forEach) {
  (HTMLCollection.prototype as any).forEach = Array.prototype.forEach;
}

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(() => {
    const error = new Error("NEXT_NOT_FOUND");
    (error as any).digest = "NEXT_NOT_FOUND";
    throw error;
  }),
}));

// Mock Next.js fonts
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "font-inter", variable: "--font-inter" }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ className: "font-cal", variable: "--font-cal" }),
}));

// Frame callbacks registered by useFrame
export const frameCallbacks: Array<(state: any, delta: number) => void> = [];
export function runFrame(delta = 0.016) {
  const mockState = {
    clock: { getElapsedTime: () => performance.now() * 0.001 },
    camera: { position: { lerp: vi.fn(), set: vi.fn(), x: 0, y: 0, z: 0 }, lookAt: vi.fn() },
    scene: {},
    raycaster: {
      setFromCamera: vi.fn(),
      intersectObject: vi.fn().mockReturnValue([{ point: { x: 5, y: 0, z: 5 } }]),
    },
    pointer: { x: 0, y: 0 },
  };
  frameCallbacks.forEach((cb) => {
    try {
      cb(mockState, delta);
    } catch {
      // ignore
    }
  });
}

// Mock @react-three/fiber
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children, onCreated }: any) => {
    if (onCreated) onCreated();
    return <div data-testid="r3f-canvas">{children}</div>;
  },
  useFrame: (callback: any) => {
    frameCallbacks.push(callback);
  },
  useThree: () => ({
    camera: {
      position: { lerp: vi.fn(), set: vi.fn(), clone: () => ({ lerp: vi.fn() }) },
      lookAt: vi.fn(),
    },
    scene: {},
    gl: {
      domElement: document.createElement("canvas"),
      getPixelRatio: () => 1,
      setSize: vi.fn(),
      render: vi.fn(),
    },
    raycaster: {
      setFromCamera: vi.fn(),
      intersectObject: vi.fn().mockReturnValue([{ point: { x: 5, y: 0, z: 5 } }]),
    },
    pointer: { x: 0, y: 0 },
    clock: { getElapsedTime: () => 1.0 },
  }),
}));

// Mock @react-three/drei
vi.mock("@react-three/drei", () => ({
  Html: ({ children }: any) => <div data-testid="drei-html">{children}</div>,
  Grid: () => <div data-testid="drei-grid" />,
  OrbitControls: () => null,
}));

// Mock @upstash/redis
vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({
      incr: vi.fn().mockResolvedValue(42),
      get: vi.fn().mockResolvedValue(42),
      mget: vi.fn().mockResolvedValue([100, 200, 300, 400]),
    }),
  },
}));

// Mock contentlayer/generated
vi.mock("contentlayer/generated", () => ({
  allProjects: [
    {
      slug: "Waymo",
      title: "Waymo Data Visualizer",
      description: "High-performance internal telemetry data visualization",
      published: true,
      date: "2024-08-01",
      repository: "lwhels/waymo",
      url: "https://waymo.com",
      body: { raw: "Project content", code: "return { default: () => null };" },
    },
    {
      slug: "SolarSystem",
      title: "3D Solar System",
      description: "Interactive celestial mechanics simulation",
      published: true,
      date: "2024-07-01",
      repository: "lwhels/solarsystem",
      body: { raw: "Project content", code: "return { default: () => null };" },
    },
    {
      slug: "Math142",
      title: "Olympic Analytics",
      description: "Mathematical modeling of Summer Olympics",
      published: true,
      date: "2024-06-01",
      repository: "lwhels/math142",
      body: { raw: "Project content", code: "return { default: () => null };" },
    },
    {
      slug: "ext2",
      title: "EXT2 File System",
      description: "Custom Linux EXT2 File System Driver in C++",
      published: true,
      date: "2024-05-01",
      repository: "lwhels/ext2",
      body: { raw: "Project content", code: "return { default: () => null };" },
    },
    {
      slug: "TunnelMan",
      title: "Tale of Fennec Engine",
      description: "Custom 2D Game Engine & Pathfinding",
      published: true,
      date: "2024-04-01",
      repository: "lwhels/tunnelman",
      body: { raw: "Project content", code: "return { default: () => null };" },
    },
    {
      slug: "BetFree",
      title: "BetFree Sportsbook",
      description: "Real-time sports odds platform",
      published: true,
      date: "2024-03-01",
      repository: "lwhels/betfree",
      body: { raw: "Project content", code: "return { default: () => null };" },
    },
  ],
}));
