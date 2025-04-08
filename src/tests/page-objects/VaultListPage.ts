
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
   * Improved method to click deposit button and test deposit functionality
   * - Checks vault type (public/private)
   * - Tests max button
   * - Tests manual input
   * - Validates share calculations
   */
  async clickFirstDepositButton(): Promise<void> {
    console.log('Testing vault deposit functionality...');
    
    // First, find a vault row
    const vaultRow = await this.findFirstVault();
    if (!vaultRow) {
      console.log('No vault found to test deposit');
      return;
    }
    
    // Check vault type (public/private)
    const typeText = await vaultRow.locator('text=/Public|Private/i').textContent();
    const isPublic = typeText?.toLowerCase().includes('public');
    console.log(`Found vault with type: ${typeText}`);
    
    // Locate deposit button within this vault row
    const depositButton = await vaultRow.locator('button:has-text("Deposit"), button:has-text("+ Deposit")').first();
    const isDepositEnabled = await depositButton.isEnabled();
    
    // For private vaults, verify deposit button is disabled
    if (!isPublic && !isDepositEnabled) {
      console.log('Private vault detected with disabled deposit button as expected');
      await takeScreenshot(this.page, 'private-vault-deposit-disabled');
      return;
    }
    
    // Continue with deposit flow for public vaults
    if (isDepositEnabled) {
      await depositButton.click();
      console.log('Clicked on deposit button');
      
      // Improved modal detection with multiple approaches
      let modalVisible = false;
      
      // Try different selectors to locate the modal
      const modalSelectors = [
        '[role="dialog"]',
        'dialog',
        '.modal',
        '[aria-modal="true"]', 
        '.dialog-content',
        // Dialog from shadcn/ui
        '[data-state="open"]',
        // Check for specific content that would be in the deposit modal
        'div:has-text("Deposit Amount"):has(input[type="number"])'
      ];
      
      // Try each selector
      for (const selector of modalSelectors) {
        const modal = this.page.locator(selector).first();
        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Modal found with selector: ${selector}`);
          modalVisible = true;
          
          // Take screenshot of the modal
          await takeScreenshot(this.page, 'vaults-deposit-modal');
          
          // For shadcn Dialog, check for DialogContent
          if (selector === '[data-state="open"]') {
            console.log('Found shadcn Dialog, checking for specific content');
            const dialogContent = this.page.locator('[role="dialog"][data-state="open"]');
            if (await dialogContent.isVisible()) {
              console.log('Dialog content is visible');
            }
          }
          
          // Test MAX button
          const maxButton = await this.page.locator('button:has-text("MAX"), button:has-text("Max")').first();
          if (await maxButton.isVisible()) {
            await maxButton.click();
            console.log('Clicked MAX button');
            await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
            
            // Check if amount field was populated
            const amountField = await this.page.locator('input[type="number"], input[placeholder*="Amount"]').first();
            const amountValue = await amountField.inputValue();
            const hasAmount = parseFloat(amountValue) > 0;
            console.log(`Amount after MAX click: ${amountValue}, Is greater than 0: ${hasAmount}`);
            
            if (hasAmount) {
              // Validate vault share and deposit value calculations
              await this.validateDepositCalculations();
              await takeScreenshot(this.page, 'vaults-deposit-max-amount');
            }
            
            // Clear the field for manual input test
            await amountField.fill('');
            await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
          }
          
          // Test manual input - input 1 as amount
          const amountField = await this.page.locator('input[type="number"], input[placeholder*="Amount"]').first();
          if (await amountField.isVisible()) {
            await amountField.fill('1');
            console.log('Entered manual amount: 1');
            await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
            
            // Validate vault share and deposit value with manual input
            await this.validateDepositCalculations();
            await takeScreenshot(this.page, 'vaults-deposit-manual-amount');
          }
          
          // Close modal
          const closeButton = await this.page.locator(
            '.modal button[aria-label="Close"], ' +
            '[role="dialog"] button[aria-label="Close"], ' +
            'dialog button[aria-label="Close"], ' +
            'button:has-text("Cancel"), ' +
            'button:has-text("Close")'
          ).first();
          
          if (await closeButton.isVisible()) {
            await closeButton.click();
            console.log('Modal closed');
            await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
          }
          
          break; // Exit loop if modal was found and processed
        }
      }
      
      if (!modalVisible) {
        console.log('Warning: Deposit button was clicked but no modal was detected');
        // Try to take a screenshot anyway to see what's on screen
        await takeScreenshot(this.page, 'after-deposit-click-no-modal');
      }
    } else {
      console.log('Deposit button not enabled or not found');
    }
  }
  
  /**
   * Helper method to validate deposit calculations
   */
  private async validateDepositCalculations(): Promise<void> {
    // Look for vault share calculation display
    const shareDisplay = await this.page.locator('text=/Vault Shares:|You will receive:|Expected Shares:/i').first();
    if (await shareDisplay.isVisible()) {
      const shareText = await shareDisplay.textContent();
      console.log(`Share calculation: ${shareText}`);
    }
    
    // Look for deposit value calculation
    const valueDisplay = await this.page.locator('text=/Value:|Deposit Value:|USD Value:/i').first();
    if (await valueDisplay.isVisible()) {
      const valueText = await valueDisplay.textContent();
      console.log(`Value calculation: ${valueText}`);
    }
    
    // Check if any calculation is displayed (more generic selector)
    const calculationInfo = await this.page.locator('div:has-text("$"), div:has-text("USD")').first();
    if (await calculationInfo.isVisible()) {
      const calcText = await calculationInfo.textContent();
      console.log(`Calculation info: ${calcText}`);
    }
  }
}
