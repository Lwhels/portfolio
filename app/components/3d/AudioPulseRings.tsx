"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { soundFx } from "./SoundController";

export function AudioPulseRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());

  const NUM_BARS = 32;
  const RADIUS = 7.5;

  useFrame((state, delta) => {
    const energy = soundFx.getAudioEnergy();
    const time = state.clock.getElapsedTime();

    // Pulse the floor rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const scale = 1.0 + energy * (0.15 + i * 0.08) + Math.sin(time * 2 + i) * 0.02;
        mesh.scale.set(scale, scale, 1);
        if (mesh.material && "opacity" in mesh.material) {
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + energy * 0.55;
        }
      });
    }

    // Dynamic radial visualizer bars surrounding the plaza
    if (barsRef.current) {
      for (let i = 0; i < NUM_BARS; i++) {
        const angle = (i / NUM_BARS) * Math.PI * 2;
        const x = Math.cos(angle) * RADIUS;
        const z = Math.sin(angle) * RADIUS;

        // Wave phase + audio energy modulation
        const wave = Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5;
        const height = 0.15 + (energy * 1.8 + wave * 0.3) * (0.4 + (i % 3) * 0.3);

        dummy.current.position.set(x, height / 2, z);
        dummy.current.rotation.set(0, -angle, 0);
        dummy.current.scale.set(0.12, height, 0.3);
        dummy.current.updateMatrix();

        barsRef.current.setMatrixAt(i, dummy.current.matrix);
      }
      barsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0.02, 0]}>
      {/* Concentric Floor Rings */}
      <group ref={ringsRef} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[4.8, 5.0, 48]} />
          <meshBasicMaterial
            color="#8b5cf6"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[6.8, 7.0, 48]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[8.8, 9.05, 48]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Radial Equalizer Instanced Mesh */}
      <instancedMesh
        ref={barsRef}
        args={[undefined, undefined, NUM_BARS]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#8b5cf6"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </instancedMesh>
    </group>
  );
}
