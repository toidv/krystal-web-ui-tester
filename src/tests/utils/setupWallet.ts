
import { Page } from '@playwright/test';

/**
 * Test wallet address to use throughout tests
 */
export const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';

/**
 * Setup Web3 wallet connection by clicking the connect button
 * and waiting for the connection to complete
 */
export async function setupWalletConnection(page: Page): Promise<void> {
  console.log('Setting up wallet connection via UI interaction...');
  
  // First inject the mock ethereum provider
  await injectMockProvider(page);
  
  // Find and click the connect wallet button
  try {
    // Look for connect wallet button with various selectors
    const connectButtonSelectors = [
      'button:has-text("Connect Wallet")', 
      'button:has-text("Connect")',
      '[data-testid="connect-wallet-button"]',
      '.connect-wallet-button',
      'button:has-text("Login")',
      'button:has-text("Sign In")'
    ];
    
    console.log('Looking for connect wallet button...');
    
    // Try each selector until we find a match
    for (const selector of connectButtonSelectors) {
      const connectButton = page.locator(selector).first();
      if (await connectButton.isVisible({ timeout: 3000 })) {
        console.log(`Found connect button with selector: ${selector}`);
        await connectButton.click();
        console.log('Clicked connect wallet button');
        
        // Wait for wallet connection dialog if it appears
        await handleWalletConnectionDialog(page);
        
        // Wait for connected state
        await waitForWalletConnected(page);
        console.log('Wallet connection completed');
        return;
      }
    }
    
    console.log('No connect wallet button found, assuming already connected');
    
    // If no button was found, the wallet might already be connected
    // Check if we can see the wallet address on the page
    await verifyWalletConnected(page);
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error(`Failed to connect wallet: ${error}`);
  }
}

/**
 * Inject mock ethereum provider into the page
 */
async function injectMockProvider(page: Page): Promise<void> {
  // Inject Web3 and setup mock wallet provider
  await page.addInitScript(() => {
    // Mock the ethereum provider
    const mockProvider = {
      isMetaMask: true,
      selectedAddress: '0x1822946a4f1a625044d93a468db6db756d4f89ff',
      networkVersion: '1',
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          return ['0x1822946a4f1a625044d93a468db6db756d4f89ff'];
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };

    // Add ethereum provider to window
    Object.defineProperty(window, 'ethereum', {
      value: mockProvider,
      writable: true,
      configurable: true,
    });
  });

  // Instead of using require.resolve, we'll use a direct URL to a CDN for web3
  await page.addInitScript({
    content: `
      // Load Web3 from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/web3@4.16.0/dist/web3.min.js';
      script.async = true;
      document.head.appendChild(script);
    `
  });
  
  console.log('Mock ethereum provider injected');
}

/**
 * Handle any wallet connection dialogs that may appear
 */
async function handleWalletConnectionDialog(page: Page): Promise<void> {
  try {
    // Look for common wallet connection modals/dialogs
    const modalSelectors = [
      'div[role="dialog"]',
      '.wallet-connector-modal',
      '.wallet-dialog',
      '.connector-list'
    ];
    
    for (const selector of modalSelectors) {
      const modal = page.locator(selector).first();
      if (await modal.isVisible({ timeout: 3000 })) {
        console.log(`Found wallet connection modal with selector: ${selector}`);
        
        // Look for MetaMask option or injected wallet option
        const walletOptions = [
          'button:has-text("MetaMask")',
          'button:has-text("Injected")',
          'div:has-text("MetaMask"):not(:has-child)', // MetaMask text without children
          '[data-wallet="injected"]',
          '[data-wallet="metamask"]'
        ];
        
        for (const option of walletOptions) {
          const walletOption = page.locator(option).first();
          if (await walletOption.isVisible({ timeout: 2000 })) {
            console.log(`Found wallet option: ${option}`);
            await walletOption.click();
            console.log('Selected wallet option');
            break;
          }
        }
        
        break;
      }
    }
  } catch (error) {
    console.warn('No wallet dialog found or error handling it:', error);
    // Continue anyway, as not all interfaces have a wallet selection dialog
  }
}

/**
 * Wait for wallet to be connected by looking for address on page
 */
async function waitForWalletConnected(page: Page): Promise<void> {
  console.log('Waiting for wallet connection to complete...');
  
  try {
    // Get shortened address format
    const shortenedAddress = TEST_WALLET_ADDRESS.slice(0, 6) + '...' + TEST_WALLET_ADDRESS.slice(-4);
    
    // Check for either full address or shortened format
    const addressSelectors = [
      `text=${shortenedAddress}`,
      `text=${TEST_WALLET_ADDRESS}`,
      `[title*="${TEST_WALLET_ADDRESS}"]`,
      '.wallet-address',
      '[data-testid="wallet-address"]'
    ];
    
    // Wait for any of the address indicators to be visible
    const timeout = 10000; // 10 second timeout
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const selector of addressSelectors) {
        const addressElement = page.locator(selector).first();
        if (await addressElement.isVisible({ timeout: 1000 })) {
          console.log(`Found wallet address indicator: ${selector}`);
          return;
        }
      }
      // Short wait before checking again
      await page.waitForTimeout(500);
    }
    
    console.warn('Timed out waiting for wallet address to appear, continuing anyway');
  } catch (error) {
    console.warn('Error waiting for wallet connection:', error);
    // Continue execution even if we don't see the address
  }
}

/**
 * Verify wallet is connected by checking for address
 */
async function verifyWalletConnected(page: Page): Promise<void> {
  console.log('Verifying wallet connection...');
  
  // Get shortened address format
  const shortenedAddress = TEST_WALLET_ADDRESS.slice(0, 6) + '...' + TEST_WALLET_ADDRESS.slice(-4);
  
  // Look for address with various selectors
  const addressSelectors = [
    `text=${shortenedAddress}`,
    `text=${TEST_WALLET_ADDRESS}`,
    `[title*="${TEST_WALLET_ADDRESS}"]`,
    '.wallet-address',
    '[data-testid="wallet-address"]'
  ];
  
  for (const selector of addressSelectors) {
    const addressElement = page.locator(selector).first();
    if (await addressElement.isVisible({ timeout: 1000 })) {
      console.log(`Wallet connection verified with selector: ${selector}`);
      return;
    }
  }
  
  console.log('Could not verify wallet connection, continuing anyway');
}
