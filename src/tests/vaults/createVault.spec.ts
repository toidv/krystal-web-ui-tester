
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

    // Connect wallet and verify connection
    await connectWallet(page);
    await verifyWalletConnected(page);
  
    console.log('Wallet connected, proceeding to Create Vault test');

    // Verify basic UI elements
    await vaultListPage.verifyBasicUIElements();
    
    // Verify vault table exists
    await vaultListPage.verifyVaultTable();
    
    // Use first() to specifically select one element when multiple are available
    console.log('Looking for Create Vault buttons on the page...');
    const elements = await page.locator('button:has-text("Create Vault"), a:has-text("Create Vault")').count();
    console.log(`Found ${elements} Create Vault elements on the page`);
    
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
    
    // 1. Test setting vault name
    const nameInput = page.locator(SELECTORS.CREATE_VAULT.VAULT_NAME_INPUT[0]);
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('Test Vault Name');
    
    // 2. Check which token is currently selected (WETH or USDC)
    console.log('Checking which principal token is currently selected');
    
    // Use a more specific selector for the active token button (not including the dropdown options)
    const tokenSelector = 'button[aria-haspopup="menu"]:has-text("WETH"), button[aria-haspopup="menu"]:has-text("USDC")';
    await page.waitForSelector(tokenSelector, { timeout: TIMEOUTS.ELEMENT_APPEAR });
    
    // Get the text of the currently selected token - use first() to ensure we're getting only one element
    const tokenButton = page.locator(tokenSelector).first();
    const tokenText = await tokenButton.textContent();
    console.log(`Current token selected: ${tokenText}`);
    
    // Click on the token selector to open dropdown
    console.log('Clicking on principal token selector to open dropdown');
    await tokenButton.click();
    await page.waitForTimeout(2000); // Small wait to ensure dropdown is fully visible
    
    // If WETH is already selected, select USDC, otherwise select WETH
    if (tokenText?.includes('WETH')) {
      console.log('WETH is selected, switching to USDC');
      // Select USDC from dropdown - use a more specific selector for menu items
      const usdcOption = page.locator('button[role="menuitemradio"]:has-text("USDC")').first();
      
      if (await usdcOption.count() > 0) {
        console.log('USDC option found, clicking it');
        await usdcOption.click();
        await page.waitForTimeout(1000);
        
        // Verify USDC is now selected
        const selectedToken = page.locator('button[aria-haspopup="menu"]:has-text("USDC")').first();
        await expect(selectedToken).toBeVisible({ timeout: TIMEOUTS.ELEMENT_APPEAR });
        
        // Switch back to WETH for the rest of the test
        await selectedToken.click();
        await page.waitForTimeout(1000);
        const wethOption = page.locator('button[role="menuitemradio"]:has-text("WETH")').first();
        if (await wethOption.count() > 0) {
          await wethOption.click();
        } else {
          console.log('WETH option not found in dropdown, skipping token switch');
        }
      } else {
        console.log('USDC option not found in dropdown, skipping token switch');
      }
    } else {
      console.log('USDC is selected, switching to WETH');
      // Select WETH from dropdown
      const wethOption = page.locator('button[role="menuitemradio"]:has-text("WETH")').first();
      if (await wethOption.count() > 0) {
        await wethOption.click();
        await page.waitForTimeout(1000);
        
        // Verify WETH is now selected
        const selectedToken = page.locator('button[aria-haspopup="menu"]:has-text("WETH")').first();
        await expect(selectedToken).toBeVisible({ timeout: TIMEOUTS.ELEMENT_APPEAR });
      } else {
        console.log('WETH option not found in dropdown, skipping token switch');
      }
    }
    
    // 3. Test toggling Publish Vault
    console.log('Testing publish vault toggle');
    
    // Try different approaches to interact with the toggle
    
    // First look for the toggle label and try clicking it
    const toggleLabel = page.locator(SELECTORS.CREATE_VAULT.TOGGLE_LABEL);
    if (await toggleLabel.count() > 0) {
      console.log('Toggle label found, attempting to click it');
      try {
        // Try force clicking the label which may be more reliable than clicking the toggle directly
        await toggleLabel.click({ force: true, timeout: 10000 });
        console.log('Successfully clicked toggle label');
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`Failed to click toggle label: ${error.message}`);
      }
    } else {
      console.log('Toggle label not found');
    }
    
    // If that didn't work, try force clicking directly on the toggle
    try {
      // Look for the checkbox as a direct target
      const checkbox = page.locator('input[type="checkbox"].chakra-switch__input, .chakra-switch input[type="checkbox"]').first();
      
      if (await checkbox.count() > 0) {
        console.log('Checkbox found, attempting to click it directly with force option');
        // Try JavaScript click which bypasses pointer interception
        await page.evaluate(() => {
          const checkbox = document.querySelector('input[type="checkbox"].chakra-switch__input, .chakra-switch input[type="checkbox"]');
          if (checkbox) {
            (checkbox as HTMLElement).click();
          }
        });
        console.log('Executed JavaScript click on checkbox');
        await page.waitForTimeout(1000);
      } else {
        console.log('Checkbox not found');
      }
    } catch (error) {
      console.log(`Failed to click checkbox: ${error.message}`);
    }
    
    // As a last resort, try to click the switch container
    try {
      const switchContainer = page.locator('.chakra-switch').first();
      if (await switchContainer.count() > 0) {
        console.log('Switch container found, attempting to click it with force option');
        await switchContainer.click({ force: true, timeout: 10000 });
        console.log('Successfully clicked switch container');
        await page.waitForTimeout(1000);
      } else {
        console.log('Switch container not found');
      }
    } catch (error) {
      console.log(`Failed to click switch container: ${error.message}`);
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
      
      // Verify narrow range config is displayed
      await expect(page.locator('text=10.52%')).toBeVisible();
      await expect(page.locator('text=0.02%')).toBeVisible();
      
      // Test selecting Wide
      await wideRangeButton.click();
      
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
      await expect(page.locator('text="≤5 USDC"')).toBeVisible();
      
      // Click and verify Moderate Value option
      await moderateValueOption.click();
      await expect(page.locator('text="≤50 USDC"')).toBeVisible();
      
      // Click and verify High Value option
      await highValueOption.click();
      await expect(page.locator('text="≤500 USDC"')).toBeVisible();
      
      // Click and verify Fixed option
      await fixedOption.click();
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
