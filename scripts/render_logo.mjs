import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function run() {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  const svgContent = fs.readFileSync("public/logo-mark.svg", "utf-8");
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="background:#FAFBFD; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
        <div style="background:white; padding:32px; border-radius:24px; box-shadow:0 4px 20px rgba(0,0,0,0.06); display:flex; align-items:center; gap:16px;">
          <div style="width:56px; height:56px;">${svgContent}</div>
          <div>
            <div style="font-family:system-ui,-apple-system,sans-serif; font-size:20px; font-weight:700; color:#111827; letter-spacing:-0.02em;">AFTERMATH</div>
            <div style="font-family:system-ui,-apple-system,sans-serif; font-size:12px; font-weight:500; color:#6B7280;">The Release Time Machine</div>
          </div>
        </div>
      </body>
    </html>
  `);
  await page.screenshot({ path: "screenshots/logo_preview.png" });
  await browser.close();
  console.log("Saved screenshots/logo_preview.png");
}

run().catch(console.error);
