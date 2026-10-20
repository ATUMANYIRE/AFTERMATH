import { test, expect } from "@playwright/test";

test.describe("Consequence Laboratory E2E", () => {
  test("loads Release Time Machine and displays invariant comparison", async ({ page }) => {
    await page.goto("http://localhost:3000/time-machine");

    // Check title and header
    await expect(page.locator("h1")).toContainText("Release Time Machine");
    await expect(page.locator("text=CONSEQUENCE LABORATORY")).toBeVisible();

    // Invariant banners must be visible
    await expect(page.locator("text=VULNERABLE INVARIANT RESULT")).toBeVisible();
    await expect(page.locator("text=REPAIRED INVARIANT RESULT")).toBeVisible();

    // Delta metrics must be visible
    await expect(page.locator("text=Errors Prevented")).toBeVisible();
    await expect(page.locator("text=Financial Exposure Avoided")).toBeVisible();

    // Verify split columns
    await expect(page.locator("text=VULNERABLE EXECUTION")).toBeVisible();
    await expect(page.locator("text=REPAIRED EXECUTION")).toBeVisible();

    // Test tab switching to Customer Ledger Transactions
    const ledgerTab = page.locator("button:has-text('Customer Ledger Transactions')");
    await ledgerTab.click();
    await expect(page.locator("text=Vulnerable Ledger Debits")).toBeVisible();
    await expect(page.locator("text=Repaired Ledger Debits")).toBeVisible();

    // Switch back to timeline
    const timelineTab = page.locator("button:has-text('Chronological Event Timeline')");
    await timelineTab.click();
    await expect(page.locator("text=Synchronized Timeline Scrubber")).toBeVisible();
  });
});
