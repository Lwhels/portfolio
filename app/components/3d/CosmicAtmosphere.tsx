"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NUM_STARS = 600;

export function CosmicAtmosphere() {
  const starsRef = useRef<THREE.Points>(null);
  const shootingStarRef = useRef<THREE.Line>(null);

  // 1. Static Twinkling Stars Field
  const [starPositions, starColors] = useMemo(() => {
    const pos = new Float32Array(NUM_STARS * 3);
    const col = new Float32Array(NUM_STARS * 3);
    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#c084fc"),
      new THREE.Color("#38bdf8"),
      new THREE.Color("#f472b6"),
    ];

    for (let i = 0; i < NUM_STARS; i++) {
      // Hemisphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42; // Above horizon
      const radius = 60 + Math.random() * 50;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = 20 + radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  // 2. Shooting Star Animation
  const shootTimer = useRef(2.0);
  const isShooting = useRef(false);
  const shootOrigin = useRef(new THREE.Vector3());
  const shootDir = useRef(new THREE.Vector3());
  const shootProgress = useRef(0);

  const shootGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)
    );
    return geo;
  }, []);

  const shootMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const shootLine = useMemo(() => new THREE.Line(shootGeo, shootMat), [shootGeo, shootMat]);

  useFrame((_, delta) => {
    // Rotate stars very slowly
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.012;
    }

    // Shooting star logic
    shootTimer.current -= delta;
    if (shootTimer.current <= 0 && !isShooting.current) {
      isShooting.current = true;
      shootProgress.current = 0;
      shootTimer.current = 4.0 + Math.random() * 4.0; // Next shooting star in 4-8s

      // Pick random start position high above
      const angle = Math.random() * Math.PI * 2;
      shootOrigin.current.set(
        Math.cos(angle) * 45,
        35 + Math.random() * 15,
        Math.sin(angle) * 45
      );
      shootDir.current
        .set(
          -Math.cos(angle) * 35 + (Math.random() - 0.5) * 20,
          -18,
          -Math.sin(angle) * 35 + (Math.random() - 0.5) * 20
        )
        .normalize();
    }

    if (isShooting.current) {
      shootProgress.current += delta * 2.2;
      const head = shootOrigin.current
        .clone()
        .addScaledVector(shootDir.current, shootProgress.current * 45);
      const tail = shootOrigin.current
        .clone()
        .addScaledVector(
          shootDir.current,
          Math.max(0, (shootProgress.current - 0.25) * 45)
        );

      const posArr = new Float32Array([head.x, head.y, head.z, tail.x, tail.y, tail.z]);
      shootGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
      shootMat.opacity = Math.sin(shootProgress.current * Math.PI);

      if (shootProgress.current >= 1.0) {
        isShooting.current = false;
        shootMat.opacity = 0;
      }
    }
  });

  return (
    <group>
      {/* Twinkling Dome Points */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[starColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.65}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Streaking Shooting Star */}
      <primitive object={shootLine} />
    </group>
  );
}
