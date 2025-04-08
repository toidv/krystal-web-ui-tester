
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

# View test report
npx playwright show-report
```

## Screenshots

Screenshots are automatically saved to the `screenshots/` directory at the project root. You can view these after test runs to see visual evidence of test execution.

## Test Details

The tests simulate a wallet connection using Web3.js with the following configuration:

- Test wallet address: `0x1822946a4f1a625044d93a468db6db756d4f89ff`
- Base URL: `http://localhost:3000/`
- Tests run in headed mode by default (with browser visible)

## Test Structure

- `positions.spec.ts`: Tests for the positions page
- `vaults.spec.ts`: Tests for the vaults page

Each test verifies the following:
1. Page loads successfully
2. UI elements are present and visible
3. Interactive elements respond correctly
4. Visual evidence is captured via screenshots
