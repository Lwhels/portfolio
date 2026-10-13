"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import { Vehicle } from "./Vehicle";
import { KnockableTitle } from "./KnockableText";
import { ProjectPavilions, ProjectData } from "./ProjectPavilions";
import { DataVizPlayground } from "./DataVizPlayground";
import { ArcadeZone } from "./ArcadeZone";
import { ContactPortal } from "./ContactPortal";
import { WaymoPavilion } from "./WaymoPavilion";
import { TimeTrialTrack } from "./TimeTrialTrack";
import { GhostCar } from "./GhostCar";
import { CollectiblesQuest } from "./CollectiblesQuest";
import { PathfindingVisualizer } from "./PathfindingVisualizer";
import { GameOfLifeGrid } from "./GameOfLifeGrid";
import { Skidmarks } from "./Skidmarks";
import { CosmicAtmosphere } from "./CosmicAtmosphere";
import { AudioPulseRings } from "./AudioPulseRings";
import { InteractiveProps } from "./InteractiveProps";
import { ParticleSystem, ExhaustEmitter, DustField, LightShafts, ForcefieldBoundary } from "./Effects";
import { LidarOverlay } from "./LidarOverlay";
import { soundFx } from "./SoundController";
import { ThemeContext, THEMES, ThemeId } from "./themes";
import { findPath, findPathDetailed } from "./pathfinding";
import { world, CameraPreset, RoverSkin, ZONES, wrapAngle, TOUR_STOPS, WAYMO } from "./worldStore";

interface SceneProps {
  cameraPreset: CameraPreset;
  themeId: ThemeId;
  skin: RoverSkin;
  onSelectProject: (project: ProjectData) => void;
}

