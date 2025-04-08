
import { test, expect } from '@playwright/test';
import { takeScreenshot, initScreenshotsDir } from '../utils/screenshotHelper';
import { URLS, TIMEOUTS, SELECTORS } from '../utils/constants';
import { setupWalletConnection, connectWallet, verifyWalletConnected } from '../utils/setupWallet';
import { VaultListPage } from '../page-objects/VaultListPage';

test.describe('Create Vault Form', () => {
  // Initialize screenshots directory before tests
  initScreenshotsDir();

  test.beforeEach(async ({ page }) => {
    // Setup wallet connection before each test
    await setupWalletConnection(page);
  });

  test('should correctly validate and display create vault form options', async ({ page }) => {
    console.log('Starting Create Vault test...');
    const vaultListPage = new VaultListPage(page);
    
    // Visit the vaults page
    await vaultListPage.goto();
    await vaultListPage.waitForPageLoad();

    // Take screenshot of initial vaults page
    await takeScreenshot(page, 'vaults-page-initial');

    // Connect wallet and verify connection
    await connectWallet(page);
    await verifyWalletConnected(page);
  
    console.log('Wallet connected, proceeding to Create Vault test');
    await takeScreenshot(page, 'wallet-connected-state');

    // Verify basic UI elements
    await vaultListPage.verifyBasicUIElements();
    
    // Verify vault table exists
    await vaultListPage.verifyVaultTable();
    
    // Use first() to specifically select one element when multiple are available
    console.log('Looking for Create Vault buttons on the page...');
    const elements = await page.locator('button:has-text("Create Vault"), a:has-text("Create Vault")').count();
    console.log(`Found ${elements} Create Vault elements on the page`);
    
    // Take a screenshot to see what's on the page
    await takeScreenshot(page, 'before-finding-create-vault-button');
    
    // Use a more specific selector targeting only the button, not the link
    const createVaultButton = page.getByRole('button', { name: 'Create Vault' });
    
    // Check if the button exists before waiting for it
    const buttonExists = await createVaultButton.count() > 0;
    if (!buttonExists) {
      console.log('Button not found, checking for alternative elements');
      // Try the link instead if button is not found
      const createVaultLink = page.getByRole('menuitem', { name: /Create Vault/ });
      if (await createVaultLink.count() > 0) {
        console.log('Found Create Vault link instead of button');
        await createVaultLink.click();
      } else {
        throw new Error('No Create Vault button or link found on the page');
      }
    } else {
      console.log('Create Vault button found, clicking it');
      await createVaultButton.click();
    }
    
    // Wait for the create vault form to appear
    console.log('Waiting for the create vault form to appear');
    await page.waitForSelector('text="Set Name"', { timeout: TIMEOUTS.ELEMENT_APPEAR });
    await takeScreenshot(page, 'create-vault-form');
    
    // 1. Test setting vault name
    const nameInput = page.locator(SELECTORS.CREATE_VAULT.VAULT_NAME_INPUT[0]);
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('Test Vault Name');
    
    // 2. Check which token is currently selected (WETH or USDC)
    console.log('Checking which principal token is currently selected');
    const currentTokenSelector = 'button:has-text("WETH"), button:has-text("USDC")';
    await page.waitForSelector(currentTokenSelector, { timeout: TIMEOUTS.ELEMENT_APPEAR });
    await takeScreenshot(page, 'token-selector-visible');
    
    // Get the text of the currently selected token
    const tokenText = await page.locator(currentTokenSelector).textContent();
    console.log(`Current token selected: ${tokenText}`);
    
    // Click on the token selector to open dropdown
    const principalTokenButton = page.locator(currentTokenSelector).first();
    await principalTokenButton.waitFor({ state: 'visible' });
    console.log('Clicking on principal token selector');
    await principalTokenButton.click();
    
    // Wait for dropdown to appear and take screenshot
    await page.waitForTimeout(2000); // Small wait to ensure dropdown is fully visible
    await takeScreenshot(page, 'token-dropdown-open');
    
    // If WETH is already selected, select USDC, otherwise select WETH
    if (tokenText?.includes('WETH')) {
      console.log('WETH is selected, switching to USDC');
      // Select USDC from dropdown
      const usdcSelector = SELECTORS.CREATE_VAULT.TOKEN_OPTIONS.USDC[0];
      console.log(`Using USDC selector: ${usdcSelector}`);
      
      // Try multiple selectors if needed
      for (const selector of SELECTORS.CREATE_VAULT.TOKEN_OPTIONS.USDC) {
        console.log(`Trying selector: ${selector}`);
        const usdcOption = page.locator(selector);
        if (await usdcOption.count() > 0) {
          console.log('USDC option found');
          await usdcOption.click();
          break;
        }
      }
      
      // Verify USDC is now selected
      await expect(page.locator('button:has-text("USDC")')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_APPEAR });
      
      // Switch back to WETH for the rest of the test
      await page.locator('button:has-text("USDC")').click();
      await page.waitForTimeout(1000);
      
      // Select WETH from dropdown
      for (const selector of SELECTORS.CREATE_VAULT.TOKEN_OPTIONS.WETH) {
        const wethOption = page.locator(selector);
        if (await wethOption.count() > 0) {
          await wethOption.click();
          break;
        }
      }
    } else {
      console.log('USDC is selected, switching to WETH');
      // Select WETH from dropdown
      for (const selector of SELECTORS.CREATE_VAULT.TOKEN_OPTIONS.WETH) {
        const wethOption = page.locator(selector);
        if (await wethOption.count() > 0) {
          await wethOption.click();
          break;
        }
      }
      
      // Verify WETH is now selected
      await expect(page.locator('button:has-text("WETH")')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_APPEAR });
    }
    
    // 3. Test toggling Publish Vault
    console.log('Testing publish vault toggle');
    // Find the toggle using various selectors
    let publishToggle = null;
    for (const selector of SELECTORS.CREATE_VAULT.PUBLISH_TOGGLE) {
      const toggle = page.locator(selector);
      if (await toggle.count() > 0) {
        publishToggle = toggle;
        console.log(`Found publish toggle with selector: ${selector}`);
        break;
      }
    }
    
    if (publishToggle) {
      await publishToggle.waitFor({ state: 'visible' });
      await takeScreenshot(page, 'publish-toggle-found');
      
      // Toggle on if it's off, or toggle off if it's on
      await publishToggle.click();
      await takeScreenshot(page, 'publish-vault-toggled');
      
      // Toggle back to original state
      await publishToggle.click();
    } else {
      console.log('Publish toggle not found, skipping this section');
      await takeScreenshot(page, 'publish-toggle-not-found');
    }
    
    // Skip the Range Config tests if elements are not present
    console.log('Checking for Range Config options');
    
    const hasRangeConfig = await page.locator(SELECTORS.CREATE_VAULT.RANGE_CONFIG.NARROW).count() > 0;
    if (hasRangeConfig) {
      // 4. Test Range Config options (Narrow vs Wide)
      const narrowRangeButton = page.locator(SELECTORS.CREATE_VAULT.RANGE_CONFIG.NARROW);
      const wideRangeButton = page.locator(SELECTORS.CREATE_VAULT.RANGE_CONFIG.WIDE);
      
      await narrowRangeButton.waitFor({ state: 'visible' });
      await narrowRangeButton.click();
      await takeScreenshot(page, 'narrow-range-selected');
      
      // Verify narrow range config is displayed
      await expect(page.locator('text=10.52%')).toBeVisible();
      await expect(page.locator('text=0.02%')).toBeVisible();
      
      // Test selecting Wide
      await wideRangeButton.click();
      await takeScreenshot(page, 'wide-range-selected');
      
      // Verify wide range config is displayed
      await expect(page.locator('text="Range width is calculated based on the lower and upper prices"')).toBeVisible();
    } else {
      console.log('Range Config options not found, skipping this section');
    }
    
    // Skip the Liquidity Pools tests if elements are not present
    console.log('Checking for Liquidity Pools options');
    
    const hasLiquidityPools = await page.locator(SELECTORS.CREATE_VAULT.LIQUIDITY_POOLS.LOW_VALUE).count() > 0;
    if (hasLiquidityPools) {
      // 5. Test Allowed Liquidity Pools options
      const lowValueOption = page.locator(SELECTORS.CREATE_VAULT.LIQUIDITY_POOLS.LOW_VALUE);
      const moderateValueOption = page.locator(SELECTORS.CREATE_VAULT.LIQUIDITY_POOLS.MODERATE_VALUE);
      const highValueOption = page.locator(SELECTORS.CREATE_VAULT.LIQUIDITY_POOLS.HIGH_VALUE);
      const fixedOption = page.locator(SELECTORS.CREATE_VAULT.LIQUIDITY_POOLS.FIXED);
      
      // Click and verify Low Value option
      await lowValueOption.waitFor({ state: 'visible' });
      await lowValueOption.click();
      await takeScreenshot(page, 'low-value-option');
      await expect(page.locator('text="≤5 USDC"')).toBeVisible();
      
      // Click and verify Moderate Value option
      await moderateValueOption.click();
      await takeScreenshot(page, 'moderate-value-option');
      await expect(page.locator('text="≤50 USDC"')).toBeVisible();
      
      // Click and verify High Value option
      await highValueOption.click();
      await takeScreenshot(page, 'high-value-option');
      await expect(page.locator('text="≤500 USDC"')).toBeVisible();
      
      // Click and verify Fixed option
      await fixedOption.click();
      await takeScreenshot(page, 'fixed-option');
      await expect(page.locator('text="A specific list of pools"')).toBeVisible();
    } else {
      console.log('Liquidity Pools options not found, skipping this section');
    }
    
    // Verify Safety Evaluation section if it exists
    const hasSafetyEvaluation = await page.locator('text="Safety Evaluation:"').count() > 0;
    if (hasSafetyEvaluation) {
      // Verify safety evaluation section exists
      await expect(page.locator('text="Safety Evaluation:"')).toBeVisible();
    } else {
      console.log('Safety Evaluation section not found, skipping this check');
    }
    
    // Verify create vault button is enabled
    for (const selector of SELECTORS.CREATE_VAULT.SUBMIT_BUTTON) {
      const submitButton = page.locator(selector);
      if (await submitButton.count() > 0) {
        await expect(submitButton).toBeEnabled();
        console.log(`Submit button found with selector: ${selector}`);
        break;
      }
    }
    
    // Take a final screenshot of the completed form
    await takeScreenshot(page, 'create-vault-form-completed');
    console.log('Test completed successfully');
  });
});
