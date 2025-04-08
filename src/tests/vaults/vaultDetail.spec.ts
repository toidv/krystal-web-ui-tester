
import { test, expect } from '@playwright/test';
import { setupWalletConnection } from '../utils/setupWallet';
import { takeScreenshot, initScreenshotsDir } from '../utils/screenshotHelper';
import { VaultListPage } from '../page-objects/VaultListPage';
import { VaultDetailPage } from '../page-objects/VaultDetailPage';
import { URLS } from '../utils/constants';

test.describe('Krystal Vault Details Tests', () => {
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

  test('should verify vault sorting, details and validate all vault information', async ({ page }) => {
    console.log('Starting comprehensive vault details verification test...');
    
    const vaultListPage = new VaultListPage(page);
    const vaultDetailPage = new VaultDetailPage(page);
    
    // Visit the vaults page
    await vaultListPage.goto();
    await vaultListPage.waitForPageLoad();
    
    // 1. Sort vault list by APR DESC
    await vaultListPage.sortByAPR();
    
    // 2. Find vaults and click on the first one to view details
    console.log('Looking for vaults with APR values...');
    
    const vaultElement = await vaultListPage.findFirstVault();
    
    if (!vaultElement) {
      console.log('No vaults found on the page, skipping detail page tests');
      return;
    }
    
    // Click on the vault to view details
    await vaultElement.click();
    console.log('Clicked on vault to view details');
    
    // Wait for detail page to load
    await vaultDetailPage.waitForDetailPageLoad();
    
    // 3. Validate the APR chart by checking Historical Performance time periods
    await vaultDetailPage.verifyPerformanceChart();
    
    // 4. Validate Assets section
    await vaultDetailPage.verifyAssetsSection();
    
    // 5. Validate Strategy Settings
    await vaultDetailPage.verifyStrategySettings();
    
    // 6. Validate Deposit/Withdraw functionality
    await vaultDetailPage.verifyDepositWithdraw();
    
    // 7. Validate Risk Warning section
    await vaultDetailPage.verifyRiskWarning();
    
    // Final screenshot after all validation
    await takeScreenshot(page, 'vault-detail-final');
    console.log('Comprehensive vault details verification test completed');
  });
});
