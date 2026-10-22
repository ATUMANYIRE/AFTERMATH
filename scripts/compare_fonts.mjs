import { chromium } from "playwright";
import path from "path";

async function run() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 40px;
            background: #F8F9FB;
            color: #191C24;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
          }
          .font-col {
            background: #FFFFFF;
            border: 1px solid #ECEEF1;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }
          .font-title {
            font-size: 13px;
            font-weight: 600;
            color: #FF6A13;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ECEEF1;
          }
          .inter { font-family: 'Inter', sans-serif; }
          .geist { font-family: 'Geist', sans-serif; }
          .jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }

          .sample-h1 {
            font-size: 23px;
            font-weight: 600;
            letter-spacing: -0.02em;
            margin: 0 0 4px 0;
          }
          .sample-sub {
            font-size: 13px;
            color: #747B87;
            font-weight: 400;
            margin-bottom: 24px;
          }
          .sample-label {
            font-size: 14px;
            font-weight: 500;
            color: #191C24;
            margin: 0 0 6px 0;
          }
          .sample-metric {
            font-size: 42px;
            font-weight: 600;
            letter-spacing: -0.03em;
            line-height: 1;
            margin: 0 0 12px 0;
          }
          .sample-body {
            font-size: 13px;
            line-height: 1.5;
            color: #747B87;
            font-weight: 400;
          }
          .sample-footer {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #ECEEF1;
            display: flex;
            justify-content: space-between;
          }
          .sample-footer-col span:first-child {
            display: block;
            font-size: 11px;
            color: #747B87;
          }
          .sample-footer-col span:last-child {
            display: block;
            font-size: 15px;
            font-weight: 600;
            color: #191C24;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 6px 0;">Typography Candidate Benchmark for SpendHub Fidelity</h2>
          <p style="font-size: 13px; color: #747B87; margin: 0;">Comparing Inter vs Geist vs Plus Jakarta Sans at exact target sizes</p>
        </div>
        <div class="grid">
          <!-- Inter -->
          <div class="font-col inter">
            <div class="font-title">Candidate 1: Inter</div>
            <h1 class="sample-h1">Dashboard</h1>
            <p class="sample-sub">Welcome back! Here's what's happening with your company spending</p>
            <h3 class="sample-label">Available Balance</h3>
            <div class="sample-metric">$187,600</div>
            <p class="sample-body">Potential savings by switching to annual billing on 3 subscriptions. Switch to annual plans on Slack and Figma.</p>
            <div class="sample-footer">
              <div class="sample-footer-col">
                <span>Total Income</span>
                <span>$847,200</span>
              </div>
              <div class="sample-footer-col">
                <span>Total Expenses</span>
                <span>$512,400</span>
              </div>
            </div>
          </div>

          <!-- Geist -->
          <div class="font-col geist">
            <div class="font-title">Candidate 2: Geist</div>
            <h1 class="sample-h1">Dashboard</h1>
            <p class="sample-sub">Welcome back! Here's what's happening with your company spending</p>
            <h3 class="sample-label">Available Balance</h3>
            <div class="sample-metric">$187,600</div>
            <p class="sample-body">Potential savings by switching to annual billing on 3 subscriptions. Switch to annual plans on Slack and Figma.</p>
            <div class="sample-footer">
              <div class="sample-footer-col">
                <span>Total Income</span>
                <span>$847,200</span>
              </div>
              <div class="sample-footer-col">
                <span>Total Expenses</span>
                <span>$512,400</span>
              </div>
            </div>
          </div>

          <!-- Plus Jakarta Sans -->
          <div class="font-col jakarta">
            <div class="font-title">Candidate 3: Plus Jakarta Sans</div>
            <h1 class="sample-h1">Dashboard</h1>
            <p class="sample-sub">Welcome back! Here's what's happening with your company spending</p>
            <h3 class="sample-label">Available Balance</h3>
            <div class="sample-metric">$187,600</div>
            <p class="sample-body">Potential savings by switching to annual billing on 3 subscriptions. Switch to annual plans on Slack and Figma.</p>
            <div class="sample-footer">
              <div class="sample-footer-col">
                <span>Total Income</span>
                <span>$847,200</span>
              </div>
              <div class="sample-footer-col">
                <span>Total Expenses</span>
                <span>$512,400</span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(2000);

  const outPath = path.resolve("screenshots/typography_benchmark.png");
  await page.screenshot({ path: outPath });
  console.log("Typography benchmark saved to:", outPath);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
