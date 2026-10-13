"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { world, COLLECTIBLES, CollectibleDef } from "./worldStore";
import { Sparkles } from "lucide-react";

export function CollectiblesQuest() {
  const [collected, setCollected] = useState<string[]>([]);
  const meshRefs = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    const unsub = world.on("collectibles", () => {
      setCollected(Array.from(world.collectedSet));
    });
    return unsub;
  }, []);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const carPos = world.car.pos;

    COLLECTIBLES.forEach((item, i) => {
      const isCollected = world.collectedSet.has(item.id);
      const group = meshRefs.current[i];
      if (group) {
        group.rotation.y += delta * 1.5;
        group.position.y = item.pos[1] + Math.sin(time * 2.5 + i) * 0.25;
      }

      if (!isCollected) {
        const dx = carPos.x - item.pos[0];
        const dz = carPos.z - item.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 2.5 && Math.abs(carPos.y - item.pos[1]) < 2.5) {
          world.collectArtifact(item.id);
        }
      }
    });
  });

  return (
    <group>
      {COLLECTIBLES.map((item, i) => {
        const isCollected = collected.includes(item.id);

        return (
          <group key={item.id} position={[item.pos[0], item.pos[1], item.pos[2]]}>
            {/* Rotating 3D Crystal / Artifact Token */}
            <group ref={(el) => { meshRefs.current[i] = el; }}>
              <mesh>
                <octahedronGeometry args={[0.7, 0]} />
                <meshStandardMaterial
                  color={item.color}
                  metalness={0.9}
                  roughness={0.1}
                  transparent
                  opacity={isCollected ? 0.25 : 0.9}
                  wireframe={isCollected}
                />
              </mesh>
            </group>

            {/* Glowing Ground Base Pedestal */}
            <mesh position={[0, -item.pos[1] + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 1.4, 24]} />
              <meshBasicMaterial
                color={item.color}
                transparent
                opacity={isCollected ? 0.15 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Floating Label */}
            {!isCollected && (
              <Html position={[0, 1.3, 0]} center distanceFactor={14}>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-950/90 border border-white/20 text-white font-mono text-[9px] shadow-lg whitespace-nowrap animate-bounce">
                  <span>{item.symbol}</span>
                  <span className="font-bold">{item.name}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
