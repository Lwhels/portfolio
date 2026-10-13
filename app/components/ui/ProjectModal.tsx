"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ProjectData } from "../3d/ProjectPavilions";
import { X, ExternalLink, Github, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { soundFx } from "../3d/SoundController";
import { world } from "../3d/worldStore";

interface ProjectModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        soundFx.playClickSound();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      onClick={() => {
        soundFx.playClickSound();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 transition-opacity"
      style={{ willChange: "opacity, transform", transform: "translateZ(0)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gray-950/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-white max-w-xl w-full"
        style={{
          boxShadow: `0 0 60px ${project.color}55`,
          transform: "translateZ(0)",
        }}
      >
        {/* Top ambient color bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: project.color }} />

        {/* Close Button */}
        <button
          onClick={() => {
            soundFx.playClickSound();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="flex items-center gap-3 mb-3 pr-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: project.color }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-medium">{project.category}</span>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {project.title}
            </h2>
          </div>
        </div>

        {/* Project Image Preview Frame */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden my-3 border border-white/10 bg-gray-900 shadow-xl">
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

        {/* Description */}
        <p className="text-zinc-300 text-sm md:text-base leading-relaxed my-4">{project.description}</p>

        {/* Tech Badges */}
        <div className="flex flex-wrap gap-2 my-5">
          {project.tech.map((t) => (
            <span
              key={t}
              className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-violet-300"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Actions Bar: Read Full Case Study + External Links */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
          <Link
            href={`/projects/${project.slug}`}
            onClick={() => {
              world.saveCarState();
              soundFx.playClickSound();
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Read Full Case Study Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center justify-end gap-2">
            {project.repository && (
              <a
                href={project.repository}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundFx.playClickSound()}
                className="p-3 rounded-full bg-zinc-900 border border-white/10 hover:border-violet-500 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="GitHub Repository"
              >
                <Github className="w-4 h-4 text-violet-400" />
              </a>
            )}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundFx.playClickSound()}
                className="p-3 rounded-full bg-zinc-900 border border-white/10 hover:border-emerald-500 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Live Website"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
