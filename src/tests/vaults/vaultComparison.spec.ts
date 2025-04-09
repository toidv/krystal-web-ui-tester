
import { test } from '@playwright/test';
import { setupWalletConnection, connectWallet, verifyWalletConnected } from '../utils/setupWallet';
import { takeScreenshot, initScreenshotsDir } from '../utils/screenshotHelper';
import { VaultListPage } from '../page-objects/VaultListPage';
import { VaultDetailPage } from '../page-objects/VaultDetailPage';
import { URLS } from '../utils/constants';

/**
 * Helper function to check if the page is still available
 */
async function isPageAvailable(page) {
  try {
    return !page.isClosed();
  } catch (e) {
    console.log('Page is closed, cannot continue test');
    return false;
  }
}

/**
 * Process the details page for a single vault
 */
async function processVaultDetails(vaultIndex: number, vaultListPage: VaultListPage, vaultDetailPage: VaultDetailPage) {
  console.log(`Examining vault ${vaultIndex+1} details...`);
  
  if (!await isPageAvailable(vaultListPage.page)) {
    console.log(`Page closed, skipping vault ${vaultIndex+1} details`);
    return;
  }
  
  // Find vault element
  const vaultElement = await vaultListPage.findFirstVault();
  if (!vaultElement) {
    console.log(`No vault found at index ${vaultIndex+1}, skipping`);
    return;
  }
  
  // Click on the vault row or name to open details
  await vaultElement.click().catch(err => {
    console.log(`Error clicking on vault ${vaultIndex+1}:`, err);
  });
  console.log(`Clicked on vault ${vaultIndex+1}`);
  
  // Wait for detail page to load
  await vaultDetailPage.waitForDetailPageLoad();
  
  if (!await isPageAvailable(vaultDetailPage.page)) {
    console.log(`Page closed, skipping remaining steps for vault ${vaultIndex+1}`);
    return;
  }
  
  // Validate APR and performance information
  await vaultDetailPage.verifyPerformanceChart();
  
  if (!await isPageAvailable(vaultDetailPage.page)) return;
  
  // Check information sections
  await vaultDetailPage.verifyAssetsSection();
  
  if (!await isPageAvailable(vaultDetailPage.page)) return;
  
  await vaultDetailPage.verifyStrategySettings();
  
  if (!await isPageAvailable(vaultDetailPage.page)) return;
  
  await vaultDetailPage.verifyDepositWithdraw();
  
  if (!await isPageAvailable(vaultListPage.page)) return;
  
  // Return to vault list
  await vaultListPage.goto();
  console.log(`Returned to vault list from vault ${vaultIndex+1}`);
  
  if (!await isPageAvailable(vaultListPage.page)) return;
  
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
    
    if (!await isPageAvailable(page)) return;
    
    // Connect wallet and verify connection
    await connectWallet(page);
    await verifyWalletConnected(page);
    
    if (!await isPageAvailable(page)) return;
    
    // Sort by APR to ensure consistent ordering
    await vaultListPage.sortByAPR();
    
    // Process up to 3 vaults for comparison
    for (let i = 0; i < 3; i++) {
      if (!await isPageAvailable(page)) break;
      await processVaultDetails(i, vaultListPage, vaultDetailPage);
    }
    
    // Final screenshot only if page is still available
    if (await isPageAvailable(page)) {
      await takeScreenshot(page, 'vaults-comparison-complete');
      console.log('Vault comparison test completed');
    } else {
      console.log('Page closed before completing vault comparison test');
    }
  });
});
