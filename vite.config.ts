import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Production build is served by Django/WhiteNoise under /static/, but the
  // Vite dev server should serve from root — otherwise room deep-links
  // (/room/<id>) 404 in dev since they fall outside the /static/ base.
  base: command === "build" ? "/static/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // The remaining main chunk (React, Radix primitives, WebRTC/whiteboard
    // deps not covered by the RoomPage lazy-load below) sits just over
    // Rollup's default 500kB heuristic. It's a reasonable size for what it
    // contains (~145kB gzipped) — raise the warning threshold instead of
    // chasing a few more kB of manual chunking for no real user benefit.
    chunkSizeWarningLimit: 600,
  },
}))
