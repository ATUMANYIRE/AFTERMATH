import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function run() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });

  const refBase64 = fs.readFileSync("screen.jpg").toString("base64");
  const actualBase64 = fs.readFileSync("screenshots/spendhub_comparison_1366.png").toString("base64");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 24px;
            background: #0F1218;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #FFFFFF;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #FFFFFF;
          }
          .subtitle {
            font-size: 13px;
            color: #94A3B8;
            margin-top: 4px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .card {
            background: #1E2330;
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid #2D3748;
          }
          .card-header {
            padding: 12px 16px;
            background: #171B26;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #2D3748;
          }
          .tag-ref {
            background: #3B82F6;
            color: white;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
          }
          .tag-actual {
            background: #FF6A13;
            color: white;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
          }
          .card img {
            width: 100%;
            height: auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">AFTERMATH vs SPENDHUB REFERENCE — VISUAL COMPARISON</div>
          <div class="subtitle">Pixel-Faithful SpendHub-Style Redesign Verification</div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="card-header">
              <span>TARGET SPENDHUB REFERENCE</span>
              <span class="tag-ref">Reference Design</span>
            </div>
            <img src="data:image/jpeg;base64,${refBase64}" />
          </div>
          <div class="card">
            <div class="card-header">
              <span>AFTERMATH REDESIGNED COCKPIT (1366x768)</span>
              <span class="tag-actual">Current Build</span>
            </div>
            <img src="data:image/png;base64,${actualBase64}" />
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(1000);

  const outPath = path.resolve("screenshots/spendhub_side_by_side_validation.png");
  await page.screenshot({ path: outPath, fullPage: true });
  console.log("Side-by-side validation saved to:", outPath);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
