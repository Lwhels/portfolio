"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectData } from "../components/3d/ProjectPavilions";
import { ControlsOverlay } from "../components/ui/ControlsOverlay";
import { ProjectModal } from "../components/ui/ProjectModal";
import { QuickMenuView } from "../components/ui/QuickMenuView";
import { CameraPreset, RoverSkin, world } from "../components/3d/worldStore";
import { ThemeId } from "../components/3d/themes";

const CanvasContainer = dynamic(() => import("../components/3d/CanvasContainer"), {
  ssr: false,
});

export default function SimulationPage() {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("vehicle");
  const [themeId, setThemeId] = useState<ThemeId>("cyber");
  const [skin, setSkin] = useState<RoverSkin>("sports");
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const unsub1 = world.on("openProject", (proj: unknown) => {
      setSelectedProject(proj as ProjectData);
    });
    const unsub2 = world.on("openProjectArchive", () => {
      setIsQuickMenuOpen(true);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleSelectProject = useCallback((proj: ProjectData) => {
    setSelectedProject(proj);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleToggleQuickMenu = useCallback(() => {
    setIsQuickMenuOpen((prev) => !prev);
  }, []);

  const handleCloseQuickMenu = useCallback(() => {
    setIsQuickMenuOpen(false);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-950">
      {/* Top Navigation bar back to main site */}
      <div className="absolute top-4 left-4 z-40">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-950/95 border border-white/10 text-white text-xs font-semibold hover:bg-violet-600 transition-all shadow-xl"
        >
          <ArrowLeft className="w-4 h-4 text-violet-400" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* 3D Canvas Scene */}
      <div className="absolute inset-0 z-0">
        <CanvasContainer
          cameraPreset={cameraPreset}
          themeId={themeId}
          skin={skin}
          joystickVector={joystickVector}
          onSelectProject={handleSelectProject}
        />
      </div>

      {/* Interactive HUD Overlay */}
      <ControlsOverlay
        cameraPreset={cameraPreset}
        setCameraPreset={setCameraPreset}
        themeId={themeId}
        setThemeId={setThemeId}
        skin={skin}
        setSkin={setSkin}
        onToggleQuickMenu={handleToggleQuickMenu}
        isQuickMenuOpen={isQuickMenuOpen}
        setJoystickVector={setJoystickVector}
      />

      {/* Project Details Modal */}
      <ProjectModal project={selectedProject} onClose={handleCloseModal} />

      {/* Fullscreen 2D Quick Menu */}
      <QuickMenuView
        isOpen={isQuickMenuOpen}
        onClose={handleCloseQuickMenu}
        onSelectProject={handleSelectProject}
      />
    </main>
  );
}
