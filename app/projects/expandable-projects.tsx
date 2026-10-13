"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Article, PROJECT_TAGS } from "./article";
import { TiltCard } from "../components/tilt-card";
import { Eye, MoreHorizontal, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import type { Project } from "@/.contentlayer/generated";

interface ExpandableProjectsProps {
  featuredProjects: Project[];
  remainingProjects: Project[];
  views: Record<string, number>;
}

type CategoryType = "all" | "graphics" | "systems" | "math" | "web";

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: "all", label: "All Projects" },
  { id: "graphics", label: "3D & Graphics" },
  { id: "systems", label: "Systems & C++" },
  { id: "math", label: "Applied Math & ML" },
  { id: "web", label: "Full Stack & Web" },
];

const PROJECT_CATEGORIES: Record<string, CategoryType> = {
  Waymo: "systems",
  SolarSystem: "graphics",
  Math142: "math",
  Math156: "math",
  VehicularMedia: "graphics",
  Rourke: "web",
  BetFree: "web",
  Polymarket: "math",
  InstagramFollowers: "web",
  ext2: "systems",
  hashtable: "systems",
  TunnelMan: "graphics",
  LAhacks: "web",
};

export function ExpandableProjects({
  featuredProjects,
  remainingProjects,
  views,
}: ExpandableProjectsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allList = useMemo(() => {
    const combined = [...featuredProjects];
    const seen = new Set(combined.map((p) => p.slug));
    for (const r of remainingProjects) {
      if (!seen.has(r.slug)) {
        combined.push(r);
        seen.add(r.slug);
      }
    }
    return combined;
  }, [featuredProjects, remainingProjects]);

  const filteredProjects = useMemo(() => {
    return allList.filter((project) => {
      // Category check
      if (selectedCategory !== "all") {
        const cat = PROJECT_CATEGORIES[project.slug];
        if (cat !== selectedCategory) return false;
      }
      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = project.title.toLowerCase().includes(q);
        const inDesc = project.description.toLowerCase().includes(q);
        const tags = PROJECT_TAGS[project.slug] || [];
        const inTags = tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTags) return false;
      }
      return true;
    });
  }, [allList, selectedCategory, searchQuery]);

  const isFiltering = selectedCategory !== "all" || searchQuery.trim().length > 0;

  const heroProject = featuredProjects[0];
  const sideProjects = featuredProjects.slice(1, 3);
  const bottomFeatured = featuredProjects.slice(3);

  return (
    <div className="space-y-10">
      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-md">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-violet-400"
                    : "bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or tags..."
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/80 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* When filtering or searching, show flat grid of matching projects */}
      {isFiltering ? (
        <div>
          <div className="text-sm text-zinc-400 mb-6 flex items-center justify-between">
            <span>
              Found <strong className="text-white">{filteredProjects.length}</strong> matching projects
            </span>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-xs text-violet-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 border border-white/10 rounded-2xl bg-zinc-950/40 text-zinc-400 text-sm">
              No projects found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <TiltCard key={project.slug}>
                  <Article project={project} views={views[project.slug] ?? 0} />
                </TiltCard>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Default Featured Layout */
        <div className="space-y-12">
          {heroProject && (
            <div className="space-y-8">
              {/* Hero Row: 1 large card + 2 side cards */}
              <div className="grid grid-cols-1 gap-8 mx-auto lg:grid-cols-2">
                {/* Primary Hero Project */}
                <TiltCard>
                  <Link href={`/projects/${heroProject.slug}`}>
                    <article className="relative w-full h-full p-4 md:p-8 flex flex-col justify-between">
                      <div>
                        <span
                          className="absolute top-4 right-4 text-[10px] px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 font-semibold tracking-widest uppercase"
                          style={{ transform: "translateZ(16px)" }}
                        >
                          Featured
                        </span>

                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="text-xs text-zinc-300">
                            {heroProject.date ? (
                              <time dateTime={new Date(heroProject.date).toISOString()}>
                                {Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                                  new Date(heroProject.date)
                                )}
                              </time>
                            ) : (
                              <span className="text-violet-400 font-medium">SOON</span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs text-zinc-400">
                            <Eye className="w-4 h-4 text-violet-400" />{" "}
                            {Intl.NumberFormat("en-US", { notation: "compact" }).format(
                              views[heroProject.slug] ?? 0
                            )}
                          </span>
                        </div>

                        {/* Real Image Frame */}
                        <div
                          className="relative w-full aspect-video rounded-2xl overflow-hidden my-4 border border-white/15 bg-gray-900 shadow-2xl group-hover:border-violet-500/50 transition-colors"
                          style={{ transform: "translateZ(10px)" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/projects/${heroProject.slug}.png`}
                            alt={heroProject.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>

                        <h2
                          id="featured-post"
                          className="mt-4 text-2xl font-bold text-white group-hover:text-violet-300 sm:text-3xl font-display"
                          style={{ transform: "translateZ(8px)" }}
                        >
                          {heroProject.title}
                        </h2>
                        <p
                          className="mt-3 leading-relaxed text-sm sm:text-base text-zinc-300 group-hover:text-zinc-200"
                          style={{ transform: "translateZ(4px)" }}
                        >
                          {heroProject.description}
                        </p>

                        {/* Tech tags */}
                        <div
                          className="mt-4 flex flex-wrap gap-1.5"
                          style={{ transform: "translateZ(10px)" }}
                        >
                          {(PROJECT_TAGS[heroProject.slug] ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 border border-white/10 text-zinc-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-zinc-400 group-hover:text-violet-400 transition-colors">
                        <span>Read case study</span>
                        <span className="arrow-slide">→</span>
                      </div>
                    </article>
                  </Link>
                </TiltCard>

                {/* Side Companion Projects */}
                <div className="flex flex-col w-full gap-8 mx-auto lg:mx-0">
                  {sideProjects.map((project) => (
                    <TiltCard key={project.slug}>
                      <Article project={project} views={views[project.slug] ?? 0} />
                    </TiltCard>
                  ))}
                </div>
              </div>

              {/* Bottom Featured Projects Row */}
              {bottomFeatured.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {bottomFeatured.map((project) => (
                    <TiltCard key={project.slug}>
                      <Article project={project} views={views[project.slug] ?? 0} />
                    </TiltCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapsible / Expandable "..." Menu Button for Remaining Projects */}
          {remainingProjects.length > 0 && (
            <div className="flex flex-col items-center justify-center pt-8 border-t border-white/10">
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-gray-900 border border-white/15 hover:border-violet-500/60 text-zinc-300 hover:text-white text-sm font-semibold transition-all duration-300 shadow-xl cursor-pointer hover:scale-105"
              >
                <MoreHorizontal className="w-5 h-5 text-violet-400" />
                <span>{isExpanded ? "Hide Extra Projects" : `More Projects (...) [${remainingProjects.length}]`}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Expanded Projects Grid */}
              {isExpanded && (
                <div className="w-full mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {remainingProjects.map((project) => (
                    <TiltCard key={project.slug}>
                      <Article project={project} views={views[project.slug] ?? 0} />
                    </TiltCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
