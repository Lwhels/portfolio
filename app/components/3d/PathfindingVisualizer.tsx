"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { world } from "./worldStore";
import { soundFx } from "./SoundController";

export function PathfindingVisualizer() {
  const [waypoints, setWaypoints] = useState<THREE.Vector3[]>([]);
  const [explored, setExplored] = useState<THREE.Vector3[]>([]);
  const lineRef = useRef<THREE.Line>(null);
  const launchpadRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const unsub = world.on("path", () => {
      setWaypoints([...world.path]);
      setExplored([...world.exploredPathNodes]);
      // Fade explored wavefront after 1.5 seconds
      const timer = setTimeout(() => {
        setExplored([]);
      }, 1500);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  const lineObject = useMemo(() => {
    if (waypoints.length === 0) return null;
    const carPos =
      typeof world.car.pos?.clone === "function"
        ? world.car.pos.clone().setY(0.12)
        : new THREE.Vector3(world.car.pos?.x ?? 0, 0.12, world.car.pos?.z ?? 0);
    const points = [
      carPos,
      ...waypoints.map((p) =>
        typeof (p as any)?.clone === "function"
          ? (p as any).clone().setY(0.12)
          : new THREE.Vector3((p as any).x ?? 0, 0.12, (p as any).z ?? (p as any).y ?? 0)
      ),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.8 });
    return new THREE.Line(geo, mat);
  }, [waypoints]);

  // Launchpad collision logic (Pass 9 Launchpad)
  const LAUNCHPAD_POS = useMemo(() => new THREE.Vector3(14, 0, -10), []);

  useFrame((_, delta) => {
    const car = world.car;
    const dx = car.pos.x - LAUNCHPAD_POS.x;
    const dz = car.pos.z - LAUNCHPAD_POS.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 3.0 && Math.abs(car.speed) > 4.0 && !car.inAir) {
      // Super Launch!
      car.inAir = true;
      car.speed *= 1.4;
      soundFx.playChime(880); // High A5
      world.toast("🚀 MEGA LAUNCHPAD TRIGGERED!");
      world.burst(LAUNCHPAD_POS, "#8b5cf6", 30, 9);
    }
  });

  return (
    <group>
      {/* Dynamic Path Line */}
      {lineObject && <primitive object={lineObject} />}

      {/* Explored A* Search Wavefront Nodes */}
      {explored.map((node, i) => (
        <mesh key={i} position={[node.x, 0.04, node.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* High-Velocity Kinetic Launchpad (Pass 9) */}
      <group position={[LAUNCHPAD_POS.x, 0, LAUNCHPAD_POS.z]}>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.5, 4.5]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.2, 32]} />
          <meshBasicMaterial color="#a855f7" side={THREE.DoubleSide} />
        </mesh>
        {/* Directional Chevron Arrows */}
        {[-1.0, 0, 1.0].map((offset, i) => (
          <mesh key={i} position={[0, 0.08, offset]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.6, 0.8, 3]} />
            <meshBasicMaterial color="#c084fc" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
