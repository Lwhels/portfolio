"use client";

import React, { useState, useEffect, useRef } from "react";
import { world } from "../3d/worldStore";
import { soundFx } from "../3d/SoundController";
import { Activity, X, Gauge, Cpu, Radio, ShieldCheck } from "lucide-react";

export function TelemetryDrawer() {
  const [isOpen, setIsOpen] = useState(world.telemetryOpen);
  const [speedVal, setSpeedVal] = useState(0);
  const [steerAngle, setSteerAngle] = useState(0);
  const [latG, setLatG] = useState(0);
  const [longG, setLongG] = useState(0);
  const [headingDeg, setHeadingDeg] = useState(0);
  const [lidarStatus, setLidarStatus] = useState(world.lidarEnabled);
  const [fps, setFps] = useState(60);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>(new Array(48).fill(0));
  const prevSpeedRef = useRef(0);

  useEffect(() => {
    const unsubTelemetry = world.on("telemetry", (val) => setIsOpen(Boolean(val)));
    const unsubLidar = world.on("lidar", (val) => setLidarStatus(Boolean(val)));
    return () => {
      unsubTelemetry();
      unsubLidar();
    };
  }, []);

  // Update telemetry values from world car at ~20Hz
  useEffect(() => {
    if (!isOpen) return;

    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = Math.max(0.016, (now - lastTime) / 1000);
      lastTime = now;

      const spd = Math.abs(world.car.speed);
      setSpeedVal(spd);

      // Approximate longitudinal G: dv / (g * dt)
      const dv = (spd - prevSpeedRef.current) / dt;
      prevSpeedRef.current = spd;
      const computedLongG = THREE_CLAMP(dv / 9.81, -1.4, 1.4);
      setLongG(computedLongG);

      // Approximate lateral G: v^2 / (R * g) or v * yawRate / g
      const computedLatG = THREE_CLAMP((world.car.speed * (world.input.left ? -1 : world.input.right ? 1 : 0) * 0.8) / 9.81, -1.2, 1.2);
      setLatG(computedLatG);

      // Steer angle
      const steer = (world.input.left ? -28 : world.input.right ? 28 : 0);
      setSteerAngle(steer);

      // Heading in degrees
      const deg = ((world.car.heading * 180) / Math.PI + 360) % 360;
      setHeadingDeg(Math.round(deg));

      setFps(world.stats.fps || 60);

      // Append to rolling sparkline
      historyRef.current.push(spd);
      if (historyRef.current.length > 48) historyRef.current.shift();

      // Draw rolling chart
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          ctx.clearRect(0, 0, w, h);

          // Grid line
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          // Sparkline path
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 2;
          ctx.beginPath();
          const maxVal = 24;
          const pts = historyRef.current;
          for (let i = 0; i < pts.length; i++) {
            const x = (i / (pts.length - 1)) * w;
            const y = h - (pts[i] / maxVal) * (h - 6) - 3;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Fill under sparkline
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
          ctx.fill();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const mph = Math.round(speedVal * 2.23694);
  const kmh = Math.round(speedVal * 3.6);

  // Friction circle blip position: [-1..1] mapped to [10..90%]
  const blipX = 50 + (latG / 1.4) * 40;
  const blipY = 50 - (longG / 1.4) * 40;

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-40 w-[320px] sm:w-[350px] bg-gray-950/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl text-white font-mono p-4 animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div>
            <div className="text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
              Waymo Telemetry Hub
            </div>
            <div className="text-[9px] text-zinc-400">CHASSIS & SENSOR TELEMETRY</div>
          </div>
        </div>
        <button
          onClick={() => {
            world.toggleTelemetry(false);
            soundFx.playClickSound();
          }}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Speedometer & Units */}
        <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>VELOCITY</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold tracking-tight text-white">{mph}</span>
            <span className="text-[10px] text-cyan-400 ml-1">MPH</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {kmh} km/h · {speedVal.toFixed(1)} m/s
          </div>
        </div>

        {/* G-G Friction Circle */}
        <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
          <div className="text-[9px] text-zinc-400 mb-1 w-full text-left">G-G FRICTION CIRCLE</div>
          <div className="relative w-16 h-16 rounded-full border border-zinc-700 bg-zinc-950/80 flex items-center justify-center">
            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-zinc-800" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-zinc-800" />
            {/* 1G Inner Ring */}
            <div className="w-10 h-10 rounded-full border border-dashed border-zinc-800" />
            {/* Dynamic G blip */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] transition-all duration-75"
              style={{ left: `calc(${blipX}% - 5px)`, top: `calc(${blipY}% - 5px)` }}
            />
          </div>
          <div className="text-[9px] text-zinc-400 mt-1 flex justify-between w-full px-1">
            <span>LAT: {latG > 0 ? `+${latG.toFixed(2)}` : latG.toFixed(2)}G</span>
            <span>LONG: {longG > 0 ? `+${longG.toFixed(2)}` : longG.toFixed(2)}G</span>
          </div>
        </div>
      </div>

      {/* Rolling Velocity Chart */}
      <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-2.5 mt-3">
        <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1.5">
          <span>REAL-TIME SPEED BUFFER (50Hz)</span>
          <span className="text-cyan-400">{speedVal.toFixed(1)} m/s</span>
        </div>
        <canvas ref={canvasRef} width={280} height={46} className="w-full h-[46px] rounded bg-zinc-950/70" />
      </div>

      {/* Steering Angle & Yaw Header */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
        <div className="bg-zinc-900/60 border border-white/5 rounded-lg p-2">
          <div className="text-zinc-500 text-[9px]">STEER RACK ANGLE</div>
          <div className="text-zinc-200 font-bold mt-0.5">{steerAngle > 0 ? `+${steerAngle}°` : `${steerAngle}°`}</div>
        </div>
        <div className="bg-zinc-900/60 border border-white/5 rounded-lg p-2">
          <div className="text-zinc-500 text-[9px]">YAW HEADING</div>
          <div className="text-zinc-200 font-bold mt-0.5">{headingDeg}° N</div>
        </div>
      </div>

      {/* Subsystem Health Matrix */}
      <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400" />
            32-BEAM LIDAR SCANNER:
          </span>
          <span className={`font-bold ${lidarStatus ? "text-emerald-400" : "text-amber-400"}`}>
            {lidarStatus ? "ACTIVE [SCANNING]" : "STANDBY (KEY: V)"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-violet-400" />
            PATH PLANNER (A* + DUBINS):
          </span>
          <span className="text-cyan-400 font-bold">READY</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            GPU RENDER BUDGET:
          </span>
          <span className="text-zinc-300">{fps} FPS · 16.6ms</span>
        </div>
      </div>
    </div>
  );
}

function THREE_CLAMP(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
