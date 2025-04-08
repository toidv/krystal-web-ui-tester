
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
```

## Test Structure

- `positions.spec.ts`: Tests for the positions page
- `screenshots/`: Directory where test screenshots are saved

## Notes

- The tests simulate a wallet connection using Web3.js
- Test wallet address: `0x1822946a4f1a625044d93a468db6db756d4f89ff`
- By default, tests run in headed mode (with browser visible)
- Screenshots are taken at key points during test execution
