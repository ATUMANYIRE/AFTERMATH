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
  console.log("Launching Edge browser for visual verification...");
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
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `overview_${vp.label}.png`), fullPage: true, timeout: 10000 });

    // 2. Time Machine
    console.log(`Capturing time_machine (${vp.label})...`);
    await page.goto("http://localhost:3000/time-machine", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `time_machine_${vp.label}.png`), fullPage: true, timeout: 10000 });

    // 3. Investigation
    console.log(`Capturing investigation (${vp.label})...`);
    await page.goto("http://localhost:3000/investigation", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `investigation_${vp.label}.png`), fullPage: true, timeout: 10000 });

    // 4. Remediation Studio
    console.log(`Capturing remediation (${vp.label})...`);
    await page.goto("http://localhost:3000/remediation", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `remediation_${vp.label}.png`), fullPage: true, timeout: 10000 });

    // 5. Release Control / Superposition
    console.log(`Capturing release_superposition (${vp.label})...`);
    await page.goto("http://localhost:3000/release-control", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `release_superposition_${vp.label}.png`), fullPage: true, timeout: 10000 });

    await context.close();
  }

  await browser.close();
  console.log("All screenshots successfully captured!");
}

capture().catch((err) => {
  console.error("Capture process failed:", err);
  process.exit(1);
});
