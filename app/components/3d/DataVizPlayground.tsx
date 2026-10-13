"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { soundFx } from "./SoundController";
import { useTheme } from "./themes";
import { world, DATAVIZ, HERO } from "./worldStore";

/* -------------------------------------------------------------------------- */
/*                       1. 10,000 Point Volumetric Scatter                   */
/* -------------------------------------------------------------------------- */

const POINT_COUNT = 10000;

const scatterVertexShader = /* glsl */ `
  attribute vec3 aBasePos;
  attribute float aPhase;
  uniform float uTime;
  uniform float uDensity;
  uniform float uEntropy;
  uniform float uHarmonics;
  uniform float uPixelRatio;
  varying float vIntensity;
  varying vec3 vPos;

  // Simplex-like noise helper
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 p = aBasePos;

    // Density compression / dispersion
    p *= (0.6 + uDensity * 0.8);

    // Harmonics wave displacement
    float harmonicWave = sin(p.x * 0.4 + uTime * 1.5) * cos(p.z * 0.4 + uTime * 1.5) * uHarmonics * 3.0;
    p.y += harmonicWave;

    // Entropy turbulence
    if (uEntropy > 0.05) {
      vec3 noiseOffset = vec3(
        snoise(p * 0.15 + vec3(uTime * 0.5, 0.0, 0.0)),
        snoise(p * 0.15 + vec3(0.0, uTime * 0.5, 0.0)),
        snoise(p * 0.15 + vec3(0.0, 0.0, uTime * 0.5))
      );
      p += noiseOffset * uEntropy * 4.5;
    }

    vPos = p;
    vIntensity = smoothstep(-5.0, 10.0, p.y) * (0.75 + 0.25 * sin(uTime * 0.8 + aPhase));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float ptSize = (2.2 + sin(aPhase + uTime * 1.0) * 0.4) * uPixelRatio * (60.0 / max(-mvPosition.z, 0.1));
    gl_PointSize = max(ptSize, 2.0 * uPixelRatio);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const scatterFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vIntensity;
  varying vec3 vPos;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    // Soft anti-aliased circular alpha mask with zero square quad discard edges
    float circle = smoothstep(0.5, 0.05, dist);
    float glow = exp(-3.0 * dist * dist);
    vec3 col = mix(uColorA, uColorB, sin(vPos.y * 0.3 + vPos.x * 0.2) * 0.5 + 0.5);
    gl_FragColor = vec4(col * (0.8 + glow * 0.6), circle * vIntensity * 0.85);
  }
`;

