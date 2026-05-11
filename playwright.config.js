const { defineConfig, devices } = require('@playwright/test');

const e2eBaseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'node e2e/helpers/e2eServer.js',
    url: `${e2eBaseUrl}/login`,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
