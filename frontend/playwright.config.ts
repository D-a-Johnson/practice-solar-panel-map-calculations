import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against the Docker stack from compose.e2e.yml: the same
 * images as in production, on a seeded database without internet access.
 * Locally, a stack that is already running is reused.
 */
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:8081",
    /**
     * MapLibre then jumps to a search result instead of flying there, so a
     * click right after a search lands where the test expects.
     */
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "docker compose -f ../docker-compose.yml -f ../compose.e2e.yml --profile app up --build",
    url: "http://localhost:8081/api/health",
    reuseExistingServer: !process.env.CI,
    /** The first run builds both images. */
    timeout: 300_000,
    /**
     * Ctrl-C makes compose stop the containers. Playwright's default kill
     * would end only the compose command and leave them running.
     */
    gracefulShutdown: { signal: "SIGINT", timeout: 30_000 },
  },
});
