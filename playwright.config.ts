import { defineConfig, devices } from "@playwright/test";
import { siteConfig } from "./site.config";

// E2E tests run against the built static site (out/), served under basePath like GitHub Pages.
const port = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}${siteConfig.basePath}/`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm serve",
    url: `http://localhost:${port}${siteConfig.basePath}/`,
    reuseExistingServer: !process.env.CI,
  },
});
