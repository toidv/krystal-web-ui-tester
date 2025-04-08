
import { test, expect } from '@playwright/test';
import { takeScreenshot } from '../utils/screenshotHelper';
import { URLS, TIMEOUTS, SELECTORS } from '../utils/constants';
import { setupWalletConnection, connectWallet, verifyWalletConnected } from '../utils/setupWallet';

test.describe('Create Vault Form', () => {
  test('should correctly validate and display create vault form options', async ({ page }) => {
    console.log('Starting Create Vault test...');
    
    // Navigate to vaults page
    await page.goto(URLS.VAULTS, { timeout: TIMEOUTS.PAGE_LOAD });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial vaults page
    await takeScreenshot(page, 'vaults-page-initial');
    
    // Setup wallet connection using the pattern from vaultBasic.spec.ts
    await setupWalletConnection(page);
    await connectWallet(page);
    await verifyWalletConnected(page);
    
    // Take screenshot after wallet connection
    await takeScreenshot(page, 'wallet-connected-state');
    console.log('Wallet connected, proceeding to Create Vault test');
    
    // Locate and click the Create Vault button
    const createVaultButton = page.locator(SELECTORS.CREATE_VAULT.BUTTON[0]);
    await createVaultButton.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_APPEAR });
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
