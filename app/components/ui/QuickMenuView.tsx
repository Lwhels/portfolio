import React, { useState, useEffect } from "react";
import { FEATURED_PROJECTS, MORE_PROJECTS, ProjectData } from "../3d/ProjectPavilions";
import { soundFx } from "../3d/SoundController";
import { world } from "../3d/worldStore";
import { Sparkles, Code2, GraduationCap, Mail, ArrowRight, Github, Linkedin, ExternalLink, X, BookOpen, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface QuickMenuViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: ProjectData) => void;
}

export function QuickMenuView({ isOpen, onClose, onSelectProject }: QuickMenuViewProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "about" | "contact">("projects");
  const [showMoreProjects, setShowMoreProjects] = useState(false);

  useEffect(() => {
    const unsub = world.on("openProjectArchive" as any, () => {
      setActiveTab("projects");
      setShowMoreProjects(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        soundFx.playClickSound();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-gray-950 overflow-y-auto p-4 md:p-12 animate-fade-in">
      <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-16 text-white">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-2">
            {[
              { id: "projects", label: "Projects", icon: Code2 },
              { id: "about", label: "About & Math", icon: GraduationCap },
              { id: "contact", label: "Contact", icon: Mail },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playClickSound();
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/50 bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Back to 3D World</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content: Projects Grid */}
        {activeTab === "projects" && (
          <div className="space-y-10 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span>Featured Projects</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURED_PROJECTS.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      soundFx.playClickSound();
                      onSelectProject(project);
                    }}
                    className="group relative bg-gray-900/60 border border-white/10 hover:border-violet-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white font-bold"
                        style={{ backgroundColor: project.color }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-medium">
                        {project.category}
                      </span>
                      
                      {/* Image preview thumbnail */}
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden my-3 border border-white/10 bg-gray-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/projects/${project.slug}.png`}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      <h3 className="text-xl font-bold text-white mt-1 mb-2 group-hover:text-violet-300 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-zinc-400 text-sm line-clamp-3 mb-4 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech.map((t) => (
                          <span
                            key={t}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-white/5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/projects/${project.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white transition-all"
                        title="Read Case Study Page"
                      >
                        <BookOpen className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expandable More Projects Archive Menu */}
            <div className="pt-6 border-t border-white/10 flex flex-col items-center">
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setShowMoreProjects((prev) => !prev);
                }}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-purple-950/60 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white text-sm font-semibold transition-all duration-300 shadow-xl cursor-pointer hover:scale-105"
              >
                <MoreHorizontal className="w-5 h-5 text-purple-400" />
                <span>{showMoreProjects ? "Hide Extra Projects" : `... More Projects Archive [${MORE_PROJECTS.length}]`}</span>
                {showMoreProjects ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showMoreProjects && (
                <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {MORE_PROJECTS.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => {
                        soundFx.playClickSound();
                        onSelectProject(project);
                      }}
                      className="group relative bg-purple-950/20 border border-purple-500/20 hover:border-purple-500/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white font-bold"
                          style={{ backgroundColor: project.color }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-purple-300 font-mono font-medium">
                          {project.category}
                        </span>

                        <div className="relative w-full aspect-video rounded-xl overflow-hidden my-3 border border-white/10 bg-gray-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/projects/${project.slug}.png`}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>

                        <h3 className="text-xl font-bold text-white mt-1 mb-2 group-hover:text-purple-300 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-zinc-400 text-sm line-clamp-3 mb-4 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-wrap gap-1.5">
                          {project.tech.map((t) => (
                            <span
                              key={t}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-white/5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/projects/${project.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white transition-all"
                          title="Read Case Study Page"
                        >
                          <BookOpen className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Tab Content: About */}
        {activeTab === "about" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-zinc-300 animate-fade-in">
            <div className="md:col-span-2 bg-gray-900/60 border border-white/10 rounded-3xl p-8 flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-violet-400" />
                Mathematics of Computation @ UCLA (GPA 3.964)
              </h3>
              <p className="text-zinc-300 leading-relaxed text-sm">
                Software engineer and computational researcher specializing in high-performance 3D graphics, systems software, and data visualization. Former <strong>Software Engineer Intern at Waymo</strong>, where I developed high-speed telemetry plotting tools, achieving a 400x autocomplete speedup and 10x load performance increase.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                {[
                  { title: "3D Graphics", desc: "Three.js, WebGL, GLSL Shaders, Raymarching" },
                  { title: "Languages", desc: "C++/C, Python, TypeScript, JavaScript, SQL" },
                  { title: "Systems & Backend", desc: "gRPC, Protobuf, Multithreading, Linux Kernel" },
                  { title: "Mathematics", desc: "Numerical Analysis, Linear Algebra, Optimization" },
                  { title: "Web & Data Viz", desc: "Next.js, React, Angular, D3.js, Tailwind CSS" },
                  { title: "DevOps & Tools", desc: "Git, GCP, Unit & Screenshot Testing" },
                ].map((skill) => (
                  <div key={skill.title} className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5">
                    <h4 className="text-sm font-semibold text-white mb-1">{skill.title}</h4>
                    <p className="text-xs text-zinc-400">{skill.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Resume & Experience</h4>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Detailed breakdown of work experience at Waymo, university coursework, and full technical competencies.
                </p>
                <Link
                  href="/resume"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                >
                  <span>View Verified Resume</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <a
                  href="https://github.com/lwhels"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/10 hover:border-violet-500 text-sm text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-violet-400" /> GitHub Profile
                  </span>
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Contact */}
        {activeTab === "contact" && (
          <div className="max-w-2xl mx-auto w-full bg-gray-900/60 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center gap-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/50 flex items-center justify-center text-violet-400">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-white">Let&apos;s Build Something Amazing</h3>
            <p className="text-zinc-400 text-sm max-w-md">
              Have an exciting 3D visualization project, collaboration, or opportunity? Drop me a line!
            </p>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-violet-600 text-white font-semibold shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:bg-violet-500 transition-all"
            >
              <span>Go to Contact Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
