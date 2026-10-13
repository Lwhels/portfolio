"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundFx } from "../3d/SoundController";
import { THEMES, THEME_ORDER, ThemeId } from "../3d/themes";
import { SKIN_LABELS, SKIN_STATS } from "../3d/Vehicle";
import {
  world,
  CameraPreset,
  RoverSkin,
  zoneName,
  ZoneId,
  TOUR_STOPS,
  TourStop,
  COLLECTIBLES,
  RACE_CHECKPOINTS,
} from "../3d/worldStore";
import { MinimapRadar } from "./MinimapRadar";
import { TelemetryDrawer } from "./TelemetryDrawer";
import {
  Volume2,
  VolumeX,
  Compass,
  LayoutGrid,
  Zap,
  Sparkles,
  Navigation,
  Crosshair,
  Sliders,
  Palette,
  Car,
  Activity,
  RotateCcw,
  Radio,
  Eye,
  Trophy,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Lightbulb,
  BellRing,
  Flag,
  Award,
  Music,
  Camera,
  Bot,
} from "lucide-react";

interface ControlsOverlayProps {
  cameraPreset: CameraPreset;
  setCameraPreset: (preset: CameraPreset) => void;
  themeId: ThemeId;
  setThemeId: (theme: ThemeId) => void;
  skin: RoverSkin;
  setSkin: (skin: RoverSkin) => void;
  onToggleQuickMenu: () => void;
  isQuickMenuOpen: boolean;
  setJoystickVector: (vector: { x: number; y: number }) => void;
}

