import { chromium } from "playwright";
import fs from "fs";

// Three geometric interpretations inspired by reference_logo_crop.png
// Variation A: Exact hexagonal origami fold with central forward negative arrow
const varA = `
<svg width="64" height="64" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gA-top" x1="6" y1="4" x2="36" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF933B" />
      <stop offset="60%" stop-color="#FF6D1B" />
      <stop offset="100%" stop-color="#F2510A" />
    </linearGradient>
    <linearGradient id="gA-bottom" x1="4" y1="18" x2="36" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FA4E14" />
      <stop offset="100%" stop-color="#BF3000" />
    </linearGradient>
  </defs>
  <!-- Main faceted body with central negative chevron -->
  <!-- Upper wing -->
  <path d="M19.5 3.5C21.2 2.7 23.3 3.1 24.6 4.5L34.2 14.8C35.5 16.2 35.7 18.3 34.6 20.0L31.5 24.5C31.0 25.3 29.8 25.4 29.1 24.7L18.0 14.0C16.8 12.8 15.0 12.6 13.5 13.5L8.5 16.5C7.5 17.1 6.2 16.3 6.3 15.1L7.2 10.2C7.5 8.2 8.9 6.5 10.8 5.7L19.5 3.5Z" fill="url(#gA-top)"/>
  <!-- Lower wing -->
  <path d="M6.5 17.8C7.1 16.8 8.4 16.5 9.4 17.2L20.5 25.2C22.0 26.2 24.0 26.0 25.2 24.6L31.8 17.0C32.6 16.0 34.0 16.0 34.7 17.0L35.2 17.8C36.2 19.3 36.1 21.3 34.9 22.8L27.5 32.2C26.1 34.0 23.8 34.9 21.6 34.5L12.5 33.0C10.5 32.6 8.8 31.3 8.0 29.4L5.2 22.5C4.6 21.0 5.1 19.2 6.5 17.8Z" fill="url(#gA-bottom)"/>
</svg>
`;

// Variation B: Continuous hexagonal folded prism with sharp origami crease
const varB = `
<svg width="64" height="64" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gB-top" x1="4" y1="6" x2="34" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF9642" />
      <stop offset="60%" stop-color="#FF6B18" />
      <stop offset="100%" stop-color="#F24E05" />
    </linearGradient>
    <linearGradient id="gB-bottom" x1="6" y1="18" x2="34" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F74A10" />
      <stop offset="100%" stop-color="#C22F00" />
    </linearGradient>
    <linearGradient id="gB-sheen" x1="16" y1="4" x2="34" y2="18" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
  </defs>
  <!-- Hexagonal silhouette with rounded corners -->
  <!-- Top Facet (Upper Ribbon) -->
  <path d="M19.2 3.8C20.8 3.1 22.6 3.4 23.9 4.6L34.1 14.2C35.5 15.5 35.8 17.6 34.8 19.2L31.5 24.2C30.8 25.3 29.3 25.4 28.4 24.5L19.2 15.5C18.0 14.3 16.2 14.0 14.7 14.9L8.2 19.0C7.2 19.6 6.0 18.8 6.1 17.6L6.8 12.2C7.1 10.0 8.6 8.1 10.7 7.2L19.2 3.8Z" fill="url(#gB-top)" />
  <path d="M19.2 3.8L23.9 4.6L34.1 14.2C35.5 15.5 35.8 17.6 34.8 19.2L30.5 21.0L20.0 11.5L10.7 7.2L19.2 3.8Z" fill="url(#gB-sheen)" />
  <!-- Bottom Facet (Lower Fold) -->
  <path d="M6.2 19.2C6.9 18.1 8.3 17.8 9.4 18.5L18.8 24.8C20.2 25.8 22.1 25.6 23.3 24.3L31.2 16.0C32.1 15.0 33.7 15.1 34.4 16.2L34.8 16.8C35.8 18.3 35.6 20.3 34.4 21.7L27.2 30.5C25.9 32.1 23.8 33.0 21.7 32.7L12.8 31.3C10.8 31.0 9.1 29.7 8.3 27.9L5.2 21.8C4.6 20.6 5.0 19.1 6.2 19.2Z" fill="url(#gB-bottom)" />
</svg>
`;

