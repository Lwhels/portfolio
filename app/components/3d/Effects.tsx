"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { world, ZONES, WORLD_HALF } from "./worldStore";
import { useTheme } from "./themes";

/* -------------------------------------------------------------------------- */
/*                      Pooled particle system (sparks/exhaust)               */
/* -------------------------------------------------------------------------- */

const POOL = 1600;

const particleVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float ptSize = aSize * uPixelRatio * (260.0 / max(-mv.z, 0.6));
    gl_PointSize = max(ptSize, 1.5 * uPixelRatio);
    gl_Position = projectionMatrix * mv;
  }
`;

const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    // Soft anti-aliased circular falloff without pixel discard boxes
    float circle = smoothstep(0.5, 0.05, d);
    float glow = exp(-3.0 * d * d);
    vec3 col = vColor * (0.7 + glow * 0.9) + vec3(glow * glow * 0.4);
    gl_FragColor = vec4(col, circle * vAlpha);
  }
`;

/**
 * A single ring-buffer of point sprites shared by every effect in the world
 * (exhaust, drift smoke, collision sparks, fireworks, rebuild implosions).
 * One draw call total.
 */
export function ParticleSystem() {
  const { gl } = useThree();
  const pointsRef = useRef<THREE.Points>(null);

  const state = useMemo(() => {
    return {
      pos: new Float32Array(POOL * 3),
      vel: new Float32Array(POOL * 3),
      color: new Float32Array(POOL * 3),
      alpha: new Float32Array(POOL),
      size: new Float32Array(POOL),
      baseSize: new Float32Array(POOL),
      life: new Float32Array(POOL),
      maxLife: new Float32Array(POOL),
      gravity: new Float32Array(POOL),
      cursor: 0,
      active: 0,
    };
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(state.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(state.color, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(state.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(state.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);
    return g;
  }, [state]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) } },
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [gl]
  );

  useEffect(() => {
    world.emitParticle = (x, y, z, vx, vy, vz, color, life, size, gravity = 1) => {
      const i = state.cursor;
      state.cursor = (state.cursor + 1) % POOL;
      const i3 = i * 3;
      state.pos[i3] = x;
      state.pos[i3 + 1] = y;
      state.pos[i3 + 2] = z;
      state.vel[i3] = vx;
      state.vel[i3 + 1] = vy;
      state.vel[i3 + 2] = vz;
      state.color[i3] = color.r;
      state.color[i3 + 1] = color.g;
      state.color[i3 + 2] = color.b;
      state.life[i] = life;
      state.maxLife[i] = life;
      state.baseSize[i] = size;
      state.gravity[i] = gravity;
    };
    return () => {
      world.emitParticle = () => {};
      geometry.dispose();
      material.dispose();
    };
  }, [state, geometry, material]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const { pos, vel, life, maxLife, alpha, size, baseSize, gravity } = state;
    for (let i = 0; i < POOL; i++) {
      if (life[i] <= 0) {
        if (alpha[i] !== 0) {
          alpha[i] = 0;
          size[i] = 0;
        }
        continue;
      }
      life[i] -= dt;
      const i3 = i * 3;
      vel[i3 + 1] -= 9.8 * gravity[i] * dt;
      const drag = 1 - 1.2 * dt;
      vel[i3] *= drag;
      vel[i3 + 1] *= drag;
      vel[i3 + 2] *= drag;
      pos[i3] += vel[i3] * dt;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;
      if (pos[i3 + 1] < 0.02) {
        pos[i3 + 1] = 0.02;
        vel[i3 + 1] *= -0.35;
      }
      const t = Math.max(life[i] / maxLife[i], 0);
      alpha[i] = t;
      size[i] = baseSize[i] * (0.4 + 0.6 * t);
    }
    const attrs = geometry.attributes;
    attrs.position.needsUpdate = true;
    attrs.aColor.needsUpdate = true;
    attrs.aAlpha.needsUpdate = true;
    attrs.aSize.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}

/* -------------------------------------------------------------------------- */
/*                         Exhaust / drift trail emitter                      */
/* -------------------------------------------------------------------------- */

export function ExhaustEmitter({ skin }: { skin: string }) {
  const theme = useTheme();
  const colors = useMemo(
    () => ({
      base: new THREE.Color(theme.secondary),
      boost: new THREE.Color(theme.accent),
      smoke: new THREE.Color("#cbd5e1"),
      spark: new THREE.Color("#fbbf24"),
      tmp: new THREE.Color(),
    }),
    [theme]
  );
  const acc = useRef(0);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const car = world.car;
    const speed = Math.abs(car.speed);
    if (speed < 1.5 && !car.boosting) return;

    acc.current += dt * (car.boosting ? 90 : 25 + speed * 2);
    const n = Math.floor(acc.current);
    acc.current -= n;
    if (n <= 0) return;

    const sin = Math.sin(car.heading);
    const cos = Math.cos(car.heading);
    const back = skin === "jet" ? -2.1 : skin === "tank" ? -1.9 : -1.85;
    const ratio = Math.min(speed / 34, 1);
    colors.tmp.copy(colors.base).lerp(colors.boost, car.boosting ? 1 : ratio * 0.6);

    for (let k = 0; k < n; k++) {
      const side = k % 2 === 0 ? 0.5 : -0.5;
      // rear exhaust position in world space (local x = side, local z = back)
      const x = car.pos.x + sin * back + cos * side;
      const z = car.pos.z + cos * back - sin * side;
      const y = car.pos.y + (skin === "jet" ? 1.0 : 0.55);
      const spread = 0.8;
      world.emitParticle(
        x,
        y,
        z,
        -sin * (2 + Math.random() * 2) + (Math.random() - 0.5) * spread,
        0.4 + Math.random() * 0.6,
        -cos * (2 + Math.random() * 2) + (Math.random() - 0.5) * spread,
        colors.tmp,
        0.35 + Math.random() * 0.35 + (car.boosting ? 0.25 : 0),
        car.boosting ? 0.6 : 0.38,
        -0.05
      );
    }

    // Drift: tyre smoke + sparks from the rear wheels
    if (car.drifting && !car.inAir && skin !== "jet") {
      for (let side = -1; side <= 1; side += 2) {
        const x = car.pos.x + sin * -1.1 + cos * side;
        const z = car.pos.z + cos * -1.1 - sin * side;
        world.emitParticle(
          x,
          0.15,
          z,
          (Math.random() - 0.5) * 2,
          0.6 + Math.random(),
          (Math.random() - 0.5) * 2,
          colors.smoke,
          0.7,
          0.7,
          -0.1
        );
        if (Math.random() < 0.5) {
          world.emitParticle(
            x,
            0.2,
            z,
            cos * side * (3 + Math.random() * 3),
            1.5 + Math.random() * 2,
            -sin * side * (3 + Math.random() * 3),
            colors.spark,
            0.4,
            0.22,
            1
          );
        }
      }
    }
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/*                            Atmospheric data dust                           */
/* -------------------------------------------------------------------------- */

const DUST_COUNT = 1800;

export function DustField() {
  const theme = useTheme();
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(DUST_COUNT * 3);
    const seed = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 80);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color() },
          uColorB: { value: new THREE.Color() },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
        },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vSeed;
          varying float vFade;
          void main() {
            vec3 p = position;
            p.y = mod(p.y + uTime * (0.15 + aSeed * 0.35), 20.0);
            p.x += sin(uTime * 0.2 + aSeed * 20.0) * 0.6;
            p.z += cos(uTime * 0.18 + aSeed * 15.0) * 0.6;
            vSeed = aSeed;
            vFade = smoothstep(0.0, 3.0, p.y) * (1.0 - smoothstep(15.0, 20.0, p.y));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            // Clamp size to at least 2.5px to eliminate sub-pixel rasterization flickering
            float ptSize = (1.2 + aSeed * 1.2) * uPixelRatio * (45.0 / max(-mv.z, 0.1));
            gl_PointSize = max(ptSize, 2.5 * uPixelRatio);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform float uTime;
          varying float vSeed;
          varying float vFade;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            // Soft smooth anti-aliased circular alpha mask with zero square box edges
            float circle = smoothstep(0.5, 0.05, d);
            float pulse = 0.8 + 0.2 * sin(uTime * 0.5 + vSeed * 5.0);
            vec3 col = mix(uColorA, uColorB, vSeed);
            float alpha = circle * vFade * pulse * 0.35;
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [gl]
  );

  useEffect(() => {
    material.uniforms.uColorA.value.set(theme.primary);
    material.uniforms.uColorB.value.set(theme.secondary);
  }, [theme, material]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return <points geometry={geometry} material={material} />;
}

