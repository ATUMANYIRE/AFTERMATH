import { test, expect } from "@playwright/test";

test.describe("Causal Graph & Blast Radius Workspace E2E", () => {
  test("loads Investigation Workspace, traces causal path, inspects evidence, and navigates", async ({ page }) => {
    await page.goto("http://localhost:3000/investigation");

    // 1. Verify Header & Intelligence Cards
    await expect(page.locator("h1")).toContainText("Causal Graph & Blast Radius");
    await expect(page.locator("text=Financial Blast Radius")).toBeVisible();
    await expect(page.getByText("$1,500.00").first()).toBeVisible();
    await expect(page.locator("text=Total Causal Nodes")).toBeVisible();
    await expect(page.locator("text=Dependency Edges")).toBeVisible();

    // 2. Trigger Signature Causal Path Trace
    const traceBtn = page.locator("button:has-text('Trace Duplicate Debit Causal Path')");
    await expect(traceBtn).toBeVisible();
    await traceBtn.click();

    // Verify step-by-step breadcrumbs
    await expect(page.locator("text=Active Causal Path: Code Change")).toBeVisible();
    await expect(page.locator("text=Causal Explanation:")).toBeVisible();

    // 3. Inspect Node Evidence in Contextual Inspector
    await expect(page.locator("text=Contextual Inspector")).toBeVisible();
    await expect(page.locator("text=Provenance Type")).toBeVisible();
    await expect(page.locator("text=Inspect Consequence in Time Machine")).toBeVisible();

    // 4. Test Counterfactual Variant Switcher
    const repairedTab = page.locator("button:has-text('Repaired (Duo)')");
    await repairedTab.click();

    // Verify exposure drops to $0.00 and invariant is preserved
    await expect(page.getByText("$0.00").first()).toBeVisible();

    // 5. Navigate to Time Machine via deep link
    const timeMachineBtn = page.locator("text=Inspect Consequence in Time Machine").first();
    await timeMachineBtn.click();
    await expect(page).toHaveURL(/.*time-machine.*/);
  });
});
