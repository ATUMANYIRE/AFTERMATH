# AFTERMATH — Live Demo Walkthrough & Operator Script

**Product:** AFTERMATH — The Release Time Machine  
**Tagline:** Every release has consequences. See them before production.  
**Hackathon:** GitLab Life After Code Hackathon (Deadline: October 27, 2026)  
**Demo Duration:** 3–5 Minutes  
**Target Audience:** Hackathon Judges, Reliability Engineers, DevSecOps Leads  

---

## Preparation & Prerequisites

Before starting the demo recording or live presentation, ensure both local daemons are active:
1. **Frontend:** Open [http://localhost:3000](http://localhost:3000) in your browser.
2. **Backend API:** Verify [http://localhost:8000/healthz](http://localhost:8000/healthz) returns `{"status":"ok",...}`.
3. **Interactive Swagger Docs:** Accessible at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Step 1: The Executive Cockpit & The Consequence Premise

- **URL:** [http://localhost:3000/](http://localhost:3000/)
- **Visual Focus:** The warm-white dashboard showing release status, consequence preview cards, and navigation links.
- **Operator Action:**
  1. Point out the hero banner: *"Every release has consequences. See them before production."*
  2. Highlight the active target release: `rel-2026-001 (feat/distributed-checkout-pipeline)` authored by commit `a8f9c21b4d08`.
  3. Note the key risk indicators: **$1,500.00 Financial Exposure**, **PostgreSQL Connection Starvation**, and **12 Duplicate Debits**.
- **Talking Point:**
  > *"Traditional CI/CD tells you if your unit tests pass. It cannot tell you what happens when your code meets concurrency, network drops, and database pool contention in the real world. AFTERMATH is the Release Time Machine: it runs empirical consequence experiments against pending release diffs to reveal downstream failures before staging or production."*

---

## Step 2: Consequence Laboratory (Empirical Timeline Comparison)

- **URL:** [http://localhost:3000/time-machine](http://localhost:3000/time-machine) *(or `/experiments`)*
- **Visual Focus:** Side-by-side synchronized execution timelines (Vulnerable Release vs Repaired Release).
- **Operator Action:**
  1. Under **Consequence Fault Injection**, select Scenario 2: *"Multiple Concurrent Checkout Requests (Race Window)"*.
  2. Click the primary button: **`Execute Experiment Pair`**.
  3. Observe the button state transition: `Executing Experiment Pair...` (approximately 3–4 seconds).
  4. Notice the refreshed execution metrics:
     - **Vulnerable Variant:** 5 concurrent checkouts resulting in 4 duplicate charges, P95 latency 184ms, Invariant `INV-PAY-001` violated.
     - **Repaired Variant:** 5 concurrent attempts atomically deduplicated to 1 charge, 0 duplicate charges, Invariant preserved.
  5. Click the tab: **`Customer Ledger Transactions`**.
  6. Point out the real persisted transaction IDs in the ledger table showing multiple settled debits for `ord_concurrent_99` on the vulnerable release.
- **Talking Point:**
  > *"Here in the Consequence Laboratory, we execute real concurrent payment workloads against both the vulnerable code and the proposed repair. Notice that under concurrent retry storms, the unpatched release double-debits the customer four times, violating our core financial safety invariant. The repaired release serializes the attempts and deduplicates them atomically."*

---

## Step 3: Causal Graph & Blast Radius Analysis

- **URL:** [http://localhost:3000/investigation](http://localhost:3000/investigation)
- **Visual Focus:** The directed acyclic causal graph with 11 nodes, 8 edges, and the Blast Radius impact breakdown.
- **Operator Action:**
  1. Click the primary button: **`Trace Duplicate Debit Causal Path`**.
  2. Watch the causal chain illuminate from root cause to business impact:
     - `node-ast-001`: Unprotected Async Gap in `services/payment_worker/processor.py`
     - `node-concur-001`: Gateway Latency Sleep (120ms) Concurrency Window
     - `node-inv-001`: Violation of Invariant INV-PAY-001 (Double Debit)
     - `node-pool-001`: PostgreSQL Connection Pool Exhaustion (342 Queued Waiters)
     - `node-fin-001`: $1,500.00 Financial Risk Exposure
  3. Scroll down to the **Quantified Blast Radius** table showing cascading impacts across `payment-service`, `ledger-db`, and `checkout-worker`.
- **Talking Point:**
  > *"AFTERMATH connects code changes to real-world consequences using causal inference. The platform proves that a 4-line missing lock in the payment processor doesn't just fail a local function—it triggers an unbounded retry storm that starves the PostgreSQL connection pool within 1.6 seconds and risks $1,500 in customer chargebacks."*

---

## Step 4: Autonomous Remediation Studio & Sandbox Proof

- **URL:** [http://localhost:3000/remediation](http://localhost:3000/remediation)
- **Visual Focus:** The GNU unified diff editor, safety scoring radar, and sandboxed test execution console.
- **Operator Action:**
  1. Inspect the generated diff on `services/payment_worker/processor.py`.
  2. Highlight the atomic reservation lock:
     - Injects `asyncio.Lock` barrier.
     - Registers in-flight idempotency key events to serialize concurrent requests.
  3. Click the tab: **`Sandbox Execution Proof`**.
  4. Point out the real captured test execution:
     - **Unpatched Target:** `test_concurrent_retries_invariant` FAILED with `assert 5 == 1 (Order debited 5 times)`.
     - **Patched Target:** All 3 tests PASSED in 0.68 seconds with exit code 0.
  5. Note the safety evaluation score: **98.4% (Low Risk)** with zero shell or subprocess hazards.
- **Talking Point:**
  > *"The remediation workflow doesn't just generate a patch—it proves that the patch works. Our isolated sandbox executes real test suites against both the unpatched and patched code. We see empirical proof that the race condition is eliminated before any code is merged."*

---

## Step 5: Supervised Human Gatekeeper Sign-off

- **URL:** [http://localhost:3000/remediation](http://localhost:3000/remediation)
- **Visual Focus:** Human sign-off card at the bottom of the Remediation Studio.
- **Operator Action:**
  1. Under **Human Sign-off & Gatekeeper Approval**, select: **`Approve for Staging Deployment`**.
  2. In the rationale field, enter: *"Verified atomic reservation lock eliminates INV-PAY-001 race condition with zero latency regressions."*
  3. Click **`Submit Formal Approval`**.
  4. Notice the status indicator update to `APPROVED (Signed off by Lead Engineer)`.
  5. An immutable `AuditEvent` is cryptographically appended to the database log.
- **Talking Point:**
  > *"In DevSecOps, AI agents must be supervised. AFTERMATH enforces strict human-in-the-loop governance. No patch is integrated or promoted without explicit human sign-off backed by reproducible sandbox evidence."*

---

## Step 6: Release Superposition Matrix

- **URL:** [http://localhost:3000/release-control](http://localhost:3000/release-control)
- **Visual Focus:** The 5-Scenario Superposition Grid comparing vulnerable vs repaired variants across all fault scenarios.
- **Operator Action:**
  1. Review the 5 scenarios side by side:
     - Scenario 1: Lost Response & Client Retry
     - Scenario 2: Concurrent Checkouts (Race Window)
     - Scenario 3: Repeated Idempotency Key Across Orders
     - Scenario 4: Delayed Database Commit
     - Scenario 5: Gateway 502 Bad Gateway Chaos
  2. Point out the **Blast Radius Mitigation Delta**:
     - Financial Exposure: `$1,500.00 -> $0.00` (100% Risk Mitigated)
     - Invariant Violations: `12 -> 0`
     - Downstream Degraded Services: `3 -> 0`
  3. Click the tab: **`DevSecOps Policy Gates`** showing all 4 gates green (Code Invariant, DB Starvation, Latency SLA, Human Sign-off).
- **Talking Point:**
  > *"Finally, the Release Superposition Matrix allows engineering leaders to view both release timelines simultaneously. We see exactly how the repaired code behaves across all 5 fault vectors, confirming complete mitigation before authorizing production rollout."*

---

## Step 7: GitLab Duo Agent Trace & Transparency

- **URL:** [http://localhost:3000/agent-activity](http://localhost:3000/agent-activity)
- **Visual Focus:** Agent interaction logs and declarative GitLab Flow Registry v1 specifications.
- **Operator Action:**
  1. Review the tool execution records for `GitLab Duo Consequence Auditor` and `GitLab Duo Remediation Engineer`.
  2. Point out the badge: `(Demo Benchmark Fixture - Unauthenticated)`.
  3. Explain that all Flow Registry v1 specifications are committed in `.gitlab/duo/` (`consequence-auditor.yaml` and `remediation-engineer.yaml`).
- **Talking Point:**
  > *"We believe in radical engineering honesty. All Duo Flow specifications are authored and ready for the GitLab Agent Platform. Because external SMS identity verification is currently pending on the repository owner's account, all demo traces are honestly labeled as benchmark fixtures. Zero fake SaaS sessions or mock tokens were used."*
