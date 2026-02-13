import { defineConfig, devices } from "@playwright/test";

/**
 * PDMS Home-Spital — Playwright E2E-Konfiguration
 * Testet Login-Flow, Patienten-Workflow, Vitaldaten
 */
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [["html", { open: "never" }], ["list"]],
    timeout: 30_000,
    use: {
        baseURL: process.env.BASE_URL || "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: process.env.CI
        ? undefined
        : {
            command: "pnpm dev",
            url: "http://localhost:3000",
            reuseExistingServer: true,
            timeout: 60_000,
        },
});
