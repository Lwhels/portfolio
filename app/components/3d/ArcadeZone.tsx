"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import confetti from "canvas-confetti";
import { soundFx } from "./SoundController";
import { useTheme } from "./themes";
import { world, ARCADE, OBSTACLES, WORLD_HALF } from "./worldStore";

/* -------------------------------------------------------------------------- */
/*                        1. Data Sphere Target Launcher                      */
/* -------------------------------------------------------------------------- */

const MAX_PROJECTILES = 12;

interface Projectile {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  active: boolean;
  life: number;
}

interface Target {
  id: number;
  pos: THREE.Vector3;
  baseY: number;
  speed: number;
  hit: boolean;
  respawnTimer: number;
}

export function TargetLauncherGame() {
  const theme = useTheme();

  // Projectiles Pool
  const projectiles = useRef<Projectile[]>(
    Array.from({ length: MAX_PROJECTILES }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      active: false,
      life: 0,
    }))
  );

  const projMeshes = useRef<(THREE.Mesh | null)[]>([]);

  // Moving Targets in Arcade Zone
  const targetsRef = useRef<Target[]>([
    { id: 1, pos: new THREE.Vector3(12, 3, -34), baseY: 3, speed: 1.5, hit: false, respawnTimer: 0 },
    { id: 2, pos: new THREE.Vector3(17, 4.5, -36), baseY: 4.5, speed: 2.0, hit: false, respawnTimer: 0 },
    { id: 3, pos: new THREE.Vector3(22, 3.5, -34), baseY: 3.5, speed: 1.8, hit: false, respawnTimer: 0 },
  ]);

  const targetRefs = useRef<(THREE.Group | null)[]>([]);
  const lastEmpToken = useRef(world.empToken);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const car = world.car;

    /* --------------------------- EMP blast trigger -------------------------- */
    if (world.empToken !== lastEmpToken.current) {
      lastEmpToken.current = world.empToken;
      targetsRef.current.forEach((t) => {
        if (t.hit) return;
        const d = t.pos.distanceTo(world.empPos);
        if (d < 20.0) {
          t.hit = true;
          t.respawnTimer = 4.5;
          soundFx.playHitSound(t.pos);
          world.burst(t.pos, theme.accent, 35, 9, { size: 0.5 });
          world.addScore(150);
          world.toast("💥 EMP TARGET HIT! (+150 pts)");
        }
      });
    }

    /* -------------------------- handle fire request ------------------------- */
    if (world.fireRequested) {
      world.fireRequested = false;

      // Find inactive projectile
      const proj = projectiles.current.find((p) => !p.active);
      if (proj) {
        proj.active = true;
        proj.life = 2.8;
        // Spawn in front of rover
        const sin = Math.sin(car.heading);
        const cos = Math.cos(car.heading);
        proj.pos.set(car.pos.x + sin * 1.8, car.pos.y + 0.7, car.pos.z + cos * 1.8);
        const shootSpeed = 32 + Math.abs(car.speed);
        proj.vel.set(sin * shootSpeed, 0.2, cos * shootSpeed);

        soundFx.playFireSound(proj.pos, car.heading);
        world.burst(proj.pos, theme.accent, 14, 5, { size: 0.3 });
      }
    }

    // Sync active projectiles to world store for inter-component physics
    world.activeProjectiles = projectiles.current;

    /* -------------------------- update projectiles -------------------------- */
    projectiles.current.forEach((p, idx) => {
      const mesh = projMeshes.current[idx];
      if (!p.active) {
        if (mesh) mesh.visible = false;
        return;
      }

      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        if (mesh) mesh.visible = false;
        return;
      }

      p.pos.addScaledVector(p.vel, delta);
      if (mesh) {
        mesh.visible = true;
        mesh.position.copy(p.pos);
      }

      // 1. Check collision with Arcade Target Rings
      targetsRef.current.forEach((t) => {
        if (t.hit) return;
        const dist = p.pos.distanceTo(t.pos);
        if (dist < 3.0) {
          p.active = false;
          t.hit = true;
          t.respawnTimer = 3.5;

          world.addScore(100);
          soundFx.playHitSound(t.pos);
          world.burst(t.pos, theme.primary, 35, 9, { size: 0.45 });
          world.toast("Target Hit! +100 PTS");

          confetti({
            particleCount: 40,
            spread: 70,
            origin: { x: 0.8, y: 0.6 },
          });
        }
      });

      // 2. Check collision with static world OBSTACLES (Pavilions, Stargate, Data Viz, Spires)
      if (p.active) {
        for (const o of OBSTACLES) {
          const dx = p.pos.x - o.x;
          const dz = p.pos.z - o.z;
          if (dx * dx + dz * dz < o.r * o.r) {
            p.active = false;
            soundFx.playHitSound(p.pos);
            world.burst(p.pos, theme.primary, 24, 6, { size: 0.4 });
            break;
          }
        }
      }

      // 3. Check collision with Boundary Walls or Ground
      if (p.active && (p.pos.y <= 0.1 || Math.abs(p.pos.x) >= WORLD_HALF || Math.abs(p.pos.z) >= WORLD_HALF)) {
        p.active = false;
        soundFx.playCollisionSound(1.2, p.pos);
        world.burst(p.pos, theme.secondary, 22, 6, { size: 0.35 });
      }
    });

    /* ---------------------------- update targets ---------------------------- */
    targetsRef.current.forEach((t, idx) => {
      const ref = targetRefs.current[idx];

      if (t.hit) {
        t.respawnTimer -= delta;
        if (t.respawnTimer <= 0) {
          t.hit = false;
        }
        if (ref) ref.visible = false;
        return;
      }

      // Bob and weave movement
      t.pos.y = t.baseY + Math.sin(time * t.speed + t.id) * 1.2;
      t.pos.x = ARCADE.targetsCenter.x + (t.id - 2) * 5 + Math.cos(time * 0.8 + t.id) * 1.5;

      if (ref) {
        ref.visible = true;
        ref.position.copy(t.pos);
        ref.rotation.y += delta * 1.5;
      }
    });
  });

  return (
    <group>
      {/* Projectile Meshes */}
      {projectiles.current.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            projMeshes.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={2.5} />
        </mesh>
      ))}

      {/* Target Practice Objects */}
      {targetsRef.current.map((t, idx) => (
        <group
          key={t.id}
          ref={(el) => {
            targetRefs.current[idx] = el;
          }}
          position={[t.pos.x, t.pos.y, t.pos.z]}
        >
          {/* Target Ring Base */}
          <mesh castShadow>
            <torusGeometry args={[1.2, 0.15, 16, 32]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={1.2} />
          </mesh>
          {/* Glowing Bullseye Center */}
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={2.0} />
          </mesh>
        </group>
      ))}

      {/* Target Zone Stand Base */}
      <mesh position={[ARCADE.targetsCenter.x, 0.1, ARCADE.targetsCenter.z]} receiveShadow>
        <boxGeometry args={[16, 0.2, 8]} />
        <meshStandardMaterial color={theme.surface} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                            2. Gravity Ring Jumps                           */
/* -------------------------------------------------------------------------- */

export function GravityRings() {
  const theme = useTheme();
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const passedRef = useRef<boolean[]>([false, false, false]);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const carPos = world.car.pos;

    ARCADE.rings.forEach((ringPos, i) => {
      const mesh = ringRefs.current[i];
      if (mesh) {
        mesh.rotation.z += delta * 1.5;
        mesh.rotation.y = Math.sin(time * 0.8 + i) * 0.15;
      }

      const dist = carPos.distanceTo(ringPos);
      if (dist < 3.2 && !passedRef.current[i]) {
        passedRef.current[i] = true;
        world.ringsCleared++;
        world.addScore(150);

        soundFx.playRingSound();
        world.burst(ringPos, theme.secondary, 25, 6, { size: 0.35 });
        world.toast(`Ring ${i + 1}/3 Cleared! +150 PTS`);

        if (world.ringsCleared % 3 === 0) {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
          });
        }
      } else if (dist > 8.0 && passedRef.current[i]) {
        passedRef.current[i] = false;
      }
    });
  });

  return (
    <group>
      {ARCADE.rings.map((ringPos, i) => (
        <group key={i} position={[ringPos.x, ringPos.y, ringPos.z]}>
          <mesh
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
          >
            <torusGeometry args={[3.2, 0.25, 16, 48]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={1.8} metalness={0.8} />
          </mesh>
          {/* Inner Light Beam */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3.0, 3.0, 0.1, 32]} />
            <meshBasicMaterial color={theme.secondary} transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                         3. Physics Block Pyramid                           */
/* -------------------------------------------------------------------------- */

export function PhysicsPyramid() {
  const theme = useTheme();

  // Create block grid pyramid
  const blocks = useMemo(() => {
    const list = [];
    let id = 0;
    for (let layer = 0; layer < 4; layer++) {
      const count = 4 - layer;
      for (let x = 0; x < count; x++) {
        for (let z = 0; z < count; z++) {
          list.push({
            id: id++,
            origPos: new THREE.Vector3(
              ARCADE.pyramid.x + (x - count / 2 + 0.5) * 1.2,
              0.6 + layer * 1.0,
              ARCADE.pyramid.z + (z - count / 2 + 0.5) * 1.2
            ),
            pos: new THREE.Vector3(
              ARCADE.pyramid.x + (x - count / 2 + 0.5) * 1.2,
              0.6 + layer * 1.0,
              ARCADE.pyramid.z + (z - count / 2 + 0.5) * 1.2
            ),
            vel: new THREE.Vector3(),
            hit: false,
          });
        }
      }
    }
    return list;
  }, []);

  const blockRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    const car = world.car;

    blocks.forEach((b, idx) => {
      const mesh = blockRefs.current[idx];
      if (!mesh) return;

      // Collision with active blaster projectiles
      world.activeProjectiles.forEach((p) => {
        if (!p.active) return;
        const shotDist = p.pos.distanceTo(b.pos);
        if (shotDist < 1.6) {
          p.active = false;
          b.hit = true;
          world.addScore(50);
          soundFx.playHitSound(b.pos);
          world.burst(b.pos, theme.accent, 20, 6, { size: 0.35 });
          const shotDir = p.vel.clone().normalize();
          b.vel.addScaledVector(shotDir, 18);
          b.vel.y += 6.0;
        }
      });

      // Collision with rover
      const dist = car.pos.distanceTo(b.pos);
      if (dist < 1.6 && Math.abs(car.speed) > 2.0) {
        if (!b.hit) {
          b.hit = true;
          world.addScore(25);
          soundFx.playCollisionSound(1.1, b.pos);
        }
        const pushDir = b.pos.clone().sub(car.pos).normalize();
        b.vel.addScaledVector(pushDir, (Math.abs(car.speed) + 5) * 0.8);
        b.vel.y += 3.5;
      }

      // Physics damping & collision
      if (b.hit) {
        b.vel.y -= 22 * delta;
        b.pos.addScaledVector(b.vel, delta);

        if (b.pos.y <= 0.5) {
          b.pos.y = 0.5;
          if (Math.abs(b.vel.y) > 1.8) {
            b.vel.y = -b.vel.y * 0.35;
          } else {
            b.vel.y = 0;
          }
          const friction = Math.pow(0.05, delta);
          b.vel.x *= friction;
          b.vel.z *= friction;
        }

        // Obstacle collisions
        for (const o of OBSTACLES) {
          const dx = b.pos.x - o.x;
          const dz = b.pos.z - o.z;
          const minD = o.r + 0.6;
          if (dx * dx + dz * dz < minD * minD) {
            const d = Math.hypot(dx, dz) || 0.001;
            b.pos.x = o.x + (dx / d) * minD;
            b.pos.z = o.z + (dz / d) * minD;
            b.vel.x *= -0.5;
            b.vel.z *= -0.5;
          }
        }

        mesh.position.copy(b.pos);
      }
    });
  });

  return (
    <group>
      {blocks.map((b, i) => (
        <mesh
          key={b.id}
          ref={(el) => {
            blockRefs.current[i] = el;
          }}
          position={[b.origPos.x, b.origPos.y, b.origPos.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.0, 0.9, 1.0]} />
          <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Base Plinth */}
      <mesh position={[ARCADE.pyramid.x, 0.05, ARCADE.pyramid.z]} receiveShadow>
        <boxGeometry args={[7, 0.1, 7]} />
        <meshStandardMaterial color={theme.surface} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Export Component                           */
/* -------------------------------------------------------------------------- */

export function ArcadeZone() {
  return (
    <group>
      {/* Target Launcher Mini-Game */}
      <TargetLauncherGame />

      {/* Gravity Rings Jump Course */}
      <GravityRings />

      {/* Destructible Physics Pyramid */}
      <PhysicsPyramid />
    </group>
  );
}