// Variation C: The AFTERMATH Consequence Fold (Hexagonal Time Prism with sharp negative space arrow)
const varC = `
<svg width="64" height="64" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gC-facet1" x1="5" y1="5" x2="35" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFA24A" />
      <stop offset="50%" stop-color="#FF701C" />
      <stop offset="100%" stop-color="#F2540C" />
    </linearGradient>
    <linearGradient id="gC-facet2" x1="5" y1="20" x2="35" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F04D10" />
      <stop offset="100%" stop-color="#BD2C00" />
    </linearGradient>
    <linearGradient id="gC-specular" x1="10" y1="4" x2="30" y2="14" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
  </defs>
  <!-- Outer Rounded Hexagon Background Base -->
  <!-- Upper Origami Ribbon -->
  <path d="M18.8 3.5C20.6 2.6 22.8 3.0 24.2 4.4L33.9 14.1C35.3 15.5 35.6 17.6 34.6 19.3L30.5 26.2C29.8 27.3 28.3 27.5 27.4 26.5L16.8 15.2C15.6 14.0 13.8 13.6 12.2 14.4L7.5 16.8C6.4 17.3 5.2 16.5 5.3 15.3L5.8 11.2C6.1 9.0 7.6 7.1 9.7 6.2L18.8 3.5Z" fill="url(#gC-facet1)"/>
  <path d="M18.8 3.5L24.2 4.4L33.9 14.1C35.3 15.5 35.6 17.6 34.6 19.3L28.0 20.0L18.0 10.0L9.7 6.2L18.8 3.5Z" fill="url(#gC-specular)"/>
  <!-- Lower Origami Ribbon -->
  <path d="M6.0 18.5C6.7 17.3 8.2 16.9 9.3 17.7L20.2 25.2C21.6 26.2 23.6 26.0 24.8 24.7L31.8 16.8C32.6 15.8 34.1 15.8 34.8 16.9L35.2 17.5C36.2 19.0 36.1 21.0 34.9 22.5L28.0 31.5C26.7 33.2 24.6 34.1 22.5 33.8L13.2 32.5C11.1 32.2 9.3 30.8 8.4 28.9L5.2 22.2C4.5 20.8 4.9 19.2 6.0 18.5Z" fill="url(#gC-facet2)"/>
</svg>
`;

async function run() {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 900, height: 400 } });
  const refBase64 = fs.readFileSync("screenshots/reference_logo_crop.png").toString("base64");
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="background:#FAFBFD; font-family:system-ui,-apple-system,sans-serif; padding:40px; margin:0;">
        <h2 style="color:#111827; margin-bottom:24px;">Logo Exploration vs Reference</h2>
        <div style="display:flex; align-items:center; gap:24px;">
          <!-- Reference Crop -->
          <div style="background:white; border-radius:20px; padding:24px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.04); border:1px solid #E5E7EB;">
            <div style="font-size:12px; font-weight:600; color:#6B7280; margin-bottom:12px;">TARGET REFERENCE</div>
            <img src="data:image/png;base64,${refBase64}" style="width:64px; height:64px; display:block; margin:0 auto;" />
            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:12px;">SpendHub</div>
          </div>

          <!-- Variation A -->
          <div style="background:white; border-radius:20px; padding:24px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.04); border:1px solid #E5E7EB;">
            <div style="font-size:12px; font-weight:600; color:#6B7280; margin-bottom:12px;">VARIATION A</div>
            ${varA}
            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:12px;">AFTERMATH</div>
          </div>

          <!-- Variation B -->
          <div style="background:white; border-radius:20px; padding:24px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.04); border:1px solid #E5E7EB;">
            <div style="font-size:12px; font-weight:600; color:#6B7280; margin-bottom:12px;">VARIATION B</div>
            ${varB}
            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:12px;">AFTERMATH</div>
          </div>

          <!-- Variation C -->
          <div style="background:white; border-radius:20px; padding:24px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.04); border:1px solid #E5E7EB;">
            <div style="font-size:12px; font-weight:600; color:#6B7280; margin-bottom:12px;">VARIATION C</div>
            ${varC}
            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:12px;">AFTERMATH</div>
          </div>
        </div>
      </body>
    </html>
  `);
  await page.screenshot({ path: "screenshots/logo_comparison_matrix.png" });
  await browser.close();
  console.log("Saved screenshots/logo_comparison_matrix.png");
}

run().catch(console.error);
