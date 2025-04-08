
/**
 * Base URLs for tests
 */
export const URLS = {
  BASE: 'http://localhost:3000',
  VAULTS: 'http://localhost:3000/vaults',
  POSITIONS: 'http://localhost:3000/account/0x1822946a4f1a625044d93a468db6db756d4f89ff/positions'
};

/**
 * Timeouts for tests
 */
export const TIMEOUTS = {
  PAGE_LOAD: 15000,
  ELEMENT_APPEAR: 10000,
  ANIMATION: 1000,
  RENDER: 2000,
  WALLET_CONNECTION: 12000
};

/**
 * Wallet related constants
 */
export const WALLET = {
  CONNECT_BUTTON_SELECTORS: [
    'button:has-text("Connect Wallet")', 
    'button:has-text("Connect")',
    '[data-testid="connect-wallet-button"]',
    '.connect-wallet-button',
    'button:has-text("Login")',
    'button:has-text("Sign In")'
  ],
  ADDRESS_SELECTORS: [
    'text=/0x[a-fA-F0-9]{6}.../',
    '.wallet-address',
    '[data-testid="wallet-address"]',
    '.account-display',
    '[role="button"]:has-text("0x")'
  ]
};

/**
 * Selectors used in tests
 */
export const SELECTORS = {
  PERFORMANCE: [
    'text="Historical Performance"',
    'h2:has-text("Historical Performance")',
    'text=Performance',
    'div:has-text("Historical Performance")'
  ],
  ASSETS: [
    'text="Assets"',
    'h2:has-text("Assets")',
    'div:has-text("Assets"):not(:has-text("Historical"))'
  ],
  STRATEGY: [
    'text="Strategy Settings"',
    'h2:has-text("Strategy")',
    'div:has-text("Strategy Settings")'
  ],
  CHART: [
    '.recharts-responsive-container',
    'svg.recharts-surface',
    '[class*="chart"]',
    'svg g path'
  ],
  TIME_PERIODS: ['24h', '7D', '30D'],
  DEPOSIT_BUTTON: 'button:has-text("Deposit"), button:has-text("+ Deposit")',
  WITHDRAW_BUTTON: 'button:has-text("Withdraw")',
  APR_HEADER: [
    'th:has-text("APR")',
    '[role="columnheader"]:has-text("APR")',
    'div.column-header:has-text("APR")',
    'button:has-text("APR")',
    'text=APR'
  ]
};