export function Scene({ cameraPreset, themeId, skin, onSelectProject }: SceneProps) {
  const theme = THEMES[themeId];
  const { camera, raycaster, pointer } = useThree();
  const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));
  const groundMeshRef = useRef<THREE.Mesh>(null);
  const clickMarkerRef = useRef<THREE.Mesh>(null);

  /* ---------------------- Click-to-Move Pathfinding --------------------- */
  const handlePointerDown = (e: { button?: number }) => {
    // Only respond to primary click / tap on ground when in vehicle mode
    if (e.button !== 0 || cameraPreset !== "vehicle" || world.tourActive) return;
    if (!groundMeshRef.current) return;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(groundMeshRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0].point;
      const dx = hit.x - world.car.pos.x;
      const dz = hit.z - world.car.pos.z;
      const dist = Math.hypot(dx, dz);
      const angleToHit = Math.atan2(dx, dz);
      const fwdDiff = Math.abs(wrapAngle(angleToHit - world.car.heading));

      const { waypoints, explored } = findPathDetailed(world.car.pos, hit);
      let finalWaypoints = waypoints;

      // If target is close (< 8m) and at an awkward side angle (> 65 deg),
      // insert an intermediate backing waypoint to execute a clean 2-step maneuver
      if (dist < 8.0 && fwdDiff > 1.1 && finalWaypoints.length <= 1) {
        const backX = world.car.pos.x - Math.sin(world.car.heading) * 2.5;
        const backZ = world.car.pos.z - Math.cos(world.car.heading) * 2.5;
        const midPoint = new THREE.Vector3(backX, 0, backZ);
        finalWaypoints = [midPoint, hit];
      }

      if (finalWaypoints.length > 0) {
        world.setPath(finalWaypoints, hit, explored);
        if (clickMarkerRef.current) {
          clickMarkerRef.current.position.set(hit.x, 0.08, hit.z);
        }
      }
    }
  };

  /* ---------------------------- Camera Motion --------------------------- */
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);

    if (world.tourActive) {
      const stop = TOUR_STOPS[world.tourStopIndex];
      // Autopilot navigation towards tour stop if distance > 2m
      const dx = stop.targetPos[0] - world.car.pos.x;
      const dz = stop.targetPos[1] - world.car.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 2.0 && world.path.length === 0) {
        const dest = new THREE.Vector3(stop.targetPos[0], 0, stop.targetPos[1]);
        const wps = findPath(world.car.pos, dest);
        world.setPath(wps, dest);
      }

      // Smooth cinematic camera positioning framing the stop
      const targetCamPos = new THREE.Vector3(
        stop.targetPos[0] + (stop.id === "hero" ? 0 : -8),
        stop.id === "hero" ? 11 : 12,
        stop.targetPos[1] + (stop.id === "hero" ? 14 : 14)
      );
      camera.position.lerp(targetCamPos, delta * 3.0);
      cameraTarget.current.lerp(new THREE.Vector3(stop.targetPos[0], 1.5, stop.targetPos[1]), delta * 3.5);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "cockpit") {
      // First-person / Cockpit FPV Cam
      const heading = world.car.heading;
      const targetCamPos = new THREE.Vector3(
        world.car.pos.x + Math.sin(heading) * 0.4,
        world.car.pos.y + 1.25,
        world.car.pos.z + Math.cos(heading) * 0.4
      );
      camera.position.lerp(targetCamPos, delta * 15.0);
      const lookTarget = new THREE.Vector3(
        world.car.pos.x + Math.sin(heading) * 16.0,
        world.car.pos.y + 1.0,
        world.car.pos.z + Math.cos(heading) * 16.0
      );
      cameraTarget.current.lerp(lookTarget, delta * 15.0);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "vehicle") {
      const heading = world.car.heading;
      const speed = world.car.speed;

      const camOffsetDistance = 11 + Math.abs(speed) * 0.2;
      const camOffsetHeight = 6.5 + Math.abs(speed) * 0.1;

      const targetCamPos = new THREE.Vector3(
        world.car.pos.x - Math.sin(heading) * camOffsetDistance,
        world.car.pos.y + camOffsetHeight,
        world.car.pos.z - Math.cos(heading) * camOffsetDistance
      );

      camera.position.lerp(targetCamPos, delta * 5.0);
      const lookTarget = world.car.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
      cameraTarget.current.lerp(lookTarget, delta * 6.0);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "hero") {
      const targetCamPos = new THREE.Vector3(0, 12, 14);
      camera.position.lerp(targetCamPos, delta * 3.5);
      cameraTarget.current.lerp(new THREE.Vector3(0, 2, -6), delta * 4);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "waymo") {
      const targetCamPos = new THREE.Vector3(-18, 14, 16);
      camera.position.lerp(targetCamPos, delta * 3.5);
      cameraTarget.current.lerp(new THREE.Vector3(-18, 1.5, 0), delta * 4);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "projects") {
      const targetCamPos = new THREE.Vector3(-2, 18, 38);
      camera.position.lerp(targetCamPos, delta * 3.5);
      cameraTarget.current.lerp(new THREE.Vector3(-2, 0, 22), delta * 4);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "dataviz") {
      const targetCamPos = new THREE.Vector3(29, 18, 16);
      camera.position.lerp(targetCamPos, delta * 3.5);
      cameraTarget.current.lerp(new THREE.Vector3(29, 0, -2), delta * 4);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "arcade") {
      const targetCamPos = new THREE.Vector3(2, 18, -14);
      camera.position.lerp(targetCamPos, delta * 3.5);
      cameraTarget.current.lerp(new THREE.Vector3(2, 0, -33), delta * 4);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "contact") {
      const targetCamPos = new THREE.Vector3(-30, 14, 2);
      camera.position.lerp(targetCamPos, delta * 3.5);
      cameraTarget.current.lerp(new THREE.Vector3(-30, 0, -14), delta * 4);
      camera.lookAt(cameraTarget.current);
    } else if (cameraPreset === "overview") {
      const targetCamPos = new THREE.Vector3(0, 52, 1);
      camera.position.lerp(targetCamPos, delta * 3.5);
      cameraTarget.current.lerp(new THREE.Vector3(0, 0, 0), delta * 4);
      camera.lookAt(cameraTarget.current);
    }
  });

  return (
    <ThemeContext.Provider value={theme}>
      {/* Dynamic Theme Atmosphere & Lighting */}
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fog, 35, 130]} />

      <ambientLight intensity={1.8} />
      <hemisphereLight args={[theme.hemiSky, theme.hemiGround, 1.4]} />
      <directionalLight
        position={[25, 45, 20]}
        intensity={2.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-far={140}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <pointLight position={[-20, 15, -20]} intensity={2.2} color={theme.primary} />
      <pointLight position={[20, 15, 20]} intensity={2.2} color={theme.secondary} />

      {/* Cyber Grid Ground Plane */}
      <mesh
        ref={groundMeshRef}
        position={[0, -0.01, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color={theme.ground} roughness={0.5} metalness={0.3} />
      </mesh>

      <Grid
        position={[0, 0.05, 0]}
        args={[140, 140]}
        cellSize={2}
        cellThickness={1.2}
        cellColor={theme.gridCell}
        sectionSize={10}
        sectionThickness={2}
        sectionColor={theme.gridSection}
        fadeDistance={110}
        fadeStrength={1.2}
        infiniteGrid
      />

      {/* Click-to-move Target Marker Ring */}
      <mesh ref={clickMarkerRef} position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.1, 32]} />
        <meshBasicMaterial color={theme.accent} side={THREE.DoubleSide} transparent opacity={0.8} depthWrite={false} />
      </mesh>

      {/* Shared Pooled Particles & Atmosphere */}
      <CosmicAtmosphere />
      <ParticleSystem />
      <ExhaustEmitter skin={skin} />
      <DustField />
      {/* Tire Skidmarks Trails */}
      <Skidmarks />

      {/* The Interactive Rover Vehicle */}
      <Vehicle skin={skin} />

      {/* Biome 1: Hero Hub & Knockable Voxel Title */}
      <KnockableTitle />

      {/* Biome 2: Waymo Autonomous Exhibit */}
      <WaymoPavilion
        onSelect={(slug) => {
          onSelectProject({
            slug,
            title: "Waymo Data Visualizer",
            description: "High-performance internal telemetry data visualization & plotting tool built with C++, gRPC, Protobuf, Angular, Three.js, and D3.js.",
          } as ProjectData);
        }}
      />
      <Html position={[-18, 6.5, 0]} center distanceFactor={25} zIndexRange={[5, 0]}>
        <div className="observatory-tag font-bold tracking-widest uppercase text-cyan-300 border-cyan-500/40">
          Waymo Tech Pavilion
        </div>
      </Html>

      {/* Biome 3: Holographic Project Pavilions */}
      <ProjectPavilions carPosRef={{ current: world.car.pos }} onSelectProject={onSelectProject} />
      <Html position={[-2, 6.5, 22]} center distanceFactor={25} zIndexRange={[5, 0]}>
        <div className="observatory-tag font-bold tracking-widest uppercase">Project Holograph Vault</div>
      </Html>

      {/* Biome 4: 3D Data Viz Sandbox */}
      <DataVizPlayground />
      <Html position={[29, 6.5, -2]} center distanceFactor={25} zIndexRange={[5, 0]}>
        <div className="observatory-tag font-bold tracking-widest uppercase">Data Viz Lab</div>
      </Html>

      {/* Biome 5: Arcade & Physics Zone */}
      <ArcadeZone />
      <Html position={[2, 6.5, -33]} center distanceFactor={25} zIndexRange={[5, 0]}>
        <div className="observatory-tag font-bold tracking-widest uppercase">Arcade & Physics</div>
      </Html>

      {/* Biome 6: Contact Portal */}
      <ContactPortal />

      {/* Time-Trial Checkpoint Race Course & Ghost Replay */}
      <TimeTrialTrack />
      <GhostCar />

      {/* 5 Hidden Collectible Artifacts */}
      <CollectiblesQuest />

      {/* A* Wavefront Visualizer & High-Speed Launchpad */}
      <PathfindingVisualizer />

      {/* Interactive Conway's Game of Life Cellular Automata Grid */}
      <GameOfLifeGrid />

      {/* Real-time Audio-reactive Floor Rings & Equalizer */}
      <AudioPulseRings />

      {/* Dynamic Physics Cones & Obstacles */}
      <InteractiveProps />

      {/* Holographic Cyber Forcefield Barrier & Corner Energy Spires */}
      <ForcefieldBoundary />

      {/* 360° LiDAR Autonomous Sensor Point Cloud & 3D Detection Boxes */}
      <LidarOverlay />

      {/* High-Energy EMP Blast Shockwave Visuals */}
      <EmpShockwaveEffect />
    </ThemeContext.Provider>
  );
}

