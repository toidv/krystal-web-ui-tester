
import { chromium } from '@playwright/test';
import { setupWalletConnection } from './setupWallet';

/**
 * Global setup runs once before all tests
 * This ensures the wallet connection is established before any test runs
 */
async function globalSetup() {
  console.log('Starting global setup - initializing wallet connection');
  
  // Launch a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Setup wallet connection as a prerequisite
    await setupWalletConnection(page);
    console.log('Global wallet connection setup completed successfully');
  } catch (error) {
    console.error('CRITICAL ERROR: Failed to setup wallet connection during global setup:', error);
    // Still allow tests to continue, they will retry wallet connection if needed
  } finally {
    // Close the browser after setup
    await browser.close();
  }
  
  console.log('Global setup completed');
}

export default globalSetup;
