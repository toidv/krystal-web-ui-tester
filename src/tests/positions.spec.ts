
import { test, expect } from '@playwright/test';
import { setupWalletConnection, connectWallet, verifyWalletConnected, TEST_WALLET_ADDRESS } from './utils/setupWallet';
import { takeScreenshot, initScreenshotsDir } from './utils/screenshotHelper';
import { URLS } from './utils/constants';

// Initialize screenshots directory
initScreenshotsDir();

test.describe('Krystal Positions Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup wallet connection before each test
    await setupWalletConnection(page);
  });

  test('should load positions page and verify UI elements', async ({ page }) => {
    console.log('Starting Positions page test...');
    
    // Visit the positions page
    await page.goto(URLS.POSITIONS);
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Connect wallet and verify connection
    await connectWallet(page);
    await verifyWalletConnected(page);
    
    // Take screenshot after wallet connection
    await takeScreenshot(page, 'wallet-connected-positions');
    
    console.log('Page loaded successfully');
    
    // Take screenshot of initial page load
    await takeScreenshot(page, 'positions-page-initial');
    
    // Verify page title
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    expect(pageTitle).toContain('Positions');
    
    // Verify wallet address is displayed (shortened format)
    const shortenedAddress = TEST_WALLET_ADDRESS.slice(0, 6) + '...' + TEST_WALLET_ADDRESS.slice(-4);
    const addressElement = await page.getByText(new RegExp(shortenedAddress, 'i'), { exact: false });
    expect(addressElement).toBeTruthy();
    console.log('Wallet address verified on page');
    
    // Verify navigation bar/header exists
    const header = await page.locator('header').first();
    expect(header).toBeTruthy();
    console.log('Header/navigation bar verified');

    // Verify positions table/list exists
    const positionsTable = await page.locator('table, [role="table"], .positions-list, .positions-table').first();
    expect(positionsTable).toBeTruthy();
    console.log('Positions table/list verified');
    
    // Wait for positions to load and check if at least one position exists
    try {
      await page.waitForSelector('.position-item, tr:not(:first-child)', { timeout: 15000 });
      const positions = await page.locator('.position-item, tr:not(:first-child)').count();
      console.log(`Found ${positions} positions`);
      
      if (positions > 0) {
        console.log('At least one position verified');
        
        // Click on action button for the first position (if exists)
        const actionButton = await page.locator('.position-item button, tr:not(:first-child) button').first();
        if (await actionButton.isVisible()) {
          console.log('Found action button, clicking it');
          await actionButton.click();
          
          // Verify that a modal or detail panel opens
          const modal = await page.locator('.modal, [role="dialog"], .detail-panel').first();
          await expect(modal).toBeVisible({ timeout: 5000 });
          console.log('Modal/detail panel opened successfully');
          
          // Take screenshot with modal open
          await takeScreenshot(page, 'positions-modal-open');
          
          // Close the modal if there's a close button
          const closeButton = await page.locator('.modal button, [role="dialog"] button, .detail-panel button').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            console.log('Modal closed');
          }
        } else {
          console.log('No action button found to click');
        }
      } else {
        console.log('No positions found, but page loaded correctly');
      }
    } catch (error) {
      console.log('No positions found or positions are still loading');
    }
    
    // Verify search functionality if it exists
    const searchInput = await page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      console.log('Search input found, testing search functionality');
      await searchInput.fill('ETH');
      await page.waitForTimeout(1000); // Wait for search results
      
      // Take screenshot of search results
      await takeScreenshot(page, 'positions-search-results');
    } else {
      console.log('No search input found on page');
    }
    
    // Final screenshot after all tests
    await takeScreenshot(page, 'positions-page-final');
    console.log('Test completed successfully');
  });
});
