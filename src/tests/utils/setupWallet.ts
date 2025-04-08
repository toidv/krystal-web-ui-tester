
import { Page } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from './constants';
import { takeScreenshot } from './screenshotHelper';

// Add a declaration for the injected wallet property
declare global {
  interface Window {
    walletInjected: boolean;
    ethereum: {
      request: (args: any) => Promise<any>;
      on: (event: string, callback: any) => void;
      selectedAddress: string;
      isMetaMask?: boolean;
      isRabby?: boolean;
    };
  }
}

// Test wallet address
export const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';

/**
 * Sets up wallet connection simulation for testing
 */
export async function setupWalletConnection(page: Page): Promise<void> {
  console.log('Setting up wallet connection simulation...');
  
  // Inject mock ethereum object to simulate wallet extension
  await page.addInitScript(() => {
    window.walletInjected = true;
    
    // Simulate Ethereum provider
    window.ethereum = {
      isMetaMask: true,
      isRabby: false,
      selectedAddress: '',
      request: async (args: any) => {
        console.log('Mock ethereum request:', args);
        
        if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
          window.ethereum.selectedAddress = '0x1822946a4f1a625044d93a468db6db756d4f89ff';
          return [window.ethereum.selectedAddress];
        }
        
        return null;
      },
      on: (event: string, callback: any) => {
        console.log(`Registered event listener for ${event}`);
      }
    };
    
    console.log('Wallet provider injected for testing');
  });
  
  // Wait for page to fully load before proceeding with wallet connection
  await page.waitForLoadState('networkidle');
  console.log('Page loaded, wallet connection setup complete');
}

/**
 * Connects wallet by simulating user interaction with wallet selection dialog
 */
export async function connectWallet(page: Page, walletType: 'MetaMask' | 'Rabby' = 'MetaMask'): Promise<void> {
  console.log(`Connecting wallet using ${walletType}...`);
  
  // 1. Click Connect Wallet button
  try {
    // Try all possible Connect Wallet button selectors
    for (const selector of SELECTORS.CONNECT_WALLET_BUTTON) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        console.log(`Found Connect Wallet button using selector: ${selector}`);
        await button.click();
        console.log('Clicked on Connect Wallet button');
        
        // Take screenshot of wallet provider selection menu
        await takeScreenshot(page, 'wallet-provider-menu');
        break;
      }
    }
  } catch (error) {
    console.error('Failed to click Connect Wallet button:', error);
    throw new Error('Connect Wallet button not found or not clickable');
  }
  
  // 2. Wait for wallet providers menu to appear and select specified wallet
  try {
    // Short delay to ensure menu animation completes
    await page.waitForTimeout(TIMEOUTS.ANIMATION);
    
    const providerSelectors = walletType === 'MetaMask' 
      ? SELECTORS.WALLET_PROVIDERS.METAMASK 
      : SELECTORS.WALLET_PROVIDERS.RABBY;
    
    // Try all possible wallet provider selectors
    let providerFound = false;
    
    for (const selector of providerSelectors) {
      const providerOption = page.locator(selector).first();
      if (await providerOption.isVisible()) {
        console.log(`Found ${walletType} option using selector: ${selector}`);
        await providerOption.click();
        console.log(`Clicked on ${walletType} option`);
        providerFound = true;
        break;
      }
    }
    
    // If we can't find a provider option, try clicking on any visible option as fallback
    if (!providerFound) {
      console.log('Specific wallet provider option not found, trying to find any provider option');
      
      // Look for any wallet provider option
      const anyProviderOption = page.locator('button, li, [role="menuitem"]').filter({
        hasText: /MetaMask|Rabby|Wallet|Connect|Provider/i
      }).first();
      
      if (await anyProviderOption.isVisible()) {
        console.log('Found a wallet provider option, clicking it');
        await anyProviderOption.click();
      } else {
        console.log('No wallet provider options found, proceeding with direct injection');
      }
    }
  } catch (error) {
    console.warn('Warning: Could not select wallet provider from menu:', error);
    console.log('Continuing with direct wallet address injection');
  }
  
  // 3. Simulate wallet extension response by executing JavaScript in the page context
  await page.evaluate((address) => {
    console.log(`Simulating wallet extension response with address: ${address}`);
    
    if (window.ethereum) {
      // Update the selected address
      window.ethereum.selectedAddress = address;
      
      // Simulate the accountsChanged event that wallet extensions fire
      const accountsChangedEvent = new CustomEvent('accountsChanged', {
        detail: [address]
      });
      window.dispatchEvent(accountsChangedEvent);
      
      // If there are any registered callbacks for accountsChanged, trigger them
      const callbacks = (window as any)._walletCallbacks?.accountsChanged || [];
      callbacks.forEach((callback: Function) => {
        try {
          callback([address]);
        } catch (err) {
          console.error('Error in accountsChanged callback:', err);
        }
      });
      
      console.log('Wallet connected successfully with address:', address);
      return true;
    } else {
      console.error('No ethereum object found in window');
      return false;
    }
  }, TEST_WALLET_ADDRESS);
  
  // Wait for the UI to update after wallet connection
  await page.waitForTimeout(TIMEOUTS.RENDER);
  console.log('Wallet connection process completed');
}

/**
 * Verifies if wallet is connected by checking if address is displayed in UI
 */
export async function verifyWalletConnected(page: Page): Promise<boolean> {
  console.log('Verifying wallet connection...');
  
  // Wait for wallet address to be displayed
  try {
    let addressFound = false;
    
    // Try all possible wallet address selectors
    for (const selector of SELECTORS.WALLET_ADDRESS) {
      const addressElement = page.locator(selector).first();
      if (await addressElement.isVisible({ timeout: TIMEOUTS.ELEMENT_APPEAR })) {
        console.log(`Found wallet address display using selector: ${selector}`);
        const text = await addressElement.textContent();
        console.log(`Wallet address displayed as: ${text}`);
        
        // Take screenshot showing connected wallet
        await takeScreenshot(page, 'wallet-connected-verified');
        
        addressFound = true;
        break;
      }
    }
    
    if (addressFound) {
      console.log('Wallet connection verified - address is displayed');
      return true;
    } else {
      console.error('Wallet address not displayed after connection attempt');
      
      // Check if there might be a disconnected state or error
      const connectButton = page.locator(SELECTORS.CONNECT_WALLET_BUTTON[0]).first();
      if (await connectButton.isVisible()) {
        console.error('Connect Wallet button still visible - connection may have failed');
        
        // Take screenshot of failed connection state
        await takeScreenshot(page, 'wallet-connection-failed');
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error verifying wallet connection:', error);
    return false;
  }
}
