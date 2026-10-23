import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

export default defineConfig({
  testDir: resolve(__dirname, 'tests/e2e'),
  // Playwright's 30s default is too tight for this suite. Most tests are single-page flows against
  // a Next dev server, where even a warm route can take seconds under load, and a cold compile of
  // /register or /dashboard on the first test of a run routinely blows past 30s on its own. The
  // genuinely slow tests (real RAG + llama3.1:8b on CPU) override this individually via
  // test.setTimeout().
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 60_000,
    reuseExistingServer: true,
  },
});
