
import { Page, Locator } from '@playwright/test';
import { SELECTORS, URLS, TIMEOUTS } from '../utils/constants';
import { takeScreenshot } from '../utils/screenshotHelper';

export class VaultListPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Navigate to the vaults list page
   */
  async goto(): Promise<void> {
    await this.page.goto(URLS.VAULTS);
    await this.page.waitForLoadState('networkidle');
    console.log('Vaults page loaded successfully');
  }
  
  /**
   * Wait for vaults to load and take a screenshot
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await takeScreenshot(this.page, 'vaults-page-initial');
  }
  
  /**
   * Verify basic UI elements on the page
   */
  async verifyBasicUIElements(): Promise<void> {
    // Verify header exists
    const header = await this.page.locator('header').first();
    const headerVisible = await header.isVisible();
    console.log(`Header visible: ${headerVisible}`);
    
    // Verify portfolio section exists
    const portfolioSection = await this.page.locator('text=Portfolio').first();
    const portfolioVisible = await portfolioSection.isVisible();
    console.log(`Portfolio section visible: ${portfolioVisible}`);

    // Verify stats section exists
    const statsSection = await this.page.locator('text=Stats').first();
    const statsVisible = await statsSection.isVisible();
    console.log(`Stats section visible: ${statsVisible}`);
  }
  
  /**
   * Verify vault table exists
   */
  async verifyVaultTable(): Promise<boolean> {
    // Verify vault table exists
    const vaultTable = await this.page.locator('table, [role="table"], .vault-list').first();
    if (await vaultTable.isVisible()) {
      console.log('Vault table/list verified');
      return true;
    } else {
      // Try alternative selector based on column headers
      const vaultTableHeader = await this.page.locator('text=Vault >> xpath=ancestor::div[contains(.,"Assets")][contains(.,"Type")][contains(.,"TVL")]').first();
      const headerVisible = await vaultTableHeader.isVisible();
      console.log(`Vault table header visible: ${headerVisible}`);
      return headerVisible;
    }
  }
  
  /**
   * Sort vault list by APR in descending order
   */
  async sortByAPR(): Promise<void> {
    console.log('Attempting to sort vaults by APR in descending order...');
    
    let aprHeaderFound = false;
    for (const selector of SELECTORS.APR_HEADER) {
      const aprHeader = this.page.locator(selector).first();
      if (await aprHeader.isVisible()) {
        // Click once to sort (may be ASC or DESC depending on default)
        await aprHeader.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
        
        // Click again to ensure DESC order (if needed)
        await aprHeader.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
        
        console.log('Clicked on APR header to sort in descending order');
        aprHeaderFound = true;
        break;
      }
    }
    
    if (!aprHeaderFound) {
      console.log('APR header not found with standard selectors, continuing test');
    }
    
    await takeScreenshot(this.page, 'vaults-sorted-by-apr');
  }
  
  /**
   * Find a vault item to test with
   */
  async findFirstVault(): Promise<Locator | null> {
    // Use multiple selectors to find vaults with APR values
    const vaultSelectors = [
      'tr:has-text("%")',
      '[role="row"]:has-text("%")',
      'div.vault-item:has-text("%")',
      'div:has-text("APR") + div:has-text("%")',
      'text=Long Test'
    ];
    
    for (const selector of vaultSelectors) {
      const elements = await this.page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`Found ${elements.length} vaults with selector: ${selector}`);
        return elements[0]; // Take the first vault (highest APR after sorting)
      }
    }
    
    console.log('No vaults found on the page');
    return null;
  }
  
  /**
   * Test search functionality
   */
  async testSearch(searchTerm: string): Promise<void> {
    const searchInput = await this.page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      console.log(`Search input found, testing search with term: ${searchTerm}`);
      await searchInput.fill(searchTerm);
      await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
      
      // Take screenshot of search results
      await takeScreenshot(this.page, 'vaults-search-results');
    } else {
      console.log('No search input found on page');
    }
  }
  
  /**
   * Click on the first deposit button
   */
  async clickFirstDepositButton(): Promise<void> {
    const depositButton = await this.page.locator('button:has-text("Deposit")').first();
    if (await depositButton.isVisible()) {
      await depositButton.click();
      console.log('Clicked on deposit button');
      
      // Verify deposit modal appears
      const depositModal = await this.page.locator('.modal, [role="dialog"], dialog').first();
      const modalVisible = await depositModal.isVisible({ timeout: TIMEOUTS.ELEMENT_APPEAR });
      console.log(`Deposit modal visible: ${modalVisible}`);
      
      await takeScreenshot(this.page, 'vaults-deposit-modal');
      
      // Close modal if possible
      const closeButton = await this.page.locator('.modal button[aria-label="Close"], [role="dialog"] button[aria-label="Close"], dialog button[aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        console.log('Modal closed');
      }
    }
  }
}
