"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { world } from "./worldStore";
import { soundFx } from "./SoundController";
import { RefreshCw, Trash2, Cpu } from "lucide-react";

const GRID_SIZE = 14;
const CELL_WIDTH = 1.0;
const HALF_WIDTH = (GRID_SIZE * CELL_WIDTH) / 2;
const ORIGIN_X = 26;
const ORIGIN_Z = 16;

export function GameOfLifeGrid() {
  const [cells, setCells] = useState<boolean[]>(() => {
    // Initialize with a Glider and a Blinker
    const initial = new Array(GRID_SIZE * GRID_SIZE).fill(false);
    // Glider
    const setCell = (r: number, c: number) => {
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        initial[r * GRID_SIZE + c] = true;
      }
    };
    setCell(2, 3);
    setCell(3, 4);
    setCell(4, 2);
    setCell(4, 3);
    setCell(4, 4);
    // Blinker
    setCell(8, 8);
    setCell(8, 9);
    setCell(8, 10);
    return initial;
  });

  const cellsRef = useRef(cells);
  cellsRef.current = cells;

  const tickTimer = useRef(0);
  const lastPaintedCell = useRef<number>(-1);

  // Simulation tick loop
  useFrame((_, delta) => {
    tickTimer.current += delta;
    if (tickTimer.current >= 0.32) {
      tickTimer.current = 0;
      const current = cellsRef.current;
      const next = new Array(GRID_SIZE * GRID_SIZE).fill(false);

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          let neighbors = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (current[nr * GRID_SIZE + nc]) neighbors++;
              }
            }
          }

          const idx = r * GRID_SIZE + c;
          const isAlive = current[idx];
          if (isAlive) {
            next[idx] = neighbors === 2 || neighbors === 3;
          } else {
            next[idx] = neighbors === 3;
          }
        }
      }
      setCells(next);
    }

    // Vehicle collision: Driving over grid flips cells to ALIVE
    const carPos = world.car.pos;
    const relX = carPos.x - (ORIGIN_X - HALF_WIDTH);
    const relZ = carPos.z - (ORIGIN_Z - HALF_WIDTH);

    if (relX >= 0 && relX < GRID_SIZE * CELL_WIDTH && relZ >= 0 && relZ < GRID_SIZE * CELL_WIDTH) {
      const c = Math.floor(relX / CELL_WIDTH);
      const r = Math.floor(relZ / CELL_WIDTH);
      const cellIdx = r * GRID_SIZE + c;

      if (cellIdx !== lastPaintedCell.current && cellIdx >= 0 && cellIdx < cellsRef.current.length) {
        lastPaintedCell.current = cellIdx;
        setCells((prev) => {
          const updated = [...prev];
          updated[cellIdx] = true;
          return updated;
        });
        soundFx.playNote(300 + (cellIdx % 12) * 50, 0.15);
        world.emitParticle(
          ORIGIN_X - HALF_WIDTH + c * CELL_WIDTH + 0.5,
          0.3,
          ORIGIN_Z - HALF_WIDTH + r * CELL_WIDTH + 0.5,
          0,
          1.5,
          0,
          new THREE.Color("#10b981"),
          0.4,
          0.2
        );
      }
    } else {
      lastPaintedCell.current = -1;
    }
  });

  const handleRandomize = () => {
    soundFx.playClickSound();
    setCells(() => {
      const random = new Array(GRID_SIZE * GRID_SIZE).fill(false);
      for (let i = 0; i < random.length; i++) {
        random[i] = Math.random() > 0.72;
      }
      return random;
    });
    world.toast("🎲 Conway's Game of Life: Randomized!");
  };

  const handleClear = () => {
    soundFx.playClickSound();
    setCells(new Array(GRID_SIZE * GRID_SIZE).fill(false));
    world.toast("🧹 Game of Life Grid Cleared! Drive over it to seed cells.");
  };

  return (
    <group position={[ORIGIN_X, 0, ORIGIN_Z]}>
      {/* Foundation Platform */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[GRID_SIZE * CELL_WIDTH + 1.2, 0.04, GRID_SIZE * CELL_WIDTH + 1.2]} />
        <meshStandardMaterial color="#050a12" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Outer Border Frame */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[GRID_SIZE * CELL_WIDTH + 1.4, 0.08, GRID_SIZE * CELL_WIDTH + 1.4]} />
        <meshBasicMaterial color="#064e3b" wireframe />
      </mesh>

      {/* Cells Grid */}
      {cells.map((alive, idx) => {
        const r = Math.floor(idx / GRID_SIZE);
        const c = idx % GRID_SIZE;
        const x = -HALF_WIDTH + c * CELL_WIDTH + CELL_WIDTH / 2;
        const z = -HALF_WIDTH + r * CELL_WIDTH + CELL_WIDTH / 2;

        return (
          <mesh
            key={idx}
            position={[x, alive ? 0.16 : 0.04, z]}
            receiveShadow
          >
            <boxGeometry args={[CELL_WIDTH * 0.88, alive ? 0.22 : 0.03, CELL_WIDTH * 0.88]} />
            <meshStandardMaterial
              color={alive ? "#10b981" : "#0f172a"}
              emissive={alive ? "#10b981" : "#022c22"}
              emissiveIntensity={alive ? 1.6 : 0.2}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        );
      })}

      {/* Floating 3D Control Header */}
      <Html position={[0, 2.5, -HALF_WIDTH - 1.2]} center distanceFactor={18}>
        <div className="flex flex-col items-center gap-2 pointer-events-auto select-none">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-950/90 border border-emerald-500/40 text-white font-mono text-[10px] shadow-xl whitespace-nowrap">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span className="font-bold text-emerald-300">Conway&apos;s Game of Life</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">B3/S23 Automaton</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-300 hover:text-white text-[9px] font-mono transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Randomize</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-rose-950 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 text-[9px] font-mono transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
}
