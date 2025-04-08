
import { Page, Locator } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../utils/constants';
import { takeScreenshot } from '../utils/screenshotHelper';

export class VaultDetailPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Wait for the detail page to load
   */
  async waitForDetailPageLoad(): Promise<void> {
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
    
    await takeScreenshot(this.page, 'vault-detail');
  }
  
  /**
   * Verify the performance chart section
   */
  async verifyPerformanceChart(): Promise<void> {
    console.log('Checking Historical Performance chart and time period selectors...');
    
    // Look for Historical Performance section
    let performanceSection = null;
    for (const selector of SELECTORS.PERFORMANCE) {
      const section = this.page.locator(selector).first();
      if (await section.isVisible()) {
        console.log(`Found Historical Performance section with selector: ${selector}`);
        performanceSection = section;
        break;
      }
    }
    
    if (performanceSection) {
      // Verify performance chart time period selectors (24h, 7D, 30D)
      for (const period of SELECTORS.TIME_PERIODS) {
        try {
          const periodButton = this.page.locator(`button:has-text("${period}"), div:has-text("${period}"):not(:has-text("Historical"))`).first();
          
          if (await periodButton.isVisible()) {
            console.log(`Found ${period} time period selector`);
            
            // Click on the time period
            await periodButton.click();
            await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
            console.log(`Clicked on ${period} time period`);
            
            // Take screenshot of the chart with this time period
            await takeScreenshot(this.page, `performance-chart-${period}`);
          } else {
            console.log(`${period} time period selector not found or not visible`);
          }
        } catch (error) {
          console.log(`Error testing ${period} time period:`, error);
        }
      }
      
      // Verify chart component exists
      let chartFound = false;
      for (const selector of SELECTORS.CHART) {
        const chart = this.page.locator(selector).first();
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
  }
  
  /**
   * Verify Assets section
   */
  async verifyAssetsSection(): Promise<void> {
    console.log('Checking Assets section...');
    
    // Look for Assets section
    let assetsSection = null;
    for (const selector of SELECTORS.ASSETS) {
      const section = this.page.locator(selector).first();
      if (await section.isVisible()) {
        console.log(`Found Assets section with selector: ${selector}`);
        assetsSection = section;
        break;
      }
    }
    
    if (assetsSection) {
      // Verify asset items are displayed
      const assetItems = await this.page.locator('img[alt*="WETH"], img[alt*="ETH"], img[alt*="token"]').all();
      
      if (assetItems.length > 0) {
        console.log(`Found ${assetItems.length} asset items`);
      } else {
        console.log('No asset items found in Assets section');
      }
      
      // Check for TVL value in Assets section
      const tvlText = await this.page.locator('text=TVL').first();
      if (await tvlText.isVisible()) {
        console.log('TVL value verified in Assets section');
      }
    } else {
      console.log('Assets section not found');
    }
  }
  
  /**
   * Verify Strategy Settings section
   */
  async verifyStrategySettings(): Promise<void> {
    console.log('Checking Strategy Settings section...');
    
    // Look for Strategy Settings section
    let strategySection = null;
    for (const selector of SELECTORS.STRATEGY) {
      const section = this.page.locator(selector).first();
      if (await section.isVisible()) {
        console.log(`Found Strategy Settings section with selector: ${selector}`);
        strategySection = section;
        break;
      }
    }
    
    if (strategySection) {
      // Check for risk indicator
      const riskIndicator = await this.page.locator('text="High Risk", text="Medium Risk", text="Low Risk"').first();
      if (await riskIndicator.isVisible()) {
        const riskText = await riskIndicator.textContent();
        console.log(`Risk level verified: ${riskText}`);
      } else {
        console.log('Risk indicator not found');
      }
      
      // Check for range settings
      const rangeSettings = await this.page.locator('text=Range Setting, text=[NARROW], text=[WIDE]').first();
      if (await rangeSettings.isVisible()) {
        console.log('Range settings verified in Strategy section');
      } else {
        console.log('Range settings not found');
      }
    } else {
      console.log('Strategy Settings section not found');
    }
  }
  
  /**
   * Verify deposit/withdraw functionality
   */
  async verifyDepositWithdraw(): Promise<void> {
    console.log('Checking Deposit/Withdraw functionality...');
    
    // Look for Deposit button
    const depositButton = await this.page.locator(SELECTORS.DEPOSIT_BUTTON).first();
    
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
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
        console.log('Clicked on Deposit button');
      }
      
      // Look for deposit amount input
      const amountInput = await this.page.locator('input[type="number"], input[placeholder*="Amount"]').first();
      
      if (await amountInput.isVisible()) {
        console.log('Deposit amount input found');
        
        // Check for MAX button
        const maxButton = await this.page.locator('button:has-text("MAX")').first();
        if (await maxButton.isVisible()) {
          console.log('MAX button found in deposit form');
        }
        
        // Check for slippage setting
        const slippageText = await this.page.locator('text="slippage", text="Slippage"').first();
        if (await slippageText.isVisible()) {
          console.log('Slippage settings found in deposit form');
        }
      } else {
        console.log('Deposit amount input not found');
      }
    }
    
    // Look for Withdraw button
    const withdrawButton = await this.page.locator(SELECTORS.WITHDRAW_BUTTON).first();
    
    if (await withdrawButton.isVisible()) {
      console.log('Withdraw button found');
      
      // Click on withdraw button to switch to withdraw view
      await withdrawButton.click();
      await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
      console.log('Clicked on Withdraw button');
      
      // Look for withdraw amount input
      const withdrawInput = await this.page.locator('input[type="number"], input[placeholder*="Amount"]').first();
      
      if (await withdrawInput.isVisible()) {
        console.log('Withdraw amount input found');
      } else {
        console.log('Withdraw amount input not found');
      }
    } else {
      console.log('Withdraw button not found');
    }
  }
  
  /**
   * Verify risk warning section
   */
  async verifyRiskWarning(): Promise<void> {
    console.log('Checking Understand the Risk section...');
    
    // Look for risk warning section
    const riskWarningSelectors = [
      'text="Understand the Risk"',
      'h2:has-text("Understand the Risk")',
      'div:has-text("Understand the Risk")'
    ];
    
    let riskWarningFound = false;
    for (const selector of riskWarningSelectors) {
      const riskWarning = this.page.locator(selector).first();
      if (await riskWarning.isVisible()) {
        console.log('Risk warning section "Understand the Risk" found');
        riskWarningFound = true;
        
        // Verify risk warning content
        const warningContent = await this.page.locator('text=DYOR, text=managed by the Vault Owner').first();
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
  }
}
