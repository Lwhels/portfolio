"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { soundFx } from "./SoundController";
import { useTheme } from "./themes";
import { getGlyphGeometry, GLYPH_H } from "./voxelFont";
import { world, HERO, WORLD_HALF, OBSTACLES } from "./worldStore";

type LetterState = "rest" | "flying" | "rebuilding";

interface LetterSim {
  char: string;
  orig: THREE.Vector3;
  vel: THREE.Vector3;
  ang: THREE.Vector3;
  state: LetterState;
  displaced: boolean;
  t: number;
  startPos: THREE.Vector3;
  startQuat: THREE.Quaternion;
  flash: number;
}

const WORDS = ["LUCAS", "WHEELER"];
const STEP = 1.75;
const WORD_GAP = 1.6;
const REST_Y = GLYPH_H / 2 + 0.10;
const REBUILD_DURATION = 1.15;
const IDENTITY = new THREE.Quaternion();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function buildLayout(): { char: string; x: number }[] {
  const out: { char: string; x: number }[] = [];
  let x = 0;
  WORDS.forEach((word, w) => {
    for (const ch of word) {
      out.push({ char: ch, x });
      x += STEP;
    }
    if (w < WORDS.length - 1) x += WORD_GAP;
  });
  const width = out[out.length - 1].x;
  return out.map((l) => ({ ...l, x: l.x - width / 2 }));
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function KnockableTitle() {
  const theme = useTheme();
  const layout = useMemo(buildLayout, []);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const padMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const padRingRef = useRef<THREE.Mesh>(null);
  const padCooldown = useRef(0);
  const lastToken = useRef(world.rebuildToken);
  const lastEmpToken = useRef(world.empToken);

  const sims = useMemo<LetterSim[]>(
    () =>
      layout.map((l) => ({
        char: l.char,
        orig: new THREE.Vector3(l.x, REST_Y, HERO.titleZ),
        vel: new THREE.Vector3(),
        ang: new THREE.Vector3(),
        state: "rest",
        displaced: false,
        t: 0,
        startPos: new THREE.Vector3(),
        startQuat: new THREE.Quaternion(),
        flash: 0,
      })),
    [layout]
  );

  const tmp = useMemo(
    () => ({
      dir: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      spin: new THREE.Quaternion(),
      color: new THREE.Color(),
    }),
    []
  );

  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05);
    const car = world.car;
    const carSpeed = Math.abs(car.speed);
    const time = clock.getElapsedTime();

    /* ---------------------------- rebuild trigger ---------------------------- */
    if (world.rebuildToken !== lastToken.current) {
      lastToken.current = world.rebuildToken;
      soundFx.playRebuildSound();
      sims.forEach((s, i) => {
        const g = groupRefs.current[i];
        if (!g) return;
        s.state = "rebuilding";
        s.t = -i * 0.06;
        s.startPos.copy(g.position);
        s.startQuat.copy(g.quaternion);
        s.vel.set(0, 0, 0);
        s.ang.set(0, 0, 0);
      });
    }

    /* --------------------------- EMP blast trigger -------------------------- */
    if (world.empToken !== lastEmpToken.current) {
      lastEmpToken.current = world.empToken;
      sims.forEach((s, i) => {
        const g = groupRefs.current[i];
        if (!g) return;
        const dx = g.position.x - world.empPos.x;
        const dz = g.position.z - world.empPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 22.0) {
          const power = Math.max(9, 25 - dist * 0.8);
          const dirX = dist > 0.1 ? dx / dist : (Math.random() - 0.5) * 2;
          const dirZ = dist > 0.1 ? dz / dist : (Math.random() - 0.5) * 2;
          s.vel.set(dirX * power, 7.5 + Math.random() * 4, dirZ * power);
          s.ang.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
          s.state = "flying";
          s.displaced = true;
          s.flash = 1;
        }
      });
    }

    /* ------------------------------ rebuild pad ----------------------------- */
    padCooldown.current -= dt;
    const pdx = car.pos.x - HERO.rebuildPad.x;
    const pdz = car.pos.z - HERO.rebuildPad.z;
    const onPad = pdx * pdx + pdz * pdz < 2.2 * 2.2;
    if (onPad && padCooldown.current <= 0 && sims.some((s) => s.displaced)) {
      padCooldown.current = 3;
      world.requestRebuild();
      world.toast("Rebuilding title…");
    }
    if (padRingRef.current) {
      padRingRef.current.rotation.z += dt * (onPad ? 4 : 0.8);
    }
    if (padMatRef.current) {
      padMatRef.current.opacity = 0.25 + Math.sin(time * 3) * 0.1 + (onPad ? 0.3 : 0);
    }

    /* ------------------------------ letters --------------------------------- */
    sims.forEach((s, i) => {
      const g = groupRefs.current[i];
      if (!g) return;

      if (s.state === "rebuilding") {
        const prevT = s.t;
        s.t += dt / REBUILD_DURATION;
        if (prevT < 0 && s.t >= 0) {
          // particle assembly: sparks converge onto the target slot
          world.burst(s.orig, theme.letters[i % theme.letters.length], 22, 3, { implode: true, life: 0.7, size: 0.4 });
        }
        if (s.t < 0) return;
        const e = easeInOutCubic(Math.min(s.t, 1));
        g.position.lerpVectors(s.startPos, s.orig, e);
        g.position.y += Math.sin(Math.PI * e) * 3.2;
        tmp.q.slerpQuaternions(s.startQuat, IDENTITY, e);
        tmp.spin.setFromAxisAngle(Y_AXIS, (1 - e) * Math.PI * 2);
        g.quaternion.copy(tmp.q).multiply(tmp.spin);
        if (s.t >= 1) {
          g.position.copy(s.orig);
          g.quaternion.identity();
          s.state = "rest";
          s.displaced = false;
          s.flash = 1;
        }
      } else {
        // Collision with active blaster projectiles
        world.activeProjectiles.forEach((p) => {
          if (!p.active) return;
          const shotDist = g.position.distanceTo(p.pos);
          if (shotDist < 1.8) {
            p.active = false;
            const shotDir = p.vel.clone().normalize();
            s.vel.set(shotDir.x * 16, 5.5, shotDir.z * 16);
            s.ang.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
            soundFx.playHitSound(g.position);
            world.burst(g.position, theme.letters[i % theme.letters.length], 22, 6, { size: 0.4 });
            world.addScore(50);
            s.state = "flying";
            s.displaced = true;
            s.flash = 1;
          }
        });

        // Collision with rover (horizontal distance, rover near ground)
        const dx = g.position.x - car.pos.x;
        const dz = g.position.z - car.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 1.9 && car.pos.y < 2.2 && carSpeed > 1.5) {
          const fx = Math.sin(car.heading);
          const fz = Math.cos(car.heading);
          tmp.dir.set(dx / (d || 1) + fx, 0, dz / (d || 1) + fz).normalize();
          const power = carSpeed * 0.7 + 3;
          s.vel.set(tmp.dir.x * power, carSpeed * 0.32 + 3.5, tmp.dir.z * power);
          s.ang.set((Math.random() - 0.5) * carSpeed * 0.6, (Math.random() - 0.5) * carSpeed * 0.6, (Math.random() - 0.5) * carSpeed * 0.6);
          if (s.state !== "flying") {
            soundFx.playCollisionSound(Math.min(1.8, 0.6 + carSpeed / 20), g.position);
            world.burst(g.position, theme.letters[i % theme.letters.length], 20, 5 + carSpeed * 0.2, { size: 0.35 });
          }
          s.state = "flying";
          s.displaced = true;
          s.flash = 1;
        }

        if (s.state === "flying") {
          s.vel.y -= 22 * dt;
          g.position.addScaledVector(s.vel, dt);
          g.rotation.x += s.ang.x * dt;
          g.rotation.y += s.ang.y * dt;
          g.rotation.z += s.ang.z * dt;

          if (g.position.y <= REST_Y) {
            g.position.y = REST_Y;
            if (Math.abs(s.vel.y) > 1.8) {
              s.vel.y = -s.vel.y * 0.35;
            } else {
              s.vel.y = 0;
            }
            const groundFriction = Math.pow(0.05, dt);
            s.vel.x *= groundFriction;
            s.vel.z *= groundFriction;
            s.ang.multiplyScalar(0.7);
          }

          // Obstacle collisions (Pavilions, Stargate, Data Viz, Spires)
          for (const o of OBSTACLES) {
            const dx = g.position.x - o.x;
            const dz = g.position.z - o.z;
            const minD = o.r + 0.8;
            if (dx * dx + dz * dz < minD * minD) {
              const d = Math.hypot(dx, dz) || 0.001;
              g.position.x = o.x + (dx / d) * minD;
              g.position.z = o.z + (dz / d) * minD;
              s.vel.x *= -0.5;
              s.vel.z *= -0.5;
            }
          }

          const lim = WORLD_HALF - 1;
          g.position.x = THREE.MathUtils.clamp(g.position.x, -lim, lim);
          g.position.z = THREE.MathUtils.clamp(g.position.z, -lim, lim);

          if (g.position.y <= REST_Y + 0.01 && s.vel.lengthSq() < 0.2) {
            s.state = "rest";
            s.vel.set(0, 0, 0);
            s.ang.set(0, 0, 0);
          }
        }
      }

      // Emissive flash on impact / landing
      const mat = matRefs.current[i];
      if (mat) {
        s.flash = Math.max(0, s.flash - dt * 2);
        mat.emissiveIntensity = 0.35 + s.flash * 1.6 + Math.sin(time * 2 + i * 0.5) * 0.08;
      }
    });
  });

  return (
    <group>
      {layout.map((l, i) => {
        const color = theme.letters[i % theme.letters.length];
        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
            position={[l.x, REST_Y, HERO.titleZ]}
          >
            <mesh geometry={getGlyphGeometry(l.char)} castShadow receiveShadow>
              <meshStandardMaterial
                ref={(el) => {
                  matRefs.current[i] = el;
                }}
                color={color}
                emissive={color}
                emissiveIntensity={0.35}
                metalness={0.55}
                roughness={0.25}
              />
            </mesh>
          </group>
        );
      })}

      {/* Plinth under the title */}
      <mesh position={[0, 0.04, HERO.titleZ]} receiveShadow>
        <boxGeometry args={[24, 0.08, 2.2]} />
        <meshStandardMaterial color={theme.surface} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.09, HERO.titleZ + 1.12]}>
        <boxGeometry args={[24, 0.04, 0.06]} />
        <meshBasicMaterial color={theme.primary} />
      </mesh>

      {/* Rebuild pad */}
      <group position={[HERO.rebuildPad.x, 0.05, HERO.rebuildPad.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2, 40]} />
          <meshBasicMaterial ref={padMatRef} color={theme.secondary} transparent opacity={0.3} depthWrite={false} />
        </mesh>
        <mesh ref={padRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.8, 2.1, 6]} />
          <meshBasicMaterial color={theme.secondary} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 1.6, 0]} center distanceFactor={22} zIndexRange={[5, 0]}>
          <div className="observatory-tag" style={{ borderColor: theme.secondary }}>
            ↺ Rebuild Title
          </div>
        </Html>
      </group>
    </group>
  );
}
