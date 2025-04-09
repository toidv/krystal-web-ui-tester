
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './src/tests',
  timeout: 120000, // Increased timeout to 2 minutes to prevent premature test failures
  retries: 1, // Add one retry for flaky tests
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // Add more protection against navigation timeouts
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  reporter: [
    ['html'],
    ['list']
  ],
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
  ],
};

export default config;
