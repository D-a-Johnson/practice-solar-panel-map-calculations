import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite build and dev-server configuration.
 *
 * The dev server forwards every `/api/...` request to Django on port 8000.
 * The browser only ever talks to Vite's own origin, so no CORS setup is
 * needed in development. Production gets its own answer in Stage 9.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
