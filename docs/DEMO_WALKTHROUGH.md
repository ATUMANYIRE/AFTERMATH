# AFTERMATH — Click-by-Click Demo Walkthrough

Prerequisite: the app is running from `COMPLETE_TESTING_GUIDE.md` §2 on a **fresh demo database** (frontend `http://localhost:3010`, backend `http://localhost:8010`).
Numbers below were obtained from a fresh database on 2026-10-25 (API level) and from earlier browser runs (UI level). Any number that differs ⇒ see "How to recognise a failure".

**Data-type key** — **PERSISTED** = real rows in SQLite · **SIM** = deterministic simulation (same inputs ⇒ same output) · **FIXTURE** = hard-coded/seeded demo data · **REAL-EXEC** = real code executed (pytest).

Sidebar (left, always visible): Overview · Time Machine · Investigation · Remediation Studio · Release Control · Agent Activity; bottom: "Current release rel-2026-001", "API docs", "GitLab repo". Press `/` to focus Search.

---

## Part 1 — Overview (`/`)
**Path:** sidebar → **Overview**.
**APIs:** `GET /api/v1/overview` (registry) and `GET /api/v1/release-control/rel-2026-001/superposition` (all the money numbers and the chart). **Data: FIXTURE** (the 5-scenario matrix is hard-coded).

1. Read the first card **Simulated financial exposure — `$1,500`**, "12 simulated duplicate charges" (vulnerable) vs "0 …" (repaired). Meaning: the sum of five modelled failure scenarios ($480+$600+$240+$120+$60). It is **not** real money and the card says "No real customer was charged. Source: Release Control scenario matrix (not Time Machine runs)."
2. Card **Repair verified — `$0` simulated exposure after repair**, with the recommendation sentence.
3. **Release consequences** chart: five orange bars — *Lost response $480, Race window $600, Key replay $240, DB lag $120, Network drop $60*. Click a bar: the line below changes to that scenario ("N simulated duplicate charges … → 0 after repair").
4. **Operational Release Registry**: two rows, `v2.4.0-rc.3` (status *Blocked*) and `v2.3.9-hotfix.1` (*Verified safe*). Hover a truncated cell to see the full text. Buttons per row: **Time Machine**, **Review**.
5. Top right **Run Experiment** → goes to Time Machine.
**Failure signs:** "Unable to Connect to AFTERMATH Engine" card; `$0` everywhere with no bars (backend not seeded/reachable).
**Capture:** full page at 1366×768.

---

## Part 2 — Release Time Machine (`/time-machine`)
**Path:** sidebar → **Time Machine** (or Overview → **Run Experiment**).
**APIs:** page load `GET /api/v1/time-machine/compare/rel-2026-001`; **Execute Experiment Pair** `POST /api/v1/experiments/run-pair`; Ledger tab `GET /api/v1/experiments/{id}/ledger`.

### 2A. Before you click anything (seeded view — FIXTURE)
- Status strip: "Completed · Source: recorded experiment runs. Scenario: Lost Payment Response Followed by Client Retry · Seed 42 · 450 transactions per run · `exp-vuln-001 · exp-rep-001`".
- Cards: **INV-PAY-001 Violations 27 found**, **At-Risk Exposure Delta $1,240.00**, **P95 Latency Reduction 414ms (7.0x faster)**, **Anomalies Eliminated All**.
- *Customer Ledger Transactions* tab shows summary tiles (450 requests, 27 duplicates…) and the note "No per-transaction rows are stored for this recorded run." That is expected for the seeded pair.

### 2B. Run the vulnerable-vs-repaired experiment (SIM + PERSISTED)
1. Under **Fault Injection Scenario** leave **Lost Response** selected (other tabs: Race Window, Key Replay, DB Lag, Network Drop). Leave **Workers** 5 and **Retries** 2x.
2. Click **Execute Experiment Pair**. The button says "Executing…" for about a second.
3. Expected: status "Completed", `exp-vuln-xxxxxxxx · exp-rep-xxxxxxxx` (new ids), "Seed 42", "30 transactions per run".
4. Cards (deterministic): **10 found** violations, **$1,500.00** exposure delta ("Simulated, not real charges"), unpatched risk $1,500.00 vs repaired $0.00. **P95 Latency Reduction shows `0ms`/`1.0x faster`** (both runs report 58 ms) — do not claim a latency improvement.
   Meaning: 10 orders each got charged 3 times in the vulnerable run (1 legitimate + 2 duplicates → 20 extra charges = $1,500), and zero in the repaired run.
