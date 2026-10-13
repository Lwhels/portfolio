"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Scene } from "./Scene";
import { ProjectData } from "./ProjectPavilions";
import { soundFx } from "./SoundController";
import { CameraPreset, RoverSkin, world } from "./worldStore";
import { ThemeId } from "./themes";

interface CanvasContainerProps {
  cameraPreset: CameraPreset;
  themeId: ThemeId;
  skin: RoverSkin;
  joystickVector: { x: number; y: number };
  onSelectProject: (project: ProjectData) => void;
}

function CanvasContainerComponent({
  cameraPreset,
  themeId,
  skin,
  joystickVector,
  onSelectProject,
}: CanvasContainerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    soundFx.init();
    world.restoreCarState();
    const timer = setTimeout(() => setIsLoaded(true), 400);

    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      soundFx.unlock();

      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      const code = e.code;

      if (key === "w" || key === "z" || key === "arrowup" || code === "KeyW" || code === "ArrowUp") {
        world.input.forward = isDown;
      }
      if (key === "s" || key === "arrowdown" || code === "KeyS" || code === "ArrowDown") {
        world.input.backward = isDown;
      }
      if (key === "a" || key === "q" || key === "arrowleft" || code === "KeyA" || code === "ArrowLeft") {
        world.input.left = isDown;
      }
      if (key === "d" || key === "arrowright" || code === "KeyD" || code === "ArrowRight") {
        world.input.right = isDown;
      }
      if (key === " " || key === "space" || code === "Space") {
        world.input.boost = isDown;
      }
      if (key === "shift" || code === "ShiftLeft" || code === "ShiftRight") {
        world.input.drift = isDown;
      }
      if (isDown && (key === "f" || code === "KeyF")) {
        world.requestFire();
      }
      if (isDown && (key === "e" || code === "KeyE")) {
        world.triggerEmp();
      }
      if (isDown && (key === "v" || code === "KeyV")) {
        world.toggleLidar();
      }
      if (isDown && (key === "x" || code === "KeyX" || key === "y" || code === "KeyY")) {
        world.toggleTelemetry();
      }
      if (isDown && (key === "r" || code === "KeyR")) {
        world.requestRebuild();
      }
      if (isDown && (key === "h" || code === "KeyH")) {
        soundFx.playChime(523.25);
        setTimeout(() => soundFx.playChime(659.25), 90);
        setTimeout(() => soundFx.playChime(783.99), 180);
        world.toast("🎺 HONK HONK!");
      }
      if (isDown && (key === "l" || code === "KeyL")) {
        world.car.headlights = !world.car.headlights;
        world.toast(world.car.headlights ? "💡 Headlights ON" : "🌑 Headlights OFF");
      }
      if (isDown && (key === "t" || code === "KeyT")) {
        if (world.tourActive) world.stopTour();
        else world.startTour();
      }
    };

    const resetInput = () => {
      world.input.forward = false;
      world.input.backward = false;
      world.input.left = false;
      world.input.right = false;
      world.input.boost = false;
      world.input.drift = false;
      world.input.joyX = 0;
      world.input.joyY = 0;
      world.car.drifting = false;
      world.car.boosting = false;
    };

    const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);
    const onPointerDown = () => soundFx.unlock();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("blur", resetInput);
    document.addEventListener("visibilitychange", resetInput);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("blur", resetInput);
      document.removeEventListener("visibilitychange", resetInput);
      clearTimeout(timer);
    };
  }, []);

  // Sync touch joystick vector to world store
  useEffect(() => {
    world.input.joyX = joystickVector.x;
    world.input.joyY = joystickVector.y;
  }, [joystickVector]);

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950 text-white gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium tracking-widest text-zinc-400 uppercase">Initializing Observatory WebGL...</p>
        </div>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 8, 20], fov: 50, near: 0.5, far: 220 }}
        onCreated={() => setIsLoaded(true)}
        className="w-full h-full"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
      >
        <Scene
          cameraPreset={cameraPreset}
          themeId={themeId}
          skin={skin}
          onSelectProject={onSelectProject}
        />
      </Canvas>
    </div>
  );
}

export const CanvasContainer = React.memo(CanvasContainerComponent);
export default CanvasContainer;
