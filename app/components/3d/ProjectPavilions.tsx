"use client";

import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { soundFx } from "./SoundController";
import { PROJECT_POSITIONS, world } from "./worldStore";

export interface ProjectData {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  tech: string[];
  url?: string;
  repository?: string;
  color: string;
}

export const FEATURED_PROJECTS: ProjectData[] = [
  {
    id: "Waymo",
    slug: "Waymo",
    title: "Waymo Data Visualizer",
    category: "Systems & Telemetry",
    description:
      "High-performance internal telemetry data visualization & plotting tool built with C++, gRPC, Protobuf, Angular, Three.js, and D3.js. 400x autocomplete speedup, 10x load speedup.",
    tech: ["C++", "Three.js", "D3.js", "gRPC", "Protobuf"],
    color: "#06b6d4",
  },
  {
    id: "SolarSystem",
    slug: "SolarSystem",
    title: "3D Solar System",
    category: "3D Graphics & WebGL",
    description:
      "Interactive 3D celestial mechanics simulation built with WebGL and JavaScript featuring custom GLSL surface shaders and dynamic orbits.",
    tech: ["WebGL", "Three.js", "GLSL", "JavaScript"],
    repository: "https://github.com/lwhels/solarsystem",
    color: "#f59e0b",
  },
  {
    id: "Math142",
    slug: "Math142",
    title: "Olympic Analytics",
    category: "Data Science & Modeling",
    description:
      "Mathematical modeling and empirical data analytics evaluating historical Summer Olympics performance, host advantages, and coaching impact.",
    tech: ["Python", "Jupyter", "Pandas", "Scikit-Learn"],
    repository: "https://github.com/Lwhels/math142Project",
    color: "#eab308",
  },
  {
    id: "VehicularMedia",
    slug: "VehicularMedia",
    title: "Vehicular Media",
    category: "Web Application",
    description:
      "Portfolio website for a social media manager specializing in automobiles built with Next.js, Tailwind CSS, TypeScript, and AWS SES.",
    tech: ["Next.js", "TypeScript", "TailwindCSS", "AWS SES"],
    url: "https://VehicularMedia.com",
    repository: "https://github.com/lwhels/VehicularMedia",
    color: "#10b981",
  },
  {
    id: "Rourke",
    slug: "Rourke",
    title: "Rourke",
    category: "Full Stack & E-Commerce",
    description:
      "E-commerce and video streaming website supporting the production of Rourke Palmer's Sci-Fi novels.",
    tech: ["Next.js", "TypeScript", "TailwindCSS", "Firebase", "Stripe"],
    url: "https://github.com/lwhels/Rourke",
    repository: "https://github.com/lwhels/Rourke",
    color: "#8b5cf6",
  },
  {
    id: "BetFree",
    slug: "BetFree",
    title: "BetFree",
    category: "Mobile Application",
    description:
      "Free sports betting mobile app developed with JavaScript, React Native, CSS, Firebase, and a sports betting API.",
    tech: ["React Native", "Firebase", "JavaScript", "CSS"],
    url: "https://github.com/lwhels/BetFree",
    repository: "https://github.com/lwhels/BetFree",
    color: "#06b6d4",
  },
  {
    id: "Polymarket",
    slug: "Polymarket",
    title: "Polymarket Monitor",
    category: "Desktop App & Trading Tool",
    description:
      "Cross-platform desktop application for real-time Polymarket prediction market wallet tracking, alerts, and Discord webhooks.",
    tech: ["Python", "Tkinter", "PyInstaller", "Discord API"],
    repository: "https://github.com/Lwhels/polymarket",
    color: "#6366f1",
  },
  {
    id: "InstagramFollowers",
    slug: "InstagramFollowers",
    title: "Instagram Follower Analyzer",
    category: "Data Parsing & Scripting",
    description:
      "Python data extraction tool utilizing BeautifulSoup to analyze account follower exports and connection overlap.",
    tech: ["Python", "BeautifulSoup", "HTML Analysis"],
    repository: "https://github.com/Lwhels/instagram-followers",
    color: "#f43f5e",
  },
];

