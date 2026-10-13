import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    pool: "threads",
    globals: true,
    setupFiles: ["./test/setup.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/**/*.{ts,tsx}", "util/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/**",
        ".next/**",
        ".contentlayer/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "contentlayer/generated": path.resolve(__dirname, "./.contentlayer/generated"),
    },
  },
});
