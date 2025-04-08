
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
 * Format date for screenshot filenames
 */
function formatDate(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
}

/**
 * Take a screenshot with standardized naming
 */
export async function takeScreenshot(
  page: Page, 
  name: string, 
  options?: { fullPage?: boolean }
): Promise<void> {
  const timestamp = formatDate();
  const screenshotPath = path.join(initScreenshotsDir(), `${name}-${timestamp}.png`);
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: options?.fullPage ?? true 
  });
  console.log(`Screenshot saved: ${name}-${timestamp}.png`);
}

/**
 * Take a screenshot during wallet connection process
 */
export async function takeWalletConnectionScreenshot(
  page: Page,
  step: string
): Promise<void> {
  const timestamp = formatDate();
  const name = `wallet-connection-${step}-${timestamp}`;
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
  const timestamp = formatDate();
  const name = `${testName}-${state}-${timestamp}`;
  await takeScreenshot(page, name);
  console.log(`Page state captured: ${name}.png`);
}