5. **Synchronized Execution Timelines** tab: two columns, *Vulnerable Release (Before repair)* and *Repaired Release (After repair)*; each shows the first 8 events, button **Show all N events**. Click **Details** on any card to see service, level, latency, and the JSON payload.
   - Drag the **Timeline scrubber** left: events after that millisecond disappear (both columns). Click the reset arrow to return.
   - **Filter**: All / Anomalies / Success. "Anomalies" leaves the vulnerable column's *Double debit anomaly* cards.
6. On an anomaly card click **Ledger evidence →** (or the **Customer Ledger Transactions** tab). Expected: *Unpatched Ledger (Multiple Debits)* — tiles Records 30, Settled once 10, **Duplicate charges 20**, Retries deduplicated 0; rows tagged "Settled once" (10) and orange **Duplicate charge** (20). *Repaired Ledger (Exactly-Once Invariant)* — Duplicate charges **0**, **Retries deduplicated 20** (grey), Settled once 10.
   Meaning: the repaired run still received the retries, but did not charge again. **Data: PERSISTED rows produced by the SIM.**
7. Try a second scenario (e.g. **Network Drop**) → **Execute Experiment Pair**; the "Source… Scenario:" text and numbers change. If you select a scenario but have not executed, a line reads "The results below are from … Execute the pair to see …".
**Failure signs:** red "Experiment failed: …" line; numbers not matching step 4 with the default inputs; ids unchanged after executing.
**Capture:** the cards + status strip, the two timelines, the ledger tab.

---

## Part 3 — Investigation (`/investigation`)
**Path:** sidebar → **Investigation**. **APIs:** `GET /api/v1/investigation/rel-2026-001/causal-graph?variant=…`, `/blast-radius`, `/counterfactual`, `POST …/trace-path`. **Data: FIXTURE graph + REAL search** (the graph is a fixed baseline, not derived from your runs or from the git diff).

1. Cards: **Total Causal Nodes 11**, **Dependency Edges 8**, **Financial Blast Radius $1,500.00**, **Connection Starvation 1,600ms**.
2. Click **Trace Duplicate Debit Causal Path** (top right). A bar "Active Causal Path: Code Change → Duplicate Debit Consequence (4 Steps)" appears with steps: *Git Commit a8f9c21b (Async Fan-Out)* → *Missing Distributed Idempotency Barrier* → *Synthetic Payment Gateway* → *Duplicate Debit & Financial Exposure ($1,500.00)*, plus a "Causal Explanation". The graph frames those nodes and the path edges turn orange. **Reset Trace** / **Reset Path Highlight** clears it.
3. Click any step chip or any node: the right **Contextual Inspector** shows description, Provenance Type/Ref, **Evidence details** (key/value facts such as file, lines changed, exposure). Buttons: **Proceed to Remediation Studio**, **Inspect Consequence in Time Machine**.
4. Graph controls (top right of the canvas): zoom −/+, **Fit graph** (whole graph, small), **Reset view** (readable zoom). Drag to pan, scroll to zoom. **Hide inspector / Show inspector** gives the graph the full width.
5. Variant tabs: **Vulnerable (Unpatched)**, **Repaired**, **Both (Superposition)** — repaired shows the failure node neutralised.
6. Scroll to **Empirical Blast Radius Breakdown**: three rows (`payment-service`, `ledger-db (PostgreSQL 16)`, `checkout-worker`), "Total Risk: $1,500.00". **FIXTURE.**
**Failure signs:** no nodes; trace says no path; inspector empty after a click.
**Capture:** traced graph + inspector.

---

## Part 4 — Remediation Studio (`/remediation`)
**Path:** sidebar → **Remediation Studio**. **APIs:** `GET /api/v1/remediations/workflows?release_id=rel-2026-001` (polled every 5 s), `POST …/trigger`, `POST …/workflows/{id}/validate`, `POST …/approve`, `POST …/reject`.
Fresh database: active workflow **`rem-wf-001`**, status `PATCH_PROPOSED`, approval `PENDING`.

