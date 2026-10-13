"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { world } from "./worldStore";

const MAX_MARKS = 120;

interface MarkSegment {
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  alpha: number;
}

export function Skidmarks() {
  const marks = useRef<MarkSegment[]>([]);
  const lastPos = useRef<THREE.Vector3 | null>(null);
  const sampleTimer = useRef(0);

  // Instanced or LineSegments representation
  const lineGeo = useMemo(() => new THREE.BufferGeometry(), []);
  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const linesRef = useRef<THREE.LineSegments>(null);

  useFrame((_, delta) => {
    sampleTimer.current += delta;
    const car = world.car;
    const absSpeed = Math.abs(car.speed);

    // Fade existing marks
    for (let i = marks.current.length - 1; i >= 0; i--) {
      marks.current[i].alpha -= delta * 0.18; // ~5.5s fade
      if (marks.current[i].alpha <= 0) {
        marks.current.splice(i, 1);
      }
    }

    // Add new skidmark when drifting or braking at high speed
    if (car.drifting && absSpeed > 6.0 && sampleTimer.current >= 0.06) {
      sampleTimer.current = 0;
      const h = car.heading;
      const cos = Math.cos(h);
      const sin = Math.sin(h);

      // Left and right rear wheel contact points
      const leftX = car.pos.x - cos * 0.85 - sin * 1.4;
      const leftZ = car.pos.z + sin * 0.85 - cos * 1.4;
      const rightX = car.pos.x + cos * 0.85 - sin * 1.4;
      const rightZ = car.pos.z - sin * 0.85 - cos * 1.4;

      const pL = new THREE.Vector3(leftX, 0.02, leftZ);
      const pR = new THREE.Vector3(rightX, 0.02, rightZ);

      if (lastPos.current) {
        if (marks.current.length >= MAX_MARKS) marks.current.shift();
        marks.current.push({ p1: pL, p2: pR, alpha: 1.0 });
      }
      lastPos.current = car.pos.clone();
    } else {
      lastPos.current = null;
    }

    // Update geometry buffer
    if (marks.current.length > 0) {
      const positions: number[] = [];
      for (const m of marks.current) {
        positions.push(m.p1.x, m.p1.y, m.p1.z);
        positions.push(m.p2.x, m.p2.y, m.p2.z);
      }
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    } else {
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    }
  });

  const lineSegmentsObj = useMemo(() => new THREE.LineSegments(lineGeo, lineMat), [lineGeo, lineMat]);

  return <primitive object={lineSegmentsObj} />;
}
