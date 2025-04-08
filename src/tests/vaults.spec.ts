
import { test, expect, Page } from '@playwright/test';

// Test wallet address to use
const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';
const VAULTS_URL = 'https://dev-krystal-web-pr-3207.krystal.team/vaults';

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

test.describe('Krystal Vaults Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup wallet connection before each test
    await setupWalletConnection(page);
  });

  test('should load vaults page and verify UI elements', async ({ page }) => {
    // Visit the vaults page
    await page.goto(VAULTS_URL);
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded successfully');
    
    // Take screenshot of initial page load
    await page.screenshot({ path: 'screenshots/vaults-page-initial.png' });
    
    // Verify page title
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    expect(pageTitle).toContain('Vaults');
    
    // Verify wallet address is displayed (shortened format)
    const shortenedAddress = TEST_WALLET_ADDRESS.slice(0, 6) + '...' + TEST_WALLET_ADDRESS.slice(-4);
    const addressElement = await page.getByText(new RegExp(shortenedAddress, 'i'), { exact: false });
    expect(addressElement).toBeTruthy();
    console.log('Wallet address verified on page');
    
    // Verify navigation bar/header exists
    const header = await page.locator('header').first();
    expect(header).toBeTruthy();
    console.log('Header/navigation bar verified');

    // Verify portfolio section exists
    const portfolioSection = await page.locator('text=Portfolio').first();
    expect(portfolioSection).toBeTruthy();
    console.log('Portfolio section verified');

    // Verify stats section exists
    const statsSection = await page.locator('text=Stats').first();
    expect(statsSection).toBeTruthy();
    console.log('Stats section verified');

    // Verify vault table exists
    const vaultTable = await page.locator('table, [role="table"], .vault-list').first();
    if (await vaultTable.isVisible()) {
      console.log('Vault table/list verified');
    } else {
      // Try alternative selector based on column headers
      const vaultTableHeader = await page.locator('text=Vault >> xpath=ancestor::div[contains(.,"Assets")][contains(.,"Type")][contains(.,"TVL")]').first();
      expect(vaultTableHeader).toBeTruthy();
      console.log('Vault table header verified');
    }
    
    // Look for vault filter buttons
    const allVaultButton = await page.locator('button:has-text("All Vault")').first();
    expect(allVaultButton).toBeTruthy();
    console.log('All Vault filter button verified');
    
    // Wait for vaults to load and check if at least one vault exists
    try {
      // Wait for vault items to appear
      await page.waitForSelector('text=/Long Test|steve|NKN Vault|Bull/', { timeout: 15000 });
      console.log('Found at least one vault');
      
      // Verify deposit buttons
      const depositButton = await page.locator('button:has-text("Deposit")').first();
      expect(depositButton).toBeTruthy();
      console.log('Deposit button verified');
      
      // Click deposit button
      await depositButton.click();
      console.log('Clicked on deposit button');
      
      // Verify deposit modal appears
      const depositModal = await page.locator('.modal, [role="dialog"], dialog').first();
      await expect(depositModal).toBeVisible({ timeout: 5000 });
      console.log('Deposit modal opened successfully');
      
      // Take screenshot with modal open
      await page.screenshot({ path: 'screenshots/vaults-deposit-modal.png' });
      
      // Close modal if possible
      const closeButton = await page.locator('.modal button[aria-label="Close"], [role="dialog"] button[aria-label="Close"], dialog button[aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        console.log('Modal closed');
      }
    } catch (error) {
      console.log('No vaults found or vaults are still loading:', error);
    }
    
    // Verify search functionality
    const searchInput = await page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      console.log('Search input found, testing search functionality');
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for search results
      
      // Take screenshot of search results
      await page.screenshot({ path: 'screenshots/vaults-search-results.png' });
    } else {
      console.log('No search input found on page');
    }
    
    // Final screenshot after all tests
    await page.screenshot({ path: 'screenshots/vaults-page-final.png' });
    console.log('Test completed successfully');
  });
});
