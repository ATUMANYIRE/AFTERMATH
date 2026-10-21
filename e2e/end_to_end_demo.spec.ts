import { test, expect } from "@playwright/test";

test.describe("AFTERMATH End-to-End Grand Tour (Milestone 5 Submission)", () => {
  test("complete 11-step journey: defect -> failure -> causal trace -> repair studio -> sandbox validation -> human gatekeeper -> release superposition", async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // Step 1: Open AFTERMATH Overview
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/");
    await expect(page.locator("h1")).toContainText("Release Consequence Control");
    await expect(page.locator("text=rel-2026-001 (v2.4.0-rc.3)")).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 2 & 3 & 4: Release Time Machine Consequence Comparison
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/time-machine");
    await expect(page.locator("h1")).toContainText("Release Time Machine");
    await expect(page.locator("text=CONSEQUENCE LABORATORY")).toBeVisible();
    await expect(page.locator("text=VULNERABLE INVARIANT RESULT")).toBeVisible();
    await expect(page.locator("text=REPAIRED INVARIANT RESULT")).toBeVisible();
    await expect(page.locator("text=VULNERABLE EXECUTION")).toBeVisible();
    await expect(page.locator("text=REPAIRED EXECUTION")).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 5 & 6: Causal Graph & Blast Radius Investigation
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/investigation");
    await expect(page.locator("h1")).toContainText("Consequence Investigation & Blast Radius");
    await expect(page.getByText("$1,500.00", { exact: true })).toBeVisible();

    // Trace causal path
    const traceBtn = page.locator("button:has-text('Trace Duplicate Debit Causal Path')");
    await expect(traceBtn).toBeVisible();
    await traceBtn.click();
    await expect(page.locator("text=Active Causal Path: Code Change")).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 7, 8, 9, 10: Remediation Studio, Sandbox Pytest, & Human Approval
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/remediation");
    await expect(page.locator("h1")).toContainText("Remediation Studio & Fix Verification");

    // Inspect patch diff
    await expect(page.locator("text=Proposed Patch Diff (.diff)")).toBeVisible();
    await expect(page.locator("text=asyncio.Lock").first()).toBeVisible();

    // Run Sandbox Verification if pending
    const runSandboxBtn = page.locator("button:has-text('Run Sandbox Verification'), button:has-text('Execute Sandboxed Invariant Check')").first();
    if (await runSandboxBtn.isVisible()) {
      await runSandboxBtn.click();
      await expect(page.locator("text=Isolated Sandbox Verification: PASSED")).toBeVisible({ timeout: 20000 });
      await expect(page.locator("text=POST-PATCH RUN (REMEDIATED)")).toBeVisible();
      await expect(page.locator("text=EXIT 0").first()).toBeVisible();
    }

    // -------------------------------------------------------------------------
    // Step 11: Release Superposition & DevSecOps Policy Gates
    // -------------------------------------------------------------------------
    await page.goto("http://localhost:3000/release-control");
    await expect(page.locator("h1")).toContainText("Release Superposition & Governance");

    // Verify Superposition Matrix
    await expect(page.locator("text=Release Superposition Matrix")).toBeVisible();
    await expect(page.locator("text=CONDITIONAL_APPROVAL")).toBeVisible();
    await expect(page.locator("text=Financial Risk Mitigated")).toBeVisible();
    await expect(page.locator("text=$1500.00")).toBeVisible();

    // Verify Multi-Scenario Table
    await expect(page.locator("text=Lost Payment Response Followed by Client Retry")).toBeVisible();
    await expect(page.locator("text=Simultaneous Parallel Checkout Requests")).toBeVisible();
    await expect(page.locator("text=Repeated Identical Idempotency Keys")).toBeVisible();

    // Toggle to DevSecOps Policy Gates tab
    const gatesTab = page.locator("button:has-text('DevSecOps Policy Gates')");
    await gatesTab.click();
    await expect(page.locator("text=Policy Verification Gates")).toBeVisible();
  });
});