function EmpShockwaveEffect() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const stateRef = useRef({ active: false, t: 0, pos: new THREE.Vector3() });

  useEffect(() => {
    const unsub = world.on("emp", (payload) => {
      const data = payload as { token: number; pos: THREE.Vector3 };
      stateRef.current.active = true;
      stateRef.current.t = 0;
      stateRef.current.pos.copy(data.pos);
      soundFx.playEmpSound(data.pos);
    });
    return unsub;
  }, []);

  useFrame((_, delta) => {
    if (!stateRef.current.active) return;
    stateRef.current.t += delta * 2.2;
    const t = stateRef.current.t;

    if (t >= 1.0) {
      stateRef.current.active = false;
      if (meshRef.current) meshRef.current.visible = false;
      if (ringRef.current) ringRef.current.visible = false;
      return;
    }

    const radius = t * 18.0;
    const opacity = (1.0 - t) * 0.85;

    if (meshRef.current) {
      meshRef.current.visible = true;
      meshRef.current.position.set(stateRef.current.pos.x, 0.22, stateRef.current.pos.z);
      meshRef.current.scale.set(radius, radius, radius);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }

    if (ringRef.current) {
      ringRef.current.visible = true;
      ringRef.current.position.set(stateRef.current.pos.x, 0.28, stateRef.current.pos.z);
      ringRef.current.scale.set(radius * 1.05, radius * 1.05, radius * 1.05);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.88, 1.0, 48]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.96, 1.04, 48]} />
        <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}
