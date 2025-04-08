
import { test } from '@playwright/test';
import { setupWalletConnection } from '../utils/setupWallet';
import { takeScreenshot, initScreenshotsDir } from '../utils/screenshotHelper';
import { VaultListPage } from '../page-objects/VaultListPage';
import { VaultDetailPage } from '../page-objects/VaultDetailPage';
import { URLS } from '../utils/constants';

/**
 * Process the details page for a single vault
 */
async function processVaultDetails(vaultIndex: number, vaultListPage: VaultListPage, vaultDetailPage: VaultDetailPage) {
  console.log(`Examining vault ${vaultIndex+1} details...`);
  
  // Find vault element
  const vaultElement = await vaultListPage.findFirstVault();
  if (!vaultElement) {
    console.log(`No vault found at index ${vaultIndex+1}, skipping`);
    return;
  }
  
  // Click on the vault row or name to open details
  await vaultElement.click();
  console.log(`Clicked on vault ${vaultIndex+1}`);
  
  // Wait for detail page to load
  await vaultDetailPage.waitForDetailPageLoad();
  
  // Take screenshot of details page
  await takeScreenshot(vaultDetailPage.page, `vault-${vaultIndex+1}-details`);
  
  // Validate APR and performance information
  await vaultDetailPage.verifyPerformanceChart();
  
  // Check information sections
  await vaultDetailPage.verifyAssetsSection();
  await vaultDetailPage.verifyStrategySettings();
  await vaultDetailPage.verifyDepositWithdraw();
  
  // Return to vault list
  await vaultListPage.goto();
  console.log(`Returned to vault list from vault ${vaultIndex+1}`);
  
  // Re-sort the list by APR
  await vaultListPage.sortByAPR();
}

test.describe('Krystal Vault Comparison Tests', () => {
  // Initialize screenshots directory before tests
  initScreenshotsDir();

  test.beforeEach(async ({ page }) => {
    // Setup wallet connection before each test
    await setupWalletConnection(page);
  });

  test('should compare multiple vaults and their details', async ({ page }) => {
    console.log('Starting vault comparison test...');
    
    const vaultListPage = new VaultListPage(page);
    const vaultDetailPage = new VaultDetailPage(page);
    
    // Navigate to vaults page
    await vaultListPage.goto();
    await vaultListPage.waitForPageLoad();
    
    // Sort by APR to ensure consistent ordering
    await vaultListPage.sortByAPR();
    
    // Process up to 3 vaults for comparison
    for (let i = 0; i < 3; i++) {
      await processVaultDetails(i, vaultListPage, vaultDetailPage);
    }
    
    // Final screenshot
    await takeScreenshot(page, 'vaults-comparison-complete');
    console.log('Vault comparison test completed');
  });
});
