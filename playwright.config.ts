import { defineConfig } from '@playwright/test'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

export default defineConfig({
  testDir: './tests/playwright',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 2 * 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev',
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000,
  },
})
