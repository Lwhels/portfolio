"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Play, Pause, RotateCcw, Globe, Sparkles } from "lucide-react";
import { soundFx } from "./3d/SoundController";

interface PlanetDef {
  name: string;
  radius: number;
  semiMajorAxis: number;
  speed: number;
  color: string;
  glow: string;
  eccentricity: number;
  hasMoon?: boolean;
}

const PLANETS: PlanetDef[] = [
  { name: "Mercury", radius: 0.25, semiMajorAxis: 3.2, speed: 2.4, color: "#94a3b8", glow: "#cbd5e1", eccentricity: 0.2 },
  { name: "Venus", radius: 0.45, semiMajorAxis: 5.0, speed: 1.6, color: "#fbbf24", glow: "#fde68a", eccentricity: 0.05 },
  { name: "Earth", radius: 0.5, semiMajorAxis: 7.2, speed: 1.0, color: "#38bdf8", glow: "#67e8f9", eccentricity: 0.016, hasMoon: true },
  { name: "Mars", radius: 0.35, semiMajorAxis: 9.6, speed: 0.8, color: "#f87171", glow: "#fca5a5", eccentricity: 0.09 },
  { name: "Jupiter", radius: 0.9, semiMajorAxis: 13.0, speed: 0.45, color: "#f59e0b", glow: "#fbbf24", eccentricity: 0.048 },
];

function OrreryScene({ timeScale }: { timeScale: number }) {
  const planetsRef = useRef<(THREE.Group | null)[]>([]);
  const moonRef = useRef<THREE.Mesh>(null);
  const sunGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime() * timeScale;

    // Pulse Sun
    if (sunGlowRef.current) {
      const s = 1.0 + Math.sin(elapsed * 2) * 0.04;
      sunGlowRef.current.scale.set(s, s, s);
    }

    // Orbit planets along Keplerian ellipses: r = a(1 - e^2) / (1 + e*cos(theta))
    PLANETS.forEach((planet, idx) => {
      const group = planetsRef.current[idx];
      if (!group) return;

      const angle = elapsed * planet.speed * 0.5;
      const r = (planet.semiMajorAxis * (1 - planet.eccentricity ** 2)) / (1 + planet.eccentricity * Math.cos(angle));

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      group.position.set(x, 0, z);
    });

    // Orbit Moon around Earth
    if (moonRef.current) {
      const moonAngle = elapsed * 5.0;
      moonRef.current.position.set(Math.cos(moonAngle) * 0.9, 0, Math.sin(moonAngle) * 0.9);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#fbbf24" distance={50} decay={1.5} />

      {/* Sun */}
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1.4, 32, 32]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh ref={sunGlowRef}>
          <sphereGeometry args={[1.7, 32, 32]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>
      </group>

      {/* Orbit Rings & Planet Nodes */}
      {PLANETS.map((planet, idx) => {
        return (
          <group key={planet.name}>
            {/* Keplerian Orbit Path Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planet.semiMajorAxis - 0.03, planet.semiMajorAxis + 0.03, 64]} />
              <meshBasicMaterial color="#334155" transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>

            {/* Orbiting Planet Body */}
            <group
              ref={(el) => {
                planetsRef.current[idx] = el;
              }}
            >
              <mesh>
                <sphereGeometry args={[planet.radius, 24, 24]} />
                <meshStandardMaterial
                  color={planet.color}
                  roughness={0.4}
                  metalness={0.2}
                  emissive={planet.glow}
                  emissiveIntensity={0.2}
                />
              </mesh>

              {/* Moon for Earth */}
              {planet.hasMoon && (
                <mesh ref={moonRef}>
                  <sphereGeometry args={[0.12, 12, 12]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </>
  );
}

export function SolarSystemPreview() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);

  return (
    <div className="my-10 p-6 md:p-8 rounded-3xl bg-gray-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sky-400 mb-1">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Interactive Celestial Orrery</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white font-display">
            WebGL Keplerian Orbital Engine
          </h3>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Real-time orbital mechanics simulating semi-major axis, eccentricity, and relative planetary velocity.
          </p>
        </div>

        {/* Speed & Play Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              soundFx.playHapticTick();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>

          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1 text-xs font-mono">
            {[0.5, 1.0, 2.0, 4.0].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeed(s);
                  soundFx.playHapticTick();
                }}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  speed === s ? "bg-sky-600 text-white font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive 3D Canvas */}
      <div className="relative w-full h-80 rounded-2xl bg-black border border-zinc-800/80 my-6 overflow-hidden">
        <Canvas
          camera={{ position: [0, 18, 14], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <OrbitControls
            enablePan={false}
            minDistance={8}
            maxDistance={35}
            maxPolarAngle={Math.PI / 2.1}
          />
          <OrreryScene timeScale={isPlaying ? speed : 0} />
        </Canvas>

        {/* Floating Instruction Overlay */}
        <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] font-mono text-zinc-500 bg-gray-950/80 px-2.5 py-1 rounded-full border border-white/10">
          Drag to rotate · Scroll to zoom
        </div>
      </div>

      {/* Planetary Ephemeris Table */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs font-mono">
        {PLANETS.map((p) => (
          <div key={p.name} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-1.5 font-bold text-white mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </div>
            <div className="text-[10px] text-zinc-500 space-y-0.5">
              <div>Semi-major: {p.semiMajorAxis} AU</div>
              <div>Eccentricity: {p.eccentricity}</div>
              <div>Speed: {p.speed}x</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
