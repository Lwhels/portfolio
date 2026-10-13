"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import confetti from "canvas-confetti";
import { soundFx } from "./SoundController";
import { useTheme, Theme } from "./themes";
import {
  world,
  RoverSkin,
  OBSTACLES,
  ARCADE,
  SPAWN,
  SPAWN_HEADING,
  WORLD_HALF,
  wrapAngle,
  zoneAt,
  ZONES,
} from "./worldStore";

interface SkinStats {
  max: number;
  boost: number;
  accel: number;
  steer: number;
  pivot: boolean;
  hover: number;
  radius: number;
}

export const SKIN_STATS: Record<RoverSkin, SkinStats> = {
  sports: { max: 14, boost: 20, accel: 12, steer: 1.5, pivot: false, hover: 0, radius: 1.1 },
  tank: { max: 10, boost: 14, accel: 9, steer: 1.6, pivot: true, hover: 0, radius: 1.35 },
  jet: { max: 16, boost: 22, accel: 14, steer: 1.3, pivot: false, hover: 0.9, radius: 1.2 },
  quantum: { max: 18, boost: 24, accel: 16, steer: 1.8, pivot: false, hover: 0.6, radius: 1.15 },
};

export const SKIN_LABELS: Record<RoverSkin, string> = {
  sports: "Cyber Sports",
  tank: "Rover Tank",
  jet: "Futuristic Jet",
  quantum: "Quantum Chromatic",
};

type WheelRefs = React.MutableRefObject<(THREE.Object3D | null)[]>;

/* -------------------------------------------------------------------------- */
/*                                  Bodies                                    */
/* -------------------------------------------------------------------------- */

