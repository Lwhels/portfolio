"use client";

import React, { useState, useEffect } from "react";
import { world, ZONES, RACE_CHECKPOINTS, COLLECTIBLES, WORLD_HALF } from "../3d/worldStore";
import { findPath } from "../3d/pathfinding";
import * as THREE from "three";
import { Compass, Maximize2, Minimize2 } from "lucide-react";

export function MinimapRadar() {
  const [carState, setCarState] = useState({ x: 0, z: 0, heading: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarState({
        x: world.car.pos.x,
        z: world.car.pos.z,
        heading: world.car.heading,
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Map world coordinate [-55, 55] to SVG coordinate [10, 110]
  const MAP_SIZE = isExpanded ? 200 : 110;
  const HALF_MAP = MAP_SIZE / 2;
  const toSvg = (wx: number, wz: number) => {
    const scale = (MAP_SIZE - 20) / (WORLD_HALF * 2);
    const sx = HALF_MAP + wx * scale;
    const sy = HALF_MAP + wz * scale; // in 3D +Z is down in SVG
    return { x: sx, y: sy };
  };

  const carSvg = toSvg(carState.x, carState.z);

  const handleZoneClick = (center: [number, number]) => {
    const dest = new THREE.Vector3(center[0], 0, center[1]);
    const waypoints = findPath(world.car.pos, dest);
    if (waypoints.length > 0) {
      world.setPath(waypoints, dest);
      world.toast("🧭 Autopilot routing to waypoint...");
    }
  };

  return (
    <div className="pointer-events-auto relative flex flex-col items-start bg-gray-950/95 border border-white/15 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-fade-in select-none">
      <div className="flex items-center justify-between w-full px-1 mb-1 text-[10px] font-mono text-zinc-400">
        <span className="flex items-center gap-1 text-violet-400 font-bold">
          <Compass className="w-3 h-3 animate-spin-slow" /> RADAR
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-zinc-500 hover:text-white transition-colors"
          title={isExpanded ? "Minimize Radar" : "Expand Radar"}
        >
          {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>

      <svg
        width={MAP_SIZE}
        height={MAP_SIZE}
        className="rounded-xl bg-zinc-950/90 border border-white/10"
      >
        {/* Radar concentric range circles */}
        <circle cx={HALF_MAP} cy={HALF_MAP} r={MAP_SIZE * 0.45} fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="2,3" />
        <circle cx={HALF_MAP} cy={HALF_MAP} r={MAP_SIZE * 0.3} fill="none" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx={HALF_MAP} cy={HALF_MAP} r={MAP_SIZE * 0.15} fill="none" stroke="#1e293b" strokeWidth="0.8" />

        {/* Crosshair axis */}
        <line x1={HALF_MAP} y1={4} x2={HALF_MAP} y2={MAP_SIZE - 4} stroke="#1e293b" strokeWidth="0.8" />
        <line x1={4} y1={HALF_MAP} x2={MAP_SIZE - 4} y2={HALF_MAP} stroke="#1e293b" strokeWidth="0.8" />

        {/* Checkpoint track trail */}
        {RACE_CHECKPOINTS.map((gate, i) => {
          const pt = toSvg(gate.pos.x, gate.pos.z);
          return (
            <circle
              key={gate.id}
              cx={pt.x}
              cy={pt.y}
              r={isExpanded ? 3.5 : 2}
              fill="#0284c7"
              opacity={0.6}
            />
          );
        })}

        {/* Uncollected Collectibles */}
        {COLLECTIBLES.map((c) => {
          if (world.collectedSet.has(c.id)) return null;
          const pt = toSvg(c.pos[0], c.pos[2]);
          return (
            <circle
              key={c.id}
              cx={pt.x}
              cy={pt.y}
              r={isExpanded ? 3 : 2}
              fill={c.color}
              className="animate-pulse"
            />
          );
        })}

        {/* Zones Blips */}
        {ZONES.map((zone) => {
          const pt = toSvg(zone.center[0], zone.center[1]);
          const isCurrent = world.zone === zone.id;
          return (
            <g
              key={zone.id}
              onClick={() => handleZoneClick(zone.center)}
              className="cursor-pointer group"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isExpanded ? (isCurrent ? 6 : 4) : isCurrent ? 4 : 2.5}
                fill={
                  zone.id === "waymo"
                    ? "#06b6d4"
                    : zone.id === "hero"
                    ? "#a855f7"
                    : zone.id === "projects"
                    ? "#6366f1"
                    : zone.id === "dataviz"
                    ? "#ec4899"
                    : zone.id === "arcade"
                    ? "#f59e0b"
                    : "#10b981"
                }
                className={isCurrent ? "animate-ping" : ""}
                opacity={isCurrent ? 0.9 : 0.7}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isExpanded ? (isCurrent ? 5 : 3.5) : isCurrent ? 3.5 : 2}
                fill={isCurrent ? "#ffffff" : "#a855f7"}
              />
              {isExpanded && (
                <text
                  x={pt.x}
                  y={pt.y - 6}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {zone.short}
                </text>
              )}
            </g>
          );
        })}

        {/* Car Position & Heading Arrow */}
        <g transform={`translate(${carSvg.x}, ${carSvg.y}) rotate(${(-carState.heading * 180) / Math.PI + 180})`}>
          <polygon
            points={isExpanded ? "0,-8 5,6 0,3 -5,6" : "0,-6 4,4 0,2 -4,4"}
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}
