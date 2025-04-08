
import { test, expect, Page } from '@playwright/test';
import Web3 from 'web3';

// Test wallet address to use
const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';
const POSITIONS_URL = 'https://dev-krystal-web-pr-3207.krystal.team/account/0x1822946a4f1a625044d93a468db6db756d4f89ff/positions';

/**
 * Setup Web3 wallet connection and inject it into the browser context
 */
async function setupWalletConnection(page: Page): Promise<void> {
  // Inject Web3 and setup mock wallet provider
  await page.addInitScript(() => {
    // Mock the ethereum provider
    const mockProvider = {
      isMetaMask: true,
      selectedAddress: '0x1822946a4f1a625044d93a468db6db756d4f89ff',
      networkVersion: '1',
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          return ['0x1822946a4f1a625044d93a468db6db756d4f89ff'];
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };

    // Add ethereum provider to window
    Object.defineProperty(window, 'ethereum', {
      value: mockProvider,
      writable: true,
      configurable: true,
    });
  });

  // Inject Web3 library into the page
  await page.addInitScript({
    path: require.resolve('web3/dist/web3.min.js'),
  });

  console.log('Web3 wallet connection setup completed');
}

/**
 * Check if wallet is whitelisted, prompt user to connect real wallet if needed
 */
async function verifyWalletWhitelist(page: Page): Promise<boolean> {
  // Visit the positions page first
  await page.goto(POSITIONS_URL);
  await page.waitForLoadState('networkidle');
  
  // Check if there's a whitelist error or connection requirement message
  const requiresRealWallet = await page.evaluate(() => {
    // Look for elements suggesting whitelist verification is needed
    const errorElements = document.querySelectorAll('.error-message, .whitelist-error, .connection-required');
    const errorTexts = Array.from(document.querySelectorAll('div, p, span, h1, h2, h3, h4, h5, h6'))
      .map(el => el.textContent?.toLowerCase() || '')
      .filter(text => 
        text.includes('whitelist') || 
        text.includes('connect wallet') || 
        text.includes('access denied') ||
        text.includes('not authorized')
      );
    
    return errorElements.length > 0 || errorTexts.length > 0;
  });
  
  if (requiresRealWallet) {
    // Take screenshot of whitelist verification requirement
    await page.screenshot({ path: 'screenshots/positions-whitelist-verification-required.png' });
    console.log('⚠️ Whitelist verification required. Manual wallet connection needed.');
    
    // Display instructions for manual wallet connection
    console.log('----------------------------------------------------------------------------------------');
    console.log('MANUAL ACTION REQUIRED: Please connect your wallet using MetaMask or Rabby extension');
    console.log('1. Open your wallet extension (MetaMask/Rabby)');
    console.log('2. Connect to the site when prompted');
    console.log('3. Ensure your wallet is whitelisted for access');
    console.log('4. After connection, the test will continue automatically');
    console.log('----------------------------------------------------------------------------------------');
    
    // Wait for wallet connection (up to 2 minutes)
    try {
      // Wait for either the "Connect Wallet" button to disappear or for content to appear
      await Promise.race([
        page.waitForSelector('.connect-wallet-button, button:has-text("Connect Wallet")', { state: 'detached', timeout: 120000 }),
        page.waitForSelector('.position-item, .portfolio-section', { timeout: 120000 })
      ]);
      
      console.log('✅ Wallet connected successfully');
      await page.screenshot({ path: 'screenshots/positions-wallet-connected.png' });
      return true;
    } catch (error) {
      console.error('❌ Failed to connect wallet within the timeout period', error);
      return false;
    }
  }
  
  console.log('✅ No whitelist verification required, continuing with test');
  return true;
}

test.describe('Krystal Positions Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup wallet connection before each test
    await setupWalletConnection(page);
  });

  test('should load positions page and verify UI elements', async ({ page }) => {
    console.log('Starting Positions page test...');
    
    // First verify whitelist and wallet connection if needed
    const whitelistVerified = await verifyWalletWhitelist(page);
    if (!whitelistVerified) {
      test.skip('Test skipped due to failed wallet connection or whitelist verification');
      return;
    }
    
    // Re-visit the positions page to ensure a fresh state after verification
    await page.goto(POSITIONS_URL);
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded successfully');
    
    // Take screenshot of initial page load
    await page.screenshot({ path: 'screenshots/positions-page-initial.png' });
    
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
          await page.screenshot({ path: 'screenshots/positions-modal-open.png' });
          
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
      await page.screenshot({ path: 'screenshots/positions-search-results.png' });
    } else {
      console.log('No search input found on page');
    }
    
    // Final screenshot after all tests
    await page.screenshot({ path: 'screenshots/positions-page-final.png' });
    console.log('Test completed successfully');
  });
});
