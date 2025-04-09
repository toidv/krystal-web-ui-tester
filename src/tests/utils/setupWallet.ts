
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
      removeListener: (event: string, callback: any) => void;
      emit?: (event: string, args: any) => void;
      selectedAddress: string;
      isMetaMask?: boolean;
      isRabby?: boolean;
      _walletCallbacks?: {
        accountsChanged: Function[];
      };
    };
  }
}

// Test wallet address
export const TEST_WALLET_ADDRESS = '0x1822946a4f1a625044d93a468db6db756d4f89ff';

/**
 * Sets up wallet for testing - combines setup, connect and verify steps
 */
export async function setupWallet(page: Page): Promise<void> {
  console.log('Setting up wallet for testing...');
  
  // 1. Inject wallet connection simulation
  await setupWalletConnection(page);
  
  // 2. Connect the wallet
  await connectWallet(page);
  
  // 3. Verify wallet connection
  const isConnected = await verifyWalletConnected(page);
  
  if (!isConnected) {
    console.warn('Wallet verification failed, retrying connection...');
    // Retry connection once
    await connectWallet(page);
    await verifyWalletConnected(page);
  }
  
  console.log('Wallet setup complete');
}

/**
 * Sets up wallet connection simulation for testing
 */
export async function setupWalletConnection(page: Page): Promise<void> {
  console.log('Setting up wallet connection simulation...');
  
  // Inject mock ethereum object to simulate wallet extension
  await page.addInitScript(() => {
    console.log('Injecting Ethereum provider...');
    
    window.walletInjected = true;
    
    // Simulate Ethereum provider
    window.ethereum = {
      isMetaMask: true,
      isRabby: false,
      selectedAddress: '',
      _walletCallbacks: {
        accountsChanged: []
      },
      request: async (args: any) => {
        console.log('Mock ethereum request:', args.method);
        
        if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
          window.ethereum.selectedAddress = '0x1822946a4f1a625044d93a468db6db756d4f89ff';
          console.log('Returning wallet address:', window.ethereum.selectedAddress);
          return [window.ethereum.selectedAddress];
        }
        
        if (args.method === 'eth_chainId') {
          return '0x1'; // Ethereum Mainnet
        }
        
        return null;
      },
      on: (event: string, callback: any) => {
        console.log(`Registered event listener for ${event}`);
        if (event === 'accountsChanged') {
          if (!window.ethereum._walletCallbacks) {
            window.ethereum._walletCallbacks = { accountsChanged: [] };
          }
          window.ethereum._walletCallbacks.accountsChanged.push(callback);
        }
      },
      // Add the removeListener method to handle cleanup calls
      removeListener: (event: string, callback: any) => {
        console.log(`Removing event listener for ${event}`);
        if (event === 'accountsChanged' && window.ethereum._walletCallbacks?.accountsChanged) {
          const index = window.ethereum._walletCallbacks.accountsChanged.indexOf(callback);
          if (index !== -1) {
            window.ethereum._walletCallbacks.accountsChanged.splice(index, 1);
          }
        }
      },
      // Optional emit method
      emit: function(event: string, args: any) {
        console.log(`Emitting event: ${event} with args:`, args);
        if (event === 'accountsChanged' && window.ethereum._walletCallbacks?.accountsChanged) {
          window.ethereum._walletCallbacks.accountsChanged.forEach(callback => {
            try {
              callback(args);
            } catch (err) {
              console.error('Error in accountsChanged callback during emit:', err);
            }
          });
        }
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
    let buttonClicked = false;
    for (const selector of SELECTORS.CONNECT_WALLET_BUTTON) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        console.log(`Found Connect Wallet button using selector: ${selector}`);
        await button.click();
        console.log('Clicked on Connect Wallet button');
        buttonClicked = true;
        break;
      }
    }
    
    if (!buttonClicked) {
      console.log('No connect wallet button found, attempting to inject wallet directly');
    }
  } catch (error) {
    console.error('Failed to click Connect Wallet button:', error);
    console.log('Attempting to inject wallet directly');
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
        
        // Add a delay to simulate the wallet extension response
        await page.waitForTimeout(TIMEOUTS.ANIMATION);
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
        await page.waitForTimeout(TIMEOUTS.ANIMATION);
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
      try {
        const accountsChangedEvent = new CustomEvent('accountsChanged', {
          detail: [address]
        });
        window.dispatchEvent(accountsChangedEvent);
        
        // If there are any registered callbacks for accountsChanged, trigger them
        const callbacks = window.ethereum._walletCallbacks?.accountsChanged || [];
        callbacks.forEach((callback: Function) => {
          try {
            callback([address]);
          } catch (err) {
            console.error('Error in accountsChanged callback:', err);
          }
        });

        // Check if emit function exists before calling it
        if (typeof window.ethereum.emit === 'function') {
          try {
            window.ethereum.emit('accountsChanged', [address]);
          } catch (err) {
            console.error('Error emitting accountsChanged event:', err);
          }
        }
        
        console.log('Wallet connected successfully with address:', address);
        return true;
      } catch (error) {
        console.error('Error simulating wallet events:', error);
        return false;
      }
    } else {
      console.error('No ethereum object found in window');
      return false;
    }
  }, TEST_WALLET_ADDRESS);
  
  // 4. Close any open dialogs or menus that might be left open
  try {
    await page.keyboard.press('Escape');
  } catch (error) {
    console.log('No dialogs needed to be closed or failed to close dialog:', error);
  }
  
  // Wait for the UI to update after wallet connection
  await page.waitForTimeout(TIMEOUTS.RENDER);
  console.log('Wallet connection process completed');
}

/**
 * Verifies if wallet is connected by checking if address is displayed in UI
 */
export async function verifyWalletConnected(page: Page): Promise<boolean> {
  console.log('Verifying wallet connection...');
  
  // Ensure ethereum object is properly injected with the address
  await page.evaluate((address) => {
    if (window.ethereum && !window.ethereum.selectedAddress) {
      console.log('Fixing ethereum object - injecting address directly');
      window.ethereum.selectedAddress = address;
    }
  }, TEST_WALLET_ADDRESS);
  
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
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error verifying wallet connection:', error);
    return false;
  }
}
