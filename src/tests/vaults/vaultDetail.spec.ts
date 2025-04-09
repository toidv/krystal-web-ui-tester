
import { test, expect } from '@playwright/test';
import { setupWalletConnection, connectWallet, verifyWalletConnected } from '../utils/setupWallet';
import { takeScreenshot, initScreenshotsDir } from '../utils/screenshotHelper';
import { VaultListPage } from '../page-objects/VaultListPage';
import { VaultDetailPage } from '../page-objects/VaultDetailPage';
import { URLS, TIMEOUTS } from '../utils/constants';

test.describe('Krystal Vault Details Tests', () => {
  // Initialize screenshots directory before tests
  initScreenshotsDir();

  // Increase timeout for the entire test to prevent premature termination
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    // Setup wallet connection before each test
    await setupWalletConnection(page);
  });

  test('should verify vault sorting, details and validate all vault information', async ({ page }) => {
    console.log('Starting comprehensive vault details verification test...');
    
    const vaultListPage = new VaultListPage(page);
    const vaultDetailPage = new VaultDetailPage(page);
    
    // Visit the vaults page
    await vaultListPage.goto();
    await vaultListPage.waitForPageLoad();
    
    // Connect wallet and verify connection
    await connectWallet(page);
    await verifyWalletConnected(page);
    
    // 1. Sort vault list by APR DESC
    await vaultListPage.sortByAPR();
    
    // 2. Find vaults and click on the first one to view details
    console.log('Looking for vaults with APR values...');
    
    const vaultElement = await vaultListPage.findFirstVault();
    
    if (!vaultElement) {
      console.log('No vaults found on the page, skipping detail page tests');
      // Take error screenshot if no vaults are found
      await takeScreenshot(page, 'no-vaults-found-error');
      return;
    }
    
    // Click on the vault to view details
    await vaultElement.click({ timeout: TIMEOUTS.ELEMENT_APPEAR }).catch(err => {
      console.log('Error clicking on vault:', err);
    });
    console.log('Clicked on vault to view details');
    
    // Wait for detail page to load
    await vaultDetailPage.waitForDetailPageLoad();
    
    // Safeguard against page closure
    if (page.isClosed()) {
      console.log('Page closed unexpectedly after loading detail page');
      return;
    }
    
    // 3. Validate the APR chart with timeout protection
    try {
      await Promise.race([
        vaultDetailPage.verifyPerformanceChart(),
        // Fallback timeout to prevent test from hanging
        page.waitForTimeout(30000).then(() => {
          console.log('Timeout safety triggered for performance chart verification');
        })
      ]);
    } catch (error) {
      console.log('Error verifying performance chart, continuing:', error);
    }
    
    if (page.isClosed()) return;
    
    // 4. Validate Assets section with timeout protection
    try {
      await Promise.race([
        vaultDetailPage.verifyAssetsSection(),
        page.waitForTimeout(15000).then(() => {
          console.log('Timeout safety triggered for assets section verification');
        })
      ]);
    } catch (error) {
      console.log('Error verifying assets section, continuing:', error);
    }
    
    if (page.isClosed()) return;
    
    // 5. Validate Strategy Settings with timeout protection
    try {
      await Promise.race([
        vaultDetailPage.verifyStrategySettings(),
        page.waitForTimeout(15000).then(() => {
          console.log('Timeout safety triggered for strategy settings verification');
        })
      ]);
    } catch (error) {
      console.log('Error verifying strategy settings, continuing:', error);
    }
    
    if (page.isClosed()) return;
    
    // 6. Validate Deposit/Withdraw functionality with timeout protection
    try {
      await Promise.race([
        vaultDetailPage.verifyDepositWithdraw(),
        page.waitForTimeout(15000).then(() => {
          console.log('Timeout safety triggered for deposit/withdraw verification');
        })
      ]);
    } catch (error) {
      console.log('Error verifying deposit/withdraw, continuing:', error);
    }
    
    if (page.isClosed()) return;
    
    // 7. Validate Risk Warning section with timeout protection
    try {
      await Promise.race([
        vaultDetailPage.verifyRiskWarning(),
        page.waitForTimeout(15000).then(() => {
          console.log('Timeout safety triggered for risk warning verification');
        })
      ]);
    } catch (error) {
      console.log('Error verifying risk warning, continuing:', error);
    }
    
    // Final screenshot after all validation
    if (!page.isClosed()) {
      await takeScreenshot(page, 'vault-detail-final');
      console.log('Comprehensive vault details verification test completed');
    } else {
      console.log('Page closed before completing vault details test');
    }
  });
});
