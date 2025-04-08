
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
  try {
    // Check if page is still usable before attempting to take screenshot
    if (page.isClosed()) {
      console.warn(`Cannot take screenshot '${name}.png': Page is already closed`);
      return;
    }
    
    const screenshotPath = path.join(initScreenshotsDir(), `${name}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: options?.fullPage ?? true 
    });
    console.log(`Screenshot saved: ${name}.png`);
  } catch (error) {
    // Handle errors gracefully without failing the test
    console.warn(`Failed to take screenshot '${name}.png': ${error.message}`);
  }
}
