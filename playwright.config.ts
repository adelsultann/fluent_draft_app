import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for FluentDraft.
 *
 * Starts the Next.js dev server before tests and tears it down after.
 * Tests run against Chromium by default; additional browsers can be
 * added in CI via the `projects` array.
 *
 * Related docs:
 *   - docs/testing-strategy.md § End-To-End Tests
 *   - docs/project-structure.md § Testing Structure
 */

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