export const MORE_PROJECTS: ProjectData[] = [
  {
    id: "LAhacks",
    slug: "LAhacks",
    title: "LA Hacks Project",
    category: "Hackathon Project",
    description:
      "SongSwipe: Spotify top songs swiping and matching web app developed during the LA Hacks hackathon.",
    tech: ["Next.js", "TailwindCSS", "Spotify API", "Vercel"],
    repository: "https://github.com/lwhels",
    color: "#ec4899",
  },
  {
    id: "Math156",
    slug: "Math156",
    title: "Machine Learning",
    category: "Machine Learning",
    description:
      "Supervised machine learning algorithms evaluation including classification, decision trees, and neural networks.",
    tech: ["Python", "Jupyter", "Scikit-Learn", "NumPy"],
    repository: "https://github.com/Lwhels/math156-project",
    color: "#14b8a6",
  },
  {
    id: "ext2",
    slug: "ext2",
    title: "EXT2 File System",
    category: "Systems & C++",
    description:
      "Mountable ext2 filesystem created for the Linux kernel.",
    tech: ["C++", "Linux Kernel", "File Systems"],
    repository: "https://github.com/lwhels",
    color: "#f59e0b",
  },
  {
    id: "hashtable",
    slug: "hashtable",
    title: "Hash Table",
    category: "Algorithms & Systems",
    description:
      "Thread-safe hashtable implemented in C++ using mutexes and locks optimized for performance.",
    tech: ["C++", "Concurrency", "Mutexes"],
    repository: "https://github.com/lwhels/cs111lab3",
    color: "#3b82f6",
  },
];

export const PROJECTS_LIST: ProjectData[] = [...FEATURED_PROJECTS, ...MORE_PROJECTS];

