import { test, expect } from "@playwright/test";

/**
 * E2E tests for the donation flow.
 *
 * These tests verify the core donation flow works correctly:
 * 1. Amount selection
 * 2. Timeframe selection
 * 3. Recipient selection
 * 4. Payment with Stripe test card
 * 5. Fee coverage calculation
 *
 * Prerequisites:
 * - App must be running on localhost:3000
 * - Stripe must be configured in test mode
 */

test.describe("Donation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored donation state before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("greasy_donation");
    });
  });

  test("can navigate through donation amount selection", async ({ page }) => {
    // Go to donation page
    await page.goto("/donate");

    // Verify we're on Step 1
    await expect(page.getByRole("heading", { name: /Step 1: Choose Amount/i })).toBeVisible();
    await expect(page.getByText(/How much would you like to donate/i)).toBeVisible();

    // Continue button should be disabled initially
    const continueButton = page.getByRole("button", { name: /Continue/i });
    await expect(continueButton).toBeDisabled();

    // Select $10 donation amount
    await page.getByRole("button", { name: "$10" }).click();

    // Continue button should now be enabled
    await expect(continueButton).toBeEnabled();

    // Click continue and verify navigation to timeframe page
    await continueButton.click();
    await expect(page).toHaveURL(/\/donate\/timeframe/);
    await expect(page.getByRole("heading", { name: /Step 2: Select Timeframe/i })).toBeVisible();
  });

  test("can complete full donation flow with test card", async ({ page }) => {
    // Step 1: Select amount
    await page.goto("/donate");
    await page.getByRole("button", { name: "$10" }).click();
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 2: Select timeframe
    await expect(page).toHaveURL(/\/donate\/timeframe/);
    await page.getByRole("button", { name: "Immediate" }).click();
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 3: Select recipient
    await expect(page).toHaveURL(/\/donate\/recipient/);
    await page.getByRole("button", { name: "Sundai Club" }).click();
    await page.getByRole("button", { name: /Continue to Payment/i }).click();

    // Step 4: Payment page
    await expect(page).toHaveURL(/\/donate\/payment/);
    await expect(page.getByRole("heading", { name: /Step 4: Payment/i })).toBeVisible();

    // Verify donation summary is displayed
    await expect(page.getByText("$10.00")).toBeVisible();
    await expect(page.getByText("Sundai Club")).toBeVisible();
    await expect(page.getByText("Immediate")).toBeVisible();

    // Fill in Stripe test card
    // Wait for Stripe iframe to load
    const stripeFrame = page.frameLocator("iframe[name^='__privateStripeFrame']").first();
    await stripeFrame.locator('[placeholder="Card number"]').fill("4242424242424242");
    await stripeFrame.locator('[placeholder="MM / YY"]').fill("12/30");
    await stripeFrame.locator('[placeholder="CVC"]').fill("123");
    await stripeFrame.locator('[placeholder="ZIP"]').fill("12345");

    // Submit payment
    await page.getByRole("button", { name: /Pay \$10\.00/i }).click();

    // Wait for navigation to confirm page (payment processing may take a moment)
    await expect(page).toHaveURL(/\/donate\/confirm/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Step 5: Confirm/i })).toBeVisible();

    // Choose not to set anti-charity (simpler path)
    await page.getByRole("button", { name: /No, Thank You/i }).click();

    // Verify we reach the thank you page
    await expect(page).toHaveURL(/\/donate\/thank-you/);
    await expect(page.getByRole("heading", { name: /Thank You/i })).toBeVisible();
    await expect(page.getByText(/Your donation has been processed successfully/i)).toBeVisible();

    // Verify donation summary on thank you page
    await expect(page.getByText("$10.00")).toBeVisible();
    await expect(page.getByText("Sundai Club")).toBeVisible();
  });

  test("fee coverage checkbox updates total correctly", async ({ page }) => {
    // Navigate through flow to payment page
    await page.goto("/donate");
    await page.getByRole("button", { name: "$100" }).click();
    await page.getByRole("button", { name: /Continue/i }).click();

    await expect(page).toHaveURL(/\/donate\/timeframe/);
    await page.getByRole("button", { name: "Immediate" }).click();
    await page.getByRole("button", { name: /Continue/i }).click();

    await expect(page).toHaveURL(/\/donate\/recipient/);
    await page.getByRole("button", { name: "Sundai Club" }).click();
    await page.getByRole("button", { name: /Continue to Payment/i }).click();

    // On payment page
    await expect(page).toHaveURL(/\/donate\/payment/);

    // Initially, pay button shows base amount ($100)
    await expect(page.getByRole("button", { name: /Pay \$100\.00/i })).toBeVisible();

    // Verify the fee coverage checkbox is present
    const feeCheckbox = page.getByRole("checkbox");
    await expect(feeCheckbox).toBeVisible();
    await expect(feeCheckbox).not.toBeChecked();

    // Check the fee coverage checkbox
    await feeCheckbox.check();
    await expect(feeCheckbox).toBeChecked();

    // Verify the breakdown appears showing:
    // - Donation amount: $100.00
    // - Platform fee coverage: +$2.50 (2.5% of $100)
    // - Total charge: $102.50
    await expect(page.getByText(/Donation amount/i)).toBeVisible();
    await expect(page.getByText(/Platform fee coverage/i)).toBeVisible();
    await expect(page.getByText(/\+\$2\.50/)).toBeVisible();
    await expect(page.getByText(/Total charge/i)).toBeVisible();
    await expect(page.getByText("$102.50")).toBeVisible();

    // Pay button should now show the updated total
    await expect(page.getByRole("button", { name: /Pay \$102\.50/i })).toBeVisible();

    // Uncheck the fee coverage
    await feeCheckbox.uncheck();
    await expect(feeCheckbox).not.toBeChecked();

    // Pay button should revert to base amount
    await expect(page.getByRole("button", { name: /Pay \$100\.00/i })).toBeVisible();
  });
});
