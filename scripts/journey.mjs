// Full user-journey check: Overview -> Time Machine -> Investigation -> Remediation -> Release Control -> Agent Activity.
// Usage: node scripts/journey.mjs <width> <height> [baseUrl]
import { chromium } from "@playwright/test";

const [w = "1366", h = "768", base = "http://localhost:3010"] = process.argv.slice(2);
const W = Number(w), H = Number(h);
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: W, height: H } });

const problems = [];
page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 200)}`); });
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
page.on("requestfailed", (r) => problems.push(`requestfailed: ${r.method()} ${r.url()} ${r.failure()?.errorText}`));
page.on("response", (r) => { if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`); });

const shot = (name) => page.screenshot({ path: `screenshots/v4_${name}_${W}.png`, fullPage: true });
const step = async (name, fn) => {
  try { await fn(); console.log("ok  ", name); }
  catch (e) { console.log(JSON.stringify(e.message).slice(0, 700)); problems.push(`STEP FAILED ${name}: ${String(e.message).split("\n")[0]}`); console.log("FAIL", name, String(e.message).split("\n")[0]); }
};
const overflow = async (label) => {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  if (o.sw > o.iw + 1) {
    const who = await page.evaluate(() => {
      const iw = window.innerWidth, out = [];
      for (const el of document.querySelectorAll("body *")) {
        const rc = el.getBoundingClientRect();
        if (rc.right > iw + 1 && rc.width > 0) {
          let a = el.parentElement, scroll = false;
          while (a && a !== document.body) { const ox = getComputedStyle(a).overflowX; if (ox === "auto" || ox === "scroll" || ox === "hidden") { scroll = true; break; } a = a.parentElement; }
          if (!scroll) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} "${(el.textContent || "").trim().slice(0, 25)}"`);
        }
      }
      return out.slice(0, 3).join(" | ");
    });
    problems.push(`horizontal page overflow on ${label}: ${o.sw} > ${o.iw} :: ${who}`);
  }
};
// Open the mobile drawer when the sidebar is hidden.
const nav = async (label) => {
  if (W < 768) {
    await page.locator('header[class*="md:hidden"] button').click();
    await page.locator(`a:has-text("${label}"):visible`).first().click();
  } else {
    await page.locator(`aside a:has-text("${label}")`).click();
  }
};

await step("overview", async () => {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByText("Release consequences").waitFor();
  await shot("1_overview");
  await overflow("overview");
});

await step("overview -> run experiment", async () => {
  await page.getByRole("link", { name: "Run Experiment" }).click();
  await page.waitForURL("**/time-machine");
});

await step("time machine: execute pair", async () => {
  await page.getByRole("button", { name: /Execute Experiment Pair/ }).click();
  await page.getByRole("button", { name: /Executing/ }).waitFor({ timeout: 3000 }).catch(() => {});
  await page.getByRole("button", { name: /Execute Experiment Pair/ }).waitFor({ timeout: 90000 });
  await page.waitForTimeout(500);
  await shot("2_time_machine");
  await overflow("time machine");
});

await step("time machine: compare timelines (expand details)", async () => {
  await page.getByRole("button", { name: "Details" }).first().click();
  await page.locator("text=Timeline Scrubber:").waitFor();
  await page.locator("text=Vulnerable Release").first().waitFor();
  await page.locator("text=Repaired Release").first().waitFor();
  await shot("2b_timelines_expanded");
});

await step("time machine: inspect ledger", async () => {
  await page.getByRole("button", { name: /Customer Ledger Transactions/ }).click();
  await page.locator("text=Unpatched Ledger (Multiple Debits)").waitFor();
  await shot("3_ledger");
  await overflow("ledger");
});

await step("investigation: trace causal path", async () => {
  await nav("Investigation");
  await page.getByRole("button", { name: /Trace Duplicate Debit Causal Path/ }).waitFor();
  await page.waitForTimeout(800);
  await shot("4_investigation_initial");
  await page.getByRole("button", { name: /Trace Duplicate Debit Causal Path/ }).click();
  await page.locator("text=Active Causal Path").waitFor();
  await page.waitForTimeout(900);
  await shot("4b_investigation_traced");
  await overflow("investigation");
});

await step("investigation: node click opens evidence + view controls", async () => {
  // Mobile viewports frame the traced path, so the first node can sit outside the pane; dispatch the click.
  await page.locator(".react-flow__node").first().dispatchEvent("click");
  await page.locator("text=Evidence details").first().waitFor({ timeout: 5000 });
  await page.getByRole("button", { name: "Fit graph" }).click();
  await page.waitForTimeout(400);
  await shot("4c_investigation_fit");
  await page.getByRole("button", { name: "Reset view" }).click();
  await page.waitForTimeout(400);
  const z = await page.evaluate(() => {
    const t = getComputedStyle(document.querySelector(".react-flow__viewport")).transform;
    return new DOMMatrix(t).a;
  });
  if (z < 0.6) problems.push(`graph zoom after reset is too small: ${z.toFixed(2)}`);
  await page.getByRole("button", { name: /Hide inspector/ }).click();
  await page.waitForTimeout(300);
  await shot("4d_investigation_inspector_hidden");
  await page.getByRole("button", { name: /Show inspector/ }).click();
});

await step("remediation: inspect diff", async () => {
  await nav("Remediation");
  await page.locator("text=GNU Unified Patch Diff").first().waitFor();
  await page.waitForTimeout(500);
  await shot("5_remediation_diff");
  await overflow("remediation");
});

await step("remediation: verify patch (sandbox)", async () => {
  await page.getByRole("button", { name: /Execute Sandbox Verification/ }).click();
  await page.getByRole("button", { name: /Execute Sandbox Verification/ }).waitFor({ timeout: 90000 });
  await page.getByRole("button", { name: /Sandbox Execution Proof/ }).click();
  await page.locator("text=Unpatched Target Execution (Failure Proof)").waitFor();
  await page.locator("text=Patched Target Execution (Invariant Restored)").waitFor();
  await shot("6_remediation_sandbox");
});

await step("remediation: approval", async () => {
  const approve = page.getByRole("button", { name: /Sign Off & Approve for Staging/ });
  if (await approve.count()) {
    await approve.click();
    await page.locator("text=Approved by a human engineer").waitFor({ timeout: 15000 });
  }
  await shot("7_remediation_approved");
});

await step("release control", async () => {
  await nav("Release Control");
  await page.locator("text=5-Scenario Consequence Superposition Grid").waitFor();
  await page.getByRole("button", { name: /DevSecOps Policy Gates/ }).click();
  await page.waitForTimeout(400);
  await shot("8_release_control_gates");
  await page.getByRole("button", { name: /5-Scenario/ }).click();
  await shot("8b_release_control");
  await overflow("release control");
});

await step("agent activity", async () => {
  await nav("Agent Activity");
  await page.locator("text=GitLab Duo connection").waitFor();
  await shot("9_agent_activity");
  await page.locator("summary:has-text('Raw flow YAML')").click();
  await page.waitForTimeout(200);
  await shot("9b_agent_yaml");
  await overflow("agent activity");
});

console.log(problems.length ? "\nPROBLEMS:\n" + [...new Set(problems)].join("\n") : "\nNo problems found.");
await browser.close();
