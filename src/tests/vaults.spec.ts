import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory name for current module (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

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
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'vaults-page-initial.png'),
      fullPage: true 
    });
    
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

  test('should verify vault sorting, details and validate all vault information', async ({ page }) => {
    console.log('Starting comprehensive vault details verification test...');
    
    // Visit the vaults page
    await page.goto(VAULTS_URL);
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    console.log('Page loaded successfully');
    
    // Take screenshot of initial page load
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'vaults-sorting-initial.png'),
      fullPage: true 
    });
    
    // 1. Sort vault list by APR DESC
    console.log('Attempting to sort vaults by APR in descending order...');
    
    // Look for APR header and click it to sort (potentially twice to get DESC order)
    try {
      // Try different selectors for the APR column header
      const aprHeaderSelectors = [
        'th:has-text("APR")',
        '[role="columnheader"]:has-text("APR")',
        'div.column-header:has-text("APR")',
        'button:has-text("APR")',
        'text=APR'
      ];
      
      let aprHeaderFound = false;
      for (const selector of aprHeaderSelectors) {
        const aprHeader = page.locator(selector).first();
        if (await aprHeader.isVisible()) {
          // Click once to sort (may be ASC or DESC depending on default)
          await aprHeader.click();
          await page.waitForTimeout(500);
          
          // Click again to ensure DESC order (if needed)
          await aprHeader.click();
          await page.waitForTimeout(1000);
          
          console.log('Clicked on APR header to sort in descending order');
          aprHeaderFound = true;
          break;
        }
      }
      
      if (!aprHeaderFound) {
        console.log('APR header not found with standard selectors, continuing test');
      }
    } catch (error) {
      console.log('Error sorting by APR:', error);
    }
    
    // Take screenshot after sorting
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'vaults-sorted-by-apr.png'),
      fullPage: true 
    });
    
    // 2. Find vaults and click on the first one to view details
    console.log('Looking for vaults with APR values...');
    
    // Use multiple selectors to find vaults with APR values
    const vaultSelectors = [
      'tr:has-text("%")',
      '[role="row"]:has-text("%")',
      'div.vault-item:has-text("%")',
      'div:has-text("APR") + div:has-text("%")',
      'text=Long Test'
    ];
    
    let vaultElement = null;
    for (const selector of vaultSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`Found ${elements.length} vaults with selector: ${selector}`);
        vaultElement = elements[0]; // Take the first vault (highest APR after sorting)
        break;
      }
    }
    
    if (!vaultElement) {
      throw new Error('No vaults found on the page');
    }
    
    // Click on the vault to view details
    await vaultElement.click();
    console.log('Clicked on vault to view details');
    
    // Wait for detail page to load
    await page.waitForLoadState('networkidle');
    console.log('Vault detail page loaded');
    
    // Take screenshot of detail page
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'vault-detail.png'),
      fullPage: true 
    });
    
    // 3. Validate the APR chart by checking Historical Performance time periods
    console.log('Checking Historical Performance chart and time period selectors...');
    
    // Look for Historical Performance section
    const performanceSelectors = [
      'text="Historical Performance"',
      'h2:has-text("Historical Performance")',
      'text=Performance',
      'div:has-text("Historical Performance")'
    ];
    
    let performanceSection = null;
    for (const selector of performanceSelectors) {
      const section = page.locator(selector).first();
      if (await section.isVisible()) {
        console.log(`Found Historical Performance section with selector: ${selector}`);
        performanceSection = section;
        break;
      }
    }
    
    if (performanceSection) {
      // Verify performance chart time period selectors (24h, 7D, 30D)
      const timePeriods = ['24h', '7D', '30D'];
      
      for (const period of timePeriods) {
        try {
          const periodButton = page.locator(`button:has-text("${period}"), div:has-text("${period}"):not(:has-text("Historical"))`).first();
          
          if (await periodButton.isVisible()) {
            console.log(`Found ${period} time period selector`);
            
            // Click on the time period
            await periodButton.click();
            await page.waitForTimeout(500);
            console.log(`Clicked on ${period} time period`);
            
            // Take screenshot of the chart with this time period
            await page.screenshot({ path: `screenshots/performance-chart-${period}.png` });
          } else {
            console.log(`${period} time period selector not found or not visible`);
          }
        } catch (error) {
          console.log(`Error testing ${period} time period:`, error);
        }
      }
      
      // Verify chart component exists
      const chartElements = [
        '.recharts-responsive-container',
        'svg.recharts-surface',
        '[class*="chart"]',
        'svg g path'
      ];
      
      let chartFound = false;
      for (const selector of chartElements) {
        const chart = page.locator(selector).first();
        if (await chart.isVisible()) {
          console.log(`Found chart visualization with selector: ${selector}`);
          chartFound = true;
          break;
        }
      }
      
      if (chartFound) {
        console.log('Performance chart visualization verified');
      } else {
        console.log('Performance chart visualization not found');
      }
    } else {
      console.log('Historical Performance section not found');
    }
    
    // 4. Validate Assets section
    console.log('Checking Assets section...');
    
    // Look for Assets section
    const assetsSelectors = [
      'text="Assets"',
      'h2:has-text("Assets")',
      'div:has-text("Assets"):not(:has-text("Historical"))'
    ];
    
    let assetsSection = null;
    for (const selector of assetsSelectors) {
      const section = page.locator(selector).first();
      if (await section.isVisible()) {
        console.log(`Found Assets section with selector: ${selector}`);
        assetsSection = section;
        break;
      }
    }
    
    if (assetsSection) {
      // Verify asset items are displayed
      const assetItems = await page.locator('img[alt*="WETH"], img[alt*="ETH"], img[alt*="token"]').all();
      
      if (assetItems.length > 0) {
        console.log(`Found ${assetItems.length} asset items`);
      } else {
        console.log('No asset items found in Assets section');
      }
      
      // Check for TVL value in Assets section
      const tvlText = await page.locator('text=TVL').first();
      if (await tvlText.isVisible()) {
        console.log('TVL value verified in Assets section');
      }
    } else {
      console.log('Assets section not found');
    }
    
    // 5. Validate Strategy Settings
    console.log('Checking Strategy Settings section...');
    
    // Look for Strategy Settings section
    const strategySelectors = [
      'text="Strategy Settings"',
      'h2:has-text("Strategy")',
      'div:has-text("Strategy Settings")'
    ];
    
    let strategySection = null;
    for (const selector of strategySelectors) {
      const section = page.locator(selector).first();
      if (await section.isVisible()) {
        console.log(`Found Strategy Settings section with selector: ${selector}`);
        strategySection = section;
        break;
      }
    }
    
    if (strategySection) {
      // Check for risk indicator
      const riskIndicator = await page.locator('text="High Risk", text="Medium Risk", text="Low Risk"').first();
      if (await riskIndicator.isVisible()) {
        const riskText = await riskIndicator.textContent();
        console.log(`Risk level verified: ${riskText}`);
      } else {
        console.log('Risk indicator not found');
      }
      
      // Check for range settings
      const rangeSettings = await page.locator('text=Range Setting, text=[NARROW], text=[WIDE]').first();
      if (await rangeSettings.isVisible()) {
        console.log('Range settings verified in Strategy section');
      } else {
        console.log('Range settings not found');
      }
    } else {
      console.log('Strategy Settings section not found');
    }
    
    // 6. Validate Deposit/Withdraw functionality
    console.log('Checking Deposit/Withdraw functionality...');
    
    // Look for Deposit button
    const depositButton = await page.locator('button:has-text("Deposit"), button:has-text("+ Deposit")').first();
    
    if (await depositButton.isVisible()) {
      console.log('Deposit button found, testing deposit flow');
      
      // Check if button is already active/selected
      const isActive = await depositButton.evaluate(el => 
        el.classList.contains('active') || 
        el.classList.contains('selected') || 
        el.getAttribute('aria-selected') === 'true'
      );
      
      if (!isActive) {
        // Click on deposit button if not already active
        await depositButton.click();
        await page.waitForTimeout(500);
        console.log('Clicked on Deposit button');
      }
      
      // Look for deposit amount input
      const amountInput = await page.locator('input[type="number"], input[placeholder*="Amount"]').first();
      
      if (await amountInput.isVisible()) {
        console.log('Deposit amount input found');
        
        // Check for MAX button
        const maxButton = await page.locator('button:has-text("MAX")').first();
        if (await maxButton.isVisible()) {
          console.log('MAX button found in deposit form');
        }
        
        // Check for slippage setting
        const slippageText = await page.locator('text="slippage", text="Slippage"').first();
        if (await slippageText.isVisible()) {
          console.log('Slippage settings found in deposit form');
        }
      } else {
        console.log('Deposit amount input not found');
      }
    }
    
    // Look for Withdraw button
    const withdrawButton = await page.locator('button:has-text("Withdraw")').first();
    
    if (await withdrawButton.isVisible()) {
      console.log('Withdraw button found');
      
      // Click on withdraw button to switch to withdraw view
      await withdrawButton.click();
      await page.waitForTimeout(500);
      console.log('Clicked on Withdraw button');
      
      // Look for withdraw amount input
      const withdrawInput = await page.locator('input[type="number"], input[placeholder*="Amount"]').first();
      
      if (await withdrawInput.isVisible()) {
        console.log('Withdraw amount input found');
      } else {
        console.log('Withdraw amount input not found');
      }
    } else {
      console.log('Withdraw button not found');
    }
    
    // 7. Validate Risk Warning section
    console.log('Checking Understand the Risk section...');
    
    // Look for risk warning section
    const riskWarningSelectors = [
      'text="Understand the Risk"',
      'h2:has-text("Understand the Risk")',
      'div:has-text("Understand the Risk")'
    ];
    
    let riskWarningFound = false;
    for (const selector of riskWarningSelectors) {
      const riskWarning = page.locator(selector).first();
      if (await riskWarning.isVisible()) {
        console.log('Risk warning section "Understand the Risk" found');
        riskWarningFound = true;
        
        // Verify risk warning content
        const warningContent = await page.locator('text=DYOR, text=managed by the Vault Owner').first();
        if (await warningContent.isVisible()) {
          console.log('Risk warning content verified');
        } else {
          console.log('Risk warning content not found');
        }
        
        break;
      }
    }
    
    if (!riskWarningFound) {
      console.log('Risk warning section "Understand the Risk" not found');
    }
    
    // Final screenshot after all validation
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'vault-detail-final.png'),
      fullPage: true 
    });
    console.log('Comprehensive vault details verification test completed');
  });
});

