"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { soundFx } from "./SoundController";
import { useTheme } from "./themes";
import { CONTACT, world } from "./worldStore";

const CONTACT_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/lucas-wheeler-0693651b3", pos: [-33, 2.2, -18] as [number, number, number] },
  { label: "Email", href: "mailto:lwheelerdev@gmail.com", pos: [-30, 3.8, -20] as [number, number, number] },
  { label: "GitHub", href: "https://github.com/lwhels", pos: [-27, 2.2, -18] as [number, number, number] },
];

export function ContactPortal() {
  const theme = useTheme();
  const ringRef = useRef<THREE.Mesh>(null);
  const portalInnerRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
      ringRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
    }

    if (portalInnerRef.current) {
      const mat = portalInnerRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(time * 3) * 0.15;
    }

    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(time * 4) * 1.2;
    }
  });

  return (
    <group position={[CONTACT.portal.x, 0, CONTACT.portal.z]}>
      {/* 1. Holographic Stargate Ring */}
      <group position={[0, 4.2, 0]}>
        <mesh ref={ringRef} castShadow>
          <torusGeometry args={[3.8, 0.35, 16, 64]} />
          <meshStandardMaterial
            color={theme.accent}
            emissive={theme.accent}
            emissiveIntensity={1.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Swirling Event Horizon Plasma */}
        <mesh ref={portalInnerRef} rotation={[0, 0, 0]}>
          <circleGeometry args={[3.5, 32]} />
          <meshBasicMaterial color={theme.primary} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight ref={lightRef} color={theme.accent} intensity={3} distance={15} />
      </group>

      {/* Base Shrine Pedestal */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[4.8, 5.4, 0.4, 32]} />
        <meshStandardMaterial color={theme.surface} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 4.6, 32]} />
        <meshBasicMaterial color={theme.accent} side={THREE.DoubleSide} depthWrite={false} transparent opacity={0.9} />
      </mesh>

      {/* 2. Floating Contact Links Terminals */}
      {CONTACT_LINKS.map((item, i) => (
        <group key={i} position={[item.pos[0] - CONTACT.portal.x, item.pos[1], item.pos[2] - CONTACT.portal.z]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={1.2} />
          </mesh>
          <Html position={[0, 1.2, 0]} center distanceFactor={20} zIndexRange={[5, 0]}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundFx.playClickSound()}
              className="observatory-tag cursor-pointer hover:scale-110 transition-transform"
              style={{ borderColor: theme.accent, color: "#ffffff" }}
            >
              {item.label} ↗
            </a>
          </Html>
        </group>
      ))}

      {/* Header Tag */}
      <Html position={[0, 9.2, 0]} center distanceFactor={25} zIndexRange={[5, 0]}>
        <div className="observatory-tag font-bold tracking-widest text-sm" style={{ borderColor: theme.accent }}>
          CONTACT PORTAL STARGATE
        </div>
      </Html>
    </group>
  );
}
