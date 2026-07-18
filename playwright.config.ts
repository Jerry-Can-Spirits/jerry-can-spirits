import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8787',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Run against the OpenNext/workerd preview, not `next start`: middleware (the
  // page-level age gate, bot and geo detection) only executes on the Worker
  // runtime, so the marketing route handlers and the gate are both exercised.
  // Set BASE_URL to target a deployed preview instead (skips the local build).
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run preview',
        url: 'http://localhost:8787',
        timeout: 600_000,
        reuseExistingServer: !process.env.CI,
      },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
})
