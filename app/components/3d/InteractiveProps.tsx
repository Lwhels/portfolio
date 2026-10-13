"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { world } from "./worldStore";
import { soundFx } from "./SoundController";

interface PropItem {
  id: number;
  initialX: number;
  initialZ: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  tiltX: number;
  tiltZ: number;
  vTiltX: number;
  vTiltZ: number;
  color: string;
}

const INITIAL_CONES: Omit<PropItem, "x" | "z" | "vx" | "vz" | "tiltX" | "tiltZ" | "vTiltX" | "vTiltZ">[] = [
  // Waymo entry cones
  { id: 1, initialX: -12.0, initialZ: -3.0, color: "#f97316" },
  { id: 2, initialX: -12.0, initialZ: 3.0, color: "#f97316" },
  { id: 3, initialX: -10.0, initialZ: -1.5, color: "#f97316" },
  { id: 4, initialX: -10.0, initialZ: 1.5, color: "#f97316" },
  // Track chicane cones
  { id: 5, initialX: 8.0, initialZ: -8.0, color: "#38bdf8" },
  { id: 6, initialX: 9.5, initialZ: -9.5, color: "#38bdf8" },
  { id: 7, initialX: -8.0, initialZ: 8.0, color: "#a855f7" },
  { id: 8, initialX: -9.5, initialZ: 9.5, color: "#a855f7" },
];

export function InteractiveProps() {
  const propsRef = useRef<PropItem[]>(
    INITIAL_CONES.map((c) => ({
      ...c,
      x: c.initialX,
      z: c.initialZ,
      vx: 0,
      vz: 0,
      tiltX: 0,
      tiltZ: 0,
      vTiltX: 0,
      vTiltZ: 0,
    }))
  );

  const meshRefs = useRef<(THREE.Group | null)[]>([]);
  const lastEmpToken = useRef(world.empToken);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const carPos = world.car.pos;
    const carSpeed = world.car.speed;
    const carHeading = world.car.heading;

    // React to EMP blast shockwave
    if (world.empToken !== lastEmpToken.current) {
      lastEmpToken.current = world.empToken;
      propsRef.current.forEach((cone) => {
        const dx = cone.x - world.empPos.x;
        const dz = cone.z - world.empPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 18.0) {
          const force = Math.max(8, 22 - dist);
          const nx = dist > 0.1 ? dx / dist : Math.random() - 0.5;
          const nz = dist > 0.1 ? dz / dist : Math.random() - 0.5;
          cone.vx += nx * force;
          cone.vz += nz * force;
          cone.vTiltX += (Math.random() - 0.5) * 18;
          cone.vTiltZ += (Math.random() - 0.5) * 18;
        }
      });
    }

    propsRef.current.forEach((cone, idx) => {
      // Check collision with rover
      const dx = cone.x - carPos.x;
      const dz = cone.z - carPos.z;
      const dist = Math.hypot(dx, dz);
      const hitRadius = 1.3;

      if (dist < hitRadius && dist > 0.001) {
        // Compute push direction
        const nx = dx / dist;
        const nz = dz / dist;
        const impactSpeed = Math.max(Math.abs(carSpeed) * 1.8, 3.5);

        cone.vx += nx * impactSpeed * 0.8;
        cone.vz += nz * impactSpeed * 0.8;

        // Add tilt
        cone.vTiltX += (Math.random() - 0.5) * 6;
        cone.vTiltZ += (Math.random() - 0.5) * 6;

        // Displace cone away immediately to prevent sticking
        cone.x = carPos.x + nx * hitRadius * 1.05;
        cone.z = carPos.z + nz * hitRadius * 1.05;

        soundFx.playCollisionSound(0.4, { x: cone.x, y: 0.5, z: cone.z });
      }

      // Physics integration: velocity + damping
      cone.x += cone.vx * dt;
      cone.z += cone.vz * dt;
      cone.vx *= 0.88;
      cone.vz *= 0.88;

      // Restoring force to return gently towards initial position if not hit recently
      const backDx = cone.initialX - cone.x;
      const backDz = cone.initialZ - cone.z;
      cone.x += backDx * 0.02 * dt;
      cone.z += backDz * 0.02 * dt;

      // Tilt wobble spring
      cone.tiltX += cone.vTiltX * dt;
      cone.tiltZ += cone.vTiltZ * dt;
      cone.vTiltX += -cone.tiltX * 18 * dt - cone.vTiltX * 4 * dt;
      cone.vTiltZ += -cone.tiltZ * 18 * dt - cone.vTiltZ * 4 * dt;

      // Update 3D mesh transform
      const mesh = meshRefs.current[idx];
      if (mesh) {
        mesh.position.set(cone.x, 0, cone.z);
        mesh.rotation.set(cone.tiltX, 0, cone.tiltZ);
      }
    });
  });

  return (
    <group>
      {propsRef.current.map((cone, idx) => (
        <group
          key={cone.id}
          ref={(el) => {
            meshRefs.current[idx] = el;
          }}
          position={[cone.initialX, 0, cone.initialZ]}
        >
          {/* Base plate */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.55, 0.08, 0.55]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>

          {/* Cone body */}
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.22, 0.85, 16]} />
            <meshStandardMaterial
              color={cone.color}
              emissive={cone.color}
              emissiveIntensity={0.35}
              roughness={0.3}
            />
          </mesh>

          {/* Reflective White Collar */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.13, 0.16, 0.18, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
