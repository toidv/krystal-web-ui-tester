
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './src/tests',
  timeout: 60000,
  retries: 2,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
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
  // Global setup for each test run - ensures wallet connection happens first
  globalSetup: './src/tests/utils/globalSetup.ts',
};

export default config;