function PointScatterField() {
  const theme = useTheme();
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const basePos = new Float32Array(POINT_COUNT * 3);
    const phase = new Float32Array(POINT_COUNT);

    for (let i = 0; i < POINT_COUNT; i++) {
      // Cylindrical volumetric cluster
      const r = Math.sqrt(Math.random()) * 12;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 8;

      basePos[i * 3] = Math.cos(theta) * r;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = Math.sin(theta) * r;

      phase[i] = Math.random() * Math.PI * 2;
    }

    g.setAttribute("position", new THREE.BufferAttribute(basePos, 3));
    g.setAttribute("aBasePos", new THREE.BufferAttribute(basePos, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 30);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDensity: { value: 0 },
          uEntropy: { value: 0 },
          uHarmonics: { value: 0 },
          uColorA: { value: new THREE.Color() },
          uColorB: { value: new THREE.Color() },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
        },
        vertexShader: scatterVertexShader,
        fragmentShader: scatterFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [gl]
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uDensity.value = world.pads.density ? 1.0 : 0.0;
    material.uniforms.uEntropy.value = world.pads.entropy ? 1.0 : 0.0;
    material.uniforms.uHarmonics.value = world.pads.harmonics ? 1.0 : 0.0;

    material.uniforms.uColorA.value.set(theme.primary);
    material.uniforms.uColorB.value.set(theme.secondary);
  });

  return (
    <group position={[DATAVIZ.field.x, DATAVIZ.field.y, DATAVIZ.field.z]}>
      <points geometry={geometry} material={material} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                    2. Morphing Parametric Wave Surface                     */
/* -------------------------------------------------------------------------- */

const surfaceVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFreq;
  uniform float uAmp;
  uniform float uMorph;
  varying vec3 vNormal;
  varying float vHeight;

  void main() {
    vec3 p = position;

    // Mathematical Wave combination: Ripple + Sine grid + Morphing Lorenz-like twist
    float wave1 = sin(p.x * uFreq + uTime * 1.5) * cos(p.y * uFreq + uTime * 1.5);
    float wave2 = sin(length(p.xy) * 0.8 - uTime * 2.0) * 0.6;
    float morphTwist = sin(p.x * 0.5 + p.y * 0.5 + uTime) * uMorph * 1.5;

    float h = (wave1 + wave2 + morphTwist) * uAmp * 0.8;
    p.z = h;

    vHeight = h;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const surfaceFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vHeight;

  void main() {
    vec3 col = mix(uColorA, uColorB, vHeight * 0.4 + 0.5);
    gl_FragColor = vec4(col, 0.85);
  }
`;

function ParametricWaveSurface() {
  const theme = useTheme();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uFreq: { value: 0.8 },
          uAmp: { value: 1.0 },
          uMorph: { value: 0.0 },
          uColorA: { value: new THREE.Color() },
          uColorB: { value: new THREE.Color() },
        },
        vertexShader: surfaceVertexShader,
        fragmentShader: surfaceFragmentShader,
        wireframe: true,
        transparent: true,
      }),
    []
  );

  useFrame(({ clock }, delta) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uFreq.value = THREE.MathUtils.lerp(material.uniforms.uFreq.value, world.params.frequency, delta * 4);
    material.uniforms.uAmp.value = THREE.MathUtils.lerp(material.uniforms.uAmp.value, world.params.amplitude, delta * 4);
    material.uniforms.uMorph.value = THREE.MathUtils.lerp(material.uniforms.uMorph.value, world.params.morph, delta * 4);

    material.uniforms.uColorA.value.set(theme.secondary);
    material.uniforms.uColorB.value.set(theme.primary);
  });

  return (
    <group position={[DATAVIZ.surface.x, 1.2, DATAVIZ.surface.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh material={material}>
        <planeGeometry args={[11, 11, 32, 32]} />
      </mesh>
      {/* Platform Stand */}
      <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[6.5, 6.8, 0.4, 32]} />
        <meshStandardMaterial color={theme.surface} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                   3. 3D Bar Graph with Proximity Chords                     */
/* -------------------------------------------------------------------------- */

const BAR_CHORDS = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];

function BarChart3D() {
  const theme = useTheme();

  const barData = useMemo(() => {
    const bars = [];
    let noteIdx = 0;
    for (let x = -2.7; x <= 2.7; x += 1.8) {
      for (let z = -2.7; z <= 2.7; z += 1.8) {
        bars.push({
          x,
          z,
          baseHeight: Math.random() * 2.8 + 1.2,
          freq: BAR_CHORDS[noteIdx % BAR_CHORDS.length],
          lastTriggered: 0,
        });
        noteIdx++;
      }
    }
    return bars;
  }, []);

  const barRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const carPos = world.car.pos;
    const barWorldBase = DATAVIZ.bars;

    barData.forEach((bar, idx) => {
      const mesh = barRefs.current[idx];
      const mat = matRefs.current[idx];
      if (!mesh || !mat) return;

      const barPos = new THREE.Vector3(barWorldBase.x + bar.x, 0, barWorldBase.z + bar.z);
      const distToCar = carPos.distanceTo(barPos);
      const isProximityHit = distToCar < 1.8;

      if (isProximityHit && time - bar.lastTriggered > 0.45) {
        bar.lastTriggered = time;
        soundFx.playNote(bar.freq, 0.5);
        world.burst(barPos.setY(mesh.scale.y), theme.accent, 8, 3, { size: 0.2 });
      }

      const targetH = isProximityHit
        ? bar.baseHeight + 2.5
        : bar.baseHeight + Math.sin(time * 2.5 + bar.x * 0.8 + bar.z * 0.8) * 0.8;

      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, Math.max(0.2, targetH), delta * 5);
      mesh.position.y = 0.2 + mesh.scale.y / 2;

      mat.emissiveIntensity = isProximityHit ? 1.5 : 0.3;
      mat.color.set(isProximityHit ? theme.accent : theme.primary);
      mat.emissive.set(isProximityHit ? theme.accent : theme.primary);
    });
  });

  return (
    <group position={[DATAVIZ.bars.x, 0, DATAVIZ.bars.z]}>
      {/* Base Platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[4.5, 4.8, 0.2, 32]} />
        <meshStandardMaterial color={theme.surface} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bars */}
      {barData.map((bar, i) => (
        <mesh
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          position={[bar.x, 1, bar.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.1, 1, 1.1]} />
          <meshStandardMaterial
            ref={(el) => {
              matRefs.current[i] = el;
            }}
            color={theme.primary}
            emissive={theme.primary}
            emissiveIntensity={0.3}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                       4. Drive-over Trigger Pads                           */
/* -------------------------------------------------------------------------- */

function TriggerPadItem({ id, label, pos }: { id: "density" | "entropy" | "harmonics"; label: string; pos: THREE.Vector3 }) {
  const theme = useTheme();
  const ringRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const cooldownRef = useRef(0);

  useFrame(({ clock }, delta) => {
    cooldownRef.current -= delta;
    const isPadActive = world.pads[id];
    const carPos = world.car.pos;
    const dist = carPos.distanceTo(pos);

    if (dist < 2.0 && cooldownRef.current <= 0) {
      cooldownRef.current = 1.0;
      const nextState = !isPadActive;
      world.togglePad(id, nextState);
      soundFx.playPadSound(nextState);
      world.burst(pos, nextState ? theme.accent : theme.secondary, 18, 4, { size: 0.3 });
      world.toast(`${label} Filter ${nextState ? "ON" : "OFF"}`);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isPadActive ? 3.0 : 0.8);
    }
    if (matRef.current) {
      const activeColor = id === "density" ? theme.primary : id === "entropy" ? theme.accent : theme.secondary;
      matRef.current.color.set(isPadActive ? activeColor : "#475569");
      matRef.current.opacity = isPadActive ? 0.8 : 0.35;
    }
  });

  return (
    <group position={[pos.x, 0.05, pos.z]}>
      {/* Ground Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial ref={matRef} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.4, 1.6, 24]} />
        <meshBasicMaterial color={theme.primary} side={THREE.DoubleSide} />
      </mesh>
      {/* Label Badge */}
      <Html position={[0, 1.2, 0]} center distanceFactor={22} zIndexRange={[5, 0]}>
        <div
          className="observatory-tag"
          style={{
            borderColor: world.pads[id] ? theme.accent : "#475569",
            color: world.pads[id] ? "#ffffff" : "#94a3b8",
            backgroundColor: world.pads[id] ? "rgba(139, 92, 246, 0.4)" : "rgba(15, 23, 42, 0.8)",
          }}
        >
          {label} {world.pads[id] ? "ON" : "OFF"}
        </div>
      </Html>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                    5. Julia Set & Lorenz Attractor Display                 */
/* -------------------------------------------------------------------------- */

const LORENZ_POINTS = 3000;

function LorenzAttractor() {
  const theme = useTheme();

  const { geometry } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(LORENZ_POINTS * 3);

    // Compute Lorenz System trajectory
    let x = 0.1,
      y = 0.0,
      z = 0.0;
    const sigma = 10,
      beta = 8 / 3,
      rho = 28;
    const dt = 0.008;

    for (let i = 0; i < LORENZ_POINTS; i++) {
      const dx = sigma * (y - x) * dt;
      const dy = (x * (rho - z) - y) * dt;
      const dz = (x * y - beta * z) * dt;

      x += dx;
      y += dy;
      z += dz;

      // Scale down to fit observatory hero hub
      positions[i * 3] = x * 0.16;
      positions[i * 3 + 1] = (z - 25) * 0.16;
      positions[i * 3 + 2] = y * 0.16;
    }

    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: g };
  }, []);

  const lineRef = useRef<THREE.Line>(null);

  useFrame((_, delta) => {
    if (lineRef.current) {
      lineRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <group position={[HERO.lorenz.x, HERO.lorenz.y, HERO.lorenz.z]}>
      {/* Glowing Orbiting Attractor Lines */}
      {/* @ts-ignore - R3F line element */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color={theme.accent} linewidth={2} transparent opacity={0.85} />
      </line>
      <pointLight color={theme.accent} intensity={3} distance={8} />
    </group>
  );
}

const juliaVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const juliaFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  void main() {
    // Julia fractal c constant morphing over time
    vec2 c = vec2(-0.7 + sin(uTime * 0.3) * 0.1, 0.27015 + cos(uTime * 0.2) * 0.1);
    vec2 z = (vUv - 0.5) * 2.8;

    float n = 0.0;
    float maxIter = 48.0;
    for (float i = 0.0; i < 48.0; i++) {
      if (dot(z, z) > 4.0) break;
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
      n += 1.0;
    }

    if (n >= maxIter) {
      // Smooth dark interior tinted with uColorA rather than harsh pitch black box
      vec3 interiorCol = mix(uColorA * 0.25, vec3(0.04, 0.06, 0.14), 0.6);
      gl_FragColor = vec4(interiorCol, 0.95);
    } else {
      // Smooth continuous potential coloring to eliminate sub-pixel integer flickering
      float log_zn = log(dot(z, z)) / 2.0;
      float nu = log(log_zn / log(2.0)) / log(2.0);
      float smoothN = n + 1.0 - nu;
      float t = smoothN / maxIter;
      vec3 col = mix(uColorA, uColorB, sqrt(clamp(t, 0.0, 1.0)));
      gl_FragColor = vec4(col, 0.95);
    }
  }
`;

function JuliaSetPanel() {
  const theme = useTheme();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color() },
          uColorB: { value: new THREE.Color() },
        },
        vertexShader: juliaVertexShader,
        fragmentShader: juliaFragmentShader,
        transparent: true,
      }),
    []
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uColorA.value.set(theme.primary);
    material.uniforms.uColorB.value.set(theme.accent);
  });

  return (
    <group position={[HERO.julia.x, 2.5, HERO.julia.z]} rotation={[0, Math.PI / 4, 0]}>
      {/* Holographic Portrait Screen */}
      <mesh position={[0, 0, 0.02]} material={material}>
        <planeGeometry args={[4.5, 4.5]} />
      </mesh>
      {/* Frame Backing */}
      <mesh position={[0, 0, -0.08]} receiveShadow castShadow>
        <boxGeometry args={[4.7, 4.7, 0.1]} />
        <meshStandardMaterial color={theme.surface} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Main Export Component                             */
/* -------------------------------------------------------------------------- */

export function DataVizPlayground() {
  return (
    <group>
      {/* 10k Scatter Field */}
      <PointScatterField />

      {/* Morphing Wave Surface */}
      <ParametricWaveSurface />

      {/* 3D Interactive Bar Chart */}
      <BarChart3D />

      {/* Trigger Pads */}
      {DATAVIZ.pads.map((pad) => (
        <TriggerPadItem key={pad.id} id={pad.id} label={pad.label} pos={pad.pos} />
      ))}

      {/* Math Visualizers (Hero Hub) */}
      <LorenzAttractor />
      <JuliaSetPanel />
    </group>
  );
}