1. Top: lifecycle stepper (Defect Detected … Approved & Merged), cards **Workflow Status**, **Target Service File processor.py**, **Sandbox Safety Score** ("Not run"), **Human Sign-off PENDING**. Banner: **Awaiting human approval** (orange) with **Go to sign-off**.
2. Tab **GNU Unified Patch Diff**: file header (`services/payment_worker/processor.py`, `+72 −41`, sha256 prefix), line numbers, green additions/orange deletions, grey **Show N unchanged lines** buttons that expand collapsed context. Scroll sideways only inside the code. **Data: REAL diff** of the repository file against a *canned reference patch*.
3. Click **Execute Sandbox Verification** (≈5 s, button shows "Executing Sandbox…"). Open tab **Sandbox Execution Proof**:
   - **Unpatched Target Execution (Failure Proof)** — *Failed · exit 1*, Passed 2 / Failed 1, test `test_concurrent_retries_invariant` failed, note about INV-PAY-001 violation. **Show raw output** reveals the real pytest log.
   - **Patched Target Execution (Invariant Restored)** — *Passed · exit 0*, Passed 3 / Failed 0.
   - **REAL-EXEC** (real pytest in a temp copy of `services/`; 15 s limit). Cards update: **Sandbox Safety Score "3 of 3 pass"**; workflow status **AWAITING_APPROVAL**.
4. Tab **Agent Tool Provenance**: the tool-call audit trail. Provider shows "Local reference remediation engine (emulated)" — **not** GitLab Duo.
5. Scroll to **Supervised Human Gatekeeper Sign-off** (or click **Go to sign-off**). Defaults: *Lead Engineer Name* "Lead Release Engineer", *Official Email* lead-sre@company.com, *Approval Sign-off Rationale*. Edit the rationale to something truthful.
6. Click **Sign Off & Approve for Staging**. Expected: banner **Approved by a human engineer**, status **COMPLETED**, Human Sign-off **APPROVED**, record shows approver and time.
   - ⚠ **Do not click Reject Patch in the demo**: it rejects immediately with a fixed reason ("Manual rejection during gate evaluation") and the workflow cannot be re-opened (use **Trigger New Fix Workflow** to start another).
   - The approve button is refused by the server unless verification ran first (HTTP 400) — you can mention this as "approval is enforced server-side".
**Failure signs:** Sandbox tab says "No sandbox run recorded"; verification returns an error; unpatched run shows *Passed* (then the repository `processor.py` was already fixed — diff would be empty).
**Capture:** diff, both test panels, approved banner.

---

## Part 5 — Release Control (`/release-control`)
**Path:** sidebar → **Release Control**. **APIs:** `GET /api/v1/release-control/rel-2026-001`, `…/superposition`, `POST …/gates/{gate_id}/action`.

1. Top card: **CONDITIONAL APPROVAL**, "Candidate Approved for Staging with Remediated Patch (rem-wf-001)", "Empirical confidence 98.4%". **FIXTURE text**: it does not change with your actions — say so if asked.
2. Cards: Financial Exposure Delta $1,500.00, INV-PAY-001 Breaches 12 prevented, Services Protected 3, **Policy Gates Passed 3 of 4**, "Human Gate: Pending Sign-off".
3. Tab **5-Scenario Consequence Superposition Grid**: five rows with FAIL (vulnerable) vs PASS (repaired). Note under the tabs: "Source: simulated scenario matrix … separate from the Time Machine experiment runs … so the figures can differ." **Replay** just opens the Time Machine (it does not re-run that scenario).
4. Tab **DevSecOps Policy Gates**: gates 1–3 (Synthetic Payment Idempotency Verification, Database Connection Starvation Threshold, Latency SLA Under Retry Storm) are approved by "gate bot" seeds; gate 4 **Lead Principal Engineer Production Sign-off** shows **Sign Off Gate**.
5. Click **Sign Off Gate** → dialog "Sign Off Gate: Lead Principal Engineer…". Enter name/email and rationale. **Authorize Gate Approval** (or **Reject Gate**). Expected: gate shows "Approved by …", **Policy Gates Passed 4 of 4**, overall status `approved_for_staging`, and a new entry in the audit list.
   - **PERSISTED** approval + audit event. This is *separate* from the Remediation approval (approving a patch does not sign this gate, and vice versa).
**Failure signs:** gate stays pending after authorising; 403 (non-local request).
**Capture:** gates before/after, audit entry.

---

## Part 6 — Agent Activity (`/agent-activity`)
**Path:** sidebar → **Agent Activity**. **API:** `GET /api/v1/agent-activity`. **Data: FIXTURE** (+ live connection check).

