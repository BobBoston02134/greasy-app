# E2E Tests for Greasy

This directory contains end-to-end tests for the Greasy donation app using [Playwright](https://playwright.dev/).

## Prerequisites

1. **Node.js** installed (v18+)
2. **App running** on `http://localhost:3000`
3. **Stripe test mode** configured with valid test keys in `.env.local`
4. **Playwright browsers** installed

## Setup

### Install dependencies

```bash
npm install
```

### Install Playwright browsers

```bash
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers.

## Running Tests

### Start the app first

Before running tests, make sure the app is running:

```bash
npm run dev
```

### Run all E2E tests

```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)

```bash
npm run test:e2e:ui
```

This opens a visual UI where you can:
- See tests running in real-time
- Step through tests
- View screenshots and traces
- Re-run specific tests

### Run a specific test file

```bash
npx playwright test donation-flow.spec.ts
```

### Run tests in headed mode (see the browser)

```bash
npx playwright test --headed
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

## Debugging Failing Tests

### 1. Check the HTML report

After running tests, view the detailed report:

```bash
npx playwright show-report
```

This opens a browser with:
- Test results summary
- Screenshots of failures
- Step-by-step trace viewer

### 2. View traces

Traces are recorded on first retry. They show:
- Network requests
- Console logs
- DOM snapshots
- Action timeline

### 3. Use VS Code extension

Install the [Playwright VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) for:
- Running tests from the editor
- Debugging with breakpoints
- Live test recording

### 4. Common issues

**Tests timing out?**
- Ensure the dev server is running
- Check if Stripe iframe is loading (needs valid test keys)
- Increase timeout in specific tests if needed

**Stripe payment failing?**
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Ensure you're using Stripe test mode
- Check network tab for API errors

**Selector not found?**
- Use Playwright Inspector: `npx playwright test --debug`
- Use codegen to find selectors: `npx playwright codegen localhost:3000`

## Test Coverage

### Current tests in `donation-flow.spec.ts`

| Test | Description |
|------|-------------|
| Amount selection navigation | Verifies amount selection works and enables the Continue button |
| Full donation flow | End-to-end test from amount selection through payment to thank you page |
| Fee coverage checkbox | Verifies the 2.5% fee coverage option updates the total correctly |

## Writing New Tests

### Generate test code

Use Playwright's codegen to record interactions:

```bash
npx playwright codegen localhost:3000
```

### Test structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test("should do something", async ({ page }) => {
    await page.goto("/some-page");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
```

### Best practices

1. **Clear state before tests** - Reset localStorage/sessionStorage
2. **Use semantic selectors** - Prefer `getByRole`, `getByLabel`, `getByText`
3. **Add meaningful assertions** - Don't just check navigation, verify content
4. **Keep tests independent** - Each test should work in isolation
5. **Use data-testid for complex selectors** - Add `data-testid` attributes when needed

## Configuration

See `playwright.config.ts` in the project root for:
- Browser configuration
- Timeout settings
- Screenshot/video settings
- Reporter options
