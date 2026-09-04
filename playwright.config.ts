import { defineConfig, devices } from '@playwright/test'

const appUrl = 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: appUrl,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node scripts/auth-proxy-probe.mjs',
      url: 'http://127.0.0.1:4174/health',
      reuseExistingServer: false,
    },
    {
      command:
        'AUTH_PROXY_TARGET=http://127.0.0.1:4174 bun run dev:vite',
      url: appUrl,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