function ProjectDiorama({ project, isNear }: { project: ProjectData; isNear: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const rotSpeed = isNear ? 2.5 : 0.8;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotSpeed;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isNear ? 2.0 : 0.6);
      ringRef.current.rotation.x += delta * 0.4;
    }
    if (coreRef.current) {
      coreRef.current.position.y = Math.sin(performance.now() * 0.003) * 0.15;
    }
  });

  switch (project.id) {
    case "Waymo":
      return (
        <group ref={groupRef} position={[0, 2.7, 0]}>
          <group ref={coreRef}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.2, 0.4, 0.7]} />
              <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} emissive="#06b6d4" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.25, 16]} />
              <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.9} />
            </mesh>
            <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.3, 1.4, 16, 1, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.5} wireframe />
            </mesh>
            {[-0.45, 0.45].map((x, i) =>
              [-0.28, 0.28].map((z, j) => (
                <mesh key={`${i}-${j}`} position={[x, -0.15, z]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
                  <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
                </mesh>
              ))
            )}
          </group>
        </group>
      );

    case "SolarSystem":
      return (
        <group ref={groupRef} position={[0, 2.7, 0]}>
          <group ref={coreRef}>
            <mesh>
              <sphereGeometry args={[0.45, 24, 24]} />
              <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.2} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.88, 0.92, 32]} />
              <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.3} />
            </mesh>
            <group position={[0.9, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.16, 16, 16]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
              </mesh>
              <mesh position={[0.26, 0.08, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.5} />
              </mesh>
            </group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.48, 1.52, 32]} />
              <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.25} />
            </mesh>
            <group position={[-1.5, 0.1, 0]}>
              <mesh>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={0.5} />
              </mesh>
              <mesh rotation={[0.4, 0.2, 0]}>
                <ringGeometry args={[0.3, 0.48, 24]} />
                <meshBasicMaterial color="#fef08a" side={THREE.DoubleSide} transparent opacity={0.7} />
              </mesh>
            </group>
          </group>
        </group>
      );

    case "Math142":
      return (
        <group ref={groupRef} position={[0, 2.7, 0]}>
          <group ref={coreRef}>
            <mesh position={[-0.4, -0.2, 0]}>
              <boxGeometry args={[0.32, 0.65, 0.32]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} emissive="#94a3b8" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.35, 1.05, 0.35]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} emissive="#f59e0b" emissiveIntensity={0.7} />
            </mesh>
            <mesh position={[0.4, -0.35, 0]}>
              <boxGeometry args={[0.32, 0.45, 0.32]} />
              <meshStandardMaterial color="#b45309" metalness={0.8} emissive="#b45309" emissiveIntensity={0.4} />
            </mesh>
            <group position={[0, 0.85, 0]}>
              {[-0.45, -0.22, 0, 0.22, 0.45].map((rx, idx) => {
                const ringColors = ["#0284c7", "#eab308", "#1e293b", "#16a34a", "#dc2626"];
                const yOff = idx % 2 === 1 ? -0.15 : 0.05;
                return (
                  <mesh key={idx} position={[rx, yOff, 0]}>
                    <torusGeometry args={[0.16, 0.03, 12, 24]} />
                    <meshStandardMaterial color={ringColors[idx]} emissive={ringColors[idx]} emissiveIntensity={0.8} />
                  </mesh>
                );
              })}
            </group>
          </group>
        </group>
      );

    case "VehicularMedia":
      return (
        <group ref={groupRef} position={[0, 2.7, 0]}>
          <group ref={coreRef}>
            <mesh>
              <boxGeometry args={[1.4, 0.35, 0.65]} />
              <meshStandardMaterial color="#10b981" wireframe emissive="#10b981" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.1, 0.28, 0]}>
              <boxGeometry args={[0.7, 0.25, 0.55]} />
              <meshStandardMaterial color="#059669" wireframe emissive="#10b981" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 1.1, 32]} />
              <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.4} />
            </mesh>
            <group position={[0.85, 0.45, 0.4]}>
              <mesh>
                <boxGeometry args={[0.2, 0.16, 0.18]} />
                <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.9} />
              </mesh>
              <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.06, 0.06, 0.14, 12]} />
                <meshBasicMaterial color="#6ee7b7" />
              </mesh>
            </group>
          </group>
        </group>
      );

    case "Rourke":
      return (
        <group ref={groupRef} position={[0, 2.7, 0]}>
          <group ref={coreRef}>
            <mesh>
              <boxGeometry args={[0.45, 1.1, 0.45]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} emissive="#8b5cf6" emissiveIntensity={0.5} />
            </mesh>
            <group ref={ringRef}>
              <mesh>
                <torusGeometry args={[0.9, 0.035, 16, 48]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.9} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.75, 0.03, 16, 48]} />
                <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.8} />
              </mesh>
            </group>
            <mesh>
              <octahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1.4} wireframe />
            </mesh>
          </group>
        </group>
      );

    case "BetFree":
      return (
        <group ref={groupRef} position={[0, 2.7, 0]}>
          <group ref={coreRef}>
            <mesh position={[-0.32, 0.1, 0]} rotation={[0.4, 0.5, 0.3]}>
              <boxGeometry args={[0.45, 0.45, 0.45]} />
              <meshStandardMaterial color="#0284c7" emissive="#06b6d4" emissiveIntensity={0.7} metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.32, -0.1, 0.1]} rotation={[-0.3, 0.6, -0.4]}>
              <boxGeometry args={[0.42, 0.42, 0.42]} />
              <meshStandardMaterial color="#0369a1" emissive="#38bdf8" emissiveIntensity={0.8} metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.85, 1.05, 24]} />
              <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.4} wireframe />
            </mesh>
          </group>
        </group>
      );

    case "Polymarket":
      return (
        <group ref={groupRef} position={[0, 2.7, 0]}>
          <group ref={coreRef}>
            {[
              { x: -0.5, h: 0.55, y: -0.1, up: true },
              { x: -0.25, h: 0.75, y: 0.1, up: false },
              { x: 0, h: 0.9, y: 0.25, up: true },
              { x: 0.25, h: 0.6, y: 0.15, up: true },
              { x: 0.5, h: 1.1, y: 0.4, up: true },
            ].map((bar, idx) => (
              <group key={idx} position={[bar.x, bar.y, 0]}>
                <mesh>
                  <boxGeometry args={[0.15, bar.h, 0.15]} />
                  <meshStandardMaterial
                    color={bar.up ? "#10b981" : "#ef4444"}
                    emissive={bar.up ? "#10b981" : "#ef4444"}
                    emissiveIntensity={0.8}
                  />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.015, 0.015, bar.h + 0.35, 6]} />
                  <meshBasicMaterial color={bar.up ? "#34d399" : "#f87171"} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 0.85, 32, 1, 0, Math.PI * 1.5]} />
              <meshBasicMaterial color="#6366f1" side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>
          </group>
        </group>
      );

    default:
      return (
        <group ref={groupRef} position={[0, 2.8, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color={project.color}
              emissive={project.color}
              emissiveIntensity={0.7}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>
      );
  }
}

