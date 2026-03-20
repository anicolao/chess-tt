import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 2000,
  expect: {
    timeout: 2000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    actionTimeout: 2000,
    navigationTimeout: 2000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    /* 
     * EXCEPTION: The 2000ms timeout rule is increased to 10000ms ONLY for 
     * webServer startup in CI environments, as 2000ms is insufficient 
     * for a reliable warm-up on GitHub Actions runners.
     */
    timeout: process.env.CI ? 10000 : 2000,
  },
});
