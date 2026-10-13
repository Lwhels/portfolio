"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { WAYMO, world } from "./worldStore";
import { soundFx } from "./SoundController";
import { Zap, Eye, Cpu, Compass } from "lucide-react";

export function WaymoPavilion({ onSelect }: { onSelect: (slug: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const lidarRef = useRef<THREE.Group>(null);
  const sweepRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const hologramCarRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Rotate rooftop lidar scanner
    if (lidarRef.current) {
      lidarRef.current.rotation.y += delta * 6.0;
    }
    // Rotate radar sweep plane
    if (sweepRef.current) {
      sweepRef.current.rotation.z += delta * 1.8;
    }
    // Bob and rotate floating holographic car
    if (hologramCarRef.current) {
      hologramCarRef.current.rotation.y += delta * 0.4;
      hologramCarRef.current.position.y = 1.6 + Math.sin(performance.now() * 0.002) * 0.15;
    }
  });

  const handleOpenWaymo = () => {
    soundFx.playChime(523.25); // C5
    onSelect("Waymo");
  };

  return (
    <group ref={groupRef} position={[WAYMO.pos.x, 0, WAYMO.pos.z]}>
      {/* Base Foundation Platform */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.5, 0.16, 32]} />
        <meshStandardMaterial color="#090d16" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glowing Outer Trim Ring */}
      <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.0, 5.25, 48]} />
        <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Radar / LiDAR Ground Sweep Arc */}
      <mesh
        ref={sweepRef}
        position={[0, 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.5, 4.8, 32, 1, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center Pedestal Pillar */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[1.4, 1.8, 1.0, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.9} />
      </mesh>

      {/* Rooftop / Central LiDAR Sensor Puck */}
      <group ref={lidarRef} position={[0, 2.7, 0]}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 0.45, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Laser Emitter Aperture */}
        <mesh position={[0.25, 0, 0]}>
          <boxGeometry args={[0.1, 0.15, 0.1]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Sweeping Laser Cone */}
        <mesh position={[2.0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.8, 4.0, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Floating Holographic Autonomous Vehicle Mesh */}
      <group ref={hologramCarRef} position={[0, 1.6, 0]}>
        {/* Vehicle Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.5, 3.2]} />
          <meshStandardMaterial
            color="#0284c7"
            metalness={0.9}
            roughness={0.2}
            transparent
            opacity={0.85}
            wireframe={false}
          />
        </mesh>
        {/* Cabin Glass */}
        <mesh position={[0, 0.4, -0.2]}>
          <boxGeometry args={[1.4, 0.45, 1.8]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.6}
            metalness={0.5}
            roughness={0.1}
          />
        </mesh>
        {/* Headlights */}
        <mesh position={[0.6, 0, 1.62]}>
          <boxGeometry args={[0.3, 0.1, 0.05]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[-0.6, 0, 1.62]}>
          <boxGeometry args={[0.3, 0.1, 0.05]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Simulated 3D Bounding Boxes around Pavilion (Autonomous Perception) */}
      <group position={[3.2, 0.6, -1.5]}>
        <mesh>
          <boxGeometry args={[1.0, 1.2, 1.0]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.6} />
        </mesh>
        <Html position={[0, 0.8, 0]} center distanceFactor={16}>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 font-bold whitespace-nowrap">
            OBSTACLE [99%]
          </span>
        </Html>
      </group>

      <group position={[-3.0, 0.8, 2.0]}>
        <mesh>
          <boxGeometry args={[1.2, 1.6, 1.2]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.6} />
        </mesh>
        <Html position={[0, 1.0, 0]} center distanceFactor={16}>
          <span className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-[9px] font-mono text-sky-300 font-bold whitespace-nowrap">
            VEHICLE [98%]
          </span>
        </Html>
      </group>

      {/* Interactive 3D HUD Billboard */}
      <Html position={[0, 3.8, 0]} center distanceFactor={14}>
        <div
          onClick={handleOpenWaymo}
          className="group cursor-pointer select-none flex flex-col items-center p-3.5 rounded-xl bg-gray-950/90 border border-cyan-500/50 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 hover:border-cyan-400 transition-all duration-300 min-w-[240px]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300">
              Waymo SWE Internship
            </span>
          </div>

          <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 font-display text-center">
            Autonomous Telemetry Plotting
          </h3>

          <div className="mt-2 grid grid-cols-2 gap-1.5 w-full text-[10px] font-mono text-zinc-300">
            <div className="p-1 rounded bg-cyan-950/40 border border-cyan-500/20 text-center">
              <span className="text-cyan-400 font-bold">400x Faster</span>
              <span className="block text-[8px] text-zinc-400">Autocomplete</span>
            </div>
            <div className="p-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-center">
              <span className="text-emerald-400 font-bold">10x Load Speed</span>
              <span className="block text-[8px] text-zinc-400">Downsampling</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between w-full pt-2 border-t border-white/10 text-[10px] text-cyan-400 group-hover:text-white">
            <span className="flex items-center gap-1 font-sans">
              <Eye className="w-3 h-3" /> View Case Study
            </span>
            <span>→</span>
          </div>
        </div>
      </Html>
    </group>
  );
}
