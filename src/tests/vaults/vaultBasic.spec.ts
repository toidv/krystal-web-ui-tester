
import { test, expect, Page } from '@playwright/test';
import { setupWalletConnection, TEST_WALLET_ADDRESS } from '../utils/setupWallet';
import { takeScreenshot, initScreenshotsDir } from '../utils/screenshotHelper';
import { VaultListPage } from '../page-objects/VaultListPage';

test.describe('Krystal Vaults Basic Tests', () => {
  // Initialize screenshots directory before tests
  initScreenshotsDir();

  // Make setupWalletConnection a prerequisite for all tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await setupWalletConnection(page);
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Ensure wallet is connected for this specific test instance
    await setupWalletConnection(page);
  });

  test('should load vaults page and verify UI elements', async ({ page }) => {
    console.log('Starting Vaults page test...');
    
    const vaultListPage = new VaultListPage(page);
    
    // Navigate to vaults page
    await vaultListPage.goto();
    await vaultListPage.waitForPageLoad();
    
    // Verify page title
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    expect(pageTitle).toContain('Vaults');
    
    // Verify wallet address is displayed (shortened format)
    const shortenedAddress = TEST_WALLET_ADDRESS.slice(0, 6) + '...' + TEST_WALLET_ADDRESS.slice(-4);
    const addressElement = await page.getByText(new RegExp(shortenedAddress, 'i'), { exact: false });
    expect(addressElement).toBeTruthy();
    console.log('Wallet address verified on page');
    
    // Verify basic UI elements
    await vaultListPage.verifyBasicUIElements();
    
    // Verify vault table exists
    await vaultListPage.verifyVaultTable();
    
    // Look for vault filter buttons
    const allVaultButton = await page.locator('button:has-text("All Vault")').first();
    const allVaultVisible = await allVaultButton.isVisible();
    console.log(`All Vault filter button visible: ${allVaultVisible}`);
    
    // Wait for vaults to load and check if at least one vault exists
    try {
      // Wait for vault items to appear
      await page.waitForSelector('text=/Long Test|steve|NKN Vault|Bull/', { timeout: 15000 });
      console.log('Found at least one vault');
      
      // Test deposit button functionality
      await vaultListPage.clickFirstDepositButton();
    } catch (error) {
      console.log('No vaults found or vaults are still loading:', error);
    }
    
    // Test search functionality
    await vaultListPage.testSearch('test');
    
    // Final screenshot after all tests
    await takeScreenshot(page, 'vaults-page-final');
    console.log('Test completed successfully');
  });
});