interface PavilionProps {
  project: ProjectData;
  position: [number, number, number];
  carPosRef: React.RefObject<THREE.Vector3>;
  onSelectProject: (project: ProjectData) => void;
}

function ProjectPavilionItem({ project, position, carPosRef, onSelectProject }: PavilionProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const pedestalMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const [isNear, setIsNear] = useState(false);
  const isNearRef = useRef(false);

  const posVec = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame(({ clock }, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
    }

    if (carPosRef.current) {
      const dist = carPosRef.current.distanceTo(posVec);
      const nearNow = dist < 4.5;
      if (nearNow !== isNearRef.current) {
        isNearRef.current = nearNow;
        setIsNear(nearNow);
        if (pedestalMatRef.current) {
          pedestalMatRef.current.emissiveIntensity = nearNow ? 0.8 : 0.2;
        }
        if (nearNow) {
          soundFx.playChimeSound();
        }
      }
    }

    // Check collision with active blaster projectiles
    world.activeProjectiles.forEach((p) => {
      if (!p.active) return;
      if (p.pos.distanceTo(posVec) < 3.0) {
        p.active = false;
        soundFx.playHitSound(posVec);
        world.burst(posVec, project.color, 30, 8, { size: 0.45 });
        world.toast(`Holograph Activated: ${project.title}`);
        world.requestOpenProject(project);
      }
    });
  });

  const handleOpen = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelectProject(project);
    soundFx.playClickSound();
  };

  return (
    <group
      position={position}
      onClick={handleOpen}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {/* Pavilion Pedestal Base */}
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.2, 2.6, 0.6, 24]} />
        <meshStandardMaterial
          ref={pedestalMatRef}
          color="#1e1b4b"
          metalness={0.7}
          roughness={0.2}
          emissive={project.color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Glowing Proximity Ring */}
      <mesh ref={ringRef} position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.7, 24]} />
        <meshBasicMaterial color={project.color} side={THREE.DoubleSide} transparent opacity={0.6} depthWrite={false} />
      </mesh>

      {/* Custom 3D Interactive Miniature Project Diorama */}
      <ProjectDiorama project={project} isNear={isNear} />

      {/* Display Board Backing with 3D Spatial Image Screen */}
      <group position={[0, 1.6, 0]}>
        <mesh position={[0, 0, -0.1]} receiveShadow castShadow>
          <boxGeometry args={[3.2, 1.8, 0.2]} />
          <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.3, 1.9, 0.1]} />
          <meshStandardMaterial color={project.color} emissive={project.color} emissiveIntensity={0.35} />
        </mesh>
        <Html center distanceFactor={20} position={[0, 0, 0.15]} zIndexRange={[5, 0]}>
          <div
            onClick={handleOpen}
            className="w-56 h-32 rounded-xl overflow-hidden border-2 shadow-2xl bg-gray-900 cursor-pointer hover:scale-105 transition-all"
            style={{ borderColor: project.color }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/projects/${project.slug}.png`}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </Html>
      </group>

      {/* Floating Spatial Label Tag */}
      <Html position={[0, 4.4, 0]} center distanceFactor={22} zIndexRange={[5, 0]}>
        <div
          onClick={handleOpen}
          className="observatory-tag cursor-pointer hover:scale-110 transition-all flex items-center gap-2 shadow-2xl"
          style={{ borderColor: project.color }}
        >
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: project.color }} />
          <span className="font-bold text-white">{project.title}</span>
          <span className="text-[10px] text-violet-300 font-mono font-normal">View ↗</span>
        </div>
      </Html>
    </group>
  );
}

function MoreProjectsPavilion({
  position,
  carPosRef,
  onOpenArchive,
}: {
  position: [number, number, number];
  carPosRef: React.RefObject<THREE.Vector3>;
  onOpenArchive: () => void;
}) {
  const iconRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pedestalMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const isNearRef = useRef(false);

  const posVec = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    if (iconRef.current) {
      iconRef.current.rotation.y += delta * 1.5;
      iconRef.current.rotation.x += delta * 0.5;
      iconRef.current.position.y = 2.8 + Math.sin(time * 2.5) * 0.25;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 1.0;
    }

    if (carPosRef.current) {
      const dist = carPosRef.current.distanceTo(posVec);
      const nearNow = dist < 4.5;
      if (nearNow !== isNearRef.current) {
        isNearRef.current = nearNow;
        if (pedestalMatRef.current) {
          pedestalMatRef.current.emissiveIntensity = nearNow ? 0.9 : 0.3;
        }
        if (nearNow) {
          soundFx.playChimeSound();
        }
      }
    }

    world.activeProjectiles.forEach((p) => {
      if (!p.active) return;
      if (p.pos.distanceTo(posVec) < 3.0) {
        p.active = false;
        soundFx.playHitSound(posVec);
        world.burst(posVec, "#a855f7", 35, 9, { size: 0.5 });
        world.toast("Opening Projects Archive...");
        onOpenArchive();
      }
    });
  });

  const handleOpen = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playClickSound();
    onOpenArchive();
  };

  return (
    <group
      position={position}
      onClick={handleOpen}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {/* Pedestal Base */}
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.2, 2.6, 0.6, 24]} />
        <meshStandardMaterial
          ref={pedestalMatRef}
          color="#1e1b4b"
          metalness={0.8}
          roughness={0.2}
          emissive="#a855f7"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Proximity Ring */}
      <mesh ref={ringRef} position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.7, 24]} />
        <meshBasicMaterial color="#a855f7" side={THREE.DoubleSide} transparent opacity={0.7} depthWrite={false} />
      </mesh>

      {/* Spinning Geometric Archive Sphere / Prism */}
      <mesh ref={iconRef} position={[0, 2.8, 0]} castShadow>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={0.8}
          wireframe
        />
      </mesh>

      {/* Terminal Screen Backing */}
      <group position={[0, 1.6, 0]}>
        <mesh position={[0, 0, -0.1]} receiveShadow castShadow>
          <boxGeometry args={[3.2, 1.8, 0.2]} />
          <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.3, 1.9, 0.1]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} />
        </mesh>
        <Html center distanceFactor={20} position={[0, 0, 0.15]} zIndexRange={[5, 0]}>
          <div
            onClick={handleOpen}
            className="w-56 h-32 rounded-xl overflow-hidden border-2 border-purple-500 shadow-2xl bg-gradient-to-br from-purple-950 via-gray-900 to-black cursor-pointer hover:scale-105 transition-all flex flex-col items-center justify-center p-4 text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300 mb-2 group-hover:scale-110 transition-transform">
              <span className="text-xl font-bold tracking-widest">...</span>
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">More Projects Archive</span>
            <span className="text-[10px] text-purple-300 font-mono mt-1">[{MORE_PROJECTS.length} Additional Projects]</span>
          </div>
        </Html>
      </group>

      {/* Floating Tag */}
      <Html position={[0, 4.4, 0]} center distanceFactor={22} zIndexRange={[5, 0]}>
        <div
          onClick={handleOpen}
          className="observatory-tag cursor-pointer hover:scale-110 transition-all flex items-center gap-2 shadow-2xl border-purple-500 bg-purple-950/80"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
          <span className="font-bold text-white">... More Projects</span>
          <span className="text-[10px] text-purple-300 font-mono font-normal">Open Archive ↗</span>
        </div>
      </Html>
    </group>
  );
}

interface ProjectPavilionsProps {
  carPosRef: React.RefObject<THREE.Vector3>;
  onSelectProject: (project: ProjectData) => void;
}

export function ProjectPavilions({ carPosRef, onSelectProject }: ProjectPavilionsProps) {
  const handleOpenArchive = () => {
    world.emit("openProjectArchive", true);
  };

  return (
    <group>
      {FEATURED_PROJECTS.map((project, idx) => (
        <ProjectPavilionItem
          key={project.id}
          project={project}
          position={PROJECT_POSITIONS[idx] || [idx * 6, 0, 15]}
          carPosRef={carPosRef}
          onSelectProject={onSelectProject}
        />
      ))}
      <MoreProjectsPavilion
        position={PROJECT_POSITIONS[6] || [22, 0, 15]}
        carPosRef={carPosRef}
        onOpenArchive={handleOpenArchive}
      />
    </group>
  );
}