function Wheel({ index, wheels, steerWheels, position, radius = 0.5, width = 0.4, color }: {
  index: number;
  wheels: WheelRefs;
  steerWheels?: WheelRefs;
  position: [number, number, number];
  radius?: number;
  width?: number;
  color: string;
}) {
  return (
    <group position={position}>
      {/* Outer Steering Pivot Group (Y axis) */}
      <group ref={(el) => { if (steerWheels) steerWheels.current[index] = el; }}>
        {/* Inner Rolling Wheel Group (X axis) */}
        <group ref={(el) => { wheels.current[index] = el; }}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[radius, radius, width, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[radius * 0.55, radius * 0.55, width + 0.04, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function SportsBody({ theme, wheels, steerWheels }: { theme: Theme; wheels: WheelRefs; steerWheels: WheelRefs }) {
  return (
    <group>
      {/* High-visibility Chassis Body */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.9, 0.65, 3.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.72, 1.9]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.8, 0.35, 0.7]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Glowing Canopy Cockpit */}
      <mesh position={[0, 1.25, -0.2]}>
        <boxGeometry args={[1.4, 0.55, 1.7]} />
        <meshStandardMaterial
          color={theme.secondary}
          emissive={theme.secondary}
          emissiveIntensity={0.8}
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Rear Wing */}
      <mesh position={[0, 1.3, -1.65]}>
        <boxGeometry args={[2.0, 0.1, 0.5]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={1.4} />
      </mesh>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 1.05, -1.65]}>
          <boxGeometry args={[0.08, 0.45, 0.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
      {/* Neon Side Racing Strips */}
      {[0.98, -0.98].map((x) => (
        <mesh key={x} position={[x, 0.75, 0]}>
          <boxGeometry args={[0.08, 0.2, 3.2]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={2.5} />
        </mesh>
      ))}
      <Lamps theme={theme} z={1.8} y={0.8} spread={0.65} />
      <Wheel index={0} wheels={wheels} steerWheels={steerWheels} position={[1.05, 0.45, 1.15]} color={theme.primary} />
      <Wheel index={1} wheels={wheels} steerWheels={steerWheels} position={[-1.05, 0.45, 1.15]} color={theme.primary} />
      <Wheel index={2} wheels={wheels} steerWheels={steerWheels} position={[1.05, 0.45, -1.15]} color={theme.primary} />
      <Wheel index={3} wheels={wheels} steerWheels={steerWheels} position={[-1.05, 0.45, -1.15]} color={theme.primary} />
    </group>
  );
}

function TankBody({ theme, wheels, steerWheels }: { theme: Theme; wheels: WheelRefs; steerWheels: WheelRefs }) {
  return (
    <group>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[2.1, 0.75, 3.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>
      {[1.3, -1.3].map((x) => (
        <group key={x} position={[x, 0.45, 0]}>
          <mesh>
            <boxGeometry args={[0.6, 0.85, 4.0]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          <mesh position={[x > 0 ? 0.32 : -0.32, 0.1, 0]}>
            <boxGeometry args={[0.04, 0.15, 3.7]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}
      <Wheel index={0} wheels={wheels} steerWheels={steerWheels} position={[1.3, 0.35, 1.3]} radius={0.35} width={0.6} color={theme.primary} />
      <Wheel index={1} wheels={wheels} steerWheels={steerWheels} position={[-1.3, 0.35, 1.3]} radius={0.35} width={0.6} color={theme.primary} />
      <Wheel index={2} wheels={wheels} steerWheels={steerWheels} position={[1.3, 0.35, -1.3]} radius={0.35} width={0.6} color={theme.primary} />
      <Wheel index={3} wheels={wheels} steerWheels={steerWheels} position={[-1.3, 0.35, -1.3]} radius={0.35} width={0.6} color={theme.primary} />
      <mesh position={[0, 1.5, -0.2]}>
        <cylinderGeometry args={[0.8, 0.9, 0.55, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.8, -0.2]}>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 16]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[0, 1.55, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 2.2, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>
      <Lamps theme={theme} z={1.8} y={0.95} spread={0.7} />
    </group>
  );
}

function JetBody({ theme }: { theme: Theme }) {
  return (
    <group>
      <mesh position={[0, 0.95, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.8, 4.0, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.35, 0.3]} scale={[0.5, 0.35, 1.0]}>
        <sphereGeometry args={[1.0, 16, 12]} />
        <meshStandardMaterial
          color={theme.secondary}
          emissive={theme.secondary}
          emissiveIntensity={0.8}
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[s * 1.2, 0.95, -0.5]} rotation={[0, s * 0.45, 0]}>
          <mesh>
            <boxGeometry args={[2.0, 0.08, 1.1]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[s * 1.0, 0, 0]}>
            <boxGeometry args={[0.08, 0.12, 1.1]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}
      <Lamps theme={theme} z={2.0} y={0.95} spread={0.25} />
    </group>
  );
}

function Lamps({ theme, z, y, spread }: { theme: Theme; z: number; y: number; spread: number }) {
  return (
    <>
      {[spread, -spread].map((x) => (
        <mesh key={x} position={[x, y, z]}>
          <boxGeometry args={[0.35, 0.2, 0.1]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={2.5} />
        </mesh>
      ))}
      <mesh position={[0, y, -z]}>
        <boxGeometry args={[spread * 2 + 0.5, 0.15, 0.08]} />
        <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={2.5} />
      </mesh>
    </>
  );
}

function QuantumBody({ theme }: { theme: Theme }) {
  const crystalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 2.5;
      crystalRef.current.rotation.x += delta * 1.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 3.0;
    }
  });

  return (
    <group position={[0, 0.8, 0]}>
      {/* Sleek Aerodynamic Pod */}
      <mesh>
        <boxGeometry args={[1.7, 0.45, 3.2]} />
        <meshStandardMaterial color="#030712" roughness={0.05} metalness={0.95} />
      </mesh>
      {/* Floating Rotating Energy Ring */}
      <group ref={ringRef} position={[0, 0.4, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.3, 0.08, 16, 32]} />
          <meshBasicMaterial color="#ec4899" />
        </mesh>
      </group>
      {/* Central Quantum Reactor Crystal */}
      <mesh ref={crystalRef} position={[0, 0.6, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {/* Hover Emitters */}
      {[-0.8, 0.8].map((x) =>
        [-1.0, 1.0].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.2, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.4, 16]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
          </mesh>
        ))
      )}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Vehicle                                   */
/* -------------------------------------------------------------------------- */

export function Vehicle({ skin }: { skin: RoverSkin }) {
  const theme = useTheme();
  const vehicleRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Object3D | null)[]>([]);
  const steerWheels = useRef<(THREE.Object3D | null)[]>([]);
  const spotL = useRef<THREE.SpotLight>(null);
  const spotR = useRef<THREE.SpotLight>(null);

  const pos = useRef(SPAWN.clone());
  const heading = useRef(SPAWN_HEADING);
  const moveHeading = useRef(SPAWN_HEADING);
  const speed = useRef(0);
  const verticalVel = useRef(0);
  const steerAngle = useRef(0);
  const isInAir = useRef(false);
  const lastHit = useRef(0);
  const autoReverseMode = useRef(false);
  const autoStuckTimer = useRef(0);
  const driftHoldTime = useRef(0);
  const lastEmpToken = useRef(world.empToken);
  const sparkColor = useMemo(() => new THREE.Color(), []);

  const stats = SKIN_STATS[skin];

  useEffect(() => {
    const group = vehicleRef.current;
    if (!group) return;
    const targets: THREE.Object3D[] = [];
    [spotL.current, spotR.current].forEach((spot, i) => {
      if (!spot) return;
      spot.target.position.set(i === 0 ? 0.6 : -0.6, 0, 14);
      group.add(spot.target);
      targets.push(spot.target);
    });
    return () => targets.forEach((t) => group.remove(t));
  }, []);

  useEffect(() => {
    sparkColor.set(theme.accent);
  }, [theme, sparkColor]);

  useFrame((_, rawDelta) => {
    const group = vehicleRef.current;
    if (!group) return;
    const delta = Math.min(rawDelta, 0.05);
    const time = performance.now() * 0.001;

    if (!Number.isFinite(pos.current.x) || !Number.isFinite(pos.current.z) || !Number.isFinite(pos.current.y)) {
      pos.current.copy(SPAWN);
      speed.current = 0;
      verticalVel.current = 0;
    }

    /* --------------------------- EMP blast response ------------------------- */
    if (world.empToken !== lastEmpToken.current) {
      lastEmpToken.current = world.empToken;
      if (pos.current.y <= 0.25 && !isInAir.current) {
        verticalVel.current = 6.8;
        isInAir.current = true;
      }
    }

    const input = world.input;
    let moveFwd = input.forward;
    let moveBwd = input.backward;
    let turnL = input.left;
    let turnR = input.right;

    if (input.joyY < -0.15) moveFwd = true;
    else if (input.joyY > 0.15) moveBwd = true;
    if (input.joyX < -0.15) turnL = true;
    else if (input.joyX > 0.15) turnR = true;

    const manual = moveFwd || moveBwd || turnL || turnR;

    if (manual) {
      if (world.path.length > 0) world.clearPath();
    }

    const boosting = input.boost || input.touchBoost;
    const maxSpeed = boosting ? stats.boost : stats.max;
    let targetSteer = turnL ? 0.6 : turnR ? -0.6 : 0;

    /* ------------------------------ Autopilot ----------------------------- */
    let autopilot = false;
    if (!manual && world.path.length > 0 && world.pathIndex < world.path.length) {
      autopilot = true;
      const wp = world.path[world.pathIndex];
      const dx = wp.x - pos.current.x;
      const dz = wp.z - pos.current.z;
      const dist = Math.hypot(dx, dz);
      const isLast = world.pathIndex === world.path.length - 1;

      // Dynamic arrival threshold: tighter clearance for final close spots
      const arrivalRadius = isLast ? (dist < 3.5 ? 0.7 : 1.2) : 2.2;

      // Stuck timer safety guard: prevent infinite oscillation
      autoStuckTimer.current += delta;
      if (autoStuckTimer.current > 2.2) {
        autoStuckTimer.current = 0;
        world.pathIndex++;
        if (world.pathIndex >= world.path.length) {
          if (world.circuitAutopilot) {
            world.pathIndex = 0;
          } else {
            world.clearPath();
            autopilot = false;
            speed.current = 0;
          }
        }
      }

      if (dist < arrivalRadius) {
        autoStuckTimer.current = 0;
        world.pathIndex++;
        if (world.pathIndex >= world.path.length) {
          if (world.circuitAutopilot) {
            world.pathIndex = 0;
          } else {
            world.clearPath();
            autopilot = false;
            speed.current = 0;
          }
        }
      }

      if (autopilot) {
        const angleToTarget = Math.atan2(dx, dz);
        const fwdDiff = wrapAngle(angleToTarget - heading.current);

        // Hysteresis to prevent frame-by-frame direction toggling:
        // Switch to Reverse mode if target is distinctly behind or close & at a sharp side angle.
        // Switch back to Forward mode only when target is in front.
        if (!autoReverseMode.current) {
          if (Math.cos(fwdDiff) < -0.35 || (dist < 5.0 && Math.abs(fwdDiff) > 1.35)) {
            autoReverseMode.current = true;
          }
        } else {
          if (Math.cos(fwdDiff) > 0.35 && dist > 2.5) {
            autoReverseMode.current = false;
          }
        }

        if (autoReverseMode.current) {
          // Reverse driving into spot
          const revDesired = wrapAngle(angleToTarget + Math.PI);
          const revDiff = wrapAngle(revDesired - heading.current);
          targetSteer = THREE.MathUtils.clamp(-revDiff * 2.5, -0.65, 0.65);

          let remaining = dist;
          for (let i = world.pathIndex + 1; i < world.path.length; i++) {
            remaining += world.path[i].distanceTo(world.path[i - 1]);
          }
          const wantSpeed = -Math.min(stats.max * 0.6, 3.5 + remaining * 1.5);
          if (speed.current > wantSpeed) speed.current = Math.max(wantSpeed, speed.current - stats.accel * 1.4 * delta);
          else speed.current = Math.min(wantSpeed, speed.current + stats.accel * delta);
        } else {
          // Forward driving into spot
          targetSteer = THREE.MathUtils.clamp(fwdDiff * 2.5, -0.65, 0.65);

          let remaining = dist;
          for (let i = world.pathIndex + 1; i < world.path.length; i++) {
            remaining += world.path[i].distanceTo(world.path[i - 1]);
          }
          const wantSpeed = Math.abs(fwdDiff) > 1.0 ? 5.5 : Math.min(stats.max * 0.95, 5 + remaining * 1.8);
          if (speed.current < wantSpeed) speed.current = Math.min(wantSpeed, speed.current + stats.accel * delta);
          else speed.current = Math.max(wantSpeed, speed.current - stats.accel * 1.5 * delta);
        }
      }
    } else {
      autoStuckTimer.current = 0;
      autoReverseMode.current = false;
    }

    /* --------------------------- Direct Driving --------------------------- */
    if (!autopilot) {
      if (moveFwd) {
        speed.current += stats.accel * (boosting ? 1.8 : 1.2) * delta;
        if (speed.current > maxSpeed) speed.current = maxSpeed;
      } else if (moveBwd) {
        speed.current -= stats.accel * 1.4 * delta;
        if (speed.current < -stats.max * 0.65) speed.current = -stats.max * 0.65;
      } else {
        speed.current *= Math.pow(0.02, delta);
        if (Math.abs(speed.current) < 0.05) speed.current = 0;
      }
    }

    const drifting = input.drift && Math.abs(speed.current) > 6 && !isInAir.current && skin !== "tank";
    if (drifting) {
      targetSteer *= 1.6;
      driftHoldTime.current += delta;
      world.car.driftCharge = Math.min(1, driftHoldTime.current / 2.0);
      if (driftHoldTime.current > 1.0) {
        world.emitParticle(
          pos.current.x,
          0.3,
          pos.current.z,
          (Math.random() - 0.5) * 3,
          1.5,
          (Math.random() - 0.5) * 3,
          new THREE.Color(driftHoldTime.current > 2.0 ? "#f97316" : "#a855f7"),
          0.4,
          0.3
        );
      }
    } else {
      if (driftHoldTime.current > 1.0) {
        // Trigger Mini-Turbo Boost!
        const turboMult = driftHoldTime.current > 2.0 ? 1.65 : 1.35;
        speed.current = Math.min(stats.max * 1.5, Math.max(speed.current * turboMult, 16));
        world.toast(driftHoldTime.current > 2.0 ? "🔥 SUPER MINI-TURBO!" : "⚡ MINI-TURBO!");
        soundFx.playChime(784);
        world.burst(pos.current, driftHoldTime.current > 2.0 ? "#f97316" : "#a855f7", 25, 7);
      }
      driftHoldTime.current = 0;
      world.car.driftCharge = 0;
    }
    steerAngle.current = THREE.MathUtils.lerp(steerAngle.current, targetSteer, Math.min(1, delta * 4.0));

    const absSpeed = Math.abs(speed.current);
    const turnFactor = stats.pivot ? 1.0 : Math.max(0.75, absSpeed / 4);

    if (absSpeed > 0.02 || manual || stats.pivot) {
      const dir = speed.current < 0 ? -1 : 1;
      heading.current += steerAngle.current * stats.steer * dir * delta * turnFactor * (isInAir.current ? 0.3 : 1);
    }

    const grip = drifting ? 1.8 : isInAir.current ? 0.5 : 12;
    const hd = wrapAngle(heading.current - moveHeading.current);
    moveHeading.current += hd * (1 - Math.exp(-grip * delta));
    if (drifting) speed.current *= Math.pow(0.82, delta);

    /* ---------------------------- Vertical / Ramp --------------------------- */
    if (pos.current.y > 0 || verticalVel.current > 0) {
      verticalVel.current -= 25 * delta;
      pos.current.y += verticalVel.current * delta;
      if (pos.current.y <= 0) {
        pos.current.y = 0;
        verticalVel.current = 0;
        if (isInAir.current) {
          isInAir.current = false;
          soundFx.playCollisionSound(1.4);
          world.burst(pos.current, theme.secondary, 30, 5, { size: 0.4 });
          if (absSpeed > 16) {
            confetti({ particleCount: 70, spread: 75, origin: { y: 0.75 }, colors: [theme.primary, theme.secondary, theme.accent] });
          }
        }
      }
    }

    const onRamp =
      Math.abs(pos.current.x - ARCADE.ramp.x) < 3.5 &&
      Math.abs(pos.current.z - ARCADE.ramp.z) < 4.0;
    if (onRamp && absSpeed > 7 && pos.current.y <= 0 && !isInAir.current) {
      verticalVel.current = 12 + absSpeed * 0.2;
      pos.current.y = 0.25;
      isInAir.current = true;
      soundFx.playJumpSound();
    }

    /* -------------------------------- Movement -------------------------------- */
    pos.current.x += Math.sin(moveHeading.current) * speed.current * delta;
    pos.current.z += Math.cos(moveHeading.current) * speed.current * delta;

    // Obstacle collisions
    if (pos.current.y < 2.5) {
      for (const o of OBSTACLES) {
        const dx = pos.current.x - o.x;
        const dz = pos.current.z - o.z;
        const min = o.r + stats.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 < min * min) {
          const d = Math.sqrt(d2) || 0.001;
          pos.current.x = o.x + (dx / d) * min;
          pos.current.z = o.z + (dz / d) * min;
          if (absSpeed > 4 && time - lastHit.current > 0.35) {
            lastHit.current = time;
            soundFx.playCollisionSound(Math.min(1.8, absSpeed / 8));
            world.burst(pos.current.clone().setY(0.8), sparkColor, 18, 6, { size: 0.3 });
          }
          speed.current *= 0.55;
        }
      }
    }

    const lim = WORLD_HALF - 1.5;
    if (Math.abs(pos.current.x) > lim || Math.abs(pos.current.z) > lim) {
      pos.current.x = THREE.MathUtils.clamp(pos.current.x, -lim, lim);
      pos.current.z = THREE.MathUtils.clamp(pos.current.z, -lim, lim);
      speed.current *= 0.5;
    }

    /* ------------------------------ Visuals ------------------------------- */
    group.position.set(pos.current.x, pos.current.y + stats.hover, pos.current.z);
    group.rotation.y = heading.current;

    if (bodyRef.current) {
      const ratio = absSpeed / stats.boost;
      const bob = skin === "jet" ? Math.sin(time * 3) * 0.08 : 0;
      bodyRef.current.position.y = bob;
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(
        bodyRef.current.rotation.z,
        -steerAngle.current * ratio * (skin === "jet" ? 0.9 : 0.12),
        delta * 6
      );
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(
        bodyRef.current.rotation.x,
        isInAir.current ? -verticalVel.current * 0.015 : (moveFwd ? -0.02 : moveBwd ? 0.03 : 0),
        delta * 5
      );
    }

    const wheelRot = speed.current * delta * 2.2;
    wheels.current.forEach((w) => {
      if (w) w.rotation.x += wheelRot;
    });
    steerWheels.current.forEach((sw, i) => {
      if (sw && i < 2) sw.rotation.y = steerAngle.current;
    });

    /* ---------------------------- Shared State ---------------------------- */
    const car = world.car;
    car.pos.copy(pos.current);
    car.heading = heading.current;
    car.speed = speed.current;
    car.boosting = boosting && absSpeed > 2;
    car.drifting = drifting;
    car.inAir = isInAir.current;
    car.maxSpeed = stats.boost;

    world.recordLapSample();

    const z = zoneAt(pos.current.x, pos.current.z);
    if (z !== world.zone) {
      world.setZone(z);
      const def = ZONES.find((d) => d.id === z);
      if (def) soundFx.playZoneChime(def.drone);
    }

    soundFx.updateEnginePitch(absSpeed / stats.max, moveFwd || moveBwd || autopilot, car.boosting);
    soundFx.updateListener(pos.current.x, pos.current.z, heading.current);
  });

  return (
    <group ref={vehicleRef} position={[SPAWN.x, 0, SPAWN.z]} rotation={[0, SPAWN_HEADING, 0]}>
      <group ref={bodyRef}>
        {skin === "sports" && <SportsBody theme={theme} wheels={wheels} steerWheels={steerWheels} />}
        {skin === "tank" && <TankBody theme={theme} wheels={wheels} steerWheels={steerWheels} />}
        {skin === "jet" && <JetBody theme={theme} />}
        {skin === "quantum" && <QuantumBody theme={theme} />}
      </group>

      <spotLight
        ref={spotL}
        position={[0.6, 0.9, 1.8]}
        color={theme.secondary}
        intensity={world.car.headlights ? 75 : 0}
        distance={36}
        angle={0.45}
        penumbra={0.6}
      />
      <spotLight
        ref={spotR}
        position={[-0.6, 0.9, 1.8]}
        color={theme.secondary}
        intensity={world.car.headlights ? 75 : 0}
        distance={36}
        angle={0.45}
        penumbra={0.6}
      />
      <pointLight position={[0, 0.3, 0]} color={theme.primary} intensity={12} distance={8} />
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshBasicMaterial color={theme.primary} transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}
