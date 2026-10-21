import { test, expect } from "@playwright/test";

test.describe("AFTERMATH End-to-End Grand Tour (Milestone 5 Submission)", () => {
  test("complete 11-step journey: defect -> failure -> causal trace -> repair studio -> sandbox validation -> human gatekeeper -> release superposition", async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // Step 1: Open AFTERMATH Overview (Executive Cockpit)
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/");
    await expect(page.locator("h1")).toContainText("Release Consequence Cockpit");
    await expect(page.locator("text=rel-2026-001").first()).toBeVisible();
    await expect(page.locator("text=Active Consequence Incident")).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 2 & 3 & 4: Release Time Machine Consequence Comparison
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/time-machine");
    await expect(page.locator("h1")).toContainText("Release Time Machine");
    await expect(page.locator("text=Consequence Laboratory").first()).toBeVisible();
    await expect(page.locator("text=INV-PAY-001 Violations")).toBeVisible();
    await expect(page.locator("text=At-Risk Exposure Delta")).toBeVisible();
    await expect(page.locator("text=Vulnerable Release").first()).toBeVisible();
    await expect(page.locator("text=Repaired Release").first()).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 5 & 6: Causal Graph & Blast Radius Investigation
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/investigation");
    await expect(page.locator("h1")).toContainText("Causal Graph & Blast Radius");
    await expect(page.getByText("$1,500.00").first()).toBeVisible();

    // Trace causal path
    const traceBtn = page.locator("button:has-text('Trace Duplicate Debit Causal Path')");
    await expect(traceBtn).toBeVisible();
    await traceBtn.click();
    await expect(page.locator("text=Active Causal Path: Code Change")).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 7, 8, 9, 10: Remediation Studio & Sandbox Pytest
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/remediation");
    await expect(page.locator("h1")).toContainText("Remediation Studio & Fix Verification");

    // Inspect patch diff
    await expect(page.locator("text=GNU Unified Patch Diff")).toBeVisible();
    await expect(page.locator("text=asyncio.Lock").first()).toBeVisible();

    // Switch to Sandbox Execution Proof tab
    const sandboxTab = page.locator("button:has-text('Sandbox Execution Proof')");
    await sandboxTab.click();
    await expect(page.locator("text=Unpatched Target Execution (Failure Proof)")).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 11: Release Superposition & DevSecOps Policy Gates
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/release-control");
    await expect(page.locator("h1")).toContainText("Release Control & Superposition");

    // Verify Superposition Tab & Metrics
    await expect(page.locator("text=5-Scenario Consequence Superposition Grid")).toBeVisible();
    await expect(page.locator("text=Financial Exposure Delta")).toBeVisible();
    await expect(page.getByText("$1,500.00").first()).toBeVisible();

    // Toggle to DevSecOps Policy Gates tab
    const gatesTab = page.locator("button:has-text('DevSecOps Policy Gates')");
    await gatesTab.click();
    await expect(page.locator("text=Superposition & Release Control").first()).toBeVisible();
  });
});