export function ControlsOverlay({
  cameraPreset,
  setCameraPreset,
  themeId,
  setThemeId,
  skin,
  setSkin,
  onToggleQuickMenu,
  isQuickMenuOpen,
  setJoystickVector,
}: ControlsOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isBgmOn, setIsBgmOn] = useState(false);
  const [score, setScore] = useState(0);
  const [currentZone, setCurrentZone] = useState<ZoneId>("hero");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMathPanelOpen, setIsMathPanelOpen] = useState(false);
  const [isPerfOpen, setIsPerfOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStopIndex, setTourStopIndex] = useState(0);
  const [currentTourStop, setCurrentTourStop] = useState<TourStop | null>(null);

  // Race State
  const [isRacing, setIsRacing] = useState(false);
  const [raceCheckpoint, setRaceCheckpoint] = useState(0);
  const [raceLapTime, setRaceLapTime] = useState(0);
  const [bestLap, setBestLap] = useState<string | null>(null);

  // Collectibles State
  const [collectedCount, setCollectedCount] = useState(0);

  // Drift Charge State
  const [driftCharge, setDriftCharge] = useState(0);
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [isAutopilotOn, setIsAutopilotOn] = useState(false);
  const [isLidarOn, setIsLidarOn] = useState(world.lidarEnabled);
  const [isTelemetryOn, setIsTelemetryOn] = useState(world.telemetryOpen);

  // Performance Stats state
  const [fps, setFps] = useState(60);

  // Math params state
  const [freq, setFreq] = useState(world.params.frequency);
  const [amp, setAmp] = useState(world.params.amplitude);
  const [morph, setMorph] = useState(world.params.morph);

  const speedSpanRef = useRef<HTMLSpanElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsMuted(soundFx.getMuted());
    const touchCheck = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touchCheck);

    if (typeof window !== "undefined") {
      try {
        const savedBest = localStorage.getItem("rover_best_lap");
        if (savedBest) setBestLap(savedBest);
      } catch {}
    }

    // Subscriptions to world events
    const unsubScore = world.on("score", (s) => setScore(s as number));
    const unsubZone = world.on("zone", (z) => setCurrentZone(z as ZoneId));
    const unsubToast = world.on("toast", (msg) => {
      setToastMessage(msg as string);
      setTimeout(() => setToastMessage(null), 3200);
    });

    const unsubTour = world.on("tour", (payload: unknown) => {
      const data = payload as { active: boolean; stopIndex: number; stop: TourStop | null };
      setIsTourActive(data.active);
      setTourStopIndex(data.stopIndex);
      setCurrentTourStop(data.stop);
    });

    const unsubRace = world.on("race", (payload: unknown) => {
      const data = payload as { active: boolean; checkpoint: number; time?: number; completed?: boolean };
      setIsRacing(data.active);
      setRaceCheckpoint(data.checkpoint);
      if (data.completed && typeof window !== "undefined") {
        try {
          const savedBest = localStorage.getItem("rover_best_lap");
          if (savedBest) setBestLap(savedBest);
        } catch {}
      }
    });

    const unsubCollect = world.on("collectibles", (payload: unknown) => {
      const data = payload as { count: number };
      setCollectedCount(data.count);
    });

    const unsubAutopilot = world.on("autopilot", (val: unknown) => {
      setIsAutopilotOn(val as boolean);
    });

    const unsubLidar = world.on("lidar", (val: unknown) => {
      setIsLidarOn(Boolean(val));
    });

    const unsubTelemetry = world.on("telemetry", (val: unknown) => {
      setIsTelemetryOn(Boolean(val));
    });

    // Speedometer, drift & race timer ticker
    let lastTime = performance.now();
    let frames = 0;
    const interval = setInterval(() => {
      if (speedSpanRef.current) {
        speedSpanRef.current.innerText = Math.round(Math.abs(world.car.speed) * 3.5).toString();
      }

      setDriftCharge(world.car.driftCharge);
      setHeadlightsOn(world.car.headlights);

      if (world.raceActive) {
        setRaceLapTime((performance.now() - world.raceStartTime) / 1000);
      }

      const now = performance.now();
      frames++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
    }, 100);

    return () => {
      unsubScore();
      unsubZone();
      unsubToast();
      unsubTour();
      unsubRace();
      unsubCollect();
      unsubAutopilot();
      unsubLidar();
      unsubTelemetry();
      clearInterval(interval);
    };
  }, []);

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleHonk = () => {
    soundFx.playChime(523.25);
    setTimeout(() => soundFx.playChime(659.25), 90);
    setTimeout(() => soundFx.playChime(783.99), 180);
    world.toast("🎺 HONK HONK!");
  };

  const handleToggleHeadlights = () => {
    world.car.headlights = !world.car.headlights;
    setHeadlightsOn(world.car.headlights);
    world.toast(world.car.headlights ? "💡 Headlights ON" : "🌑 Headlights OFF");
  };

  const handleSnapshot = () => {
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Lucas-Wheeler-Vault-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      soundFx.playChime(880);
      world.toast("📸 Snapshot captured and saved to downloads!");
    } catch {
      world.toast("Snapshot failed");
    }
  };

  /* ---------------- Virtual Touch Joystick ---------------- */
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    soundFx.unlock();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    const maxDist = 45;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(deltaY, deltaX);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });
    setJoystickVector({ x: knobX / maxDist, y: knobY / maxDist });
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    setJoystickVector({ x: 0, y: 0 });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* 1. Top Header HUD */}
      <div className="flex items-center justify-between gap-4">
        {/* Title Badge & Current Zone Indicator */}
        <div className="pointer-events-auto flex items-center gap-3 bg-gray-950/95 border border-white/10 px-4 py-2 rounded-full shadow-xl">
          <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-wide text-xs sm:text-sm">Lucas Wheeler</span>
            <span className="text-[10px] text-violet-400 font-mono flex items-center gap-1">
              <Compass className="w-3 h-3 inline" /> {zoneName(currentZone)}
            </span>
          </div>
        </div>

        {/* Center Toast Banner */}
        {toastMessage && (
          <div className="pointer-events-auto animate-bounce bg-violet-600/95 text-white font-semibold text-xs px-4 py-2 rounded-full border border-violet-400 shadow-2xl">
            {toastMessage}
          </div>
        )}

        {/* Top Right Controls (Tour, Theme, Sound, Quick Menu) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Guided Tour Start Button */}
          <button
            onClick={() => {
              soundFx.playClickSound();
              if (isTourActive) world.stopTour();
              else world.startTour();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all shadow-lg ${
              isTourActive
                ? "bg-amber-500 border-amber-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                : "bg-violet-600/90 hover:bg-violet-500 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
            }`}
            title="Start Guided Autopilot Tour (Key: T)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-sans">{isTourActive ? "Exit Tour" : "Guided Tour"}</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={() => {
              const nextIdx = (THEME_ORDER.indexOf(themeId) + 1) % THEME_ORDER.length;
              setThemeId(THEME_ORDER[nextIdx]);
              soundFx.playClickSound();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-950/95 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all shadow-md"
            title="Switch Visual Theme"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline font-mono">{THEMES[themeId]?.name ?? "Cyber Neon"}</span>
          </button>

          {/* Quick Menu Toggle */}
          <button
            onClick={() => {
              soundFx.playClickSound();
              onToggleQuickMenu();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 shadow-md ${
              isQuickMenuOpen
                ? "bg-violet-600 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                : "bg-gray-950/95 border-white/10 text-zinc-300 hover:text-white hover:border-violet-500/50"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isQuickMenuOpen ? "3D Observatory" : "2D Quick Menu"}</span>
          </button>

          {/* BGM Toggle Button */}
          <button
            onClick={() => {
              const bgmActive = soundFx.toggleBgm();
              setIsBgmOn(bgmActive);
              world.toast(bgmActive ? "🎵 Synth Arpeggiator BGM: ON" : "🔇 BGM: OFF");
            }}
            aria-label="Toggle Synth BGM"
            className={`p-2.5 rounded-full border transition-all shadow-md ${
              isBgmOn
                ? "bg-violet-600/30 border-violet-400 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                : "bg-gray-950/95 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="Toggle Procedural Synth BGM"
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="p-2.5 rounded-full bg-gray-950/95 border border-white/10 text-zinc-300 hover:text-white hover:border-violet-500/50 transition-all shadow-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. Middle Floating Panels (Minimap Radar / Guided Tour Card / Race HUD / Math Drawer / Perf) */}
      <div className="flex items-start justify-between gap-4">
        {/* Left Column: Minimap Radar + Guided Tour Card */}
        <div className="flex flex-col gap-3">
          <TelemetryDrawer />
          <MinimapRadar />

          {/* Guided Tour Floating Card (When Tour Active) */}
          {isTourActive && currentTourStop && (
          <div className="pointer-events-auto bg-gray-950/95 border border-amber-500/50 rounded-2xl p-5 max-w-sm shadow-2xl animate-fade-in flex flex-col gap-3 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Guided Tour · Stop {tourStopIndex + 1} of {TOUR_STOPS.length}
              </span>
              <button
                onClick={() => world.stopTour()}
                className="text-zinc-500 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-bold text-white font-display">
              {currentTourStop.title}
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {currentTourStop.description}
            </p>

            <div className="flex flex-wrap gap-1 mt-1">
              {currentTourStop.highlights.map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Tour Navigation Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
              <button
                onClick={() => world.prevTourStop()}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => world.stopTour()}
                className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Take the Wheel
              </button>
              <button
                onClick={() => world.nextTourStop()}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
              >
                Next <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Right: Race / Time Trial Status Panel */}
        {isRacing && (
          <div className="pointer-events-auto bg-gray-950/95 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-1.5 font-mono text-xs animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-400 border-b border-white/10 pb-1.5">
              <Flag className="w-4 h-4" /> TIME TRIAL LAP
            </div>
            <div className="text-xl font-bold text-white">
              {raceLapTime.toFixed(2)}s
            </div>
            <div className="text-[11px] text-zinc-400">
              Checkpoint: <span className="text-emerald-400 font-bold">{raceCheckpoint}</span> / {RACE_CHECKPOINTS.length - 1}
            </div>
            {bestLap && (
              <div className="text-[10px] text-amber-400">
                Personal Best: {bestLap}s
              </div>
            )}
          </div>
        )}

        {/* Math Controls Drawer */}
        {isMathPanelOpen && (
          <div className="pointer-events-auto bg-gray-950/95 border border-violet-500/40 rounded-2xl p-4 w-64 shadow-2xl text-xs flex flex-col gap-3 animate-fade-in">
            <h4 className="font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>3D Surface Math Lab</span>
            </h4>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1 font-mono">
                <span>Frequency</span>
                <span>{freq.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={freq}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFreq(val);
                  world.params.frequency = val;
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1 font-mono">
                <span>Amplitude</span>
                <span>{amp.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={amp}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAmp(val);
                  world.params.amplitude = val;
                }}
                className="w-full accent-pink-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1 font-mono">
                <span>Morph Twist</span>
                <span>{morph.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={morph}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMorph(val);
                  world.params.morph = val;
                }}
                className="w-full accent-violet-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Perf Stats Badge */}
        {isPerfOpen && (
          <div className="pointer-events-auto bg-gray-950/95 border border-emerald-500/40 rounded-xl p-3 text-[11px] font-mono text-emerald-400 shadow-lg flex flex-col gap-1">
            <div className="flex items-center gap-2 font-bold text-white border-b border-white/10 pb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> WebGL Telemetry
            </div>
            <div>FPS: {fps} / 60</div>
            <div>Collectibles: {collectedCount} / {COLLECTIBLES.length}</div>
            <div>Active Skin: {SKIN_LABELS[skin]}</div>
            <div>Audio: Procedural WebAudio Synth</div>
          </div>
        )}
      </div>

      {/* 3. Bottom Control Bar & Telemetry */}
      <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
        {/* Left: Controls & Telemetry Stats */}
        <div className="pointer-events-auto flex items-center flex-wrap gap-2.5">
          {isTouchDevice ? (
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-28 h-28 rounded-full bg-gray-950/95 border border-violet-500/40 flex items-center justify-center shadow-xl"
            >
              <div
                style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
                className="w-12 h-12 rounded-full bg-violet-600/90 border border-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.8)] transition-transform duration-75"
              />
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 bg-gray-950/95 border border-white/10 px-3.5 py-2 rounded-2xl text-[11px] text-zinc-400 font-mono shadow-lg">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200">WASD</span>
              <span>Drive</span>
              <span className="text-zinc-600">·</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200">Shift</span>
              <span>Drift</span>
              <span className="text-zinc-600">·</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/30 text-cyan-200">E</span>
              <span>EMP</span>
              <span className="text-zinc-600">·</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/30 text-emerald-200">V</span>
              <span>LiDAR</span>
              <span className="text-zinc-600">·</span>
              <span className="px-1.5 py-0.5 rounded bg-violet-900/60 border border-violet-500/30 text-violet-200">X</span>
              <span>Telemetry</span>
            </div>
          )}

          {/* EMP Blast Shockwave Button */}
          <button
            onClick={() => {
              world.triggerEmp();
            }}
            className="p-2.5 rounded-2xl bg-cyan-600/95 hover:bg-cyan-500 border border-cyan-400 text-white shadow-lg transition-all active:scale-95 shadow-[0_0_14px_rgba(6,182,212,0.4)]"
            title="Deploy EMP Shockwave Blast (Key: E)"
          >
            <Zap className="w-4 h-4 text-cyan-100" />
          </button>

          {/* 360° LiDAR Autonomous Sensor Mode Button */}
          <button
            onClick={() => {
              world.toggleLidar();
              soundFx.playClickSound();
            }}
            className={`p-2.5 rounded-2xl border transition-all shadow-lg active:scale-95 ${
              isLidarOn
                ? "bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"
                : "bg-gray-950/95 hover:bg-zinc-800 border-white/10 text-zinc-400"
            }`}
            title="Toggle 360° LiDAR Point Cloud Sensor Mode (Key: V)"
          >
            <Radio className="w-4 h-4" />
          </button>

          {/* Waymo Telemetry Hub Drawer Button */}
          <button
            onClick={() => {
              world.toggleTelemetry();
              soundFx.playClickSound();
            }}
            className={`p-2.5 rounded-2xl border transition-all shadow-lg active:scale-95 ${
              isTelemetryOn
                ? "bg-violet-500/25 border-violet-400 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                : "bg-gray-950/95 hover:bg-zinc-800 border-white/10 text-zinc-400"
            }`}
            title="Toggle Waymo Telemetry Hub (Key: X)"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Quick Action Buttons (Fire, Horn, Lights, Rebuild) */}
          <button
            onClick={() => {
              world.requestFire();
              soundFx.playClickSound();
            }}
            className="p-2.5 rounded-2xl bg-rose-600/95 hover:bg-rose-500 border border-rose-400 text-white shadow-lg transition-all active:scale-95"
            title="Shoot Data Sphere (Key: F)"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={handleHonk}
            className="p-2.5 rounded-2xl bg-amber-600/95 hover:bg-amber-500 border border-amber-400 text-white shadow-lg transition-all active:scale-95"
            title="Honk Horn (Key: H)"
          >
            <BellRing className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleHeadlights}
            className={`p-2.5 rounded-2xl border transition-all active:scale-95 ${
              headlightsOn
                ? "bg-yellow-500/20 border-yellow-400 text-yellow-300"
                : "bg-gray-950/95 border-white/10 text-zinc-500"
            }`}
            title="Toggle Headlights (Key: L)"
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              world.requestRebuild();
              soundFx.playClickSound();
            }}
            className="p-2.5 rounded-2xl bg-violet-600/95 hover:bg-violet-500 border border-violet-400 text-white shadow-lg transition-all active:scale-95"
            title="Rebuild Title (Key: R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Rover Skin Selector Button (Cycle sports, tank, jet, quantum) */}
          <button
            onClick={() => {
              const skins: RoverSkin[] = ["sports", "tank", "jet", "quantum"];
              const nextIdx = (skins.indexOf(skin) + 1) % skins.length;
              setSkin(skins[nextIdx]);
              soundFx.playClickSound();
              world.toast(`Vehicle Skin: ${SKIN_LABELS[skins[nextIdx]]}`);
            }}
            className="p-2.5 rounded-2xl bg-gray-950/95 hover:bg-zinc-800 border border-white/10 text-amber-400 transition-all shadow-lg active:scale-95"
            title="Change Vehicle Skin"
          >
            <Car className="w-4 h-4" />
          </button>

          {/* Photo Mode / Canvas Snapshot Button */}
          <button
            onClick={handleSnapshot}
            className="p-2.5 rounded-2xl bg-gray-950/95 hover:bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 transition-all shadow-lg active:scale-95"
            title="Capture High-Res Snapshot (Photo Mode)"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Autonomous Circuit Autopilot Button */}
          <button
            onClick={() => {
              world.toggleCircuitAutopilot();
              soundFx.playClickSound();
            }}
            className={`p-2.5 rounded-2xl border transition-all shadow-lg active:scale-95 ${
              isAutopilotOn
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse"
                : "bg-gray-950/95 hover:bg-zinc-800 border-white/10 text-zinc-400"
            }`}
            title="Toggle Autonomous Waypoint Autopilot"
          >
            <Bot className="w-4 h-4" />
          </button>

          {/* Speedometer Badge + Drift Charge Bar */}
          <div className="flex flex-col gap-1 bg-gray-950/95 border border-white/10 px-3.5 py-2 rounded-2xl shadow-lg min-w-[95px]">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 font-medium leading-none uppercase">Speed</span>
                <span className="text-sm font-bold font-mono text-white leading-tight">
                  <span ref={speedSpanRef}>0</span> <span className="text-[9px] text-zinc-400 font-normal">KM/H</span>
                </span>
              </div>
            </div>
            {/* Drift Charge Mini-Turbo Bar */}
            {driftCharge > 0 && (
              <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    driftCharge > 0.8 ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" : "bg-violet-400"
                  }`}
                  style={{ width: `${driftCharge * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Collectibles Badge */}
          <div className="flex items-center gap-2 bg-gray-950/95 border border-white/10 px-3.5 py-2 rounded-2xl shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-medium leading-none uppercase">Artifacts</span>
              <span className="text-xs font-bold font-mono text-cyan-300 leading-tight">
                {collectedCount} / {COLLECTIBLES.length}
              </span>
            </div>
          </div>

          {/* Score Counter Badge */}
          <div className="flex items-center gap-2 bg-gray-950/95 border border-white/10 px-3.5 py-2 rounded-2xl shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-medium leading-none uppercase">Score</span>
              <span className="text-xs font-bold font-mono text-amber-300 leading-tight">{score}</span>
            </div>
          </div>
        </div>

        {/* Right: Camera Presets HUD Bar & Extra Utilities */}
        <div className="pointer-events-auto flex items-center gap-1 bg-gray-950/95 border border-white/10 p-1.5 rounded-full shadow-lg max-w-full overflow-x-auto">
          {[
            { id: "vehicle", label: "Rover", icon: Navigation },
            { id: "cockpit", label: "Cockpit FPV", icon: Eye },
            { id: "hero", label: "Title", icon: Sparkles },
            { id: "waymo", label: "Waymo", icon: Zap },
            { id: "projects", label: "Projects", icon: Radio },
            { id: "dataviz", label: "Data Viz", icon: Compass },
            { id: "arcade", label: "Arcade", icon: Crosshair },
            { id: "contact", label: "Contact", icon: Eye },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = cameraPreset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundFx.playClickSound();
                  setCameraPreset(item.id as CameraPreset);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}

          {/* Math Panel Toggle */}
          <button
            onClick={() => setIsMathPanelOpen(!isMathPanelOpen)}
            className={`p-1.5 rounded-full transition-all ${
              isMathPanelOpen ? "bg-cyan-500 text-white" : "text-zinc-400 hover:text-white"
            }`}
            title="Math Surface Lab Sliders"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Perf Stats Toggle */}
          <button
            onClick={() => setIsPerfOpen(!isPerfOpen)}
            className={`p-1.5 rounded-full transition-all ${
              isPerfOpen ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
            }`}
            title="Toggle WebGL Telemetry Stats"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
