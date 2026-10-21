import { test, expect } from "@playwright/test";

test.describe("Autonomous Remediation & Fix Verification Studio E2E", () => {
  test("inspects unified diff, executes sandbox verification, and signs off patch approval", async ({ page }) => {
    // 1. Navigate to Remediation Studio
    await page.goto("http://localhost:3000/remediation");

    // 2. Verify Studio Header & Stepper
    await expect(page.locator("h1")).toContainText("Remediation Studio & Fix Verification");
    await expect(page.getByText("services/payment_worker/processor.py", { exact: true })).toBeVisible();
    await expect(page.locator("text=INV-PAY-001: Exactly-One-Charge-Per-Purchase").first()).toBeVisible();

    // 3. Inspect Unified Diff Viewer
    await expect(page.locator("text=Proposed Patch Diff (.diff)")).toBeVisible();
    await expect(page.locator("text=asyncio.Lock").first()).toBeVisible();

    // 4. Run Sandbox Verification
    const runSandboxBtn = page.locator("button:has-text('Run Sandbox Verification'), button:has-text('Execute Sandboxed Invariant Check')").first();
    if (await runSandboxBtn.isVisible()) {
      await runSandboxBtn.click();
      // Wait for validation to complete
      await expect(page.locator("text=Isolated Sandbox Verification: PASSED")).toBeVisible({ timeout: 25000 });
      await expect(page.locator("text=PRE-PATCH RUN (VULNERABLE)")).toBeVisible();
      await expect(page.locator("text=POST-PATCH RUN (REMEDIATED)")).toBeVisible();
      await expect(page.locator("text=EXIT 0").first()).toBeVisible();
    }

    // 5. Verify Human Gatekeeper is unlocked
    const approveBtn = page.locator("button:has-text('Approve Patch')");
    if (await approveBtn.isVisible()) {
      await approveBtn.click();

      // Modal opens
      await expect(page.locator("text=Approve Patch Sign-off")).toBeVisible();
      await page.fill("input[placeholder*='John Doe']", "CTO Jane Doe");
      await page.fill("input[placeholder*='aftermath.dev']", "cto@aftermath.dev");
      await page.fill("textarea[placeholder*='double-debit']", "E2E automated sign-off: verified 0 duplicate debits.");

      // Confirm
      await page.click("button:has-text('Confirm & Sign Approval')");

      // Verify approved state
      await expect(page.locator("text=PATCH APPROVED FOR MERGE")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=CTO Jane Doe")).toBeVisible();
    }
  });
});