/* -------------------------------------------------------------------------- */
/*                         Volumetric-ish light shafts                        */
/* -------------------------------------------------------------------------- */

const shaftVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const shaftFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float facing = abs(dot(normalize(vNormalW), normalize(vViewDir)));
    float edge = pow(facing, 2.5);
    float bands = 0.75 + 0.25 * sin(vUv.y * 40.0 - uTime * 2.0 + uSeed * 10.0);
    float a = edge * (1.0 - vUv.y) * bands * 0.16;
    gl_FragColor = vec4(uColor, a);
  }
`;

function LightShaft({ x, z, color, seed }: { x: number; z: number; color: string; seed: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uTime: { value: 0 },
          uSeed: { value: seed },
        },
        vertexShader: shaftVertex,
        fragmentShader: shaftFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [seed] // colour is synced in the effect below
  );

  useEffect(() => {
    material.uniforms.uColor.value.set(color);
  }, [color, material]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh position={[x, 14, z]} material={material} renderOrder={2}>
      <cylinderGeometry args={[1.2, 7, 28, 32, 1, true]} />
    </mesh>
  );
}

export function LightShafts() {
  const theme = useTheme();
  const palette = [theme.primary, theme.secondary, theme.accent, theme.primary, theme.accent];
  return (
    <group>
      {ZONES.map((z, i) => (
        <LightShaft key={z.id} x={z.center[0]} z={z.center[1]} color={palette[i % palette.length]} seed={i} />
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                     Cyber Holographic Forcefield Boundary                  */
/* -------------------------------------------------------------------------- */

const forcefieldVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const forcefieldFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uTime;
  uniform vec3 uCarPos;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    // Continuous power-exponential grid lines (100% anti-aliased, zero moire flickering)
    float waveY = sin(vUv.y * 28.0 - uTime * 2.0) * 0.5 + 0.5;
    float gridY = pow(clamp(waveY, 0.0, 1.0), 10.0);

    float waveX = sin(vUv.x * 36.0) * 0.5 + 0.5;
    float gridX = pow(clamp(waveX, 0.0, 1.0), 12.0);

    float grid = gridY * 0.5 + gridX * 0.4;

    // Glowing top and bottom border containment beams
    float topBeam = pow(clamp(vUv.y, 0.0, 1.0), 14.0) * 0.8;
    float botBeam = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 18.0) * 0.9;
    float borderBeams = max(topBeam, botBeam);

    // Distance to rover position for dynamic proximity reaction
    float distToCar = length(vWorldPos - uCarPos);
    float carProximity = smoothstep(22.0, 1.0, distToCar);

    // Height fade: transparent at extreme top sky edge
    float heightFade = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));

    vec3 col = mix(uColor, uAccent, carProximity * 0.6 + grid * 0.4 + borderBeams * 0.5);
    float alpha = (0.22 + grid * 0.45 + borderBeams * 0.6 + carProximity * 0.5) * heightFade;

    gl_FragColor = vec4(col, alpha);
  }
`;

