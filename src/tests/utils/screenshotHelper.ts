
import { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory name for current module (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '..', '..', '..', 'screenshots');

/**
 * Initialize screenshots directory
 */
export function initScreenshotsDir(): string {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  return screenshotsDir;
}

/**
 * Take a screenshot with standardized naming
 */
export async function takeScreenshot(
  page: Page, 
  name: string, 
  options?: { fullPage?: boolean }
): Promise<void> {
  const screenshotPath = path.join(initScreenshotsDir(), `${name}.png`);
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: options?.fullPage ?? true 
  });
  console.log(`Screenshot saved: ${name}.png`);
}

/**
 * Take a screenshot during wallet connection process
 */
export async function takeWalletConnectionScreenshot(
  page: Page,
  step: string
): Promise<void> {
  const name = `wallet-connection-${step}-${Date.now()}`;
  await takeScreenshot(page, name);
  console.log(`Wallet connection screenshot saved: ${name}.png`);
}

/**
 * Capture page state screenshots during test execution
 */
export async function capturePageState(
  page: Page,
  testName: string,
  state: string
): Promise<void> {
  const name = `${testName}-${state}-${Date.now()}`;
  await takeScreenshot(page, name);
  console.log(`Page state captured: ${name}.png`);
}
