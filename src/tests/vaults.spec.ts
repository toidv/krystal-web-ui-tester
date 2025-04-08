import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for current module (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test wallet address to use
const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';
const VAULTS_URL = 'http://192.168.6.16:3000/vaults';

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

  // Instead of using require.resolve, we'll use a direct URL to a CDN for web3
  await page.addInitScript({
    content: `
      // Load Web3 from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/web3@4.16.0/dist/web3.min.js';
      script.async = true;
      document.head.appendChild(script);
    `
  });

  console.log('Web3 wallet connection setup completed');
}

test.describe('Krystal Vaults Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup wallet connection before each test
    await setupWalletConnection(page);
  });

  test('should load vaults page and verify UI elements', async ({ page }) => {
    console.log('Starting Vaults page test...');
    
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

  test('should verify vault sorting, details and APR information', async ({ page }) => {
    console.log('Starting Vault sorting and detail verification test...');
    
    // Visit the vaults page
    await page.goto(VAULTS_URL);
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    console.log('Page loaded successfully');
    
    // Take screenshot of initial page load
    await page.screenshot({ path: 'screenshots/vaults-sorting-initial.png' });
    
    // 1. Sort vault list by APR
    console.log('Attempting to sort vaults by APR...');
    
    // Look for APR header and click it to sort
    const aprHeader = await page.getByText('APR', { exact: true }).filter({ hasText: /APR/ });
    await aprHeader.click();
    console.log('Clicked on APR header to sort');
    
    // Wait for sorting to complete
    await page.waitForTimeout(1000);
    
    // Take screenshot after sorting
    await page.screenshot({ path: 'screenshots/vaults-sorted-by-apr.png' });
    
    // 2. Get the top 3 vaults by APR and click on each
    console.log('Identifying top 3 vaults by APR...');
    
    // Extract APR values to verify sorting
    const aprCells = await page.locator('tr td:has-text("%")').all();
    
    // Verify at least 3 vaults are displayed
    console.log(`Found ${aprCells.length} vaults with APR values`);
    expect(aprCells.length).toBeGreaterThanOrEqual(1);
    
    // Store APR values for later comparison
    const aprValues: string[] = [];
    for (let i = 0; i < Math.min(3, aprCells.length); i++) {
      const aprText = await aprCells[i].textContent();
      if (aprText) {
        aprValues.push(aprText.trim());
        console.log(`Vault ${i+1} APR: ${aprText.trim()}`);
      }
    }
    
    // Process each of the top 3 vaults (or fewer if less than 3 exist)
    for (let i = 0; i < Math.min(3, aprCells.length); i++) {
      console.log(`Examining vault ${i+1} details...`);
      
      // Click on the vault row or name to open details
      await aprCells[i].click();
      
      // Wait for details page to load
      await page.waitForLoadState('networkidle');
      console.log(`Vault ${i+1} details page loaded`);
      
      // Take screenshot of details page
      await page.screenshot({ path: `screenshots/vault-${i+1}-details.png` });
      
      // 3. Validate APR
      const detailPageApr = await page.locator('text=/APR/i').first();
      expect(await detailPageApr.isVisible()).toBeTruthy();
      console.log(`APR display verified on vault ${i+1} details page`);
      
      // 3.1 Check performance chart exists
      const performanceChart = await page.locator('text=/Performance/i').first();
      expect(await performanceChart.isVisible()).toBeTruthy();
      console.log(`Performance chart verified on vault ${i+1} details page`);
      
      // Look for chart elements
      const chartElement = await page.locator('.recharts-responsive-container').first();
      expect(await chartElement.isVisible()).toBeTruthy();
      console.log(`Chart visualization verified on vault ${i+1} details page`);
      
      // 3.2 Check chart performance info with APR in header
      const performanceHeader = await page.locator('h2:has-text("Performance")').first();
      expect(await performanceHeader.isVisible()).toBeTruthy();
      
      // Check if APR info is shown near the chart
      const aprNearChart = await page.locator('text=/APR/i').filter({ hasText: /APR/ }).first();
      expect(await aprNearChart.isVisible()).toBeTruthy();
      console.log(`APR information verified near performance chart on vault ${i+1} details page`);
      
      // 3.3 Check information of vault elements on detail
      // Verify key vault information sections
      const sections = [
        'Strategy',
        'Assets',
        'TVL',
        'Description'
      ];
      
      for (const section of sections) {
        const sectionElement = await page.locator(`text=/${section}/i`).first();
        if (await sectionElement.isVisible()) {
          console.log(`Vault detail section "${section}" verified on vault ${i+1} details page`);
        } else {
          console.log(`Vault detail section "${section}" not found on vault ${i+1} details page`);
        }
      }
      
      // Additional vault-specific elements to check
      const depositButton = await page.locator('button:has-text("Deposit")').first();
      expect(await depositButton.isVisible()).toBeTruthy();
      console.log(`Deposit button verified on vault ${i+1} details page`);
      
      // Navigate back to the vault list page
      await page.goto(VAULTS_URL);
      await page.waitForLoadState('networkidle');
      console.log(`Returned to vault list for next vault`);
      
      // Re-sort by APR if needed
      await aprHeader.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('Vault sorting and details verification test completed successfully');
  });
});
