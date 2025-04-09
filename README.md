
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/62de5afa-4a1b-459d-af05-490ce91b0b5d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/62de5afa-4a1b-459d-af05-490ce91b0b5d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Playwright (for testing)

## Testing Framework

This project includes comprehensive UI testing with Playwright. The tests are located in the `src/tests` directory.

### Test Structure

- `src/tests/positions.spec.ts`: Tests for the positions page
- `src/tests/vaults/`: Contains multiple test files for vaults functionality
  - `vaultBasic.spec.ts`: Basic vault functionality tests
  - `vaultDetail.spec.ts`: Detailed vault page tests
  - `vaultComparison.spec.ts`: Tests for comparing multiple vaults
  - `createVault.spec.ts`: Tests for the vault creation process

### Page Objects

The tests use the Page Object Model pattern with page objects defined in:
- `src/tests/page-objects/VaultListPage.ts`
- `src/tests/page-objects/VaultDetailPage.ts`

### Utility Functions

- `src/tests/utils/setupWallet.ts`: Functions for wallet connection setup
- `src/tests/utils/screenshotHelper.ts`: Functions for taking and managing screenshots
- `src/tests/utils/constants.ts`: Shared constants including URLs, timeouts, and selectors

### Running Tests

```bash
# Run all tests
npx playwright test

# Run tests with UI mode
npx playwright test --ui

# Run specific test files
npx playwright test vaults/vaultBasic.spec.ts
npx playwright test positions.spec.ts

# View test report
npx playwright show-report
```

### Test Configuration

The tests are configured to run against either:
- Local development environment: `http://localhost:3000`
- Development preview: `https://dev-krystal-web-pr-3207.krystal.team`

Tests include robust error handling to manage page availability and element visibility issues.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/62de5afa-4a1b-459d-af05-490ce91b0b5d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