1. **GitLab Duo connection: Not connected** with project `atumanyire-labs/aftermath`, Active runs 0, Completed "0 authenticated". **How to connect GitLab Duo** expands the setup steps. This is the honest state of the *app's* integration.
2. **GitLab Duo execution history**: "No authenticated GitLab Duo executions yet."
3. **Local benchmark activity (2)**: *Remediation Engineer* and *Consequence Auditor*, each tagged **Local benchmark** (recorded fixtures, "not runs on GitLab Duo"). **Show details** reveals flow name, session id, prompt.
4. **Agent specifications**: `consequence-auditor` (4 tools) and `remediation-engineer` (3 tools); click one, then open **Raw flow YAML** (collapsed by default) to read the file.
5. ⚠ **Trigger Benchmark Flow** adds a canned third record (fixed summary text, generated `duo_…` id). It executes nothing. Skip it, or say so out loud.
**Where genuine GitLab Duo participation is shown:** outside the app — the GitLab-side "Release Evidence Analyst" flow session and the CI pipeline page. Their URLs are **not in the repository**; you must open and copy them (see the video script). The app itself must not be presented as having run Duo.

---

## Part 7 — One realistic end-to-end scenario
Story: *"A release changed the checkout worker. Under network retries, customers can be double-charged."*

| # | Step | Where | Expected | Interpretation | Next |
|---|---|---|---|---|---|
| 1 | Identify the vulnerable release | Overview registry: `v2.4.0-rc.3` / `rel-2026-001`, **Blocked** | row + $1,500 simulated exposure | the candidate is held because the rehearsal predicts harm | Run Experiment |
| 2 | Run the vulnerable simulation | Time Machine → Execute Experiment Pair | new `exp-vuln-…`, status Completed | scripted, seeded rehearsal of 10 orders with retries | read the cards |
| 3 | Observe duplicate charges | cards + vulnerable column | 10 violations, $1,500.00 | 10 orders breached "one charge per purchase" | open ledger |
| 4 | Inspect ledger + traces | Ledger tab / Details | 20 "Duplicate charge" rows; anomaly events with `idempotency_key` | the duplicates are persisted ledger rows, not just text | repaired run |
| 5 | Repaired run, same inputs | same page, right column | same seed 42, same scenario, 0 duplicate charges, 20 "Retry deduplicated" | the fix absorbs the retries | compare |
| 6 | Compare | both columns | $1,500.00 vs $0.00 | difference = prevented simulated loss | Investigation |
| 7 | Causal graph | Investigation → Trace | 4-step path | explains *why* (missing lock after a code change) — fixture graph | blast radius |
| 8 | Blast radius | table at bottom | 3 services, $1,500 | scope of impact (fixture) | Remediation |
| 9 | Proposed remediation | Remediation → Patch Diff | +72/−41 diff | canned reference fix against real file | verify |
| 10 | Failing-before / passing-after | Execute Sandbox Verification | exit 1 (1 failed) vs exit 0 (3 passed) | real pytest, real code | approve |
| 11 | Review patch | diff + raw output | — | human reads evidence | sign off |
| 12 | Human approval | Sign Off & Approve for Staging | Approved banner, COMPLETED | server refuses approval without verification | Release Control |
| 13 | Release decision | Release Control → Sign Off Gate | 3/4 → 4/4, `approved_for_staging` | policy gate state machine; separate human gate | Agent Activity |
| 14 | Agent activity | Agent Activity | Not connected; Local benchmark labels | honest integration status | GitLab |
| 15 | Connect evidence to CI | GitLab → Pipelines → #2986438087 | green; jobs listed | CI builds & tests the code (43 tests); `simulation:time_machine` and `release:control_gates` are placeholders | open the Duo flow session URL (user-supplied) |

Not supported by the UI: running Duo from the app; editing the patch; re-opening a rejected patch; per-transaction ledger rows for the seeded pair. API alternatives: `POST /api/v1/experiments/run-pair`, `GET /api/v1/experiments/{id}/ledger`, `POST /api/v1/remediations/trigger` (Swagger at `http://localhost:8010/docs`).

**Verification status of this walkthrough:** the numbers were confirmed by running every API step against a fresh seeded database (2026-10-25) and by the earlier scripted browser journey (Overview → … → Agent Activity, 1366×768 and 390×844, no console or network errors). **A human has not yet performed the Release Control gate sign-off through the UI on a fresh database**; do the full rehearsal once before recording.
