"use client";

import React, { useState } from "react";
import { Terminal, Database, HardDrive, Folder, FileText, ArrowRight, Play, RotateCcw, CheckCircle2 } from "lucide-react";
import { soundFx } from "./3d/SoundController";

interface InodeRecord {
  id: number;
  mode: string;
  size: number;
  type: "dir" | "file";
  directBlocks: number[];
  indirectBlock?: number;
}

interface DirEntry {
  inode: number;
  name: string;
  type: "dir" | "file";
}

const INODES: Record<number, InodeRecord> = {
  2: { id: 2, mode: "drwxr-xr-x", size: 1024, type: "dir", directBlocks: [9] },
  12: { id: 12, mode: "drwxr-xr-x", size: 1024, type: "dir", directBlocks: [10] },
  24: { id: 24, mode: "drwxr-xr-x", size: 1024, type: "dir", directBlocks: [11] },
  42: { id: 42, mode: "-rw-r--r--", size: 4096, type: "file", directBlocks: [12, 13], indirectBlock: 14 },
  77: { id: 77, mode: "-rw-r--r--", size: 1024, type: "file", directBlocks: [15] },
};

const DIRECTORY_DATA: Record<number, DirEntry[]> = {
  9: [
    { inode: 2, name: ".", type: "dir" },
    { inode: 2, name: "..", type: "dir" },
    { inode: 12, name: "home", type: "dir" },
    { inode: 77, name: "config.sys", type: "file" },
  ],
  10: [
    { inode: 12, name: ".", type: "dir" },
    { inode: 2, name: "..", type: "dir" },
    { inode: 24, name: "wheeler", type: "dir" },
  ],
  11: [
    { inode: 24, name: ".", type: "dir" },
    { inode: 12, name: "..", type: "dir" },
    { inode: 42, name: "kernel_patch.cpp", type: "file" },
  ],
};

const SAMPLE_PATHS = [
  { label: "/home/wheeler/kernel_patch.cpp", targetInode: 42 },
  { label: "/home/wheeler", targetInode: 24 },
  { label: "/config.sys", targetInode: 77 },
];

export function Ext2Visualizer() {
  const [selectedPath, setSelectedPath] = useState(SAMPLE_PATHS[0]);
  const [step, setStep] = useState(0);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);

  // Steps for path traversal
  const steps = [
    {
      title: "Step 1: Mount Superblock & Root Inode",
      desc: "Kernel parses Superblock (Block 1, Magic 0xEF53). Reads Root Inode (#2) from Inode Table.",
      highlightBlock: 1,
      inode: 2,
    },
    {
      title: "Step 2: Read Root Directory Entries",
      desc: "Access Inode #2 direct block [9]. Linear scan of ext2_dir_entry_2 array matches 'home' (Inode #12).",
      highlightBlock: 9,
      inode: 12,
    },
    {
      title: "Step 3: Resolve /home Directory",
      desc: "Access Inode #12 direct block [10]. Parses directory entries to locate entry 'wheeler' (Inode #24).",
      highlightBlock: 10,
      inode: 24,
    },
    {
      title: "Step 4: Resolve File Inode & Data Blocks",
      desc: "Access Inode #24 block [11]. Discovers 'kernel_patch.cpp' -> Inode #42. Loads direct data blocks [12, 13].",
      highlightBlock: 12,
      inode: 42,
    },
  ];

  const handleNextStep = () => {
    soundFx.playHapticTick();
    if (step < steps.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setActiveBlock(steps[nextStep].highlightBlock);
    }
  };

  const handleReset = () => {
    soundFx.playHapticTick();
    setStep(0);
    setActiveBlock(steps[0].highlightBlock);
  };

  const currentStepInfo = steps[step];
  const currentInode = INODES[currentStepInfo.inode];

  return (
    <div className="my-10 p-6 md:p-8 rounded-3xl bg-gray-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Interactive Kernel Subsystem</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white font-display">
            EXT2 File System Traversal Simulator
          </h3>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Visualizing inode pointers, indirect blocks, and directory entry traversal written in C++.
          </p>
        </div>

        {/* Path selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500">Target Path:</span>
          <select
            value={selectedPath.label}
            onChange={(e) => {
              const found = SAMPLE_PATHS.find((p) => p.label === e.target.value);
              if (found) {
                setSelectedPath(found);
                handleReset();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
          >
            {SAMPLE_PATHS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Disk Block Layout Ribbon */}
      <div className="my-6">
        <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center justify-between">
          <span>Physical Disk Block Map (Block Size: 1024 Bytes)</span>
          <span className="text-zinc-500">Blocks 0 - 15</span>
        </div>
        <div className="grid grid-cols-8 md:grid-cols-16 gap-1.5 font-mono text-[10px]">
          {[
            { id: 0, label: "Boot", type: "system" },
            { id: 1, label: "Super", type: "meta" },
            { id: 2, label: "Group", type: "meta" },
            { id: 3, label: "b-map", type: "bitmap" },
            { id: 4, label: "i-map", type: "bitmap" },
            { id: 5, label: "i-tbl", type: "inode" },
            { id: 6, label: "i-tbl", type: "inode" },
            { id: 7, label: "i-tbl", type: "inode" },
            { id: 8, label: "i-tbl", type: "inode" },
            { id: 9, label: "data/9", type: "data" },
            { id: 10, label: "data/10", type: "data" },
            { id: 11, label: "data/11", type: "data" },
            { id: 12, label: "data/12", type: "data" },
            { id: 13, label: "data/13", type: "data" },
            { id: 14, label: "indir", type: "indirect" },
            { id: 15, label: "data/15", type: "data" },
          ].map((b) => {
            const isActive = b.id === (activeBlock ?? currentStepInfo.highlightBlock);
            return (
              <div
                key={b.id}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isActive
                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105 font-bold"
                    : b.type === "meta"
                    ? "bg-violet-950/40 border-violet-800/60 text-violet-300"
                    : b.type === "bitmap"
                    ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
                    : b.type === "inode"
                    ? "bg-sky-950/40 border-sky-800/60 text-sky-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                }`}
              >
                <div>B{b.id}</div>
                <div className="truncate text-[9px] opacity-80">{b.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Inspector & Inode Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Traversal Step Log */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold mb-2">
              <Terminal className="w-4 h-4" />
              <span>{currentStepInfo.title}</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-mono">
              {currentStepInfo.desc}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/80">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handleNextStep}
              disabled={step === steps.length - 1}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold font-mono shadow-lg transition-all"
            >
              <span>{step === steps.length - 1 ? "Resolution Complete" : "Next Traversal Step"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Inode Inspector */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2 mb-3">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              struct ext2_inode #{currentInode.id}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
              {currentInode.mode}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">i_size:</span>
              <span className="text-white">{currentInode.size} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">i_links_count:</span>
              <span className="text-white">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">i_block[0..11] (Direct):</span>
              <span className="text-emerald-400">[{currentInode.directBlocks.join(", ")}]</span>
            </div>
            {currentInode.indirectBlock && (
              <div className="flex justify-between">
                <span className="text-zinc-500">i_block[12] (Singly-Indirect):</span>
                <span className="text-amber-400">Block {currentInode.indirectBlock}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
