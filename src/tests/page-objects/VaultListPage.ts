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
}
