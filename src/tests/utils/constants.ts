
/**
 * Base URLs for tests
 */
export const URLS = {
  // BASE: 'http://localhost:3000',
  // VAULTS: 'http://localhost:3000/vaults',
  // POSITIONS: 'http://localhost:3000/account/0x1822946a4f1a625044d93a468db6db756d4f89ff/positions'
  BASE: 'https://dev-krystal-web-pr-3207.krystal.team',
  VAULTS: 'https://dev-krystal-web-pr-3207.krystal.team/vaults',
  POSITIONS: 'https://dev-krystal-web-pr-3207.krystal.team/account/0x1822946a4f1a625044d93a468db6db756d4f89ff/positions'
};

/**
 * Timeouts for tests
 */
export const TIMEOUTS = {
  PAGE_LOAD: 15000,
  ELEMENT_APPEAR: 10000,
  ANIMATION: 10000,
  RENDER: 10000,
  WALLET_CONNECTION: 10000
};

/**
 * Selectors used in tests
 */
export const SELECTORS = {
  CONNECT_WALLET_BUTTON: [
    'button:has-text("Connect Wallet")', 
    'button:has-text("Connect")',
    '[role="button"]:has-text("Connect Wallet")',
    '.connect-wallet-button',
    'a:has-text("Connect Wallet")',
    '[data-testid="connect-wallet"]',
    '.header button:has-text("Connect")',
    'nav button:has-text("Connect")'
  ],
  WALLET_PROVIDERS: {
    METAMASK: [
      'button:has-text("MetaMask")',
      'li:has-text("MetaMask")',
      '[data-provider="metamask"]',
      'div[role="menuitem"]:has-text("MetaMask")',
      '[data-wallet-name="metamask"]',
      'button:has([alt="MetaMask"])',
      '.wallet-option:has-text("MetaMask")'
    ],
    RABBY: [
      'button:has-text("Rabby")',
      'li:has-text("Rabby")',
      '[data-provider="rabby"]',
      'div[role="menuitem"]:has-text("Rabby")',
      '[data-wallet-name="rabby"]',
      'button:has([alt="Rabby"])',
      '.wallet-option:has-text("Rabby")'
    ]
  },
  WALLET_ADDRESS: [
    '[data-testid="wallet-address"]',
    '[class*="wallet-address"]',
    'button:has-text("0x1822...89ff")',
    'button:has-text("...89ff")',
    'span:has-text("0x1822...89ff")',
    'button:has-text("1822")',
    'button:has-text("89ff")',
    'header button:not(:has-text("Connect"))',
    'nav button:not(:has-text("Connect"))'
  ],
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