export function ForcefieldBoundary() {
  const theme = useTheme();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(theme.primary) },
          uAccent: { value: new THREE.Color(theme.secondary) },
          uTime: { value: 0 },
          uCarPos: { value: new THREE.Vector3() },
        },
        vertexShader: forcefieldVertex,
        fragmentShader: forcefieldFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    material.uniforms.uColor.value.set(theme.primary);
    material.uniforms.uAccent.value.set(theme.secondary);
  }, [theme, material]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uCarPos.value.copy(world.car.pos);
  });

  const B = WORLD_HALF; // Expanded boundary half size (55)
  const H = 14;         // Taller Forcefield Wall (14)

  return (
    <group>
      {/* 4 Holographic Forcefield Perimeter Walls */}
      {/* North Wall (-Z) */}
      <mesh position={[0, H / 2, -B]} material={material}>
        <planeGeometry args={[B * 2, H]} />
      </mesh>
      {/* South Wall (+Z) */}
      <mesh position={[0, H / 2, B]} rotation={[0, Math.PI, 0]} material={material}>
        <planeGeometry args={[B * 2, H]} />
      </mesh>
      {/* West Wall (-X) */}
      <mesh position={[-B, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={material}>
        <planeGeometry args={[B * 2, H]} />
      </mesh>
      {/* East Wall (+X) */}
      <mesh position={[B, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={material}>
        <planeGeometry args={[B * 2, H]} />
      </mesh>

      {/* 4 Corner Energy Spire Obelisks */}
      {[-B, B].map((x) =>
        [-B, B].map((z) => (
          <group key={`corner-${x}-${z}`} position={[x, 0, z]}>
            <mesh position={[0, H / 2, 0]} castShadow>
              <cylinderGeometry args={[0.6, 1.1, H, 6]} />
              <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={2.5} metalness={0.9} />
            </mesh>
            <mesh position={[0, H + 0.5, 0]}>
              <octahedronGeometry args={[1.0, 0]} />
              <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={3.5} />
            </mesh>
            <pointLight position={[0, H, 0]} color={theme.secondary} intensity={25} distance={25} />
          </group>
        ))
      )}

      {/* Perimeter Hexagonal Energy Fence Posts */}
      {[-40, -20, 0, 20, 40].map((offset) => (
        <React.Fragment key={offset}>
          <mesh position={[offset, H * 0.35, -B]}>
            <cylinderGeometry args={[0.3, 0.45, H * 0.7, 6]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={2.0} />
          </mesh>
          <mesh position={[offset, H * 0.35, B]}>
            <cylinderGeometry args={[0.3, 0.45, H * 0.7, 6]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={2.0} />
          </mesh>
          <mesh position={[-B, H * 0.35, offset]}>
            <cylinderGeometry args={[0.3, 0.45, H * 0.7, 6]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={2.0} />
          </mesh>
          <mesh position={[B, H * 0.35, offset]}>
            <cylinderGeometry args={[0.3, 0.45, H * 0.7, 6]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={2.0} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}
