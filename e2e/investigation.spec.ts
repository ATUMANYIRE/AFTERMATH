import { test, expect } from "@playwright/test";

test.describe("Causal Graph & Blast Radius Workspace E2E", () => {
  test("loads Investigation Workspace, traces causal path, inspects evidence, and navigates", async ({ page }) => {
    await page.goto("http://localhost:3000/investigation");

    // 1. Verify Header & Intelligence Cards
    await expect(page.locator("h1")).toContainText("Consequence Investigation & Blast Radius");
    await expect(page.locator("text=SYNTHETIC FINANCIAL EXPOSURE")).toBeVisible();
    await expect(page.getByText("$1,500.00", { exact: true })).toBeVisible();
    await expect(page.locator("text=SAFETY INVARIANT (INV-PAY-001)")).toBeVisible();
    await expect(page.locator("text=VIOLATED (Critical)")).toBeVisible();

    // 2. Trigger Signature Causal Path Trace
    const traceBtn = page.locator("button:has-text('Trace Duplicate Debit Causal Path')");
    await expect(traceBtn).toBeVisible();
    await traceBtn.click();

    // Verify step-by-step breadcrumbs
    await expect(page.locator("text=Active Causal Path: Code Change")).toBeVisible();
    await expect(page.locator("text=Causal Explanation:")).toBeVisible();

    // 3. Inspect Node Evidence in Inspector Panel
    // Click on consequence step or node
    const consequenceStep = page.locator("text=Duplicate Debit").first();
    await consequenceStep.click();

    // Verify Inspector Panel contents
    await expect(page.locator("text=Evidence & Provenance Inspector")).toBeVisible();
    await expect(page.locator("text=Epistemic Provenance")).toBeVisible();
    await expect(page.locator("text=Inspect Consequence in Time Machine")).toBeVisible();

    // 4. Test Counterfactual Variant Switcher
    const repairedTab = page.locator("button:has-text('Repaired Release (Duo Verified)')");
    await repairedTab.click();

    // Verify exposure drops to $0.00 and invariant is preserved
    await expect(page.getByText("$0.00", { exact: true })).toBeVisible();
    await expect(page.locator("text=PRESERVED (100%)")).toBeVisible();

    // 5. Navigate to Time Machine via deep link
    const timeMachineBtn = page.locator("text=Launch Release Time Machine").first();
    await timeMachineBtn.click();
    await expect(page).toHaveURL(/.*time-machine.*/);
  });
});
