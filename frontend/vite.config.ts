import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite build and dev-server configuration.
 *
 * The dev server forwards every `/api/...` request to Django on port 8000.
 * The browser only ever talks to Vite's own origin, so no CORS setup is
 * needed in development. Production deployments need their own routing.
 *
 * MapLibre alone is about 1,060 kB minified and cannot be split further,
 * so the chunk-size warning limit sits just above it. Any other chunk
 * growing past that size still triggers the warning.
 *
 * Workers are bundled as ES modules because MapLibre starts its worker
 * with `{ type: "module" }`.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    chunkSizeWarningLimit: 1100,
  },
  worker: {
    format: "es",
  },
});
