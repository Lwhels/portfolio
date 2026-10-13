"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import confetti from "canvas-confetti";
import { world, RACE_CHECKPOINTS, RaceCheckpoint } from "./worldStore";
import { soundFx } from "./SoundController";
import { Trophy, Flag } from "lucide-react";

export function TimeTrialTrack() {
  const [activeGate, setActiveGate] = useState(0);
  const [isRacing, setIsRacing] = useState(false);
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    const unsub = world.on("race", (payload: unknown) => {
      const data = payload as { active: boolean; checkpoint: number; completed?: boolean };
      setIsRacing(data.active);
      setActiveGate(data.checkpoint);
      if (data.completed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#8b5cf6", "#10b981", "#f59e0b"],
        });
      }
    });
    return unsub;
  }, []);

  useFrame((_, delta) => {
    const carPos = world.car.pos;

    // Check collision with the target gate
    const targetIdx = isRacing
      ? (activeGate + 1) % RACE_CHECKPOINTS.length
      : 0;

    const targetGate = RACE_CHECKPOINTS[targetIdx];
    const dx = carPos.x - targetGate.pos.x;
    const dz = carPos.z - targetGate.pos.z;
    const dist = Math.hypot(dx, dz);

    if (dist < targetGate.radius && Math.abs(carPos.y) < 3.0) {
      soundFx.playChime(659.25); // E5
      world.passCheckpoint(targetIdx);
    }
  });

  return (
    <group>
      {RACE_CHECKPOINTS.map((gate, i) => {
        const isStart = i === 0;
        const isTarget = isRacing ? (activeGate + 1) % RACE_CHECKPOINTS.length === i : i === 0;

        return (
          <group key={gate.id} position={[gate.pos.x, 0, gate.pos.z]} rotation={[0, gate.heading, 0]}>
            {/* Start / Finish Arch or Checkpoint Gate Ring */}
            {isStart ? (
              <group position={[0, 0, 0]}>
                {/* Left Pylon */}
                <mesh position={[-4, 2.5, 0]}>
                  <cylinderGeometry args={[0.3, 0.4, 5.0, 16]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Right Pylon */}
                <mesh position={[4, 2.5, 0]}>
                  <cylinderGeometry args={[0.3, 0.4, 5.0, 16]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Overhead Crossbar */}
                <mesh position={[0, 5.0, 0]}>
                  <boxGeometry args={[8.6, 0.6, 0.6]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Glowing Neon Banner */}
                <mesh position={[0, 4.3, 0]}>
                  <planeGeometry args={[7.8, 0.8]} />
                  <meshBasicMaterial color={isTarget ? "#10b981" : "#8b5cf6"} side={THREE.DoubleSide} />
                </mesh>

                {/* Overhead Billboard */}
                <Html position={[0, 5.8, 0]} center distanceFactor={18}>
                  <div className="px-3 py-1 rounded-full bg-gray-950/90 border border-emerald-500/50 text-white font-mono text-[10px] flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] whitespace-nowrap">
                    <Flag className="w-3 h-3 text-emerald-400" />
                    <span>START / FINISH LINE</span>
                  </div>
                </Html>
              </group>
            ) : (
              <group position={[0, 0, 0]}>
                {/* Slender Neon Checkpoint Gate Pylons */}
                <mesh position={[-3.5, 2.0, 0]}>
                  <cylinderGeometry args={[0.15, 0.2, 4.0, 12]} />
                  <meshBasicMaterial color={isTarget ? "#38bdf8" : "#475569"} />
                </mesh>
                <mesh position={[3.5, 2.0, 0]}>
                  <cylinderGeometry args={[0.15, 0.2, 4.0, 12]} />
                  <meshBasicMaterial color={isTarget ? "#38bdf8" : "#475569"} />
                </mesh>

                {/* Ground Gate Ring */}
                <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.5, 3.5, 32]} />
                  <meshBasicMaterial
                    color={isTarget ? "#38bdf8" : "#334155"}
                    transparent
                    opacity={isTarget ? 0.6 : 0.2}
                    side={THREE.DoubleSide}
                  />
                </mesh>

                {isTarget && (
                  <Html position={[0, 3.5, 0]} center distanceFactor={18}>
                    <div className="px-2 py-0.5 rounded-full bg-sky-950/90 border border-sky-400 text-sky-300 font-mono text-[9px] font-bold animate-pulse whitespace-nowrap shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                      GATE {i}
                    </div>
                  </Html>
                )}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
