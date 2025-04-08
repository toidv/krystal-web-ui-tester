
import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from './constants';
import { takeScreenshot } from './screenshotHelper';

/**
 * Test wallet address to use throughout tests
 */
export const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';

/**
 * Extend Window interface to include our custom property
 */
declare global {
  interface Window {
    walletInjected?: boolean;
  }
}

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
    
    // Log for verification
    console.log('Mock wallet provider injected with address:', mockProvider.selectedAddress);
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
    // Take screenshot before connecting wallet
    await takeScreenshot(page, 'before-wallet-connection');
    
    // Look for connect wallet button using various selectors
    let connectWalletButton = null;
    
    // Try each selector in the array until one works
    for (const selector of SELECTORS.CONNECT_WALLET_BUTTON) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          connectWalletButton = button;
          console.log(`Found Connect Wallet button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If no connect button found, check if already connected
    if (!connectWalletButton) {
      console.log('Connect wallet button not visible, checking if already connected...');
      const isConnected = await isWalletConnected(page);
      if (isConnected) {
        console.log('Wallet already connected');
        return;
      } else {
        throw new Error('Connect wallet button not found and wallet not connected');
      }
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
    
    // Take screenshot after clicking connect
    await takeScreenshot(page, 'after-clicking-connect');
    
    // Verify wallet is connected
    await verifyWalletConnected(page);
    
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error(`Failed to connect wallet: ${error}`);
  }
}

/**
 * Check if wallet is already connected
 */
export async function isWalletConnected(page: Page): Promise<boolean> {
  try {
    // Create shortened address format for verification
    const shortenedAddress = `${TEST_WALLET_ADDRESS.slice(0, 6)}...${TEST_WALLET_ADDRESS.slice(-4)}`;
    
    // Try each selector in the array until one works
    for (const selector of SELECTORS.WALLET_ADDRESS) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`Wallet address found with selector: ${selector}`);
          return true;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Also check for the shortened address text anywhere on the page
    const addressText = page.locator(`text=${shortenedAddress}`).first();
    return await addressText.isVisible({ timeout: 1000 });
  } catch (error) {
    return false;
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
    let addressElement = null;
    
    // Try each wallet address selector in the array
    for (const selector of SELECTORS.WALLET_ADDRESS) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          addressElement = element;
          console.log(`Found wallet address with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If not found with specific selectors, look for the text anywhere
    if (!addressElement) {
      console.log('Looking for address text anywhere on the page...');
      addressElement = page.locator(`text=${shortenedAddress}`).first();
    }
    
    // Wait a bit for UI to update if needed
    await page.waitForTimeout(TIMEOUTS.ANIMATION);
    
    // Take screenshot after connection
    await takeScreenshot(page, 'wallet-connected-verification');
    
    // Verify the address is visible
    await expect(addressElement).toBeVisible({ timeout: TIMEOUTS.WALLET_CONNECTION });
    console.log('Wallet connected successfully! Address verified in UI.');
  } catch (error) {
    console.error('Error verifying wallet connection:', error);
    throw new Error(`Failed to verify wallet connection: ${error}`);
  }
}
