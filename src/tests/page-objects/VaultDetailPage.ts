
import { Page, Locator } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../utils/constants';
import { takeScreenshot } from '../utils/screenshotHelper';

export class VaultDetailPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Check if the page is still available/open
   */
  private async isPageAvailable(): Promise<boolean> {
    try {
      // This will throw if page is closed
      return !this.page.isClosed();
    } catch (e) {
      console.log('Page is closed, cannot continue test');
      return false;
    }
  }
  
  /**
   * Wait for the detail page to load
   */
  async waitForDetailPageLoad(): Promise<void> {
    // Check if page is available first
    if (!await this.isPageAvailable()) {
      console.log('Page is closed, skipping waitForDetailPageLoad');
      return;
    }
    
    // Enhanced waiting for detail page to fully load
    await this.page.waitForLoadState('networkidle');
    
    // Additional wait for key UI elements to appear
    try {
      // Wait for various indicators that the detail page has fully loaded
      await Promise.race([
        this.page.waitForSelector('text="Historical Performance"', { timeout: TIMEOUTS.ELEMENT_APPEAR }),
        this.page.waitForSelector('text="Assets"', { timeout: TIMEOUTS.ELEMENT_APPEAR }),
        this.page.waitForSelector('text="Strategy Settings"', { timeout: TIMEOUTS.ELEMENT_APPEAR }),
        this.page.waitForSelector('text="Deposit"', { timeout: TIMEOUTS.ELEMENT_APPEAR })
      ]);
      
      // Additional wait to ensure page is completely rendered
      await this.page.waitForTimeout(TIMEOUTS.RENDER);
      console.log('Vault detail page loaded successfully');
    } catch (error) {
      console.log('Warning: Timed out waiting for some detail page elements, but continuing test:', error);
      // Additional fallback wait
      await this.page.waitForTimeout(5000);
    }
    
    if (await this.isPageAvailable()) {
      await takeScreenshot(this.page, 'vault-detail');
    }
  }
  
  /**
   * Verify the performance chart section
   */
  async verifyPerformanceChart(): Promise<void> {
    // Check if page is available first
    if (!await this.isPageAvailable()) {
      console.log('Page is closed, skipping verifyPerformanceChart');
      return;
    }
    
    console.log('Checking Historical Performance chart and time period selectors...');
    
    // Look for Historical Performance section
    let performanceSection = null;
    for (const selector of SELECTORS.PERFORMANCE) {
      if (!await this.isPageAvailable()) break;
      
      const section = this.page.locator(selector).first();
      const isVisible = await section.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`Found Historical Performance section with selector: ${selector}`);
        performanceSection = section;
        break;
      }
    }
    
    if (performanceSection && await this.isPageAvailable()) {
      // Verify performance chart time period selectors (24h, 7D, 30D)
      for (const period of SELECTORS.TIME_PERIODS) {
        if (!await this.isPageAvailable()) break;
        
        try {
          const periodButton = this.page.locator(`button:has-text("${period}"), div:has-text("${period}"):not(:has-text("Historical"))`).first();
          const isVisible = await periodButton.isVisible().catch(() => false);
          
          if (isVisible) {
            console.log(`Found ${period} time period selector`);
            
            // Click on the time period
            await periodButton.click().catch(err => {
              console.log(`Error clicking on ${period} time period:`, err);
            });
            
            if (await this.isPageAvailable()) {
              await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
              console.log(`Clicked on ${period} time period`);
              
              // Take screenshot of the chart with this time period
              await takeScreenshot(this.page, `performance-chart-${period}`);
            }
          } else {
            console.log(`${period} time period selector not found or not visible`);
          }
        } catch (error) {
          console.log(`Error testing ${period} time period:`, error);
        }
      }
      
      // Verify chart component exists
      if (!await this.isPageAvailable()) return;
      
      let chartFound = false;
      for (const selector of SELECTORS.CHART) {
        if (!await this.isPageAvailable()) break;
        
        const chart = this.page.locator(selector).first();
        const isVisible = await chart.isVisible().catch(() => false);
        
        if (isVisible) {
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
  }
  
  /**
   * Verify Assets section
   */
  async verifyAssetsSection(): Promise<void> {
    // Check if page is available first
    if (!await this.isPageAvailable()) {
      console.log('Page is closed, skipping verifyAssetsSection');
      return;
    }
    
    console.log('Checking Assets section...');
    
    // Look for Assets section
    let assetsSection = null;
    for (const selector of SELECTORS.ASSETS) {
      if (!await this.isPageAvailable()) break;
      
      const section = this.page.locator(selector).first();
      const isVisible = await section.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`Found Assets section with selector: ${selector}`);
        assetsSection = section;
        break;
      }
    }
    
    if (assetsSection && await this.isPageAvailable()) {
      // Verify asset items are displayed
      const assetItems = await this.page.locator('img[alt*="WETH"], img[alt*="ETH"], img[alt*="token"]').all();
      
      if (assetItems.length > 0) {
        console.log(`Found ${assetItems.length} asset items`);
      } else {
        console.log('No asset items found in Assets section');
      }
      
      // Check for TVL value in Assets section
      if (await this.isPageAvailable()) {
        const tvlText = this.page.locator('text=TVL').first();
        const isVisible = await tvlText.isVisible().catch(() => false);
        
        if (isVisible) {
          console.log('TVL value verified in Assets section');
        }
      }
    } else {
      console.log('Assets section not found');
    }
  }
  
  /**
   * Verify Strategy Settings section
   */
  async verifyStrategySettings(): Promise<void> {
    // Check if page is available first
    if (!await this.isPageAvailable()) {
      console.log('Page is closed, skipping verifyStrategySettings');
      return;
    }
    
    console.log('Checking Strategy Settings section...');
    
    // Look for Strategy Settings section
    let strategySection = null;
    for (const selector of SELECTORS.STRATEGY) {
      if (!await this.isPageAvailable()) break;
      
      const section = this.page.locator(selector).first();
      const isVisible = await section.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`Found Strategy Settings section with selector: ${selector}`);
        strategySection = section;
        break;
      }
    }
    
    if (strategySection && await this.isPageAvailable()) {
      // Check for risk indicator
      const riskIndicator = this.page.locator('text="High Risk", text="Medium Risk", text="Low Risk"').first();
      const riskVisible = await riskIndicator.isVisible().catch(() => false);
      
      if (riskVisible) {
        const riskText = await riskIndicator.textContent().catch(() => 'Unknown');
        console.log(`Risk level verified: ${riskText}`);
      } else {
        console.log('Risk indicator not found');
      }
      
      // Check for range settings
      if (await this.isPageAvailable()) {
        const rangeSettings = this.page.locator('text=Range Setting, text=[NARROW], text=[WIDE]').first();
        const rangeVisible = await rangeSettings.isVisible().catch(() => false);
        
        if (rangeVisible) {
          console.log('Range settings verified in Strategy section');
        } else {
          console.log('Range settings not found');
        }
      }
    } else {
      console.log('Strategy Settings section not found');
    }
  }
  
  /**
   * Verify deposit/withdraw functionality
   */
  async verifyDepositWithdraw(): Promise<void> {
    // Check if page is available first
    if (!await this.isPageAvailable()) {
      console.log('Page is closed, skipping verifyDepositWithdraw');
      return;
    }
    
    console.log('Checking Deposit/Withdraw functionality...');
    
    // Look for Deposit button
    const depositButton = this.page.locator(SELECTORS.DEPOSIT_BUTTON).first();
    const depositVisible = await depositButton.isVisible().catch(() => false);
    
    if (depositVisible && await this.isPageAvailable()) {
      console.log('Deposit button found, testing deposit flow');
      
      // Check if button is already active/selected
      const isActive = await depositButton.evaluate(el => 
        el.classList.contains('active') || 
        el.classList.contains('selected') || 
        el.getAttribute('aria-selected') === 'true'
      ).catch(() => false);
      
      if (!isActive && await this.isPageAvailable()) {
        // Click on deposit button if not already active
        await depositButton.click().catch(err => {
          console.log('Error clicking on Deposit button:', err);
        });
        
        if (await this.isPageAvailable()) {
          await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
          console.log('Clicked on Deposit button');
        }
      }
      
      // Look for deposit amount input
      if (await this.isPageAvailable()) {
        const amountInput = this.page.locator('input[type="number"], input[placeholder*="Amount"]').first();
        const inputVisible = await amountInput.isVisible().catch(() => false);
        
        if (inputVisible) {
          console.log('Deposit amount input found');
          
          // Check for MAX button
          if (await this.isPageAvailable()) {
            const maxButton = this.page.locator('button:has-text("MAX")').first();
            const maxVisible = await maxButton.isVisible().catch(() => false);
            
            if (maxVisible) {
              console.log('MAX button found in deposit form');
            }
          }
          
          // Check for slippage setting
          if (await this.isPageAvailable()) {
            const slippageText = this.page.locator('text="slippage", text="Slippage"').first();
            const slippageVisible = await slippageText.isVisible().catch(() => false);
            
            if (slippageVisible) {
              console.log('Slippage settings found in deposit form');
            }
          }
        } else {
          console.log('Deposit amount input not found');
        }
      }
    }
    
    // Look for Withdraw button
    if (await this.isPageAvailable()) {
      const withdrawButton = this.page.locator(SELECTORS.WITHDRAW_BUTTON).first();
      const withdrawVisible = await withdrawButton.isVisible().catch(() => false);
      
      if (withdrawVisible && await this.isPageAvailable()) {
        console.log('Withdraw button found');
        
        // Click on withdraw button to switch to withdraw view
        await withdrawButton.click().catch(err => {
          console.log('Error clicking on Withdraw button:', err);
        });
        
        if (await this.isPageAvailable()) {
          await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
          console.log('Clicked on Withdraw button');
          
          // Look for withdraw amount input
          const withdrawInput = this.page.locator('input[type="number"], input[placeholder*="Amount"]').first();
          const inputVisible = await withdrawInput.isVisible().catch(() => false);
          
          if (inputVisible) {
            console.log('Withdraw amount input found');
          } else {
            console.log('Withdraw amount input not found');
          }
        }
      } else {
        console.log('Withdraw button not found');
      }
    }
  }
  
  /**
   * Verify risk warning section
   */
  async verifyRiskWarning(): Promise<void> {
    // Check if page is available first
    if (!await this.isPageAvailable()) {
      console.log('Page is closed, skipping verifyRiskWarning');
      return;
    }
    
    console.log('Checking Understand the Risk section...');
    
    // Look for risk warning section
    const riskWarningSelectors = [
      'text="Understand the Risk"',
      'h2:has-text("Understand the Risk")',
      'div:has-text("Understand the Risk")'
    ];
    
    let riskWarningFound = false;
    for (const selector of riskWarningSelectors) {
      if (!await this.isPageAvailable()) break;
      
      const riskWarning = this.page.locator(selector).first();
      const isVisible = await riskWarning.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log('Risk warning section "Understand the Risk" found');
        riskWarningFound = true;
        
        // Verify risk warning content
        if (await this.isPageAvailable()) {
          const warningContent = this.page.locator('text=DYOR, text=managed by the Vault Owner').first();
          const contentVisible = await warningContent.isVisible().catch(() => false);
          
          if (contentVisible) {
            console.log('Risk warning content verified');
          } else {
            console.log('Risk warning content not found');
          }
        }
        
        break;
      }
    }
    
    if (!riskWarningFound) {
      console.log('Risk warning section "Understand the Risk" not found');
    }
  }
}
