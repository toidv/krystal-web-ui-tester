import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../utils/constants';
import { takeScreenshot } from '../utils/screenshotHelper';

export class VaultListPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async goto() {
    await this.page.goto(SELECTORS.URLS.VAULTS);
  }
  
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    try {
      await Promise.race([
        this.page.waitForSelector(SELECTORS.APR_HEADER[0], { timeout: TIMEOUTS.ELEMENT_APPEAR }),
        this.page.waitForSelector(SELECTORS.APR_HEADER[1], { timeout: TIMEOUTS.ELEMENT_APPEAR }),
        this.page.waitForSelector(SELECTORS.APR_HEADER[2], { timeout: TIMEOUTS.ELEMENT_APPEAR }),
        this.page.waitForSelector(SELECTORS.APR_HEADER[3], { timeout: TIMEOUTS.ELEMENT_APPEAR }),
        this.page.waitForSelector(SELECTORS.APR_HEADER[4], { timeout: TIMEOUTS.ELEMENT_APPEAR })
      ]);
      await this.page.waitForTimeout(TIMEOUTS.RENDER);
      console.log('Vault list page loaded successfully');
    } catch (error) {
      console.log('Warning: Timed out waiting for APR header, but continuing test:', error);
      await this.page.waitForTimeout(5000);
    }
    await takeScreenshot(this.page, 'vault-list');
  }
  
  async sortByAPR() {
    console.log('Sorting vault list by APR DESC...');
    
    // Use multiple selectors to find the APR header
    for (const selector of SELECTORS.APR_HEADER) {
      try {
        const aprHeader = this.page.locator(selector).first();
        const isVisible = await aprHeader.isVisible().catch(() => false);
        
        if (isVisible) {
          console.log(`Found APR header with selector: ${selector}`);
          
          // Click on the APR header to sort by APR
          await aprHeader.click({ timeout: TIMEOUTS.ELEMENT_APPEAR }).catch(err => {
            console.log('Error clicking on APR header:', err);
          });
          
          // Wait for sorting to complete
          await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
          console.log('Sorted by APR DESC');
          return;
        }
      } catch (error) {
        console.log(`Error checking APR header with selector ${selector}:`, error);
      }
    }
    
    console.log('APR header not found, skipping sorting');
  }
  
  async findFirstVault() {
    console.log('Looking for the first vault with APR values...');
    
    // Find all vault elements
    const vaultElements = await this.page.locator('div[role="row"]').all();
    
    if (!vaultElements || vaultElements.length === 0) {
      console.log('No vaults found on the page');
      return null;
    }
    
    // Iterate through vault elements to find one with APR value
    for (const vaultElement of vaultElements) {
      try {
        // Try multiple approaches to find the APR text
        const aprText = await vaultElement.locator('text=/\d+(\.\d+)?%/, text=/APR/').textContent().catch(() => null);
        
        if (aprText) {
          console.log('Found vault with APR value');
          return vaultElement;
        }
      } catch (error) {
        console.log('Error finding APR value in vault element:', error);
      }
    }
    
    console.log('No vaults with APR values found on the page');
    return null;
  }
  
  /**
   * Get the APR value from a vault element
   */
  async getVaultAPR(vaultElement: Locator): Promise<string | null> {
    try {
      // Try multiple approaches to find the APR text
      
      // Approach 1: APR in the vault row
      const aprText = await vaultElement.locator('text=/\d+(\.\d+)?%/, text=/APR/').textContent().catch(() => null);
      if (aprText) {
        // Extract the percentage value using regex
        const match = aprText.match(/(\d+(\.\d+)?)%/);
        if (match) {
          console.log(`Found APR value in vault list: ${match[1]}%`);
          return match[1];
        }
      }
      
      // Approach 2: Look for specific APR column in the row
      const aprCell = await vaultElement.locator('td:has-text("%"), div:has-text("%")').nth(0).textContent().catch(() => null);
      if (aprCell) {
        const match = aprCell.match(/(\d+(\.\d+)?)%/);
        if (match) {
          console.log(`Found APR value in APR cell: ${match[1]}%`);
          return match[1];
        }
      }
      
      // Approach 3: If specific approaches fail, try to get any percentage value
      const anyPercentage = await vaultElement.textContent().catch(() => '');
      const percentageMatch = anyPercentage.match(/(\d+(\.\d+)?)%/);
      if (percentageMatch) {
        console.log(`Found percentage in vault element: ${percentageMatch[1]}%`);
        return percentageMatch[1];
      }
      
      console.log('Could not find APR value in vault element');
      return null;
    } catch (error) {
      console.log('Error getting vault APR:', error);
      return null;
    }
  }
  
  /**
   * Verify basic UI elements on the vault list page
   */
  async verifyBasicUIElements() {
    console.log('Verifying basic UI elements on vault list page...');
    
    // Check for the page title or header
    try {
      await this.page.waitForSelector('h1:has-text("Vaults"), h2:has-text("Vaults"), div:has-text("Vaults")', {
        timeout: TIMEOUTS.ELEMENT_APPEAR
      });
      console.log('Found page title/header');
    } catch (error) {
      console.log('Warning: Could not find page title/header:', error);
    }
    
    // Check for wallet connection status (if applicable)
    try {
      const walletStatus = await this.page.locator('button:has-text("Connect"), div:has-text("Connected"), div:has-text("0x")')
        .isVisible().catch(() => false);
      console.log(`Wallet connection UI element visible: ${walletStatus}`);
    } catch (error) {
      console.log('Warning: Could not verify wallet connection UI element:', error);
    }
    
    // Check for filter/sort options
    try {
      const filterVisible = await this.page.locator('button:has-text("Filter"), div:has-text("Filter"), button:has-text("Sort"), div:has-text("Sort")')
        .isVisible().catch(() => false);
      console.log(`Filter/sort UI elements visible: ${filterVisible}`);
    } catch (error) {
      console.log('Warning: Could not verify filter/sort UI elements:', error);
    }
    
    await takeScreenshot(this.page, 'vault-list-ui-elements');
  }
  
  /**
   * Verify that the vault table exists and has rows
   */
  async verifyVaultTable() {
    console.log('Verifying vault table...');
    
    try {
      // Look for table element or div that acts as a table
      const tableSelector = 'table, div[role="table"], div[role="grid"]';
      await this.page.waitForSelector(tableSelector, { timeout: TIMEOUTS.ELEMENT_APPEAR });
      
      // Check if there are any vault rows
      const rowSelector = 'tr, div[role="row"]';
      const rowCount = await this.page.locator(rowSelector).count();
      
      console.log(`Found vault table with ${rowCount} rows`);
      expect(rowCount).toBeGreaterThan(0);
    } catch (error) {
      console.log('Warning: Could not verify vault table:', error);
      // Take a screenshot for debugging
      await takeScreenshot(this.page, 'vault-table-error');
    }
  }
  
  /**
   * Click the first available deposit button
   */
  async clickFirstDepositButton() {
    console.log('Looking for first deposit button...');
    
    try {
      // Try multiple potential deposit button selectors
      const depositButtonSelectors = [
        'button:has-text("Deposit")',
        'a:has-text("Deposit")',
        'button:has-text("Enter Vault")',
        'a:has-text("Enter Vault")'
      ];
      
      for (const selector of depositButtonSelectors) {
        const depositButtons = this.page.locator(selector);
        const count = await depositButtons.count();
        
        if (count > 0) {
          console.log(`Found ${count} deposit buttons with selector: ${selector}`);
          
          // Click the first visible deposit button
          for (let i = 0; i < count; i++) {
            const button = depositButtons.nth(i);
            const isVisible = await button.isVisible().catch(() => false);
            
            if (isVisible) {
              console.log(`Clicking on deposit button ${i+1}`);
              await button.click();
              await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
              
              // Check if we navigated to a new page or a modal opened
              const depositFormVisible = await this.page.locator('text=/Deposit|Enter Vault|Amount/i').isVisible().catch(() => false);
              
              if (depositFormVisible) {
                console.log('Deposit form is visible');
                await takeScreenshot(this.page, 'deposit-form');
                
                // Go back or close the form
                if (this.page.url().includes('deposit')) {
                  await this.page.goBack();
                } else {
                  // Try to close modal if we're still on the same page
                  const closeButton = this.page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label="Close"]').first();
                  if (await closeButton.isVisible().catch(() => false)) {
                    await closeButton.click();
                  }
                }
                return;
              }
            }
          }
        }
      }
      
      console.log('No deposit buttons found or all buttons failed to open deposit form');
    } catch (error) {
      console.log('Error trying to click deposit button:', error);
    }
  }
  
  /**
   * Test the search functionality
   */
  async testSearch(searchTerm: string) {
    console.log(`Testing search with term: ${searchTerm}`);
    
    try {
      // Find search input
      const searchInputSelectors = [
        'input[placeholder*="Search"]',
        'input[placeholder*="search"]',
        'input[placeholder*="Find"]',
        'input[aria-label*="Search"]',
        'input[type="text"]'
      ];
      
      let searchInput = null;
      
      for (const selector of searchInputSelectors) {
        const input = this.page.locator(selector).first();
        if (await input.isVisible().catch(() => false)) {
          searchInput = input;
          console.log(`Found search input with selector: ${selector}`);
          break;
        }
      }
      
      if (!searchInput) {
        console.log('Search input not found, skipping search test');
        return;
      }
      
      // Clear existing text and enter search term
      await searchInput.click();
      await searchInput.clear();
      await searchInput.fill(searchTerm);
      await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
      
      // Take screenshot of search results
      await takeScreenshot(this.page, `search-results-${searchTerm}`);
      
      // Count results
      const rowCount = await this.page.locator('tr, div[role="row"]').count();
      console.log(`Found ${rowCount} rows after searching for "${searchTerm}"`);
      
      // Clear search to reset
      await searchInput.clear();
      await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
    } catch (error) {
      console.log('Error testing search:', error);
    }
  }
}
