
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
    
    // 2. Test changing principal token
    // First check if it's set to USDC by default
    const principalTokenSelect = page.locator(SELECTORS.CREATE_VAULT.PRINCIPAL_TOKEN_SELECT[0]);
    await principalTokenSelect.waitFor({ state: 'visible' });
    await principalTokenSelect.click();
    
    // Select WETH from dropdown
    const wethOption = page.locator(SELECTORS.CREATE_VAULT.TOKEN_OPTIONS.WETH);
    await wethOption.waitFor({ state: 'visible' });
    await takeScreenshot(page, 'principal-token-dropdown');
    await wethOption.click();
    
    // Verify WETH is now selected
    await expect(page.locator('button:has-text("WETH"), [aria-label="Principal Token"]:has-text("WETH")')).toBeVisible();
    
    // Switch back to USDC
    await page.locator('button:has-text("WETH"), [aria-label="Principal Token"]:has-text("WETH")').click();
    const usdcOption = page.locator(SELECTORS.CREATE_VAULT.TOKEN_OPTIONS.USDC);
    await usdcOption.waitFor({ state: 'visible' });
    await usdcOption.click();
    await expect(page.locator('button:has-text("USDC"), [aria-label="Principal Token"]:has-text("USDC")')).toBeVisible();
    
    // 3. Test toggling Publish Vault
    const publishToggle = page.locator(SELECTORS.CREATE_VAULT.PUBLISH_TOGGLE[0]);
    await publishToggle.waitFor({ state: 'visible' });
    const initialState = await publishToggle.getAttribute('data-state');
    await publishToggle.click();
    
    // Verify toggle has changed state
    await expect(publishToggle).not.toHaveAttribute('data-state', initialState);
    await takeScreenshot(page, 'publish-vault-toggled');
    
    // Toggle back to original state
    await publishToggle.click();
    await expect(publishToggle).toHaveAttribute('data-state', initialState);
    
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
    
    // Verify wide range config is displayed (this will depend on the actual UI, using placeholders)
    // The actual percentages may vary, so we'll check for the existence of the range explanation
    await expect(page.locator('text="Range width is calculated based on the lower and upper prices"')).toBeVisible();
    
    // 5. Test Allowed Liquidity Pools options
    // Test each of the pool value options
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
    
    // Verify safety evaluation section exists
    await expect(page.locator('text="Safety Evaluation:"')).toBeVisible();
    
    // Verify create vault button is enabled
    const submitButton = page.locator(SELECTORS.CREATE_VAULT.SUBMIT_BUTTON);
    await expect(submitButton).toBeEnabled();
    
    // Take a final screenshot of the completed form
    await takeScreenshot(page, 'create-vault-form-completed');
    console.log('Test completed successfully');
  });
});
