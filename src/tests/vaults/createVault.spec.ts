
import { test, expect } from '@playwright/test';
import { takeScreenshot, initScreenshotsDir } from '../utils/screenshotHelper';
import { URLS, TIMEOUTS, SELECTORS } from '../utils/constants';
import { setupWalletConnection, connectWallet, verifyWalletConnected } from '../utils/setupWallet';
import { VaultListPage } from '../page-objects/VaultListPage';

test.describe('Create Vault Form', () => {
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
    
    // Check if Create Vault button exists on the page
    const buttonExists = await page.locator('button:has-text("Create Vault"), a:has-text("Create Vault")').count() > 0;
    if (!buttonExists) {
      console.log('Create Vault button not found on page. Taking a screenshot of current page state.');
      await takeScreenshot(page, 'page-missing-create-vault-button');
      
      // Try to find other elements to determine what page we're on
      const headings = await page.locator('h1, h2, h3').allTextContents();
      console.log('Visible headings on page:', headings);
      
      // Try alternative selector for Create Vault button
      console.log('Trying alternative selectors for Create Vault button...');
    }
    
    // Locate and click the Create Vault button with improved selectors
    // Try multiple selectors since the exact implementation might vary
    const createVaultButton = page.locator([
      'button:has-text("Create Vault")',
      'a:has-text("Create Vault")',
      '[data-testid="create-vault-button"]',
      'button:has-text("Create")',
      '.create-vault-button',
      'button.primary:has-text("Create")',
      '[role="button"]:has-text("Create Vault")'
    ].join(', '));
    
    // Increased timeout since we might need more time after navigation
    await createVaultButton.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_APPEAR * 2 });
    await takeScreenshot(page, 'before-clicking-create-vault');
    await createVaultButton.click();
    
    // Wait for the create vault form to appear
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
