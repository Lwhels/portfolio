"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  world,
  OBSTACLES,
  PROJECT_POSITIONS,
  WAYMO,
  CONTACT,
  ARCADE,
  HERO,
} from "./worldStore";
import { soundFx } from "./SoundController";

const NUM_BEAMS = 32;
const POINTS_PER_BEAM = 48;
const TOTAL_POINTS = NUM_BEAMS * POINTS_PER_BEAM;
const MAX_RANGE = 26.0;

interface DetectedTarget {
  id: string;
  name: string;
  pos: THREE.Vector3;
  size: [number, number, number];
  color: string;
}

export function LidarOverlay() {
  const [active, setActive] = useState(world.lidarEnabled);
  const pointsRef = useRef<THREE.Points>(null);
  const sweepConeRef = useRef<THREE.Mesh>(null);
  const sweepAngle = useRef(0);

  // Subscribe to world lidar toggle
  useEffect(() => {
    const unsub = world.on("lidar", (val) => {
      const isLidar = Boolean(val);
      setActive(isLidar);
      soundFx.playLidarChirp(isLidar);
    });
    return unsub;
  }, []);

  // Pre-allocate point cloud buffers
  const { positions, colors, pointGeometry } = useMemo(() => {
    const pos = new Float32Array(TOTAL_POINTS * 3);
    const col = new Float32Array(TOTAL_POINTS * 3);

    for (let i = 0; i < TOTAL_POINTS; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      col[i * 3] = 0.2;
      col[i * 3 + 1] = 0.8;
      col[i * 3 + 2] = 1.0;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { positions: pos, colors: col, pointGeometry: geom };
  }, []);

  // Track potential detected objects for bounding boxes
  const knownTargets: DetectedTarget[] = useMemo(() => {
    const list: DetectedTarget[] = [
      { id: "waymo-center", name: "WAYMO_PAVILION", pos: WAYMO.pos.clone(), size: [5.5, 3.2, 5.5], color: "#06b6d4" },
      { id: "contact-portal", name: "CONTACT_GATE", pos: CONTACT.portal.clone(), size: [5.0, 5.0, 3.0], color: "#a855f7" },
      { id: "arcade-ramp", name: "ARCADE_RAMP", pos: ARCADE.ramp.clone(), size: [4.2, 2.5, 6.0], color: "#ec4899" },
      { id: "arcade-pyramid", name: "PHYSICS_PYRAMID", pos: ARCADE.pyramid.clone(), size: [3.8, 3.5, 3.8], color: "#f59e0b" },
      { id: "hero-monolith", name: "HERO_TITLE", pos: new THREE.Vector3(0, 1.2, HERO.titleZ), size: [14.0, 2.2, 2.0], color: "#38bdf8" },
    ];

    PROJECT_POSITIONS.forEach((pos, idx) => {
      list.push({
        id: `pedestal-${idx}`,
        name: `PROJECT_POD_${idx + 1}`,
        pos: new THREE.Vector3(pos[0], 1.5, pos[2]),
        size: [3.2, 2.8, 3.2],
        color: "#6366f1",
      });
    });

    return list;
  }, []);

  // Filter dynamically in frame
  const detectedTargetsRef = useRef<(DetectedTarget & { dist: number })[]>([]);

  useFrame((_, delta) => {
    if (!active) return;

    sweepAngle.current += delta * 12.0; // 2 revolutions per second
    if (sweepConeRef.current) {
      sweepConeRef.current.rotation.y = sweepAngle.current;
    }

    const carPos = world.car.pos;
    const carHeading = world.car.heading;
    const sensorY = carPos.y + 1.25;

    // Update detected targets within 24m
    const nearTargets: (DetectedTarget & { dist: number })[] = [];
    for (const t of knownTargets) {
      const d = carPos.distanceTo(t.pos);
      if (d < 24.0) {
        nearTargets.push({ ...t, dist: d });
      }
    }
    nearTargets.sort((a, b) => a.dist - b.dist);
    detectedTargetsRef.current = nearTargets.slice(0, 5);

    // Compute Raycast / Simulated LiDAR Point Cloud
    let ptIdx = 0;
    const cNear = new THREE.Color("#06b6d4");
    const cMid = new THREE.Color("#10b981");
    const cFar = new THREE.Color("#f59e0b");
    const cMax = new THREE.Color("#ec4899");
    const tempColor = new THREE.Color();

    for (let b = 0; b < NUM_BEAMS; b++) {
      // Beam azimuth angle around 360 degrees
      const beamAngle = carHeading + (b / NUM_BEAMS) * Math.PI * 2 + sweepAngle.current * 0.15;
      const cosA = Math.cos(beamAngle);
      const sinA = Math.sin(beamAngle);

      for (let p = 0; p < POINTS_PER_BEAM; p++) {
        // Distance along ray
        const rFrac = (p + 1) / POINTS_PER_BEAM;
        let r = rFrac * MAX_RANGE;

        // Check intersection with static circular obstacles
        const rayX = carPos.x + sinA * r;
        const rayZ = carPos.z + cosA * r;

        let hitObstacle = false;
        let hitDist = r;

        for (const obs of OBSTACLES) {
          const dx = rayX - obs.x;
          const dz = rayZ - obs.z;
          const dObs = Math.hypot(dx, dz);
          if (dObs < obs.r) {
            // Ray hit obstacle perimeter
            hitObstacle = true;
            hitDist = Math.max(1.0, r - (obs.r - dObs));
            break;
          }
        }

        const actualR = hitObstacle ? hitDist : r;
        const px = carPos.x + sinA * actualR;
        const pz = carPos.z + cosA * actualR;

        // Elevation angle simulation: multi-layer vertical dispersion
        const ringElev = Math.sin((p * 7 + b * 3) * 0.4) * 0.12;
        const py = hitObstacle ? 0.3 + Math.random() * 2.2 : 0.06 + Math.max(0, ringElev);

        const i3 = ptIdx * 3;
        positions[i3] = px;
        positions[i3 + 1] = py;
        positions[i3 + 2] = pz;

        // Color ramp based on distance: cyan -> green -> amber -> magenta
        const normDist = Math.min(1.0, actualR / MAX_RANGE);
        if (normDist < 0.3) {
          tempColor.lerpColors(cNear, cMid, normDist / 0.3);
        } else if (normDist < 0.7) {
          tempColor.lerpColors(cMid, cFar, (normDist - 0.3) / 0.4);
        } else {
          tempColor.lerpColors(cFar, cMax, (normDist - 0.7) / 0.3);
        }

        colors[i3] = tempColor.r;
        colors[i3 + 1] = tempColor.g;
        colors[i3 + 2] = tempColor.b;

        ptIdx++;
      }
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* 360° LiDAR Point Cloud */}
      <points ref={pointsRef} geometry={pointGeometry}>
        <pointsMaterial
          size={0.22}
          vertexColors
          transparent
          opacity={0.88}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Sweeping Laser Radar Disc centered on Rover */}
      <mesh
        ref={sweepConeRef}
        position={[world.car.pos.x, world.car.pos.y + 1.25, world.car.pos.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.3, MAX_RANGE * 0.85, 32, 1, 0, Math.PI / 3]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3D Autonomous Perception Detection Bounding Boxes */}
      {detectedTargetsRef.current.map((target) => (
        <group key={target.id} position={target.pos}>
          {/* Wireframe Detection Cuboid */}
          <mesh>
            <boxGeometry args={target.size} />
            <meshBasicMaterial
              color={target.color}
              wireframe
              transparent
              opacity={0.75}
            />
          </mesh>

          {/* High-tech Corner Brackets Accent */}
          <mesh position={[0, target.size[1] / 2 + 0.1, 0]}>
            <ringGeometry args={[0.8, 1.0, 4]} />
            <meshBasicMaterial color={target.color} side={THREE.DoubleSide} wireframe />
          </mesh>

          {/* Floating Autonomous HUD Label */}
          <Html center distanceFactor={22} position={[0, target.size[1] / 2 + 0.9, 0]}>
            <div className="bg-gray-950/90 border border-cyan-400/60 px-2 py-1 rounded shadow-lg font-mono text-[10px] text-cyan-300 whitespace-nowrap pointer-events-none backdrop-blur-sm">
              <div className="flex items-center gap-1.5 font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>{target.name}</span>
              </div>
              <div className="text-[9px] text-zinc-400 flex gap-2">
                <span>R: {target.dist.toFixed(1)}m</span>
                <span className="text-emerald-400">99.4% CONF</span>
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