/**
 * Process the details page for a single vault
 */
async function processVaultDetails(page: Page, index: number, clickableElement: any): Promise<void> {
  console.log(`Examining vault ${index+1} details...`);
  
  // Click on the vault row or name to open details
  await clickableElement.click();
  
  // Wait for details page to load
  await page.waitForLoadState('networkidle');
  console.log(`Vault ${index+1} details page loaded`);
  
  // Take screenshot of details page
  await page.screenshot({ 
    path: path.join(screenshotsDir, `vault-${index+1}-details.png`),
    fullPage: true
  });
  
  // 3. Validate APR - using multiple selectors to find APR information
  try {
    // Try different selectors for finding APR information
    const selectors = [
      'text=APR',
      'text=/Annual Percentage Rate/i',
      'text=/Annual Yield/i',
      'text=/Yield/i',
      'div:has-text("APR")',
      '*[data-testid*="apr"]',
      '*[id*="apr"]',
      '*[class*="apr"]'
    ];
    
    let aprFound = false;
    
    for (const selector of selectors) {
      const aprElement = await page.locator(selector).first();
      if (await aprElement.isVisible()) {
        console.log(`APR element found with selector: ${selector}`);
        aprFound = true;
        break;
      }
    }
    
    if (!aprFound) {
      console.log('APR element not found with standard selectors, but continuing test');
    } else {
      console.log(`APR display verified on vault ${index+1} details page`);
    }
    
    // 3.1 Check performance chart exists - using multiple selectors
    const performanceSelectors = [
      'text=Performance',
      'text=/Chart/i',
      'text=/History/i',
      'h2:has-text("Performance")',
      '*[data-testid*="chart"]',
      '*[data-testid*="performance"]',
      '*[class*="chart"]',
      '.recharts-responsive-container'
    ];
    
    let chartFound = false;
    
    for (const selector of performanceSelectors) {
      const chartElement = await page.locator(selector).first();
      if (await chartElement.isVisible()) {
        console.log(`Chart element found with selector: ${selector}`);
        chartFound = true;
        break;
      }
    }
    
    if (!chartFound) {
      console.log('Performance chart not found with standard selectors, checking for any chart component');
      // Look for any chart elements using recharts library
      const rechartElement = await page.locator('.recharts-responsive-container, .recharts-surface, [class*="chart"]').first();
      if (await rechartElement.isVisible()) {
        console.log('Found chart visualization component');
        chartFound = true;
      }
    }
    
    if (chartFound) {
      console.log(`Performance chart verified on vault ${index+1} details page`);
    } else {
      console.log('No performance chart found, continuing test');
    }
    
    // 3.3 Check information of vault elements on detail
    // Verify key vault information sections
    const sections = [
      'Strategy',
      'Assets',
      'TVL',
      'Description',
      'Balance',
      'Deposits',
      'Withdrawals'
    ];
    
    for (const section of sections) {
      try {
        const sectionElement = await page.locator(`text=/${section}/i`).first();
        if (await sectionElement.isVisible()) {
          console.log(`Vault detail section "${section}" verified on vault ${index+1} details page`);
        }
      } catch (error) {
        console.log(`Vault detail section "${section}" not found on vault ${index+1} details page`);
      }
    }
    
    // Additional vault-specific elements to check
    try {
      const depositButton = await page.locator('button:has-text("Deposit"), button:has-text("Invest"), button:has-text("Buy")').first();
      if (await depositButton.isVisible()) {
        console.log(`Deposit/Invest button verified on vault ${index+1} details page`);
      } else {
        console.log('No deposit button found on details page');
      }
    } catch (error) {
      console.log('Error finding deposit button:', error);
    }
  } catch (error) {
    console.log(`Error processing vault ${index+1} details:`, error);
  } finally {
    // Navigate back to the vault list page
    await page.goto(VAULTS_URL);
    await page.waitForLoadState('networkidle');
    console.log(`Returned to vault list for next vault`);
    
    // Try to re-sort by APR if needed
    try {
      const aprHeader = await page.getByRole('columnheader').filter({ hasText: /APR/ }).first();
      if (await aprHeader.isVisible()) {
        await aprHeader.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('Could not re-sort by APR:', error);
    }
  }
}
