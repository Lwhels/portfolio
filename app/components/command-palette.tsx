"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Compass,
  FolderGit2,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Zap,
  Globe,
  Terminal,
  X,
  Bot,
  Flag,
  Camera,
} from "lucide-react";
import { soundFx } from "./3d/SoundController";
import { world } from "./3d/worldStore";

interface PaletteItem {
  id: string;
  category: "Navigation" | "Projects" | "Actions" | "Social";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-vault",
        category: "Navigation",
        title: "3D Simulation Vault",
        subtitle: "Interactive spatial physics arena & Waymo pavilion",
        icon: Compass,
        badge: "3D",
        action: () => router.push("/simulation"),
      },
      {
        id: "nav-projects",
        category: "Navigation",
        title: "Projects Archive",
        subtitle: "Categorized engineering work and interactive demos",
        icon: FolderGit2,
        badge: "Explore",
        action: () => router.push("/projects"),
      },
      {
        id: "nav-resume",
        category: "Navigation",
        title: "Resume & Credentials",
        subtitle: "UCLA Math of Computation (GPA 3.964) & Ex-Waymo SWE",
        icon: FileText,
        badge: "PDF",
        action: () => router.push("/resume"),
      },
      {
        id: "nav-contact",
        category: "Navigation",
        title: "Contact Lucas",
        subtitle: "Cupertino, CA & Los Angeles, CA",
        icon: Mail,
        action: () => router.push("/contact"),
      },
      // Featured Projects
      {
        id: "proj-waymo",
        category: "Projects",
        title: "Waymo Telemetry Visualizer",
        subtitle: "C++, gRPC, Protobuf · 400x Autocomplete & 10x Downsampling",
        icon: Zap,
        badge: "Ex-Waymo",
        action: () => router.push("/projects/Waymo"),
      },
      {
        id: "proj-solar",
        category: "Projects",
        title: "3D Solar System Simulation",
        subtitle: "Three.js, WebGL & Keplerian Celestial Mechanics",
        icon: Globe,
        badge: "3D",
        action: () => router.push("/projects/SolarSystem"),
      },
      {
        id: "proj-ext2",
        category: "Projects",
        title: "EXT2 Linux File System",
        subtitle: "C++, Inode traversal, bitmap allocations & block parsing",
        icon: Terminal,
        badge: "Systems",
        action: () => router.push("/projects/ext2"),
      },
      {
        id: "proj-fennec",
        category: "Projects",
        title: "Tale of Fennec Game Engine",
        subtitle: "C++, Custom 2D Graphics Engine & A* Pathfinding",
        icon: Sparkles,
        badge: "C++",
        action: () => router.push("/projects/TunnelMan"),
      },
      {
        id: "proj-betfree",
        category: "Projects",
        title: "BetFree Sportsbook Platform",
        subtitle: "Real-time odds aggregation, Next.js & PostgreSQL",
        icon: Zap,
        badge: "Full-Stack",
        action: () => router.push("/projects/BetFree"),
      },
      // Actions
      {
        id: "act-autopilot",
        category: "Actions",
        title: "Engage Autonomous Autopilot",
        subtitle: "Watch the rover autonomously navigate the circuit",
        icon: Bot,
        badge: "AI",
        action: () => {
          router.push("/simulation");
          setTimeout(() => world.toggleCircuitAutopilot(), 600);
        },
      },
      {
        id: "act-time-trial",
        category: "Actions",
        title: "Start Time Trial Lap",
        subtitle: "Race against your personal best ghost car",
        icon: Flag,
        badge: "Race",
        action: () => {
          router.push("/simulation");
          setTimeout(() => world.startRace(), 600);
        },
      },
      {
        id: "act-copy-email",
        category: "Actions",
        title: "Copy Email to Clipboard",
        subtitle: "wheeler.lucas2002@gmail.com",
        icon: copied ? Check : Copy,
        badge: "1-Click",
        action: () => {
          navigator.clipboard.writeText("wheeler.lucas2002@gmail.com");
          setCopied(true);
          soundFx.playHapticTick();
          setTimeout(() => setCopied(false), 2000);
        },
      },
      // Social
      {
        id: "soc-github",
        category: "Social",
        title: "GitHub Profile",
        subtitle: "github.com/Lwhels",
        icon: ExternalLink,
        action: () => window.open("https://github.com/Lwhels", "_blank"),
      },
      {
        id: "soc-linkedin",
        category: "Social",
        title: "LinkedIn Profile",
        subtitle: "linkedin.com/in/lucas-wheeler",
        icon: ExternalLink,
        action: () => window.open("https://linkedin.com/in/lucas-wheeler", "_blank"),
      },
    ],
    [router, copied]
  );

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
        item.category.toLowerCase().includes(lower) ||
        (item.badge && item.badge.toLowerCase().includes(lower))
    );
  }, [items, query]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        soundFx.playHapticTick();
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Navigate through list with arrows
  const handleKeyDownInMenu = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      soundFx.playHapticTick();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      soundFx.playHapticTick();
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md transition-all animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-xl bg-gray-950/95 border border-zinc-700/60 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownInMenu}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 gap-3">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g. Waymo, C++, 3D, Resume)..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none font-mono"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-zinc-900">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm font-mono">
              No matching commands or projects found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-zinc-800/90 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                          : "bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                        {item.title}
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs text-zinc-400 truncate font-mono">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider ml-2 flex-shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-t border-zinc-800 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">↓</kbd>
            <span className="ml-1">Select</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">↵</kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Close</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">ESC</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
