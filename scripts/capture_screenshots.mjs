import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const viewports = [
  { label: "desktop_1440", width: 1440, height: 900 },
  { label: "desktop_1366", width: 1366, height: 768 },
  { label: "tablet_768", width: 768, height: 1024 },
  { label: "mobile_390", width: 390, height: 844 },
];

async function capture() {
  console.log("Launching Edge browser for Milestone 2 Consequence Laboratory verification...");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Overview
    console.log(`Capturing overview (${vp.label})...`);
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `overview_${vp.label}.png`), fullPage: true });

    // 2. Time Machine (Consequence Laboratory - Initial State)
    console.log(`Capturing time_machine initial (${vp.label})...`);
    await page.goto("http://localhost:3000/time-machine", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);

    // If desktop_1440, trigger "Execute Experiment Pair" to show live consequence execution in action!
    if (vp.label === "desktop_1440") {
      console.log("Triggering Execute Experiment Pair on desktop_1440...");
      const executeBtn = page.locator("button:has-text('Execute Experiment Pair')");
      if (await executeBtn.isVisible()) {
        await executeBtn.click();
        // Wait for execution to finish (status changes from Executing... back to normal or results update)
        await page.waitForTimeout(4000);
      }
    }

    await page.screenshot({ path: path.join(OUT_DIR, `time_machine_${vp.label}.png`), fullPage: true });

    // 3. Time Machine - Ledger Transactions Tab
    console.log(`Capturing time_machine_ledger (${vp.label})...`);
    try {
      const ledgerTab = page.locator("button:has-text('Customer Ledger Transactions')");
      if (await ledgerTab.isVisible()) {
        await ledgerTab.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUT_DIR, `time_machine_ledger_${vp.label}.png`), fullPage: true });
      }
    } catch (e) {
      console.warn("Could not click ledger tab:", e.message);
    }

    // 4. Investigation
    console.log(`Capturing investigation (${vp.label})...`);
    await page.goto("http://localhost:3000/investigation", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `investigation_${vp.label}.png`), fullPage: true });

    // If desktop_1440, trigger Causal Path Trace and capture the highlighted path view!
    if (vp.label === "desktop_1440") {
      console.log("Triggering Trace Duplicate Debit Causal Path on desktop_1440...");
      const traceBtn = page.locator("button:has-text('Trace Duplicate Debit Causal Path')");
      if (await traceBtn.isVisible()) {
        await traceBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(OUT_DIR, `investigation_path_desktop.png`), fullPage: true });
      }
    }

    // 5. Remediation Studio (Milestone 4 Autonomous Repair)
    console.log(`Capturing remediation (${vp.label})...`);
    await page.goto("http://localhost:3000/remediation", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `remediation_${vp.label}.png`), fullPage: true });

    // If desktop_1440, capture Sandbox Execution Proof tab as well
    if (vp.label === "desktop_1440") {
      try {
        const sandboxTab = page.locator("button:has-text('Sandbox Execution Proof')");
        if (await sandboxTab.isVisible()) {
          await sandboxTab.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(OUT_DIR, `remediation_sandbox_desktop.png`), fullPage: true });
        }
      } catch (e) {
        console.warn("Could not capture sandbox tab:", e.message);
      }
    }

    // 6. Agent Activity
    console.log(`Capturing agent_activity (${vp.label})...`);
    await page.goto("http://localhost:3000/agent-activity", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `agent_activity_${vp.label}.png`), fullPage: true });

    // 7. Release Superposition & Release Control
    console.log(`Capturing release_superposition (${vp.label})...`);
    await page.goto("http://localhost:3000/release-control", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `release_superposition_${vp.label}.png`), fullPage: true });

    if (vp.label === "desktop_1440") {
      try {
        const gatesTab = page.locator("button:has-text('DevSecOps Policy Gates')");
        if (await gatesTab.isVisible()) {
          await gatesTab.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(OUT_DIR, `release_control_gates_desktop.png`), fullPage: true });
        }
      } catch (e) {
        console.warn("Could not capture gates tab:", e.message);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("All Milestone 5 screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture process failed:", err);
  process.exit(1);
});
