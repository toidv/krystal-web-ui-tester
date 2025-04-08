
import { Page, expect } from '@playwright/test';
import { SELECTORS } from './constants';

/**
 * Test wallet address to use throughout tests
 */
export const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';

/**
 * Setup Web3 wallet connection and inject it into the browser context
 */
export async function setupWalletConnection(page: Page): Promise<void> {
  console.log('Setting up wallet connection...');
  
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
    
    // Add a flag to indicate wallet is injected
    window.walletInjected = true;
  });

  // Load Web3 from CDN
  await page.addInitScript({
    content: `
      // Load Web3 from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/web3@4.16.0/dist/web3.min.js';
      script.async = true;
      document.head.appendChild(script);
    `
  });

  console.log('Web3 wallet provider injected into page');
}

/**
 * Click the Connect Wallet button and verify wallet connection
 */
export async function connectWallet(page: Page): Promise<void> {
  console.log('Connecting wallet...');
  
  try {
    // Look for connect wallet button using various selectors
    const connectWalletButton = await page.locator(SELECTORS.CONNECT_WALLET_BUTTON).first();
    
    // Verify connect button is visible
    const isConnectVisible = await connectWalletButton.isVisible();
    if (!isConnectVisible) {
      console.log('Connect wallet button not visible, may already be connected');
      await verifyWalletConnected(page);
      return;
    }
    
    // Click the connect wallet button
    console.log('Clicking connect wallet button...');
    await connectWalletButton.click();
    
    // Wait for potential wallet selection dialog and click on MetaMask option if present
    try {
      const metaMaskOption = await page.locator('text=MetaMask, button:has-text("MetaMask")').first();
      if (await metaMaskOption.isVisible({ timeout: 5000 })) {
        console.log('Selecting MetaMask from wallet options...');
        await metaMaskOption.click();
      }
    } catch (error) {
      console.log('No wallet selection dialog appeared or MetaMask option not found');
    }
    
    // Verify wallet is connected
    await verifyWalletConnected(page);
    
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error(`Failed to connect wallet: ${error}`);
  }
}

/**
 * Verify wallet is connected by checking for shortened address
 */
export async function verifyWalletConnected(page: Page): Promise<void> {
  console.log('Verifying wallet connection...');
  
  try {
    // Create shortened address format for verification
    const shortenedAddress = `${TEST_WALLET_ADDRESS.slice(0, 6)}...${TEST_WALLET_ADDRESS.slice(-4)}`;
    console.log(`Looking for shortened address: ${shortenedAddress}`);
    
    // Wait for the address to appear in the UI
    const addressElement = await page.locator(`text=${shortenedAddress}, button:has-text("${shortenedAddress}")`).first();
    
    // Verify the address is visible
    await expect(addressElement).toBeVisible({ timeout: 10000 });
    console.log('Wallet connected successfully! Address verified in UI.');
  } catch (error) {
    console.error('Error verifying wallet connection:', error);
    throw new Error(`Failed to verify wallet connection: ${error}`);
  }
}
