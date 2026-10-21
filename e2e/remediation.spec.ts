import { test, expect } from "@playwright/test";

test.describe("Autonomous Remediation & Fix Verification Studio E2E", () => {
  test("inspects unified diff, executes sandbox verification, and signs off patch approval", async ({ page }) => {
    // 1. Navigate to Remediation Studio
    await page.goto("http://localhost:3000/remediation");

    // 2. Verify Studio Header & Stepper
    await expect(page.locator("h1")).toContainText("Remediation Studio & Fix Verification");
    await expect(page.getByText("services/payment_worker/processor.py").first()).toBeVisible();
    await expect(page.locator("text=INV-PAY-001").first()).toBeVisible();

    // 3. Inspect Unified Diff Viewer
    await expect(page.locator("text=GNU Unified Patch Diff")).toBeVisible();
    await expect(page.locator("text=asyncio.Lock").first()).toBeVisible();

    // 4. Run Sandbox Verification
    const runSandboxBtn = page.locator("button:has-text('Execute Sandbox Verification')");
    if (await runSandboxBtn.isVisible()) {
      await runSandboxBtn.click();
      // Wait for validation to complete
      await expect(page.locator("text=Sandbox Safety Score")).toBeVisible({ timeout: 25000 });
    }

    // 5. Test Tab Switching to Sandbox Execution Proof
    const sandboxTab = page.locator("button:has-text('Sandbox Execution Proof')");
    await sandboxTab.click();
    await expect(page.locator("text=Unpatched Target Execution (Failure Proof)")).toBeVisible();
    await expect(page.locator("text=Patched Target Execution (Invariant Restored)")).toBeVisible();

    // 6. Verify Supervised Human Gatekeeper Sign-off
    await expect(page.locator("text=Supervised Human Gatekeeper Sign-off")).toBeVisible();
  });
});
