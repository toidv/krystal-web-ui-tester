
# UI Integration Tests

This directory contains Playwright tests for the Krystal Web UI.

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run tests with UI mode
npx playwright test --ui

# Run specific test
npx playwright test positions.spec.ts
npx playwright test vaults.spec.ts
```

## Important Note About Wallet Connection

These tests include a step to verify if the site requires a real wallet connection for whitelist verification:

1. If whitelist verification is required, the test will:
   - Display clear instructions in the console
   - Wait for up to 2 minutes for you to connect your wallet
   - Take screenshots of the process
   - Continue with the test after successful connection
   - Skip the test if connection fails

2. When prompted, you should:
   - Open your wallet extension (MetaMask, Rabby, etc.)
   - Connect to the site when the extension popup appears
   - Ensure your wallet address is whitelisted for access

## Test Structure

- `positions.spec.ts`: Tests for the positions page
- `vaults.spec.ts`: Tests for the vaults page
- `screenshots/`: Directory where test screenshots are saved

## Notes

- The tests simulate a wallet connection using Web3.js
- Test wallet address: `0x1822946a4f1a625044d93a468db6db756d4f89ff`
- By default, tests run in headed mode (with browser visible)
- Screenshots are taken at key points during test execution
