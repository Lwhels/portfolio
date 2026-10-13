"use client";

import Link from "next/link";
import React from "react";
import Particles from "./components/particles";
import AuroraBg from "./components/aurora-bg";
import FloatingOrbs from "./components/floating-orbs";
import { Github, Linkedin, ArrowRight, Sparkles, Box, Code2 } from "lucide-react";

const navigation = [
  { name: "Projects", href: "/projects" },
  { name: "Resume", href: "/resume" },
  { name: "3D Vault Simulation", href: "/simulation" },
  { name: "Contact", href: "/contact" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-between w-screen min-h-screen overflow-x-hidden bg-gradient-to-tl from-black via-zinc-900/40 to-black relative">
      {/* Ambient background animations */}
      <AuroraBg />
      <FloatingOrbs />
      <Particles className="absolute inset-0 -z-10 animate-fade-in" quantity={120} refresh />

      {/* Header navigation bar */}
      <header className="w-full z-20">
        <nav className="container flex items-center justify-between p-6 mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-zinc-300 font-medium tracking-wider">AVAILABLE FOR OPPORTUNITIES</span>
          </div>

          <div className="flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm duration-300 text-zinc-400 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="container mx-auto px-6 flex flex-col items-center justify-center text-center my-auto py-12 z-10">
        {/* Subtitle Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Mathematics of Computation @ UCLA · GPA 3.96</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Ex-Waymo SWE Intern</span>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white font-display leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          Lucas Wheeler
        </h1>

        {/* Tagline */}
        <p className="mt-6 text-base sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          Software engineer specializing in high-performance 3D graphics, data visualization, concurrent systems, and full-stack web applications.
        </p>

        {/* Tech Stack Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-zinc-400 max-w-xl">
          {["C++", "Three.js / WebGL", "Python", "TypeScript", "D3.js", "Next.js", "gRPC", "Linux"].map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-md bg-zinc-900/80 border border-white/10 text-zinc-300"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/projects"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-violet-400 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            <span>Explore Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/simulation"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-gray-900/90 hover:bg-gray-800 text-zinc-100 font-bold text-sm border border-violet-500/40 hover:border-violet-400 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xl shadow-violet-500/10"
          >
            <Box className="w-4 h-4 text-violet-400" />
            <span>Launch 3D Simulation</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">Interactive</span>
          </Link>

          <Link
            href="/resume"
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm border border-white/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Resume / CV</span>
          </Link>
        </div>

        {/* Social Links & Command Palette Trigger */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-4">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/lwhels"
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:border-violet-500/60 text-zinc-400 hover:text-white transition-all hover:scale-110"
              title="GitHub Profile"
            >
              <Github className="w-5 h-5 text-violet-400" />
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.linkedin.com/in/lucas-wheeler-0693651b3"
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:border-sky-500/60 text-zinc-400 hover:text-white transition-all hover:scale-110"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-5 h-5 text-sky-400" />
            </a>
          </div>

          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
              );
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-sm"
          >
            <span className="text-violet-400">⌘K</span>
            <span>Command Palette</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full z-10 pb-6 text-center text-xs text-zinc-600 font-mono">
        © {new Date().getFullYear()} Lucas Wheeler · UCLA Mathematics of Computation · Ex-Waymo SWE
      </footer>
    </div>
  );
}
