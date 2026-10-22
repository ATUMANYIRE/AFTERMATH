import { chromium } from "playwright";
import path from "path";

async function run() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  console.log("Navigating to http://localhost:3000/ at 1366x768...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  const outPath = path.resolve("screenshots/spendhub_comparison_1366.png");
  await page.screenshot({ path: outPath, fullPage: false });
  console.log("Screenshot saved to:", outPath);

  // Also capture full page
  const fullPath = path.resolve("screenshots/spendhub_overview_full_1366.png");
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log("Full screenshot saved to:", fullPath);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
