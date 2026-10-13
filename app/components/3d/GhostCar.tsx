"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { world, LapPoint } from "./worldStore";
import { Flag, Trophy } from "lucide-react";

export function GhostCar() {
  const groupRef = useRef<THREE.Group>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);

  useEffect(() => {
    setBestTime(world.raceBestTime);
    const unsub = world.on("race", (payload: unknown) => {
      const data = payload as { active: boolean; time?: number; completed?: boolean };
      setIsRacing(data.active);
      if (data.completed) {
        setBestTime(world.raceBestTime);
      }
    });
    return unsub;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const trail = world.ghostTrail;
    if (!trail || trail.length < 2) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Current lap time
    const curTime = isRacing ? world.raceCurrentLapTime : (performance.now() * 0.0003) % 25.4;

    // Find the two surrounding points in trail
    let p0 = trail[0];
    let p1 = trail[trail.length - 1];

    if (curTime <= trail[0].t) {
      p0 = trail[0];
      p1 = trail[1];
    } else if (curTime >= trail[trail.length - 1].t) {
      p0 = trail[trail.length - 2];
      p1 = trail[trail.length - 1];
    } else {
      for (let i = 0; i < trail.length - 1; i++) {
        if (trail[i].t <= curTime && trail[i + 1].t >= curTime) {
          p0 = trail[i];
          p1 = trail[i + 1];
          break;
        }
      }
    }

    const span = Math.max(0.001, p1.t - p0.t);
    const alpha = THREE.MathUtils.clamp((curTime - p0.t) / span, 0, 1);

    // Interpolate position and heading
    const x = THREE.MathUtils.lerp(p0.x, p1.x, alpha);
    const z = THREE.MathUtils.lerp(p0.z, p1.z, alpha);

    // Interpolate shortest angle
    let diff = p1.heading - p0.heading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const heading = p0.heading + diff * alpha;

    groupRef.current.position.set(x, 0.45, z);
    groupRef.current.rotation.y = heading;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Holographic Ghost Car Body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.6, 0.5, 3.2]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.45}
          wireframe={false}
        />
      </mesh>

      {/* Ghost Cabin Dome */}
      <mesh position={[0, 0.75, -0.2]}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.8}
          transparent
          opacity={0.35}
          roughness={0.05}
        />
      </mesh>

      {/* Wireframe Outline Cage */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.65, 0.55, 3.25]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Ghost Hover Emitters */}
      {[-0.7, 0.7].map((x) =>
        [-1.0, 1.0].map((z) => (
          <mesh key={`ghost-${x}-${z}`} position={[x, 0.1, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15, 0.35, 12]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        ))
      )}

      {/* Overhead Ghost Tag */}
      <Html position={[0, 2.2, 0]} center distanceFactor={20} zIndexRange={[5, 0]}>
        <div className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-mono text-[9px] font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(56,189,248,0.4)] whitespace-nowrap backdrop-blur-sm pointer-events-none">
          <Trophy className="w-3 h-3 text-cyan-400" />
          <span>GHOST {bestTime ? `· ${bestTime.toFixed(1)}s` : "· 25.4s"}</span>
        </div>
      </Html>
    </group>
  );
}
