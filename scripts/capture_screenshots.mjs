import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const routes = [
  { name: "overview", path: "/" },
  { name: "time_machine", path: "/time-machine" },
  { name: "investigation", path: "/investigation" },
  { name: "agent_activity", path: "/agent-activity" },
  { name: "release_control", path: "/release-control" },
];

const viewports = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

async function capture() {
  console.log("Launching Edge browser for screenshot capture...");
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

    for (const r of routes) {
      const url = `http://localhost:3000${r.path}`;
      console.log(`Capturing ${r.name} (${vp.label}) from ${url}...`);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
        await page.waitForTimeout(1200);
        const filename = path.join(OUT_DIR, `${r.name}_${vp.label}.png`);
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`Saved screenshot: ${filename}`);
      } catch (err) {
        console.error(`Error capturing ${r.name} (${vp.label}):`, err.message);
      }
    }
    await context.close();
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture process failed:", err);
  process.exit(1);
});
