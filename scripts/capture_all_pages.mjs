import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function captureAll() {
  console.log("Launching Edge for complete visual verification...");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  // Standard 1366x768 (matching the SpendHub screenshot resolution)
  const context1366 = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });
  const page = await context1366.newPage();

  // 1. Overview (viewport matching SpendHub, and full page)
  console.log("Capturing Overview at 1366x768...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "spendhub_comparison_1366.png"), fullPage: false });
  await page.screenshot({ path: path.join(OUT_DIR, "overview_full_1366.png"), fullPage: true });

  // 2. Time Machine initial
  console.log("Capturing Time Machine at 1366x768...");
  await page.goto("http://localhost:3000/time-machine", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "time_machine_initial_1366.png"), fullPage: false });
  await page.screenshot({ path: path.join(OUT_DIR, "time_machine_full_1366.png"), fullPage: true });

  // Run experiment if the Run button is present to show comparison
  try {
    const runBtn = page.getByRole("button", { name: /Run Dual-Path Simulation/i });
    if (await runBtn.isVisible()) {
      console.log("Clicking Dual-Path Simulation button...");
      await runBtn.click();
      await page.waitForTimeout(3500);
      await page.screenshot({ path: path.join(OUT_DIR, "time_machine_comparison_1366.png"), fullPage: true });
    }
  } catch (e) {
    console.log("Could not trigger simulation or already executed:", e.message);
  }

  // Switch to Customer Ledger tab
  try {
    const ledgerTab = page.getByRole("button", { name: /Customer Ledger Invariant/i });
    if (await ledgerTab.isVisible()) {
      console.log("Switching to Customer Ledger tab...");
      await ledgerTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, "time_machine_ledger_1366.png"), fullPage: true });
    }
  } catch (e) {
    console.log("Could not switch to ledger tab:", e.message);
  }

  // 3. Investigation
  console.log("Capturing Investigation at 1366x768...");
  await page.goto("http://localhost:3000/investigation", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "investigation_1366.png"), fullPage: true });

  // 4. Remediation
  console.log("Capturing Remediation at 1366x768...");
  await page.goto("http://localhost:3000/remediation", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "remediation_1366.png"), fullPage: true });

  // 5. Release Control
  console.log("Capturing Release Control at 1366x768...");
  await page.goto("http://localhost:3000/release-control", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "release_control_1366.png"), fullPage: true });

  // 6. Agent Activity
  console.log("Capturing Agent Activity at 1366x768...");
  await page.goto("http://localhost:3000/agent-activity", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "agent_activity_1366.png"), fullPage: true });

  await context1366.close();

  // 1440x900 viewport for overview and time-machine
  const context1440 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page1440 = await context1440.newPage();

  console.log("Capturing Overview at 1440x900...");
  await page1440.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(OUT_DIR, "overview_1440.png"), fullPage: false });
  await page1440.screenshot({ path: path.join(OUT_DIR, "overview_full_1440.png"), fullPage: true });

  console.log("Capturing Time Machine at 1440x900...");
  await page1440.goto("http://localhost:3000/time-machine", { waitUntil: "networkidle" });
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(OUT_DIR, "time_machine_1440.png"), fullPage: true });

  await context1440.close();
  await browser.close();
  console.log("All visual verification captures complete!");
}

captureAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
