"use client";

import { createContext, useContext } from "react";

export type ThemeId = "cyber" | "vaporwave" | "matrix" | "mono";

export interface Theme {
  id: ThemeId;
  name: string;
  /** Scene clear color + fog */
  bg: string;
  fog: string;
  /** Ground plane + grid */
  ground: string;
  gridCell: string;
  gridSection: string;
  /** Main brand colors */
  primary: string;
  secondary: string;
  accent: string;
  /** Lighting */
  hemiSky: string;
  hemiGround: string;
  /** Rover chassis base color */
  chassis: string;
  /** Platform/dark surface color */
  surface: string;
  /** Palette cycled across the voxel title letters */
  letters: string[];
}

export const THEMES: Record<ThemeId, Theme> = {
  cyber: {
    id: "cyber",
    name: "Cyber Neon",
    bg: "#0b0f19",
    fog: "#0b0f19",
    ground: "#111827",
    gridCell: "#334155",
    gridSection: "#8b5cf6",
    primary: "#8b5cf6",
    secondary: "#06b6d4",
    accent: "#ec4899",
    hemiSky: "#c084fc",
    hemiGround: "#38bdf8",
    chassis: "#1e293b",
    surface: "#1e1b4b",
    letters: ["#a855f7", "#ec4899", "#3b82f6", "#06b6d4", "#8b5cf6", "#d946ef"],
  },
  vaporwave: {
    id: "vaporwave",
    name: "Vaporwave Sunset",
    bg: "#1e1b4b",
    fog: "#2a1b4f",
    ground: "#241a52",
    gridCell: "#4c1d95",
    gridSection: "#f43f5e",
    primary: "#f43f5e",
    secondary: "#f59e0b",
    accent: "#d946ef",
    hemiSky: "#fb7185",
    hemiGround: "#fbbf24",
    chassis: "#312e81",
    surface: "#3b0764",
    letters: ["#f43f5e", "#fb7185", "#f59e0b", "#fbbf24", "#d946ef", "#f472b6"],
  },
  matrix: {
    id: "matrix",
    name: "Emerald Matrix",
    bg: "#022c22",
    fog: "#022c22",
    ground: "#03241c",
    gridCell: "#065f46",
    gridSection: "#22c55e",
    primary: "#10b981",
    secondary: "#22c55e",
    accent: "#a3e635",
    hemiSky: "#6ee7b7",
    hemiGround: "#34d399",
    chassis: "#064e3b",
    surface: "#064e3b",
    letters: ["#10b981", "#22c55e", "#4ade80", "#a3e635", "#34d399", "#86efac"],
  },
  mono: {
    id: "mono",
    name: "Monochrome Luxury",
    bg: "#09090b",
    fog: "#09090b",
    ground: "#18181b",
    gridCell: "#3f3f46",
    gridSection: "#38bdf8",
    primary: "#f8fafc",
    secondary: "#38bdf8",
    accent: "#94a3b8",
    hemiSky: "#e2e8f0",
    hemiGround: "#38bdf8",
    chassis: "#27272a",
    surface: "#27272a",
    letters: ["#f8fafc", "#e2e8f0", "#38bdf8", "#cbd5e1", "#7dd3fc", "#f1f5f9"],
  },
};

export const THEME_ORDER: ThemeId[] = ["cyber", "vaporwave", "matrix", "mono"];

export const ThemeContext = createContext<Theme>(THEMES.cyber);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
