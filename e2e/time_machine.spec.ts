import { test, expect } from "@playwright/test";

test.describe("Consequence Laboratory E2E", () => {
  test("loads Release Time Machine and displays invariant comparison", async ({ page }) => {
    await page.goto("/time-machine");

    // Check title and header
    await expect(page.locator("h1")).toContainText("Release Time Machine");
    await expect(page.locator("text=Consequence Laboratory").first()).toBeVisible();

    // Measured outcome stat cards must be visible
    await expect(page.locator("text=INV-PAY-001 Violations")).toBeVisible();
    await expect(page.locator("text=At-Risk Exposure Delta")).toBeVisible();
    await expect(page.locator("text=P95 Latency Reduction")).toBeVisible();
    await expect(page.locator("text=Anomalies Eliminated")).toBeVisible();

    // Verify split columns
    await expect(page.locator("text=Vulnerable Release").first()).toBeVisible();
    await expect(page.locator("text=Repaired Release").first()).toBeVisible();

    // Test tab switching to Customer Ledger Transactions
    const ledgerTab = page.locator("button:has-text('Customer Ledger Transactions')");
    await ledgerTab.click();
    await expect(page.locator("text=Unpatched Ledger (Multiple Debits)")).toBeVisible();
    await expect(page.locator("text=Repaired Ledger (Exactly-Once Invariant)")).toBeVisible();

    // Switch back to timeline
    const timelineTab = page.locator("button:has-text('Synchronized Execution Timelines')");
    await timelineTab.click();
    await expect(page.locator("text=Timeline Scrubber:")).toBeVisible();
  });
});
